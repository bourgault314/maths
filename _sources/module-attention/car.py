from chars import *
def sc_volant(G):
    W,Hh=800,560
    b=f'<rect width="{W}" height="{Hh}" fill="#EAF6F7"/>'
    # décor : immeubles au loin
    for x,h,c in [(20,150,'#D6DEE8'),(120,210,'#C9D3E0'),(600,190,'#D6DEE8'),(700,140,'#C9D3E0')]:
        b+=f'<rect x="{x}" y="{300-h}" width="90" height="{h}" fill="{c}"/>'
    # route en perspective
    b+=f'<path d="M0 300 L800 300 L800 560 L0 560Z" fill="#8A93A3"/>'
    b+=f'<path d="M0 300 L800 300" stroke="#6B7385" stroke-width="3"/>'
    # passage piéton au premier plan
    for i in range(9):
        x=30+i*86; b+=f'<path d="M{x} 470 L{x+52} 470 L{x+58} 530 L{x-6} 530Z" fill="#F3F4F6"/>'
    # voiture vue de face
    cx=430
    b+=f'<path d="M{cx-250} 430 L{cx-250} 330 Q{cx-246} 304 {cx-214} 300 L{cx-186} 160 Q{cx-176} 128 {cx-140} 126 L{cx+140} 126 Q{cx+176} 128 {cx+186} 160 L{cx+214} 300 Q{cx+246} 304 {cx+250} 330 L{cx+250} 430 Z" fill="{TEAL}" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
    WS=f'M{cx-176} 298 L{cx-150} 146 L{cx+150} 146 L{cx+176} 298 Z'
    b+=f'<path d="{WS}" fill="#D6F1F7" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
    dx=cx-70
    b+=f'<clipPath id="ws"><path d="{WS}"/></clipPath><g clip-path="url(#ws)">'
    b+=torso(dx,252,96,80,CORAL)
    b+=head(dx,206,38,SKIN[3],HAIR[1],'short',gaze=(0.9,0.9),mouth='flat',tilt=12)
    b+=f'<ellipse cx="{dx}" cy="284" rx="52" ry="15" fill="none" stroke="{NAVY}" stroke-width="8"/>'
    b+=arm([(dx-38,262),(dx-50,284),(dx-34,286)],CORAL,SKIN[3],w=12)
    b+=arm([(dx+38,262),(dx+70,272),(dx+84,236)],CORAL,SKIN[3],w=12)
    b+=f'<rect x="{dx+66}" y="196" width="36" height="58" rx="7" fill="{NAVY}"/><rect x="{dx+71}" y="202" width="26" height="42" rx="2" fill="#9FE3FF"/><rect x="{dx+75}" y="208" width="16" height="4" fill="#FFFFFF"/><rect x="{dx+75}" y="216" width="11" height="4" fill="#FFFFFF"/>'
    b+='</g>'
    b+=f'<rect x="{cx-18}" y="146" width="36" height="14" rx="4" fill="{NAVY}"/>'
    b+=f'<path d="M{cx-214} 300 L{cx+214} 300" stroke="{NAVY}" stroke-width="{SW}"/>'
    for sx in(-1,1):
        b+=f'<ellipse cx="{cx+sx*172}" cy="350" rx="44" ry="24" fill="{YEL}" stroke="{NAVY}" stroke-width="{SW}"/><ellipse cx="{cx+sx*172}" cy="350" rx="20" ry="11" fill="#FFFFFF"/>'
        b+=f'<rect x="{cx+sx*258-(16 if sx>0 else 0)}" y="226" width="16" height="34" rx="6" fill="{TEAL}" stroke="{NAVY}" stroke-width="3"/>'
    b+=f'<rect x="{cx-96}" y="330" width="192" height="48" rx="12" fill="#5E9EA6" stroke="{NAVY}" stroke-width="{SW}"/>'
    for i in range(1,5): b+=f'<line x1="{cx-96+i*38.4}" y1="334" x2="{cx-96+i*38.4}" y2="374" stroke="{NAVY}" stroke-width="2.5"/>'
    b+=f'<rect x="{cx-58}" y="392" width="116" height="26" rx="4" fill="#FFFFFF" stroke="{NAVY}" stroke-width="3"/><text x="{cx}" y="412" font-family="Arial" font-weight="bold" font-size="19" fill="{NAVY}" text-anchor="middle">974</text>'
    for sx in(-1,1): b+=f'<rect x="{cx+sx*214-(40 if sx>0 else 0)}" y="420" width="40" height="44" rx="8" fill="{NAVY}"/>'
    # enfant qui traverse au premier plan
    kx=100
    b+=leg([(kx-12,452),(kx-26,494),(kx-36,532)],BLUE,w=17,shoe_dir=-1)+leg([(kx+12,452),(kx+20,494),(kx+30,532)],BLUE,w=17)
    b+=torso(kx,370,62,88,YEL)
    b+=arm([(kx-26,382),(kx-40,420),(kx-34,452)],YEL,SKIN[1],w=13)+arm([(kx+26,382),(kx+44,414),(kx+62,428)],YEL,SKIN[1],w=13)
    b+=f'<circle cx="{kx+74}" cy="440" r="20" fill="{CORAL}" stroke="{NAVY}" stroke-width="{SW}"/>'
    b+=head(kx,326,34,SKIN[1],HAIR[0],'curly',gaze=(0.3,0.5),mouth='smile')
    if G:
        b+=gaze_line(dx+14,214,dx+84,222)
    return svg(W,Hh,b)
save('sit_volant',sc_volant(True)); save('sit_volant_q',sc_volant(False))
