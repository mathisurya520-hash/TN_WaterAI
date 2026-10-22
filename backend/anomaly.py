import numpy as np
import pandas as pd

def detect_parameter_anomalies(observations, param_name="dissolved_oxygen"):
    """
    Detect statistical anomalies in a list of Observation objects for a specific parameter using IQR.
    Returns list of outlier records with deviation magnitude and contextual explanation.
    """
    values = []
    valid_obs = []
    for obs in observations:
        v = getattr(obs, param_name, None)
        if v is not None and not np.isnan(v):
            values.append(v)
            valid_obs.append(obs)
            
    if len(values) < 10:
        return []

    s = pd.Series(values)
    q25 = s.quantile(0.25)
    q75 = s.quantile(0.75)
    iqr = q75 - q25
    lower_bound = q25 - 1.5 * iqr
    upper_bound = q75 + 1.5 * iqr

    anomalies = []
    for obs, val in zip(valid_obs, values):
        if val < lower_bound or val > upper_bound:
            dev = round(abs(val - s.median()) / (iqr if iqr > 0 else 1.0), 2)
            direction = "Unusually High" if val > upper_bound else "Unusually Low"
            anomalies.append({
                "observation_id": obs.id,
                "station_name": obs.station_name,
                "district_name": obs.district_name,
                "acquisition_time": obs.acquisition_time.isoformat() if obs.acquisition_time else None,
                "parameter": param_name,
                "measured_value": round(float(val), 2),
                "normal_range": [round(float(lower_bound), 2), round(float(upper_bound), 2)],
                "median": round(float(s.median()), 2),
                "iqr_deviation": dev,
                "direction": direction,
                "context": f"Measured {param_name} of {val} is {direction.lower()} compared to Tamil Nadu regional baseline [Q25: {q25:.1f}, Q75: {q75:.1f}]. Requires environmental review."
            })

    return sorted(anomalies, key=lambda x: x["iqr_deviation"], reverse=True)
