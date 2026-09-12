/* Le décor reste en place : seuls les éléments mobiles du dodo sont actualisés. */
(function () {
  "use strict";
  const ns = "http://www.w3.org/2000/svg";
  window.ShortGameRunnerView = function (stage) {
    stage.innerHTML = `<svg class="game-scene runner-scene" viewBox="0 0 600 330" role="img" aria-label="Course du dodo : saute les obstacles au sol, passe sous les branches.">
      <rect class="runner-sky" width="600" height="330" fill="#e6efdb"/>
      <circle cx="463" cy="65" r="27" fill="#fff0b4"/>
      <g fill="#fffdf0" opacity=".8"><path d="M54 60q13-21 31-6q20-14 34 6Z"/><path d="M320 43q14-20 31-5q17-11 30 5Z"/></g>
      <g class="runner-hills" fill="#b5cbb0"><path d="M0 231 104 110 220 218 364 139 530 230 600 180V280H0Z"/><path d="M600 231 704 110 820 218 964 139 1130 230 1200 180V280H600Z"/></g>
      <g class="runner-trees" fill="#729d89" opacity=".7"><path d="M0 266q97-73 204-35t202 4 194-13v54H0Z"/><path d="M600 266q97-73 204-35t202 4 194-13v54H600Z"/></g>
      <rect y="270" width="600" height="60" fill="#dccaab"/><path d="M0 272H600" stroke="#5c866e" stroke-width="7"/>
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
    </svg>`;
    const svg = stage.querySelector("svg"), group = svg.querySelector(".runner-obstacles");
    const bird = svg.querySelector(".runner-dodo"), shadow = svg.querySelector(".runner-shadow");
    const hills = svg.querySelector(".runner-hills"), trees = svg.querySelector(".runner-trees"), ground = svg.querySelector(".runner-ground");
    const feet = [svg.querySelector(".runner-foot-one"), svg.querySelector(".runner-foot-two")];
    const nodes = new Map();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let biome = -1;
    function obstacle(o) {
      const n = document.createElementNS(ns, "g"); n.dataset.obstacle = o.type; n.dataset.obstacleId = o.id;
      const { w, h, bottom } = o;
      if (o.type === "branche") {
        n.innerHTML = `<rect y="${-bottom-h}" width="${w}" height="${h}" rx="7" fill="#76503e"/><path d="M9 ${-bottom-h+7}H${w-8}" stroke="#ac8060" stroke-width="4" stroke-linecap="round"/><path d="M12 ${-bottom-h}q3-26 20-15q9-24 26-4q18-27 37-7q16-15 29 8" fill="#3f7563"/><path d="M${w-18} ${-bottom-3}l-4 12" stroke="#76503e" stroke-width="5" stroke-linecap="round"/>`;
      } else if (o.type === "rocher") {
        n.innerHTML = `<path d="M0 0 3 ${-h*.62} ${w*.36} ${-h} ${w*.78} ${-h*.87} ${w} ${-h*.35} ${w} 0Z" fill="#535e74"/><path d="M3 ${-h*.62} ${w*.36} ${-h} ${w*.55} ${-h*.3}Z" fill="#788797"/><path d="M${w*.58} ${-h*.72}l${w*.16} 13" stroke="#a4aeb5" stroke-width="3"/>`;
      } else {
        const log = (x, width) => `<rect x="${x}" y="${-h}" width="${width}" height="${h}" rx="5" fill="#8a5e42"/><path d="M${x+7} ${-h+7}h${Math.max(2,width-14)}m${-Math.max(2,width-14)} 10h${Math.max(2,width-14)}" stroke="#b68a59" stroke-width="3" stroke-linecap="round"/>`;
        n.innerHTML = o.type === "double" ? log(0, w*.48) + log(w*.52, w*.48) : log(0, w);
      }
      group.append(n); nodes.set(o.id, n); return n;
    }
    return function draw(model) {
      const zone = Math.min(3, Math.floor(model.elapsed / 30));
      if (zone !== biome) {
        biome = zone;
        svg.querySelector(".runner-sky").setAttribute("fill", ["#e6efdb", "#f2e6cd", "#dddbea", "#ead9d1"][zone]);
        hills.setAttribute("fill", ["#b5cbb0", "#c2bfaf", "#a8a4bb", "#bb9692"][zone]);
        trees.setAttribute("fill", ["#729d89", "#829c92", "#787992", "#8b717a"][zone]);
      }
      if (!reduced) {
        hills.setAttribute("transform", `translate(${-model.distance*.12%600} 0)`);
        trees.setAttribute("transform", `translate(${-model.distance*.32%600} 0)`);
        ground.setAttribute("transform", `translate(${-model.distance%200} 0)`);
      }
      const lift = model.y, step = lift > 0 || reduced ? 0 : Math.sin(model.distance / 13) * 6;
      bird.setAttribute("transform", `translate(${model.x} ${270-lift}) rotate(${lift>0 ? Math.max(-9,Math.min(8,-model.vy/60)) : 0} 25 -20)`);
      bird.dataset.height = lift.toFixed(2);
      feet[0].setAttribute("transform", `translate(${step} 0)`); feet[1].setAttribute("transform", `translate(${-step} 0)`);
      shadow.setAttribute("rx", String(25-lift*.09)); shadow.setAttribute("opacity", String(.22-lift*.001));
      const visible = new Set();
      model.obstacles.forEach(o => { const n=nodes.get(o.id)||obstacle(o); n.setAttribute("transform", `translate(${o.x.toFixed(2)} 270)`); visible.add(o.id); });
      nodes.forEach((n,id) => { if (!visible.has(id)) { n.remove(); nodes.delete(id); } });
    };
  };
})();
