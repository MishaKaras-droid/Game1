"""Bundle src/ + assets/ into one self-contained HTML file.

dist/kryabul.html            - artifact page (no <html>/<head>/<body>, the host adds them)
dist/kryabul-standalone.html - full document to open from disk
"""
import base64
import io
import json
import pathlib

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
}


def data_uri(path):
    im = Image.open(path).convert("RGBA")
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=88, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def main():
    img = {}
    for key, name in IMAGES.items():
        p = K / "assets" / name
        if p.exists():
            img[key] = data_uri(p)
    meta = json.loads((K / "assets" / "sprites.json").read_text())
    assets_js = "const ASSETS = " + json.dumps({"img": img, "meta": meta}, ensure_ascii=False) + ";"
    js = "\n".join(p.read_text() for p in sorted((K / "src" / "js").glob("*.js")))
    shell = (K / "src" / "shell.html").read_text()
    three = (K / "vendor" / "three-r128.min.js").read_text()
    assert "</script" not in three.lower()
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
    print("images:", {k: len(v) // 1024 for k, v in img.items()}, "KB")
    print("page:", len(page) // 1024, "KB")


main()
