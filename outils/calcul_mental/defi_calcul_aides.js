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
  // surFini, droite, sansReponse}. Rend {detruire, mesurer, deborde, fini}.
  //
  // `sansReponse` (relecture 1, 05/11/2026 : l'entraînement, tous les
  // outils) : sous l'outil, seulement ce qu'il reste à faire (« 68 + … =
  // 70 ») ; ni les étapes faites ni le résultat. C'est l'élève qui lit
  // l'outil et écrit la réponse. Dans J'apprends, rien ne change.
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
    const {depart, gestes, consigne: texteConsigne, traces = [], surFini = null, droite: avecDroite = false, sansReponse = false} = options;
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
        if (faite && sansReponse) continue;
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
    const {depart, colonnes, decalage: attendu, consigne: texteConsigne, refus: texteRefus = null, traces = [], surFini = null, sansReponse = false} = options;
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
      trace.replaceChildren(...(etat.fini && sansReponse ? [] : traces).map(t => {
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
    // Le 0 des unités d'un nombre sous 1 (0,6 ÷ 10) ne glisse pas : le 0
    // des dixièmes de 0,06 est un zéro à écrire.
    const fleches = [...haut.entries()]
      .filter(([rang, chiffre]) => !(rang === 0 && chiffre === "0" && Math.abs(Number(o.depart)) < 1))
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

  // ============================================ modules lot 4 (04/11/2026)
  // M7, M10, M12, C1, C3 : le palier 2, les entiers.

  // Une étiquette arrondie (le « ? » cherché en bleu, le trouvé en vert).
  function pastille(x, y, texte, etat = "", taille = 19) {
    const w = Math.max(40, texte.length * (taille * 0.6) + 18);
    const [fond, bord, encre, epais] = etat === "cherche" ? ["#fff", "#0755b8", "#0755b8", 3]
      : etat === "trouve" ? ["#e5f7eb", "#147447", "#147447", 3] : ["#fff", "#143451", "#143451", 2];
    return `<rect x="${x - w / 2}" y="${y - 16}" width="${w}" height="32" rx="8" fill="${fond}" stroke="${bord}" stroke-width="${epais}"/>`
      + `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="${taille}" font-weight="700" fill="${encre}">${texte}</text>`;
  }

  // --------------------------------------------- dix fois le nombre (M7)

  // × 5, c'est × 10 puis la moitié : le nombre 10 fois (46 | 46 | … | 46),
  // l'accolade du haut « 46 × 10 = 460 », un trait épais au milieu, et
  // l'accolade sous la première moitié « 46 × 5 = ? ». × 50 : dix cases de
  // 240 (24 × 10), « 24 × 100 = 2 400 », puis « 24 × 50 = ? ».
  //   o : {n (le nombre), p (10 ou 100), masque, trouves (J'écris : le
  //        produit par p est écrit), fini}
  const DIX = Object.freeze({largeur: 540, gauche: 10, droite: 530, haut: 54});
  function dixFois(o) {
    const {largeur: W, gauche, droite, haut} = DIX;
    const L = droite - gauche;
    const w = L / 10;
    const R = BARRES.rang;
    const cache = Boolean(o.masque);
    const ecrit = cache && o.trouves !== undefined;
    const toutVu = !cache || (ecrit && Boolean(o.trouves));
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    const H = haut + R + 62;
    const caseTexte = nombre(o.n * o.p / 10);
    const taille = caseTexte.length > 3 ? 15 : caseTexte.length > 2 ? 18 : 21;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireDixFois(o)}">`;
    const total = `${nombre(o.n)} × ${nombre(o.p)} = ${toutVu ? nombre(o.n * o.p) : "?"}`;
    s += accoladeHaut(gauche + 2, droite - 2, haut - 3, "").replace(/<text[^>]*><\/text>/, "");
    s += `<text x="${gauche + L / 2}" y="${haut - 22}" text-anchor="middle" font-size="21" font-weight="700" fill="${cache && !toutVu ? "#0755b8" : ecrit && toutVu ? "#147447" : "#143451"}">${total}</text>`;
    for (let k = 0; k < 10; k += 1) {
      const x = gauche + k * w;
      s += `<rect x="${x}" y="${haut}" width="${w}" height="${R}" fill="${k < 5 ? "#fff" : "#eef1f5"}" stroke="#143451" stroke-width="2"/>`
        + `<text x="${x + w / 2}" y="${haut + 30}" text-anchor="middle" font-size="${taille}" fill="#143451">${caseTexte}</text>`;
    }
    s += `<line x1="${gauche + L / 2}" y1="${haut - 8}" x2="${gauche + L / 2}" y2="${haut + R + 8}" stroke="#143451" stroke-width="5"/>`;
    const moitie = `${nombre(o.n)} × ${nombre(o.p / 2)} = ${finiVu ? nombre(o.n * o.p / 2) : "?"}`;
    s += accolade(gauche + 2, gauche + L / 2 - 2, haut + R + 4, moitie, !finiVu, ecrit && finiVu);
    return s + "</svg>";
  }
  function decrireDixFois(o) {
    const vu = !o.masque || Boolean(o.fini);
    return `Schéma : ${nombre(o.n * o.p / 10)}, dix fois : ${nombre(o.n)} × ${nombre(o.p)}. La moitié, cinq cases : ${vu ? nombre(o.n * o.p / 2) : "un nombre à trouver"}.`;
  }

  // ------------------------------------------ les facteurs regroupés (M10)

  // 5 × 43 × 2 : les facteurs en étiquettes, un arc relie ceux qui font 10
  // (« 5 × 2 = 10 ») ; dessous, le produit rangé (43 × 10) et l'accolade.
  //   o : {avant (le calcul écrit d'abord, s'il a fallu couper un nombre :
  //        « 16 × 25 »), facteurs, paire [i, j], groupe (10, 100), reste
  //        (le facteur qui reste), groupeDevant (23 × 20 : « 46 × 10 »,
  //        le groupe d'abord), groupeConnu (false : 23 × 2 reste « ? » dans
  //        l'aide), masque, trouves, fini}
  const FACTEURS = Object.freeze({largeur: 420, tuile: 70, signe: 32});
  function facteursRegroupes(o) {
    const {largeur: W, tuile, signe} = FACTEURS;
    const cache = Boolean(o.masque);
    const ecrit = cache && o.trouves !== undefined;
    // Dans l'aide, le groupe connu (5 × 2 = 10, 4 × 25 = 100) est écrit :
    // c'est lui qu'on montre ; un groupe à calculer (23 × 2) reste « ? ».
    const groupeVu = !cache || (ecrit ? Boolean(o.trouves) : o.groupeConnu !== false);
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    const yAvant = 26;
    const y1 = (o.avant ? 50 : 0) + 74;
    const y2 = y1 + 92;
    const H = y2 + 104;
    const largeurTuile = t => Math.max(tuile, String(t).length * 15 + 26);
    const rangee = (valeurs, y, etats) => {
      const ws = valeurs.map(largeurTuile);
      const total = ws.reduce((a, b) => a + b, 0) + signe * (valeurs.length - 1);
      let x = (W - total) / 2;
      const centres = [];
      let s = "";
      valeurs.forEach((v, i) => {
        const etat = etats[i] || "";
        const [fond, bord, encre] = etat === "groupe" ? ["#eaf2ff", "#0755b8", "#0755b8"] : etat === "cherche" ? ["#f3f6fa", "#0755b8", "#0755b8"] : etat === "trouve" ? ["#e5f7eb", "#147447", "#147447"] : ["#fff", "#143451", "#143451"];
        s += `<rect x="${x}" y="${y}" width="${ws[i]}" height="50" rx="10" fill="${fond}" stroke="${bord}" stroke-width="${etat ? 3 : 2.5}"/>`
          + `<text x="${x + ws[i] / 2}" y="${y + 34}" text-anchor="middle" font-size="25" font-weight="700" fill="${encre}">${v}</text>`;
        centres.push(x + ws[i] / 2);
        x += ws[i];
        if (i < valeurs.length - 1) { s += `<text x="${x + signe / 2}" y="${y + 33}" text-anchor="middle" font-size="24" fill="#143451">×</text>`; x += signe; }
      });
      return {s, centres, gauche: (W - total) / 2, droite: (W + total) / 2};
    };
    // À sa taille, comme l'escalier de C1 : étroit, il deviendrait trop haut.
    let s = `<svg class="dc-escalier" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${decrireFacteurs(o)}">`;
    if (o.avant) s += `<text x="${W / 2}" y="${yAvant + 8}" text-anchor="middle" font-size="22" fill="#5b7286">${o.avant} =</text>`;
    const [i, j] = o.paire;
    const haut = rangee(o.facteurs.map(nombre), y1, o.facteurs.map((_, k) => (k === i || k === j ? "groupe" : "")));
    s += haut.s;
    // L'arc au-dessus des deux facteurs qui vont ensemble.
    const xa = haut.centres[i];
    const xb = haut.centres[j];
    s += `<path d="M${xa} ${y1 - 4} C${xa} ${y1 - 46} ${xb} ${y1 - 46} ${xb} ${y1 - 4}" fill="none" stroke="#0755b8" stroke-width="3"/>`;
    s += pastille((xa + xb) / 2, y1 - 38, `${nombre(o.facteurs[i])} × ${nombre(o.facteurs[j])} = ${groupeVu ? nombre(o.groupe) : "?"}`, cache && !groupeVu ? "cherche" : ecrit && groupeVu ? "trouve" : "", 18);
    // Dessous : le produit rangé, le groupe à part.
    s += `<text x="${W / 2}" y="${y2 - 14}" text-anchor="middle" font-size="22" fill="#5b7286">=</text>`;
    const tuileGroupe = groupeVu ? nombre(o.groupe) : "?";
    const etatGroupe = cache && !groupeVu ? "cherche" : "groupe";
    const bas = o.groupeDevant
      ? rangee([tuileGroupe, nombre(o.reste)], y2, [etatGroupe, ""])
      : rangee([nombre(o.reste), tuileGroupe], y2, ["", etatGroupe]);
    s += bas.s;
    s += accolade(bas.gauche + 2, bas.droite - 2, y2 + 54, finiVu ? nombre(o.reste * o.groupe) : "?", !finiVu, ecrit && finiVu);
    return s + "</svg>";
  }
  function decrireFacteurs(o) {
    const vu = !o.masque || Boolean(o.fini);
    const [i, j] = o.paire;
    const groupeVu = !o.masque || (o.trouves !== undefined ? Boolean(o.trouves) : o.groupeConnu !== false);
    const groupe = groupeVu ? nombre(o.groupe) : "un nombre à trouver";
    return `${o.facteurs.map(nombre).join(" × ")} : ${nombre(o.facteurs[i])} × ${nombre(o.facteurs[j])} = ${groupe}, puis ${o.groupeDevant ? `${groupe} × ${nombre(o.reste)}` : `${nombre(o.reste)} × ${groupe}`} : ${vu ? nombre(o.reste * o.groupe) : "un nombre à trouver"}.`;
  }

  // ------------------------------------------- la barre à partager (M12)

  // 96 ÷ 8 = 80 ÷ 8 + 16 ÷ 8 : la barre de 96 coupée en 80 | 16, chaque
  // morceau coupé en 8 parts (traits fins), et sous chaque morceau son
  // calcul (« 80 ÷ 8 = ? »). Un seul morceau (240 ÷ 6) : sa barre coupée en
  // 6, et « 240 ÷ 6 = ? » dessous. Pas tout à fait à l'échelle : un petit
  // morceau doit pouvoir porter son calcul.
  //   o : {n, d, morceaux, masque, trouves (J'écris : les morceaux déjà
  //        partagés), fini}
  function barrePartagee(o) {
    const {largeur: W, gauche, droite} = BARRES;
    const L = droite - gauche;
    const R = 54;
    const morceaux = o.morceaux && o.morceaux.length ? o.morceaux : [o.n];
    const d = o.d;
    const cache = Boolean(o.masque);
    const ecrit = cache && Array.isArray(o.trouves);
    const unSeul = morceaux.length === 1;
    const vu = i => !cache || (ecrit && (o.trouves.includes(i) || (unSeul && Boolean(o.fini))));
    const largeurs = unSeul ? [L] : largeursDe(morceaux, L, 150);
    const y1 = unSeul ? 12 : BARRES.haut;
    // Deux morceaux : le quotient entier s'écrit dessous (« 96 ÷ 8 = ? »).
    const H = y1 + R + (unSeul ? 64 : 104);
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireBarrePartagee(o)}">`;
    if (!unSeul) s += accoladeHaut(gauche + 2, droite - 2, y1 - 3, nombre(o.n));
    let x = gauche;
    morceaux.forEach((m, i) => {
      const w = largeurs[i];
      const etat = !cache ? "" : vu(i) ? "trouve" : "";
      s += `<rect x="${x}" y="${y1}" width="${w}" height="${R}" fill="${etat === "trouve" ? "#e5f7eb" : "#fff"}"/>`;
      for (let k = 1; k < d; k += 1) s += `<line x1="${x + k * w / d}" y1="${y1}" x2="${x + k * w / d}" y2="${y1 + R}" stroke="#9fb6c6" stroke-width="1.6"/>`;
      s += `<rect x="${x}" y="${y1}" width="${w}" height="${R}" fill="none" stroke="#143451" stroke-width="2.5"/>`;
      const t = nombre(m);
      const tw = t.length * 13 + 16;
      s += `<rect x="${x + w / 2 - tw / 2}" y="${y1 + 12}" width="${tw}" height="30" rx="6" fill="#fff"/>`
        + `<text x="${x + w / 2}" y="${y1 + 35}" text-anchor="middle" font-size="22" font-weight="700" fill="#143451">${t}</text>`;
      const calcul = `${nombre(m)} ÷ ${d} = ${vu(i) ? nombre(m / d) : "?"}`;
      s += accolade(x + 3, x + w - 3, y1 + R + 4, calcul, cache && !vu(i), ecrit && vu(i));
      x += w;
    });
    if (!unSeul) {
      s += `<line x1="${gauche + largeurs[0]}" y1="${y1 - 6}" x2="${gauche + largeurs[0]}" y2="${y1 + R + 6}" stroke="#143451" stroke-width="5"/>`;
      const encre = !cache ? "#143451" : finiVu ? "#147447" : "#0755b8";
      s += `<text x="${gauche + L / 2}" y="${y1 + R + 92}" text-anchor="middle" font-size="21" font-weight="700" fill="${encre}">${nombre(o.n)} ÷ ${d} = ${finiVu ? nombre(o.n / d) : "?"}</text>`;
    }
    return s + "</svg>";
  }
  function decrireBarrePartagee(o) {
    const morceaux = o.morceaux && o.morceaux.length ? o.morceaux : [o.n];
    const vu = !o.masque || (Array.isArray(o.trouves) && o.fini);
    const coupe = morceaux.length > 1 ? ` : ${morceaux.map(nombre).join(" et ")}, chacun coupé en ${o.d} parts` : ` coupée en ${o.d} parts`;
    return `Schéma : la barre de ${nombre(o.n)}${coupe}. Une part : ${vu ? nombre(o.n / o.d) : "un nombre à trouver"}.`;
  }

  // ---------------------------------------- les parenthèses en escalier (C1)

  // 3 × (10 − 6) : le calcul, une accolade sous la parenthèse et son
  // résultat ; la ligne suivante remplace la parenthèse par ce nombre
  // (3 × 4), et ainsi de suite jusqu'au résultat.
  //   o : {lignes: [{jetons: ["3", "×", "(", "10", "−", "6", ")"],
  //        sous: [[2, 6]], valeurs: [4], nouveaux: [indices des jetons
  //        qui viennent d'une accolade]}], masque, trouves (J'écris : le
  //        nombre d'accolades déjà trouvées, dans l'ordre), fini}
  const ESCALIER = Object.freeze({haut: 14, ligne: 104, police: 32, marge: 16, echelle: 0.95});
  function largeurJeton(t) {
    if (t === "(" || t === ")") return 15;
    if (/^[×÷+−=]$/.test(t)) return 36;
    return Math.max(26, t.length * 19 + 8);
  }
  function parenthesesEscalier(o) {
    const {haut, ligne, police, marge} = ESCALIER;
    const cache = Boolean(o.masque);
    const ecrit = cache && Number.isInteger(o.trouves);
    // Les accolades, dans l'ordre où on les calcule.
    const ordre = [];
    o.lignes.forEach((l, i) => l.sous.forEach((_, k) => ordre.push(`${i}-${k}`)));
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    const vu = cle => !cache || finiVu || (ecrit && ordre.indexOf(cle) < o.trouves);
    // Un nombre venu d'une accolade prend la place d'une case (plus large).
    const largeurs = l => l.jetons.map((t, k) => ((l.nouveaux || []).includes(k) ? Math.max(48, largeurJeton(t) + 14) : largeurJeton(t)));
    const W = Math.max(260, ...o.lignes.map(l => largeurs(l).reduce((a, b) => a + b, 0))) + 2 * marge;
    const H = haut + o.lignes.length * ligne;
    // À sa taille (un peu réduite) : un escalier étroit ne prend pas toute
    // la largeur, il deviendrait trop haut.
    let s = `<svg class="dc-escalier" viewBox="0 0 ${W} ${H}" width="${Math.round(W * ESCALIER.echelle)}" height="${Math.round(H * ESCALIER.echelle)}" role="img" aria-label="${decrireParentheses(o)}">`;
    o.lignes.forEach((l, i) => {
      const y = haut + i * ligne;
      const ws = largeurs(l);
      const total = ws.reduce((a, b) => a + b, 0);
      let x = (W - total) / 2;
      const bords = [];
      l.jetons.forEach((t, k) => {
        const venu = (l.nouveaux || []).indexOf(k);
        let texte = t;
        let etat = "";
        if (venu >= 0) {
          const [li, ki] = l.origines[venu];
          const trouve = vu(`${li}-${ki}`);
          texte = trouve ? t : "?";
          etat = cache ? (trouve ? "trouve" : "cherche") : "repere";
          const [fond, bord] = etat === "trouve" ? ["#e5f7eb", "#147447"] : etat === "cherche" ? ["#fff", "#0755b8"] : ["#eaf2ff", "#0755b8"];
          s += `<rect x="${x + 3}" y="${y}" width="${ws[k] - 6}" height="42" rx="8" fill="${fond}" stroke="${bord}" stroke-width="2.5"/>`;
        }
        const encre = etat === "trouve" ? "#147447" : etat === "cherche" ? "#0755b8" : "#143451";
        s += `<text x="${x + ws[k] / 2}" y="${y + 31}" text-anchor="middle" font-size="${police}"${/^[()×÷+−]$/.test(t) ? ' font-weight="400"' : ' font-weight="700"'} fill="${encre}">${texte}</text>`;
        bords.push([x, x + ws[k]]);
        x += ws[k];
      });
      l.sous.forEach(([a, b], k) => {
        const derniere = i === o.lignes.length - 1;
        const montre = derniere ? finiVu : vu(`${i}-${k}`);
        s += accolade(bords[a][0] + 3, bords[b][1] - 3, y + 44, montre ? nombre(l.valeurs[k]) : "?", cache && !montre, ecrit && montre);
      });
    });
    return s + "</svg>";
  }
  function decrireParentheses(o) {
    const vu = !o.masque || Boolean(o.fini);
    const premiere = o.lignes[0].jetons.join(" ").replace(/\( /g, "(").replace(/ \)/g, ")");
    const fin = o.lignes[o.lignes.length - 1].valeurs[0];
    return `${premiere} : d'abord ce qui est entre parenthèses, puis le reste. Résultat : ${vu ? nombre(fin) : "un nombre à trouver"}.`;
  }

  // -------------------------------------------- deux barres égales (C3)

  // Une égalité, c'est deux barres de la même longueur, COLLÉES l'une sous
  // l'autre (comme les rangées de M1 et de M6) :
  //  - « tout » : 347 = 20 + ? → la barre de 347, juste dessous 20 | ? ;
  //  - « somme » : 144 + 7 = 142 + ? → 144 | 7, juste dessous 142 | ? ;
  //    142 s'arrête avant 144 : le bout qui manque (2) a sa petite
  //    accolade, sous la barre du bas ; le « ? », c'est ce bout plus 7 ;
  //  - « ecart » : 142 − 14 = ? − 17 → on retire un bout de chaque barre
  //    (hachuré gris, comme le retrait de SPLAT! : le nombre posé dessus,
  //    sans « − ») ; ce qui reste est pareil, la barre du bas dépasse de 3.
  // Pas tout à fait à l'échelle : un petit bout doit porter son nombre.
  //   o : {sorte, haut: [valeurs], bas: [valeurs], cherche: ["haut"|"bas",
  //        index], masque, trouves (J'écris : le nombre d'étapes faites),
  //        fini}
  function deuxBarres(o) {
    const {largeur: W, gauche, droite} = BARRES;
    const L = droite - gauche;
    const R = 52;
    const cache = Boolean(o.masque);
    const ecrit = cache && o.trouves !== undefined;
    const finiVu = !cache || (ecrit && Boolean(o.fini));
    const etapeVue = !cache || (ecrit && (Number(o.trouves) >= 1 || Boolean(o.fini)));
    const [ligneCherche, caseCherche] = o.cherche;
    const estCherche = (ligne, i) => ligne === ligneCherche && i === caseCherche;
    const texteDe = (ligne, i, v) => (estCherche(ligne, i) && !finiVu ? "?" : nombre(v));
    const etatDe = (ligne, i) => (estCherche(ligne, i) ? (!cache ? "" : finiVu ? "trouve" : "cherche") : "");
    const y1 = 46;
    const y2 = y1 + R;
    const H = y2 + R + 62;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${decrireDeuxBarres(o)}">`;
    s += `<defs><pattern id="dc-retire" patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(135)"><rect width="16" height="16" fill="#e5e7eb"/><rect width="8" height="16" fill="#b7bcc4"/></pattern></defs>`;
    const caseSvg = (x, y, w, texte, etat, retire = false) => {
      const fond = retire ? "url(#dc-retire)" : etat === "cherche" ? "#f3f6fa" : etat === "trouve" ? "#e5f7eb" : "#fff";
      const encre = etat === "trouve" ? "#147447" : etat === "cherche" ? "#0755b8" : retire ? "#4d575d" : "#143451";
      let t = `<rect x="${x}" y="${y}" width="${w}" height="${R}" fill="${fond}" stroke="#143451" stroke-width="2.5"/>`;
      if (texte) t += `<text x="${x + w / 2}" y="${y + 34}" text-anchor="middle" font-size="${texte.length > 4 ? 19 : 22}" font-weight="700" fill="${encre}">${texte}</text>`;
      return t;
    };
    // Le contour de la case cherchée, par-dessus (sinon les cases voisines
    // couvrent son bord bleu).
    const contour = (x, y, w, etat) => (etat ? `<rect x="${x}" y="${y}" width="${w}" height="${R}" fill="none" stroke="${etat === "trouve" ? "#147447" : "#0755b8"}" stroke-width="3.5"/>` : "");
    let dessus = "";
    if (o.sorte === "tout") {
      s += caseSvg(gauche, y1, L, texteDe("haut", 0, o.haut[0]), etatDe("haut", 0));
      dessus += contour(gauche, y1, L, etatDe("haut", 0));
      const ws = largeursDe(o.bas, L, 80);
      let x = gauche;
      o.bas.forEach((v, i) => { s += caseSvg(x, y2, ws[i], texteDe("bas", i, v), etatDe("bas", i)); dessus += contour(x, y2, ws[i], etatDe("bas", i)); x += ws[i]; });
      return s + dessus + "</svg>";
    }
    const [a, b] = o.haut;
    const [c, d] = o.bas;
    const ecart = o.sorte === "somme" ? Math.abs(a - c) : Math.abs(d - b);
    const pasEcart = 44;
    if (o.sorte === "somme") {
      // Le premier morceau du haut à sa longueur (mais un petit morceau
      // garde de quoi porter son nombre), et le bout qui manque (2) à une
      // largeur fixe, lisible.
      const wa = Math.min(L - 92 - pasEcart, Math.max(92 + pasEcart, L * a / (a + b)));
      const wb = L - wa;
      const plusCourt = c < a;
      const wc = plusCourt ? wa - pasEcart : wa + pasEcart;
      s += caseSvg(gauche, y1, wa, texteDe("haut", 0, a), etatDe("haut", 0)) + caseSvg(gauche + wa, y1, wb, texteDe("haut", 1, b), etatDe("haut", 1));
      s += caseSvg(gauche, y2, wc, texteDe("bas", 0, c), etatDe("bas", 0)) + caseSvg(gauche + wc, y2, L - wc, texteDe("bas", 1, d), etatDe("bas", 1));
      dessus += contour(gauche, y2, wc, etatDe("bas", 0)) + contour(gauche + wc, y2, L - wc, etatDe("bas", 1)) + contour(gauche + wa, y1, wb, etatDe("haut", 1)) + contour(gauche, y1, wa, etatDe("haut", 0));
      // La coupe du haut prolongée en pointillés dans la barre du bas, et
      // l'accolade du bout qui manque (ou qui dépasse), sous la barre.
      s += dessus;
      s += `<line x1="${gauche + wa}" y1="${y2}" x2="${gauche + wa}" y2="${y2 + R}" stroke="#143451" stroke-width="2" stroke-dasharray="5 4"/>`;
      const [x1, x2] = [Math.min(gauche + wa, gauche + wc), Math.max(gauche + wa, gauche + wc)];
      s += accolade(x1 + 1, x2 - 1, y2 + R + 4, etapeVue ? nombre(ecart) : "?", cache && !etapeVue, ecrit && etapeVue);
      s += `<text x="${gauche + L / 2}" y="${y1 - 14}" text-anchor="middle" font-size="18" fill="#5b7286">deux barres de la même longueur</text>`;
      return s + "</svg>";
    }
    // « ecart » : 142 − 14 = ? − 17. Le reste a la même longueur en haut et
    // en bas ; on a retiré 14 en haut, 17 en bas : la barre du bas dépasse.
    const wRetire = 92;
    const plusLong = d > b;
    const wReste = L - wRetire - pasEcart;
    const wHaut = wRetire + (plusLong ? 0 : pasEcart);
    const wBas = wRetire + (plusLong ? pasEcart : 0);
    s += caseSvg(gauche, y1, wReste, "", "") + caseSvg(gauche + wReste, y1, wHaut, nombre(b), "", true);
    s += caseSvg(gauche, y2, wReste, "", "") + caseSvg(gauche + wReste, y2, wBas, nombre(d), "", true);
    s += `<text x="${gauche + wReste / 2}" y="${y2 + 3}" text-anchor="middle" font-size="16" fill="#5b7286" dy="-8"></text>`;
    s += `<line x1="${gauche + wReste}" y1="${y1}" x2="${gauche + wReste}" y2="${y2 + R}" stroke="#143451" stroke-width="5"/>`;
    // Le bout qui dépasse : sa petite accolade au-dessus (3 de plus).
    const xFinHaut = gauche + wReste + wHaut;
    const xFinBas = gauche + wReste + wBas;
    const [x1, x2] = [Math.min(xFinHaut, xFinBas), Math.max(xFinHaut, xFinBas)];
    s += `<line x1="${x1}" y1="${plusLong ? y2 : y1}" x2="${x1}" y2="${plusLong ? y2 + R : y1 + R}" stroke="#143451" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<path d="M${x1 + 2} ${y2 - 4} Q${x1 + 2} ${y2 - 12} ${x1 + 8} ${y2 - 12} L${x2 - 8} ${y2 - 12} Q${x2 - 2} ${y2 - 12} ${x2 - 2} ${y2 - 4}" fill="none" stroke="#143451" stroke-width="2"/>`
      + `<text x="${(x1 + x2) / 2}" y="${y2 - 18}" text-anchor="middle" font-size="19" font-weight="700" fill="${etapeVue ? (cache ? "#147447" : "#143451") : "#0755b8"}">${etapeVue ? nombre(ecart) : "?"}</text>`;
    s += accoladeHaut(gauche + 2, xFinHaut - 2, y1 - 3, texteDe("haut", 0, a));
    s += accolade(gauche + 2, xFinBas - 2, y2 + R + 4, texteDe("bas", 0, c), etatDe("bas", 0) === "cherche", etatDe("bas", 0) === "trouve");
    return s + "</svg>";
  }
  function decrireDeuxBarres(o) {
    const vu = !o.masque || Boolean(o.fini);
    const lire = (ligne, valeurs) => valeurs.map((v, i) => (o.cherche[0] === ligne && o.cherche[1] === i && !vu ? "un nombre à trouver" : nombre(v)));
    if (o.sorte === "tout") return `Deux barres de la même longueur : ${lire("haut", o.haut)[0]} en haut ; dessous, ${lire("bas", o.bas).join(" et ")}.`;
    if (o.sorte === "ecart") return `Deux barres : ${lire("haut", o.haut)[0]}, dont on retire ${nombre(o.haut[1])}, et ${lire("bas", o.bas)[0]}, dont on retire ${nombre(o.bas[1])}. Ce qui reste est pareil.`;
    return `Deux barres de la même longueur : ${lire("haut", o.haut).join(" et ")} en haut, ${lire("bas", o.bas).join(" et ")} en bas.`;
  }

  // ------------------------------------ toucher le calcul à faire (C1, lot 4)

  // Je manipule de C1 (décision du 04/11, planche « choix-4 ») : le calcul
  // écrit en grand ; l'élève touche ce qu'il calcule en premier. Touché au
  // bon endroit (dans la parenthèse la plus à l'intérieur), elle se referme
  // sur son nombre, en vert, et le calcul s'écrit dessous (« 10 − 6 = 4 ») ;
  // ailleurs, la consigne tremble et rien ne se passe, comme les perles
  // refusent un geste faux. On recommence à la ligne suivante, jusqu'au
  // résultat.
  //   options : {lignes (l'escalier du noyau), consigne, refus (null : la
  //              consigne tremble sans phrase), surFini, sansReponse}
  // Rend {outil: "toucher", detruire, mesurer, deborde, fini, etape}.
  //
  // `sansReponse` (l'entraînement, relecture 1) : l'outil ne calcule rien.
  // Le calcul touché s'entoure, sans son nombre, et rien ne s'écrit
  // dessous ; c'est fini quand ce qu'on calcule en premier est trouvé.
  function toucherCalcul(zone, options) {
    const {lignes, consigne: texteConsigne, refus: texteRefus = null, surFini = null, sansReponse = false} = options;
    const etat = {ligne: 0, faits: new Set(), fini: false, refus: 0, etape: 0};
    compteurAides += 1;
    const bloc = document.createElement("div");
    bloc.className = "dc-toucher";
    const consigne = document.createElement("p");
    consigne.className = "consigne";
    consigne.id = `dc-consigne-${compteurAides}`;
    consigne.textContent = texteConsigne;
    const calcul = document.createElement("div");
    calcul.className = "dc-toucher-calcul";
    calcul.setAttribute("role", "group");
    calcul.setAttribute("aria-describedby", consigne.id);
    const trace = document.createElement("p");
    trace.className = "dc-trace dc-toucher-trace";
    trace.setAttribute("role", "status");
    trace.setAttribute("aria-live", "polite");
    const annonce = zoneAnnonce();
    bloc.append(consigne, calcul, trace, annonce);
    zone.replaceChildren(bloc);

    const texteAccolade = (l, k) => {
      const [a, b] = l.sous[k];
      let jetons = l.jetons.slice(a, b + 1);
      if (jetons[0] === "(" && jetons[jetons.length - 1] === ")") jetons = jetons.slice(1, -1);
      return jetons.join(" ").replace(/\( /g, "(").replace(/ \)/g, ")");
    };
    const ecrites = [];

    // La ligne en cours : ses jetons, ceux des accolades déjà faites
    // remplacés par leur nombre (en vert), comme à la ligne suivante.
    function dessiner() {
      const l = lignes[etat.ligne];
      const morceaux = [];
      for (let k = 0; k < l.jetons.length; k += 1) {
        const accolade = l.sous.findIndex(([a]) => a === k);
        if (accolade >= 0 && etat.faits.has(accolade)) {
          if (sansReponse) morceaux.push({groupe: l.jetons.slice(l.sous[accolade][0], l.sous[accolade][1] + 1)});
          else morceaux.push({texte: nombre(l.valeurs[accolade]), trouve: true});
          k = l.sous[accolade][1];
          continue;
        }
        morceaux.push({texte: l.jetons[k], index: k, venu: l.nouveaux.includes(k)});
      }
      const jetonSeul = texte => {
        const jeton = document.createElement("span");
        jeton.textContent = texte;
        jeton.className = `dc-jeton${/^[()×÷+−]$/.test(texte) ? " est-signe" : ""}${/^[()]$/.test(texte) ? " est-parenthese" : ""}`;
        return jeton;
      };
      calcul.replaceChildren(...morceaux.map(m => {
        if (m.groupe) {
          // Entouré, sans son nombre : c'est l'élève qui le calcule.
          const groupe = document.createElement("span");
          groupe.className = "dc-jetons-choisis";
          groupe.append(...m.groupe.map(jetonSeul));
          return groupe;
        }
        const jeton = document.createElement("span");
        jeton.textContent = m.texte;
        const signe = /^[()×÷+−]$/.test(m.texte);
        jeton.className = `dc-jeton${signe ? " est-signe" : ""}${m.trouve ? " est-trouve" : ""}${m.venu ? " est-venu" : ""}${/^[()]$/.test(m.texte) ? " est-parenthese" : ""}`;
        if (!etat.fini && m.index !== undefined) {
          jeton.tabIndex = 0;
          jeton.setAttribute("role", "button");
          jeton.dataset.index = String(m.index);
          jeton.setAttribute("aria-label", `${m.texte} : le calculer en premier`);
        }
        return jeton;
      }));
    }
    function ecrireTraces() {
      trace.replaceChildren(...ecrites.map(t => {
        const b = document.createElement("b");
        b.className = "ok";
        b.textContent = t;
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
    // Un jeton touché : dans une accolade pas encore faite, elle se ferme ;
    // ailleurs, refusé.
    function toucher(index) {
      if (etat.fini) return;
      const l = lignes[etat.ligne];
      const k = l.sous.findIndex(([a, b], i) => !etat.faits.has(i) && index >= a && index <= b);
      bloc.dispatchEvent(new CustomEvent("toucher", {bubbles: true, detail: {index, accepte: k >= 0}}));
      if (k < 0) { refuser(); return; }
      leverRefus();
      etat.faits.add(k);
      etat.etape += 1;
      if (sansReponse) annonce.annoncer(`${texteAccolade(l, k)} : d’abord`);
      else {
        ecrites.push(`${texteAccolade(l, k)} = ${nombre(l.valeurs[k])}`);
        annonce.annoncer(ecrites[ecrites.length - 1]);
      }
      if (etat.faits.size === l.sous.length) {
        if (etat.ligne === lignes.length - 1 || sansReponse) {
          etat.fini = true;
          bloc.classList.add("est-finie");
        } else {
          etat.ligne += 1;
          etat.faits = new Set();
        }
      }
      dessiner();
      ecrireTraces();
      if (etat.fini && typeof surFini === "function") surFini();
    }
    calcul.addEventListener("click", event => {
      const jeton = event.target.closest && event.target.closest(".dc-jeton");
      if (!jeton || jeton.dataset.index === undefined) return;
      toucher(Number(jeton.dataset.index));
    });
    calcul.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const jeton = event.target.closest && event.target.closest(".dc-jeton");
      if (!jeton || jeton.dataset.index === undefined) return;
      event.preventDefault();
      event.stopPropagation();
      toucher(Number(jeton.dataset.index));
    });
    dessiner();
    ecrireTraces();
    return {
      outil: "toucher",
      element: bloc,
      detruire() {
        clearTimeout(etat.refus);
        annonce.arreter();
      },
      mesurer() {},
      get deborde() { return bloc.scrollWidth > zone.clientWidth + 1; },
      get fini() { return etat.fini; },
      get etape() { return etat.etape; },
      toucher
    };
  }

  // ============================================ modules lot 5 (04/11/2026) :
  // les décimaux du palier 2 (D1, D3, D4).

  // ------------------------------------------- les fractions, comme au cahier
  //
  // Dans un texte de calcul, « 2/10 » s'écrit en fraction : le numérateur,
  // la barre, le dénominateur. `noeudsCalcul` rend les morceaux d'une page ;
  // la case « □ » devient `caseReponse()` — dans « □/10 », elle est le
  // numérateur. Un lecteur d'écran lit « 2 sur 10 ».
  // Modules lot 6 : la case peut être au dénominateur (« 4/7 = 12/□ »).
  const MOTIF_FRACTION = /(\d[\d\u202f\u00a0]*|□|\?)\/(\d[\d\u202f\u00a0]*\d|\d|□|\?)/g;
  function noeudsCalcul(texte, {caseReponse = null, insecable = t => t} = {}) {
    const chaine = String(texte == null ? "" : texte);
    const morceaux = [];
    const ajouterTexte = t => {
      if (!t) return;
      const parts = t.split("□");
      parts.forEach((part, i) => {
        if (part) morceaux.push(document.createTextNode(insecable(part)));
        if (i < parts.length - 1) morceaux.push(caseReponse ? caseReponse() : document.createTextNode("□"));
      });
    };
    let dernier = 0;
    for (const m of chaine.matchAll(MOTIF_FRACTION)) {
      ajouterTexte(chaine.slice(dernier, m.index));
      const fraction = document.createElement("span");
      fraction.className = "dc-frac";
      const num = document.createElement("span");
      num.className = "dc-frac-num";
      if (m[1] === "□" && caseReponse) num.append(caseReponse());
      else num.textContent = insecable(m[1]);
      const sur = document.createElement("span");
      sur.className = "sr-only";
      sur.textContent = " sur ";
      const den = document.createElement("span");
      den.className = "dc-frac-den";
      if (m[2] === "□" && caseReponse) den.append(caseReponse());
      else den.textContent = insecable(m[2]);
      fraction.append(num, sur, den);
      morceaux.push(fraction);
      dernier = m.index + m[0].length;
    }
    ajouterTexte(chaine.slice(dernier));
    return morceaux;
  }
  // Un texte écrit dans un élément, ses fractions dessinées.
  function ecrireTexte(element, texte, options = {}) {
    element.replaceChildren(...noeudsCalcul(texte, options));
    return element;
  }

  // « À retenir » (relecture 1, 05/11/2026) : la règle en phrase, puis le
  // calcul seul sur sa ligne. « Pour passer la dizaine, …, puis j'ajoute
  // le reste : 47 + 8 = 47 + 3 + 5 = 55. » → {phrase: « Pour passer la
  // dizaine, …, puis j'ajoute le reste. », calcul: « 47 + 8 = 47 + 3 + 5 =
  // 55 »}. Seulement quand ce qui suit le dernier « : » est un calcul et
  // rien d'autre (des nombres, des signes, « moitié de », « double de »),
  // et que la phrase n'en a pas déjà un ; sinon null (le bilan reste tel
  // quel). Un bilan qui n'est qu'un calcul (M12 : « 96 ÷ 8 = 80 ÷ 8 + 16 ÷
  // 8 = 10 + 2 = 12. ») : {phrase: "", calcul}.
  function bilanEnDeux(texte) {
    const seul = String(texte || "").replace(/\.$/, "");
    if (seul.includes("=") && !/[A-Za-zÀ-ÖØ-öø-ÿ’:.;]/.test(seul.replace(/\d[.,]\d/g, ""))) return {phrase: "", calcul: seul};
    const m = /^(.*\S)[\s\u00a0\u202f]+:[\s\u00a0\u202f]+([^:]*)$/.exec(String(texte || ""));
    if (!m) return null;
    const phrase = m[1];
    const calcul = m[2].replace(/\.$/, "");
    if (phrase.includes("=") || !calcul.includes("=") || /[.;]/.test(calcul.replace(/\d[.]\d/g, ""))) return null;
    if (/[A-Za-zÀ-ÖØ-öø-ÿ’]/.test(calcul.replace(/\b(moitié|double) de\b/gi, ""))) return null;
    return {phrase: `${phrase}.`, calcul};
  }
  // Un calcul écrit dans une phrase ne se coupe pas en fin de ligne (« 18 ÷
  // 2 ⏎ = 9 ») : les espaces autour de ses signes deviennent insécables.
  function souderCalculs(texte) {
    return String(texte || "").replace(/([\d)])[ \u00a0]([×÷+−=])[ \u00a0](?=[\d(])/g, "$1\u00a0$2\u00a0");
  }

  // Une fraction en SVG, écrite comme sur le cahier : le numérateur, la
  // barre, le dénominateur. `num` peut être « ? » (la case à trouver).
  function fractionSvg(x, y, num, den, {taille = 20, encre = "#143451", cherche = false} = {}) {
    const n = String(num);
    const d = String(den);
    const w = Math.max(n.length, d.length) * taille * .62 + 6;
    return `<text x="${x}" y="${y - 5}" text-anchor="middle" font-size="${taille}" font-weight="700" fill="${cherche && n === "?" ? "#0755b8" : encre}">${n}</text>`
      + `<line x1="${x - w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y}" stroke="${encre}" stroke-width="2.2" stroke-linecap="round"/>`
      + `<text x="${x}" y="${y + taille + 1}" text-anchor="middle" font-size="${taille}" font-weight="700" fill="${cherche && d === "?" ? "#0755b8" : encre}">${d}</text>`;
  }
  // Un morceau de calcul écrit dans un dessin : « 2/10 » en fraction, le
  // reste en texte (« + », « 0,3 », « 4 »).
  function morceauSvg(x, y, texte, opts = {}) {
    const m = /^([−+] )?(\d[\d\u202f\u00a0]*|\?)\/(\d[\d\u202f\u00a0]*|\?)$/.exec(String(texte));
    const taille = opts.taille || 20;
    const encre = opts.encre || "#143451";
    if (!m) return `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="${taille}" font-weight="700" fill="${encre}">${texte}</text>`;
    const large = Math.max(m[2].length, m[3].length) * taille * .62 + 6;
    const signe = m[1] ? `<text x="${x - large / 2 - 4}" y="${y + 7}" text-anchor="middle" font-size="${taille}" font-weight="700" fill="${encre}">${m[1].trim()}</text>` : "";
    return signe + fractionSvg(x + (m[1] ? 8 : 0), y, m[2], m[3], opts);
  }

  // --------------------------------------------- le tableau de numération (D1, D4)
  //
  // Des lignes de chiffres rangées dans les colonnes (unités, dixièmes…),
  // comme une addition posée : chaque morceau du calcul sur sa ligne, son
  // écriture à gauche (« 2/10 », « + 0,3 »), puis un trait et la ligne du
  // résultat. La virgule : un trait rouge entre les unités et les dixièmes,
  // du haut en bas.
  //   o : {lignes: [{nombre, unite (le rang de son chiffre des unités : −1
  //        pour « 3 dixièmes »), texte, cherche (ses chiffres sont « ? » :
  //        J'écris de D4, « 3/100 = 0,03 » les écrit), trouvee (écrits par
  //        l'élève, en vert)}], resultat: {nombre, unite, texte},
  //        inconnue (la ligne du résultat est à trouver : « ? »), garder (les
  //        rangs du résultat qui restent écrits, en gris : D4, ce qui ne
  //        change pas), trouves (J'écris : les rangs déjà écrits par l'élève),
  //        retenue (le rang, ou les rangs, qui reçoivent une retenue : un
  //        petit « 1 » rouge au-dessus du trait), colonnes (les rangs,
  //        sinon ceux des nombres)}
  // Serré en hauteur : au téléphone, le tableau partage la place avec le
  // calcul, la touche « , » et le pavé.
  const NUMERATION = Object.freeze({colonne: 56, ecart: 5, bord: 4, titre: 22, rangee: 38, texte: 80, interligne: 4});
  function rangsDe(nombreDonne, unite = 0) {
    const rangs = new Map();
    chiffresParRang(nombreDonne).forEach((chiffre, rang) => rangs.set(rang + unite, chiffre));
    return rangs;
  }
  function planNumeration(o) {
    const lignes = o.lignes.map(l => ({texte: l.texte, rangs: rangsDe(l.nombre, l.unite || 0), cherche: Boolean(l.cherche), trouvee: Boolean(l.trouvee)}));
    const resultat = {texte: o.resultat.texte || "", rangs: rangsDe(o.resultat.nombre, o.resultat.unite || 0)};
    const tous = [0, -1, ...lignes.flatMap(l => [...l.rangs.keys()]), ...resultat.rangs.keys()];
    const colonnes = o.colonnes ? o.colonnes.slice() : [];
    if (!o.colonnes) for (let r = Math.max(...tous); r >= Math.min(...tous); r -= 1) colonnes.push(r);
    const retenues = o.retenue === undefined || o.retenue === null ? [] : [].concat(o.retenue);
    return {lignes, resultat, colonnes, retenues};
  }
  function tableauNumeration(o) {
    const plan = planNumeration(o);
    const {colonne: C, ecart: E, bord: B, titre: T, rangee: R, texte: TX, interligne: I} = NUMERATION;
    const n = plan.colonnes.length;
    const x0 = B + TX;
    const W = x0 + n * C + (n - 1) * E + B;
    const x = rang => x0 + plan.colonnes.indexOf(rang) * (C + E);
    const yLigne = i => T + 6 + i * (R + I);
    const yTrait = yLigne(plan.lignes.length) + 2;
    const yRes = yTrait + 8;
    const H = yRes + R + 3;
    let s = `<svg class="dc-numeration" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${decrireNumeration(o, plan)}">`;
    plan.colonnes.forEach(rang => {
      const nom = RANGS[rang];
      const cx = x(rang) + C / 2;
      const coupure = nom.indexOf(" de ");
      s += `<rect x="${x(rang)}" y="0" width="${C}" height="${T}" rx="7" fill="#e3ecf2"/>`;
      s += coupure > 0
        ? `<text x="${cx}" y="10" text-anchor="middle" font-size="9" fill="#2c4a63">${nom.slice(0, coupure)}</text><text x="${cx}" y="19" text-anchor="middle" font-size="9" fill="#2c4a63">${nom.slice(coupure + 1)}</text>`
        : `<text x="${cx}" y="15.5" text-anchor="middle" font-size="${nom.length > 8 ? 10.5 : 11.5}" fill="#2c4a63">${nom}</text>`;
    });
    const cellule = (rang, y, chiffre, etat) => {
      const fond = etat === "trouve" ? "#e5f7eb" : etat === "garde" ? "#eef2f5" : "#fff";
      const bord = etat === "cherche" ? "#0755b8" : etat === "trouve" ? "#147447" : etat === "garde" ? "#8a9caa" : "#143451";
      const encre = etat === "trouve" ? "#147447" : etat === "cherche" ? "#0755b8" : etat === "garde" ? "#5b7286" : "#143451";
      return `<rect x="${x(rang) + 1}" y="${y}" width="${C - 2}" height="${R}" rx="8" fill="${fond}" stroke="${bord}" stroke-width="${etat === "cherche" || etat === "trouve" ? 2.5 : 1.6}"/>`
        + (chiffre ? `<text x="${x(rang) + C / 2}" y="${y + R / 2 + (chiffre === "?" ? 7 : 9)}" text-anchor="middle" font-size="${chiffre === "?" ? 20 : 26}"${etat === "trouve" ? ' font-weight="700"' : ""} fill="${encre}">${chiffre}</text>` : "");
    };
    plan.lignes.forEach((l, i) => {
      const y = yLigne(i);
      s += morceauSvg(B + TX / 2 + 2, y + R / 2 - 1, l.texte, {taille: 16});
      plan.colonnes.forEach(rang => {
        if (!l.rangs.has(rang)) return;
        const etat = l.trouvee ? "trouve" : l.cherche ? "cherche" : "";
        s += cellule(rang, y, l.cherche && !l.trouvee ? "?" : l.rangs.get(rang), etat);
      });
    });
    s += `<line x1="${x0 - 10}" y1="${yTrait}" x2="${W - B}" y2="${yTrait}" stroke="#143451" stroke-width="3" stroke-linecap="round"/>`;
    // (F1, lot 6b : « 3/? » devient « 3/100 », en vert, quand l'élève l'a trouvé.)
    if (plan.resultat.texte) s += morceauSvg(B + TX / 2 + 2, yRes + R / 2 - 1, plan.resultat.texte, Object.assign({taille: 16, cherche: true}, o.resultat.trouve ? {encre: "#147447"} : {}));
    const garder = new Set(o.garder || []);
    const trouves = new Set(o.trouves || []);
    plan.resultat.rangs.forEach((chiffre, rang) => {
      if (!plan.colonnes.includes(rang)) return;
      const etat = !o.inconnue ? "" : trouves.has(rang) ? "trouve" : garder.has(rang) ? "garde" : "cherche";
      s += cellule(rang, yRes, etat === "cherche" ? "?" : chiffre, etat);
    });
    // La retenue : un petit « 1 » rouge, en haut à droite de sa colonne,
    // juste au-dessus du trait.
    plan.retenues.filter(rang => plan.colonnes.includes(rang)).forEach(rang => {
      s += `<circle cx="${x(rang) + C - 8}" cy="${yTrait - 6}" r="7.5" fill="#fff" stroke="#c62828" stroke-width="2"/><text x="${x(rang) + C - 8}" y="${yTrait - 1.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#c62828">1</text>`;
    });
    // La virgule : un trait rouge entre les unités et les dixièmes.
    if (plan.colonnes.includes(0) && plan.colonnes.includes(-1)) {
      const xv = x(0) + C + E / 2;
      s += `<line x1="${xv}" y1="${T + 4}" x2="${xv}" y2="${H - 2}" stroke="#c62828" stroke-width="3.5" stroke-linecap="round"/>`;
    }
    return s + "</svg>";
  }
  // Le même tableau, en mots (sans la réponse quand elle est cherchée).
  function decrireNumeration(o, plan = planNumeration(o)) {
    const lire = rangs => [...rangs.entries()].map(([rang, chiffre]) => `${chiffre} aux ${RANGS[rang].toLowerCase()}`).join(", ");
    const ecrit = texte => String(texte).replace(/\//g, " sur ");
    const lignes = plan.lignes.map(l => `${ecrit(l.texte)} : ${l.cherche && !l.trouvee ? "à écrire" : lire(l.rangs)}`).join(" ; ");
    const retenue = plan.retenues.length ? ` Une retenue aux ${plan.retenues.map(rang => RANGS[rang].toLowerCase()).join(" et aux ")}.` : "";
    if (!o.inconnue) return `Tableau de numération. ${lignes}.${retenue} En bas, ${lire(plan.resultat.rangs)}.`;
    const connus = new Set([...(o.garder || []), ...(o.trouves || [])]);
    const deja = [...plan.resultat.rangs.entries()].filter(([rang]) => connus.has(rang));
    const tout = deja.length === plan.resultat.rangs.size;
    if (tout) return `Tableau de numération. ${lignes}.${retenue} En bas, ${lire(plan.resultat.rangs)}.`;
    const bas = deja.length ? `En bas : ${lire(new Map(deja))}, le reste à trouver.` : "En bas, le nombre à trouver.";
    return `Tableau de numération. ${lignes}.${retenue} ${bas}`;
  }

  // --------------------------------------------------- le carré de 100 (D1)
  //
  // Une unité = un carré partagé en 100 petits carrés : une bande (une
  // colonne de 10) est un dixième, un petit carré un centième. Les unités
  // entières sont des carrés pleins ; le dernier carré est colorié en
  // partie (les dixièmes, puis les centièmes dans la colonne suivante).
  // Aucun chiffre dessus : c'est un dessin à lire. Le bleu des carrés
  // coloriés est un gris moyen à l'impression.
  //   o : {unites, dixiemes, centiemes}
  const CARRE = Object.freeze({cote: 100, ecart: 14, marge: 6, plein: "#5d86c8", clair: "#fff", trait: "#143451"});
  function carreSvg(x, y, cote, pleines, centiemes, {grille = true} = {}) {
    const c = cote / 10;
    let s = `<rect x="${x}" y="${y}" width="${cote}" height="${cote}" fill="${CARRE.clair}"/>`;
    if (pleines) s += `<rect x="${x}" y="${y}" width="${pleines * c}" height="${cote}" fill="${CARRE.plein}"/>`;
    if (centiemes) s += `<rect x="${x + pleines * c}" y="${y}" width="${c}" height="${centiemes * c}" fill="${CARRE.plein}"/>`;
    if (grille) {
      for (let k = 1; k < 10; k += 1) {
        s += `<line x1="${x + k * c}" y1="${y}" x2="${x + k * c}" y2="${y + cote}" stroke="${CARRE.trait}" stroke-width="1.1" opacity=".9"/>`;
        s += `<line x1="${x}" y1="${y + k * c}" x2="${x + cote}" y2="${y + k * c}" stroke="${CARRE.trait}" stroke-width=".5" opacity=".45"/>`;
      }
    }
    return s + `<rect x="${x}" y="${y}" width="${cote}" height="${cote}" fill="none" stroke="${CARRE.trait}" stroke-width="2.4"/>`;
  }
  // Décision du 04/11 (planche choix-4) : l'unité EST le grand carré —
  // les unités entières sont des carrés de la même taille que le carré
  // entamé, jamais plus petites (la fiche ne propose le carré que pour une
  // partie entière de 0 à 3 : quatre carrés au plus, sur une rangée).
  function carreCent(o) {
    const unites = o.unites || 0;
    const reste = (o.dixiemes || 0) > 0 || (o.centiemes || 0) > 0;
    const M = CARRE.marge;
    const nb = Math.max(1, unites + (reste ? 1 : 0));
    const parRangee = nb > 5 ? Math.ceil(nb / 2) : nb;
    const rangees = Math.ceil(nb / parRangee);
    const cote = CARRE.cote;
    const W = parRangee * cote + (parRangee - 1) * CARRE.ecart + 2 * M;
    const H = rangees * cote + (rangees - 1) * CARRE.ecart + 2 * M;
    let s = `<svg class="dc-carre" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${decrireCarre(o)}">`;
    for (let k = 0; k < nb; k += 1) {
      const plein = k < unites;
      s += carreSvg(M + (k % parRangee) * (cote + CARRE.ecart), M + Math.floor(k / parRangee) * (cote + CARRE.ecart), cote, plein ? 10 : o.dixiemes || 0, plein ? 0 : o.centiemes || 0);
    }
    return s + "</svg>";
  }
  function decrireCarre(o) {
    const morceaux = [];
    if (o.unites) morceaux.push(accorder(o.unites, "carré entier", "carrés entiers"));
    if (o.dixiemes) morceaux.push(accorder(o.dixiemes, "bande", "bandes"));
    if (o.centiemes) morceaux.push(accorder(o.centiemes, "petit carré", "petits carrés"));
    return `Carrés de 100 : un carré entier est une unité, une bande un dixième, un petit carré un centième. Colorié : ${morceaux.join(", ") || "rien"}.`;
  }

  // La règle du carré à colorier, sans page (testée par node --test) : un
  // toucher colorie la bande suivante tant qu'il manque des dixièmes, puis
  // le petit carré suivant ; tout colorié, il est refusé (« de trop »).
  // Rend le nouvel état, ou null pour un refus.
  function carreGeste(etat, voulu) {
    if (etat.dixiemes === voulu.dixiemes && etat.centiemes === voulu.centiemes) return null;
    return etat.dixiemes < voulu.dixiemes ? {dixiemes: etat.dixiemes + 1, centiemes: etat.centiemes} : {dixiemes: etat.dixiemes, centiemes: etat.centiemes + 1};
  }

  // Le carré de 100 à colorier (D1, Je manipule) : les unités sont déjà
  // là, à gauche, des carrés pleins DE LA MÊME TAILLE (décision du 04/11) ;
  // dans le carré à colorier, chaque toucher colorie la
  // bande suivante (un dixième), puis, les dixièmes faits, le petit carré
  // suivant (un centième). Le geste est forcé (on ne colorie pas une case à
  // la fois au hasard) ; une fois tout colorié, un toucher de plus fait
  // trembler la consigne. Au bout, l'appli écrit le calcul.
  //   options : {unites, dixiemes, centiemes, consigne, traces, surFini}
  // Au clavier : Entrée ou Espace sur le grand carré.
  function carreManip(zone, options) {
    const {unites = 0, dixiemes = 0, centiemes = 0, consigne: texteConsigne, traces = [], surFini = null, sansReponse = false} = options;
    const etat = {dixiemes: 0, centiemes: 0, fini: false, refus: 0, etape: 0};
    compteurAides += 1;
    const bloc = document.createElement("div");
    bloc.className = "dc-carre-manip";
    const consigne = document.createElement("p");
    consigne.className = "consigne";
    consigne.id = `dc-consigne-${compteurAides}`;
    ecrireTexte(consigne, texteConsigne);
    const scene = document.createElement("div");
    scene.className = "dc-carre-scene";
    // Les unités : des carrés pleins, de la taille du carré à colorier.
    scene.style.setProperty("--n", String(unites + 1));
    scene.classList.toggle("deux-rangees", unites + 1 >= 3);
    const petits = Array.from({length: unites}, () => {
      const unite = document.createElement("div");
      unite.className = "dc-carre-unite";
      unite.setAttribute("role", "img");
      unite.setAttribute("aria-label", "Un carré entier : une unité");
      unite.innerHTML = `<svg viewBox="0 0 204 204">${carreSvg(2, 2, 200, 10, 0)}</svg>`;
      return unite;
    });
    const grand = document.createElement("div");
    grand.className = "dc-carre-grand";
    grand.tabIndex = 0;
    grand.setAttribute("role", "button");
    grand.setAttribute("aria-describedby", consigne.id);
    const trace = document.createElement("p");
    trace.className = "dc-trace";
    trace.setAttribute("role", "status");
    trace.setAttribute("aria-live", "polite");
    const annonce = zoneAnnonce();
    scene.append(...petits, grand);
    bloc.append(consigne, scene, trace, annonce);
    zone.replaceChildren(bloc);

    const compte = () => [etat.dixiemes ? accorder(etat.dixiemes, "dixième", "dixièmes") : "", etat.centiemes ? accorder(etat.centiemes, "centième", "centièmes") : ""].filter(Boolean).join(" et ");
    function dessiner() {
      grand.innerHTML = `<svg viewBox="0 0 204 204">${carreSvg(2, 2, 200, etat.dixiemes, etat.centiemes)}</svg>`;
      grand.setAttribute("aria-label", etat.fini ? `Carré de 100 : ${compte()} coloriés.` : `Carré de 100${etat.dixiemes || etat.centiemes ? ` : ${compte()} coloriés` : ""}. Touche pour colorier.`);
      const pilule = document.createElement("b");
      if (sansReponse) {
        // Rien sous le carré : l'élève compte ce qu'il a colorié.
      } else if (etat.fini && traces.length) {
        pilule.className = "ok";
        ecrireTexte(pilule, traces[traces.length - 1].texte);
      } else if (etat.dixiemes || etat.centiemes) {
        pilule.className = "ici";
        pilule.textContent = `${compte()}…`;
      }
      trace.replaceChildren(...(pilule.className ? [pilule] : []));
    }
    function leverRefus() {
      clearTimeout(etat.refus);
      etat.refus = 0;
      consigne.classList.remove("est-refus");
    }
    function refuser() {
      clearTimeout(etat.refus);
      consigne.classList.remove("est-refus");
      void consigne.offsetWidth;
      consigne.classList.add("est-refus");
      annonce.annoncer(consigne.textContent);
      etat.refus = setTimeout(leverRefus, 1800);
    }
    function toucher() {
      const apres = carreGeste(etat, {dixiemes, centiemes});
      if (!apres) { refuser(); return; }
      leverRefus();
      etat.dixiemes = apres.dixiemes;
      etat.centiemes = apres.centiemes;
      etat.etape += 1;
      if (etat.dixiemes === dixiemes && etat.centiemes === centiemes) {
        etat.fini = true;
        bloc.classList.add("est-finie");
      }
      dessiner();
      annonce.annoncer(etat.fini && traces.length && !sansReponse ? traces[traces.length - 1].texte.replace(/\//g, " sur ") : compte());
      if (etat.fini && typeof surFini === "function") surFini();
    }
    grand.addEventListener("click", toucher);
    grand.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      toucher();
    });
    // Rien à colorier (4 = … : n'arrive pas, la fiche ne le propose pas).
    if (!dixiemes && !centiemes) etat.fini = true;
    dessiner();
    return {
      outil: "carre",
      element: bloc,
      detruire() {
        clearTimeout(etat.refus);
        annonce.arreter();
      },
      mesurer() {},
      get deborde() { return bloc.scrollWidth > zone.clientWidth + 1; },
      get fini() { return etat.fini; },
      get etape() { return etat.etape; },
      get colorie() { return {dixiemes: etat.dixiemes, centiemes: etat.centiemes}; },
      toucher
    };
  }

  // ------------------------------------------------- le tableau à jetons (D4)
  //
  // Le nombre de départ en jetons, colonne par colonne, rangés en carré de
  // 3 × 3, chaque jeton écrit avec sa valeur (1 ; 0,1 ; 0,01 ; 0,001), dans
  // sa colonne nommée, comme les disques de Singapour (décision du 04/11 :
  // la colonne et le jeton disent la même chose ; des ronds vides ne se
  // comprenaient pas). Sous le tableau, la réserve : un jeton de chaque sorte. L'élève touche le bon jeton de la réserve (4,45 + 0,3 :
  // le jeton 0,1) : les 3 jetons arrivent d'un coup dans leur colonne
  // (retrancher : ils s'en vont, barrés) ; un autre jeton : la consigne
  // tremble. Avec une retenue, la colonne a 10 jetons ou plus : l'élève
  // touche le paquet de 10, qui devient 1 jeton dans la colonne de gauche,
  // autant de fois qu'il faut (3,96 + 0,05).
  //   options : {depart, rang, chiffre, signe, colonnes, consigne, traces,
  //   surFini}
  const VALEURS_JETONS = Object.freeze({0: "1", "-1": "0,1", "-2": "0,01", "-3": "0,001"});
  // La règle du tableau à jetons, sans page (testée par node --test).
  // L'état : {comptes {rang: nombre de jetons}, phase (« reserve »,
  // « echange », « fini »), echange (le rang du paquet à échanger)}. Un
  // geste : {reserve: rang} (un jeton de la réserve) ou {echange: rang} (le
  // paquet de 10 d'une colonne). Rend le nouvel état, ou null pour un refus.
  function jetonsDepart({depart, colonnes}) {
    const chiffres = chiffresParRang(depart);
    return {comptes: Object.fromEntries(colonnes.map(rang => [rang, Number(chiffres.get(rang) || 0)])), phase: "reserve", echange: null};
  }
  function jetonsSuite(comptes, colonnes) {
    const pleine = colonnes.slice().reverse().find(rang => comptes[rang] >= 10 && colonnes.includes(rang + 1));
    return pleine === undefined ? {comptes, phase: "fini", echange: null} : {comptes, phase: "echange", echange: pleine};
  }
  function jetonsGeste(etat, geste, {rang, chiffre, signe = 1, colonnes}) {
    if (etat.phase === "reserve" && geste.reserve === rang) {
      const comptes = Object.assign({}, etat.comptes, {[rang]: etat.comptes[rang] + signe * chiffre});
      return jetonsSuite(comptes, colonnes);
    }
    if (etat.phase === "echange" && geste.echange === etat.echange) {
      const r = etat.echange;
      const comptes = Object.assign({}, etat.comptes, {[r]: etat.comptes[r] - 10, [r + 1]: etat.comptes[r + 1] + 1});
      return jetonsSuite(comptes, colonnes);
    }
    return null;
  }
  function jetonsManip(zone, options) {
    const {depart, rang: rangAttendu, chiffre, signe = 1, colonnes, consigne: texteConsigne, traces = [], surFini = null, sansReponse = false} = options;
    const regle = {rang: rangAttendu, chiffre, signe, colonnes};
    let jeu = jetonsDepart({depart, colonnes});
    const compte = {get: r => jeu.comptes[r]};
    const etat = {get phase() { return jeu.phase; }, get echange() { return jeu.echange; }, get fini() { return jeu.phase === "fini"; }, refus: 0, etape: 0, venus: new Map(), partis: new Map(), echanges: []};
    compteurAides += 1;
    const bloc = document.createElement("div");
    bloc.className = `dc-jetons colonnes-${colonnes.length}`;
    bloc.style.setProperty("--colonnes", String(colonnes.length));
    const consigne = document.createElement("p");
    consigne.className = "consigne";
    consigne.id = `dc-consigne-${compteurAides}`;
    const tableau = document.createElement("div");
    tableau.className = "dc-jetons-tableau";
    tableau.setAttribute("role", "group");
    tableau.setAttribute("aria-label", "Le tableau à jetons");
    const reserve = document.createElement("div");
    reserve.className = "dc-reserve";
    reserve.setAttribute("role", "group");
    reserve.setAttribute("aria-label", "La réserve");
    const titreReserve = document.createElement("span");
    titreReserve.className = "dc-reserve-titre";
    titreReserve.textContent = "Réserve";
    reserve.append(titreReserve, ...colonnes.map(rang => {
      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = `dc-pion dc-pion-reserve l${VALEURS_JETONS[rang].length}`;
      bouton.dataset.rang = String(rang);
      bouton.dataset.valeur = VALEURS_JETONS[rang];
      bouton.textContent = VALEURS_JETONS[rang];
      bouton.setAttribute("aria-label", `Jeton de ${VALEURS_JETONS[rang]}`);
      bouton.addEventListener("click", () => toucherReserve(rang));
      return bouton;
    }));
    const trace = document.createElement("p");
    trace.className = "dc-trace";
    trace.setAttribute("role", "status");
    trace.setAttribute("aria-live", "polite");
    const annonce = zoneAnnonce();
    bloc.append(consigne, tableau, reserve, trace, annonce);
    zone.replaceChildren(bloc);

    const texteDeLaConsigne = () => (etat.phase === "echange"
      ? `Échange 10 jetons de ${VALEURS_JETONS[etat.echange]} contre 1 jeton de ${VALEURS_JETONS[etat.echange + 1]} : touche le paquet de 10.`
      : texteConsigne);
    function dessiner() {
      ecrireTexte(consigne, texteDeLaConsigne());
      tableau.replaceChildren(...colonnes.map(rang => {
        const colonne = document.createElement("div");
        colonne.className = `dc-jetons-col${rang === -1 ? " apres-virgule" : ""}`;
        colonne.dataset.rang = String(rang);
        const tete = document.createElement("span");
        tete.className = "tete";
        tete.textContent = RANGS[rang];
        const pile = document.createElement("div");
        pile.className = "pile";
        const n = compte.get(rang);
        const venus = etat.venus.get(rang) || 0;
        const partis = etat.partis.get(rang) || 0;
        const pions = [];
        for (let i = 0; i < n; i += 1) {
          const pion = document.createElement("span");
          pion.className = `dc-pion l${VALEURS_JETONS[rang].length}${i >= n - venus ? " est-venu" : ""}`;
          pion.textContent = VALEURS_JETONS[rang];
          pions.push(pion);
        }
        for (let i = 0; i < partis; i += 1) {
          const pion = document.createElement("span");
          pion.className = `dc-pion l${VALEURS_JETONS[rang].length} est-parti`;
          pion.textContent = VALEURS_JETONS[rang];
          pions.push(pion);
        }
        // Le paquet de 10 à échanger : les 10 premiers jetons, entourés.
        if (etat.phase === "echange" && etat.echange === rang) {
          const paquet = document.createElement("span");
          paquet.className = "dc-paquet";
          paquet.append(...pions.splice(0, 10));
          pile.append(paquet, ...pions);
          colonne.classList.add("a-echanger");
          colonne.tabIndex = 0;
          colonne.setAttribute("role", "button");
          colonne.setAttribute("aria-label", `Le paquet de 10 jetons de ${VALEURS_JETONS[rang]} : l’échanger`);
        } else {
          pile.append(...pions);
          colonne.setAttribute("aria-label", `${RANGS[rang]} : ${accorder(n, "jeton", "jetons")} de ${VALEURS_JETONS[rang]}`);
        }
        colonne.append(tete, pile);
        return colonne;
      }));
      reserve.querySelectorAll("button").forEach(bouton => { bouton.disabled = etat.fini; });
      const pilules = [];
      if (sansReponse) {
        // Rien sous le tableau : l'élève lit les jetons.
      } else if (etat.fini && traces.length) {
        const b = document.createElement("b");
        b.className = "ok";
        ecrireTexte(b, traces[traces.length - 1].texte);
        pilules.push(b);
      } else if (etat.echanges.length) {
        const b = document.createElement("b");
        b.className = "ici";
        b.textContent = etat.echanges[etat.echanges.length - 1];
        pilules.push(b);
      }
      trace.replaceChildren(...pilules);
    }
    function leverRefus() {
      clearTimeout(etat.refus);
      etat.refus = 0;
      consigne.classList.remove("est-refus");
    }
    function refuser() {
      clearTimeout(etat.refus);
      consigne.classList.remove("est-refus");
      void consigne.offsetWidth;
      consigne.classList.add("est-refus");
      annonce.annoncer(consigne.textContent);
      etat.refus = setTimeout(leverRefus, 1800);
    }
    // Après un geste accepté : une colonne de 10 jetons ou plus attend son
    // échange (la plus à droite d'abord, jetonsSuite) ; sinon, c'est fini.
    function toucherReserve(rang) {
      const apres = jetonsGeste(jeu, {reserve: rang}, regle);
      bloc.dispatchEvent(new CustomEvent("jeton", {bubbles: true, detail: {rang, accepte: Boolean(apres)}}));
      if (etat.fini) return;
      if (!apres) { refuser(); return; }
      leverRefus();
      etat.etape += 1;
      jeu = apres;
      if (signe > 0) etat.venus.set(rang, chiffre);
      else etat.partis.set(rang, chiffre);
      if (etat.fini) bloc.classList.add("est-finie");
      dessiner();
      annonce.annoncer(etat.fini && traces.length && !sansReponse ? traces[traces.length - 1].texte.replace(/\//g, " sur ") : `${chiffre} jetons de ${VALEURS_JETONS[rang]}`);
      if (etat.fini && typeof surFini === "function") surFini();
    }
    function echanger(rang) {
      if (etat.fini) return;
      const apres = jetonsGeste(jeu, {echange: rang}, regle);
      if (!apres) { refuser(); return; }
      leverRefus();
      etat.etape += 1;
      jeu = apres;
      etat.venus.set(rang, 0);
      etat.venus.set(rang + 1, 1);
      etat.echanges.push(`10 jetons de ${VALEURS_JETONS[rang]} = 1 jeton de ${VALEURS_JETONS[rang + 1]}`);
      if (etat.fini) bloc.classList.add("est-finie");
      dessiner();
      annonce.annoncer(etat.fini && traces.length && !sansReponse ? traces[traces.length - 1].texte.replace(/\//g, " sur ") : etat.echanges[etat.echanges.length - 1]);
      if (etat.fini && typeof surFini === "function") surFini();
    }
    // Un toucher dans le tableau : l'échange (sur la bonne colonne), sinon
    // la consigne tremble.
    tableau.addEventListener("click", event => {
      const colonne = event.target.closest && event.target.closest(".dc-jetons-col");
      if (!colonne || etat.fini) return;
      const rang = Number(colonne.dataset.rang);
      if (etat.phase === "echange") echanger(rang);
      else refuser();
    });
    tableau.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const colonne = event.target.closest && event.target.closest(".dc-jetons-col");
      if (!colonne) return;
      event.preventDefault();
      event.stopPropagation();
      echanger(Number(colonne.dataset.rang));
    });
    dessiner();
    return {
      outil: "jetons",
      element: bloc,
      detruire() {
        clearTimeout(etat.refus);
        annonce.arreter();
      },
      mesurer() {},
      get deborde() { return bloc.scrollWidth > zone.clientWidth + 1; },
      get fini() { return etat.fini; },
      get etape() { return etat.etape; },
      get phase() { return etat.phase; },
      get comptes() { return Object.assign({}, jeu.comptes); },
      toucherReserve,
      echanger
    };
  }

  // ============================================ modules lot 6 (04/11/2026) :
  // les fractions du CM1 (F2, F5, F6, F8). Décisions de Gwenaël du 04/11
  // (planches choix-1 à choix-4, puis la version 2, choix-5 à choix-7) :
  //  - tout se pose sur la DROITE GRADUÉE : l'unité, c'est l'écart entre deux
  //    entiers, la même pour toutes les bandes et toute la barre d'un dessin ;
  //    plus de bande « 1 » de référence au-dessus ;
  //  - Je manipule : les bandes du site (palette de la charte, étiquette
  //    « 1/d » toujours écrite), posées bout à bout ; gestes poser, couper,
  //    fondre, enlever ; ce qu'on touche est entouré de bleu ;
  //  - Je représente, l'aide, J'écris, la correction, « À retenir » : le
  //    schéma en barres, une seule barre de 0 à a posée sur la droite, les
  //    parts prises en bleu, enlevées hachurées, l'accolade « ?/4 » dessous.

  // La palette des bandes (`COULEURS_BANDES_FRACTIONS` de
  // packages/charte/src/charte.js, recopiée : Défi calcul se charge sans
  // module ES). Les dénominateurs absents du site (7, 9, 11…) : gris.
  const COULEURS_BANDES = Object.freeze({1: "#fff7e6", 2: "#facc15", 3: "#e9d5ff", 4: "#84cc16", 5: "#0ea5e9", 6: "#f97316", 8: "#f472b6", 10: "#b91c1c", 12: "#7dd3fc"});
  const BANDE_GRISE = "#cbd5e1";
  const couleurBande = d => COULEURS_BANDES[d] || BANDE_GRISE;
  // Sur le rouge des dixièmes, l'étiquette s'écrit en blanc (en noir, elle
  // ne se lit pas en noir et blanc).
  const encreBande = d => (d === 10 ? "#fff" : "#111827");
  const FRACTIONS = Object.freeze({largeur: 400, gauche: 18, longueur: 360, bande: 44, barre: 38, bleu: "#5d86c8", clair: "#dce7f7", cherche: "#0755b8", trouve: "#147447", encre: "#143451", enleve: "#6b7c8f"});

  // Une étiquette dans un dessin : « 1/4 » en fraction, « 1 » ou « ? » en
  // texte (centrée sur y).
  function etiquetteSvg(x, y, texte, {taille = 18, encre = FRACTIONS.encre} = {}) {
    const t = String(texte);
    const m = /^(\?|\d+)\/(\?|\d+)$/.exec(t);
    const couleur = valeur => (valeur === "?" ? FRACTIONS.cherche : encre);
    if (!m) return `<text x="${x}" y="${y + taille * .36}" text-anchor="middle" font-size="${taille}" font-weight="800" fill="${couleur(t)}">${t}</text>`;
    const w = Math.max(m[1].length, m[2].length) * taille * .62 + 6;
    return `<text x="${x}" y="${y - 3}" text-anchor="middle" font-size="${taille}" font-weight="800" fill="${couleur(m[1])}">${m[1]}</text>`
      + `<line x1="${x - w / 2}" y1="${y + 1}" x2="${x + w / 2}" y2="${y + 1}" stroke="${encre}" stroke-width="2"/>`
      + `<text x="${x}" y="${y + taille + 1}" text-anchor="middle" font-size="${taille}" font-weight="800" fill="${couleur(m[2])}">${m[2]}</text>`;
  }
  // « 3/4 » se lit « 3 sur 4 ».
  const lireFraction = texte => String(texte).replace(/\//g, " sur ");
  // Des hachures dans un rectangle, sans `clipPath` (deux dessins dans une
  // page ne se marchent pas dessus) : chaque trait est coupé au bord.
  function hachuresSvg(x, y, w, h, couleur = FRACTIONS.bleu) {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`;
    for (let t = -h + 4; t < w; t += 9) {
      const de = Math.max(0, -t);
      const a = Math.min(h, w - t);
      if (a <= de) continue;
      s += `<line x1="${(x + t + de).toFixed(2)}" y1="${(y + h - de).toFixed(2)}" x2="${(x + t + a).toFixed(2)}" y2="${(y + h - a).toFixed(2)}" stroke="${couleur}" stroke-width="2.2"/>`;
    }
    return s;
  }

  // La droite graduée, de 0 à a : un trait épais à chaque entier, un petit
  // trait à chaque part (`d` parts par unité, si elles se voient). Les
  // entiers écrits dessous ; `cache` : l'entier cherché porte « ? » ;
  // `ecrits` : {entier: « 18/6 »} — l'entier réécrit en fraction (J'écris,
  // en vert, ou en noir sur la correction).
  //   Rend {svg, bas} (le bas des étiquettes).
  // `entiers` : les premières unités sans leurs petits traits (F5-3, des
  // blocs pleins).
  // Modules lot 6b (F1) : `nombres` [{k, texte, cherche, trouve}] — les
  // décimaux écrits sous les graduations (k : la graduation, en parts de
  // 1/d) ; ils remplacent les entiers. Les graduations franchies portent
  // leur décimal, celle qu'on cherche « ? » (décision du 04/11, 20 h 15).
  function droiteSvg(y, a, d, {cache = null, ecrits = {}, hautEtiquettes = 24, entiers = 0, nombres = null} = {}) {
    const {gauche: G, longueur: L, encre} = FRACTIONS;
    const u = L / a;
    let s = `<line x1="${G}" y1="${y}" x2="${G + L + 12}" y2="${y}" stroke="${encre}" stroke-width="2.4"/>`
      + `<path d="M${G + L + 12} ${y - 6} L${G + L + 22} ${y} L${G + L + 12} ${y + 6}" fill="${encre}"/>`;
    if (d > 1 && u / d >= 5) {
      for (let k = entiers * d + 1; k < a * d; k += 1) if (k % d) s += `<line x1="${(G + k * u / d).toFixed(2)}" y1="${y - 6}" x2="${(G + k * u / d).toFixed(2)}" y2="${y + 6}" stroke="${encre}" stroke-width="1.4"/>`;
    }
    if (nombres) {
      for (let k = 0; k <= a; k += 1) s += `<line x1="${(G + k * u).toFixed(2)}" y1="${y - 11}" x2="${(G + k * u).toFixed(2)}" y2="${y + 11}" stroke="${encre}" stroke-width="3"/>`;
      nombres.forEach(n => {
        const x = G + n.k * u / d;
        if (n.cherche) {
          s += `<rect x="${(x - 14).toFixed(2)}" y="${y + 13}" width="28" height="24" rx="6" fill="#fff" stroke="${FRACTIONS.cherche}" stroke-width="2.6"/>` + etiquetteSvg(x, y + 25, "?", {taille: 17});
        } else {
          s += etiquetteSvg(x, y + 24, n.texte, {taille: String(n.texte).length > 3 ? 14 : 16, encre: n.trouve ? FRACTIONS.trouve : encre});
        }
      });
      return {svg: s, bas: y + 13 + hautEtiquettes};
    }
    for (let k = 0; k <= a; k += 1) {
      const x = G + k * u;
      s += `<line x1="${x.toFixed(2)}" y1="${y - 11}" x2="${x.toFixed(2)}" y2="${y + 11}" stroke="${encre}" stroke-width="3"/>`;
      const ecrit = ecrits[k];
      if (k === cache) {
        s += `<rect x="${(x - 14).toFixed(2)}" y="${y + 13}" width="28" height="24" rx="6" fill="#fff" stroke="${FRACTIONS.cherche}" stroke-width="2.6"/>` + etiquetteSvg(x, y + 25, "?", {taille: 17});
      } else if (ecrit) {
        s += etiquetteSvg(x, y + 30, ecrit.texte, {taille: 16, encre: ecrit.trouve ? FRACTIONS.trouve : encre});
      } else {
        s += etiquetteSvg(x, y + 24, String(k), {taille: 17});
      }
    }
    return {svg: s, bas: y + 13 + hautEtiquettes};
  }
  const lireDroite = (a, cache, ecrits = {}, nombres = null) => (nombres
    ? `Graduations : ${nombres.slice().sort((p, q) => p.k - q.k).map(n => (n.cherche ? "?" : n.texte)).join(" ; ")}.`
    : `Graduations : ${Array.from({length: a + 1}, (_, k) => (k === cache ? "?" : ecrits[k] ? lireFraction(ecrits[k].texte) : String(k))).join(", ")}.`);

  // ----------------------------------------- le schéma en barres sur la droite
  //
  // Une seule barre, de 0 à a, posée sur la droite graduée ; d parts fines
  // par unité, un trait épais à chaque entier et toutes les `gros` parts
  // (F6 : chaque tiers coupé en 5). Les `pris` premières parts en bleu ;
  // parmi elles, les `retire` dernières hachurées (on les enlève) ;
  // `entiers` : les premières unités en blocs pleins, sans leurs parts
  // (F5-3 : 43 parts fines ne se lisaient pas). Au-dessus, des crochets
  // {de, a, texte, trouve} (en parts) ; dessous, l'accolade {de, a, texte,
  // cherche, trouve}. Aucun chiffre de la réponse : on compte des parts.
  //   o : {outil: "barre-droite", a, d, pris, retire, entiers, gros, haut,
  //        bas, cache, ecrits, hautEtiquettes}
  function planBarreDroite(o) {
    const a = o.a || 1;
    const d = o.d || 1;
    const u = FRACTIONS.longueur / a;
    const w = u / d;
    const entiers = Array.from({length: a + 1}, (_, k) => FRACTIONS.gauche + k * u);
    const parts = Array.from({length: a * d}, (_, k) => ({x: FRACTIONS.gauche + k * w, w}));
    return {a, d, u, w, entiers, parts};
  }
  function barreDroite(o) {
    const plan = planBarreDroite(o);
    const {a, d, w} = plan;
    const {gauche: G, longueur: L, barre: R, encre, bleu} = FRACTIONS;
    const haut = o.haut || [];
    const yb = haut.length ? (haut.some(h => String(h.texte).includes("/")) ? 46 : 32) : 6;
    const pris = o.pris || 0;
    const retire = o.retire || 0;
    const entiers = o.entiers || 0;
    let s = "";
    for (let k = 0; k < a * d; k += 1) {
      const x = G + k * w;
      if (k < pris - retire) s += `<rect x="${x.toFixed(2)}" y="${yb}" width="${(w + .6).toFixed(2)}" height="${R}" fill="${bleu}"/>`;
      else if (k < pris) s += hachuresSvg(x, yb, w, R);
      else s += `<rect x="${x.toFixed(2)}" y="${yb}" width="${w.toFixed(2)}" height="${R}" fill="#fff"/>`;
    }
    for (let k = 1; k < a * d; k += 1) {
      if (k < entiers * d && k % d) continue;
      const epais = k % d === 0 ? 4 : o.gros && k % o.gros === 0 ? 3.4 : 1.3;
      s += `<line x1="${(G + k * w).toFixed(2)}" y1="${yb}" x2="${(G + k * w).toFixed(2)}" y2="${yb + R}" stroke="${encre}" stroke-width="${epais}"/>`;
    }
    s += `<rect x="${G}" y="${yb}" width="${L}" height="${R}" fill="none" stroke="${encre}" stroke-width="2.6"/>`;
    haut.forEach(h => {
      // Un crochet caché (J'écris : il apparaît à son étape) garde sa place.
      if (h.masque) return;
      const x1 = G + h.de * w;
      const x2 = G + h.a * w;
      const couleur = h.trouve ? FRACTIONS.trouve : encre;
      s += `<path d="M${(x1 + 2).toFixed(2)} ${yb - 3} L${(x1 + 2).toFixed(2)} ${yb - 9} L${(x2 - 2).toFixed(2)} ${yb - 9} L${(x2 - 2).toFixed(2)} ${yb - 3}" fill="none" stroke="${couleur}" stroke-width="2"/>`
        + etiquetteSvg((x1 + x2) / 2, String(h.texte).includes("/") ? yb - 30 : yb - 20, h.texte, {taille: 16, encre: couleur});
    });
    const droite = droiteSvg(yb + R + 14, a, d, {cache: o.cache, ecrits: o.ecrits || {}, hautEtiquettes: o.hautEtiquettes || 24, entiers, nombres: o.nombres || null});
    s += droite.svg;
    let H = droite.bas + 4;
    if (o.bas) {
      const x1 = G + o.bas.de * w + 2;
      const x2 = G + o.bas.a * w - 2;
      const mx = (x1 + x2) / 2;
      const ya = droite.bas;
      const fraction = String(o.bas.texte).includes("/");
      const bord = o.bas.trouve ? FRACTIONS.trouve : o.bas.cherche ? FRACTIONS.cherche : encre;
      const lw = 54;
      const lh = fraction ? 44 : 28;
      s += `<path d="M${x1.toFixed(2)} ${ya} Q${x1.toFixed(2)} ${ya + 7} ${(x1 + 7).toFixed(2)} ${ya + 7} L${(mx - 6).toFixed(2)} ${ya + 7} Q${mx.toFixed(2)} ${ya + 7} ${mx.toFixed(2)} ${ya + 13} Q${mx.toFixed(2)} ${ya + 7} ${(mx + 6).toFixed(2)} ${ya + 7} L${(x2 - 7).toFixed(2)} ${ya + 7} Q${x2.toFixed(2)} ${ya + 7} ${x2.toFixed(2)} ${ya}" fill="none" stroke="${encre}" stroke-width="2.4"/>`
        + `<rect x="${(mx - lw / 2).toFixed(2)}" y="${ya + 15}" width="${lw}" height="${lh}" rx="8" fill="#fff" stroke="${bord}" stroke-width="${o.bas.cherche || o.bas.trouve ? 2.8 : 2}"/>`
        + etiquetteSvg(mx, ya + 15 + (fraction ? 20 : 14), o.bas.texte, {taille: 17, encre: o.bas.trouve ? FRACTIONS.trouve : encre});
      H = ya + 15 + lh + 4;
    }
    return `<svg class="dc-fractions" viewBox="0 0 ${FRACTIONS.largeur} ${Math.ceil(H)}" role="img" aria-label="${decrireBarreDroite(o)}">${s}</svg>`;
  }
  // Ce que dit le dessin, sans la réponse (les textes écrits seulement) :
  // « 3/4 » se lit « 3 sur 4 ».
  function decrireBarreDroite(o) {
    const morceaux = ["Schéma en barres posé sur la droite graduée.", lireDroite(o.a || 1, o.cache, o.ecrits || {}, o.nombres || null)];
    morceaux.push(o.retire ? "Des parts sont en bleu, d’autres sont hachurées : on les enlève." : "Des parts sont en bleu.");
    const hauts = (o.haut || []).filter(h => !h.masque);
    if (hauts.length) morceaux.push(`Au-dessus : ${hauts.map(h => lireFraction(h.texte)).join(", ")}.`);
    if (o.bas) morceaux.push(`${o.bas.cherche ? "En dessous, à trouver" : "En dessous"} : ${lireFraction(o.bas.texte)}.`);
    return morceaux.join(" ");
  }

  // ------------------------------------------------- les bandes sur la droite
  //
  // Je manipule (F2, F5, F6, F8) : les bandes du site posées bout à bout
  // au-dessus de la droite graduée (0 à a), la réserve dessous. Le geste est
  // forcé, une étape à la fois :
  //  - poser {d, n} : toucher la bonne bande de la réserve, n bandes « 1/d »
  //    se posent au bout ;
  //  - couper {piece, en} : toucher la bande entourée de bleu, elle se coupe
  //    en `en` morceaux égaux (le demi en deux quarts ; « 1 » en tiers) ;
  //  - fondre {piece, n, d} : toucher le paquet entouré de bleu (n bandes
  //    bout à bout), il devient UNE bande « 1/d » (5 cinquièmes → « 1 », de
  //    la couleur des cinquièmes) ;
  //  - enlever {piece, parmi} : toucher une des bandes à enlever ; la plus à
  //    droite passe en pointillés.
  // Un faux toucher fait trembler la consigne. Au bout, l'appli écrit le
  // calcul, avec l'étape (« 1/2 + 1/4 = 2/4 + 1/4 = 3/4 »).
  //   Une bande : {d (1 pour « 1 »), de (la couleur d'une bande « 1 » : celle
  //   des parts qui l'ont faite, ou qu'elle va donner), enleve, neuf}.

  // La règle, sans page (testée par node --test). L'état : {pieces, etape,
  // fini}. Un geste : {reserve: d} ou {piece: i}. Rend le nouvel état, ou
  // null pour un refus.
  function bandesDepart(depart) {
    return {pieces: depart.map(p => Object.freeze({d: p.d, de: p.de || p.d, enleve: Boolean(p.enleve), neuf: false})), etape: 0, fini: false};
  }
  function bandesGeste(etat, geste, etapes) {
    const e = etapes[etat.etape];
    if (!e || etat.fini) return null;
    const pieces = etat.pieces.map(p => Object.freeze(Object.assign({}, p, {neuf: false})));
    const bande = (d, de = d) => Object.freeze({d, de, enleve: false, neuf: true});
    let apres = null;
    if (e.geste === "poser" && geste.reserve === e.d) {
      apres = pieces.concat(Array.from({length: e.n}, () => bande(e.d)));
    } else if (e.geste === "couper" && geste.piece === e.piece) {
      const p = pieces[e.piece];
      apres = [...pieces.slice(0, e.piece), ...Array.from({length: e.en}, () => bande(p.d * e.en)), ...pieces.slice(e.piece + 1)];
    } else if (e.geste === "fondre" && geste.piece >= e.piece && geste.piece < e.piece + e.n) {
      const p = pieces[e.piece];
      apres = [...pieces.slice(0, e.piece), bande(e.d, e.d === 1 ? p.d : e.d), ...pieces.slice(e.piece + e.n)];
    } else if (e.geste === "enlever" && e.parmi.includes(geste.piece) && !pieces[geste.piece].enleve) {
      apres = pieces.slice();
      apres[e.piece] = Object.freeze(Object.assign({}, pieces[e.piece], {enleve: true, neuf: true}));
    }
    if (!apres) return null;
    const etape = etat.etape + 1;
    return {pieces: apres, etape, fini: etape >= etapes.length};
  }
  // La longueur posée, en unités (les bandes enlevées comptent : elles
  // restent dessinées).
  const longueurBandes = pieces => pieces.reduce((s, p) => s + 1 / p.d, 0);
  // Les places des bandes sur la droite (x, largeur), pour les tests et la
  // page : une unité a la même longueur pour toutes.
  function planBandes(pieces, a) {
    const u = FRACTIONS.longueur / a;
    let x = FRACTIONS.gauche;
    return pieces.map(p => {
      const place = {x, w: u / p.d};
      x += u / p.d;
      return place;
    });
  }
  // Le dessin de l'outil : les bandes, la droite, la réserve. `cible` : les
  // bandes à entourer de bleu [de, a[ ; `reserve` : les bandes de la réserve
  // (rien quand il n'y a rien à poser).
  // Modules lot 6b (F1) : les décimaux sous la droite, d'après la
  // longueur posée — les graduations franchies portent leur décimal, la
  // graduation où arrivent les bandes « ? » (quand c'est fini), les entiers
  // toujours ; jamais le décimal de l'arrivée (c'est la réponse).
  const decimalDe = (k, grad) => String(Math.round(k / grad * 1000) / 1000).replace(".", ",");
  // `arrivee` : la graduation où les bandes vont arriver (4/2 : l'entier
  // 2) — rien n'y est écrit avant la fin.
  function nombresBandes(longueur, a, grad, fini, arrivee = null) {
    const fin = Math.round(longueur * grad);
    const nombres = [];
    for (let k = 0; k <= a * grad; k += 1) {
      if (fini && k === fin) nombres.push(Object.freeze({k, texte: "?", cherche: true}));
      else if (k === arrivee) continue;
      else if (k % grad === 0 || k < fin) nombres.push(Object.freeze({k, texte: decimalDe(k, grad)}));
    }
    return nombres;
  }
  function bandesSvg({pieces, a, grad, reserve = [], reserveVide = false, cible = null, fini = false, nombres = null, image = false, revele = null}) {
    const {gauche: G, longueur: L, bande: h, encre} = FRACTIONS;
    const u = L / a;
    const places = planBandes(pieces, a);
    const y = 8;
    let s = "";
    pieces.forEach((p, i) => {
      const {x, w} = places[i];
      const fond = p.enleve ? "#fff" : couleurBande(p.d === 1 ? p.de : p.d);
      s += `<rect data-piece="${i}" x="${x.toFixed(2)}" y="${y}" width="${w.toFixed(2)}" height="${h}" fill="${fond}" stroke="${p.enleve ? FRACTIONS.enleve : "#111827"}" stroke-width="${p.enleve ? 2 : 1.4}"${p.enleve ? ' stroke-dasharray="6 4"' : ""}/>`;
      if (w >= 16) s += `<g pointer-events="none">${etiquetteSvg(x + w / 2, y + h / 2, p.d === 1 ? "1" : `1/${p.d}`, {taille: w < 26 ? 11 : w < 34 ? 13 : 16, encre: p.enleve ? FRACTIONS.enleve : encreBande(p.d === 1 ? p.de : p.d)})}</g>`;
      if (p.neuf && !p.enleve) s += `<rect x="${(x + 1.6).toFixed(2)}" y="${y + 1.6}" width="${Math.max(0, w - 3.2).toFixed(2)}" height="${h - 3.2}" fill="none" stroke="${FRACTIONS.trouve}" stroke-width="3" pointer-events="none"/>`;
    });
    if (cible) {
      const p1 = places[cible[0]];
      const p2 = places[cible[1] - 1];
      s += `<rect class="dc-cible" x="${(p1.x - 3).toFixed(2)}" y="${y - 4}" width="${(p2.x + p2.w - p1.x + 6).toFixed(2)}" height="${h + 8}" rx="7" fill="none" stroke="${FRACTIONS.cherche}" stroke-width="3.5" pointer-events="none"/>`;
    }
    if (fini) {
      const bout = places.filter((_, i) => !pieces[i].enleve).pop();
      if (bout) s += `<line x1="${(bout.x + bout.w).toFixed(2)}" y1="${y + h}" x2="${(bout.x + bout.w).toFixed(2)}" y2="${y + h + 14}" stroke="${FRACTIONS.cherche}" stroke-width="2" stroke-dasharray="4 3"/>`;
    }
    // Les décimaux : à l'arrivée, « ? », ou le décimal sur la correction
    // (`revele`).
    const marques = nombres && revele !== null ? nombres.map(n => (n.cherche ? Object.freeze({k: n.k, texte: revele}) : n)) : nombres;
    const droite = droiteSvg(y + h + 14, a, grad, {nombres: marques});
    s += droite.svg;
    let H = droite.bas + 2;
    if (reserve.length) {
      s += `<line x1="${G}" y1="${H}" x2="${G + L}" y2="${H}" stroke="#cfdde8" stroke-width="2"/>`;
      const yr = H + 8;
      const largeurs = reserve.map(d => u / d);
      let x = G + (L - largeurs.reduce((m, n) => m + n, 0) - (reserve.length - 1) * 14) / 2;
      reserve.forEach((d, k) => {
        if (reserveVide) { x += largeurs[k] + 14; return; }
        s += `<g data-reserve="${d}" class="dc-bande-reserve"><rect x="${x.toFixed(2)}" y="${yr}" width="${largeurs[k].toFixed(2)}" height="${h - 4}" fill="${couleurBande(d)}" stroke="#111827" stroke-width="1.4"/>`
          + `<g pointer-events="none">${etiquetteSvg(x + largeurs[k] / 2, yr + (h - 4) / 2, `1/${d}`, {taille: largeurs[k] < 34 ? 12 : 16, encre: encreBande(d)})}</g></g>`;
        x += largeurs[k] + 14;
      });
      H = yr + h;
    }
    if (image) return `<svg class="dc-fractions dc-bandes-image" viewBox="0 0 ${FRACTIONS.largeur} ${Math.ceil(H)}" role="img" aria-label="${decrireBandesImage(pieces, marques)}">${s}</svg>`;
    return `<svg class="dc-bandes-svg" viewBox="0 0 ${FRACTIONS.largeur} ${Math.ceil(H)}">${s}</svg>`;
  }
  // F1 : les bandes posées, dessinées comme une image (Je représente,
  // l'aide de l'entraînement, la correction, « À retenir »).
  //   o : {outil: "bandes-droite", pieces, a, grad, decimaux, revele (le
  //        décimal de l'arrivée, sur la correction ; sinon « ? »)}
  function bandesImage(o) {
    const nombres = o.decimaux ? nombresBandes(longueurBandes(o.pieces), o.a, o.grad, true) : null;
    return bandesSvg({pieces: o.pieces, a: o.a, grad: o.grad, fini: true, nombres, image: true, revele: o.revele === undefined ? null : o.revele});
  }
  // Sans la réponse : les bandes posées et les graduations écrites.
  function decrireBandesImage(pieces, nombres) {
    const graduations = nombres ? ` ${lireDroite(0, null, {}, nombres)}` : "";
    return `Bandes posées sur la droite graduée : ${pieces.filter(p => !p.enleve).map(p => (p.d === 1 ? "1" : `1 sur ${p.d}`)).join(", ")}.${graduations}`;
  }
  // Ce que voit l'élève, pour un lecteur d'écran.
  function decrireBandes(pieces) {
    if (!pieces.length) return "La droite graduée, rien n’est posé.";
    const restes = pieces.filter(p => !p.enleve).map(p => (p.d === 1 ? "1" : `1 sur ${p.d}`));
    const enleves = pieces.filter(p => p.enleve).length;
    return `Sur la droite : ${restes.join(", ") || "rien"}${enleves ? ` ; ${accorder(enleves, "bande enlevée", "bandes enlevées")}` : ""}.`;
  }

  // L'outil à toucher. options : {a, grad, depart, etapes (chacune avec sa
  // consigne), reserve, traces, surFini}. Au clavier : Entrée ou Espace font
  // le geste attendu.
  function bandesManip(zone, options) {
    const {a, grad = 1, depart = [], etapes, reserve = [], traces = [], surFini = null, decimaux = false, arrivee = null, sansReponse = false} = options;
    let jeu = bandesDepart(depart);
    const etat = {refus: 0, premier: true};
    compteurAides += 1;
    const bloc = document.createElement("div");
    bloc.className = "dc-bandes";
    const consigne = document.createElement("p");
    consigne.className = "consigne";
    consigne.id = `dc-consigne-${compteurAides}`;
    const scene = document.createElement("div");
    scene.className = "dc-bandes-scene dc-attente";
    scene.tabIndex = 0;
    scene.setAttribute("role", "button");
    scene.setAttribute("aria-describedby", consigne.id);
    const trace = document.createElement("p");
    trace.className = "dc-trace";
    trace.setAttribute("role", "status");
    trace.setAttribute("aria-live", "polite");
    const annonce = zoneAnnonce();
    bloc.append(consigne, scene, trace, annonce);
    zone.replaceChildren(bloc);

    const attendue = () => etapes[jeu.etape] || null;
    function cible() {
      const e = attendue();
      if (!e || jeu.fini) return null;
      if (e.geste === "couper") return [e.piece, e.piece + 1];
      if (e.geste === "fondre") return [e.piece, e.piece + e.n];
      return null;
    }
    function dessiner() {
      const e = attendue();
      // Fini : la consigne s'efface, la trace écrit le calcul.
      ecrireTexte(consigne, jeu.fini ? "" : e.consigne);
      // La réserve, tant qu'il y a une bande à poser (la même place après :
      // rien ne bouge, elle est seulement vide).
      const poser = etapes.some(x => x.geste === "poser");
      const resteAPoser = !jeu.fini && etapes.slice(jeu.etape).some(x => x.geste === "poser");
      // F1 (lot 6b) : les décimaux s'écrivent sous les graduations franchies.
      const nombres = decimaux ? nombresBandes(longueurBandes(jeu.pieces.filter(p => !p.enleve)), a, grad, jeu.fini, arrivee) : null;
      scene.innerHTML = bandesSvg({pieces: jeu.pieces, a, grad, reserve: poser ? reserve : [], reserveVide: poser && !resteAPoser, cible: cible(), fini: jeu.fini, nombres});
      scene.setAttribute("aria-label", `${decrireBandes(jeu.pieces)}${jeu.fini ? "" : " Touche pour faire le geste."}`);
      const pilules = [];
      if (jeu.fini && traces.length && !sansReponse) {
        const b = document.createElement("b");
        b.className = "ok";
        ecrireTexte(b, traces[traces.length - 1].texte);
        pilules.push(b);
      }
      trace.replaceChildren(...pilules);
    }
    function leverRefus() {
      clearTimeout(etat.refus);
      etat.refus = 0;
      consigne.classList.remove("est-refus");
    }
    function refuser() {
      clearTimeout(etat.refus);
      consigne.classList.remove("est-refus");
      void consigne.offsetWidth;
      consigne.classList.add("est-refus");
      annonce.annoncer(consigne.textContent);
      etat.refus = setTimeout(leverRefus, 1800);
    }
    function jouer(geste) {
      if (jeu.fini) return;
      const apres = bandesGeste(jeu, geste, etapes);
      bloc.dispatchEvent(new CustomEvent("bande", {bubbles: true, detail: Object.assign({accepte: Boolean(apres)}, geste)}));
      if (!apres) { refuser(); return; }
      leverRefus();
      jeu = apres;
      if (etat.premier) { etat.premier = false; scene.classList.remove("dc-attente"); }
      if (jeu.fini) bloc.classList.add("est-finie");
      dessiner();
      annonce.annoncer(jeu.fini && traces.length && !sansReponse ? lireFraction(traces[traces.length - 1].texte) : decrireBandes(jeu.pieces));
      if (jeu.fini && typeof surFini === "function") surFini();
    }
    // Le geste attendu, comme si l'élève touchait la bonne chose (clavier).
    function gesteAttendu() {
      const e = attendue();
      if (!e) return null;
      if (e.geste === "poser") return {reserve: e.d};
      return {piece: e.piece};
    }
    scene.addEventListener("click", event => {
      const cibleTouchee = event.target.closest && event.target.closest("[data-piece], [data-reserve]");
      if (!cibleTouchee) { if (!jeu.fini) refuser(); return; }
      if (cibleTouchee.hasAttribute("data-reserve")) jouer({reserve: Number(cibleTouchee.getAttribute("data-reserve"))});
      else jouer({piece: Number(cibleTouchee.getAttribute("data-piece"))});
    });
    scene.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      const geste = gesteAttendu();
      if (geste) jouer(geste);
    });
    if (!etapes.length) jeu.fini = true;
    dessiner();
    return {
      outil: "bandes",
      element: bloc,
      detruire() {
        clearTimeout(etat.refus);
        annonce.arreter();
      },
      mesurer() {},
      get deborde() { return bloc.scrollWidth > zone.clientWidth + 1; },
      get fini() { return jeu.fini; },
      get etape() { return jeu.etape; },
      get pieces() { return jeu.pieces.map(p => ({d: p.d, de: p.de, enleve: p.enleve})); },
      jouer,
      gesteAttendu
    };
  }

  // ------------------------------------------- F3 : le tout et ses parts
  //
  // Modules lot 6b (décisions du 04/11, planche choix-6 et retouches de
  // 20 h 15) : en haut, une barre entière avec le tout écrit dedans
  // (« 60 kg ») ; dessous, COLLÉE, une barre de même longueur coupée en d
  // cases égales ; la 1re case, la part cherchée, en bleu clair entourée
  // d'un trait bleu épais, le « ? » écrit dedans en bleu. Aucun chiffre de
  // la réponse : la correction l'écrit dans la case.
  //   o : {outil: "tout-parts", tout (texte), d, trouve: null | {texte, vert}}
  const PARTS = Object.freeze({barre: 46, pas: 24, rayon: 9, parRangeeTas: 14, clair: "#dce7f7"});
  function caseCherchee(x, y, w, h, texte, couleur) {
    const taille = Math.min(24, (w - 8) / (Math.max(1, String(texte).length) * .6));
    return `<rect x="${x.toFixed(2)}" y="${y}" width="${w.toFixed(2)}" height="${h}" fill="${PARTS.clair}"/>`
      + `<text x="${(x + w / 2).toFixed(2)}" y="${(y + h / 2 + taille * .36).toFixed(2)}" text-anchor="middle" font-size="${taille.toFixed(1)}" font-weight="800" fill="${couleur}">${texte}</text>`;
  }
  function toutParts(o) {
    const {gauche: G, longueur: L, encre, cherche} = FRACTIONS;
    const R = PARTS.barre;
    const w = L / o.d;
    const y1 = 4;
    const y2 = y1 + R;
    let s = `<rect x="${G}" y="${y1}" width="${L}" height="${R}" fill="#fff"/>`
      + `<text x="${G + L / 2}" y="${y1 + R / 2 + 7}" text-anchor="middle" font-size="20" font-weight="800" fill="${encre}">${o.tout}</text>`;
    for (let k = 0; k < o.d; k += 1) {
      if (k === 0) s += caseCherchee(G, y2, w, R, o.trouve ? o.trouve.texte : "?", o.trouve ? (o.trouve.vert ? FRACTIONS.trouve : encre) : cherche);
      else s += `<rect x="${(G + k * w).toFixed(2)}" y="${y2}" width="${w.toFixed(2)}" height="${R}" fill="#fff"/>`;
    }
    s += `<rect x="${G}" y="${y1}" width="${L}" height="${R}" fill="none" stroke="${encre}" stroke-width="2.6"/>`;
    for (let k = 0; k < o.d; k += 1) s += `<rect x="${(G + k * w).toFixed(2)}" y="${y2}" width="${w.toFixed(2)}" height="${R}" fill="none" stroke="${encre}" stroke-width="2.6"/>`;
    s += `<rect x="${G + 1.6}" y="${y2 + 1.6}" width="${(w - 3.2).toFixed(2)}" height="${R - 3.2}" fill="none" stroke="${o.trouve && o.trouve.vert ? FRACTIONS.trouve : cherche}" stroke-width="3.5"/>`;
    return `<svg class="dc-fractions dc-tout-parts" viewBox="0 0 ${FRACTIONS.largeur} ${y2 + R + 4}" role="img" aria-label="${decrireToutParts(o)}">${s}</svg>`;
  }
  function decrireToutParts(o) {
    return `Schéma en barres. En haut, le tout : ${o.tout}. En dessous, ${o.d} parts égales. La première part, ${o.trouve ? `: ${o.trouve.texte}` : "à trouver : ?"}.`.replace("part, :", "part :");
  }

  // Les billes « façon Singapour » (F3, Je manipule) : les billes sont dans
  // la barre du haut (le tas) ; un toucher sur le tas = un tour de
  // distribution, une bille tombe dans chaque case. Le tas vide, la 1re
  // case se colorie (la part cherchée) ; un toucher de plus fait trembler
  // la consigne. La règle, sans page (testée par node --test). L'état :
  // {tours, fini} ; un geste : {tas: true} ou {case: i}. Rend le nouvel
  // état, ou null pour un refus.
  function billesDepart() {
    return {tours: 0, fini: false};
  }
  function billesGeste(etat, geste, {n, d}) {
    if (etat.fini || !geste || geste.tas !== true || (etat.tours + 1) * d > n) return null;
    const tours = etat.tours + 1;
    return {tours, fini: tours * d === n};
  }
  // La place des billes : le tas en rangées de 14, chaque case en rangées
  // de ce qui y tient ; les hauteurs sont fixées au départ (rien ne bouge
  // pendant le partage).
  function planBilles({n, d}) {
    const {pas} = PARTS;
    const w = FRACTIONS.longueur / d;
    const parCase = Math.max(1, Math.floor((w - 4) / pas));
    const hTas = Math.max(PARTS.barre, Math.ceil(n / PARTS.parRangeeTas) * pas + 12);
    const hCase = Math.max(PARTS.barre, Math.ceil(n / d / parCase) * pas + 12);
    return {w, parCase, hTas, hCase};
  }
  function rangeesDe(nombre, parRangee, cx, cy) {
    const rangees = Math.ceil(nombre / parRangee);
    const places = [];
    for (let b = 0; b < nombre; b += 1) {
      const r = Math.floor(b / parRangee);
      const dansRangee = Math.min(parRangee, nombre - r * parRangee);
      places.push([cx - (dansRangee - 1) * PARTS.pas / 2 + (b % parRangee) * PARTS.pas, cy - (rangees - 1) * PARTS.pas / 2 + r * PARTS.pas]);
    }
    return places;
  }
  function billesSvg({n, d, tout, tours, fini, cible = false}) {
    const {gauche: G, longueur: L, encre, bleu, cherche} = FRACTIONS;
    const {w, parCase, hTas, hCase} = planBilles({n, d});
    const y1 = 6;
    const y2 = y1 + hTas;
    const tas = n - tours * d;
    const bille = (x, y, couleur, bord = encre, epais = 1.6) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${PARTS.rayon}" fill="${couleur}" stroke="${bord}" stroke-width="${epais}"/>`;
    let s = `<g data-tas="1"><rect x="${G}" y="${y1}" width="${L}" height="${hTas}" fill="#fff"/>`;
    if (tas) rangeesDe(tas, PARTS.parRangeeTas, G + L / 2, y1 + hTas / 2).forEach(([x, y]) => { s += bille(x, y, "#dbe6f5"); });
    else s += `<text x="${G + L / 2}" y="${y1 + hTas / 2 + 7}" text-anchor="middle" font-size="20" font-weight="800" fill="${encre}">${tout}</text>`;
    s += "</g>";
    for (let k = 0; k < d; k += 1) {
      const x = G + k * w;
      const prise = k === 0 && fini;
      s += `<rect data-case="${k}" x="${x.toFixed(2)}" y="${y2}" width="${w.toFixed(2)}" height="${hCase}" fill="${prise ? PARTS.clair : "#fff"}"/>`;
      rangeesDe(tours, parCase, x + w / 2, y2 + hCase / 2).forEach(([bx, by], b) => {
        const neuve = !fini && b === tours - 1;
        s += bille(bx, by, prise ? bleu : neuve ? "#e5f7eb" : "#dbe6f5", neuve ? FRACTIONS.trouve : encre, neuve ? 2.6 : 1.6);
      });
    }
    s += `<rect x="${G}" y="${y1}" width="${L}" height="${hTas}" fill="none" stroke="${encre}" stroke-width="2.6" pointer-events="none"/>`;
    for (let k = 0; k < d; k += 1) s += `<rect x="${(G + k * w).toFixed(2)}" y="${y2}" width="${w.toFixed(2)}" height="${hCase}" fill="none" stroke="${encre}" stroke-width="2.6" pointer-events="none"/>`;
    if (fini) s += `<rect x="${G + 1.6}" y="${y2 + 1.6}" width="${(w - 3.2).toFixed(2)}" height="${hCase - 3.2}" fill="none" stroke="${cherche}" stroke-width="3.5" pointer-events="none"/>`;
    if (cible && !fini) s += `<rect class="dc-cible" x="${G - 3}" y="${y1 - 3}" width="${L + 6}" height="${hTas + 6}" rx="7" fill="none" stroke="${cherche}" stroke-width="3.5" pointer-events="none"/>`;
    return `<svg class="dc-billes-svg" viewBox="0 0 ${FRACTIONS.largeur} ${y2 + hCase + 4}">${s}</svg>`;
  }
  // Ce que voit l'élève, pour un lecteur d'écran.
  function decrireBilles({n, d, tours, fini}) {
    const tas = n - tours * d;
    return `${d} cases. Le tas : ${tas ? accorder(tas, "bille", "billes") : "vide"}. Dans chaque case : ${tours ? accorder(tours, "bille", "billes") : "rien"}.${fini ? " La première case est coloriée." : ""}`;
  }

  // L'outil à toucher. options : {n, d, tout, consigne, consigneFin, traces,
  // surFini}. Au clavier : Entrée ou Espace font un tour.
  function billesManip(zone, options) {
    const {n, d, tout, consigne: texteConsigne, consigneFin = "", traces = [], surFini = null, sansReponse = false} = options;
    let jeu = billesDepart();
    const etat = {refus: 0, premier: true};
    compteurAides += 1;
    const bloc = document.createElement("div");
    bloc.className = "dc-bandes dc-billes";
    const consigne = document.createElement("p");
    consigne.className = "consigne";
    consigne.id = `dc-consigne-${compteurAides}`;
    const scene = document.createElement("div");
    scene.className = "dc-bandes-scene dc-billes-scene dc-attente";
    scene.tabIndex = 0;
    scene.setAttribute("role", "button");
    scene.setAttribute("aria-describedby", consigne.id);
    const trace = document.createElement("p");
    trace.className = "dc-trace";
    trace.setAttribute("role", "status");
    trace.setAttribute("aria-live", "polite");
    const annonce = zoneAnnonce();
    bloc.append(consigne, scene, trace, annonce);
    zone.replaceChildren(bloc);

    function dessiner() {
      ecrireTexte(consigne, jeu.fini ? consigneFin : texteConsigne);
      scene.innerHTML = billesSvg({n, d, tout, tours: jeu.tours, fini: jeu.fini, cible: true});
      scene.setAttribute("aria-label", `${decrireBilles({n, d, tours: jeu.tours, fini: jeu.fini})}${jeu.fini ? "" : " Touche le tas."}`);
      const pilule = document.createElement("b");
      if (sansReponse) {
        // Rien sous les cases : l'élève compte les billes d'une case.
      } else if (jeu.fini && traces.length) {
        pilule.className = "ok";
        ecrireTexte(pilule, traces[traces.length - 1].texte);
      } else if (jeu.tours) {
        pilule.textContent = `${accorder(jeu.tours, "bille", "billes")} dans chaque case`;
      }
      trace.replaceChildren(...(pilule.textContent ? [pilule] : []));
    }
    function leverRefus() {
      clearTimeout(etat.refus);
      etat.refus = 0;
      consigne.classList.remove("est-refus");
    }
    function refuser() {
      clearTimeout(etat.refus);
      consigne.classList.remove("est-refus");
      void consigne.offsetWidth;
      consigne.classList.add("est-refus");
      annonce.annoncer(consigne.textContent);
      etat.refus = setTimeout(leverRefus, 1800);
    }
    function jouer(geste) {
      const apres = billesGeste(jeu, geste, {n, d});
      bloc.dispatchEvent(new CustomEvent("bille", {bubbles: true, detail: Object.assign({accepte: Boolean(apres)}, geste)}));
      if (!apres) { refuser(); return; }
      leverRefus();
      jeu = apres;
      if (etat.premier) { etat.premier = false; scene.classList.remove("dc-attente"); }
      if (jeu.fini) bloc.classList.add("est-finie");
      dessiner();
      annonce.annoncer(jeu.fini && traces.length && !sansReponse ? lireFraction(traces[traces.length - 1].texte) : decrireBilles({n, d, tours: jeu.tours, fini: jeu.fini}));
      if (jeu.fini && typeof surFini === "function") surFini();
    }
    scene.addEventListener("click", event => {
      const tas = event.target.closest && event.target.closest("[data-tas]");
      jouer(tas ? {tas: true} : {case: true});
    });
    scene.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      jouer({tas: true});
    });
    dessiner();
    return {
      outil: "billes",
      element: bloc,
      detruire() {
        clearTimeout(etat.refus);
        annonce.arreter();
      },
      mesurer() {},
      get deborde() { return bloc.scrollWidth > zone.clientWidth + 1; },
      get fini() { return jeu.fini; },
      get etape() { return jeu.tours; },
      get tours() { return jeu.tours; },
      jouer,
      gesteAttendu: () => ({tas: true})
    };
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
    if (image.outil === "dix-fois") return dixFois(image);
    if (image.outil === "facteurs") return facteursRegroupes(image);
    if (image.outil === "partage") return barrePartagee(image);
    if (image.outil === "parentheses") return parenthesesEscalier(image);
    if (image.outil === "deux-barres") return deuxBarres(image);
    if (image.outil === "numeration") return tableauNumeration(image);
    if (image.outil === "carre") return carreCent(image);
    if (image.outil === "barre-droite") return barreDroite(image);
    if (image.outil === "bandes-droite") return bandesImage(image);
    if (image.outil === "tout-parts") return toutParts(image);
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
    dixFois,
    facteursRegroupes,
    barrePartagee,
    parenthesesEscalier,
    deuxBarres,
    toucherCalcul,
    NUMERATION,
    planNumeration,
    tableauNumeration,
    decrireNumeration,
    carreCent,
    decrireCarre,
    carreGeste,
    carreManip,
    jetonsDepart,
    jetonsGeste,
    jetonsManip,
    VALEURS_JETONS,
    COULEURS_BANDES,
    FRACTIONS,
    planBarreDroite,
    barreDroite,
    decrireBarreDroite,
    bandesDepart,
    bandesGeste,
    longueurBandes,
    planBandes,
    bandesSvg,
    decrireBandes,
    bandesManip,
    nombresBandes,
    bandesImage,
    PARTS,
    toutParts,
    decrireToutParts,
    billesDepart,
    billesGeste,
    planBilles,
    billesSvg,
    decrireBilles,
    billesManip,
    noeudsCalcul,
    ecrireTexte,
    bilanEnDeux,
    souderCalculs,
    dessinerImage
  });
});
