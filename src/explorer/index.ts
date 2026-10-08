/**
 * The explorer server: a Vite dev server that serves the UI in ../ui.
 *
 * - The UI ships as source in the package; Vite compiles it (and the user's
 *   components) on the fly.
 * - React is resolved from the user's project, not from frontdocs, so the preview
 *   and the user's components share one React instance (two copies break hooks).
 * - Component data travels over Vite's own HMR WebSocket: the page sends
 *   `frontdocs:hello`, the server answers with `frontdocs:schemas` ({ root, components })
 *   and sends it again whenever the watcher sees a change.
 * - Edits to a component re-render its preview through Vite's normal hot reload;
 *   the watcher only has to refresh the prop data.
 */
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { createServer, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { scanDirectory, watchDirectory } from '../watcher'
import type { SchemasPayload } from '../extractor'

// The UI ships next to dist/ in the package; walk up so this also works when run from src/ (tests)
const ui = (() => {
  for (let d = path.dirname(fileURLToPath(import.meta.url)); ; d = path.dirname(d)) {
    if (existsSync(path.join(d, 'ui', 'index.html'))) return path.join(d, 'ui')
    if (d === path.dirname(d)) throw new Error('frontdocs: ui/ folder not found next to the package')
  }
})()

export async function startExplorer({ dir, port }: { dir: string; port: number }): Promise<ViteDevServer> {
  // Preview renders the user's components, so React must be the user's copy (one React → hooks work)
  const userRequire = createRequire(dir + '/')
  const resolveFromProject = (id: string) => {
    try {
      return userRequire.resolve(id)
    } catch {
      throw new Error(`couldn't find ${id} from ${dir}. Run frontdocs inside a React project (react and react-dom installed).`)
    }
  }
  const alias = ['react-dom/client', 'react/jsx-dev-runtime', 'react/jsx-runtime', 'react-dom', 'react'].map((id) => ({
    find: new RegExp(`^${id}$`),
    replacement: resolveFromProject(id),
  }))

  // Next/CRA-style code reads process.env.* in the browser; expose the project's public env
  // vars (and NODE_ENV) the way those tools do, so components don't crash on `process`.
  const root = projectRoot(dir)
  const env = loadEnv('development', root, ['NEXT_PUBLIC_', 'VITE_', 'REACT_APP_'])
  const styles = globalStyles(root)

  const server = await createServer({
    root: ui,
    configFile: false,
    // Browser console errors from previews (e.g. components missing a provider) stay in the browser
    server: { port, fs: { allow: [root, dir, ui] }, forwardConsole: false },
    // PostCSS config (e.g. Tailwind) comes from the user's project, not from frontdocs
    css: { postcss: root },
    // Pre-scan the user's components so Vite optimizes their dependencies once at startup,
    // instead of discovering them while browsing and reloading the page each time
    optimizeDeps: { entries: ['*.html', `${path.relative(ui, dir)}/**/*.tsx`, '!**/node_modules/**'] },
    resolve: { alias, tsconfigPaths: true },
    // One key per variable: Vite only replaces exact `process.env.X` expressions, not a whole object
    define: Object.fromEntries(
      Object.entries({ NODE_ENV: 'development', ...env }).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
    ),
    plugins: [react(), frontdocs(dir, styles)],
  })
  await server.listen()
  server.printUrls()
  return server
}

function frontdocs(dir: string, styles: string[]): Plugin {
  return {
    name: 'frontdocs',
    // virtual:frontdocs-styles = the app's global CSS, imported by every preview
    resolveId: (id) => (id === 'virtual:frontdocs-styles' ? '\0frontdocs-styles' : null),
    load: (id) => (id === '\0frontdocs-styles' ? styles.map((f) => `import ${JSON.stringify(f)}`).join('\n') : null),
    configureServer(server) {
      const schemas = scanDirectory(dir)
      const all = (): SchemasPayload => ({ root: dir, components: [...schemas.values()].flat() })
      server.ws.on('frontdocs:hello', (_data, client) => client.send('frontdocs:schemas', all()))
      const watcher = watchDirectory(dir, (file, next) => {
        if (next.length) schemas.set(file, next)
        else schemas.delete(file)
        server.ws.send('frontdocs:schemas', all())
      })
      server.httpServer?.on('close', () => watcher.close())
    },
  }
}

/** Nearest folder at or above `dir` with a package.json (where .env files live); `dir` if none. */
function projectRoot(dir: string): string {
  for (let d = dir; ; d = path.dirname(d)) {
    if (existsSync(path.join(d, 'package.json'))) return d
    if (d === path.dirname(d)) return dir
  }
}

// Where apps import their global CSS (Tailwind, resets, theme): Next app/pages router, Vite, CRA
const STYLE_ENTRIES = ['app/layout.tsx', 'pages/_app.tsx', 'main.tsx', 'index.tsx', 'App.tsx']

/** CSS files imported by the app's entry files, so previews look like the real app. */
function globalStyles(root: string): string[] {
  const files = new Set<string>()
  for (const entry of STYLE_ENTRIES.flatMap((e) => [path.join(root, e), path.join(root, 'src', e)])) {
    if (!existsSync(entry)) continue
    for (const [, spec] of readFileSync(entry, 'utf8').matchAll(/^\s*import\s+['"]([^'"]+\.css)['"]/gm)) {
      // relative imports only; package CSS (e.g. 'some-lib/styles.css') resolves through the app's own CSS
      if (spec.startsWith('.')) files.add(path.resolve(path.dirname(entry), spec))
    }
  }
  return [...files]
}
