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
  const [{ root, components }, setPayload] = useState<SchemasPayload>({ root: '', components: [] })
  const [selected, setSelected] = useState<string>()
  const current = components.find((c) => key(c) === selected) ?? components[0]

  useEffect(() => {
    import.meta.hot?.on('frontdocs:schemas', setPayload)
    import.meta.hot?.send('frontdocs:hello')
  }, [])

  return (
    <main>
      <Sidebar root={root} components={components} selected={current && key(current)} onSelect={setSelected} />
      {current ? <Explorer key={key(current)} component={current} /> : <p>No components found.</p>}
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
      <Controls props={component.props} values={values} onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))} />
      <PropTable props={component.props} />
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
