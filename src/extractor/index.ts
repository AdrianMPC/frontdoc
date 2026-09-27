export interface PropSchema {
  name: string
  type: string
  required: boolean
  defaultValue: string | null
  description: string
}

export interface ComponentSchema {
  displayName: string
  description: string
  props: PropSchema[]
  filePath: string
}
