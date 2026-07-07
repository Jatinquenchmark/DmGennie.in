// Run: node server/billingConfig.test.mjs
import assert from 'node:assert';
import { getBillingConfig, normalizeCurrency } from './billingConfig.js';

assert.equal(normalizeCurrency('usd'), 'USD');
assert.equal(normalizeCurrency('USD'), 'USD');
assert.equal(normalizeCurrency('inr'), 'INR');
assert.equal(normalizeCurrency('nonsense'), 'INR');
assert.equal(normalizeCurrency(undefined), 'INR');

const usd = getBillingConfig('USD');
assert.equal(usd.currency, 'USD');
assert.equal(usd.symbol, '$');
assert.equal(usd.plans.pro.monthlyPrice, 15);
assert.equal(usd.plans.pro.annualMonthlyPrice, 12);
assert.equal(usd.plans.pro.introOffer.amount, 1);
assert.equal(usd.plans.pro.introOffer.label, '$1 first month');
assert.ok(usd.plans.pro.introOffer.disclaimer.includes('$15/month'));

const inr = getBillingConfig('INR');
assert.equal(inr.currency, 'INR');
assert.equal(inr.symbol, '₹');
assert.equal(inr.plans.pro.monthlyPrice, 499);
assert.equal(inr.plans.pro.introOffer.label, '₹1 first month');

// Unknown currency falls back to INR.
assert.equal(getBillingConfig('EUR').currency, 'INR');
assert.equal(getBillingConfig().currency, 'INR');

console.log('billingConfig currency tests passed');
