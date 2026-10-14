/* Le livret d'échauffement du monde 6, lot 1 « outil + carte + suivi » (14/10/2026, conception de
   Fable : Claude cowork\splat-relatifs-echauffement\).

   Trois fiches de 12 cartes, E1 « Quand ça ne s'enlève pas », E2 « Des taches en plus », E3 « Les
   jetons numérotés », AVANT la fiche 38 sur la carte des mondes, avec leurs étoiles à part. Ces
   tests EXÉCUTENT la carte des mondes et comparent ses trois fiches à la liste de la conception
   (_sources/livret-splat-relatifs/fiches-echauffement.json) et aux 36 cartes que l'outil a tirées
   pour elle (cartes-echauffement.json, écrit par echauffement_cartes.py, qui s'arrête si l'outil
   n'écrit pas exactement les équations et les solutions de la liste). Le suivi (le garde-fou :
   l'échauffement ne compte nulle part) est dans tests/splat-parcours.test.mjs ; l'écran de fin et
   ?apres= dans tests/splat-etape-suivante.test.mjs. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
const outil = lire("outils/splat_equations.html");
const LISTE = JSON.parse(lire("_sources/livret-splat-relatifs/fiches-echauffement.json"));
const CARTES = JSON.parse(lire("_sources/livret-splat-relatifs/cartes-echauffement.json"));

function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin, a);
  assert.ok(a >= 0 && b > a, `bloc « ${debut} » introuvable`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
vm.runInContext(bloc("const PS=", "const PROF =") +
  ";globalThis.X={MONDES,REL_ECHAUF,ECH_REGLAGES,ECHAUF_VOLET:ECHAUF.volet,SE,FICHE};", ctx, { filename: "splat_univers.html" });
const X = JSON.parse(JSON.stringify(ctx.X));
const decode = (url) => JSON.parse(Buffer.from(url.slice(url.indexOf("#data=") + 6).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));

/* L'équation telle que l'outil l'écrit, relue dans une carte du jeu : les taches (« 2𝑚 »), puis
   chaque jeton à sa place, le vrai signe moins. */
function ecrit(carte) {
  const cote = (row) => {
    const taches = row.filter((t) => t === "x").length;
    let s = taches ? (taches === 1 ? "" : String(taches)) + carte.variable : "";
    row.filter((t) => typeof t === "number").forEach((v) => {
      if (!s) s = v < 0 ? "−" + -v : String(v);
      else s += v < 0 ? " − " + -v : " + " + v;
    });
    return s;
  };
  return cote(carte.left) + " = " + cote(carte.right);
}

test("les trois fiches : codes, titres validés, parcours m4ech1 … m4ech3, dans l'ordre de la liste", () => {
  assert.deepEqual(X.REL_ECHAUF.map((f) => [f.code, f.t, f.p]),
    Object.entries(LISTE.fiches).map(([code, f]) => [code, f.titre, f.parcours]));
  assert.deepEqual(X.REL_ECHAUF.map((f) => f.t), ["Quand ça ne s'enlève pas", "Des taches en plus", "Les jetons numérotés"]);
  assert.deepEqual(X.REL_ECHAUF.map((f) => f.fo), ["x + b = c", "a × x = c · a × x + b = c", "x + b = c · a × x = c · a × x + b = c"]);
  assert.deepEqual(X.REL_ECHAUF.map((f) => f.o), [
    "Des jetons verts et rouges : on enlève, et quand ça coince, on ajoute des rouges.",
    "Deux ou trois taches, toujours avec des jetons +1 et −1 : regroupe, puis partage.",
    "Les mêmes équations avec un jeton par plateau : prêt pour la fiche 38."]);
});

