// Défi conversions : le robot de vérification (lot A2 « socle », 12/11/2026).
//
// Le même pour tous les lots suivants. Pour CHAQUE étape prête, il joue tous
// les écrans, à 4 tailles et dans 2 moteurs (Chromium ; WebKit, celui de
// Safari et de l'iPhone) :
//   On te montre (les 3 temps, geste fait), À toi (l'outil, une erreur,
//   l'image, sans aide), À retenir, Je valide (une question, une erreur, la
//   fin), Tu connais déjà ? (l'annonce, une marche), Je me souviens (une
//   question, une erreur, la fin), Avant de partir.
// Lot 3a (le nouveau rythme) : « Je ne sais pas » dans À toi, Je valide et
// Je me souviens ; Je valide mêlé et corrigé tout de suite ; le glisse-unité
// et ses deux poignées au téléphone.
// Puis les écrans communs : accueil (nouveau, en cours, avec des étoiles et
// une ceinture), Mon parcours (avec ses étoiles), Mon carnet, Comment ça
// marche ?, Effacer mon historique, Je me souviens et Avant de partir d'un
// élève, la ceinture gagnée, la fin du test, « À toi » sans réussir, le mode
// professeur (accueil, Changer d'étape, Voir une série).
//
// À chaque écran, il vérifie et note :
//   - le cadre blanc tient ENTIER dans la fenêtre, rien ne déborde de lui ;
//   - la question tient dans son bloc, l'aide dans sa zone (rien de coupé) ;
//   - aucun grand vide qui ne sert à rien (une bande sans rien de plus de
//     15 % de la hauteur de la fenêtre et de 90 px) ;
//   - en projection (1920 × 1080), le texte est lisible du fond de la salle ;
//   - pendant une série, RIEN NE BOUGE : question, zone, pavé et bouton
//     gardent leur place d'une question à l'autre, et après une réponse.
// Il fabrique une PLANCHE DE REVUE par étape et par taille (tous les écrans
// sur une seule image, chacun avec son verdict), et `verdicts.json`.
//
// Lot A2 bis : il relie (associer) et range au doigt, puis touche
// « Valider » ; dans On te montre, il touche ce qui reste à toucher (la pièce
// de 1 €, les pièces, l'étiquette, l'horloge de départ, l'axe du temps).
// Lot B2-1b : il coche les bonnes cartes de « Coche tout ce qui est égal
// à… » (faux : les bonnes, puis une fausse), puis touche « Valider ».
//
// Hors CI. « npm run verifier » le lance quand la branche touche l'appli
// (scripts/verifier-navigateur.mjs), ou à la main :
//   node tests/defi-conversions-robot.cjs
//   DEFI_CONVERSIONS_PLANCHES=/dossier node tests/defi-conversions-robot.cjs   (dépose les planches)
//   DEFI_CONVERSIONS_MOTEURS=chromium      (un seul moteur ; par défaut : chromium,webkit)
//   DEFI_CONVERSIONS_ETAPES=R1,C1          (quelques étapes ; « commun » pour les écrans communs)
//   DEFI_CONVERSIONS_TAILLES=1440x900      (quelques tailles)
//   DEFI_CONVERSIONS_ECRANS=/dossier        (lot 3b-2 : chaque écran dans son fichier)
//   DEFI_CONVERSIONS_POLICE="DejaVu Sans"   (une autre police, plus large)
//   CHROMIUM_EXECUTABLE_PATH=/chemin/chrome
// WebKit s'installe une fois : PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install webkit
//
// Le hasard est figé (Math.random = 0,5) et l'horloge aussi (le 11/11/2026 à
// 10 h ; les délais se sautent, rien n'attend). Pour répondre, la page donne
// la question à l'écran (MATHSGO_DEFI_CONVERSIONS_ECRAN.question(), lot 3a :
// les séries mêlées et sans les questions déjà vues ne se recalculent plus
// de l'extérieur).
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const G = require(path.join(RACINE, "outils/conversions/conversions_generateurs.js"));
const P = require(path.join(RACINE, "outils/conversions/defi_conversions_parcours.js"));
const CARTE = require(path.join(RACINE, "outils/conversions/conversions_carte.js"));
const PAGE = "/outils/conversions/defi_conversions.html";
const CLE = "mathsgo-defi-conversions-parcours";
const PLANCHES = process.env.DEFI_CONVERSIONS_PLANCHES || "";
const GRAINE = 50000;
const JOUR = "2026-11-11";
// Lot A2 ter (13/11/2026, après l'essai de Gwenaël sur son iPhone) : cinq
// tailles de plus, les fenêtres RÉELLES des téléphones des élèves (barres du
// navigateur déduites), qui encadrent presque tous les téléphones. Les iPhone
// se jouent dans WebKit, les Android dans Chromium, au doigt (`tactile` :
// hasTouch, isMobile ; on touche, on glisse avec de vrais événements
// tactiles, pas avec la souris). Aucune règle CSS ne vise une de ces tailles :
// si un écran tient à 375 × 548 et à 360 × 640, il tient sur les plus grands.
const TOUTES_TAILLES = [
  {nom: "375x667", largeur: 375, hauteur: 667, tel: true},
  {nom: "390x844", largeur: 390, hauteur: 844, tel: true},
  {nom: "1440x900", largeur: 1440, hauteur: 900},
  {nom: "1920x1080", largeur: 1920, hauteur: 1080, projection: true},
  {nom: "375x548", appareil: "petit iPhone (SE)", largeur: 375, hauteur: 548, tel: true, tactile: true, moteurs: ["webkit"]},
  {nom: "393x660", appareil: "iPhone courant (12 à 16)", largeur: 393, hauteur: 660, tel: true, tactile: true, moteurs: ["webkit"]},
  {nom: "430x740", appareil: "grand iPhone (Plus, Pro Max)", largeur: 430, hauteur: 740, tel: true, tactile: true, moteurs: ["webkit"]},
  {nom: "360x640", appareil: "petit Android", largeur: 360, hauteur: 640, tel: true, tactile: true, moteurs: ["chromium"]},
  {nom: "412x780", appareil: "Android courant (Galaxy A, Pixel)", largeur: 412, hauteur: 780, tel: true, tactile: true, moteurs: ["chromium"]}
];
// Les tailles iPhone dans Chromium, quand WebKit ne s'installe pas (l'espace
// de travail de Claude) : DEFI_CONVERSIONS_IPHONE_CHROMIUM=1. Code, lui, les
// joue dans WebKit.
const IPHONE_CHROMIUM = process.env.DEFI_CONVERSIONS_IPHONE_CHROMIUM === "1";
// Lot 3a (retour de Code : sans Inter, l'accueil dépassait) : jouer avec une
// autre police, plus large, DEFI_CONVERSIONS_POLICE="DejaVu Sans" (Claude
// vérifie ainsi dans son espace, où Inter est installée).
const POLICE = (process.env.DEFI_CONVERSIONS_POLICE || "").replace(/[^\w \-]/g, "");
const tailleDans = (taille, moteur) => !taille.moteurs || taille.moteurs.includes(moteur)
  || (IPHONE_CHROMIUM && moteur === "chromium" && taille.moteurs.includes("webkit"));
const filtre = (variable, liste, cle) => {
  const v = (process.env[variable] || "").split(",").map(s => s.trim()).filter(Boolean);
  return v.length ? liste.filter(x => v.includes(cle(x))) : liste;
};
const TAILLES = filtre("DEFI_CONVERSIONS_TAILLES", TOUTES_TAILLES, t => t.nom);
const MOTEURS = (process.env.DEFI_CONVERSIONS_MOTEURS || "chromium,webkit").split(",").map(s => s.trim()).filter(Boolean);
// Lot B1-1 : le robot joue toutes les étapes construites (en mode
// professeur) ; les écrans communs suivent le parcours de l'élève (les
// paliers prêts).
const PRETS = [...CARTE.PRETES];
const PARCOURS = [...CARTE.PARCOURS];
const ETAPES = filtre("DEFI_CONVERSIONS_ETAPES", PRETS.concat(["commun"]), x => x);
const REPERES_PAR_ETAPE = {};
CARTE.ETAPES.forEach(e => { if (e.reperes && e.reperes.length) REPERES_PAR_ETAPE[e.code] = e.reperes; });
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon"};

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const chemin = decodeURIComponent(new URL(requete.url, "http://x").pathname);
    const fichier = path.join(RACINE, chemin);
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(resolve => serveur.listen(0, "127.0.0.1", () => resolve(serveur)));
}

