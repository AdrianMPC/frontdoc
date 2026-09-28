#!/usr/bin/env node
/**
 * `frontdocs dev [dir] --port 3333`
 *
 * Validates the arguments (command, folder exists, port is a valid number), then
 * starts the explorer. Every failure prints a one-line `frontdocs: ...` message
 * plus usage and exits with code 1.
 */
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { startExplorer } from './explorer'

const USAGE = 'Usage: frontdocs dev [dir] --port 3333'

function fail(message: string): never {
  console.error(`frontdocs: ${message}\n${USAGE}`)
  process.exit(1)
}

let parsed
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: { port: { type: 'string', default: '3333' } },
  })
} catch (err) {
  fail((err as Error).message)
}

const [command, dirArg = '.'] = parsed.positionals
if (command !== 'dev') fail(command ? `unknown command '${command}'` : 'missing command')

const dir = resolve(dirArg)
if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) fail(`'${dirArg}' is not a directory`)

const port = Number(parsed.values.port)
if (!Number.isInteger(port) || port < 0 || port > 65535) fail(`invalid port '${parsed.values.port}'`)

startExplorer({ dir, port }).catch((err) => {
  console.error(`frontdocs: ${(err as Error).message}`)
  process.exit(1)
})
