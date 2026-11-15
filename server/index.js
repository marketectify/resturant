import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HttpError, ORDER_STATUSES, BOOKING_STATUSES, clean, findOrderForTracking, normalizeOrderType, makeToken, normalizePhone, priceOrder, verifyToken, hashPassword, checkPassword, makeUserToken, verifyUserToken, parseIdentifier } from './lib.js';

const PORT = process.env.PORT || 5000;
// Hosting panels sometimes keep stray spaces or quotes around a pasted value: strip them.
const unquote = v => String(v ?? '').trim().replace(/^(['"])(.*)\1$/, '$2').trim();
const ADMIN_PASSWORD = unquote(process.env.ADMIN_PASSWORD) || 'master123';
const feeFromEnv = Number(process.env.DELIVERY_FEE);
const DELIVERY_FEE = process.env.DELIVERY_FEE && Number.isFinite(feeFromEnv) && feeFromEnv >= 0 ? feeFromEnv : 180;
if (!unquote(process.env.ADMIN_PASSWORD)) console.warn('ADMIN_PASSWORD not set: using the default "master123". Set it in server/.env before going live.');

const app = express();
app.set('trust proxy', 1); // behind Hostinger's proxy: use the visitor's IP for the tracking rate limit
app.use(cors(), express.json({ limit: '50kb' }));

// ---------- Data layer ----------
// Uses MongoDB when it is reachable, otherwise falls back to in-memory demo data (resets on restart).
const SEED_MENU = JSON.parse(fs.readFileSync(new URL('../shared/menu.json', import.meta.url), 'utf8'));

const Menu = mongoose.model('Menu', new mongoose.Schema({ name: String, desc: String, price: Number, cat: String, emoji: String, badge: String, img: String, details: String, deal: String }));
const Category = mongoose.model('Category', new mongoose.Schema({ name: String, emoji: String }));
const Visitor = mongoose.model('Visitor', new mongoose.Schema({ name: String, lat: Number, lng: Number, accuracy: Number, address: String }, { timestamps: true }));
const User = mongoose.model('User', new mongoose.Schema({ name: String, phone: String, email: String, pass: String, address: String, area: String, favs: [String] }, { timestamps: true }));
const Booking = mongoose.model('Booking', new mongoose.Schema({ name: String, phone: String, date: String, time: String, guests: Number, note: String, userId: String, status: { type: String, default: 'pending' } }, { timestamps: true }));
const Order = mongoose.model('Order', new mongoose.Schema({
  orderNo: String, orderType: { type: String, default: 'delivery' }, payment: { type: String, default: 'cod' }, title: String, name: String, phone: String, altPhone: String, email: String,
  area: String, address: String, landmark: String, instructions: String,
  items: [{ _id: false, menuId: String, name: String, price: Number, qty: Number }],
  subtotal: Number, deliveryFee: Number, total: Number,
  userId: String,
  status: { type: String, default: 'new' },
}, { timestamps: true }));

const Meta = mongoose.model('Meta', new mongoose.Schema({ key: String, value: Number }));
const SEED_VERSION = 2; // bump when shared/menu.json gets new items: they are added once on the next start

let useMongo = false;
let nextId = 1;
const models = { menu: Menu, bookings: Booking, orders: Order, categories: Category, visitors: Visitor, users: User };
const mem = { menu: [], bookings: [], orders: [], categories: [], visitors: [], users: [] };
mem.menu = SEED_MENU.map(d => ({ ...d, _id: String(nextId++) }));

const db = {
  list: async k => useMongo
    ? models[k].find().sort(k === 'menu' || k === 'categories' ? { _id: 1 } : { createdAt: -1 }).lean()
    : (k === 'menu' || k === 'categories' ? [...mem[k]] : [...mem[k]].reverse()),
  add: async (k, d) => {
    if (useMongo) return (await models[k].create(d)).toObject();
    const o = { ...d, _id: String(nextId++), createdAt: new Date() };
    mem[k].push(o);
    return o;
  },
  set: async (k, id, patch) => {
    if (useMongo) return models[k].findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
    const o = mem[k].find(x => x._id === id);
    if (o) Object.assign(o, patch);
    return o;
  },
  del: async (k, id) => {
    if (useMongo) return models[k].findByIdAndDelete(id);
    const before = mem[k].length;
    mem[k] = mem[k].filter(x => x._id !== id);
    return before !== mem[k].length ? { ok: 1 } : null;
  },
};

// ---------- Helpers ----------
const ah = fn => (q, s, n) => Promise.resolve(fn(q, s, n)).catch(n); // forward async errors to the error handler
const found = o => { if (!o) throw new HttpError(404, 'Not found'); return o; };

const TOKEN_TTL = 12 * 60 * 60 * 1000;
const TOKEN_SECRET = `masterfoods|${ADMIN_PASSWORD}|${process.env.MONGO_URI || ''}`;
const auth = (q, s, n) => {
  if (verifyToken(TOKEN_SECRET, q.headers['x-token'])) return n();
  s.status(401).json({ error: 'Unauthorized' });
};

const USER_SECRET = `masterfoods-users|${TOKEN_SECRET}`;
const USER_TTL = 90 * 24 * 60 * 60 * 1000;
// Optional customer login: sets q.userId when a valid x-user token is sent.
app.use((q, _s, n) => { q.userId = verifyUserToken(USER_SECRET, q.headers['x-user']) || ''; n(); });

// ---------- Public API ----------
app.get('/api/health', (_q, s) => s.json({ ok: true, db: useMongo ? 'mongodb' : 'memory', adminPassword: unquote(process.env.ADMIN_PASSWORD) ? 'custom' : 'default' }));
app.get('/api/settings', (_q, s) => s.json({ deliveryFee: DELIVERY_FEE }));
app.get('/api/menu', ah(async (_q, s) => s.json(await db.list('menu'))));

// Order tracking: at most 20 lookups per minute per IP (a wrong guess still costs one).
const trackHits = new Map(); // ip -> { n, reset }
app.get('/api/orders/track', ah(async (q, s) => {
  const now = Date.now();
  const h = trackHits.get(q.ip);
  if (!h || h.reset < now) trackHits.set(q.ip, { n: 1, reset: now + 60_000 });
  else if (++h.n > 20) throw new HttpError(429, 'Too many lookups, please try again in a minute');
  const o = findOrderForTracking(await db.list('orders'), q.query.orderNo, q.query.phone);
  if (!o) throw new HttpError(404, 'We could not find an order with those details');
  s.json({
    orderNo: o.orderNo, orderType: o.orderType || 'delivery', status: o.status, createdAt: o.createdAt,
    items: o.items, subtotal: o.subtotal, deliveryFee: o.deliveryFee, total: o.total,
  });
}));

app.post('/api/orders', ah(async (q, s) => {
  const b = q.body ?? {};
  const name = clean(b.name, 80);
  const phone = normalizePhone(b.phone);
  const orderType = normalizeOrderType(b.orderType);
  const address = clean(b.address, 300);
  const altRaw = clean(b.altPhone, 20);
  const altPhone = altRaw ? normalizePhone(altRaw) : '';
  if (!name) throw new HttpError(400, 'Please enter your full name');
  if (!phone) throw new HttpError(400, 'Please enter a valid mobile number (03xx-xxxxxxx)');
  if (altRaw && !altPhone) throw new HttpError(400, 'Alternate mobile number is not valid');
  if (orderType === 'delivery' && !address) throw new HttpError(400, 'Please enter your delivery address');

  const priced = priceOrder(b.items, await db.list('menu'), orderType === 'pickup' ? 0 : DELIVERY_FEE);
  const order = await db.add('orders', {
    orderNo: 'MF-' + Date.now().toString(36).toUpperCase().slice(-5), orderType, payment: 'cod',
    title: clean(b.title, 10), name, phone, altPhone, email: clean(b.email, 120),
    area: orderType === 'pickup' ? '' : clean(b.area, 80), address: orderType === 'pickup' ? '' : address,
    landmark: orderType === 'pickup' ? '' : clean(b.landmark, 120), instructions: clean(b.instructions, 300),
    ...priced, userId: q.userId, status: 'new',
  });
  s.status(201).json({ orderNo: order.orderNo, orderType, subtotal: order.subtotal, deliveryFee: order.deliveryFee, total: order.total, items: order.items });
}));

app.post('/api/bookings', ah(async (q, s) => {
  const b = q.body ?? {};
  const name = clean(b.name, 80);
  const phone = normalizePhone(b.phone);
  const date = clean(b.date, 10);
  const time = clean(b.time, 5);
  const guests = Number(b.guests);
  if (!name || !phone || !date || !time || !Number.isInteger(guests) || guests < 1 || guests > 50) {
    throw new HttpError(400, 'Please fill all required fields (mobile format: 03xx-xxxxxxx)');
  }
  s.status(201).json(await db.add('bookings', { name, phone, date, time, guests, note: clean(b.note, 300), userId: q.userId, status: 'pending' }));
}));

// ---------- Customer accounts (login with mobile number or e-mail) ----------
const publicUser = u => ({ id: String(u._id), name: u.name || '', phone: u.phone || '', email: u.email || '', address: u.address || '', area: u.area || '', favs: u.favs || [] });
const authHits = new Map(); // ip -> { n, reset }: at most 15 sign-in / sign-up attempts per minute per IP
const limitAuth = q => {
  const now = Date.now();
  const h = authHits.get(q.ip);
  if (!h || h.reset < now) authHits.set(q.ip, { n: 1, reset: now + 60_000 });
  else if (++h.n > 15) throw new HttpError(429, 'Too many attempts, please try again in a minute');
};
const findUser = async id => (await db.list('users')).find(u => u.phone === id.phone && id.phone || u.email === id.email && id.email);
const needUser = async q => {
  if (!q.userId) throw new HttpError(401, 'Please log in');
  const u = (await db.list('users')).find(x => String(x._id) === q.userId);
  if (!u) throw new HttpError(401, 'Please log in');
  return u;
};
const session = u => ({ token: makeUserToken(USER_SECRET, String(u._id), USER_TTL), user: publicUser(u) });

app.post('/api/auth/register', ah(async (q, s) => {
  limitAuth(q);
  const b = q.body ?? {};
  const name = clean(b.name, 80);
  const id = parseIdentifier(b.identifier);
  const pw = String(b.password ?? '');
  if (!name) throw new HttpError(400, 'Please enter your name');
  if (!id) throw new HttpError(400, 'Enter a valid mobile number (03xx-xxxxxxx) or e-mail address');
  if (pw.length < 6 || pw.length > 100) throw new HttpError(400, 'Password must be at least 6 characters');
  if (await findUser(id)) throw new HttpError(409, 'An account with this mobile number / e-mail already exists. Please log in.');
  const u = await db.add('users', { name, phone: id.phone || '', email: id.email || '', pass: hashPassword(pw), address: '', area: '', favs: [] });
  s.status(201).json(session(u));
}));

app.post('/api/auth/login', ah(async (q, s) => {
  limitAuth(q);
  const id = parseIdentifier(q.body?.identifier);
  const u = id && await findUser(id);
  if (!u || !checkPassword(String(q.body?.password ?? ''), u.pass)) throw new HttpError(401, 'Wrong mobile number / e-mail or password');
  s.json(session(u));
}));

app.get('/api/me', ah(async (q, s) => s.json(publicUser(await needUser(q)))));

app.patch('/api/me', ah(async (q, s) => {
  const u = await needUser(q);
  const b = q.body ?? {};
  const patch = {};
  if (typeof b.name === 'string') { patch.name = clean(b.name, 80); if (!patch.name) throw new HttpError(400, 'Name cannot be empty'); }
  if (typeof b.address === 'string') patch.address = clean(b.address, 300);
  if (typeof b.area === 'string') patch.area = clean(b.area, 80);
  for (const k of ['phone', 'email']) {
    if (typeof b[k] !== 'string') continue;
    if (!b[k].trim()) { patch[k] = ''; continue; }
    const id = parseIdentifier(b[k]);
    if (!id || !id[k]) throw new HttpError(400, k === 'phone' ? 'Enter a valid mobile number (03xx-xxxxxxx)' : 'Enter a valid e-mail address');
    const other = await findUser(id);
    if (other && String(other._id) !== String(u._id)) throw new HttpError(409, `This ${k === 'phone' ? 'mobile number' : 'e-mail'} is used by another account`);
    patch[k] = id[k];
  }
  if (Array.isArray(b.favs)) patch.favs = b.favs.filter(x => typeof x === 'string').slice(0, 300);
  if (!(patch.phone ?? u.phone) && !(patch.email ?? u.email)) throw new HttpError(400, 'Keep at least a mobile number or an e-mail to log in with');
  s.json(publicUser(await db.set('users', String(u._id), patch)));
}));

app.get('/api/me/orders', ah(async (q, s) => {
  await needUser(q);
  s.json((await db.list('orders')).filter(o => o.userId === q.userId));
}));
app.get('/api/me/bookings', ah(async (q, s) => {
  await needUser(q);
  s.json((await db.list('bookings')).filter(o => o.userId === q.userId));
}));

// ---------- Admin API ----------
app.post('/api/login', (q, s) => {
  if (String(q.body?.password ?? '').trim() !== ADMIN_PASSWORD) return s.status(401).json({ error: 'Wrong password' });
  s.json({ token: makeToken(TOKEN_SECRET, TOKEN_TTL) });
});

// Welcome screen: the customer gives a name and (optionally) their location; it shows up in the admin panel.
const visitHits = new Map(); // ip -> { n, reset }: at most 10 per hour per IP
app.post('/api/visitors', ah(async (q, s) => {
  const now = Date.now();
  const h = visitHits.get(q.ip);
  if (!h || h.reset < now) visitHits.set(q.ip, { n: 1, reset: now + 3_600_000 });
  else if (++h.n > 10) throw new HttpError(429, 'Too many requests, please try again later');
  const b = q.body ?? {};
  const name = clean(b.name, 80);
  if (!name) throw new HttpError(400, 'Please enter your name');
  const lat = Number(b.lat); const lng = Number(b.lng);
  const hasGeo = b.lat != null && b.lng != null && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const acc = Number(b.accuracy);
  const v = await db.add('visitors', { name, address: clean(b.address, 200), ...(hasGeo && { lat, lng, accuracy: Number.isFinite(acc) ? Math.round(acc) : undefined }) });
  s.status(201).json({ id: String(v._id) });
}));
app.get('/api/admin/visitors', auth, ah(async (_q, s) => s.json(await db.list('visitors'))));
app.delete('/api/admin/visitors/:id', auth, ah(async (q, s) => s.json(found(await db.del('visitors', q.params.id)))));

app.get('/api/admin/users', auth, ah(async (_q, s) => {
  const [users, orders] = await Promise.all([db.list('users'), db.list('orders')]);
  s.json(users.map(u => ({ ...publicUser(u), createdAt: u.createdAt, orders: orders.filter(o => o.userId === String(u._id)).length })));
}));
app.delete('/api/admin/users/:id', auth, ah(async (q, s) => s.json(found(await db.del('users', q.params.id)))));

app.get('/api/admin/orders', auth, ah(async (_q, s) => s.json(await db.list('orders'))));
app.patch('/api/admin/orders/:id', auth, ah(async (q, s) => {
  if (!ORDER_STATUSES.includes(q.body?.status)) throw new HttpError(400, 'Invalid status');
  s.json(found(await db.set('orders', q.params.id, { status: q.body.status })));
}));
app.delete('/api/admin/orders/:id', auth, ah(async (q, s) => s.json(found(await db.del('orders', q.params.id)))));

app.get('/api/admin/bookings', auth, ah(async (_q, s) => s.json(await db.list('bookings'))));
app.patch('/api/admin/bookings/:id', auth, ah(async (q, s) => {
  if (!BOOKING_STATUSES.includes(q.body?.status)) throw new HttpError(400, 'Invalid status');
  s.json(found(await db.set('bookings', q.params.id, { status: q.body.status })));
}));
app.delete('/api/admin/bookings/:id', auth, ah(async (q, s) => s.json(found(await db.del('bookings', q.params.id)))));

const cleanItem = b => ({ name: clean(b?.name, 80), desc: clean(b?.desc, 120), price: Number(b?.price), cat: clean(b?.cat, 40), emoji: clean(b?.emoji, 8), badge: clean(b?.badge, 30), img: clean(b?.img, 500), details: clean(b?.details, 600), deal: clean(b?.deal, 200) });
const checkItem = item => { if (!item.name || !item.cat || !Number.isFinite(item.price) || item.price < 0) throw new HttpError(400, 'Name, category and a valid price are required'); };

// Categories: every category used by a menu item always has a record; the admin can also create empty ones.
const syncCats = async () => {
  const [menu, cats] = await Promise.all([db.list('menu'), db.list('categories')]);
  const have = new Set(cats.map(c => c.name));
  for (const name of [...new Set(menu.map(m => m.cat))]) if (!have.has(name)) { await db.add('categories', { name, emoji: menu.find(m => m.cat === name)?.emoji || '' }); }
  const all = await db.list('categories');
  return all.map(c => ({ ...c, count: menu.filter(m => m.cat === c.name).length }));
};

app.post('/api/admin/menu', auth, ah(async (q, s) => {
  const item = cleanItem(q.body);
  checkItem(item);
  s.status(201).json(await db.add('menu', item));
}));
app.patch('/api/admin/menu/:id', auth, ah(async (q, s) => {
  const item = cleanItem(q.body);
  checkItem(item);
  s.json(found(await db.set('menu', q.params.id, item)));
}));
app.delete('/api/admin/menu/:id', auth, ah(async (q, s) => s.json(found(await db.del('menu', q.params.id)))));

app.get('/api/admin/categories', auth, ah(async (_q, s) => s.json(await syncCats())));
app.post('/api/admin/categories', auth, ah(async (q, s) => {
  const name = clean(q.body?.name, 40);
  if (!name) throw new HttpError(400, 'Category name is required');
  if ((await syncCats()).some(c => c.name.toLowerCase() === name.toLowerCase())) throw new HttpError(400, 'This category already exists');
  s.status(201).json(await db.add('categories', { name, emoji: clean(q.body?.emoji, 8) }));
}));
app.patch('/api/admin/categories/:id', auth, ah(async (q, s) => {
  const name = clean(q.body?.name, 40);
  if (!name) throw new HttpError(400, 'Category name is required');
  const cats = await syncCats();
  const cur = found(cats.find(c => String(c._id) === q.params.id));
  if (cats.some(c => c !== cur && c.name.toLowerCase() === name.toLowerCase())) throw new HttpError(400, 'This category already exists');
  if (name !== cur.name) for (const m of (await db.list('menu')).filter(x => x.cat === cur.name)) await db.set('menu', String(m._id), { cat: name });
  s.json(found(await db.set('categories', q.params.id, { name, emoji: clean(q.body?.emoji, 8) })));
}));
app.delete('/api/admin/categories/:id', auth, ah(async (q, s) => {
  const cur = found((await syncCats()).find(c => String(c._id) === q.params.id));
  if (cur.count) throw new HttpError(400, `This category still has ${cur.count} item(s). Move or delete them first.`);
  s.json(found(await db.del('categories', q.params.id)));
}));

// ---------- Serve the built client (after `npm run build`) ----------
const dist = fileURLToPath(new URL('../client/dist', import.meta.url));
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (_q, s) => s.sendFile(path.join(dist, 'index.html')));
}

// ---------- Errors ----------
app.use((err, _q, s, _n) => {
  if (err instanceof HttpError) return s.status(err.status).json({ error: err.message });
  if (err?.type === 'entity.parse.failed') return s.status(400).json({ error: 'Invalid JSON' });
  if (err?.name === 'CastError' || err?.name === 'ValidationError') return s.status(400).json({ error: 'Invalid data' });
  console.error(err);
  s.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/masterfoods', { serverSelectionTimeoutMS: 10000 }).then(async () => {
  useMongo = true;
  const seeded = await Meta.findOne({ key: 'seedVersion' });
  if (!(await Menu.countDocuments())) await Menu.insertMany(SEED_MENU);
  else if ((seeded?.value ?? 1) < SEED_VERSION) {
    // add menu items that are new in shared/menu.json (once; items deleted later in the admin stay deleted)
    const have = new Set((await Menu.find({}, 'name cat').lean()).map(m => `${m.cat}|${m.name}`));
    const fresh = SEED_MENU.filter(m => !have.has(`${m.cat}|${m.name}`));
    if (fresh.length) await Menu.insertMany(fresh);
  }
  await Meta.updateOne({ key: 'seedVersion' }, { value: SEED_VERSION }, { upsert: true });
  console.log('MongoDB connected');
}).catch(err => console.log(`MongoDB not connected (${err.message}) -> using in-memory demo data (resets on restart)`));
