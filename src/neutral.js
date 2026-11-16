import { chroma, hexToHsl, normalizeHex } from './color.js';

/**
 * The neutral categories this package recognises.
 * In fashion these pair with almost anything, so they are not counted as "accent" colours.
 */
export const NEUTRAL_TYPES = Object.freeze([
  'black',
  'white',
  'grey',
  'cream',
  'navy',
  'denim',
  'camel',
  'brown',
]);

const inRange = (v, min, max) => v >= min && v <= max;

/**
 * Classify a colour as a fashion neutral.
 * @param {string} hex
 * @returns {string|null} one of NEUTRAL_TYPES, or null if the colour is an accent
 */
export function neutralType(hex) {
  const normalized = normalizeHex(hex);
  const { h, s, l } = hexToHsl(normalized);
  const c = chroma(normalized);

  if (l <= 12) return 'black';

  if (c < 0.05) return l >= 92 ? 'white' : 'grey';
  if (c < 0.15) return l >= 75 ? 'cream' : 'grey';

  if (inRange(h, 200, 250) && l <= 35) return 'navy';
  if (inRange(h, 195, 230) && s <= 50 && inRange(l, 30, 65)) return 'denim';
  if (inRange(h, 20, 45) && s <= 55 && inRange(l, 36, 80)) return 'camel';
  if (inRange(h, 10, 40) && s <= 60 && inRange(l, 12, 35)) return 'brown';

  return null;
}

/**
 * Whether a colour counts as a fashion neutral.
 * @param {string} hex
 * @returns {boolean}
 */
export function isNeutral(hex) {
  return neutralType(hex) !== null;
}
