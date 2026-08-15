/* Solveur-étalon de Solèy — mesurer la difficulté d'un niveau, pour de vrai.
 *
 * Pourquoi : jusqu'ici la difficulté des niveaux n'avait JAMAIS été mesurée.
 * Verdict de Gwenael sur le monde de la canne (15/08) : « jamais plus de trente
 * secondes pour trouver quoi que ce soit ». Ce script donne le chiffre qui
 * manquait — et il sert AVANT de dessiner, pas après.
 *
 * Il ne réimplémente PAS la physique : il charge levels.js + engine.js dans un
 * vm (même patron que createGameContext de tests/soley-public.test.mjs) et
 * appelle simulate() du moteur, exactement comme le jeu.
 *
 * DEUX ESPACES DE RECHERCHE
 *
 *  A. ESPACE LIBRE — toutes les façons de poser un sous-ensemble des pièces de
 *     la boîte sur les cases libres (chaque pièce au plus une fois). Taille
 *     exacte par dénombrement, G estimé par tirage uniforme. C'est la force
 *     brute littérale ; elle mesure surtout la TAILLE du plateau et de la boîte.
 *     Contexte utile, mauvaise mesure du ressenti : personne ne pose un miroir
 *     dans un coin que la lumière n'atteint pas.
 *
 *  B. ESPACE ÉCLAIRÉ — les configurations où CHAQUE pièce posée reçoit un rayon
 *     qu'elle accepte, et où aucune pose ne tue le rayon sur place (la pièce qui
 *     le renvoie dans une roche à une case de là : un élève voit ce coup mourir
 *     et le défait dans la seconde). C'est le vrai espace de tâtonnement, et il
 *     est énumérable exhaustivement. Toute configuration gagnante « sans pièce
 *     inutile » y est atteignable : on ajoute les pièces dans l'ordre du flux.
 *     MESURE PRINCIPALE.
 *
 * GRANDEURS RENDUES (espace éclairé)
 *   E     espace exploré (nombre de configurations)
 *   G     configurations gagnantes · Gtout : gagnantes ET qui ramassent tout
 *   R     rang moyen de la première victoire, ordre d'essai aléatoire, 200
 *         tirages sans remise (espérance exacte (E+1)/(G+1) donnée en regard)
 *   Rtout le même, pour une victoire qui ramasse TOUS les fruits — c'est la
 *         couche ☀☀ : « gagner reste accessible, tout ramasser peut flamber »
 *   prof  plus petit nombre de pièces d'une configuration gagnante
 *   λ     largeur du tâtonnement par pose : R = λ^prof. Un couloir forcé tombe
 *         vers 2-3 (chaque pose est dictée, l'élève suit la lumière sans
 *         choisir) ; un vrai casse-tête ouvert dépasse 6. C'est le garde-fou
 *         anti-couloir : allonger un tunnel gonfle R sans faire chercher.
 *
 * Usage :
 *   node tests/soley/solveur-etalon.mjs --monde canne
 *   node tests/soley/solveur-etalon.mjs --niveau "Le grand tri" --json
 *   node tests/soley/solveur-etalon.mjs --tous --sans-libre
 */
import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../../", import.meta.url);
const lire = (c) => fs.readFileSync(new URL(c, root), "utf8").replace(/\r\n/g, "\n");

export function createGameContext() {
  const context = vm.createContext({
    localStorage: { getItem() { return null; }, setItem() {} }
  });
  vm.runInContext(lire("outils/club_maths/soley/js/levels.js"), context);
  vm.runInContext(lire("outils/club_maths/soley/js/engine.js"), context);
  vm.runInContext(SOLVEUR_SRC, context);
  return context;
}

/* ------------------------------------------------------------------ *
 * Tout le moteur de mesure tourne DANS le vm : simulate() y est natif. *
 * ------------------------------------------------------------------ */
