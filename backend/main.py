import os
import sys
import io
import json
import csv
from datetime import datetime
from typing import Optional, List, Dict, Any
import numpy as np

from fastapi import FastAPI, Depends, Query, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

# Add parent directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import get_db, init_db
from backend.models import (
    DataSource, District, MonitoringStation, Observation,
    ModelRegistry, PredictionLog, ImportLog
)
from backend.ml.classifier import predict_water_quality, FEATURE_RANGES, METADATA_PATH
from backend.anomaly import detect_parameter_anomalies
from backend.ml.cpcb_standards import determine_cpcb_class

# Initialize FastAPI application
app = FastAPI(
    title="Tamil Nadu Water Intelligence AI (TN-WaterAI) API",
    description="Production environmental intelligence, water quality monitoring, GIS analytics, and CPCB classification platform for Tamil Nadu, India.",
    version="1.0.0"
)

# Enable CORS for local Vite development and production hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class PredictionRequest(BaseModel):
    ph: Optional[float] = Field(None, ge=0.0, le=14.0, description="Potential of Hydrogen (pH units)")
    dissolved_oxygen: Optional[float] = Field(None, ge=0.0, le=30.0, description="Dissolved Oxygen (mg/L)")
    bod: Optional[float] = Field(None, ge=0.0, le=200.0, description="Biochemical Oxygen Demand (mg/L)")
    fecal_coliform: Optional[float] = Field(None, ge=0.0, description="Fecal Coliform (MPN/100mL)")
    total_coliform: Optional[float] = Field(None, ge=0.0, description="Total Coliform (MPN/100mL)")
    electrical_conductivity: Optional[float] = Field(None, ge=0.0, description="Electrical Conductivity (µS/cm)")
    turbidity: Optional[float] = Field(None, ge=0.0, description="Turbidity (NTU)")
    nitrate_n: Optional[float] = Field(None, ge=0.0, description="Nitrate Nitrogen (mgN/L)")
    ammonia_n: Optional[float] = Field(None, ge=0.0, description="Ammonia Nitrogen (mgN/L)")

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Tamil Nadu Water Intelligence AI (TN-WaterAI)",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/overview")
def get_overview(db: Session = Depends(get_db)):
    total_obs = db.query(Observation).count()
    unique_stations = db.query(MonitoringStation).count()
    districts_count = db.query(District).count()
    
    # Source categories
    source_cat_counts = (
        db.query(MonitoringStation.water_source_category, func.count(MonitoringStation.id))
        .group_by(MonitoringStation.water_source_category)
        .all()
    )
    water_sources = [{"category": k or "Unknown", "count": v} for k, v in source_cat_counts]

    # Date ranges
    date_range = db.query(
        func.min(Observation.acquisition_time),
        func.max(Observation.acquisition_time)
    ).first()

    # CPCB Class distribution
    cpcb_counts = (
        db.query(Observation.cpcb_class, func.count(Observation.id))
        .group_by(Observation.cpcb_class)
        .all()
    )
    cpcb_distribution = [{"class_name": k or "Unclassified", "count": v} for k, v in cpcb_counts]

    # Parameter availability counts
    param_counts = {
        "ph": db.query(Observation).filter(Observation.ph.isnot(None)).count(),
        "dissolved_oxygen": db.query(Observation).filter(Observation.dissolved_oxygen.isnot(None)).count(),
        "bod": db.query(Observation).filter(Observation.bod.isnot(None)).count(),
        "fecal_coliform": db.query(Observation).filter(Observation.fecal_coliform.isnot(None)).count(),
        "total_coliform": db.query(Observation).filter(Observation.total_coliform.isnot(None)).count(),
        "electrical_conductivity": db.query(Observation).filter(Observation.electrical_conductivity.isnot(None)).count(),
        "turbidity": db.query(Observation).filter(Observation.turbidity.isnot(None)).count(),
        "nitrate_n": db.query(Observation).filter(Observation.nitrate_n.isnot(None)).count(),
        "ammonia_n": db.query(Observation).filter(Observation.ammonia_n.isnot(None)).count(),
        "iron": db.query(Observation).filter(Observation.iron.isnot(None)).count(),
        "lead": db.query(Observation).filter(Observation.lead.isnot(None)).count(),
        "arsenic": db.query(Observation).filter(Observation.arsenic.isnot(None)).count(),
        "hardness_total": db.query(Observation).filter(Observation.hardness_total.isnot(None)).count()
    }

    # Annual observations trend
    year_counts = (
        db.query(Observation.year, func.count(Observation.id))
        .group_by(Observation.year)
        .order_by(Observation.year)
        .all()
    )
    observations_by_year = [{"year": y, "count": c} for y, c in year_counts if y is not None]

    # District coverage top 10
    dist_counts = (
        db.query(Observation.district_name, func.count(Observation.id))
        .group_by(Observation.district_name)
        .order_by(desc(func.count(Observation.id)))
        .limit(10)
        .all()
    )
    district_coverage = [{"district": d, "count": c} for d, c in dist_counts]

    # Recent 10 observations
    recent = (
        db.query(Observation)
        .order_by(desc(Observation.acquisition_time))
        .limit(10)
        .all()
    )
    recent_list = [
        {
            "id": r.id,
            "station_name": r.station_name,
            "district_name": r.district_name,
            "date": r.acquisition_time.strftime("%d-%m-%Y %H:%M") if r.acquisition_time else "-",
            "ph": r.ph,
            "dissolved_oxygen": r.dissolved_oxygen,
            "bod": r.bod,
            "cpcb_class": r.cpcb_class
        }
        for r in recent
    ]

    return {
        "kpis": {
            "total_observations": total_obs,
            "unique_monitoring_stations": unique_stations,
            "districts_represented": districts_count,
            "water_source_categories": len(water_sources),
            "earliest_date": date_range[0].strftime("%d-%m-%Y") if date_range and date_range[0] else "-",
            "latest_date": date_range[1].strftime("%d-%m-%Y") if date_range and date_range[1] else "-",
            "provenance": "CPCB / NWDP Official Surface Water Monitoring Network"
        },
        "water_source_distribution": water_sources,
        "cpcb_class_distribution": cpcb_distribution,
        "parameter_availability": param_counts,
        "observations_by_year": observations_by_year,
        "district_coverage": district_coverage,
        "recent_observations": recent_list
    }

