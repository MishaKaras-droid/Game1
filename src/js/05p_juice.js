/* ============================================================ DuckJuiceController bridge (duck levels 4+)
   src/level5_prologue_and_juice.js holds DuckJuiceController: lanes, jump with a buffer, slide, ground pound,
   homing chain, squash & stretch, FOV kick and camera shake, written for a duck mesh moving in plain x/y/z.
   Our track is a curved 3D ribbon, so the controller drives a stand-in object in "track space"
   (x = across the road, y = height, z = distance ahead, forward is -z) and we copy the result back:
   R.x / R.y / R.lane for the run, its scale and tilt onto the duck model (pivot at the feet),
   its FOV and shake onto the real camera. A homing dash pulls the duck forward along the track. */
function juiceInit(R) {
  if (typeof DuckJuiceController === 'undefined' || typeof THREE === 'undefined') return null;
  const proxy = new THREE.Object3D();
  const cam = { fov: 62, position: new THREE.Vector3(), updateProjectionMatrix() {} };
  const ctl = new DuckJuiceController(proxy, cam);
  const CF = runCfg();
  ctl.lanes = [laneX(0), laneX(1), laneX(2)]; ctl.currentLane = R.lane;
  ctl.gravity = -(CF.grav || 46); ctl.jumpForce = CF.jump || 15.5;
  ctl.baseFov = 62; ctl.boostFov = 84; ctl.baseCameraPos.set(0, 0, 0); ctl.homingSpeed = 44;
  proxy.position.set(R.x, R.y, 0);
  return { ctl, proxy, cam, lastY: R.y, lastVy: R.vy };
}
// enemies in reach of a homing dash, as stand-ins in track space
function juiceTargets(R) {
  const out = [], T = runCfg().targets;
  for (let j = R.i; j < R.objs.length; j++) {
    const o = R.objs[j], dz = o.d - R.s;
    if (dz > 15) break;
    if (o.dead || dz < 0.6 || !T.includes(o.type)) continue;
    const p = o._jp || (o._jp = { position: new THREE.Vector3(), obj: o });
    p.position.set(o.x, o.h || 0, -dz); out.push(p);
  }
  return out;
}
function juiceStep(R, dt) {
  const J = R.juice, c = J.ctl, p = J.proxy, CF = runCfg();
  // anything else that moved the duck (springs, stomps, the boss homing dash) is handed to the controller
  if (R.y !== J.lastY || R.vy !== J.lastVy) {
    p.position.y = R.y; c.velocityY = R.vy; c.isGrounded = R.y <= 0 && R.vy <= 0;
    if (!c.isGrounded) c.isSliding = false;
  }
  c.currentLane = R.lane;
  // glide (our addition): holding jump on the way down
  R.gliding = R.jumpHeld && !c.isHoming && c.velocityY < 0 && p.position.y > 0.25 && !c.isGroundPounding && G.player.alive;
  c.gravity = -(CF.grav || 46) * (R.gliding ? 0.22 : 1);
  if (c.isHoming && c.homingTarget) {
    const o = c.homingTarget.obj;
    J.homeT = (J.homeT || 0) + dt;
    // a target that was dead, or a dash that takes too long, ends the dash
    if (o.dead || J.homeT > 0.7) { c.isHoming = false; c.homingTarget = null; c.targetScale.set(1, 1, 1); J.homeT = 0; }
    // one dash step can overshoot a close enemy: an enemy level with or behind the duck counts as reached
    else c.homingTarget.position.set(o.x, o.h || 0, Math.min(0, -(o.d - R.s)));
  } else J.homeT = 0;
  const wasGround = c.isGrounded;
  c.isBoosting = R.boost > 0 || R.fever > 0 || R.armor > 0;
  c.update(dt, (t, combo) => juiceHit(R, t.obj, combo), () => groundPoundLand(R));
  if (R.gliding) c.velocityY = Math.max(c.velocityY, -2.2);
  // the homing dash moves the stand-in ahead: turn that into track distance
  if (p.position.z < 0) R.s += -p.position.z;
  p.position.z = 0;
  R.x = p.position.x; R.y = Math.max(0, p.position.y); R.vy = c.velocityY; R.lane = c.currentLane;
  R.roll = c.isSliding ? Math.max(0.05, c.slideTimer) : 0;
  R.slam = c.isGroundPounding; R.homing = c.isHoming;
  if (!wasGround && c.isGrounded) {
    R.dj = false;
    if (R.jumpBuf > 0) { R.jumpBuf = 0; c.jump(); }
    const a = runPlayerScreen(); burst(a.sx, a.sy, 5, { type: 'smoke', col: 'rgba(230,215,190,A)', r: 4, r1: 14, smin: 30, smax: 90, lmin: 0.3, lmax: 0.5 });
  }
  J.lastY = R.y; J.lastVy = R.vy;
}
// controls (levels 4+): jump = ground jump / homing chain / double jump, down = slide / ground pound
function juiceJump(R) {
  const c = R.juice.ctl;
  R.jumpHeld = true;
  if (R.target && R.target.boss) return runHoming();          // boss weak spots keep their own dash
  if (c.isGrounded) { c.jump(); R.dj = false; sfx('swoosh'); return; }
  if (!c.isHoming) {
    const tg = juiceTargets(R);
    if (tg.length) { c.jump(tg); if (c.isHoming) { sfx('swoosh'); R.flap = 0; return; } }
  }
  if (!R.dj && !c.isHoming) {
    R.dj = true; c.velocityY = Math.max(c.velocityY, 11.5); c.isGroundPounding = false; R.flap = 0.4;
    c.duck.scale.set(0.85, 1.2, 0.85); sfx('swoosh'); sfx('quack'); return;
  }
  if (c.velocityY < 0 && R.y < 1.3) R.jumpBuf = 0.2;
}
function juiceDown(R) {
  const c = R.juice.ctl;
  if (c.isHoming) return;
  const air = !c.isGrounded;
  c.slide();
  if (air) { R.jumpHeld = false; sfx('swoosh'); } else sfx('throw');
}
function juiceLane(R, dir) {
  const c = R.juice.ctl, before = c.currentLane;
  if (dir < 0) c.moveLeft(); else c.moveRight();
  if (c.currentLane === before) { G.shake = Math.max(G.shake, 3); return; }
  R.lane = c.currentLane; sfx('click');
}
// a homing dash connected: break the enemy, count the chain
function juiceHit(R, o, combo) {
  if (!o || o.dead) return;
  const q = runProj(o.x, (o.h || 0) + 0.8, o.d - R.s + RUN.PZ);
  runDestroy(o, q);
  addScore(150 * combo, q.sx, q.sy);
  if (combo >= 2) floatText(q.sx, q.sy - 46, 'ЦЕПОЧКА ×' + combo, '#7ee7f2', 22 + Math.min(12, combo * 2));
  G.hitStop = 0.05; sfx('pop');
  R.streak = { x0: q.sx, y0: q.sy + 60, x1: q.sx, y1: q.sy, t: 0.2 };
  if (runCfg().onChain) runCfg().onChain(o, combo);
}
// ground pound landing: a shockwave breaks what is around the duck
const POUND_OK = ['capy', 'floppa', 'bonk', 'clock', 'books', 'stack', 'cone', 'barrier', 'sheet', 'cite', 'two', 'clip', 'edit', 'pigeon', 'crow',
  'zombie', 'chubby', 'crate', 'trash', 'plastic', 'jbarrel', 'jtires', 'jtrash', 'minion'];
