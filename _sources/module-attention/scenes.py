from chars import *
import sys
def basketball(cx,cy,r):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#F08A3C" stroke="{NAVY}" stroke-width="{SW}"/>'
            +stroke(f'M{cx-r} {cy} L{cx+r} {cy} M{cx} {cy-r} L{cx} {cy+r}',NAVY,2.5)
            +stroke(f'M{cx-r*0.7} {cy-r*0.7} Q{cx-r*0.2} {cy} {cx-r*0.7} {cy+r*0.7} M{cx+r*0.7} {cy-r*0.7} Q{cx+r*0.2} {cy} {cx+r*0.7} {cy+r*0.7}',NAVY,2.5))

def sc_volant(G):
    b=f'<rect x="0" y="430" width="800" height="130" fill="#8A93A3"/>'
    for x in range(10,800,95): b+=f'<rect x="{x}" y="490" width="52" height="10" rx="5" fill="#FFFFFF"/>'
    for i in range(6): b+=f'<rect x="{610+i*30}" y="430" width="18" height="130" fill="#F3F4F6"/>'
    # enfant qui traverse
    cx=700
    b+=leg([(cx-10,350),(cx-22,385),(cx-30,425)],BLUE,w=16,shoe_dir=-1)+leg([(cx+10,350),(cx+18,388),(cx+28,425)],BLUE,w=16)
    b+=torso(cx,272,58,84,YEL)
    b+=arm([(cx-24,282),(cx-34,318),(cx-28,350)],YEL,SKIN[1],w=13)+arm([(cx+24,282),(cx+38,312),(cx+52,326)],YEL,SKIN[1],w=13)
    b+=head(cx,232,30,SKIN[1],HAIR[0],'curly',gaze=(-0.6,0.2),mouth='smile')
    # voiture
    b+=f'<path d="M40 410 L40 330 Q42 296 92 290 L180 282 L236 205 Q248 190 272 190 L452 190 Q478 190 492 210 L540 284 L598 294 Q632 302 634 334 L634 410 Z" fill="{TEAL}" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
    b+=f'<path d="M250 284 L284 212 L520 212 L560 284 Z" fill="#D6F1F7" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
    # conducteur
    dx=440
    b+=torso(dx,300,80,80,CORAL)
    b+=head(dx,250,34,SKIN[3],HAIR[1],'short',gaze=(-0.9,0.8),mouth='flat',tilt=-14)
    b+=arm([(dx-34,312),(dx-62,318),(dx-80,292)],CORAL,SKIN[3],w=14)
    b+=phone(dx-84,270,-12,1.05)
    # volant
    b+=stroke(f'M520 300 L548 250',NAVY,7)+f'<ellipse cx="548" cy="248" rx="9" ry="30" fill="none" stroke="{NAVY}" stroke-width="7" transform="rotate(25 548 248)"/>'
    # bas de porte par-dessus
    b+=f'<path d="M40 410 L40 330 Q42 296 92 290 L250 284 L560 284 L598 294 Q632 302 634 334 L634 410 Z" fill="{TEAL}" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
    b+=stroke('M360 300 L360 400',NAVY,3)+f'<rect x="300" y="316" width="34" height="8" rx="4" fill="{NAVY}"/>'
    b+=f'<rect x="608" y="322" width="26" height="18" rx="5" fill="{YEL}" stroke="{NAVY}" stroke-width="3"/>'
    for cx_ in (150,520): b+=f'<circle cx="{cx_}" cy="414" r="46" fill="{NAVY}"/><circle cx="{cx_}" cy="414" r="20" fill="#C9CED6"/>'
    if G: b+=gaze_line(dx-6,252,dx-84,262)
    return svg(800,560,b,bg='#EAF6F7')

def sc_basket(G):
    b=f'<rect x="0" y="440" width="800" height="120" fill="#E3B47A"/>'+stroke('M0 470 L800 470',"#FFFFFF",4)
    # panier
    b+=f'<rect x="700" y="80" width="18" height="380" fill="#9AA3B2" stroke="{NAVY}" stroke-width="{SW}"/>'
    b+=f'<rect x="600" y="70" width="104" height="96" rx="6" fill="#FFFFFF" stroke="{NAVY}" stroke-width="{SW}"/><rect x="626" y="110" width="52" height="40" fill="none" stroke="{CORAL}" stroke-width="4"/>'
    b+=f'<path d="M560 178 L586 244 L612 244 L638 178" fill="none" stroke="{NAVY}" stroke-width="2.5"/><path d="M572 178 L594 244 M626 178 L604 244 M560 178 L612 244 M638 178 L586 244" stroke="{NAVY}" stroke-width="2" opacity="0.7"/>'
    b+=f'<ellipse cx="599" cy="178" rx="42" ry="9" fill="none" stroke="{CORAL}" stroke-width="6"/>'
    # joueuse
    cx=300
    b+=leg([(cx-16,370),(cx-26,410),(cx-34,452)],NAVY,w=19,shoe_dir=-1)+leg([(cx+16,370),(cx+22,410),(cx+26,452)],NAVY,w=19)
    b+=torso(cx,262,78,112,CORAL)
    b+=f'<text x="{cx}" y="330" font-family="Arial" font-weight="bold" font-size="36" fill="#FFFFFF" text-anchor="middle">7</text>'
    b+=head(cx-8,222,38,SKIN[0],HAIR[0],'ponytail',gaze=(0.95,-0.7),mouth='flat',tilt=10,brows='focus')
    b+=arm([(cx+12,278),(cx+58,236),(cx+86,192)],CORAL,SKIN[0],w=15)+arm([(cx+34,278),(cx+80,244),(cx+112,200)],CORAL,SKIN[0],w=15)
    b+=basketball(cx+104,160,34)
    if G: b+=gaze_line(cx+12,222,599,178)
    return svg(800,560,b,bg='#EAF6F7')

