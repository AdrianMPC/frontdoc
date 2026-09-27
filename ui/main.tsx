import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ComponentSchema } from '../src/extractor'
import type { PreviewMessage } from './preview'
import { PropTable } from './PropTable'
import { Controls } from './Controls'
import { initialValues } from './values'

function App() {
  const [components, setComponents] = useState<ComponentSchema[]>([])
  const [selected, setSelected] = useState<string>()
  const current = components.find((c) => key(c) === selected) ?? components[0]

  useEffect(() => {
    import.meta.hot?.on('frontdocs:schemas', setComponents)
    import.meta.hot?.send('frontdocs:hello')
  }, [])

  return (
    <main>
      <nav>
        {components.map((c) => (
          <button key={key(c)} onClick={() => setSelected(key(c))} aria-current={c === current}>
            {c.displayName}
          </button>
        ))}
      </nav>
      {current ? <Explorer key={key(current)} component={current} /> : <p>No components found.</p>}
    </main>
  )
}

function Explorer({ component }: { component: ComponentSchema }) {
  const [values, setValues] = useState(() => initialValues(component.props))
  return (
    <section>
      <h1>{component.displayName}</h1>
      <p>{component.description}</p>
      <Preview component={component} props={values} />
      <Controls props={component.props} values={values} onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))} />
      <PropTable props={component.props} />
    </section>
  )
}

function Preview({ component, props }: { component: ComponentSchema; props: Record<string, unknown> }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const post = () => {
    const message: PreviewMessage = {
      file: component.filePath,
      exportName: component.exportName,
      props,
      callbacks: component.props.filter((p) => p.type.includes('=>')).map((p) => p.name),
    }
    frame.current?.contentWindow?.postMessage(message, '*')
  }
  useEffect(post)
  useEffect(() => {
    const onReady = (e: MessageEvent) => e.data === 'frontdocs:preview-ready' && post()
    window.addEventListener('message', onReady)
    return () => window.removeEventListener('message', onReady)
  })
  return <iframe ref={frame} src="./preview.html" title={`${component.displayName} preview`} />
}

const key = (c: ComponentSchema) => `${c.filePath}#${c.exportName}`

createRoot(document.getElementById('root')!).render(<App />)
