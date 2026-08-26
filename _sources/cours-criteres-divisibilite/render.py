# Régénère ../../outils/cours_criteres_divisibilite.pdf depuis le HTML (Chromium via Playwright).
# Usage : python3 render.py   (pip install playwright && playwright install chromium)
from pathlib import Path
from playwright.sync_api import sync_playwright
ici = Path(__file__).resolve().parent
src = ici / "cours_criteres_divisibilite.html"
out = ici.parents[1] / "outils" / "cours_criteres_divisibilite.pdf"
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto(src.as_uri()); pg.wait_for_timeout(500)
    pg.pdf(path=str(out), format="A4", print_background=True, prefer_css_page_size=True)
    b.close()
print("écrit :", out)
