/* Les histoires de SPLAT! — « on cherche le tout » (lot A du 17/10/2026, décision de Gwenaël : un
   problème par livret où le TOTAL est l'inconnue : 4.2, 6.2, 13.2). Ces problèmes n'ont pas de carte
   SPLAT! : sur une carte, le total est toujours donné. Leur corrigé est quand même dessiné par les
   fonctions de l'Enquête (drawEnqueteBarres, drawEnqueteLigne, drawEnqueteCalculs), sur un MODÈLE
   écrit à la main dans habillage.py (clé « tout ») : ① le schéma de comparaison, ② le schéma
   regroupé, ③ je calcule, puis « Je réponds » et « Je vérifie » — le même dessin que les voisins de
   la fiche. « ? » (𝑥 en lettre) n'est que sur le total : c'est lui qu'on cherche.
   À évaluer dans outils/splat.html après habit.js et corrige.js (render.py de chaque livret).
     spec = { titre1, rows:[{ label, cells:[…], sous:[{ de, a, label }] }], ligne:[{ label, cells:[…] }],
              calculs:[ligne | null], habit:{ noms, reponse, verifs }, teinte, lettre }
     une case : { v } un nombre connu, dans une case teintée (une quantité dont on connaît la valeur) ;
                { v, blanc:1 } un nombre ajouté (« 9 de plus »), dans une case blanche, comme l'outil.
   Rend { svg, bb, textes, reste } ou { erreur }. */
window.__tout = function(spec){
  const NS = 'http://www.w3.org/2000/svg';
  const mkEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const SYM = spec.lettre ? '𝑥' : '?';
  /* une fausse carte : seulement pour la teinte des cases (habit.js la remplace par le vert du livret) */
  const card = { family:'C', total:0, visible:[], hidden:[], _rel:{ colorMap:['green'], hiddenValues:[0], relations:[] } };
  const cellule = c => c.blanc ? { kind:'nombre', v:c.v } : { kind:'part', de:0, v:c.v, valeur:c.v };
  const modele = {
    mode:'tout', lettres:!!spec.lettre, symbole:null, reformulation:null, preLignes:[], titre1:spec.titre1,
    rows:spec.rows.map(r => ({ label:r.label, cells:r.cells.map(cellule), sous:r.sous || [] })),
    accolade:SYM,
    ligne:{ total:SYM, groupes:spec.ligne.map(gr => ({ label:gr.label, cells:gr.cells.map(cellule) })) },
    calculs:spec.calculs.map(t => t == null ? null : ({ g:'', d:'', phrase:t.split('?').join(SYM) })),
    reponse:[{ i:0 }], verification:null, sansIndices:false, filtreIndices:null,
    texteCellule:c => String(c.v)
  };
  const sv = mkEl('svg', { viewBox:'0 0 1600 4000', width:'1600', height:'4000' });
  document.body.appendChild(sv);
  /* « Je réponds » : la phrase de habillage.py ; « Je vérifie » : ses lignes (verifs), via habit.js */
  const h = { ...spec.habit, famille:'X', card, teinte:spec.teinte };
  h.noms = Object.fromEntries(Object.entries(h.noms).map(([k, v]) => [String(k), v]));
  try{
    window.__habit = h;
    const o = { isPrint:true, modele };
    const couche = mkEl('g'); sv.appendChild(couche);
    /* empilés comme drawEnqueteCorrectionImprimee : chaque bloc dessiné à y = 620, puis descendu */
    let y = 40;
    [l => drawEnqueteBarres(l, card, o), l => drawEnqueteLigne(l, card, o), l => drawEnqueteCalculs(l, card, { ...o, reponse:true })].forEach(d => {
      const layer = mkEl('g'); couche.appendChild(layer);
      const hh = Number(d(layer)) || 0;
      if(!hh) throw new Error('un bloc du corrigé est vide');
      layer.setAttribute('transform', `translate(0 ${Math.round(y - 620)})`);
      y += hh + ENQ_PROFIL_IMPRIME.pas;
    });
  }catch(e){ window.__habit = null; sv.remove(); return { erreur:String(e && e.message || e) }; }
  window.__habit = null;
  const bb = sv.getBBox();
  const textes = [...sv.querySelectorAll('text')].map(t => t.textContent).filter(t => t.trim());
  /* aucun mot de l'outil ne doit rester (les noms du problème mis à part) */
  const noms = Object.values(h.noms);
  const nettoie = t => noms.reduce((s, n) => s.split(n).join(''), t);
  const reste = textes.filter(t => /tache|jeton|plateau|noire|verte|bleue|rouge|orange|violette/i.test(nettoie(t)) || /TOTAL/.test(t));
  const out = { svg:sv.innerHTML, bb:[bb.x - 10, bb.y - 10, bb.width + 20, bb.height + 20], textes, reste };
  sv.remove();
  return out;
};
