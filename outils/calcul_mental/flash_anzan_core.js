// Flash Anzan — le moteur (lot 1, 22/10/2026).
//
// Tout ce qui se calcule sans écran vit ici, pour être testé avec node --test :
// les bornes des réglages, le tirage des calculs, le calendrier d'affichage du
// Flash et les textes qui résument une séance. La page ne fait que dessiner.
//
// Le tirage est déterministe à graine donnée (mulberry32, comme Défi calcul et
// SPLAT!) : les tests rejouent des milliers de séances.
(function initFlashAnzanCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_FLASH_ANZAN_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // ---------------------------------------------------------------------
  // Les réglages
  // ---------------------------------------------------------------------
  const MODES = Object.freeze(["flash", "colonne"]);
  const BORNES = Object.freeze({
    chiffres: Object.freeze({min: 1, max: 5}),
    nombres: Object.freeze({min: 2, max: 30})
  });
  const CALCULS = Object.freeze([5, 10, 20]);
  // Temps par nombre, en dixièmes de seconde : de 0,1 s à 2 s par pas de
  // 0,1 s, puis de 2,5 s à 5 s par pas de 0,5 s.
  const TEMPS = Object.freeze([
    ...Array.from({length: 20}, (_, i) => i + 1),
    25, 30, 35, 40, 45, 50
  ]);
  // Temps limite du mode Colonne, en secondes ; 0 = sans limite.
  const LIMITES = Object.freeze([0, 10, 15, 20, 30, 45, 60]);
  const SONS = Object.freeze(["aucun", "bip"]);
  const OPERATIONS = Object.freeze(["plus", "plusmoins"]);

  // Les valeurs de départ sont celles des maquettes validées le 22/10/2026.
  const DEFAUTS = Object.freeze({
    flash: Object.freeze({operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, temps: 8, calculs: 10, son: "bip"}),
    colonne: Object.freeze({operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, limite: 0, calculs: 10})
  });

  // ---------------------------------------------------------------------
  // Les grades (lot « grades », 07/11/2026)
  // ---------------------------------------------------------------------
  // La grille officielle de l'Association japonaise du test de Flash Anzan
  // (一般社団法人日本フラッシュ暗算検定協会, https://www.flash-anzan.jp/school/),
  // du 20e kyu au 20e dan : le nombre de chiffres, le nombre de nombres et le
  // temps de TOUTE la série, en dixièmes de seconde (pas le temps par nombre).
  // Chaque grade = 10 calculs ; réussi à 7 justes sur 10 (« 10問中7題以上の
  // 正解で合格 »), « presque » à 5 ou 6 (準合格). Additions seulement.
  // Le numéro d'un grade va de 1 (20e kyu) à 40 (20e dan).
  const GRADES = Object.freeze([
    [1, 3, 50], [1, 3, 50], [1, 5, 70], [1, 8, 100], [1, 10, 120], [1, 12, 150], [1, 15, 150], [1, 20, 150], [2, 10, 100], [2, 15, 150],
    [2, 2, 40], [2, 3, 60], [2, 4, 70], [2, 5, 80], [2, 6, 90], [2, 7, 100], [2, 8, 110], [2, 10, 120], [2, 12, 120], [2, 15, 130],
    [2, 15, 100], [3, 4, 40], [3, 6, 50], [3, 8, 60], [3, 10, 70], [3, 12, 80], [3, 15, 80], [3, 15, 60], [3, 15, 45], [3, 15, 30],
    [3, 15, 28], [3, 15, 26], [3, 15, 24], [3, 15, 22], [3, 15, 20], [3, 15, 19], [3, 15, 18], [3, 15, 17], [3, 15, 16], [3, 15, 15]
  ].map(([chiffres, nombres, dixiemes]) => Object.freeze({chiffres, nombres, dixiemes})));
  const NB_GRADES = GRADES.length;
  const GRADE_CALCULS = 10;
  const GRADE_REUSSI = 7;
  const GRADE_PRESQUE = 5;
  // Les quatre groupes de l'écran des grades (le premier numéro de chacun).
  const GROUPES_GRADES = Object.freeze([
    Object.freeze({nom: "Débutant", debut: 1}),
    Object.freeze({nom: "Intermédiaire", debut: 11}),
    Object.freeze({nom: "Avancé", debut: 21}),
    Object.freeze({nom: "Expert", debut: 31})
  ]);

  const gradeValide = n => Number.isInteger(n) && n >= 1 && n <= NB_GRADES;

  // « 20e kyu », « 1er kyu », « 1er dan », « 20e dan ».
  function nomGrade(n) {
    if (!gradeValide(n)) return "";
    if (n <= 20) { const k = 21 - n; return `${k}${k === 1 ? "er" : "e"} kyu`; }
    const d = n - 20;
    return `${d}${d === 1 ? "er" : "e"} dan`;
  }

  // Les réglages d'un grade, au format d'une séance : additions, un seul
  // nombre de chiffres, 10 calculs ; `grade` est son numéro ; le temps par
  // nombre est en millisecondes (pas forcément un nombre rond : 5 s pour
  // 3 nombres, c'est 1 666,7 ms) ; `son` est celui des réglages du Flash.
  function reglagesGrade(n, son) {
    if (!gradeValide(n)) return null;
    const g = GRADES[n - 1];
    return {
      operations: "plus",
      chiffresMin: g.chiffres,
      chiffresMax: g.chiffres,
      nombres: g.nombres,
      calculs: GRADE_CALCULS,
      grade: n,
      tempsMs: g.dixiemes * 100 / g.nombres,
      son: SONS.includes(son) ? son : "bip"
    };
  }

  // Le verdict d'un passage : « reussi » (7 ou plus sur 10), « presque »
  // (5 ou 6), « pasencore » (4 ou moins) ; « arrete » s'il manque des calculs.
  function verdictGrade(faits, score) {
    if (faits < GRADE_CALCULS) return "arrete";
    if (score >= GRADE_REUSSI) return "reussi";
    if (score >= GRADE_PRESQUE) return "presque";
    return "pasencore";
  }

  // « 20 nombres d'un chiffre · 15 s en tout »
  function texteGrade(n) {
    if (!gradeValide(n)) return "";
    const g = GRADES[n - 1];
    const chiffres = g.chiffres === 1 ? "d’un chiffre" : `de ${g.chiffres} chiffres`;
    return `${g.nombres} nombres ${chiffres} · ${secondes(g.dixiemes / 10)} en tout`;
  }

  // ---------------------------------------------------------------------
  // Les cartes des grades (lot « anzan-cartes », 07/11/2026)
  // ---------------------------------------------------------------------
  // Une carte par kyu, du 20e au 1er : une créature japonaise (les images de
  // Gwenaël, toutes dans un même cadre, dans ./anzan-cartes/), et au dos la
  // créature, un message et un proverbe. Textes et images se refont depuis
  // _sources/anzan-cartes/ (generer_textes.py écrit les lignes ci-dessous).
  // Les dan n'ont pas encore leur série : un dan réussi montre une carte
  // simple « 🥋 1er dan ».
  // Rien de nouveau n'est enregistré : une carte est gagnée quand son grade
  // est réussi (gradeReussi du parcours).
  const DOSSIER_CARTES = "./anzan-cartes/";
  const carte = c => Object.freeze({...c, proverbe: Object.freeze(c.proverbe),
    image: `${DOSSIER_CARTES}${c.image}.webp`, vignette: `${DOSSIER_CARTES}${c.image}-vignette.webp`});
  const CARTES_KYU = Object.freeze([
    carte({kyu: 20, nom: "Kaeru", sens: "la grenouille", image: "kyu20-kaeru",
      creature: "La grenouille (kaeru) est un porte-bonheur au Japon\u00a0: son nom se prononce comme «\u00a0revenir\u00a0» (帰る), et on l’offre pour qu’un voyageur revienne sain et sauf. Ayame (iris).",
      message: "Bravo pour ton 20e\u00a0Kyu\u00a0! C’est ton tout premier grade\u00a0: comme la petite grenouille, tu as fait ton premier saut. Le voyage commence\u00a0!",
      proverbe: {japonais: "案ずるより産むが易し", lecture: "anzuru yori umu ga yasushi", francais: "Agir est plus facile que s’inquiéter.", idee: "Ose\u00a0: c’est moins dur que tu ne le crois."}}),
    carte({kyu: 19, nom: "Usagi", sens: "le lapin", image: "kyu19-usagi",
      creature: "Au Japon, on ne voit pas un visage dans la Lune, mais un lapin (tsuki no usagi) qui prépare des gâteaux de riz. À la fête de la lune (Tsukimi), on dispose des herbes susuki et des dango.",
      message: "Félicitations pour ton 19e\u00a0Kyu\u00a0! Tu bondis de grade en grade comme le lapin de la Lune. Garde ce bel élan\u00a0!",
      proverbe: {japonais: "好きこそ物の上手なれ", lecture: "suki koso mono no jōzu nare", francais: "On devient habile dans ce qu’on aime.", idee: ""}}),
    carte({kyu: 18, nom: "Suzume", sens: "le moineau", image: "kyu18-suzume",
      creature: "Le moineau (suzume) vit tout près des humains, dans les villages et les rizières. Petit mais vif, il ramasse les grains un à un. Inaho (épi de riz), tanada (rizières en terrasses).",
      message: "Bravo pour ton 18e\u00a0Kyu\u00a0! Comme le moineau qui ramasse ses grains un à un, tu additionnes tes progrès.",
      proverbe: {japonais: "塵も積もれば山となる", lecture: "chiri mo tsumoreba yama to naru", francais: "Même la poussière, en s’accumulant, devient montagne.", idee: ""}}),
    carte({kyu: 17, nom: "Tombo", sens: "la libellule", image: "kyu17-tombo",
      creature: "La libellule (tombo) ne vole jamais en arrière\u00a0: les samouraïs l’appelaient kachimushi, «\u00a0l’insecte de la victoire\u00a0». La libellule rouge (akatombo) annonce l’automne.",
      message: "Félicitations pour ton 17e\u00a0Kyu\u00a0! Comme la libellule, tu vas toujours de l’avant. Rien ne t’arrête\u00a0!",
      proverbe: {japonais: "為せば成る", lecture: "naseba naru", francais: "Quand on s’y met, on y arrive.", idee: ""}}),
    carte({kyu: 16, nom: "Kame", sens: "la tortue", image: "kyu16-kame",
      creature: "Au Japon, la tortue (kame) est le symbole de la longue vie et de la patience. Matsu (pin toujours vert), seigaiha (motif de vagues).",
      message: "Bravo pour ton 16e\u00a0Kyu\u00a0! Pas à pas, comme la tortue, tu avances sûrement. Ta patience te mène loin.",
      proverbe: {japonais: "雨垂れ石を穿つ", lecture: "amadare ishi o ugatsu", francais: "Les gouttes de pluie finissent par creuser la pierre.", idee: ""}}),
    carte({kyu: 15, nom: "Akabeko", sens: "la vache rouge", image: "kyu15-akabeko",
      creature: "L’akabeko est une petite vache rouge en papier mâché de la région d’Aizu (Fukushima)\u00a0: sa tête hoche au moindre souffle. Selon la légende, une vache rouge aida à bâtir un temple. On dit qu’elle porte bonheur et protège les enfants. Ume (prunier en fleur).",
      message: "Félicitations pour ton 15e\u00a0Kyu\u00a0! Comme l’akabeko qui hoche la tête, tu dis «\u00a0oui\u00a0» à chaque nouveau défi\u00a0!",
      proverbe: {japonais: "笑う門には福来る", lecture: "warau kado ni wa fuku kitaru", francais: "Le bonheur entre dans la maison où l’on rit.", idee: ""}}),
    carte({kyu: 14, nom: "Shika", sens: "le cerf", image: "kyu14-shika",
      creature: "À Nara, les cerfs (shika) se promènent en liberté\u00a0: on les dit messagers des dieux, et certains saluent d’un signe de tête. Tōrō (lanterne de pierre), fuji (glycine).",
      message: "Bravo pour ton 14e\u00a0Kyu\u00a0! Tu progresses avec calme et élégance, comme le cerf de Nara.",
      proverbe: {japonais: "実るほど頭を垂れる稲穂かな", lecture: "minoru hodo kōbe o tareru inaho kana", francais: "Plus l’épi de riz est mûr, plus il baisse la tête.", idee: "Plus on sait, plus on reste modeste."}}),
    carte({kyu: 13, nom: "Inoshishi", sens: "le sanglier", image: "kyu13-inoshishi",
      creature: "Le sanglier (inoshishi) est l’un des douze animaux du zodiaque japonais\u00a0: il fonce droit devant, plein de courage. Sugi (cèdre du Japon).",
      message: "Félicitations pour ton 13e\u00a0Kyu\u00a0! Avec le courage du sanglier, tu fonces vers chaque défi. Et quand tu te trompes, tu repars encore plus fort\u00a0!",
      proverbe: {japonais: "失敗は成功のもと", lecture: "shippai wa seikō no moto", francais: "L’erreur est la source de la réussite.", idee: ""}}),
    carte({kyu: 12, nom: "Yatagarasu", sens: "le corbeau à trois pattes", image: "kyu12-yatagarasu",
      creature: "Le Yatagarasu est un corbeau à trois pattes, messager du soleil. La légende raconte qu’il guida un empereur à travers les montagnes de Kumano\u00a0: il est le guide de ceux qui cherchent leur chemin. Unkai (mer de nuages).",
      message: "Bravo pour ton 12e\u00a0Kyu\u00a0! Comme le Yatagarasu, tu as trouvé ton chemin. Le grade suivant t’ouvre la porte des créatures de légende\u00a0!",
      proverbe: {japonais: "習うより慣れよ", lecture: "narau yori nareyo", francais: "S’exercer vaut mieux qu’écouter des leçons.", idee: "C’est en pratiquant qu’on progresse."}}),
    carte({kyu: 11, nom: "Kitsune", sens: "le renard", image: "kyu11-kitsune",
      creature: "Le Kitsune est un renard du folklore japonais, symbole d’intelligence, de curiosité et d’astuce bienveillante. Sakura (cerisiers), torii (porte d’entrée d’un sanctuaire), kumo (nuage).",
      message: "Félicitations pour ton 11e\u00a0Kyu\u00a0! Tel un jeune Kitsune, tu as exploré avec brio le monde du soroban. Cultive ta curiosité et ta joie d’apprendre\u00a0!",
      proverbe: {japonais: "千里の道も一歩から", lecture: "senri no michi mo ippo kara", francais: "Même un chemin de mille lieues commence par un pas.", idee: ""}}),
    carte({kyu: 10, nom: "Tanuki", sens: "", image: "kyu10-tanuki",
      creature: "Le Tanuki symbolise la bonne humeur, la chance et surtout la persévérance tranquille\u00a0: avancer régulièrement, pas après pas. Take (bambou), tōrō (lanterne de pierre), hasu (lotus).",
      message: "Bravo pour ton 10e\u00a0Kyu\u00a0! Comme le Tanuki qui trouve son chemin, tu as posé des bases solides. Ta patience est ta meilleure alliée.",
      proverbe: {japonais: "石の上にも三年", lecture: "ishi no ue ni mo san nen", francais: "Assis trois ans sur une pierre, on finit par la réchauffer.", idee: "La patience paie."}}),
    carte({kyu: 9, nom: "Maneki-neko", sens: "le chat", image: "kyu09-maneki-neko",
      creature: "Le maneki-neko «\u00a0invite\u00a0» la chance de sa patte levée\u00a0; il symbolise l’agilité et la précision. La poupée daruma n’est pas fâchée\u00a0: on colorie un œil pour se fixer un objectif, puis le second quand on l’a atteint. Elle se redresse toujours quand on la pousse\u00a0: c’est la persévérance.",
      message: "Félicitations pour ton 9e\u00a0Kyu\u00a0! Ton agilité féline est remarquable. Continue de «\u00a0chasser\u00a0» les bonnes réponses avec précision\u00a0!",
      proverbe: {japonais: "継続は力なり", lecture: "keizoku wa chikara nari", francais: "La régularité fait la force.", idee: ""}}),
    carte({kyu: 8, nom: "Koinobori", sens: "la carpe koï", image: "kyu08-koinobori",
      creature: "Les koinobori, des manches à air en forme de carpe, flottent au vent pour le 5\u00a0mai, la fête des enfants au Japon (Kodomo no Hi). La carpe koï remonte le courant et franchit les obstacles\u00a0: elle symbolise la persévérance et la réussite. Momiji (feuilles d’érable), taikobashi (pont en arc).",
      message: "Bravo pour ton 8e\u00a0Kyu\u00a0! Tel un koinobori qui remonte le courant, tu montres une force et une persévérance admirables. Continue ta belle ascension\u00a0!",
      proverbe: {japonais: "七転び八起き", lecture: "nana korobi ya oki", francais: "Tomber sept fois, se relever huit.", idee: ""}}),
    carte({kyu: 7, nom: "Fukurō", sens: "le hibou", image: "kyu07-fukuro",
      creature: "Le fukurō (hibou) est associé à la sagesse et, par un jeu de mots avec fuku (la chance), à la bonne fortune. Son regard perçant évoque l’attention aux détails.",
      message: "Félicitations pour ton 7e\u00a0Kyu\u00a0! Ton esprit est vif et ton attention aux détails est digne du sage Fukurō. La précision est ta force.",
      proverbe: {japonais: "急がば回れ", lecture: "isogaba maware", francais: "Si tu es pressé, prends le détour.", idee: "Mieux vaut faire juste que vite."}}),
    carte({kyu: 6, nom: "Tsuru", sens: "la grue", image: "kyu06-tsuru",
      creature: "La grue (tsuru) est au Japon un symbole de longévité, de fidélité et d’élégance. La tradition des mille grues en origami (senbazuru) célèbre la patience et l’espérance.",
      message: "Bravo pour ton 6e\u00a0Kyu\u00a0! Tes gestes sont désormais aussi élégants que le vol de la grue. Ta maîtrise s’envole vers de nouveaux sommets\u00a0!",
      proverbe: {japonais: "鶴は千年、亀は万年", lecture: "tsuru wa sen nen, kame wa man nen", francais: "La grue vit mille ans, la tortue dix mille.", idee: "Longue vie à toi\u00a0!"}}),
    carte({kyu: 5, nom: "Ryū", sens: "le dragon", image: "kyu05-ryu",
      creature: "Le Ryū est le dragon japonais, gardien des pluies et des eaux. Il incarne une puissance bienveillante et la sagesse.",
      message: "Félicitations pour ton 5e\u00a0Kyu\u00a0! La force du Ryū est en toi\u00a0: tes calculs sont aussi vifs que l’envol du dragon dans les nuages.",
      proverbe: {japonais: "雲の上はいつも青空", lecture: "kumo no ue wa itsumo aozora", francais: "Au-dessus des nuages, le ciel est toujours bleu.", idee: "Après l’effort, la clarté\u00a0: persévère et tout s’éclaire."}}),
    carte({kyu: 4, nom: "Hō-ō", sens: "le phénix", image: "kyu04-ho-o",
      creature: "Le Hō-ō est l’oiseau de feu des légendes japonaises\u00a0: il n’apparaît qu’aux temps de paix et de prospérité. Il symbolise l’harmonie, le renouveau et la vertu. Il ne se pose que sur le kiri (paulownia).",
      message: "Bravo pour ton 4e\u00a0Kyu\u00a0! Comme le majestueux Hō-ō, tu te surpasses à chaque défi. Chaque nouveau départ te fait grandir.",
      proverbe: {japonais: "雨降って地固まる", lecture: "ame futte ji katamaru", francais: "Après la pluie, la terre se durcit.", idee: "Les épreuves te rendent plus solide."}}),
    carte({kyu: 3, nom: "Baku", sens: "", image: "kyu03-baku",
      creature: "Le Baku est une créature bienveillante du folklore\u00a0: il mange les mauvais rêves et aide à garder l’esprit clair. Sur la plaque\u00a0: 夢 (yume), «\u00a0rêve\u00a0».",
      message: "Félicitations pour ton 3e\u00a0Kyu\u00a0! Tel le Baku qui chasse les doutes, ta concentration est inébranlable. Ton esprit reste calme et précis.",
      proverbe: {japonais: "初心忘るべからず", lecture: "shoshin wasuru bekarazu", francais: "N’oublie jamais l’esprit du débutant.", idee: ""}}),
    carte({kyu: 2, nom: "Shisa", sens: "", image: "kyu02-shisa",
      creature: "Les Shisa, mi-lions mi-chiens, protègent les maisons d’Okinawa. Celui qui a la bouche ouverte chasse les mauvais esprits\u00a0; celui qui a la bouche fermée garde la chance à l’intérieur. Ils symbolisent la protection, la force tranquille et la vigilance.",
      message: "Bravo pour ton 2e\u00a0Kyu\u00a0! Tel le puissant Shisa, tu protèges ton savoir avec force et détermination. Ta maîtrise inspire confiance.",
      proverbe: {japonais: "備えあれば憂いなし", lecture: "sonae areba urei nashi", francais: "Quand on est préparé, on n’a pas d’inquiétude.", idee: ""}}),
    carte({kyu: 1, nom: "Kirin", sens: "", image: "kyu01-kirin",
      creature: "Le Kirin est une créature bienveillante qui n’apparaît qu’aux temps de paix et de justice. Il incarne l’excellence, la pureté et la sagesse.",
      message: "Félicitations pour ton 1er\u00a0Kyu\u00a0! Tu as atteint l’excellence\u00a0: tel le noble Kirin, ta maîtrise et ta sagesse inspirent tous ceux qui t’entourent.",
      proverbe: {japonais: "温故知新", lecture: "onko chishin", francais: "Étudie l’ancien pour découvrir le nouveau.", idee: ""}})
  ]);
  // La carte du grade n (1 = 20e kyu … 20 = 1er kyu), ou null (un dan).
  function carteDuGrade(n) {
    return Number.isInteger(n) && n >= 1 && n <= CARTES_KYU.length ? CARTES_KYU[n - 1] : null;
  }

  const entier = (valeur, defaut) => (Number.isInteger(valeur) ? valeur : defaut);
  const borner = (valeur, min, max) => Math.min(max, Math.max(min, valeur));
  const dans = (liste, valeur, defaut) => (liste.includes(valeur) ? valeur : defaut);

  // Des réglages venus de n'importe où (localStorage, plus tard le compte de
  // l'élève) redeviennent des réglages valides : rien d'inconnu ne passe.
  function normaliser(mode, brut) {
    const m = dans(MODES, mode, "flash");
    const d = DEFAUTS[m];
    const b = brut && typeof brut === "object" ? brut : {};
    let chiffresMin = borner(entier(b.chiffresMin, d.chiffresMin), BORNES.chiffres.min, BORNES.chiffres.max);
    let chiffresMax = borner(entier(b.chiffresMax, d.chiffresMax), BORNES.chiffres.min, BORNES.chiffres.max);
    if (chiffresMin > chiffresMax) chiffresMax = chiffresMin;
    const r = {
      operations: dans(OPERATIONS, b.operations, d.operations),
      chiffresMin,
      chiffresMax,
      nombres: borner(entier(b.nombres, d.nombres), BORNES.nombres.min, BORNES.nombres.max),
      calculs: dans(CALCULS, b.calculs, d.calculs)
    };
    if (m === "flash") {
      r.temps = dans(TEMPS, b.temps, d.temps);
      r.son = dans(SONS, b.son, d.son);
    } else {
      r.limite = dans(LIMITES, b.limite, d.limite);
    }
    return r;
  }

  // Un pas vers le haut ou vers le bas dans une liste de valeurs permises.
  function pas(liste, valeur, sens) {
    const i = liste.indexOf(valeur);
    if (i < 0) return liste[0];
    return liste[borner(i + (sens > 0 ? 1 : -1), 0, liste.length - 1)];
  }

  // « de » et « à » restent dans l'ordre : monter le minimum au-dessus du
  // maximum pousse le maximum, et l'inverse.
  function changerChiffres(r, cote, sens) {
    const n = {...r};
    const {min, max} = BORNES.chiffres;
    if (cote === "min") {
      n.chiffresMin = borner(r.chiffresMin + sens, min, max);
      if (n.chiffresMin > n.chiffresMax) n.chiffresMax = n.chiffresMin;
    } else {
      n.chiffresMax = borner(r.chiffresMax + sens, min, max);
      if (n.chiffresMax < n.chiffresMin) n.chiffresMin = n.chiffresMax;
    }
    return n;
  }

  // ---------------------------------------------------------------------
  // Le hasard
  // ---------------------------------------------------------------------
  function mulberry32(graine) {
    let a = graine >>> 0;
    return function aleatoire() {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const entierEntre = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

  // Un nombre de exactement n chiffres : jamais de zéro devant, les zéros à
  // l'intérieur sont permis (305).
  function nombreDeChiffres(rng, n) {
    let texte = String(entierEntre(rng, 1, 9));
    for (let i = 1; i < n; i += 1) texte += String(entierEntre(rng, 0, 9));
    return Number(texte);
  }

  // Un calcul : une suite de termes {signe, valeur} et le total.
  //  - le premier nombre est toujours ajouté ;
  //  - un grade (reglages.grade) ne montre jamais deux fois le même nombre
  //    de suite ;
  //  - en « + et − », le total en cours ne passe jamais sous zéro : une
  //    soustraction qui le rendrait négatif devient une addition.
  function tirerCalcul(reglages, rng) {
    const termes = [];
    let total = 0;
    for (let i = 0; i < reglages.nombres; i += 1) {
      let valeur = nombreDeChiffres(rng, entierEntre(rng, reglages.chiffresMin, reglages.chiffresMax));
      // Les grades : jamais deux fois le même nombre de suite (à 0,1 s par
      // nombre, on ne verrait pas qu'il a changé). Seulement pour eux : les
      // séances d'entraînement gardent leurs tirages d'avant.
      if (reglages.grade && i > 0) {
        while (valeur === termes[i - 1].valeur) valeur = nombreDeChiffres(rng, entierEntre(rng, reglages.chiffresMin, reglages.chiffresMax));
      }
      let signe = 1;
      if (i > 0 && reglages.operations === "plusmoins" && rng() < 0.5 && total - valeur >= 0) signe = -1;
      total += signe * valeur;
      termes.push({signe, valeur});
    }
    return {termes, total};
  }

  function tirerSeance(reglages, rng) {
    return Array.from({length: reglages.calculs}, () => tirerCalcul(reglages, rng));
  }

  // ---------------------------------------------------------------------
  // Le calendrier du Flash
  // ---------------------------------------------------------------------
  // Chaque instant se calcule depuis le top départ (jamais en enchaînant des
  // minuteries, qui dérivent) : le nombre i apparaît à i × T et disparaît un
  // peu avant (i + 1) × T. La coupure blanche (12 % de T, au moins 50 ms)
  // laisse voir deux nombres identiques qui se suivent.
  function coupure(tempsMs) {
    return Math.max(50, Math.round(tempsMs * 0.12));
  }

  // Ce qui doit être à l'écran t ms après le top départ.
  //  {index: -1 → rien encore, 0..n-1 → nombre courant ; visible ; fini}
  function etatAuTemps(t, nombres, tempsMs) {
    if (t < 0) return {index: -1, visible: false, fini: false};
    const index = Math.floor(t / tempsMs);
    if (index >= nombres) return {index: nombres, visible: false, fini: true};
    const dansLaCase = t - index * tempsMs;
    return {index, visible: dansLaCase < tempsMs - coupure(tempsMs), fini: false};
  }

  // ---------------------------------------------------------------------
  // Les textes
  // ---------------------------------------------------------------------
  // 0,8 s ; 2 s ; 2,5 s — à la française.
  function secondes(valeur) {
    const arrondi = Math.round(valeur * 10) / 10;
    return `${String(arrondi).replace(".", ",")} s`;
  }
  const tempsEnSecondes = dixiemes => dixiemes / 10;

  function texteChiffres(r) {
    if (r.chiffresMin === r.chiffresMax) return `${r.chiffresMin} chiffre${r.chiffresMin > 1 ? "s" : ""}`;
    return `${r.chiffresMin} à ${r.chiffresMax} chiffres`;
  }

  // Le résumé d'une séance (décompte, écran de fin ; plus tard l'historique).
  // ⚡ Flash · + et − · 2 à 3 chiffres · 10 nombres · 0,8 s
  function resume(mode, r, {avecMode = true} = {}) {
    // Un grade : « 🥋 13e kyu · 20 nombres d'un chiffre · 15 s en tout » (le
    // passage) ou « 🎯 … » (l'entraînement au grade).
    if ((mode === "grade" || mode === "entrainement") && r && gradeValide(r.grade)) {
      const tete = avecMode ? [`${mode === "grade" ? "🥋" : "🎯"} ${nomGrade(r.grade)}`] : [];
      return tete.concat([texteGrade(r.grade)]).join(" · ");
    }
    const morceaux = [];
    if (avecMode) morceaux.push(mode === "flash" ? "⚡ Flash" : "📝 Colonne");
    if (r.operations === "plusmoins") morceaux.push("+ et −");
    morceaux.push(texteChiffres(r));
    morceaux.push(`${r.nombres} nombres`);
    if (mode === "flash") morceaux.push(secondes(tempsEnSecondes(r.temps)));
    else if (r.limite) morceaux.push(`${r.limite} s`);
    return morceaux.join(" · ");
  }

  // Le temps par nombre d'une séance, en millisecondes : celui du grade, ou
  // celui des réglages du Flash (en dixièmes de seconde).
  function tempsParNombreMs(r) {
    return r && typeof r.tempsMs === "number" && r.tempsMs > 0 ? r.tempsMs : r.temps * 100;
  }

  // Le plus long nombre d'un calcul, signe compris : sert à fixer la taille
  // d'affichage une fois pour toutes.
  function largeurMax(reglages) {
    return reglages.chiffresMax + (reglages.operations === "plusmoins" ? 1 : 0);
  }

  return Object.freeze({
    MODES,
    BORNES,
    CALCULS,
    TEMPS,
    LIMITES,
    SONS,
    OPERATIONS,
    DEFAUTS,
    normaliser,
    pas,
    changerChiffres,
    mulberry32,
    nombreDeChiffres,
    tirerCalcul,
    tirerSeance,
    coupure,
    etatAuTemps,
    secondes,
    tempsEnSecondes,
    texteChiffres,
    resume,
    largeurMax,
    tempsParNombreMs,
    GRADES,
    NB_GRADES,
    GRADE_CALCULS,
    GRADE_REUSSI,
    GRADE_PRESQUE,
    GROUPES_GRADES,
    nomGrade,
    reglagesGrade,
    verdictGrade,
    texteGrade,
    CARTES_KYU,
    carteDuGrade
  });
});
