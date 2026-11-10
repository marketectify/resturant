import { useEffect, useMemo, useRef } from 'react';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import { useStore } from '../store.jsx';
import { rs } from '../config.js';

function Popular() {
  const { menu, lines, add } = useStore();
  const scroller = useRef(null);
  const picks = useMemo(() => {
    const inCart = new Set(lines.map(l => l.id));
    const sides = (menu || []).filter(m => m.cat === 'Sides' && !inCart.has(m._id));
    return (sides.length ? sides : (menu || []).filter(m => !inCart.has(m._id))).slice(0, 10);
  }, [menu, lines]);
  if (!picks.length) return null;
  const scroll = dir => scroller.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  return (
    <section className="popular">
      <div className="popular-head">
        <span className="bar" />
        <Icon name="flame" size={22} />
        <h3>Popular with your order</h3>
        <button className="round soft" onClick={() => scroll(-1)} aria-label="Previous"><Icon name="chevron-left" size={22} /></button>
        <button className="round" onClick={() => scroll(1)} aria-label="Next"><Icon name="chevron-right" size={22} /></button>
      </div>
      <div className="popular-row" ref={scroller}>
        {picks.map(m => (
          <div className="mini" key={m._id}>
            <div className="mini-img">
              <Thumb item={m} />
              <button className="add sm" onClick={() => add(m)} aria-label={`Add ${m.name}`}><Icon name="plus" size={16} stroke={3} /></button>
            </div>
            <b>{rs(m.price)}</b>
            <span>{m.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Summary({ className = '' }) {
  const { subtotal, deliveryFee, total, count } = useStore();
  const fee = count ? deliveryFee : 0;
  return (
    <div className={`summary ${className}`}>
      <div className="sum-row"><Icon name="calculator" size={22} /><span>Total</span><b>{rs(subtotal)}</b></div>
      <div className="sum-row"><Icon name="truck" size={22} /><span>Delivery Fee</span><b>{rs(fee)}</b></div>
      <div className="sum-grand"><span>Grand Total</span><b>{rs(total)}</b></div>
    </div>
  );
}

export default function CartDrawer() {
  const { drawerOpen, setDrawerOpen, lines, count, inc, dec, remove } = useStore();
  const closeRef = useRef(null);
  const close = () => setDrawerOpen(false);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = e => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [drawerOpen, setDrawerOpen]);

  return (
    <div className={`overlay${drawerOpen ? ' open' : ''}`} onClick={close} aria-hidden={!drawerOpen}>
      <aside className={`drawer${drawerOpen ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Your cart" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <Icon name="bag" size={24} />
          <h2>Your Cart</h2>
          <button className="close" ref={closeRef} onClick={close} aria-label="Close cart"><Icon name="close" size={20} stroke={2.6} /></button>
        </div>

        <div className="drawer-body">
          {count === 0 ? (
            <div className="empty">
              <span>🛒</span>
              <h3>Your cart is empty</h3>
              <p>Add something delicious from the menu.</p>
              <button className="btn-primary slim" onClick={close}>Browse menu</button>
            </div>
          ) : (
            <>
              {lines.map(l => (
                <div className="line" key={l.id}>
                  <Thumb item={l} className="line-thumb" />
                  <div className="line-info">
                    <h4>{l.name}</h4>
                    <b>{rs(l.price * l.qty)}</b>
                  </div>
                  <div className="qty">
                    <button onClick={() => (l.qty > 1 ? dec(l.id) : remove(l.id))} aria-label={l.qty > 1 ? `Remove one ${l.name}` : `Remove ${l.name}`}>
                      <Icon name={l.qty > 1 ? 'minus' : 'trash'} size={19} stroke={l.qty > 1 ? 2.6 : 2} />
                    </button>
                    <span aria-live="polite">{l.qty}</span>
                    <button onClick={() => inc(l.id)} aria-label={`Add one more ${l.name}`}><Icon name="plus" size={20} stroke={2.6} /></button>
                  </div>
                </div>
              ))}
              <button className="add-more" onClick={close}><Icon name="plus" size={18} stroke={2.6} /> Add more items</button>
              <Popular />
              <Summary />
            </>
          )}
        </div>

        {count > 0 && (
          <div className="drawer-foot">
            <a className="btn-primary" href="#/checkout" onClick={close}>Checkout <Icon name="arrow-right" size={22} /></a>
          </div>
        )}
      </aside>
    </div>
  );
}
