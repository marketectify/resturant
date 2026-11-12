import { useState } from 'react';

// Item picture. Order of preference:
//   1. `img` set on the item (admin form / menu.json)
//   2. a photo dropped into client/public/menu/<item-name-as-slug>.jpg  (e.g. chicken-biryani.jpg)
//   3. a tinted tile with the item's emoji, so nothing ever shows a broken image
const hue = s => [...String(s || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
export const photoPath = name => `/menu/${String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpg`;

export default function Thumb({ item, className = '' }) {
  const [broken, setBroken] = useState(false);
  const src = item.img || photoPath(item.name);
  if (!broken) return <img className={`thumb ${className}`} src={src} alt="" loading="lazy" onError={() => setBroken(true)} />;
  return (
    <span className={`thumb ${className}`} style={{ '--h': hue(item.cat) }} aria-hidden="true">
      <span className="thumb-emoji">{item.emoji || '🍽️'}</span>
    </span>
  );
}
