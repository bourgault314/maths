import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Décision du 03/10/2026 : pages légales courtes, sans rien retirer d'obligatoire.
const lire = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const mots = (html) => html.match(/<main[\s\S]*?<\/main>/)[0]
  .replace(/<details[\s\S]*?<\/details>/g, "")
  .replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

test("mentions légales : courtes, avec éditeur, contact, hébergeur et renvois", () => {
  const page = lire("mentions-legales.html");
  assert.ok(mots(page) < 250, `trop long : ${mots(page)} mots`);
  assert.match(page, /Éditeur et directeur de la publication :<\/strong> Gwenaël Bourgault, à titre non professionnel/);
  assert.match(page, /GitHub, Inc\., 88 Colin P\. Kelly Jr Street/);
  assert.match(page, /GitHub B\.V\., Prins Bernhardplein 200/);
  assert.match(page, /href="licence\.html"/);
  assert.match(page, /href="confidentialite\.html"/);
});

test("confidentialité : courte, avec responsable, durées, destinataires et droits", () => {
  const page = lire("confidentialite.html");
  assert.ok(mots(page) < 650, `trop long : ${mots(page)} mots`);
  assert.match(page, /<h2 id="responsable">[\s\S]*?Gwenaël Bourgault/);
  assert.match(page, /effacées à la fin de l’année scolaire ou sur simple demande au professeur/);
  assert.match(page, /chez OVH en France/);
  assert.match(page, /déclaration de confidentialité GitHub/);
  assert.match(page, /saisir la <a href="https:\/\/www\.cnil\.fr\/fr\/plaintes"/);
  // Le suivi n'est plus expliqué deux fois.
  assert.equal((page.match(/code de six caractères/g) || []).length, 1);
});
