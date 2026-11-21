// Défi tables — lot 5 de l'audit (01/10/2026) : la feuille des tables des
// professeurs (outils/calcul_mental/fiche_tables_multiplication.pdf).
// « 3 × 7 » (multiplicateur × table) de 0 à 10, comme les cartes et l'écran
// « Lire la table » ; un seul logo, en haut à droite ; en-têtes assez foncés
// pour le noir et blanc ; un seul script dessine le PDF, et la publication du
// site le relance sans python-docx.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat, access } from "node:fs/promises";

const racine = new URL("../", import.meta.url);
const lire = chemin => readFile(new URL(chemin, racine), "utf8");
const source = await lire("_sources/defi-tables/generer_fiche_tables.py");
const pdf = await readFile(new URL("outils/calcul_mental/fiche_tables_multiplication.pdf", racine));

function luminance(hexa) {
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hexa.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contraste = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

test("le sens « multiplicateur × table », de 0 à 10, comme les cartes et « Lire la table »", () => {
  assert.match(source, /^MULTIPLIERS = range\(0, 11\)$/m);
  assert.match(source, /def libelle\(table: int, k: int\) -> str:\s*\n\s*"""[^"]*"""\s*\n\s*return f"\{k\} × \{table\}"/);
  assert.match(source, /pdf\.drawRightString\(egal - 3\.2 \* mm, base, libelle\(table, k\)\)/);
  // Lot 2b : le DOCX s'aligne sur « = » par trois taquets, comme le PDF.
  assert.match(source, /set_run_font\(paragraph\.add_run\(f"\\t\{libelle\(table_number, k\)\}\\t=\\t\{table_number \* k\}"\), 11, INK\)/, "le DOCX dit la même chose");
  assert.match(source, /taquets\.add_tab_stop\(Cm\(EGAL_CM - 0\.32\), WD_TAB_ALIGNMENT\.RIGHT\)\s*taquets\.add_tab_stop\(Cm\(EGAL_CM\), WD_TAB_ALIGNMENT\.CENTER\)\s*taquets\.add_tab_stop\(Cm\(EGAL_CM \+ 0\.32\), WD_TAB_ALIGNMENT\.LEFT\)/);
  assert.match(source, /if Document is None:\s*raise SystemExit\(f"OK : \{OUTPUT_PDF\.relative_to\(ROOT\)\} est refait\. Le DOCX ne l'est pas : "/, "sans python-docx : un message clair");
  const cartes = lire("_sources/defi-tables/generer_cartes_tables.py");
  return cartes.then(texte => assert.match(texte, /MULTIPLIERS = range\(0, 11\)/, "les cartes vont aussi de 0 à 10"));
});

// Le texte du PDF (polices TrueType en sous-ensemble) ne se lit pas ici :
// defi-tables-audit-5-verifier-pdf.py le relit avec pdftotext.
test("le PDF publié est une page A4 dessinée par reportlab, avec ses métadonnées", () => {
  const brut = pdf.toString("latin1");
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.match(brut, /\/Count 1\b/);
  assert.match(brut, /\/MediaBox \[ 0 0 595\.2756 841\.8898 \]/);
  assert.match(brut, /\/Producer \(ReportLab/, "plus le PDF modèle recouvert par pypdf");
  assert.match(brut, /\/Title \(Mes tables de multiplication\)/);
  assert.ok(pdf.length > 20000);
});

test("un seul logo, en haut à droite ; le QR à gauche ; rien d'autre que la signature en pied", () => {
  assert.equal((source.match(/drawImage\(/g) || []).length, 1, "un seul logo dans le PDF");
  assert.match(source, /pdf\.drawImage\(str\(LOGO\), width - margin - logo_w, top - 17\.5 \* mm/);
  assert.match(source, /qr_x = margin - 1 \* mm/);
  assert.equal((source.match(/add_picture\(str\(LOGO\)/g) || []).length, 1, "un seul logo dans le DOCX");
  assert.match(source, /logo\.alignment = WD_ALIGN_PARAGRAPH\.RIGHT/);
  assert.match(source, /LOGO = ROOT \/ "assets" \/ "img" \/ "mathsgo-logo-print\.png"/);
  assert.match(source, /FOOTER_TEXT = "mathsgo\.re  ·  CC BY-NC-SA 4\.0"/);
});

test("lisible en noir et blanc : le blanc des en-têtes se lit sur les trois couleurs", () => {
  for (const nom of ["TEAL", "BLUE", "ORANGE"]) {
    const valeur = new RegExp(`^${nom} = "([0-9A-F]{6})"$`, "m").exec(source);
    assert.ok(valeur, nom);
    assert.ok(contraste(valeur[1], "FFFFFF") >= 4.5, `${nom} #${valeur[1]} : ${contraste(valeur[1], "FFFFFF").toFixed(2)} contre le blanc`);
  }
  assert.doesNotMatch(source, /^ORANGE = "E66D0A"$/m, "l'ancien orange clair est parti");
});

test("la publication relance la fiche sans python-docx, et l'ancien PDF modèle est retiré", async () => {
  const workflow = await lire(".github/workflows/publier.yml");
  assert.match(workflow, /python _sources\/defi-tables\/generer_pdf\.py/);
  const publication = await lire("_sources/defi-tables/generer_pdf.py");
  assert.match(publication, /from generer_fiche_tables import OUTPUT_PDF, build_pdf/);
  assert.doesNotMatch(publication, /import fitz|pypdf/);
  // python-docx n'est importé que dans un try : il n'est pas installé à la publication.
  const avantDocx = source.slice(0, source.indexOf("# ------------------------------------------------------------------ le DOCX"));
  assert.doesNotMatch(avantDocx, /^from docx|^import docx|^from PIL/m);
  assert.match(source, /try:\s*\n\s*from docx import Document[\s\S]*?except ImportError:/);
  await assert.rejects(access(new URL("_sources/defi-tables/fiche_tables_multiplication_modele.pdf", racine)));
  const docx = await readFile(new URL("_sources/defi-tables/fiche_tables_multiplication.docx", racine));
  assert.equal(docx.subarray(0, 2).toString(), "PK", "la source DOCX existe toujours");
});

test("la miniature a été refaite (993 × 1404, webp plus légère) et son ?v= suit", async () => {
  const catalogue = await lire("assets/js/catalogue-refonte-data.js");
  assert.match(catalogue, /"thumbnail": "assets\/img\/thumbnails\/calcul-mental\/fiche-tables-multiplication\.png\?v=3"/);
  const png = await readFile(new URL("assets/img/thumbnails/calcul-mental/fiche-tables-multiplication.png", racine));
  assert.equal(png.readUInt32BE(16), 993);
  assert.equal(png.readUInt32BE(20), 1404);
  const webp = await stat(new URL("assets/img/thumbnails/calcul-mental/fiche-tables-multiplication.webp", racine));
  assert.ok(webp.size < png.length);
  assert.match(await lire("outils/index.html"), /catalogue-refonte-data\.js\?v=generateur-tuiles-20261121-1/);
});
