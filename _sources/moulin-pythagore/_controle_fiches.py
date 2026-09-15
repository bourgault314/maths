from pathlib import Path
import hashlib, json
import fitz
import cv2
import numpy as np

root = Path(__file__).resolve().parents[2]
folder = root / "outils/plateaux_manipulation/fiches_moulin"
output = root / "_sources/moulin-pythagore/_controle"
output.mkdir(exist_ok=True)
pdfs = sorted(folder.glob("moulin-pythagore-*.pdf"))
assert len(pdfs) == 14
reference = None
report = []
for path in pdfs:
    key = path.stem.removeprefix("moulin-pythagore-")
    doc = fitz.open(path)
    assert len(doc) == 5, (key, len(doc))
    hashes = []
    for index, page in enumerate(doc):
        assert abs(page.rect.width - 841.89) < 1 and abs(page.rect.height - 595.28) < 1
        assert "mathsgo.re" in page.get_text(), (key, index)
        assert len(page.get_images()) >= 1, (key, index, "logo")
        fonts = [font[3] for font in page.get_fonts()]
        assert any("Poppins" in font for font in fonts), (key, index, fonts)
        pix = page.get_pixmap(dpi=120, alpha=False)
        if index:
            hashes.append(hashlib.sha256(pix.samples).hexdigest())
    if reference is None:
        reference = hashes
    assert hashes == reference, (key, "les pages 2 à 5 diffèrent visuellement")
    qr_pix = doc[0].get_pixmap(dpi=210, alpha=False)
    rgb = np.frombuffer(qr_pix.samples, dtype=np.uint8).reshape(qr_pix.height, qr_pix.width, 3)
    value, points, _ = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY))
    expected = "https://mathsgo.re/outils/plateaux_manipulation/moulin_pythagore.html?puzzle=" + key + "&mode=eleves"
    assert value == expected, (key, "QR", value)
    report.append({"puzzle": key, "pages": len(doc), "qr": value, "pages_cours_sha256": hashes})
    if key in ["quatreIdentiques", "moulinIsocele"]:
        doc[0].get_pixmap(dpi=110, alpha=False).save(output / (key + "-page1.png"))
    if key == "quatreIdentiques":
        for index in range(1,5):
            doc[index].get_pixmap(dpi=110, alpha=False).save(output / ("cours-page" + str(index+1) + ".png"))
    doc.close()
(output / "rapport.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf8")
print("14 PDF de 5 pages A4 paysage ; pages 2 à 5 identiques pixel par pixel ; 14 QR décodés ; polices et logos présents.")
