"""Meshy FBX duck -> decimated low-poly mesh, coloured per face from the reference picture.
Front-visible faces take the picture's colour; hidden faces (back, under the hair) get the colour of the nearest
visible face across the mesh. Output: assets/models/duck.bin.gz + duck.json (positions Int16, face colours RGB8)."""
import sys, json, gzip, struct, collections
import numpy as np, pyfqmr
from PIL import Image, ImageDraw
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from fbx_read import read, find

fbx, picture, out, target = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 9000
ver, top = read(fbx)
obj = [t for t in top if t['name'] == 'Objects'][0]; geo = find(obj, 'Geometry')[0]
V = np.array(find(geo, 'Vertices')[0]['props'][0]).reshape(-1, 3)
I = np.array(find(geo, 'PolygonVertexIndex')[0]['props'][0]); I = np.where(I < 0, ~I, I).reshape(-1, 3)
P = np.stack([V[:, 0], V[:, 2], -V[:, 1]], 1)  # Lcl Rotation -90 X: y up, the duck looks towards +z
s = pyfqmr.Simplify(); s.setMesh(P, I); s.simplify_mesh(target_count=target, aggressiveness=7, preserve_border=True, verbose=0)
P, I, _ = s.getMesh(); P = np.asarray(P, float); I = np.asarray(I, int)
P[:, 1] -= P[:, 1].min()  # feet on the ground
T = P[I]; nrm = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]); nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12

# picture: foreground = not the flat grey background
img = Image.open(picture).convert('RGB'); W, H = img.size; A = np.asarray(img).astype(float)
bg = np.median(np.concatenate([A[:8].reshape(-1, 3), A[:, :8].reshape(-1, 3)]), 0)
fg = np.linalg.norm(A - bg, axis=2) > 28
ys, xs = np.nonzero(fg); ib = [xs.min(), ys.min(), xs.max(), ys.max()]
mx0, mx1, my0, my1 = P[:, 0].min(), P[:, 0].max(), P[:, 1].min(), P[:, 1].max()
def to_img(p):  # orthographic front view fitted to the picture's silhouette box
    return np.stack([ib[0] + (p[..., 0] - mx0) / (mx1 - mx0) * (ib[2] - ib[0]), ib[3] - (p[..., 1] - my0) / (my1 - my0) * (ib[3] - ib[1])], -1)

# face-id buffer, painter's order (far to near)
idimg = Image.new('I', (W, H), -1); dr = ImageDraw.Draw(idimg)
order = np.argsort(T[:, :, 2].mean(1))
T2 = to_img(T)
for f in order:
    if nrm[f, 2] <= 0: continue
    dr.polygon([tuple(q) for q in T2[f]], fill=int(f))
ids = np.asarray(idimg).astype(np.int64)
cnt = np.bincount(ids[(ids >= 0) & fg], minlength=len(I))
acc = np.zeros((len(I), 3))
for c in range(3): acc[:, c] = np.bincount(ids[(ids >= 0) & fg], weights=A[..., c][(ids >= 0) & fg], minlength=len(I))
vis = (cnt >= 2) & (nrm[:, 2] > 0.3)
col = np.zeros((len(I), 3)); col[vis] = acc[vis] / cnt[vis, None]
# small faces seen only at a few pixels: take the pixel under their centre
cen = to_img(T.mean(1)).round().astype(int)
for f in np.nonzero(~vis & (nrm[:, 2] > 0.3))[0]:
    x, y = cen[f]
    if 0 <= x < W and 0 <= y < H and fg[y, x] and ids[y, x] >= 0 and abs(ids[y, x] - f) >= 0 and vis[ids[y, x]]:
        pass
# spread colours to hidden faces through shared vertices (multi-source BFS)
v2f = collections.defaultdict(list)
for f, tri in enumerate(I):
    for v in tri: v2f[v].append(f)
