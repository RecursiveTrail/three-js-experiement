import { MushikaBoundary } from './MushikaBoundary'
import { MushikaRun } from './MushikaRun'
import { Overlays, ShrineBackdrop } from './Overlays'
import { useMushikaRun } from './useMushikaRun'

export function MushikaRunPage() {
  const { world, rootRef, tick } = useMushikaRun()
  return (
    <div
      ref={rootRef}
      className="mushika-run-root"
      tabIndex={-1}
      style={{
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        outline: 'none',
        touchAction: 'none',
        background: '#6b303c',
      }}
    >
      <ShrineBackdrop world={world} />
      <MushikaBoundary
        fallback={<div style={{ padding: 24, color: '#f4e6c1' }}>The street could not load. Try refresh.</div>}
      >
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          <MushikaRun world={world} onTick={tick} />
        </div>
      </MushikaBoundary>
      <Overlays world={world} />
    </div>
  )
}
