from pathlib import Path

import joblib
import geopandas as gpd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent.parent / "data"

MODEL = joblib.load(BASE_DIR / "pkls/gb_model.pkl")
LABEL_ENCODER = joblib.load(BASE_DIR / "pkls/gb_label_encoder.pkl")
CAT_CATEGORIES = joblib.load(BASE_DIR / "pkls/gb_cat_categories.pkl")

ECOREGIONS = gpd.read_file(DATA_DIR / "us_eco_l3/us_eco_l3.shp").to_crs("EPSG:4326")
NLCD_RASTER_PATH = DATA_DIR / "Annual_NLCD_LndCov_2024_CU_C1V1/Annual_NLCD_LndCov_2024_CU_C1V1.tif"


FEATURE_ORDER = [
    "hourly_temp_C", "hourly_humidity_percent", "soil_temp_C",
          "cloud_cover_pct", "snow_depth_m", "precip_type",
          "hour_sin", "hour_cos", "day_sin", "day_cos",
          "ecoregion", "land_cover_code"
]

COMMON_NAMES = joblib.load(BASE_DIR / "pkls/common_names.pkl")

ORDER_MAP = joblib.load(BASE_DIR / "pkls/order_map.pkl")

def get_order(species):
    return ORDER_MAP.get(species, "Unknown")