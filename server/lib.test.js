import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpError, clean, normalizeOrderType, normalizePhone, priceOrder } from './lib.js';

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

test('clean', () => {
  assert.equal(clean('  hi  '), 'hi');
  assert.equal(clean('abcdef', 3), 'abc');
  assert.equal(clean({ a: 1 }), '');
});
