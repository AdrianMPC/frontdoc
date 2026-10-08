/**
 * Finding components on disk and keeping them up to date.
 *
 * scanDirectory: one-time scan of every .tsx file under a folder (node_modules skipped),
 *   returned as Map<absolute file path, ComponentSchema[]>. Files without components
 *   are left out.
 * watchDirectory: re-extracts a file whenever it is added or changed, and reports []
 *   when it is deleted. Each change builds a new TypeScript program for that file.
 */
import { globSync } from 'fs'
import path from 'path'
import { watch, type FSWatcher } from 'chokidar'
import { extractComponents } from '../extractor/extractComponents'
import type { ComponentSchema } from '../extractor'

// Next.js route files are pages, not reusable components
const NEXT_ROUTE_FILES = /(^|\/)(page|layout|template|loading|error|global-error|not-found|default)\.tsx$/

export function scanDirectory(dir: string): Map<string, ComponentSchema[]> {
  const files = globSync('**/*.tsx', { cwd: dir, exclude: (p) => p.includes('node_modules') || NEXT_ROUTE_FILES.test(p) })
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
  const update = (p: string) => {
    try {
      onChange(p, extractComponents(p))
    } catch (err) {
      // keep watching; last good schema stays in the explorer
      console.error(`frontdocs: could not parse ${p}: ${(err as Error).message}`)
    }
  }
  return watch(dir, {
    ignoreInitial: true,
    ignored: (p, stats) =>
      p.includes('node_modules') || NEXT_ROUTE_FILES.test(p) || (!!stats?.isFile() && !p.endsWith('.tsx')),
  })
    .on('add', update)
    .on('change', update)
    .on('unlink', (p) => onChange(p, []))
}
