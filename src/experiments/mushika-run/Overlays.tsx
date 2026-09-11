import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  HINT_DISTANCE,
  SHRINE_FALLBACK_FILL,
  hudGateLine,
  lastGateLabel,
  liveGateId,
  shrineStillUrl,
  shrineVideoUrl,
} from './constants'
import type { Snapshot } from './reduce'

export function shrineKind(videoFailed: boolean, stillFailed: boolean): 'video' | 'still' | 'fill' {
  if (!videoFailed) return 'video'
  if (!stillFailed) return 'still'
  return 'fill'
}

export function ShrineBackdrop({ world }: { world: Snapshot }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [stillFailed, setStillFailed] = useState(false)
  const id = liveGateId(world.gatesReached)
  const active = world.phase === 'shrine' && id

  useEffect(() => {
    setVideoFailed(false)
    setStillFailed(false)
  }, [id])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const pause = () => {
      v.pause()
    }
    if (!active || document.visibilityState === 'hidden') {
      pause()
      return
    }
    v.muted = true
    void v.play().catch(() => setVideoFailed(true))
    const onVis = () => {
      if (document.visibilityState === 'hidden') pause()
      else if (world.phase === 'shrine') void v.play().catch(() => setVideoFailed(true))
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      pause()
    }
  }, [active, world.phase, id])

  if (!active || !id) return null
  const kind = shrineKind(videoFailed, stillFailed)
  const fill: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    background: SHRINE_FALLBACK_FILL,
    objectFit: 'cover',
    width: '100%',
    height: '100%',
  }
  if (kind === 'fill') return <div style={fill} />
  if (kind === 'still') {
    return (
      <img
        src={shrineStillUrl(id)}
        alt=""
        style={fill}
        onError={() => setStillFailed(true)}
      />
    )
  }
  return (
    <video
      ref={videoRef}
      src={shrineVideoUrl(id)}
      muted
      loop
      playsInline
      autoPlay
      style={fill}
      onError={() => setVideoFailed(true)}
    />
  )
}

export function Overlays({ world }: { world: Snapshot }) {
  const hungerPct = Math.round(world.hunger * 100)
  const showHint = world.phase === 'playing' && world.distance < HINT_DISTANCE
  const gateLine = hudGateLine(world.phase, world.distance, world.gatesReached)
  const shrine = world.phase === 'shrine'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
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
          <span style={{ fontSize: 14, fontWeight: 500 }}>{gateLine}</span>
        </div>
        {shrine ? (
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 22, fontWeight: 800 }}>{gateLine}</div>
        ) : null}
        {shrine ? <div style={{ marginTop: 8, textAlign: 'center', fontSize: 15 }}>tap to continue</div> : null}
        {showHint ? <div style={{ marginTop: 10, fontSize: 15 }}>swipe to change lane · swipe up to jump</div> : null}
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
            {world.gatesReached.map((gid) => (
              <li key={gid}>{lastGateLabel([gid])}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12, fontWeight: 700 }}>tap or Space — run again</div>
        </div>
      ) : null}
    </div>
  )
}
