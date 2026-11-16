import { clamp, hexToHsl, hslToHex, hueDistance, normalizeHex } from './color.js';
import { neutralType } from './neutral.js';

export const SCHEMES = Object.freeze([
  'neutral',
  'single-accent',
  'monochromatic',
  'analogous',
  'complementary',
  'split-complementary',
  'triadic',
  'custom',
]);

export const SUGGEST_SCHEMES = Object.freeze([
  'auto',
  'complementary',
  'analogous',
  'triadic',
  'split-complementary',
  'monochromatic',
]);

const BASE_SCORE = {
  neutral: 90,
  'single-accent': 92,
  monochromatic: 88,
  analogous: 85,
  complementary: 84,
  'split-complementary': 80,
  triadic: 76,
  custom: 62,
};

const MAX_COLOURS = 12;
const MAX_ACCENTS = 3;

const near = (value, target, tolerance) => Math.abs(value - target) <= tolerance;

/** Smallest arc of the colour wheel that contains every hue. */
function circularSpan(hues) {
  if (hues.length < 2) return 0;
  const sorted = [...hues].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const next = i === sorted.length - 1 ? sorted[0] + 360 : sorted[i + 1];
    maxGap = Math.max(maxGap, next - sorted[i]);
  }
  return 360 - maxGap;
}

/**
 * Work out which colour scheme a set of accent hues forms.
 * @param {number[]} hues accent hues in degrees (neutrals excluded)
 * @returns {string} one of SCHEMES
 */
export function detectScheme(hues) {
  const n = hues.length;
  if (n === 0) return 'neutral';
  if (n === 1) return 'single-accent';

  const span = circularSpan(hues);
  if (span <= 15) return 'monochromatic';
  if (span <= 60) return 'analogous';

  if (n === 2) {
    return hueDistance(hues[0], hues[1]) >= 150 ? 'complementary' : 'custom';
  }

  if (n === 3) {
    const pairs = [
      [0, 1, 2],
      [1, 2, 0],
      [0, 2, 1],
    ];
    const dists = pairs.map(([a, b]) => hueDistance(hues[a], hues[b]));
    if (dists.every((d) => near(d, 120, 20))) return 'triadic';

    for (let base = 0; base < 3; base += 1) {
      const [j, k] = [0, 1, 2].filter((i) => i !== base);
      const dj = hueDistance(hues[base], hues[j]);
      const dk = hueDistance(hues[base], hues[k]);
      const djk = hueDistance(hues[j], hues[k]);
      if (near(dj, 150, 20) && near(dk, 150, 20) && djk <= 75) return 'split-complementary';
      // two close shades + one opposite colour still reads as complementary
      if (djk <= 30 && dj >= 150 && dk >= 150) return 'complementary';
    }
  }

  return 'custom';
}

function toColourEntry(input, index, extraNeutrals) {
  let hex;
  try {
    hex = normalizeHex(input);
  } catch (err) {
    throw new TypeError(`colours[${index}]: ${err.message}`);
  }
  const hsl = hexToHsl(hex);
  const neutral = extraNeutrals.has(hex) ? 'custom' : neutralType(hex);
  return { hex, hsl, neutral };
}

/**
 * Check whether a set of outfit colours work together.
 *
 * @param {string[]} colours hex colours, one per piece (1–12)
 * @param {object} [options]
 * @param {string[]} [options.extraNeutrals] colours you want treated as neutrals (e.g. olive)
 * @returns {{
 *   score: number,
 *   verdict: 'works'|'risky'|'clashes',
 *   scheme: string,
 *   colours: { hex: string, hsl: { h: number, s: number, l: number }, neutral: string|null }[],
 *   neutrals: string[],
 *   accents: string[],
 *   clashes: [string, string][],
 *   tips: string[]
 * }}
 */
