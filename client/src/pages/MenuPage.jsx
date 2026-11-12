import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import Icon from '../components/Icon.jsx';
import ItemCard from '../components/ItemCard.jsx';
import Footer from '../components/Footer.jsx';
import { CartFab, MenuFloaters } from '../components/Floaters.jsx';
import { useStore } from '../store.jsx';

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function MenuPage() {
  const { menu } = useStore();
  const cats = useMemo(() => [...new Set((menu || []).map(m => m.cat))], [menu]);
  const sections = useMemo(() => cats.map(c => {
    const items = menu.filter(m => m.cat === c);
    return { cat: c, items, art: [...new Set(items.map(m => m.emoji).filter(Boolean))].slice(0, 3) };
  }), [menu, cats]);

  const [active, setActive] = useState(null);
  const [glide, setGlide] = useState(null);
  const pills = useRef(null);
  const lock = useRef(0); // while a click-scroll is running the scroll listener must not change the tab
  const current = active && cats.includes(active) ? active : cats[0];

  // Scroll-spy: the tab follows whichever section is under the category bar.
  useEffect(() => {
    if (!cats.length) return undefined;
    const spy = () => {
      if (Date.now() < lock.current) return;
      const line = (document.querySelector('.pillbar')?.getBoundingClientRect().bottom ?? 130) + 24; // below the fixed header
      let now = cats[0];
      for (const c of cats) {
        const el = document.getElementById(`cat-${slug(c)}`);
        if (el && el.getBoundingClientRect().top <= line) now = c;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) now = cats[cats.length - 1];
      setActive(now);
    };
    spy();
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
    return () => { window.removeEventListener('scroll', spy); window.removeEventListener('resize', spy); };
  }, [cats]);

  // White highlight that slides under the active tab. Re-measured whenever any tab changes size
  // (web fonts finishing loading, window resize), so it can never drift away from its tab.
  useEffect(() => {
    const bar = pills.current;
    if (!bar) return undefined;
    const place = () => {
      const on = bar.querySelector('.pill.on');
      if (!on) return;
      const g = { left: on.offsetLeft, top: on.offsetTop, width: on.offsetWidth, height: on.offsetHeight };
      setGlide(o => (o && o.left === g.left && o.top === g.top && o.width === g.width && o.height === g.height ? o : g));
    };
    place();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
    ro?.observe(bar);
    bar.querySelectorAll('.pill').forEach(el => ro?.observe(el));
    document.fonts?.ready?.then(place);
    window.addEventListener('resize', place);
    return () => { ro?.disconnect(); window.removeEventListener('resize', place); };
  }, [current, cats]);

  // Cards fade up as they scroll into view.
  useEffect(() => {
    if (!menu || !('IntersectionObserver' in window)) return undefined;
    const root = document.documentElement;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('.menu-sec .card').forEach(el => io.observe(el));
    root.classList.add('reveal');
    return () => { io.disconnect(); root.classList.remove('reveal'); };
  }, [menu]);

  // Keep the active tab visible inside the horizontally scrolling bar (without moving the page).
  useEffect(() => {
    const bar = pills.current;
    const on = bar?.querySelector('.pill.on');
    if (!bar || !on) return;
    bar.scrollTo({ left: on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' });
  }, [current]);

  const go = useCallback(c => {
    setActive(c);
    lock.current = Date.now() + 3000; // safety net; normally released as soon as the scrolling stops
    document.getElementById(`cat-${slug(c)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // While a click-scroll is running the spy stays quiet (so the highlight does not hop through every
  // category on the way); 150 ms after the last scroll event the lock is released.
  useEffect(() => {
    let t;
    const onScroll = () => {
      if (Date.now() >= lock.current) return;
      clearTimeout(t);
      t = setTimeout(() => { lock.current = 0; window.dispatchEvent(new Event('scroll')); }, 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t); };
  }, []);

  return (
    <>
      <Header />
      <nav className="pillbar" aria-label="Menu categories">
        <div className="pills" ref={pills} role="tablist">
          {glide && <span className={`pill-glide ready`} style={glide} aria-hidden="true" />}
          {menu === null
            ? Array.from({ length: 8 }, (_, i) => <span key={i} className="pill skel-pill" />)
            : cats.map(c => (
              <button key={c} role="tab" aria-selected={c === current} className={`pill${c === current ? ' on' : ''}`} onClick={() => go(c)}>{c}</button>
            ))}
        </div>
        <button className="pill-next" onClick={() => pills.current?.scrollBy({ left: 420, behavior: 'smooth' })} aria-label="Scroll categories">
          <Icon name="chevron-right" size={24} />
        </button>
      </nav>
      <CartFab />

      <main>
        {menu === null ? (
          <section className="menu-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="card skel" />)}</section>
        ) : sections.map(s => (
          <section key={s.cat} id={`cat-${slug(s.cat)}`} className={`menu-sec${s.cat === current ? ' is-current' : ''}`} aria-labelledby={`h-${slug(s.cat)}`}>
            <div className="cat-banner">
              <h2 id={`h-${slug(s.cat)}`}>{s.cat}</h2>
              <div className="banner-art" aria-hidden="true">
                {s.art.map((e, i) => <span key={e} className={i === 0 ? 'big' : ''}>{e}</span>)}
              </div>
            </div>
            <div className="menu-grid">{s.items.map(m => <ItemCard key={m._id} item={m} />)}</div>
          </section>
        ))}
      </main>

      <Footer />
      <MenuFloaters />
    </>
  );
}
