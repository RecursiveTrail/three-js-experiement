import { Link } from 'react-router-dom'

export function Overlays({ lastKey, fact }: { lastKey: string | null; fact: string | null }) {
  const label = lastKey === ' ' ? 'Space' : lastKey
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        textShadow: '0 2px 8px #000',
      }}
    >
      <div style={{ pointerEvents: 'auto', padding: 16 }}>
        <Link to="/" style={{ color: '#fff' }}>All experiments</Link>
      </div>
      <div style={{ position: 'absolute', left: 16, bottom: 24, maxWidth: 520 }}>
        {label ? <div style={{ fontSize: 28, fontWeight: 700 }}>You pressed {label}</div> : null}
        {fact ? <div style={{ fontSize: 20, marginTop: 8 }}>{fact}</div> : null}
      </div>
    </div>
  )
}
