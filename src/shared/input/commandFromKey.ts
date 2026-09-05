import { familyFromKey, type KeyFamily } from './families'

export type StepDir = [number, number, number]

export type Command =
  | { type: 'step'; dir: StepDir }
  | { type: 'jump' }
  | { type: 'nudge'; family: KeyFamily }

const UP: StepDir = [0, 0, -1]
const DOWN: StepDir = [0, 0, 1]
const LEFT: StepDir = [-1, 0, 0]
const RIGHT: StepDir = [1, 0, 0]

export function commandFromKey(key: string): Command {
  const k = key.length === 1 ? key.toLowerCase() : key
  if (k === 'w' || k === 'ArrowUp') return { type: 'step', dir: UP }
  if (k === 's' || k === 'ArrowDown') return { type: 'step', dir: DOWN }
  if (k === 'a' || k === 'ArrowLeft') return { type: 'step', dir: LEFT }
  if (k === 'd' || k === 'ArrowRight') return { type: 'step', dir: RIGHT }
  if (k === ' ') return { type: 'jump' }
  return { type: 'nudge', family: familyFromKey(key) }
}