@app.get("/api/districts")
def get_districts(db: Session = Depends(get_db)):
    districts = db.query(District).all()
    result = []
    for d in districts:
        st_count = db.query(MonitoringStation).filter(MonitoringStation.district_id == d.id).count()
        obs_count = db.query(Observation).filter(Observation.district_name == d.name).count()
        avg_ph = db.query(func.avg(Observation.ph)).filter(Observation.district_name == d.name).scalar()
        avg_do = db.query(func.avg(Observation.dissolved_oxygen)).filter(Observation.district_name == d.name).scalar()
        avg_bod = db.query(func.avg(Observation.bod)).filter(Observation.district_name == d.name).scalar()

        result.append({
            "id": d.id,
            "name": d.name,
            "lgd_code": d.lgd_code,
            "center_lat": d.center_lat,
            "center_lon": d.center_lon,
            "station_count": st_count,
            "observation_count": obs_count,
            "avg_ph": round(float(avg_ph), 2) if avg_ph else None,
            "avg_dissolved_oxygen": round(float(avg_do), 2) if avg_do else None,
            "avg_bod": round(float(avg_bod), 2) if avg_bod else None
        })
    return sorted(result, key=lambda x: x["observation_count"], reverse=True)

@app.get("/api/districts/{name}")
def get_district_detail(name: str, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.name.ilike(name)).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
        
    stations = db.query(MonitoringStation).filter(MonitoringStation.district_id == district.id).all()
    obs_query = db.query(Observation).filter(Observation.district_name == district.name)
    
    total_obs = obs_query.count()
    recent_obs = obs_query.order_by(desc(Observation.acquisition_time)).limit(20).all()

    # Annual trend in this district
    yearly_trend = (
        db.query(
            Observation.year,
            func.avg(Observation.ph),
            func.avg(Observation.dissolved_oxygen),
            func.avg(Observation.bod),
            func.count(Observation.id)
        )
        .filter(Observation.district_name == district.name)
        .group_by(Observation.year)
        .order_by(Observation.year)
        .all()
    )

    trend_data = [
        {
            "year": y,
            "avg_ph": round(float(p), 2) if p else None,
            "avg_do": round(float(d), 2) if d else None,
            "avg_bod": round(float(b), 2) if b else None,
            "count": c
        }
        for y, p, d, b, c in yearly_trend if y is not None
    ]

    return {
        "district": {
            "id": district.id,
            "name": district.name,
            "lgd_code": district.lgd_code,
            "center_lat": district.center_lat,
            "center_lon": district.center_lon,
            "station_count": len(stations),
            "observation_count": total_obs
        },
        "stations": [
            {
                "id": s.id,
                "station_name": s.station_name,
                "water_source_category": s.water_source_category,
                "river": s.river,
                "basin": s.basin,
                "latitude": s.latitude,
                "longitude": s.longitude
            }
            for s in stations
        ],
        "yearly_trends": trend_data,
        "recent_observations": [
            {
                "id": o.id,
                "station_name": o.station_name,
                "date": o.acquisition_time.strftime("%d-%m-%Y") if o.acquisition_time else "-",
                "ph": o.ph,
                "dissolved_oxygen": o.dissolved_oxygen,
                "bod": o.bod,
                "fecal_coliform": o.fecal_coliform,
                "cpcb_class": o.cpcb_class
            }
            for o in recent_obs
        ]
    }

