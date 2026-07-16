(function () {
  "use strict";

  const LEVELS = ["6e", "5e", "4e", "3e"];

  const domains = {
    numbers: { label: "Nombres et calculs", short: "Nombres", icon: "#", description: "Divisibilité, fractions, calcul" },
    algebra: { label: "Algèbre et motifs", short: "Algèbre", icon: "a", description: "Motifs, expressions, équations" },
    geometry: { label: "Espace et géométrie", short: "Géométrie", icon: "△", description: "Propriétés, preuves, figures" },
    data: { label: "Données et hasard", short: "Données", icon: "%", description: "Statistiques, probabilités" },
    proportion: { label: "Proportionnalité et fonctions", short: "Proportionnalité", icon: "↗", description: "Modèles, variations, graphes" },
    computing: { label: "Pensée informatique", short: "Algorithmique", icon: "⟲", description: "Programmes, tests, invariants" },
    transversal: { label: "Problèmes et stratégies", short: "Stratégies", icon: "?", description: "Choix, contrôle, modélisation" }
  };

  const gestures = {
    observe: { label: "Observer et classer", short: "Observer", icon: "◎", description: "Repérer une structure" },
    conjecture: { label: "Conjecturer et généraliser", short: "Conjecturer", icon: "…", description: "Passer des cas à une idée" },
    test: { label: "Tester et réfuter", short: "Réfuter", icon: "×", description: "Chercher le cas décisif" },
    justify: { label: "Justifier et prouver", short: "Prouver", icon: "∴", description: "Produire un argument valable" },
    critique: { label: "Critiquer et corriger", short: "Critiquer", icon: "!", description: "Trouver la première erreur" },
    strategy: { label: "Choisir une stratégie", short: "Choisir", icon: "◇", description: "Décider avant de calculer" },
    logic: { label: "Enchainer et déduire", short: "Déduire", icon: "⇒", description: "Relier données et conclusion" },
    model: { label: "Modéliser et interpréter", short: "Modéliser", icon: "≈", description: "Discuter le modèle" },
    reflect: { label: "Planifier et vérifier", short: "Vérifier", icon: "✓", description: "Contrôler sa démarche" }
  };

  function pick(rng, values) {
    return values[Math.floor(rng() * values.length)];
  }

  function int(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function shuffled(rng, values) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function signed(n) {
    return n < 0 ? `(${n})` : String(n);
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x;
  }

  function fraction(n, d) {
    const g = gcd(n, d);
    return `<span class="frac"><span>${n / g}</span><span>${d / g}</span></span>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  }

  function svg(content, viewBox = "0 0 640 230", label = "Illustration mathématique") {
    return `<svg viewBox="${viewBox}" role="img" aria-label="${escapeHtml(label)}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
  }

  function barSvg(parts, labels) {
    const colors = ["#1f5f99", "#f28c28", "#0f9f9b", "#8165a7", "#d85f66"];
    const total = parts.reduce((sum, value) => sum + value, 0);
    let x = 40;
    const rectangles = parts.map((value, index) => {
      const width = 550 * value / total;
      const shape = `<rect x="${x}" y="70" width="${width}" height="75" rx="4" fill="${colors[index % colors.length]}" opacity=".9"/><text x="${x + width / 2}" y="115" text-anchor="middle" fill="white" font-size="24" font-weight="800">${escapeHtml(labels[index])}</text>`;
      x += width;
      return shape;
    }).join("");
    return svg(`${rectangles}<line x1="40" y1="165" x2="590" y2="165" stroke="#12324f" stroke-width="3"/><text x="315" y="205" text-anchor="middle" fill="#52677b" font-size="20">total</text>`, undefined, "Schéma en barres");
  }

  function patternSvg(values) {
    let shapes = "";
    values.forEach((value, row) => {
      const y = 28 + row * 64;
      shapes += `<text x="70" y="${y + 22}" text-anchor="middle" fill="#12324f" font-size="19" font-weight="800">rang ${row + 1}</text>`;
      for (let index = 0; index < value; index += 1) {
        shapes += `<rect x="${120 + index * 29}" y="${y}" width="23" height="23" rx="4" fill="${index % 2 ? "#0f9f9b" : "#1f5f99"}"/>`;
      }
      shapes += `<text x="585" y="${y + 20}" text-anchor="middle" fill="#ef7d00" font-size="19" font-weight="900">${value}</text>`;
    });
    return svg(shapes, "0 0 640 225", "Nombre d'éléments aux trois premiers rangs d'un motif");
  }

  function triangleSvg(a, b, c, right) {
    const marker = right ? `<path d="M155 168v-24h24" fill="none" stroke="#f28c28" stroke-width="4"/>` : "";
    return svg(`<path d="M150 168 L470 168 L150 42 Z" fill="#eef6fc" stroke="#1f5f99" stroke-width="5"/>${marker}<text x="310" y="198" text-anchor="middle" fill="#12324f" font-size="23">${escapeHtml(a)}</text><text x="118" y="110" text-anchor="middle" fill="#12324f" font-size="23">${escapeHtml(b)}</text><text x="327" y="94" text-anchor="middle" fill="#12324f" font-size="23">${escapeHtml(c)}</text>`, undefined, "Triangle avec longueurs indiquées");
  }

  function graphSvg(points, truncated) {
    const baseY = truncated ? 175 : 205;
    const min = truncated ? Math.min(...points.map((point) => point[1])) - 1 : 0;
    const max = Math.max(...points.map((point) => point[1])) + 1;
    const coords = points.map((point, index) => {
      const x = 85 + index * (470 / Math.max(1, points.length - 1));
      const y = baseY - ((point[1] - min) / (max - min)) * 135;
      return { x, y, label: point[0], value: point[1] };
    });
    return svg(`<line x1="70" y1="25" x2="70" y2="${baseY}" stroke="#12324f" stroke-width="3"/><line x1="70" y1="${baseY}" x2="580" y2="${baseY}" stroke="#12324f" stroke-width="3"/><text x="55" y="${baseY + 5}" text-anchor="end" fill="#52677b" font-size="15">${min}</text><polyline points="${coords.map((point) => `${point.x},${point.y}`).join(" ")}" fill="none" stroke="#f28c28" stroke-width="6"/>${coords.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="8" fill="#1f5f99"/><text x="${point.x}" y="${baseY + 28}" text-anchor="middle" fill="#52677b" font-size="16">${escapeHtml(point.label)}</text><text x="${point.x}" y="${point.y - 14}" text-anchor="middle" fill="#12324f" font-size="17" font-weight="800">${point.value}</text>`).join("")}`, undefined, "Graphique d'évolution");
  }

  function base(template, generated, context) {
    const possibleLevels = context.level && context.level !== "all" && template.levels.includes(context.level)
      ? [context.level]
      : template.levels;
    return {
      templateId: template.id,
      templateVersion: template.version,
      level: pick(context.rng, possibleLevels),
      domain: template.domain,
      gesture: template.gesture,
      difficulty: template.difficulty,
      ...generated
    };
  }

  function template(config, generator) {
    const result = { version: 1, ...config };
    result.generate = (context) => base(result, generator(context), context);
    return result;
  }

  const templates = [
    template({ id: "num-parity-asn", levels: LEVELS, domain: "numbers", gesture: "conjecture", difficulty: 1 }, ({ rng }) => {
      const cases = [
        { statement: "La somme de deux nombres impairs est paire.", correct: 0, answer: "Toujours.", proof: "Deux nombres impairs s’écrivent 2a + 1 et 2b + 1. Leur somme vaut 2(a + b + 1), donc elle est paire." },
        { statement: "Un nombre pair est divisible par 4.", correct: 1, answer: "Parfois.", proof: "8 convient, mais 6 est pair et n’est pas divisible par 4." },
        { statement: "La somme d’un nombre pair et d’un nombre impair est paire.", correct: 2, answer: "Jamais.", proof: "2a + (2b + 1) = 2(a + b) + 1 : la somme est impaire." },
        { statement: "Le carré d’un nombre impair est impair.", correct: 0, answer: "Toujours.", proof: "(2a + 1)² = 2(2a² + 2a) + 1, qui est impair." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Toujours, parfois ou jamais ?", title: item.statement, subprompt: "Choisis, puis prépare un exemple ou un argument qui résiste à tous les cas.", choices: ["Toujours", "Parfois", "Jamais"], correctIndex: item.correct, hint: "« Toujours » demande une preuve ; « parfois » demande un exemple et un contre-exemple ; « jamais » demande une impossibilité.", answer: item.answer, proof: item.proof, reflex: "Associer chaque quantificateur au type de preuve nécessaire." };
    }),

    template({ id: "num-counterexample-operations", levels: LEVELS, domain: "numbers", gesture: "test", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { statement: "Diviser un nombre positif le rend toujours plus petit.", counter: "3 ÷ 0,5 = 6", why: "Diviser par un nombre compris entre 0 et 1 agrandit le résultat." },
        { statement: "Le carré d’un nombre positif est toujours plus grand que ce nombre.", counter: "0,5² = 0,25", why: "Entre 0 et 1, multiplier un nombre par lui-même le diminue." },
        { statement: "Ajouter deux fractions augmente toujours le dénominateur.", counter: "1/2 + 1/2 = 1", why: "Le dénominateur de l’écriture simplifiée peut diminuer." },
        { statement: "Soustraire un nombre donne toujours un résultat plus petit.", counter: "4 − (−2) = 6", why: "Soustraire un nombre négatif revient à ajouter son opposé." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Une seule objection suffit", title: `Réfute l’affirmation : « ${item.statement} »`, subprompt: "Propose des nombres précis et effectue le calcul.", openLabel: "Écris un contre-exemple, pas seulement « c’est faux ».", hint: "Cherche du côté de 0, de 1, des nombres négatifs ou des fractions : ce sont souvent des cas frontières.", answer: `Contre-exemple possible : ${item.counter}.`, proof: item.why, reflex: "Pour réfuter « toujours », un seul cas exact qui échoue suffit." };
    }),

    template({ id: "num-divisibility-deduction", levels: LEVELS, domain: "numbers", gesture: "logic", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { data: "N est divisible par 6.", choices: ["N est divisible par 2 et par 3", "N est divisible par 12", "N se termine par 6", "N est impair"], correct: 0, proof: "6 = 2 × 3. Tout multiple de 6 est donc à la fois multiple de 2 et de 3." },
        { data: "N est divisible par 10.", choices: ["N est divisible par 2 et par 5", "N est divisible par 20", "N est divisible par 3", "N = 10"], correct: 0, proof: "10 = 2 × 5. Un multiple de 10 possède ces deux diviseurs, mais pas nécessairement 20." },
        { data: "N est divisible par 4 et par 6.", choices: ["N est divisible par 12", "N est divisible par 24", "N est divisible par 10", "N est égal à 24"], correct: 0, proof: "Le plus petit multiple commun à 4 et 6 est 12. Par exemple 12 vérifie les données mais n’est pas divisible par 24." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Que peut-on vraiment déduire ?", title: item.data, subprompt: "Choisis la seule conclusion certaine.", choices: item.choices, correctIndex: item.correct, hint: "Teste la plus petite valeur qui vérifie la donnée, puis cherche la structure des multiples.", answer: item.choices[item.correct], proof: item.proof, reflex: "Une conclusion certaine doit être vraie pour toutes les valeurs compatibles avec les données." };
    }),

    template({ id: "num-consecutive-proof", levels: ["5e", "4e", "3e"], domain: "numbers", gesture: "justify", difficulty: 3 }, ({ rng }) => {
      const start = int(rng, 2, 12);
      return { kicker: "De l’exemple à la preuve", title: "La somme de trois entiers consécutifs est-elle toujours divisible par 3 ?", subprompt: `Commence si tu veux par ${start}, ${start + 1} et ${start + 2}, puis explique pourquoi l’idée vaut pour n’importe quel départ.`, math: `${start} + ${start + 1} + ${start + 2} = ${3 * (start + 1)}`, hint: "Appelle n le premier entier. Les deux suivants sont n + 1 et n + 2.", answer: "Oui, toujours.", proof: "n + (n + 1) + (n + 2) = 3n + 3 = 3(n + 1). La somme est donc un multiple de 3.", reflex: "Un exemple fait naitre la conjecture ; une lettre permet de traiter tous les cas." };
    }),

    template({ id: "num-odd-square-proof", levels: ["4e", "3e"], domain: "numbers", gesture: "justify", difficulty: 3 }, () => ({
      kicker: "Prouver une propriété numérique", title: "Prouve que le carré d’un entier impair est impair.", subprompt: "Ta preuve doit fonctionner pour tout entier impair, pas seulement pour quelques exemples.",
      steps: ["Écrire un entier impair sous la forme 2n + 1.", "Développer (2n + 1)².", "Mettre le résultat sous la forme 2k + 1.", "Conclure avec la définition d’un entier impair."],
      hint: "Développe (2n + 1)², puis factorise tout ce qui est pair.", answer: "Si un entier est impair, son carré est impair.", proof: "(2n + 1)² = 4n² + 4n + 1 = 2(2n² + 2n) + 1. C’est bien de la forme 2k + 1.", reflex: "Pour une propriété de parité, traduire pair par 2n et impair par 2n + 1." }
    )),

    template({ id: "num-fraction-first-error", levels: LEVELS, domain: "numbers", gesture: "critique", difficulty: 2 }, ({ rng }) => {
      const a = int(rng, 1, 4);
      const b = int(rng, a + 2, 9);
      const c = int(rng, 1, 4);
      const d = int(rng, c + 2, 9);
      const numerator = a * d + c * b;
      const denominator = b * d;
      return { kicker: "Diagnostic d’erreur", title: `Lina écrit : ${a}/${b} + ${c}/${d} = ${a + c}/${b + d}. Où son raisonnement casse-t-il ?`, subprompt: "Explique la première règle non respectée, puis corrige le calcul.", choices: ["Elle aurait dû additionner seulement les numérateurs", "Les parts n’ont pas le même dénominateur", "Il fallait multiplier les deux fractions", "Le calcul est correct"], correctIndex: 1, hint: "Dessine des parts de tailles différentes : peut-on les compter ensemble directement ?", answer: `Les parts n’ont pas la même taille. Un dénominateur commun possible est ${denominator}.`, proof: `${a}/${b} + ${c}/${d} = ${a * d}/${denominator} + ${c * b}/${denominator} = ${numerator}/${denominator}, à simplifier si nécessaire.`, reflex: "Repérer la première règle fausse avant de refaire tout le calcul." };
    }),

    template({ id: "num-estimation-plausibility", levels: LEVELS, domain: "numbers", gesture: "reflect", difficulty: 1 }, ({ rng }) => {
      const a = int(rng, 38, 89);
      const b = int(rng, 11, 29);
      const actual = a * b;
      const candidateSet = new Set([actual, Math.round(actual / 10), actual * 10, a + b, actual + a, Math.round(actual / 100) * 1000]);
      const candidates = shuffled(rng, Array.from(candidateSet).slice(0, 4));
      const correct = candidates.indexOf(actual);
      return { kicker: "Avant le calcul exact", title: `Sans poser l’opération, quel résultat peut être celui de ${a} × ${b} ?`, subprompt: "Élimine les ordres de grandeur impossibles et justifie ton choix.", choices: candidates.map(String), correctIndex: correct, hint: `${a} est proche de ${Math.round(a / 10) * 10} et ${b} est proche de ${Math.round(b / 10) * 10}.`, answer: `${actual} est le seul ordre de grandeur plausible.`, proof: `${a} × ${b} est voisin de ${Math.round(a / 10) * 10} × ${Math.round(b / 10) * 10}, donc de quelques milliers, et non de quelques dizaines ou dizaines de milliers.`, reflex: "Estimer avant de calculer permet de détecter une erreur de touche ou de virgule." };
    }),

    template({ id: "num-clever-strategy", levels: LEVELS, domain: "numbers", gesture: "strategy", difficulty: 2 }, ({ rng }) => {
      const n = pick(rng, [19, 21, 49, 51, 99, 101]);
      const factor = int(rng, 4, 12);
      const near = n < 20 ? 20 : n < 50 ? 50 : 100;
      const operation = n < near ? `${near} × ${factor} − ${factor}` : `${near} × ${factor} + ${factor}`;
      return { kicker: "Choisir avant d’exécuter", title: `Quelle stratégie rend ${n} × ${factor} presque mental ?`, subprompt: "Le but n’est pas seulement d’obtenir le résultat, mais d’expliquer le choix.", choices: ["Poser immédiatement la multiplication", `Remplacer ${n} par ${near} puis compenser`, "Additionner les deux nombres", "Utiliser un tableau de proportionnalité"], correctIndex: 1, hint: `${n} est à une unité d’un nombre rond.`, answer: `${operation} = ${n * factor}.`, proof: "La distributivité autorise à remplacer un facteur par une somme ou une différence plus commode, puis à compenser exactement.", reflex: "Avant de calculer, chercher nombre rond, facteur commun ou décomposition utile." };
    }),

    template({ id: "alg-pattern-generalize", levels: LEVELS, domain: "algebra", gesture: "conjecture", difficulty: 2 }, ({ rng }) => {
      const multiplier = pick(rng, [2, 3, 4]);
      const fixed = pick(rng, [1, 2, 3].filter((value) => value !== multiplier));
      const values = [1, 2, 3].map((n) => multiplier * n + fixed);
      const options = shuffled(rng, [`${multiplier}n + ${fixed}`, `${fixed}n + ${multiplier}`, `${multiplier}(n + ${fixed})`, `${multiplier}n − ${fixed}`]);
      const correct = options.indexOf(`${multiplier}n + ${fixed}`);
      return { kicker: "Voir ce qui change et ce qui reste", title: `Le motif possède ${values[0]}, puis ${values[1]}, puis ${values[2]} éléments. Quelle formule prévoit le rang n ?`, subprompt: "Vérifie la formule sur deux rangs différents avant de la retenir.", visual: patternSvg(values), choices: options, correctIndex: correct, hint: `À chaque nouveau rang, on ajoute ${multiplier} éléments. Il reste aussi une partie fixe.`, answer: `La formule est ${multiplier}n + ${fixed}.`, proof: `Pour n = 1, 2, 3, elle donne bien ${values.join(", ")}. Surtout, elle décrit la structure : ${multiplier} groupes dépendant du rang et ${fixed} élément${fixed > 1 ? "s" : ""} fixe${fixed > 1 ? "s" : ""}.`, reflex: "Une formule de motif doit décrire sa construction, pas seulement coller aux premiers nombres." };
    }),

    template({ id: "alg-examples-not-proof", levels: ["5e", "4e", "3e"], domain: "algebra", gesture: "critique", difficulty: 2 }, ({ rng }) => {
      const claim = pick(rng, [
        { text: "n² + n est pair pour tout entier n", proof: "n² + n = n(n + 1). Deux entiers consécutifs : l’un des deux est pair, donc leur produit est pair." },
        { text: "la somme de deux multiples de 5 est un multiple de 5", proof: "Si les nombres sont 5a et 5b, leur somme est 5(a + b), donc un multiple de 5." },
        { text: "le produit de deux nombres impairs est impair", proof: "(2a + 1)(2b + 1) = 2(2ab + a + b) + 1, donc le produit est impair." }
      ]);
      return { kicker: "Exemples ou démonstration ?", title: `Noé vérifie quatre valeurs puis conclut : « ${claim.text}. » A-t-il prouvé l’affirmation ?`, subprompt: "Décide ce que les essais autorisent réellement à dire.", choices: ["Oui, quatre exemples suffisent", "Oui, si les nombres sont grands", "Non, ils soutiennent une conjecture mais ne prouvent pas tous les cas", "Non, les exemples ne servent jamais"], correctIndex: 2, hint: "Combien d’entiers faudrait-il tester pour couvrir « tout entier » ?", answer: "Non. Les exemples rendent la conjecture plausible, sans traiter l’infinité des cas.", proof: claim.proof, reflex: "Des exemples peuvent faire conjecturer ; une preuve explique pourquoi aucun cas ne peut échapper." };
    }),

    template({ id: "alg-reorder-even-proof", levels: ["5e", "4e", "3e"], domain: "algebra", gesture: "logic", difficulty: 3 }, ({ rng }) => {
      const steps = ["On note 2a et 2b les deux nombres pairs.", "Leur somme vaut 2a + 2b.", "On factorise : 2a + 2b = 2(a + b).", "La somme est donc un multiple de 2, donc un nombre pair."];
      const order = shuffled(rng, steps);
      return { kicker: "Remettre une preuve en ordre", title: "Dans quel ordre enchainer ces quatre phrases pour prouver que la somme de deux nombres pairs est paire ?", subprompt: "Repère la donnée traduite, le calcul, puis la conclusion.", sequence: order, correctSequence: steps, hint: "Une preuve part des hypothèses et se termine par la propriété à établir.", answer: "Ordre : écriture des deux nombres, somme, factorisation, conclusion.", proof: steps.join(" "), reflex: "Une chaine déductive va des données vers la conclusion, chaque maillon étant justifié." };
    }),

    template({ id: "alg-expand-first-error", levels: ["4e", "3e"], domain: "algebra", gesture: "critique", difficulty: 2 }, ({ rng }) => {
      const a = int(rng, 2, 7);
      const b = int(rng, 2, 9);
      const c = int(rng, 2, 6);
      return { kicker: "La première erreur utile", title: `Maya développe : ${a}(${b}x − ${c}) = ${a * b}x − ${c}. Quelle est la première erreur ?`, subprompt: "N’effectue pas tout à nouveau avant d’avoir nommé la règle oubliée.", choices: [`Le terme ${b}x ne doit pas être multiplié`, `Le facteur ${a} doit multiplier chacun des deux termes`, "Il faut remplacer x par une valeur", "Il n’y a pas d’erreur"], correctIndex: 1, hint: "Dessine deux flèches partant du facteur extérieur.", answer: `Le facteur ${a} doit aussi multiplier −${c}.`, proof: `${a}(${b}x − ${c}) = ${a * b}x − ${a * c}.`, reflex: "Dans une distributivité, vérifier que chaque terme intérieur a reçu le facteur extérieur." };
    }),

    template({ id: "alg-illegal-division", levels: ["3e"], domain: "algebra", gesture: "critique", difficulty: 3 }, () => ({
      kicker: "Une hypothèse cachée", title: "On part de ax = ay et on divise par a pour conclure x = y. Cette étape est-elle toujours valide ?", subprompt: "Cherche la valeur de a qui rend le raisonnement dangereux.", choices: ["Oui, pour tous les réels", "Non : il faut savoir que a ≠ 0", "Non : il faut savoir que x et y sont positifs", "Oui, si x et y sont entiers"], correctIndex: 1, hint: "Que signifie « diviser par a » lorsque a vaut 0 ?", answer: "Il faut l’hypothèse a ≠ 0.", proof: "Si a = 0, alors ax = ay devient 0 = 0 pour n’importe quels x et y ; on ne peut donc pas en déduire x = y.", reflex: "Avant de diviser par une expression, vérifier qu’elle ne peut pas être nulle." }
    )),

    template({ id: "alg-analysis-synthesis", levels: ["3e"], domain: "algebra", gesture: "strategy", difficulty: 3 }, ({ rng }) => {
      const target = int(rng, 4, 12);
      const result = target * target + target;
      return { kicker: "Remonter puis vérifier", title: `Trouve un entier dont le carré augmenté de lui-même vaut ${result}.`, subprompt: "Propose une valeur plausible, puis distingue la recherche de la vérification.", math: `x² + x = ${result}`, hint: `Encadre ${result} entre deux carrés consécutifs.`, answer: `x = ${target} convient${target !== -target - 1 ? `, et x = ${-target - 1} aussi` : ""}.`, proof: `${target}² + ${target} = ${result}. De plus, (${signed(-target - 1)})² + (${signed(-target - 1)}) = ${result}. La vérification confirme les solutions proposées.`, reflex: "L’analyse aide à trouver ; la synthèse vérifie que chaque candidat répond bien au problème." };
    }),

    template({ id: "alg-implication-converse", levels: ["4e", "3e"], domain: "algebra", gesture: "logic", difficulty: 3 }, ({ rng }) => {
      const cases = [
        { premise: "Si un entier est multiple de 4, alors il est pair.", converse: "Si un entier est pair, alors il est multiple de 4.", counter: "6 est pair mais n’est pas multiple de 4." },
        { premise: "Si x = 3, alors x² = 9.", converse: "Si x² = 9, alors x = 3.", counter: "x = −3 vérifie aussi x² = 9." },
        { premise: "Si un nombre se termine par 0, alors il est divisible par 5.", converse: "S’il est divisible par 5, il se termine par 0.", counter: "15 est divisible par 5 et se termine par 5." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Attention au sens de la flèche", title: `On sait : « ${item.premise} » Peut-on affirmer la réciproque ?`, subprompt: `Réciproque proposée : « ${item.converse} »`, choices: ["Oui, une implication et sa réciproque sont toujours vraies ensemble", "Oui, parce que les phrases utilisent les mêmes mots", "Non, la réciproque doit être vérifiée séparément", "Non, aucune réciproque n’est jamais vraie"], correctIndex: 2, hint: "Inverse le rôle de l’hypothèse et de la conclusion, puis cherche un contre-exemple.", answer: "Non, cette réciproque est fausse.", proof: item.counter, reflex: "Retourner une implication crée une nouvelle affirmation, à prouver ou à réfuter." };
    }),

    template({ id: "alg-equivalent-expressions", levels: ["5e", "4e", "3e"], domain: "algebra", gesture: "test", difficulty: 2 }, ({ rng }) => {
      const a = int(rng, 2, 6);
      const b = int(rng, 2, 7);
      const options = shuffled(rng, [`${a}x + ${a * b}`, `${a}x + ${b}`, `${a + b}x`, `${a * b}x + ${a}`]);
      const correctExpression = `${a}x + ${a * b}`;
      return { kicker: "Tester sans se laisser piéger", title: `Quelle expression est égale à ${a}(x + ${b}) pour toute valeur de x ?`, subprompt: "Un essai peut éliminer une formule ; la distributivité justifie celle qui reste.", choices: options, correctIndex: options.indexOf(correctExpression), hint: "Teste x = 0 : plusieurs expressions fausses disparaissent immédiatement.", answer: `${a}(x + ${b}) = ${correctExpression}.`, proof: `Le facteur ${a} multiplie x et ${b}. Tester une valeur est utile pour réfuter ; la distributivité prouve l’identité pour tout x.`, reflex: "Choisir une valeur simple pour trier, puis revenir à une propriété pour prouver." };
    }),

    template({ id: "geo-measure-not-proof", levels: LEVELS, domain: "geometry", gesture: "critique", difficulty: 1 }, ({ rng }) => {
      const claim = pick(rng, ["Ces deux droites sont perpendiculaires", "Ce triangle est isocèle", "Ces deux longueurs sont égales", "Cet angle mesure 60°"]);
      return { kicker: "Voir n’est pas démontrer", title: `Sur la figure, ${claim.toLowerCase()}. « Je l’ai mesuré sur le dessin » est-il une preuve ?`, subprompt: "Distingue ce qui aide à conjecturer de ce qui garantit la conclusion.", choices: ["Oui, si la règle est précise", "Oui, si le dessin est grand", "Non, une figure particulière ou imprécise ne prouve pas le cas général", "Non, on ne doit jamais mesurer"], correctIndex: 2, hint: "La figure pourrait-elle être légèrement déformée tout en gardant les mêmes données écrites ?", answer: "Non. La mesure sur le dessin soutient une conjecture, mais ne démontre pas.", proof: "Une preuve utilise les données codées, une définition ou une propriété. Le dessin est un support du raisonnement, pas sa garantie.", reflex: "En géométrie, demander : quelle donnée ou propriété autorise exactement cette conclusion ?" };
    }),

    template({ id: "geo-perpendicular-bisector", levels: LEVELS, domain: "geometry", gesture: "logic", difficulty: 2 }, ({ rng }) => {
      const point = pick(rng, ["M", "P", "R"]);
      return { kicker: "Définition ou propriété ?", title: `${point} appartient à la médiatrice du segment [AB]. Que peut-on affirmer ?`, subprompt: "Choisis la conclusion garantie par cette seule donnée.", choices: [`${point}A = ${point}B`, `${point} est le milieu de [AB]`, `(A${point}) ⟂ (B${point})`, `AB = A${point}`], correctIndex: 0, hint: "La médiatrice est l’ensemble des points équidistants des extrémités d’un segment.", answer: `${point}A = ${point}B.`, proof: "Tout point de la médiatrice d’un segment est à égale distance de ses deux extrémités.", reflex: "Reformuler une appartenance à un lieu géométrique par la propriété qui le caractérise." };
    }),

    template({ id: "geo-angle-proof-order", levels: ["5e", "4e", "3e"], domain: "geometry", gesture: "logic", difficulty: 3 }, ({ rng }) => {
      const a = int(rng, 35, 70);
      const b = int(rng, 35, 80);
      const c = 180 - a - b;
      const steps = ["Dans un triangle, la somme des trois angles vaut 180°.", `Donc l’angle inconnu vaut 180° − ${a}° − ${b}°.`, `On calcule : 180 − ${a} − ${b} = ${c}.`, `L’angle inconnu mesure donc ${c}°.`];
      return { kicker: "Chainer propriété et calcul", title: `Un triangle possède deux angles de ${a}° et ${b}°. Remets la justification de son troisième angle dans l’ordre.`, subprompt: "La propriété doit apparaitre avant le calcul qu’elle autorise.", sequence: shuffled(rng, steps), correctSequence: steps, hint: "Commence par énoncer la propriété générale sur les angles d’un triangle.", answer: `Le troisième angle mesure ${c}°.`, proof: steps.join(" "), reflex: "Citer la propriété avant de l’utiliser rend le calcul démonstratif." };
    }),

    template({ id: "geo-quadrilateral-characteristic", levels: ["5e", "4e", "3e"], domain: "geometry", gesture: "logic", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { data: "Un quadrilatère a ses diagonales qui se coupent en leur milieu.", conclusion: "C’est un parallélogramme", distractors: ["C’est forcément un rectangle", "C’est forcément un losange", "On ne peut rien conclure"], proof: "C’est une propriété caractéristique du parallélogramme." },
        { data: "Un parallélogramme possède un angle droit.", conclusion: "C’est un rectangle", distractors: ["C’est forcément un losange", "C’est seulement un trapèze", "On ne peut rien conclure"], proof: "Un parallélogramme ayant un angle droit est un rectangle." },
        { data: "Un parallélogramme possède deux côtés consécutifs de même longueur.", conclusion: "C’est un losange", distractors: ["C’est forcément un rectangle", "C’est un triangle", "On ne peut rien conclure"], proof: "Dans un parallélogramme, les côtés opposés sont égaux ; l’égalité de deux côtés consécutifs rend alors les quatre côtés égaux." }
      ];
      const item = pick(rng, cases);
      const choices = shuffled(rng, [item.conclusion, ...item.distractors]);
      return { kicker: "Propriété caractéristique", title: item.data, subprompt: "Quelle nature est garantie, sans te fier à l’allure d’un dessin ?", choices, correctIndex: choices.indexOf(item.conclusion), hint: "Cherche une propriété qui fonctionne dans les deux sens pour reconnaitre la figure.", answer: `${item.conclusion}.`, proof: item.proof, reflex: "Pour reconnaitre une figure, utiliser une propriété caractéristique et vérifier toutes ses hypothèses." };
    }),

    template({ id: "geo-pythagoras-status", levels: ["4e", "3e"], domain: "geometry", gesture: "strategy", difficulty: 2 }, ({ rng }) => {
      const triple = pick(rng, [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]]);
      const [a, b, c] = triple;
      return { kicker: "Théorème ou réciproque ?", title: `Un triangle a pour côtés ${a} cm, ${b} cm et ${c} cm. Quel outil permet de décider s’il est rectangle ?`, subprompt: "La nature du triangle n’est pas donnée : choisis le bon sens du raisonnement.", visual: triangleSvg(`${a} cm`, `${b} cm`, `${c} cm`, false), choices: ["Le théorème de Pythagore", "La réciproque du théorème de Pythagore", "La contraposée de Thalès", "Une mesure sur la figure"], correctIndex: 1, hint: "Le théorème calcule une longueur quand le triangle est déjà rectangle ; ici, on veut reconnaitre sa nature.", answer: "On utilise la réciproque du théorème de Pythagore.", proof: `${a}² + ${b}² = ${a * a + b * b} et ${c}² = ${c * c}. Les deux valeurs sont égales ; le triangle est rectangle, d’hypoténuse le côté de longueur ${c} cm.`, reflex: "Identifier ce qui est donné et ce qu’il faut conclure avant de choisir théorème, réciproque ou contraposée." };
    }),

    template({ id: "geo-pythagoras-contrapositive", levels: ["4e", "3e"], domain: "geometry", gesture: "logic", difficulty: 3 }, ({ rng }) => {
      const cases = [[4, 5, 7], [5, 6, 8], [6, 7, 10], [7, 9, 12]];
      const [a, b, c] = pick(rng, cases);
      return { kicker: "Prouver que ce n’est pas", title: `Les côtés d’un triangle mesurent ${a} cm, ${b} cm et ${c} cm. Comment prouver qu’il n’est pas rectangle ?`, subprompt: "Compare le carré du plus grand côté à la somme des carrés des deux autres.", choices: [`${a}² + ${b}² ≠ ${c}², donc le triangle n’est pas rectangle`, `${a} + ${b} ≠ ${c}, donc le triangle n’est pas rectangle`, "Le dessin n’a pas d’angle droit", "Aucun outil ne permet de conclure"], correctIndex: 0, hint: "La contraposée de « rectangle ⇒ égalité » est « pas d’égalité ⇒ pas rectangle ».", answer: `${a * a} + ${b * b} = ${a * a + b * b}, tandis que ${c}² = ${c * c}.`, proof: "Les valeurs sont différentes. Par contraposée du théorème de Pythagore, le triangle n’est pas rectangle.", reflex: "Pour nier une conclusion, la contraposée peut transformer la preuve en un test calculable." };
    }),

    template({ id: "geo-thales-useful-data", levels: ["3e"], domain: "geometry", gesture: "strategy", difficulty: 3 }, () => ({
      kicker: "Vérifier les conditions avant la formule", title: "Dans un triangle ABC, M appartient à [AB] et N à [AC]. Quelle donnée manque pour appliquer le théorème de Thalès ?", subprompt: "Ne commence aucun produit en croix avant d’avoir contrôlé la configuration.", choices: ["(MN) ∥ (BC)", "AM = AN", "Le triangle ABC est rectangle", "M et N sont des milieux"], correctIndex: 0, hint: "Le théorème relie des longueurs grâce à une condition géométrique précise.", answer: "Il faut savoir que les droites (MN) et (BC) sont parallèles.", proof: "Avec M sur [AB], N sur [AC] et (MN) parallèle à (BC), on peut écrire les rapports de Thalès dans le bon ordre.", reflex: "Une formule n’est disponible qu’après vérification de toutes les hypothèses du théorème." }
    )),

    template({ id: "geo-median-area", levels: ["5e", "4e", "3e"], domain: "geometry", gesture: "justify", difficulty: 3 }, () => ({
      kicker: "Voir un invariant", title: "Dans un triangle ABC, M est le milieu de [BC]. Pourquoi les triangles ABM et ACM ont-ils la même aire ?", subprompt: "Cherche une base et une hauteur comparables.", choices: ["Ils ont la même base", "BM = MC et ils ont la même hauteur issue de A", "Ils sont toujours superposables", "Parce que M est le centre du triangle"], correctIndex: 1, hint: "Utilise Aire = base × hauteur ÷ 2 en prenant les bases sur la droite (BC).", answer: "Les deux aires sont égales.", proof: "Les bases BM et MC sont égales puisque M est le milieu de [BC]. Les deux triangles ont la même hauteur issue de A relative à la droite (BC).", reflex: "Pour comparer des aires, chercher une base égale et une hauteur commune plutôt que l’allure des figures." }
    )),

    template({ id: "geo-triangle-congruence", levels: ["5e", "4e", "3e"], domain: "geometry", gesture: "justify", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { data: "trois côtés respectivement égaux", valid: true, proof: "Le critère côté-côté-côté suffit à déterminer deux triangles superposables." },
        { data: "trois angles respectivement égaux", valid: false, proof: "Les triangles ont la même forme, mais peuvent avoir des tailles différentes." },
        { data: "deux côtés et l’angle compris respectivement égaux", valid: true, proof: "Le critère côté-angle-côté fixe la forme et la taille." },
        { data: "un seul côté de même longueur", valid: false, proof: "Une infinité de triangles différents peuvent partager une même longueur de côté." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Données suffisantes ?", title: `Deux triangles ont ${item.data}. Sont-ils nécessairement superposables ?`, subprompt: "Décide si les informations fixent à la fois la forme et la taille.", choices: ["Oui, nécessairement", "Non, pas nécessairement"], correctIndex: item.valid ? 0 : 1, hint: "Essaie mentalement de déformer ou d’agrandir un triangle tout en conservant les données.", answer: item.valid ? "Oui, les données sont suffisantes." : "Non, les données ne sont pas suffisantes.", proof: item.proof, reflex: "Distinguer données compatibles et données suffisantes pour garantir une conclusion." };
    }),

    template({ id: "data-mean-extreme", levels: ["5e", "4e", "3e"], domain: "data", gesture: "conjecture", difficulty: 2 }, ({ rng }) => {
      const values = [int(rng, 8, 12), int(rng, 10, 14), int(rng, 11, 15), int(rng, 12, 16)];
      const outlier = int(rng, 35, 50);
      return { kicker: "Effet d’une valeur extrême", title: `Une série contient ${values.join(", ")}. On ajoute ${outlier}. Que devient la moyenne ?`, subprompt: "Raisonne d’abord sur le sens de variation, sans forcément calculer la nouvelle valeur.", choices: ["Elle augmente", "Elle diminue", "Elle ne change pas", "On ne peut jamais savoir"], correctIndex: 0, hint: "Compare la nouvelle valeur à l’ancienne moyenne, qui est comprise entre le minimum et le maximum.", answer: "La moyenne augmente.", proof: `${outlier} est supérieur à toutes les valeurs, donc à l’ancienne moyenne. Ajouter une valeur supérieure à la moyenne fait augmenter la moyenne.`, reflex: "Comparer la nouvelle valeur à l’ancienne moyenne permet souvent de prévoir l’effet sans tout recalculer." };
    }),

    template({ id: "data-truncated-graph", levels: LEVELS, domain: "data", gesture: "critique", difficulty: 2 }, ({ rng }) => {
      const start = int(rng, 70, 90);
      const points = [["Lun.", start], ["Mar.", start + 1], ["Mer.", start + 2], ["Jeu.", start + 3]];
      return { kicker: "Lire sans se faire impressionner", title: "Le graphique donne l’impression d’une hausse spectaculaire. Est-ce justifié ?", subprompt: "Observe l’origine et l’amplitude de l’axe vertical avant d’interpréter.", visual: graphSvg(points, true), choices: ["Oui, la valeur a au moins doublé", "Non, l’axe tronqué amplifie une hausse de quelques unités", "Oui, toute ligne montante prouve une forte hausse", "On ne peut lire aucune valeur"], correctIndex: 1, hint: "Compare la première et la dernière valeur, pas seulement la pente visuelle.", answer: `La valeur passe de ${start} à ${start + 3}, soit seulement +3.`, proof: "L’axe vertical commence près des données au lieu de 0 ; cela agrandit visuellement un écart faible. Le graphique n’est pas faux, mais sa présentation peut être trompeuse.", reflex: "Sur un graphique, vérifier échelle, origine, unités et valeurs avant de commenter la forme." };
    }),

    template({ id: "data-correlation-causation", levels: ["4e", "3e"], domain: "data", gesture: "model", difficulty: 3 }, ({ rng }) => {
      const cases = [
        { a: "les ventes de glaces", b: "le nombre de baignades", hidden: "la température estivale" },
        { a: "la pointure", b: "le vocabulaire lu", hidden: "l’âge des enfants" },
        { a: "le nombre de pompiers présents", b: "l’ampleur des dégâts", hidden: "la gravité initiale de l’incendie" }
      ];
      const item = pick(rng, cases);
      return { kicker: "Corrélation n’est pas causalité", title: `On observe que ${item.a} augmente en même temps que ${item.b}. Peut-on conclure que l’un cause l’autre ?`, subprompt: "Propose une variable cachée ou une autre explication compatible avec les données.", choices: ["Oui, deux évolutions liées prouvent toujours une cause", "Non, une association seule ne prouve pas un lien causal", "Oui, si le graphique est précis", "Non, les statistiques ne permettent jamais de conclure"], correctIndex: 1, hint: `Cherche un troisième facteur qui pourrait agir sur les deux phénomènes.`, answer: "Non. L’association observée ne suffit pas à établir une cause.", proof: `Une explication possible est ${item.hidden}. Il faudrait un protocole et d’autres données pour isoler un effet causal.`, reflex: "Séparer ce que les données montrent de l’histoire qu’on leur fait raconter." };
    }),

    template({ id: "data-equiprobability", levels: ["5e", "4e", "3e"], domain: "data", gesture: "model", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { object: "une pièce inconnue", outcomes: "pile et face", assumption: "la pièce est équilibrée" },
        { object: "un dé artisanal", outcomes: "ses six faces", assumption: "le dé est équilibré" },
        { object: "une roue colorée sans autre information", outcomes: "les couleurs", assumption: "les secteurs associés ont le même angle" }
      ];
      const item = pick(rng, cases);
      return { kicker: "Une hypothèse du modèle", title: `On utilise ${item.object}. Peut-on déclarer que ${item.outcomes} sont équiprobables ?`, subprompt: "Distingue une conséquence mathématique d’une hypothèse sur l’objet réel.", choices: ["Oui, dès que les issues sont nommées", "Non, il faut une hypothèse de symétrie ou d’équilibre", "Oui, après un seul essai", "Non, aucune expérience ne peut être modélisée"], correctIndex: 1, hint: "Deux issues possibles ne signifient pas automatiquement une chance sur deux.", answer: `Il faut supposer que ${item.assumption}.`, proof: "L’équiprobabilité appartient au modèle choisi. Elle doit être justifiée par la symétrie, la fabrication ou vérifiée expérimentalement de façon raisonnable.", reflex: "En probabilité, annoncer les hypothèses du modèle avant de calculer." };
    }),

    template({ id: "data-small-sample", levels: ["5e", "4e", "3e"], domain: "data", gesture: "reflect", difficulty: 2 }, ({ rng }) => {
      const heads = int(rng, 7, 10);
      const throws = 10;
      return { kicker: "Hasard et fluctuation", title: `Une pièce supposée équilibrée donne ${heads} piles en ${throws} lancers. Est-ce une preuve qu’elle est truquée ?`, subprompt: "Discute la taille de l’échantillon et la fluctuation possible.", choices: ["Oui, exactement", "Non, un petit échantillon peut beaucoup fluctuer", "Oui, car il fallait exactement 5 piles", "Non, une pièce ne peut jamais être testée"], correctIndex: 1, hint: "Équilibrée ne veut pas dire que chaque courte série contient exactement moitié-moitié.", answer: "Non, cette série seule ne suffit pas.", proof: "Même avec une probabilité de 1/2, des écarts apparaissent au hasard. Il faudrait beaucoup plus d’essais et un critère décidé à l’avance pour juger l’écart inhabituel.", reflex: "Avant de généraliser une fréquence, regarder la taille et la variabilité de l’échantillon." };
    }),

    template({ id: "data-mean-median-resistance", levels: ["4e", "3e"], domain: "data", gesture: "strategy", difficulty: 2 }, () => ({
      kicker: "Choisir l’indicateur", title: "Pour décrire les salaires d’une petite entreprise où le dirigeant gagne beaucoup plus que les autres, quel indicateur résiste mieux à cette valeur extrême ?", subprompt: "Explique ce que l’indicateur choisi raconte et ce qu’il masque.", choices: ["La moyenne", "La médiane", "L’étendue", "Le maximum"], correctIndex: 1, hint: "Une valeur extrême déplace la moyenne, mais pas forcément la position centrale dans la liste ordonnée.", answer: "La médiane est moins sensible à la valeur extrême.", proof: "La médiane dépend de l’ordre des valeurs, tandis que la moyenne utilise leur somme. Il reste pertinent de donner plusieurs indicateurs pour ne pas masquer la dispersion.", reflex: "Choisir un indicateur en fonction de la question et de la forme des données, pas par habitude." }
    )),

    template({ id: "data-probability-bounds", levels: ["5e", "4e", "3e"], domain: "data", gesture: "observe", difficulty: 1 }, ({ rng }) => {
      const probability = pick(rng, ["−0,2", "1,4", "120 %", "3/2"]);
      return { kicker: "Contrôle immédiat", title: `Un calcul donne la probabilité ${probability}. Que peux-tu conclure sans refaire tout le calcul ?`, subprompt: "Utilise une propriété de toutes les probabilités.", choices: ["Le résultat est possible", "Le résultat est impossible : une probabilité est comprise entre 0 et 1", "L’évènement est certain", "Il manque seulement une unité"], correctIndex: 1, hint: "0 correspond à impossible et 1 à certain.", answer: "Le résultat est impossible.", proof: "Toute probabilité appartient à l’intervalle [0 ; 1], soit de 0 % à 100 %. Le calcul ou le modèle contient donc une erreur.", reflex: "Contrôler les bornes naturelles d’un résultat avant de lui donner du sens." };
    }),

    template({ id: "prop-table-test", levels: LEVELS, domain: "proportion", gesture: "test", difficulty: 1 }, ({ rng }) => {
      const k = int(rng, 2, 6);
      const proportional = rng() > 0.45;
      const xs = [2, 3, 5];
      const ys = xs.map((x, index) => k * x + (!proportional && index === 2 ? 1 : 0));
      return { kicker: "Même opérateur partout ?", title: `Le tableau x : ${xs.join(" ; ")} / y : ${ys.join(" ; ")} est-il un tableau de proportionnalité ?`, subprompt: "Un seul quotient différent suffit pour réfuter.", choices: ["Oui", "Non"], correctIndex: proportional ? 0 : 1, hint: "Calcule y ÷ x dans au moins deux colonnes.", answer: proportional ? `Oui, le coefficient est ${k}.` : "Non, les quotients ne sont pas tous égaux.", proof: proportional ? `${ys[0]} ÷ ${xs[0]} = ${ys[1]} ÷ ${xs[1]} = ${ys[2]} ÷ ${xs[2]} = ${k}.` : `Les deux premières colonnes donnent ${k}, mais ${ys[2]} ÷ ${xs[2]} ≠ ${k}.`, reflex: "La proportionnalité exige un même multiplicateur pour toutes les valeurs." };
    }),

    template({ id: "prop-additive-trap", levels: LEVELS, domain: "proportion", gesture: "critique", difficulty: 2 }, ({ rng }) => {
      const price = int(rng, 3, 8);
      const qty = int(rng, 2, 5);
      const next = qty + 2;
      return { kicker: "Additif ou multiplicatif ?", title: `${qty} objets coûtent ${qty * price} €. Eli dit : « ${next} objets coûtent ${qty * price + 2} € car on ajoute 2 objets. » Où est l’erreur ?`, subprompt: "Identifie ce qui doit rester invariant dans la situation.", choices: ["Il faut ajouter 2 €", `Chaque objet ajoute ${price} €, pas 1 €`, "Il faut soustraire 2 €", "Le prix ne dépend pas de la quantité"], correctIndex: 1, hint: "Quel est le prix d’un seul objet ?", answer: `${next} objets coûtent ${next * price} €.`, proof: `Le coefficient de proportionnalité est ${price} €/objet. Ajouter 2 objets ajoute 2 × ${price} = ${2 * price} €, et non 2 €.`, reflex: "Dans une situation proportionnelle, les écarts aussi sont multipliés par le prix unitaire." };
    }),

    template({ id: "prop-scale-strategy", levels: LEVELS, domain: "proportion", gesture: "strategy", difficulty: 2 }, ({ rng }) => {
      const base = pick(rng, [3, 4, 5]);
      const price = int(rng, 6, 12);
      const target = base * pick(rng, [3, 4, 5]);
      const multiplier = target / base;
      return { kicker: "Choisir le chemin le plus court", title: `${base} places coûtent ${price} €. Comment trouver rapidement le prix de ${target} places au même tarif ?`, subprompt: "Compare passage à l’unité et facteur direct.", choices: [`Multiplier ${price} par ${multiplier}`, `Ajouter ${target - base} à ${price}`, `Diviser ${price} par ${multiplier}`, "Faire une moyenne"], correctIndex: 0, hint: `${target} est ${multiplier} fois ${base}.`, answer: `${target} places coûtent ${price * multiplier} €.`, proof: `La quantité est multipliée par ${multiplier} ; dans une situation proportionnelle, le prix l’est aussi.`, reflex: "Chercher d’abord un rapport simple entre les quantités avant de passer systématiquement par l’unité." };
    }),

    template({ id: "prop-percent-reverse", levels: ["4e", "3e"], domain: "proportion", gesture: "critique", difficulty: 2 }, ({ rng }) => {
      const p = pick(rng, [10, 20, 25, 30]);
      return { kicker: "Une transformation et son inverse", title: `Après une hausse de ${p} %, un prix baisse de ${p} %. Revient-il forcément à sa valeur initiale ?`, subprompt: "Teste sur un prix initial de 100 € et compare les bases des deux pourcentages.", choices: ["Oui, les pourcentages s’annulent", "Non, la baisse s’applique au nouveau prix", "Oui, si le prix est entier", "On ne peut pas calculer"], correctIndex: 1, hint: `Après la hausse, 100 € devient ${100 + p} €. Calcule ensuite ${p} % de ce nouveau montant.`, answer: `Non : 100 × ${(1 + p / 100).toFixed(2).replace(".", ",")} × ${(1 - p / 100).toFixed(2).replace(".", ",")} = ${100 - p * p / 100} €.`, proof: `Les coefficients multiplicateurs sont ${1 + p / 100} et ${1 - p / 100}. Leur produit vaut ${1 - (p / 100) ** 2}, inférieur à 1.`, reflex: "Deux pourcentages opposés ne s’annulent que s’ils portent sur la même base." };
    }),

    template({ id: "prop-function-representations", levels: ["3e"], domain: "proportion", gesture: "model", difficulty: 2 }, ({ rng }) => {
      const rate = int(rng, 2, 5);
      const fixed = pick(rng, [2, 3, 4, 5, 6, 7, 8].filter((value) => value !== rate));
      return { kicker: "Relier situation et formule", title: `Un service facture ${fixed} € fixes puis ${rate} € par heure. Quelle formule donne le prix P pour h heures ?`, subprompt: "Distingue la partie fixe de la partie qui dépend de la durée.", choices: [`P = ${fixed}h + ${rate}`, `P = ${rate}h + ${fixed}`, `P = ${fixed + rate}h`, `P = ${fixed + rate}`], correctIndex: 1, hint: "Pour h = 0, la formule doit encore donner les frais fixes.", answer: `P(h) = ${rate}h + ${fixed}.`, proof: `${rate}h représente le coût variable de h heures ; on ajoute ensuite les ${fixed} € indépendants de h.`, reflex: "Dans une formule de modèle, interpréter séparément chaque terme et tester une valeur frontière." };
    }),

    template({ id: "prop-graph-inference", levels: ["3e"], domain: "proportion", gesture: "model", difficulty: 2 }, ({ rng }) => {
      const start = int(rng, 2, 6);
      const step = int(rng, 2, 4);
      const points = [["0", start], ["1", start + step], ["2", start + 2 * step], ["3", start + 3 * step]];
      return { kicker: "Ce que le graphique autorise", title: "La représentation est une droite qui ne passe pas par l’origine. Quelle conclusion est certaine ?", subprompt: "Distingue fonction affine et situation de proportionnalité.", visual: graphSvg(points, false), choices: ["La situation est proportionnelle", "La situation n’est pas proportionnelle", "Toutes les valeurs sont négatives", "La fonction est constante"], correctIndex: 1, hint: "Une représentation de proportionnalité est une droite passant par l’origine.", answer: "La situation n’est pas proportionnelle.", proof: `Pour x = 0, y = ${start} et non 0. Il existe une partie fixe : le modèle est affine mais pas proportionnel.`, reflex: "Sur un graphique, la proportionnalité impose une droite passant par l’origine." };
    }),

    template({ id: "prop-linear-deduction", levels: ["3e"], domain: "proportion", gesture: "logic", difficulty: 3 }, ({ rng }) => {
      const rate = int(rng, 2, 7);
      const x = int(rng, 3, 8);
      return { kicker: "Déduire d’une propriété", title: `On sait que f est une fonction linéaire et que f(1) = ${rate}. Sans tableau, que vaut f(${x}) ?`, subprompt: "Traduis « fonction linéaire » par sa forme générale.", choices: [`${rate + x}`, `${rate * x}`, `${rate ** x}`, `${rate}`], correctIndex: 1, hint: "Une fonction linéaire s’écrit f(x) = ax, et f(1) donne directement a.", answer: `f(${x}) = ${rate * x}.`, proof: `Comme f(x) = ax et f(1) = a = ${rate}, on a f(${x}) = ${rate} × ${x} = ${rate * x}.`, reflex: "Transformer un mot mathématique défini en une écriture exploitable." };
    }),

    template({ id: "code-trace", levels: LEVELS, domain: "computing", gesture: "logic", difficulty: 1 }, ({ rng }) => {
      const start = int(rng, 2, 9);
      const add = int(rng, 2, 6);
      const factor = int(rng, 2, 4);
      const result = (start + add) * factor;
      const candidates = new Set([result, start + add * factor, start * factor + add, start + add + factor, result - add, result + factor]);
      const values = Array.from(candidates).slice(0, 4);
      while (values.length < 4) values.push(result + values.length + 2);
      return { kicker: "Exécuter sans sauter d’étape", title: `Programme : choisir ${start} ; ajouter ${add} ; multiplier le résultat par ${factor}. Quel nombre est affiché ?`, subprompt: "Garde la valeur courante après chaque instruction.", code: [`x ← ${start}`, `x ← x + ${add}`, `x ← x × ${factor}`, "afficher x"], choices: shuffled(rng, values.map(String)), answerValue: String(result), hint: "La deuxième instruction modifie x ; la troisième utilise cette nouvelle valeur.", answer: `Le programme affiche ${result}.`, proof: `Après l’addition, x = ${start + add}. Puis ${start + add} × ${factor} = ${result}.`, reflex: "Dans une trace, écrire la nouvelle valeur de la variable après chaque instruction." };
    }),

    template({ id: "code-first-bug", levels: ["5e", "4e", "3e"], domain: "computing", gesture: "critique", difficulty: 2 }, ({ rng }) => {
      const factor = int(rng, 2, 5);
      const add = int(rng, 2, 7);
      return { kicker: "Trouver le premier test qui échoue", title: `On veut calculer « multiplier un nombre par ${factor}, puis ajouter ${add} ». Le programme calcule x ← ${factor}(x + ${add}). Quel est le problème ?`, subprompt: "Compare les deux expressions sur une valeur simple, puis corrige.", choices: [`Il faut écrire x ← ${factor}x + ${add}`, `Il faut écrire x ← x + ${factor + add}`, "Le programme est toujours équivalent", "Il faut supprimer x"], correctIndex: 0, hint: "Teste x = 0 : le programme voulu donne l’ajout seul.", answer: `La bonne affectation est x ← ${factor}x + ${add}.`, proof: `Le programme écrit développe en ${factor}x + ${factor * add}, il ajoute donc ${factor * add} au lieu de ${add}.`, reflex: "Pour comparer deux programmes, choisir une entrée discriminante puis expliquer l’écart algébriquement." };
    }),

    template({ id: "code-loop-invariant", levels: ["4e", "3e"], domain: "computing", gesture: "conjecture", difficulty: 3 }, ({ rng }) => {
      const step = pick(rng, [2, 3, 5]);
      const start = step * int(rng, 1, 4);
      return { kicker: "Ce qui reste vrai dans la boucle", title: `On part de ${start} et on répète : « ajouter ${step} ». Quelle propriété reste vraie à chaque tour ?`, subprompt: "Formule un invariant et explique pourquoi une itération le conserve.", choices: [`Le nombre reste un multiple de ${step}`, "Le nombre reste égal à sa valeur de départ", "Le nombre devient toujours pair", "Le nombre finit toujours par 0"], correctIndex: 0, hint: `Écris la valeur après n tours : ${start} + n × ${step}.`, answer: `La valeur reste un multiple de ${step}.`, proof: `${start} est un multiple de ${step}. Ajouter encore ${step}, lui-même multiple de ${step}, conserve cette propriété à chaque itération.`, reflex: "Un invariant est une propriété vraie au départ et préservée par chaque tour de boucle." };
    }),

    template({ id: "code-condition-boundary", levels: ["5e", "4e", "3e"], domain: "computing", gesture: "test", difficulty: 2 }, ({ rng }) => {
      const threshold = int(rng, 10, 20);
      return { kicker: "Tester les frontières", title: `Un programme doit afficher « admis » pour une note supérieure ou égale à ${threshold}. Il utilise la condition note > ${threshold}. Quel test révèle immédiatement le bug ?`, subprompt: "Choisis une entrée frontière, là où deux conditions presque identiques se séparent.", choices: [String(threshold - 1), String(threshold), String(threshold + 1), "0"], correctIndex: 1, hint: "Compare strictement supérieur et supérieur ou égal.", answer: `Tester note = ${threshold}.`, proof: `La règle attendue accepte ${threshold}, mais la condition note > ${threshold} le refuse. Il faut utiliser note ≥ ${threshold}.`, reflex: "Pour tester une condition, essayer juste avant, exactement sur, et juste après la frontière." };
    }),

    template({ id: "trans-useful-information", levels: LEVELS, domain: "transversal", gesture: "strategy", difficulty: 1 }, ({ rng }) => {
      const length = int(rng, 6, 14);
      const width = int(rng, 3, 8);
      const color = pick(rng, ["bleue", "rouge", "verte"]);
      return { kicker: "Trier avant de calculer", title: `Une salle rectangulaire mesure ${length} m sur ${width} m. Les murs sont ${color}s et la porte mesure 2 m. On veut l’aire du sol. Quelles données sont utiles ?`, subprompt: "Classe les informations : nécessaires, inutiles ou éventuellement utiles dans une autre question.", choices: [`${length} m et ${width} m`, `La couleur et ${length} m`, "La porte et la couleur", "Toutes les données"], correctIndex: 0, hint: "Écris la formule de la grandeur demandée avant de prendre les nombres.", answer: `Seules la longueur ${length} m et la largeur ${width} m sont nécessaires.`, proof: `L’aire du rectangle vaut ${length} × ${width} = ${length * width} m². La couleur et la largeur de porte ne figurent pas dans ce calcul.`, reflex: "Partir de la question et de la relation utile pour sélectionner les données." };
    }),

    template({ id: "trans-units-plausibility", levels: LEVELS, domain: "transversal", gesture: "reflect", difficulty: 1 }, ({ rng }) => {
      const cases = [
        { object: "la taille d’un élève", value: "165 m", correction: "165 cm ou 1,65 m", why: "165 m est l’ordre de grandeur d’un grand bâtiment." },
        { object: "l’aire d’une feuille A4", value: "624 cm", correction: "environ 624 cm²", why: "Une aire s’exprime avec une unité carrée." },
        { object: "la durée d’un trajet à pied jusqu’au collège", value: "12 kg", correction: "une unité de temps, par exemple 12 min", why: "Le kilogramme mesure une masse." },
        { object: "la contenance d’une bouteille", value: "1,5 km", correction: "environ 1,5 L", why: "Le kilomètre mesure une longueur." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Le résultat raconte-t-il quelque chose ?", title: `Un élève annonce pour ${item.object} : ${item.value}. Que vérifies-tu en premier ?`, subprompt: "Contrôle la grandeur, l’unité et l’ordre de grandeur.", choices: ["Seulement les chiffres", "L’unité et la plausibilité", "Le nombre de décimales", "Rien si la calculatrice l’affiche"], correctIndex: 1, hint: "Demande-toi ce que mesure l’unité écrite et compare à un objet connu.", answer: `Une réponse plausible serait ${item.correction}.`, proof: item.why, reflex: "Toute réponse numérique doit être relue avec sa grandeur, son unité et son ordre de grandeur." };
    }),

    template({ id: "trans-compare-strategies", levels: LEVELS, domain: "transversal", gesture: "strategy", difficulty: 2 }, ({ rng }) => {
      const total = pick(rng, [48, 60, 72, 84]);
      const fractionPart = pick(rng, [[1, 4], [1, 3], [3, 4], [2, 3]]);
      const [n, d] = fractionPart;
      return { kicker: "Plusieurs chemins, un choix argumenté", title: `Pour calculer ${n}/${d} de ${total}, quelle stratégie est la plus directe mentalement ?`, subprompt: "Une autre méthode peut être correcte ; défends celle qui réduit le risque d’erreur.", choices: [`Diviser ${total} par ${d}, puis multiplier par ${n}`, `Calculer ${n} ÷ ${d} avec beaucoup de décimales`, `Ajouter ${n} et ${d} à ${total}`, "Faire un produit en croix sans écrire de relation"], correctIndex: 0, hint: `${total} est divisible par ${d}.`, answer: `${total} ÷ ${d} × ${n} = ${total / d * n}.`, proof: "Le partage en d parts égales donne une part ; multiplier par n donne le nombre de parts demandées. La méthode suit le sens de la fraction.", reflex: "Une stratégie est bonne si elle est valide, compréhensible et adaptée aux nombres présents." };
    }),

    template({ id: "trans-plan-monitor-evaluate", levels: LEVELS, domain: "transversal", gesture: "reflect", difficulty: 2 }, ({ rng }) => {
      const phase = pick(rng, [
        { label: "avant", prompt: "Avant de commencer un problème, quelle question aide le plus ?", correct: "Qu’est-ce qui est demandé et quelles représentations pourraient aider ?", distractors: ["Combien de lignes aura ma réponse ?", "Quelle touche de calculatrice utiliser en premier ?", "Puis-je copier un nombre au hasard ?"], proof: "Planifier consiste à comprendre le but, mobiliser les connaissances et choisir un premier chemin." },
        { label: "pendant", prompt: "Pendant la résolution, quelle question aide le plus ?", correct: "Mon résultat intermédiaire est-il cohérent et ma stratégie avance-t-elle ?", distractors: ["Ai-je écrit assez petit ?", "Dois-je continuer exactement pareil quoi qu’il arrive ?", "Puis-je ignorer les unités ?"], proof: "Surveiller consiste à contrôler les étapes et changer de stratégie si elle ne produit rien." },
        { label: "après", prompt: "Après avoir obtenu un résultat, quelle question aide le plus ?", correct: "Répond-il à la question, est-il plausible et puis-je l’expliquer ?", distractors: ["Ai-je fini avant les autres ?", "Puis-je effacer toutes mes étapes ?", "La calculatrice a-t-elle beaucoup de chiffres ?"], proof: "Évaluer consiste à vérifier, interpréter et tirer un apprentissage de la démarche." }
      ]);
      const choices = shuffled(rng, [phase.correct, ...phase.distractors]);
      return { kicker: `Métacognition · ${phase.label}`, title: phase.prompt, subprompt: "Choisis la question qui pilote vraiment le raisonnement.", choices, correctIndex: choices.indexOf(phase.correct), hint: "La bonne question doit agir sur la compréhension, la stratégie ou le contrôle mathématique.", answer: phase.correct, proof: phase.proof, reflex: "Planifier avant, surveiller pendant, évaluer après : trois moments différents d’un même raisonnement." };
    }),

    template({ id: "trans-model-assumption", levels: ["5e", "4e", "3e"], domain: "transversal", gesture: "model", difficulty: 3 }, ({ rng }) => {
      const cases = [
        { situation: "prévoir la distance parcourue par un cycliste à partir de sa vitesse actuelle", assumption: "la vitesse reste constante", failure: "arrêts, pentes et variations de vitesse" },
        { situation: "prévoir la population d’une ville en prolongeant une hausse annuelle", assumption: "le même taux d’évolution se maintient", failure: "migrations, politiques ou évènements futurs" },
        { situation: "estimer le nombre de poissons d’un lac à partir d’un échantillon", assumption: "l’échantillon représente bien l’ensemble du lac", failure: "poissons regroupés dans certaines zones" }
      ];
      const item = pick(rng, cases);
      return { kicker: "Le modèle a un domaine de validité", title: `Pour ${item.situation}, quelle hypothèse faut-il annoncer ?`, subprompt: "Puis donne une raison pour laquelle le modèle pourrait s’écarter du réel.", openLabel: "Formule une hypothèse et une limite.", hint: "Demande-toi ce que le calcul suppose constant, régulier ou représentatif.", answer: `Hypothèse possible : ${item.assumption}.`, proof: `Le modèle pourrait être mis en défaut par ${item.failure}. Un modèle est utile sans être une copie parfaite du réel.`, reflex: "Modéliser, c’est simplifier explicitement puis confronter le résultat à la situation réelle." };
    }),

    template({ id: "trans-missing-data", levels: LEVELS, domain: "transversal", gesture: "critique", difficulty: 3 }, ({ rng }) => {
      const cases = [
        { question: "Un rectangle a un périmètre de 30 cm. Quelle est son aire ?", missing: "la longueur d’un côté ou une autre relation", examples: "1 cm × 14 cm et 5 cm × 10 cm ont le même périmètre, mais pas la même aire" },
        { question: "Une classe a obtenu une moyenne de 12. Combien d’élèves ont eu plus de 12 ?", missing: "la répartition des notes", examples: "des listes très différentes peuvent avoir la même moyenne" },
        { question: "Une voiture a parcouru 120 km. Combien de temps a duré le trajet ?", missing: "la vitesse moyenne ou une information équivalente", examples: "la même distance peut être parcourue à des vitesses différentes" }
      ];
      const item = pick(rng, cases);
      return { kicker: "Le problème est-il déterminé ?", title: item.question, subprompt: "Avant de calculer, décide si une réponse unique est possible.", choices: ["Oui, toutes les données nécessaires sont présentes", "Non, une information supplémentaire est nécessaire", "Oui, il suffit de diviser par 2", "Non, les mathématiques ne peuvent rien modéliser"], correctIndex: 1, hint: "Essaie de construire deux situations différentes qui respectent les données mais donnent des réponses différentes.", answer: `Il manque ${item.missing}.`, proof: `Contre-exemple d’unicité : ${item.examples}.`, reflex: "Pour montrer qu’une réponse n’est pas déterminée, construire deux cas compatibles donnant des résultats différents." };
    }),

    template({ id: "num-structure-classify", levels: LEVELS, domain: "numbers", gesture: "observe", difficulty: 1 }, ({ rng }) => {
      const cases = [
        { property: "paire", correct: "2n", choices: ["2n", "n + 1", "n²", "3n"], proof: "2n est, par définition, un multiple de 2 pour tout entier n." },
        { property: "impaire", correct: "2n + 1", choices: ["2n + 1", "n + 1", "3n", "n²"], proof: "2n + 1 est la forme générale d’un entier impair." },
        { property: "multiple de 5", correct: "5(n + 2)", choices: ["5(n + 2)", "5n + 2", "n + 5", "2(n + 5)"], proof: "5(n + 2) contient le facteur 5, quel que soit l’entier n." },
        { property: "multiple de 3", correct: "3n + 6", choices: ["3n + 6", "3n + 2", "6n + 1", "n + 3"], proof: "3n + 6 = 3(n + 2), donc l’expression possède toujours le facteur 3." }
      ];
      const item = pick(rng, cases);
      const choices = shuffled(rng, item.choices);
      return { kicker: "Repérer une structure sans calculer", title: `Pour n entier, quelle expression est toujours ${item.property} ?`, subprompt: "Cherche une forme ou un facteur visible qui garantit la propriété.", choices, correctIndex: choices.indexOf(item.correct), hint: "Factorise mentalement et compare avec la définition de la propriété demandée.", answer: `${item.correct} est toujours ${item.property}.`, proof: item.proof, reflex: "Une écriture algébrique peut rendre une propriété visible avant tout remplacement numérique." };
    }),

    template({ id: "geo-codings-observe", levels: LEVELS, domain: "geometry", gesture: "observe", difficulty: 1 }, ({ rng }) => {
      const cases = [
        { data: "Les segments [AB] et [AC] portent le même codage de longueur.", conclusion: "AB = AC", distractors: ["AB est parallèle à AC", "L’angle A est droit", "B est le milieu de [AC]"], proof: "Un même codage sur deux segments signifie que leurs longueurs sont égales." },
        { data: "Un petit carré code l’angle ABC.", conclusion: "L’angle ABC mesure 90°", distractors: ["AB = BC", "A, B et C sont alignés", "ABC est équilatéral"], proof: "Le petit carré est le codage conventionnel d’un angle droit." },
        { data: "I appartient à [AB] et les segments [AI] et [IB] portent le même codage.", conclusion: "I est le milieu de [AB]", distractors: ["(AI) est perpendiculaire à (IB)", "A est le milieu de [IB]", "AB = AI"], proof: "I est sur le segment et AI = IB : les deux conditions de la définition du milieu sont réunies." }
      ];
      const item = pick(rng, cases);
      const choices = shuffled(rng, [item.conclusion, ...item.distractors]);
      return { kicker: "Lire les données, pas l’allure", title: item.data, subprompt: "Quelle information est réellement donnée par le codage ?", choices, correctIndex: choices.indexOf(item.conclusion), hint: "Traduis chaque symbole conventionnel par une phrase mathématique exacte.", answer: `${item.conclusion}.`, proof: item.proof, reflex: "Commencer une preuve de géométrie en inventoriant les codages et les données écrites." };
    }),

    template({ id: "geo-symmetry-preserves-length", levels: LEVELS, domain: "geometry", gesture: "justify", difficulty: 3 }, ({ rng }) => {
      const length = int(rng, 3, 9);
      return { kicker: "Une preuve courte en géométrie", title: `C et D sont les symétriques de A et B par rapport à une même droite. On sait que AB = ${length} cm. Que vaut CD ?`, subprompt: "Donne le résultat, puis la propriété qui le garantit indépendamment du dessin.", choices: [`CD = ${length} cm`, `CD = ${length * 2} cm`, `CD = ${length + 2} cm`, "On ne peut rien conclure"], correctIndex: 0, hint: "Une symétrie axiale conserve les distances.", answer: `CD = ${length} cm.`, proof: "La symétrie axiale transforme A en C et B en D. Comme elle conserve les longueurs, l’image du segment [AB] a la même longueur : CD = AB.", reflex: "Dans une transformation, identifier les objets images puis citer l’invariant conservé." };
    }),

    template({ id: "num-odd-one-out", levels: LEVELS, domain: "numbers", gesture: "observe", difficulty: 1 }, ({ rng }) => {
      const cases = [
        { values: "12 · 18 · 24 · 25", reasons: "25 est le seul impair ; 18 est le seul multiple de 9 ; 24 est le seul multiple de 8 ; 12 est le seul diviseur de 24 parmi les trois autres nombres." },
        { values: "16 · 25 · 27 · 36", reasons: "27 est le seul impair qui n’est pas un carré ; 16 est le seul carré d’un multiple de 4 ; 25 est le seul qui se termine par 5 ; 36 est le seul multiple de 3 qui soit un carré." },
        { values: "0,25 · 1/2 · 50 % · 0,75", reasons: "0,75 est le seul supérieur à 1/2 ; 0,25 est le seul égal à 1/4 ; 1/2 est la seule écriture fractionnaire ; 50 % est la seule écriture en pourcentage." }
      ];
      const item = pick(rng, cases);
      return { kicker: "L’intrus n’est pas unique", title: `Choisis un intrus et défends ton choix : ${item.values}`, subprompt: "Une autre réponse peut être correcte si elle repose sur une propriété précise.", openLabel: "Choisis, puis complète : « C’est le seul qui… »", hint: "Observe parité, divisibilité, écriture, valeur ou relation avec les autres nombres.", answer: "Plusieurs choix sont recevables.", proof: item.reasons, reflex: "Classer oblige à nommer une propriété ; deux classements différents peuvent être simultanément valides." };
    }),

    template({ id: "alg-same-different", levels: ["5e", "4e", "3e"], domain: "algebra", gesture: "observe", difficulty: 2 }, ({ rng }) => {
      const a = int(rng, 2, 5);
      const b = int(rng, 2, 7);
      const cases = [
        { left: `${a}(x + ${b})`, right: `${a}x + ${a * b}`, correct: 0, answer: "Elles sont égales pour tout x.", proof: "La distributivité transforme exactement la première expression en la seconde." },
        { left: `${a}(x + ${b})`, right: `${a}x + ${b}`, correct: 2, answer: "Elles ne sont égales pour aucune valeur de x.", proof: `La différence constante vaut ${a * b} − ${b} = ${b * (a - 1)}, qui n’est pas nulle.` },
        { left: `${a}(x + ${b})`, right: `${a + b}x`, correct: 1, answer: `Elles sont égales seulement pour x = ${a}.`, proof: `${a}x + ${a * b} = ${a + b}x revient à ${a * b} = ${b}x, donc x = ${a}.` }
      ];
      const item = pick(rng, cases);
      return { kicker: "Même apparence ou même valeur ?", title: `Compare ${item.left} et ${item.right}.`, subprompt: "Sont-elles égales toujours, parfois ou jamais ?", choices: ["Toujours", "Pour une seule valeur de x", "Jamais"], correctIndex: item.correct, hint: "Développe si nécessaire, puis étudie la condition d’égalité.", answer: item.answer, proof: item.proof, reflex: "Distinguer une identité vraie pour tout x d’une égalité vraie seulement pour certaines valeurs." };
    }),

    template({ id: "num-create-example", levels: LEVELS, domain: "numbers", gesture: "test", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { task: "Trouve un entier compris entre 50 et 100, divisible par 6 mais pas par 12.", example: "54", verification: "54 = 6 × 9, tandis que 54 n’est pas un multiple de 12." },
        { task: "Trouve un nombre à trois chiffres divisible à la fois par 5 et par 9.", example: "135", verification: "135 se termine par 5 et la somme de ses chiffres vaut 9." },
        { task: "Trouve une fraction de dénominateur 8 strictement comprise entre 1/2 et 3/4.", example: "5/8", verification: "1/2 = 4/8 et 3/4 = 6/8, donc 4/8 < 5/8 < 6/8." },
        { task: "Trouve un entier négatif supérieur à −10 dont le carré est compris entre 20 et 40.", example: "−5 ou −6", verification: "(−5)² = 25 et (−6)² = 36 ; les deux conviennent." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Construire sous contraintes", title: item.task, subprompt: "La réponse doit satisfaire toutes les conditions en même temps.", openLabel: "Propose un exemple, puis vérifie chaque contrainte.", hint: "Traite d’abord la condition la plus restrictive, puis élimine les candidats qui échouent aux autres.", answer: `Exemple possible : ${item.example}.`, proof: item.verification, reflex: "Pour construire un exemple, croiser les contraintes puis les vérifier une par une." };
    }),

    template({ id: "trans-repair-statement", levels: ["4e", "3e"], domain: "transversal", gesture: "critique", difficulty: 3 }, ({ rng }) => {
      const cases = [
        { statement: "Tous les nombres premiers sont impairs.", repair: "Tous les nombres premiers sauf 2 sont impairs.", proof: "2 est le seul nombre premier pair." },
        { statement: "Si x² = 25, alors x = 5.", repair: "Si x² = 25, alors x = 5 ou x = −5.", proof: "Deux nombres opposés ont le même carré." },
        { statement: "Si un entier est pair, alors il est divisible par 4.", repair: "Si un entier est divisible par 4, alors il est pair.", proof: "La phrase initiale est réfutée par 6 ; la réciproque proposée est vraie." },
        { statement: "Multiplier deux nombres positifs donne un résultat plus grand que chacun d’eux.", repair: "L’affirmation devient vraie si les deux nombres sont strictement supérieurs à 1.", proof: "Le cas 0,5 × 2 réfute l’énoncé initial ; la condition ajoutée écarte 0, 1 et les facteurs compris entre 0 et 1." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Réparer plutôt que jeter", title: `Modifie le moins possible l’affirmation fausse : « ${item.statement} »`, subprompt: "Tu peux ajouter une condition, changer la conclusion ou prévoir une exception.", openLabel: "Écris une version qui soit vraie dans tous les cas.", hint: "Commence par trouver pourquoi la phrase est fausse ; le contre-exemple indique souvent la réparation.", answer: item.repair, proof: item.proof, reflex: "Un contre-exemple ne sert pas seulement à réfuter : il aide à préciser le domaine de validité." };
    }),

    template({ id: "geo-always-sometimes-never", levels: LEVELS, domain: "geometry", gesture: "conjecture", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { statement: "Les diagonales d’un rectangle ont la même longueur.", correct: 0, answer: "Toujours.", proof: "C’est une propriété de tous les rectangles." },
        { statement: "Les diagonales d’un quadrilatère ont la même longueur.", correct: 1, answer: "Parfois.", proof: "C’est vrai pour un rectangle, mais faux pour un parallélogramme quelconque." },
        { statement: "Un triangle possède deux angles droits.", correct: 2, answer: "Jamais.", proof: "Deux angles droits totaliseraient déjà 180°, sans laisser de mesure positive au troisième angle." },
        { statement: "Deux triangles de même aire sont superposables.", correct: 1, answer: "Parfois.", proof: "Deux triangles superposables ont la même aire, mais on peut construire des triangles de formes différentes ayant une même base et une même hauteur." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Toujours, parfois ou jamais ?", title: item.statement, subprompt: "Prépare la preuve adaptée : propriété, exemple et contre-exemple, ou impossibilité.", choices: ["Toujours", "Parfois", "Jamais"], correctIndex: item.correct, hint: "Essaie une figure familière, puis déforme-la en conservant seulement les données de l’énoncé.", answer: item.answer, proof: item.proof, reflex: "En géométrie aussi, « parfois » exige un exemple vrai et un exemple faux." };
    }),

    template({ id: "data-unsupported-claim", levels: ["5e", "4e", "3e"], domain: "data", gesture: "critique", difficulty: 3 }, ({ rng }) => {
      const cases = [
        { data: "Le pays A a 60 % de territoire boisé et le pays B 45 %.", claim: "Le pays A possède une plus grande aire de forêt.", missing: "l’aire totale de chaque pays", proof: "Un pourcentage plus élevé d’une petite superficie peut représenter moins d’hectares qu’un pourcentage plus faible d’une grande superficie." },
        { data: "La classe A a une moyenne de 14 et la classe B une moyenne de 12.", claim: "Chaque élève de A a une meilleure note que chaque élève de B.", missing: "la répartition des notes dans chaque classe", proof: "Les moyennes peuvent différer tout en ayant des valeurs individuelles qui se chevauchent." },
        { data: "70 % des personnes interrogées préfèrent l’option A.", claim: "70 % de toute la population préfère A.", missing: "la taille et le mode de sélection de l’échantillon", proof: "Un échantillon biaisé ou trop petit ne représente pas nécessairement la population." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Que permettent réellement les données ?", title: `${item.data} Peut-on conclure : « ${item.claim} » ?`, subprompt: "Ne décide pas si la phrase est vraie dans le monde ; décide si elle est prouvée par les données fournies.", choices: ["Oui, la conclusion est prouvée", "Non, une information essentielle manque", "Oui, parce que le premier nombre est plus grand", "Non, aucune donnée ne permet jamais de conclure"], correctIndex: 1, hint: "Imagine deux situations différentes donnant les mêmes nombres affichés.", answer: `Non. Il manque ${item.missing}.`, proof: item.proof, reflex: "Distinguer une affirmation vraie d’une affirmation soutenue par les données disponibles." };
    }),

    template({ id: "data-mean-not-observed", levels: ["5e", "4e", "3e"], domain: "data", gesture: "test", difficulty: 3 }, ({ rng }) => {
      const cases = [
        { context: "Une équipe gagne ses matchs avec un écart moyen de 19 points.", question: "Est-il possible qu’aucun match n’ait été gagné avec exactement 19 points d’écart ?", example: "Des écarts de 18 et 20 ont une moyenne de 19, sans contenir 19." },
        { context: "La taille moyenne de quatre élèves est 160 cm.", question: "Est-il possible qu’aucun élève ne mesure exactement 160 cm ?", example: "158, 159, 161 et 162 ont une moyenne de 160, sans contenir 160." },
        { context: "La moyenne de trois notes est 12.", question: "Est-il possible qu’aucune des trois notes ne soit 12 ?", example: "10, 11 et 15 ont une moyenne de 12, sans contenir 12." }
      ];
      const item = pick(rng, cases);
      return { kicker: "La moyenne est-elle une valeur observée ?", title: `${item.context} ${item.question}`, subprompt: "Un exemple bien construit suffit à établir que c’est possible.", choices: ["Oui, c’est possible", "Non, la moyenne doit apparaitre dans la série"], correctIndex: 0, hint: "Choisis des valeurs placées de part et d’autre de la moyenne.", answer: "Oui, c’est possible.", proof: item.example, reflex: "La moyenne équilibre les écarts ; elle n’est pas obligatoirement une valeur de la série." };
    }),

    template({ id: "prop-calculation-to-story", levels: LEVELS, domain: "proportion", gesture: "model", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { calculation: "84 ÷ 7 × 3 = 36", correct: "Calculer 3/7 de 84", distractors: ["Augmenter 84 de 7 %", "Partager 84 entre 3 personnes", "Calculer 7/3 de 84"], proof: "Diviser par 7 donne une septième part, puis multiplier par 3 en prend trois." },
        { calculation: "120 × 0,8 = 96", correct: "Réduire 120 de 20 %", distractors: ["Augmenter 120 de 80 %", "Calculer 8 % de 120", "Partager 120 en 8 parts"], proof: "Conserver 80 % revient à multiplier par 0,8 ; c’est donc retirer 20 %." },
        { calculation: "45 ÷ 5 × 8 = 72", correct: "Trouver le prix de 8 objets quand 5 coûtent 45 €", distractors: ["Réduire 45 € de 5 %", "Partager 45 objets entre 8 personnes", "Ajouter 8 € à 45 €"], proof: "45 ÷ 5 donne le prix unitaire, puis × 8 donne le prix de huit objets." }
      ];
      const item = pick(rng, cases);
      const choices = shuffled(rng, [item.correct, ...item.distractors]);
      return { kicker: "Du calcul à la situation", title: `Quelle question peut être résolue par ${item.calculation} ?`, subprompt: "Interprète le rôle de chaque opération, dans l’ordre.", choices, correctIndex: choices.indexOf(item.correct), hint: "Traduis d’abord la division : partage, valeur d’une part ou passage à l’unité ?", answer: item.correct, proof: item.proof, reflex: "Modéliser, c’est pouvoir expliquer ce que représente chaque nombre et chaque opération." };
    }),

    template({ id: "trans-withheld-information", levels: LEVELS, domain: "transversal", gesture: "strategy", difficulty: 2 }, ({ rng }) => {
      const cases = [
        { question: "Déterminer l’aire d’un rectangle dont le périmètre vaut 30 cm.", useful: "La longueur d’un côté", distractors: ["La couleur du rectangle", "La longueur de sa diagonale dessinée sans échelle", "Le nom de ses sommets"], proof: "Le périmètre seul ne fixe pas l’aire ; connaitre un côté permet de trouver l’autre." },
        { question: "Calculer la probabilité de tirer une boule rouge dans une urne.", useful: "Le nombre de boules rouges et le nombre total de boules", distractors: ["La matière de l’urne", "L’ordre dans lequel les boules ont été placées", "La couleur de la table"], proof: "Dans un tirage équiprobable, la probabilité est le quotient du nombre de cas favorables par le nombre total de cas." },
        { question: "Trouver le prix de 9 cahiers dans une situation proportionnelle.", useful: "Le prix d’un cahier ou le prix d’un autre nombre connu de cahiers", distractors: ["La couleur des cahiers", "Le jour de la semaine", "Le nombre de pages du manuel voisin"], proof: "Il faut une paire quantité-prix permettant de déterminer le coefficient de proportionnalité." }
      ];
      const item = pick(rng, cases);
      const choices = shuffled(rng, [item.useful, ...item.distractors]);
      return { kicker: "Information volontairement cachée", title: item.question, subprompt: "Quelle carte d’information faut-il retourner en priorité ?", choices, correctIndex: choices.indexOf(item.useful), hint: "Écris la relation mathématique nécessaire et cherche la grandeur encore inconnue.", answer: item.useful, proof: item.proof, reflex: "Retarder les données oblige à identifier ce dont la méthode a réellement besoin." };
    }),

    template({ id: "trans-convince-sceptic", levels: LEVELS, domain: "transversal", gesture: "justify", difficulty: 3 }, ({ rng }) => {
      const cases = [
        { claim: "Deux rectangles peuvent avoir le même périmètre et des aires différentes.", proof: "Un rectangle 1 × 5 et un rectangle 2 × 4 ont tous deux un périmètre de 12, mais des aires de 5 et 8." },
        { claim: "25 % de 80 donne le même résultat que 80 % de 25.", proof: "25 % de 80 = 0,25 × 80 = 20 et 80 % de 25 = 0,8 × 25 = 20. Plus généralement, a % de b et b % de a valent tous deux ab/100." },
        { claim: "Une fraction ayant un plus grand dénominateur peut être plus petite.", proof: "Pour les fractions unitaires, 1/8 < 1/6 : partager la même unité en davantage de parts donne des parts plus petites." },
        { claim: "Un résultat affiché par une calculatrice peut être faux pour le problème.", proof: "La calculatrice exécute les touches saisies ; une mauvaise opération, une unité oubliée ou un modèle inadapté peut produire un nombre exact mais une réponse fausse." }
      ];
      const item = pick(rng, cases);
      return { kicker: "Convaincs une personne sceptique", title: `Construis un argument pour la convaincre que : « ${item.claim} »`, subprompt: "Un bon argument doit pouvoir être vérifié par quelqu’un qui n’est pas déjà d’accord.", openLabel: "Donne une preuve, un exemple décisif ou une explication générale.", hint: "Demande-toi si un exemple suffit ici ou s’il faut expliquer pourquoi cela reste vrai en général.", answer: "Argument possible", proof: item.proof, reflex: "Convaincre, ce n’est pas répéter la conclusion : c’est fournir une raison contrôlable." };
    }),

    template({ id: "code-compare-programs", levels: ["5e", "4e", "3e"], domain: "computing", gesture: "critique", difficulty: 3 }, ({ rng }) => {
      const a = int(rng, 2, 5);
      const b = int(rng, 2, 6);
      const equivalent = rng() > 0.45;
      const first = `ajouter ${b}, puis multiplier par ${a}`;
      const second = equivalent ? `multiplier par ${a}, puis ajouter ${a * b}` : `multiplier par ${a}, puis ajouter ${b}`;
      return { kicker: "Deux programmes, même effet ?", title: `Programme A : ${first}. Programme B : ${second}. Donnent-ils toujours le même résultat ?`, subprompt: "Teste une entrée simple, puis explique avec une expression.", choices: ["Oui, pour toute entrée", "Non, pas pour toute entrée"], correctIndex: equivalent ? 0 : 1, hint: "Avec une entrée x, traduis les deux programmes en expressions littérales.", answer: equivalent ? "Oui, ils sont équivalents." : "Non, ils ne sont pas équivalents.", proof: equivalent ? `Le programme A donne ${a}(x + ${b}) = ${a}x + ${a * b}, exactement comme B.` : `A donne ${a}x + ${a * b}, tandis que B donne ${a}x + ${b}. Comme ${a * b} ≠ ${b}, ils diffèrent pour toute entrée.`, reflex: "Un test peut réfuter l’équivalence ; une identité algébrique permet de la prouver pour toutes les entrées." };
    }),

    template({ id: "prop-connect-representations", levels: ["5e", "4e", "3e"], domain: "proportion", gesture: "logic", difficulty: 2 }, ({ rng }) => {
      const rate = int(rng, 2, 5);
      const fixed = int(rng, 1, 6);
      const proportional = rng() > 0.5;
      const formula = proportional ? `y = ${rate}x` : `y = ${rate}x + ${fixed}`;
      const correct = proportional
        ? `Une quantité y est toujours ${rate} fois la quantité x.`
        : `On paie ${fixed} € fixes puis ${rate} € par unité.`;
      const distractors = proportional
        ? [`On ajoute ${rate} à x.`, `On paie ${rate} € fixes, quel que soit x.`, `y diminue quand x augmente.`]
        : [`Une quantité y est toujours ${rate + fixed} fois x.`, `On paie seulement ${fixed} €, quel que soit x.`, `La situation est proportionnelle.`];
      const choices = shuffled(rng, [correct, ...distractors]);
      return { kicker: "Relier deux représentations", title: `Quelle situation est décrite par la formule ${formula} ?`, subprompt: "Fais correspondre chaque terme de la formule à une information de la situation.", choices, correctIndex: choices.indexOf(correct), hint: "Calcule y lorsque x = 0 : cela révèle une éventuelle partie fixe.", answer: correct, proof: proportional ? `Le coefficient ${rate} multiplie x et la formule donne 0 lorsque x = 0.` : `${rate}x dépend du nombre d’unités ; ${fixed} reste présent même lorsque x = 0.`, reflex: "Relier formule, tableau, graphique et récit en interprétant les invariants de chaque représentation." };
    })
  ];

  // Fix the few question types whose answer position is generated dynamically.
  templates.forEach((entry) => {
    const original = entry.generate;
    entry.generate = (context) => {
      const question = original(context);
      if (question.answerValue && question.choices) question.correctIndex = question.choices.indexOf(question.answerValue);
      if (question.steps && !question.sequence) {
        question.sequence = shuffled(context.rng, question.steps);
        question.correctSequence = question.steps;
      }
      return question;
    };
  });

  window.MATHSGO_REASONING_BANKS = Object.freeze({
    schemaVersion: 1,
    generatorVersion: "0.2.0",
    levels: LEVELS,
    domains,
    gestures,
    templates
  });
}());
