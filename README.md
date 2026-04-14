# ICT_Course_Crush

This repository contains two standalone GitHub Pages maps:

- Kurdistan Region Climate Affected Areas Map
- Global Flooding Map

Live links:

- https://rezhyarfakhir-dev.github.io/ICT_Course_Crush/Kurdistan%20Region%20Climate%20Affected%20Areas%20Map/
- https://rezhyarfakhir-dev.github.io/ICT_Course_Crush/flooding%20map/
- https://rezhyarfakhir-dev.github.io/ICT_Course_Crush/

## Climate Data Pipeline

Run the reproducible climate data checks:

```bash
node scripts/run-data-checks.mjs
```

This command runs:

- `scripts/build-climate-dataset.mjs`
- `scripts/validate-climate-schema.mjs`
- `scripts/geospatial-qa.mjs`

Processed output files:

- `data/processed/governorates_climate.geojson`
- `data/processed/governorates_climate.metadata.json`

The climate map now attempts to load the processed dataset first and falls back to the legacy local dataset if needed.
