import type { LogicalAction, Nudge, Rng } from './actions'
import { advanceQueue, emptyQueue, offerReaction, pickReaction, type ReactionQueue } from './reactionPicker'
import { factFor } from './facts'

export type WorldState = {
  queue: ReactionQueue
  action: LogicalAction
  lastKey: string | null
  fact: string | null
}

export function initialWorld(): WorldState {
  return { queue: emptyQueue(), action: 'idle', lastKey: null, fact: null }
}

const INTERRUPTIBLE: ReadonlySet<LogicalAction> = new Set([
  'idle',
  'ignore',
  'eat',
  'walk',
  'trot',
  'purr',
])

export function reduceNudge(state: WorldState, nudge: Nudge, rng: Rng): WorldState {
  const picked = pickReaction(nudge, rng)
  const fact = factFor(picked, rng)
  if (state.queue.current === null || INTERRUPTIBLE.has(state.action)) {
    return {
      queue: { current: picked, next: null },
      action: picked,
      lastKey: nudge.key,
      fact,
    }
  }
  const queue = offerReaction({ current: state.action, next: state.queue.next }, picked)
  return { queue, action: state.action, lastKey: nudge.key, fact }
}

export function reduceActionEnd(state: WorldState, rng: Rng): WorldState {
  const queue = advanceQueue(state.queue)
  if (queue.current) return { ...state, queue, action: queue.current }
  const r = rng()
  const action: LogicalAction = r < 0.1 ? 'walk' : r < 0.3 ? 'eat' : 'idle'
  return { ...state, queue: { current: action, next: null }, action }
}
