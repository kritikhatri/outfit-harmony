import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkOutfit, detectScheme } from '../src/index.js';

test('returns the documented result shape', () => {
  const r = checkOutfit(['#1F3A5F', '#F5F5DC', '#C1440E']);
  assert.deepEqual(Object.keys(r).sort(), [
    'accents', 'clashes', 'colours', 'neutrals', 'scheme', 'score', 'tips', 'verdict',
  ]);
  assert.equal(typeof r.score, 'number');
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.deepEqual(r.colours[0], { hex: '#1F3A5F', hsl: { h: 215, s: 51, l: 25 }, neutral: 'navy' });
});

test('navy + cream + rust: one accent grounded by neutrals works', () => {
  const r = checkOutfit(['#1F3A5F', '#F5F5DC', '#C1440E']);
  assert.equal(r.scheme, 'single-accent');
  assert.equal(r.verdict, 'works');
  assert.deepEqual(r.neutrals, ['#1F3A5F', '#F5F5DC']);
  assert.deepEqual(r.accents, ['#C1440E']);
  assert.deepEqual(r.clashes, []);
});

test('all-neutral outfit works', () => {
  const r = checkOutfit(['#000000', '#FFFFFF', '#808080']);
  assert.equal(r.scheme, 'neutral');
  assert.equal(r.verdict, 'works');
});

test('denim, white, camel and brown are all neutrals', () => {
  const r = checkOutfit(['#5B7FA6', '#FFFFFF', '#C19A6B', '#5C4033']);
  assert.equal(r.accents.length, 0);
  assert.equal(r.verdict, 'works');
});

test('pure red + pure green clashes', () => {
  const r = checkOutfit(['#FF0000', '#00FF00']);
  assert.equal(r.verdict, 'clashes');
  assert.deepEqual(r.clashes, [['#FF0000', '#00FF00']]);
  assert.ok(r.tips.length > 0);
});

test('complementary pair with a neutral works', () => {
  const r = checkOutfit(['#FF0000', '#00FFFF', '#FFFFFF']);
  assert.equal(r.scheme, 'complementary');
  assert.equal(r.verdict, 'works');
});

test('analogous warm tones with a neutral work', () => {
  const r = checkOutfit(['#E63946', '#F4A261', '#FFFFFF']);
  assert.equal(r.scheme, 'analogous');
  assert.equal(r.verdict, 'works');
});

test('too many bright accents scores low', () => {
  const r = checkOutfit(['#FF0000', '#FF8800', '#00FF00', '#0000FF', '#FF00FF']);
  assert.equal(r.verdict, 'clashes');
  assert.ok(r.tips.some((t) => t.includes('Too many accent colours')));
});

test('similar lightness everywhere gets a contrast tip', () => {
  const r = checkOutfit(['#F0F0F0', '#EEEEEE']);
  assert.ok(r.tips.some((t) => t.includes('contrast')));
  assert.ok(r.score < 90);
});

test('extraNeutrals lets users mark their own staples as neutral', () => {
  const olive = '#808000';
  const without = checkOutfit([olive, '#C1440E']);
  const withOpt = checkOutfit([olive, '#C1440E'], { extraNeutrals: ['808000'] });
  assert.deepEqual(without.accents.length, 2);
  assert.deepEqual(withOpt.accents, ['#C1440E']);
  assert.equal(withOpt.colours[0].neutral, 'custom');
});

test('single colour is valid', () => {
  const r = checkOutfit(['#C1440E']);
  assert.equal(r.scheme, 'single-accent');
});

test('input validation', () => {
  assert.throws(() => checkOutfit('#FFFFFF'), TypeError);
  assert.throws(() => checkOutfit([]), RangeError);
  assert.throws(() => checkOutfit(new Array(13).fill('#FFFFFF')), RangeError);
  assert.throws(() => checkOutfit(['#FFFFFF', 'nope']), /colours\[1\]/);
});

test('detectScheme classifies hue sets', () => {
  assert.equal(detectScheme([]), 'neutral');
  assert.equal(detectScheme([10]), 'single-accent');
  assert.equal(detectScheme([200, 205]), 'monochromatic');
  assert.equal(detectScheme([350, 20]), 'analogous'); // wraps past 0°
  assert.equal(detectScheme([30, 210]), 'complementary');
  assert.equal(detectScheme([0, 120, 240]), 'triadic');
  assert.equal(detectScheme([0, 150, 210]), 'split-complementary');
  assert.equal(detectScheme([0, 90]), 'custom');
});
