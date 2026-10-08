import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'url'

const cli = fileURLToPath(new URL('./cli.ts', import.meta.url))
const run = (...args: string[]) => spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], { encoding: 'utf8' })

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
