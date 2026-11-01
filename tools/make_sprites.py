"""Build the final player sprites from the processed parts.

Outputs (assets/):
  duck_ilona.png   - duck body + Ilona's face + knife in front (one sprite)
  carp_body.png    - carp without head, level (for tail wiggle in game)
  misha_head.png   - Misha's head with outline, placed on the carp in game
  carp_misha.png   - full composite (menu portrait)
and assets/sprites.json with anchor points.
"""
import json
import math
import sys

import cv2
import numpy as np
from PIL import Image, ImageEnhance

sys.path.insert(0, "/home/user/kryabul/tools")
from carp_outline import PTS as CARP_PTS  # noqa: E402

K = "/home/user/kryabul"
W = f"{K}/work"
A = f"{K}/assets"
INK = (34, 30, 46)


def add_outline(im, px, color=INK, blur=0.8):
    """Sticker-style outline under an RGBA image."""
    a = np.asarray(im)[..., 3]
    pad = px + 4
    a2 = np.pad(a, pad)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * px + 1, 2 * px + 1))
    dil = cv2.dilate((a2 > 60).astype(np.uint8) * 255, k)
    dil = cv2.GaussianBlur(dil.astype(np.float32), (0, 0), blur)
    base = np.zeros(a2.shape + (4,), np.uint8)
    base[..., 0], base[..., 1], base[..., 2] = color
    base[..., 3] = np.clip(dil, 0, 255).astype(np.uint8)
    out = Image.fromarray(base, "RGBA")
    layer = Image.new("RGBA", out.size, (0, 0, 0, 0))
    layer.paste(im, (pad, pad))
    out.alpha_composite(layer)
    return out, pad


def trim(im, margin=2):
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > 8)
    box = (max(0, xs.min() - margin), max(0, ys.min() - margin),
           min(im.width, xs.max() + 1 + margin), min(im.height, ys.max() + 1 + margin))
    return im.crop(box), box


meta = {}

# ------------------------------------------------------------------ duck + Ilona
duck = Image.open(f"{W}/duck_body.png")
head = Image.open(f"{W}/ilona_head.png")
hi = json.load(open(f"{W}/ilona_head.json"))
head = ImageEnhance.Color(head).enhance(1.08)
head = ImageEnhance.Contrast(head).enhance(1.06)
FRONT = [(88, 470), (92, 430), (110, 398), (140, 383), (175, 382), (230, 371), (300, 356), (370, 341),
         (396, 339), (406, 350), (404, 385), (396, 411), (373, 441), (343, 464), (300, 481), (250, 491),
         (200, 493), (160, 488), (120, 492), (95, 488)]
da = np.asarray(duck)[..., 3]
inner = cv2.erode((da > 200).astype(np.uint8), np.ones((27, 27), np.uint8)).astype(np.float32)
inner = cv2.GaussianBlur(inner, (0, 0), 2.5)
front = np.zeros(da.shape, np.uint8)
cv2.fillPoly(front, [np.array(FRONT, np.int32)], 1)
front = cv2.GaussianBlur(front.astype(np.float32), (0, 0), 1.2)
clip = inner * (1 - front)
s, nose = 0.86, (346, 246)
h2 = head.resize((int(head.width * s), int(head.height * s)), Image.LANCZOS)
layer = Image.new("RGBA", duck.size, (0, 0, 0, 0))
layer.paste(h2, (int(nose[0] - hi["nose"][0] * s), int(nose[1] - hi["nose"][1] * s)), h2)
arr = np.asarray(layer).copy()
arr[..., 3] = (arr[..., 3] * clip).astype(np.uint8)
duck_full = duck.copy()
duck_full.alpha_composite(Image.fromarray(arr))
duck_full, box = trim(duck_full)
TARGET = 420  # px height of game sprite
sc = TARGET / duck_full.height
duck_small = duck_full.resize((round(duck_full.width * sc), TARGET), Image.LANCZOS)
duck_small.save(f"{A}/duck_ilona.png")
meta["duck"] = {"w": duck_small.width, "h": duck_small.height,
                # knife tip (where thrown knives appear) and face centre, in sprite px
                "knife": [round((400 - box[0]) * sc), round((360 - box[1]) * sc)],
                "face": [round((nose[0] - box[0]) * sc), round((nose[1] - box[1]) * sc)]}
