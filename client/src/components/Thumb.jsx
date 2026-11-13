import { useEffect, useState } from 'react';
import { stockPhoto } from '../photos.js';

// Item picture. Order of preference:
//   1. `img` set on the item (admin form / menu.json)
//   2. a photo dropped into client/public/menu/<item-name-as-slug>.jpg (.webp, .png or .jpeg also work)
//   3. a free stock photo that matches the dish (photos.js)
//   4. a tinted tile with the item's emoji, so nothing ever shows a broken image
const hue = s => [...String(s || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const EXTS = ['jpg', 'webp', 'png', 'jpeg'];
const slug = name => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const photoPath = (name, ext = 'jpg') => `/menu/${slug(name)}.${ext}`;

// /menu/photos.json is written at build time (scripts/photos.mjs) and lists the photo files that exist, so the
// browser never requests photos that are not there (no 404 noise). If the list is missing (dev server) we fall
// back to trying each extension.
let manifest; // undefined = not loaded yet, null = unavailable, Set = file names
let loading = null;
const listeners = new Set();
function loadManifest() {
  if (loading) return;
  loading = fetch('/menu/photos.json')
    .then(r => (r.ok ? r.json() : null))
    .then(a => { manifest = Array.isArray(a) ? new Set(a) : null; })
    .catch(() => { manifest = null; })
    .finally(() => listeners.forEach(f => f()));
}

function Tile({ item, className }) {
  return (
    <span className={`thumb ${className}`} style={{ '--h': hue(item.cat) }} aria-hidden="true">
      <span className="thumb-emoji">{item.emoji || '🍽️'}</span>
    </span>
  );
}

export default function Thumb({ item, className = '' }) {
  const [, tick] = useState(0);
  const [fail, setFail] = useState(0); // how many sources in the list have failed to load
  useEffect(() => {
    if (manifest !== undefined) return undefined;
    listeners.add(() => tick(n => n + 1));
    loadManifest();
    return undefined;
  }, []);

  if (manifest === undefined && !item.img) return <Tile item={item} className={className} />;
  const stock = stockPhoto(item);
  let sources;
  if (item.img) sources = [item.img];
  else if (manifest) {
    const ext = EXTS.find(x => manifest.has(`${slug(item.name)}.${x}`));
    sources = [ext && photoPath(item.name, ext), stock];
  } else sources = [...EXTS.map(x => photoPath(item.name, x)), stock];
  sources = sources.filter(Boolean);

  const src = sources[fail];
  if (!src) return <Tile item={item} className={className} />;
  return <img className={`thumb ${className}`} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFail(n => n + 1)} />;
}
