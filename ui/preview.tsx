import { createElement, type ComponentType } from 'react'
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

window.addEventListener('message', async ({ data }: MessageEvent<PreviewMessage>) => {
  if (!data?.file) return
  const mod = await import(/* @vite-ignore */ '/@fs' + data.file)
  const Component: ComponentType<Record<string, unknown>> = mod[data.exportName]
  const withCallbacks = (props: Record<string, unknown>) => {
    const out = { ...props }
    for (const name of data.callbacks) out[name] ??= (...args: unknown[]) => console.log(`${data.exportName}.${name}`, ...args)
    return out
  }
  root.render(
    data.examples.map(({ label, props }, i) =>
      label
        ? createElement('figure', { key: i }, createElement(Component, withCallbacks(props)), createElement('figcaption', null, label))
        : createElement(Component, { key: i, ...withCallbacks(props) })
    )
  )
})

// Report content height so the parent can size the iframe to fit
new ResizeObserver(() => window.parent.postMessage({ height: document.body.offsetHeight }, '*')).observe(document.body)

window.parent.postMessage('frontdocs:preview-ready', '*')
