'use strict';
// Sprint 28.4: fail CLOSED if a regression file or scenario is missing.
// Counts the 75 required top-level Playwright test(...) declarations.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const expected = {
  'profiles.spec.js': 7,
  'learning.spec.js': 7,
  'car-mode.spec.js': 6,
  'parent.spec.js': 4,
  'backup.spec.js': 4,
  'ui-offline.spec.js': 5,
  'ios-audio.spec.js': 8,
  'pwa-transfer.spec.js': 7,
  'dialogi-junior.spec.js': 8,
  'dialogue-stabilization.spec.js': 4,
  'scroll-ux.spec.js': 9,
  'invierno-body.spec.js': 6,
};
let total = 0;
for (const [filename, count] of Object.entries(expected)) {
  const full = path.join(root, 'tests', filename);
  if (!fs.existsSync(full)) throw new Error(`Missing mandatory test file: tests/${filename}`);
  const source = fs.readFileSync(full, 'utf8');
  const matches = source.match(/^\s*test\s*\(/gm) || [];
  if (matches.length !== count) {
    throw new Error(`tests/${filename}: expected ${count} tests, found ${matches.length}`);
  }
  total += matches.length;
  console.log(`tests/${filename}: ${count} scenarios`);
}
if (total !== 75) throw new Error(`Expected 75 tests, found ${total}`);
console.log(`PASS: all ${total} mandatory Playwright scenarios are defined.`);
