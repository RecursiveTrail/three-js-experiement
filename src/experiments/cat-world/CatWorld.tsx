import { Suspense } from 'react'
import type { MutableRefObject } from 'react'
import { ExperienceCanvas } from '../../shared/r3f/ExperienceCanvas'
import type { LogicalAction } from './actions'
import { PlaceholderCat, RiggedCat } from './CatActor'
import { CatBoundary } from './CatBoundary'
import { FollowCamera } from './FollowCamera'
import { Yard } from './Yard'

export function CatWorld({
  action,
  seq,
  onActionEnd,
  positionRef,
}: {
  action: LogicalAction
  seq: number
  onActionEnd: () => void
  positionRef: MutableRefObject<[number, number, number]>
}) {
  return (
    <ExperienceCanvas>
      <Yard />
      <FollowCamera target={positionRef} />
      <CatBoundary fallback={<PlaceholderCat action={action} onActionEnd={onActionEnd} />}>
        <Suspense fallback={<PlaceholderCat action={action} onActionEnd={onActionEnd} />}>
          <RiggedCat action={action} seq={seq} onActionEnd={onActionEnd} positionRef={positionRef} />
        </Suspense>
      </CatBoundary>
    </ExperienceCanvas>
  )
}
