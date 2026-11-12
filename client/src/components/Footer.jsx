import { BIZ } from '../config.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-in">
        <div>
          <h4>{BIZ.name}</h4>
          <p>{BIZ.tag}</p>
        </div>
        <div>
          <p>📍 {BIZ.address}</p>
          <p>🕒 {BIZ.hours}</p>
          <p>📞 <a href={`tel:${BIZ.phoneTel}`}>{BIZ.phone}</a></p>
        </div>
        <div>
          <p><a href={BIZ.map} target="_blank" rel="noreferrer">Open in Google Maps</a></p>
          <p><a href="#/book">Book a table</a></p>
          <p><a href="#/track">Track your order</a></p>
          <p><a href="#/admin">Admin</a></p>
        </div>
      </div>
      <p className="copy">© {new Date().getFullYear()} {BIZ.name}</p>
    </footer>
  );
}
