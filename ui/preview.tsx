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
import 'virtual:frontdocs-styles'

export interface PreviewMessage {
  file: string
  exportName: string
  /** Live preview sends one unlabeled example; the examples grid sends one per combination */
  examples: Example[]
  /** Function props; functions can't cross postMessage, so they're rebuilt here as loggers */
  callbacks: string[]
  /** The automatic `children` text; dropped and retried if the component can't take text (e.g. react-aria collections) */
  placeholderChildren?: string
  /** Required props left without a value (no control can produce them, e.g. objects); used to explain crashes */
  missingRequired: { name: string; type: string }[]
}

const root = createRoot(document.getElementById('root')!)

const showError = (title: string, message: string) =>
  root.render(
    createElement('div', { className: 'error', role: 'alert' },
      createElement('strong', null, title),
      createElement('pre', null, message),
    )
  )

// A failed import() only says "error loading module"; Vite's error page for the file has the real message (e.g. syntax error)
async function compileError(file: string): Promise<string | undefined> {
  const html = await fetch('/@fs' + file).then((r) => r.text()).catch(() => '')
  const json = html.match(/const error = (\{.*\})\n/)?.[1]
  return json ? JSON.parse(json).message : undefined
}

// Components can live inside an exported object (`Pagination.Item`, `InputGroup.Prefix`); docgen only
// gives the inner name, so look one level into each export by key, function name or displayName.
function findExport(mod: Record<string, any>, name: string): ComponentType<Record<string, unknown>> | undefined {
  if (mod[name]) return mod[name]
  for (const parent of Object.values(mod)) {
    if (!parent || (typeof parent !== 'object' && typeof parent !== 'function')) continue
    for (const [key, value] of Object.entries(parent)) {
      if (key === name || (value as any)?.name === name || (value as any)?.displayName === name) return value as ComponentType<Record<string, unknown>>
    }
  }
}

// Common render errors that frontdocs can't fix by itself, explained in plain words
function explain(error: Error, missing: PreviewMessage['missingRequired']): string | undefined {
  const m = error.message
  if (/outside (of )?a collection|must be (used|rendered) (within|inside)|outside (of )?(an? )?<?\w*(Provider|Context)|No \w+ set, use \w+Provider|app router to be mounted|could not find .*context/i.test(m))
    return 'This component needs a parent or provider around it (e.g. a Tab inside Tabs, a router, a query client). Preview it through its parent; example files for this are planned for v0.2.'
  if (missing.length && /undefined|null/i.test(m))
    return `Required props without a value: ${missing.map((p) => `${p.name} (${p.type})`).join(', ')}. frontdocs can't generate these yet; example files for this are planned for v0.2.`
}

class Boundary extends ReactComponent<{ name: string; children?: ReactNode; retry?: ReactNode; missing?: PreviewMessage['missingRequired'] }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  // New props from the controls → try rendering again
  componentDidUpdate(prev: { children?: ReactNode }) {
    if (this.state.error && prev.children !== this.props.children) this.setState({ error: undefined })
  }
  render() {
    const { error } = this.state
    // A fresh Boundary around the retry catches it if that fails too
    if (error && this.props.retry) return createElement(Boundary, { name: this.props.name, missing: this.props.missing }, this.props.retry)
    return error
      ? createElement('div', { className: 'error', role: 'alert' },
          createElement('strong', null, `${this.props.name} threw while rendering`),
          createElement('pre', null, error.message),
          explain(error, this.props.missing ?? []) && createElement('p', { className: 'hint' }, explain(error, this.props.missing ?? [])),
        )
      : this.props.children
  }
}

window.addEventListener('message', async ({ data }: MessageEvent<PreviewMessage>) => {
  if (!data?.file) return
  let Component: ComponentType<Record<string, unknown>> | undefined
  try {
    Component = findExport(await import(/* @vite-ignore */ '/@fs' + data.file), data.exportName)
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
      const full = withCallbacks(props)
      const { children, ...withoutChildren } = full
      const retry = data.placeholderChildren !== undefined && children === data.placeholderChildren ? createElement(Component, withoutChildren) : undefined
      const missing = data.missingRequired.filter((p) => full[p.name] === undefined)
      const rendered = createElement(Boundary, { key: i, name: data.exportName, retry, missing }, createElement(Component, full))
      return label ? createElement('figure', { key: i }, rendered, createElement('figcaption', null, label)) : rendered
    })
  )
})

// Report content height so the parent can size the iframe to fit
new ResizeObserver(() => window.parent.postMessage({ height: document.body.offsetHeight }, '*')).observe(document.body)

window.parent.postMessage('frontdocs:preview-ready', '*')
