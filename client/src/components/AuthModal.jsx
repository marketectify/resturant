import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { BIZ } from '../config.js';
import { setAuth, localFavs, saveLocalFavs } from '../auth.js';

/** Login / sign-up with a mobile number or an e-mail. Opened from anywhere with openAuth() ('open-auth' event). */
export default function AuthModal() {
  const [mode, setMode] = useState(null); // null | 'login' | 'signup'
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const first = useRef(null);

  useEffect(() => {
    const on = e => { setMode(e.detail === 'signup' ? 'signup' : 'login'); setErr(''); };
    window.addEventListener('open-auth', on);
    return () => window.removeEventListener('open-auth', on);
  }, []);
  useEffect(() => {
    if (!mode) return undefined;
    document.body.style.overflow = 'hidden';
    const k = e => e.key === 'Escape' && setMode(null);
    window.addEventListener('keydown', k);
    setTimeout(() => first.current?.focus(), 30);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k); };
  }, [mode]);

  if (!mode) return null;
  const signup = mode === 'signup';

  const submit = async e => {
    e.preventDefault();
    if (signup && !name.trim()) return setErr('Please enter your name');
    if (!id.trim()) return setErr('Enter your mobile number or e-mail');
    if (!pw) return setErr('Enter your password');
    setBusy(true); setErr('');
    try {
      const r = await api(signup ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: { name: name.trim(), identifier: id.trim(), password: pw } });
      setAuth(r);
      // merge favourites from this device with the ones saved on the account
      const merged = [...new Set([...(r.user.favs || []), ...localFavs()])];
      saveLocalFavs(merged);
      if (merged.length !== (r.user.favs || []).length) api('/api/me', { method: 'PATCH', body: { favs: merged } }).catch(() => {});
      setMode(null); setPw('');
      window.dispatchEvent(new Event('favs-change'));
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="wl-overlay" onClick={() => setMode(null)}>
      <form className="wl au" onSubmit={submit} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="au-h">
        <div className="wl-badge"><b>master</b><i>FOODS</i></div>
        <h2 id="au-h">{signup ? 'Create your account' : 'Welcome back'}</h2>
        <p className="wl-sub">{signup ? 'Save your details, orders, bookings and favourites.' : `Log in to see your orders and favourites at ${BIZ.short}.`}</p>
        <div className="au-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!signup} className={!signup ? 'on' : ''} onClick={() => { setMode('login'); setErr(''); }}>Log in</button>
          <button type="button" role="tab" aria-selected={signup} className={signup ? 'on' : ''} onClick={() => { setMode('signup'); setErr(''); }}>Sign up</button>
        </div>

        {signup && (<>
          <label className="wl-lab" htmlFor="au-name">Your name</label>
          <input id="au-name" ref={first} className="wl-inp" autoComplete="name" placeholder="e.g. Ahmed Khan" value={name} onChange={e => setName(e.target.value)} />
        </>)}
        <label className="wl-lab" htmlFor="au-id">Mobile number or e-mail</label>
        <input id="au-id" ref={signup ? null : first} className="wl-inp" autoComplete="username" inputMode="email" placeholder="03xx-xxxxxxx or you@email.com" value={id} onChange={e => setId(e.target.value)} />
        <label className="wl-lab" htmlFor="au-pw">Password {signup && <small>(at least 6 characters)</small>}</label>
        <input id="au-pw" className="wl-inp" type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={pw} onChange={e => setPw(e.target.value)} />

        {err && <p className="wl-err" role="alert">{err}</p>}
        <button className="wl-go" type="submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}</button>
        <button className="wl-skip" type="button" onClick={() => setMode(null)}>Not now</button>
      </form>
    </div>
  );
}
