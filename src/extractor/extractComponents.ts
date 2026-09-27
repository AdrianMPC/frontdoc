import path from 'path'
import ts from 'typescript'
import { withCompilerOptions } from 'react-docgen-typescript'
import type { ComponentSchema } from './index'

const parser = withCompilerOptions(
  { jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  {
    savePropValueAsString: true,
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop) =>
      !prop.declarations?.length ||
      prop.declarations.some((d) => !d.fileName.includes('node_modules')),
  }
)

export function extractComponents(filePath: string): ComponentSchema[] {
  const absolutePath = path.resolve(filePath)
  return parser.parse(absolutePath).map((doc) => ({
    displayName: doc.displayName,
    description: doc.description,
    props: doc.props,
    filePath: absolutePath,
  }))
}
