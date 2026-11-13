import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import Heart from './Heart.jsx';
import { useStore } from '../store.jsx';
import { rs } from '../config.js';

const favIds = () => { try { return JSON.parse(localStorage.getItem('mf-fav') || '[]'); } catch { return []; } };
const hash = () => location.hash.replace(/^#/, '').split('?')[0] || '/';

const svg = (d, fill) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const HomeIc = svg(<path d="M3 11 12 3l9 8M5 9.5V21h14V9.5M10 21v-6h4v6" />);
const HeartIc = svg(<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />);
const OrdersIc = svg(<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />);

/** App-style bottom bar: two options, a round cart button in the middle, two options. */
export default function BottomNav() {
  const { count, setDrawerOpen, setSearchOpen, menu, setDetail, add } = useStore();
  const [route, setRoute] = useState(hash);
  const [favOpen, setFavOpen] = useState(false);
  const [ids, setIds] = useState([]);
  useEffect(() => {
    const on = () => setRoute(hash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    if (!favOpen) return undefined;
    const onKey = e => e.key === 'Escape' && setFavOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [favOpen]);

  if (route === '/checkout') return null;
  const openFav = () => { setIds(favIds()); setFavOpen(true); };
  const home = () => { if (route === '/') window.scrollTo({ top: 0, behavior: 'smooth' }); else location.hash = '#/'; };
  const favs = (menu || []).filter(m => ids.includes(m._id));

  return (
    <>
      <nav className="bnav" aria-label="Main navigation">
        <button className={route === '/' ? 'on' : ''} onClick={home}>{HomeIc}<span>Home</span></button>
        <button onClick={() => setSearchOpen(true)}><Icon name="search" size={24} /><span>Search</span></button>
        <button className="bnav-cart" onClick={() => setDrawerOpen(true)} aria-label={`Open cart, ${count} items`}>
          <Icon name="bag" size={28} />
          {count > 0 && <b key={count}>{count}</b>}
        </button>
        <button onClick={openFav}>{HeartIc}<span>Favourites</span></button>
        <a className={route === '/track' ? 'on' : ''} href="#/track">{OrdersIc}<span>Orders</span></a>
      </nav>

      {favOpen && (
        <div className="cats-overlay" onClick={() => setFavOpen(false)}>
          <div className="cats-sheet" role="dialog" aria-modal="true" aria-label="Favourites" onClick={e => e.stopPropagation()}>
            <div className="cats-head"><h3>Favourites</h3><button onClick={() => setFavOpen(false)} aria-label="Close"><Icon name="close" size={18} stroke={2.6} /></button></div>
            {favs.length === 0 ? (
              <p className="fav-empty">No favourites yet. Tap the heart on any dish to save it here.</p>
            ) : favs.map(m => (
              <div className="fav-row" key={m._id} onClick={() => { setFavOpen(false); setDetail(m); }}>
                <Thumb item={m} className="line-thumb" />
                <div><h4>{m.name}</h4><b>{rs(m.price)}</b></div>
                <button className="fav-add" onClick={e => { e.stopPropagation(); add(m); }} aria-label={`Add ${m.name}`}><Icon name="plus" size={16} stroke={2.8} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
