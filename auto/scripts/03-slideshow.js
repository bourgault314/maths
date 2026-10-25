const INTERACTIVE_SERIES_COUNT=10;
const APP_REVISION=typeof MATHSGO_APP_VERSION==='string'?MATHSGO_APP_VERSION:'1.19';

function setupReadDataTools(root=globalThis.document){
  const doc=root&&root.ownerDocument?root.ownerDocument:root;
  if(!root||!root.querySelectorAll||!doc) return;
  const diapo=doc.getElementById&&doc.getElementById('diapo');
  if(diapo) diapo.classList.remove('read-data-observation-pending');
  root.querySelectorAll('[data-read-data-touch="1"]').forEach(board=>{
    const required=String(board.dataset.readDataRequired||'').split('|').filter(Boolean);
    const selected=new Set();
    const instruction=board.querySelector('.read-data-touch-instruction');
    const choices=Array.from(board.querySelectorAll('[data-read-data-choice]'));
    let feedbackTimer=null;
    const elementsForChoice=choice=>choices.filter(element=>element.dataset.readDataChoice===choice);
    const setInstruction=message=>{if(instruction) instruction.textContent=message;};
    const finish=()=>{
      board.classList.add('is-complete');
      choices.forEach(element=>element.classList.remove('is-miss'));
      board.querySelectorAll('.read-data-star-group').forEach(group=>{
        const count=group.querySelectorAll('.read-data-star-item').length;
        group.setAttribute('aria-label',count+' étoiles, chacune vaut 5 élèves');
      });
      choices.forEach(element=>{
        element.setAttribute('tabindex','-1');
        element.setAttribute('aria-disabled','true');
      });
      if(diapo) diapo.classList.remove('read-data-observation-pending');
    };
    if(board.classList.contains('is-complete')){
      required.forEach(choice=>elementsForChoice(choice).forEach(element=>{
        element.classList.add('is-picked');
        element.setAttribute('aria-pressed','true');
      }));
      finish();
      return;
    }
    if(diapo&&typeof interactiveMode!=='undefined'&&interactiveMode) diapo.classList.add('read-data-observation-pending');
    const choose=choice=>{
      if(board.classList.contains('is-complete')) return;
      if(!required.includes(choice)){
        const missed=elementsForChoice(choice);
        missed.forEach(element=>element.classList.add('is-miss'));
        setInstruction('Ce choix n’est pas utile ici. Essaie encore.');
        clearTimeout(feedbackTimer);
        feedbackTimer=setTimeout(()=>{
          missed.forEach(element=>element.classList.remove('is-miss'));
          setInstruction(board.dataset.readDataInstruction||'Observe le tableau.');
        },650);
        return;
      }
      selected.add(choice);
      elementsForChoice(choice).forEach(element=>{
        element.classList.add('is-picked');
        element.setAttribute('aria-pressed','true');
      });
      if(required.every(item=>selected.has(item))){
        clearTimeout(feedbackTimer);
        finish();
      }else{
        const remaining=required.length-selected.size;
        setInstruction(remaining===1?'Bien. Il reste une colonne utile à trouver.':'Continue ton repérage.');
      }
    };
    choices.forEach(element=>{
      element.addEventListener('click',()=>choose(element.dataset.readDataChoice));
      element.addEventListener('keydown',event=>{
        if(event.key!=='Enter'&&event.key!==' ') return;
        event.preventDefault();
        event.stopPropagation();
        choose(element.dataset.readDataChoice);
      });
    });
  });
}

function makeDiapoWindowHtml(seriesData,experienceMode='interactive',menuUrl='./'){
  const normalizedSeries=Array.isArray(seriesData&&seriesData[0])?seriesData:[seriesData||[]];
  const payload = JSON.stringify(normalizedSeries);
  const experiencePayload=JSON.stringify(experienceMode);
  const menuUrlPayload=JSON.stringify(menuUrl);
  const placeValueCoursePayload=JSON.stringify({
    multiply:placeValueToolHtml({value:3.07,factor:1000,shift:3,result:3070,symbol:'×'},true),
    divide:placeValueToolHtml({value:52,factor:1000,shift:-3,result:0.052,symbol:'÷'},true)
  });
  const equationCourseExamplePayload=JSON.stringify(equationDetailHtml({
    ...equationBuildResolution(3,5,0,17,4)
  }));
  const equationCourseSplatPayload=JSON.stringify(equationSplatSvg({
    a:3,b:5,c:0,d:17,solution:4
  },false));
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<meta name="theme-color" content="#fbfdff">
<title>Automatismes maths&go — révision ${APP_REVISION}</title>
<style>
:root{color-scheme:light;--bg:#f4f7fc;--text:#0b2147;--muted:#60708c;--border:#d8e3f4;--accent:#ff7a1a;--answer:#087a55;--blue:#003b7a;--success:#10b981}
*{box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden}
body{margin:0;background:var(--bg);font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;color:var(--text);-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased}
button{font:inherit;-webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent}
.diapo{--stage-top:30px;--stage-x:34px;--stage-bottom:18px;width:100%;height:100%;height:100svh;height:100dvh;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:white}
.top{height:74px;flex:0 0 auto;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;padding:9px 18px;border-bottom:1px solid var(--border);background:#fbfdff;position:relative;z-index:10}
.progress-track{position:absolute;left:0;right:0;bottom:-1px;height:4px;overflow:hidden;background:#e9f0f9}
.progress-fill{display:block;width:0;height:100%;border-radius:0 4px 4px 0;background:linear-gradient(90deg,#003b7a,#ff7a1a);transition:width .28s ease}
.left,.right{display:flex;align-items:center;gap:10px}.right{justify-content:flex-end}
.navnums{display:flex;gap:5px;align-items:center;justify-content:center;flex-wrap:nowrap;min-width:0;overflow:hidden}
.mobile-counter{display:none;color:#073a75;font-size:1rem;font-weight:800}
.navnum{flex:0 0 auto;padding:0;border:1px solid var(--border);background:white;color:#073a75;font-weight:800;cursor:pointer}
.navnum.active{background:#003b7a;color:white;border-color:#003b7a}
.btn{border:1px solid var(--border);border-radius:14px;background:white;color:#073a75;font-weight:800;font-size:1rem;padding:13px 18px;cursor:pointer}
.btn.primary{background:var(--accent);border-color:var(--accent);color:white;min-width:225px;text-align:center}
.btn:disabled{cursor:default;opacity:.62}
.menu-btn{min-width:72px}
.fullscreen-btn,.keyboard-toggle{width:48px;height:48px;min-height:48px;padding:0;display:inline-grid;place-items:center}
.keyboard-toggle{display:none}.keyboard-toggle[hidden]{display:none!important}.keyboard-toggle[aria-pressed="true"]{border-color:#86a8cf;background:#eaf3ff;color:#003b7a}
.stage{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:12px var(--stage-x) var(--stage-bottom);overflow:auto;overscroll-behavior:contain}
.slide{width:100%;min-width:0;max-width:1220px;margin-top:auto;margin-bottom:auto;text-align:center}
.visual-placeholder{display:flex;justify-content:center;align-items:center;min-height:0;margin:8px auto}.visual-placeholder .btn{font-size:.95rem;padding:10px 15px}
.question{font-size:clamp(2rem,4.1vw,4.7rem);line-height:1.18;font-weight:800;margin:0 auto 34px}
.footer{font-size:clamp(2rem,4.5vw,4.8rem);font-weight:700;line-height:1.15;margin-top:18px}
.footer strong{color:var(--answer);font-weight:900}
.options{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;margin:34px auto 0;max-width:1200px}
.options.options-4{grid-template-columns:repeat(2,minmax(0,1fr))}
.opt{border:2px solid var(--border);border-radius:18px;padding:18px 20px;text-align:left;font-size:clamp(1.25rem,2vw,2rem);line-height:1.25;background:#fbfdff;overflow:visible;white-space:normal}
.opt.correct{background:#ecfdf5;border-color:var(--success)}
.correction{margin-top:30px;border-top:2px solid var(--border);padding-top:24px}.correction h3{display:none}
.ans{font-size:clamp(2rem,4vw,4.2rem);font-weight:900;color:var(--success)}
.frac{display:inline-flex;flex-direction:column;vertical-align:middle;align-items:center;line-height:1;margin:0 .08em}.frac .frac-num{border-bottom:2px solid currentColor;padding:0 .16em .06em}.frac .frac-den{padding:.06em .16em 0}
.math-inline,.math-display{display:inline-block;white-space:nowrap}.aligned-math{display:inline-block;text-align:left;line-height:1.35}.quad{display:inline-block;width:1.2em}.qquad{display:inline-block;width:2.4em}.widehat{display:inline-block;position:relative;padding-top:.24em;text-decoration:none;line-height:1}.widehat::before,.widehat::after{content:"";position:absolute;top:.08em;width:52%;border-top:1.8px solid currentColor;pointer-events:none}.widehat::before{left:-1%;transform:rotate(-11deg);transform-origin:100% 50%}.widehat::after{right:-1%;transform:rotate(11deg);transform-origin:0 50%}.mathcal{font-family:Georgia,serif;font-style:italic}.answer-slot{display:inline-flex;align-items:baseline;justify-content:center;width:var(--answer-width,1.05em);margin:0 .08em;white-space:nowrap;vertical-align:baseline}.frac .answer-slot-small{margin:0 .02em}.answer-dots{display:inline-block;letter-spacing:.06em}sup .answer-slot{align-items:center;line-height:1;margin-left:.02em;margin-right:.02em}sup .answer-slot-filled{width:auto!important;min-width:0;margin-left:-.04em;margin-right:0}sup .answer-dots{line-height:1;letter-spacing:0;transform:translateY(-.16em)}
.visual-note{font-size:1.4rem;color:var(--muted);border:1px dashed var(--border);border-radius:12px;padding:12px;margin:12px auto;max-width:620px}
.diapo.decimal-mode .stage{align-items:center;padding:8px 18px 12px}
.diapo.decimal-mode .slide{max-width:980px}
.diapo.decimal-mode .question{font-size:clamp(1.8rem,3.35vw,3.3rem);line-height:1.14;margin:0 auto 12px}
.diapo.decimal-mode .footer{font-size:clamp(2.35rem,4.7vw,4.5rem)}
.diapo.decimal-mode .options{max-width:920px}.diapo.decimal-mode .opt{text-align:center;font-size:clamp(1.45rem,2.5vw,2.25rem)}
.decimal-manipulation{width:min(100%,780px);margin:3px auto 0;padding:12px 14px;border:1px solid #cfddee;border-radius:18px;background:linear-gradient(180deg,#fff,#f6faff);user-select:none}
.decimal-card-tray{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:9px;margin:2px auto 10px}
.decimal-card,.decimal-drop-slot{display:inline-grid;place-items:center;min-width:112px;min-height:60px;padding:10px 16px;border-radius:13px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.55rem,2.9vw,2.25rem);font-weight:850;line-height:1;background:#fff;touch-action:manipulation}
.decimal-card{border:2px solid #0b79d0;color:#084f87;box-shadow:0 2px 0 rgba(8,79,135,.13);cursor:grab;touch-action:none;position:relative}
.decimal-card.is-dragging{z-index:20;cursor:grabbing;opacity:.92;box-shadow:0 12px 28px rgba(8,79,135,.28)}
.decimal-card.is-selected{outline:3px solid #ff7a1a;outline-offset:2px;background:#fff5ec;border-color:#e86100;color:#9a4100}
.decimal-card.is-used{visibility:hidden;pointer-events:none}
.decimal-drop-slot{border:2px dashed #86a8cf;color:#31516e;cursor:pointer}
.decimal-drop-slot.is-filled{border-style:solid;border-color:#e86100;background:#fff7ef;color:#9a4100}
.decimal-drop-slot:focus-visible,.decimal-card:focus-visible,.area-model-slot:focus-visible{outline:3px solid #ff7a1a;outline-offset:3px}
.decimal-order-slots,.decimal-frame-slots{display:flex;align-items:flex-start;justify-content:center;gap:12px}
.decimal-order-position{display:grid;justify-items:center;gap:7px}.decimal-order-endpoint{color:#42546b;font-size:.84rem;font-weight:900;letter-spacing:.025em;text-transform:uppercase;white-space:nowrap}.decimal-order-endpoint.is-empty{visibility:hidden}.decimal-order-sign{align-self:center;margin-top:18px;color:#17283f;font-family:"Cambria Math","Times New Roman",serif;font-size:2.25rem;font-weight:900}
.decimal-frame-line{width:min(100%,630px);margin:0 auto}.decimal-frame-line>svg{display:block;width:100%;height:auto;max-height:170px}
.decimal-frame-slots{justify-content:space-between;width:calc(100% - 86px);margin:-31px auto 8px;position:relative;z-index:3;pointer-events:none}.decimal-frame-slots .decimal-drop-slot{pointer-events:auto}
.decimal-frame-cards{margin-bottom:0}
.decimal-complement-visual{display:flex;align-items:center;justify-content:center;width:min(100%,620px);height:clamp(92px,16vh,132px);margin:5px auto 0}.decimal-complement-visual svg{display:block;width:100%;height:auto;max-height:100%}
.area-model-help{display:flex;align-items:center;justify-content:center;width:min(100%,760px);margin:2px auto}.area-model-svg{display:block;width:100%;height:auto;max-height:310px}
.area-model-phone-question{display:none}
.area-model-compact .area-model-svg{max-height:245px}.area-model-slot{cursor:pointer;touch-action:manipulation}.area-model-slot rect{transition:fill .15s ease}.area-model-slot.is-filled rect{fill:#fff3e3!important;stroke:#e86100}.area-model-slot.is-selected rect{stroke:#ff7a1a;stroke-width:4}
.expand-factor-shell{display:flex;flex-direction:column;align-items:center;width:100%;gap:8px}.expand-prompt{margin-bottom:0}.expand-expression{font-size:clamp(2rem,5.2vw,3.35rem);font-weight:850;color:#132d4f;text-align:center}.expand-answer{margin-top:2px}.expand-options{width:min(100%,850px);margin-top:2px}.expand-manipulation{width:min(100%,760px);padding:4px 10px 8px;border-radius:14px;background:#f7fafc}.expand-manipulation .area-model-help{margin:0 auto}.expand-worked-correction{display:grid;grid-template-columns:auto 1fr;gap:11px;width:min(100%,830px);margin:2px auto 0;padding:11px 14px;border:1.5px solid #f4b76f;border-radius:14px;background:#fffaf4;color:#263b53;text-align:left;font-size:clamp(.91rem,1.65vw,1.08rem);line-height:1.35}.expand-worked-icon{display:grid;place-items:center;width:29px;height:29px;border-radius:50%;background:#f58220;color:#fff;font-size:1.05rem;font-weight:950}.expand-worked-correction h3{margin:1px 0 6px;color:#934000;font-size:1rem}.expand-worked-row{display:grid;grid-template-columns:minmax(98px,auto) 1fr;gap:9px;padding:2px 0}.expand-worked-row strong{color:#173a5e}.expand-worked-correction p{margin:6px 0 0;color:#5c6572}.legacy-expand-factor>.question{margin-bottom:2px}
@media(min-width:801px){.diapo.expand-factor-mode .stage{padding:6px 20px 9px}.diapo.expand-factor-mode .slide{max-width:1120px}.diapo.expand-factor-mode .expand-factor-shell{gap:5px}.diapo.expand-factor-mode .question{margin:0 auto 1px;font-size:clamp(1.75rem,3vw,2.4rem);line-height:1.08}.diapo.expand-factor-mode .expand-expression{font-size:clamp(1.85rem,3.6vw,2.75rem)}.diapo.expand-factor-mode .area-model-svg{max-height:180px}.diapo.expand-factor-mode .footer{margin-top:2px;font-size:clamp(2rem,3.5vw,2.85rem)}.diapo.expand-factor-mode .options{gap:10px 16px;margin-top:5px}.diapo.expand-factor-mode .opt{padding:12px 16px;font-size:clamp(1.05rem,1.6vw,1.45rem)}.diapo.expand-factor-mode .expand-worked-correction{gap:9px;padding:8px 12px;font-size:.94rem;line-height:1.22}.diapo.expand-factor-mode .expand-worked-correction h3{margin:0 0 4px;font-size:.94rem}.diapo.expand-factor-mode .expand-worked-row{padding:1px 0}.diapo.expand-factor-mode .expand-worked-correction p{margin:4px 0 0}}
.expand-worked-correction{grid-template-columns:auto minmax(0,1fr) auto;align-items:center}.expand-worked-summary h3{margin:0 0 2px}.expand-worked-summary p{margin:0!important;font-size:1.08em;font-weight:800}.expand-correction-detail-button{min-height:46px;padding:8px 13px;border:1.5px solid #e86100;border-radius:11px;background:#fff;color:#934000;font-size:1rem;font-weight:900;cursor:pointer;white-space:nowrap}.expand-correction-detail-template{display:none}
@media(min-width:801px){.diapo.expand-factor-mode .stage>.slide{margin-top:28px;margin-bottom:auto}.diapo.expand-factor-mode.expand-factor-sparse-mode .stage>.slide{margin-top:62px}.diapo.expand-factor-mode.expand-factor-sparse-mode .question{font-size:clamp(2.15rem,3.5vw,3rem)}.diapo.expand-factor-mode.expand-factor-sparse-mode .expand-expression{font-size:clamp(3rem,5.4vw,4.8rem)}.diapo.expand-factor-mode:not(.expand-factor-dense-mode) .area-model-svg{max-height:225px}.diapo.expand-factor-mode .expand-worked-correction{width:min(100%,940px);font-size:1.08rem}.diapo.expand-factor-mode .expand-correction-detail-button{font-size:1.05rem}}
.decimal-decomposition{display:grid;gap:7px;width:min(100%,720px);padding:10px 16px;border:1px solid #d3dfed;border-radius:16px;background:#fff;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif}.decimal-decomposition-title{color:#43536a;font:900 1.05rem Arial,sans-serif;text-align:center}.decimal-decomposition-line{display:flex;align-items:center;justify-content:center;gap:10px;font-size:clamp(1.6rem,3.4vw,2.65rem);font-weight:850;white-space:nowrap}.decimal-decomposition-start{font-size:clamp(1.9rem,4vw,3.1rem)}.decimal-decomposition-slot,.decimal-decomposition-term{display:inline-grid;place-items:center;min-width:190px;min-height:56px;padding:8px 12px;border:2px dashed #86a8cf;border-radius:12px;background:#f8fbff;color:#244d70;font:850 clamp(1.25rem,2.6vw,2rem) "Cambria Math","Times New Roman",serif}.decimal-decomposition-slot.is-filled{border-style:solid;border-color:#e86100;background:#fff7ef;color:#8d3b00}.decimal-decomposition-result{padding-top:5px;border-top:1px solid #dce5f0;color:#087a55;font-size:clamp(1.35rem,2.7vw,2.05rem);font-weight:900;text-align:center}
.decimal-distributivity-board{padding-top:8px}.decimal-distributivity-board .decimal-card-tray{margin:2px auto 0}
.decimal-manipulation.is-correction .decimal-card-tray{display:none}
.diapo.divisibility-sharing-mode .stage{align-items:center;padding:8px 20px 12px}
.diapo.divisibility-sharing-mode .slide{max-width:1050px}
.diapo.divisibility-sharing-mode .question{font-size:clamp(1.45rem,2.5vw,2.7rem);line-height:1.12;margin:0 auto 3px}
.equal-sharing-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(210px,36vh,330px);margin:1px auto 2px}
.equal-sharing-svg{display:block;width:min(100%,760px);height:auto;max-height:100%}
.diapo.divisibility-sharing-mode .options{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px 12px;max-width:900px;margin-top:4px}
.diapo.divisibility-sharing-mode .opt{min-height:54px;padding:10px 13px;font-size:clamp(1rem,1.55vw,1.35rem)}
.diapo.divisibility-mode .stage{align-items:center;padding:10px 18px 12px}
.diapo.divisibility-mode .slide{width:100%;max-width:1180px}
.divisibility-prompt{font-size:clamp(1.7rem,3vw,3.1rem);line-height:1.15;margin:0 auto 16px}
.divisibility-prompt.divisibility-prompt-text{font-size:clamp(1.5rem,2.55vw,2.7rem);max-width:1080px}
.divisibility-prompt small{display:block;margin-top:8px;color:#3d4f68;font:800 clamp(1rem,1.35vw,1.35rem)/1.2 Arial,sans-serif}
.divisibility-number{font-weight:900;white-space:nowrap}
.divisibility-pair{display:flex;flex-wrap:wrap;justify-content:center;gap:.25em 1.4em;margin-top:.3em;font-size:1.08em;font-weight:900;white-space:nowrap}
.divisibility-missing{letter-spacing:.03em}.divisibility-box{color:#c2410c}
.diapo.divisibility-mode .divisibility-answer-line{margin-top:6px}
.diapo.divisibility-mode .divisibility-options:not(.divisibility-grid-text){gap:12px 14px;width:min(100%,780px);max-width:none;margin:12px auto 0}
.diapo.divisibility-mode .divisibility-options:not(.divisibility-grid-text) .opt{display:flex;align-items:center;justify-content:center;min-height:64px;padding:10px 14px;font-size:clamp(1.4rem,2.3vw,2.3rem);font-weight:850;line-height:1.1;text-align:center;white-space:nowrap}
.divisibility-grid-divisors{grid-template-columns:repeat(3,minmax(0,1fr))}
.divisibility-grid-numbers{grid-template-columns:repeat(4,minmax(0,1fr))}.diapo.divisibility-mode .divisibility-grid-numbers{width:min(100%,900px)}.divisibility-option-none{grid-column:2/span 2}
.divisibility-grid-list{grid-template-columns:repeat(9,minmax(0,1fr))}.diapo.divisibility-mode .divisibility-grid-list{width:min(100%,1120px);gap:10px}.diapo.divisibility-mode .divisibility-grid-list .opt{padding:10px 4px}
.divisibility-grid-yes-no{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.divisibility-mode .divisibility-grid-yes-no{width:min(100%,560px)}
.divisibility-step{padding:8px 8px 9px;border:2px solid #c9dced;border-radius:12px;background:#f8fbff;color:#17384d;text-align:center}
.divisibility-step strong{display:block;font-size:1rem;line-height:1.15}
.divisibility-step small{display:block;margin-top:6px;color:#3d4f68;font-size:.86rem;font-weight:750;line-height:1.3}
.divisibility-digits{display:flex;justify-content:center;gap:4px;margin:7px auto 0}
.divisibility-digit{display:grid;place-items:center;min-width:28px;height:34px;padding:0 4px;border:2px solid #afc4d7;border-radius:8px;background:#fff;font:900 1.2rem/1 Arial,sans-serif}
.divisibility-digit.is-unit{border-color:#e86100;background:#fff0df;color:#9a4100;box-shadow:0 0 0 2px rgba(232,97,0,.12)}
.divisibility-sum{margin:9px auto 0;color:#0b3570;font:900 1.15rem/1.2 Arial,sans-serif;text-align:center;white-space:nowrap}
.course-card.divisibility-course-card{width:min(980px,100%);max-width:980px}.course-card.divisibility-course-card .course-rule{font-size:1.08rem;line-height:1.3}.course-divisibility-line{display:block;margin-top:5px}.course-divisibility-line b{white-space:nowrap}
.course-divisibility-units{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}.course-divisibility-units span{padding:6px 5px;border-radius:9px;background:#edf5ff;color:#0b4f86;font-weight:800;line-height:1.2;text-align:center}.course-divisibility-units b{display:block}
@media(min-width:1600px){.diapo.divisibility-mode:not(.interactive-mode) .divisibility-prompt{font-size:3.5rem}.diapo.divisibility-mode:not(.interactive-mode) .divisibility-prompt.divisibility-prompt-text{font-size:3rem}.diapo.divisibility-mode:not(.interactive-mode) .divisibility-options:not(.divisibility-grid-text){width:min(100%,960px)}.diapo.divisibility-mode:not(.interactive-mode) .divisibility-grid-list{width:min(100%,1400px)}.diapo.divisibility-mode:not(.interactive-mode) .divisibility-options:not(.divisibility-grid-text) .opt{min-height:80px;font-size:2.8rem}}
@media(max-width:360px){.course-divisibility-units span{font-size:.86em}}
.course-divisibility-unit{color:#c2410c;font-weight:900}.course-divisibility-warning{display:block;margin-top:8px;color:#7a3500;font-size:.92em;font-weight:750}
.pythagoras-builder{width:min(100%,780px);margin:0 auto;padding:10px 14px 11px;border:1px solid #cddcf0;border-radius:18px;background:linear-gradient(180deg,#fff,#f7fbff);color:#0b2147;user-select:none}
.pythagoras-builder-prompt{margin:0 auto 2px;font-size:clamp(1.12rem,2vw,1.48rem);font-weight:850;line-height:1.18}
.pythagoras-builder-triangle{display:block;width:min(100%,365px);max-height:205px;margin:0 auto}
.pythagoras-builder-work{display:grid;gap:7px;justify-items:center}
.pythagoras-builder-equation,.pythagoras-builder-areas{display:flex;align-items:center;justify-content:center;gap:7px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.55rem,2.8vw,2.35rem);font-weight:850;line-height:1}
.pythagoras-builder-equation.is-given strong{display:inline-grid;place-items:center;min-width:2.8em;min-height:1.55em;padding:5px 10px;border:2px solid #9fc9c9;border-radius:11px;background:#eaf8f4;color:#0b3570}
.pythagoras-builder-areas{font-size:clamp(1.28rem,2.3vw,1.9rem)}
.pythagoras-builder-caption{font:800 .76rem/1.1 Arial,sans-serif;color:#60708c;letter-spacing:.045em;text-transform:uppercase}
.pythagoras-builder-areas>.pythagoras-builder-caption{margin-right:4px}
.pythagoras-builder-slot{display:inline-grid;place-items:center;min-width:2.9em;min-height:1.58em;padding:5px 9px;border:2px dashed #91aac8;border-radius:11px;background:#fff;color:#0b3570;font:inherit;font-weight:900;cursor:pointer;touch-action:manipulation}
.pythagoras-builder-slot.filled{border-style:solid;border-color:#78a3d1;background:#edf5ff}.pythagoras-builder-slot.is-selected{border-color:#ff7a1a;background:#fff1e7}
.pythagoras-builder-palette{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:7px;width:min(100%,680px);padding:6px 8px;border:1px solid #d7e3f3;border-radius:12px;background:#fff}
.pythagoras-builder-palette>.pythagoras-builder-caption{flex:0 0 100%}
.pythagoras-builder-token{min-width:60px;min-height:43px;padding:7px 11px;border:2px solid #1170bc;border-radius:11px;background:#eaf4ff;color:#0b4f86;font-size:1.08rem;font-weight:900;cursor:grab;touch-action:none;box-shadow:0 2px 0 rgba(11,53,112,.1)}
.pythagoras-builder-token.values-token{border-color:#e17a08;background:#fff3e3;color:#9a4b00}.pythagoras-builder-token.is-selected{outline:3px solid #ff7a1a;outline-offset:2px}.pythagoras-builder-token.is-used{visibility:hidden;pointer-events:none}.pythagoras-builder-token.is-dragging{position:relative;z-index:30;opacity:.9;cursor:grabbing;box-shadow:0 8px 18px rgba(11,33,71,.22)}
.pythagoras-builder-feedback{min-height:1.2em;margin:6px auto 0;color:#60708c;font-size:.86rem;font-weight:750}.pythagoras-builder-feedback.is-error{color:#b42318}.pythagoras-builder-feedback.is-success{color:#087a55}
.diapo.scientific-mode .stage{align-items:center;padding:12px 20px 18px}
.diapo.scientific-mode .slide{max-width:1120px}
.scientific-prompt{font-size:clamp(1.9rem,3.1vw,3.25rem);font-weight:850;line-height:1.13;margin:0 auto 5px}
.scientific-footer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.25rem,3.8vw,4rem);font-weight:750;margin:5px auto 0}
.scientific-footer .answer-slot{width:auto!important;min-width:1.15em;margin-left:.03em;margin-right:.03em}
.scientific-footer .answer-slot-filled{min-width:0}
.scientific-footer sup .answer-slot{min-width:.85em;margin-left:.01em;margin-right:0}
.scientific-help{display:flex;align-items:center;justify-content:center;margin:14px auto 0;color:#17384d}
.scientific-place-help{min-height:76px;margin-top:20px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif}
.scientific-inline-number{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-weight:800}
.scientific-place-equation{font-size:clamp(2rem,3.5vw,3.65rem);font-weight:750;line-height:1.1}
.scientific-digit-marker{display:inline;position:relative;color:inherit;font-weight:inherit}
.scientific-digit-marker::after{content:"";position:absolute;inset:-.04em -.025em -.015em;border:2px dashed #e86100;border-radius:0;pointer-events:none}
.scientific-glide-help{max-width:900px;height:clamp(175px,26vh,230px);margin-top:-4px}
.scientific-glide{display:block;width:100%;max-width:820px;height:auto;max-height:100%}
.scientific-condition-help{flex-direction:column;gap:7px;min-height:82px}
.scientific-condition{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.1rem,3.6vw,3.8rem);font-weight:800}
.scientific-condition-check{font-size:clamp(1.15rem,1.8vw,1.7rem);font-weight:750}
.scientific-coefficient{display:inline-block;padding:0 .15em;border-bottom:4px solid #e86100}
.scientific-coefficient.is-valid{color:#087a55;border-color:#10b981}.scientific-coefficient.is-invalid{color:#b42318;border-color:#d43b3b}
.scientific-options{margin-top:12px;max-width:1080px}.scientific-options .opt{font-size:clamp(1.15rem,1.75vw,1.75rem);padding:13px 16px}
.diapo.module01-mode .stage{align-items:center;padding:var(--stage-top) var(--stage-x) var(--stage-bottom);overflow:auto}
.diapo.module01-mode .slide{max-width:1480px}
.diapo.module01-mode .module01-prompt{font-size:clamp(2.25rem,3.5vw,3.9rem);margin:0 auto 8px;line-height:1.08}
.diapo.module01-mode .module01-source{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.8rem,4.8vw,5.1rem);font-weight:700;margin:3px auto 7px}
.diapo.module01-mode .module01-visual{margin:8px auto 5px;display:flex;justify-content:center;max-width:900px}
.diapo.module01-mode .module01-visual svg{display:block;width:100%;height:auto}
.diapo.module01-mode .module01-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(3rem,5vw,5.4rem);font-weight:700;margin:9px auto 0}
.diapo.module01-mode .module01-options{margin-top:6px;max-width:1180px}
.diapo.module01-mode .module01-options .opt{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.55rem,2.3vw,2.55rem);text-align:left;padding:13px 16px}
.diapo.fraction-ops-mode .stage{align-items:center;padding:10px 18px 16px;overflow:auto}
.diapo.fraction-ops-mode .slide{max-width:1320px}
.fraction-ops-prompt{font-size:clamp(1.8rem,3.05vw,3.25rem);line-height:1.12;margin:0 auto 5px}
.fraction-ops-help{display:flex;flex-direction:column;align-items:center;width:100%;margin:7px auto 3px;max-width:1300px}
.fraction-ops-pair,.fraction-ops-operation,.fraction-ops-conversion{display:flex;align-items:center;justify-content:center;gap:12px 18px;width:100%;margin:0 auto}
.fraction-ops-stack{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;width:100%;margin:0 auto}
.fraction-ops-stack>.fraction-ops-arrow+.fraction-ops-card{margin-top:10px}
.fraction-ops-card{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;max-width:1000px}
.fraction-ops-label{min-height:31px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.15rem,1.8vw,1.75rem);font-weight:800}
.fraction-ops-units{display:flex;align-items:center;justify-content:center;gap:5px;width:100%}
.fraction-ops-band{display:block;width:min(100%,940px);height:auto}
.fraction-ops-arrow{font-size:1.55rem;font-weight:900;color:#60708c;line-height:.8}
.fraction-ops-sign{font-size:clamp(1.8rem,3vw,3rem);font-weight:900;color:#17283f;flex:none}
.fraction-ops-sign-bottom{align-self:flex-end;margin-bottom:30px}
.fraction-ops-wall,.fraction-ops-compare-wall{display:flex;flex:0 1 auto;flex-direction:column;align-items:center;justify-content:center;width:min(100%,1000px)}
.fraction-ops-wall .fraction-ops-band,.fraction-ops-compare-wall .fraction-ops-band{width:min(100%,960px);flex:none}
.fraction-ops-wall .fraction-ops-band+.fraction-ops-band,.fraction-ops-compare-wall .fraction-ops-band+.fraction-ops-band{margin-top:-6px}
.fraction-ops-wall-label{min-height:29px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.1rem,1.7vw,1.65rem);font-weight:850}
.fraction-ops-wall-label-bottom{margin-top:-1px}
.fraction-ops-result-visual{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:1px;font-size:2.3rem;font-weight:900}
.fraction-ops-result-separated{margin-top:22px}
.fraction-ops-result-text{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.5rem,2.4vw,2.4rem);font-weight:900;color:var(--answer);white-space:nowrap}
.fraction-ops-product{display:flex;align-items:center;justify-content:center;gap:18px;margin:0 auto}
.fraction-product-manipulator{width:min(100%,760px);margin:0 auto;padding:0;border:0;border-radius:0;background:transparent;user-select:none}
.fraction-product-layout{display:grid;grid-template-columns:76px minmax(0,1fr);grid-template-rows:58px minmax(390px,1fr);gap:12px 16px;width:min(100%,590px);margin:0 auto}
.fraction-product-top-label,.fraction-product-left-label{display:flex;align-items:center;justify-content:center}.fraction-product-top-label{grid-column:1;grid-row:1}.fraction-product-top-axis{grid-column:2;grid-row:1}.fraction-product-left-label{grid-column:1;grid-row:2}.fraction-product-left-axis{grid-column:1;grid-row:2;justify-self:end;width:44px}
.fraction-product-grid{grid-column:2;grid-row:2;display:grid;width:100%;aspect-ratio:1;border:5px solid #111;background:#ddd;min-width:0;min-height:0}
.fraction-product-cell{position:relative;display:grid;place-items:center;border-right:1px solid #7b7b7b;border-bottom:1px solid #7b7b7b;overflow:hidden;color:#17283f;font-family:Cambria Math,Times New Roman,serif;font-size:clamp(.62rem,1.25vw,.92rem);font-weight:750}.fraction-product-cell.column-selected,.fraction-product-cell.row-selected{background:rgba(117,196,238,.25)}.fraction-product-cell.column-selected.row-selected{background:rgba(117,196,238,.9)}.fraction-product-cell.last-col{border-right:0}.fraction-product-cell.last-row{border-bottom:0}
.fraction-product-axis{position:relative;cursor:pointer;touch-action:none;outline:none}.fraction-product-axis:focus-visible{box-shadow:0 0 0 3px rgba(11,121,208,.28);border-radius:8px}.fraction-product-axis-line,.fraction-product-axis-selection{position:absolute;border-radius:999px;pointer-events:none}.fraction-product-axis-line{background:#111;z-index:1}.fraction-product-axis-selection{background:rgba(117,196,238,.9);z-index:2}
.fraction-product-top-axis .fraction-product-axis-line,.fraction-product-top-axis .fraction-product-axis-selection{left:0;top:50%;height:9px;transform:translateY(-50%)}.fraction-product-top-axis .fraction-product-axis-line{right:0}.fraction-product-left-axis .fraction-product-axis-line,.fraction-product-left-axis .fraction-product-axis-selection{top:0;left:50%;width:9px;transform:translateX(-50%)}.fraction-product-left-axis .fraction-product-axis-line{bottom:0}
.fraction-product-tick{position:absolute;z-index:3;border-radius:99px;background:#111;pointer-events:none}.fraction-product-top-axis .fraction-product-tick{top:50%;width:3px;height:24px;transform:translate(-50%,-50%)}.fraction-product-left-axis .fraction-product-tick{left:50%;width:24px;height:3px;transform:translate(-50%,-50%)}
.fraction-product-num-handle{position:absolute;z-index:5;width:23px;height:23px;border:3px solid #fff;border-radius:50%;background:rgba(117,196,238,.95);box-shadow:0 2px 6px rgba(0,0,0,.28);cursor:grab;touch-action:none}.fraction-product-num-handle:after{content:"";position:absolute;inset:-10px}.fraction-product-num-handle:active{cursor:grabbing}.fraction-product-top-axis .fraction-product-num-handle{top:50%;transform:translate(-50%,-50%)}.fraction-product-left-axis .fraction-product-num-handle{left:50%;transform:translate(-50%,-50%)}
.fraction-product-den-handle{position:absolute;z-index:6;width:36px;height:36px;cursor:grab;touch-action:none}.fraction-product-top-axis .fraction-product-den-handle{top:calc(50% + 19px);transform:translate(-50%,-50%)}.fraction-product-top-axis .fraction-product-den-handle:before{content:"";position:absolute;left:9px;top:10px;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:15px solid #111}.fraction-product-left-axis .fraction-product-den-handle{left:calc(50% + 19px);transform:translate(-50%,-50%)}.fraction-product-left-axis .fraction-product-den-handle:before{content:"";position:absolute;left:10px;top:9px;border-top:9px solid transparent;border-bottom:9px solid transparent;border-right:15px solid #111}
.fraction-product-live-fraction{display:inline-flex;flex-direction:column;align-items:center;min-width:42px;font-family:Cambria Math,Times New Roman,serif;font-size:1.35rem;line-height:1}.fraction-product-live-fraction i{width:40px;margin:3px 0;border-top:2px solid currentColor}.fraction-product-static{display:none!important}
.place-value-strip{grid-template-columns:repeat(13,calc(100% / 13))}
.place-value-equation{display:flex;align-items:center;justify-content:center;height:1.25em;line-height:1;overflow:visible}
.is-placeholder{visibility:hidden}
.place-value-prompt{font-size:clamp(2.15rem,3.8vw,3.35rem);margin-bottom:7px}
.place-value-prompt.is-context,.place-value-prompt.is-reasoning{max-width:1040px;font-size:clamp(1.55rem,2.45vw,2.55rem);line-height:1.16}
.place-value-equation{font-family:Cambria Math,Times New Roman,serif;font-size:clamp(2.6rem,5.1vw,4.5rem);font-weight:800;margin:4px auto 12px;gap:.14em}.place-value-number-units,.place-value-fixed-digit.is-units-digit,.place-value-strip-digit.is-units-digit{color:#0879d0}.place-value-number-comma{color:#e86100}
.place-value-unit{font-size:.72em;color:#31516e}.place-value-tool{width:min(98%,1480px);margin:8px auto 0;user-select:none;touch-action:none}
.place-value-grid{position:relative;overflow:hidden;border:3px solid #17384d;border-radius:14px;background:#fff}
.place-value-head-row,.place-value-window-row,.place-value-fixed-row{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.place-value-head{display:flex;min-width:0;align-items:center;justify-content:center;height:42px;padding:0 2px;overflow:hidden;border-right:1.5px solid #9fb3c8;border-bottom:1.5px solid #9fb3c8;background:#eef6ff;color:#35526e;font-size:clamp(.62rem,1.35vw,1rem);font-weight:800;line-height:1.05;letter-spacing:-.04em;white-space:nowrap}
.place-value-head:nth-child(4){background:#dceeff;color:#0879d0}.place-value-head:last-child{border-right:0}
.place-value-preview-row,.place-value-fixed-row{position:relative;height:70px}.place-value-preview-row{background:#f7f8fa}.place-value-fixed-row{border-top:1.5px solid #9fb3c8;background:#fff}
.place-value-window-row{position:absolute;inset:0;z-index:5;pointer-events:none}.place-value-window{border-right:1.5px solid #9fb3c8}.place-value-window:last-child{border-right:0}
.place-value-strip-viewport{position:absolute;inset:0;z-index:3;overflow:hidden;pointer-events:none}
.place-value-strip{position:absolute;inset:0 auto 0 0;display:grid;grid-template-columns:repeat(13,calc(100% / 13));width:calc(100% * 13 / 7);align-items:center;justify-items:center;will-change:transform}
.place-value-strip-digit,.place-value-fixed-digit{display:grid;place-items:center;color:#0b2147;font-family:Cambria Math,Times New Roman,serif;font-size:clamp(2.4rem,4.55vw,4rem);font-weight:850}.place-value-strip-digit.ghost-zero{color:#334d68}
.place-value-drag-bar{position:absolute;z-index:2;left:-24px;right:-24px;top:9px;height:52px;cursor:grab;touch-action:none;outline:none;will-change:transform}.place-value-drag-bar span{display:block;width:100%;height:100%;border:1px solid rgba(107,114,128,.3);border-radius:0;background:rgba(209,213,219,.62);box-shadow:inset 0 2px 3px rgba(0,0,0,.12),inset 0 -2px 3px rgba(255,255,255,.55)}.place-value-drag-bar:focus-visible span{box-shadow:inset 0 0 0 3px #f07818}
.place-value-fixed-digit{border-right:1.5px solid #9fb3c8}.place-value-fixed-digit:nth-child(7){border-right:0}
.place-value-fixed-digit[data-place-value-source]{position:relative;z-index:8;cursor:pointer;touch-action:manipulation;outline:none}.place-value-fixed-digit[data-place-value-source]:focus-visible,.place-value-tool.tap-selecting .place-value-fixed-digit[data-place-value-source]{background:#fff1df;box-shadow:inset 0 0 0 3px #f07818}.place-value-tool.tap-selecting .place-value-head{cursor:pointer;box-shadow:inset 0 0 0 2px #f07818}.place-value-tool.tap-selecting .place-value-head:hover,.place-value-tool.tap-selecting .place-value-head:focus-visible{background:#fff1df;color:#7a3500;outline:none}
.place-value-comma{position:absolute;z-index:7;left:calc(57.142857% - 4px);bottom:4px;color:#e86100;font-family:Cambria Math,serif;font-size:2.6rem;font-weight:900;line-height:1;pointer-events:none}
.place-value-row-labels{position:absolute;width:1px;height:1px;overflow:hidden}.place-value-tool-note{display:flex;align-items:center;justify-content:center;height:44px;min-height:44px;margin-top:8px;color:#31516e;font-size:clamp(1.08rem,2vw,1.45rem);line-height:1.1}.place-value-tool-instruction{font-size:clamp(.86rem,1.35vw,1.08rem);font-weight:750}.place-value-tool-note strong{color:#087a55;font-size:1.25em}.place-value-correction{height:28px;margin:7px auto;color:#31516e;font-size:clamp(1.08rem,2vw,1.45rem);line-height:1.1}.place-value-options{max-width:820px;margin-top:10px}.place-value-options .opt{min-height:58px}.place-value-options.is-reasoning{max-width:1020px;grid-template-columns:1fr}.place-value-options.is-reasoning .opt{min-height:52px;font-size:clamp(1rem,1.48vw,1.35rem);padding:11px 14px}.place-value-placeholder{width:min(98%,1480px);height:234px;min-height:234px;margin:8px auto 0}
.conversion-content{width:100%}.conversion-context{margin:0 auto 4px;color:#31516e;font-size:clamp(1rem,1.65vw,1.3rem);font-weight:750;text-align:center}.conversion-prompt{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.18em .28em;font-size:clamp(1.95rem,3.45vw,3rem);margin-bottom:8px}.conversion-verb{font-weight:900}.conversion-source-expression{white-space:nowrap}.conversion-source-value{color:#0b2147;font-weight:900}.conversion-source-unit,.conversion-source-units-digit{color:var(--conversion-color);font-weight:950}.conversion-source-unit sup,.conversion-target-unit sup{font-size:.62em}.conversion-equals{margin:0 .08em}.conversion-target-unit{margin-left:.08em;font-weight:850}.conversion-equation-stack{display:flex;flex-direction:column;align-items:center;gap:4px}.conversion-equation-stack .math-display{margin:0}
.conversion-tool{width:min(98%,1540px);margin:100px auto 94px;user-select:none}.conversion-grid-wrap{position:relative}.conversion-grid{position:relative;display:grid;grid-template-columns:repeat(var(--conversion-slots),minmax(0,1fr));gap:4px;background:transparent;isolation:isolate;overflow:visible}
.conversion-unit{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:54px;padding:4px 1px;border:2px solid var(--conversion-color);border-radius:8px;background:color-mix(in srgb,var(--conversion-color) 12%,white);color:#17384d;font-size:clamp(.68rem,1.2vw,1.08rem);font-weight:800}.conversion-unit strong{font-size:1.08em}.conversion-unit small{color:color-mix(in srgb,var(--conversion-color) 82%,#17384d);font-size:.78em;font-weight:900}.conversion-unit:not([data-unit-slot="true"]){background:transparent;border-color:color-mix(in srgb,var(--conversion-color) 34%,transparent)}.conversion-unit.is-cursor-unit strong{color:var(--conversion-color);font-weight:950;text-shadow:0 0 1px color-mix(in srgb,var(--conversion-color) 75%,transparent)}
.conversion-slot{position:relative;z-index:2;display:grid;place-items:center;min-height:92px;border:2px solid var(--conversion-color);border-radius:8px;background:#fff;color:#0b2147;font-family:Cambria Math,Times New Roman,serif;font-size:clamp(1.7rem,2.8vw,3rem);font-weight:750}.conversion-slot.ghost-zero{color:#526a82}.conversion-slot.is-cursor-unit{color:var(--conversion-color);font-weight:950;text-shadow:0 0 1px color-mix(in srgb,var(--conversion-color) 70%,transparent)}
.conversion-cursor{position:absolute;z-index:4;top:0;bottom:0;left:0;width:calc(100% / var(--conversion-slots));padding:0;border:3px solid color-mix(in srgb,var(--conversion-color) 72%,#17384d);border-radius:8px;background:color-mix(in srgb,var(--conversion-color) 15%,transparent);cursor:grab;touch-action:none;outline:none;transition:transform .16s ease}.conversion-cursor:active{cursor:grabbing}.conversion-cursor:focus-visible{box-shadow:0 0 0 4px color-mix(in srgb,var(--conversion-color) 24%,transparent)}
.conversion-cursor-label,.conversion-cursor-digit-label{position:absolute;left:50%;width:150px;padding:11px 9px;border:3px solid #fff;border-radius:14px;background:linear-gradient(135deg,var(--conversion-color),color-mix(in srgb,var(--conversion-color) 78%,#17384d));color:#fff;font-size:clamp(.82rem,1.25vw,1.08rem);font-weight:950;line-height:1.05;text-transform:uppercase;box-shadow:0 8px 22px rgba(23,56,77,.24);cursor:grab;touch-action:none}.conversion-cursor-label:active,.conversion-cursor-digit-label:active{cursor:grabbing}.conversion-cursor-label{bottom:calc(100% + 26px);transform:translateX(-50%)}.conversion-cursor-label:after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);border-left:14px solid transparent;border-right:14px solid transparent;border-top:15px solid color-mix(in srgb,var(--conversion-color) 78%,#17384d)}.conversion-cursor-digit-label{top:calc(100% + 27px);transform:translateX(-50%)}.conversion-cursor-digit-label:before{content:"";position:absolute;left:50%;bottom:100%;transform:translateX(-50%);border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:15px solid var(--conversion-color)}.conversion-cursor-comma{position:absolute;right:-13px;bottom:31px;color:color-mix(in srgb,var(--conversion-color) 78%,#17384d);font-family:Nunito,Arial,sans-serif;font-size:3.5rem;font-weight:950;line-height:0;text-shadow:2px 2px 0 #fff,-2px -2px 0 #fff,2px -2px 0 #fff,-2px 2px 0 #fff}
.conversion-method{margin:-66px auto 12px;color:#31516e;font-size:clamp(1.08rem,2vw,1.45rem)}
.duration-conversion-tool{width:min(96%,940px);margin:4px auto 0}.duration-course-discs{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px;margin:12px auto 2px}.duration-equivalence-pair{display:inline-flex;align-items:center;justify-content:center;gap:10px}.duration-equivalence-pair>b{color:#17384d;font-size:clamp(1.35rem,2.4vw,2rem)}
.duration-disc{display:inline-grid;place-items:center;width:104px;aspect-ratio:1;border:4px solid #9d3e70;border-radius:50%;background:#f9d6e8;color:#6d234b;font-size:clamp(.95rem,1.65vw,1.2rem);font-weight:950;line-height:1.05;box-shadow:0 3px 8px rgba(23,56,77,.12);white-space:nowrap}.duration-disc-minute{border-color:#2f71a8;background:#dceeff;color:#174d78}.duration-disc-second{border-color:#21835d;background:#dff5e9;color:#145c41}.duration-course-discs .duration-disc{width:104px}
.duration-instance{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:220px;padding:10px 14px;border:2px solid #d3dfec;border-radius:18px;background:#f8fbff}.duration-instance-row{display:flex;align-items:center;justify-content:center;gap:13px}.duration-disc-group{display:flex;align-items:center;justify-content:center;gap:8px}.duration-instance-row .duration-disc{width:82px}.duration-plus{color:#17384d;font-size:clamp(1.45rem,2.8vw,2.2rem);font-weight:950}.duration-down{color:#e86100;font-size:2rem;font-weight:950;line-height:.75}.duration-second-step{display:flex;justify-content:center;margin:8px auto 0}.duration-second-step .duration-disc{width:76px}.duration-correction-line{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 14px;margin-top:11px;color:#17384d;font-size:clamp(1.08rem,2.05vw,1.55rem)}.duration-correction-line b{color:#087a55;font-size:1.15em}
.transformation-placement-svg{display:block;width:min(100%,600px);max-height:560px;margin:2px auto}.transformation-grid-hit{cursor:crosshair;pointer-events:all}.transformation-grid-hit:focus{fill:rgba(240,120,24,.16);outline:none}
.diapo.trigonometry-mode .question{font-size:clamp(1.75rem,2.7vw,2.75rem);line-height:1.12}.trig-question-svg{display:block;width:min(100%,540px);max-height:330px;margin:6px auto 2px}.diapo.trigonometry-mode .options{max-width:1120px;gap:10px 14px;margin-top:7px}.diapo.trigonometry-mode .opt{min-height:62px;padding:11px 14px;font-size:clamp(1.08rem,1.65vw,1.6rem)}.diapo.trigonometry-mode .footer{font-size:clamp(2rem,3.8vw,3.7rem);margin-top:4px}.course-trig-visual{max-height:230px}
.fraction-ops-area{display:block;width:min(100%,390px);height:auto;max-height:300px}
.fraction-ops-answer{display:flex;align-items:center;justify-content:center;gap:.1em;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.15rem,3.8vw,4rem);margin-top:2px}
.fraction-ops-answer-top{margin:2px auto 7px}
.fraction-ops-answer strong{color:var(--answer)}
.fraction-ops-simplification{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:5px 10px;margin:0 auto 5px;color:#55657d;font-size:clamp(1rem,1.55vw,1.35rem);font-weight:800}.fraction-ops-simplification .math-inline,.fraction-ops-simplification .math-display{color:#087a55;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:1.18em;font-weight:850}
.fraction-ops-options{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 14px;margin:7px auto 0;max-width:960px}
.fraction-ops-options .opt{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.1rem,1.7vw,1.7rem);padding:11px 14px}
.fraction-ops-method-card{width:min(100%,940px);margin:8px auto;padding:20px 24px;border:2px solid #bfd4ec;border-radius:18px;background:#f5f9ff}
.fraction-ops-method-label{display:block;margin-bottom:12px;color:#0b4b84;font-size:clamp(1.1rem,1.75vw,1.55rem);font-weight:900}
.fraction-ops-method-line{display:flex;align-items:center;justify-content:center;gap:16px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.9rem,3.35vw,3.55rem);font-weight:800}
.fraction-ops-method-arrow{color:#e86100;font-family:Arial,Helvetica,sans-serif;font-size:.85em;font-weight:900}
.fraction-ops-counting{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.fraction-ops-counting .fraction-ops-card{width:100%;max-width:1180px}
.fraction-ops-counting .fraction-ops-units{width:min(100%,1120px);gap:12px}
.fraction-ops-counting .fraction-ops-band{min-width:0;flex:1 1 0}
.fraction-ops-count-result{padding:9px 15px;border-radius:12px;background:#ecfdf5;color:#087a55;font-size:clamp(1.05rem,1.8vw,1.45rem);font-weight:900}
.fraction-ops-share{display:flex;align-items:center;justify-content:center;gap:15px;width:100%}
.fraction-ops-share-sign{flex:none;color:#e86100;font-size:clamp(1.5rem,2.6vw,2.6rem);font-weight:900}
@media(min-width:801px){.fraction-ops-card{max-width:1000px}.fraction-ops-stack>.fraction-ops-card{width:min(100%,1000px)}.fraction-ops-result-visual>.fraction-ops-card{width:min(100%,1000px);flex:0 1 1000px}.fraction-ops-operation>.fraction-ops-card,.fraction-ops-conversion>.fraction-ops-card{width:min(100%,640px);flex:0 1 640px}.fraction-ops-operation,.fraction-ops-conversion{gap:34px}.fraction-ops-band{width:min(100%,940px)}.fraction-ops-stack-simplify .fraction-ops-band{width:min(100%,860px)}.fraction-ops-units.units-2{width:min(100%,960px);gap:12px}.fraction-ops-units.units-2 .fraction-ops-band{width:min(100%,468px);flex:1 1 0}.fraction-ops-units.units-3{width:min(100%,1080px);gap:12px}.fraction-ops-units.units-3 .fraction-ops-band{width:min(100%,352px);flex:1 1 0}.fraction-ops-operation .fraction-ops-band,.fraction-ops-conversion .fraction-ops-band{width:min(100%,620px)}.fraction-ops-wall,.fraction-ops-compare-wall{width:min(100%,1000px);flex-basis:auto}.fraction-ops-wall .fraction-ops-band,.fraction-ops-compare-wall .fraction-ops-band{width:min(100%,960px)}.fraction-ops-area{width:min(100%,720px);max-height:485px}.fraction-ops-label{font-size:clamp(1.65rem,2.55vw,2.5rem)}.fraction-ops-wall-label{font-size:clamp(1.55rem,2.35vw,2.3rem)}}
.diapo.substitution-mode .stage{align-items:center;padding:16px 22px 18px;overflow:auto}
.diapo.substitution-mode .slide{max-width:1040px}
.substitution-prompt{font-size:clamp(2.05rem,3.25vw,3.55rem);line-height:1.14;margin:0 auto 8px}
.substitution-expression{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.75rem,4.75vw,5rem);font-weight:800;margin:3px auto 10px}
.substitution-help{display:flex;align-items:center;justify-content:center;min-height:70px;margin:4px auto 5px;color:#60708c;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.15rem,3.75vw,3.95rem);font-weight:800}
.substitution-answer{display:flex;align-items:center;justify-content:center;gap:.1em;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.4rem,4.4vw,4.6rem);margin-top:3px}
.substitution-answer strong{color:var(--answer)}
.substitution-options{margin-top:9px;max-width:880px}
.substitution-options.options-3{grid-template-columns:repeat(3,minmax(0,1fr));max-width:960px}
.diapo.equation-mode .stage{align-items:center;padding:10px 18px 16px;overflow:auto}
.diapo.equation-mode .slide{max-width:1160px}
.equation-prompt{font-size:clamp(1.7rem,2.75vw,3.05rem);line-height:1.13;margin:0 auto 4px}
.equation-main,.equation-help-equation{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.2rem,3.8vw,4.1rem);font-weight:800;line-height:1.05;margin:1px auto 3px}
.equation-resolve-stack{width:100%;margin:0 auto}
.equation-resolve-button-row{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;width:min(100%,920px);margin:0 auto -1px}
.equation-mobile-resolve-button-row{display:none}
.equation-resolve-btn{display:inline-flex;align-items:center;justify-content:center;grid-column:2;justify-self:center;height:32px;margin:0;padding:6px 11px;border:2px solid #159d52;border-radius:11px;background:#eefbf3;color:#087238;font-family:Arial,Helvetica,sans-serif;font-size:clamp(.8rem,1.08vw,.96rem);font-weight:900;line-height:1;text-decoration:none;white-space:nowrap;box-shadow:0 1px 0 rgba(8,114,56,.08)}
.equation-resolve-btn:hover,.equation-resolve-btn:focus-visible{background:#dcf8e8;border-color:#087b3d;outline:none}
.equation-aligned-row{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:baseline;column-gap:.22em;width:min(100%,920px);margin-left:auto;margin-right:auto}
.equation-aligned-left{text-align:right;min-width:0}
.equation-aligned-equals{text-align:center}
.equation-aligned-right{text-align:left;min-width:0}
.equation-help{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:clamp(215px,37vh,335px);margin:0 auto 2px}
.equation-help-equation{font-size:clamp(1.65rem,2.55vw,2.75rem);margin-bottom:1px}
.equation-splat-svg{display:block;width:min(100%,1040px);height:auto;max-height:100%}
.equation-answer-shell{display:grid;grid-template-columns:minmax(62px,1fr) auto minmax(62px,1fr);align-items:center;width:min(100%,760px);margin:1px auto 0}
.equation-answer{display:flex;align-items:center;justify-content:center;gap:.1em;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.15rem,3.75vw,4rem);margin:1px auto 0}
.equation-answer strong{color:var(--answer)}
.equation-detail-btn{justify-self:start;margin-left:10px;padding:7px 11px;border:2px solid #c8d8ed;border-radius:11px;background:#f8fbff;color:#073a75;font-family:Arial,Helvetica,sans-serif;font-size:clamp(.82rem,1.2vw,1rem);font-weight:850;cursor:pointer}
.equation-detail-btn:hover{border-color:#0b5fa8;background:#edf6ff}
.equation-options{margin-top:5px;max-width:980px;gap:9px 12px}
.equation-options.options-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.equation-options .opt{font-size:clamp(1.05rem,1.55vw,1.55rem);padding:11px 13px}
@media(max-width:800px){.diapo.equation-mode .stage{padding:5px 5px 8px}.diapo.interactive-mode.equation-mode .slide{display:flex;flex-direction:column;justify-content:center;min-height:100%;margin:0;padding:5px 0;gap:clamp(10px,2.15vh,18px)}.equation-mobile-resolve-button-row{display:grid;flex:none;width:min(100%,720px);margin:0 auto}.equation-resolve-button-row:not(.equation-mobile-resolve-button-row){display:none}.equation-prompt{flex:none;font-size:clamp(1.2rem,5.7vw,1.55rem);line-height:1.12;margin:0 auto}.equation-resolve-btn{height:34px;padding:6px 11px;border-width:1.5px;border-radius:9px;font-size:.82rem}.equation-main{flex:none;font-size:clamp(1.9rem,8.7vw,2.35rem);margin:0 auto}.equation-help{flex:none;height:auto;justify-content:flex-start;margin:0 auto}.equation-help-equation{font-size:clamp(1.55rem,7.2vw,1.9rem);margin:0 auto 4px}.diapo.equation-mode .slide>.equation-help .equation-splat-svg{width:calc(100% + 10px);max-width:none;margin-left:-5px;margin-right:-5px}.diapo.equation-mode .slide>.equation-help .equation-splat-svg>g>circle,.diapo.equation-mode .slide>.equation-help .equation-splat-svg>g>path,.diapo.equation-mode .slide>.equation-help .equation-splat-svg>g>text{transform-box:fill-box;transform-origin:center;transform:scale(1.18)}.equation-answer-shell{flex:none;grid-template-columns:minmax(54px,1fr) auto minmax(54px,1fr);width:100%;margin:0 auto}.equation-answer{font-size:clamp(1.9rem,8.4vw,2.35rem);margin:0 auto}.equation-detail-btn{margin-left:5px;padding:7px 9px;border-radius:9px;font-size:.8rem}.equation-options,.equation-options.options-3{flex:none;grid-template-columns:1fr;width:100%;max-width:none;gap:7px;margin:0}.equation-options .opt{display:flex;align-items:center;min-height:54px;padding:10px 12px;border-radius:14px;font-size:clamp(.98rem,4.2vw,1.12rem);line-height:1.16}.diapo.equation-contextual-layout .slide{gap:clamp(8px,1.75vh,14px)}.diapo.equation-contextual-layout .equation-prompt{font-size:clamp(1.08rem,5.05vw,1.38rem);line-height:1.13}.diapo.equation-qcm-solution-layout .slide{gap:clamp(7px,1.55vh,12px)}.diapo.equation-qcm-solution-layout .equation-prompt{font-size:clamp(1.12rem,5.3vw,1.45rem)}.diapo.equation-qcm-solution-layout .equation-main{font-size:clamp(1.78rem,8vw,2.18rem)}.diapo.equation-qcm-operation-layout .slide{gap:clamp(6px,1.35vh,10px)}.diapo.equation-qcm-operation-layout .equation-prompt{font-size:clamp(1.06rem,4.9vw,1.34rem)}.diapo.equation-qcm-operation-layout .equation-main{font-size:clamp(1.7rem,7.7vw,2.08rem)}.diapo.equation-qcm-operation-layout .equation-options .opt{min-height:56px;font-size:clamp(.9rem,3.85vw,1.04rem)}.course-equation-splat .equation-splat-svg{width:min(100%,360px);max-width:360px;margin:0}.course-equation-splat .equation-splat-svg>g>circle,.course-equation-splat .equation-splat-svg>g>path,.course-equation-splat .equation-splat-svg>g>text{transform:none}}
@media(max-width:800px) and (max-height:620px){.diapo.interactive-mode.equation-mode .slide{gap:6px;padding:2px 0}.equation-resolve-btn{height:30px;padding:5px 9px;font-size:.76rem}.equation-prompt{font-size:clamp(1.05rem,4.8vw,1.3rem)}.equation-main{font-size:clamp(1.65rem,7.5vw,2rem)}.equation-help-equation{font-size:clamp(1.35rem,6.2vw,1.7rem);margin-bottom:2px}.equation-answer{font-size:clamp(1.7rem,7.6vw,2.08rem)}.equation-options{gap:5px}.equation-options .opt{min-height:48px;padding:8px 10px}.diapo.equation-qcm-operation-layout .equation-options .opt{min-height:50px}}
.diapo.fraction-percent-mode .stage{align-items:center;padding:14px 22px 18px;overflow:auto}
.diapo.fraction-percent-mode .slide{max-width:1080px}
.fraction-percent-prompt{font-size:clamp(1.9rem,3vw,3.25rem);line-height:1.12;margin:0 auto 7px}
.fraction-percent-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(250px,39vh,350px);margin:2px auto 1px}
.fraction-percent-svg{display:block;width:min(100%,1000px);height:auto;max-height:100%}
.fraction-percent-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.2rem,4vw,4.05rem);margin-top:3px}
.diapo.multiple-forms-mode .stage{align-items:center;padding:10px 20px 16px;overflow:auto}
.diapo.multiple-forms-mode .slide{max-width:1120px}
.multiple-forms-prompt{font-size:clamp(1.75rem,2.8vw,3.05rem);font-weight:850;line-height:1.13;margin:0 auto 5px}
.multiple-forms-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(230px,38vh,350px);margin:1px auto 0}
.multiple-forms-help.multiple-forms-tenths{height:clamp(230px,38vh,350px)}
.multiple-forms-help.multiple-forms-line{height:clamp(260px,38vh,335px)}
.multiple-forms-svg{display:block;width:auto;max-width:100%;height:100%;max-height:100%}
.multiple-forms-line .multiple-forms-svg{width:min(100%,960px);height:auto}
.multiple-forms-line-mobile{display:none}
.multiple-forms-caption{min-height:1.35em;margin:2px auto 0;color:#60708c;font-size:clamp(1.15rem,1.75vw,1.65rem);font-weight:800;line-height:1.2}
.multiple-forms-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.05rem,3.75vw,3.85rem);font-weight:800;margin:4px auto 0}
.multiple-forms-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 13px;margin:8px auto 0;max-width:900px}
.multiple-forms-options .opt{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.35rem,2vw,2rem);padding:11px 14px}
.diapo.angle-sum-mode .stage{align-items:center;padding:12px 20px 18px;overflow:auto}
.diapo.angle-sum-mode .slide{max-width:1120px}
.angle-sum-prompt{font-size:clamp(1.75rem,2.8vw,3.1rem);line-height:1.13;margin:0 auto 5px}
.angle-sum-prompt svg{display:block;width:min(100%,430px);height:auto;margin:7px auto 0}
.angle-bar-action-row{display:flex;justify-content:flex-end;width:min(100%,760px);margin:2px auto -1px}
.angle-bar-resolve-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:7px 12px;border:1.5px solid #159d52;border-radius:999px;background:#eefbf3;color:#087238;font-family:Arial,Helvetica,sans-serif;font-size:clamp(.78rem,1vw,.92rem);font-weight:900;line-height:1;text-decoration:none;white-space:nowrap;box-shadow:0 1px 3px rgba(8,114,56,.1)}
.angle-bar-resolve-btn:hover,.angle-bar-resolve-btn:focus-visible{background:#dcf8e8;border-color:#087b3d;outline:3px solid rgba(21,157,82,.18);outline-offset:2px}
.triangle-angle-sum-visual{width:100%;display:grid;gap:2px;align-items:center;justify-items:center}
.angle-triangle-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(180px,30vh,250px);margin:2px auto 0}
.angle-triangle-svg{display:block;width:min(100%,720px);height:auto;max-height:100%}
.angle-bar-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(270px,41vh,370px);margin:2px auto 1px}
.angle-bar-svg{display:block;width:min(100%,1000px);height:auto;max-height:100%}
.angle-sum-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.1rem,3.8vw,3.9rem);margin-top:3px}
.angle-sum-answer .answer-slot-filled{margin-right:0}
.angle-sum-options{margin-top:8px;max-width:900px}
.angle-sum-options .opt{font-size:clamp(1.2rem,1.9vw,1.9rem);padding:11px 14px}
.diapo.angle-sum-mode.angle-figure-mode .angle-sum-prompt{font-size:clamp(1.45rem,2.25vw,2.35rem)}
.diapo.angle-sum-mode.angle-figure-mode .angle-sum-prompt svg{max-height:205px;margin-top:2px}
.diapo.angle-sum-mode.angle-figure-mode .angle-triangle-help{height:195px;margin-top:0}
.diapo.angle-sum-mode.angle-figure-mode .angle-bar-help{height:170px;margin-top:0}
.angle-sum-builder{display:grid;justify-items:center;gap:7px;width:min(100%,900px);margin:0 auto;user-select:none}
.angle-sum-builder-prompt{margin:0;color:#0b2147;font-size:clamp(1.25rem,2.15vw,1.85rem);font-weight:900;line-height:1.12}
.angle-sum-builder-triangle{width:100%;height:145px;overflow:hidden}.angle-sum-builder-triangle .angle-triangle-help{height:145px;margin:0}.angle-sum-builder-triangle .angle-triangle-svg{width:min(100%,510px)}
.angle-sum-builder-table{width:min(100%,760px);overflow:hidden;border:3px solid #17384d;border-radius:3px;background:#fff;box-shadow:0 3px 10px rgba(11,33,71,.08)}
.angle-sum-builder-row{display:grid;min-height:92px}.angle-sum-builder-row+.angle-sum-builder-row{border-top:3px solid #17384d}.angle-sum-builder-row.is-segmented .angle-sum-builder-slot+.angle-sum-builder-slot{border-left:2px solid #17384d}
.angle-sum-builder-slot{display:grid;place-items:center;min-width:0;min-height:92px;padding:7px 4px;border:0;background:#fff;color:#17384d;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.85rem,3.5vw,2.65rem);font-weight:950;line-height:1;cursor:pointer;touch-action:manipulation}
.angle-sum-builder-slot:hover{background:#f6f9fd}.angle-sum-builder-slot.is-selected{background:#fff1e7;color:#9a4100}.angle-sum-builder-slot.is-filled{background:#eef6ff;color:#073a75}
.angle-sum-builder-palette{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;width:min(100%,760px);padding:7px 9px;border:1px solid #d7e3f3;border-radius:13px;background:#fff}
.angle-sum-builder-token,.angle-sum-builder-reset{min-height:48px;padding:8px 15px;border:2px solid #1170bc;border-radius:11px;background:#eaf4ff;color:#0b4f86;font-size:clamp(1.2rem,2.1vw,1.55rem);font-weight:950;cursor:grab;touch-action:none;box-shadow:0 2px 0 rgba(11,53,112,.1)}
.angle-sum-builder-token.is-selected{outline:3px solid #ff7a1a;outline-offset:2px;border-color:#e86100;background:#fff1e7;color:#9a4100}.angle-sum-builder-token.is-used{visibility:hidden;pointer-events:none}.angle-sum-builder-token.is-dragging{position:relative;z-index:30;opacity:.9;cursor:grabbing;box-shadow:0 8px 18px rgba(11,33,71,.22)}
.angle-sum-builder-reset{border-width:1px;border-color:#9fb9d8;background:#fff;color:#35526e;font-size:1rem;cursor:pointer;touch-action:manipulation;box-shadow:none}
.angle-sum-builder-calculation{margin:2px auto 0;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2rem,3.8vw,3.2rem);font-weight:900}.angle-sum-builder-calculation strong{color:#087a55}.angle-sum-builder-calculation [data-angle-sum-answer-slot]{display:inline-grid;place-items:center;min-width:2.2em;min-height:1.35em;border:2px dashed #91aac8;border-radius:9px;color:#60708c}
.angle-sum-builder-feedback{min-height:1.15em;margin:0;color:#60708c;font-size:.9rem;font-weight:800}.angle-sum-builder-feedback.is-error{color:#b42318}.angle-sum-builder-feedback.is-success{color:#087a55}
.angle-sum-builder.is-calculation .angle-sum-builder-slot{cursor:default}.angle-sum-builder.is-calculation .angle-sum-builder-palette{display:none}
.diapo.evolution-mode .stage{align-items:center;padding:10px 20px 16px;overflow:auto}
.diapo.evolution-mode .slide{max-width:1220px}
.evolution-prompt{font-size:clamp(1.7rem,2.55vw,2.85rem);font-weight:850;line-height:1.15;margin:0 auto 5px}
.evolution-prompt table{font-size:clamp(1.15rem,1.62vw,1.55rem)!important;margin-top:14px!important;margin-bottom:13px!important}
.evolution-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(225px,35vh,335px);margin:2px auto 1px}
.evolution-svg{display:block;width:min(100%,1120px);height:auto;max-height:100%}
.evolution-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2rem,3.7vw,3.9rem);margin-top:3px}
.evolution-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 13px;margin:7px auto 0;max-width:1000px}
.evolution-options .opt{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.05rem,1.55vw,1.5rem);padding:10px 13px}
.diapo.relation-mode .stage{align-items:center;padding:14px 22px 18px;overflow:auto}
.diapo.relation-mode .slide{max-width:1120px}
.relation-prompt{font-size:clamp(1.9rem,3vw,3.3rem);line-height:1.12;margin:0 auto 8px}
.relation-bar-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(205px,34vh,285px);margin:2px auto 1px}
.relation-bar-svg{display:block;width:min(100%,1000px);height:auto;max-height:100%}
.pythagoras-aid-visual{display:flex;align-items:center;justify-content:center;width:min(100%,850px);height:clamp(205px,35vh,315px);margin:2px auto}
.pythagoras-aid-visual svg{display:block;width:100%;height:auto;max-height:100%}
.diapo.pythagoras-mode .stage{align-items:center;padding:14px 24px 18px}
.diapo.pythagoras-mode .slide{width:min(100%,1120px);max-width:1120px;margin-top:auto;margin-bottom:auto}
.diapo.pythagoras-mode .pythagoras-prompt{margin:0 auto 12px;font-size:clamp(2rem,2.8vw,3.45rem);line-height:1.12}
.diapo.pythagoras-mode .pythagoras-prompt.is-text-only{font-size:clamp(2.2rem,3.15vw,3.75rem)}
.diapo.pythagoras-mode .pythagoras-prompt.has-statement-figure{font-size:clamp(1.85rem,2.35vw,2.8rem)}
.diapo.pythagoras-mode .pythagoras-prompt.has-statement-figure svg{width:min(100%,330px)!important;max-height:215px!important;margin:7px auto 0!important}
.diapo.pythagoras-mode .pythagoras-aid-visual{height:clamp(185px,29vh,255px);margin:3px auto}
.diapo.pythagoras-mode .pythagoras-options{width:min(100%,1040px);margin:12px auto 0;gap:11px 14px}
.diapo.pythagoras-mode .pythagoras-options.options-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.diapo.pythagoras-mode .pythagoras-options .opt{display:flex;align-items:center;justify-content:center;gap:.24em;min-height:68px;padding:13px 16px;text-align:center;font-size:clamp(1.3rem,1.75vw,1.75rem);line-height:1.2}
.diapo.pythagoras-mode .pythagoras-answer{margin-top:9px;font-size:clamp(2.35rem,4.25vw,4.65rem)}
.relation-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.2rem,4vw,4.1rem);margin-top:4px}
.relation-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 15px;margin:10px auto 0;max-width:980px}
.relation-options .opt{display:flex;flex-direction:column;align-items:stretch;justify-content:center;min-height:118px;padding:11px 15px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.45rem,2.1vw,2.25rem)}
.relation-option-label{display:flex;align-items:center;gap:.22em;min-height:38px}
.relation-tile-help{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px;min-height:50px;margin-top:7px}
.relation-tile-help svg{display:block;flex:none;max-width:none}
.relation-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;width:min(100%,930px);margin:7px auto 0}
.relation-summary-card{display:flex;flex-direction:column;justify-content:center;min-height:119px;padding:9px 14px;border:2px solid #d7e3f3;border-radius:14px;background:#f8fbff}
.relation-summary-line{display:flex;align-items:center;justify-content:space-between;gap:15px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.3rem,1.9vw,1.85rem);font-weight:700}
.relation-summary-line strong{min-width:2.2em;color:#087a55;text-align:right;font-size:1.18em}
.relation-summary-card .relation-tile-help{margin-top:4px;min-height:34px}
.diapo.reduction-mode .stage{align-items:center;padding:var(--stage-top) var(--stage-x) var(--stage-bottom);overflow:auto}
.diapo.reduction-mode .slide{max-width:1480px}
.diapo.reduction-mode .reduction-prompt{font-size:clamp(2.45rem,3.7vw,4.2rem);margin:0 auto 7px;line-height:1.08}
.diapo.reduction-mode .reduction-expression{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-style:normal;font-size:clamp(3rem,4.8vw,5.3rem);font-weight:700;line-height:1.05;margin:2px auto 5px}.diapo.reduction-mode .reduction-term{display:inline-flex;align-items:baseline;white-space:nowrap}.diapo.reduction-mode sup{font-size:.46em;line-height:0;vertical-align:.72em;margin-left:.02em}
.diapo.reduction-mode .reduction-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-style:normal;font-size:clamp(3.4rem,5.6vw,6rem);font-weight:900;color:var(--answer);line-height:1.05;margin:7px auto 0}.diapo.reduction-mode .reduction-options{margin-top:14px;max-width:1320px}.diapo.reduction-mode .reduction-options .opt{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-style:normal;font-size:clamp(1.6rem,2.35vw,2.65rem);text-align:left}
.diapo.reduction-mode .reduction-text-fallback{font-size:clamp(2.2rem,4vw,4.3rem);line-height:1.35;margin:18px auto}
.diapo.reduction-mode .reduction-tiles svg{max-width:none}
.diapo.reduction-mode .reduction-expression{font-size:clamp(3rem,5.2vw,6.6rem)}.diapo.reduction-mode .reduction-options .opt{font-size:clamp(1.6rem,2.6vw,3.2rem)}.diapo.reduction-mode .reduction-option{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif}.diapo.reduction-mode .interactive-polynomial-separator{margin:0 .14em}.diapo.reduction-mode .interactive-polynomial-response{margin-top:16px}
@media(max-width:800px){.diapo.reduction-mode .reduction-prompt{font-size:clamp(1.3rem,5.9vw,1.7rem);line-height:1.15;margin-bottom:6px}.diapo.reduction-mode .reduction-expression{font-size:clamp(1.95rem,9.4vw,2.75rem);line-height:1.2;row-gap:2px}.diapo.reduction-mode .reduction-answer{font-size:clamp(2rem,9vw,2.7rem)}.diapo.reduction-mode .reduction-options .opt{font-size:clamp(1.3rem,5.6vw,1.6rem)}.diapo.reduction-mode .interactive-polynomial-response{font-size:clamp(1.9rem,8.4vw,2.5rem);margin-top:12px}}
.diapo.squares-mode .footer,.diapo.squares-mode .math-display{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-style:normal}
.diapo.squares-mode sup{font-size:.5em;line-height:0;vertical-align:.78em;margin-left:.02em}
.diapo.squares-mode .answer-dots{min-width:1.2em}
.diapo.numberline-mode .footer,.diapo.numberline-mode .math-display{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-style:normal}
.diapo.numberline-mode .footer sub{font-size:.58em;line-height:0;vertical-align:-.28em;margin-left:.04em}
.diapo.numberline-mode .answer-slot{width:3.4em!important;justify-content:flex-start;margin-left:.04em;margin-right:0}
.diapo.numberline-mode .question{margin-bottom:0}
.diapo.numberline-mode .question svg{display:block;width:100%;max-width:700px!important;height:auto;margin:0 auto}
.diapo.numberline-mode .footer{margin-top:0;position:relative;top:2px;font-size:clamp(2.1rem,4.7vw,4.95rem)}
.diapo.numberline-mode .footer .math-display{transform:translateX(.8em)}
.number-line-placement-prompt,.number-line-step-prompt,.number-line-choice-prompt{font-size:clamp(1.55rem,2.65vw,2.75rem);font-weight:850;line-height:1.15;margin:0 auto 4px}
.number-line-placement-prompt em,.number-line-choice-prompt em{color:#2563a6;font-family:Georgia,"Times New Roman",serif;font-size:1.12em}
.number-line-placement-prompt strong,.number-line-choice-prompt strong{color:#9a4100}
.number-line-placement-shell,.number-line-readonly{position:relative;width:min(100%,760px);margin:0 auto}
.number-line-placement-svg{display:block;width:100%;height:auto;margin:0 auto;overflow:visible}.number-line-placement-svg text{user-select:none}.number-line-point-hit,.number-line-tick-hit{cursor:pointer}.number-line-point-hit{cursor:grab;touch-action:none}.number-line-placement-svg.is-dragging .number-line-point-hit{cursor:grabbing}.number-line-point-visual{transform-box:fill-box;transform-origin:center;transition:transform .14s ease}.number-line-placement-svg.is-dragging .number-line-point-visual{transform:translateY(-34px)}.number-line-drag-ghost{stroke:#e86100;stroke-width:3;stroke-linecap:round;opacity:.75;pointer-events:none}.number-line-point.is-selected .number-line-point-grip{fill:#fff1df;stroke:#e86100}.number-line-chosen-ghost{pointer-events:none}.number-line-chosen-ghost line{stroke:#e86100;stroke-width:4;stroke-linecap:round;stroke-dasharray:5 4}.number-line-chosen-ghost text{fill:#b44800;font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:22px;text-anchor:middle}
.number-line-reset{display:block;min-width:126px;min-height:44px;margin:-12px auto 0;padding:8px 16px;border:1.5px solid #aac3df;border-radius:12px;background:#f4f8fd;color:#11468c;font:800 .95rem Arial,sans-serif;cursor:pointer}.number-line-reset:hover{background:#eaf2fb}.number-line-reset:focus-visible,.number-line-point-hit:focus-visible,.number-line-tick-hit:focus-visible{outline:3px solid #e86100;outline-offset:3px}
.number-line-step-options{grid-template-columns:repeat(4,minmax(0,1fr));max-width:780px;margin:0 auto;gap:9px}.number-line-step-options .opt{min-height:58px;padding:9px 12px;font-size:clamp(1.2rem,2vw,1.85rem)}.number-line-step-correction{max-width:760px;margin:7px auto 0;padding:7px 12px;border-radius:10px;background:#eef8f7;color:#075c43;font-size:clamp(.98rem,1.4vw,1.25rem);font-weight:800}
.number-line-choice-options{display:grid;grid-template-columns:1fr;gap:7px;width:min(100%,780px);margin:4px auto 0}.number-line-choice-options .number-line-choice{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;min-height:0;padding:4px 10px;text-align:left}.number-line-choice-options .number-line-choice>strong{font-size:1.05rem}.number-line-choice-visual{display:block;min-width:0}.number-line-choice-visual svg{display:block;width:100%;height:auto;max-height:84px}.number-line-choice.correct .number-line-point-mark{stroke:#087a55}.number-line-choice.correct .number-line-point-letter{fill:#087a55}
.diapo.solids-mode .stage{align-items:center;padding:12px 24px 16px}
.diapo.solids-mode .slide{max-width:1040px}
.solid-prompt{font-size:clamp(1.85rem,2.8vw,3rem);font-weight:850;line-height:1.12;margin:0 auto 5px}
.solid-visual{display:flex;align-items:center;justify-content:center;width:390px;max-width:100%;height:clamp(240px,35vh,330px);margin:0 auto}
.solid-visual .solid-svg{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain}
.solid-emoji{font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;font-size:clamp(8rem,22vh,12rem);line-height:1;filter:drop-shadow(0 5px 7px rgba(16,36,74,.15))}
.solid-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;margin:5px auto 0;max-width:860px}
.solid-options .opt{min-height:62px;padding:13px 16px;border-radius:14px;font-size:clamp(1.16rem,1.7vw,1.6rem)}
.diapo.perimeter-mode .stage{align-items:center;padding:8px 22px 16px;overflow:auto}
.diapo.perimeter-mode .slide{max-width:1100px}
.perimeter-prompt{font-size:clamp(1.65rem,2.55vw,2.8rem);font-weight:850;line-height:1.13;margin:0 auto 3px}
.perimeter-prompt>div{margin-left:auto!important;margin-right:auto!important;text-align:center!important}
.perimeter-prompt svg{display:block;width:auto;max-width:100%;height:clamp(230px,35vh,325px);max-height:325px;margin:2px auto}
.diapo.perimeter-mode.correction-visible .perimeter-prompt svg{height:clamp(185px,27vh,250px);max-height:250px}
.perimeter-correction-flow,.volume-correction-flow{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;margin:3px auto 0}
.perimeter-formula,.volume-formula{color:#17384d;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.35rem,2vw,2.05rem);font-weight:800;line-height:1.15}
.perimeter-calculation,.volume-calculation{max-width:900px;padding:3px 9px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.25rem,1.85vw,1.85rem);font-weight:750;line-height:1.2;text-align:center}
.perimeter-answer,.volume-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2rem,3.6vw,3.85rem);margin:4px auto 0}
.diapo.area-mode .stage{align-items:center;padding:12px 24px 18px}
.diapo.area-mode .slide{max-width:1080px}
.area-prompt{font-size:clamp(1.9rem,3vw,3.2rem);font-weight:850;line-height:1.14;margin:0 auto 5px}
.area-main{height:clamp(285px,41vh,370px);display:flex;align-items:center;justify-content:center;margin:0 auto}
.area-visual{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.area-visual .area-svg{width:auto;max-width:100%;height:100%;max-height:100%;margin:auto}
.area-data{max-width:820px;padding:22px 28px;border:2px solid var(--border);border-radius:16px;background:#f8fbff;font-size:clamp(1.45rem,2.2vw,2.25rem);font-weight:700;line-height:1.35}
.area-help{display:flex;align-items:center;justify-content:center;min-height:0;margin:2px auto 5px;color:#17384d;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.35rem,2vw,2rem);font-weight:750}
.area-help .math-display{white-space:normal}
.area-answer-line{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.45rem,4.4vw,4.7rem);font-weight:800;margin:4px auto 0}
.area-answer-line .answer-dots{display:inline-block;min-width:2.2em}
.area-answer-value{color:var(--answer);font-weight:900}
.area-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;margin:4px auto 0;max-width:820px}
.area-options .opt{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.15rem,1.65vw,1.55rem);padding:11px 14px}
.area-correction-flow{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;margin:4px auto 0}
.area-correction{max-width:790px;margin:7px auto 0;padding:4px 10px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.25rem,1.85vw,1.85rem);font-weight:750;line-height:1.25;text-align:center}
.area-correction .math-display{white-space:normal}
.diapo.area-mode.correction-visible .area-main{height:clamp(205px,30vh,275px)}
.diapo.volume-mode .stage{align-items:center;padding:10px 22px 17px;overflow:auto}
.diapo.volume-mode .slide{max-width:1100px}
.volume-question{display:flex;flex-direction:column;align-items:center;width:100%}
.volume-prompt{font-size:clamp(1.7rem,2.55vw,2.85rem);font-weight:850;line-height:1.14;margin:0 auto 4px}
.volume-visual{display:flex;align-items:center;justify-content:center;width:min(100%,460px);height:clamp(260px,38vh,345px);margin:0 auto}
.volume-visual .solid-svg{display:block;width:100%;height:100%;max-width:100%;max-height:100%}
.volume-data{max-width:880px;margin:1px auto 3px;font-size:clamp(1.2rem,1.75vw,1.7rem);font-weight:800;line-height:1.2}
.volume-response-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;width:min(100%,980px);min-height:150px;margin:4px auto 0;padding:0 12px}
.volume-correction-flow{gap:8px;width:100%;margin:0 auto;padding:0 12px}
.volume-formula{min-height:0;margin:0 auto;font-size:clamp(2rem,3.1vw,3.2rem)}
.volume-calculation{font-size:clamp(1.75rem,2.75vw,2.75rem);padding:5px 12px}
.volume-calculation .math-display{white-space:normal}
.volume-result{color:var(--answer);font-weight:950}
.volume-answer{font-size:clamp(3rem,5vw,5.2rem);margin:0}
.diapo.average-mode .stage{align-items:center;padding:10px 20px 16px}
.diapo.average-mode .slide{max-width:1120px}
.average-prompt{font-size:clamp(1.7rem,2.35vw,2.45rem);font-weight:850;line-height:1.14;margin:0 auto 6px}
.average-instruction{font-size:clamp(1.2rem,1.8vw,1.75rem);font-weight:750;line-height:1.2;margin:7px auto 3px}
.average-data-line{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.8rem,3vw,3rem);font-weight:750;margin:5px auto}
.average-table-wrap{display:flex;justify-content:center;margin:8px auto 6px;max-width:100%;overflow-x:auto}
.average-table{border-collapse:collapse;text-align:center;font-size:clamp(1.12rem,1.62vw,1.5rem);font-weight:750;background:#fff}
.average-table th,.average-table td{border:2px solid #60708c;padding:13px 20px;white-space:nowrap}
.average-table th{background:#f3f7fd;font-weight:850}
.average-help-visual{height:clamp(190px,31vh,270px);display:flex;align-items:center;justify-content:center;margin:2px auto 0}
.average-help-visual .average-svg{display:block;width:auto;max-width:100%;height:auto;max-height:100%}
.average-answer-line{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.8rem,3.2vw,3.25rem);font-weight:800;margin:7px auto 0}
.average-answer-line .answer-dots{display:inline-block;min-width:2em}
.average-answer-value{color:var(--answer);font-weight:900}
.average-options{gap:10px 14px;margin:10px auto 0;max-width:900px}
.average-options .opt{font-size:clamp(1.05rem,1.45vw,1.4rem);padding:12px 15px;border-radius:14px}
.average-options.options-3{grid-template-columns:repeat(3,minmax(0,1fr));max-width:1040px}
.average-formula-options{grid-template-columns:repeat(2,minmax(0,1fr))!important;max-width:1000px;gap:9px 12px}
.average-formula-options .opt{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.14rem,1.55vw,1.48rem);padding:10px 13px;overflow:hidden}
.average-formula-options .math-display{white-space:normal}
.average-correction{max-width:980px;margin:16px auto 0;padding:0 10px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.45rem,2.15vw,2.05rem);font-weight:700;line-height:1.35;text-align:center}
.average-correction>div{display:block;text-align:center;padding:6px 0}
.average-correction .math-display{white-space:normal}
.average-step{display:block;font-family:Arial,Helvetica,sans-serif;font-size:.58em;color:var(--muted);font-weight:850;text-align:center;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
.diapo.median-mode .slide{max-width:1220px}
.diapo.median-mode .question{margin-bottom:16px}
.diapo.median-mode .options{margin-top:16px}
.median-list{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.16em .42em;max-width:100%;margin:16px auto 18px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2rem,3.2vw,3.4rem);font-weight:700;line-height:1.2}
.median-value,.median-separator{display:inline-flex;align-items:center;white-space:nowrap}.median-value .math-display{white-space:nowrap}
.median-separator{color:var(--muted);font-weight:700}
.median-table-wrap{display:block;max-width:100%;margin:18px auto;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
.median-table{width:max-content;max-width:none;margin:0 auto;border-collapse:collapse;text-align:center;font-size:clamp(1.4rem,2.15vw,2.15rem);font-weight:700;background:#fff}
.median-table td{border:2px solid #60708c;padding:clamp(8px,1vw,14px) clamp(12px,1.5vw,24px);white-space:nowrap}
.diapo.proportion-mode .stage{align-items:center;padding:10px 20px 16px}
.diapo.proportion-mode .slide{max-width:1180px}
.proportion-prompt{font-size:clamp(1.6rem,2.35vw,2.65rem);font-weight:850;line-height:1.16;margin:0 auto 7px}
.proportion-help{display:flex;align-items:center;justify-content:center;width:100%;margin:2px auto 3px}
.proportion-line{display:block;width:min(100%,960px);height:auto;margin:0 auto}
.proportion-line-mobile{display:none}
.diapo.proportion-table-mode .proportion-line-desktop{width:min(100%,820px)}
.proportion-answer{font-size:clamp(2rem,3.5vw,3.7rem);margin-top:5px}
.proportion-options{margin-top:10px}
.proportion-table-wrap{display:flex;align-items:center;justify-content:center;gap:14px;max-width:100%;margin:14px auto;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
.proportion-table{width:max-content;margin:0 auto;border-collapse:collapse;text-align:center;font-size:clamp(1.35rem,2.05vw,2rem);font-weight:700;background:#fff}
.proportion-table td{border:2px solid #60708c;padding:14px 20px;white-space:nowrap}
.proportion-table-answer{color:var(--answer);font-weight:900}
.proportion-table-methods{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:7px;flex:none;color:#17283f;font-family:Arial,Helvetica,sans-serif;font-size:clamp(.92rem,1.35vw,1.2rem);font-weight:850;white-space:nowrap}
.proportion-table-method{display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 9px;border:1.5px solid #c8d8e9;border-radius:10px;background:#f8fbff}
.proportion-table-horizontal{display:grid;grid-template-rows:repeat(2,auto);gap:4px;text-align:left}
.proportion-table-down{font-size:2.1em;line-height:1;color:#17283f}
.proportion-bare-table{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.8rem,2.8vw,2.8rem)}
.proportion-bare-table td{min-width:150px;padding:16px 32px}
.legacy-statement-question{display:block;width:100%;min-width:0;max-width:100%;overflow:visible}.legacy-statement-question>.math-inline{display:block;width:100%;min-width:0;white-space:normal}.legacy-statement-table-wrap{display:block;width:100%;min-width:0;max-width:100%;margin:clamp(16px,2.2vh,26px) auto clamp(20px,2.7vh,32px);overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;contain:inline-size}.legacy-statement-table-wrap .legacy-statement-table{width:max-content;margin:0 auto!important}
.slide .question table{max-width:100%;margin-left:auto!important;margin-right:auto!important;line-height:1.2}
.slide .question table td,.slide .question table th{padding:17px 26px!important;border-width:2px!important}
.diapo.coordinate-mode .stage{padding:6px 10px 10px}
.diapo.coordinate-mode .question{font-size:clamp(1.65rem,2.6vw,2.75rem);line-height:1.12;margin-bottom:5px}
.diapo.coordinate-mode .question svg{display:block;width:min(100%,500px)!important;max-width:500px!important;max-height:min(54vh,430px)!important;margin:5px auto!important}
.diapo.coordinate-mode .footer{font-size:clamp(2rem,3.45vw,3.65rem);margin-top:5px}
.coordinate-pairs-response{display:flex;align-items:center;justify-content:center;gap:18px 56px;width:100%;max-width:960px;margin:0 auto}
.coordinate-pair{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}
.coordinate-placement-task{display:flex;flex-direction:column;align-items:center;width:100%}
.coordinate-placement-prompt,.coordinate-claim-prompt{font-size:clamp(1.45rem,2.35vw,2.35rem)!important;margin-bottom:3px!important}
.coordinate-point-selectors{display:flex;justify-content:center;gap:8px;margin:2px auto 1px}
.coordinate-point-selector,.coordinate-placement-reset{min-height:44px;padding:8px 16px;border:2px solid #9fb9d8;border-radius:12px;background:#fff;color:#0b3570;font-size:1rem;font-weight:850;cursor:pointer;touch-action:manipulation}
.coordinate-point-selector.is-active{border-color:#e86100;background:#fff4e9;color:#9a4100;box-shadow:0 0 0 3px rgba(232,97,0,.12)}
.coordinate-placement-shell,.coordinate-claim-visual{display:grid;place-items:center;width:100%;margin:0 auto}
.coordinate-placement-svg,.coordinate-claim-visual svg{display:block;width:min(100%,500px)!important;max-width:500px!important;max-height:min(50vh,410px)!important;margin:0 auto!important;touch-action:manipulation}
.coordinate-grid-hit{cursor:pointer;pointer-events:all}
.coordinate-grid-hit:focus{outline:none;stroke:#e86100;stroke-width:3;fill:rgba(255,122,26,.12)}
.coordinate-selected-point text{font-family:Georgia,serif;font-size:21px;font-style:italic;font-weight:800}
.coordinate-placement-reset{min-height:40px;margin:-2px auto 0;padding:7px 14px;border-width:1.5px;font-size:.9rem}
.coordinate-claim-options{grid-template-columns:repeat(2,minmax(0,1fr));max-width:520px;gap:10px;margin-top:4px}
.coordinate-claim-options .opt{min-height:58px;padding:11px 14px;font-size:clamp(1.15rem,1.8vw,1.55rem)}
.coordinate-claim-correction{margin:7px auto 0;color:#087a55;font-size:clamp(1.05rem,1.55vw,1.35rem);font-weight:850}
.diapo.transformations-mode .stage{padding:6px 10px 11px}
.diapo.transformations-mode .slide{max-width:1180px}
.diapo.transformations-mode .question{font-size:clamp(1.55rem,2.45vw,2.65rem);line-height:1.12;margin-bottom:5px}
.diapo.transformations-mode .question svg{display:block;width:min(100%,590px)!important;max-width:590px!important;max-height:min(52vh,430px)!important;margin:5px auto!important}
.diapo.transformations-mode .footer{font-size:clamp(1.9rem,3.25vw,3.45rem);margin-top:5px}
.diapo.transformations-mode .options{max-width:920px;gap:9px 13px;margin-top:7px}
.diapo.transformations-mode .opt{font-size:clamp(1.05rem,1.55vw,1.5rem);padding:11px 14px}
.diapo.right-angle-mode .stage>.slide{margin-top:auto;margin-bottom:auto}
.diapo.right-angle-mode .question{font-size:clamp(2.7rem,5vw,5.25rem);line-height:1.12;margin-bottom:32px}
.diapo.right-angle-mode .footer{font-size:clamp(2.8rem,5.2vw,5.4rem)}
.diapo.geometry-choice-mode .stage{align-items:center;padding:8px 18px 13px}
.diapo.geometry-choice-mode .slide{max-width:1160px}
.diapo.geometry-choice-mode .question{margin:0 auto 4px;font-size:clamp(1.75rem,2.8vw,3.05rem);line-height:1.1}
.diapo.geometry-choice-mode .question svg{display:block;width:min(100%,470px)!important;max-width:470px!important;max-height:350px!important;margin:3px auto!important}
.diapo.geometry-choice-mode .options{gap:10px 14px;margin-top:6px;max-width:1060px}
.diapo.geometry-choice-mode .opt{min-height:64px;display:flex;align-items:center;padding:14px 17px;font-size:clamp(1.18rem,1.75vw,1.72rem);border-radius:15px}
.diapo.angles-mode .stage{align-items:center;padding:7px 18px 12px}
.diapo.angles-mode .slide{max-width:1180px}
.diapo.angles-mode .question{font-size:clamp(2.15rem,3.55vw,3.85rem);line-height:1.12;margin:0 auto 12px;text-align:center}
.diapo.angles-mode .question svg{width:min(100%,540px)!important;max-width:540px!important;max-height:345px!important;margin:5px auto!important}
.diapo.angles-mode .options{max-width:1080px;margin-top:11px}
.diapo.angles-mode .opt{min-height:68px;padding:15px 18px;font-size:clamp(1.25rem,1.85vw,1.8rem)}
.diapo.angles-mode .footer{margin-top:10px;font-size:clamp(2.45rem,4.35vw,4.65rem)}
.angle-prompt{font-size:clamp(2rem,3.2vw,3.45rem)!important;margin-bottom:7px!important}
.angle-question-visual{display:flex;align-items:center;justify-content:center;width:min(100%,800px);margin:0 auto 4px}
.angle-question-visual .angle-vocabulary-svg{display:block;width:100%;height:auto;max-height:340px}
.angle-options.options-compact{grid-template-columns:repeat(2,minmax(0,1fr))}
.angle-options-long .opt{justify-content:flex-start;text-align:left;font-size:clamp(1.02rem,1.45vw,1.36rem)}
.angle-figure-options{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px!important;max-width:980px!important}
.angle-figure-option{display:flex!important;flex-direction:column;align-items:stretch!important;min-height:0!important;padding:8px!important}
.angle-figure-option>strong{align-self:flex-start}
.angle-figure-option .angle-vocabulary-svg{display:block;width:100%;height:auto;max-height:175px}
.angle-answer{font-size:clamp(2.5rem,4.6vw,4.8rem)!important}
.diapo.dense-mode .stage{padding:8px 16px 12px}
.diapo.dense-mode .stage>.slide{margin-top:0;margin-bottom:0}
.diapo.dense-mode .question{margin-bottom:9px;font-size:clamp(1.35rem,2.25vw,2.45rem);line-height:1.1}
.diapo.dense-mode .question svg{width:auto;max-width:100%;max-height:285px;margin:4px auto}
.diapo.dense-mode .footer{margin-top:8px;font-size:clamp(1.55rem,2.8vw,3rem)}
.diapo.dense-mode .options{gap:8px 12px;margin-top:10px}
.diapo.dense-mode .opt{padding:10px 12px;font-size:clamp(1rem,1.45vw,1.45rem);border-radius:14px}
.diapo.read-data-mode .stage{padding:10px 22px 14px}
.diapo.read-data-mode .stage>.slide{width:100%;max-width:1180px;margin-top:auto;margin-bottom:auto}
.diapo.read-data-mode .question{margin-bottom:9px;font-size:clamp(1.42rem,2.3vw,2.5rem);line-height:1.12}
.diapo.read-data-mode .question svg{display:block;width:auto;max-width:100%;max-height:285px;margin:5px auto}
.diapo.read-data-mode .question table{font-size:clamp(1rem,1.5vw,1.32rem)!important}
.diapo.read-data-mode .question table td,.diapo.read-data-mode .question table th{padding:13px 17px!important}
.diapo.read-data-mode .options{width:min(100%,1120px);max-width:1120px;gap:12px 16px;margin-top:11px}
.diapo.read-data-mode .opt{display:flex;align-items:center;justify-content:center;min-height:68px;padding:14px 18px;border-radius:15px;text-align:center;font-size:clamp(1.18rem,1.75vw,1.72rem);line-height:1.2}
.diapo.read-data-mode .footer{margin-top:8px;font-size:clamp(1.75rem,3vw,3.15rem)}
.diapo.recognize-proportion-mode .stage{align-items:center;padding:10px 22px 14px}
.diapo.recognize-proportion-mode .stage>.slide{width:100%;max-width:1120px;margin-top:auto;margin-bottom:auto}
.diapo.recognize-proportion-mode .question{max-width:1000px;margin:0 auto 9px;font-size:clamp(1.42rem,2.3vw,2.5rem);line-height:1.13;text-align:center}
.diapo.recognize-proportion-mode .question svg{display:block;width:min(100%,520px)!important;max-width:520px!important;max-height:min(36vh,310px)!important;margin:6px auto 2px!important}
.diapo.recognize-proportion-mode .question table{font-size:clamp(1.08rem,1.55vw,1.38rem)!important}
.diapo.recognize-proportion-mode .question table td,.diapo.recognize-proportion-mode .question table th{padding:14px 18px!important}
.diapo.recognize-proportion-mode .legacy-statement-table-wrap{margin:12px auto 14px}
.diapo.recognize-proportion-mode .options{width:min(100%,980px);max-width:980px;gap:12px 16px;margin-top:12px}
.diapo.recognize-proportion-mode .opt{display:flex;align-items:center;justify-content:center;min-height:66px;padding:14px 18px;border-radius:15px;text-align:center;font-size:clamp(1.12rem,1.65vw,1.62rem);line-height:1.18}
.diapo.recognize-proportion-mode .footer{margin-top:7px;font-size:clamp(1.75rem,3vw,3.15rem)}
.read-data-aid-caption,.read-data-aid-placeholder,.read-data-touch-panel{width:min(100%,920px);min-height:48px;margin:9px auto 0!important}
.read-data-aid-caption{display:flex;align-items:center;justify-content:center;padding:8px 13px;border:2px solid #f2a65a;border-radius:13px;background:#fff8ed;color:#27364d;font-size:clamp(.92rem,1.35vw,1.16rem);font-weight:650;line-height:1.22;text-align:center}
.read-data-aid-caption strong{color:#a74400;font-weight:900}.read-data-aid-placeholder .btn{min-height:44px;padding:8px 15px}
.read-data-touch-panel{display:grid;align-items:stretch}.read-data-touch-panel>*{grid-area:1/1;margin:0!important}.read-data-touch-instruction{display:flex;align-items:center;justify-content:center;padding:8px 13px;border:2px dashed #86a8cf;border-radius:13px;background:#f2f7fd;color:#174b78;font-size:clamp(.92rem,1.35vw,1.16rem);font-weight:850;line-height:1.22;text-align:center}.read-data-touch-caption{visibility:hidden;opacity:0;transition:opacity .18s ease}.read-data-touch-root.is-complete .read-data-touch-instruction{visibility:hidden;opacity:0}.read-data-touch-root.is-complete .read-data-touch-caption{visibility:visible;opacity:1}
.read-data-touch-root [data-read-data-choice]{cursor:pointer;touch-action:manipulation;transition:background-color .15s ease,box-shadow .15s ease,color .15s ease}.read-data-touch-root [data-read-data-choice]:focus-visible{outline:3px solid #ff7a1a;outline-offset:3px}.read-data-touch-root tr[data-read-data-choice]:focus-visible{outline-offset:-3px}.read-data-touch-root tr.is-picked>*,.read-data-touch-root td.is-picked{background:#e7f6ff!important;color:#075985!important;font-weight:900;box-shadow:inset 0 0 0 3px #38a3db}.read-data-touch-root.is-complete [data-read-data-highlight="label"]{background:#fff0d6!important;color:#8a3c00!important;font-weight:900;box-shadow:inset 0 0 0 3px #f2a65a}.read-data-touch-root.is-complete [data-read-data-highlight="focus"]{position:relative;background:#e7f6ff!important;color:#075985!important;font-weight:900;box-shadow:inset 0 0 0 3px #38a3db}.read-data-touch-root.is-complete [data-read-data-highlight="compare"]{background:#eef7ff!important;color:#075985!important;font-weight:900;box-shadow:inset 0 0 0 2px #76bce2}
@keyframes read-data-miss{0%,100%{transform:translateX(0)}35%{transform:translateX(-4px)}70%{transform:translateX(4px)}}.read-data-touch-root tr.is-miss>*,.read-data-touch-root td.is-miss{animation:read-data-miss .26s ease;box-shadow:inset 0 0 0 3px #f2a65a}
.read-data-pictogram-question table{font-size:clamp(1.25rem,1.9vw,1.68rem)!important}.diapo.read-data-mode .read-data-pictogram-question table td{padding:15px 24px!important}.read-data-star-group{display:inline-flex;align-items:flex-start;justify-content:center;gap:clamp(12px,1.6vw,22px);min-width:190px}.read-data-star-item{display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-start;line-height:1}.read-data-star{color:#e86100;font-size:1.35em}.read-data-star-value{min-height:1em;margin-top:4px;color:#075985;font-size:.72em;font-weight:950;opacity:0;transition:opacity .18s ease}.read-data-touch-root.is-complete .read-data-star-value{opacity:1}
.diapo.interactive-mode.read-data-observation-pending .answer-dock,.diapo.interactive-mode.read-data-observation-pending .read-data-touch-root~.options{visibility:hidden}
.read-data-guided-question svg .read-data-scale-axis{stroke:#222;stroke-width:1.5}.read-data-guided-question svg .read-data-scale-grid{stroke:#ccc;stroke-width:1}.read-data-guided-question svg .read-data-scale-label{fill:#111;font-weight:400}.read-data-guided-question svg .read-data-focus-mark{stroke:#e86100!important;stroke-width:4!important;filter:drop-shadow(0 2px 2px rgba(232,97,0,.24))}.read-data-guided-question svg .read-data-compare-mark{stroke:#0b79d0!important;stroke-width:3!important}.read-data-guided-question svg .read-data-focus-point{stroke:#ffb454!important;stroke-width:7!important;paint-order:stroke;filter:drop-shadow(0 1px 1px rgba(130,58,0,.28))}.read-data-guided-question svg .read-data-compare-point{stroke:#91d0f4!important;stroke-width:6!important;paint-order:stroke}.read-data-guided-question svg text.read-data-focus-label{fill:#b54708!important;font-weight:900}.read-data-guided-question svg text.read-data-compare-label{fill:#075985!important;font-weight:800}.read-data-guided-question svg .read-data-guide-line{stroke:#e86100;stroke-width:2.5;stroke-dasharray:7 5;pointer-events:none}.read-data-guided-question svg .read-data-guide-line-soft{stroke:#0b79d0;stroke-width:1.75;stroke-dasharray:5 5;opacity:.72}.read-data-guided-question svg .read-data-pie-sector{fill:#ffd58a;fill-opacity:.72;stroke:none;pointer-events:none}
.diapo.thales-mode .stage{padding:7px 18px 11px}
.diapo.thales-mode .slide{max-width:1120px}
.diapo.thales-mode .question{margin-bottom:6px;font-size:clamp(1.42rem,2.2vw,2.3rem);line-height:1.12}
.diapo.thales-mode .thales-question-figure{width:min(100%,520px);margin:3px auto 5px}
.diapo.thales-mode .thales-question-figure svg{display:block;width:100%;height:auto;max-height:280px}
.diapo.thales-mode .options{gap:8px 12px;margin-top:7px}
.diapo.thales-mode .opt{min-height:56px;padding:10px 13px;font-size:clamp(1rem,1.45vw,1.42rem);border-radius:13px}
.diapo.thales-mode .footer{margin-top:6px;font-size:clamp(1.65rem,2.8vw,2.85rem)}
.thales-task-card{display:flex;flex-direction:column;align-items:center;gap:7px;width:min(100%,940px);margin:0 auto;padding:15px 18px 13px;border:2px solid #d8e3f4;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f5f9ff);box-shadow:0 6px 18px rgba(11,33,71,.05)}
.thales-task-kicker{display:inline-flex;align-items:center;justify-content:center;padding:5px 12px;border-radius:999px;background:#fff0df;color:#9a4100;font-size:.62em;font-weight:900;letter-spacing:.015em}
.thales-task-condition{color:#35526e;font-size:.73em;font-weight:800}
.thales-task-target{font-size:.8em;font-weight:800}.thales-task-target strong{color:#087a55}
.thales-task-question{font-size:.94em;font-weight:900;color:#0b2147}
.thales-facts{display:flex;flex-wrap:wrap;align-items:stretch;justify-content:center;gap:7px;width:100%}
.thales-fact{display:inline-flex;align-items:baseline;justify-content:center;gap:.28em;min-width:135px;padding:7px 10px;border:1.5px solid #c9d9ed;border-radius:11px;background:#fff;font-size:.72em;font-weight:800}.thales-fact b{color:#35526e}.thales-fact b::after{content:' ='}.thales-fact strong{color:#0b2147}
.thales-result-comparison{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;font-size:1.06em}.thales-result-comparison>span:not(.thales-fact){color:#60708c;font-size:.68em;font-weight:800}.thales-result-comparison .thales-fact{font-size:.78em}
.diapo.thales-structured-mode .slide{max-width:1040px}.diapo.thales-structured-mode .question{margin-bottom:7px}.diapo.thales-structured-mode .options{max-width:1000px}
.diapo.data-mode .stage{padding:6px 18px 10px}
.diapo.data-mode .slide{max-width:1160px}
.diapo.data-mode .question{margin-bottom:9px;font-size:clamp(1.7rem,2.75vw,3rem);line-height:1.12}
.diapo.data-mode .question table{font-size:clamp(1.05rem,1.6vw,1.35rem)!important}
.diapo.data-mode .question table td,.diapo.data-mode .question table th{padding:14px 18px!important}
.diapo.data-mode .footer{margin-top:8px;font-size:clamp(2rem,3.2vw,3.45rem)}
.diapo.algorithm-mode .question{font-size:clamp(1.25rem,1.85vw,2rem);line-height:1.08}
.diapo.algorithm-mode .question svg{max-height:165px!important;width:auto!important;margin:2px auto!important}
.diapo.algorithm-mode .question div+br+div svg{max-height:110px!important}
.interactive-summary{display:none;align-items:center;justify-content:center;color:#073a75;font-size:1rem;font-weight:900;white-space:nowrap}
.interactive-score{display:none;padding:7px 11px;border:1px solid #c7d8ed;border-radius:999px;background:#eef5fd;color:#087a55;font-size:1rem;font-weight:900;white-space:nowrap}
.interactive-summary[hidden],.interactive-score[hidden]{display:none!important}
.interactive-input-slot{display:inline-grid;place-items:center;min-width:2.15em;min-height:1.28em;margin:0 .06em;padding:.02em .18em;border:2px solid #9fb9d8;border-radius:.24em;background:#fff;color:#073a75;font:inherit;font-weight:900;line-height:1;vertical-align:middle;cursor:pointer;box-shadow:0 .08em .16em rgba(7,58,117,.08);touch-action:manipulation}
.interactive-input-slot.is-empty{color:#8798ad}.interactive-input-slot.active{border-color:#e86100;background:#fff7ed;box-shadow:0 0 0 3px rgba(232,97,0,.13)}
.frac .interactive-input-slot{min-width:1.65em;min-height:1.12em;margin:.02em;padding:0 .12em;border-width:1.5px;border-radius:.18em}
.interactive-fraction-response{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif}.interactive-fraction-response .frac-num{border-bottom-width:3px}
.interactive-response-fallback{display:flex;align-items:center;justify-content:center;gap:.2em;margin:10px auto 0;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2rem,3.5vw,3.7rem);font-weight:800}
.interactive-polynomial-response{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:9px 14px;margin:10px auto 0;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.25rem,4.4vw,4.7rem);font-weight:850}
.interactive-polynomial-response.term-count-1{font-size:clamp(3rem,5.6vw,5.8rem)}.interactive-polynomial-response.term-count-2{font-size:clamp(2.55rem,5vw,5.2rem)}
.interactive-polynomial-term{display:inline-flex;align-items:center;gap:.12em;white-space:nowrap}.interactive-polynomial-separator{margin:0 -.08em;font-family:Arial,Helvetica,sans-serif;font-weight:750}
.interactive-algebra-template-response{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.08em;margin:4px auto 0;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.25rem,4.6vw,4.8rem);font-weight:850;line-height:1.18}
.interactive-expand-source{white-space:nowrap}.interactive-expand-result{display:inline-flex;align-items:center;justify-content:center;gap:.08em;white-space:nowrap}
.interactive-expand-answer{width:100%;font-family:inherit}.interactive-expand-answer>.interactive-polynomial-response,.interactive-expand-answer>.interactive-algebra-template-response{margin:0 auto}
.relative-token-prompt{font-size:clamp(1.75rem,3.7vw,3.55rem);line-height:1.14;margin:0 auto 16px}.relative-token-board,.relative-token-static-board{width:min(100%,1040px);margin:0 auto;text-align:center}.relative-token-zone{min-height:112px;margin:10px auto;padding:10px 12px;border:1px dashed #b7cbe3;border-radius:14px;background:#fbfdff}.relative-token-zone h3{margin:0 0 8px;color:#073a75;font-size:clamp(1rem,1.75vw,1.3rem);font-weight:900}.relative-token-zone-a,.relative-token-zone-b{display:inline-flex;width:calc(50% - 8px);vertical-align:top;flex-direction:column}.relative-token-zone-result{min-height:122px;border-color:#86a8cf;background:#f4f8fe}.relative-token-list{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;min-height:58px}.relative-token{display:inline-grid;place-items:center;width:54px;height:54px;min-width:54px;border:2px solid #111;border-radius:50%;color:#111;font-size:1.18rem;font-weight:900;line-height:1;box-shadow:0 2px 0 rgba(11,33,71,.12)}.relative-token-positive{background:#31a98e}.relative-token-negative{background:#ef5142}button.relative-token{cursor:pointer;touch-action:manipulation}.relative-token:active{transform:translateY(1px);box-shadow:none}.relative-token.is-null-pair{box-shadow:0 0 0 4px #f59e0b,0 2px 0 rgba(11,33,71,.12)}.relative-token-empty{display:inline-grid;place-items:center;min-width:54px;height:54px;color:#60708c;font-size:1.5rem}.relative-token-instruction{margin:12px auto 8px;color:#405875;font-size:clamp(1rem,1.8vw,1.28rem);font-weight:750;line-height:1.25}.relative-token-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:8px auto 0}.relative-token-action{min-height:46px;padding:9px 14px;border:1px solid #9fb9d8;border-radius:11px;background:#fff;color:#073a75;font-size:1rem;font-weight:850;cursor:pointer;touch-action:manipulation}.relative-token-result{margin:14px auto 0;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.7rem,3.2vw,3.1rem);font-weight:800}.relative-token-result strong{color:var(--answer)}.relative-token-placeholder{min-height:86px}
@media(max-width:800px){.relative-token-prompt{font-size:clamp(1.45rem,7vw,2.15rem);margin-bottom:8px}.relative-token-zone{min-height:96px;margin:7px auto;padding:8px 7px;border-radius:12px}.relative-token-zone-a,.relative-token-zone-b{width:calc(50% - 4px)}.relative-token-zone h3{font-size:.92rem;margin-bottom:5px}.relative-token-list{gap:5px;min-height:50px}.relative-token{width:46px;height:46px;min-width:46px;font-size:1.02rem}.relative-token-empty{min-width:46px;height:46px}.relative-token.is-null-pair{box-shadow:0 0 0 3px #f59e0b,0 2px 0 rgba(11,33,71,.12)}.relative-token-instruction{margin:8px auto 5px;font-size:.95rem}.relative-token-actions{margin-top:5px}.relative-token-action{min-height:44px;padding:8px 10px;font-size:.92rem}.relative-token-result{margin-top:9px;font-size:clamp(1.45rem,7vw,2.1rem)}}
@media(min-width:801px){.diapo.interactive-mode .stage{padding:6px 18px 10px}.diapo.interactive-mode .question svg{max-height:255px;width:auto;margin-left:auto;margin-right:auto}}
@media(min-width:801px) and (max-height:760px){.diapo.interactive-mode.module01-mode .module01-prompt{font-size:clamp(2rem,3vw,2.7rem);margin-bottom:4px}.diapo.interactive-mode.module01-mode .module01-source{font-size:clamp(2.45rem,4vw,3.75rem);margin:1px auto 3px}.diapo.interactive-mode.module01-mode .module01-visual{margin:3px auto 2px}.diapo.interactive-mode.module01-mode .module01-visual svg{width:auto;max-width:100%;max-height:220px}.diapo.interactive-mode.module01-mode .module01-options .opt{padding:9px 14px}.diapo.interactive-mode.median-mode .question{font-size:clamp(1.9rem,3.3vw,2.85rem);line-height:1.12;margin-bottom:10px}.diapo.interactive-mode.median-mode .options{gap:10px 14px;margin-top:10px}.diapo.interactive-mode.median-mode .opt{padding:13px 16px;font-size:clamp(1.15rem,1.7vw,1.55rem)}.diapo.interactive-mode.angle-sum-mode .angle-sum-prompt{font-size:clamp(1.65rem,2.4vw,2.15rem);margin-bottom:2px}.diapo.interactive-mode.angle-sum-mode .angle-sum-prompt svg{max-height:158px;margin-top:3px}.diapo.interactive-mode.angle-sum-mode .angle-bar-help{height:138px;margin-top:0}.diapo.interactive-mode.geometry-long-prompt-mode .question svg{max-height:285px!important}.diapo.interactive-mode.geometry-long-prompt-mode .opt{min-height:54px;padding:11px 14px}.diapo.interactive-mode.proportion-table-mode .proportion-line-desktop{width:min(100%,760px)}}
@media(min-width:801px) and (max-height:760px){.diapo.interactive-mode.fraction-ops-mode .fraction-product-manipulator .fraction-ops-area{max-height:285px}.diapo.interactive-mode.fraction-ops-mode .fraction-product-manipulator{padding-top:5px;padding-bottom:4px}.diapo.interactive-mode.fraction-ops-mode .fraction-product-manipulator p{font-size:.8rem}}
@media(min-width:801px) and (max-height:760px){.diapo.interactive-mode.area-formula-mode .area-main{height:clamp(250px,38vh,300px)}}
.diapo.interactive-mode .presentation-only{display:none!important}
.diapo.interactive-mode .interactive-summary{display:flex}
.diapo.interactive-mode .interactive-score{display:inline-flex;align-items:center;justify-content:center}
.diapo.interactive-mode .top{height:64px;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)}
.diapo.interactive-mode .interactive-summary{position:absolute;grid-column:1/-1;left:50%;max-width:calc(100% - 300px);transform:translateX(-50%)}.diapo.interactive-mode .left{grid-column:1;justify-self:start}.diapo.interactive-mode .right{grid-column:3}.diapo.interactive-mode .keyboard-toggle{display:inline-grid}
.diapo.interactive-mode .stage{order:2}
.diapo.interactive-mode .top{order:1}
.diapo.interactive-mode .answer-dock{order:3}
.diapo.interactive-mode .opt{cursor:pointer;transition:border-color .15s ease,background .15s ease,transform .15s ease;touch-action:manipulation}
.diapo.interactive-mode .opt:hover{border-color:#86a8cf}
.diapo.interactive-mode .opt.selected{border-color:#003b7a;background:#eaf3ff;box-shadow:0 0 0 2px rgba(0,59,122,.12)}
.diapo.interactive-mode .opt.correct{border-color:#10b981;background:#ecfdf5}
.diapo.interactive-mode .opt.wrong-choice{border-color:#dc2626;background:#fff1f2}
.interactive-finish{width:min(100%,650px);margin:7vh auto 0;padding:30px 24px;border:2px solid var(--border);border-radius:22px;background:#fbfdff;box-shadow:0 18px 48px rgba(11,33,71,.1)}
.interactive-finish-mark{width:64px;height:64px;display:grid;place-items:center;margin:0 auto 14px;border-radius:50%;background:#ecfdf5;color:#087a55;font-size:2rem;font-weight:900}
.interactive-finish h2{margin:0 0 8px;color:#073a75;font-size:clamp(1.7rem,3.5vw,2.7rem)}
.interactive-finish-score{margin:10px 0 20px;color:#087a55;font-size:clamp(2rem,4vw,3.5rem);font-weight:900}
.interactive-finish-actions{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}.interactive-finish-actions .btn{min-width:180px}.interactive-finish-actions .btn.primary{min-width:210px}
.course-btn{position:static;z-index:2;min-height:42px;display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border:1.5px solid #e86100;border-radius:12px;background:#fff7ed;color:#7a3500;font-size:.94rem;font-weight:850;cursor:pointer;box-shadow:0 3px 10px rgba(11,33,71,.1)}
.top .course-btn{flex:0 0 auto;box-shadow:none}
.course-btn svg{width:20px;height:20px;flex:none}
 .course-btn[hidden],.course-modal[hidden],.equation-detail-modal[hidden],.expand-correction-detail-modal[hidden]{display:none!important}
.course-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(11,33,71,.48)}
.course-card{position:relative;width:min(680px,100%);max-height:min(720px,calc(100dvh - 36px));overflow:auto;padding:26px;border:2px solid var(--border);border-radius:22px;background:white;box-shadow:0 24px 70px rgba(11,33,71,.28)}
.course-card.thales-course-card{width:min(900px,100%)}
.course-card.read-data-course-card{width:min(940px,100%)}
.course-card.recognize-proportion-course-card{width:min(900px,100%)}
.course-card.angles-course-card{width:min(820px,100%)}
.course-card.expand-factor-course-card{width:min(1080px,100%)}.course-card.expand-factor-course-card .course-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.course-card.expand-factor-course-card .course-rule{font-size:clamp(1.1rem,1.65vw,1.38rem)}.course-card.expand-factor-course-card .expand-correction-detail-content>.area-model-help{width:min(100%,800px)}.course-card.expand-factor-course-card .expand-correction-detail-steps{font-size:clamp(1.08rem,1.5vw,1.3rem)}
.expand-course-grid{display:grid;grid-template-columns:repeat(3,minmax(70px,1fr));width:min(100%,430px);margin:9px auto;border:2px solid #17384d;border-radius:12px;overflow:hidden;background:#fff;text-align:center}.expand-course-grid>*{padding:8px;border-right:1px solid #9fb3c8;border-bottom:1px solid #9fb3c8}.expand-course-grid>*:nth-child(3n){border-right:0}.expand-course-grid>*:nth-last-child(-n+3){border-bottom:0}.expand-course-grid strong{background:#eef5fd;color:#073a75}.expand-course-grid span:not(:first-child){color:#087a55;font-weight:900}
.course-angle-visual{display:flex;align-items:center;justify-content:center;width:100%;margin:0 auto}
.course-angle-visual .angle-vocabulary-svg{display:block;width:100%;height:auto;max-height:min(58vh,480px)}
.course-close{position:absolute;top:10px;right:12px;width:42px;height:42px;border:0;border-radius:50%;background:#eef4fc;color:#073a75;font-size:1.55rem;font-weight:900;cursor:pointer}
.course-title{margin:0 48px 20px;color:#073a75;font-size:clamp(1.65rem,3.4vw,2.4rem);line-height:1.1;text-align:center}
.course-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.course-rule{padding:15px 16px;border:2px solid var(--border);border-radius:15px;background:#f8fbff;font-size:clamp(1rem,1.7vw,1.3rem);line-height:1.35;text-align:left}
.course-rule>strong{display:block;margin-bottom:5px;color:#e86100;font-size:1.08em}
.expand-correction-detail-modal{position:fixed;inset:0;z-index:115;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(11,33,71,.55)}
.expand-correction-detail-card{position:relative;width:min(1040px,100%);max-height:min(780px,calc(100dvh - 36px));overflow:auto;padding:24px 28px 28px;border:2px solid var(--border);border-radius:22px;background:#fff;box-shadow:0 24px 70px rgba(11,33,71,.32)}
.expand-correction-detail-close{position:absolute;top:10px;right:12px;width:44px;height:44px;border:0;border-radius:50%;background:#eef4fc;color:#073a75;font-size:1.6rem;font-weight:900;cursor:pointer}
.expand-correction-detail-title{margin:0 52px 15px;color:#073a75;font-size:clamp(1.8rem,3.2vw,2.55rem);text-align:center}
.expand-correction-detail-content>.area-model-help{width:min(100%,900px);margin:0 auto 12px}.expand-correction-detail-content .area-model-svg{max-height:310px}
.expand-correction-detail-steps{width:min(100%,900px);margin:auto;padding:16px 20px;border:2px solid #f4b76f;border-radius:16px;background:#fffaf4;font-size:clamp(1.25rem,2vw,1.65rem);line-height:1.38}
.expand-correction-detail-steps .expand-worked-row{grid-template-columns:minmax(150px,auto) 1fr;gap:16px;padding:7px 0}.expand-correction-detail-steps p{margin:10px 0 0;color:#42556b}
.course-example{display:block;margin-top:8px;padding:7px 9px;border-radius:9px;background:#eef5fd;color:#17384d;font-size:.9em;font-weight:750}
.course-equation{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.12em;margin-top:7px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:1.22em;font-weight:800}
.course-equation-goals{display:grid;gap:7px}.course-equation-goals strong{display:inline;color:#073a75}.course-equation-splat{display:flex;justify-content:center;width:100%;margin:0 auto 3px}.course-equation-splat .equation-splat-svg{width:min(100%,420px);max-width:420px;margin:0}.course-equation-resolution{margin:4px auto 0;padding:4px 0 1px;border-radius:11px;background:#fff}.course-equation-resolution .equation-detail-resolution{width:min(100%,620px)}.course-equation-resolution .equation-detail-equation{min-height:40px;font-size:clamp(1.22rem,2vw,1.65rem)}.course-equation-resolution .equation-detail-operation{min-height:34px;font-size:clamp(.86rem,1.35vw,1.08rem)}
.course-frac{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;min-width:1.35em;line-height:1;vertical-align:middle}.course-frac>span:first-child{width:100%;padding:0 .15em .08em;border-bottom:2px solid currentColor;text-align:center}.course-frac>span:last-child{padding:.08em .15em 0}
.course-visual{display:block;width:min(100%,390px);height:auto;max-height:210px;margin:9px auto 4px}.course-visual text{font-family:Arial,"Helvetica Neue",sans-serif}.course-visual .math-text{font-family:"Cambria Math","Times New Roman",serif}.course-rule-wide{grid-column:1/-1}.course-multiplier{display:inline-flex;align-items:center;justify-content:center;min-width:1.8em;padding:.02em .18em;border-radius:.28em;background:#fff1df;color:#9a4100;font-weight:900}
.course-card.place-value-course-card{width:min(980px,100%)}.course-place-value-example{margin-top:9px}.course-place-value-example .place-value-tool{width:100%;margin-top:4px}.course-place-value-example .place-value-head{height:28px;font-size:.7rem}.course-place-value-example .place-value-preview-row,.course-place-value-example .place-value-fixed-row{height:43px}.course-place-value-example .place-value-drag-bar{top:5px;height:33px}.course-place-value-example .place-value-strip-digit,.course-place-value-example .place-value-fixed-digit{font-size:1.65rem}.course-place-value-example .place-value-comma{bottom:1px;font-size:1.7rem}.course-place-value-example .place-value-tool-note{height:30px;min-height:30px;margin-top:3px;font-size:.9rem}
.read-data-course-table{width:min(100%,630px);margin:10px auto 5px;border-collapse:separate;border-spacing:0;overflow:hidden;border:2px solid #17384d;border-radius:12px;background:#fff;text-align:center;font-size:clamp(.9rem,1.45vw,1.08rem)}
.read-data-course-table th,.read-data-course-table td{min-width:92px;padding:9px 12px;border-right:1px solid #9fb3c8;border-bottom:1px solid #9fb3c8}.read-data-course-table tr>*:last-child{border-right:0}.read-data-course-table tr:last-child>*{border-bottom:0}
.read-data-course-table th{background:#eef3f9;color:#35526e}.read-data-course-table .read-data-row{background:#eaf3ff;color:#0b5d96}.read-data-course-table .read-data-column{background:#fff0df;color:#9a4100}.read-data-course-table .read-data-target{position:relative;background:#eaf8f4;color:#087a55;font-size:1.12em;font-weight:950;box-shadow:inset 0 0 0 3px #27a47c}
.read-data-course-caption{margin:5px auto 0;color:#35526e;font-size:.9em;font-weight:800;text-align:center}.read-data-course-caption b{color:#087a55}
.read-data-course-chart{display:block;width:min(100%,440px);height:auto;max-height:230px;margin:8px auto 2px}
.proportion-course-table{width:min(100%,560px);margin:10px auto 5px;border-collapse:collapse;background:#fff;text-align:center;font-size:clamp(.94rem,1.5vw,1.12rem)}
.proportion-course-table th,.proportion-course-table td{padding:9px 13px;border:1.5px solid #9fb3c8}.proportion-course-table th{background:#eef3f9;color:#35526e}.proportion-course-table td{font-weight:850}
.proportion-course-calculations{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:5px 13px;margin:8px auto 2px;color:#087a55;font-weight:900;text-align:center}
.proportion-course-graphs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:min(100%,650px);margin:10px auto 2px}
.proportion-course-graph{padding:7px 8px 5px;border:1.5px solid #c9d9ed;border-radius:10px;background:#fff;text-align:center}.proportion-course-graph strong{display:block;margin-bottom:2px;color:#35526e}.proportion-course-graph svg{display:block;width:100%;height:auto;max-height:155px;margin:auto}
.read-data-pictogram{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:7px 13px;width:min(100%,360px);margin:12px auto 4px;padding:12px 14px;border:2px solid #d8e3f4;border-radius:13px;background:#fff}.read-data-pictogram strong{color:#35526e}.read-data-stars{color:#e86100;font-size:1.55rem;letter-spacing:.08em;white-space:nowrap}.read-data-legend{grid-column:1/-1;padding-top:7px;border-top:1px solid #d8e3f4;color:#60708c;font-size:.88em;font-weight:800;text-align:center}.read-data-operation{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 18px;margin:10px auto 2px}.read-data-operation span{padding:8px 11px;border-radius:10px;background:#eef5fd;color:#17384d;font-weight:850}.read-data-operation b{color:#087a55}
@media(min-width:801px){.diapo.place-value-reasoning-mode .stage{padding:8px 24px 10px}.diapo.place-value-reasoning-mode .place-value-prompt{font-size:clamp(1.8rem,2.45vw,2.6rem);line-height:1.1;margin-bottom:2px}.diapo.place-value-reasoning-mode .place-value-equation{font-size:clamp(3.2rem,4.8vw,4.6rem);margin:1px auto 7px}.diapo.place-value-reasoning-mode .place-value-tool{width:min(94%,1380px);margin-top:2px}.diapo.place-value-reasoning-mode .place-value-head{height:40px;font-size:1rem}.diapo.place-value-reasoning-mode .place-value-preview-row,.diapo.place-value-reasoning-mode .place-value-fixed-row{height:64px}.diapo.place-value-reasoning-mode .place-value-drag-bar{top:8px;height:48px}.diapo.place-value-reasoning-mode .place-value-strip-digit,.diapo.place-value-reasoning-mode .place-value-fixed-digit{font-size:3.65rem}.diapo.place-value-reasoning-mode .place-value-comma{bottom:1px;font-size:2.6rem}.diapo.place-value-reasoning-mode .place-value-tool-note{height:42px;min-height:42px;margin-top:3px;font-size:1.08rem}.diapo.place-value-reasoning-mode .place-value-options.is-reasoning{max-width:1200px;gap:8px;margin-top:6px}.diapo.place-value-reasoning-mode .place-value-options.is-reasoning .opt{min-height:0;padding:10px 14px;font-size:clamp(1rem,1.3vw,1.3rem);line-height:1.14}}
@media(min-width:801px) and (min-height:761px){.diapo.place-value-reasoning-mode .stage{padding-top:42px}.diapo.place-value-reasoning-mode .stage>.slide{margin-top:0;margin-bottom:0}}
@media(min-width:801px) and (max-height:760px){.diapo.place-value-reasoning-mode .stage{padding:4px 20px 6px}.diapo.place-value-reasoning-mode .place-value-prompt{font-size:clamp(1.45rem,2.1vw,2rem);line-height:1.08;margin-bottom:1px}.diapo.place-value-reasoning-mode .place-value-equation{font-size:clamp(2.7rem,4.2vw,3.4rem);margin:0 auto 5px}.diapo.place-value-reasoning-mode .place-value-tool{margin-top:0}.diapo.place-value-reasoning-mode .place-value-head{height:30px;font-size:.82rem}.diapo.place-value-reasoning-mode .place-value-preview-row,.diapo.place-value-reasoning-mode .place-value-fixed-row{height:45px}.diapo.place-value-reasoning-mode .place-value-drag-bar{top:6px;height:33px}.diapo.place-value-reasoning-mode .place-value-strip-digit,.diapo.place-value-reasoning-mode .place-value-fixed-digit{font-size:2.45rem}.diapo.place-value-reasoning-mode .place-value-comma{bottom:1px;font-size:1.9rem}.diapo.place-value-reasoning-mode .place-value-tool-note{height:29px;min-height:29px;margin-top:2px;font-size:.9rem}.diapo.place-value-reasoning-mode .place-value-options.is-reasoning{max-width:1020px;gap:5px;margin-top:3px}.diapo.place-value-reasoning-mode .place-value-options.is-reasoning .opt{min-height:0;padding:6px 12px;font-size:clamp(.9rem,1.22vw,1.05rem);line-height:1.12}}
.decimal-course-visual{width:min(100%,520px);max-height:none}.course-divisibility-share .equal-sharing-help{height:auto;margin:6px auto 0}.course-divisibility-share .equal-sharing-svg{width:min(100%,460px);max-height:130px}.decimal-course-visual .decimal-manipulation{padding:7px 9px;border-radius:12px}.decimal-course-visual .decimal-drop-slot{min-width:72px;min-height:40px;font-size:1.18rem}.decimal-course-visual .decimal-manipulation{box-sizing:border-box;max-width:100%}.decimal-course-visual .decimal-order-board .decimal-drop-slot{min-width:0;width:clamp(52px,17vw,72px)}.decimal-course-visual .decimal-order-endpoint{max-width:72px;font-size:.62rem;letter-spacing:0;line-height:1.1;text-align:center;white-space:normal}.decimal-course-visual .decimal-order-sign{margin-top:8px;font-size:1.5rem}.decimal-course-visual .decimal-order-slots{gap:3px}.decimal-course-visual .decimal-complement-visual{height:94px}.decimal-course-visual .area-model-svg{max-height:180px}.decimal-course-visual .relation-bar-svg{max-height:175px}
.thales-course-template{display:grid;grid-template-columns:minmax(230px,.85fr) minmax(300px,1.15fr);align-items:center;gap:14px 20px;width:100%}.thales-course-figure{opacity:0;animation:thalesCourseReveal .32s ease-out .05s forwards}.thales-course-figure svg{display:block;width:100%;height:auto;max-height:250px}.thales-course-method{display:flex;flex-direction:column;gap:8px}.thales-course-caption{color:#35526e;font-size:.86rem;font-weight:850;text-align:center}.thales-course-table{display:grid;grid-template-columns:1.25fr repeat(3,1fr);overflow:hidden;border:2px solid #17384d;border-radius:12px;background:#fff}.thales-course-cell{display:flex;align-items:center;justify-content:center;min-height:42px;padding:6px 7px;border-right:1px solid #9fb3c8;border-bottom:1px solid #9fb3c8;font-weight:900}.thales-course-cell:nth-child(4n){border-right:0}.thales-course-cell:nth-last-child(-n+4){border-bottom:0}.thales-course-head{background:#eef3f9;color:#35526e;font-size:.78rem}.thales-course-small{color:#11468c}.thales-course-large{color:#087f83}.thales-course-row-small{opacity:0;animation:thalesCourseReveal .32s ease-out .38s forwards}.thales-course-row-large{opacity:0;animation:thalesCourseReveal .32s ease-out .72s forwards}.thales-course-ratios{opacity:0;padding:10px;border-radius:11px;background:#eef8f7;color:#17384d;font-size:1.12rem;font-weight:900;text-align:center;animation:thalesCourseReveal .32s ease-out 1.06s forwards}.thales-course-ratios .small{color:#11468c}.thales-course-ratios .large{color:#087f83}.thales-course-reminder{opacity:0;color:#60708c;font-size:.82rem;font-weight:800;text-align:center;animation:thalesCourseReveal .32s ease-out 1.35s forwards}@keyframes thalesCourseReveal{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.median-course-values{display:flex;align-items:center;justify-content:center;gap:.36em;margin:7px 0 2px;font-weight:850}.median-middle{padding:1px 4px;border-bottom:3px solid #e86100;border-radius:5px;background:#fff1df;color:#9a4100}
.equation-detail-modal{position:fixed;inset:0;z-index:110;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(11,33,71,.52)}
.equation-detail-card{position:relative;width:min(860px,100%);max-height:min(760px,calc(100dvh - 36px));overflow:auto;padding:24px 24px 28px;border:2px solid var(--border);border-radius:22px;background:#fff;box-shadow:0 24px 70px rgba(11,33,71,.3)}
.equation-detail-close{position:absolute;top:10px;right:12px;width:42px;height:42px;border:0;border-radius:50%;background:#eef4fc;color:#073a75;font-size:1.55rem;font-weight:900;cursor:pointer}
.equation-detail-title{margin:0 48px 18px;color:#073a75;font-size:clamp(1.55rem,3vw,2.15rem);line-height:1.1;text-align:center}
.equation-detail-resolution{width:min(100%,760px);margin:0 auto;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-weight:800}
.equation-detail-line{display:grid;grid-template-columns:clamp(52px,9vw,82px) minmax(0,1fr) 30px minmax(0,1fr) clamp(52px,9vw,82px);align-items:center;width:100%;column-gap:3px}
.equation-detail-equation{min-height:48px;font-size:clamp(1.55rem,2.8vw,2.35rem);line-height:1.05}
.equation-detail-left{grid-column:2;text-align:right;white-space:nowrap}
.equation-detail-equals{grid-column:3;text-align:center}
.equation-detail-right{grid-column:4;text-align:left;white-space:nowrap}
.equation-detail-operation{min-height:42px;color:#e86100;font-family:Arial,Helvetica,sans-serif;font-size:clamp(1rem,1.65vw,1.35rem);font-weight:900;line-height:1}
.equation-detail-operation-left{grid-column:1;display:flex;align-items:center;justify-content:flex-end;gap:3px;white-space:nowrap}
.equation-detail-operation-right{grid-column:5;display:flex;align-items:center;justify-content:flex-start;gap:3px;white-space:nowrap}
.equation-detail-arrow{font-size:1.55em;line-height:1}
.equation-detail-final{color:#078a5b;font-weight:900}
@media(max-width:800px){.equation-detail-modal{padding:7px}.equation-detail-card{max-height:calc(100dvh - 14px);padding:18px 7px 20px;border-radius:16px}.equation-detail-title{margin:2px 42px 14px;font-size:1.38rem}.equation-detail-close{top:7px;right:7px;width:38px;height:38px}.equation-detail-resolution{width:min(100%,430px)}.equation-detail-line{grid-template-columns:45px minmax(0,1fr) 20px minmax(0,1fr) 45px;column-gap:2px}.equation-detail-equation{min-height:39px;font-size:clamp(1.08rem,5.3vw,1.42rem)}.equation-detail-operation{min-height:32px;font-size:clamp(.78rem,3.6vw,.94rem)}.equation-detail-operation-left,.equation-detail-operation-right{gap:2px}.equation-detail-arrow{font-size:1.4em}}
@media(max-width:800px){.diapo.interactive-mode.expand-factor-mode .stage{padding:10px 10px 8px}.diapo.interactive-mode.expand-factor-mode .stage>.slide{margin-top:14px;margin-bottom:auto}.diapo.interactive-mode.expand-factor-mode .expand-factor-shell{gap:4px}.diapo.interactive-mode.expand-factor-mode .question{font-size:clamp(1.32rem,6.1vw,1.85rem);line-height:1.08}.diapo.interactive-mode.expand-factor-mode .expand-expression{font-size:clamp(1.85rem,9.2vw,2.85rem)}.diapo.interactive-mode.expand-factor-mode .area-model-help{margin:0 auto}.diapo.interactive-mode.expand-factor-mode .area-model-svg{max-height:190px}.diapo.interactive-mode.expand-factor-mode .footer{font-size:clamp(1.48rem,7vw,2.1rem)}.diapo.interactive-mode.expand-factor-mode .interactive-polynomial-response,.diapo.interactive-mode.expand-factor-mode .interactive-algebra-template-response{font-size:clamp(1.72rem,8.1vw,2.55rem)}.diapo.interactive-mode.expand-factor-mode .interactive-input-slot{min-width:1.72em}.diapo.interactive-mode.expand-factor-mode .expand-worked-correction{grid-template-columns:auto minmax(0,1fr);gap:7px;width:100%;padding:8px 9px;font-size:.88rem}.diapo.interactive-mode.expand-factor-mode .expand-correction-detail-button{grid-column:1/-1;width:100%;min-height:42px}.expand-correction-detail-modal{padding:7px}.expand-correction-detail-card{max-height:calc(100dvh - 14px);padding:18px 9px 20px;border-radius:16px}.expand-correction-detail-title{margin:2px 44px 12px;font-size:1.45rem}.expand-correction-detail-close{top:7px;right:7px;width:38px;height:38px}.expand-correction-detail-content>.area-model-help{margin-bottom:8px}.expand-correction-detail-content .area-model-svg{max-height:220px}.expand-correction-detail-steps{padding:10px 11px;font-size:1.03rem}.expand-correction-detail-steps .expand-worked-row{grid-template-columns:1fr;gap:1px;padding:5px 0}}
@media(max-width:800px){.diapo.interactive-mode.expand-factor-mode .area-model-help.has-phone-question-table{display:block;width:calc(100vw - 12px);max-width:none;margin-left:calc(50% - 50vw + 6px);margin-right:0}.diapo.interactive-mode.expand-factor-mode .has-phone-question-table>.area-model-svg{display:none}.diapo.interactive-mode.expand-factor-mode .area-model-phone-question{display:block;width:100%}.area-model-phone-question h3{margin:0 0 3px;color:#17283f;font-family:Arial,Helvetica,sans-serif;font-size:1.06rem;font-weight:900;text-align:center}.area-model-phone-question table{width:100%;table-layout:fixed;border-collapse:collapse;background:#f3f3f3;color:#111;font-family:"Cambria Math","Times New Roman",serif;font-size:clamp(1.38rem,6.4vw,1.85rem);font-style:italic;font-weight:850}.area-model-phone-question th,.area-model-phone-question td{height:70px;padding:5px 6px;border:1.6px solid #333;text-align:center;vertical-align:middle}.area-model-phone-question thead th{height:46px;background:#e9e9e9}.area-model-phone-question thead th:first-child,.area-model-phone-question tbody th{width:64px;background:#fff}.area-model-phone-question td.is-dashed{border-left-style:dashed}.area-model-phone-question tbody tr+tr td,.area-model-phone-question tbody tr+tr th{border-top-style:dashed}}
@media(max-width:800px){.diapo.interactive-mode.expand-factor-mode .expand-manipulation{width:calc(100vw - 8px);max-width:none;margin-left:calc(50% - 50vw + 4px);padding:6px 4px 9px}.diapo.interactive-mode.expand-factor-mode .expand-manipulation .area-model-help.has-phone-question-table{width:100%;margin:0}.area-model-phone-question .area-model-slot{cursor:pointer;touch-action:manipulation}.area-model-phone-question .area-model-slot.is-filled{background:#fff3e3;color:#934000;box-shadow:inset 0 0 0 2px #e86100}.area-model-phone-question .area-model-slot.is-selected{background:#fff7ed;box-shadow:inset 0 0 0 3px #ff7a1a}}
@media(max-width:800px){.diapo.interactive-mode.expand-factor-mode .interactive-polynomial-response,.diapo.interactive-mode.expand-factor-mode .interactive-algebra-template-response{flex-wrap:nowrap;gap:.02em;font-size:clamp(1.42rem,6.4vw,1.95rem)}.diapo.interactive-mode.expand-factor-mode .interactive-input-slot{min-width:1.48em;padding-left:.1em;padding-right:.1em}.diapo.interactive-mode.expand-factor-mode .interactive-polynomial-response{gap:0 .05em}.diapo.interactive-mode.expand-factor-mode .interactive-polynomial-term{gap:.04em}}
@media(max-width:800px){.diapo.interactive-mode.expand-factor-mode .interactive-polynomial-response,.diapo.interactive-mode.expand-factor-mode .interactive-algebra-template-response{flex-wrap:wrap;row-gap:2px}.diapo.interactive-mode.expand-factor-mode .interactive-expand-source{flex-basis:100%;text-align:center}.diapo.interactive-mode.expand-factor-mode .interactive-expand-result{min-height:48px;margin-top:-1px}}
svg{display:block;max-width:100%;height:auto}
@media(min-width:1000px){.scientific-glide-help{max-width:1050px;height:clamp(220px,34vh,300px)}.scientific-glide{max-width:980px}.fraction-percent-help{height:clamp(270px,41vh,370px)}.fraction-percent-svg{width:min(100%,1080px)}.diapo:fullscreen .slide,.diapo:-webkit-full-screen .slide{zoom:1.12}}
@media(min-width:801px) and (max-height:800px){.fraction-product-manipulator{padding:0}.fraction-product-layout{width:min(100%,500px);grid-template-rows:46px minmax(300px,1fr);gap:7px 12px}}
@media(max-width:800px){.diapo{--stage-top:24px;--stage-x:24px;--stage-bottom:24px}.top{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);height:76px;text-align:center;padding:9px max(9px,env(safe-area-inset-right)) 9px max(9px,env(safe-area-inset-left));gap:6px}.left{justify-content:flex-start}.right{justify-content:flex-end}.top .btn{min-height:52px;font-size:.92rem;padding:11px 10px;border-radius:12px;white-space:nowrap}.top .btn.primary{min-width:0}.navnums{display:none}.mobile-counter{display:block;white-space:nowrap;font-size:1.08rem}.stage{padding:var(--stage-top) var(--stage-x) var(--stage-bottom)}.diapo .stage>.slide{margin-top:auto;margin-bottom:auto}.options.options-4{grid-template-columns:1fr}.options.options-4.options-compact{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.scientific-mode .stage{padding:8px 8px 13px}.scientific-prompt{font-size:clamp(1.25rem,5.8vw,1.65rem)}.scientific-footer{font-size:clamp(1.7rem,7.7vw,2.25rem);margin-top:3px}.scientific-place-help{min-height:62px;margin-top:14px}.scientific-place-equation{font-size:clamp(1.45rem,6.4vw,2rem)}.scientific-glide-help{height:clamp(160px,24vh,195px);margin-top:-3px}.scientific-condition-help{min-height:64px;margin-top:8px}.scientific-condition{font-size:clamp(1.7rem,7.4vw,2.25rem)}.scientific-options{gap:7px;margin-top:6px}.scientific-options .opt{font-size:clamp(.86rem,3.75vw,1.05rem);padding:8px 9px}.diapo.numberline-mode .question{font-size:clamp(1.1rem,6.65vw,2rem);line-height:1.13}.diapo.numberline-mode .footer{font-size:clamp(1.72rem,7.8vw,2.12rem)}.diapo.numberline-mode .answer-slot{width:2.2em!important}.diapo.numberline-mode .footer .qquad{width:.7em}.diapo.numberline-mode .footer .math-display{transform:none}.number-line-placement-prompt,.number-line-step-prompt,.number-line-choice-prompt{font-size:clamp(1.08rem,5vw,1.4rem)!important;margin-bottom:1px}.number-line-placement-shell,.number-line-readonly{width:100%}.number-line-placement-svg{max-width:100%!important}.number-line-reset{min-height:42px;margin:-7px auto 0;padding:7px 14px;font-size:.88rem}.number-line-step-options{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px;margin-top:-4px}.number-line-step-options .opt{min-height:48px;padding:7px 9px;font-size:clamp(1rem,4.5vw,1.25rem)}.number-line-step-correction{margin-top:4px;padding:5px 8px;font-size:clamp(.82rem,3.6vw,1rem)}.number-line-choice-options{gap:5px;margin-top:2px}.number-line-choice-options .number-line-choice{grid-template-columns:27px minmax(0,1fr);padding:2px 6px;border-width:1.5px;border-radius:11px}.number-line-choice-visual svg{max-height:62px}.diapo.solids-mode .stage{padding:10px 10px 16px}.solid-prompt{font-size:clamp(1.25rem,5.6vw,1.65rem)}.solid-visual{width:230px;height:clamp(155px,27vh,215px)}.solid-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.solid-options .opt{font-size:clamp(.88rem,3.7vw,1.08rem);padding:8px 9px}}
@media(max-width:800px){.diapo.relation-mode .stage{padding:7px 7px 11px}.relation-prompt{font-size:clamp(1.34rem,5.95vw,1.72rem);margin-bottom:3px}.relation-bar-help{height:clamp(170px,29vh,225px);margin:0 auto}.relation-answer{font-size:clamp(1.8rem,8vw,2.35rem);margin-top:2px}.relation-options{gap:7px;margin-top:5px}.relation-options .opt{min-height:99px;padding:7px 8px;font-size:clamp(.98rem,4.4vw,1.2rem)}.relation-option-label{min-height:29px}.relation-tile-help{min-height:44px;margin-top:4px;gap:3px}.relation-summary-grid{grid-template-columns:1fr;gap:7px;margin-top:5px}.relation-summary-card{min-height:99px;padding:7px 12px}.relation-summary-line{font-size:clamp(1.05rem,4.8vw,1.3rem)}.relation-summary-card .relation-tile-help{min-height:31px}}
@media(max-width:800px){.diapo.pythagoras-mode .stage{padding:8px 6px 10px}.diapo.pythagoras-mode .slide{width:100%;margin-top:auto;margin-bottom:auto}.diapo.pythagoras-mode .pythagoras-prompt{margin-bottom:5px;font-size:clamp(1.28rem,5.75vw,1.62rem);line-height:1.1}.diapo.pythagoras-mode .pythagoras-prompt.is-text-only{font-size:clamp(1.45rem,6.35vw,1.78rem)}.diapo.pythagoras-mode .pythagoras-prompt.has-statement-figure{font-size:clamp(1.18rem,5.25vw,1.48rem)}.diapo.pythagoras-mode .pythagoras-prompt.has-statement-figure svg{width:min(100%,300px)!important;max-height:185px!important;margin:4px auto 0!important}.diapo.pythagoras-mode .pythagoras-aid-visual{height:clamp(150px,23vh,190px);margin:1px auto}.diapo.pythagoras-mode .pythagoras-options,.diapo.pythagoras-mode .pythagoras-options.options-3{grid-template-columns:1fr;gap:6px;margin-top:5px}.diapo.pythagoras-mode .pythagoras-options.options-4.options-compact{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.pythagoras-mode .pythagoras-options .opt{min-height:50px;padding:9px 10px;font-size:clamp(.96rem,4.1vw,1.12rem);line-height:1.17}.diapo.pythagoras-mode .pythagoras-answer{margin-top:4px;font-size:clamp(1.7rem,7.25vw,2.15rem)}}
@media(max-width:800px){.diapo.pythagoras-builder-mode .stage{padding:3px 4px 5px}.diapo.pythagoras-builder-mode .slide{margin-top:0;margin-bottom:auto}.pythagoras-builder{width:100%;padding:6px 5px 7px;border-radius:13px}.pythagoras-builder-prompt{font-size:clamp(.94rem,4.2vw,1.14rem);margin-bottom:0}.pythagoras-builder-triangle{width:min(100%,300px);max-height:158px;margin-top:-2px}.pythagoras-builder-work{gap:5px}.pythagoras-builder-equation{gap:3px;font-size:clamp(1.25rem,6.3vw,1.72rem)}.pythagoras-builder-areas{gap:3px;font-size:clamp(1.06rem,5.2vw,1.42rem)}.pythagoras-builder-equation.is-given strong{min-width:2.55em;min-height:1.45em;padding:3px 5px;border-radius:8px}.pythagoras-builder-areas>.pythagoras-builder-caption{display:none}.pythagoras-builder-slot{min-width:2.55em;min-height:1.52em;padding:3px 5px;border-radius:8px}.pythagoras-builder-palette{gap:5px;padding:4px 5px;border-radius:10px}.pythagoras-builder-palette>.pythagoras-builder-caption{display:none}.pythagoras-builder-token{min-width:54px;min-height:42px;padding:5px 8px;border-radius:9px;font-size:1rem}.pythagoras-builder-feedback{margin-top:4px;font-size:.76rem}}
@media(max-width:800px){.diapo.fraction-percent-mode .stage{padding:5px 5px 9px}.fraction-percent-prompt{font-size:clamp(1.44rem,6.25vw,1.84rem);margin-bottom:3px}.fraction-percent-help{height:clamp(210px,35vh,282px);margin:0 auto}.fraction-percent-svg{width:min(100%,780px)}.fraction-percent-answer{font-size:clamp(1.95rem,8.6vw,2.55rem);margin-top:2px}}
@media(max-width:800px){.diapo.fraction-ops-mode .stage{padding:5px 4px 10px}.fraction-ops-prompt{font-size:clamp(1.32rem,5.9vw,1.7rem);margin-bottom:2px}.fraction-ops-pair,.fraction-ops-operation,.fraction-ops-conversion{flex-direction:column;gap:0;margin:0 auto}.fraction-ops-card{width:min(100%,378px)}.fraction-ops-stack>.fraction-ops-arrow+.fraction-ops-card{margin-top:6px}.fraction-ops-label{min-height:27px;font-size:clamp(1.06rem,4.65vw,1.3rem)}.fraction-ops-band{width:min(100%,374px)}.fraction-ops-wall,.fraction-ops-compare-wall{width:min(100%,378px);flex-basis:auto}.fraction-ops-wall .fraction-ops-band,.fraction-ops-compare-wall .fraction-ops-band{width:min(100%,374px)}.fraction-ops-wall-label{min-height:26px;font-size:clamp(1.02rem,4.45vw,1.26rem)}.fraction-ops-sign{font-size:1.7rem;line-height:.75}.fraction-ops-sign-bottom{align-self:center;margin-bottom:0}.fraction-ops-arrow{font-size:1.3rem}.fraction-ops-result-visual{font-size:1.68rem;margin-top:0}.fraction-ops-product{flex-direction:column;gap:1px}.fraction-ops-area{width:min(100%,366px);max-height:310px}.fraction-ops-result-text{font-size:clamp(1.3rem,5.55vw,1.7rem)}.fraction-ops-answer{font-size:clamp(1.78rem,7.8vw,2.3rem);margin-top:1px}.fraction-ops-options{grid-template-columns:1fr;gap:6px;margin-top:4px}.fraction-ops-options .opt{font-size:clamp(1rem,4.2vw,1.2rem);padding:9px 10px}.diapo.substitution-mode .stage{padding:9px 9px 14px}.substitution-prompt{font-size:clamp(1.2rem,5.3vw,1.55rem);margin-bottom:3px}.substitution-expression{font-size:clamp(1.8rem,8vw,2.35rem);margin:2px auto 5px}.substitution-help{flex-direction:column;min-height:57px;font-size:clamp(1.8rem,8vw,2.35rem);margin:2px auto}.substitution-answer{font-size:clamp(1.75rem,7.7vw,2.3rem)}.substitution-options,.substitution-options.options-3{grid-template-columns:1fr;gap:7px;margin-top:5px}.substitution-options .opt{font-size:clamp(.95rem,4.1vw,1.15rem);padding:8px 9px}}
@media(max-width:800px){.fraction-product-manipulator{display:none}.fraction-product-static{display:block!important;width:min(98%,430px);max-height:clamp(260px,44vh,350px);margin:0 auto}.fraction-ops-product{width:100%}}
@media(max-width:800px){.diapo.multiple-forms-mode .stage{padding:5px 6px 10px}.multiple-forms-prompt{font-size:clamp(1.34rem,5.9vw,1.72rem);line-height:1.15;margin-bottom:2px}.multiple-forms-help{height:clamp(230px,38vh,315px);margin:0 auto}.multiple-forms-help.multiple-forms-tenths{height:clamp(230px,38vh,315px)}.multiple-forms-help.multiple-forms-line{height:clamp(160px,27vh,210px)}.multiple-forms-caption{font-size:clamp(.94rem,4.05vw,1.15rem);margin-top:0}.multiple-forms-answer{font-size:clamp(1.95rem,8.6vw,2.55rem);margin-top:2px}.multiple-forms-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:5px}.multiple-forms-options .opt{font-size:clamp(1.02rem,4.45vw,1.25rem);padding:10px 10px}}
@media(max-width:800px){.diapo.place-value-mode .stage{padding:5px 4px 8px}.place-value-prompt{font-size:clamp(1.62rem,6.8vw,2rem);margin-bottom:3px}.place-value-prompt.is-context,.place-value-prompt.is-reasoning{font-size:clamp(1.08rem,4.7vw,1.36rem);line-height:1.12;margin-bottom:2px}.place-value-equation{font-size:clamp(2.15rem,9.3vw,2.9rem);margin:0 auto 11px}.place-value-tool{width:100%;margin-top:0}.place-value-grid{border-width:2px;border-radius:10px}.place-value-head{height:36px;padding:0 1px;font-size:clamp(.55rem,2.45vw,.64rem);line-height:1;writing-mode:horizontal-tb;transform:none}.place-value-preview-row,.place-value-fixed-row{height:56px}.place-value-drag-bar{left:-13px;right:-13px;top:7px;height:42px}.place-value-strip-digit,.place-value-fixed-digit{font-size:clamp(2rem,8.8vw,2.4rem)}.place-value-comma{left:calc(57.142857% - 3px);bottom:2px;font-size:2.2rem}.place-value-tool-note{height:34px;min-height:34px;margin-top:3px;padding:0 4px;font-size:clamp(.84rem,3.55vw,1rem);text-align:center}.place-value-tool-instruction{font-size:clamp(.7rem,2.95vw,.82rem)}.place-value-tool-note strong{font-size:1.16em}.place-value-correction{height:22px;font-size:clamp(.9rem,3.8vw,1.08rem);margin:3px auto;line-height:1.05}.place-value-options{gap:7px;margin-top:5px}.place-value-options.options-compact{grid-template-columns:repeat(2,minmax(0,1fr))}.place-value-options:not(.options-compact){grid-template-columns:1fr}.place-value-options .opt{min-height:54px;font-size:clamp(1rem,4.25vw,1.2rem);padding:10px 11px}.place-value-options.is-reasoning .opt{min-height:48px;font-size:clamp(.82rem,3.45vw,.96rem);line-height:1.16;padding:8px 9px}.place-value-placeholder{width:100%;height:185px;min-height:185px;margin:0 auto}.course-place-value-example .place-value-head{height:31px;font-size:.42rem;letter-spacing:-.08em}.course-place-value-example .place-value-preview-row,.course-place-value-example .place-value-fixed-row{height:42px}.course-place-value-example .place-value-strip-digit,.course-place-value-example .place-value-fixed-digit{font-size:1.55rem}.course-place-value-example .place-value-tool-note{height:28px;min-height:28px;font-size:.78rem}}
@media(max-width:800px){.diapo.conversion-mode .stage{padding:5px 4px 8px}.conversion-context{font-size:.86rem}.conversion-prompt{font-size:clamp(1.32rem,5.7vw,1.75rem);margin-bottom:3px}.conversion-tool{width:100%;margin:25px auto 8px;overflow-x:auto;overscroll-behavior-x:contain}.conversion-family-area .conversion-grid-wrap{width:540px}.conversion-family-volume .conversion-grid-wrap{width:735px}.conversion-grid{gap:3px}.conversion-unit{min-height:43px;padding:2px 1px;border-width:2px;font-size:.62rem}.conversion-unit small{font-size:.72em}.conversion-slot{min-height:62px;border-width:2px;font-size:1.22rem;overflow:hidden}.conversion-cursor{border-width:3px;border-radius:7px}.conversion-cursor-label,.conversion-cursor-digit-label{display:none}.conversion-cursor-comma{right:-9px;bottom:21px;font-size:2.35rem;text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff}.conversion-method{font-size:clamp(.84rem,3.55vw,1.02rem);margin:3px auto}.duration-conversion-tool{width:100%;margin-top:1px}.duration-disc{width:70px;border-width:3px;font-size:.78rem}.duration-instance{min-height:172px;gap:3px;padding:5px 7px;border-radius:13px}.duration-instance-row{gap:6px}.duration-disc-group{gap:4px}.duration-instance-row .duration-disc{width:58px;font-size:.67rem}.duration-plus{font-size:1.18rem}.duration-down{font-size:1.5rem}.duration-second-step{margin-top:5px}.duration-second-step .duration-disc{width:58px}.duration-second-step .duration-equivalence-pair{gap:6px}.duration-correction-line{gap:5px 8px;margin-top:6px;font-size:.88rem}}
@media(max-width:800px){.diapo.angle-sum-mode .stage{padding:5px 5px 9px}.angle-sum-prompt{font-size:clamp(1.3rem,5.8vw,1.7rem);margin-bottom:3px}.angle-sum-prompt svg{width:min(100%,350px);max-height:270px;margin-top:3px}.angle-bar-action-row{margin:1px auto -1px}.angle-bar-resolve-btn{min-height:38px;padding:6px 10px;font-size:.72rem}.angle-triangle-help{height:clamp(160px,26vh,210px);margin:0 auto}.angle-bar-help{height:clamp(145px,24vh,195px);margin:0 auto}.angle-bar-svg{width:min(100%,780px)}.angle-sum-answer{font-size:clamp(1.82rem,8.1vw,2.4rem);margin-top:2px}.angle-sum-options{gap:7px;margin-top:5px}.angle-sum-options .opt{min-height:50px;font-size:clamp(1rem,4.3vw,1.2rem);padding:10px 11px}}
@media(max-width:800px){.diapo.angle-sum-mode.angle-sum-builder-mode .stage{padding:3px 4px 5px}.angle-sum-builder{gap:5px}.angle-sum-builder-prompt{font-size:clamp(1.02rem,4.6vw,1.25rem)}.angle-sum-builder-triangle,.angle-sum-builder-triangle .angle-triangle-help{height:118px}.angle-sum-builder-triangle .angle-triangle-svg{width:min(100%,430px)}.angle-sum-builder-table{width:calc(100% - 4px)}.angle-sum-builder-row,.angle-sum-builder-slot{min-height:72px}.angle-sum-builder-slot{padding:4px 2px;font-size:clamp(1.55rem,7.6vw,2.05rem)}.angle-sum-builder-palette{gap:5px;padding:5px}.angle-sum-builder-token,.angle-sum-builder-reset{min-height:44px;padding:6px 10px;border-radius:9px;font-size:clamp(1.05rem,5vw,1.3rem)}.angle-sum-builder-reset{font-size:.86rem}.angle-sum-builder-calculation{font-size:clamp(1.9rem,9vw,2.55rem)}.angle-sum-builder-feedback{font-size:.76rem}}
@media(max-width:800px){.diapo.angle-sum-mode.angle-figure-mode .angle-sum-prompt{font-size:clamp(1.1rem,4.8vw,1.38rem)}.diapo.angle-sum-mode.angle-figure-mode .angle-sum-prompt svg{max-height:175px}.diapo.angle-sum-mode.angle-figure-mode .angle-triangle-help{height:155px}.diapo.angle-sum-mode.angle-figure-mode .angle-bar-help{height:125px}.diapo.angle-sum-mode.angle-figure-mode .angle-sum-answer{font-size:clamp(1.55rem,7vw,2rem)}}
@media(max-width:800px){.diapo.evolution-mode .stage{padding:7px 7px 12px}.evolution-prompt{font-size:clamp(1.28rem,5.55vw,1.65rem);line-height:1.15;margin-bottom:3px}.evolution-prompt table{font-size:clamp(.94rem,4vw,1.1rem)!important;margin-top:10px!important;margin-bottom:10px!important}.evolution-prompt table td,.evolution-prompt table th{padding-top:13px!important;padding-bottom:13px!important}.evolution-help{height:clamp(140px,39vw,290px);margin:0 auto}.evolution-help-scroll{justify-content:flex-start;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}.evolution-help-scroll .evolution-svg{width:720px;max-width:none;flex:none}.evolution-answer{font-size:clamp(1.72rem,7.6vw,2.25rem);margin-top:2px}.evolution-options{grid-template-columns:1fr;gap:7px;margin-top:4px}.evolution-options .opt{font-size:clamp(.92rem,3.9vw,1.08rem);padding:9px 10px}}
@media(max-width:800px){.diapo.perimeter-mode .stage{padding:5px 7px 10px}.perimeter-prompt{font-size:clamp(1.3rem,5.7vw,1.7rem);line-height:1.13}.perimeter-prompt svg{width:min(100%,365px);height:clamp(220px,36vh,300px);max-height:300px;margin:1px auto}.diapo.perimeter-mode.correction-visible .perimeter-prompt{font-size:clamp(1.15rem,5vw,1.48rem)}.diapo.perimeter-mode.correction-visible .perimeter-prompt svg{height:clamp(155px,24vh,205px);max-height:205px}.perimeter-correction-flow{gap:1px;margin:0 auto 1px}.perimeter-formula,.perimeter-calculation{font-size:clamp(1.05rem,4.55vw,1.34rem)}.perimeter-answer{font-size:clamp(1.8rem,8vw,2.35rem)}}
@media(max-width:800px){.diapo.area-mode .stage{padding:6px 7px 11px}.area-prompt{font-size:clamp(1.32rem,5.85vw,1.72rem);margin-bottom:3px}.area-main{height:clamp(215px,35vh,285px)}.area-data{padding:18px 18px;font-size:clamp(1.18rem,5.1vw,1.5rem)}.area-help{margin:2px auto 4px;font-size:clamp(1.05rem,4.55vw,1.32rem);line-height:1.12}.area-answer-line{font-size:clamp(1.85rem,8.2vw,2.45rem)}.area-options{gap:7px;margin-top:2px}.area-options .opt{min-height:50px;font-size:clamp(1rem,4.2vw,1.2rem);padding:10px 11px}.area-correction{margin-top:4px;padding:2px 5px;font-size:clamp(1.05rem,4.45vw,1.3rem)}}
@media(max-width:800px){.diapo.area-mode.correction-visible .area-main{height:clamp(165px,27vh,215px)}.diapo.area-mode.correction-visible .area-prompt{font-size:clamp(1.2rem,5.25vw,1.5rem)}.area-correction-flow{gap:0;margin-top:2px}}
@media(max-width:800px){.diapo.volume-mode .stage{padding:5px 7px 10px}.volume-prompt{font-size:clamp(1.25rem,5.45vw,1.62rem);line-height:1.14;margin-bottom:2px}.volume-prompt svg{height:clamp(190px,32vh,260px);max-height:260px;margin:1px auto}.volume-response-zone{min-height:112px;margin-top:2px;padding:0 5px}.volume-correction-flow{gap:4px;margin:0;padding:0 5px}.volume-formula{margin:1px auto;font-size:clamp(1.35rem,5.8vw,1.75rem);line-height:1.12}.volume-calculation{margin:1px auto;padding:0 2px;font-size:clamp(1.18rem,5.05vw,1.5rem);line-height:1.12}.volume-answer{font-size:clamp(2rem,8.7vw,2.65rem);margin:0}}
@media(max-width:800px){.diapo.solids-mode .stage{padding:7px 8px 11px}.solid-prompt{font-size:clamp(1.38rem,6vw,1.78rem);line-height:1.1;margin-bottom:3px}.solid-visual{width:min(100%,315px);height:clamp(210px,33vh,275px)}.solid-options{gap:8px;margin-top:4px}.solid-options .opt{min-height:56px;padding:10px 11px;font-size:clamp(1rem,4.35vw,1.2rem)}.diapo.volume-mode .stage{padding:6px 7px 10px}.volume-prompt{font-size:clamp(1.34rem,5.85vw,1.72rem);line-height:1.11;margin-bottom:1px}.volume-visual{width:min(100%,350px);height:clamp(225px,35vh,290px);margin:-2px auto 0}.volume-data{margin:-2px auto 2px;font-size:clamp(1rem,4.2vw,1.2rem);line-height:1.14}.volume-response-zone{min-height:108px}.volume-correction-flow{gap:3px;margin:0;padding:0 4px}.volume-formula{margin:0 auto;font-size:clamp(1.3rem,5.55vw,1.68rem);line-height:1.1}.volume-calculation{margin:0 auto;padding:0 2px;font-size:clamp(1.12rem,4.8vw,1.42rem);line-height:1.1}.volume-answer{font-size:clamp(2rem,8.55vw,2.6rem);margin:0}}
@media(max-width:800px) and (max-height:700px){.solid-visual{height:185px}.solid-options .opt{min-height:48px;padding:8px 9px}.volume-visual{height:185px}.volume-response-zone{min-height:96px}}
@media(max-width:800px){.diapo.average-mode .stage{padding:7px 6px 12px}.average-prompt{font-size:clamp(1.28rem,5.65vw,1.68rem);margin-bottom:3px}.average-instruction{font-size:clamp(1.08rem,4.65vw,1.34rem);margin:5px auto 3px}.average-data-line{font-size:clamp(1.55rem,7.4vw,2.1rem);margin:2px auto}.average-table-wrap{margin:7px auto 5px}.average-table{font-size:clamp(.9rem,3.85vw,1.08rem)}.average-table th,.average-table td{padding:14px 14px;border-width:1.5px}.average-help-visual{height:clamp(170px,29vh,225px)}.average-answer-line{font-size:clamp(1.65rem,7.6vw,2.2rem);margin-top:4px}.average-options,.average-formula-options{grid-template-columns:1fr!important;gap:7px;margin-top:6px}.average-options .opt,.average-formula-options .opt{font-size:clamp(.92rem,3.9vw,1.08rem);padding:9px 10px}.average-correction{padding:0 5px;font-size:clamp(1.05rem,4.5vw,1.35rem);margin-top:8px}.average-correction>div{display:block;padding:4px 0}.average-step{text-align:center;margin-bottom:3px}}
@media(max-width:800px){.diapo.median-mode .stage{padding:12px 9px 16px}.diapo.median-mode .question{font-size:clamp(1.3rem,5.7vw,1.72rem);line-height:1.18;margin-bottom:17px}.diapo.median-mode .footer{font-size:clamp(1.55rem,7vw,2rem);margin-top:10px}.median-list{gap:.18em .4em;margin:11px auto 13px;font-size:clamp(1.25rem,5.7vw,1.65rem)}.median-table-wrap{margin:11px auto}.median-table{font-size:clamp(.78rem,3.45vw,1rem)}.median-table td{padding:6px 7px;border-width:1.5px}.course-btn{min-height:40px;padding:7px 11px;font-size:.88rem}.course-card{padding:22px 16px 18px;border-radius:18px}.course-title{margin-bottom:15px;font-size:1.55rem}.course-grid,.course-card.expand-factor-course-card .course-grid{grid-template-columns:1fr;gap:8px}.course-rule,.course-card.expand-factor-course-card .course-rule{padding:11px 12px;font-size:1rem}}
@media(max-width:800px){.diapo.proportion-mode .stage{padding:7px 7px 12px}.proportion-prompt{font-size:clamp(1.3rem,5.7vw,1.68rem);line-height:1.17;margin-bottom:3px}.proportion-line-desktop{display:none}.proportion-line-mobile{display:block;width:min(100%,400px)}.proportion-help{margin:1px auto 2px}.proportion-answer{font-size:clamp(1.75rem,7.8vw,2.3rem);margin-top:2px}.proportion-options{gap:7px;margin-top:6px}.proportion-options .opt{font-size:clamp(.96rem,4.1vw,1.14rem);padding:9px 10px}.proportion-table-wrap{gap:7px;margin:11px auto;justify-content:flex-start}.proportion-table{font-size:clamp(.92rem,3.9vw,1.1rem)}.proportion-table td{padding:12px 9px;border-width:1.5px}.proportion-table-methods{gap:4px;font-size:.78rem}.proportion-table-method{gap:3px;padding:5px 6px;border-radius:8px}.proportion-bare-table{font-size:clamp(1.42rem,6.2vw,1.78rem)}.proportion-bare-table td{min-width:105px;padding:16px 22px}}
@media(max-width:800px){.fraction-ops-method-card{padding:12px 10px;margin:3px auto;border-radius:14px}.fraction-ops-method-label{margin-bottom:7px;font-size:1rem}.fraction-ops-method-line{flex-wrap:wrap;gap:7px 10px;font-size:clamp(1.35rem,6vw,1.75rem)}.fraction-ops-share{flex-direction:column;gap:2px}.fraction-ops-share-sign{font-size:1.4rem}.fraction-ops-counting .fraction-ops-card{max-width:366px}.fraction-ops-counting .fraction-ops-units{flex-direction:column;gap:3px}.fraction-ops-counting .fraction-ops-band{width:min(100%,348px);flex:none}.fraction-ops-count-result{padding:7px 10px;font-size:1rem}.diapo.module01-mode .module01-options.options-4{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.dense-mode .stage{padding:5px 6px 9px}.diapo.dense-mode .question{margin-bottom:5px;font-size:clamp(1.02rem,4.5vw,1.3rem);line-height:1.08}.diapo.dense-mode .question svg{max-height:215px;margin:2px auto}.diapo.dense-mode .footer{margin-top:5px;font-size:clamp(1.25rem,5.8vw,1.75rem)}.diapo.dense-mode .options{gap:5px;margin-top:5px}.diapo.dense-mode .opt{padding:7px 8px;font-size:clamp(.78rem,3.45vw,.98rem);border-width:1.5px;border-radius:10px}.diapo.algorithm-mode .question{font-size:clamp(.92rem,4vw,1.08rem)}.diapo.algorithm-mode .question svg{max-height:135px!important}.diapo.algorithm-mode .question div+br+div svg{max-height:82px!important}}
@media(max-width:800px){.diapo.geometry-choice-mode .stage{padding:5px 7px 9px}.diapo.geometry-choice-mode .question{margin-bottom:2px;font-size:clamp(1.24rem,5.45vw,1.6rem);line-height:1.08}.diapo.geometry-choice-mode .question svg{width:min(100%,375px)!important;max-width:375px!important;max-height:min(39vh,305px)!important;margin:2px auto!important}.diapo.geometry-choice-mode .options{gap:7px;margin-top:4px}.diapo.geometry-choice-mode .opt{min-height:56px;padding:11px 12px;font-size:clamp(1rem,4.3vw,1.2rem);border-width:1.75px;border-radius:13px}}
@media(max-width:800px){.diapo.angles-mode .stage{padding:4px 7px 8px}.diapo.angles-mode .question{font-size:clamp(1.52rem,6.8vw,2.02rem);line-height:1.12;margin-bottom:6px}.diapo.angles-mode .question svg{max-height:min(34vh,270px)!important}.diapo.angles-mode .options{gap:7px;margin-top:5px}.diapo.angles-mode .opt{min-height:55px;padding:10px 11px;font-size:clamp(1rem,4.35vw,1.2rem)}.diapo.angles-mode .footer{font-size:clamp(2.05rem,9.5vw,3rem);margin-top:5px}.angle-question-visual{margin-bottom:2px}.angle-question-visual .angle-vocabulary-svg{max-height:min(35vh,280px)}.angle-options-long.options-compact{grid-template-columns:1fr}.angle-options-long .opt{font-size:clamp(.92rem,3.85vw,1.07rem)}.angle-figure-options{gap:5px!important}.angle-figure-option{padding:5px!important}.angle-figure-option .angle-vocabulary-svg{max-height:125px}.course-card.angles-course-card{padding:18px 11px 15px}.course-angle-visual .angle-vocabulary-svg{max-height:min(60vh,440px)}}
@media(max-width:800px){.diapo.geometry-long-prompt-mode .question{font-size:clamp(1.08rem,4.7vw,1.36rem)}.diapo.geometry-long-prompt-mode .question svg{max-height:220px!important}.diapo.geometry-long-prompt-mode .opt{min-height:52px;padding:9px 11px}}
@media(max-width:800px){.diapo.thales-mode .stage{padding:4px 6px 8px}.diapo.thales-mode .question{margin-bottom:3px;font-size:clamp(1.02rem,4.45vw,1.28rem);line-height:1.09}.diapo.thales-mode .thales-question-figure{width:min(100%,390px);margin:1px auto 3px}.diapo.thales-mode .thales-question-figure svg{max-height:min(31vh,205px)}.diapo.thales-mode .options{gap:5px;margin-top:3px}.diapo.thales-mode .opt{min-height:45px;padding:7px 8px;font-size:clamp(.79rem,3.45vw,.98rem);border-width:1.5px;border-radius:10px}.diapo.thales-mode .footer{margin-top:3px;font-size:clamp(1.3rem,5.8vw,1.75rem)}.diapo.thales-structured-mode .stage>.slide{margin-top:8px;margin-bottom:auto}.diapo.thales-structured-mode .question{font-size:clamp(1rem,4.3vw,1.23rem)}.thales-task-card{gap:5px;padding:9px 8px 8px;border-radius:13px}.thales-task-kicker{padding:4px 9px;font-size:.64em}.thales-task-condition{font-size:.72em}.thales-task-target{font-size:.77em}.thales-task-question{font-size:.9em}.thales-facts{gap:4px}.thales-fact{min-width:0;flex:1 1 92px;gap:.18em;padding:5px 6px;border-radius:8px;font-size:.68em}.thales-result-comparison{gap:5px;font-size:.98em}.thales-result-comparison .thales-fact{flex:0 1 135px;font-size:.76em}.diapo.thales-structured-mode .thales-question-figure{width:min(100%,295px);margin:0 auto}.diapo.thales-structured-mode .thales-question-figure svg{max-height:min(20vh,142px)}.diapo.thales-structured-mode .options{margin-top:5px;gap:5px}.diapo.thales-structured-mode .opt{padding:7px 8px;font-size:clamp(.82rem,3.55vw,1rem)}.diapo.thales-coherence-mode .options{grid-template-columns:1fr}.diapo.thales-coherence-mode .opt{min-height:0;padding:9px 10px;font-size:clamp(.86rem,3.7vw,1.03rem)}.thales-course-template{grid-template-columns:1fr;gap:7px}.thales-course-figure svg{max-height:180px}.thales-course-method{gap:6px}.thales-course-cell{min-height:35px;padding:4px 5px;font-size:.88rem}.thales-course-head{font-size:.7rem}.thales-course-ratios{padding:8px 5px;font-size:.94rem}.thales-course-reminder{font-size:.76rem}}
@media(prefers-reduced-motion:reduce){.thales-course-figure,.thales-course-row-small,.thales-course-row-large,.thales-course-ratios,.thales-course-reminder{opacity:1;animation:none}}
@media(max-width:800px){.diapo.trigonometry-mode .stage{padding:4px 6px 8px}.diapo.trigonometry-mode .question{font-size:clamp(1.2rem,5vw,1.48rem)}.trig-question-svg{width:min(100%,390px);max-height:225px;margin:2px auto}.diapo.trigonometry-mode .options{grid-template-columns:1fr;gap:6px;margin-top:4px}.diapo.trigonometry-mode .opt{min-height:45px;padding:8px 10px;font-size:clamp(.94rem,4vw,1.1rem)}.diapo.trigonometry-mode .footer{font-size:clamp(1.75rem,7.5vw,2.35rem)}}
@media(max-width:800px){.diapo.data-mode .stage{padding:5px 6px 9px}.diapo.data-mode .question{margin-bottom:5px;font-size:clamp(1.16rem,5.05vw,1.48rem);line-height:1.1}.diapo.data-mode .question table{font-size:clamp(.88rem,3.75vw,1.06rem)!important}.diapo.data-mode .question table td,.diapo.data-mode .question table th{padding:12px 10px!important}.diapo.data-mode .footer{margin-top:6px;font-size:clamp(1.55rem,6.8vw,2rem)}}
@media(max-width:800px){.slide .question table{max-width:100%;font-size:clamp(.92rem,3.9vw,1.08rem)!important}.slide .question table td,.slide .question table th{padding:14px 14px!important;border-width:1.5px!important}.diapo.coordinate-mode .stage{padding:4px 4px 8px}.diapo.coordinate-mode .question{font-size:clamp(1.18rem,5.2vw,1.5rem);line-height:1.1;margin-bottom:3px}.diapo.coordinate-mode .question svg{width:min(100%,380px)!important;max-width:380px!important;max-height:min(52vh,380px)!important;margin:3px auto!important}.diapo.coordinate-mode .footer{font-size:clamp(1.75rem,7.8vw,2.3rem);margin-top:3px}.coordinate-pairs-response{flex-direction:column;gap:4px}.coordinate-pair{width:100%;min-height:1.55em}.coordinate-placement-prompt,.coordinate-claim-prompt{font-size:clamp(1.03rem,4.45vw,1.25rem)!important;line-height:1.12!important}.coordinate-point-selectors{gap:6px}.coordinate-point-selector{min-height:40px;padding:6px 13px;font-size:.88rem}.coordinate-placement-svg,.coordinate-claim-visual svg{width:min(100%,365px)!important;max-width:365px!important;max-height:min(43vh,335px)!important}.coordinate-placement-reset{min-height:38px;margin:-5px auto 0;padding:6px 12px;font-size:.82rem}.coordinate-claim-options{gap:7px;margin-top:2px}.coordinate-claim-options .opt{min-height:48px;padding:8px 10px;font-size:clamp(1rem,4.3vw,1.18rem)}.coordinate-claim-correction{margin-top:4px;font-size:clamp(.88rem,3.8vw,1.04rem)}.diapo.right-angle-mode .question{font-size:clamp(2rem,9vw,2.8rem);margin-bottom:20px}.diapo.right-angle-mode .footer{font-size:clamp(2.1rem,9.5vw,3rem)}}
@media(max-width:800px){.diapo.transformations-mode .stage{padding:4px 4px 8px}.diapo.transformations-mode .question{font-size:clamp(1.12rem,4.9vw,1.42rem);line-height:1.09;margin-bottom:3px}.diapo.transformations-mode .question svg{width:min(100%,390px)!important;max-width:390px!important;max-height:min(49vh,390px)!important;margin:3px auto!important}.diapo.transformations-mode .footer{font-size:clamp(1.6rem,7.2vw,2.15rem);margin-top:3px}.diapo.transformations-mode .options{gap:6px;margin-top:4px}.diapo.transformations-mode .opt{font-size:clamp(.9rem,3.85vw,1.08rem);padding:8px 9px}.course-visual{max-height:175px}.course-rule-wide{grid-column:auto}}
@media(max-width:800px){.diapo.read-data-mode .stage{padding:5px 6px 9px}.diapo.read-data-mode .stage>.slide{margin-top:auto;margin-bottom:auto}.diapo.read-data-mode .question{margin-bottom:5px;font-size:clamp(1.04rem,4.55vw,1.34rem);line-height:1.1}.diapo.read-data-mode .question svg{max-height:min(31vh,215px);margin:3px auto}.diapo.read-data-mode .question table{font-size:clamp(.86rem,3.7vw,1.02rem)!important}.diapo.read-data-mode .question table td,.diapo.read-data-mode .question table th{padding:10px 9px!important}.diapo.read-data-mode .options{grid-template-columns:1fr;gap:7px;margin-top:6px}.diapo.read-data-mode .options.options-4{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.read-data-mode .opt{min-height:56px;padding:10px 10px;border-width:1.75px;border-radius:12px;font-size:clamp(.98rem,4.25vw,1.17rem)}.diapo.read-data-mode .footer{margin-top:5px;font-size:clamp(1.45rem,6.5vw,1.95rem)}.read-data-aid-caption,.read-data-aid-placeholder,.read-data-touch-panel{min-height:43px;margin-top:6px!important}.read-data-aid-caption,.read-data-touch-instruction{padding:6px 8px;border-radius:10px;font-size:clamp(.78rem,3.35vw,.94rem);line-height:1.16}.read-data-aid-placeholder .btn{min-height:39px;padding:6px 11px;font-size:.82rem}.diapo.read-data-mode .read-data-pictogram-question table{font-size:clamp(1rem,4.35vw,1.18rem)!important}.diapo.read-data-mode .read-data-pictogram-question table td{padding:10px 13px!important}.read-data-star-group{min-width:150px;gap:13px}.read-data-star-value{margin-top:3px}.read-data-course-table{font-size:.82rem}.read-data-course-table th,.read-data-course-table td{min-width:67px;padding:7px 5px}.read-data-course-chart{max-height:190px}.read-data-pictogram{gap:5px 9px;padding:9px}.read-data-stars{font-size:1.3rem}.read-data-operation{gap:6px;margin-top:7px}.read-data-operation span{width:100%;padding:7px 8px;text-align:center}}
@media(max-width:800px){.diapo.recognize-proportion-mode .stage{padding:5px 6px 9px}.diapo.recognize-proportion-mode .stage>.slide{margin-top:auto;margin-bottom:auto}.diapo.recognize-proportion-mode .question{margin-bottom:5px;font-size:clamp(1.08rem,4.7vw,1.38rem);line-height:1.1}.diapo.recognize-proportion-mode .question svg{width:min(100%,390px)!important;max-width:390px!important;max-height:min(32vh,235px)!important;margin:3px auto!important}.diapo.recognize-proportion-mode .question table{font-size:clamp(.9rem,3.85vw,1.08rem)!important}.diapo.recognize-proportion-mode .question table td,.diapo.recognize-proportion-mode .question table th{padding:11px 10px!important}.diapo.recognize-proportion-mode .legacy-statement-table-wrap{margin:9px auto 11px}.diapo.recognize-proportion-mode .options{grid-template-columns:1fr;gap:7px;margin-top:6px}.diapo.recognize-proportion-mode .options.options-4{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.recognize-proportion-mode .opt{min-height:54px;padding:9px;border-width:1.75px;border-radius:12px;font-size:clamp(.94rem,4.05vw,1.13rem);line-height:1.15}.diapo.recognize-proportion-mode .footer{margin-top:5px;font-size:clamp(1.45rem,6.5vw,1.95rem)}.course-card.recognize-proportion-course-card{padding:18px 11px 15px}.proportion-course-table th,.proportion-course-table td{padding:7px 6px}.proportion-course-calculations{gap:4px 8px;font-size:.88em}.proportion-course-graphs{grid-template-columns:1fr;gap:7px}.proportion-course-graph svg{max-height:130px}}
@media(max-width:800px){.diapo.decimal-mode .stage{padding:5px 7px 8px}.diapo.decimal-mode .question{font-size:clamp(1.48rem,6.25vw,1.9rem);margin-bottom:7px}.diapo.decimal-mode .footer{font-size:clamp(2.05rem,9.1vw,2.8rem);margin-top:7px}.diapo.decimal-mode .options{grid-template-columns:1fr;gap:8px;margin-top:8px}.diapo.decimal-mode .opt{min-height:56px;padding:11px 12px;font-size:clamp(1.18rem,5.05vw,1.45rem)}.decimal-manipulation{padding:10px 8px;border-radius:14px}.decimal-card-tray{gap:7px;margin-bottom:10px}.decimal-card,.decimal-drop-slot{min-width:82px;min-height:56px;padding:8px 9px;border-radius:11px;font-size:clamp(1.34rem,5.8vw,1.7rem)}.decimal-order-slots{gap:5px}.decimal-order-position{gap:5px}.decimal-order-endpoint{font-size:.67rem}.decimal-order-sign{align-self:flex-start;margin-top:12px;line-height:1;font-size:1.75rem}.decimal-frame-line>svg{max-height:143px}.decimal-frame-slots{display:grid;grid-template-columns:17% 1fr 16%;justify-content:normal;gap:0;width:100%;margin:-30px auto 7px}.decimal-frame-slots .decimal-drop-slot:first-child{grid-column:1;justify-self:center}.decimal-frame-slots .decimal-drop-slot:last-child{grid-column:3;justify-self:center}.decimal-frame-slots .decimal-drop-slot{min-width:78px}.decimal-complement-visual{height:clamp(88px,14vh,112px);margin-top:3px}.area-model-compact .area-model-svg{max-height:190px}.decimal-distributivity-board .decimal-card{min-width:128px;font-size:clamp(1.06rem,4.55vw,1.3rem)}.decimal-decomposition{gap:5px;padding:8px 7px}.decimal-decomposition-title{font-size:.88rem}.decimal-decomposition-line{gap:5px;font-size:clamp(1.28rem,5.55vw,1.62rem)}.decimal-decomposition-start{font-size:clamp(1.6rem,6.8vw,2rem)}.decimal-decomposition-slot,.decimal-decomposition-term{min-width:126px;min-height:50px;padding:6px 5px;font-size:clamp(1.04rem,4.45vw,1.28rem)}.decimal-decomposition-result{font-size:clamp(1.05rem,4.55vw,1.32rem)}}
@media(max-width:800px){.diapo>.top{order:2;border-top:1px solid var(--border);border-bottom:0}.diapo>.stage{order:1}}
@media(max-width:800px){.diapo.interactive-mode{--stage-x:7px;--stage-bottom:7px}.diapo.interactive-mode>.stage{order:2;padding-top:5px}.interactive-input-slot{min-height:1.48em;min-width:2.18em;border-radius:.28em}.interactive-polynomial-response{gap:7px 10px;margin-top:7px;font-size:clamp(1.7rem,7.7vw,2.25rem)}.interactive-polynomial-response.term-count-1{font-size:clamp(2.3rem,10vw,3rem)}.interactive-polynomial-response.term-count-2{font-size:clamp(1.95rem,8.8vw,2.65rem)}.interactive-polynomial-term small{font-size:.42em}.interactive-finish{margin:3vh auto 0;padding:22px 15px}.interactive-finish-mark{width:54px;height:54px}.interactive-finish-score{margin-bottom:14px}.interactive-finish-actions{flex-direction:column;gap:8px}.interactive-finish-actions .btn,.interactive-finish-actions .btn.primary{width:min(100%,260px);min-width:0}}
@media(max-width:800px){.multiple-forms-help.multiple-forms-line{height:clamp(245px,39vh,315px)}.multiple-forms-line-desktop{display:none}.multiple-forms-line-mobile{display:block;width:min(100%,390px)!important;height:auto}.fraction-ops-result-separated{margin-top:13px}.fraction-ops-simplification{max-width:360px;margin-bottom:3px;font-size:.88rem;line-height:1.12}.legacy-statement-table-wrap{margin:15px auto 20px}}
@media(max-width:600px){.fullscreen-btn{display:none!important}.diapo:not(.interactive-mode) .top{gap:5px;padding-left:7px;padding-right:7px}.diapo:not(.interactive-mode) .left{gap:4px}.diapo:not(.interactive-mode) .menu-btn{min-width:54px;min-height:42px;padding:0 7px;font-size:.82rem}.diapo:not(.interactive-mode) .prev-btn{width:42px;min-height:42px;padding:0;font-size:0}.diapo:not(.interactive-mode) .prev-btn::before{content:'←';font-size:1.05rem}.diapo:not(.interactive-mode) .right{gap:6px}.diapo:not(.interactive-mode) .course-btn{width:42px;height:42px;min-height:42px;padding:0;display:inline-grid;place-items:center;border-radius:50%}.diapo:not(.interactive-mode) .course-btn svg{width:21px;height:21px}.diapo:not(.interactive-mode) .course-btn span{display:none}}
@media(max-width:800px){.diapo.divisibility-sharing-mode .stage{padding:5px 6px 8px}.diapo.divisibility-sharing-mode .question{font-size:clamp(1.08rem,4.75vw,1.38rem);margin-bottom:1px}.equal-sharing-help{height:clamp(185px,27vh,220px);margin:0 auto 1px}.diapo.divisibility-sharing-mode .options{grid-template-columns:1fr;gap:5px;margin-top:3px}.diapo.divisibility-sharing-mode .opt{min-height:0;padding:7px 9px;font-size:clamp(.82rem,3.6vw,1rem)}}
@media(max-width:800px){.diapo.divisibility-mode .stage{padding:8px 8px 10px}.diapo.divisibility-mode .slide{width:100%}.divisibility-prompt{font-size:clamp(1.3rem,6vw,1.62rem);line-height:1.18;margin-bottom:10px}.divisibility-prompt.divisibility-prompt-text{font-size:clamp(1.15rem,5.3vw,1.42rem)}.divisibility-prompt small{margin-top:6px;font-size:.92rem}.divisibility-pair{gap:.15em 1.1em}.diapo.divisibility-mode .divisibility-options:not(.divisibility-grid-text){gap:8px;width:100%;margin-top:8px}.diapo.divisibility-mode .divisibility-options:not(.divisibility-grid-text) .opt{min-height:54px;padding:8px 6px;border-radius:14px;font-size:clamp(1.25rem,6vw,1.55rem)}.divisibility-grid-numbers{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.divisibility-mode .divisibility-grid-numbers{width:100%}.divisibility-option-none{grid-column:1/-1}.divisibility-grid-list{grid-template-columns:repeat(3,minmax(0,1fr))}.diapo.divisibility-mode .divisibility-grid-list{width:100%;gap:8px}.diapo.divisibility-mode .divisibility-grid-yes-no{width:100%}.course-card.divisibility-course-card{padding:16px 10px 12px}.course-card.divisibility-course-card .course-title{margin-bottom:10px}.course-card.divisibility-course-card .course-grid{gap:7px}.course-card.divisibility-course-card .course-rule{padding:9px 10px;font-size:.95rem}.course-card.divisibility-course-card .course-example{margin-top:6px;padding:5px 8px}.course-divisibility-units{gap:4px}.course-divisibility-units span{padding:4px 3px}}
@media (hover:none) and (pointer:coarse){.navnums{display:none!important}.mobile-counter{display:block!important}}
/* ===== Lot T — coque commune : en-tête, pied (verdict, pavé, Passer/Valider, carte « Comment on trouve »), aide, fin de série, options de QCM, étapes du diaporama ===== */
/* La zone question est alignée en haut (rien ne remonte quand un élément apparaît). */
.diapo .stage>.slide{margin-top:0!important;margin-bottom:auto!important}
.diapo.interactive-mode .stage{padding-top:8px}
.diapo:not(.interactive-mode) .stage>.slide{margin-top:min(3vh,28px)!important}
.diapo.interactive-mode.equation-mode .slide{justify-content:flex-start;min-height:0}
/* En-tête du mode interactif : Menu | 3 / 10 | score, clavier, plein écran, Cours, Aide. */
.diapo.interactive-mode>.top{order:1;height:64px;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;border-top:0;border-bottom:1px solid var(--border);padding:8px max(14px,env(safe-area-inset-right)) 8px max(14px,env(safe-area-inset-left))}
.diapo.interactive-mode .top .btn{min-height:46px}
.diapo.interactive-mode .menu-btn{min-width:0;padding:0 14px;border-radius:13px;white-space:nowrap}
.diapo.interactive-mode .interactive-summary{position:static;grid-column:2;justify-self:center;max-width:100%;transform:none;font-size:1.02rem}
.diapo.interactive-mode .left{grid-column:1}.diapo.interactive-mode .right{grid-column:3;gap:8px}
@media(min-width:1100px){.diapo.interactive-mode .interactive-summary{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}}
@media(max-width:899px){.counter-word{display:none}}
.course-btn,.aide-btn{min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 13px;border-radius:13px;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;font-size:.95rem;font-weight:850;cursor:pointer;touch-action:manipulation;white-space:nowrap}
.top .course-btn{border:1.5px solid #e86100;background:#fff7ed;color:#7a3500;box-shadow:none}
.aide-btn{border:1.5px solid #6f97c6;background:#eef5fd;color:#073a75}
.aide-btn svg,.course-btn svg{width:20px;height:20px;flex:none}
.aide-btn.is-open{border-color:#003b7a;background:#003b7a;color:#fff}
.aide-btn.is-unavailable{visibility:hidden;pointer-events:none}
.aide-btn[hidden]{display:none!important}
/* Le pied : une ligne de verdict à hauteur réservée, puis la zone de travail (pavé, consigne ou carte de correction, toujours à la même place et à la même hauteur), puis Passer | Valider. */
.answer-dock{--touche-h:clamp(44px,6.5dvh,56px);--touche-ecart:3px;--pave-rangs:3;--verdict-h:32px;--actions-h:clamp(48px,6.4dvh,56px);--carte-h:clamp(116px,17dvh,150px);--zone-reduite:clamp(80px,11dvh,96px);--carte-min-qcm:clamp(92px,14dvh,120px);--zone-h:var(--carte-h);--carte-min:var(--zone-h);position:relative;z-index:5;flex:0 0 auto;order:3;padding:0 max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));border-top:1px solid var(--border);background:#f8fbff;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif}
.answer-dock[hidden]{display:none!important}
.answer-dock.avec-pave{--zone-h:calc(var(--pave-rangs) * var(--touche-h) + 2 * var(--touche-ecart))}
/* Série où aucune question n'utilise le pavé : pied réduit (la consigne, puis Passer | Valider) ; la carte de correction y tient en trois lignes, sans titre. */
.answer-dock.serie-sans-pave{--zone-h:var(--zone-reduite)}
.answer-dock.serie-sans-pave .carte-titre{display:none}
.answer-dock.serie-sans-pave .carte-correction{padding-top:6px;padding-bottom:6px}
.answer-dock.serie-sans-pave .zone-consigne{border-style:solid;border-color:#e3ecf2;background:#fff}
.verdict{height:var(--verdict-h);display:flex;align-items:center;justify-content:center;gap:0;overflow:hidden;padding:0 4px;color:#24364f;font-size:1rem;font-weight:800;line-height:1.1;text-align:center;white-space:nowrap}
.verdict-texte{display:inline-flex;align-items:center;gap:0;white-space:nowrap}
.verdict-texte>span{display:inline-flex;align-items:center;gap:.3em}
.verdict-sep{margin:0 .45em;color:#8a9bb0}
.verdict-ok{color:#087a55;font-weight:900}
.verdict-bonne b{color:#087a55;font-weight:900}
.verdict-eleve{color:#24364f}
.verdict-passe{color:#42556b}
.verdict.info{color:#9a4100}
.verdict.verdict-court .verdict-bonne,.verdict.verdict-court .verdict-sep,.verdict.verdict-court .verdict-ok-reponse{display:none}
.verdict-ok-reponse b{font-weight:900}
.verdict .frac{font-size:.78em;line-height:1}
.pied{display:flex;flex-direction:column;gap:8px;width:min(100%,560px);margin:0 auto}
.zone-travail{position:relative;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);height:var(--zone-h);min-width:0}
.zone-travail>*{grid-area:1/1;min-width:0;min-height:0}
/* Le pavé (comme celui de Défi tables) : fond teinté, faces blanches en retrait, aucune zone morte. 1 2 3 4 5 / 6 7 8 9 0 / rangée de l'automatisme + ⌫ */
.pave{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:var(--touche-h);align-content:start;gap:0;padding:var(--touche-ecart);border-radius:18px;background:#e3ecf2;visibility:hidden}
.pave .key{position:relative;isolation:isolate;min-width:0;min-height:0;height:var(--touche-h);margin:0;padding:0 2px;border:0;border-radius:0;background:none;color:#0b2147;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;font-size:1.5rem;font-weight:900;line-height:1;cursor:pointer;touch-action:manipulation;box-shadow:none;-webkit-user-select:none;user-select:none}
.pave .key::before{content:"";position:absolute;inset:var(--touche-ecart);z-index:-1;border-radius:12px;background:#fff;box-shadow:0 1px 0 #b3c6d3}
.pave .key.context{color:#073a75}
.pave .key.context::before{background:#f6f9fc}
.pave .key.utility{display:grid;place-items:center;color:#2c4a63}
.pave .key.utility::before{background:#cbdae5}
.pave .key.utility svg{width:28px;height:28px;pointer-events:none}
.pave .key:active::before{background:#d6e3ec;box-shadow:none}
.pave .key:disabled{opacity:.45;cursor:default}
.pave .key:focus-visible{outline:none}.pave .key:focus-visible::before{outline:3px solid #0f6cf9;outline-offset:1px}
.answer-dock.avec-pave:not(.qcm-mode):not(.locked) .pave{visibility:visible}
/* La consigne prend la place du pavé quand la question n'en a pas besoin (QCM, manipulation) ou quand il est caché (ordinateur). */
.zone-consigne{display:flex;align-items:center;justify-content:center;padding:6px 14px;border:1.5px dashed #c6d6e9;border-radius:16px;color:#42556b;font-size:1.02rem;font-weight:800;line-height:1.3;text-align:center;visibility:hidden}
.answer-dock.sans-pave:not(.locked) .zone-consigne,.answer-dock.qcm-mode:not(.locked) .zone-consigne{visibility:visible}
/* Lot T2 — question SANS pavé (QCM, manipulation) au téléphone et à la tablette : la zone de travail se réduit à la consigne ; Passer et Valider restent en bas, seule la zone question gagne de la hauteur. Après la réponse, la carte garde au moins la place de 3 lignes (titre et 2 lignes ; dans une série sans pavé, sans titre, la hauteur réduite du lot T). */
.answer-dock.consigne-reduite.question-sans-pave{--carte-min:var(--carte-min-qcm)}
.answer-dock.serie-sans-pave{--carte-min-qcm:var(--zone-reduite)}
.answer-dock.consigne-reduite.question-sans-pave:not(.locked) .zone-travail{height:auto}
.answer-dock.consigne-reduite.question-sans-pave:not(.locked) .pave{display:none}
.answer-dock.consigne-reduite.question-sans-pave .zone-consigne{min-height:44px}
/* Lot T2 — après la réponse, la carte « Comment on trouve » prend la hauteur de ses lignes : au moins la place de la zone de travail, plus si besoin (la limite haute, calculée par fitCorrectionCard, ne recouvre pas la réponse de l'élève). */
.answer-dock.locked .zone-travail{height:auto;min-height:var(--carte-min)}
.answer-dock.locked .pave,.answer-dock.locked .zone-consigne{display:none}
/* dnb_32 : tant que l'élève n'a pas touché la ligne à lire, tout le pied reste caché (comme avant), consigne et pavé compris. */
.diapo.interactive-mode.read-data-observation-pending .answer-dock *{visibility:hidden!important}
/* La carte « Comment on trouve » : exactement la place de la zone de travail. */
.carte-correction{overflow-y:auto;overscroll-behavior:contain;padding:9px 14px 10px;border:1.5px solid #f2c48d;border-radius:16px;background:#fffaf4;color:#0b2147;font-size:18px;line-height:1.3;text-align:left}
.carte-correction[hidden]{display:none!important}
.diapo.interactive-mode .stage.deborde{-webkit-mask-image:linear-gradient(#000 calc(100% - 40px),rgba(0,0,0,.22));mask-image:linear-gradient(#000 calc(100% - 40px),rgba(0,0,0,.22))}
.carte-correction.deborde{-webkit-mask-image:linear-gradient(#000 calc(100% - 28px),rgba(0,0,0,.18));mask-image:linear-gradient(#000 calc(100% - 28px),rgba(0,0,0,.18))}
.carte-titre{margin:0 0 4px;color:#9a4100;font-size:.84em;font-weight:900;letter-spacing:.01em}
.carte-etapes{margin:0;padding-left:1.25em;font-weight:750}
.carte-etapes li{margin:0;padding-left:.15em}.carte-etapes li+li{margin-top:3px}
.carte-etapes li::marker{color:#9a4100;font-weight:900}
.carte-reponse{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:100%;margin:0;text-align:center}
.carte-correction.sans-etapes{display:flex;flex-direction:column;justify-content:center}
.carte-correction.sans-etapes .carte-reponse{min-height:0}
.carte-reponse-mot{color:#42556b;font-size:.84em;font-weight:800}
.carte-reponse b{color:#087a55;font-size:1.45em;font-weight:900;line-height:1.15}
.carte-diagnostic{margin:6px 0 0;color:#7a3500;font-weight:750}
.carte-note{margin:5px 0 0;color:#42556b;font-size:.92em;font-weight:700}
.carte-correction .math-inline,.carte-correction .math-display{white-space:normal}
/* Passer à gauche (discret), Valider à droite (large, orange). Ils ne bougent jamais. */
.pied-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:8px;height:var(--actions-h)}
.pied-btn{min-width:0;height:100%;margin:0;padding:0 10px;border-radius:14px;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;font-weight:900;line-height:1.1;cursor:pointer;touch-action:manipulation;white-space:nowrap}
.pied-btn.passer{border:1.5px solid #c6d6e9;background:#fff;color:#42556b;font-size:1.02rem}
.pied-btn.valider{border:1px solid #e86100;background:#ff7a1a;color:#fff;font-size:1.22rem;box-shadow:0 3px 0 #c95300}
.pied-btn.valider:active{transform:translateY(1px);box-shadow:0 2px 0 #c95300}
.pied-btn.valider.attente{background:#ffb47a;border-color:#ffb47a;box-shadow:none;cursor:default}
.pied-btn:disabled{opacity:.42;cursor:default}
.pied-btn:focus-visible{outline:3px solid #0f6cf9;outline-offset:2px}
/* Après validation : la réponse de l'élève reste dans la case, barrée, la bonne réponse à côté en vert. */
.answer-slot.a-reponse-eleve{width:auto!important;gap:.28em;padding:0 .1em}
.reponse-eleve,.finish-given{position:relative;display:inline-block;color:#5b6b80;font-weight:700;text-decoration:none}
.reponse-eleve::after,.finish-given::after{content:"";position:absolute;left:-.1em;right:-.1em;top:52%;border-top:.09em solid #b42318;pointer-events:none}
.reponse-eleve-frac{margin-right:.3em;vertical-align:middle}.reponse-eleve-frac::after{transform:rotate(-28deg)}
.answer-slot.a-reponse-eleve strong{color:#087a55}
/* Le panneau d'aide se pose sur le pied ; la question reste visible au-dessus. */
.aide-panel{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;flex-direction:column;min-height:var(--pied-h,240px);max-height:min(64vh,calc(100vh - 120px));max-height:min(64dvh,calc(100dvh - 120px));padding:12px max(12px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));border-top:2px solid #6f97c6;border-radius:20px 20px 0 0;background:#fff;box-shadow:0 -14px 34px rgba(11,33,71,.16);font-family:Arial,"Helvetica Neue",Helvetica,sans-serif}
.aide-panel[hidden]{display:none!important}
.aide-scroll{flex:1 1 auto;min-height:0;width:min(100%,640px);margin:0 auto;overflow-y:auto;overscroll-behavior:contain}
.aide-title{display:flex;align-items:center;gap:7px;margin:0 0 8px;color:#073a75;font-size:1.08rem;font-weight:900}
.aide-title svg{width:21px;height:21px;flex:none}
.aide-steps{margin:0;padding-left:1.35em;color:#0b2147;font-size:18px;font-weight:750;line-height:1.35;text-align:left}
.aide-steps[hidden]{display:none}
.aide-steps li+li{margin-top:7px}
.aide-steps li::marker{color:#003b7a;font-weight:900}
.aide-more{display:block;min-height:44px;margin:10px 0 0;padding:8px 16px;border:1.5px solid #6f97c6;border-radius:12px;background:#eef5fd;color:#073a75;font-size:1rem;font-weight:850;cursor:pointer}
.aide-more[hidden]{display:none}
.aide-dessin{display:flex;flex-direction:column;align-items:stretch;gap:8px;margin-top:10px}
.aide-dessin[hidden]{display:none}
.aide-figure{width:100%;min-width:0}
.aide-dessin svg{display:block;width:min(100%,560px)!important;max-width:100%!important;height:auto!important;max-height:min(36vh,320px)!important;max-height:min(36dvh,320px)!important;margin:0 auto!important}
.aide-dessin svg.aide-svg-petit{display:inline-block;width:auto!important;margin:0!important}
.aide-groupe{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.aide-groupe-item{min-width:0;padding:6px 8px 8px;border:1.5px solid #d6e2f0;border-radius:12px;background:#fff}
.aide-etiquette{display:flex;align-items:center;justify-content:center;gap:.4em;color:#0b2147;font-size:1.05rem;font-weight:800;line-height:1.2}
.aide-groupe .relation-tile-help{min-height:0;margin-top:4px}
.aide-dessin .fraction-ops-help{margin:2px auto 0}
.divisibility-inspector{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;width:100%;max-width:520px;margin:0 auto}
.divisibility-inspector .divisibility-step{display:grid;grid-template-columns:32px minmax(0,1fr);gap:9px;align-items:start;padding:8px 10px;text-align:left}
.divisibility-step-number{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#0b6fc2;color:#fff;font-size:1rem;font-weight:950}
.divisibility-inspector .divisibility-step small{margin-top:3px;font-size:.84rem}
.divisibility-inspector .divisibility-digits{margin:6px auto 2px}
.divisibility-inspector .divisibility-sum{margin:8px auto 3px;font:900 1.3rem/1.1 "Cambria Math","Times New Roman",serif}
.aide-dessin .equal-sharing-help{height:auto;margin:0 auto 4px}
.aide-dessin .scientific-place-help{min-height:0;margin-top:2px}
.aide-dessin .scientific-place-equation{font-size:1.75rem}
.aide-dessin .scientific-condition-help{min-height:0;margin-top:4px}
.aide-dessin .scientific-condition{font-size:1.9rem}
.aide-dessin .fraction-ops-operation{flex-direction:column;gap:4px}
.aide-dessin .fraction-ops-operation>.fraction-ops-card,.aide-dessin .fraction-ops-stack>.fraction-ops-card{width:100%;flex:none}
.aide-dessin .fraction-ops-label{min-height:0;font-size:1.15rem}
.aide-dessin .fraction-ops-stack>.fraction-ops-arrow+.fraction-ops-card{margin-top:2px}
.aide-back{flex:none;width:min(100%,560px);height:var(--aide-back-h,52px);margin:10px auto 0;border:1px solid #003b7a;border-radius:14px;background:#003b7a;color:#fff;font-size:1.12rem;font-weight:900;cursor:pointer;touch-action:manipulation}
.aide-back:focus-visible{outline:3px solid #9cc0ea;outline-offset:2px}
/* Quitter la série ? */
.quit-modal{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(11,33,71,.48)}
.quit-modal[hidden]{display:none!important}
.quit-card{width:min(400px,100%);padding:22px 20px 18px;border-radius:20px;background:#fff;text-align:center;box-shadow:0 24px 70px rgba(11,33,71,.28)}
.quit-card h2{margin:0 0 6px;color:#073a75;font-size:1.4rem}
.quit-card p{margin:0 0 16px;color:#42556b;font-size:1rem;font-weight:700}
.quit-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.quit-actions .btn{min-height:50px;padding:10px 12px}
.quit-actions .btn:first-child{border-color:#003b7a;background:#003b7a;color:#fff}
.quit-confirm{color:#42556b}
/* Fin de série : le score, les boutons, puis « À revoir ». */
.interactive-finish{width:min(100%,680px);margin:4vh auto 16px}
.diapo .interactive-finish-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch;gap:10px;width:min(100%,480px);margin:0 auto}
.diapo .interactive-finish-actions .btn,.diapo .interactive-finish-actions .btn.primary{width:100%;min-width:0;min-height:50px;padding:10px 12px;line-height:1.15}
.diapo .interactive-finish-actions .btn.primary,.diapo .interactive-finish-actions .btn.primary:first-child~.btn:last-child:nth-child(even){grid-column:1/-1}
.finish-misses{margin:22px 0 0;text-align:left}
.finish-misses h3{margin:0 0 8px;color:#073a75;font-size:1.12rem;font-weight:900}
.finish-list{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.finish-list li{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:10px;padding:8px 12px;border:1.5px solid var(--border);border-radius:12px;background:#fff}
.finish-num{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#eef4fc;color:#073a75;font-size:.92rem;font-weight:900}
.finish-prompt{min-width:0;color:#24364f;font-size:1rem;font-weight:700;line-height:1.25;overflow-wrap:anywhere}
.finish-answers{display:inline-flex;align-items:center;justify-content:flex-end;gap:10px;font-size:1.1rem;white-space:nowrap}
.finish-skip{color:#8a9bb0;font-size:.88em;font-style:italic;font-weight:700}
.finish-expected{color:#087a55;font-weight:900}
.finish-answers .frac{font-size:.85em}
/* Options de QCM : une seule police (celle de l'interface), une seule taille, la lettre suivie d'une espace, au moins 56 px de haut. */
.diapo{--opt-taille:clamp(1.3rem,1.6vw,1.6rem)}
.diapo .options.options-lot-t{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;width:min(100%,780px);max-width:780px;margin:14px auto 0}
.diapo .options.options-lot-t.options-courtes{grid-template-columns:repeat(2,minmax(0,1fr));width:min(100%,560px)}
.diapo .options.options-lot-t.options-moyennes{width:min(100%,780px)}
@media(min-width:601px){.diapo .options.options-lot-t.options-2col{grid-template-columns:repeat(2,minmax(0,1fr));width:min(100%,780px)}}
.diapo .options.options-lot-t>.opt.opt-lettree{display:flex;align-items:center;justify-content:flex-start;gap:0;min-height:56px;margin:0;padding:10px 16px;border-radius:14px;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;font-size:var(--opt-taille);font-weight:700;line-height:1.25;letter-spacing:0;text-align:left}
.diapo .options.options-lot-t.options-courtes>.opt.opt-lettree{justify-content:center}
.diapo .opt.opt-lettree .opt-letter{flex:none;margin-right:.45em;color:#073a75;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;font-size:1em;font-weight:900;line-height:1.25}
.diapo .opt.opt-lettree .opt-body{min-width:0;font-family:inherit;font-size:1em;font-weight:inherit}
.diapo .options.options-lot-t .opt-body *{font-family:inherit!important}
/* Diaporama : la démarche apparaît étape par étape ; les étapes à venir gardent leur place. */
.diapo-etapes{width:min(100%,1100px);margin:16px auto 0;padding:12px 22px 14px;border:2px solid #f2c48d;border-radius:18px;background:#fffaf4;color:#0b2147;font-size:clamp(1.25rem,1.9vw,2.4rem);line-height:1.3;text-align:left}
.diapo-etapes-titre{margin:0 0 4px;color:#9a4100;font-size:.72em;font-weight:900}
.diapo-etapes ol{margin:0;padding-left:1.4em;font-weight:750}
.diapo-etapes li+li{margin-top:4px}
.diapo-etapes li::marker{color:#9a4100;font-weight:900}
.diapo-etape.is-hidden,.diapo-etape-note.is-hidden{visibility:hidden}
.diapo-etape-note{margin:6px 0 0;color:#42556b;font-size:.85em;font-weight:700}
/* Ordinateur et grande tablette : le pied s'étale en largeur (zone de travail | Passer, Valider) pour laisser la hauteur à la question. */
@media(min-width:900px){
.answer-dock{--verdict-h:34px;--actions-h:54px;--carte-h:clamp(116px,19dvh,160px);--zone-reduite:96px;--zone-w:min(720px,56vw);--actions-w:300px;padding-bottom:max(10px,env(safe-area-inset-bottom))}
.answer-dock.avec-pave{--zone-w:min(460px,44vw)}
.pied{display:grid;grid-template-columns:var(--zone-w) var(--actions-w);justify-content:center;align-items:end;column-gap:16px;width:auto}
.verdict{font-size:1.08rem}
.carte-correction{padding:7px 14px 8px;font-size:19px;line-height:1.25}
.carte-titre{margin-bottom:2px}
.aide-scroll{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"titre dessin" "etapes dessin" "plus dessin" "vide dessin";grid-template-rows:auto auto auto 1fr;column-gap:28px;width:min(100%,1100px)}
.aide-title{grid-area:titre}.aide-steps{grid-area:etapes}.aide-more{grid-area:plus;justify-self:start}
.aide-dessin{grid-area:dessin;width:min(52vw,560px);margin-top:0}
.aide-dessin svg{max-height:min(34vh,340px)!important;max-height:min(34dvh,340px)!important}
.aide-scroll:has(.aide-steps[hidden]){grid-template-columns:minmax(0,1fr);grid-template-areas:"titre" "dessin" "plus" "vide";justify-items:center}
.aide-scroll:has(.aide-steps[hidden]) .aide-title{justify-self:center}
.aide-back{width:min(100%,360px)}
}
/* Téléphone */
@media(max-width:600px){
.diapo{--opt-taille:1.15rem}
.diapo.interactive-mode>.top{height:56px;gap:6px;padding:5px max(8px,env(safe-area-inset-right)) 5px max(8px,env(safe-area-inset-left))}
.diapo.interactive-mode .top .btn{min-height:44px}
.diapo.interactive-mode .menu-btn{padding:0 10px;border-radius:12px;font-size:.86rem}
.diapo.interactive-mode .right{gap:5px}
.diapo.interactive-mode .interactive-summary{font-size:.95rem}
.diapo.interactive-mode .interactive-score{padding:5px 8px;font-size:.88rem}
.diapo.interactive-mode .course-btn,.diapo.interactive-mode .aide-btn{flex-direction:column;gap:1px;width:48px;min-height:44px;height:44px;padding:2px 0 3px;border-radius:12px;font-size:.66rem;line-height:1}
.diapo.interactive-mode .course-btn svg,.diapo.interactive-mode .aide-btn svg{width:19px;height:19px}
.diapo.interactive-mode .stage{padding-top:6px}
.pave .key{font-size:1.45rem}
.zone-consigne{font-size:.98rem}
.finish-list li{grid-template-columns:28px minmax(0,1fr);row-gap:4px}
.finish-num{width:28px;height:28px}
.finish-answers{grid-column:2;justify-content:flex-start}
.interactive-finish{margin-top:2vh}
.diapo-etapes{padding:10px 14px}
}
@media(max-width:360px){
.diapo.interactive-mode .menu-btn{padding:0 8px;font-size:.8rem}
.diapo.interactive-mode .interactive-summary{font-size:.88rem}
.diapo.interactive-mode .interactive-score{padding:4px 6px;font-size:.82rem}
.diapo.interactive-mode .course-btn,.diapo.interactive-mode .aide-btn{width:44px}
.verdict{font-size:.92rem}
.pied-btn.valider{font-size:1.12rem}
.carte-correction{padding:7px 10px}
}
/* Relecture — navigateurs sans l'unité dvh (iOS avant 15.4, Chrome avant
   108) : une variable qui la contient devient invalide là où elle est
   employée, et les touches tombaient à 23 px de haut. Repli en vh. */
@supports not (height:1dvh){
.answer-dock{--touche-h:clamp(44px,6.5vh,56px);--actions-h:clamp(48px,6.4vh,56px);--carte-h:clamp(116px,17vh,150px);--zone-reduite:clamp(80px,11vh,96px);--carte-min-qcm:clamp(92px,14vh,120px)}
@media(min-width:900px){.answer-dock{--carte-h:clamp(116px,19vh,160px)}}
}
/* Relecture — téléphone : options de QCM un peu plus serrées (52 px, soit
   44 px encore après la réduction × 0,85) ; écran court (barre d'adresse
   visible, 320 × 640) : en-tête, verdict, marges et Passer | Valider se
   resserrent. Les touches du pavé ne descendent jamais sous 44 px. */
@media(max-width:600px){
.diapo .options.options-lot-t{gap:8px}
.diapo .options.options-lot-t>.opt.opt-lettree{min-height:52px;padding:8px 14px}
}
@media(max-width:899px) and (max-height:740px){
.answer-dock{--verdict-h:30px;--actions-h:44px;padding-bottom:max(6px,env(safe-area-inset-bottom))}
.pied{gap:6px}
.diapo.interactive-mode>.top{height:52px;padding-top:4px;padding-bottom:4px}
.diapo.interactive-mode .stage{padding-top:4px;padding-bottom:6px}
}
/* Relecture — téléphone tenu en largeur (tactile, hauteur ≤ 500 px) : le
   pied passe à droite de la question (verdict, pavé, Passer | Valider en
   colonne) ; empilé, il ne laissait que 110 px à la question. Le panneau
   d'aide se pose sur cette colonne. */
@media(orientation:landscape) and (max-height:500px) and (pointer:coarse){
.diapo.interactive-mode:not(.finished){display:grid;grid-template-columns:minmax(0,1fr) min(44vw,360px);grid-template-rows:auto minmax(0,1fr)}
.diapo.interactive-mode:not(.finished)>.top{grid-column:1/-1;grid-row:1;height:52px;padding-top:4px;padding-bottom:4px}
.diapo.interactive-mode:not(.finished) .stage{grid-column:1;grid-row:2;min-height:0;padding-top:4px;padding-bottom:6px}
.diapo.interactive-mode:not(.finished) .answer-dock{grid-column:2;grid-row:2;display:flex;flex-direction:column;justify-content:flex-end;min-height:0;--verdict-h:30px;--actions-h:44px;padding-top:4px;border-top:0;border-left:1px solid var(--border)}
.diapo.interactive-mode:not(.finished) .pied{display:flex;flex-direction:column;gap:6px;width:100%}
.diapo.interactive-mode .aide-panel{left:auto;top:52px;width:min(44vw,360px);min-height:0;max-height:none;border-top:0;border-left:2px solid #6f97c6}
.diapo.interactive-mode .aide-scroll{display:block;width:100%}
.diapo.interactive-mode .aide-dessin{width:auto;margin-top:10px}
.diapo.interactive-mode .aide-back{width:100%}
}
/* Lot T2 — ordinateur (fenêtre d'au moins 1100 × 501 px) : l'aide se pose à droite de la question, entre l'en-tête et le pied ; la question se range à gauche (réduite si besoin, voir fitSlideForAide) et le pied reste visible. */
@media(min-width:1100px) and (min-height:501px){
.diapo.interactive-mode{--aide-w:clamp(340px,30vw,440px)}
.diapo.interactive-mode.aide-ouverte:not(.aide-outil) .stage{padding-right:calc(var(--aide-w) + 18px)}
.diapo.interactive-mode:not(.aide-outil) .aide-panel{top:var(--entete-h,64px);bottom:var(--pied-h,164px);left:auto;right:0;width:var(--aide-w);min-height:0;max-height:none;padding:14px 16px 12px;border-top:0;border-left:2px solid #6f97c6;border-radius:20px 0 0 20px;box-shadow:-12px 0 30px rgba(11,33,71,.12)}
.diapo.interactive-mode .aide-scroll{display:block;width:100%}
.diapo.interactive-mode .aide-dessin{width:auto;margin-top:10px}
.diapo.interactive-mode .aide-dessin svg{max-height:min(30vh,300px)!important;max-height:min(30dvh,300px)!important}
.diapo.interactive-mode .aide-back{width:100%;height:48px}
.diapo.interactive-mode.aide-outil .aide-panel{max-height:calc(100vh - var(--entete-h,64px) - 70px);max-height:calc(100dvh - var(--entete-h,64px) - 70px)}
.diapo.interactive-mode.aide-outil .aide-dessin{padding-bottom:18px}
.diapo.interactive-mode.aide-outil .aide-scroll{display:block;width:min(100%,1240px)}
.diapo.interactive-mode.aide-outil .aide-dessin{width:100%}
.diapo.interactive-mode.aide-outil .aide-dessin .place-value-tool{width:min(98%,1180px)}
}
/* 17/10 : au diaporama « Avec aide », le dessin d'aide sous la question. */
.diapo-aide{display:flex;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px 28px;width:min(100%,1100px);margin:clamp(10px,2vh,22px) auto 0}
.diapo-aide>*{flex:1 1 360px;min-width:0;max-width:100%}
.diapo-aide svg{display:block;width:auto!important;min-width:min(100%,360px);max-width:min(100%,640px)!important;height:auto!important;max-height:min(34vh,360px)!important;margin:0 auto}
.diapo-aide .divisibility-inspector{max-width:760px;zoom:1.35}
.diapo-aide svg.aide-svg-petit{display:inline-block;width:auto!important;max-height:none!important}
/* Projection (diaporama) : la correction en grand. */
@media(min-width:1600px){.diapo:not(.interactive-mode){--opt-taille:1.6rem}}
@media print{.diapo{--stage-top:20px;--stage-x:20px;--stage-bottom:20px;height:auto;min-height:100vh;overflow:visible}.top{display:none}.stage{min-height:auto;overflow:visible;padding:var(--stage-top) var(--stage-x) var(--stage-bottom)}}
</style>
</head>
<body>
<div class="diapo" id="diapo">
<header class="top">
<div class="left"><button class="btn menu-btn" type="button" onclick="demanderRetourMenu()" aria-label="Retour au menu" title="Retour au menu"><span aria-hidden="true">←</span> Menu</button><button class="btn prev-btn presentation-only" type="button" onclick="prev()" aria-label="Question précédente">← Précédent</button></div>
<div class="navnums presentation-only" id="navnums"></div>
<div class="mobile-counter presentation-only" id="mobileCounter"></div>
<div class="interactive-summary" id="interactiveSummary"><span id="interactiveCounter"></span></div>
<div class="right"><span class="interactive-score" id="interactiveScore"></span><button class="btn keyboard-toggle" id="keyboardToggle" type="button" aria-label="Afficher le pavé" aria-pressed="false" title="Afficher le pavé" onclick="toggleKeypad()" hidden><svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 9h1M10 9h1M13.5 9h1M17 9h1M6.5 12.5h1M10 12.5h1M13.5 12.5h1M17 12.5h1M8 16h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><button class="btn fullscreen-btn" type="button" aria-label="Plein écran" title="Plein écran" onclick="toggleFS()"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="course-btn" id="courseBtn" type="button" onclick="openCourse()" aria-label="Ouvrir le cours" title="Ouvrir le cours" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.4c2.8-.9 5.3-.45 7.5 1.25v12c-2.2-1.7-4.7-2.15-7.5-1.25zM20.5 5.4c-2.8-.9-5.3-.45-7.5 1.25v12c2.2-1.7 4.7-2.15 7.5-1.25z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6.8v11.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Cours</span></button><button class="aide-btn" id="aideBtn" type="button" onclick="toggleAide()" aria-label="Ouvrir l’aide" title="Aide" aria-expanded="false" aria-controls="aidePanel" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.55 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.55 1.1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Aide</span></button><button class="btn primary presentation-only" id="nextBtn" onclick="next()">Correction →</button></div>
<div class="progress-track" aria-hidden="true"><span class="progress-fill" id="progressFill"></span></div>
</header>
<main class="stage" id="stage"><section class="slide" id="slide"></section></main>
<section class="answer-dock" id="answerDock" aria-label="Réponse" hidden>
  <div class="verdict" id="answerFeedback" aria-live="polite"></div>
  <div class="pied" id="pied">
    <div class="zone-travail" id="zoneTravail">
      <div class="pave" id="keypad" role="group" aria-label="Pavé"></div>
      <div class="zone-consigne" id="answerKind"></div>
      <div class="carte-correction" id="correctionCard" hidden></div>
    </div>
    <div class="pied-actions">
      <button class="pied-btn passer" id="skipAction" type="button" onclick="skipInteractive()">Passer</button>
      <button class="pied-btn valider" id="interactiveAction" type="button" onclick="submitInteractive()">Valider</button>
    </div>
  </div>
</section>
<section class="aide-panel" id="aidePanel" role="dialog" aria-labelledby="aideTitle" hidden>
  <div class="aide-scroll">
    <h2 class="aide-title" id="aideTitle"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.55 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.55 1.1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Aide</h2>
    <ol class="aide-steps" id="aideSteps"></ol>
    <button class="aide-more" id="aideMore" type="button" onclick="aideNextStep()" hidden>Un autre indice</button>
    <div class="aide-dessin" id="aideDessin"></div>
  </div>
  <button class="aide-back" type="button" onclick="closeAide()">Revenir à la question</button>
</section>
<div class="quit-modal" id="quitModal" onclick="if(event.target===this)closeQuit()" hidden>
  <section class="quit-card" role="alertdialog" aria-modal="true" aria-labelledby="quitTitle" aria-describedby="quitText">
    <h2 id="quitTitle">Quitter la série ?</h2>
    <p id="quitText">Tes réponses ne seront pas gardées.</p>
    <div class="quit-actions"><button class="btn" type="button" onclick="closeQuit()">Continuer</button><button class="btn quit-confirm" type="button" onclick="returnToMenu()">Quitter</button></div>
  </section>
</div>
<div class="course-modal" id="courseModal" onclick="if(event.target===this)closeCourse()" hidden>
  <section class="course-card" role="dialog" aria-modal="true" aria-labelledby="courseTitle">
    <button class="course-close" type="button" aria-label="Fermer le cours" onclick="closeCourse()">×</button>
    <h2 class="course-title" id="courseTitle"></h2>
    <div class="course-grid" id="courseGrid"></div>
  </section>
</div>
<div class="equation-detail-modal" id="equationDetailModal" onclick="if(event.target===this)closeEquationDetail()" hidden>
  <section class="equation-detail-card" role="dialog" aria-modal="true" aria-labelledby="equationDetailTitle">
    <button class="equation-detail-close" type="button" aria-label="Fermer la résolution détaillée" onclick="closeEquationDetail()">×</button>
    <h2 class="equation-detail-title" id="equationDetailTitle">Résolution détaillée</h2>
    <div id="equationDetailBody"></div>
  </section>
</div>
<div class="expand-correction-detail-modal" id="expandCorrectionDetailModal" onclick="if(event.target===this)closeExpandCorrectionDetail()" hidden>
  <section class="expand-correction-detail-card" role="dialog" aria-modal="true" aria-labelledby="expandCorrectionDetailTitle">
    <button class="expand-correction-detail-close" type="button" aria-label="Fermer la correction détaillée" onclick="closeExpandCorrectionDetail()">×</button>
    <h2 class="expand-correction-detail-title" id="expandCorrectionDetailTitle">Correction détaillée</h2>
    <div id="expandCorrectionDetailBody"></div>
  </section>
</div>
</div>
<script>
const seriesBank=${payload};
const experienceMode=${experiencePayload};
const menuUrl=${menuUrlPayload};
const placeValueCourseExamples=${placeValueCoursePayload};
const equationCourseExample=${equationCourseExamplePayload};
const equationCourseSplat=${equationCourseSplatPayload};
${beginTrackedPointerDrag.toString()}
${setupPlaceValueTools.toString()}
${setupReadDataTools.toString()}
${typographieSourceForPage()}
${lotTFracHtml.toString()}
${lotTValeurHtml.toString()}
${lotTPolynomeHtml.toString()}
${lotTTemplateHtml.toString()}
const interactiveMode=experienceMode==='interactive';
let seriesIndex=0;
let slides=seriesBank[seriesIndex]||[];
let idx=0;
let corr=false;
let interactiveValues=[];
let interactiveTouched=[];
let relativeBoardState=null;
let relativeBoardKey='';
let pythagorasSelectedToken=null;
let angleSumSelectedToken=null;
let angleSumPlacementValidated=false;
let decimalSelectedCard=null,decimalSuppressClickUntil=0;
let pythagorasSuppressClickUntil=0;
let angleSumSuppressClickUntil=0;
let activeSlotIndex=0;
let selectedOptions=new Set();
let interactiveLocked=false;
let correctCount=0;
let answeredCount=0;
let interactiveFinished=false;
let advanceTimer=null;
/* Lot T — coque commune. Le pavé suit le POINTEUR, pas la largeur : un
   doigt (téléphone, tablette) l'a toujours ; une souris tape au clavier et
   peut l'afficher avec le bouton clavier ; un grand écran tactile (TNI) l'a
   d'office. */
const coarsePointerMedia=window.matchMedia('(pointer: coarse)');
const tniMedia=window.matchMedia('(any-pointer: coarse) and (min-width: 1100px)');
// Lot T2 : assez large pour poser l'aide à droite de la question (même
// condition que le CSS du panneau).
const aideCoteMedia=window.matchMedia('(min-width: 1100px) and (min-height: 501px)');
const AIDE_OUTILS_EN_BAS='.place-value-tool,.conversion-tool';
function aideACote(){const diapo=document.getElementById('diapo');return interactiveMode&&aideCoteMedia.matches&&!(diapo&&diapo.classList.contains('aide-outil'));}
let keypadVisible=coarsePointerMedia.matches||tniMedia.matches;
let lockedAt=0;
const LECTURE_MIN_MS=700;
let unlockTimer=null;
let aideOpen=false,aideStep=0;
let stepReveal=0;
let results=[];
let fitKey='',fitZoom=1;
function demanderRetourMenu(){
 if(interactiveMode&&!interactiveFinished&&answeredCount>0){
   const modal=document.getElementById('quitModal');
   if(modal){modal.hidden=false;const button=modal.querySelector('.quit-actions .btn');if(button)button.focus();return;}
 }
 returnToMenu();
}
function closeQuit(){const modal=document.getElementById('quitModal');if(modal)modal.hidden=true;}
let retourMenuConfirme=false;
function returnToMenu(){
 retourMenuConfirme=true;
 if(history.state&&history.state.mathsgoView==='questionnaire'){history.back();return;}
 location.replace(menuUrl);
}
class AttemptRecorder{
 constructor(mode){this.mode=mode==='memory'?'memory':'disabled';this.attempts=[];}
 record(attempt){if(this.mode!=='memory')return false;this.attempts.push(JSON.parse(JSON.stringify(attempt)));return true;}
 list(){return this.attempts.map(attempt=>JSON.parse(JSON.stringify(attempt)));}
 clear(){this.attempts.length=0;}
}
const attemptRecorder=new AttemptRecorder(window.__MATHSGO_ATTEMPT_RECORDER_MODE__);
window.mathsgoAttemptRecorder=attemptRecorder;
let questionSession=null;
function currentQuestionKey(){
 const current=slides[idx];
 return current&&current.questionInstance?current.questionInstance.questionInstanceId:(seriesIndex+'-'+idx);
}
function pauseQuestionTimer(){
 if(questionSession&&questionSession.activeSince!==null){
   questionSession.activeMs+=Math.max(0,performance.now()-questionSession.activeSince);
   questionSession.activeSince=null;
 }
}
function resumeQuestionTimer(){
 if(interactiveMode&&!interactiveFinished&&!interactiveLocked&&document.visibilityState==='visible'&&questionSession&&questionSession.activeSince===null) questionSession.activeSince=performance.now();
}
function ensureQuestionSession(){
 const key=currentQuestionKey();
 if(!questionSession||questionSession.key!==key) questionSession={key,activeMs:0,activeSince:null,validations:0,helpKinds:new Set()};
 resumeQuestionTimer();
 return questionSession;
}
function markQuestionHelp(kind){
 const session=ensureQuestionSession();
 session.helpKinds.add(String(kind));
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseQuestionTimer();else resumeQuestionTimer();});
function courseFraction(n,d){return '<span class="course-frac"><span>'+n+'</span><span>'+d+'</span></span>';}
// A0 (15/10/2026) : les dessins du cours de ta version, remis (1/3 = 2/6 ; partager 12 en 3).
function courseFractionVisual(){return '<svg class="course-visual" viewBox="0 0 390 150" role="img" aria-label="Un tiers devient deux sixièmes"><text x="45" y="25" fill="#17384d" font-size="16" font-weight="850">1/3</text><g transform="translate(45 38)"><rect width="270" height="38" fill="#f5eaff" stroke="#7042a3" stroke-width="3"/><rect width="90" height="38" fill="#d9b8ff"/><path d="M90 0V38M180 0V38" stroke="#7042a3" stroke-width="2"/></g><path d="M45 99H315" stroke="#7042a3" stroke-width="3"/><path d="M90 82V120M135 82V120M180 82V120M225 82V120M270 82V120" stroke="#7042a3" stroke-width="1.8"/><rect x="45" y="82" width="90" height="38" fill="#d9b8ff" opacity=".82"/><text x="332" y="109" fill="#087a55" font-size="18" font-weight="900">2/6</text><path d="M333 54L350 72L333 90" fill="none" stroke="#e86100" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function courseDivisibilitySharingVisual(){
 const component=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('arithmetic.equal-sharing-board');
 return component?'<div class="course-divisibility-share">'+component.render({shares:3,total:12,share:4,showTotal:true},true)+'</div>':'';
}
// dnb_28 : le sac de l'exemple du cours (3 boules rouges R, 5 boules vertes V ;
// les lettres gardent la différence lisible en noir et blanc).
function courseProbabilityBagVisual(){
  const balls=[...Array(3).fill(['#f4a3a3','R']),...Array(5).fill(['#a8dcae','V'])];
  return '<svg class="course-visual course-probability-bag" viewBox="0 0 304 44" role="img" aria-label="3 boules rouges et 5 boules vertes">'+balls.map(([fill,letter],i)=>'<g transform="translate('+(22+i*37)+' 22)"><circle r="16" fill="'+fill+'" stroke="#33415c" stroke-width="2"/><text y="6" text-anchor="middle" font-size="16" font-weight="800" fill="#13263f">'+letter+'</text></g>').join('')+'</svg>';
}
function courseCoordinatesVisual(){return '<svg xmlns="http://www.w3.org/2000/svg" class="coordinate-figure-svg course-visual c15-course-visual" viewBox="0 0 442 392" width="442" height="392" style="width:min(100%,400px);max-height:none;height:auto" role="img" aria-label="Exemple : A a pour coordonnées moins 2 et 3"><rect x="40" y="30" width="368" height="322" fill="#ffffff"/><g class="coordinate-grid"><line x1="40" y1="30" x2="40" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="86" y1="30" x2="86" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="132" y1="30" x2="132" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="178" y1="30" x2="178" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="224" y1="30" x2="224" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="270" y1="30" x2="270" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="316" y1="30" x2="316" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="362" y1="30" x2="362" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="408" y1="30" x2="408" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="352" x2="408" y2="352" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="306" x2="408" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="260" x2="408" y2="260" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="214" x2="408" y2="214" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="168" x2="408" y2="168" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="122" x2="408" y2="122" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="76" x2="408" y2="76" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="30" x2="408" y2="30" stroke="#cfd8e3" stroke-width="1.1" /></g><line x1="40" y1="214" x2="422" y2="214" stroke="#17384d" stroke-width="2.4" data-axe="abscisses"/><polygon points="426,214 414,220 414,208" fill="#17384d"/><line x1="224" y1="352" x2="224" y2="16" stroke="#17384d" stroke-width="2.4" data-axe="ordonnees"/><polygon points="224,12 230,24 218,24" fill="#17384d"/><line x1="40" y1="209" x2="40" y2="219" stroke="#17384d" stroke-width="1.8" /><line x1="86" y1="209" x2="86" y2="219" stroke="#17384d" stroke-width="1.8" /><line x1="132" y1="209" x2="132" y2="219" stroke="#17384d" stroke-width="1.8" /><line x1="178" y1="209" x2="178" y2="219" stroke="#17384d" stroke-width="1.8" /><line x1="224" y1="209" x2="224" y2="219" stroke="#17384d" stroke-width="1.8" /><line x1="270" y1="209" x2="270" y2="219" stroke="#17384d" stroke-width="1.8" /><line x1="316" y1="209" x2="316" y2="219" stroke="#17384d" stroke-width="1.8" /><line x1="362" y1="209" x2="362" y2="219" stroke="#17384d" stroke-width="1.8" /><line x1="219" y1="352" x2="229" y2="352" stroke="#17384d" stroke-width="1.8" /><line x1="219" y1="306" x2="229" y2="306" stroke="#17384d" stroke-width="1.8" /><line x1="219" y1="260" x2="229" y2="260" stroke="#17384d" stroke-width="1.8" /><line x1="219" y1="214" x2="229" y2="214" stroke="#17384d" stroke-width="1.8" /><line x1="219" y1="168" x2="229" y2="168" stroke="#17384d" stroke-width="1.8" /><line x1="219" y1="122" x2="229" y2="122" stroke="#17384d" stroke-width="1.8" /><line x1="219" y1="76" x2="229" y2="76" stroke="#17384d" stroke-width="1.8" /><line x1="132" y1="76" x2="132" y2="214" stroke="#e86a00" stroke-width="3.2" class="coordinate-guide coordinate-guide-x" stroke-dasharray="10 6" stroke-linecap="round"/><circle cx="132" cy="214" r="5.5" fill="#ffffff" stroke="#e86a00" stroke-width="3"/><line x1="132" y1="76" x2="224" y2="76" stroke="#079c96" stroke-width="3.2" class="coordinate-guide coordinate-guide-y" stroke-dasharray="3 5" stroke-linecap="round"/><circle cx="224" cy="76" r="5.5" fill="#ffffff" stroke="#079c96" stroke-width="3"/><text x="40" y="240" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−4</text><text x="86" y="240" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−3</text><rect x="115.6" y="219.27" width="32.8" height="29.22" rx="8" fill="#fff" stroke="#e86a00" stroke-width="3"/><text x="132" y="240" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="800" fill="#a84a00" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−2</text><text x="178" y="240" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−1</text><text x="270" y="240" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">1</text><text x="316" y="240" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">2</text><text x="362" y="240" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">3</text><text x="408" y="240" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">4</text><text x="215" y="359.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−3</text><text x="215" y="313.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−2</text><text x="215" y="267.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−1</text><text x="215" y="175.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">1</text><text x="215" y="129.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">2</text><rect x="198.6" y="62.47" width="20.4" height="29.22" rx="8" fill="#fff" stroke="#079c96" stroke-width="3"/><text x="215" y="83.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="800" fill="#00706b" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">3</text><text x="215" y="37.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">4</text><text x="216" y="240" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">0</text><g class="coordinate-point-marker"><line x1="125.5" y1="69.5" x2="138.5" y2="82.5" stroke="#ffffff" stroke-width="7.5" stroke-linecap="round"/><line x1="125.5" y1="82.5" x2="138.5" y2="69.5" stroke="#ffffff" stroke-width="7.5" stroke-linecap="round"/><line x1="125.5" y1="69.5" x2="138.5" y2="82.5" stroke="#b3261e" stroke-width="3.4" stroke-linecap="round"/><line x1="125.5" y1="82.5" x2="138.5" y2="69.5" stroke="#b3261e" stroke-width="3.4" stroke-linecap="round"/></g><text class="coordinate-point-label" x="132" y="111" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-size="25" font-weight="700" font-style="italic" fill="#b3261e" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">A</text></svg>';}
function courseCoordinatesPlacementVisual(){return '<svg xmlns="http://www.w3.org/2000/svg" class="coordinate-figure-svg course-visual c15-course-visual" viewBox="0 0 350 346" width="350" height="346" style="width:min(100%,330px);max-height:none;height:auto" role="img" aria-label="Placer B : 2 vers la droite puis 1 vers le bas"><rect x="40" y="30" width="276" height="276" fill="#ffffff"/><g class="coordinate-grid"><line x1="40" y1="30" x2="40" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="86" y1="30" x2="86" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="132" y1="30" x2="132" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="178" y1="30" x2="178" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="224" y1="30" x2="224" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="270" y1="30" x2="270" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="316" y1="30" x2="316" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="306" x2="316" y2="306" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="260" x2="316" y2="260" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="214" x2="316" y2="214" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="168" x2="316" y2="168" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="122" x2="316" y2="122" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="76" x2="316" y2="76" stroke="#cfd8e3" stroke-width="1.1" /><line x1="40" y1="30" x2="316" y2="30" stroke="#cfd8e3" stroke-width="1.1" /></g><line x1="40" y1="168" x2="330" y2="168" stroke="#17384d" stroke-width="2.4" data-axe="abscisses"/><polygon points="334,168 322,174 322,162" fill="#17384d"/><line x1="178" y1="306" x2="178" y2="16" stroke="#17384d" stroke-width="2.4" data-axe="ordonnees"/><polygon points="178,12 184,24 172,24" fill="#17384d"/><line x1="40" y1="163" x2="40" y2="173" stroke="#17384d" stroke-width="1.8" /><line x1="86" y1="163" x2="86" y2="173" stroke="#17384d" stroke-width="1.8" /><line x1="132" y1="163" x2="132" y2="173" stroke="#17384d" stroke-width="1.8" /><line x1="178" y1="163" x2="178" y2="173" stroke="#17384d" stroke-width="1.8" /><line x1="224" y1="163" x2="224" y2="173" stroke="#17384d" stroke-width="1.8" /><line x1="270" y1="163" x2="270" y2="173" stroke="#17384d" stroke-width="1.8" /><line x1="173" y1="306" x2="183" y2="306" stroke="#17384d" stroke-width="1.8" /><line x1="173" y1="260" x2="183" y2="260" stroke="#17384d" stroke-width="1.8" /><line x1="173" y1="214" x2="183" y2="214" stroke="#17384d" stroke-width="1.8" /><line x1="173" y1="168" x2="183" y2="168" stroke="#17384d" stroke-width="1.8" /><line x1="173" y1="122" x2="183" y2="122" stroke="#17384d" stroke-width="1.8" /><line x1="173" y1="76" x2="183" y2="76" stroke="#17384d" stroke-width="1.8" /><circle cx="178" cy="168" r="8" fill="none" stroke="#17384d" stroke-width="2.4" stroke-dasharray="3 3"/><line x1="178" y1="168" x2="261" y2="168" stroke="#e86a00" stroke-width="5" class="coordinate-path-x" stroke-linecap="round"/><polygon points="270,168 256,175 256,161" fill="#e86a00"/><line x1="270" y1="168" x2="270" y2="205" stroke="#079c96" stroke-width="5" class="coordinate-path-y" stroke-linecap="round"/><polygon points="270,214 263,200 277,200" fill="#079c96"/><text x="40" y="194" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−3</text><text x="86" y="194" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−2</text><text x="132" y="194" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−1</text><text x="224" y="194" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">1</text><text x="270" y="194" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">2</text><text x="316" y="194" text-anchor="middle" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">3</text><text x="169" y="313.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−3</text><text x="169" y="267.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−2</text><text x="169" y="221.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">−1</text><text x="169" y="129.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">1</text><text x="169" y="83.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">2</text><text x="169" y="37.2" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">3</text><text x="170" y="194" text-anchor="end" font-family="Trebuchet MS,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#17384d" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">0</text><g class="coordinate-point-marker"><line x1="263.5" y1="207.5" x2="276.5" y2="220.5" stroke="#ffffff" stroke-width="7.5" stroke-linecap="round"/><line x1="263.5" y1="220.5" x2="276.5" y2="207.5" stroke="#ffffff" stroke-width="7.5" stroke-linecap="round"/><line x1="263.5" y1="207.5" x2="276.5" y2="220.5" stroke="#0b7a55" stroke-width="3.4" stroke-linecap="round"/><line x1="263.5" y1="220.5" x2="276.5" y2="207.5" stroke="#0b7a55" stroke-width="3.4" stroke-linecap="round"/></g><text class="coordinate-point-label" x="270" y="249" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-size="25" font-weight="700" font-style="italic" fill="#0b7a55" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">B</text></svg>';}
function courseRelationVisual(){return '<svg class="course-visual" viewBox="0 0 390 145" role="img" aria-label="Schéma en barres du double et de la moitié"><text x="22" y="38" fill="#17384d" font-size="16" font-weight="850">n</text><rect x="65" y="15" width="125" height="38" rx="5" fill="#d9ecff" stroke="#1f5f8b" stroke-width="2.5"/><text x="22" y="103" fill="#17384d" font-size="16" font-weight="850">2n</text><rect x="65" y="78" width="125" height="38" rx="5" fill="#d9ecff" stroke="#1f5f8b" stroke-width="2.5"/><rect x="190" y="78" width="125" height="38" rx="5" fill="#d9ecff" stroke="#1f5f8b" stroke-width="2.5"/><text x="127" y="40" text-anchor="middle" fill="#17384d" font-size="17">une part</text><text x="190" y="140" text-anchor="middle" fill="#087a55" font-size="17" font-weight="850">le double = deux fois la même part</text></svg>';}
function courseTriangleBarVisual(){return '<svg class="course-visual" viewBox="0 0 390 125" role="img" aria-label="Les trois angles du triangle forment une barre de cent quatre-vingts degrés"><text x="195" y="20" fill="#17384d" font-size="17" font-weight="850" text-anchor="middle">180°</text><rect x="25" y="36" width="340" height="50" rx="7" fill="#fff" stroke="#17384d" stroke-width="2.5"/><rect x="25" y="36" width="110" height="50" rx="5" fill="#f9c7b1"/><rect x="135" y="36" width="127" height="50" fill="#cfe5ff"/><rect x="262" y="36" width="103" height="50" rx="5" fill="#d8f2e7"/><path d="M135 36V86M262 36V86" stroke="#17384d" stroke-width="2"/><text x="80" y="68" text-anchor="middle" fill="#7a3500" font-size="18" font-weight="850">58°</text><text x="198" y="68" text-anchor="middle" fill="#174b78" font-size="18" font-weight="850">67°</text><text x="313" y="68" text-anchor="middle" fill="#087a55" font-size="18" font-weight="850">55°</text><text x="195" y="113" text-anchor="middle" fill="#17384d" font-size="17">58° + 67° + 55° = 180°</text></svg>';}
function courseShapeVisual(kind){var body=kind==='triangle'?'<path d="M54 98L125 25L196 98Z" fill="#e8f2ff" stroke="#1f5f8b" stroke-width="3"/><path d="M125 25V98" stroke="#e86100" stroke-width="2" stroke-dasharray="5 4"/><text x="132" y="67" fill="#9a4100" font-size="15">h</text><text x="125" y="118" text-anchor="middle" fill="#17384d" font-size="15">base</text>':kind==='disk'?'<circle cx="125" cy="65" r="48" fill="#e8f7f2" stroke="#087a55" stroke-width="3"/><line x1="125" y1="65" x2="173" y2="65" stroke="#e86100" stroke-width="3"/><text x="150" y="57" fill="#9a4100" font-size="15">r</text>':kind==='square'?'<rect x="70" y="18" width="110" height="96" fill="#fff4dd" stroke="#8a5a00" stroke-width="3"/><text x="125" y="132" text-anchor="middle" fill="#17384d" font-size="15">côté</text>':'<rect x="45" y="30" width="160" height="75" fill="#e8f2ff" stroke="#1f5f8b" stroke-width="3"/><text x="125" y="125" text-anchor="middle" fill="#17384d" font-size="15">longueur</text><text x="217" y="72" fill="#17384d" font-size="15">largeur</text>';return '<svg class="course-visual" viewBox="0 0 250 145" role="img" aria-label="Figure et dimensions utiles">'+body+'</svg>';}
function courseSolidVisual(kind){var body=kind==='cylinder'?'<ellipse cx="125" cy="30" rx="56" ry="17" fill="#e8f8ff" stroke="#006b8f" stroke-width="3"/><path d="M69 30V105M181 30V105M69 105A56 17 0 0 0 181 105" fill="#e8f8ff" stroke="#006b8f" stroke-width="3"/><path d="M69 105A56 17 0 0 1 181 105" fill="none" stroke="#006b8f" stroke-width="2" stroke-dasharray="5 4"/>':kind==='prism'?'<path d="M48 96L88 30L125 96ZM125 96L178 76L141 12L88 30M125 96L178 76M88 30L141 12" fill="#eef8ee" stroke="#246b24" stroke-width="3"/>':kind==='cube'?'<path d="M64 45H145V122H64ZM64 45L98 18H178V94L145 122M145 45L178 18" fill="#e8f2ff" stroke="#1f4e79" stroke-width="3"/>':'<path d="M42 49H151V120H42ZM42 49L83 20H203V91L151 120M151 49L203 20" fill="#fff4dd" stroke="#8a5a00" stroke-width="3"/>';return '<svg class="course-visual" viewBox="0 0 250 145" role="img" aria-label="Solide et dimensions utiles">'+body+'</svg>';}
function courseTransformationVisual(kind){
 var guide='',image='';
 if(kind==='axial'){
   guide='<line x1="195" y1="10" x2="195" y2="155" stroke="#e86100" stroke-width="3" stroke-dasharray="7 5"/>';
   image='<path d="M335 105L295 45L255 85L275 125Z" fill="#d8f2e7" stroke="#087a55" stroke-width="3"/>';
 }else if(kind==='central'){
   guide='<circle cx="195" cy="85" r="6" fill="#e86100"/><text x="205" y="80" fill="#9a4100" font-size="16" font-weight="850">O</text><path d="M138 126L252 44" stroke="#8d99aa" stroke-width="2" stroke-dasharray="6 5"/>';
   image='<path d="M335 65L295 125L255 85L275 45Z" fill="#d8f2e7" stroke="#087a55" stroke-width="3"/>';
 }else{
   image='<path d="M235 65L275 5L315 45L295 85Z" fill="#d8f2e7" stroke="#087a55" stroke-width="3"/><path d="M145 86L220 45" stroke="#e86100" stroke-width="3" marker-end="url(#courseTransformArrow)"/>';
 }
 return '<svg class="course-visual" viewBox="0 0 390 165" role="img" aria-label="Figure transformée sur quadrillage"><defs><marker id="courseTransformArrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#e86100"/></marker></defs><g stroke="#d8e3f4" stroke-width="1">'+[35,75,115,155,195,235,275,315,355].map(function(p){return '<path d="M'+p+' 15V150M15 '+p/2+'H375"/>';}).join('')+'</g>'+guide+'<path d="M55 105L95 45L135 85L115 125Z" fill="#cfe5ff" stroke="#1f5f8b" stroke-width="3"/>'+image+'</svg>';
}
function coursePythagorasVisual(){return '<svg class="course-visual" viewBox="0 0 520 315" role="img" aria-label="Triangle ABC rectangle en B avec trois vrais carrés construits sur ses côtés et une barre d’égalité des aires"><polygon points="130,115 130,190 230,190" fill="#fff" stroke="#17384d" stroke-width="3"/><path d="M130 174H146V190" fill="none" stroke="#e86100" stroke-width="4"/><polygon points="130,115 130,190 55,190 55,115" fill="#dceeff" stroke="#0879d0" stroke-width="3"/><polygon points="130,190 230,190 230,290 130,290" fill="#e2f5e8" stroke="#24994d" stroke-width="3"/><polygon points="130,115 230,190 305,90 205,15" fill="#fff0d8" stroke="#e89516" stroke-width="3"/><text x="92" y="158" text-anchor="middle" fill="#0879d0" font-size="18" font-weight="900">AB²</text><text x="180" y="245" text-anchor="middle" fill="#24994d" font-size="18" font-weight="900">BC²</text><text x="218" y="105" text-anchor="middle" fill="#b76e00" font-size="18" font-weight="900" transform="rotate(37 218 105)">AC²</text><text x="115" y="108" font-size="18" font-style="italic">A</text><text x="112" y="210" font-size="18" font-style="italic">B</text><text x="236" y="209" font-size="18" font-style="italic">C</text><rect x="342" y="55" width="145" height="62" rx="8" fill="#fff0d8" stroke="#e89516" stroke-width="3"/><text x="414" y="93" text-anchor="middle" fill="#b76e00" font-size="20" font-weight="900">AC²</text><text x="414" y="145" text-anchor="middle" fill="#17384d" font-size="26" font-weight="900">=</text><rect x="342" y="169" width="63" height="62" rx="8" fill="#dceeff" stroke="#0879d0" stroke-width="3"/><rect x="414" y="169" width="73" height="62" rx="8" fill="#e2f5e8" stroke="#24994d" stroke-width="3"/><text x="373" y="207" text-anchor="middle" fill="#0879d0" font-size="17" font-weight="900">AB²</text><text x="450" y="207" text-anchor="middle" fill="#24994d" font-size="17" font-weight="900">BC²</text><text x="409" y="207" text-anchor="middle" fill="#17384d" font-size="21" font-weight="900">+</text><text x="414" y="273" text-anchor="middle" fill="#17384d" font-size="16" font-weight="850">aire du grand carré</text><text x="414" y="294" text-anchor="middle" fill="#17384d" font-size="16" font-weight="850">= somme des deux autres</text></svg>';}
function coursePythagorasLibraryVisual(kind){
 const ids={mill:'geometry.pythagoras-mill',bar:'geometry.pythagoras-bar',hypotenuse:'geometry.pythagoras-reasoning',leg:'geometry.pythagoras-reasoning'},component=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get(ids[kind]);
 if(!component) return coursePythagorasVisual();
 let data={mode:'relation'},correction=true;
 if(kind==='bar') data={phase:'relation',sideNames:{hypotenuse:'a',legA:'b',legB:'c'},sharpCorners:true,plainEquation:true};
 if(kind==='hypotenuse') data={step:'root',target:'hypotenuse',values:{legA:3,legB:4,hypotenuse:5},sideNames:{legA:'a',legB:'b',hypotenuse:'h'}};
 if(kind==='leg') data={step:'isolate',target:'legA',values:{legA:5,legB:12,hypotenuse:13},sideNames:{legA:'a',legB:'b',hypotenuse:'h'}};
 return component.render(data,correction).replace('class="','class="course-visual ');
}
function courseCosineVisual(){return '<svg class="course-visual course-cosine-visual" style="max-height:150px;margin:2px auto" viewBox="0 0 360 172" role="img" aria-label="Triangle DEF rectangle en E : hypoténuse [DF], côté adjacent à l’angle D [DE], côté opposé [EF]"><polygon points="40,140 280,140 280,30" fill="#f2f7fd" stroke="#17384d" stroke-width="3" stroke-linejoin="round"/><line x1="40" y1="140" x2="280" y2="30" stroke="#7a3db8" stroke-width="6" stroke-linecap="round"/><line x1="40" y1="140" x2="280" y2="140" stroke="#0a6fc2" stroke-width="6" stroke-linecap="round"/><path d="M266 140V126H280" fill="none" stroke="#17384d" stroke-width="2.4"/><path d="M74 140A34 34 0 0 0 70.9 125.8" fill="none" stroke="#d35400" stroke-width="3.2"/><g font-family="Arial,Helvetica,sans-serif" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round" text-anchor="middle"><text x="25" y="148" font-size="22" font-style="italic" fill="#17384d">D</text><text x="295" y="160" font-size="22" font-style="italic" fill="#17384d">E</text><text x="295" y="28" font-size="22" font-style="italic" fill="#17384d">F</text><text x="112" y="66" font-size="18" fill="#7a3db8">hypoténuse</text><text x="160" y="164" font-size="18" fill="#0a6fc2">adjacent à D</text><text x="320" y="92" font-size="18" fill="#b23a48">opposé</text></g></svg>';}
function courseTrigVisual(){return '<svg class="course-visual course-trig-visual" viewBox="0 0 470 235" role="img" aria-label="Triangle ABC rectangle en B avec les côtés repérés par rapport à l’angle A"><polygon points="42,194 318,194 318,42" fill="#eef6ff" stroke="#17384d" stroke-width="3"/><path d="M318 174H298V194" fill="none" stroke="#e86100" stroke-width="4"/><path d="M82 194A40 40 0 0 0 77 173" fill="none" stroke="#e86100" stroke-width="4"/><text x="22" y="216" font-size="22" font-style="italic">A</text><text x="326" y="216" font-size="22" font-style="italic">B</text><text x="326" y="40" font-size="22" font-style="italic">C</text><text x="178" y="222" text-anchor="middle" fill="#0879d0" font-size="17" font-weight="900">côté adjacent</text><text x="360" y="120" text-anchor="middle" fill="#b23a48" font-size="17" font-weight="900">côté opposé</text><text x="178" y="102" text-anchor="middle" fill="#7651b5" font-size="17" font-weight="900" transform="rotate(-29 178 102)">hypoténuse</text><text x="410" y="70" text-anchor="middle" fill="#17384d" font-size="17" font-weight="900">par rapport</text><text x="410" y="94" text-anchor="middle" fill="#17384d" font-size="17" font-weight="900">à l’angle Â</text></svg>';}
function courseConversionVisual(kind){
 if(kind==='duration') return '<div class="duration-course-discs" role="img" aria-label="Équivalences entre heures, minutes et secondes"><span class="duration-equivalence-pair"><span class="duration-disc duration-disc-hour">1 h</span><b>=</b><span class="duration-disc duration-disc-minute">60 min</span></span><span class="duration-equivalence-pair"><span class="duration-disc duration-disc-minute">1 min</span><b>=</b><span class="duration-disc duration-disc-second">60 s</span></span></div>';
 const count=kind==='area'?2:(kind==='volume'?3:1),labels=kind==='area'?['m²','dm²','cm²']:(kind==='volume'?['m³','dm³','cm³']:['m','dm','cm']);
 let cells='';labels.forEach(function(label,index){cells+='<text x="'+(72+index*128)+'" y="28" text-anchor="middle" fill="#17384d" font-size="18" font-weight="850">'+label+'</text>';for(let i=0;i<count;i++)cells+='<rect x="'+(24+index*128+i*(96/count))+'" y="42" width="'+(96/count)+'" height="58" fill="'+(index===1?'#fff0df':'#eef6ff')+'" stroke="#17384d" stroke-width="2"/>';});
 return '<svg class="course-visual" viewBox="0 0 420 125" role="img" aria-label="Tableau de conversion">'+cells+'<text x="210" y="121" text-anchor="middle" fill="#087a55" font-size="16" font-weight="850">'+count+' position'+(count>1?'s':'')+' par unité</text></svg>';
}
function courseThalesTemplateVisual(){
 return '<div class="thales-course-template">'
  +'<div class="thales-course-figure"><svg viewBox="0 0 400 240" role="img" aria-label="Triangles emboîtés de Thalès : A commun, D et E dans le petit triangle, B et C dans le grand triangle"><polygon points="50,145 347,211 308.5,24" fill="#effcfc"/><path d="M50 145L347 211M50 145L308.5 24M347 211L308.5 24M192.45 176.9L174.3 86.7" fill="none" stroke="#0b3570" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter"/><circle cx="50" cy="145" r="3.5" fill="#ff9114"/><circle cx="192.45" cy="176.9" r="3.5" fill="#11468c"/><circle cx="174.3" cy="86.7" r="3.5" fill="#11468c"/><circle cx="347" cy="211" r="3.5" fill="#1daeae"/><circle cx="308.5" cy="24" r="3.5" fill="#1daeae"/><text x="34" y="139" text-anchor="end" fill="#ff7a1a" font-size="19" font-style="italic" font-weight="900">A</text><text x="194" y="202" fill="#11468c" font-size="19" font-style="italic" font-weight="900">D</text><text x="158" y="80" text-anchor="end" fill="#11468c" font-size="19" font-style="italic" font-weight="900">E</text><text x="362" y="216" fill="#087f83" font-size="19" font-style="italic" font-weight="900">B</text><text x="314" y="18" fill="#087f83" font-size="19" font-style="italic" font-weight="900">C</text></svg></div>'
  +'<div class="thales-course-method"><div class="thales-course-caption">Même colonne = côtés correspondants</div><div class="thales-course-table">'
  +'<span class="thales-course-cell thales-course-head">Triangle</span><span class="thales-course-cell thales-course-head">côté 1</span><span class="thales-course-cell thales-course-head">côté 2</span><span class="thales-course-cell thales-course-head">côté parallèle</span>'
  +'<span class="thales-course-cell thales-course-small thales-course-row-small">petit ADE</span><span class="thales-course-cell thales-course-small thales-course-row-small">AD</span><span class="thales-course-cell thales-course-small thales-course-row-small">AE</span><span class="thales-course-cell thales-course-small thales-course-row-small">DE</span>'
  +'<span class="thales-course-cell thales-course-large thales-course-row-large">grand ABC</span><span class="thales-course-cell thales-course-large thales-course-row-large">AB</span><span class="thales-course-cell thales-course-large thales-course-row-large">AC</span><span class="thales-course-cell thales-course-large thales-course-row-large">BC</span></div>'
  +'<div class="thales-course-ratios"><span class="small">AD</span>/<span class="large">AB</span> = <span class="small">AE</span>/<span class="large">AC</span> = <span class="small">DE</span>/<span class="large">BC</span></div><div class="thales-course-reminder">On lit toujours les points dans le même ordre.</div></div></div>';
}
function courseDecimalVisual(kind){
 const ids={order:'numbers.order-cards',frame:'numbers.number-line','relative-frame':'numbers.number-line',unit:'arithmetic.fraction-decimal-grid',multiply:'algebra.area-model',divide:'arithmetic.relation-bar'};
 const component=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get(ids[kind]);
 if(!component)return '';
 let data={},correction=true;
 if(kind==='order')data={values:[4.7,4.09,4.68],solution:[4.09,4.68,4.7]};
 if(kind==='frame')data={mode:'scale',min:9,max:10,step:1,width:560,height:154,axisPadding:.1,autoLabels:true,tickFontSize:21,pointFontSize:28,points:[{value:9.32,label:'9,32',color:'#0b79d0'}]};
 if(kind==='relative-frame')data={mode:'scale',min:-3,max:-2,step:1,width:560,height:154,axisPadding:.1,autoLabels:true,tickFontSize:21,pointFontSize:28,points:[{value:-2.4,label:'−2,4',color:'#0b79d0'}]};
 if(kind==='unit')data={kind:'decimal-complement',filledA:9,filledB:1,showSecond:true};
 if(kind==='multiply')data={style:'decimal-decomposition',compact:true,title:false,rows:[{coefficient:4,power:0},{coefficient:.7,power:0}],columns:[{coefficient:4,power:0}],cellLabels:['4 × 4 = 16','0,7 × 4 = 2,8'],answer:'4,7 × 4 = 16 + 2,8 = 18,8'};
 if(kind==='divide')data={kind:'fraction_direct',divisor:3,value:2.1,result:.7,showValue:true,questionLabel:'une part',balanced:true,arrowStyle:'hand'};
 const html=component.render(data,correction);
 return '<div class="course-visual decimal-course-visual">'+html+'</div>';
}
// Cours dnb_02 : opération posée (virgules alignées, zéros ajoutés en gris).
function courseDecimalColumns(lines,operator){
 const parts=lines.map(text=>{const [whole,decimals='']=String(text).split(',');return {whole,decimals};});
 const wholeWidth=Math.max(...parts.map(part=>part.whole.length)),decimalWidth=Math.max(...parts.map(part=>part.decimals.length));
 const rows=parts.map((part,index)=>{
  const line=index===parts.length-1?'border-top:2px solid #17283f;':'';
  const cell=(value,extra='')=>'<td style="'+line+'padding:0 .08em;text-align:center;min-width:.62em;'+extra+'">'+value+'</td>';
  const whole=part.whole.padStart(wholeWidth,' ').split('').map(digit=>cell(digit===' '?'':digit)).join('');
  const decimals=Array.from({length:decimalWidth},(_,position)=>part.decimals[position]===undefined?cell('0','color:#8a97a8'):cell(part.decimals[position])).join('');
  return '<tr><td style="padding:0 .25em 0 0;text-align:right">'+(index===1?operator:'')+'</td>'+whole+cell(',')+decimals+'</tr>';
 }).join('');
 return '<table aria-label="Opération posée" style="margin:7px auto 2px;border-collapse:collapse;font:800 1.22em Cambria Math,Times New Roman,serif;color:#17283f">'+rows+'</table>';
}
function courseDecimalPlaceTable(values,column){
 const head=['unités','dixièmes','centièmes'];
 const cell=(value,index,tag='td')=>'<'+tag+' style="padding:3px 8px;border:1px solid #c9d6e6;text-align:center'+(index===column?';background:#fff1df;color:#9a4100':'')+'">'+value+'</'+tag+'>';
 const rows=values.map(text=>{const [whole,decimals]=text.split(',');return '<tr>'+cell(whole+',',0)+cell(decimals[0],1)+cell(decimals[1]||'<span style="color:#8a97a8">0</span>',2)+'</tr>';}).join('');
 return '<table aria-label="Tableau de numération" style="margin:7px auto 2px;border-collapse:collapse;font:800 1.05em Cambria Math,Times New Roman,serif;color:#17283f"><tr>'+head.map((label,index)=>cell('<span style="font:800 .72em Arial,sans-serif">'+label+'</span>',index,'th')).join('')+'</tr>'+rows+'</table>';
}
function courseReadDataTableVisual(){
 return '<table class="read-data-course-table" aria-label="Exemple de lecture croisée dans un tableau"><tbody>'+
  '<tr><th></th><th>lundi</th><th class="read-data-column">mardi</th><th>mercredi</th></tr>'+
  '<tr><th class="read-data-row">livres</th><td>12</td><td class="read-data-target">18</td><td>15</td></tr>'+
  '</tbody></table><div class="read-data-course-caption">Ligne <strong>livres</strong> ∩ colonne <strong>mardi</strong> : <b>18 livres</b>.</div>';
}
function courseReadDataChartVisual(){
 return '<svg class="read-data-course-chart" viewBox="0 0 440 230" role="img" aria-label="Diagramme en bâtons : lecture de la valeur 10 pour le théâtre">'+
  '<g stroke="#d8e3f4" stroke-width="1"><path d="M55 175H410M55 130H410M55 85H410M55 40H410"/></g>'+
  '<g fill="#42556c" font-family="Arial, sans-serif" font-size="14" text-anchor="end"><text x="46" y="180">0</text><text x="46" y="135">5</text><text x="46" y="90">10</text><text x="46" y="45">15</text></g>'+
  '<text x="55" y="18" fill="#35526e" font-family="Arial, sans-serif" font-size="14" font-weight="900">élèves</text>'+
  '<path d="M55 25V175H420M55 85H230" fill="none" stroke="#17384d" stroke-width="2"/><path d="M55 85H230" fill="none" stroke="#e86100" stroke-width="3" stroke-dasharray="7 5"/>'+
  '<rect x="90" y="130" width="58" height="45" rx="3" fill="#dceeff" stroke="#2471a3" stroke-width="2"/><rect x="202" y="85" width="58" height="90" rx="3" fill="#fff0df" stroke="#e86100" stroke-width="3"/><rect x="314" y="40" width="58" height="135" rx="3" fill="#e2f5e8" stroke="#24994d" stroke-width="2"/>'+
  '<g fill="#17384d" font-family="Arial, sans-serif" font-size="14" text-anchor="middle"><text x="119" y="199">sport</text><text x="231" y="199" font-weight="900" fill="#9a4100">théâtre</text><text x="343" y="199">musique</text></g><text x="282" y="77" fill="#9a4100" font-family="Arial, sans-serif" font-size="15" font-weight="900">10 élèves</text></svg>';
}
function courseReadDataPictogramVisual(){
 return '<div class="read-data-pictogram" role="img" aria-label="Trois symboles, chaque symbole représente cinq élèves"><strong>espagnol</strong><span class="read-data-stars" aria-hidden="true">★ ★ ★</span><span class="read-data-legend">1 ★ représente 5 élèves</span></div><div class="read-data-course-caption"><b>3 × 5 = 15 élèves</b> : on multiplie, on ne compte pas seulement les symboles.</div>';
}
const courseCatalog={
  divisibility_rules:{title:'Critères de divisibilité',rules:[
    ['Divisible&nbsp;: le reste est 0',courseDivisibilitySharingVisual()+'<span class="course-divisibility-line"><b>12 = 3 × 4 + 0</b>&nbsp;: 12 est divisible par 3.</span><span class="course-divisibility-line"><b>13 = 3 × 4 + 1</b>&nbsp;: 13 n’est pas divisible par 3.</span><span class="course-example">3 divise 12 ⇔ 12 est divisible par 3 ⇔ 12 est un multiple de 3</span>',true],
    ['Par 2, 5 et 10&nbsp;: le chiffre des unités','<div class="course-divisibility-units"><span>par 2<b>0, 2, 4, 6, 8</b></span><span>par 5<b>0 ou 5</b></span><span>par 10<b>0</b></span></div><span class="course-example">23<span class="course-divisibility-unit">0</span>&nbsp;: par 2, 5 et 10<br>23<span class="course-divisibility-unit">5</span>&nbsp;: par 5 · 23<span class="course-divisibility-unit">6</span>&nbsp;: par 2</span><span class="course-divisibility-line">Par 10 = par 2 et par 5.</span>'],
    ['Par 3 et 9&nbsp;: la somme des chiffres','<span class="course-divisibility-line">par 3&nbsp;: table de 3 (3, 6, 9, 12, 15, 18…)</span><span class="course-divisibility-line">par 9&nbsp;: table de 9 (9, 18, 27, 36…)</span><span class="course-example">372 → 3 + 7 + 2 = 12&nbsp;: par 3, pas par 9<br>729 → 7 + 2 + 9 = 18&nbsp;: par 3 et par 9</span><span class="course-divisibility-warning">Attention&nbsp;: 43 a 3 pour chiffre des unités, mais 4 + 3 = 7&nbsp;: pas divisible par 3.</span>']
  ],layout:'divisibility'},
  fraction_mul_div:{title:'Multiplier et diviser des fractions',rules:[
    ['Multiplier','On multiplie les numérateurs entre eux et les dénominateurs entre eux.<span class="course-example"><span class="course-equation">'+courseFraction(2,3)+' × '+courseFraction(5,4)+' = '+courseFraction(10,12)+' = '+courseFraction(5,6)+'</span></span>'],
    ['Simplifier avant','On peut simplifier en croix avant de multiplier.<span class="course-example"><span class="course-equation">'+courseFraction(3,4)+' × '+courseFraction(8,5)+' = '+courseFraction(3,1)+' × '+courseFraction(2,5)+' = '+courseFraction(6,5)+'</span></span>'],
    ['Diviser : les trois gestes','On garde la première fraction, on remplace ÷ par ×, puis on inverse seulement le diviseur.<span class="course-example"><span class="course-equation">'+courseFraction(2,3)+' ÷ '+courseFraction(5,4)+' → '+courseFraction(2,3)+' × '+courseFraction(4,5)+' = '+courseFraction(8,15)+'</span></span>'],
    ['Avec un entier','On écrit l’entier comme une fraction de dénominateur 1 avant d’appliquer la même règle.<span class="course-example"><span class="course-equation">'+courseFraction(2,5)+' ÷ 3 = '+courseFraction(2,5)+' × '+courseFraction(1,3)+' = '+courseFraction(2,15)+'</span></span>'],
    ['Comprendre une fraction-unité','On peut aussi compter combien de parts entrent dans le nombre.<span class="course-example"><span class="course-equation">2 ÷ '+courseFraction(1,4)+' = 8</span>Il y a huit quarts dans 2.</span>']
  ]},
  perimeter_formulas:{title:'Le périmètre',rules:[
    ['Définition','Le périmètre d’une figure est la longueur de son contour. Il s’exprime dans une unité de longueur : mm, cm, m…'],
    ['Polygone','On additionne les longueurs de tous les côtés du contour.<span class="course-example">Exemple : P = 4 + 6 + 5 = 15 cm.</span>'],
    ['Côtés égaux','Pour un polygone régulier : P = nombre de côtés × longueur d’un côté.<span class="course-example">Exemple : un hexagone de côté 3 cm a pour périmètre P = 6 × 3 = 18 cm.</span>'],
    ['Rectangle et carré','Rectangle : P = 2 × (longueur + largeur). Carré : P = 4 × côté.'],
    ['Disque','Avec le rayon : P = 2 × π × r. Avec le diamètre : P = π × d.<span class="course-example">Valeur exacte pour r = 4 cm : P = 8π cm.<br>Avec π ≈ 3,1 : P ≈ 2 × 3,1 × 4 = 24,8 cm.</span>']
  ]},
  area_formulas:{title:'Formules d’aires',rules:[
    ['Rectangle','A = longueur × largeur'+courseShapeVisual('rectangle')+'<span class="course-example">Exemple : A = 8 × 3 = 24 cm².</span>'],
    ['Carré','A = côté × côté'+courseShapeVisual('square')+'<span class="course-example">Exemple : A = 5 × 5 = 25 cm².</span>'],
    ['Triangle','A = (base × hauteur) ÷ 2'+courseShapeVisual('triangle')+'<span class="course-example">La hauteur est perpendiculaire à la base. Exemple : A = (10 × 6) ÷ 2 = 30 cm².</span>'],
    ['Disque','A = π × rayon × rayon'+courseShapeVisual('disk')+'<span class="course-example">Exemple : avec r = 4 cm, A = 3,14 × 4 × 4 = 50,24 cm². Si le diamètre est donné, on calcule d’abord le rayon.</span>'],
    ['Figure composée','On découpe en figures simples, puis on additionne ou on soustrait leurs aires.<span class="course-example">Exemple : aire totale = aire du rectangle + aire du triangle.</span>']
  ]},
  volume_formulas:{title:'Formules de volumes',rules:[
    ['Cube','V = côté × côté × côté'+courseSolidVisual('cube')+'<span class="course-example">Exemple : V = 4 × 4 × 4 = 64 cm³.</span>'],
    ['Pavé droit','V = longueur × largeur × hauteur'+courseSolidVisual('pave')+'<span class="course-example">Exemple : V = 8 × 3 × 5 = 120 cm³.</span>'],
    ['Prisme droit','Le volume empile des bases identiques : V = aire de la base × hauteur du prisme.'+courseSolidVisual('prism')+'<span class="course-example">Exemple : 12 cm² par couche sur une hauteur de 5 cm → V = 12 × 5 = 60 cm³.</span>'],
    ['Cylindre','V = aire du disque de base × hauteur = π × rayon × rayon × hauteur'+courseSolidVisual('cylinder')+'<span class="course-example">Exemple : V ≈ 3,14 × 3 × 3 × 5 = 141,3 cm³. Si le diamètre est donné, on calcule d’abord le rayon.</span>'],
    ['Solide composé','On additionne les volumes des solides simples.<span class="course-example">Exemple : deux cubes identiques → volume total = 2 × volume d’un cube.</span>']
  ]},
  // dnb_31 (refonte du 08/10/2026) : la médiane en deux temps (ranger, puis le
  // milieu : autant avant qu'après), le nombre pair, l'étendue. Les calculs ne
  // se coupent pas en fin de ligne ; tient au téléphone et à l'ordinateur 1366 × 625.
  median:{title:'Médiane et étendue',rules:[
    ['Médiane','<b>1.</b> Range <b>toutes</b> les valeurs dans l’ordre croissant, même celles qui se répètent.<br><b>2.</b> La médiane est au milieu&nbsp;: <b>autant de valeurs avant qu’après</b>.<span class="course-example"><span class="median-course-values" style="flex-wrap:wrap"><span style="white-space:nowrap">12 ; 3 ; 8 ; 3 ; 6 →</span> <span>3</span> ; <span>3</span> ; <span class="median-middle">6</span> ; <span>8</span> ; <span>12</span> <span style="white-space:nowrap">→ médiane = 6</span></span></span>',true],
    ['Nombre pair de valeurs','Deux valeurs au milieu&nbsp;: la médiane est leur <b>moyenne</b>.<span class="course-example"><span class="median-course-values"><span>2</span> ; <span class="median-middle">4</span> ; <span class="median-middle">7</span> ; <span>9</span></span><span style="white-space:nowrap">Médiane = (4 + 7) ÷ 2 = 5,5</span></span>'],
    ['Étendue','<span style="white-space:nowrap">Étendue = plus grande valeur</span> <span style="white-space:nowrap">− plus petite valeur</span><span class="course-example">3 ; 3 ; 6 ; 8 ; 12&nbsp;: <span style="white-space:nowrap">étendue = 12 − 3 = 9</span></span>']
  ]}
};
Object.assign(courseCatalog,{
  relative_addition:{title:'Additionner des nombres entiers relatifs',rules:[
    ['Les jetons','Un jeton vert vaut +1 ; un jeton rouge vaut −1. Le signe et la valeur sont écrits dans chaque jeton.'],
    ['Rassembler','Pour additionner, on rassemble les deux groupes de jetons dans le même plateau.'],
    ['Paire nulle','Un jeton +1 et un jeton −1 forment une paire nulle : leur somme vaut 0. On peut les repérer, puis lire les jetons restants.'],
    ['Méthode','Avec des signes différents, on peut annuler les paires opposées. Le signe du résultat est celui des jetons qui restent en plus grand nombre.']
  ]},
  place_value_shift:{title:'Multiplier ou diviser par 10, 100 et 1 000',rules:[
    ['Idée essentielle','La virgule reste fixe dans le tableau de numération : ce sont les chiffres qui changent de colonne.'],
    ['Multiplier','Chaque chiffre prend une valeur de position 10, 100 ou 1 000 fois plus grande.<div class="course-place-value-example">'+placeValueCourseExamples.multiply+'</div>',true],
    ['Diviser','Chaque chiffre prend une valeur de position 10, 100 ou 1 000 fois plus petite.<div class="course-place-value-example">'+placeValueCourseExamples.divide+'</div>',true],
    ['Zéros utiles','Après le déplacement, on complète seulement les places vides nécessaires.<span class="course-example">52 ÷ 1 000 = 0,052 : les zéros indiquent les unités et les dixièmes vides.</span>'],
    ['Attention','« Ajouter un zéro » n’est pas une règle générale : 6,50 est encore égal à 6,5. Pour calculer 6,5 × 10, les chiffres glissent d’un rang et on obtient 65.']
  ],layout:'place-value'},
  pythagoras:{title:'Théorème de Pythagore',rules:[
    ['Condition','On utilise le théorème de Pythagore seulement dans un triangle rectangle. L’hypoténuse est le côté opposé à l’angle droit et le plus long côté.'+coursePythagorasLibraryVisual('mill'),false,'condition'],
    ['Égalité','Le carré de l’hypoténuse est la somme des carrés des deux autres côtés.'+coursePythagorasLibraryVisual('bar'),true,'relation'],
    ['Chercher l’hypoténuse','On additionne les deux carrés, puis on prend la racine carrée.'+coursePythagorasLibraryVisual('hypotenuse'),false,'hypotenuse-calculation'],
    ['Chercher un côté de l’angle droit','On soustrait le carré connu au carré de l’hypoténuse, puis on prend la racine carrée.'+coursePythagorasLibraryVisual('leg'),false,'leg-calculation'],
    ['Réciproque','Pour prouver qu’un triangle est rectangle, on compare le carré du plus long côté à la somme des carrés des deux autres.',false,'converse'],
    ['Vérification','À la fin, l’hypoténuse doit être le plus grand côté du triangle.',false,'coherence']
  ]},
  fraction_decimal:{title:'Fractions et décimaux',rules:[
    ['Les repères à connaître','<span class="course-example" style="display:flex;flex-wrap:wrap;justify-content:center;gap:0 18px">'+[[1,2,'0,5'],[1,4,'0,25'],[3,4,'0,75'],[3,2,'1,5'],[5,2,'2,5'],[4,2,'2'],[1,10,'0,1'],[100,100,'1'],[7,1,'7']].map(([n,d,v])=>'<span class="course-equation" style="white-space:nowrap;margin-top:3px;font-size:1.1em">'+courseFraction(n,d)+'&nbsp;=&nbsp;'+v+'</span>').join('')+'</span>',true],
    ['Dixièmes et centièmes','<span class="course-example"><span class="course-equation" style="margin-top:0;font-size:1.1em">'+courseFraction(9,100)+'&nbsp;= 9 centièmes = 0,09</span><span class="course-equation" style="font-size:1.1em"><span style="white-space:nowrap">0,75 = 75 centièmes</span><span style="display:inline-flex;align-items:center;gap:.12em;white-space:nowrap">&nbsp;=&nbsp;'+courseFraction(75,100)+'&nbsp;=&nbsp;'+courseFraction(3,4)+'</span></span></span>Toute fraction égale est juste.'],
    ['Plus grand que 1','<span class="course-example"><span class="course-equation" style="margin-top:0;font-size:1.1em">'+courseFraction(7,4)+'&nbsp;=&nbsp;'+courseFraction(4,4)+'&nbsp;+&nbsp;'+courseFraction(3,4)+'&nbsp;= 1 + 0,75 = 1,75</span></span>La barre n’est pas une virgule : <span style="white-space:nowrap">'+courseFraction(3,2)+' = 1,5, pas 3,2.</span>']
  ]},
  decimal_numbers:{title:'Comparer et calculer avec des décimaux',rules:[
    ['Comparer, ranger','J’écris les nombres avec <b>autant de chiffres après la virgule</b> (j’ajoute des zéros), puis je compare de gauche à droite : partie entière, dixièmes, centièmes.'+courseDecimalPlaceTable(['4,7','4,09','4,68'],1)+courseDecimalVisual('order')+'<span class="course-example">4,09 &lt; 4,68 &lt; 4,7 — le plus court n’est pas forcément le plus petit.</span>',false,'place-values'],
    ['Encadrer','L’entier juste avant est la partie entière ; l’entier juste après est le suivant.'+courseDecimalVisual('frame')+'<span class="course-example">9 &lt; 9,32 &lt; 10</span>',false,'consecutive-integers'],
    ['Compléter','J’avance par étapes : jusqu’au dixième suivant, puis jusqu’à l’unité.<span class="course-example">0,35 + 0,05 = 0,4 ; 0,4 + 0,6 = 1 : il manque 0,05 + 0,6 = 0,65.</span>'+courseDecimalVisual('unit'),false,'complete-unit'],
    ['Additionner, soustraire','J’aligne les virgules et je complète avec des zéros.'+courseDecimalColumns(['11','7,5','3,5'],'−')+'<span class="course-example">4,45 + 0,3 = 4,45 + 0,30 = 4,75</span>',false,'align-comma'],
    ['Multiplier par un entier','Je décompose le décimal, puis je multiplie chaque partie.'+courseDecimalVisual('multiply'),false,'distributivity'],
    ['Multiplier en dixièmes','<span class="course-example">0,6 × 7 = 6 dixièmes × 7 = 42 dixièmes = 4,2</span><span class="course-example">0,3 × 0,2 : 3 × 2 = 6 ; 2 chiffres après la virgule → 0,06</span>',false,'multiply-units'],
    ['Diviser','J’écris le nombre en dixièmes (ou en centièmes), puis je partage.<span class="course-example">5,2 ÷ 4 = 52 dixièmes ÷ 4 = 13 dixièmes = 1,3</span><span class="course-example">66 ÷ 5 = 660 dixièmes ÷ 5 = 132 dixièmes = 13,2</span>'+courseDecimalVisual('divide'),false,'equal-sharing'],
    ['Priorités','La multiplication se calcule avant l’addition et la soustraction.<span class="course-example"><span style="display:block">A = 7,5 − 2,5 × 2</span><span style="display:block">A = 7,5 − 5</span><span style="display:block">A = 2,5</span></span>',false,'priorities'],
    ['Contrôler','Résultat + nombre enlevé = nombre de départ.<span class="course-example">11 − 7,5 = 3,5 car 3,5 + 7,5 = 11</span>',false,'check-subtract'],
    ['Contrôler','J’encadre le produit avec des entiers.<span class="course-example">2,4 × 9 est entre 2 × 9 = 18 et 3 × 9 = 27.</span>',false,'check-multiply'],
    ['Contrôler','Une part × le nombre de parts = le total.<span class="course-example">5,2 ÷ 4 = 1,3 car 4 × 1,3 = 5,2</span>',false,'check-divide']
  ]},
  decimal_relative_numbers:{title:'Comparer et calculer avec des décimaux relatifs',rules:[
    ['Comparer des nombres négatifs','Sur une droite graduée, le nombre le plus à droite est le plus grand. Parmi deux nombres négatifs, le plus grand est donc le plus proche de 0.<span class="course-example">−2,4 &gt; −3,1.</span>',false,'sign-order'],
    ['Encadrer un nombre négatif','Les deux entiers s’écrivent dans l’ordre de la droite : entier inférieur &lt; nombre &lt; entier supérieur.'+courseDecimalVisual('relative-frame'),false,'consecutive-integers'],
    ['Additionner des signes contraires','On compare les distances à zéro, on calcule leur différence, puis on garde le signe du nombre qui a la plus grande distance à zéro.<span class="course-example">3,2 + (−4,7) = −1,5.</span>',false,'signed-addition'],
    ['Vérifier','Le résultat d’une somme de signes contraires se situe entre les deux nombres de départ et son signe est cohérent avec le terme dominant.',false,'estimate']
  ]},
  fraction_ops:{title:'Les fractions',rules:[
    ['Simplifier','On divise le numérateur et le dénominateur par un même nombre, jusqu’à l’<b>irréductible</b>.<span class="course-example"><span class="course-equation">'+courseFraction(18,24)+' = '+courseFraction('18 ÷ <span class="course-multiplier">6</span>','24 ÷ <span class="course-multiplier">6</span>')+' = '+courseFraction(3,4)+'</span></span>'],
    ['Comparer','On met les fractions au <b>même dénominateur</b>, puis on compare les numérateurs.<span class="course-example"><span class="course-equation">'+courseFraction(2,3)+' = '+courseFraction(8,12)+' &lt; '+courseFraction(9,12)+' = '+courseFraction(3,4)+'</span></span>'],
    ['Additionner ou soustraire','On met les fractions au <b>même dénominateur</b>, puis on calcule avec les numérateurs, jamais <span style="white-space:nowrap">«&nbsp;en haut et en bas&nbsp;».</span>'+courseFractionVisual()+'<span class="course-example" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-around;gap:2px 24px;padding-top:3px;padding-bottom:3px"><span class="course-equation" style="margin-top:0">'+courseFraction(3,5)+' − '+courseFraction(1,4)+' = '+courseFraction(12,20)+' − '+courseFraction(5,20)+' = '+courseFraction(7,20)+'</span><span class="course-equation" style="margin-top:0">'+courseFraction(4,5)+' − '+courseFraction(1,3)+'<span style="margin:0 .2em;color:#b42318">≠</span>'+courseFraction(3,2)+'</span></span>',true]
  ]},
  equivalent_forms:{title:'Fractions, décimaux et pourcentages',rules:[
    ['Pourcentage','p % signifie « p sur 100 » : p % = '+courseFraction('p',100)+'.'],
    ['Fraction vers décimal','Une fraction est une division. On peut aussi chercher une fraction équivalente de dénominateur 10 ou 100.<span class="course-example"><span class="course-equation">'+courseFraction(3,5)+' = '+courseFraction(6,10)+' = 0,6</span></span>'],
    ['Décimal vers pourcentage','On cherche le nombre de centièmes.<span class="course-example">0,37 = 37 centièmes = 37 %.</span>']
  ]},
  // dnb_06 (refonte d’octobre 2026) : la forme, les deux sens de l’exposant,
  // le retour à l’écriture décimale ; un exemple par carte, jamais coupé.
  scientific_notation:{title:'Notation scientifique',rules:[
    ['La forme a × 10<sup>n</sup>','Un seul chiffre non nul avant la virgule&nbsp;: <b>1 ≤ a &lt; 10</b>.<span class="course-example"><span style="white-space:nowrap"><span style="color:#087a55">✔</span> 4,5 × 10<sup>3</sup></span> &nbsp; <span style="white-space:nowrap"><span style="color:#b42318">✘</span> 45 × 10<sup>2</sup></span> &nbsp; <span style="white-space:nowrap"><span style="color:#b42318">✘</span> 0,45 × 10<sup>4</sup></span></span>'],
    ['Nombre plus grand que 10','Exposant <b>positif</b>.<span class="course-example"><span style="white-space:nowrap">45 300 = 4,53 × 10 000</span> <span style="white-space:nowrap">= 4,53 × 10<sup>4</sup></span></span>'],
    ['Nombre entre 0 et 1','Exposant <b>négatif</b>.<span class="course-example"><span style="white-space:nowrap">0,0032 = 3,2 × 0,001</span> <span style="white-space:nowrap">= 3,2 × 10<sup>−3</sup></span></span>'],
    ['Dans l’autre sens','× 10<sup>n</sup>&nbsp;: les chiffres glissent de n rangs (vers la gauche si n &gt; 0, vers la droite si n &lt; 0).<span class="course-example"><span style="white-space:nowrap">6,1 × 10<sup>3</sup> = 6 100</span> &nbsp; <span style="white-space:nowrap">5,9 × 10<sup>−2</sup> = 0,059</span></span>']
  ]},
  squares:{title:'Carrés et carrés parfaits',rules:[
    ['Définition','Le carré de n est le produit de n par lui-même : n² = n × n.'],
    ['Lire dans l’autre sens','Si n² = 49 et n est positif, alors n = 7.'],
    ['Repère utile','Connaître les carrés de 1 à 12 permet d’encadrer rapidement.<span class="course-example">8² = 64 et 9² = 81, donc 70 est entre deux carrés consécutifs.</span>']
  ]},
  number_relations:{title:'Double, moitié, prédécesseur et autres relations',rules:[
    ['Multiplier','Double de n : 2n ; triple : 3n ; quadruple : 4n.'+courseRelationVisual()],
    ['Partager','La moitié est une des deux parts égales : '+courseFraction('n',2)+' ; le quart est une des quatre parts égales : '+courseFraction('n',4)+'.'],
    ['Entiers voisins','Le prédécesseur d’un entier n est n − 1 ; son successeur est n + 1.<span class="course-example">Pour n = 12 : prédécesseur 11, successeur 13.</span>']
  ]},
  reduce_expression:{title:'Réduire une expression littérale',rules:[
    ['Trois familles','Les 𝑥² (𝑥² = 𝑥 × 𝑥), les 𝑥 et les nombres. On ne regroupe que des termes de la même famille.'+'<svg class="course-visual" viewBox="0 0 360 112" role="img" aria-label="Une tuile de chaque famille : x², x et 1"><rect x="40" y="10" width="64" height="64" fill="#12A886" stroke="#111" stroke-width="2"/><text x="72" y="49" text-anchor="middle" class="math-text" font-size="22" font-weight="700" fill="#111">𝑥²</text><rect x="148" y="34" width="64" height="17" fill="#12A886" stroke="#111" stroke-width="2"/><text x="180" y="48" text-anchor="middle" class="math-text" font-size="15" font-weight="700" fill="#111">𝑥</text><rect x="270" y="34" width="17" height="17" fill="#12A886" stroke="#111" stroke-width="2"/><text x="278.5" y="48" text-anchor="middle" font-size="12" font-weight="700" fill="#111">1</text><text x="72" y="100" text-anchor="middle" font-size="16" font-weight="800" fill="#17384d">les 𝑥²</text><text x="180" y="100" text-anchor="middle" font-size="16" font-weight="800" fill="#17384d">les 𝑥</text><text x="278.5" y="100" text-anchor="middle" font-size="16" font-weight="800" fill="#17384d">les nombres</text></svg>'],
    ['Le signe reste avec le terme','<span>Dans <b>5 − 3𝑥 + 2𝑥</b>, les termes sont <b>5</b>, <b>−3𝑥</b> et <b>+2𝑥</b>.</span>'],
    ['On additionne les coefficients','<span class="course-equation">3𝑥 + 2𝑥 = (3 + 2)𝑥 = 5𝑥</span><span class="course-example">2𝑥 − 5𝑥 = −3𝑥<br>4𝑥 − 4𝑥 = 0<br>𝑥 + 𝑥 = 2𝑥 (on écrit 𝑥, pas 1𝑥)</span>'],
    ['Exemple','<span class="course-equation">3𝑥 + 5 − 𝑥 + 2</span><span class="course-equation">= 3𝑥 − 𝑥 + 5 + 2</span><span class="course-equation">= 2𝑥 + 7</span>'],
    ['Somme ou produit&nbsp;?','<span class="course-equation">𝑥 + 𝑥 = 2𝑥</span><span class="course-equation">𝑥 × 𝑥 = 𝑥²</span><span class="course-example">3𝑥 × 2𝑥 = 3 × 2 × 𝑥 × 𝑥 = 6𝑥²</span>'],
    ['Les parenthèses','<span class="course-equation">−(3𝑥 − 5) = −3𝑥 + 5</span><span class="course-example">Le − change le signe de chaque terme.</span><span class="course-equation">−4(2𝑥 + 3) = −8𝑥 − 12</span><span class="course-example">Le −4 multiplie les deux termes.</span>']
  ]},
  substitution:{title:'Calculer une expression pour une valeur donnée',rules:[
    ['Remplacer','On remplace chaque lettre par sa valeur, entre parenthèses si elle est négative.'],
    ['Respecter les priorités','On calcule d’abord les parenthèses et les puissances, puis les multiplications, puis les additions et soustractions.'],
    ['Exemple','Pour x = −3 : <span class="course-equation">2x² = 2 × (−3)² = 2 × 9 = 18</span>.']
  ]},
  expand_factor:{title:'Développer ou factoriser',rules:[
    ['Somme ou produit&nbsp;?','On regarde l’opération effectuée en dernier. <span class="course-equation">3x + 12</span> est une somme ; <span class="course-equation">3(x + 4)</span> est un produit.',false,'structure'],
    ['Développer','Développer transforme un produit en somme. Le facteur extérieur multiplie <strong>chacun</strong> des termes : <span class="course-equation">k(a + b) = ka + kb</span> et <span class="course-equation">k(a − b) = ka − kb</span>.<span class="course-example">3(x + 4) = 3 × x + 3 × 4 = 3x + 12.</span>',false,'distribute'],
    ['Le modèle d’aire','Les dimensions sont écrites sur les bords. Chaque case contient le produit de son en-tête de ligne par son en-tête de colonne. La somme des aires des cases donne l’aire totale.',false,'partial-products'],
    ['Factoriser au maximum','Factoriser transforme une somme en produit. On cherche le plus grand facteur commun, puis on divise chaque terme par ce facteur.<span class="course-example">12x + 18 = 6 × 2x + 6 × 3 = 6(2x + 3).</span>',false,'common-factor'],
    ['Les signes','Un facteur négatif change le signe de chaque produit : <span class="course-equation">−3(x + 4) = −3x − 12</span> et <span class="course-equation">−3(x − 4) = −3x + 12</span>.',false,'signs'],
    ['Vérifier dans l’autre sens','Après une factorisation, on développe mentalement le résultat : on doit retrouver exactement l’expression de départ. Développer, factoriser et réduire sont trois actions différentes.',false,'reverse-check'],
    ['Double distributivité','Chaque terme du premier facteur multiplie chaque terme du second : quatre produits partiels, puis on réduit.<span class="course-example">(x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6.</span>',false,'double-distribute'],
    ['Facteur apparent','Quand la même parenthèse est déjà visible dans chaque terme, on la met en facteur.<span class="course-example">3(x + 2) + 5(x + 2) = (3 + 5)(x + 2) = 8(x + 2).</span>',false,'apparent-factor'],
    ['Identités remarquables','<span class="course-equation">(a + b)² = a² + 2ab + b²</span><span class="course-equation">(a − b)² = a² − 2ab + b²</span><span class="course-equation">a² − b² = (a − b)(a + b)</span><span class="course-example">Le terme du milieu d’un carré est le double produit, pas seulement ab.</span>',true,'identities']
  ]},
  equations:{title:'Résoudre une équation',rules:[
    ['But','<div class="course-equation-goals"><span><strong>Équation :</strong> trouver la valeur de l’inconnue qui rend l’égalité vraie.</span><span><strong>Splat :</strong> trouver la valeur qui se cache sous chaque tache.</span></div>'],
    ['Conserver l’égalité','On effectue la même opération dans les deux membres pour conserver l’équilibre.'],
    ['Exemple','<div class="course-equation-splat">'+equationCourseSplat+'</div><div class="course-equation-resolution">'+equationCourseExample+'</div><span class="course-example">Vérification : 3 × 4 + 5 = 17.</span>',true]
  ]},
  number_line:{title:'Lire une abscisse',rules:[
    ['Trouver le pas','On calcule l’écart entre deux graduations repérées, puis on le partage par le nombre d’intervalles.'],
    ['Se déplacer','Vers la droite, les nombres augmentent ; vers la gauche, ils diminuent.'],
    ['Vérifier','L’abscisse lue doit être cohérente avec les repères voisins et avec le signe du nombre.']
  ]},
  coordinates:{title:'Lire et placer un point dans un repère',rules:[
    ['Le repère','<div>L’axe horizontal est l’<strong>axe des abscisses</strong>. L’axe vertical est l’<strong>axe des ordonnées</strong>. Ils se coupent en <em>O</em>, l’origine&nbsp;: <em>O</em>(0&nbsp;;&nbsp;0).</div>',true],
    ['Lire les coordonnées de A',courseCoordinatesVisual()+'<div><span class="course-step"><strong style="color:#a84a00">1.</strong> Abscisse&nbsp;: de <em>A</em>, je descends jusqu’à l’axe horizontal, je lis <strong style="color:#a84a00">−2</strong>.</span><br><span class="course-step"><strong style="color:#00706b">2.</strong> Ordonnée&nbsp;: de <em>A</em>, je vais vers la droite jusqu’à l’axe vertical, je lis <strong style="color:#00706b">3</strong>.</span><br><span class="course-step"><strong>3.</strong> J’écris l’abscisse en premier&nbsp;: <strong><em>A</em>(−2&nbsp;;&nbsp;3)</strong>.</span><span class="course-example"><strong>Astuce&nbsp;:</strong> dans l’alphabet, le <strong>A</strong> d’<strong>abscisse</strong> vient avant le <strong>O</strong> d’<strong>ordonnée</strong>.</span></div>',true],
    ['Attention','<div>Sur l’axe des abscisses, l’ordonnée vaut 0&nbsp;: <em>C</em>(3&nbsp;;&nbsp;0).<br>Sur l’axe des ordonnées, l’abscisse vaut 0&nbsp;: <em>D</em>(0&nbsp;;&nbsp;−2).<br>Avant de lire, je regarde ce que vaut un carreau.</div>'],
    ['Placer B(2 ; −1)',courseCoordinatesPlacementVisual()+'<div>Je pars de <em>O</em>. Je vais de 2 vers la <strong style="color:#a84a00">droite</strong>, puis je <strong style="color:#00706b">descends</strong> de 1.</div>']
  ]},
  figure_coding:{title:'Lire le codage d’une figure',rules:[
    ['Traits identiques','Des côtés portant le même codage ont la même longueur.'],
    ['Angle droit et parallèles','Un petit carré code un angle droit ; des flèches identiques codent des droites parallèles.'],
    ['Ne pas mesurer à l’œil','On conclut uniquement avec les données et les codages. Une figure n’est pas forcément dessinée à l’échelle.']
  ]},
  angles:{title:'Reconnaître et relier des angles',rules:[
    ['Nature','Aigu : entre 0° et 90° ; droit : 90° ; obtus : entre 90° et 180° ; plat : 180°.'],
    ['Relations','Complémentaires : somme 90°. Supplémentaires : somme 180°. Opposés par le sommet : mêmes mesures.'],
    ['Adjacents','Deux angles adjacents ont le même sommet, un côté commun et des intérieurs disjoints.']
  ]},
  triangle_angles:{title:'Angles d’un triangle',rules:[
    ['Propriété','Dans tout triangle, la somme des mesures des trois angles est 180°.'+courseTriangleBarVisual()],
    ['Angle manquant','On soustrait à 180° la somme des angles connus.<span class="course-example">58° et 67° → 180° − 58° − 67° = 55°.</span>'],
    ['Triangles particuliers','Rectangle : un angle vaut 90°. Isocèle : les angles à la base sont égaux. Équilatéral : chaque angle vaut 60°.']
  ]},
  solids:{title:'Reconnaître un solide',rules:[
    ['Prisme et pavé','Un prisme droit possède deux bases polygonales identiques et parallèles. Un pavé droit a six faces rectangulaires.'],
    ['Nom le plus précis','Un cube est un pavé droit particulier dont les six faces sont des carrés. Quand les six faces sont carrées, on répond donc « cube », qui est le nom le plus précis.'],
    ['Pyramide et cône','Les faces latérales d’une pyramide rejoignent un sommet. Un cône a une base circulaire et un sommet.'],
    ['Cylindre et sphère','Un cylindre possède deux disques parallèles. Une sphère est la surface dont tous les points sont à la même distance du centre.']
  ]},
  thales:{title:'Utiliser le théorème de Thalès',rules:[
    ['Conditions','Les points sont alignés sur deux droites sécantes et les deux autres droites sont parallèles.',false,'conditions'],
    ['Rapports correspondants','On écrit les longueurs dans le même ordre : '+courseFraction('AD','AB')+' = '+courseFraction('AE','AC')+' = '+courseFraction('DE','BC')+'.',false,'ratios'],
    ['Calcul','On choisit deux rapports contenant la longueur cherchée et trois longueurs connues, puis on résout l’égalité.',false,'calculation'],
    ['Réciproque et contraposée','Avec des points alignés dans le même ordre : des rapports correspondants égaux permettent de conclure que les droites sont parallèles ; des rapports différents permettent de conclure qu’elles ne le sont pas.',false,'parallelism-test'],
    ['Vérification','Le résultat doit rester cohérent avec la figure : une longueur intérieure à un segment ne peut pas être plus grande que le segment entier.',false,'coherence']
  ]},
  cosine:{title:'Cosinus dans un triangle rectangle',rules:[
    ['Condition','La formule du cosinus utilisée au collège s’applique dans un triangle rectangle.'],
    ['Formule','Pour l’angle étudié : <span class="course-equation">cos(angle) = côté adjacent ÷ hypoténuse</span>.'],
    ['Repérer les côtés','L’hypoténuse est opposée à l’angle droit et c’est le plus long côté. Le côté adjacent touche l’angle étudié sans être l’hypoténuse.']
  ]},
  transformations:{title:'Symétries et translation',rules:[
    ['Symétrie axiale','La figure est retournée comme dans un miroir autour d’un axe. L’axe est la médiatrice de chaque segment joignant un point à son image.'+courseTransformationVisual('axial')],
    ['Symétrie centrale','Le centre est le milieu du segment joignant un point à son image : cela correspond à un demi-tour. Longueurs, angles et forme sont conservés.'+courseTransformationVisual('central')],
    ['Translation','Tous les points se déplacent selon le même mouvement : même direction, même sens et même longueur.'+courseTransformationVisual('translation')]
  ]},
  probability:{title:'Calculer une probabilité',rules:[
    ['Quand ?','<b>Au hasard</b>, dé <b>équilibré</b>, boules <b>indiscernables</b>, secteurs <b>de même taille</b>&nbsp;: chaque cas a la même chance.'],
    ['La méthode','<div>P = '+courseFraction('cas qui conviennent','cas en tout')+'</div><div>On compte d’abord <b>tout</b>, puis ce qui <b>convient</b>.</div>'],
    ['Exemple',courseProbabilityBagVisual()+'<div>En tout&nbsp;: 3 + 5 = 8. Rouges&nbsp;:&nbsp;3.<br><b>P(rouge) = '+courseFraction(3,8)+'</b></div>'],
    ['À savoir','<div>P = 0&nbsp;: impossible.<br>P = 1&nbsp;: certain.<br>P(pas rouge) = 1 − P(rouge)<br>'+courseFraction(4,20)+' = '+courseFraction(1,5)+'&nbsp;: les deux sont justes.</div>']
  ]},
  frequency:{title:'Calculer une fréquence',rules:[
    ['Formule','Fréquence = '+courseFraction('effectif de la valeur','effectif total')+'.'],
    ['Différentes écritures','Une fréquence peut s’écrire en fraction, en nombre décimal ou en pourcentage.'],
    ['Exemple','8 élèves sur 20 : '+courseFraction(8,20)+' = 0,4 = 40 %. Le total étudié doit être clairement identifié.']
  ]},
  mean:{title:'Calculer une moyenne',rules:[
    ['Sans effectifs','Moyenne = somme des valeurs ÷ nombre de valeurs.'],
    ['Avec effectifs','On multiplie chaque valeur par son effectif, on additionne, puis on divise par l’effectif total.'],
    ['Retrouver une donnée','Somme = moyenne × effectif. On peut ensuite soustraire les valeurs déjà connues.']
  ]},
  read_data:{title:'Lire des tableaux, diagrammes et graphiques',rules:[
    ['1. Comprendre la question','Avant de calculer, repère la catégorie demandée, la grandeur mesurée et son unité. Dans un graphique, lis aussi le titre des axes et la valeur d’une graduation.'],
    ['2. Dans un tableau : croiser','Choisis la ligne qui porte la grandeur, puis la colonne qui porte la catégorie. La donnée cherchée se trouve à leur intersection.'+courseReadDataTableVisual(),true],
    ['3. Dans un diagramme : lire l’échelle','Pars du nom de la catégorie, suis son bâton ou son point, puis rejoins l’axe gradué. Ici, le bâton « théâtre » atteint la graduation 10.'+courseReadDataChartVisual()],
    ['4. Dans un pictogramme : utiliser la légende','Compte les symboles de la catégorie, puis multiplie par la valeur d’un symbole.'+courseReadDataPictogramVisual()],
    ['5. Combiner seulement après la lecture','Écris d’abord les valeurs prélevées avec la même unité, puis choisis l’opération demandée.<div class="read-data-operation"><span>Total : <b>12 + 18 = 30</b></span><span>« 6 de plus » : <b>18 − 12 = 6</b></span></div><span class="course-example">Pour une évolution, respecte l’ordre : variation = valeur finale − valeur initiale.</span>',true]
  ]},
  recognize_proportion:{title:'Reconnaître une proportionnalité',rules:[
    ['Même multiplicateur','Une grandeur est obtenue en multipliant l’autre toujours par le même nombre : le coefficient de proportionnalité.'],
    ['Dans un tableau','Les quotients correspondants sont égaux. Dans un graphique, les points sont alignés avec l’origine.'],
    ['Attention','Une somme fixe casse la proportionnalité.<span class="course-example">Prix = 2 × distance + 4 n’est pas proportionnel à la distance à cause des 4 € fixes.</span>']
  ]},
  solve_proportion:{title:'Résoudre une situation de proportionnalité',rules:[
    ['Choisir un passage','On peut multiplier ou diviser une ligne ou une colonne par un même nombre, passer par l’unité, ou utiliser un coefficient.'],
    ['Produit en croix','Si '+courseFraction('a','b')+' = '+courseFraction('c','x')+', alors a × x = b × c. Le produit en croix est un outil, pas le sens de la situation.'],
    ['Vérifier','Conserver les mêmes grandeurs sur une ligne et les mêmes unités. Estimer le résultat pour vérifier sa cohérence.']
  ]},
  read_graph:{title:'Lire une dépendance sur un graphique',rules:[
    ['Lire y pour un x','Partir de la valeur de x, monter jusqu’à la courbe, puis aller horizontalement vers l’axe des y.'],
    ['Lire x pour un y','Partir de la valeur de y, aller horizontalement jusqu’à la courbe, puis descendre vers l’axe des x.'],
    ['Interpréter un point','Le point (x ; y) relie deux informations et leurs unités.<span class="course-example">(3 ; 60) peut signifier : au bout de 3 h, la distance est 60 km.</span>']
  ]},
  algorithm:{title:'Exécuter une suite d’instructions',rules:[
    ['Suivre l’ordre','On exécute les blocs de haut en bas en notant la nouvelle valeur après chaque instruction.'],
    ['Variable','« Mettre x à… » remplace l’ancienne valeur de x par la nouvelle.'],
    ['Déplacement','On garde la direction du lutin à jour après chaque rotation. Dans une boucle, on répète exactement le nombre de fois indiqué.']
  ]}
});

// Les identifiants du registre pédagogique sont la référence pour les modules.
// Ces alias gardent les anciennes clés internes du catalogue utilisables pendant
// la transition du moteur découpé.
Object.assign(courseCatalog,{
  divisibility:courseCatalog.divisibility_rules,
  integer_squares:courseCatalog.squares,
  solid_recognition:courseCatalog.solids,
  area:courseCatalog.area_formulas,
  volume:courseCatalog.volume_formulas
});

function courseGcd(a,b){a=Math.abs(Math.trunc(a));b=Math.abs(Math.trunc(b));while(b){const t=b;b=a%b;a=t;}return a||1;}
function courseNumber(value){const rounded=Math.round(Number(value)*100)/100;return String(rounded).replace('.',',');}
function percentageMethod(percent){
 const p=Number(percent),g=courseGcd(p,100),num=p/g,den=100/g;
 const equivalence=p+' % = '+courseFraction(p,100)+(g>1?' = '+courseFraction(num,den):'');
 const methods={
   50:['prendre la moitié','50 % de 36 = 36 ÷ 2 = 18'],
   25:['prendre le quart','25 % de 36 = 36 ÷ 4 = 9'],
   20:['partager en 5 parts égales et prendre une part','20 % de 45 = 45 ÷ 5 = 9'],
   10:['prendre un dixième','10 % de 70 = 70 ÷ 10 = 7'],
   5:['calculer 10 %, puis prendre la moitié','5 % de 80 = (80 ÷ 10) ÷ 2 = 4'],
   75:['prendre trois quarts : diviser par 4 puis multiplier par 3','75 % de 40 = (40 ÷ 4) × 3 = 30'],
   15:['additionner 10 % et 5 %','15 % de 60 = 6 + 3 = 9']
 };
 const chosen=methods[p];
 return {equivalence,method:chosen?chosen[0]:'multiplier la quantité par '+courseFraction(p,100),example:chosen?chosen[1]:p+' % de 200 = '+courseNumber(200*p/100)};
}
function fractionQuantityCourse(context){
 if(context&&context.kind==='fraction'){
   const n=Number(context.numerator),d=Number(context.denominator);
   return {title:'Calculer '+n+'/'+d+' d’une quantité',rules:[
     ['Sens','Le dénominateur '+d+' partage la quantité en '+d+' parts égales ; le numérateur '+n+' indique combien de parts on prend.'],
     ['Méthode','On divise la quantité par '+d+', puis on multiplie par '+n+'.'],
     ['Écriture','<span class="course-equation">'+courseFraction(n,d)+' × quantité = (quantité ÷ '+d+') × '+n+'</span><span class="course-example">Exemple : '+courseFraction(3,4)+' de 20 = (20 ÷ 4) × 3 = 15.</span>']
   ]};
 }
 const p=Number(context&&context.percent||0),strategy=percentageMethod(p);
 return {title:'Calculer '+p+' % d’une quantité',rules:[
   ['Sens',strategy.equivalence+'. Un pourcentage exprime une part sur 100.'],
   ['Méthode efficace','Ici, on peut '+strategy.method+'.'],
   ['Écriture rigoureuse','<span class="course-equation">'+p+' % de N = '+courseFraction(p,100)+' × N</span><span class="course-example">Exemple : '+strategy.example+'.</span>']
 ]};
}
function percentChangeCourse(context){
 // Refonte dnb_35 : trois cartes courtes qui tiennent à l’écran (1366 × 625),
 // exemples du brevet (baisse de 10 % sur 60 € ; hausse de 20 % sur 15 €).
 const line=text=>'<span style="display:block">'+text+'</span>';
 return {title:'Hausse et baisse en %',rules:[
   ['On calcule p % du prix, puis on l’ajoute ou on l’enlève','<span class="course-example">'+line('Baisse de 10 % sur 60 € :')+line('10 % de 60 € = 6 € ; 60 − 6 = 54 €')+'</span><span class="course-example">'+line('Hausse de 20 % sur 15 € :')+line('20 % de 15 € = 3 € ; 15 + 3 = 18 €')+'</span>',true],
   ['Les repères',line('10 % : on divise par 10.')+line('5 % : la moitié de 10 %.')+line('30 % : 3 fois 10 %.')+line('25 % : ÷ 4 ; 50 % : ÷ 2.')],
   ['Le coefficient multiplicateur',line('+ 20 % : × 1,2 (120 %)')+line('− 10 % : × 0,9 (90 %)')+line('+ 3 % : × 1,03 (pas × 1,3)')]
 ]};
}
function conversionCourse(context){
 const number=Number(context&&context.questionNumber||1);
 if(number===8) return {title:'Convertir des durées',rules:[
   ['Deux équivalences','Les deux disques reliés par « = » représentent la même durée : 1 h = 60 min et 1 min = 60 s.'+courseConversionVisual('duration')],
   ['Vers une unité plus petite','On multiplie : heures → minutes, × 60 ; minutes → secondes, × 60.'],
   ['Exemple complet','<span class="course-equation">2 h 15 min = (2 × 3 600) + (15 × 60) = 8 100 s</span><span class="course-example">Une heure vaut aussi 3 600 s, car 60 × 60 = 3 600.</span>']
 ]};
 if([3,4].includes(number)) return {title:'Convertir des aires',rules:[
   ['Pourquoi deux positions ?','Une unité d’aire est un carré : 1 m² = 100 dm². Il faut donc deux chiffres par changement d’unité.'+courseConversionVisual('area')],
   ['Méthode','On place le chiffre des unités dans la colonne de l’unité donnée, puis on complète jusqu’à l’unité demandée.'],
   ['Exemple','<span class="course-equation">3 m² = 30 000 cm²</span> car on franchit deux unités, soit quatre positions décimales.']
 ]};
 if([5,9].includes(number)) return {title:'Convertir des volumes et des capacités',rules:[
   ['Pourquoi trois positions ?','Une unité de volume est un cube : il faut trois chiffres par changement d’unité.'+courseConversionVisual('volume')],
   ['Équivalences à connaître','<span class="course-equation">1 dm³ = 1 L</span> et <span class="course-equation">1 cm³ = 1 mL</span>.'],
   ['Exemple','<span class="course-equation">4 000 cm³ = 4 dm³ = 4 L</span>.']
 ]};
 return {title:'Convertir des longueurs, masses ou capacités',rules:[
   ['Tableau de numération','Chaque changement d’unité correspond à une position : kilo, hecto, déca, unité, déci, centi, milli.'+courseConversionVisual('metric')],
   ['Méthode','On place le chiffre des unités dans la colonne de l’unité donnée. On lit ensuite dans l’unité demandée en complétant avec des zéros si nécessaire.'],
   ['Écriture mathématique','Vers une unité 10 fois plus petite, la mesure numérique est multipliée par 10 ; vers une unité 10 fois plus grande, elle est divisée par 10.'],
   ['Exemple','<span class="course-equation">2,4 km = 2 400 m</span> et <span class="course-equation">350 cm = 3,5 m</span>.']
 ]};
}
function trigonometryCourse(context,calculator=false){
 const visual=courseTrigVisual();
 // dnb_26 (refonte du 08/10/2026) : le cosinus seul, comme au brevet ; trois
 // cartes courtes (le cosinus et les côtés, un exemple, une longueur) qui
 // tiennent au téléphone 390 et à l’ordinateur 1366 × 625. Couleurs :
 // hypoténuse violette, adjacent bleu (les mêmes qu’à la correction).
 if(!calculator){
   const hypW='<b style="color:#7a3db8">hypoténuse</b>',adjW='<b style="color:#0a6fc2">adjacent</b>';
   const hat=name=>'<span class="widehat">'+name+'</span>',nw=html=>'<span style="white-space:nowrap">'+html+'</span>';
   return {title:'Le cosinus',rules:[
     // Écran large : la figure à gauche du texte ; téléphone : l’une sous l’autre.
     ['Dans un triangle rectangle','<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:2px 16px"><div style="flex:1 1 210px;max-width:270px">'+courseCosineVisual()+'</div><div style="flex:1 1 250px"><div style="font-size:1.12em;font-weight:900">'+nw('cos('+hat('EDF')+') = '+courseFraction(adjW,hypW))+'</div><div style="margin-top:3px">L’'+hypW+' est en face de l’angle droit&nbsp;: c’est le plus long côté. L’'+adjW+' touche D, la lettre du milieu.</div></div></div>',true],
     ['Exemple','<span class="course-example" style="margin-top:0">DE = 6&nbsp;cm et DF = 10&nbsp;cm<br>'+nw('cos('+hat('EDF')+') = '+courseFraction('DE','DF')+' = '+courseFraction(6,10)+' = '+courseFraction(3,5))+'</span><div style="margin-top:4px">Un cosinus est toujours plus petit que 1.</div>'],
     ['Une longueur','<span class="course-example" style="margin-top:0">'+nw('cos(60°) = '+courseFraction('AB',5))+'<br>'+nw('AB = 5 × cos(60°)')+'</span><div style="margin-top:4px">AB en haut&nbsp;: on <b>multiplie</b>.<br>Longueur en bas&nbsp;: on <b>divise</b>.</div>']
   ]};
 }
 return {title:'Trigonométrie avec calculatrice',rules:[
   ['1. Choisir le rapport','Repère les deux côtés utiles, puis choisis sinus, cosinus ou tangente. Écris d’abord l’égalité avec les noms des côtés.'+visual],
   ['2. Chercher une longueur','Les six cas sont possibles : adjacent ou hypoténuse avec le cosinus ; opposé ou hypoténuse avec le sinus ; opposé ou adjacent avec la tangente.<span class="course-example">Exemple : <span class="course-equation">cos(40°) = '+courseFraction('AB','12')+'</span>, donc <span class="course-equation">AB = 12 × cos(40°)</span>. Si la longueur cherchée est au dénominateur, on divise.</span>'],
   ['3. Chercher un angle','On utilise la fonction inverse : <span class="course-equation">Â = cos⁻¹('+courseFraction('adjacent','hypoténuse')+')</span>, ou sin⁻¹, ou tan⁻¹ selon les côtés connus.'],
   ['4. Résoudre un problème','Pour une aire ou un périmètre, la trigonométrie peut fournir une longueur intermédiaire. On conserve sa valeur exacte dans la calculatrice et on arrondit seulement la réponse finale.'],
   ['Calculatrice et contrôle','La calculatrice doit être en mode degrés. Un côté de l’angle droit ne peut pas dépasser l’hypoténuse ; un résultat incohérent signale souvent un rapport inversé.']
 ]};
}
function contextualAreaCourse(context){
 const kind=String(context&&context.kind||''),forced=String(context&&context.shape||'');
 const shape=forced||(kind.includes('rectangle')?'rectangle':kind.includes('square')?'square':kind.includes('triangle')?'triangle':kind.includes('disk')?'disk':'composite');
 const data={
   rectangle:{title:'Aire d’un rectangle',name:'Rectangle',formula:'A = longueur × largeur',example:'A = 8 × 3 = 24 cm²'},
   square:{title:'Aire d’un carré',name:'Carré',formula:'A = côté × côté = côté²',example:'A = 5 × 5 = 25 cm²'},
   triangle:{title:'Aire d’un triangle',name:'Triangle',formula:'A = (base × hauteur) ÷ 2',example:'A = (10 × 6) ÷ 2 = 30 cm²'},
   disk:{title:'Aire d’un disque',name:'Disque',formula:'A = π × rayon × rayon = πr²',example:'Avec r = 4 cm : A ≈ 3,14 × 4² = 50,24 cm²'}
 };
 if(shape==='composite') return {title:'Aire d’une figure composée',rules:[
   ['Découper','Repère des rectangles, carrés, triangles ou disques dont les dimensions sont connues.'],
   ['Calculer','Calcule séparément chaque aire avec sa formule, puis additionne les parties ajoutées ou soustrais les parties retirées.'],
   ['Unité','Toutes les longueurs doivent être dans la même unité ; le résultat s’écrit en unité carrée.']
 ]};
 const item=data[shape];
 return {title:item.title,rules:[
   [item.name,item.formula+courseShapeVisual(shape)],
   ['Méthode','Repère uniquement les dimensions utiles, remplace-les dans la formule, puis calcule.'],
   ['Exemple','<span class="course-equation">'+item.example+'</span>'+(shape==='triangle'?'<span class="course-example">La hauteur utilisée est perpendiculaire à la base.</span>':'')+(shape==='disk'?'<span class="course-example">Si le diamètre est donné, commence par calculer le rayon : r = d ÷ 2.</span>':'')]
 ]};
}
function contextualVolumeCourse(context){
 const number=Number(context&&context.questionNumber||1);
 const kind=[1,5,10].includes(number)?'cube':[2,6].includes(number)?'pave':[3,7,8].includes(number)?'prism':'cylinder';
 const data={
   cube:{title:'Volume d’un cube',name:'Cube',formula:'V = côté × côté × côté = côté³',example:'Avec un côté de 4 cm : V = 4³ = 64 cm³'},
   pave:{title:'Volume d’un pavé droit',name:'Pavé droit',formula:'V = longueur × largeur × hauteur',example:'V = 8 × 3 × 5 = 120 cm³'},
   prism:{title:'Volume d’un prisme droit',name:'Prisme droit',formula:'V = aire de la base × hauteur du prisme',example:'Aire de base 12 cm² et hauteur 5 cm : V = 12 × 5 = 60 cm³'},
   cylinder:{title:'Volume d’un cylindre',name:'Cylindre',formula:'V = aire du disque de base × hauteur = πr²h',example:'r = 3 cm et h = 5 cm : V ≈ 3,14 × 3² × 5 = 141,3 cm³'}
 },item=data[kind];
 return {title:item.title,rules:[
   [item.name,item.formula+courseSolidVisual(kind)],
   ['Sens','Un volume mesure l’espace occupé par le solide. Pour un prisme ou un cylindre, on empile des bases identiques le long de la hauteur.'],
   ['Exemple','<span class="course-equation">'+item.example+'</span>'+(kind==='cylinder'?'<span class="course-example">Si le diamètre est donné, calcule d’abord r = d ÷ 2.</span>':'')]
 ]};
}
function courseAngleVisual(data){
 const component=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('geometry.angle-vocabulary');
 return component?'<div class="course-angle-visual">'+component.render(data)+'</div>':'';
}
function angleVocabularyCourse(context){
 const sections=Array.isArray(context&&context.helpSections)&&context.helpSections.length?context.helpSections:['angle-range'];
 const section=sections[0],value=Number(context&&context.value),known=Number(context&&context.known);
 const courses={
   'angle-range':{title:'Reconnaître la nature d’un angle',label:'Comparer à 90° et 180°',visual:{kind:'gallery'}},
   'angle-range-extended':{title:'Les six natures d’angles',label:'De l’angle nul à l’angle plein',visual:{kind:'gallery',extended:true}},
   'right-angle':{title:'L’angle droit',label:'Le petit carré code 90°',visual:{kind:'single',angleKind:'right',showMeasure:true}},
   'flat-angle':{title:'L’angle plat',label:'Une ligne droite forme 180°',visual:{kind:'single',angleKind:'flat',showMeasure:true}},
   'opposite-angles':{title:'Angles opposés par le sommet',label:'Ils ont la même mesure',visual:{kind:'opposite',value:Number.isFinite(value)?value:58,reveal:true}},
   'adjacent-angles':{title:'Angles adjacents',label:'Même sommet et un côté commun',visual:{kind:'adjacent',showValues:false}},
   complementary:{title:'Angles complémentaires',label:'On complète jusqu’à 90°',visual:{kind:'complementary',value:Number.isFinite(value)?value:34,reveal:true}},
   supplementary:{title:'Angles supplémentaires',label:'On complète jusqu’à 180°',visual:{kind:'supplementary',value:Number.isFinite(value)?value:62,reveal:true}},
   'angle-name':{title:'Nommer un angle',label:'Trois lettres, sommet au milieu',visual:{kind:'named',letters:context&&context.letters}},
   'compare-opening':{title:'Comparer deux angles',label:'Observer l’ouverture',visual:{kind:'compare'}},
   bisector:{title:'La bissectrice d’un angle',label:'Deux angles de même mesure',visual:{kind:'bisector'}},
   'parallel-relations':context&&context.relation==='corresponding'
     ?{title:'Angles et droites parallèles',label:'Même position : angles correspondants',visual:{kind:'parallel',relation:'corresponding'}}
     :{title:'Angles et droites parallèles',label:'De part et d’autre : angles alternes-internes',visual:{kind:'parallel',relation:'alternate'}},
   'set-square':{title:'Les angles de l’équerre',label:'Deux modèles à connaître',visual:{kind:'set-square',known:Number.isFinite(known)?known:30,reveal:true}},
   'protractor-reading':{title:'Mesurer avec un rapporteur',label:'Partir du 0° placé sur le premier côté',visual:{kind:'protractor',degrees:Number.isFinite(Number(context&&context.degrees))?Number(context.degrees):40,reveal:true}}
 };
 const chosen=courses[section]||courses['angle-range'];
 return {title:chosen.title,layout:'angles',rules:[[chosen.label,courseAngleVisual(chosen.visual),true,section]]};
}
function courseProportionTableVisual(){
 return '<table class="proportion-course-table"><tr><th>Grandeur A</th><td>2</td><td>4</td><td>7</td></tr><tr><th>Grandeur B</th><td>10</td><td>20</td><td>35</td></tr></table><div class="proportion-course-calculations"><span>10 ÷ 2 = 5</span><span>20 ÷ 4 = 5</span><span>35 ÷ 7 = 5</span></div>';
}
function courseProportionGraphVisual(){
 return '<div class="proportion-course-graphs"><div class="proportion-course-graph"><strong>Proportionnel</strong><svg viewBox="0 0 210 135" role="img" aria-label="Droite passant par l’origine"><path d="M25 115H195M25 115V12" fill="none" stroke="#35526e" stroke-width="2"/><path d="M25 115L180 22" fill="none" stroke="#0b79d0" stroke-width="3"/><circle cx="25" cy="115" r="4" fill="#e86100"/><circle cx="80" cy="82" r="4" fill="#c0392b"/><circle cx="135" cy="49" r="4" fill="#c0392b"/><text x="14" y="129" font-size="13" font-weight="800" fill="#9a4100">O</text></svg></div><div class="proportion-course-graph"><strong>Non proportionnel</strong><svg viewBox="0 0 210 135" role="img" aria-label="Droite ne passant pas par l’origine"><path d="M25 115H195M25 115V12" fill="none" stroke="#35526e" stroke-width="2"/><path d="M25 88L180 22" fill="none" stroke="#8b1f5f" stroke-width="3"/><circle cx="25" cy="115" r="4" fill="#e86100"/><circle cx="80" cy="65" r="4" fill="#c0392b"/><circle cx="135" cy="42" r="4" fill="#c0392b"/><path d="M25 108V95" fill="none" stroke="#e86100" stroke-width="2" stroke-dasharray="3 3"/><text x="14" y="129" font-size="13" font-weight="800" fill="#9a4100">O</text></svg></div></div>';
}
function recognizeProportionCourse(context){
 const type=String(context&&context.questionTypeId||'');
 if(type==='reconnaitre-tableau') return {title:'Tester un tableau de proportionnalité',rules:[
   ['Comparer les colonnes','On divise chaque valeur de la deuxième grandeur par la valeur correspondante de la première.'+courseProportionTableVisual(),true],
   ['Conclusion','Les trois quotients sont égaux à 5 : le même multiplicateur <span class="course-multiplier">× 5</span> transforme toute la première ligne en la seconde. Le tableau est donc proportionnel.'],
   ['Attention','Ajouter toujours le même nombre ne suffit pas. Par exemple, passer de 3, 4, 5 à 7, 8, 9 revient à ajouter 4, mais les quotients ne sont pas égaux.']
 ]};
 if(type==='reconnaitre-graphique') return {title:'Reconnaître une proportionnalité sur un graphique',rules:[
   ['Le critère','Les points doivent être alignés sur une droite qui passe par l’origine <strong>O</strong> du repère.'+courseProportionGraphVisual(),true],
   ['Pourquoi l’origine ?','Quand la première grandeur vaut 0, la seconde doit aussi valoir 0. La droite d’une situation proportionnelle passe donc par le point (0 ; 0).'],
   ['Attention','Une droite peut représenter une évolution régulière sans être proportionnelle : si elle ne passe pas par l’origine, il existe une valeur de départ non nulle.']
 ]};
 if(type==='reconnaitre-formule') return {title:'Reconnaître la formule d’une proportionnalité',rules:[
   ['La forme à reconnaître','Une relation est proportionnelle quand elle s’écrit <span class="course-equation">y = kx</span>. Le nombre <strong>k</strong> est le coefficient de proportionnalité.'],
   ['Exemple','Avec <span class="course-equation">y = 4x</span>, on multiplie toujours <strong>x</strong> par 4 : 1 donne 4, 2 donne 8 et 3 donne 12. Si x double, y double aussi.',true],
   ['Attention','<span class="course-equation">y = 4x + 3</span> n’est pas une proportionnalité : la valeur fixe + 3 fait que y vaut 3 lorsque x vaut 0.']
 ]};
 return {title:'Reconnaître une situation de proportionnalité',rules:[
   ['Test rapide','Si on double une grandeur, l’autre doit doubler ; si on la triple, l’autre doit tripler. Le même multiplicateur doit fonctionner dans tous les cas.'],
   ['Situations proportionnelles','Une recette adaptée au nombre de personnes, les longueurs sur un plan à l’échelle ou un prix au kilogramme sans frais fixe sont des situations de proportionnalité.'],
   ['Attention','Deux grandeurs liées ne sont pas forcément proportionnelles. Un enfant de 10 ans n’est pas deux fois plus grand qu’à 5 ans. Une valeur de départ ou des frais fixes empêchent aussi la proportionnalité.']
 ]};
}
function courseForSlide(slide){
 if(!slide||!slide.courseKind) return null;
 if(slide.courseKind==='fraction_quantity_percent') return fractionQuantityCourse(slide.courseContext||{});
 if(slide.courseKind==='percent_change') return percentChangeCourse(slide.courseContext||{});
 if(slide.courseKind==='conversions') return conversionCourse(slide.courseContext||{});
 if(['trigonometry_basics','trigonometry_reasoning'].includes(slide.courseKind)) return trigonometryCourse(slide.courseContext||{},false);
 if(['trigonometry_calculator','trigonometry_calculation'].includes(slide.courseKind)) return trigonometryCourse(slide.courseContext||{},true);
 if(slide.courseKind==='area_formulas') return contextualAreaCourse(slide.courseContext||{});
 if(slide.courseKind==='volume_formulas') return contextualVolumeCourse(slide.courseContext||{});
 if(slide.courseKind==='angle_vocabulary') return angleVocabularyCourse(slide.courseContext||{});
 if(slide.courseKind==='recognize_proportion') return recognizeProportionCourse(slide.courseContext||{});
 if(slide.courseKind==='thales'){
   const course=courseCatalog.thales,sections=Array.isArray(slide.courseContext&&slide.courseContext.helpSections)?slide.courseContext.helpSections:[];
   const rules=course.rules.filter(rule=>sections.includes(rule[3]));
   return {title:'Gabarit de Thalès',layout:'thales',rules:[['La méthode',courseThalesTemplateVisual(),true],...(rules.length?rules:course.rules)]};
 }
 if(slide.courseKind==='pythagoras'){
   const course=courseCatalog.pythagoras,sections=Array.isArray(slide.courseContext&&slide.courseContext.helpSections)?slide.courseContext.helpSections:[];
   const rules=course.rules.filter(rule=>sections.includes(rule[3]));
   return {title:course.title,rules:rules.length?rules:course.rules};
 }
 if(slide.courseKind==='decimal_numbers'){
   const course=courseCatalog.decimal_numbers,sections=Array.isArray(slide.courseContext&&slide.courseContext.helpSections)?slide.courseContext.helpSections:[];
   // Une carte seule (ou la dernière d'un nombre impair) prend toute la largeur.
   const rules=course.rules.filter(rule=>sections.includes(rule[3])).map((rule,index,list)=>list.length%2&&index===list.length-1?[rule[0],rule[1],true,rule[3]]:rule);
   return {title:course.title,rules:rules.length?rules:course.rules};
 }
 if(slide.courseKind==='expand_factor'){
   const course=courseCatalog.expand_factor,sections=Array.isArray(slide.courseContext&&slide.courseContext.helpSections)?slide.courseContext.helpSections:[];
   const rules=course.rules.filter(rule=>sections.includes(rule[3]));
   const doubleBridge=sections.some(section=>['double-distribute','identities'].includes(section));
   const bridge=doubleBridge
     ?['Du calcul numérique au calcul littéral','<p>On peut d’abord découper les nombres : <strong>22 = 20 + 2</strong> et <strong>12 = 10 + 2</strong>. Le tableau donne quatre produits.</p><div class="expand-course-grid"><span></span><strong>10</strong><strong>2</strong><strong>20</strong><span>200</span><span>40</span><strong>2</strong><span>20</span><span>4</span></div><span class="course-example">22 × 12 = 200 + 40 + 20 + 4 = 264. Avec des lettres, on fait exactement les quatre produits.</span>',true]
     :['Du calcul numérique au calcul littéral','<p>On découpe 12 en 10 + 2, puis le facteur 7 multiplie chaque partie.</p><div class="course-equation">7 × 12 = 7 × (10 + 2) = 7 × 10 + 7 × 2 = 84</div><span class="course-example">Développer lit ce calcul de gauche à droite ; factoriser le relit de droite à gauche.</span>',true];
   const currentExample=slide.courseContext&&slide.courseContext.exampleHtml
     ?[['Exemple avec les nombres de cette question',slide.courseContext.exampleHtml,true]]:[];
   return {title:course.title,layout:'expand-factor',rules:[bridge,...currentExample,...(rules.length?rules:course.rules)]};
 }
 return courseCatalog[slide.courseKind]||null;
}
function fitNavNumbers(){
 if(interactiveMode) return;
 const nav=document.getElementById('navnums');
 const buttons=[...nav.querySelectorAll('.navnum')];
 if(!buttons.length) return;
 const gap=5;
 const available=nav.clientWidth;
 const raw=Math.floor((available-gap*(buttons.length-1))/buttons.length);
 const size=Math.max(25,Math.min(42,raw));
 const font=Math.max(11,Math.min(18,Math.round(size*.42)));
 const radius=Math.max(6,Math.round(size*.24));
 buttons.forEach(b=>{
   b.style.width=size+'px';
   b.style.height=size+'px';
   b.style.flexBasis=size+'px';
   b.style.fontSize=font+'px';
   b.style.borderRadius=radius+'px';
 });
}
function setModuleClasses(diapo,moduleId){
 const map={
   'module01-mode':['dnb_01'],'decimal-mode':['dnb_02','dnb_39'],'place-value-mode':['dnb_02b'],'fraction-ops-mode':['dnb_03','dnb_03b'],'fraction-percent-mode':['dnb_04'],
   'multiple-forms-mode':['dnb_05'],'scientific-mode':['dnb_06'],'squares-mode':['dnb_07'],'divisibility-mode':['dnb_08'],
   'relation-mode':['dnb_09'],'reduction-mode':['dnb_10'],'substitution-mode':['dnb_11'],'expand-factor-mode':['dnb_12'],
   'equation-mode':['dnb_13'],'numberline-mode':['dnb_14'],'geometry-choice-mode':['dnb_16','dnb_17'],'angles-mode':['dnb_17'],'angle-sum-mode':['dnb_18'],
   'conversion-mode':['dnb_19'],'solids-mode':['dnb_20'],'perimeter-mode':['dnb_21'],'area-mode':['dnb_22'],'volume-mode':['dnb_23'],'average-mode':['dnb_30'],
   'median-mode':['dnb_31'],'read-data-mode':['dnb_32'],'recognize-proportion-mode':['dnb_33'],'proportion-mode':['dnb_34'],'evolution-mode':['dnb_35'],'data-mode':['dnb_28','dnb_29'],
   'algorithm-mode':['dnb_37'],'coordinate-mode':['dnb_15'],'transformations-mode':['dnb_27'],'pythagoras-mode':['dnb_24'],'pythagoras-builder-mode':['dnb_24b'],'trigonometry-mode':['dnb_26','dnb_26b'],'thales-mode':['dnb_25'],'relative-tokens-mode':['dnb_38']
 };
 Object.entries(map).forEach(entry=>diapo.classList.toggle(entry[0],entry[1].includes(moduleId)));
 diapo.classList.toggle('dense-mode',['dnb_15','dnb_26','dnb_26b','dnb_32','dnb_36','dnb_37'].includes(moduleId));
}
function tuneRenderedGeometry(current,slide){
 const svg=slide.querySelector('.question svg');
 if(!svg) return;
 if(current.moduleId==='dnb_16'&&[1,9].includes(Number(current.questionNumber))) svg.setAttribute('viewBox','45 35 210 155');
 if(current.moduleId==='dnb_17'&&Number(current.questionNumber)===1) svg.setAttribute('viewBox','70 40 220 190');
 if(current.moduleId==='dnb_17'&&Number(current.questionNumber)===2) svg.setAttribute('viewBox','-20 40 310 190');
}
function render(){
 const current=slides[idx];
 if(interactiveMode&&!interactiveFinished) ensureQuestionSession();
 const nav=document.getElementById('navnums');
 nav.innerHTML='';
 if(!interactiveMode){
   slides.forEach((s,i)=>{const b=document.createElement('button');b.className='navnum '+(i===idx?'active':'');b.textContent=i+1;b.onclick=()=>{idx=i;corr=false;stepReveal=0;render();};nav.appendChild(b);});
 }
 const mobileCounter=document.getElementById('mobileCounter');
 if(mobileCounter) mobileCounter.textContent=(idx+1)+' sur '+slides.length;
 const progress=document.getElementById('progressFill');
 if(progress) progress.style.width=((interactiveFinished?1:(idx+1)/slides.length)*100)+'%';
 const interactiveCounter=document.getElementById('interactiveCounter');
 const interactiveScore=document.getElementById('interactiveScore');
 const interactiveSummary=document.getElementById('interactiveSummary');
 if(interactiveSummary) interactiveSummary.hidden=interactiveFinished;
 if(interactiveCounter) interactiveCounter.innerHTML=interactiveFinished?'':'<span class="counter-word">Question </span>'+(idx+1)+' / '+slides.length;
 if(interactiveScore){interactiveScore.hidden=interactiveFinished;interactiveScore.textContent=interactiveFinished?'':'✓ '+correctCount;}
 const diapo=document.getElementById('diapo');
 diapo.classList.toggle('interactive-mode',interactiveMode);
 diapo.classList.toggle('correction-visible',corr);
 setModuleClasses(diapo,current.moduleId);
 const expandNumber=current.moduleId==='dnb_12'?Number(current.questionNumber):0;
 diapo.classList.toggle('expand-factor-sparse-mode',current.moduleId==='dnb_12'&&[11,23,24,25,26,27].includes(expandNumber));
 diapo.classList.toggle('expand-factor-dense-mode',current.moduleId==='dnb_12'&&[19,20,21,22].includes(expandNumber));
 diapo.classList.toggle('expand-factor-manipulation-mode',current.moduleId==='dnb_12'&&[13,18,22].includes(expandNumber));
 diapo.classList.toggle('right-angle-mode',current.moduleId==='dnb_17'&&[3,4].includes(Number(current.questionNumber)));
 diapo.classList.toggle('angle-figure-mode',current.moduleId==='dnb_18'&&Number(current.questionNumber)===9);
 diapo.classList.toggle('angle-sum-builder-mode',current.moduleId==='dnb_18'&&Number(current.questionNumber)===11);
 diapo.classList.toggle('area-formula-mode',current.moduleId==='dnb_22'&&Number(current.questionNumber)===18);
 diapo.classList.toggle('divisibility-sharing-mode',current.moduleId==='dnb_08'&&Number(current.questionNumber)===10);
 diapo.classList.toggle('proportion-table-mode',current.moduleId==='dnb_34'&&[2,5,11].includes(Number(current.questionNumber)));
 diapo.classList.toggle('geometry-long-prompt-mode',(current.moduleId==='dnb_16'&&[7,10].includes(Number(current.questionNumber)))||(current.moduleId==='dnb_17'&&[5,6].includes(Number(current.questionNumber))));
 diapo.classList.toggle('thales-structured-mode',current.moduleId==='dnb_25'&&[6,8,9].includes(Number(current.questionNumber)));
 diapo.classList.toggle('thales-coherence-mode',current.moduleId==='dnb_25'&&Number(current.questionNumber)===9);
 diapo.classList.toggle('place-value-reasoning-mode',current.moduleId==='dnb_02b'&&Number(current.questionNumber)===8);
 diapo.classList.toggle('equation-direct-layout',current.equationLayout==='direct');
 diapo.classList.toggle('equation-contextual-layout',current.equationLayout==='contextual');
 diapo.classList.toggle('equation-qcm-solution-layout',current.equationLayout==='qcm-solution');
 diapo.classList.toggle('equation-qcm-operation-layout',current.equationLayout==='qcm-operation');
 closeCourse();
 closeEquationDetail();
 closeExpandCorrectionDetail();
 const courseBtn=document.getElementById('courseBtn');
 if(courseBtn) courseBtn.hidden=interactiveFinished||!current.courseKind;
 diapo.classList.toggle('has-course',!interactiveFinished&&!!current.courseKind);
 diapo.classList.toggle('pointer-coarse',coarsePointerMedia.matches);
 diapo.classList.toggle('finished',interactiveFinished);
 const slide=document.getElementById('slide');
 const stage=document.getElementById('stage');
 if(interactiveFinished){
   aideOpen=false;renderAide();
   if(stage) stage.classList.remove('deborde');
   slide.style.zoom='';
   slide.innerHTML=finishScreenHtml();
   if(stage) stage.scrollTop=0;
   document.getElementById('answerDock').hidden=true;
   const keyboardToggle=document.getElementById('keyboardToggle');if(keyboardToggle) keyboardToggle.hidden=true;
   return;
 }
 prepareDock();
 const key=seriesIndex+':'+idx+':'+slides.length+':'+(slides[idx]&&slides[idx].questionNumber)+':'+current.moduleId;
 if(key!==fitKey){
   fitKey=key;
   fitZoom=measureSlideZoom(current);
   if(stage) stage.scrollTop=0;
 }
 slide.innerHTML=corr?current.correctionHtml:current.questionHtml;
 tuneRenderedGeometry(current,slide);
 normalizeOptions(slide);
 if(!interactiveMode) appendPresentationSteps(slide,current);
 applySlideZoom(slide,fitZoom);
 setupPlaceValueTools();setupConversionTools();setupFractionProductTools();setupReadDataTools();
 if(interactiveMode){
   setupInteractiveSlide(current);
   if(interactiveLocked){decorateCorrectedSlide(current);fitCorrectionCard();}
   renderAide();
   updateStageOverflow();
 }else{
   updatePresentationButton();
   requestAnimationFrame(fitNavNumbers);
 }
}
// Relecture : quand la question dépasse (téléphone, écran court), le bas de
// la zone question s'estompe, comme la carte de correction : l'élève voit
// qu'il y a une suite (une option C ou D sous le bord, par exemple).
function updateStageOverflow(){
 const stage=document.getElementById('stage');
 if(stage) stage.classList.toggle('deborde',interactiveMode&&!interactiveFinished&&stage.scrollTop+stage.clientHeight<stage.scrollHeight-2);
}
/* Lot T — mise à l'échelle mesurée (comme ajusterEchelle de Défi tables).
   Ordinateur : la question est réduite (jamais agrandie) pour tenir sans
   défiler, y compris dans un portable 1366 × 625. Diaporama : agrandie
   jusqu'à × 1,6 pour remplir l'écran projeté. Téléphone et tablette : × 1,
   la zone question défile si besoin. L'échelle est calculée une fois par
   question, sur la question ET sur sa correction : rien ne change de taille
   à la validation.
   Relecture : au téléphone, le pied du lot T est plus haut ; une question
   trop longue (saisie ou QCM) peut être réduite jusqu'à × 0,85 avant de
   défiler. Les manipulations ne sont jamais réduites au téléphone (cibles
   tactiles), et les outils qui lisent la position du doigt avec
   getBoundingClientRect (droite graduée, curseur des conversions, axes du
   produit de fractions) ne sont réduits nulle part : Safari et les anciens
   Chrome ne corrigent pas ces mesures du zoom CSS, le point tomberait à côté. */
// Glisse-nombre (.place-value-tool) : la bande suit le pointeur en px d'écran ;
// dans une question agrandie (diaporama, jusqu'à × 1,6), elle courait 1,6 fois
// plus vite que le doigt ou le stylet. Jamais agrandi, comme avant le 17/10.
const ZOOM_OUTILS_POINTEUR='.conversion-tool,.fraction-product-manipulator,.place-value-tool';
function zoomBounds(current){
 const spec=current&&current.interactiveSpec;
 if(spec&&spec.kind==='numberline-point') return {min:1,max:1};
 if(!interactiveMode) return {min:.6,max:window.innerWidth>=1200?1.6:1.15};
 if(coarsePointerMedia.matches) return spec&&(spec.kind==='qcm'||spec.kind==='slots')?{min:.85,max:1}:{min:1,max:1};
 return {min:.66,max:1};
}
// Relecture : dans une question réduite (zoom CSS), un déplacement en px est
// réduit lui aussi ; la carte glissée suit le pointeur si on le divise.
function slideZoomFactor(){const slide=document.getElementById('slide');return slide&&parseFloat(slide.style.zoom)||1;}
function applySlideZoom(slide,zoom){
 slide.style.zoom=Math.abs(zoom-1)<.001?'':zoom.toFixed(3);
}
function slideFits(stage){
 return stage.scrollHeight<=stage.clientHeight+1&&stage.scrollWidth<=stage.clientWidth+1;
}
function measureSlideZoom(current){
 const bounds=zoomBounds(current);
 if(bounds.max<=bounds.min) return bounds.max;
 const slide=document.getElementById('slide'),stage=document.getElementById('stage');
 if(!slide||!stage) return 1;
 const probe=document.createElement('div');probe.innerHTML=current.questionHtml;
 if(probe.querySelector(ZOOM_OUTILS_POINTEUR)) return Math.min(1,bounds.max);
 const states=[current.questionHtml,current.correctionHtml];
 let best=bounds.max;
 // Lot T2 : l'échelle de référence se mesure aide fermée (la place que
 // prend le panneau ouvert est rendue par fitSlideForAide).
 const diapo=document.getElementById('diapo'),aideClass=!!diapo&&diapo.classList.contains('aide-ouverte'),aidePadding=stage.style.paddingBottom;
 if(diapo) diapo.classList.remove('aide-ouverte');
 stage.style.paddingBottom='';
 states.forEach((html,stateIndex)=>{
   // Lot T2 : le pied mesuré est celui de l'état mesuré (consigne seule pour
   // une question sans pavé, carte à sa hauteur minimale pour la correction).
   if(interactiveMode) setDockState(current.interactiveSpec,stateIndex===1);
   slide.innerHTML=html;
   tuneRenderedGeometry(current,slide);
   normalizeOptions(slide);
   if(!interactiveMode&&stateIndex===1) appendPresentationSteps(slide,current,true);
   // La question telle que l'élève la voit : avec ses cases de saisie (la
   // ligne des coefficients d'un polynôme s'ajoute sous l'énoncé).
   const spec=current.interactiveSpec;
   if(interactiveMode&&stateIndex===0&&spec&&specUsesKeypad(spec)&&spec.kind!=='angle-sum-tactile'){
     try{ensureInteractiveEntryState(spec);injectInteractiveResponse(spec);}catch(error){}
   }
   const fits=zoom=>{applySlideZoom(slide,zoom);return slideFits(stage);};
   if(fits(best)) return;
   if(!fits(bounds.min)){best=bounds.min;return;}
   let low=bounds.min,high=best;
   while(high-low>.01){const middle=(low+high)/2;if(fits(middle))low=middle;else high=middle;}
   best=Math.floor(low*100)/100;
 });
 slide.style.zoom='';
 if(interactiveMode) setDockState(current.interactiveSpec,interactiveLocked);
 if(diapo&&aideClass) diapo.classList.add('aide-ouverte');
 stage.style.paddingBottom=aidePadding;
 return best;
}
// Lot T2 : l'état du pied qui change sa hauteur (question sans pavé, question
// validée), posé avant la mesure de la question.
function setDockState(spec,locked){
 const dock=document.getElementById('answerDock');
 if(!dock||!spec) return;
 dock.classList.toggle('qcm-mode',!specUsesKeypad(spec));
 dock.classList.toggle('question-sans-pave',SANS_PAVE_KINDS.includes(spec.kind));
 dock.classList.toggle('locked',!!locked);
}
const SANS_PAVE_KINDS=['qcm','grid-point','coordinate-points','numberline-point','relative-tokens','pythagoras-tactile','decimal-order','decimal-frame','decimal-distributivity'];
function specUsesKeypad(spec){
 if(!spec) return false;
 if(spec.kind==='angle-sum-tactile') return angleSumPlacementValidated;
 return !SANS_PAVE_KINDS.includes(spec.kind);
}
function consigneForSpec(spec){
 if(!spec) return '';
 if(spec.kind==='qcm') return spec.multiple?'Touche les bonnes réponses, puis Valider.':'Touche la bonne réponse, puis Valider.';
 if(spec.kind==='grid-point') return 'Touche le quadrillage, puis Valider.';
 if(spec.kind==='coordinate-points') return spec.coordinate.targets.length>1?'Place M puis N, puis Valider.':'Place le point, puis Valider.';
 if(spec.kind==='numberline-point') return 'Déplace le point, puis Valider.';
 if(spec.kind==='relative-tokens') return 'Déplace les jetons, puis Valider.';
 if(spec.kind==='pythagoras-tactile') return 'Place toutes les étiquettes, puis Valider.';
 if(spec.kind==='angle-sum-tactile'&&!angleSumPlacementValidated) return 'Place les quatre cartes, puis Valider.';
 if(spec.kind==='decimal-order') return 'Place les trois nombres, puis Valider.';
 if(spec.kind==='decimal-frame') return 'Place les deux entiers, puis Valider.';
 if(spec.kind==='decimal-distributivity') return (spec.instruction||'Place les cartes')+', puis Valider.';
 return 'Tape ta réponse au clavier, puis Entrée.';
}
function setupInteractiveSlide(current){
 const dock=document.getElementById('answerDock');
 const spec=current.interactiveSpec;
 const decimalCards=spec.kind==='decimal-order'||spec.kind==='decimal-frame'||spec.kind==='decimal-distributivity';
 dock.hidden=false;
 setDockState(spec,interactiveLocked);
 dock.classList.toggle('relative-tokens-dock',spec.kind==='relative-tokens');
 const kind=document.getElementById('answerKind');
 if(kind) kind.textContent=consigneForSpec(spec);
 const options=[...document.querySelectorAll('#slide .opt')];
 if(spec.kind==='qcm'){
   options.forEach((option,index)=>{
     option.dataset.optionIndex=String(index);
     option.setAttribute('role','button');
     option.setAttribute('tabindex',interactiveLocked?'-1':'0');
     option.setAttribute('aria-pressed',String(selectedOptions.has(index)));
     option.classList.toggle('selected',selectedOptions.has(index));
     option.classList.toggle('wrong-choice',interactiveLocked&&selectedOptions.has(index)&&!option.classList.contains('correct'));
     if(!interactiveLocked){
       option.onclick=()=>toggleInteractiveOption(index);
       // Espace coche ou décoche ; Entrée coche une option libre, et sur une
       // option déjà cochée (clic puis Entrée) elle valide, comme partout.
       option.onkeydown=event=>{if(event.key===' '||(event.key==='Enter'&&!selectedOptions.has(index))){event.preventDefault();event.stopPropagation();toggleInteractiveOption(index);}};
     }
   });
 }else if(spec.kind==='grid-point'){
   ensureInteractiveEntryState(spec);setupGridPointInteraction(spec);
 }else if(spec.kind==='coordinate-points'){
   ensureInteractiveEntryState(spec);setupCoordinatePointInteraction(spec);
 }else if(spec.kind==='numberline-point'){
   ensureInteractiveEntryState(spec);setupNumberLinePointInteraction(spec);
 }else if(spec.kind==='relative-tokens'){
   ensureInteractiveEntryState(spec);setupRelativeTokensInteraction(spec);
 }else if(spec.kind==='pythagoras-tactile'){
   ensureInteractiveEntryState(spec);setupPythagorasTactileInteraction(spec);
 }else if(spec.kind==='angle-sum-tactile'){
   ensureInteractiveEntryState(spec);setupAngleSumTactileInteraction(spec);
 }else if(decimalCards){
   ensureInteractiveEntryState(spec);setupDecimalCardInteraction(spec);
 }else if(!interactiveLocked){
   ensureInteractiveEntryState(spec);
   injectInteractiveResponse(spec);
 }
 renderInteractiveKeypad(spec);
 applyKeypadVisibility(spec);
 renderCorrectionCard(current);
 updateInteractiveControls();
}
function displayDecimalCardValue(value){
 return String(value??'').replace('.',',').replace('-', '−');
}
function setupDecimalCardInteraction(spec){
 const root=document.querySelector('#slide [data-decimal-manipulation]');
 if(!root)return;
 const cards=[...root.querySelectorAll('[data-decimal-card]')];
 const slots=[...root.querySelectorAll('[data-decimal-slot],[data-distributive-slot]')].filter(slot=>slot.getClientRects().length>0).sort((left,right)=>Number(left.dataset.decimalSlot??left.dataset.distributiveSlot)-Number(right.dataset.decimalSlot??right.dataset.distributiveSlot));
 if(interactiveLocked){
   cards.forEach(card=>{card.disabled=true;card.setAttribute('aria-pressed','false');});
   slots.forEach(slot=>slot.setAttribute('tabindex','-1'));
   return;
 }
 const paint=()=>{
   cards.forEach(card=>{
     const value=String(card.dataset.decimalCard||'');
     const used=interactiveValues.includes(value);
     card.classList.toggle('is-selected',!interactiveLocked&&decimalSelectedCard===value);
     card.classList.toggle('is-used',!interactiveLocked&&used);
     card.setAttribute('aria-pressed',String(!interactiveLocked&&decimalSelectedCard===value));
     card.disabled=interactiveLocked;
   });
   slots.forEach(slot=>{
     const index=Number(slot.dataset.decimalSlot??slot.dataset.distributiveSlot),value=interactiveValues[index]||'';
     slot.classList.toggle('is-filled',!!value);
     slot.classList.toggle('is-selected',!interactiveLocked&&index===activeSlotIndex&&!!decimalSelectedCard);
     slot.setAttribute('aria-label',(spec.slots[index]&&spec.slots[index].label||('Position '+(index+1)))+(value?' : '+displayDecimalCardValue(value):' : vide'));
     slot.setAttribute('tabindex',interactiveLocked?'-1':'0');
     if(slot.matches('[data-decimal-slot]')) slot.textContent=value?displayDecimalCardValue(value):'…';
     const textNode=slot.querySelector('[data-distributive-value]');
     if(textNode) textNode.textContent=value?displayDecimalCardValue(value):'';
   });
 };
 const place=(value,index)=>{
   if(!value||!Number.isInteger(index)||index<0||index>=slots.length)return;
   const previousIndex=interactiveValues.indexOf(value);
   if(previousIndex>=0){interactiveValues[previousIndex]='';interactiveTouched[previousIndex]=false;}
   interactiveValues[index]=value;interactiveTouched[index]=true;decimalSelectedCard=null;activeSlotIndex=index;
   paint();updateInteractiveControls();
 };
 cards.forEach(card=>{
   card.onclick=()=>{
     if(Date.now()<decimalSuppressClickUntil)return;
     const value=String(card.dataset.decimalCard||'');
     if(interactiveValues.includes(value))return;
     decimalSelectedCard=decimalSelectedCard===value?null:value;
     paint();
   };
   card.onpointerdown=event=>{
     if(interactiveLocked||event.button>0)return;
     const value=String(card.dataset.decimalCard||'');
     if(!value||interactiveValues.includes(value))return;
     const startX=event.clientX,startY=event.clientY;let moved=false;
     const move=moveEvent=>{
       const dx=moveEvent.clientX-startX,dy=moveEvent.clientY-startY;
       if(Math.hypot(dx,dy)>7)moved=true;
       if(!moved)return;
       moveEvent.preventDefault();card.classList.add('is-dragging');card.style.transform='translate('+(dx/slideZoomFactor())+'px,'+(dy/slideZoomFactor())+'px)';
     };
     const finish=(endEvent,cancelled=false)=>{
       card.classList.remove('is-dragging');card.style.transform='';
       if(!moved||cancelled)return;
       decimalSuppressClickUntil=Date.now()+300;
       const target=document.elementsFromPoint(endEvent.clientX,endEvent.clientY).map(node=>node.closest?.('[data-decimal-slot],[data-distributive-slot]')).find(Boolean);
       if(target)place(value,Number(target.dataset.decimalSlot??target.dataset.distributiveSlot));
     };
     beginTrackedPointerDrag(card,event,{move,end:endEvent=>finish(endEvent,false),cancel:endEvent=>finish(endEvent,true)});
   };
 });
 slots.forEach(slot=>{
   const choose=()=>{
     const index=Number(slot.dataset.decimalSlot??slot.dataset.distributiveSlot);
     activeSlotIndex=index;
     if(decimalSelectedCard){
       place(decimalSelectedCard,index);return;
     }else if(interactiveValues[index]){
       interactiveValues[index]='';interactiveTouched[index]=false;
     }
     paint();updateInteractiveControls();
   };
   slot.onclick=choose;
   if(!slot.matches('button')) slot.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}};
 });
 paint();
}
function setupGridPointInteraction(spec){
 const svg=document.querySelector('#slide .transformation-placement-svg');if(!svg)return;
 svg.querySelectorAll('.transformation-selected-point').forEach(node=>node.remove());
 const expected=(spec.acceptedCombinations&&spec.acceptedCombinations[0])||[];
 const selected=interactiveLocked?expected:interactiveValues;
 if(selected.length===2&&selected.every(value=>String(value)!=='')){
   const target=svg.querySelector('.transformation-grid-hit[data-grid-x="'+selected[0]+'"][data-grid-y="'+selected[1]+'"]');
   if(target){const ns='http://www.w3.org/2000/svg',mark=document.createElementNS(ns,'g');mark.setAttribute('class','transformation-selected-point');mark.setAttribute('transform','translate('+target.getAttribute('cx')+' '+target.getAttribute('cy')+')');mark.innerHTML='<circle r="12" fill="#fff" stroke="'+(interactiveLocked?'#087a55':'#e86100')+'" stroke-width="4"/><path d="M-6 0H6M0-6V6" stroke="'+(interactiveLocked?'#087a55':'#e86100')+'" stroke-width="3" stroke-linecap="round"/>';svg.append(mark);}
 }
 if(interactiveLocked)return;
 svg.querySelectorAll('.transformation-grid-hit').forEach(hit=>{hit.setAttribute('tabindex','0');hit.setAttribute('role','button');const choose=()=>{interactiveValues=[hit.dataset.gridX,hit.dataset.gridY];interactiveTouched=[true,true];setupGridPointInteraction(spec);updateInteractiveControls();};hit.onclick=choose;hit.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}};});
}
function setupCoordinatePointInteraction(spec){
 const svg=document.querySelector('#slide .coordinate-placement-svg');if(!svg)return;
 const targets=spec.coordinate.targets||[];
 svg.querySelectorAll('.coordinate-selected-point').forEach(node=>node.remove());
 const activePoint=Math.max(0,Math.min(targets.length-1,Math.floor(activeSlotIndex/2)));
 document.querySelectorAll('#slide .coordinate-point-selector').forEach((button,index)=>{
   button.classList.toggle('is-active',!interactiveLocked&&index===activePoint);
   button.setAttribute('aria-pressed',String(!interactiveLocked&&index===activePoint));
   button.disabled=interactiveLocked;
   button.onclick=()=>{if(interactiveLocked)return;activeSlotIndex=index*2;setupCoordinatePointInteraction(spec);};
 });
 targets.forEach((target,index)=>{
   const x=interactiveValues[index*2],y=interactiveValues[index*2+1];
   if(!interactiveTouched[index*2]||!interactiveTouched[index*2+1])return;
   const hit=svg.querySelector('.coordinate-grid-hit[data-grid-x="'+x+'"][data-grid-y="'+y+'"]');
   if(!hit)return;
   const ns='http://www.w3.org/2000/svg',mark=document.createElementNS(ns,'g'),color=target.color||'#b3261e';
   const cx=Number(hit.getAttribute('cx')),cy=Number(hit.getAttribute('cy'));
   mark.setAttribute('class','coordinate-selected-point');mark.setAttribute('transform','translate('+cx+' '+cy+')');
   if(!interactiveLocked){
     mark.innerHTML='<path d="M-7 -7L7 7M-7 7L7 -7" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M-7 -7L7 7M-7 7L7 -7" stroke="'+color+'" stroke-width="3.6" stroke-linecap="round"/><text x="12" y="-11" fill="'+color+'" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">'+target.label+'</text>';
   }else{
     // Correction : le point de l'élève reste visible (cercle pointillé) à côté du point attendu.
     if(String(x)===String(target.x)&&String(y)===String(target.y))return;
     const box=svg.viewBox&&svg.viewBox.baseVal,width=box&&box.width||400,height=box&&box.height||400;
     const anchor='middle',dx=0,dy=cy>height*.62?-21:34;
     mark.innerHTML='<circle r="13" fill="none" stroke="#fff" stroke-width="6"/><circle r="13" fill="none" stroke="#6b4fa0" stroke-width="3" stroke-dasharray="4 4"/><path d="M-5 -5L5 5M-5 5L5 -5" stroke="#6b4fa0" stroke-width="3" stroke-linecap="round"/><text x="'+dx+'" y="'+dy+'" text-anchor="'+anchor+'" fill="#6b4fa0" font-family="Arial,sans-serif" font-size="18" font-weight="800" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">ton point</text>';
   }
   svg.append(mark);
 });
 if(interactiveLocked)return;
 svg.querySelectorAll('.coordinate-grid-hit').forEach(hit=>{
   hit.setAttribute('tabindex','0');hit.setAttribute('role','button');
   hit.setAttribute('aria-label','Placer '+targets[activePoint].label+' au point de coordonnées '+hit.dataset.gridX+' ; '+hit.dataset.gridY);
   const choose=()=>{
     const base=activePoint*2;
     interactiveValues[base]=hit.dataset.gridX;interactiveValues[base+1]=hit.dataset.gridY;
     interactiveTouched[base]=true;interactiveTouched[base+1]=true;
     const next=targets.findIndex((target,index)=>!interactiveTouched[index*2]||!interactiveTouched[index*2+1]);
     activeSlotIndex=(next>=0?next:activePoint)*2;
     setupCoordinatePointInteraction(spec);updateInteractiveControls();
   };
   hit.onclick=choose;hit.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}};
 });
 const reset=document.querySelector('#slide [data-coordinate-reset]');
 if(reset)reset.onclick=()=>{resetInteractiveEntryState(spec);setupCoordinatePointInteraction(spec);updateInteractiveControls();};
}
function setupNumberLinePointInteraction(spec){
 const svg=document.querySelector('#slide .number-line-placement-svg');if(!svg)return;
 const point=svg.querySelector('.number-line-point'),handle=svg.querySelector('.number-line-point-hit');
 const tickCount=Math.max(2,Number(svg.dataset.tickCount)||10),left=60,right=582,axisY=82;
 const xFor=index=>left+(Math.max(0,Math.min(tickCount-1,Number(index)||0))/(tickCount-1))*(right-left);
 const targetIndex=Number(spec.numberLine.targetIndex),chosenIndex=Number(interactiveValues[0]);
 svg.querySelectorAll('.number-line-chosen-ghost,.number-line-drag-ghost').forEach(node=>node.remove());
 if(interactiveLocked){
   if(interactiveTouched[0]&&Number.isFinite(chosenIndex)&&chosenIndex!==targetIndex){
     const ns='http://www.w3.org/2000/svg',ghost=document.createElementNS(ns,'g');ghost.setAttribute('class','number-line-chosen-ghost');ghost.setAttribute('transform','translate('+xFor(chosenIndex)+' 0)');ghost.innerHTML='<line x1="0" y1="'+(axisY-15)+'" x2="0" y2="'+(axisY+15)+'"/><text x="0" y="'+(axisY-30)+'">'+spec.numberLine.letter+'</text>';if(point)svg.insertBefore(ghost,point);else svg.append(ghost);
   }
   return;
 }
 const valueFor=index=>Math.round(((Number(index)-spec.numberLine.zeroIndex)*spec.numberLine.step)*1e10)/1e10;
 const update=(index,touched=true)=>{
   const bounded=Math.max(0,Math.min(tickCount-1,Math.round(Number(index)||0)));
   interactiveValues[0]=String(bounded);interactiveTouched[0]=touched;
   if(point){point.setAttribute('transform','translate('+xFor(bounded)+' 0)');point.dataset.pointIndex=String(bounded);}
   if(handle){handle.setAttribute('aria-valuenow',String(bounded));handle.setAttribute('aria-valuetext',spec.numberLine.letter+' : '+String(valueFor(bounded)).replace('.',','));}
   svg.dataset.currentIndex=String(bounded);updateInteractiveControls();
 };
 update(Number.isFinite(chosenIndex)?chosenIndex:spec.numberLine.startIndex,interactiveTouched[0]);
 let selected=false;
 const setSelected=value=>{selected=value;if(point)point.classList.toggle('is-selected',selected);};
 const indexFromClientX=clientX=>{const rect=svg.getBoundingClientRect(),viewX=(clientX-rect.left)*(680/rect.width);return Math.round((viewX-left)/(right-left)*(tickCount-1));};
 if(handle){
   handle.onpointerdown=event=>{
     if(event.button>0)return;
     event.preventDefault();event.stopPropagation();setSelected(true);svg.classList.add('is-dragging');
     const startX=event.clientX;let dragged=false;
     const ghost=document.createElementNS('http://www.w3.org/2000/svg','line');ghost.setAttribute('class','number-line-drag-ghost');ghost.setAttribute('y1',String(axisY-20));ghost.setAttribute('y2',String(axisY+20));svg.insertBefore(ghost,point);
     const move=moveEvent=>{if(Math.abs(moveEvent.clientX-startX)>4)dragged=true;const index=Math.max(0,Math.min(tickCount-1,indexFromClientX(moveEvent.clientX)));update(index,true);const x=xFor(index);ghost.setAttribute('x1',String(x));ghost.setAttribute('x2',String(x));};
     move(event);
     const finish=()=>{svg.classList.remove('is-dragging');ghost.remove();setSelected(!dragged);};
     beginTrackedPointerDrag(handle,event,{move,end:finish,cancel:finish});
   };
   handle.onclick=event=>event.stopPropagation();
   handle.onkeydown=event=>{
     if(!['ArrowLeft','ArrowRight','Home','End','Enter',' '].includes(event.key))return;
     event.preventDefault();event.stopPropagation();
     if(event.key==='Enter'||event.key===' '){setSelected(!selected);return;}
     const current=Number(interactiveValues[0]);
     update(event.key==='Home'?0:(event.key==='End'?tickCount-1:current+(event.key==='ArrowRight'?1:-1)),true);
   };
 }
 svg.querySelectorAll('.number-line-tick-hit').forEach(hit=>{
   const choose=()=>{update(Number(hit.dataset.tickIndex),true);setSelected(false);if(handle)handle.focus();};
   hit.onclick=choose;hit.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();choose();}};
 });
 const reset=document.querySelector('#slide [data-number-line-reset]');
 if(reset)reset.onclick=()=>{interactiveValues=[String(spec.numberLine.startIndex)];interactiveTouched=[false];setSelected(false);setupNumberLinePointInteraction(spec);};
}
function pythagorasBuilderFeedback(message,kind=''){
 const node=document.querySelector('#slide [data-pythagoras-feedback]');if(!node)return;
 node.textContent=message;node.classList.toggle('is-error',kind==='error');node.classList.toggle('is-success',kind==='success');
}
function placePythagorasBuilderToken(spec,value,group,index){
 if(interactiveLocked)return;
 const slot=spec.slots[index];
 if(!slot||slot.group!==group){pythagorasBuilderFeedback(group==='label'?'Cette case attend une aire.':'Cette case attend un côté au carré.','error');return;}
 interactiveValues.forEach((current,currentIndex)=>{if(current===value&&spec.slots[currentIndex]?.group===group){interactiveValues[currentIndex]='';interactiveTouched[currentIndex]=false;}});
 interactiveValues[index]=value;interactiveTouched[index]=true;pythagorasSelectedToken=null;
 pythagorasBuilderFeedback('Étiquette placée. Choisis-en une autre.','success');
 setupPythagorasTactileInteraction(spec);updateInteractiveControls();
}
function setupPythagorasTactileInteraction(spec){
 const root=document.querySelector('#slide [data-pythagoras-builder]');if(!root)return;
 const displayedValues=interactiveLocked?((spec.acceptedCombinations&&spec.acceptedCombinations[0])||interactiveValues):interactiveValues;
 const slots=[...root.querySelectorAll('[data-pythagoras-slot]')];
 slots.forEach(node=>{
   const index=Number(node.dataset.pythagorasSlot),value=displayedValues[index]||'';
   node.textContent=value||'…';node.classList.toggle('filled',!!value);node.classList.toggle('is-selected',!!pythagorasSelectedToken&&spec.slots[index]?.group===pythagorasSelectedToken.group);
   node.disabled=interactiveLocked;
   node.onclick=()=>{
     if(interactiveLocked)return;
     if(pythagorasSelectedToken) placePythagorasBuilderToken(spec,pythagorasSelectedToken.value,pythagorasSelectedToken.group,index);
     else if(value){interactiveValues[index]='';interactiveTouched[index]=false;pythagorasBuilderFeedback('Étiquette retirée.');setupPythagorasTactileInteraction(spec);updateInteractiveControls();}
   };
 });
 root.querySelectorAll('[data-pythagoras-token]').forEach(node=>{
   const value=node.dataset.pythagorasToken||'',group=node.dataset.tokenGroup||'';
   const used=interactiveValues.some((current,index)=>current===value&&spec.slots[index]?.group===group);
   node.classList.toggle('is-used',used);node.classList.toggle('is-selected',!!pythagorasSelectedToken&&pythagorasSelectedToken.value===value&&pythagorasSelectedToken.group===group);node.disabled=interactiveLocked||used;
   node.onclick=()=>{if(interactiveLocked||used||Date.now()<pythagorasSuppressClickUntil)return;pythagorasSelectedToken=pythagorasSelectedToken&&pythagorasSelectedToken.value===value&&pythagorasSelectedToken.group===group?null:{value,group};pythagorasBuilderFeedback(pythagorasSelectedToken?'Touche maintenant une case.':'Sélection annulée.');setupPythagorasTactileInteraction(spec);};
   node.onpointerdown=event=>{
     if(interactiveLocked||used||event.button>0)return;
     const startX=event.clientX,startY=event.clientY;let moved=false;
     const move=moveEvent=>{const dx=moveEvent.clientX-startX,dy=moveEvent.clientY-startY;if(Math.hypot(dx,dy)>7)moved=true;if(moved){moveEvent.preventDefault();node.classList.add('is-dragging');node.style.transform='translate('+(dx/slideZoomFactor())+'px,'+(dy/slideZoomFactor())+'px)';}};
     const finish=(endEvent,cancelled=false)=>{node.classList.remove('is-dragging');node.style.transform='';if(!moved||cancelled)return;pythagorasSuppressClickUntil=Date.now()+250;const target=document.elementFromPoint(endEvent.clientX,endEvent.clientY)?.closest?.('[data-pythagoras-slot]');if(target)placePythagorasBuilderToken(spec,value,group,Number(target.dataset.pythagorasSlot));};
     beginTrackedPointerDrag(node,event,{move,end:endEvent=>finish(endEvent,false),cancel:endEvent=>finish(endEvent,true)});
   };
 });
}
function angleSumBuilderFeedback(message,kind=''){
 const node=document.querySelector('#slide [data-angle-sum-feedback]');if(!node)return;
 node.textContent=message;node.classList.toggle('is-error',kind==='error');node.classList.toggle('is-success',kind==='success');
}
function placeAngleSumBuilderToken(spec,value,index){
 if(interactiveLocked||angleSumPlacementValidated)return;
 const count=Number(spec.placementCount)||4;
 if(!Number.isInteger(index)||index<0||index>=count)return;
 interactiveValues.forEach((current,currentIndex)=>{if(currentIndex<count&&current===value){interactiveValues[currentIndex]='';interactiveTouched[currentIndex]=false;}});
 interactiveValues[index]=value;interactiveTouched[index]=true;angleSumSelectedToken=null;
 angleSumBuilderFeedback('Carte placée. Choisis-en une autre.','success');
 setupAngleSumTactileInteraction(spec);updateInteractiveControls();
}
function setupAngleSumTactileInteraction(spec){
 const root=document.querySelector('#slide [data-angle-sum-builder]');if(!root)return;
 const count=Number(spec.placementCount)||4;
 const displayedValues=interactiveLocked?(spec.expectedPlacement||[]):interactiveValues.slice(0,count);
 const calculation=root.querySelector('[data-angle-sum-calculation]');
 const prompt=root.querySelector('[data-angle-sum-builder-prompt]');
 root.classList.toggle('is-calculation',angleSumPlacementValidated||interactiveLocked);
 if(prompt&&angleSumPlacementValidated&&!interactiveLocked)prompt.textContent='Placement validé. Calcule maintenant 𝑥.';
 if(calculation){calculation.hidden=!(angleSumPlacementValidated||interactiveLocked);}
 root.querySelectorAll('[data-angle-sum-slot]').forEach(node=>{
   const index=Number(node.dataset.angleSumSlot),value=displayedValues[index]||'';
   node.textContent=value||'…';node.classList.toggle('is-filled',!!value);node.classList.toggle('is-selected',!!angleSumSelectedToken&&!angleSumPlacementValidated);
   node.disabled=interactiveLocked||angleSumPlacementValidated;
   node.onclick=()=>{
     if(interactiveLocked||angleSumPlacementValidated)return;
     if(angleSumSelectedToken)placeAngleSumBuilderToken(spec,angleSumSelectedToken,index);
     else if(value){interactiveValues[index]='';interactiveTouched[index]=false;angleSumBuilderFeedback('Carte retirée.');setupAngleSumTactileInteraction(spec);updateInteractiveControls();}
   };
 });
 root.querySelectorAll('[data-angle-sum-token]').forEach(node=>{
   const value=node.dataset.angleSumToken||'',used=interactiveValues.slice(0,count).includes(value);
   node.classList.toggle('is-used',used);node.classList.toggle('is-selected',angleSumSelectedToken===value);node.disabled=interactiveLocked||angleSumPlacementValidated||used;
   node.onclick=()=>{if(interactiveLocked||angleSumPlacementValidated||used||Date.now()<angleSumSuppressClickUntil)return;angleSumSelectedToken=angleSumSelectedToken===value?null:value;angleSumBuilderFeedback(angleSumSelectedToken?'Touche maintenant une case.':'Sélection annulée.');setupAngleSumTactileInteraction(spec);};
   node.onpointerdown=event=>{
     if(interactiveLocked||angleSumPlacementValidated||used||event.button>0)return;
     const startX=event.clientX,startY=event.clientY;let moved=false;
     const move=moveEvent=>{const dx=moveEvent.clientX-startX,dy=moveEvent.clientY-startY;if(Math.hypot(dx,dy)>7)moved=true;if(moved){moveEvent.preventDefault();node.classList.add('is-dragging');node.style.transform='translate('+(dx/slideZoomFactor())+'px,'+(dy/slideZoomFactor())+'px)';}};
     const finish=(endEvent,cancelled=false)=>{node.classList.remove('is-dragging');node.style.transform='';if(!moved||cancelled)return;angleSumSuppressClickUntil=Date.now()+300;const target=document.elementsFromPoint(endEvent.clientX,endEvent.clientY).map(item=>item.closest?.('[data-angle-sum-slot]')).find(Boolean);if(target)placeAngleSumBuilderToken(spec,value,Number(target.dataset.angleSumSlot));};
     beginTrackedPointerDrag(node,event,{move,end:endEvent=>finish(endEvent,false),cancel:endEvent=>finish(endEvent,true)});
   };
 });
 const reset=root.querySelector('[data-angle-sum-reset]');
 if(reset)reset.onclick=()=>{for(let index=0;index<count;index++){interactiveValues[index]='';interactiveTouched[index]=false;}interactiveValues[count]='';interactiveTouched[count]=false;angleSumSelectedToken=null;angleSumPlacementValidated=false;activeSlotIndex=0;angleSumBuilderFeedback('Schéma vidé. Recommence le placement.');setupAngleSumTactileInteraction(spec);updateInteractiveControls();};
 if(angleSumPlacementValidated&&!interactiveLocked&&calculation){
   const target=calculation.querySelector('[data-angle-sum-answer-slot]');
   if(target&&!target.matches('.interactive-input-slot'))target.replaceWith(makeInteractiveSlot(count));
   activeSlotIndex=count;updateInteractiveSlots();angleSumBuilderFeedback('Le placement est correct. Calcule maintenant 𝑥.','success');
 }
}
function relativeClientTokenLabel(sign){return sign>0?'+1':'−1';}
function relativeClientDisplayNumber(value){const text=String(value);return text.startsWith('-')?'−'+text.slice(1):text;}
function relativeClientInitialState(spec){return {tokens:(spec.relative.initialTokens||[]).map(token=>({...token})),nextPair:1};}
function relativeClientStateKey(state){return JSON.stringify({tokens:state.tokens.map(token=>({id:token.id,sign:token.sign,zone:token.zone})).sort((a,b)=>a.id.localeCompare(b.id)),nextPair:state.nextPair});}
function relativeClientPairedIds(tokens,zone){
 const positive=[],negative=[];
 tokens.forEach(token=>{if(token.zone!==zone)return;(token.sign>0?positive:negative).push(token.id);});
 const count=Math.min(positive.length,negative.length);
 return new Set([...positive.slice(0,count),...negative.slice(0,count)]);
}
function relativeClientZoneHtml(label,zone,state){
 const tokens=state.tokens.filter(token=>token.zone===zone),paired=relativeClientPairedIds(state.tokens,zone);
 const tokenHtml=tokens.map(token=>'<button type="button" class="relative-token '+(token.sign>0?'relative-token-positive':'relative-token-negative')+(paired.has(token.id)?' is-null-pair':'')+'" data-relative-token-id="'+token.id+'" aria-label="Jeton '+relativeClientTokenLabel(token.sign)+'">'+relativeClientTokenLabel(token.sign)+'</button>').join('');
 return '<section class="relative-token-zone relative-token-zone-'+zone+'" data-relative-zone="'+zone+'"><h3>'+label+'</h3><div class="relative-token-list">'+(tokenHtml||'<span class="relative-token-empty">—</span>')+'</div></section>';
}
function relativeClientBoardHtml(spec,state){
 return relativeClientZoneHtml('Premier nombre','a',state)+relativeClientZoneHtml('Deuxième nombre','b',state)+relativeClientZoneHtml('Résultat','result',state)+'<p class="relative-token-instruction">Touchez un jeton pour le déplacer dans la zone résultat. Les paires +1/−1 valent zéro.</p><div class="relative-token-actions"><button type="button" class="relative-token-action" data-relative-action="reset">Recommencer</button></div>';
}
function relativeClientRenderBoard(spec){const board=document.querySelector('#slide [data-relative-board]');if(board)board.innerHTML=relativeClientBoardHtml(spec,relativeBoardState);}
function relativeClientSetState(spec,state){
 relativeBoardState=state;interactiveValues=[relativeClientStateKey(state)];
 const initialKey=relativeClientStateKey(relativeClientInitialState(spec));
 interactiveTouched=[interactiveValues[0]!==initialKey];
 relativeClientRenderBoard(spec);updateInteractiveControls();relativeClientBindBoard(spec);
}
function relativeClientBindBoard(spec){
 const board=document.querySelector('#slide [data-relative-board]');if(!board||interactiveLocked)return;
 board.querySelectorAll('[data-relative-token-id]').forEach(button=>button.addEventListener('click',()=>{
   const token=relativeBoardState.tokens.find(item=>item.id===button.dataset.relativeTokenId);if(!token)return;
   token.zone=token.zone==='result'?token.origin:'result';setInteractiveFeedback('','');relativeClientSetState(spec,relativeBoardState);
 }));
 const reset=board.querySelector('[data-relative-action="reset"]');
 if(reset)reset.addEventListener('click',()=>{setInteractiveFeedback('','');relativeClientSetState(spec,relativeClientInitialState(spec));});
}
function setupRelativeTokensInteraction(spec){
 if(!spec||!spec.relative)return;
 if(relativeBoardKey!==spec.relative.instanceKey){relativeBoardKey=spec.relative.instanceKey;relativeBoardState=relativeClientInitialState(spec);interactiveValues=[relativeClientStateKey(relativeBoardState)];interactiveTouched=[false];}
 relativeClientRenderBoard(spec);relativeClientBindBoard(spec);updateInteractiveControls();
}
function setupConversionTools(){
 document.querySelectorAll('.conversion-tool').forEach(tool=>{
   const grid=tool.querySelector('.conversion-grid'),cursor=tool.querySelector('.conversion-cursor');if(!grid||!cursor||cursor.dataset.ready==='1')return;
   cursor.dataset.ready='1';
   const cells=[...tool.querySelectorAll('.conversion-slot')],headers=[...tool.querySelectorAll('.conversion-unit')],units=Number(getComputedStyle(tool).getPropertyValue('--conversion-units'))||7,unitSlots=Number(tool.dataset.unitSlots)||1,totalSlots=units*unitSlots;
   let unit=Number(tool.dataset.initialUnit)||0,slotWidth=0,startX=0,startPx=0,currentPx=0,dragging=false;
   const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
   const refresh=()=>{slotWidth=grid.getBoundingClientRect().width/totalSlots;};
   const setCursor=(px,snap=false)=>{
     cursor.style.transition=snap?'transform .16s ease':'none';
     cursor.style.transform='translateX('+px+'px)';
     currentPx=px;
   };
   const apply=(center=false,snap=true)=>{
     refresh();
     unit=clamp(unit,0,units-1);const unitSlot=unit*unitSlots+(unitSlots-1);
     setCursor(unitSlot*slotWidth,snap);cursor.dataset.unit=String(unit);
     cells.forEach(cell=>{cell.textContent=cell.dataset.digit||'';cell.classList.remove('ghost-zero');});
     const occupied=cells.filter(cell=>(cell.dataset.digit||'')!=='').map(cell=>Number(cell.dataset.slot));
     if(occupied.length){
       const targetRight=unit*unitSlots+(unitSlots-1),start=Math.min(occupied[0],targetRight),end=Math.max(occupied[occupied.length-1],targetRight);
       for(let index=start;index<=end;index++){
         const cell=cells[index];if(cell&&cell.textContent===''){cell.textContent='0';cell.classList.add('ghost-zero');}
       }
     }
     headers.forEach(header=>header.classList.remove('is-cursor-unit'));
     cells.forEach(cell=>cell.classList.remove('is-cursor-unit'));
     const activeHeader=headers.find(header=>Number(header.dataset.unitIndex)===unit&&header.dataset.unitSlot==='true');
     const activeCell=cells[unitSlot];
     if(activeHeader) activeHeader.classList.add('is-cursor-unit');
     if(activeCell) activeCell.classList.add('is-cursor-unit');
     if(center&&tool.scrollWidth>tool.clientWidth+2) requestAnimationFrame(()=>{const slotWidth=grid.getBoundingClientRect().width/(units*unitSlots),cursorCenter=(unitSlot+.5)*slotWidth;tool.scrollLeft=Math.max(0,cursorCenter-tool.clientWidth/2);});
   };
   requestAnimationFrame(()=>apply(true,false));
   cursor.addEventListener('pointerdown',event=>{
     if(event.button>0)return;
     event.preventDefault();refresh();dragging=true;startX=event.clientX;startPx=currentPx;
     const move=moveEvent=>{
       if(!dragging)return;
       const minPx=(unitSlots-1)*slotWidth,maxPx=(totalSlots-1)*slotWidth;
       setCursor(clamp(startPx+(moveEvent.clientX-startX),minPx,maxPx),false);
     };
     const end=endEvent=>{
       if(!dragging)return;
       dragging=false;
       const rect=grid.getBoundingClientRect();
       unit=clamp(Math.floor((endEvent.clientX-rect.left)/rect.width*units),0,units-1);
       apply(true,true);
     };
     const cancel=()=>{if(!dragging)return;dragging=false;apply(true,true);};
     beginTrackedPointerDrag(cursor,event,{move,end,cancel});
   });
   cursor.addEventListener('keydown',event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();unit+=event.key==='ArrowLeft'?-1:1;apply(true,true);});
 });
}
function setupFractionProductTools(){
 document.querySelectorAll('.fraction-product-manipulator').forEach(tool=>{
   const topAxis=tool.querySelector('.fraction-product-top-axis'),leftAxis=tool.querySelector('.fraction-product-left-axis'),grid=tool.querySelector('.fraction-product-grid');
   if(!topAxis||!leftAxis||!grid||tool.dataset.ready==='1')return;tool.dataset.ready='1';
   let topNum=Number(tool.dataset.topNum)||0,topDen=Number(tool.dataset.topDen)||1,leftNum=Number(tool.dataset.leftNum)||0,leftDen=Number(tool.dataset.leftDen)||1;
   const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
   const denominatorFromRatio=ratio=>{let best=1,distance=Infinity;for(let den=1;den<=12;den++){const d=Math.abs(clamp(ratio,0,1)-1/den);if(d<distance){distance=d;best=den;}}return best;};
   const fractionLabel=(selector,num,den)=>{const label=tool.querySelector(selector),parts=label?label.querySelectorAll('b'):[];if(parts[0])parts[0].textContent=String(num);if(parts[1])parts[1].textContent=String(den);};
   const renderAxis=(axis,num,den,vertical)=>{
     axis.innerHTML='<span class="fraction-product-axis-line"></span><span class="fraction-product-axis-selection"></span>';
     const selection=axis.querySelector('.fraction-product-axis-selection');if(vertical)selection.style.height=(num/den*100)+'%';else selection.style.width=(num/den*100)+'%';
     for(let index=0;index<=den;index++){const tick=document.createElement('span');tick.className='fraction-product-tick';if(vertical)tick.style.top=(index/den*100)+'%';else tick.style.left=(index/den*100)+'%';axis.append(tick);}
     const numHandle=document.createElement('span');numHandle.className='fraction-product-num-handle';numHandle.title='Faire glisser pour changer le numérateur';if(vertical)numHandle.style.top=(num/den*100)+'%';else numHandle.style.left=(num/den*100)+'%';axis.append(numHandle);
     const denHandle=document.createElement('span');denHandle.className='fraction-product-den-handle';denHandle.title='Faire glisser pour changer le partage';if(vertical)denHandle.style.top=(1/den*100)+'%';else denHandle.style.left=(1/den*100)+'%';axis.append(denHandle);
     axis.setAttribute('aria-valuenow',String(num));axis.setAttribute('aria-valuemax',String(den));
   };
   const render=()=>{
     topDen=clamp(Math.round(topDen),1,12);leftDen=clamp(Math.round(leftDen),1,12);topNum=clamp(Math.round(topNum),0,topDen);leftNum=clamp(Math.round(leftNum),0,leftDen);
     fractionLabel('.fraction-product-top-label',topNum,topDen);fractionLabel('.fraction-product-left-label',leftNum,leftDen);renderAxis(topAxis,topNum,topDen,false);renderAxis(leftAxis,leftNum,leftDen,true);
     grid.innerHTML='';grid.style.gridTemplateColumns='repeat('+topDen+',1fr)';grid.style.gridTemplateRows='repeat('+leftDen+',1fr)';
     const productDen=topDen*leftDen;
     for(let row=0;row<leftDen;row++)for(let col=0;col<topDen;col++){
       const cell=document.createElement('span');cell.className='fraction-product-cell'+(col<topNum?' column-selected':'')+(row<leftNum?' row-selected':'')+(col===topDen-1?' last-col':'')+(row===leftDen-1?' last-row':'');cell.textContent='1⁄'+productDen;grid.append(cell);
     }
   };
   const startDrag=(axis,vertical)=>(event=>{
     if(tool.dataset.correction==='1'||event.button>0)return;event.preventDefault();const denominator=!!event.target.closest('.fraction-product-den-handle');
     const update=moveEvent=>{const rect=axis.getBoundingClientRect(),ratio=clamp(vertical?(moveEvent.clientY-rect.top)/rect.height:(moveEvent.clientX-rect.left)/rect.width,0,1);if(vertical){if(denominator){leftDen=denominatorFromRatio(ratio);leftNum=Math.min(leftNum,leftDen);}else leftNum=Math.round(ratio*leftDen);}else{if(denominator){topDen=denominatorFromRatio(ratio);topNum=Math.min(topNum,topDen);}else topNum=Math.round(ratio*topDen);}render();};
     update(event);beginTrackedPointerDrag(axis,event,{move:update,end:()=>{},cancel:()=>{}});
   });
   topAxis.addEventListener('pointerdown',startDrag(topAxis,false));leftAxis.addEventListener('pointerdown',startDrag(leftAxis,true));
   topAxis.addEventListener('keydown',event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();topNum+=event.key==='ArrowRight'?1:-1;render();});
   leftAxis.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();leftNum+=event.key==='ArrowDown'?1:-1;render();});
   render();
 });
}
function resetInteractiveEntryState(spec){
 pythagorasSelectedToken=null;
 angleSumSelectedToken=null;
 angleSumPlacementValidated=false;
 decimalSelectedCard=null;
 if(spec&&spec.kind==='relative-tokens'){
   relativeBoardKey=spec.relative.instanceKey;relativeBoardState=relativeClientInitialState(spec);interactiveValues=[relativeClientStateKey(relativeBoardState)];interactiveTouched=[false];activeSlotIndex=0;return;
 }
 const slots=spec&&Array.isArray(spec.slots)?spec.slots:[];
 interactiveValues=slots.map(slot=>String(slot.initialValue===undefined?'':slot.initialValue));
 interactiveTouched=slots.map(()=>false);
 activeSlotIndex=0;
}
function ensureInteractiveEntryState(spec){
 if(spec&&spec.kind==='relative-tokens'){
   if(!relativeBoardState||relativeBoardKey!==spec.relative.instanceKey)resetInteractiveEntryState(spec);
   return;
 }
 const count=Array.isArray(spec.slots)?spec.slots.length:0;
 if(interactiveValues.length!==count||interactiveTouched.length!==count) resetInteractiveEntryState(spec);
 if(activeSlotIndex>=count) activeSlotIndex=Math.max(0,count-1);
}
function makeInteractiveSlot(index){
 const spec=slides[idx].interactiveSpec;
 const slot=spec.slots[index]||{};
 const button=document.createElement('button');
 button.type='button';
 button.className='interactive-input-slot';
 button.dataset.slotIndex=String(index);
 button.setAttribute('aria-label',slot.label||('Réponse '+(index+1)));
 button.addEventListener('click',()=>setActiveInteractiveSlot(index));
 // Lot T2 : la case qui reçoit le focus au clavier devient la case active.
 button.addEventListener('focus',()=>{if(!interactiveLocked&&activeSlotIndex!==index)setActiveInteractiveSlot(index);});
 return button;
}
function interactiveTargets(){
 const slide=document.getElementById('slide');
 const targets=[...slide.querySelectorAll('.answer-slot')];
 slide.querySelectorAll('.answer-dots').forEach(dot=>{if(!dot.closest('.answer-slot')) targets.push(dot);});
 slide.querySelectorAll('.relation-summary-line strong').forEach(strong=>{if(strong.textContent.trim()==='…'&&!targets.includes(strong)) targets.push(strong);});
 return targets.sort((a,b)=>a===b?0:(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1));
}
function fractionResponseNode(){
 const wrapper=document.createElement('span');
 wrapper.className='frac interactive-fraction-response';
 const numerator=document.createElement('span');numerator.className='frac-num';numerator.appendChild(makeInteractiveSlot(0));
 const denominator=document.createElement('span');denominator.className='frac-den';denominator.appendChild(makeInteractiveSlot(1));
 wrapper.append(numerator,denominator);
 return wrapper;
}
function fallbackResponseNode(spec){
 const wrapper=document.createElement('div');
 wrapper.className='interactive-response-fallback';
 wrapper.append(document.createTextNode('= '));
 spec.slots.forEach((slot,index)=>{
   if(index) wrapper.append(document.createTextNode(' ; '));
   wrapper.append(makeInteractiveSlot(index));
 });
 return wrapper;
}
function polynomialResponseNode(spec){
 const wrapper=document.createElement('div');
 wrapper.className='interactive-polynomial-response term-count-'+spec.slots.length;
 if(spec.sourceDisplay){const source=document.createElement('span');source.className='interactive-expand-source';source.textContent=spec.sourceDisplay+' =';wrapper.append(source);}
 const result=document.createElement('span');result.className='interactive-expand-result';wrapper.append(result);
 spec.slots.forEach((slot,index)=>{
   if(index){const separator=document.createElement('span');separator.className='interactive-polynomial-separator';separator.dataset.beforeSlot=String(index);separator.textContent='+';result.append(separator);}
   const term=document.createElement('span');term.className='interactive-polynomial-term';
   term.append(makeInteractiveSlot(index));
   if(slot.term==='x2') term.append(document.createTextNode('𝑥²'));
   if(slot.term==='x') term.append(document.createTextNode('𝑥'));
   result.append(term);
 });
 return wrapper;
}
function algebraTemplateResponseNode(spec){
 const wrapper=document.createElement('div');
 wrapper.className='interactive-algebra-template-response';
 if(spec.sourceDisplay){const source=document.createElement('span');source.className='interactive-expand-source';source.textContent=spec.sourceDisplay+' =';wrapper.append(source);}
 const result=document.createElement('span');result.className='interactive-expand-result';wrapper.append(result);
 (spec.segments||[]).forEach(segment=>{
   if(Number.isInteger(segment.slot)) result.append(makeInteractiveSlot(segment.slot));
   else result.append(document.createTextNode(segment.text||''));
 });
 return wrapper;
}
function injectInteractiveResponse(spec){
 const slide=document.getElementById('slide');
 if(!slide||!spec.slots||!spec.slots.length) return;
 if(spec.layout==='polynomial'||spec.layout==='algebra-template'){
   const node=spec.layout==='polynomial'?polynomialResponseNode(spec):algebraTemplateResponseNode(spec);
   const answer=slide.querySelector('.expand-answer')||slide.querySelector('.legacy-expand-factor .footer:last-of-type');
   if(answer){answer.replaceChildren(node);answer.classList.add('interactive-expand-answer');}
   else{
     const anchor=slide.querySelector('.reduction-tiles:last-of-type')||slide.lastElementChild;
     if(anchor) anchor.insertAdjacentElement('afterend',node); else slide.append(node);
   }
   updateInteractiveSlots();
   return;
 }
 const targets=interactiveTargets();
 if(spec.layout==='fraction'){
   if(targets.length>=2&&targets[0].closest('.frac')&&targets[0].closest('.frac')===targets[1].closest('.frac')){
     targets[0].replaceWith(makeInteractiveSlot(0));
     targets[1].replaceWith(makeInteractiveSlot(1));
   }else if(targets[0]) targets[0].replaceWith(fractionResponseNode());
   else slide.append(fallbackResponseNode(spec));
 }else if(targets.length>=spec.slots.length){
   spec.slots.forEach((slot,index)=>targets[index].replaceWith(makeInteractiveSlot(index)));
 }else{
   const response=fallbackResponseNode(spec);
   if(targets[0]) targets[0].replaceWith(response); else slide.append(response);
 }
 updateInteractiveSlots();
}
function updateInteractiveSlots(){
 document.querySelectorAll('#slide .interactive-input-slot').forEach(button=>{
   const index=Number(button.dataset.slotIndex),value=interactiveValues[index]||'';
   button.textContent=value;
   button.classList.toggle('is-empty',!value);
   button.classList.toggle('active',!interactiveLocked&&index===activeSlotIndex);
   button.setAttribute('aria-pressed',String(!interactiveLocked&&index===activeSlotIndex));
 });
 document.querySelectorAll('#slide .interactive-polynomial-separator').forEach(separator=>{
   const index=Number(separator.dataset.beforeSlot),value=interactiveValues[index]||'';
   separator.textContent=/^[−-]/.test(value)?'':'+';
 });
}
function setActiveInteractiveSlot(index){
 if(interactiveLocked) return;
 activeSlotIndex=Math.max(0,Math.min(interactiveValues.length-1,Number(index)||0));
 updateInteractiveSlots();
}
/* Lot T — le pavé commun (style Défi tables, disposition 5 colonnes du pavé
   partagé de Splat) :
     1 2 3 4 5
     6 7 8 9 0
     [rangée contexte de l'automatisme] ⌫
     Passer | Valider          (la rangée des actions, sous le pavé)
   La rangée contexte est CONSTANTE pour tout l'automatisme : elle ne dépend
   jamais de la réponse attendue (avant, la virgule et le moins n'apparaissaient
   que si la réponse en contenait : le pavé trahissait la réponse). */
function keypadKeyButton(value,label,extraClass=''){
 const button=document.createElement('button');
 button.type='button';
 button.className='key '+(/^\\d$/.test(value)?'digit':'context')+(extraClass?' '+extraClass:'');
 button.dataset.value=value;
 button.textContent=label||value;
 button.disabled=interactiveLocked;
 return button;
}
function renderInteractiveKeypad(spec){
 const keypad=document.getElementById('keypad');
 if(!keypad) return;
 keypad.innerHTML='';
 if(!specUsesKeypad(spec)) return;
 '1234567890'.split('').forEach(digit=>keypad.append(keypadKeyButton(digit,digit)));
 const context=(slides[idx].keypadContext||[',','−']).filter(value=>!/^\\d$/.test(String(value)));
 const contextRows=Math.max(1,Math.ceil((context.length+1)/5));
 context.forEach(value=>keypad.append(keypadKeyButton(String(value),String(value))));
 const backspace=document.createElement('button');backspace.type='button';backspace.className='key utility';backspace.dataset.action='backspace';backspace.setAttribute('aria-label','Effacer le dernier caractère');backspace.title='Effacer le dernier caractère';backspace.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 6h10.1a1.7 1.7 0 0 1 1.7 1.7v8.6a1.7 1.7 0 0 1-1.7 1.7H9.2L3 12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m12.4 9.3 5.4 5.4m0-5.4-5.4 5.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';backspace.disabled=interactiveLocked;
 const used=context.length%5;
 backspace.style.gridColumn='span '+(used===0?5:5-used);
 keypad.append(backspace);
}
/* Lot T — le pied a la même hauteur pendant toute la série : le nombre de
   rangées du pavé est celui de la question qui en demande le plus, et une
   série où AUCUNE question n'utilise le pavé a un pied réduit (consigne +
   Passer/Valider). Calculé une fois par série. */
let serieInfoCache=null;
function seriesKeypadInfo(){
 if(serieInfoCache&&serieInfoCache.slides===slides) return serieInfoCache;
 let uses=false,rows=1;
 (slides||[]).forEach(slide=>{
   const spec=slide&&slide.interactiveSpec;
   if(!spec||(spec.kind!=='angle-sum-tactile'&&SANS_PAVE_KINDS.includes(spec.kind))) return;
   uses=true;
   const context=(slide.keypadContext||[',','−']).filter(value=>!/^\d$/.test(String(value)));
   rows=Math.max(rows,Math.ceil((context.length+1)/5));
 });
 serieInfoCache={slides,uses,rows};
 return serieInfoCache;
}
// Le pied prend sa forme définitive AVANT la mesure de la question
// (measureSlideZoom) : sinon la première question est mesurée sans pied.
function prepareDock(){
 if(!interactiveMode) return;
 const dock=document.getElementById('answerDock');
 if(!dock) return;
 dock.hidden=false;
 const info=seriesKeypadInfo();
 dock.classList.toggle('serie-sans-pave',!info.uses);
 dock.style.setProperty('--pave-rangs',String(2+info.rows));
 applyKeypadVisibility();
 setDockState(slides[idx]&&slides[idx].interactiveSpec,interactiveLocked);
}
function applyKeypadVisibility(spec=slides[idx]&&slides[idx].interactiveSpec){
 const dock=document.getElementById('answerDock'),toggle=document.getElementById('keyboardToggle');
 if(!dock) return;
 const info=seriesKeypadInfo();
 const visible=info.uses&&(coarsePointerMedia.matches||keypadVisible);
 // La disposition du pied ne dépend que de l'appareil (et du bouton clavier),
 // jamais de la question : les boutons Passer et Valider ne bougent pas.
 dock.classList.toggle('avec-pave',visible);
 dock.classList.toggle('sans-pave',!visible);
 // Lot T2 : là où le pied porte un pavé (téléphone, tablette, pavé affiché),
 // ou au téléphone dans une série sans pavé, une question sans pavé n'a que
 // sa consigne. À l'ordinateur, pavé caché, la consigne garde son cadre.
 dock.classList.toggle('consigne-reduite',visible||(!info.uses&&coarsePointerMedia.matches));
 if(toggle){
   toggle.hidden=!interactiveMode||interactiveFinished||coarsePointerMedia.matches||!info.uses;
   toggle.disabled=false;
   toggle.setAttribute('aria-pressed',String(visible));
   const label=visible?'Masquer le pavé':'Afficher le pavé';
   toggle.setAttribute('aria-label',label);toggle.title=label;
 }
}
function toggleKeypad(){
 if(!interactiveMode||coarsePointerMedia.matches) return;
 keypadVisible=!keypadVisible;
 fitKey='';
 render();
}
function hasInteractiveAnswer(){
 const spec=slides[idx].interactiveSpec;
 if(spec.kind==='qcm') return selectedOptions.size>0;
 if(spec.kind==='coordinate-points') return interactiveTouched.length===spec.slots.length&&interactiveTouched.every(Boolean);
 if(spec.kind==='relative-tokens') return interactiveTouched.some(Boolean);
 if(spec.kind==='pythagoras-tactile') return interactiveTouched.length===spec.slots.length&&interactiveTouched.every(Boolean);
 if(spec.kind==='angle-sum-tactile'){
   const count=Number(spec.placementCount)||4;
   return angleSumPlacementValidated?!!interactiveTouched[count]:interactiveTouched.slice(0,count).length===count&&interactiveTouched.slice(0,count).every(Boolean);
 }
 if(spec.kind==='decimal-order'||spec.kind==='decimal-frame'||spec.kind==='decimal-distributivity') return interactiveTouched.length===spec.slots.length&&interactiveTouched.every(Boolean);
 return interactiveTouched.some(Boolean)&&incompleteSlotIndex(spec)<0;
}
// Relecture : une réponse en plusieurs cases (fraction, coordonnées, gabarit
// de factorisation) n'est complète que si chaque case est remplie. Valider
// (ou Entrée, ou →) avec une case encore vide ne compte pas la question
// fausse : la case vide devient la case active. Les coefficients d'un
// polynôme, déjà remplis par 0, ne sont pas concernés.
function incompleteSlotIndex(spec){
 if(!spec||spec.kind!=='slots'||!['fraction','inline','algebra-template'].includes(spec.layout)) return -1;
 if(!interactiveTouched.some(Boolean)) return -1;
 const count=(spec.slots||[]).length;
 for(let index=0;index<count;index++) if(!String(interactiveValues[index]??'').trim()) return index;
 return -1;
}
function readingDelayLeft(){
 return interactiveLocked?Math.max(0,LECTURE_MIN_MS-(performance.now()-lockedAt)):0;
}
function updateInteractiveControls(){
 const dock=document.getElementById('answerDock'),action=document.getElementById('interactiveAction'),skip=document.getElementById('skipAction');
 const hasAnswer=hasInteractiveAnswer();
 const spec=slides[idx]&&slides[idx].interactiveSpec;
 if(action){
   action.textContent=interactiveLocked?'Suivant':(spec?.kind==='angle-sum-tactile'?(angleSumPlacementValidated?'Valider 𝑥':'Valider le placement'):'Valider');
   const waiting=readingDelayLeft()>0;
   action.classList.toggle('attente',waiting);
   action.setAttribute('aria-disabled',String(waiting));
   action.disabled=false;
 }
 if(skip){skip.disabled=interactiveLocked;skip.setAttribute('aria-disabled',String(interactiveLocked));}
 if(dock) dock.classList.toggle('answer-ready',!interactiveLocked&&hasAnswer);
 // La phrase « Écris ta réponse… » s'efface dès que la réponse est complète.
 const feedback=document.getElementById('answerFeedback');
 if(!interactiveLocked&&hasAnswer&&feedback&&feedback.classList.contains('info')) setInteractiveFeedback('','');
}
function toggleInteractiveOption(index){
 if(interactiveLocked) return;
 const spec=slides[idx].interactiveSpec;
 const singleAnswer=!spec.multiple;
 if(singleAnswer){
   if(selectedOptions.has(index)) selectedOptions.clear();
   else{selectedOptions.clear();selectedOptions.add(index);}
 }else if(selectedOptions.has(index)) selectedOptions.delete(index);
 else{
   const exclusive=new Set(spec.exclusiveIndices||[]);
   if(exclusive.has(index)) selectedOptions.clear();
   else exclusive.forEach(optionIndex=>selectedOptions.delete(optionIndex));
   selectedOptions.add(index);
 }
 setupInteractiveSlide(slides[idx]);
}
function clearInteractiveAnswer(){
 if(interactiveLocked) return;
 resetInteractiveEntryState(slides[idx].interactiveSpec);selectedOptions.clear();
 setInteractiveFeedback('','');
 setupInteractiveSlide(slides[idx]);
}
function appendInteractiveValue(value){
 if(interactiveLocked||slides[idx].interactiveSpec.kind==='qcm'||(slides[idx].interactiveSpec.kind==='angle-sum-tactile'&&!angleSumPlacementValidated)) return;
 if(!interactiveValues.length) return;
 let current=interactiveValues[activeSlotIndex]||'';
 if(current.length>=24) return;
 if(value===','&&/[,.]/.test(current)) return;
 if(value==='−'){
   if(current.startsWith('−')||current.startsWith('-')) return;
   if(!interactiveTouched[activeSlotIndex]&&current==='0') current='';
   if(current) return;
 }else if(!interactiveTouched[activeSlotIndex]&&current==='0') current='';
 interactiveValues[activeSlotIndex]=current+value;
 interactiveTouched[activeSlotIndex]=true;
 updateInteractiveSlots();updateInteractiveControls();
}
function backspaceInteractive(){
 if(interactiveLocked||slides[idx].interactiveSpec.kind==='qcm'||(slides[idx].interactiveSpec.kind==='angle-sum-tactile'&&!angleSumPlacementValidated)) return;
 if(!interactiveValues.length) return;
 const slot=slides[idx].interactiveSpec.slots[activeSlotIndex]||{};
 const current=interactiveValues[activeSlotIndex]||'';
 if(current.length>1){interactiveValues[activeSlotIndex]=current.slice(0,-1);interactiveTouched[activeSlotIndex]=true;}
 else{interactiveValues[activeSlotIndex]=String(slot.initialValue===undefined?'':slot.initialValue);interactiveTouched[activeSlotIndex]=false;}
 updateInteractiveSlots();updateInteractiveControls();
}
function normalizeInteractiveAnswer(value){
 return String(value||'').trim().toLowerCase().replace(/𝑥/g,'x').replace(/\\^2/g,'²').replace(/\\s+/g,'').replace(/[−–—]/g,'-').replace(/,/g,'.').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/^x=/,'');
}
function safeInteractiveNumber(value){
 const normalized=normalizeInteractiveAnswer(value).replace(/([0-9]+(?:\\.[0-9]+)?)²/g,'($1*$1)');
 if(!normalized||!/^[0-9+\\-*/().]+$/.test(normalized)) return null;
 try{const result=Function('"use strict";return ('+normalized+')')();return Number.isFinite(result)?result:null;}catch(error){return null;}
}
function equivalentInteractiveFraction(values,combinations){
 if(values.length!==2) return false;
 const numerator=safeInteractiveNumber(values[0]),denominator=safeInteractiveNumber(values[1]);
 if(numerator===null||denominator===null||Math.abs(denominator)<1e-12) return false;
 return (combinations||[]).some(combination=>{
   if(combination.length!==2) return false;
   const expectedNumerator=safeInteractiveNumber(combination[0]);
   const expectedDenominator=safeInteractiveNumber(combination[1]);
   if(expectedNumerator===null||expectedDenominator===null||Math.abs(expectedDenominator)<1e-12) return false;
   return Math.abs(numerator*expectedDenominator-expectedNumerator*denominator)<1e-9;
 });
}
function interactiveAnswerIsCorrect(spec){
 if(spec.kind==='qcm'){
   const selected=[...selectedOptions].sort((a,b)=>a-b);
   const expected=[...spec.correctIndices].sort((a,b)=>a-b);
   return selected.length===expected.length&&selected.every((value,index)=>value===expected[index]);
 }
 if(spec.kind==='relative-tokens'){
   const state=relativeBoardState;
   return !!state&&state.tokens.every(token=>token.zone==='result')&&state.tokens.reduce((sum,token)=>sum+token.sign,0)===spec.relative.result;
 }
 if(spec.layout==='fraction'&&spec.fractionPolicy==='equivalent'){
   return equivalentInteractiveFraction(interactiveValues,spec.acceptedCombinations);
 }
 return (spec.acceptedCombinations||[]).some(combination=>combination.length===interactiveValues.length&&combination.every((expected,index)=>{
   const answer=normalizeInteractiveAnswer(interactiveValues[index]);
   if(normalizeInteractiveAnswer(expected)===answer) return true;
   const numericAnswer=safeInteractiveNumber(interactiveValues[index]);
   const numericExpected=safeInteractiveNumber(expected);
   return numericAnswer!==null&&numericExpected!==null&&Math.abs(numericAnswer-numericExpected)<1e-9;
 }));
}
function rawInteractiveResponse(spec){
 if(spec.kind==='qcm'){
   const options=slides[idx].questionInstance&&slides[idx].questionInstance.response.options;
   return [...selectedOptions].sort((a,b)=>a-b).map(index=>options&&options[index]?options[index].optionId:index);
 }
 if(spec.kind==='relative-tokens') return [{...relativeBoardState,tokens:relativeBoardState.tokens.map(token=>({...token}))}];
 return interactiveValues.slice();
}
function evaluateInteractiveAnswer(spec){
 const skipped=!hasInteractiveAnswer();
 const correct=!skipped&&interactiveAnswerIsCorrect(spec);
 const raw=rawInteractiveResponse(spec);
 const normalized=spec.kind==='qcm'?raw:(spec.kind==='relative-tokens'?[relativeClientStateKey(relativeBoardState)]:raw.map(normalizeInteractiveAnswer));
 return Object.freeze({
   isCorrect:correct,
   outcome:skipped?'skipped':(correct?'correct':'incorrect'),
   reasonCode:skipped?'EMPTY_RESPONSE':(correct?'CORRECT':'WRONG_ANSWER'),
   rawResponse:raw,
   normalizedResponse:normalized,
   errorCode:spec.kind==='qcm'&&!correct&&selectedOptions.size===1?(spec.options?.[[...selectedOptions][0]]?.errorCode||null):null
 });
}
function recordInteractiveAttempt(result){
 const current=slides[idx],contract=current.questionInstance;
 if(!contract) return;
 const session=ensureQuestionSession();pauseQuestionTimer();session.validations++;
 attemptRecorder.record({
   schemaVersion:contract.schemaVersion||1,
   generatorVersion:contract.generatorVersion||'1.17.0',
   questionInstanceId:contract.questionInstanceId,
   seriesId:contract.seriesId,
   generatedSeriesId:contract.generatedSeriesId,
   position:contract.position,
   moduleId:contract.moduleId,
   skillIds:contract.skillIds,
   templateId:contract.templateId,
   templateVersion:contract.templateVersion,
   responseType:contract.response.type,
   responseGiven:result.rawResponse,
   normalizedResponse:result.normalizedResponse,
   outcome:result.outcome,
   isCorrect:result.isCorrect,
   reasonCode:result.reasonCode,
   errorCode:result.errorCode,
   attemptNumber:session.validations,
   activeResponseTimeMs:Math.min(1800000,Math.round(session.activeMs)),
   assistanceMode:current.assistanceMode,
   helpOpened:session.helpKinds.size>0,
   helpKinds:[...session.helpKinds].sort(),
   correctionDisplayed:true,
   experienceMode
 });
}
function incorrectInteractiveFeedbackDetail(validation,spec){
 const expected=String(spec.expectedDisplay||'').replace(/^(?:\\s*(?:réponse attendue|réponses?)\\s*:?\\s*)+/i,'');
 const qcmDiagnostics={
   'outer-operation-confusion':'Regarde l’opération effectuée en dernier : les parenthèses forment ici un seul produit.',
   'operation-by-visible-sign':'Ne te fie pas seulement au signe visible : cherche l’opération qui organise toute l’expression.',
   'forget-second-product':'Le facteur extérieur doit multiplier les deux termes de la parenthèse.',
   'use-first-coefficient':'Le premier coefficient n’est pas forcément commun au second terme. Cherche leur plus grand diviseur commun.',
   'use-first-quotient':'Tu as choisi un quotient, pas le facteur commun. Vérifie qu’il divise les deux coefficients.',
   'trivial-factor':'1 est commun, mais la consigne demande le plus grand facteur commun.',
   'non-common-divisor':'Ce nombre ne divise pas les deux coefficients.',
   'wrong-middle-sign':'Dans un carré, le signe du terme du milieu suit celui de la parenthèse.',
   'square-constant-in-parenthesis':'Dans la parenthèse, on écrit le nombre dont le carré donne la constante, pas la constante elle-même.',
   'confuse-square-and-conjugates':'Un carré produit un terme du milieu ; deux facteurs conjugués font disparaître les termes en x.'
 };
 if(spec.kind==='qcm') return qcmDiagnostics[validation.errorCode]||(expected?'Réponse attendue : '+expected:'');
 if(spec.kind==='relative-tokens') return expected?'Réponse attendue : '+expected:'';
 const raw=Array.isArray(validation.rawResponse)?validation.rawResponse:[];
 if(spec.diagnosticKind==='expand-factor'){
   const expectedCombination=(spec.acceptedCombinations||[])[0]||[];
   const wrongIndex=expectedCombination.findIndex((value,index)=>normalizeInteractiveAnswer(value)!==normalizeInteractiveAnswer(raw[index]));
   const diagnostic=wrongIndex>=0&&spec.slots[wrongIndex]?spec.slots[wrongIndex].diagnostic:'';
   if(diagnostic)return diagnostic;
 }
 const response=raw.every(value=>typeof value!=='object')?raw.map(value=>String(value)).filter(Boolean).join(' ; '):'';
 const given='Ta réponse : '+(response||'aucune');
 return expected?given+' · Réponse attendue : '+expected:given;
}
// Lot T : la phrase de diagnostic seule (sans « Ta réponse »), pour la carte
// « Comment on trouve ».
function diagnosticForValidation(validation,spec){
 if(!validation||validation.isCorrect||validation.outcome==='skipped') return '';
 if(spec.kind==='qcm'){
   const detail=incorrectInteractiveFeedbackDetail(validation,spec);
   return /^Réponse attendue/.test(detail)?'':detail;
 }
 if(spec.diagnosticKind==='expand-factor'){
   const detail=incorrectInteractiveFeedbackDetail(validation,spec);
   return /^Ta réponse/.test(detail)?'':detail;
 }
 return '';
}
/* Lot T — la ligne de verdict : hauteur réservée, une seule ligne, ton
   neutre (pas de « Mauvaise réponse » en rouge). */
function setInteractiveFeedback(html,kind){
 const feedback=document.getElementById('answerFeedback');
 if(!feedback) return;
 feedback.innerHTML=html?'<span class="verdict-texte">'+html+'</span>':'';
 feedback.className='verdict'+(kind?' '+kind:'');
 fitVerdictLine();
}
function fitVerdictLine(){
 const feedback=document.getElementById('answerFeedback');
 const line=feedback&&feedback.querySelector('.verdict-texte');
 if(!line) return;
 line.style.fontSize='';
 feedback.classList.remove('verdict-court');
 const base=parseFloat(getComputedStyle(line).fontSize)||18;
 const shrink=minimum=>{let size=base;line.style.fontSize='';while(line.scrollWidth>feedback.clientWidth+1&&size>base*minimum){size-=.5;line.style.fontSize=size+'px';}};
 shrink(.82);
 // Trop long même un peu réduit : la bonne réponse reste dans la carte
 // « Comment on trouve », juste en dessous ; la ligne garde « Ta réponse ».
 if(line.scrollWidth>feedback.clientWidth+1&&line.querySelector('.verdict-bonne')&&(line.querySelector('.verdict-eleve')||line.querySelector('.verdict-passe'))){
   feedback.classList.add('verdict-court');
   shrink(.7);
 }else if(line.scrollWidth>feedback.clientWidth+1) shrink(.7);
 // Lot T2 : une bonne réponse trop longue pour la ligne garde « ✓ Bonne réponse ».
 if(line.scrollWidth>feedback.clientWidth+1&&line.querySelector('.verdict-ok-reponse')){
   feedback.classList.add('verdict-court');
   shrink(.82);
 }
}
function verdictHtml(result){
 if(!result) return '';
 // Lot T2 : une bonne réponse tapée s'affiche telle que l'élève l'a écrite
 // (75/100 reste 75/100) ; la carte donne ensuite la démarche.
 if(result.status==='correct') return '<span class="verdict-ok">✓ Bonne réponse'+(result.typed&&result.givenHtml?'<span class="verdict-ok-reponse"> : <b>'+result.givenHtml+'</b></span>':'')+'</span>';
 const expected=result.expectedHtml?'<span class="verdict-bonne">Bonne réponse : <b>'+result.expectedHtml+'</b></span>':'';
 if(result.status==='skipped') return '<span class="verdict-passe">Question passée</span>'+(expected?'<span class="verdict-sep"> · </span>'+expected:'');
 const given=result.givenHtml?'<span class="verdict-eleve">Ta réponse : '+result.givenHtml+'</span>':'';
 return given&&expected?given+'<span class="verdict-sep"> · </span>'+expected:(expected||given);
}
function emptyAnswerMessage(spec){
 if(spec&&spec.kind==='qcm') return 'Choisis ta réponse, ou touche Passer.';
 if(spec&&!specUsesKeypad(spec)) return 'Termine ta réponse, ou touche Passer.';
 return 'Écris ta réponse, ou touche Passer.';
}
function promptForResults(current){
 return current.shortPrompt||('Question '+(idx+1));
}
function lockQuestion(validation,status){
 const spec=slides[idx].interactiveSpec;
 interactiveLocked=true;corr=true;answeredCount++;
 if(status==='correct') correctCount++;
 lockedAt=performance.now();
 aideOpen=false;
 let givenHtml='';
 try{givenHtml=status==='skipped'?'':studentAnswerHtml(spec);}catch(error){givenHtml='';}
 const current=slides[idx];
 results[idx]={index:idx,status,givenHtml,typed:specUsesKeypad(spec),expectedHtml:current.expectedHtml||'',prompt:promptForResults(current),diagnostic:diagnosticForValidation(validation,spec),chosen:[...selectedOptions]};
 setInteractiveFeedback(verdictHtml(results[idx]),status==='correct'?'good':(status==='skipped'?'skipped':'bad'));
 render();
 recordInteractiveAttempt(validation);
 clearTimeout(unlockTimer);
 unlockTimer=setTimeout(updateInteractiveControls,LECTURE_MIN_MS+20);
}
function submitInteractive(){
 if(!interactiveMode||interactiveFinished) return;
 if(interactiveLocked){
   if(readingDelayLeft()>0) return;
   advanceInteractive();return;
 }
 const spec=slides[idx].interactiveSpec;
 if(spec.kind==='angle-sum-tactile'&&!angleSumPlacementValidated){
   const count=Number(spec.placementCount)||4;
   if(!hasInteractiveAnswer()){setInteractiveFeedback(emptyAnswerMessage(spec),'info');return;}
   const placementCorrect=spec.expectedPlacement.length===count&&spec.expectedPlacement.every((expected,index)=>normalizeInteractiveAnswer(expected)===normalizeInteractiveAnswer(interactiveValues[index]));
   if(!placementCorrect){angleSumBuilderFeedback('Ce placement ne traduit pas encore la somme des trois angles. Essaie à nouveau.','error');return;}
   angleSumPlacementValidated=true;angleSumSelectedToken=null;activeSlotIndex=count;interactiveValues[count]='';interactiveTouched[count]=false;setInteractiveFeedback('','');render();return;
 }
 const missing=incompleteSlotIndex(spec);
 if(missing>=0){activeSlotIndex=missing;updateInteractiveSlots();setInteractiveFeedback('Termine ta réponse, ou touche Passer.','info');return;}
 if(!hasInteractiveAnswer()){setInteractiveFeedback(emptyAnswerMessage(spec),'info');return;}
 const validation=evaluateInteractiveAnswer(spec);
 lockQuestion(validation,validation.isCorrect?'correct':'incorrect');
}
// « Passer » : la question compte comme non réussie et la correction
// s'affiche comme pour une erreur.
function skipInteractive(){
 if(!interactiveMode||interactiveFinished||interactiveLocked) return;
 const spec=slides[idx].interactiveSpec;
 let raw=[];
 try{raw=rawInteractiveResponse(spec);}catch(error){raw=[];}
 const validation=Object.freeze({isCorrect:false,outcome:'skipped',reasonCode:'SKIPPED',rawResponse:raw,normalizedResponse:[],errorCode:null});
 lockQuestion(validation,'skipped');
}
function advanceInteractive(){
 clearTimeout(unlockTimer);
 aideOpen=false;aideStep=0;
 if(idx>=slides.length-1){interactiveFinished=true;setInteractiveFeedback('','');render();return;}
 idx++;corr=false;selectedOptions.clear();interactiveLocked=false;questionSession=null;resetInteractiveEntryState(slides[idx].interactiveSpec);
 setInteractiveFeedback('','');render();
}
function restartInteractive(){
 clearTimeout(advanceTimer);clearTimeout(unlockTimer);idx=0;corr=false;selectedOptions.clear();interactiveLocked=false;correctCount=0;answeredCount=0;interactiveFinished=false;questionSession=null;results=[];aideOpen=false;aideStep=0;fitKey='';resetInteractiveEntryState(slides[0].interactiveSpec);setInteractiveFeedback('','');render();
}
function startNextSeries(){
 if(seriesBank.length<2) return;
 seriesIndex=(seriesIndex+1)%seriesBank.length;
 slides=seriesBank[seriesIndex];
 restartInteractive();
}
function retryMissed(){
 const missed=results.filter(result=>result&&result.status!=='correct').map(result=>slides[result.index]).filter(Boolean);
 if(!missed.length) return;
 slides=missed;
 restartInteractive();
}
function finishScreenHtml(){
 const missed=results.filter(result=>result&&result.status!=='correct');
 const newSeriesButton=seriesBank.length>1?'<button class="btn'+(missed.length?'':' primary')+'" type="button" onclick="startNextSeries()">Nouvelle série</button>':'';
 const retryButton=missed.length?'<button class="btn primary" type="button" onclick="retryMissed()">Refaire les questions ratées</button>':'';
 const list=missed.length?'<section class="finish-misses" aria-labelledby="finishMissesTitle"><h3 id="finishMissesTitle">À revoir</h3><ol class="finish-list">'+missed.map(result=>'<li><span class="finish-num">'+(result.index+1)+'</span><span class="finish-prompt">'+result.prompt+'</span><span class="finish-answers">'+(result.givenHtml?'<s class="finish-given">'+result.givenHtml+'</s>':'<span class="finish-skip">passée</span>')+'<b class="finish-expected">'+(result.expectedHtml||'')+'</b></span></li>').join('')+'</ol></section>':'';
 // Les boutons d'abord, la liste « À revoir » ensuite (comme Défi tables) :
 // sur téléphone, dix lignes ratées ne repoussent pas les boutons hors de l'écran.
 return '<div class="interactive-finish'+(missed.length?' has-misses':'')+'"><div class="interactive-finish-mark">✓</div><h2>Série terminée</h2><div class="interactive-finish-score">'+correctCount+' / '+slides.length+'</div><div class="interactive-finish-actions">'+retryButton+newSeriesButton+'<button class="btn" type="button" onclick="restartInteractive()">Recommencer</button><button class="btn" type="button" onclick="returnToMenu()">Retour au menu</button></div>'+list+'</div>';
}
function openCourse(){const modal=document.getElementById('courseModal'),course=courseForSlide(slides[idx]);if(modal&&course){markQuestionHelp('course');const card=modal.querySelector('.course-card');if(card){card.classList.toggle('thales-course-card',course.layout==='thales');card.classList.toggle('place-value-course-card',course.layout==='place-value');card.classList.toggle('read-data-course-card',slides[idx].courseKind==='read_data');card.classList.toggle('recognize-proportion-course-card',slides[idx].courseKind==='recognize_proportion');card.classList.toggle('angles-course-card',course.layout==='angles');card.classList.toggle('divisibility-course-card',course.layout==='divisibility');card.classList.toggle('expand-factor-course-card',course.layout==='expand-factor');}document.getElementById('courseTitle').textContent=course.title;document.getElementById('courseGrid').innerHTML=typographieHtml(course.rules.map(rule=>'<div class="course-rule'+(rule[2]?' course-rule-wide':'')+'"><strong>'+rule[0]+'</strong>'+rule[1]+'</div>').join(''));modal.hidden=false;setupPlaceValueTools(modal);fitCourseCard(card);const close=modal.querySelector('.course-close');if(close)close.focus();}}
// Lot T2 — diaporama projeté (fenêtre d'au moins 1200 × 700 px) : le cours
// s'agrandit comme la question (jusqu'à × 1,6) tant qu'il tient dans l'écran ;
// un cours trop haut est d'abord élargi (ses règles prennent moins de
// lignes) pour pouvoir grandir. Pas d'agrandissement s'il contient un outil
// à glisser (tableau de numération) : le glissé ne suivrait plus la souris.
// Téléphone et mode interactif : inchangés.
function fitCourseCard(card){
 if(!card) return;
 card.style.zoom='';card.style.maxHeight='';card.style.width='';
 if(interactiveMode||window.innerWidth<1200||window.innerHeight<700||card.querySelector('.place-value-tool')) return;
 const vw=window.innerWidth-48,vh=window.innerHeight-48;
 card.style.maxHeight='none';
 const natural=card.offsetWidth;
 const zoomFor=()=>Math.min(1.6,vw/card.offsetWidth,vh/card.scrollHeight);
 let best={zoom:zoomFor(),width:''};
 [1.25,1.5,1.75,2].forEach(factor=>{
   if(best.zoom>=1.6) return;
   const width=Math.min(vw,Math.round(natural*factor));
   card.style.width=width+'px';
   const zoom=zoomFor();
   if(zoom>best.zoom+.02) best={zoom,width:width+'px'};
 });
 card.style.width=best.width;
 // Trop long même élargi : il garde sa taille et défile, mais sur toute la
 // hauteur de l'écran (au lieu de 720 px).
 if(best.zoom<1.05){if(best.zoom<1)card.style.width='';card.style.maxHeight=(window.innerHeight-36)+'px';return;}
 card.style.zoom=best.zoom.toFixed(3);
 card.style.maxHeight=Math.floor((window.innerHeight-36)/best.zoom)+'px';
}

function closeCourse(){const modal=document.getElementById('courseModal');if(modal)modal.hidden=true;}
function openEquationDetail(){const modal=document.getElementById('equationDetailModal'),body=document.getElementById('equationDetailBody'),detail=slides[idx].equationDetailHtml;if(modal&&body&&detail){markQuestionHelp('equation-detail');body.innerHTML=detail;modal.hidden=false;const close=modal.querySelector('.equation-detail-close');if(close)close.focus();}}
function closeEquationDetail(){const modal=document.getElementById('equationDetailModal');if(modal)modal.hidden=true;}
function openExpandCorrectionDetail(button){
 const template=button&&button.closest('.expand-worked-correction')?.querySelector('.expand-correction-detail-template');
 const modal=document.getElementById('expandCorrectionDetailModal'),body=document.getElementById('expandCorrectionDetailBody');
 if(!template||!modal||!body)return;
 markQuestionHelp('correction-detail');body.innerHTML=template.innerHTML;modal.hidden=false;
 const close=modal.querySelector('.expand-correction-detail-close');if(close)close.focus();
}
function closeExpandCorrectionDetail(){const modal=document.getElementById('expandCorrectionDetailModal');if(modal)modal.hidden=true;}
/* Lot T — options de QCM : une seule police, une seule taille, la lettre
   à gauche suivie d'une espace, le texte centré verticalement ; 2 × 2 si les
   options sont courtes, sinon une colonne. */
function normalizeOptions(root){
 if(!root) return;
 root.querySelectorAll('.opt').forEach(option=>{
   if(option.dataset.lotT==='1') return;
   option.dataset.lotT='1';
   const firstNode=[...option.childNodes].find(node=>!(node.nodeType===3&&!node.textContent.trim()));
   let letter=null;
   if(firstNode&&firstNode.nodeType===1&&/^[A-H][.)]?$/.test(firstNode.textContent.trim())&&!firstNode.querySelector('svg,img')) letter=firstNode;
   else if(firstNode&&firstNode.nodeType===3){
     const match=firstNode.textContent.match(/^[ ]*([A-H])[.)][ ]*/);
     if(match){firstNode.textContent=firstNode.textContent.slice(match[0].length);letter=document.createElement('strong');letter.textContent=match[1]+'.';option.insertBefore(letter,firstNode);}
   }
   if(!letter) return;
   letter.classList.add('opt-letter');
   const body=document.createElement('span');body.className='opt-body';
   while(letter.nextSibling) body.appendChild(letter.nextSibling);
   option.appendChild(body);
   option.classList.add('opt-lettree');
   if(body.querySelector('svg,img,table')) option.classList.add('opt-figure');
 });
 root.querySelectorAll('.options').forEach(group=>{
   const options=[...group.children].filter(child=>child.classList.contains('opt'));
   if(!options.length||options.some(option=>option.classList.contains('opt-figure')||!option.classList.contains('opt-lettree'))) return;
   const lengths=options.map(option=>(option.querySelector('.opt-body')||option).textContent.replace(/[ \\n\\t]+/g,' ').trim().length);
   const longest=Math.max(...lengths);
   group.classList.add('options-lot-t');
   group.classList.toggle('options-courtes',options.length%2===0&&longest<=10);
   group.classList.toggle('options-2col',options.length%2===0&&longest>10&&longest<=24);
   group.classList.toggle('options-moyennes',longest>10&&longest<=48);
 });
}
/* Lot T — après validation : la case garde la réponse de l'élève, barrée,
   et la bonne réponse s'écrit à côté, en vert. */
function decorateCorrectedSlide(current){
 const result=results[idx];
 if(!result||(result.status!=='incorrect'&&result.status!=='correct')) return;
 const spec=current.interactiveSpec;
 if(!spec||spec.kind==='qcm'||!Array.isArray(spec.slots)||!['entry','inline','fraction'].includes(spec.layout)) return;
 const filled=[...document.querySelectorAll('#slide .answer-slot-filled')];
 const values=interactiveValues.slice(0,spec.slots.length);
 if(filled.length!==values.length) return;
 // Lot T2 : bonne réponse écrite autrement (75/100 pour 3/4, 0,50 pour 0,5) :
 // la case garde l'écriture de l'élève, en vert. Seulement quand la case et
 // la saisie sont des nombres (une case « 12 cm » n'est pas réécrite).
 if(result.status==='correct'){
   const numbers=filled.every((slot,index)=>values[index]&&safeInteractiveNumber(values[index])!==null&&safeInteractiveNumber(slot.textContent)!==null);
   if(!numbers) return;
   filled.forEach((slot,index)=>{
     if(normalizeInteractiveAnswer(values[index])===normalizeInteractiveAnswer(slot.textContent)) return;
     slot.innerHTML='<strong>'+lotTValeurHtml(values[index])+'</strong>';slot.classList.add('reponse-eleve-juste');
   });
   return;
 }
 // Une fraction en deux cases : la fraction de l'élève, barrée, devant la bonne.
 const fraction=spec.layout==='fraction'&&filled.length===2&&filled[0].closest('.frac');
 if(fraction&&fraction===filled[1].closest('.frac')){
   if(!values[0]&&!values[1]) return;
   const struck=document.createElement('s');struck.className='reponse-eleve reponse-eleve-frac';
   struck.innerHTML=lotTFracHtml(lotTValeurHtml(values[0]||'?'),lotTValeurHtml(values[1]||'?'));
   fraction.before(struck);fraction.classList.add('frac-corrigee');
   return;
 }
 filled.forEach((slot,index)=>{
   const value=values[index];
   if(!value) return;
   if(normalizeInteractiveAnswer(value)===normalizeInteractiveAnswer(slot.textContent)) return;
   const struck=document.createElement('s');struck.className='reponse-eleve';struck.innerHTML=lotTValeurHtml(value);
   slot.prepend(struck);slot.classList.add('a-reponse-eleve');
 });
}
function studentAnswerHtml(spec){
 const current=slides[idx];
 const values=interactiveValues.slice();
 if(spec.kind==='qcm'&&spec.answerLabels){
   const chosen=[...selectedOptions].sort((a,b)=>a-b).map(index=>((spec.options||[])[index]||{}).displayedValue||'');
   return chosen.length>1?chosen.slice(0,-1).join(', ')+' et '+chosen[chosen.length-1]:chosen.join('');
 }
 if(spec.kind==='qcm') return [...selectedOptions].sort((a,b)=>a-b).map(index=>String.fromCharCode(65+index)).join(', ').replace(/, ([A-Z])$/,' et $1');
 if(spec.kind==='relative-tokens'){
   if(!relativeBoardState||!relativeBoardState.tokens.every(token=>token.zone==='result')) return '';
   return lotTValeurHtml(String(relativeBoardState.tokens.reduce((sum,token)=>sum+token.sign,0)));
 }
 if(spec.kind==='coordinate-points') return spec.coordinate.targets.map((target,index)=>target.label+'('+lotTValeurHtml(values[2*index])+' ; '+lotTValeurHtml(values[2*index+1])+')').join(' et ');
 if(spec.kind==='angle-sum-tactile'){const count=Number(spec.placementCount)||4;return values[count]?'𝑥 = '+lotTValeurHtml(values[count])+'°':'';}
 if(SANS_PAVE_KINDS.includes(spec.kind)) return '';
 const used=values.slice(0,(spec.slots||[]).length);
 if(spec.layout==='fraction') return used[0]||used[1]?lotTFracHtml(lotTValeurHtml(used[0]||'?'),lotTValeurHtml(used[1]||'?')):'';
 if(spec.layout==='polynomial') return lotTPolynomeHtml(used,(spec.slots||[]).map(slot=>slot.term));
 if(spec.layout==='algebra-template') return lotTTemplateHtml(spec.segments||[],used);
 if(current.answerTemplate&&used.some(Boolean)) return typographieTexte(current.answerTemplate.replace(/\\{(\\d+)\\}/g,(match,index)=>lotTValeurHtml(used[Number(index)]||'…')));
 return used.filter(value=>value!=='').map(lotTValeurHtml).join(' ; ');
}
/* Lot T — la carte « Comment on trouve » prend la place du pavé après la
   validation, à la même hauteur : la démarche (1 à 3 lignes), la phrase sur
   l'erreur choisie, la remarque. Sans étape écrite par le module : la bonne
   réponse seule, jamais une carte vide. */
function renderCorrectionCard(current){
 const card=document.getElementById('correctionCard');
 if(!card) return;
 if(!interactiveLocked){card.hidden=true;card.innerHTML='';return;}
 const result=results[idx]||{};
 const steps=Array.isArray(current.correctionSteps)?current.correctionSteps:[];
 let diagnostic='';
 if(result.status==='incorrect'&&Array.isArray(result.chosen)&&result.chosen.length===1&&current.distractorFeedback) diagnostic=current.distractorFeedback[String(result.chosen[0])]||'';
 if(!diagnostic&&result.diagnostic) diagnostic=typographieTexte(String(result.diagnostic).replace(/[&<>]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[character])));
 let html='';
 if(steps.length) html+='<h3 class="carte-titre">Comment on trouve</h3><ol class="carte-etapes">'+steps.map(step=>'<li>'+step+'</li>').join('')+'</ol>';
 else html+='<p class="carte-reponse"><span class="carte-reponse-mot">Bonne réponse</span><b>'+(current.expectedHtml||'')+'</b></p>';
 if(diagnostic) html+='<p class="carte-diagnostic">'+diagnostic+'</p>';
 if(current.correctionNote) html+='<p class="carte-note">'+current.correctionNote+'</p>';
 card.innerHTML=html;
 card.classList.toggle('sans-etapes',!steps.length);
 card.hidden=false;
 card.scrollTop=0;
 fitCorrectionCard();
}
// La carte garde la hauteur du pavé : si la démarche est longue, le texte
// rétrécit un peu (jamais sous 18 px au téléphone, 15 px à l'ordinateur),
// puis la carte défile, avec un fondu en bas qui montre qu'il y a une suite.
// Lot T2 : avant de rétrécir le texte, la carte prend la hauteur de ses
// lignes, dans la place libre sous la question (voir correctionCardMax) ;
// ensuite seulement le texte rétrécit, puis la carte défile.
function fitCorrectionCard(){
 const card=document.getElementById('correctionCard');
 if(!card) return;
 if(card.hidden){card.style.maxHeight='';return;}
 card.style.fontSize='';
 const base=parseFloat(getComputedStyle(card).fontSize)||18;
 const smallest=Math.min(base,coarsePointerMedia.matches?18:15);
 const shrink=()=>{let size=base;card.style.fontSize='';while(card.scrollHeight>card.clientHeight+1&&size>smallest){size-=.5;card.style.fontSize=size+'px';}};
 const zone=document.getElementById('zoneTravail');
 const minimum=interactiveMode&&zone?Math.round(parseFloat(getComputedStyle(zone).minHeight)||0):0;
 if(minimum>0){
   card.style.maxHeight=minimum+'px';
   card.style.maxHeight=correctionCardMax(minimum)+'px';
   shrink();
 }else shrink();
 updateCorrectionCardOverflow();
 updateStageOverflow();
}
/* Lot T2 — hauteur maximale de la carte. Elle part de la place de la zone
   de travail (le pavé ; 3 lignes pour une question sans pavé) et prend :
   - pied sous la question (téléphone, ordinateur) : la place libre sous la
     question. Rien n'est recouvert (ni la réponse de l'élève, ni la figure,
     ni une option) et la zone question ne se met pas à défiler. Jamais
     au-delà de 42 % de l'écran ;
   - pied à côté de la question (téléphone en largeur) : la place libre de
     la colonne.
   Le pied grandit vers le haut : Passer et Valider ne bougent pas. */
function correctionCardMax(minimum){
 const dock=document.getElementById('answerDock'),stage=document.getElementById('stage'),slide=document.getElementById('slide'),feedback=document.getElementById('answerFeedback');
 if(!dock||!stage||!slide||!feedback) return minimum;
 const dockRect=dock.getBoundingClientRect(),stageRect=stage.getBoundingClientRect();
 const free=Math.max(0,Math.floor(feedback.getBoundingClientRect().top-dockRect.top-dock.clientTop-(parseFloat(getComputedStyle(dock).paddingTop)||0)));
 if(dockRect.top<stageRect.bottom-2) return Math.round(minimum+free);
 const margin=(parseFloat(getComputedStyle(stage).paddingBottom)||0)+2;
 const room=Math.max(0,dockRect.top-(slide.getBoundingClientRect().bottom+margin));
 return Math.round(Math.max(minimum,Math.min(minimum+free+room,window.innerHeight*.42)));
}
function updateCorrectionCardOverflow(){
 const card=document.getElementById('correctionCard');
 if(card) card.classList.toggle('deborde',!card.hidden&&card.scrollTop+card.clientHeight<card.scrollHeight-2);
}
/* Lot T — l'aide : un bouton fixe dans l'en-tête, un panneau qui se pose sur
   le pied (téléphone) ou à droite de la question (ordinateur large). */
function aideAvailable(){
 const current=slides[idx];
 return interactiveMode&&!interactiveFinished&&!!current&&current.assistanceMode==='with'&&(((current.aideSteps||[]).length>0)||!!current.aideHtml);
}
function toggleAide(){if(aideOpen)closeAide();else openAide();}
function openAide(){
 if(!aideAvailable()) return;
 aideOpen=true;
 if(aideStep<1) aideStep=1;
 markQuestionHelp('aide');
 renderAide();
 const back=document.querySelector('#aidePanel .aide-back');if(back) back.focus({preventScroll:true});
}
function closeAide(){const panel=document.getElementById('aidePanel');if(panel&&panel.contains(document.activeElement))document.activeElement.blur();aideOpen=false;renderAide();}
function aideNextStep(){
 const steps=slides[idx].aideSteps||[];
 aideStep=Math.min(steps.length,aideStep+1);
 markQuestionHelp('aide-indice-2');
 renderAide();
}
function renderAide(){
 const panel=document.getElementById('aidePanel'),button=document.getElementById('aideBtn');
 const current=slides[idx];
 const inWithMode=interactiveMode&&!interactiveFinished&&!!current&&current.assistanceMode==='with';
 const available=aideAvailable();
 if(!available) aideOpen=false;
 if(button){
   button.hidden=!inWithMode;
   button.classList.toggle('is-unavailable',!available);
   button.disabled=!available;
   button.setAttribute('aria-expanded',String(aideOpen));
   button.classList.toggle('is-open',aideOpen);
 }
 const diapo=document.getElementById('diapo');
 if(diapo) diapo.classList.toggle('aide-ouverte',aideOpen);
 if(!panel) return;
 panel.hidden=!aideOpen;
 if(!aideOpen){fitSlideForAide();return;}
 // Le panneau se pose sur le pied : au moins sa hauteur, pour le couvrir
 // entièrement ; la question reste visible au-dessus. Lot T2 : à
 // l'ordinateur large, il se pose à droite, entre l'en-tête et le pied.
 const dock=document.getElementById('answerDock'),header=diapo&&diapo.querySelector('.top');
 if(diapo&&dock&&!dock.hidden) diapo.style.setProperty('--pied-h',Math.round(dock.getBoundingClientRect().height)+'px');
 if(diapo&&header) diapo.style.setProperty('--entete-h',Math.round(header.getBoundingClientRect().bottom)+'px');
 const steps=current.aideSteps||[];
 const list=document.getElementById('aideSteps'),more=document.getElementById('aideMore'),drawing=document.getElementById('aideDessin');
 if(list){list.innerHTML=steps.slice(0,Math.max(1,aideStep)).map(step=>'<li>'+step+'</li>').join('');list.hidden=!steps.length;}
 if(more) more.hidden=!(aideStep<steps.length);
 // A0 : le dessin n'est réécrit qu'au changement de question, pour qu'un
 // outil à manipuler (tableau de numération, de conversion) garde son état
 // quand on ferme puis rouvre l'aide ; ses gestes sont branchés ici.
 if(drawing&&drawing.__aideDe!==current){
   drawing.innerHTML=current.aideHtml||'';drawing.__aideDe=current;
   // Outil à manipuler dans l'aide (glisse-nombre, tableau de conversion) :
   // à l'ordinateur, l'aide s'ouvre en bas, sur toute la largeur, comme au
   // téléphone, au lieu du panneau étroit de droite où l'outil était coupé.
   if(diapo) diapo.classList.toggle('aide-outil',!!drawing.querySelector(AIDE_OUTILS_EN_BAS));
   if(current.aideHtml){
     if(typeof setupPlaceValueTools==='function') setupPlaceValueTools(drawing);
     if(typeof setupConversionTools==='function') setupConversionTools();
     if(typeof setupFractionProductTools==='function') setupFractionProductTools();
   }
 }
 if(drawing) drawing.hidden=!current.aideHtml;
 // Lot T2 : un dessin d'aide plus large que le panneau (dessin en HTML, à
 // largeur fixe, dans le panneau étroit de l'ordinateur) est réduit pour
 // tenir en entier ; c'est une image, pas un outil à manipuler.
 if(drawing){
   drawing.style.zoom='';
   const sorties=()=>{const box=drawing.getBoundingClientRect();let left=box.left,right=box.right;drawing.querySelectorAll('*').forEach(element=>{const rect=element.getBoundingClientRect();if(rect.width>0){left=Math.min(left,rect.left);right=Math.max(right,rect.right);}});return {box,left,right};};
   for(let essai=0;essai<4&&current.aideHtml&&!drawing.hidden&&!drawing.querySelector(ZOOM_OUTILS_POINTEUR+',.place-value-tool');essai++){
     const {box,left,right}=sorties();
     if(left>=box.left-1&&right<=box.right+1) break;
     const zoom=(parseFloat(drawing.style.zoom)||1)*box.width/(right-left+8);
     if(zoom<.55){drawing.style.zoom='0.550';break;}
     drawing.style.zoom=zoom.toFixed(3);
   }
   // A0 : un dessin qui ferait défiler le panneau (panneau de hauteur fixe à
   // l'ordinateur) est réduit pour tenir, jamais sous 0,6 ; pas les outils
   // à manipuler.
   const defile=panel.querySelector('.aide-scroll');
   for(let essai=0;essai<4&&defile&&current.aideHtml&&!drawing.hidden&&!drawing.querySelector(ZOOM_OUTILS_POINTEUR+',.place-value-tool')&&defile.scrollHeight>defile.clientHeight+1;essai++){
     const zoom=parseFloat(drawing.style.zoom)||1,hauteur=drawing.getBoundingClientRect().height,exces=defile.scrollHeight-defile.clientHeight;
     if(hauteur<=exces) break;
     const suivant=Math.max(.6,zoom*(hauteur-exces)/hauteur);
     if(suivant>=zoom-.005) break;
     drawing.style.zoom=suivant.toFixed(3);
   }
 }
 fitSlideForAide();
}
/* Lot T2 — l'aide ouverte ne cache ni la case réponse ni la figure. À
   l'ordinateur large, la question se range à gauche du panneau ; plus
   étroit (pointeur souris), elle doit tenir au-dessus du panneau posé sur
   le pied. Dans les deux cas, elle est réduite comme dans measureSlideZoom
   (jamais agrandie, jamais sous le minimum, jamais pour les outils qui
   lisent la position du pointeur), puis rendue à son échelle à la fermeture.
   Au téléphone, rien ne change. */
let aideZoomActif=false;
function fitSlideForAide(){
 const slide=document.getElementById('slide'),stage=document.getElementById('stage'),panel=document.getElementById('aidePanel');
 if(!slide||!stage||!interactiveMode||interactiveFinished) return;
 const ouverte=aideOpen&&panel&&!panel.hidden;
 if(!ouverte&&!aideZoomActif) return;
 stage.style.paddingBottom='';
 if(!ouverte){aideZoomActif=false;applySlideZoom(slide,fitZoom);updateStageOverflow();return;}
 const cote=aideACote();
 if(!cote&&coarsePointerMedia.matches){if(aideZoomActif){aideZoomActif=false;applySlideZoom(slide,fitZoom);}return;}
 aideZoomActif=true;
 if(!cote){
   const overlap=Math.round(stage.getBoundingClientRect().bottom-panel.getBoundingClientRect().top);
   if(overlap>0) stage.style.paddingBottom=(overlap+(parseFloat(getComputedStyle(stage).paddingBottom)||0))+'px';
 }
 const bounds=zoomBounds(slides[idx]);
 const fits=value=>{applySlideZoom(slide,value);return slideFits(stage);};
 let zoom=fitZoom;
 if(!fits(zoom)&&bounds.min<zoom&&!slide.querySelector(ZOOM_OUTILS_POINTEUR)){
   if(!fits(bounds.min)) zoom=bounds.min;
   else{let low=bounds.min,high=zoom;while(high-low>.01){const middle=(low+high)/2;if(fits(middle))low=middle;else high=middle;}zoom=Math.floor(low*100)/100;}
 }
 applySlideZoom(slide,zoom);
 updateStageOverflow();
}
/* Lot T — diaporama : la correction se donne étape par étape. Chaque appui
   sur → (ou « Correction → ») montre la ligne suivante de la démarche ; les
   lignes à venir gardent leur place (invisibles) : rien ne saute. */
function presentationSteps(current){return current&&Array.isArray(current.correctionSteps)?current.correctionSteps:[];}
function appendPresentationSteps(slide,current,measure=false){
 if(interactiveMode||!(corr||measure)) return;
 const steps=presentationSteps(current),note=current.correctionNote||'';
 if(!steps.length&&!note) return;
 const box=document.createElement('section');
 box.className='diapo-etapes';
 const noteStep=steps.length?steps.length-1:-1;
 box.innerHTML=(steps.length?'<h3 class="diapo-etapes-titre">Comment on trouve</h3><ol>'+steps.map((step,index)=>'<li class="diapo-etape" data-step="'+index+'">'+step+'</li>').join('')+'</ol>':'')+(note?'<p class="diapo-etape-note" data-step="'+noteStep+'">'+note+'</p>':'');
 slide.append(box);
 if(!measure) updatePresentationSteps();
}
function updatePresentationSteps(){
 document.querySelectorAll('#slide .diapo-etape,#slide .diapo-etape-note').forEach(element=>{element.classList.toggle('is-hidden',Number(element.dataset.step)>=stepReveal);});
}
function updatePresentationButton(){
 const nextBtn=document.getElementById('nextBtn');
 if(!nextBtn) return;
 const steps=presentationSteps(slides[idx]),last=idx===slides.length-1;
 const moreSteps=corr&&stepReveal<steps.length;
 nextBtn.textContent=!corr?'Correction →':(moreSteps?'Étape suivante →':(last?'Fin du questionnaire':'Suivant →'));
 nextBtn.disabled=corr&&!moreSteps&&last;
}
function next(){
 if(interactiveMode) return;
 const steps=presentationSteps(slides[idx]);
 if(!corr){corr=true;stepReveal=steps.length?1:0;render();return;}
 if(stepReveal<steps.length){stepReveal++;updatePresentationSteps();updatePresentationButton();return;}
 if(idx<slides.length-1){idx++;corr=false;stepReveal=0;render();}
}
function prev(){
 if(interactiveMode) return;
 if(corr&&stepReveal>1){stepReveal--;updatePresentationSteps();updatePresentationButton();return;}
 if(corr){corr=false;stepReveal=0;render();return;}
 if(idx>0){idx--;corr=false;stepReveal=0;render();}
}
function toggleFS(){const d=document.getElementById('diapo');if(!document.fullscreenElement)d.requestFullscreen();else document.exitFullscreen();}
document.getElementById('correctionCard').addEventListener('scroll',updateCorrectionCardOverflow,{passive:true});
document.getElementById('stage').addEventListener('scroll',updateStageOverflow,{passive:true});
document.getElementById('keypad').addEventListener('pointerdown',event=>{if(event.target.closest('.key'))event.preventDefault();});
document.getElementById('keypad').addEventListener('click',event=>{const key=event.target.closest('.key');if(!key)return;if(key.dataset.action==='backspace')backspaceInteractive();else appendInteractiveValue(key.dataset.value||'');});
document.addEventListener('keydown',event=>{
 const detail=document.getElementById('equationDetailModal'),course=document.getElementById('courseModal'),expandDetail=document.getElementById('expandCorrectionDetailModal'),quit=document.getElementById('quitModal');
 if(event.key==='Escape'){closeCourse();closeEquationDetail();closeExpandCorrectionDetail();closeQuit();if(aideOpen)closeAide();return;}
 if((detail&&!detail.hidden)||(course&&!course.hidden)||(expandDetail&&!expandDetail.hidden)||(quit&&!quit.hidden))return;
 if(!interactiveMode){
   if(event.key==='f'||event.key==='F'){toggleFS();return;}
   if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();next();}
   if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();prev();}
   return;
 }
 if(interactiveFinished)return;
 if(aideOpen){
   // Entrée sur « Un autre indice » montre l'indice ; ailleurs, elle referme.
   const active=document.activeElement;
   if(event.key==='Enter'&&active&&active.id==='aideMore') return;
   if(event.key==='Enter'){event.preventDefault();closeAide();return;}
   // Lot T2 : à l'ordinateur large, l'aide est à droite de la question et le
   // pied reste visible : l'élève peut taper sa réponse sans la refermer.
   if(!aideACote()||event.key==='ArrowRight'||event.key==='Tab') return;
 }
 const spec=slides[idx].interactiveSpec;
 // Lot T2 — réponse en plusieurs cases (fraction, polynôme, coordonnées) au
 // clavier : Tab, ↓, → et « / » (fraction, quand « / » n'est pas une touche
 // du pavé) passent à la case suivante ; Maj+Tab, ↑ et ← reviennent. Sur la
 // dernière case, → et Entrée valident comme avant, Tab sort des cases.
 const slotCount=!interactiveLocked&&spec&&spec.kind==='slots'&&Array.isArray(spec.slots)?spec.slots.length:0;
 if(slotCount>1&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
   const active=document.activeElement;
   const inSlots=!active||active===document.body||active.matches('.interactive-input-slot,.key,#keyboardToggle');
   let step=0;
   if(event.key==='Tab'){if(inSlots) step=event.shiftKey?-1:1;}
   else if(event.key==='ArrowDown') step=1;
   else if(event.key==='ArrowUp'||event.key==='ArrowLeft') step=-1;
   else if(event.key==='ArrowRight'&&activeSlotIndex<slotCount-1) step=1;
   else if(event.key==='/'&&spec.layout==='fraction'&&!(slides[idx].keypadContext||[]).includes('/')) step=1;
   if(step){
     const target=activeSlotIndex+step;
     if(target>=0&&target<slotCount){
       event.preventDefault();
       setActiveInteractiveSlot(target);
       if(active&&active.matches('.interactive-input-slot')){const button=document.querySelector('#slide .interactive-input-slot[data-slot-index="'+target+'"]');if(button)button.focus({preventScroll:true});}
       return;
     }
     if(event.key==='/'){event.preventDefault();return;}
   }
 }
 if(event.key==='Enter'||event.key==='ArrowRight'){
   const active=document.activeElement;
   // Entrée garde son effet natif sur un bouton que l'élève a choisi au
   // clavier (Passer, Cours, Aide, Menu, une carte à placer…). Mais une case
   // de réponse, le bouton clavier ou un bouton désactivé (Passer après
   // validation) gardent le focus après un clic de souris : là, Entrée valide.
   if(event.key==='Enter'&&active&&active.tagName==='BUTTON'&&!active.disabled&&active.getClientRects().length&&!active.matches('.key,#interactiveAction,.interactive-input-slot,#keyboardToggle')) return;
   event.preventDefault();submitInteractive();return;
 }
 if(interactiveLocked)return;
 if(event.key==='Backspace'){if(spec.kind==='angle-sum-tactile'&&!angleSumPlacementValidated)return;event.preventDefault();backspaceInteractive();return;}
 if(spec.kind==='qcm'&&/^[a-z]$/i.test(event.key)){
   const optionIndex=event.key.toUpperCase().charCodeAt(0)-65;
   if(optionIndex>=0&&optionIndex<document.querySelectorAll('#slide .opt').length)toggleInteractiveOption(optionIndex);
   return;
 }
 if(specUsesKeypad(spec)){
   const allowed=new Set(['0','1','2','3','4','5','6','7','8','9',...(slides[idx].keypadContext||[])]);
   let value=event.key;
   if(value==='.') value=',';
   if(value==='-'||value==='–'||value==='—') value='−';
   if(value==='X') value='x';
   if(value==='*') value='×';
   if(value==='/'&&!allowed.has('/')) value='÷';
   if((value==='p'||value==='P')&&allowed.has('π')) value='π';
   if(allowed.has(value)){event.preventDefault();appendInteractiveValue(value);}
 }
});
// Le retour arrière du navigateur (ou le geste « retour » du téléphone) pose
// la même question que « ← Menu » quand la série est commencée.
window.addEventListener('popstate',()=>{
 if(!retourMenuConfirme&&interactiveMode&&!interactiveFinished&&answeredCount>0){
   try{const url=new URL(location.href);url.hash='questionnaire';history.pushState({mathsgoView:'questionnaire'},'',url.href);}catch(error){location.reload();return;}
   demanderRetourMenu();
   return;
 }
 location.reload();
});
let resizeTimer=null,lastViewport=window.innerWidth+'x'+window.innerHeight;
window.addEventListener('resize',()=>{
 requestAnimationFrame(()=>{fitNavNumbers();fitVerdictLine();fitCorrectionCard();updateStageOverflow();});
 clearTimeout(resizeTimer);
 resizeTimer=setTimeout(()=>{
   const viewport=window.innerWidth+'x'+window.innerHeight;
   if(viewport===lastViewport) return;
   const widthChanged=viewport.split('x')[0]!==lastViewport.split('x')[0];
   lastViewport=viewport;
   // Sur téléphone, la barre d'adresse qui apparaît ne doit pas tout redessiner.
   if(coarsePointerMedia.matches&&!widthChanged) return;
   fitKey='';render();
 },140);
});
if(coarsePointerMedia.addEventListener) coarsePointerMedia.addEventListener('change',()=>{keypadVisible=coarsePointerMedia.matches||tniMedia.matches;fitKey='';render();});
render();
</`+`script>
</body>
</html>`;
}

function interactiveAnswerCombinations(inst,rawAnswers){
  if(!Array.isArray(inst.answerChoices)||!inst.answerChoices.length) return [rawAnswers];
  let combinations=[[]];
  inst.answerChoices.forEach(group=>{
    const choices=(Array.isArray(group)?group:[group]).map(value=>String(value));
    combinations=combinations.flatMap(prefix=>choices.map(choice=>prefix.concat(choice)));
  });
  return combinations;
}
function parseInteractivePolynomial(value){
  const normalized=String(value||'').replace(/𝑥/g,'x').replace(/\^2/g,'²').replace(/[−–—]/g,'-').replace(/\s+/g,'');
  if(!normalized||!/^[0-9x²+.,-]+$/.test(normalized)) return null;
  const coefficients={x2:0,x:0,u:0};
  const terms=normalized.replace(/-/g,'+-').split('+').filter(Boolean);
  for(const term of terms){
    let match=term.match(/^(-?)(\d*)x²$/);
    if(match){coefficients.x2+=(match[1]==='-'?-1:1)*Number(match[2]||1);continue;}
    match=term.match(/^(-?)(\d*)x$/);
    if(match){coefficients.x+=(match[1]==='-'?-1:1)*Number(match[2]||1);continue;}
    if(/^-?\d+(?:[.,]\d+)?$/.test(term)){coefficients.u+=Number(term.replace(',','.'));continue;}
    return null;
  }
  return [coefficients.x2,coefficients.x,coefficients.u].map(value=>String(value).replace('.',','));
}
function reductionResponseTermIndices(inst,polynomialCombinations){
  const reduction=inst&&inst.reduction||{};
  const order=['x2','x','u'];
  // Une case par famille présente dans l’énoncé (x², x, nombres), jamais
  // selon le résultat : une annulation ne doit pas être révélée par la
  // disparition de sa case.
  if(Array.isArray(reduction.slotTypes)&&reduction.slotTypes.length){
    return order.map((type,index)=>reduction.slotTypes.includes(type)?index:null).filter(index=>index!==null);
  }
  const sourceTypes=new Set();
  (Array.isArray(reduction.groups)?reduction.groups:[]).forEach(group=>{
    if(group&&order.includes(group.type)&&Number(group.coeff)!==0) sourceTypes.add(group.type);
  });
  const fromGroups=order.map((type,index)=>sourceTypes.has(type)?index:null).filter(index=>index!==null);
  if(fromGroups.length) return fromGroups;
  const resultIndices=[0,1,2].filter(index=>polynomialCombinations.some(combination=>Math.abs(Number(combination[index]))>1e-12));
  return resultIndices.length?resultIndices:[2];
}
/* Lot T — rangée « contexte » du pavé : constante pour tout un automatisme,
   jamais choisie d'après la réponse attendue (avant le lot T, l'ancienne
   fonction des touches n'ajoutait « , » que si la réponse était décimale et
   « − » que si elle était négative : le pavé donnait un indice).
   Ordre de priorité : module.keypad.context (déclaré par l'agent du module),
   puis cette table (relevée sur l'usage d'avant le lot T : seul π s'ajoutait
   à la virgule et au moins, dans les périmètres et les aires), puis [',', '−']. */
const KEYPAD_CONTEXT_DEFAUT=Object.freeze([',','−']);
const KEYPAD_CONTEXT_PAR_MODULE=Object.freeze({
  dnb_21:Object.freeze([',','−','π']),
  dnb_22:Object.freeze([',','−','π'])
});
function keypadContextFor(inst){
  const module=inst&&inst.module;
  const declared=module&&module.keypad&&module.keypad.context;
  const source=Array.isArray(declared)?declared:(KEYPAD_CONTEXT_PAR_MODULE[module&&module.id]||KEYPAD_CONTEXT_DEFAUT);
  const keys=[];
  source.forEach(key=>{
    let value=String(key??'').trim();
    if(value==='-'||value==='–') value='−';
    if(value==='.') value=',';
    if(value&&!/^\d$/.test(value)&&!keys.includes(value)) keys.push(value);
  });
  return keys.slice(0,9);
}
function keypadKeysFor(inst){
  return ['1','2','3','4','5','6','7','8','9','0',...keypadContextFor(inst)].map(value=>({value,label:value}));
}
function legacyExpandFactorResponse(inst){
  if(inst.module.id!=='dnb_12'||inst.expandFactor) return null;
  const n=Number(inst.q&&inst.q.n),s=inst.scope||{};
  const polynomial=(values,terms,diagnostics)=>({
    layout:'polynomial',
    slots:terms.map((term,index)=>({term,label:term==='x2'?'Coefficient de x carré':(term==='x'?'Coefficient de x':'Constante'),diagnostic:diagnostics[index]})),
    acceptedCombinations:[values.map(String)]
  });
  const template=(labels,segments,values,diagnostics)=>({layout:'algebra-template',segments,slots:labels.map((label,index)=>({label,diagnostic:diagnostics[index]})),acceptedCombinations:[values.map(String)]});
  if(n===1||n===3||n===10) return polynomial([s.k,s.p],['x','u'],[`Le coefficient de x vient de ${s.k} × 1.`,`La constante vient de ${s.k} × ${s.a}.`]);
  if(n===2) return polynomial([s.k,-s.p],['x','u'],[`Le coefficient de x vient de ${s.k} × 1.`,`Le signe moins reste attaché à ${s.a} : ${s.k} × (−${s.a}) = −${s.p}.`]);
  if(n===4) return polynomial([s.kb,s.ka],['x','u'],[`Multiplie les coefficients : ${s.k} × ${s.b}.`,`N’oublie pas le second terme : ${s.k} × ${s.a}.`]);
  if(n===6) return template(
    ['Facteur commun','Coefficient de x dans la parenthèse','Constante dans la parenthèse'],
    [{slot:0},{text:'('},{slot:1},{text:'x + '},{slot:2},{text:')'}],[s.k,s.b,s.c],
    [`Cherche le plus grand nombre qui divise ${s.kb} et ${s.kc}.`,`Calcule ${s.kb} ÷ le facteur commun.`,`Calcule ${s.kc} ÷ le facteur commun.`]
  );
  if(n===7) return template(
    ['Facteur commun','Coefficient de x dans la parenthèse'],
    [{slot:0},{text:'('},{slot:1},{text:'x + 1)'}],[s.k,s.b],
    [`Cherche le facteur présent dans les deux termes.`,`Calcule ${s.kb} ÷ ${s.k}. Le dernier quotient ${s.k} ÷ ${s.k} = 1 est déjà écrit.`]
  );
  if(n===8) return template(
    ['Constante dans la parenthèse'],[{text:'x(x + '},{slot:0},{text:')'}],[s.a],
    [`Après avoir sorti x, ${s.a}x ÷ x = ${s.a}.`]
  );
  return null;
}
function legacyExpandFactorSource(inst){
  const n=Number(inst.q&&inst.q.n),s=inst.scope||{};
  if(n===1)return `${s.k}(x + ${s.a})`;
  if(n===2)return `${s.k}(x − ${s.a})`;
  if(n===3)return `${s.k}(${s.a} + x)`;
  if(n===4)return `${s.k}(${s.b}x + ${s.a})`;
  if(n===6)return `${s.kb}x + ${s.kc}`;
  if(n===7)return `${s.kb}x + ${s.k}`;
  if(n===8)return `x² + ${s.a}x`;
  if(n===10)return `${s.k}(x + ${s.a})`;
  return '';
}
function expandFactorSourceText(inst){
  const source=inst.expandFactor?.expression||legacyExpandFactorSource(inst);
  return String(source||'').replace(/<sup>2<\/sup>/g,'²').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}
function expandFactorResponseSpec(inst){
  const response=inst.expandFactor&&inst.expandFactor.response?inst.expandFactor.response:legacyExpandFactorResponse(inst);
  if(!response) return null;
  const combinations=response.acceptedCombinations.map(combination=>combination.map(String));
  return {
    kind:'slots',layout:response.layout,segments:response.segments||[],slots:response.slots.map(slot=>({...slot})),
    acceptedCombinations:combinations,expectedDisplay:'réponse : '+String(inst.expandFactor?.answerDisplay||inst.answers?.[0]||''),
    keys:keypadKeysFor(inst),
    diagnosticKind:'expand-factor',sourceDisplay:expandFactorSourceText(inst)
  };
}
function expectedDisplayFromFooter(inst,rawAnswers){
 const footer=String(inst.rawFooter||'');
 if(!footer||!footer.includes('[[formula')) return '';
 let index=0;
 return footer
   .replace(/\[\[[^\]]+\]\]/g,()=>rawAnswers[index++]??rawAnswers[0]??'')
   .replace(/\$\$/g,'')
   .replace(/\\qquad/g,' et ')
   .replace(/\\,/g,'')
   .replace(/\\;/g,';')
   .replace(/\\text\{([^{}]*)\}/g,' $1')
   .replace(/_\{([^{}]*)\}/g,'$1')
   .replace(/_([A-Za-z0-9])/g,'$1')
   .replace(/\s*;\s*/g,' ; ')
   .replace(/\(\s+/g,'(')
   .replace(/\s+\)/g,')')
   .replace(/\s*=\s*/g,' = ')
   .replace(/\s+/g,' ')
   .trim();
}
function interactiveSpecForInstance(inst,correctionHtml){
 if(inst.coordinateData&&['place-one','place-two'].includes(inst.coordinateData.kind)){
   const targets=inst.coordinateData.targets;
   return {
     kind:'coordinate-points',layout:'tap',
     slots:targets.flatMap(target=>[{label:'Abscisse de '+target.label},{label:'Ordonnée de '+target.label}]),
     acceptedCombinations:[(inst.answers||[]).map(String)],
     expectedDisplay:targets.map(target=>target.label+'('+String(target.x).replace('-', '−')+' ; '+String(target.y).replace('-', '−')+')').join(' et '),
     keys:[],coordinate:{targets}
   };
 }
 if(inst.numberLineData&&inst.numberLineData.kind==='place-point'){
   const data=inst.numberLineData,display=String(data.targetValue).replace('-', '−').replace('.',',');
   return {
     kind:'numberline-point',layout:'drag',
     slots:[{label:'Position du point '+data.letter,initialValue:String(data.startIndex)}],
     acceptedCombinations:[[String(data.targetIndex)]],
     expectedDisplay:data.letter+' = '+display,
     keys:[],
     numberLine:{letter:data.letter,step:data.step,zeroIndex:data.zeroIndex,startIndex:data.startIndex,targetIndex:data.targetIndex,instanceKey:data.instanceKey}
   };
 }
 if(inst.angleSumTactile){
   const data=inst.angleSumTactile,placement=data.expected.map(String),answer=String(data.missing);
   return {
     kind:'angle-sum-tactile',layout:'two-stage',placementCount:placement.length,
     slots:[...placement.map((value,index)=>({label:'Position '+(index+1)})),{label:'Valeur de 𝑥'}],
     expectedPlacement:placement,acceptedCombinations:[[...placement,answer]],
     expectedDisplay:'𝑥 = '+answer+'°',keys:keypadKeysFor(inst)
   };
 }
 if(inst.pythagorasTactile){
   const task=inst.pythagorasTactile.task;
   const groups=task==='relation'?['label','label','label']:task==='areas'?['value','value','value']:['label','label','label','value','value','value'];
   return {kind:'pythagoras-tactile',layout:'drag',slots:groups.map((group,index)=>({group,label:(group==='label'?'Côté au carré ':'Aire ')+(index%3+1)})),acceptedCombinations:[inst.pythagorasTactile.expected.map(String)],expectedDisplay:inst.pythagorasTactile.relation.join(' = ').replace(' = ',' = ').replace(/ = ([^=]+) = /,' = $1 + ')+' ; '+inst.pythagorasTactile.areas.join(' ; '),keys:[]};
 }
 if(inst.relativeTokens&&inst.relativeTokens.interactive){
   const result=String(inst.relativeTokens.result);
   return {kind:'relative-tokens',relative:inst.relativeTokens,expectedDisplay:'réponse : '+(result.startsWith('-')?'−'+result.slice(1):result)};
 }
 if(inst.expandFactor&&inst.expandFactor.manipulation){
   const manipulation=inst.expandFactor.manipulation,expected=manipulation.expected.map(String);
   return {
     kind:'decimal-distributivity',layout:'cards',cards:manipulation.cards.map(String),
     slots:manipulation.slotLabels.map(label=>({label})),acceptedCombinations:[expected],
     expectedDisplay:inst.expandFactor.answerDisplay||expected.join(' ; '),instruction:'Place les cartes',keys:[]
   };
 }
 const expandFactorResponse=expandFactorResponseSpec(inst);
 if(expandFactorResponse) return expandFactorResponse;
 const decimalKind=String(inst.q&&inst.q.options&&inst.q.options.decimal_kind||'');
 const decimalDisplay=value=>String(value??'').replace('.',',').replace('-', '−');
 if(decimalKind==='order-cards'){
   const scope=inst.scope||{},cards=[scope.a,scope.b,scope.c].map(String),expected=[scope.mn,scope.md,scope.mx].map(String);
   return {kind:'decimal-order',layout:'cards',cards,slots:[{label:'Nombre le plus petit'},{label:'Nombre du milieu'},{label:'Nombre le plus grand'}],acceptedCombinations:[expected],expectedDisplay:'ordre : '+expected.map(decimalDisplay).join(' < '),keys:[]};
 }
 if(decimalKind==='frame-positive'||decimalKind==='frame-negative'){
   const scope=inst.scope||{},cards=(Array.isArray(scope.frameCards)?scope.frameCards:[scope.low,scope.high]).map(String),expected=[scope.low,scope.high].map(String);
   return {kind:'decimal-frame',layout:'cards',cards,slots:[{label:'Entier immédiatement inférieur'},{label:'Entier immédiatement supérieur'}],acceptedCombinations:[expected],expectedDisplay:decimalDisplay(scope.low)+' < '+decimalDisplay(scope.value)+' < '+decimalDisplay(scope.high),keys:[]};
 }
 if(decimalKind==='distributivity-reasoning'){
   const scope=inst.scope||{},cards=(Array.isArray(scope.reasoningCards)?scope.reasoningCards:[scope.firstProduct,scope.secondProduct]).map(String),expected=[scope.firstProduct,scope.secondProduct].map(String);
   return {kind:'decimal-distributivity',layout:'cards',cards,slots:[{label:'Produit des unités'},{label:'Produit des dixièmes'}],acceptedCombinations:[expected],expectedDisplay:'décomposition : '+expected.map(decimalDisplay).join(' + '),keys:[]};
 }
 if(inst.q&&inst.q.options&&inst.q.options.transformation_place_kind){
    const combinations=interactiveAnswerCombinations(inst,(inst.answers||[]).map(value=>String(value)));
    return {kind:'grid-point',slots:[{label:'Abscisse'},{label:'Ordonnée'}],acceptedCombinations:combinations,expectedDisplay:'réponse : '+(inst.answers||[]).join(' ; '),keys:[]};
  }
  const probe=document.createElement('div');
  probe.innerHTML=correctionHtml;
  const options=[...probe.querySelectorAll('.opt')];
  if(options.length){
    const correctIndices=options.map((option,index)=>option.classList.contains('correct')?index:null).filter(index=>index!==null);
    const exclusiveIndices=options.map((option,index)=>option.dataset.exclusive==='true'?index:null).filter(index=>index!==null);
    const letters=correctIndices.map(index=>String.fromCharCode(65+index));
    // dnb_08 : des choix marqués data-select-all se cochent toujours à
    // plusieurs (la consigne ne trahit pas le nombre de bonnes réponses) ;
    // data-answer-labels : la réponse se dit avec les choix (2, 3 et 9), pas en lettres.
    const container=probe.querySelector('.options');
    const selectAll=!!container&&container.getAttribute('data-select-all')==='true';
    const answerLabels=!!container&&container.getAttribute('data-answer-labels')==='true';
    const displayed=options.map(option=>option.textContent.replace(/^\s*[A-Z]\.\s*/,'').replace(/\s+/g,' ').trim());
    const shown=answerLabels?correctIndices.map(index=>displayed[index]):letters;
    return {
      kind:'qcm',
      multiple:selectAll||correctIndices.length>1,
      answerLabels,
      correctIndices,
      exclusiveIndices,
      options:options.map((option,index)=>({index,displayedValue:displayed[index],errorCode:option.dataset.errorCode||null,exclusive:option.dataset.exclusive==='true'})),
      expectedDisplay:(shown.length>1?'réponses ':'réponse ')+shown.join(' et ')
    };
  }

  const rawAnswers=(inst.answers||[]).map(value=>String(value));
  let acceptedCombinations=interactiveAnswerCombinations(inst,rawAnswers);
  const moduleId=inst.module.id;

  if(moduleId==='dnb_22'){
    acceptedCombinations=acceptedCombinations.map(combination=>combination.map(value=>value.replace(/\s*(?:mm|cm|dm|m)²$/i,'').trim()));
  }

  if(moduleId==='dnb_10'){
    const reduction=inst.reduction||{};
    const terms=['x2','x','u'];
    let coefficients=reduction.sums&&reduction.format==='direct'?terms.map(type=>Number(reduction.sums[type])||0):null;
    if(!coefficients){
      const parsed=acceptedCombinations.map(combination=>parseInteractivePolynomial(combination[0])).filter(Boolean)[0];
      coefficients=parsed?parsed.map(value=>Number(String(value).replace(',','.'))):null;
    }
    if(coefficients){
      const responseIndices=reductionResponseTermIndices(inst,[coefficients.map(String)]);
      // Une case laissée vide vaut 0 : chaque famille nulle accepte « » ou « 0 ».
      let combinations=[[]];
      responseIndices.forEach(index=>{
        const value=coefficients[index];
        const choices=value===0?['','0']:[String(value)];
        combinations=combinations.flatMap(prefix=>choices.map(choice=>prefix.concat(choice)));
      });
      return {
        kind:'slots',layout:'polynomial',
        slots:responseIndices.map(index=>({
          term:terms[index],
          label:index===0?'Coefficient de x carré':(index===1?'Coefficient de x':'Nombre')
        })),
        acceptedCombinations:combinations,
        expectedDisplay:'réponse : '+(reduction.answer||rawAnswers[0]),
        keys:keypadKeysFor(inst)
      };
    }
  }

  // dnb_06 : cases nommées (nombre devant × 10, exposant) et bonne réponse
  // écrite comme en maths (4,52 × 10⁻³, pas « 4,52 ; -3 »).
  if(moduleId==='dnb_06'&&inst.scientific&&Array.isArray(inst.scientific.slotLabels)){
    return {
      kind:'slots',layout:inst.scientific.slotLabels.length>1?'inline':'entry',
      slots:inst.scientific.slotLabels.map(label=>({label})),
      acceptedCombinations,
      expectedDisplay:'réponse : '+(inst.scientific.expectedDisplay||rawAnswers.join(' ; ')),
      keys:keypadKeysFor(inst)
    };
  }

  const pairedFractionModules=['dnb_01','dnb_03','dnb_03b','dnb_05','dnb_28','dnb_29'];
  const isPairedFraction=rawAnswers.length===2&&pairedFractionModules.includes(moduleId);
  const splitFractionCombinations=acceptedCombinations.map(combination=>{
    if(combination.length!==1) return null;
    const match=String(combination[0]).trim().match(/^([−-]?\d+(?:[.,]\d+)?)\s*\/\s*([−-]?\d+(?:[.,]\d+)?)$/);
    return match?[match[1],match[2]]:null;
  });
  const isSingleFraction=splitFractionCombinations.length>0&&splitFractionCombinations.every(Boolean);
  if(isPairedFraction||isSingleFraction){
    const combinations=isPairedFraction?acceptedCombinations:splitFractionCombinations;
    const display=isPairedFraction?rawAnswers.join('/'):(rawAnswers[0]||'');
    const fractionKind=inst.fractionOps&&inst.fractionOps.kind;
    const equivalentFraction=(moduleId==='dnb_03'&&inst.module03&&inst.module03.fractionPolicy==='equivalent')
      ||(moduleId==='dnb_03b'&&fractionKind==='multiply')
      ||moduleId==='dnb_28'||moduleId==='dnb_29'
      ||(moduleId==='dnb_01'&&inst.module01&&inst.module01.fractionPolicy==='equivalent');
    return {
      kind:'slots',layout:'fraction',
      slots:[{label:'Numérateur'},{label:'Dénominateur'}],
      acceptedCombinations:combinations,
      fractionPolicy:equivalentFraction?'equivalent':'exact',
      expectedDisplay:'réponse : '+display,
      keys:keypadKeysFor(inst)
    };
  }

  const slotCount=Math.max(1,acceptedCombinations[0]?.length||rawAnswers.length||1);
  const slots=Array.from({length:slotCount},(_,index)=>({label:slotCount===1?'Réponse':'Réponse '+(index+1)}));
  const formattedFooter=moduleId==='dnb_15'?expectedDisplayFromFooter(inst,rawAnswers):'';
  const expected=formattedFooter||(rawAnswers.length>1?rawAnswers.join(' ; '):(rawAnswers[0]||''));
  return {
    kind:'slots',layout:slotCount>1?'inline':'entry',slots,
    acceptedCombinations,
    expectedDisplay:'réponse : '+expected,
    keys:keypadKeysFor(inst)
  };
}

function courseKindForModule(moduleId,mode){
  const pedagogyModule=globalThis.MATHSGO_PEDAGOGY&&globalThis.MATHSGO_PEDAGOGY.getModule(moduleId);
  if(pedagogyModule&&pedagogyModule.courseKind) return pedagogyModule.courseKind;
  const alwaysAvailable={
    dnb_01:'fraction_decimal',dnb_02:'decimal_numbers',dnb_02b:'place_value_shift',dnb_03:'fraction_ops',dnb_03b:'fraction_mul_div',
    dnb_04:'fraction_quantity_percent',dnb_05:'equivalent_forms',dnb_06:'scientific_notation',dnb_07:'squares',
    dnb_08:'divisibility',dnb_09:'number_relations',dnb_10:'reduce_expression',dnb_11:'substitution',
    dnb_12:'expand_factor',dnb_13:'equations',dnb_14:'number_line',dnb_15:'coordinates',
    dnb_16:'figure_coding',dnb_17:'angles',dnb_18:'triangle_angles',dnb_19:'conversions',dnb_20:'solids',
    dnb_21:'perimeter_formulas',dnb_22:'area_formulas',dnb_23:'volume_formulas',dnb_24:'pythagoras',dnb_25:'thales',
    dnb_26:'trigonometry_basics',dnb_26b:'trigonometry_calculator',dnb_27:'transformations',dnb_28:'probability',dnb_29:'frequency',
    dnb_30:'mean',dnb_31:'median',dnb_32:'read_data',dnb_33:'recognize_proportion',
    dnb_34:'solve_proportion',dnb_35:'percent_change',dnb_36:'read_graph',dnb_37:'algorithm'
  };
  if(alwaysAvailable[moduleId]) return alwaysAvailable[moduleId];
  return null;
}

function courseContextForInstance(inst,correctionHtml=''){
  if(inst.module.id==='dnb_04'&&inst.fractionPercent) return {...inst.fractionPercent};
  if(inst.module.id==='dnb_35'&&inst.evolution) return {percent:inst.evolution.percent,direction:inst.evolution.direction,kind:inst.evolution.kind};
  if(inst.module.id==='dnb_19') return {questionNumber:Number(inst.q.n)};
  if(inst.module.id==='dnb_22'&&inst.area) return {kind:inst.area.kind,shape:inst.area.courseShape||''};
  if(inst.module.id==='dnb_23') return {questionNumber:Number(inst.q.n)};
  if(['dnb_26','dnb_26b'].includes(inst.module.id)&&inst.trig) return {kind:inst.trig.kind};
  const pedagogyType=globalThis.MATHSGO_PEDAGOGY&&globalThis.MATHSGO_PEDAGOGY.getQuestionType(inst.module.id,inst.q.n);
  if(inst.module.id==='dnb_12'){
    const probe=document.createElement('div');probe.innerHTML=correctionHtml;
    const detail=probe.querySelector('.expand-correction-detail-template');
    return {questionTypeId:pedagogyType?.id||'expand-factor',helpSections:[...(pedagogyType?.helpSections||[])],exampleHtml:detail?detail.innerHTML:''};
  }
  if(inst.module.id==='dnb_17'){
    const helpSections=inst.angleData?.courseSections||pedagogyType?.helpSections||['angle-range'];
    const sourceValue=inst.angleData?.value??inst.scope?.a;
    return {questionTypeId:pedagogyType?.id||inst.angleData?.kind||'angle',helpSections:[...helpSections],value:Number(sourceValue),known:Number(inst.angleData?.known),degrees:Number(inst.angleData?.degrees),relation:inst.angleData?.relation,letters:Array.isArray(inst.angleData?.letters)?[...inst.angleData.letters]:undefined};
  }
  if(pedagogyType) return {questionTypeId:pedagogyType.id,helpSections:[...pedagogyType.helpSections]};
  return null;
}

/* Lot T — petits outils d'écriture partagés par la construction des
   diapositives et par la page de la série (injectés par toString()). */
function lotTFracHtml(numerator,denominator){
  return '<span class="frac"><span class="frac-num">'+numerator+'</span><span class="frac-den">'+denominator+'</span></span>';
}
function lotTValeurHtml(value){
  let text=String(value??'').trim();
  if(!text) return '';
  text=text.replace(/[&<>]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[character]));
  text=text.replace(/^-/,'−').replace(/([0-9])\.([0-9])/g,'$1,$2');
  const fraction=text.match(/^([−-]?[0-9]+(?:,[0-9]+)?)\s*\/\s*([−-]?[0-9]+(?:,[0-9]+)?)$/);
  if(fraction) return lotTFracHtml(fraction[1],fraction[2]);
  return typeof typographieTexte==='function'?typographieTexte(text):text;
}
function lotTPolynomeHtml(values,terms){
  const parts=[];
  (values||[]).forEach((raw,index)=>{
    const text=String(raw??'').trim().replace(/[−–]/g,'-').replace(',','.');
    if(text===''||(/^-?[0-9.]+$/.test(text)&&Number(text)===0)) return;
    const negative=text.charAt(0)==='-';
    let magnitude=(negative?text.slice(1):text).replace('.',',');
    const term=terms&&terms[index];
    const variable=term==='x2'?'𝑥²':(term==='x'?'𝑥':'');
    if(variable&&magnitude==='1') magnitude='';
    parts.push({negative,body:magnitude+variable});
  });
  if(!parts.length) return '0';
  return parts.map((part,index)=>index===0?(part.negative?'−':'')+part.body:(part.negative?' − ':' + ')+part.body).join('');
}
function lotTTemplateHtml(segments,values){
  const text=(segments||[]).map(segment=>Number.isInteger(segment.slot)?lotTValeurHtml((values||[])[segment.slot]||'…'):String(segment.text||'').replace(/[&<>]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[character]))).join('');
  return typeof typographieTexte==='function'?typographieTexte(text.replace(/x/g,'𝑥')):text;
}
function typographieSourceForPage(){
  if(typeof typographieTexte!=='function'||typeof typographieHtml!=='function'){
    return "function typographieTexte(text){return String(text??'');}\nfunction typographieHtml(html){return String(html??'');}";
  }
  // Dans une fermeture : la série s'écrit souvent dans le MÊME onglet que le
  // menu (document.open), où les « const TYPO_… » du moteur existent déjà ;
  // les redéclarer au niveau global arrêtait tout le script de la série.
  return [
    '(function(){',
    'const TYPO_EXPOSANTS='+JSON.stringify(TYPO_EXPOSANTS)+';',
    'const TYPO_ESPACE='+JSON.stringify(TYPO_ESPACE)+';',
    'const TYPO_MOINS_SIGNE='+TYPO_MOINS_SIGNE.toString()+';',
    'const TYPO_MOINS_ENTRE_NOMBRES='+TYPO_MOINS_ENTRE_NOMBRES.toString()+';',
    'const TYPO_MOINS_APRES_LETTRE='+TYPO_MOINS_APRES_LETTRE.toString()+';',
    typographieTexte.toString(),
    typographieHtml.toString(),
    'window.typographieTexte=typographieTexte;window.typographieHtml=typographieHtml;',
    '})();'
  ].join('\n');
}
function lotTTypo(html){
  // Au passage : height="auto" n'est pas une hauteur valide pour une figure
  // <svg> (le navigateur l'ignore et l'écrit en erreur dans la console) ; la
  // hauteur suit de toute façon la largeur et le viewBox.
  const source=String(html??'').replace(/(<svg\b[^>]*?)\sheight="auto"/gi,'$1');
  return typeof typographieHtml==='function'?typographieHtml(source):source;
}

/* Lot T — champs « correction », « aide » et « pavé » d'une question (voir
   CONTRAT-REFONTE.md §1). Priorité aux champs posés sur l'instance par le
   générateur du module ; sinon, les champs du gabarit de données, interpolés
   avec le même scope que l'énoncé (subVars : ${…} et {{…}}). */
function lotTInterpolate(text,inst){
  try{
    const value=typeof subVars==='function'?subVars(String(text),inst.scope||{}):String(text);
    if(/\bundefined\b|\bNaN\b/.test(value)) return null;
    return value;
  }catch(error){return null;}
}
function lotTRenderLine(html){
  return lotTTypo(typeof renderMathSegments==='function'?renderMathSegments(String(html)):String(html));
}
function lotTList(value){
  return (Array.isArray(value)?value:(value!==undefined&&value!==null&&value!==''?[value]:[])).map(item=>String(item)).filter(item=>item.trim());
}
function lotTTexts(inst,instanceKey,templateKey,max){
  const own=inst&&inst[instanceKey];
  let lines;
  if(own!==undefined&&own!==null) lines=lotTList(own);
  else lines=lotTList(inst&&inst.q&&inst.q[templateKey]).map(line=>lotTInterpolate(line,inst)).filter(line=>line!==null&&line.trim());
  return lines.slice(0,max).map(lotTRenderLine);
}
function lotTDistractorFeedback(inst){
  const own=inst&&inst.distractorFeedback;
  const source=own||(inst&&inst.q&&inst.q.distractor_feedback);
  if(!source||typeof source!=='object') return null;
  const permutation=!own&&Array.isArray(inst.qcmPermutation)?inst.qcmPermutation:null;
  const out={};
  Object.keys(source).forEach(key=>{
    const number=Number(key);
    if(!Number.isInteger(number)||number<1) return;
    const displayed=permutation?permutation.indexOf(number-1):number-1;
    if(displayed<0) return;
    const text=own?String(source[key]):lotTInterpolate(source[key],inst);
    if(text&&text.trim()) out[String(displayed)]=lotTRenderLine(text);
  });
  return Object.keys(out).length?out:null;
}
// Le dessin d'aide : ce que le rendu « avec aide » ajoute au rendu « sans
// aide ». A0 (15/10) : on prend les BLOCS entiers (dessin, tableau, carte de
// méthode, outil à manipuler), plus seulement les <svg> : le lot T perdait
// toutes les aides écrites en HTML (tableau de numération de dnb_02b, carte
// « Simplifie avant de multiplier » de dnb_03b, tableau de conversion de
// dnb_19, équation de dnb_13…). Les identifiants internes sont ignorés dans
// la comparaison. Les liens vers les outils du site restent hors du panneau
// (décision 8 : toucher un lien ferait quitter la série). Rien trouvé, pas
// de dessin.
function lotTSvgBlocks(html){return String(html||'').match(/<svg[\s\S]*?<\/svg>/gi)||[];}
function lotTSvgKey(svg){return svg.replace(/\s(?:id|aria-labelledby|aria-describedby)="[^"]*"/g,'').replace(/url\(#[^)]*\)/g,'url(#)').replace(/href="#[^"]*"/g,'href="#"').replace(/\s+/g,' ');}
function lotTAideSemblables(a,b){
  if(a.tagName!==b.tagName) return false;
  const ca=[...a.classList],cb=[...b.classList];
  return (!ca.length&&!cb.length)||ca.some(name=>cb.includes(name));
}
function lotTAideBlocsEnPlus(avec,sans){
  const enPlus=[];
  const comparer=(a,b)=>{
    const ea=[...a.children],eb=[...b.children];
    const ka=ea.map(element=>lotTSvgKey(element.outerHTML)),kb=eb.map(element=>lotTSvgKey(element.outerHTML));
    const n=ea.length,m=eb.length,suite=Array.from({length:n+1},()=>new Array(m+1).fill(0));
    for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)suite[i][j]=ka[i]===kb[j]?suite[i+1][j+1]+1:Math.max(suite[i+1][j],suite[i][j+1]);
    let i=0,j=0;const trouA=[],trouB=[];
    const apparier=()=>{
      const pris=new Set();
      trouA.forEach(x=>{const k=trouB.findIndex((y,rang)=>!pris.has(rang)&&lotTAideSemblables(x,y));if(k>=0){pris.add(k);comparer(x,trouB[k]);}else enPlus.push(x);});
      trouA.length=0;trouB.length=0;
    };
    while(i<n||j<m){
      if(i<n&&j<m&&ka[i]===kb[j]){apparier();i++;j++;}
      else if(j<m&&(i>=n||suite[i][j+1]>=suite[i+1][j])){trouB.push(eb[j]);j++;}
      else{trouA.push(ea[i]);i++;}
    }
    apparier();
  };
  comparer(avec,sans);
  return enPlus;
}
const LOT_T_AIDE_HORS_PANNEAU='a[href],[class*="resolve-button-row"],[class*="resolve-btn"],.angle-bar-action-row,script';
function lotTAideDrawing(inst,policy){
  if(inst&&inst.aideHtml) return lotTTypo(String(inst.aideHtml));
  if(policy!=='optional'&&policy!=='aid-only') return '';
  let withHtml='',withoutHtml='';
  try{withHtml=buildCleanSlideHtml(inst,false,'with');withoutHtml=buildCleanSlideHtml(inst,false,'without');}catch(error){return '';}
  if(typeof document==='undefined'||!document.createElement){
    const present=new Set(lotTSvgBlocks(withoutHtml).map(lotTSvgKey));
    const extra=lotTSvgBlocks(withHtml).filter(svg=>!present.has(lotTSvgKey(svg)));
    return extra.length?lotTTypo(extra.map(svg=>'<div class="aide-figure">'+svg+'</div>').join('')):'';
  }
  const avec=document.createElement('div'),sans=document.createElement('div');
  avec.innerHTML=withHtml;sans.innerHTML=withoutHtml;
  const blocs=lotTAideBlocsEnPlus(avec,sans).filter(bloc=>!bloc.matches(LOT_T_AIDE_HORS_PANNEAU));
  blocs.forEach(bloc=>bloc.querySelectorAll(LOT_T_AIDE_HORS_PANNEAU).forEach(node=>node.remove()));
  const utiles=blocs.filter(bloc=>bloc.children.length||bloc.matches('svg,img,canvas')||(bloc.textContent||'').trim());
  if(!utiles.length) return '';
  // Un petit dessin (tuile, jeton) garde sa taille : il n'est pas étiré à la
  // largeur du panneau.
  utiles.forEach(bloc=>[bloc,...bloc.querySelectorAll('svg')].forEach(svg=>{if(svg.tagName&&svg.tagName.toLowerCase()==='svg'&&Number(svg.getAttribute('width'))>0&&Number(svg.getAttribute('width'))<200) svg.classList.add('aide-svg-petit');}));
  // Un dessin par choix (QCM) ou par cadre : on le pose avec son étiquette
  // (« A. n + 2 », « Double »), comme dans la question d'origine.
  const etiquette=bloc=>{
    const parent=bloc.parentElement;
    if(!parent||parent===avec) return null;
    const voisin=[...parent.children].find(enfant=>enfant!==bloc&&!utiles.includes(enfant)&&(enfant.textContent||'').trim());
    if(!voisin) return null;
    const copie=voisin.cloneNode(true);
    copie.querySelectorAll('.answer-slot,.answer-dots,input,button').forEach(node=>node.remove());
    copie.querySelectorAll('strong,span,b').forEach(node=>{if(/^[.…\s]*$/.test(node.textContent||'')&&!node.querySelector('svg')) node.remove();});
    const texte=(copie.textContent||'').replace(/\s+/g,' ').trim();
    return texte&&texte.length<=60?copie:null;
  };
  const parents=new Set(utiles.map(bloc=>bloc.parentElement));
  const enGroupe=utiles.length>=2&&parents.size===utiles.length&&utiles.every(bloc=>etiquette(bloc));
  if(enGroupe){
    return lotTTypo('<div class="aide-figure"><div class="aide-groupe">'+utiles.map(bloc=>'<div class="aide-groupe-item"><div class="aide-etiquette">'+etiquette(bloc).innerHTML+'</div>'+bloc.outerHTML+'</div>').join('')+'</div></div>');
  }
  return lotTTypo(utiles.map(bloc=>'<div class="aide-figure">'+bloc.outerHTML+'</div>').join(''));
}
// La bonne réponse, écrite comme en maths (vrai signe moins, fraction
// empilée, x², 17 %), pour la ligne de verdict, la carte et la fin de série.
// dnb_08 : « 2, 3 et 9 » (réponses écrites avec les choix, data-answer-labels).
function lotTListeEt(items){
  const list=items.map(String).filter(Boolean);
  return list.length>1?list.slice(0,-1).join(', ')+' et '+list[list.length-1]:list.join('');
}
function lotTExpectedHtml(inst,spec){
  if(!spec) return '';
  try{
    if(spec.kind==='qcm'&&spec.answerLabels) return lotTTypo(lotTListeEt((spec.correctIndices||[]).map(index=>((spec.options||[])[index]||{}).displayedValue||'')));
    if(spec.kind==='qcm') return (spec.correctIndices||[]).map(index=>String.fromCharCode(65+index)).join(', ').replace(/, ([A-Z])$/,' et $1');
    const first=(spec.acceptedCombinations||[])[0]||[];
    if(spec.layout==='fraction'&&first.length===2) return lotTFracHtml(lotTValeurHtml(first[0]),lotTValeurHtml(first[1]));
    if(spec.layout==='polynomial'&&first.length) return lotTPolynomeHtml(first,(spec.slots||[]).map(slot=>slot.term));
    if(spec.layout==='algebra-template'&&first.length) return lotTTemplateHtml(spec.segments||[],first);
    let text=String(spec.expectedDisplay||'').replace(/^(?:\s*(?:réponse attendue|réponses?)\s*:?\s*)+/i,'').trim();
    if(!text&&first.length) text=first.join(' ; ');
    if(!/[<>]/.test(text)){
      if(/^[−-]?[0-9]+(?:[.,][0-9]+)?\s*\/\s*[−-]?[0-9]+(?:[.,][0-9]+)?$/.test(text)) return lotTValeurHtml(text);
      text=text.replace(/&(?![#a-zA-Z0-9]+;)/g,'&amp;');
    }
    text=text.replace(/(^|[\s(=])-(?=[0-9])/g,'$1−').replace(/([0-9])\.([0-9])/g,'$1,$2');
    return lotTTypo(typeof renderMathSegments==='function'?renderMathSegments(text):text);
  }catch(error){return '';}
}
// Gabarit d'écriture de la réponse de l'élève quand la réponse attendue se
// lit dans le pied de l'énoncé (coordonnées de dnb_15 : « A(… ; …) »).
function lotTAnswerTemplate(inst,spec){
  if(!spec||spec.kind!=='slots'||!['inline','entry'].includes(spec.layout)) return '';
  // dnb_06 : « Ta réponse : 45,2 × 10⁻⁴ » (les deux cases dans l'écriture).
  if(inst.module.id==='dnb_06') return inst.scientific&&inst.scientific.answerTemplate||'';
  if(inst.module.id!=='dnb_15') return '';
  const answers=(inst.answers||[]).map(String);
  if(answers.length<2) return '';
  const template=expectedDisplayFromFooter(inst,answers.map((value,index)=>'{'+index+'}'));
  return /\{0\}/.test(template)?template:'';
}
function lotTShortPrompt(questionHtml){
  try{
    const probe=document.createElement('div');
    probe.innerHTML=questionHtml;
    probe.querySelectorAll('svg,.options,.opt,script,style,button,[class*="button"],.visual-placeholder,.footer,table').forEach(node=>node.remove());
    // Écritures empilées remises sur une ligne : 4/8, x², case « … ».
    const exposants={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','−':'⁻'};
    probe.querySelectorAll('.frac').forEach(node=>{const num=node.querySelector('.frac-num'),den=node.querySelector('.frac-den');node.replaceWith(num&&den?' '+num.textContent.trim()+'/'+den.textContent.trim()+' ':node.textContent);});
    probe.querySelectorAll('sup').forEach(node=>{const raw=node.textContent.trim();node.replaceWith(/^[−-]?[0-9]+$/.test(raw)?raw.split('').map(character=>exposants[character]||character).join(''):'^'+raw);});
    probe.querySelectorAll('.answer-slot').forEach(node=>node.replaceWith(' … '));
    probe.querySelectorAll('br').forEach(node=>node.replaceWith(' '));
    probe.querySelectorAll('div,p,li,section,small,h2,h3,table').forEach(node=>{node.before(' ');node.after(' ');});
    const clean=node=>(node.textContent||'').replace(/\s+/g,' ').trim();
    const question=probe.querySelector('.question')||probe;
    let text=clean(question);
    // Énoncé trop court (« Résous cette équation. ») : on ajoute ce qui suit (l'équation).
    if(question!==probe&&text.length<40){
      let next=question.nextElementSibling;
      while(next&&text.length<60){const more=clean(next);if(more) text+=' '+more;next=next.nextElementSibling;}
    }
    text=text.replace(/\s*=\s*/g,' = ').replace(/\s+/g,' ').trim();
    if(text.length>90) text=text.slice(0,88).replace(/\s+\S*$/,'')+'…';
    return lotTTypo(text.replace(/[&<>]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[character])));
  }catch(error){return '';}
}

const DIAPO_SANS_DESSIN_AIDE=new Set(['dnb_15','dnb_26','dnb_28']);
function slidesDataForQuiz(sourceQuiz,mode,context={}){
  fractionOpsSvgCounter=0;
  return sourceQuiz.map((inst,index) => {
    const visualPolicy=visualPolicyForQuestion(inst.module,inst.q);
    const readDataAid=mode==='without'&&inst.module.id==='dnb_32';
    // Lot T : les dessins d'aide (optional, aid-only) ne sont plus dans la
    // question, dans aucun mode ; ils passent dans le panneau Aide.
    let renderMode=readDataAid?'without-essential':slideModeForVisualPolicy(mode,visualPolicy);
    // 17/10 (Gwenaël) : au diaporama, « Avec aide », le dessin d'aide est
    // projeté sous la question, comme avant la refonte (il n'y a pas de bouton
    // Aide au diaporama). Automatisme refait : son dessin d'aide (le même que
    // dans le panneau de la série). Sinon : le rendu « avec aide » d'origine,
    // dessin à sa place et complété à la correction.
    let dessinDiapo='';
    if(context.experienceMode==='presentation'&&mode==='with'&&!readDataAid){
      // dnb_15, 26 et 28 : ta version n'avait pas de dessin d'aide au diaporama
      // (la figure de la question suffit) ; leur dessin reste dans l'Aide de la série.
      if(inst.aideHtml){if(!DIAPO_SANS_DESSIN_AIDE.has(inst.module.id)) dessinDiapo='<div class="diapo-aide">'+lotTAideDrawing(inst,visualPolicy)+'</div>';}
      else if(visualPolicy==='optional'||visualPolicy==='aid-only') renderMode='with';
    }
    // Un dessin d'aide peut avoir sa version corrigée (dnb_01 : la droite graduée porte la réponse au bout).
    const dessinDiapoCorrection=dessinDiapo&&inst.aideCorrectionHtml?'<div class="diapo-aide">'+lotTTypo(String(inst.aideCorrectionHtml))+'</div>':dessinDiapo;
    const questionHtml=lotTTypo(buildCleanSlideHtml(inst,false,renderMode))+dessinDiapo;
    const correctionHtml=lotTTypo(buildCleanSlideHtml(inst,true,renderMode))+dessinDiapoCorrection;
    const interactiveSpec=interactiveSpecForInstance(inst,correctionHtml);
    const questionInstance=context.seriesId?createQuestionInstanceContract(inst,interactiveSpec,{
      seriesId:context.seriesId,
      seriesOrdinal:context.seriesOrdinal||1,
      position:index+1,
      level:context.level
    }):null;
    const withAide=mode==='with';
    return {
      moduleId:inst.module.id,
      canonicalModuleId:mathsgoCanonicalModuleId(inst.module.id),
      questionNumber:Number(inst.q.n),
      courseKind:courseKindForModule(inst.module.id,mode),
      courseContext:courseContextForInstance(inst,correctionHtml),
      questionHtml,
      correctionHtml,
      interactiveSpec,
      questionInstance,
      assistanceMode:mode,
      equationLayout:inst.module.id==='dnb_13'&&inst.equationData
        ?(inst.equationData.qcm
          ?(inst.equationData.qcm.kind==='operation'?'qcm-operation':'qcm-solution')
          :(inst.equationData.contextual?'contextual':'direct'))
        :null,
      equationDetailHtml:inst.module.id==='dnb_13'&&inst.equationData&&!inst.equationData.qcm?lotTTypo(equationDetailHtml(inst.equationData)):null,
      canRevealVisual:false,
      correctionSteps:lotTTexts(inst,'correctionSteps','correction_steps',3),
      correctionNote:lotTTexts(inst,'correctionNote','correction_note',1)[0]||'',
      distractorFeedback:lotTDistractorFeedback(inst),
      aideSteps:withAide?lotTTexts(inst,'aideSteps','aide_steps',2):[],
      aideHtml:withAide?lotTAideDrawing(inst,visualPolicy):'',
      keypadContext:keypadContextFor(inst),
      expectedHtml:lotTExpectedHtml(inst,interactiveSpec),
      answerTemplate:lotTAnswerTemplate(inst,interactiveSpec),
      shortPrompt:lotTShortPrompt(questionHtml)
    };
  });
}

function openDiapoWindow(definition=null,{sameTab=false,targetWindow=null}={}){
  const normalized=definition?normalizeSeriesDefinition(definition):readSeriesDefinitionFromUi();
  const mode=normalized.visualMode;
  const experienceMode=normalized.experienceMode;
  const seriesId=seriesIdForDefinition(normalized);
  const seriesQuizzes=[quiz];
  if(experienceMode==='interactive'){
    const mods=modulesForSeriesDefinition(normalized);
    while(seriesQuizzes.length<normalized.seriesCount) seriesQuizzes.push(buildBalancedQuiz(mods,normalized.questionCount));
  }
  const seriesData=seriesQuizzes.map((seriesQuiz,index)=>slidesDataForQuiz(seriesQuiz,mode,{seriesId,seriesOrdinal:index+1,level:normalized.level,experienceMode}));
  const menuUrl=new URL(location.href);menuUrl.hash='';
  const html=makeDiapoWindowHtml(seriesData,experienceMode,menuUrl.href);
  if(sameTab){
    try{sessionStorage.setItem('mathsgo:auto:return-definition',JSON.stringify(normalized));}catch(error){}
    try{
      history.replaceState({mathsgoView:'menu'},'',menuUrl.href);
      const questionnaireUrl=new URL(menuUrl.href);questionnaireUrl.hash='questionnaire';
      history.pushState({mathsgoView:'questionnaire'},'',questionnaireUrl.href);
    }catch(error){}
    document.open();document.write(html);document.close();return;
  }
  const w = targetWindow&&!targetWindow.closed?targetWindow:window.open('', '_blank');
  if(!w){ alert('La nouvelle fenêtre a été bloquée. Autorise les popups pour cette page.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
