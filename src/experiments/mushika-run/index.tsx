import { MushikaBoundary } from './MushikaBoundary'
import { MushikaRun } from './MushikaRun'
import { Overlays } from './Overlays'
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
      <MushikaBoundary
        fallback={<div style={{ padding: 24, color: '#f4e6c1' }}>The street could not load. Try refresh.</div>}
      >
        <MushikaRun world={world} onTick={tick} />
      </MushikaBoundary>
      <Overlays world={world} />
    </div>
  )
}
