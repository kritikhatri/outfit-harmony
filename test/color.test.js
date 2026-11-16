import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHex, hexToRgb, hexToHsl, hslToHex, hueDistance } from '../src/index.js';

test('normalizeHex accepts short, long, with and without #', () => {
  assert.equal(normalizeHex('#abc'), '#AABBCC');
  assert.equal(normalizeHex('abc'), '#AABBCC');
  assert.equal(normalizeHex('#1f3a5f'), '#1F3A5F');
  assert.equal(normalizeHex('  1F3A5F  '), '#1F3A5F');
});

test('normalizeHex rejects invalid input', () => {
  assert.throws(() => normalizeHex('#12345'), TypeError);
  assert.throws(() => normalizeHex('#GGGGGG'), TypeError);
  assert.throws(() => normalizeHex('red'), TypeError);
  assert.throws(() => normalizeHex(''), TypeError);
  assert.throws(() => normalizeHex(123), TypeError);
  assert.throws(() => normalizeHex(null), TypeError);
});

test('hexToRgb splits channels', () => {
  assert.deepEqual(hexToRgb('#FF8000'), { r: 255, g: 128, b: 0 });
});

test('hexToHsl gives known values', () => {
  assert.deepEqual(hexToHsl('#FF0000'), { h: 0, s: 100, l: 50 });
  assert.deepEqual(hexToHsl('#00FF00'), { h: 120, s: 100, l: 50 });
  assert.deepEqual(hexToHsl('#0000FF'), { h: 240, s: 100, l: 50 });
  assert.deepEqual(hexToHsl('#FFFFFF'), { h: 0, s: 0, l: 100 });
  assert.deepEqual(hexToHsl('#000000'), { h: 0, s: 0, l: 0 });
});

test('hslToHex round-trips primary colours', () => {
  for (const hex of ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#FFFF00']) {
    assert.equal(hslToHex(hexToHsl(hex)), hex);
  }
});

test('hslToHex wraps hue past 360 and below 0', () => {
  assert.equal(hslToHex({ h: 360, s: 100, l: 50 }), '#FF0000');
  assert.equal(hslToHex({ h: -120, s: 100, l: 50 }), '#0000FF');
});

test('hueDistance takes the short way round the wheel', () => {
  assert.equal(hueDistance(10, 350), 20);
  assert.equal(hueDistance(0, 180), 180);
  assert.equal(hueDistance(90, 90), 0);
  assert.equal(hueDistance(30, 270), 120);
});
