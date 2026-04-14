#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const steps = [
  'build-climate-dataset.mjs',
  'validate-climate-schema.mjs',
  'geospatial-qa.mjs'
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, step);
    const child = spawn(process.execPath, [fullPath], { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Step failed: ${step}`));
    });
  });
}

async function main() {
  for (const step of steps) {
    console.log(`\n=== Running ${step} ===`);
    await runStep(step);
  }
  console.log('\nAll data checks passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
