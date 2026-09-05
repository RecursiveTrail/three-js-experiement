import type { KeyFamily } from '../../shared/input/families'

export type LogicalAction =
  | 'idle'
  | 'ignore'
  | 'eat'
  | 'walk'
  | 'trot'
  | 'jump'
  | 'pounce'
  | 'stunt'
  | 'meow'
  | 'chirp'
  | 'purr'

export type Nudge = {
  key: string
  family: KeyFamily
  at: number
}

export type Rng = () => number

export const ALL_PLAYABLE = [
  'eat',
  'walk',
  'trot',
  'jump',
  'pounce',
  'stunt',
  'meow',
  'chirp',
  'purr',
] as const satisfies readonly LogicalAction[]

export const FAMILY_ACTIONS: Record<KeyFamily, readonly LogicalAction[]> = {
  voice: ['meow', 'chirp', 'purr'],
  move: ['walk', 'trot', 'eat'],
  jump: ['jump', 'pounce'],
  stunt: ['stunt', 'pounce'],
  wild: ALL_PLAYABLE,
}
