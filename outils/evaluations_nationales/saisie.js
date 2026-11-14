/* maths&go — Évaluations nationales : réponses tapées sur un pavé intégré (lot EN8a, « exemples de questions » Eduscol).
   Une question à réponse courte décrit ses lignes de réponse (`g.saisie.lignes`) : un modèle où chaque □ est une case
   (« C(□ ; □) », « 𝑥 = □° »), les valeurs attendues des cases et les pièges analysés par la fiche professeur.
   Pas de champ de saisie du navigateur : les cases sont des boutons, le pavé est celui de l'appli (pas de clavier du
   téléphone qui fait sauter la page), et le clavier de l'ordinateur marche aussi. Rien ne sort de l'appareil.
   Les fonctions de correction sont pures : les tests node les appellent directement. */
(function (racine) {
  "use strict";

  const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ",", "−", "←"];
  const MAX = 9; // signes par case
  const MARQUE = "□";

  // « −4 », « 2,5 », « −0,5 » → nombre ; une écriture incomplète (« − », « 3, », vide) → null.
  function lireNombre(texte) {
    const t = String(texte || "").trim();
    if (!/^−?\d+(,\d+)?$/.test(t)) return null;
    return Number(t.replace("−", "-").replace(",", "."));
  }
  // Le nombre attendu écrit comme sur une copie : « −4 », « 2,5 ».
  function ecrire(n) {
    const t = String(Math.round(n * 1e6) / 1e6).replace(".", ",");
    return t.replace("-", "−");
  }
  const egal = (a, b) => a !== null && Math.abs(a - b) < 1e-9;

  // Les cases d'une question, dans l'ordre : [{ ligne, rang, attendu }].
  function cases(saisie) {
    const liste = [];
    saisie.lignes.forEach((l, ligne) => l.attendus.forEach((attendu, rang) => liste.push({ ligne, rang, attendu })));
    return liste;
  }
  // Une ligne écrite avec ses valeurs (« C(1 ; −4) ») ; une case vide s'écrit « … ».
  function remplir(modele, valeurs) {
    let k = 0;
    return modele.replace(new RegExp(MARQUE, "g"), () => {
      const v = valeurs[k++];
      return v === undefined || v === null || v === "" ? "…" : v;
    });
  }

  // Corrige une réponse. valeurs : le texte tapé dans chaque case, dans l'ordre des cases.
  // Renvoie { juste, html (la réponse de l'élève), bonne (la réponse attendue), erreurs[] (pièges reconnus) }.
  // Une question compte 1 point si toutes ses cases sont justes (comme les grilles, décision du 14/11).
  function corriger(saisie, valeurs) {
    let k = 0, juste = true;
    const erreurs = [], lignesEleve = [], lignesBonnes = [];
    for (const l of saisie.lignes) {
      const tapees = l.attendus.map(() => valeurs[k++] || "");
      const nombres = tapees.map(lireNombre);
      const ok = l.attendus.every((a, i) => egal(nombres[i], a));
      if (!ok) {
        juste = false;
        const piege = (l.pieges || []).find((p) => p.valeurs.every((v, i) => egal(nombres[i], v)));
        if (piege) erreurs.push(piege.erreur);
      }
      lignesEleve.push(remplir(l.modele, tapees.map((t) => (lireNombre(t) === null ? t : ecrire(lireNombre(t))))));
      lignesBonnes.push(remplir(l.modele, l.attendus.map(ecrire)));
    }
    return { juste, html: lignesEleve.join(" · "), bonne: lignesBonnes.join(" · "), erreurs };
  }

  // Ajoute une touche au texte d'une case (règles d'écriture d'un nombre).
  function taper(texte, touche) {
    if (touche === "←") return texte.slice(0, -1);
    if (touche === "−") return texte.startsWith("−") ? texte.slice(1) : "−" + texte; // le moins change le signe
    if (texte.length >= MAX) return texte;
    if (touche === ",") return texte.includes(",") ? texte : (/\d$/.test(texte) ? texte : texte + "0") + ",";
    if (/^\d$/.test(touche)) return /^−?0$/.test(texte) ? texte.slice(0, -1) + touche : texte + touche;
    return texte;
  }

  // ---------- Affichage (navigateur seulement) ----------
  // Monte les lignes et le pavé dans zone. aChange(pret) est appelé à chaque touche : pret = toutes les cases écrites.
  // Renvoie { valeurs(), fermer() }.
  function monter(zone, saisie, typo, aChange) {
    const valeurs = cases(saisie).map(() => "");
    let active = 0;
    const lignes = saisie.lignes.map((l, i) => {
      let k = 0;
      const debut = saisie.lignes.slice(0, i).reduce((s, x) => s + x.attendus.length, 0);
      const html = typo(l.modele).replace(new RegExp(MARQUE, "g"), () => `<button type="button" class="saisie-case" data-case="${debut + k++}" aria-pressed="false" aria-label="Case ${debut + k}"></button>`);
      return `<p class="saisie-ligne">${html}</p>`;
    }).join("");
    zone.className = "choix saisie";
    zone.innerHTML = `<div class="saisie-lignes">${lignes}</div>
      <div class="pave" role="group" aria-label="Pavé pour écrire la réponse">${TOUCHES.map((t) => `<button type="button" data-touche="${t}"${t === "←" ? ' aria-label="Effacer le dernier chiffre"' : t === "−" ? ' aria-label="Moins (change le signe)"' : ""}>${t}</button>`).join("")}</div>`;
    const boutons = [...zone.querySelectorAll(".saisie-case")];
    const rafraichir = () => {
      boutons.forEach((b, i) => {
        b.textContent = valeurs[i];
        b.classList.toggle("vide", !valeurs[i]);
        b.setAttribute("aria-pressed", String(i === active));
      });
      aChange(valeurs.every((v) => lireNombre(v) !== null));
    };
    const frappe = (t) => { valeurs[active] = taper(valeurs[active], t); rafraichir(); };
    boutons.forEach((b, i) => b.addEventListener("click", () => { active = i; rafraichir(); }));
    zone.querySelectorAll("[data-touche]").forEach((b) => b.addEventListener("click", () => frappe(b.dataset.touche)));
    // Clavier de l'ordinateur : chiffres, virgule ou point, signe moins, retour arrière ; Entrée passe à la case suivante
    // (sauf sur « Valider » et « Je ne sais pas », qui gardent leur Entrée).
    const clavier = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = /^[0-9]$/.test(e.key) ? e.key : { ",": ",", ".": ",", "-": "−", Backspace: "←" }[e.key];
      if (t) { e.preventDefault(); frappe(t); return; }
      const surBouton = document.activeElement && document.activeElement.closest(".actions") && !document.activeElement.disabled;
      if (e.key === "Enter" && boutons.length > 1 && !surBouton) {
        e.preventDefault();
        active = (active + (e.shiftKey ? boutons.length - 1 : 1)) % boutons.length;
        rafraichir();
        // Si une case avait le focus (après un clic), il suit la case active : une seule case a l'air sélectionnée.
        if (document.activeElement && document.activeElement.classList.contains("saisie-case")) boutons[active].focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", clavier);
    rafraichir();
    return { valeurs: () => valeurs.slice(), fermer: () => document.removeEventListener("keydown", clavier) };
  }

  racine.ENSaisie = { TOUCHES, MARQUE, lireNombre, ecrire, cases, remplir, corriger, taper, monter };
})(typeof window !== "undefined" ? window : globalThis);
