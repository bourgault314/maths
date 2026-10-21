/* Les histoires de SPLAT! — le dessin du corrigé d'un problème, par l'outil lui-même (à évaluer
   dans outils/splat.html après habit.js). window.__corrige(spec) :
     spec = { famille, graine, valeurs (triées), lettre, habit, inverser }
   rend { svg, bb:[x,y,w,h], textes, reste } ou { erreur }. */
/* L'ordre de l'énoncé pour le premier schéma du Système (« Les deux achats », « Les trois achats ») :
   inverser (deux plateaux, le petit d'abord : 10.1, 14.1) ou ordre (une permutation : 15.4, les
   achats dans le désordre). Les lignes de « Je vérifie » suivent le même ordre. */
window.__ordonnerPlan = function(etapes, verifs, spec){
  const p0 = etapes[0];
  if(spec.inverser){
    if(p0.role !== 'plateaux' || p0.barres.length !== 2) throw new Error('inverser : pas deux plateaux');
    p0.barres.reverse();
    etapes.forEach(e => e.barres.forEach(b => { const m = /^(\d+) \+ (\d+)$/.exec(b.calcul || ''); if(m) b.calcul = `${m[2]} + ${m[1]}`; }));
    if(verifs) verifs.reverse();
  }else if(spec.ordre){
    if(p0.role !== 'plateaux' || p0.barres.length !== spec.ordre.length) throw new Error('ordre : pas ' + spec.ordre.length + ' plateaux');
    p0.barres = spec.ordre.map(i => p0.barres[i]);
    if(verifs){ if(verifs.length !== spec.ordre.length) throw new Error('ordre : ' + verifs.length + ' lignes de vérification'); const v = spec.ordre.map(i => verifs[i]); verifs.splice(0, verifs.length, ...v); }
  }
};

/* « trois orange » (petites parts : une barre = trois fois une autre tache) : l'outil écrit le
   pluriel de la COULEUR (SYS_COULEURS_PLURIEL) ; avec un habillage, le nom de l'histoire (son
   pluriel s'il est donné). Rend la fonction qui remet la table de l'outil. */
window.__plurielsHabilles = function(card, h){
  const sauve = {};
  const cles = card._rel ? card._rel.colorMap : (card._colorMap || []);
  cles.forEach(k => { if(k in sauve) return; sauve[k] = SYS_COULEURS_PLURIEL[k]; const nom = window.__habitNomDeCle(k); if(nom) SYS_COULEURS_PLURIEL[k] = (h.pluriels && h.pluriels[nom]) || nom; });
  return () => Object.keys(sauve).forEach(k => { if(sauve[k] === undefined) delete SYS_COULEURS_PLURIEL[k]; else SYS_COULEURS_PLURIEL[k] = sauve[k]; });
};

/* H14.1 et H14.2 « je recopie » (21/10/2026, lot B, décision de Gwenaël après l'audit du 21/10 : la fiche
   s'appelle « Je recopie », mais 14.1 montrait « je remplace » et 14.2 « j'additionne »). La carte de la
   graine garde ses deux plateaux et ses valeurs (mêmes nombres, même dessin de carte) ; seul son plan de
   correction change : le plan « je recopie » DE L'OUTIL (sysPlan, geste RECOPIE), sur la même situation,
   le plateau recopié en premier (recopie : son rang sur la carte). Le générateur de l'outil ne tire pas
   ces cartes en RECOPIE (14.1 : 2 J ≤ 3 J, un plateau tient dans le double de l'autre sans le dépasser ;
   14.2 : le miroir 1 + 3 et 3 + 1, qu'il écarte) : la carte est donc assemblée ici, par sysAssemblerCarte. */
window.__carteRecopie = function(card, recopie){
  const S = card._sys;
  if(!S || S.boards.length !== 2 || !(recopie === 0 || recopie === 1)) throw new Error('recopie : pas deux plateaux');
  const boards = [S.boards[recopie], S.boards[1 - recopie]].map(b => ({ counts:{ ...b.counts }, total:b.total, visible:[] }));
  const sit = { geste:'RECOPIE', colors:S.colors.slice(), values:{ ...S.values }, boards };
  const [A, B] = sit.colors, P = boards[0].counts, Q = boards[1].counts;
  const k = (Q[A] || 0) / (P[A] || 1);
  if(!Number.isInteger(k) || k < 2 || k * (P[B] || 0) <= (Q[B] || 0)) throw new Error('recopie : le plateau recopié ne contient pas l’autre');
  return sysAssemblerCarte(sit, sysPlan(sit), S.clues);
};

