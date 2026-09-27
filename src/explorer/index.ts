import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { createServer, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { scanDirectory, watchDirectory } from '../watcher'
import type { ComponentSchema } from '../extractor'

const ui = fileURLToPath(new URL('../ui', import.meta.url))

export async function startExplorer({ dir, port }: { dir: string; port: number }): Promise<void> {
  // Preview renders the user's components, so React must be the user's copy (one React → hooks work)
  const userRequire = createRequire(dir + '/')
  const alias = ['react-dom/client', 'react/jsx-dev-runtime', 'react/jsx-runtime', 'react-dom', 'react'].map((id) => ({
    find: new RegExp(`^${id}$`),
    replacement: userRequire.resolve(id),
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
      const all = (): ComponentSchema[] => [...schemas.values()].flat()
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
