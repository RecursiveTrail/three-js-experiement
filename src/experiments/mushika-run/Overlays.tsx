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
import { MODAK_LABEL, scoreCardStats, shareScoreCard } from './scoreCard'
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
      poster={shrineStillUrl(id)}
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
            Home
          </Link>
        </div>
        {world.phase === 'over' ? null : (
          <>
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
          </>
        )}
        {shrine ? (
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 22, fontWeight: 800 }}>
            {lastGateLabel(world.gatesReached)}
          </div>
        ) : null}
        {shrine ? <div style={{ marginTop: 8, textAlign: 'center', fontSize: 15 }}>tap to continue</div> : null}
        {showHint ? <div style={{ marginTop: 10, fontSize: 15 }}>swipe to change lane · swipe up to jump</div> : null}
      </div>

      {world.phase === 'over' ? <ScoreCard world={world} /> : null}
    </div>
  )
}

function ScoreCard({ world }: { world: Snapshot }) {
  const stats = scoreCardStats(world)
  const [shareLabel, setShareLabel] = useState('Share')
  const sharing = useRef(false)

  const onShare = async () => {
    if (sharing.current) return
    sharing.current = true
    setShareLabel('Sharing…')
    try {
      const result = await shareScoreCard(stats)
      setShareLabel(result === 'download' ? 'Saved image' : 'Shared')
    } catch {
      setShareLabel('Share')
    } finally {
      sharing.current = false
    }
  }

  return (
    <div
      style={{
        pointerEvents: 'auto',
        position: 'absolute',
        left: 16,
        right: 16,
        top: 'max(72px, env(safe-area-inset-top))',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          background: 'rgba(20, 8, 14, 0.94)',
          border: '1px solid #f0c070',
          borderRadius: 16,
          padding: 18,
          maxHeight: '100%',
          overflow: 'auto',
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: 1.4, color: '#ffc53d', fontWeight: 700 }}>MUSHIKA RUN</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>Bhuk caught you</div>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#ff9a2a', marginTop: 8, lineHeight: 1 }}>{stats.score}</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>score</div>
        <div style={{ marginTop: 14, fontSize: 18, fontWeight: 700 }}>{stats.distanceM} m covered</div>

        <div style={{ marginTop: 16, fontSize: 13, letterSpacing: 0.6, color: '#ffc53d', fontWeight: 700 }}>Modaks eaten</div>
        {(Object.keys(MODAK_LABEL) as Array<keyof typeof MODAK_LABEL>).map((kind) => (
          <div key={kind} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 16 }}>
            <span>{MODAK_LABEL[kind]}</span>
            <span>{stats.eaten[kind]}</span>
          </div>
        ))}

        <div style={{ marginTop: 16, fontSize: 13, letterSpacing: 0.6, color: '#ffc53d', fontWeight: 700 }}>Gates crossed</div>
        {stats.gates.length === 0 ? (
          <div style={{ marginTop: 6 }}>none yet</div>
        ) : (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {stats.gates.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          data-skip-input=""
          onClick={() => void onShare()}
          style={{
            marginTop: 18,
            width: '100%',
            border: '1px solid #ffd27a',
            background: '#e24b2c',
            color: '#fff8e8',
            fontWeight: 800,
            fontSize: 16,
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          {shareLabel}
        </button>
        <div style={{ marginTop: 12, fontWeight: 700, textAlign: 'center' }}>tap or Space — run again</div>
      </div>
    </div>
  )
}
