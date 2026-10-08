import type { ComponentSchema } from '../src/extractor'
import { initialValues, isTextChildren } from './values'

/** JSX usage for the current control values, e.g. `<Button label="Hi" disabled />` */
export function toJSX(c: ComponentSchema, values: Record<string, unknown>): string {
  const defaults = initialValues(c.props)
  const attrs: string[] = []
  let children = ''
  for (const prop of c.props) {
    const { name, type, required, defaultValue } = prop
    const value = values[name]
    if (isTextChildren(prop) && typeof value === 'string') {
      // text with JSX-special characters goes in an expression
      children = /[{}<>]/.test(value) ? `{${JSON.stringify(value)}}` : value
      continue
    }
    if (value === undefined || type.includes('=>')) continue
    // defaultValue check skips initialValues' placeholder for required strings
    if (!required && defaultValue != null && defaults[name] === value) continue
    if (value === true) attrs.push(name)
    else if (typeof value === 'string') {
      const s = JSON.stringify(value)
      // JSX attribute strings have no escapes; fall back to an expression when needed
      attrs.push(s.includes('\\') ? `${name}={${s}}` : `${name}=${s}`)
    } else attrs.push(`${name}={${JSON.stringify(value)}}`)
  }
  const open = `${c.displayName}${attrs.map((a) => ' ' + a).join('')}`
  return children ? `<${open}>${children}</${c.displayName}>` : `<${open} />`
}
