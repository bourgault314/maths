const INTERACTIVE_SERIES_COUNT=10;
const APP_REVISION=typeof MATHSGO_APP_VERSION==='string'?MATHSGO_APP_VERSION:'1.15';

function makeDiapoWindowHtml(seriesData,experienceMode='interactive'){
  const normalizedSeries=Array.isArray(seriesData&&seriesData[0])?seriesData:[seriesData||[]];
  const payload = JSON.stringify(normalizedSeries);
  const experiencePayload=JSON.stringify(experienceMode);
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
.fraction-ops-prompt{font-size:clamp(1.75rem,2.8vw,3rem);line-height:1.12;margin:0 auto 5px}
.fraction-ops-help{display:flex;flex-direction:column;align-items:center;width:100%;margin:7px auto 3px;max-width:1300px}
.fraction-ops-pair,.fraction-ops-operation,.fraction-ops-conversion{display:flex;align-items:center;justify-content:center;gap:12px 18px;width:100%;margin:0 auto}
.fraction-ops-stack{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;width:100%;margin:0 auto}
.fraction-ops-stack>.fraction-ops-arrow+.fraction-ops-card{margin-top:10px}
.fraction-ops-card{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;max-width:820px}
.fraction-ops-label{min-height:31px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.15rem,1.8vw,1.75rem);font-weight:800}
.fraction-ops-units{display:flex;align-items:center;justify-content:center;gap:5px;width:100%}
.fraction-ops-band{display:block;width:min(100%,780px);height:auto}
.fraction-ops-arrow{font-size:1.55rem;font-weight:900;color:#60708c;line-height:.8}
.fraction-ops-sign{font-size:clamp(1.8rem,3vw,3rem);font-weight:900;color:#17283f;flex:none}
.fraction-ops-sign-bottom{align-self:flex-end;margin-bottom:30px}
.fraction-ops-wall,.fraction-ops-compare-wall{display:flex;flex:0 1 auto;flex-direction:column;align-items:center;justify-content:center;width:min(100%,820px)}
.fraction-ops-wall .fraction-ops-band,.fraction-ops-compare-wall .fraction-ops-band{width:min(100%,780px);flex:none}
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
.place-value-prompt{font-size:clamp(2rem,3.6vw,3.15rem);margin-bottom:6px}
.place-value-equation{font-family:Cambria Math,Times New Roman,serif;font-size:clamp(2.6rem,5.1vw,4.5rem);font-weight:800;margin:4px auto 12px;gap:.14em}.place-value-number-units,.place-value-fixed-digit.is-units-digit,.place-value-strip-digit.is-units-digit{color:#0879d0}.place-value-number-comma{color:#e86100}
.place-value-tool{width:min(98%,1480px);margin:8px auto 0;user-select:none;touch-action:none}
.place-value-grid{position:relative;overflow:hidden;border:3px solid #17384d;border-radius:14px;background:#fff}
.place-value-head-row,.place-value-window-row,.place-value-fixed-row{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.place-value-head{display:flex;align-items:center;justify-content:center;height:38px;padding:0 4px;border-right:1.5px solid #9fb3c8;border-bottom:1.5px solid #9fb3c8;background:#eef6ff;color:#35526e;font-size:clamp(.72rem,1.4vw,1rem);font-weight:800}
.place-value-head:nth-child(4){background:#dceeff;color:#0879d0}.place-value-head:last-child{border-right:0}
.place-value-preview-row,.place-value-fixed-row{position:relative;height:66px}.place-value-preview-row{background:#f7f8fa}.place-value-fixed-row{border-top:1.5px solid #9fb3c8;background:#fff}
.place-value-window-row{position:absolute;inset:0;z-index:5;pointer-events:none}.place-value-window{border-right:1.5px solid #9fb3c8}.place-value-window:last-child{border-right:0}
.place-value-strip-viewport{position:absolute;inset:0;z-index:3;overflow:hidden;pointer-events:none}
.place-value-strip{position:absolute;inset:0 auto 0 0;display:grid;grid-template-columns:repeat(13,calc(100% / 13));width:calc(100% * 13 / 7);align-items:center;justify-items:center;will-change:transform}
.place-value-strip-digit,.place-value-fixed-digit{display:grid;place-items:center;color:#0b2147;font-family:Cambria Math,Times New Roman,serif;font-size:clamp(2.25rem,4.35vw,3.8rem);font-weight:850}.place-value-strip-digit.ghost-zero{color:#334d68}
.place-value-drag-bar{position:absolute;z-index:2;left:-24px;right:-24px;top:8px;height:50px;cursor:grab;touch-action:none;outline:none;will-change:transform}.place-value-drag-bar span{display:block;width:100%;height:100%;border:1px solid rgba(107,114,128,.3);border-radius:0;background:rgba(209,213,219,.62);box-shadow:inset 0 2px 3px rgba(0,0,0,.12),inset 0 -2px 3px rgba(255,255,255,.55)}.place-value-drag-bar:focus-visible span{box-shadow:inset 0 0 0 3px #f07818}
.place-value-fixed-digit{border-right:1.5px solid #9fb3c8}.place-value-fixed-digit:nth-child(7){border-right:0}
.place-value-comma{position:absolute;z-index:7;left:calc(57.142857% - 4px);bottom:4px;color:#e86100;font-family:Cambria Math,serif;font-size:2.6rem;font-weight:900;line-height:1;pointer-events:none}
.place-value-row-labels{position:absolute;width:1px;height:1px;overflow:hidden}.place-value-tool-note{display:flex;align-items:center;justify-content:center;height:44px;min-height:44px;margin-top:8px;color:#31516e;font-size:clamp(1.08rem,2vw,1.45rem);line-height:1.1}.place-value-tool-note strong{color:#087a55;font-size:1.25em}.place-value-correction{height:28px;margin:7px auto;color:#31516e;font-size:clamp(1.08rem,2vw,1.45rem);line-height:1.1}.place-value-options{max-width:820px;margin-top:10px}
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
.fraction-ops-method-card{width:min(100%,820px);margin:8px auto;padding:18px 22px;border:2px solid #bfd4ec;border-radius:18px;background:#f5f9ff}
.fraction-ops-method-label{display:block;margin-bottom:12px;color:#0b4b84;font-size:clamp(1.05rem,1.6vw,1.4rem);font-weight:900}
.fraction-ops-method-line{display:flex;align-items:center;justify-content:center;gap:14px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.8rem,3vw,3.2rem);font-weight:800}
.fraction-ops-method-arrow{color:#e86100;font-family:Arial,Helvetica,sans-serif;font-size:.85em;font-weight:900}
.fraction-ops-counting{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.fraction-ops-counting .fraction-ops-card{width:100%;max-width:980px}
.fraction-ops-counting .fraction-ops-units{width:min(100%,920px);gap:10px}
.fraction-ops-counting .fraction-ops-band{min-width:0;flex:1 1 0}
.fraction-ops-count-result{padding:9px 15px;border-radius:12px;background:#ecfdf5;color:#087a55;font-size:clamp(1.05rem,1.8vw,1.45rem);font-weight:900}
.fraction-ops-share{display:flex;align-items:center;justify-content:center;gap:15px;width:100%}
.fraction-ops-share-sign{flex:none;color:#e86100;font-size:clamp(1.5rem,2.6vw,2.6rem);font-weight:900}
@media(min-width:801px){.fraction-ops-card{max-width:860px}.fraction-ops-stack>.fraction-ops-card{width:min(100%,860px)}.fraction-ops-result-visual>.fraction-ops-card{width:min(100%,860px);flex:0 1 860px}.fraction-ops-operation>.fraction-ops-card,.fraction-ops-conversion>.fraction-ops-card{width:min(100%,620px);flex:0 1 620px}.fraction-ops-operation,.fraction-ops-conversion{gap:34px}.fraction-ops-band{width:min(100%,800px)}.fraction-ops-stack-simplify .fraction-ops-band{width:min(100%,700px)}.fraction-ops-units.units-2{width:min(100%,820px);gap:12px}.fraction-ops-units.units-2 .fraction-ops-band{width:min(100%,398px);flex:1 1 0}.fraction-ops-units.units-3{width:min(100%,840px);gap:10px}.fraction-ops-units.units-3 .fraction-ops-band{width:min(100%,270px);flex:1 1 0}.fraction-ops-operation .fraction-ops-band,.fraction-ops-conversion .fraction-ops-band{width:min(100%,575px)}.fraction-ops-wall,.fraction-ops-compare-wall{width:min(100%,860px);flex-basis:auto}.fraction-ops-wall .fraction-ops-band,.fraction-ops-compare-wall .fraction-ops-band{width:min(100%,800px)}.fraction-ops-area{width:min(100%,650px);max-height:440px}.fraction-ops-label{font-size:clamp(1.55rem,2.4vw,2.35rem)}.fraction-ops-wall-label{font-size:clamp(1.45rem,2.2vw,2.15rem)}}
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
.equation-resolve-btn{grid-column:2;justify-self:center;margin:0;padding:6px 11px;border:2px solid #159d52;border-radius:11px;background:#eefbf3;color:#087238;font-family:Arial,Helvetica,sans-serif;font-size:clamp(.8rem,1.08vw,.96rem);font-weight:900;line-height:1;text-decoration:none;white-space:nowrap;box-shadow:0 1px 0 rgba(8,114,56,.08)}
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
@media(max-width:800px){.diapo.equation-mode .stage{padding:7px 7px 14px}.equation-prompt{font-size:clamp(1.12rem,5vw,1.45rem);margin-bottom:2px}.equation-resolve-button-row{width:min(100%,720px);margin-bottom:-1px}.equation-resolve-btn{padding:4px 7px;border-radius:8px;font-size:.68rem;border-width:1.5px}.equation-main{font-size:clamp(1.65rem,7.5vw,2.1rem);margin:1px auto 2px}.equation-help{height:clamp(155px,29vh,225px)}.equation-help-equation{font-size:clamp(1.25rem,5.5vw,1.65rem)}.equation-splat-svg{width:min(100%,620px)}.equation-answer-shell{grid-template-columns:minmax(54px,1fr) auto minmax(54px,1fr)}.equation-answer{font-size:clamp(1.65rem,7.3vw,2.1rem)}.equation-detail-btn{margin-left:5px;padding:6px 8px;border-radius:9px;font-size:.78rem}.equation-options,.equation-options.options-3{grid-template-columns:1fr;gap:6px;margin-top:4px}.equation-options .opt{font-size:clamp(.88rem,3.75vw,1.05rem);padding:8px 9px}}
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
.angle-bar-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(165px,28vh,225px);margin:2px auto 1px}
.angle-bar-svg{display:block;width:min(100%,850px);height:auto;max-height:100%}
.angle-sum-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.1rem,3.8vw,3.9rem);margin-top:3px}
.angle-sum-answer .answer-slot-filled{margin-right:0}
.angle-sum-options{margin-top:8px;max-width:900px}
.angle-sum-options .opt{font-size:clamp(1.2rem,1.9vw,1.9rem);padding:11px 14px}
.diapo.angle-sum-mode.angle-figure-mode .angle-sum-prompt{font-size:clamp(1.45rem,2.25vw,2.35rem)}
.diapo.angle-sum-mode.angle-figure-mode .angle-sum-prompt svg{max-height:205px;margin-top:2px}
.diapo.angle-sum-mode.angle-figure-mode .angle-bar-help{height:135px;margin-top:0}
.diapo.evolution-mode .stage{align-items:center;padding:10px 20px 16px;overflow:auto}
.diapo.evolution-mode .slide{max-width:1220px}
.evolution-prompt{font-size:clamp(1.7rem,2.55vw,2.85rem);font-weight:850;line-height:1.15;margin:0 auto 5px}
.evolution-prompt table{font-size:clamp(1.15rem,1.62vw,1.55rem)!important;margin-top:14px!important;margin-bottom:13px!important}
.evolution-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(155px,26vh,235px);margin:2px auto 1px}
.evolution-svg{display:block;width:min(100%,1120px);height:auto;max-height:100%}
.evolution-answer{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2rem,3.7vw,3.9rem);margin-top:3px}
.evolution-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 13px;margin:7px auto 0;max-width:1000px}
.evolution-options .opt{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(1.05rem,1.55vw,1.5rem);padding:10px 13px}
.diapo.relation-mode .stage{align-items:center;padding:14px 22px 18px;overflow:auto}
.diapo.relation-mode .slide{max-width:1080px}
.relation-prompt{font-size:clamp(1.9rem,3vw,3.3rem);line-height:1.12;margin:0 auto 8px}
.relation-bar-help{display:flex;align-items:center;justify-content:center;width:100%;height:clamp(190px,32vh,270px);margin:2px auto 1px}
.relation-bar-svg{display:block;width:min(100%,940px);height:auto;max-height:100%}
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
.diapo.squares-mode .footer,.diapo.squares-mode .math-display{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-style:normal}
.diapo.squares-mode sup{font-size:.5em;line-height:0;vertical-align:.78em;margin-left:.02em}
.diapo.squares-mode .answer-dots{min-width:1.2em}
.diapo.numberline-mode .footer,.diapo.numberline-mode .math-display{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-style:normal}
.diapo.numberline-mode .footer sub{font-size:.58em;line-height:0;vertical-align:-.28em;margin-left:.04em}
.diapo.numberline-mode .answer-slot{width:3.4em!important;justify-content:flex-start;margin-left:.04em;margin-right:0}
.diapo.numberline-mode .question{margin-bottom:0}
.diapo.numberline-mode .question svg{display:block;width:100%;max-width:700px!important;height:auto;margin:0 auto}
.diapo.numberline-mode .footer{margin-top:0}
.diapo.numberline-mode .footer .math-display{transform:translateX(.8em)}
.diapo.solids-mode .stage{align-items:center;padding:12px 24px 16px}
.diapo.solids-mode .slide{max-width:1040px}
.solid-prompt{font-size:clamp(1.65rem,2.55vw,2.65rem);font-weight:850;line-height:1.12;margin:0 auto 3px}
.solid-visual{display:flex;align-items:center;justify-content:center;width:310px;max-width:100%;height:clamp(190px,30vh,270px);margin:0 auto}
.solid-visual .solid-svg{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain}
.solid-emoji{font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;font-size:clamp(8rem,22vh,12rem);line-height:1;filter:drop-shadow(0 5px 7px rgba(16,36,74,.15))}
.solid-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;margin:2px auto 0;max-width:780px}
.solid-options .opt{padding:10px 14px;border-radius:13px;font-size:clamp(1.03rem,1.45vw,1.35rem)}
.diapo.perimeter-mode .stage{align-items:center;padding:8px 22px 16px;overflow:auto}
.diapo.perimeter-mode .slide{max-width:1100px}
.perimeter-prompt{font-size:clamp(1.65rem,2.55vw,2.8rem);font-weight:850;line-height:1.13;margin:0 auto 3px}
.perimeter-prompt>div{margin-left:auto!important;margin-right:auto!important;text-align:center!important}
.perimeter-prompt svg{display:block;width:auto;max-width:100%;height:clamp(230px,35vh,325px);max-height:325px;margin:2px auto}
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
.volume-prompt{font-size:clamp(1.55rem,2.35vw,2.6rem);font-weight:850;line-height:1.14;margin:0 auto 5px}
.volume-prompt>div{margin-left:auto!important;margin-right:auto!important}
.volume-prompt svg{display:block;width:auto;max-width:100%;height:clamp(205px,32vh,300px);max-height:300px;margin:3px auto 1px}
.volume-correction-flow{gap:10px;width:min(100%,980px);margin:16px auto 2px;padding:12px 18px}
.volume-formula{min-height:0;margin:0 auto;font-size:clamp(2rem,3.1vw,3.2rem)}
.volume-calculation{font-size:clamp(1.75rem,2.75vw,2.75rem);padding:5px 12px}
.volume-answer{font-size:clamp(3rem,5vw,5.2rem);margin-top:10px}
.diapo.volume-mode.correction-visible .volume-prompt svg{height:clamp(175px,26vh,245px);max-height:245px}
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
.diapo.dense-mode .stage{padding:8px 16px 12px}
.diapo.dense-mode .stage>.slide{margin-top:0;margin-bottom:0}
.diapo.dense-mode .question{margin-bottom:9px;font-size:clamp(1.35rem,2.25vw,2.45rem);line-height:1.1}
.diapo.dense-mode .question svg{width:auto;max-width:100%;max-height:285px;margin:4px auto}
.diapo.dense-mode .footer{margin-top:8px;font-size:clamp(1.55rem,2.8vw,3rem)}
.diapo.dense-mode .options{gap:8px 12px;margin-top:10px}
.diapo.dense-mode .opt{padding:10px 12px;font-size:clamp(1rem,1.45vw,1.45rem);border-radius:14px}
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
.answer-dock{flex:0 0 auto;padding:10px max(14px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));border-top:1px solid var(--border);background:#f8fbff;box-shadow:0 -8px 24px rgba(11,33,71,.06)}
.answer-dock[hidden]{display:none!important}
.answer-body{--keypad-max:940px;--keypad-height-desktop:54px;--keypad-height-mobile:93px;display:grid;grid-template-columns:minmax(0,var(--keypad-max)) 176px;align-items:stretch;justify-content:center;gap:10px;width:min(100%,1360px);margin:0 auto}
.answer-main{display:grid;min-width:0;height:var(--keypad-height-desktop);min-height:54px}
.answer-main>*{grid-area:1/1}
.keypad{display:grid;grid-template-columns:repeat(var(--key-columns,11),minmax(42px,1fr));grid-auto-rows:minmax(0,1fr);gap:7px;min-width:0;height:100%;margin:0 auto;width:100%}
.key{min-width:0;min-height:0;padding:6px 8px;border:1px solid #c6d6e9;border-radius:11px;background:white;color:#073a75;font-size:1.18rem;font-weight:900;cursor:pointer;box-shadow:0 2px 0 rgba(7,58,117,.09);touch-action:manipulation}
.key:active{transform:translateY(1px);box-shadow:none}.key.utility{display:grid;place-items:center;background:#eef4fc;font-family:Arial,Helvetica,sans-serif;font-size:.9rem}.key.utility svg{width:25px;height:25px;pointer-events:none}
.answer-guidance,.answer-feedback{display:none;min-width:0;height:100%;min-height:54px;align-items:center;justify-content:center;padding:9px 16px;border:1.5px solid #cbd9ea;border-radius:13px;background:#fff;text-align:center;font-size:1.35rem;font-weight:900;line-height:1.18}
.answer-guidance{border-color:transparent;background:transparent;color:#64758c}
.answer-kind{padding:0;border:0;border-radius:0;background:transparent;white-space:nowrap;font-size:.92em;letter-spacing:.01em}
.answer-feedback{flex-direction:column;gap:2px}.feedback-title{font-size:1em}.feedback-answer{font-size:.9em;font-weight:850}.answer-feedback.good{border-color:#86d8bb;background:#ecfdf5;color:#087a55}.answer-feedback.bad{border-color:#f3a7a7;background:#fff1f2;color:#b42318}
.answer-dock.qcm-mode:not(.locked) .answer-guidance,.answer-dock.keypad-collapsed:not(.locked) .answer-guidance{display:flex}
.answer-dock.qcm-mode .keypad,.answer-dock.keypad-collapsed .keypad{visibility:hidden;pointer-events:none}
.answer-dock.locked .keypad,.answer-dock.locked .answer-guidance{visibility:hidden;pointer-events:none}
.answer-dock.locked .answer-feedback{display:flex}
.answer-dock.keypad-collapsed .answer-main,.answer-dock.qcm-mode .answer-main{height:60px}
.dock-actions{display:grid;grid-template-columns:1fr;align-items:stretch;justify-content:stretch;width:176px;height:100%}
.dock-action{min-width:0;min-height:54px;padding:8px 10px;border:1px solid #e86100;border-radius:11px;background:#ff7a1a;color:#fff;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;font-size:1.08rem;font-weight:900;cursor:pointer;box-shadow:0 2px 0 rgba(153,61,0,.16);touch-action:manipulation}
.dock-action:disabled{opacity:.62;cursor:default}
.answer-dock.qcm-mode .answer-body{grid-template-columns:minmax(280px,940px) 220px}.answer-dock.qcm-mode .dock-actions{grid-template-columns:220px;width:220px}.answer-dock.qcm-mode .dock-action{min-width:220px;font-size:1.16rem}
.interactive-input-slot{display:inline-grid;place-items:center;min-width:2.15em;min-height:1.28em;margin:0 .06em;padding:.02em .18em;border:2px solid #9fb9d8;border-radius:.24em;background:#fff;color:#073a75;font:inherit;font-weight:900;line-height:1;vertical-align:middle;cursor:pointer;box-shadow:0 .08em .16em rgba(7,58,117,.08);touch-action:manipulation}
.interactive-input-slot.is-empty{color:#8798ad}.interactive-input-slot.active{border-color:#e86100;background:#fff7ed;box-shadow:0 0 0 3px rgba(232,97,0,.13)}
.frac .interactive-input-slot{min-width:1.65em;min-height:1.12em;margin:.02em;padding:0 .12em;border-width:1.5px;border-radius:.18em}
.interactive-fraction-response{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif}.interactive-fraction-response .frac-num{border-bottom-width:3px}
.interactive-response-fallback{display:flex;align-items:center;justify-content:center;gap:.2em;margin:10px auto 0;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2rem,3.5vw,3.7rem);font-weight:800}
.interactive-polynomial-response{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:9px 14px;margin:10px auto 0;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:clamp(2.25rem,4.4vw,4.7rem);font-weight:850}
.interactive-polynomial-response.term-count-1{font-size:clamp(3rem,5.6vw,5.8rem)}.interactive-polynomial-response.term-count-2{font-size:clamp(2.55rem,5vw,5.2rem)}
.interactive-polynomial-term{display:inline-flex;align-items:center;gap:.12em;white-space:nowrap}.interactive-polynomial-separator{margin:0 -.08em;font-family:Arial,Helvetica,sans-serif;font-weight:750}
@media(min-width:801px){.diapo.interactive-mode .stage{padding:6px 18px 10px}.diapo.interactive-mode .question svg{max-height:255px;width:auto;margin-left:auto;margin-right:auto}}
@media(min-width:1200px){.answer-dock:not(.qcm-mode) .answer-body{display:block;position:relative;padding:0 195px}.answer-dock:not(.qcm-mode) .answer-main{width:100%;max-width:var(--keypad-max);margin:0 auto}.answer-dock:not(.qcm-mode) .dock-actions{position:absolute;right:14px;top:0;bottom:0}}
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
.course-btn[hidden],.course-modal[hidden],.equation-detail-modal[hidden]{display:none!important}
.course-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(11,33,71,.48)}
.course-card{position:relative;width:min(680px,100%);max-height:min(720px,calc(100dvh - 36px));overflow:auto;padding:26px;border:2px solid var(--border);border-radius:22px;background:white;box-shadow:0 24px 70px rgba(11,33,71,.28)}
.course-close{position:absolute;top:10px;right:12px;width:42px;height:42px;border:0;border-radius:50%;background:#eef4fc;color:#073a75;font-size:1.55rem;font-weight:900;cursor:pointer}
.course-title{margin:0 48px 20px;color:#073a75;font-size:clamp(1.65rem,3.4vw,2.4rem);line-height:1.1;text-align:center}
.course-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.course-rule{padding:15px 16px;border:2px solid var(--border);border-radius:15px;background:#f8fbff;font-size:clamp(1rem,1.7vw,1.3rem);line-height:1.35;text-align:left}
.course-rule>strong{display:block;margin-bottom:5px;color:#e86100;font-size:1.08em}
.course-example{display:block;margin-top:8px;padding:7px 9px;border-radius:9px;background:#eef5fd;color:#17384d;font-size:.9em;font-weight:750}
.course-equation{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.12em;margin-top:7px;font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-size:1.22em;font-weight:800}
.course-frac{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;min-width:1.35em;line-height:1;vertical-align:middle}.course-frac>span:first-child{width:100%;padding:0 .15em .08em;border-bottom:2px solid currentColor;text-align:center}.course-frac>span:last-child{padding:.08em .15em 0}
.course-visual{display:block;width:min(100%,390px);height:auto;max-height:210px;margin:9px auto 4px}.course-visual text{font-family:Arial,"Helvetica Neue",sans-serif}.course-visual .math-text{font-family:"Cambria Math","Times New Roman",serif}.course-rule-wide{grid-column:1/-1}.course-multiplier{display:inline-flex;align-items:center;justify-content:center;min-width:1.8em;padding:.02em .18em;border-radius:.28em;background:#fff1df;color:#9a4100;font-weight:900}
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
svg{display:block;max-width:100%;height:auto}
@media(min-width:1000px){.scientific-glide-help{max-width:1050px;height:clamp(220px,34vh,300px)}.scientific-glide{max-width:980px}.fraction-percent-help{height:clamp(270px,41vh,370px)}.fraction-percent-svg{width:min(100%,1080px)}.diapo:fullscreen .slide,.diapo:-webkit-full-screen .slide{zoom:1.12}}
@media(min-width:801px) and (max-height:800px){.fraction-product-manipulator{padding:0}.fraction-product-layout{width:min(100%,500px);grid-template-rows:46px minmax(300px,1fr);gap:7px 12px}}
@media(max-width:800px){.diapo{--stage-top:24px;--stage-x:24px;--stage-bottom:24px}.top{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);height:76px;text-align:center;padding:9px max(9px,env(safe-area-inset-right)) 9px max(9px,env(safe-area-inset-left));gap:6px}.left{justify-content:flex-start}.right{justify-content:flex-end}.top .btn{min-height:52px;font-size:.92rem;padding:11px 10px;border-radius:12px;white-space:nowrap}.top .btn.primary{min-width:0}.navnums{display:none}.mobile-counter{display:block;white-space:nowrap;font-size:1.08rem}.stage{padding:var(--stage-top) var(--stage-x) var(--stage-bottom)}.diapo .stage>.slide{margin-top:auto;margin-bottom:auto}.options.options-4{grid-template-columns:1fr}.options.options-4.options-compact{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.scientific-mode .stage{padding:8px 8px 13px}.scientific-prompt{font-size:clamp(1.25rem,5.8vw,1.65rem)}.scientific-footer{font-size:clamp(1.7rem,7.7vw,2.25rem);margin-top:3px}.scientific-place-help{min-height:62px;margin-top:14px}.scientific-place-equation{font-size:clamp(1.45rem,6.4vw,2rem)}.scientific-glide-help{height:clamp(160px,24vh,195px);margin-top:-3px}.scientific-condition-help{min-height:64px;margin-top:8px}.scientific-condition{font-size:clamp(1.7rem,7.4vw,2.25rem)}.scientific-options{gap:7px;margin-top:6px}.scientific-options .opt{font-size:clamp(.86rem,3.75vw,1.05rem);padding:8px 9px}.diapo.numberline-mode .footer{font-size:clamp(1.65rem,7.5vw,2rem)}.diapo.numberline-mode .answer-slot{width:2.2em!important}.diapo.numberline-mode .footer .qquad{width:.7em}.diapo.numberline-mode .footer .math-display{transform:none}.diapo.solids-mode .stage{padding:10px 10px 16px}.solid-prompt{font-size:clamp(1.25rem,5.6vw,1.65rem)}.solid-visual{width:230px;height:clamp(155px,27vh,215px)}.solid-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.solid-options .opt{font-size:clamp(.88rem,3.7vw,1.08rem);padding:8px 9px}}
@media(max-width:800px){.diapo.relation-mode .stage{padding:7px 7px 11px}.relation-prompt{font-size:clamp(1.34rem,5.95vw,1.72rem);margin-bottom:3px}.relation-bar-help{height:clamp(155px,26vh,205px);margin:0 auto}.relation-answer{font-size:clamp(1.8rem,8vw,2.35rem);margin-top:2px}.relation-options{gap:7px;margin-top:5px}.relation-options .opt{min-height:99px;padding:7px 8px;font-size:clamp(.98rem,4.4vw,1.2rem)}.relation-option-label{min-height:29px}.relation-tile-help{min-height:44px;margin-top:4px;gap:3px}.relation-summary-grid{grid-template-columns:1fr;gap:7px;margin-top:5px}.relation-summary-card{min-height:99px;padding:7px 12px}.relation-summary-line{font-size:clamp(1.05rem,4.8vw,1.3rem)}.relation-summary-card .relation-tile-help{min-height:31px}}
@media(max-width:800px){.diapo.fraction-percent-mode .stage{padding:5px 5px 9px}.fraction-percent-prompt{font-size:clamp(1.44rem,6.25vw,1.84rem);margin-bottom:3px}.fraction-percent-help{height:clamp(210px,35vh,282px);margin:0 auto}.fraction-percent-svg{width:min(100%,780px)}.fraction-percent-answer{font-size:clamp(1.95rem,8.6vw,2.55rem);margin-top:2px}}
@media(max-width:800px){.diapo.fraction-ops-mode .stage{padding:5px 4px 10px}.fraction-ops-prompt{font-size:clamp(1.28rem,5.65vw,1.62rem);margin-bottom:2px}.fraction-ops-pair,.fraction-ops-operation,.fraction-ops-conversion{flex-direction:column;gap:0;margin:0 auto}.fraction-ops-card{width:min(100%,364px)}.fraction-ops-stack>.fraction-ops-arrow+.fraction-ops-card{margin-top:6px}.fraction-ops-label{min-height:26px;font-size:clamp(1.02rem,4.45vw,1.25rem)}.fraction-ops-band{width:min(100%,348px)}.fraction-ops-wall,.fraction-ops-compare-wall{width:min(100%,364px);flex-basis:auto}.fraction-ops-wall .fraction-ops-band,.fraction-ops-compare-wall .fraction-ops-band{width:min(100%,348px)}.fraction-ops-wall-label{min-height:25px;font-size:clamp(.98rem,4.25vw,1.2rem)}.fraction-ops-sign{font-size:1.65rem;line-height:.75}.fraction-ops-sign-bottom{align-self:center;margin-bottom:0}.fraction-ops-arrow{font-size:1.25rem}.fraction-ops-result-visual{font-size:1.6rem;margin-top:0}.fraction-ops-product{flex-direction:column;gap:1px}.fraction-ops-area{width:min(100%,336px);max-height:270px}.fraction-ops-result-text{font-size:clamp(1.25rem,5.35vw,1.62rem)}.fraction-ops-answer{font-size:clamp(1.7rem,7.55vw,2.2rem);margin-top:1px}.fraction-ops-options{grid-template-columns:1fr;gap:6px;margin-top:4px}.fraction-ops-options .opt{font-size:clamp(.96rem,4.05vw,1.15rem);padding:9px 10px}.diapo.substitution-mode .stage{padding:9px 9px 14px}.substitution-prompt{font-size:clamp(1.2rem,5.3vw,1.55rem);margin-bottom:3px}.substitution-expression{font-size:clamp(1.8rem,8vw,2.35rem);margin:2px auto 5px}.substitution-help{flex-direction:column;min-height:57px;font-size:clamp(1.8rem,8vw,2.35rem);margin:2px auto}.substitution-answer{font-size:clamp(1.75rem,7.7vw,2.3rem)}.substitution-options,.substitution-options.options-3{grid-template-columns:1fr;gap:7px;margin-top:5px}.substitution-options .opt{font-size:clamp(.95rem,4.1vw,1.15rem);padding:8px 9px}}
@media(max-width:800px){.fraction-product-manipulator{display:none}.fraction-product-static{display:block!important;width:min(96%,430px);max-height:clamp(235px,42vh,330px);margin:0 auto}.fraction-ops-product{width:100%}}
@media(max-width:800px){.diapo.multiple-forms-mode .stage{padding:5px 6px 10px}.multiple-forms-prompt{font-size:clamp(1.34rem,5.9vw,1.72rem);line-height:1.15;margin-bottom:2px}.multiple-forms-help{height:clamp(230px,38vh,315px);margin:0 auto}.multiple-forms-help.multiple-forms-tenths{height:clamp(230px,38vh,315px)}.multiple-forms-help.multiple-forms-line{height:clamp(160px,27vh,210px)}.multiple-forms-caption{font-size:clamp(.94rem,4.05vw,1.15rem);margin-top:0}.multiple-forms-answer{font-size:clamp(1.95rem,8.6vw,2.55rem);margin-top:2px}.multiple-forms-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:5px}.multiple-forms-options .opt{font-size:clamp(1.02rem,4.45vw,1.25rem);padding:10px 10px}}
@media(max-width:800px){.diapo.place-value-mode .stage{padding:5px 4px 8px}.place-value-prompt{font-size:clamp(1.48rem,6.3vw,1.9rem);margin-bottom:2px}.place-value-equation{font-size:clamp(2.05rem,9vw,2.8rem);margin:1px auto 5px}.place-value-tool{width:100%;margin-top:2px}.place-value-grid{border-width:2px;border-radius:10px}.place-value-head{height:29px;padding:0 1px;font-size:clamp(.46rem,1.9vw,.62rem);writing-mode:vertical-rl;transform:rotate(180deg)}.place-value-preview-row,.place-value-fixed-row{height:49px}.place-value-drag-bar{left:-13px;right:-13px;top:6px;height:37px}.place-value-strip-digit,.place-value-fixed-digit{font-size:clamp(1.7rem,7.5vw,2.25rem)}.place-value-comma{left:calc(57.142857% - 3px);bottom:2px;font-size:2rem}.place-value-tool-note{height:35px;min-height:35px;margin-top:4px;padding:0 4px;font-size:clamp(.84rem,3.55vw,1rem);text-align:center}.place-value-tool-note strong{font-size:1.16em}.place-value-correction{height:22px;font-size:clamp(.9rem,3.8vw,1.08rem);margin:3px auto;line-height:1.05}.place-value-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:4px}.place-value-options .opt{font-size:clamp(.96rem,4.1vw,1.15rem);padding:8px}}
@media(max-width:800px){.diapo.conversion-mode .stage{padding:5px 4px 8px}.conversion-context{font-size:.86rem}.conversion-prompt{font-size:clamp(1.32rem,5.7vw,1.75rem);margin-bottom:3px}.conversion-tool{width:100%;margin:25px auto 8px;overflow-x:auto;overscroll-behavior-x:contain}.conversion-family-area .conversion-grid-wrap{width:540px}.conversion-family-volume .conversion-grid-wrap{width:735px}.conversion-grid{gap:3px}.conversion-unit{min-height:43px;padding:2px 1px;border-width:2px;font-size:.62rem}.conversion-unit small{font-size:.72em}.conversion-slot{min-height:62px;border-width:2px;font-size:1.22rem;overflow:hidden}.conversion-cursor{border-width:3px;border-radius:7px}.conversion-cursor-label,.conversion-cursor-digit-label{display:none}.conversion-cursor-comma{right:-9px;bottom:21px;font-size:2.35rem;text-shadow:1px 1px 0 #fff,-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff}.conversion-method{font-size:clamp(.84rem,3.55vw,1.02rem);margin:3px auto}.duration-conversion-tool{width:100%;margin-top:1px}.duration-disc{width:70px;border-width:3px;font-size:.78rem}.duration-instance{min-height:172px;gap:3px;padding:5px 7px;border-radius:13px}.duration-instance-row{gap:6px}.duration-disc-group{gap:4px}.duration-instance-row .duration-disc{width:58px;font-size:.67rem}.duration-plus{font-size:1.18rem}.duration-down{font-size:1.5rem}.duration-second-step{margin-top:5px}.duration-second-step .duration-disc{width:58px}.duration-second-step .duration-equivalence-pair{gap:6px}.duration-correction-line{gap:5px 8px;margin-top:6px;font-size:.88rem}}
@media(max-width:800px){.diapo.angle-sum-mode .stage{padding:7px 7px 11px}.angle-sum-prompt{font-size:clamp(1.3rem,5.8vw,1.7rem);margin-bottom:3px}.angle-sum-prompt svg{width:min(100%,350px);max-height:270px;margin-top:3px}.angle-bar-help{height:clamp(145px,24vh,195px);margin:0 auto}.angle-sum-answer{font-size:clamp(1.82rem,8.1vw,2.4rem);margin-top:2px}.angle-sum-options{gap:7px;margin-top:5px}.angle-sum-options .opt{min-height:50px;font-size:clamp(1rem,4.3vw,1.2rem);padding:10px 11px}}
@media(max-width:800px){.diapo.angle-sum-mode.angle-figure-mode .angle-sum-prompt{font-size:clamp(1.1rem,4.8vw,1.38rem)}.diapo.angle-sum-mode.angle-figure-mode .angle-sum-prompt svg{max-height:175px}.diapo.angle-sum-mode.angle-figure-mode .angle-bar-help{height:112px}.diapo.angle-sum-mode.angle-figure-mode .angle-sum-answer{font-size:clamp(1.55rem,7vw,2rem)}}
@media(max-width:800px){.diapo.evolution-mode .stage{padding:7px 7px 12px}.evolution-prompt{font-size:clamp(1.28rem,5.55vw,1.65rem);line-height:1.15;margin-bottom:3px}.evolution-prompt table{font-size:clamp(.94rem,4vw,1.1rem)!important;margin-top:10px!important;margin-bottom:10px!important}.evolution-prompt table td,.evolution-prompt table th{padding-top:13px!important;padding-bottom:13px!important}.evolution-help{height:clamp(145px,24vh,190px);margin:0 auto}.evolution-help-scroll{justify-content:flex-start;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}.evolution-help-scroll .evolution-svg{width:720px;max-width:none;flex:none}.evolution-answer{font-size:clamp(1.72rem,7.6vw,2.25rem);margin-top:2px}.evolution-options{grid-template-columns:1fr;gap:7px;margin-top:4px}.evolution-options .opt{font-size:clamp(.92rem,3.9vw,1.08rem);padding:9px 10px}}
@media(max-width:800px){.diapo.perimeter-mode .stage{padding:5px 7px 10px}.perimeter-prompt{font-size:clamp(1.3rem,5.7vw,1.7rem);line-height:1.13}.perimeter-prompt svg{width:min(100%,365px);height:clamp(220px,36vh,300px);max-height:300px;margin:1px auto}.perimeter-correction-flow{gap:1px;margin-top:1px}.perimeter-formula,.perimeter-calculation{font-size:clamp(1.05rem,4.55vw,1.34rem)}.perimeter-answer{font-size:clamp(1.8rem,8vw,2.35rem)}}
@media(max-width:800px){.diapo.area-mode .stage{padding:6px 7px 11px}.area-prompt{font-size:clamp(1.32rem,5.85vw,1.72rem);margin-bottom:3px}.area-main{height:clamp(215px,35vh,285px)}.area-data{padding:18px 18px;font-size:clamp(1.18rem,5.1vw,1.5rem)}.area-help{margin:2px auto 4px;font-size:clamp(1.05rem,4.55vw,1.32rem);line-height:1.12}.area-answer-line{font-size:clamp(1.85rem,8.2vw,2.45rem)}.area-options{gap:7px;margin-top:2px}.area-options .opt{min-height:50px;font-size:clamp(1rem,4.2vw,1.2rem);padding:10px 11px}.area-correction{margin-top:4px;padding:2px 5px;font-size:clamp(1.05rem,4.45vw,1.3rem)}}
@media(max-width:800px){.diapo.area-mode.correction-visible .area-main{height:clamp(165px,27vh,215px)}.diapo.area-mode.correction-visible .area-prompt{font-size:clamp(1.2rem,5.25vw,1.5rem)}.area-correction-flow{gap:0;margin-top:2px}}
@media(max-width:800px){.diapo.volume-mode .stage{padding:5px 7px 10px}.volume-prompt{font-size:clamp(1.25rem,5.45vw,1.62rem);line-height:1.14;margin-bottom:2px}.volume-prompt svg{height:clamp(190px,32vh,260px);max-height:260px;margin:1px auto}.diapo.volume-mode.correction-visible .volume-prompt{font-size:clamp(1.08rem,4.7vw,1.4rem)}.diapo.volume-mode.correction-visible .volume-prompt svg{height:clamp(145px,23vh,195px);max-height:195px}.volume-correction-flow{gap:4px;margin-top:2px;padding:4px 6px}.volume-formula{margin:1px auto;font-size:clamp(1.35rem,5.8vw,1.75rem);line-height:1.12}.volume-calculation{margin:1px auto;font-size:clamp(1.18rem,5.05vw,1.5rem);line-height:1.12}.volume-answer{font-size:clamp(2rem,8.7vw,2.65rem);margin-top:3px}}
@media(max-width:800px){.diapo.average-mode .stage{padding:7px 6px 12px}.average-prompt{font-size:clamp(1.28rem,5.65vw,1.68rem);margin-bottom:3px}.average-instruction{font-size:clamp(1.08rem,4.65vw,1.34rem);margin:5px auto 3px}.average-data-line{font-size:clamp(1.55rem,7.4vw,2.1rem);margin:2px auto}.average-table-wrap{margin:7px auto 5px}.average-table{font-size:clamp(.9rem,3.85vw,1.08rem)}.average-table th,.average-table td{padding:14px 14px;border-width:1.5px}.average-help-visual{height:clamp(170px,29vh,225px)}.average-answer-line{font-size:clamp(1.65rem,7.6vw,2.2rem);margin-top:4px}.average-options,.average-formula-options{grid-template-columns:1fr!important;gap:7px;margin-top:6px}.average-options .opt,.average-formula-options .opt{font-size:clamp(.92rem,3.9vw,1.08rem);padding:9px 10px}.average-correction{padding:0 5px;font-size:clamp(1.05rem,4.5vw,1.35rem);margin-top:8px}.average-correction>div{display:block;padding:4px 0}.average-step{text-align:center;margin-bottom:3px}}
@media(max-width:800px){.diapo.median-mode .stage{padding:12px 9px 16px}.diapo.median-mode .question{font-size:clamp(1.3rem,5.7vw,1.72rem);line-height:1.18;margin-bottom:17px}.diapo.median-mode .footer{font-size:clamp(1.55rem,7vw,2rem);margin-top:10px}.median-list{gap:.18em .4em;margin:11px auto 13px;font-size:clamp(1.25rem,5.7vw,1.65rem)}.median-table-wrap{margin:11px auto}.median-table{font-size:clamp(.78rem,3.45vw,1rem)}.median-table td{padding:6px 7px;border-width:1.5px}.course-btn{min-height:40px;padding:7px 11px;font-size:.88rem}.course-card{padding:22px 16px 18px;border-radius:18px}.course-title{margin-bottom:15px;font-size:1.55rem}.course-grid{grid-template-columns:1fr;gap:8px}.course-rule{padding:11px 12px;font-size:1rem}}
@media(max-width:800px){.diapo.proportion-mode .stage{padding:7px 7px 12px}.proportion-prompt{font-size:clamp(1.3rem,5.7vw,1.68rem);line-height:1.17;margin-bottom:3px}.proportion-line-desktop{display:none}.proportion-line-mobile{display:block;width:min(100%,400px)}.proportion-help{margin:1px auto 2px}.proportion-answer{font-size:clamp(1.75rem,7.8vw,2.3rem);margin-top:2px}.proportion-options{gap:7px;margin-top:6px}.proportion-options .opt{font-size:clamp(.96rem,4.1vw,1.14rem);padding:9px 10px}.proportion-table-wrap{gap:7px;margin:11px auto;justify-content:flex-start}.proportion-table{font-size:clamp(.92rem,3.9vw,1.1rem)}.proportion-table td{padding:12px 9px;border-width:1.5px}.proportion-table-methods{gap:4px;font-size:.78rem}.proportion-table-method{gap:3px;padding:5px 6px;border-radius:8px}.proportion-bare-table{font-size:clamp(1.42rem,6.2vw,1.78rem)}.proportion-bare-table td{min-width:105px;padding:16px 22px}}
@media(max-width:800px){.fraction-ops-method-card{padding:11px 10px;margin:3px auto;border-radius:14px}.fraction-ops-method-label{margin-bottom:7px;font-size:.92rem}.fraction-ops-method-line{flex-wrap:wrap;gap:6px 9px;font-size:clamp(1.15rem,5.1vw,1.5rem)}.fraction-ops-share{flex-direction:column;gap:2px}.fraction-ops-share-sign{font-size:1.35rem}.fraction-ops-counting .fraction-ops-card{max-width:330px}.fraction-ops-counting .fraction-ops-units{flex-direction:column;gap:2px}.fraction-ops-counting .fraction-ops-band{width:min(100%,285px);flex:none}.fraction-ops-count-result{padding:7px 10px;font-size:.95rem}.diapo.module01-mode .module01-options.options-4{grid-template-columns:repeat(2,minmax(0,1fr))}.diapo.dense-mode .stage{padding:5px 6px 9px}.diapo.dense-mode .question{margin-bottom:5px;font-size:clamp(1.02rem,4.5vw,1.3rem);line-height:1.08}.diapo.dense-mode .question svg{max-height:215px;margin:2px auto}.diapo.dense-mode .footer{margin-top:5px;font-size:clamp(1.25rem,5.8vw,1.75rem)}.diapo.dense-mode .options{gap:5px;margin-top:5px}.diapo.dense-mode .opt{padding:7px 8px;font-size:clamp(.78rem,3.45vw,.98rem);border-width:1.5px;border-radius:10px}.diapo.algorithm-mode .question{font-size:clamp(.92rem,4vw,1.08rem)}.diapo.algorithm-mode .question svg{max-height:135px!important}.diapo.algorithm-mode .question div+br+div svg{max-height:82px!important}}
@media(max-width:800px){.diapo.geometry-choice-mode .stage{padding:5px 7px 9px}.diapo.geometry-choice-mode .question{margin-bottom:2px;font-size:clamp(1.24rem,5.45vw,1.6rem);line-height:1.08}.diapo.geometry-choice-mode .question svg{width:min(100%,375px)!important;max-width:375px!important;max-height:min(39vh,305px)!important;margin:2px auto!important}.diapo.geometry-choice-mode .options{gap:7px;margin-top:4px}.diapo.geometry-choice-mode .opt{min-height:56px;padding:11px 12px;font-size:clamp(1rem,4.3vw,1.2rem);border-width:1.75px;border-radius:13px}}
@media(max-width:800px){.diapo.geometry-long-prompt-mode .question{font-size:clamp(1.08rem,4.7vw,1.36rem)}.diapo.geometry-long-prompt-mode .question svg{max-height:220px!important}.diapo.geometry-long-prompt-mode .opt{min-height:52px;padding:9px 11px}}
@media(max-width:800px){.diapo.trigonometry-mode .stage{padding:4px 6px 8px}.diapo.trigonometry-mode .question{font-size:clamp(1.2rem,5vw,1.48rem)}.trig-question-svg{width:min(100%,390px);max-height:225px;margin:2px auto}.diapo.trigonometry-mode .options{grid-template-columns:1fr;gap:6px;margin-top:4px}.diapo.trigonometry-mode .opt{min-height:45px;padding:8px 10px;font-size:clamp(.94rem,4vw,1.1rem)}.diapo.trigonometry-mode .footer{font-size:clamp(1.75rem,7.5vw,2.35rem)}}
@media(max-width:800px){.diapo.data-mode .stage{padding:5px 6px 9px}.diapo.data-mode .question{margin-bottom:5px;font-size:clamp(1.16rem,5.05vw,1.48rem);line-height:1.1}.diapo.data-mode .question table{font-size:clamp(.88rem,3.75vw,1.06rem)!important}.diapo.data-mode .question table td,.diapo.data-mode .question table th{padding:12px 10px!important}.diapo.data-mode .footer{margin-top:6px;font-size:clamp(1.55rem,6.8vw,2rem)}}
@media(max-width:800px){.slide .question table{max-width:100%;font-size:clamp(.92rem,3.9vw,1.08rem)!important}.slide .question table td,.slide .question table th{padding:14px 14px!important;border-width:1.5px!important}.diapo.coordinate-mode .stage{padding:4px 4px 8px}.diapo.coordinate-mode .question{font-size:clamp(1.18rem,5.2vw,1.5rem);line-height:1.1;margin-bottom:3px}.diapo.coordinate-mode .question svg{width:min(100%,380px)!important;max-width:380px!important;max-height:min(52vh,380px)!important;margin:3px auto!important}.diapo.coordinate-mode .footer{font-size:clamp(1.75rem,7.8vw,2.3rem);margin-top:3px}.diapo.right-angle-mode .question{font-size:clamp(2rem,9vw,2.8rem);margin-bottom:20px}.diapo.right-angle-mode .footer{font-size:clamp(2.1rem,9.5vw,3rem)}}
@media(max-width:800px){.diapo.transformations-mode .stage{padding:4px 4px 8px}.diapo.transformations-mode .question{font-size:clamp(1.12rem,4.9vw,1.42rem);line-height:1.09;margin-bottom:3px}.diapo.transformations-mode .question svg{width:min(100%,390px)!important;max-width:390px!important;max-height:min(49vh,390px)!important;margin:3px auto!important}.diapo.transformations-mode .footer{font-size:clamp(1.6rem,7.2vw,2.15rem);margin-top:3px}.diapo.transformations-mode .options{gap:6px;margin-top:4px}.diapo.transformations-mode .opt{font-size:clamp(.9rem,3.85vw,1.08rem);padding:8px 9px}.course-visual{max-height:175px}.course-rule-wide{grid-column:auto}}
@media(max-width:800px){.diapo>.top{order:2;border-top:1px solid var(--border);border-bottom:0}.diapo>.stage{order:1}}
@media(max-width:800px){.diapo.interactive-mode{--stage-x:7px;--stage-bottom:7px}.diapo.interactive-mode>.top{order:1;height:54px;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);border-top:0;border-bottom:1px solid var(--border);padding:7px max(9px,env(safe-area-inset-right)) 7px max(9px,env(safe-area-inset-left))}.diapo.interactive-mode>.stage{order:2;padding-top:5px}.diapo.interactive-mode>.answer-dock{order:3}.diapo.interactive-mode .keyboard-toggle,.diapo.interactive-mode .fullscreen-btn{width:40px;height:40px;min-height:40px;padding:0}.interactive-summary{grid-column:2;justify-content:center;font-size:.86rem}.interactive-score{padding:5px 8px}.answer-dock{padding:6px max(6px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left))}.answer-body{grid-template-columns:minmax(0,1fr) 154px;justify-content:stretch;gap:5px}.answer-main{height:var(--keypad-height-mobile);min-height:58px}.keypad{grid-template-columns:repeat(var(--key-columns-mobile,6),minmax(0,1fr));gap:4px}.key{min-height:0;padding:4px 2px;border-radius:9px;font-size:1.04rem}.key.utility{font-size:.78rem}.key.utility svg{width:23px;height:23px}.answer-guidance,.answer-feedback{min-height:58px;padding:8px 8px;border-radius:10px;font-size:1.16rem}.feedback-answer{font-size:1em}.answer-kind{padding:0}.answer-dock.keypad-collapsed .answer-main,.answer-dock.qcm-mode .answer-main{height:62px}.dock-actions{grid-template-columns:1fr;width:154px}.dock-action{min-width:0;min-height:58px;padding:7px 5px;font-size:1.03rem}.answer-dock.qcm-mode .answer-body{grid-template-columns:minmax(0,1fr) 184px}.answer-dock.qcm-mode .dock-actions{grid-template-columns:184px;width:184px}.answer-dock.qcm-mode .dock-action{min-width:184px;font-size:1.1rem}.interactive-input-slot{min-height:1.48em;min-width:2.18em;border-radius:.28em}.interactive-polynomial-response{gap:7px 10px;margin-top:7px;font-size:clamp(1.7rem,7.7vw,2.25rem)}.interactive-polynomial-response.term-count-1{font-size:clamp(2.3rem,10vw,3rem)}.interactive-polynomial-response.term-count-2{font-size:clamp(1.95rem,8.8vw,2.65rem)}.interactive-polynomial-term small{font-size:.42em}.interactive-finish{margin:3vh auto 0;padding:22px 15px}.interactive-finish-mark{width:54px;height:54px}.interactive-finish-score{margin-bottom:14px}.interactive-finish-actions{flex-direction:column;gap:8px}.interactive-finish-actions .btn,.interactive-finish-actions .btn.primary{width:min(100%,260px);min-width:0}}
@media(max-width:800px){.multiple-forms-help.multiple-forms-line{height:clamp(245px,39vh,315px)}.multiple-forms-line-desktop{display:none}.multiple-forms-line-mobile{display:block;width:min(100%,390px)!important;height:auto}.fraction-ops-result-separated{margin-top:13px}.fraction-ops-simplification{max-width:360px;margin-bottom:3px;font-size:.88rem;line-height:1.12}.legacy-statement-table-wrap{margin:15px auto 20px}}
@media(max-width:600px){.fullscreen-btn,.diapo.interactive-mode .keyboard-toggle{display:none!important}.diapo:not(.interactive-mode) .top{gap:5px;padding-left:7px;padding-right:7px}.diapo:not(.interactive-mode) .right{gap:6px}.diapo:not(.interactive-mode) .course-btn{width:42px;height:42px;min-height:42px;padding:0;display:inline-grid;place-items:center;border-radius:50%}.diapo:not(.interactive-mode) .course-btn svg{width:21px;height:21px}.diapo:not(.interactive-mode) .course-btn span{display:none}.diapo.interactive-mode .interactive-summary{position:absolute;inset:0;left:0;max-width:none;transform:none;pointer-events:none}.diapo.interactive-mode #interactiveCounter{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);white-space:nowrap}.diapo.interactive-mode .course-btn{position:absolute;left:max(9px,env(safe-area-inset-left));top:50%;transform:translateY(-50%);width:38px;height:38px;min-height:38px;padding:0;display:inline-grid;place-items:center;border:1px solid #efbb8a;border-radius:50%;background:#fffaf5;color:#9e4200;box-shadow:0 1px 4px rgba(11,33,71,.09)}.diapo.interactive-mode .course-btn svg{width:21px;height:21px}.diapo.interactive-mode .course-btn span{display:none}.diapo.interactive-mode .right{position:static}.diapo.interactive-mode .interactive-score{position:absolute;right:max(9px,env(safe-area-inset-right));top:50%;transform:translateY(-50%)}}
@media (hover:none) and (pointer:coarse){.navnums{display:none!important}.mobile-counter{display:block!important}}
@media print{.diapo{--stage-top:20px;--stage-x:20px;--stage-bottom:20px;height:auto;min-height:100vh;overflow:visible}.top{display:none}.stage{min-height:auto;overflow:visible;padding:var(--stage-top) var(--stage-x) var(--stage-bottom)}}
</style>
</head>
<body>
<div class="diapo" id="diapo">
<header class="top">
<div class="left presentation-only"><button class="btn" onclick="prev()">← Précédent</button></div>
<div class="navnums presentation-only" id="navnums"></div>
<div class="mobile-counter presentation-only" id="mobileCounter"></div>
<div class="interactive-summary" id="interactiveSummary"><span id="interactiveCounter"></span></div>
<div class="right"><span class="interactive-score" id="interactiveScore"></span><button class="course-btn" id="courseBtn" type="button" onclick="openCourse()" aria-label="Ouvrir le cours" title="Ouvrir le cours" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.4c2.8-.9 5.3-.45 7.5 1.25v12c-2.2-1.7-4.7-2.15-7.5-1.25zM20.5 5.4c-2.8-.9-5.3-.45-7.5 1.25v12c2.2-1.7 4.7-2.15 7.5-1.25z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6.8v11.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Cours</span></button><button class="btn keyboard-toggle" id="keyboardToggle" type="button" aria-label="Afficher le clavier visuel" aria-pressed="false" title="Afficher le clavier visuel" onclick="toggleKeypad()" hidden><svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 9h1M10 9h1M13.5 9h1M17 9h1M6.5 12.5h1M10 12.5h1M13.5 12.5h1M17 12.5h1M8 16h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><button class="btn fullscreen-btn" type="button" aria-label="Plein écran" title="Plein écran" onclick="toggleFS()"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="btn primary presentation-only" id="nextBtn" onclick="next()">Correction →</button></div>
<div class="progress-track" aria-hidden="true"><span class="progress-fill" id="progressFill"></span></div>
</header>
<main class="stage"><section class="slide" id="slide"></section></main>
<section class="answer-dock" id="answerDock" aria-label="Clavier mathématique" hidden>
  <div class="answer-body">
    <div class="answer-main">
      <div class="keypad" id="keypad"></div>
      <div class="answer-guidance"><span class="answer-kind" id="answerKind"></span></div>
      <div class="answer-feedback" id="answerFeedback" aria-live="polite"></div>
    </div>
    <div class="dock-actions"><button class="dock-action" id="interactiveAction" type="button" onclick="submitInteractive()">Suivant</button></div>
  </div>
</section>
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
</div>
<script>
const seriesBank=${payload};
const experienceMode=${experiencePayload};
const interactiveMode=experienceMode==='interactive';
let seriesIndex=0;
let slides=seriesBank[seriesIndex]||[];
let idx=0;
let corr=false;
let interactiveValues=[];
let interactiveTouched=[];
let activeSlotIndex=0;
let selectedOptions=new Set();
let interactiveLocked=false;
let correctCount=0;
let answeredCount=0;
let interactiveFinished=false;
let advanceTimer=null;
const phoneKeypadMedia=window.matchMedia('(max-width:600px)');
let keypadVisible=false;
let visualShown=slides.map(()=>false);
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
function courseCoordinatesVisual(){return '<svg class="course-visual" viewBox="0 0 390 220" role="img" aria-label="Exemple : M a pour coordonnées moins deux et trois"><defs><marker id="courseArrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#17384d"/></marker></defs><g stroke="#d8e3f4" stroke-width="1">'+[-3,-2,-1,1,2,3].map(function(v){var p=195+v*48;return '<line x1="'+p+'" y1="18" x2="'+p+'" y2="202"/><line x1="20" y1="'+(110-v*28)+'" x2="370" y2="'+(110-v*28)+'"/>';}).join('')+'</g><line x1="18" y1="110" x2="374" y2="110" stroke="#17384d" stroke-width="2" marker-end="url(#courseArrow)"/><line x1="195" y1="204" x2="195" y2="14" stroke="#17384d" stroke-width="2" marker-end="url(#courseArrow)"/><line x1="99" y1="26" x2="99" y2="110" stroke="#e86100" stroke-width="2" stroke-dasharray="6 5"/><line x1="99" y1="26" x2="195" y2="26" stroke="#087a55" stroke-width="2" stroke-dasharray="6 5"/><g transform="translate(99 26)" stroke="#9d2f2f" stroke-width="4" stroke-linecap="round"><line x1="-7" y1="0" x2="7" y2="0"/><line x1="0" y1="-7" x2="0" y2="7"/></g><text x="110" y="20" fill="#9d2f2f" font-size="18" font-weight="800">M</text><text x="99" y="132" fill="#e86100" font-size="16" text-anchor="middle">−2</text><text x="181" y="31" fill="#087a55" font-size="16" text-anchor="end">3</text><text x="195" y="218" fill="#17384d" font-size="18" font-weight="850" text-anchor="middle">M(−2 ; 3)</text></svg>';}
function courseFractionVisual(){return '<svg class="course-visual" viewBox="0 0 390 150" role="img" aria-label="Un tiers devient deux sixièmes"><text x="45" y="25" fill="#17384d" font-size="16" font-weight="850">1/3</text><g transform="translate(45 38)"><rect width="270" height="38" fill="#f5eaff" stroke="#7042a3" stroke-width="3"/><rect width="90" height="38" fill="#d9b8ff"/><path d="M90 0V38M180 0V38" stroke="#7042a3" stroke-width="2"/></g><path d="M45 99H315" stroke="#7042a3" stroke-width="3"/><path d="M90 82V120M135 82V120M180 82V120M225 82V120M270 82V120" stroke="#7042a3" stroke-width="1.8"/><rect x="45" y="82" width="90" height="38" fill="#d9b8ff" opacity=".82"/><text x="332" y="109" fill="#087a55" font-size="18" font-weight="900">2/6</text><path d="M333 54L350 72L333 90" fill="none" stroke="#e86100" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
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
function courseTrigVisual(){return '<svg class="course-visual course-trig-visual" viewBox="0 0 470 235" role="img" aria-label="Triangle ABC rectangle en B avec les côtés repérés par rapport à l’angle A"><polygon points="42,194 318,194 318,42" fill="#eef6ff" stroke="#17384d" stroke-width="3"/><path d="M318 174H298V194" fill="none" stroke="#e86100" stroke-width="4"/><path d="M82 194A40 40 0 0 0 77 173" fill="none" stroke="#e86100" stroke-width="4"/><text x="22" y="216" font-size="22" font-style="italic">A</text><text x="326" y="216" font-size="22" font-style="italic">B</text><text x="326" y="40" font-size="22" font-style="italic">C</text><text x="178" y="222" text-anchor="middle" fill="#0879d0" font-size="17" font-weight="900">côté adjacent</text><text x="360" y="120" text-anchor="middle" fill="#b23a48" font-size="17" font-weight="900">côté opposé</text><text x="178" y="102" text-anchor="middle" fill="#7651b5" font-size="17" font-weight="900" transform="rotate(-29 178 102)">hypoténuse</text><text x="410" y="70" text-anchor="middle" fill="#17384d" font-size="17" font-weight="900">par rapport</text><text x="410" y="94" text-anchor="middle" fill="#17384d" font-size="17" font-weight="900">à l’angle Â</text></svg>';}
function courseConversionVisual(kind){
 if(kind==='duration') return '<div class="duration-course-discs" role="img" aria-label="Équivalences entre heures, minutes et secondes"><span class="duration-equivalence-pair"><span class="duration-disc duration-disc-hour">1 h</span><b>=</b><span class="duration-disc duration-disc-minute">60 min</span></span><span class="duration-equivalence-pair"><span class="duration-disc duration-disc-minute">1 min</span><b>=</b><span class="duration-disc duration-disc-second">60 s</span></span></div>';
 const count=kind==='area'?2:(kind==='volume'?3:1),labels=kind==='area'?['m²','dm²','cm²']:(kind==='volume'?['m³','dm³','cm³']:['m','dm','cm']);
 let cells='';labels.forEach(function(label,index){cells+='<text x="'+(72+index*128)+'" y="28" text-anchor="middle" fill="#17384d" font-size="18" font-weight="850">'+label+'</text>';for(let i=0;i<count;i++)cells+='<rect x="'+(24+index*128+i*(96/count))+'" y="42" width="'+(96/count)+'" height="58" fill="'+(index===1?'#fff0df':'#eef6ff')+'" stroke="#17384d" stroke-width="2"/>';});
 return '<svg class="course-visual" viewBox="0 0 420 125" role="img" aria-label="Tableau de conversion">'+cells+'<text x="210" y="121" text-anchor="middle" fill="#087a55" font-size="16" font-weight="850">'+count+' position'+(count>1?'s':'')+' par unité</text></svg>';
}
const courseCatalog={
  divisibility:{title:'Critères de divisibilité',rules:[
    ['Divisible par 2','Son chiffre des unités est 0, 2, 4, 6 ou 8.<span class="course-example">Exemple : 1 438 se termine par 8, donc il est divisible par 2.</span>'],
    ['Divisible par 3','La somme de ses chiffres est divisible par 3.<span class="course-example">Exemple : 273 → 2 + 7 + 3 = 12, donc 273 est divisible par 3.</span>'],
    ['Divisible par 5','Son chiffre des unités est 0 ou 5.<span class="course-example">Exemple : 1 245 se termine par 5, donc il est divisible par 5.</span>'],
    ['Divisible par 9','La somme de ses chiffres est divisible par 9.<span class="course-example">Exemple : 450 → 4 + 5 + 0 = 9, donc 450 est divisible par 9.</span>']
  ]},
  fraction_mul_div:{title:'Multiplier et diviser des fractions',rules:[
    ['Multiplier','On multiplie les numérateurs entre eux et les dénominateurs entre eux.<span class="course-example"><span class="course-equation">'+courseFraction(2,3)+' × '+courseFraction(5,4)+' = '+courseFraction(10,12)+' = '+courseFraction(5,6)+'</span></span>'],
    ['Simplifier avant','On peut simplifier en croix avant de multiplier.<span class="course-example"><span class="course-equation">'+courseFraction(3,4)+' × '+courseFraction(8,5)+' = '+courseFraction(3,1)+' × '+courseFraction(2,5)+' = '+courseFraction(6,5)+'</span></span>'],
    ['Diviser : les trois gestes','On garde la première fraction, on remplace ÷ par ×, puis on inverse seulement le diviseur.<span class="course-example"><span class="course-equation">'+courseFraction(2,3)+' ÷ '+courseFraction(5,4)+' → '+courseFraction(2,3)+' × '+courseFraction(4,5)+' = '+courseFraction(8,15)+'</span></span>'],
    ['Avec un entier','On écrit l’entier comme une fraction de dénominateur 1 avant d’appliquer la même règle.<span class="course-example"><span class="course-equation">'+courseFraction(2,5)+' ÷ 3 = '+courseFraction(2,5)+' × '+courseFraction(1,3)+' = '+courseFraction(2,15)+'</span></span>'],
    ['Comprendre une fraction-unité','On peut aussi compter combien de parts entrent dans le nombre.<span class="course-example"><span class="course-equation">2 ÷ '+courseFraction(1,4)+' = 8</span>Il y a huit quarts dans 2.</span>']
  ]},
  perimeter_formulas:{title:'Formules de périmètres',rules:[
    ['Rectangle','P = 2 × (longueur + largeur)<span class="course-example">Exemple : P = 2 × (8 + 3) = 22 cm.</span>'],
    ['Carré','P = 4 × côté<span class="course-example">Exemple : P = 4 × 5 = 20 cm.</span>'],
    ['Polygone','On additionne les longueurs de tous les côtés.<span class="course-example">Exemple : 4 + 6 + 5 = 15 cm.</span>'],
    ['Polygone régulier','P = nombre de côtés × longueur d’un côté<span class="course-example">Exemple : un hexagone de côté 3 cm a pour périmètre 6 × 3 = 18 cm.</span>'],
    ['Disque','P = 2 × π × rayon, ou P = π × diamètre<span class="course-example">Exemple : avec r = 4 cm, P ≈ 2 × 3,14 × 4 = 25,12 cm.</span>']
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
  median:{title:'Médiane et étendue',rules:[
    ['Avant de commencer','Ranger les valeurs dans l’ordre croissant.<span class="course-example">Exemple : 8 ; 3 ; 5 → 3 ; 5 ; 8.</span>'],
    ['Effectif impair','La médiane est la valeur centrale.<span class="course-example"><span class="median-course-values"><span>3</span> ; <span class="median-middle">5</span> ; <span>8</span></span>La valeur du milieu est 5.</span>'],
    ['Effectif pair','On repère les deux valeurs centrales, puis on calcule leur moyenne.<span class="course-example"><span class="median-course-values"><span>2</span> ; <span class="median-middle">4</span> ; <span class="median-middle">7</span> ; <span>9</span></span>Médiane = (4 + 7) ÷ 2 = 5,5.</span>'],
    ['Étendue','Étendue = maximum − minimum.<span class="course-example">Pour 3 ; 5 ; 8 : étendue = 8 − 3 = 5.</span>']
  ]}
};
Object.assign(courseCatalog,{
  place_value_shift:{title:'Multiplier ou diviser par 10, 100 et 1 000',rules:[
    ['Idée essentielle','La virgule reste fixe dans le tableau de numération : ce sont les chiffres qui changent de colonne.'],
    ['Multiplier','× 10 : un rang vers la gauche ; × 100 : deux rangs ; × 1 000 : trois rangs.<span class="course-example">Exemple : 3,47 × 100 = 347.</span>'],
    ['Diviser','÷ 10 : un rang vers la droite ; ÷ 100 : deux rangs ; ÷ 1 000 : trois rangs.<span class="course-example">Exemple : 52 ÷ 1 000 = 0,052.</span>'],
    ['Écriture mathématique','Multiplier par 10ⁿ décale chaque chiffre de n rangs vers une valeur de position plus grande ; diviser par 10ⁿ fait l’inverse.']
  ]},
  pythagoras:{title:'Théorème de Pythagore',rules:[
    ['Condition','On utilise le théorème de Pythagore seulement dans un triangle rectangle. L’hypoténuse est le côté opposé à l’angle droit et le plus long côté.'+coursePythagorasVisual()],
    ['Égalité','Si ABC est rectangle en B, alors <span class="course-equation">AC² = AB² + BC²</span>. Le carré de l’hypoténuse est la somme des carrés des deux autres côtés.'],
    ['Chercher l’hypoténuse','On additionne les deux carrés, puis on prend la racine carrée.<span class="course-example">3² + 4² = 25, donc l’hypoténuse mesure √25 = 5.</span>'],
    ['Chercher un côté de l’angle droit','On soustrait son carré au carré de l’hypoténuse.<span class="course-example">13² − 5² = 144, donc le côté mesure √144 = 12.</span>'],
    ['Réciproque','Pour prouver qu’un triangle est rectangle, on compare le carré du plus long côté à la somme des carrés des deux autres.']
  ]},
  fraction_decimal:{title:'Passer d’une fraction à un nombre décimal',rules:[
    ['Comprendre','Une fraction représente une division : '+courseFraction('a','b')+' = a ÷ b.'],
    ['Dénominateur 10 ou 100','Les dixièmes et les centièmes se lisent directement avec la numération décimale.<span class="course-example"><span class="course-equation">'+courseFraction(7,10)+' = 0,7 &nbsp; et &nbsp; '+courseFraction(23,100)+' = 0,23</span></span>'],
    ['Rendre irréductible','On divise le numérateur et le dénominateur par un même diviseur commun.<span class="course-example"><span class="course-equation">'+courseFraction(60,100)+' = '+courseFraction(3,5)+'</span></span>']
  ]},
  decimal_numbers:{title:'Comparer et calculer avec des décimaux',rules:[
    ['Comparer','On compare d’abord les parties entières, puis les dixièmes, les centièmes… On peut ajouter des zéros sans changer le nombre.<span class="course-example">4,7 = 4,70 et 4,70 &gt; 4,68.</span>'],
    ['Nombres négatifs','Parmi deux nombres négatifs, celui qui est le plus proche de 0 est le plus grand.<span class="course-example">−2,4 &gt; −3,1.</span>'],
    ['Poser un calcul','Pour additionner ou soustraire, on aligne les virgules. Avant de calculer, on estime l’ordre de grandeur du résultat.']
  ]},
  fraction_ops:{title:'Simplifier, comparer et additionner des fractions',rules:[
    ['Simplifier','On divise le numérateur et le dénominateur par un même nombre non nul.<span class="course-example"><span class="course-equation">'+courseFraction(18,24)+' = '+courseFraction('18 ÷ 6','24 ÷ 6')+' = '+courseFraction(3,4)+'</span></span>'],
    ['Comparer','Même dénominateur : le plus grand numérateur donne la plus grande fraction. Même numérateur positif : le plus petit dénominateur donne la plus grande fraction.'],
    ['Additionner ou soustraire','Il faut d’abord des parts de même taille, donc un dénominateur commun. On multiplie alors <strong>le numérateur et le dénominateur par le même nombre</strong>.'+courseFractionVisual()+'<span class="course-example"><span class="course-equation">'+courseFraction(1,3)+' = '+courseFraction('1 × <span class="course-multiplier">2</span>','3 × <span class="course-multiplier">2</span>')+' = '+courseFraction(2,6)+'</span><span class="course-equation">'+courseFraction(2,6)+' + '+courseFraction(1,6)+' = '+courseFraction(3,6)+' = '+courseFraction(1,2)+'</span></span>']
  ]},
  equivalent_forms:{title:'Fractions, décimaux et pourcentages',rules:[
    ['Pourcentage','p % signifie « p sur 100 » : p % = '+courseFraction('p',100)+'.'],
    ['Fraction vers décimal','Une fraction est une division. On peut aussi chercher une fraction équivalente de dénominateur 10 ou 100.<span class="course-example"><span class="course-equation">'+courseFraction(3,5)+' = '+courseFraction(6,10)+' = 0,6</span></span>'],
    ['Décimal vers pourcentage','On cherche le nombre de centièmes.<span class="course-example">0,37 = 37 centièmes = 37 %.</span>']
  ]},
  scientific_notation:{title:'Notation scientifique',rules:[
    ['Forme attendue','Un nombre en notation scientifique s’écrit a × 10ⁿ avec 1 ≤ a &lt; 10 et n entier.'],
    ['Trouver a','On place la virgule juste après le premier chiffre non nul.'],
    ['Trouver n','On compte les déplacements de la virgule : grand nombre → exposant positif ; petit nombre → exposant négatif.<span class="course-example">45 000 = 4,5 × 10⁴ et 0,0032 = 3,2 × 10⁻³.</span>']
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
    ['Regrouper','On additionne seulement les termes de même nature : les x² ensemble, les x ensemble et les nombres ensemble.'],
    ['Attention','x² et x ne sont pas des termes semblables : on ne peut pas les regrouper.'],
    ['Exemple','<span class="course-equation">3x + 5 − x + 2 = 2x + 7</span><span class="course-example">Les tuiles de même forme représentent des termes de même nature.</span>']
  ]},
  substitution:{title:'Calculer une expression pour une valeur donnée',rules:[
    ['Remplacer','On remplace chaque lettre par sa valeur, entre parenthèses si elle est négative.'],
    ['Respecter les priorités','On calcule d’abord les parenthèses et les puissances, puis les multiplications, puis les additions et soustractions.'],
    ['Exemple','Pour x = −3 : <span class="course-equation">2x² = 2 × (−3)² = 2 × 9 = 18</span>.']
  ]},
  expand_factor:{title:'Développer ou factoriser',rules:[
    ['Développer','On distribue le facteur à chaque terme de la parenthèse : k(a + b) = ka + kb.'],
    ['Factoriser','On repère le facteur commun et on le place devant une parenthèse : ka + kb = k(a + b).'],
    ['Exemple','<span class="course-equation">3(x + 4) = 3x + 12</span> et <span class="course-equation">5x + 15 = 5(x + 3)</span>.']
  ]},
  equations:{title:'Résoudre une équation',rules:[
    ['But','Résoudre, c’est trouver la valeur de l’inconnue qui rend l’égalité vraie.'],
    ['Conserver l’égalité','On effectue la même opération dans les deux membres. On défait les opérations dans l’ordre inverse.'],
    ['Exemple','<span class="course-equation">3x + 5 = 17 → 3x = 12 → x = 4</span><span class="course-example">Vérification : 3 × 4 + 5 = 17.</span>']
  ]},
  number_line:{title:'Lire une abscisse',rules:[
    ['Trouver le pas','On calcule l’écart entre deux graduations repérées, puis on le partage par le nombre d’intervalles.'],
    ['Se déplacer','Vers la droite, les nombres augmentent ; vers la gauche, ils diminuent.'],
    ['Vérifier','L’abscisse lue doit être cohérente avec les repères voisins et avec le signe du nombre.']
  ]},
  coordinates:{title:'Lire les coordonnées d’un point',rules:[
    ['Exemple complet','Le point M a pour coordonnées M(−2 ; 3). La projection verticale donne l’abscisse −2 ; la projection horizontale donne l’ordonnée 3.'+courseCoordinatesVisual()],
    ['Ordre','Les coordonnées s’écrivent (abscisse ; ordonnée) : d’abord x, puis y.<span class="course-example"><strong>Astuce :</strong> dans l’alphabet, le <strong>A</strong> d’<strong>abscisse</strong> vient avant le <strong>O</strong> d’<strong>ordonnée</strong>.</span>'],
    ['Lire x','Depuis le point, on rejoint verticalement l’axe horizontal pour lire l’abscisse.'],
    ['Lire y','On rejoint horizontalement l’axe vertical pour lire l’ordonnée.<span class="course-example">Un point sur l’axe des abscisses a une ordonnée égale à 0.</span>']
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
    ['Conditions','Les points sont alignés sur deux droites sécantes et les deux autres droites sont parallèles.'],
    ['Rapports correspondants','On écrit les longueurs dans le même ordre : '+courseFraction('AD','AB')+' = '+courseFraction('AE','AC')+' = '+courseFraction('DE','BC')+'.'],
    ['Calcul','On choisit deux rapports contenant la longueur cherchée et trois longueurs connues, puis on résout l’égalité.<span class="course-example">Toujours vérifier que le résultat est cohérent avec la figure.</span>']
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
  probability:{title:'Calculer une probabilité en équiprobabilité',rules:[
    ['Compter','Quand toutes les issues ont la même chance : probabilité = nombre d’issues favorables ÷ nombre total d’issues.'],
    ['Écriture','Une probabilité est comprise entre 0 et 1. 0 signifie impossible ; 1 signifie certain.'],
    ['Exemple','Sur un dé équilibré, obtenir un nombre pair : '+courseFraction(3,6)+' = '+courseFraction(1,2)+'.']
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
  read_data:{title:'Lire un tableau ou un diagramme',rules:[
    ['Identifier','Lire le titre, les grandeurs, les unités et la légende avant les valeurs.'],
    ['Croiser les informations','Dans un tableau, suivre la bonne ligne et la bonne colonne. Dans un graphique, utiliser les graduations des axes.'],
    ['Calculer seulement si nécessaire','« Au total » demande une addition ; « de plus » demande une différence ; un pictogramme demande de tenir compte de la valeur d’un symbole.']
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
 const p=Number(context&&context.percent||0),increase=!context||context.direction!=='decrease';
 const sign=increase?'+':'−',coefficient=courseNumber(1+(increase?1:-1)*p/100),verb=increase?'augmentation':'diminution';
 const amount=courseNumber(200*p/100),result=courseNumber(200+(increase?1:-1)*200*p/100);
 return {title:(increase?'Augmenter':'Diminuer')+' de '+p+' %',rules:[
   ['1. Calculer la variation',p+' % de la valeur initiale = '+courseFraction(p,100)+' × valeur initiale.'],
   ['2. Obtenir la nouvelle valeur','Nouvelle valeur = valeur initiale '+sign+' variation.'],
   ['Coefficient multiplicateur','On peut aussi multiplier directement par '+coefficient+'.<span class="course-example">Exemple : '+verb+' de '+p+' % sur 200 → variation = '+amount+' ; nouvelle valeur = '+result+'.</span>']
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
 if(!calculator) return {title:'Trigonométrie sans calculatrice',rules:[
   ['Condition','On utilise ces rapports dans un <strong>triangle rectangle</strong><br>Commence toujours par repérer l’angle droit et l’angle étudié.'+visual],
   ['Nommer les côtés','L’hypoténuse est opposée à l’angle droit. Par rapport à l’angle étudié, l’autre côté qui touche l’angle est adjacent ; celui d’en face est opposé.'],
   ['Les trois rapports','<span class="course-equation">cos(Â) = '+courseFraction('adjacent','hypoténuse')+'</span> · <span class="course-equation">sin(Â) = '+courseFraction('opposé','hypoténuse')+'</span> · <span class="course-equation">tan(Â) = '+courseFraction('opposé','adjacent')+'</span>.'],
   ['Pourquoi ces rapports fonctionnent','Des triangles rectangles qui ont le même angle aigu sont semblables : leurs dimensions changent, mais les rapports entre côtés correspondants restent identiques.'],
   ['Choisir la méthode','Deux côtés connus et un troisième côté cherché : Pythagore. Un angle aigu et un côté connus : trigonométrie. Deux côtés pour chercher un angle : trigonométrie inverse. Trois côtés pour vérifier l’angle droit : réciproque de Pythagore. Sans angle droit ni données suffisantes : aucune de ces méthodes directement.']
 ]};
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
function courseForSlide(slide){
 if(!slide||!slide.courseKind) return null;
 if(slide.courseKind==='fraction_quantity_percent') return fractionQuantityCourse(slide.courseContext||{});
 if(slide.courseKind==='percent_change') return percentChangeCourse(slide.courseContext||{});
 if(slide.courseKind==='conversions') return conversionCourse(slide.courseContext||{});
 if(slide.courseKind==='trigonometry_basics') return trigonometryCourse(slide.courseContext||{},false);
 if(slide.courseKind==='trigonometry_calculator') return trigonometryCourse(slide.courseContext||{},true);
 if(slide.courseKind==='area_formulas') return contextualAreaCourse(slide.courseContext||{});
 if(slide.courseKind==='volume_formulas') return contextualVolumeCourse(slide.courseContext||{});
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
   'module01-mode':['dnb_01'],'place-value-mode':['dnb_02b'],'fraction-ops-mode':['dnb_03','dnb_03b'],'fraction-percent-mode':['dnb_04'],
   'multiple-forms-mode':['dnb_05'],'scientific-mode':['dnb_06'],'squares-mode':['dnb_07'],
   'relation-mode':['dnb_09'],'reduction-mode':['dnb_10'],'substitution-mode':['dnb_11'],
   'equation-mode':['dnb_13'],'numberline-mode':['dnb_14'],'geometry-choice-mode':['dnb_16','dnb_17'],'angle-sum-mode':['dnb_18'],
   'conversion-mode':['dnb_19'],'solids-mode':['dnb_20'],'perimeter-mode':['dnb_21'],'area-mode':['dnb_22'],'volume-mode':['dnb_23'],'average-mode':['dnb_30'],
   'median-mode':['dnb_31'],'proportion-mode':['dnb_34'],'evolution-mode':['dnb_35'],'data-mode':['dnb_28','dnb_29'],
   'algorithm-mode':['dnb_37'],'coordinate-mode':['dnb_15'],'transformations-mode':['dnb_27'],'trigonometry-mode':['dnb_26','dnb_26b']
 };
 Object.entries(map).forEach(entry=>diapo.classList.toggle(entry[0],entry[1].includes(moduleId)));
 diapo.classList.toggle('dense-mode',['dnb_15','dnb_24','dnb_25','dnb_26','dnb_26b','dnb_32','dnb_33','dnb_36','dnb_37'].includes(moduleId));
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
   slides.forEach((s,i)=>{const b=document.createElement('button');b.className='navnum '+(i===idx?'active':'');b.textContent=i+1;b.onclick=()=>{idx=i;corr=false;render();};nav.appendChild(b);});
 }
 const mobileCounter=document.getElementById('mobileCounter');
 if(mobileCounter) mobileCounter.textContent=(idx+1)+' sur '+slides.length;
 const progress=document.getElementById('progressFill');
 if(progress) progress.style.width=((interactiveFinished?1:(idx+1)/slides.length)*100)+'%';
 const interactiveCounter=document.getElementById('interactiveCounter');
 const interactiveScore=document.getElementById('interactiveScore');
 const interactiveSummary=document.getElementById('interactiveSummary');
 if(interactiveSummary) interactiveSummary.hidden=interactiveFinished;
 if(interactiveCounter) interactiveCounter.textContent=interactiveFinished?'':'Question '+(idx+1)+' / '+slides.length;
 if(interactiveScore){interactiveScore.hidden=interactiveFinished;interactiveScore.textContent=interactiveFinished?'':'✓ '+correctCount;}
 const diapo=document.getElementById('diapo');
 diapo.classList.toggle('interactive-mode',interactiveMode);
 diapo.classList.toggle('correction-visible',corr);
 setModuleClasses(diapo,current.moduleId);
 diapo.classList.toggle('right-angle-mode',current.moduleId==='dnb_17'&&[3,4].includes(Number(current.questionNumber)));
 diapo.classList.toggle('angle-figure-mode',current.moduleId==='dnb_18'&&Number(current.questionNumber)===9);
 diapo.classList.toggle('area-formula-mode',current.moduleId==='dnb_22'&&Number(current.questionNumber)===18);
 diapo.classList.toggle('proportion-table-mode',current.moduleId==='dnb_34'&&[2,5,11].includes(Number(current.questionNumber)));
 diapo.classList.toggle('geometry-long-prompt-mode',(current.moduleId==='dnb_16'&&[7,10].includes(Number(current.questionNumber)))||(current.moduleId==='dnb_17'&&[5,6].includes(Number(current.questionNumber))));
 closeCourse();
 closeEquationDetail();
 const courseBtn=document.getElementById('courseBtn');
 if(courseBtn) courseBtn.hidden=interactiveFinished||!current.courseKind;
 diapo.classList.toggle('has-course',!interactiveFinished&&!!current.courseKind);
 const slide=document.getElementById('slide');
 if(interactiveFinished){
   const newSeriesButton=seriesBank.length>1?'<button class="btn primary" type="button" onclick="startNextSeries()">Nouvelle série</button>':'';
   slide.innerHTML='<div class="interactive-finish"><div class="interactive-finish-mark">✓</div><h2>Série terminée</h2><p>Tu as répondu aux '+slides.length+' questions.</p><div class="interactive-finish-score">'+correctCount+' / '+slides.length+'</div><div class="interactive-finish-actions"><button class="btn" type="button" onclick="restartInteractive()">Recommencer</button>'+newSeriesButton+'</div></div>';
   document.getElementById('answerDock').hidden=true;
   const keyboardToggle=document.getElementById('keyboardToggle');if(keyboardToggle) keyboardToggle.hidden=true;
   return;
 }
 const showVisual=current.canRevealVisual&&visualShown[idx];
 const content=corr
   ? (showVisual?current.visualCorrectionHtml:current.correctionHtml)
   : (showVisual?current.visualQuestionHtml:current.questionHtml);
 slide.innerHTML=content;
 tuneRenderedGeometry(current,slide);
 setupPlaceValueTools();setupConversionTools();setupFractionProductTools();
 if(current.canRevealVisual&&!showVisual){
   const placeholder=slide.querySelector('.visual-placeholder');
   if(placeholder) placeholder.innerHTML='<button class="btn" onclick="revealVisual()">Afficher l’aide</button>';
 }
 if(interactiveMode){
   setupInteractiveSlide(current);
 }else{
   const nextBtn=document.getElementById('nextBtn');
   const finished=corr&&idx===slides.length-1;
   nextBtn.textContent=finished?'Fin du questionnaire':(corr?'Suivant →':'Correction →');
   nextBtn.disabled=finished;
   requestAnimationFrame(fitNavNumbers);
 }
}
function setupInteractiveSlide(current){
 const dock=document.getElementById('answerDock');
 const spec=current.interactiveSpec;
 dock.hidden=false;
 dock.classList.toggle('qcm-mode',spec.kind==='qcm'||spec.kind==='grid-point');
 dock.classList.toggle('locked',interactiveLocked);
 const kind=document.getElementById('answerKind');
 if(kind){
   if(spec.kind==='qcm') kind.textContent=spec.multiple?'Plusieurs réponses':'Une seule réponse';
   else if(spec.kind==='grid-point') kind.textContent='Clique sur le quadrillage';
   else if(spec.layout==='fraction') kind.textContent='Numérateur / dénominateur';
   else if(spec.layout==='polynomial') kind.textContent='Coefficients';
   else kind.textContent=(spec.slots&&spec.slots.length>1)?spec.slots.length+' cases':'Réponse';
 }
 const options=[...document.querySelectorAll('#slide .opt')];
 if(spec.kind==='qcm'){
   options.forEach((option,index)=>{
     option.dataset.optionIndex=String(index);
     option.setAttribute('role','button');
     option.setAttribute('tabindex',interactiveLocked?'-1':'0');
     option.classList.toggle('selected',selectedOptions.has(index));
     option.classList.toggle('wrong-choice',interactiveLocked&&selectedOptions.has(index)&&!option.classList.contains('correct'));
     if(!interactiveLocked){
       option.onclick=()=>toggleInteractiveOption(index);
       option.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleInteractiveOption(index);}};
     }
   });
 }else if(spec.kind==='grid-point'){
   ensureInteractiveEntryState(spec);setupGridPointInteraction(spec);
 }else if(!interactiveLocked){
   ensureInteractiveEntryState(spec);
   injectInteractiveResponse(spec);
 }
 renderInteractiveKeypad(spec);
 applyKeypadVisibility(spec);
 updateInteractiveControls();
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
function setupPlaceValueTools(){
 document.querySelectorAll('.place-value-tool').forEach(tool=>{
   const grid=tool.querySelector('.place-value-grid'),bar=tool.querySelector('.place-value-drag-bar'),strip=tool.querySelector('.place-value-strip');
   if(!grid||!bar||!strip||bar.dataset.ready==='1')return;
   bar.dataset.ready='1';
   const base=String(tool.dataset.baseDigits||'').split('|'),stripDigits=[...strip.querySelectorAll('.place-value-strip-digit')],pad=3,columnCount=7;
   let shift=Number(tool.dataset.initialShift)||0,step=1,startX=0,startPx=0,currentPx=0;
   const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
   const displayForShift=value=>{
     const mapped=Array(columnCount).fill('');
     for(let windowIndex=0;windowIndex<columnCount;windowIndex++){
       const source=windowIndex+value;
       mapped[windowIndex]=source>=0&&source<columnCount?(base[source]||''):'';
     }
     const nonEmpty=[];mapped.forEach((digit,index)=>{if(digit!=='')nonEmpty.push(index);});
     const display=Array(columnCount).fill(''),ghost=Array(columnCount).fill(false);
     if(nonEmpty.length){
       let left=nonEmpty[0],right=nonEmpty[nonEmpty.length-1];
       while(left<3&&mapped[left]==='0'&&nonEmpty.some(index=>index>left))left++;
       const leftLimit=left<=3?left:3,rightLimit=right>3?right:3;
       for(let index=leftLimit;index<=rightLimit;index++){
         if(mapped[index]===''){display[index]='0';ghost[index]=true;}else display[index]=mapped[index];
       }
     }
     return {display,ghost};
   };
   const renderDigits=value=>{
     const result=displayForShift(value);
     stripDigits.forEach(node=>{node.textContent='';node.classList.remove('ghost-zero','is-units-digit');});
     result.display.forEach((digit,windowIndex)=>{
       const stripIndex=pad+windowIndex+value,node=stripDigits[stripIndex];if(!node)return;
       node.textContent=digit;node.classList.toggle('ghost-zero',result.ghost[windowIndex]);node.classList.toggle('is-units-digit',windowIndex===3);
     });
   };
   const setTransforms=(px,snap=false)=>{
     bar.style.transition=snap?'transform .16s ease':'none';strip.style.transition=snap?'transform .16s ease':'none';
     bar.style.transform='translateX('+px+'px)';strip.style.transform='translateX('+(-pad*step+px)+'px)';currentPx=px;
   };
   const apply=(value,snap=true)=>{
     shift=clamp(Math.round(value),-3,3);renderDigits(shift);setTransforms(-shift*step,snap);bar.setAttribute('aria-valuenow',String(shift));
   };
   const refresh=()=>{step=grid.clientWidth/columnCount;apply(shift,false);};
   requestAnimationFrame(refresh);
   bar.addEventListener('pointerdown',event=>{event.preventDefault();refresh();startX=event.clientX;startPx=currentPx;bar.setPointerCapture(event.pointerId);});
   bar.addEventListener('pointermove',event=>{if(!bar.hasPointerCapture(event.pointerId))return;const px=clamp(startPx+(event.clientX-startX),-3*step,3*step),next=clamp(Math.round(-px/step),-3,3);if(next!==shift){shift=next;renderDigits(shift);bar.setAttribute('aria-valuenow',String(shift));}setTransforms(px,false);});
   const end=event=>{if(!bar.hasPointerCapture(event.pointerId))return;bar.releasePointerCapture(event.pointerId);apply(shift,true);};
   bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
   bar.addEventListener('keydown',event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();refresh();apply(shift+(event.key==='ArrowLeft'?1:-1),true);});
 });
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
     event.preventDefault();refresh();dragging=true;startX=event.clientX;startPx=currentPx;cursor.setPointerCapture(event.pointerId);
   });
   cursor.addEventListener('pointermove',event=>{
     if(!dragging||!cursor.hasPointerCapture(event.pointerId))return;
     const minPx=(unitSlots-1)*slotWidth,maxPx=(totalSlots-1)*slotWidth;
     setCursor(clamp(startPx+(event.clientX-startX),minPx,maxPx),false);
   });
   const end=event=>{
     if(!dragging||!cursor.hasPointerCapture(event.pointerId))return;
     dragging=false;cursor.releasePointerCapture(event.pointerId);
     const rect=grid.getBoundingClientRect();
     unit=clamp(Math.floor((event.clientX-rect.left)/rect.width*units),0,units-1);
     apply(true,true);
   };
   cursor.addEventListener('pointerup',end);
   cursor.addEventListener('pointercancel',event=>{if(!dragging)return;dragging=false;try{cursor.releasePointerCapture(event.pointerId);}catch(_){ }apply(true,true);});
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
     if(tool.dataset.correction==='1')return;event.preventDefault();const denominator=!!event.target.closest('.fraction-product-den-handle');axis.setPointerCapture(event.pointerId);
     const update=moveEvent=>{const rect=axis.getBoundingClientRect(),ratio=clamp(vertical?(moveEvent.clientY-rect.top)/rect.height:(moveEvent.clientX-rect.left)/rect.width,0,1);if(vertical){if(denominator){leftDen=denominatorFromRatio(ratio);leftNum=Math.min(leftNum,leftDen);}else leftNum=Math.round(ratio*leftDen);}else{if(denominator){topDen=denominatorFromRatio(ratio);topNum=Math.min(topNum,topDen);}else topNum=Math.round(ratio*topDen);}render();};
     update(event);const move=moveEvent=>update(moveEvent),end=endEvent=>{try{axis.releasePointerCapture(endEvent.pointerId);}catch(error){}axis.removeEventListener('pointermove',move);axis.removeEventListener('pointerup',end);axis.removeEventListener('pointercancel',end);};axis.addEventListener('pointermove',move);axis.addEventListener('pointerup',end);axis.addEventListener('pointercancel',end);
   });
   topAxis.addEventListener('pointerdown',startDrag(topAxis,false));leftAxis.addEventListener('pointerdown',startDrag(leftAxis,true));
   topAxis.addEventListener('keydown',event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();topNum+=event.key==='ArrowRight'?1:-1;render();});
   leftAxis.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();leftNum+=event.key==='ArrowDown'?1:-1;render();});
   render();
 });
}
function resetInteractiveEntryState(spec){
 const slots=spec&&Array.isArray(spec.slots)?spec.slots:[];
 interactiveValues=slots.map(slot=>String(slot.initialValue===undefined?'':slot.initialValue));
 interactiveTouched=slots.map(()=>false);
 activeSlotIndex=0;
}
function ensureInteractiveEntryState(spec){
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
 wrapper.append(document.createTextNode('= '));
 spec.slots.forEach((slot,index)=>{
   if(index){const separator=document.createElement('span');separator.className='interactive-polynomial-separator';separator.dataset.beforeSlot=String(index);separator.textContent='+';wrapper.append(separator);}
   const term=document.createElement('span');term.className='interactive-polynomial-term';
   term.append(makeInteractiveSlot(index));
   if(slot.term==='x2') term.append(document.createTextNode('𝑥²'));
   if(slot.term==='x') term.append(document.createTextNode('𝑥'));
   wrapper.append(term);
 });
 return wrapper;
}
function injectInteractiveResponse(spec){
 const slide=document.getElementById('slide');
 if(!slide||!spec.slots||!spec.slots.length) return;
 if(spec.layout==='polynomial'){
   const node=polynomialResponseNode(spec);
   const anchor=slide.querySelector('.reduction-tiles:last-of-type')||slide.lastElementChild;
   if(anchor) anchor.insertAdjacentElement('afterend',node); else slide.append(node);
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
   button.textContent=value||'…';
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
function renderInteractiveKeypad(spec){
 const keypad=document.getElementById('keypad');
 if(!keypad) return;
 keypad.innerHTML='';
 const body=keypad.closest('.answer-body');
 if(spec.kind==='qcm'||spec.kind==='grid-point'){
   if(body){body.style.setProperty('--keypad-max','940px');body.style.setProperty('--keypad-height-desktop','64px');body.style.setProperty('--keypad-height-mobile','62px');}
   return;
 }
 const keys=(spec.keys||[]).map(key=>typeof key==='string'?{value:key,label:key}:key);
 keys.forEach(key=>{
   const button=document.createElement('button');button.type='button';button.className='key '+(/^\\d$/.test(key.value)?'digit':'context');button.dataset.value=key.value;button.textContent=key.label||key.value;button.disabled=interactiveLocked;keypad.append(button);
 });
 const backspace=document.createElement('button');backspace.type='button';backspace.className='key utility';backspace.dataset.action='backspace';backspace.setAttribute('aria-label','Effacer le dernier caractère');backspace.title='Effacer le dernier caractère';backspace.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 6h10.1a1.7 1.7 0 0 1 1.7 1.7v8.6a1.7 1.7 0 0 1-1.7 1.7H9.2L3 12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m12.4 9.3 5.4 5.4m0-5.4-5.4 5.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';backspace.disabled=interactiveLocked;keypad.append(backspace);
 const count=keys.length+1;
 const desktopColumns=Math.max(1,Math.min(12,count));
 const mobileColumns=Math.max(1,Math.min(6,count));
 const desktopRows=Math.ceil(count/desktopColumns),mobileRows=Math.ceil(count/mobileColumns);
 keypad.style.setProperty('--key-columns',String(desktopColumns));
 keypad.style.setProperty('--key-columns-mobile',String(mobileColumns));
 if(body){
   body.style.setProperty('--keypad-max',Math.min(1060,Math.max(920,count*78+(count-1)*7))+'px');
   body.style.setProperty('--keypad-height-desktop',(desktopRows*54+Math.max(0,desktopRows-1)*7)+'px');
   body.style.setProperty('--keypad-height-mobile',(mobileRows*44+Math.max(0,mobileRows-1)*4)+'px');
 }
}
function applyKeypadVisibility(spec=slides[idx]&&slides[idx].interactiveSpec){
 const dock=document.getElementById('answerDock'),toggle=document.getElementById('keyboardToggle');
 if(!dock||!toggle) return;
 const available=interactiveMode&&!interactiveFinished&&spec&&spec.kind!=='qcm'&&spec.kind!=='grid-point';
 const visible=phoneKeypadMedia.matches||keypadVisible;
 dock.classList.toggle('keypad-collapsed',available&&!visible);
 toggle.hidden=!available||phoneKeypadMedia.matches;
 toggle.disabled=interactiveLocked;
 toggle.setAttribute('aria-pressed',String(available&&visible));
 const label=visible?'Masquer le clavier visuel':'Afficher le clavier visuel';
 toggle.setAttribute('aria-label',label);toggle.title=label;
}
function toggleKeypad(){
 if(!interactiveMode||interactiveLocked||phoneKeypadMedia.matches) return;
 keypadVisible=!keypadVisible;
 applyKeypadVisibility();
}
function hasInteractiveAnswer(){
 const spec=slides[idx].interactiveSpec;
 if(spec.kind==='qcm') return selectedOptions.size>0;
 return interactiveTouched.some(Boolean);
}
function updateInteractiveControls(){
 const dock=document.getElementById('answerDock'),action=document.getElementById('interactiveAction');
 const hasAnswer=hasInteractiveAnswer();
 if(action){action.textContent=interactiveLocked?'Suivant':(hasAnswer?'Valider':'Suivant');action.disabled=false;}
 if(dock) dock.classList.toggle('answer-ready',!interactiveLocked&&hasAnswer);
}
function toggleInteractiveOption(index){
 if(interactiveLocked) return;
 const singleAnswer=!slides[idx].interactiveSpec.multiple;
 if(singleAnswer){
   if(selectedOptions.has(index)) selectedOptions.clear();
   else{selectedOptions.clear();selectedOptions.add(index);}
 }else if(selectedOptions.has(index)) selectedOptions.delete(index); else selectedOptions.add(index);
 setupInteractiveSlide(slides[idx]);
}
function clearInteractiveAnswer(){
 if(interactiveLocked) return;
 resetInteractiveEntryState(slides[idx].interactiveSpec);selectedOptions.clear();
 setInteractiveFeedback('','');
 setupInteractiveSlide(slides[idx]);
}
function appendInteractiveValue(value){
 if(interactiveLocked||slides[idx].interactiveSpec.kind==='qcm') return;
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
 if(interactiveLocked||slides[idx].interactiveSpec.kind==='qcm') return;
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
 return interactiveValues.slice();
}
function evaluateInteractiveAnswer(spec){
 const skipped=!hasInteractiveAnswer();
 const correct=!skipped&&interactiveAnswerIsCorrect(spec);
 const raw=rawInteractiveResponse(spec);
 const normalized=spec.kind==='qcm'?raw:raw.map(normalizeInteractiveAnswer);
 return Object.freeze({
   isCorrect:correct,
   outcome:skipped?'skipped':(correct?'correct':'incorrect'),
   reasonCode:skipped?'EMPTY_RESPONSE':(correct?'CORRECT':'WRONG_ANSWER'),
   rawResponse:raw,
   normalizedResponse:normalized,
   errorCode:null
 });
}
function recordInteractiveAttempt(result){
 const current=slides[idx],contract=current.questionInstance;
 if(!contract) return;
 const session=ensureQuestionSession();pauseQuestionTimer();session.validations++;
 attemptRecorder.record({
   schemaVersion:contract.schemaVersion||1,
   generatorVersion:contract.generatorVersion||'1.12.0',
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
function setInteractiveFeedback(message,kind,detail=''){
 const feedback=document.getElementById('answerFeedback');
 if(!feedback) return;
 feedback.replaceChildren();
 if(message){
   const title=document.createElement('span');title.className='feedback-title';title.textContent=message;feedback.append(title);
   if(detail){const answer=document.createElement('span');answer.className='feedback-answer';answer.textContent=detail;feedback.append(answer);}
 }
 feedback.className='answer-feedback'+(kind?' '+kind:'');
}
function submitInteractive(){
 if(!interactiveMode||interactiveFinished) return;
 if(interactiveLocked){clearTimeout(advanceTimer);advanceInteractive();return;}
 const spec=slides[idx].interactiveSpec;
 const validation=evaluateInteractiveAnswer(spec);
 const correct=validation.isCorrect;
 interactiveLocked=true;corr=true;answeredCount++;
 if(correct) correctCount++;
 if(correct) setInteractiveFeedback('Bonne réponse ✓','good');
 else{
   const expected=String(spec.expectedDisplay||'').replace(/^(?:\\s*(?:réponse attendue|réponses?)\\s*:\\s*)+/i,'');
   setInteractiveFeedback('Mauvaise réponse','bad',expected?'Réponse : '+expected:'');
 }
 render();
 recordInteractiveAttempt(validation);
 clearTimeout(advanceTimer);
 advanceTimer=null;
}
function advanceInteractive(){
 if(idx>=slides.length-1){interactiveFinished=true;render();return;}
 idx++;corr=false;selectedOptions.clear();interactiveLocked=false;questionSession=null;resetInteractiveEntryState(slides[idx].interactiveSpec);
 setInteractiveFeedback('','');render();
}
function restartInteractive(){
 clearTimeout(advanceTimer);idx=0;corr=false;selectedOptions.clear();interactiveLocked=false;correctCount=0;answeredCount=0;interactiveFinished=false;questionSession=null;visualShown=slides.map(()=>false);resetInteractiveEntryState(slides[0].interactiveSpec);setInteractiveFeedback('','');render();
}
function startNextSeries(){
 if(seriesBank.length<2) return;
 seriesIndex=(seriesIndex+1)%seriesBank.length;
 slides=seriesBank[seriesIndex];
 restartInteractive();
}
function openCourse(){const modal=document.getElementById('courseModal'),course=courseForSlide(slides[idx]);if(modal&&course){markQuestionHelp('course');document.getElementById('courseTitle').textContent=course.title;document.getElementById('courseGrid').innerHTML=course.rules.map(rule=>'<div class="course-rule'+(rule[2]?' course-rule-wide':'')+'"><strong>'+rule[0]+'</strong>'+rule[1]+'</div>').join('');modal.hidden=false;const close=modal.querySelector('.course-close');if(close)close.focus();}}
function closeCourse(){const modal=document.getElementById('courseModal');if(modal)modal.hidden=true;}
function openEquationDetail(){const modal=document.getElementById('equationDetailModal'),body=document.getElementById('equationDetailBody'),detail=slides[idx].equationDetailHtml;if(modal&&body&&detail){markQuestionHelp('equation-detail');body.innerHTML=detail;modal.hidden=false;const close=modal.querySelector('.equation-detail-close');if(close)close.focus();}}
function closeEquationDetail(){const modal=document.getElementById('equationDetailModal');if(modal)modal.hidden=true;}
function revealVisual(){if(slides[idx].canRevealVisual){markQuestionHelp('visual');visualShown[idx]=true;render();}}
function next(){if(interactiveMode)return;if(!corr){corr=true;render();return;}if(idx<slides.length-1){idx++;corr=false;render();}}
function prev(){if(interactiveMode)return;if(corr){corr=false;render();return;}if(idx>0){idx--;corr=false;render();}}
function toggleFS(){const d=document.getElementById('diapo');if(!document.fullscreenElement)d.requestFullscreen();else document.exitFullscreen();}
document.getElementById('keypad').addEventListener('click',event=>{const key=event.target.closest('.key');if(!key)return;if(key.dataset.action==='backspace')backspaceInteractive();else appendInteractiveValue(key.dataset.value||'');});
document.addEventListener('keydown',event=>{
 const detail=document.getElementById('equationDetailModal'),course=document.getElementById('courseModal');
 if(event.key==='Escape'){closeCourse();closeEquationDetail();return;}
 if((detail&&!detail.hidden)||(course&&!course.hidden))return;
 if(event.key==='f'||event.key==='F'){toggleFS();return;}
 if(!interactiveMode){if(event.key==='ArrowRight')next();if(event.key==='ArrowLeft')prev();return;}
 if(interactiveFinished)return;
 const spec=slides[idx].interactiveSpec;
 if(event.key==='ArrowRight'){event.preventDefault();submitInteractive();return;}
 if(event.key==='Enter'){event.preventDefault();submitInteractive();return;}
 if(event.key==='Backspace'){event.preventDefault();backspaceInteractive();return;}
 if(spec.kind==='qcm'&&/^[a-z]$/i.test(event.key)){
   const optionIndex=event.key.toUpperCase().charCodeAt(0)-65;
   if(optionIndex>=0&&optionIndex<document.querySelectorAll('#slide .opt').length)toggleInteractiveOption(optionIndex);
   return;
 }
 if(spec.kind!=='qcm'){
   const allowed=new Set((spec.keys||[]).map(key=>typeof key==='string'?key:key.value));
   let value=event.key;
   if(value==='.') value=',';
   if(value==='-'||value==='–'||value==='—') value='−';
   if(value==='X') value='x';
   if(value==='*') value='×';
   if(value==='/') value='÷';
   if((value==='p'||value==='P')&&allowed.has('π')) value='π';
   if(allowed.has(value)){event.preventDefault();appendInteractiveValue(value);}
 }
 });
window.addEventListener('resize',()=>requestAnimationFrame(()=>{fitNavNumbers();if(interactiveMode)applyKeypadVisibility();}));
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
function interactiveKeysFor(combinations,options={}){
  const source=combinations.flat().join(' ').replace(/𝑥/g,'x');
  const keys='1234567890'.split('').map(value=>({value,label:value}));
  const add=(value,label=value)=>{if(!keys.some(key=>key.value===value)) keys.push({value,label});};
  if(/[.,]/.test(source)) add(',',',');
  if(options.forceSigned||/[−–—-]/.test(source)) add('−','−');
  if(/x/i.test(source)) add('x','x');
  if(/\^2|²/.test(source)) add('²','²');
  if(/\+/.test(source)) add('+','+');
  if(/[×*·]/.test(source)) add('×','×');
  if(/[÷/]/.test(source)) add('÷','÷');
  if(/[()]/.test(source)){add('(','(');add(')',')');}
  if(/π/.test(source)) add('π','π');
  return keys;
}
function interactiveSpecForInstance(inst,correctionHtml){
  if(inst.q&&inst.q.options&&inst.q.options.transformation_place_kind){
    const combinations=interactiveAnswerCombinations(inst,(inst.answers||[]).map(value=>String(value)));
    return {kind:'grid-point',slots:[{label:'Abscisse'},{label:'Ordonnée'}],acceptedCombinations:combinations,expectedDisplay:'réponse : '+(inst.answers||[]).join(' ; '),keys:[]};
  }
  const probe=document.createElement('div');
  probe.innerHTML=correctionHtml;
  const options=[...probe.querySelectorAll('.opt')];
  if(options.length){
    const correctIndices=options.map((option,index)=>option.classList.contains('correct')?index:null).filter(index=>index!==null);
    const letters=correctIndices.map(index=>String.fromCharCode(65+index));
    return {
      kind:'qcm',
      multiple:correctIndices.length>1,
      correctIndices,
      options:options.map((option,index)=>({index,displayedValue:option.textContent.replace(/^\s*[A-Z]\.\s*/,'').replace(/\s+/g,' ').trim()})),
      expectedDisplay:(letters.length>1?'réponses ':'réponse ')+letters.join(' et ')
    };
  }

  const rawAnswers=(inst.answers||[]).map(value=>String(value));
  let acceptedCombinations=interactiveAnswerCombinations(inst,rawAnswers);
  const moduleId=inst.module.id;

  if(moduleId==='dnb_22'){
    acceptedCombinations=acceptedCombinations.map(combination=>combination.map(value=>value.replace(/\s*(?:mm|cm|dm|m)²$/i,'').trim()));
  }

  if(moduleId==='dnb_10'){
    const polynomialCombinations=acceptedCombinations.map(combination=>parseInteractivePolynomial(combination[0])).filter(Boolean);
    if(polynomialCombinations.length){
      const terms=['x2','x','u'];
      let activeIndices=terms.map((term,index)=>index).filter(index=>polynomialCombinations.some(combination=>Math.abs(Number(combination[index]))>1e-12));
      if(!activeIndices.length) activeIndices=[2];
      const compactCombinations=polynomialCombinations.map(combination=>activeIndices.map(index=>combination[index]));
      return {
        kind:'slots',layout:'polynomial',
        slots:activeIndices.map(index=>({
          term:terms[index],
          label:index===0?'Coefficient de x carré':(index===1?'Coefficient de x':'Constante'),
          initialValue:'0'
        })),
        acceptedCombinations:compactCombinations,
        expectedDisplay:'réponse : '+rawAnswers[0],
        keys:interactiveKeysFor(compactCombinations,{forceSigned:true})
      };
    }
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
    const equivalentFraction=(moduleId==='dnb_03'&&['add_same_den','subtract_same_den','add_multiple_den'].includes(fractionKind))
      ||(moduleId==='dnb_03b'&&fractionKind==='multiply')
      ||moduleId==='dnb_28'||moduleId==='dnb_29';
    return {
      kind:'slots',layout:'fraction',
      slots:[{label:'Numérateur'},{label:'Dénominateur'}],
      acceptedCombinations:combinations,
      fractionPolicy:equivalentFraction?'equivalent':'exact',
      expectedDisplay:'réponse : '+display,
      keys:interactiveKeysFor(combinations)
    };
  }

  const slotCount=Math.max(1,acceptedCombinations[0]?.length||rawAnswers.length||1);
  const slots=Array.from({length:slotCount},(_,index)=>({label:slotCount===1?'Réponse':'Réponse '+(index+1)}));
  const expected=rawAnswers.length>1?rawAnswers.join(' ; '):(rawAnswers[0]||'');
  return {
    kind:'slots',layout:slotCount>1?'inline':'entry',slots,
    acceptedCombinations,
    expectedDisplay:'réponse : '+expected,
    keys:interactiveKeysFor(acceptedCombinations)
  };
}

function courseKindForModule(moduleId,mode){
  if(mode!=='with') return null;
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

function courseContextForInstance(inst){
  if(inst.module.id==='dnb_04'&&inst.fractionPercent) return {...inst.fractionPercent};
  if(inst.module.id==='dnb_35'&&inst.evolution) return {percent:inst.evolution.percent,direction:inst.evolution.direction,kind:inst.evolution.kind};
  if(inst.module.id==='dnb_19') return {questionNumber:Number(inst.q.n)};
  if(inst.module.id==='dnb_22'&&inst.area) return {kind:inst.area.kind,shape:inst.area.courseShape||''};
  if(inst.module.id==='dnb_23') return {questionNumber:Number(inst.q.n)};
  if(['dnb_26','dnb_26b'].includes(inst.module.id)&&inst.trig) return {kind:inst.trig.kind};
  return null;
}

function slidesDataForQuiz(sourceQuiz,mode,context={}){
  fractionOpsSvgCounter=0;
  return sourceQuiz.map((inst,index) => {
    const visualPolicy=visualPolicyForQuestion(inst.module,inst.q);
    const canRevealVisual=mode==='without'&&visualPolicy==='optional';
    const hiddenMode=slideModeForVisualPolicy(mode,visualPolicy);
    const questionHtml=buildCleanSlideHtml(inst,false,hiddenMode);
    const correctionHtml=buildCleanSlideHtml(inst,true,hiddenMode);
    const interactiveSpec=interactiveSpecForInstance(inst,correctionHtml);
    const questionInstance=context.seriesId?createQuestionInstanceContract(inst,interactiveSpec,{
      seriesId:context.seriesId,
      seriesOrdinal:context.seriesOrdinal||1,
      position:index+1,
      level:context.level
    }):null;
    return {
      moduleId:inst.module.id,
      canonicalModuleId:mathsgoCanonicalModuleId(inst.module.id),
      questionNumber:Number(inst.q.n),
      courseKind:courseKindForModule(inst.module.id,mode),
      courseContext:courseContextForInstance(inst),
      questionHtml,
      correctionHtml,
      interactiveSpec,
      questionInstance,
      assistanceMode:mode,
      equationDetailHtml:inst.module.id==='dnb_13'&&inst.equationData&&!inst.equationData.qcm?equationDetailHtml(inst.equationData):null,
      canRevealVisual,
      visualQuestionHtml:canRevealVisual?buildCleanSlideHtml(inst,false,'with'):null,
      visualCorrectionHtml:canRevealVisual?buildCleanSlideHtml(inst,true,'with'):null
    };
  });
}

function openDiapoWindow(definition=null,{sameTab=false}={}){
  const normalized=definition?normalizeSeriesDefinition(definition):readSeriesDefinitionFromUi();
  const mode=normalized.visualMode;
  const experienceMode=normalized.experienceMode;
  const seriesId=seriesIdForDefinition(normalized);
  const seriesQuizzes=[quiz];
  if(experienceMode==='interactive'){
    const mods=modulesForSeriesDefinition(normalized);
    while(seriesQuizzes.length<normalized.seriesCount) seriesQuizzes.push(buildBalancedQuiz(mods,normalized.questionCount));
  }
  const seriesData=seriesQuizzes.map((seriesQuiz,index)=>slidesDataForQuiz(seriesQuiz,mode,{seriesId,seriesOrdinal:index+1,level:normalized.level}));
  const html=makeDiapoWindowHtml(seriesData,experienceMode);
  if(sameTab){
    document.open();document.write(html);document.close();return;
  }
  const w = window.open('', '_blank');
  if(!w){ alert('La nouvelle fenêtre a été bloquée. Autorise les popups pour cette page.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
