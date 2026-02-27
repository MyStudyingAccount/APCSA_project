/**
 * app.js — Pokémon Guesser client-side filtering engine
 *
 * Architecture:
 *   - Load docs/data/pokemon.json once on page load
 *   - Maintain a `constraints` map (field → {op, value})
 *   - Re-filter on every constraint change, updating the candidate list live
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  var allPokemon   = [];    // full dataset from pokemon.json
  var currentGuess = null;  // the Pokémon object the user entered
  var guessedIds   = [];    // IDs of all previously-guessed Pokémon

  // constraints: field → { op, value }
  var constraints  = {};

  // -------------------------------------------------------------------------
  // DOM references
  // -------------------------------------------------------------------------
  var guessInput      = document.getElementById('guessInput');
  var guessBtn        = document.getElementById('guessBtn');
  var guessInfo       = document.getElementById('guessInfo');
  var autocompleteBox = document.getElementById('autocomplete');
  var constraintsPanel = document.getElementById('constraintsPanel');
  var countNumber     = document.getElementById('countNumber');
  var candidateList   = document.getElementById('candidateList');
  var loadingMsg      = document.getElementById('loadingMsg');
  var noResults       = document.getElementById('noResults');
  var resetBtn        = document.getElementById('resetBtn');
  var excludeCheck    = document.getElementById('excludeGuessed');

  // -------------------------------------------------------------------------
  // Display helpers
  // -------------------------------------------------------------------------
  var GENDER_LABELS = {
    'genderless': 'Genderless',
    '100m':       '♂ 100%',
    '87.5m':      '♂ 87.5%',
    '75m':        '♂ 75%',
    '50m50f':     '♂ 50% / ♀ 50%',
    '25m':        '♂ 25%',
    '12.5m':      '♂ 12.5%',
    '100f':       '♀ 100%',
  };

  function capitalize(s) {
    if (!s) return '–';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function typeHtml(type) {
    if (!type) return '–';
    return '<span class="type-badge type-' + type + '">' + capitalize(type) + '</span>';
  }

  function fieldDisplay(field, pokemon) {
    if (pokemon === null) return '–';
    var v = pokemon[field];
    if (v === null || v === undefined) return '–';
    switch (field) {
      case 'height':      return v + ' m';
      case 'weight':      return v + ' kg';
      case 'type1':
      case 'type2':       return typeHtml(v);
      case 'genderBucket': return GENDER_LABELS[v] || v;
      case 'gen':         return 'Gen ' + v;
      case 'evoStage':    return 'Stage ' + v;
      case 'isForme':     return v ? 'Yes' : 'No';
      case 'color':       return capitalize(v);
      case 'eggGroup1':
      case 'eggGroup2':   return capitalize(String(v).replace(/-/g, ' '));
      default:            return String(v);
    }
  }

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------
  function loadData() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/pokemon.json');
    xhr.onload = function () {
      if (xhr.status === 200) {
        allPokemon = JSON.parse(xhr.responseText);
        loadingMsg.classList.add('hidden');
        candidateList.classList.remove('hidden');
        updateResults();
      } else {
        loadingMsg.textContent = 'Error loading Pokémon data (HTTP ' + xhr.status + ')';
      }
    };
    xhr.onerror = function () {
      loadingMsg.textContent = 'Error loading Pokémon data. Serve this page over HTTP, not file://.';
    };
    xhr.send();
  }

  // -------------------------------------------------------------------------
  // Guess handling
  // -------------------------------------------------------------------------
  function lookupPokemon(query) {
    query = query.trim().toLowerCase();
    if (!query) return null;

    // Try by national dex number
    var num = parseInt(query, 10);
    if (!isNaN(num)) {
      return allPokemon.find(function (p) {
        return p.national === num && !p.isForme;
      }) || null;
    }

    // Try exact name match (case-insensitive)
    var exact = allPokemon.find(function (p) {
      return p.name.toLowerCase() === query;
    });
    if (exact) return exact;

    // Try exact id match
    var byId = allPokemon.find(function (p) {
      return p.id === query;
    });
    if (byId) return byId;

    // Partial name match
    return allPokemon.find(function (p) {
      return p.name.toLowerCase().startsWith(query);
    }) || null;
  }

  function autocompleteSearch(query) {
    query = query.trim().toLowerCase();
    if (!query || query.length < 2) return [];
    return allPokemon.filter(function (p) {
      return p.name.toLowerCase().includes(query) ||
             String(p.national).startsWith(query);
    }).slice(0, 8);
  }

  function setGuess(pokemon) {
    currentGuess = pokemon;

    // Add to guessed list
    if (pokemon && guessedIds.indexOf(pokemon.id) === -1) {
      guessedIds.push(pokemon.id);
    }

    // Clear autocomplete
    autocompleteBox.innerHTML = '';
    autocompleteBox.classList.add('hidden');

    if (!pokemon) {
      guessInfo.classList.add('hidden');
      constraintsPanel.classList.add('hidden');
      return;
    }

    // Show guess info summary
    guessInfo.classList.remove('hidden');
    guessInfo.innerHTML =
      '<strong>#' + pokemon.national + ' ' + pokemon.name + '</strong> — ' +
      (pokemon.type2
        ? typeHtml(pokemon.type1) + ' ' + typeHtml(pokemon.type2)
        : typeHtml(pokemon.type1)) +
      ' · BST <strong>' + (pokemon.bst || '–') + '</strong>' +
      ' · Speed <strong>' + (pokemon.spe || '–') + '</strong>' +
      ' · ' + capitalize(pokemon.color) +
      ' · Gen ' + pokemon.gen;

    // Show constraints panel
    constraintsPanel.classList.remove('hidden');

    // Update field value labels
    var fields = ['height','weight','bst','spe','hp','hatchCycles',
                  'type1','type2','ability1','abilityH',
                  'eggGroup1','color','genderBucket','gen','evoStage','isForme'];
    fields.forEach(function (f) {
      var el = document.getElementById('val-' + f);
      if (el) el.innerHTML = fieldDisplay(f, pokemon);
    });

    // Reset all constraint buttons to "unknown" (new guess)
    var rows = document.querySelectorAll('.constraint-row');
    rows.forEach(function (row) {
      var btns = row.querySelectorAll('.op-btn');
      btns.forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-op') === 'unknown');
      });
    });
    constraints = {};
    updateResults();
  }

  // -------------------------------------------------------------------------
  // Constraint buttons
  // -------------------------------------------------------------------------
  document.querySelectorAll('.constraint-row').forEach(function (row) {
    var field = row.getAttribute('data-field');
    var type  = row.getAttribute('data-type');

    row.querySelectorAll('.op-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var op = btn.getAttribute('data-op');

        // Toggle all buttons in this row
        row.querySelectorAll('.op-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        // Update constraint
        if (op === 'unknown') {
          delete constraints[field];
        } else if (currentGuess) {
          constraints[field] = {
            op: op,
            value: currentGuess[field],
            type: type,
          };
        }

        updateResults();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Filtering engine
  // -------------------------------------------------------------------------
  function passesConstraints(pokemon) {
    for (var field in constraints) {
      if (!constraints.hasOwnProperty(field)) continue;
      var c = constraints[field];
      var op = c.op;
      var guessedVal = c.value;
      var candidateVal = pokemon[field];

      if (c.type === 'numeric') {
        // If either value is unknown, constraint can't be applied
        if (guessedVal === null || guessedVal === undefined) continue;
        if (candidateVal === null || candidateVal === undefined) continue;

        var gv = parseFloat(guessedVal);
        var cv = parseFloat(candidateVal);

        if (op === 'higher' && !(cv > gv)) return false;
        if (op === 'lower'  && !(cv < gv)) return false;
        if (op === 'equal'  && !(cv === gv)) return false;

      } else {
        // categorical
        // Normalise to string for comparison
        var gvStr = (guessedVal === null || guessedVal === undefined) ? null : String(guessedVal).toLowerCase();
        var cvStr = (candidateVal === null || candidateVal === undefined) ? null : String(candidateVal).toLowerCase();

        if (op === 'match') {
          // candidate must have same value as guessed
          if (gvStr === null) continue;  // guessed value unknown, skip
          if (cvStr !== gvStr) return false;
        } else if (op === 'nomatch') {
          if (gvStr === null) continue;
          if (cvStr === gvStr) return false;
        }
      }
    }
    return true;
  }

  function updateResults() {
    if (allPokemon.length === 0) return;

    var excludeIds = excludeCheck.checked ? guessedIds : [];

    var candidates = allPokemon.filter(function (p) {
      if (excludeIds.indexOf(p.id) !== -1) return false;
      return passesConstraints(p);
    });

    // Update count
    countNumber.textContent = candidates.length;

    // Update list
    if (candidates.length === 0) {
      candidateList.innerHTML = '';
      noResults.classList.remove('hidden');
    } else {
      noResults.classList.add('hidden');
      var MAX_SHOWN = 200;
      var shown = candidates.slice(0, MAX_SHOWN);
      var html = shown.map(function (p) {
        var types = typeHtml(p.type1) + (p.type2 ? ' ' + typeHtml(p.type2) : '');
        return '<li class="candidate-item">' +
          '<span class="poke-name">#' + p.national + ' ' + p.name + '</span><br>' +
          '<span class="poke-meta">' + types + ' · Gen ' + p.gen + '</span>' +
          '</li>';
      }).join('');
      if (candidates.length > MAX_SHOWN) {
        html += '<li class="candidate-item" style="grid-column:1/-1;text-align:center;color:#888">' +
                '…and ' + (candidates.length - MAX_SHOWN) + ' more</li>';
      }
      candidateList.innerHTML = html;
    }
  }

  // -------------------------------------------------------------------------
  // Guess input events
  // -------------------------------------------------------------------------
  guessBtn.addEventListener('click', function () {
    var p = lookupPokemon(guessInput.value);
    if (p) {
      guessInput.value = p.name;
      setGuess(p);
    } else {
      guessInfo.classList.remove('hidden');
      guessInfo.textContent = 'Pokémon not found. Try a name or dex number.';
      guessInfo.style.borderLeftColor = 'var(--red)';
    }
  });

  guessInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') guessBtn.click();
    if (e.key === 'ArrowDown') {
      var items = autocompleteBox.querySelectorAll('.autocomplete-item');
      if (items.length > 0) { e.preventDefault(); items[0].focus(); }
    }
  });

  guessInput.addEventListener('input', function () {
    var q = guessInput.value.trim();
    if (q.length < 2) {
      autocompleteBox.classList.add('hidden');
      return;
    }
    var results = autocompleteSearch(q);
    if (results.length === 0) {
      autocompleteBox.classList.add('hidden');
      return;
    }
    autocompleteBox.innerHTML = results.map(function (p) {
      return '<div class="autocomplete-item" tabindex="0" data-id="' + p.id + '">' +
             '#' + p.national + ' ' + p.name + '</div>';
    }).join('');
    autocompleteBox.classList.remove('hidden');
  });

  autocompleteBox.addEventListener('click', function (e) {
    var item = e.target.closest('.autocomplete-item');
    if (!item) return;
    var id = item.getAttribute('data-id');
    var p = allPokemon.find(function (x) { return x.id === id; });
    if (p) {
      guessInput.value = p.name;
      setGuess(p);
    }
  });

  autocompleteBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var item = document.activeElement.closest
        ? document.activeElement.closest('.autocomplete-item')
        : null;
      if (item) item.click();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var items = autocompleteBox.querySelectorAll('.autocomplete-item');
      var idx = Array.prototype.indexOf.call(items, document.activeElement);
      if (idx < items.length - 1) items[idx + 1].focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      var items = autocompleteBox.querySelectorAll('.autocomplete-item');
      var idx = Array.prototype.indexOf.call(items, document.activeElement);
      if (idx > 0) items[idx - 1].focus();
      else guessInput.focus();
    }
  });

  // Close autocomplete when clicking outside
  document.addEventListener('click', function (e) {
    if (!guessInput.contains(e.target) && !autocompleteBox.contains(e.target)) {
      autocompleteBox.classList.add('hidden');
    }
  });

  // -------------------------------------------------------------------------
  // Reset button
  // -------------------------------------------------------------------------
  resetBtn.addEventListener('click', function () {
    constraints = {};
    guessedIds  = [];
    currentGuess = null;

    // Reset input
    guessInput.value = '';
    guessInfo.classList.add('hidden');
    guessInfo.style.borderLeftColor = '';
    autocompleteBox.classList.add('hidden');
    constraintsPanel.classList.add('hidden');
    excludeCheck.checked = false;

    // Reset all buttons to "unknown"
    document.querySelectorAll('.op-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-op') === 'unknown');
    });

    // Reset field value labels
    document.querySelectorAll('.field-value').forEach(function (el) {
      el.textContent = '–';
    });

    updateResults();
  });

  // -------------------------------------------------------------------------
  // Exclude guessed toggle
  // -------------------------------------------------------------------------
  excludeCheck.addEventListener('change', function () {
    updateResults();
  });

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------
  loadData();

}());
