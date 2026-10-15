import json, urllib.parse
from playwright.sync_api import sync_playwright
BASE="http://localhost:8765"
with sync_playwright() as p:
    b=p.chromium.launch(channel="chromium")
    for lettre in ["𝑥","𝑛","a","𝑀"]:
        charge={"source":"splat","variable":lettre,"lhsSide":"bottom","top":[{"type":"number","value":11}],"bottom":[{"type":"x"},{"type":"x"},{"type":"number","value":3}]}
        pg=b.new_page(); pg.goto(BASE+"/outils/equabarre.html#data="+urllib.parse.quote(json.dumps(charge))); pg.wait_for_timeout(1200)
        vals=pg.evaluate("[...document.querySelectorAll('.pieceValue')].map(e=>e.textContent.trim())")
        print("ÉquaBarre variable", repr(lettre), "-> pièces :", vals); pg.close()
    pg=b.new_page(); pg.goto(BASE+"/outils/splat_tache_barre.html?problem=classic&support=print&title="+urllib.parse.quote('Activité 1 & 2 <test>')); pg.wait_for_timeout(2500)
    print("Petit Splat sous-titre :", repr(pg.evaluate("document.querySelector('.activity-subtitle')?.textContent")))
    pg.close(); b.close()
