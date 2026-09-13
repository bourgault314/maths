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
  const shades = ["#3f4348", "#4a4d52", "#585b60", "#5a534d", "#6b655e", "#474b50", "#726c64"];
  function shade(seed) { return shades[(Number(seed) >>> 0) % shades.length]; }
  const stone = (cx, cy, w, h, seed) => '<path transform="translate(' + cx + ' ' + cy + ')" d="' + pebble(w, h, seed) + '" fill="' + shade(seed) + '"/>';
  window.ShortGameArt = {
    pebble, shade,
    luciole: '<path d="M14 101 Q45 50 78 79 T149 32" fill="none" stroke="#b0dcc8" stroke-width="3" stroke-dasharray="5 7"/><circle cx="85" cy="58" r="40" fill="#f4dc68" opacity=".16"/><circle cx="85" cy="58" r="29" fill="#f4dc68" opacity=".2"/><ellipse cx="69" cy="43" rx="17" ry="24" transform="rotate(-35 69 43)" fill="#e1f1dc"/><ellipse cx="100" cy="43" rx="17" ry="24" transform="rotate(35 100 43)" fill="#e1f1dc"/><ellipse cx="85" cy="65" rx="18" ry="25" fill="#f5d459"/><path d="M69 62 H101" stroke="#d2a848" stroke-width="4"/><circle cx="85" cy="40" r="15" fill="#264f49"/><circle cx="79" cy="38" r="3" fill="white"/><circle cx="91" cy="38" r="3" fill="white"/><path d="M80 29 L75 20 M90 29 L95 20" stroke="#264f49" stroke-width="3" stroke-linecap="round"/><path d="M30 26 v12 m-6-6 h12 M128 79 v12 m-6-6 h12" stroke="#e9cf71" stroke-width="3" stroke-linecap="round"/>',
    dodo: "<ellipse cx=\"80\" cy=\"107\" rx=\"42\" ry=\"6\" fill=\"#c1ddc4\"/><g transform=\"translate(80 103) scale(1.65)\"><path d=\"M-11-22Q-22-25-30-34L-28-21Q-22-17-13-15Z\" fill=\"#26383b\"/><path d=\"M-6-9L-6-2-1-1M5-9L5-2 11-1\" fill=\"none\" stroke=\"#544a38\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><ellipse cy=\"-23\" rx=\"16\" ry=\"18\" fill=\"#dda46d\"/><path d=\"M-11-16Q-1-6 10-16Q7-6-1-6Q-8-6-11-16Z\" fill=\"#f4e0b5\"/><ellipse cx=\"8\" cy=\"-37\" rx=\"13.5\" ry=\"13\" fill=\"#243b40\"/><path d=\"M-1-41Q6-47 18-40L16-36Q6-40 1-36Z\" fill=\"#f7efda\"/><path d=\"M18-38L27-35 18-33Z\" fill=\"#273d42\"/><ellipse cx=\"13\" cy=\"-39\" rx=\"2.6\" ry=\"2.9\" fill=\"#142c32\"/><circle cx=\"13.8\" cy=\"-40\" r=\"1\" fill=\"#fffdf0\"/><path d=\"M5-28Q15-27 18-33L14-27 11-25Z\" fill=\"#f5dfb4\"/><g transform=\"translate(-7 -28)\"><path d=\"M-7-5Q8-7 11 7Q3 11-6 5Q-12 1-7-5Z\" fill=\"#334b4f\"/><path d=\"M-7-4Q0-4 6 1L5 4Q-2 2-8 1Z\" fill=\"#f3edd9\"/></g></g>",
    galets: '<circle cx="134" cy="24" r="12" fill="#ffd79a"/><path d="M0 74 L34 54 L58 66 L86 44 L118 68 L160 52 V84 H0Z" fill="#9db4bf" opacity=".6"/><path d="M0 78 Q40 71 80 77 T160 75 V120 H0Z" fill="#7fb0b8"/><path d="M0 99 Q80 89 160 97 V120 H0Z" fill="#e2cda6"/><ellipse cx="80" cy="108" rx="54" ry="6" fill="#00000022"/>' +
      stone(80, 100, 100, 17, 11) + stone(83, 85, 84, 15, 27) + stone(78, 72, 70, 13, 45) + stone(84, 60, 56, 12, 63) + stone(80, 49, 44, 11, 80) +
      '<path d="M80 18 V42" stroke="#fff" stroke-width="2" stroke-dasharray="3 4" opacity=".9"/><circle cx="80" cy="17" r="3.5" fill="#fff"/><path d="M14 34 h16 q4 0 3 -4 M24 46 h18 q4 0 3 -4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>',
    tempo: '<path d="M8 108 L58 46 Q80 57 101 46 L154 108" fill="#9b8090"/><path d="M58 46 Q80 58 101 46 L94 38 H65Z" fill="#5a596d"/><path d="M76 52 L62 85 L82 77 L96 102" fill="none" stroke="#f0a367" stroke-width="6" stroke-linejoin="round"/><circle cx="80" cy="23" r="18" fill="#e8c568"/><path d="M74 23 L78 28 L88 17" fill="none" stroke="#725a3d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="33" cy="38" r="9" fill="#d9ded4"/><circle cx="127" cy="39" r="9" fill="#d9ded4"/>'
  };
})();
