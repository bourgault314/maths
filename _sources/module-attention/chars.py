import math, subprocess
NAVY='#1D2B4F'; TEAL='#7CC4C9'; TEALD='#1F6F78'; CORAL='#EF6F6C'; YEL='#FFD35C'
SKY='#EAF6F7'; GRAY='#C9CED6'; WHITE='#FFFFFF'; BLUE='#3B6FB6'; LIL='#B9A6E0'; GREEN='#7FBF6E'
SKIN=['#8D5524','#C68642','#E0AC69','#6B4423','#F1C27D','#A8693C']
HAIR=['#1D2B4F','#3A2416','#5A3A22','#111827']
OUT='img'
SW=3.5
def svg(w,h,b,bg=None):
    r=f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{r}{b}</svg>'
def save(name,s,z=2):
    open(f'{OUT}/{name}.svg','w').write(s)
    subprocess.run(['rsvg-convert','-z',str(z),f'{OUT}/{name}.svg','-o',f'{OUT}/{name}.png'],check=True)
def P(pts): return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)
def stroke(d,col,w,extra=''): return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'

def head(cx,cy,r,skin,hair=HAIR[0],style='short',gaze=(0,0),mouth='smile',tilt=0,eyes='open',brows='normal'):
    g=f'<g transform="rotate({tilt} {cx} {cy+r*0.9})">'
    # cheveux arrière
    if style in('long','ponytail'):
        g+=f'<path d="M{cx-r*1.05} {cy} Q{cx-r*1.15} {cy+r*1.25} {cx-r*0.7} {cy+r*1.3} L{cx+r*0.7} {cy+r*1.3} Q{cx+r*1.15} {cy+r*1.25} {cx+r*1.05} {cy} Z" fill="{hair}" stroke="{NAVY}" stroke-width="{SW}"/>'
    if style=='ponytail':
        g+=f'<path d="M{cx+r*0.8} {cy-r*0.6} Q{cx+r*1.7} {cy-r*0.4} {cx+r*1.4} {cy+r*0.8} Q{cx+r*1.2} {cy} {cx+r*0.8} {cy-r*0.2}Z" fill="{hair}" stroke="{NAVY}" stroke-width="{SW}"/>'
    if style=='bun':
        g+=f'<circle cx="{cx}" cy="{cy-r*1.08}" r="{r*0.42}" fill="{hair}" stroke="{NAVY}" stroke-width="{SW}"/>'
    # oreilles
    for sx in(-1,1):
        g+=f'<ellipse cx="{cx+sx*r*0.98}" cy="{cy+r*0.12}" rx="{r*0.17}" ry="{r*0.22}" fill="{skin}" stroke="{NAVY}" stroke-width="{SW}"/>'
    g+=f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*1.04}" fill="{skin}" stroke="{NAVY}" stroke-width="{SW}"/>'
    # cheveux dessus
    if style in('short','bun','long','ponytail'):
        g+=f'<path d="M{cx-r*1.02} {cy-r*0.05} Q{cx-r*1.05} {cy-r*1.12} {cx} {cy-r*1.1} Q{cx+r*1.05} {cy-r*1.12} {cx+r*1.02} {cy-r*0.05} Q{cx+r*0.75} {cy-r*0.62} {cx+r*0.15} {cy-r*0.52} Q{cx-r*0.35} {cy-r*0.72} {cx-r*0.55} {cy-r*0.45} Q{cx-r*0.85} {cy-r*0.35} {cx-r*1.02} {cy-r*0.05}Z" fill="{hair}" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
    elif style=='curly':
        for a in range(-170,-5,22):
            t=math.radians(a); g+=f'<circle cx="{cx+r*0.92*math.cos(t)}" cy="{cy+r*0.92*math.sin(t)}" r="{r*0.3}" fill="{hair}" stroke="{NAVY}" stroke-width="{SW-1}"/>'
        g+=f'<ellipse cx="{cx}" cy="{cy-r*0.62}" rx="{r*0.8}" ry="{r*0.4}" fill="{hair}"/>'
    elif style=='bald':
        pass
    # yeux
    ex=r*0.36; ey=cy+r*0.08; gx,gy=gaze
    for sx in(-1,1):
        x=cx+sx*ex
        if eyes=='open':
            g+=f'<ellipse cx="{x}" cy="{ey}" rx="{r*0.19}" ry="{r*0.23}" fill="#FFFFFF" stroke="{NAVY}" stroke-width="2.4"/>'
            px=x+gx*r*0.085; py=ey+gy*r*0.1
            g+=f'<circle cx="{px}" cy="{py}" r="{r*0.11}" fill="{NAVY}"/><circle cx="{px-r*0.035}" cy="{py-r*0.04}" r="{r*0.035}" fill="#FFFFFF"/>'
        elif eyes=='half':
            g+=f'<path d="M{x-r*0.19} {ey} A{r*0.19} {r*0.2} 0 0 0 {x+r*0.19} {ey} Z" fill="#FFFFFF" stroke="{NAVY}" stroke-width="2.4"/>'
            px=x+gx*r*0.08; g+=f'<circle cx="{px}" cy="{ey+r*0.07}" r="{r*0.09}" fill="{NAVY}"/>'
            g+=f'<path d="M{x-r*0.21} {ey} L{x+r*0.21} {ey}" stroke="{NAVY}" stroke-width="3" stroke-linecap="round"/>'
        else:
            g+=stroke(f'M{x-r*0.17} {ey} Q{x} {ey+r*0.14} {x+r*0.17} {ey}',NAVY,3)
        by=ey-r*0.34
        if brows=='up': by-=r*0.06
        g+=stroke(f'M{x-r*0.16} {by+ (r*0.03 if brows=="focus" and sx==1 else 0)} Q{x} {by-r*0.08} {x+r*0.16} {by+(r*0.03 if brows=="focus" and sx==-1 else 0)}',NAVY,3)
    # joues, nez, bouche
    for sx in(-1,1): g+=f'<circle cx="{cx+sx*r*0.55}" cy="{cy+r*0.42}" r="{r*0.13}" fill="{CORAL}" opacity="0.28"/>'
    g+=stroke(f'M{cx+gx*r*0.05-r*0.05} {cy+r*0.35} Q{cx+gx*r*0.05} {cy+r*0.42} {cx+gx*r*0.05+r*0.05} {cy+r*0.35}',NAVY,2.4)
    my=cy+r*0.62
    if mouth=='smile': g+=stroke(f'M{cx-r*0.22} {my} Q{cx} {my+r*0.2} {cx+r*0.22} {my}',NAVY,3)
    elif mouth=='flat': g+=stroke(f'M{cx-r*0.16} {my+r*0.04} L{cx+r*0.16} {my+r*0.04}',NAVY,3)
    elif mouth=='open': g+=f'<ellipse cx="{cx}" cy="{my+r*0.05}" rx="{r*0.15}" ry="{r*0.11}" fill="#7A2E2E" stroke="{NAVY}" stroke-width="2.4"/>'
    elif mouth=='talk': g+=f'<path d="M{cx-r*0.22} {my-r*0.02} Q{cx} {my+r*0.3} {cx+r*0.22} {my-r*0.02} Z" fill="#7A2E2E" stroke="{NAVY}" stroke-width="2.4"/>'
    elif mouth=='tongue': g+=stroke(f'M{cx-r*0.18} {my} Q{cx} {my+r*0.12} {cx+r*0.18} {my}',NAVY,3)+f'<ellipse cx="{cx+r*0.12}" cy="{my+r*0.1}" rx="{r*0.07}" ry="{r*0.06}" fill="{CORAL}"/>'
    return g+'</g>'

