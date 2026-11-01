"""Find face landmarks and hair/face masks in a photo (MediaPipe).

Usage: python analyze_faces.py <photo> <out_prefix>
Writes <out_prefix>_landmarks.json, <out_prefix>_seg.png (class map) and a
debug preview <out_prefix>_debug.jpg.
"""
import json
import sys

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

MODELS = "/tmp/claude-0/-home-user/4979b1da-b503-585c-a02f-0efbb309dfed/scratchpad/models"

photo, out = sys.argv[1], sys.argv[2]
bgr = cv2.imread(photo)
crop = [int(v) for v in sys.argv[3].split(",")] if len(sys.argv) > 3 else None
if crop:  # x0,y0,x1,y1 - work on a crop (small faces), coordinates stay crop-relative
    x0, y0, x1, y1 = crop
    bgr = bgr[y0:y1, x0:x1].copy()
    cv2.imwrite(f"{out}_crop.png", bgr)
rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
h, w = rgb.shape[:2]
image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

# --- landmarks
opts = vision.FaceLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_path=f"{MODELS}/face_landmarker.task"),
    num_faces=1,
)
with vision.FaceLandmarker.create_from_options(opts) as lm:
    res = lm.detect(image)
pts = []
if res.face_landmarks:
    pts = [(p.x * w, p.y * h) for p in res.face_landmarks[0]]
print("landmarks:", len(pts))

# --- segmentation (0 bg, 1 hair, 2 body skin, 3 face skin, 4 clothes, 5 other)
sopts = vision.ImageSegmenterOptions(
    base_options=mp_python.BaseOptions(model_asset_path=f"{MODELS}/selfie_multiclass.tflite"),
    output_category_mask=True,
    output_confidence_masks=True,
)
with vision.ImageSegmenter.create_from_options(sopts) as seg:
    sres = seg.segment(image)
cat = np.squeeze(sres.category_mask.numpy_view()).astype(np.uint8)
conf = [np.squeeze(m.numpy_view()).copy() for m in sres.confidence_masks]
np.save(f"{out}_conf.npy", np.stack(conf, 0))
cv2.imwrite(f"{out}_seg.png", cat * 40)

json.dump({"w": w, "h": h, "pts": pts}, open(f"{out}_landmarks.json", "w"))

# --- debug preview
dbg = bgr.copy()
colors = {1: (0, 200, 255), 2: (255, 0, 255), 3: (0, 255, 0), 4: (255, 128, 0), 5: (128, 128, 128)}
overlay = dbg.copy()
for k, c in colors.items():
    overlay[cat == k] = c
dbg = cv2.addWeighted(dbg, 0.55, overlay, 0.45, 0)
for i, (x, y) in enumerate(pts):
    cv2.circle(dbg, (int(x), int(y)), 1, (0, 0, 255), -1)
if pts:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    print("face bbox:", int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)))
    # key points: 10 forehead top, 152 chin, 234 / 454 cheeks, 1 nose tip, 13 mouth
    for idx in (10, 152, 234, 454, 1, 13, 33, 263):
        x, y = pts[idx]
        print(idx, int(x), int(y))
        cv2.circle(dbg, (int(x), int(y)), 5, (255, 255, 255), 2)
cv2.imwrite(f"{out}_debug.jpg", dbg)
