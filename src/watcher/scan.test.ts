import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'url'
import type { ComponentSchema } from '../extractor'
import { scanDirectory, watchDirectory } from './index'

const fixtures = fileURLToPath(new URL('../extractor/__fixtures__', import.meta.url))
const app = fileURLToPath(new URL('../__fixtures__/app', import.meta.url))
const names = (map: Map<string, ComponentSchema[]>) => [...map.values()].flat().map((c) => c.displayName).sort()

test('finds components, skips files without any', () => {
  const map = scanDirectory(fixtures)
  assert.deepEqual(names(map), ['Button', 'Card'])
  assert.ok(![...map.keys()].some((f) => f.endsWith('utils.tsx')))
})

test('skips Next.js route files and re-exports', () => {
  const map = scanDirectory(app)
  assert.deepEqual(names(map), ['ApiBadge', 'Button', 'PaginationItem', 'Stack'])
  assert.ok(![...map.keys()].some((f) => /(page|layout|index)\.tsx$/.test(f)))
})

test('exclude globs (relative to the scanned folder) skip files', () => {
  assert.deepEqual(names(scanDirectory(app, ['components/Stack.tsx', '**/Api*.tsx'])), ['Button', 'PaginationItem'])
})

test('watchDirectory reports added, changed and deleted components', async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'frontdocs-watch-'))
  const events: [string, string[]][] = []
  const watcher = watchDirectory(dir, (file, schemas) => events.push([path.basename(file), schemas.flatMap((c) => c.props.map((p) => p.name))]))
  t.after(async () => {
    await watcher.close()
    rmSync(dir, { recursive: true, force: true })
  })
  await new Promise<void>((resolve) => watcher.once('ready', () => resolve()))
  const until = async (n: number) => {
    for (let i = 0; i < 100 && events.length < n; i++) await new Promise((r) => setTimeout(r, 100))
    assert.ok(events.length >= n, `expected ${n} watcher events, got ${JSON.stringify(events)}`)
  }

  const file = path.join(dir, 'Tag.tsx')
  writeFileSync(file, 'export const Tag = ({ text }: { text: string }) => <b>{text}</b>\n')
  await until(1)
  assert.deepEqual(events[0], ['Tag.tsx', ['text']])

  writeFileSync(file, 'export const Tag = ({ text, tone }: { text: string; tone?: string }) => <b>{text}{tone}</b>\n')
  await until(2)
  assert.deepEqual(events[events.length - 1], ['Tag.tsx', ['text', 'tone']])

  rmSync(file)
  await until(3)
  assert.deepEqual(events[events.length - 1], ['Tag.tsx', []])
})
