import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import { useStore } from '../store.jsx';
import { rs } from '../config.js';

export function Summary({ className = '' }) {
  const { subtotal, fee, orderType, total } = useStore();
  return (
    <div className={`summary ${className}`}>
      <div className="sum-row"><Icon name="calculator" size={22} /><span>Total</span><b>{rs(subtotal)}</b></div>
      <div className="sum-row"><Icon name="truck" size={22} /><span>{orderType === 'pickup' ? 'Pickup (no delivery fee)' : 'Delivery Fee'}</span><b>{rs(fee)}</b></div>
      <div className="sum-grand"><span>Grand Total</span><b>{rs(total)}</b></div>
    </div>
  );
}

export default function CartDrawer() {
  const { drawerOpen, setDrawerOpen, lines, count, inc, dec, remove, subtotal, fee, orderType, total, clear } = useStore();
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
          <button className="cart-round" ref={closeRef} onClick={close} aria-label="Back"><Icon name="arrow-left" size={20} stroke={2.4} /></button>
          <h2>Cart</h2>
          {count > 0 ? <button className="cart-round" onClick={clear} aria-label="Empty the cart"><Icon name="trash" size={19} /></button> : <span className="cart-round ghost" />}
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
                    {l.desc && <p>{l.desc}</p>}
                    <b>{rs(l.price * l.qty)}</b>
                  </div>
                  <div className="qty">
                    <button className="soft" onClick={() => (l.qty > 1 ? dec(l.id) : remove(l.id))} aria-label={l.qty > 1 ? `Remove one ${l.name}` : `Remove ${l.name}`}>
                      <Icon name={l.qty > 1 ? 'minus' : 'trash'} size={15} stroke={l.qty > 1 ? 2.8 : 2} />
                    </button>
                    <span aria-live="polite">{l.qty}</span>
                    <button className="dark" onClick={() => inc(l.id)} aria-label={`Add one more ${l.name}`}><Icon name="plus" size={15} stroke={2.8} /></button>
                  </div>
                </div>
              ))}
              <button className="add-more" onClick={close}><Icon name="plus" size={16} stroke={2.6} /> Add more items</button>

              <div className="cart-sum">
                <h3>Order Summary</h3>
                <div><span>Subtotal for products</span><b>{rs(subtotal)}</b></div>
                <div><span>{orderType === 'pickup' ? 'Pickup (no delivery fee)' : 'Delivery shipping'}</span><b>{rs(fee)}</b></div>
                <div className="cart-total"><span>Total</span><b>{rs(total)}</b></div>
              </div>
            </>
          )}
        </div>

        {count > 0 && (
          <div className="drawer-foot">
            <a className="btn-primary" href="#/checkout" onClick={close}>Checkout</a>
          </div>
        )}
      </aside>
    </div>
  );
}
