// Pack the chosen Zombie Apocalypse Kit models (Quaternius, CC0) into one gzip blob for level 5.
// usage: node tools/pack_zombie_kit.mjs <kit dir> <out prefix>   (needs @gltf-transform/* in NODE_PATH)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, resample, quantize, weld } from '@gltf-transform/functions';
import fs from 'fs'; import zlib from 'zlib'; import path from 'path';

const [kit, out] = process.argv.slice(2);
const MODELS = {
  zombie: ['Characters', 'Zombie_Basic', ['Run', 'Death']],
  chubby: ['Characters', 'Zombie_Chubby', ['Walk', 'Death']],
  troll: ['Characters', 'Zombie_Arm', ['Idle', 'Punch', 'Wave', 'HitReact', 'Death', 'Jump_Land']],
  taxi: ['Vehicles', 'Vehicle_Sports', []],
  armored: ['Vehicles', 'Vehicle_Sports_Armored', []],
  barrierHigh: ['Environment', 'TrafficBarrier_1', []],
  barrierLow: ['Environment', 'TrafficBarrier_2', []],
  plastic: ['Environment', 'PlasticBarrier', []],
  couch: ['Environment', 'Couch', []],
  pallet: ['Environment', 'Pallet', []],
  barrel: ['Environment', 'Barrel', []],
  trash: ['Environment', 'TrashBag_1', []],
  tires: ['Environment', 'Wheels_Stack', []],
  cone: ['Environment', 'TrafficCone_1', []],
  lamp: ['Environment', 'StreetLights', []],
  light: ['Environment', 'TrafficLight_1', []],
  container: ['Environment', 'Container_Red', []],
  tower: ['Environment', 'WaterTower', []],
  hydrant: ['Environment', 'FireHydrant', []],
};
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const parts = [], head = [];
let off = 0;
for (const [key, [dir, name, keep]] of Object.entries(MODELS)) {
  const doc = await io.read(path.join(kit, dir, 'glTF', name + '.gltf'));
  const root = doc.getRoot();
  // drop unused clips together with their samplers, so their keyframe data is really removed
  for (const a of root.listAnimations()) if (!keep.includes(a.getName())) { for (const c of a.listChannels()) c.dispose(); for (const sm of a.listSamplers()) sm.dispose(); a.dispose(); }
  await doc.transform(dedup(), resample(), weld(), prune({ keepAttributes: false }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeWeight: 8 }));
  const glb = Buffer.from(await io.writeBinary(doc));
  head.push({ key, name, off, len: glb.length, anims: root.listAnimations().map((a) => a.getName()) });
  parts.push(glb); off += glb.length;
  console.log(key.padEnd(12), name.padEnd(24), (glb.length / 1024).toFixed(0).padStart(5), 'KB', root.listAnimations().map((a) => a.getName()).join(','));
}
const all = Buffer.concat(parts), gz = zlib.gzipSync(all, { level: 9 });
fs.writeFileSync(out + '.bin.gz', gz); fs.writeFileSync(out + '.json', JSON.stringify(head));
console.log('raw', (all.length / 1024).toFixed(0), 'KB  gz', (gz.length / 1024).toFixed(0), 'KB');