window.__corrige = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  const mkEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const mkText = (x, y, t, a = {}) => { const e = mkEl('text', { x, y, ...a }); e.textContent = t; return e; };
  const rng = makeRng(String(spec.graine));
  let card = spec.famille === 'C' ? genInvestigate(rng) : spec.famille === 'N' ? genNumbered(rng) : genSystem(rng);
  const vals = (card._rel ? card._rel.hiddenValues : card.hidden).map(Number).slice().sort((a, b) => a - b);
  if(JSON.stringify(vals) !== JSON.stringify(spec.valeurs)) return { erreur:'graine ' + spec.graine + ' : ' + vals };
  if(spec.recopie != null) card = window.__carteRecopie(card, spec.recopie);   // H14.1, H14.2 (lot B)
  const lettreMath = c => String.fromCodePoint(0x1D44E + c.toLowerCase().charCodeAt(0) - 97);
  const h = { ...spec.habit, famille:spec.famille, card };
  h.noms = Object.fromEntries(Object.entries(h.noms).map(([k, v]) => [String(k), v]));
  if(h.lettres && spec.lettre) h.lettres = Object.fromEntries(Object.entries(h.lettres).map(([k, v]) => [k, lettreMath(v)]));
  const sv = mkEl('svg', { viewBox:'0 0 1600 4000', width:'1600', height:'4000' });
  document.body.appendChild(sv);
  let carteDessin = card;
  try{
    if(spec.famille === 'C'){
      window.__habit = h;
      const remet = window.__plurielsHabilles(card, h);
      try{
        /* (17/10/2026) « Je vérifie » vérifie aussi chaque indice. Ses lignes en plus sont d'abord resserrées
           (__verifsSerrees, habit.js), puis reprises sur les blancs entre ①, ② et ③ (40 → 0 au plus serré) : le
           corrigé garde la hauteur — donc l'écriture — d'avant */
        window.__habit = { ...h, verifTotalSeul:true };
        const r0 = drawEnqueteCorrectionImprimee(sv, card, 40, 4000);
        while(sv.firstChild) sv.removeChild(sv.firstChild);
        window.__habit = h;
        const r1 = drawEnqueteCorrectionImprimee(sv, card, 40, 4000);
        const n = sv.querySelectorAll('#enqueteCorrectionImprimee > g').length;
        const gain = window.__verifsSerrees(sv);
        while(sv.firstChild) sv.removeChild(sv.firstChild);
        const blanc = n > 1 ? (spec.serre ? 0 : Math.max(0, 40 - (r1.hauteur - gain - r0.hauteur) / (n - 1))) : 40;   // serre : render.py, SERRE
        drawEnqueteCorrectionImprimee(sv, card, 40, 40 + r1.hauteur + (n - 1) * blanc);
        window.__verifsSerrees(sv);
      }finally{ remet(); }
    }else{
      let bas;
      if(spec.famille === 'N'){
        window.__habit = h;
        const P = ENQ_PROFIL_IMPRIME;
        const varChar = spec.lettre ? '𝑥' : '?';
        const clair = h.teinte ? h.teinte[1] : null;
        /* les paquets de jetons visibles de l'énoncé (« 62 € et 45 € ») : une case chacun, et le
           calcul qui les retire tous les deux (l'outil les réunit en une seule case) */
        const paquets = h.paquets || null;
        const oParts = window.drawBarModelPartsInGroup;
        const somme = paquets ? paquets.reduce((a, b) => a + b, 0) : 0;
        window.drawBarModelPartsInGroup = function(g, cx, top, tot, parts, api){
          if(paquets && parts.length && !parts[0].hidden && Number(parts[0].value) === somme)
            parts = paquets.map(v => ({ value:v, hidden:false })).concat(parts.slice(1));
          return oParts(g, cx, top, tot, parts, api);
        };
        const mk = {
          el: mkEl, line: a => mkEl('line', a),
          rect: a => mkEl('rect', (clair && a.fill === 'rgba(0,0,0,0.10)') ? { ...a, fill:clair } : a),
          text: (x, y, t, a = {}) => {
            if(paquets) t = String(t).replace(new RegExp('^(\\d+) − ' + somme + ' = '), (m, T) => `${T} − ${paquets.join(' − ')} = `);
            return mkText(x, y, t, a);
          }
        };
        const g = mkEl('g'); sv.appendChild(g);
        try{ drawSixCorrectionSchema(g, card, varChar, mk); } finally { window.drawBarModelPartsInGroup = oParts; }
        /* la même taille d'écriture que les barres de l'Enquête : 53 au lieu de 92 */
        const k = P.numFont / 92, bb = g.getBBox();
        g.setAttribute('transform', `translate(${P.boxX - k * bb.x} ${40 - k * bb.y}) scale(${k})`);
        const b2 = g.getBBox();
        bas = 40 + b2.height * k;
      }else{
        /* le Système : le plan de l'outil, titres du problème, « Je vérifie » remplacé par
           « Je réponds » puis « Je vérifie » (comme les autres fiches du livret) */
        const plan = card._sys.plan.map(e => ({ ...e, barres:e.barres.map(b => ({ ...b })) }));
        const verif = plan.find(e => e.role === 'verification');
        const etapes = plan.filter(e => e.role !== 'verification').map(e => {
          const t = spec.habit.titres && spec.habit.titres[e.titre];
          return t ? { ...e, titre:t } : e;
        });
        h.verifs = verif.lignes.slice();
        window.__ordonnerPlan(etapes, h.verifs, spec);
        carteDessin = { ...card, _sys:{ ...card._sys, plan:etapes } };
        h.card = carteDessin;
        window.__habit = h;
        const ctx = { mkEl, mkText, isPrint:true, lettres:!!spec.lettre };
        /* la légende des cases : « T : un tour de manège · B : une barbe à papa » (en lettre :
           « 𝑡 : prix d’un tour de manège… ») — les noms ne tiennent pas dans les cases */
        const leg = Object.entries(spec.habit.legende || {}).map(([nom, quoi]) => {
          if(!h.lettres || !h.lettres[nom]) throw new Error('légende : pas de lettre pour ' + nom);
          const ql = spec.habit.legendeLettre && spec.habit.legendeLettre[nom];
          return `${h.lettres[nom]} : ${spec.lettre ? (ql || 'prix d’' + quoi) : quoi}`;
        });
        if(leg.length !== card._sys.colors.length) throw new Error('légende incomplète');
        /* trois quantités : la légende sur deux lignes (une seule ligne élargirait tout le dessin) ;
           carte étroite (livret 3, 2 problèmes par page) : une ligne par lettre */
        const lignesLeg = (spec.largeur && spec.largeur < 1300) ? leg : (leg.length > 2 ? [leg.slice(0, 2).join('   ·   '), leg.slice(2).join('   ·   ')] : [leg.join('   ·   ')]);
        lignesLeg.forEach((t, i) => sv.appendChild(mkText(70, 78 + 50 * i, t, { "font-size":40, "font-weight":700, fill:"#374151" })));
        /* 2 problèmes par page (livret 3, H14-H15) : la carte est haute et étroite ; les étapes se
           rangent dans une colonne de « largeur » (le flux de l'outil, plus étroit), et « Je réponds »
           avec elles (la largeur du profil d'impression, le temps du dessin) */
        const zone = spec.largeur ? Object.assign({}, SYS_CORR_IMPRIME, { xMax:SYS_CORR_IMPRIME.x + spec.largeur }) : undefined;
        bas = drawSysCorrectionImprimee(sv, carteDessin, 130 + 50 * (lignesLeg.length - 1), 4000, ctx, zone);
        sv.querySelectorAll('line[stroke-dasharray]').forEach(l => l.remove());   // le pointillé sous l'énoncé
      }
      /* « Je réponds » (la phrase, encadrée) puis « Je vérifie », dessinés par l'outil (drawEnqueteCalculs) */
      const fin = mkEl('g'); sv.appendChild(fin);
      const modele = { calculs:[], reponse:[{ i:0 }], verification:null, sansIndices:false, ligne:null };
      const boxW = ENQ_PROFIL_IMPRIME.boxW;
      if(spec.largeur) ENQ_PROFIL_IMPRIME.boxW = spec.largeur;
      try{ drawEnqueteCalculs(fin, carteDessin, { isPrint:true, modele, sansTitre:true, boxY:Math.round(bas + 10) }); }
      finally{ ENQ_PROFIL_IMPRIME.boxW = boxW; }
    }
  }catch(e){ window.__habit = null; sv.remove(); return { erreur:String(e && e.message || e) }; }
  /* les mots de l'outil à remplacer dans les titres (« une barre par tache » → « une barre par place ») */
  (spec.habit.remplacer || []).forEach(([a, b]) => {
    let vu = false;
    sv.querySelectorAll('text, tspan').forEach(t => { if(t.childElementCount === 0 && t.textContent.includes(a)){ t.textContent = t.textContent.split(a).join(b); vu = true; } });
    if(!vu) throw new Error('remplacer : « ' + a + ' » introuvable');
  });
  /* (17/10/2026) le plancher d'écriture (render.py, PLANCHER) : dans quelques corrigés serrés, les plus petites
     écritures (les petits calculs du Système, les noms sous une accolade courte, le chiffre des titres)
     remontent à 4,5 pt sur le papier ; le reste du dessin ne bouge pas */
  if(spec.plancher) sv.querySelectorAll('text').forEach(t => { const f = parseFloat(t.getAttribute('font-size')); if(f < spec.plancher) t.setAttribute('font-size', String(spec.plancher)); });
  const bb = sv.getBBox();
  const textes = [...sv.querySelectorAll('text')].map(t => t.textContent).filter(t => t.trim());
  /* aucun mot de l'outil ne doit rester (les noms du problème mis à part) */
  const noms = Object.values(h.noms).concat(Object.values(h.articles || {}));
  const nettoie = t => noms.reduce((s, n) => s.split(n).join(''), t);
  const reste = textes.filter(t => (/tache|jeton|plateau|noire|verte|bleue|rouge|orange|violette/i.test(nettoie(t)) || /TOTAL/.test(t)));
  const out = { svg:sv.innerHTML, bb:[bb.x - 10, bb.y - 10, bb.width + 20, bb.height + 20], textes, reste };
  sv.remove(); window.__habit = null;
  return out;
};

