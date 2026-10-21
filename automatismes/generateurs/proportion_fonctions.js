import { svg, text, line, rect, circle } from "./draw.js";
const fmt = (n) => String(Math.round(n * 1e8) / 1e8).replace(".", ",");
const field = (a, unit = "", label = "Réponse", kind = "number") => ({
  label,
  answer: typeof a === "number" ? fmt(a) : String(a),
  unit,
  kind,
});
const centered = (x, y, t, size = 18) => text(x, y, t, size, "#173e3a", "middle");
const bars = (parts, labels, total = "") => {
  let sum = parts.reduce((a, b) => a + b, 0),
    x = 24;
  return svg(
    text(24, 30, total, 21) +
      parts
        .map((v, i) => {
          let w = (500 * v) / sum,
            b =
              rect(x, 65, w, 55, i % 2 ? "#f9dfab" : "#d4eae2") +
              centered(
                x + w / 2,
                100,
                labels[i] || "",
                Math.min(18, (w / Math.max(1, String(labels[i] || "").length)) * 1.5),
              );
          x += w;
          return b;
        })
        .join(""),
    560,
    155,
  );
};
const flow = (input, steps, output = "?") =>
  svg(
    centered(38, 81, input, String(input).length > 4 ? 21 : 25) +
      steps
        .map((op, i) => {
          let x = 110 + i * 202;
          return (
            text(x - 28, 81, "→", 23) +
            rect(x, 42, 150, 62, "#dcece3") +
            centered(x + 75, 80, op, 23)
          );
        })
        .join("") +
      text(steps.length === 2 ? 480 : 278, 81, "→", 23) +
      centered(steps.length === 2 ? 535 : 338, 81, output, 23),
    580,
    140,
  );
