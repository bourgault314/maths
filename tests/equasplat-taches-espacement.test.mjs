import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* ÉquaSplat, 21/09/2026 : les taches se chevauchaient dès 7 par membre.
   Deux causes : les rangées restaient « 3 en haut, tout le reste en bas » (à 8 : 3 + 5), et
   la taille d'une tache ne regardait pas combien il y en avait dans une rangée.

   Ce test ne cherche PAS un bout de code dans le fichier : il exécute les vraies fonctions
   de mise en page, place les taches comme la page les place, et mesure si deux dessins se
   touchent — avec la forme réelle de la tache, relue dans blobPath. */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

function extraire(nom){
  const debut = html.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}

/* Le rayon maximal du dessin d'une tache, relu dans blobPath : si la forme change, la
   mesure suit. Le rayon nominal r donne une tache qui monte jusqu'à K_MAX × r. */
const ligneK = html.match(/const k = ([\d.]+) \+ ([\d.]+)\*Math\.sin\(lobes\*a\) \+ ([\d.]+)\*Math\.sin\(2\*lobes\*a\);/);
assert.ok(ligneK, "la formule de la forme des taches doit être lisible dans blobPath");
const [base, l1, l2] = ligneK.slice(1).map(Number);
let K_MAX = 0;
for(let i = 0; i < 20000; i++){
  const a = (Math.PI * 2 * i) / 20000;
  K_MAX = Math.max(K_MAX, base + l1 * Math.sin(5 * a) + l2 * Math.sin(10 * a));
}

const AIDES = ["rowsForSplats", "repartirEnRangees", "splatLayoutFor", "splatAreaFor",
  "splatRadius", "splatPositionsForItems"];
function moteurPour(vue){
  return Function(`
    const isPhoneLayout = () => ${vue === "telephone"};
    const isMobileImportLayout = () => ${vue === "receptionMobile"};
    const commonSplatRadius = () => { throw new Error("la taille doit venir de splatLayoutFor"); };
    ${html.match(/^  const SPLAT_ESPACE = [^\n]*;/m)[0]}
    ${AIDES.map(extraire).join("\n")}
    return { rowsForSplats, splatLayoutFor, splatAreaFor, splatRadius, SPLAT_ESPACE };
  `)();
}

/* Les plateaux réels d'un membre (getTrayForSide), pour chaque vue. */
const PLATEAUX = {
  ordinateur: {vue: "ordinateur", tray: {x:40, y:24, w:720, h:820 - 48}},
  ordinateurPlat: {vue: "ordinateur", tray: {x:40, y:24, w:720, h:560 - 48}},
  telephone: {vue: "telephone", tray: {x:24, y:34, w:736, h:1212}},
};

function pose(m, n, tray){
  const area = m.splatAreaFor(tray);
  const dispo = m.splatLayoutFor(n, area, m.splatRadius(n));
  const centres = [];
  let k = 0;
  for(let r = 0; r < dispo.rows.length; r++){
    const cols = dispo.rows[r];
    const cellW = area.w / Math.max(1, cols);
    const cy = area.y + area.h * ((r + 0.5) / dispo.rows.length);
    for(let c = 0; c < cols && k < n; c++){
      centres.push({cx: area.x + cellW * (c + 0.5), cy});
      k++;
    }
  }
  return {rows: dispo.rows, r: dispo.r, centres, area};
}

/* 16 : la limite que l'appli se donne elle-même — au-delà, l'équation est refusée
   (« Cette équation crée trop de taches pour rester lisible. »). Le test couvre donc
   exactement ce que l'appli accepte de dessiner. */
test("les taches ne se touchent jamais, quel qu'en soit le nombre (jusqu'à 16, la limite de l'appli)", () => {
  for(const [nom, {vue, tray}] of Object.entries(PLATEAUX)){
    const m = moteurPour(vue);
    for(let n = 1; n <= 16; n++){
      const {r, centres} = pose(m, n, tray);
      assert.equal(centres.length, n, `${nom}, ${n} taches : toutes placées`);
      const mini = 2 * K_MAX * r;                 // deux dessins qui se frôlent
      for(let i = 0; i < centres.length; i++){
        for(let j = i + 1; j < centres.length; j++){
          const d = Math.hypot(centres[i].cx - centres[j].cx, centres[i].cy - centres[j].cy);
          assert.ok(d >= mini, `${nom}, ${n} taches : deux taches à ${d.toFixed(0)} l'une de l'autre, il en faut ${mini.toFixed(0)}`);
        }
      }
    }
  }
});

