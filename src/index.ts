/**
 * Library entry point: the configured react-docgen-typescript parser.
 *
 * Everything frontdocs knows about a component comes from this parser. It reads
 * TypeScript types and JSDoc comments, so no config file from the user's project
 * is needed. Options:
 * - shouldRemoveUndefinedFromOptional: `size?: 'sm'` shows as `'sm'`, not `'sm' | undefined`
 * - shouldIncludeExpression: exposes the export name, used to skip lowercase exports
 * - shouldExtractLiteralValuesFromEnum: literal unions come with their values (select options)
 * - propFilter: drops props inherited from node_modules (e.g. all of HTMLAttributes),
 *   except `children` (also kept without JSDoc), so components like <Button> can be given content
 */
import path from 'path'
import ts from 'typescript'
import { withCompilerOptions, type ParserOptions } from 'react-docgen-typescript'

const DEFAULT_COMPILER_OPTIONS: ts.CompilerOptions = { jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }

const PARSER_OPTIONS: ParserOptions = {
    savePropValueAsString: true,
    shouldRemoveUndefinedFromOptional: true,
    shouldIncludeExpression: true,
    shouldExtractLiteralValuesFromEnum: true,
    skipChildrenPropWithoutDoc: false,
    propFilter: (prop) =>
      prop.name === 'children' ||
      !prop.declarations?.length ||
      prop.declarations.some((d) => !d.fileName.includes('node_modules')),
}

const parser: Parser = withCompilerOptions(DEFAULT_COMPILER_OPTIONS, PARSER_OPTIONS)

/**
 * A parser that uses the compilerOptions of the tsconfig.json nearest to `file`
 * (paths aliases like `@/`, baseUrl, strictness…), so imported types resolve the
 * way they do in the project. Falls back to the default parser without a tsconfig.
 */
export function parserFor(file: string): Parser {
  const config = ts.findConfigFile(path.dirname(file), ts.sys.fileExists)
  if (!config) return parser
  let cached = parsers.get(config)
  if (!cached) {
    const parsed = ts.getParsedCommandLineOfConfigFile(config, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} })
    cached = parsed ? withCompilerOptions({ ...DEFAULT_COMPILER_OPTIONS, ...parsed.options }, PARSER_OPTIONS) : parser
    parsers.set(config, cached)
  }
  return cached
}
const parsers = new Map<string, Parser>()

/**
 * Public shape of the parser: react-docgen-typescript's FileParser, described here so
 * the published types don't depend on docgen's or TypeScript's own declarations.
 */
export interface Parser {
  parse(filePathOrPaths: string | string[]): ParsedComponent[]
}

export interface ParsedComponent {
  displayName: string
  description: string
  filePath: string
  props: Record<string, ParsedProp>
  /** The exported symbol; `getName()` is the export name ('default' for default exports) */
  expression?: { getName(): string; getDeclarations(): { getSourceFile(): { fileName: string } }[] | undefined }
}

export interface ParsedProp {
  name: string
  required: boolean
  description: string
  /** `{ value }` when a default is set, else null */
  defaultValue: { value: any } | null
  /** `name` is the type text, or 'enum' for literal unions (then `raw` + `value` hold the members) */
  type: { name: string; raw?: string; value?: any }
}

export default parser

export { defineConfig, type FrontdocsConfig } from './config'
