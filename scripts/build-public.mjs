#!/usr/bin/env node
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const indexPath = path.join(root, 'index.html');
const html = await readFile(indexPath, 'utf8');
const searchableHtml = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\/.*$/gm, '');

const assetPattern = /photos\/[^'"<>)]+/g;
const assets = [...new Set(searchableHtml.match(assetPattern) || [])].sort();

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await writeFile(path.join(dist, 'index.html'), html);

const rootAssets = ['favicon.svg'];
for (const asset of rootAssets) {
  try {
    await cp(path.join(root, asset), path.join(dist, asset));
  } catch {
    // Optional root assets should not block a deploy build.
  }
}

const copied = [];
const missing = [];
let totalBytes = 0;

for (const relativePath of assets) {
  const source = path.join(root, relativePath);
  const target = path.join(dist, relativePath);
  try {
    const info = await stat(source);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target);
    copied.push(relativePath);
    totalBytes += info.size;
  } catch {
    missing.push(relativePath);
  }
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

console.log(`Built dist/`);
console.log(`Copied assets: ${copied.length}`);
console.log(`Asset size: ${formatBytes(totalBytes)}`);
if (missing.length) {
  console.log('');
  console.log('Missing referenced assets:');
  for (const item of missing) console.log(`- ${item}`);
  process.exitCode = 1;
}
