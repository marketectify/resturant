import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import { useStore } from '../store.jsx';
import { rs, BIZ } from '../config.js';

// Big detail card for one menu item: photo, price, description, deal, "goes well with" and add-to-cart.
export default function ProductModal() {
  const { detail: item, setDetail, menu, add, lines, setDrawerOpen } = useStore();
  const [qty, setQty] = useState(1);
  const closeRef = useRef(null);
  const close = () => setDetail(null);

  useEffect(() => {
    if (!item) return undefined;
    setQty(1);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = e => e.key === 'Escape' && setDetail(null);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [item, setDetail]);

  // Suggestions use normal menu prices: one side and one drink, never the item itself.
  const pairs = useMemo(() => {
    if (!item || !menu) return [];
    const pick = cat => menu.filter(m => m.cat === cat && m._id !== item._id).slice(0, 3);
    return [...pick('Sides'), ...pick('Drinks')];
  }, [item, menu]);

  if (!item) return null;
  const inCart = id => lines.find(l => l.id === id)?.qty || 0;
  const deal = item.deal || (/\bdeal\b/i.test(item.name) ? item.desc : '');
  const addToCart = () => { add(item, qty); close(); };

  return (
    <div className="pm-overlay" onClick={close}>
      <div className="pm" role="dialog" aria-modal="true" aria-label={item.name} onClick={e => e.stopPropagation()}>
        <button className="pm-close" ref={closeRef} onClick={close} aria-label="Close"><Icon name="close" size={18} stroke={2.6} /></button>

        <div className="pm-img">
          <Thumb key={item._id} item={item} />
          {item.badge && <span className="pm-badge">{item.badge}</span>}
        </div>

        <div className="pm-body">
          <span className="pm-cat">{item.cat}</span>
          <h2>{item.name}</h2>
          <b className="pm-price">{rs(item.price)}</b>
          {item.desc && <p className="pm-desc">{item.desc}</p>}
          {item.details && <p className="pm-details">{item.details}</p>}
          {deal && <div className="pm-deal"><span aria-hidden="true">🏷️</span><div><b>Deal</b><p>{deal}</p></div></div>}

          <ul className="pm-facts">
            <li>🚚 Delivery or pickup</li>
            <li>💵 Cash on delivery</li>
            <li>📞 {BIZ.phone}</li>
          </ul>

          {pairs.length > 0 && (
            <section className="pm-pair" aria-label="Goes well with">
              <h3>Goes well with</h3>
              <div className="pm-pair-row">
                {pairs.map(m => (
                  <div className="pm-mini" key={m._id}>
                    <Thumb item={m} className="pm-mini-img" />
                    <span>{m.name}</span>
                    <b>{rs(m.price)}</b>
                    <button onClick={() => add(m)} aria-label={`Add ${m.name}`}>
                      {inCart(m._id) ? inCart(m._id) : <Icon name="plus" size={14} stroke={3} />}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="pm-foot">
            <div className="qty pm-qty">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Less"><Icon name="minus" size={16} stroke={2.6} /></button>
              <span aria-live="polite">{qty}</span>
              <button onClick={() => setQty(q => Math.min(50, q + 1))} aria-label="More"><Icon name="plus" size={16} stroke={2.6} /></button>
            </div>
            <button className="btn-primary pm-add" onClick={addToCart}>Add to cart <span>{rs(item.price * qty)}</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
