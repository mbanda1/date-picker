import { readFileSync } from 'node:fs';

const files = ['dist/core.mjs', 'dist/core.js'];
const problems = [];
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  if (/['"]use client['"]/.test(code)) problems.push(`${file} has a 'use client' directive`);
  const imports = [...code.matchAll(/(?:from\s+|require\()\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const bad = imports.filter(spec => spec !== 'date-fns' && !spec.startsWith('date-fns/'));
  if (bad.length) problems.push(`${file} imports ${[...new Set(bad)].join(', ')}`);
}
if (problems.length) {
  console.error(`dist/core must be framework-free:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('dist/core is framework-free');
