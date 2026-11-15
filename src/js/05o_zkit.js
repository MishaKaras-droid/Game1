/* ============================================================ level 5 models: Zombie Apocalypse Kit by Quaternius (CC0)
   tools/pack_zombie_kit.mjs packs the chosen glTF files as GLBs into ZKIT_PACK (gzip + base64).
   Here they are unpacked once, parsed with THREE.GLTFLoader and cloned per use (skinned ones via SkeletonUtils). */
const ZK = { state: 'idle', models: {}, toon: new Map() };
(function zkDecode() {
  if (typeof ZKIT_PACK === 'undefined' || typeof DecompressionStream === 'undefined' || typeof THREE === 'undefined' || !THREE.GLTFLoader) { ZK.state = 'none'; return; }
  ZK.state = 'loading';
  try {
    gzB64(ZKIT_PACK.gz).then((buf) => {
      const loader = new THREE.GLTFLoader();
      let left = ZKIT_PACK.head.length;
      const done = () => { if (--left === 0) ZK.state = 'ready'; };
      for (const h of ZKIT_PACK.head) {
        loader.parse(buf.slice(h.off, h.off + h.len), '', (gltf) => {
          const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3());
          ZK.models[h.key] = { scene: gltf.scene, clips: gltf.animations, size, min: box.min.clone(), center: box.getCenter(new THREE.Vector3()) };
          done();
        }, (e) => { console.warn('zkit model', h.key, e); done(); });
      }
    }).catch((e) => { console.warn('zkit', e); ZK.state = 'none'; });
  } catch (e) { ZK.state = 'none'; }
})();
/* duck level 6: Cube World Kit by Quaternius (CC0), packed by tools/pack_cube_kit.mjs into CKIT_PACK.
   Its models go into the same ZK.models table (their own keys); the atlas texture every model shares is
   stored once in the pack head and handed to the materials through material.userData.atlas. */
