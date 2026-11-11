from chars import *
import random
W=3.5
def st(f='none'): return f'fill="{f}" stroke="{NAVY}" stroke-width="{W}" stroke-linejoin="round" stroke-linecap="round"'
O={}
# --- objets d'école
O['règle']=lambda: f'<g transform="rotate(-20)"><rect x="-50" y="-12" width="100" height="24" rx="3" {st(YEL)}/>'+''.join(f'<line x1="{x}" y1="-12" x2="{x}" y2="{-2 if i%2 else 2}" stroke="{NAVY}" stroke-width="2"/>' for i,x in enumerate(range(-42,46,9)))+'</g>'
O['compas']=lambda: f'<circle cx="0" cy="-36" r="7" {st("#9AA3B2")}/><rect x="-4" y="-50" width="8" height="10" {st(NAVY)}/><path d="M-3 -30 L-24 34 M3 -30 L22 30" {st()} /><path d="M-24 34 L-26 42" stroke="{NAVY}" stroke-width="2"/><path d="M22 30 L26 38" stroke="{NAVY}" stroke-width="5"/><path d="M-12 4 L12 4" {st()}/>'
O['gomme']=lambda: f'<g transform="rotate(-15)"><rect x="-34" y="-16" width="68" height="32" rx="6" {st("#F7A8B8")}/><rect x="-6" y="-16" width="40" height="32" rx="0" {st("#7CC4C9")}/></g>'
O['crayon']=lambda: f'<g transform="rotate(-35)"><path d="M-44 -9 L26 -9 L46 0 L26 9 L-44 9Z" {st(YEL)}/><path d="M26 -9 L26 9" {st()}/><path d="M39 -3 L46 0 L39 3Z" fill="{NAVY}"/><rect x="-52" y="-9" width="10" height="18" rx="3" {st("#F7A8B8")}/><line x1="-30" y1="0" x2="20" y2="0" stroke="{NAVY}" stroke-width="1.5" opacity="0.5"/></g>'
# --- objets divers
O['parapluie']=lambda: f'<path d="M-46 0 Q-46 -42 0 -44 Q46 -42 46 0 Q34 -10 23 0 Q11 -10 0 0 Q-11 -10 -23 0 Q-34 -10 -46 0Z" {st(CORAL)}/><path d="M0 -44 L0 -50" {st()}/><path d="M0 0 L0 34 Q0 44 -10 44 Q-18 44 -18 36" {st()}/>'
O['clé']=lambda: f'<circle cx="-26" cy="0" r="18" {st(YEL)}/><circle cx="-26" cy="0" r="6" {st("#FFFFFF")}/><path d="M-8 -5 L42 -5 L42 5 L36 5 L36 14 L28 14 L28 5 L-8 5Z" {st(YEL)}/>'
O['lunettes']=lambda: f'<rect x="-44" y="-12" width="36" height="28" rx="12" {st("#D6F1F7")}/><rect x="8" y="-12" width="36" height="28" rx="12" {st("#D6F1F7")}/><path d="M-8 -2 Q0 -8 8 -2 M-44 -6 L-52 -14 M44 -6 L52 -14" {st()}/>'
O['horloge']=lambda: f'<circle r="40" {st("#FFFFFF")}/><circle r="40" fill="none" stroke="{TEAL}" stroke-width="6"/><path d="M0 0 L0 -24 M0 0 L17 9" {st()}/><circle r="4" fill="{NAVY}"/>'+''.join(f'<circle cx="{30*math.cos(a):.1f}" cy="{30*math.sin(a):.1f}" r="2.6" fill="{NAVY}"/>' for a in [i*math.pi/6 for i in range(12)])
O['chaussure']=lambda: f'<path d="M-46 20 L-46 -20 Q-46 -26 -38 -26 L-20 -26 Q-14 -4 10 0 L32 4 Q48 8 48 20 Z" {st(TEAL)}/><path d="M-46 20 L48 20" stroke="{NAVY}" stroke-width="7" stroke-linecap="round"/><path d="M-16 -12 L-4 -16 M-12 -4 L0 -8" {st()}/>'
O['ballon']=lambda: soccer(0,0,36,'o'+str(random.randint(0,99999)))
O['tasse']=lambda: f'<path d="M-32 -24 L24 -24 L20 26 Q18 34 10 34 L-20 34 Q-28 34 -30 26Z" {st(TEAL)}/><path d="M23 -10 Q46 -8 40 10 Q36 22 19 20" {st()}/><path d="M-14 -34 Q-8 -42 -14 -50 M2 -34 Q8 -42 2 -50" {st()} opacity="0.6"/>'
O['ampoule']=lambda: f'<path d="M-12 18 Q-12 6 -22 -4 Q-30 -14 -28 -24 Q-24 -44 0 -44 Q24 -44 28 -24 Q30 -14 22 -4 Q12 6 12 18Z" {st(YEL)}/><rect x="-13" y="18" width="26" height="16" rx="3" {st("#9AA3B2")}/><path d="M-6 -6 L0 6 L6 -6" {st()}/>'
O['téléphone']=lambda: phone(0,0,12,1.6)
O['poisson']=lambda: f'<path d="M-34 0 Q0 -32 30 0 Q0 32 -34 0Z" {st("#F08A3C")}/><path d="M30 0 L48 -18 L48 18Z" {st("#F08A3C")}/><circle cx="-16" cy="-5" r="4" fill="{NAVY}"/><path d="M-2 -14 Q6 0 -2 14" {st()}/>'
O['bateau']=lambda: f'<path d="M-46 12 L46 12 L32 34 L-32 34Z" {st(CORAL)}/><path d="M0 12 L0 -44" {st()}/><path d="M4 -40 L38 4 L4 4Z" {st("#FFFFFF")}/><path d="M-4 -30 L-30 4 L-4 4Z" {st(YEL)}/>'
O['étoile']=lambda: '<path d="'+'M'+' L'.join(f'{(42 if i%2==0 else 18)*math.sin(i*math.pi/5):.1f} {-(42 if i%2==0 else 18)*math.cos(i*math.pi/5):.1f}' for i in range(10))+f'Z" {st(YEL)}/>'
# --- fruits
O['pomme']=lambda: f'<path d="M0 -22 Q-24 -36 -36 -12 Q-44 16 -20 36 Q-8 42 0 36 Q8 42 20 36 Q44 16 36 -12 Q24 -36 0 -22Z" {st("#E5484D")}/><path d="M-20 -14 Q-26 -4 -24 8" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.7" fill="none"/><path d="M0 -22 Q2 -32 6 -40" {st()}/><path d="M8 -34 Q24 -46 32 -32 Q18 -26 8 -34Z" {st(GREEN)}/>'
O['banane']=lambda: f'<path d="M-44 -26 Q-46 22 6 30 Q34 32 46 16 Q42 12 36 14 Q2 20 -22 -4 Q-32 -16 -34 -30 Z" {st(YEL)}/><path d="M-34 -30 L-38 -40 L-44 -38 L-44 -26" {st("#6B4A2B")}/><path d="M46 16 L50 22" {st()}/><path d="M-30 -6 Q-10 18 24 22" stroke="#E0B23A" stroke-width="3" fill="none"/>'
O['poire']=lambda: f'<path d="M0 -32 Q-14 -32 -14 -14 Q-14 -2 -26 10 Q-38 34 0 38 Q38 34 26 10 Q14 -2 14 -14 Q14 -32 0 -32Z" {st("#A8CF5E")}/><path d="M0 -32 Q0 -40 4 -46" {st()}/><path d="M6 -40 Q20 -48 24 -36 Q12 -32 6 -40Z" {st(GREEN)}/><path d="M-14 10 Q-18 20 -12 28" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.6"/>'
O['cerise']=lambda: f'<path d="M2 6 Q4 -24 14 -40" {st()}/><circle cx="0" cy="22" r="19" {st("#C81D3A")}/><circle cx="-6" cy="15" r="5" fill="#FFFFFF" opacity="0.7"/><path d="M14 -40 Q32 -46 38 -32 Q24 -28 14 -40Z" {st(GREEN)}/>'
O['fraise']=lambda: f'<path d="M-30 -18 Q-34 6 -12 30 Q0 42 12 30 Q34 6 30 -18 Q0 -30 -30 -18Z" {st("#E5484D")}/>'+''.join(f'<ellipse cx="{x}" cy="{y}" rx="2" ry="3" fill="{YEL}"/>' for x,y in [(-16,-6),(0,-10),(16,-6),(-20,8),(-4,4),(12,6),(-10,18),(6,20),(0,30)])+f'<path d="M-26 -20 L-14 -30 L-6 -20 L0 -32 L6 -20 L14 -30 L26 -20 Q0 -14 -26 -20Z" {st(GREEN)}/>'
# --- divers planche B
O['maison']=lambda: f'<path d="M-40 -4 L0 -40 L40 -4" {st()}/><rect x="-30" y="-8" width="60" height="44" {st(TEAL)}/><path d="M-40 -4 L0 -40 L40 -4Z" {st(CORAL)}/><rect x="-8" y="12" width="16" height="24" {st(YEL)}/><rect x="12" y="2" width="12" height="12" {st("#D6F1F7")}/>'
O['voiture']=lambda: f'<path d="M-46 16 L-46 -2 L-28 -6 L-16 -26 L18 -26 L30 -6 L46 -2 L46 16Z" {st(CORAL)}/><path d="M-12 -20 L-4 -6 M-20 -6 L-12 -20 L12 -20 L22 -6 Z" {st("#D6F1F7")}/><circle cx="-24" cy="18" r="11" {st(NAVY)}/><circle cx="24" cy="18" r="11" {st(NAVY)}/>'
O['chapeau']=lambda: f'<ellipse cx="0" cy="22" rx="48" ry="12" {st(LIL)}/><path d="M-26 20 L-22 -28 Q0 -36 22 -28 L26 20" {st(LIL)}/><path d="M-25 6 L25 6" stroke="{CORAL}" stroke-width="8"/>'
O['guitare']=lambda: f'<g transform="rotate(30) scale(0.85)"><rect x="-5" y="-64" width="10" height="46" {st("#8B6A45")}/><rect x="-10" y="-78" width="20" height="16" rx="4" {st(NAVY)}/><path d="M0 -20 Q-22 -22 -22 -2 Q-22 6 -15 10 Q-28 18 -26 34 Q-22 54 0 54 Q22 54 26 34 Q28 18 15 10 Q22 6 22 -2 Q22 -22 0 -20Z" {st("#F08A3C")}/><circle cx="0" cy="18" r="8" fill="{NAVY}"/><path d="M-9 40 L9 40" {st()}/></g>'
O['marteau']=lambda: f'<g transform="rotate(-25)"><rect x="-6" y="-14" width="12" height="62" rx="4" {st("#C08A55")}/><path d="M-32 -32 L30 -32 L30 -12 L-32 -12 Q-42 -22 -32 -32Z" {st("#9AA3B2")}/></g>'
O['sac']=lambda: f'<rect x="-30" y="-22" width="60" height="58" rx="14" {st("#5B8DEF")}/><path d="M-14 -22 Q-14 -44 0 -44 Q14 -44 14 -22" {st()}/><rect x="-18" y="4" width="36" height="22" rx="5" {st("#FFFFFF")}/>'
O['arbre']=lambda: f'<rect x="-7" y="6" width="14" height="36" {st("#8B6A45")}/><circle cx="0" cy="-14" r="30" {st(GREEN)}/><circle cx="-16" cy="-4" r="16" {st(GREEN)}/><circle cx="18" cy="-2" r="16" {st(GREEN)}/>'
O['nuage']=lambda: f'<path d="M-40 18 Q-52 18 -50 4 Q-48 -10 -32 -8 Q-28 -30 -6 -28 Q12 -40 26 -22 Q46 -24 46 -4 Q56 4 48 16 Q44 20 36 18 Z" {st("#FFFFFF")}/>'
O['cadeau']=lambda: f'<rect x="-32" y="-14" width="64" height="48" {st(LIL)}/><rect x="-38" y="-26" width="76" height="14" {st(LIL)}/><path d="M0 -26 L0 34" stroke="{CORAL}" stroke-width="9"/><path d="M0 -26 Q-24 -46 -16 -28 M0 -26 Q24 -46 16 -28" {st()}/>'
O['bougie']=lambda: f'<rect x="-12" y="-18" width="24" height="56" rx="3" {st("#FFFFFF")}/><path d="M0 -18 L0 -26" {st()}/><path d="M0 -50 Q12 -36 0 -26 Q-12 -36 0 -50Z" {st(YEL)}/>'
O['livre']=lambda: f'<path d="M0 -26 Q-22 -36 -46 -26 L-46 28 Q-22 18 0 28 Q22 18 46 28 L46 -26 Q22 -36 0 -26Z M0 -26 L0 28" {st(LIL)}/>'

