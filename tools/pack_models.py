"""Pack OBJ+MTL building models into one compact gzip blob for the game.
Format (little endian): per model: positions Int16 xyz (quantised to 1/256 m... see scale), colours as material index per vertex,
indices Uint16. A JSON header describes offsets. Output: assets/models/city.bin.gz + assets/models/city.json"""
import json, gzip, struct, sys, pathlib

def load_mtl(p):
    mats, cur = {}, None
    for line in p.read_text().splitlines():
        t = line.split()
        if not t: continue
        if t[0] == 'newmtl': cur = t[1]
        elif t[0] == 'Kd' and cur: mats[cur] = [float(x) for x in t[1:4]]
    return mats

def load_obj(p):
    V, groups, mat = [], {}, None
    for line in p.read_text().splitlines():
        t = line.split()
        if not t: continue
        if t[0] == 'v': V.append([float(x) for x in t[1:4]])
        elif t[0] == 'usemtl': mat = t[1]
        elif t[0] == 'f':
            idx = [int(x.split('/')[0]) for x in t[1:]]
            idx = [i - 1 if i > 0 else len(V) + i for i in idx]
            for k in range(1, len(idx) - 1): groups.setdefault(mat, []).append((idx[0], idx[k], idx[k + 1]))
    return V, groups

def main(src, names, out):
    src = pathlib.Path(src); out = pathlib.Path(out); out.parent.mkdir(parents=True, exist_ok=True)
    blob, header = bytearray(), []
    for n in names:
        V, groups = load_obj(src / (n + '.obj')); mats = load_mtl(src / (n + '.mtl'))
        xs, ys, zs = zip(*V)
        lo = [min(xs), min(ys), min(zs)]; hi = [max(xs), max(ys), max(zs)]
        ext = max(h - l for h, l in zip(hi, lo)); q = 32767 / ext
        # one vertex per (position, material) so each material keeps a flat colour
        vmap, verts, cols, tris = {}, [], [], []
        mnames = sorted(groups)
        for mi, m in enumerate(mnames):
            for tri in groups[m]:
                out_t = []
                for i in tri:
                    key = (i, mi)
                    if key not in vmap: vmap[key] = len(verts); verts.append(V[i]); cols.append(mi)
                    out_t.append(vmap[key])
                tris.append(out_t)
        assert len(verts) < 65536
        off = len(blob)
        for v in verts: blob += struct.pack('<3h', *[round((v[k] - lo[k]) * q) for k in range(3)])
        blob += bytes(cols)
        if len(blob) % 2: blob += b'\0'
        ioff = len(blob)
        for t in tris: blob += struct.pack('<3H', *t)
        header.append({'name': n, 'lo': [round(x, 4) for x in lo], 'size': [round(h - l, 4) for h, l in zip(hi, lo)], 'q': q, 'off': off, 'nv': len(verts), 'ioff': ioff, 'nt': len(tris),
                       'cols': ['#%02x%02x%02x' % tuple(round(min(1, c) ** (1 / 2.2) * 255) for c in mats.get(m, [0.5, 0.5, 0.5])) for m in mnames], 'mats': mnames})
        print(n, 'verts', len(verts), 'tris', len(tris), 'size', [round(h - l, 2) for h, l in zip(hi, lo)], 'y0', round(lo[1], 2))
    gz = gzip.compress(bytes(blob), 9)
    (out.with_suffix('.bin.gz')).write_bytes(gz); out.with_suffix('.json').write_text(json.dumps(header))
    print('raw', len(blob), 'gz', len(gz))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[3].split(','), sys.argv[2])
