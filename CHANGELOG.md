# Changelog

All notable changes to this project are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-17

### Added
- `checkOutfit(colours, options)`: score, verdict, scheme, clashes and tips for a set of outfit colours
- `suggestMatches(colour, options)`: matching colours by scheme, with optional neutrals
- Fashion-aware neutral detection: black, white, grey, cream, navy, denim, camel, brown
- `extraNeutrals` option to treat your own staples as neutrals
- Colour helpers: `normalizeHex`, `hexToRgb`, `hexToHsl`, `hslToHex`, `hueDistance`, `detectScheme`
- `outfit-harmony` CLI with `check` and `suggest` commands and `--json` output
- TypeScript type definitions