def limb(pts,col,w): return stroke(P(pts),NAVY,w+2*SW)+stroke(P(pts),col,w)
def arm(pts,sleeve,skin,w=16):
    # pts: épaule, coude, main
    s=limb(pts[:2],sleeve,w)+limb(pts[1:],skin,w-3)
    hx,hy=pts[-1]; s+=f'<circle cx="{hx}" cy="{hy}" r="{w*0.62}" fill="{skin}" stroke="{NAVY}" stroke-width="{SW}"/>'
    return s
def leg(pts,pants,shoe=NAVY,w=19,shoe_dir=1):
    s=limb(pts,pants,w); fx,fy=pts[-1]
    s+=f'<ellipse cx="{fx+shoe_dir*8}" cy="{fy+4}" rx="16" ry="9" fill="{shoe}" stroke="{NAVY}" stroke-width="{SW}"/>'
    return s
def torso(cx,top,w,h,col,bot_w=None):
    bw=bot_w or w*0.92
    return f'<path d="M{cx-w/2} {top+14} Q{cx-w/2} {top} {cx-w/2+16} {top} L{cx+w/2-16} {top} Q{cx+w/2} {top} {cx+w/2} {top+14} L{cx+bw/2} {top+h-10} Q{cx+bw/2} {top+h} {cx+bw/2-10} {top+h} L{cx-bw/2+10} {top+h} Q{cx-bw/2} {top+h} {cx-bw/2} {top+h-10} Z" fill="{col}" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'

def gaze_line(x1,y1,x2,y2,col=CORAL):
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="5" stroke-dasharray="3 12" stroke-linecap="round"/>'
            f'<circle cx="{x2}" cy="{y2}" r="17" fill="none" stroke="{col}" stroke-width="4.5"/><circle cx="{x2}" cy="{y2}" r="6.5" fill="{col}"/>')

