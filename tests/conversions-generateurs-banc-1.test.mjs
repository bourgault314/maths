// Défi conversions — la part 1 sur 3 du banc d'essai par étape (2 000 graines × 7 usages)
// de conversions-generateurs.test.mjs (lot « vérifications plus rapides », 21/11/2026).
// Aucun contrôle à lui : il joue le banc de ce fichier-là pour les étapes de sa part,
// dans un processus à part, en même temps que les deux autres parts.
process.env.BANC_PART = "1";
await import("./conversions-generateurs.test.mjs");
