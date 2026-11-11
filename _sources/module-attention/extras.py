from chars import *
exec(open('objects2.py').read().split("def planche")[0].split("from chars import *")[1])
def target(cx,cy,R=90):
    s=''
    for k,c in enumerate([CORAL,'#FFFFFF',CORAL,'#FFFFFF',CORAL]):
        r=R*(1-k*0.22); s+=f'<circle cx="{cx}" cy="{cy}" r="{r:.1f}" fill="{c}"/>'
    return s+f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="{NAVY}" stroke-width="2"/>'
def person_bust(cx,cy,gaze=(1,0)):
    s=f'<path d="M{cx-80} {cy+210} Q{cx-80} {cy+90} {cx} {cy+88} Q{cx+80} {cy+90} {cx+80} {cy+210} Z" fill="{TEAL}" stroke="{NAVY}" stroke-width="{SW}"/>'
    s+=head(cx,cy,62,SKIN[1],HAIR[0],'short',gaze=gaze,mouth='smile',brows='focus')
    return s
# --- schéma séance 1
def schema1():
    b=''
    for n,(x,y) in [('ballon',(900,64)),('téléphone',(720,56)),('horloge',(1040,110)),('voiture',(560,395)),('étoile',(1010,380)),('poisson',(780,405))]:
        b+=f'<g transform="translate({x} {y}) scale(0.85)" opacity="0.62">{O[n]()}</g>'
    b+=person_bust(150,200)
    b+=f'<line x1="200" y1="208" x2="700" y2="208" stroke="{CORAL}" stroke-width="7" stroke-dasharray="4 16" stroke-linecap="round"/>'
    b+=target(790,208)
    b+=f'<text x="790" y="338" font-family="Arial" font-weight="bold" font-size="34" fill="{NAVY}" text-anchor="middle">ma CIBLE</text>'
    b+=f'<rect x="300" y="84" width="340" height="88" rx="16" fill="#FFFFFF" stroke="{NAVY}" stroke-width="4"/>'
    b+=f'<text x="470" y="122" font-family="Arial" font-weight="bold" font-size="29" fill="{NAVY}" text-anchor="middle">mon INTENTION</text>'
    b+=f'<text x="470" y="157" font-family="Arial" font-size="29" fill="{NAVY}" text-anchor="middle">ce que je dois en faire</text>'
    b+=f'<text x="1080" y="236" font-family="Arial" font-size="29" fill="#4A5568" text-anchor="end" font-style="italic">le reste :</text><text x="1080" y="264" font-family="Arial" font-size="29" fill="#4A5568" text-anchor="end" font-style="italic">mis de côté</text>'
    save('schema1',svg(1100,440,b))
# --- schéma séance 2
def schema2():
    b=person_bust(160,220)
    b+=f'<line x1="214" y1="228" x2="700" y2="228" stroke="{CORAL}" stroke-width="7" stroke-dasharray="4 16" stroke-linecap="round"/>'
    b+=target(790,228)
    b+=f'<text x="790" y="358" font-family="Arial" font-weight="bold" font-size="32" fill="{NAVY}" text-anchor="middle">ma CIBLE</text>'
    # externes
    ext=[(430,64,phone(0,0,10,1.3)),(620,60,'<text x="0" y="12" font-family="Arial" font-weight="bold" font-size="38" fill="#1D2B4F" text-anchor="middle">psst !</text>'),(840,52,f'<g transform="scale(0.8)">{O["règle"]()}</g><text x="0" y="62" font-family="Arial" font-weight="bold" font-size="28" fill="#1D2B4F" text-anchor="middle">clac !</text>')]
    for x,y,g in ext:
        b+=f'<g transform="translate({x} {y})">{g}</g>'
    for x,y in [(400,92),(570,78),(780,96)]:
        b+=f'<path d="M{x} {y} Q{(x+230)/2} {y-10} {238} {166}" fill="none" stroke="#7A8496" stroke-width="4" stroke-dasharray="10 8" marker-end="url(#ar)"/>'
    b='<defs><marker id="ar" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto"><path d="M0 0 L12 6 L0 12Z" fill="#7A8496"/></marker></defs>'+b
    b+=f'<text x="1090" y="60" font-family="Arial" font-weight="bold" font-size="30" fill="{NAVY}" text-anchor="end">distracteurs</text><text x="1090" y="92" font-family="Arial" font-weight="bold" font-size="30" fill="{NAVY}" text-anchor="end">EXTERNES</text>'
    # internes
    b+=f'<ellipse cx="330" cy="410" rx="150" ry="56" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3.5"/><circle cx="236" cy="336" r="9" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3"/><circle cx="220" cy="310" r="6" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3"/>'
    b+=f'<text x="330" y="402" font-family="Arial" font-size="28" fill="{NAVY}" text-anchor="middle" font-style="italic">« J\'ai faim… »</text><text x="330" y="434" font-family="Arial" font-size="28" fill="{NAVY}" text-anchor="middle" font-style="italic">« Et ce midi ? »</text>'
    b+=f'<text x="500" y="420" font-family="Arial" font-weight="bold" font-size="30" fill="{NAVY}">distracteurs INTERNES</text>'
    save('schema2',svg(1100,480,b))
