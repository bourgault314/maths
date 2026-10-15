/* Les histoires de SPLAT! — livret 3 : la balance (monde 5, fiche 37), dessinée par l'outil des
   Équations (outils/splat_equations.html, à évaluer dans cette page). Ce sont EXACTEMENT les
   schémas en barres de sa correction « le schéma en barres » (drawEquationPrintCorrectionColumn :
   les deux côtés l'un sous l'autre, ce qu'on enlève de chaque côté hachuré, puis le partage),
   à la taille d'écriture des corrigés de l'Enquête (chiffres 53, lignes de 101).
   window.__balance(spec) :
     spec = { graine, cotes:[[taches, paquets], [taches, paquets]] (l'ordre de l'énoncé), x,
              inverser (le 1er côté de l'énoncé est à droite sur la carte), lettre }
   rend { bandes:[{ svg, y0, bb }], etats:[…], eq, textes } ou { erreur }.
   Une bande = un schéma de la colonne (même ordre que l'outil) ; render.py / corrige.js posent
   un titre au-dessus de chacune, dans la page de l'outil SPLAT! (titres, « Je réponds »). */
window.__balance = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  const tEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const tText = (x, y, t, a = {}) => { const e = tEl('text', { x, y, ...a }); e.textContent = t; return e; };
  const tri = a => a.map(Number).slice().sort((p, q) => p - q);
  const card = genEquationStep(makeRng(String(spec.graine)));
  const eq = JSON.parse(JSON.stringify(card._eq));
  const cote = s => [Number(s.tasks), tri(s.visible || [])];
  const meme = (a, b) => JSON.stringify(a) === JSON.stringify([b[0], tri(b[1])]);
  if(spec.inverser){ const t = eq.left; eq.left = eq.right; eq.right = t; }
  if(Number(eq.x) !== Number(spec.x) || !meme(cote(eq.left), spec.cotes[0]) || !meme(cote(eq.right), spec.cotes[1]))
    return { erreur:'graine ' + spec.graine + ' : ' + JSON.stringify(eq) };
  card._eq = eq;
  if(spec.lettre) card.varChar = '𝑥';
  const G = { top:0, centerX:430, fullW:860, maxTableW:860,
    minHiddenW:64, minVisibleW:84, minHiddenWValue1:72, minVisibleWValue1:90,
    rowH:101, fontSize:53, pad:22, variableFontSize:52, stride:1000,
    eqTopGap:0, eqFontSize:0, eqFontSize4:0, eqGap:0, eqGap4:0, eqEqGap:0, arrows:false, sansEquation:true };
  const sv = tEl('svg', { viewBox:'0 0 1600 8000', width:'1600', height:'8000' });
  document.body.appendChild(sv);
  const avant = __activePrintHatchSvgRoot;
  __activePrintHatchSvgRoot = sv;
  try{
    const g = tEl('g'); sv.appendChild(g);
    drawEquationPrintCorrectionColumn(g, eq, card, tEl, tText, G);
    /* la police que la page de l'outil donne VRAIMENT à chaque écriture (sa règle « * { font-family } »
       l'emporte sur l'attribut : « ? » en DejaVu Sans, 𝑥 en lettre ronde) — la même hors de l'outil */
    g.querySelectorAll('text').forEach(t => { const cs = getComputedStyle(t); t.setAttribute('font-family', cs.fontFamily); t.setAttribute('font-style', cs.fontStyle); t.setAttribute('font-weight', cs.fontWeight); });
    const bandes = new Map();
    [...g.children].forEach(ch => {
      const b = ch.getBBox();
      const i = Math.floor((b.y + b.height / 2) / G.stride);
      if(!bandes.has(i)) bandes.set(i, []);
      bandes.get(i).push(ch);
    });
    const out = [...bandes.keys()].sort((a, b) => a - b).map(i => {
      const gg = tEl('g'); sv.appendChild(gg);
      bandes.get(i).forEach(ch => gg.appendChild(ch));
      const b = gg.getBBox();
      return { svg:gg.innerHTML, y0:i * G.stride, bb:[b.x, b.y - i * G.stride, b.width, b.height] };
    });
    /* les états, dans l'ordre de l'outil (mêmes conditions que drawEquationPrintCorrectionColumn) */
    const a = Number(eq.left.tasks), bb = Number(eq.right.tasks);
    const vl = eqVisibleSum(eq.left), vr = eqVisibleSum(eq.right);
    const cx = Math.min(a, bb), cv = Math.min(vl, vr);
    const a2 = a - cx, b2 = bb - cx, vl2 = vl - cv, vr2 = vr - cv;
    const etats = [{ kind:'depart', a, b:bb, vl, vr }];
    if(cx > 0) etats.push({ kind:'retireX', n:cx });
    if(cv > 0) etats.push({ kind:'retireV', n:cv, avant:Math.max(vl, vr), apres:Math.max(vl2, vr2) });
    const resolu = (a2 === 1 && b2 === 0 && vl2 === 0 && vr2 > 0) || (b2 === 1 && a2 === 0 && vr2 === 0 && vl2 > 0);
    const k = Math.max(a2, b2);
    if(Math.abs(a - bb) >= 1 && !resolu && k > 1) etats.push({ kind:'partage', k, reste:Math.max(vl2, vr2), x:Number(eq.x) });
    if(etats.length !== out.length) return { erreur:'balance : ' + out.length + ' schémas pour ' + etats.length + ' états' };
    const textes = [...sv.querySelectorAll('text')].map(t => t.textContent).filter(t => t.trim());
    return { bandes:out, etats, eq, textes };
  }catch(e){
    return { erreur:String(e && e.message || e) };
  }finally{
    __activePrintHatchSvgRoot = avant;
    sv.remove();
  }
};

/* La carte de la couverture (l'exemple de la page 2) : telle que l'outil l'imprime en 6 par page,
   plateaux côte à côte (vue Équation) — page chargée avec &seed=<graine>&cards=1&view=equation. */
window.__balanceCarte = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  const card = cards[0];
  const tiree = genEquationStep(makeRng(String(spec.graine)));
  if(JSON.stringify(card._eq.left.visible) !== JSON.stringify(tiree._eq.left.visible) || card._eq.x !== tiree._eq.x)
    return { erreur:'la carte de la page n’est pas celle de la graine ' + spec.graine };
  const sv = document.createElementNS(NS, 'svg');
  document.body.appendChild(sv);
  renderCardIntoSvg(sv, card, 'statement', { sixParPage:true });
  const fond = sv.querySelector('rect');
  if(fond && fond.getAttribute('width') === '1600') fond.remove();
  /* le cadre du dessin : la boîte des éléments visibles (pas les fonds pleine carte, ni les calques
     vides de l'écran), bornée par la carte 6 par page de l'outil (EQ_PRINT_6UP_VIEWBOX_GD) */
  const [vx, vy, vw, vh] = EQ_PRINT_6UP_VIEWBOX_GD.split(' ').map(Number);
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  sv.querySelectorAll('path, circle, text, rect, line').forEach(el => {
    const b = el.getBBox();
    if(!b.width && !b.height) return;
    if(b.width >= 1500 || b.height >= 1500) return;
    if(getComputedStyle(el).display === 'none' || el.closest('[display="none"]')) return;
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height);
  });
  x1 = Math.max(x1, vx); y1 = Math.max(y1, vy); x2 = Math.min(x2, vx + vw); y2 = Math.min(y2, vy + vh);
  const out = { svg:sv.innerHTML, bb:[x1, y1, x2 - x1, y2 - y1], eq:card._eq };
  sv.remove();
  return out;
};
