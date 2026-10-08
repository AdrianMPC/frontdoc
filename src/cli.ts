#!/usr/bin/env node
/**
 * `frontdocs dev [dir] [--port 3333] [--css file.css]`
 *
 * Reads frontdocs.config.ts if there is one (see src/config.ts); CLI arguments win over it.
 * Validates the arguments (command, folder exists, port is a valid number), then starts the
 * explorer. Every failure prints a one-line `frontdocs: ...` message plus usage and exits with code 1.
 */
import { statSync } from 'node:fs'
import path, { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { loadConfig } from './config'
import { startExplorer } from './explorer'

const USAGE = 'Usage: frontdocs dev [dir] [--port 3333] [--css path/to/global.css]'

function fail(message: string): never {
  console.error(`frontdocs: ${message}\n${USAGE}`)
  process.exit(1)
}

async function main() {
  let parsed
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: { port: { type: 'string' }, css: { type: 'string', multiple: true } },
    })
  } catch (err) {
    fail((err as Error).message)
  }

  const [command, dirArg] = parsed.positionals
  if (command !== 'dev') fail(command ? `unknown command '${command}'` : 'missing command')

  let loaded
  try {
    loaded = await loadConfig(process.cwd())
  } catch (err) {
    fail((err as Error).message)
  }
  const { config, file } = loaded
  if (file) console.log(`frontdocs: using ${path.basename(file)}`)

  const dir = dirArg ? resolve(dirArg) : config.dir ?? resolve('.')
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) fail(`'${dirArg ?? (path.relative('.', dir) || '.')}' is not a directory`)

  const portArg = parsed.values.port ?? String(config.port ?? 3333)
  const port = Number(portArg)
  if (!Number.isInteger(port) || port < 0 || port > 65535) fail(`invalid port '${portArg}'`)

  const css = parsed.values.css?.map((f) => resolve(f)) ?? config.css
  for (const f of css ?? []) if (!statSync(f, { throwIfNoEntry: false })?.isFile()) fail(`css file '${path.relative('.', f)}' not found`)

  await startExplorer({ dir, port, css, exclude: config.exclude, envPrefix: config.envPrefix })
}

main().catch((err) => {
  console.error(`frontdocs: ${(err as Error).message}`)
  process.exit(1)
})
