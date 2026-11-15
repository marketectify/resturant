import Icon from './Icon.jsx';
import { BIZ } from '../config.js';
import { useStore } from '../store.jsx';
import { useAuth } from '../auth.js';

export function Logo() {
  return (
    <span className="logo-badge">
      <b>master</b>
      <i>FOODS</i>
      <small>Pakwan Centre</small>
    </span>
  );
}

export default function Header() {
  const { setSearchOpen } = useStore();
  const auth = useAuth();
  return (
    <header className="topbar">
      <a className="phone-pill" href={`tel:${BIZ.phoneTel}`} aria-label={`Call ${BIZ.phone}`}>
        <span className="ic"><Icon name="phone" size={20} /></span>
        <span className="phone-num">{BIZ.phone}</span>
      </a>
      <a className="logo" href="#/" aria-label={`${BIZ.short} - all categories`} onClick={e => { const h = location.hash; if (!h || h === '#' || h === '#/') { e.preventDefault(); window.dispatchEvent(new Event('open-cats')); } }}><Logo /></a>
      <nav className="top-links">
        <button className="head-search" onClick={() => setSearchOpen(true)} aria-label="Search the menu"><Icon name="search" size={22} /><span className="hide-sm">Search</span></button>
        <a className="track-link" href="#/track">Track<span className="hide-sm">&nbsp;Order</span></a>
        <a className={`acct-btn${auth ? ' in' : ''}`} href="#/account" aria-label={auth ? `My account (${auth.user.name})` : 'Log in or sign up'}>
          {auth ? <b>{(auth.user.name || '?').trim().charAt(0).toUpperCase()}</b> : <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-1a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>}
        </a>
        <a className="book-pill" href="#/book">Book<span className="hide-sm">&nbsp;a Table</span></a>
      </nav>
    </header>
  );
}
