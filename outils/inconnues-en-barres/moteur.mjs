/** Inconnues en barres — modèle pur, déterministe, sans DOM. */
export const VERSION = 'IB1';
export const FAMILLES = {
  une: { titre: 'Une quantité à trouver', forme: 'aA + d = T', niveaux: ['Partager un lot', 'Retirer puis partager', 'Un lot plus grand'] },
  multiple: { titre: 'Une quantité vaut plusieurs fois l’autre', forme: 'A = kB ; mA + nB = T', niveaux: ['Un remplacement', 'Des lots différents', 'Plusieurs remplacements'] },
  ecart: { titre: 'Une quantité dépasse l’autre', forme: 'A = B + d ; mA + nB = T', niveaux: ['Un écart à retirer', 'Plusieurs parts', 'Plusieurs écarts à retirer'] },
  lot: { titre: 'Un lot connu, puis un lot mixte', forme: 'rA = U ; mA + nB = T', niveaux: ['Un objet connu', 'Partager le premier lot', 'Reconstruire un autre lot'] },
  combinaison: { titre: 'Deux lots à comparer', forme: 'mA + nB = T ; pA + qB = U', niveaux: ['Retirer un lot commun', 'Multiplier un lot entier', 'Ajuster les deux lots'] },
  trois: { titre: 'Trois quantités liées', forme: 'A = kB ; C = B + d ; mA + B + C = T', niveaux: ['Trois parts et un écart', 'Un multiple et un écart', 'Plusieurs lots liés'] },
  equilibre: { titre: 'La même quantité dans deux lots égaux', forme: 'aA + b = cA + d', niveaux: ['Retirer les parts communes', 'Comparer deux lots égaux', 'Plus de parts communes'] }
};
export const CONTEXTES = {
  classe: { titre: 'Fournitures · prix', unite: '€', grandeur: 'prix', verbe: 'coûte', total: 'coûtent', objets: [{picto:'📘',nom:'cahier',pluriel:'cahiers',article:'un'},{picto:'✏️',nom:'crayon',pluriel:'crayons',article:'un'},{picto:'📏',nom:'règle',pluriel:'règles',article:'une'}] },
  fruits: { titre: 'Fruits · masses', unite: 'g', grandeur: 'masse', verbe: 'pèse', total: 'pèsent', objets: [{picto:'🍐',nom:'poire',pluriel:'poires',article:'une'},{picto:'🍎',nom:'pomme',pluriel:'pommes',article:'une'},{picto:'🍊',nom:'orange',pluriel:'oranges',article:'une'}] },
  jetons: { titre: 'Jetons · points', unite: 'points', grandeur: 'valeur', verbe: 'vaut', total: 'valent', objets: [{picto:'🟧',nom:'jeton orange',pluriel:'jetons orange',article:'un'},{picto:'🟦',nom:'jeton bleu',pluriel:'jetons bleus',article:'un'},{picto:'🟩',nom:'jeton vert',pluriel:'jetons verts',article:'un'}] }
};
const SYM = ['A','B','C'];
export const nombre = n => new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(n);
export const unite = p => CONTEXTES[p.contexte].unite;
export const mesure = (p,n) => `${nombre(n)} ${unite(p) === 'points' && n === 1 ? 'point' : unite(p)}`;
export const objet = (p,s) => CONTEXTES[p.contexte].objets[SYM.indexOf(s)];
export const objets = (p,s,n=1) => `${n} ${n === 1 ? objet(p,s).nom : objet(p,s).pluriel}`;
const S = (symbol,n=1,etat='') => ({symbol,n,etat});
const N = value => ({value});
export const termes = (a=0,b=0,c=0,d=0) => [a&&S('A',a),b&&S('B',b),c&&S('C',c),d&&N(d)].filter(Boolean);
export const evaluer = (terms,p) => terms.reduce((v,t)=>v+(t.symbol?t.n*p.valeurs[t.symbol]:t.value),0);
const eq = (gauche,droite,titre='') => ({gauche,droite:typeof droite === 'number'?[N(droite)]:droite,titre});
export function hasard(seed) {
  let v = seed >>> 0;
  return () => { v += 0x6D2B79F5; let t=v; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
}
const pgcd = (a,b) => b ? pgcd(b,a%b) : a;
export function generer({famille='une',niveau=0,contexte='classe',seed=1}={}) {
  if(!FAMILLES[famille] || !CONTEXTES[contexte] || !Number.isInteger(niveau) || niveau<0 || niveau>2 || !Number.isInteger(seed) || seed<0 || seed>0xffffffff) throw new RangeError('Paramètres de problème invalides.');
  const random=hasard(seed), int=(a,b)=>a+Math.floor(random()*(b-a+1)), pick=a=>a[int(0,a.length-1)];
  const pas=contexte==='fruits'?10:1, base=contexte==='fruits'?int(5,10)*pas:int(2,8);
  const p={version:VERSION,famille,niveau,contexte,seed,valeurs:{A:base},donnees:[], inconnues:['A']};
  let {A}=p.valeurs, B=base,C,d=pas*int(1,4),k=pick([2,3,4]),m=1,n=1,r=1;
  if(famille==='une') {
    m=niveau===2?int(5,8):int(2,4); d=niveau===0?0:d;
    Object.assign(p,{m,d,T:m*A+d});p.donnees=[eq(termes(m,0,0,d),p.T,'Le lot')];
  } else if(famille==='equilibre') {
    const c=niveau===0?1:niveau===1?2:int(3,4); m=c+int(1,niveau===2?4:3);
    const b=niveau===0?0:d; d=(m-c)*A+b;
    Object.assign(p,{m,c,b,d});p.donnees=[eq(termes(m,0,0,b),termes(c,0,0,d),'Deux lots de même valeur')];
  } else {
    p.inconnues=['A','B'];p.valeurs.B=B;
    if(famille==='multiple') {
      if(niveau===0){k=2;m=1;n=pick([1,2]);}
      else if(niveau===1){m=1;n=pick([3,4,5]);}
      else {const choix=[];for(let a=2;a<=3;a++)for(let b=1;b<=4;b++)if(a*k+b<=12)choix.push([a,b]);[m,n]=pick(choix);}
      A=k*B;Object.assign(p,{k,m,n,T:m*A+n*B});p.donnees=[eq([S('A')],[S('B',k)],'La relation'),eq(termes(m,n),p.T,'Le lot complet')];
    } else if(famille==='ecart') {
      m=niveau===2?int(2,3):1;n=niveau===0?1:int(2,4);A=B+d;
      Object.assign(p,{m,n,d,T:m*A+n*B});p.donnees=[eq([S('A')],[S('B'),N(d)],'La relation'),eq(termes(m,n),p.T,'Le lot complet')];
    } else if(famille==='lot') {
      A=contexte==='fruits'?int(8,14)*pas:int(4,12);r=niveau===0?1:int(2,3);m=niveau===2?r+1:1;n=niveau===0?int(1,2):int(2,4);
      Object.assign(p,{r,m,n,U:r*A,T:m*A+n*B});p.donnees=[eq([S('A',r)],p.U,'Le premier lot'),eq(termes(m,n),p.T,'Le lot mixte')];
    } else if(famille==='combinaison') {
      A=contexte==='fruits'?int(7,12)*pas:int(3,9);
      let a,b,c,e;
      if(niveau===0){a=c=1;b=int(3,5);e=1;}
      else if(niveau===1){a=2;b=1;c=1;e=int(2,3);}
      else {[a,b,c,e]=pick([[2,1,3,2],[2,3,3,2],[3,1,2,3],[2,1,3,4]]);}
      Object.assign(p,{m:a,n:b,r:c,q:e,T:a*A+b*B,U:c*A+e*B});
      p.donnees=[eq(termes(a,b),p.T,'Lot 1'),eq(termes(c,e),p.U,'Lot 2')];
    } else if(famille==='trois') {
      k=niveau===0?1:int(2,3);m=niveau===2?2:1;n=1;r=1;A=k*B;C=B+d;
      Object.assign(p,{k,m,n,r,d,T:m*A+n*B+r*C});p.inconnues.push('C');p.valeurs.C=C;
      p.donnees=[eq([S('A')],[S('B',k)],'Première relation'),eq([S('C')],[S('B'),N(d)],'Deuxième relation'),eq(termes(m,n,r),p.T,'Le lot complet')];
    }
    p.valeurs.A=A;
  }
  p.id=`${VERSION}-${Object.keys(FAMILLES).indexOf(famille)}${niveau}${Object.keys(CONTEXTES).indexOf(contexte)}-${seed.toString(36).toUpperCase()}`;
  return p;
}
export function depuisIdentifiant(id) {
  const m=String(id).trim().toUpperCase().match(/^IB1-([0-6])([0-2])([0-2])-([0-9A-Z]{1,7})$/);
  if(!m) throw new RangeError('Cet identifiant n’est pas reconnu.');
  return generer({famille:Object.keys(FAMILLES)[+m[1]],niveau:+m[2],contexte:Object.keys(CONTEXTES)[+m[3]],seed:parseInt(m[4],36)});
}
export function methodes(p) {
  if(p.famille==='multiple')return [{id:'substitution',titre:'Remplacer par la petite quantité'},...(p.n%p.k===0?[{id:'inverse',titre:'Regrouper vers la grande quantité'}]:[])];
  if(p.famille==='combinaison')return [{id:'combinaison',titre:'Comparer les lots (combinaison)'},...((p.m===1||p.r===1)?[{id:'substitution',titre:'Isoler puis remplacer (substitution)'}]:[])];
  return [{id:'substitution',titre:p.famille==='equilibre'?'Retirer la même chose des deux côtés':'Remplacer, puis calculer'}];
}
export function texteLot(p,terms) {
  return terms.map(t=>t.symbol?objets(p,t.symbol,t.n):mesure(p,t.value)).join(' et ');
}
export function enonce(p) {
  const ctx=CONTEXTES[p.contexte], lines=[];
  for(const e of p.donnees) {
    const verb=e.gauche.length===1&&e.gauche[0].n===1?ctx.verbe:ctx.total;
    if(p.famille==='une'&&p.d>0) lines.push(p.contexte==='classe'?`${objets(p,'A',p.m)}, avec ${mesure(p,p.d)} de frais fixes, coûtent ${mesure(p,p.T)}.`:p.contexte==='fruits'?`${objets(p,'A',p.m)}, avec un emballage de ${mesure(p,p.d)}, pèsent ${mesure(p,p.T)}.`:`${objets(p,'A',p.m)}, avec un bonus de ${mesure(p,p.d)}, valent ${mesure(p,p.T)}.`);
    else if(e.droite.length===1&&!e.droite[0].symbol) lines.push(`${texteLot(p,e.gauche)} ${verb} ${mesure(p,e.droite[0].value)}.`);
    else if(e.gauche.length===1&&e.gauche[0].n===1&&e.droite.length===1&&e.droite[0].symbol) lines.push(`${texteLot(p,e.gauche)} ${verb} autant que ${texteLot(p,e.droite)}.`);
    else if(e.gauche.length===1&&e.gauche[0].n===1&&e.droite.length===2&&!e.droite[1].symbol) lines.push(`${texteLot(p,e.gauche)} ${verb} ${mesure(p,e.droite[1].value)} de plus que ${texteLot(p,[e.droite[0]])}.`);
    else lines.push(`Le lot « ${texteLot(p,e.gauche)} » a ${ctx.grandeur==='prix'?'le même prix':`la même ${ctx.grandeur}`} que le lot « ${texteLot(p,e.droite)} ».`);
  }
  return {lignes:lines.map(s=>s[0].toUpperCase()+s.slice(1)),question:`Trouve ${ctx.grandeur==='masse'?'la masse':ctx.grandeur==='prix'?'le prix':'la valeur'} ${p.inconnues.length===1?`d’${objet(p,'A').article} ${objet(p,'A').nom}`:'de chaque sorte d’objet'}.`,convention:`Tous les objets d’une même sorte ont ${ctx.grandeur==='masse'?'la même masse':ctx.grandeur==='prix'?'le même prix':'la même valeur'}.`};
}
const frame=(phase,titre,texte,rows=[],calculs=[],reponses=[])=>({phase,titre,texte,rows,calculs,reponses});
export function parcours(p,methode=methodes(p)[0].id) {
  if(!methodes(p).some(m=>m.id===methode))throw new RangeError('Méthode non disponible pour cet exercice.');
  const {A,B,C}=p.valeurs,{m,n,k,d,r,T,U}=p, f=[];
  f.push(frame(0,'À toi de chercher','Lis les données. Qu’est-ce qui reste à trouver ?'));
  f.push({...frame(1,'Construire le schéma','Comment compléter ces cases ? Propose un schéma sur ton cahier ou à l’oral, puis révèle les données.',p.donnees),vide:true});
  f.push(frame(1,'Les données représentées','Chaque ligne décrit une même quantité de deux façons.',p.donnees));
  const add=(phase,title,text,rows=[],calcs=[],answers=[])=>f.push(frame(phase,title,text,rows,calcs,answers));
  const solve=(s,value,calcs,explanation)=>add(3,`Trouver ${objet(p,s).article} ${objet(p,s).nom}`,explanation,[eq([S(s)],value)],calcs,[s]);
  if(p.famille==='une') {
    if(d)add(2,'Retirer la quantité connue',`On retire ${mesure(p,d)} du total. Il reste seulement les objets identiques.`,[eq([S('A',m)],T-d)],[`${nombre(T)} − ${nombre(d)} = ${nombre(T-d)}`]);
    else add(2,'Repérer les parts égales',`Le total est partagé entre ${m} objets identiques.`,[eq([S('A',m)],T)]);
    solve('A',A,[`${nombre(T-d)} ÷ ${m} = ${nombre(A)}`],`On partage ${mesure(p,T-d)} en ${m} parts égales.`);
  } else if(p.famille==='multiple') {
    if(methode==='inverse') {
      const parts=m+n/k;
      add(2,'Repérer les groupes à remplacer',`Chaque groupe de ${k} ${objet(p,'B').pluriel} peut être remplacé par ${objet(p,'A').article} ${objet(p,'A').nom}.`,[p.donnees[0],eq([S('A',m),S('B',n,'remplacer')],T)]);
      add(2,'Regrouper vers la grande quantité',`Les ${n} ${objet(p,'B').pluriel} forment ${n/k} groupe${n/k>1?'s':''} de ${k}. Le lot contient maintenant ${parts} grandes parts.`,[eq([S('A',parts)],T)]);
      solve('A',A,[`${nombre(T)} ÷ ${parts} = ${nombre(A)}`],`On partage le total en ${parts} grandes parts égales.`);
      add(3,'Revenir à la petite quantité',`La grande quantité vaut ${k} fois la petite : on la partage en ${k}.`,[eq([S('B',k)],A),eq([S('B')],B)],[`${nombre(A)} ÷ ${k} = ${nombre(B)}`],['B']);
    } else {
      const parts=m*k+n;
      add(2,'Repérer ce que l’on remplace',`On remplace chaque ${objet(p,'A').nom} par ${k} ${objet(p,'B').pluriel}.`,[p.donnees[0],eq([S('A',m,'remplacer'),S('B',n)],T)]);
      add(2,'Remplacer sans changer le total',`Le remplacement donne ${m*k} petites parts. On en ajoute ${n} : cela fait ${parts} parts égales.`,[eq([S('B',parts)],T)]);
      solve('B',B,[`${nombre(T)} ÷ ${parts} = ${nombre(B)}`],`On partage ${mesure(p,T)} en ${parts} parts égales.`);
      solve('A',A,[`${k} × ${nombre(B)} = ${nombre(A)}`],`On reprend la relation : la grande quantité vaut ${k} fois la petite.`);
    }
  } else if(p.famille==='ecart'||p.famille==='trois') {
    const triple=p.famille==='trois',parts=triple?m*k+n+r:m+n,ecarts=triple?r:m,reste=T-ecarts*d;
    add(2,'Remplacer les quantités liées',triple?`On remplace chaque objet de la première sorte par ${k===1?'une part':`${k} parts`} de référence et chaque objet de la troisième sorte par une part et ${mesure(p,d)}.`:`Chaque grande quantité devient une petite quantité et un supplément de ${mesure(p,d)}.`,[eq([S('B',parts),N(ecarts*d)],T)]);
    add(2,'Retirer tous les suppléments',`Il y a ${ecarts} supplément${ecarts>1?'s':''} de ${mesure(p,d)}. On retire donc ${mesure(p,ecarts*d)}.`,[eq([S('B',parts)],reste)],[`${nombre(T)} − ${nombre(ecarts*d)} = ${nombre(reste)}`]);
    solve('B',B,[`${nombre(reste)} ÷ ${parts} = ${nombre(B)}`],`On partage le reste en ${parts} parts égales.`);
    solve('A',A,[triple?`${k} × ${nombre(B)} = ${nombre(A)}`:`${nombre(B)} + ${nombre(d)} = ${nombre(A)}`],'On reprend la première relation.');
    if(triple)solve('C',C,[`${nombre(B)} + ${nombre(d)} = ${nombre(C)}`],'On reprend la seconde relation.');
  } else if(p.famille==='lot') {
    add(2,'Utiliser le premier lot',r===1?'La première donnée donne directement une quantité.':`On partage le premier lot en ${r} parts égales.`,[eq([S('A')],A)],[`${nombre(U)} ÷ ${r} = ${nombre(A)}`],['A']);
    add(2,'Reconstituer la partie connue',`Dans le lot mixte, ${objets(p,'A',m)} ${m===1?'représente':'représentent'} ${mesure(p,m*A)}.`,[eq([N(m*A),S('B',n)],T)],[`${m} × ${nombre(A)} = ${nombre(m*A)}`]);
    add(3,'Retirer la partie connue',`Il reste ${objets(p,'B',n)}.`,[eq([S('B',n)],T-m*A)],[`${nombre(T)} − ${nombre(m*A)} = ${nombre(T-m*A)}`]);
    solve('B',B,[`${nombre(T-m*A)} ÷ ${n} = ${nombre(B)}`],`On partage le reste en ${n} parts égales.`);
  } else if(p.famille==='combinaison') {
    if(methode==='substitution') {
      const first=m===1?{b:n,total:T}:{b:p.q,total:U};
      const second=m===1?{a:r,b:p.q,total:U}:{a:m,b:n,total:T};
      // Moving the negative B term to the other side keeps all drawn quantities positive.
      add(2,'Isoler la première quantité',`Dans le lot qui contient ${objet(p,'A').article} ${objet(p,'A').article==='une'?'seule':'seul'} ${objet(p,'A').nom}, on retire ${objets(p,'B',first.b)}.`,[eq([S('A'),S('B',first.b,'remplacer')],first.total)],[`A = ${nombre(first.total)} − ${first.b===1?'B':first.b+'B'}`]);
      add(2,'Remplacer dans l’autre donnée','On remplace la première quantité par cette expression, puis on rassemble les parts de la seconde sorte.',[eq([S('A',second.a,'remplacer'),S('B',second.b)],second.total)],[`${second.a} × (${nombre(first.total)} − ${first.b===1?'B':first.b+'B'}) + ${second.b===1?'B':second.b+'B'} = ${nombre(second.total)}`]);
      const coeff=second.b-second.a*first.b, delta=second.total-second.a*first.total;
      add(2,'Garder des parts positives',coeff>0?'On retire la quantité connue des deux côtés.':`On ajoute ${objets(p,'B',-coeff)} des deux côtés, puis on retire ${mesure(p,second.total)} des deux côtés. L’égalité reste vraie.`,[eq([S('B',Math.abs(coeff))],Math.abs(delta))],[`${nombre(Math.max(second.total,second.a*first.total))} − ${nombre(Math.min(second.total,second.a*first.total))} = ${nombre(Math.abs(delta))}`]);
      solve('B',B,[`${nombre(Math.abs(delta))} ÷ ${Math.abs(coeff)} = ${nombre(B)}`],'On partage la différence en parts égales.');
      solve('A',A,[`${nombre(first.total)} − ${first.b} × ${nombre(B)} = ${nombre(A)}`],'On reprend le lot qui contient un seul objet de la première sorte.');
    } else {
      const g=pgcd(m,r),f1=r/g,f2=m/g,ac=m*f1,b1=n*f1,b2=p.q*f2,t1=T*f1,t2=U*f2;
      if(f1>1||f2>1)add(2,'Préparer des lots comparables',`On multiplie le lot 1 par ${f1} et le lot 2 par ${f2}. Chaque objet et chaque total sont multipliés.`,[eq(termes(ac,b1),t1,`Lot 1 × ${f1}`),eq(termes(ac,b2),t2,`Lot 2 × ${f2}`)],[`${f1} × ${nombre(T)} = ${nombre(t1)}`,`${f2} × ${nombre(U)} = ${nombre(t2)}`]);
      const commun=Math.min(b1,b2),delta=Math.abs(t1-t2),parts=Math.abs(b1-b2);
      add(2,'Repérer la partie commune',`Les deux lots contiennent la même partie : ${objets(p,'A',ac)} et ${objets(p,'B',commun)}.`,[eq([S('A',ac,'commun'),S('B',commun,'commun'),...(b1>commun?[S('B',b1-commun)]:[])],t1),eq([S('A',ac,'commun'),S('B',commun,'commun'),...(b2>commun?[S('B',b2-commun)]:[])],t2)]);
      add(2,'Retirer la partie commune',`La différence des deux lots correspond à ${objets(p,'B',parts)}.`,[eq([S('B',parts)],delta)],[`${nombre(Math.max(t1,t2))} − ${nombre(Math.min(t1,t2))} = ${nombre(delta)}`]);
      solve('B',B,[`${nombre(delta)} ÷ ${parts} = ${nombre(B)}`],'On partage la différence en parts égales.');
      add(3,'Retrouver la première quantité',`On retire ${objets(p,'B',n)} du lot 1, puis on partage le reste en ${m} part${m>1?'s':''} égale${m>1?'s':''}.`,[eq([S('A',m)],T-n*B),eq([S('A')],A)],[`${nombre(T)} − ${n} × ${nombre(B)} = ${nombre(T-n*B)}`,`${nombre(T-n*B)} ÷ ${m} = ${nombre(A)}`],['A']);
    }
  } else if(p.famille==='equilibre') {
    add(2,'Retirer les parts communes',`On retire ${p.c} ${p.c===1?objet(p,'A').nom:objet(p,'A').pluriel} de chaque côté. L’égalité reste vraie.`,[eq(termes(m-p.c,0,0,p.b),p.d)]);
    if(p.b)add(2,'Retirer la quantité connue',`On retire aussi ${mesure(p,p.b)} de chaque côté.`,[eq([S('A',m-p.c)],p.d-p.b)],[`${nombre(p.d)} − ${nombre(p.b)} = ${nombre(p.d-p.b)}`]);
    solve('A',A,[`${nombre(p.d-p.b)} ÷ ${m-p.c} = ${nombre(A)}`],`Il reste ${m-p.c} parts égales.`);
  }
  f.push({...frame(4,'Répondre et vérifier','On remplace chaque inconnue par sa valeur dans chacune des données de départ.',p.donnees,[],p.inconnues),verification:true});
  return f;
}
export function verifierEssai(p,essais) {
  if(p.inconnues.some(s=>!Number.isFinite(essais[s])||essais[s]<=0)) return null;
  const q={...p,valeurs:essais};return p.donnees.map(e=>({gauche:evaluer(e.gauche,q),droite:evaluer(e.droite,q),ok:Math.abs(evaluer(e.gauche,q)-evaluer(e.droite,q))<1e-8}));
}
