"use strict";
/* =====================================================================
   L'atelier Solèy — concepteur de niveaux (lot 1)
   SPEC-ATELIER-NIVEAUX.md, à la racine du dépôt.

   Ce fichier est PUREMENT ADDITIF : il ne modifie aucun des quatre modules
   du jeu (levels/engine/render/ui). Chargé en dernier, il partage leur
   portée de script et réutilise directement leurs fonctions — c'est ce qui
   permet au mode Jouer d'être le VRAI moteur et non une imitation.

   Deux points de mécanique à garder en tête :
   · l'indice du niveau courant (`cur`) est interne aux modules ; le seul
     chemin additif pour faire jouer un brouillon est de lui réserver une
     place à la fin de `LV` et d'appeler `openLevel` dessus (voir ATIDX) ;
   · la sauvegarde du jeu est neutralisée par le rideau posé sur
     Storage.prototype dans soley-atelier.html, AVANT les scripts du jeu.
     Rien ici ne touche « soley-save-v5 ».
   ===================================================================== */
(function(){

/* ===================== Constantes ===================== */

const CLE_BROUILLONS = 'soley-atelier-v1';
const COLS_MIN = 5, COLS_MAX = 12, ROWS_MIN = 4, ROWS_MAX = 8;

/* Les 69 noms du jeu, relevés AVANT d'ajouter le brouillon à LV : ils servent
   au contrôle d'unicité (le nom est la clé de sauvegarde ET la clé de CALC). */
const NOMS_DU_JEU = LV.map(l => l.name);
const NIVEAUX_DU_JEU = LV.map((l, i) => ({ i: i, w: l.w, name: l.name }));

const DIRNOM = ['Nord', 'Est', 'Sud', 'Ouest'];
const DIRLET = ['N', 'E', 'S', 'O'];

/* Les six pièces. `t` est le type lu par le moteur ; `ctor` est le nom du
   constructeur de levels.js, le seul valable dans un bloc exporté — celui de
   la lentille s'appelle `mg`, il n'existe aucun `m()`. */
const PIECES = [
  { t: 'b',  nom: 'Miroir',     neuf: function(){ return b(1, 0); } },
  { t: 's2', nom: 'Prisme ÷2',  neuf: function(){ return s2(1, 0, 2); } },
  { t: 's3', nom: 'Prisme ÷3',  neuf: function(){ return s3(1, 0, 1, 2); } },
  { t: 'm',  nom: 'Lentille +', neuf: function(){ return mg(0, 2, 1); } },
  { t: 'x2', nom: 'Loupe ×2',   neuf: function(){ return x2(1, 0); } },
  { t: 'x3', nom: 'Loupe ×3',   neuf: function(){ return x3(1, 0); } }
];

const OBJETS = [
  { type: 'sun',    nom: 'Soleil' },
  { type: 'target', nom: 'Case créole' },
  { type: 'rock',   nom: 'Roche' },
  { type: 'fruit',  nom: 'Fruit' },
  { type: 'gate',   nom: 'Passe étroite' }
];

/* Le dégradé du soleil est défini UNE SEULE FOIS dans la page (voir le commentaire
   en tête de soley-atelier.html) : le redéfinir ici en ferait un doublon qui
   gagnerait par l'ordre du document et cesserait de peindre dès que l'écran
   Atelier passe en display:none. On ne met donc plus rien. */
const SUNGRAD = '';

/* ===================== État ===================== */

/* `sol` est TOUJOURS un tableau, jamais null : `parNiveau` (engine.js:360) lit
   `LV[i].sol.length` pendant la victoire, et un brouillon sans solution ferait
   planter la célébration du jeu. Tableau vide = pas encore de solution. */
function niveauVide(){
  return {
    w: 'lagon', name: '', sub: '', hint: '',
    cols: 9, rows: 6,
    suns: [], targets: [], rocks: [], fruits: [], gates: [], fixed: [], tools: [],
    sol: [], solMin: null, solB: null
  };
}

/* Tout geste qui change le plateau ou la boîte périme les solutions gardées :
   les indices de `sol` désignent des pièces de la boîte, et les cases changent.
   `solB` (deuxième architecture, un seul niveau du jeu l'utilise) se périme de
   la même façon : mieux vaut la perdre que la garder fausse. */
function oublierSolutions(){
  D.sol = [];
  D.solMin = null;
  D.solB = null;
}

/* Place réservée du brouillon à la fin de LV : openLevel ne contrôle aucune
   borne et ignore les verrous, donc cet emplacement est jouable en permanence. */
let D = niveauVide();
const ATIDX = LV.length;
LV.push(D);

let enMain = null;      /* objet « pris » dans la palette, en attente d'une case */
let fichePosee = null;  /* objet dont la fiche est ouverte */
let brouillonId = null;
let origineNom = null;  /* nom d'origine si le brouillon vient d'un niveau du jeu */
let minuteurDepot = 0;

const $ = function(id){ return document.getElementById(id); };

/* ===================== Petits utilitaires ===================== */

function frac(txt){
  /* pf() vient d'engine.js : « 3 » ou « 1/4 » → [n,d], sinon null. */
  const f = pf(String(txt || '').trim().replace(/\s+/g, ''));
  return (f && f[1] > 0) ? red(f) : null;
}
function fracTxt(f){ return f ? fstr(f) : ''; }

function echapper(t){
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ico(inner, defs){
  return '<svg viewBox="0 0 100 100" aria-hidden="true">' + (defs || '') + inner + '</svg>';
}

function iconeObjet(type){
  const ftype = FRW[D.w] || 'letchi';
  if (type === 'sun')    return ico(sunSVG({ x: 0, y: 0, dir: 1 }), SUNGRAD);
  if (type === 'target') return ico(targetSVG({ x: 0, y: 0, need: [1, 2] }, null, '', 0));
  if (type === 'rock')   return ico(D.w === 'canne' ? canneSVG(0, 0, 0) : rockSVG(0, 0, 0));
  if (type === 'fruit')  return ico(fruitSVG(ftype, 0, 0, false));
  if (type === 'gate')   return ico(gateSVG({ x: 0, y: 0, max: [1, 2] }));
  return '';
}

/* ===================== Ce que l'atelier dit, et où il le dit =====================
   Tout passe par la barre collée sous les onglets. Leçon du premier essai de
   Gwenael : les refus écrits dans la zone d'export vivaient à 1700 px du haut
   de page — « Jouer » semblait ne rien faire alors qu'il refusait poliment.
   L'objet « en main » y reste affiché tant qu'on le tient : c'est lui qui
   avalait les clics et empêchait les fiches de s'ouvrir. */

let dernierMessage = null;

function peindreAlerte(){
  let h = '';
  if (enMain){
    const quoi = enMain.type === 'fixed' ? 'Pièce à sceller' : NOMOBJ[enMain.type];
    h += '<span class="ligne main">' + quoi + ' en main : touche une case libre du plateau. ' +
         '(Échap, ou retouche la palette, pour le reposer.)</span>';
  }
  if (dernierMessage) h += dernierMessage.lignes.map(function(l){
    return '<span class="ligne ' + dernierMessage.classe + '">' + l + '</span>';
  }).join('');
  $('atalerte').innerHTML = h;
}
function alerte(lignes, classe){
  const tab = Array.isArray(lignes) ? lignes : (lignes ? [lignes] : []);
  dernierMessage = tab.length ? { lignes: tab, classe: classe || 'info' } : null;
  peindreAlerte();
}
function message(html, classe){ alerte(html, classe); }
function messages(lignes, classe){ alerte(lignes, classe); }
/* L'export parle deux fois : court en haut, complet près de la zone de texte. */
function messageExport(lignes, classe){
  alerte(lignes, classe);
  $('atmsg').innerHTML = lignes.map(function(l){
    return '<span class="ligne">' + l + '</span>';
  }).join('');
}

/* ===================== Occupation des cases ===================== */

function objetEn(x, y){
  let i;
  i = D.suns.findIndex(function(s){ return s.x === x && s.y === y; });
  if (i >= 0) return { type: 'sun', i: i };
  i = D.targets.findIndex(function(t){ return t.x === x && t.y === y; });
  if (i >= 0) return { type: 'target', i: i };
  i = D.rocks.findIndex(function(r){ return r[0] === x && r[1] === y; });
  if (i >= 0) return { type: 'rock', i: i };
  i = D.fruits.findIndex(function(f){ return f[0] === x && f[1] === y; });
  if (i >= 0) return { type: 'fruit', i: i };
  i = D.gates.findIndex(function(g){ return g.x === x && g.y === y; });
  if (i >= 0) return { type: 'gate', i: i };
  i = D.fixed.findIndex(function(f){ return f[1] === x && f[2] === y; });
  if (i >= 0) return { type: 'fixed', i: i };
  return null;
}

function poser(type, x, y){
  if (objetEn(x, y)) return false;
  if (type === 'sun')         D.suns.push({ x: x, y: y, dir: 1 });
  else if (type === 'target') D.targets.push({ x: x, y: y, need: [1, 2] });
  else if (type === 'rock')   D.rocks.push([x, y]);
  else if (type === 'fruit')  D.fruits.push([x, y]);
  else if (type === 'gate')   D.gates.push({ x: x, y: y, max: [1, 2] });
  else if (type === 'fixed')  D.fixed.push([enMain.def, x, y]);
  else return false;
  return true;
}

function retirer(o){
  const tab = { sun: D.suns, target: D.targets, rock: D.rocks, fruit: D.fruits,
                gate: D.gates, fixed: D.fixed }[o.type];
  if (tab) tab.splice(o.i, 1);
}

const NOMOBJ = { sun: 'Soleil', target: 'Case créole', rock: 'Roche', fruit: 'Fruit',
                 gate: 'Passe étroite', fixed: 'Pièce scellée' };

/* ===================== Dessin du plateau ===================== */

/* Le brouillon joué par le VRAI moteur, plateau nu : seuls le soleil, le décor
   et les pièces SCELLÉES agissent — les pièces de la boîte sont le travail de
   l'élève. On emprunte `cur` et `state.placed` le temps du calcul, puis on les
   rend intacts. C'est ce qui permet de voir le rayon pendant qu'on construit. */
function simulerBrouillon(){
  const memCur = cur, memPlaced = state.placed;
  LV[ATIDX] = D;
  cur = ATIDX;
  state.placed = {};
  let sim = null;
  try { sim = simulate(); } catch (e) { sim = null; }
  cur = memCur;
  state.placed = memPlaced;
  return sim;
}

function dessinerPlateau(){
  const sv = $('atplateau');
  const W = D.cols * CS, H = D.rows * CS;
  const ftype = FRW[D.w] || 'letchi';
  const sim = simulerBrouillon();
  sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  sv.style.aspectRatio = W + ' / ' + H;

  let s = SUNGRAD;
  s += '<rect width="' + W + '" height="' + H + '" fill="#16223f"/>';
  for (let i = 1; i < D.cols; i++)
    s += '<line class="gridline" x1="' + (i * CS) + '" y1="0" x2="' + (i * CS) + '" y2="' + H + '"/>';
  for (let j = 1; j < D.rows; j++)
    s += '<line class="gridline" x1="0" y1="' + (j * CS) + '" x2="' + W + '" y2="' + (j * CS) + '"/>';

  /* Mêmes dessins que le jeu, dans le même ordre de peinture — y compris les
     rayons, leur épaisseur et leur couleur par dénominateur. */
  D.fruits.forEach(function(f){
    s += fruitSVG(ftype, f[0], f[1], !!(sim && sim.fruits.has(f[0] + ',' + f[1])));
  });
  D.rocks.forEach(function(r, i){ s += (D.w === 'canne' ? canneSVG : rockSVG)(r[0], r[1], i); });
  D.gates.forEach(function(g){ s += gateSVG(g); });
  if (sim) sim.segs.forEach(function(sg){
    const x1 = (sg.x1 + 0.5) * CS, y1 = (sg.y1 + 0.5) * CS;
    const x2 = (sg.x2 + 0.5) * CS, y2 = (sg.y2 + 0.5) * CS;
    if (Math.abs(x1 - x2) < 1 && Math.abs(y1 - y2) < 1) return;
    const w = fwidth(sg.val), c = fcol(sg.val);
    s += '<line class="beam" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
         '" stroke="' + c + '" stroke-width="' + w + '" style="filter:drop-shadow(0 0 5px ' + c + ')"/>';
  });
  /* La fraction d'un fruit à valeur se peint APRÈS les rayons — sinon le rayon la
     mange (render.js, 15/08). Depuis que l'atelier montre les rayons pendant qu'on
     construit, il a exactement le même besoin que le jeu. */
  D.fruits.forEach(function(f){ s += fruitValSVG(f[0], f[1], f[2]); });
  D.fixed.forEach(function(f){
    const fl = sim && sim.flows[f[1] + ',' + f[2]];
    s += '<g class="placed fixed-piece" transform="translate(' + (f[1] * CS) + ',' + (f[2] * CS) + ')">' +
         (fl ? pieceFlow(f[0], fl) : pieceStatic(f[0])) + fixedFrame() + '</g>';
  });
  if (sim) sim.segs.forEach(function(sg){
    const x1 = (sg.x1 + 0.5) * CS, y1 = (sg.y1 + 0.5) * CS;
    const x2 = (sg.x2 + 0.5) * CS, y2 = (sg.y2 + 0.5) * CS;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 80) return;
    const k = Math.min(0.5, 60 / len);
    s += beamLblSVG(sg.id, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k - 12 - fwidth(sg.val) / 2, sg.val);
  });
  D.suns.forEach(function(su){ s += sunSVG(su); });
  D.targets.forEach(function(t, i){
    s += targetSVG(t, sim ? sim.stats.find(function(st){ return st.i === i; }) : null,
      D.targets.length > 1 ? 'ABCDEF'[i] : '', i);
  });

  /* Couche de touche, dessinée en dernier pour rester au-dessus. */
  for (let y = 0; y < D.rows; y++) for (let x = 0; x < D.cols; x++){
    const o = objetEn(x, y);
    const quoi = o ? ('Régler : ' + NOMOBJ[o.type]) : ('Case vide, colonne ' + (x + 1) + ', rangée ' + (y + 1));
    s += '<rect class="atcase" role="button" tabindex="0" data-x="' + x + '" data-y="' + y + '" ' +
         'x="' + (x * CS) + '" y="' + (y * CS) + '" width="' + CS + '" height="' + CS + '">' +
         '<title>' + echapper(quoi) + '</title></rect>';
  }
  sv.innerHTML = s;
  majEtat(sim);
}

/* Le diagnostic du jeu, sous le plateau, pendant la construction : ce que la
   case reçoit vraiment, et où en sont les fruits. */
function majEtat(sim){
  const e = $('atetat');
  if (!D.suns.length || !D.targets.length){
    e.innerHTML = '<span class="rien">Pose au moins un soleil et une case créole : ' +
      'le rayon apparaîtra tout de suite.</span>';
    return;
  }
  if (!sim){ e.innerHTML = ''; return; }
  const nf = D.fruits.length;
  const fruits = nf ? '<span class="rien"> · fruits sur le trajet : ' + sim.fruits.size + '/' + nf + '</span>' : '';
  if (sim.win){
    e.innerHTML = '<span class="ok">Toutes les cases sont servies — sans poser une seule pièce. ' +
      'Il faut un obstacle, sinon le niveau n’est pas jouable.</span>' + fruits;
    return;
  }
  const noms = 'ABCDEF';
  const dits = sim.stats.filter(function(x){ return x.st !== 'ok'; }).map(function(x){
    const t = D.targets[x.i];
    const nm = D.targets.length > 1 ? 'Case ' + noms[x.i] : 'La case';
    if (x.st === 'none') return nm + ' n’a pas encore de rayon.';
    if (x.st === 'multi') return nm + ' reçoit plusieurs rayons — un seul par case !';
    return nm + ' reçoit ' + fstr(x.got) + ' au lieu de ' + (t.disp || fstr(t.need)) + '.';
  });
  e.innerHTML = '<span class="bad">' + dits.join(' ') + '</span>' + fruits;
}

/* ===================== Palette et boîte ===================== */

function dessinerPalette(){
  $('atpalette').innerHTML = OBJETS.map(function(o){
    const pris = enMain && enMain.type === o.type;
    return '<button type="button" data-obj="' + o.type + '" aria-pressed="' + (pris ? 'true' : 'false') + '">' +
      iconeObjet(o.type) + '<span>' + o.nom + '</span></button>';
  }).join('');

  $('atajout').innerHTML = PIECES.map(function(p, i){
    return '<button type="button" data-piece="' + i + '">' +
      ico(pieceStatic(p.neuf())) + '<span>' + p.nom + '</span></button>';
  }).join('');

  const boite = $('atboite');
  boite.innerHTML = D.tools.map(function(d, i){
    return '<button type="button" class="chip" data-outil="' + i + '">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true">' + pieceStatic(d) + '</svg>' +
      '<span>' + PNAME[d.t] + '</span></button>';
  }).join('');
  $('atboitevide').hidden = D.tools.length > 0;

  const utiles = D.sol.length;
  $('atsurplus').textContent = D.tools.length
    ? ('Boîte : ' + D.tools.length + ' pièce' + (D.tools.length > 1 ? 's' : '') +
       (utiles ? ' pour ' + utiles + ' utile' + (utiles > 1 ? 's' : '') +
                 ' (surplus ' + (D.tools.length - utiles) + ')' : '') +
       ' — le surplus fait le casse-tête : dans l\u2019original, 6 à 8 pièces pour 3 ou 4 utiles.')
    : 'Le surplus fait le casse-tête : dans l\u2019original, 6 à 8 pièces pour 3 ou 4 utiles.';

  /* Ce qu'on tient s'affiche dans la barre du haut, pas ici : c'est cet état-là
     qui avalait les clics sans que ça se voie. */
  $('atmain').textContent = '';
  peindreAlerte();
}

/* ===================== Fiche du niveau ===================== */

function dessinerFiche(){
  const sel = $('atmonde');
  if (!sel.options.length){
    sel.innerHTML = WORLDS.map(function(w){
      return '<option value="' + w.id + '">' + w.label + '</option>';
    }).join('');
  }
  sel.value = D.w;
  if ($('atnom').value !== D.name) $('atnom').value = D.name;
  if ($('atsub').value !== D.sub) $('atsub').value = D.sub;
  if ($('athint').value !== (D.hint || '')) $('athint').value = D.hint || '';

  const err = $('atnomerr');
  if (!D.name.trim()) err.textContent = '';
  else if (origineNom && D.name === origineNom)
    err.innerHTML = '<span class="atok">Retouche de « ' + echapper(origineNom) +
      ' » : le bloc remplacera l\u2019entrée existante (les sauvegardes des élèves sont conservées).</span>';
  else if (NOMS_DU_JEU.indexOf(D.name) >= 0)
    err.textContent = 'Ce nom existe déjà dans le jeu. Le nom est la clé de sauvegarde : deux niveaux ne peuvent pas le partager.';
  else err.textContent = '';

  const s = $('atsols');
  const bouts = [];
  if (D.sol.length) bouts.push('Solution de référence : ' + D.sol.length + ' pièce' + (D.sol.length > 1 ? 's' : ''));
  if (D.solMin) bouts.push('Solution minimale : ' + D.solMin.length + ' pièce' + (D.solMin.length > 1 ? 's' : ''));
  s.textContent = bouts.length ? bouts.join(' · ') : 'Aucune solution enregistrée : joue le niveau et gagne pour en garder une.';
}

function dessinerGrille(){
  $('atcolval').textContent = D.cols + ' colonnes';
  $('atrowval').textContent = D.rows + ' rangées';
  $('atcolmoins').disabled = D.cols <= COLS_MIN;
  $('atcolplus').disabled = D.cols >= COLS_MAX;
  $('atrowmoins').disabled = D.rows <= ROWS_MIN;
  $('atrowplus').disabled = D.rows >= ROWS_MAX;
  const c = $('atconseil');
  if (D.cols >= 10){
    c.hidden = false;
    c.textContent = 'À partir de 10 colonnes, le jeu conseille déjà de tourner le téléphone : ' +
      'le nombre de cases est borné par la taille de l\u2019écran.';
  } else c.hidden = true;
}

function tout(){
  dessinerGrille();
  dessinerPlateau();
  dessinerPalette();
  dessinerFiche();
  enregistrerBrouillon();
}

/* ===================== Réglage de la grille ===================== */

function debordements(cols, rows){
  const dehors = [];
  const voir = function(x, y, nom){ if (x >= cols || y >= rows) dehors.push(nom + ' en (' + (x + 1) + ',' + (y + 1) + ')'); };
  D.suns.forEach(function(s){ voir(s.x, s.y, 'un soleil'); });
  D.targets.forEach(function(t){ voir(t.x, t.y, 'une case créole'); });
  D.rocks.forEach(function(r){ voir(r[0], r[1], 'une roche'); });
  D.fruits.forEach(function(f){ voir(f[0], f[1], 'un fruit'); });
  D.gates.forEach(function(g){ voir(g.x, g.y, 'une passe'); });
  D.fixed.forEach(function(f){ voir(f[1], f[2], 'une pièce scellée'); });
  return dehors;
}

function changerGrille(dc, dr){
  const cols = Math.min(COLS_MAX, Math.max(COLS_MIN, D.cols + dc));
  const rows = Math.min(ROWS_MAX, Math.max(ROWS_MIN, D.rows + dr));
  if (cols === D.cols && rows === D.rows) return;
  const dehors = debordements(cols, rows);
  if (dehors.length){
    $('atavertgrille').textContent = 'Impossible de rétrécir : ' + dehors.join(', ') +
      ' se retrouverait' + (dehors.length > 1 ? 'nt' : '') + ' hors de la grille.';
    return;
  }
  $('atavertgrille').textContent = '';
  D.cols = cols; D.rows = rows;
  oublierSolutions();
  tout();
}

/* ===================== La feuille de réglage ===================== */

function ouvrirFiche(titre, corps, pied){
  $('atfichetitre').textContent = titre;
  $('atfichecorps').innerHTML = corps;
  $('atfichepied').innerHTML = pied;
  $('atfiche').classList.add('show');
  $('atfichecarte').scrollTop = 0;
  $('atfichecarte').focus({ preventScroll: true });
}
function fermerFiche(){
  $('atfiche').classList.remove('show');
  fichePosee = null;
}

function boutonsDir(name, actuelle, avecAucune){
  let h = '<div class="atdirs">';
  if (avecAucune)
    h += '<button type="button" data-' + name + '="-1" aria-pressed="' + (actuelle === undefined || actuelle === null ? 'true' : 'false') + '">aucune</button>';
  for (let d = 0; d < 4; d++)
    h += '<button type="button" data-' + name + '="' + d + '" aria-pressed="' + (actuelle === d ? 'true' : 'false') + '">' +
      DIRLET[d] + '</button>';
  return h + '</div>';
}

function champ(label, id, valeur, aide){
  return '<label class="atchamp"><span>' + label + '</span>' +
    '<input id="' + id + '" type="text" autocomplete="off" value="' + echapper(valeur) + '"></label>' +
    (aide ? '<div class="atok" style="margin:-4px 0 8px">' + aide + '</div>' : '');
}

function ficheObjet(o){
  fichePosee = o;
  const pied = '<button type="button" class="atbtn danger" id="atficheretirer">Retirer</button>' +
               '<button type="button" class="atbtn" id="atfichefermer">Fermer</button>';

  if (o.type === 'sun'){
    const s = D.suns[o.i];
    ouvrirFiche('Soleil',
      '<div class="atapercu">' + ico(sunSVG({ x: 0, y: 0, dir: s.dir, val: s.val }), SUNGRAD) + '</div>' +
      '<label class="atchamp"><span>Direction du rayon</span></label>' + boutonsDir('sdir', s.dir, false) +
      '<div style="height:10px"></div>' +
      champ('Valeur du rayon (1 par défaut ; « 2 » ou « 1/2 » aussi)', 'atsunval', fracTxt(s.val) || '1'),
      pied);
  } else if (o.type === 'target'){
    const t = D.targets[o.i];
    ouvrirFiche('Case créole',
      '<div class="atapercu">' + ico(targetSVG({ x: 0, y: 0, need: t.need, disp: t.disp, porte: t.porte }, null, '', 0)) + '</div>' +
      champ('Fraction attendue', 'attneed', fracTxt(t.need)) +
      '<label class="atchamp"><span>Porte orientée : le rayon ne peut entrer que par ce côté</span></label>' +
      boutonsDir('tporte', t.porte, true) +
      '<div style="height:10px"></div>' +
      champ('Écriture affichée (facultatif : « 0,5 », « 25 % », « 2/4 »)', 'attdisp', t.disp || ''),
      pied);
  } else if (o.type === 'rock'){
    ouvrirFiche('Roche',
      '<div class="atapercu">' + ico(D.w === 'canne' ? canneSVG(0, 0, 0) : rockSVG(0, 0, 0)) + '</div>' +
      '<p class="atok">Aucun réglage. Au monde des champs de canne, la roche se dessine ' +
      'toute seule en tas de cannes : le rendu suit le monde choisi, comme dans le jeu.</p>',
      pied);
  } else if (o.type === 'fruit'){
    const f = D.fruits[o.i];
    ouvrirFiche('Fruit',
      '<div class="atapercu">' + ico(fruitSVG(FRW[D.w] || 'letchi', 0, 0, false) + fruitValSVG(0, 0, f[2])) + '</div>' +
      champ('Valeur du fruit (vide = fruit simple ; « 1/4 » = fruit marqué)', 'atfval', f[2] ? fracTxt(f[2]) : '',
        'Un fruit marqué n\u2019est ramassé que par un rayon de cette valeur exacte.'),
      pied);
  } else if (o.type === 'gate'){
    const g = D.gates[o.i];
    ouvrirFiche('Passe étroite',
      '<div class="atapercu">' + ico(gateSVG({ x: 0, y: 0, max: g.max })) + '</div>' +
      champ('Fraction maximale qui passe', 'atgmax', fracTxt(g.max),
        'Un rayon passe si sa valeur est inférieure ou égale à celle-ci.'),
      pied);
  } else if (o.type === 'fixed'){
    const d = D.fixed[o.i][0];
    ouvrirFiche('Pièce scellée : ' + PNAME[d.t],
      '<div class="atapercu">' + ico(pieceStatic(d) + fixedFrame()) + '</div>' +
      fichePieceCorps(d) +
      '<p class="atok">Scellée sur le plateau : l\u2019élève ne peut ni la déplacer ni la reprendre.</p>',
      '<button type="button" class="atbtn" id="atficheboite">Remettre dans la boîte</button>' + pied);
  }
}

function fichePieceCorps(d){
  let h = '<div class="atrang" style="margin-bottom:10px">' +
    '<button type="button" class="atbtn" id="atpiecetourne">Tourner d\u2019un quart de tour</button></div>' +
    '<details><summary style="color:#9fb7d8;cursor:pointer;padding:8px 0">Choisir les flèches une à une</summary>';
  if (d.t === 'm'){
    h += '<label class="atchamp"><span>Première entrée</span></label>' + boutonsDir('pin0', d.ins[0], false);
    h += '<div style="height:8px"></div><label class="atchamp"><span>Deuxième entrée</span></label>' + boutonsDir('pin1', d.ins[1], false);
    h += '<div style="height:8px"></div><label class="atchamp"><span>Sortie</span></label>' + boutonsDir('pout', d.out, false);
  } else if (d.t === 's2' || d.t === 's3'){
    h += '<label class="atchamp"><span>Entrée</span></label>' + boutonsDir('pin', d.in, false);
    d.outs.forEach(function(o, k){
      h += '<div style="height:8px"></div><label class="atchamp"><span>Sortie ' + (k + 1) + '</span></label>' +
        boutonsDir('pouts' + k, o, false);
    });
  } else {
    h += '<label class="atchamp"><span>Entrée</span></label>' + boutonsDir('pin', d.in, false);
    h += '<div style="height:8px"></div><label class="atchamp"><span>Sortie</span></label>' + boutonsDir('pout', d.out, false);
  }
  return h + '</details>';
}

function tournerPiece(d){
  const r = function(v){ return (v + 1) % 4; };
  if (d.ins) d.ins = d.ins.map(r);
  if (d.outs) d.outs = d.outs.map(r);
  if (d.in !== undefined) d.in = r(d.in);
  if (d.out !== undefined) d.out = r(d.out);
}

function fichePiece(i){
  const d = D.tools[i];
  fichePosee = { type: 'outil', i: i };
  ouvrirFiche('Pièce de la boîte : ' + PNAME[d.t],
    '<div class="atapercu">' + ico(pieceStatic(d)) + '</div>' + fichePieceCorps(d),
    '<button type="button" class="atbtn" id="atfichesceller">Sceller sur le plateau</button>' +
    '<button type="button" class="atbtn danger" id="atficheretirer">Retirer de la boîte</button>' +
    '<button type="button" class="atbtn" id="atfichefermer">Fermer</button>');
}

/* Pièce dont la fiche est ouverte, quelle que soit sa provenance. */
function pieceCourante(){
  if (!fichePosee) return null;
  if (fichePosee.type === 'outil') return D.tools[fichePosee.i];
  if (fichePosee.type === 'fixed') return D.fixed[fichePosee.i][0];
  return null;
}

function rouvrirFiche(){
  if (!fichePosee) return;
  const o = fichePosee;
  if (o.type === 'outil') fichePiece(o.i); else ficheObjet(o);
}

/* ===================== Brouillons ===================== */

function lireDepot(){
  try {
    const brut = localStorage.getItem(CLE_BROUILLONS);
    const d = brut ? JSON.parse(brut) : null;
    if (d && d.liste) return d;
  } catch (e) {}
  return { v: 1, courant: null, liste: [] };
}
function ecrireDepot(d){
  try { localStorage.setItem(CLE_BROUILLONS, JSON.stringify(d)); } catch (e) {}
}
function nouvelId(){
  return 'br' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
}
function enregistrerBrouillon(){
  clearTimeout(minuteurDepot);
  minuteurDepot = setTimeout(function(){
    const d = lireDepot();
    if (!brouillonId) brouillonId = nouvelId();
    const entree = {
      id: brouillonId,
      nom: D.name || 'Sans nom',
      maj: new Date().toISOString(),
      origine: origineNom,
      niveau: JSON.parse(JSON.stringify(D))
    };
    const k = d.liste.findIndex(function(e){ return e.id === brouillonId; });
    if (k >= 0) d.liste[k] = entree; else d.liste.push(entree);
    d.courant = brouillonId;
    ecrireDepot(d);
  }, 250);
}
function chargerBrouillon(e){
  D = normaliser(e.niveau);
  LV[ATIDX] = D;
  brouillonId = e.id;
  origineNom = e.origine || null;
  enMain = null;
  tout();
}
function listeBrouillons(){
  const d = lireDepot();
  if (!d.liste.length){
    ouvrirFiche('Mes brouillons', '<p class="atok">Aucun brouillon pour l\u2019instant. ' +
      'Tout ce que tu poses ici est enregistré automatiquement sur cet appareil.</p>',
      '<button type="button" class="atbtn" id="atfichefermer">Fermer</button>');
    return;
  }
  const html = '<ul class="atliste">' + d.liste.map(function(e){
    const n = e.niveau || {};
    const quand = String(e.maj || '').slice(0, 10);
    return '<li><button type="button" class="nom" data-br="' + e.id + '">' +
      echapper(e.nom) + '<small>' + (n.cols || '?') + '×' + (n.rows || '?') + ' · ' + quand +
      (e.id === brouillonId ? ' · en cours' : '') + '</small></button>' +
      '<button type="button" class="atbtn mini" data-brdup="' + e.id + '">Dupliquer</button>' +
      '<button type="button" class="atbtn mini danger" data-brdel="' + e.id + '">Supprimer</button></li>';
  }).join('') + '</ul>';
  ouvrirFiche('Mes brouillons', html, '<button type="button" class="atbtn" id="atfichefermer">Fermer</button>');
}

/* ===================== Charger un niveau du jeu ===================== */

function listeNiveauxDuJeu(){
  let html = '<ul class="atliste">';
  WORLDS.forEach(function(w){
    const lot = NIVEAUX_DU_JEU.filter(function(n){ return n.w === w.id; });
    if (!lot.length) return;
    html += '<li style="border:none;padding-top:10px"><b style="color:#ffc94d">' + w.label + '</b></li>';
    lot.forEach(function(n){
      html += '<li><button type="button" class="nom" data-jeu="' + n.i + '">' + echapper(n.name) + '</button></li>';
    });
  });
  html += '</ul>';
  ouvrirFiche('Charger un niveau du jeu (' + NIVEAUX_DU_JEU.length + ')', html,
    '<button type="button" class="atbtn" id="atfichefermer">Fermer</button>');
}

function chargerNiveauDuJeu(i){
  D = normaliser(JSON.parse(JSON.stringify(LV[i])));
  LV[ATIDX] = D;
  origineNom = LV[i].name;
  brouillonId = null;
  enMain = null;
  fermerFiche();
  tout();
  message('« ' + echapper(D.name) + ' » chargé. À l\u2019export, l\u2019atelier signalera qu\u2019il s\u2019agit d\u2019une retouche.', 'ok');
}

function normaliser(n){
  const v = niveauVide();
  v.w = n.w || 'lagon';
  v.name = n.name || '';
  v.sub = n.sub || '';
  v.hint = n.hint || '';
  v.cols = Math.min(COLS_MAX, Math.max(COLS_MIN, n.cols || 9));
  v.rows = Math.min(ROWS_MAX, Math.max(ROWS_MIN, n.rows || 6));
  v.suns = (n.suns || []).map(function(s){
    const o = { x: s.x, y: s.y, dir: s.dir };
    if (s.val) o.val = s.val;
    return o;
  });
  v.targets = (n.targets || []).map(function(t){
    const o = { x: t.x, y: t.y, need: t.need };
    if (t.disp) o.disp = t.disp;
    if (t.porte !== undefined) o.porte = t.porte;
    return o;
  });
  v.rocks = (n.rocks || []).map(function(r){ return [r[0], r[1]]; });
  v.fruits = (n.fruits || []).map(function(f){ return f.length > 2 ? [f[0], f[1], f[2]] : [f[0], f[1]]; });
  v.gates = (n.gates || []).map(function(g){ return { x: g.x, y: g.y, max: g.max }; });
  v.fixed = (n.fixed || []).map(function(f){ return [f[0], f[1], f[2]]; });
  v.tools = (n.tools || []).slice();
  v.sol = n.sol || [];
  v.solMin = n.solMin || null;
  v.solB = n.solB || null;
  if (n.dec) v.dec = n.dec;
  return v;
}

/* ===================== Mode Jouer ===================== */

/* Le niveau est-il déjà gagné plateau vide ? Question moins théorique qu'elle en
   a l'air : si oui, `redraw()` lance la célébration dès l'ouverture, et
   `boardClick` refuse alors tout clic (`if(celebrating)return;`) — l'élève se
   retrouve devant un niveau qu'il ne peut pas jouer. On simule dans le vrai
   moteur, sur un plateau vide, en remettant ensuite l'état comme on l'a trouvé. */
function gagneSansPiece(){
  const sim = simulerBrouillon();
  return !!(sim && sim.win);
}

function obstaclesAuJeu(){
  const pb = [];
  if (!D.suns.length) pb.push('Il faut au moins un soleil.');
  if (!D.targets.length) pb.push('Il faut au moins une case créole.');
  if (!D.tools.length && !D.fixed.length) pb.push('La boîte est vide : ajoute au moins une pièce.');
  if (!pb.length && gagneSansPiece())
    pb.push('Ce niveau est déjà gagné sans poser aucune pièce : le rayon arrive tel quel dans la case. ' +
      'Le jeu lancerait la célébration à l’ouverture et le plateau ne répondrait plus. ' +
      'Mets un obstacle sur le trajet direct, ou demande une autre fraction.');
  return pb;
}

function ongletActif(nom){
  $('atongatelier').setAttribute('aria-pressed', String(nom === 'atelier'));
  $('atongjouer').setAttribute('aria-pressed', String(nom === 'jouer'));
}

function allerJouer(){
  const pb = obstaclesAuJeu();
  if (pb.length){ messages(pb, 'aterr'); ongletActif('atelier'); return false; }
  message('');
  LV[ATIDX] = D;
  document.body.classList.add('at-jouer');
  openLevel(ATIDX);
  ongletActif('jouer');
  return true;
}

function allerAtelier(){
  clearCeleb();
  $('winov').classList.remove('show');
  document.body.classList.remove('at-jouer');
  show('atelier');
  ongletActif('atelier');
  tout();
}

function placementsCourants(){
  return Object.keys(state.placed).map(function(k){
    const p = k.split(',');
    return [state.placed[k].ti, +p[0], +p[1]];
  }).sort(function(a, c){ return a[0] - c[0] || a[1] - c[1] || a[2] - c[2]; });
}

function majBandeau(){
  const sim = simulate();
  const pl = placementsCourants();
  const totF = D.fruits.length, prisF = sim.fruits.size;
  const tousLesFruits = prisF === totF;
  $('atwinbilan').innerHTML =
    '<b>' + pl.length + ' pièce' + (pl.length > 1 ? 's' : '') + ' posée' + (pl.length > 1 ? 's' : '') + '</b>' +
    (totF ? ' · fruits ramassés <b>' + prisF + '/' + totF + '</b>' : ' · aucun fruit dans ce niveau');
  $('atwinnote').textContent = 'La taille de la solution de référence devient le par du défi de maîtrise : ' +
    'trois petits soleils = réussir avec au plus ' + pl.length + ' pièce' + (pl.length > 1 ? 's' : '') + '.';
  const bs = $('atwinsol');
  bs.disabled = !tousLesFruits;
  bs.textContent = tousLesFruits
    ? 'Garder comme solution de référence'
    : 'Solution de référence : il manque des fruits (' + prisF + '/' + totF + ')';
  $('atwinsolmin').disabled = false;
}

/* ===================== Export ===================== */

function ctorPiece(d){
  if (d.t === 'b')  return 'b(' + d.in + ',' + d.out + ')';
  if (d.t === 's2') return 's2(' + d.in + ',' + d.outs.join(',') + ')';
  if (d.t === 's3') return 's3(' + d.in + ',' + d.outs.join(',') + ')';
  if (d.t === 'm')  return 'mg(' + d.ins.join(',') + ',' + d.out + ')';
  if (d.t === 'x2') return 'x2(' + d.in + ',' + d.out + ')';
  if (d.t === 'x3') return 'x3(' + d.in + ',' + d.out + ')';
  return '';
}
function txtStr(s){ return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
function txtFrac(f){ return '[' + f[0] + ',' + f[1] + ']'; }
function txtSol(sol){
  return '[' + sol.map(function(e){ return '[' + e[0] + ',' + e[1] + ',' + e[2] + ']'; }).join(',') + ']';
}

function blocExport(){
  const L = [];
  L.push(' {w:\'' + D.w + '\',name:' + txtStr(D.name) + (D.dec ? ',dec:\'' + D.dec + '\'' : '') + ',');
  L.push('  sub:' + txtStr(D.sub) + ',');
  if (D.hint && D.hint.trim()) L.push('  hint:' + txtStr(D.hint) + ',');
  L.push('  cols:' + D.cols + ',rows:' + D.rows + ',suns:[' + D.suns.map(function(s){
    return '{x:' + s.x + ',y:' + s.y + ',dir:' + s.dir + (s.val ? ',val:' + txtFrac(s.val) : '') + '}';
  }).join(',') + '],');
  L.push('  targets:[' + D.targets.map(function(t){
    return '{x:' + t.x + ',y:' + t.y + ',need:' + txtFrac(t.need) +
      (t.disp ? ',disp:' + txtStr(t.disp) : '') +
      (t.porte !== undefined ? ',porte:' + t.porte : '') + '}';
  }).join(',') + '],');
  if (D.fixed.length) L.push('  fixed:[' + D.fixed.map(function(f){
    return '[' + ctorPiece(f[0]) + ',' + f[1] + ',' + f[2] + ']';
  }).join(',') + '],');
  L.push('  rocks:[' + D.rocks.map(function(r){ return '[' + r[0] + ',' + r[1] + ']'; }).join(',') + '],');
  L.push('  fruits:[' + D.fruits.map(function(f){
    return '[' + f[0] + ',' + f[1] + (f[2] ? ',' + txtFrac(f[2]) : '') + ']';
  }).join(',') + '],');
  if (D.gates.length) L.push('  gates:[' + D.gates.map(function(g){
    return '{x:' + g.x + ',y:' + g.y + ',max:' + txtFrac(g.max) + '}';
  }).join(',') + '],');
  L.push('  tools:[' + D.tools.map(ctorPiece).join(',') + '],');
  /* sol, puis solMin, puis solB (deuxième architecture) — même disposition que
     les entrées du dépôt : sol et solMin sur la même ligne, solB sur la sienne. */
  let fin = '  sol:' + txtSol(D.sol);
  if (D.solMin) fin += ',solMin:' + txtSol(D.solMin);
  if (D.solB) fin += ',\n  solB:' + txtSol(D.solB);
  L.push(fin + '},');
  return L.join('\n');
}

function avertissements(){
  const a = [];
  if (D.name && NOMS_DU_JEU.indexOf(D.name) >= 0 && D.name !== origineNom)
    a.push('Le nom « ' + echapper(D.name) + ' » est déjà pris par un niveau du jeu.');
  if (origineNom && D.name === origineNom)
    a.push('Retouche : ce bloc remplacera l\u2019entrée « ' + echapper(origineNom) + ' » de levels.js.');
  if (D.fruits.length && !D.solMin)
    a.push('Pas de solution minimale alors qu\u2019il y a des fruits : c\u2019est elle qui prouve que le fruit est hors du chemin gagnant.');
  if (D.sol.length && D.tools.length <= D.sol.length)
    a.push('La boîte n\u2019a aucun surplus (' + D.tools.length + ' pièces pour ' + D.sol.length + ' utiles) : le tri fait partie du casse-tête.');
  if (!D.rocks.length && !D.gates.length && !D.fixed.length)
    a.push('Aucun obstacle : le chemin risque d\u2019être direct.');
  if (gagneSansPiece())
    a.push('Ce niveau se gagne SANS poser aucune pièce : le rayon arrive tel quel dans la case.');
  if (!D.sub.trim()) a.push('La consigne est vide.');
  return a;
}

function exporter(){
  if (!D.sol.length){
    message('Export refusé : il manque la solution de référence. Passe en « Jouer », gagne le niveau ' +
      'en ramassant tous les fruits, puis touche « Garder comme solution de référence ».', 'aterr');
    return null;
  }
  const bloc = blocExport();
  $('attexte').value = bloc;
  const av = avertissements();
  if (av.length) messageExport(['Bloc produit. À vérifier :'].concat(av.map(function(x){ return '— ' + x; })), 'info');
  else messageExport(['Bloc produit, aucun avertissement. Il est prêt à coller dans levels.js.'], 'ok');
  return bloc;
}

function importer(){
  const t = $('attexte').value.trim();
  if (!t){ message('Colle d\u2019abord un bloc dans la zone de texte.', 'aterr'); return false; }
  let src = t;
  if (src.charAt(src.length - 1) === ',') src = src.slice(0, -1);
  let obj;
  try {
    /* Le bloc est du code de niveau écrit avec les constructeurs de levels.js :
       on le relit avec ces constructeurs-là, et rien d'autre dans la portée. */
    const f = new Function('b', 's2', 's3', 'mg', 'x2', 'x3', '"use strict";return (' + src + ');');
    obj = f(b, s2, s3, mg, x2, x3);
  } catch (e){
    message('Ce bloc n\u2019est pas lisible : ' + echapper(e.message), 'aterr');
    return false;
  }
  if (!obj || typeof obj !== 'object' || !obj.cols || !obj.rows || !Array.isArray(obj.targets)){
    message('Ce bloc ne ressemble pas à un niveau (il faut au moins cols, rows et targets).', 'aterr');
    return false;
  }
  D = normaliser(obj);
  LV[ATIDX] = D;
  origineNom = NOMS_DU_JEU.indexOf(D.name) >= 0 ? D.name : null;
  brouillonId = null;
  enMain = null;
  tout();
  message('Bloc importé : « ' + echapper(D.name || 'sans nom') + ' ».', 'ok');
  return true;
}

/* ===================== Écouteurs ===================== */

$('atongatelier').addEventListener('click', allerAtelier);
$('atongjouer').addEventListener('click', allerJouer);

$('atcolmoins').addEventListener('click', function(){ changerGrille(-1, 0); });
$('atcolplus').addEventListener('click', function(){ changerGrille(1, 0); });
$('atrowmoins').addEventListener('click', function(){ changerGrille(0, -1); });
$('atrowplus').addEventListener('click', function(){ changerGrille(0, 1); });

$('atplateau').addEventListener('click', function(ev){
  const c = ev.target.closest ? ev.target.closest('.atcase') : null;
  if (!c) return;
  toucherCase(+c.dataset.x, +c.dataset.y);
});
$('atplateau').addEventListener('keydown', function(ev){
  const c = ev.target.closest ? ev.target.closest('.atcase') : null;
  if (!c || (ev.key !== 'Enter' && ev.key !== ' ')) return;
  ev.preventDefault();
  toucherCase(+c.dataset.x, +c.dataset.y);
});

/* Reposer ce qu'on tient. Une pièce à sceller retourne dans la boîte : elle en
   avait été retirée au moment du « sceller ». */
const REPOSE = {
  sun: 'Le soleil est reposé', target: 'La case créole est reposée',
  rock: 'La roche est reposée', fruit: 'Le fruit est reposé',
  gate: 'La passe étroite est reposée', fixed: 'La pièce est remise dans la boîte'
};
function reposerEnMain(){
  if (!enMain) return null;
  const dit = REPOSE[enMain.type];
  if (enMain.type === 'fixed') D.tools.push(enMain.def);
  enMain = null;
  return dit;
}

function toucherCase(x, y){
  const o = objetEn(x, y);
  if (enMain){
    if (o){
      /* Toucher un objet en tenant quelque chose ne doit JAMAIS être un refus
         muet : on repose ce qu'on tenait et on ouvre la fiche de ce qui est là.
         C'est ce refus silencieux qui donnait l'impression que rien n'était
         réglable (premier essai de Gwenael, 15/08). */
      const dit = reposerEnMain();
      dessinerPalette();
      alerte([dit + ' : cette case était déjà occupée. Voici son réglage.'], 'info');
      ficheObjet(o);
      return;
    }
    if (enMain.type === 'fixed'){
      D.fixed.push([enMain.def, x, y]);
      const k = D.tools.indexOf(enMain.def);
      if (k >= 0) D.tools.splice(k, 1);
    } else poser(enMain.type, x, y);
    enMain = null;
    oublierSolutions();
    alerte([]);
    tout();
    return;
  }
  if (o) ficheObjet(o);
  else alerte(['Case vide. Touche d’abord un objet dans la palette, puis une case.'], 'info');
}

$('atpalette').addEventListener('click', function(ev){
  const bt = ev.target.closest('button[data-obj]');
  if (!bt) return;
  const type = bt.dataset.obj;
  enMain = (enMain && enMain.type === type) ? null : { type: type };
  dessinerPalette();
});

$('atajout').addEventListener('click', function(ev){
  const bt = ev.target.closest('button[data-piece]');
  if (!bt) return;
  D.tools.push(PIECES[+bt.dataset.piece].neuf());
  oublierSolutions();
  tout();
});

$('atboite').addEventListener('click', function(ev){
  const bt = ev.target.closest('button[data-outil]');
  if (!bt) return;
  fichePiece(+bt.dataset.outil);
});

$('atmonde').addEventListener('change', function(){ D.w = $('atmonde').value; tout(); });
$('atnom').addEventListener('input', function(){ D.name = $('atnom').value; dessinerFiche(); enregistrerBrouillon(); });
$('atsub').addEventListener('input', function(){ D.sub = $('atsub').value; enregistrerBrouillon(); });
$('athint').addEventListener('input', function(){ D.hint = $('athint').value; enregistrerBrouillon(); });

$('atbrouillons').addEventListener('click', listeBrouillons);
$('atcharger').addEventListener('click', listeNiveauxDuJeu);
$('atnouveau').addEventListener('click', function(){
  D = niveauVide();
  LV[ATIDX] = D;
  brouillonId = null; origineNom = null; enMain = null;
  $('attexte').value = '';
  message('Nouveau niveau vierge.', 'ok');
  tout();
});

$('atexporter').addEventListener('click', exporter);
$('atimporter').addEventListener('click', importer);
$('atcopier').addEventListener('click', function(){
  const z = $('attexte');
  if (!z.value){ message('Rien à copier : touche d\u2019abord « Exporter le niveau ».', 'aterr'); return; }
  z.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(z.value);
  message(ok ? 'Bloc copié.' : 'Sélectionné : fais « copier » pour le mettre dans le presse-papier.', 'ok');
});

/* --- la feuille de réglage : un seul écouteur pour tout son contenu --- */
$('atfiche').addEventListener('click', function(ev){
  if (ev.target.id === 'atfiche'){ fermerFiche(); return; }
  const bt = ev.target.closest('button');
  if (!bt) return;

  if (bt.id === 'atfichefermer'){ fermerFiche(); return; }

  if (bt.id === 'atficheretirer'){
    if (fichePosee && fichePosee.type === 'outil') D.tools.splice(fichePosee.i, 1);
    else if (fichePosee) retirer(fichePosee);
    oublierSolutions();
    fermerFiche(); tout(); return;
  }
  if (bt.id === 'atfichesceller'){
    const d = D.tools[fichePosee.i];
    D.tools.splice(fichePosee.i, 1);
    enMain = { type: 'fixed', def: d };
    oublierSolutions();
    fermerFiche(); tout();
    message('Touche une case libre pour sceller la pièce sur le plateau.', 'ok');
    return;
  }
  if (bt.id === 'atficheboite'){
    const f = D.fixed[fichePosee.i];
    D.tools.push(f[0]);
    D.fixed.splice(fichePosee.i, 1);
    oublierSolutions();
    fermerFiche(); tout(); return;
  }
  if (bt.id === 'atpiecetourne'){
    const d = pieceCourante();
    if (d){ tournerPiece(d); oublierSolutions(); rouvrirFiche(); dessinerPlateau(); dessinerPalette(); enregistrerBrouillon(); }
    return;
  }

  /* Brouillons */
  if (bt.dataset.br){
    const e = lireDepot().liste.find(function(x){ return x.id === bt.dataset.br; });
    if (e){ chargerBrouillon(e); fermerFiche(); message('Brouillon « ' + echapper(e.nom) + ' » repris.', 'ok'); }
    return;
  }
  if (bt.dataset.brdup){
    const d = lireDepot();
    const e = d.liste.find(function(x){ return x.id === bt.dataset.brdup; });
    if (e){
      const copie = JSON.parse(JSON.stringify(e));
      copie.id = nouvelId();
      copie.nom = e.nom + ' (copie)';
      copie.niveau.name = '';
      d.liste.push(copie); ecrireDepot(d); listeBrouillons();
    }
    return;
  }
  if (bt.dataset.brdel){
    const d = lireDepot();
    d.liste = d.liste.filter(function(x){ return x.id !== bt.dataset.brdel; });
    if (brouillonId === bt.dataset.brdel) brouillonId = null;
    ecrireDepot(d); listeBrouillons();
    return;
  }
  if (bt.dataset.jeu !== undefined && bt.dataset.jeu !== ''){ chargerNiveauDuJeu(+bt.dataset.jeu); return; }

  /* Directions : soleil, porte, flèches des pièces */
  const d = pieceCourante();
  const maj = function(){ oublierSolutions(); rouvrirFiche(); dessinerPlateau(); dessinerPalette(); enregistrerBrouillon(); };
  if (bt.dataset.sdir !== undefined){ D.suns[fichePosee.i].dir = +bt.dataset.sdir; maj(); return; }
  if (bt.dataset.tporte !== undefined){
    const t = D.targets[fichePosee.i];
    const v = +bt.dataset.tporte;
    if (v < 0) delete t.porte; else t.porte = v;
    maj(); return;
  }
  if (d && bt.dataset.pin !== undefined){ d.in = +bt.dataset.pin; maj(); return; }
  if (d && bt.dataset.pout !== undefined){ d.out = +bt.dataset.pout; maj(); return; }
  if (d && bt.dataset.pin0 !== undefined){ d.ins[0] = +bt.dataset.pin0; maj(); return; }
  if (d && bt.dataset.pin1 !== undefined){ d.ins[1] = +bt.dataset.pin1; maj(); return; }
  if (d && d.outs) for (let k = 0; k < d.outs.length; k++){
    if (bt.dataset['pouts' + k] !== undefined){ d.outs[k] = +bt.dataset['pouts' + k]; maj(); return; }
  }
});

/* --- les champs texte de la feuille de réglage --- */
$('atfiche').addEventListener('input', function(ev){
  const id = ev.target.id;
  if (!fichePosee) return;
  const v = ev.target.value;
  if (id === 'atsunval'){
    const f = frac(v);
    const s = D.suns[fichePosee.i];
    if (f){ if (f[0] === 1 && f[1] === 1) delete s.val; else s.val = f; }
  } else if (id === 'attneed'){
    const f = frac(v); if (f) D.targets[fichePosee.i].need = f;
  } else if (id === 'attdisp'){
    const t = D.targets[fichePosee.i];
    if (v.trim()) t.disp = v.trim(); else delete t.disp;
  } else if (id === 'atfval'){
    const f = frac(v), fr = D.fruits[fichePosee.i];
    if (v.trim() === '') fr.length = 2; else if (f) fr[2] = f;
  } else if (id === 'atgmax'){
    const f = frac(v); if (f) D.gates[fichePosee.i].max = f;
  } else return;
  oublierSolutions();
  dessinerPlateau(); enregistrerBrouillon();
});

document.addEventListener('keydown', function(ev){
  if (ev.key !== 'Escape') return;
  if ($('atfiche').classList.contains('show')){ fermerFiche(); return; }
  if (enMain){
    const dit = reposerEnMain();
    dessinerPalette();
    alerte([dit + '.'], 'info');
  }
});

/* --- le bandeau de victoire --- */
$('atwinsol').addEventListener('click', function(){
  D.sol = placementsCourants();
  dessinerFiche();
  enregistrerBrouillon();
  $('atwinsol').textContent = 'Solution de référence gardée (' + D.sol.length + ' pièces)';
  $('atwinsol').disabled = true;
});
$('atwinsolmin').addEventListener('click', function(){
  D.solMin = placementsCourants();
  dessinerFiche();
  enregistrerBrouillon();
  $('atwinsolmin').textContent = 'Solution minimale gardée (' + D.solMin.length + ' pièces)';
  $('atwinsolmin').disabled = true;
});
/* Le geste du concepteur : on vient de gagner d'une façon, on veut en essayer
   une autre (typiquement pour trouver la solution minimale). Même effet que le
   bouton « Recommencer » du jeu, mais accessible depuis le bandeau. */
$('atwinrejouer').addEventListener('click', function(){
  clearCeleb();
  $('winov').classList.remove('show');
  state.placed = {};
  state.sel = null;
  overlayShown = false;
  redraw();
});
$('atwinretour').addEventListener('click', allerAtelier);

/* La victoire du jeu ouvre #winov : c'est notre signal, sans toucher au moteur. */
new MutationObserver(function(){
  if (!document.body.classList.contains('at-jouer')) return;
  if ($('winov').classList.contains('show')) majBandeau();
}).observe($('winov'), { attributes: true, attributeFilter: ['class'] });

/* ===================== Démarrage ===================== */

const depot = lireDepot();
const repris = depot.courant && depot.liste.find(function(e){ return e.id === depot.courant; });
if (repris) { D = normaliser(repris.niveau); LV[ATIDX] = D; brouillonId = repris.id; origineNom = repris.origine || null; }

show('atelier');
ongletActif('atelier');
tout();

/* Rouvrir sur le dernier brouillon est voulu (rien ne se perd), mais il faut le
   DIRE : sinon on croit repartir d'une grille vierge et on construit par-dessus
   son travail de la veille. */
if (repris){
  alerte(['Brouillon repris : « ' + echapper(repris.nom || 'sans nom') +
    ' ». Touche « Nouveau niveau » pour repartir d’une grille vide.'], 'info');
}

/* ===================== API de test ===================== */
window.ATELIER = {
  ATIDX: ATIDX,
  niveau: function(){ return D; },
  charger: function(n){ D = normaliser(n); LV[ATIDX] = D; brouillonId = null; origineNom = null; enMain = null; tout(); },
  chargerDuJeu: chargerNiveauDuJeu,
  origine: function(){ return origineNom; },
  poser: function(type, x, y){ const r = poser(type, x, y); tout(); return r; },
  ajouterPiece: function(t){
    const p = PIECES.find(function(q){ return q.t === t; });
    if (!p) return false;
    D.tools.push(p.neuf()); tout(); return true;
  },
  objetEn: objetEn,
  ficheObjet: ficheObjet,
  fichePiece: fichePiece,
  jouer: allerJouer,
  atelier: allerAtelier,
  exporter: exporter,
  importer: importer,
  bloc: function(){ return $('attexte').value; },
  placements: placementsCourants,
  avertissements: avertissements,
  debordements: debordements
};

})();
