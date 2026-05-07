import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['cjs', 'esm'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs'
    }
  },
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ['react', 'react-dom'],
  target: 'es2020',
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.jsxImportSource = 'react';
  },
});