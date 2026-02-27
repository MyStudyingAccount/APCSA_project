# apcsa-projects
Template for AP CSA project development.

---

## Pokémon Guesser — Static Web App

A fully static (GitHub Pages–compatible) Pokémon guessing-game helper.
Enter a Pokémon name as your game guess, then set the feedback constraints
(higher / lower / equal for numeric fields; match / no match for categorical
fields) to narrow down the answer.

### Quick Start

```
# 1. Serve the docs/ folder locally (no install required)
npx serve docs
# or
python3 -m http.server -d docs 8080
# then open http://localhost:8080
```

### Regenerating the Pokémon Data

The game data lives in `docs/data/pokemon.json`.  
To regenerate it (e.g. after a new game release):

```bash
cd scripts
npm install
node build-pokemon.js
```

The build script uses [@pkmn/sim](https://github.com/smogon/pokemon-showdown/tree/master/sim)
(Pokémon Showdown data) as the primary source, and optionally supplements with
hatch-cycle / EV-yield data from the
[pokemondb/database](https://github.com/pokemondb/database) YAML files via the
GitHub API (requires a `GITHUB_TOKEN` env variable with public-repo read access).

Fields sourced from pokemondb/database (`hatchCycles`, `evYield`) will be
**null** if the GitHub API is unavailable; all other fields are populated from
@pkmn/sim.

### Validating the Data

```bash
cd scripts
node validate-pokemon.js
```

### Deployment to GitHub Pages

1. Go to **Settings → Pages** in the GitHub repository.
2. Set **Source** to the `docs/` folder on the `main` (or your default) branch.
3. The app will be live at `https://<username>.github.io/<repo>/`.

### Project Layout

```
docs/               # Static app (GitHub Pages root)
  index.html        # Main HTML — mobile-first UI
  styles.css        # CSS — optimised for Android Chrome
  app.js            # Client-side filtering engine (no framework)
  data/
    pokemon.json    # Pre-generated compact Pokémon dataset
scripts/
  build-pokemon.js  # Node.js build script: generates pokemon.json
  validate-pokemon.js  # Validates the generated JSON
  package.json      # Build dependencies (js-yaml, @pkmn/sim)
```

