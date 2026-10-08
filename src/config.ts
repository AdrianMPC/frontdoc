/**
 * Optional `frontdocs.config.ts` (or .mts/.js/.mjs) in the folder where the CLI runs.
 *
 * Every field overrides something frontdocs otherwise detects on its own; without the file
 * nothing changes (zero-config). CLI flags win over the file. The file is loaded with Vite's
 * config loader, which bundles it first, so TypeScript configs work on any supported Node.
 */
import { existsSync } from 'fs'
import path from 'path'

export interface FrontdocsConfig {
  /** Folder to scan for components (default `.`) */
  dir?: string
  /** Port for the local server (default 3333) */
  port?: number
  /** Global CSS files for every preview; replaces the automatic detection (app/layout.tsx, main.tsx…) */
  css?: string[]
  /** Extra globs to skip, relative to `dir` (e.g. `**\/*.stories.tsx`) */
  exclude?: string[]
  /** Which .env variables previews can read as process.env.* (default NEXT_PUBLIC_, VITE_, REACT_APP_) */
  envPrefix?: string[]
}

/** Identity helper for autocompletion in frontdocs.config.ts (needs frontdocs installed in the project). */
export const defineConfig = (config: FrontdocsConfig): FrontdocsConfig => config

const CONFIG_FILES = ['frontdocs.config.ts', 'frontdocs.config.mts', 'frontdocs.config.js', 'frontdocs.config.mjs']

const FIELDS: Record<keyof FrontdocsConfig, 'string' | 'number' | 'string[]'> = {
  dir: 'string',
  port: 'number',
  css: 'string[]',
  exclude: 'string[]',
  envPrefix: 'string[]',
}

/** Finds and loads the config in `cwd`; `{}` when there is none. Paths come back absolute. */
export async function loadConfig(cwd: string): Promise<{ config: FrontdocsConfig; file?: string }> {
  const file = CONFIG_FILES.map((f) => path.join(cwd, f)).find((f) => existsSync(f))
  if (!file) return { config: {} }

  // Imported lazily so `import { defineConfig } from 'frontdocs'` doesn't pull in Vite
  const { loadConfigFromFile } = await import('vite')
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, file, cwd, 'silent')
  const config = (loaded?.config ?? {}) as Record<string, unknown>
  const name = path.basename(file)

  for (const [key, value] of Object.entries(config)) {
    const expected = FIELDS[key as keyof FrontdocsConfig]
    if (!expected) throw new Error(`${name}: unknown option '${key}' (valid: ${Object.keys(FIELDS).join(', ')})`)
    const ok =
      expected === 'string[]' ? Array.isArray(value) && value.every((v) => typeof v === 'string') : typeof value === expected
    if (!ok) throw new Error(`${name}: '${key}' must be ${expected === 'string[]' ? 'an array of strings' : `a ${expected}`}`)
  }

  const { dir, css, ...rest } = config as FrontdocsConfig
  return {
    file,
    config: {
      ...rest,
      ...(dir !== undefined && { dir: path.resolve(cwd, dir) }),
      ...(css !== undefined && { css: css.map((f) => path.resolve(cwd, f)) }),
    },
  }
}
