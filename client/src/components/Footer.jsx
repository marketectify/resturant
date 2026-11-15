import Icon from './Icon.jsx';
import { BIZ } from '../config.js';

const ico = d => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const PinIc = ico(<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />);
const ClockIc = ico(<path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />);
const PhoneIc = ico(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />);

const go = id => e => { e.preventDefault(); if (id) window.dispatchEvent(new Event(id)); };

export default function Footer() {
  const wa = `https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent('Assalam o Alaikum, I would like to place an order.')}`;
  return (
    <footer className="sf">
      <div className="sf-card">
        <div className="sf-cta">
          <div>
            <h3>Hungry? Order in a minute.</h3>
            <p>Hot biryani, karahi and BBQ at your door. Call or message us and we will take it from there.</p>
          </div>
          <div className="sf-cta-btns">
            <a className="sf-btn light" href={`tel:${BIZ.phoneTel}`}>{PhoneIc} Call now</a>
            <a className="sf-btn green" href={wa} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={20} stroke={1.8} /> WhatsApp</a>
          </div>
        </div>

        <div className="sf-grid">
          <div className="sf-brand">
            <span className="sf-logo"><b>master</b><i>FOODS</i></span>
            <h4>{BIZ.name}</h4>
            <p>{BIZ.tag}. Fresh food, made the traditional way and delivered hot across Karachi.</p>
          </div>

          <div>
            <h5>Visit us</h5>
            <ul className="sf-list">
              <li>{PinIc}<span>{BIZ.address}</span></li>
              <li>{ClockIc}<span>{BIZ.hours}</span></li>
              <li>{PhoneIc}<a href={`tel:${BIZ.phoneTel}`}>{BIZ.phone}</a></li>
            </ul>
            <a className="sf-map" href={BIZ.map} target="_blank" rel="noreferrer">Open in Google Maps <Icon name="arrow-right" size={14} stroke={2.6} /></a>
          </div>

          <div>
            <h5>Quick links</h5>
            <ul className="sf-links">
              <li><a href="#/" onClick={e => { if (!location.hash || location.hash === '#/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>Menu</a></li>
              <li><a href="#/track">Track your order</a></li>
              <li><a href="#/book">Book a table</a></li>
              <li><a href="#/account">My account</a></li>
              <li><a href="#/" onClick={go('open-favs')}>Favourites</a></li>
            </ul>
          </div>
        </div>

        <div className="sf-bottom">
          <span>© {new Date().getFullYear()} {BIZ.name}. All rights reserved.</span>
          <span className="sf-bottom-r">Website by <a href="https://marketectify.com" target="_blank" rel="noreferrer">Marketectify</a> · <a href="#/admin">Admin</a></span>
        </div>
      </div>
    </footer>
  );
}
