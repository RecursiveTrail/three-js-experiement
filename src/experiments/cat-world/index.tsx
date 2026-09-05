import { CatBoundary } from './CatBoundary'
import { CatWorld } from './CatWorld'
import { Overlays } from './Overlays'
import { useCatWorld } from './useCatWorld'

export function CatWorldPage() {
  const world = useCatWorld()
  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <CatBoundary
        fallback={
          <div style={{ padding: 24, color: '#2b2118' }}>The yard could not load. Try refresh.</div>
        }
      >
        <CatWorld
          action={world.action}
          seq={world.seq}
          facing={world.facing}
          moveMode={world.moveMode}
          onActionEnd={world.onActionEnd}
          positionRef={world.positionRef}
        />
      </CatBoundary>
      <Overlays lastKey={world.lastKey} fact={world.fact} />
    </div>
  )
}
