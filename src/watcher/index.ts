import { globSync } from 'fs'
import path from 'path'
import type { FSWatcher } from 'chokidar'
import { extractComponents } from '../extractor/extractComponents'
import type { ComponentSchema } from '../extractor'

export function scanDirectory(dir: string): Map<string, ComponentSchema[]> {
  const files = globSync('**/*.tsx', { cwd: dir, exclude: (p) => p.includes('node_modules') })
    .map((f) => path.resolve(dir, f))
  const byFile = new Map<string, ComponentSchema[]>()
  for (const c of extractComponents(files)) {
    byFile.set(c.filePath, [...(byFile.get(c.filePath) ?? []), c])
  }
  return byFile
}

export function watchDirectory(
  dir: string,
  onChange: (filePath: string, schemas: ComponentSchema[]) => void
): FSWatcher {
  throw new Error('not implemented')
}