test("les taches restent dans leur zone, et ne dépassent jamais la taille d'avant", () => {
  for(const [nom, {vue, tray}] of Object.entries(PLATEAUX)){
    const m = moteurPour(vue);
    for(let n = 1; n <= 16; n++){
      const {r, centres, area} = pose(m, n, tray);
      assert.ok(r <= m.splatRadius(n) + 1e-9, `${nom}, ${n} : la tache n'a pas grossi`);
      assert.ok(r > 20, `${nom}, ${n} : la tache reste visible (${r.toFixed(0)})`);
      for(const c of centres){
        assert.ok(c.cx - K_MAX * r >= tray.x - 1, `${nom}, ${n} : rien ne sort du plateau à gauche`);
        assert.ok(c.cx + K_MAX * r <= tray.x + tray.w + 1, `${nom}, ${n} : rien ne sort à droite`);
        assert.ok(c.cy - K_MAX * r >= tray.y - 1, `${nom}, ${n} : rien ne sort en haut`);
      }
      void area;
    }
  }
});

test("jusqu'à 6 taches, la disposition ne bouge jamais, et la taille non plus sur un cadre normal", () => {
  for(const [nom, {vue, tray}] of Object.entries(PLATEAUX)){
    const m = moteurPour(vue);
    for(let n = 1; n <= 6; n++){
      const {rows, r} = pose(m, n, tray);
      assert.deepEqual(rows, m.rowsForSplats(n), `${nom}, ${n} : disposition d'avant`);
      if(nom === "ordinateurPlat"){
        // Cadre très plat (plein écran, équation au-dessus) : les deux rangées se touchaient
        // déjà avant. La tache y rétrécit — c'est la réparation, pas une régression.
        assert.ok(r <= m.splatRadius(n) + 1e-9, `${nom}, ${n} : la tache n'a pas grossi`);
      }else{
        assert.equal(r, m.splatRadius(n), `${nom}, ${n} : taille d'avant, au pixel`);
      }
    }
  }
  // Et dans le cadre plat, la réduction ne se déclenche que là où ça se touchait.
  const plat = moteurPour("ordinateur");
  const p3 = pose(plat, 3, PLATEAUX.ordinateurPlat.tray);
  assert.ok(p3.r < plat.splatRadius(3), "cadre plat, 3 taches : la tache rétrécit");
  const n3 = pose(plat, 3, PLATEAUX.ordinateur.tray);
  assert.equal(n3.r, plat.splatRadius(3), "cadre normal, 3 taches : rien ne bouge");
});

test("à partir de 7, les rangées sont équilibrées et la tache rétrécit", () => {
  const m = moteurPour("ordinateur");
  const tray = PLATEAUX.ordinateur.tray;
  const attendu = {7: [4,3], 8: [4,4], 9: [3,3,3], 12: [4,4,4]};
  for(const [n, rows] of Object.entries(attendu)){
    const p = pose(m, Number(n), tray);
    assert.deepEqual(p.rows, rows, `${n} taches : ${rows.join(" + ")}`);
    assert.ok(Math.max(...p.rows) - Math.min(...p.rows) <= 1, `${n} taches : rangées équilibrées`);
    assert.ok(p.r < m.splatRadius(Number(n)), `${n} taches : la tache a rétréci`);
  }
});

/* Relecture du 21/09/2026 : une tache enlevée puis MASQUÉE (réception : toujours ; ailleurs :
   « masquer ce que l'on enlève ») garde sa case, pour que les autres ne bougent pas
   (layoutItems). La taille doit donc tenir dans la grille de TOUTES les taches du membre : comptée
   sur les seules taches restantes, elle les faisait regrossir sur place, et après « enlever 4n
   des deux côtés » sur 9n + 3 = 4n + 28, les cinq qui restaient se chevauchaient.
   Ici on exécute la vraie chaîne : splatPositionsForItems → commonSplatLayoutRadius. */
