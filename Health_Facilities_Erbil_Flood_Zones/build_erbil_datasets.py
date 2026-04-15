import json
from pathlib import Path

import geopandas as gpd
import pandas as pd

RAW = Path('working/raw/downloads')
OUT = Path('working/processed')
OUT.mkdir(parents=True, exist_ok=True)

SOURCE_URLS = {
    'healthsites_csv': 'https://data.humdata.org/dataset/2d76464e-cbf4-4130-a6d9-182e73310c64/resource/009b4c64-ecc0-44fd-aa5d-d6a2d46c4823/download/iraq.csv',
    'cod_adm_geojson_zip': 'https://data.humdata.org/dataset/488bb3cd-3ce9-49d3-862a-3ce7975c63e1/resource/a9ed4d00-1182-4fdc-a0e4-82bbd20786db/download/irq_admin_boundaries.geojson.zip',
    'risk_flood_exposure_csv': 'https://hot.storage.heigit.org/heigit-hdx-public/risk_assessment_inputs/irq/IRQ_ADM2_flood_exposure.csv',
    'risk_demographics_csv': 'https://hot.storage.heigit.org/heigit-hdx-public/risk_assessment_inputs/irq/IRQ_ADM2_demographics.csv',
    'risk_rural_csv': 'https://hot.storage.heigit.org/heigit-hdx-public/risk_assessment_inputs/irq/IRQ_ADM2_rural_population.csv',
}

# 1) Base boundaries
adm2 = gpd.read_file(f"zip://{RAW / 'irq_admin_boundaries.geojson.zip'}!irq_admin2.geojson")
erbil = adm2[adm2['adm1_name'].str.lower() == 'erbil'].copy()
erbil = erbil.to_crs(4326)

# 2) Health facilities -> Erbil subset and coordinate validation
health = pd.read_csv(RAW / 'iraq_healthsites.csv')
health['X'] = pd.to_numeric(health['X'], errors='coerce')
health['Y'] = pd.to_numeric(health['Y'], errors='coerce')
health = health.dropna(subset=['X', 'Y']).copy()
health = health[(health['X'].between(-180, 180)) & (health['Y'].between(-90, 90))].copy()

health_gdf = gpd.GeoDataFrame(
    health,
    geometry=gpd.points_from_xy(health['X'], health['Y']),
    crs='EPSG:4326',
)
health_erbil = gpd.sjoin(
    health_gdf,
    erbil[['adm2_pcode', 'adm2_name', 'geometry']],
    how='inner',
    predicate='within',
)

health_out = health_erbil[
    [
        'name',
        'health_amenity_type',
        'amenity',
        'healthcare',
        'operator',
        'operational_status',
        'beds',
        'X',
        'Y',
        'adm2_pcode',
        'adm2_name',
    ]
].copy()
health_out = health_out.rename(columns={'X': 'longitude', 'Y': 'latitude', 'adm2_name': 'district'})
health_out['facility_type'] = health_out['health_amenity_type']
health_out['facility_type'] = health_out['facility_type'].where(health_out['facility_type'].notna(), health_out['amenity'])
health_out['facility_type'] = health_out['facility_type'].where(health_out['facility_type'].notna(), health_out['healthcare'])
health_out['facility_type'] = health_out['facility_type'].fillna('unknown')
health_out.to_csv(OUT / 'erbil_health_facilities.csv', index=False)

# 3) District boundaries + population attributes
demo = pd.read_csv(RAW / 'IRQ_ADM2_demographics.csv')
rural = pd.read_csv(RAW / 'IRQ_ADM2_rural_population.csv')
demo_cols = ['ADM2_PCODE', 'female_pop', 'children_u5', 'elderly', 'pop_u15']
rural_cols = ['ADM2_PCODE', 'rural_pop_perc']

erbil_districts = erbil.merge(
    demo[demo_cols],
    left_on='adm2_pcode',
    right_on='ADM2_PCODE',
    how='left',
).merge(
    rural[rural_cols],
    left_on='adm2_pcode',
    right_on='ADM2_PCODE',
    how='left',
)
erbil_districts['area_sqkm'] = pd.to_numeric(erbil_districts['area_sqkm'], errors='coerce')
erbil_districts = erbil_districts[
    [
        'adm2_pcode',
        'adm2_name',
        'adm1_name',
        'area_sqkm',
        'female_pop',
        'children_u5',
        'elderly',
        'pop_u15',
        'rural_pop_perc',
        'geometry',
    ]
].rename(
    columns={
        'adm2_pcode': 'district_pcode',
        'adm2_name': 'district_name',
        'adm1_name': 'governorate_name',
    }
)
erbil_districts.to_file(OUT / 'erbil_districts.geojson', driver='GeoJSON')

