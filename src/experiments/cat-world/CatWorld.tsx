import { Suspense, useCallback, useRef, useState } from 'react'
import { ExperienceCanvas } from '../../shared/r3f/ExperienceCanvas'
import { CatBoundary } from './CatBoundary'
import { PlaceholderCat, RiggedCat } from './CatActor'
import { Yard } from './Yard'
import type { LogicalAction } from './actions'

export function CatWorld() {
  const [action, setAction] = useState<LogicalAction>('idle')
  const positionRef = useRef<[number, number, number]>([0, 0, 0])
  const onActionEnd = useCallback(() => setAction('idle'), [])
  const cat = (
    <RiggedCat action={action} onActionEnd={onActionEnd} positionRef={positionRef} />
  )
  return (
    <ExperienceCanvas>
      <Yard />
      <CatBoundary fallback={<PlaceholderCat action={action} onActionEnd={onActionEnd} />}>
        <Suspense fallback={<PlaceholderCat action={action} onActionEnd={onActionEnd} />}>
          {cat}
        </Suspense>
      </CatBoundary>
    </ExperienceCanvas>
  )
}
