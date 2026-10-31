// Défi calcul — les aides visuelles (lot 1a, 03/10/2026 ; lot 1b le même jour).
//
//  - perles100 : le rekenrek de 100 perles de Défi tables (« Je pousse les
//    perles »), copié puis adapté. Même géométrie, mêmes gestes au doigt ;
//    le geste attendu devient une LISTE D'ÉTAPES : + 10 = une rangée entière
//    d'un coup, + N = N perles d'un coup sur la rangée entamée, − N = N
//    perles retirées d'un coup de la rangée entamée. Pousser une par une est
//    refusé : compter de un en un est ce que le boulier doit faire quitter.
//  - droiteSauts : la droite à sauts (SVG). Positions proportionnelles
//    bornées (un petit saut garde une largeur lisible), étiquettes dans des
//    pilules, le saut direct dessous, le saut oublié en gras.
//  - glisseNombres : le « Glisse-nombre » d'Automatismes
//    (auto/scripts/shared/visuals/numbers/place-value-table.js), COPIÉ et
//    non partagé : colonnes au choix (des centaines de mille aux unités pour
//    M2, des milliers aux millièmes pour D2), un événement « decalage »
//    quand la bande s'arrête, aucun zéro écrit à la place de l'élève (une
//    case vide est le zéro à écrire). Les chiffres glissent ; la virgule,
//    fixe, ne bouge jamais.
//  - tableauFleches : le tableau de numération fixe à flèches (SVG) de la
//    planche 4 : le nombre en haut, l'arrivée en bas, une flèche par chiffre.
//
// Les aides qu'on touche (rekenrek, glisse-nombres) se jouent aussi au
// clavier, et leurs refus sont lus par un lecteur d'écran.
(function initDefiCalculAides(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_CALCUL_AIDES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // ---------------------------------------------------------------- le rekenrek

  const PERLES = Object.freeze({
    rangees: 10, parRangee: 10,
    montant: .45, hauteurRangee: 1.49, largeurCadre: 20.9, hauteurCadre: 14.9,
    maxi: 55, mini: 14,
    ecart: 10, ecartSerre: 5, perleAuDoigt: 22
  });

  // Les trois refus de Défi tables. Ils ne disent que la direction, jamais
  // le nombre.
  const MESSAGES_REFUS = Object.freeze({
    rangee: "Finis la rangée d’abord\u00a0!",
    trop: "Trop de perles\u00a0!",
    peu: "Pas assez de perles\u00a0!"
  });

  // Une zone lue par un lecteur d'écran, invisible : les refus, et ce que
  // le clavier vient de choisir. Le même texte deux fois de suite est relu.
  function zoneAnnonce() {
    const zone = document.createElement("p");
    zone.className = "sr-only dc-annonce";
    zone.setAttribute("aria-live", "assertive");
    zone.setAttribute("aria-atomic", "true");
    let minuteur = 0;
    zone.annoncer = texte => {
      clearTimeout(minuteur);
      zone.textContent = "";
      minuteur = setTimeout(() => { zone.textContent = texte; }, 40);
    };
    zone.arreter = () => clearTimeout(minuteur);
    return zone;
  }
  let compteurAides = 0;
  const accorder = (nombre, singulier, pluriel) => `${nombre} ${nombre > 1 ? pluriel : singulier}`;

  // Les perles poussées au départ : des rangées pleines, puis la rangée
  // entamée.
  function etatsDe(depart) {
    return Array.from({length: PERLES.rangees}, (_, r) => Math.max(0, Math.min(PERLES.parRangee, depart - r * PERLES.parRangee)));
  }

  const rangeeEntamee = etats => etats.findIndex(valeur => valeur > 0 && valeur < PERLES.parRangee);

  // Le geste attendu, et le seul accepté :
  //  + 10 : une rangée entière, d'un coup, sur la première rangée vide ;
  //  + N  : N perles d'un coup sur la rangée entamée (sinon la première vide) ;
  //  − N  : N perles retirées d'un coup de la rangée entamée.
  function gesteAttendu(etats, geste) {
    if (geste >= PERLES.parRangee) {
      const vide = etats.findIndex(valeur => valeur === 0);
      return {rangees: vide >= 0 ? [vide] : [], ecart: PERLES.parRangee};
    }
    const entamee = rangeeEntamee(etats);
    if (geste > 0) {
      const rangee = entamee >= 0 ? entamee : etats.findIndex(valeur => valeur === 0);
      return {rangees: rangee >= 0 ? [rangee] : [], ecart: geste};
    }
    return {rangees: entamee >= 0 ? [entamee] : [], ecart: geste};
  }

  // null si le geste est le bon, sinon le motif du refus : « rangee »,
  // « trop », « peu » (avec leur phrase), ou « ailleurs » (les perles
  // reviennent, la consigne tremble, sans phrase).
  function verifierGeste(etats, geste, rangee, ecart) {
    if (!ecart) return null;
    const attendu = gesteAttendu(etats, geste);
    if (geste > 0) {
      if (ecart < 0) return {motif: "ailleurs"};
      // Une rangée entière attendue, le geste est fait ailleurs (finir la
      // rangée entamée, une rangée plus bas) : sans phrase.
      if (!attendu.rangees.includes(rangee)) return {motif: geste >= PERLES.parRangee ? "ailleurs" : "rangee"};
      if (ecart > attendu.ecart) return {motif: "trop"};
      if (ecart < attendu.ecart) return {motif: "peu"};
      return null;
    }
    if (ecart > 0) return {motif: "trop"};
    if (!attendu.rangees.includes(rangee)) return {motif: "ailleurs"};
    if (ecart < attendu.ecart) return {motif: "trop"};
    if (ecart > attendu.ecart) return {motif: "peu"};
    return null;
  }

  // Le rekenrek dans `zone`. options : {depart, gestes, consigne, traces,
  // surFini}. Rend {detruire, mesurer, deborde, fini}.
  //
  // Au clavier, le même geste qu'au doigt : ↑ ↓ choisissent la rangée,
  // ← → la perle (celle que le doigt attraperait), Entrée la fait glisser
  // avec ses voisines. Un cadre bleu montre la rangée et la perle, seulement
  // quand on joue au clavier.
  function perles100(zone, options) {
    const {depart, gestes, consigne: texteConsigne, traces = [], surFini = null} = options;
    const boulier = {
      taille: 0, ecart: PERLES.ecart, etats: etatsDe(depart), etape: 0, finie: false,
      drag: null, dom: null, observer: null, refus: 0, curseur: null
    };
    compteurAides += 1;

    const bloc = document.createElement("div");
    bloc.className = "perles-zone";
    const consigne = document.createElement("p");
    consigne.className = "consigne perles-consigne";
    consigne.id = `dc-consigne-${compteurAides}`;
    consigne.textContent = texteConsigne;
    const annonce = zoneAnnonce();
    const scene = document.createElement("div");
    scene.className = "perles-scene";
    const cadre = document.createElement("div");
    cadre.className = "perles-cadre";
    const montants = ["gauche", "droite"].map(cote => {
      const montant = document.createElement("span");
      montant.className = `perles-montant ${cote}`;
      return montant;
    });
    const interieur = document.createElement("div");
    interieur.className = "perles-interieur";
    interieur.setAttribute("role", "application");
    interieur.setAttribute("aria-roledescription", "boulier");
    interieur.setAttribute("aria-label", "Boulier de 100 perles. Flèches pour choisir la rangée et la perle, Entrée pour la faire glisser.");
    interieur.setAttribute("aria-describedby", consigne.id);
    interieur.tabIndex = 0;
    const rangees = [];
    for (let r = 0; r < PERLES.rangees; r += 1) {
      const rangee = document.createElement("div");
      rangee.className = "perles-rangee";
      const tige = document.createElement("span");
      tige.className = "perles-tige";
      rangee.append(tige);
      const liste = [];
      for (let i = 0; i < PERLES.parRangee; i += 1) {
        const perle = document.createElement("span");
        // Rouges et blanches par paquets de 5, damier inversé à partir de la
        // 6e rangée : l'œil compte cinq puis cinq.
        const rouge = r < 5 ? i < 5 : i >= 5;
        perle.className = `perle ${rouge ? "rouge" : "blanche"}`;
        rangee.append(perle);
        liste.push(perle);
      }
      interieur.append(rangee);
      rangees.push({element: rangee, perles: liste});
    }
    cadre.append(montants[0], montants[1], interieur);
    scene.append(cadre);
    const trace = document.createElement("p");
    trace.className = "dc-trace";
    trace.setAttribute("role", "status");
    trace.setAttribute("aria-live", "polite");
    bloc.append(consigne, scene, trace, annonce);
    zone.replaceChildren(bloc);
    boulier.dom = {scene, cadre, interieur, montants, rangees};

    // Où se trouve la perle d'indice i : poussée à gauche, ou au repos à
    // droite ; le vide entre les deux groupes garde toujours la même largeur.
    const positionPerle = (index, poussee) => (poussee ? index : boulier.ecart + index) * boulier.taille;

    function dessiner(animer) {
      if (!boulier.taille) return;
      const taille = boulier.taille;
      const montant = Math.max(4, Math.round(taille * PERLES.montant));
      const hauteurRangee = Math.round(taille * PERLES.hauteurRangee);
      const largeur = taille * (PERLES.parRangee + boulier.ecart);
      cadre.style.width = `${largeur + montant * 2}px`;
      cadre.style.height = `${hauteurRangee * PERLES.rangees}px`;
      interieur.style.width = `${largeur}px`;
      interieur.style.height = `${hauteurRangee * PERLES.rangees}px`;
      interieur.style.marginLeft = `${montant}px`;
      montants.forEach(element => { element.style.width = `${montant}px`; });
      rangees.forEach((rangee, r) => {
        rangee.element.style.height = `${hauteurRangee}px`;
        rangee.perles.forEach((perle, i) => {
          perle.style.width = `${taille}px`;
          perle.style.height = `${taille}px`;
          perle.style.transition = animer ? "left .18s ease-out" : "none";
          perle.style.left = `${positionPerle(i, i < boulier.etats[r])}px`;
        });
      });
    }

    // La géométrie est RECALCULÉE pour chaque écran, pas zoomée : perle =
    // min(largeur / 20,9 ; hauteur / 14,9 ; 55 px), jamais moins de 14. Sous
    // 22 px (téléphone), le vide se resserre à 5 perles si la perle y gagne.
    function mesurer() {
      const largeur = scene.clientWidth || zone.clientWidth || 320;
      let hauteur = scene.clientHeight;
      if (!(hauteur > 120)) hauteur = Math.round(window.innerHeight * .45);
      const taillePour = largeurCadre => Math.max(PERLES.mini, Math.floor(Math.min(
        largeur / largeurCadre, hauteur / PERLES.hauteurCadre, PERLES.maxi)));
      let ecart = PERLES.ecart;
      let taille = taillePour(PERLES.largeurCadre);
      const tailleSerree = taillePour(PERLES.largeurCadre - PERLES.ecart + PERLES.ecartSerre);
      if (taille < PERLES.perleAuDoigt && tailleSerree > taille) {
        ecart = PERLES.ecartSerre;
        taille = tailleSerree;
      }
      if (taille === boulier.taille && ecart === boulier.ecart) return;
      boulier.taille = taille;
      boulier.ecart = ecart;
      dessiner(false);
    }

    function ecrireTraces() {
      const lignes = [];
      for (const ligne of traces) {
        const faite = boulier.etape >= ligne.apres;
        const b = document.createElement("b");
        b.className = faite ? "ok" : "ici";
        b.textContent = faite ? ligne.texte : ligne.attente;
        lignes.push(b);
        if (!faite) break;
      }
      trace.replaceChildren(...lignes);
    }

    function leverRefus() {
      clearTimeout(boulier.refus);
      boulier.refus = 0;
      if (!consigne.classList.contains("est-refus")) return;
      consigne.textContent = texteConsigne;
      consigne.classList.remove("est-refus");
    }

    function refuser(refus) {
      clearTimeout(boulier.refus);
      consigne.textContent = MESSAGES_REFUS[refus.motif] || texteConsigne;
      // Le refus sans phrase relit la consigne.
      annonce.annoncer(consigne.textContent);
      // Le tremblement rejoue à chaque refus, même enchaîné.
      consigne.classList.remove("est-refus");
      void consigne.offsetWidth;
      consigne.classList.add("est-refus");
      boulier.refus = setTimeout(leverRefus, 1800);
    }

    function pointerDown(event) {
      if (boulier.finie) return;
      const rect = interieur.getBoundingClientRect();
      const hauteurRangee = rect.height / PERLES.rangees;
      const rangee = Math.min(PERLES.rangees - 1, Math.max(0, Math.floor((event.clientY - rect.top) / hauteurRangee)));
      // L'échelle de la page (zoom du cadre) : le doigt est en pixels
      // d'écran, les perles en pixels du boulier.
      const zoom = rect.width / interieur.offsetWidth || 1;
      const x = (event.clientX - rect.left) / zoom;
      // La perle la plus proche du doigt : on attrape la rangée, pas une
      // cible de 44 px.
      let index = 0;
      let meilleure = Infinity;
      for (let i = 0; i < PERLES.parRangee; i += 1) {
        const centre = positionPerle(i, i < boulier.etats[rangee]) + boulier.taille / 2;
        const distance = Math.abs(centre - x);
        if (distance < meilleure) { meilleure = distance; index = i; }
      }
      boulier.drag = {rangee, index, zoom, depart: event.clientX, position: positionPerle(index, index < boulier.etats[rangee])};
      if (interieur.setPointerCapture) { try { interieur.setPointerCapture(event.pointerId); } catch (_) {} }
      event.preventDefault();
    }

    function pointerMove(event) {
      const drag = boulier.drag;
      if (!drag) return;
      const etat = boulier.etats[drag.rangee];
      const pousse = drag.index >= etat;
      const premiere = pousse ? etat : drag.index;
      const derniere = pousse ? drag.index : etat - 1;
      const ecart = (event.clientX - drag.depart) / drag.zoom;
      const rangee = rangees[drag.rangee];
      for (let i = premiere; i <= derniere; i += 1) {
        const origine = positionPerle(i, !pousse);
        const gauche = Math.max(positionPerle(i, true), Math.min(positionPerle(i, false), origine + ecart));
        rangee.perles[i].style.transition = "none";
        rangee.perles[i].style.left = `${gauche}px`;
        if (i === drag.index) drag.position = gauche;
      }
    }

    // Un geste fini (au doigt ou au clavier) : la rangée passe de son état
    // à `nouvel` perles poussées, si c'est le geste attendu.
    function jouer(numero, nouvel) {
      const ecart = nouvel - boulier.etats[numero];
      const refus = verifierGeste(boulier.etats, gestes[boulier.etape], numero, ecart);
      if (refus) {
        dessiner(true);
        refuser(refus);
        return;
      }
      boulier.etats[numero] = nouvel;
      dessiner(true);
      if (!ecart) return;
      leverRefus();
      boulier.etape += 1;
      ecrireTraces();
      if (boulier.etape >= gestes.length) {
        boulier.finie = true;
        bloc.classList.add("est-finie");
        if (typeof surFini === "function") surFini();
      }
    }

    function pointerUp() {
      const drag = boulier.drag;
      if (!drag) return;
      boulier.drag = null;
      const etat = boulier.etats[drag.rangee];
      const pousse = drag.index >= etat;
      // Tout ou rien, à une perle près : un groupe qui n'est pas arrivé
      // revient d'où il vient.
      const tolerance = boulier.taille;
      let nouvel = etat;
      if (pousse && drag.position <= positionPerle(drag.index, true) + tolerance) nouvel = drag.index + 1;
      if (!pousse && drag.position >= positionPerle(drag.index, false) - tolerance) nouvel = drag.index;
      jouer(drag.rangee, nouvel);
    }

    // ---- au clavier
    function montrerCurseur() {
      rangees.forEach((rangee, r) => {
        rangee.element.classList.toggle("curseur", Boolean(boulier.curseur) && boulier.curseur.rangee === r);
        rangee.perles.forEach((perle, i) => perle.classList.toggle("curseur", Boolean(boulier.curseur) && boulier.curseur.rangee === r && boulier.curseur.index === i));
      });
    }
    function annoncerCurseur() {
      const {rangee, index} = boulier.curseur;
      const etat = boulier.etats[rangee];
      const poussees = etat ? accorder(etat, "perle poussée", "perles poussées") : "aucune perle poussée";
      annonce.annoncer(`Rangée ${rangee + 1}\u00a0: ${poussees}. Perle ${index + 1}.`);
    }
    // Le curseur part de la rangée entamée (sinon la première qui n'est pas
    // pleine), sur la première perle au repos.
    function placerCurseur() {
      if (boulier.curseur) return;
      let rangee = rangeeEntamee(boulier.etats);
      if (rangee < 0) rangee = boulier.etats.findIndex(valeur => valeur < PERLES.parRangee);
      if (rangee < 0) rangee = PERLES.rangees - 1;
      boulier.curseur = {rangee, index: Math.min(PERLES.parRangee - 1, boulier.etats[rangee])};
    }
    function toucheClavier(event) {
      if (boulier.finie) return;
      const fleches = {ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1]};
      if (fleches[event.key]) {
        const nouveau = !boulier.curseur;
        placerCurseur();
        if (!nouveau) {
          const [dr, di] = fleches[event.key];
          boulier.curseur.rangee = Math.max(0, Math.min(PERLES.rangees - 1, boulier.curseur.rangee + dr));
          boulier.curseur.index = Math.max(0, Math.min(PERLES.parRangee - 1, boulier.curseur.index + di));
        }
        montrerCurseur();
        annoncerCurseur();
      } else if (event.key === "Enter" || event.key === " ") {
        if (event.repeat) { event.preventDefault(); event.stopPropagation(); return; }
        placerCurseur();
        const {rangee, index} = boulier.curseur;
        // Comme le doigt qui attrape la perle `index` et va au bout : au
        // repos, elle est poussée avec celles d'avant ; poussée, elle est
        // retirée avec celles d'après.
        jouer(rangee, index >= boulier.etats[rangee] ? index + 1 : index);
        montrerCurseur();
      } else return;
      event.preventDefault();
      // Entrée est à lui tant que le geste n'est pas fait (sinon « Suivant »).
      event.stopPropagation();
    }

    interieur.addEventListener("pointerdown", pointerDown);
    interieur.addEventListener("pointermove", pointerMove);
    interieur.addEventListener("pointerup", pointerUp);
    interieur.addEventListener("pointercancel", pointerUp);
    interieur.addEventListener("keydown", toucheClavier);
    interieur.addEventListener("focus", () => { placerCurseur(); montrerCurseur(); });
    if (typeof ResizeObserver === "function") {
      boulier.observer = new ResizeObserver(() => mesurer());
      boulier.observer.observe(scene);
    }
    ecrireTraces();
    mesurer();

    return {
      detruire() {
        clearTimeout(boulier.refus);
        annonce.arreter();
        if (boulier.observer) boulier.observer.disconnect();
      },
      outil: "perles",
      mesurer,
      // Vrai quand le boulier, à sa plus petite taille, dépasse la place
      // qu'on lui laisse (la page le lit pour régler son échelle).
      get deborde() { return cadre.offsetHeight > scene.clientHeight + 1 || cadre.offsetWidth > scene.clientWidth + 1; },
      get fini() { return boulier.finie; },
      get etape() { return boulier.etape; },
      get total() { return boulier.etats.reduce((somme, valeur) => somme + valeur, 0); }
    };
  }

  // ------------------------------------------------------------ la droite à sauts

  const DROITE = Object.freeze({
    largeur: 560, y: 104, hauteur: 158, hauteurDirect: 196,
    gauche: 60, droite: 490, droiteRetour: 465, sautMin: 85,
    arcMin: 15, arcMax: 46
  });
  const ESPACE_FINE = " ";

  function nombre(n) {
    const texte = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE);
    return texte;
  }

  const etiquetteSaut = saut => `${saut.val < 0 ? "−" : "+"} ${saut.masque ? "?" : nombre(saut.val)}`;

  // Où tombe chaque point : positions proportionnelles aux nombres, mais un
  // petit saut garde au moins `sautMin` pixels (sinon « + 3 » ou « − 1 » ne
  // se lirait pas). Rend {valeurs, x, bornes}.
  function planDroite(o) {
    const valeurs = [o.depart];
    o.sauts.forEach(saut => valeurs.push(valeurs[valeurs.length - 1] + saut.val));
    const tries = [...new Set(valeurs)].sort((a, b) => a - b);
    const retour = o.sauts.some(saut => saut.val < 0);
    const gauche = DROITE.gauche;
    const droite = retour ? DROITE.droiteRetour : DROITE.droite;
    const ecarts = tries.slice(1).map((v, i) => v - tries[i]);
    const largeurs = ecarts.map(() => 0);
    const fixes = new Set();
    // Les sauts trop petits prennent la largeur minimale ; les autres se
    // partagent le reste, à proportion.
    for (let tour = 0; tour <= ecarts.length; tour += 1) {
      const reste = (droite - gauche) - fixes.size * DROITE.sautMin;
      const somme = ecarts.reduce((s, e, i) => (fixes.has(i) ? s : s + e), 0);
      let change = false;
      ecarts.forEach((e, i) => {
        if (fixes.has(i)) { largeurs[i] = DROITE.sautMin; return; }
        largeurs[i] = somme ? e / somme * reste : reste;
        if (largeurs[i] < DROITE.sautMin && fixes.size < ecarts.length - 1) { fixes.add(i); change = true; }
      });
      if (!change) break;
    }
    const xDe = new Map([[tries[0], gauche]]);
    tries.slice(1).forEach((v, i) => xDe.set(v, xDe.get(tries[i]) + largeurs[i]));
    return {valeurs, x: valeurs.map(v => Math.round(xDe.get(v))), gauche, droite};
  }

  let compteurDroites = 0;

  // La droite à sauts, en SVG (chaîne).
  //   depart   : le nombre de départ
  //   sauts    : [{val: +20}, {val: −1}] ; masque: true écrit « + ? »
  //   direct   : le saut direct, dessiné dessous (+ 19)
  //   inconnue : le rang du point montré « ? » (0 = départ) ; inconnues :
  //              plusieurs rangs
  //   acquis   : les rangs des points montrés en vert (trouvés)
  //   gras     : le rang (à partir de 1) du saut en gras
  function droiteSauts(o) {
    const plan = planDroite(o);
    const {largeur: W, y} = DROITE;
    const H = o.direct ? DROITE.hauteurDirect : DROITE.hauteur;
    compteurDroites += 1;
    const id = `dc-fl-${compteurDroites}`;
    const fleche = (nom, couleur) => `<marker id="${id}-${nom}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto"><path d="M0 0L10 5L0 10z" fill="${couleur}"/></marker>`;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireDroite(o)}"><defs>${fleche("b", "#0755b8")}${fleche("n", "#143451")}${fleche("o", "#9a4a00")}</defs>`
      + `<line x1="14" y1="${y}" x2="${W - 14}" y2="${y}" stroke="#143451" stroke-width="3" stroke-linecap="round"/>`;
    o.sauts.forEach((saut, index) => {
      const retour = saut.val < 0;
      const xa = plan.x[index];
      const xb = plan.x[index + 1];
      const x1 = retour ? xa - 15 : xa;
      const x2 = retour ? xb + 6 : xb - 4;
      const h = Math.max(DROITE.arcMin, Math.min(DROITE.arcMax, 8 + Math.abs(x2 - x1) * .095));
      const mx = (x1 + x2) / 2;
      const couleur = retour ? "#9a4a00" : "#0755b8";
      const gras = o.gras === index + 1;
      s += `<path d="M${x1} ${y - 8} Q${mx} ${y - 8 - 2 * h} ${x2} ${y - 8}" fill="none" stroke="${couleur}" stroke-width="${gras ? 5.5 : 3.5}"${retour ? ' stroke-dasharray="7 5"' : ""} marker-end="url(#${id}-${retour ? "o" : "b"})"/>`;
      const texte = etiquetteSaut(saut);
      const lw = texte.length * 11 + 16;
      // Le petit retour a son étiquette à côté, à droite : sur l'arc, elle
      // cacherait la pointe du grand saut.
      const lx = retour ? Math.min(W - lw / 2 - 2, xa + 55) : mx;
      const ly = retour ? y - 8 - h - 2 : y - 8 - h;
      s += `<rect x="${lx - lw / 2}" y="${ly - 15}" width="${lw}" height="26" rx="13" fill="${retour ? "#fff3e0" : "#eaf2ff"}" stroke="${couleur}" stroke-width="${gras ? 3 : 2}"/>`
        + `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="17" fill="${couleur}">${texte}</text>`;
    });
    const inconnues = Array.isArray(o.inconnues) ? o.inconnues : [];
    plan.valeurs.forEach((valeur, index) => {
      const x = plan.x[index];
      const inconnue = o.inconnue === index || inconnues.includes(index);
      const acquis = Array.isArray(o.acquis) && o.acquis.includes(index);
      const texte = inconnue ? "?" : nombre(valeur);
      const w = Math.max(50, texte.length * 11 + 18);
      const style = acquis ? ["#e5f7eb", "#147447", "#147447", 2.5] : inconnue ? ["#fff", "#0755b8", "#0755b8", 3.5] : ["#fff", "#9fb6c6", "#143451", 2];
      s += `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" stroke="#143451" stroke-width="3" stroke-linecap="round"/>`
        + `<rect x="${x - w / 2}" y="${y + 15}" width="${w}" height="32" rx="8" fill="${style[0]}" stroke="${style[1]}" stroke-width="${style[3]}"/>`
        + `<text x="${x}" y="${y + 37.5}" text-anchor="middle" font-size="19" fill="${style[2]}">${texte}</text>`;
    });
    if (o.direct) {
      const x1 = plan.x[0];
      const x2 = plan.x[plan.x.length - 1];
      const yy = y + 52;
      const mx = (x1 + x2) / 2;
      const texte = etiquetteSaut({val: o.direct});
      const lw = texte.length * 11 + 16;
      s += `<path d="M${x1} ${yy} Q${mx} ${yy + 44} ${x2} ${yy}" fill="none" stroke="#143451" stroke-width="3.5" marker-end="url(#${id}-n)"/>`
        + `<rect x="${mx - lw / 2}" y="${yy + 9}" width="${lw}" height="26" rx="13" fill="#fff" stroke="#143451" stroke-width="2"/>`
        + `<text x="${mx}" y="${yy + 28}" text-anchor="middle" font-size="17" fill="#143451">${texte}</text>`;
    }
    return s + "</svg>";
  }

  // La même droite, en mots, pour un lecteur d'écran.
  function decrireDroite(o) {
    const plan = planDroite(o);
    const inconnues = Array.isArray(o.inconnues) ? o.inconnues : [];
    const morceaux = o.sauts.map((saut, index) => {
      const arrivee = o.inconnue === index + 1 || inconnues.includes(index + 1) ? "un nombre à trouver" : nombre(plan.valeurs[index + 1]);
      return `${saut.val < 0 ? "moins" : "plus"} ${saut.masque ? "un nombre à trouver" : nombre(saut.val)} : ${arrivee}`;
    });
    return `Droite : on part de ${nombre(o.depart)}. ${morceaux.join(". Puis ")}.`;
  }


  // ------------------------------------------------------- le glisse-nombres

  // Les noms des colonnes, par rang (0 = unités).
  const RANGS = Object.freeze({
    5: "Centaines de mille", 4: "Dizaines de mille", 3: "Milliers", 2: "Centaines", 1: "Dizaines", 0: "Unités",
    "-1": "Dixièmes", "-2": "Centièmes", "-3": "Millièmes"
  });
  const PAD = 3; // de quoi glisser de 3 colonnes de chaque côté

  // L'écriture d'un nombre sans espace, virgule française, sans zéro inutile.
  function ecriture(nombre) {
    return String(Number(Number(nombre).toFixed(6))).replace(".", ",");
  }

  // Le même, avec l'espace fine des milliers (« 1 200 », « 4 107,5 »).
  function ecritureLisible(nombreDonne) {
    const [entiere, decimales] = ecriture(nombreDonne).split(",");
    return nombre(Number(entiere)) + (decimales ? `,${decimales}` : "");
  }

  // Les chiffres d'un nombre, par rang : « 0,25 » → {0: "0", −1: "2", −2: "5"}.
  function chiffresParRang(nombre) {
    const [entiere, decimales = ""] = ecriture(nombre).split(",");
    const rangs = new Map();
    [...entiere].forEach((chiffre, i) => rangs.set(entiere.length - 1 - i, chiffre));
    [...decimales].forEach((chiffre, i) => rangs.set(-1 - i, chiffre));
    return rangs;
  }

  // Les chiffres d'un nombre dans les colonnes (le rang de chaque colonne,
  // de gauche à droite) ; '' pour une case vide.
  function chiffresDansColonnes(nombre, colonnes) {
    const rangs = chiffresParRang(nombre);
    return colonnes.map(rang => rangs.get(rang) || "");
  }

  // Ce que montre la bande quand elle a glissé de `decalage` colonnes vers
  // la gauche (négatif : vers la droite). Les zéros de tête tombent
  // (0,6 × 10 se lit 6, pas 06) ; pendant le glissement, une case vide RESTE
  // vide : c'est le zéro à écrire, l'outil ne l'écrit pas à la place de
  // l'élève.
  function bandeApres(base, decalage, indexUnites) {
    const vue = base.map((_, i) => base[i + decalage] || "");
    let gauche = vue.findIndex(chiffre => chiffre !== "");
    while (gauche >= 0 && gauche < indexUnites && vue[gauche] === "0" && vue.some((chiffre, i) => i > gauche && chiffre !== "")) {
      vue[gauche] = "";
      gauche += 1;
    }
    return vue;
  }

  // Les zéros de position, écrits une fois la bande lâchée au bon endroit
  // (lot 3) : les cases vides entre le premier chiffre et les unités (2 700),
  // et entre les unités et le dernier chiffre après la virgule (3,05) ; un
  // nombre sans partie entière a son 0 des unités (0,25). Rend les indices.
  function zerosDePosition(vue, indexUnites) {
    const pleins = vue.map((chiffre, i) => (chiffre !== "" ? i : -1)).filter(i => i >= 0);
    if (!pleins.length) return [];
    const premier = Math.min(pleins[0], indexUnites);
    const dernier = Math.max(pleins[pleins.length - 1], indexUnites);
    return vue.map((chiffre, i) => (chiffre === "" && i >= premier && i <= dernier ? i : -1)).filter(i => i >= 0);
  }

  // Suivre un glissement jusqu'au lâcher, même hors de la bande (copié de
  // auto/scripts/shared/interactions/pointer-drag.js).
  function suivreGlissement(element, depart, {bouge, fin}) {
    const vue = element.ownerDocument && element.ownerDocument.defaultView ? element.ownerDocument.defaultView : globalThis;
    const id = depart.pointerId;
    let actif = true;
    const memeDoigt = event => actif && (id === undefined || event.pointerId === id);
    const surBouge = event => { if (memeDoigt(event)) bouge(event); };
    const finir = event => {
      if (!memeDoigt(event)) return;
      actif = false;
      vue.removeEventListener("pointermove", surBouge);
      vue.removeEventListener("pointerup", finir);
      vue.removeEventListener("pointercancel", finir);
      try { element.releasePointerCapture?.(id); } catch (_) {}
      fin(event);
    };
    try { element.setPointerCapture?.(id); } catch (_) {}
    vue.addEventListener("pointermove", surBouge, {passive: false});
    vue.addEventListener("pointerup", finir);
    vue.addEventListener("pointercancel", finir);
  }

  const versLeCote = decalage => (decalage > 0 ? "vers la gauche" : "vers la droite");
  const direDecalage = decalage => (decalage ? `${accorder(Math.abs(decalage), "colonne", "colonnes")} ${versLeCote(decalage)}` : "à sa place");

  // Le glisse-nombres dans `zone`. options :
  //   depart    : le nombre posé dans la bande
  //   colonnes  : les rangs des colonnes, de gauche à droite ([5 … 0], [3 … −3])
  //   decalage  : le glissement attendu (2 : deux colonnes vers la gauche)
  //   consigne, refus (la phrase d'un glissement faux ; null : la consigne
  //   tremble), traces [{apres: 1, attente, texte}], surFini
  // Rend {detruire, mesurer, deborde, fini, decalage}. La bande émet
  // l'événement « decalage » ({detail: {decalage, accepte}}) à chaque arrêt.
  //
  // On fait glisser la bande grise (doigt, souris), ou on touche le chiffre
  // des unités puis sa colonne d'arrivée ; au clavier, ← → font glisser
  // d'une colonne, Entrée lâche la bande.
  function glisseNombres(zone, options) {
    const {depart, colonnes, decalage: attendu, consigne: texteConsigne, refus: texteRefus = null, traces = [], surFini = null} = options;
    const nombreColonnes = colonnes.length;
    const indexUnites = colonnes.indexOf(0);
    const virgule = colonnes.includes(-1);
    const base = chiffresDansColonnes(depart, colonnes);
    const etat = {decalage: 0, fini: false, pas: 1, departX: 0, departPx: 0, px: 0, refus: 0, observer: null, glisse: false};
    compteurAides += 1;

    const bloc = document.createElement("div");
    bloc.className = "glisse-zone";
    const consigne = document.createElement("p");
    consigne.className = "consigne glisse-consigne";
    consigne.id = `dc-consigne-${compteurAides}`;
    consigne.textContent = texteConsigne;
    const annonce = zoneAnnonce();

    const outil = document.createElement("div");
    outil.className = "place-value-tool";
    const grille = document.createElement("div");
    grille.className = "place-value-grid";
    grille.style.setProperty("--colonnes", String(nombreColonnes));
    const ligne = (classe, enfants) => {
      const element = document.createElement("div");
      element.className = classe;
      element.append(...enfants);
      return element;
    };
    const titres = colonnes.map((rang, index) => {
      const titre = document.createElement("div");
      titre.className = "place-value-head";
      titre.dataset.placeValueTarget = String(index);
      const nom = RANGS[rang];
      const coupure = nom.indexOf(" de ");
      // « Centaines de mille » sur deux lignes : la colonne est étroite.
      if (coupure > 0) titre.append(nom.slice(0, coupure), document.createElement("br"), nom.slice(coupure + 1));
      else titre.textContent = nom;
      titre.setAttribute("aria-label", `Colonne des ${nom.toLowerCase()}`);
      return titre;
    });
    const cellulesBande = Array.from({length: nombreColonnes + 2 * PAD}, () => {
      const cellule = document.createElement("span");
      cellule.className = "place-value-strip-digit";
      return cellule;
    });
    const bande = ligne("place-value-strip", cellulesBande);
    bande.style.gridTemplateColumns = `repeat(${nombreColonnes + 2 * PAD}, minmax(0, 1fr))`;
    bande.style.width = `calc(100% * ${nombreColonnes + 2 * PAD} / ${nombreColonnes})`;
    const fenetres = colonnes.map(() => ligne("place-value-window", []));
    const barre = document.createElement("div");
    barre.className = "place-value-drag-bar";
    barre.tabIndex = 0;
    barre.setAttribute("role", "slider");
    barre.setAttribute("aria-label", "Bande des chiffres, à faire glisser avec les flèches. Entrée pour la lâcher.");
    barre.setAttribute("aria-describedby", consigne.id);
    barre.setAttribute("aria-valuemin", String(-PAD));
    barre.setAttribute("aria-valuemax", String(PAD));
    barre.append(document.createElement("span"));
    const apercu = ligne("place-value-preview-row", [
      ligne("place-value-strip-viewport", [bande]),
      ligne("place-value-window-row", fenetres),
      barre
    ]);
    const fixes = base.map((chiffre, index) => {
      const cellule = document.createElement("span");
      cellule.className = `place-value-fixed-digit${index === indexUnites ? " is-units-digit" : ""}`;
      cellule.textContent = chiffre;
      return cellule;
    });
    const source = fixes[indexUnites];
    source.dataset.placeValueSource = "";
    source.setAttribute("role", "button");
    source.tabIndex = 0;
    source.setAttribute("aria-pressed", "false");
    source.setAttribute("aria-label", "Choisir le chiffre des unités, puis sa colonne d’arrivée");
    const fixe = ligne("place-value-fixed-row", fixes);
    if (virgule) {
      // La virgule, fixe, entre les unités et les dixièmes.
      const position = `calc(${(indexUnites + 1) / nombreColonnes * 100}% - 4px)`;
      [apercu, fixe].forEach(rangee => {
        const marque = document.createElement("span");
        marque.className = "place-value-comma";
        marque.setAttribute("aria-hidden", "true");
        marque.textContent = ",";
        marque.style.left = position;
        rangee.append(marque);
      });
    }
    grille.append(ligne("place-value-head-row", titres), apercu, fixe);
    outil.append(grille);
    const trace = document.createElement("p");
    trace.className = "dc-trace";
    trace.setAttribute("role", "status");
    trace.setAttribute("aria-live", "polite");
    bloc.append(consigne, outil, trace, annonce);
    zone.replaceChildren(bloc);

    const borner = (valeur, minimum, maximum) => Math.min(maximum, Math.max(minimum, valeur));

    function ecrireChiffres(decalage) {
      const vue = bandeApres(base, decalage, indexUnites);
      cellulesBande.forEach(cellule => { cellule.textContent = ""; cellule.classList.remove("is-units-digit", "is-zero-position"); });
      vue.forEach((chiffre, index) => {
        const cellule = cellulesBande[PAD + index + decalage];
        if (!cellule) return;
        cellule.textContent = chiffre;
        cellule.classList.toggle("is-units-digit", index === indexUnites);
      });
      // La bande lâchée au bon endroit : les zéros de position s'écrivent,
      // en gris, dans les cases restées vides (2 700 : un 0 aux dizaines, un
      // 0 aux unités).
      if (etat.fini && indexUnites >= 0) {
        zerosDePosition(vue, indexUnites).forEach(index => {
          const cellule = cellulesBande[PAD + index + decalage];
          if (!cellule) return;
          cellule.textContent = "0";
          cellule.classList.add("is-zero-position");
        });
      }
    }
    function poser(px, animer) {
      const transition = animer ? "transform .34s cubic-bezier(.2,.75,.25,1)" : "none";
      barre.style.transition = transition;
      bande.style.transition = transition;
      barre.style.transform = `translateX(${px}px)`;
      bande.style.transform = `translateX(${-PAD * etat.pas + px}px)`;
      etat.px = px;
    }
    function appliquer(decalage, animer = true) {
      etat.decalage = borner(Math.round(decalage), -PAD, PAD);
      ecrireChiffres(etat.decalage);
      poser(-etat.decalage * etat.pas, animer);
      barre.setAttribute("aria-valuenow", String(etat.decalage));
      barre.setAttribute("aria-valuetext", direDecalage(etat.decalage));
    }
    function mesurer() {
      etat.pas = grille.clientWidth / nombreColonnes || 1;
      appliquer(etat.decalage, false);
    }

    function ecrireTraces() {
      trace.replaceChildren(...traces.map(t => {
        const b = document.createElement("b");
        b.className = etat.fini ? "ok" : "ici";
        b.textContent = etat.fini ? t.texte : t.attente;
        return b;
      }));
    }

    function leverRefus() {
      clearTimeout(etat.refus);
      etat.refus = 0;
      if (!consigne.classList.contains("est-refus")) return;
      consigne.textContent = texteConsigne;
      consigne.classList.remove("est-refus");
    }
    function refuser() {
      clearTimeout(etat.refus);
      consigne.textContent = texteRefus || texteConsigne;
      consigne.classList.remove("est-refus");
      void consigne.offsetWidth;
      consigne.classList.add("est-refus");
      annonce.annoncer(consigne.textContent);
      etat.refus = setTimeout(leverRefus, 1800);
    }

    // La bande s'est arrêtée : le bon glissement finit le temps, un autre
    // est refusé et la bande revient à sa place.
    function lacher() {
      if (etat.fini || !etat.decalage) return;
      const accepte = etat.decalage === attendu;
      bloc.dispatchEvent(new CustomEvent("decalage", {bubbles: true, detail: {decalage: etat.decalage, accepte}}));
      if (!accepte) {
        appliquer(0, true);
        refuser();
        return;
      }
      leverRefus();
      etat.fini = true;
      bloc.classList.add("est-finie");
      barre.setAttribute("aria-disabled", "true");
      source.removeAttribute("tabindex");
      ecrireChiffres(etat.decalage);
      ecrireTraces();
      if (typeof surFini === "function") surFini();
    }

    // ---- toucher le chiffre des unités, puis sa colonne d'arrivée
    const finirChoix = () => {
      outil.classList.remove("tap-selecting");
      source.setAttribute("aria-pressed", "false");
      titres.forEach(titre => { titre.removeAttribute("tabindex"); titre.removeAttribute("role"); });
    };
    const basculerChoix = () => {
      if (etat.fini) return;
      const actif = !outil.classList.contains("tap-selecting");
      finirChoix();
      if (!actif) return;
      outil.classList.add("tap-selecting");
      source.setAttribute("aria-pressed", "true");
      titres.forEach(titre => { titre.tabIndex = 0; titre.setAttribute("role", "button"); });
    };
    source.addEventListener("click", basculerChoix);
    source.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      basculerChoix();
    });
    titres.forEach(titre => {
      const choisir = () => {
        if (!outil.classList.contains("tap-selecting") || etat.fini) return;
        mesurer();
        appliquer(indexUnites - Number(titre.dataset.placeValueTarget), true);
        finirChoix();
        barre.focus?.({preventScroll: true});
        lacher();
      };
      titre.addEventListener("click", choisir);
      titre.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        choisir();
      });
    });

    // ---- glisser la bande
    barre.addEventListener("pointerdown", event => {
      if (event.button > 0 || etat.fini) return;
      event.preventDefault();
      finirChoix();
      mesurer();
      // Le cadre peut être agrandi ou réduit (--echelle) : le doigt est en
      // pixels d'écran, la bande en pixels du cadre.
      const zoom = grille.getBoundingClientRect().width / (grille.offsetWidth || 1) || 1;
      etat.departX = event.clientX;
      etat.departPx = etat.px;
      etat.glisse = true;
      suivreGlissement(barre, event, {
        bouge(mouvement) {
          const px = borner(etat.departPx + (mouvement.clientX - etat.departX) / zoom, -PAD * etat.pas, PAD * etat.pas);
          const suivant = borner(Math.round(-px / etat.pas), -PAD, PAD);
          if (suivant !== etat.decalage) {
            etat.decalage = suivant;
            ecrireChiffres(suivant);
          }
          poser(px, false);
        },
        fin() {
          etat.glisse = false;
          appliquer(etat.decalage, true);
          lacher();
        }
      });
    });
    barre.addEventListener("keydown", event => {
      if (etat.fini) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        mesurer();
        appliquer(etat.decalage + (event.key === "ArrowLeft" ? 1 : -1), true);
        annonce.annoncer(direDecalage(etat.decalage));
      } else if (event.key === "Enter" || event.key === " ") {
        if (!event.repeat) lacher();
      } else return;
      event.preventDefault();
      // Entrée est à la bande tant que le glissement n'est pas fait.
      event.stopPropagation();
    });

    if (typeof ResizeObserver === "function") {
      etat.observer = new ResizeObserver(() => { if (!etat.glisse) mesurer(); });
      etat.observer.observe(grille);
    }
    ecrireTraces();
    mesurer();

    return {
      outil: "glisse",
      element: bloc,
      detruire() {
        clearTimeout(etat.refus);
        annonce.arreter();
        if (etat.observer) etat.observer.disconnect();
      },
      mesurer,
      get deborde() { return bloc.scrollWidth > zone.clientWidth + 1; },
      get fini() { return etat.fini; },
      get decalage() { return etat.decalage; }
    };
  }

  // ------------------------------------------------------- le tableau à flèches

  const TABLEAU = Object.freeze({colonne: 68, ecart: 8, bord: 6, titre: 30, rangee: 46, entre: 40});
  let compteurTableaux = 0;

  // Où vont les chiffres : ceux du départ, glissés de `k` colonnes (vers la
  // gauche si k > 0), sauf les zéros de tête et ceux qui sortent du
  // tableau ; les cases de l'arrivée que rien n'atteint sont les zéros à
  // écrire.
  function planTableau(o) {
    const k = Math.round(Math.log10(o.p)) * (o.operation === "÷" ? -1 : 1);
    const haut = chiffresParRang(o.depart);
    const bas = chiffresParRang(o.arrivee);
    const rangs = [...haut.keys(), ...bas.keys(), 0];
    if (o.virgule) rangs.push(-1);
    const premier = Math.max(...rangs);
    const dernier = Math.min(...rangs);
    const colonnes = [];
    for (let rang = premier; rang >= dernier; rang -= 1) colonnes.push(rang);
    const plusHautBas = Math.max(...bas.keys());
    const fleches = [...haut.entries()]
      .map(([rang, chiffre]) => ({de: rang, vers: rang + k, chiffre}))
      .filter(f => f.vers <= plusHautBas && f.vers >= dernier);
    const atteints = new Set(fleches.map(f => f.vers));
    const zeros = [...bas.keys()].filter(rang => !atteints.has(rang));
    return {k, colonnes, haut, bas, fleches, zeros};
  }

  // Le tableau en SVG (chaîne). o : {depart, arrivee, p, operation ("×" ou
  // "÷"), virgule (montrer la virgule même sans décimale), inconnue (la
  // rangée du bas est à trouver : « ? » partout, les flèches restent),
  // masque (l'étiquette dit « × ? »)}.
  function tableauFleches(o) {
    const plan = planTableau(o);
    const {colonne: C, ecart: E, bord: B, titre: T, rangee: R, entre: G} = TABLEAU;
    const n = plan.colonnes.length;
    // L'étiquette « × 100 » se pose hors des colonnes, du côté où les
    // flèches ne vont pas (à droite pour ×, à gauche pour ÷) : elle ne
    // cache jamais une flèche.
    const etiquette = `${o.operation} ${o.masque ? "?" : nombre(o.p)}`;
    const lw = etiquette.length * 10 + 18;
    const marge = lw + 10;
    const gaucheEtiquette = plan.k < 0;
    const W = B * 2 + n * C + (n - 1) * E + marge;
    const yHaut = T + 6;
    const yBas = yHaut + R + G;
    const H = yBas + R + 4;
    const x0 = B + (gaucheEtiquette ? marge : 0);
    const x = rang => x0 + plan.colonnes.indexOf(rang) * (C + E);
    compteurTableaux += 1;
    const id = `dc-tf-${compteurTableaux}`;
    let s = `<svg class="dc-tableau" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${decrireTableau(o, plan)}">`
      + `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0L10 5L0 10z" fill="#0755b8"/></marker></defs>`;
    plan.colonnes.forEach(rang => {
      const nom = RANGS[rang];
      const coupure = nom.indexOf(" de ");
      const cx = x(rang) + C / 2;
      s += `<rect x="${x(rang)}" y="0" width="${C}" height="${T}" rx="7" fill="#e3ecf2"/>`;
      s += coupure > 0
        ? `<text x="${cx}" y="13" text-anchor="middle" font-size="10.5" fill="#2c4a63">${nom.slice(0, coupure)}</text><text x="${cx}" y="25" text-anchor="middle" font-size="10.5" fill="#2c4a63">${nom.slice(coupure + 1)}</text>`
        : `<text x="${cx}" y="19.5" text-anchor="middle" font-size="11" fill="#2c4a63">${nom}</text>`;
      const chiffreHaut = plan.haut.get(rang) || "";
      s += `<rect x="${x(rang) + 1}" y="${yHaut}" width="${C - 2}" height="${R}" rx="9" fill="#e9eef2" stroke="#143451" stroke-width="2"/>`
        + (chiffreHaut ? `<text x="${cx}" y="${yHaut + 33}" text-anchor="middle" font-size="27" fill="#143451">${chiffreHaut}</text>` : "");
      const zero = plan.zeros.includes(rang);
      const fleche = plan.fleches.find(f => f.vers === rang);
      // L'aide (`inconnue`) montre les flèches, pas la rangée du bas : chaque
      // case d'arrivée dit « ? », les chiffres comme les zéros — sinon le
      // tableau écrirait la réponse.
      const cherche = o.inconnue && (fleche || zero);
      const chiffreBas = cherche ? "?" : fleche ? fleche.chiffre : zero ? "0" : "";
      s += zero
        ? `<rect x="${x(rang) + 1.5}" y="${yBas + .5}" width="${C - 3}" height="${R - 1}" rx="9" fill="#fff" stroke="#0755b8" stroke-width="3" stroke-dasharray="6 4"/>`
        : `<rect x="${x(rang) + 1}" y="${yBas}" width="${C - 2}" height="${R}" rx="9" fill="#fff" stroke="${cherche ? "#0755b8" : "#143451"}" stroke-width="2"/>`;
      if (chiffreBas) s += `<text x="${cx}" y="${yBas + 33}" text-anchor="middle" font-size="${cherche ? 22 : 27}" fill="${zero || cherche ? "#0755b8" : "#143451"}">${chiffreBas}</text>`;
    });
    // La virgule, fixe, au même endroit dans les deux rangées.
    if (plan.colonnes.includes(-1)) {
      const xv = x(0) + C + E / 2 - 3;
      [yHaut, yBas].forEach(y => { s += `<path d="M${xv} ${y + R - 14}h7l-4 14h-6z" fill="#c62828"/>`; });
    }
    plan.fleches.forEach(f => {
      const x1 = x(f.de) + C / 2;
      const x2 = x(f.vers) + C / 2 + (plan.k > 0 ? 8 : plan.k < 0 ? -8 : 0);
      s += `<line x1="${x1}" y1="${yHaut + R + 3}" x2="${x2}" y2="${yBas - 4}" stroke="#0755b8" stroke-width="3" stroke-linecap="round" marker-end="url(#${id})"/>`;
    });
    const lx = gaucheEtiquette ? B + lw / 2 : W - B - lw / 2;
    s += `<rect x="${lx - lw / 2}" y="${yHaut + R + G / 2 - 13}" width="${lw}" height="26" rx="13" fill="#eaf2ff" stroke="#0755b8" stroke-width="2"/>`
      + `<text x="${lx}" y="${yHaut + R + G / 2 + 6}" text-anchor="middle" font-size="16" fill="#0755b8">${etiquette}</text>`;
    return s + "</svg>";
  }

  // Le même tableau, en mots, pour un lecteur d'écran (sans la réponse
  // quand elle est cherchée).
  function decrireTableau(o, plan = planTableau(o)) {
    const glisse = `chaque chiffre glisse de ${accorder(Math.abs(plan.k), "colonne", "colonnes")} ${versLeCote(plan.k)}`;
    const depart = `Tableau de numération. En haut, ${ecritureLisible(o.depart)}.`;
    if (o.masque) return `${depart} En bas, ${ecritureLisible(o.arrivee)}. On a multiplié par combien ? Compte les colonnes.`;
    if (o.inconnue) {
      const vides = plan.zeros.length ? ` ${accorder(plan.zeros.length, "case reste vide", "cases restent vides")}.` : "";
      return `${depart} ${o.operation === "÷" ? "Divisé" : "Multiplié"} par ${nombre(o.p)} : ${glisse}.${vides}`;
    }
    return `${depart} ${o.operation === "÷" ? "Divisé" : "Multiplié"} par ${nombre(o.p)} : ${glisse}. En bas, ${ecritureLisible(o.arrivee)}.`;
  }

  // L'image d'une aide, quelle qu'elle soit (la page ne connaît que ça).
  function dessinerImage(image) {
    if (!image) return "";
    if (image.outil === "tableau-fleches") return tableauFleches(image);
    return droiteSauts(image);
  }

  return Object.freeze({
    PERLES,
    MESSAGES_REFUS,
    etatsDe,
    gesteAttendu,
    verifierGeste,
    perles100,
    DROITE,
    planDroite,
    droiteSauts,
    decrireDroite,
    RANGS,
    chiffresParRang,
    chiffresDansColonnes,
    bandeApres,
    zerosDePosition,
    glisseNombres,
    TABLEAU,
    planTableau,
    tableauFleches,
    decrireTableau,
    dessinerImage
  });
});
