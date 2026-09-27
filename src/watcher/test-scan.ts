import assert from 'node:assert'
import { fileURLToPath } from 'url'
import { scanDirectory } from './index'

const map = scanDirectory(fileURLToPath(new URL('../extractor/__fixtures__', import.meta.url)))
const names = [...map.values()].flat().map((c) => c.displayName).sort()
assert.deepStrictEqual(names, ['Button', 'Card'])
assert.ok(![...map.keys()].some((f) => f.endsWith('utils.tsx')))
console.log('scan ok:', names)
