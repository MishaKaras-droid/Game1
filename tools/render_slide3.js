// Renders assets/slide3.svg (prologue panel 3: the Academic Troll blocks the road) from the game's own 3D models.
// usage: node tools/render_slide3.js   (after tools/build.py; uses the preinstalled Playwright Chromium)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1344, height: 768 } });
  await p.goto('file://' + path.join(root, 'dist', 'kryabul-standalone.html'));
  await p.waitForFunction(() => window.__kb && window.__kb.x.ZK.state === 'ready', null, { timeout: 60000 });
  const png = await p.evaluate(() => {
    const W = 1344, H = 768, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); r.setSize(W, H, false);
    r.shadowMap.enabled = true;
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 400);
    sc.background = new THREE.Color('#2a2440'); sc.fog = new THREE.Fog('#3b3352', 30, 90);
    sc.add(new THREE.HemisphereLight('#c9b8ff', '#3a3a2a', 0.75));
    const sun = new THREE.DirectionalLight('#ffd8a0', 1.1); sun.position.set(-8, 14, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 }); sc.add(sun);
    const rim = new THREE.DirectionalLight('#9dff6a', 0.6); rim.position.set(10, 6, -12); sc.add(rim);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 120), new THREE.MeshLambertMaterial({ color: '#4a4e57' })); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; sc.add(road);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: '#2f3329' })); side.rotation.x = -Math.PI / 2; side.position.y = -0.02; side.receiveShadow = true; sc.add(side);
    for (let z = -50; z < 20; z += 6) for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 2.5), new THREE.MeshBasicMaterial({ color: '#ffd43b' })); m.position.set(s * 0.1 + s * 2.2, 0.01, z); sc.add(m); }
    // skyline
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) { const h = 10 + rnd() * 26, w = 5 + rnd() * 6; const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? '#3d3858' : '#47406a' })); m.position.set((i % 2 ? 1 : -1) * (12 + rnd() * 14), h / 2, -10 - i * 3.2); sc.add(m); }
    const put = (key, size, x, z, ry, opts, t) => { const o = window.__kb.x.zkMake(key, size, opts); if (!o) return null; o.root.position.set(x, 0, z); o.root.rotation.y = ry || 0; if (o.mixer) o.mixer.update(t || 0.4); sc.add(o.root); o.root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
    put('troll', 7.0, 0.5, -11, 0.15, { anim: 'Wave' }, 0.6);
    put('zombie', 1.8, -3.2, -1.5, 0.5, { anim: 'Run' }, 0.2);
    put('zombie', 1.8, 3.4, -3.0, -0.4, { anim: 'Run' }, 0.5);
    put('chubby', 2.3, -5.4, -6, 0.6, { anim: 'Walk' }, 0.3);
    put('chubby', 2.3, 5.6, -7.5, -0.5, { anim: 'Walk' }, 0.7);
    put('taxi', 4.4, -6.2, 2.5, 0.9, { by: 'len' });
    put('couch', 2.3, 4.6, 2.8, -0.6, { by: 'len' });
    put('barrierHigh', 2.2, 0, 3.5, 0, { by: 'len' });
    put('barrel', 1.1, 2.2, 1.2, 0); put('trash', 0.8, -1.8, 3.8, 0); put('tires', 1.0, 6.4, -1, 0); put('lamp', 6, -7.5, -14, 1.57); put('light', 5.5, 7.5, -12, -1.57);
    cam.position.set(0, 2.6, 15); cam.lookAt(0, 4.2, -8);
    r.render(sc, cam);
    return cv.toDataURL('image/png');
  });
  const buf = Buffer.from(png.split(',')[1], 'base64');
  fs.writeFileSync(path.join(root, 'assets', 'slide3.png.tmp'), buf);
  await b.close();
  console.log('rendered slide 3');
})();