O['fraise']=lambda: (f'<path d="M0 40 Q-14 34 -26 16 Q-38 -4 -30 -18 Q-20 -30 0 -26 Q20 -30 30 -18 Q38 -4 26 16 Q14 34 0 40Z" {st("#E5484D")}/>'
  +''.join(f'<path d="M{x} {y} q2 -4 0 -7 q-2 3 0 7Z" fill="#FFE38A" stroke="#B5862A" stroke-width="0.8"/>' for x,y in [(-18,-10),(-4,-14),(12,-12),(22,-2),(-22,4),(-8,0),(8,-2),(-14,16),(2,14),(16,12),(-4,28),(8,26)])
  +f'<path d="M-20 -18 Q-26 -34 -10 -28 Q-6 -42 0 -30 Q6 -42 10 -28 Q26 -34 20 -18 Q0 -12 -20 -18Z" {st(GREEN)}/><path d="M0 -32 L2 -44" {st()}/><path d="M-20 0 Q-22 10 -16 18" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55"/>')
O['fusée']=lambda: (f'<g transform="rotate(30)"><path d="M0 -50 Q20 -30 18 14 L-18 14 Q-20 -30 0 -50Z" {st("#FFFFFF")}/><path d="M0 -50 Q12 -40 15 -28 L-15 -28 Q-12 -40 0 -50Z" {st(CORAL)}/>'
  f'<circle cx="0" cy="-8" r="8" {st("#9FE3FF")}/><path d="M-18 0 L-30 22 L-18 18Z M18 0 L30 22 L18 18Z" {st(CORAL)}/><path d="M-8 16 Q0 40 8 16Z" {st(YEL)}/></g>')
