import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'url'

const cli = fileURLToPath(new URL('./cli.ts', import.meta.url))
const run = (...args: string[]) => runIn(process.cwd(), ...args)
// tsx by absolute URL, so it loads even when the test runs the CLI from a temp folder
const tsx = import.meta.resolve('tsx')
const runIn = (cwd: string, ...args: string[]) => spawnSync(process.execPath, ['--import', tsx, cli, ...args], { encoding: 'utf8', cwd })

test('missing or unknown command → usage, exit 1', () => {
  for (const args of [[], ['build']]) {
    const r = run(...args)
    assert.equal(r.status, 1)
    assert.match(r.stderr, /Usage: frontdocs dev \[dir\]/)
  }
})

test('folder that does not exist → friendly error, exit 1', () => {
  const r = run('dev', 'definitely-not-here')
  assert.equal(r.status, 1)
  assert.match(r.stderr, /'definitely-not-here' is not a directory/)
})

test('invalid port → friendly error, exit 1', () => {
  for (const port of ['abc', '70000', '-1']) {
    const r = run('dev', '.', `--port=${port}`)
    assert.equal(r.status, 1)
    assert.match(r.stderr, /invalid port/)
  }
})

test('frontdocs.config.ts is used, and CLI arguments win over it', (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'frontdocs-cli-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(path.join(dir, 'frontdocs.config.ts'), `export default { dir: 'components', port: 99999, css: ['missing.css'] }\n`)

  let r = runIn(dir, 'dev')
  assert.equal(r.status, 1)
  assert.match(r.stdout, /using frontdocs\.config\.ts/)
  assert.match(r.stderr, /'components' is not a directory/, 'dir comes from the config')

  r = runIn(dir, 'dev', '.')
  assert.match(r.stderr, /invalid port '99999'/, 'port comes from the config')

  r = runIn(dir, 'dev', '.', '--port=4321')
  assert.match(r.stderr, /css file 'missing.css' not found/, 'the --port flag overrides the config')

  writeFileSync(path.join(dir, 'frontdocs.config.ts'), `export default { colour: 'red' }\n`)
  r = runIn(dir, 'dev', '.')
  assert.equal(r.status, 1)
  assert.match(r.stderr, /unknown option 'colour'/)
})