export const SOLVEUR_SRC = String.raw`
var SOLVEUR = (function(){
  "use strict";

  /* graine fixe : deux exécutions donnent le même chiffre */
  function rng(g){ var s=g>>>0; return function(){ s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296; }; }

  function casesLibres(L){
    var occ=new Set();
    L.suns.forEach(function(s){occ.add(s.x+","+s.y);});
    L.rocks.forEach(function(r){occ.add(r[0]+","+r[1]);});
    L.targets.forEach(function(t){occ.add(t.x+","+t.y);});
    L.fruits.forEach(function(f){occ.add(f[0]+","+f[1]);});
    (L.gates||[]).forEach(function(g){occ.add(g.x+","+g.y);});
    (L.fixed||[]).forEach(function(f){occ.add(f[1]+","+f[2]);});
    var out=[];
    for(var y=0;y<L.rows;y++) for(var x=0;x<L.cols;x++){ var k=x+","+y; if(!occ.has(k)) out.push(k); }
    return out;
  }

  /* pièces distinctes + multiplicité : deux miroirs identiques ne font pas
     deux configurations différentes. On garde la liste des index d'origine
     pour pouvoir réécrire une solution en [index,x,y] valides. */
  function boite(L){
    var cles=[],defs=[],cnt=[],idx=[];
    L.tools.forEach(function(d,i){
      var k=JSON.stringify(d), j=cles.indexOf(k);
      if(j<0){ cles.push(k); defs.push(d); cnt.push(0); idx.push([]); j=cles.length-1; }
      cnt[j]++; idx[j].push(i);
    });
    return {defs:defs,cnt:cnt,idx:idx};
  }

  function accepte(d,dirs){ return d.t==='m' ? d.ins.some(function(x){return dirs.has(x);}) : dirs.has(d.in); }

  /* cases traversées par un rayon, et par quelle direction — lues sur les
     segments rendus par simulate() : aucune physique réécrite ici */
  function casesEclairees(sim, libreSet, placees){
    var m=new Map();
    for(var i=0;i<sim.segs.length;i++){
      var s=sim.segs[i], dx=Math.sign(s.x2-s.x1), dy=Math.sign(s.y2-s.y1);
      if(!dx&&!dy) continue;
      var dir = dy<0?0:(dx>0?1:(dy>0?2:3)), fixe,a,b;
      if(dx){ fixe=Math.round(s.y1); a=Math.min(s.x1,s.x2); b=Math.max(s.x1,s.x2); }
      else  { fixe=Math.round(s.x1); a=Math.min(s.y1,s.y2); b=Math.max(s.y1,s.y2); }
      for(var t=Math.ceil(a-1e-9); t<=Math.floor(b+1e-9); t++){
        var k = dx ? (t+","+fixe) : (fixe+","+t);
        if(!libreSet.has(k)||placees.has(k)) continue;
        var st=m.get(k); if(!st){st=new Set();m.set(k,st);} st.add(dir);
      }
    }
    return m;
  }

  /* une pièce fraîchement posée « vit » si au moins une de ses sorties sert une
     case, franchit une case entière, ou enchaîne sur une pièce déjà posée */
  function vivant(sim, ck, def, placees){
    if(def.t==='m') return true;                     /* la lentille attend son 2e rayon */
    var p=ck.split(","), px=+p[0], py=+p[1];
    for(var i=0;i<sim.segs.length;i++){
      var s=sim.segs[i];
      if(Math.round(s.x1)!==px||Math.round(s.y1)!==py) continue;
      if(s.targetIndex>=0) return true;
      if(Math.abs(s.x2-s.x1)+Math.abs(s.y2-s.y1)>=0.4) return true;
      if(placees.has(Math.round(s.x2)+","+Math.round(s.y2))) return true;
    }
    return false;
  }

  /* ============ B. ESPACE ÉCLAIRÉ ============ */
  /* toutes les cases traversées par un rayon, avec la valeur du rayon */
  function passages(sim, libreSet){
    var m=new Map();
    for(var i=0;i<sim.segs.length;i++){
      var s=sim.segs[i], dx=Math.sign(s.x2-s.x1), dy=Math.sign(s.y2-s.y1);
      if(!dx&&!dy) continue;
      var fixe,a,b;
      if(dx){ fixe=Math.round(s.y1); a=Math.min(s.x1,s.x2); b=Math.max(s.x1,s.x2); }
      else  { fixe=Math.round(s.x1); a=Math.min(s.y1,s.y2); b=Math.max(s.y1,s.y2); }
      for(var t=Math.ceil(a-1e-9); t<=Math.floor(b+1e-9); t++){
        var k = dx ? (t+","+fixe) : (fixe+","+t);
        if(!libreSet.has(k)) continue;
        m.set(k+"|"+s.val[0]+"/"+s.val[1], true);
      }
    }
    return m;
  }

  function espaceEclaire(i, budget, sense, kmax, carto){
    cur=i;
    var L=LV[i];
    var libre=casesLibres(L), libreSet=new Set(libre);
    var iCase={}; libre.forEach(function(c,n){ iCase[c]=n; });
    var B=boite(L), restant=B.cnt.slice(), K=Math.min(L.tools.length, kmax||99);
    var vus=new Set(), drapeaux=[], pile=[], codes=[], placees=new Set();
    var profMin=Infinity, profTout=Infinity, debord=false;
    var carte=new Map(), piecesUtiles=new Map();
    var exSol=null, exMin=null;           /* exemples : gourmand / gagnant sans tout */

    state.placed={};
    function rec(depth, ckN, defN){
      if(drapeaux.length>=budget){ debord=true; return; }
      var sim=simulate();
      if(sense&&ckN&&!vivant(sim,ckN,defN,placees)) return;
      var d=0;
      if(sim.win){
        var tout = sim.fruits.size>=L.fruits.length;
        d = tout?2:1;
        if(depth<profMin) profMin=depth;
        if(tout&&depth<profTout){ profTout=depth; exSol=pile.slice(); }
        if(!tout&&(!exMin||depth<exMin.length)) exMin=pile.slice();
        if(carto){
          var pas=passages(sim,libreSet);
          pas.forEach(function(_,k){
            var e2=carte.get(k);
            if(!e2){ e2={nb:0,prof:99}; carte.set(k,e2); }
            e2.nb++; if(depth<e2.prof) e2.prof=depth;
          });
          placees.forEach(function(c){
            var e3=piecesUtiles.get(c)||0; piecesUtiles.set(c,e3+1);
          });
        }
      }
      drapeaux.push(d);
      if(depth>=K) return;
      var lit=casesEclairees(sim,libreSet,placees);
      var cles=Array.from(lit.keys()).sort();
      for(var ci=0;ci<cles.length;ci++){
        var ck=cles[ci], dirs=lit.get(ck);
        for(var j=0;j<B.defs.length;j++){
          if(!restant[j]||!accepte(B.defs[j],dirs)) continue;
          var code=iCase[ck]*16+j, pos=0;
          while(pos<codes.length&&codes[pos]<code) pos++;
          codes.splice(pos,0,code);
          var nk=codes.join(",");
          if(vus.has(nk)){ codes.splice(pos,1); continue; }
          vus.add(nk);
          pile.push(ck+"#"+j);
          state.placed[ck]={def:B.defs[j],ti:B.idx[j][B.cnt[j]-restant[j]]};
          placees.add(ck); restant[j]--;
          rec(depth+1, ck, B.defs[j]);
          restant[j]++; placees.delete(ck); delete state.placed[ck]; pile.pop(); codes.splice(pos,1);
          if(debord) return;
        }
      }
    }
    rec(0,null,null);
    state.placed={};

    var E=drapeaux.length,G=0,Gt=0;
    for(var z=0;z<E;z++){ if(drapeaux[z]>=1)G++; if(drapeaux[z]===2)Gt++; }
    var Rth=(E+1)/(G+1), RthT=(E+1)/(Gt+1);
    return {
      E:E,G:G,Gtout:Gt,debord:debord,
      prof: profMin===Infinity?null:profMin,
      profTout: profTout===Infinity?null:profTout,
      R:rangMoyen(drapeaux,1,200,12345), Rtout:rangMoyen(drapeaux,2,200,999331),
      Rth:Rth, RthTout:RthT,
      lambda: profMin===Infinity?null:Math.pow(Rth,1/Math.max(1,profMin)),
      lambdaTout: profTout===Infinity?null:Math.pow(RthT,1/Math.max(1,profTout)),
      sol: exSol?plan(exSol,B):null, solMin: exMin?plan(exMin,B):null,
      casesLibres:libre.length, outils:K, distincts:B.defs.length,
      carto: carto ? (function(){
        var out=[];
        carte.forEach(function(v,k){
          var t=k.split("|");
          out.push({case:t[0], val:t[1], nb:v.nb, prof:v.prof, piece:piecesUtiles.get(t[0])||0});
        });
        out.sort(function(a,b){ return (b.prof-a.prof)||(a.nb-b.nb); });
        return out;
      })() : null
    };
  }

  /* réécrit une pile ["x,y#j"] en [[indexOutil,x,y]] à index d'outils DISTINCTS */
  function plan(p,B){
    var pris=B.defs.map(function(){return 0;});
    return p.map(function(e){
      var t=e.split("#"), c=t[0].split(","), j=+t[1];
      var ti=B.idx[j][pris[j]++];
      return [ti,+c[0],+c[1]];
    });
  }

  /* rang moyen de la 1re victoire, ordre d'essai aléatoire SANS remise */
  function rangMoyen(drapeaux,seuil,tirages,graine){
    var E=drapeaux.length, ok=new Uint8Array(E), G=0;
    for(var i=0;i<E;i++) if(drapeaux[i]>=seuil){ ok[i]=1; G++; }
    if(!G) return null;
    var alea=rng(graine), somme=0;
    for(var t=0;t<tirages;t++){
      var ech=new Map(), rang=0;
      for(var p=0;p<E;p++){
        var r=p+Math.floor(alea()*(E-p));
        var vp=ech.has(p)?ech.get(p):p, vr=ech.has(r)?ech.get(r):r;
        ech.set(p,vr); ech.set(r,vp);
        rang++;
        if(ok[vr]) break;
      }
      somme+=rang;
    }
    return somme/tirages;
  }

  /* ============ A. ESPACE LIBRE ============ */
  function combi(n,k){ var r=1; for(var i=0;i<k;i++) r=r*(n-i)/(i+1); return r; }
  function arrangements(cnt,K){
    var f=[1];
    for(var j=0;j<cnt.length;j++){
      var g=new Array(K+1).fill(0);
      for(var k=0;k<=K;k++){ if(!f[k])continue;
        for(var t=0;t<=cnt[j]&&k+t<=K;t++) g[k+t]+=f[k]*combi(k+t,t); }
      f=g;
    }
    return f;
  }
  function espaceLibre(i,ech){
    cur=i;
    var L=LV[i], libre=casesLibres(L), B=boite(L), K=L.tools.length;
    var arr=arrangements(B.cnt,K), part=[], E=0;
    for(var k=0;k<=K;k++){ var n=combi(libre.length,k)*(arr[k]||0); part.push(n); E+=n; }
    var alea=rng(7717), G=0, Gt=0;
    for(var s=0;s<ech;s++){
      var u=alea()*E,k2=0,acc=0;
      for(k2=0;k2<=K;k2++){ acc+=part[k2]; if(u<=acc) break; }
      if(k2>K)k2=K;
      var cases=[],pris=new Set();
      while(cases.length<k2){ var c=libre[Math.floor(alea()*libre.length)]; if(!pris.has(c)){pris.add(c);cases.push(c);} }
      var rest=B.cnt.slice(); state.placed={}; var ok=true;
      for(var c2=0;c2<cases.length;c2++){
        var dispo=[]; for(var j=0;j<B.defs.length;j++) if(rest[j]) dispo.push(j);
        if(!dispo.length){ok=false;break;}
        var jj=dispo[Math.floor(alea()*dispo.length)]; rest[jj]--;
        state.placed[cases[c2]]={def:B.defs[jj],ti:B.idx[jj][0]};
      }
      if(!ok) continue;
      var sim=simulate();
      if(sim.win){ G++; if(sim.fruits.size>=L.fruits.length) Gt++; }
    }
    state.placed={};
    return { E:E, echantillons:ech, gagnes:G, gagnesTout:Gt,
      R: G?ech/G:null, Rtout: Gt?ech/Gt:null, casesLibres:libre.length };
  }

  function mesurer(i,opts){
    opts=opts||{};
    var L=LV[i];
    return {
      i:i, monde:L.w, nom:L.name, grille:L.cols+"x"+L.rows,
      cases:L.cols*L.rows, roches:L.rocks.length,
      densite: Math.round(1000*L.rocks.length/(L.cols*L.rows))/10,
      cibles:L.targets.length, fruits:L.fruits.length,
      outils:L.tools.length, par:L.sol?L.sol.length:null,
      surplus: L.sol?L.tools.length-L.sol.length:null,
      eclaire: espaceEclaire(i, opts.budget||400000, true, opts.kmax),
      brut: opts.brut? espaceEclaire(i, opts.budget||400000, false) : null,
      libre: opts.libre? espaceLibre(i, opts.echantillons||120000) : null
    };
  }

  return { mesurer:mesurer, espaceEclaire:espaceEclaire, espaceLibre:espaceLibre };
})();
`;

