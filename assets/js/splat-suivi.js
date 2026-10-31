(function initMathsGoSplatSuivi(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MathsGoSplatSuivi = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (racine) => {
  "use strict";

  // Le suivi de classe DANS LES PAGES de l'univers SPLAT! (lot 2 « outils +
  // carte » du chantier SPLAT! ↔ suivi, 08/10/2026 — conception D5, D6, D9).
  //
  // Le moteur (assets/js/splat-parcours.js, lot 1) décide de tout : le format,
  // la case de chaque code, les envois, la garde d'inactivité. Ce fichier
  // HABILLE, une seule fois pour les quatre pages (la carte des mondes et les
  // trois outils du parcours) :
  //   - il crée le client du moteur pour une page ;
  //   - il donne aux outils leurs deux gestes, lire() et ecrire(), qui partent
  //     TOUJOURS de ce que la case contient à cet instant — une autre page du
  //     même onglet (la carte, un autre outil) a pu l'enrichir depuis que
  //     celle-ci s'est ouverte ;
  //   - il dessine ce que l'élève voit, et rien d'autre : le bloc de suivi, la
  //     question « C'est toujours toi ? » de la garde, aux mots de Défi tables ;
  //   - il range la mémoire des pages (le monde ouvert sur la carte…) au nom de
  //     l'élève, pas de l'appareil.
  //
  // Lot 6 « en-tête » (08/10/2026, essai de Gwenaël sur iPhone) : SPLAT! suit
  // le MODÈLE COMMUN des applis suivies (AGENTS.md), Défi tables en référence.
  // Sur la carte des mondes (l'accueil de l'appli), la flèche puis le bloc
  // « Suivi par ton professeur », prénom, classe, avec « Se déconnecter » DANS
  // le bloc (le bandeau du lot 2 s'en va) ; en bas, rien (24/10/2026 : plus de
  // pied dans les applis pour l'élève, le retour à Mon espace est en haut ; le
  // visiteur garde le pied de la carte, crédits et licence). Dans les étapes, où la
  // place manque, la pastille
  // « ● Léa » du lot 2 reste (choix de Gwenaël : aucune mise en page de jeu ne
  // bouge) ; la mention « Confidentialité » du site n'y est plus. Aucun lien ne
  // sort l'élève de son espace.
  //
  // Sans code dans l'onglet, rien ne se voit et rien ne part : la case sans code
  // d'aujourd'hui reste celle de l'élève (D6), l'en-tête et les crédits ne
  // changent pas. Sans le moteur (fichier non chargé), creer() rend null et les
  // pages jouent comme avant, sans rien enregistrer.

  const ADRESSE_ESPACE = "https://suivi.mathsgo.re/";
  const ID_STYLE = "suivi-splat-style";
  const ID_GARDE = "suivi-garde";

  // La ligne de suivi — l'EN-TÊTE COMMUN des applis suivies (variante A,
  // planches du 31/10/2026, AGENTS.md) : sous le titre du cadre, une seule
  // petite ligne centrée « ● Suivi · Rania · 405 · Se déconnecter ». Puce
  // verte, prénom en gras couleur encre, « Se déconnecter » souligné gris ; sa
  // zone de toucher fait 44 px de haut sans grossir la ligne. Orange quand rien
  // n'est encore parti, grise (sans puce) quand le code ne vaut plus rien. La
  // ligne ne se coupe qu'aux « · » : les états longs passent à la ligne entiers.
  // Mêmes règles, mêmes valeurs dans les cinq applis (gardé par
  // tests/en-tete-commun.test.mjs).
  const STYLE = [
    ".suivi-repere{display:block;box-sizing:border-box;margin:4px 0 8px;padding:0;border-radius:0;background:none;",
    "color:#506b7d;font-weight:500;font-size:.86rem;line-height:1.35;text-align:center}",
    ".suivi-repere[hidden]{display:none}",
    ".suivi-repere .puce{display:inline-block;width:8px;height:8px;margin-right:6px;border-radius:50%;background:#147447;vertical-align:1px}",
    ".suivi-repere .morceau,.suivi-repere .sortie-bloc,.suivi-repere .repere-lien{white-space:nowrap}",
    ".suivi-repere .repere-prenom{font-weight:700;color:#143451}",
    ".suivi-repere .sortie{position:relative;margin:0;padding:0;border:0;background:none;font:inherit;color:inherit;",
    "text-decoration:underline;text-underline-offset:2px;cursor:pointer}",
    // La zone de toucher de « Se déconnecter » : 44 px de haut, surtout AU-DESSUS du mot (le titre,
    // ou le haut du cadre) — elle ne mord que de 5 px sur ce qui suit, un seul geste suffisant à déconnecter.
    ".suivi-repere .sortie::after{content:\"\";position:absolute;left:-8px;right:-8px;top:-22px;height:44px}",
    ".suivi-repere .sortie:hover,.suivi-repere .sortie:focus-visible{color:#143451}",
    ".suivi-repere .repere-lien a{color:inherit;text-underline-offset:2px}",
    ".suivi-repere.hors-ligne{color:#8a4c0a}",
    ".suivi-repere.hors-ligne .puce{background:#d9822b}",
    ".suivi-repere.detache{color:#3d4a5a}",
    ".suivi-repere.detache .puce{display:none}",
    "@media(max-width:620px){.suivi-repere{font-size:.8rem}}",
    // La pastille des étapes (lot 2, choix Q2) : « ● Léa » au bout de la barre du jeu.
    ".suivi-pastille{display:inline-flex;align-items:center;gap:5px;margin-left:auto;padding:2px 9px;border-radius:999px;",
    "background:#eef6f6;color:#0b5f5c;font-weight:800;font-size:.8em;line-height:1.25;border:1px solid #cfe5e3;white-space:nowrap;flex:0 0 auto}",
    ".suivi-pastille i{width:7px;height:7px;border-radius:50%;background:#08aaa5;flex:0 0 auto}",
    ".suivi-pastille.hors-ligne{background:#fdf0e3;color:#8a4c0a;border-color:#efd3b4}",
    ".suivi-pastille.hors-ligne i{background:#d9822b}",
    ".suivi-pastille.detache{background:#eceff3;color:#3d4a5a;border-color:#d6dce4}",
    ".suivi-pastille.detache i{background:#8793a3}",
    // La mention « Sans cookie ni traceur · Confidentialité » que pose
    // assets/js/mention-confidentialite.js sous les étapes mène au site : pas pour
    // l'élève à code (l'information est sur Mon espace, comme dans Défi tables).
    // Dans les étapes (SPLAT! classique, l'Enquête, le Système), elle est SOUS le
    // cadre du jeu : la retirer n'en bouge rien, la page cesse seulement de défiler
    // de sa hauteur (mesuré au banc du lot 6). Ce style est posé avec la pastille ;
    // « suivi-eleve », par marquerPage().
    "html.suivi-eleve .mg-mention-slot{display:none !important}",
    // au-dessus de tout, y compris la mention « Sans cookie ni traceur » des outils (z-index 2147482999)
    ".suivi-garde{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;",
    "padding:16px;background:rgba(20,52,81,.55);font-family:\"Segoe UI\",system-ui,-apple-system,BlinkMacSystemFont,sans-serif}",
    ".suivi-garde[hidden]{display:none}",
    ".suivi-garde-carte{background:#fff;color:#10294a;border-radius:16px;padding:22px 20px;max-width:420px;width:100%;",
    "box-shadow:0 18px 40px rgba(20,52,81,.3);text-align:center}",
    ".suivi-garde-titre{margin:0 0 8px;font-size:1.35rem;font-weight:700}",
    ".suivi-garde-note{margin:0 0 16px;color:#5c6c82;font-size:.95rem;line-height:1.4}",
    ".suivi-garde-form{display:flex;flex-direction:column;align-items:center;gap:8px}",
    ".suivi-garde-label{font-size:.9rem;font-weight:700;color:#5c6c82}",
    ".suivi-garde-code{font-family:inherit;font-size:1.5rem;font-weight:700;line-height:1.2;letter-spacing:.18em;text-align:center;text-transform:uppercase;",
    "width:9em;max-width:100%;min-height:48px;padding:6px 8px;border:2px solid #c9d8e6;border-radius:12px;color:#10294a;background:#f7fbff}",
    ".suivi-garde-code:focus{outline:3px solid #7fb3e0;outline-offset:1px}",
    ".suivi-garde-erreur{margin:0;color:#b3261e;font-size:.9rem;font-weight:700}",
    ".suivi-garde-erreur[hidden]{display:none}",
    ".suivi-garde-boutons{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:4px}",
    ".suivi-garde-boutons button{font:inherit;font-weight:800;font-size:1rem;min-height:44px;padding:0 18px;border-radius:999px;cursor:pointer}",
    ".suivi-garde-oui{color:#fff;background:#0b67b2;border:2px solid #0b67b2}",
    ".suivi-garde-non{color:#10294a;background:#fff;border:2px solid #c9d8e6}"
  ].join("");

  function echapper(texte) {
    return String(texte).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"})[c]);
  }

  // options : {
  //   moteur      — MathsGoSplatParcours (par défaut celui de la page) ;
  //   fenetre, document, navigator, fetch — le monde de la page (les tests en
  //                 donnent un faux) ;
  //   surRepere() — la page redessine son repère (la carte : son bloc et ses
  //                 liens de retour ; les outils : leur pastille) ;
  //   surParcours() — la page redessine le parcours (la carte : ses étoiles) ;
  //   enSerie()   — vrai pendant une série (le client ne redessine pas alors).
  // }
  // Rend null sans moteur. Le client est CRÉÉ tout de suite (le code de
  // l'onglet est lu, la case choisie) mais rien ne se branche ni ne part avant
  // lancer() : la carte dessine d'abord ses mondes.
  function creer(options) {
    const o = options || {};
    const P = o.moteur || racine.MathsGoSplatParcours;
    if (!P || typeof P.creerClient !== "function") return null;
    const fenetre = o.fenetre || (typeof window !== "undefined" ? window : null);
    const doc = o.document || (typeof document !== "undefined" ? document : null);
    const surRepere = typeof o.surRepere === "function" ? o.surRepere : () => {};
    const surParcours = typeof o.surParcours === "function" ? o.surParcours : () => {};
    const stockageLocal = () => {
      try { return fenetre ? fenetre.localStorage : null; } catch (_) { return null; }
    };

    const client = P.creerClient({
      fenetre,
      document: doc,
      navigator: o.navigator,
      fetch: o.fetch,
      horloge: o.horloge,
      enSerie: o.enSerie,
      rendre: {
        repere() {
          marquerPage();
          try { surRepere(); } catch (_) {}
        },
        parcours() { try { surParcours(); } catch (_) {} },
        garde() { dessinerGarde(); }
      }
    });

    // Vrai tant qu'un billet arrivé dans l'adresse n'a pas encore été échangé :
    // on ne sait pas encore QUI entre, la carte n'affiche aucune étoile (sinon
    // celles de la case sans code de l'appareil, peut-être d'un autre élève).
    function attente() {
      return Boolean(client.ENTREE && client.ENTREE.billet) && !client.suiviActif() && !client.entreeRefusee;
    }

    // La case de cet onglet telle qu'elle est À CET INSTANT dans le stockage.
    function lire() {
      try { return P.charger(stockageLocal(), client.codeSuivi); } catch (_) { return null; }
    }

    // Les gestes des outils : maj(moteur, case) rend la case nouvelle ; elle est
    // rangée, et sous un code marquée « à envoyer » puis envoyée (groupé, 700 ms).
    function ecrire(maj) {
      const avant = lire();
      if (!avant || typeof maj !== "function") return null;
      let apres = null;
      try { apres = maj(P, avant); } catch (_) { apres = null; }
      if (!apres) return null;
      client.sauverParcours(apres);
      return client.parcours;
    }

    // ------------------------------------------------- la pastille des outils
    // « ● Léa » au bout de la barre du haut (choix Q2) ; le texte complet du
    // repère dans son titre. Rien tant que personne n'est suivi.
    function pastilleHtml() {
      const e = client.etatRepere();
      if (e.etat === "cache" || e.etat === "refuse") return "";
      poserStyle();
      const classe = e.etat === "detache" ? " detache" : (e.etat === "hors-ligne" || e.etat === "erreur" ? " hors-ligne" : "");
      return "<span class=\"suivi-pastille" + classe + "\" title=\"" + echapper(e.texte) + "\" aria-label=\"" + echapper(e.texte) + "\">" +
        "<i aria-hidden=\"true\"></i>" + (e.prenom ? "<span class=\"nom\">" + echapper(e.prenom) + "</span>" : "") + "</span>";
    }

    // Les barres des outils se reconstruisent à chaque carte : la pastille est
    // dans leur gabarit (pastilleHtml) ; ici, on la met seulement à jour sur
    // place quand l'état change (réseau coupé, identité arrivée…).
    function majPastilles() {
      if (!doc || typeof doc.querySelectorAll !== "function") return;
      const html = pastilleHtml();
      doc.querySelectorAll(".suivi-pastille").forEach(el => {
        if (html) el.outerHTML = html;
        else el.remove();
      });
    }

    // ------------------------------------------------- la ligne de l'accueil
    // Sous le titre du cadre (en-tête commun, variante A, 31/10/2026) :
    // « ● Suivi · Léa · 405 · Se déconnecter ». Le mot « Suivi » reste : l'élève
    // sait que son travail remonte à son professeur. Les états reprennent les
    // textes du moteur, « Suivi par ton professeur » raccourci en « Suivi »
    // (le titre et l'étiquette de la pastille gardent le texte entier). Un
    // billet refusé le dit, avec le seul geste utile : repasser par l'espace.
    const creerEl = (balise, classe, texte) => {
      const n = doc.createElement(balise);
      if (classe) n.className = classe;
      if (texte !== undefined) n.textContent = texte;
      return n;
    };
    const court = texte => String(texte || "").replace(/^Suivi par ton professeur/, "Suivi");

    function dessinerBloc(el) {
      if (!el || !doc) return;
      const e = client.etatRepere();
      el.replaceChildren();
      el.classList.toggle("detache", e.etat === "detache" || e.etat === "refuse");
      el.classList.toggle("hors-ligne", e.etat === "hors-ligne" || e.etat === "erreur");
      if (e.etat === "cache") { el.hidden = true; return; }
      poserStyle();
      el.hidden = false;
      const puce = creerEl("span", "puce");
      puce.setAttribute("aria-hidden", "true");
      const texte = creerEl("span", "repere-texte");
      if (e.etat === "ok" && (e.prenom || e.classe)) {
        texte.append(creerEl("span", "morceau", "Suivi"));
        [["repere-prenom", e.prenom], ["repere-classe", e.classe]].filter(([, valeur]) => valeur).forEach(([classe, valeur]) => {
          texte.append(doc.createTextNode(" · "), creerEl("span", "morceau " + classe, valeur));
        });
      } else {
        texte.textContent = court(e.texte);
      }
      el.append(puce, texte);
      if (e.etat === "refuse") {
        const espace = creerEl("a", "", client.TEXTES.espace);
        espace.href = ADRESSE_ESPACE;
        const lien = creerEl("span", "repere-lien");
        lien.append(doc.createTextNode(" · "), espace);
        el.append(lien);
        return;
      }
      const sortie = creerEl("button", "sortie", client.TEXTES.sortie);
      sortie.type = "button";
      sortie.addEventListener("click", () => client.quitterSuivi());
      // Le « · » voyage avec le bouton : un point resté seul en fin de ligne se lit mal.
      const groupe = creerEl("span", "sortie-bloc");
      groupe.append(doc.createTextNode(" · "), sortie);
      el.append(groupe);
    }

    // La page de l'élève venu de son espace porte « suivi-eleve » sur <html> :
    // sous un code, pendant l'échange de son billet, ou quand ce billet a été
    // refusé (il vient quand même de son espace). Les pages s'en servent pour
    // leur en-tête (la carte, pour cacher ses crédits) ; le style ci-dessus,
    // pour la mention du site.
    function marquerPage() {
      const racineDoc = doc && doc.documentElement;
      if (!racineDoc || !racineDoc.classList) return;
      racineDoc.classList.toggle("suivi-eleve", Boolean(client.suiviActif() || attente() || client.entreeRefusee));
    }

    // -------------------------------------------------- la mémoire de l'élève
    // Ce que la page retient d'une visite à l'autre (le monde ouvert sur la
    // carte…) est celui de l'ÉLÈVE, pas de l'appareil : deux élèves sur une
    // même tablette ne se le passent pas. Sous un code, la clé porte
    // l'empreinte du code, comme sa case (jamais le code en clair) ; sans code,
    // la clé de l'appareil d'aujourd'hui ; pendant l'échange d'un billet (on ne
    // sait pas encore qui entre), aucune : null, rien ne se lit ni ne s'écrit.
    function cleEleve(base) {
      if (attente()) return null;
      const code = P.normaliserCode(client.codeSuivi || "");
      if (!P.codeValide(code)) return base;
      try { return base + ":" + P.empreinteCode(code, P.selAppareil(stockageLocal())); } catch (_) { return null; }
    }

    // Une mémoire d'élève (« mathsgo-splat-…:<empreinte> ») part avec sa case :
    // quand la purge des 90 jours (faite par le moteur en créant le client) a
    // retiré « mathsgo-splat-parcours:<empreinte> » et « mathsgo-splat-sync:
    // <empreinte> », ce qui restait à ce nom s'en va aussi. Jamais pendant
    // l'échange d'un billet, jamais la mémoire de l'élève de l'onglet.
    function nettoyerMemoires() {
      const st = stockageLocal();
      if (!st || attente() || typeof st.key !== "function") return 0;
      let gardee = "";
      const code = P.normaliserCode(client.codeSuivi || "");
      try { if (P.codeValide(code)) gardee = P.empreinteCode(code, P.selAppareil(st)); } catch (_) { gardee = ""; }
      const motif = new RegExp("^mathsgo-splat-[a-z0-9-]+:([0-9a-f]{" + P.LONGUEUR_EMPREINTE + "})$");
      const cles = [];
      try { for (let i = 0; i < st.length; i += 1) cles.push(st.key(i)); } catch (_) { return 0; }
      let retirees = 0;
      cles.forEach(cle => {
        const m = typeof cle === "string" ? cle.match(motif) : null;
        if (!m || m[1] === gardee) return;
        if (cle.indexOf(P.CLE_STOCKAGE + ":") === 0 || cle.indexOf(P.CLE_SYNC + ":") === 0) return;
        try {
          if (st.getItem(P.CLE_STOCKAGE + ":" + m[1]) !== null || st.getItem(P.CLE_SYNC + ":" + m[1]) !== null) return;
          st.removeItem(cle);
          retirees += 1;
        } catch (_) {}
      });
      return retirees;
    }

    // ------------------------------------------------------------- la garde
    // Les mots et le geste de Défi tables : retaper son code, ou « Non » qui
    // rend l'onglet au camarade suivant. La question vit dans un conteneur
    // marqué data-suivi-garde : tant qu'elle est posée, le moteur retient tous
    // les gestes ailleurs dans la page.
    function poserStyle() {
      if (!doc || typeof doc.getElementById !== "function" || doc.getElementById(ID_STYLE)) return;
      const style = doc.createElement("style");
      style.id = ID_STYLE;
      style.textContent = STYLE;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function nettoyerCodeSaisi(brut) {
      let propre = "";
      const base = P.normaliserCode(brut);
      for (let i = 0; i < base.length; i += 1) {
        if (P.codeValide(base[i].repeat(P.LONGUEUR_CODE))) propre += base[i];
      }
      return propre;
    }

    // La question n'est construite qu'au premier besoin (l'élève sans code n'en
    // a jamais), élément par élément.
    let garde = null;
    function construireGarde() {
      poserStyle();
      const el = (balise, attributs, texte) => {
        const n = doc.createElement(balise);
        Object.keys(attributs || {}).forEach(nom => n.setAttribute(nom, attributs[nom]));
        if (texte !== undefined) n.textContent = texte;
        return n;
      };
      const racineGarde = el("div", {id: ID_GARDE, class: "suivi-garde", role: "dialog", "aria-modal": "true",
        "aria-labelledby": "suivi-garde-titre", "data-suivi-garde": ""});
      racineGarde.hidden = true;
      const carte = el("div", {class: "suivi-garde-carte"});
      const titre = el("p", {id: "suivi-garde-titre", class: "suivi-garde-titre"}, "C’est toujours toi ?");
      const note = el("p", {class: "suivi-garde-note"},
        "Personne n’a touché à cet écran depuis un moment. Si c’est toi, retape ton code (il est sur ta bandelette). Sinon, appuie sur « Non » : ton camarade retrouvera son parcours avec son code.");
      const form = el("form", {id: "suivi-garde-form", class: "suivi-garde-form", autocomplete: "off"});
      const label = el("label", {class: "suivi-garde-label", for: "suivi-garde-code"}, "Ton code");
      const champ = el("input", {id: "suivi-garde-code", class: "suivi-garde-code", type: "text", inputmode: "latin",
        autocapitalize: "characters", autocomplete: "off", autocorrect: "off", spellcheck: "false", maxlength: "6", size: "6",
        "aria-describedby": "suivi-garde-erreur"});
      const erreur = el("p", {id: "suivi-garde-erreur", class: "suivi-garde-erreur", role: "alert"});
      erreur.hidden = true;
      const boutons = el("div", {class: "suivi-garde-boutons"});
      const oui = el("button", {id: "suivi-garde-oui", class: "suivi-garde-oui", type: "button"}, "C’est moi");
      const non = el("button", {id: "suivi-garde-non", class: "suivi-garde-non", type: "button"}, "Non, ce n’est pas moi");
      boutons.append(oui, non);
      form.append(label, champ, erreur, boutons);
      carte.append(titre, note, form);
      racineGarde.append(carte);
      doc.body.appendChild(racineGarde);
      const valider = () => client.repondreGarde(true, champ.value || "");
      champ.addEventListener("input", () => {
        const propre = nettoyerCodeSaisi(champ.value || "");
        if (champ.value !== propre) champ.value = propre;
      });
      // Le formulaire, pour la touche Entrée ; les boutons, pour le doigt.
      form.addEventListener("submit", evenement => {
        if (evenement && typeof evenement.preventDefault === "function") evenement.preventDefault();
        valider();
      });
      oui.addEventListener("click", valider);
      non.addEventListener("click", () => client.repondreGarde(false));
      return {racine: racineGarde, titre, erreur, champ, oui, non, form};
    }

    function dessinerGarde() {
      if (!doc || typeof doc.createElement !== "function") return;
      if (!client.gardeVisible) {
        if (garde) {
          garde.racine.hidden = true;
          garde.champ.value = "";
        }
        return;
      }
      if (!garde) garde = construireGarde();
      garde.racine.hidden = false;
      const prenom = client.prenomAffiche();
      garde.titre.textContent = prenom ? "C’est toujours toi, " + prenom + " ?" : "C’est toujours toi ?";
      garde.erreur.textContent = client.gardeErreur;
      garde.erreur.hidden = !client.gardeErreur;
      if (typeof garde.champ.focus === "function") {
        try { garde.champ.focus({preventScroll: true}); } catch (_) {}
      }
    }

    // --------------------------------------------------------------- lancer
    let lance = false;
    function lancer() {
      if (lance) return null;
      lance = true;
      // Retour par le bouton « précédent » (cache arrière-avant du navigateur) :
      // la page revient telle qu'on l'avait laissée, client compris. Or, entre-
      // temps, une autre page de l'onglet a pu écrire la case, envoyer, ou
      // « Se déconnecter » a pu vider l'onglet. Sous un code (avant ou
      // maintenant), on recharge la page : tout repart de l'onglet et de la
      // case, garde comprise. Cet écouteur est posé AVANT ceux du client : il
      // passe le premier et les arrête, pour que rien de périmé ne parte.
      // Sans code, rien ne part et les lectures sont fraîches : rien à faire.
      try {
        if (fenetre && typeof fenetre.addEventListener === "function") {
          fenetre.addEventListener("pageshow", evenement => {
            if (!evenement || !evenement.persisted) return;
            let codeOnglet = "";
            try { codeOnglet = P.chargerCode(fenetre.sessionStorage); } catch (_) { codeOnglet = ""; }
            if (!client.suiviActif() && !codeOnglet) return;
            if (typeof evenement.stopImmediatePropagation === "function") evenement.stopImmediatePropagation();
            try { fenetre.location.reload(); } catch (_) {}
          });
        }
      } catch (_) {}
      return client.demarrer();
    }

    marquerPage();
    nettoyerMemoires();

    return {
      client,
      moteur: P,
      ADRESSE_ESPACE,
      attente,
      lire,
      ecrire,
      lancer,
      pastilleHtml,
      majPastilles,
      dessinerBloc,
      cleEleve,
      nettoyerMemoires,
      elementsGarde: () => garde,
      actif: () => client.suiviActif(),
      etat: () => client.etatRepere(),
      quitter: () => client.quitterSuivi()
    };
  }

  return Object.freeze({ADRESSE_ESPACE, creer});
});
