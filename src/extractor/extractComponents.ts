/**
 * Turns .tsx files into ComponentSchema objects, the data the whole explorer runs on.
 *
 * - Pass many files at once: react-docgen-typescript builds one TypeScript program
 *   per parse() call, so one call for N files is much faster than N calls.
 * - react-docgen-typescript counts any exported one-argument function as a component,
 *   so lowercase named exports (utils, hooks) are dropped here. Default exports are
 *   always kept, because they have no name to check.
 * - Docgen's output is flattened into PropSchema (name, type, required, default,
 *   description, options) so the UI never depends on docgen internals.
 */
import path from 'path'
import { parserFor } from '../index'
import type { ComponentSchema } from './index'

export function extractComponents(filePaths: string | string[]): ComponentSchema[] {
  const absolutePaths = [filePaths].flat().map((p) => path.resolve(p))
  if (!absolutePaths.length) return []
  // One project per scan, so the first file's tsconfig applies to all of them
  const docs = parserFor(absolutePaths[0]).parse(absolutePaths).filter((doc) => {
    const name = doc.expression?.getName() // set via shouldIncludeExpression
    // Re-exports (`export * from './Button'` in an index file) would list a component twice;
    // keep it only in the file that declares it
    const declaredIn = doc.expression?.getDeclarations()?.[0]?.getSourceFile().fileName
    if (declaredIn && path.resolve(declaredIn) !== path.resolve(doc.filePath)) return false
    // docgen treats any exported fn with one param as a component; React requires
    // PascalCase for components, so drop lowercase named exports (utils, hooks).
    return name === 'default' || /^[A-Z]/.test(name ?? '')
  })
  return docs.map((doc) => ({
    displayName: doc.displayName,
    description: doc.description,
    props: Object.values(doc.props).map((p) => ({
      name: p.name,
      type: p.type.raw ?? p.type.name, // enum types keep their union text in raw
      required: p.required,
      defaultValue: p.defaultValue?.value ?? null,
      description: p.description,
      ...(p.type.name === 'enum' && { options: p.type.value.map((o: { value: string }) => literal(o.value)) }),
    })),
    filePath: doc.filePath,
    exportName: doc.expression?.getName() ?? 'default',
  }))
}

function literal(raw: string): string | number {
  try { return JSON.parse(raw) } catch { return raw }
}
