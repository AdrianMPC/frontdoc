// Package smoke test: packs frontdocs, installs it into a throwaway React app and
// checks the explorer serves the right schemas with no TypeScript, TypeScript 5 and
// TypeScript 7 (native, no JS API) in the app. Run after `npm run build`.
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const repo = join(import.meta.dirname, '..')
const tmp = mkdtempSync(join(tmpdir(), 'frontdocs-smoke-'))

const ok = (msg) => console.log(`ok   ${msg}`)
function check(cond, msg, got) {
  if (!cond) throw new Error(got === undefined ? msg : `${msg} (got ${JSON.stringify(got)})`)
  ok(msg)
}
function run(cmd, args, cwd) {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe' })
  } catch (err) {
    throw new Error(`${cmd} ${args.join(' ')} failed:\n${err.stderr || err.stdout || err.message}`)
  }
}

function checkDist() {
  const dist = join(repo, 'dist')
  for (const file of readdirSync(dist).filter((f) => /\.(mjs|cjs)$/.test(f))) {
    const code = readFileSync(join(dist, file), 'utf8')
    check(!/(require\(|from\s*)["']typescript["']/.test(code), `dist/${file} does not import 'typescript'`)
    check(!/(require\(|from\s*)["']react-docgen-typescript["']/.test(code), `dist/${file} bundles react-docgen-typescript`)
  }
}

function createApp(tarball) {
  const app = join(tmp, 'app')
  mkdirSync(join(app, 'src'), { recursive: true })
  writeFileSync(join(app, 'package.json'), JSON.stringify({
    name: 'smoke-app', private: true, type: 'module',
    dependencies: { react: '^19', 'react-dom': '^19', frontdocs: `file:${tarball}` },
  }, null, 2))
  writeFileSync(join(app, 'src/Button.tsx'), `
export interface ButtonProps {
  /** Text inside the button */
  label: string
  /** Visual style */
  variant?: 'primary' | 'secondary'
}

/** A button. */
export function Button({ label, variant = 'primary' }: ButtonProps) {
  return <button className={variant}>{label}</button>
}
`)
  writeFileSync(join(app, 'src/utils.tsx'), `export function formatLabel(label: string) { return label.trim() }\n`)
  run('npm', ['install', '--no-audit', '--no-fund'], app)
  return app
}

function freePort() {
  return new Promise((resolve) => {
    const srv = createServer().listen(0, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

function waitFor(child, text, ms) {
  return new Promise((resolve, reject) => {
    let out = ''
    const timer = setTimeout(() => reject(new Error(`no '${text}' after ${ms / 1000}s. Output:\n${out}`)), ms)
    const onData = (chunk) => {
      out += chunk.toString().replace(/\x1b\[[0-9;]*m/g, '')
      if (out.includes(text)) { clearTimeout(timer); resolve() }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`frontdocs exited (${code}). Output:\n${out}`)) })
  })
}

function fetchSchemas(port) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/`, 'vite-hmr')
    const timer = setTimeout(() => { ws.close(); reject(new Error('no frontdocs:schemas over WebSocket after 30s')) }, 30_000)
    ws.onerror = () => { clearTimeout(timer); reject(new Error('WebSocket connection failed')) }
    ws.onopen = () => ws.send(JSON.stringify({ type: 'custom', event: 'frontdocs:hello' }))
    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data)
      if (msg.type !== 'custom' || msg.event !== 'frontdocs:schemas') return
      clearTimeout(timer)
      ws.close()
      resolve(msg.data)
    }
  })
}

async function checkExplorer(app, variant) {
  const port = await freePort()
  // detached → own process group, so killing it also kills the node process npx starts
  const child = spawn('npx', ['--no-install', 'frontdocs', 'dev', 'src', '--port', String(port)], { cwd: app, detached: true })
  try {
    await waitFor(child, 'Local:', 60_000)
    ok(`[${variant}] explorer started on port ${port}`)
    const { components } = await fetchSchemas(port)
    const names = components.map((c) => c.displayName)
    check(JSON.stringify(names) === '["Button"]', `[${variant}] components are ['Button']`, names)
    const variantProp = components[0].props.find((p) => p.name === 'variant')
    check(JSON.stringify(variantProp?.options) === '["primary","secondary"]', `[${variant}] variant has options [primary, secondary]`, variantProp?.options)
    check(variantProp?.defaultValue?.replace(/^['"]|['"]$/g, '') === 'primary', `[${variant}] variant default is 'primary'`, variantProp?.defaultValue)
    for (const path of ['/', '/preview.html']) {
      const res = await fetch(`http://localhost:${port}${path}`)
      check(res.status === 200, `[${variant}] GET ${path} → 200`, res.status)
    }
  } finally {
    child.removeAllListeners('exit')
    try { process.kill(-child.pid, 'SIGTERM') } catch {}
  }
}

const start = Date.now()
try {
  checkDist()
  const tarball = join(tmp, JSON.parse(run('npm', ['pack', '--json', '--pack-destination', tmp], repo))[0].filename)
  ok(`packed ${tarball}`)
  const app = createApp(tarball)
  ok('created React app and installed frontdocs')

  await checkExplorer(app, 'no typescript')
  for (const ts of ['typescript@5', 'typescript@7']) {
    run('npm', ['install', '--no-audit', '--no-fund', '-D', ts], app)
    const version = JSON.parse(readFileSync(join(app, 'node_modules/typescript/package.json'), 'utf8')).version
    ok(`installed typescript ${version}`)
    await checkExplorer(app, ts)
  }
  console.log(`\nsmoke passed in ${((Date.now() - start) / 1000).toFixed(1)}s`)
} catch (err) {
  console.error(`FAIL ${err.message}`)
  process.exitCode = 1
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