// ------------------------------------------------------------ les contrôles
// Tout se mesure dans la page. Renvoie la liste des défauts de l'écran.
async function controler(page, taille) {
  return page.evaluate(({projection, tactile}) => {
    const defauts = [];
    const cadre = document.getElementById("cadre");
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rc = cadre.getBoundingClientRect();
    if (rc.top < -0.5 || rc.left < -0.5 || rc.right > vw + 0.5 || rc.bottom > vh + 0.5) {
      defauts.push(`le cadre sort de l'écran (${Math.round(rc.left)}, ${Math.round(rc.top)} → ${Math.round(rc.right)}, ${Math.round(rc.bottom)})`);
    }
    if (cadre.scrollHeight - cadre.clientHeight > 1) defauts.push(`le contenu déborde du cadre de ${cadre.scrollHeight - cadre.clientHeight} px`);
    // Lot 3b-2 : chaque illustration se charge (un nom de fichier faux, et
    // la boîte resterait vide).
    const cassee = [...cadre.querySelectorAll(".ill img")].find(i => i.complete && !i.naturalWidth);
    if (cassee) defauts.push(`une illustration ne se charge pas : ${cassee.getAttribute("src")}`);
    const visible = e => {
      const s = getComputedStyle(e);
      if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    };
    // Ce qui est dans une liste qui défile, ou sous le voile, ne compte pas
    // pour le débordement (ça défile, c'est voulu).
    const dansDefile = e => Boolean(e.closest(".ecran-defile, .voile"));
    const hors = [...cadre.querySelectorAll("*")].filter(e => !dansDefile(e) && visible(e)).filter(e => {
      const b = e.getBoundingClientRect();
      return b.left < rc.left - 1 || b.right > rc.right + 1 || b.top < rc.top - 1 || b.bottom > rc.bottom + 1;
    });
    if (hors.length) defauts.push(`${hors.length} élément(s) hors du cadre : « ${(hors[0].textContent || hors[0].className || hors[0].tagName).trim().slice(0, 30)} »`);
    // La question : rien ne sort de son bloc.
    const q = cadre.querySelector(".q");
    if (q && visible(q)) {
      const r = q.getBoundingClientRect();
      const sort = [...q.querySelectorAll("*")].filter(visible).filter(e => {
        const b = e.getBoundingClientRect();
        return b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5;
      });
      if (sort.length) defauts.push(`la question est coupée : « ${sort[0].textContent.trim().slice(0, 30)} »`);
    }
    // Les réponses : rien ne sort de leur zone, et aucun bouton n'est
    // recouvert (lot A2 bis : quatre choix empilés passaient sous l'image au
    // petit téléphone ; le milieu du bouton restait libre chez Claude, pas
    // chez Code). On teste cinq points de chaque bouton.
    const basEl = cadre.querySelector(".bas");
    if (basEl && visible(basEl)) {
      const r = basEl.getBoundingClientRect();
      const sort = [...basEl.querySelectorAll("*")].filter(visible).filter(e => {
        const b = e.getBoundingClientRect();
        return b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5;
      });
      if (sort.length) defauts.push(`les réponses sortent de leur zone : « ${(sort[0].textContent || sort[0].tagName).trim().slice(0, 30)} »`);
    }
    // Lot 3b-2 : au doigt, les boutons de « relier » ont au moins 44 px de
    // haut (ils faisaient 38 px au petit iPhone) ; et rien ne sort d'un
    // bouton (le nom d'un objet sous son dessin). Lot 3b-3 (audit
    // d'ergonomie) : au doigt, les touches du pavé et les réponses ont au
    // moins 40 px de haut (33 px à 393 × 660) ; un texte qui sort de son
    // bouton se voit aussi quand c'est le texte du bouton lui-même
    // (« une contenance » sur deux lignes, police plus large).
    if (basEl && visible(basEl)) {
      const boutons = [...basEl.querySelectorAll("button")].filter(visible).filter(b => getComputedStyle(b).pointerEvents !== "none");
      if (tactile) {
        const petit = boutons.find(b => b.closest(".assoc") && b.getBoundingClientRect().height < 43.5)
          || boutons.find(b => !b.closest(".assoc") && b.getBoundingClientRect().height < 39.5);
        if (petit) defauts.push(`un bouton trop petit au doigt : « ${petit.textContent.trim().slice(0, 20)} » (${Math.round(petit.getBoundingClientRect().height)} px)`);
      }
      const deborde = boutons.find(b => {
        const r = b.getBoundingClientRect();
        if (b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1) return true;
        return [...b.querySelectorAll("*")].filter(visible).some(e => {
          const c = e.getBoundingClientRect();
          return c.left < r.left - 0.5 || c.right > r.right + 0.5 || c.top < r.top - 0.5 || c.bottom > r.bottom + 0.5;
        });
      });
      if (deborde) defauts.push(`un texte sort de son bouton : « ${deborde.textContent.trim().slice(0, 20)} »`);
    }
    // Lot 3b-3 bis (rapport de Codex, F02 à F05) : au doigt, TOUT ce qui se
    // touche (bandeau, liens de l'accueil, logo, commandes du mode
    // professeur, voile) a une zone d'au moins 40 px de haut et de large.
    // La zone se mesure comme le doigt la trouve : les points où la page
    // répond « cet élément » (elementFromPoint), sur les deux axes qui
    // passent par son centre ; une zone agrandie sans changer le dessin
    // (::after) compte, une zone mangée par un voisin ne compte pas. (Pas
    // dans le glisse-unité : c'est toute la piste qui se touche ; un élément
    // coupé par le bord d'une liste qui défile se mesure quand il est entier.)
    if (tactile) {
      const voile = document.getElementById("voile");
      const ouvert = voile && !voile.hidden && visible(voile);
      const racine = ouvert ? voile : document.getElementById("app");
      const touche = (e, x, y) => { const h = document.elementFromPoint(x, y); return Boolean(h) && (h === e || e.contains(h)); };
      const petit = [...racine.querySelectorAll("a[href], button, [role='button'], input, select")]
        .filter(e => !(ouvert ? false : e.closest("#voile")) && !e.closest(".gu2") && !e.disabled && visible(e) && getComputedStyle(e).pointerEvents !== "none")
        .map(e => {
          const b = e.getBoundingClientRect();
          const liste = e.closest(".ecran-defile");
          const lb = liste ? liste.getBoundingClientRect() : {top: 0, bottom: vh, left: 0, right: vw};
          if (b.top < Math.max(0, lb.top) - 0.5 || b.bottom > Math.min(vh, lb.bottom) + 0.5) return null;
          const x = b.left + b.width / 2;
          const y = b.top + b.height / 2;
          if (!touche(e, x, y)) return null;
          const n = (dx, dy) => { let k = 0; while (k < 40 && touche(e, x + dx * (k + 1), y + dy * (k + 1))) k += 1; return k; };
          return {e, h: n(0, -1) + n(0, 1) + 1, l: n(-1, 0) + n(1, 0) + 1};
        }).filter(z => z && (z.h < 39.5 || z.l < 39.5));
      if (petit.length) {
        const nomZ = z => `« ${(z.e.textContent || z.e.getAttribute("aria-label") || z.e.tagName).trim().slice(0, 24)} » (${z.l} × ${z.h} px)`;
        defauts.push(`zone à toucher trop petite au doigt : ${petit.slice(0, 3).map(nomZ).join(", ")}${petit.length > 3 ? `, et ${petit.length - 3} autre(s)` : ""}`);
      }
    }
    // Lot 3b-3 bis (rapport de Codex, F01) : la correction se montre. Les
    // photos d'une correction se prennent 3 s après la réponse : le
    // glisse-unité est arrivé et la ligne de réponse est visible (de t à kg,
    // il restait bloqué sur t, la ligne cachée).
    if ([...cadre.querySelectorAll(".reponse-bonne")].some(r => getComputedStyle(r).visibility === "hidden")) {
      defauts.push("la bonne réponse reste cachée (le glisse-unité n'arrive pas à l'unité de la réponse)");
    }
    // (Un bouton figé après la réponse ne se touche plus : il ne compte pas.)
    const couverts =[...cadre.querySelectorAll(".bas button, #cadre > .btn, #cadre > .duo > .btn")].filter(visible)
      .filter(b => getComputedStyle(b).pointerEvents !== "none").filter(b => {
      const c = b.getBoundingClientRect();
      // Le centre et quatre points aux quarts (pas les coins : ils sont arrondis).
      return [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].map(([u, v]) => [c.left + u * c.width, c.top + v * c.height])
        .some(([x, y]) => { const e = document.elementFromPoint(x, y); return e && e !== b && !b.contains(e); });
    });
    if (couverts.length) defauts.push(`un bouton est recouvert : « ${couverts[0].textContent.trim().slice(0, 20)} »`);
    // Lot A2 ter : aucun chevauchement. Deux textes visibles (ou un texte et
    // une étiquette, un rond, une carte, un bouton, un dessin) ne se
    // recouvrent pas, dans la question, la zone et les réponses (Gwenaël, le
    // 13/11 : « le mot L'OUTIL est sur le texte », « les petits cercles sont
    // cachés par les propositions »). Les boîtes se testent deux à deux ; une
    // boîte ne se compare pas à ce qu'elle contient. Un dessin (svg) et le
    // glisse-unité comptent pour une seule boîte.
    {
      const blocs = [".q", ".zone", ".bas", ".consigne-montre"].map(sel => cadre.querySelector(sel)).filter(e => e && visible(e));
      const boites = [];
      const dansBloc = e => blocs.some(b => b.contains(e));
      const tropDedans = e => Boolean(e.closest("svg, .gu2, .pave4"));
      blocs.forEach(bloc => {
        const m = document.createTreeWalker(bloc, NodeFilter.SHOW_TEXT);
        while (m.nextNode()) {
          const n = m.currentNode;
          const e = n.parentElement;
          if (!n.textContent.trim() || !visible(e) || tropDedans(e)) continue;
          const rg = document.createRange();
          rg.selectNodeContents(n);
          [...rg.getClientRects()].filter(b => b.width > 1 && b.height > 1).forEach(b => boites.push({e, texte: n.textContent.trim().slice(0, 24), b}));
        }
      });
      // (Lot 3b-2 : les illustrations des repères, .ill, comme les dessins.)
      const SEL = ".etiq, .suite i, .carte-rep, .ref, .dix i, .esc i, .case, svg, .ill, .gu2, .pave4, .bas button, .rel, .verd, table";
      cadre.querySelectorAll(SEL).forEach(e => {
        // (Lot R1-refonte : les traits de relier, `svg.liens`, passent SOUS les
        // boutons exprès : ils ne se comparent à rien.)
        if (e.matches("svg.liens")) return;
        if (!dansBloc(e) || !visible(e) || (e.tagName.toLowerCase() === "svg" ? Boolean(e.parentElement.closest("svg, .gu2")) : tropDedans(e) && !e.matches(".gu2, .pave4"))) return;
        boites.push({e, texte: (e.textContent || e.getAttribute("aria-label") || e.className.baseVal || e.className || e.tagName).toString().trim().slice(0, 24) || e.tagName, b: e.getBoundingClientRect()});
      });
      // Le bouton « Valider / Suivant » aussi : rien ne passe dessous.
      cadre.querySelectorAll("#cadre > .btn, #cadre > .duo > .btn").forEach(e => { if (visible(e)) boites.push({e, texte: e.textContent.trim().slice(0, 24), b: e.getBoundingClientRect()}); });
      let trouve = null;
      for (let i = 0; i < boites.length && !trouve; i += 1) {
        for (let j = i + 1; j < boites.length && !trouve; j += 1) {
          const A = boites[i];
          const B = boites[j];
          if (A.e === B.e || A.e.contains(B.e) || B.e.contains(A.e)) continue;
          // (Lot B2-2a : le haut et le bas d'une même fraction en colonne,
          // .frac, sont serrés par leur hauteur de ligne de 1,05 ; leurs
          // boîtes de texte se recouvrent de 3 px environ alors que la
          // barre les sépare — mesuré par Code dans WebKit et Chromium.
          // On ne les compare pas entre eux ; une fraction contre un autre
          // texte se teste comme avant.)
          const fracA = A.e.closest(".frac");
          if (fracA && fracA === B.e.closest(".frac")) continue;
          const l = Math.max(A.b.left, B.b.left);
          const r = Math.min(A.b.right, B.b.right);
          const h = Math.max(A.b.top, B.b.top);
          const bb = Math.min(A.b.bottom, B.b.bottom);
          if (r - l > 1.5 && bb - h > 1.5) trouve = [A.texte, B.texte];
        }
      }
      if (trouve) defauts.push(`deux textes se chevauchent : « ${trouve[0]} » et « ${trouve[1]} »`);
    }
    // Lot A2 ter : une aide trop à l'étroit se réduit d'un seul tenant
    // (.zone-in) ; au-delà d'un cinquième, elle devient trop petite à lire.
    cadre.querySelectorAll(".zone-in").forEach(z => {
      const k = Number(z.dataset.echelle || 1);
      if (visible(z) && k < 0.8) defauts.push(`l'aide est réduite à ${Math.round(k * 100)} % pour tenir dans sa zone`);
    });
    // L'aide : rien de coupé dans sa zone.
    const z = cadre.querySelector(".zone");
    if (z && visible(z)) {
      const r = z.getBoundingClientRect();
      if (z.scrollHeight - z.clientHeight > 1 || z.scrollWidth - z.clientWidth > 1) defauts.push(`l'aide est coupée dans sa zone (${z.scrollHeight - z.clientHeight} px)`);
      const sort = [...z.querySelectorAll("*")].filter(visible).filter(e => {
        const b = e.getBoundingClientRect();
        return b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5;
      });
      if (sort.length) defauts.push(`l'aide sort de sa zone : « ${(sort[0].textContent || sort[0].tagName).trim().slice(0, 30)} »`);
    }
    // Le grand vide : les bandes horizontales du cadre où il n'y a rien à
    // voir (ni texte, ni dessin, ni bouton, ni case).
    const morceaux = [];
    const marcheur = document.createTreeWalker(cadre, NodeFilter.SHOW_TEXT);
    while (marcheur.nextNode()) {
      const n = marcheur.currentNode;
      if (!n.textContent.trim() || !visible(n.parentElement) || dansDefile(n.parentElement) && !n.parentElement.closest(".ecran-defile")) continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      [...rg.getClientRects()].forEach(b => { if (b.height) morceaux.push([b.top, b.bottom]); });
    }
    cadre.querySelectorAll("svg, img, button, input, .case, .btn, .dix i, .esc i, .ceinture, .pave4, .choix, .gu, .gu2, .ecran-defile, .heure, .schema, .prog").forEach(e => {
      if (!visible(e)) return;
      const b = e.getBoundingClientRect();
      morceaux.push([b.top, b.bottom]);
    });
    // Lot A2 ter : la zone d'aide garde la hauteur de sa série, un contenu court y est centré : ce n'est pas un vide.
    cadre.querySelectorAll(".zone").forEach(z => {
      if (!visible(z) || dansDefile(z)) return;
      const contenu = [...z.children].filter(e => !e.classList.contains("etiq") && visible(e)).map(e => e.getBoundingClientRect());
      if (!contenu.length) return;
      const s = getComputedStyle(z);
      const b = z.getBoundingClientRect();
      const haut = b.top + z.clientTop + parseFloat(s.paddingTop);
      const basZ = b.bottom - (b.height - z.clientTop - z.clientHeight) - parseFloat(s.paddingBottom);
      const dessus = Math.min(...contenu.map(r => r.top)) - haut;
      const dessous = basZ - Math.max(...contenu.map(r => r.bottom));
      if (Math.abs(dessus - dessous) <= 20) morceaux.push([b.top, b.bottom]);
    });
    morceaux.sort((a, b) => a[0] - b[0]);
    let bas = rc.top + parseFloat(getComputedStyle(cadre).paddingTop);
    let plusGrand = 0;
    let ou = 0;
    morceaux.forEach(([h, b]) => {
      if (h - bas > plusGrand) { plusGrand = h - bas; ou = bas; }
      bas = Math.max(bas, b);
    });
    const fin = rc.bottom - parseFloat(getComputedStyle(cadre).paddingBottom);
    if (fin - bas > plusGrand) { plusGrand = fin - bas; ou = bas; }
    if (plusGrand > Math.max(90, 0.15 * vh)) defauts.push(`un vide de ${Math.round(plusGrand)} px (à ${Math.round(ou - rc.top)} px du haut du cadre)`);
    // En projection : lisible du fond de la salle.
    if (projection) {
      let petit = null;
      const m2 = document.createTreeWalker(cadre, NodeFilter.SHOW_TEXT);
      while (m2.nextNode()) {
        const e = m2.currentNode.parentElement;
        // (Lot 3b-2 : le crédit d'une illustration, en petit, est une mention.)
        if (!m2.currentNode.textContent.trim() || !visible(e) || e.closest("svg, .credit")) continue;
        const t = parseFloat(getComputedStyle(e).fontSize);
        if (!petit || t < petit[0]) petit = [t, m2.currentNode.textContent.trim().slice(0, 24)];
      }
      if (petit && petit[0] < 17) defauts.push(`texte trop petit pour la projection : ${petit[0]} px (« ${petit[1]} »)`);
      if (q && visible(q)) {
        const t = Math.max(...[...q.querySelectorAll("*")].filter(visible).map(e => parseFloat(getComputedStyle(e).fontSize)));
        if (t < 30) defauts.push(`question trop petite pour la projection : ${t} px`);
      }
    }
    return defauts;
  }, {projection: Boolean(taille.projection), tactile: Boolean(taille.tactile)});
}

