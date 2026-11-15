import { useEffect } from 'react';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import { useStore } from '../store.jsx';
import { BIZ, rs } from '../config.js';

const svg = d => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const I = {
  home: svg(<path d="M3 11 12 3l9 8M5 9.5V21h14V9.5M10 21v-6h4v6" />),
  menu: svg(<path d="M4 5h16M4 12h16M4 19h10" />),
  heart: svg(<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />),
  orders: svg(<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />),
  user: svg(<path d="M20 21v-1a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />),
  table: svg(<path d="M5 4h14v4H5zM7 8v12M17 8v12M5 14h14" />),
};

/** Laptop layout only (hidden by CSS on phones and tablets): left navigation panel + right panel with offer and live cart. */
export function useDashLite() {
  useEffect(() => {
    const h = document.documentElement;
    h.classList.add('is-dash', 'is-dash-lite');
    return () => h.classList.remove('is-dash', 'is-dash-lite');
  }, []);
}

export function DashSide({ onMenu, active = 'home' }) {
  const link = (cls, icon, label, props) => <a className={cls} {...props}>{icon}<span>{label}</span></a>;
  return (
    <aside className="dash-side dash-only" aria-label="Navigation">
      <a className="ds-logo" href="#/" onClick={e => { if (active === 'home') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>
        <b>master</b><i>FOODS</i>
      </a>
      <nav>
        {active === 'home'
          ? <button className="on" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{I.home}<span>Home</span></button>
          : link('', I.home, 'Home', { href: '#/' })}
        {onMenu ? <button onClick={onMenu}>{I.menu}<span>Menu</span></button> : link('', I.menu, 'Menu', { href: '#/' })}
        {active === 'home'
          ? <button onClick={() => window.dispatchEvent(new Event('open-favs'))}>{I.heart}<span>Favourites</span></button>
          : link('', I.heart, 'Favourites', { href: '#/' })}
        {link(active === 'track' ? 'on' : '', I.orders, 'Track order', { href: '#/track' })}
        {link(active === 'book' ? 'on' : '', I.table, 'Book a table', { href: '#/book' })}
        {link(active === 'account' ? 'on' : '', I.user, 'My account', { href: '#/account' })}
      </nav>
      <div className="ds-promo">
        <b>Faster delivery!</b>
        <p>Call us and we will take your order straight away.</p>
        <a href={`tel:${BIZ.phoneTel}`}>{BIZ.phone} <Icon name="arrow-right" size={14} stroke={2.6} /></a>
      </div>
    </aside>
  );
}

export function DashRight({ menu }) {
  const { lines, count, subtotal, fee, total, inc, dec, remove, orderType } = useStore();
  const hero = menu?.find(m => m.cat === 'Biryani') || menu?.[0];
  const wa = `https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent('Assalam o Alaikum, I would like to place an order.')}`;
  return (
    <aside className="dash-right dash-only" aria-label="Offer and cart">
      <div className="dr-promo">
        <div className="dr-promo-text">
          <small>Fresh every day</small>
          <h3>Biryani, karahi &amp; BBQ at your door</h3>
          <a href={wa} target="_blank" rel="noreferrer">Order on WhatsApp</a>
        </div>
        {hero && <span className="dr-promo-img"><Thumb item={hero} /></span>}
      </div>

      <div className="dr-cart">
        <div className="dr-cart-head"><h3>Your cart</h3>{count > 0 && <span>{count} item{count > 1 ? 's' : ''}</span>}</div>
        {count === 0 ? (
          <p className="dr-empty">Nothing here yet. Tap + on any dish to add it.</p>
        ) : (
          <>
            <div className="dr-lines">
              {lines.map(l => (
                <div className="dr-line" key={l.id}>
                  <span className="dr-line-img"><Thumb item={l} /></span>
                  <div><h4>{l.name}</h4><b>{rs(l.price * l.qty)}</b></div>
                  <div className="dr-qty">
                    <button onClick={() => (l.qty > 1 ? dec(l.id) : remove(l.id))} aria-label={`Remove one ${l.name}`}><Icon name={l.qty > 1 ? 'minus' : 'trash'} size={13} stroke={2.6} /></button>
                    <span>{l.qty}</span>
                    <button className="dark" onClick={() => inc(l.id)} aria-label={`Add one more ${l.name}`}><Icon name="plus" size={13} stroke={2.8} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="dr-sum">
              <div><span>Subtotal</span><b>{rs(subtotal)}</b></div>
              <div><span>{orderType === 'pickup' ? 'Pickup' : 'Delivery'}</span><b>{fee ? rs(fee) : 'Free'}</b></div>
              <div className="dr-total"><span>Total</span><b>{rs(total)}</b></div>
            </div>
            <button className="dr-checkout" onClick={() => { location.hash = '#/checkout'; }}>Checkout</button>
          </>
        )}
      </div>
    </aside>
  );
}

export function DashHead({ sections, current, onGo, onAll }) {
  const { count, setDrawerOpen, setSearchOpen } = useStore();
  return (
    <div className="dash-head dash-only">
      <div className="dh-top">
        <div>
          <h1>Welcome to<br />{BIZ.short}</h1>
          <p>{BIZ.tag}</p>
        </div>
        <div className="dh-actions">
          <button className="dh-search" onClick={() => setSearchOpen(true)}><Icon name="search" size={20} /><span>Search the menu</span></button>
          <button className="dh-cart" onClick={() => setDrawerOpen(true)} aria-label={`Open cart, ${count} items`}>
            <Icon name="bag" size={22} />{count > 0 && <b>{count}</b>}
          </button>
        </div>
      </div>
    </div>
  );
}
