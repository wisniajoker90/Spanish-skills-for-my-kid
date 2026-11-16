'use strict';
// Release gate requires a COMPLETE clean run, not merely an exit code of 0.
const fs = require('node:fs');
const path = process.argv[2] || 'test-results/regression.json';
if (!fs.existsSync(path)) throw new Error(`Playwright JSON report missing: ${path}`);
const report = JSON.parse(fs.readFileSync(path, 'utf8'));
const stats = report.stats || {};
const counts = ['expected','skipped','unexpected','flaky'].map(k => stats[k]);
if (!counts.every(Number.isInteger)) throw new Error('Playwright JSON report does not expose expected, skipped, unexpected, flaky stats');
const [expected, skipped, unexpected, flaky] = counts;
console.log(`Playwright results: expected=${expected}, skipped=${skipped}, failed=${unexpected}, flaky=${flaky}`);
if (expected !== 33 || skipped !== 0 || unexpected !== 0 || flaky !== 0) {
  throw new Error('STOP: GitHub Pages must NOT deploy unless all 33 test cases passed cleanly.');
}
console.log('PASS: all 33 tests passed cleanly. Publishing may proceed if enabled.');
