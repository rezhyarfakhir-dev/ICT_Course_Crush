#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const INPUT = path.join(repoRoot, 'data', 'processed', 'governorates_climate.geojson');

function flattenCoords(coords, acc = []) {
  if (!Array.isArray(coords)) return acc;
  if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    acc.push(coords);
    return acc;
  }
  for (const item of coords) flattenCoords(item, acc);
  return acc;
}

function ringClosed(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return Array.isArray(first) && Array.isArray(last) && first[0] === last[0] && first[1] === last[1];
}

function validateGeometry(feature, i, issues) {
  const g = feature.geometry;
  const where = `feature[${i}]`;

  if (!g || !g.type || !g.coordinates) {
    issues.push(`${where}: missing geometry`);
    return;
  }

  const points = flattenCoords(g.coordinates);
  if (!points.length) {
    issues.push(`${where}: empty coordinate list`);
    return;
  }

  for (const [lon, lat] of points) {
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      issues.push(`${where}: coordinate out of world bounds (${lon}, ${lat})`);
      break;
    }
    if (lon < 38 || lon > 49 || lat < 29 || lat > 39) {
      issues.push(`${where}: coordinate outside expected Iraq envelope (${lon}, ${lat})`);
      break;
    }
  }

  if (g.type === 'Polygon') {
    const outer = g.coordinates[0];
    if (!ringClosed(outer)) issues.push(`${where}: polygon outer ring is not closed`);
  }

  if (g.type === 'MultiPolygon') {
    for (let p = 0; p < g.coordinates.length; p += 1) {
      const outer = g.coordinates[p][0];
      if (!ringClosed(outer)) {
        issues.push(`${where}: multipolygon part ${p} outer ring is not closed`);
        break;
      }
    }
  }
}

async function main() {
  let data;
  try {
    data = JSON.parse(await readFile(INPUT, 'utf8'));
  } catch {
    console.error(`Cannot read input file: ${INPUT}`);
    process.exit(1);
  }

  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    console.error('GEO QA ERROR: Root must be a FeatureCollection.');
    process.exit(1);
  }

  const issues = [];
  data.features.forEach((f, i) => validateGeometry(f, i, issues));

  if (issues.length) {
    issues.forEach((msg) => console.error(`GEO QA ERROR: ${msg}`));
    process.exit(1);
  }

  console.log(`Geospatial QA OK: ${data.features.length} features checked.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
