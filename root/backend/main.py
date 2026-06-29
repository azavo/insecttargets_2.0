from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from model_loader import MODEL, LABEL_ENCODER, CAT_CATEGORIES, ECOREGIONS, NLCD_RASTER_PATH, FEATURE_ORDER, COMMON_NAMES, ORDER_MAP, get_order
from features import get_ecoregion, get_land_cover, time_features
from weather import get_weather_for_datetime, precip_phase
from inat import get_user_seen_species


#python -m uvicorn main:app --reload --port 8001

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                    allow_methods=["*"], allow_headers=["*"])

'''
_DATA_DIR = Path(__file__).resolve().parents[2] / "data"
_obs_df = pd.read_csv(_DATA_DIR / "FULL_INSECT_DATA.csv")
_location_tree = cKDTree(_obs_df[["decimalLatitude", "decimalLongitude"]].values)
_species_labels = _obs_df["species"].values

def confirmed_nearby_species(lat, lon, radius_km=5):
    radius_deg = radius_km / 111
    idxs = _location_tree.query_ball_point([lat, lon], r=radius_deg)
    return sorted(set(_species_labels[idxs]))
'''
@app.get("/predict")
def predict(lat: float, lon: float, datetime_str: str | None = None,
            inat_username: str | None = None, mode: str = "all", order: str | None = None):
    dt = datetime.fromisoformat(datetime_str) if datetime_str else datetime.utcnow()

    ecoregion = get_ecoregion(lat, lon, ECOREGIONS)
    land_cover = get_land_cover(lat, lon, NLCD_RASTER_PATH)
    weather = get_weather_for_datetime(lat, lon, dt)
    precip_type = precip_phase(weather["hourly_temp_C"], weather["precip_mm"])
    tfeat = time_features(dt)

    row = {
        "hourly_temp_C": weather["hourly_temp_C"],
        "hourly_humidity_percent": weather["hourly_humidity_percent"],
        "soil_temp_C": weather["soil_temp_C"],
        "cloud_cover_pct": weather["cloud_cover_pct"],
        "snow_depth_m": weather["snow_depth_m"],
        "precip_type": precip_type,
        **tfeat,
        "ecoregion": ecoregion,
        "land_cover_code": land_cover,
    }
    feature_row = pd.DataFrame([row])[FEATURE_ORDER]
    numeric_cols = ["hourly_temp_C", "hourly_humidity_percent", "soil_temp_C",
                    "cloud_cover_pct", "snow_depth_m", "hour_sin", "hour_cos", "day_sin", "day_cos"]
    feature_row[numeric_cols] = feature_row[numeric_cols].astype(float)

    for col, categories in CAT_CATEGORIES.items():
        feature_row[col] = pd.Categorical(feature_row[col], categories=categories)

    probs = MODEL.predict_proba(feature_row)[0]
    ranked = np.argsort(probs)[::-1]

    if mode == "unseen" and inat_username:
        seen = get_user_seen_species(inat_username)
        ranked = [i for i in ranked if LABEL_ENCODER.inverse_transform([i])[0] not in seen]
    if order:
        ranked = [i for i in ranked if get_order(LABEL_ENCODER.inverse_transform([i])[0]) == order]


    top20 = ranked[:20]
    #nearby_set = set(confirmed_nearby_species(lat, lon))

    predictions = [
        {
            "rank": r + 1,
            "species": LABEL_ENCODER.inverse_transform([i])[0],
            "common_name": COMMON_NAMES.get(LABEL_ENCODER.inverse_transform([i])[0], ""),
            "order": get_order(LABEL_ENCODER.inverse_transform([i])[0]),
            "probability": round(float(probs[i]), 4),
    #        "confirmed_nearby": LABEL_ENCODER.inverse_transform([i])[0] in nearby_set,
        }
        for r, i in enumerate(top20)
    ]
    already_shown = {p["species"] for p in predictions}
    #local_specialties = [s for s in nearby_set if s not in already_shown]

    return {
        "ecoregion": ecoregion,
        "weather_is_estimate": weather["is_estimate"],
        "predictions": predictions,
    #    "local_specialties": local_specialties,
    }

@app.get("/orders")
def get_orders():
    return sorted(set(ORDER_MAP.values()))
