/// <reference types="node" />
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { ComponentSchema } from '../src/extractor'
import { initialValues } from './values'

const fixtures: ComponentSchema[] = JSON.parse(
  readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8')
)
const button = fixtures.find((c) => c.displayName === 'Button')!

assert.deepEqual(initialValues(button.props), { label: 'label', variant: 'primary', disabled: false })

const p = (type: string, defaultValue: string | null, options?: (string | number)[]) => ({
  name: 'x', type, required: false, defaultValue, description: '', options,
})
assert.deepEqual(initialValues([p('number', '3')]), { x: 3 })
assert.deepEqual(initialValues([p('string', '"hi"')]), { x: 'hi' })
assert.deepEqual(initialValues([p('"a" | "b"', "'b'", ['a', 'b'])]), { x: 'b' })
assert.deepEqual(initialValues([p('1 | 2', '2', [1, 2])]), { x: 2 })
assert.deepEqual(initialValues([p('() => void', '() => {}')]), {})

console.log('values ok')
