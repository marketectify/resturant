import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { BIZ } from '../config.js';
import { openAuth, useAuth } from '../auth.js';

const KEY = 'mf-profile';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const skipped = () => { try { return sessionStorage.getItem('mf-welcome-skip') === '1'; } catch { return false; } };

/**
 * First-visit welcome: asks for a name and (optionally) the customer's location. The answer is saved in this
 * browser (so we do not ask again, and checkout is pre-filled) and sent to the restaurant: it appears in the
 * admin panel under "Customers". The browser itself still asks permission before sharing the location.
 */
export default function Welcome() {
  const auth = useAuth();
  const [open, setOpen] = useState(() => !read() && !skipped() && !/^#\/admin/.test(location.hash));
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [geo, setGeo] = useState(null); // { lat, lng, accuracy }
  const [geoState, setGeoState] = useState('idle'); // idle | busy | ok | denied | unsupported
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const input = useRef(null);

  useEffect(() => { if (open) { document.body.style.overflow = 'hidden'; input.current?.focus(); } return () => { document.body.style.overflow = ''; }; }, [open]);

  const locate = () => {
    if (!navigator.geolocation) { setGeoState('unsupported'); return; }
    setGeoState('busy');
    navigator.geolocation.getCurrentPosition(
      p => { setGeo({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }); setGeoState('ok'); },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const submit = async e => {
    e.preventDefault();
    if (!name.trim()) { setErr('Please enter your name'); return; }
    setBusy(true); setErr('');
    try { await api('/api/visitors', { method: 'POST', body: { name: name.trim(), address: address.trim(), ...geo } }); } catch { /* the customer can still order; do not block */ }
    try { localStorage.setItem(KEY, JSON.stringify({ name: name.trim(), address: address.trim(), ...geo })); } catch { /* storage blocked */ }
    setOpen(false);
  };
  const skip = () => { try { sessionStorage.setItem('mf-welcome-skip', '1'); } catch { /* ignore */ } setOpen(false); };

  if (!open || auth) return null;
  return (
    <div className="wl-overlay">
      <form className="wl" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="wl-h">
        <div className="wl-badge"><b>master</b><i>FOODS</i></div>
        <h2 id="wl-h">Welcome to {BIZ.short}!</h2>
        <p className="wl-sub">Tell us your name and where you are, so we can deliver faster.</p>

        <label className="wl-lab" htmlFor="wl-name">Your name</label>
        <input id="wl-name" ref={input} className="wl-inp" placeholder="e.g. Ahmed Khan" autoComplete="name" value={name} onChange={e => { setName(e.target.value); setErr(''); }} />

        <button type="button" className={`wl-loc ${geoState}`} onClick={locate} disabled={geoState === 'busy'}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="8" /></svg>
          <span>{geoState === 'busy' ? 'Finding your location…' : geoState === 'ok' ? 'Location shared ✓' : 'Share my current location'}</span>
        </button>
        {geoState === 'denied' && <p className="wl-note">Location is blocked. Allow it in your browser, or type your area below.</p>}
        {geoState === 'unsupported' && <p className="wl-note">This device cannot share its location. Please type your area below.</p>}

        <label className="wl-lab" htmlFor="wl-addr">Area / address <small>(optional)</small></label>
        <input id="wl-addr" className="wl-inp" placeholder="e.g. Gulshan-e-Iqbal, Block 13" autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} />

        {err && <p className="wl-err" role="alert">{err}</p>}
        <button className="wl-go" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Continue'}</button>
        <button className="wl-skip" type="button" onClick={skip}>Skip for now</button>
        <button className="wl-login" type="button" onClick={() => { skip(); openAuth('login'); }}>Already have an account? <b>Log in</b></button>
        <p className="wl-fine">Your name and location are saved on this device and shared with {BIZ.short} only to deliver your order.</p>
      </form>
    </div>
  );
}
