export type KeyFamily = 'voice' | 'move' | 'jump' | 'stunt' | 'wild'

const VOICE = new Set(['a', 'e', 'i', 'o', 'u'])
const MOVE = new Set(['s', 'd', 'f', 'g', 'h', 'j', 'k', 'l'])

export function familyFromKey(key: string): KeyFamily {
  if (key === ' ' || key === 'Enter') return 'jump'
  if (/^[0-9]$/.test(key)) return 'stunt'
  const k = key.length === 1 ? key.toLowerCase() : key
  if (VOICE.has(k)) return 'voice'
  if (MOVE.has(k)) return 'move'
  return 'wild'
}