export function checkOutfit(colours, options = {}) {
  if (!Array.isArray(colours)) {
    throw new TypeError('checkOutfit expects an array of hex colours');
  }
  if (colours.length === 0) {
    throw new RangeError('checkOutfit needs at least one colour');
  }
  if (colours.length > MAX_COLOURS) {
    throw new RangeError(`checkOutfit accepts at most ${MAX_COLOURS} colours`);
  }

  const extraNeutrals = new Set((options.extraNeutrals ?? []).map((c) => normalizeHex(c)));
  const entries = colours.map((c, i) => toColourEntry(c, i, extraNeutrals));

  const neutrals = entries.filter((e) => e.neutral !== null);
  const accents = entries.filter((e) => e.neutral === null);
  const scheme = detectScheme(accents.map((e) => e.hsl.h));

  let score = BASE_SCORE[scheme];
  const tips = [];

  // Clashes: two strong accents that sit awkwardly apart on the wheel (60°–150°),
  // unless they are part of an intentional triadic / split-complementary scheme.
  const clashes = [];
  if (scheme !== 'triadic' && scheme !== 'split-complementary') {
    for (let i = 0; i < accents.length; i += 1) {
      for (let j = i + 1; j < accents.length; j += 1) {
        const a = accents[i];
        const b = accents[j];
        const d = hueDistance(a.hsl.h, b.hsl.h);
        if (d > 60 && d < 150 && a.hsl.s >= 60 && b.hsl.s >= 60) {
          clashes.push([a.hex, b.hex]);
        }
      }
    }
  }
  if (clashes.length > 0) {
    score -= 15 * clashes.length;
    tips.push('Some bright colours fight each other - mute one of them or swap it for a neutral.');
  }

  if (accents.length > MAX_ACCENTS) {
    score -= 10 * (accents.length - MAX_ACCENTS);
    tips.push(`Too many accent colours - keep to ${MAX_ACCENTS} or fewer and let neutrals do the rest.`);
  }

  if (accents.length >= 2 && accents.every((e) => e.hsl.s < 40)) {
    score += 8;
  }

  if (accents.length >= 2 && neutrals.length === 0) {
    score -= 4;
    tips.push('Add a neutral piece (white, black, denim, camel) to ground the look.');
  }

  if (entries.length >= 2) {
    const lightness = entries.map((e) => e.hsl.l);
    if (Math.max(...lightness) - Math.min(...lightness) < 15) {
      score -= 8;
      tips.push('Every piece has similar lightness - add something lighter or darker for contrast.');
    }
  }

  score = Math.round(clamp(score, 0, 100));
  let verdict = 'clashes';
  if (score >= 75) verdict = 'works';
  else if (score >= 55) verdict = 'risky';

  return {
    score,
    verdict,
    scheme,
    colours: entries,
    neutrals: neutrals.map((e) => e.hex),
    accents: accents.map((e) => e.hex),
    clashes,
    tips,
  };
}

const STAPLE_ACCENTS = ['#7B1E3A', '#2E5E3E', '#D4A017']; // burgundy, forest green, mustard
const DARK_NEUTRALS = [
  { hex: '#1F2A44', type: 'navy' },
  { hex: '#36454F', type: 'grey' }, // charcoal
  { hex: '#C19A6B', type: 'camel' },
];
const LIGHT_NEUTRALS = [
  { hex: '#F5F0E6', type: 'cream' },
  { hex: '#FFFFFF', type: 'white' },
  { hex: '#C19A6B', type: 'camel' },
];

const HUE_OFFSETS = {
  auto: [180, 30],
  complementary: [180],
  analogous: [30, -30],
  triadic: [120, -120],
  'split-complementary': [150, -150],
};

/**
 * Suggest colours that go with a given piece.
 *
 * @param {string} colour hex colour of the piece you already have
 * @param {object} [options]
 * @param {'auto'|'complementary'|'analogous'|'triadic'|'split-complementary'|'monochromatic'} [options.scheme='auto']
 * @param {number} [options.count=3] maximum number of suggestions (1–10)
 * @param {boolean} [options.includeNeutrals=true] mix neutral pieces into the suggestions
 * @returns {string[]} hex colours, best first (may be fewer than `count`)
 */
export function suggestMatches(colour, options = {}) {
  const { scheme = 'auto', count = 3, includeNeutrals = true } = options;

  if (!SUGGEST_SCHEMES.includes(scheme)) {
    throw new RangeError(`Unknown scheme "${scheme}". Use one of: ${SUGGEST_SCHEMES.join(', ')}`);
  }
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    throw new RangeError('count must be an integer between 1 and 10');
  }

  const base = normalizeHex(colour);
  const hsl = hexToHsl(base);
  const baseNeutral = neutralType(base);

  let accentPicks;
  if (scheme === 'monochromatic') {
    accentPicks = [
      hslToHex({ ...hsl, l: clamp(hsl.l + 20, 10, 92) }),
      hslToHex({ ...hsl, l: clamp(hsl.l - 20, 10, 92) }),
    ];
  } else if (baseNeutral !== null) {
    // Hue maths means little for neutrals, so offer classic accents instead.
    accentPicks = [...STAPLE_ACCENTS];
  } else {
    // Shift lightness away from the base so the pieces contrast instead of blending.
    const l = hsl.l < 50 ? clamp(hsl.l + 25, 0, 80) : clamp(hsl.l - 25, 20, 100);
    accentPicks = HUE_OFFSETS[scheme].map((offset) => hslToHex({ ...hsl, h: hsl.h + offset, l }));
  }

  const neutralPool = hsl.l >= 50 ? DARK_NEUTRALS : LIGHT_NEUTRALS;
  const neutralPicks = includeNeutrals
    ? neutralPool.filter((n) => n.type !== baseNeutral).map((n) => n.hex)
    : [];

  // Interleave accent and neutral picks so a short list still has variety.
  const merged = [];
  for (let i = 0; i < Math.max(accentPicks.length, neutralPicks.length); i += 1) {
    if (accentPicks[i]) merged.push(accentPicks[i]);
    if (neutralPicks[i]) merged.push(neutralPicks[i]);
  }

  return [...new Set(merged)].filter((c) => c !== base).slice(0, count);
}
