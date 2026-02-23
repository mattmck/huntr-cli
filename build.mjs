#!/usr/bin/env node
import { build } from 'esbuild';
import { rmSync } from 'fs';

// Clean dist directory
rmSync('dist', { recursive: true, force: true });

// Build CLI with esbuild
await build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/cli.js',
  packages: 'external', // Don't bundle node_modules
  sourcemap: true,
  minify: false,
}).catch(() => process.exit(1));

console.log('✓ Build complete');
