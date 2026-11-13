import { useEffect, useState } from 'react';

// Item picture. Order of preference:
//   1. `img` set on the item (admin form / menu.json)
//   2. a photo dropped into client/public/menu/<item-name-as-slug>.jpg (.webp, .png or .jpeg also work)
//   3. a tinted tile with the item's emoji, so nothing ever shows a broken image
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
  const [tried, setTried] = useState(0); // probing only: extensions that failed so far
  useEffect(() => {
    if (manifest !== undefined) return undefined;
    listeners.add(() => tick(n => n + 1));
    loadManifest();
    return undefined;
  }, []);

  if (item.img) return <img className={`thumb ${className}`} src={item.img} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />;
  if (manifest === undefined) return <Tile item={item} className={className} />;
  if (manifest) {
    const ext = EXTS.find(x => manifest.has(`${slug(item.name)}.${x}`));
    return ext ? <img className={`thumb ${className}`} src={photoPath(item.name, ext)} alt="" loading="lazy" /> : <Tile item={item} className={className} />;
  }
  if (tried < EXTS.length) return <img className={`thumb ${className}`} src={photoPath(item.name, EXTS[tried])} alt="" loading="lazy" onError={() => setTried(n => n + 1)} />;
  return <Tile item={item} className={className} />;
}
