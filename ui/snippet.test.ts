/// <reference types="node" />
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import type { ComponentSchema } from '../src/extractor'
import { toJSX } from './snippet'
import { initialValues } from './values'

const fixtures: ComponentSchema[] = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'))
const button = fixtures.find((c) => c.displayName === 'Button')!
const card = fixtures.find((c) => c.displayName === 'Card')!
const children = { name: 'children', type: 'ReactNode', required: false, defaultValue: null, description: '' }

test('strings, bare booleans, required props always shown', () => {
  assert.equal(toJSX(button, { label: 'Hi', variant: 'secondary', disabled: true }), '<Button label="Hi" variant="secondary" disabled />')
  assert.equal(toJSX(button, initialValues(button.props)), '<Button label="label" />')
})

test('callbacks and default values are left out', () => {
  assert.equal(toJSX(button, { label: 'x', disabled: false, onClick: () => {} }), '<Button label="x" />')
  const numeric: ComponentSchema = { ...card, props: [{ name: 'n', type: 'number', required: false, defaultValue: '3', description: '' }] }
  assert.equal(toJSX(numeric, { n: 3 }), '<Card />')
  assert.equal(toJSX(numeric, { n: 4 }), '<Card n={4} />')
})

test('strings that need escaping become expressions', () => {
  assert.equal(toJSX(card, { title: 'a"b' }), '<Card title={"a\\"b"} />')
  assert.equal(toJSX(card, {}), '<Card />')
})

test('text children go between tags', () => {
  const c = { ...button, props: [...button.props, children] }
  assert.equal(toJSX(c, { label: 'Hi', children: 'Save' }), '<Button label="Hi">Save</Button>')
  assert.equal(toJSX(c, { label: 'Hi', children: 'a < b' }), '<Button label="Hi">{"a < b"}</Button>')
})
