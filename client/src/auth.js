import { useEffect, useState } from 'react';

const KEY = 'mf-auth';
const FAV = 'mf-fav';

export const getAuth = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
export const authToken = () => getAuth()?.token || '';

/** Save (or clear, with null) the customer login. Also pre-fills the welcome / checkout details from the account. */
export function setAuth(a) {
  try {
    if (a) {
      localStorage.setItem(KEY, JSON.stringify(a));
      localStorage.setItem('mf-profile', JSON.stringify({ name: a.user.name, address: a.user.address || '' }));
    } else localStorage.removeItem(KEY);
  } catch { /* storage blocked */ }
  window.dispatchEvent(new Event('auth-change'));
}

export function updateUser(user) {
  const a = getAuth();
  if (a) setAuth({ ...a, user });
}

export function useAuth() {
  const [a, setA] = useState(getAuth);
  useEffect(() => {
    const on = () => setA(getAuth());
    window.addEventListener('auth-change', on);
    return () => window.removeEventListener('auth-change', on);
  }, []);
  return a;
}

export const openAuth = (mode = 'login') => window.dispatchEvent(new CustomEvent('open-auth', { detail: mode }));

/** Favourites are kept on the device; when logged in they are merged with the account's list so they follow the customer. */
export const localFavs = () => { try { return JSON.parse(localStorage.getItem(FAV) || '[]'); } catch { return []; } };
export const saveLocalFavs = v => { try { localStorage.setItem(FAV, JSON.stringify(v)); } catch { /* ignore */ } };
