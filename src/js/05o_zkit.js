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
const zkReady = (key) => !!ZK.models[key];
// kit materials -> the toon look of the new levels (skinning flag kept for animated meshes)
function zkToon(mat, skinned) {
  const key = mat.uuid + (skinned ? 's' : '');
  let t = ZK.toon.get(key);
  if (!t) {
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
    m.castShadow = opts.shadow !== false; m.receiveShadow = true;
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
  } else inst.play = () => null;
  root.userData.zk = inst;
  return inst;
}
