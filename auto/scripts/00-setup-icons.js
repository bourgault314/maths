(() => {
  'use strict';

  const THEME_SEEDS = Object.freeze({
    numbers: 0x243F6A88,
    geometry: 0x85A308D3,
    data: 0x13198A2E,
    algorithm: 0x03707344
  });
  const ICON_CACHE = new Map();

  function pageSeed(){
    if (globalThis.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      globalThis.crypto.getRandomValues(values);
      return values[0];
    }
    return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  }

  // Une composition nouvelle à chaque chargement, mais immuable pendant la
  // séance : modifier un réglage ne doit pas changer l'identité des domaines.
  const PAGE_SEED = pageSeed();

  function seededRandom(seed){
    let state = seed;
    return () => {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function themeRandom(theme){
    return seededRandom((PAGE_SEED ^ (THEME_SEEDS[theme] || 0)) >>> 0);
  }

  function shuffled(values, random){
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function numbersIcon(){
    const random = themeRandom('numbers');
    const slots = [9.5, 15, 20.5, 26];
    const rows = [
      { y: 11.5, colors: ['#08aaa5', '#08aaa5', '#0b67b2'] },
      { y: 18, colors: ['#f58220', '#f58220', '#f58220'] },
      { y: 24.5, colors: ['#0b67b2', '#08aaa5', '#08aaa5'] }
    ];
    // Trois trous différents évitent que les trois lignes aient le même poids.
    const emptySlots = shuffled([0, 1, 2, 3], random).slice(0, rows.length);
    const beads = rows.flatMap((row, rowIndex) => {
      const occupied = slots.filter((unused, slotIndex) => slotIndex !== emptySlots[rowIndex]);
      return occupied.map((x, beadIndex) =>
        `<circle cx="${x}" cy="${row.y}" r="2.55" fill="${row.colors[beadIndex]}"/>`
      );
    }).join('');
    return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#fffaf3" stroke="#173a5e" stroke-width="1.3"/><g fill="none" stroke="#aebfd1" stroke-width="1.2" stroke-linecap="round"><path d="M7.5 11.5h21M7.5 18h21M7.5 24.5h21"/></g><g stroke="#fffdf8" stroke-width=".72">${beads}</g></svg>`;
  }

  function dataIcon(){
    const random = themeRandom('data');
    const heights = shuffled([8.5, 11, 14.5, 19], random);
    const colors = shuffled(['#08aaa5', '#0b67b2', '#6553b8', '#f58220'], random);
    const xPositions = [8.5, 13.55, 18.6, 23.65];
    const bars = xPositions.map((x, index) => {
      const height = heights[index];
      return `<rect x="${x}" y="${28 - height}" width="4.25" height="${height}" rx=".8" fill="${colors[index]}"/>`;
    }).join('');
    return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#fffaf5" stroke="#173a5e" stroke-width="1.3"/><path d="M8 28h20" fill="none" stroke="#9eb0c2" stroke-width="1.1" stroke-linecap="round"/><g stroke="#fffdf8" stroke-width=".55">${bars}</g></svg>`;
  }

  function monotoneRoutes(right, up, prefix = '', routes = []){
    if (right === 0 && up === 0) {
      routes.push(prefix);
      return routes;
    }
    if (right > 0) monotoneRoutes(right - 1, up, `${prefix}R`, routes);
    if (up > 0) monotoneRoutes(right, up - 1, `${prefix}U`, routes);
    return routes;
  }

  function algorithmIcon(){
    const random = themeRandom('algorithm');
    const routes = monotoneRoutes(3, 3);
    const route = routes[Math.floor(random() * routes.length)];
    const path = `M9 27${[...route].map(move => move === 'R' ? 'h6' : 'v-6').join('')}`;
    return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#f5f4ff" stroke="#4f5fb3" stroke-width="1.3"/><g fill="none" stroke="#c7ccee" stroke-width=".72"><path d="M12 4v28M18 4v28M24 4v28M4 12h28M4 18h28M4 24h28"/></g><circle cx="8.8" cy="27" r="2.4" fill="#08aaa5" stroke="#087f78" stroke-width=".8"/><path d="${path}" fill="none" stroke="#6553b8" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 9V4.8" fill="none" stroke="#b95016" stroke-width="1.35" stroke-linecap="round"/><path d="M27 4.8h5.6L27 8.4Z" fill="#f58220" stroke="#b95016" stroke-width=".7" stroke-linejoin="round"/></svg>`;
  }

  function geometryIcon(){
    const random = themeRandom('geometry');
    const size = 4;
    const cell = 7;
    const origin = 4;
    const radius = cell / 2;
    const orientations = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => (random() < 0.5 ? 'a' : 'b'))
    );

    const pairFor = (orientation, edge) => {
      const pairs = orientation === 'a'
        ? { T: 'L', L: 'T', R: 'B', B: 'R' }
        : { T: 'R', R: 'T', L: 'B', B: 'L' };
      return pairs[edge];
    };

    const pathFor = (row, column, orientation, edge) => {
      const x = origin + column * cell;
      const y = origin + row * cell;
      return orientation === 'a'
        ? (edge === 'T' || edge === 'L'
          ? `M${x + radius} ${y}A${radius} ${radius} 0 0 1 ${x} ${y + radius}`
          : `M${x + cell} ${y + radius}A${radius} ${radius} 0 0 0 ${x + radius} ${y + cell}`)
        : (edge === 'T' || edge === 'R'
          ? `M${x + radius} ${y}A${radius} ${radius} 0 0 0 ${x + cell} ${y + radius}`
          : `M${x} ${y + radius}A${radius} ${radius} 0 0 1 ${x + radius} ${y + cell}`);
    };

    const basePaths = [];
    orientations.forEach((row, rowIndex) => row.forEach((orientation, columnIndex) => {
      basePaths.push(pathFor(rowIndex, columnIndex, orientation, 'T'));
      basePaths.push(pathFor(rowIndex, columnIndex, orientation, orientation === 'a' ? 'R' : 'L'));
    }));

    const boundaryStarts = [];
    for (let index = 0; index < size; index += 1) {
      boundaryStarts.push(
        { row: 0, column: index, edge: 'T' },
        { row: index, column: size - 1, edge: 'R' },
        { row: size - 1, column: index, edge: 'B' },
        { row: index, column: 0, edge: 'L' }
      );
    }

    const follow = start => {
      const route = [];
      const visited = new Set();
      let current = { ...start };
      while (current.row >= 0 && current.row < size && current.column >= 0 && current.column < size) {
        const orientation = orientations[current.row][current.column];
        const exit = pairFor(orientation, current.edge);
        const arcKey = `${current.row}:${current.column}:${[current.edge, exit].sort().join('')}`;
        if (visited.has(arcKey)) break;
        visited.add(arcKey);
        route.push(pathFor(current.row, current.column, orientation, current.edge));
        if (exit === 'T') current = { row: current.row - 1, column: current.column, edge: 'B' };
        if (exit === 'R') current = { row: current.row, column: current.column + 1, edge: 'L' };
        if (exit === 'B') current = { row: current.row + 1, column: current.column, edge: 'T' };
        if (exit === 'L') current = { row: current.row, column: current.column - 1, edge: 'R' };
      }
      return route;
    };

    const offset = Math.floor(random() * boundaryStarts.length);
    const orderedStarts = boundaryStarts.slice(offset).concat(boundaryStarts.slice(0, offset));
    const routePaths = orderedStarts
      .map(follow)
      .reduce((longest, route) => route.length > longest.length ? route : longest, []);
    const baseMarkup = basePaths.map(d => `<path d="${d}"/>`).join('');
    const routeMarkup = routePaths.map(d => `<path d="${d}"/>`).join('');
    return `<svg viewBox="0 0 36 36" focusable="false"><defs><clipPath id="mathsgo-truchet-clip"><rect x="4" y="4" width="28" height="28" rx="4"/></clipPath></defs><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#f4fbfa"/><g clip-path="url(#mathsgo-truchet-clip)"><g fill="none" stroke="#167f7b" stroke-width="1.2" stroke-linecap="round">${baseMarkup}</g><g fill="none" stroke="#f58220" stroke-width="2" stroke-linecap="round">${routeMarkup}</g></g><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="none" stroke="#173a5e" stroke-width="1.3"/></svg>`;
  }

  function iconMarkup(theme){
    if (ICON_CACHE.has(theme)) return ICON_CACHE.get(theme);
    const generators = {
      numbers: numbersIcon,
      geometry: geometryIcon,
      data: dataIcon,
      algorithm: algorithmIcon
    };
    const markup = generators[theme]?.() || '';
    ICON_CACHE.set(theme, markup);
    return markup;
  }

  function renderThemeIcons(root = document){
    const groups = [];
    if (root.matches && root.matches('.theme-group')) groups.push(root);
    if (root.querySelectorAll) groups.push(...root.querySelectorAll('.theme-group'));
    groups.forEach(group => {
      const target = group.querySelector('.theme-summary .theme-icon');
      if (!target) return;
      const theme = group.dataset.theme || '';
      if (target.dataset.iconRendered === theme && target.firstElementChild) return;
      target.classList.toggle('theme-icon-truchet', theme === 'geometry');
      target.innerHTML = iconMarkup(theme);
      target.dataset.iconRendered = theme;
    });
  }

  function installMenuObserver(){
    const box = document.getElementById('modules');
    if (!box || !globalThis.MutationObserver) return;
    let queued = false;
    const scheduleRender = () => {
      if (queued) return;
      queued = true;
      const run = () => {
        queued = false;
        renderThemeIcons(box);
      };
      if (typeof queueMicrotask === 'function') queueMicrotask(run);
      else setTimeout(run, 0);
    };
    new MutationObserver(scheduleRender).observe(box, { childList: true, subtree: true });
  }

  globalThis.MATHSGO_SETUP_ICONS = Object.freeze({
    render: renderThemeIcons,
    markup: iconMarkup
  });

  const start = () => {
    renderThemeIcons();
    installMenuObserver();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