# portrait for menus
duck_full.resize((round(duck_full.width * 420 / duck_full.height), 420), Image.LANCZOS).save(f"{W}/duck_portrait.png")

# ------------------------------------------------------------------ carp body
src = np.asarray(Image.open(f"{K}/raw/carp.jpg").convert("RGB")).astype(np.float32)
UP = 3
big = cv2.resize(src, None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
mask = np.zeros(big.shape[:2], np.uint8)
cv2.fillPoly(mask, [np.array([(x * UP, y * UP) for x, y in CARP_PTS], np.int32)], 255)
mask = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 1.6)
# a little more contrast + warmth, so the fish reads on blue water
rgb = np.clip((big - 128) * 1.12 + 128, 0, 255)
rgb[..., 0] *= 1.03
rgb[..., 2] *= 0.97
rgba = np.dstack([np.clip(rgb, 0, 255), mask]).astype(np.uint8)
fish = Image.fromarray(rgba, "RGBA")
ANGLE = 18.5  # rotate counter-clockwise -> fish level
fish_r = fish.rotate(ANGLE, resample=Image.BICUBIC, expand=True)


def rot_point(x, y, im_w, im_h, new_w, new_h, deg):
    """Where (x,y) of the original lands after PIL rotate(expand=True)."""
    a = math.radians(deg)
    cx, cy = im_w / 2, im_h / 2
    dx, dy = x - cx, y - cy
    # PIL rotates counter-clockwise for positive angles (y axis down)
    rx = dx * math.cos(a) + dy * math.sin(a)
    ry = -dx * math.sin(a) + dy * math.cos(a)
    return rx + new_w / 2, ry + new_h / 2


snout = rot_point(425.7 * UP, 228.3 * UP, fish.width, fish.height, fish_r.width, fish_r.height, ANGLE)
headc = rot_point(382 * UP, 205 * UP, fish.width, fish.height, fish_r.width, fish_r.height, ANGLE)
fish_r, box = trim(fish_r, 0)
snout = (snout[0] - box[0], snout[1] - box[1])
headc = (headc[0] - box[0], headc[1] - box[1])
fish_o, pad = add_outline(fish_r, 6)
snout = (snout[0] + pad, snout[1] + pad)
headc = (headc[0] + pad, headc[1] + pad)
FW = 700  # game sprite width
sc = FW / fish_o.width
carp_small = fish_o.resize((FW, round(fish_o.height * sc)), Image.LANCZOS)
carp_small.save(f"{A}/carp_body.png")

# ------------------------------------------------------------------ Misha head
mh = Image.open(f"{W}/misha_head.png")
mi = json.load(open(f"{W}/misha_head.json"))
mh = ImageEnhance.Color(mh).enhance(1.12)
mh = ImageEnhance.Contrast(mh).enhance(1.08)
HS = 2.4  # upscale the small face before outlining
mh_big = mh.resize((round(mh.width * HS), round(mh.height * HS)), Image.LANCZOS)
mh_o, hpad = add_outline(mh_big, 7)
HEAD_H = 320  # game sprite height for the head
hs = HEAD_H / mh_o.height
mh_small = mh_o.resize((round(mh_o.width * hs), HEAD_H), Image.LANCZOS)
mh_small.save(f"{A}/misha_head.png")
meta["misha_head"] = {"w": mh_small.width, "h": mh_small.height,
                      "nose": [round((mi["nose"][0] * HS + hpad) * hs), round((mi["nose"][1] * HS + hpad) * hs)]}
meta["carp"] = {"w": carp_small.width, "h": carp_small.height,
                "snout": [round(snout[0] * sc), round(snout[1] * sc)],
                "head": [round(headc[0] * sc), round(headc[1] * sc)]}

# composite preview / portrait: head centred a bit behind the snout
comp = Image.new("RGBA", (carp_small.width + 80, carp_small.height + 120), (0, 0, 0, 0))
ox, oy = 10, 80
comp.alpha_composite(carp_small, (ox, oy))
hx = ox + meta["carp"]["head"][0] - mh_small.width * 0.42
hy = oy + meta["carp"]["head"][1] - mh_small.height * 0.62
comp.alpha_composite(mh_small, (round(hx), round(hy)))
comp, _ = trim(comp)
comp.save(f"{W}/carp_portrait.png")
json.dump(meta, open(f"{A}/sprites.json", "w"), indent=1)
print(json.dumps(meta))
