import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const SPEED = 24; // px per second: slow, gentle

/**
 * Horizontal strip that scrolls by itself, slowly and endlessly. The customer can swipe it (phones) or use the arrows
 * (laptops); auto-scroll pauses while they interact, then carries on. `items` is a list of { key, node }.
 * When everything already fits on screen it is shown plainly, without scrolling or arrows.
 */
export default function AutoStrip({ items, className = '', trackClass = '' }) {
  const box = useRef(null);
  const hold = useRef(() => {});
  const [loop, setLoop] = useState(true);
  const n = items.length;

  // Only loop when one copy of the list is wider than the strip.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = () => {
      const t = el.firstElementChild;
      const first = t.children[0]; const last = t.children[n - 1];
      if (!first || !last) return;
      const one = last.offsetLeft + last.offsetWidth - first.offsetLeft;
      setLoop(one > el.clientWidth + 2);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [n]);

  useEffect(() => {
    const el = box.current;
    if (!el || !n || !loop) return undefined;
    let raf = 0; let last = 0; let pos = el.scrollLeft; let pausedUntil = 0; let hover = false;
    const pause = ms => { pausedUntil = Math.max(pausedUntil, performance.now() + ms); };
    hold.current = pause;
    const half = () => { const c = el.firstElementChild; return c && c.children[n] ? c.children[n].offsetLeft - c.children[0].offsetLeft : 0; };
    const tick = t => {
      const dt = Math.min(64, t - (last || t)); last = t;
      const h = half();
      if (h > 0) {
        if (hover || t < pausedUntil) pos = el.scrollLeft;
        else { pos += SPEED * dt / 1000; el.scrollLeft = pos; }
        if (el.scrollLeft >= h) { el.scrollLeft -= h; pos = el.scrollLeft; } // endless loop: the list is shown twice
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
  }, [n, loop]);

  const step = dir => {
    const el = box.current;
    if (!el) return;
    const t = el.firstElementChild;
    const w = (t.children[1] ? t.children[1].offsetLeft - t.children[0].offsetLeft : t.children[0].offsetWidth + 12);
    const h = t.children[n] ? t.children[n].offsetLeft - t.children[0].offsetLeft : 0;
    hold.current(1600); // let the smooth scroll finish before auto-scroll carries on
    if (dir < 0 && el.scrollLeft < w * 2 && h) el.scrollLeft += h;
    el.scrollBy({ left: dir * w * 2, behavior: 'smooth' });
  };

  return (
    <div className={`chips-wrap as-wrap ${loop ? '' : 'as-solo'} ${className}`}>
      <button type="button" className="top-arrow l" onClick={() => step(-1)} aria-label="Previous"><Icon name="arrow-left" size={18} stroke={2.6} /></button>
      <div className="top-marquee as-scroll" ref={box}>
        <div className={`top-track ${trackClass}`}>
          {[0, 1].map(k => items.map(it => (
            <div key={k + it.key} className={`as-item${k ? ' as-dup' : ''}`} {...(k ? { 'aria-hidden': 'true', inert: '' } : {})}>{it.node}</div>
          )))}
        </div>
      </div>
      <button type="button" className="top-arrow r" onClick={() => step(1)} aria-label="Next"><Icon name="arrow-right" size={18} stroke={2.6} /></button>
    </div>
  );
}
