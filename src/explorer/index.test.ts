import assert from 'node:assert/strict'
import { createServer as createNetServer } from 'node:net'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'url'
import type { SchemasPayload } from '../extractor'
import { startExplorer } from './index'

const app = fileURLToPath(new URL('../__fixtures__/app', import.meta.url))

const freePort = () =>
  new Promise<number>((resolve) => {
    const s = createNetServer().listen(0, () => {
      const { port } = s.address() as { port: number }
      s.close(() => resolve(port))
    })
  })

// What the explorer page does: say hello over Vite's HMR socket, get the schemas back
const schemas = (port: number) =>
  new Promise<SchemasPayload>((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/`, 'vite-hmr')
    const timer = setTimeout(() => reject(new Error('no frontdocs:schemas message')), 15000)
    ws.onopen = () => ws.send(JSON.stringify({ type: 'custom', event: 'frontdocs:hello' }))
    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(String(data))
      if (msg.event !== 'frontdocs:schemas') return
      clearTimeout(timer)
      ws.close()
      resolve(msg.data)
    }
  })

test('explorer server: schemas over WebSocket, app CSS, env vars, aliases', async (t) => {
  const port = await freePort()
  const server = await startExplorer({ dir: app, port })
  t.after(() => server.close())
  const get = (url: string) => fetch(`http://localhost:${port}${url}`)

  const payload = await schemas(port)
  assert.equal(payload.root, app)
  assert.deepEqual(payload.components.map((c) => c.displayName).sort(), ['ApiBadge', 'Button', 'PaginationItem', 'Stack'])

  assert.equal((await get('/')).status, 200)
  assert.equal((await get('/preview.html')).status, 200)

  const styles = await (await get('/@id/virtual:frontdocs-styles')).text()
  assert.match(styles, /globals\.css/, 'previews import the app global CSS from app/layout.tsx')

  // In dev, Vite sets `define` values as globals from /@vite/env (loaded by every page)
  const env = await (await get('/@vite/env')).text()
  assert.match(env, /process\.env\.NEXT_PUBLIC_API_URL/, 'public env vars from .env are defined')
  assert.match(env, /https:\/\/api\.example\.test/)

  const button = await get(`/@fs${app}/components/Button.tsx`)
  assert.equal(button.status, 200, 'the @/ alias resolves when the preview loads a component')
  assert.doesNotMatch(await button.text(), /Failed to resolve import/)
})

test('explorer server: css and exclude options override the defaults', async (t) => {
  const port = await freePort()
  const custom = path.join(app, 'app', 'globals.css')
  const server = await startExplorer({ dir: app, port, css: [custom], exclude: ['components/Stack.tsx'] })
  t.after(() => server.close())

  const payload = await schemas(port)
  assert.ok(!payload.components.some((c) => c.displayName === 'Stack'), 'excluded file is not scanned')
  const styles = await (await fetch(`http://localhost:${port}/@id/virtual:frontdocs-styles`)).text()
  // Vite serves the import with forward slashes on every OS (/@fs/D:/... on Windows)
  assert.ok(styles.includes(custom.split(path.sep).join('/')), `custom CSS is imported: ${styles}`)
})
