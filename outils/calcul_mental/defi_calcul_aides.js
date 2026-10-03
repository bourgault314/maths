// Défi calcul — les aides visuelles (lot 1a, 03/10/2026).
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
//
// Le glisse-nombres et le tableau à flèches arrivent au lot 1b.
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
    rangee: "Finis la rangée d’abord !",
    trop: "Trop de perles !",
    peu: "Pas assez de perles !"
  });

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
  // surFini}. Rend {detruire, fini}.
  function perles100(zone, options) {
    const {depart, gestes, consigne: texteConsigne, traces = [], surFini = null} = options;
    const boulier = {
      taille: 0, ecart: PERLES.ecart, etats: etatsDe(depart), etape: 0, finie: false,
      drag: null, dom: null, observer: null, refus: 0
    };

    const bloc = document.createElement("div");
    bloc.className = "perles-zone";
    const consigne = document.createElement("p");
    consigne.className = "consigne perles-consigne";
    consigne.textContent = texteConsigne;
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
    interieur.setAttribute("role", "img");
    interieur.setAttribute("aria-label", "Boulier de 100 perles");
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
    bloc.append(consigne, scene, trace);
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
      const ecart = nouvel - etat;
      const refus = verifierGeste(boulier.etats, gestes[boulier.etape], drag.rangee, ecart);
      if (refus) {
        dessiner(true);
        refuser(refus);
        return;
      }
      boulier.etats[drag.rangee] = nouvel;
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

    interieur.addEventListener("pointerdown", pointerDown);
    interieur.addEventListener("pointermove", pointerMove);
    interieur.addEventListener("pointerup", pointerUp);
    interieur.addEventListener("pointercancel", pointerUp);
    if (typeof ResizeObserver === "function") {
      boulier.observer = new ResizeObserver(() => mesurer());
      boulier.observer.observe(scene);
    }
    ecrireTraces();
    mesurer();

    return {
      detruire() {
        clearTimeout(boulier.refus);
        if (boulier.observer) boulier.observer.disconnect();
      },
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
  //   inconnue : le rang du point montré « ? » (0 = départ)
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
    plan.valeurs.forEach((valeur, index) => {
      const x = plan.x[index];
      const inconnue = o.inconnue === index;
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
    const morceaux = o.sauts.map((saut, index) => {
      const arrivee = o.inconnue === index + 1 ? "un nombre à trouver" : nombre(plan.valeurs[index + 1]);
      return `${saut.val < 0 ? "moins" : "plus"} ${saut.masque ? "un nombre à trouver" : nombre(saut.val)} : ${arrivee}`;
    });
    return `Droite : on part de ${nombre(o.depart)}. ${morceaux.join(". Puis ")}.`;
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
    decrireDroite
  });
});
