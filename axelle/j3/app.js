(function () {
  const data = window.AXELLE_J3;
  if (!data) return;

  const $ = id => document.getElementById(id);
  const screens = {
    home: $("home-screen"), lobby: $("lobby-screen"), lesson: $("lesson-screen"),
    quiz: $("quiz-screen"), done: $("done-screen"), game: $("game-screen")
  };
  const STORAGE = `axelle-j3-v${data.version}`;
  let currentVersion = 0;
  let currentSubject = "math";
  let questionIndex = 0;
  let questionLocked = false;
  let levelIndex = 0;
  let levelPosition = [0, 0];
  let levelFruits = [];

  const read = key => {
    try { return JSON.parse(localStorage.getItem(`${STORAGE}-${key}`)) || null; }
    catch (_) { return null; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(`${STORAGE}-${key}`, JSON.stringify(value)); }
    catch (_) { /* Le parcours reste utilisable si le stockage est indisponible. */ }
  };
  const progressKey = (version, subject) => `${version}-${subject}`;
  const getProgress = (version, subject) => read(progressKey(version, subject)) || {answers: {}};
  const saveProgress = (version, subject, progress) => write(progressKey(version, subject), progress);
  const answerCount = (version, subject) => Object.keys(getProgress(version, subject).answers).length;
  const subjectTotal = (version, subject) => data.versions[version][subject].length;
  const versionTotal = version => subjectTotal(version, "math") + subjectTotal(version, "fr");
  const isSubjectComplete = (version, subject) => answerCount(version, subject) === subjectTotal(version, subject);
  const isVersionComplete = version => isSubjectComplete(version, "math") && isSubjectComplete(version, "fr");

  function show(name) {
    Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; });
    window.scrollTo({top: 0, behavior: "instant"});
  }

  function setBar(element, value, total) {
    element.style.width = `${Math.max(0, Math.min(100, value / total * 100))}%`;
  }

  function refreshHome() {
    [0, 1].forEach(version => {
      const count = answerCount(version, "math") + answerCount(version, "fr");
      const total = versionTotal(version);
      $(`v${version}-progress`).textContent = `${count} / ${total}`;
      setBar($(`v${version}-bar`), count, total);
      const button = document.querySelector(`[data-open-version="${version}"]`);
      if (version === 0) button.textContent = count ? (count === total ? "Revoir l’expédition" : "Continuer l’expédition") : "Commencer l’expédition";
    });
    $("revenge-card").classList.remove("locked");
    $("revenge-button").disabled = false;
    $("revenge-button").textContent = isVersionComplete(1) ? "Revoir la revanche" : answerCount(1,"math") + answerCount(1,"fr") ? "Continuer la revanche" : "Commencer la revanche";
    const availableLevels = Number(isVersionComplete(0)) + Number(isVersionComplete(1));
    $("open-game").disabled = availableLevels === 0;
    $("open-game").textContent = availableLevels ? `${availableLevels} niveau${availableLevels > 1 ? "x" : ""} débloqué${availableLevels > 1 ? "s" : ""}` : "Aucun niveau débloqué";
  }

  function goHome() {
    refreshHome();
    history.replaceState(null, "", location.pathname);
    show("home");
  }

  function openVersion(version) {
    currentVersion = version;
    const info = data.versions[version];
    $("lobby-eyebrow").textContent = info.name;
    $("lobby-title").textContent = version === 0 ? "Prépare ton expédition" : "À toi la revanche";
    ["math", "fr"].forEach(subject => {
      const count = answerCount(version, subject);
      const total = subjectTotal(version, subject);
      $(`${subject}-lobby-progress`).textContent = `${count} / ${total}`;
      setBar($(`${subject}-lobby-bar`), count, total);
    });
    history.replaceState(null, "", `${location.pathname}?defi=${version + 1}`);
    show("lobby");
  }

  function lessonVisual(kind) {
    const fraction = `<div class="lesson-fraction"><span class="stacked-fraction"><b>4</b><i></i><b>6</b></span><svg class="lesson-fraction-diagram" viewBox="0 0 280 96"><text x="135" y="15" text-anchor="middle" font-size="20" font-weight="900" fill="#143451">1</text><path d="M135 19v8" stroke="#143451" stroke-width="3"/><rect x="12" y="29" width="246" height="52" rx="4" fill="#fff"/><rect x="12" y="29" width="164" height="52" fill="#facc15"/><rect x="12" y="29" width="246" height="52" rx="4" fill="none" stroke="#143451" stroke-width="4"/><path d="M53 29v52M94 29v52M135 29v52M176 29v52M217 29v52" stroke="#143451" stroke-width="3"/></svg></div>`;
    const visuals = {
      fraction,
      plus9: `<svg viewBox="0 0 280 120"><text x="18" y="28" font-size="20" font-weight="900" fill="#143451">38 + 9</text><path d="M25 84h230" stroke="#143451" stroke-width="3"/><g stroke="#143451" stroke-width="3"><path d="M40 76v16M108 76v16M240 76v16"/></g><path d="M40 68Q74 38 108 68" fill="none" stroke="#f97316" stroke-width="5"/><path d="M108 68Q174 24 240 68" fill="none" stroke="#087a71" stroke-width="5"/><g font-size="15" font-weight="900"><text x="40" y="110" text-anchor="middle">38</text><text x="108" y="110" text-anchor="middle">40</text><text x="240" y="110" text-anchor="middle">47</text><text x="74" y="45" text-anchor="middle" fill="#d95f02">+ 2</text><text x="174" y="30" text-anchor="middle" fill="#087a71">+ 7</text></g></svg>`,
      lines: `<svg viewBox="0 0 290 126"><g stroke="#0755b8" stroke-width="6" stroke-linecap="round"><path d="M20 26h105M20 66h105"/><path d="M218 12v78M172 51h92"/></g><path d="M218 51h20v20" fill="none" stroke="#f97316" stroke-width="4"/><path d="M138 26h15M145 26v40M138 66h15" fill="none" stroke="#087a71" stroke-width="2"/><g font-size="14" font-weight="900" fill="#143451"><text x="72" y="108" text-anchor="middle">parallèles</text><text x="218" y="108" text-anchor="middle">perpendiculaires</text></g></svg>`,
      circle: `<svg viewBox="0 0 310 134"><g><circle cx="74" cy="58" r="43" fill="#fff" stroke="#0755b8" stroke-width="4"/><circle cx="74" cy="58" r="4" fill="#f97316"/><path d="M74 58 112 36" stroke="#087a71" stroke-width="5"/><text x="50" y="119" font-size="14" font-weight="900" fill="#087a71">rayon</text><text x="67" y="64" font-size="14" font-weight="900">O</text></g><g><circle cx="226" cy="58" r="43" fill="#fff" stroke="#0755b8" stroke-width="4"/><circle cx="226" cy="58" r="4" fill="#f97316"/><path d="M183 58h86" stroke="#6d3ac7" stroke-width="5"/><path d="M183 106v9m0-4h86m0-5v9" stroke="#6d3ac7" stroke-width="3"/><text x="226" y="130" text-anchor="middle" font-size="14" font-weight="900" fill="#6d3ac7">diamètre</text></g></svg>`,
      cube: `<svg viewBox="0 0 270 145"><path d="M28 42 87 18l53 31-59 27Z" fill="#dbeafe" stroke="#0755b8" stroke-width="3"/><path d="M28 42v57l59 34V76Z" fill="#e9faf6" stroke="#0755b8" stroke-width="3"/><path d="M87 76v57l53-31V49Z" fill="#fff0df" stroke="#0755b8" stroke-width="3"/><path d="M87 76v57" stroke="#f97316" stroke-width="7"/><g fill="#f97316"><circle cx="28" cy="42" r="5"/><circle cx="87" cy="18" r="5"/><circle cx="140" cy="49" r="5"/><circle cx="87" cy="76" r="5"/><circle cx="28" cy="99" r="5"/><circle cx="87" cy="133" r="5"/><circle cx="140" cy="102" r="5"/></g><g font-size="15" font-weight="900"><text x="164" y="45">6 faces</text><text x="164" y="76" fill="#f97316">12 arêtes</text><text x="164" y="107" fill="#d95f02">8 sommets</text></g></svg>`,
      story: `<div style="font-size:48px">🔎 📖</div>`,
      prefix: `<div style="font-weight:950;font-size:1.25rem"><span style="color:#f97316">re</span>faire · <span style="color:#6d3ac7">im</span>possible</div>`,
      sentence: `<div style="display:flex;gap:6px;align-items:center;font-weight:900"><span style="color:#0755b8">Le dodo</span><b>→</b><span style="color:#d95f02">avance</span></div>`,
      timeline: `<svg viewBox="0 0 180 85"><path d="M15 43h150" stroke="#143451" stroke-width="3"/><path d="m154 35 12 8-12 8" fill="none" stroke="#143451" stroke-width="3"/><circle cx="38" cy="43" r="7" fill="#6d3ac7"/><circle cx="90" cy="43" r="7" fill="#087a71"/><circle cx="143" cy="43" r="7" fill="#f97316"/><text x="38" y="72" text-anchor="middle" font-size="12">hier</text><text x="90" y="72" text-anchor="middle" font-size="12">maintenant</text><text x="143" y="72" text-anchor="middle" font-size="12">demain</text></svg>`,
      connectors: `<div style="display:flex;align-items:center;gap:5px;font-size:.85rem;font-weight:900"><span>D’abord</span><b>→</b><span>Puis</span><b>→</b><span>Enfin</span></div>`
    };
    return visuals[kind] || "";
  }

  function openSubject(subject) {
    currentSubject = subject;
    const label = subject === "math" ? "Mathématiques" : "Français";
    $("lesson-eyebrow").textContent = `${data.versions[currentVersion].shortName} · ${label}`;
    $("lesson-title").textContent = subject === "math" ? "Cinq idées utiles" : "Cinq repères pour lire et écrire";
    $("lesson-grid").innerHTML = data.lessons[subject].map((lesson, index) => `<article class="lesson-card lesson-${lesson.kind}"><div class="lesson-visual">${lessonVisual(lesson.kind)}</div><h2>${index + 1}. ${lesson.title}</h2><p>${lesson.text}</p></article>`).join("");
    const count = answerCount(currentVersion, subject);
    const total = subjectTotal(currentVersion, subject);
    $("start-subject").textContent = count === total ? "Revoir les réponses →" : count ? `Continuer à la question ${count + 1} →` : "Commencer les questions →";
    show("lesson");
  }

  function subjectQuestions() { return data.versions[currentVersion][currentSubject]; }

  function beginSubject() {
    const answers = getProgress(currentVersion, currentSubject).answers;
    const total = subjectTotal(currentVersion, currentSubject);
    questionIndex = Object.keys(answers).length === total ? 0 : Array.from({length: total}, (_, index) => index).find(index => !answers[index]) ?? 0;
    renderQuestion();
    show("quiz");
  }

  function sectorPath(cx, cy, radius, startDegrees, endDegrees) {
    const point = angle => [cx + radius * Math.cos((angle - 90) * Math.PI / 180), cy + radius * Math.sin((angle - 90) * Math.PI / 180)];
    const start = point(startDegrees), end = point(endDegrees);
    return `M ${cx} ${cy} L ${start[0]} ${start[1]} A ${radius} ${radius} 0 ${endDegrees - startDegrees > 180 ? 1 : 0} 1 ${end[0]} ${end[1]} Z`;
  }

  function stacked(numerator, denominator) {
    return `<span class="stacked-fraction"><b>${numerator}</b><i></i><b>${denominator}</b></span>`;
  }

  function fractionFigure(numerator, denominator, shape = "band", color = "#facc15") {
    if (shape === "disk") {
      const sectors = Array.from({length: denominator}, (_, index) => `<path d="${sectorPath(90,70,56,index*360/denominator,(index+1)*360/denominator)}" fill="${index < numerator ? color : "#fff"}"/>`).join("");
      const rays = Array.from({length: denominator}, (_, index) => { const a = (index * 360 / denominator - 90) * Math.PI / 180; return `<path d="M90 70L${90 + 56*Math.cos(a)} ${70 + 56*Math.sin(a)}"/>`; }).join("");
      return `<svg class="fraction-diagram" viewBox="0 0 180 140" aria-label="${numerator} parts coloriées sur ${denominator}">${sectors}<g fill="none" stroke="#143451" stroke-width="2">${rays}<circle cx="90" cy="70" r="56"/></g></svg>`;
    }
    const width = 210, part = width / denominator;
    const fills = Array.from({length: denominator}, (_, index) => index < numerator ? `<rect x="${10+index*part}" y="24" width="${part}" height="62" fill="${color}"/>` : "").join("");
    const cuts = Array.from({length: denominator-1}, (_, index) => `<path d="M${10+(index+1)*part} 24v62"/>`).join("");
    return `<svg class="fraction-diagram" viewBox="0 0 230 110" aria-label="${numerator} parts coloriées sur ${denominator}">${fills}<g fill="none" stroke="#143451" stroke-width="3"><rect x="10" y="24" width="210" height="62"/>${cuts}</g></svg>`;
  }

  function renderNumberLine(v) {
    const x = number => 28 + (number - v.start) / (v.end - v.start) * 344;
    const ticks = Array.from({length: 11}, (_, i) => { const px = 28 + i*34.4; return `<path d="M${px} 70v${i%5===0?18:11}"/>`; }).join("");
    const points = v.points.map(([number,label]) => `<circle cx="${x(number)}" cy="70" r="7" fill="#f97316"/><text x="${x(number)}" y="48" text-anchor="middle" font-size="17" font-weight="900" fill="#d95f02">${label}</text>`).join("");
    return `<svg viewBox="0 0 400 120"><path d="M28 70h344" stroke="#143451" stroke-width="3"/><g stroke="#143451" stroke-width="2">${ticks}</g>${points}<text x="28" y="112" text-anchor="middle" font-size="13">${v.start.toLocaleString("fr-FR")}</text><text x="372" y="112" text-anchor="middle" font-size="13">${v.end.toLocaleString("fr-FR")}</text></svg>`;
  }

  function renderBars(v, compare = false) {
    const max = compare ? v.big : Math.max(...v.rows.map(row => row.reduce((sum, item) => typeof item === "number" ? sum+item : sum, 0)));
    const width = value => Math.round(value / max * 100);
    if (compare) return `<div class="bar-model"><div class="bar-caption">${v.labels[0]} · ${v.big}</div><div class="bar-row"><span style="width:${width(v.big)}%;background:#bfe9e2">${v.big}</span></div><div class="bar-caption">${v.labels[1]} · ${v.small}</div><div class="bar-row"><span style="width:${width(v.small)}%;background:#dbeafe">${v.small}</span></div></div>`;
    return `<div class="bar-model">${v.rows.map(row => { const nums=row.filter(item=>typeof item==="number"); const label=row.find(item=>typeof item==="string")||""; const total=nums.reduce((a,b)=>a+b,0); return `<div class="bar-caption">${label}</div><div class="bar-row" style="width:${width(total)}%">${nums.map((n,i)=>`<span style="flex:${n};background:${i?'#ffe0b8':'#bfe9e2'}">${n}</span>`).join("")}</div>`; }).join("")}</div>`;
  }

  function renderVisual(v) {
    if (!v) return "";
    if (v.kind === "story") return `<div class="story">${v.text}</div>`;
    if (v.kind === "fraction") return `<div class="fraction-display">${fractionFigure(v.numerator,v.denominator,v.shape)}${v.showNotation === false ? "" : `<span class="fraction-notation">${stacked(v.numerator,v.denominator)}</span>`}</div>`;
    if (v.kind === "fraction-empty") return `<div style="font-size:2rem">À construire : ${stacked(v.target || "?",v.denominator)}</div>`;
    if (v.kind === "fraction-compare") return `<div class="fraction-comparison"><div class="fraction-choice">${fractionFigure(v.first[0],v.first[1],v.shape,v.colors?.[0])}<div class="fraction-notation">${stacked(...v.first)}</div></div><strong>ou</strong><div class="fraction-choice">${fractionFigure(v.second[0],v.second[1],v.shape,v.colors?.[1])}<div class="fraction-notation">${stacked(...v.second)}</div></div></div>`;
    if (v.kind === "place-value") return `<div style="font-size:clamp(2.6rem,9vw,5rem);font-weight:950;letter-spacing:.08em">${v.number}</div>`;
    if (v.kind === "place-chart") return `<table style="border-collapse:collapse;text-align:center"><tr>${["milliers","centaines","dizaines","unités"].map((h,i)=>`<th style="padding:8px;border:1px solid #b9cfdd;background:${i===v.highlight?'#fff0c2':'#eef6fb'}">${h}</th>`).join("")}</tr><tr>${v.digits.map((d,i)=>`<td style="font-size:2rem;font-weight:950;padding:10px;border:1px solid #b9cfdd;background:${i===v.highlight?'#facc15':'#fff'}">${d}</td>`).join("")}</tr></table>`;
    if (v.kind === "decomposition") return `<div style="font-size:clamp(1.35rem,5vw,2.2rem);font-weight:950">${v.text}</div>`;
    if (v.kind === "number-line") return renderNumberLine(v);
    if (v.kind === "mental") return `<div class="mental-card">${v.expression}</div>`;
    if (v.kind === "make-ten") return `<svg viewBox="0 0 390 125"><path d="M35 78h315" stroke="#143451" stroke-width="3"/><path d="M55 69v18M170 69v18M335 69v18" stroke="#143451" stroke-width="3"/><path d="M55 60Q111 23 170 60" fill="none" stroke="#f97316" stroke-width="5"/><path d="M170 60Q252 9 335 60" fill="none" stroke="#087a71" stroke-width="5"/><text x="55" y="113" text-anchor="middle" font-size="18">${v.start}</text><text x="170" y="113" text-anchor="middle" font-size="18">${v.middle}</text><text x="335" y="113" text-anchor="middle" font-size="18">?</text><text x="112" y="31" text-anchor="middle" font-size="18" font-weight="900" fill="#d95f02">+ ${v.first}</text><text x="252" y="20" text-anchor="middle" font-size="18" font-weight="900" fill="#087a71">+ ${v.second}</text></svg>`;
    if (v.kind === "column") return `<div style="font:950 2.2rem/1.15 ui-monospace,monospace;text-align:right"><div>${v.top}</div><div><span style="float:left">${v.sign}</span>${v.bottom}</div><div style="border-top:4px solid #143451;margin-top:5px">&nbsp;</div></div>`;
    if (v.kind === "bars") return renderBars(v);
    if (v.kind === "bars-compare") return renderBars(v,true);
    if (v.kind === "array") return `<div style="display:grid;grid-template-columns:repeat(${v.cols},26px);gap:5px">${Array.from({length:v.rows*v.cols},()=>`<i style="width:26px;height:26px;border-radius:50%;background:${v.color==='purple'?'#a78bfa':'#37b7ad'};border:2px solid #143451"></i>`).join("")}</div>`;
    if (v.kind === "money") return `<div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">${v.groups.map(([count,price,label])=>`<div style="padding:10px 15px;border:2px solid #c8dbe8;border-radius:14px;background:#fff"><b>${count} × ${price} €</b><br><small>${label}</small></div>`).join("")}</div>`;
    if (v.kind === "triangles-coded") return `<svg viewBox="0 0 540 170"><g fill="#fff" stroke="#0755b8" stroke-width="4" stroke-linejoin="round"><path d="M25 130 55 35l110 95Z"/><path d="M205 130 280 25l75 105Z"/><path d="M390 40v90h125Z"/></g><g stroke="#f97316" stroke-width="5"><path d="M243 78l12 8M305 86l12-8"/></g><path d="M390 130v-24h24" fill="none" stroke="#f97316" stroke-width="4"/><g font-size="19" font-weight="900" fill="#143451" text-anchor="middle"><text x="95" y="158">A</text><text x="280" y="158">B</text><text x="452" y="158">C</text></g></svg>`;
    if (v.kind === "lines-choice") return `<svg viewBox="0 0 430 160"><g stroke="#0755b8" stroke-width="7" stroke-linecap="round"><path d="M35 40h135M35 100h135"/><path d="M285 20v120M225 80h120"/></g><path d="M285 80h22v22" fill="none" stroke="#f97316" stroke-width="5"/><text x="102" y="145" text-anchor="middle" font-size="18" font-weight="900">A</text><text x="285" y="158" text-anchor="middle" font-size="18" font-weight="900">B</text></svg>`;
    if (v.kind === "circle-parts") return v.ask === "radius" ? `<svg viewBox="0 0 300 190"><circle cx="150" cy="92" r="72" fill="#fff" stroke="#0755b8" stroke-width="5"/><path d="M150 92 205 45" stroke="#087a71" stroke-width="5"/><circle cx="150" cy="92" r="5" fill="#f97316"/><g font-size="18" font-weight="900" fill="#143451"><text x="139" y="117">O</text><text x="211" y="40">A</text></g></svg>` : `<svg viewBox="0 0 300 190"><circle cx="150" cy="92" r="72" fill="#fff" stroke="#0755b8" stroke-width="5"/><path d="M78 92h144" stroke="#6d3ac7" stroke-width="5"/><circle cx="150" cy="92" r="5" fill="#f97316"/><g font-size="18" font-weight="900" fill="#143451"><text x="139" y="117">O</text><text x="64" y="87">A</text><text x="228" y="87">B</text></g></svg>`;
    if (v.kind === "right-triangle-named") return `<svg viewBox="0 0 270 185"><path d="M45 25V145H230Z" fill="#fff" stroke="#0755b8" stroke-width="5" stroke-linejoin="round"/><path d="M45 145v-25h25" fill="none" stroke="#f97316" stroke-width="5"/><path d="M70 145A25 25 0 0 0 45 120" fill="none" stroke="#f97316" stroke-width="3"/><g font-size="21" font-weight="900" fill="#0755b8"><text x="28" y="25">A</text><text x="27" y="166">B</text><text x="234" y="163">C</text></g></svg>`;
    if (v.kind === "road-perpendicular") return `<svg viewBox="0 0 300 190"><path d="M30 95h240M150 20v150" stroke="#667b8c" stroke-width="34"/><path d="M30 95h240M150 20v150" stroke="#fff" stroke-width="3" stroke-dasharray="13 10"/><path d="M150 95h23v23" fill="none" stroke="#facc15" stroke-width="5"/></svg>`;
    if (v.kind === "solids") return `<svg viewBox="0 0 650 165" aria-label="Cinq solides non nommés"><g stroke="#0755b8" stroke-width="3" stroke-linejoin="round" fill="#fff"><path d="M18 66 60 40l38 23-42 27Z"/><path d="M18 66v53l38 23V90l42-27v53l-42 26" fill="#dbeafe"/><path d="M119 74 175 47l62 23-57 29Z"/><path d="M119 74v46l61 28V99l57-29v47l-57 31" fill="#eef6ff"/><ellipse cx="304" cy="48" rx="38" ry="14" fill="#e9faf6"/><path d="M266 48v78c0 8 17 15 38 15s38-7 38-15V48" fill="#e9faf6"/><ellipse cx="304" cy="126" rx="38" ry="15"/><path d="M375 137 421 34l47 103Z" fill="#fff0df"/><ellipse cx="421" cy="137" rx="46" ry="14" fill="#fff0df"/><path d="M525 114 569 28l60 87-52 31Z" fill="#f3edff"/><path d="M569 28 577 146M569 28 525 114M569 28 629 115" fill="none"/><path d="M525 114 577 92 629 115" fill="none" stroke-dasharray="6 5"/></g></svg>`;
    if (v.kind === "cube-parts") return lessonVisual("cube");
    if (v.kind === "measure-reference") return `<div class="measure-reference"><div class="mental-card"><span>${v.from}</span> = <strong>?</strong> <span>${v.unit}</span></div><svg viewBox="0 0 360 70" aria-label="Repère d’un centimètre sur une règle"><path d="M25 40h310" stroke="#143451" stroke-width="5"/><g stroke="#143451" stroke-width="3"><path d="M55 24v32M85 31v25M115 31v25M145 31v25M175 31v25M205 31v25M235 31v25M265 31v25M295 31v25"/></g><path d="M55 14h30" stroke="#f97316" stroke-width="5"/><text x="70" y="12" text-anchor="middle" font-size="15" font-weight="900" fill="#d95f02">1 cm</text><text x="180" y="67" text-anchor="middle" font-size="13" font-weight="800">un petit trait à l’autre : 1 cm</text></svg></div>`;
    if (v.kind === "measure-question") return `<div class="mental-card"><span>${v.from}</span> = <strong>?</strong> <span>${v.unit}</span></div>`;
    if (v.kind === "timeline-clock") return `<div style="display:flex;align-items:center;gap:12px;font-size:clamp(1rem,4vw,1.5rem);font-weight:950"><span>${v.start}</span><b>→</b>${v.middle?`<span>${v.middle}</span><b>→</b>`:""}<span>${v.end}</span></div>`;
    if (v.kind === "chart") { const colors=["#f97316","#0755b8","#087a71"]; return `<svg viewBox="0 0 420 230"><path d="M54 20v170h330" fill="none" stroke="#143451" stroke-width="3"/>${Array.from({length:v.max+1},(_,i)=>{const y=190-i*26;return `<path d="M50 ${y}h334" stroke="#d6e4ec"/><text x="40" y="${y+5}" text-anchor="end" class="chart-label">${i}</text>`}).join("")}${v.values.map((value,i)=>`<rect x="${90+i*95}" y="${190-value*26}" width="52" height="${value*26}" rx="7" fill="${colors[i]}"/><text x="${116+i*95}" y="215" text-anchor="middle" class="chart-label">${v.labels[i]}</text>`).join("")}</svg>`; }
    if (v.kind === "table") return `<table style="border-collapse:collapse;text-align:center;font-weight:800"><tr>${v.headers.map(h=>`<th style="padding:9px;border:2px solid #9dbdce;background:#eaf4ff">${h}</th>`).join("")}</tr>${v.rows.map((row,r)=>`<tr>${row.map((cell,c)=>`<td style="padding:10px;border:2px solid #9dbdce;background:${v.highlight&&r===v.highlight[0]&&c===v.highlight[1]?'#fff1a6':'#fff'}">${cell}</td>`).join("")}</tr>`).join("")}</table>`;
    if (v.kind === "words" || v.kind === "opposites" || v.kind === "family") return `<div style="display:flex;gap:13px;align-items:center;flex-wrap:wrap;justify-content:center;font-size:1.25rem;font-weight:950"><span>${v.center||v.left||v.root}</span><b>↔</b>${(v.words||[v.right]).map(w=>`<span style="padding:8px 12px;border-radius:12px;background:#fff">${w}</span>`).join("")}</div>`;
    if (v.kind === "prefix") return `<div style="font-size:2rem;font-weight:950"><span style="color:#f97316">${v.prefix}</span>${v.word}</div>`;
    if (v.kind === "sentence" || v.kind === "agreement") return `<div style="font-size:clamp(1.25rem,5vw,2rem);font-weight:900">${v.text}</div>`;
    if (v.kind === "replace") return `<div style="display:flex;gap:15px;align-items:center;font-size:1.4rem;font-weight:950"><span>${v.from}</span><b>→</b><span style="color:#6d3ac7">${v.to}</span></div>`;
    if (v.kind === "punctuation") return `<div style="display:flex;gap:16px;font-size:3.2rem;font-weight:950">${v.marks.map(mark=>`<span>${mark}</span>`).join("")}</div>`;
    if (v.kind === "word-class") return `<div style="display:flex;gap:10px;flex-wrap:wrap">${v.words.map(([word,kind])=>`<span style="padding:9px 13px;border-radius:12px;background:#fff"><b>${word}</b><br><small>${kind}</small></span>`).join("")}</div>`;
    if (v.kind === "timeline") return lessonVisual("timeline");
    if (v.kind === "connectors") return lessonVisual("connectors");
    return "";
  }

  function renderQuestion() {
    const question = subjectQuestions()[questionIndex];
    const progress = getProgress(currentVersion, currentSubject);
    const saved = progress.answers[questionIndex];
    questionLocked = Boolean(saved);
    $("quiz-label").textContent = `${data.versions[currentVersion].shortName} · ${currentSubject === "math" ? "Mathématiques" : "Français"}`;
    const total = subjectTotal(currentVersion, currentSubject);
    $("question-count").textContent = `${questionIndex + 1} / ${total}`;
    setBar($("quiz-progress"), Object.keys(progress.answers).length, total);
    $("question-section").textContent = question.section;
    $("question-title").textContent = question.title;
    $("question-prompt").textContent = question.prompt || "";
    $("question-visual").innerHTML = question.type === "fraction-color" || question.type === "grid-select" ? "" : renderVisual(question.visual);
    $("feedback").hidden = true;
    $("feedback").className = "feedback";
    $("next-question").hidden = true;
    if (question.type === "qcm") renderQcm(question, saved);
    else if (question.type === "fraction-color") renderFractionTask(question, saved);
    else if (question.type === "grid-select") renderGridTask(question, saved);
    else renderOrderTask(question, saved);
    if (saved) revealSaved(question, saved);
  }

  function renderQcm(question, saved) {
    $("answer-zone").innerHTML = question.options.map((option,index)=>`<button class="answer-button${saved ? index===question.answer?" correct":index===saved.value&&!saved.correct?" wrong":"" : ""}" type="button" data-option="${index}" ${saved?"disabled":""}><span class="answer-letter">${String.fromCharCode(65+index)}</span><span>${option}</span></button>`).join("");
    $("answer-zone").querySelectorAll("[data-option]").forEach(button => button.addEventListener("click",()=>answerQuestion(Number(button.dataset.option)===question.answer,Number(button.dataset.option))));
  }

  function diskTask(question, selected = new Set(), locked = false) {
    const paths = Array.from({length:question.denominator},(_,index)=>`<path class="touch-sector${selected.has(index)?" selected":""}" data-sector="${index}" d="${sectorPath(110,105,82,index*360/question.denominator,(index+1)*360/question.denominator)}" fill="${selected.has(index)?"#facc15":"#fff"}" tabindex="${locked?-1:0}"/>`).join("");
    const separators = Array.from({length:question.denominator},(_,index)=>{const angle=(index*360/question.denominator-90)*Math.PI/180;return `<path d="M110 105L${110+82*Math.cos(angle)} ${105+82*Math.sin(angle)}"/>`}).join("");
    return `<svg viewBox="0 0 220 210" aria-label="Disque partagé en ${question.denominator} parts">${paths}<g fill="none" stroke="#143451" stroke-width="3" pointer-events="none">${separators}<circle cx="110" cy="105" r="82"/></g></svg>`;
  }

  function renderFractionTask(question, saved) {
    const selected = new Set(saved ? Array.from({length:question.target},(_,i)=>i) : []);
    const zone = $("answer-zone");
    zone.innerHTML = `<div class="fraction-task"><div class="fraction-interactive">${question.shape==="disk"?diskTask(question,selected,Boolean(saved)):`<div class="fraction-strip">${Array.from({length:question.denominator},(_,i)=>`<button class="fraction-part${selected.has(i)?" selected":""}" type="button" data-part="${i}" ${saved?"disabled":""} aria-label="Part ${i+1}"></button>`).join("")}</div>`}</div><button class="validate-button" type="button" ${saved?"disabled":""}>Valider</button></div>`;
    const refresh = () => {
      zone.querySelector(".fraction-interactive").innerHTML = question.shape==="disk"?diskTask(question,selected,false):`<div class="fraction-strip">${Array.from({length:question.denominator},(_,i)=>`<button class="fraction-part${selected.has(i)?" selected":""}" type="button" data-part="${i}" aria-label="Part ${i+1}"></button>`).join("")}</div>`;
      bindParts();
    };
    const toggle = index => { if(questionLocked)return; selected.has(index)?selected.delete(index):selected.add(index); refresh(); };
    const bindParts = () => {
      zone.querySelectorAll("[data-part]").forEach(node=>node.addEventListener("click",()=>toggle(Number(node.dataset.part))));
      zone.querySelectorAll("[data-sector]").forEach(node=>{node.addEventListener("click",()=>toggle(Number(node.dataset.sector)));node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggle(Number(node.dataset.sector));}})});
    };
    bindParts();
    zone.querySelector(".validate-button").addEventListener("click",()=>answerQuestion(selected.size===question.target,Array.from(selected).sort((a,b)=>a-b)));
  }

  function renderGridTask(question, saved) {
    const selected = new Set(saved ? question.target.map(pair=>pair.join(",")) : []);
    const given = new Set(question.given.map(pair=>pair.join(",")));
    const zone = $("answer-zone");
    zone.innerHTML = `<div class="grid-task"><div class="symmetry-board">${Array.from({length:54},(_,index)=>{const row=Math.floor(index/9),col=index%9,key=`${row},${col}`,isGiven=given.has(key),canChoose=col>4;return `<button type="button" class="grid-cell${col===4?" axis":""}${isGiven?" given":""}${selected.has(key)?" selected":""}" data-cell="${key}" ${(!canChoose||isGiven||saved)?"disabled":""} aria-label="Case ligne ${row+1}, colonne ${col+1}"></button>`}).join("")}</div><button class="validate-button" type="button" ${saved?"disabled":""}>Valider la figure</button></div>`;
    zone.querySelectorAll("[data-cell]").forEach(cell=>cell.addEventListener("click",()=>{const key=cell.dataset.cell;selected.has(key)?selected.delete(key):selected.add(key);cell.classList.toggle("selected",selected.has(key));}));
    zone.querySelector(".validate-button").addEventListener("click",()=>{const target=new Set(question.target.map(pair=>pair.join(",")));const correct=selected.size===target.size&&[...target].every(key=>selected.has(key));answerQuestion(correct,[...selected]);});
  }

  function renderOrderTask(question, saved) {
    const chosen = saved ? question.answer.slice() : [];
    const used = new Set(chosen.map(token=>question.tokens.indexOf(token)));
    const zone = $("answer-zone");
    const draw = () => {
      zone.innerHTML = `<div class="token-task"><div class="token-tray" aria-label="Étiquettes à placer">${question.tokens.map((token,index)=>`<button type="button" class="token${used.has(index)?" used":""}" data-token="${index}" draggable="true" ${saved?"disabled":""}>${token}</button>`).join("")}</div><p class="token-note">Toucher puis toucher fonctionne aussi : touche une étiquette pour la placer, puis une étiquette placée pour l’enlever.</p><div class="placed-tray" aria-label="Phrase construite">${chosen.map((token,index)=>`<button type="button" class="placed-token" data-placed="${index}" ${saved?"disabled":""}>${token}</button>`).join("")}</div>${question.allowText?`<label style="display:block;margin-top:12px;font-weight:850">Ma fin amusante (facultatif)<textarea rows="2" style="display:block;width:100%;margin-top:6px;padding:10px;border:2px solid #c8dbe8;border-radius:12px;font:inherit" placeholder="Tu peux écrire ici…"></textarea></label>`:""}<div class="token-actions"><button class="validate-button" type="button" ${saved?"disabled":""}>Valider l’ordre</button><button class="secondary clear-order" type="button" ${saved?"disabled":""}>Tout retirer</button></div></div>`;
      zone.querySelectorAll("[data-token]").forEach(button=>{
        button.addEventListener("click",()=>add(Number(button.dataset.token)));
        button.addEventListener("dragstart",event=>event.dataTransfer.setData("text/plain",button.dataset.token));
      });
      zone.querySelectorAll("[data-placed]").forEach(button=>button.addEventListener("click",()=>remove(Number(button.dataset.placed))));
      const placed=zone.querySelector(".placed-tray");
      placed.addEventListener("dragover",event=>event.preventDefault());
      placed.addEventListener("drop",event=>{event.preventDefault();add(Number(event.dataTransfer.getData("text/plain")));});
      zone.querySelector(".clear-order").addEventListener("click",()=>{chosen.splice(0);used.clear();draw();});
      zone.querySelector(".validate-button").addEventListener("click",()=>answerQuestion(chosen.length===question.answer.length&&chosen.every((token,index)=>token===question.answer[index]),chosen.slice()));
    };
    const add = index => { if(questionLocked||used.has(index))return;used.add(index);chosen.push(question.tokens[index]);draw(); };
    const remove = index => { if(questionLocked)return;const [token]=chosen.splice(index,1);used.delete(question.tokens.indexOf(token));draw(); };
    draw();
  }

  function answerQuestion(correct, value) {
    if (questionLocked) return;
    questionLocked = true;
    const progress = getProgress(currentVersion, currentSubject);
    progress.answers[questionIndex] = {correct, value};
    saveProgress(currentVersion, currentSubject, progress);
    renderQuestion();
  }

  function revealSaved(question, saved) {
    $("feedback").innerHTML = `<strong>${saved.correct ? "Bien joué !" : "On apprend de cet essai."}</strong>${saved.correct ? question.explanation : `La bonne réponse est montrée en vert. ${question.explanation}`}`;
    $("feedback").classList.add(saved.correct ? "good" : "bad");
    $("feedback").hidden = false;
    $("next-question").textContent = questionIndex === subjectTotal(currentVersion, currentSubject) - 1 ? "Voir le bilan →" : "Question suivante →";
    $("next-question").hidden = false;
  }

  function finishSubject() {
    const progress = getProgress(currentVersion, currentSubject);
    const score = Object.values(progress.answers).filter(answer=>answer.correct).length;
    const total = subjectTotal(currentVersion, currentSubject);
    const label = currentSubject === "math" ? "mathématiques" : "français";
    $("done-title").textContent = `Tu as terminé le ${label} !`;
    const other = currentSubject === "math" ? "fr" : "math";
    if (isVersionComplete(currentVersion)) {
      $("done-message").textContent = `${score} réponses justes sur ${total} dans cette matière. Les ${versionTotal(currentVersion)} questions du défi sont terminées : le niveau ${currentVersion + 1} du dodo est maintenant débloqué.`;
    } else {
      $("done-message").textContent = `${score} réponses justes sur ${total}. Tu as lu toutes les corrections et tu peux maintenant passer ${other==="math"?"aux mathématiques":"au français"}.`;
    }
    show("done");
  }

  function openGame() {
    if (!isVersionComplete(0) && !isVersionComplete(1)) return;
    show("game");
    document.querySelectorAll("[data-level]").forEach(button=>{const level=Number(button.dataset.level);button.disabled=!isVersionComplete(level);});
    startLevel(isVersionComplete(0) ? (isVersionComplete(1) && read("last-level") === 1 ? 1 : 0) : 1);
  }

  function startLevel(index) {
    if (!isVersionComplete(index)) return;
    levelIndex = index;
    write("last-level", index);
    const level = data.gameLevels[index];
    levelPosition = level.start.slice();
    levelFruits = level.fruits.map(pair=>pair.join(","));
    document.querySelectorAll("[data-level]").forEach(button=>button.classList.toggle("active",Number(button.dataset.level)===index));
    $("game-info").textContent = `${level.name} · 3 fruits à ramasser`;
    drawBoard();
  }

  function drawBoard() {
    const level = data.gameLevels[levelIndex];
    $("dodo-board").innerHTML = Array.from({length:36},(_,index)=>{const x=index%6,y=Math.floor(index/6),key=`${x},${y}`,rock=level.rocks.some(pair=>pair[0]===x&&pair[1]===y),fruit=levelFruits.includes(key),dodo=levelPosition[0]===x&&levelPosition[1]===y;return `<div class="dodo-cell${rock?" rock":""}${fruit?" goal":""}" aria-label="${dodo?"dodo":fruit?"fruit":rock?"rocher":"case libre"}">${dodo?"🦤":fruit?"🍍":rock?"🪨":""}</div>`}).join("");
  }

  function moveDodo(dx, dy) {
    const level = data.gameLevels[levelIndex];
    const next = [levelPosition[0]+dx,levelPosition[1]+dy];
    if(next[0]<0||next[0]>5||next[1]<0||next[1]>5)return;
    if(level.rocks.some(pair=>pair[0]===next[0]&&pair[1]===next[1])){$("game-info").textContent="Oups, un rocher ! Le niveau recommence tranquillement.";setTimeout(()=>startLevel(levelIndex),500);return;}
    levelPosition=next;
    const key=next.join(",");
    levelFruits=levelFruits.filter(item=>item!==key);
    if(!levelFruits.length){write(`game-complete-${levelIndex}`,true);$("game-info").textContent=levelIndex===0&&isVersionComplete(1)?"Bravo ! Le niveau 2 est prêt.":levelIndex===1?"Les deux chemins sont réussis. Le dodo peut se reposer ! 🌙":"Bravo ! Les trois fruits sont trouvés.";}
    else $("game-info").textContent=`${data.gameLevels[levelIndex].name} · encore ${levelFruits.length} fruit${levelFruits.length>1?"s":""}`;
    drawBoard();
  }

  document.querySelectorAll("[data-open-version]").forEach(button=>button.addEventListener("click",()=>openVersion(Number(button.dataset.openVersion))));
  document.querySelectorAll("[data-subject]").forEach(button=>button.addEventListener("click",()=>openSubject(button.dataset.subject)));
  document.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.action==="home")goHome();else openVersion(currentVersion);}));
  $("j3-home").addEventListener("click",goHome);
  $("start-subject").addEventListener("click",beginSubject);
  $("next-question").addEventListener("click",()=>{if(!questionLocked)return;if(questionIndex===subjectTotal(currentVersion,currentSubject)-1)finishSubject();else{questionIndex+=1;renderQuestion();window.scrollTo({top:0,behavior:"smooth"});}});
  $("open-game").addEventListener("click",openGame);
  document.querySelectorAll("[data-level]").forEach(button=>button.addEventListener("click",()=>startLevel(Number(button.dataset.level))));
  document.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>{const [dx,dy]=button.dataset.move.split(",").map(Number);moveDodo(dx,dy);}));
  $("restart-level").addEventListener("click",()=>startLevel(levelIndex));

  refreshHome();
  const requested = Number(new URLSearchParams(location.search).get("defi"));
  if(requested===1||requested===2)openVersion(requested-1);else show("home");
})();
