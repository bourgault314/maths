# Les dos des cartes d'Anzan (lot « anzan-cartes », 07/11/2026).
#
# textes-dos-cartes-kyu.md est la source des textes (les textes des cartes,
# relus et complétés). Ce script écrit, sur la sortie, les 20 lignes
# carte({...}) du bloc CARTES_KYU de outils/calcul_mental/flash_anzan_core.js
# (apostrophes typographiques, espaces insécables), à recopier entre
# « const CARTES_KYU = Object.freeze([ » et « ]); ».
#
#   python3 generer_textes.py textes-dos-cartes-kyu.md
import re, json, sys
md = open(sys.argv[1], encoding='utf-8').read()
NOMS = {"Fukurō": "fukuro", "Ryū": "ryu", "Hō-ō": "ho-o", "Maneki-neko": "maneki-neko"}
SENS = {"grenouille": "la grenouille", "lapin": "le lapin", "moineau": "le moineau", "libellule": "la libellule", "tortue": "la tortue",
        "vache rouge": "la vache rouge", "cerf": "le cerf", "sanglier": "le sanglier", "corbeau à trois pattes": "le corbeau à trois pattes",
        "renard": "le renard", "chat": "le chat", "carpe koï": "la carpe koï", "hibou": "le hibou", "grue": "la grue", "dragon": "le dragon", "phénix": "le phénix"}
def typo(s):
    s = s.replace("'", "’")
    s = re.sub(r"« ", "« ", s); s = re.sub(r" »", " »", s)
    s = re.sub(r" ([:;!?])", " \\1", s)
    s = re.sub(r"(\d+(?:e|er)?) (?=\w)", "\\1\u00a0", s)
    return s
cartes = []
for bloc in re.split(r"\n## ", md)[1:]:
    lignes = [l.strip() for l in bloc.strip().split("\n")]
    tete = lignes[0]
    m = re.match(r"(\d+)(?:e|er) Kyu — ([^()]+?)(?: \(([^)]+)\))?$", tete)
    assert m, tete
    kyu, nom, sens = int(m[1]), m[2].strip(), m[3]
    paras = [l for l in lignes[1:] if l]
    creature, message, prov = paras[0], paras[1], paras[2]
    note = paras[3] if len(paras) > 3 else ""
    assert len(paras) <= 4, nom
    pm = re.match(r"« (.+?) » \((.+?)\) : « (.+) »$", prov)
    assert pm, prov
    if note: assert note.startswith("(") and note.endswith(")"), note; note = note[1:-1]
    fichier = f"kyu{kyu:02d}-{NOMS.get(nom, nom.lower())}"
    cartes.append({"kyu": kyu, "nom": nom, "sens": SENS.get(sens, "") if sens else "", "image": fichier,
                   "creature": typo(creature), "message": typo(message),
                   "proverbe": {"japonais": pm[1], "lecture": pm[2], "francais": typo(pm[3]), "idee": typo(note)}})
assert [c["kyu"] for c in cartes] == list(range(20, 0, -1))
lignes = []
for c in cartes:
    p = c["proverbe"]
    lignes.append("    carte({kyu: %d, nom: %s, sens: %s, image: %s,\n      creature: %s,\n      message: %s,\n      proverbe: {japonais: %s, lecture: %s, francais: %s, idee: %s}})" % (
        c["kyu"], *(json.dumps(x, ensure_ascii=False) for x in (c["nom"], c["sens"], c["image"], c["creature"], c["message"], p["japonais"], p["lecture"], p["francais"], p["idee"]))))
print(",\n".join(lignes).replace("\u00a0", "\\u00a0"))
