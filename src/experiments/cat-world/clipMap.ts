import type { LogicalAction } from './actions'

export type PackClip = 'Idle' | 'Idle_Eating' | 'Walk' | 'Run' | 'Jump_Start' | 'Headbutt'
export type SoundName = 'meow' | 'chirp' | 'purr' | 'paw' | 'land'

export type ClipBinding = {
  clip: PackClip
  loop: boolean
  sound: SoundName | null
  soundGain: number
}

const BINDINGS: Record<LogicalAction, ClipBinding> = {
  idle: { clip: 'Idle', loop: true, sound: null, soundGain: 1 },
  ignore: { clip: 'Idle', loop: true, sound: null, soundGain: 1 },
  eat: { clip: 'Idle_Eating', loop: true, sound: 'purr', soundGain: 0.6 },
  walk: { clip: 'Walk', loop: true, sound: 'paw', soundGain: 0.25 },
  trot: { clip: 'Run', loop: true, sound: 'paw', soundGain: 0.35 },
  jump: { clip: 'Jump_Start', loop: false, sound: 'land', soundGain: 0.5 },
  pounce: { clip: 'Jump_Start', loop: false, sound: 'land', soundGain: 0.5 },
  stunt: { clip: 'Headbutt', loop: false, sound: 'chirp', soundGain: 0.7 },
  meow: { clip: 'Idle', loop: false, sound: 'meow', soundGain: 1 },
  chirp: { clip: 'Idle', loop: false, sound: 'chirp', soundGain: 1 },
  purr: { clip: 'Idle_Eating', loop: true, sound: 'purr', soundGain: 0.6 },
}

export function bindingFor(action: LogicalAction): ClipBinding {
  return BINDINGS[action]
}
