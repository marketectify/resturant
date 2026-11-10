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
