import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/* Les logos du PDF « page par page » des livrets SPLAT! (04/10/2026, décisions de Gwenaël par
   questions à choix, sur planches) :
   - un collègue qui imprime une seule fiche du PDF page par page n'a pas le dos, où sont les
     logos : chaque page-fiche de ce PDF garde le logo de l'IREMI SEUL dans son bandeau
     (maths&go est déjà au pied de chaque page : mathsgo.re/splat) ;
   - le logo reste À DROITE (monde 1 : à sa place dans le bandeau ; mondes 2 et 3 : à droite de la
     boîte du QR, qui se pousse à gauche — réponse A, préférée à « à gauche du QR ») ;
   - le livret à plier ne change pas : aucun logo sur ses fiches, IREMI + maths&go au dos ;
   - mondes 1, 2, 3 d'abord ; le monde 4 au lot M4-4 (04/10/2026, livrets « tablette » : même
     règle, IREMI à droite du QR) ; les mondes 5 et 6 n'ont pas l'IREMI et ne changent pas.
   Chaque fiche est rendue deux fois, avec les mêmes graines : sans logo (livret à plier) et avec
   l'IREMI (page par page). */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const RENDUS = {
  "monde 1": lire("_sources/livret-petit-splat/render.py"),
  "monde 2": lire("_sources/livret-splat-classique/render.py"),
  "monde 3": lire("_sources/livret-splat-enquete/render.py"),
  "monde 4": lire("_sources/livret-splat-systeme/render.py"),
};

test("mondes 1 à 4 : JS_IREMI_SEUL retire seulement le logo maths&go du bandeau, et vérifie qu'il reste l'IREMI", () => {
  for (const [m, r] of Object.entries(RENDUS)) {
    const js = r.slice(r.indexOf('JS_IREMI_SEUL = """'), r.indexOf('}"""', r.indexOf('JS_IREMI_SEUL = """')));
    assert.ok(js.length > 50, `${m} : JS_IREMI_SEUL défini`);
    const [maths, irem] = m === "monde 1" ? ["activity-logo-maths", "activity-logo-irem"] : ["print-page-logo-maths", "print-page-logo-irem"];
    assert.ok(js.includes(`'.${maths}'`) && js.includes(`'.${irem}'`), `${m} : les deux logos sont reconnus`);
    assert.match(js, /if \(mg\.length !== 1 \|\| ir\.length !== 1\) return 'logos inattendus dans le bandeau';/, m);
    assert.match(js, /mg\[0\]\.remove\(\);/, `${m} : maths&go retiré`);
    assert.doesNotMatch(js, /ir\[0\]\.remove|insertBefore/, `${m} : l'IREMI reste où l'outil le met, à droite`);
    // le livret à plier garde JS_SANS_LOGO
    assert.match(r, /JS_SANS_LOGO = """/, `${m} : JS_SANS_LOGO toujours là`);
    assert.match(r, /r = await pg\.evaluate\(JS_IREMI_SEUL if iremi else JS_SANS_LOGO\)/, `${m} : un seul appel, selon la version`);
  }
});

test("chaque fiche est rendue deux fois : sans logo (livret à plier) et avec l'IREMI (page par page)", () => {
  const m1 = RENDUS["monde 1"];
  assert.match(m1, /await pdf\(url, tmp \/ f"p\{f\['n'\]\+1\}\.pdf", injecter=f"\{qrweb\}\/fiche\{f\['n'\]\}\.png"\)\n\s*# la même fiche avec le logo de l'IREMI, pour le PDF page par page\n\s*await pdf\(url, tmp \/ f"p\{f\['n'\]\+1\}_iremi\.pdf", injecter=f"\{qrweb\}\/fiche\{f\['n'\]\}\.png", iremi=True\)/);
  assert.match(m1, /for p in \[a\.pages\[0\] if a else q for a, q in zip\(iremi, pages\)\]:/, "monde 1 : le PDF page par page prend les fiches _iremi");
  const m2 = RENDUS["monde 2"];
  assert.match(m2, /await pdf_fiche\(f, tmp \/ f"fiche\{f\['n'\]\}\.pdf"\)\n\s*# la même fiche avec le logo de l'IREMI, pour le PDF page par page\n\s*await pdf_fiche\(f, tmp \/ f"fiche\{f\['n'\]\}_iremi\.pdf", iremi=True\)/);
  assert.match(m2, /for p in par_page:/, "monde 2 : le PDF page par page prend les fiches _iremi");
  const m3 = RENDUS["monde 3"];
  assert.match(m3, /await pdf_fiche\(f, tmp \/ f"fiche\{i\}\.pdf"\)\n\s*# la même fiche avec le logo de l'IREMI, pour le PDF page par page\n\s*await pdf_fiche\(f, tmp \/ f"fiche\{i\}_iremi\.pdf", iremi=True\)/);
  assert.match(m3, /for f in ordre_des_pages\(niv, tmp, iremi=True\):/, "monde 3 : le PDF page par page prend les fiches _iremi");
  const m4 = RENDUS["monde 4"];
  assert.match(m4, /await pdf_fiche\(f, tmp \/ f"fiche\{i\}\.pdf"\)\n\s*await pdf_fiche\(f, tmp \/ f"fiche\{i\}_iremi\.pdf", iremi=True\)/);
  assert.match(m4, /par_page = lire\(ordre_des_pages\(niv, tmp, iremi=True\)\)/, "monde 4 : le PDF page par page prend les fiches _iremi");
  // monde 4 (tablette) : le livret à plier est imposé à partir des pages SANS logo, en haut / en bas
  assert.match(m4, /pages = lire\(ordre_des_pages\(niv, tmp\)\)/);
  assert.match(m4, /add_overlay\(pages\[haut - 1\], [^\n]*\)\n\s*pikepdf\.Page\(feuille\)\.add_overlay\(pages\[bas - 1\]/);
  // le livret à plier est toujours imposé à partir des pages SANS logo
  for (const [m, r] of Object.entries(RENDUS)) if (m !== "monde 4")
    assert.match(r, /for idx, tx in \(\(g, 0\.0\), \(d, A4W\)\):\s*\n\s*pikepdf\.Page\(feuille\)\.add_overlay\(pages\[idx - 1\]/, `${m} : à plier = pages sans logo`);
});

test("monde 2 : avec l'IREMI, un titre trop long se coupe après le tiret (JS_TITRE, comme l'Enquête), seulement dans le PDF page par page", () => {
  const r = RENDUS["monde 2"];
  assert.match(r, /JS_TITRE = """/);
  assert.match(r, /const tete = t\.slice\(0, i\) \+ \(corr \|\| ' —'\);/);
  assert.match(r, /if iremi:\n\s*# la mesure du titre se fait à la largeur imprimée[^\n]*\n\s*await pg\.set_viewport_size\(\{"width": 733, "height": 1062\}\)\n\s*await pg\.emulate_media\(media="print"\)\n\s*r = await pg\.evaluate\(JS_TITRE\)/);
});

test("mondes 5 et 6 : rien ne change (pas d'IREMI dans leurs livrets)", () => {
  for (const p of ["_sources/livret-splat-equations/render.py", "_sources/livret-splat-relatifs/render.py"])
    assert.doesNotMatch(lire(p), /JS_IREMI_SEUL|_iremi\.pdf/, p);
});
