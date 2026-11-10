import { useState } from 'react';
import Header from '../components/Header.jsx';
import Icon from '../components/Icon.jsx';
import Thumb from '../components/Thumb.jsx';
import { Summary } from '../components/CartDrawer.jsx';
import { useStore } from '../store.jsx';
import { api } from '../api.js';
import { AREAS, rs } from '../config.js';

const okPhone = v => /^(0|92)3\d{9}$/.test(v.replace(/\D/g, '')); // same rule as the server: 03xx-xxxxxxx or +92 3xx xxxxxxx
const EMPTY = { title: 'Mr.', name: '', phone: '', altPhone: '', address: '', area: AREAS[0], landmark: '', email: '', instructions: '' };

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Please enter your full name';
  if (!okPhone(f.phone)) e.phone = 'Enter a valid mobile number (03xx-xxxxxxx)';
  if (f.altPhone.trim() && !okPhone(f.altPhone)) e.altPhone = 'Enter a valid mobile number (03xx-xxxxxxx)';
  if (!f.address.trim()) e.address = 'Please enter your delivery address';
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
        <p className="done-no">Order no. <b>{done.orderNo}</b></p>
        <p>Order total: <b className="red">{rs(done.total)}</b></p>
        <p className="muted">We will call you on {done.phone} to confirm your order.</p>
        {done.demo && <p className="demo-note">Demo mode: the server is not connected, so this order was not actually sent.</p>}
        <a className="btn-primary slim" href="#/">Back to menu</a>
      </section>
    </div>
  );
}

export default function Checkout() {
  const { lines, count, total, clear } = useStore();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: undefined })); };

  const submit = async e => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    setError('');
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const r = await api('/api/orders', { method: 'POST', body: { ...f, items: lines.map(l => ({ id: l.id, qty: l.qty })) } });
      clear();
      setDone({ orderNo: r.orderNo, total: r.total, phone: f.phone.trim() });
    } catch (er) {
      if (er.offline) { // API not reachable (static demo hosting): finish the flow in demo mode
        clear();
        setDone({ orderNo: 'DEMO-' + Date.now().toString(36).toUpperCase().slice(-4), total, phone: f.phone.trim(), demo: true });
      } else setError(er.message);
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
              <span className="ot-ic">🛵</span>
              <div>
                <p>This is a <strong className="ot-pill">Delivery Order</strong></p>
                <small>Just a last step, please enter your details:</small>
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

            <div className="addr">
              <Label required htmlFor="f-address">Delivery Address</Label>
              <div className="inp-group">
                <input placeholder="Enter your complete address" autoComplete="street-address" {...field('address')} />
                <select aria-label="Delivery area" value={f.area} onChange={set('area')}>{AREAS.map(a => <option key={a}>{a}</option>)}</select>
              </div>
              {err('address')}
            </div>

            <div className="grid2">
              <div>
                <Label htmlFor="f-landmark">Nearest Landmark</Label>
                <input className="inp" placeholder="any famous place nearby" {...field('landmark')} />
              </div>
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
