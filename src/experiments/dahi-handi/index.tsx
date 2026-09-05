import { DahiBoundary } from './DahiBoundary'
import { DahiHandi } from './DahiHandi'
import { Overlays } from './Overlays'
import { useDahiHandi } from './useDahiHandi'

export function DahiHandiPage() {
  const { world, rootRef } = useDahiHandi()
  return (
    <div ref={rootRef} style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <DahiBoundary
        fallback={<div style={{ padding: 24, color: '#f4e6c1' }}>The room could not load. Try refresh.</div>}
      >
        <DahiHandi world={world} />
      </DahiBoundary>
      <Overlays smashCount={world.smashCount} />
    </div>
  )
}
