# Vignettes de la page du site et carte du catalogue (à lancer dans site/ après le rendu des diapos r1/, r2/)
from PIL import Image, ImageFilter, ImageDraw
import sys
o=sys.argv[1]
def place(c,im,box):
    x0,y0,W,H=box; im=im.copy(); im.thumbnail((W,H),Image.LANCZOS)
    x=x0+(W-im.width)//2; y=y0+(H-im.height)//2
    sh=Image.new('RGBA',c.size,(0,0,0,0)); d=ImageDraw.Draw(sh); d.rectangle((x+5,y+8,x+im.width+5,y+im.height+8),fill=(20,40,70,70))
    sh=sh.filter(ImageFilter.GaussianBlur(8)); c.paste(sh,(0,0),sh); c.paste(im,(x,y))
def thumb(src,out,bg):
    c=Image.new('RGB',(800,500),bg); im=Image.open(src).convert('RGB')
    if im.height>im.width: im=im.crop((0,0,im.width,int(im.width*0.72)))
    place(c,im,(40,30,720,440)); c.save(o+out,'WEBP',quality=86,method=6)
thumb('r1/s-01.png','apercu-s1-diaporama.webp',(234,246,247))
thumb('r2/s-01.png','apercu-s2-diaporama.webp',(234,246,247))
for n in (1,2):
    thumb(f'th-f{n}-1.png',f'apercu-s{n}-fiche.webp',(255,244,232))
    thumb(f'th-r{n}-1.png',f'apercu-s{n}-fdr.webp',(243,239,251))
c=Image.new('RGB',(1200,675),(234,246,247))
place(c,Image.open('r1/s-01.png').convert('RGB'),(40,70,700,540))
f=Image.open('th-f1-1.png').convert('RGB'); f=f.crop((0,0,f.width//2,f.height))
place(c,f,(760,40,410,600)); c.save(o+'carte-catalogue.webp','WEBP',quality=86,method=6)