function moteurAvecEtat(vue, etat, masquer){
  return Function("etat", "masquer", `
    const isPhoneLayout = () => ${vue === "telephone"};
    const isMobileImportLayout = () => ${vue === "receptionMobile"};
    const state = etat;
    const renderPiecesForSide = side => masquer ? state[side].filter(p => !p.removed) : state[side];
    ${html.match(/^  const SPLAT_ESPACE = [^\n]*;/m)[0]}
    ${[...AIDES, "commonSplatRadius", "commonSplatLayoutRadius"].map(extraire).join("\n")}
    return { splatPositionsForItems };
  `)(etat, masquer);
}

test("après « enlever des taches des deux côtés », les taches qui restent ne se touchent pas non plus", () => {
  const taches = (cote, n, enlevees) => Array.from({length: n}, (_, i) => ({
    id: `${cote}${i}`, type: "x", removed: enlevees(i, n)
  }));
  const facons = {
    "les premières": (k) => (i) => i < k,
    "les dernières": (k) => (i, n) => i >= n - k,
    "une sur deux": (k) => (i) => i % 2 === 0 && i / 2 < k,
  };
  for(const [nom, {vue, tray}] of Object.entries(PLATEAUX)){
    for(const masquer of [true, false]){
      for(let n = 2; n <= 16; n++){
        for(let k = 1; k < n; k++){
          for(const [facon, choix] of Object.entries(facons)){
            const etat = {left: taches("g", n, choix(k)), right: taches("d", Math.min(k, 16 - n), () => true)};
            const moteur = moteurAvecEtat(vue, etat, masquer);
            const pos = moteur.splatPositionsForItems(tray, etat.left);
            const enlevees = etat.left.filter(p => p.removed).length;
            const vues = etat.left.filter(p => masquer ? !p.removed : true).map(p => pos.get(p.id));
            for(let i = 0; i < vues.length; i++){
              for(let j = i + 1; j < vues.length; j++){
                const d = Math.hypot(vues[i].cx - vues[j].cx, vues[i].cy - vues[j].cy);
                assert.ok(d >= 2 * K_MAX * vues[i].r,
                  `${nom}, ${n} taches dont ${enlevees} enlevées (${facon}, ${masquer ? "masquées" : "hachurées"}) : deux taches à ${d.toFixed(0)}, il en faut ${(2 * K_MAX * vues[i].r).toFixed(0)}`);
              }
            }
          }
        }
      }
    }
  }
});

test("la lettre suit la tache : sa taille est posée au dessin, proportionnelle au rayon réel de la tache", () => {
  // Comportement, pas décor. Depuis le 27/09/2026 (lettre ronde), la lettre fait 0,8 × le rayon
  // RÉEL de la tache (pos.r, déjà rétréci à partir de 7 taches), en style en ligne : elle rétrécit
  // donc avec sa tache, jamais toute seule, et garde la même proportion au téléphone.
  assert.match(html, /drawSplatLetter\(g, pos\.cx, pos\.cy, pos\.r, xPieceLabel\(item\)\);/);
  assert.match(html, /const SPLAT_LETTRE_K = 0\.8;/);
  assert.match(html, /t\.style\.fontSize = `\$\{\(r \* SPLAT_LETTRE_K\)\.toFixed\(1\)\}px`;/);
  // les mini-plateaux du partage : la même fonction, avec le rayon de leur tache
  assert.match(html, /drawSplatLetter\(g, splatX, centerY, splatR, displayedUnknown\(\)\);/);
  assert.doesNotMatch(html, /splatLabel\.style\.fontSize/);
  // l'échelle reste posée (repli de la feuille de style), et rRef est bien la taille d'avant
  assert.match(html, /if\(pos\.rRef\) g\.style\.setProperty\("--splatEchelle", \(pos\.r \/ pos\.rRef\)\.toFixed\(3\)\);/);
  assert.match(html, /out\.set\(xs\[k\]\.id, \{cx,cy,r:radius,rRef:rmax\}\);/);
});
