#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { checkOutfit, suggestMatches, hexToRgb, SUGGEST_SCHEMES } from '../src/index.js';

const HELP = `outfit-harmony - check whether outfit colours go together

Usage:
  outfit-harmony check <colour> <colour> [...] [--neutral <hex>] [--json]
  outfit-harmony suggest <colour> [--scheme <name>] [--count <n>] [--no-neutrals] [--json]

Colours are hex values, with or without "#" (quote them in your shell: "#1F3A5F").

Options:
  --neutral <hex>   treat this colour as a neutral (repeatable)
  --scheme <name>   ${SUGGEST_SCHEMES.join(' | ')} (default: auto)
  --count <n>       number of suggestions, 1-10 (default: 3)
  --no-neutrals     only suggest accent colours
  --json            print raw JSON
  -h, --help        show this help
  -v, --version     show version
`;

const useColour = process.stdout.isTTY && !process.env.NO_COLOR;

function swatch(hex) {
  if (!useColour) return hex;
  const { r, g, b } = hexToRgb(hex);
  return `\x1b[48;2;${r};${g};${b}m    \x1b[0m ${hex}`;
}

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      neutral: { type: 'string', multiple: true },
      scheme: { type: 'string', default: 'auto' },
      count: { type: 'string', default: '3' },
      'no-neutrals': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
  });

  if (values.version) {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    console.log(pkg.version);
    return 0;
  }

  const [command, ...colours] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return values.help ? 0 : 1;
  }

  if (command === 'check') {
    if (colours.length === 0) throw new Error('check needs at least one colour');
    const result = checkOutfit(colours, { extraNeutrals: values.neutral ?? [] });
    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }
    console.log(`\nScore: ${result.score}/100  ->  ${result.verdict.toUpperCase()}  (${result.scheme})\n`);
    for (const c of result.colours) {
      console.log(`  ${swatch(c.hex)}  ${c.neutral ? `neutral (${c.neutral})` : 'accent'}`);
    }
    for (const [a, b] of result.clashes) console.log(`\n  clash: ${a} + ${b}`);
    if (result.tips.length) console.log('');
    for (const tip of result.tips) console.log(`  tip: ${tip}`);
    console.log('');
    return 0;
  }

  if (command === 'suggest') {
    if (colours.length !== 1) throw new Error('suggest needs exactly one colour');
    const count = Number(values.count);
    const result = suggestMatches(colours[0], {
      scheme: values.scheme,
      count,
      includeNeutrals: !values['no-neutrals'],
    });
    if (values.json) {
      console.log(JSON.stringify(result));
      return 0;
    }
    console.log(`\nGoes with ${swatch(colours[0].startsWith('#') ? colours[0].toUpperCase() : `#${colours[0].toUpperCase()}`)}:\n`);
    for (const hex of result) console.log(`  ${swatch(hex)}`);
    console.log('');
    return 0;
  }

  throw new Error(`Unknown command "${command}". Run outfit-harmony --help`);
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exitCode = 1;
}