export function ligne(m) {
  const e = m.eclaire, l = m.libre, b = m.brut;
  const n = (v, d = 0) => (v === null || v === undefined ? "—" : Number(v).toLocaleString("fr-FR", { maximumFractionDigits: d }));
  return `\n${String(m.monde).padEnd(8)} ${m.nom}` +
    `\n  plateau ${m.grille} · ${m.roches} obstacles (${m.densite} %) · ${m.cibles} cible(s) · ${m.fruits} fruit(s) · boîte ${m.outils} · par ${m.par ?? "—"} (surplus ${m.surplus ?? "—"})` +
    `\n  E=${n(e.E)}  G=${n(e.G)}  Gtout=${n(e.Gtout)}  prof=${e.prof ?? "—"}  profTout=${e.profTout ?? "—"}` +
    `\n  R=${n(e.R, 1)} (th. ${n(e.Rth, 1)})   Rtout=${n(e.Rtout, 1)} (th. ${n(e.RthTout, 1)})   λ=${n(e.lambda, 1)}  λtout=${n(e.lambdaTout, 1)}` +
    (e.debord ? "  [BUDGET ATTEINT : E borné, R plancher]" : "") +
    (b ? `\n  sans le filtre du coup mort : E=${n(b.E)} G=${n(b.G)} R=${n(b.R, 1)}` : "") +
    (l ? `\n  espace libre : E=${l.E.toExponential(2)} · ${l.echantillons} tirages → ${l.gagnes} victoire(s) · R≈${l.gagnes ? n(l.R) : "> " + n(l.echantillons)}` : "");
}

/* ------------------------------ CLI ------------------------------ */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const has = (n) => args.includes(n);
  const ctx = createGameContext();
  const niveaux = vm.runInContext("LV.map((l,i)=>({i,w:l.w,name:l.name}))", ctx);
  let cibles = niveaux;
  if (flag("--monde")) cibles = niveaux.filter((l) => l.w === flag("--monde"));
  if (flag("--niveau")) cibles = niveaux.filter((l) => l.name === flag("--niveau"));
  const opts = {
    budget: +(flag("--budget") || 400000),
    echantillons: +(flag("--echantillons") || 120000),
    libre: !has("--sans-libre"),
    brut: has("--brut")
  };
  const out = [];
  for (const c of cibles) {
    const m = vm.runInContext(`SOLVEUR.mesurer(${c.i}, ${JSON.stringify(opts)})`, ctx);
    out.push(m);
    if (!has("--json")) console.log(ligne(m));
  }
  if (has("--json")) console.log(JSON.stringify(out, null, 1));
}
