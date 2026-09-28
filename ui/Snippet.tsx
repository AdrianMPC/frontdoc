import { useEffect, useState } from 'react'
import './sidebar-snippet.css'

export function Snippet({ code }: { code: string }) {
  const [label, setLabel] = useState('Copy')

  useEffect(() => {
    if (label === 'Copy') return
    const timer = setTimeout(() => setLabel('Copy'), 1500)
    return () => clearTimeout(timer)
  }, [label])

  const copy = () =>
    navigator.clipboard.writeText(code).then(
      () => setLabel('Copied'),
      () => setLabel('Copy failed')
    )

  return (
    <div className="snippet">
      <pre><code>{code}</code></pre>
      <button type="button" className="snippet-copy" onClick={copy} aria-live="polite">
        {label}
      </button>
    </div>
  )
}
