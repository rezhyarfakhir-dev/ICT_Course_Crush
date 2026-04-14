# Climate Data Pipeline

This project uses a script-based pipeline to generate and validate the climate dataset.

## Commands

Run all checks:

```bash
node scripts/run-data-checks.mjs
```

Run steps individually:

```bash
node scripts/build-climate-dataset.mjs
node scripts/validate-climate-schema.mjs
node scripts/geospatial-qa.mjs
```

## Inputs and Outputs

Input:
- `data/raw/boundaries.geojson`

Outputs:
- `data/processed/governorates_climate.geojson`
- `data/processed/governorates_climate.metadata.json`

## Validation Rules (Current)
- Required GeoJSON FeatureCollection structure
- Required fields per feature (`name`, climate indicators, confidence)
- Numeric ranges:
  - `droughtRisk`: 0 to 100
  - `desertification`: 0 to 100
  - `tempIncrease`: 0 to 6
- Geospatial checks:
  - Coordinates inside world bounds
  - Coordinates inside an Iraq envelope check
  - Polygon ring closure

## Important Notes
- Current metric values are placeholders until approved sources are integrated.
- Do not manually edit `data/processed/*` values.
- Update `data/sources/registry.csv` before adding a new source.
