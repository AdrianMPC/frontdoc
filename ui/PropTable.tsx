import type { PropSchema } from '../src/extractor'
import './table-controls.css'

/** "(() => void)" → "() => void"; leaves "(a) | (b)" alone */
function formatType(type: string): string {
  if (!type.startsWith('(') || !type.endsWith(')')) return type
  let depth = 0
  for (let i = 0; i < type.length - 1; i++) {
    if (type[i] === '(') depth++
    else if (type[i] === ')' && --depth === 0) return type
  }
  return type.slice(1, -1)
}

export function PropTable({ props }: { props: PropSchema[] }) {
  return (
    <table className="prop-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Required</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {props.map((prop) => (
          <tr key={prop.name} className={prop.description ? undefined : 'missing-doc'}>
            <td><code>{prop.name}</code></td>
            <td><code>{formatType(prop.type)}</code></td>
            <td>{prop.required ? 'yes' : 'no'}</td>
            <td>{prop.defaultValue == null ? '—' : <code>{prop.defaultValue}</code>}</td>
            <td>{prop.description || 'Missing description'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
