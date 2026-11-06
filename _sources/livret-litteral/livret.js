/* Livret « Calcul littéral » — ce script met en forme les pages écrites dans livret_litteral.html.
 *
 *  <section class="page" data-sur="Activité 1" data-titre="Découvrir les tuiles algébriques">
 *      → ajoute l'en-tête (logo maths&go en haut à droite) et le pied « mathsgo.re · CC BY-NC-SA 4.0 ».
 *        Dans data-titre, une expression entre `accents graves` est écrite en mathématiques.
 *
 *  <m>3x^2 - 2x + 1</m>
 *      → écriture mathématique : les lettres deviennent les lettres rondes de SPLAT! (𝑥),
 *        « - » devient le vrai signe −, « * » devient ×, « ^2 » devient ², « ^6 » un exposant.
 *
 *  <tl u="3.4">3*x 2*-1 / x2</tl>
 *      → des tuiles. u = taille de la tuile 1 en millimètres (3,2 au minimum pour que le texte se lise).
 *        Mots : x2  -x2  x  -x  xv  -xv (x debout)  1  -1   B:4x (bande « 4𝑥 »)  Bv:2x (bande debout)
 *               n*mot  = n tuiles serrées (rangées selon la tuile)     RxC*mot = R lignes de C tuiles
 *               mot!   = tuile barrée          /  = à la ligne          |  = espace
 *        L'attribut « serre » colle les groupes entre eux (bords de grille).
 */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var theme = params.get("theme") === "blanc-gris" ? "blanc-gris" : "vert-rouge";
  document.documentElement.setAttribute("data-theme", theme);

  var L = 3.6; // longueur de la tuile x, en tuiles 1 (pas un nombre entier : on ne doit pas pouvoir « compter » x)

  function lettre(c) {
    return c === "h" ? "\u210E" : String.fromCodePoint(0x1d44e + c.charCodeAt(0) - 97);
  }
  function maths(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === "^") {
        var j = i + 1, e = "";
        while (j < s.length && /[0-9]/.test(s[j])) e += s[j++];
        out += e === "2" ? "²" : e === "3" ? "³" : "<sup>" + e + "</sup>";
        i = j - 1;
      } else if (c === "-") out += "\u2212";
      else if (c === "*") out += "×";
      else if (/[a-z]/.test(c)) out += '<span class="l">' + lettre(c) + "</span>";
      else if (c === "<") out += "&lt;";
      else if (c === "&") out += "&amp;";
      else out += c;
    }
    return out;
  }
  window.maths = maths;

  /* ---------- une tuile ---------- */
  function tuile(mot, opt) {
    var barre = /!$/.test(mot);
    if (barre) mot = mot.slice(0, -1);
    var neg = mot.charAt(0) === "-";
    var base = neg ? mot.slice(1) : mot;
    var w, h, lab, k;
    if (/^Bv?:/.test(base)) {
      var debout = base.charAt(1) === "v";
      var txt = base.slice(debout ? 3 : 2);
      w = debout ? 1 : L * 1.35; h = debout ? L * 1.35 : 1; lab = maths((neg ? "-" : "") + txt); k = "b";
    } else if (base === "x2") { w = L; h = L; lab = maths((neg ? "-" : "") + "x^2"); k = "x2"; }
    else if (base === "x") { w = L; h = 1; lab = maths((neg ? "-" : "") + "x"); k = "x"; }
    else if (base === "xv") { w = 1; h = L; lab = maths((neg ? "-" : "") + "x"); k = "xv"; }
    else if (base === "1") { w = 1; h = 1; lab = neg ? "\u22121" : "1"; k = "u"; }
    else throw new Error("tuile inconnue : " + mot);
    if (opt && opt.vide) lab = "";
    return '<span class="t k-' + k + (neg ? " neg" : " pos") + (barre ? " barre" : "") +
      '" style="--w:' + w + ";--h:" + h + '">' + lab + "</span>";
  }

  /* ---------- un groupe de n tuiles ---------- */
  function groupe(tok, opt) {
    var m = /^(?:(\d+)x(\d+)|(\d+))\*(.+)$/.exec(tok);
    if (!m) return tuile(tok, opt);
    var mot = m[4], base = mot.replace(/^-/, "").replace(/!$/, "");
    var n, cols;
    if (m[1]) { n = +m[1] * +m[2]; cols = +m[2]; }
    else {
      n = +m[3];
      if (base === "x" || /^B:/.test(base)) cols = n <= 6 ? 1 : 2;           // bandes couchées : en colonne
      else if (base === "xv" || /^Bv:/.test(base)) cols = n;                // bandes debout : en ligne
      else if (base === "x2") cols = n <= 3 ? n : Math.ceil(n / 2);
      else cols = n <= 5 ? n : Math.ceil(n / 2);                            // unités
    }
    var html = "";
    for (var i = 0; i < n; i++) html += tuile(mot, opt);
    var flow = (base === "x" || /^B:/.test(base)) && !m[1] && cols > 1 ? "grid-auto-flow:column;grid-template-rows:repeat(" + Math.ceil(n / cols) + ",auto)" : "grid-template-columns:repeat(" + cols + ",auto)";
    return '<span class="grp" style="' + flow + '">' + html + "</span>";
  }

  function tuiles(spec, opt) {
    var toks = spec.trim().split(/\s+/), html = "";
    toks.forEach(function (tok) {
      if (tok === "/") html += '<span class="br"></span>';
      else if (tok === "|") html += '<span class="sp"></span>';
      else html += groupe(tok, opt);
    });
    return html;
  }

  function preparer() {
    document.querySelectorAll("section.page").forEach(function (p) {
      if (p.dataset.titre !== undefined) {
        var t = p.dataset.titre.replace(/`([^`]*)`/g, function (_, e) { return maths(e); });
        var tete = document.createElement("header");
        tete.className = "tete";
        tete.innerHTML = '<div><p class="sur">Calcul littéral · ' + p.dataset.sur + "</p><h1>" + t + "</h1></div>" +
          '<img src="../../assets/img/mathsgo-logo-print.png" alt="maths&amp;go">';
        p.insertBefore(tete, p.firstChild);
      }
      var pied = document.createElement("footer");
      pied.className = "pied";
      pied.textContent = "mathsgo.re · CC BY-NC-SA 4.0";
      p.appendChild(pied);
    });
    document.querySelectorAll("tl").forEach(function (el) {
      var span = document.createElement("span");
      span.className = "tiles" + (el.hasAttribute("serre") ? " serre" : "");
      span.style.setProperty("--u", (el.getAttribute("u") || "4") + "mm");
      span.innerHTML = tuiles(el.textContent, { vide: el.hasAttribute("vide") });
      el.replaceWith(span);
    });
    document.querySelectorAll("m").forEach(function (el) { el.innerHTML = maths(el.textContent); });
    document.documentElement.setAttribute("data-pret", "1");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", preparer);
  else preparer();
})();
