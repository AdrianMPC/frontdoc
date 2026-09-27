import { createElement, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'

export interface PreviewMessage {
  file: string
  exportName: string
  props: Record<string, unknown>
  /** Function props; functions can't cross postMessage, so they're rebuilt here as loggers */
  callbacks: string[]
}

const root = createRoot(document.getElementById('root')!)

window.addEventListener('message', async ({ data }: MessageEvent<PreviewMessage>) => {
  if (!data?.file) return
  const mod = await import(/* @vite-ignore */ '/@fs' + data.file)
  const Component: ComponentType<Record<string, unknown>> = mod[data.exportName]
  const props = { ...data.props }
  for (const name of data.callbacks) props[name] ??= (...args: unknown[]) => console.log(`${data.exportName}.${name}`, ...args)
  root.render(createElement(Component, props))
})

window.parent.postMessage('frontdocs:preview-ready', '*')
