// Run with: npm run example
import { checkOutfit, suggestMatches, neutralType } from '../src/index.js';

const outfits = {
  'Navy trousers, beige shirt, rust jacket': ['#1F3A5F', '#F5F5DC', '#C1440E'],
  'Red top with green skirt': ['#FF0000', '#00FF00'],
  'Coral top, peach scarf, white jeans': ['#E63946', '#F4A261', '#FFFFFF'],
  'Denim jacket, white tee, camel trousers, brown boots': ['#5B7FA6', '#FFFFFF', '#C19A6B', '#5C4033'],
};

console.log('--- checkOutfit ---\n');
for (const [name, colours] of Object.entries(outfits)) {
  const r = checkOutfit(colours);
  console.log(`${name}`);
  console.log(`  ${r.score}/100  ${r.verdict}  (${r.scheme})`);
  for (const tip of r.tips) console.log(`  tip: ${tip}`);
  console.log('');
}

console.log('--- suggestMatches ---\n');
console.log('Rust jacket (auto):        ', suggestMatches('#C1440E'));
console.log('Rust jacket (triadic, 2):  ', suggestMatches('#C1440E', { scheme: 'triadic', count: 2, includeNeutrals: false }));
console.log('Navy trousers (a neutral): ', suggestMatches('#1F3A5F'));

console.log('\n--- extraNeutrals ---\n');
const olive = '#808000';
console.log('Olive on its own is:', neutralType(olive) ?? 'an accent');
console.log('Olive + purple, default:        ', checkOutfit([olive, '#8A2BE2']).verdict);
console.log('Olive + purple, olive as neutral:', checkOutfit([olive, '#8A2BE2'], { extraNeutrals: [olive] }).verdict);