test("les 36 cartes de la carte des mondes sont exactement celles de fiches-echauffement.json (réglage, graine, équation, solution)", () => {
  assert.deepEqual(X.ECH_REGLAGES, LISTE.reglages, "les réglages, à la lettre");
  for (const f of X.REL_ECHAUF) {
    const liste = LISTE.fiches[f.code].cartes;
    assert.equal(f.cartes.length, 12);
    assert.deepEqual(f.cartes, liste.map((c) => [c.reglage, c.graine]), `${f.code} : réglages et graines, carte par carte`);
    // une carte = une partie, « cards=1 », la 1re dans l'adresse, les 11 autres dans « suite »
    const parties = liste.map((c) => LISTE.reglages[c.reglage] + `&cards=1&seed=${c.graine}&unknown=letter`);
    assert.equal(f.q, parties[0]);
    assert.deepEqual(f.suite, parties.slice(1));
    parties.forEach((q) => assert.ok(q.startsWith(LISTE.commun + "&"), q));
    // la liste du prof (« Les 12 cartes »)
    assert.deepEqual(f.eqs, liste.map((c) => c.equation));
    // le jeu : ÉquaSplat, SON parcours, les 12 cartes tirées par l'outil
    assert.ok(f.j.startsWith(`/outils/equasplat.html?eleve=1&parcours=${f.p}#data=`));
    const d = decode(f.j);
    assert.deepEqual(Object.keys(d), ["source", "parcours", "serie"]);
    assert.equal(d.source, "univers_splat");
    assert.equal(d.parcours, f.p);
    assert.deepEqual(d.serie, CARTES[f.code], `${f.code} : la série du jeu est celle que l'outil a tirée`);
    d.serie.forEach((c, k) => {
      assert.equal(ecrit(c), liste[k].equation, `${f.code} carte ${k + 1}`);
      assert.equal(c.x, liste[k].x, `${f.code} carte ${k + 1} : la solution`);
      assert.equal(c.universe, "relative");
      assert.equal(c.numberMode, "grouped");
      assert.equal(c.unknownDisplay, "letter");
    });
  }
  assert.equal(X.REL_ECHAUF.reduce((n, f) => n + f.cartes.length, 0), 36);
});

test("les règles de la liste : solutions des deux signes, une solution nulle au plus par fiche, 6 jetons au plus par plateau", () => {
  for (const f of X.REL_ECHAUF) {
    const serie = CARTES[f.code];
    const x = serie.map((c) => c.x);
    assert.ok(x.some((v) => v < 0) && x.some((v) => v > 0), `${f.code} : des deux signes`);
    assert.equal(x.filter((v) => v === 0).length, 1, `${f.code} : une solution nulle`);
    for (const c of serie) for (const cote of [c.left, c.right]) {
      const jetons = cote.filter((t) => typeof t === "number");
      assert.ok(jetons.length <= 6, ecrit(c));
      // E1 et E2 : des jetons +1 et −1 ; E3 : un jeton numéroté par plateau, de −5 à 5
      if (f.code === "E3") assert.ok(jetons.length <= 1 && jetons.every((v) => Math.abs(v) <= 5), ecrit(c));
      else assert.ok(jetons.every((v) => v === 1 || v === -1), ecrit(c));
    }
    // jamais la même lettre deux fois de suite
    serie.slice(1).forEach((c, k) => assert.notEqual(c.variable, serie[k].variable, `${f.code} cartes ${k + 1}-${k + 2}`));
  }
});

test("les liens de la vue prof : Projeter, Fiche « Fiche E1 — … » (6 par page) et Correction (courte, l'équation)", () => {
  for (const f of X.REL_ECHAUF) {
    const v = "&view=equation";
    const adresse = X.SE + "?" + f.q + v + "&suite=" + f.suite.map((s) => encodeURIComponent(s + v)).join(";");
    assert.equal(f.jp, adresse);
    assert.equal(f.f, adresse + X.FICHE + encodeURIComponent(`Fiche ${f.code} — ${f.t}`));
    assert.equal(f.c, adresse + "&print=correction-equation&layout=6&imprimer=1&title=" + encodeURIComponent(`Fiche ${f.code} — ${f.t}`));
    assert.equal(f.suite.length, 11, "l'outil lit 11 parties après la première (patch du lot)");
  }
  // le patch de l'outil : « suite » jusqu'à 11 parties, et la solution jusqu'à 6 avec les jetons ±1
  assert.match(outil, /\.filter\(Boolean\)\.slice\(0, 11\);/);
  assert.match(outil, /xAbsMax = clamp\(xAbsMax, 1, maxAbs === 1 \? 6 : maxAbs\);/);
});

