import { useMemo, useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import Icon from '../components/Icon.jsx';
import ItemCard from '../components/ItemCard.jsx';
import Footer from '../components/Footer.jsx';
import { CartFab, MenuFloaters } from '../components/Floaters.jsx';
import { useStore } from '../store.jsx';

const DEFAULT_CAT = 'Biryani';

export default function MenuPage() {
  const { menu } = useStore();
  const cats = useMemo(() => [...new Set((menu || []).map(m => m.cat))], [menu]);
  const [picked, setPicked] = useState(DEFAULT_CAT);
  const active = cats.includes(picked) ? picked : cats[0];
  const items = useMemo(() => (menu || []).filter(m => m.cat === active), [menu, active]);
  const art = useMemo(() => [...new Set(items.map(m => m.emoji).filter(Boolean))].slice(0, 3), [items]);

  const pills = useRef(null);
  const banner = useRef(null);

  const choose = (c, e) => {
    setPicked(c);
    e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    const top = banner.current?.getBoundingClientRect().top ?? 100;
    if (top < 100) window.scrollBy({ top: top - 100, behavior: 'smooth' });
  };

  return (
    <>
      <Header />
      <nav className="pillbar" aria-label="Menu categories">
        <div className="pills" ref={pills} role="tablist">
          {menu === null
            ? Array.from({ length: 8 }, (_, i) => <span key={i} className="pill skel-pill" />)
            : cats.map(c => (
              <button key={c} role="tab" aria-selected={c === active} className={`pill${c === active ? ' on' : ''}`} onClick={e => choose(c, e)}>{c}</button>
            ))}
        </div>
        <button className="pill-next" onClick={() => pills.current?.scrollBy({ left: 420, behavior: 'smooth' })} aria-label="Scroll categories">
          <Icon name="chevron-right" size={24} />
        </button>
      </nav>
      <CartFab />

      <main>
        <section className="cat-banner" ref={banner}>
          <h1>{active || ' '}</h1>
          <div className="banner-art" aria-hidden="true">
            {art.map((e, i) => <span key={e} className={i === 0 ? 'big' : ''}>{e}</span>)}
          </div>
        </section>

        <section className="menu-grid" aria-live="polite">
          {menu === null
            ? Array.from({ length: 6 }, (_, i) => <div key={i} className="card skel" />)
            : items.map(m => <ItemCard key={m._id} item={m} />)}
        </section>
      </main>

      <Footer />
      <MenuFloaters />
    </>
  );
}
