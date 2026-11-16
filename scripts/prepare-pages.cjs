'use strict';
// Sprint 28.4: stage ONLY the existing, approved PWA assets. No test scripts,
// backup JSON, development files, reports, or hidden repository contents.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(process.env.FRANKA_SITE_ROOT || path.join(__dirname, '..'));
const destination = path.resolve(process.env.PAGES_BUILD_DIR || path.join(root, 'pages-dist'));
const requiredFiles = ['index.html', 'sw.js', 'manifest.webmanifest'];
function fail(message) { throw new Error(`Pages artifact validation failed: ${message}`); }
function copyRequired(relative) {
  const source = path.join(root, relative);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) fail(`required file missing: ${relative}`);
  const target = path.join(destination, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  if (!fs.readFileSync(source).equals(fs.readFileSync(target))) fail(`bytes changed: ${relative}`);
}
if (destination === root || root.startsWith(destination + path.sep) || destination.startsWith(path.join(root, 'icons') + path.sep)) {
  fail('unsafe output directory');
}
const iconDir = path.join(root, 'icons');
if (!fs.existsSync(iconDir) || !fs.statSync(iconDir).isDirectory()) fail('icons/ directory is missing');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!/rel=["']manifest["']/.test(html) || !html.includes('manifest.webmanifest')) fail('index.html has no expected PWA manifest');
if (!html.includes('sw.js')) fail('index.html has no expected Service Worker registration');
let manifest;
try { manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8')); }
catch(e) { fail(`invalid manifest.webmanifest: ${e.message}`); }
if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) fail('manifest has no icons');
for (const icon of manifest.icons) {
  const sourcePath = typeof icon.src === 'string' ? icon.src.replace(/^\.\//, '') : '';
  if (!/^icons\/[a-zA-Z0-9_./-]+$/.test(sourcePath) || sourcePath.includes('..')) fail(`unexpected manifest icon: ${sourcePath}`);
  const diskPath = path.resolve(root, sourcePath);
  if (!diskPath.startsWith(iconDir + path.sep) || !fs.existsSync(diskPath)) fail(`manifest icon missing: ${sourcePath}`);
}
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
for (const file of requiredFiles) copyRequired(file);
// Do not copy symlinks that could reach outside icons/.
function rejectSymlinks(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) fail(`symbolic link in icons/: ${entry.name}`);
    if (entry.isDirectory()) rejectSymlinks(path.join(dir, entry.name));
  }
}
rejectSymlinks(iconDir);
fs.cpSync(iconDir, path.join(destination, 'icons'), { recursive: true });
for (const optional of ['CNAME']) if (fs.existsSync(path.join(root, optional))) copyRequired(optional);
const originalHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'index.html'))).digest('hex');
const stagedHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(destination, 'index.html'))).digest('hex');
if (originalHash !== stagedHash) fail('index.html integrity mismatch');
console.log(`PASS: isolated PWA staged at ${destination}`);
console.log(`PASS: index.html SHA-256 identical (${originalHash})`);
console.log('Deployed assets: index.html, sw.js, manifest.webmanifest, icons/ and optional CNAME only.');
