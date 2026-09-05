import { CatWorld } from './CatWorld'
import { Overlays } from './Overlays'
import { useCatWorld } from './useCatWorld'

export function CatWorldPage() {
  const world = useCatWorld()
  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <CatWorld
        action={world.action}
        onActionEnd={world.onActionEnd}
        positionRef={world.positionRef}
      />
      <Overlays lastKey={world.lastKey} fact={world.fact} />
    </div>
  )
}
