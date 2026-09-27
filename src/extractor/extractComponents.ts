import path from 'path'
import parser from '../index'
import type { ComponentSchema } from './index'

export function extractComponents(filePaths: string | string[]): ComponentSchema[] {
  const absolutePaths = [filePaths].flat().map((p) => path.resolve(p))
  // docgen treats any exported fn with one param as a component; React requires
  // PascalCase for components, so drop lowercase named exports (utils, hooks).
  // ponytail: default exports always kept, check JSX return type via checker if utils leak in
  const docs = parser.parse(absolutePaths).filter((doc) => {
    const name = doc.expression?.getName() // set via shouldIncludeExpression
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

// ponytail: TS enum members (Size.Small) stay as their source text, resolve via checker if needed
function literal(raw: string): string | number {
  try { return JSON.parse(raw) } catch { return raw }
}
