import ts from 'typescript'
import { withCompilerOptions } from 'react-docgen-typescript'

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

export default parser
