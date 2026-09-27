import path from 'path'
import parser from '../index'
import type { ComponentSchema } from './index'

export function extractComponents(filePath: string): ComponentSchema[] {
  const absolutePath = path.resolve(filePath)
  return parser.parse(absolutePath).map((doc) => ({
    displayName: doc.displayName,
    description: doc.description,
    props: doc.props,
    filePath: absolutePath,
  }))
}
