import {startLevel,contactsOf} from './engine.mjs';

export const CHAPTERS = [
  {name:'Le premier courant',tone:'matin'},
  {name:'Trouver le passage',tone:'jour'},
  {name:'Sur le fil',tone:'ambre'},
  {name:'Tout faire tenir',tone:'soir'},
];

export const LEVELS = [
  {id:1,title:'La première pile',chapter:0,bases:[{x:360,y:80,w:144}],pieces:['flat','round','small'],
    clue:'Pose chaque galet sur une face assez large.',intro:'Déplace le galet, puis pose-le. Les suivants t’attendent en bas.'},
  {id:2,title:'Le contrepoids',chapter:0,bases:[{x:360,y:80,w:90}],setup:[{kind:'flat',x:384},{kind:'flat',x:414}],pieces:['heavy','small'],
    clue:'Le haut dépasse à droite. Ramène du poids vers la gauche.',intro:'La pile tient déjà… mais elle est déportée.'},
  {id:3,title:'L’autre face',chapter:0,bases:[{x:360,y:80,w:70}],setup:[{kind:'flat',x:372}],pieces:['shoulder','heavy'],
    clue:'Retourne le premier galet pour ouvrir un appui vers la gauche.',intro:'Regarde le petit appui du dessus. Tu peux retourner ce galet.'},
  {id:4,title:'Un coup d’avance',chapter:1,bases:[{x:360,y:80,w:78}],pieces:['step','shoulder','heavy'],
    clue:'Les petites faces du dessus peuvent se décaler en sens opposés.',intro:'Le dernier galet est lourd. Prépare-lui une place.'},
  {id:5,title:'D’une rive à l’autre',chapter:1,goal:'connect',bases:[{x:280,y:80,w:58},{x:440,y:80,w:58}],pieces:['small','small','bridge'],
    clue:'Un petit galet sur chaque rocher prépare les deux extrémités du pont.',intro:'Relie les deux rochers avec tous tes galets.'},
  {id:6,title:'La marche',chapter:1,goal:'connect',bases:[{x:282,y:80,w:62},{x:438,y:107,w:62}],pieces:['flat','bridge','heavy'],
    clue:'Le premier galet peut mettre les deux appuis à la même hauteur.',intro:'Les deux rochers ne sont pas à la même hauteur.'},
  {id:7,title:'L’épaule du rocher',chapter:2,bases:[{x:360,y:80,w:72}],setup:[{kind:'flat',x:378}],pieces:['shoulder','small','heavy'],
    clue:'Garde le poids près du socle, même si le prochain appui part sur le côté.',intro:'Une pose qui tient peut fermer la suite.'},
  {id:8,title:'Le retour du poids',chapter:2,bases:[{x:360,y:80,w:76}],setup:[{kind:'step',x:354}],pieces:['flat','shoulder','heavy'],
    clue:'Un grand galet posé trop loin déplace aussi le poids des étages du dessous.',intro:'Le socle est étroit. Pense à toute la pile.'},
  {id:9,title:'Les deux épaules',chapter:2,goal:'connect',bases:[{x:292,y:80,w:58},{x:428,y:80,w:58}],pieces:['slope','small','slope','small','bridge'],
    clue:'Prépare deux piles de même hauteur. Rapproche leurs petits appuis du passage.',intro:'Cinq galets pour réunir les deux rives.'},
  {id:10,title:'Le dernier mot',chapter:3,bases:[{x:360,y:80,w:76}],setup:[{kind:'slope',x:354}],pieces:['step','flat','shoulder','heavy'],
    clue:'Observe le premier appui : il faudra compenser ce décalage avant le dernier galet.',intro:'Chaque pose prépare la suivante.'},
  {id:11,title:'La couronne',chapter:3,bases:[{x:360,y:80,w:76}],setup:[{kind:'flat',x:354}],pieces:['shoulder','step','small','heavy','crown'],
    clue:'Le petit galet doit rester assez près du socle pour porter les deux derniers.',intro:'Tout le poids du sommet compte.'},
  {id:12,title:'L’équilibre des rives',chapter:3,goal:'connect',bases:[{x:286,y:80,w:60},{x:434,y:108,w:60}],pieces:['small','slope','slope','bridge','heavy'],
    clue:'Comble d’abord la différence de hauteur, puis prépare deux épaules tournées vers le centre.',intro:'Un dernier passage. Fais tenir les cinq galets et relie les rochers.'},
];

export function goalReached(level,stones) {
  if(level.goal!=='connect') return true;
  const edges=contactsOf(stones),visited=new Set(['base-0']);let changed=true;
  while(changed){changed=false;for(const c of edges){
    if(visited.has(c.upper)&&!visited.has(c.lower)){visited.add(c.lower);changed=true;}
    if(visited.has(c.lower)&&!visited.has(c.upper)){visited.add(c.upper);changed=true;}
  }}
  return level.bases.every((_,i)=>visited.has('base-'+i));
}
