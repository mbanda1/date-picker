import { copyFile } from 'node:fs/promises';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', headless: 'src/headless.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
  banner: { js: "'use client';" },
  onSuccess: () => copyFile('src/styles.css', 'dist/styles.css'),
});
