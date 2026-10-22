from datetime import datetime
from sqlalchemy import (
    Column, Integer, Float, String, DateTime, Boolean, Text, ForeignKey, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    publisher = Column(String(255), default="CPCB / NWIC")
    source_url = Column(Text, nullable=False)
    temporal_coverage = Column(String(100))
    format = Column(String(50), default="CSV")
    records_accepted = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    validation_status = Column(String(50), default="VALIDATED")
    last_imported_at = Column(DateTime, default=datetime.utcnow)

    import_logs = relationship("ImportLog", back_populates="source")

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    lgd_code = Column(String(50), nullable=True)
    center_lat = Column(Float, nullable=True)
    center_lon = Column(Float, nullable=True)

    stations = relationship("MonitoringStation", back_populates="district_rel")

class MonitoringStation(Base):
    __tablename__ = "monitoring_stations"

    id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String(255), unique=True, nullable=False, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    district_name = Column(String(100), index=True)
    agency = Column(String(100), default="CPCB")
    water_source_category = Column(String(100), default="River/Surface Water")
    river = Column(String(150), default="-")
    basin = Column(String(150), default="-")
    tributary = Column(String(150), default="-")
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    tehsil = Column(String(100), default="-")
    created_at = Column(DateTime, default=datetime.utcnow)

    district_rel = relationship("District", back_populates="stations")
    observations = relationship("Observation", back_populates="station_rel")

class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id"), nullable=False, index=True)
    station_name = Column(String(255), index=True)
    district_name = Column(String(100), index=True)
    acquisition_time = Column(DateTime, nullable=False, index=True)
    year = Column(Integer, index=True)
    month = Column(Integer, index=True)

    # Core Parameters
    ph = Column(Float, nullable=True)
    dissolved_oxygen = Column(Float, nullable=True)
    bod = Column(Float, nullable=True)
    fecal_coliform = Column(Float, nullable=True)
    total_coliform = Column(Float, nullable=True)
    electrical_conductivity = Column(Float, nullable=True)
    turbidity = Column(Float, nullable=True)
    total_dissolved_solids = Column(Float, nullable=True)
    nitrate_n = Column(Float, nullable=True)
    ammonia_n = Column(Float, nullable=True)
    
    # Heavy Metals & Additional Parameters
    arsenic = Column(Float, nullable=True)
    lead = Column(Float, nullable=True)
    cadmium = Column(Float, nullable=True)
    iron = Column(Float, nullable=True)
    mercury = Column(Float, nullable=True)
    manganese = Column(Float, nullable=True)
    hardness_total = Column(Float, nullable=True)
    chloride = Column(Float, nullable=True)
    sulphate = Column(Float, nullable=True)
    sar = Column(Float, nullable=True)

    # Classification & Provenance
    cpcb_class = Column(String(50), nullable=True, index=True)
    is_outlier = Column(Boolean, default=False)
    source_provenance = Column(String(255), default="CPCB/NWDP Manual Surface Water")

    station_rel = relationship("MonitoringStation", back_populates="observations")

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(100), unique=True, nullable=False)
    algorithm = Column(String(100), nullable=False)
    accuracy = Column(Float, nullable=False)
    macro_f1 = Column(Float, nullable=False)
    feature_schema = Column(JSON, nullable=False)
    evaluation_metrics = Column(JSON, nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow)

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    input_features = Column(JSON, nullable=False)
    predicted_class = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    explanation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ImportLog(Base):
    __tablename__ = "import_logs"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=True)
    source_name = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    records_imported = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    errors = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    source = relationship("DataSource", back_populates="import_logs")
