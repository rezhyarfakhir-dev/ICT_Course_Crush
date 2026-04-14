import fs from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';

const sourcePath = path.resolve('flooding map/floodarchive.xlsx');
const outPath = path.resolve('flooding map/floodEvents.geojson');

const workbook = xlsx.readFile(sourcePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

const toDate = (serial) => {
  if (typeof serial !== 'number') return null;
  const parsed = xlsx.SSF.parse_date_code(serial);
  if (!parsed) return null;
  const yyyy = String(parsed.y).padStart(4, '0');
  const mm = String(parsed.m).padStart(2, '0');
  const dd = String(parsed.d).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const validRows = rows.filter((r) => Number.isFinite(Number(r.long)) && Number.isFinite(Number(r.lat)));

const features = validRows.map((row) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [Number(row.long), Number(row.lat)],
  },
  properties: {
    id: Number(row.ID) || null,
    country: row.Country || null,
    otherCountry: row.OtherCountry || null,
    areaKm2: Number.isFinite(Number(row.Area)) ? Number(row.Area) : null,
    began: toDate(row.Began),
    ended: toDate(row.Ended),
    validation: row.Validation || null,
    dead: Number.isFinite(Number(row.Dead)) ? Number(row.Dead) : null,
    displaced: Number.isFinite(Number(row.Displaced)) ? Number(row.Displaced) : null,
    mainCause: row.MainCause || null,
    severity: Number.isFinite(Number(row.Severity)) ? Number(row.Severity) : null,
  },
}));

const geojson = {
  type: 'FeatureCollection',
  name: 'FloodArchive',
  features,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(geojson));

console.log(`Converted ${features.length} records to ${outPath}`);
