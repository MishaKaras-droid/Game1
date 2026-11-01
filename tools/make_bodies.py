"""Cut the duck and the carp out of their white backgrounds."""
import cv2
import numpy as np
from PIL import Image

R = "/home/user/kryabul/raw"
W = "/home/user/kryabul/work"


def cutout_white(img, thr=205, outline_unblend=True):
    """Remove white background connected to the image border.
    Edge pixels are un-blended from white assuming a dark outline."""
    h, w = img.shape[:2]
    lum = img.min(axis=2)
    bg_candidate = (lum > thr).astype(np.uint8)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    flood = bg_candidate.copy()
    # flood from all border pixels that are background candidates
    seeds = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + \
            [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    filled = np.zeros((h, w), bool)
    for (x, y) in seeds:
        if bg_candidate[y, x] and not filled[y, x]:
            m = np.zeros((h + 2, w + 2), np.uint8)
            cv2.floodFill(flood, m, (x, y), 2, 0, 0, 4 | cv2.FLOODFILL_FIXED_RANGE)
            filled = flood == 2
    alpha = np.where(filled, 0.0, 1.0).astype(np.float32)
    rgb = img.astype(np.float32)
    if outline_unblend:
        # pixels touching the background: treat them as dark outline blended on white
        near = cv2.dilate(filled.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        edge = near & ~filled
        a = 1.0 - lum.astype(np.float32) / 255.0
        a = np.clip(a * 1.15, 0, 1)
        alpha = np.where(edge, a, alpha)
        rgb = np.where(edge[..., None], np.minimum(rgb, 40), rgb)
    return rgb.astype(np.uint8), alpha


# ---------------- duck
duck = np.asarray(Image.open(f"{R}/duck_meme.jpg").convert("RGB"))
duck = duck[125:815, 125:815].copy()  # text lines are outside this box
rgb, a = cutout_white(duck, thr=200)
n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 0.3).astype(np.uint8), 8)
big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
a = np.where(cv2.dilate((lab == big).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0, a, 0)
rgba = np.dstack([rgb, (a * 255).astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save(f"{W}/duck_full.png")

# erase eyes + beak with the duck's body yellow (they will be covered by the face)
body = rgba.copy()
yellow = np.median(duck[540:580, 380:420].reshape(-1, 3), axis=0)
print("duck yellow", yellow)
face_zone = np.zeros(body.shape[:2], np.uint8)
cv2.ellipse(face_zone, (345, 205), (215, 120), 0, 0, 360, 1, -1)
body[face_zone > 0, :3] = yellow.astype(np.uint8)
Image.fromarray(body, "RGBA").save(f"{W}/duck_body.png")

# ---------------- carp
fish = np.asarray(Image.open(f"{R}/carp.jpg").convert("RGB"))[3:-3, 3:-3].copy()
rgb, a = cutout_white(fish, thr=236, outline_unblend=False)
# keep largest component only, smooth alpha edge
n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), 8)
big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
keep = (lab == big).astype(np.uint8)
keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
# fill holes
inv = (1 - keep).astype(np.uint8)
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv, 4)
for i in range(1, n2):
    x, y, w_, h_, area = st2[i]
    if x > 0 and y > 0 and x + w_ < keep.shape[1] and y + h_ < keep.shape[0]:
        keep[lab2 == i] = 1
soft = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 0.8)
rgba = np.dstack([rgb, (np.clip(soft, 0, 1) * 255).astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save(f"{W}/carp_cut.png")
ys, xs = np.where(keep > 0)
print("carp bbox", xs.min(), ys.min(), xs.max(), ys.max())