const table = (top, bottom, units) => {
  let w = 440 / top.length;
  return svg(
    text(10, 42, units[0], 22) +
      text(10, 102, units[1], 22) +
      top
        .map(
          (a, i) =>
            rect(100 + i * w, 10, w, 55, "white") +
            rect(100 + i * w, 65, w, 55, "white") +
            centered(100 + (i + 0.5) * w, 44, a, 24) +
            centered(100 + (i + 0.5) * w, 102, bottom[i], 24),
        )
        .join(""),
    560,
    145,
  );
};
const double = (top, bottom, units) => {
  // Les espacements sont proportionnels aux coordonnées.
  let pairs = top.map((v, i) => ({ x: Number(v), a: v, b: bottom[i] })).sort((a, b) => a.x - b.x),
    unique = [];
  for (let p of pairs) {
    let old = unique.find((q) => q.x === p.x);
    if (!old) unique.push(p);
    else if (old.b === "?" && p.b !== "?") old.b = p.b;
  }
  if (unique.some((p) => !Number.isFinite(p.x))) return table(top, bottom, units);
  let lo = Math.min(0, ...unique.map((p) => p.x)),
    hi = Math.max(1, ...unique.map((p) => p.x));
  return svg(
    text(16, 23, units[0], 16) +
      text(16, 171, units[1], 16) +
      line(40, 66, 510, 66) +
      line(40, 116, 510, 116) +
      unique
        .map((p) => {
          let x = 40 + ((p.x - lo) / (hi - lo)) * 470;
          return (
            line(x, 60, x, 122, "#91aaa2", 1) +
            centered(x, 49, typeof p.a === "number" ? fmt(p.a) : p.a, 17) +
            centered(x, 145, typeof p.b === "number" ? fmt(p.b) : p.b, 17)
          );
        })
        .join(""),
    560,
    190,
  );
};
const percent = (rate, total = null, inc = false) => {
  let max = inc ? 100 + rate : 100,
    whole = (440 * 100) / max,
    part = (440 * rate) / max;
  let b =
    text(35, 28, total == null ? "Le tout = 100 %" : `100 % = ${total}`, 20) +
    rect(35, 65, whole, 48, "#d4eae2");
  if (inc) b += rect(35 + whole, 65, part, 48, "#f9dfab");
  else b += rect(35, 65, part, 48, "#f9dfab");
  return svg(
    b +
      text(
        35,
        143,
        inc ? `On ajoute ${rate} % du prix initial.` : `Part repérée : ${rate} % du tout.`,
        18,
      ),
    560,
    175,
  );
};
function graph(points, { xLabel = "x", yLabel = "y", threshold = null } = {}) {
  let xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]),
    lo = Math.min(0, ...xs),
    hi = Math.max(1, ...xs),
    bot = Math.min(0, ...ys),
    up = Math.max(1, ...ys);
  let X = (x) => 75 + ((x - lo) / (hi - lo)) * 410,
    Y = (y) => 200 - ((y - bot) / (up - bot)) * 160;
  let b =
    line(75, Y(0), 505, Y(0)) +
    line(X(0), 30, X(0), 210) +
    text(510, 242, xLabel, 22) +
    text(8, 22, yLabel, 22);
  for (let x of new Set(xs))
    b += line(X(x), Y(0) - 4, X(x), Y(0) + 4) + text(X(x) - 6, 228, fmt(x), 22);
  for (let y of new Set(ys))
    b += line(X(0) - 4, Y(y), X(0) + 4, Y(y)) + text(8, Y(y) + 5, fmt(y), 22);
  b +=
    "" +
    '<polyline points="' +
    points.map((p) => X(p[0]) + "," + Y(p[1])).join(" ") +
    '" fill="none" stroke="#16756a" stroke-width="3"/>';
  if (threshold != null) {
    b += line(75, Y(threshold), 505, Y(threshold), "#a46a14", 2);
    if (!ys.includes(threshold)) b += text(8, Y(threshold) + 5, fmt(threshold), 22);
  }
  return svg(b, 560, 260);
}
const ratioStrip = (parts, labels, total) => {
  let unit = 500 / parts.reduce((a, b) => a + b, 0),
    x = 25,
    b = text(25, 28, total, 21);
  parts.forEach((n, i) => {
    for (let j = 0; j < n; j++)
      b += rect(x + j * unit, 55, unit, 48, ["#d4eae2", "#f9dfab", "#dbe7f5"][i]);
    b += centered(x + (n * unit) / 2, 135, labels[i], 20);
    x += n * unit;
  });
  return svg(b, 560, 160);
};
const rules = {
  PF01: [
    "Proportionnalité : le prix s’obtient toujours en multipliant la quantité par un même nombre.",
    "Dans un tableau proportionnel, tous les quotients prix ÷ masse sont égaux.",
    "Une situation de proportionnalité se représente par une droite passant par l’origine.",
  ],
  PF02: [
    "Multiplier une quantité par un nombre multiplie l’autre quantité par ce même nombre.",
    "Passe par la valeur pour une unité, puis multiplie par la quantité demandée.",
    "Dans une situation proportionnelle, additionner les quantités additionne leurs prix.",
    "Le passage par une unité fonctionne aussi avec des nombres décimaux.",
  ],
  PF03: [
    "p % du tout = p/100 × tout.",
    "p % du tout = p/100 × tout.",
    "Le pourcentage porte sur l’effectif total.",
    "Deux groupes complémentaires représentent ensemble 100 %.",
  ],
  PF04: [
    "Une hausse ajoute au prix initial une part calculée sur ce prix.",
    "Une baisse retire au prix initial une part calculée sur ce prix.",
    "Diminuer de t % revient à multiplier par 1 − t/100.",
    "Pour deux variations successives, la seconde porte sur le prix déjà modifié.",
  ],
  PF05: [
    "Pourcentage = part ÷ tout × 100.",
    "Taux de hausse = augmentation ÷ prix initial × 100.",
    "Pour retrouver le prix initial, divise le prix réduit par le coefficient de réduction.",
    "Pour retrouver le prix initial, divise le prix augmenté par le coefficient de hausse.",
  ],
  PF06: [
    "Additionne les nombres du ratio ; partage le total en autant de parts égales.",
    "Chaque case représente le même volume. Les nombres du ratio comptent les cases de sirop et d’eau.",
    "Partage le total en parts égales, puis regroupe-les selon les trois nombres du ratio.",
  ],
  PF07: [
    "À l’échelle 1:n, 1 cm sur le plan représente n cm dans la réalité.",
    "Longueur sur le plan = longueur réelle ÷ n, dans la même unité.",
    "Le nombre n de l’échelle est le quotient longueur réelle ÷ longueur sur le plan, dans la même unité.",
    "Des segments égaux d’une échelle représentent des distances égales.",
  ],
  PF08: [
    "Vitesse moyenne = distance ÷ durée. Pour des km/h, exprime la durée en heures.",
    "À vitesse constante : distance = vitesse × durée, avec des unités compatibles.",
    "1 m/s = 3,6 km/h : multiplie par 3,6 pour convertir.",
    "Masse volumique = masse ÷ volume. En g/cm³, on cherche la masse de 1 cm³.",
    "Énergie = puissance × durée. Des kW multipliés par des heures donnent des kWh.",
    "Durée = distance ÷ vitesse. Avec des km et des km/h, le résultat est en heures.",
  ],
  PF09: [
    "Pour une fonction f, l’image d’un nombre x est le nombre f(x).",
    "Un antécédent de y par f est un nombre x tel que f(x) = y. Il peut y en avoir plusieurs.",
    "Pour lire une image, pars de l’axe horizontal, rejoins la courbe, puis lis sur l’axe vertical.",
    "Pour retrouver le nombre de départ, remonte les opérations dans l’ordre inverse.",
    "L’image de 0 se lit à l’intersection de la courbe avec l’axe vertical.",
    "Pour lire un antécédent, pars de l’axe vertical, rejoins la courbe, puis lis sur l’axe horizontal.",
    "Une variation se calcule : valeur finale − valeur initiale.",
  ],
  PF10: [
    "Une fonction linéaire est de la forme f(x) = ax ; une fonction affine, de la forme f(x) = ax + b.",
    "Pour f(x) = ax et x non nul : a = f(x) ÷ x.",
    "Dans f(x) = ax + b, b = f(0) ; a est la variation de y divisée par celle de x.",
    "Prix total = tarif horaire × nombre d’heures + forfait fixe.",
  ],
  PF11: [
    "Pour trouver un instant, pars de la température, rejoins la courbe, puis lis l’heure.",
    "Résoudre f(x) = k : repère toutes les intersections avec l’horizontale de hauteur k.",
    "Une durée est la différence entre l’heure de fin et l’heure de début.",
    "Pour plusieurs périodes séparées, calcule chaque durée puis additionne-les.",
  ],
};
function Q(f, v, p, ans, unit, h1, h2, sol, visual = "", grade = 5, check = null, course = null) {
  return {
    family: f,
    variant: `${f}-${v + 1}`,
    grade,
    dnb: true,
    prompt: p,
    fields: [field(ans, unit)],
    check: check || { type: "numeric", values: [String(ans)] },
    hints: [
      typeof h1 === "string" ? { text: h1, svg: visual } : h1,
      typeof h2 === "string" ? { text: h2 } : h2,
    ],
    solution: sol,
    visual,
    course: course || {
      rule: rules[f]?.[v] || "Relie les deux grandeurs et conserve les unités.",
      example: sol,
      svg: (typeof h2 === "object" ? h2.svg : typeof h1 === "object" ? h1.svg : "") || visual,
    },
  };
}
export const counts = {
  PF01: 3,
  PF02: 4,
  PF03: 4,
  PF04: 4,
  PF05: 4,
  PF06: 3,
  PF07: 4,
  PF08: 6,
  PF09: 7,
  PF10: 4,
  PF11: 4,
};
export const generators = {
  PF01(r, v) {
    let k = r.int(2, 6),
      n = r.int(2, 5),
      p = n * k;
    let yes = r.bool(),
      a = yes ? 0 : r.int(1, 3);
    if (v === 0) {
      let q = Q(
        "PF01",
        v,
        "" +
          "Des carnets coûtent " +
          k +
          " € chacun" +
          (yes ? ", sans frais supplémentaires" : `, avec ${a} € de frais fixes par commande`) +
          ". Le prix total est-il proportionnel au nombre de carnets ?",
        yes ? "Oui" : "Non",
        "",
        {
          text: "Compare une commande et une commande deux fois plus grande.",
          svg: table([1, 2], [k + a, 2 * k + a], ["Carnets", "€"]),
        },
        yes
          ? "Chaque carnet ajoute le même prix."
          : "Les frais fixes ne sont payés qu’une fois par commande.",
        yes
          ? `Prix = ${k} × nombre de carnets.`
          : "Doubler les carnets ne double pas les frais fixes.",
        "",
        6,
        { type: "text", values: [yes ? "Oui" : "Non"] },
      );
      q.fields[0] = { ...q.fields[0], kind: "text", options: ["Oui", "Non"] };
      return q;
    }
    if (v === 1) {
      let q = Q(
        "PF01",
        v,
        "Ce tableau représente-t-il un prix proportionnel à la masse ?",
        yes ? "Oui" : "Non",
        "",
        `De ${n} à ${3 * n} kg, on multiplie par 3.`,
        `Le dernier prix devrait être ${p} × 3 = ${3 * p} €.`,
        yes
          ? "Tous les prix sont obtenus avec le même prix au kilogramme."
          : `${3 * p + a} ≠ ${3 * p} : ce n’est pas proportionnel.`,
        table([n, 2 * n, 3 * n], [p, 2 * p, 3 * p + a], ["kg", "€"]),
        5,
        { type: "text", values: [yes ? "Oui" : "Non"] },
      );
      q.fields[0].kind = "text";
      q.fields[0].options = ["Oui", "Non"];
      return q;
    }
    let q = Q(
      "PF01",
      v,
      "Ce graphique représente-t-il une proportionnalité ?",
      yes ? "Oui" : "Non",
      "",
      "Repère l’origine : là où les deux axes se croisent.",
      "La droite doit passer par l’origine.",
      yes ? "La droite passe par l’origine." : `À 0 kg, le prix vaut ${a} € : il y a un coût fixe.`,
      graph(
        [
          [0, a],
          [1, k + a],
          [2, 2 * k + a],
        ],
        { xLabel: "kg", yLabel: "€" },
      ),
      5,
      { type: "text", values: [yes ? "Oui" : "Non"] },
    );
    q.fields[0].kind = "text";
    q.fields[0].options = ["Oui", "Non"];
    return q;
  },
  PF02(r, v) {
    let k = r.int(2, 8),
      n = r.int(2, 6),
      m = r.int(2, 9);
    if (v === 0) {
      let factor = r.pick([2, 3]);
      return Q(
        "PF02",
        v,
        `Pour ${n} personnes, il faut ${n * k * 10} g de riz. Quelle masse faut-il pour ${n * factor} personnes ?`,
        n * k * 10 * factor,
        "g",
        {
          text: `Le nombre de personnes est multiplié par ${factor}.`,
          svg: double([0, n, n * factor], [0, n * k * 10, "?"], ["Personnes", "Riz (g)"]),
        },
        `Multiplie aussi la masse par ${factor}.`,
        `${n * k * 10} × ${factor} = ${n * k * 10 * factor} g.`,
        "",
        6,
      );
    }
    if (v === 1)
      return Q(
        "PF02",
        v,
        `${n} kg de fruits coûtent ${n * k} €. Combien coûtent ${m} kg au même tarif ?`,
        m * k,
        "€",
        {
          text: "Passe par le prix de 1 kg.",
          svg: double([0, 1, n, m], [0, "?", n * k, "?"], ["Masse (kg)", "Prix (€)"]),
        },
        `${n * k} ÷ ${n} = ${k} € par kg.`,
        `${m} × ${k} = ${m * k} €.`,
        "",
        6,
      );
    if (v === 2) {
      n *= 2;
      return Q(
        "PF02",
        v,
        `${n} billets coûtent ${n * k} €. Combien coûtent ${n * 1.5} billets ?`,
        n * 1.5 * k,
        "€",
        {
          text: "Prends les billets de départ, puis ajoute leur moitié.",
          svg: bars([1, 1, 1], [`${n / 2} billets`, `${n / 2} billets`, `${n / 2} billets`]),
        },
        `${n * 1.5} = ${n} + ${n / 2}.`,
        `${n * k} + ${(n * k) / 2} = ${n * k * 1.5} €.`,
        "",
        6,
      );
    }
    let mass = r.pick([1.5, 2.5, 3.5]),
      price = mass * k;
    return Q(
      "PF02",
      v,
      `${fmt(mass)} kg coûtent ${fmt(price)} €. Combien coûtent ${m} kg ?`,
      m * k,
      "€",
      {
        text: "Repère la correspondance des deux grandeurs.",
        svg: double([0, 1, mass, m], [0, "?", fmt(price), "?"], ["kg", "€"]),
      },
      `${fmt(price)} ÷ ${fmt(mass)} = ${k} € par kg.`,
      `${k} × ${m} = ${k * m} €.`,
      "",
      4,
    );
  },
  PF03(r, v) {
    if (v === 3) {
      let total = r.int(1, 3) * 20,
        rate = r.pick([20, 25, 40, 50, 60]),
        ans = (total * (100 - rate)) / 100;
      return Q(
        "PF03",
        v,
        `Dans un groupe de ${total} élèves, ${rate} % viennent à pied. Les autres viennent en bus. Combien viennent en bus ?`,
        ans,
        "élèves",
        { text: "Les deux groupes réunis représentent 100 %.", svg: percent(rate, total) },
        `Il reste ${100 - rate} %. Calcule cette part de ${total}.`,
        `${total} × ${100 - rate}/100 = ${ans} élèves.`,
        "",
        5,
      );
    }
    let rate =
      v === 0
        ? r.pick([25, 50, 75])
        : v === 1
          ? r.pick([5, 15, 20, 30, 35, 40])
          : r.pick([20, 40, 60, 80]);
    let total = v === 2 ? r.pick([20, 25, 30, 35]) : r.int(2, 12) * 20;
    let ans = (total * rate) / 100;
    return Q(
      "PF03",
      v,
      v === 2
        ? `Une classe de ${total} élèves compte ${rate} % d’élèves venant à pied. Combien viennent à pied ?`
        : `Calculer ${rate} % de ${total}.`,
      ans,
      v === 2 ? "élèves" : "",
      { text: `Le tout est ${total} : il représente 100 %.`, svg: percent(rate, total) },
      `${rate} % de ${total} = ${rate}/100 × ${total}.`,
      `${rate} × ${total} ÷ 100 = ${fmt(ans)}.`,
      "",
      v === 0 ? 6 : 5,
      null,
      {
        rule: "Le tout vaut 100 %. p % signifie p parts sur 100.",
        example: `${rate} % de ${total} = ${fmt(ans)}.`,
        svg: double([0, rate, 100], [0, fmt(ans), total], ["Pourcentage (%)", "Quantité"]),
      },
    );
  },
  PF04(r, v) {
    let price = r.int(2, 15) * 20,
      rate = r.pick([10, 20, 25, 50]),
      inc = v === 0,
      mult = 1 + ((inc ? 1 : -1) * rate) / 100;
    if (v === 2) {
      let ans = 1 - rate / 100;
      return Q(
        "PF04",
        v,
        `Par quel nombre multiplier un prix pour le diminuer de ${rate} % ?`,
        ans,
        "",
        { text: `Sur 100 %, retire ${rate} %.`, svg: percent(100 - rate) },
        `Il reste ${100 - rate} % = ${100 - rate}/100.`,
        `Le coefficient multiplicateur est ${fmt(ans)}.`,
        "",
        4,
      );
    }
    if (v === 3) {
      price = r.int(1, 5) * 100;
      rate = r.pick([10, 20]);
      let after = price * (1 + rate / 100),
        ans = after * (1 - rate / 100);
      return Q(
        "PF04",
        v,
        `Un prix de ${price} € augmente de ${rate} %, puis diminue de ${rate} %. Quel est le prix final ?`,
        ans,
        "€",
        {
          text: "La deuxième variation porte sur le nouveau prix.",
          svg: flow(price + " €", ["+ " + rate + " %", "− " + rate + " %"]),
        },
        `Après la hausse : ${fmt(after)} €. Calcule ensuite ${rate} % de ${fmt(after)}.`,
        `${fmt(after)} × ${fmt(1 - rate / 100)} = ${fmt(ans)} €.`,
        "",
        3,
      );
    }
    let ans = price * mult;
    return Q(
      "PF04",
      v,
      `Un article coûte ${price} €. Son prix ${inc ? "augmente" : "diminue"} de ${rate} %. Quel est le nouveau prix ?`,
      ans,
      "€",
      {
        text: `Le prix initial représente 100 %. ${inc ? "Ajoute" : "Retire"} ${rate} %.`,
        svg: percent(rate, price, inc),
      },
      `La variation vaut ${price} × ${rate}/100 = ${(price * rate) / 100} €.`,
      `${price} ${inc ? "+" : "−"} ${(price * rate) / 100} = ${fmt(ans)} €.`,
      "",
      4,
    );
  },
  PF05(r, v) {
    let rate = r.pick([10, 20, 25, 50]),
      base = r.int(2, 12) * 20,
      part = (base * rate) / 100;
    if (v === 0)
      return Q(
        "PF05",
        v,
        `Parmi ${base} bulletins, ${part} sont blancs. Quel pourcentage cela représente-t-il ?`,
        rate,
        "%",
        {
          text: "Le total des bulletins représente 100 %.",
          svg: double([0, part, base], [0, "?", 100], ["Bulletins", "Pourcentage"]),
        },
        `Compare la part au tout : ${part}/${base}.`,
        `${part} ÷ ${base} × 100 = ${rate} %.`,
        "",
        5,
      );
    if (v === 1)
      return Q(
        "PF05",
        v,
        `Un prix passe de ${base} € à ${base + part} €. Quel est le pourcentage d’augmentation ?`,
        rate,
        "%",
        {
          text: "Repère le prix initial et la hausse.",
          svg: bars([base, part], [base + " €", "hausse"], base + part + " € au total"),
        },
        `Compare cette hausse au prix initial : ${part}/${base}.`,
        `${part} ÷ ${base} × 100 = ${rate} %.`,
        "",
        4,
      );
    let inc = v === 3,
      fin = base + (inc ? part : -part);
    return Q(
      "PF05",
      v,
      `Après une ${inc ? "hausse" : "remise"} de ${rate} %, le prix est ${fin} €. Quel était le prix initial ?`,
      base,
      "€",
      {
        text: `${fin} € correspondent à ${inc ? 100 + rate : 100 - rate} %, pas à 100 %.`,
        svg: double(
          [0, inc ? 100 + rate : 100 - rate, 100],
          [0, fin, "?"],
          ["Pourcentage", "Prix (€)"],
        ),
      },
      `Divise par ${fmt(inc ? 1 + rate / 100 : 1 - rate / 100)}.`,
      `${fin} ÷ ${fmt(inc ? 1 + rate / 100 : 1 - rate / 100)} = ${base} €.`,
      "",
      3,
    );
  },
  PF06(r, v) {
    let a = r.int(1, 3),
      b = r.int(2, 5),
      k = r.int(2, 9),
      c = r.int(1, 4);
    if (v === 1)
      return Q(
        "PF06",
        v,
        `Sirop et eau sont dans le ratio ${a} : ${b}. Pour ${a * k} cL de sirop, combien faut-il d’eau ?`,
        b * k,
        "cL",
        {
          text: `${a} parts de sirop valent ${a * k} cL.`,
          svg: ratioStrip([a, b], ["Sirop", "Eau"], "Une case = une part"),
        },
        `Une part vaut ${a * k} ÷ ${a} = ${k} cL.`,
        `${b} × ${k} = ${b * k} cL.`,
        "",
        4,
      );
    let parts = v === 2 ? [a, b, c] : [a, b],
      total = parts.reduce((x, y) => x + y) * k;
    let q = Q(
      "PF06",
      v,
      `Partager ${total} € dans le ratio ${parts.join(" : ")}. Donner les parts dans cet ordre.`,
      parts[0] * k,
      "€",
      {
        text: `Il y a ${parts.reduce((x, y) => x + y)} parts égales en tout.`,
        svg: ratioStrip(
          parts,
          parts.map((x) => `${x} part${x > 1 ? "s" : ""}`),
          `${total} € à partager`,
        ),
      },
      `Une part vaut ${k} €. Multiplie par chaque nombre du ratio.`,
      parts.map((x) => `${x} × ${k} = ${x * k} €`).join(" ; "),
      "",
      v === 2 ? 3 : 4,
    );
    q.fields = parts.map((p, i) => field(p * k, "€", `Part ${i + 1}`));
    q.check = { type: "fields", values: parts.map((p) => String(p * k)) };
    return q;
  },
  PF07(r, v) {
    let n = r.pick([100, 200, 500]),
      l = r.int(2, 8);
    if (v === 0)
      return Q(
        "PF07",
        v,
        `À l’échelle 1:${n}, un mur mesure ${l} cm sur le plan. Quelle est sa longueur réelle en mètres ?`,
        (l * n) / 100,
        "m",
        {
          text: `1 cm sur le plan représente ${n} cm réels.`,
          svg: double([0, 1, l], [0, n, "?"], ["Plan (cm)", "Réalité (cm)"]),
        },
        `${l} × ${n} = ${l * n} cm. Convertis en mètres.`,
        `${l * n} cm = ${(l * n) / 100} m.`,
        "",
        5,
      );
    if (v === 1)
      return Q(
        "PF07",
        v,
        `Un mur de ${(l * n) / 100} m est dessiné à l’échelle 1:${n}. Quelle longueur a-t-il sur le plan, en cm ?`,
        l,
        "cm",
        {
          text: "Mets les longueurs dans la même unité.",
          svg: table(["1 cm", "? cm"], [n + " cm", `${(l * n) / 100} m`], ["Plan", "Réel"]),
        },
        `1 cm sur le plan représente ${n} cm réels.`,
        `${l * n} ÷ ${n} = ${l} cm.`,
        "",
        5,
      );
    if (v === 2) {
      n = r.pick([10000, 25000, 50000]);
      let q = Q(
        "PF07",
        v,
        `${l} cm sur une carte représentent ${(l * n) / 1000} dizaines de mètres. Complète l’échelle 1:…`,
        n,
        "",
        {
          text: "Exprime les deux longueurs en centimètres.",
          svg: table(
            ["1 cm", l + " cm"],
            ["? cm", fmt((l * n) / 100000) + " km"],
            ["Plan", "Réel"],
          ),
        },
        `${(l * n) / 1000} dizaines de mètres = ${l * n} cm.`,
        `${l * n} ÷ ${l} = ${n} ; échelle 1:${n}.`,
        "",
        3,
      );
      q.prompt = `${l} cm sur une carte représentent ${fmt((l * n) / 100000)} km. Complète l’échelle 1:…`;
      q.hints[1].text = `${fmt((l * n) / 100000)} km = ${l * n} cm.`;
      return q;
    }
    let k = r.int(1, 5);
    return Q(
      "PF07",
      v,
      `Chaque segment de cette échelle représente ${k} km. Quelle distance représentent ${l} segments ?`,
      l * k,
      "km",
      "Compte des intervalles, pas les traits.",
      `Additionne ${l} fois ${k} km.`,
      `${l} × ${k} = ${l * k} km.`,
      double(
        Array.from({ length: l + 1 }, (_, i) => i),
        Array.from({ length: l + 1 }, (_, i) => (i === l ? "?" : i * k)),
        ["Segments", "Distance (km)"],
      ),
      6,
    );
  },
  PF08(r, v) {
    if (v === 5) {
      let speed = r.pick([24, 36, 48, 60, 72]),
        minutes = r.pick([15, 30, 45, 60, 90, 120]),
        distance = (speed * minutes) / 60;
      return Q(
        "PF08",
        v,
        `À vitesse constante de ${speed} km/h, combien de minutes faut-il pour parcourir ${distance} km ?`,
        minutes,
        "min",
        {
          text: "Une heure correspond à la distance parcourue en 60 minutes.",
          svg: double([0, distance, speed], [0, "?", 60], ["Distance (km)", "Durée (min)"]),
        },
        `Durée en heures : ${distance} ÷ ${speed}. Puis multiplie par 60.`,
        `${distance} ÷ ${speed} × 60 = ${minutes} min.`,
        "",
        4,
      );
    }
    let speed = r.int(2, 9) * 12,
      t = r.pick([0.5, 1.5, 2]),
      d = speed * t;
    if (v === 0)
      return Q(
        "PF08",
        v,
        `Un trajet de ${d} km dure ${t === 0.5 ? "30 min" : t === 1.5 ? "1 h 30 min" : "2 h"}. Quelle est la vitesse moyenne ?`,
        speed,
        "km/h",
        {
          text: "Cherche la distance pour une heure.",
          svg: double([0, t, 1], [0, d, "?"], ["Durée (h)", "Distance (km)"]),
        },
        `La durée est ${fmt(t)} h : calcule ${d} ÷ ${fmt(t)}.`,
        `${speed} km/h.`,
        "",
        4,
      );
    if (v === 1) {
      let m = r.pick([15, 30, 45]);
      return Q(
        "PF08",
        v,
        `À ${speed} km/h, à vitesse constante, quelle distance parcourt-on en ${m} min ?`,
        (speed * m) / 60,
        "km",
        {
          text: "La distance varie comme la durée.",
          svg: double([0, m, 60], [0, "?", speed], ["Durée (min)", "Distance (km)"]),
        },
        `Multiplie ${speed} par ${m}/60.`,
        `${(speed * m) / 60} km.`,
        "",
        4,
      );
    }
    if (v === 2) {
      let s = r.int(2, 15);
      return Q(
        "PF08",
        v,
        `Convertir ${s} m/s en km/h.`,
        s * 3.6,
        "km/h",
        {
          text: "Une heure contient 3 600 secondes.",
          svg: table(["1 s", "1 h"], [s + " m", "? km"], ["Durée", "Trajet"]),
        },
        `En une heure : ${s * 3600} m. Convertis en kilomètres.`,
        `${s * 3600} ÷ 1 000 = ${fmt(s * 3.6)} km/h.`,
        "",
        3,
      );
    }
    if (v === 3) {
      let vol = r.pick([10, 20, 50, 100]),
        mass = r.int(2, 9);
      return Q(
        "PF08",
        v,
        `Une matière a une masse de ${vol * mass} g pour ${vol} cm³. Quelle est sa masse volumique en g/cm³ ?`,
        mass,
        "g/cm³",
        {
          text: "Cherche la masse pour 1 cm³.",
          svg: table([vol, 1], [vol * mass, "?"], ["cm³", "g"]),
        },
        `Masse volumique = masse ÷ volume.`,
        `${vol * mass} ÷ ${vol} = ${mass} g/cm³.`,
        "",
        4,
      );
    }
    let p = r.int(1, 5),
      h = r.int(1, 5);
    return Q(
      "PF08",
      v,
      `Un appareil de ${p} kW fonctionne pendant ${h} h. Avec E = P × t, quelle énergie consomme-t-il ?`,
      p * h,
      "kWh",
      {
        text: `En une heure, l’appareil consomme ${p} kWh.`,
        svg: bars(Array(h).fill(1), Array(h).fill(p + " kWh"), h + " heures"),
      },
      `Prends ${h} parts de ${p} kWh.`,
      `${p} × ${h} = ${p * h} kWh.`,
      "",
      3,
    );
  },
  PF09(r, v) {
    if (v === 6) {
      let t = r.int(1, 3),
        base = r.int(1, 5) * 10,
        step = r.int(2, 8) * 10;
      return Q(
        "PF09",
        v,
        `De ${t} à ${3 * t} minutes, de combien de mètres la distance indiquée par la courbe augmente-t-elle ?`,
        2 * step,
        "m",
        "Lis la distance à chacun des deux instants.",
        `Les distances indiquées sont ${base + step} m puis ${base + 3 * step} m. Calcule leur différence.`,
        `${base + 3 * step} − ${base + step} = ${2 * step} m.`,
        graph(
          [
            [0, base],
            [t, base + step],
            [2 * t, base + step],
            [3 * t, base + 3 * step],
          ],
          { xLabel: "min", yLabel: "m" },
        ),
        5,
      );
    }
    if (v === 4) {
      let initial = r.int(1, 6) * 10,
        step = r.int(1, 4) * 10;
      return Q(
        "PF09",
        v,
        "Quelle distance indique la courbe à 0 minute ?",
        initial,
        "m",
        "Repère 0 sur l’axe du temps.",
        "Lis la hauteur du point de la courbe situé sur l’axe vertical.",
        `À 0 minute, la distance indiquée est ${initial} m.`,
        graph(
          [
            [0, initial],
            [2, initial + step],
            [4, initial + 2 * step],
          ],
          { xLabel: "min", yLabel: "m" },
        ),
        5,
      );
    }
    if (v === 5) {
      let x = r.int(2, 5),
        a = r.int(2, 6) * 10,
        b = r.int(1, 4) * 10,
        y = a * x + b;
      return Q(
        "PF09",
        v,
        `À quel instant la distance indiquée par la courbe vaut-elle ${y} m ?`,
        x,
        "min",
        `Pars de ${y} m sur l’axe vertical.`,
        "Rejoins la courbe horizontalement, puis descends vers l’axe du temps.",
        `La distance vaut ${y} m à ${x} min.`,
        graph(
          [
            [0, b],
            [x, y],
            [2 * x, 2 * a * x + b],
          ],
          { xLabel: "min", yLabel: "m", threshold: y },
        ),
        5,
      );
    }
    let a = r.int(2, 5),
      b = r.int(-5, 5),
      x = r.int(-4, 5),
      y = a * x + b,
      expr = `${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}`;
    if (v === 0)
      return Q(
        "PF09",
        v,
        `f(x) = ${expr}. Calculer f(${x}).`,
        y,
        "",
        {
          text: `Remplace x par ${x}.`,
          svg: flow(x, ["× " + a, (b < 0 ? "− " : "+ ") + Math.abs(b)]),
        },
        `Calcule d’abord ${a} × (${x}) = ${a * x}.`,
        `${a * x} ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${y}.`,
        "",
        3,
        null,
        {
          rule: "Pour une fonction f, l’image d’un nombre x est le nombre f(x).",
          example: `${x} → ×${a} → ${a * x} → ${b < 0 ? "−" : "+"}${Math.abs(b)} → ${y}`,
          svg: svg(
            centered(70, 70, x, 24) +
              text(120, 70, "→", 24) +
              rect(180, 30, 200, 70, "white") +
              centered(280, 72, `× ${a} puis ${b < 0 ? "−" : "+"} ${Math.abs(b)}`, 20) +
              text(410, 70, "→", 24) +
              centered(480, 70, y, 24),
            560,
            130,
          ),
        },
      );
    if (v === 1) {
      let n = r.int(2, 5),
        target = n * n;
      let q = Q(
        "PF09",
        v,
        `Dans ce tableau, donner tous les antécédents de ${target}.`,
        0,
        "",
        `Cherche toutes les cases contenant ${target} sur la deuxième ligne.`,
        `Lis les nombres de départ situés juste au-dessus.`,
        `Les antécédents présents sont −${n} et ${n}.`,
        table([-n, -1, 0, 1, n], [target, 1, 0, 1, target], ["x", "f(x)"]),
        3,
        { type: "set", values: [String(-n), String(n)] },
      );
      q.fields = [field(`-${n};${n}`, "", "Antécédents séparés par ;", "text")];
      return q;
    }
    if (v === 2) {
      let t = r.int(2, 5),
        dist = r.int(2, 8) * 50;
      return Q(
        "PF09",
        v,
        `À ${2 * t} min, quelle distance indique la courbe ?`,
        dist,
        "m",
        "Pars du temps sur l’axe horizontal.",
        "Monte jusqu’à la courbe, puis lis sur l’axe des distances.",
        `${dist} m.`,
        graph(
          [
            [0, 0],
            [t, dist],
            [2 * t, dist],
            [3 * t, 2 * dist],
          ],
          { xLabel: "min", yLabel: "m" },
        ),
        5,
      );
    }
    return Q(
      "PF09",
      v,
      `g(x) = ${expr}. Quel nombre a pour image ${y} ?`,
      x,
      "",
      {
        text: "Remonte les opérations à partir du résultat.",
        svg: flow("?", ["× " + a, (b < 0 ? "− " : "+ ") + Math.abs(b)], y),
      },
      `D’abord ${y} ${b < 0 ? "+" : "−"} ${Math.abs(b)} = ${a * x}, puis divise par ${a}.`,
      `${a * x} ÷ ${a} = ${x}.`,
      "",
      3,
    );
  },
  PF10(r, v) {
    let a = r.pick([-3, -2, 1, 2, 3, 4]),
      b = r.int(1, 5);
    if (v === 0) {
      let type = r.int(0, 2),
        s =
          type === 0
            ? `${a === 1 ? "" : a === -1 ? "−" : a}x`
            : type === 1
              ? `${a === 1 ? "" : a === -1 ? "−" : a}x + ${b}`
              : "x²",
        ans = ["Linéaire", "Affine non linéaire", "Ni l’une ni l’autre"][type];
      let q = Q(
        "PF10",
        v,
        `Comment classer f(x) = ${s} ?`,
        ans,
        "",
        {
          text: "Compare avec une multiplication seule, puis avec une multiplication suivie d’une addition.",
          svg: flow("x", ["× a", "+ b"], "f(x)"),
        },
        "Une fonction linéaire n’a pas de terme constant non nul.",
        `${ans}.`,
        "",
        3,
        { type: "text", values: [ans] },
      );
      q.fields[0].kind = "text";
      q.fields[0].options = ["Linéaire", "Affine non linéaire", "Ni l’une ni l’autre"];
      return q;
    }
    if (v === 1) {
      let x = r.int(2, 6);
      return Q(
        "PF10",
        v,
        `f est linéaire et f(${x}) = ${a * x}. Quel est son coefficient ?`,
        a,
        "",
        { text: "Une fonction linéaire s’écrit f(x) = ax.", svg: flow(x, ["× ?"], a * x) },
        `${x} × a = ${a * x}.`,
        `${a * x} ÷ ${x} = ${a}.`,
        "",
        3,
      );
    }
    if (v === 2) {
      a = Math.abs(a);
      let q = Q(
        "PF10",
        v,
        "La droite représente f(x) = ax + b. Trouver a et b.",
        a,
        "",
        "Lis b à l’intersection avec l’axe vertical.",
        `De x = 0 à x = 2, la hauteur augmente de ${2 * a}. Divise par 2.`,
        `a = ${a} ; b = ${b}.`,
        graph(
          [
            [0, b],
            [2, 2 * a + b],
          ],
          {},
        ),
        3,
      );
      q.fields = [field(a, "", "a"), field(b, "", "b")];
      q.check = { type: "fields", values: [String(a), String(b)] };
      return q;
    }
    a = Math.abs(a);
    let q = Q(
      "PF10",
      v,
      `Une location coûte ${b} € fixes puis ${a} € par heure. Écrire le prix P(h) pour h heures.`,
      `${a}h+${b}`,
      "",
      {
        text: "Distingue la part fixe et la part qui dépend des heures.",
        svg: flow("h", ["× " + a, "+ " + b], "P(h)"),
      },
      `Prix des heures : ${a} × h. Ajoute le forfait.`,
      `P(h) = ${a === 1 ? "" : a}h + ${b}.`,
      "",
      3,
      { type: "expression", values: [`${a}h+${b}`] },
    );
    q.fields[0].kind = "expression";
    return q;
  },
  PF11(r, v) {
    let h = r.int(1, 3),
      level = r.int(2, 5) * 5;
    if (v === 0)
      return Q(
        "PF11",
        v,
        `À quelle heure la température atteint-elle ${level} °C ?`,
        2 * h,
        "h",
        "Trace une horizontale depuis la température demandée.",
        "Descends ensuite du point de rencontre vers l’axe du temps.",
        `${2 * h} h.`,
        graph(
          [
            [0, 0],
            [2 * h, level],
            [4 * h, 0],
          ],
          { xLabel: "h", yLabel: "°C" },
        ),
        5,
      );
    if (v === 1) {
      let q = Q(
        "PF11",
        v,
        `Résoudre graphiquement f(x) = ${level / 2}.`,
        0,
        "",
        "Imagine une horizontale à la hauteur demandée.",
        "Il y a deux points de rencontre : lis leurs abscisses.",
        `x = −${h} ou x = ${h}.`,
        graph(
          [
            [-2 * h, level],
            [0, 0],
            [2 * h, level],
          ],
          { threshold: level / 2 },
        ),
        3,
        { type: "set", values: [String(-h), String(h)] },
      );
      q.fields = [field(`-${h};${h}`, "", "Solutions séparées par ;", "text")];
      return q;
    }
    if (v === 2)
      return Q(
        "PF11",
        v,
        `Pendant combien d’heures la température est-elle au moins égale à ${level} °C ?`,
        3 * h,
        "h",
        "Repère le début et la fin du plateau.",
        `Début : ${2 * h} h ; fin : ${5 * h} h. Calcule une durée.`,
        `${5 * h} − ${2 * h} = ${3 * h} h.`,
        graph(
          [
            [0, 0],
            [2 * h, level],
            [5 * h, level],
            [7 * h, 0],
          ],
          { xLabel: "h", yLabel: "°C", threshold: level },
        ),
        5,
      );
    return Q(
      "PF11",
      v,
      `Pendant combien d’heures la température est-elle strictement supérieure à ${level} °C ?`,
      4 * h,
      "h",
      "Repère les deux périodes au-dessus du seuil.",
      `De ${h} à ${3 * h} h, puis de ${5 * h} à ${7 * h} h. Additionne les durées.`,
      `${2 * h} + ${2 * h} = ${4 * h} h.`,
      graph(
        [
          [0, 0],
          [h, level],
          [2 * h, 2 * level],
          [3 * h, level],
          [4 * h, 0],
          [5 * h, level],
          [6 * h, 2 * level],
          [7 * h, level],
          [8 * h, 0],
        ],
        { xLabel: "h", yLabel: "°C", threshold: level },
      ),
      3,
    );
  },
};
