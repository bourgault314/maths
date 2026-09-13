/* Le décor reste en place : seuls les éléments mobiles du dodo sont actualisés. */
(function () {
  "use strict";
  const ns = "http://www.w3.org/2000/svg";
  // Quatre paysages de La Réunion, un par demi-minute de course : la forêt de
  // tamarins des Hauts, les remparts d'un cirque, la Plaine des Sables au pied
  // du volcan, puis le littoral. Chaque paysage est dessiné une fois pour
  // toutes en trois plans (lointain ×0,12, proche ×0,32, sol ×1) ; au
  // changement de zone, l'ancien s'efface en fondu pendant que le nouveau
  // apparaît. Les plans lointain et proche sont des motifs de 600 px posés
  // deux fois ; le sol est un motif de 200 px posé quatre fois. Un motif doit
  // se reboucler sur lui-même : même hauteur en 0 et en 600, aucun objet à
  // cheval sur le bord (sinon une marche apparaît à la jointure).
  const fois = (motif, largeur, n) => Array.from({ length: n }, (_, i) => i ? `<g transform="translate(${i * largeur} 0)">${motif}</g>` : motif).join("");
  // Les silhouettes qui vont de 0 à 600 débordent de 2 px de chaque côté : deux
  // copies qui se touchent exactement laissent sinon un fil clair à la jointure.
  const deborde = motif => motif.replace(/M0 (\d+(?:\.\d+)?)/g, "M-2 $1").replace(/ 600 (\d+(?:\.\d+)?)V290H0Z/g, " 602 $1V290H-2Z");
  // Chaque élément est doublé séparément : la copie d'une silhouette se pose sur
  // sa jumelle avant que la silhouette suivante ne les recouvre toutes deux.
  const lointain = motif => [].concat(motif).map(m => fois(deborde(m), 600, 2)).join(""), proche = lointain, sol = motif => fois(motif, 200, 4);
  const fanjan = (x, base, taille = 1) => {
    // Fougère arborescente : un stipe droit et des frondes qui retombent.
    const h = 46 * taille, top = base - h;
    return `<path d="M${x} ${base}V${top}" stroke="#6d5a48" stroke-width="${5 * taille}" stroke-linecap="round"/>` +
      [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, 1]].map(([s, k]) =>
        `<path d="M${x} ${top + 2}q${s * 12 * taille} ${-16 * taille + k * 10} ${s * 34 * taille} ${(k ? 12 : -2) * taille}" fill="none" stroke="#5f9470" stroke-width="${3.2 * taille}" stroke-linecap="round"/>`).join("") +
      `<path d="M${x} ${top + 2}q0 -18 ${-6 * taille} -22" fill="none" stroke="#5f9470" stroke-width="${3 * taille}" stroke-linecap="round"/>`;
  };
  const tamarin = (x, base, s = 1) => {
    // Tamarin des Hauts : tronc gris qui serpente, branches basses presque
    // horizontales, couronne plate et clairsemée, lichens pendus.
    const t = (dx, dy) => `${x + dx * s} ${base + dy * s}`;
    return `<path d="M${t(-8, 0)}C${t(-4, -18)} ${t(-20, -34)} ${t(-12, -54)}C${t(-4, -74)} ${t(-26, -86)} ${t(-18, -108)}L${t(-8, -106)}C${t(-14, -88)} ${t(6, -76)} ${t(0, -56)}C${t(-4, -36)} ${t(12, -18)} ${t(10, 0)}Z" fill="#7f6d5b"/>` +
      `<path d="M${t(-6, -52)}C${t(-24, -60)} ${t(-40, -54)} ${t(-58, -66)}M${t(-2, -68)}C${t(16, -78)} ${t(34, -74)} ${t(52, -88)}M${t(-14, -100)}C${t(-30, -108)} ${t(-42, -104)} ${t(-56, -116)}M${t(-10, -104)}C${t(4, -116)} ${t(20, -114)} ${t(30, -124)}" fill="none" stroke="#7f6d5b" stroke-width="${5 * s}" stroke-linecap="round"/>` +
      `<path d="M${t(-8, -28)}c-3 -8 3 -14 2 -20M${t(2, -44)}c4 -6 0 -14 2 -18M${t(-12, -80)}c-2 -6 4 -10 2 -16" fill="none" stroke="#a08d77" stroke-width="${1.7 * s}" stroke-linecap="round"/>` +
      `<g fill="#4f7f66"><ellipse cx="${x - 62 * s}" cy="${base - 70 * s}" rx="${24 * s}" ry="${8 * s}"/><ellipse cx="${x + 56 * s}" cy="${base - 92 * s}" rx="${26 * s}" ry="${8 * s}"/><ellipse cx="${x - 58 * s}" cy="${base - 120 * s}" rx="${24 * s}" ry="${8 * s}"/><ellipse cx="${x + 30 * s}" cy="${base - 128 * s}" rx="${28 * s}" ry="${9 * s}"/><ellipse cx="${x - 14 * s}" cy="${base - 118 * s}" rx="${18 * s}" ry="${7 * s}"/></g>` +
      `<g fill="#6a9a74"><ellipse cx="${x - 54 * s}" cy="${base - 75 * s}" rx="${13 * s}" ry="${4.5 * s}"/><ellipse cx="${x + 46 * s}" cy="${base - 97 * s}" rx="${13 * s}" ry="${4.5 * s}"/><ellipse cx="${x - 50 * s}" cy="${base - 125 * s}" rx="${12 * s}" ry="${4 * s}"/><ellipse cx="${x + 22 * s}" cy="${base - 133 * s}" rx="${14 * s}" ry="${4.5 * s}"/></g>` +
      // Barbe de Saint-Antoine : lichens pendus aux branches.
      `<path d="M${t(-40, -58)}v${14 * s}M${t(30, -76)}v${16 * s}M${t(-38, -108)}v${12 * s}M${t(14, -118)}v${13 * s}M${t(-24, -60)}v${9 * s}" stroke="#c9d8c1" stroke-width="${1.5 * s}" stroke-linecap="round"/>`;
  };
  const touffe = (x, base, couleur, s = 1) => `<path d="M${x} ${base}q${-10 * s} ${-6 * s} ${-16 * s} ${-14 * s}M${x} ${base}q${-2 * s} ${-12 * s} ${2 * s} ${-18 * s}M${x} ${base}q${10 * s} ${-6 * s} ${16 * s} ${-14 * s}M${x} ${base}q${-8 * s} ${-14 * s} ${-6 * s} ${-20 * s}M${x} ${base}q${8 * s} ${-14 * s} ${8 * s} ${-20 * s}" fill="none" stroke="${couleur}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`;
  const filao = (x, base, s = 1) => {
    // Filao : tronc fin et haut, houppes gris-vert d'où retombent de fines aiguilles.
    const t = (dx, dy) => `${x + dx * s} ${base + dy * s}`;
    const houppe = (cx, cy, r) => `<path d="M${t(cx - r, cy)}q${r * s * .3} ${-r * s * 1.1} ${r * s} ${-r * s * .9}q${r * s * .8} ${-r * s * .1} ${r * s} ${r * s * .9}q${-r * s * .5} ${r * s * .6} ${-r * s} ${r * s * .5}q${-r * s * .6} ${r * s * .1} ${-r * s} ${-r * s * .5}Z" fill="#7f9f8a"/>` +
      `<path d="M${t(cx - r * .6, cy + r * .3)}q-1 ${8 * s} -3 ${14 * s}M${t(cx - r * .2, cy + r * .5)}q0 ${9 * s} -1 ${16 * s}M${t(cx + r * .25, cy + r * .5)}q1 ${8 * s} 0 ${15 * s}M${t(cx + r * .6, cy + r * .3)}q2 ${7 * s} 2 ${13 * s}" fill="none" stroke="#7f9f8a" stroke-width="${1.6 * s}" stroke-linecap="round"/>`;
    return `<path d="M${t(-3, 0)}L${t(-2, -84)}L${t(2, -84)}L${t(3, 0)}Z" fill="#7b6552"/>` +
      `<path d="M${t(0, -72)}L${t(-18, -90)}M${t(0, -80)}L${t(16, -100)}M${t(0, -84)}L${t(-6, -112)}" stroke="#7b6552" stroke-width="${2.6 * s}" stroke-linecap="round" fill="none"/>` +
      houppe(-20, -92, 14) + houppe(18, -102, 15) + houppe(-6, -116, 13) + houppe(6, -84, 11);
  };
  const vacoa = (x, base, s = 1) => {
    // Vacoa : racines-échasses, tronc court, bouquet de feuilles rigides.
    const t = (dx, dy) => `${x + dx * s} ${base + dy * s}`;
    return `<path d="M${t(-14, 0)}L${t(-4, -22)}M${t(14, 0)}L${t(4, -22)}M${t(-4, 0)}L${t(0, -22)}M${t(0, -22)}V${t(0, -44)}" stroke="#8a7358" stroke-width="${4 * s}" stroke-linecap="round" fill="none"/>` +
      `<path d="M${t(0, -44)}l-30 -8M${t(0, -44)}l-26 -22M${t(0, -44)}l-8 -30M${t(0, -44)}l10 -30M${t(0, -44)}l26 -20M${t(0, -44)}l32 -4M${t(0, -44)}l-24 6M${t(0, -44)}l26 8" stroke="#4c8a6c" stroke-width="${3.4 * s}" stroke-linecap="round" fill="none"/>`;
  };
  const nuage = (x, y, s = 1) => `<path d="M${x} ${y}q${13 * s} ${-21 * s} ${31 * s} ${-6 * s}q${20 * s} ${-14 * s} ${34 * s} ${6 * s}Z" fill="#fffdf0" opacity=".85"/>`;
  const ZONES = [
    { // 0-30 s : la forêt de tamarins des Hauts, brume au ras des collines.
      nom: "Forêt de tamarins", ciel: ["#eef3e3", "#d6e4cf"], sol: "#c9bb97", ligne: "#5c866e",
      cielDessin: `<circle cx="463" cy="65" r="27" fill="#fff3bb"/>${nuage(54, 60)}${nuage(320, 43)}`,
      loin: [`<path d="M0 214C30 206 110 166 170 180C230 194 260 226 320 206C380 186 420 140 480 160C530 178 570 206 600 214V290H0Z" fill="#b8ceb0"/>`,
        `<path d="M0 246${Array.from({ length: 15 }, (_, i) => `Q${i * 40 + 20} 224 ${i * 40 + 40} 246`).join("")}V290H0Z" fill="#9cba99"/>`],
      // La brume des Hauts flotte au ras des collines, devant le lointain.
      voile: `<rect x="-600" y="232" width="2400" height="44" fill="#ffffff" opacity=".3"/>`,
      pres: [tamarin(110, 276, 1.05) + fanjan(190, 276, .9) + tamarin(300, 276, .9) + fanjan(380, 276, 1.1) + tamarin(490, 276, 1.1) + fanjan(560, 276, .8),
        touffe(24, 272, "#5f9470") + touffe(230, 272, "#6a9a74", .8) + touffe(430, 272, "#5f9470", .9) + touffe(585, 272, "#6a9a74", .7)],
      solDessin: `<path d="M8 307h22m34-15h13m36 21h24m28-12h14" stroke="#a89572" stroke-width="3" stroke-linecap="round"/><path d="M118 300a4 3 0 1 1 8 0Z" fill="#8fa88c"/><path d="M40 316a3 2 0 1 1 6 0Z" fill="#8fa88c"/><path d="M162 314a3 2 0 1 1 6 0Z" fill="#a89572"/>`
    },
    { // 30-60 s : les remparts d'un cirque, murailles de basalte, cascade dans une entaille.
      nom: "Les remparts", ciel: ["#e4eaef", "#c7d3db"], sol: "#c8c1b5", ligne: "#5a6c71",
      cielDessin: `<circle cx="96" cy="52" r="20" fill="#fff8dc" opacity=".8"/>${nuage(420, 40, .8)}${nuage(180, 62, .6)}`,
      // Deux murailles : la plus lointaine, bleutée, aux sommets plats ; la plus
      // proche, sombre, striée de coulées verticales, avec la cascade au fond de son entaille.
      loin: [`<path d="M0 134L20 128 40 104 56 70 68 62 84 84 98 120 128 126 150 96 166 60 178 48 190 66 206 100 222 118 250 122 276 90 296 66 310 78 326 60 338 56 352 82 368 108 390 118 420 114 440 84 456 58 470 72 486 96 504 88 522 104 544 126 570 130 600 134V290H0Z" fill="#7d8a95"/>`,
        `<path d="M66 66L72 116M178 52L186 112M338 60L346 110M456 62L462 108M296 70L300 114" stroke="#8e9aa4" stroke-width="2.5" stroke-linecap="round"/>`,
        `<path d="M0 190L22 186 40 160 54 130 66 122 80 140 92 170 110 180 130 176 148 150 162 126 172 118 186 136 200 168 220 180 244 182 250 168 258 162 266 162 274 168 280 182 300 180 316 152 330 132 342 126 356 142 372 172 392 182 424 180 440 154 452 134 462 128 476 146 494 176 516 184 546 186 600 190V290H0Z" fill="#5b6670"/>`,
        `<path d="M64 126L70 168M56 134L60 172M170 122L178 166M160 132L164 170M340 130L348 172M328 138L332 174M460 132L468 172M450 140L454 176M120 178L124 166M400 180L404 168" stroke="#6f7b85" stroke-width="3" stroke-linecap="round"/>`,
        // La cascade : un ruban clair qui tombe de l'entaille jusqu'à un nuage d'embruns.
        `<path class="runner-cascade" d="M262 164V232" stroke="#eef5f8" stroke-width="5" stroke-linecap="round" opacity=".9"/><path class="runner-cascade-fil" d="M262 164V232" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 14" opacity=".9"/><ellipse cx="262" cy="234" rx="16" ry="6" fill="#ffffff" opacity=".7"/>`,
        // Les rebords sont piquetés de végétation.
        `<g fill="#4f7060"><ellipse cx="84" cy="152" rx="9" ry="3"/><ellipse cx="192" cy="150" rx="9" ry="3"/><ellipse cx="362" cy="156" rx="9" ry="3"/><ellipse cx="482" cy="158" rx="9" ry="3"/><ellipse cx="124" cy="180" rx="12" ry="3"/><ellipse cx="410" cy="182" rx="12" ry="3"/><ellipse cx="530" cy="185" rx="12" ry="3"/><ellipse cx="228" cy="182" rx="10" ry="3"/></g>`,
        `<path d="M0 238C60 222 120 242 180 230C240 218 300 246 360 232C420 218 480 244 540 230C570 224 590 232 600 238V290H0Z" fill="#6d8877"/>`],
      // Des écharpes de nuages accrochées aux parois.
      voile: `<g fill="#ffffff" opacity=".42"><ellipse cx="150" cy="152" rx="46" ry="4"/><ellipse cx="136" cy="148" rx="22" ry="3"/><ellipse cx="420" cy="160" rx="54" ry="4"/><ellipse cx="440" cy="156" rx="26" ry="3"/><ellipse cx="560" cy="150" rx="34" ry="3.5"/></g>`,
      pres: [`<path d="M0 258C40 246 70 262 110 252C150 242 180 262 230 254C280 246 310 264 360 256C410 248 440 266 490 256C540 246 570 262 600 258V290H0Z" fill="#587a68"/>`,
        `<path d="M40 262C48 240 76 240 84 262Z" fill="#737e88"/><path d="M52 262C54 250 70 248 76 262Z" fill="#8a949c"/>`,
        `<path d="M300 264C306 236 350 236 356 264Z" fill="#6b7680"/><path d="M318 264C320 248 344 246 348 264Z" fill="#828d96"/>`,
        `<path d="M170 266q-14-10-30-8M170 266q-8-16-4-28M170 266q10-14 26-12M170 266q2-18-8-26M170 266q12-8 30-2" fill="none" stroke="#7fa58c" stroke-width="3.2" stroke-linecap="round"/>`,
        `<path d="M470 266q-14-10-30-8M470 266q-8-16-4-28M470 266q10-14 26-12M470 266q2-18-8-26M470 266q12-8 30-2" fill="none" stroke="#7fa58c" stroke-width="3.2" stroke-linecap="round"/>`,
        `<ellipse cx="240" cy="266" rx="26" ry="9" fill="#4d7262"/><ellipse cx="420" cy="267" rx="20" ry="8" fill="#4d7262"/><ellipse cx="560" cy="266" rx="22" ry="8" fill="#4d7262"/><ellipse cx="20" cy="267" rx="16" ry="7" fill="#4d7262"/>`],
      solDessin: `<path d="M10 306h24m30-14h12m40 20h22m36-10h16" stroke="#a49c92" stroke-width="3" stroke-linecap="round"/><path d="M96 308a5 4 0 1 1 10 0Z" fill="#9aa2a9"/><path d="M160 296a4 3 0 1 1 8 0Z" fill="#9aa2a9"/>`
    },
    { // 60-90 s : la Plaine des Sables et le cône du volcan, fumerolles, sol rouge.
      nom: "Plaine des Sables", ciel: ["#f6e8d5", "#ebcfb2"], sol: "#c98b5e", ligne: "#7b3f2e",
      cielDessin: `<circle cx="500" cy="70" r="26" fill="#ffd9a0"/>`,
      loin: [`<path d="M0 196L40 194 70 180 120 178 160 186 210 184 250 176 300 178 340 172 400 174 450 168 500 172 540 180 580 190 600 196V290H0Z" fill="#6b3a2e"/>`,
        `<path d="M0 214C80 214 160 208 240 196C280 190 330 106 372 98C414 90 470 178 520 196C560 210 580 214 600 214V290H0Z" fill="#8c4b38"/>`,
        `<path d="M372 98C414 90 470 178 520 196L470 200C440 170 400 120 372 98Z" fill="#a8654b"/><path d="M358 104C366 100 378 100 386 104L378 92L364 92Z" fill="#5e3428"/>`,
        // Coulées anciennes sur le flanc, plaques de sable clair au pied.
        `<path d="M366 106C356 140 344 168 336 194M378 106C384 134 396 160 410 186" fill="none" stroke="#6f3a2c" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
        `<g class="runner-fumerolle" fill="#f7f1ea" opacity=".85"><ellipse cx="372" cy="80" rx="9" ry="6"/><ellipse cx="378" cy="66" rx="12" ry="8"/><ellipse cx="386" cy="50" rx="15" ry="9"/></g>`,
        `<path d="M0 226C60 222 100 232 160 228C220 224 260 234 320 230C380 226 420 236 480 232C540 228 570 226 600 226V290H0Z" fill="#c78d5f"/>`,
        `<g fill="#d9a771" opacity=".55"><ellipse cx="130" cy="242" rx="50" ry="4"/><ellipse cx="330" cy="246" rx="40" ry="3.5"/><ellipse cx="520" cy="241" rx="44" ry="4"/></g>`,
        `<path d="M40 226C50 210 90 210 100 226Z" fill="#9a5540"/><path d="M200 230C214 210 262 210 276 230Z" fill="#9a5540"/><path d="M232 218a6 3 0 1 1 12 0Z" fill="#5e3428"/>`],
      pres: [`<path d="M0 262C40 258 60 250 100 254C140 258 160 264 220 260C280 256 300 248 360 254C420 260 440 262 500 258C540 254 570 260 600 262V290H0Z" fill="#a0553d"/>`,
        `<path d="M120 266C130 244 170 244 180 266Z" fill="#5e3428"/><path d="M380 266C392 240 440 240 452 266Z" fill="#6f3a2c"/><path d="M398 266C404 252 430 250 436 266Z" fill="#8a4a37"/>`,
        `<path d="M60 268c-4-14 2-22-4-32M60 268c6-12 12-16 18-26M60 268c2-16-6-20-2-30M60 268c8-6 20-8 26-14" fill="none" stroke="#6b4b3d" stroke-width="2.4" stroke-linecap="round"/>`,
        `<path d="M300 268c-4-14 2-22-4-32M300 268c6-12 12-16 18-26M300 268c2-16-6-20-2-30" fill="none" stroke="#6b4b3d" stroke-width="2.4" stroke-linecap="round"/>`,
        `<path d="M520 268c-4-14 2-22-4-32M520 268c6-12 12-16 18-26M520 268c8-6 20-8 26-14" fill="none" stroke="#6b4b3d" stroke-width="2.4" stroke-linecap="round"/>`,
        `<ellipse cx="240" cy="268" rx="18" ry="6" fill="#5e3428"/><ellipse cx="560" cy="268" rx="14" ry="5" fill="#5e3428"/><ellipse cx="20" cy="268" rx="12" ry="5" fill="#6f3a2c"/>`],
      solDessin: `<path d="M12 306h20m34-14h14m38 20h20m30-10h14" stroke="#e0b58c" stroke-width="3" stroke-linecap="round"/><circle cx="90" cy="310" r="2.6" fill="#5e3428"/><circle cx="150" cy="298" r="2.2" fill="#5e3428"/><circle cx="186" cy="314" r="2" fill="#5e3428"/><circle cx="40" cy="318" r="1.8" fill="#5e3428"/>`
    },
    { // 90 s et plus : le littoral, lagon, barrière de corail, filaos et vacoas.
      nom: "Le littoral", ciel: ["#d6edf6", "#b2dcec"], sol: "#efe3c4", ligne: "#d6c39d",
      cielDessin: `<circle cx="470" cy="60" r="28" fill="#fff0a8"/>${nuage(80, 70, .9)}${nuage(330, 52, .7)}`,
      fond: `<rect x="-600" y="204" width="2400" height="86" fill="#3c8db2"/>`,
      loin: [// La barrière de corail : une ligne d'écume irrégulière, puis le lagon.
        `<path d="M0 224C30 218 50 230 80 224C110 218 130 230 160 224C190 218 220 232 250 224C280 216 300 230 330 224C360 218 380 230 410 224C440 218 470 232 500 224C530 216 560 230 600 224V290H0Z" fill="#8dd2d5"/>`,
        `<path class="runner-ecume" d="M0 224C30 218 50 230 80 224C110 218 130 230 160 224C190 218 220 232 250 224C280 216 300 230 330 224C360 218 380 230 410 224C440 218 470 232 500 224C530 216 560 230 600 224" fill="none" stroke="#f4fafc" stroke-width="5" stroke-linecap="round" opacity=".95"/>`,
        `<path d="M0 252C40 248 80 256 120 252C160 248 200 256 240 252C280 248 320 256 360 252C400 248 440 256 480 252C520 248 560 256 600 252V290H0Z" fill="#b7e6e2"/>`,
        `<g class="runner-vagues" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M20 238q10-4 20 0M140 244q10-4 20 0M260 236q10-4 20 0M380 246q10-4 20 0M500 240q10-4 20 0"/></g>`],
      pres: [`<path d="M0 266C60 262 120 268 180 264C240 260 300 268 360 264C420 260 480 268 540 264C570 262 590 264 600 266V290H0Z" fill="#e6d7b3"/>`,
        filao(80, 274, 1) + vacoa(200, 274, 1) + filao(320, 274, .9) + filao(470, 274, 1.05) + vacoa(560, 274, .8),
        `<path d="M130 270q10-6 22-2M400 270q8-6 20-2" fill="none" stroke="#7aa48a" stroke-width="2.6" stroke-linecap="round"/>`],
      solDessin: `<path d="M8 306h20m38-14h12m34 20h22m32-10h14" stroke="#cdbb99" stroke-width="3" stroke-linecap="round"/><path d="M112 300a5 4 0 1 1 10 0Z" fill="#fbf6ea"/><path d="M60 316a4 3 0 1 1 8 0Z" fill="#fbf6ea"/><path d="M170 310l4-6 4 6Z" fill="#f2c8b6"/>`
    }
  ];
  // Le paille-en-queue traverse le ciel de temps en temps, de droite à gauche.
  const OISEAU = { premier: 18, toutesLes: 40, duree: 9 };
  window.ShortGameRunnerView = function (stage) {
    const zone = (k, contenu) => `<g class="runner-zone" data-zone="${k}">${contenu}</g>`;
    stage.innerHTML = `<svg class="game-scene runner-scene" viewBox="0 0 600 330" role="img" aria-label="Course du dodo : saute les cailloux, les troncs et les rochers, passe sous les branches.">
      <defs>${ZONES.map((z, k) => `<linearGradient id="runner-ciel-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${z.ciel[0]}"/><stop offset="1" stop-color="${z.ciel[1]}"/></linearGradient>`).join("")}</defs>
      <g class="runner-sky">${ZONES.map((z, k) => zone(k, `<rect width="600" height="330" fill="url(#runner-ciel-${k})"/>${z.cielDessin}`)).join("")}</g>
      <g class="runner-hills">${ZONES.map((z, k) => zone(k, (z.fond || "") + lointain(z.loin) + (z.voile || ""))).join("")}</g>
      <g class="runner-bird" opacity="0" aria-hidden="true"><path class="runner-bird-tail" d="M6 0l40 4M6 0l40-2" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="0" cy="0" rx="12" ry="4" fill="#ffffff"/><path class="runner-bird-wings" d="M-2 0l-14-11 6 0M-2 0l14-11-6 0" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="#ffffff"/><path d="M-6 -1l-4 1" stroke="#222" stroke-width="1.4"/><path d="M-12 0l-4 1" stroke="#f0a35a" stroke-width="2"/></g>
      <g class="runner-trees">${ZONES.map((z, k) => zone(k, proche(z.pres))).join("")}</g>
      <g class="runner-soils">${ZONES.map((z, k) => zone(k, `<rect y="270" width="600" height="60" fill="${z.sol}"/><path d="M0 272H600" stroke="${z.ligne}" stroke-width="7"/>`)).join("")}</g>
      <g class="runner-ground">${ZONES.map((z, k) => zone(k, sol(z.solDessin))).join("")}</g>
      <ellipse class="runner-shadow" cx="121" cy="274" rx="25" ry="5" fill="#465d47" opacity=".2"/>
      <g class="runner-obstacles"></g>
      <g class="runner-dodo" transform="translate(94 270)">
        <g class="runner-feet" stroke="#c4822c" stroke-width="4" stroke-linecap="round" fill="none"><path class="runner-foot-one" d="M18-13 15-2h9"/><path class="runner-foot-two" d="M31-13 35-2h8"/></g>
        <path d="M10-29Q-4-29-3-43Q9-42 14-33" fill="#4c7c81"/>
        <ellipse cx="23" cy="-26" rx="22" ry="19" fill="#70989a"/>
        <ellipse cx="23" cy="-20" rx="16" ry="11" fill="#e8eddf"/>
        <path d="M31-30Q29-43 35-50Q45-58 53-47L50-32 40-23" fill="#88aaaa"/>
        <path d="M48-44Q66-47 64-35Q59-30 49-35Z" fill="#edbc4f"/><path d="M51-38h12" stroke="#b98c35" stroke-width="1.3"/>
        <circle cx="46" cy="-47" r="2.7" fill="#173f41"/><circle cx="47" cy="-48" r=".9" fill="white"/>
        <path class="runner-wing" d="M11-31Q19-17 34-29" fill="#507c80" stroke="#3e686d" stroke-width="1.5"/>
      </g>
      <g class="runner-lives" transform="translate(16 18)" aria-hidden="true"></g>
    </svg>`;
    const svg = stage.querySelector("svg"), group = svg.querySelector(".runner-obstacles");
    const bird = svg.querySelector(".runner-dodo"), shadow = svg.querySelector(".runner-shadow");
    const hills = svg.querySelector(".runner-hills"), trees = svg.querySelector(".runner-trees"), ground = svg.querySelector(".runner-ground");
    const feet = [svg.querySelector(".runner-foot-one"), svg.querySelector(".runner-foot-two")];
    const lives = svg.querySelector(".runner-lives");
    const oiseau = svg.querySelector(".runner-bird"), ailes = svg.querySelector(".runner-bird-wings");
    const nodes = new Map();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Les morceaux de chaque zone (ciel, lointain, proche, sol, marques) sont
    // montrés ou cachés ensemble ; le fondu est porté par une transition en
    // ligne, pour ne pas dépendre de la feuille de style mise en cache.
    const parts = ZONES.map((_, k) => [...svg.querySelectorAll(`.runner-zone[data-zone="${k}"]`)]);
    parts.forEach((list, k) => list.forEach(n => { n.style.opacity = k === 0 ? "1" : "0"; if (k > 0) n.style.display = "none"; }));
    const anim = ZONES.map((_, k) => ({
      fumerolle: svg.querySelectorAll(`.runner-zone[data-zone="${k}"] .runner-fumerolle`),
      cascade: svg.querySelectorAll(`.runner-zone[data-zone="${k}"] .runner-cascade-fil`),
      vagues: svg.querySelectorAll(`.runner-zone[data-zone="${k}"] .runner-vagues`)
    }));
    let biome = -1, drawnLives = -1;
    const HEART = "M11 20C11 20 1.6 14.3 1.6 7.7 1.6 4.3 4.1 2 7 2c1.7 0 3.2.8 4 2.1C11.8 2.8 13.3 2 15 2c2.9 0 5.4 2.3 5.4 5.7C20.4 14.3 11 20 11 20Z";
    function paintLives(count, total) {
      if (count === drawnLives) return;
      drawnLives = count;
      // Une pastille claire sous les cœurs : ils restent lisibles sur les remparts sombres comme sur le lagon.
      lives.innerHTML = `<rect x="-8" y="-5" width="${total * 27 + 12}" height="33" rx="16" fill="#ffffff" opacity=".55"/>` + Array.from({ length: total }, (_, i) =>
        `<path transform="translate(${i * 27} 0) scale(1.15)" d="${HEART}" fill="${i < count ? "#cf5a52" : "#ffffff00"}" stroke="${i < count ? "#a8423c" : "#00000038"}" stroke-width="1.8"/>`).join("");
    }
    function showZone(k) {
      const previous = biome; biome = k;
      parts[k].forEach(n => { n.style.display = ""; });
      if (previous >= 0 && !reduced) {
        svg.getBoundingClientRect(); // Le nouveau plan est posé avant que le fondu commence.
        parts[k].forEach(n => { n.style.transition = "opacity 1.1s ease"; });
        parts[previous].forEach(n => { n.style.transition = "opacity 1.1s ease"; });
      }
      parts[k].forEach(n => { n.style.opacity = "1"; });
      if (previous >= 0) parts[previous].forEach(n => { n.style.opacity = "0"; });
      // L'avant-dernière zone, déjà effacée, ne coûte plus rien à dessiner.
      if (previous >= 1) parts[previous - 1].forEach(n => { n.style.display = "none"; });
    }
    // Chaque obstacle prend l'allure du lieu qu'il traverse.
    function obstacle(o) {
      const n = document.createElementNS(ns, "g"); n.dataset.obstacle = o.type; n.dataset.obstacleId = o.id;
      const { w, h, bottom } = o, z = Math.max(0, biome), top = -bottom - h;
      if (o.type === "branche") {
        if (z === 3) {
          // Branche de filao : bois fin, houppes d'aiguilles qui retombent sur le passage.
          const aiguilles = x => `<path d="M${x} ${top + 5}q-3 ${h * .4} -6 ${h - 4}M${x} ${top + 5}q0 ${h * .45} -1 ${h - 2}M${x} ${top + 5}q3 ${h * .4} 5 ${h - 3}M${x} ${top + 5}q-7 ${h * .3} -11 ${h * .55}M${x} ${top + 5}q7 ${h * .3} 11 ${h * .55}" fill="none" stroke="#7f9f8a" stroke-width="2.2" stroke-linecap="round"/>`;
          n.innerHTML = `<path d="M0 ${top + 3}Q${w * .5} ${top - 3} ${w} ${top + 6}" fill="none" stroke="#7b6552" stroke-width="6" stroke-linecap="round"/>` +
            `<g fill="#7f9f8a"><ellipse cx="${w * .2}" cy="${top + 1}" rx="${Math.min(16, w * .12)}" ry="6"/><ellipse cx="${w * .5}" cy="${top - 3}" rx="${Math.min(18, w * .14)}" ry="6"/><ellipse cx="${w * .8}" cy="${top + 1}" rx="${Math.min(16, w * .12)}" ry="6"/></g>` +
            [.14, .3, .46, .62, .78, .92].map(k => aiguilles(w * k)).join("") + `<path d="M${w - 16} ${-bottom - 3}l-3 12" stroke="#7b6552" stroke-width="4" stroke-linecap="round"/>`;
        } else if (z === 2) {
          // Branche de bois mort, blanchie, sans feuille.
          n.innerHTML = `<path d="M0 ${top + 4}Q${w * .3} ${top - 2} ${w * .55} ${top + 8}T${w} ${top + 4}" fill="none" stroke="#7d6248" stroke-width="9" stroke-linecap="round"/><path d="M${w * .3} ${top + 2}l6 ${h - 4}M${w * .62} ${top + 6}l-4 ${h - 8}M${w * .84} ${top + 3}l6 ${h - 6}" stroke="#7d6248" stroke-width="5" stroke-linecap="round"/><path d="M${w * .1} ${top + 5}q${w * .2} -5 ${w * .35} 2" fill="none" stroke="#b39a7c" stroke-width="2" stroke-linecap="round"/>`;
        } else {
          // Branche de tamarin : tordue, lichen pendu, feuilles menues.
          n.innerHTML = `<path d="M0 ${top + 5}C${w * .2} ${top - 4} ${w * .35} ${top + 12} ${w * .55} ${top + 6}S${w * .85} ${top - 2} ${w} ${top + 5}" fill="none" stroke="#7f6d5b" stroke-width="10" stroke-linecap="round"/>` +
            `<path d="M${w * .18} ${top + 6}q${w * .1} -10 ${w * .22} -2M${w * .62} ${top + 4}q${w * .08} -10 ${w * .2} -3" fill="none" stroke="#9d8b76" stroke-width="2" stroke-linecap="round"/>` +
            `<g fill="#4f7f66"><ellipse cx="${w * .22}" cy="${top - 6}" rx="${Math.min(22, w * .16)}" ry="8"/><ellipse cx="${w * .5}" cy="${top - 10}" rx="${Math.min(24, w * .18)}" ry="9"/><ellipse cx="${w * .78}" cy="${top - 6}" rx="${Math.min(22, w * .16)}" ry="8"/></g><g fill="#6a9a74"><ellipse cx="${w * .3}" cy="${top - 9}" rx="9" ry="4"/><ellipse cx="${w * .66}" cy="${top - 12}" rx="9" ry="4"/></g>` +
            `<path d="M${w * .4} ${top + 10}v${h - 8}M${w * .7} ${top + 9}v${h - 10}" stroke="#c7d6bf" stroke-width="1.6" stroke-linecap="round"/><path d="M${w - 18} ${-bottom - 3}l-4 12" stroke="#7f6d5b" stroke-width="5" stroke-linecap="round"/>`;
        }
      } else if (o.type === "caillou") {
        const teintes = [["#5f6874", "#828d99"], ["#5f6874", "#828d99"], ["#3b2a27", "#6f4a3f"], ["#4e5661", "#7c8794"]][z];
        n.innerHTML = `<path d="M0 0 ${w * .12} ${-h * .78} ${w * .45} ${-h} ${w * .8} ${-h * .72} ${w} 0Z" fill="${teintes[0]}"/><path d="M${w * .12} ${-h * .78} ${w * .45} ${-h} ${w * .6} ${-h * .42}Z" fill="${teintes[1]}"/>` +
          (z === 0 ? `<path d="M${w * .3} ${-h * .5}q4-6 9-2" fill="none" stroke="#7fa585" stroke-width="2" stroke-linecap="round"/>` : "");
      } else if (o.type === "rocher") {
        // Bloc de basalte : facettes anguleuses ; mousse dans la forêt, poussière rouge au volcan.
        const teintes = [["#4e5561", "#6f7987", "#7fa585"], ["#4a525d", "#6b7683", "#a4aeb5"], ["#4a3430", "#6d4a42", "#b46a4e"], ["#3e464f", "#5f6a76", "#e3e8ea"]][z];
        n.innerHTML = `<path d="M0 0 3 ${-h * .62} ${w * .36} ${-h} ${w * .78} ${-h * .87} ${w} ${-h * .35} ${w} 0Z" fill="${teintes[0]}"/><path d="M3 ${-h * .62} ${w * .36} ${-h} ${w * .55} ${-h * .3}Z" fill="${teintes[1]}"/><path d="M${w * .58} ${-h * .72}l${w * .16} 13" stroke="${teintes[2]}" stroke-width="3"/>` +
          (z === 0 ? `<path d="M${w * .2} ${-h * .5}q${w * .1} -8 ${w * .22} -2" fill="none" stroke="#7fa585" stroke-width="3" stroke-linecap="round"/>` : z === 2 ? `<path d="M${w * .3} ${-h * .2}h${w * .4}" stroke="#b46a4e" stroke-width="3" stroke-linecap="round" opacity=".8"/>` : "");
      } else if (z === 2) {
        // Coulée refroidie : lave cordée noire, fentes encore rouges.
        const coulee = (x, width) => `<path d="M${x} 0C${x + 2} ${-h * .7} ${x + width * .3} ${-h} ${x + width * .5} ${-h * .95}C${x + width * .75} ${-h} ${x + width - 2} ${-h * .6} ${x + width} 0Z" fill="#3b2a27"/><path d="M${x + 6} ${-h * .55}q${width * .2} -6 ${width * .42} -2M${x + width * .5} ${-h * .3}q${width * .18} -4 ${width * .38} 0" fill="none" stroke="#5b433c" stroke-width="2.5" stroke-linecap="round"/><path d="M${x + width * .3} ${-h * .25}l4 -7M${x + width * .7} ${-h * .5}l3 -6" stroke="#e0612f" stroke-width="2" stroke-linecap="round"/>`;
        n.innerHTML = o.type === "double" ? coulee(0, w * .48) + coulee(w * .52, w * .48) : coulee(0, w);
      } else {
        // Tronc couché : tamarin gris dans les Hauts, bois flotté pâle sur la plage.
        const [bois, fibre] = [["#7f6d5b", "#a08d77"], ["#6e5a49", "#96806a"], null, ["#9b7c58", "#cdb086"]][z];
        const log = (x, width) => `<rect x="${x}" y="${-h}" width="${width}" height="${h}" rx="6" fill="${bois}"/><path d="M${x + 7} ${-h + 7}h${Math.max(2, width - 14)}m${-Math.max(2, width - 14)} 10h${Math.max(2, width - 14)}" stroke="${fibre}" stroke-width="3" stroke-linecap="round"/>` +
          (z === 0 ? `<circle cx="${x + width * .3}" cy="${-h * .5}" r="3" fill="#6b5a4a"/><circle cx="${x + width * .3}" cy="${-h * .5}" r="1.2" fill="#a08d77"/>` : "");
        n.innerHTML = o.type === "double" ? log(0, w * .48) + log(w * .52, w * .48) : log(0, w);
      }
      group.append(n); nodes.set(o.id, n); return n;
    }
    function drawBird(elapsed) {
      const depuis = elapsed - OISEAU.premier;
      const phase = depuis < 0 ? -1 : (depuis % OISEAU.toutesLes) / OISEAU.duree;
      if (reduced || phase < 0 || phase > 1) { oiseau.setAttribute("opacity", "0"); return; }
      const x = 660 - phase * 760, y = 74 + Math.sin(phase * Math.PI * 2.2) * 12 - phase * 18;
      oiseau.setAttribute("opacity", "1");
      oiseau.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.cos(phase * Math.PI * 2.2) * -5).toFixed(1)})`);
      const battement = Math.abs(Math.sin(elapsed * 9));
      ailes.setAttribute("transform", `scale(1 ${(.35 + .65 * battement).toFixed(2)})`);
    }
    return function draw(model) {
      const zone = Math.min(ZONES.length - 1, Math.floor(model.elapsed / 30));
      if (zone !== biome) showZone(zone);
      if (!reduced) {
        hills.setAttribute("transform", `translate(${-model.distance * .12 % 600} 0)`);
        trees.setAttribute("transform", `translate(${-model.distance * .32 % 600} 0)`);
        ground.setAttribute("transform", `translate(${-model.distance % 200} 0)`);
        // Les petits mouvements du décor suivent le temps de course : ils s'arrêtent avec la pause.
        const a = anim[zone], t = model.elapsed;
        a.fumerolle.forEach(n => n.setAttribute("transform", `translate(${(Math.sin(t * .8) * 4).toFixed(1)} ${(-(t * 6 % 14)).toFixed(1)})`));
        a.cascade.forEach(n => n.setAttribute("stroke-dashoffset", String(-(t * 60 % 20))));
        a.vagues.forEach(n => n.setAttribute("transform", `translate(${(-(t * 10 % 120)).toFixed(1)} 0)`));
      }
      drawBird(model.elapsed);
      const lift = model.y, step = lift > 0 || reduced ? 0 : Math.sin(model.distance / 13) * 6;
      bird.setAttribute("transform", `translate(${model.x} ${270-lift}) rotate(${lift>0 ? Math.max(-9,Math.min(8,-model.vy/60)) : 0} 25 -20)`);
      bird.dataset.height = lift.toFixed(2);
      // Après une touche, le dodo clignote le temps de son invincibilité.
      bird.setAttribute("opacity", model.hurt > 0 ? (reduced ? ".45" : (Math.floor(model.hurt * 12) % 2 ? ".35" : "1")) : "1");
      feet[0].setAttribute("transform", `translate(${step} 0)`); feet[1].setAttribute("transform", `translate(${-step} 0)`);
      shadow.setAttribute("rx", String(25-lift*.09)); shadow.setAttribute("opacity", String(.22-lift*.001));
      paintLives(model.lives, window.ShortGames?.RUNNER?.vies ?? 2);
      const visible = new Set();
      model.obstacles.forEach(o => { const n=nodes.get(o.id)||obstacle(o); n.setAttribute("transform", `translate(${o.x.toFixed(2)} 270)`); visible.add(o.id); });
      nodes.forEach((n,id) => { if (!visible.has(id)) { n.remove(); nodes.delete(id); } });
    };
  };
})();