# 4) Flood zones as district polygons with risk classification (ADM2 flood exposure)
flood = pd.read_csv(RAW / 'IRQ_ADM2_flood_exposure.csv')
zones = erbil_districts.merge(
    flood[['ADM2_PCODE', 'RP10_female_pop_30cm', 'RP50_female_pop_30cm', 'RP100_female_pop_30cm', 'RP500_female_pop_30cm']],
    left_on='district_pcode',
    right_on='ADM2_PCODE',
    how='left',
)

zones['risk_score'] = zones[['RP10_female_pop_30cm', 'RP50_female_pop_30cm', 'RP100_female_pop_30cm', 'RP500_female_pop_30cm']].fillna(0).sum(axis=1)
q1 = zones['risk_score'].quantile(0.33)
q2 = zones['risk_score'].quantile(0.66)

def classify(v):
    if pd.isna(v):
        return 'unknown'
    if v <= q1:
        return 'low'
    if v <= q2:
        return 'medium'
    return 'high'

zones['risk_level'] = zones['risk_score'].apply(classify)
zones['zone_type'] = 'district_flood_exposure_proxy'
zones['source_url'] = SOURCE_URLS['risk_flood_exposure_csv']

flood_zones_out = zones[
    [
        'district_pcode',
        'district_name',
        'risk_level',
        'risk_score',
        'RP10_female_pop_30cm',
        'RP50_female_pop_30cm',
        'RP100_female_pop_30cm',
        'RP500_female_pop_30cm',
        'zone_type',
        'source_url',
        'geometry',
    ]
]
flood_zones_out.to_file(OUT / 'erbil_flood_zones.geojson', driver='GeoJSON')

# 5) Dec-2021 flood footprint fallback (point proxy; no open event polygon found)
# Select three highest-risk district centroids as explicit low-confidence placeholders.
proxy = zones.sort_values('risk_score', ascending=False).head(3).copy()
proxy = proxy.to_crs(3857)
proxy['geometry'] = proxy.geometry.centroid
proxy = proxy.to_crs(4326)
proxy['event_date'] = '2021-12'
proxy['flooded_area_km2'] = None
proxy['source_url'] = SOURCE_URLS['risk_flood_exposure_csv']
proxy['confidence'] = 'low'
proxy['method_note'] = 'No open Dec-2021 event footprint vector found from queried public endpoints; centroid proxy from district flood exposure indicators.'
proxy_points = proxy[
    [
        'district_name',
        'event_date',
        'risk_level',
        'risk_score',
        'flooded_area_km2',
        'source_url',
        'confidence',
        'method_note',
        'geometry',
    ]
]
proxy_points.to_file(OUT / 'december_2021_flood.geojson', driver='GeoJSON')

# 6) Verification summary
health_valid_coords = int((health_out['longitude'].between(-180, 180) & health_out['latitude'].between(-90, 90)).sum())
health_total = len(health_out)
health_by_type = health_out['facility_type'].value_counts().to_dict()

missing_pop = erbil_districts[['female_pop', 'children_u5', 'elderly', 'pop_u15']].isna().any(axis=1).sum()

flood_counts = flood_zones_out['risk_level'].value_counts().to_dict()

verification = {
    'source_urls': SOURCE_URLS,
    'outputs': {
        'erbil_health_facilities.csv': {'rows': health_total, 'valid_coordinate_rows': health_valid_coords, 'type_counts': health_by_type},
        'erbil_districts.geojson': {'district_count': int(len(erbil_districts)), 'district_names': erbil_districts['district_name'].tolist(), 'rows_with_missing_population_fields': int(missing_pop)},
        'erbil_flood_zones.geojson': {'zone_count': int(len(flood_zones_out)), 'risk_level_counts': flood_counts},
        'december_2021_flood.geojson': {'feature_count': int(len(proxy_points)), 'note': 'Fallback proxy points, not observed event footprint polygons.'},
    },
}

(OUT / 'dataset_verification.json').write_text(json.dumps(verification, indent=2))
print('Wrote outputs to', OUT)
