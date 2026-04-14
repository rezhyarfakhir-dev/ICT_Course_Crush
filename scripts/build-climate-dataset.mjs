#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const RAW_DIR = path.join(repoRoot, 'data', 'raw');
const STAGING_DIR = path.join(repoRoot, 'data', 'staging');
const PROCESSED_DIR = path.join(repoRoot, 'data', 'processed');

const INPUT_BOUNDARIES = path.join(RAW_DIR, 'boundaries.geojson');
const OUTPUT_DATASET = path.join(PROCESSED_DIR, 'governorates_climate.geojson');
const OUTPUT_METADATA = path.join(PROCESSED_DIR, 'governorates_climate.metadata.json');

function nowIso() {
  return new Date().toISOString();
}

async function ensureFolders() {
  await mkdir(STAGING_DIR, { recursive: true });
  await mkdir(PROCESSED_DIR, { recursive: true });
}

function validateFeatureCollection(fc) {
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new Error('Input boundaries must be a GeoJSON FeatureCollection.');
  }
}

function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildPlaceholderIndicators(feature) {
  const p = feature.properties || {};

  // Placeholder values. Replace with sourced calculations in CLM-005.
  const droughtRisk = toNumberOrNull(p.droughtRisk);
  const tempIncrease = toNumberOrNull(p.tempIncrease);
  const desertification = toNumberOrNull(p.desertification);

  return {
    droughtRisk,
    tempIncrease,
    desertification,
    confidence: 'low',
    sourceStatus: 'placeholder'
  };
}

function transform(boundaries) {
  return {
    type: 'FeatureCollection',
    generatedAt: nowIso(),
    generationMethod: 'scripts/build-climate-dataset.mjs',
    features: boundaries.features.map((feature) => {
      const p = feature.properties || {};
      const indicators = buildPlaceholderIndicators(feature);

      return {
        type: 'Feature',
        properties: {
          name: p.name || p.NAME_1 || 'Unknown',
          adminCode: p.admin_code || p.HASC_1 || null,
          ...indicators,
          sourceYear: null,
          sourceReference: null,
          license: null
        },
        geometry: feature.geometry
      };
    })
  };
}

async function main() {
  await ensureFolders();

  let boundaries;
  try {
    const raw = await readFile(INPUT_BOUNDARIES, 'utf8');
    boundaries = JSON.parse(raw);
  } catch (error) {
    console.error('Missing input file:', INPUT_BOUNDARIES);
    console.error('Add a boundary file in data/raw/boundaries.geojson and rerun.');
    process.exit(1);
  }

  validateFeatureCollection(boundaries);

  const output = transform(boundaries);

  const metadata = {
    generatedAt: output.generatedAt,
    generator: 'build-climate-dataset.mjs',
    note: 'Placeholder scaffold. Replace placeholder indicators with sourced calculations before release.',
    requiredBeforeRelease: [
      'Populate sourceYear/sourceReference/license',
      'Replace placeholder indicator values with computed values from approved sources',
      'Run schema and geospatial QA checks'
    ]
  };

  await writeFile(OUTPUT_DATASET, JSON.stringify(output, null, 2) + '\n', 'utf8');
  await writeFile(OUTPUT_METADATA, JSON.stringify(metadata, null, 2) + '\n', 'utf8');

  console.log('Generated:', OUTPUT_DATASET);
  console.log('Generated:', OUTPUT_METADATA);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
