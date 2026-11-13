// Lists which menu items already have a photo in client/public/menu/ and which still need one.
//   node scripts/photos.mjs
import fs from 'node:fs';
const menu = JSON.parse(fs.readFileSync(new URL('../shared/menu.json', import.meta.url), 'utf8'));
const dir = new URL('../client/public/menu/', import.meta.url);
const have = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const exts = ['jpg', 'webp', 'png', 'jpeg'];
if (process.argv.includes('--write')) {
  const files = [...have].filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(new URL('photos.json', dir), JSON.stringify(files));
  console.log(`photos.json written (${files.length} photo files)`);
  process.exit(0);
}
const missing = menu.filter(m => !exts.some(e => have.has(`${slug(m.name)}.${e}`)));
console.log(`${menu.length - missing.length} of ${menu.length} items have a photo.`);
if (missing.length) { console.log('\nStill needed (file name -> item):'); for (const m of missing) console.log(`  ${slug(m.name)}.jpg  ->  ${m.cat}: ${m.name}`); }
