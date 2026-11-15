import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import AutoStrip from './AutoStrip.jsx';
import Heart from './Heart.jsx';
import { useStore } from '../store.jsx';
import { rs, BIZ } from '../config.js';

// Big detail card for one menu item: photo, price, description, deal, "goes well with" and add-to-cart.
export default function ProductModal() {
  const { detail: item, setDetail, menu, add, lines, setDrawerOpen } = useStore();
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false); // full-size photo viewer
  const closeRef = useRef(null);
  const zoomRef = useRef(false);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  const close = () => setDetail(null);

  useEffect(() => {
    if (!item) return undefined;
    setQty(1); setZoom(false);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') { if (zoomRef.current) { zoomRef.current = false; setZoom(false); } else setDetail(null); } };
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

  const order = () => { add(item, qty); close(); location.hash = '#/checkout'; };

  return (
    <div className="pm-overlay" onClick={close}>
      <div className="pm" role="dialog" aria-modal="true" aria-label={item.name} onClick={e => e.stopPropagation()}>
        <div className="pm-top">
          <button className="pm-round" ref={closeRef} onClick={close} aria-label="Back"><Icon name="arrow-left" size={20} stroke={2.4} /></button>
          <Heart id={item._id} className="pm-round" />
        </div>

        <div className="pm-scroll">
          <div className="pm-hero">
            <div className="pm-deco" aria-hidden="true"><i className="r1" /><i className="r2" /><i className="r3" /><b className="d1" /><b className="d2" /><b className="d3" /><b className="d4" /></div>
            <button type="button" className="pm-plate" onClick={() => setZoom(true)} aria-label="View full photo">
              <Thumb key={item._id} item={item} />
              <span className="pm-zoom"><Icon name="expand" size={16} stroke={2.4} /></span>
            </button>
            {item.badge && <span className="pm-badge">{item.badge}</span>}
          </div>

          <div className="pm-sheet">
            <div className="pm-titlerow">
              <h2>{item.name}</h2>
              <b className="pm-price">{rs(item.price)}</b>
            </div>
            <span className="pm-cat">{item.cat}</span>

            <ul className="pm-facts">
              <li><Icon name="truck" size={22} /><span>Delivery or pickup</span></li>
              <li><Icon name="cash" size={22} /><span>Cash on delivery</span></li>
              <li><Icon name="phone" size={22} /><span>{BIZ.phone}</span></li>
            </ul>

            <div className="pm-qtyrow">
              <span>Quantity</span>
              <div className="pm-step">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Less"><Icon name="minus" size={16} stroke={2.6} /></button>
                <span aria-live="polite">{qty}</span>
                <button className="dark" onClick={() => setQty(q => Math.min(50, q + 1))} aria-label="More"><Icon name="plus" size={16} stroke={2.6} /></button>
              </div>
            </div>

            {(item.desc || item.details) && (
              <section>
                <h3>Description</h3>
                {item.desc && <p className="pm-desc">{item.desc}</p>}
                {item.details && <p className="pm-desc">{item.details}</p>}
              </section>
            )}
            {deal && <div className="pm-deal"><span aria-hidden="true"><Icon name="tag" size={20} /></span><div><b>Deal</b><p>{deal}</p></div></div>}

            {pairs.length > 0 && (
              <section aria-label="Often order with">
                <h3>Often order with</h3>
                <AutoStrip className="pm-strip" trackClass="pm-track" items={pairs.map(m => ({
                  key: m._id,
                  node: (
                    <div className="pm-mini">
                      <div className="pm-mini-img"><Thumb item={m} /></div>
                      <span>{m.name}</span>
                      <b>{rs(m.price)}</b>
                      <button onClick={() => add(m)} aria-label={`Add ${m.name}`}>
                        {inCart(m._id) ? inCart(m._id) : <Icon name="plus" size={14} stroke={3} />}
                      </button>
                    </div>
                  ),
                }))} />
              </section>
            )}
          </div>
        </div>

        <div className="pm-foot">
          <button className="pm-btn light" onClick={addToCart}>Add to Cart</button>
          <button className="pm-btn dark" onClick={order}>Order · {rs(item.price * qty)}</button>
        </div>
      </div>
      {zoom && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="Photo" onClick={e => { e.stopPropagation(); setZoom(false); }}>
          <button type="button" className="lb-x" aria-label="Close photo" onClick={e => { e.stopPropagation(); setZoom(false); }}><Icon name="close" size={22} stroke={2.4} /></button>
          <Thumb key={'z' + item._id} item={item} className="lb-img" />
          <p className="lb-cap">{item.name}</p>
        </div>
      )}
    </div>
  );
}
