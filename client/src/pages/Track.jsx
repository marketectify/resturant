import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';
import { rs } from '../config.js';

const STEPS = {
  delivery: [['new', 'Order received'], ['preparing', 'Being prepared'], ['on-the-way', 'On the way'], ['delivered', 'Delivered']],
  pickup: [['new', 'Order received'], ['preparing', 'Being prepared'], ['delivered', 'Ready / collected']],
};

// Position of an order in its timeline. A pickup order has no "on the way" step.
export function stepIndex(orderType, status) {
  const steps = STEPS[orderType] ?? STEPS.delivery;
  const i = steps.findIndex(([k]) => k === status);
  if (i >= 0) return i;
  return orderType === 'pickup' && status === 'on-the-way' ? 1 : 0;
}

const query = () => new URLSearchParams(location.hash.split('?')[1] || '');

export default function Track() {
  const [orderNo, setOrderNo] = useState(() => query().get('no') || '');
  const [phone, setPhone] = useState(() => query().get('phone') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const lookup = async (no, ph) => {
    setBusy(true); setError(''); setOrder(null);
    try {
      setOrder(await api(`/api/orders/track?orderNo=${encodeURIComponent(no.trim())}&phone=${encodeURIComponent(ph.trim())}`));
    } catch (e) {
      setError(e.offline ? 'Order tracking needs the live server. It is not available in demo mode.' : e.message);
    } finally { setBusy(false); }
  };

  useEffect(() => { if (orderNo && phone) lookup(orderNo, phone); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = e => {
    e.preventDefault();
    if (!orderNo.trim() || !phone.trim()) return setError('Please enter your order number and mobile number');
    lookup(orderNo, phone);
  };

  const type = order?.orderType === 'pickup' ? 'pickup' : 'delivery';
  const steps = STEPS[type];
  const at = order ? stepIndex(type, order.status) : 0;

  return (
    <>
      <Header />
      <div className="page single">
        <section className="panel">
          <h2>Track your order</h2>
          <p className="sub muted">Enter the order number from your confirmation and the mobile number you ordered with.</p>
          <form onSubmit={submit} noValidate>
            <div className="grid2">
              <div>
                <label className="lab" htmlFor="t-no"><span>Order number</span></label>
                <input id="t-no" className="inp" placeholder="MF-XXXXX" value={orderNo} onChange={e => setOrderNo(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <label className="lab" htmlFor="t-phone"><span>Mobile number</span></label>
                <input id="t-phone" className="inp" type="tel" inputMode="tel" placeholder="03xx-xxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary mt" type="submit" disabled={busy}>{busy ? 'Looking…' : 'Track order'}</button>
          </form>
          {error && <p className="err banner-err" role="alert">{error}</p>}

          {order && (
            <div className="track">
              <p className="done-no">Order <b>{order.orderNo}</b> <span className="ot-pill sm">{type === 'pickup' ? 'Pickup' : 'Delivery'}</span></p>
              {order.status === 'cancelled' ? (
                <p className="cancelled">This order was cancelled. Please call us if you have any questions.</p>
              ) : (
                <ol className="steps" aria-label="Order progress">
                  {steps.map(([k, label], i) => (
                    <li key={k} className={i < at ? 'is-done' : i === at ? 'is-now' : ''} aria-current={i === at ? 'step' : undefined}>
                      <span className="dot">{i < at || (i === at && at === steps.length - 1) ? <Icon name="check" size={16} stroke={3} /> : i + 1}</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ol>
              )}
              <ul className="done-items">
                {order.items.map(i => <li key={i.menuId}><span>{i.qty} × {i.name}</span><b>{rs(i.price * i.qty)}</b></li>)}
                {order.deliveryFee > 0 && <li><span>Delivery fee</span><b>{rs(order.deliveryFee)}</b></li>}
                <li className="done-total"><span>Total</span><b className="red">{rs(order.total)}</b></li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
