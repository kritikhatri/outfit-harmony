# outfit-harmony

[![npm version](https://img.shields.io/npm/v/outfit-harmony.svg)](https://www.npmjs.com/package/outfit-harmony)
[![tests](https://github.com/kritikhatri/outfit-harmony/actions/workflows/test.yml/badge.svg)](https://github.com/kritikhatri/outfit-harmony/actions/workflows/test.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Check whether outfit colours go together, and get colours that match a piece you already own.
> Colour theory with **fashion-aware neutrals**. Zero dependencies.

```js
checkOutfit(['#1F3A5F', '#F5F5DC', '#C1440E']);
// → { score: 92, verdict: 'works', scheme: 'single-accent', ... }
```

## Why?

Wardrobe apps, outfit planners, e-commerce "complete the look" widgets and styling tools all need to answer the same question: **do these colours work together?**

Generic colour libraries can rotate hues and build palettes, but they don't know how people actually dress:

- **Neutrals go with almost everything.** Navy chinos, blue denim, a camel coat or a cream knit shouldn't count as a "colour" that has to harmonise with your red top. A plain hue-wheel check gets this wrong.
- **Two loud colours fighting is the real problem**, not the number of colours.
- **Contrast matters.** An outfit where every piece has the same lightness looks flat.

`outfit-harmony` wraps these rules in a small, tested API. I built it while working on [ClosetCloud](https://github.com/kritikhatri), a digital wardrobe app, where I needed this logic and couldn't find a package for it.

## Installation

```bash
npm install outfit-harmony
```

Requires Node.js 18.3 or later. The package is ESM-only (`import`, not `require`).

To use the CLI without installing:

```bash
npx outfit-harmony check "#1F3A5F" "#F5F5DC" "#C1440E"
```

## Quick start

```js
import { checkOutfit, suggestMatches } from 'outfit-harmony';

// navy trousers + beige shirt + rust jacket
const result = checkOutfit(['#1F3A5F', '#F5F5DC', '#C1440E']);

console.log(result.verdict);  // 'works'
console.log(result.score);    // 92
console.log(result.neutrals); // ['#1F3A5F', '#F5F5DC']  (navy, cream)
console.log(result.accents);  // ['#C1440E']

// What goes with my rust jacket?
suggestMatches('#C1440E');
// → ['#5EC6F3', '#F5F0E6', '#F3D55E']   (sky blue, cream, golden yellow)
```

A clashing outfit:

```js
checkOutfit(['#FF0000', '#00FF00']);
// → {
//   score: 35,
//   verdict: 'clashes',
//   scheme: 'custom',
//   clashes: [['#FF0000', '#00FF00']],
//   tips: [
//     'Some bright colours fight each other - mute one of them or swap it for a neutral.',
//     'Add a neutral piece (white, black, denim, camel) to ground the look.',
//     'Every piece has similar lightness - add something lighter or darker for contrast.'
//   ],
//   ...
// }
```

More examples are in [`examples/`](examples). Run them with `npm run example`.

## API

### `checkOutfit(colours, options?)`

Scores how well a set of colours work together as one outfit.

| Parameter | Type | Description |
|---|---|---|
| `colours` | `string[]` | 1–12 hex colours, one per piece. `#RGB`, `#RRGGBB`, with or without `#`, any case. |
| `options.extraNeutrals` | `string[]` | Optional. Colours you want treated as neutrals, e.g. olive (`'#808000'`) if it's a staple in your wardrobe. |

**Returns** an object:

| Field | Type | Description |
|---|---|---|
| `score` | `number` | 0–100. Higher is better. |
| `verdict` | `'works' \| 'risky' \| 'clashes'` | `works` ≥ 75, `risky` 55–74, `clashes` < 55. |
| `scheme` | `string` | Scheme formed by the **accent** colours: `neutral`, `single-accent`, `monochromatic`, `analogous`, `complementary`, `split-complementary`, `triadic` or `custom`. |
| `colours` | `object[]` | Each input as `{ hex, hsl: { h, s, l }, neutral }`. `neutral` is the neutral type (see below), `'custom'` for `extraNeutrals`, or `null` for accents. |
| `neutrals` | `string[]` | Normalised hex values detected as neutrals. |
| `accents` | `string[]` | Normalised hex values that are accent colours. |
| `clashes` | `[string, string][]` | Pairs of strong accents that fight each other. |
| `tips` | `string[]` | Human-readable advice for improving the outfit. Empty if there's nothing to fix. |

**Throws** `TypeError` if `colours` isn't an array or contains an invalid hex value (the message names the index, e.g. `colours[1]: Invalid hex colour: "nope"`), and `RangeError` if the array is empty or has more than 12 entries.

### `suggestMatches(colour, options?)`

Suggests colours that go with one piece.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `colour` | `string` | — | Hex colour of the piece you already have. |
| `options.scheme` | `string` | `'auto'` | `auto`, `complementary`, `analogous`, `triadic`, `split-complementary` or `monochromatic`. |
| `options.count` | `number` | `3` | Maximum number of suggestions, integer 1–10. |
| `options.includeNeutrals` | `boolean` | `true` | Mix neutral pieces into the suggestions. |

**Returns** `string[]`: hex colours, best first. Accent and neutral suggestions alternate so short lists still have variety. It may return fewer than `count` if the scheme doesn't produce enough colours (e.g. `complementary` with `includeNeutrals: false` gives 1).

If the base colour is itself a neutral (e.g. navy), hue maths isn't meaningful, so it suggests classic accents (burgundy, forest green, mustard) plus a different neutral.

**Throws** `TypeError` for an invalid colour and `RangeError` for an unknown scheme or out-of-range `count`.

### `neutralType(hex)` / `isNeutral(hex)`

```js
neutralType('#1F3A5F'); // 'navy'
neutralType('#C1440E'); // null (accent)
isNeutral('#5B7FA6');   // true (denim)
```

Returns one of `'black' | 'white' | 'grey' | 'cream' | 'navy' | 'denim' | 'camel' | 'brown'`, or `null`.

### Colour helpers

Also exported, in case they're useful on their own:

| Function | Returns |
|---|---|
| `normalizeHex(input)` | `'#RRGGBB'` (upper-case); throws `TypeError` if invalid |
| `hexToRgb(hex)` | `{ r, g, b }`, each 0–255 |
| `hexToHsl(hex)` | `{ h, s, l }`: h 0–359, s and l 0–100 |
| `hslToHex({ h, s, l })` | `'#RRGGBB'` |
| `hueDistance(a, b)` | Shortest distance between two hues, 0–180 |
| `detectScheme(hues)` | Scheme name for an array of accent hues |

Constants: `SCHEMES`, `SUGGEST_SCHEMES`, `NEUTRAL_TYPES`.

TypeScript types are included (`index.d.ts`).

## CLI

```bash
outfit-harmony check <colour> <colour> [...] [--neutral <hex>] [--json]
outfit-harmony suggest <colour> [--scheme <name>] [--count <n>] [--no-neutrals] [--json]
```

```
$ outfit-harmony check "#1F3A5F" F5F5DC "#C1440E"

Score: 92/100  ->  WORKS  (single-accent)

  #1F3A5F  neutral (navy)
  #F5F5DC  neutral (cream)
  #C1440E  accent
```

In a colour terminal each line also shows a swatch of the colour. Set `NO_COLOR=1` to turn swatches off. Quote values that start with `#`, or leave the `#` out.

## How it works

1. Each colour is converted to HSL and checked against **neutral rules**: very low chroma (black, white, greys, creams) plus hue/saturation/lightness ranges for navy, denim, camel and brown.
2. The remaining **accent** hues are placed on the colour wheel to detect a scheme (monochromatic ≤ 15° span, analogous ≤ 60°, complementary ~180°, triadic ~120° apart, and so on).
3. The score starts from the scheme's base value, then:
   - −15 for each **clash** (two accents with saturation ≥ 60% sitting 60°–150° apart, outside a triadic or split-complementary scheme)
   - −10 for each accent beyond three
   - −4 if there are two or more accents and no neutral
   - −8 if every piece has nearly the same lightness
   - +8 if all accents are muted (saturation < 40%), because muted tones blend more easily

## Limitations

- **Rule-based, not taste-based.** It applies classic colour theory. It doesn't know about trends, cultural meanings, or personal style.
- **Solid colours only.** Patterns, prints, textures and fabric sheen aren't considered. Pass a print's dominant colour.
- **Neutral detection is heuristic.** Borderline shades (olive, burgundy, khaki) may be classed as accents. Use `extraNeutrals` to override.
- **Hex input only.** No named colours (`'red'`), RGB strings or images.
- **ESM-only.** Use `import`. On Node 22+ `require()` of ESM also works.

## Development

```bash
git clone https://github.com/kritikhatri/outfit-harmony.git
cd outfit-harmony
npm test          # runs the node:test suite, no dependencies to install
npm run example
```

```
outfit-harmony/
├── src/
│   ├── index.js      # public exports
│   ├── harmony.js    # checkOutfit, suggestMatches, detectScheme
│   ├── neutral.js    # fashion-neutral detection
│   └── color.js      # hex / RGB / HSL helpers
├── bin/cli.js        # command-line interface
├── test/             # unit + CLI tests
├── examples/
└── index.d.ts        # TypeScript types
```

## Contributing

Issues and pull requests are welcome.

1. Fork the repo and create a branch: `git checkout -b feature/my-change`
2. Add or update tests in `test/` for your change
3. Make sure `npm test` passes
4. Open a pull request describing what you changed and why

Ideas for contributions: more neutral types (olive, burgundy, khaki), named-colour input, or a skin-tone / season palette helper.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](CHANGELOG.md) for release notes.

## License

[MIT](LICENSE) © Kritika Khatri