/* L'exemple résolu (couverture et page 2) : la carte SPLAT! cachée sous l'histoire, telle que
   l'outil la dessine (SES couleurs : c'est la carte que l'histoire cache), puis les schémas
   successifs du pas à pas de la projection (lot G3), HABILLÉS (les noms de l'histoire, la teinte
   du livret), au profil d'impression — comme la page 2 des livrets de l'Enquête. */
window.__exemple = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  /* la carte de la page (adresse avec &seed=) : celle que l'outil a posée sur le plateau (places
     des taches comprises) ; elle doit être la carte tirée par la graine */
  const card = cards[0];
  const tiree = genInvestigate(makeRng(String(spec.graine)));
  const vals = card._rel.hiddenValues.map(Number).slice().sort((a, b) => a - b);
  if(JSON.stringify(vals) !== JSON.stringify(spec.valeurs) || JSON.stringify(card._rel.hiddenValues) !== JSON.stringify(tiree._rel.hiddenValues))
    return { erreur:'graine ' + spec.graine + ' : ' + vals };
  const mk = () => { const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 1600 2200');
    sv.setAttribute('width', '1600'); sv.setAttribute('height', '2200'); document.body.appendChild(sv); return sv; };
  const cs = getComputedStyle(document.body), inconnues = new Set();
  const resout = s => s.replace(/var\((--[\w-]+)\)/g, (m, n) => { const v = cs.getPropertyValue(n).trim(); if(!v) inconnues.add(n); return v || m; });
  window.__habit = null;
  const sc = mk(); renderCardIntoSvg(sc, card, 'statement', { plateauEntier:true });
  const fond = sc.querySelector('rect'); if(fond && fond.getAttribute('width') === '1600') fond.remove();
  const carte = resout(sc.innerHTML); sc.remove();
  const indices = card._inv.indices.slice();
  const h = { ...spec.habit, famille:'C', card };
  h.noms = Object.fromEntries(Object.entries(h.noms).map(([k, v]) => [String(k), v]));
  window.__habit = h;
  let out;
  const remet = window.__plurielsHabilles(card, h);
  try{
    const modele = enqueteBarresModele(card);
    const prof = { isPrint:true, modele, sansTitre:true };
    const plan = enqueteG3Etapes(card);
    if(!plan || plan.etapes[plan.etapes.length - 1].type !== 'fin') return { erreur:"l'exemple n'a pas de pas à pas" };
    const pas = plan.etapes.filter(e => e.type !== 'vide' && e.type !== 'fin');
    const trouve = pas.filter(e => e.type === 'barresValeurs' && e.egal !== false);
    const liste = pas.filter(e => !trouve.includes(e) || e === trouve[trouve.length - 1]);
    const etapes = liste.map(e => {
      let et = e, titre = e.type === 'barres' ? 'Schéma de comparaison' : e.titre;
      if(trouve.includes(e) && trouve.length > 1){ et = { ...e, noirDes:0 }; titre = 'Je trouve les autres'; }
      const sv = mk(); const g = document.createElementNS(NS, 'g'); sv.appendChild(g);
      enqueteG3Dessiner(g, card, et, plan.modele, prof);
      const b = g.querySelector('#btnEquabarSolve'); if(b) b.remove();
      const bb = g.getBBox();
      const textes = [...g.querySelectorAll('text')].map(t => t.textContent).filter(t => t.trim());
      const r = { svg:resout(sv.innerHTML), h:Math.ceil(bb.y + bb.height - 612) + 8, titre, type:e.type, textes }; sv.remove(); return r;
    });
    const segs = window.__habitSegmentsReponse();
    out = { carte, indices, total:card.total, etapes, reponse:segs, verification:modele.verification };
  }finally{ window.__habit = null; remet(); }
  if(inconnues.size) return { erreur:'variables de couleur inconnues : ' + [...inconnues].join(', ') };
  const noms = Object.values(h.noms).concat(Object.values(h.articles || {}));
  const nettoie = t => noms.reduce((s, n) => s.split(n).join(''), t);
  const reste = out.etapes.flatMap(e => e.textes.concat([e.titre])).filter(t => /tache|jeton|plateau|noire|verte|bleue|rouge|orange|violette/i.test(nettoie(t)) || /TOTAL/.test(t));
  if(reste.length) return { erreur:'mots de l’outil restés : ' + reste.join(' | ') };
  return out;
};

/* Les deux problèmes du dos (« Le défi ! », avant / après) : ils n'ont pas de carte SPLAT!. Leurs
   schémas sont faits des briques de l'outil — les barres de drawBarModelPartsInGroup (celles du
   corrigé du monde 2), les titres numérotés de l'Enquête (enqueteTitreEtape), « Je réponds » et
   « Je vérifie » de drawEnqueteCalculs — à la même taille que les autres corrigés du livret.
   spec = { etapes:[{ titre, barres:[{ total, totalTexte, parts:[{ v, t, cache }], calcul, sous:[…] }] }],
            habit:{ noms, reponse, verifs }, teinte } */
