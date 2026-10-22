# Tamil Nadu Water Intelligence AI (TN-WaterAI)
### AI-Powered Water Quality Monitoring, Geospatial Analytics & CPCB Classification Platform

TN-WaterAI is a production-oriented environmental intelligence web platform designed to monitor, analyze, and classify water quality across Tamil Nadu, India. It integrates verified government monitoring datasets, interactive Leaflet GIS mapping with verified district boundaries, time-series anomaly detection, and empirical machine learning classification.

---

## 🚀 Live Localhost URLs

- **Interactive Web Application (Frontend)**: [http://localhost:5173/](http://localhost:5173/)
- **FastAPI Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🏛️ Official Data Provenance & Ingestion

The platform is strictly grounded in real, empirical data from official Indian government repositories:
- **National Water Informatics Centre (NWIC)** / Ministry of Jal Shakti: [https://nwdp.nwic.gov.in](https://nwdp.nwic.gov.in)
- **Central Pollution Control Board (CPCB)**: [https://cpcb.nic.in](https://cpcb.nic.in)
- **Tamil Nadu Pollution Control Board (TNPCB)**: [https://tnpcb.gov.in](https://tnpcb.gov.in)
- **India-WRIS**: [https://nwic.in/wris](https://nwic.in/wris)

### Verified Datasets Integrated
1. **Surface Water Quality (Manual - Chemical Parameters)** (CPCB Tamil Nadu 1961–2020 & 2021–2025)
2. **Surface Water Quality (Manual - Physical Parameters)** (CPCB Tamil Nadu 1961–2020 & 2021–2025)
3. **Surface Water Quality (Manual - Biological Parameters)** (CPCB Tamil Nadu 1961–2020 & 2021–2025)
4. **Tamil Nadu 32 Districts GeoJSON**: Verified administrative polygon boundaries.

*Total Ingested Telemetry*: **3,191 consolidated observations** across **134 unique monitoring stations** in **22 districts**, with 100% spatial coordinates validated within Tamil Nadu.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Leaflet & React Leaflet.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, SQLite / PostgreSQL PostGIS ready.
- **Machine Learning**: Scikit-Learn (`RandomForestClassifier`, `DecisionTreeClassifier`, `LogisticRegression`, `DummyClassifier` baseline), `StandardScaler`, `SimpleImputer`, serialized via Joblib.
- **Testing**: Pytest, FastAPI TestClient, Vitest/TSC build verification.

---

## 🧭 Navigation Views (10 Modules)

1. **Overview Dashboard**: High-level KPIs, water source distribution (Rivers, Canals, Reservoirs, Groundwater), temporal trends, and recent telemetry feed.
2. **Interactive Water Map**: Full GIS interactive Leaflet map with 32 Tamil Nadu district polygons, station markers colored by CPCB Quality Class, search by river/station, and slide-out station telemetry drawer.
3. **Water Quality Explorer**: Metric scorecards (Min, Median, Mean, Max, Missing Rate), distribution curves, and 1.5× IQR anomaly detection.
4. **District Analytics**: 22 administrative district profiles with station counts, observation density, and multi-year parameter evolution.
5. **ML Predictions**: Live CPCB Designated Best Use classification studio with physical range constraints, confidence gauge, and top influencing feature radar.
6. **Historical Trends**: Multi-year monthly timeline analysis and statistical outlier detection.
7. **Compare Locations**: Multivariate benchmark comparing 2 to 4 stations side-by-side.
8. **Data Sources & Admin Ingest**: Provenance registry and authorized CSV/XLSX file upload workflow with real-time schema validation.
9. **Reports & Exports**: Query builder with direct CSV downloads and printable HTML/PDF-ready environmental digest.
10. **About Project**: Scientific methodology, CPCB standard definitions table, and responsible-use statements.

---

## 🧪 Scientific Grounding: CPCB Designated Best Use Criteria

| Class | Designated Best Use | Key Empirical Thresholds |
| :--- | :--- | :--- |
| **Class A** | Drinking water without conventional treatment (disinfection only) | pH: 6.5–8.5 • DO $\ge$ 6.0 mg/L • BOD $\le$ 2.0 mg/L • TC $\le$ 50 MPN/100mL |
| **Class B** | Outdoor bathing (organized) | pH: 6.5–8.5 • DO $\ge$ 5.0 mg/L • BOD $\le$ 3.0 mg/L • TC $\le$ 500 MPN/100mL |
| **Class C** | Drinking water after conventional treatment | pH: 6.0–9.0 • DO $\ge$ 4.0 mg/L • BOD $\le$ 3.0 mg/L • TC $\le$ 5000 MPN/100mL |
| **Class D** | Propagation of Wildlife and Fisheries | pH: 6.5–8.5 • DO $\ge$ 4.0 mg/L • Free Ammonia $\le$ 1.2 mg/L |
| **Class E** | Irrigation, Industrial Cooling, Waste Disposal | pH: 6.0–8.5 • EC $\le$ 2250 µS/cm • SAR $\le$ 26 |
| **Below E**| Non-conforming / Severely polluted | Fails basic ecological thresholds (DO &lt; 2.0 mg/L, BOD &gt; 15.0 mg/L) |

---

## 🏃 Running the Application

### 1. Backend Setup & Ingestion
```bash
# Install Python dependencies
pip install fastapi uvicorn pydantic pandas sqlalchemy pytest httpx python-multipart scikit-learn joblib

# Run data ingestion pipeline (fetches official NWDP datasets and populates DB)
python backend/ingest.py

# Train Machine Learning pipeline
python backend/ml/classifier.py

# Launch FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup & Launch
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

### 3. Run Automated Tests
```bash
# Backend pytest suite (8 passing tests)
pytest tests/

# Frontend TypeScript & Vite build verification
cd frontend && npm run build
```

---

## ⚖️ Responsible-Use Disclaimer
TN-WaterAI is created for research, education, environmental monitoring, and decision support. It does **not** certify municipal drinking water safety or replace statutory regulatory testing under Bureau of Indian Standards (IS 10500:2012).