def sc_console(G):
    b=f'<rect x="0" y="430" width="800" height="130" fill="#C9B79C"/>'
    b+=f'<rect x="60" y="60" width="150" height="110" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3"/><path d="M75 155 L115 110 L140 135 L165 100 L195 155Z" fill="{GREEN}"/><circle cx="170" cy="85" r="10" fill="{YEL}"/>'
    # meuble + télé
    b+=f'<rect x="500" y="350" width="270" height="90" rx="6" fill="#8B6A45" stroke="{NAVY}" stroke-width="{SW}"/>'
    b+=f'<rect x="510" y="150" width="250" height="180" rx="10" fill="{NAVY}"/><rect x="524" y="164" width="222" height="152" fill="#9FE3FF"/>'
    b+=f'<rect x="524" y="276" width="222" height="40" fill="{GREEN}"/><rect x="600" y="236" width="60" height="18" fill="#B07A4C"/><rect x="560" y="246" width="22" height="30" rx="4" fill="{CORAL}"/><circle cx="571" cy="240" r="9" fill="{CORAL}"/><circle cx="690" cy="220" r="10" fill="{YEL}" stroke="{NAVY}" stroke-width="2"/><circle cx="720" cy="220" r="10" fill="{YEL}" stroke="{NAVY}" stroke-width="2"/>'
    b+=f'<rect x="625" y="330" width="20" height="22" fill="{NAVY}"/>'
    # pouf
    b+=f'<path d="M140 440 Q120 340 220 330 Q330 320 340 440 Z" fill="{LIL}" stroke="{NAVY}" stroke-width="{SW}"/>'
    cx=240
    b+=leg([(cx-14,392),(cx-6,430),(cx-30,448)],BLUE,w=18,shoe_dir=-1)+leg([(cx+14,392),(cx+40,420),(cx+58,446)],BLUE,w=18)
    b+=torso(cx,286,76,110,TEAL)
    b+=arm([(cx-32,300),(cx-30,350),(cx+16,350)],TEAL,SKIN[2],w=14)+arm([(cx+32,300),(cx+50,344),(cx+44,350)],TEAL,SKIN[2],w=14)
    b+=controller(cx+30,350,1.0)
    b+=head(cx,240,40,SKIN[2],HAIR[2],'short',gaze=(1,0.05),mouth='tongue',tilt=6,brows='focus')
    if G: b+=gaze_line(cx+18,244,630,230)
    return svg(800,560,b,bg='#F4EEE4')

def bird(x,y):
    return (f'<ellipse cx="{x}" cy="{y}" rx="30" ry="21" fill="{YEL}" stroke="{NAVY}" stroke-width="3"/><circle cx="{x+24}" cy="{y-16}" r="14" fill="{YEL}" stroke="{NAVY}" stroke-width="3"/>'
            f'<path d="M{x+36} {y-18} L{x+52} {y-13} L{x+36} {y-8}Z" fill="{CORAL}" stroke="{NAVY}" stroke-width="2"/><circle cx="{x+28}" cy="{y-19}" r="3" fill="{NAVY}"/>'
            +stroke(f'M{x-14} {y-6} Q{x} {y-30} {x+12} {y-6}',NAVY,3)+stroke(f'M{x-8} {y+20} L{x-12} {y+32} M{x+6} {y+20} L{x+4} {y+32}',NAVY,3))

def teacher(cx,base,point=True,gaze=(0.8,0),mouth='talk'):
    s=leg([(cx-16,base-110),(cx-20,base-55),(cx-22,base)],'#4A5568',w=20,shoe_dir=-1)+leg([(cx+16,base-110),(cx+20,base-55),(cx+22,base)],'#4A5568',w=20)
    s+=torso(cx,base-236,92,132,'#6B8F71')
    if point is True: s+=arm([(cx-38,base-222),(cx-80,base-250),(cx-120,base-286)],'#6B8F71',SKIN[4],w=16)
    else: s+=arm([(cx-38,base-222),(cx-46,base-170),(cx-40,base-128)],'#6B8F71',SKIN[4],w=16)
    if point=='right': s+=arm([(cx+38,base-222),(cx+80,base-250),(cx+112,base-286)],'#6B8F71',SKIN[4],w=16)
    else: s+=arm([(cx+38,base-222),(cx+48,base-170),(cx+40,base-128)],'#6B8F71',SKIN[4],w=16)
    s+=head(cx,base-284,40,SKIN[4],'#7A5230','short',gaze=gaze,mouth=mouth)
    s+=stroke(f'M{cx+52} {base-262} l14 -6 M{cx+54} {base-250} l16 0 M{cx+52} {base-238} l14 6',NAVY,3)
    return s

