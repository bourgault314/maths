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
  // Les cartes des grades (lot « anzan-cartes », 07/11/2026)
  // ---------------------------------------------------------------------
  // Une carte par kyu, du 20e au 1er : une créature japonaise (les images de
  // Gwenaël, toutes dans un même cadre, dans ./anzan-cartes/), et au dos la
  // créature, un message et un proverbe. Textes et images se refont depuis
  // _sources/anzan-cartes/ (generer_textes.py écrit les lignes ci-dessous).
  // Les dan ont leur série (CARTES_DAN, plus bas, 07/11/2026).
  // Rien de nouveau n'est enregistré : une carte est gagnée quand la
  // dernière étape de son grade est réussie (etapeFlash du parcours).
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

  // Un calcul d'une séance libre : une suite de termes {signe, valeur} et le
  // total.
  //  - le premier nombre est toujours ajouté ;
  //  - en « + et − », le total en cours ne passe jamais sous zéro : une
  //    soustraction qui le rendrait négatif devient une addition.
  // (Les étapes des grades ont leur propre tirage : tirerEtape, plus bas.)
  function tirerCalcul(reglages, rng) {
    const termes = [];
    let total = 0;
    for (let i = 0; i < reglages.nombres; i += 1) {
      const valeur = nombreDeChiffres(rng, entierEntre(rng, reglages.chiffresMin, reglages.chiffresMax));
      let signe = 1;
      if (i > 0 && reglages.operations === "plusmoins" && rng() < 0.5 && total - valeur >= 0) signe = -1;
      total += signe * valeur;
      termes.push({signe, valeur});
    }
    return {termes, total};
  }

  // ---------------------------------------------------------------------
  // Les gestes du boulier (barème révisé, 22/11/2026)
  // ---------------------------------------------------------------------
  // Une tige porte quatre boules de 1 et une boule de 5. Un nombre s'ajoute
  // ou s'enlève de la gauche vers la droite, chiffre par chiffre, et chaque
  // chiffre demande UN geste — c'est lui que les étapes des grades
  // garantissent. Le modèle (preuves/soroban.py du barème, porté ici ligne
  // pour ligne) :
  //   D    geste direct : les boules à pousser sont là (2 + 5, 6 + 3) ;
  //   P    complément à 5 : on passe par la boule de 5 (4 + 3 : +5, −2) ;
  //   R    retenue : +10, et le complément à 10 s'enlève directement (8 + 4) ;
  //   RC   retenue avec complément à 5 : le complément à 10 s'enlève en
  //        passant par la boule de 5 (7 + 6 : +10, puis −4 = −5 + 1) ;
  //   CASC cascade : la retenue arrive sur une tige à 9 (67 + 35) ;
  //   rD, rP : ce que fait la retenue sur la tige d'à côté.
  // Les mêmes à l'envers pour une soustraction : d, p, E (emprunt), EC, casc
  // (l'emprunt arrive sur une tige à 0 : 302 − 108), ed, ep.
  function ajouterChiffre(tiges, p, d, ev, report) {
    const a = tiges[p];
    if (a + d <= 9) {
      const direct = !(d < 5 && a < 5 && (a % 5) + d >= 5);
      ev.push([report ? (direct ? "rD" : "rP") : (direct ? "D" : "P"), p]);
      tiges[p] = a + d;
      return;
    }
    if (report && a === 9 && d === 1) {
      ev.push(["CASC", p]);
      tiges[p] = 0;
      ajouterChiffre(tiges, p + 1, 1, ev, true);
      return;
    }
    const c = 10 - d;
    const simple = !(c < 5 && a >= 5 && (a % 5) < c);
    ev.push([simple ? "R" : "RC", p]);
    tiges[p] = a + d - 10;
    ajouterChiffre(tiges, p + 1, 1, ev, true);
  }
  function enleverChiffre(tiges, p, d, ev, report) {
    const a = tiges[p];
    if (a >= d) {
      const direct = !(d < 5 && a >= 5 && (a % 5) < d);
      ev.push([report ? (direct ? "ed" : "ep") : (direct ? "d" : "p"), p]);
      tiges[p] = a - d;
      return;
    }
    if (report && a === 0 && d === 1) {
      ev.push(["casc", p]);
      tiges[p] = 9;
      enleverChiffre(tiges, p + 1, 1, ev, true);
      return;
    }
    const c = 10 - d;
    const simple = !(c < 5 && a < 5 && (a % 5) + c >= 5);
    ev.push([simple ? "E" : "EC", p]);
    tiges[p] = a + c;
    enleverChiffre(tiges, p + 1, 1, ev, true);
  }
  // Les gestes d'un calcul (des termes {signe, valeur}) : {total, parTerme}
  // — pour chaque terme, la liste de ses gestes [code, tige] (tige 0 = les
  // unités) ; null si le total en cours passe sous zéro.
  function gestes(termes) {
    const tiges = new Array(16).fill(0);
    const parTerme = [];
    let total = 0;
    for (let i = 0; i < termes.length; i += 1) {
      const t = termes[i];
      total += t.signe * t.valeur;
      if (total < 0) return null;
      const ev = [];
      const texte = String(t.valeur);
      for (let k = 0; k < texte.length; k += 1) {
        const d = texte.charCodeAt(k) - 48;
        if (d) (t.signe > 0 ? ajouterChiffre : enleverChiffre)(tiges, texte.length - 1 - k, d, ev, false);
      }
      parTerme.push(ev);
    }
    return {total, parTerme};
  }
  const CODES_GESTES = Object.freeze(["D", "P", "R", "RC", "CASC", "rD", "rP", "d", "p", "E", "EC", "casc", "ed", "ep"]);
  // Ce qu'une étape regarde d'un calcul : le compte de chaque geste (n), les
  // retenues (R, RC, CASC) et les emprunts (E, EC, casc), et les tiges où ils
  // se font (« 0 », « 1 », « 01 » : unités, dizaines, les deux).
  function analyser(termes) {
    const g = gestes(termes);
    if (!g) return null;
    const n = {};
    CODES_GESTES.forEach(code => { n[code] = 0; });
    const tr = {};
    const te = {};
    g.parTerme.forEach(ev => ev.forEach(([code, p]) => {
      n[code] += 1;
      if (code === "R" || code === "RC") tr[p] = true;
      if (code === "E" || code === "EC") te[p] = true;
    }));
    return {total: g.total, parTerme: g.parTerme, n,
      retenues: n.R + n.RC + n.CASC, emprunts: n.E + n.EC + n.casc,
      tigesRetenue: Object.keys(tr).sort().join(""), tigesEmprunt: Object.keys(te).sort().join("")};
  }

  // ---------------------------------------------------------------------
  // Les grades et leurs étapes (barème révisé, 22/11/2026)
  // ---------------------------------------------------------------------
  // Les grades gardent leurs noms et leurs cartes : en Flash, 20 kyu puis
  // 20 dan (numéros 1 = 20e kyu … 40 = 20e dan) ; en Colonne, 10 kyu
  // (numéros 41 = 10e kyu … 50 = 1er kyu ; les 10 dan, 51 … 60, viendront
  // au lot 2 : nombres de 4 à 8 chiffres, finale de 30 colonnes).
  // Un grade se gagne en réussissant ses ÉTAPES, dans l'ordre (1 à 5 par
  // grade). Une étape = 10 calculs ; réussie à 7 sur 10 en Flash (la règle
  // japonaise), 8 sur 10 en Colonne ; « presque » à deux réponses du seuil.
  // Une étape porte un NUMÉRO : 101 … 165 en Flash, 201 … 226 en Colonne —
  // hors des numéros de l'ancienne grille (1 … 53), dont les séances sont
  // ainsi ignorées sans erreur (aucun élève n'avait commencé, décision du
  // 22/11/2026). C'est ce numéro qu'une séance de grade garde.
  // Ce que le tirage d'une étape GARANTIT : chaque calcul contient le geste
  // annoncé et aucun geste plus difficile. Trois sortes de tirage :
  //  - un PROFIL : le calcul est pris au hasard parmi TOUS ceux qui
  //    conviennent (on tire des nombres au hasard, on garde le premier
  //    calcul qui a le profil : chaque calcul possible a la même chance) ;
  //  - un PLAN : les 10 calculs se partagent entre plusieurs profils, dans
  //    le désordre (un geste rare qui fixe la réponse, comme la cascade à
  //    2 chiffres — total toujours entre 100 et 108 —, n'occupe jamais les
  //    dix calculs) ;
  //  - LIBRE : des nombres tirés au hasard, sans rien forcer ; la série est
  //    seulement retirée quand son nombre de retenues sort de la fourchette
  //    de son format (la partie centrale du hasard, 8 à 9 tirages naturels
  //    sur 10 : preuves/bandes.py) — deux passages de la même étape ont
  //    ainsi une difficulté comparable.
  // Jamais deux fois le même nombre de suite, sauf dans les deux étapes
  // « les dix » : les dix compléments à 5 et les dix retenues avec
  // complément à 5 qui existent entre deux nombres d'un chiffre, posés
  // chacun une fois (3 + 3, 4 + 4, 6 + 6 et 7 + 7 en font partie).
  // En Colonne avec soustractions : le premier nombre est toujours ajouté,
  // le total en cours ne passe jamais sous zéro, le résultat vaut au moins 1.
  const NB_GRADES = 40;
  const NB_GRADES_COLONNE = 10;
  const PREMIER_COLONNE = NB_GRADES + 1;
  const DERNIER_GRADE = NB_GRADES + NB_GRADES_COLONNE;
  const GRADE_CALCULS = 10;
  // « 🎯 M'entraîner » : 5 calculs, la moitié du plan de l'étape (choix du
  // 22/11/2026 : un seul bouton ; « Rejouer » en redonne 5).
  const ENTRAINEMENT_CALCULS = Object.freeze([5]);
  const GRADE_REUSSI = 7;
  const GRADE_PRESQUE = 5;
  const SEUIL_COLONNE = 8;
  const ETAPE_FLASH = 100;
  const ETAPE_COLONNE = 200;
  // Les quatre groupes de l'écran des grades (le premier numéro de chacun).
  const GROUPES_GRADES = Object.freeze([
    Object.freeze({nom: "Débutant", debut: 1}),
    Object.freeze({nom: "Intermédiaire", debut: 11}),
    Object.freeze({nom: "Avancé", debut: 21}),
    Object.freeze({nom: "Expert", debut: 31})
  ]);
  const gradeValide = n => Number.isInteger(n) && n >= 1 && n <= NB_GRADES;
  const estGradeColonne = n => Number.isInteger(n) && n >= PREMIER_COLONNE && n <= DERNIER_GRADE;
  const gradeExiste = n => gradeValide(n) || estGradeColonne(n);
  // Le dernier grade de la même liste (40 pour le Flash, 50 pour la Colonne).
  const dernierDeSaListe = n => (estGradeColonne(n) ? DERNIER_GRADE : NB_GRADES);

  const fois = (valeur, k) => Array.from({length: k}, () => valeur);
  // Tous les gestes du calcul sont parmi ceux-ci.
  const seulement = (...codes) => a => CODES_GESTES.every(code => !a.n[code] || codes.indexOf(code) >= 0);
  const contient = (ev, code) => ev.some(e => e[0] === code);
  const entre = (x, mini, maxi) => x >= mini && x <= maxi;
  // Les retenues qu'UN nombre fait naître en entrant : les tiges où il en
  // pose une, et s'il en fait courir une en cascade.
  const retenuesDe = ev => ({
    tiges: ev.filter(e => e[0] === "R" || e[0] === "RC").map(e => e[1]).sort().join(""),
    cascade: contient(ev, "CASC")
  });
  // Un seul nombre du calcul fait naître des retenues, et ce sont celles-là.
  const unSeulGeste = test => a => {
    const avec = a.parTerme.map(retenuesDe).filter(r => r.tiges || r.cascade);
    return avec.length === 1 && test(avec[0]);
  };
  // Un profil : les largeurs des nombres (l), les signes (rien : des
  // additions ; moins : k → k nombres enlevés à des places tirées au hasard,
  // jamais la première ; moins : "libre" → chaque nombre après le premier
  // est ajouté ou enlevé, au moins un enlevé ; signes : la liste des suites
  // de signes permises), et ce que le calcul doit vérifier (ok). Un profil
  // « places » borne les rangs des nombres enlevés (comptés à partir de 0).
  const libre = (largeurs, mini, maxi) => Object.freeze({l: largeurs, ok: a => entre(a.retenues, mini, maxi), hasard: true});
  const PROFILS = Object.freeze({
    // ---- un chiffre, additions ----
    direct2: {l: fois(1, 2), ok: seulement("D")},
    direct3: {l: fois(1, 3), ok: seulement("D")},
    complement2e: {l: fois(1, 3), ok: a => a.n.P === 1 && seulement("D", "P")(a) && contient(a.parTerme[1], "P")},
    complement3e: {l: fois(1, 3), ok: a => a.n.P === 1 && seulement("D", "P")(a) && contient(a.parTerme[2], "P")},
    retenue2: {l: fois(1, 2), ok: a => a.n.R === 1 && a.retenues === 1},
    retenue2e: {l: fois(1, 3), ok: a => a.n.R === 1 && seulement("D", "R", "rD")(a) && contient(a.parTerme[1], "R")},
    retenue3e: {l: fois(1, 3), ok: a => a.n.R === 1 && seulement("D", "R", "rD")(a) && contient(a.parTerme[2], "R")},
    uneRetenue3: {l: fois(1, 3), ok: a => a.n.R === 1 && a.retenues === 1},
    uneRetenueComplement3: {l: fois(1, 3), ok: a => a.n.RC === 1 && a.retenues === 1},
    uneRetenue4: {l: fois(1, 4), ok: a => a.retenues === 1},
    deuxRetenues5: {l: fois(1, 5), ok: a => a.retenues === 2},
    // ---- deux chiffres, additions ----
    deuxUnSans: {l: [2, 1], ok: a => a.retenues === 0},
    deuxUnAvec: {l: [2, 1], ok: a => a.tigesRetenue === "0" && !a.n.CASC && a.total < 100},
    deuxUnUn: {l: [2, 1, 1], ok: a => a.tigesRetenue === "0" && !a.n.CASC && entre(a.retenues, 1, 2) && a.total < 100},
    aucune22: {l: [2, 2], ok: a => a.retenues === 0},
    unites22: {l: [2, 2], ok: a => a.tigesRetenue === "0" && !a.n.CASC},
    centaine22: {l: [2, 2], ok: a => a.tigesRetenue === "1" && !a.n.CASC},
    double22: {l: [2, 2], ok: a => a.tigesRetenue === "01" && !a.n.CASC},
    cascade22: {l: [2, 2], ok: a => a.n.CASC >= 1},
    // ---- trois chiffres, additions ----
    aucune33: {l: [3, 3], ok: a => a.retenues === 0},
    dizaines33: {l: [3, 3], ok: a => a.tigesRetenue === "0" && !a.n.CASC},
    centaines33: {l: [3, 3], ok: a => a.tigesRetenue === "1" && !a.n.CASC},
    millier33: {l: [3, 3], ok: a => a.tigesRetenue === "2" && !a.n.CASC},
    double33: {l: [3, 3], ok: a => a.tigesRetenue.length === 2 && !a.n.CASC},
    cascade33: {l: [3, 3], ok: a => a.n.CASC >= 1},
    // ---- Colonne : un chiffre, + et − ----
    cDirect: {l: fois(1, 3), moins: "libre", ok: seulement("D", "d")},
    cComplementPlus: {l: fois(1, 3), moins: "libre", ok: a => a.n.P === 1 && a.n.p === 0 && !a.retenues && !a.emprunts},
    cComplementMoins: {l: fois(1, 3), moins: "libre", ok: a => a.n.p === 1 && a.n.P === 0 && !a.retenues && !a.emprunts},
    cSansRetenue5: {l: fois(1, 5), moins: 2, ok: a => !a.retenues && !a.emprunts && a.n.P + a.n.p >= 1},
    cRetenuePuisEmprunt: {l: fois(1, 3), signes: [[1, 1, -1]], ok: a => a.n.R === 1 && a.n.E === 1 && a.retenues === 1 && a.emprunts === 1},
    // C06 — deux groupes qui ne se recouvrent pas : 5 calculs avec UNE retenue
    // avec complément à 5 et aucun emprunt de cette sorte (7 + 6, 1 + 7 + 6,
    // 8 + 6 − 1 : les additions seules en sont) ; 5 AUTRES avec un emprunt
    // avec complément à 5 et aucune retenue de cette sorte (8 + 5 − 6).
    cRetenueComplement: {l: fois(1, 3), moins: "possible", ok: a => a.n.RC === 1 && a.retenues === 1 && !a.n.EC},
    cEmpruntComplement: {l: fois(1, 3), moins: "libre", ok: a => a.n.EC === 1 && !a.n.RC},
    cMele5: {l: fois(1, 5), moins: 2, ok: a => a.retenues >= 1 && a.emprunts >= 1},
    cMele7: {l: fois(1, 7), moins: 3, ok: a => a.retenues >= 1 && a.emprunts >= 1},
    // ---- Colonne : deux chiffres ----
    cSansEmprunt22: {l: [2, 2], signes: [[1, -1]], ok: a => a.emprunts === 0},
    cEmprunt22: {l: [2, 2], signes: [[1, -1]], ok: a => a.emprunts === 1},
    // C12 — le geste annoncé est celui d'UN nombre, le 2e ou le 3e ; l'autre
    // entre sans aucune retenue (64 + 52 + 31 : seul 52 fait passer la centaine).
    cCentaine222: {l: fois(2, 3), ok: unSeulGeste(r => r.tiges === "1" && !r.cascade)},
    cDouble222: {l: fois(2, 3), ok: unSeulGeste(r => r.tiges === "01" && !r.cascade)},
    cCascade222: {l: fois(2, 3), ok: unSeulGeste(r => r.cascade)},
    cEmpruntCentaine: {l: fois(2, 3), signes: [[1, 1, -1]], ok: a => a.tigesEmprunt.indexOf("1") >= 0 && !a.n.casc},
    cEmpruntDizaine: {l: fois(2, 3), signes: [[1, -1, 1], [1, 1, -1]], ok: a => a.tigesEmprunt === "0" && !a.n.casc},
    // L'emprunt en cascade (116 − 18, où la dizaine vide fait prendre sur la
    // centaine) a son étape au 3e kyu (C18) : avant elle, C13 puis C15 et C16
    // n'en posent pas. C'est la seule règle de ce tirage libre.
    cLibre25: {l: fois(2, 5), moins: 2, ok: a => !a.n.casc, hasard: true},
    // ---- Colonne : trois chiffres ----
    cRetenues33: {l: [3, 3], ok: a => entre(a.retenues, 1, 2) && !a.n.CASC},
    cEmprunts33: {l: [3, 3], signes: [[1, -1]], ok: a => entre(a.emprunts, 1, 2) && !a.n.casc},
    cCascadeMoins33: {l: [3, 3], signes: [[1, -1]], ok: a => a.n.casc >= 1},
    cLibre33: {l: fois(3, 3), signes: [[1, -1, 1], [1, 1, -1]], hasard: true},
    cLibre35: {l: fois(3, 5), moins: 2, hasard: true},
    cLibre37: {l: fois(3, 7), moins: 3, hasard: true},
    // ---- les colonnes de la feuille japonaise ----
    // Les formes du 暗算検定 (みとり暗算) : 5 nombres de 2 chiffres ; 5, 7 ou 10
    // nombres de 3 chiffres ; et 10 nombres de 3 chiffres dont 4 enlevés,
    // jamais le 1er, le 2e ni le dernier. Tirées comme tous les profils
    // (relecture Codex du 22/11/2026 : l'ancien tirage de « s10 » retouchait
    // certains nombres et pouvait rendre une colonne sans soustraction).
    d5: {l: fois(2, 5), hasard: true},
    t5: {l: fois(3, 5), hasard: true},
    t7: {l: fois(3, 7), hasard: true},
    t10: {l: fois(3, 10), hasard: true},
    s10: {l: fois(3, 10), moins: 4, places: [2, 8], hasard: true}
  });
  Object.keys(PROFILS).forEach(nom => Object.freeze(PROFILS[nom]));
  const P = PROFILS;
  // Deux étapes qui portent le MÊME plan (le même objet) ont le même
  // tirage : seul le temps change de l'une à l'autre.
  const plansEntiers = new Map();
  const tous = profil => {
    if (!plansEntiers.has(profil)) plansEntiers.set(profil, [[profil, 10]]);
    return plansEntiers.get(profil);
  };
  const sansCascade33 = Object.freeze({choix: [P.cRetenues33, P.cEmprunts33], l: [3, 3], moins: "libre"});
  const LIBRES = {
    u6: libre(fois(1, 6), 2, 3), u7: libre(fois(1, 7), 2, 4), u10: libre(fois(1, 10), 4, 5),
    d3: libre(fois(2, 3), 1, 3), d4: libre(fois(2, 4), 2, 4), d5: libre(fois(2, 5), 3, 5), d6: libre(fois(2, 6), 4, 6),
    d7: libre(fois(2, 7), 5, 7), d8: libre(fois(2, 8), 5, 9), d10: libre(fois(2, 10), 7, 11), d12: libre(fois(2, 12), 9, 13),
    d15: libre(fois(2, 15), 12, 16),
    t3: libre(fois(3, 3), 2, 4), t4: libre(fois(3, 4), 3, 6), t6: libre(fois(3, 6), 6, 9), t8: libre(fois(3, 8), 9, 12),
    t10: libre(fois(3, 10), 11, 16), t12: libre(fois(3, 12), 14, 19), t15: libre(fois(3, 15), 18, 24)
  };
  const L = LIBRES;
  const JAPONAIS = true;
  const plan22 = [[P.aucune22, 2], [P.unites22, 2], [P.centaine22, 2], [P.double22, 2], [P.cascade22, 2]];
  const plan33 = [[P.dizaines33, 2], [P.centaines33, 2], [P.millier33, 2], [P.double33, 2], [P.cascade33, 2]];
  const planFeuille = [[P.t10, 6], [P.s10, 4]];
  // Le Flash : [grade, plan (ou « dix »), temps de TOUTE la série en dixièmes
  // de seconde, épreuve japonaise ?, exemple, ce que l'étape travaille,
  // la 2e ligne de la fiche quand il n'y a pas d'exemple]. Du 10e kyu au
  // 20e dan, la dernière étape de chaque grade est l'épreuve japonaise de
  // ce grade (kentei.soroban-soft.com), au même format et au même temps.
  const SANS = "sans complément ni retenue";
  const LIGNES_FLASH = [
    [1, tous(P.direct2), 40, false, "2 + 5", SANS],
    [1, tous(P.direct3), 60, false, "1 + 2 + 5", SANS],
    [2, "complements", 40, false, "4 + 3", "un complément à 5 : les dix calculs possibles"],
    [2, [[P.complement2e, 5], [P.complement3e, 5]], 60, false, "1 + 3 + 2", "un complément à 5 par calcul"],
    [3, tous(P.retenue2), 40, false, "8 + 4", "une retenue"],
    [3, [[P.retenue2e, 5], [P.retenue3e, 5]], 60, false, "2 + 6 + 4", "une retenue par calcul"],
    [4, "retenues", 40, false, "7 + 6", "une retenue avec complément à 5 : les dix calculs possibles"],
    [4, [[P.uneRetenue3, 5], [P.uneRetenueComplement3, 5]], 60, false, "1 + 7 + 6", "une retenue par calcul, avec ou sans complément à 5"],
    [5, tous(P.uneRetenue4), 80, false, null, "une seule retenue par calcul", ["1", "seule retenue par calcul"]],
    [5, tous(P.deuxRetenues5), 100, false, null, "deux retenues par calcul", ["2", "retenues par calcul"]],
    [6, tous(L.u6), 120], [6, tous(L.u7), 140],
    [7, tous(L.u10), 200], [7, tous(L.u10), 150], [8, tous(L.u10), 120], [8, tous(L.u10), 100],
    [9, tous(P.deuxUnSans), 40, false, "24 + 3", "sans retenue"],
    [9, tous(P.deuxUnAvec), 40, false, "27 + 6", "une retenue vers les dizaines"],
    [9, tous(P.deuxUnUn), 60, false, "27 + 6 + 8", "une ou deux retenues"],
    [10, tous(P.aucune22), 40, false, "24 + 35", "sans retenue"],
    [10, tous(P.unites22), 40, false, "27 + 35", "une retenue vers les dizaines"],
    [11, tous(P.centaine22), 40, false, "64 + 52", "on dépasse 100, sans autre retenue"],
    [11, tous(P.double22), 40, false, "57 + 68", "deux retenues : dizaines et centaines"],
    [11, plan22, 40, JAPONAIS, "67 + 35", "tous les cas mêlés"],
    [12, tous(L.d3), 60, JAPONAIS], [13, tous(L.d4), 70, JAPONAIS], [14, tous(L.d5), 80, JAPONAIS], [15, tous(L.d6), 90, JAPONAIS],
    [16, tous(L.d7), 100, JAPONAIS], [17, tous(L.d8), 110, JAPONAIS], [18, tous(L.d10), 120, JAPONAIS],
    [19, tous(L.d12), 140], [19, tous(L.d12), 120, JAPONAIS],
    [20, tous(L.d15), 150], [20, tous(L.d15), 130, JAPONAIS],
    [21, tous(L.d15), 115], [21, tous(L.d15), 100, JAPONAIS],
    [22, tous(P.aucune33), 30, false, "312 + 245", "sans retenue"],
    [22, plan33, 30, false, "196 + 207", "tous les cas de retenue mêlés"],
    [22, tous(L.t3), 40], [22, tous(L.t4), 40, JAPONAIS],
    [23, tous(L.t6), 50, JAPONAIS], [24, tous(L.t8), 60, JAPONAIS], [25, tous(L.t10), 70, JAPONAIS], [26, tous(L.t12), 80, JAPONAIS],
    [27, tous(L.t15), 100], [27, tous(L.t15), 90], [27, tous(L.t15), 80, JAPONAIS],
    [28, tous(L.t15), 70], [28, tous(L.t15), 60, JAPONAIS],
    [29, tous(L.t15), 52], [29, tous(L.t15), 45, JAPONAIS],
    [30, tous(L.t15), 40], [30, tous(L.t15), 35], [30, tous(L.t15), 30, JAPONAIS]
  ].concat([28, 26, 24, 22, 20, 19, 18, 17, 16, 15].map((dixiemes, i) => [31 + i, tous(L.t15), dixiemes, JAPONAIS]));
  // La Colonne : [grade, plan, chrono des 10 calculs en secondes (0 :
  // libre), épreuve japonaise ?, exemple, ce que l'étape travaille, la 2e
  // ligne de la fiche]. Chaque premier chrono reprend un tirage déjà réussi
  // en temps libre. Les colonnes « de la feuille japonaise » sont celles du
  // 暗算検定 (みとり暗算, shuzan.jp) déjà tirées par le lot « grades-colonne ».
  const LIGNES_COLONNE = [
    [41, tous(P.cDirect), 0, false, "2 + 6 − 3", SANS],
    [41, [[P.cComplementPlus, 5], [P.cComplementMoins, 5]], 0, false, "4 + 3 − 2", "un complément à 5, en + ou en −"],
    [42, tous(P.cSansRetenue5), 0, false, null, "avec des compléments à 5", ["2", "nombres à enlever, sans retenue"]],
    [42, tous(P.uneRetenue3), 0, false, "2 + 6 + 4", "une retenue"],
    [43, tous(P.cRetenuePuisEmprunt), 0, false, "8 + 5 − 4", "une retenue en +, puis une en −"],
    [43, [[P.cRetenueComplement, 5], [P.cEmpruntComplement, 5]], 0, false, "7 + 6 − 2", "retenues avec complément à 5, en + ou en −"],
    [44, tous(P.cMele5), 0, false, null, "des retenues en + et en −", ["2", "nombres à enlever, avec des retenues"]],
    [44, tous(P.cMele7), 0, false, null, "des retenues en + et en −", ["3", "nombres à enlever, avec des retenues"]],
    [44, tous(P.cMele7), 180, false, null, "des retenues en + et en −", ["3", "nombres à enlever, avec des retenues"]],
    [45, [[P.aucune22, 5], [P.cSansEmprunt22, 5]], 0, false, "68 − 25", "sans retenue, en + ou en −"],
    [45, [[P.unites22, 5], [P.cEmprunt22, 5]], 0, false, "31 − 14", "une retenue, en + ou en −"],
    [46, [[P.cCentaine222, 4], [P.cDouble222, 3], [P.cCascade222, 3]], 0, false, "64 + 52 + 31", "on dépasse 100"],
    [46, [[P.cEmpruntCentaine, 4], [P.cEmpruntDizaine, 6]], 0, false, "64 + 52 − 38", "une soustraction avec retenue"],
    [47, tous(P.d5), 0, JAPONAIS],
    [47, tous(P.cLibre25), 0, false, null, "2 nombres à enlever", ["2", "nombres à enlever, jamais le premier"]],
    [47, tous(P.cLibre25), 180, false, null, "2 nombres à enlever", ["2", "nombres à enlever, jamais le premier"]],
    [48, [[P.cRetenues33, 5], [P.cEmprunts33, 5]], 0, false, "512 − 237", "une ou deux retenues, en + ou en −"],
    [48, [[P.cCascadeMoins33, 4], [P.cascade33, 3], [sansCascade33, 3]], 0, false, "302 − 108", "des retenues en cascade"],
    [48, tous(P.cLibre33), 0, false, null, "1 nombre à enlever", ["1", "nombre à enlever, le 2e ou le 3e"]],
    [48, tous(P.t5), 0, JAPONAIS],
    [48, tous(P.cLibre35), 0, false, null, "2 nombres à enlever", ["2", "nombres à enlever, jamais le premier"]],
    [49, tous(P.t7), 0, JAPONAIS],
    [49, tous(P.cLibre37), 0, false, null, "3 nombres à enlever", ["3", "nombres à enlever, jamais le premier"]],
    [50, tous(P.t10), 0],
    [50, planFeuille, 0, JAPONAIS, null, "4 colonnes en + et −", ["4", "nombres à enlever dans 4 calculs sur 10"]],
    [50, planFeuille, 240, false, null, "4 colonnes en + et −", ["4", "nombres à enlever dans 4 calculs sur 10"]]
  ];
  function construireEtapes(lignes, base, colonne) {
    const parGrade = {};
    lignes.forEach(ligne => { parGrade[ligne[0]] = (parGrade[ligne[0]] || 0) + 1; });
    const rangs = {};
    const plans = new Map();
    const figer = plan => {
      if (!plans.has(plan)) plans.set(plan, Object.freeze(plan.map(([profil, combien]) => Object.freeze([profil, combien]))));
      return plans.get(plan);
    };
    return lignes.map((ligne, i) => {
      const [grade, plan, duree, japonais, exemple, travail, repere] = ligne;
      rangs[grade] = (rangs[grade] || 0) + 1;
      const dix = typeof plan === "string" ? plan : null;
      const profils = dix ? Object.freeze([]) : figer(plan);
      const largeurs = dix ? [1, 1] : profils[0][0].l;
      const toutesLargeurs = dix ? [1, 1] : profils.reduce((toutes, [profil]) => toutes.concat(profil.l), []);
      const avecMoins = profils.some(([profil]) => Boolean(profil.moins || profil.signes));
      return Object.freeze({
        numero: base + i + 1,
        code: `${colonne ? "C" : "F"}${String(i + 1).padStart(2, "0")}`,
        colonne,
        grade,
        rang: rangs[grade],
        sur: parGrade[grade],
        nombres: profils.reduce((maxi, [profil]) => Math.max(maxi, profil.l.length), largeurs.length),
        largeurs: Object.freeze(largeurs.slice()),
        chiffresMin: Math.min(...toutesLargeurs),
        chiffresMax: Math.max(...toutesLargeurs),
        operations: avecMoins ? "plusmoins" : "plus",
        dixiemes: colonne ? 0 : duree,
        chrono: colonne ? duree : 0,
        seuil: colonne ? SEUIL_COLONNE : GRADE_REUSSI,
        dix,
        plan: profils,
        hasard: !dix && profils.every(([profil]) => Boolean(profil.hasard)),
        japonais: Boolean(japonais),
        exemple: exemple || null,
        travail: travail || "",
        repere: repere ? Object.freeze(repere.slice()) : null
      });
    });
  }
  const ETAPES_FLASH = Object.freeze(construireEtapes(LIGNES_FLASH, ETAPE_FLASH, false));
  const ETAPES_COLONNE = Object.freeze(construireEtapes(LIGNES_COLONNE, ETAPE_COLONNE, true));
  const ETAPES = Object.freeze(ETAPES_FLASH.concat(ETAPES_COLONNE));
  const NB_ETAPES_FLASH = ETAPES_FLASH.length;
  const NB_ETAPES_COLONNE = ETAPES_COLONNE.length;
  // L'étape de ce numéro, ou null.
  function etape(numero) {
    if (!Number.isInteger(numero)) return null;
    if (numero > ETAPE_COLONNE) return ETAPES_COLONNE[numero - ETAPE_COLONNE - 1] || null;
    return numero > ETAPE_FLASH ? ETAPES_FLASH[numero - ETAPE_FLASH - 1] || null : null;
  }
  const etapeExiste = numero => Boolean(etape(numero));
  // Les étapes d'un grade, dans l'ordre.
  function etapesDuGrade(n) {
    return (estGradeColonne(n) ? ETAPES_COLONNE : ETAPES_FLASH).filter(e => e.grade === n);
  }
  // Le RANG d'une étape dans sa liste (1 … 65 en Flash, 1 … 26 en Colonne) :
  // c'est lui que le parcours garde (« etapeFlash », « etapeColonne »).
  const rangEtape = numero => (etape(numero) ? numero - (numero > ETAPE_COLONNE ? ETAPE_COLONNE : ETAPE_FLASH) : 0);
  const numeroEtape = (rang, colonne) => (colonne ? ETAPE_COLONNE : ETAPE_FLASH) + rang;
  // Le nombre de bonnes réponses sur 10 pour réussir une étape du grade n.
  function seuilGrade(n) {
    return estGradeColonne(n) ? SEUIL_COLONNE : GRADE_REUSSI;
  }

  // « 20e kyu », « 1er kyu », « 1er dan », « 20e dan » ; en Colonne, du
  // 10e kyu (41) au 1er kyu (50).
  const ordinal = k => `${k}${k === 1 ? "er" : "e"}`;
  function nomGrade(n) {
    if (estGradeColonne(n)) return `${ordinal(PREMIER_COLONNE + 10 - n)} kyu`;
    if (!gradeValide(n)) return "";
    return n <= 20 ? `${ordinal(21 - n)} kyu` : `${ordinal(n - 20)} dan`;
  }

  // Le vrai nom japonais d'un grade (lot « grades-estampe », 07/11/2026),
  // écrit en petit à côté du nom français : « 二十級 » (20e kyu) … « 一級 »
  // (1er kyu), « 初段 » (1er dan, « shodan »), « 二段 » … « 二十段 ».
  const KANJI_CHIFFRES = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  function kanjiNombre(k) {
    if (k <= 10) return KANJI_CHIFFRES[k];
    if (k < 20) return `十${KANJI_CHIFFRES[k - 10]}`;
    return "二十";
  }
  function nomJaponais(n) {
    if (estGradeColonne(n)) return `${kanjiNombre(PREMIER_COLONNE + 10 - n)}級`;
    if (!gradeValide(n)) return "";
    if (n <= 20) return `${kanjiNombre(21 - n)}級`;
    const d = n - 20;
    return d === 1 ? "初段" : `${kanjiNombre(d)}段`;
  }

  // Les réglages d'une étape, au format d'une séance : `etape` est son
  // numéro, `grade` celui de son grade. En Flash, le temps par nombre est en
  // millisecondes (pas forcément un nombre rond : 11,5 s pour 15 nombres) et
  // `son` est celui des réglages du Flash. En Colonne, `chrono` est le temps
  // des 10 calculs ensemble, en secondes (0 : libre) — jamais un temps par
  // calcul. `calculs` : 5 pour « 🎯 M'entraîner » ; tout autre nombre donne
  // 10, ceux d'un passage.
  function reglagesEtape(numero, son, calculs) {
    const e = etape(numero);
    if (!e) return null;
    const r = {
      operations: e.operations,
      chiffresMin: e.chiffresMin,
      chiffresMax: e.chiffresMax,
      nombres: e.nombres,
      calculs: ENTRAINEMENT_CALCULS.includes(calculs) ? calculs : GRADE_CALCULS,
      grade: e.grade,
      etape: e.numero
    };
    if (e.colonne) return Object.assign(r, {colonne: true, limite: 0, chrono: e.chrono});
    return Object.assign(r, {tempsMs: e.dixiemes * 100 / e.nombres, son: SONS.includes(son) ? son : "bip"});
  }

  // Le verdict d'un passage : « reussi » (le seuil ou plus), « presque » (à
  // deux réponses du seuil), « pasencore » ; « arrete » s'il manque des
  // calculs. `n` (facultatif) : le grade, pour son seuil (7 en Flash, 8 en
  // Colonne).
  function verdictGrade(faits, score, n) {
    const seuil = n === undefined ? GRADE_REUSSI : seuilGrade(n);
    if (faits < GRADE_CALCULS) return "arrete";
    if (score >= seuil) return "reussi";
    if (score >= seuil - (GRADE_REUSSI - GRADE_PRESQUE)) return "presque";
    return "pasencore";
  }

  // ---- Le tirage d'une étape ----
  function melanger(liste, rng) {
    for (let i = liste.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [liste[i], liste[j]] = [liste[j], liste[i]];
    }
    return liste;
  }
  // Les signes d'un calcul du profil ; false : tirage à refaire (aucun
  // nombre enlevé alors qu'il en faut un).
  function signesDuProfil(profil, rng) {
    if (profil.signes) return profil.signes[Math.floor(rng() * profil.signes.length)];
    if (profil.moins === "libre" || profil.moins === "possible") {
      const signes = profil.l.map((_, i) => (i > 0 && rng() < 0.5 ? -1 : 1));
      // « libre » : au moins un nombre enlevé ; « possible » : rien d'imposé.
      return profil.moins === "libre" && signes.indexOf(-1) < 0 ? false : signes;
    }
    if (profil.moins) {
      const [debut, fin] = profil.places || [1, profil.l.length - 1];
      const places = melanger(profil.l.map((_, i) => i).filter(i => i >= debut && i <= fin), rng).slice(0, profil.moins);
      return profil.l.map((_, i) => (places.indexOf(i) >= 0 ? -1 : 1));
    }
    return profil.l.map(() => 1);
  }
  // Un calcul du profil : des nombres tirés au hasard parmi TOUS ceux de
  // leur largeur, jusqu'au premier calcul qui convient — chaque calcul
  // possible a donc la même chance de sortir. Les tests mesurent, profil
  // par profil, qu'au moins un tirage sur deux cents convient : la borne
  // ESSAIS_MAX n'est jamais approchée.
  const ESSAIS_MAX = 100000;
  function tirerProfil(profil, rng) {
    if (profil.choix) return tirerProfil(profil.choix[Math.floor(rng() * profil.choix.length)], rng);
    for (let essai = 0; essai < ESSAIS_MAX; essai += 1) {
      const signes = signesDuProfil(profil, rng);
      if (!signes) continue;
      const termes = [];
      for (let i = 0; i < profil.l.length; i += 1) {
        const valeur = nombreDeChiffres(rng, profil.l[i]);
        if (i > 0 && valeur === termes[i - 1].valeur) break; // jamais deux fois le même nombre de suite
        termes.push({signe: signes[i], valeur});
      }
      if (termes.length < profil.l.length) continue;
      // Trois nombres : jamais « 9 + 8 − 9 », où le dernier efface le premier
      // (la réponse se lit sans calculer ; un calcul sur cinq à certaines
      // étapes de la Colonne avant cette règle, mesuré le 22/11/2026).
      if (termes.length === 3 && termes[2].valeur === termes[0].valeur && termes[2].signe !== termes[0].signe) continue;
      // Le boulier ne reste jamais vide en cours de calcul : chaque
      // sous-total vaut au moins 1 (le barème ; relecture Codex du 22/11/2026).
      let sousTotal = 0;
      if (termes.some(t => { sousTotal += t.signe * t.valeur; return sousTotal < 1; })) continue;
      const a = analyser(termes);
      if (!a || a.total < 1) continue;
      if (profil.ok && !profil.ok(a)) continue;
      return {termes, total: a.total};
    }
    throw new Error("Anzan : tirage impossible");
  }
  // Les deux étapes « les dix » : les dix compléments à 5 et les dix
  // retenues avec complément à 5 entre deux nombres d'un chiffre — trouvés
  // par le modèle, pas recopiés.
  const DIX = (() => {
    const complements = [];
    const retenues = [];
    for (let x = 1; x <= 9; x += 1) {
      for (let y = 1; y <= 9; y += 1) {
        const a = analyser([{signe: 1, valeur: x}, {signe: 1, valeur: y}]);
        if (a.n.P === 1 && !a.retenues) complements.push(Object.freeze([x, y]));
        if (a.n.RC === 1) retenues.push(Object.freeze([x, y]));
      }
    }
    return Object.freeze({complements: Object.freeze(complements), retenues: Object.freeze(retenues)});
  })();
  // Les profils des calculs d'un passage, dans le désordre : les 10 du plan,
  // ou la MOITIÉ du plan pour « 🎯 M'entraîner » en 5 calculs (la moitié de
  // chaque profil ; quand un profil compte un nombre impair de calculs, les
  // demis qui restent sont tirés au hasard : 5 + 5 donne 3 + 2 ou 2 + 3).
  function profilsDuPassage(e, calculs, rng) {
    const liste = [];
    if (calculs !== 5) e.plan.forEach(([profil, combien]) => { for (let i = 0; i < combien; i += 1) liste.push(profil); });
    else {
      const restes = [];
      e.plan.forEach(([profil, combien]) => {
        for (let i = 0; i < Math.floor(combien / 2); i += 1) liste.push(profil);
        if (combien % 2) restes.push(profil);
      });
      melanger(restes, rng);
      while (liste.length < 5 && restes.length) liste.push(restes.pop());
    }
    return melanger(liste, rng);
  }
  const REDITES_MAX = 200;
  const cleDuCalcul = calcul => calcul.termes.map(t => (t.signe < 0 ? "-" : "+") + t.valeur).join("");
  // Les calculs d'un passage (10) ou d'un entraînement (5) à une étape.
  function tirerEtape(numero, rng, calculs) {
    const e = etape(numero);
    if (!e) return [];
    const combien = calculs === 5 ? 5 : GRADE_CALCULS;
    if (e.dix) {
      return melanger(DIX[e.dix].slice(), rng).slice(0, combien)
        .map(([x, y]) => ({termes: [{signe: 1, valeur: x}, {signe: 1, valeur: y}], total: x + y}));
    }
    // Jamais deux fois le même calcul dans un passage. Aux premières étapes
    // il n'existe que 23 à 32 calculs possibles : sans cette règle, neuf
    // passages sur dix reposaient un calcul déjà fait (mesuré le 22/11/2026).
    // Chaque profil a toujours assez de calculs différents pour ses tirages
    // (le test les compte) ; la borne n'est qu'un filet : passée, le calcul
    // est gardé même déjà vu (un élève ne reste jamais bloqué). Avec un vrai
    // hasard elle est hors d'atteinte (au pire 9 chances sur 23 de retomber
    // sur un calcul déjà posé, deux cents fois de suite).
    const vus = new Set();
    return profilsDuPassage(e, combien, rng).map(profil => {
      let calcul = tirerProfil(profil, rng);
      for (let essai = 0; essai < REDITES_MAX && vus.has(cleDuCalcul(calcul)); essai += 1) calcul = tirerProfil(profil, rng);
      vus.add(cleDuCalcul(calcul));
      return calcul;
    });
  }

  function tirerSeance(reglages, rng) {
    if (reglages && etape(reglages.etape)) return tirerEtape(reglages.etape, rng, reglages.calculs);
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
  // Le point qui sépare les morceaux d'un résumé : collé au morceau d'avant
  // (espace insécable), pour qu'une ligne coupée ne commence jamais par
  // « · » (lot « entraînement 5 ou 10 », 07/11/2026).
  const POINT = "\u00a0· ";
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

  // Le résumé d'une séance (décompte, écran de fin, historique).
  // ⚡ Flash · + et − · 2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout
  // (le temps total d'un calcul à côté du temps par nombre : choix du

  // ---- Les mots des grades et des étapes ----
  // (mots de maths, choix du 22/11/2026 : « complément à 5 », « retenue »,
  // « retenue avec complément à 5 », toujours avec un exemple de calcul)
  const insecable = texte => texte.replace(/ /g, " ");
  const texteLargeur = k => (k === 1 ? "d’un chiffre" : `de ${k} chiffres`);
  // « 3 min », « 2 min 40 s » : le chrono des 10 calculs en Colonne.
  function texteChrono(s) {
    const min = Math.floor(s / 60);
    const reste = s % 60;
    return insecable(`${min ? `${min} min` : ""}${min && reste ? " " : ""}${reste || !min ? `${reste} s` : ""}`);
  }
  // « 3:00 », « 1:52 », « 0:07 » : le temps qui reste, dans la pastille.
  function texteReste(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  // « 10 nombres d'un chiffre », « 2 chiffres + 1 chiffre ».
  function texteFormat(e) {
    if (e.largeurs.every(l => l === e.largeurs[0])) return `${e.nombres} nombres ${texteLargeur(e.largeurs[0])}`;
    return e.largeurs.map(l => insecable(`${l} chiffre${l > 1 ? "s" : ""}`)).join(" + ");
  }
  // Ce qu'un grade travaille, sur sa ligne de la liste. Les grades dont les
  // étapes changent de geste ou de format ont leur phrase ; les autres
  // (même format, seul le temps change) l'écrivent d'après leurs étapes :
  // « 10 nombres d'un chiffre · en 20 s, puis en 15 s ».
  const UN_CHIFFRE = "2 puis 3 nombres d’un chiffre";
  const THEMES = Object.freeze({
    1: `${UN_CHIFFRE}${POINT}${SANS}`,
    2: `${UN_CHIFFRE}${POINT}avec un complément à 5`,
    3: `${UN_CHIFFRE}${POINT}avec une retenue`,
    4: `${UN_CHIFFRE}${POINT}retenue avec complément à 5`,
    5: `4 puis 5 nombres d’un chiffre${POINT}1 puis 2 retenues`,
    6: `6 puis 7 nombres d’un chiffre${POINT}2 s par nombre`,
    9: `2 chiffres + 1 chiffre${POINT}sans retenue, puis avec`,
    10: `2 nombres de 2 chiffres${POINT}sans retenue, puis avec`,
    11: `2 nombres de 2 chiffres${POINT}on dépasse 100`,
    22: "2, 3 puis 4 nombres de 3 chiffres",
    41: `3 nombres d’un chiffre${POINT}+ et −, sans retenue`,
    42: `Nombres d’un chiffre${POINT}sans retenue, puis avec`,
    43: `3 nombres d’un chiffre${POINT}+ et −, avec retenues`,
    44: "5 puis 7 nombres d’un chiffre, + et −",
    45: `2 nombres de 2 chiffres${POINT}+ ou −, sans retenue puis avec`,
    46: `3 nombres de 2 chiffres${POINT}on dépasse 100`,
    47: `5 nombres de 2 chiffres${POINT}+, puis + et −`,
    48: "2, 3 puis 5 nombres de 3 chiffres",
    49: `7 nombres de 3 chiffres${POINT}+, puis + et −`,
    50: `10 nombres de 3 chiffres${POINT}+, puis + et −`
  });
  function texteGrade(n) {
    if (!gradeExiste(n)) return "";
    if (THEMES[n]) return THEMES[n];
    const etapes = etapesDuGrade(n);
    const temps = etapes.map(e => secondes(e.dixiemes / 10));
    if (temps.length === 1) return `${texteFormat(etapes[0])}${POINT}${temps[0]} en tout`;
    const dernier = temps.pop();
    return `${texteFormat(etapes[0])}${POINT}en ${temps.join(", ")}, puis${temps.length > 1 ? "" : " en"} ${dernier}`;
  }
  // Ce qu'une étape travaille, en une ligne (la ligne du grade en cours, le
  // résumé d'une séance) : « une retenue vers les dizaines, comme 27 + 6 »,
  // « 10 nombres en 15 s », « 3 nombres à enlever · 10 calculs en 3 min ».
  // `sansChrono` : à l'entraînement (5 calculs, pas de chrono), le temps des
  // dix calculs ne se dit pas.
  function texteEtape(numero, sansChrono) {
    const e = etape(numero);
    if (!e) return "";
    let texte;
    if (e.exemple) texte = `${e.travail}, comme ${insecable(e.exemple)}`;
    else if (e.travail) texte = e.travail;
    else if (e.colonne) texte = texteFormat(e);
    else texte = `${e.nombres} nombres en ${secondes(e.dixiemes / 10)}`;
    return e.chrono && !sansChrono ? `${texte}${POINT}10 calculs en ${texteChrono(e.chrono)}` : texte;
  }
  // La même chose en plus court, pour la ligne du grade en cours dans la
  // liste (après « Étape 2 sur 3 · », elle doit tenir sur deux lignes au
  // téléphone) : « comme 27 + 6 », « 10 calculs en 3 min », « 10 nombres
  // en 15 s ».
  function texteEtapeCourt(numero) {
    const e = etape(numero);
    if (!e) return "";
    if (e.exemple) return `comme ${insecable(e.exemple)}`;
    if (e.chrono) return `10 calculs en\u00a0${texteChrono(e.chrono)}`;
    return texteEtape(numero);
  }
  // « Étape 2 sur 3 » ; rien pour un grade à une seule étape.
  function texteRangEtape(numero) {
    const e = etape(numero);
    return e && e.sur > 1 ? `Étape ${e.rang} sur ${e.sur}` : "";
  }
  // Les quatre lignes de la fiche d'une étape : [en gras, la phrase].
  function reglesEtape(numero) {
    const e = etape(numero);
    if (!e) return [];
    const faire = e.operations === "plusmoins" ? "à ajouter ou à enlever" : "à additionner";
    const quoi = e.largeurs.every(l => l === e.largeurs[0])
      ? `nombres ${texteLargeur(e.largeurs[0])} ${faire}`
      : `nombres ${faire} : ${texteFormat(e)}`;
    let repere;
    if (e.repere) repere = [insecable(e.repere[0]), e.repere[1]];
    else if (e.exemple) repere = [insecable(e.exemple), `par exemple : ${e.travail}`];
    else {
      const k = e.largeurs[0];
      repere = [insecable(`${10 ** (k - 1)} à ${10 ** k - 1}`), "des nombres tirés au hasard"];
    }
    let temps;
    if (!e.colonne) temps = [secondes(e.dixiemes / 10), "pour voir les nombres d’un calcul"];
    else if (e.chrono) temps = [texteChrono(e.chrono), "pour les 10 calculs"];
    else temps = ["Libre", "pas de chrono à cette étape"];
    return [
      [String(e.nombres), quoi],
      repere,
      temps,
      [`${e.seuil}/${GRADE_CALCULS}`, "bonnes réponses sur 10 calculs pour réussir l’étape"]
    ];
  }

  // Le résumé d'une séance (décompte, écran de fin, historique).
  // ⚡ Flash · + et − · 2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout
  // (le temps total d'un calcul à côté du temps par nombre : choix du
  // 07/11/2026, « 0,8 s » seul se lisait comme le temps de tout le calcul).
  function resume(mode, r, {avecMode = true} = {}) {
    // Une étape d'un grade : « 🥋 12e kyu · étape 2 · une retenue vers les
    // dizaines, comme 27 + 6 » (le passage) ou « 🎯 … » (l'entraînement).
    if ((mode === "grade" || mode === "entrainement") && r && etape(r.etape)) {
      const e = etape(r.etape);
      const tete = avecMode ? [`${mode === "grade" ? "🥋" : "🎯"} ${nomGrade(e.grade)}${e.colonne ? `${POINT}Colonne` : ""}`] : [];
      if (e.sur > 1) tete.push(`étape\u00a0${e.rang}`);
      return tete.concat([texteEtape(e.numero, mode === "entrainement")]).join(POINT);
    }
    const morceaux = [];
    if (avecMode) morceaux.push(mode === "flash" ? "⚡ Flash" : "📝 Colonne");
    if (r.operations === "plusmoins") morceaux.push("+ et −");
    morceaux.push(texteChiffres(r));
    morceaux.push(`${r.nombres} nombres`);
    if (mode === "flash") {
      morceaux.push(`${secondes(tempsEnSecondes(r.temps))}\u00a0par\u00a0nombre`);
      morceaux.push(`${secondes(r.nombres * tempsEnSecondes(r.temps))}\u00a0en\u00a0tout`);
    }
    else if (r.limite) morceaux.push(`${r.limite} s`);
    return morceaux.join(POINT);
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
    gestes,
    analyser,
    CODES_GESTES,
    PROFILS,
    DIX,
    ETAPES,
    ETAPES_FLASH,
    ETAPES_COLONNE,
    NB_ETAPES_FLASH,
    NB_ETAPES_COLONNE,
    ETAPE_FLASH,
    ETAPE_COLONNE,
    etape,
    etapeExiste,
    etapesDuGrade,
    rangEtape,
    numeroEtape,
    reglagesEtape,
    tirerEtape,
    tirerProfil,
    texteEtape,
    texteEtapeCourt,
    texteRangEtape,
    texteChrono,
    texteReste,
    reglesEtape,
    NB_GRADES,
    GRADE_CALCULS,
    ENTRAINEMENT_CALCULS,
    GRADE_REUSSI,
    GRADE_PRESQUE,
    SEUIL_COLONNE,
    GROUPES_GRADES,
    NB_GRADES_COLONNE,
    PREMIER_COLONNE,
    DERNIER_GRADE,
    estGradeColonne,
    gradeExiste,
    dernierDeSaListe,
    seuilGrade,
    nomGrade,
    nomJaponais,
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
