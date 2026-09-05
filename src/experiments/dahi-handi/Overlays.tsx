import { Link } from 'react-router-dom'

export function Overlays({ smashCount }: { smashCount: number }) {
  const label = smashCount === 1 ? '1 handi' : `${smashCount} handis`
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
        <Link to="/" style={{ color: '#fff' }}>
          All experiments
        </Link>
      </div>
      <div style={{ position: 'absolute', left: 16, bottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Space or click — smash the handi</div>
        <div style={{ fontSize: 20, marginTop: 8 }}>{label}</div>
      </div>
    </div>
  )
}
