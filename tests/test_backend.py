import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.ml.cpcb_standards import determine_cpcb_class
from backend.ml.classifier import predict_water_quality

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_overview_endpoint():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["total_observations"] > 0
    assert data["kpis"]["unique_monitoring_stations"] > 0
    assert data["kpis"]["districts_represented"] > 0

def test_districts_endpoint():
    response = client.get("/api/districts")
    assert response.status_code == 200
    districts = response.json()
    assert len(districts) > 0
    assert any("Chennai" in d["name"] or "Coimbatore" in d["name"] for d in districts)

def test_stations_endpoint():
    response = client.get("/api/stations")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) > 0
    first = stations[0]
    assert "latitude" in first and "longitude" in first
    # Tamil Nadu spatial bounding box check
    assert 7.5 <= first["latitude"] <= 14.5
    assert 75.5 <= first["longitude"] <= 81.5

def test_parameters_metadata():
    response = client.get("/api/parameters")
    assert response.status_code == 200
    params = response.json()
    keys = [p["key"] for p in params]
    assert "ph" in keys
    assert "dissolved_oxygen" in keys
    assert "bod" in keys

def test_ml_prediction_endpoint():
    payload = {
        "ph": 7.5,
        "dissolved_oxygen": 7.0,
        "bod": 1.5,
        "fecal_coliform": 40.0,
        "electrical_conductivity": 350.0
    }
    response = client.post("/api/predictions/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_class" in data
    assert "confidence" in data
    assert data["confidence"] > 0.0
    assert "feature_contributions" in data

def test_cpcb_standards_logic():
    # Pristine sample
    cls_a = determine_cpcb_class(ph=7.2, do=7.5, bod=1.2, tc=30)
    assert "Class A" in cls_a

    # Polluted sample
    cls_polluted = determine_cpcb_class(ph=8.2, do=1.0, bod=25.0)
    assert "Below Class E" in cls_polluted

def test_geojson_endpoint():
    response = client.get("/api/geojson/tamil-nadu")
    assert response.status_code == 200
    data = response.json()
    assert data.get("type") == "FeatureCollection"
    assert len(data.get("features", [])) >= 30