function groundPoundLand(R) {
  let n = 0;
  for (let j = R.i; j < R.objs.length; j++) {
    const o = R.objs[j], dz = o.d - R.s;
    if (dz > 5) break;
    if (o.dead || dz < -1.5 || Math.abs(o.x - R.x) > 2.6 || (o.h || 0) > 1.6) continue;
    if (POUND_OK.includes(o.type)) { runDestroy(o); n++; }
  }
  const a = runPlayerScreen();
  floatText(a.sx, a.sy - a.k * 1.8, n ? 'БУМ! ×' + n : 'БУМ!', '#ffd43b', 30);
  G.shake = Math.max(G.shake, 12); sfx('boom'); if (n) addScore(120 * n, a.sx, a.sy - 40);
  R.pound = 0.5;
  if (runCfg().onPound) runCfg().onPound(R);
}
// visual side: squash & stretch and tilt on the model (its group pivots at the feet), camera FOV and shake
function juiceVisual(R, D, cam) {
  const J = R.juice; if (!J || !D.model) return;
  const jg = D.model.juice, p = J.proxy;
  jg.scale.copy(p.scale);
  jg.rotation.z = p.rotation.z;
  jg.rotation.x = p.rotation.x;
  if (cam) {
    if (Math.abs(cam.fov - J.cam.fov) > 0.05) { cam.fov = J.cam.fov; cam.updateProjectionMatrix(); }
    cam.position.add(J.cam.position);
  }
}
// the ground pound shockwave ring in 3D
function juiceFrame(R, D, F, dt) {
  if (!R3E.poundFx) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.0, 48), new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.visible = false; R3.scene.add(ring); R3E.poundFx = ring;
  }
  const ring = R3E.poundFx;
  if (R.pound > 0) {
    R.pound = Math.max(0, R.pound - dt);
    const e = 1 - R.pound / 0.5;
    ring.visible = true; ring.position.copy(D.root.position).addScaledVector(F.u, 0.06);
    orient(ring, F); ring.rotateX(-Math.PI / 2); ring.scale.setScalar(1 + e * 4.5); ring.material.opacity = 0.85 * (1 - e);
  } else ring.visible = false;
}
