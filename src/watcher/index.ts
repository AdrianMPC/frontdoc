import { globSync } from 'fs'
import path from 'path'
import { watch, type FSWatcher } from 'chokidar'
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
  // ponytail: new ts program per change; reuse one via parseWithProgramProvider if reload feels slow
  const update = (p: string) => onChange(p, extractComponents(p))
  return watch(dir, {
    ignoreInitial: true,
    ignored: (p, stats) => p.includes('node_modules') || (!!stats?.isFile() && !p.endsWith('.tsx')),
  })
    .on('add', update)
    .on('change', update)
    .on('unlink', (p) => onChange(p, []))
}
