import type { LogicalAction, Nudge, Rng } from './actions'
import { ALL_PLAYABLE, FAMILY_ACTIONS } from './actions'

export type { LogicalAction, Nudge, Rng } from './actions'
export { ALL_PLAYABLE, FAMILY_ACTIONS } from './actions'

export type ReactionQueue = {
  current: LogicalAction | null
  next: LogicalAction | null
}

export function emptyQueue(): ReactionQueue {
  return { current: null, next: null }
}

export function offerReaction(queue: ReactionQueue, action: LogicalAction): ReactionQueue {
  if (queue.current === null) return { current: action, next: null }
  return { current: queue.current, next: action }
}

export function advanceQueue(queue: ReactionQueue): ReactionQueue {
  return { current: queue.next, next: null }
}

function pickFrom(list: readonly LogicalAction[], rng: Rng): LogicalAction {
  const i = Math.min(list.length - 1, Math.floor(rng() * list.length))
  return list[i] ?? 'idle'
}

export function pickReaction(nudge: Nudge, rng: Rng): LogicalAction {
  const r0 = rng()
  if (r0 < 0.15) return 'ignore'
  const familyPool = FAMILY_ACTIONS[nudge.family]
  if (r0 < 0.7) return pickFrom(familyPool, rng)
  const others = ALL_PLAYABLE.filter((a) => !familyPool.includes(a))
  return pickFrom(others.length > 0 ? others : ALL_PLAYABLE, rng)
}
