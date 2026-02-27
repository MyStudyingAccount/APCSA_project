#!/usr/bin/env node
/**
 * validate-pokemon.js
 *
 * Validates the generated docs/data/pokemon.json, ensuring:
 *  - All 1025 base Pokémon (national # 1–1025) are present
 *  - Each entry has required fields (non-null for core fields)
 *  - No duplicate IDs
 *  - Numeric values are in reasonable ranges
 *  - Categorical values are from known sets
 *
 * Usage:
 *   cd scripts && node validate-pokemon.js
 *
 * Exit code: 0 = success, 1 = failures found
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------
const dataPath = path.join(__dirname, '..', 'docs', 'data', 'pokemon.json');
if (!fs.existsSync(dataPath)) {
  console.error('ERROR: pokemon.json not found at', dataPath);
  console.error('Run: cd scripts && node build-pokemon.js');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// ---------------------------------------------------------------------------
// Known value sets for categorical validation
// ---------------------------------------------------------------------------
const VALID_TYPES = new Set([
  'normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy',
]);

const VALID_COLORS = new Set([
  'black','blue','brown','gray','green','pink','purple','red','white','yellow',
]);

const VALID_GENDER_BUCKETS = new Set([
  'genderless','100m','87.5m','75m','50m50f','25m','12.5m','100f',
]);

const VALID_EGG_GROUPS = new Set([
  'monster','water-1','water-2','water-3','bug','flying','field','grass','humanlike','mineral',
  'amorphous','water1','water2','water3','human-like',
  'ditto','fairy','dragon','undiscovered',
]);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
let failures = 0;
let warnings = 0;

function fail(msg) {
  console.error('FAIL:', msg);
  failures++;
}

function warn(msg) {
  console.warn('WARN:', msg);
  warnings++;
}

// 1. Check array
if (!Array.isArray(data)) {
  fail('pokemon.json root is not an array');
  process.exit(1);
}
console.log(`Total entries: ${data.length}`);

// 2. Check all 1025 base national dex numbers present
const baseByNational = {};
data.filter(p => !p.isForme).forEach(p => {
  baseByNational[p.national] = p;
});

for (let i = 1; i <= 1025; i++) {
  if (!baseByNational[i]) {
    fail(`Missing base Pokémon with national dex # ${i}`);
  }
}
console.log(`Base Pokémon covered: ${Object.keys(baseByNational).length}/1025`);

// 3. No duplicate IDs
const idSeen = new Set();
data.forEach(p => {
  if (idSeen.has(p.id)) fail(`Duplicate id: ${p.id}`);
  idSeen.add(p.id);
});

// 4. Per-entry validation
const REQUIRED_CORE = ['id','name','national','gen','type1','bst','height','weight','spe'];

data.forEach((p, idx) => {
  const label = `[${p.id || 'idx' + idx}]`;

  // Required fields present and non-null
  REQUIRED_CORE.forEach(f => {
    if (p[f] === null || p[f] === undefined) {
      fail(`${label} missing required field: ${f}`);
    }
  });

  // id is a string
  if (typeof p.id !== 'string') fail(`${label} id must be a string`);

  // national is 1–1025
  if (typeof p.national !== 'number' || p.national < 1 || p.national > 1025) {
    fail(`${label} national dex out of range: ${p.national}`);
  }

  // gen 1–9
  if (typeof p.gen !== 'number' || p.gen < 1 || p.gen > 9) {
    fail(`${label} gen out of range: ${p.gen}`);
  }

  // Types valid
  if (p.type1 !== null && !VALID_TYPES.has(p.type1)) {
    fail(`${label} unknown type1: ${p.type1}`);
  }
  if (p.type2 !== null && p.type2 !== undefined && !VALID_TYPES.has(p.type2)) {
    fail(`${label} unknown type2: ${p.type2}`);
  }

  // BST sanity
  if (typeof p.bst === 'number' && (p.bst < 100 || p.bst > 1200)) {
    warn(`${label} unusual BST: ${p.bst}`);
  }

  // Height/weight > 0
  if (typeof p.height === 'number' && p.height <= 0) {
    warn(`${label} non-positive height: ${p.height}`);
  }
  if (typeof p.weight === 'number' && p.weight <= 0) {
    warn(`${label} non-positive weight: ${p.weight}`);
  }

  // Color valid
  if (p.color !== null && p.color !== undefined && !VALID_COLORS.has(p.color)) {
    warn(`${label} unknown color: ${p.color}`);
  }

  // Gender bucket valid
  if (p.genderBucket !== null && p.genderBucket !== undefined && !VALID_GENDER_BUCKETS.has(p.genderBucket)) {
    warn(`${label} unknown genderBucket: ${p.genderBucket}`);
  }

  // Egg group valid (if present)
  if (p.eggGroup1 !== null && p.eggGroup1 !== undefined) {
    const g = p.eggGroup1.toLowerCase().replace(' ', '-');
    if (!VALID_EGG_GROUPS.has(g) && !VALID_EGG_GROUPS.has(p.eggGroup1)) {
      warn(`${label} unknown eggGroup1: ${p.eggGroup1}`);
    }
  }
});

// 5. Summary
console.log(`\nValidation complete — ${failures} failure(s), ${warnings} warning(s).`);

if (failures > 0) {
  console.error('Some validation checks FAILED. Please fix and regenerate pokemon.json.');
  process.exit(1);
} else {
  console.log('All validation checks PASSED.');
  if (warnings > 0) {
    console.log('(Warnings are informational and do not fail the build.)');
  }
  process.exit(0);
}
