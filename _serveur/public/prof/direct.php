<?php
// Séance en direct, écran du TABLEAU — lot 1 « question éclair » (07/10/2026).
// Page du professeur, faite pour être projetée : elle ne contient AUCUN nom
// d'élève. Pendant la question, un compteur ; après « Dévoiler », des barres.
// Les réponses élève par élève n'entrent jamais dans le document : elles ne
// passent que dans le fichier téléchargé à la fin, fabriqué en mémoire.
//
// On y arrive depuis « Ma classe » (bouton « Séance en direct »), dans le même
// onglet : la session du professeur est celle de l'onglet (sessionStorage),
// comme le verrou d'inactivité de 30 minutes, partagé avec prof/index.php.
require_once __DIR__ . '/../lib/entetes.php';
header('Content-Type: text/html; charset=utf-8');
$nonce = entetes_page();
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="../favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<title>Séance en direct | maths&amp;go</title>
<style>
  :root {
    --blue: #063f86; --blue-dark: #052f67; --teal: #08aaa5; --orange: #f58220;
    --ink: #10294a; --muted: #5c6c82; --paper: #fff; --line: #d9e2ec; --page: #f6f8fb;
    --vert: #1a7f37; --rouge: #b42318;
    --brand-gradient: linear-gradient(90deg, #08aaa5 0%, #0b67b2 44%, #f58220 72%, #f9bf3b 100%);
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; display: flex; flex-direction: column; background: var(--page); color: var(--ink);
         font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .barre { flex: 0 0 5px; background: var(--brand-gradient); }
  header { flex: 0 0 auto; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
           padding: 10px 16px; background: var(--paper); border-bottom: 1px solid var(--line); }
  header img { display: block; height: 30px; width: auto; }
  header .titre { font-family: Georgia, serif; font-size: 1.15rem; color: var(--blue-dark); }
  header .classe { padding: 3px 12px; border-radius: 999px; background: #e6f6f5; color: #06716e;
                   font-size: .9rem; font-weight: 800; }
  header .droite { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  button { min-height: 44px; padding: 0 16px; font: inherit; font-weight: 700;
           color: #fff; background: var(--blue); border: 0; border-radius: 10px; cursor: pointer; }
  button:hover { background: var(--blue-dark); }
  button:disabled { opacity: .55; cursor: default; }
  button.secondaire { color: var(--blue); background: #fff; border: 2px solid var(--line); }
  button.secondaire:hover { border-color: var(--blue); background: #f3f8fc; }
  button.danger { color: var(--rouge); background: #fff; border: 2px solid #f3d3d0; }
  button.danger:hover { background: #fdecec; }
  button.grand { min-height: 58px; padding: 0 30px; font-size: 1.2rem; border-radius: 14px; }
  /* Tout tient dans l'écran projeté : la zone du milieu prend la place qui
     reste entre l'en-tête et les commandes, sans jamais faire défiler. */
  main { flex: 1 1 auto; min-height: 0; width: 100%; max-width: 1180px; margin: 0 auto;
         padding: 14px 20px 8px; display: flex; flex-direction: column; align-items: center;
         justify-content: center; text-align: center; }
  h1 { margin: 0; font-family: Georgia, serif; color: var(--blue-dark);
       font-size: clamp(2rem, 5.2vw, 3.6rem); line-height: 1.1; }
  .sous { margin: 10px 0 0; color: var(--muted); font-size: clamp(1.05rem, 2vw, 1.4rem); }
  .adresse { margin: 16px 0 0; font-size: clamp(2rem, 6vw, 4.4rem); font-weight: 800;
             letter-spacing: .01em; color: var(--blue); }
  .etapes { margin: 12px 0 0; font-size: clamp(1.15rem, 2.4vw, 1.7rem); color: var(--ink); }
  .etapes b { color: var(--blue-dark); }
  /* Pendant la question : un seul nombre, celui de toute la classe. */
  .compteur { margin: 8px 0 0; font-size: clamp(4.5rem, 17vw, 12rem); font-weight: 800; line-height: 1;
              color: var(--blue-dark); font-variant-numeric: tabular-nums; }
  .compteur small { font-size: .42em; font-weight: 700; color: var(--muted); }
  .jauge { width: min(720px, 90%); height: 16px; margin: 20px auto 0; border-radius: 999px;
           background: #e6ecf3; overflow: hidden; }
  .jauge i { display: block; height: 100%; width: 0; border-radius: 999px;
             background: linear-gradient(90deg, #08aaa5, #0b67b2); transition: width .4s ease; }
  /* Après « Dévoiler » : une barre par réponse, le nombre au-dessus, la lettre
     dessous. Aucun nom. La bonne réponse, si le professeur la désigne, passe
     au vert AVEC une coche (la couleur seule ne suffit pas à un œil daltonien). */
  .barres { flex: 1 1 auto; min-height: 0; width: 100%; max-width: 980px; margin: 14px auto 0;
            display: flex; align-items: stretch; justify-content: center; gap: clamp(10px, 3vw, 34px); }
  .barres button { flex: 1 1 0; max-width: 190px; min-height: 0; padding: 0; display: flex;
                   flex-direction: column; align-items: stretch; background: none; color: var(--ink);
                   border: 0; border-radius: 14px; }
  .barres button:hover { background: #eef3f9; }
  .barres .combien { flex: 0 0 auto; font-size: clamp(1.6rem, 4vw, 2.8rem); font-weight: 800;
                     color: var(--blue-dark); font-variant-numeric: tabular-nums; }
  .barres .colonne { flex: 1 1 auto; min-height: 60px; display: flex; align-items: flex-end;
                     padding: 0 12%; border-bottom: 3px solid var(--blue-dark); }
  .barres .colonne i { display: block; width: 100%; min-height: 4px; border-radius: 10px 10px 0 0;
                       background: #0b67b2; transition: height .5s ease; }
  .barres .lettre { flex: 0 0 auto; padding: 6px 0 2px; font-size: clamp(1.8rem, 4.4vw, 3rem);
                    font-weight: 800; line-height: 1.1; color: var(--blue-dark); }
  .barres button.bonne .colonne i { background: var(--vert); }
  .barres button.bonne .lettre, .barres button.bonne .combien { color: var(--vert); }
  .barres button.bonne .lettre::after { content: " ✓"; }
  .bilan { margin: 8px 0 0; color: var(--muted); font-size: clamp(1rem, 1.8vw, 1.25rem); }
  .commandes { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; gap: 14px;
               flex-wrap: wrap; padding: 12px 16px 18px; }
  .commandes label { display: inline-flex; align-items: center; gap: 8px; color: var(--muted);
                     font-size: .95rem; font-weight: 600; }
  select { min-height: 44px; padding: 6px 10px; font: inherit; color: var(--ink);
           border: 2px solid var(--line); border-radius: 10px; background: #fff; }
  .message { margin: 0; padding: 8px 14px; border-radius: 10px; font-weight: 600;
             background: #fdecec; color: var(--rouge); }
  dialog { border: 0; border-radius: 14px; padding: 20px; max-width: 460px; width: calc(100% - 32px);
           box-shadow: 0 20px 50px rgba(16,41,74,.28); color: var(--ink); }
  dialog::backdrop { background: rgba(16,41,74,.45); }
  dialog h2 { margin: 0 0 8px; font-family: Georgia, serif; font-size: 1.3rem; color: var(--blue-dark); }
  dialog p { margin: 0 0 14px; color: var(--muted); }
  dialog .choix { display: grid; gap: 10px; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
<div class="barre"></div>
<header>
  <img src="../mathsgo-logo.png" alt="maths&go">
  <span class="titre">Séance en direct</span>
  <span class="classe" id="classe" hidden></span>
  <span class="droite">
    <button type="button" class="secondaire" id="retour">Ma classe</button>
    <button type="button" class="danger" id="terminer" hidden>Terminer la séance</button>
  </span>
</header>

<main id="scene" aria-live="polite"></main>

<div class="commandes" id="commandes">
  <p class="message" id="message" hidden></p>
  <label id="reglage-choix" hidden>Réponses possibles
    <select id="choix">
      <option value="2">A et B</option>
      <option value="3">A, B, C</option>
      <option value="4" selected>A, B, C, D</option>
      <option value="5">A à E</option>
      <option value="6">A à F</option>
    </select>
  </label>
  <button type="button" class="grand" id="action" hidden></button>
</div>

<dialog id="fin">
  <h2>Terminer la séance ?</h2>
  <p id="fin-texte"></p>
  <div class="choix">
    <button type="button" id="fin-fichier">Télécharger le fichier, puis terminer</button>
    <button type="button" class="danger" id="fin-sans">Terminer sans fichier</button>
    <button type="button" class="secondaire" id="fin-non">Annuler</button>
  </div>
</dialog>

<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  // Les mêmes clés que « Ma classe » (prof/index.php) : la session et
  // l'instant du dernier geste vivent dans l'onglet, pour les deux pages.
  const CLE_JETON = "mathsgo-suivi-jeton";
  const CLE_GESTE = "mathsgo-suivi-prof-dernier-geste";
  const INACTIVITE_MS = 30 * 60 * 1000;

  let jeton = "";
  try { jeton = sessionStorage.getItem(CLE_JETON) || ""; } catch (_) {}
  const classeId = Number((/(?:^|[#&])classe=(\d+)/.exec(window.location.hash) || [])[1]) || 0;

  function versMaClasse() { window.location.replace("./"); }
  // Pas de session dans cet onglet, ou pas de classe désignée : c'est à
  // « Ma classe » de s'en occuper (elle demande le mot de passe).
  if (!jeton || !classeId) { versMaClasse(); return; }

  // ---------------------------------------------------------- veille du poste
  // Trente minutes sans un geste : retour à « Ma classe », qui relit le même
  // instant rangé et déconnecte. La séance, elle, reste ouverte côté serveur
  // jusqu'à son échéance : on la retrouve en se reconnectant.
  function dernierGeste() {
    try { return Number(sessionStorage.getItem(CLE_GESTE)) || 0; } catch (_) { return 0; }
  }
  function noterGeste() {
    try { sessionStorage.setItem(CLE_GESTE, String(Date.now())); } catch (_) {}
  }
  function veilleDepassee() {
    const dernier = dernierGeste();
    return dernier > 0 && (Date.now() - dernier) >= INACTIVITE_MS;
  }
  if (veilleDepassee()) { versMaClasse(); return; }
  if (!dernierGeste()) noterGeste();
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(evenement => {
    window.addEventListener(evenement, noterGeste, {capture: true, passive: true});
  });
  setInterval(() => { if (veilleDepassee()) versMaClasse(); }, 60000);

  // ------------------------------------------------------------------- l'état
  let direct = null;        // l'état de la séance rendu par le serveur, ou null
  let connu = false;        // le serveur a répondu au moins une fois
  let rythme = 1500;
  let minuteur = 0;
  let enAction = false;     // un geste du professeur est en vol
  let dernierAppel = 0;     // numéro du dernier appel dont la réponse a été retenue
  let compteurAppels = 0;
  let pannes = 0;

  async function api(action, corps = {}) {
    // Le jeton voyage dans le corps ET dans l'en-tête, comme dans « Ma classe ».
    const reponse = await fetch("../api/prof.php", {
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": "Bearer " + jeton},
      body: JSON.stringify(Object.assign({action, jeton, classe_id: classeId}, corps)),
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

  function messager(texte) {
    $("message").textContent = texte || "";
    $("message").hidden = !texte;
  }

  function surErreur(erreur) {
    // Session terminée, ou classe hors de portée : « Ma classe » saura dire quoi.
    if (erreur.statut === 401 || erreur.statut === 403 || erreur.statut === 404) { versMaClasse(); return; }
    messager(erreur.message);
  }

  // Une réponse n'est retenue que si elle est plus récente que la dernière
  // retenue : une interrogation partie AVANT un clic ne doit pas ramener
  // l'écran en arrière quand elle arrive après lui.
  function retenir(numeroAppel, donnees) {
    if (numeroAppel < dernierAppel) return;
    dernierAppel = numeroAppel;
    connu = true;
    if ("direct" in donnees) direct = donnees.direct || null;
    if (donnees.classe && donnees.classe.libelle) {
      $("classe").textContent = donnees.classe.libelle;
      $("classe").hidden = false;
    }
    const propose = Number(donnees.rythme);
    if (propose >= 1000 && propose <= 30000) rythme = propose;
  }

  // ------------------------------------------------------------------ les rendus
  //
  // Un rendu par TYPE de réponse (lib/direct.php, TYPES_DIRECT), comme sur
  // l'écran de l'élève. Pour ajouter un type : une entrée ici — ses commandes
  // (reglage), ses résultats au tableau (resultats), sa cellule dans le
  // fichier (cellule) — et rien d'autre ne change dans cette page.
  const LETTRES = ["A", "B", "C", "D", "E", "F"];
  const RENDUS = {
    choix: {
      commande: "reglage-choix",
      reglage() { return {choix: Number($("choix").value) || 4}; },
      resultats(scene, etat) {
        const combien = Math.max(2, Math.min(LETTRES.length, Number(etat.reglage && etat.reglage.choix) || 4));
        const repartition = etat.repartition || {};
        const lettres = LETTRES.slice(0, combien);
        const maximum = Math.max(1, ...lettres.map(lettre => Number(repartition[lettre]) || 0));
        const barres = document.createElement("div");
        barres.className = "barres";
        lettres.forEach(lettre => {
          const nombre = Number(repartition[lettre]) || 0;
          const barre = document.createElement("button");
          barre.type = "button";
          barre.classList.toggle("bonne", etat.bonne === lettre);
          barre.setAttribute("aria-pressed", etat.bonne === lettre ? "true" : "false");
          barre.setAttribute("aria-label", `Réponse ${lettre} : ${nombre}. Désigner comme bonne réponse.`);
          const haut = document.createElement("span");
          haut.className = "combien";
          haut.textContent = String(nombre);
          const colonne = document.createElement("span");
          colonne.className = "colonne";
          const plein = document.createElement("i");
          plein.style.height = nombre ? `${Math.max(3, Math.round(nombre / maximum * 100))}%` : "4px";
          colonne.append(plein);
          const bas = document.createElement("span");
          bas.className = "lettre";
          bas.textContent = lettre;
          barre.append(haut, colonne, bas);
          // Un clic désigne la bonne réponse ; un second clic la retire.
          barre.addEventListener("click", () => agir("direct.bonne", {bonne: etat.bonne === lettre ? null : lettre}));
          barres.append(barre);
        });
        scene.append(barres);
      },
      cellule(reponse) { return reponse || ""; }
    }
  };

  // --------------------------------------------------------------------- dessin

  function titre(texte) {
    const h1 = document.createElement("h1");
    h1.textContent = texte;
    return h1;
  }
  function ligne(classe, texte) {
    const p = document.createElement("p");
    p.className = classe;
    p.textContent = texte;
    return p;
  }

  let derniereSignature = "";
  function dessiner() {
    const signature = JSON.stringify([connu, direct, enAction]);
    if (signature === derniereSignature) return;
    derniereSignature = signature;

    const scene = $("scene");
    scene.textContent = "";
    const action = $("action");
    action.hidden = true;
    action.disabled = enAction;
    $("reglage-choix").hidden = true;
    $("terminer").hidden = !direct;
    if (!connu) return;

    if (!direct) {
      scene.append(titre("Séance en direct"),
        ligne("sous", "Tu poses ta question à l’oral ou au tableau ; les élèves répondent sur leur écran."));
      action.textContent = "Ouvrir la séance";
      action.dataset.geste = "direct.ouvrir";
      action.hidden = false;
      return;
    }
    if (direct.etat === "attente" || !direct.type) {
      const etapes = document.createElement("p");
      etapes.className = "etapes";
      etapes.append("Entre ton code, puis clique sur ");
      const gras = document.createElement("b");
      gras.textContent = "Séance en direct";
      etapes.append(gras, ".");
      scene.append(titre("Rejoins la séance"), ligne("adresse", "suivi.mathsgo.re"), etapes);
      $("reglage-choix").hidden = false;
      action.textContent = "Lancer la question 1";
      action.dataset.geste = "direct.question";
      action.hidden = false;
      return;
    }
    const rendu = RENDUS[direct.type] || null;
    scene.append(titre("Question " + direct.numero));
    if (direct.etat === "question") {
      const compteur = document.createElement("p");
      compteur.className = "compteur";
      compteur.append(String(direct.repondu));
      const sur = document.createElement("small");
      sur.textContent = " / " + direct.inscrits;
      compteur.append(sur);
      const jauge = document.createElement("div");
      jauge.className = "jauge";
      const plein = document.createElement("i");
      plein.style.width = direct.inscrits > 0
        ? `${Math.min(100, Math.round(direct.repondu / direct.inscrits * 100))}%` : "0";
      jauge.append(plein);
      scene.append(compteur, ligne("sous", direct.repondu > 1 ? "ont répondu" : "a répondu"), jauge);
      action.textContent = "Dévoiler les réponses";
      action.dataset.geste = "direct.devoiler";
      action.hidden = false;
      return;
    }
    // Dévoilée.
    if (rendu) rendu.resultats(scene, direct);
    const sans = Math.max(0, direct.inscrits - direct.repondu);
    scene.append(ligne("bilan",
      `${direct.repondu} réponse${direct.repondu > 1 ? "s" : ""}`
      + (sans > 0 ? ` · ${sans} sans réponse` : "")
      + (direct.bonne ? "" : " · clique sur une barre pour désigner la bonne réponse")));
    $("reglage-choix").hidden = false;
    action.textContent = "Lancer la question " + (direct.numero + 1);
    action.dataset.geste = "direct.question";
    action.hidden = false;
  }

  // ------------------------------------------------------------------- gestes

  async function agir(geste, corps) {
    if (enAction) return;
    enAction = true;
    messager("");
    dessiner();
    const numeroAppel = ++compteurAppels;
    try {
      retenir(numeroAppel, await api(geste, corps || {}));
    } catch (erreur) {
      surErreur(erreur);
    } finally {
      enAction = false;
      dessiner();
    }
  }

  $("action").addEventListener("click", () => {
    const geste = $("action").dataset.geste;
    if (geste === "direct.question") {
      const rendu = RENDUS.choix;
      agir(geste, {type: "choix", reglage: rendu.reglage()});
    } else if (geste) {
      agir(geste);
    }
  });

  $("retour").addEventListener("click", versMaClasse);

  // ------------------------------------------------------------ interrogation

  async function interroger() {
    if (enAction) return;
    const numeroAppel = ++compteurAppels;
    try {
      retenir(numeroAppel, await api("direct.etat"));
      if (pannes) { pannes = 0; messager(""); }
    } catch (erreur) {
      if (erreur.statut) { surErreur(erreur); return; }
      pannes += 1;
      if (pannes >= 2) messager("Connexion perdue. Nouvel essai…");
    }
    dessiner();
  }

  function planifier() {
    window.clearTimeout(minuteur);
    if (document.visibilityState === "hidden") return;
    minuteur = window.setTimeout(async () => { await interroger(); planifier(); },
      pannes >= 2 ? Math.min(rythme * 3, 10000) : rythme);
  }
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") { window.clearTimeout(minuteur); return; }
    if (veilleDepassee()) { versMaClasse(); return; }
    await interroger();
    planifier();
  });

  // --------------------------------------------------- terminer, et le fichier

  // Une cellule de tableur. Un prénom qui commencerait par « = », « + », « - »
  // ou « @ » serait pris pour une formule par Excel : on le neutralise.
  function cellule(valeur) {
    let texte = String(valeur === null || valeur === undefined ? "" : valeur);
    if (/^[=+\-@\t\r]/.test(texte)) texte = "'" + texte;
    return /[";\r\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
  }

  // Le fichier, en mémoire : une ligne par élève, une colonne par question,
  // puis le nombre de bonnes réponses (sur les questions où une bonne réponse
  // a été désignée). Point-virgule et marque d'ordre des octets : c'est ce
  // qu'un Excel français ouvre sans rien demander.
  function fabriquerFichier(contenu) {
    const questions = contenu.questions || [];
    const corrigees = questions.filter(question => question.bonne);
    const lignes = [];
    lignes.push(["Élève", ...questions.map(question => "Q" + question.numero),
      ...(corrigees.length ? [`Bonnes réponses (sur ${corrigees.length})`] : [])]);
    if (corrigees.length) {
      lignes.push(["Bonne réponse", ...questions.map(question => question.bonne || ""), ""]);
    }
    (contenu.eleves || []).forEach(eleve => {
      const reponses = eleve.reponses || {};
      const nom = eleve.prenom
        ? eleve.prenom + (eleve.initiale ? ` ${eleve.initiale}.` : "")
        : "(sans prénom)";
      const cases = questions.map(question => {
        const rendu = RENDUS[question.type];
        const reponse = reponses[String(question.numero)];
        return rendu ? rendu.cellule(reponse) : (reponse || "");
      });
      const ligneEleve = [nom, ...cases];
      if (corrigees.length) {
        ligneEleve.push(corrigees.filter(question => reponses[String(question.numero)] === question.bonne).length);
      }
      lignes.push(ligneEleve);
    });
    return "﻿" + lignes.map(l => l.map(cellule).join(";")).join("\r\n") + "\r\n";
  }

  function nomDuFichier(contenu) {
    const classe = String((contenu.classe && contenu.classe.libelle) || "classe")
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "classe";
    const jour = /^\d{4}-\d{2}-\d{2}$/.test(contenu.jour || "") ? contenu.jour : "";
    return `seance-en-direct-${classe}${jour ? "-" + jour : ""}.csv`;
  }

  function telecharger(nom, texte) {
    const blob = new Blob([texte], {type: "text/csv;charset=utf-8"});
    const adresse = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = adresse;
    lien.download = nom;
    document.body.append(lien);
    lien.click();
    lien.remove();
    window.setTimeout(() => URL.revokeObjectURL(adresse), 10000);
  }

  $("terminer").addEventListener("click", () => {
    const posees = direct ? direct.numero : 0;
    $("fin-texte").textContent = posees > 0
      ? "Les réponses de la séance seront effacées du serveur. Le fichier (une ligne par élève) est le seul endroit où elles resteront."
      : "Aucune question n’a été posée : il n’y a rien à télécharger.";
    $("fin-fichier").hidden = posees < 1;
    $("fin-sans").textContent = posees > 0 ? "Terminer sans fichier" : "Terminer la séance";
    $("fin").showModal();
  });
  $("fin-non").addEventListener("click", () => $("fin").close());

  async function terminer(avecFichier) {
    if (enAction) return;
    enAction = true;
    ["fin-fichier", "fin-sans", "fin-non"].forEach(id => { $(id).disabled = true; });
    try {
      if (avecFichier) {
        // Le fichier D'ABORD, l'effacement ensuite : si le téléchargement
        // échoue, la séance est encore là et l'on peut recommencer.
        const contenu = await api("direct.fichier");
        telecharger(nomDuFichier(contenu), fabriquerFichier(contenu));
      }
      const numeroAppel = ++compteurAppels;
      await api("direct.terminer");
      retenir(numeroAppel, {direct: null});
      $("fin").close();
      messager("");
    } catch (erreur) {
      $("fin").close();
      surErreur(erreur);
    } finally {
      enAction = false;
      ["fin-fichier", "fin-sans", "fin-non"].forEach(id => { $(id).disabled = false; });
      dessiner();
    }
  }
  $("fin-fichier").addEventListener("click", () => terminer(true));
  $("fin-sans").addEventListener("click", () => terminer(false));

  interroger().then(planifier);
})();
</script>
</body>
</html>
