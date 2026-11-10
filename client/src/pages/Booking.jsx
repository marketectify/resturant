import { useState } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';

const EMPTY = { name: '', phone: '', date: '', time: '', guests: 2, note: '' };

export default function Booking() {
  const [f, setF] = useState(EMPTY);
  const [state, setState] = useState({ status: 'idle', message: '' });
  const today = new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd in the visitor's timezone
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setState({ status: 'busy', message: '' });
    try {
      await api('/api/bookings', { method: 'POST', body: { ...f, guests: Number(f.guests) } });
      setF(EMPTY);
      setState({ status: 'ok', message: 'Booking received! We will confirm on WhatsApp shortly.' });
    } catch (er) {
      setState({ status: 'error', message: er.offline ? 'Booking is not available right now (server not connected).' : er.message });
    }
  };

  return (
    <>
      <Header />
      <div className="page single">
        <form className="panel" onSubmit={submit}>
          <h2>Reserve Your Table</h2>
          <p className="muted sub">Tell us when you are coming and we will keep a table ready.</p>
          <div className="grid2">
            <div><label className="lab" htmlFor="b-name"><span>Full Name</span><em className="req">*Required</em></label><input id="b-name" className="inp" required placeholder="Your name" value={f.name} onChange={set('name')} autoComplete="name" /></div>
            <div><label className="lab" htmlFor="b-phone"><span>Mobile Number</span><em className="req">*Required</em></label><input id="b-phone" className="inp" required type="tel" inputMode="tel" placeholder="03xx-xxxxxxx" value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>
            <div><label className="lab" htmlFor="b-date"><span>Date</span><em className="req">*Required</em></label><input id="b-date" className="inp" required type="date" min={today} value={f.date} onChange={set('date')} /></div>
            <div><label className="lab" htmlFor="b-time"><span>Time</span><em className="req">*Required</em></label><input id="b-time" className="inp" required type="time" value={f.time} onChange={set('time')} /></div>
            <div><label className="lab" htmlFor="b-guests"><span>Guests</span><em className="req">*Required</em></label><input id="b-guests" className="inp" required type="number" min="1" max="50" value={f.guests} onChange={set('guests')} /></div>
            <div><label className="lab" htmlFor="b-note"><span>Special request</span></label><input id="b-note" className="inp" placeholder="Optional" maxLength={300} value={f.note} onChange={set('note')} /></div>
          </div>
          {state.message && <p className={state.status === 'ok' ? 'ok-note' : 'err banner-err'} role="status">{state.status === 'ok' && <Icon name="check" size={18} stroke={3} />} {state.message}</p>}
          <button className="btn-primary mt" type="submit" disabled={state.status === 'busy'}>{state.status === 'busy' ? 'Sending…' : 'Confirm Booking'}</button>
          <a className="continue" href="#/"><Icon name="arrow-left" size={18} /> back to menu</a>
        </form>
      </div>
      <Footer />
    </>
  );
}
