import crypto from 'crypto';

// Pure helpers (no I/O) so they can be unit-tested with `npm test`.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const ORDER_STATUSES = ['new', 'preparing', 'on-the-way', 'delivered', 'cancelled'];
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'];

/** Trim a user supplied string and cap its length. Non-strings become ''. */
export const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Only 'pickup' is special; anything else is a delivery order. */
export const normalizeOrderType = v => (v === 'pickup' ? 'pickup' : 'delivery');

/** Accepts 03xx-xxxxxxx, 03xxxxxxxxx or +92 3xx xxxxxxx. Returns 03xxxxxxxxx or ''. */
export function normalizePhone(v) {
  let d = String(v ?? '').replace(/\D/g, '');
  if (d.startsWith('92') && d.length === 12) d = '0' + d.slice(2);
  return /^03\d{9}$/.test(d) ? d : '';
}

/**
 * Finds the order a customer is asking about. Both the order number and the phone
 * number used when ordering must match, so order numbers cannot be browsed.
 */
export function findOrderForTracking(orders, orderNo, phone) {
  const no = clean(orderNo, 30).toUpperCase();
  const p = normalizePhone(phone);
  if (!no || !p) return null;
  return orders.find(o => String(o.orderNo).toUpperCase() === no && [o.phone, o.altPhone].some(x => normalizePhone(x) === p)) ?? null;
}

/**
 * Prices an order from the menu stored on the server. Prices sent by the
 * browser are never trusted: only item ids and quantities are read.
 */
export function priceOrder(items, menu, deliveryFee) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Your cart is empty');
  if (items.length > 40) throw new HttpError(400, 'Too many items in one order');

  const byId = new Map(menu.map(m => [String(m._id), m]));
  const lines = new Map();
  for (const it of items) {
    const m = byId.get(String(it?.id));
    if (!m) throw new HttpError(400, 'An item in your cart is no longer on the menu');
    const qty = Number(it.qty);
    if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, 'Invalid quantity');
    const key = String(m._id);
    const line = lines.get(key) ?? { menuId: key, name: m.name, price: m.price, qty: 0 };
    line.qty += qty;
    if (line.qty > 50) throw new HttpError(400, 'Maximum 50 of one item per order');
    lines.set(key, line);
  }

  const list = [...lines.values()];
  const subtotal = list.reduce((sum, l) => sum + l.price * l.qty, 0);
  return { items: list, subtotal, deliveryFee, total: subtotal + deliveryFee };
}

/**
 * Stateless admin tokens ("<expiry>.<signature>"): they survive a server restart and work when the host
 * runs more than one process, which an in-memory token list cannot do.
 */
export function makeToken(secret, ttlMs, now = Date.now()) {
  const exp = String(now + ttlMs);
  return `${exp}.${crypto.createHmac('sha256', secret).update(exp).digest('hex')}`;
}

export function verifyToken(secret, token, now = Date.now()) {
  if (typeof token !== 'string') return false;
  const [exp, sig = ''] = token.split('.');
  if (!/^\d+$/.test(exp) || Number(exp) <= now) return false;
  const want = crypto.createHmac('sha256', secret).update(exp).digest('hex');
  return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}

// ---------- Customer accounts ----------
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(String(pw), salt, 32).toString('hex')}`;
}

export function checkPassword(pw, stored) {
  const [salt, hash = ''] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const got = crypto.scryptSync(String(pw), salt, 32);
  const want = Buffer.from(hash, 'hex');
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

/** Customer login tokens: "u.<userId>.<expiry>.<signature>". Different shape from the admin token, so one can never pass as the other. */
export function makeUserToken(secret, userId, ttlMs, now = Date.now()) {
  const body = `u.${userId}.${now + ttlMs}`;
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
}

export function verifyUserToken(secret, token, now = Date.now()) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'u' || !/^\d+$/.test(parts[2]) || Number(parts[2]) <= now) return null;
  const want = crypto.createHmac('sha256', secret).update(parts.slice(0, 3).join('.')).digest('hex');
  const ok = parts[3].length === want.length && crypto.timingSafeEqual(Buffer.from(parts[3]), Buffer.from(want));
  return ok ? parts[1] : null;
}

/** A login identifier is either a Pakistani mobile number or an e-mail address. */
export function parseIdentifier(v) {
  const t = String(v ?? '').trim();
  if (t.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) && t.length <= 120 ? { email: t.toLowerCase() } : null;
  const ph = normalizePhone(t);
  return ph ? { phone: ph } : null;
}

// ---------- Link previews for the inner pages (WhatsApp / Facebook / Google read the HTML, not the #hash) ----------
export const PAGE_META = {
  '/checkout': { title: 'Checkout | Master Foods & Pakwan Centre', desc: 'Complete your order from Master Foods & Pakwan Centre, Karachi. Cash on delivery and fast home delivery.', noindex: true },
  '/track': { title: 'Track your order | Master Foods & Pakwan Centre', desc: 'Check the live status of your Master Foods & Pakwan Centre order with your order number and phone.', noindex: true },
  '/book': { title: 'Book a table | Master Foods & Pakwan Centre', desc: 'Reserve a table at Master Foods & Pakwan Centre, Karachi. Pick a date, time and number of guests.' },
  '/account': { title: 'My account | Master Foods & Pakwan Centre', desc: 'Log in to see your orders, bookings and favourites at Master Foods & Pakwan Centre.', noindex: true },
};

const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Returns index.html with the title / description / URL of one inner page swapped in, or null if `pathname` is not an inner page. */
export function withPageMeta(html, pathname) {
  const key = String(pathname || '').replace(/\/+$/, '').toLowerCase();
  const m = PAGE_META[key];
  if (!m) return null;
  const origin = (html.match(/<link rel="canonical" href="(https?:\/\/[^"/]+)/) || [])[1] || '';
  const url = `${origin}${key}`;
  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(m.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(m.desc)}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(m.title)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(m.desc)}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${esc(url)}"`)
    .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${esc(m.title)}"`)
    .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(m.desc)}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${esc(url)}"`);
  if (m.noindex) out = out.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>');
  return out;
}