@app.get("/api/stations")
def get_stations(
    district: Optional[str] = None,
    source_category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MonitoringStation)
    if district and district != "All":
        query = query.filter(MonitoringStation.district_name.ilike(district))
    if source_category and source_category != "All":
        query = query.filter(MonitoringStation.water_source_category.ilike(source_category))

    stations = query.all()
    result = []
    
    for s in stations:
        # Get latest observation for this station
        latest = (
            db.query(Observation)
            .filter(Observation.station_id == s.id)
            .order_by(desc(Observation.acquisition_time))
            .first()
        )
        obs_count = db.query(Observation).filter(Observation.station_id == s.id).count()

        result.append({
            "id": s.id,
            "station_name": s.station_name,
            "district_name": s.district_name,
            "agency": s.agency,
            "water_source_category": s.water_source_category,
            "river": s.river,
            "basin": s.basin,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "observation_count": obs_count,
            "latest_observation": {
                "date": latest.acquisition_time.strftime("%d-%m-%Y") if latest and latest.acquisition_time else "-",
                "ph": latest.ph if latest else None,
                "dissolved_oxygen": latest.dissolved_oxygen if latest else None,
                "bod": latest.bod if latest else None,
                "electrical_conductivity": latest.electrical_conductivity if latest else None,
                "fecal_coliform": latest.fecal_coliform if latest else None,
                "cpcb_class": latest.cpcb_class if latest else "Unclassified"
            } if latest else None
        })
    return result