ZK.cstate = 'idle'; ZK.atlas = [];
(function ckDecode() {
  if (typeof CKIT_PACK === 'undefined' || typeof DecompressionStream === 'undefined' || typeof THREE === 'undefined' || !THREE.GLTFLoader) { ZK.cstate = 'none'; return; }
  ZK.cstate = 'loading';
  try {
    ZK.atlas = CKIT_PACK.head.tex.map((t) => {
      const tx = new THREE.TextureLoader().load('data:' + t.mime + ';base64,' + t.b64);
      tx.flipY = false; tx.encoding = THREE.LinearEncoding; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.magFilter = THREE.NearestFilter; tx.generateMipmaps = false; tx.minFilter = THREE.LinearFilter;
      return tx;
    });
    // a copy of the atlas with one texel repainted (mushroom caps and the button top are red in the kit's own renders)
    const rc = document.createElement('canvas'); rc.width = rc.height = 32;
    ZK.atlasRed = new THREE.CanvasTexture(rc); ZK.atlasRed.flipY = false; ZK.atlasRed.wrapS = ZK.atlasRed.wrapT = THREE.RepeatWrapping; ZK.atlasRed.magFilter = THREE.NearestFilter; ZK.atlasRed.generateMipmaps = false; ZK.atlasRed.minFilter = THREE.LinearFilter;
    const ri = new Image(); ri.onload = () => { rc.width = ri.width; rc.height = ri.height; const c = rc.getContext('2d'); c.drawImage(ri, 0, 0); c.fillStyle = '#e23b2e'; c.fillRect(Math.floor(ri.width / 32), 0, Math.ceil(ri.width / 32), Math.ceil(ri.height / 32)); ZK.atlasRed.needsUpdate = true; };
    if (CKIT_PACK.head.tex[0]) ri.src = 'data:' + CKIT_PACK.head.tex[0].mime + ';base64,' + CKIT_PACK.head.tex[0].b64;
    gzB64(CKIT_PACK.gz).then((buf) => {
      const loader = new THREE.GLTFLoader(), list = CKIT_PACK.head.models;
      let left = list.length;
      const done = () => { if (--left === 0) ZK.cstate = 'ready'; };
      for (const h of list) {
        loader.parse(buf.slice(h.off, h.off + h.len), '', (gltf) => {
          const red = h.key === 'mushroom' || h.key === 'button';   // their caps point at a charcoal texel of the atlas: use the copy where it is red
          gltf.scene.traverse((m) => { if (m.isMesh) for (const mt of Array.isArray(m.material) ? m.material : [m.material]) if (mt.userData && mt.userData.atlas !== undefined) mt.map = (red && ZK.atlasRed) || ZK.atlas[mt.userData.atlas] || null; });
          const box = new THREE.Box3().setFromObject(gltf.scene);
          // skinned models: the stored box is not the character's size, so measure the skinned vertices once
          if (gltf.animations.length) {
            gltf.scene.updateMatrixWorld(true);
            const sb = new THREE.Box3(), v = new THREE.Vector3();
            gltf.scene.traverse((m) => {
              if (!m.isSkinnedMesh) return;
              // skin the vertices by hand (three r128 does not denormalise quantized attributes in boneTransform)
              const G = m.geometry.attributes, pa = G.position, si = G.skinIndex, sw = G.skinWeight, n = pa.count, step = Math.max(1, Math.floor(n / 1500));
              const den = (a) => (a.normalized ? 1 / (a.array instanceof Int16Array ? 32767 : a.array instanceof Uint16Array ? 65535 : a.array instanceof Int8Array ? 127 : 255) : 1);
              const kp = den(pa), kw = den(sw), bones = m.skeleton.bones, inv = m.skeleton.boneInverses, mats = bones.map((b, q) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, inv[q]));
              const p0 = new THREE.Vector3(), t = new THREE.Vector3();
              for (let i = 0; i < n; i += step) {
                p0.fromBufferAttribute(pa, i).multiplyScalar(kp).applyMatrix4(m.bindMatrix); v.set(0, 0, 0);
                let ws = 0;
                const W = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)], J = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
                for (let c = 0; c < 4; c++) { const w = W[c] * kw; if (w <= 0) continue; ws += w; v.addScaledVector(t.copy(p0).applyMatrix4(mats[J[c]]), w); }
                if (ws > 0) sb.expandByPoint(v.multiplyScalar(1 / ws));
              }
            });
            if (!sb.isEmpty()) box.copy(sb);
          }
          const size = box.getSize(new THREE.Vector3());
          ZK.models[h.key] = { skinBox: gltf.animations.length > 0, scene: gltf.scene, clips: gltf.animations, size, min: box.min.clone(), center: box.getCenter(new THREE.Vector3()) };
          done();
        }, (e) => { console.warn('ckit model', h.key, e); done(); });
      }
    }).catch((e) => { console.warn('ckit', e); ZK.cstate = 'none'; });
  } catch (e) { ZK.cstate = 'none'; }
})();
const zkReady = (key) => !!ZK.models[key];
// kit materials -> the toon look of the new levels (skinning flag kept for animated meshes)
function zkToon(mat, skinned) {
  const key = mat.uuid + (skinned ? 's' : '');
  let t = ZK.toon.get(key);
  if (!t) {
    // the game renders without sRGB output: keep the atlas colours as they are (like our canvas textures)
    if (mat.map) { mat.map.encoding = THREE.LinearEncoding; mat.map.needsUpdate = true; }
    t = new THREE.MeshToonMaterial({ color: mat.color ? mat.color.clone() : new THREE.Color('#fff'), map: mat.map || null, gradientMap: R3E.grad || null, emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0) });
    t.skinning = !!skinned;
    ZK.toon.set(key, t);
  }
  return t;
}
// a ready-to-place copy: feet on y = 0, centred on x/z, scaled to `height` metres, facing +z
function zkMake(key, height, opts) {
  const M = ZK.models[key]; if (!M) return null;
  opts = opts || {};
  const animated = M.clips.length > 0;
  const obj = animated && THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(M.scene) : M.scene.clone();
  obj.traverse((m) => {
    if (!m.isMesh) return;
    m.material = Array.isArray(m.material) ? m.material.map((x) => zkToon(x, m.isSkinnedMesh)) : zkToon(m.material, m.isSkinnedMesh);
    m.castShadow = opts.shadow !== false; m.receiveShadow = true; m.userData.shared = true;   // kit geometry is shared: never dispose it
    if (m.isSkinnedMesh) m.frustumCulled = false;
  });
  const k = height / (opts.by === 'len' ? Math.max(M.size.x, M.size.z) : M.size.y);
  obj.scale.setScalar(k);
  obj.position.set(-M.center.x * k, -M.min.y * k, -M.center.z * k);
  const root = new THREE.Group(); root.add(obj);
  if (opts.turn) root.rotation.y = opts.turn;
  const inst = { root, obj, mixer: null, actions: {}, cur: null };
  if (animated) {
    inst.mixer = new THREE.AnimationMixer(obj);
    for (const c of M.clips) inst.actions[c.name] = inst.mixer.clipAction(c);
    inst.play = (name, once, fade) => {
      const a = inst.actions[name]; if (!a || inst.cur === a) return a;
      a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = !!once;
      if (inst.cur) a.crossFadeFrom(inst.cur, fade === undefined ? 0.2 : fade, false);
      a.play(); inst.cur = a; return a;
    };
    if (opts.anim) { inst.play(opts.anim); if (opts.phase) inst.mixer.update(opts.phase); }
    // skinned models: the bind-pose box does not match the animated skeleton, so stand the lowest bone
    // (the ankles) a little above the road instead
    inst.mixer.update(0); root.updateMatrixWorld(true);
    let minY = Infinity; const v = new THREE.Vector3();
    obj.traverse((b) => { if (b.isBone) { v.setFromMatrixPosition(b.matrixWorld); if (v.y < minY) minY = v.y; } });
    if (isFinite(minY) && !M.skinBox) obj.position.y += height * 0.035 - minY;
  } else inst.play = () => null;
  root.userData.zk = inst;
  return inst;
}