// Les places des blocs d'une série (rien ne bouge).
async function places(page) {
  return page.evaluate(() => {
    const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(Math.round); };
    return {question: r(".q"), zone: r(".zone"), "pavé": r(".bas"), bouton: r("#cadre .duo, #cadre .btn"), "je ne sais pas": r("#cadre .jnsp")};
  });
}
function ecarts(a, b) {
  return Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map(k => `« ${k} » a bougé${process.env.DEFI_CONVERSIONS_DETAIL ? ` ${JSON.stringify(a[k])}→${JSON.stringify(b[k])}` : ""}`);
}

// ------------------------------------------------------------ jouer
async function ouvrir(navigateur, base, taille, {prof = false, parcours = null} = {}) {
  const contexte = await navigateur.newContext(Object.assign({viewport: {width: taille.largeur, height: taille.hauteur}, deviceScaleFactor: 1},
    taille.tactile ? {hasTouch: true, isMobile: true} : {}));
  const page = await contexte.newPage();
  page.tactile = Boolean(taille.tactile);
  page.moteur = navigateur.browserType().name();
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(String(e)));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  await page.clock.install({time: new Date(`${JOUR}T10:00:00`)});
  await page.addInitScript(([p, cle, police]) => {
    Math.random = () => 0.5;
    if (p && !sessionStorage.getItem("pose")) { localStorage.setItem(cle, p); sessionStorage.setItem("pose", "1"); }
    // Lot 3a : une autre police que celle de la machine (les vrais appareils
    // n'ont pas Inter : Segoe UI sur PC, la police du système sur iPhone).
    if (police) document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = `*{font-family:"${police}",sans-serif !important}`;
      document.head.appendChild(s);
    });
  }, [parcours ? JSON.stringify(parcours) : null, CLE, POLICE]);
  await page.goto(`${base}${PAGE}${prof ? "?prof=1" : ""}`);
  await page.waitForSelector("#cadre > *");
  return {page, contexte, erreurs};
}
async function attendre(page, ms = 1000) {
  await page.clock.runFor(ms);
  await page.waitForTimeout(30);
}
// Toucher (au téléphone, au doigt : un vrai toucher) ou cliquer.
async function appuyer(page, locator) {
  if (page.tactile) await locator.tap();
  else await locator.click();
}
// Glisser d'un point à un autre. Au doigt : de vrais événements tactiles
// (Chromium : Input.dispatchTouchEvent, le chemin d'un vrai doigt, avec
// touch-action). WebKit n'a pas d'entrée tactile glissée dans Playwright
// (seulement tap) : le doigt y est joué par des événements de pointeur
// « touch » envoyés à la page. À la souris, sinon.
async function glisser(page, x0, y0, x1, y1, pas = 10) {
  if (page.tactile && page.moteur === "chromium") {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {type: "touchStart", touchPoints: [{x: x0, y: y0, id: 1}]});
    for (let k = 1; k <= pas; k += 1) {
      await cdp.send("Input.dispatchTouchEvent", {type: "touchMove", touchPoints: [{x: x0 + ((x1 - x0) * k) / pas, y: y0 + ((y1 - y0) * k) / pas, id: 1}]});
    }
    await cdp.send("Input.dispatchTouchEvent", {type: "touchEnd", touchPoints: []});
    await cdp.detach();
  } else if (page.tactile) {
    await page.evaluate(([a, b, c, d, n]) => {
      const cible = document.elementFromPoint(a, b);
      const ev = (type, x, y) => new PointerEvent(type, {bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: "touch", isPrimary: true,
        clientX: x, clientY: y, buttons: type === "pointerup" ? 0 : 1});
      if (!cible) return;
      cible.dispatchEvent(ev("pointerdown", a, b));
      // Après pointerdown, le pointeur appartient à l'élément qui l'a capturé.
      for (let k = 1; k <= n; k += 1) cible.dispatchEvent(ev("pointermove", a + ((c - a) * k) / n, b + ((d - b) * k) / n));
      cible.dispatchEvent(ev("pointerup", c, d));
    }, [x0, y0, x1, y1, pas]);
  } else {
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    await page.mouse.move(x1, y1, {steps: pas});
    await page.mouse.up();
  }
  await attendre(page, 300);
}
async function cliquerTexte(page, texte, exact = false) {
  await appuyer(page, page.locator("#cadre, #voile").getByText(texte, {exact}).first());
  await attendre(page, 50);
}
// Répondre à la question à l'écran, juste ou faux (`_q` : plus utilisé, la
// page donne la question).
async function repondre(page, _q, juste = true) {
  const q = await page.evaluate(() => window.MATHSGO_DEFI_CONVERSIONS_ECRAN.question());
  if (!q) throw new Error("pas de question à l'écran");
  if (q.forme === "associer") {
    // Au doigt : un objet, puis sa mesure (lot A2 bis). Faux : deux mesures échangées.
    const lien = juste ? q.bonnes : [q.bonnes[1], q.bonnes[0], q.bonnes[2]];
    for (let i = 0; i < 3; i += 1) {
      await appuyer(page, page.locator(".assoc .obj").nth(i));
      await appuyer(page, page.locator(".assoc .mes").nth(lien[i]));
    }
    await appuyer(page, page.locator("#cadre .action"));
  } else if (q.forme === "ranger") {
    // Au doigt : les mesures dans l'ordre. Faux : les deux premières échangées.
    const ordre = juste ? q.ordre : [q.ordre[1], q.ordre[0], ...q.ordre.slice(2)];
    for (const k of ordre) await appuyer(page, page.locator(".ranger button").nth(k));
    await appuyer(page, page.locator("#cadre .action"));
  } else if (q.forme === "plusieurs") {
    // Lot B2-1b : « Coche tout ce qui est égal à… » — au doigt, les bonnes
    // cartes ; faux : les bonnes, puis une carte fausse.
    const cartes = juste ? q.bons : q.bons.concat([[0, 1, 2, 3].find(k => !q.bons.includes(k))]);
    for (const k of cartes) await appuyer(page, page.locator(".coche button").nth(k));
    await appuyer(page, page.locator("#cadre .action"));
  } else if (q.choix) {
    const i = juste ? q.bon : (q.bon + 1) % q.choix.length;
    await appuyer(page, page.locator(".choix button").nth(i));
  } else {
    const r = Array.isArray(q.reponse) ? q.reponse : [q.reponse];
    const valeurs = juste ? r : r.map(x => `${x}1`);
    if (page.tactile) {
      // Au doigt : les touches du pavé, la 2e case touchée, puis « Valider ».
      for (let k = 0; k < valeurs.length; k += 1) {
        if (k) await appuyer(page, page.locator(".q .case").nth(k));
        for (const c of String(valeurs[k]).replace(/\s/g, "")) await appuyer(page, page.locator(".pave4 button").filter({hasText: new RegExp(`^${c === "," ? "," : c}$`)}).first());
      }
      await appuyer(page, page.locator("#cadre .action"));
    } else {
      for (let k = 0; k < valeurs.length; k += 1) {
        if (k) await page.keyboard.press("Tab");
        for (const c of String(valeurs[k]).replace(/\s/g, "")) await page.keyboard.press(c === "," ? "Comma" : c);
      }
      await page.keyboard.press("Enter");
    }
  }
  await attendre(page, juste ? 1000 : 50);
}
// Lot 3b-2 : une erreur de sens (diviser au lieu de multiplier), que la
// page donne (`sens` : le texte à taper ou la place du choix).
async function repondreSens(page, sens) {
  if (sens.choix !== undefined) await appuyer(page, page.locator(".choix button").nth(sens.choix));
  else if (page.tactile) {
    for (const c of String(sens.texte)) await appuyer(page, page.locator(".pave4 button").filter({hasText: new RegExp(`^${c}$`)}).first());
    await appuyer(page, page.locator("#cadre .action"));
  } else {
    for (const c of String(sens.texte)) await page.keyboard.press(c === "," ? "Comma" : c);
    await page.keyboard.press("Enter");
  }
  await attendre(page, 50);
}
// « Je ne sais pas » (lot 3a).
async function jeNeSaisPas(page) {
  await appuyer(page, page.locator("#cadre .jnsp"));
  await attendre(page, 50);
}
async function suivant(page) {
  await appuyer(page, page.locator("#cadre").getByText("Suivant", {exact: false}).first());
  await attendre(page, 50);
}
// Glisser le glisse-unité au doigt, de sa colonne marquée jusqu'à l'unité
// `vers` (ou d'une colonne). Renvoie un défaut, ou rien.
async function glisserUnite(page, vers = null) {
  const ici = await page.locator(".zone .gu2-chiffres span.unite").first().boundingBox();
  const tete = await page.locator(".zone .gu2-tete button.on").first().boundingBox();
  if (!ici || !tete) return "le glisse-unité n'est pas à l'écran";
  let cible;
  if (vers) cible = await page.locator(`.zone [aria-label="Mettre l'unité sur ${vers}"]`).first().boundingBox();
  else {
    // Une colonne plus loin (à droite, sinon à gauche), qui a un nom.
    const noms = await page.locator(".zone .gu2-tete button:not(.sans-nom)").evaluateAll(bs => bs.map(b => b.classList.contains("on")));
    const k = noms.indexOf(true);
    const j = k + 1 < noms.length ? k + 1 : k - 1;
    cible = await page.locator(".zone .gu2-tete button:not(.sans-nom)").nth(j).boundingBox();
  }
  if (!cible) return `le glisse-unité n'a pas l'unité ${vers}`;
  const avant = await page.locator(".zone .gu2-tete button.on").first().textContent();
  const y = ici.y + ici.height / 2;
  await glisser(page, ici.x + ici.width / 2, y, cible.x + cible.width / 2, y);
  const apres = await page.locator(".zone .gu2-tete button.on").first().textContent();
  if (apres === avant) return "le glisse-unité ne glisse pas au doigt";
  return "";
}
// Le geste de On te montre : ouvrir les barres, toucher le dessin, glisser
// l'unité, jusqu'à ce que la case se remplisse (ou rien à faire).
async function faireLeGeste(page, aide) {
  for (let essai = 0; essai < 14; essai += 1) {
    const etat = await page.evaluate(() => ({
      fait: Boolean(document.querySelector(".q .case.vert")) || !document.querySelector(".q .case")
    }));
    if (etat.fait) return [];
    if (aide.type === "glisse-unite") {
      // Au doigt, comme un élève : le doigt se pose sur la colonne marquée
      // (le cadre de couleur, là où sont les chiffres) et glisse jusqu'à
      // l'unité voulue (lot A2 ter : au téléphone, « le truc ne glisse pas »).
      const erreur = await glisserUnite(page, aide.vers);
      if (erreur) return [erreur];
      if (!(await page.locator(".q .case.vert").count())) return [`le glisse-unité ne se glisse pas jusqu'à ${aide.vers}`];
      return [];
    } else if (aide.type === "glisse-nombre") {
      await appuyer(page, page.locator(".zone .ope").first());
    } else if (aide.type === "barres") {
      const n = await page.locator(".zone .barre").count();
      await appuyer(page, page.locator(".zone .barre").nth(Math.min(essai, n - 1)));
    } else if (aide.type === "heure") {
      const b = page.locator(".zone .a-toucher");
      if (!(await b.count())) return [];
      await appuyer(page, b.first());
    } else if (aide.type === "numeration") {
      // Lot B1-2 : les préfixes et la numération, une ligne à toucher par
      // préfixe.
      const a = page.locator(".zone .num-ligne:not(.vue)");
      if (!(await a.count())) return [];
      await appuyer(page, a.first());
    } else if (["verre", "balance", "horloge"].includes(aide.type)) {
      await appuyer(page, page.locator(".zone .dessin").first());
    } else if (["echange", "pieces", "etiquette", "horloges", "axe", "barre2", "droite2"].includes(aide.type)) {
      // Lot A2 bis : on touche ce qui reste à toucher (une pièce de 1 €,
      // l'étiquette, l'horloge de départ, l'axe du temps).
      const a = page.locator(".zone .a-toucher");
      if (!(await a.count())) return [`rien à toucher dans « ${aide.type} »`];
      await appuyer(page, a.first());
    } else return [];
    await attendre(page, 50);
  }
  return ["le geste de On te montre ne remplit pas la case"];
}