window.__defi = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  const mkEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const mkText = (x, y, t, a = {}) => { const e = mkEl('text', { x, y, ...a }); e.textContent = t; return e; };
  const P = enqueteProfil({ isPrint:true });
  const k = P.numFont / 92;                       // l'échelle du schéma du monde 2 (voir __corrige)
  const HT = Math.round(95 * k), HB = Math.round(95 * k), PAD = Math.round(46 * k), F = P.numFont;
  const clair = spec.teinte[1];
  const sv = mkEl('svg', { viewBox:'0 0 1600 4000', width:'1600', height:'4000' });
  document.body.appendChild(sv);
  const x0 = P.boxX, W = 820;
  const echelle = Math.max(...spec.etapes.flatMap(e => e.barres.map(b => b.parts.reduce((s, p) => s + p.v, 0))));
  let y = 40;
  try{
    spec.etapes.forEach((e, i) => {
      y += enqueteTitreEtape(sv, x0, y, i + 1, e.titre, P, P.boxW) + 6;
      e.barres.forEach(b => {
        const somme = b.parts.reduce((s, p) => s + p.v, 0);
        const w = Math.round(W * somme / echelle);
        const api = { rect:a => mkEl('rect', a.fill === 'rgba(0,0,0,0.10)' ? { ...a, fill:clair } : a), line:a => mkEl('line', a), text:mkText,
          w, hTop:HT, hBottom:HB, stroke:"#000", strokeWidth:5 * k * 1.6, greyFill:"rgba(0,0,0,0.10)", ink:"#000",
          visibleTextColor:"#000", hiddenTextColor:"#000", totalTextColor:"#000", fontTop:F, fontBottom:F, minCellPad:PAD };
        if(b.totalTexte != null) api.totalTextOverride = b.totalTexte;
        const parts = b.parts.map(p => ({ value:p.v, hidden:!!p.cache, text:p.t != null ? p.t : undefined }));
        drawBarModelPartsInGroup(sv, x0 + w / 2, y, somme, parts, api);
        /* le calcul à droite de la barre, au milieu de sa hauteur ; les noms sous les cases */
        sv.appendChild(mkText(x0 + w + 40, y + (HT + HB) / 2 + Math.round(F * 0.36), b.calcul, { "text-anchor":"start", "font-size":String(F), "font-weight":700, fill:"#111827" }));
        if(b.sous && b.sous.length){
          let xx = x0;
          b.parts.forEach((p, j) => {
            const wj = w * p.v / somme;
            sv.appendChild(mkText(xx + wj / 2, y + HT + HB + 40, b.sous[j] || '', { "text-anchor":"middle", "font-size":String(P.sousFont), "font-weight":700, fill:"#374151" }));
            xx += wj;
          });
          y += 54;
        }
        y += HT + HB + 30;
      });
      y += 16;
    });
    const fauxCarte = { family:'X', total:0, visible:[], hidden:[] };
    window.__habit = { ...spec.habit, famille:'X', card:fauxCarte, noms:Object.fromEntries(Object.entries(spec.habit.noms).map(([a, b]) => [String(a), b])) };
    const fin = mkEl('g'); sv.appendChild(fin);
    drawEnqueteCalculs(fin, fauxCarte, { isPrint:true, modele:{ calculs:[], reponse:[{ i:0 }], verification:null, sansIndices:false, ligne:null }, sansTitre:true, boxY:y });
  }catch(e){ window.__habit = null; sv.remove(); return { erreur:String(e && e.message || e) }; }
  window.__habit = null;
  const bb = sv.getBBox();
  const textes = [...sv.querySelectorAll('text')].map(t => t.textContent).filter(t => t.trim());
  const out = { svg:sv.innerHTML, bb:[bb.x - 10, bb.y - 10, bb.width + 20, bb.height + 20], textes };
  sv.remove();
  return out;
};

/* Le corrigé « en équations » (08/10/2026, demande de Gwenaël, planche d'abord) : sans schéma.
   ① Je choisis l'inconnue (𝑥 : … ; et chaque autre quantité écrite avec 𝑥, lue dans le modèle de
   la correction de l'outil) ; ② J'écris l'équation ; ③ Je résous — les calculs du corrigé en
   lettre de l'outil (modèle de l'Enquête ; au Système, ceux du plan en lettres sysPlanS3) ;
   puis « Je réponds » et « Je vérifie », comme les autres corrigés. Page chargée en unknown=letter. */
