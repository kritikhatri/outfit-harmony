import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestMatches, checkOutfit, isNeutral, hexToHsl, hueDistance } from '../src/index.js';

const HEX = /^#[0-9A-F]{6}$/;

test('returns `count` valid hex colours by default', () => {
  const s = suggestMatches('#C1440E');
  assert.equal(s.length, 3);
  for (const hex of s) assert.match(hex, HEX);
});

test('never suggests the base colour or duplicates', () => {
  const s = suggestMatches('#C1440E', { scheme: 'triadic', count: 10 });
  assert.ok(!s.includes('#C1440E'));
  assert.equal(new Set(s).size, s.length);
});

test('complementary suggestion sits opposite on the wheel and passes checkOutfit', () => {
  const [pick] = suggestMatches('#C1440E', { scheme: 'complementary', count: 1 });
  const d = hueDistance(hexToHsl('#C1440E').h, hexToHsl(pick).h);
  assert.ok(d >= 175, `distance was ${d}`);
  assert.equal(checkOutfit(['#C1440E', pick]).verdict, 'works');
});

test('includeNeutrals mixes in neutrals; false removes them', () => {
  const withN = suggestMatches('#C1440E', { count: 3 });
  assert.ok(withN.some(isNeutral));
  const withoutN = suggestMatches('#C1440E', { count: 3, includeNeutrals: false });
  assert.ok(!withoutN.some(isNeutral));
});

test('analogous suggestions stay within 30° of the base hue', () => {
  const base = hexToHsl('#2E86AB').h;
  const s = suggestMatches('#2E86AB', { scheme: 'analogous', includeNeutrals: false });
  for (const hex of s) assert.ok(hueDistance(base, hexToHsl(hex).h) <= 31);
});

test('monochromatic keeps the hue and changes lightness', () => {
  const base = hexToHsl('#C1440E');
  const s = suggestMatches('#C1440E', { scheme: 'monochromatic', includeNeutrals: false });
  assert.equal(s.length, 2);
  for (const hex of s) {
    const hsl = hexToHsl(hex);
    assert.ok(hueDistance(base.h, hsl.h) <= 3);
    assert.notEqual(hsl.l, base.l);
  }
});

test('neutral base gets staple accents and a different neutral', () => {
  const s = suggestMatches('#1F3A5F'); // navy
  assert.ok(s.includes('#7B1E3A')); // burgundy
  assert.ok(!s.includes('#1F2A44')); // doesn't suggest navy for navy
});

test('option validation', () => {
  assert.throws(() => suggestMatches('#C1440E', { scheme: 'rainbow' }), RangeError);
  assert.throws(() => suggestMatches('#C1440E', { count: 0 }), RangeError);
  assert.throws(() => suggestMatches('#C1440E', { count: 2.5 }), RangeError);
  assert.throws(() => suggestMatches('not-a-colour'), TypeError);
});
