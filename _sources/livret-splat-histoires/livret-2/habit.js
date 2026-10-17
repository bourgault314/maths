/* Les histoires de SPLAT! — l'habillage des cartes de l'outil (outils/splat.html), posé dans la
   page de l'outil AU RENDU, sans rien changer à l'outil : les noms du problème à la place des
   couleurs des taches, ses phrases à la place de « la tache … cache … jetons », une seule teinte
   (le vert du livret) pour toutes les barres. Une carte à la fois :
     window.__habit = { card, famille:"C"|"N"|"D", noms:{valeur:nom}, articles, phrases, retourne,
                        reponse, verifs, paquets, lettres, teinte:[fonce, clair] }
   Tout ce qui manque fait échouer le rendu (jamais un mot de l'outil laissé sur le papier). */
(function(){
  const H = () => window.__habit;
  const nomDeValeur = v => { const h = H(); return h && v != null ? (h.noms[String(v)] || null) : null; };
  /* la clé d'une couleur → le nom de la quantité qu'elle cache */
  const nomDeCle = key => {
    const h = H(); if(!h) return null;
    const c = h.card;
    if(c._rel){ const i = c._rel.colorMap.indexOf(key); return i < 0 ? null : nomDeValeur(c._rel.hiddenValues[i]); }
    if(c._sys){ const v = c._sys.values[key]; return v == null ? null : nomDeValeur(v); }
    return null;
  };
  window.__habitNomDeCle = nomDeCle;

  /* ---- la teinte unique (01 du 07/10 : « barres du corrigé d'une seule teinte, le vert du livret ») */
  const oByKey = investigateColorByKey;
  window.investigateColorByKey = function(key){
    const c = oByKey(key), h = H();
    return h && h.teinte ? { ...c, print:h.teinte[0], printReveal:h.teinte[1] } : c;
  };
  /* ---- les noms */
  const oWord = investigateColorWord;
  window.investigateColorWord = function(info){ const n = info && nomDeCle(info.key); return n || oWord(info); };
  const oIni = investigateColorInitial;
  window.investigateColorInitial = function(info){
    const h = H(), n = info && nomDeCle(info.key);
    if(h && n){ if(!h.lettres || !h.lettres[n]) throw new Error('habillage : pas de lettre pour ' + n); return h.lettres[n]; }
    return oIni(info);
  };
  const oArt = enqueteArticle;
  window.enqueteArticle = function(mot, rep){ const h = H(); if(h && h.articles && h.articles[mot]) return h.articles[mot]; return oArt(mot, rep); };

  /* ---- Enquête : « Je retourne » et les phrases des calculs */
  const oModele = enqueteBarresModele;
  window.enqueteBarresModele = function(card){
    const m = oModele(card); const h = H();
    if(!m || !h || h.card !== card) return m;
    /* « Je vérifie » des corrigés des histoires (17/10/2026, choix de Gwenaël après l'audit) : le total ET
       chaque indice, en mots (« filles = garçons + 5 : 26 = 21 + 5 ✓ ») ; sans total, les deux indices.
       L'outil et les livrets de l'Enquête gardent « le total seulement » (07/10/2026). */
    if(h.famille === 'C' && !h.verifTotalSeul){ m.sansIndices = false; m.filtreIndices = null; }
    const manque = [];
    if(m.reformulation){ if(h.retourne) m.reformulation = h.retourne; else manque.push('retourne'); }
    (m.calculs || []).forEach(c => {
      if(!c || !c.phrase) return;
      const t = h.phrases && h.phrases[c.g];
      if(!t){ manque.push('phrase ' + c.g); return; }
      c.phrase = t.replace('{d}', c.d);
    });
    if(manque.length) throw new Error('habillage incomplet : ' + manque.join(', '));
    /* « je complète » : sous le schéma regroupé, l'outil écrit « une orange » (une part qui vaut la
       tache orange) ; avec un nom d'histoire (« une Lila », « une 3e »), on écrit le nom seul */
    if(m.ligne && m.ligne.groupes) m.ligne.groupes.forEach(r => {
      if(typeof r.label === 'string' && r.label.startsWith('une ') && Object.values(h.noms).includes(r.label.slice(4))) r.label = r.label.slice(4);
    });
    return m;
  };
  /* ---- « Je vérifie » resserré (17/10/2026) : le corrigé des histoires vérifie aussi chaque indice ; quand ses
     lignes passent à la ligne, on essaie une écriture un peu plus petite (42 → 36, jamais sous le chiffre des
     titres d'étape, 36) qui en fait tenir plus par ligne. Rend la hauteur gagnée. */
  window.__verifsSerrees = function(sv){
    const items = [...sv.querySelectorAll('text[data-verif]')];
    if(items.length < 2 || items[0].getAttribute('data-verif') !== 'titre') return 0;
    const P = ENQ_PROFIL_IMPRIME, x0 = P.boxX + P.marge, largeur = P.boxW - 2 * P.marge;
    const f0 = parseFloat(items[0].getAttribute('font-size'));
    const yTop = parseFloat(items[0].getAttribute('y')) - (f0 * 0.7 + pastilleTextDy(f0));
    const poids = it => it.getAttribute('data-verif') === 'titre' ? 800 : 700;
    const ranger = vf => {
      let x = x0, ligne = 0; const places = [];
      items.forEach((it, k) => {
        const w = enqueteTexteLargeur(it.textContent, vf, poids(it));
        if(k && x + w > x0 + largeur){ x = x0; ligne++; }
        places.push([x, ligne]); x += w + Math.round(vf * 1.1);
      });
      return { lignes:ligne + 1, places };
    };
    const avant = ranger(f0);
    for(let vf = f0 - 2; vf >= 36; vf -= 2){
      const r = ranger(vf);
      if(r.lignes >= avant.lignes) continue;
      items.forEach((it, k) => {
        const [x, l] = r.places[k];
        it.setAttribute('font-size', vf); it.setAttribute('x', x);
        it.setAttribute('y', yTop + l * Math.round(vf * 1.25) + vf * 0.7 + pastilleTextDy(vf));
      });
      return avant.lignes * Math.round(f0 * 1.25) - r.lignes * Math.round(vf * 1.25);
    }
    return 0;
  };

  /* ---- « Je réponds » : la phrase du problème, les nombres en gras */
  const segmentsReponse = () => {
    const h = H();
    const parNom = {}; Object.entries(h.noms).forEach(([v, nom]) => { parNom[nom] = v; });
    const segs = [];
    h.reponse.split(/\{([^}]+)\}/).forEach((s, k) => {
      if(k % 2){ if(!(s in parNom)) throw new Error('réponse : {' + s + '}'); segs.push({ t:String(parNom[s]), gras:true }); }
      else if(s) segs.push({ t:s, gras:false });
    });
    return segs;
  };
  window.__habitSegmentsReponse = segmentsReponse;
  const oRep = enqueteReponsePhrase;
  window.enqueteReponsePhrase = function(card, modele){
    const h = H(); if(!h || h.card !== card) return oRep(card, modele);
    return segmentsReponse();
  };
  /* ---- « Je vérifie » des cartes qui n'ont pas d'indice (Classique, Système) : h.verifs */
  const oVerif = enqueteG3VerifIndices;
  window.enqueteG3VerifIndices = function(card, filtre){
    const h = H(); if(h && h.card === card && h.famille !== "C") return (h.verifs || []).slice();
    return oVerif(card, filtre);
  };

  /* ---- Système : une case de barre = une case teintée et la lettre de la quantité (les noms ne
     tiennent pas dans une case de 6 mm) ; une quantité trouvée : sa valeur dans la case blanche */
  const oCase = drawSysCaseBarre;
  window.drawSysCaseBarre = function(g, x, y, c, M, ctx){
    const h = H();
    if(!h || !h.card._sys || c.kind === "visible") return oCase(g, x, y, c, M, ctx);
    const { mkEl, mkText } = ctx;
    const u = M.pas, hh = M.hCase, cx = x + u / 2, cy = y + hh / 2;
    const centre = { "text-anchor":"middle", "dominant-baseline":"middle", dy:"0.06em" };
    if(c.kind === "known"){
      g.appendChild(mkEl("rect", { x, y, width:u, height:hh, fill:"#fff", stroke:"#000", "stroke-width":2.5 * M.f }));
      g.appendChild(mkText(cx, cy, String(c.value), Object.assign({ "font-size":sysCorrAjuster(String(c.value), M.fsBloc, u - 12 * M.f, 900, 8), "font-weight":900, fill:"#000" }, centre)));
      return;
    }
    const nom = nomDeCle(c.color);
    if(!nom) throw new Error('habillage : pas de nom pour la couleur ' + c.color);
    const t = investigateColorInitial(investigateColorByKey(c.color));
    g.appendChild(mkEl("rect", { x, y, width:u, height:hh, fill:h.teinte ? h.teinte[1] : "#e2e8f0", stroke:"#000", "stroke-width":2.5 * M.f }));
    const lettre = /^[\u{1D434}-\u{1D467}]/u.test(t);
    g.appendChild(mkText(cx, cy, t, Object.assign({ "font-size":sysCorrAjuster(t, M.fsBloc * (lettre ? 1.2 : 1), u - 12 * M.f, 900, 8),
      "font-weight":lettre ? 400 : 900, fill:"#000" }, lettre ? { "font-style":"italic", style:"font-family:SplatLettres, 'Times New Roman', serif" } : {}, centre)));
  };
  /* ---- Système : le système écrit à côté des deux plateaux (« 2 enfants + 3 adultes = 36 »,
     en lettre « 2 × 𝑒 + 3 × 𝑎 = 36 ») */
  const oEcrit = sysSystemeEcrit;
  window.sysSystemeEcrit = function(b, lettres){
    const h = H();
    if(!h || !h.card._sys) return oEcrit(b, lettres);
    if(String(b.top) === "?" || !b.cells.length) return null;
    const n = new Map(), vis = [];
    for(const c of b.cells){
      if(c.kind === "unknown" || c.kind === "known") n.set(c.color, (n.get(c.color) || 0) + 1);
      else if(c.kind === "visible") vis.push(String(c.value));
      else return null;
    }
    const termes = [...n].map(([k, m]) => {
      const nom = nomDeCle(k);
      if(!nom) throw new Error('habillage : pas de nom pour ' + k);
      if(lettres) return (m > 1 ? `${m} × ` : "") + investigateColorInitial(investigateColorByKey(k));
      const pl = h.pluriels && h.pluriels[nom];
      if(m > 1 && !pl) throw new Error('habillage : pas de pluriel pour ' + nom);
      return m > 1 ? `${m} ${pl}` : `1 ${nom}`;
    });
    return `${termes.concat(vis).join(" + ")} = ${b.top}`;
  };
})();