window.__equation = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  const mkEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const mkText = (x, y, t, a = {}) => { const e = mkEl('text', { x, y, ...a }); e.textContent = t; return e; };
  let card;
  if(spec.famille === 'X'){
    card = { family:'X', total:0, visible:[], hidden:[] };     // les défis du dos : pas de carte
  }else{
    const rng = makeRng(String(spec.graine));
    card = spec.famille === 'C' ? genInvestigate(rng) : spec.famille === 'N' ? genNumbered(rng) : genSystem(rng);
    const vals = (card._rel ? card._rel.hiddenValues : card.hidden).map(Number).slice().sort((a, b) => a - b);
    if(JSON.stringify(vals) !== JSON.stringify(spec.valeurs)) return { erreur:'graine ' + spec.graine + ' : ' + vals };
    if(spec.recopie != null) card = window.__carteRecopie(card, spec.recopie);   // H14.1, H14.2 (lot B)
  }
  const lettreMath = c => String.fromCodePoint(0x1D44E + c.toLowerCase().charCodeAt(0) - 97);
  const h = { ...spec.habit, famille:spec.famille, card };
  h.noms = Object.fromEntries(Object.entries(h.noms).map(([k, v]) => [String(k), v]));
  if(h.lettres) h.lettres = Object.fromEntries(Object.entries(h.lettres).map(([k, v]) => [k, lettreMath(v)]));
  const X = '𝑥', N = v => formatRelationNumber(v);
  const P = enqueteProfil({ isPrint:true });
  const sv = mkEl('svg', { viewBox:'0 0 1600 4000', width:'1600', height:'4000' });
  document.body.appendChild(sv);
  let carteDessin = card;
  const blocs = [];      // [titre, lignes]
  let systemeOutil = null;          // Système : les morceaux du corrigé en équations de l'outil
  let nSysteme = 1;                 // combien de morceaux font « J'écris le système »
  const coupes = [];                // les endroits où le corrigé peut passer à la 2e colonne
  const blocsControle = [];         // d'autres lignes à contrôler
  let nControles = 0;
  const env = {};        // la valeur de chaque lettre, pour contrôler les équations écrites
  try{
    window.__habit = h;
    if(spec.famille === 'C'){
      const m = enqueteBarresModele(card);
      env[X] = Number(card._rel.hiddenValues[m.unit]);
      const mot = i => investigateColorWord(investigateColorInfo(card, i));
      const art = nom => { const a = (h.articles && h.articles[nom]) || nom; return a.charAt(0).toUpperCase() + a.slice(1); };
      /* chaque quantité, écrite avec 𝑥 : les cases de sa barre (une tache = 𝑥, un nombre = lui-même) ;
         une barre « complétée » (cases + ajout = k taches de la référence : je complète, indice
         composé « de moins que le triple ») s'écrit k × 𝑥 − ajout (livret 2, 15/10/2026) */
      let K = 0, A = 0, B = 0;
      const expr = r => {
        const aj = r.cells.filter(c => c.kind === 'ajout').reduce((s, c) => s + Number(c.v), 0);
        const cells = (aj > 0 || r.equiv) ? r.equiv : r.cells;
        const t = cells.filter(c => c.kind === 'tache');
        if(t.some(c => c.de !== m.unit)) throw new Error('équation : une barre ne s\'écrit pas avec la référence');
        const nb = cells.filter(c => c.kind === 'nombre').map(c => Number(c.v));
        const base = [t.length === 1 ? X : `${t.length} × ${X}`].concat(nb.map(N)).join(' + ');
        return { texte: aj > 0 ? `${base} − ${N(aj)}` : base, k:t.length, nb:nb.reduce((s, v) => s + v, 0), aj };
      };
      const vus = new Map();
      if(m.mode === 'unite'){
        /* les petites parts (livret 3, H13) : 𝑥 est UNE PETITE PART (« Je coupe la grande en 6
           petites parts »), chaque quantité en est un nombre entier : k × 𝑥 ; « Je résous » = les
           calculs du corrigé en lettre de l'outil (« 11 × 𝑥 = 110 », « 𝑥 = 110 ÷ 11 = 10 ») */
        const lignes = m.calculs.filter(Boolean);
        const l0 = lignes[0], K = Number(String(l0.g).split(' × ')[0]);
        const part = Number(card.total) / K;
        if(!Number.isInteger(part) || !h.ordre) throw new Error('équation : petites parts');
        env[X] = part;
        const valeurDe = nom => Number(Object.entries(h.noms).find(([v, n]) => n === nom)[0]);
        const coef = nom => { const k = valeurDe(nom) / part; return k === 1 ? X : `${k} × ${X}`; };
        blocs.push(['Je choisis l’inconnue', [`${X} : ${h.inconnue}`].concat(h.ordre.map(nom => `${art(nom)} : ${coef(nom)}`))]);
        blocs.push(['J’écris l’équation', [`${h.ordre.map(coef).join(' + ')} = ${N(card.total)}`]]);
        blocs.push(['Je résous', lignes.map(l => enqueteLigneCalcul(l))]);
      }else{
      m.rows.forEach(r => { const nom = mot(r.i); if(!vus.has(nom)) vus.set(nom, { e:expr(r), n:0, ref:r.i === m.unit || mot(r.i) === mot(m.unit) }); vus.get(nom).n++; });
      vus.forEach(q => { K += q.n * q.e.k; A += q.n * q.e.aj; B += q.n * q.e.nb; });
      if(!h.inconnue) throw new Error('équation : pas de description de 𝑥');
      const choix = [`${X} : ${h.inconnue}`];
      vus.forEach((q, nom) => { if(!q.ref) choix.push(`${art(nom)} : ${q.e.texte}`); });
      blocs.push(['Je choisis l’inconnue', choix]);
      let eq, resous;
      const vis = card.visible.map(Number), V = vis.reduce((a, b) => a + b, 0);
      const lignes = m.calculs.filter(Boolean);
      if(m.mode === 'sansTotal'){
        const g = m.rows[1], k = g.cells.length;
        const rE = card._rel.relations.find(r => r.op === 'ADD' || r.op === 'SUB');
        eq = [`${k} × ${X} = ${X} + ${N(rE.k)}`];
        resous = lignes.map(l => enqueteLigneCalcul(l));
      }else{
        const termes = [...vus.values()].map(q => q.n === 1 ? q.e.texte : (q.e.texte === X ? `${q.n} × ${X}` : `${q.n} × (${q.e.texte})`));
        eq = [`${termes.concat(vis.map(N)).join(' + ')} = ${N(card.total)}`];
        const T = Number(card.total), Kx = `${K} × ${X}`;
        if(A > 0){
          /* « 4 × 𝑥 − 4 = 92 », « 4 × 𝑥 = 92 + 4 = 96 », puis la suite du corrigé de l'outil (à partir de « 𝑥 = 96 ÷ 4 ») */
          const i = lignes.findIndex(l => l.g === Kx);
          if(i < 0) throw new Error('équation : pas de ligne « ' + Kx + ' » dans le corrigé');
          const gauche = Kx + (B ? ` + ${N(B)}` : '');
          resous = [`${gauche} − ${N(A)} = ${N(T)}`, `${gauche} = ${N(T)} + ${N(A)} = ${N(T + A)}`].concat(lignes.slice(i + 1).map(l => enqueteLigneCalcul(l)));
          if(B) resous.splice(2, 0, `${Kx} = ${N(T + A)} − ${N(B)} = ${N(T + A - B)}`);
        }else if(V > 0){
          /* une quantité déjà connue : « 2 × 𝑥 + 2 = 20 − 4 = 16 », puis la suite */
          const l0 = lignes[0];
          resous = [`${l0.g} = ${N(T)} − ${vis.map(N).join(' − ')} = ${l0.d}`].concat(lignes.slice(1).map(l => enqueteLigneCalcul(l)));
        }else{
          resous = lignes.map(l => enqueteLigneCalcul(l));
        }
      }
      blocs.push(['J’écris l’équation', eq]);
      blocs.push(['Je résous', resous]);
      }
    }else if(spec.famille === 'D'){
      const sit = card._sys, C = sit.colors;
      const L = k => investigateColorInitial(investigateColorByKey(k));
      C.forEach(k => { env[L(k)] = Number(sit.values[k]); });
      const leg = Object.entries(spec.habit.legende).map(([nom, quoi]) => `${h.lettres[nom]} : ${(spec.habit.legendeLettre && spec.habit.legendeLettre[nom]) ? 'la ' + spec.habit.legendeLettre[nom] : 'le prix d’' + quoi + ', en €'}`);
      blocs.push(['Je choisis les inconnues', leg]);
      /* ② et ③ (15/10/2026, choix de Gwenaël sur planche : « le mélange ») : les étapes du corrigé
         en équations de l'outil (lot M4-8, sysEquationsMorceaux) — le système avec l'accolade, puis
         les étapes aux titres du corrigé en schéma (« Je remplace le petit achat par son prix »,
         « Je retire »…) — sur le plan habillé (titres, ordre de l'énoncé) ; ① et la fin restent
         ceux du livret (la légende des lettres, « Je réponds », « Je vérifie »). */
      const plan = sit.plan.map(e => ({ ...e, barres:e.barres.map(b => ({ ...b })) }));
      const etapes = plan.filter(e => e.role !== 'verification').map(e => {
        const t = spec.habit.titres && spec.habit.titres[e.titre];
        return t ? { ...e, titre:t } : e;
      });
      h.verifs = sit.plan.find(e => e.role === 'verification').lignes.slice();
      window.__ordonnerPlan(etapes, h.verifs, spec);
      carteDessin = { ...card, _sys:{ ...sit, plan:etapes } };
      h.card = carteDessin; window.__habit = h;
      const morceaux = sysEquationsMorceaux(etapes);
      /* « Deux gestes à la suite » (livret 3, H15) : l'outil garde « Le grand plateau » seul, puis le
         petit système — les deux premiers morceaux forment « J'écris le système », chacun avec son titre */
      nSysteme = Math.max(1, etapes.findIndex(e => e.role !== 'plateaux'));
      const tete = morceaux.slice(0, nSysteme);
      if(!morceaux.length || tete.reduce((n, m) => n + m.lignes.length, 0) < 2 || !tete.some(m => m.accolades.length)) throw new Error('équation : le système de l’outil n’a pas au moins deux lignes');
      systemeOutil = morceaux;
      blocsControle.push(...morceaux.map(m => m.lignes));
    }else if(spec.famille === 'N'){
      /* le tout et ses parties : les paquets de l'énoncé, puis les taches (k × 𝑥) */
      const vis = h.paquets || card.visible.map(Number), V = vis.reduce((a, b) => a + b, 0);
      const k = card.hidden.length, T = card.total, x = card.hidden[0];
      env[X] = Number(x);
      if(!h.inconnue) throw new Error('équation : pas de description de 𝑥');
      blocs.push(['Je choisis l’inconnue', [`${X} : ${h.inconnue}`]]);
      const kx = k === 1 ? X : `${k} × ${X}`;
      /* l'ordre de l'énoncé : « 5 minutes d'échauffement, puis 6 matchs » → 5 + 6 × 𝑥 (visiblesAvant) */
      blocs.push(['J’écris l’équation', h.equation ? h.equation.slice() : [k === 1 || h.visiblesAvant ? `${vis.join(' + ')} + ${kx} = ${T}` : `${kx} + ${vis.join(' + ')} = ${T}`]]);
      const res = k === 1 ? [`${X} = ${T} − ${vis.join(' − ')} = ${T - V}`]
        : [`${kx} = ${T} − ${vis.join(' − ')} = ${T - V}`, `${X} = ${T - V} ÷ ${k} = ${x}`];
      blocs.push(['Je résous', res]);
    }else if(spec.famille === 'X'){
      spec.blocs.forEach(b => blocs.push(b));
      env[X] = Number(spec.x);
    }else{
      throw new Error('équation : famille ' + spec.famille + ' pas encore faite');
    }
    /* contrôle : chaque ligne écrite en nombres et en lettres (« 2 × 𝑥 = 47 − 5 = 42 ») doit être
       vraie avec les valeurs de la carte ; les phrases (« Les filles ont donc marqué … ») sont sautées */
    blocs.map(b => b[1]).concat(blocsControle).forEach(lignes => lignes.forEach(t => {
      let s = t.replace(/^[^=]*? : /, '');
      if(!s.includes('=') || /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(s)) return;
      Object.keys(env).forEach(l => { if(!Number.isFinite(env[l])) throw new Error('équation : pas de valeur pour ' + l); s = s.split(l).join('(' + env[l] + ')'); });
      s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.');
      if(!/^[0-9+\-*\/(). =]+$/.test(s)) throw new Error('équation : ligne illisible « ' + t + ' »');
      const v = s.split('=').map(e => Function('return (' + e + ')')());
      if(v.some(a => Math.abs(a - v[0]) > 1e-9)) throw new Error('équation fausse : « ' + t + ' »');
      nControles++;
    }));
    /* les blocs : un titre numéroté (celui des corrigés), puis les lignes, au corps des calculs */
    let y = 40;
    blocs.forEach(([titre, lignes], i) => {
      const g = mkEl('g'); sv.appendChild(g);
      y += enqueteTitreEtape(g, P.boxX, y, i + 1, titre, P, P.boxW);
      const modele = { calculs:lignes.map(t => ({ g:'', d:'', phrase:t })), reponse:[], verification:null, sansIndices:true, ligne:null };
      y += drawEnqueteCalculs(g, carteDessin, { isPrint:true, modele, sansTitre:true, reponse:false, boxY:y }) + 18;
    });
    if(systemeOutil){
      /* les lignes au corps des calculs du livret (56), les titres de l'outil en brun (0,8 du corps),
         l'accolade dessinée comme celle de l'outil (drawSysCorrectionEquations) */
      /* trois inconnues (livret 2, H10) : les lignes resserrées, sinon le corrigé d'un quart de page tombe sous 4 pt */
      const E = (card._sys && card._sys.colors.length > 2) ? Object.assign({}, SYS_EQ, { pas:1.12, hTitre:1.15, ecartEtape:0.25 }) : SYS_EQ;
      const fs = P.calcFont, ft = Math.round(fs * E.titre), x0 = P.boxX;
      const ligne = (g, x, yy, t) => g.appendChild(mkText(x, yy + fs * 0.85, t, { 'text-anchor':'start', 'font-size':fs, 'font-weight':E.poidsEq, fill:E.encre }));
      const accolade = (g, yh, yb) => {
        const d = 0.3 * fs, xb = x0 + E.retrait + 0.3 * fs, ym = (yh + yb) / 2;
        g.appendChild(mkEl('path', { d:`M ${xb + d} ${yh} Q ${xb} ${yh} ${xb} ${yh + d} L ${xb} ${ym - d} Q ${xb} ${ym} ${xb - d * 0.8} ${ym} Q ${xb} ${ym} ${xb} ${ym + d} L ${xb} ${yb - d} Q ${xb} ${yb} ${xb + d} ${yb}`,
          fill:'none', stroke:E.encre, 'stroke-width':Math.max(3, fs * 0.08), 'stroke-linecap':'round', 'stroke-linejoin':'round' }));
      };
      const morceau = (g, m, avecTitre) => {
        if(avecTitre){ g.appendChild(mkText(x0, y + ft * 0.95, m.titre, { 'text-anchor':'start', 'font-size':ft, 'font-weight':E.poidsTitre, fill:E.couleurTitre })); y += ft * E.hTitre; }
        const y0 = y, acc = m.accolades || [];
        m.lignes.forEach((l, k) => { ligne(g, x0 + E.retrait + (acc.some(([a, z]) => k >= a && k <= z) ? E.accolade * fs : 0), y, l); y += fs * E.pas; });
        acc.forEach(([a, z]) => accolade(g, y0 + a * fs * E.pas, y0 + z * fs * E.pas + 1.15 * fs));
        y += fs * E.ecartEtape;
      };
      const g2 = mkEl('g'); sv.appendChild(g2);
      y += enqueteTitreEtape(g2, P.boxX, y, blocs.length + 1, 'J’écris le système', P, P.boxW);
      systemeOutil.slice(0, nSysteme).forEach(m => morceau(g2, m, nSysteme > 1));
      const g3 = mkEl('g'); sv.appendChild(g3);
      coupes.push(y);
      y += enqueteTitreEtape(g3, P.boxX, y, blocs.length + 2, 'Je résous', P, P.boxW);
      systemeOutil.slice(nSysteme).forEach(m => { coupes.push(y); morceau(g3, m, true); });
      y += 18 - fs * E.ecartEtape;
    }
    /* 2 problèmes par page, l'un sous l'autre (livret 3, H14-H15) : la carte est large et basse ; le
       corrigé passe sur deux colonnes, coupé entre deux étapes de « Je résous » (au plus près de la
       moitié), puis « Je réponds » et « Je vérifie » dessous, sur toute la largeur */
    if(spec.colonnes === 2 && coupes.length){
      const haut = 40, milieu = haut + (y - haut) / 2;
      const yc = coupes.reduce((a, b) => Math.abs(b - milieu) < Math.abs(a - milieu) ? b : a);
      const feuilles = [...sv.querySelectorAll('text, path, rect, line, circle')];
      const boites = feuilles.map(el => ({ el, b:el.getBBox() }));
      const col1 = boites.filter(o => o.b.y + o.b.height / 2 < yc), col2 = boites.filter(o => o.b.y + o.b.height / 2 >= yc);
      const droite1 = Math.max(...col1.map(o => o.b.x + o.b.width));
      const dx = droite1 + 90 - P.boxX, dy = haut - yc;
      col2.forEach(o => o.el.setAttribute('transform', `translate(${dx} ${dy})${o.el.getAttribute('transform') ? ' ' + o.el.getAttribute('transform') : ''}`));
      y = Math.max(...col1.map(o => o.b.y + o.b.height), ...col2.map(o => o.b.y + o.b.height + dy)) + 30;
    }
    const fin = mkEl('g'); sv.appendChild(fin);
    const boxW = ENQ_PROFIL_IMPRIME.boxW;
    if(spec.largeur) ENQ_PROFIL_IMPRIME.boxW = spec.largeur;   // 2 problèmes par page : « Je réponds » plus étroit
    try{
      drawEnqueteCalculs(fin, carteDessin, { isPrint:true, modele:{ calculs:[], reponse:[{ i:0 }], verification:spec.famille === 'C' ? enqueteBarresModele(card).verification : null,
        sansIndices:false, filtreIndices:null, ligne:null }, sansTitre:true, boxY:y });   /* « Je vérifie » : le total ET chaque indice (17/10/2026) */
    }finally{ ENQ_PROFIL_IMPRIME.boxW = boxW; }
  }catch(e){ window.__habit = null; sv.remove(); return { erreur:String(e && e.message || e) }; }
  window.__habit = null;
  /* (17/10/2026) le plancher d'écriture (render.py, PLANCHER) : dans quelques corrigés serrés, les plus petites
     écritures (les petits calculs du Système, les noms sous une accolade courte, le chiffre des titres)
     remontent à 4,5 pt sur le papier ; le reste du dessin ne bouge pas */
  if(spec.plancher) sv.querySelectorAll('text').forEach(t => { const f = parseFloat(t.getAttribute('font-size')); if(f < spec.plancher) t.setAttribute('font-size', String(spec.plancher)); });
  const bb = sv.getBBox();
  const textes = [...sv.querySelectorAll('text')].map(t => t.textContent).filter(t => t.trim());
  const noms = Object.values(h.noms).concat(Object.values(h.articles || {}));
  const nettoie = t => noms.reduce((s, n) => s.split(n).join(''), t);
  const reste = textes.filter(t => /tache|jeton|plateau|noire|verte|bleue|rouge|orange|violette/i.test(nettoie(t)) || /TOTAL/.test(t));
  const out = { svg:sv.innerHTML, bb:[bb.x - 10, bb.y - 10, bb.width + 20, bb.height + 20], textes, reste, blocs, controles:nControles };
  sv.remove();
  return out;
};

