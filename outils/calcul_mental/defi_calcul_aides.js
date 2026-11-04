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
    maxi: 55, mini: 14, miniTelephone: 12, miniFini: 6,
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
      // Quand la rangée entamée n'a plus la place (49 − 10 + 2 : 9 perles,
      // on en remet 2), la première rangée vide.
      const vide = etats.findIndex(valeur => valeur === 0);
      const rangee = entamee >= 0 && etats[entamee] + geste <= PERLES.parRangee ? entamee : vide;
      return {rangees: rangee >= 0 ? [rangee] : [], ecart: geste};
    }
    // En reculant : la rangée entamée ; sans rangée entamée (on part d'une
    // dizaine entière, 50 − 6, ou on vient de vider la rangée, 42 − 2 − 6),
    // ou quand elle n'a pas assez de perles (21 + 10 − 2 : 1 perle, on en
    // retire 2 ; « − 10 » des modules lot 2, 63 − 20 : une rangée entière),
    // la dernière rangée pleine.
    const pleine = etats.map(valeur => valeur > 0).lastIndexOf(true);
    const derniere = etats.lastIndexOf(PERLES.parRangee);
    const rangee = entamee >= 0 && etats[entamee] >= -geste ? entamee : entamee >= 0 && derniere >= 0 ? derniere : pleine;
    return {rangees: rangee >= 0 ? [rangee] : [], ecart: geste};
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
  // surFini, droite}. Rend {detruire, mesurer, deborde, fini}.
  //
  // `droite` (lot « relier », 31/10/2026 : « Je manipule » de J'apprends) :
  // une droite au-dessus du boulier reporte chaque geste — un saut par
  // geste, avec son point d'arrivée, le dernier en vert. Avant le geste,
  // rien : seul le départ est écrit. Les places sont celles de tous les
  // gestes : rien ne bouge quand un saut apparaît.
  //
  // Au clavier, le même geste qu'au doigt : ↑ ↓ choisissent la rangée,
  // ← → la perle (celle que le doigt attraperait), Entrée la fait glisser
  // avec ses voisines. Un cadre bleu montre la rangée et la perle, seulement
  // quand on joue au clavier.
  function perles100(zone, options) {
    const {depart, gestes, consigne: texteConsigne, traces = [], surFini = null, droite: avecDroite = false} = options;
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
    const droite = avecDroite ? document.createElement("div") : null;
    if (droite) droite.className = "perles-droite";
    bloc.append(...[consigne, droite, scene, trace, annonce].filter(Boolean));
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
    // min(largeur / 20,9 ; hauteur / 14,9 ; 55 px), jamais moins de 14 (au
    // téléphone 12, et 6 une fois le geste fait : il ne se manipule plus). Sous
    // 22 px (téléphone), le vide se resserre à 5 perles si la perle y gagne.
    function mesurer() {
      const largeur = scene.clientWidth || zone.clientWidth || 320;
      let hauteur = scene.clientHeight;
      // Téléphone (audit du 31/10) : la place du boulier est celle que la
      // page lui laisse (defi_calcul.css), même petite ; le repli à 45 % de
      // la fenêtre dès 120 px dessinait un boulier de 300 px dans une place
      // de 110, par-dessus le pavé. Ailleurs, la place suit le boulier et le
      // repli le fait grandir ; c'est l'échelle du cadre qui le ramène.
      const telephone = window.matchMedia("(max-width: 620px)").matches;
      if (telephone ? !scene.getClientRects().length : !(hauteur > 120)) hauteur = Math.round(window.innerHeight * .45);
      // Le geste fait, le boulier ne se manipule plus : au téléphone, il peut
      // rapetisser sous la taille du doigt pour laisser la place au pavé.
      const mini = !telephone ? PERLES.mini : boulier.finie ? PERLES.miniFini : PERLES.miniTelephone;
      const taillePour = largeurCadre => Math.max(mini, Math.floor(Math.min(
        largeur / largeurCadre, hauteur / PERLES.hauteurCadre, PERLES.maxi)));
      let ecart = PERLES.ecart;
      let taille = taillePour(PERLES.largeurCadre);
      const tailleSerree = taillePour(PERLES.largeurCadre - PERLES.ecart + PERLES.ecartSerre);
      if (taille < PERLES.perleAuDoigt && tailleSerree > taille) {
        ecart = PERLES.ecartSerre;
        taille = tailleSerree;
      }
      // Le geste fait, sur un écran trop court même pour ce petit boulier
      // (iPhone SE avec le bandeau de suivi), il s'efface : la trace du
      // geste reste, au-dessus du pavé.
      cadre.hidden = telephone && boulier.finie && Math.round(taille * PERLES.hauteurRangee) * PERLES.rangees > hauteur + 1;
      if (taille === boulier.taille && ecart === boulier.ecart) return;
      boulier.taille = taille;
      boulier.ecart = ecart;
      dessiner(false);
    }

    function dessinerDroite() {
      if (!droite) return;
      const faits = boulier.etape;
      droite.innerHTML = droiteSauts({
        depart, boulier: true,
        sauts: gestes.map((val, i) => (i < faits ? {val} : {val, cache: true})),
        caches: gestes.map((_, i) => i + 1).filter(i => i > faits),
        acquis: faits ? [faits] : []
      });
    }

    function ecrireTraces() {
      dessinerDroite();
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
  // La droite du boulier (lot « relier », 31/10/2026) : la même, plus basse
  // (le boulier garde sa place), un saut par geste. Au-delà de 4 gestes
  // (37 + ? = 100 : + 3, puis six fois + 10), les sauts et les nombres se
  // serrent, et les étiquettes s'écrivent plus petit.
  const DROITE_BOULIER = Object.freeze({
    largeur: 560, y: 72, hauteur: 124, hauteurDirect: 124,
    gauche: 40, droite: 515, droiteRetour: 500, sautMin: 70,
    arcMin: 12, arcMax: 24
  });
  const DROITE_BOULIER_SERREE = Object.freeze(Object.assign({}, DROITE_BOULIER, {sautMin: 52, serree: true}));
  const geometrieDroite = o => (!o.boulier ? DROITE : o.sauts.length > 4 ? DROITE_BOULIER_SERREE : DROITE_BOULIER);
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
    const g = geometrieDroite(o);
    const valeurs = [o.depart];
    o.sauts.forEach(saut => valeurs.push(valeurs[valeurs.length - 1] + saut.val));
    const tries = [...new Set(valeurs)].sort((a, b) => a - b);
    const retour = o.sauts.some(saut => saut.val < 0);
    const gauche = g.gauche;
    const droite = retour ? g.droiteRetour : g.droite;
    const ecarts = tries.slice(1).map((v, i) => v - tries[i]);
    const largeurs = ecarts.map(() => 0);
    const fixes = new Set();
    // Les sauts trop petits prennent la largeur minimale ; les autres se
    // partagent le reste, à proportion.
    for (let tour = 0; tour <= ecarts.length; tour += 1) {
      const reste = (droite - gauche) - fixes.size * g.sautMin;
      const somme = ecarts.reduce((s, e, i) => (fixes.has(i) ? s : s + e), 0);
      let change = false;
      ecarts.forEach((e, i) => {
        if (fixes.has(i)) { largeurs[i] = g.sautMin; return; }
        largeurs[i] = somme ? e / somme * reste : reste;
        if (largeurs[i] < g.sautMin && fixes.size < ecarts.length - 1) { fixes.add(i); change = true; }
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
  //   sauts    : [{val: +20}, {val: −1}] ; masque: true écrit « + ? » ;
  //              cache: true ne dessine pas le saut (sa place reste : rien
  //              ne bouge quand il apparaît)
  //   direct   : le saut direct, dessiné dessous (+ 19) ; directCache : sa
  //              place est gardée, il n'est pas dessiné
  //   inconnue : le rang du point montré « ? » (0 = départ) ; inconnues :
  //              plusieurs rangs
  //   acquis   : les rangs des points montrés en vert (trouvés)
  //   caches   : les rangs des points pas encore dessinés (la droite du
  //              boulier : le point vient avec son geste)
  //   gras     : le rang (à partir de 1) du saut en gras
  //   boulier  : la droite plus basse qui suit le boulier
  function droiteSauts(o) {
    const g = geometrieDroite(o);
    const plan = planDroite(o);
    const {largeur: W, y} = g;
    const H = o.direct ? g.hauteurDirect : g.hauteur;
    // Les tailles d'écriture : celles de la droite, un peu plus petites
    // quand les sauts se serrent.
    const T = g.serree ? {saut: 14, car: 8.5, pilule: 10, point: 15, carPoint: 9, mini: 40, haut: 22} : {saut: 17, car: 11, pilule: 16, point: 19, carPoint: 11, mini: 50, haut: 26};
    compteurDroites += 1;
    const id = `dc-fl-${compteurDroites}`;
    const fleche = (nom, couleur) => `<marker id="${id}-${nom}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto"><path d="M0 0L10 5L0 10z" fill="${couleur}"/></marker>`;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireDroite(o)}"><defs>${fleche("b", "#0755b8")}${fleche("n", "#143451")}${fleche("o", "#9a4a00")}</defs>`
      + `<line x1="14" y1="${y}" x2="${W - 14}" y2="${y}" stroke="#143451" stroke-width="3" stroke-linecap="round"/>`;
    o.sauts.forEach((saut, index) => {
      if (saut.cache) return;
      const retour = saut.val < 0;
      const xa = plan.x[index];
      const xb = plan.x[index + 1];
      const x1 = retour ? xa - 15 : xa;
      const x2 = retour ? xb + 6 : xb - 4;
      const h = Math.max(g.arcMin, Math.min(g.arcMax, 8 + Math.abs(x2 - x1) * .095));
      const mx = (x1 + x2) / 2;
      const couleur = retour ? "#9a4a00" : "#0755b8";
      const gras = o.gras === index + 1;
      s += `<path d="M${x1} ${y - 8} Q${mx} ${y - 8 - 2 * h} ${x2} ${y - 8}" fill="none" stroke="${couleur}" stroke-width="${gras ? 5.5 : 3.5}"${retour ? ' stroke-dasharray="7 5"' : ""} marker-end="url(#${id}-${retour ? "o" : "b"})"/>`;
      const texte = etiquetteSaut(saut);
      const lw = texte.length * T.car + T.pilule;
      // Le petit retour a son étiquette à côté, à droite : sur l'arc, elle
      // cacherait la pointe du grand saut.
      // Quand on ne fait que reculer (523 − 3 − 4), l'étiquette reste sur l'arc.
      // Le petit saut en avant d'un détour en arrière (A6 : − 10 puis + 1) a
      // son étiquette à gauche, pour la même raison.
      // Sur la droite du boulier (les sauts y sont serrés), le petit saut du
      // détour garde son étiquette au-dessus de son arc, une pilule plus haut
      // que celle du saut d'avant.
      const detour = index > 0 && Math.sign(saut.val) !== Math.sign(o.sauts[0].val);
      const aCote = detour && !o.boulier;
      const audessus = detour && o.boulier;
      const lx = aCote ? (retour ? Math.min(W - lw / 2 - 2, xa + 55) : Math.max(lw / 2 + 2, xa - 55))
        : audessus ? Math.max(lw / 2 + 2, Math.min(W - lw / 2 - 2, mx)) : mx;
      const ly = aCote ? y - 8 - h - 2 : audessus ? y - 8 - h - T.haut - 4 : y - 8 - h;
      s += `<rect x="${lx - lw / 2}" y="${ly - T.haut / 2 - 2}" width="${lw}" height="${T.haut}" rx="${T.haut / 2}" fill="${retour ? "#fff3e0" : "#eaf2ff"}" stroke="${couleur}" stroke-width="${gras ? 3 : 2}"/>`
        + `<text x="${lx}" y="${ly + (g.serree ? 3 : 4)}" text-anchor="middle" font-size="${T.saut}" fill="${couleur}">${texte}</text>`;
    });
    const inconnues = Array.isArray(o.inconnues) ? o.inconnues : [];
    const caches = Array.isArray(o.caches) ? o.caches : [];
    plan.valeurs.forEach((valeur, index) => {
      if (caches.includes(index)) return;
      const x = plan.x[index];
      const inconnue = o.inconnue === index || inconnues.includes(index);
      const acquis = Array.isArray(o.acquis) && o.acquis.includes(index);
      const texte = inconnue ? "?" : nombre(valeur);
      const w = Math.max(T.mini, texte.length * T.carPoint + 18);
      const style = acquis ? ["#e5f7eb", "#147447", "#147447", 2.5] : inconnue ? ["#fff", "#0755b8", "#0755b8", 3.5] : ["#fff", "#9fb6c6", "#143451", 2];
      const hp = T.point + 13;
      s += `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" stroke="#143451" stroke-width="3" stroke-linecap="round"/>`
        + `<rect x="${x - w / 2}" y="${y + 15}" width="${w}" height="${hp}" rx="8" fill="${style[0]}" stroke="${style[1]}" stroke-width="${style[3]}"/>`
        + `<text x="${x}" y="${y + 5.5 + hp}" text-anchor="middle" font-size="${T.point}" fill="${style[2]}">${texte}</text>`;
    });
    if (o.direct && !o.directCache) {
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
    const caches = Array.isArray(o.caches) ? o.caches : [];
    // Un saut pas encore dessiné n'est pas lu (son arrivée non plus).
    const morceaux = o.sauts.filter(saut => !saut.cache).map(saut => {
      const index = o.sauts.indexOf(saut);
      const arrivee = o.inconnue === index + 1 || inconnues.includes(index + 1) || caches.includes(index + 1) ? "un nombre à trouver" : nombre(plan.valeurs[index + 1]);
      return `${saut.val < 0 ? "moins" : "plus"} ${saut.masque ? "un nombre à trouver" : nombre(saut.val)} : ${arrivee}`;
    });
    return `Droite : on part de ${nombre(o.depart)}.${morceaux.length ? ` ${morceaux.join(". Puis ")}.` : ""}`;
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
    // « × ? » tant que l'élève ne l'a pas écrit (`etiquetteTrouvee`).
    const etiquette = `${o.operation} ${o.masque && !o.etiquetteTrouvee ? "?" : nombre(o.p)}`;
    // Dans J'écris, la pilule a déjà la largeur de « × 100 » : rien ne bouge
    // quand l'élève l'écrit.
    const lw = ("etiquetteTrouvee" in o ? `${o.operation} ${nombre(o.p)}` : etiquette).length * 10 + 18;
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
      // M3 (modules lot 3) : dans J'écris, le nombre du haut est le
      // résultat de la table, que l'élève écrit d'abord — « ? » tant qu'il
      // ne l'a pas trouvé (`haut: "cherche"`), en vert ensuite (« trouve »).
      const chiffreHaut = plan.haut.has(rang) ? (o.haut === "cherche" ? "?" : plan.haut.get(rang)) : "";
      const hautVert = o.haut === "trouve" && plan.haut.has(rang);
      const hautBleu = o.haut === "cherche" && plan.haut.has(rang);
      s += `<rect x="${x(rang) + 1}" y="${yHaut}" width="${C - 2}" height="${R}" rx="9" fill="${hautVert ? "#e5f7eb" : hautBleu ? "#fff" : "#e9eef2"}" stroke="${hautVert ? "#147447" : hautBleu ? "#0755b8" : "#143451"}" stroke-width="${hautVert ? 2.5 : 2}"/>`
        + (chiffreHaut ? `<text x="${cx}" y="${yHaut + 33}" text-anchor="middle" font-size="${hautBleu ? 22 : 27}"${hautVert ? ' font-weight="700"' : ""} fill="${hautVert ? "#147447" : hautBleu ? "#0755b8" : "#143451"}">${chiffreHaut}</text>` : "");
      const zero = plan.zeros.includes(rang);
      const fleche = plan.fleches.find(f => f.vers === rang);
      // L'aide (`inconnue`) montre les flèches, pas la rangée du bas : chaque
      // case d'arrivée dit « ? », les chiffres comme les zéros — sinon le
      // tableau écrirait la réponse.
      // J'écris (lot « relier ») : `trouves` dit les cases du bas que l'élève
      // a remplies en écrivant une égalité juste — elles s'écrivent, en vert.
      const trouve = Boolean(o.inconnue && Array.isArray(o.trouves) && o.trouves.includes(rang) && (fleche || zero));
      const cherche = o.inconnue && (fleche || zero) && !trouve;
      const chiffreBas = cherche ? "?" : fleche ? fleche.chiffre : zero ? "0" : "";
      s += zero
        ? `<rect x="${x(rang) + 1.5}" y="${yBas + .5}" width="${C - 3}" height="${R - 1}" rx="9" fill="${trouve ? "#e5f7eb" : "#fff"}" stroke="${trouve ? "#147447" : "#0755b8"}" stroke-width="3" stroke-dasharray="6 4"/>`
        : `<rect x="${x(rang) + 1}" y="${yBas}" width="${C - 2}" height="${R}" rx="9" fill="${trouve ? "#e5f7eb" : "#fff"}" stroke="${cherche ? "#0755b8" : trouve ? "#147447" : "#143451"}" stroke-width="${trouve ? 2.5 : 2}"/>`;
      if (chiffreBas) s += `<text x="${cx}" y="${yBas + 33}" text-anchor="middle" font-size="${cherche ? 22 : 27}"${trouve ? ' font-weight="700"' : ""} fill="${trouve ? "#147447" : zero || cherche ? "#0755b8" : "#143451"}">${chiffreBas}</text>`;
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
    const verte = Boolean(o.masque && o.etiquetteTrouvee);
    s += `<rect x="${lx - lw / 2}" y="${yHaut + R + G / 2 - 13}" width="${lw}" height="26" rx="13" fill="${verte ? "#e5f7eb" : "#eaf2ff"}" stroke="${verte ? "#147447" : "#0755b8"}" stroke-width="${verte ? 2.5 : 2}"/>`
      + `<text x="${lx}" y="${yHaut + R + G / 2 + 6}" text-anchor="middle" font-size="16"${verte ? ' font-weight="700"' : ""} fill="${verte ? "#147447" : "#0755b8"}">${etiquette}</text>`;
    return s + "</svg>";
  }

  // Le même tableau, en mots, pour un lecteur d'écran (sans la réponse
  // quand elle est cherchée).
  function decrireTableau(o, plan = planTableau(o)) {
    const glisse = `chaque chiffre glisse de ${accorder(Math.abs(plan.k), "colonne", "colonnes")} ${versLeCote(plan.k)}`;
    const depart = o.haut === "cherche" ? "Tableau de numération. En haut, un nombre à trouver." : `Tableau de numération. En haut, ${ecritureLisible(o.depart)}.`;
    if (o.masque && o.etiquetteTrouvee) return `${depart} ${o.operation === "÷" ? "Divisé" : "Multiplié"} par ${nombre(o.p)}. En bas, ${ecritureLisible(o.arrivee)}.`;
    const tout = Array.isArray(o.trouves) && [...plan.bas.keys()].every(rang => o.trouves.includes(rang));
    if (o.inconnue && tout) return `${depart} ${o.operation === "÷" ? "Divisé" : "Multiplié"} par ${nombre(o.p)} : ${glisse}. En bas, ${ecritureLisible(o.arrivee)}.`;
    if (o.inconnue && Array.isArray(o.trouves) && o.trouves.length) {
      // Les chiffres déjà écrits par l'élève, chacun avec sa colonne.
      const lus = [...plan.bas.entries()].filter(([rang]) => o.trouves.includes(rang)).map(([rang, chiffre]) => `${chiffre} aux ${RANGS[rang].toLowerCase()}`);
      return `${depart} ${o.operation === "÷" ? "Divisé" : "Multiplié"} par ${nombre(o.p)} : ${glisse}. En bas : ${lus.join(", ")}, le reste à trouver.`;
    }
    if (o.masque) return `${depart} En bas, ${ecritureLisible(o.arrivee)}. On a multiplié par combien ? Compte les colonnes.`;
    if (o.inconnue) {
      const vides = plan.zeros.length ? ` ${accorder(plan.zeros.length, "case reste vide", "cases restent vides")}.` : "";
      return `${depart} ${o.operation === "÷" ? "Divisé" : "Multiplié"} par ${nombre(o.p)} : ${glisse}.${vides}`;
    }
    return `${depart} ${o.operation === "÷" ? "Divisé" : "Multiplié"} par ${nombre(o.p)} : ${glisse}. En bas, ${ecritureLisible(o.arrivee)}.`;
  }

  // ------------------------------------------------- le schéma en barres

  // Le schéma en barres de M1 (doubles et moitiés, modules lot 1,
  // 31/10/2026), dessiné avec Gwenaël : des rangées COLLÉES, alignées.
  //  - double de 17 : 10 | 7 ‖ 10 | 7 (le nombre deux fois), puis 10 | 10 |
  //    7 | 7 (les morceaux par paires), puis 20 | 14, chaque double sous sa
  //    paire ; l'accolade dessous, c'est le double ;
  //  - moitié de 74, le même schéma à l'envers : 70 | 4, puis chaque morceau
  //    coupé en deux juste dessous (35 | 35 | 2 | 2), puis deux barres égales
  //    (35 | 2 ‖ 35 | 2) ; l'accolade sous la première, c'est la moitié.
  //    Les dizaines impaires restent à leur rang (70 + 4, pas 60 + 14).
  // Dans l'aide (`masque`), ce que l'élève cherche est vide et l'accolade
  // dit « ? ». Traits noirs, cases blanches : lisible en noir et blanc.
  const BARRES = Object.freeze({largeur: 560, gauche: 40, droite: 520, haut: 50, rang: 46, ecart: 26, mini: 46});

  // Les largeurs des cases d'une barre : proportionnelles, mais pas plus
  // étroites que `mini` (un « 3 » à côté d'un « 20 » doit se lire).
  function largeursDe(valeurs, total, mini = BARRES.mini) {
    const largeurs = valeurs.map(() => 0);
    const fixes = new Set();
    for (let tour = 0; tour <= valeurs.length; tour += 1) {
      const reste = total - fixes.size * mini;
      const somme = valeurs.reduce((s, v, i) => (fixes.has(i) ? s : s + v), 0);
      let change = false;
      valeurs.forEach((v, i) => {
        if (fixes.has(i)) { largeurs[i] = mini; return; }
        largeurs[i] = somme ? v / somme * reste : reste;
        if (largeurs[i] < mini && fixes.size < valeurs.length - 1) { fixes.add(i); change = true; }
      });
      if (!change) break;
    }
    return largeurs;
  }

  // Une barre : ses cases (valeur écrite, ou vide), un trait de coupe au
  // milieu de chaque case si `coupe`.
  function barreSvg(x, y, largeur, cases, {coupe = false, inconnue = false} = {}) {
    const largeurs = largeursDe(cases.map(c => c.valeur), largeur);
    let s = "";
    let xx = x;
    cases.forEach((c, i) => {
      const w = largeurs[i];
      s += `<rect x="${xx}" y="${y}" width="${w}" height="${BARRES.rang}" fill="${inconnue ? "#f3f6fa" : "#fff"}" stroke="#143451" stroke-width="2.5"/>`;
      if (coupe) s += `<line x1="${xx + w / 2}" y1="${y - 7}" x2="${xx + w / 2}" y2="${y + BARRES.rang + 7}" stroke="#143451" stroke-width="2" stroke-dasharray="5 4"/>`;
      if (c.texte) {
        const tx = coupe ? xx + w / 4 : xx + w / 2;
        s += `<text x="${tx}" y="${y + 30}" text-anchor="middle" font-size="${c.texte.length > 4 ? 16 : 19}" fill="#143451">${c.texte}</text>`;
      }
      xx += w;
    });
    return s;
  }

  // Une rangée de cases aux largeurs données (le double : les rangées
  // s'alignent sur les mêmes largeurs).
  // `inconnue` : vrai (toutes les cases sont cherchées), ou un état par
  // case : « cherche » (vide, grisée), « trouve » (ce que l'élève vient
  // d'écrire juste, en vert), sinon connue.
  function casesSvg(x, y, largeurs, textes, inconnue = false) {
    let s = "";
    let xx = x;
    largeurs.forEach((w, i) => {
      const etat = Array.isArray(inconnue) ? inconnue[i] : inconnue ? "cherche" : "";
      const fond = etat === "cherche" ? "#f3f6fa" : etat === "trouve" ? "#e5f7eb" : "#fff";
      s += `<rect x="${xx}" y="${y}" width="${w}" height="${BARRES.rang}" fill="${fond}" stroke="#143451" stroke-width="2.5"/>`;
      if (textes[i]) s += `<text x="${xx + w / 2}" y="${y + 30}" text-anchor="middle" font-size="${textes[i].length > 4 ? 16 : 19}"${etat === "trouve" ? ' font-weight="700"' : ""} fill="${etat === "trouve" ? "#147447" : "#143451"}">${textes[i]}</text>`;
      xx += w;
    });
    return s;
  }

  // Une accolade horizontale sous [x1, x2], et son étiquette.
  function accolade(x1, x2, y, texte, inconnue, trouve = false) {
    const mx = (x1 + x2) / 2;
    const lw = Math.max(46, texte.length * 11 + 18);
    const bord = inconnue ? "#0755b8" : trouve ? "#147447" : "#143451";
    return `<path d="M${x1} ${y} Q${x1} ${y + 9} ${x1 + 10} ${y + 9} L${mx - 8} ${y + 9} Q${mx} ${y + 9} ${mx} ${y + 17} Q${mx} ${y + 9} ${mx + 8} ${y + 9} L${x2 - 10} ${y + 9} Q${x2} ${y + 9} ${x2} ${y}" fill="none" stroke="#143451" stroke-width="2.5"/>`
      + `<rect x="${mx - lw / 2}" y="${y + 20}" width="${lw}" height="30" rx="8" fill="${trouve ? "#e5f7eb" : "#fff"}" stroke="${bord}" stroke-width="${inconnue || trouve ? 3 : 2}"/>`
      + `<text x="${mx}" y="${y + 41}" text-anchor="middle" font-size="19" font-weight="700" fill="${trouve ? "#147447" : "#143451"}">${texte}</text>`;
  }

  // Une accolade au-dessus de [x1, x2] : le nombre de départ.
  function accoladeHaut(x1, x2, y, texte) {
    const mx = (x1 + x2) / 2;
    return `<path d="M${x1} ${y} Q${x1} ${y - 8} ${x1 + 10} ${y - 8} L${mx - 8} ${y - 8} Q${mx} ${y - 8} ${mx} ${y - 15} Q${mx} ${y - 8} ${mx + 8} ${y - 8} L${x2 - 10} ${y - 8} Q${x2} ${y - 8} ${x2} ${y}" fill="none" stroke="#143451" stroke-width="2"/>`
      + `<text x="${mx}" y="${y - 21}" text-anchor="middle" font-size="18" font-weight="700" fill="#143451">${texte}</text>`;
  }

  function barres(o) {
    const {largeur: W, gauche, droite} = BARRES;
    const L = droite - gauche;
    const moitie = o.sorte === "moitie";
    const morceaux = o.morceaux && o.morceaux.length ? o.morceaux : [o.n];
    const reponse = moitie ? o.n / 2 : o.n * 2;
    const y1 = BARRES.haut;
    const y2 = y1 + BARRES.rang + BARRES.ecart;
    const H = y2 + BARRES.rang + 62;
    const cache = Boolean(o.masque);
    // J'écris (lot « relier », 31/10/2026) : `trouves` dit les morceaux dont
    // l'élève a écrit le double (ou la moitié) — leurs cases se remplissent,
    // en vert ; `fini` : la dernière égalité, l'accolade (et, pour la
    // moitié, les deux barres égales). Le reste attend, vide.
    const ecrit = cache && Array.isArray(o.trouves);
    const vu = i => !cache || (ecrit && o.trouves.includes(i));
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    const etat = visible => (visible ? "trouve" : "cherche");
    // Les cases du haut écrivent toujours ce qu'on sait ; celles du bas ce
    // qu'on cherche (vides dans l'aide).
    const connu = morceaux.map(m => ({valeur: m, texte: nombre(m)}));
    const cherche = morceaux.map((m, i) => {
      const v = moitie ? m / 2 : m * 2;
      return {valeur: v, texte: vu(i) ? nombre(v) : ""};
    });
    const etats = morceaux.map((_, i) => etat(vu(i)));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireBarres(o)}">`;
    // Le nombre de départ, au-dessus de sa barre (ou de chacune des deux).
    const titre = (x, w) => accoladeHaut(x + 2, x + w - 2, y1 - 3, nombre(o.n));
    if (moitie) {
      // La moitié, le même schéma que le double, à l'envers (proposition
      // du 31/10) : le nombre découpé (40 | 6), puis chaque morceau coupé
      // en deux juste en dessous (20 | 20 | 3 | 3), puis les morceaux
      // rangés en deux barres égales (20 | 3 ‖ 20 | 3) : l'accolade sous la
      // première, c'est la moitié. Un seul morceau (30) : 30, puis 15 ‖ 15.
      // Chaque moitié de case doit pouvoir porter son nombre : 2 × mini.
      const largeurs = largeursDe(morceaux, L, 2 * BARRES.mini);
      const demis = largeurs.flatMap(w => [w / 2, w / 2]);
      const textesDemis = cherche.flatMap(c => [c.texte, c.texte]);
      const rangees = morceaux.length > 1 ? 3 : 2;
      s = s.replace(/viewBox="0 0 \d+ [\d.]+"/, `viewBox="0 0 ${W} ${y1 + rangees * BARRES.rang + 62}"`);
      s += titre(gauche, L) + casesSvg(gauche, y1, largeurs, connu.map(c => c.texte));
      let y = y1 + BARRES.rang;
      if (rangees === 3) {
        s += casesSvg(gauche, y, demis, textesDemis, ecrit ? etats.flatMap(e => [e, e]) : cache);
        y += BARRES.rang;
      }
      const uneMoitie = largeurs.map(w => w / 2);
      // J'écris : les deux barres égales se remplissent avec la dernière
      // égalité (quand le nombre a deux morceaux ; un seul morceau, 30 →
      // 15 ‖ 15 : avec son égalité à lui).
      const barreVue = i => (rangees === 3 ? finiVu : vu(i) || finiVu);
      const textesMoitie = morceaux.map((m, i) => (barreVue(i) ? nombre(m / 2) : ""));
      const etatsMoitie = ecrit ? morceaux.map((_, i) => etat(barreVue(i))) : cache;
      s += casesSvg(gauche, y, uneMoitie, textesMoitie, etatsMoitie) + casesSvg(gauche + L / 2, y, uneMoitie, textesMoitie, etatsMoitie);
      s += `<line x1="${gauche + L / 2}" y1="${y}" x2="${gauche + L / 2}" y2="${y + BARRES.rang + 4}" stroke="#143451" stroke-width="5"/>`;
      s += accolade(gauche + 2, gauche + L / 2 - 2, y + BARRES.rang + 4, finiVu ? nombre(reponse) : "?", !finiVu, ecrit && finiVu);
    } else {
      // Le double (choix de Gwenaël, 31/10) : trois rangées collées. Le
      // nombre deux fois (10 | 7 | 10 | 7), puis les mêmes morceaux rangés
      // par paires (10 | 10 | 7 | 7), puis chaque paire réunie (20 | 14),
      // juste en dessous de sa paire. Un nombre d'un seul morceau (8) : la
      // rangée du milieu n'a rien à ranger, elle n'est pas dessinée.
      const paires = morceaux.flatMap(m => [m, m]);
      const largeursPaires = largeursDe(paires, L);
      const rangees = morceaux.length > 1 ? 3 : 2;
      s = s.replace(/viewBox="0 0 \d+ [\d.]+"/, `viewBox="0 0 ${W} ${y1 + rangees * BARRES.rang + 62}"`);
      s += titre(gauche, L / 2) + titre(gauche + L / 2, L / 2);
      s += barreSvg(gauche, y1, L / 2, connu) + barreSvg(gauche + L / 2, y1, L / 2, connu);
      s += `<line x1="${gauche + L / 2}" y1="${y1 - 4}" x2="${gauche + L / 2}" y2="${y1 + BARRES.rang}" stroke="#143451" stroke-width="5"/>`;
      let y = y1 + BARRES.rang;
      if (rangees === 3) {
        s += casesSvg(gauche, y, largeursPaires, paires.map(m => nombre(m)));
        y += BARRES.rang;
      }
      const largeursDoubles = morceaux.map((_, i) => largeursPaires[2 * i] + largeursPaires[2 * i + 1]);
      s += casesSvg(gauche, y, largeursDoubles, cherche.map(c => c.texte), ecrit ? etats : cache);
      s += accolade(gauche + 2, droite - 2, y + BARRES.rang + 4, finiVu ? nombre(reponse) : "?", !finiVu, ecrit && finiVu);
    }
    return s + "</svg>";
  }

  // Le même schéma, en mots, pour un lecteur d'écran (sans la réponse dans
  // l'aide).
  function decrireBarres(o) {
    const morceaux = o.morceaux && o.morceaux.length ? o.morceaux : [o.n];
    const decoupe = morceaux.length > 1 ? ` : ${morceaux.map(nombre).join(" et ")}` : "";
    const reponse = o.sorte === "moitie" ? o.n / 2 : o.n * 2;
    const fin = o.masque && !(Array.isArray(o.trouves) && o.fini) ? "un nombre à trouver" : nombre(reponse);
    // J'écris : ce que l'élève a déjà écrit.
    const ecrits = o.masque && Array.isArray(o.trouves) && o.trouves.length && !o.fini
      ? ` Déjà écrit : ${o.trouves.map(i => nombre(o.sorte === "moitie" ? morceaux[i] / 2 : morceaux[i] * 2)).join(" et ")}.` : "";
    return o.sorte === "moitie"
      ? `Schéma : la barre de ${nombre(o.n)}${decoupe}, coupée en deux barres égales.${ecrits} Une barre : ${fin}.`
      : `Schéma : deux barres de ${nombre(o.n)}${decoupe}, mises bout à bout.${ecrits} Ensemble : ${fin}.`;
  }

  // ------------------------------------- le double du double (M6, modules lot 3)

  // × 4 et × 8 sur le schéma en barres de M1 (rangées COLLÉES, alignées) :
  // le nombre 4 (ou 8) fois, puis chaque paire réunie juste en dessous
  // (23 | 23 | 23 | 23, puis 46 | 46), et l'accolade sous la dernière
  // rangée, c'est le produit. L'accolade du haut dit « 4 fois 23 ».
  //   o : {n, fois (4 ou 8), masque (l'aide : ce qu'on cherche est vide),
  //        trouves (J'écris : le nombre de rangées du dessous déjà
  //        écrites), fini (la dernière égalité : l'accolade)}
  function barresFois(o) {
    const {largeur: W, gauche, droite} = BARRES;
    const L = droite - gauche;
    const etages = Math.round(Math.log2(o.fois));
    const y1 = BARRES.haut;
    const H = y1 + etages * BARRES.rang + 62;
    const cache = Boolean(o.masque);
    const ecrit = cache && Number.isInteger(o.trouves);
    const ligneVue = r => !cache || (ecrit && o.trouves >= r);
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireBarresFois(o)}">`;
    s += accoladeHaut(gauche + 2, droite - 2, y1 - 3, `${o.fois} fois ${nombre(o.n)}`);
    for (let r = 0; r < etages; r += 1) {
      const nombreCases = o.fois / 2 ** r;
      const valeur = o.n * 2 ** r;
      const vue = r === 0 || ligneVue(r);
      const etat = r === 0 ? "" : !cache ? "" : vue ? "trouve" : "cherche";
      s += casesSvg(gauche, y1 + r * BARRES.rang, Array(nombreCases).fill(L / nombreCases), Array(nombreCases).fill(vue ? nombre(valeur) : ""), Array(nombreCases).fill(ecrit ? etat : cache && r > 0 ? "cherche" : ""));
    }
    const produit = o.n * o.fois;
    s += accolade(gauche + 2, droite - 2, y1 + etages * BARRES.rang + 4, finiVu ? nombre(produit) : "?", !finiVu, ecrit && finiVu);
    return s + "</svg>";
  }

  function decrireBarresFois(o) {
    const etages = Math.round(Math.log2(o.fois));
    const lignes = [];
    for (let r = 1; r < etages; r += 1) {
      const vue = !o.masque || (Number.isInteger(o.trouves) && o.trouves >= r);
      lignes.push(`${o.fois / 2 ** r} barres de ${vue ? nombre(o.n * 2 ** r) : "un nombre à trouver"}`);
    }
    const fin = !o.masque || (Number.isInteger(o.trouves) && o.fini) ? nombre(o.n * o.fois) : "un nombre à trouver";
    return `Schéma : ${o.fois} barres de ${nombre(o.n)}${lignes.length ? `, réunies deux par deux : ${lignes.join(", puis ")}` : ""}. Ensemble : ${fin}.`;
  }

  // ------------------------------------------ le rectangle découpé (M8, lot 3)

  // 13 × 7 = 10 × 7 + 3 × 7 : un rectangle de 13 de long et 7 de haut,
  // coupé en 10 | 3. Quadrillé (`quadrille`) au niveau 1, où les carreaux
  // se comptent ; un simple rectangle ensuite (23 × 7, 6 × 47).
  //   o : {a (la hauteur, le facteur qu'on garde), b (la longueur), morceaux
  //        (b découpé : [10, 3]), quadrille, masque, trouves (J'écris : les
  //        morceaux dont l'élève a écrit le produit), fini}
  // Chaque morceau dit son calcul (« 10 × 7 ») et, en dessous, son produit
  // (« ? » tant qu'il est cherché). L'accolade sous le rectangle, c'est le
  // produit entier.
  // Lisible au téléphone (01/11) : le rectangle prend toute la largeur ;
  // quadrillé, ses carreaux s'aplatissent un peu plutôt que de le rétrécir.
  const RECTANGLE = Object.freeze({largeur: 560, gauche: 58, droite: 540, haut: 46, hauteurMax: 124, hauteurSimple: 112, mini: 118, dehors: 100});
  function rectangle(o) {
    const {largeur: W, gauche, droite, haut} = RECTANGLE;
    const L = droite - gauche;
    const morceaux = o.morceaux && o.morceaux.length ? o.morceaux : [o.b];
    let largeurs;
    let hauteur;
    let x0 = gauche;
    let carreauHaut = 0;
    // Quadrillé, un petit morceau (11 = 10 + 1, 12 = 10 + 2) est trop étroit
    // pour son calcul : le rectangle laisse la place à droite, et le calcul
    // du petit morceau s'écrit dehors, juste à côté.
    let dehors = false;
    if (o.quadrille) {
      dehors = morceaux.length > 1 && morceaux[morceaux.length - 1] * L / o.b < RECTANGLE.dehors;
      const carreau = (dehors ? L - RECTANGLE.dehors : L) / o.b;
      largeurs = morceaux.map(m => m * carreau);
      carreauHaut = Math.min(carreau, RECTANGLE.hauteurMax / o.a);
      hauteur = o.a * carreauHaut;
    } else {
      largeurs = largeursDe(morceaux, L, RECTANGLE.mini);
      hauteur = RECTANGLE.hauteurSimple;
    }
    const total = largeurs.reduce((s, w) => s + w, 0);
    const H = haut + hauteur + 70;
    const cache = Boolean(o.masque);
    const ecrit = cache && Array.isArray(o.trouves);
    const vu = i => !cache || (ecrit && o.trouves.includes(i));
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireRectangle(o)}">`;
    // La hauteur, à gauche.
    s += `<line x1="${x0 - 16}" y1="${haut}" x2="${x0 - 16}" y2="${haut + hauteur}" stroke="#143451" stroke-width="2"/>`
      + `<line x1="${x0 - 22}" y1="${haut}" x2="${x0 - 10}" y2="${haut}" stroke="#143451" stroke-width="2"/>`
      + `<line x1="${x0 - 22}" y1="${haut + hauteur}" x2="${x0 - 10}" y2="${haut + hauteur}" stroke="#143451" stroke-width="2"/>`
      + `<text x="${x0 - 30}" y="${haut + hauteur / 2 + 7}" text-anchor="end" font-size="19" font-weight="700" fill="#143451">${nombre(o.a)}</text>`;
    let x = x0;
    morceaux.forEach((m, i) => {
      const w = largeurs[i];
      const etat = !cache ? "" : vu(i) ? "trouve" : "cherche";
      const fond = etat === "trouve" ? "#e5f7eb" : "#fff";
      s += `<rect x="${x}" y="${haut}" width="${w}" height="${hauteur}" fill="${fond}"/>`;
      if (o.quadrille) {
        const c = w / m;
        for (let k = 1; k < m; k += 1) s += `<line x1="${x + k * c}" y1="${haut}" x2="${x + k * c}" y2="${haut + hauteur}" stroke="#9fb6c6" stroke-width="1"/>`;
        for (let k = 1; k < o.a; k += 1) s += `<line x1="${x}" y1="${haut + k * carreauHaut}" x2="${x + w}" y2="${haut + k * carreauHaut}" stroke="#9fb6c6" stroke-width="1"/>`;
      }
      s += `<rect x="${x}" y="${haut}" width="${w}" height="${hauteur}" fill="none" stroke="#143451" stroke-width="3"/>`;
      s += accoladeHaut(x + 3, x + w - 3, haut - 3, nombre(m));
      // Le calcul du morceau, et son produit dessous, sur une étiquette
      // blanche (lisible par-dessus le quadrillage).
      const aCote = dehors && i === morceaux.length - 1;
      const cx = aCote ? x + w + RECTANGLE.dehors / 2 + 6 : x + w / 2;
      const cy = haut + hauteur / 2;
      if (aCote) s += `<line x1="${x + w / 2}" y1="${cy}" x2="${cx - 36}" y2="${cy}" stroke="#9fb6c6" stroke-width="2" stroke-dasharray="4 3"/>`;
      const calcul = `${nombre(m)} × ${nombre(o.a)}`;
      const produit = vu(i) ? nombre(m * o.a) : "?";
      const lw = Math.max(calcul.length * 12 + 14, 50);
      s += `<rect x="${cx - lw / 2}" y="${cy - 34}" width="${lw}" height="30" rx="8" fill="#fff" stroke="#9fb6c6" stroke-width="1.5"/>`
        + `<text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="20" fill="#143451">${calcul}</text>`;
      const pw = Math.max(produit.length * 13 + 22, 46);
      const style = etat === "trouve" ? ["#e5f7eb", "#147447", "#147447", 2.5] : etat === "cherche" ? ["#fff", "#0755b8", "#0755b8", 3] : ["#fff", "#143451", "#143451", 2];
      s += `<rect x="${cx - pw / 2}" y="${cy + 2}" width="${pw}" height="32" rx="8" fill="${style[0]}" stroke="${style[1]}" stroke-width="${style[3]}"/>`
        + `<text x="${cx}" y="${cy + 25}" text-anchor="middle" font-size="21" font-weight="700" fill="${style[2]}">${produit}</text>`;
      x += w;
    });
    // Le trait de coupe, épais.
    x = x0;
    largeurs.slice(0, -1).forEach(w => {
      x += w;
      s += `<line x1="${x}" y1="${haut - 6}" x2="${x}" y2="${haut + hauteur + 6}" stroke="#143451" stroke-width="5"/>`;
    });
    s += accolade(x0 + 2, x0 + total - 2, haut + hauteur + 4, finiVu ? nombre(o.a * o.b) : "?", !finiVu, ecrit && finiVu);
    return s + "</svg>";
  }

  function decrireRectangle(o) {
    const morceaux = o.morceaux && o.morceaux.length ? o.morceaux : [o.b];
    const parts = morceaux.map((m, i) => {
      const vu = !o.masque || (Array.isArray(o.trouves) && o.trouves.includes(i));
      return `${nombre(m)} × ${nombre(o.a)} : ${vu ? nombre(m * o.a) : "un nombre à trouver"}`;
    });
    const fin = !o.masque || (Array.isArray(o.trouves) && o.fini) ? nombre(o.a * o.b) : "un nombre à trouver";
    return `Rectangle de ${nombre(o.b)} sur ${nombre(o.a)}, coupé en ${morceaux.map(nombre).join(" et ")}. ${parts.join(". ")}. En tout : ${fin}.`;
  }

  // -------------------------------------------- les parts égales (M5, lot 3)

  // 100 = 4 × 25, 60 = 4 × 15 : la barre du nombre repère (accolade au-
  // dessus), coupée en parts égales. Ce qu'on cherche :
  //   « part »   : chaque part est vide (60 = 4 × ?, 60 ÷ 4) ;
  //   « nombre » : les parts sont écrites, l'accolade du bas couvre `pris`
  //                parts (3 × 25 : 3 parts sur les 4 de 100) et dit « ? » ;
  //   « parts »  : les parts sont écrites, on cherche combien il y en a
  //                (100 ÷ 25) : l'accolade du bas dit « ? parts ».
  //   o : {total, parts, cherche, pris, masque, trouves (J'écris : les
  //        parts déjà écrites, ou true), fini}
  function partsEgales(o) {
    const {largeur: W, gauche, droite} = BARRES;
    const L = droite - gauche;
    const y1 = BARRES.haut;
    const part = o.total / o.parts;
    const cache = Boolean(o.masque);
    const ecrit = cache && o.trouves !== undefined;
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    const H = y1 + BARRES.rang + 62;
    const pris = o.cherche === "nombre" ? o.pris : o.parts;
    // Au-delà de la barre du repère (6 × 25 = 150) : la barre de 100 se
    // prolonge de parts « en plus », en pointillés.
    const casesTotal = Math.max(o.parts, pris);
    const w = L / casesTotal * (casesTotal > o.parts ? 1 : 1);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrirePartsEgales(o)}">`;
    s += accoladeHaut(gauche + 2, gauche + o.parts * w - 2, y1 - 3, nombre(o.total));
    const partVue = !cache || o.cherche !== "part" || (ecrit && (o.trouves === true || finiVu));
    const etat = cache && o.cherche === "part" ? (partVue ? "trouve" : "cherche") : "";
    s += casesSvg(gauche, y1, Array(o.parts).fill(w), Array(o.parts).fill(partVue ? nombre(part) : ""), Array(o.parts).fill(etat));
    for (let k = o.parts; k < casesTotal; k += 1) {
      s += `<rect x="${gauche + k * w}" y="${y1}" width="${w}" height="${BARRES.rang}" fill="#fff" stroke="#143451" stroke-width="2.5" stroke-dasharray="7 5"/>`
        + `<text x="${gauche + k * w + w / 2}" y="${y1 + 30}" text-anchor="middle" font-size="19" fill="#143451">${nombre(part)}</text>`;
    }
    if (o.cherche === "part") {
      s += accolade(gauche + 2, gauche + w - 2, y1 + BARRES.rang + 4, partVue ? nombre(part) : "?", !partVue, ecrit && partVue);
    } else if (o.cherche === "parts") {
      s += accolade(gauche + 2, gauche + o.parts * w - 2, y1 + BARRES.rang + 4, finiVu ? `${o.parts} parts` : "? parts", !finiVu, ecrit && finiVu);
    } else {
      s += accolade(gauche + 2, gauche + pris * w - 2, y1 + BARRES.rang + 4, finiVu ? nombre(pris * part) : "?", !finiVu, ecrit && finiVu);
    }
    return s + "</svg>";
  }

  function decrirePartsEgales(o) {
    const part = o.total / o.parts;
    const vu = !o.masque || (o.trouves !== undefined && o.fini);
    if (o.cherche === "part") return `Schéma : la barre de ${nombre(o.total)}, coupée en ${o.parts} parts égales. Une part : ${vu ? nombre(part) : "un nombre à trouver"}.`;
    if (o.cherche === "parts") return `Schéma : la barre de ${nombre(o.total)}, coupée en parts de ${nombre(part)}. Combien de parts : ${vu ? o.parts : "un nombre à trouver"}.`;
    return `Schéma : la barre de ${nombre(o.total)}, coupée en ${o.parts} parts de ${nombre(part)}. ${o.pris} parts : ${vu ? nombre(o.pris * part) : "un nombre à trouver"}.`;
  }

  // ------------------------------------------ la bande de la table (M4, lot 3)

  // La bande de Défi tables : les 11 multiples de la table (0, 7, 14 … 70),
  // les rangs au-dessus (× 0 … × 10), les sauts « + 7 » dessous.
  //   o : {table, cherche : le rang dont le multiple est cherché (7 × 8 :
  //        8), ou `rang` : le rang cherché d'un multiple montré (56 ÷ 7,
  //        7 × ? = 56 : rang 8, écrit « × ? »), masque, fini}
  const BANDE = Object.freeze({largeur: 560, gauche: 10, droite: 550, haut: 38, rang: 48});
  function bandeTable(o) {
    const {largeur: W, gauche, droite, haut, rang: R} = BANDE;
    const w = (droite - gauche) / 11;
    const H = haut + R + 44;
    const cache = Boolean(o.masque);
    const vu = !cache || Boolean(o.fini);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireBandeTable(o)}">`;
    for (let k = 0; k <= 10; k += 1) {
      const x = gauche + k * w;
      const cx = x + w / 2;
      const estCherche = o.cherche === k;
      const estRang = o.rang === k;
      // L'aide (`masque`) : « ? » en bleu ; trouvé (J'écris, `fini`) : en
      // vert ; la réponse montrée (sans masque) : en bleu, comme un repère.
      const etatCase = estCherche ? (cache ? (vu ? "trouve" : "cherche") : "repere") : estRang ? "repere" : "";
      const fond = etatCase === "trouve" ? "#e5f7eb" : etatCase === "repere" ? "#eaf2ff" : "#fff";
      const bord = etatCase === "trouve" ? "#147447" : etatCase === "cherche" || etatCase === "repere" ? "#0755b8" : "#143451";
      const rangTexte = estRang && cache && !vu ? "× ?" : `× ${k}`;
      const rangCouleur = estRang ? (cache && vu ? "#147447" : "#0755b8") : "#5b7286";
      s += `<text x="${cx}" y="${haut - 10}" text-anchor="middle" font-size="${estRang ? 17 : 15}"${estRang ? ' font-weight="700"' : ""} fill="${rangCouleur}">${rangTexte}</text>`;
      s += `<rect x="${x}" y="${haut}" width="${w}" height="${R}" fill="${fond}" stroke="${bord}" stroke-width="${etatCase ? 3 : 2}"/>`;
      const texte = estCherche && cache && !vu ? "?" : nombre(k * o.table);
      s += `<text x="${cx}" y="${haut + 30}" text-anchor="middle" font-size="${texte.length > 2 ? 17 : 20}"${etatCase ? ' font-weight="700"' : ""} fill="${etatCase === "trouve" ? "#147447" : etatCase === "cherche" ? "#0755b8" : "#143451"}">${texte}</text>`;
      if (k < 10) {
        const xa = cx + 4;
        const xb = cx + w - 4;
        s += `<path d="M${xa} ${haut + R + 4} Q${(xa + xb) / 2} ${haut + R + 20} ${xb} ${haut + R + 4}" fill="none" stroke="#7d93a6" stroke-width="1.6"/>`;
        if (k % 2 === 0) s += `<text x="${(xa + xb) / 2}" y="${haut + R + 36}" text-anchor="middle" font-size="14" fill="#5b7286">+ ${o.table}</text>`;
      }
    }
    return s + "</svg>";
  }

  function decrireBandeTable(o) {
    const vu = !o.masque || Boolean(o.fini);
    if (Number.isInteger(o.rang)) return `Bande de la table de ${o.table} : ${nombre(o.rang * o.table)}, c’est ${o.table} fois ${vu ? o.rang : "un nombre à trouver"}.`;
    return `Bande de la table de ${o.table} : ${o.table} fois ${o.cherche}, ${vu ? nombre(o.cherche * o.table) : "un nombre à trouver"}.`;
  }

  // ------------------------------------- le rectangle de points (M4, lot 3)

  // Décision du 01/11 : pour une division (56 ÷ 7) et un nombre manquant
  // (6 × ? = 54), le rectangle de points montre le sens — « dans 56,
  // combien de fois 7 ? » : 56 points rangés par paquets de 7, un paquet
  // par colonne (entourée). En haut, « ? fois » (le nombre de paquets, ce
  // qu'on cherche) ; à gauche, les points d'un paquet ; un cadre autour de
  // tout, et « 56 points en tout » dessous. Dans « À retenir »
  // (`lignes`), les lignes en pointillés : 9 fois 6, c'est aussi 6 fois 9.
  // Le dessin est compact (au téléphone, J'écris lui laisse 21 % de la
  // hauteur) : sa largeur suit le nombre de paquets.
  //   o : {rangees (le nombre de paquets), parRangee (les points d'un
  //        paquet), masque (« ? fois »), fini (J'écris : trouvé, en vert),
  //        colonnes (À retenir : les lignes aussi)}
  const POINTS = Object.freeze({haut: 64, pas: 19, rayon: 7, gauche: 78, marge: 22});
  function rectanglePoints(o) {
    const {haut: y0, pas, rayon, gauche, marge} = POINTS;
    const largeur = o.rangees * pas;
    const hauteur = o.parRangee * pas;
    const W = Math.max(gauche + largeur + marge, 250);
    const x0 = gauche + (W - gauche - marge - largeur) / 2;
    const H = y0 + hauteur + 54;
    const cache = Boolean(o.masque);
    const vu = !cache || Boolean(o.fini);
    const xm = x0 + largeur / 2;
    const ym = y0 + hauteur / 2;
    const etiquette = (x, y, texte, etat) => {
      const w = Math.max(40, texte.length * 11.5 + 18);
      const [fond, bord, encre] = etat === "cherche" ? ["#fff", "#0755b8", "#0755b8"] : etat === "trouve" ? ["#e5f7eb", "#147447", "#147447"] : ["#fff", "#143451", "#143451"];
      return `<rect x="${x - w / 2}" y="${y - 15}" width="${w}" height="30" rx="8" fill="${fond}" stroke="${bord}" stroke-width="${etat ? 3 : 2}"/>`
        + `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="20" font-weight="700" fill="${encre}">${texte}</text>`;
    };
    let s = `<svg class="dc-points" viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireRectanglePoints(o)}">`;
    // Un paquet par colonne, entouré.
    for (let i = 0; i < o.rangees; i += 1) s += `<rect x="${x0 + i * pas + 1}" y="${y0 - 2}" width="${pas - 2}" height="${hauteur + 4}" rx="9" fill="#eef4fb" stroke="#9fb6c6" stroke-width="1.3"/>`;
    if (o.colonnes) for (let j = 0; j < o.parRangee; j += 1) s += `<rect x="${x0 - 2}" y="${y0 + j * pas + 1}" width="${largeur + 4}" height="${pas - 2}" rx="9" fill="none" stroke="#b07d00" stroke-width="2" stroke-dasharray="4 3"/>`;
    for (let i = 0; i < o.rangees; i += 1) for (let j = 0; j < o.parRangee; j += 1)
      s += `<circle cx="${x0 + i * pas + pas / 2}" cy="${y0 + j * pas + pas / 2}" r="${rayon}" fill="#143451"/>`;
    s += `<rect x="${x0 - 6}" y="${y0 - 6}" width="${largeur + 12}" height="${hauteur + 12}" rx="12" fill="none" stroke="#143451" stroke-width="2.5"/>`;
    // En haut : combien de paquets (« ? fois »).
    s += accoladeHaut(x0 + 2, x0 + largeur - 2, y0 - 9, "") + etiquette(xm, y0 - 40, vu ? `${nombre(o.rangees)} fois` : "? fois", cache ? (vu ? "trouve" : "cherche") : "");
    // À gauche : les points d'un paquet.
    s += `<path d="M${x0 - 10} ${y0 + 1} Q${x0 - 18} ${y0 + 1} ${x0 - 18} ${y0 + 10} L${x0 - 18} ${ym - 7} Q${x0 - 18} ${ym} ${x0 - 25} ${ym} Q${x0 - 18} ${ym} ${x0 - 18} ${ym + 7} L${x0 - 18} ${y0 + hauteur - 10} Q${x0 - 18} ${y0 + hauteur - 1} ${x0 - 10} ${y0 + hauteur - 1}" fill="none" stroke="#143451" stroke-width="2"/>`;
    s += etiquette(x0 - 48, ym, nombre(o.parRangee), "");
    s += etiquette(W / 2, y0 + hauteur + 31, `${nombre(o.rangees * o.parRangee)} points en tout`, "");
    return s + "</svg>";
  }

  function decrireRectanglePoints(o) {
    const vu = !o.masque || Boolean(o.fini);
    return `${nombre(o.rangees * o.parRangee)} points en paquets de ${nombre(o.parRangee)} : ${vu ? `${nombre(o.rangees)} paquets` : "combien de paquets ? un nombre à trouver"}.`;
  }

  // L'image d'une aide, quelle qu'elle soit (la page ne connaît que ça).
  function dessinerImage(image) {
    if (!image) return "";
    if (image.outil === "tableau-fleches") return tableauFleches(image);
    if (image.outil === "barres") return barres(image);
    if (image.outil === "barres-fois") return barresFois(image);
    if (image.outil === "rectangle") return rectangle(image);
    if (image.outil === "parts") return partsEgales(image);
    if (image.outil === "bande") return bandeTable(image);
    if (image.outil === "points") return rectanglePoints(image);
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
    BARRES,
    barres,
    decrireBarres,
    barresFois,
    RECTANGLE,
    rectangle,
    partsEgales,
    BANDE,
    bandeTable,
    POINTS,
    rectanglePoints,
    dessinerImage
  });
});
