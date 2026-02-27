#!/usr/bin/env node
/**
 * build-pokemon.js
 *
 * Build-time preprocessing script that generates docs/data/pokemon.json
 * from multiple data sources:
 *   - Primary: @pkmn/sim (Pokémon Showdown data — types, abilities, stats,
 *              height, weight, egg groups, color, evolution info)
 *   - Supplemental: pokemondb/database YAML files (hatch cycles, EV yield)
 *     Fetched at build time via the GitHub API (requires internet access
 *     or a local copy of the YAML files).
 *
 * Usage:
 *   cd scripts && npm install && node build-pokemon.js
 *
 * Output:
 *   ../docs/data/pokemon.json
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ---------------------------------------------------------------------------
// 1. Load @pkmn/sim species data
// ---------------------------------------------------------------------------
const { Dex } = require('@pkmn/sim');

// ---------------------------------------------------------------------------
// 2. Helper: fetch a URL and return parsed JSON/text
// ---------------------------------------------------------------------------
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// 3. Helper: fetch pokemondb/database YAML files via GitHub API
// ---------------------------------------------------------------------------
async function fetchPokemondbYaml(filename) {
  const yaml = require('js-yaml');
  // Try GitHub API (requires auth token if rate-limited)
  const token = process.env.GITHUB_TOKEN || '';
  try {
    const { statusCode, body } = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/pokemondb/database/contents/data/${filename}`,
        headers: {
          'User-Agent': 'pokemon-guessing-game-build/1.0',
          'Accept': 'application/vnd.github.v3.raw',
          ...(token ? { 'Authorization': `token ${token}` } : {}),
        },
      };
      https.get(options, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
        res.on('error', reject);
      }).on('error', reject);
    });

    if (statusCode !== 200) {
      console.warn(`  Warning: GitHub API returned HTTP ${statusCode} for ${filename}.`);
      console.warn('  Supplemental data (hatch cycles, EV yield) will be null for this run.');
      console.warn('  Tip: Run with GITHUB_TOKEN set to a valid token for better access.');
      return null;
    }

    // If GitHub returned JSON (not raw), decode base64 content
    if (body.trimStart().startsWith('{') || body.trimStart().startsWith('[')) {
      try {
        const parsed = JSON.parse(body);
        if (parsed.content) {
          const content = Buffer.from(parsed.content, 'base64').toString('utf8');
          return yaml.load(content);
        }
      } catch {/* fall through */}
    }
    const result = yaml.load(body);
    // Validate it's an object map (not a string/array from an error page)
    if (typeof result !== 'object' || Array.isArray(result) || result === null) {
      console.warn(`  Warning: unexpected YAML content type for ${filename}.`);
      return null;
    }
    return result;
  } catch (err) {
    console.warn(`  Warning: could not fetch ${filename} from GitHub API (${err.message})`);
    console.warn('  Supplemental data (hatch cycles, EV yield) will be null for this run.');
    return null;
  }
}

