/* Illustrations vectorielles originales, sans police ni image distante. */
(function () {
  "use strict";
  // Un galet de basalte : contour irrégulier au-dessus, dessous plat sur la
  // zone d'appui (foot : bords gauche et droit de l'appui, dans le repère du
  // dessin centré en 0). Même graine, même galet : le dessin est reproductible.
  function pebble(width, height, seed, foot) {
    let state = (Number(seed) >>> 0) || 1;
    const noise = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
    const rx = width / 2, ry = height / 2, left = foot ? foot[0] : -rx, right = foot ? foot[1] : rx;
    const points = [];
    for (let i = 0; i <= 8; i++) {
      const angle = Math.PI + Math.PI * i / 8, bump = .9 + noise() * .18;
      points.push([Math.cos(angle) * rx * (i === 0 || i === 8 ? 1 : bump), Math.sin(angle) * ry * bump]);
    }
    // Descente vers l'appui plat : les bords qui dépassent de l'appui remontent en douceur.
    points.push([rx * .96, ry * .3], [rx * .93 - (rx - right) * .5, ry * .72], [right * .9, ry]);
    points.push([(right + left) / 2, ry], [left * .9, ry], [-rx * .93 + (left + rx) * .5, ry * .72], [-rx * .96, ry * .3]);
    const n = points.length, mid = i => [(points[i % n][0] + points[(i + 1) % n][0]) / 2, (points[i % n][1] + points[(i + 1) % n][1]) / 2];
    let d = "M" + mid(0).map(v => v.toFixed(1)).join(" ");
    for (let i = 1; i <= n; i++) d += "Q" + points[i % n].map(v => v.toFixed(1)).join(" ") + " " + mid(i).map(v => v.toFixed(1)).join(" ");
    return d + "Z";
  }
  // Les deux pierres de « Touche la case qui… » : une coulée de lave et un galet
  // de rivière, dessinés à la taille réelle de la case pour que les traits ne
  // s'étirent jamais. Le contour, la couleur et la texture disent la même
  // chose trois fois : rien ne repose sur la seule couleur.
  const LAVE = [[.48, 0], [.8, .05], [1, .19], [.91, .47], [1, .74], [.73, .95], [.38, 1], [.09, .86], [0, .53], [.11, .22]];
  const FISSURES = [[[.3, .11], [.47, .34], [.31, .55], [.45, .84]], [[.72, .18], [.59, .42], [.78, .63], [.65, .9]]];
  const GALET = [[.5, 0], [.84, .11], [1, .42], [.93, .75], [.64, .99], [.29, .96], [.03, .68], [.07, .28]];
  const GRAINS = [[.32, .66, .055], [.62, .78, .042], [.68, .52, .032]];
  let gradients = 0;
  const place = (points, x, y, w, h) => points.map(p => [x + p[0] * w, y + p[1] * h]);
  const line = points => points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  // Contour fermé et arrondi : chaque sommet est lissé par ses deux voisins.
  function round(points) {
    const n = points.length;
    let d = "M" + points[0][0].toFixed(1) + " " + points[0][1].toFixed(1);
    for (let i = 0; i < n; i++) {
      const a = points[(i - 1 + n) % n], b = points[i], c = points[(i + 1) % n], e = points[(i + 2) % n];
      d += " C" + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + " " + (b[1] + (c[1] - a[1]) / 6).toFixed(1) + "," +
           (c[0] - (e[0] - b[0]) / 6).toFixed(1) + " " + (c[1] - (e[1] - b[1]) / 6).toFixed(1) + "," +
           c[0].toFixed(1) + " " + c[1].toFixed(1);
    }
    return d + "Z";
  }
  function pierre(shape, x, y, w, h) {
    const m = Math.min(w, h) * .055, iw = w - 2 * m, ih = h - 2 * m;
    const stroke = Math.max(1.6, Math.min(w, h) * .05), id = "sg-pierre-" + (++gradients), detail = Math.min(w, h) > 60;
    if (shape === "lave") {
      let s = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd06d"/><stop offset=".42" stop-color="#ff8b2c"/><stop offset="1" stop-color="#d13a0f"/></linearGradient></defs>' +
        '<path d="' + line(place(LAVE, x + m, y + m, iw, ih)) + 'Z" fill="url(#' + id + ')" stroke="#77200a" stroke-width="' + stroke.toFixed(1) + '" stroke-linejoin="round"/>';
      if (detail) for (const f of FISSURES) s += '<path d="' + line(place(f, x + m, y + m, iw, ih)) + '" fill="none" stroke="#77200a" stroke-width="' + (stroke * .75).toFixed(1) + '" stroke-linecap="round" opacity=".5"/>';
      return s;
    }
    let s = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f5fa"/><stop offset=".5" stop-color="#c6cdd8"/><stop offset="1" stop-color="#878f9c"/></linearGradient></defs>' +
      '<path d="' + round(place(GALET, x + m, y + m, iw, ih)) + '" fill="url(#' + id + ')" stroke="#414751" stroke-width="' + stroke.toFixed(1) + '"/>';
    if (detail) for (const g of GRAINS) {
      const r = g[2] * Math.min(iw, ih);
      s += '<ellipse cx="' + (x + m + g[0] * iw).toFixed(1) + '" cy="' + (y + m + g[1] * ih).toFixed(1) + '" rx="' + r.toFixed(1) + '" ry="' + (r * .72).toFixed(1) + '" fill="#79818e" opacity=".45"/>';
    }
    return s;
  }
  // Un tas de pierres : c'est la règle « le plus / le moins » qui en a besoin.
  function tas(count, cx, cy, size) {
    const d = size * 1.05 / Math.sqrt(count + 1.6), columns = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / columns);
    let s = "", k = 0;
    for (let r = 0; r < rows; r++) {
      const inRow = Math.min(columns, count - r * columns);
      for (let i = 0; i < inRow; i++, k++) {
        const jx = ((k * 37) % 11 - 5) / 5 * d * .1, jy = ((k * 53) % 9 - 4) / 4 * d * .1;
        s += pierre("galet", cx + (i - (inRow - 1) / 2) * d * 1.06 - d / 2 + jx, cy + (r - (rows - 1) / 2) * d * 1.06 - d / 2 + jy, d, d);
      }
    }
    return s;
  }
  const shades = ["#3f4348", "#4a4d52", "#585b60", "#5a534d", "#6b655e", "#474b50", "#726c64"];
  function shade(seed) { return shades[(Number(seed) >>> 0) % shades.length]; }
  const stone = (cx, cy, w, h, seed) => '<path transform="translate(' + cx + ' ' + cy + ')" d="' + pebble(w, h, seed) + '" fill="' + shade(seed) + '"/>';
  window.ShortGameArt = {
    pebble, shade, pierre, tas,
    luciole: '<path d="M14 101 Q45 50 78 79 T149 32" fill="none" stroke="#b0dcc8" stroke-width="3" stroke-dasharray="5 7"/><circle cx="85" cy="58" r="40" fill="#f4dc68" opacity=".16"/><circle cx="85" cy="58" r="29" fill="#f4dc68" opacity=".2"/><ellipse cx="69" cy="43" rx="17" ry="24" transform="rotate(-35 69 43)" fill="#e1f1dc"/><ellipse cx="100" cy="43" rx="17" ry="24" transform="rotate(35 100 43)" fill="#e1f1dc"/><ellipse cx="85" cy="65" rx="18" ry="25" fill="#f5d459"/><path d="M69 62 H101" stroke="#d2a848" stroke-width="4"/><circle cx="85" cy="40" r="15" fill="#264f49"/><circle cx="79" cy="38" r="3" fill="white"/><circle cx="91" cy="38" r="3" fill="white"/><path d="M80 29 L75 20 M90 29 L95 20" stroke="#264f49" stroke-width="3" stroke-linecap="round"/><path d="M30 26 v12 m-6-6 h12 M128 79 v12 m-6-6 h12" stroke="#e9cf71" stroke-width="3" stroke-linecap="round"/>',
    dodo: "<ellipse cx=\"80\" cy=\"107\" rx=\"42\" ry=\"6\" fill=\"#c1ddc4\"/><g transform=\"translate(80 103) scale(1.65)\"><path d=\"M-11-22Q-22-25-30-34L-28-21Q-22-17-13-15Z\" fill=\"#26383b\"/><path d=\"M-6-9L-6-2-1-1M5-9L5-2 11-1\" fill=\"none\" stroke=\"#544a38\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><ellipse cy=\"-23\" rx=\"16\" ry=\"18\" fill=\"#dda46d\"/><path d=\"M-11-16Q-1-6 10-16Q7-6-1-6Q-8-6-11-16Z\" fill=\"#f4e0b5\"/><ellipse cx=\"8\" cy=\"-37\" rx=\"13.5\" ry=\"13\" fill=\"#243b40\"/><path d=\"M-1-41Q6-47 18-40L16-36Q6-40 1-36Z\" fill=\"#f7efda\"/><path d=\"M18-38L27-35 18-33Z\" fill=\"#273d42\"/><ellipse cx=\"13\" cy=\"-39\" rx=\"2.6\" ry=\"2.9\" fill=\"#142c32\"/><circle cx=\"13.8\" cy=\"-40\" r=\"1\" fill=\"#fffdf0\"/><path d=\"M5-28Q15-27 18-33L14-27 11-25Z\" fill=\"#f5dfb4\"/><g transform=\"translate(-7 -28)\"><path d=\"M-7-5Q8-7 11 7Q3 11-6 5Q-12 1-7-5Z\" fill=\"#334b4f\"/><path d=\"M-7-4Q0-4 6 1L5 4Q-2 2-8 1Z\" fill=\"#f3edd9\"/></g></g>",
    galets: '<circle cx="134" cy="24" r="12" fill="#ffd79a"/><path d="M0 74 L34 54 L58 66 L86 44 L118 68 L160 52 V84 H0Z" fill="#9db4bf" opacity=".6"/><path d="M0 78 Q40 71 80 77 T160 75 V120 H0Z" fill="#7fb0b8"/><path d="M0 99 Q80 89 160 97 V120 H0Z" fill="#e2cda6"/><ellipse cx="80" cy="108" rx="54" ry="6" fill="#00000022"/>' +
      stone(80, 100, 100, 17, 11) + stone(83, 85, 84, 15, 27) + stone(78, 72, 70, 13, 45) + stone(84, 60, 56, 12, 63) + stone(80, 49, 44, 11, 80) +
      '<path d="M80 18 V42" stroke="#fff" stroke-width="2" stroke-dasharray="3 4" opacity=".9"/><circle cx="80" cy="17" r="3.5" fill="#fff"/><path d="M14 34 h16 q4 0 3 -4 M24 46 h18 q4 0 3 -4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>',
    cases: (function () {
      // Trois cases, une seule répond à la règle : c'est tout le jeu en un dessin.
      const box = (x, on) => '<rect x="' + x + '" y="24" width="44" height="70" rx="12" fill="#fdfbf7" stroke="' + (on ? "#187666" : "#b9c6cb") + '" stroke-width="' + (on ? 5 : 3) + '"/>';
      return '<path d="M0 98 Q40 88 80 96 T160 92 V120 H0Z" fill="#dee7e5"/>' +
        box(8, false) + pierre("galet", 14, 36, 32, 46) +
        box(58, true) + pierre("lave", 64, 36, 32, 46) +
        box(108, false) + pierre("galet", 114, 36, 32, 46) +
        '<circle cx="101" cy="27" r="13" fill="#187666" stroke="#fdfbf7" stroke-width="3"/>' +
        '<path d="M95 27.5 L99.5 32 L108 22" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'
    })()
  };
})();
