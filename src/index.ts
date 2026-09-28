/**
 * Library entry point: the configured react-docgen-typescript parser.
 *
 * Everything frontdocs knows about a component comes from this parser. It reads
 * TypeScript types and JSDoc comments, so no config file from the user's project
 * is needed. Options:
 * - shouldRemoveUndefinedFromOptional: `size?: 'sm'` shows as `'sm'`, not `'sm' | undefined`
 * - shouldIncludeExpression: exposes the export name, used to skip lowercase exports
 * - shouldExtractLiteralValuesFromEnum: literal unions come with their values (select options)
 * - propFilter: drops props inherited from node_modules (e.g. all of HTMLAttributes)
 */
import ts from 'typescript'
import { withCompilerOptions } from 'react-docgen-typescript'

const parser = withCompilerOptions(
  { jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  {
    savePropValueAsString: true,
    shouldRemoveUndefinedFromOptional: true,
    shouldIncludeExpression: true,
    shouldExtractLiteralValuesFromEnum: true,
    propFilter: (prop) =>
      !prop.declarations?.length ||
      prop.declarations.some((d) => !d.fileName.includes('node_modules')),
  }
)

export default parser