// ------------------------------------------------------------ les planches
class Carnet {
  constructor(moteur, taille, etape) {
    Object.assign(this, {moteur, taille, etape, ecrans: []});
  }
  async photo(page, nom, extra = []) {
    // Les petites transitions (le glisse-unité qui glisse) vont à leur fin.
    await page.waitForTimeout(250);
    // (Lot 3b-2 : les illustrations chargées avant la photo.)
    await page.waitForFunction(() => [...document.querySelectorAll("#cadre img")].every(i => i.complete), null, {timeout: 5000}).catch(() => {});
    const defauts = extra.concat(await controler(page, this.taille));
    const png = await page.screenshot();
    this.ecrans.push({nom, defauts, png});
    // Lot 3b-2 : chaque écran à part (pour les planches avant / après d'une
    // notice), DEFI_CONVERSIONS_ECRANS=/dossier.
    if (process.env.DEFI_CONVERSIONS_ECRANS) {
      const nomF = `${this.etape}-${this.taille.nom}-${String(this.ecrans.length).padStart(2, "0")}-${nom.normalize("NFD").replace(/[^\w]+/g, "-").slice(0, 60)}.png`;
      fs.mkdirSync(path.join(process.env.DEFI_CONVERSIONS_ECRANS, this.moteur), {recursive: true});
      fs.writeFileSync(path.join(process.env.DEFI_CONVERSIONS_ECRANS, this.moteur, nomF), png);
    }
    return defauts;
  }
}
async function planche(navigateur, carnet) {
  if (!PLANCHES) return;
  const {taille} = carnet;
  const largeur = taille.tel ? 220 : 470;
  const colonnes = taille.tel ? 7 : 4;
  const page = await navigateur.newPage({viewport: {width: colonnes * (largeur + 14) + 20, height: 600}, deviceScaleFactor: 1});
  const cases = carnet.ecrans.map(e => {
    const ok = !e.defauts.length;
    const verdict = ok ? '<div class="v ok">✓ adapté</div>' : e.defauts.map(d => `<div class="v ko">✗ ${d.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div>`).join("");
    return `<figure><img src="data:image/png;base64,${e.png.toString("base64")}"><figcaption><b>${e.nom}</b>${verdict}</figcaption></figure>`;
  }).join("");
  const nomEtape = carnet.etape === "commun" ? "Écrans communs" : `${carnet.etape} · ${CARTE.etape(carnet.etape).nom}`;
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    body{margin:10px;font:13px system-ui,sans-serif;background:#eef2f5;color:#143451}
    h1{font-size:18px;margin:0 0 8px} .g{display:grid;grid-template-columns:repeat(${colonnes},${largeur}px);gap:14px}
    figure{margin:0;background:#fff;border:1px solid #c9d6e0;border-radius:6px;padding:5px}
    img{width:100%;display:block;border:1px solid #dde5ec} figcaption{padding-top:4px} b{display:block}
    .v{font-weight:700;margin-top:2px} .ok{color:#147447} .ko{color:#a93030}</style>
    <h1>Défi conversions · ${nomEtape} · ${taille.nom} · ${carnet.moteur}</h1><div class="g">${cases}</div>`);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  const dossier = path.join(PLANCHES, carnet.moteur);
  fs.mkdirSync(dossier, {recursive: true});
  await page.screenshot({path: path.join(dossier, `planche-${carnet.etape}-${taille.nom}.png`), fullPage: true});
  await page.close();
}

// ------------------------------------------------------------ une étape
async function jouerEtape(navigateur, base, taille, code, carnet) {
  const etape = CARTE.etape(code);
  const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {prof: true});
  const choisir = async () => {
    await cliquerTexte(page, "Changer d'étape");
    await appuyer(page, page.locator("#cadre .li2").filter({hasText: etape.nomCourt}).first());
    await attendre(page, 50);
  };
  const accueilProf = async () => {
    const b = page.locator("#cadre").getByText("Accueil", {exact: true});
    if (await b.count()) await appuyer(page, b.first());
    else await appuyer(page, page.locator(".bseance .rond").first());
    await attendre(page, 50);
  };
  await choisir();

  // On te montre : les 3 temps, le geste fait.
  // Lot A2 ter : au 1er temps, l'élève appuie sur « Suivant » sans faire le
  // geste (Gwenaël, le 13/11 : « Est-ce que l'élève va penser à toucher ? »).
  // Ce premier appui joue le geste à sa place : la case se remplit,
  // l'explication apparaît, et on reste sur ce temps. Aux 2e et 3e temps, le
  // robot fait le geste lui-même.
  await cliquerTexte(page, "J'apprends : on te montre");
  // (Lot R1-refonte : « Mes premiers repères » a un temps par repère, 10.)
  const nTemps = etape.apprends.length;
  for (let t = 0; t < nTemps; t += 1) {
    const nomT = `On te montre ${t + 1} · ${etape.apprends[t].etiquette}`;
    const aFaire = Boolean(await page.locator(".q .case").count()) && !(await page.locator(".q .case.vert").count());
    if (t === 0 && aFaire) {
      await suivant(page);
      await attendre(page, 4000);
      const ici = (await page.locator(".bseance .chip").textContent()).replace(/\s/g, "");
      const rempli = await page.evaluate(() => Boolean(document.querySelector(".q .case.vert")) && Boolean(document.querySelector(".zone .apres, .zone .note")));
      if (ici !== `1/${nTemps}`) {
        await carnet.photo(page, `${nomT} (Suivant sans le geste)`, ["« Suivant » sans le geste : on passe au temps suivant sans rien voir"]);
        continue;
      }
      if (rempli) {
        await carnet.photo(page, `${nomT} (Suivant sans le geste)`);
        await suivant(page);
        continue;
      }
      const geste = ["« Suivant » sans le geste : la case reste vide"].concat(await faireLeGeste(page, etape.apprends[t].aide));
      await carnet.photo(page, `${nomT} (Suivant sans le geste)`, geste);
      await suivant(page);
      continue;
    }
    const geste = await faireLeGeste(page, etape.apprends[t].aide);
    await page.waitForTimeout(600); // la fin des petites animations (le glisse-nombre)
    await carnet.photo(page, nomT, geste);
    await suivant(page);
  }

  // Lot R1-refonte : la liste à recopier vient avant À toi (son bouton, en
  // mode professeur : « Accueil »).
  if (await page.locator(".liste-avant").count()) {
    await carnet.photo(page, "La liste à recopier (avant À toi)");
    await appuyer(page, page.locator("#cadre button").filter({hasText: "Accueil"}).first());
    await attendre(page, 50);
  }

  // À toi : une erreur à la 1re question, puis juste jusqu'au bout.
  await cliquerTexte(page, "J'apprends : à toi");
  const serie = G.serie(code, {usage: "entraine", graine: GRAINE});
  const reference = await places(page);
  const vus = new Set();
  let bouge = [];
  for (let i = 0; i < 25 && !(await page.locator(".retenir, .cahier").count()); i += 1) {
    const phase = await page.evaluate(() => {
      const z = document.querySelector(".zone");
      return z ? (z.classList.contains("outil") ? "outil" : z.classList.contains("image") ? "image" : "seul") : null;
    });
    bouge = bouge.concat(ecarts(reference, await places(page)).map(e => `${e} (question ${i + 1})`));
    if (!vus.has(phase)) {
      vus.add(phase);
      // L'outil glisse-unité : il se glisse au doigt (lot A2 ter).
      if (phase === "outil" && await page.locator(".zone .gu2").count()) {
        const e = await glisserUnite(page);
        if (e) bouge.push(e);
      }
      await carnet.photo(page, `À toi · ${phase === "outil" ? "l'outil" : phase === "image" ? "l'image" : "sans aide"}`, bouge);
      bouge = [];
    }
    if (i === 0) {
      await repondre(page, serie[i], false);
      // La correction se joue (le glisse-unité glisse jusqu'à la réponse).
      await attendre(page, 3000);
      await carnet.photo(page, "À toi · une erreur", ecarts(reference, await places(page)));
      await suivant(page);
    } else if (i === 2 && (await page.evaluate(() => (window.MATHSGO_DEFI_CONVERSIONS_ECRAN.question() || {}).sens))) {
      // Lot 3b-2 : une erreur de sens, « Je prévois » (grandir ou
      // rapetisser ?), la bonne réponse, puis la question reposée, juste.
      const q = await page.evaluate(() => window.MATHSGO_DEFI_CONVERSIONS_ECRAN.question());
      await repondreSens(page, q.sens);
      if (!(await page.locator(".prevois-choix").count())) bouge.push("« Je prévois » ne vient pas après une erreur de sens");
      await carnet.photo(page, "À toi · Je prévois", bouge.concat(ecarts(reference, await places(page))));
      bouge = [];
      if (await page.locator(".prevois-choix").count()) {
        await appuyer(page, page.locator(".prevois-choix button").nth(q.sens.grandit ? 0 : 1));
        await carnet.photo(page, "À toi · Je prévois, la réponse", ecarts(reference, await places(page)));
        await cliquerTexte(page, "Réessayer");
        await repondre(page, null);
      }
    } else if (i === 1) {
      // Lot 3a : « Je ne sais pas » : la correction, sans reproche ; rien ne bouge.
      await jeNeSaisPas(page);
      await attendre(page, 3000);
      await carnet.photo(page, "À toi · Je ne sais pas", ecarts(reference, await places(page)));
      await suivant(page);
    } else await repondre(page, serie[i]);
  }
  await carnet.photo(page, "À retenir", bouge);
  await accueilProf();

  // Je valide (lot 3a : mêlé aux étapes d'avant, corrigé tout de suite) :
  // une erreur à la 4e, « Je ne sais pas » à la 6e, la liste à la fin.
  await appuyer(page, page.locator("#cadre .act").filter({hasText: "Je valide"}).first());
  await attendre(page, 50);
  const refV = await places(page);
  bouge = [];
  const ratees = [];
  for (let i = 0; i < 10 && !(await page.locator(".titre-fin").count()); i += 1) {
    bouge = bouge.concat(ecarts(refV, await places(page)).map(e => `${e} (question ${i + 1})`));
    if (i === 0) await carnet.photo(page, "Je valide · question");
    if (i === 2) await carnet.photo(page, "Je valide · une question d'une étape d'avant");
    if (i === 3 || i === 5) {
      // (Lot 3b-3 bis : le texte de la question ratée, pour la liste de la fin.)
      ratees.push(await page.evaluate(() => window.MATHSGO_DEFI_CONVERSIONS_ECRAN.question().resume));
      if (i === 3) await repondre(page, null, false); else await jeNeSaisPas(page);
      await attendre(page, 3000);
      await carnet.photo(page, i === 3 ? "Je valide · une erreur, corrigée tout de suite" : "Je valide · Je ne sais pas", ecarts(refV, await places(page)));
      await suivant(page);
    } else await repondre(page, null);
  }
  // Lot 3b-3 bis (rapport de Codex, F06) : chaque ligne de « Mes erreurs,
  // corrigées » est le texte entier de la question ratée (« Une voiture :
  // environ 4 m de l4 m » : le repère coupé, la réponse collée derrière).
  const lignesFin = await page.evaluate(() => [...document.querySelectorAll(".corr > div > span:first-child")].map(e => e.textContent));
  const abimees = ratees.filter(r => r && !lignesFin.includes(r));
  await carnet.photo(page, "Je valide · la fin", bouge.concat(abimees.length ? [`une erreur mal recopiée dans la liste : « ${abimees[0].slice(0, 40)} »`] : []));
  await accueilProf();

  // Tu connais déjà ? : l'annonce, une marche.
  await cliquerTexte(page, "Tu connais déjà ?");
  await carnet.photo(page, "Tu connais déjà ? · l'annonce");
  await cliquerTexte(page, "Je commence");
  await carnet.photo(page, "Tu connais déjà ? · une marche");
  await cliquerTexte(page, "Je m'arrête là");
  await carnet.photo(page, "Tu connais déjà ? · la fin");
  await accueilProf();

  // Je me souviens (l'élève fictif du mode professeur : les étapes d'avant
  // reviennent) : une erreur, « Je ne sais pas », la fin, puis Avant de partir.
  await appuyer(page, page.locator("#cadre .act").filter({hasText: "Je me souviens"}).first());
  await attendre(page, 50);
  if (await page.locator(".bseance").count()) {
    const refE = await places(page);
    await carnet.photo(page, "Je me souviens · question");
    await repondre(page, null, false);
    await attendre(page, 3000);
    await carnet.photo(page, "Je me souviens · une erreur", ecarts(refE, await places(page)));
    await suivant(page);
    bouge = [];
    let n = 1;
    if (!(await page.locator(".titre-fin").count())) {
      await jeNeSaisPas(page);
      await attendre(page, 3000);
      await carnet.photo(page, "Je me souviens · Je ne sais pas", ecarts(refE, await places(page)));
      await suivant(page);
      n = 2;
    }
    for (let i = n; i < 12 && !(await page.locator(".titre-fin").count()); i += 1) {
      bouge = bouge.concat(ecarts(refE, await places(page)).map(e => `${e} (question ${i + 1})`));
      await repondre(page, null);
    }
    await carnet.photo(page, "Je me souviens · la fin", bouge);
    await appuyer(page, page.locator("#cadre > .btn").last());
    await attendre(page, 50);
    if (await page.locator(".bseance").getByText("Avant de partir").count() && await page.locator(".q").count()) {
      const refA = await places(page);
      await carnet.photo(page, "Avant de partir · question");
      bouge = [];
      for (let i = 0; i < 3 && !(await page.locator(".titre-fin").count()); i += 1) {
        bouge = bouge.concat(ecarts(refA, await places(page)).map(e => `${e} (question ${i + 1})`));
        await repondre(page, null);
      }
      await carnet.photo(page, "Avant de partir · la fin", bouge);
    }
  }
  if (erreurs.length) carnet.ecrans.push({nom: "Erreurs de la page", defauts: erreurs.slice(0, 3), png: await page.screenshot()});
  await contexte.close();
}

// ------------------------------------------------------------ les écrans communs
async function jouerCommun(navigateur, base, taille, carnet) {
  // Un nouveau visiteur.
  {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille);
    await carnet.photo(page, "Accueil · nouveau");
    // Lot A2 ter (Gwenaël, le 13/11 : « les deux cercles ne sont pas
    // alignés, le 1 est décalé ») : le rond de la flèche des écrans à titre
    // prend la place exacte du rond du palier de l'accueil (même centre, même
    // taille) ; en passant de l'un à l'autre, rien ne saute.
    const rondAccueil = await page.locator(".acc-palier .acc-ceinture").first().boundingBox();
    const memePlace = async () => {
      const r = await page.locator(".tete-ecran .rond").first().boundingBox();
      if (!r || !rondAccueil) return [];
      const ecart = Math.max(Math.abs(r.x + r.width / 2 - rondAccueil.x - rondAccueil.width / 2), Math.abs(r.y + r.height / 2 - rondAccueil.y - rondAccueil.height / 2),
        Math.abs(r.width - rondAccueil.width));
      return ecart > 1 ? [`le rond de la flèche n'est pas à la place du rond du palier (${Math.round(ecart)} px d'écart)`] : [];
    };
    await cliquerTexte(page, "Comment ça marche ?");
    await carnet.photo(page, "Comment ça marche ?", await memePlace());
    await appuyer(page, page.locator(".tete-ecran .rond"));
    await cliquerTexte(page, "Mon parcours");
    await carnet.photo(page, "Mon parcours · nouveau", await memePlace());
    await appuyer(page, page.locator(".tete-ecran .rond"));
    await cliquerTexte(page, "Mon carnet");
    await carnet.photo(page, "Mon carnet · vide", await memePlace());
    if (erreurs.length) carnet.ecrans.push({nom: "Erreurs (nouveau)", defauts: erreurs.slice(0, 3), png: await page.screenshot()});
    await contexte.close();
  }
  // Un élève en cours : 4 étapes validées les jours d'avant (elles
  // reviennent), « À toi » de la 5e réussi ce matin (Je valide juste après).
  {
    let p = P.creer();
    [["R1", "2026-11-05"], ["R2", "2026-11-06"], ["P1", "2026-11-07"], ["C1", "2026-11-09"]].forEach(([c, d]) => {
      p = P.marquerEntrainee(p, c, d);
      p = P.noterValidation(p, c, true, d);
    });
    p = P.marquerEntrainee(p, "C2", JOUR);
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {parcours: p});
    await carnet.photo(page, "Accueil · en cours (Je me souviens)");
    await cliquerTexte(page, "Mon parcours");
    await carnet.photo(page, "Mon parcours · en cours");
    await appuyer(page, page.locator(".pal-tabs button").nth(3));
    await attendre(page, 50);
    await carnet.photo(page, "Mon parcours · palier en préparation");
    await appuyer(page, page.locator(".tete-ecran .rond"));
    await cliquerTexte(page, "Mon carnet");
    await carnet.photo(page, "Mon carnet · 10 repères");
    await appuyer(page, page.locator(".tete-ecran .rond"));
    await cliquerTexte(page, "Effacer mon historique");
    await carnet.photo(page, "Effacer mon historique");
    await page.keyboard.press("Escape");
    // La séance : Je me souviens (une erreur), Je valide, Avant de partir.
    await cliquerTexte(page, "C'est parti");
    await repondre(page, null, false);
    await suivant(page);
    for (let i = 1; i < 12 && !(await page.locator(".titre-fin").count()); i += 1) await repondre(page, null);
    await carnet.photo(page, "Je me souviens · la fin (élève)");
    await appuyer(page, page.locator("#cadre > .btn").last());
    await attendre(page, 50);
    for (let i = 0; i < 10 && !(await page.locator(".titre-fin").count()); i += 1) await repondre(page, null);
    await carnet.photo(page, "Je valide · la fin, avant de partir (élève)");
    await cliquerTexte(page, "Avant de partir");
    await carnet.photo(page, "Avant de partir · question (élève)");
    await repondre(page, null, false);
    await attendre(page, 3000);
    await carnet.photo(page, "Avant de partir · une erreur (élève)");
    await suivant(page);
    for (let i = 1; i < 3 && !(await page.locator(".titre-fin").count()); i += 1) await repondre(page, null);
    await carnet.photo(page, "Avant de partir · la fin (élève)");
    if (erreurs.length) carnet.ecrans.push({nom: "Erreurs (en cours)", defauts: erreurs.slice(0, 3), png: await page.screenshot()});
    await contexte.close();
  }
  // Correctif « polices » (14/11) : l'accueil le plus chargé, une étape pas
  // commencée (« Tu connais déjà ? ») et des étapes qui reviennent (trois
  // pastilles) ; il dépassait du cadre sans la police Inter.
  {
    let p = P.creer();
    [["R1", "2026-11-05"], ["R2", "2026-11-06"], ["P1", "2026-11-07"], ["C1", "2026-11-09"]].forEach(([c, d]) => {
      p = P.marquerEntrainee(p, c, d);
      p = P.noterValidation(p, c, true, d);
    });
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {parcours: p});
    await carnet.photo(page, "Accueil · étape pas commencée, des étapes qui reviennent");
    if (erreurs.length) carnet.ecrans.push({nom: "Erreurs (étape pas commencée)", defauts: erreurs.slice(0, 3), png: await page.screenshot()});
    await contexte.close();
  }
  // Les étoiles et la ceinture jaune : 9 étapes validées depuis longtemps
  // (6 solides), « À toi » de la dernière réussi ce matin.
  {
    let p = P.creer();
    PARCOURS.slice(0, 9).forEach((c, i) => {
      const d = P.ajouterJours(JOUR, -(40 - i));
      p = P.noterTest(p, c, d);
      [1, 4, 11].forEach((n, k) => { if (k < 2 || i < 6) p = P.noterRetour(p, c, true, P.ajouterJours(d, n), 100 + k); });
      p = P.noterRetour(p, c, true, P.ajouterJours(d, 25), 104);
    });
    p = P.marquerEntrainee(p, PARCOURS[9], JOUR);
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {parcours: p});
    await carnet.photo(page, "Accueil · des étoiles");
    await cliquerTexte(page, "Mon parcours");
    await carnet.photo(page, "Mon parcours · des étoiles");
    await appuyer(page, page.locator(".tete-ecran .rond"));
    await cliquerTexte(page, "C'est parti");
    for (let i = 0; i < 14 && !(await page.locator(".titre-fin").count()); i += 1) await repondre(page, null);
    if (await page.locator(".bseance").getByText("Je me souviens").count()) { await appuyer(page, page.locator("#cadre > .btn").last()); await attendre(page, 50); }
    for (let i = 0; i < 10 && !(await page.locator(".titre-fin").count()); i += 1) await repondre(page, null);
    await cliquerTexte(page, "Continuer");
    await carnet.photo(page, "La ceinture gagnée");
    await cliquerTexte(page, "Continuer");
    await carnet.photo(page, "Accueil · la ceinture jaune");
    if (erreurs.length) carnet.ecrans.push({nom: "Erreurs (ceinture)", defauts: erreurs.slice(0, 3), png: await page.screenshot()});
    await contexte.close();
  }
  // La ceinture par le test : tout le palier 1 sauf la dernière étape.
  {
    let p = P.creer();
    PARCOURS.slice(0, -1).forEach((c, i) => { p = P.noterTest(p, c, P.ajouterJours(JOUR, -(20 - i))); p = P.noterRetour(p, c, true, P.ajouterJours(JOUR, -(19 - i)), 9); });
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {parcours: p});
    await cliquerTexte(page, "Tu connais déjà ?");
    await cliquerTexte(page, "Je commence");
    for (let i = 0; i < 3; i += 1) await repondre(page, null);
    await carnet.photo(page, "La ceinture · par le test");
    await cliquerTexte(page, "Continuer");
    await carnet.photo(page, "Tu connais déjà ? · fin avec ceinture");
    if (erreurs.length) carnet.ecrans.push({nom: "Erreurs (test)", defauts: erreurs.slice(0, 3), png: await page.screenshot()});
    await contexte.close();
  }
  // Le mode professeur, et « À toi » sans réussir (25 erreurs).
  {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille, {prof: true});
    await carnet.photo(page, "Mode professeur · accueil");
    await cliquerTexte(page, "Changer d'étape");
    await carnet.photo(page, "Mode professeur · Changer d'étape");
    await appuyer(page, page.locator("#cadre .li2").filter({hasText: CARTE.etape("C1").nomCourt}).first());
    await cliquerTexte(page, "Voir une série");
    await carnet.photo(page, "Mode professeur · Voir une série");
    await appuyer(page, page.locator(".tete-ecran .rond"));
    await cliquerTexte(page, "J'apprends : à toi");
    const serie = G.serie("C1", {usage: "entraine", graine: GRAINE});
    for (let i = 0; i < 25 && !(await page.getByText("On continue la prochaine fois").count()); i += 1) {
      await repondre(page, serie[i], false);
      await suivant(page);
    }
    await carnet.photo(page, "À toi · sans réussir (25 questions)");
    if (erreurs.length) carnet.ecrans.push({nom: "Erreurs (prof)", defauts: erreurs.slice(0, 3), png: await page.screenshot()});
    await contexte.close();
  }
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const verdicts = [];
  let echec = null;
  try {
    for (const moteur of MOTEURS) {
      let navigateur;
      try {
        navigateur = await playwright[moteur].launch(moteur === "chromium" && process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
      } catch (e) {
        throw new Error(`${moteur} ne démarre pas. À installer une fois : PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install ${moteur}\n${e.message.split("\n")[0]}`);
      }
      try {
        for (const taille of TAILLES.filter(t => tailleDans(t, moteur))) {
          for (const code of ETAPES) {
            const carnet = new Carnet(moteur, taille, code);
            try {
              if (code === "commun") await jouerCommun(navigateur, base, taille, carnet);
              else await jouerEtape(navigateur, base, taille, code, carnet);
            } catch (e) {
              carnet.ecrans.push({nom: "Le robot s'est arrêté", defauts: [String(e.message || e).split("\n")[0]], png: Buffer.alloc(0)});
            }
            await planche(navigateur, carnet);
            carnet.ecrans.forEach(e => verdicts.push({moteur, taille: taille.nom, etape: code, ecran: e.nom, defauts: e.defauts}));
            const ko = carnet.ecrans.filter(e => e.defauts.length);
            console.log(`${ko.length ? "✗" : "✓"} ${moteur} ${taille.nom} ${code} : ${carnet.ecrans.length} écrans${ko.length ? `, ${ko.length} avec défaut` : ""}`);
            ko.forEach(e => console.log(`    ${e.nom} : ${e.defauts.join(" ; ")}`));
          }
        }
      } finally {
        await navigateur.close();
      }
    }
  } catch (e) {
    echec = e;
  } finally {
    serveur.close();
  }
  if (PLANCHES) {
    fs.mkdirSync(PLANCHES, {recursive: true});
    fs.writeFileSync(path.join(PLANCHES, "verdicts.json"), JSON.stringify(verdicts, null, 1));
  }
  const mauvais = verdicts.filter(v => v.defauts.length);
  if (echec) { console.error(echec.message || echec); process.exitCode = 1; }
  else if (mauvais.length) { console.error(`Défi conversions : ${mauvais.length} écran(s) avec un défaut sur ${verdicts.length}.`); process.exitCode = 1; }
  else console.log(`Défi conversions : ${verdicts.length} écrans, tous adaptés.`);
})();
