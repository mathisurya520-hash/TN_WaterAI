import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.dummy import DummyClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_validate, StratifiedKFold
from sklearn.metrics import classification_report, accuracy_score, f1_score, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

# Add parent directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.database import SessionLocal
from backend.models import Observation, ModelRegistry

MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "cpcb_water_classifier.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

# Core predictive features available in CPCB Tamil Nadu datasets
FEATURE_COLS = [
    "ph",
    "dissolved_oxygen",
    "bod",
    "fecal_coliform",
    "total_coliform",
    "electrical_conductivity",
    "turbidity",
    "nitrate_n",
    "ammonia_n"
]

FEATURE_RANGES = {
    "ph": {"min": 0.0, "max": 14.0, "unit": "pH units", "default": 7.2},
    "dissolved_oxygen": {"min": 0.0, "max": 25.0, "unit": "mg/L", "default": 6.5},
    "bod": {"min": 0.0, "max": 100.0, "unit": "mg/L", "default": 2.5},
    "fecal_coliform": {"min": 0.0, "max": 500000.0, "unit": "MPN/100mL", "default": 120.0},
    "total_coliform": {"min": 0.0, "max": 1000000.0, "unit": "MPN/100mL", "default": 450.0},
    "electrical_conductivity": {"min": 0.0, "max": 50000.0, "unit": "µS/cm", "default": 480.0},
    "turbidity": {"min": 0.0, "max": 2000.0, "unit": "NTU", "default": 4.5},
    "nitrate_n": {"min": 0.0, "max": 100.0, "unit": "mgN/L", "default": 1.2},
    "ammonia_n": {"min": 0.0, "max": 50.0, "unit": "mgN/L", "default": 0.4}
}

