import Thumb from './Thumb.jsx';
import AutoStrip from './AutoStrip.jsx';

/** Category chips strip (same on phone and laptop): auto-scrolls, swipe on phone, arrows on laptop. */
export default function CatChips({ sections, go, current }) {
  const items = sections.map(s => ({
    key: s.cat,
    node: (
      <button className={`chip${s.cat === current ? ' on' : ''}`} onClick={() => go(s.cat)}>
        <span className="chip-img"><Thumb item={s.items[0]} /></span><b>{s.cat}</b>
      </button>
    ),
  }));
  return <AutoStrip items={items} className="chips-strip" trackClass="chips-track" />;
}
