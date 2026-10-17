(function initQuestionnaire(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_QUESTIONNAIRE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // Le QUESTIONNAIRE d'une séance en direct (lot 2, 15/10/2026) : lecture et
  // vérification du fichier que le professeur ouvre dans l'écran du tableau.
  // Logique pure, sans DOM : la page prof/direct.php s'en sert, les tests du
  // dépôt aussi (tests/suivi-questionnaire.test.mjs).
  //
  // C'EST LE CONTRAT. Défi tables (lot 3) puis Automatismes fabriqueront des
  // questionnaires de cette forme ; le format est décrit pour un humain dans
  // _serveur/QUESTIONNAIRE.md. Un fichier, en JSON :
  //
  //   {
  //     "format": "mathsgo-questionnaire", "version": 1,
  //     "titre": "Fractions — rituel du jeudi",
  //     "chrono": 30,                      (facultatif : secondes, pour toutes)
  //     "questions": [
  //       { "enonce": "Combien vaut $\\frac{3}{4}+\\frac{1}{8}$ ?",
  //         "image": "data:image/svg+xml;base64,…",      (facultatif)
  //         "choix": ["$\\frac{4}{12}$", {"image": "data:…", "texte": "…"}, …],
  //         "bonne": "B",                   (facultatif : sondage sans bonne réponse)
  //         "chrono": null,                 (facultatif : null = pas de chrono ici)
  //         "id": "fractions-03" }          (facultatif : identifiant stable)
  //     ]
  //   }
  //
  // Le questionnaire ne quitte JAMAIS le navigateur du professeur : le serveur
  // ne reçoit, pour chaque question, que le nombre de réponses possibles et la
  // durée du chrono ; la bonne réponse seulement au moment de « Dévoiler ».
  //
  // Ce qu'on vérifie ici est aussi ce qui protège la page : les textes ne
  // seront jamais du HTML (textContent, et KaTeX sans « trust »), et une image
  // n'est acceptée que sous la forme d'une adresse « data: » d'un type d'image
  // connu — rien qui aille chercher quoi que ce soit ailleurs.

  const FORMAT = "mathsgo-questionnaire";
  const VERSION = 1;
  const LETTRES = ["A", "B", "C", "D", "E", "F"];
  const TYPES = ["choix"];
  // Les mêmes bornes que le serveur (lib/direct.php) : MAX_QUESTIONS_DIRECT,
  // DUREE_DIRECT_MIN et DUREE_DIRECT_MAX.
  const MAX_QUESTIONS = 80;
  const CHRONO_MIN = 5;
  const CHRONO_MAX = 600;
  const MAX_OCTETS_FICHIER = 20 * 1024 * 1024;
  const MAX_IMAGE = 5 * 1024 * 1024;
  const MAX_TITRE = 120;
  const MAX_ENONCE = 2000;
  const MAX_REPONSE = 500;
  const IMAGE_PERMISE = /^data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;
  const ID_PERMIS = /^[A-Za-z0-9._:-]{1,80}$/;

  function lettre(i) { return LETTRES[i] || "?"; }

  // Le texte COLLÉ (17/10/2026) : la réponse d'une IA arrive souvent avec ce
  // qui l'entoure — « ```json » avant, « ``` » après, une phrase d'annonce.
  // On garde ce qui va de la première « { » à la dernière « } ». Un fichier
  // propre n'y perd rien ; un texte sans accolade reste tel quel (et sera
  // refusé avec la phrase habituelle).
  function extraire(texte) {
    const source = String(texte).replace(/^\uFEFF/, "").trim();
    if (source.startsWith("{")) return source;
    const debut = source.indexOf("{");
    const fin = source.lastIndexOf("}");
    return debut >= 0 && fin > debut ? source.slice(debut, fin + 1) : source;
  }

  // L'EXEMPLE (17/10/2026) : celui de _serveur/questionnaires/, recopié ici
  // pour le bouton « ▶ Essayer avec l'exemple » du tableau — rien à aller
  // chercher, rien de plus à déposer. Un test du dépôt vérifie que les deux
  // restent identiques.
  const EXEMPLE = {
    "format": "mathsgo-questionnaire",
    "version": 1,
    "titre": "Exemple — fractions, puissances, figures",
    "chrono": 30,
    "questions": [
      {
        "id": "exemple-01",
        "enonce": "Combien vaut $\\frac{3}{4}+\\frac{1}{8}$ ?",
        "choix": [
          "$\\frac{4}{12}$",
          "$\\frac{7}{8}$",
          "$\\frac{4}{8}$",
          "$1$"
        ],
        "bonne": "B"
      },
      {
        "id": "exemple-02",
        "enonce": "Quelle est l’écriture décimale de $10^{-3}$ ?",
        "choix": [
          "0,001",
          "−1 000",
          "0,000 1",
          "−0,001"
        ],
        "bonne": "A"
      },
      {
        "id": "exemple-03",
        "enonce": "Quelle est l’aire de ce rectangle ?",
        "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MjAiIGhlaWdodD0iMjQwIiB2aWV3Qm94PSIwIDAgNDIwIDI0MCI+PHJlY3Qgd2lkdGg9IjQyMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSI0MCIgeT0iMzYiIHdpZHRoPSIyODAiIGhlaWdodD0iMTA1IiBmaWxsPSIjZTZmNmY1IiBzdHJva2U9IiMxMDI5NGEiIHN0cm9rZS13aWR0aD0iMyIvPjx0ZXh0IHg9IjE4MCIgeT0iMTgwIiBmb250LWZhbWlseT0iRGVqYVZ1IFNhbnMsIFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzEwMjk0YSI+OCBjbTwvdGV4dD48dGV4dCB4PSIzMzQiIHk9Ijk4IiBmb250LWZhbWlseT0iRGVqYVZ1IFNhbnMsIFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNiIgZmlsbD0iIzEwMjk0YSI+MyBjbTwvdGV4dD48L3N2Zz4=",
        "choix": [
          "11 cm²",
          "22 cm²",
          "24 cm²",
          "24 cm"
        ],
        "bonne": "C",
        "chrono": 45
      },
      {
        "id": "exemple-04",
        "enonce": "Quelle figure a exactement deux axes de symétrie ?",
        "choix": [
          {
            "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMjAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgMjIwIDE2MCI+PHJlY3Qgd2lkdGg9IjIyMCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmYiLz48cG9seWdvbiBwb2ludHM9IjMwLDQwIDE5MCw0MCAxOTAsMTIwIDMwLDEyMCIgZmlsbD0iI2U2ZjZmNSIgc3Ryb2tlPSIjMTAyOTRhIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4="
          },
          {
            "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMjAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgMjIwIDE2MCI+PHJlY3Qgd2lkdGg9IjIyMCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmYiLz48cG9seWdvbiBwb2ludHM9IjYwLDMwIDE2MCwzMCAxNjAsMTMwIDYwLDEzMCIgZmlsbD0iI2U2ZjZmNSIgc3Ryb2tlPSIjMTAyOTRhIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4="
          },
          {
            "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMjAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgMjIwIDE2MCI+PHJlY3Qgd2lkdGg9IjIyMCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmYiLz48cG9seWdvbiBwb2ludHM9IjExMCwyMiAxOTAsMTQwIDMwLDE0MCIgZmlsbD0iI2U2ZjZmNSIgc3Ryb2tlPSIjMTAyOTRhIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4="
          },
          {
            "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMjAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgMjIwIDE2MCI+PHJlY3Qgd2lkdGg9IjIyMCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmYiLz48cG9seWdvbiBwb2ludHM9IjcwLDQwIDE1MCw0MCAxOTUsMTI1IDI1LDEyNSIgZmlsbD0iI2U2ZjZmNSIgc3Ryb2tlPSIjMTAyOTRhIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4="
          }
        ],
        "bonne": "A",
        "chrono": null
      },
      {
        "id": "exemple-05",
        "enonce": "Combien vaut $(-3)\\times(-4)$ ?",
        "choix": [
          "$-12$",
          "$12$",
          "$-7$",
          "$7$"
        ],
        "bonne": "B"
      },
      {
        "id": "exemple-06",
        "enonce": "Quelle est la solution de l’équation $2x+5=17$ ?",
        "choix": [
          "$6$",
          "$11$",
          "$12$",
          "$6{,}5$",
          "$24$"
        ],
        "bonne": "A",
        "chrono": 60
      },
      {
        "id": "exemple-07",
        "enonce": "Vrai ou faux : $\\sqrt{16}=4$",
        "choix": [
          "Vrai",
          "Faux"
        ],
        "bonne": "A",
        "chrono": 15
      },
      {
        "id": "exemple-08",
        "enonce": "Les fractions, pour toi, c’est…",
        "choix": [
          "facile",
          "ça dépend",
          "encore difficile"
        ],
        "chrono": null
      }
    ]
  };
  function exemple() { return JSON.stringify(EXEMPLE, null, 2); }

  // « texte $maths$ texte » → [{texte}, {maths}, {texte}]. « \$ » est un
  // dollar ordinaire. Un « $ » sans son partenaire laisse « ferme: false ».
  function decouper(texte) {
    const morceaux = [];
    let courant = "";
    let dansMaths = false;
    const source = String(texte);
    for (let i = 0; i < source.length; i += 1) {
      const c = source[i];
      if (c === "\\" && source[i + 1] === "$") {
        courant += dansMaths ? "\\$" : "$";
        i += 1;
        continue;
      }
      if (c === "$") {
        if (dansMaths) { morceaux.push({maths: courant}); }
        else if (courant) { morceaux.push({texte: courant}); }
        courant = "";
        dansMaths = !dansMaths;
        continue;
      }
      courant += c;
    }
    if (dansMaths) {
      // Formule jamais fermée : on la rend telle quelle, en texte.
      morceaux.push({texte: "$" + courant});
      return {morceaux, ferme: false};
    }
    if (courant) morceaux.push({texte: courant});
    return {morceaux, ferme: true};
  }

  // Une erreur de syntaxe JSON → un numéro de ligne, quel que soit le
  // navigateur (Chrome et Firefox disent « line … column … », les anciens
  // « position … »).
  function ligneDeLErreur(message, texte) {
    const parLigne = /line (\d+) column (\d+)/i.exec(message);
    if (parLigne) return Number(parLigne[1]);
    const parPosition = /position (\d+)/i.exec(message);
    if (parPosition) {
      const avant = texte.slice(0, Number(parPosition[1]));
      return avant.split("\n").length;
    }
    return 0;
  }

  function estObjet(valeur) {
    return valeur !== null && typeof valeur === "object" && !Array.isArray(valeur);
  }

  function lireChrono(valeur, ou, erreurs) {
    if (valeur === null) return null;
    if (!Number.isInteger(valeur) || valeur < CHRONO_MIN || valeur > CHRONO_MAX) {
      erreurs.push(`${ou} : le chrono est un nombre entier de secondes, de ${CHRONO_MIN} à ${CHRONO_MAX} (ou null pour aucun).`);
      return null;
    }
    return valeur;
  }

  function lireImage(valeur, ou, erreurs) {
    if (valeur === undefined || valeur === null || valeur === "") return null;
    if (typeof valeur !== "string" || !IMAGE_PERMISE.test(valeur.replace(/\s+/g, ""))) {
      erreurs.push(`${ou} : l'image doit être écrite dans le fichier (PNG, JPEG, GIF, WebP ou SVG, en « data:image/…;base64,… »).`);
      return null;
    }
    const propre = valeur.replace(/\s+/g, "");
    if (propre.length > MAX_IMAGE) {
      erreurs.push(`${ou} : l'image est trop lourde (5 Mo au plus).`);
      return null;
    }
    return propre;
  }

  function lireTexte(valeur, ou, max, erreurs, options) {
    if (valeur === undefined || valeur === null) return "";
    if (typeof valeur !== "string") {
      erreurs.push(`${ou} : un texte est attendu, entre guillemets.`);
      return "";
    }
    const texte = valeur.trim();
    if (texte.length > max) {
      erreurs.push(`${ou} : texte trop long (${max} caractères au plus).`);
      return "";
    }
    const {morceaux, ferme} = decouper(texte);
    if (!ferme) {
      erreurs.push(`${ou} : une formule n'est pas fermée (il manque un « $ »).`);
    } else if (options && typeof options.verifierFormule === "function") {
      morceaux.forEach(morceau => {
        if (morceau.maths === undefined) return;
        const probleme = options.verifierFormule(morceau.maths);
        if (probleme) erreurs.push(`${ou} : formule illisible « ${morceau.maths} » (${probleme}).`);
      });
    }
    return texte;
  }

  // Le cœur : texte du fichier → {ok: true, questionnaire} ou {ok: false,
  // erreurs: [phrases en français]}. options.verifierFormule(source) peut
  // rendre un message si une formule ne se dessine pas (la page s'en sert avec
  // KaTeX ; les tests du dépôt s'en passent).
  function lire(texte, options) {
    const erreurs = [];
    if (typeof texte !== "string") return {ok: false, erreurs: ["Le fichier ne se lit pas."]};
    if (texte.length > MAX_OCTETS_FICHIER) {
      return {ok: false, erreurs: ["Le fichier est trop lourd (20 Mo au plus) : allège les images."]};
    }
    const source = extraire(texte);
    let brut;
    try {
      brut = JSON.parse(source);
    } catch (erreur) {
      const ligne = ligneDeLErreur(String(erreur && erreur.message), source);
      return {ok: false, erreurs: [
        "Ce texte n'est pas un questionnaire lisible"
        + (ligne ? ` : erreur à la ligne ${ligne}` : "")
        + " (une virgule, un guillemet ou une accolade manque ou est en trop)."
      ]};
    }
    if (!estObjet(brut) || brut.format !== FORMAT) {
      return {ok: false, erreurs: ["Ce fichier n'est pas un questionnaire de séance en direct (« format » : « mathsgo-questionnaire »)."]};
    }
    if (brut.version !== VERSION) {
      return {ok: false, erreurs: [Number.isInteger(brut.version) && brut.version > VERSION
        ? "Ce questionnaire a été fait pour une version plus récente de la page : recharge-la."
        : "Version du questionnaire inconnue."]};
    }

    const titre = lireTexte(brut.titre, "Titre", MAX_TITRE, erreurs) || "Questionnaire";
    const chronoGeneral = brut.chrono === undefined ? null : lireChrono(brut.chrono, "Chrono du questionnaire", erreurs);

    if (!Array.isArray(brut.questions) || brut.questions.length === 0) {
      erreurs.push("Le questionnaire n'a aucune question (« questions » : [ … ]).");
      return {ok: false, erreurs};
    }
    if (brut.questions.length > MAX_QUESTIONS) {
      erreurs.push(`Trop de questions : ${MAX_QUESTIONS} au plus par séance.`);
      return {ok: false, erreurs};
    }

    const ids = new Set();
    const questions = brut.questions.map((q, i) => {
      const ou = `Question ${i + 1}`;
      if (!estObjet(q)) {
        erreurs.push(`${ou} : elle doit être écrite entre accolades { … }.`);
        return null;
      }
      const type = q.type === undefined ? "choix" : q.type;
      if (!TYPES.includes(type)) {
        erreurs.push(`${ou} : type « ${String(type)} » inconnu (pour l'instant : « choix »).`);
        return null;
      }
      let id = null;
      if (q.id !== undefined && q.id !== null) {
        if (typeof q.id !== "string" || !ID_PERMIS.test(q.id)) {
          erreurs.push(`${ou} : l'identifiant ne prend que lettres, chiffres, « . », « _ », « : », « - » (80 au plus).`);
        } else if (ids.has(q.id)) {
          erreurs.push(`${ou} : l'identifiant « ${q.id} » est déjà pris par une autre question.`);
        } else {
          ids.add(q.id);
          id = q.id;
        }
      }
      const enonce = lireTexte(q.enonce, `${ou}, énoncé`, MAX_ENONCE, erreurs, options);
      const image = lireImage(q.image, `${ou}, image`, erreurs);
      if (!enonce && !image) erreurs.push(`${ou} : il manque l'énoncé.`);

      if (!Array.isArray(q.choix) || q.choix.length < 2 || q.choix.length > LETTRES.length) {
        erreurs.push(`${ou} : il faut de 2 à ${LETTRES.length} réponses dans « choix ».`);
        return null;
      }
      const choix = q.choix.map((c, k) => {
        const ouReponse = `${ou}, réponse ${lettre(k)}`;
        const brutChoix = typeof c === "string" ? {texte: c} : c;
        if (!estObjet(brutChoix)) {
          erreurs.push(`${ouReponse} : un texte entre guillemets, ou { "texte": …, "image": … }.`);
          return {texte: "", image: null};
        }
        const texteChoix = lireTexte(brutChoix.texte, ouReponse, MAX_REPONSE, erreurs, options);
        const imageChoix = lireImage(brutChoix.image, `${ouReponse}, image`, erreurs);
        if (!texteChoix && !imageChoix) erreurs.push(`${ouReponse} : réponse vide.`);
        return {texte: texteChoix, image: imageChoix};
      });

      let bonne = null;
      if (q.bonne !== undefined && q.bonne !== null) {
        const proposee = typeof q.bonne === "string" ? q.bonne.trim().toUpperCase() : "";
        if (!LETTRES.slice(0, choix.length).includes(proposee)) {
          erreurs.push(`${ou} : la bonne réponse doit être une lettre de A à ${lettre(choix.length - 1)}.`);
        } else {
          bonne = proposee;
        }
      }
      const chrono = Object.prototype.hasOwnProperty.call(q, "chrono")
        ? lireChrono(q.chrono, `${ou}, chrono`, erreurs)
        : chronoGeneral;

      return {numero: i + 1, id, type, enonce, image, choix, bonne, chrono};
    });

    if (erreurs.length) return {ok: false, erreurs};
    return {ok: true, questionnaire: {format: FORMAT, version: VERSION, titre, chrono: chronoGeneral, questions}};
  }

  return Object.freeze({
    FORMAT,
    VERSION,
    LETTRES,
    MAX_QUESTIONS,
    CHRONO_MIN,
    CHRONO_MAX,
    MAX_OCTETS_FICHIER,
    lettre,
    decouper,
    extraire,
    exemple,
    lire
  });
});
