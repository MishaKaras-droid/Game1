"""Cut out heads (face + hair) from the photos using the MediaPipe masks
produced by analyze_faces.py. Output: RGBA PNGs in work/.
"""
import json

import cv2
import numpy as np
from PIL import Image, ImageFilter

W = "/home/user/kryabul/work"


def soft(mask, blur=2.0):
    """Float mask 0..1 -> slightly blurred."""
    im = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8))
    im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im).astype(np.float32) / 255


def largest_component_near(mask_bin, seed_xy):
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask_bin.astype(np.uint8), 8)
    x, y = seed_xy
    best = lab[int(y), int(x)]
    if best == 0:
        # pick the component with the most pixels
        best = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    return lab == best


def cut_head(name, photo, crop, hair_fade, keep_other_rows=None, extra_bottom=0):
    conf = np.load(f"{W}/{name}_conf.npy")  # 6 x h x w
    lm = json.load(open(f"{W}/{name}_landmarks.json"))
    pts = np.array(lm["pts"])
    img = np.asarray(Image.open(photo).convert("RGB"))
    if crop:
        x0, y0, x1, y1 = crop
        img = img[y0:y1, x0:x1]
    h, w = img.shape[:2]
    hair, face, other = conf[1], conf[3], conf[5]
    m = hair + face
    if keep_other_rows:
        r0, r1 = keep_other_rows
        o = other.copy()
        o[:r0] = 0
        o[r1:] = 0
        m = m + o
    m = np.clip(m, 0, 1)
    # keep the blob connected to the face
    nose = pts[1]
    comp = largest_component_near(m > 0.5, nose)
    comp = cv2.dilate(comp.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    m = m * comp
    # face polygon from landmarks (fill holes such as sunglasses / eyes)
    hull = cv2.convexHull(pts.astype(np.int32))
    poly = np.zeros((h, w), np.uint8)
    cv2.fillConvexPoly(poly, hull, 1)
    m = np.maximum(m, poly.astype(np.float32))
    # fade the hair out below the chin
    chin_y = pts[152][1]
    ys = np.arange(h)[:, None].astype(np.float32)
    f0, f1 = chin_y + hair_fade[0], chin_y + hair_fade[1]
    fade = np.clip((f1 - ys) / max(1, (f1 - f0)), 0, 1)
    # the face polygon itself never fades
    m = np.where(poly > 0, m, m * fade)
    m = soft(m, 1.2)
    rgba = np.dstack([img, (m * 255).astype(np.uint8)])
    ys_, xs_ = np.where(m > 0.04)
    bx0, bx1, by0, by1 = xs_.min(), xs_.max() + 1, ys_.min(), ys_.max() + 1
    out = Image.fromarray(rgba, "RGBA").crop((bx0, by0, bx1, by1))
    info = {
        "size": out.size,
        "nose": (float(nose[0] - bx0), float(nose[1] - by0)),
        "chin": (float(pts[152][0] - bx0), float(pts[152][1] - by0)),
        "forehead": (float(pts[10][0] - bx0), float(pts[10][1] - by0)),
        "cheekL": (float(pts[234][0] - bx0), float(pts[234][1] - by0)),
        "cheekR": (float(pts[454][0] - bx0), float(pts[454][1] - by0)),
    }
    out.save(f"{W}/{name}_head.png")
    json.dump(info, open(f"{W}/{name}_head.json", "w"), indent=1)
    print(name, info)


# Ilona: hair down to a little below the chin, keep sunglasses (class "other") on top of head
cut_head("ilona", "/home/user/kryabul/raw/ilona_photo.jpg", None, (40, 120))
# Misha: short hair, cut right under the chin
cut_head("misha", "/home/user/kryabul/raw/misha_photo.jpg", (500, 600, 1000, 1100), (-4, 6))
