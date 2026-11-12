import { rmSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import { defineConfig } from 'tsup';
import type { Options } from 'tsup';

rmSync('dist', { recursive: true, force: true });

const shared: Options = {
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  sourcemap: true,
  target: 'es2020',
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts', headless: 'src/headless.ts' },
    banner: { js: "'use client';" },
    onSuccess: () => copyFile('src/styles.css', 'dist/styles.css'),
  },
  {
    ...shared,
    entry: { core: 'src/core/index.ts' },
  },
]);
