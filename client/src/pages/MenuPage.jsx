import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import Icon from '../components/Icon.jsx';
import ItemCard from '../components/ItemCard.jsx';
import Footer from '../components/Footer.jsx';
import { MenuFloaters } from '../components/Floaters.jsx';
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
  const [catsOpen, setCatsOpen] = useState(false);
  const msearch = useRef(null);
  const { setSearchOpen } = useStore();
  const lock = useRef(0); // while a click-scroll is running the scroll listener must not change the tab
  const current = active && cats.includes(active) ? active : cats[0];

  // Scroll-spy: the tab follows whichever section is under the category bar.
  useEffect(() => {
    if (!cats.length) return undefined;
    const spy = () => {
      if (Date.now() < lock.current) return;
      const line = (document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 70) + 24; // below the fixed header
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

  // Phone: the search bar sits under the header and scrolls away; once it is out of sight a round
  // search button appears bottom-left (like the WhatsApp one on the right).
  useEffect(() => {
    const el = msearch.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const top = document.querySelector('.topbar')?.offsetHeight || 0;
    const io = new IntersectionObserver(([e]) => document.documentElement.classList.toggle('m-search-out', !e.isIntersecting), { rootMargin: `-${top}px 0px 0px 0px` });
    io.observe(el);
    return () => { io.disconnect(); document.documentElement.classList.remove('m-search-out'); };
  }, [menu]);

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

  const go = useCallback(c => {
    setCatsOpen(false);
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

  // Clicking the logo in the top bar opens the all-categories sheet.
  useEffect(() => {
    const open = () => setCatsOpen(true);
    window.addEventListener('open-cats', open);
    return () => window.removeEventListener('open-cats', open);
  }, []);
  useEffect(() => {
    if (!catsOpen) return undefined;
    const onKey = e => e.key === 'Escape' && setCatsOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [catsOpen]);

  return (
    <>
      <Header />
      <button className="m-search" ref={msearch} onClick={() => setSearchOpen(true)} aria-label="Search the menu">
        <Icon name="search" size={20} /> <span>Search biryani, burger, karahi…</span>
      </button>

      {menu !== null && (
        <section className="top-cats" aria-label="Top categories">
          <h2>Top categories</h2>
          <div className="top-cats-grid">
            {sections.slice(0, 4).map(s => (
              <button key={s.cat} className="top-cat" onClick={() => go(s.cat)}>
                <span className="top-cat-emoji" aria-hidden="true">{s.art[0]}</span>
                <b>{s.cat}</b>
                <small>{s.items.length} items</small>
              </button>
            ))}
          </div>
        </section>
      )}

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

      {catsOpen && (
        <div className="cats-overlay" onClick={() => setCatsOpen(false)}>
          <div className="cats-sheet" role="dialog" aria-modal="true" aria-label="All categories" onClick={e => e.stopPropagation()}>
            <div className="cats-head"><h3>All categories</h3><button onClick={() => setCatsOpen(false)} aria-label="Close"><Icon name="close" size={18} stroke={2.6} /></button></div>
            <div className="cats-grid">
              {sections.map(s => (
                <button key={s.cat} className={`top-cat${s.cat === current ? ' on' : ''}`} onClick={() => go(s.cat)}>
                  <span className="top-cat-emoji" aria-hidden="true">{s.art[0]}</span>
                  <b>{s.cat}</b>
                  <small>{s.items.length} items</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
      <MenuFloaters />
    </>
  );
}
