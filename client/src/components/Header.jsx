import Icon from './Icon.jsx';
import { BIZ } from '../config.js';

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
  return (
    <header className="topbar">
      <a className="phone-pill" href={`tel:${BIZ.phoneTel}`} aria-label={`Call ${BIZ.phone}`}>
        <span className="ic"><Icon name="phone" size={20} /></span>
        <span className="phone-num">{BIZ.phone}</span>
      </a>
      <a className="logo" href="#/" aria-label={`${BIZ.short} home`}><Logo /></a>
      <nav className="top-links">
        <a className="track-link" href="#/track">Track<span className="hide-sm">&nbsp;Order</span></a>
        <a className="book-pill" href="#/book">Book<span className="hide-sm">&nbsp;a Table</span></a>
      </nav>
    </header>
  );
}
