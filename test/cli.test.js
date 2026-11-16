import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../bin/cli.js', import.meta.url));
const run = (...args) =>
  spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });

test('check --json prints the checkOutfit result', () => {
  const r = run('check', '#1F3A5F', 'F5F5DC', '#C1440E', '--json');
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.verdict, 'works');
  assert.equal(out.scheme, 'single-accent');
});

test('check prints a readable summary', () => {
  const r = run('check', '#FF0000', '#00FF00');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /CLASHES/);
  assert.match(r.stdout, /tip:/);
});

test('suggest --json returns an array', () => {
  const r = run('suggest', '#C1440E', '--count', '2', '--json');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).length, 2);
});

test('--neutral is passed through as extraNeutrals', () => {
  const r = run('check', '#808000', '#C1440E', '--neutral', '#808000', '--json');
  assert.deepEqual(JSON.parse(r.stdout).accents, ['#C1440E']);
});

test('bad input exits 1 with an error message', () => {
  const r = run('check', 'banana');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /error: .*Invalid hex colour/);
});

test('--version prints the package version', () => {
  const r = run('--version');
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/);
});
