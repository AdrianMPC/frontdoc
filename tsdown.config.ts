import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli:   'src/cli.ts',
  },
  format: ['esm', 'cjs'],
  platform: 'node',
  dts: true,
  clean: true,
  deps: {
    neverBundle: ['react', 'react-dom', 'react/jsx-runtime', 'typescript'],
  },
  
})

