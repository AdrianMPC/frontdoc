import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'url'
import { extractComponents } from './extractComponents'

const fixture = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const app = (p: string) => fixture(`../__fixtures__/app/${p}`)

test('props: type, required, default, description, union options', () => {
  const [button] = extractComponents(fixture('__fixtures__/Button.tsx'))
  assert.equal(button.displayName, 'Button')
  assert.equal(button.description, 'A basic button component.')
  const byName = Object.fromEntries(button.props.map((p) => [p.name, p]))
  assert.deepEqual(byName.label, { name: 'label', type: 'string', required: true, defaultValue: null, description: 'The label displayed inside the button' })
  assert.deepEqual(byName.variant.options, ['primary', 'secondary', 'ghost'])
  assert.equal(byName.variant.defaultValue, 'primary')
  assert.equal(byName.disabled.type, 'boolean')
})

test('lowercase exports (utils, hooks) are not components', () => {
  assert.deepEqual(extractComponents(fixture('__fixtures__/utils.tsx')), [])
  assert.deepEqual(extractComponents(app('components/useThing.tsx')), [])
})

test('default exports are kept with exportName "default"', () => {
  const [stack] = extractComponents(app('components/Stack.tsx'))
  assert.equal(stack.exportName, 'default')
  assert.equal(stack.props[0].defaultValue, '8')
})

test("project tsconfig paths resolve imported types (keyof typeof via @/ alias)", () => {
  const [button] = extractComponents(app('components/Button.tsx'))
  const size = button.props.find((p) => p.name === 'size')!
  assert.deepEqual(size.options, ['sm', 'lg'])
  assert.ok(button.props.every((p) => p.type !== 'any'), 'no prop should fall back to any')
})

test('inherited children is kept, other HTML attributes are not', () => {
  const [button] = extractComponents(app('components/Button.tsx'))
  const names = button.props.map((p) => p.name)
  assert.ok(names.includes('children'))
  assert.ok(!names.includes('onClick') && !names.includes('className'))
})

test('re-exports from an index file are not listed twice', () => {
  assert.deepEqual(extractComponents(app('components/index.tsx')), [])
})

test('components inside an exported object are found by their own name', () => {
  const [item] = extractComponents(app('components/Pagination.tsx'))
  assert.equal(item.exportName, 'PaginationItem')
  assert.equal(item.props[0].name, 'page')
})

test('several files in one call', () => {
  const names = extractComponents([fixture('__fixtures__/Button.tsx'), fixture('__fixtures__/Card.tsx')]).map((c) => c.displayName)
  assert.deepEqual(names, ['Button', 'Card'])
})
