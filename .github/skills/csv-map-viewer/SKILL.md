---
name: csv-map-viewer
description: "Build a single-file HTML web app that loads and visualises any user-uploaded CSV on an interactive Leaflet map with sidebar filters, stats, clustering, and dark-teal UI. Use when the user asks to create a map viewer, CSV visualiser, or dashboard that plots CSV data on a map. Also covers publishing to GitHub Pages on a unique URL."
---

# CSV Map Viewer — Reusable Skill

Build a **single-file `index.html`** (or `map.html`) that lets the user upload any CSV containing latitude/longitude columns and instantly visualise it on a Leaflet map. The app must also support a **built-in dataset** that auto-loads on page open.

---

## Architecture

**Single HTML file** — all CSS and JS inline. No build step, no bundler, no server.

```
<folder-name>/
  index.html              ← the web app (self-contained)
  <dataset>.csv           ← optional built-in CSV (fetched by the app)
```

---

## External Dependencies (CDN)

Load these from unpkg in `<head>`:

| Library              | Version | Purpose              |
|----------------------|---------|----------------------|
| Leaflet              | 1.9.4   | Map engine           |
| Leaflet.MarkerCluster| 1.5.3   | Marker clustering    |
| PapaParse            | 5.4.1   | CSV parsing          |
| Google Fonts         | —       | Inter + JetBrains Mono |

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500" rel="stylesheet" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<script src="https://unpkg.com/papaparse@5.4.1/papaparse.min.js"></script>
```

---

## Design System

### Color Tokens (CSS custom properties on `:root`)

| Token        | Value                         | Purpose                |
|--------------|-------------------------------|------------------------|
| `--bg`       | `#0d1117`                     | Page background        |
| `--surface`  | `#161b22`                     | Sidebar, cards         |
| `--surface-2`| `#21262d`                     | Inputs, secondary bg   |
| `--border`   | `#30363d`                     | All borders            |
| `--teal`     | `#2dd4bf`                     | Primary accent         |
| `--teal-dim` | `rgba(45,212,191,0.12)`       | Subtle teal bg         |
| `--amber`    | `#f59e0b`                     | Warning / moderate     |
| `--red`      | `#f87171`                     | Error / severe         |
| `--text`     | `#e6edf3`                     | Primary text           |
| `--text-muted`| `#8b949e`                    | Secondary text         |

### Layout Constants

| Token          | Value  |
|----------------|--------|
| `--sidebar-w`  | 320px  |
| `--nav-h`      | 56px   |

### Typography

- **Primary**: `'Inter', system-ui, sans-serif`
- **Monospace** (stats, numbers): `'JetBrains Mono', monospace`
- Nav title: 15px / 600
- Section labels: 10px / 700 / uppercase / 0.08em letter-spacing
- Stat values: 20px / 700 / JetBrains Mono
- Body text: 12-13px / 400-500

### Page Layout (flexbox, no media queries)

```
┌──────────────────────────────────────────────────┐
│ <nav>  56px  — sticky, blur backdrop, z-1000     │
├──────────────┬───────────────────────────────────┤
│ <aside>      │  <div class="map-wrap">           │
│ 320px fixed  │    #map (Leaflet, absolute fill)  │
│ scrollable   │    #empty-state (overlay)         │
│              │                                   │
│ • Drop zone  │                                   │
│ • Stats 2x2  │                                   │
│ • Filters    │                                   │
│ • Legend     │                                   │
│ • Clear btn  │                                   │
└──────────────┴───────────────────────────────────┘
```

- Nav: `position: sticky; top: 0; backdrop-filter: blur(12px); background: rgba(13,17,23,0.85);`
- Sidebar: `position: fixed; width: var(--sidebar-w); overflow-y: auto;`
- Map wrap: `margin-left: var(--sidebar-w); flex: 1;`

---

## HTML Structure

### Nav
- Brand icon (teal circle + SVG) + app title
- Badge showing event count (`id="event-count"`, updated dynamically)

### Sidebar sections (top to bottom)

1. **Drop zone** — `<div class="drop-zone" id="drop-zone">`
   - Hidden `<input type="file" accept=".csv,.xls,.txt">`
   - Upload icon SVG + "Drop your CSV here" text
   - Hint text showing expected columns

2. **Load built-in button** — `<button id="load-builtin">`
   - Download icon + "Load built-in {dataset name}" text
   - Fetches the CSV file from same directory

3. **Column picker** — `<div id="col-picker-section">` (hidden by default)
   - Two `<select>` dropdowns for lat/lng column selection
   - Amber warning note
   - "Apply & Plot Map" button
   - Only shown if auto-detection fails

4. **Stats grid** — 2×2 CSS grid of stat cards
   - Each card: value (`id="stat-*"`) + label + sublabel
   - Adapt stat names to match the CSV domain (e.g., for earthquake data: "Magnitude" instead of "Severity")

5. **Filters** — dynamically populated from CSV columns
   - Category/type dropdown (auto-detected column)
   - Severity/level dropdown (auto-detected column)
   - Year/date range slider (auto-detected column, hidden if not found)

6. **Legend** — colored dots with labels matching the marker color scheme

7. **Clear button** — resets all state

### Map container
- `#map` — Leaflet map root
- `#empty-state` — centered overlay when no data loaded

### Extras
- `#loader` — 2px loading bar (fixed top, teal, animated width)
- `#toast` — bottom-right notification (auto-hides after 3.5s)

---

## JavaScript Logic

### State variables

