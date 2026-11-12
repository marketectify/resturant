import { useState } from 'react';
import Header from '../components/Header.jsx';
import Icon from '../components/Icon.jsx';
import Thumb from '../components/Thumb.jsx';
import { Summary } from '../components/CartDrawer.jsx';
import { useStore } from '../store.jsx';
import { api } from '../api.js';
import { AREAS, BIZ, rs } from '../config.js';

const okPhone = v => /^(0|92)3\d{9}$/.test(v.replace(/\D/g, '')); // same rule as the server: 03xx-xxxxxxx or +92 3xx xxxxxxx
const SAVED_KEY = 'mf-customer';
const REMEMBER = ['title', 'name', 'phone', 'altPhone', 'address', 'area', 'landmark', 'email'];
const EMPTY = { title: 'Mr.', name: '', phone: '', altPhone: '', address: '', area: AREAS[0], landmark: '', email: '', instructions: '' };

// Details are only kept in this browser (localStorage), and only if the customer leaves the box ticked.
function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null');
    if (!s || typeof s !== 'object') return EMPTY;
    const out = { ...EMPTY };
    for (const k of REMEMBER) if (typeof s[k] === 'string') out[k] = s[k];
    if (!AREAS.includes(out.area)) out.area = AREAS[0];
    return out;
  } catch { return EMPTY; }
}
function saveCustomer(f, remember) {
  try {
    if (!remember) return localStorage.removeItem(SAVED_KEY);
    localStorage.setItem(SAVED_KEY, JSON.stringify(Object.fromEntries(REMEMBER.map(k => [k, f[k]]))));
  } catch { /* storage unavailable: nothing to do */ }
}

function waLink(done) {
  const lines = done.items.map(i => `${i.qty} x ${i.name} - ${rs(i.price * i.qty)}`);
  const text = [
    `Assalam o Alaikum, I placed order ${done.orderNo} (${done.orderType === 'pickup' ? 'Pickup' : 'Delivery'}).`,
    ...lines,
    `Total: ${rs(done.total)}`,
    `Name: ${done.name}`,
    `Phone: ${done.phone}`,
    ...(done.orderType === 'pickup' ? [] : [`Address: ${done.address}`]),
  ].join('\n');
  return `https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent(text)}`;
}

function validate(f, pickup) {
  const e = {};
  if (!f.name.trim()) e.name = 'Please enter your full name';
  if (!okPhone(f.phone)) e.phone = 'Enter a valid mobile number (03xx-xxxxxxx)';
  if (f.altPhone.trim() && !okPhone(f.altPhone)) e.altPhone = 'Enter a valid mobile number (03xx-xxxxxxx)';
  if (!pickup && !f.address.trim()) e.address = 'Please enter your delivery address';
  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address';
  return e;
}

function Label({ children, required, htmlFor }) {
  return <label className="lab" htmlFor={htmlFor}><span>{children}</span>{required && <em className="req">*Required</em>}</label>;
}

