"""Bundle src/ + assets/ into one self-contained HTML file.

dist/kryabul.html            - artifact page (no <html>/<head>/<body>, the host adds them)
dist/kryabul-standalone.html - full document to open from disk
"""
import base64
import io
import json
import pathlib
import re

from PIL import Image

K = pathlib.Path(__file__).resolve().parent.parent
IMAGES = {  # key in ASSETS.img -> file
    "duck": "duck_ilona.png",
    "carpBody": "carp_body.png",
    "mishaHead": "misha_head.png",
    # boss faces, added later when photos arrive:
    "grannyFace": "granny_face.png",
    "pikeFace": "pike_face.png",
    "squidFace": "squid_face.png",
    "eelFace": "eel_face.png",
    "anacondaFace": "anaconda_face.png",
    "crocFace": "croc_face.png",
    # level 5: meme faces in the troll's balloon when it is hit, and the «произошёл троллинг» cat after the win
    "trollFace1": "troll_face1.png",
    "trollFace2": "troll_face2.png",
    "trollFace3": "troll_face3.png",
    "trollFace4": "troll_face4.png",
    "trollFace5": "troll_face5.png",
    "trollFace6": "troll_face6.png",
    "catTrolling": "cat_trolling.png",
}


def data_uri(path):
    im = Image.open(path).convert("RGBA")
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=88, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def svg_data_uri(path):
    """Minified SVG as a text data URI (safe inside a JS '...' string and an HTML src=\"...\"); gzip on the server keeps it small."""
    svg = path.read_text()
    svg = re.sub(r"(\d+\.\d)\d+", r"\1", svg)          # 1 decimal is plenty for a 2688 px drawing
    svg = re.sub(r"\s+", " ", svg).strip()
    for ch, enc in (("%", "%25"), ("#", "%23"), ('"', "%22"), ("'", "%27"), ("<", "%3C"), (">", "%3E"), ("\\", "%5C")):
        svg = svg.replace(ch, enc)
    return "data:image/svg+xml," + svg


def main():
    img = {}
    for key, name in IMAGES.items():
        p = K / "assets" / name
        if p.exists():
            img[key] = data_uri(p)
    meta = json.loads((K / "assets" / "sprites.json").read_text())
    assets_js = "const ASSETS = " + json.dumps({"img": img, "meta": meta}, ensure_ascii=False) + ";"
    duck = K / "assets" / "models" / "duck.bin.gz"
    if duck.exists():  # low-poly 3D duck (tools/duck_model.py)
        assets_js += "\nconst DUCK_PACK = " + json.dumps({"head": json.loads((K / "assets" / "models" / "duck.json").read_text()), "gz": base64.b64encode(duck.read_bytes()).decode()}) + ";"
    zkit = K / "assets" / "models" / "zkit.bin.gz"
    if zkit.exists():  # Zombie Apocalypse Kit by Quaternius (CC0), packed by tools/pack_zombie_kit.mjs
        assets_js += "\nconst ZKIT_PACK = " + json.dumps({"head": json.loads((K / "assets" / "models" / "zkit.json").read_text()), "gz": base64.b64encode(zkit.read_bytes()).decode()}) + ";"
    city = K / "assets" / "models" / "city.bin.gz"
    if city.exists():  # 3D buildings for duck level 4 (packed by tools/pack_models.py)
        assets_js += "\nconst CITY_PACK = " + json.dumps({"head": json.loads(city.with_suffix("").with_suffix(".json").read_text()), "gz": base64.b64encode(city.read_bytes()).decode()}) + ";"
    js = "\n".join(p.read_text() for p in sorted((K / "src" / "js").glob("*.js")))
    # ES-module drop-ins in src/ (e.g. level5_prologue_and_juice.js): strip import/export so they join the bundle,
    # and inline the asset files they reference (assets/slide1.svg ...) as data URIs
    mods = []
    for mp in sorted((K / "src").glob("*.js")):
        code = re.sub(r"^\s*import\s+[^;]*?from\s+['\"]three['\"];?\s*$", "", mp.read_text(), flags=re.M)
        code = re.sub(r"^export\s+(default\s+)?(class|function|const|let)", r"\2", code, flags=re.M)
        for ref in sorted(set(re.findall(r"assets/[\w./-]+\.svg", code))):
            f = K / ref
            if f.exists():
                webp = f.with_suffix(".webp")  # pre-rendered by tools/raster_slides.js — much lighter than a traced SVG
                if webp.exists() and webp.stat().st_mtime >= f.stat().st_mtime:
                    code = code.replace(ref, "data:image/webp;base64," + base64.b64encode(webp.read_bytes()).decode())
                else:
                    code = code.replace(ref, svg_data_uri(f))
            else:
                print("WARNING: missing", ref)
        mods.append("/* ---- " + mp.name + " */\n" + code)
    js = "\n".join(mods) + "\n" + js
    shell = (K / "src" / "shell.html").read_text()
    three = (K / "vendor" / "three-r128.min.js").read_text()
    assert "</script" not in three.lower()
    # three.js r128 + its glTF loader and skeleton cloning (examples/js, non-module) for the level 5 models
    for extra in ("three-r128-GLTFLoader.js", "three-r128-SkeletonUtils.js"):
        ex = K / "vendor" / extra
        if ex.exists():
            code = ex.read_text()
            assert "</script" not in code.lower()
            three += "\n" + code
    shell = shell.replace("<!--VENDOR-->", "<script>\n" + three + "\n</script>")
    page = shell.replace("<!--ASSETS-->", "<script>\n" + assets_js + "\n</script>").replace(
        "<!--SCRIPT-->", "<script>\n(function () {\n" + js + "\n})();\n</script>"
    )
    out = K / "dist"
    out.mkdir(exist_ok=True)
    (out / "kryabul.html").write_text(page)
    head_end = page.index("</style>") + len("</style>")
    full = ('<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n'
            + page[:head_end] + "\n</head>\n<body>\n" + page[head_end:] + "\n</body>\n</html>\n")
    (out / "kryabul-standalone.html").write_text(full)
    (K / "index.html").write_text(full)  # GitHub Pages entry point
    print("images:", {k: len(v) // 1024 for k, v in img.items()}, "KB")
    print("page:", len(page) // 1024, "KB  (dist/kryabul.html, dist/kryabul-standalone.html, index.html)")


main()
