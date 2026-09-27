import type { FSWatcher } from 'chokidar'
import type { ComponentSchema } from '../extractor'

export function scanDirectory(dir: string): Map<string, ComponentSchema[]> {
  throw new Error('not implemented')
}

export function watchDirectory(
  dir: string,
  onChange: (filePath: string, schemas: ComponentSchema[]) => void
): FSWatcher {
  throw new Error('not implemented')
}
