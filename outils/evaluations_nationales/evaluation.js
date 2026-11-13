/* maths&go — Évaluations nationales : déroulé d'un test (accueil, passation sans aide, bilan).
   Aucune donnée ne sort de l'appareil : le dernier résultat est gardé dans le navigateur seulement. */
(function () {
  "use strict";
  const { hasard } = window.EN;
  // Interrupteur unique des boutons « Je m'entraîne » du bilan. Éteint tant que les automatismes et les cours
  // vers lesquels ils mènent ne sont pas prêts ; chaque question garde son champ `entrainement` pour le jour où on le rallume.
  const ENTRAINEMENT_VISIBLE = false;
  const params = new URLSearchParams(location.search);
  const sujet = window.EN_SUJETS[params.get("sujet")] || window.EN_SUJETS["6e-automatismes"];
  const vueProf = params.get("prof") === "1";
  const $ = (s) => document.querySelector(s);
  const CLE = "mathsgo-en-" + sujet.id;

  let passation = null; // { type, graine, items:[{q, g, choix(ordre affiché)}], reponses:[], debut, i }
  let minuteur = null;

  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE) || "null"); } catch (e) { return null; } };
  const ecrire = (v) => { try { localStorage.setItem(CLE, JSON.stringify(v)); } catch (e) { /* stockage indisponible : tant pis */ } };
  const nouvelleGraine = () => 1 + Math.floor(Math.random() * 2147483646);
  const groupe = (score, total) => {
    const s = sujet.seuils.find((x) => score <= x.max * (total / sujet.questions.length) + 1e-9) || sujet.seuils[sujet.seuils.length - 1];
    return { nom: s.nom, rang: sujet.seuils.indexOf(s) };
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
    $("#niveau").textContent = `Évaluation nationale · ${sujet.niveau}`;
    $("#titre").textContent = sujet.titre;
    $("#descriptif").textContent = `${sujet.questions.length} questions · ${sujet.consignes}`;
    $("#source").innerHTML = `Questions : ${sujet.source.replace(/, licence Etalab 2\.0\.?$/, "")} — <a href="${sujet.lienSource}" target="_blank" rel="noopener">Eduscol</a>, licence Etalab 2.0.`;
    const dernier = lire();
    $("#dernier").hidden = !dernier;
    if (dernier) $("#dernier").textContent = `Ton dernier sujet (${dernier.type === "officiel" ? "officiel" : "jumeau"}) : ${dernier.score} / ${dernier.total} — ${dernier.groupe}`;
    montrer("#accueil");
  }

  // ---------- Passation ----------
  function lancer(type, numeros) {
    const graine = type === "officiel" ? 1 : nouvelleGraine();
    const r = hasard(graine);
    const qs = numeros ? sujet.questions.filter((q) => numeros.includes(q.num)) : sujet.questions;
    const items = qs.map((q) => {
      const g = q.generer(r, type === "officiel");
      const melange = g.melange ?? q.melange ?? true;
      return { q, g, choix: melange ? r.melanger(g.choix) : g.choix.slice() };
    });
    passation = { type, graine, items, reponses: [], debut: Date.now(), i: 0, reprise: Boolean(numeros) };
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
    // Espace insécable avant « ? : ; ! » et après « : le signe ne part jamais seul à la ligne.
    const typo = (t) => t.replace(/ ([?:;!»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
    $("#q-enonce").innerHTML = typo(it.g.enonce);
    $("#q-figure").innerHTML = it.g.figure || "";
    $("#q-figure").hidden = !it.g.figure;
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
      b.innerHTML = `<span class="case" aria-hidden="true"></span><span class="choix-texte">${ch.html}${it.g.suffixe || ""}</span>`;
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
    $("#q-carte").scrollTop = 0;
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
      const g = groupe(score, total);
      zoneGroupe.textContent = g.nom;
      zoneGroupe.className = "groupe g" + g.rang;
      ecrire({ type: passation.type, score, total, groupe: g.nom, date: new Date().toISOString() });
    }
    $("#seuils").hidden = passation.reprise;
    $("#seuils").textContent = `Repères officiels sur ${sujet.questions.length} : ${sujet.seuils.map((s, i) => `${s.nom.toLowerCase()} ${i === 0 ? `jusqu’à ${s.max}` : i === sujet.seuils.length - 1 ? `à partir de ${sujet.seuils[i - 1].max + 1}` : `de ${sujet.seuils[i - 1].max + 1} à ${s.max}`}`).join(" · ")}.`;

    const parDomaine = Object.entries(sujet.domaines).map(([code, nom]) => {
      const r = resultats.filter((x) => x.it.q.domaine === code);
      return r.length ? `<li><span>${nom}</span><b>${r.filter((x) => x.juste).length} / ${r.length}</b></li>` : "";
    }).join("");
    $("#domaines").innerHTML = parDomaine;

    const rates = resultats.filter((x) => !x.juste);
    // D'abord où s'entraîner (un lien par automatisme), puis le détail question par question.
    const parAutomatisme = new Map();
    for (const x of rates) {
      const e = x.it.q.entrainement;
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
        <p class="revoir-titre"><span class="pastille">${it.q.num}</span>${it.q.competence}</p>
        <div class="revoir-reponses">
          <span class="donnee">${choisi ? "Ta réponse : " + choisi.html : "Pas de réponse"}</span>
          <span class="attendue">Bonne réponse : ${bonne.html}</span>
        </div>
        ${vueProf && choisi ? `<p class="erreur-prof">Ce choix montre souvent que l’élève ${minuscule(choisi.erreur).replace(/^ne /, "ne ").replace(/\.$/, "")}.</p>` : ""}
      </li>`;
    }).join("");
    $("#refaire-rates").hidden = rates.length === 0;
    $("#refaire-rates").onclick = () => lancer("jumeau", rates.map((x) => x.it.q.num));
    montrer("#bilan");
  }

  // ---------- Branchements ----------
  $("#lancer-officiel").addEventListener("click", () => lancer("officiel"));
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

  // Recette : ?graine=… rejoue un sujet jumeau précis, ?q=… ouvre directement une question.
  accueil();
  const g = Number(params.get("graine"));
  if (Number.isInteger(g) && g > 0) {
    const r = hasard(g);
    passation = null;
    const items = sujet.questions.map((q) => { const gen = q.generer(r, g === 1); const m = gen.melange ?? q.melange ?? true; return { q, g: gen, choix: m ? r.melanger(gen.choix) : gen.choix.slice() }; });
    passation = { type: g === 1 ? "officiel" : "jumeau", graine: g, items, reponses: [], debut: Date.now(), i: Math.max(0, Math.min(items.length - 1, (Number(params.get("q")) || 1) - 1)), reprise: false };
    montrer("#passe");
    afficherQuestion();
  }
})();
