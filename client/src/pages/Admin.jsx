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

const ico = d => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const EditIc = ico(<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />);
const TrashIc = ico(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
const CheckIc = ico(<path d="m5 12.5 4.5 4.5L19 7.5" />);
const XIc = ico(<path d="M6 6l12 12M18 6 6 18" />);
const EMPTY_ITEM = { name: '', desc: '', price: '', cat: '', emoji: '', badge: '', img: '', details: '', deal: '' };

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
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(null); // item being added (no _id) or edited
  const [catForm, setCatForm] = useState(null);
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  const logout = useCallback(() => { store.set(null); setToken(null); }, []);
  const load = useCallback(async () => {
    try {
      const [o, b, m, c] = await Promise.all([api('/api/admin/orders', { token }), api('/api/admin/bookings', { token }), api('/api/menu'), api('/api/admin/categories', { token })]);
      setOrders(o); setBookings(b); setMenu(m); setCats(c);
    } catch (e) { if (e.status === 401) logout(); else setMsg(e.offline ? 'Server is not connected.' : e.message); }
  }, [token, logout]);
  useEffect(() => { if (token) load(); }, [token, load]);

  if (!token) return <Login onToken={setToken} />;

  const run = async (fn) => { setMsg(''); try { await fn(); await load(); } catch (e) { if (e.status === 401) logout(); else setMsg(e.message); } };
  const patch = (kind, id, status) => run(() => api(`/api/admin/${kind}/${id}`, { method: 'PATCH', body: { status }, token }));
  const del = (kind, id, label) => { if (window.confirm(`Delete ${label}?`)) run(() => api(`/api/admin/${kind}/${id}`, { method: 'DELETE', token })); };
  const saveItem = e => {
    e.preventDefault();
    const { _id, ...body } = form;
    run(async () => {
      await api(_id ? `/api/admin/menu/${_id}` : '/api/admin/menu', { method: _id ? 'PATCH' : 'POST', body: { ...body, price: Number(body.price) }, token });
      setForm(null);
    });
  };
  const saveCat = e => {
    e.preventDefault();
    const { _id, name, emoji } = catForm;
    run(async () => {
      await api(_id ? `/api/admin/categories/${_id}` : '/api/admin/categories', { method: _id ? 'PATCH' : 'POST', body: { name, emoji }, token });
      setCatForm(null);
    });
  };

  const shown = menu.filter(m => (!filter || m.cat === filter) && (!q || `${m.name} ${m.cat}`.toLowerCase().includes(q.toLowerCase())));
  const tabs = [['orders', `Orders (${orders.length})`], ['bookings', `Bookings (${bookings.length})`], ['menu', `Menu (${menu.length})`], ['cats', `Categories (${cats.length})`]];

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
          <thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Items</th><th>Total</th><th>Status</th><th className="act">Action</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan="7" className="muted">No orders yet.</td></tr>}
            {orders.map(o => (
              <tr key={o._id}>
                <td><b>{o.orderNo}</b><small>{when(o.createdAt)}</small></td>
                <td>{o.title} {o.name}<small>{o.phone}{o.altPhone ? ` / ${o.altPhone}` : ''}</small></td>
                <td>{o.orderType === 'pickup' ? <b>Pickup</b> : o.address}<small>{o.orderType === 'pickup' ? '' : o.area}{o.landmark ? ` · near ${o.landmark}` : ''}{o.instructions ? ` · “${o.instructions}”` : ''}</small></td>
                <td>{o.items.map(i => <div key={i.menuId}>{i.qty}× {i.name}</div>)}</td>
                <td><b>{rs(o.total)}</b><small>{o.orderType === 'pickup' ? 'cash at pickup' : `incl. ${rs(o.deliveryFee)} delivery · COD`}</small></td>
                <td><select className={`st-sel ${o.status}`} value={o.status} onChange={e => patch('orders', o._id, e.target.value)} aria-label={`Status of order ${o.orderNo}`}>{ORDER_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                <td><button className="icon-btn" onClick={() => del('orders', o._id, `order ${o.orderNo}`)} aria-label={`Delete order ${o.orderNo}`} title="Delete">{TrashIc}</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {tab === 'bookings' && (
        <div className="tw"><table>
          <thead><tr><th>Name</th><th>Phone</th><th>Date</th><th>Time</th><th>Guests</th><th>Status</th><th className="act">Action</th></tr></thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan="7" className="muted">No bookings yet.</td></tr>}
            {bookings.map(b => (
              <tr key={b._id}>
                <td>{b.name}<small>{b.note}</small></td><td>{b.phone}</td><td>{b.date}</td><td>{b.time}</td><td>{b.guests}</td>
                <td><span className={`st ${b.status}`}>{b.status}</span></td>
                <td>
                  <button className="icon-btn" onClick={() => patch('bookings', b._id, 'confirmed')} aria-label={`Confirm booking for ${b.name}`} title="Confirm">{CheckIc}</button>
                  <button className="icon-btn" onClick={() => patch('bookings', b._id, 'cancelled')} aria-label={`Cancel booking for ${b.name}`} title="Cancel">{XIc}</button>
                  <button className="icon-btn" onClick={() => del('bookings', b._id, `booking for ${b.name}`)} aria-label={`Delete booking for ${b.name}`} title="Delete">{TrashIc}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {tab === 'menu' && (
        <>
          <div className="adm-bar">
            <input className="adm-search" type="search" placeholder="Search items…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search items" />
            <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {cats.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
            <button className="btn-primary slim" onClick={() => setForm({ ...EMPTY_ITEM, cat: filter })}>+ Add item</button>
          </div>

          {form && (
            <form onSubmit={saveItem} className="mf panel-form">
              <h3>{form._id ? 'Edit item' : 'New item'}</h3>
              <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input required type="number" min="0" placeholder="Price (Rs.)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <select required value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} aria-label="Category">
                <option value="" disabled>Choose category</option>
                {cats.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              <input placeholder="Emoji" maxLength={8} value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} />
              <input placeholder="Description (optional)" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
              <input placeholder="Badge (e.g. New Arrival)" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} />
              <input type="url" placeholder="Image URL (optional)" value={form.img} onChange={e => setForm({ ...form, img: e.target.value })} />
              <input placeholder="More details (optional)" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
              <input placeholder="Deal text, e.g. Buy 2 get a drink free (optional)" value={form.deal} onChange={e => setForm({ ...form, deal: e.target.value })} />
              <div className="form-actions">
                <button className="btn-primary slim" type="submit">{form._id ? 'Save changes' : 'Add item'}</button>
                <button className="btn-cancel" type="button" onClick={() => setForm(null)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="tw"><table>
            <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Badge</th><th className="act">Action</th></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan="5" className="muted">No items found.</td></tr>}
              {shown.map(m => (
                <tr key={m._id}>
                  <td><div className="item-cell"><span className="item-ic">{m.emoji || '🍽️'}</span><span><b>{m.name}</b><small>{m.desc}</small></span></div></td>
                  <td>{m.cat}</td>
                  <td><b>{rs(m.price)}</b></td>
                  <td>{m.badge ? <span className="st">{m.badge}</span> : <small>—</small>}</td>
                  <td className="act">
                    <button className="icon-btn" onClick={() => { setForm({ ...EMPTY_ITEM, ...m, price: String(m.price) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label={`Edit ${m.name}`} title="Edit">{EditIc}</button>
                    <button className="icon-btn danger" onClick={() => del('menu', m._id, m.name)} aria-label={`Delete ${m.name}`} title="Delete">{TrashIc}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}

      {tab === 'cats' && (
        <>
          <div className="adm-bar">
            <span className="muted-l">Categories group the menu. Create one here, then choose it when adding items.</span>
            <button className="btn-primary slim" onClick={() => setCatForm({ name: '', emoji: '' })}>+ Add category</button>
          </div>
          {catForm && (
            <form onSubmit={saveCat} className="mf panel-form">
              <h3>{catForm._id ? 'Edit category' : 'New category'}</h3>
              <input required placeholder="Category name" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
              <input placeholder="Emoji (optional)" maxLength={8} value={catForm.emoji} onChange={e => setCatForm({ ...catForm, emoji: e.target.value })} />
              <div className="form-actions">
                <button className="btn-primary slim" type="submit">{catForm._id ? 'Save changes' : 'Add category'}</button>
                <button className="btn-cancel" type="button" onClick={() => setCatForm(null)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="tw"><table>
            <thead><tr><th>Category</th><th>Items</th><th className="act">Action</th></tr></thead>
            <tbody>
              {cats.length === 0 && <tr><td colSpan="3" className="muted">No categories yet.</td></tr>}
              {cats.map(c => (
                <tr key={c._id}>
                  <td><div className="item-cell"><span className="item-ic">{c.emoji || '📁'}</span><b>{c.name}</b></div></td>
                  <td>{c.count}</td>
                  <td className="act">
                    <button className="icon-btn" onClick={() => setCatForm({ _id: c._id, name: c.name, emoji: c.emoji || '' })} aria-label={`Edit ${c.name}`} title="Edit">{EditIc}</button>
                    <button className="icon-btn danger" onClick={() => del('categories', c._id, `category ${c.name}`)} aria-label={`Delete ${c.name}`} title="Delete">{TrashIc}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}
    </div>
  );
}
