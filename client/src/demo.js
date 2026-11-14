// A tiny in-browser stand-in for the server. It is used ONLY when the real API cannot be reached
// (for example when the built site is uploaded to plain static hosting), so the whole demo still
// works end to end: ordering, tracking, bookings and the admin panel.
// Everything is saved in this browser (localStorage), so an order placed here shows up in /#/admin
// on the same browser. It is not shared between devices.
import SEED from '../../shared/menu.json';

export const seedMenu = SEED.map((m, i) => ({ ...m, _id: 'd' + i }));
const KEY = 'mf-demo-data';
const PASSWORD = 'master123';
const DELIVERY_FEE = 180;
const ORDER_STATUSES = ['new', 'preparing', 'on-the-way', 'delivered', 'cancelled'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'];

let mem = null;
const data = () => {
  if (!mem) {
    try { mem = JSON.parse(localStorage.getItem(KEY)); } catch { mem = null; }
    if (!mem || !Array.isArray(mem.orders)) mem = { orders: [], bookings: [], menu: null };
  }
  return mem;
};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* storage blocked: keep in memory */ } };
const menuList = () => data().menu || seedMenu;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const phone = v => {
  let d = String(v ?? '').replace(/\D/g, '');
  if (d.startsWith('92') && d.length === 12) d = '0' + d.slice(2);
  return /^03\d{9}$/.test(d) ? d : '';
};
const needAdmin = token => { if (token !== 'demo') fail(401, 'Unauthorized'); };

