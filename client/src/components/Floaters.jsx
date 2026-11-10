import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../store.jsx';
import { BIZ, rs } from '../config.js';

export function WhatsAppFab() {
  const href = `https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent('Assalam o Alaikum, I would like to place an order.')}`;
  return <a className="fab wa-fab" href={href} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><Icon name="whatsapp" size={40} stroke={1.8} /></a>;
}

export function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <button className={`fab top-fab${show ? ' show' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" tabIndex={show ? 0 : -1}>
      <Icon name="up" size={28} stroke={2.6} />
    </button>
  );
}

/** Cart button. Rendered inside `.fab-rail` (just under the category bar) on the menu page. */
export function CartFab() {
  const { count, setDrawerOpen } = useStore();
  return (
    <div className="fab-rail">
      <button className="fab cart-fab" onClick={() => setDrawerOpen(true)} aria-label={`Open cart, ${count} items`}>
        <Icon name="bag" size={32} />
        {count > 0 && <span className="cart-count" key={count}>{count}</span>}
      </button>
    </div>
  );
}

/** Search button and the "View Cart" bar shown on the menu page. */
export function MenuFloaters() {
  const { count, total, drawerOpen, setDrawerOpen, setSearchOpen } = useStore();
  return (
    <>
      <button className="fab search-fab" onClick={() => setSearchOpen(true)} aria-label="Search the menu"><Icon name="search" size={28} /></button>
      {count > 0 && !drawerOpen && (
        <button className="viewcart" onClick={() => setDrawerOpen(true)}>
          <span className="vc-count">{count}</span>
          <span className="vc-label">View Cart</span>
          <span className="vc-total">{rs(total)}</span>
          <Icon name="arrow-right" size={24} />
        </button>
      )}
    </>
  );
}
