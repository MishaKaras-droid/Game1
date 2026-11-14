"""Minimal binary FBX reader (7.x): returns a node tree; arrays are decoded (zlib) into python lists."""
import struct, zlib, sys

def read(path):
    b = open(path, 'rb').read()
    assert b[:20] == b'Kaydara FBX Binary  '
    ver = struct.unpack_from('<I', b, 23)[0]
    wide = ver >= 7500
    def prop(o):
        t = chr(b[o]); o += 1
        if t in 'YCIFDL':
            fmt = {'Y': '<h', 'C': '<?', 'I': '<i', 'F': '<f', 'D': '<d', 'L': '<q'}[t]
            return struct.unpack_from(fmt, b, o)[0], o + struct.calcsize(fmt)
        if t in 'fdlib':
            n, enc, clen = struct.unpack_from('<III', b, o); o += 12
            raw = b[o:o + clen]; o += clen
            if enc: raw = zlib.decompress(raw)
            fmt = {'f': 'f', 'd': 'd', 'l': 'q', 'i': 'i', 'b': '?'}[t]
            return list(struct.unpack('<%d%s' % (n, fmt), raw)), o
        if t in 'SR':
            n = struct.unpack_from('<I', b, o)[0]; o += 4
            return b[o:o + n], o + n
        raise ValueError('prop type ' + t)
    def node(o):
        if wide: end, np_, plen = struct.unpack_from('<QQQ', b, o); o += 24
        else: end, np_, plen = struct.unpack_from('<III', b, o); o += 12
        nl = b[o]; o += 1
        if end == 0: return None, o
        name = b[o:o + nl].decode(); o += nl
        props = []
        for _ in range(np_):
            v, o = prop(o); props.append(v)
        kids = []
        while o < end:
            k, o = node(o)
            if k is None: break
            kids.append(k)
        return {'name': name, 'props': props, 'kids': kids}, end
    o, top = 27, []
    while o < len(b) - 200:
        n, o2 = node(o)
        if n is None: break
        top.append(n); o = o2
    return ver, top

def find(n, name):
    return [k for k in n['kids'] if k['name'] == name]

def dump(nodes, depth=0, maxd=3):
    for n in nodes:
        ps = []
        for p in n['props']:
            if isinstance(p, list): ps.append('[%d]' % len(p))
            elif isinstance(p, bytes): ps.append(repr(p[:40]) if len(p) < 200 else '<bytes %d>' % len(p))
            else: ps.append(repr(p))
        print('  ' * depth + n['name'], ' '.join(ps)[:160])
        if depth < maxd: dump(n['kids'], depth + 1, maxd)

if __name__ == '__main__':
    ver, top = read(sys.argv[1]); print('version', ver)
    dump([t for t in top if t['name'] in ('Objects', 'Connections')], 0, int(sys.argv[2]) if len(sys.argv) > 2 else 2)
