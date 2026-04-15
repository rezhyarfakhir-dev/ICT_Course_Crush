#!/usr/bin/env python3
"""Transform floodarchive.xlsx into clean CSV + GeoJSON for interactive mapping."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pandas as pd


def normalize_col(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(name).strip().lower()).strip("_")


def first_match(columns: list[str], aliases: list[str]) -> str | None:
    colset = set(columns)
    for alias in aliases:
        if alias in colset:
            return alias
    for alias in aliases:
        for col in columns:
            if alias in col:
                return col
    return None


def to_text(value) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def to_float(value):
    try:
        if pd.isna(value):
            return None
        return float(value)
    except Exception:
        return None


def parse_date(value) -> str:
    if pd.isna(value):
        return ""
    try:
        ts = pd.to_datetime(value, errors="coerce")
        if pd.isna(ts):
            return ""
        return ts.date().isoformat()
    except Exception:
        return ""


def clean_severity(value: str) -> str:
    v = value.lower().strip()
    if not v:
        return "unknown"
    if any(k in v for k in ["very high", "extreme", "critical", "severe"]):
        return "very high"
    if "high" in v:
        return "high"
    if "medium" in v or "moderate" in v:
        return "medium"
    if "low" in v:
        return "low"
    return value.strip()


def transform(input_xlsx: Path, output_dir: Path) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)

    xls = pd.ExcelFile(input_xlsx)
    if not xls.sheet_names:
        raise ValueError("Workbook has no sheets")

    frame_list = []
    for sheet in xls.sheet_names:
        df = pd.read_excel(input_xlsx, sheet_name=sheet)
        if df.empty:
            continue
        df["_sheet_name"] = sheet
        frame_list.append(df)

    if not frame_list:
        raise ValueError("Workbook has no non-empty sheets")

    raw = pd.concat(frame_list, ignore_index=True)
    raw.columns = [normalize_col(c) for c in raw.columns]

    cols = list(raw.columns)

    lat_col = first_match(
        cols,
        [
            "latitude",
            "lat",
            "y",
            "y_coord",
            "gps_lat",
            "coord_y",
            "lat_dd",
        ],
    )
    lon_col = first_match(
        cols,
        [
            "longitude",
            "lon",
            "lng",
            "x",
            "x_coord",
            "gps_lon",
            "coord_x",
            "long_dd",
        ],
    )

    if not lat_col or not lon_col:
        raise ValueError(
            "Could not detect latitude/longitude columns. Please ensure the workbook has lat/lon fields."
        )

    id_col = first_match(cols, ["id", "record_id", "objectid", "fid", "gid"])
    name_col = first_match(cols, ["name", "title", "site_name", "location_name", "event", "incident"])
    gov_col = first_match(cols, ["governorate", "gov", "province", "admin1"])
    district_col = first_match(cols, ["district", "admin2", "subdistrict", "sub_district"])
    category_col = first_match(cols, ["category", "type", "hazard", "event_type", "facility_type"])
    status_col = first_match(cols, ["status", "condition", "state"])
    severity_col = first_match(cols, ["severity", "risk", "alert_level", "impact"])
    date_col = first_match(cols, ["date", "event_date", "incident_date", "timestamp", "created_at"])
    notes_col = first_match(cols, ["description", "notes", "remarks", "comment", "details"])
    source_col = first_match(cols, ["source", "origin", "dataset", "reference"])

    records = []
    for idx, row in raw.iterrows():
        lat = to_float(row.get(lat_col))
        lon = to_float(row.get(lon_col))
        if lat is None or lon is None:
            continue
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            continue

        rec = {
            "id": to_text(row.get(id_col)) or f"row-{idx + 1}",
            "name": to_text(row.get(name_col)) or "Unnamed location",
            "governorate": to_text(row.get(gov_col)),
            "district": to_text(row.get(district_col)),
            "category": to_text(row.get(category_col)) or "uncategorized",
            "status": to_text(row.get(status_col)) or "unknown",
            "severity": clean_severity(to_text(row.get(severity_col))),
            "event_date": parse_date(row.get(date_col)),
            "description": to_text(row.get(notes_col)),
            "source": to_text(row.get(source_col)) or "floodarchive.xlsx",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "sheet_name": to_text(row.get("_sheet_name")),
        }
        records.append(rec)

    clean = pd.DataFrame(records)
    if clean.empty:
        raise ValueError("No valid rows with coordinates were found in workbook")

    clean = clean.drop_duplicates(subset=["id", "latitude", "longitude"], keep="first")
    clean = clean.sort_values(by=["event_date", "severity", "name"], ascending=[False, True, True])

    csv_path = output_dir / "floodarchive_clean.csv"
    clean.to_csv(csv_path, index=False)

    features = []
    for rec in clean.to_dict(orient="records"):
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [rec["longitude"], rec["latitude"]],
                },
                "properties": {
                    k: v
                    for k, v in rec.items()
                    if k not in ["longitude", "latitude"]
                },
            }
        )

    geojson = {"type": "FeatureCollection", "features": features}
    geo_path = output_dir / "floodarchive.geojson"
    geo_path.write_text(json.dumps(geojson, ensure_ascii=True), encoding="utf-8")

    summary = {
        "input_file": str(input_xlsx),
        "sheet_count": len(xls.sheet_names),
        "rows_read": int(len(raw)),
        "rows_exported": int(len(clean)),
        "unique_categories": sorted(
            [v for v in clean["category"].dropna().astype(str).unique().tolist() if v]
        ),
        "unique_severity": sorted(
            [v for v in clean["severity"].dropna().astype(str).unique().tolist() if v]
        ),
        "output_csv": str(csv_path),
        "output_geojson": str(geo_path),
    }

    summary_path = output_dir / "transform_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Transform floodarchive Excel file for map UI")
    parser.add_argument(
        "--input",
        default="Flood_Archive/floodarchive.xlsx",
        help="Path to input workbook (default: Flood_Archive/floodarchive.xlsx)",
    )
    parser.add_argument(
        "--output-dir",
        default="Flood_Archive/data",
        help="Output directory for clean CSV and GeoJSON",
    )
    args = parser.parse_args()

    input_xlsx = Path(args.input)
    output_dir = Path(args.output_dir)

    if not input_xlsx.exists():
        raise SystemExit(
            "Input workbook not found. Place your file at Flood_Archive/floodarchive.xlsx or pass --input."
        )

    summary = transform(input_xlsx=input_xlsx, output_dir=output_dir)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
