// Le code d'un élève en SIX CASES — un seul dessin pour toutes les pages qui
// le demandent (lot « code en cases », novembre 2026) : l'entrée de Mon espace
// (suivi.mathsgo.re) et la question « C'est toujours toi ? » des applis
// suivies (Défi tables, Défi calcul, SPLAT!, Coffres magiques, Flash Anzan) et
// de Mon espace.
//
// Une seule vraie case de saisie, invisible, posée sur six cases dessinées :
// le clavier, effacer et la touche « OK » restent ceux d'une case normale.
// L'élève voit qu'il faut six caractères, combien il en reste, et compare case
// par case avec sa bandelette.
//
// Ce que le module ajoute à l'entrée de Mon espace d'avant (05/10/2026) : une
// lettre se CORRIGE sans tout effacer (remarque de Gwenaël du 08/11/2026).
// Toucher une case pleine la sélectionne (bordure bleue) ; la lettre tapée
// ensuite la remplace et la case pleine suivante devient la case active ; au
// bout, on repasse en écriture normale. ⌫ efface depuis le bout, comme avant.
// Au clavier d'ordinateur, ← et → déplacent la case active.
//
// La protection de l'iPhone est GARDÉE : le curseur du navigateur reste
// toujours au bout de la case invisible (loupe, barre d'espace glissée,
// double-tap, flèches), sinon la lettre suivante entrerait au milieu du code.
// C'est la case active du module qui dit où va la lettre, jamais le curseur.
//
// Le module ne sait rien du serveur ni des codes valides : la page lui donne
// sa règle de nettoyage (l'alphabet des codes vit dans les moteurs). Il ne
// stocke rien.
//
// Une COPIE octet pour octet est servie par le serveur de suivi
// (_serveur/public/code-en-cases.js) : la politique de contenu de Mon espace
// n'accepte que ses propres scripts. tests/code-en-cases.test.mjs vérifie que
// les deux fichiers sont identiques.
(function (racine) {
  "use strict";

  const LONGUEUR = 6;
  const ID_STYLE = "code-en-cases-style";

  // Les tailles et couleurs passent par des variables : chaque page garde son
  // dessin (Mon espace : 62 px de haut, sa charte) sans réécrire le module.
  const STYLE = [
    ".cec{position:relative;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:var(--cec-ecart,7px);",
    "width:100%;max-width:var(--cec-max,330px);margin:0 auto;box-sizing:border-box}",
    ".cec-case{box-sizing:border-box;min-width:0;height:var(--cec-hauteur,56px);display:grid;place-items:center;",
    "background:#fff;border:2px solid var(--cec-ligne,#d9e2ec);border-radius:12px;",
    "font-family:inherit;font-size:var(--cec-police,1.6rem);font-weight:800;line-height:1;color:var(--cec-encre,#052f67)}",
    ".cec-case.pleine{border-color:#b8c7da;background:#f5f8fc}",
    ".cec.actif .cec-case.active{border-color:var(--cec-bleu,#0b67b2);box-shadow:0 0 0 3px rgba(11,103,178,.22)}",
    // Une case pleine choisie pour être corrigée : la même bordure bleue, et un
    // fond bleu très pâle (le texte reste foncé : lisible imprimé ou projeté).
    ".cec.actif .cec-case.active.pleine{background:#e6f0fa}",
    ".cec.actif .cec-case.active:empty::after{content:\"\";width:2px;height:45%;background:var(--cec-bleu,#0b67b2);",
    "animation:cec-clignote 1s steps(1) infinite}",
    "@keyframes cec-clignote{50%{opacity:0}}",
    // La vraie case de saisie : posée sur les six, invisible. 16 px pour que
    // l'iPhone ne zoome pas sur la page en la touchant.
    ".cec .cec-champ{position:absolute;inset:0;width:100%;height:100%;min-width:0;min-height:0;max-width:none;",
    "margin:0;padding:0;border:0;outline:0;box-shadow:none;background:transparent;opacity:0;",
    "font-size:16px;letter-spacing:0;color:transparent;caret-color:transparent;cursor:pointer}",
    "@media (max-width:360px){.cec{gap:var(--cec-ecart-etroit,5px)}",
    ".cec-case{height:var(--cec-hauteur-etroite,50px);font-size:var(--cec-police-etroite,1.4rem)}}",
    // La carte « C'est toujours toi ? » (lot « toujours toi », 11/11/2026,
    // planches validées par Gwenaël) : une petite copie de l'écran d'entrée de
    // Mon espace — le titre, une ligne, puis le même cadre blanc avec les six
    // cases et « Entrer » ; « Non, ce n'est pas moi » en lien dessous. Le même
    // dessin dans Mon espace et dans toutes les applis : chaque page ne garde
    // que son voile (position, z-index) et la police de son titre.
    ".cec-garde{box-sizing:border-box;width:100%;max-width:440px;padding:24px 20px 12px;background:#f6f8fb;",
    "border-radius:18px;box-shadow:0 20px 50px rgba(16,41,74,.28);text-align:center;color:var(--cec-encre,#052f67)}",
    ".cec-garde .cec-garde-titre{margin:0 0 6px;font-size:1.5rem;font-weight:800;line-height:1.2;color:var(--cec-encre,#052f67)}",
    // La consigne et « Ce n'est pas le bon code. » occupent la MÊME ligne :
    // l'erreur prend la place de la consigne, rien ne bouge. L'erreur est
    // écrite avant la consigne (sélecteur « + », sans :has).
    ".cec-garde .cec-garde-ligne{display:grid;margin:0 0 14px;font-size:.95rem;line-height:1.35}",
    ".cec-garde .cec-garde-ligne>*{grid-area:1/1;margin:0}",
    ".cec-garde .cec-garde-consigne{color:#5c6c82}",
    // L'étiquette du champ, pour le lecteur d'écran seulement (les six cases
    // disent déjà ce qu'il faut taper).
    ".cec-garde .cec-garde-lecteur{position:absolute;width:1px;height:1px;margin:0;padding:0;overflow:hidden;",
    "clip:rect(0 0 0 0);white-space:nowrap;border:0}",
    ".cec-garde .cec-garde-erreur{color:#b42318;font-weight:700}",
    ".cec-garde .cec-garde-erreur[hidden]{display:block!important;visibility:hidden}",
    ".cec-garde .cec-garde-erreur:not([hidden])+.cec-garde-consigne{visibility:hidden}",
    // Le cadre de l'écran d'entrée (la carte de Mon espace) et ses cases.
    ".cec-garde .cec-garde-cadre{box-sizing:border-box;margin:0;padding:22px 18px;background:#fff;",
    "border:1px solid #d9e2ec;border-radius:14px;box-shadow:0 10px 26px rgba(22,47,82,.06)}",
    ".cec-garde .cec{--cec-max:372px;--cec-ecart:8px;--cec-hauteur:62px;--cec-police:1.75rem;",
    "--cec-ecart-etroit:5px;--cec-hauteur-etroite:56px;--cec-police-etroite:1.45rem}",
    // « Entrer » : le bouton de l'écran d'entrée (charte du suivi) — toute la
    // largeur au téléphone, centré et de largeur moyenne sur un grand écran.
    ".cec-garde .cec-garde-entrer{box-sizing:border-box;display:flex;align-items:center;justify-content:center;",
    "width:100%;min-height:44px;margin:16px 0 0;padding:0 18px;font-family:inherit;font-size:16px;font-weight:700;",
    "line-height:1.2;letter-spacing:normal;text-transform:none;color:#fff;background:#063f86;border:2px solid #063f86;",
    "border-radius:10px;box-shadow:none;transform:none;cursor:pointer}",
    "@media (hover:hover){.cec-garde .cec-garde-entrer:hover{background:#052f67;border-color:#052f67;color:#fff}",
    ".cec-garde .cec-garde-non:hover{background:none;color:#052f67}}",
    ".cec-garde .cec-garde-entrer:focus-visible,.cec-garde .cec-garde-non:focus-visible{outline:3px solid rgba(11,103,178,.45);outline-offset:2px}",
    ".cec-garde .cec-garde-non{display:inline-flex;align-items:center;justify-content:center;min-height:44px;",
    "margin:8px auto 0;padding:0 12px;font-family:inherit;font-size:.95rem;font-weight:700;line-height:1.2;",
    "letter-spacing:normal;text-transform:none;color:#063f86;background:none;border:0;border-radius:8px;",
    "box-shadow:none;transform:none;text-decoration:underline;text-underline-offset:3px;cursor:pointer}",
    "@media (min-width:600px){.cec-garde .cec-garde-entrer{width:auto;min-width:240px;margin:16px auto 0}}",
    "@media (max-width:360px){.cec-garde{padding:20px 12px 10px}.cec-garde .cec-garde-titre{font-size:1.3rem}.cec-garde .cec-garde-cadre{padding:16px 12px}}"
  ].join("");

  function nettoyerParDefaut(brut) {
    return String(brut || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  // ------------------------------------------------------------ la saisie
  //
  // Ce que devient le code après une saisie, sans aucun DOM (c'est ce que les
  // tests exécutent). `ancien` : le code tel qu'il était (propre) ; `brut` : ce
  // que la case invisible contient maintenant ; `selection` : la case pleine
  // choisie pour être corrigée, ou -1 (on écrit au bout). Le curseur étant
  // toujours au bout, une frappe AJOUTE au bout et ⌫ RETIRE au bout.
  //  — ajout de 6 caractères utiles ou plus d'un coup (un collage, le
  //    remplissage automatique) : c'est un code entier, il remplace tout ;
  //  — ajout avec une case choisie : chaque lettre remplace la case choisie,
  //    puis la case pleine suivante est choisie ; au bout, écriture normale ;
  //  — ajout sans case choisie : au bout, jamais plus de six ;
  //  — retrait au bout : on efface, la case choisie est oubliée ;
  //  — tout autre changement (le navigateur a tout remplacé) : on garde ce
  //    qu'il dit, nettoyé, borné à six.
  function saisir(ancien, brut, selection, nettoyer) {
    const propre = typeof nettoyer === "function" ? nettoyer : nettoyerParDefaut;
    const avant = String(ancien || "");
    const texte = String(brut === undefined || brut === null ? "" : brut);
    if (texte.length > avant.length && texte.slice(0, avant.length) === avant) {
      const ajout = propre(texte.slice(avant.length));
      if (!ajout) return {valeur: avant, selection};
      if (ajout.length >= LONGUEUR) return {valeur: ajout.slice(0, LONGUEUR), selection: -1};
      const cases = avant.split("");
      let choisie = Number.isInteger(selection) && selection >= 0 && selection < cases.length ? selection : -1;
      for (const lettre of ajout) {
        if (choisie >= 0) {
          cases[choisie] = lettre;
          choisie = choisie + 1 < cases.length ? choisie + 1 : -1;
        } else if (cases.length < LONGUEUR) {
          cases.push(lettre);
        }
      }
      return {valeur: cases.join(""), selection: choisie};
    }
    if (texte.length < avant.length && avant.slice(0, texte.length) === texte) {
      return {valeur: propre(texte).slice(0, LONGUEUR), selection: -1};
    }
    return {valeur: propre(texte).slice(0, LONGUEUR), selection: -1};
  }

  // La case active : celle qu'on corrige, sinon la prochaine vide, sinon
  // aucune (les six sont pleines : le geste suivant, c'est valider).
  function caseActive(valeur, selection) {
    const longueur = String(valeur || "").length;
    if (Number.isInteger(selection) && selection >= 0 && selection < longueur) return selection;
    return longueur < LONGUEUR ? longueur : -1;
  }

  // Les touches de déplacement, au clavier d'ordinateur. Rend la nouvelle
  // case choisie (-1 : écriture au bout), ou null si la touche ne déplace rien.
  function deplacer(selection, longueur, touche) {
    const active = Number.isInteger(selection) && selection >= 0 && selection < longueur ? selection : -1;
    if (touche === "ArrowLeft") {
      if (longueur === 0) return -1;
      return active === -1 ? longueur - 1 : Math.max(0, active - 1);
    }
    if (touche === "ArrowRight") {
      if (active === -1) return -1;
      return active + 1 < longueur ? active + 1 : -1;
    }
    if (touche === "Home" || touche === "ArrowUp") return longueur > 0 ? 0 : -1;
    if (touche === "End" || touche === "ArrowDown") return -1;
    return null;
  }

  // ---------------------------------------------------------------- le DOM

  function poserStyle(doc) {
    if (!doc || typeof doc.createElement !== "function") return;
    if (typeof doc.getElementById === "function" && doc.getElementById(ID_STYLE)) return;
    const style = doc.createElement("style");
    style.id = ID_STYLE;
    style.textContent = STYLE;
    const parent = doc.head || doc.documentElement || doc.body;
    if (parent) parent.appendChild(style);
  }

  // Pose les six cases autour d'un <input> existant (ou reprend celles que la
  // page a déjà écrites autour de lui : Mon espace les écrit dans son HTML,
  // pour qu'elles soient là dès le premier dessin). Rend {dessiner, vider,
  // valeur, choisir}.
  //  — dessiner() : relit la case (la page vient d'y écrire) et redessine ;
  //  — vider() : efface le code et la case choisie ;
  //  — valeur() : le code propre ;
  //  — choisir(i) : choisit la case i (les tests ; le doigt passe par le clic).
  function monter(champ, options) {
    if (!champ) return null;
    if (champ.__codeEnCases) return champ.__codeEnCases;
    const o = options || {};
    const nettoyer = typeof o.nettoyer === "function" ? o.nettoyer : nettoyerParDefaut;
    const doc = champ.ownerDocument || (typeof document !== "undefined" ? document : null);
    poserStyle(doc);

    let boite = champ.parentNode;
    if (!boite || !boite.classList || !boite.classList.contains("cec")) {
      const nouvelle = doc.createElement("div");
      nouvelle.className = "cec";
      champ.parentNode.insertBefore(nouvelle, champ);
      nouvelle.appendChild(champ);
      boite = nouvelle;
    }
    let cases = Array.from(boite.querySelectorAll(".cec-case"));
    if (cases.length !== LONGUEUR) {
      cases.forEach(c => c.remove());
      cases = [];
      for (let i = 0; i < LONGUEUR; i += 1) {
        const c = doc.createElement("span");
        c.className = "cec-case";
        c.setAttribute("aria-hidden", "true");
        boite.appendChild(c);
        cases.push(c);
      }
    }
    champ.classList.add("cec-champ");
    // La limite de six est tenue ici, pas par le navigateur : avec un code
    // plein, la lettre qui CORRIGE une case doit pouvoir entrer (maxlength=6
    // la refusait), et un collage avec des espaces est nettoyé avant d'être
    // borné (maxlength le coupait avant).
    champ.removeAttribute("maxlength");
    champ.removeAttribute("size");

    let valeur = nettoyer(champ.value).slice(0, LONGUEUR);
    let selection = -1;
    if (champ.value !== valeur) champ.value = valeur;

    function curseurAuBout() {
      const fin = champ.value.length;
      try { champ.setSelectionRange(fin, fin); } catch (_) {}
    }

    function dessinerCases() {
      const active = caseActive(valeur, selection);
      cases.forEach((carre, i) => {
        carre.textContent = valeur[i] || "";
        carre.classList.toggle("pleine", i < valeur.length);
        carre.classList.toggle("active", i === active);
      });
    }

    function dessiner() {
      const lue = nettoyer(champ.value).slice(0, LONGUEUR);
      if (lue !== valeur) selection = -1;
      valeur = lue;
      if (champ.value !== valeur) champ.value = valeur;
      if (selection >= valeur.length) selection = -1;
      dessinerCases();
    }

    function vider() {
      champ.value = "";
      valeur = "";
      selection = -1;
      dessinerCases();
    }

    function choisir(indice) {
      selection = Number.isInteger(indice) && indice >= 0 && indice < valeur.length ? indice : -1;
      dessinerCases();
      curseurAuBout();
    }

    // Quelle case est sous le doigt : la case invisible couvre les six, c'est
    // elle qui reçoit le toucher ; on regarde où il est tombé.
    function caseSous(x) {
      for (let i = 0; i < cases.length; i += 1) {
        const r = cases[i].getBoundingClientRect();
        if (x >= r.left - 4 && x <= r.right + 4) return i;
      }
      return -1;
    }

    champ.addEventListener("input", () => {
      const resultat = saisir(valeur, champ.value, selection, nettoyer);
      valeur = resultat.valeur;
      selection = resultat.selection;
      if (champ.value !== valeur) champ.value = valeur;
      curseurAuBout();
      dessinerCases();
    });
    champ.addEventListener("focus", () => {
      boite.classList.add("actif");
      dessinerCases();
      curseurAuBout();
      // iOS place le curseur APRÈS l'événement « focus » : on repasse derrière.
      setTimeout(curseurAuBout, 0);
    });
    champ.addEventListener("blur", () => {
      boite.classList.remove("actif");
      selection = -1;
      dessinerCases();
    });
    champ.addEventListener("click", evenement => {
      const i = evenement && typeof evenement.clientX === "number" ? caseSous(evenement.clientX) : -1;
      selection = i >= 0 && i < valeur.length ? i : -1;
      dessinerCases();
      curseurAuBout();
    });
    champ.addEventListener("keydown", evenement => {
      const nouvelle = deplacer(selection, valeur.length, evenement.key);
      if (nouvelle === null) return;
      evenement.preventDefault();
      selection = nouvelle;
      dessinerCases();
      curseurAuBout();
    });
    // L'iPhone déplace aussi le curseur sans clic ni touche : appui long (la
    // loupe), barre d'espace glissée, double-tap qui sélectionne tout le code.
    // Le navigateur ne le dit que par « selectionchange » : on le ramène au
    // bout, sinon la lettre suivante entrerait au début ou remplacerait tout.
    if (doc && typeof doc.addEventListener === "function") {
      doc.addEventListener("selectionchange", () => {
        if (doc.activeElement !== champ) return;
        const fin = champ.value.length;
        if (champ.selectionStart !== fin || champ.selectionEnd !== fin) curseurAuBout();
      });
    }

    dessinerCases();
    const api = {dessiner, vider, choisir, valeur: () => valeur, get selection() { return selection; }};
    champ.__codeEnCases = api;
    return api;
  }

  const module_ = {LONGUEUR, ID_STYLE, STYLE, saisir, caseActive, deplacer, poserStyle, monter, nettoyerParDefaut};
  if (typeof module === "object" && module && module.exports) module.exports = module_;
  else racine.MathsGoCodeEnCases = module_;
  // Chargé dans <head> : le style est posé avant que les cases n'apparaissent.
  if (typeof document !== "undefined" && document && typeof module !== "object") {
    try { poserStyle(document); } catch (_) {}
  }
})(typeof globalThis === "object" ? globalThis : this);
