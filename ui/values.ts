import type { PropSchema } from '../src/extractor'

/** Parses docgen's string defaults into control values; props without a usable default are omitted. */
export function initialValues(props: PropSchema[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const { name, type, required, defaultValue, options } of props) {
    // Required props without a default get a placeholder so previews aren't empty (string → its name)
    if (defaultValue == null && required) {
      if (type === 'string') values[name] = name
      else if (type === 'number') values[name] = 1
      else if (type === 'boolean') values[name] = false
      else if (options?.length) values[name] = options[0]
    }
    if (defaultValue == null) continue
    const raw = defaultValue.replace(/^(['"`])(.*)\1$/, '$2')
    if (options) {
      // Keep the option's original value so numeric literals stay numbers
      const match = options.find((o) => String(o) === raw)
      if (match !== undefined) values[name] = match
    } else if (type === 'boolean') {
      if (raw === 'true' || raw === 'false') values[name] = raw === 'true'
    } else if (type === 'number') {
      if (raw.trim() !== '' && !Number.isNaN(Number(raw))) values[name] = Number(raw)
    } else if (type === 'string') {
      values[name] = raw
    }
  }
  return values
}