```javascript
let allRows = [];      // Full parsed CSV rows
let columns = [];      // Column headers
let latCol = null;     // Detected/selected lat column
let lngCol = null;     // Detected/selected lng column
let clusterGroup;      // L.markerClusterGroup
let map;               // L.map
```

### Map initialization

```javascript
const map = L.map('map', {
  zoomControl: true,
  preferCanvas: true,
  maxBounds: [[-85, -180], [85, 180]],
  maxBoundsViscosity: 1.0,
  minZoom: 2
}).setView([20, 10], 2);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: '© Esri, HERE, Garmin, USGS, NGA',
  maxZoom: 19,
  crossOrigin: true,
  noWrap: true
}).addTo(map);

clusterGroup = L.markerClusterGroup({ maxClusterRadius: 60 });
map.addLayer(clusterGroup);
setTimeout(() => map.invalidateSize(), 100);
window.addEventListener('resize', () => map.invalidateSize());
```

### Lat/Lng auto-detection: `detectLatLng(cols)`

Multi-level fuzzy matching (case-insensitive):
1. **Exact match** against keyword lists:
   - Lat: `['lat', 'latitude', 'centroid_y', 'y_coord', 'ylat', 'geo_lat']`
   - Lng: `['long', 'lon', 'lng', 'longitude', 'centroid_x', 'x_coord', 'xlon', 'geo_lon', 'geo_long']`
2. **Substring**: `.includes('lat')` / `.includes('lon')` or `.includes('lng')`
3. **Single letter**: column named `'y'` / `'x'`

Falls back to column picker if detection fails.

### CSV loading: `loadData(text, filename)`

```javascript
Papa.parse(text, {
  header: true,
  skipEmptyLines: true,
  complete(result) {
    columns = result.meta.fields;
    const rows = result.data;
    if (!detectLatLng(columns)) { showColumnPicker(columns, rows, filename); return; }
    allRows = rows;
    populateFilters(rows, columns);
    renderMarkers(rows);
    map.setView([20, 10], 2);
  }
});
```

### Marker creation: `makeMarker(row)`

1. Parse lat/lng from row
2. Determine color via a **color function** based on a key column (adapt per dataset)
3. Create `L.divIcon` — 10px colored circle with glow (`box-shadow: 0 0 6px`)
4. Build popup from all non-lat/lng, non-empty fields
5. Return `L.marker` with bound popup

### Filter system

- Dropdowns populated from unique values in detected columns
- Year slider populated from min/max of year column
- `applyFilters()` chains all active filters → calls `renderMarkers(filtered)`

### Auto-load on page open

Last line of `<script>`:
```javascript
document.getElementById('load-builtin').click();
```

---

## Adapting for a New CSV

When the user asks to create a new viewer for a different dataset:

1. **Identify the key columns** in the new CSV:
   - Which column(s) map to lat/lng
   - Which column should drive marker color (severity, category, type, etc.)
   - Which columns should appear as stats (sum, count, unique)
   - Which columns should be filterable (dropdowns, sliders)

2. **Customise the color function** to match the new data domain:
   ```javascript
   function markerColor(row) {
     const val = parseFloat(row['magnitude']);
     if (val >= 7) return '#f87171';  // red
     if (val >= 5) return '#f59e0b';  // amber
     if (val >= 3) return '#2dd4bf';  // teal
     return '#a78bfa';                // purple
   }
   ```

3. **Update the legend** to match the new color thresholds.

4. **Update stat cards** — change IDs, labels, and calculation logic.

5. **Update filter detection keywords** — add column name variants for the new dataset.

6. **Update the nav title and badge** text.

7. **Place the CSV** in the same folder as the HTML file. Update the `fetch()` URL in the load-builtin handler.

---

## Publishing Process

**Always publish on GitHub Pages, main branch, with a unique URL.**

### Step-by-step

1. **Create a new folder** at the repository root with a descriptive name:
   ```
   /workspaces/ICT_Course_Crush/<New_Project_Name>/
   ```
   - Use underscores or hyphens, no spaces
   - This becomes the URL path segment

2. **Build the app** as a single `index.html` inside that folder.

3. **Place the CSV** (if any built-in dataset) in the same folder.

4. **Commit and push to `main`**:
   ```bash
   cd /workspaces/ICT_Course_Crush
   git add <New_Project_Name>/
   git commit -m "feat: add <New_Project_Name> CSV map viewer"
   git push origin main
   ```

5. **The URL** will be:
   ```
   https://rezhyarfakhir-dev.github.io/ICT_Course_Crush/<New_Project_Name>/
   ```
   This is automatically separate from all other GitHub Pages URLs in the repo because each folder gets its own path.

6. **No GitHub Pages configuration needed** — the repo already has Pages enabled on `main`. Any new folder with an `index.html` is instantly accessible.

### URL uniqueness rule

Every new project gets its own top-level folder. Never put new projects inside existing project folders. This guarantees every project has a unique, non-conflicting URL:

```
rezhyarfakhir-dev.github.io/ICT_Course_Crush/Global_Flood_Dashbaord/
rezhyarfakhir-dev.github.io/ICT_Course_Crush/Flood_Archive/
rezhyarfakhir-dev.github.io/ICT_Course_Crush/Flood_Archive_Italy/
rezhyarfakhir-dev.github.io/ICT_Course_Crush/<New_Project_Name>/   ← new
```

---

## Reference Implementation

The canonical implementation is at:
```
/workspaces/ICT_Course_Crush/Global_Flood_Dashbaord/map.html
```

When building a new viewer, use that file as the template and adapt the sections marked above.