q = collections.deque(np.nonzero(vis)[0]); done = vis.copy()
while q:
    f = q.popleft()
    for v in I[f]:
        for g in v2f[v]:
            if not done[g]: done[g] = True; col[g] = col[f]; q.append(g)
col[~done] = [240, 200, 60]
# hair should cover the back of the head: hidden faces high up and behind become hair
hair = np.array([214, 178, 104]); headY = P[:, 1].max() * 0.62
back = (~vis) & (T.mean(1)[:, 1] > headY) & (T.mean(1)[:, 2] < 0.05)
col[back] = hair
# hidden faces: clean up by zone, the spread can carry beak/feet/eye colours onto the back
pal = {'yellow': np.array([243, 206, 40]), 'hair': hair, 'orange': np.array([238, 112, 40]), 'grey': np.array([222, 222, 228]), 'purple': np.array([150, 80, 150]), 'dark': np.array([60, 50, 60])}
names = list(pal); PA = np.array([pal[k] for k in names], float)
vy = col[vis & (np.linalg.norm(col - pal['yellow'], axis=1) < 60)]
if len(vy): pal['yellow'] = np.median(vy, 0); PA[0] = pal['yellow']
C = T.mean(1); hgt = P[:, 1].max(); footY = hgt * 0.1
knife = (C[:, 0] < P[:, 0].min() * 0.55) & (C[:, 1] > hgt * 0.45)
for f in np.nonzero(~vis & ~back)[0]:
    k = names[int(np.argmin(np.linalg.norm(PA - col[f], axis=1)))]
    if knife[f] and k in ('grey', 'purple', 'dark'): continue
    if C[f, 1] < footY: col[f] = pal['orange']
    elif k == 'hair' and C[f, 1] > hgt * 0.45: col[f] = hair
    else: col[f] = pal['yellow']
print('tris', len(I), 'visible', int(vis.sum()), 'size', P.max(0) - P.min(0))

# pack: positions quantised over the bbox, face colours
lo = P.min(0); ext = (P.max(0) - lo).max(); qn = 32767 / ext
blob = bytearray()
for p in P: blob += struct.pack('<3h', *np.round((p - lo) * qn).astype(int))
ioff = len(blob)
for t in I: blob += struct.pack('<3H', *t)
coff = len(blob); blob += bytes(np.clip(col, 0, 255).astype(np.uint8).ravel())
gz = gzip.compress(bytes(blob), 9)
open(out + '.bin.gz', 'wb').write(gz)
json.dump({'lo': lo.round(5).tolist(), 'q': qn, 'nv': len(P), 'nt': len(I), 'ioff': ioff, 'coff': coff, 'size': (P.max(0) - lo).round(4).tolist()}, open(out + '.json', 'w'))
print('raw', len(blob), 'gz', len(gz))
# preview renders: front and back
def prev(view, name):
    S = 600; im = Image.new('RGB', (S, S), (200, 205, 215)); d = ImageDraw.Draw(im)
    Q = P.copy()
    if view == 'back': Q[:, 0] *= -1; Q[:, 2] *= -1
    if view == 'side': Q = np.stack([Q[:, 2], Q[:, 1], -Q[:, 0]], 1)
    TT = Q[I]; nn = np.cross(TT[:, 1] - TT[:, 0], TT[:, 2] - TT[:, 0]); nn /= np.linalg.norm(nn, axis=1, keepdims=True) + 1e-12
    sc = S * 0.9 / ext
    L = np.array([0.3, 0.5, 0.8]); L /= np.linalg.norm(L)
    for f in np.argsort(TT[:, :, 2].mean(1)):
        if nn[f, 2] <= 0: continue
        sh = 0.55 + 0.45 * max(0, nn[f] @ L)
        pts = [(S / 2 + p[0] * sc, S * 0.95 - p[1] * sc) for p in TT[f]]
        d.polygon(pts, fill=tuple((col[f] * sh).clip(0, 255).astype(int)))
    im.save(out + '_' + name + '.png')
if len(sys.argv) > 5:
    for v in ('front', 'back', 'side'): prev(v, v)
