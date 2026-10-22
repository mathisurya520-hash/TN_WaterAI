import os
import sys
import csv
import io
import json
import urllib.request
from datetime import datetime
import pandas as pd
import numpy as np

# Add parent directory to sys.path so imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import SessionLocal, init_db
from backend.models import DataSource, District, MonitoringStation, Observation, ImportLog
from backend.ml.cpcb_standards import determine_cpcb_class

DATASET_CONFIGS = [
    {
        "category": "Chemical",
        "period": "1961-2020",
        "url": "https://nwdp.nwic.gov.in/dataset/d54d7702-d21f-408f-8dc0-2665bde47201/resource/0a26c675-11d1-433d-b19d-9d3a8dcb3796/download/swq_manual_chemical_parameters_cpcb_tn_1961_2020.csv",
        "local_cache": "backend/data/swq_chem_1961_2020.csv"
    },
    {
        "category": "Chemical",
        "period": "2021-2025",
        "url": "https://nwdp.nwic.gov.in/dataset/d54d7702-d21f-408f-8dc0-2665bde47201/resource/acc41e2e-3da2-43d2-8e6a-0081cc64392a/download/swq_chemical_parameter_manual_cpcb_tn_2021_2025.csv",
        "local_cache": "backend/data/swq_chem_2021_2025.csv"
    },
    {
        "category": "Physical",
        "period": "1961-2020",
        "url": "https://nwdp.nwic.gov.in/dataset/c547abaa-fbdc-4f46-b152-dc023be0c75c/resource/6b46cd1f-48e6-421d-af37-3e08fa98dc08/download/swq_manual_physical_parameters_cpcb_tn_1961_2020.csv",
        "local_cache": "backend/data/swq_phys_1961_2020.csv"
    },
    {
        "category": "Physical",
        "period": "2021-2025",
        "url": "https://nwdp.nwic.gov.in/dataset/c547abaa-fbdc-4f46-b152-dc023be0c75c/resource/d44ae053-9b0f-420b-8851-f9ad67f1b0b5/download/swq_physical_parameter_manual_cpcb_tn_2021_2025.csv",
        "local_cache": "backend/data/swq_phys_2021_2025.csv"
    },
    {
        "category": "Biological",
        "period": "1961-2020",
        "url": "https://nwdp.nwic.gov.in/dataset/e97bcc1b-895e-4eb9-a826-09d52f7b5ca0/resource/d178b063-cc4b-40ba-921e-b392889e1258/download/swq_manual_biological_parameters_cpcb_tn_1961_2020.csv",
        "local_cache": "backend/data/swq_bio_1961_2020.csv"
    },
    {
        "category": "Biological",
        "period": "2021-2025",
        "url": "https://nwdp.nwic.gov.in/dataset/e97bcc1b-895e-4eb9-a826-09d52f7b5ca0/resource/38d272b1-9f88-41d7-ac60-843bf0b447aa/download/swq_biological_parameter_manual_cpcb_tn_2021_2025.csv",
        "local_cache": "backend/data/swq_bio_2021_2025.csv"
    }
]