O['cerf-volant']=lambda: (f'<path d="M0 -44 L30 -6 L0 30 L-30 -6Z" {st("#5B8DEF")}/><path d="M0 -44 L0 30 M-30 -6 L30 -6" stroke="{NAVY}" stroke-width="2.5"/><path d="M0 -44 L30 -6 L0 -6Z" fill="{YEL}" stroke="{NAVY}" stroke-width="2.5"/>'
  f'<path d="M0 30 Q-10 40 0 48 Q10 56 2 64" {st()}/><path d="M-6 40 L4 44 L-6 48Z M-2 54 L8 58 L-2 62Z" fill="{CORAL}"/>')
O['tambour']=lambda: (f'<ellipse cx="0" cy="-14" rx="34" ry="10" {st("#FFFFFF")}/><path d="M-34 -14 L-34 24 Q0 38 34 24 L34 -14 Q0 -2 -34 -14Z" {st(CORAL)}/><path d="M-34 -10 L-18 28 L0 -2 L18 28 L34 -10" fill="none" stroke="#FFFFFF" stroke-width="3"/>'
  f'<path d="M-14 -26 L-40 -50 M14 -26 L40 -50" stroke="#8B6A45" stroke-width="5" stroke-linecap="round"/><circle cx="-40" cy="-50" r="5" {st("#FFFFFF")}/><circle cx="40" cy="-50" r="5" {st("#FFFFFF")}/>')
