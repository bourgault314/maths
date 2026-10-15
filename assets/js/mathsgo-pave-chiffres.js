/* maths&go — pavé de chiffres dessiné dans la page, pour les appareils tactiles

   Pourquoi : sur un téléphone, toucher un champ de saisie ouvre le clavier du
   système. iOS réduit alors la zone visible de moitié et fait défiler la page
   pour amener le champ au-dessus du clavier : en passant d'une case à l'autre,
   tout le plateau saute. Aucun réglage iOS ne permet de figer ce clavier ; la
   seule solution propre est de ne jamais le faire apparaître et de fournir les
   chiffres dans la page.

   Le pavé reprend le style du clavier de Défi tables
   (outils/calcul_mental/defi_tables.html, lot 1 « clavier » du 07/09/2026) :
   mêmes touches blanches arrondies, même fond teinté, mêmes couleurs, même
   police, même retour visuel à l'appui — l'élève retrouve le même objet d'un
   jeu à l'autre. La disposition, elle, est différente : trois rangées
   (1-5, 6-0, puis Effacer et Valider) au lieu de la calculatrice sur quatre
   rangées, trop haute quand il faut aussi montrer un plateau.

   Défi tables n'est pas modifié : ce fichier est la version partagée, utilisée
   pour l'instant par outils/splat_tache_barre.html seulement.

   Emploi :
     if (MathsGoPaveChiffres.estTactile()) {
       const pave = MathsGoPaveChiffres.creer({ surValider: () => valider() });
       pave.brancher(scene.querySelectorAll('.champ'), {
         zone: champ => champ.closest('.case'),  // ce que le doigt touche
         // facultatif : vrai si la case est marquée fausse — le premier
         // chiffre tapé y remplace alors le nombre au lieu de s'y ajouter
         aRemplacer: champ => champ.closest('.case').classList.contains('fausse')
       });
       pave.activerPremierVide();
     }

   Le pavé se pose en bas de l'écran (position: fixed) : c'est à la page de
   réserver la place au-dessus de lui, en s'aidant de pave.hauteur().
   Aucune dépendance, aucun réseau, rien d'enregistré.
*/
(function (root, fabrique) {
  const api = fabrique();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MathsGoPaveChiffres = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Un pointeur « grossier » : le doigt. Pas de détection par ontouchstart ni
     par largeur d'écran — une Surface avec trackpad doit rester en mode
     ordinateur (clavier physique), un iPad doit passer au pavé. */
  const MEDIA_TACTILE = "(pointer: coarse)";
  const ID_STYLE = "mathsgo-pave-chiffres-style";
  const CLASSE_ACTIVE = "mg-pave-case-active";
  const CLASSE_CHAMP = "mg-pave-champ";
  /* Touches de 52 px ; 48 px sur les appareils de moins de 700 px de haut
     (iPhone SE et semblables). Jamais moins : 44 pt est le minimum d'Apple, et
     des enfants qui tapent vite ont besoin d'un peu plus. */
  const TOUCHE_H = 52;
  const TOUCHE_H_COURT = 48;

  const STYLE = [
    /* le pavé : une bande en bas de l'écran, comme un clavier */
    ".mg-pave{position:fixed;left:0;right:0;bottom:0;z-index:60;box-sizing:border-box;",
    "padding:6px max(8px,env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));",
    "background:#e3ecf2;border-top:1px solid #b3c6d3;box-shadow:0 -9px 10px -9px rgba(18,50,74,.45);",
    "font-family:Inter,ui-rounded,\"Arial Rounded MT Bold\",\"Segoe UI\",sans-serif;color:#143451;",
    "touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;",
    "--mg-touche-h:" + TOUCHE_H + "px;--mg-touche-ecart:3px}",
    ".mg-pave--court{--mg-touche-h:" + TOUCHE_H_COURT + "px}",
    /* une feuille d'auteur bat l'attribut hidden : il faut le dire ici */
    ".mg-pave[hidden]{display:none !important}",
    /* sur tablette, des touches larges comme des planches ne servent à rien */
    ".mg-pave__grille{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;",
    "width:min(100%,520px);margin:0 auto}",
    /* Pas de zone morte : chaque bouton occupe toute sa case de la grille,
       seule sa face visible (::before) est en retrait de --mg-touche-ecart. Un
       doigt qui tombe entre deux touches touche quand même la plus proche. */
    ".mg-pave button{position:relative;isolation:isolate;min-height:44px;",
    "height:calc(var(--mg-touche-h) + 2 * var(--mg-touche-ecart));margin:0;padding:0 4px;",
    "border:0;background:none;color:inherit;font:inherit;font-size:1.5rem;font-weight:950;line-height:1;",
    "cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
    ".mg-pave button::before{content:\"\";position:absolute;inset:var(--mg-touche-ecart);z-index:-1;",
    "border-radius:12px;background:#fff;box-shadow:0 1px 0 #b3c6d3}",
    /* iOS n'applique :active que sur un élément muni d'un gestionnaire tactile :
       la classe est-appuyee donne le même retour, à coup sûr */
    ".mg-pave button:active::before,.mg-pave button.est-appuyee::before{background:#d6e3ec;box-shadow:none}",
    ".mg-pave button:focus-visible{outline:none}",
    ".mg-pave button:focus-visible::before{outline:3px solid #0f6cf9;outline-offset:1px}",
    ".mg-pave button:disabled{opacity:.45;cursor:default}",
    /* Effacer sur 2/5 de la largeur, Valider sur 3/5. Le sélecteur porte la
       balise ET la classe : sinon .mg-pave button (une classe + une balise)
       l'emporte et les deux touches restent blanches, comme les chiffres. */
    ".mg-pave button.mg-pave__effacer{grid-column:span 2;color:#2c4a63;font-size:1.05rem}",
    ".mg-pave button.mg-pave__effacer::before{background:#cbdae5}",
    ".mg-pave button.mg-pave__effacer:active::before,.mg-pave button.mg-pave__effacer.est-appuyee::before{background:#bacfdd;box-shadow:none}",
    ".mg-pave button.mg-pave__valider{grid-column:span 3;color:#fff;font-size:1.15rem}",
    ".mg-pave button.mg-pave__valider::before{background:#0755b8;box-shadow:0 3px 0 #043f8c}",
    ".mg-pave button.mg-pave__valider:active::before,.mg-pave button.mg-pave__valider.est-appuyee::before{background:#064a9f;box-shadow:none}",
    /* Touche facultative (lot F2 de SPLAT!, 15/10/2026) : « ▶ case suivante » ou « , », posée par la
       page avec pave.touche(...) ; sans cet appel le pavé reste celui de toujours (12 touches).
       Effacer garde 2/5, la touche prend 1/5, Valider passe à 2/5. */
    ".mg-pave button.mg-pave__valider.mg-pave__valider--deux{grid-column:span 2}",
    ".mg-pave button.mg-pave__touche{grid-column:span 1;color:#143451;font-size:1.3rem}",
    ".mg-pave button.mg-pave__touche[hidden]{display:none}",
    "@media print{.mg-pave{display:none !important}}"
  ].join("");

  function estTactile(fenetre) {
    const f = fenetre || (typeof window !== "undefined" ? window : null);
    try {
      return !!(f && f.matchMedia && f.matchMedia(MEDIA_TACTILE).matches);
    } catch (_erreur) {
      return false;
    }
  }

  /* « Écran de moins de 700 px de haut » se lit sur l'appareil, pas sur la
     fenêtre : le navigateur d'un iPhone courant n'affiche que ~664 px, ce qui
     ferait des touches de 48 px sur tous les téléphones. */
  function ecranCourt(fenetre) {
    try {
      const ecran = (fenetre && fenetre.screen) || {};
      const grandCote = Math.max(Number(ecran.height) || 0, Number(ecran.width) || 0);
      return grandCote > 0 && grandCote < 700;
    } catch (_erreur) {
      return false;
    }
  }

  function poserStyle(doc) {
    if (!doc || (doc.getElementById && doc.getElementById(ID_STYLE))) return;
    const style = doc.createElement("style");
    style.id = ID_STYLE;
    style.textContent = STYLE;
    (doc.head || doc.body || doc.documentElement).appendChild(style);
  }

  function estChampDeSaisie(element) {
    if (!element) return false;
    const balise = String(element.tagName || "").toUpperCase();
    if (balise === "INPUT" || balise === "TEXTAREA" || balise === "SELECT") return true;
    return !!element.isContentEditable;
  }

  function creer(options) {
    const reglages = options || {};
    const fenetre = reglages.fenetre || (typeof window !== "undefined" ? window : null);
    const doc = reglages.document || (fenetre && fenetre.document) || (typeof document !== "undefined" ? document : null);
    if (!doc) return null;
    poserStyle(doc);

    const pave = doc.createElement("div");
    pave.className = "mg-pave" + (ecranCourt(fenetre) ? " mg-pave--court" : "");
    /* posé caché : c'est la page qui l'affiche quand il y a une case à remplir */
    pave.hidden = true;
    pave.setAttribute("role", "group");
    pave.setAttribute("aria-label", reglages.etiquette || "Pavé de chiffres");
    const grille = doc.createElement("div");
    grille.className = "mg-pave__grille";
    pave.appendChild(grille);

    const branches = [];
    let champActif = null;
    let detruit = false;
    /* fourni par la page à brancher() : vrai si la case est marquée fausse */
    let predicatRemplacer = null;

    function ajouterTouche(texte, sorte, valeur, classe, etiquette) {
      const bouton = doc.createElement("button");
      bouton.type = "button";
      if (classe) bouton.className = classe;
      bouton.textContent = texte;
      if (etiquette) bouton.setAttribute("aria-label", etiquette);
      bouton.addEventListener("pointerdown", function () { bouton.classList.add("est-appuyee"); });
      ["pointerup", "pointercancel", "pointerleave", "blur"].forEach(function (nom) {
        bouton.addEventListener(nom, function () { bouton.classList.remove("est-appuyee"); });
      });
      bouton.addEventListener("click", function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        bouton.classList.remove("est-appuyee");
        appuyer(sorte, valeur);
      });
      grille.appendChild(bouton);
      return bouton;
    }

    "1234567890".split("").forEach(function (chiffre) {
      ajouterTouche(chiffre, "chiffre", chiffre, null, null);
    });
    ajouterTouche("⌫ " + (reglages.libelleEffacer || "Effacer"), "effacer", null,
      "mg-pave__effacer", "Effacer le dernier chiffre");
    ajouterTouche("✓ " + (reglages.libelleValider || "Valider"), "valider", null,
      "mg-pave__valider", null);

    /* La touche facultative n'existe qu'après le premier appel à touche() : par défaut le pavé a ses
       12 touches, comme avant. */
    let boutonTouche = null, boutonValider = null;
    function touche(sorte) {
      if (!boutonTouche) {
        if (!sorte) return objet;
        boutonValider = grille.lastChild;
        boutonTouche = ajouterTouche("", "suivante", null, "mg-pave__touche", null);
        grille.insertBefore(boutonTouche, boutonValider);
      }
      const active = sorte === "suivante" || sorte === "virgule";
      boutonTouche.hidden = !active;
      pave.classList.toggle("mg-pave--touche", active);
      boutonValider.classList.toggle("mg-pave__valider--deux", active);
      if (active) {
        boutonTouche.dataset.sorte = sorte;
        boutonTouche.textContent = sorte === "virgule" ? "," : "▶";
        boutonTouche.setAttribute("aria-label", sorte === "virgule" ? "Virgule" : "Case suivante");
      }
      return objet;
    }

    /* iOS n'applique :active qu'aux éléments qui écoutent le toucher. */
    pave.addEventListener("touchstart", function () {}, { passive: true });

    function appuyer(sorte, valeur) {
      if (detruit) return;
      if (sorte === "suivante" || sorte === "virgule") sorte = boutonTouche && boutonTouche.dataset.sorte || sorte;
      if (sorte === "chiffre") ecrire(valeur);
      else if (sorte === "effacer") effacerDernier();
      else if (sorte === "virgule") ecrireVirgule();
      else if (sorte === "suivante") caseSuivante();
      else if (sorte === "valider" && typeof reglages.surValider === "function") reglages.surValider();
    }

    function saisissable(champ) {
      return !!champ && !champ.readOnly && !champ.disabled;
    }

    function longueurMax(champ) {
      const max = Number(champ && champ.maxLength);
      return max > 0 ? max : 3;
    }

    function valeurDe(champ) {
      return String(champ && champ.value != null ? champ.value : "");
    }

    /* La page écoute déjà « input » sur ses champs (retirer le rouge d'une case
       corrigée, par exemple) : une saisie au pavé doit s'annoncer pareil. */
    function signaler(champ) {
      try {
        if (champ.dispatchEvent && typeof Event === "function") {
          champ.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } catch (_erreur) { /* vieux navigateur : la page relira la valeur */ }
      if (typeof reglages.surSaisie === "function") reglages.surSaisie(champ);
    }

    function aRemplacer(champ) {
      try {
        return !!(predicatRemplacer && predicatRemplacer(champ));
      } catch (_erreur) {
        return false;
      }
    }

    /* Une case marquée fausse : le premier chiffre REMPLACE le nombre faux au
       lieu de s'ajouter derrière (« 9 » faux puis « 4 » donne 4, pas 94). La
       page retire la marque dès la saisie (événement input) : les chiffres
       suivants s'ajoutent de nouveau, comme dans une case normale. */
    function ecrire(chiffre) {
      const champ = saisissable(champActif) ? champActif : premierVide();
      if (!champ) return;
      if (champ !== champActif) activer(champ);
      const valeur = aRemplacer(champ) ? "" : valeurDe(champ);
      if (valeur.length >= longueurMax(champ)) return;
      champ.value = valeur + chiffre;
      signaler(champ);
    }

    /* La virgule d'une case décimale : une seule par case ; elle ne s'écrit pas en tête (« ,5 »). */
    function ecrireVirgule() {
      const champ = saisissable(champActif) ? champActif : premierVide();
      if (!champ) return;
      if (champ !== champActif) activer(champ);
      const valeur = aRemplacer(champ) ? "" : valeurDe(champ);
      if (!valeur || /[,.]/.test(valeur) || valeur.length >= longueurMax(champ)) return;
      champ.value = valeur + ",";
      signaler(champ);
    }

    /* La case saisissable suivante dans l'ordre du brancher() ; après la dernière, la première. */
    function caseSuivante() {
      const libres = branches.filter(function (lien) { return saisissable(lien.champ); });
      if (!libres.length) return null;
      let i = -1;
      for (let k = 0; k < libres.length; k++) if (libres[k].champ === champActif) i = k;
      return activer(libres[(i + 1) % libres.length].champ);
    }

    function effacerDernier() {
      const champ = saisissable(champActif) ? champActif : null;
      if (!champ) return;
      const valeur = valeurDe(champ);
      if (!valeur) return;
      champ.value = valeur.slice(0, -1);
      signaler(champ);
    }

    function premierVide() {
      let premier = null;
      for (let i = 0; i < branches.length; i++) {
        const champ = branches[i].champ;
        if (!saisissable(champ)) continue;
        if (!premier) premier = champ;
        if (!valeurDe(champ).trim()) return champ;
      }
      return premier;
    }

    function activer(champ) {
      if (detruit) return null;
      let trouve = null;
      for (let i = 0; i < branches.length; i++) {
        const lien = branches[i];
        const actif = lien.champ === champ;
        if (actif) trouve = lien.champ;
        if (lien.zone && lien.zone.classList) lien.zone.classList.toggle(CLASSE_ACTIVE, actif);
      }
      champActif = trouve;
      if (trouve && typeof reglages.surCaseActive === "function") reglages.surCaseActive(trouve);
      return trouve;
    }

    function detacher() {
      while (branches.length) {
        const lien = branches.pop();
        if (lien.zone) {
          if (lien.zone.classList) lien.zone.classList.remove(CLASSE_ACTIVE);
          if (lien.zone.removeEventListener && lien.prendre) {
            lien.zone.removeEventListener("pointerdown", lien.prendre);
            lien.zone.removeEventListener("click", lien.prendre);
          }
        }
      }
      champActif = null;
      predicatRemplacer = null;
    }

    /* Le doigt touche la ZONE (la case), jamais le champ : c'est ce qui évite
       le focus du navigateur, donc le clavier du système et le défilement
       qu'iOS impose même vers un champ en lecture seule. La page complète en
       posant pointer-events:none sur les champs. */
    function brancher(champs, options2) {
      const reglages2 = options2 || {};
      detacher();
      predicatRemplacer = typeof reglages2.aRemplacer === "function" ? reglages2.aRemplacer : null;
      const liste = Array.prototype.slice.call(champs || []);
      liste.forEach(function (champ) {
        if (!champ) return;
        if (champ.setAttribute) {
          champ.setAttribute("inputmode", "none");
          champ.setAttribute("tabindex", "-1");
        }
        if (champ.classList) champ.classList.add(CLASSE_CHAMP);
        const zone = typeof reglages2.zone === "function" ? reglages2.zone(champ) : (champ.parentNode || champ);
        const lien = { champ: champ, zone: zone || null, prendre: null };
        if (zone && zone.addEventListener) {
          lien.prendre = function (ev) {
            if (ev && ev.cancelable && ev.preventDefault) ev.preventDefault();
            activer(champ);
          };
          zone.addEventListener("pointerdown", lien.prendre);
          zone.addEventListener("click", lien.prendre);
        }
        branches.push(lien);
      });
      return objet;
    }

    /* Clavier physique (iPad avec clavier, ordinateur à écran tactile) : les
       champs n'ont plus le focus, personne ne recevrait les touches. */
    function auClavier(ev) {
      if (detruit || pave.hidden || !branches.length) return;
      if (!ev || ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (estChampDeSaisie(doc.activeElement)) return;
      if (/^[0-9]$/.test(ev.key)) ecrire(ev.key);
      else if ((ev.key === "," || ev.key === ".") && boutonTouche && boutonTouche.dataset.sorte === "virgule" && !boutonTouche.hidden) ecrireVirgule();
      else if ((ev.key === "+" || ev.key === "/") && boutonTouche && boutonTouche.dataset.sorte === "suivante" && !boutonTouche.hidden) caseSuivante();
      else if (ev.key === "Backspace" || ev.key === "Delete") effacerDernier();
      else if (ev.key === "Enter") {
        if (typeof reglages.surValider === "function") reglages.surValider();
      } else return;
      if (ev.preventDefault) ev.preventDefault();
    }
    if (doc.addEventListener) doc.addEventListener("keydown", auClavier);

    const parent = reglages.parent || doc.body;
    if (parent && parent.appendChild) parent.appendChild(pave);

    const objet = {
      element: pave,
      brancher: brancher,
      detacher: detacher,
      activer: activer,
      activerPremierVide: function () { return activer(premierVide()); },
      touche: touche,
      caseSuivante: caseSuivante,
      champActif: function () { return champActif; },
      afficher: function () { pave.hidden = false; return objet; },
      masquer: function () { pave.hidden = true; return objet; },
      visible: function () { return !pave.hidden; },
      hauteur: function () { return Number(pave.offsetHeight) || 0; },
      detruire: function () {
        detruit = true;
        detacher();
        if (doc.removeEventListener) doc.removeEventListener("keydown", auClavier);
        if (pave.remove) pave.remove();
        else if (pave.parentNode && pave.parentNode.removeChild) pave.parentNode.removeChild(pave);
      }
    };
    return objet;
  }

  return {
    estTactile: estTactile,
    ecranCourt: ecranCourt,
    creer: creer,
    MEDIA_TACTILE: MEDIA_TACTILE,
    CLASSE_ACTIVE: CLASSE_ACTIVE,
    CLASSE_CHAMP: CLASSE_CHAMP
  };
});
