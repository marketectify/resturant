import { useState } from 'react';

// Item picture. Order of preference:
//   1. `img` set on the item (admin form / menu.json)
//   2. a photo dropped into client/public/menu/<item-name-as-slug>.jpg (.webp, .png or .jpeg also work)
//   3. a tinted tile with the item's emoji, so nothing ever shows a broken image
const hue = s => [...String(s || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const EXTS = ['jpg', 'webp', 'png', 'jpeg'];
export const photoPath = (name, ext = 'jpg') => `/menu/${String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.${ext}`;

export default function Thumb({ item, className = '' }) {
  const [tried, setTried] = useState(0); // how many file extensions have failed so far
  const src = item.img || photoPath(item.name, EXTS[tried]);
  const lastTry = item.img ? 0 : EXTS.length - 1;
  if (tried <= lastTry) return <img className={`thumb ${className}`} src={src} alt="" loading="lazy" onError={() => setTried(n => n + 1)} />;
  return (
    <span className={`thumb ${className}`} style={{ '--h': hue(item.cat) }} aria-hidden="true">
      <span className="thumb-emoji">{item.emoji || '🍽️'}</span>
    </span>
  );
}
