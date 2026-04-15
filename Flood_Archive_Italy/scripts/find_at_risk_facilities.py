# ============================================================
# find_at_risk_facilities.py
# ============================================================
# What this script does (in plain English):
#
# 1. Loads the Italy flood events GeoJSON (42 events).
# 2. Loads the Italy health facilities GeoJSON (30,146 sites).
# 3. For each health facility, checks whether ANY flood event
#    happened within 1 km of it.
# 4. If yes, that facility is "at risk" — it gets saved into
#    a new, smaller GeoJSON file.
# 5. Prints a summary so you know how many sites are at risk.
# ============================================================

import json, math

# ── Step 1: Haversine distance ─────────────────────────────
# The Haversine formula calculates the straight-line distance
# between two points on Earth given their latitude & longitude.
# It returns the distance in kilometres.

def haversine_km(lon1, lat1, lon2, lat2):
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# ── Step 2: Load datasets ─────────────────────────────────
with open("Flood_Archive_Italy/data/italy_floods.geojson") as f:
    floods = json.load(f)["features"]

with open("Flood_Archive_Italy/data/italy_health_facilities.geojson") as f:
    health = json.load(f)["features"]

print(f"Flood events loaded:      {len(floods)}")
print(f"Health facilities loaded:  {len(health)}")

# ── Step 3: Extract flood coordinates ──────────────────────
# We pull out [lon, lat] for every flood event once, so we
# don't re-read them for every health facility.
flood_coords = []
for feat in floods:
    lon, lat = feat["geometry"]["coordinates"]
    flood_coords.append((lon, lat))

# ── Step 4: Find at-risk facilities ────────────────────────
# A facility is "at risk" if it is within 1 km of ANY flood.
THRESHOLD_KM = 1.0
at_risk = []

for i, feat in enumerate(health):
    lon, lat = feat["geometry"]["coordinates"]
    for flon, flat in flood_coords:
        dist = haversine_km(lon, lat, flon, flat)
        if dist <= THRESHOLD_KM:
            # Add the distance and matching flood info
            feat = json.loads(json.dumps(feat))  # deep copy
            feat["properties"]["flood_dist_km"] = round(dist, 3)
            at_risk.append(feat)
            break  # one match is enough

    # Progress indicator every 5000 facilities
    if (i + 1) % 5000 == 0:
        print(f"  checked {i + 1}/{len(health)} facilities...")

# ── Step 5: Save the at-risk subset ───────────────────────
output = {
    "type": "FeatureCollection",
    "features": at_risk
}
out_path = "Flood_Archive_Italy/data/italy_health_at_risk.geojson"
with open(out_path, "w") as f:
    json.dump(output, f)

print(f"\n{'='*50}")
print(f"At-risk facilities (within {THRESHOLD_KM} km of a flood): {len(at_risk)}")
print(f"Saved to: {out_path}")

# Quick breakdown by type
from collections import Counter
types = Counter(f["properties"]["t"] for f in at_risk)
for t, count in types.most_common():
    print(f"  {t}: {count}")
