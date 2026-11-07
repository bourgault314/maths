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
  // 正解で合格 »), « presque » à 5 ou 6 (準合格). Du 20e au 11e kyu : sans
  // retenue (voir SANS_RETENUE, sous la grille) ; ensuite, des additions.
  // Le numéro d'un grade va de 1 (20e kyu) à 40 (20e dan).
  const GRADES = Object.freeze([
    [1, 3, 50], [1, 3, 50], [1, 5, 70], [1, 8, 100], [1, 10, 120], [1, 12, 150], [1, 15, 150], [1, 20, 150], [2, 10, 100], [2, 15, 150],
    [2, 2, 40], [2, 3, 60], [2, 4, 70], [2, 5, 80], [2, 6, 90], [2, 7, 100], [2, 8, 110], [2, 10, 120], [2, 12, 120], [2, 15, 130],
    [2, 15, 100], [3, 4, 40], [3, 6, 50], [3, 8, 60], [3, 10, 70], [3, 12, 80], [3, 15, 80], [3, 15, 60], [3, 15, 45], [3, 15, 30],
    [3, 15, 28], [3, 15, 26], [3, 15, 24], [3, 15, 22], [3, 15, 20], [3, 15, 19], [3, 15, 18], [3, 15, 17], [3, 15, 16], [3, 15, 15]
  ].map(([chiffres, nombres, dixiemes]) => Object.freeze({chiffres, nombres, dixiemes})));
  const NB_GRADES = GRADES.length;
  // SANS RETENUE (07/11/2026, après la question de Gwenaël « c'est quoi la
  // différence entre le 19 et le 20 ? ») : la grille ci-dessus ne dit pas
  // tout. Trois grilles détaillées (kentei.soroban-soft.com, kani-math.com,
  // la grille de l'école rakutama-soroban.com) précisent : « 繰り上がりなし »
  // (sans retenue) au début — du 20e au 13e kyu en 1 chiffre, puis le 12e en
  // dizaines rondes (« 10+20 ») et le 11e en 2 chiffres (« 11+22 ») ;
  // « 11級まではひき算あり » (des soustractions jusqu'au 11e kyu) et
  // « 10級からたし算のみ » (additions seules dès le 10e kyu, où la retenue
  // arrive : d'où ses 2 nombres seulement). Vingt nombres d'un chiffre sans retenue, ce n'est
  // possible qu'en ajoutant ET en enlevant : chaque colonne du boulier reste
  // entre 0 et 9. Le 20e et le 19e kyu restent identiques dans ces grilles :
  // choix de Claude, le 20e kyu n'a que des additions (total jusqu'à 9), le
  // 19e ajoute les soustractions.
  // Grade → {forme : "unites" (1 chiffre), "dizaines" (10, 20 … 90) ou
  // "deux" (2 chiffres), plusmoins : + et −}.
  const SANS_RETENUE = Object.freeze({
    1: Object.freeze({forme: "unites", plusmoins: false}),
    2: Object.freeze({forme: "unites", plusmoins: true}),
    3: Object.freeze({forme: "unites", plusmoins: true}),
    4: Object.freeze({forme: "unites", plusmoins: true}),
    5: Object.freeze({forme: "unites", plusmoins: true}),
    6: Object.freeze({forme: "unites", plusmoins: true}),
    7: Object.freeze({forme: "unites", plusmoins: true}),
    8: Object.freeze({forme: "unites", plusmoins: true}),
    9: Object.freeze({forme: "dizaines", plusmoins: true}),
    10: Object.freeze({forme: "deux", plusmoins: true})
  });
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
    const sr = SANS_RETENUE[n];
    return {
      operations: sr && sr.plusmoins ? "plusmoins" : "plus",
      chiffresMin: g.chiffres,
      chiffresMax: g.chiffres,
      nombres: g.nombres,
      calculs: GRADE_CALCULS,
      grade: n,
      ...(sr ? {sansRetenue: sr.forme} : {}),
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

  // « 20 nombres d'un chiffre », « 5 nombres d'un chiffre, + et −, sans
  // retenue », « 10 dizaines rondes, + et −, sans retenue ».
  function texteNombresGrade(n) {
    if (!gradeValide(n)) return "";
    const g = GRADES[n - 1];
    const sr = SANS_RETENUE[n];
    const quoi = sr && sr.forme === "dizaines" ? `${g.nombres} dizaines rondes`
      : `${g.nombres} nombres ${g.chiffres === 1 ? "d’un chiffre" : `de ${g.chiffres} chiffres`}`;
    if (!sr) return quoi;
    return `${quoi}${sr.plusmoins ? ", + et −" : ""}, sans retenue`;
  }

  // « 20 nombres d'un chiffre · 15 s en tout »
  function texteGrade(n) {
    if (!gradeValide(n)) return "";
    const g = GRADES[n - 1];
    return `${texteNombresGrade(n)} · ${secondes(g.dixiemes / 10)} en tout`;
  }

  // ---------------------------------------------------------------------
  // Les cartes des grades (lot « anzan-cartes », 07/11/2026)
  // ---------------------------------------------------------------------
  // Une carte par kyu, du 20e au 1er : une créature japonaise (les images de
  // Gwenaël, toutes dans un même cadre, dans ./anzan-cartes/), et au dos la
  // créature, un message et un proverbe. Textes et images se refont depuis
  // _sources/anzan-cartes/ (generer_textes.py écrit les lignes ci-dessous).
  // Les dan ont leur série (CARTES_DAN, plus bas, 07/11/2026).
  // Rien de nouveau n'est enregistré : une carte est gagnée quand son grade
  // est réussi (gradeReussi du parcours).
  const DOSSIER_CARTES = "./anzan-cartes/";
  // Les kyu font 640 × 904 (vignettes 160 × 226), les dan 640 × 984
  // (vignettes 160 × 246) : leur timbre doré est plus haut. Chaque carte
  // porte sa taille ; la page ne déforme jamais une carte.
  const TAILLES_CARTES = Object.freeze({
    kyu: Object.freeze({largeur: 640, hauteur: 904, vignetteLargeur: 160, vignetteHauteur: 226}),
    dan: Object.freeze({largeur: 640, hauteur: 984, vignetteLargeur: 160, vignetteHauteur: 246})
  });
  const carte = c => Object.freeze({...c, proverbe: Object.freeze(c.proverbe),
    ...TAILLES_CARTES[c.dan ? "dan" : "kyu"],
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

  // Les cartes des dan (lot « anzan-dan », 07/11/2026)
  // Une carte par dan, du 1er au 20e : une créature ou un lieu japonais
  // (images faites par GPT dans le même timbre que les kyu, mais doré, dans
  // ./anzan-cartes/, 640 × 984 : plus hautes que les kyu, 640 × 904), et au dos
  // la créature et l'élément japonais qu'on voit sur l'image, un message et un
  // vrai proverbe japonais (aucun ne reprend un proverbe des kyu).
  // Même structure que CARTES_KYU, avec « dan » à la place de « kyu ».
  const CARTES_DAN = Object.freeze([
    carte({dan: 1, nom: "Kuma", sens: "l’ours", image: "dan01-kuma",
      creature: "L’ours brun (kuma) d’Hokkaidō pêche le saumon dans les rivières. Les Aïnous, le peuple du nord du Japon, l’honoraient comme le dieu de la montagne (kimun kamuy). La corde de paille tressée (shimenawa) et les papiers blancs en zigzag (shide) montrent que l’arbre est sacré (shinboku)\u00a0: un dieu y habite.",
      message: "Bravo pour ton 1er\u00a0Dan\u00a0! Te voilà dans la série des maîtres. Comme l’ours, reste calme et puissant\u00a0: les nombres défilent, ta tête reste tranquille.",
      proverbe: {japonais: "思い立ったが吉日", lecture: "omoitatta ga kichijitsu", francais: "Le jour où l’on décide de commencer est le bon jour.", idee: "N’attends pas le moment parfait pour te lancer."}}),
    carte({dan: 2, nom: "Taka", sens: "le faucon", image: "dan02-taka",
      creature: "Le faucon (taka) chasse grâce à son regard perçant. Au Japon, le plus beau premier rêve de l’année (hatsuyume) montre, dans cet ordre, le mont Fuji, un faucon et une aubergine (nasu)\u00a0: «\u00a0Ichi Fuji, ni taka, san nasubi\u00a0». Les trois sont sur la carte\u00a0!",
      message: "Félicitations pour ton 2e\u00a0Dan\u00a0! Ton regard est aussi vif que celui du faucon\u00a0: un nombre passe en un éclair, et tu l’as déjà attrapé.",
      proverbe: {japonais: "能ある鷹は爪を隠す", lecture: "nō aru taka wa tsume o kakusu", francais: "Le faucon habile cache ses serres.", idee: "Les vrais talents n’ont pas besoin de se vanter."}}),
    carte({dan: 3, nom: "Kamaitachi", sens: "les belettes du vent", image: "dan03-kamaitachi",
      creature: "Le Kamaitachi est un esprit du vent\u00a0: trois belettes (itachi) qui filent dans un tourbillon, si vite qu’on ne les voit jamais. Le fūrin est une clochette à vent en verre, accrochée sous le toit en été\u00a0: quand la brise la fait tinter, on se sent au frais. Momiji (feuilles d’érable).",
      message: "Bravo pour ton 3e\u00a0Dan\u00a0! Tes calculs filent comme les belettes dans le vent, si vite qu’on ne les voit pas passer.",
      proverbe: {japonais: "三人寄れば文殊の知恵", lecture: "sannin yoreba monju no chie", francais: "À trois, on est aussi sage que Monju.", idee: "Monju est le saint bouddhiste de la sagesse\u00a0: à plusieurs, on trouve plus d’idées."}}),
    carte({dan: 4, nom: "Namazu", sens: "le poisson-chat", image: "dan04-namazu",
      creature: "Le Namazu est un poisson-chat géant qui vit sous le Japon\u00a0: quand il s’agite, la terre tremble. Le dieu du sanctuaire de Kashima le tient immobile avec une pierre sacrée posée sur sa tête, la kaname-ishi. La corde (shimenawa) et les papiers (shide) qui l’entourent montrent qu’elle est sacrée.",
      message: "Félicitations pour ton 4e\u00a0Dan\u00a0! Comme la pierre posée sur le Namazu, ta concentration tient bon\u00a0: même quand tout va très vite, rien ne t’ébranle.",
      proverbe: {japonais: "一念岩をも通す", lecture: "ichinen iwa o mo tōsu", francais: "Une volonté ferme traverse même le rocher.", idee: "Quand on veut vraiment, on surmonte les obstacles."}}),
    carte({dan: 5, nom: "Shachihoko", sens: "", image: "dan05-shachihoko",
      creature: "Le Shachihoko a une tête de tigre et un corps de poisson. Posé par paires sur le toit des châteaux, il devait faire venir la pluie pour protéger le château du feu. Le plus célèbre, en or, est à Nagoya. Au fond, le donjon (tenshu) d’un château japonais et ses toits superposés. Sakura (cerisiers).",
      message: "Bravo pour ton 5e\u00a0Dan\u00a0! Te voilà tout en haut du château, comme le Shachihoko. De là-haut, tu vois loin… et tu calcules de plus en plus vite\u00a0!",
      proverbe: {japonais: "猿も木から落ちる", lecture: "saru mo ki kara ochiru", francais: "Même le singe tombe de l’arbre.", idee: "Même les meilleurs se trompent\u00a0: reste attentif, même quand c’est facile."}}),
    carte({dan: 6, nom: "Shishi", sens: "le lion", image: "dan06-shishi",
      creature: "Le Shishi est le lion des légendes japonaises\u00a0: il chasse le malheur. Au Nouvel An et pendant les fêtes, on danse le shishi-mai, la danse du lion, au son du taiko, le grand tambour japonais qu’on frappe avec des baguettes (bachi). Botan (pivoine)\u00a0: la reine des fleurs accompagne le roi des animaux.",
      message: "Félicitations pour ton 6e\u00a0Dan\u00a0! Tes calculs dansent au rythme du taiko. Le tempo s’accélère, et tu suis chaque battement\u00a0!",
      proverbe: {japonais: "獅子奮迅", lecture: "shishi funjin", francais: "Avec la fougue d’un lion qui s’élance.", idee: "Donne-toi à fond, avec toute ton énergie."}}),
    carte({dan: 7, nom: "Ōkami", sens: "le loup", image: "dan07-okami",
      creature: "Le loup japonais (ōkami), aujourd’hui disparu, était honoré comme gardien des montagnes\u00a0: il protégeait les champs des cerfs et des sangliers. On rapproche son nom de 大神, «\u00a0grand dieu\u00a0». Le torii vermillon marque le début du chemin sacré qui monte au sanctuaire. Sugi (cèdres du Japon).",
      message: "Bravo pour ton 7e\u00a0Dan\u00a0! Comme le loup gardien de la montagne, tu montes marche après marche, sans jamais lâcher ta concentration.",
      proverbe: {japonais: "情けは人の為ならず", lecture: "nasake wa hito no tame narazu", francais: "La bonté n’est pas seulement pour les autres.", idee: "Le bien que tu fais finit par te revenir."}}),
    carte({dan: 8, nom: "Raijū", sens: "la bête du tonnerre", image: "dan08-raiju",
      creature: "Le Raijū accompagne Raijin, le dieu de l’orage\u00a0: on raconte qu’il descend du ciel avec la foudre. Les tambours en arc de cercle sont ceux de Raijin\u00a0: quand il les frappe, le tonnerre gronde. Sur chacun, le mitsudomoe, un motif de trois virgules qui tournent.",
      message: "Félicitations pour ton 8e\u00a0Dan\u00a0! Tes réponses tombent aussi vite que la foudre. Le tonnerre du Raijū gronde pour toi\u00a0!",
      proverbe: {japonais: "電光石火", lecture: "denkō sekka", francais: "L’éclair et l’étincelle du silex.", idee: "Agir en un instant, vif comme l’éclair."}}),
    carte({dan: 9, nom: "Ryūme", sens: "le cheval-dragon", image: "dan09-ryume",
      creature: "Selon une légende chinoise, le cheval-dragon sortit du fleuve Jaune avec, sur le dos, un dessin de points (le Hetu), qu’on représente avec les nombres de 1\u00a0à 10. Les vagues rappellent La Grande Vague de Kanagawa, l’estampe d’Hokusai (vers 1831), sans doute l’image japonaise la plus célèbre au monde.",
      message: "Bravo pour ton 9e\u00a0Dan\u00a0! Comme le cheval-dragon sur les vagues, tu galopes sur les nombres sans jamais te laisser emporter.",
      proverbe: {japonais: "塞翁が馬", lecture: "saiō ga uma", francais: "Le cheval du vieil homme de la frontière.", idee: "Un malheur peut devenir une chance\u00a0: une erreur aujourd’hui t’aide à réussir demain."}}),
    carte({dan: 10, nom: "Hakutaku", sens: "", image: "dan10-hakutaku",
      creature: "On raconte que le Hakutaku, une bête blanche qui sait tout, décrivit à l’Empereur Jaune de Chine 11\u00a0520\u00a0sortes de créatures, et l’empereur fit tout écrire. Au Japon, son image servait de porte-bonheur contre les maladies. Le makimono est un long rouleau qu’on déroule de droite à gauche, au fil de la lecture.",
      message: "Félicitations pour ton 10e\u00a0Dan\u00a0! Te voilà à mi-chemin des dan. Comme le sage Hakutaku, tu en sais déjà beaucoup… et il te reste tout un rouleau à écrire\u00a0!",
      proverbe: {japonais: "一を聞いて十を知る", lecture: "ichi o kiite jū o shiru", francais: "Entendre un, comprendre dix.", idee: "Un esprit vif comprend beaucoup à partir de peu."}}),
    carte({dan: 11, nom: "Genbu", sens: "la tortue noire", image: "dan11-genbu",
      creature: "Genbu, la tortue noire enlacée d’un serpent, garde le Nord et l’hiver. C’est l’un des quatre gardiens des points cardinaux, avec le tigre blanc, l’oiseau vermillon et le dragon azur. Le yukimi-dōrō est la «\u00a0lanterne pour regarder la neige\u00a0» des jardins\u00a0: basse, avec un large toit où la neige s’accumule.",
      message: "Bravo pour ton 11e\u00a0Dan\u00a0! Te voilà parmi les quatre gardiens. Comme Genbu, tu as la solidité de la tortue et la vivacité du serpent.",
      proverbe: {japonais: "亀の甲より年の功", lecture: "kame no kō yori toshi no kō", francais: "L’expérience des années vaut mieux que la carapace de la tortue.", idee: "Tout ce que tu as appris te protège mieux qu’une carapace."}}),
    carte({dan: 12, nom: "Byakko", sens: "le tigre blanc", image: "dan12-byakko",
      creature: "Byakko, le tigre blanc, garde l’Ouest et l’automne. Le karesansui est un jardin sec\u00a0: pas une goutte d’eau, mais du gravier ratissé qui dessine des vagues autour des rochers, comme des îles dans la mer. Pour les moines zen, ratisser est un exercice de concentration. Take (bambou).",
      message: "Félicitations pour ton 12e\u00a0Dan\u00a0! Comme le tigre blanc, tu avances avec calme et précision… et ta vitesse impressionne.",
      proverbe: {japonais: "虎穴に入らずんば虎子を得ず", lecture: "koketsu ni irazunba koji o ezu", francais: "Qui n’entre pas dans l’antre du tigre n’attrape pas son petit.", idee: "Pour réussir, il faut oser."}}),
    carte({dan: 13, nom: "Suzaku", sens: "l’oiseau vermillon", image: "dan13-suzaku",
      creature: "Suzaku, l’oiseau vermillon aux ailes de flammes, garde le Sud et l’été. L’allée de torii rappelle le sanctuaire Fushimi Inari, à Kyōto\u00a0: des milliers de portes vermillon s’y suivent dans la montagne, chacune offerte pour remercier ou pour faire un vœu.",
      message: "Bravo pour ton 13e\u00a0Dan\u00a0! Les nombres défilent comme les torii sous les ailes de Suzaku\u00a0: un, puis un autre, toujours plus vite.",
      proverbe: {japonais: "立つ鳥跡を濁さず", lecture: "tatsu tori ato o nigosazu", francais: "L’oiseau qui s’envole ne laisse pas l’eau troublée derrière lui.", idee: "Termine proprement ce que tu fais, jusqu’au bout."}}),
    carte({dan: 14, nom: "Seiryū", sens: "le dragon azur", image: "dan14-seiryu",
      creature: "Seiryū, le dragon azur, garde l’Est et le printemps. Les cinq toits de la pagode bouddhiste (gojū-no-tō) représenteraient la terre, l’eau, le feu, le vent et le ciel\u00a0; grâce à son pilier central, elle résiste bien aux tremblements de terre. Sakura (cerisiers en fleurs).",
      message: "Félicitations pour ton 14e\u00a0Dan\u00a0! Comme le dragon azur au lever du soleil, ta maîtrise monte chaque jour un peu plus haut.",
      proverbe: {japonais: "青は藍より出でて藍より青し", lecture: "ao wa ai yori idete ai yori aoshi", francais: "Le bleu vient de l’indigo, mais il est plus bleu que l’indigo.", idee: "L’élève peut dépasser son maître."}}),
    carte({dan: 15, nom: "Kyūbi", sens: "le renard à neuf queues", image: "dan15-kyubi",
      creature: "On raconte qu’un renard gagne des queues en vieillissant et en devenant plus sage\u00a0: avec neuf, le Kyūbi a des siècles de savoir. Sur la marche repose un kitsune-men, le masque de renard qu’on porte aux fêtes\u00a0: le renard est le messager du dieu Inari. Kitsunebi (feux de renard), fuji (glycine).",
      message: "Bravo pour ton 15e\u00a0Dan\u00a0! Le Kyūbi a gagné ses neuf queues une à une\u00a0; toi aussi, tu as gagné tes grades un à un, avec patience et intelligence.",
      proverbe: {japonais: "大器晩成", lecture: "taiki bansei", francais: "Les grands talents mûrissent lentement.", idee: ""}}),
    carte({dan: 16, nom: "Kujaku", sens: "le paon", image: "dan16-kujaku",
      creature: "Au Japon, le paon (kujaku) porte Kujaku Myōō, un protecteur bouddhiste\u00a0: on dit qu’il mange les serpents venimeux et éloigne le malheur. Le byōbu est un paravent pliant (son nom veut dire «\u00a0qui arrête le vent\u00a0»)\u00a0; dans les palais, il est couvert de feuilles d’or. Fuji (glycine).",
      message: "Félicitations pour ton 16e\u00a0Dan\u00a0! Ton calcul est devenu un art, aussi fin que les plumes du paon blanc. Déploie tout ton talent\u00a0!",
      proverbe: {japonais: "絵に描いた餅", lecture: "e ni kaita mochi", francais: "Un gâteau de riz en peinture ne se mange pas.", idee: "Un projet qui reste sur le papier ne sert à rien\u00a0: passe à l’action."}}),
    carte({dan: 17, nom: "Takarabune", sens: "le bateau des trésors", image: "dan17-takarabune",
      creature: "Le Takarabune est le bateau des sept dieux du bonheur (Shichifukujin). Au Nouvel An, on glisse son image sous l’oreiller pour faire un beau premier rêve. Sur la voile, le caractère 宝 (takara) veut dire «\u00a0trésor\u00a0». À bord\u00a0: des ballots de riz (tawara), des bourses, un coffre et des pièces d’or.",
      message: "Bravo pour ton 17e\u00a0Dan\u00a0! Ta vitesse et ta précision sont un vrai trésor. Ton bateau est bien chargé\u00a0: cap sur les derniers grades\u00a0!",
      proverbe: {japonais: "宝の持ち腐れ", lecture: "takara no mochigusare", francais: "Un trésor qu’on garde sans s’en servir finit par se gâter.", idee: "Un talent qu’on n’utilise pas se perd\u00a0: continue de t’entraîner."}}),
    carte({dan: 18, nom: "Fujisan", sens: "le mont Fuji", image: "dan18-fujisan",
      creature: "Le Fuji, volcan sacré, est la plus haute montagne du Japon (3\u00a0776\u00a0m). Dans «\u00a0Fujisan\u00a0», san ne veut pas dire «\u00a0monsieur\u00a0»\u00a0: c’est 山, «\u00a0montagne\u00a0». Le 1er\u00a0janvier, on se lève tôt pour voir le premier lever de soleil de l’année (hatsuhinode). Quand le soleil se pose pile sur le sommet, c’est le «\u00a0Fuji diamant\u00a0».",
      message: "Félicitations pour ton 18e\u00a0Dan\u00a0! Le sommet est en vue. Comme le soleil sur le Fuji, ton talent brille au-dessus des nuages.",
      proverbe: {japonais: "一年の計は元旦にあり", lecture: "ichinen no kei wa gantan ni ari", francais: "Le plan de toute l’année se fait le jour de l’an.", idee: "Un bon départ prépare la suite\u00a0: fixe-toi un objectif."}}),
    carte({dan: 19, nom: "Hakuryū", sens: "le dragon blanc", image: "dan19-hakuryu",
      creature: "Comme tous les dragons japonais, Hakuryū, le dragon blanc, règne sur les eaux\u00a0; et au Japon, les animaux blancs sont vus comme des messagers des dieux. Le torii dans la mer rappelle celui du sanctuaire d’Itsukushima, sur l’île de Miyajima\u00a0: à marée haute, il semble flotter. Mangetsu (pleine lune).",
      message: "Bravo pour ton 19e\u00a0Dan\u00a0! Plus qu’un grade avant le sommet. Comme le dragon blanc sous la lune, tu calcules vite, avec grâce et sang-froid.",
      proverbe: {japonais: "上には上がある", lecture: "ue ni wa ue ga aru", francais: "Au-dessus du meilleur, il y a toujours mieux.", idee: "Il y a toujours plus haut à viser."}}),
    carte({dan: 20, nom: "Ōryū", sens: "le dragon jaune", image: "dan20-oryu",
      creature: "Au centre des quatre gardiens (tortue noire du Nord, tigre blanc de l’Ouest, oiseau vermillon du Sud, dragon azur de l’Est) règne Ōryū, le dragon jaune\u00a0: le jaune-or est la couleur du centre. En bas, le Kinkaku-ji, le Pavillon d’or de Kyōto, couvert de feuilles d’or, avec un phénix (hō-ō) sur le toit.",
      message: "Félicitations pour ton 20e\u00a0Dan, le plus haut grade\u00a0! Comme Ōryū au centre des gardiens, te voilà au cœur du soroban. Le titre de maître est à toi\u00a0!",
      proverbe: {japonais: "画竜点睛", lecture: "garyō tensei", francais: "Peindre les yeux du dragon.", idee: "La dernière touche donne vie à tout\u00a0: un peintre ajouta les yeux à ses dragons, et ils s’envolèrent\u00a0!"}})
  ]);
  // La carte du grade n (1 = 20e kyu … 20 = 1er kyu), ou null (un dan).
  // Les 40 cartes dans l'ordre des grades : 20e kyu (1) … 1er kyu (20),
  // 1er dan (21) … 20e dan (40).
  const CARTES = Object.freeze([...CARTES_KYU, ...CARTES_DAN]);
  function carteDuGrade(n) {
    return Number.isInteger(n) && n >= 1 && n <= CARTES.length ? CARTES[n - 1] : null;
  }
  // « 8e Kyu », « 1er Dan » (comme écrit sur la carte ; insécable).
  function nomCarte(c) {
    if (!c) return "";
    const k = c.dan || c.kyu;
    return `${k}${k === 1 ? "er" : "e"}\u00a0${c.dan ? "Dan" : "Kyu"}`;
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
  //  - un grade SANS RETENUE (reglages.sansRetenue, du 20e au 11e kyu) :
  //    voir tirerSansRetenue.
  //
  // Sans retenue, additions seules (le 20e kyu) : une suite tirée au hasard
  // parmi TOUTES celles qui conviennent (3 nombres de 1 à 9, total jusqu'à
  // 9, jamais deux fois le même de suite) — tirer nombre par nombre pouvait
  // bloquer (8 puis 1 : plus rien pour le 3e).
  const suitesAdditions = new Map();
  function suitesSansRetenue(nombres) {
    if (!suitesAdditions.has(nombres)) {
      const toutes = [];
      const suite = [];
      (function etendre(total) {
        if (suite.length === nombres) { toutes.push(suite.slice()); return; }
        for (let v = 1; v <= 9 && total + v <= 9; v += 1) {
          if (suite.length && v === suite[suite.length - 1]) continue;
          suite.push(v);
          etendre(total + v);
          suite.pop();
        }
      })(0);
      suitesAdditions.set(nombres, toutes);
    }
    return suitesAdditions.get(nombres);
  }
  // Les nombres permis d'une forme : 1 à 9, 10 à 90 de dix en dix, 10 à 99.
  function nombresDeForme(forme) {
    if (forme === "dizaines") return Array.from({length: 9}, (_, i) => (i + 1) * 10);
    if (forme === "deux") return Array.from({length: 90}, (_, i) => i + 10);
    return Array.from({length: 9}, (_, i) => i + 1);
  }
  // Sans retenue : chaque chiffre du total (unités, dizaines) reste entre
  // 0 et 9 après chaque nombre — sur le boulier, jamais de retenue ni
  // d'emprunt. En « + et − » : le premier nombre est ajouté ; ensuite le
  // signe est tiré parmi ceux qui ont encore un nombre possible.
  function sansRetenueApres(total, signe, valeur) {
    for (let p = 1; p <= 10; p *= 10) {
      const chiffre = Math.floor(total / p) % 10 + signe * (Math.floor(valeur / p) % 10);
      if (chiffre < 0 || chiffre > 9) return false;
    }
    return true;
  }
  function tirerSansRetenue(reglages, rng) {
    if (reglages.operations !== "plusmoins") {
      const toutes = suitesSansRetenue(reglages.nombres);
      const suite = toutes[Math.floor(rng() * toutes.length)];
      return {termes: suite.map(valeur => ({signe: 1, valeur})), total: suite.reduce((a, v) => a + v, 0)};
    }
    const forme = nombresDeForme(reglages.sansRetenue);
    const termes = [];
    let total = 0;
    for (let i = 0; i < reglages.nombres; i += 1) {
      const avant = i > 0 ? termes[i - 1].valeur : null;
      // Le dernier nombre ne ramène jamais le total à 0 (« 0 » comme réponse
      // revenait une fois sur huit).
      const dernier = i === reglages.nombres - 1;
      const choix = signe => forme.filter(v => v !== avant && sansRetenueApres(total, signe, v) && !(dernier && total + signe * v === 0));
      const signes = (i === 0 ? [1] : [1, -1]).filter(signe => choix(signe).length);
      // Jamais vu : il reste toujours un nombre (à 0, on peut ajouter ; à 9,
      // enlever) ; par prudence, on accepte alors le même nombre qu'avant.
      const signe = signes.length ? signes[Math.floor(rng() * signes.length)] : (sansRetenueApres(total, 1, avant) ? 1 : -1);
      const possibles = signes.length ? choix(signe) : [avant];
      const valeur = possibles[Math.floor(rng() * possibles.length)];
      total += signe * valeur;
      termes.push({signe, valeur});
    }
    return {termes, total};
  }
  function tirerCalcul(reglages, rng) {
    if (reglages.grade && reglages.sansRetenue) return tirerSansRetenue(reglages, rng);
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
    SANS_RETENUE,
    texteNombresGrade,
    verdictGrade,
    texteGrade,
    CARTES_KYU,
    CARTES_DAN,
    CARTES,
    TAILLES_CARTES,
    nomCarte,
    carteDuGrade
  });
});
