/* Le décor reste en place : seuls les éléments mobiles du dodo sont actualisés. */
(function () {
  "use strict";
  const ns = "http://www.w3.org/2000/svg";
  // Quatre zones de La Réunion, une par demi-minute de course. Le dessin
  // complet de chaque paysage viendra dans un lot séparé ; ici ce sont les
  // couleurs qui changent, comme avant, mais aux teintes des lieux.
  const ZONES = [
    { sky: "#e6efdb", hills: "#b5cbb0", trees: "#729d89", ground: "#dccaab", line: "#5c866e", detail: "#b7a17f" },
    { sky: "#e7ecf2", hills: "#97a4b0", trees: "#6f8288", ground: "#cfc7bd", line: "#5d6f74", detail: "#a9a096" },
    { sky: "#f2e3d0", hills: "#bf8f6b", trees: "#96684f", ground: "#d9b48c", line: "#8a5336", detail: "#b98f6a" },
    { sky: "#dcedf1", hills: "#84bcc0", trees: "#4f9aa0", ground: "#e6dcc0", line: "#3c8d92", detail: "#c4b795" }
  ];
  window.ShortGameRunnerView = function (stage) {
    stage.innerHTML = `<svg class="game-scene runner-scene" viewBox="0 0 600 330" role="img" aria-label="Course du dodo : saute les cailloux, les troncs et les rochers, passe sous les branches.">
      <rect class="runner-sky" width="600" height="330" fill="#e6efdb"/>
      <circle cx="463" cy="65" r="27" fill="#fff0b4"/>
      <g fill="#fffdf0" opacity=".8"><path d="M54 60q13-21 31-6q20-14 34 6Z"/><path d="M320 43q14-20 31-5q17-11 30 5Z"/></g>
      <g class="runner-hills" fill="#b5cbb0"><path d="M0 231 104 110 220 218 364 139 530 205 600 231V280H0Z"/><path d="M600 231 704 110 820 218 964 139 1130 205 1200 231V280H600Z"/></g>
      <g class="runner-trees" fill="#729d89" opacity=".7"><path d="M0 266q97-73 204-35t202 4 194 31v54H0Z"/><path d="M600 266q97-73 204-35t202 4 194 31v54H600Z"/></g>
      <rect class="runner-soil" y="270" width="600" height="60" fill="#dccaab"/><path class="runner-line" d="M0 272H600" stroke="#5c866e" stroke-width="7"/>
      <g class="runner-ground" stroke="#b7a17f" stroke-width="3" stroke-linecap="round"><path d="M0 307h28m34-15h15m39 21h26m58-6h28m34-15h15m39 21h26m58-6h28m34-15h15m39 21h26m58-6h28m34-15h15m39 21h26"/></g>
      <ellipse class="runner-shadow" cx="121" cy="274" rx="25" ry="5" fill="#465d47" opacity=".2"/>
      <g class="runner-obstacles"></g>
      <g class="runner-dodo" transform="translate(94 270)">
        <g class="runner-feet" stroke="#c4822c" stroke-width="4" stroke-linecap="round" fill="none"><path class="runner-foot-one" d="M18-13 15-2h9"/><path class="runner-foot-two" d="M31-13 35-2h8"/></g>
        <path d="M10-29Q-4-29-3-43Q9-42 14-33" fill="#4c7c81"/>
        <ellipse cx="23" cy="-26" rx="22" ry="19" fill="#70989a"/>
        <ellipse cx="23" cy="-20" rx="16" ry="11" fill="#e8eddf"/>
        <path d="M31-30Q29-43 35-50Q45-58 53-47L50-32 40-23" fill="#88aaaa"/>
        <path d="M48-44Q66-47 64-35Q59-30 49-35Z" fill="#edbc4f"/><path d="M51-38h12" stroke="#b98c35" stroke-width="1.3"/>
        <circle cx="46" cy="-47" r="2.7" fill="#173f41"/><circle cx="47" cy="-48" r=".9" fill="white"/>
        <path class="runner-wing" d="M11-31Q19-17 34-29" fill="#507c80" stroke="#3e686d" stroke-width="1.5"/>
      </g>
      <g class="runner-lives" transform="translate(16 18)" aria-hidden="true"></g>
    </svg>`;
    const svg = stage.querySelector("svg"), group = svg.querySelector(".runner-obstacles");
    const bird = svg.querySelector(".runner-dodo"), shadow = svg.querySelector(".runner-shadow");
    const hills = svg.querySelector(".runner-hills"), trees = svg.querySelector(".runner-trees"), ground = svg.querySelector(".runner-ground");
    const sky = svg.querySelector(".runner-sky"), soil = svg.querySelector(".runner-soil"), line = svg.querySelector(".runner-line");
    const feet = [svg.querySelector(".runner-foot-one"), svg.querySelector(".runner-foot-two")];
    const lives = svg.querySelector(".runner-lives");
    const nodes = new Map();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let biome = -1, drawnLives = -1;
    const HEART = "M11 20C11 20 1.6 14.3 1.6 7.7 1.6 4.3 4.1 2 7 2c1.7 0 3.2.8 4 2.1C11.8 2.8 13.3 2 15 2c2.9 0 5.4 2.3 5.4 5.7C20.4 14.3 11 20 11 20Z";
    function paintLives(count, total) {
      if (count === drawnLives) return;
      drawnLives = count;
      lives.innerHTML = Array.from({ length: total }, (_, i) =>
        `<path transform="translate(${i * 27} 0) scale(1.15)" d="${HEART}" fill="${i < count ? "#cf5a52" : "#ffffff00"}" stroke="${i < count ? "#a8423c" : "#00000038"}" stroke-width="1.8"/>`).join("");
    }
    function obstacle(o) {
      const n = document.createElementNS(ns, "g"); n.dataset.obstacle = o.type; n.dataset.obstacleId = o.id;
      const { w, h, bottom } = o;
      if (o.type === "branche") {
        n.innerHTML = `<rect y="${-bottom-h}" width="${w}" height="${h}" rx="7" fill="#76503e"/><path d="M9 ${-bottom-h+7}H${w-8}" stroke="#ac8060" stroke-width="4" stroke-linecap="round"/><path d="M12 ${-bottom-h}q3-26 20-15q9-24 26-4q18-27 37-7q16-15 29 8" fill="#3f7563"/><path d="M${w-18} ${-bottom-3}l-4 12" stroke="#76503e" stroke-width="5" stroke-linecap="round"/>`;
      } else if (o.type === "caillou") {
        // Galet de basalte : bas et arrondi, il se saute d'un appui bref.
        n.innerHTML = `<path d="M0 0 ${w*.12} ${-h*.78} ${w*.45} ${-h} ${w*.8} ${-h*.72} ${w} 0Z" fill="#5f6874"/><path d="M${w*.12} ${-h*.78} ${w*.45} ${-h} ${w*.6} ${-h*.42}Z" fill="#828d99"/>`;
      } else if (o.type === "rocher") {
        n.innerHTML = `<path d="M0 0 3 ${-h*.62} ${w*.36} ${-h} ${w*.78} ${-h*.87} ${w} ${-h*.35} ${w} 0Z" fill="#535e74"/><path d="M3 ${-h*.62} ${w*.36} ${-h} ${w*.55} ${-h*.3}Z" fill="#788797"/><path d="M${w*.58} ${-h*.72}l${w*.16} 13" stroke="#a4aeb5" stroke-width="3"/>`;
      } else {
        const log = (x, width) => `<rect x="${x}" y="${-h}" width="${width}" height="${h}" rx="5" fill="#8a5e42"/><path d="M${x+7} ${-h+7}h${Math.max(2,width-14)}m${-Math.max(2,width-14)} 10h${Math.max(2,width-14)}" stroke="#b68a59" stroke-width="3" stroke-linecap="round"/>`;
        n.innerHTML = o.type === "double" ? log(0, w*.48) + log(w*.52, w*.48) : log(0, w);
      }
      group.append(n); nodes.set(o.id, n); return n;
    }
    return function draw(model) {
      const zone = Math.min(ZONES.length - 1, Math.floor(model.elapsed / 30));
      if (zone !== biome) {
        biome = zone; const z = ZONES[zone];
        sky.setAttribute("fill", z.sky); hills.setAttribute("fill", z.hills); trees.setAttribute("fill", z.trees);
        soil.setAttribute("fill", z.ground); line.setAttribute("stroke", z.line); ground.setAttribute("stroke", z.detail);
      }
      if (!reduced) {
        hills.setAttribute("transform", `translate(${-model.distance*.12%600} 0)`);
        trees.setAttribute("transform", `translate(${-model.distance*.32%600} 0)`);
        ground.setAttribute("transform", `translate(${-model.distance%200} 0)`);
      }
      const lift = model.y, step = lift > 0 || reduced ? 0 : Math.sin(model.distance / 13) * 6;
      bird.setAttribute("transform", `translate(${model.x} ${270-lift}) rotate(${lift>0 ? Math.max(-9,Math.min(8,-model.vy/60)) : 0} 25 -20)`);
      bird.dataset.height = lift.toFixed(2);
      // Après une touche, le dodo clignote le temps de son invincibilité.
      bird.setAttribute("opacity", model.hurt > 0 ? (reduced ? ".45" : (Math.floor(model.hurt * 12) % 2 ? ".35" : "1")) : "1");
      feet[0].setAttribute("transform", `translate(${step} 0)`); feet[1].setAttribute("transform", `translate(${-step} 0)`);
      shadow.setAttribute("rx", String(25-lift*.09)); shadow.setAttribute("opacity", String(.22-lift*.001));
      paintLives(model.lives, window.ShortGames?.RUNNER?.vies ?? 2);
      const visible = new Set();
      model.obstacles.forEach(o => { const n=nodes.get(o.id)||obstacle(o); n.setAttribute("transform", `translate(${o.x.toFixed(2)} 270)`); visible.add(o.id); });
      nodes.forEach((n,id) => { if (!visible.has(id)) { n.remove(); nodes.delete(id); } });
    };
  };
})();
