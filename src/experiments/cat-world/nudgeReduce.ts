import { commandFromKey } from '../../shared/input/commandFromKey'
import type { LogicalAction, Nudge, Rng } from './actions'
import { factFor } from './facts'
import { DEFAULT_FACING, type MoveMode, type Vec3 } from './idleLife'
import { advanceQueue, emptyQueue, offerReaction, pickReaction, type ReactionQueue } from './reactionPicker'

export type WorldState = {
  queue: ReactionQueue
  action: LogicalAction
  lastKey: string | null
  fact: string | null
  seq: number
  facing: Vec3
  moveMode: MoveMode
}

export function initialWorld(): WorldState {
  return {
    queue: emptyQueue(),
    action: 'idle',
    lastKey: null,
    fact: null,
    seq: 0,
    facing: DEFAULT_FACING,
    moveMode: 'wander',
  }
}

const INTERRUPTIBLE: ReadonlySet<LogicalAction> = new Set([
  'idle',
  'ignore',
  'eat',
  'walk',
  'trot',
  'purr',
])

function startAction(
  state: WorldState,
  action: LogicalAction,
  nudge: Nudge,
  rng: Rng,
  extra: Pick<WorldState, 'facing' | 'moveMode'>,
): WorldState {
  return {
    queue: { current: action, next: null },
    action,
    lastKey: nudge.key,
    fact: factFor(action, rng),
    seq: state.seq + 1,
    facing: extra.facing,
    moveMode: extra.moveMode,
  }
}

export function reduceNudge(state: WorldState, nudge: Nudge, rng: Rng): WorldState {
  const cmd = commandFromKey(nudge.key)

  if (cmd.type === 'step') {
    return startAction(state, 'walk', nudge, rng, { facing: cmd.dir, moveMode: 'step' })
  }
  if (cmd.type === 'jump') {
    return startAction(state, 'jump', nudge, rng, { facing: state.facing, moveMode: 'step' })
  }

  const picked = pickReaction({ ...nudge, family: cmd.family }, rng)
  const fact = factFor(picked, rng)

  if (state.queue.current === null || INTERRUPTIBLE.has(state.action)) {
    return {
      queue: { current: picked, next: null },
      action: picked,
      lastKey: nudge.key,
      fact,
      seq: state.seq + 1,
      facing: state.facing,
      moveMode: 'wander',
    }
  }

  const queue = offerReaction({ current: state.action, next: state.queue.next }, picked)
  return { ...state, queue, lastKey: nudge.key, fact }
}

export function reduceActionEnd(state: WorldState, rng: Rng): WorldState {
  const queue = advanceQueue(state.queue)
  if (queue.current) {
    return { ...state, queue, action: queue.current, moveMode: 'wander', seq: state.seq + 1 }
  }
  const r = rng()
  const action: LogicalAction = r < 0.1 ? 'walk' : r < 0.3 ? 'eat' : 'idle'
  return {
    ...state,
    queue: { current: action, next: null },
    action,
    moveMode: 'wander',
    seq: state.seq + 1,
  }
}
