import { useEffect, useRef, useState } from 'react';

/**
 * Slim one-line category bar (plain text). It appears once the big category chips have scrolled out of sight.
 * The category being viewed is highlighted and kept in the middle; the others sit on either side.
 */
export default function StickyCats({ cats, current, go }) {
  const [show, setShow] = useState(false);
  const [top, setTop] = useState(0);
  const box = useRef(null);

  useEffect(() => {
    const on = () => {
      const bar = document.querySelector('.topbar');
      const barBottom = bar && bar.offsetParent !== null ? Math.max(0, bar.getBoundingClientRect().bottom) : 0;
      const chips = document.querySelector('.cat-chips');
      setTop(barBottom);
      setShow(!!chips && chips.getBoundingClientRect().bottom < barBottom + 6);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);

  // keep the highlighted category in the middle
  useEffect(() => {
    const el = box.current;
    const b = el?.querySelector('.on');
    if (!el || !b) return;
    el.scrollTo({ left: b.offsetLeft - (el.clientWidth - b.offsetWidth) / 2, behavior: show ? 'smooth' : 'auto' });
  }, [current, show]);

  return (
    <nav className={`sticky-cats${show ? ' show' : ''}`} style={{ '--sc-top': `${top}px` }} aria-label="Categories" aria-hidden={!show}>
      <div className="sc-scroll" ref={box}>
        <span className="sc-pad" />
        {cats.map(c => (
          <button key={c} tabIndex={show ? 0 : -1} className={c === current ? 'on' : ''} onClick={() => go(c)}>{c}</button>
        ))}
        <span className="sc-pad" />
      </div>
    </nav>
  );
}
