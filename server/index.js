import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HttpError, ORDER_STATUSES, BOOKING_STATUSES, clean, findOrderForTracking, normalizeOrderType, normalizePhone, priceOrder } from './lib.js';

const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'master123';
const feeFromEnv = Number(process.env.DELIVERY_FEE);
const DELIVERY_FEE = process.env.DELIVERY_FEE && Number.isFinite(feeFromEnv) && feeFromEnv >= 0 ? feeFromEnv : 180;
if (!process.env.ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD not set: using the default "master123". Set it in server/.env before going live.');

const app = express();
app.set('trust proxy', 1); // behind Hostinger's proxy: use the visitor's IP for the tracking rate limit
app.use(cors(), express.json({ limit: '50kb' }));

// ---------- Data layer ----------
// Uses MongoDB when it is reachable, otherwise falls back to in-memory demo data (resets on restart).
const SEED_MENU = JSON.parse(fs.readFileSync(new URL('../shared/menu.json', import.meta.url), 'utf8'));

const Menu = mongoose.model('Menu', new mongoose.Schema({ name: String, desc: String, price: Number, cat: String, emoji: String, badge: String, img: String, details: String, deal: String }));
const Booking = mongoose.model('Booking', new mongoose.Schema({ name: String, phone: String, date: String, time: String, guests: Number, note: String, status: { type: String, default: 'pending' } }, { timestamps: true }));
const Order = mongoose.model('Order', new mongoose.Schema({
  orderNo: String, orderType: { type: String, default: 'delivery' }, payment: { type: String, default: 'cod' }, title: String, name: String, phone: String, altPhone: String, email: String,
  area: String, address: String, landmark: String, instructions: String,
  items: [{ _id: false, menuId: String, name: String, price: Number, qty: Number }],
  subtotal: Number, deliveryFee: Number, total: Number,
  status: { type: String, default: 'new' },
}, { timestamps: true }));

let useMongo = false;
let nextId = 1;
const models = { menu: Menu, bookings: Booking, orders: Order };
const mem = { menu: [], bookings: [], orders: [] };
mem.menu = SEED_MENU.map(d => ({ ...d, _id: String(nextId++) }));

const db = {
  list: async k => useMongo
    ? models[k].find().sort(k === 'menu' ? { _id: 1 } : { createdAt: -1 }).lean()
    : (k === 'menu' ? [...mem.menu] : [...mem[k]].reverse()),
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
const tokens = new Map(); // token -> expiry timestamp
const auth = (q, s, n) => {
  const exp = tokens.get(q.headers['x-token']);
  if (exp && exp > Date.now()) return n();
  s.status(401).json({ error: 'Unauthorized' });
};

// ---------- Public API ----------
app.get('/api/health', (_q, s) => s.json({ ok: true, db: useMongo ? 'mongodb' : 'memory' }));
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
    ...priced, status: 'new',
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
  s.status(201).json(await db.add('bookings', { name, phone, date, time, guests, note: clean(b.note, 300), status: 'pending' }));
}));

// ---------- Admin API ----------
app.post('/api/login', (q, s) => {
  if (q.body?.password !== ADMIN_PASSWORD) return s.status(401).json({ error: 'Wrong password' });
  const t = crypto.randomUUID();
  tokens.set(t, Date.now() + TOKEN_TTL);
  s.json({ token: t });
});

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

app.post('/api/admin/menu', auth, ah(async (q, s) => {
  const b = q.body ?? {};
  const item = { name: clean(b.name, 80), desc: clean(b.desc, 120), price: Number(b.price), cat: clean(b.cat, 40), emoji: clean(b.emoji, 8), badge: clean(b.badge, 30), img: clean(b.img, 500), details: clean(b.details, 600), deal: clean(b.deal, 200) };
  if (!item.name || !item.cat || !Number.isFinite(item.price) || item.price < 0) throw new HttpError(400, 'Name, category and a valid price are required');
  s.status(201).json(await db.add('menu', item));
}));
app.delete('/api/admin/menu/:id', auth, ah(async (q, s) => s.json(found(await db.del('menu', q.params.id)))));

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
  if (!(await Menu.countDocuments())) await Menu.insertMany(SEED_MENU);
  console.log('MongoDB connected');
}).catch(err => console.log(`MongoDB not connected (${err.message}) -> using in-memory demo data (resets on restart)`));
