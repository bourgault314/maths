import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TYPOGRAPHIE } from "../../charte/src/charte.js";
import {
  COULEURS_REPERE,
  SIGNE_MOINS_REPERE,
  VERSION_REPERE_CARTESIEN,
  dessinerRepereCartesien,
  positionDansRepere,
} from "./repere-cartesien.js";

describe("repère cartésien V2", () => {
  it("produit un SVG pur, déterministe et autosuffisant", () => {
    const options = {
      xMin: -5,
      xMax: 3,
      yMin: -3,
      yMax: 4,
      largeur: 320,
      points: [{ nom: "M", x: -3, y: 2 }],
      description: "Repère avec le point M",
    };
    const premier = dessinerRepereCartesien(options);
    const second = dessinerRepereCartesien(options);
    assert.equal(premier.svg, second.svg);
    assert.equal(VERSION_REPERE_CARTESIEN, 4);
    assert.match(premier.svg, /^<svg/);
    assert.match(premier.svg, /width="320" height="[\d.]+"/);
    assert.match(premier.svg, /aria-label="Repère avec le point M"/);
  });

  it("conserve des unités carrées dans un repère asymétrique", () => {
    const { geometrie } = dessinerRepereCartesien({
      xMin: -5,
      xMax: 3,
      yMin: -3,
      yMax: 4,
    });
    const origine = positionDansRepere(0, 0, geometrie);
    const droite = positionDansRepere(1, 0, geometrie);
    const haut = positionDansRepere(0, 1, geometrie);
    assert.equal(droite.x - origine.x, geometrie.cellule);
    assert.equal(origine.y - haut.y, geometrie.cellule);
    assert.equal(geometrie.cellule, 64, "le repère doit rester lisible au tableau");
    assert.equal(geometrie.xAxe, origine.x);
    assert.equal(geometrie.yAxe, origine.y);
  });

  it("rend exactement les graduations de 0,5 et 0,25 sans surcharger les étiquettes", () => {
    for (const configuration of [
      { pas: 0.5, xMin: -3, xMax: 2.5, yMin: -2, yMax: 2 },
      { pas: 0.25, xMin: -1.5, xMax: 1.25, yMin: -1, yMax: 1.25 },
    ]) {
      const { svg, geometrie } = dessinerRepereCartesien({
        ...configuration,
        largeur: 320,
        points: [{ nom: "M", x: configuration.pas === 0.5 ? -1.5 : -0.75, y: configuration.pas }],
      });
      const origine = positionDansRepere(0, 0, geometrie);
      const graduation = positionDansRepere(configuration.pas, 0, geometrie);
      assert.ok(Math.abs((graduation.x - origine.x) - geometrie.cellule) < 0.01);
      assert.match(svg, configuration.pas === 0.5 ? /−1,5|2,5/ : /−0,5|1,25/);
      assert.ok(geometrie.cellule >= 20, "une petite graduation doit rester lisible sur 320 px");
    }
  });

  it("écrit le vrai signe moins, O une seule fois et la police mathématique canonique", () => {
    const { svg } = dessinerRepereCartesien({ xMin: -4, xMax: 4, yMin: -3, yMax: 3 });
    assert.ok(svg.includes(`${SIGNE_MOINS_REPERE}4`));
    assert.ok(!svg.includes(">-4<"));
    assert.equal((svg.match(/>O<\/text>/g) ?? []).length, 1);
    assert.ok(svg.includes(`font-family="${TYPOGRAPHIE.mathematiques.replaceAll('"', "'")}"`));
    assert.ok(!svg.includes(">0</text>"), "l'origine ne doit pas cumuler O et 0");
  });

  it("laisse les flèches positives remplacer les graduations d'extrémité", () => {
    const { svg, geometrie } = dessinerRepereCartesien({ xMin: -4, xMax: 4, yMin: -3, yMax: 3 });
    const extremiteX = positionDansRepere(geometrie.xMax, 0, geometrie);
    const avantExtremiteX = positionDansRepere(geometrie.xMax - 1, 0, geometrie);
    const extremiteY = positionDansRepere(0, geometrie.yMax, geometrie);
    const avantExtremiteY = positionDansRepere(0, geometrie.yMax - 1, geometrie);

    assert.ok(!svg.includes(`<line x1="${extremiteX.x}" y1="${geometrie.yAxe - 4}" x2="${extremiteX.x}" y2="${geometrie.yAxe + 4}"`));
    assert.ok(svg.includes(`<line x1="${avantExtremiteX.x}" y1="${geometrie.yAxe - 4}" x2="${avantExtremiteX.x}" y2="${geometrie.yAxe + 4}"`));
    assert.ok(!svg.includes(`<line x1="${geometrie.xAxe - 4}" y1="${extremiteY.y}" x2="${geometrie.xAxe + 4}" y2="${extremiteY.y}"`));
    assert.ok(svg.includes(`<line x1="${geometrie.xAxe - 4}" y1="${avantExtremiteY.y}" x2="${geometrie.xAxe + 4}" y2="${avantExtremiteY.y}"`));
  });

  it("différencie guides, point choisi et point attendu sans dépendre de la couleur seule", () => {
    const { svg } = dessinerRepereCartesien({
      points: [
        { nom: "M", x: -2, y: 2, role: "choisi" },
        { nom: "N", x: 2, y: -1, role: "attendu" },
      ],
      guides: [
        { x: -2, y: 2, axe: "abscisses" },
        { x: -2, y: 2, axe: "ordonnees" },
      ],
    });
    assert.ok(svg.includes(COULEURS_REPERE.choisi));
    assert.ok(svg.includes(COULEURS_REPERE.attendu));
    assert.ok(svg.includes(COULEURS_REPERE.guideAbscisse));
    assert.ok(svg.includes(COULEURS_REPERE.guideOrdonnee));
    assert.match(svg, /data-marqueur="point-choisi"/);
    assert.match(svg, /class="guide-repere guide-abscisses"/);
    assert.match(svg, /class="guide-repere guide-ordonnees"/);
    assert.match(svg, /stroke-width="2\.6"/);
    assert.ok((svg.match(/<circle /g) ?? []).length >= 2, "chaque projection doit marquer l'axe rejoint");
    assert.ok(svg.includes(">M</text>"));
    assert.ok(svg.includes(">N</text>"));
  });

  it("dessine les deux étapes spatiales d'un placement", () => {
    const horizontal = dessinerRepereCartesien({
      cheminPlacement: { x: 2, y: -1, etape: "horizontal" },
    }).svg;
    const complet = dessinerRepereCartesien({
      cheminPlacement: { x: 2, y: -1, etape: "complet" },
    }).svg;
    const compter = (svg, couleur) => (svg.match(new RegExp(`stroke="${couleur}"`, "g")) ?? []).length;
    assert.ok(compter(horizontal, COULEURS_REPERE.guideAbscisse) >= 1);
    assert.equal(compter(horizontal, COULEURS_REPERE.guideOrdonnee), 0);
    assert.ok(compter(complet, COULEURS_REPERE.guideOrdonnee) >= 1);
    assert.match(complet, /<circle [^>]*r="7"/);
    assert.match(complet, /class="deplacement-repere deplacement-abscisse"/);
    assert.match(complet, /class="deplacement-repere deplacement-ordonnee"/);

    const origine = dessinerRepereCartesien({
      cheminPlacement: { x: 0, y: 0, etape: "complet" },
    }).svg;
    assert.match(origine, /r="5"[^>]*data-arrivee-placement="true"/);
  });

  it("colore les axes, leurs graduations et leurs flèches avec les rôles communs", () => {
    const { svg } = dessinerRepereCartesien({
      axesMisesEnEvidence: ["abscisses", "ordonnees"],
      afficherLegendesAxes: true,
      mettreOrigineEnEvidence: true,
    });
    assert.match(
      svg,
      new RegExp(`data-axe="abscisses"[^>]*stroke="${COULEURS_REPERE.guideAbscisse}"|stroke="${COULEURS_REPERE.guideAbscisse}"[^>]*data-axe="abscisses"`),
    );
    assert.match(
      svg,
      new RegExp(`data-axe="ordonnees"[^>]*stroke="${COULEURS_REPERE.guideOrdonnee}"|stroke="${COULEURS_REPERE.guideOrdonnee}"[^>]*data-axe="ordonnees"`),
    );
    assert.match(svg, new RegExp(`<polygon[^>]*fill="${COULEURS_REPERE.guideAbscisse}"`));
    assert.match(svg, new RegExp(`<polygon[^>]*fill="${COULEURS_REPERE.guideOrdonnee}"`));
    assert.match(svg, /stroke-dasharray="3 3"/);
    assert.match(svg, />axe des abscisses<\/text>/);
    assert.match(svg, />axe des ordonnées<\/text>/);

    const lignesColorees = [...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="(#(?:f58220|08b9b2))"/g)];
    assert.ok(lignesColorees.length > 2);
    for (const ligne of lignesColorees) {
      assert.ok(
        ligne[1] === ligne[3] || ligne[2] === ligne[4],
        "une légende ne doit pas ajouter une petite flèche diagonale sur un axe",
      );
    }
  });

  it("garde les croix et les lettres lisibles aux quatre bords et dans les coins", () => {
    const points = [
      { nom: "A", x: -4, y: 3 },
      { nom: "B", x: 4, y: 3 },
      { nom: "C", x: -4, y: -3 },
      { nom: "D", x: 4, y: -3 },
      { nom: "E", x: -4, y: 0 },
      { nom: "F", x: 4, y: 0 },
      { nom: "G", x: 0, y: 3 },
      { nom: "H", x: 0, y: -3 },
    ];
    const { svg, largeur, hauteur, geometrie } = dessinerRepereCartesien({
      largeur: 320,
      points,
    });
    assert.ok(geometrie.xGauche >= 28 && largeur - geometrie.xDroite >= 28);
    assert.ok(geometrie.yHaut >= 28 && hauteur - geometrie.yBas >= 40);
    for (const { nom } of points) {
      const correspondance = new RegExp(`<text x="([\\d.]+)" y="([\\d.]+)" text-anchor="(start|middle|end)"[^>]*>${nom}<\\/text>`).exec(svg);
      assert.ok(correspondance, `lettre ${nom} absente`);
      const x = Number(correspondance[1]);
      const y = Number(correspondance[2]);
      const ancre = correspondance[3];
      const largeurLettre = 13;
      const gauche = ancre === "start" ? x : ancre === "end" ? x - largeurLettre : x - largeurLettre / 2;
      const droite = gauche + largeurLettre;
      assert.ok(gauche >= 4 && droite <= largeur - 4, `lettre ${nom} rognée horizontalement`);
      assert.ok(y - 15 >= 4 && y + 3 <= hauteur - 4, `lettre ${nom} rognée verticalement`);
    }
  });

  it("refuse les configurations illisibles ou hors contrat", () => {
    assert.throws(
      () => dessinerRepereCartesien({ xMin: 0 }),
      /xMin/,
    );
    assert.throws(
      () => dessinerRepereCartesien({ xMin: -10, xMax: 10 }),
      /compris entre 4 et 12/,
    );
    assert.throws(
      () => dessinerRepereCartesien({ points: [{ nom: "O", x: 1, y: 1 }] }),
      /différente de O/,
    );
    assert.throws(
      () => positionDansRepere(12, 0, dessinerRepereCartesien().geometrie),
      /point visible sur une graduation/,
    );
    assert.throws(
      () => dessinerRepereCartesien({ axesMisesEnEvidence: ["profondeur"] }),
      /axesMisesEnEvidence/,
    );
    assert.throws(
      () => dessinerRepereCartesien({ mettreOrigineEnEvidence: "oui" }),
      /mettreOrigineEnEvidence/,
    );
  });
});
