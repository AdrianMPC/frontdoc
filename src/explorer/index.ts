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
import { createServer, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { scanDirectory, watchDirectory } from '../watcher'
import type { SchemasPayload } from '../extractor'

const ui = fileURLToPath(new URL('../ui', import.meta.url))

export async function startExplorer({ dir, port }: { dir: string; port: number }): Promise<void> {
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

  const server = await createServer({
    root: ui,
    configFile: false,
    server: { port, fs: { allow: [dir, ui] } },
    resolve: { alias },
    plugins: [react(), frontdocs(dir)],
  })
  await server.listen()
  server.printUrls()
}

function frontdocs(dir: string): Plugin {
  return {
    name: 'frontdocs',
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
