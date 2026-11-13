import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpError, clean, findOrderForTracking, normalizeOrderType, makeToken, normalizePhone, priceOrder, verifyToken } from './lib.js';

const menu = [
  { _id: '1', name: 'Chicken Tikka Chest', price: 540 },
  { _id: '2', name: 'Raita', price: 60 },
];

test('priceOrder uses server prices and adds the delivery fee', () => {
  const r = priceOrder([{ id: '1', qty: 1, price: 1 }], menu, 180);
  assert.equal(r.subtotal, 540);
  assert.equal(r.deliveryFee, 180);
  assert.equal(r.total, 720);
  assert.deepEqual(r.items, [{ menuId: '1', name: 'Chicken Tikka Chest', price: 540, qty: 1 }]);
});

test('priceOrder merges duplicate lines', () => {
  const r = priceOrder([{ id: '2', qty: 2 }, { id: '2', qty: 1 }], menu, 0);
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].qty, 3);
  assert.equal(r.total, 180);
});

test('priceOrder rejects bad input', () => {
  for (const items of [undefined, [], [{ id: 'nope', qty: 1 }], [{ id: '1', qty: 0 }], [{ id: '1', qty: 1.5 }], [{ id: '1', qty: 'x' }], [{ id: '1', qty: 51 }]]) {
    assert.throws(() => priceOrder(items, menu, 180), HttpError);
  }
  assert.throws(() => priceOrder([{ id: '1', qty: 30 }, { id: '1', qty: 30 }], menu, 180), HttpError);
});

test('normalizePhone', () => {
  assert.equal(normalizePhone('0300-1234567'), '03001234567');
  assert.equal(normalizePhone('+92 300 1234567'), '03001234567');
  assert.equal(normalizePhone('923001234567'), '03001234567');
  assert.equal(normalizePhone('021-34813245'), '');
  assert.equal(normalizePhone(undefined), '');
});

test('normalizeOrderType defaults to delivery', () => {
  assert.equal(normalizeOrderType('pickup'), 'pickup');
  for (const v of ['delivery', 'PICKUP', '', undefined, null, 5, {}]) assert.equal(normalizeOrderType(v), 'delivery');
});

test('a pickup order has no delivery fee', () => {
  const r = priceOrder([{ id: '1', qty: 2 }], menu, 0);
  assert.equal(r.deliveryFee, 0);
  assert.equal(r.total, 1080);
});

test('findOrderForTracking needs the order number and a matching phone', () => {
  const orders = [{ orderNo: 'MF-ABC12', phone: '03001234567', altPhone: '03111234567', status: 'new' }];
  assert.equal(findOrderForTracking(orders, 'mf-abc12', '0300-1234567'), orders[0]);
  assert.equal(findOrderForTracking(orders, 'MF-ABC12', '+92 311 1234567'), orders[0]);
  assert.equal(findOrderForTracking(orders, 'MF-ABC12', '03009999999'), null);
  assert.equal(findOrderForTracking(orders, 'MF-NOPE', '03001234567'), null);
  assert.equal(findOrderForTracking(orders, '', ''), null);
  assert.equal(findOrderForTracking(orders, undefined, undefined), null);
});

test('clean', () => {
  assert.equal(clean('  hi  '), 'hi');
  assert.equal(clean('abcdef', 3), 'abc');
  assert.equal(clean({ a: 1 }), '');
});

test('admin tokens: valid, expired, tampered, wrong secret', () => {
  const t = makeToken('s3cret', 1000, 5000);
  assert.equal(verifyToken('s3cret', t, 5500), true);
  assert.equal(verifyToken('s3cret', t, 6001), false);
  assert.equal(verifyToken('other', t, 5500), false);
  assert.equal(verifyToken('s3cret', t.replace(/^\d/, d => String((Number(d) + 1) % 10)), 5500), false);
  for (const bad of [undefined, null, '', 'x', '123.', '.abc', 42]) assert.equal(verifyToken('s3cret', bad, 5500), false);
});