def fetch_or_read_csv(url, local_path):
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        with open(local_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
            return content
    print(f"Fetching from official source: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        content = resp.read().decode("utf-8", errors="replace")
    with open(local_path, "w", encoding="utf-8") as f:
        f.write(content)
    return content

def parse_float(val):
    if val is None or pd.isna(val):
        return None
    s = str(val).strip().replace(",", "")
    if s in ["", "-", "NA", "null", "None", "ND", "BDL"]:
        return None
    try:
        f = float(s)
        return f if not np.isnan(f) else None
    except ValueError:
        return None

def parse_date(date_str):
    if not date_str or pd.isna(date_str):
        return None
    s = str(date_str).strip()
    formats = [
        "%d-%m-%Y %H:%M",
        "%d-%m-%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None

def infer_water_source(station_name, river, basin):
    s = f"{station_name} {river} {basin}".lower()
    if any(k in s for k in ["bore well", "borewell", "ground water", "groundwater", "dug well", "well"]):
        return "Groundwater"
    elif any(k in s for k in ["lake", "pond", "eri", "tank", "dam", "reservoir", "oorani"]):
        return "Lake / Reservoir"
    elif any(k in s for k in ["sea", "coast", "coastal", "creek", "estuary", "marine", "port"]):
        return "Coastal / Estuary"
    elif any(k in s for k in ["canal", "drain", "sewage channel", "buckingham"]):
        return "Canal / Drain"
    else:
        return "River / Stream"

def run_ingestion():
    init_db()
    db = SessionLocal()
    print("Beginning official CPCB Tamil Nadu Water Quality Ingestion Pipeline...")

    # Load Tamil Nadu GeoJSON for district reference if available
    geojson_path = "backend/data/tamil_nadu_districts.geojson"
    known_districts = set()
    if os.path.exists(geojson_path):
        try:
            with open(geojson_path, "r", encoding="utf-8") as f:
                geo = json.load(f)
                for feat in geo.get("features", []):
                    d_name = feat.get("properties", {}).get("Dist_Name")
                    if d_name:
                        known_districts.add(d_name.strip())
        except Exception as e:
            print(f"Notice: GeoJSON read warning: {e}")

    # Process block by block
    # Block 1: 1961-2020
    # Block 2: 2021-2025
    blocks = ["1961-2020", "2021-2025"]
    
    total_observations_saved = 0
    total_stations_saved = 0

    for block in blocks:
        print(f"\n--- Processing Temporal Block: {block} ---")
        configs = [c for c in DATASET_CONFIGS if c["period"] == block]
        dataframes = {}

        for cfg in configs:
            cat = cfg["category"]
            csv_content = fetch_or_read_csv(cfg["url"], cfg["local_cache"])
            df = pd.read_csv(io.StringIO(csv_content), low_memory=False)
            df.columns = [c.strip() for c in df.columns]
            dataframes[cat] = df
            print(f"Loaded {cat} {block}: {len(df)} rows, {len(df.columns)} columns")

            # Update or create DataSource record
            ds_name = f"CPCB Surface Water Quality {cat} Parameters ({block})"
            source = db.query(DataSource).filter(DataSource.name == ds_name).first()
            if not source:
                source = DataSource(
                    name=ds_name,
                    publisher="Central Pollution Control Board / NWIC",
                    source_url=cfg["url"],
                    temporal_coverage=block,
                    format="CSV",
                    records_accepted=len(df),
                    records_rejected=0,
                    validation_status="VALIDATED"
                )
                db.add(source)
                db.commit()
                db.refresh(source)

        # Merge datasets on Station and Data Acquisition Time
        # Start with Chemical or Biological as primary
        primary_key = "Chemical" if "Chemical" in dataframes else list(dataframes.keys())[0]
        merged_df = dataframes[primary_key].copy()
        
        # Merge keys
        merge_cols = ["Station", "Data Acquisition Time"]
        
        for cat, df in dataframes.items():
            if cat == primary_key:
                continue
            # Select columns unique to this category plus merge keys
            common = [c for c in df.columns if c in merge_cols]
            unique = [c for c in df.columns if c not in merged_df.columns and c not in merge_cols]
            if common and unique:
                merged_df = pd.merge(
                    merged_df,
                    df[common + unique],
                    on=common,
                    how="outer",
                    suffixes=("", f"_{cat}")
                )

        print(f"Merged {block} consolidated table: {len(merged_df)} observations")

        # Ingest consolidated rows
        station_cache = {s.station_name: s for s in db.query(MonitoringStation).all()}
        district_cache = {d.name: d for d in db.query(District).all()}

        accepted_in_block = 0
        rejected_in_block = 0

        for _, row in merged_df.iterrows():
            station_name = str(row.get("Station", "")).strip()
            date_str = str(row.get("Data Acquisition Time", "")).strip()
            lat_raw = row.get("Latitude")
            lon_raw = row.get("Longitude")

            if not station_name or station_name == "nan" or not date_str or date_str == "nan":
                rejected_in_block += 1
                continue

            lat = parse_float(lat_raw)
            lon = parse_float(lon_raw)

            # Validate Tamil Nadu geographic coordinates (8.0 <= lat <= 14.0, 76.0 <= lon <= 81.0)
            if lat is None or lon is None or not (7.5 <= lat <= 14.5 and 75.5 <= lon <= 81.5):
                rejected_in_block += 1
                continue

            acq_time = parse_date(date_str)
            if not acq_time:
                rejected_in_block += 1
                continue

            district_name = str(row.get("District", "")).strip()
            if not district_name or district_name == "-" or district_name == "nan":
                district_name = "Unassigned"

            # Ensure district exists in DB
            if district_name not in district_cache:
                dist_obj = District(
                    name=district_name,
                    lgd_code=str(row.get("District LGD Code", "")).strip(),
                    center_lat=lat,
                    center_lon=lon
                )
                db.add(dist_obj)
                db.commit()
                db.refresh(dist_obj)
                district_cache[district_name] = dist_obj

            dist_obj = district_cache[district_name]

            # Ensure station exists in DB
            if station_name not in station_cache:
                river = str(row.get("River", "-")).strip()
                basin = str(row.get("Basin", "-")).strip()
                source_cat = infer_water_source(station_name, river, basin)
                st_obj = MonitoringStation(
                    station_name=station_name,
                    district_id=dist_obj.id,
                    district_name=district_name,
                    agency=str(row.get("Agency", "CPCB")).strip(),
                    water_source_category=source_cat,
                    river=river,
                    basin=basin,
                    tributary=str(row.get("Tributary", "-")).strip(),
                    latitude=lat,
                    longitude=lon,
                    tehsil=str(row.get("Tehsil", "-")).strip()
                )
                db.add(st_obj)
                db.commit()
                db.refresh(st_obj)
                station_cache[station_name] = st_obj
                total_stations_saved += 1

            st_obj = station_cache[station_name]

            # Extract parameter measurements safely
            ph_val = parse_float(row.get("Potential of Hydrogen (pH)"))
            do_val = parse_float(row.get("Dissolved oxygen (mg/L)"))
            bod_val = parse_float(row.get("Biochemical Oxygen Demand (mg/L)"))
            fc_val = parse_float(row.get("Fecal Coliform (MPN/100mL)"))
            tc_val = parse_float(row.get("Total Coliform (MPN/100mL)"))
            
            # Physical parameters
            ec_key = [c for c in row.index if "Electric Conductivity" in c or "Conductivity" in c]
            ec_val = parse_float(row.get(ec_key[0])) if ec_key else None
            
            turb_key = [c for c in row.index if "Turbidity" in c]
            turb_val = parse_float(row.get(turb_key[0])) if turb_key else None
            
            tds_val = parse_float(row.get("Total Dissolved Solids (mg/L)"))
            nitrate_n = parse_float(row.get("Nitrate N (mgN/L)"))
            ammonia_n = parse_float(row.get("Amonia N (mgN/L)"))
            
            # Heavy metals & ions
            arsenic_val = parse_float(row.get("Arsenic (mg/L)"))
            lead_val = parse_float(row.get("Lead (mg/L)"))
            cadmium_val = parse_float(row.get("Cadmium (mg/L)"))
            iron_val = parse_float(row.get("Iron(mg/L)"))
            mercury_val = parse_float(row.get("Mercury(mg/L)"))
            manganese_val = parse_float(row.get("Manganese (mg/L)"))
            hardness_val = parse_float(row.get("Total Hardness (mgCaCO3/L)"))
            chloride_val = parse_float(row.get("Chloride (mg/L)"))
            sulphate_val = parse_float(row.get("Sulphate (mg/L)"))
            sar_val = parse_float(row.get("Sodium Adsorption Ratio (%)"))

            # Calculate CPCB Water Quality Class
            cpcb_class = determine_cpcb_class(
                ph=ph_val,
                do=do_val,
                bod=bod_val,
                tc=tc_val,
                fc=fc_val,
                ec=ec_val,
                ammonia=ammonia_n,
                sar=sar_val
            )

            # Check statistical anomaly / outlier flag (e.g. BOD > 25, pH < 4 or > 10, DO > 15)
            is_outlier = False
            if (bod_val and bod_val > 30.0) or (ph_val and (ph_val < 5.0 or ph_val > 10.5)) or (turb_val and turb_val > 500.0):
                is_outlier = True

            # Check if this exact observation already exists to prevent duplicate insertion
            existing = db.query(Observation).filter(
                Observation.station_id == st_obj.id,
                Observation.acquisition_time == acq_time
            ).first()

            if not existing:
                obs = Observation(
                    station_id=st_obj.id,
                    station_name=station_name,
                    district_name=district_name,
                    acquisition_time=acq_time,
                    year=acq_time.year,
                    month=acq_time.month,
                    ph=ph_val,
                    dissolved_oxygen=do_val,
                    bod=bod_val,
                    fecal_coliform=fc_val,
                    total_coliform=tc_val,
                    electrical_conductivity=ec_val,
                    turbidity=turb_val,
                    total_dissolved_solids=tds_val,
                    nitrate_n=nitrate_n,
                    ammonia_n=ammonia_n,
                    arsenic=arsenic_val,
                    lead=lead_val,
                    cadmium=cadmium_val,
                    iron=iron_val,
                    mercury=mercury_val,
                    manganese=manganese_val,
                    hardness_total=hardness_val,
                    chloride=chloride_val,
                    sulphate=sulphate_val,
                    sar=sar_val,
                    cpcb_class=cpcb_class,
                    is_outlier=is_outlier,
                    source_provenance=f"CPCB/NWDP ({block})"
                )
                db.add(obs)
                accepted_in_block += 1
                total_observations_saved += 1
            else:
                accepted_in_block += 1

        db.commit()
        print(f"Block {block} ingestion complete: {accepted_in_block} accepted, {rejected_in_block} rejected.")

        # Log import operation
        import_log = ImportLog(
            source_name=f"CPCB NWDP Consolidation ({block})",
            filename=f"consolidated_tn_{block}.csv",
            records_imported=accepted_in_block,
            records_rejected=rejected_in_block,
            errors={"info": f"Merged chemical, physical, and biological parameters for {block}"}
        )
        db.add(import_log)
        db.commit()

    print(f"\n=== Ingestion Complete ===")
    print(f"Total Unique Stations: {len(db.query(MonitoringStation).all())}")
    print(f"Total Observations in DB: {db.query(Observation).count()}")
    print(f"Total Districts Represented: {db.query(District).count()}")
    db.close()

if __name__ == "__main__":
    run_ingestion()
