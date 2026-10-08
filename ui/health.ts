import type { ComponentSchema } from '../src/extractor'

export type Health = 'good' | 'partial' | 'none'

export function health(c: ComponentSchema): Health {
  // `children` is self-explanatory and rarely documented; it doesn't count
  const props = c.props.filter((p) => p.name !== 'children')
  const documented = props.filter((p) => p.description.trim()).length
  if (documented === props.length) return 'good'
  return documented ? 'partial' : 'none'
}
