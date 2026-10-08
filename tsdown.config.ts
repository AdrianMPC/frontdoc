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
  shims: true,
  deps: {
    onlyBundle: ['react-docgen-typescript'],
    neverBundle: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  plugins: [
    {
      // TypeScript 7 (native) has no JS compiler API, which react-docgen-typescript needs.
      // frontdocs ships its own TypeScript 6: docgen is bundled and every import of
      // 'typescript' (ours and docgen's) points to @typescript/typescript6, whatever
      // TypeScript version (if any) the user's project has.
      name: 'frontdocs:typescript6',
      resolveId: (id) => (id === 'typescript' ? { id: '@typescript/typescript6', external: true } : null),
    },
  ],
})
