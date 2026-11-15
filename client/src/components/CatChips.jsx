import { useEffect, useRef } from 'react';
import Thumb from './Thumb.jsx';
import Icon from './Icon.jsx';

const SPEED = 24; // px per second: slow, gentle auto-scroll

/**
 * Category chips strip (same on phone and laptop). It scrolls by itself, slowly and endlessly; the customer can also swipe or drag it
 * (phones) or use the arrows (laptops). Auto-scroll pauses while they interact, then carries on.
 */
export default function CatChips({ sections, go, current, onAll }) {
  const box = useRef(null);
  const n = sections.length;
  const holdRef = useRef(() => {});

  useEffect(() => {
    const el = box.current;
    if (!el || !n) return undefined;
    let raf = 0; let last = 0; let pos = el.scrollLeft; let pausedUntil = 0; let hover = false;
    const pause = ms => { pausedUntil = Math.max(pausedUntil, performance.now() + ms); };
    holdRef.current = pause;
    const half = () => { const c = el.firstElementChild; return c && c.children[n] ? c.children[n].offsetLeft - c.children[0].offsetLeft : 0; };
    const tick = t => {
      const dt = Math.min(64, t - (last || t)); last = t;
      const h = half();
      if (h > 0) {
        if (hover || t < pausedUntil) pos = el.scrollLeft;
        else { pos += SPEED * dt / 1000; el.scrollLeft = pos; }
        // endless loop: the list is shown twice, so jump back by one list length
        if (el.scrollLeft >= h) { el.scrollLeft -= h; pos = el.scrollLeft; }
        else if (el.scrollLeft <= 0 && pos < 0) { el.scrollLeft += h; pos = el.scrollLeft; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const touch = () => pause(2500);
    const enter = e => { if (e.pointerType === 'mouse') hover = true; };
    const leave = e => { if (e.pointerType === 'mouse') { hover = false; pause(800); } };
    el.addEventListener('touchstart', touch, { passive: true });
    el.addEventListener('touchmove', touch, { passive: true });
    el.addEventListener('wheel', touch, { passive: true });
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('touchstart', touch); el.removeEventListener('touchmove', touch); el.removeEventListener('wheel', touch);
      el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave);
    };
  }, [n]);

  const step = dir => {
    const el = box.current;
    if (!el) return;
    holdRef.current(1600); // let the smooth scroll finish before auto-scroll carries on
    const card = el.querySelector('.chip');
    const w = (card?.offsetWidth || 86) + 12;
    const h = el.firstElementChild.children[n]?.offsetLeft - el.firstElementChild.children[0].offsetLeft || 0;
    if (dir < 0 && el.scrollLeft < w * 2 && h) el.scrollLeft += h; // keep room to go back
    el.scrollBy({ left: dir * w * 2, behavior: 'smooth' });
  };

  return (
    <div className="chips-wrap">
      <button type="button" className="top-arrow l" onClick={() => step(-1)} aria-label="Previous categories"><Icon name="arrow-left" size={18} stroke={2.6} /></button>
      <div className="top-marquee chips-marquee" ref={box}>
        <div className="top-track chips-track" role="list">
          {[0, 1].map(k => sections.map(s => (
            <button key={k + s.cat} role="listitem" className={`chip${s.cat === current ? ' on' : ''}`} tabIndex={k ? -1 : 0} aria-hidden={k ? 'true' : undefined} onClick={() => go(s.cat)}>
              <span className="chip-img"><Thumb item={s.items[0]} /></span><b>{s.cat}</b>
            </button>
          )))}
        </div>
      </div>
      <button type="button" className="top-arrow r" onClick={() => step(1)} aria-label="Next categories"><Icon name="arrow-right" size={18} stroke={2.6} /></button>
    </div>
  );
}