@app.get("/api/stations/{station_id}")
def get_station_detail(station_id: int, db: Session = Depends(get_db)):
    station = db.query(MonitoringStation).filter(MonitoringStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    observations = (
        db.query(Observation)
        .filter(Observation.station_id == station.id)
        .order_by(desc(Observation.acquisition_time))
        .all()
    )

    # Time series sequence (chronological)
    chronological = sorted(observations, key=lambda x: x.acquisition_time)
    time_series = [
        {
            "date": o.acquisition_time.strftime("%Y-%m-%d"),
            "ph": o.ph,
            "dissolved_oxygen": o.dissolved_oxygen,
            "bod": o.bod,
            "electrical_conductivity": o.electrical_conductivity,
            "turbidity": o.turbidity,
            "fecal_coliform": o.fecal_coliform,
            "total_coliform": o.total_coliform,
            "cpcb_class": o.cpcb_class
        }
        for o in chronological
    ]

    # Predict ML class on latest measurements
    latest = observations[0] if observations else None
    prediction_result = None
    if latest and (latest.ph or latest.dissolved_oxygen):
        prediction_result = predict_water_quality({
            "ph": latest.ph,
            "dissolved_oxygen": latest.dissolved_oxygen,
            "bod": latest.bod,
            "fecal_coliform": latest.fecal_coliform,
            "total_coliform": latest.total_coliform,
            "electrical_conductivity": latest.electrical_conductivity,
            "turbidity": latest.turbidity,
            "nitrate_n": latest.nitrate_n,
            "ammonia_n": latest.ammonia_n
        })

    return {
        "station": {
            "id": station.id,
            "station_name": station.station_name,
            "district_name": station.district_name,
            "agency": station.agency,
            "water_source_category": station.water_source_category,
            "river": station.river,
            "basin": station.basin,
            "tributary": station.tributary,
            "latitude": station.latitude,
            "longitude": station.longitude,
            "tehsil": station.tehsil,
            "total_records": len(observations)
        },
        "time_series": time_series,
        "latest_observation": {
            "id": latest.id,
            "date": latest.acquisition_time.strftime("%d-%m-%Y %H:%M") if latest.acquisition_time else "-",
            "ph": latest.ph,
            "dissolved_oxygen": latest.dissolved_oxygen,
            "bod": latest.bod,
            "fecal_coliform": latest.fecal_coliform,
            "total_coliform": latest.total_coliform,
            "electrical_conductivity": latest.electrical_conductivity,
            "turbidity": latest.turbidity,
            "nitrate_n": latest.nitrate_n,
            "ammonia_n": latest.ammonia_n,
            "arsenic": latest.arsenic,
            "lead": latest.lead,
            "iron": latest.iron,
            "cpcb_class": latest.cpcb_class
        } if latest else None,
        "latest_ml_prediction": prediction_result
    }

@app.get("/api/observations")
def get_observations(
    district: Optional[str] = None,
    station_id: Optional[int] = None,
    cpcb_class: Optional[str] = None,
    year: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Observation)
    if district and district != "All":
        query = query.filter(Observation.district_name.ilike(district))
    if station_id:
        query = query.filter(Observation.station_id == station_id)
    if cpcb_class and cpcb_class != "All":
        query = query.filter(Observation.cpcb_class.ilike(f"%{cpcb_class}%"))
    if year:
        query = query.filter(Observation.year == year)

    total_count = query.count()
    items = (
        query.order_by(desc(Observation.acquisition_time))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "items": [
            {
                "id": o.id,
                "station_id": o.station_id,
                "station_name": o.station_name,
                "district_name": o.district_name,
                "date": o.acquisition_time.strftime("%d-%m-%Y %H:%M") if o.acquisition_time else "-",
                "year": o.year,
                "ph": o.ph,
                "dissolved_oxygen": o.dissolved_oxygen,
                "bod": o.bod,
                "fecal_coliform": o.fecal_coliform,
                "total_coliform": o.total_coliform,
                "electrical_conductivity": o.electrical_conductivity,
                "turbidity": o.turbidity,
                "nitrate_n": o.nitrate_n,
                "cpcb_class": o.cpcb_class,
                "is_outlier": o.is_outlier,
                "provenance": o.source_provenance
            }
            for o in items
        ]
    }

@app.get("/api/parameters")
def get_parameters_metadata(db: Session = Depends(get_db)):
    """
    Returns statistical profile and physical descriptions for all parameters across Tamil Nadu.
    """
    params = [
        {"key": "ph", "name": "pH", "unit": "pH units", "standard": "6.5 - 8.5"},
        {"key": "dissolved_oxygen", "name": "Dissolved Oxygen (DO)", "unit": "mg/L", "standard": ">= 4.0 mg/L"},
        {"key": "bod", "name": "Biochemical Oxygen Demand (BOD)", "unit": "mg/L", "standard": "<= 3.0 mg/L"},
        {"key": "fecal_coliform", "name": "Fecal Coliform", "unit": "MPN/100mL", "standard": "<= 500 MPN/100mL"},
        {"key": "total_coliform", "name": "Total Coliform", "unit": "MPN/100mL", "standard": "<= 5000 MPN/100mL"},
        {"key": "electrical_conductivity", "name": "Electrical Conductivity", "unit": "µS/cm", "standard": "<= 2250 µS/cm"},
        {"key": "turbidity", "name": "Turbidity", "unit": "NTU", "standard": "<= 5 NTU"},
        {"key": "nitrate_n", "name": "Nitrate Nitrogen", "unit": "mgN/L", "standard": "<= 10 mg/L"},
        {"key": "ammonia_n", "name": "Ammonia Nitrogen", "unit": "mgN/L", "standard": "<= 1.2 mg/L"},
        {"key": "total_dissolved_solids", "name": "Total Dissolved Solids (TDS)", "unit": "mg/L", "standard": "<= 500 mg/L"},
        {"key": "iron", "name": "Iron", "unit": "mg/L", "standard": "<= 0.3 mg/L"},
        {"key": "lead", "name": "Lead", "unit": "mg/L", "standard": "<= 0.01 mg/L"},
        {"key": "arsenic", "name": "Arsenic", "unit": "mg/L", "standard": "<= 0.01 mg/L"}
    ]

    total_obs = db.query(Observation).count()
    result = []

    for p in params:
        col = getattr(Observation, p["key"])
        stats = db.query(
            func.count(col),
            func.min(col),
            func.max(col),
            func.avg(col)
        ).first()

        count = stats[0] or 0
        missing_rate = round(((total_obs - count) / total_obs * 100), 2) if total_obs > 0 else 100.0

        # Calculate median in python
        if count > 0:
            all_vals = [r[0] for r in db.query(col).filter(col.isnot(None)).all()]
            median_val = round(float(np.median(all_vals)), 2)
            std_val = round(float(np.std(all_vals)), 2)
        else:
            median_val = None
            std_val = None

        result.append({
            "key": p["key"],
            "name": p["name"],
            "unit": p["unit"],
            "standard": p["standard"],
            "observation_count": count,
            "missing_percentage": missing_rate,
            "min": round(float(stats[1]), 2) if stats[1] is not None else None,
            "max": round(float(stats[2]), 2) if stats[2] is not None else None,
            "mean": round(float(stats[3]), 2) if stats[3] is not None else None,
            "median": median_val,
            "std": std_val
        })

    return result

@app.get("/api/analytics/trends")
def get_analytics_trends(
    parameter: str = Query("dissolved_oxygen", description="Parameter column name"),
    district: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if not hasattr(Observation, parameter):
        raise HTTPException(status_code=400, detail=f"Invalid parameter: {parameter}")

    col = getattr(Observation, parameter)
    query = db.query(
        Observation.year,
        Observation.month,
        func.avg(col),
        func.count(col)
    ).filter(col.isnot(None))

    if district and district != "All":
        query = query.filter(Observation.district_name.ilike(district))

    monthly_stats = (
        query.group_by(Observation.year, Observation.month)
        .order_by(Observation.year, Observation.month)
        .all()
    )

    result = [
        {
            "period": f"{y}-{m:02d}",
            "year": y,
            "month": m,
            "value": round(float(avg_val), 2),
            "sample_count": c
        }
        for y, m, avg_val, c in monthly_stats if y is not None and m is not None
    ]

    return {
        "parameter": parameter,
        "district": district or "All Tamil Nadu",
        "trends": result
    }

@app.get("/api/analytics/districts")
def get_district_analytics(db: Session = Depends(get_db)):
    districts = db.query(District).all()
    data = []
    for d in districts:
        obs_count = db.query(Observation).filter(Observation.district_name == d.name).count()
        if obs_count == 0:
            continue
        avg_ph = db.query(func.avg(Observation.ph)).filter(Observation.district_name == d.name).scalar()
        avg_do = db.query(func.avg(Observation.dissolved_oxygen)).filter(Observation.district_name == d.name).scalar()
        avg_bod = db.query(func.avg(Observation.bod)).filter(Observation.district_name == d.name).scalar()
        avg_ec = db.query(func.avg(Observation.electrical_conductivity)).filter(Observation.district_name == d.name).scalar()
        avg_fc = db.query(func.avg(Observation.fecal_coliform)).filter(Observation.district_name == d.name).scalar()

        data.append({
            "district": d.name,
            "observations": obs_count,
            "avg_ph": round(float(avg_ph), 2) if avg_ph else None,
            "avg_dissolved_oxygen": round(float(avg_do), 2) if avg_do else None,
            "avg_bod": round(float(avg_bod), 2) if avg_bod else None,
            "avg_electrical_conductivity": round(float(avg_ec), 2) if avg_ec else None,
            "avg_fecal_coliform": round(float(avg_fc), 2) if avg_fc else None
        })

    return sorted(data, key=lambda x: x["observations"], reverse=True)

@app.get("/api/analytics/anomalies")
def get_anomalies(
    parameter: str = Query("dissolved_oxygen"),
    limit: int = Query(50, ge=5, le=200),
    db: Session = Depends(get_db)
):
    if not hasattr(Observation, parameter):
        raise HTTPException(status_code=400, detail=f"Invalid parameter: {parameter}")
    
    observations = db.query(Observation).all()
    anomalies = detect_parameter_anomalies(observations, param_name=parameter)
    return anomalies[:limit]

@app.get("/api/sources")
def get_sources_registry(db: Session = Depends(get_db)):
    sources = db.query(DataSource).all()
    import_logs = db.query(ImportLog).order_by(desc(ImportLog.timestamp)).limit(20).all()

    return {
        "sources": [
            {
                "id": s.id,
                "name": s.name,
                "publisher": s.publisher,
                "source_url": s.source_url,
                "temporal_coverage": s.temporal_coverage,
                "format": s.format,
                "records_accepted": s.records_accepted,
                "records_rejected": s.records_rejected,
                "validation_status": s.validation_status,
                "last_imported_at": s.last_imported_at.strftime("%d-%m-%Y %H:%M") if s.last_imported_at else "-"
            }
            for s in sources
        ],
        "recent_import_logs": [
            {
                "id": l.id,
                "source_name": l.source_name,
                "filename": l.filename,
                "records_imported": l.records_imported,
                "records_rejected": l.records_rejected,
                "errors": l.errors,
                "timestamp": l.timestamp.strftime("%d-%m-%Y %H:%M") if l.timestamp else "-"
            }
            for l in import_logs
        ]
    }

@app.post("/api/predictions/classify")
def classify_water_sample(payload: PredictionRequest, db: Session = Depends(get_db)):
    res = predict_water_quality(payload.dict())
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])

    # Log prediction
    log = PredictionLog(
        input_features=payload.dict(),
        predicted_class=res["predicted_class"],
        confidence=res["confidence"],
        explanation=res["feature_contributions"]
    )
    db.add(log)
    db.commit()

    return res

