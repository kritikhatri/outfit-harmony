import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neutralType, isNeutral } from '../src/index.js';

const cases = [
  ['#000000', 'black'],
  ['#1A1A1A', 'black'],
  ['#FFFFFF', 'white'],
  ['#808080', 'grey'],
  ['#36454F', 'grey'], // charcoal
  ['#F5F5DC', 'cream'], // beige
  ['#1F3A5F', 'navy'],
  ['#000080', 'navy'],
  ['#5B7FA6', 'denim'],
  ['#C19A6B', 'camel'],
  ['#5C4033', 'brown'],
];

for (const [hex, expected] of cases) {
  test(`${hex} is ${expected}`, () => {
    assert.equal(neutralType(hex), expected);
    assert.equal(isNeutral(hex), true);
  });
}

test('bright and saturated colours are accents, not neutrals', () => {
  for (const hex of ['#FF0000', '#C1440E', '#FF69B4', '#00A86B', '#4169E1', '#FFD700']) {
    assert.equal(neutralType(hex), null, hex);
    assert.equal(isNeutral(hex), false, hex);
  }
});