def train_and_evaluate_models():
    db = SessionLocal()
    observations = db.query(Observation).filter(Observation.cpcb_class.isnot(None)).all()
    
    if len(observations) < 50:
        print("Insufficient observations in database to train ML models. Run ingestion first.")
        db.close()
        return None

    # Build DataFrame
    records = []
    for obs in observations:
        records.append({
            "ph": obs.ph,
            "dissolved_oxygen": obs.dissolved_oxygen,
            "bod": obs.bod,
            "fecal_coliform": obs.fecal_coliform,
            "total_coliform": obs.total_coliform,
            "electrical_conductivity": obs.electrical_conductivity,
            "turbidity": obs.turbidity,
            "total_dissolved_solids": obs.total_dissolved_solids,
            "nitrate_n": obs.nitrate_n,
            "ammonia_n": obs.ammonia_n,
            "cpcb_class": obs.cpcb_class
        })
    df = pd.DataFrame(records)
    
    # Filter out Unclassified
    df = df[df["cpcb_class"] != "Unclassified"].copy()
    
    # Require at least ph or dissolved_oxygen to be non-null
    df = df.dropna(subset=["ph", "dissolved_oxygen"], how="all")
    
    X = df[FEATURE_COLS]
    y = df["cpcb_class"]

    # Stratified Train-Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    models = {
        "Baseline (Dummy Stratified)": DummyClassifier(strategy="stratified", random_state=42),
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=6, class_weight="balanced", random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=8, class_weight="balanced", random_state=42)
    }

    results = {}
    best_model_name = "Random Forest"
    best_f1 = -1.0
    best_pipeline = None

    for name, clf in models.items():
        pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("classifier", clf)
        ])
        
        # Train
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        
        acc = accuracy_score(y_test, preds)
        macro_f1 = f1_score(y_test, preds, average="macro", zero_division=0)
        report = classification_report(y_test, preds, output_dict=True, zero_division=0)
        cm = confusion_matrix(y_test, preds, labels=sorted(list(y.unique()))).tolist()

        results[name] = {
            "accuracy": round(float(acc), 4),
            "macro_f1": round(float(macro_f1), 4),
            "classes": sorted(list(y.unique())),
            "confusion_matrix": cm,
            "classification_report": report
        }
        
        print(f"Model [{name}]: Accuracy = {acc:.4f}, Macro F1 = {macro_f1:.4f}")

        if macro_f1 > best_f1:
            best_f1 = macro_f1
            best_model_name = name
            best_pipeline = pipeline

    # Extract Feature Importances from Best Model (Random Forest)
    rf_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(n_estimators=100, max_depth=8, class_weight="balanced", random_state=42))
    ])
    rf_pipeline.fit(X, y)
    
    rf_clf = rf_pipeline.named_steps["classifier"]
    importances = dict(zip(FEATURE_COLS, [round(float(v), 4) for v in rf_clf.feature_importances_]))

    # Save best model
    joblib.dump(rf_pipeline, MODEL_PATH)

    metadata = {
        "model_id": "cpcb_water_classifier_v1",
        "algorithm": "Random Forest Classifier (Ensemble)",
        "trained_at": datetime.utcnow().isoformat(),
        "training_samples_total": len(df),
        "feature_schema": FEATURE_COLS,
        "feature_ranges": FEATURE_RANGES,
        "feature_importances": importances,
        "classes": sorted(list(y.unique())),
        "evaluation_summary": results,
        "best_model": best_model_name,
        "best_macro_f1": best_f1,
        "limitations": [
            "Model is trained on Central Pollution Control Board (CPCB) manual surface water quality datasets for Tamil Nadu.",
            "Predictions reflect CPCB Designated Best Use categories and do not certify potable drinking water safety.",
            "Features must fall within physically valid chemical/biological ranges."
        ]
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Persist in DB ModelRegistry
    db.query(ModelRegistry).delete()
    reg = ModelRegistry(
        model_id="cpcb_water_classifier_v1",
        algorithm="Random Forest Classifier (CPCB Standard)",
        accuracy=results[best_model_name]["accuracy"],
        macro_f1=results[best_model_name]["macro_f1"],
        feature_schema=FEATURE_COLS,
        evaluation_metrics=metadata
    )
    db.add(reg)
    db.commit()
    db.close()

    print(f"\nModel training and persistence complete. Saved to {MODEL_PATH}")
    return metadata

def predict_water_quality(input_dict):
    """
    Inference function for predicting CPCB water quality class.
    Validates inputs, executes fitted pipeline, returns class, confidence, and explanations.
    """
    if not os.path.exists(MODEL_PATH) or not os.path.exists(METADATA_PATH):
        # Auto train if missing
        train_and_evaluate_models()

    pipeline = joblib.load(MODEL_PATH)
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    # Build input row
    row_data = {}
    validation_warnings = []
    
    for col in FEATURE_COLS:
        val = input_dict.get(col)
        if val is None or str(val).strip() == "":
            row_data[col] = np.nan
        else:
            try:
                fval = float(val)
                # Range check
                rg = FEATURE_RANGES.get(col)
                if rg and (fval < rg["min"] or fval > rg["max"]):
                    validation_warnings.append(f"{col} value {fval} is outside standard plausible range [{rg['min']}, {rg['max']}] {rg['unit']}.")
                row_data[col] = fval
            except (ValueError, TypeError):
                row_data[col] = np.nan

    # Validate essential inputs: at least pH or DO should be supplied
    if np.isnan(row_data["ph"]) and np.isnan(row_data["dissolved_oxygen"]):
        return {
            "error": "At least pH or Dissolved Oxygen must be provided for classification.",
            "status": "failed"
        }

    input_df = pd.DataFrame([row_data])
    predicted_class = pipeline.predict(input_df)[0]
    
    # Confidence estimation via predict_proba
    probas = pipeline.predict_proba(input_df)[0]
    classes = pipeline.classes_
    class_probs = {c: round(float(p), 4) for c, p in zip(classes, probas)}
    confidence = round(float(np.max(probas)), 4)

    # Calculate key feature contributions
    contributions = []
    importances = meta.get("feature_importances", {})
    for col, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]:
        val = row_data.get(col)
        contributions.append({
            "feature": col,
            "input_value": val if not np.isnan(val) else "Imputed (Median)",
            "unit": FEATURE_RANGES[col]["unit"],
            "importance_weight": imp
        })

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "class_probabilities": class_probs,
        "feature_contributions": contributions,
        "validation_warnings": validation_warnings,
        "model_version": meta.get("model_id"),
        "algorithm": meta.get("algorithm"),
        "timestamp": datetime.utcnow().isoformat(),
        "disclaimer": "This prediction is generated by an environmental machine learning classifier based on CPCB criteria. It does not certify drinking water safety."
    }

if __name__ == "__main__":
    train_and_evaluate_models()
