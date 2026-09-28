import { useState } from 'react'
import type { ComponentSchema } from '../src/extractor'
import { health, type Health } from './health'
import './sidebar-snippet.css'

const HEALTH_TEXT: Record<Health, string> = {
  good: 'all props documented',
  partial: 'some props undocumented',
  none: 'no props documented',
}

interface SidebarProps {
  root: string
  components: ComponentSchema[]
  selected?: string
  onSelect: (key: string) => void
}

function folderOf(root: string, filePath: string): string {
  const rel = filePath.slice(root.length + 1).replace(/\\/g, '/')
  const i = rel.lastIndexOf('/')
  return i < 0 ? '.' : rel.slice(0, i)
}

export function Sidebar({ root, components, selected, onSelect }: SidebarProps) {
  const [query, setQuery] = useState('')

  const groups = new Map<string, ComponentSchema[]>()
  for (const c of components) {
    if (!c.displayName.toLowerCase().includes(query.trim().toLowerCase())) continue
    const folder = folderOf(root, c.filePath)
    groups.set(folder, [...(groups.get(folder) ?? []), c])
  }
  const folders = [...groups.keys()].sort((a, b) => a.localeCompare(b))

  return (
    <nav className="sidebar" aria-label="Components">
      <input
        type="search"
        className="sidebar-search"
        placeholder="Search components"
        aria-label="Search components"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {folders.length === 0 && <p className="sidebar-empty">No components</p>}
      {folders.map((folder) => (
        <section key={folder}>
          <h2 className="sidebar-folder">{folder}</h2>
          <ul>
            {groups
              .get(folder)!
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
              .map((c) => {
                const key = `${c.filePath}#${c.exportName}`
                const h = health(c)
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className="sidebar-item"
                      aria-current={key === selected ? 'true' : undefined}
                      onClick={() => onSelect(key)}
                    >
                      <span className={`health health-${h}`} title={HEALTH_TEXT[h]} />
                      {c.displayName}
                      <span className="visually-hidden">, {HEALTH_TEXT[h]}</span>
                    </button>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </nav>
  )
}
