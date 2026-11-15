// Pack the chosen Cube World Kit models (Quaternius, CC0) into one gzip blob for duck level 6.
// usage: node tools/pack_cube_kit.mjs <kit dir> <out prefix>   (needs @gltf-transform/* in NODE_PATH)
// Texture coordinates stay unquantized (quantizing them needs a texture transform on the texture we take out).
// Every model of the kit embeds the same small atlas texture: it is taken out of the GLBs and stored once
// in the head (head.tex), each material remembers its texture index in extras.atlas (-> material.userData.atlas).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, resample, quantize, weld } from '@gltf-transform/functions';
import fs from 'fs'; import zlib from 'zlib'; import path from 'path'; import crypto from 'crypto';

const [kit, out] = process.argv.slice(2);
const MODELS = {
  // enemies and the boss
  skel: ['Enemies', 'Skeleton', ['Idle', 'Attack', 'Run']],
  skelA: ['Enemies', 'Skeleton_Armor', ['Idle', 'Attack']],
  gob: ['Enemies', 'Goblin', ['Run']],
  demon: ['Enemies', 'Demon', ['Walk']],
  yeti: ['Enemies', 'Yeti', ['Idle', 'Attack']],
  giant: ['Enemies', 'Giant', ['Idle', 'Run', 'Attack', 'HitRecieve', 'Death']],
  // peaceful mobs
  sheep: ['Animals', 'Sheep', ['Walk']],
  pig: ['Animals', 'Pig', ['Walk']],
  chicken: ['Animals', 'Chicken', ['Run']],
  // blocks
  bGrass: ['Blocks', 'Block_Grass', []],
  bDirt: ['Blocks', 'Block_Dirt', []],
  bStone: ['Blocks', 'Block_Stone', []],
  bBrick: ['Blocks', 'Block_Brick', []],
  bGrey: ['Blocks', 'Block_GreyBricks', []],
  bCheese: ['Blocks', 'Block_Cheese', []],
  bCrate: ['Blocks', 'Block_Crate', []],
  bDiamond: ['Blocks', 'Block_Diamond', []],
  bCommand: ['Blocks', 'Block_Blank', []],
  bMetal: ['Blocks', 'Block_Metal', []],
  bSnow: ['Blocks', 'Block_Snow', []],
  bPlanks: ['Blocks', 'Block_WoodPlanks', []],
  // scenery and things
  tree1: ['Environment', 'Tree_1', []],
  tree2: ['Environment', 'Tree_2', []],
  tree3: ['Environment', 'Tree_3', []],
  bamboo: ['Environment', 'Bamboo', []],
  bambooS: ['Environment', 'Bamboo_Small', []],
  bush: ['Environment', 'Bush', []],
  mushroom: ['Environment', 'Mushroom', []],
  grass: ['Environment', 'Grass_Big', []],
  rock: ['Environment', 'Rock2', []],
  crystal: ['Environment', 'Crystal_Big', []],
  cart: ['Environment', 'Cart', []],
  rail: ['Environment', 'Rail_Straight', []],
  chest: ['Environment', 'Chest_Closed', []],
  key: ['Environment', 'Key', []],
  button: ['Environment', 'Button', []],
  fence: ['Environment', 'Fence_Center', []],
  door: ['Environment', 'Door_Closed', []],
  // tools the boss and the skeletons throw
  axe: ['Tools', 'Axe_Stone', []],
  pick: ['Tools', 'Pickaxe_Gold', []],
  sword: ['Tools', 'Sword_Stone', []],
};
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const parts = [], head = [], tex = [], texKey = new Map();
let off = 0;
for (const [key, [dir, name, keep]] of Object.entries(MODELS)) {
  const doc = await io.read(path.join(kit, dir, 'glTF', name + '.gltf'));
  const root = doc.getRoot();
  for (const a of root.listAnimations()) if (!keep.includes(a.getName())) { for (const c of a.listChannels()) c.dispose(); for (const sm of a.listSamplers()) sm.dispose(); a.dispose(); }
  for (const m of root.listMaterials()) {
    const t = m.getBaseColorTexture(); if (!t) continue;
    const img = Buffer.from(t.getImage()), h = crypto.createHash('md5').update(img).digest('hex');
    if (!texKey.has(h)) { texKey.set(h, tex.length); tex.push({ mime: t.getMimeType(), b64: img.toString('base64') }); }
    m.setExtras(Object.assign({}, m.getExtras(), { atlas: texKey.get(h) })); m.setBaseColorTexture(null);
  }
  await doc.transform(dedup(), resample(), weld(), prune({ keepAttributes: true }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeWeight: 8, pattern: /^(POSITION|NORMAL|JOINTS|WEIGHTS)(_\d+)?$/ }));
  const glb = Buffer.from(await io.writeBinary(doc));
  head.push({ key, name, off, len: glb.length, anims: root.listAnimations().map((a) => a.getName()) });
  parts.push(glb); off += glb.length;
  console.log(key.padEnd(10), name.padEnd(20), (glb.length / 1024).toFixed(0).padStart(5), 'KB', root.listAnimations().map((a) => a.getName()).join(','));
}
const all = Buffer.concat(parts), gz = zlib.gzipSync(all, { level: 9 });
fs.writeFileSync(out + '.bin.gz', gz); fs.writeFileSync(out + '.json', JSON.stringify({ models: head, tex }));
console.log('raw', (all.length / 1024).toFixed(0), 'KB  gz', (gz.length / 1024).toFixed(0), 'KB  textures', tex.length, tex.map((t) => (t.b64.length / 1366).toFixed(0) + ' KB').join(' '));