/* ===================== Livret 3 : la balance (monde 5, fiche 37) =====================
   Les schémas viennent de l'outil des Équations (balance.js, __balance : la correction « le schéma
   en barres » de la fiche 37) ; ici, dans la page de l'outil SPLAT!, on pose devant chacun un
   titre numéroté (enqueteTitreEtape, comme les autres corrigés), le nom de chaque barre à gauche
   du premier, un calcul à droite quand il y en a un, puis « Je réponds » et « Je vérifie »
   (drawEnqueteCalculs). Une seule teinte : le clair du livret à la place du gris de l'outil.
   spec = { bandes, etats, lettre, habit:{ rangs, depart, objet, unite, noms, reponse, verifs },
            teinte, exemple } ; exemple : chaque étape dans son propre dessin (la page 2). */
window.__balanceTitres = function(etats, h, lettre){
  const X = lettre ? '𝑥' : '?';
  return etats.map(e => {
    if(e.kind === 'depart') return h.depart;
    if(e.kind === 'retireX') return h.objet ? `J’enlève ${e.n} ${e.n > 1 ? h.objet[1] : h.objet[0]} de chaque côté` : `J’enlève ${e.n} × ${X} de chaque côté`;
    if(e.kind === 'retireV') return `J’enlève ${e.n} ${h.unite} de chaque côté`;
    if(e.kind === 'partage') return `Je partage en ${e.k}`;
    throw new Error('balance : étape ' + e.kind);
  });
};
window.__balanceCalculs = function(etats, eq){
  const paquets = s => (s.visible || []).map(Number);
  return etats.map(e => {
    if(e.kind === 'depart'){
      const l = [eq.left, eq.right].map(paquets).filter(p => p.length > 1).map(p => `${p.join(' + ')} = ${p.reduce((a, b) => a + b, 0)}`);
      return l.join('   ');
    }
    if(e.kind === 'retireV') return `${e.avant} − ${e.n} = ${e.apres}`;
    if(e.kind === 'partage') return `${e.reste} ÷ ${e.k} = ${e.x}`;
    return '';
  });
};
window.__corrigeBalance = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  const mkEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const mkText = (x, y, t, a = {}) => { const e = mkEl('text', { x, y, ...a }); e.textContent = t; return e; };
  const P = enqueteProfil({ isPrint:true });
  const h = spec.habit, clair = spec.teinte[1];
  const titres = window.__balanceTitres(spec.etats, h, spec.lettre);
  const calculs = window.__balanceCalculs(spec.etats, spec.eq);
  const X0 = 320, RANG = 44, F = P.numFont;
  const etapes = [];
  const dessine = (sv, i, y) => {
    const b = spec.bandes[i];
    const g = mkEl('g', { transform:`translate(${X0} ${y - b.y0 - b.bb[1]})` });
    g.innerHTML = b.svg.split('rgba(0,0,0,0.10)').join(clair);
    sv.appendChild(g);
    const haut = b.bb[3];
    if(i === 0 && h.rangs){   // le nom de chaque barre, à gauche du premier schéma
      const rowH = haut / 2;
      h.rangs.forEach((r, j) => sv.appendChild(mkText(X0 - 26, y + rowH * (j + 0.5) + RANG * 0.36, r, { 'text-anchor':'end', 'font-size':RANG, 'font-weight':700, fill:'#374151' })));
    }
    if(calculs[i]) sv.appendChild(mkText(X0 + b.bb[0] + b.bb[2] + 50, y + haut / 2 + F * 0.36, calculs[i], { 'text-anchor':'start', 'font-size':F, 'font-weight':700, fill:'#111827' }));
    return haut;
  };
  const fauxCarte = { family:'X', total:0, visible:[], hidden:[] };
  const habitFin = () => { window.__habit = { ...h, famille:'X', card:fauxCarte, noms:Object.fromEntries(Object.entries(h.noms).map(([a, b]) => [String(a), b])) }; };
  try{
    if(spec.exemple){
      spec.bandes.forEach((b, i) => {
        const sv = mkEl('svg', { viewBox:'0 0 1600 1000', width:'1600', height:'1000' }); document.body.appendChild(sv);
        dessine(sv, i, 20);
        const bb = sv.getBBox();
        etapes.push({ svg:sv.innerHTML, vb:[bb.x - 6, bb.y - 6, bb.width + 12, bb.height + 12], titre:titres[i], calcul:calculs[i] });
        sv.remove();
      });
      habitFin();
      const segs = window.__habitSegmentsReponse();
      window.__habit = null;
      return { etapes, reponse:segs, verification:(h.verifs || []).join(' · ') };
    }
    const sv = mkEl('svg', { viewBox:'0 0 1600 4000', width:'1600', height:'4000' }); document.body.appendChild(sv);
    let y = 40;
    spec.bandes.forEach((b, i) => {
      y += enqueteTitreEtape(sv, P.boxX, y, i + 1, titres[i], P, P.boxW) + 12;
      y += dessine(sv, i, y) + 34;
    });
    habitFin();
    const fin = mkEl('g'); sv.appendChild(fin);
    drawEnqueteCalculs(fin, fauxCarte, { isPrint:true, modele:{ calculs:[], reponse:[{ i:0 }], verification:null, sansIndices:false, ligne:null }, sansTitre:true, boxY:y });
    window.__habit = null;
    const bb = sv.getBBox();
    const textes = [...sv.querySelectorAll('text')].map(t => t.textContent).filter(t => t.trim());
    const noms = Object.values(h.noms).concat(h.rangs || []);
    const nettoie = t => noms.reduce((s, n) => s.split(n).join(''), t);
    const reste = textes.filter(t => /tache|jeton|plateau|noire|verte|bleue|rouge|orange|violette/i.test(nettoie(t)) || /TOTAL/.test(t));
    const out = { svg:sv.innerHTML, bb:[bb.x - 10, bb.y - 10, bb.width + 20, bb.height + 20], textes, reste, titres };
    sv.remove();
    return out;
  }catch(e){ window.__habit = null; return { erreur:String(e && e.message || e) }; }
};

