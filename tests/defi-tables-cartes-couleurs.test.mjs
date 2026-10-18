// Cartes des tables, version 2 (18/10/2026) : une couleur par table pour trier
// le paquet quand on imprime toutes les tables, sans perdre le tri à la
// photocopie en noir et blanc (« table de 7 » en bas du dos) ; dos teinté pour
// voir d'un coup d'œil de quel côté est la carte ; recto : le calcul seul.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const racine = new URL("../", import.meta.url);
const source = await readFile(new URL("_sources/defi-tables/generer_cartes_tables.py", racine), "utf8");

test("une couleur par table, prise dans les bandes de fractions (7 et 9 en plus), et sa teinte pour le dos", () => {
  for (const [table, couleur] of [[2, "#A16207"], [3, "#7C3AED"], [4, "#3F6212"], [5, "#075985"],
    [6, "#9A3412"], [7, "#087A71"], [8, "#BE185D"], [9, "#475569"], [10, "#B91C1C"]]) {
    assert.match(source, new RegExp(`\\n    ${table}: \\("${couleur}", "#[0-9A-F]{6}"\\),`), `table de ${table}`);
  }
});

test("recto épuré (le calcul seul dans son cadre), dos teinté de la couleur de la table", () => {
  const recto = source.match(/def carte_calcul\([\s\S]*?\n\n\n/)[0];
  const verso = source.match(/def carte_reponse\([\s\S]*?\n\n\n/)[0];
  assert.match(recto, /cadre\(pdf, x, y, table\)\n/, "recto blanc");
  assert.doesNotMatch(recto, /table de|etiquette|pastille/, "rien d'autre que le calcul");
  assert.match(verso, /cadre\(pdf, x, y, table, fond=True\)/, "dos teinté");
  assert.match(verso, /f"\{libelle\(table, k\)\} ="/, "le dos rappelle le calcul au-dessus du résultat");
  assert.match(verso, /f"table de \{table\}"/, "la table en bas du dos, pour trier en noir et blanc");
  const titreVerso = source.match(/def carte_titre_verso\([\s\S]*?\n\n\n/)[0];
  assert.match(titreVerso, /fond=True/, "le dos de la carte-titre est teinté comme les autres dos");
});

test("cartes bord à bord, traits de coupe au recto seulement", () => {
  assert.doesNotMatch(source, /CARD_VERSO|E7F7F4/, "plus l'ancien aplat vert");
  assert.match(source, /CARTE_L = \(WIDTH - 2 \* MARGE\) \/ COLONNES/, "pas d'écart entre les cartes : une coupe par trait");
  const recto = source.match(/def page_recto\([\s\S]*?pdf\.showPage\(\)/)[0];
  const verso = source.match(/def page_verso\([\s\S]*?pdf\.showPage\(\)/)[0];
  assert.match(recto, /traits_de_coupe\(pdf\)/);
  assert.doesNotMatch(verso, /traits_de_coupe/);
});

test("textes retirés, consigne d'impression gardée sur le recto", () => {
  assert.doesNotMatch(source, /les réponses, au dos de chaque calcul/);
  assert.doesNotMatch(source, /"11 cartes à retourner"|CONSIGNE_VERSO/);
  assert.match(source, /CONSIGNE_RECTO = "Imprime en recto verso \(retourner sur le bord long\), puis découpe sur les traits\."/);
  assert.match(source, /pied\(pdf, None, False\)/, "verso : la signature seule");
});

test("la carte-titre : « table de » en petit, le numéro seul en très grand", () => {
  const titre = source.match(/def carte_titre\([\s\S]*?\n\n\n/)[0];
  assert.match(titre, /cadre\(pdf, x, y, table\)\n/, "recto blanc, comme les autres rectos");
  assert.match(titre, /"table de"/);
  assert.match(titre, /66, x \+ CARTE_L \/ 2, y \+ CARTE_H \/ 2 - 5 \* mm, str\(table\)/);
});
