/**
 * The explorer page: sidebar, component details, controls, preview and examples.
 *
 * - Receives component data from the server over Vite's HMR socket (see src/explorer).
 * - The selected component lives in the URL hash so it survives Vite's full reloads.
 * - Control values are plain state; every change is posted to the preview iframes.
 * - Previews run in iframes (preview.html) so the user's CSS can't leak into the
 *   explorer. Each iframe reports its content height so it can be sized to fit.
 */
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ComponentSchema, SchemasPayload } from '../src/extractor'
import type { PreviewMessage } from './preview'
import { PropTable } from './PropTable'
import { Controls } from './Controls'
import { initialValues } from './values'
import { examples, type Example } from './examples'
import { Sidebar } from './Sidebar'
import { Snippet } from './Snippet'
import { toJSX } from './snippet'

function App() {
  const [payload, setPayload] = useState<SchemasPayload>()
  const { root = '', components = [] } = payload ?? {}
  // Selection lives in the URL hash so it survives Vite's full reloads (and can be bookmarked)
  const [selected, setSelected] = useState(() => decodeURIComponent(location.hash.slice(1)) || undefined)
  const select = (k: string) => {
    setSelected(k)
    history.replaceState(null, '', '#' + encodeURIComponent(k))
  }
  const current = components.find((c) => key(c) === selected) ?? components[0]

  useEffect(() => {
    import.meta.hot?.on('frontdocs:schemas', setPayload)
    import.meta.hot?.send('frontdocs:hello')
  }, [])

  return (
    <main>
      <Sidebar root={root} components={components} selected={current && key(current)} onSelect={select} />
      {current ? (
        <Explorer key={key(current)} component={current} />
      ) : (
        <section>
          {payload ? (
            <p>
              No React components found in <code>{root}</code>. frontdocs looks for exported PascalCase components in <code>.tsx</code> files.
            </p>
          ) : (
            <p>Scanning for components…</p>
          )}
        </section>
      )}
    </main>
  )
}

function Explorer({ component }: { component: ComponentSchema }) {
  const [values, setValues] = useState(() => initialValues(component.props))
  const grid = examples(component, values)
  return (
    <section>
      <h1>{component.displayName}</h1>
      <p>{component.description}</p>
      <Preview component={component} examples={[{ label: '', props: values }]} />
      <Snippet code={toJSX(component, values)} />
      {component.props.length ? (
        <>
          <Controls props={component.props} values={values} onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))} />
          <PropTable props={component.props} />
        </>
      ) : (
        <p>This component has no props.</p>
      )}
      {grid.length > 0 && (
        <>
          <h2>Examples</h2>
          <Preview component={component} examples={grid} />
        </>
      )}
    </section>
  )
}

function Preview({ component, examples }: { component: ComponentSchema; examples: Example[] }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState<number>()
  const post = () => {
    const message: PreviewMessage = {
      file: component.filePath,
      exportName: component.exportName,
      examples,
      callbacks: component.props.filter((p) => p.type.includes('=>')).map((p) => p.name),
    }
    frame.current?.contentWindow?.postMessage(message, '*')
  }
  useEffect(post)
  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      if (e.data === 'frontdocs:preview-ready') post()
      else if (typeof e.data?.height === 'number') setHeight(e.data.height)
    }
    window.addEventListener('message', onReady)
    return () => window.removeEventListener('message', onReady)
  })
  return <iframe ref={frame} src="./preview.html" title={`${component.displayName} preview`} style={{ height }} />
}

const key = (c: ComponentSchema) => `${c.filePath}#${c.exportName}`

createRoot(document.getElementById('root')!).render(<App />)
