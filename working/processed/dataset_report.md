# Erbil Flood Risk Dataset Preparation Report

## Output Files

1. erbil_health_facilities.csv
2. erbil_flood_zones.geojson
3. erbil_districts.geojson
4. december_2021_flood.geojson
5. dataset_verification.json

## Exact Source URLs Used

- Health facilities (Iraq Healthsites CSV):
  - https://data.humdata.org/dataset/2d76464e-cbf4-4130-a6d9-182e73310c64/resource/009b4c64-ecc0-44fd-aa5d-d6a2d46c4823/download/iraq.csv
- Iraq admin boundaries (COD-AB ADM2 GeoJSON ZIP):
  - https://data.humdata.org/dataset/488bb3cd-3ce9-49d3-862a-3ce7975c63e1/resource/a9ed4d00-1182-4fdc-a0e4-82bbd20786db/download/irq_admin_boundaries.geojson.zip
- Flood exposure indicators (ADM2):
  - https://hot.storage.heigit.org/heigit-hdx-public/risk_assessment_inputs/irq/IRQ_ADM2_flood_exposure.csv
- Demographics (ADM2):
  - https://hot.storage.heigit.org/heigit-hdx-public/risk_assessment_inputs/irq/IRQ_ADM2_demographics.csv
- Rural population indicators (ADM2):
  - https://hot.storage.heigit.org/heigit-hdx-public/risk_assessment_inputs/irq/IRQ_ADM2_rural_population.csv

## Processing Logic

- erbil_health_facilities.csv:
  - Parsed coordinates from X/Y, dropped invalid or missing values.
  - Spatially filtered points to Erbil ADM2 polygons (within test).
  - Kept key attributes and added facility_type from health_amenity_type -> amenity -> healthcare fallback.

- erbil_districts.geojson:
  - Subset COD-AB ADM2 polygons where adm1_name = Erbil.
  - Joined district-level demographic fields and rural_pop_perc using ADM2_PCODE.

- erbil_flood_zones.geojson:
  - Joined ADM2 flood exposure indicators to Erbil district polygons.
  - Built risk_score = RP10 + RP50 + RP100 + RP500 female exposed population metrics.
  - Classified risk_level by Erbil-only terciles: low, medium, high.

- december_2021_flood.geojson:
  - No open, machine-readable Dec-2021 Erbil event footprint polygon was found from queried public endpoints in this session.
  - Created low-confidence fallback proxy points at centroids of top-3 risk-score districts.
  - Marked with confidence=low and a method_note indicating this is not an observed event polygon layer.

## Verification Results

- Health facilities:
  - Rows: 1134
  - Valid coordinate rows: 1134
  - Facility type counts:
    - pharmacy: 450
    - clinic: 258
    - hospital: 218
    - doctors: 125
    - dentist: 57
    - laboratory: 19
    - physiotherapist: 2
    - rehabilitation: 2
    - optometrist: 1
    - alternative: 1
    - blood_donation: 1

- District boundaries:
  - District count: 6
  - Districts: Al-Zibar, Erbil, Koysinjaq, Makhmour, Rawanduz, Shaqlawa
  - Rows missing joined population fields: 0

- Flood zones:
  - Zone count: 6
  - Risk level counts: low=2, medium=2, high=2

- Dec-2021 footprint fallback:
  - Feature count: 3
  - All features explicitly tagged as proxy, low confidence.

## Important Caveats

- The district layer includes population-related indicators from the published ADM2 demographics tables (female_pop, children_u5, elderly, pop_u15, rural_pop_perc), not a census total-population field.
- The flood-zones layer is a district-level exposure proxy derived from published flood indicator tables, not hydrodynamic flood extent polygons.
- The Dec-2021 layer is a fallback proxy point product due missing open event polygons during this run.
