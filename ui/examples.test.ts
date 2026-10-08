/// <reference types="node" />
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import type { ComponentSchema } from '../src/extractor'
import { examples } from './examples'

const fixtures: ComponentSchema[] = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'))
const button = fixtures.find((c) => c.displayName === 'Button')!
const opt = (name: string, options: string[]) => ({ name, type: '', required: false, defaultValue: null, description: '', options })

test('one example per union value, on top of the base values', () => {
  const ex = examples(button, { label: 'Hi', variant: 'primary' })
  assert.deepEqual(ex.map((e) => e.label), ['variant=primary', 'variant=secondary', 'variant=ghost'])
  assert.deepEqual(ex[1].props, { label: 'Hi', variant: 'secondary' })
})

test('cartesian product of several unions', () => {
  const grid = examples({ ...button, props: [opt('variant', ['a', 'b']), opt('size', ['sm', 'md', 'lg'])] }, {})
  assert.equal(grid.length, 6)
  assert.equal(grid[5].label, 'variant=b · size=lg')
})

test('capped at 16 examples', () => {
  const many = ['a', 'b', 'c', 'd', 'e']
  assert.equal(examples({ ...button, props: [opt('x', many), opt('y', many)] }, {}).length, 16)
})

test('no unions, no examples', () => {
  assert.deepEqual(examples({ ...button, props: [] }, {}), [])
})
