/**
 * Runs inside the preview iframe and renders the user's component.
 *
 * The parent page posts { file, exportName, examples, callbacks }. The component is
 * loaded with import('/@fs' + file), so Vite compiles it and hot-reloads it on edit.
 * Functions can't be sent through postMessage, so callback props arrive as names and
 * become console loggers here.
 *
 * Failures stay inside the frame: a component that throws is caught by an error
 * boundary, and a file that fails to compile shows Vite's error message.
 */
import { Component as ReactComponent, createElement, type ComponentType, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Example } from './examples'

export interface PreviewMessage {
  file: string
  exportName: string
  /** Live preview sends one unlabeled example; the examples grid sends one per combination */
  examples: Example[]
  /** Function props; functions can't cross postMessage, so they're rebuilt here as loggers */
  callbacks: string[]
}

const root = createRoot(document.getElementById('root')!)

const showError = (title: string, message: string) =>
  root.render(
    createElement('div', { className: 'error', role: 'alert' },
      createElement('strong', null, title),
      createElement('pre', null, message),
      createElement('small', null, 'If it needs a provider (theme, router, store), that is not supported yet.'),
    )
  )

// A failed import() only says "error loading module"; Vite's error page for the file has the real message (e.g. syntax error)
async function compileError(file: string): Promise<string | undefined> {
  const html = await fetch('/@fs' + file).then((r) => r.text()).catch(() => '')
  const json = html.match(/const error = (\{.*\})\n/)?.[1]
  return json ? JSON.parse(json).message : undefined
}

class Boundary extends ReactComponent<{ name: string; children?: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    const { error } = this.state
    return error
      ? createElement('div', { className: 'error', role: 'alert' }, createElement('strong', null, `${this.props.name} threw while rendering`), createElement('pre', null, error.message))
      : this.props.children
  }
}

window.addEventListener('message', async ({ data }: MessageEvent<PreviewMessage>) => {
  if (!data?.file) return
  let Component: ComponentType<Record<string, unknown>> | undefined
  try {
    Component = (await import(/* @vite-ignore */ '/@fs' + data.file))[data.exportName]
  } catch (err) {
    return showError(`Could not load ${data.file.split('/').pop()}`, await compileError(data.file) ?? (err as Error).message)
  }
  if (!Component) return showError('Export not found', `${data.file} has no export named "${data.exportName}"`)
  const withCallbacks = (props: Record<string, unknown>) => {
    const out = { ...props }
    for (const name of data.callbacks) out[name] ??= (...args: unknown[]) => console.log(`${data.exportName}.${name}`, ...args)
    return out
  }
  root.render(
    data.examples.map(({ label, props }, i) => {
      const rendered = createElement(Boundary, { key: i, name: data.exportName }, createElement(Component, withCallbacks(props)))
      return label ? createElement('figure', { key: i }, rendered, createElement('figcaption', null, label)) : rendered
    })
  )
})

// Report content height so the parent can size the iframe to fit
new ResizeObserver(() => window.parent.postMessage({ height: document.body.offsetHeight }, '*')).observe(document.body)

window.parent.postMessage('frontdocs:preview-ready', '*')
