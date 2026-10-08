/// <reference types="node" />
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import type { ComponentSchema } from '../src/extractor'
import { health } from './health'

const fixtures: ComponentSchema[] = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'))
const button = fixtures.find((c) => c.displayName === 'Button')!
const blank = (c: ComponentSchema, n: number) => ({
  ...c,
  props: c.props.map((p, i) => (i < n ? { ...p, description: '' } : p)),
})

test('good / partial / none by documented props', () => {
  assert.equal(health(button), 'good')
  assert.equal(health(blank(button, 1)), 'partial')
  assert.equal(health(blank(button, button.props.length)), 'none')
})

test('no props counts as good', () => {
  assert.equal(health({ ...button, props: [] }), 'good')
})

test('undocumented children does not count', () => {
  const children = { name: 'children', type: 'ReactNode', required: false, defaultValue: null, description: '' }
  assert.equal(health({ ...button, props: [...button.props, children] }), 'good')
})
