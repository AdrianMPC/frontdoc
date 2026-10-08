import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'url'
import { scanDirectory } from './index'

const fixtures = fileURLToPath(new URL('../extractor/__fixtures__', import.meta.url))

test('finds components, skips files without any', () => {
  const map = scanDirectory(fixtures)
  assert.deepEqual([...map.values()].flat().map((c) => c.displayName).sort(), ['Button', 'Card'])
  assert.ok(![...map.keys()].some((f) => f.endsWith('utils.tsx')))
})