/* ===================== Livret 3 : l'exemple « deux gestes à la suite » (page 9) =====================
   Les étapes du corrigé de l'outil (le plan _sys.plan, habillé), chacune dans son propre dessin
   (drawSysEtape, sans son titre : la page l'écrit à gauche, avec une légende), au profil
   d'impression. spec = { graine, valeurs, habit, lettre } */
window.__exempleSys = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  const mkEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const mkText = (x, y, t, a = {}) => { const e = mkEl('text', { x, y, ...a }); e.textContent = t; return e; };
  const card = genSystem(makeRng(String(spec.graine)));
  const vals = card.hidden.map(Number).slice().sort((a, b) => a - b);
  if(JSON.stringify(vals) !== JSON.stringify(spec.valeurs)) return { erreur:'graine ' + spec.graine + ' : ' + vals };
  const h = { ...spec.habit, famille:'D', card };
  h.noms = Object.fromEntries(Object.entries(h.noms).map(([k, v]) => [String(k), v]));
  const plan = card._sys.plan.map(e => ({ ...e, barres:e.barres.map(b => ({ ...b })) }));
  const verif = plan.find(e => e.role === 'verification');
  const etapes = plan.filter(e => e.role !== 'verification').map(e => {
    const t = spec.habit.titres && spec.habit.titres[e.titre];
    return t ? { ...e, titre:t } : e;
  });
  h.verifs = verif.lignes.slice();
  window.__ordonnerPlan(etapes, h.verifs, spec);
  const carteDessin = { ...card, _sys:{ ...card._sys, plan:etapes } };
  h.card = carteDessin;
  window.__habit = h;
  const out = [];
  try{
    const M = sysBarresMetriques(1);
    const ctx = { mkEl, mkText, isPrint:true, lettres:!!spec.lettre };
    etapes.forEach(e => {
      const sv = mkEl('svg', { viewBox:'0 0 1600 1600', width:'1600', height:'1600' }); document.body.appendChild(sv);
      const g = mkEl('g'); sv.appendChild(g);
      drawSysEtape(g, { ...e, titre:'' }, 40, 20, M, ctx);
      [...g.querySelectorAll('text')].forEach(t => { if(!t.textContent.trim()) t.remove(); });
      const bb = g.getBBox();
      const textes = [...g.querySelectorAll('text')].map(t => t.textContent).filter(t => t.trim());
      out.push({ svg:sv.innerHTML, vb:[bb.x - 6, bb.y - 6, bb.width + 12, bb.height + 12], titre:e.titre, role:e.role, calculs:e.barres.map(b => b.calcul || ''), textes });
      sv.remove();
    });
    const segs = window.__habitSegmentsReponse();
    const leg = Object.entries(spec.habit.legende).map(([nom, quoi]) => `${h.lettres[nom]} : ${quoi}`);
    window.__habit = null;
    const noms = Object.values(h.noms);
    const nettoie = t => noms.reduce((s, n) => s.split(n).join(''), t);
    const reste = out.flatMap(e => e.textes.concat([e.titre])).filter(t => /tache|jeton|plateau|noire|verte|bleue|rouge|orange|violette/i.test(nettoie(t)) || /TOTAL/.test(t));
    if(reste.length) return { erreur:'mots de l’outil restés : ' + reste.join(' | ') };
    return { etapes:out, reponse:segs, verification:h.verifs, legende:leg };
  }catch(e){ window.__habit = null; return { erreur:String(e && e.message || e) }; }
};