export function demoCall(url, { method = 'GET', body, token } = {}) {
  const [path, qs = ''] = url.split('?');
  const q = new URLSearchParams(qs);
  const b = body ?? {};
  const d = data();

  if (path === '/api/settings') return { deliveryFee: DELIVERY_FEE };
  if (path === '/api/menu') return [...menuList()];

  if (path === '/api/login') {
    if (b.password !== PASSWORD) fail(401, 'Wrong password (this page is running without a server, in demo mode)');
    return { token: 'demo' };
  }

  if (path === '/api/orders' && method === 'POST') {
    const name = clean(b.name, 80);
    const ph = phone(b.phone);
    const type = b.orderType === 'pickup' ? 'pickup' : 'delivery';
    const address = clean(b.address, 300);
    const altRaw = clean(b.altPhone, 20);
    if (!name) fail(400, 'Please enter your full name');
    if (!ph) fail(400, 'Please enter a valid mobile number (03xx-xxxxxxx)');
    if (altRaw && !phone(altRaw)) fail(400, 'Alternate mobile number is not valid');
    if (type === 'delivery' && !address) fail(400, 'Please enter your delivery address');
    if (!Array.isArray(b.items) || !b.items.length) fail(400, 'Your cart is empty');
    const lines = new Map();
    for (const it of b.items) {
      const m = menuList().find(x => String(x._id) === String(it?.id));
      const qty = Number(it?.qty);
      if (!m) fail(400, 'An item in your cart is no longer on the menu');
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) fail(400, 'Invalid quantity');
      const l = lines.get(m._id) ?? { menuId: String(m._id), name: m.name, price: m.price, qty: 0 };
      l.qty += qty;
      lines.set(m._id, l);
    }
    const items = [...lines.values()];
    const subtotal = items.reduce((s, l) => s + l.price * l.qty, 0);
    const deliveryFee = type === 'pickup' ? 0 : DELIVERY_FEE;
    const o = {
      _id: 'o' + Date.now() + d.orders.length, orderNo: 'MF-' + Date.now().toString(36).toUpperCase().slice(-5), orderType: type, payment: 'cod',
      title: clean(b.title, 10), name, phone: ph, altPhone: altRaw ? phone(altRaw) : '', email: clean(b.email, 120),
      area: type === 'pickup' ? '' : clean(b.area, 80), address: type === 'pickup' ? '' : address,
      landmark: type === 'pickup' ? '' : clean(b.landmark, 120), instructions: clean(b.instructions, 300),
      items, subtotal, deliveryFee, total: subtotal + deliveryFee, status: 'new', createdAt: new Date().toISOString(),
    };
    d.orders.push(o); save();
    return { orderNo: o.orderNo, orderType: type, subtotal, deliveryFee, total: o.total, items, demo: true };
  }

  if (path === '/api/orders/track') {
    const no = clean(q.get('orderNo'), 30).toUpperCase();
    const ph = phone(q.get('phone'));
    const o = no && ph && d.orders.find(x => x.orderNo === no && [x.phone, x.altPhone].some(p => p && p === ph));
    if (!o) fail(404, 'We could not find an order with those details');
    return { orderNo: o.orderNo, orderType: o.orderType, status: o.status, createdAt: o.createdAt, items: o.items, subtotal: o.subtotal, deliveryFee: o.deliveryFee, total: o.total };
  }

  if (path === '/api/bookings' && method === 'POST') {
    const name = clean(b.name, 80); const ph = phone(b.phone); const date = clean(b.date, 10); const time = clean(b.time, 5); const guests = Number(b.guests);
    if (!name || !ph || !date || !time || !Number.isInteger(guests) || guests < 1 || guests > 50) fail(400, 'Please fill all required fields (mobile format: 03xx-xxxxxxx)');
    const bk = { _id: 'b' + Date.now() + d.bookings.length, name, phone: ph, date, time, guests, note: clean(b.note, 300), status: 'pending', createdAt: new Date().toISOString() };
    d.bookings.push(bk); save();
    return bk;
  }

  // ---- admin ----
  const cm = path.match(/^\/api\/admin\/categories(?:\/([^/]+))?$/);
  if (cm) {
    needAdmin(token);
    const menu = d.menu ||= [...seedMenu];
    const cats = d.cats ||= [];
    for (const name of [...new Set(menu.map(x => x.cat))]) if (!cats.some(c => c.name === name)) cats.push({ _id: 'c' + cats.length + Date.now(), name, emoji: menu.find(x => x.cat === name)?.emoji || '' });
    const withCount = () => cats.map(c => ({ ...c, count: menu.filter(x => x.cat === c.name).length }));
    if (method === 'GET') return withCount();
    const name = clean(b.name, 40);
    const dup = other => cats.some(c => c !== other && c.name.toLowerCase() === name.toLowerCase());
    if (method === 'POST') {
      if (!name) fail(400, 'Category name is required');
      if (dup()) fail(400, 'This category already exists');
      const c = { _id: 'c' + Date.now(), name, emoji: clean(b.emoji, 8) };
      cats.push(c); save();
      return c;
    }
    const cur = cats.find(c => c._id === cm[1]);
    if (!cur) fail(404, 'Not found');
    if (method === 'PATCH') {
      if (!name) fail(400, 'Category name is required');
      if (dup(cur)) fail(400, 'This category already exists');
      menu.forEach(x => { if (x.cat === cur.name) x.cat = name; });
      cur.name = name; cur.emoji = clean(b.emoji, 8); save();
      return cur;
    }
    if (method === 'DELETE') {
      const n = menu.filter(x => x.cat === cur.name).length;
      if (n) fail(400, `This category still has ${n} item(s). Move or delete them first.`);
      cats.splice(cats.indexOf(cur), 1); save();
      return cur;
    }
  }

  const m = path.match(/^\/api\/admin\/(orders|bookings|menu)(?:\/([^/]+))?$/);
  if (m) {
    needAdmin(token);
    const [, kind, id] = m;
    const list = kind === 'menu' ? (d.menu ||= [...seedMenu]) : d[kind];
    if (method === 'GET' && !id) return kind === 'menu' ? [...list] : [...list].reverse();
    if (method === 'POST' && kind === 'menu') {
      const item = { _id: 'd' + Date.now(), name: clean(b.name, 80), desc: clean(b.desc, 120), price: Number(b.price), cat: clean(b.cat, 40), emoji: clean(b.emoji, 8), badge: clean(b.badge, 30), img: clean(b.img, 500), details: clean(b.details, 600), deal: clean(b.deal, 200) };
      if (!item.name || !item.cat || !Number.isFinite(item.price) || item.price < 0) fail(400, 'Name, category and a valid price are required');
      list.push(item); save();
      return item;
    }
    const idx = list.findIndex(x => x._id === id);
    if (idx < 0) fail(404, 'Not found');
    if (method === 'PATCH' && kind === 'menu') {
      const item = { name: clean(b.name, 80), desc: clean(b.desc, 120), price: Number(b.price), cat: clean(b.cat, 40), emoji: clean(b.emoji, 8), badge: clean(b.badge, 30), img: clean(b.img, 500), details: clean(b.details, 600), deal: clean(b.deal, 200) };
      if (!item.name || !item.cat || !Number.isFinite(item.price) || item.price < 0) fail(400, 'Name, category and a valid price are required');
      Object.assign(list[idx], item); save();
      return list[idx];
    }
    if (method === 'PATCH') {
      const ok = kind === 'orders' ? ORDER_STATUSES : BOOKING_STATUSES;
      if (!ok.includes(b.status)) fail(400, 'Invalid status');
      list[idx].status = b.status; save();
      return list[idx];
    }
    if (method === 'DELETE') { const [gone] = list.splice(idx, 1); save(); return gone; }
  }
  return fail(404, 'Not found');
}