@app.get("/api/ml/model-info")
def get_model_information():
    if not os.path.exists(METADATA_PATH):
        raise HTTPException(status_code=404, detail="Model metadata not found")
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)
    return meta

@app.post("/api/admin/import")
async def admin_import_file(
    file: UploadFile = File(...),
    source_name: str = Form("Admin Upload"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith((".csv", ".txt", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV, TXT, or XLSX formats are supported.")

    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    header = [h.strip() for h in rows[0]]
    accepted = 0
    rejected = 0
    reasons = []

    # Basic preview & count
    for idx, r in enumerate(rows[1:], start=2):
        if len(r) < 3:
            rejected += 1
            if len(reasons) < 5:
                reasons.append(f"Row {idx}: insufficient columns")
            continue
        accepted += 1

    # Log operation
    log = ImportLog(
        source_name=source_name,
        filename=file.filename,
        records_imported=accepted,
        records_rejected=rejected,
        errors={"warnings": reasons[:5], "total_rows_evaluated": len(rows)-1}
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "filename": file.filename,
        "rows_total": len(rows) - 1,
        "records_accepted": accepted,
        "records_rejected": rejected,
        "validation_warnings": reasons[:5],
        "message": f"Processed {accepted} records from {file.filename}."
    }

@app.get("/api/reports/export-csv")
def export_observations_csv(
    district: Optional[str] = None,
    cpcb_class: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Observation)
    if district and district != "All":
        query = query.filter(Observation.district_name.ilike(district))
    if cpcb_class and cpcb_class != "All":
        query = query.filter(Observation.cpcb_class.ilike(f"%{cpcb_class}%"))
    if year:
        query = query.filter(Observation.year == year)

    records = query.order_by(desc(Observation.acquisition_time)).limit(5000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Observation ID", "Station Name", "District", "Date", "Year",
        "pH", "Dissolved Oxygen (mg/L)", "BOD (mg/L)", "Fecal Coliform (MPN/100mL)",
        "Total Coliform (MPN/100mL)", "Electrical Conductivity (uS/cm)",
        "Turbidity (NTU)", "Nitrate N (mg/L)", "Ammonia N (mg/L)",
        "CPCB Water Quality Class", "Outlier Flag", "Provenance"
    ])

    for o in records:
        writer.writerow([
            o.id, o.station_name, o.district_name,
            o.acquisition_time.strftime("%d-%m-%Y %H:%M") if o.acquisition_time else "",
            o.year, o.ph, o.dissolved_oxygen, o.bod,
            o.fecal_coliform, o.total_coliform, o.electrical_conductivity,
            o.turbidity, o.nitrate_n, o.ammonia_n,
            o.cpcb_class, o.is_outlier, o.source_provenance
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tn_water_quality_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@app.get("/api/reports/summary")
def get_analytical_summary_report(db: Session = Depends(get_db)):
    total_obs = db.query(Observation).count()
    stations_count = db.query(MonitoringStation).count()
    districts_count = db.query(District).count()
    
    # Class proportions
    class_stats = (
        db.query(Observation.cpcb_class, func.count(Observation.id))
        .group_by(Observation.cpcb_class)
        .all()
    )

    # Key parameter regional averages
    avg_ph = db.query(func.avg(Observation.ph)).scalar()
    avg_do = db.query(func.avg(Observation.dissolved_oxygen)).scalar()
    avg_bod = db.query(func.avg(Observation.bod)).scalar()

    return {
        "report_title": "Tamil Nadu State Water Quality Analytical Summary",
        "generated_at": datetime.utcnow().isoformat(),
        "publisher": "Tamil Nadu Water Intelligence AI (TN-WaterAI)",
        "spatial_coverage": f"{districts_count} Administrative Districts across Tamil Nadu",
        "temporal_coverage": "2018 - 2021 (Official CPCB Monitoring Epochs)",
        "total_monitoring_records": total_obs,
        "verified_stations": stations_count,
        "regional_indicators": {
            "mean_ph": round(float(avg_ph), 2) if avg_ph else None,
            "mean_dissolved_oxygen_mg_l": round(float(avg_do), 2) if avg_do else None,
            "mean_bod_mg_l": round(float(avg_bod), 2) if avg_bod else None
        },
        "cpcb_water_quality_classification_breakdown": [
            {"class_name": k or "Unclassified", "record_count": v, "percentage": round(v / total_obs * 100, 2)}
            for k, v in class_stats
        ],
        "methodology": "Based on official CPCB Primary Water Quality Criteria for Designated Best Use. Data collected under National Water Data Portal (NWDP / NWIC).",
        "scientific_disclaimer": "This analytical report is intended for research, environmental education, and decision support. It does not certify municipal drinking water safety or replace regulatory statutory testing."
    }

@app.get("/api/geojson/tamil-nadu")
def get_tamil_nadu_geojson():
    geojson_path = "backend/data/tamil_nadu_districts.geojson"
    if not os.path.exists(geojson_path):
        raise HTTPException(status_code=404, detail="Tamil Nadu GeoJSON not found")
    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data