O['lune']=lambda: f'<path d="M10 -40 A40 40 0 1 0 22 30 A32 32 0 1 1 10 -40Z" {st(YEL)}/><circle cx="-12" cy="6" r="4" fill="#E0B23A"/><circle cx="-2" cy="22" r="3" fill="#E0B23A"/>'
O['fleur']=lambda: (f'<path d="M0 14 Q4 34 0 48" fill="none" stroke="{NAVY}" stroke-width="4.5" stroke-linecap="round"/><path d="M2 32 Q18 22 24 30 Q14 40 2 36Z" {st(GREEN)}/>'
  +''.join(f'<ellipse cx="{16*math.cos(a):.1f}" cy="{-12+16*math.sin(a):.1f}" rx="11" ry="15" transform="rotate({math.degrees(a)+90:.0f} {16*math.cos(a):.1f} {-12+16*math.sin(a):.1f})" {st("#F7A8B8")}/>' for a in [i*2*math.pi/6 for i in range(6)])
  +f'<circle cx="0" cy="-12" r="10" {st(YEL)}/>')

def planche(names,seed,fname,hilite=(),w=1200,h=660,fixed=None):
    random.seed(seed)
    cols,rows=6,3; cw,ch=w/cols,h/rows
    slots=[(c,r) for r in range(rows) for c in range(cols)]
    random.shuffle(slots); slots=slots[:len(names)]
    order=names[:]; random.shuffle(order)
    if fixed:
        rest=[n for n in order if n not in fixed]; free=[(c,r) for r in range(rows) for c in range(cols) if (c,r) not in fixed.values()]
        random.shuffle(free); order=list(fixed.keys())+rest; slots=list(fixed.values())+free
    body=''
    for n,(c,r) in zip(order,slots):
        cx=cw*c+cw/2+random.uniform(-22,22); cy=ch*r+ch/2+random.uniform(-16,16)
        rot=random.uniform(-14,14); sc=1.32
        if n in hilite: body+=f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="70" fill="none" stroke="{CORAL}" stroke-width="9"/>'
        body+=f'<g transform="translate({cx:.0f} {cy:.0f}) rotate({rot:.0f}) scale({sc})">{O[n]()}</g>'
    save(fname,svg(w,h,body,bg='#FFFFFF'))
A=['règle','compas','gomme','crayon','parapluie','clé','lunettes','horloge','chaussure','ballon','tasse','ampoule','téléphone','poisson','bateau','étoile','lune','fleur']
B=['pomme','banane','poire','cerise','fraise','maison','voiture','chapeau','guitare','marteau','sac','fusée','nuage','cadeau','bougie','livre','cerf-volant','tambour']
assert len(set(A))==18 and len(set(B))==18
FIX={'règle':(1,0),'gomme':(4,1),'crayon':(0,2),'compas':(3,2)}
planche(A,21,'planche_A',fixed=FIX); planche(A,21,'planche_A_rep',hilite={'règle','compas','gomme','crayon'},fixed=FIX)
planche(B,33,'planche_B'); planche(B,33,'planche_B_rep',hilite={'pomme','banane','poire','cerise','fraise'})
print('ok')
