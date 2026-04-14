#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const INPUT = path.join(repoRoot, 'data', 'processed', 'governorates_climate.geojson');
const CONFIDENCE_SET = new Set(['high', 'medium', 'low']);

function fail(msg) {
  console.error(`SCHEMA ERROR: ${msg}`);
}

function inRange(n, min, max) {
  return Number.isFinite(n) && n >= min && n <= max;
}

function validateFeature(feature, i, errors) {
  const where = `feature[${i}]`;

  if (!feature || feature.type !== 'Feature') {
    errors.push(`${where} is not a GeoJSON Feature`);
    return;
  }

  const p = feature.properties || {};
  if (!p.name || typeof p.name !== 'string') {
    errors.push(`${where}.properties.name must be a non-empty string`);
  }

  if (!inRange(Number(p.droughtRisk), 0, 100)) {
    errors.push(`${where}.properties.droughtRisk must be in [0,100]`);
  }

  if (!inRange(Number(p.desertification), 0, 100)) {
    errors.push(`${where}.properties.desertification must be in [0,100]`);
  }

  if (!inRange(Number(p.tempIncrease), 0, 6)) {
    errors.push(`${where}.properties.tempIncrease must be in [0,6]`);
  }

  if (!CONFIDENCE_SET.has(String(p.confidence || '').toLowerCase())) {
    errors.push(`${where}.properties.confidence must be one of high|medium|low`);
  }

  if (!feature.geometry || typeof feature.geometry.type !== 'string') {
    errors.push(`${where}.geometry is missing or invalid`);
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

  const errors = [];
  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    errors.push('Root must be a GeoJSON FeatureCollection with features[]');
  } else {
    data.features.forEach((f, i) => validateFeature(f, i, errors));
  }

  if (errors.length) {
    errors.forEach(fail);
    process.exit(1);
  }

  console.log(`Schema OK: ${data.features.length} features validated.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
