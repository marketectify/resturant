import express from 'express'; import mongoose from 'mongoose'; import cors from 'cors'; import crypto from 'crypto'; import 'dotenv/config';
const app = express(); app.use(cors(), express.json());
const Menu = mongoose.model('Menu', new mongoose.Schema({ name: String, desc: String, price: Number, cat: String, emoji: String }));
const Booking = mongoose.model('Booking', new mongoose.Schema({ name: String, phone: String, date: String, time: String, guests: Number, note: String, status: { type: String, default: 'pending' } }, { timestamps: true }));
// Works with MongoDB if available, otherwise falls back to in-memory demo data (resets on restart)
let useMongo = false, nid = 1; const mem = { menu: [], bookings: [] }; const M = { menu: Menu, bookings: Booking };
const db = {
  list: async k => useMongo ? M[k].find().sort(k === 'menu' ? '' : '-createdAt') : (k === 'menu' ? [...mem.menu] : [...mem.bookings].reverse()),
  add: async (k, d) => { if (useMongo) return M[k].create(d); const o = { ...d, _id: String(nid++), createdAt: new Date(), ...(k === 'bookings' && { status: 'pending' }) }; mem[k].push(o); return o; },
  set: async (k, i, p) => { if (useMongo) return M[k].findByIdAndUpdate(i, p, { new: true }); const o = mem[k].find(x => x._id === i); o && Object.assign(o, p); return o; },
  del: async (k, i) => { if (useMongo) return M[k].findByIdAndDelete(i); mem[k] = mem[k].filter(x => x._id !== i); return { ok: 1 }; },
};
const tokens = new Set();
const auth = (q, s, n) => tokens.has(q.headers['x-token']) ? n() : s.status(401).json({ error: 'Unauthorized' });
app.post('/api/login', (q, s) => {
  if (q.body.password !== (process.env.ADMIN_PASSWORD || 'master123')) return s.status(401).json({ error: 'Wrong password' });
  const t = crypto.randomUUID(); tokens.add(t); s.json({ token: t });
});
app.get('/api/menu', async (_, s) => s.json(await db.list('menu')));
app.post('/api/bookings', async (q, s) => {
  const { name, phone, date, time, guests } = q.body;
  if (!name || !phone || !date || !time || !guests) return s.status(400).json({ error: 'Please fill all required fields' });
  s.json(await db.add('bookings', q.body));
});
app.get('/api/admin/bookings', auth, async (_, s) => s.json(await db.list('bookings')));
app.patch('/api/admin/bookings/:id', auth, async (q, s) => s.json(await db.set('bookings', q.params.id, { status: q.body.status })));
app.delete('/api/admin/bookings/:id', auth, async (q, s) => s.json(await db.del('bookings', q.params.id)));
app.post('/api/admin/menu', auth, async (q, s) => s.json(await db.add('menu', q.body)));
app.delete('/api/admin/menu/:id', auth, async (q, s) => s.json(await db.del('menu', q.params.id)));
const seed = [
  ['Chicken Biryani', 'Aromatic basmati, tender chicken, secret masala', 450, 'Rice', '🍛'], ['Beef Biryani', 'Slow-cooked Karachi style, bold & spicy', 520, 'Rice', '🍚'],
  ['Chicken Karahi', 'Wok-fired with tomatoes, ginger & green chilli', 1450, 'Karahi', '🍲'], ['Mutton Karahi', 'Desi ghee, fresh spices, melt-in-mouth mutton', 2400, 'Karahi', '🥘'],
  ['Seekh Kabab', 'Charcoal grilled, juicy minced beef', 380, 'BBQ', '🍢'], ['Chicken Tikka', 'Smoky, marinated overnight', 420, 'BBQ', '🍗'],
  ['Halwa Puri', 'Classic Sunday breakfast with chana & aloo', 350, 'Breakfast', '🥞'], ['Doodh Patti Chai', 'Dum-brewed, creamy, perfect', 100, 'Drinks', '☕'],
].map(([name, desc, price, cat, emoji]) => ({ name, desc, price, cat, emoji }));
mem.menu = seed.map(d => ({ ...d, _id: String(nid++) }));
app.listen(process.env.PORT || 5000, () => console.log('API ready on http://localhost:5000'));
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/masterfoods', { serverSelectionTimeoutMS: 3000 }).then(async () => {
  useMongo = true; if (!(await Menu.countDocuments())) await Menu.insertMany(seed); console.log('MongoDB connected');
}).catch(() => console.log('MongoDB not found -> using in-memory demo data (fine for demo)'));
