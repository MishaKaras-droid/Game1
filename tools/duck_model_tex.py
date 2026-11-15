"""Textured Meshy FBX duck -> decimated low-poly mesh with one colour per face taken from the model's own texture.
Every original face samples the texture at its UV centre; after decimation each new face takes the colour of the
nearest original faces. Output has the same layout as tools/duck_model.py: <out>.bin.gz + <out>.json
(positions Int16, indices Uint16, face colours RGB8), plus preview renders when a 5th argument is given.
usage: python3 tools/duck_model_tex.py <model.fbx> <texture.png> <out prefix> [target faces] [preview]"""
import sys, json, gzip, struct
import numpy as np, pyfqmr
from PIL import Image, ImageDraw
from scipy.spatial import cKDTree
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from fbx_read import read, find

fbx, texture, out, target = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 9000
ver, top = read(fbx)
obj = [t for t in top if t['name'] == 'Objects'][0]; geo = find(obj, 'Geometry')[0]
V = np.array(find(geo, 'Vertices')[0]['props'][0]).reshape(-1, 3)
I = np.array(find(geo, 'PolygonVertexIndex')[0]['props'][0]); I = np.where(I < 0, ~I, I).reshape(-1, 3)
uvl = find(geo, 'LayerElementUV')[0]
UV = np.array(find(uvl, 'UV')[0]['props'][0]).reshape(-1, 2)
UI = find(uvl, 'UVIndex'); UI = np.array(UI[0]['props'][0]).reshape(-1, 3) if UI else np.arange(len(I) * 3).reshape(-1, 3)
P = np.stack([V[:, 0], V[:, 2], -V[:, 1]], 1)  # Lcl Rotation -90 X: y up, the duck looks towards +z
if len(sys.argv) > 6 and sys.argv[6] == 'raw': P = V.copy()
# colour of every original face: the texture under its UV centre (and its corners pulled towards the centre)
tex = np.asarray(Image.open(texture).convert('RGB')).astype(float); TH, TW = tex.shape[:2]
fuv = UV[UI]; cen = fuv.mean(1)
def samp(uv): return tex[np.clip(((1 - uv[:, 1]) * TH).astype(int), 0, TH - 1), np.clip((uv[:, 0] * TW).astype(int), 0, TW - 1)]
col0 = samp(cen) * 0.4
for k in range(3): col0 += samp(cen * 0.5 + fuv[:, k] * 0.5) * 0.2
cen0 = P[I].mean(1)
s = pyfqmr.Simplify(); s.setMesh(P, I); s.simplify_mesh(target_count=target, aggressiveness=7, preserve_border=True, verbose=0)
P2, I2, _ = s.getMesh(); P2 = np.asarray(P2, float); I2 = np.asarray(I2, int)
y0 = P2[:, 1].min(); P2[:, 1] -= y0; cen0[:, 1] -= y0
# each new face: the median colour of the nearest original faces (keeps the flat low-poly look, drops seam noise)
_, nn = cKDTree(cen0).query(P2[I2].mean(1), k=5)
col = np.median(col0[nn], axis=1)
print('tris', len(I), '->', len(I2), 'size', (P2.max(0) - P2.min(0)).round(3))
lo = P2.min(0); ext = (P2.max(0) - lo).max(); qn = 32767 / ext
blob = bytearray()
for p in P2: blob += struct.pack('<3h', *np.round((p - lo) * qn).astype(int))
ioff = len(blob)
for t in I2: blob += struct.pack('<3H', *t)
coff = len(blob); blob += bytes(np.clip(col, 0, 255).astype(np.uint8).ravel())
gz = gzip.compress(bytes(blob), 9)
open(out + '.bin.gz', 'wb').write(gz)
json.dump({'lo': lo.round(5).tolist(), 'q': qn, 'nv': len(P2), 'nt': len(I2), 'ioff': ioff, 'coff': coff, 'size': (P2.max(0) - lo).round(4).tolist()}, open(out + '.json', 'w'))
print('raw', len(blob), 'gz', len(gz))
def prev(view, name):
    S = 500; im = Image.new('RGB', (S, S), (200, 205, 215)); d = ImageDraw.Draw(im)
    Q = P2.copy()
    if view == 'back': Q[:, 0] *= -1; Q[:, 2] *= -1
    if view == 'side': Q = np.stack([Q[:, 2], Q[:, 1], -Q[:, 0]], 1)
    TT = Q[I2]; nn2 = np.cross(TT[:, 1] - TT[:, 0], TT[:, 2] - TT[:, 0]); nn2 /= np.linalg.norm(nn2, axis=1, keepdims=True) + 1e-12
    sc = S * 0.9 / ext; L = np.array([0.3, 0.5, 0.8]); L /= np.linalg.norm(L)
    for f in np.argsort(TT[:, :, 2].mean(1)):
        if nn2[f, 2] <= 0: continue
        sh = 0.55 + 0.45 * max(0, nn2[f] @ L)
        d.polygon([(S / 2 + (p[0] - (Q[:, 0].min() + Q[:, 0].max()) / 2) * sc, S * 0.95 - p[1] * sc) for p in TT[f]], fill=tuple((col[f] * sh).clip(0, 255).astype(int)))
    im.save(out + '_' + name + '.png')
if len(sys.argv) > 5:
    for v in ('front', 'back', 'side'): prev(v, v)