# --- étoile rouge
def star(cx,cy,R,col='#E5484D'):
    pts=' L'.join(f'{cx+(R if i%2==0 else R*0.45)*math.sin(i*math.pi/5):.1f} {cy-(R if i%2==0 else R*0.45)*math.cos(i*math.pi/5):.1f}' for i in range(10))
    return f'<path d="M{pts}Z" fill="{col}" stroke="#FFFFFF" stroke-width="3"/>'
def cat(cx,cy):
    return (f'<g transform="translate({cx} {cy})"><path d="M-40 -10 L-34 -52 L-10 -30 Q0 -34 10 -30 L34 -52 L40 -10 Q44 30 0 36 Q-44 30 -40 -10Z" fill="#F08A3C" stroke="#FFFFFF" stroke-width="4"/>'
            f'<circle cx="-14" cy="-4" r="6" fill="{NAVY}"/><circle cx="14" cy="-4" r="6" fill="{NAVY}"/><path d="M-5 10 L5 10 L0 16Z" fill="{CORAL}"/><path d="M-30 12 L-56 6 M-30 18 L-56 22 M30 12 L56 6 M30 18 L56 22" stroke="#FFFFFF" stroke-width="3"/></g>')
def etoile(name,extra=''):
    b=star(600,300,70)+extra
    save(name,svg(1200,600,b,bg='#1D2B4F'))
def nombre(cx,cy): return f'<circle cx="{cx}" cy="{cy}" r="38" fill="#E86FB0"/><text x="{cx}" y="{cy+14}" font-family="Arial" font-weight="bold" font-size="40" fill="#FFFFFF" text-anchor="middle">14</text>'
etoile('etoile_0')
etoile('etoile_1',nombre(1040,500))
etoile('etoile_2',cat(170,120))
etoile('etoile_3',f'<g transform="translate(980 110)"><circle r="44" fill="#FFFFFF"/>{soccer(0,0,40,"e3")}</g>')
etoile('etoile_rep',nombre(1040,500)+cat(170,120)+f'<g transform="translate(980 110)"><circle r="44" fill="#FFFFFF"/>{soccer(0,0,40,"e4")}</g>')
# --- pensoscope
def penso():
    b=f'<circle cx="300" cy="300" r="230" fill="none" stroke="{NAVY}" stroke-width="16"/>'
    b+=f'<circle cx="300" cy="70" r="22" fill="{CORAL}" stroke="{NAVY}" stroke-width="4"/>'
    b+=f'<path d="M352 60 Q400 70 430 100" fill="none" stroke="{CORAL}" stroke-width="8" stroke-linecap="round"/><path d="M418 76 L438 108 L402 104Z" fill="{CORAL}"/>'
    b+=f'<text x="300" y="38" font-family="Arial" font-weight="bold" font-size="28" fill="{NAVY}" text-anchor="middle">départ</text>'
    save('pensoscope',svg(600,600,b,bg='#FFFFFF'))
schema1(); schema2(); penso()
print('ok')
