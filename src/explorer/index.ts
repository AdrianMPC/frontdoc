import { scanDirectory, watchDirectory } from '../watcher'

// Stub until Card 6: logs components instead of serving them on `port`.
export function startExplorer({ dir, port }: { dir: string; port: number }): void {
  for (const [file, schemas] of scanDirectory(dir)) {
    for (const s of schemas) console.log(`${s.displayName}  ${file}`)
  }
  watchDirectory(dir, (file, schemas) => {
    console.log(`changed ${file}: ${schemas.map((s) => s.displayName).join(', ') || '(none)'}`)
  })
  console.log(`frontdocs watching ${dir} (port ${port} unused until explorer UI lands)`)
}
