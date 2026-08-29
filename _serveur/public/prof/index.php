<?php
// Page « Ma classe » — réservée au professeur, protégée par mot de passe.
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="https://mathsgo.re/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="https://mathsgo.re/favicon.svg">
<link rel="apple-touch-icon" href="https://mathsgo.re/assets/img/apple-touch-icon.png">
<title>Ma classe | maths&amp;go</title>
<style>
  :root {
    --blue: #063f86; --blue-dark: #052f67; --teal: #08aaa5; --orange: #f58220;
    --ink: #10294a; --muted: #5c6c82; --paper: #fff; --line: #d9e2ec; --page: #f6f8fb;
    --vert: #1a7f37; --rouge: #b42318;
    --brand-gradient: linear-gradient(90deg, #08aaa5 0%, #0b67b2 44%, #f58220 72%, #f9bf3b 100%);
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column;
         background: var(--page); color: var(--ink);
         font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .barre { height: 5px; background: var(--brand-gradient); }
  header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
           padding: 12px 16px; background: var(--paper); border-bottom: 1px solid var(--line); }
  header img { display: block; height: 30px; width: auto; }
  header .titre { font-family: Georgia, serif; font-size: 1.15rem; color: var(--blue-dark); }
  header .droite { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  main { flex: 1; width: 100%; max-width: 1220px; margin: 0 auto; padding: 20px 16px 32px; }
  h1 { margin: 0 0 6px; font-family: Georgia, serif; font-size: clamp(1.4rem, 4vw, 1.9rem);
       color: var(--blue-dark); }
  h2 { margin: 26px 0 10px; font-family: Georgia, serif; font-size: 1.2rem; color: var(--blue-dark); }
  p.sous { margin: 0 0 18px; color: var(--muted); }
  .carte { background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
           padding: 16px; box-shadow: 0 10px 26px rgba(22,47,82,.06); }
  label { display: block; margin: 12px 0 6px; font-weight: 700; font-size: .93rem; }
  input[type=text], input[type=password], input[type=number], select {
    width: 100%; min-height: 44px; padding: 8px 12px; font: inherit; color: var(--ink);
    border: 2px solid var(--line); border-radius: 10px; background: #fff; }
  /* Le prénom se saisit directement dans le tableau : discret tant qu'on n'y touche pas. */
  #tableau td input { min-height: 40px; padding: 6px 8px; font-weight: 600; border-color: transparent; background: transparent; }
  #tableau td input:hover { border-color: var(--line); background: #fff; }
  #tableau td input::placeholder { font-weight: 400; font-style: italic; color: #9aa9bb; }
  input:focus, select:focus { outline: 3px solid rgba(11,103,178,.3); border-color: var(--blue); }
  button { min-height: 44px; padding: 0 16px; font: inherit; font-weight: 700;
           color: #fff; background: var(--blue); border: 0; border-radius: 10px; cursor: pointer; }
  button:hover { background: var(--blue-dark); }
  button.secondaire { color: var(--blue); background: #fff; border: 2px solid var(--line); }
  button.secondaire:hover { border-color: var(--blue); background: #f3f8fc; }
  button.danger { color: var(--rouge); background: #fff; border: 2px solid #f3d3d0; }
  button.danger:hover { background: #fdecec; }
  button.petit { min-height: 44px; padding: 0 10px; font-size: .84rem; font-weight: 600; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
  .message { margin: 14px 0 0; padding: 10px 12px; border-radius: 10px; font-weight: 600; }
  .message.erreur { background: #fdecec; color: var(--rouge); }
  .message.ok { background: #e6f6ea; color: var(--vert); }
  .classes { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px;
             grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
  .classes button { width: 100%; text-align: left; color: inherit; background: var(--paper);
                    border: 1px solid var(--line); border-left: 5px solid var(--teal);
                    border-radius: 12px; padding: 14px; font-weight: 400; min-height: 66px; }
  .classes button:hover { border-color: var(--blue); border-left-color: var(--blue); background: #f3f8fc; }
  .classes strong { display: block; font-size: 1.1rem; color: var(--blue-dark); }
  .classes span { color: var(--muted); font-size: .88rem; }
  .tableau-enveloppe { overflow-x: auto; margin-top: 12px; }
  table { width: 100%; border-collapse: collapse; background: var(--paper); font-size: .92rem; }
  th, td { padding: 8px 8px; text-align: left; border-bottom: 1px solid var(--line);
           white-space: nowrap; }
  th { background: #eef3f9; color: var(--blue-dark); font-size: .82rem;
       text-transform: uppercase; letter-spacing: .04em; }
  th button { min-height: 44px; padding: 0; color: var(--blue-dark); background: none;
              font: inherit; font-weight: 700; text-transform: inherit; letter-spacing: inherit; }
  th button:hover { background: none; text-decoration: underline; }
  td.code { font-family: ui-monospace, Consolas, monospace; font-weight: 700;
            letter-spacing: .08em; color: var(--blue-dark); }
  td.sans { color: var(--muted); font-style: italic; }
  .pastille { display: inline-block; padding: 2px 9px; border-radius: 999px;
              font-size: .8rem; font-weight: 800; }
  .p-vert { background: #e6f6ea; color: var(--vert); }
  .p-orange { background: #fdf0e3; color: #a15c11; }
  .p-gris { background: #eef1f5; color: var(--muted); }
  .barre-outils { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
  .barre-outils .espace { margin-left: auto; }
  .fiche { display: none; }
  .fiche h2 { margin-top: 0; }
  .fiche table { font-size: 1rem; }
  .fiche td.code { font-size: 1.15rem; }
  dialog { border: 0; border-radius: 14px; padding: 18px; max-width: 420px; width: calc(100% - 32px);
           box-shadow: 0 20px 50px rgba(16,41,74,.28); }
  dialog::backdrop { background: rgba(16,41,74,.45); }
  footer { padding: 14px 16px; border-top: 1px solid var(--line); background: var(--paper);
           color: var(--muted); font-size: .82rem; text-align: center; }
  footer a { display: inline-block; padding: 12px 8px; color: var(--muted); }
  [hidden] { display: none !important; }
  /* Sous 700 px, le tableau devient une carte par élève : rien ne déborde,
     tout se lit d'un coup d'œil sur un téléphone. */
  @media (max-width: 700px) {
    .tableau-enveloppe { overflow-x: visible; }
    #tableau, #tableau tbody, #tableau tr, #tableau td { display: block; width: 100%; }
    #tableau thead { display: none; }
    #tableau tr { margin-bottom: 12px; padding: 8px 6px 12px; background: var(--paper);
                  border: 1px solid var(--line); border-left: 5px solid var(--teal); border-radius: 12px; }
    #tableau td { display: flex; align-items: center; gap: 10px; padding: 6px 10px;
                  border: 0; white-space: normal; }
    #tableau td::before { content: attr(data-libelle); flex: 0 0 104px; color: var(--muted);
                          font-size: .74rem; font-weight: 800; text-transform: uppercase;
                          letter-spacing: .04em; }
    #tableau td[data-libelle=""]::before { display: none; }
    #tableau td input { width: 100%; }
    #tableau td.actions-eleve { flex-wrap: wrap; gap: 8px; }
    #tableau td.actions-eleve button { flex: 1 1 auto; margin-left: 0 !important; }
  }
  @media print {
    .barre, header, footer, .barre-outils, .actions, #ecran-classe > *:not(.fiche) { display: none !important; }
    body { background: #fff; }
    main { max-width: none; padding: 0; }
    .fiche { display: block; }
    .fiche th, .fiche td { border-bottom: 1px solid #999; }
    .pied-impression { margin-top: 18px; display: flex; align-items: center;
                       justify-content: space-between; font-size: .78rem; color: #444; }
  }
</style>
</head>
<body>
<div class="barre"></div>
<header>
  <img src="https://mathsgo.re/assets/img/mathsgo-logo.png" alt="maths&go">
  <span class="titre">Ma classe</span>
  <span class="droite">
    <span id="qui" hidden></span>
    <button type="button" class="secondaire petit" id="deconnexion" hidden>Se déconnecter</button>
  </span>
</header>

<main>
  <!-- Connexion -->
  <section id="ecran-connexion">
    <h1>Suivi des élèves</h1>
    <p class="sous">Espace réservé. Cette page n’est pas accessible aux élèves.</p>
    <div class="carte" style="max-width:420px">
      <form id="form-connexion" autocomplete="on">
        <label for="identifiant">Identifiant</label>
        <input id="identifiant" name="username" type="text" autocomplete="username" required>
        <label for="motdepasse">Mot de passe</label>
        <input id="motdepasse" name="password" type="password" autocomplete="current-password" required>
        <div class="actions"><button type="submit">Se connecter</button></div>
      </form>
      <p class="message erreur" id="erreur-connexion" hidden></p>
    </div>
  </section>

  <!-- Liste des classes -->
  <section id="ecran-classes" hidden>
    <h1>Mes classes</h1>
    <p class="sous">Choisis une classe, ou crée-en une nouvelle.</p>
    <ul class="classes" id="liste-classes"></ul>
    <h2>Nouvelle classe</h2>
    <div class="carte" style="max-width:420px">
      <form id="form-classe">
        <label for="libelle">Nom de la classe</label>
        <input id="libelle" type="text" maxlength="40" placeholder="405" required>
        <div class="actions"><button type="submit">Créer la classe</button></div>
      </form>
    </div>
    <p class="message" id="message-classes" hidden></p>
  </section>

  <!-- Une classe -->
  <section id="ecran-classe" hidden>
    <button type="button" class="secondaire petit" id="retour">← Toutes mes classes</button>
    <h1 id="titre-classe"></h1>
    <p class="sous" id="resume-classe"></p>

    <div class="barre-outils">
      <button type="button" class="secondaire" id="ajouter">Ajouter des élèves</button>
      <button type="button" class="secondaire" id="imprimer">Imprimer la liste des codes</button>
      <label for="tri" style="margin:0;font-size:.88rem;color:var(--muted);font-weight:600">Trier&nbsp;par</label>
      <select id="tri" style="width:auto;min-width:170px">
        <option value="prenom">Prénom</option>
        <option value="acquises">Tables acquises</option>
        <option value="date">Dernière activité</option>
      </select>
      <button type="button" class="danger espace" id="supprimer-classe">Supprimer la classe</button>
    </div>

    <div class="tableau-enveloppe">
      <table id="tableau">
        <thead>
          <tr>
            <th><button type="button" data-tri="prenom">Élève</button></th>
            <th>Code</th>
            <th><button type="button" data-tri="acquises">Tables acquises</button></th>
            <th>Mélange</th>
            <th>Expert</th>
            <th><button type="button" data-tri="date">Dernière activité</button></th>
            <th></th>
          </tr>
        </thead>
        <tbody id="corps"></tbody>
      </table>
    </div>
    <p class="message" id="message-classe" hidden></p>

    <!-- Fiche à imprimer : code ↔ élève -->
    <div class="fiche" id="fiche">
      <h2 id="fiche-titre"></h2>
      <table>
        <thead><tr><th>Élève</th><th>Code</th><th>Découper</th></tr></thead>
        <tbody id="fiche-corps"></tbody>
      </table>
      <div class="pied-impression">
        <img src="https://mathsgo.re/assets/img/mathsgo-logo-print.png" alt="maths&go" style="height:26px">
        <span>mathsgo.re · CC BY-NC-SA 4.0</span>
      </div>
    </div>
  </section>
</main>

<footer>
  <a href="https://mathsgo.re/">mathsgo.re</a> · CC BY-NC-SA 4.0
</footer>

<dialog id="boite">
  <form method="dialog" id="form-boite">
    <p id="boite-texte" style="margin:0 0 10px;font-weight:600"></p>
    <div id="boite-champs"></div>
    <div class="actions" style="justify-content:flex-end">
      <button type="button" class="secondaire" id="boite-non">Annuler</button>
      <button type="submit" id="boite-oui">Confirmer</button>
    </div>
  </form>
</dialog>

<!-- Le moteur de « Mon parcours » du site : une seule source de vérité pour lire la progression. -->
<script src="https://mathsgo.re/outils/calcul_mental/defi_tables_mon_parcours.js"></script>
<script>
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const PARCOURS = window.MATHSGO_DEFI_TABLES_MON_PARCOURS || null;
  const CLE_JETON = "mathsgo-suivi-jeton";
  let jeton = "";
  let classes = [];
  let classe = null;
  let eleves = [];
  let tri = {colonne: "prenom", sens: 1};

  try { jeton = sessionStorage.getItem(CLE_JETON) || ""; } catch (_) {}

  async function api(action, corps = {}) {
    const reponse = await fetch("../api/prof.php", {
      method: "POST",
      headers: jeton ? {"Content-Type": "application/json", "Authorization": "Bearer " + jeton}
                     : {"Content-Type": "application/json"},
      body: JSON.stringify(Object.assign({action}, corps)),
      cache: "no-store"
    });
    const donnees = await reponse.json().catch(() => null);
    if (!reponse.ok || !donnees || !donnees.ok) {
      const erreur = new Error((donnees && donnees.erreur) || "Le serveur ne répond pas.");
      erreur.statut = reponse.status;
      throw erreur;
    }
    return donnees;
  }

  function messager(id, texte, type) {
    const bloc = $(id);
    bloc.textContent = texte || "";
    bloc.className = "message " + (type || "");
    bloc.hidden = !texte;
  }

  function montrer(ecran) {
    ["ecran-connexion", "ecran-classes", "ecran-classe"].forEach(id => { $(id).hidden = id !== ecran; });
    const connecte = ecran !== "ecran-connexion";
    $("deconnexion").hidden = !connecte;
    $("qui").hidden = !connecte;
  }

  async function deconnecter(silencieux) {
    try { if (jeton) await api("deconnexion"); } catch (_) {}
    jeton = "";
    try { sessionStorage.removeItem(CLE_JETON); } catch (_) {}
    montrer("ecran-connexion");
    if (!silencieux) messager("erreur-connexion", "", "");
  }

  function surErreur(erreur, zone) {
    if (erreur.statut === 401) { deconnecter(true); messager("erreur-connexion", "Session terminée, reconnecte-toi.", "erreur"); return; }
    messager(zone, erreur.message, "erreur");
  }

  // ---------------------------------------------------------------- lecture d'une progression

  function lireProgression(brut) {
    const vide = {acquises: [], melange: "—", etoiles: 0, lisible: Boolean(PARCOURS)};
    if (!PARCOURS || !brut) return vide;
    try {
      const parcours = PARCOURS.normaliserParcours(brut);
      const etat = PARCOURS.etatAffichage(parcours);
      let melange = "—";
      if (etat.melange.visible) melange = etat.melange.aJour ? "à jour" : "à refaire";
      else if (etat.acquises.length === PARCOURS.TABLES.length) melange = "toutes acquises";
      return {acquises: etat.acquises, melange, etoiles: etat.expert.niveau, lisible: true};
    } catch (_) { return vide; }
  }

  function dateLisible(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("fr-FR", {day: "2-digit", month: "2-digit", year: "2-digit"});
  }

  function nomAffiche(eleve) {
    if (!eleve.prenom) return "";
    return eleve.initiale ? `${eleve.prenom} ${eleve.initiale}.` : eleve.prenom;
  }

  // ---------------------------------------------------------------- tableau de la classe

  function trierEleves() {
    const clef = eleve => {
      if (tri.colonne === "acquises") return eleve.lu.acquises.length;
      if (tri.colonne === "date") return eleve.maj_le || "";
      return (eleve.prenom || "￿").toLocaleLowerCase("fr");
    };
    eleves.sort((a, b) => {
      const x = clef(a), y = clef(b);
      if (x < y) return -1 * tri.sens;
      if (x > y) return 1 * tri.sens;
      return (a.code || "").localeCompare(b.code || "");
    });
  }

  function dessinerTableau() {
    trierEleves();
    const corps = $("corps");
    corps.textContent = "";

    eleves.forEach(eleve => {
      const ligne = document.createElement("tr");

      const cNom = document.createElement("td");
      const champ = document.createElement("input");
      champ.type = "text";
      champ.value = nomAffiche(eleve);
      champ.placeholder = "Prénom et initiale";
      champ.maxLength = 44;
      champ.style.minWidth = "132px";
      champ.style.minHeight = "36px";
      champ.addEventListener("change", () => nommer(eleve, champ));
      cNom.appendChild(champ);

      const cCode = document.createElement("td");
      cCode.className = "code";
      cCode.textContent = eleve.code;

      const cAcquises = document.createElement("td");
      const nombre = eleve.lu.acquises.length;
      cAcquises.innerHTML = `<span class="pastille ${nombre ? "p-vert" : "p-gris"}">${nombre} / 9</span>`;
      if (nombre) cAcquises.title = "Tables " + eleve.lu.acquises.join(", ");

      const cMelange = document.createElement("td");
      const m = eleve.lu.melange;
      cMelange.innerHTML = m === "—"
        ? '<span class="pastille p-gris">—</span>'
        : `<span class="pastille ${m === "à refaire" ? "p-orange" : "p-vert"}">${m}</span>`;

      const cExpert = document.createElement("td");
      cExpert.textContent = eleve.lu.etoiles ? "★".repeat(eleve.lu.etoiles) : "—";
      cExpert.style.color = eleve.lu.etoiles ? "#c9860a" : "var(--muted)";
      cExpert.style.letterSpacing = ".08em";

      const cDate = document.createElement("td");
      const quand = dateLisible(eleve.maj_le);
      cDate.textContent = quand || "rien fait";
      if (!quand) cDate.className = "sans";

      const cActions = document.createElement("td");
      const regen = document.createElement("button");
      regen.type = "button";
      regen.className = "secondaire petit";
      regen.textContent = "Nouveau code";
      regen.addEventListener("click", () => regenerer(eleve));
      const sup = document.createElement("button");
      sup.type = "button";
      sup.className = "danger petit";
      sup.style.marginLeft = "6px";
      sup.textContent = "Supprimer";
      sup.addEventListener("click", () => supprimerEleve(eleve));
      cActions.append(regen, sup);

      cNom.dataset.libelle = "";
      cCode.dataset.libelle = "Code";
      cAcquises.dataset.libelle = "Acquises";
      cMelange.dataset.libelle = "Mélange";
      cExpert.dataset.libelle = "Expert";
      cDate.dataset.libelle = "Activité";
      cActions.dataset.libelle = "";
      cActions.className = "actions-eleve";

      ligne.append(cNom, cCode, cAcquises, cMelange, cExpert, cDate, cActions);
      corps.appendChild(ligne);
    });

    const sans = eleves.filter(e => !e.maj_le).length;
    $("resume-classe").textContent = eleves.length
      ? `${eleves.length} élève${eleves.length > 1 ? "s" : ""} · ${sans} n’${sans > 1 ? "ont" : "a"} encore rien fait`
      : "Aucun élève. Commence par en ajouter.";
    if (!PARCOURS) {
      messager("message-classe",
        "La progression ne peut pas être détaillée : le moteur de Défi tables n’a pas pu être chargé depuis mathsgo.re.",
        "erreur");
    }
    dessinerFiche();
  }

  function dessinerFiche() {
    $("fiche-titre").textContent = `Codes des élèves — ${classe.libelle}`;
    const corps = $("fiche-corps");
    corps.textContent = "";
    [...eleves].sort((a, b) => (a.prenom || "￿").localeCompare(b.prenom || "￿", "fr"))
      .forEach(eleve => {
        const ligne = document.createElement("tr");
        const nom = document.createElement("td");
        nom.textContent = nomAffiche(eleve) || "—";
        const code = document.createElement("td");
        code.className = "code";
        code.textContent = eleve.code;
        const vide = document.createElement("td");
        vide.textContent = "✂";
        vide.style.color = "#bbb";
        ligne.append(nom, code, vide);
        corps.appendChild(ligne);
      });
  }

  // ---------------------------------------------------------------- actions

  async function chargerClasses() {
    try {
      const donnees = await api("classes.liste");
      classes = donnees.classes || [];
      const liste = $("liste-classes");
      liste.textContent = "";
      classes.forEach(uneClasse => {
        const li = document.createElement("li");
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.innerHTML = "<strong></strong><span></span>";
        bouton.querySelector("strong").textContent = uneClasse.libelle;
        bouton.querySelector("span").textContent =
          `${uneClasse.eleves} élève${uneClasse.eleves > 1 ? "s" : ""}`;
        bouton.addEventListener("click", () => ouvrirClasse(uneClasse.id));
        li.appendChild(bouton);
        liste.appendChild(li);
      });
      if (!classes.length) {
        const li = document.createElement("li");
        li.style.color = "var(--muted)";
        li.textContent = "Aucune classe pour l’instant.";
        liste.appendChild(li);
      }
      montrer("ecran-classes");
    } catch (erreur) { surErreur(erreur, "message-classes"); }
  }

  async function ouvrirClasse(id) {
    try {
      const donnees = await api("tableau", {classe_id: id, appli: "defi-tables"});
      classe = donnees.classe;
      eleves = (donnees.eleves || []).map(eleve => Object.assign({}, eleve, {lu: lireProgression(eleve.parcours)}));
      $("titre-classe").textContent = classe.libelle;
      messager("message-classe", "", "");
      montrer("ecran-classe");
      dessinerTableau();
    } catch (erreur) { surErreur(erreur, "message-classes"); }
  }

  async function nommer(eleve, champ) {
    const texte = champ.value.trim().replace(/\s+/g, " ");
    const morceaux = texte.split(" ");
    const prenom = morceaux[0] || "";
    const initiale = (morceaux[1] || "").replace(/\./g, "").slice(0, 1);
    try {
      await api("eleves.nommer", {eleve_id: eleve.id, prenom, initiale});
      eleve.prenom = prenom;
      eleve.initiale = initiale.toUpperCase();
      champ.value = nomAffiche(eleve);
      dessinerFiche();
      messager("message-classe", "", "");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  function demander(texte, champs) {
    return new Promise(resolve => {
      $("boite-texte").textContent = texte;
      const zone = $("boite-champs");
      zone.textContent = "";
      (champs || []).forEach(champ => {
        const etiquette = document.createElement("label");
        etiquette.textContent = champ.libelle;
        etiquette.htmlFor = "boite-" + champ.nom;
        const entree = document.createElement("input");
        entree.id = "boite-" + champ.nom;
        entree.type = champ.type || "text";
        entree.value = champ.valeur ?? "";
        if (champ.min !== undefined) entree.min = champ.min;
        if (champ.max !== undefined) entree.max = champ.max;
        zone.append(etiquette, entree);
      });
      const boite = $("boite");
      const fermer = valeur => {
        boite.close();
        $("form-boite").onsubmit = null;
        $("boite-non").onclick = null;
        resolve(valeur);
      };
      $("form-boite").onsubmit = event => {
        event.preventDefault();
        const sortie = {};
        (champs || []).forEach(champ => { sortie[champ.nom] = $("boite-" + champ.nom).value; });
        fermer(sortie);
      };
      $("boite-non").onclick = () => fermer(null);
      boite.showModal();
    });
  }

  $("ajouter").addEventListener("click", async () => {
    const reponse = await demander("Combien d’élèves ajouter à cette classe ?",
      [{nom: "nombre", libelle: "Nombre d’élèves", type: "number", valeur: "25", min: 1, max: 60}]);
    if (!reponse) return;
    const nombre = parseInt(reponse.nombre, 10);
    if (!nombre || nombre < 1 || nombre > 60) {
      messager("message-classe", "Indique un nombre entre 1 et 60.", "erreur"); return;
    }
    try {
      await api("eleves.ajouter", {classe_id: classe.id, nombre});
      await ouvrirClasse(classe.id);
      messager("message-classe", `${nombre} code${nombre > 1 ? "s" : ""} créé${nombre > 1 ? "s" : ""}. Écris les prénoms en face, puis imprime la liste.`, "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  });

  async function regenerer(eleve) {
    const reponse = await demander(
      `Donner un nouveau code à ${nomAffiche(eleve) || "cet élève"} ? L’ancien (${eleve.code}) ne marchera plus. La progression est conservée.`);
    if (!reponse) return;
    try {
      const donnees = await api("eleves.regenerer", {eleve_id: eleve.id});
      eleve.code = donnees.code;
      dessinerTableau();
      messager("message-classe", `Nouveau code : ${donnees.code}`, "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  async function supprimerEleve(eleve) {
    const reponse = await demander(
      `Supprimer ${nomAffiche(eleve) || "cet élève"} et toute sa progression ? Cette action est définitive.`);
    if (!reponse) return;
    try {
      await api("eleves.supprimer", {eleve_id: eleve.id});
      eleves = eleves.filter(autre => autre.id !== eleve.id);
      dessinerTableau();
      messager("message-classe", "Élève supprimé.", "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  }

  $("supprimer-classe").addEventListener("click", async () => {
    const reponse = await demander(
      `Supprimer la classe ${classe.libelle}, ses ${eleves.length} élève(s) et toutes leurs progressions ? Cette action est définitive.`);
    if (!reponse) return;
    try {
      await api("classes.supprimer", {classe_id: classe.id});
      await chargerClasses();
      messager("message-classes", "Classe supprimée.", "ok");
    } catch (erreur) { surErreur(erreur, "message-classe"); }
  });

  $("imprimer").addEventListener("click", () => window.print());
  $("retour").addEventListener("click", () => { chargerClasses(); });

  document.querySelectorAll("th button[data-tri]").forEach(bouton => {
    bouton.addEventListener("click", () => {
      const colonne = bouton.dataset.tri;
      tri = {colonne, sens: tri.colonne === colonne ? -tri.sens : (colonne === "prenom" ? 1 : -1)};
      $("tri").value = colonne;
      dessinerTableau();
    });
  });

  $("tri").addEventListener("change", event => {
    const colonne = event.target.value;
    tri = {colonne, sens: colonne === "prenom" ? 1 : -1};
    dessinerTableau();
  });

  $("form-classe").addEventListener("submit", async event => {
    event.preventDefault();
    const libelle = $("libelle").value.trim();
    if (!libelle) return;
    try {
      const donnees = await api("classes.creer", {libelle, applis: ["defi-tables"]});
      $("libelle").value = "";
      await chargerClasses();
      ouvrirClasse(donnees.id);
    } catch (erreur) { surErreur(erreur, "message-classes"); }
  });

  $("form-connexion").addEventListener("submit", async event => {
    event.preventDefault();
    messager("erreur-connexion", "", "");
    try {
      const reponse = await fetch("../api/prof.php", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          action: "connexion",
          identifiant: $("identifiant").value,
          motdepasse: $("motdepasse").value
        })
      });
      const donnees = await reponse.json().catch(() => null);
      if (!reponse.ok || !donnees || !donnees.ok) {
        messager("erreur-connexion", (donnees && donnees.erreur) || "Connexion impossible.", "erreur");
        return;
      }
      jeton = donnees.jeton;
      try { sessionStorage.setItem(CLE_JETON, jeton); } catch (_) {}
      $("motdepasse").value = "";
      $("qui").textContent = $("identifiant").value;
      chargerClasses();
    } catch (_) {
      messager("erreur-connexion", "Le serveur ne répond pas.", "erreur");
    }
  });

  $("deconnexion").addEventListener("click", () => deconnecter(false));

  if (jeton) {
    api("moi").then(donnees => {
      $("qui").textContent = donnees.identifiant;
      chargerClasses();
    }).catch(() => deconnecter(true));
  }
})();
</script>
</body>
</html>
