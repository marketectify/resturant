import { useEffect, useState } from 'react'; import { BIZ, DEMO_MENU } from './config.js';
const api = async (url, opt = {}, token) => {
  const r = await fetch(url, { ...opt, headers: { 'Content-Type': 'application/json', ...(token && { 'x-token': token }) }, body: opt.body && JSON.stringify(opt.body) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Error'); return d;
};
function useReveal() { useEffect(() => { const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .15 }); document.querySelectorAll('.rv').forEach(el => io.observe(el)); return () => io.disconnect(); }); }
function Site() {
  const [menu, setMenu] = useState([]); const [cat, setCat] = useState('All'); const [f, setF] = useState({ guests: 2 }); const [msg, setMsg] = useState('');
  useEffect(() => { api('/api/menu').then(d => setMenu(d.length ? d : DEMO_MENU)).catch(() => setMenu(DEMO_MENU)); }, []); useReveal();
  const cats = ['All', ...new Set(menu.map(m => m.cat))]; const shown = menu.filter(m => cat === 'All' || m.cat === cat);
  const submit = async e => { e.preventDefault(); try { await api('/api/bookings', { method: 'POST', body: f }); setMsg('✅ Booking received! We will confirm on WhatsApp shortly.'); setF({ guests: 2 }); } catch (er) { setMsg('⚠️ ' + er.message); } };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return <>
    <nav><b>🍛 Master Foods</b><div><a href="#menu">Menu</a><a href="#book">Book Table</a><a href="#visit">Visit</a><a className="btn sm" href="#/admin">Admin</a></div></nav>
    <header className="hero"><div className="blob b1" /><div className="blob b2" />
      <span className="float f1">🍛</span><span className="float f2">🍢</span><span className="float f3">🍲</span>
      <p className="pill">Pakwan Centre · Karachi</p><h1>{BIZ.name}</h1><p className="sub">{BIZ.tag}. Biryani, karahi, BBQ & desi nashta — cooked fresh, served hot.</p>
      <div className="row"><a className="btn" href="#book">Book a Table</a><a className="btn ghost" href={`https://wa.me/${BIZ.whatsapp}`}>Order on WhatsApp</a></div></header>
    <div className="marq"><div>{Array(2).fill('BIRYANI • KARAHI • BBQ • HALWA PURI • CHAI • FAMILY HALL • ').join('')}</div></div>
    <section id="menu"><h2 className="rv">Our Menu</h2><div className="tabs rv">{cats.map(c => <button key={c} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
      <div className="grid">{shown.map((m, i) => <div className="card rv" style={{ transitionDelay: i * 60 + 'ms' }} key={m._id}><div className="em">{m.emoji}</div><h3>{m.name}</h3><p>{m.desc}</p><b>Rs. {m.price}</b></div>)}</div></section>
    <section id="book" className="dark"><h2 className="rv">Reserve Your Table</h2>
      <form onSubmit={submit} className="form rv"><input required placeholder="Your name" value={f.name || ''} onChange={set('name')} /><input required placeholder="Phone (03xx...)" value={f.phone || ''} onChange={set('phone')} />
        <input required type="date" value={f.date || ''} onChange={set('date')} /><input required type="time" value={f.time || ''} onChange={set('time')} />
        <input required type="number" min="1" max="50" placeholder="Guests" value={f.guests} onChange={set('guests')} /><input placeholder="Special request (optional)" value={f.note || ''} onChange={set('note')} />
        <button className="btn full">Confirm Booking</button>{msg && <p className="msg">{msg}</p>}</form></section>
    <section id="visit"><h2 className="rv">Visit Us</h2><div className="info rv"><p>📍 {BIZ.address}</p><p>🕒 {BIZ.hours}</p><p>📞 {BIZ.phone}</p><a className="btn" href={BIZ.map} target="_blank">Open in Google Maps</a></div></section>
    <footer>© {new Date().getFullYear()} {BIZ.name}</footer></>;
}
function Admin() {
  const [t, setT] = useState(sessionStorage.getItem('t')); const [pw, setPw] = useState(''); const [bk, setBk] = useState([]); const [menu, setMenu] = useState([]); const [n, setN] = useState({}); const [err, setErr] = useState('');
  const load = () => { api('/api/admin/bookings', {}, t).then(setBk).catch(() => { setT(null); sessionStorage.removeItem('t'); }); api('/api/menu').then(setMenu); };
  useEffect(() => { t && load(); }, [t]);
  const login = async e => { e.preventDefault(); try { const d = await api('/api/login', { method: 'POST', body: { password: pw } }); sessionStorage.setItem('t', d.token); setT(d.token); } catch (x) { setErr(x.message); } };
  if (!t) return <div className="login"><form onSubmit={login} className="form"><h2>Admin Login</h2><input type="password" placeholder="Password" onChange={e => setPw(e.target.value)} /><button className="btn full">Login</button>{err && <p className="msg">{err}</p>}<a href="#/">← Back to site</a></form></div>;
  const st = async (id, status) => { await api('/api/admin/bookings/' + id, { method: 'PATCH', body: { status } }, t); load(); };
  const del = async (u, id) => { await api(u + id, { method: 'DELETE' }, t); load(); };
  const add = async e => { e.preventDefault(); await api('/api/admin/menu', { method: 'POST', body: { ...n, price: +n.price } }, t); setN({}); load(); };
  const c = s => bk.filter(b => b.status === s).length;
  return <div className="adm"><div className="top"><h2>Master Foods Admin</h2><a href="#/">View site</a></div>
    <div className="stats"><div><b>{bk.length}</b>Total</div><div><b>{c('pending')}</b>Pending</div><div><b>{c('confirmed')}</b>Confirmed</div><div><b>{menu.length}</b>Menu items</div></div>
    <h3>Bookings</h3><div className="tw"><table><thead><tr><th>Name</th><th>Phone</th><th>Date</th><th>Time</th><th>Guests</th><th>Status</th><th></th></tr></thead><tbody>
      {bk.map(b => <tr key={b._id}><td>{b.name}<small>{b.note}</small></td><td>{b.phone}</td><td>{b.date}</td><td>{b.time}</td><td>{b.guests}</td><td><span className={'st ' + b.status}>{b.status}</span></td>
        <td><button onClick={() => st(b._id, 'confirmed')}>✔</button><button onClick={() => st(b._id, 'cancelled')}>✖</button><button onClick={() => del('/api/admin/bookings/', b._id)}>🗑</button></td></tr>)}</tbody></table></div>
    <h3>Menu</h3><form onSubmit={add} className="mf">{['name', 'desc', 'price', 'cat', 'emoji'].map(k => <input key={k} required placeholder={k} value={n[k] || ''} onChange={e => setN({ ...n, [k]: e.target.value })} />)}<button className="btn sm">Add</button></form>
    <div className="chips">{menu.map(m => <span key={m._id}>{m.emoji} {m.name} · Rs.{m.price} <button onClick={() => del('/api/admin/menu/', m._id)}>×</button></span>)}</div></div>;
}
export default function App() { const [h, setH] = useState(location.hash); useEffect(() => { const f = () => setH(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []); return h === '#/admin' ? <Admin /> : <Site />; }
