import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { api } from './api.js';
import { BIZ } from './config.js';
import { seedMenu as DEMO_MENU } from './demo.js';

const CART_KEY = 'mf-cart';
const safe = fn => { try { return fn(); } catch { return undefined; } };

function loadCart() {
  const raw = safe(() => JSON.parse(localStorage.getItem(CART_KEY) || '{}'));
  const cart = {};
  if (raw && typeof raw === 'object') {
    for (const [id, l] of Object.entries(raw)) {
      if (l && Number.isInteger(l.qty) && l.qty > 0 && Number.isFinite(l.price)) cart[id] = l;
    }
  }
  return cart;
}

const lineOf = (item, qty) => ({ id: item._id, name: item.name, price: item.price, emoji: item.emoji, img: item.img, cat: item.cat, qty });

function cartReducer(state, a) {
  switch (a.type) {
    case 'add': {
      const cur = state[a.item._id];
      return { ...state, [a.item._id]: lineOf(a.item, Math.min(50, (cur?.qty || 0) + 1)) };
    }
    case 'inc': {
      const cur = state[a.id];
      return cur ? { ...state, [a.id]: { ...cur, qty: Math.min(50, cur.qty + 1) } } : state;
    }
    case 'dec': {
      const cur = state[a.id];
      if (!cur) return state;
      if (cur.qty <= 1) { const { [a.id]: _gone, ...rest } = state; return rest; }
      return { ...state, [a.id]: { ...cur, qty: cur.qty - 1 } };
    }
    case 'remove': { const { [a.id]: _gone, ...rest } = state; return rest; }
    case 'clear': return {};
    case 'sync': { // drop lines that are no longer on the menu and refresh prices
      const next = {};
      for (const m of a.menu) if (state[m._id]) next[m._id] = lineOf(m, state[m._id].qty);
      return next;
    }
    default: return state;
  }
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [menu, setMenu] = useState(null); // null while loading
  const [deliveryFee, setDeliveryFee] = useState(BIZ.deliveryFee);
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'pickup'

  useEffect(() => {
    api('/api/menu').then(d => setMenu(d.length ? d : DEMO_MENU)).catch(() => setMenu(DEMO_MENU));
    api('/api/settings').then(d => Number.isFinite(d.deliveryFee) && setDeliveryFee(d.deliveryFee)).catch(() => {});
  }, []);

  useEffect(() => { if (menu) dispatch({ type: 'sync', menu }); }, [menu]);
  useEffect(() => { safe(() => localStorage.setItem(CART_KEY, JSON.stringify(cart))); }, [cart]);

  const lines = useMemo(() => Object.values(cart), [cart]);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);

  const add = useCallback(item => dispatch({ type: 'add', item }), []);
  const inc = useCallback(id => dispatch({ type: 'inc', id }), []);
  const dec = useCallback(id => dispatch({ type: 'dec', id }), []);
  const remove = useCallback(id => dispatch({ type: 'remove', id }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const fee = count && orderType === 'delivery' ? deliveryFee : 0;
  const value = { menu, deliveryFee, fee, orderType, setOrderType, lines, count, subtotal, total: subtotal + fee, add, inc, dec, remove, clear, drawerOpen, setDrawerOpen, searchOpen, setSearchOpen };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