def sc_classe(G):
    b=f'<rect x="0" y="470" width="800" height="90" fill="#D8C3A5"/>'
    b+=board(20,50,270,190,['3 × 7 = 21','4 × 7 = …'])
    b+=teacher(345,470,point=True,gaze=(0.9,0.1))
    # fenêtre + oiseau
    b+=f'<rect x="640" y="40" width="150" height="200" rx="6" fill="#BFE6F5" stroke="{NAVY}" stroke-width="{SW}"/>'+stroke('M715 40 L715 240 M640 140 L790 140',NAVY,SW)
    b+=bird(690,100)
    # élève
    cx=585
    b+=seated(cx,450,SKIN[5],HAIR[0],'short',YEL,BLUE,gaze=(0.9,-0.9),mouth='smile',tilt=-14,arms=None)
    b+=desk(cx-90,400,180)
    b+=arm([(cx-32,330),(cx-46,380),(cx-20,398)],YEL,SKIN[5])+arm([(cx+32,330),(cx+44,380),(cx+18,398)],YEL,SKIN[5])
    b+=f'<rect x="{cx-56}" y="392" width="70" height="8" fill="#FFFFFF" stroke="{NAVY}" stroke-width="2"/>'
    if G: b+=gaze_line(cx+6,282,686,100)
    return svg(800,560,b,bg='#F4F1EA')

def sc_posture(G):
    W=1600
    b=f'<rect x="0" y="500" width="{W}" height="100" fill="#D8C3A5"/>'
    b+=board(200,60,290,190,['2𝑥 + 5 = 11'])
    b+=teacher(110,500,point='right',gaze=(1,0.1))
    xs=[640,900,1160,1420]
    if G:
        b+=gaze_line(xs[3]+14,312,1560,300,'#9AA3B2')
        b+=gaze_line(xs[1]-12,312,420,150)
        b+=gaze_line(xs[2]-12,312,430,105)
    # élève 2 : attentive ; élève 3 : regard au tableau, tête au foot ; élève 4 : bavarde avec un voisin hors cadre
    b+=seated(xs[1],480,SKIN[0],HAIR[0],'bun',TEAL,NAVY,gaze=(-1,0),mouth='smile',arms=None)
    b+=seated(xs[2],480,SKIN[4],HAIR[2],'short',CORAL,BLUE,gaze=(-1,0),mouth='smile',arms=None)
    b+=bubble_think(xs[2]+40,110,150,110,soccer(xs[2]+40,110,36,'p3'),(xs[2]+10,240))
    b+=seated(xs[3],480,SKIN[1],HAIR[0],'curly',YEL,BLUE,gaze=(1,0),mouth='talk',tilt=12,arms=None)
    # voisin à moitié visible, qui bavarde aussi
    b+=seated(1600,480,SKIN[5],HAIR[1],'short','#9AA3B2',NAVY,gaze=(-1,0),mouth='talk',tilt=-10,arms=None)
    b+=bubble_talk(xs[3]-10,110,150,56,'bla bla',(xs[3]+30,250))
    # élève 1 : allongé sur la table, pense à sa console
    cx=xs[0]
    b+=torso(cx,370,80,70,LIL)
    for x in xs+[1600]:
        b+=desk(x-95,430,190)
    for x,sk,sh in [(xs[1],SKIN[0],TEAL),(xs[2],SKIN[4],CORAL),(xs[3],SKIN[1],YEL)]:
        b+=arm([(x-32,360),(x-46,410),(x-20,428)],sh,sk)+arm([(x+32,360),(x+44,410),(x+18,428)],sh,sk)
    b+=f'<rect x="{xs[1]-56}" y="422" width="70" height="8" fill="#FFFFFF" stroke="{NAVY}" stroke-width="2"/>'
    b+=f'<rect x="{cx-80}" y="398" width="160" height="34" rx="17" fill="{LIL}" stroke="{NAVY}" stroke-width="{SW}"/>'
    b+=head(cx+6,368,36,SKIN[3],HAIR[1],'short',gaze=(0.6,-1),mouth='flat',tilt=-62,eyes='half')
    b+=bubble_think(cx+60,170,150,100,controller(cx+60,172,1.1),(cx+20,320))
    for i,x in enumerate(xs):
        b+=f'<circle cx="{x}" cy="560" r="26" fill="{NAVY}"/><text x="{x}" y="571" font-family="Arial" font-weight="bold" font-size="30" fill="#FFFFFF" text-anchor="middle">{i+1}</text>'
    return svg(W,600,b,bg='#F4F1EA')

for name,f in [('sit_volant',sc_volant),('sit_basket',sc_basket),('sit_console',sc_console),('sit_classe',sc_classe),('posture',sc_posture)]:
    save(name,f(True)); save(name+'_q',f(False))
print('ok')
