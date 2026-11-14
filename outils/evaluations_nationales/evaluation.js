/* maths&go — Évaluations nationales : déroulé d'un test (accueil, passation sans aide, bilan).
   Aucune donnée ne sort de l'appareil : le dernier résultat est gardé dans le navigateur seulement. */
(function () {
  "use strict";
  const { hasard, construire, typo } = window.EN;
  // Interrupteur unique des boutons « Je m'entraîne » du bilan. Éteint tant que les automatismes et les cours
  // vers lesquels ils mènent ne sont pas prêts ; chaque question garde son champ `entrainement` pour le jour où on le rallume.
  const ENTRAINEMENT_VISIBLE = false;
  const params = new URLSearchParams(location.search);
  const sujet = window.EN_SUJETS[params.get("sujet")] || window.EN_SUJETS["6e-automatismes"];
  const vueProf = params.get("prof") === "1";
  const $ = (s) => document.querySelector(s);
  const CLE = "mathsgo-en-" + sujet.id;
  // Un test sans sujet jumeau (lot EN9, Résolution de problèmes : la variété se décidera problème par problème) n'affiche
  // ni « Un sujet jumeau » ni « Refaire mes questions ratées » : refaire le même sujet après avoir vu le bilan n'apprend rien.
  const avecJumeaux = sujet.jumeaux !== false;

  let passation = null; // { type, officiel, graine, items:[{q, t, g, choix(ordre affiché)}], reponses:[], debut, i }
  let minuteur = null;

  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE) || "null"); } catch (e) { return null; } };
  const ecrire = (v) => { try { localStorage.setItem(CLE, JSON.stringify(v)); } catch (e) { /* stockage indisponible : tant pis */ } };
  const nouvelleGraine = () => 1 + Math.floor(Math.random() * 2147483646);
  // Sujets officiels jouables ; un sujet sans liste n'a que son sujet le plus récent.
  const officiels = sujet.officiels || [{ cle: String(sujet.annee), annee: sujet.annee, titre: `Le sujet officiel ${sujet.annee}`, detail: "" }];
  // Repères d'un passage : ceux de son sujet officiel ; un sujet généré prend ceux du sujet officiel le plus récent.
  const seuilsDe = (officiel) => (officiel && officiel.seuils) || sujet.seuils;
  const groupe = (score, seuils) => {
    const s = seuils.find((x) => score <= x.max) || seuils[seuils.length - 1];
    return { nom: s.nom, rang: seuils.indexOf(s) };
  };
  const duree = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`; };

  function montrer(id) {
    for (const v of ["#accueil", "#passe", "#bilan"]) $(v).hidden = v !== id;
    document.body.classList.toggle("en-passation", id === "#passe");
    window.scrollTo(0, 0);
  }

  // ---------- Accueil ----------
  function accueil() {
    clearInterval(minuteur);
    calculatrice.question(false);
    $("#niveau").textContent = `${sujet.famille || "Évaluation nationale"} · ${sujet.niveau}`;
    $("#titre").textContent = sujet.titre;
    $("#descriptif").textContent = `${sujet.questions.length} questions · ${sujet.consignes}`;
    $("#officiels").innerHTML = officiels.map((o, k) => `<button class="carte officiel" type="button" data-officiel="${k}">
            <span class="ico" aria-hidden="true">📄</span>
            <span><strong>${o.titre}</strong>${o.detail ? `<small>${o.detail}</small>` : ""}</span>
            <span class="go">Commencer</span>
          </button>`).join("");
    $("#officiels").querySelectorAll("[data-officiel]").forEach((b) => b.addEventListener("click", () => lancer("officiel", null, officiels[Number(b.dataset.officiel)])));
    $("#lancer-jumeau").hidden = !avecJumeaux;
    $("#source").innerHTML = `Questions : ${sujet.source.replace(/(, Eduscol)?, licence Etalab 2\.0\.?$/, "")} — <a href="${sujet.lienSource}" target="_blank" rel="noopener">Eduscol</a>, licence Etalab 2.0.`;
    const dernier = lire();
    $("#dernier").hidden = !dernier;
    if (dernier) $("#dernier").textContent = `Ton dernier sujet (${dernier.type === "officiel" ? (officiels.length > 1 && dernier.officiel ? "officiel " + dernier.officiel.replace("-", " et ") : "officiel") : "jumeau"}) : ${dernier.score} / ${dernier.total} — ${dernier.groupe}`;
    montrer("#accueil");
  }

  // ---------- Passation ----------
  function lancer(type, numeros, officiel) {
    const graine = type === "officiel" ? 1 : nouvelleGraine();
    officiel = type === "officiel" ? officiel || officiels[0] : null;
    const items = construire(sujet, hasard(graine), officiel, numeros);
    passation = { type, officiel, graine, items, reponses: [], debut: Date.now(), i: 0, reprise: Boolean(numeros) };
    $("#chrono").textContent = "0:00";
    clearInterval(minuteur);
    minuteur = setInterval(() => {
      const s = Math.floor((Date.now() - passation.debut) / 1000);
      $("#chrono").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    }, 1000);
    montrer("#passe");
    afficherQuestion();
  }

  function afficherQuestion() {
    const { items, i } = passation;
    const it = items[i];
    $("#compteur").textContent = `Question ${i + 1} / ${items.length}`;
    $("#progres").style.width = `${(i / items.length) * 100}%`;
    $("#q-num").textContent = passation.reprise ? `Question ${it.q.num} du sujet` : `Question ${i + 1}`;
    // Typographie (EN.typo) : « ? » jamais seul à la ligne, un nombre et son unité jamais séparés (1 cm, 18 km/h…).
    $("#q-enonce").innerHTML = typo(it.g.enonce);
    $("#q-figure").innerHTML = it.g.figure || "";
    $("#q-figure").hidden = !it.g.figure;
    // Sur ordinateur, une question avec figure se met sur deux colonnes (figure à gauche, réponses à droite).
    // Une figure très large (droite graduée, bande) reste au-dessus des réponses : à côté, elle deviendrait minuscule.
    const vb = (it.g.figure || "").match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const large = vb && Number(vb[1]) / Number(vb[2]) > 2.2;
    // Une figure « à côté » (le diagramme de l'œuf) se range à droite de l'énoncé : les réponses gardent toute la largeur.
    // Une question à long énoncé (6e, positionnement, la voiture) : l'énoncé à gauche, la figure puis les réponses à droite.
    $("#q-carte").classList.toggle("avec-figure", Boolean(it.g.figure) && !large && !it.g.figureACote && !it.g.choixACote);
    $("#q-carte").classList.toggle("figure-a-cote", Boolean(it.g.figure && it.g.figureACote));
    $("#q-carte").classList.toggle("figure-grande", it.g.figureACote === "grande");
    $("#q-carte").classList.toggle("choix-a-cote", Boolean(it.g.figure && it.g.choixACote));
    $("#q-apres").innerHTML = typo(it.g.apres || "");
    $("#q-apres").hidden = !it.g.apres;
    const zone = $("#q-choix");
    const disposition = it.g.disposition || it.q.disposition || "grille";
    zone.className = "choix " + disposition;
    zone.innerHTML = "";
    it.choix.forEach((ch, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choix-btn" + (it.g.choixFigures ? " choix-figure" : "");
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<span class="case" aria-hidden="true"></span><span class="choix-texte">${typo(ch.html + (it.g.suffixe || ""))}</span>`;
      b.addEventListener("click", () => {
        zone.querySelectorAll(".choix-btn").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        passation.selection = k;
        $("#valider").disabled = false;
      });
      zone.appendChild(b);
    });
    passation.selection = null;
    $("#valider").disabled = true;
    $("#valider").textContent = i === items.length - 1 ? "Terminer" : "Valider";
    $("#q-corps").scrollTop = 0;
    calculatrice.question(sujet.calculatrice && it.q.calculatrice !== false);
  }

  function repondre(k) {
    passation.reponses.push(k);
    passation.i++;
    if (passation.i < passation.items.length) afficherQuestion();
    else bilan();
  }

  // ---------- Bilan ----------
  function bilan() {
    clearInterval(minuteur);
    calculatrice.question(false);
    const { items, reponses } = passation;
    const temps = Date.now() - passation.debut;
    const resultats = items.map((it, i) => {
      const k = reponses[i];
      const choisi = k === null ? null : it.choix[k];
      return { it, choisi, juste: Boolean(choisi && choisi.juste) };
    });
    const score = resultats.filter((x) => x.juste).length;
    const total = items.length;
    $("#score").textContent = `${score} / ${total}`;
    $("#duree").textContent = `en ${duree(temps)}`;
    const zoneGroupe = $("#groupe");
    if (passation.reprise) {
      zoneGroupe.textContent = score === total ? "Toutes tes questions ratées sont réussies !" : "Questions ratées refaites";
      zoneGroupe.className = "groupe " + (score === total ? "g2" : "g1");
    } else {
      const g = groupe(score, seuilsDe(passation.officiel));
      zoneGroupe.textContent = g.nom;
      zoneGroupe.className = "groupe g" + g.rang;
      ecrire({ type: passation.type, officiel: passation.officiel ? passation.officiel.cle : null, score, total, groupe: g.nom, date: new Date().toISOString() });
    }
    const seuils = seuilsDe(passation.officiel);
    $("#seuils").hidden = passation.reprise;
    $("#seuils").textContent = `Repères officiels sur ${sujet.questions.length} : ${seuils.map((s, i) => `${s.nom.toLowerCase()} ${i === 0 ? `jusqu’à ${s.max}` : i === seuils.length - 1 ? `à partir de ${seuils[i - 1].max + 1}` : `de ${seuils[i - 1].max + 1} à ${s.max}`}`).join(" · ")}.`;
    // Sujet généré : le groupe s'affiche, avec la mention que les repères ont été fixés pour le vrai sujet.
    $("#indication").hidden = passation.reprise || passation.type === "officiel";

    const parDomaine = Object.entries(sujet.domaines).map(([code, nom]) => {
      const r = resultats.filter((x) => x.it.q.domaine === code);
      return r.length ? `<li><span>${nom}</span><b>${r.filter((x) => x.juste).length} / ${r.length}</b></li>` : "";
    }).join("");
    $("#domaines").innerHTML = parDomaine;

    const rates = resultats.filter((x) => !x.juste);
    // D'abord où s'entraîner (un lien par automatisme), puis le détail question par question.
    const parAutomatisme = new Map();
    for (const x of rates) {
      const e = x.it.t.entrainement || x.it.q.entrainement;
      if (!e) continue; // Résolution de problèmes : pas d'automatisme associé
      if (!parAutomatisme.has(e.url)) parAutomatisme.set(e.url, { e, nums: [] });
      parAutomatisme.get(e.url).nums.push(x.it.q.num);
    }
    $("#a-revoir").hidden = rates.length === 0;
    $("#bloc-entrainement").hidden = !ENTRAINEMENT_VISIBLE || rates.length === 0;
    $("#liens-entrainement").innerHTML = [...parAutomatisme.values()].map(({ e, nums }) =>
      `<li><a class="entrainer" href="${e.url}"><span><strong>${e.libelle}</strong><small>${nums.length > 1 ? "Questions " + nums.slice(0, -1).join(", ") + " et " + nums[nums.length - 1] : "Question " + nums[0]}</small></span><span aria-hidden="true">→</span></a></li>`).join("");
    const minuscule = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    $("#liste-revoir").innerHTML = rates.map(({ it, choisi }) => {
      const bonne = it.choix.find((c) => c.juste);
      return `<li>
        <p class="revoir-titre"><span class="pastille">${it.q.num}</span>${typo(it.t.competence || it.q.competence)}</p>
        <div class="revoir-reponses">
          <span class="donnee">${choisi ? "Ta réponse : " + typo(choisi.html) : "Pas de réponse"}</span>
          <span class="attendue">Bonne réponse : ${typo(bonne.html)}</span>
        </div>
        ${vueProf && choisi ? `<p class="erreur-prof">Ce choix montre souvent que l’élève ${minuscule(choisi.erreur).replace(/^ne /, "ne ").replace(/\.$/, "")}.</p>` : ""}
      </li>`;
    }).join("");
    $("#refaire-rates").hidden = rates.length === 0 || !avecJumeaux;
    $("#nouveau-jumeau").hidden = !avecJumeaux;
    $("#refaire-rates").onclick = () => lancer("jumeau", rates.map((x) => x.it.q.num));
    montrer("#bilan");
  }

  // ---------- Calculatrice (tests « Résolution de problèmes ») ----------
  // Comme dans le vrai test, elle est intégrée à la question : un bouton dans la barre des boutons l'ouvre par-dessus la
  // page (rien ne bouge), elle repart à zéro à chaque question. Les calculs restent dans l'appareil, rien n'est gardé.
  const calculatrice = (function () {
    const panneau = $("#calculatrice"), bouton = $("#calc-ouvrir");
    let saisie = "", avant = "", fini = false;
    const OPS = "+−×÷";
    const ecran = () => {
      $("#calc-avant").textContent = avant;
      $("#calc-ecran").textContent = saisie || "0";
    };
    const ouvrir = (oui) => {
      panneau.hidden = !oui;
      bouton.setAttribute("aria-expanded", String(oui));
      document.body.classList.toggle("calc-ouverte", oui); // téléphone : place gardée sous la page pour lire la question
    };
    function touche(t) {
      if (t === "C") { saisie = ""; avant = ""; fini = false; }
      else if (t === "←") { if (fini) { saisie = ""; avant = ""; fini = false; } else saisie = saisie.slice(0, -1); }
      else if (t === "=") {
        if (!saisie || fini) return ecran();
        const v = window.EN.calculer(saisie);
        avant = saisie + " =";
        saisie = window.EN.ecrireCalcul(v);
        fini = true;
        if (v === null) saisie = "Erreur";
      } else if (OPS.includes(t)) {
        if (fini) { saisie = saisie === "Erreur" ? "" : saisie; avant = ""; fini = false; }
        // Deux signes de suite : le second remplace le premier (sauf « − » pour un nombre négatif).
        if (saisie && OPS.includes(saisie.slice(-1)) && t !== "−") saisie = saisie.slice(0, -1);
        if (saisie.length < 40) saisie += t;
      } else {
        if (fini) { saisie = ""; avant = ""; fini = false; }
        if (saisie.length < 40) saisie += t;
      }
      ecran();
    }
    panneau.querySelectorAll("[data-touche]").forEach((b) => b.addEventListener("click", () => touche(b.dataset.touche)));
    bouton.addEventListener("click", () => ouvrir(panneau.hidden));
    $("#calc-fermer").addEventListener("click", () => { ouvrir(false); bouton.focus(); });
    // Au clavier (ordinateur) : chiffres, virgule ou point, + - * / x : ( ), Entrée ou =, retour arrière, Échap.
    const CLAVIER = { "+": "+", "-": "−", "*": "×", "x": "×", "X": "×", "/": "÷", ":": "÷", ",": ",", ".": ",", "(": "(", ")": ")", "=": "=", "Enter": "=", "Backspace": "←", "Delete": "C" };
    document.addEventListener("keydown", (e) => {
      if (panneau.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape") { e.preventDefault(); ouvrir(false); bouton.focus(); return; }
      const t = /^[0-9]$/.test(e.key) ? e.key : CLAVIER[e.key];
      if (!t) return;
      e.preventDefault();
      touche(t);
    });
    return {
      // Nouvelle question : la calculatrice repart à zéro, fermée ; le bouton n'est là que si la question l'a.
      question(avec) {
        saisie = ""; avant = ""; fini = false;
        ecran();
        ouvrir(false);
        // visibility (pas display) : « Je ne sais pas » et « Valider » ne bougent pas quand le bouton n'est pas là.
        bouton.style.visibility = avec ? "visible" : "hidden";
        bouton.disabled = !avec;
        bouton.hidden = !sujet.calculatrice;
      },
    };
  })();

  // ---------- Plein écran (comme Défi tables et Anzan ; le bouton est caché au téléphone) ----------
  (function pleinEcran() {
    const racine = document.documentElement, boutons = [...document.querySelectorAll("[data-fullscreen-toggle]")];
    const natif = () => document.fullscreenElement || document.webkitFullscreenElement;
    const actif = () => Boolean(natif()) || racine.classList.contains("fullscreen-fallback");
    const sync = () => {
      document.body.classList.toggle("fullscreen-active", actif());
      boutons.forEach((b) => {
        b.setAttribute("aria-pressed", String(actif()));
        b.setAttribute("aria-label", actif() ? "Quitter le plein écran" : "Passer en plein écran");
        b.title = actif() ? "Quitter le plein écran" : "Plein écran";
      });
    };
    const sortir = async () => {
      racine.classList.remove("fullscreen-fallback");
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (natif() && exit) { try { await exit.call(document); } catch (e) { /* rien */ } }
      sync();
    };
    const entrer = async () => {
      const demande = racine.requestFullscreen || racine.webkitRequestFullscreen;
      if (demande) { try { await demande.call(racine); sync(); return; } catch (e) { /* repli CSS */ } }
      racine.classList.add("fullscreen-fallback");
      sync();
    };
    boutons.forEach((b) => b.addEventListener("click", () => (actif() ? sortir() : entrer())));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && racine.classList.contains("fullscreen-fallback")) { e.preventDefault(); sortir(); } });
  })();

  // ---------- Branchements ----------
  $("#lancer-jumeau").addEventListener("click", () => lancer("jumeau"));
  $("#nouveau-jumeau").addEventListener("click", () => lancer("jumeau"));
  $("#retour-accueil").addEventListener("click", accueil);
  $("#valider").addEventListener("click", () => passation.selection !== null && repondre(passation.selection));
  $("#passer").addEventListener("click", () => repondre(null));
  $("#abandonner").addEventListener("click", () => { if (confirmerAbandon()) accueil(); });
  function confirmerAbandon() {
    const zone = $("#confirmation");
    if (zone.hidden) { zone.hidden = false; return false; }
    return true;
  }
  $("#garder").addEventListener("click", () => { $("#confirmation").hidden = true; });
  $("#quitter").addEventListener("click", () => { $("#confirmation").hidden = true; accueil(); });

  // Recette : ?graine=… rejoue un sujet jumeau précis (graine=1 : le sujet officiel, ?officiel=<clé> pour en choisir un),
  // ?q=… ouvre directement une question.
  accueil();
  const g = Number(params.get("graine"));
  if (Number.isInteger(g) && g > 0) {
    const officiel = g === 1 || !avecJumeaux ? officiels.find((o) => o.cle === params.get("officiel")) || officiels[0] : null;
    const items = construire(sujet, hasard(g), officiel, null);
    passation = { type: officiel ? "officiel" : "jumeau", officiel, graine: g, items, reponses: [], debut: Date.now(), i: Math.max(0, Math.min(items.length - 1, (Number(params.get("q")) || 1) - 1)), reprise: false };
    montrer("#passe");
    afficherQuestion();
  }
})();