def soccer(cx,cy,r,uid='b'):
    pent=lambda x,y,s,rot=0: 'M'+' L'.join(f'{x+s*math.sin(math.radians(rot+72*i)):.1f} {y-s*math.cos(math.radians(rot+72*i)):.1f}' for i in range(5))+'Z'
    s=f'<defs><clipPath id="c{uid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs><circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF"/>'
    s+=f'<g clip-path="url(#c{uid})">'
    s+=f'<path d="{pent(cx,cy,r*0.36)}" fill="{NAVY}"/>'
    for i in range(5):
        a=math.radians(72*i); x=cx+r*0.98*math.sin(a); y=cy-r*0.98*math.cos(a)
        s+=f'<path d="{pent(x,y,r*0.34,180+72*i)}" fill="{NAVY}"/>'
        x1=cx+r*0.36*math.sin(a); y1=cy-r*0.36*math.cos(a); x2=cx+r*0.7*math.sin(a); y2=cy-r*0.7*math.cos(a)
        s+=f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{NAVY}" stroke-width="{max(2,r*0.07):.1f}"/>'
    s+=f'</g><circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{NAVY}" stroke-width="{SW}"/>'
    return s

def bubble_think(x,y,w,h,inner,tail_to):
    tx,ty=tail_to
    s=f'<ellipse cx="{x}" cy="{y}" rx="{w/2}" ry="{h/2}" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3"/>'
    for k,rr in [(0.35,9),(0.62,6)]:
        bx=x+(tx-x)*k+0; by=y+h/2*0.9+(ty-(y+h/2))*k
        s+=f'<circle cx="{bx}" cy="{by}" r="{rr}" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3"/>'
    return s+inner
def bubble_talk(x,y,w,h,text,tail):
    tx,ty=tail
    return (f'<path d="M{x+w*0.3} {y+h} L{tx} {ty} L{x+w*0.5} {y+h}" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3" stroke-linejoin="round"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3"/>'
            f'<rect x="{x+w*0.28}" y="{y+h-5}" width="{w*0.25}" height="8" fill="#FFFFFF"/>'
            f'<text x="{x+w/2}" y="{y+h/2+9}" font-family="Arial" font-size="26" font-weight="bold" fill="{NAVY}" text-anchor="middle">{text}</text>')
def controller(cx,cy,s=1,rot=0):
    return (f'<g transform="translate({cx} {cy}) rotate({rot}) scale({s})"><path d="M-38 -14 Q-40 -22 -28 -22 L28 -22 Q40 -22 38 -14 L44 14 Q46 26 34 24 L22 10 L-22 10 L-34 24 Q-46 26 -44 14 Z" fill="#3D4A66" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
            f'<path d="M-26 -8 L-26 4 M-32 -2 L-20 -2" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="-8" r="4" fill="{CORAL}"/><circle cx="30" cy="0" r="4" fill="{YEL}"/></g>')
def phone(cx,cy,rot=0,s=1):
    return f'<g transform="translate({cx} {cy}) rotate({rot}) scale({s})"><rect x="-14" y="-24" width="28" height="48" rx="6" fill="{NAVY}"/><rect x="-10" y="-19" width="20" height="34" rx="2" fill="#9FE3FF"/><rect x="-6" y="-13" width="12" height="3" fill="#FFFFFF"/><rect x="-6" y="-7" width="9" height="3" fill="#FFFFFF"/></g>'
def board(x,y,w,h,lines):
    s=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#2E5E4E" stroke="#6B4A2B" stroke-width="10"/>'
    s+=f'<rect x="{x+20}" y="{y+h}" width="{w-40}" height="8" fill="#8B6A45"/>'
    for i,t in enumerate(lines):
        s+=f'<text x="{x+28}" y="{y+58+i*56}" font-family="Arial" font-size="40" fill="#FFFFFF">{t}</text>'
    return s
def desk(x,y,w):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="16" rx="4" fill="#C08A55" stroke="{NAVY}" stroke-width="{SW}"/>'
            +stroke(f'M{x+14} {y+16} L{x+14} {y+96}',NAVY,7)+stroke(f'M{x+w-14} {y+16} L{x+w-14} {y+96}',NAVY,7))
def chair(x,y):
    return stroke(f'M{x} {y} L{x} {y+70} M{x+50} {y} L{x+50} {y+70}',NAVY,6)+f'<rect x="{x-6}" y="{y-8}" width="62" height="12" rx="4" fill="#9AA3B2" stroke="{NAVY}" stroke-width="3"/>'

# personnage assis vu de face (le corps reste de face, la tête et les yeux donnent la direction)
def seated(cx,base,skin,hair,style,shirt,pants,gaze,mouth='smile',tilt=0,arms='desk',eyes='open',brows='normal'):
    s=''
    s+=leg([(cx-14,base-40),(cx-16,base+10),(cx-18,base+60)],pants,w=18,shoe_dir=-1)+leg([(cx+14,base-40),(cx+16,base+10),(cx+18,base+60)],pants,w=18)
    s+=torso(cx,base-130,74,96,shirt)
    if arms=='desk':
        s+=arm([(cx-32,base-118),(cx-40,base-62),(cx-14,base-48)],shirt,skin)+arm([(cx+32,base-118),(cx+40,base-62),(cx+14,base-48)],shirt,skin)
    s+=head(cx,base-175,38,skin,hair,style,gaze,mouth,tilt,eyes,brows)
    return s
