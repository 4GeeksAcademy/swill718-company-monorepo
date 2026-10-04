import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApplication, validateField } from '../validation.js';

const today = '2026-10-03';
const valid = { fullName: 'Sofia Ramos', email: 'sofia@example.com', phone: '+34 612 345 678', company: 'Sample Brand', country: 'ES', monthlyShipments: '1500', services: ['fulfillment', 'returns'], startDate: today, message: 'We need fulfillment in Spain.', consent: true };

test('accepts a complete TrackFlow inquiry in either operating market', () => {
  assert.deepEqual(validateApplication(valid, today), {});
  assert.deepEqual(validateApplication({ ...valid, country: 'US', phone: '', startDate: '', message: '' }, today), {});
});

test('requires every required field and consent', () => {
  assert.deepEqual(Object.keys(validateApplication({}, today)), ['fullName', 'email', 'company', 'country', 'monthlyShipments', 'services', 'consent']);
});

test('enforces markets, services, email, and shipment boundaries', () => {
  for (const [field, values] of Object.entries({ country: ['FR', ''], services: [[], ['warehousing'], ['returns', 'invalid']], email: ['hello', 'a@b', 'a b@example.com'], monthlyShipments: ['0', '-1', '1.5', '1e3', '1000001', ''] })) {
    for (const value of values) assert.ok(validateField(field, value, today), `${field}: ${value}`);
  }
  assert.equal(validateField('monthlyShipments', '1'), '');
  assert.equal(validateField('monthlyShipments', '1000000'), '');
});

test('checks optional phone, valid future dates, and text limits', () => {
  for (const date of ['2026-10-02', '2027-02-30', 'invalid', '2100-01-01']) assert.ok(validateField('startDate', date, today));
  assert.equal(validateField('startDate', '2028-02-29', today), '');
  assert.ok(validateField('phone', '123'));
  assert.ok(validateField('phone', '+1234567890123456'));
  assert.ok(validateField('phone', 'call me'));
  assert.ok(validateField('fullName', ' '));
  assert.ok(validateField('company', 'x'.repeat(121)));
  assert.ok(validateField('message', 'x'.repeat(2001)));
  assert.ok(validateField('consent', 'true'));
});