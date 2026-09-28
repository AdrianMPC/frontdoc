import type { ComponentSchema } from '../src/extractor'

export type Health = 'good' | 'partial' | 'none'

export function health(c: ComponentSchema): Health {
  const documented = c.props.filter((p) => p.description.trim()).length
  if (documented === c.props.length) return 'good'
  return documented ? 'partial' : 'none'
}
