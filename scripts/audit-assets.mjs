#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.argv[2] || 'photos';
const rawExtensions = new Set(['.arw', '.cr2', '.dng', '.nef', '.raf']);
const webUnfriendlyExtensions = new Set(['.heic', '.heif', '.arw', '.cr2', '.dng', '.nef', '.raf', '.zip']);

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.isFile()) {
      const info = await stat(fullPath);
      files.push({ path: fullPath, size: info.size, ext: path.extname(entry.name).toLowerCase() || '(none)' });
    }
  }
  return files;
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

const files = await walk(root);
const total = files.reduce((sum, file) => sum + file.size, 0);
const byExtension = new Map();
for (const file of files) {
  const current = byExtension.get(file.ext) || { count: 0, size: 0 };
  current.count += 1;
  current.size += file.size;
  byExtension.set(file.ext, current);
}

const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 25);
const webUnfriendly = files.filter(file => webUnfriendlyExtensions.has(file.ext));
const rawFiles = files.filter(file => rawExtensions.has(file.ext));

console.log(`Asset root: ${root}`);
console.log(`Files: ${files.length}`);
console.log(`Total size: ${formatBytes(total)}`);
console.log('');

console.log('By extension:');
for (const [ext, data] of [...byExtension.entries()].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`${ext.padEnd(8)} ${String(data.count).padStart(5)} files  ${formatBytes(data.size).padStart(8)}`);
}
console.log('');

console.log('Largest files:');
for (const file of largest) {
  console.log(`${formatBytes(file.size).padStart(8)}  ${file.path}`);
}
console.log('');

console.log(`Web-unfriendly files: ${webUnfriendly.length}`);
console.log(`Raw camera files: ${rawFiles.length}`);
if (webUnfriendly.length) {
  console.log('Run this audit before deploying and convert or remove these unless they are intentionally private source assets.');
}
