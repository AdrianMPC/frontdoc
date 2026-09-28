/// <reference types="node" />
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { ComponentSchema } from '../src/extractor'
import { toJSX } from './snippet'
import { initialValues } from './values'

const fixtures: ComponentSchema[] = JSON.parse(
  readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8')
)
const button = fixtures.find((c) => c.displayName === 'Button')!
const card = fixtures.find((c) => c.displayName === 'Card')!

assert.equal(
  toJSX(button, { label: 'Hi', variant: 'secondary', disabled: true }),
  '<Button label="Hi" variant="secondary" disabled />'
)
assert.equal(toJSX(button, initialValues(button.props)), '<Button label="label" />')
assert.equal(toJSX(button, { label: 'x', disabled: false, onClick: () => {} }), '<Button label="x" />')
assert.equal(toJSX(card, { title: 'a"b' }), '<Card title={"a\\"b"} />')
assert.equal(toJSX(card, {}), '<Card />')

const numeric: ComponentSchema = {
  ...card,
  props: [{ name: 'n', type: 'number', required: false, defaultValue: '3', description: '' }],
}
assert.equal(toJSX(numeric, { n: 3 }), '<Card />')
assert.equal(toJSX(numeric, { n: 4 }), '<Card n={4} />')

console.log('snippet ok')
