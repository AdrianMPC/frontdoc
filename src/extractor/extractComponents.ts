import path from 'path'
import parser from '../index'
import type { ComponentSchema } from './index'

export function extractComponents(filePath: string): ComponentSchema[] {
  const absolutePath = path.resolve(filePath)
  return parser.parse(absolutePath).map((doc) => ({
    displayName: doc.displayName,
    description: doc.description,
    props: Object.values(doc.props).map((p) => ({
      name: p.name,
      type: p.type.name,
      required: p.required,
      defaultValue: p.defaultValue?.value ?? null,
      description: p.description,
    })),
    filePath: absolutePath,
  }))
}
