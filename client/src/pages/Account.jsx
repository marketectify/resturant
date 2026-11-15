import { useCallback, useEffect, useState } from 'react';
import { DashSide, useDashLite } from '../components/DashChrome.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { api } from '../api.js';
import { rs } from '../config.js';
import { openAuth, setAuth, updateUser, useAuth } from '../auth.js';

const STATUS = { new: 'Received', preparing: 'Preparing', 'on-the-way': 'On the way', delivered: 'Delivered', cancelled: 'Cancelled', pending: 'Pending', confirmed: 'Confirmed' };
const when = d => (d ? new Date(d).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');

export default function Account() {
  useDashLite();
  const auth = useAuth();
  const user = auth?.user;
  const [orders, setOrders] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, o, b] = await Promise.all([api('/api/me'), api('/api/me/orders'), api('/api/me/bookings')]);
      updateUser(me); setOrders(o); setBookings(b);
    } catch (e) {
      if (e.status === 401) setAuth(null); else setErr(e.message);
      setOrders([]);
    }
  }, []);
  useEffect(() => { if (auth) load(); }, [!!auth]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (user && !f) setF({ name: user.name, phone: user.phone, email: user.email, address: user.address, area: user.area }); }, [user, f]);

  const save = async e => {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    try { updateUser(await api('/api/me', { method: 'PATCH', body: f })); setMsg('Saved'); } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const set = k => e => { setF({ ...f, [k]: e.target.value }); setMsg(''); };

  return (
    <>
      <DashSide active="account" />
      <Header />
      <div className="page single">
        {!auth ? (
          <section className="panel acc-guest">
            <h2>My account</h2>
            <p className="muted">Log in with your mobile number or e-mail to see your past orders, bookings and favourites, and to order faster.</p>
            <div className="acc-btns">
              <button className="pm-btn dark" onClick={() => openAuth('login')}>Log in</button>
              <button className="pm-btn light" onClick={() => openAuth('signup')}>Create account</button>
            </div>
          </section>
        ) : (
          <>
            <section className="panel">
              <div className="acc-head">
                <span className="acc-av" aria-hidden="true">{(user.name || '?').trim().charAt(0).toUpperCase()}</span>
                <div><h2>{user.name}</h2><p className="muted">{user.phone || user.email}</p></div>
                <button className="acc-out" onClick={() => setAuth(null)}>Log out</button>
              </div>
              {f && (
                <form className="acc-form" onSubmit={save}>
                  <label>Name<input className="wl-inp" value={f.name} onChange={set('name')} /></label>
                  <label>Mobile<input className="wl-inp" value={f.phone} placeholder="03xx-xxxxxxx" onChange={set('phone')} /></label>
                  <label>E-mail<input className="wl-inp" value={f.email} placeholder="you@email.com" onChange={set('email')} /></label>
                  <label>Delivery area<input className="wl-inp" value={f.area} onChange={set('area')} /></label>
                  <label className="wide">Delivery address<input className="wl-inp" value={f.address} onChange={set('address')} /></label>
                  {err && <p className="wl-err" role="alert">{err}</p>}
                  {msg && <p className="acc-ok">{msg} ✓</p>}
                  <button className="wl-go" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button>
                </form>
              )}
            </section>

            <section className="panel">
              <h2>My orders</h2>
              {orders === null && <p className="muted">Loading…</p>}
              {orders?.length === 0 && <p className="muted">No orders yet. Your orders will show up here once you place one while logged in.</p>}
              <ul className="acc-list">
                {orders?.map(o => (
                  <li key={o._id}>
                    <div className="acc-row"><b>{o.orderNo}</b><span className={`acc-st ${o.status}`}>{STATUS[o.status] || o.status}</span></div>
                    <small>{when(o.createdAt)} · {o.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</small>
                    <p>{o.items.map(i => `${i.qty} × ${i.name}`).join(', ')}</p>
                    <div className="acc-row"><b>{rs(o.total)}</b><a href={`#/track?no=${encodeURIComponent(o.orderNo)}&phone=${encodeURIComponent(o.phone)}`}>Track</a></div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2>My table bookings</h2>
              {bookings.length === 0 && <p className="muted">No bookings yet.</p>}
              <ul className="acc-list">
                {bookings.map(b => (
                  <li key={b._id}>
                    <div className="acc-row"><b>{b.date} · {b.time}</b><span className={`acc-st ${b.status}`}>{STATUS[b.status] || b.status}</span></div>
                    <p>{b.guests} guest{b.guests > 1 ? 's' : ''}{b.note ? ` · ${b.note}` : ''}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
