import type { PropSchema } from '../src/extractor'
import './table-controls.css'

interface ControlsProps {
  props: PropSchema[]
  values: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
}

export function Controls({ props, values, onChange }: ControlsProps) {
  return (
    <div className="controls">
      {props.map((prop) => (
        <div key={prop.name} className="control">
          <Control prop={prop} value={values[prop.name]} onChange={(v) => onChange(prop.name, v)} />
        </div>
      ))}
    </div>
  )
}

function Control({ prop, value, onChange }: {
  prop: PropSchema
  value: unknown
  onChange: (value: unknown) => void
}) {
  const { name, type, options } = prop

  if (options) {
    // Option index as the DOM value, so the original (possibly numeric) value is emitted
    const index = options.findIndex((o) => o === value)
    return (
      <label>
        <span className="control-name">{name}</span>
        <select
          value={index}
          onChange={(e) => onChange(e.target.value === '-1' ? undefined : options[Number(e.target.value)])}
        >
          {index === -1 && <option value={-1}>—</option>}
          {options.map((o, i) => <option key={i} value={i}>{String(o)}</option>)}
        </select>
      </label>
    )
  }

  if (type === 'boolean') {
    return (
      <label className="control-checkbox">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        <span className="control-name">{name}</span>
      </label>
    )
  }

  if (type === 'number') {
    return (
      <label>
        <span className="control-name">{name}</span>
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(Number.isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber)}
        />
      </label>
    )
  }

  if (type === 'string') {
    return (
      <label>
        <span className="control-name">{name}</span>
        <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
      </label>
    )
  }

  return (
    <>
      <span className="control-name">{name}</span>
      <span className="control-readonly">not editable</span>
    </>
  )
}
