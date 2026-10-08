import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { loadConfig } from './config'

const tempDir = (t: { after: (fn: () => void) => void }) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'frontdocs-config-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test('no config file → empty config', async (t) => {
  assert.deepEqual(await loadConfig(tempDir(t)), { config: {} })
})

test('TypeScript config is loaded; paths resolved from its folder', async (t) => {
  const dir = tempDir(t)
  writeFileSync(
    path.join(dir, 'frontdocs.config.ts'),
    `const port: number = 4000\nexport default { dir: 'src', port, css: ['src/styles/global.css'], exclude: ['**/*.stories.tsx'], envPrefix: ['PUBLIC_'] }\n`
  )
  const { config, file } = await loadConfig(dir)
  assert.equal(file, path.join(dir, 'frontdocs.config.ts'))
  assert.deepEqual(config, {
    dir: path.join(dir, 'src'),
    port: 4000,
    css: [path.join(dir, 'src/styles/global.css')],
    exclude: ['**/*.stories.tsx'],
    envPrefix: ['PUBLIC_'],
  })
})

test('unknown options and wrong types are reported clearly', async (t) => {
  const dir = tempDir(t)
  writeFileSync(path.join(dir, 'frontdocs.config.mjs'), `export default { cssFiles: ['a.css'] }\n`)
  await assert.rejects(loadConfig(dir), /frontdocs\.config\.mjs: unknown option 'cssFiles'/)
  writeFileSync(path.join(dir, 'frontdocs.config.mjs'), `export default { css: 'a.css' }\n`)
  await assert.rejects(loadConfig(dir), /'css' must be an array of strings/)
})