function Done({ done }) {
  return (
    <div className="page single">
      <section className="panel done">
        <span className="done-ic"><Icon name="check" size={38} stroke={3} /></span>
        <h2>Order placed!</h2>
        <p className="done-no">Order no. <b>{done.orderNo}</b> <span className="ot-pill sm">{done.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</span></p>
        <ul className="done-items">
          {done.items.map(i => <li key={i.menuId}><span>{i.qty} × {i.name}</span><b>{rs(i.price * i.qty)}</b></li>)}
          {done.fee > 0 && <li><span>Delivery fee</span><b>{rs(done.fee)}</b></li>}
          <li className="done-total"><span>Total ({done.orderType === 'pickup' ? 'pay at pickup' : 'cash on delivery'})</span><b className="red">{rs(done.total)}</b></li>
        </ul>
        <p className="muted">We will call you on {done.phone} to confirm your order.</p>
        {done.demo && <p className="demo-note">Demo mode: this order is saved only in this browser (open the Admin page here to see it). It was not sent to a real kitchen.</p>}
        <div className="done-actions">
          <a className="btn-wa" href={waLink(done)} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={22} stroke={1.8} /> Send order on WhatsApp</a>
          <a className="btn-ghost" href={`#/track?no=${encodeURIComponent(done.orderNo)}&phone=${encodeURIComponent(done.phone)}`}>Track order</a>
          <a className="btn-primary slim" href="#/">Back to menu</a>
        </div>
      </section>
    </div>
  );
}

export default function Checkout() {
  const { lines, count, total, fee, orderType, setOrderType, clear } = useStore();
  const pickup = orderType === 'pickup';
  const [f, setF] = useState(loadSaved);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: undefined })); };

  const submit = async e => {
    e.preventDefault();
    const errs = validate(f, pickup);
    setErrors(errs);
    setError('');
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const r = await api('/api/orders', { method: 'POST', body: { ...f, orderType, payment: 'cod', items: lines.map(l => ({ id: l.id, qty: l.qty })) } });
      saveCustomer(f, remember);
      clear();
      setDone({ orderNo: r.orderNo, orderType: r.orderType, items: r.items, fee: r.deliveryFee, total: r.total, name: f.name.trim(), phone: f.phone.trim(), address: f.address.trim(), demo: !!r.demo });
    } catch (er) {
      setError(er.message);
    } finally { setBusy(false); }
  };

  const field = (k, props = {}) => ({ id: `f-${k}`, value: f[k], onChange: set(k), 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `e-${k}` : undefined, ...props });
  const err = k => errors[k] && <p className="err" id={`e-${k}`} role="alert">{errors[k]}</p>;

  return (
    <>
      <Header />
      {done ? <Done done={done} /> : count === 0 ? (
        <div className="page single">
          <section className="panel done">
            <span className="done-ic soft">🛒</span>
            <h2>Your cart is empty</h2>
            <p className="muted">Add some items from the menu to continue.</p>
            <a className="btn-primary slim" href="#/">Browse menu</a>
          </section>
        </div>
      ) : (
        <form className="page" onSubmit={submit} noValidate>
          <section className="panel">
            <h2>Checkout</h2>
            <div className="ordertype">
              <span className="ot-ic">{pickup ? '🛍️' : '🛵'}</span>
              <div className="ot-text">
                <p>This is a <strong className="ot-pill">{pickup ? 'Pickup Order' : 'Delivery Order'}</strong></p>
                <small>Just a last step, please enter your details:</small>
              </div>
              <div className="seg" role="radiogroup" aria-label="Order type">
                {[['delivery', 'Delivery'], ['pickup', 'Pickup']].map(([v, l]) => (
                  <button type="button" key={v} role="radio" aria-checked={orderType === v} className={orderType === v ? 'on' : ''} onClick={() => setOrderType(v)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="row-title">
              <div>
                <Label htmlFor="f-title">Title</Label>
                <select className="inp" {...field('title')}><option>Mr.</option><option>Ms.</option><option>Mrs.</option></select>
              </div>
              <div>
                <Label required htmlFor="f-name">Full Name</Label>
                <input className="inp" placeholder="Full Name" autoComplete="name" {...field('name')} />
                {err('name')}
              </div>
            </div>

            <div className="grid2">
              <div>
                <Label required htmlFor="f-phone">Mobile Number</Label>
                <input className="inp" type="tel" inputMode="tel" placeholder="03xx-xxxxxxx" autoComplete="tel" {...field('phone')} />
                {err('phone')}
              </div>
              <div>
                <Label htmlFor="f-altPhone">Alternate Mobile Number</Label>
                <input className="inp" type="tel" inputMode="tel" placeholder="03xx-xxxxxxx" {...field('altPhone')} />
                {err('altPhone')}
              </div>
            </div>

            {pickup ? (
              <div className="pickup-info">
                <b>Pick up from</b>
                <p>📍 {BIZ.address}</p>
                <p>🕒 {BIZ.hours}</p>
                <a href={BIZ.map} target="_blank" rel="noreferrer">Open in Google Maps</a>
              </div>
            ) : (
            <div className="addr">
              <Label required htmlFor="f-address">Delivery Address</Label>
              <div className="inp-group">
                <input placeholder="Enter your complete address" autoComplete="street-address" {...field('address')} />
                <select aria-label="Delivery area" value={f.area} onChange={set('area')}>{AREAS.map(a => <option key={a}>{a}</option>)}</select>
              </div>
              {err('address')}
            </div>
            )}

            <div className="grid2">
              {!pickup && (
                <div>
                  <Label htmlFor="f-landmark">Nearest Landmark</Label>
                  <input className="inp" placeholder="any famous place nearby" {...field('landmark')} />
                </div>
              )}
              <div>
                <Label htmlFor="f-email">Email Address</Label>
                <input className="inp" type="email" placeholder="Enter your email" autoComplete="email" {...field('email')} />
                {err('email')}
              </div>
            </div>

            <div className="mt">
              <Label htmlFor="f-instructions">Delivery Instructions</Label>
              <textarea className="inp ta" placeholder="e.g. ring the bell twice, no onions" maxLength={300} {...field('instructions')} />
            </div>

            <div className="mt">
              <span className="lab"><span>Payment Method</span></span>
              <div className="pay-opt" role="radiogroup" aria-label="Payment method">
                <span className="radio on" role="radio" aria-checked="true" />
                <span className="pay-ic">💵</span>
                <div>
                  <b>{pickup ? 'Cash at pickup' : 'Cash on Delivery'}</b>
                  <small>{pickup ? 'Pay when you collect your order.' : 'Pay the rider when your order arrives.'}</small>
                </div>
              </div>
            </div>

            <label className="remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              <span>Remember my details on this device for next time</span>
            </label>
          </section>

          <aside className="panel side">
            {lines.map(l => (
              <div className="sum-item" key={l.id}>
                <Thumb item={l} className="line-thumb" />
                <div>
                  <p><span className="q">{l.qty} x</span> <strong>{l.name}</strong></p>
                  <b className="red">{rs(l.price * l.qty)}</b>
                </div>
              </div>
            ))}
            <Summary className="boxed" />
            {error && <p className="err banner-err" role="alert">{error}</p>}
            <button className="btn-primary" type="submit" disabled={busy}>
              <Icon name="bag" size={22} /> {busy ? 'Placing order…' : 'Place Order'}
            </button>
            <a className="continue" href="#/"><Icon name="arrow-left" size={18} /> continue to add more items</a>
          </aside>
        </form>
      )}
    </>
  );
}
