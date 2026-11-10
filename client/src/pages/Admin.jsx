import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { rs } from '../config.js';

const ORDER_STATUS = [['new', 'New'], ['preparing', 'Preparing'], ['on-the-way', 'On the way'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
const TOKEN_KEY = 't';
const store = {
  get: () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: v => { try { v ? sessionStorage.setItem(TOKEN_KEY, v) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ } },
};
const when = d => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function Login({ onToken }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const submit = async e => {
    e.preventDefault();
    try {
      const d = await api('/api/login', { method: 'POST', body: { password: pw } });
      store.set(d.token);
      onToken(d.token);
    } catch (x) { setErr(x.offline ? 'Server is not connected.' : x.message); }
  };
  return (
    <div className="login">
      <form className="panel" onSubmit={submit}>
        <h2>Admin Login</h2>
        <label className="lab" htmlFor="pw"><span>Password</span></label>
        <input id="pw" className="inp" type="password" autoFocus value={pw} onChange={e => setPw(e.target.value)} />
        {err && <p className="err banner-err" role="alert">{err}</p>}
        <button className="btn-primary mt" type="submit">Login</button>
        <a className="continue" href="#/"><span>← Back to site</span></a>
      </form>
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(store.get);
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [menu, setMenu] = useState([]);
  const [n, setN] = useState({ name: '', desc: '', price: '', cat: '', emoji: '', badge: '', img: '' });
  const [msg, setMsg] = useState('');

  const logout = useCallback(() => { store.set(null); setToken(null); }, []);
  const load = useCallback(async () => {
    try {
      const [o, b, m] = await Promise.all([api('/api/admin/orders', { token }), api('/api/admin/bookings', { token }), api('/api/menu')]);
      setOrders(o); setBookings(b); setMenu(m);
    } catch (e) { if (e.status === 401) logout(); else setMsg(e.offline ? 'Server is not connected.' : e.message); }
  }, [token, logout]);
  useEffect(() => { if (token) load(); }, [token, load]);

  if (!token) return <Login onToken={setToken} />;

  const run = async (fn) => { setMsg(''); try { await fn(); await load(); } catch (e) { if (e.status === 401) logout(); else setMsg(e.message); } };
  const patch = (kind, id, status) => run(() => api(`/api/admin/${kind}/${id}`, { method: 'PATCH', body: { status }, token }));
  const del = (kind, id, label) => { if (window.confirm(`Delete ${label}?`)) run(() => api(`/api/admin/${kind}/${id}`, { method: 'DELETE', token })); };
  const addItem = e => { e.preventDefault(); run(async () => { await api('/api/admin/menu', { method: 'POST', body: { ...n, price: Number(n.price) }, token }); setN({ name: '', desc: '', price: '', cat: '', emoji: '', badge: '', img: '' }); }); };

  const cats = [...new Set(menu.map(m => m.cat))];
  const tabs = [['orders', `Orders (${orders.length})`], ['bookings', `Bookings (${bookings.length})`], ['menu', `Menu (${menu.length})`]];

  return (
    <div className="adm">
      <div className="adm-top">
        <h1>Master Foods Admin</h1>
        <div><a href="#/">View site</a><button onClick={logout}>Logout</button></div>
      </div>
      <div className="stats">
        <div><b>{orders.filter(o => o.status === 'new').length}</b>New orders</div>
        <div><b>{orders.length}</b>All orders</div>
        <div><b>{bookings.filter(b => b.status === 'pending').length}</b>Pending bookings</div>
        <div><b>{rs(orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0))}</b>Order value</div>
      </div>
      <div className="adm-tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {msg && <p className="err banner-err" role="alert">{msg}</p>}

      {tab === 'orders' && (
        <div className="tw"><table>
          <thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Items</th><th>Total</th><th>Status</th><th /></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan="7" className="muted">No orders yet.</td></tr>}
            {orders.map(o => (
              <tr key={o._id}>
                <td><b>{o.orderNo}</b><small>{when(o.createdAt)}</small></td>
                <td>{o.title} {o.name}<small>{o.phone}{o.altPhone ? ` / ${o.altPhone}` : ''}</small></td>
                <td>{o.address}<small>{o.area}{o.landmark ? ` · near ${o.landmark}` : ''}{o.instructions ? ` · “${o.instructions}”` : ''}</small></td>
                <td>{o.items.map(i => <div key={i.menuId}>{i.qty}× {i.name}</div>)}</td>
                <td><b>{rs(o.total)}</b><small>incl. {rs(o.deliveryFee)} delivery</small></td>
                <td><select className={`st-sel ${o.status}`} value={o.status} onChange={e => patch('orders', o._id, e.target.value)} aria-label={`Status of order ${o.orderNo}`}>{ORDER_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                <td><button className="icon-btn" onClick={() => del('orders', o._id, `order ${o.orderNo}`)} aria-label={`Delete order ${o.orderNo}`}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {tab === 'bookings' && (
        <div className="tw"><table>
          <thead><tr><th>Name</th><th>Phone</th><th>Date</th><th>Time</th><th>Guests</th><th>Status</th><th /></tr></thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan="7" className="muted">No bookings yet.</td></tr>}
            {bookings.map(b => (
              <tr key={b._id}>
                <td>{b.name}<small>{b.note}</small></td><td>{b.phone}</td><td>{b.date}</td><td>{b.time}</td><td>{b.guests}</td>
                <td><span className={`st ${b.status}`}>{b.status}</span></td>
                <td>
                  <button className="icon-btn" onClick={() => patch('bookings', b._id, 'confirmed')} aria-label={`Confirm booking for ${b.name}`}>✔</button>
                  <button className="icon-btn" onClick={() => patch('bookings', b._id, 'cancelled')} aria-label={`Cancel booking for ${b.name}`}>✖</button>
                  <button className="icon-btn" onClick={() => del('bookings', b._id, `booking for ${b.name}`)} aria-label={`Delete booking for ${b.name}`}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {tab === 'menu' && (
        <>
          <form onSubmit={addItem} className="mf">
            <input required placeholder="Name" value={n.name} onChange={e => setN({ ...n, name: e.target.value })} />
            <input placeholder="Description (optional)" value={n.desc} onChange={e => setN({ ...n, desc: e.target.value })} />
            <input required type="number" min="0" placeholder="Price" value={n.price} onChange={e => setN({ ...n, price: e.target.value })} />
            <input required list="cats" placeholder="Category" value={n.cat} onChange={e => setN({ ...n, cat: e.target.value })} />
            <datalist id="cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
            <input placeholder="Emoji" maxLength={8} value={n.emoji} onChange={e => setN({ ...n, emoji: e.target.value })} />
            <input placeholder="Badge (e.g. New Arrival)" value={n.badge} onChange={e => setN({ ...n, badge: e.target.value })} />
            <input type="url" placeholder="Image URL (optional)" value={n.img} onChange={e => setN({ ...n, img: e.target.value })} />
            <button className="btn-primary slim" type="submit">Add item</button>
          </form>
          <div className="chips">{menu.map(m => <span key={m._id}>{m.emoji} {m.name} · {m.cat} · {rs(m.price)} <button onClick={() => del('menu', m._id, m.name)} aria-label={`Delete ${m.name}`}>×</button></span>)}</div>
        </>
      )}
    </div>
  );
}
