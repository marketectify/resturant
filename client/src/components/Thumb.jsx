// Item picture: uses `img` when the admin set one, otherwise a tinted tile with the item's emoji.
const hue = s => [...String(s || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export default function Thumb({ item, className = '' }) {
  if (item.img) return <img className={`thumb ${className}`} src={item.img} alt="" loading="lazy" />;
  return (
    <span className={`thumb ${className}`} style={{ '--h': hue(item.cat) }} aria-hidden="true">
      <span className="thumb-emoji">{item.emoji || '🍽️'}</span>
    </span>
  );
}
