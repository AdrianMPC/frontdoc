import type { ComponentSchema } from '../src/extractor'

export interface Example {
  label: string
  props: Record<string, unknown>
}

const MAX_EXAMPLES = 16

/** One example per combination of union prop values (variant × size …), on top of `base`. */
export function examples(c: ComponentSchema, base: Record<string, unknown>): Example[] {
  const unions = c.props.filter((p) => p.options?.length)
  if (!unions.length) return []
  let combos: [string, unknown][][] = [[]]
  for (const p of unions) combos = combos.flatMap((combo) => p.options!.map((o) => [...combo, [p.name, o] as [string, unknown]]))
  return combos.slice(0, MAX_EXAMPLES).map((combo) => ({
    label: combo.map(([k, v]) => `${k}=${v}`).join(' · '),
    props: { ...base, ...Object.fromEntries(combo) },
  }))
}