// ---------------------------------------------------------------------------
// 4. Derive evolution stage (1, 2, or 3) from chain traversal
// ---------------------------------------------------------------------------
function getEvolutionStage(species) {
  // Stage 1 = no prevo; Stage 2 = has one prevo; Stage 3 = has two prevos
  if (!species.prevo) return 1;
  const prevo1 = Dex.species.get(species.prevo);
  if (!prevo1.prevo) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// 5. Parse gender ratio from @pkmn/sim genderRatio field.
//    Returns a bucket string for categorical filtering.
// ---------------------------------------------------------------------------
function genderBucket(species) {
  // Explicitly genderless: gender field === 'N' or both M and F are 0
  if (species.gender === 'N') return 'genderless';
  if (species.gender === 'M') return '100m';
  if (species.gender === 'F') return '100f';
  const gr = species.genderRatio;
  if (!gr) return 'genderless';
  const m = gr.M ?? 0;
  const f = gr.F ?? 0;
  if (m === 0 && f === 0) return 'genderless';
  if (m === 0) return '100f';
  if (m === 1) return '100m';
  if (m >= 0.87) return '87.5m';
  if (m >= 0.74) return '75m';
  if (m >= 0.49) return '50m50f';
  if (m >= 0.24) return '25m';
  return '12.5m';
}

// ---------------------------------------------------------------------------
// 6. Main build function
// ---------------------------------------------------------------------------
async function build() {
  console.log('Building pokemon.json...');

  // --- 6a. Optionally load pokemondb/database YAML for supplemental data ---
  console.log('Fetching supplemental data from pokemondb/database...');
  const formsYaml = await fetchPokemondbYaml('pokemon-forms.yaml');

  // Build a lookup: formkey → { egg_cycles, ev_yield }
  const dbSupplemental = {};
  if (formsYaml) {
    for (const [key, form] of Object.entries(formsYaml)) {
      dbSupplemental[key] = {
        egg_cycles: form['egg-cycles'] ?? null,
        ev_yield: form['ev-yield'] ?? null,
      };
    }
    console.log(`  Loaded ${Object.keys(dbSupplemental).length} form entries from pokemondb.`);
  }

  // --- 6b. Build pokemon list from @pkmn/sim ---
  console.log('Processing Pokémon species data...');
  const allSpecies = Dex.data.Species;
  const results = [];

  for (const [id, raw] of Object.entries(allSpecies)) {
    const sp = Dex.species.get(id);

    // Skip non-standard (battle-only/fake), and entries with num <= 0
    if (!sp.exists) continue;
    if (sp.num <= 0 || sp.num > 1025) continue;
    // Skip truly non-standard (fake/CAP/etc.), keep 'Past' (valid older Pokémon)
    if (sp.isNonstandard && sp.isNonstandard !== 'Past' && sp.isNonstandard !== 'Unobtainable') continue;

    const isForme = sp.forme !== '';
    const baseSpeciesId = sp.baseSpecies.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Derive supplemental data key (matches pokemondb key format)
    // pokemondb uses hyphens; @pkmn/sim uses no separator. Try both.
    const dbKey = id; // e.g. "venusaurmega" — won't match unless we transform
    // Build pokemondb-style key: baseid + forme-hyphenated
    let pokemondbKey = sp.baseSpecies.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/ /g, '-');
    if (sp.forme) {
      const formeSlug = sp.forme.toLowerCase().replace(/[^a-z0-9]/g, '-');
      pokemondbKey = `${pokemondbKey}-${formeSlug}`;
    }
    const supp = dbSupplemental[pokemondbKey] || dbSupplemental[id] || {};

    // BST
    const bst = sp.baseStats
      ? Object.values(sp.baseStats).reduce((a, b) => a + b, 0)
      : null;

    // EV yield: try supplemental
    const evYield = supp.ev_yield ?? null;

    // Hatch cycles
    const hatchCycles = supp.egg_cycles ?? null;

    const entry = {
      id: id,
      name: sp.name,
      national: sp.num,
      gen: sp.gen,
      type1: sp.types[0] ? sp.types[0].toLowerCase() : null,
      type2: sp.types[1] ? sp.types[1].toLowerCase() : null,
      hp: sp.baseStats?.hp ?? null,
      atk: sp.baseStats?.atk ?? null,
      def: sp.baseStats?.def ?? null,
      spa: sp.baseStats?.spa ?? null,
      spd: sp.baseStats?.spd ?? null,
      spe: sp.baseStats?.spe ?? null,
      bst: bst,
      height: sp.heightm ?? null,
      weight: sp.weightkg ?? null,
      ability1: sp.abilities?.[0] ?? null,
      ability2: sp.abilities?.[1] ?? null,
      abilityH: sp.abilities?.H ?? null,
      eggGroup1: sp.eggGroups?.[0]?.toLowerCase() ?? null,
      eggGroup2: sp.eggGroups?.[1]?.toLowerCase() ?? null,
      color: sp.color ? sp.color.toLowerCase() : null,
      genderBucket: genderBucket(sp),
      hatchCycles: hatchCycles,
      evoStage: getEvolutionStage(sp),
      nfe: sp.nfe ?? false,
      evYield: evYield,
      isForme: isForme,
      formeName: sp.forme || null,
      baseSpecies: sp.baseSpecies !== sp.name ? sp.baseSpecies : null,
      isMega: sp.isMega ?? false,
      isPrimal: sp.isPrimal ?? false,
    };

    results.push(entry);
  }

  // Sort by national dex number, then name (for forms)
  results.sort((a, b) => {
    if (a.national !== b.national) return a.national - b.national;
    return a.name.localeCompare(b.name);
  });

  console.log(`  Processed ${results.length} Pokémon/form entries.`);

  // --- 6c. Write output ---
  const outDir = path.join(__dirname, '..', 'docs', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'pokemon.json');
  fs.writeFileSync(outPath, JSON.stringify(results));
  console.log(`  Written to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
  console.log('Done.');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
