import test from 'node:test';
import assert from 'node:assert/strict';
import { needsLowVolumeWarning, validateApplication, validateField } from '../validation.js';

const valid = {
  companyName: 'TrackFlow Client',
  contactPerson: 'Alex Morgan',
  corporateEmail: 'alex@company.com',
  phone: '+1 213 555 0147',
  website: 'https://company.com',
  country: 'US',
  productType: 'fashion',
  monthlyVolume: '101-500',
  services: ['warehousing', 'last-mile'],
  current3pl: 'evaluating',
  comments: 'Looking for a logistics partner.',
  privacyPolicy: true,
};

test('accepts a complete syllabus lead form', () => {
  assert.deepEqual(validateApplication(valid), {});
  assert.deepEqual(validateApplication({ ...valid, website: '', comments: '' }), {});
});

test('returns the exact required syllabus error messages', () => {
  const errors = validateApplication({});
  assert.deepEqual(errors, {
    companyName: 'Company name must have at least 2 characters',
    contactPerson: 'Enter first and last name of contact',
    corporateEmail: 'Enter a valid corporate email (example: <name@company.com>)',
    phone: 'Phone must include country code (example: +1 213 555 0147)',
    country: 'Select main operating country',
    productType: 'Select the type of product you handle',
    monthlyVolume: 'Select estimated monthly volume',
    services: 'Select at least one service of interest',
    current3pl: 'Indicate if you currently work with another logistics provider',
    privacyPolicy: 'You must accept the privacy policy to continue',
  });
});

test('validates names, email, international phone, and optional website', () => {
  assert.ok(validateField('companyName', 'A'));
  assert.equal(validateField('companyName', 'AB'), '');
  assert.ok(validateField('contactPerson', 'Alex'));
  assert.equal(validateField('contactPerson', 'Alex Morgan'), '');
  assert.ok(validateField('corporateEmail', 'invalid'));
  assert.equal(validateField('corporateEmail', 'name@company.com'), '');
  assert.ok(validateField('phone', '213 555 0147'));
  assert.equal(validateField('phone', '+34 976 123 456'), '');
  assert.ok(validateField('website', 'company.com'));
  assert.ok(validateField('website', 'ftp://company.com'));
  assert.equal(validateField('website', 'https://company.com'), '');
  assert.equal(validateField('website', ''), '');
});

test('validates all select and service choices', () => {
  for (const [field, value] of Object.entries({ country: 'CA', productType: 'toys', monthlyVolume: '501', current3pl: 'maybe' })) {
    assert.ok(validateField(field, value), `${field}: ${value}`);
  }
  assert.equal(validateField('country', 'both'), '');
  assert.equal(validateField('productType', 'cosmetics'), '');
  assert.equal(validateField('monthlyVolume', '2000+'), '');
  assert.equal(validateField('current3pl', 'no'), '');
  assert.ok(validateField('services', []));
  assert.ok(validateField('services', ['unknown']));
  assert.equal(validateField('services', ['reverse-logistics']), '');
});

test('enforces the comments limit and identifies low-volume leads', () => {
  assert.ok(validateField('comments', 'x'.repeat(501)).startsWith('Comments cannot exceed 500 characters'));
  assert.equal(validateField('comments', 'x'.repeat(500)), '');
  assert.equal(needsLowVolumeWarning({ ...valid, monthlyVolume: '0-100' }), true);
  assert.equal(needsLowVolumeWarning({ ...valid, monthlyVolume: '101-500' }), false);
  assert.equal(needsLowVolumeWarning({ ...valid, monthlyVolume: '0-100', productType: '' }), false);
});
