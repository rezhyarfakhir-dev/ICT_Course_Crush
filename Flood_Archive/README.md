# Flood_Archive workflow

This folder contains a ready workflow to transform `floodarchive.xlsx` into a clean geospatial dataset and render an interactive map with:

- top banner
- search bar
- filters for district, category, severity, and status

## 1) Place the workbook

Copy your file into this exact path:

`Flood_Archive/floodarchive.xlsx`

## 2) Transform the workbook

From repository root:

```bash
/workspaces/ICT_Course_Crush/.venv/bin/python Flood_Archive/scripts/transform_floodarchive.py
```

Optional custom path:

```bash
/workspaces/ICT_Course_Crush/.venv/bin/python Flood_Archive/scripts/transform_floodarchive.py --input /path/to/floodarchive.xlsx
```

Outputs are written to `Flood_Archive/data`:

- `floodarchive_clean.csv`
- `floodarchive.geojson`
- `transform_summary.json`

## 3) Open the map

Open:

- `Flood_Archive/index.html`

The map automatically reads `Flood_Archive/data/floodarchive.geojson`.
