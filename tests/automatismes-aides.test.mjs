import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  generateurs,
  formesDisponibles,
  formesCahier,
  formesBanque,
  genererQuestion,
} from "../automatismes/moteur.js";

const reference = JSON.parse(
  readFileSync(new URL("fixtures/automatismes/aides-a-revoir.json", import.meta.url)),
);

test("aides comparées (50 tirages par forme) : les occurrences détectées restent celles de l’archive", (contexte) => {
  const constats = [];
  let tirages = 0;
  let formesComparees = 0;
  for (const famille of Object.keys(generateurs)) {
    for (const forme of formesDisponibles(famille)) {
      // Les formes des cahiers ont leur propre contrôle (la réponse jamais écrite sur l'aide) dans
      // automatismes-cahier-*.test.mjs : la comparaison littérale avec l'archive ne les concerne plus.
      if (formesCahier.has(`${famille}-${forme}`)) continue;
      // La banque (passe 1) n'a pas d'aide : rien à comparer (ses tests : automatismes-banque-*).
      if (formesBanque.has(`${famille}-${forme}`)) continue;
      formesComparees++;
      let occurrences = 0;
      let premierExemple;
      for (let graine = 1; graine <= 50; graine++) {
        const question = genererQuestion(famille, forme, graine);
        const dessin = question.hints[0].svg || "";
        const reponses = question.fields.map((champ) => String(champ.answer));
        const trouvees = reponses.filter((reponse) => reponse.length && dessin.includes(reponse));
        if (trouvees.length) {
          occurrences++;
          premierExemple ||= { graine, reponses: trouvees };
        }
        tirages++;
      }
      if (occurrences) {
        constats.push({ id: `${famille}-${forme}`, occurrences, premierExemple });
      }
    }
  }
  // 406 formes de l'archive, 50 tirages chacune (20 300 avant la banque).
  assert.equal(formesComparees, 406);
  assert.equal(tirages, formesComparees * 50);
  assert.deepEqual(constats, reference.formes);
  contexte.diagnostic(
    `${constats.length} formes signalées : ce contrôle constate les défauts hérités, il ne valide pas leurs aides.`,
  );
  contexte.diagnostic(
    "Comparaison littérale demandée : une réponse courte peut aussi correspondre à une coordonnée SVG.",
  );
});
