(function initMathsGoFlashAnzanSuivi(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MathsGoFlashAnzanSuivi = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (racine) => {
  "use strict";

  // Le suivi de classe DANS L'APPLI Anzan (lot « Qui voit quoi », lot 4a,
  // 23/10/2026) — l'habillage de Coffres magiques (assets/js/coffres-suivi.js,
  // lui-même repris de SPLAT!) repris tel quel, branché sur le moteur d'Anzan
  // (outils/calcul_mental/flash_anzan_parcours.js).
  //
  // Le moteur décide de tout : le format, la case de chaque code, les envois,
  // la garde d'inactivité. Ce fichier HABILLE :
  //   - il crée le client du moteur pour la page ;
  //   - il donne à l'appli ses deux gestes, lire() et ecrire(), qui partent
  //     TOUJOURS de ce que la case contient à cet instant ;
  //   - il dessine ce que l'élève voit, et rien d'autre : le bloc de suivi
  //     (« Suivi par ton professeur », prénom, classe, « Se déconnecter »), la
  //     pastille « ● Léa » de l'écran de jeu, la question « C'est toujours
  //     toi ? » de la garde, aux mots de Défi tables, et le pied « Mon espace » ;
  //   - il range la mémoire de la page au nom de l'élève, pas de l'appareil.
  //
  // C'est le MODÈLE COMMUN des applis suivies (AGENTS.md), Défi tables en
  // référence : sur l'accueil de l'appli (les réglages, Mon historique), la
  // flèche puis le bloc ; pendant la séance, où la place manque, la pastille
  // « ● Léa » ; en bas, le petit logo et « Mon espace », rien d'autre. Aucun
  // lien ne sort l'élève de son espace.
  //
  // Sans code dans l'onglet, rien ne se voit et rien ne part : la case sans
  // code de l'appareil reste celle d'aujourd'hui, l'en-tête et le pied du site
  // ne changent pas (AGENTS.md : « sans code, rien ne change »). Sans le moteur
  // (fichier non chargé), creer() rend null et l'appli joue comme avant, sans
  // rien enregistrer.

  const ADRESSE_ESPACE = "https://suivi.mathsgo.re/";
  const ID_STYLE = "suivi-anzan-style";
  const ID_GARDE = "suivi-garde";

  // Le bloc de suivi, celui de Défi tables et de Coffres (lot « Mon parcours »,
  // dessin de Gwenaël) : vert d'eau = suivi, orange = rien n'est encore parti, gris = le
  // code ne vaut plus rien. Sur ordinateur, une ligne ; au téléphone (620 px et
  // moins, le seuil de Défi tables), trois lignes centrées — « Suivi par ton
  // professeur », le prénom, la classe — et « Se déconnecter » à droite, dans
  // le bloc. Les états longs (hors ligne, code refusé) passent à la ligne.
  const STYLE = [
    ".suivi-repere{display:flex;align-items:center;justify-content:center;gap:4px 8px;flex-wrap:wrap;box-sizing:border-box;",
    "min-height:40px;margin:0;padding:0 12px;border-radius:12px;background:#eef6f6;color:#0b5f5c;",
    "font-weight:700;font-size:.9rem;line-height:1.25;text-align:center}",
    ".suivi-repere[hidden]{display:none}",
    ".suivi-repere .puce{width:9px;height:9px;border-radius:50%;background:#08aaa5;flex:0 0 auto}",
    ".suivi-repere .sortie{border:0;background:none;margin:0;padding:0 2px;font:inherit;color:inherit;",
    "text-decoration:underline;cursor:pointer;opacity:.85;min-height:40px}",
    ".suivi-repere .sortie:hover,.suivi-repere .sortie:focus-visible{opacity:1}",
    ".suivi-repere .repere-lien a{color:inherit}",
    ".suivi-repere.hors-ligne{background:#fdf0e3;color:#8a4c0a}",
    ".suivi-repere.hors-ligne .puce{background:#d9822b}",
    ".suivi-repere.detache{background:#eceff3;color:#3d4a5a}",
    ".suivi-repere.detache .puce{display:none}",
    "@media(max-width:620px){",
    ".suivi-repere{flex-wrap:nowrap;gap:8px;min-height:44px;padding:5px 6px 5px 10px;font-size:.78rem;line-height:1.22;border-radius:10px}",
    ".suivi-repere .repere-texte{flex:1 1 auto;min-width:0}",
    ".suivi-repere .repere-texte>span{display:block}",
    ".suivi-repere .repere-prenom{font-weight:900;color:#10294a}",
    ".suivi-repere .repere-sep{display:none}",
    ".suivi-repere .sortie-bloc{flex:0 0 auto;font-size:0}",
    ".suivi-repere .repere-lien{flex:0 0 auto;white-space:nowrap}",
    ".suivi-repere .sortie{min-height:36px;padding:0 11px;border:1px solid #b7d9d6;border-radius:999px;background:#fff;",
    "font-size:.74rem;font-weight:900;text-decoration:none;opacity:1}}",
    // La pastille de la séance : « ● Léa » au bout de la barre du haut.
    ".suivi-pastille{display:inline-flex;align-items:center;gap:5px;margin-left:auto;padding:2px 9px;border-radius:999px;",
    "background:#eef6f6;color:#0b5f5c;font-weight:800;font-size:.8em;line-height:1.25;border:1px solid #cfe5e3;white-space:nowrap;flex:0 0 auto}",
    ".suivi-pastille i{width:7px;height:7px;border-radius:50%;background:#08aaa5;flex:0 0 auto}",
    ".suivi-pastille.hors-ligne{background:#fdf0e3;color:#8a4c0a;border-color:#efd3b4}",
    ".suivi-pastille.hors-ligne i{background:#d9822b}",
    ".suivi-pastille.detache{background:#eceff3;color:#3d4a5a;border-color:#d6dce4}",
    ".suivi-pastille.detache i{background:#8793a3}",
    // Le pied de la carte (Défi tables, lot « un seul système ») : le petit logo et
    // « Mon espace », des cibles qu'un doigt trouve sur une tablette.
    ".pied-espace{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:5px 9px}",
    ".pied-espace a{color:#315d7a;font-weight:800;text-decoration:underline;text-underline-offset:2px;padding:15px 10px}",
    ".pied-espace a.pied-logo{display:inline-flex;padding:6px 8px;text-decoration:none}",
    ".pied-espace .pied-logo img{display:block;width:64px;height:auto}",
    "@media(max-width:620px){.pied-espace .pied-logo img{width:56px}}",
    // La mention « Sans cookie ni traceur · Confidentialité » que pose
    // assets/js/mention-confidentialite.js mène au site : pas pour l'élève à
    // code (l'information est sur Mon espace, comme dans Défi tables). Le pied
    // refait porte la marque data-mathsgo-confidentialite, qui la retient ; ce
    // style est la ceinture, posée par marquerPage() (« suivi-eleve »).
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
  //   moteur      — MathsGoFlashAnzanParcours (par défaut celui de la page) ;
  //   fenetre, document, navigator, fetch — le monde de la page (les tests en
  //                 donnent un faux) ;
  //   surRepere() — la page redessine son repère (le bloc, la pastille, la
  //                 flèche de retour) ;
  //   surParcours() — la page relit le parcours (la case a changé : fusion
  //                 avec le serveur) ;
  //   enJeu()     — vrai pendant une séance (le client ne redessine pas alors).
  // }
  // Rend null sans moteur. Le client est CRÉÉ tout de suite (le code de
  // l'onglet est lu, la case choisie) mais rien ne se branche ni ne part avant
  // lancer() : l'appli choisit d'abord ce qu'elle montre.
  function creer(options) {
    const o = options || {};
    const P = o.moteur || racine.MathsGoFlashAnzanParcours;
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
      enJeu: o.enJeu,
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
    // on ne sait pas encore QUI entre, l'appli ne montre rien de la case sans
    // code de l'appareil (peut-être celle d'un autre élève).
    function attente() {
      return Boolean(client.ENTREE && client.ENTREE.billet) && !client.suiviActif() && !client.entreeRefusee;
    }

    // La case de cet onglet telle qu'elle est À CET INSTANT dans le stockage.
    function lire() {
      try { return P.charger(stockageLocal(), client.codeSuivi); } catch (_) { return null; }
    }

    // Le geste de l'appli : maj(moteur, case) rend la case nouvelle ; elle est
    // rangée, et sous un code marquée « à envoyer » puis envoyée (groupé, 700 ms).
    // Pour noter une séance, l'appli passe par client.noterUneSeance (il rend le
    // numéro) ; ecrire() sert aux réglages.
    function ecrire(maj) {
      const avant = lire();
      if (!avant || typeof maj !== "function") return null;
      let apres = null;
      try { apres = maj(P, avant); } catch (_) { apres = null; }
      if (!apres) return null;
      client.sauverParcours(apres);
      return client.parcours;
    }

    // ------------------------------------------- la pastille de la séance
    // « ● Léa » au bout de la barre du haut ; le texte complet du repère dans
    // son titre. Rien tant que personne n'est suivi.
    function pastilleHtml() {
      const e = client.etatRepere();
      if (e.etat === "cache" || e.etat === "refuse") return "";
      poserStyle();
      const classe = e.etat === "detache" ? " detache" : (e.etat === "hors-ligne" || e.etat === "erreur" ? " hors-ligne" : "");
      return "<span class=\"suivi-pastille" + classe + "\" title=\"" + echapper(e.texte) + "\" aria-label=\"" + echapper(e.texte) + "\">" +
        "<i aria-hidden=\"true\"></i>" + (e.prenom ? "<span class=\"nom\">" + echapper(e.prenom) + "</span>" : "") + "</span>";
    }

    // La pastille est mise à jour sur place quand l'état change (réseau coupé,
    // identité arrivée…) ; la page la pose une fois (pastilleHtml).
    function majPastilles() {
      if (!doc || typeof doc.querySelectorAll !== "function") return;
      const html = pastilleHtml();
      doc.querySelectorAll(".suivi-pastille").forEach(el => {
        if (html) el.outerHTML = html;
        else el.remove();
      });
    }

    // ------------------------------------------------- le bloc de l'accueil
    // Dans l'en-tête, à côté de la flèche — le modèle commun, celui de
    // Défi tables : « Suivi par ton professeur », le prénom,
    // la classe, chacun dans son morceau (au téléphone, trois lignes ; le texte
    // lu reste « Suivi par ton professeur · Léa · 405 »), puis « Se
    // déconnecter », avec son « · » (un point resté seul en fin de ligne se lit
    // mal). Orange hors ligne, gris si le code ne vaut plus rien. Un billet
    // refusé le dit, avec le seul geste utile : repasser par l'espace.
    const creerEl = (balise, classe, texte) => {
      const n = doc.createElement(balise);
      if (classe) n.className = classe;
      if (texte !== undefined) n.textContent = texte;
      return n;
    };

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
        texte.append(creerEl("span", "", client.TEXTES.suivi));
        [["repere-prenom", e.prenom], ["repere-classe", e.classe]].filter(([, valeur]) => valeur).forEach(([classe, valeur]) => {
          const ligne = creerEl("span", classe);
          ligne.append(creerEl("span", "repere-sep", " · "), doc.createTextNode(valeur));
          texte.append(ligne);
        });
      } else {
        texte.textContent = e.texte;
      }
      el.append(puce, texte);
      if (e.etat === "refuse") {
        const espace = creerEl("a", "", client.TEXTES.espace);
        espace.href = ADRESSE_ESPACE;
        const lien = creerEl("span", "repere-lien");
        lien.append(doc.createTextNode("· "), espace);
        el.append(lien);
        return;
      }
      const sortie = creerEl("button", "sortie", client.TEXTES.sortie);
      sortie.type = "button";
      sortie.addEventListener("click", () => client.quitterSuivi());
      const groupe = creerEl("span", "sortie-bloc");
      groupe.append(doc.createTextNode("· "), sortie);
      el.append(groupe);
    }

    // La page de l'élève venu de son espace porte « suivi-eleve » sur <html> :
    // sous un code, pendant l'échange de son billet, ou quand ce billet a été
    // refusé (il vient quand même de son espace). La page s'en sert pour son
    // en-tête et son pied ; le style ci-dessus, pour la mention du site.
    function marquerPage() {
      const racineDoc = doc && doc.documentElement;
      if (!racineDoc || !racineDoc.classList) return;
      racineDoc.classList.toggle("suivi-eleve", Boolean(client.suiviActif() || attente() || client.entreeRefusee));
    }

    // ------------------------------------------------------ le pied de la page
    // Le petit logo et « Mon espace », qui y mènent tous deux — rien d'autre :
    // ni crédits, ni licence, ni « Confidentialité » (l'information est sur Mon
    // espace). « Mon espace » porte la marque data-mathsgo-confidentialite, sans
    // quoi assets/js/mention-confidentialite.js (chargé en defer, donc après)
    // reposerait sa mention, avec son lien vers le site. Une fois faite, la
    // bascule ne se défait pas : un élève dont le code a été détaché vient
    // toujours de son espace, c'est là qu'il lui faut un chemin de retour.
    let piedRefait = false;
    function dessinerPied(pied) {
      if (!pied || !doc || piedRefait) return false;
      if (!(client.suiviActif() || client.entreeRefusee)) return false;
      poserStyle();
      const logo = creerEl("a", "pied-logo");
      logo.href = ADRESSE_ESPACE;
      logo.setAttribute("aria-label", "maths&go — Retour à mon espace");
      const image = doc.createElement("img");
      image.src = "/assets/img/mathsgo-logo-390.png";
      image.alt = "";
      image.width = 390;
      image.height = 181;
      logo.append(image);
      const espace = creerEl("a", "", client.TEXTES.espace);
      espace.href = ADRESSE_ESPACE;
      espace.setAttribute("data-mathsgo-confidentialite", "");
      pied.replaceChildren(logo, espace);
      pied.classList.add("pied-espace");
      piedRefait = true;
      return true;
    }

    // -------------------------------------------------- la mémoire de l'élève
    // Ce que la page retiendrait d'une visite à l'autre est celui de l'ÉLÈVE,
    // pas de l'appareil : deux élèves sur une
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

    // Une mémoire d'élève (« mathsgo-anzan-…:<empreinte> ») part avec sa case :
    // quand la purge des 90 jours (faite par le moteur en créant le client) a
    // retiré « mathsgo-anzan-parcours:<empreinte> » et « mathsgo-anzan-sync:
    // <empreinte> », ce qui restait à ce nom s'en va aussi. Jamais pendant
    // l'échange d'un billet, jamais la mémoire de l'élève de l'onglet.
    function nettoyerMemoires() {
      const st = stockageLocal();
      if (!st || attente() || typeof st.key !== "function") return 0;
      let gardee = "";
      const code = P.normaliserCode(client.codeSuivi || "");
      try { if (P.codeValide(code)) gardee = P.empreinteCode(code, P.selAppareil(st)); } catch (_) { gardee = ""; }
      const motif = new RegExp("^mathsgo-anzan-[a-z0-9-]+:([0-9a-f]{" + P.LONGUEUR_EMPREINTE + "})$");
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
      // temps, « Se déconnecter » a pu vider l'onglet, ou un autre appareil a
      // pu avancer la partie. Sous un code (avant ou maintenant), on recharge
      // la page : tout repart de l'onglet, de la case et du serveur, garde
      // comprise. Cet écouteur est posé AVANT ceux du client : il passe le
      // premier et les arrête, pour que rien de périmé ne parte. Sans code,
      // rien ne part et les lectures sont fraîches : rien à faire.
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
      dessinerPied,
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
