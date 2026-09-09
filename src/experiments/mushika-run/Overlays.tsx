import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HINT_DISTANCE, TOAST_MS, lastGateLabel, nextGateLine, type GateId } from './constants'
import type { Snapshot } from './reduce'

export function toastAfterGates(last: GateId | undefined, _prev: string | null): string | null {
  if (!last) return null
  return `${lastGateLabel([last])}! Jai Ganpati`
}

export function Overlays({ world }: { world: Snapshot }) {
  const [toast, setToast] = useState<string | null>(null)
  const last = world.gatesReached[world.gatesReached.length - 1]
  useEffect(() => {
    setToast((prev) => toastAfterGates(last, prev))
    if (!last) return
    const t = window.setTimeout(() => setToast(null), TOAST_MS)
    return () => window.clearTimeout(t)
  }, [last])

  const hungerPct = Math.round(world.hunger * 100)
  const showHint = world.phase === 'playing' && world.distance < HINT_DISTANCE

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        color: '#fff8e8',
        fontFamily: 'system-ui, sans-serif',
        textShadow: '0 2px 8px #000',
      }}
    >
      <div
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingLeft: 'max(12px, env(safe-area-inset-left))',
          paddingRight: 'max(12px, env(safe-area-inset-right))',
        }}
      >
        <div style={{ pointerEvents: 'auto', padding: '4px 4px 8px' }}>
          <Link to="/" style={{ color: '#fff' }}>
            All experiments
          </Link>
        </div>
        <div style={{ fontSize: 13, letterSpacing: 0.4, marginBottom: 6 }}>Hunger</div>
        <div
          style={{
            height: 18,
            borderRadius: 9,
            background: '#6a2030',
            overflow: 'hidden',
            border: '1px solid #ffd27a',
          }}
        >
          <div
            style={{
              width: `${hungerPct}%`,
              height: '100%',
              background: world.hunger > 0.35 ? '#ff9a2a' : '#e24b2c',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 18, fontWeight: 700 }}>
          <span>{world.score}</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{nextGateLine(world.distance)}</span>
        </div>
        {toast ? (
          <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, color: '#ffd27a' }}>{toast}</div>
        ) : null}
        {showHint ? (
          <div style={{ marginTop: 10, fontSize: 15 }}>swipe to change lane · swipe up to jump</div>
        ) : null}
      </div>

      {world.phase === 'over' ? (
        <div
          style={{
            pointerEvents: 'auto',
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 'max(24px, env(safe-area-inset-bottom))',
            background: 'rgba(20, 8, 14, 0.88)',
            border: '1px solid #f0c070',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800 }}>Bhuk caught you</div>
          <div style={{ marginTop: 8 }}>score {world.score}</div>
          <div>last gate: {lastGateLabel(world.gatesReached)}</div>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {world.gatesReached.map((id) => (
              <li key={id}>{lastGateLabel([id])}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12, fontWeight: 700 }}>tap or Space — run again</div>
        </div>
      ) : null}
    </div>
  )
}
