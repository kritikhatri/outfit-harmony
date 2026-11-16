/**
 * Low-level colour helpers: hex parsing, RGB/HSL conversion and hue maths.
 * All functions are pure and have no dependencies.
 */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Normalise a hex colour to the form "#RRGGBB" (upper-case).
 * Accepts "#abc", "abc", "#aabbcc" or "aabbcc" (any case, surrounding spaces ignored).
 * @param {string} input
 * @returns {string}
 * @throws {TypeError} if the input is not a valid hex colour
 */
export function normalizeHex(input) {
  if (typeof input !== 'string') {
    throw new TypeError(`Expected a hex colour string, got ${input === null ? 'null' : typeof input}`);
  }
  const match = input.trim().match(HEX_RE);
  if (!match) {
    throw new TypeError(`Invalid hex colour: "${input}"`);
  }
  let hex = match[1];
  if (hex.length === 3) {
    hex = [...hex].map((c) => c + c).join('');
  }
  return `#${hex.toUpperCase()}`;
}

/**
 * Convert a hex colour to RGB channels (0–255).
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
export function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Convert a hex colour to HSL.
 * @param {string} hex
 * @returns {{ h: number, s: number, l: number }} h in degrees (0–359), s and l in percent (0–100)
 */
export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rf) h = 60 * (((gf - bf) / d) % 6);
    else if (max === gf) h = 60 * ((bf - rf) / d + 2);
    else h = 60 * ((rf - gf) / d + 4);
  }
  if (h < 0) h += 360;

  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL back to a hex colour.
 * @param {{ h: number, s: number, l: number }} hsl h in degrees, s and l in percent
 * @returns {string} "#RRGGBB"
 */
export function hslToHex({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360;
  const sf = clamp(s, 0, 100) / 100;
  const lf = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lf - 1)) * sf;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lf - c / 2;

  let rgb;
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return `#${rgb
    .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/**
 * Chroma (colourfulness) of a hex colour, 0–1. Low chroma means greyish.
 * @param {string} hex
 * @returns {number}
 */
export function chroma(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

/**
 * Shortest distance between two hues on the colour wheel (0–180).
 * @param {number} a hue in degrees
 * @param {number} b hue in degrees
 * @returns {number}
 */
export function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