test("vue élève : le menu « Échauffement » AVANT la partie 1, trois taches cerclées, « Je joue », ni étoile ni case à cocher", () => {
  const c = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
  vm.runInContext(bloc("const PS=", "const PROF =") + bloc("const CHEV_P=", "const main=document") +
    ";globalThis.R={html:echaufHtml(MONDE_RELATIFS),autre:echaufHtml(MONDES[4])};", c);
  const { html, autre } = c.R;
  assert.equal(autre, "", "l'échauffement n'existe qu'au monde 6");
  assert.match(html, /^<li class="volet ferme echauf" id="rel-echauf" data-volet="echauf" role="button" tabindex="0" aria-expanded="false"><span class="rang">Échauffement<\/span><div class="t"><h4>Les jetons \+1 et −1<span class="fiches">fiches E1 à E3<\/span><\/h4><p>Pour s'habituer aux nombres négatifs avec de petits nombres\. Ses étoiles sont à part\.<\/p><\/div><span class="stars" id="starsEchauf"><\/span>/);
  const lis = [...html.matchAll(/<li class="etape echauf" id="rel-ech-(E\d)" data-partie="echauf">([\s\S]*?)<\/li>/g)];
  assert.deepEqual(lis.map((m) => m[1]), ["E1", "E2", "E3"]);
  lis.forEach((m, k) => {
    const f = X.REL_ECHAUF[k];
    assert.match(m[2], new RegExp(`<span class="n">${f.code}</span><span class="eclat" aria-hidden="true">✔︎</span>`));
    assert.ok(m[2].includes(`<h3>${f.t}</h3><div class="forme">${f.fo}</div><p class="obj">${f.o}</p>`));
    assert.ok(m[2].includes(`<a class="jouer" href="${f.j}">`));
    assert.doesNotMatch(m[2], /class="star"|data-id=|faitBtn/, "ni étoile, ni « J'ai réussi »");
  });
  // à la carte : avant la partie 1 du monde 6 ; sur la page, le compteur « ✔ n / 3 » à part
  assert.ok(univers.includes("'<ol class=\"etapes\">'+echaufHtml(m)+m.etapes.map((e,ei)=>{"));
  assert.ok(univers.includes('if(se) se.textContent="\\u2714\\ufe0e "+fe+" / "+ECHAUF.fiches.length;'));
  // réussie : la tache remplie de violet clair (#dcc8f0), cochée
  assert.match(univers, /\.m4 \.etape\.echauf\.done \.badge use\.fond\{fill:#dcc8f0;/);
  assert.match(univers, /\.etape\.echauf\.done \.badge \.eclat\{display:block\}/);
});

test("le « ⭐ 0 / 6 » du monde 6 et le total du haut ne comptent que les étapes", () => {
  const maj = bloc("function majAffichage(){", "/* ============ accordéon");
  const avantEch = maj.slice(0, maj.indexOf("/* l'échauffement du monde 6"));
  assert.ok(!/ECHAUF/.test(avantEch), "les étapes et les parties se comptent comme avant");
  assert.match(avantEch, /if\(st\) st\.textContent="⭐ "\+f\+" \/ "\+m\.etapes\.length;/);
  const ech = maj.slice(maj.indexOf("/* l'échauffement du monde 6"), maj.indexOf("document.getElementById(\"totalTxt\")"))
    .replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(ech.includes("ECHAUF.fiches.forEach"));
  assert.doesNotMatch(ech, /total|fait\+\+|\bfait\b=/, "l'échauffement n'ajoute rien au total ni aux étoiles");
  const relatifs = X.MONDES.find((m) => m.idp === "e3");
  assert.equal(relatifs.etapes.length, 6);
  assert.ok(!relatifs.etapes.some((e) => /^m4ech/.test(e.p)));
});

test("vue prof : la liste « Échauffement » avant les parties du monde 6, ses notes, ses boutons et ses 12 cartes", () => {
  const prof = bloc("function echaufProfHtml(m){", "\n}\n");
  assert.ok(prof.includes("Pour un élève qui découvre les négatifs\\u00a0; ses étoiles sont à part."));
  assert.ok(prof.includes("actionsHtml(f,m,'cartes-'+ECHAUF.li+f.code)+cartesHtml(f,m,'cartes-'+ECHAUF.li+f.code)"));
  assert.ok(univers.includes("return (ei===0?echaufProfHtml(m):'')+(v?voletProfHtml(m,v,vi,n):'')+'<li class=\"etape\" id=\"'+id+'\">'+"));
  X.REL_ECHAUF.forEach((f) => assert.ok(f.n.length > 30, `${f.code} : une note pour le prof`));
});
