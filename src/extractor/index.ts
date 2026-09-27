export interface PropSchema {
  name: string
  type: string
  required: boolean
  defaultValue: string | null
  description: string
  /** Literal values of a union prop (`'sm' | 'md'`), for select controls */
  options?: (string | number)[]
}

export interface ComponentSchema {
  displayName: string
  description: string
  props: PropSchema[]
  filePath: string
  /** Export to render: component name or 'default' */
  exportName: string
}
