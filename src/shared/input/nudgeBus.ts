import type { Nudge } from '../../experiments/cat-world/actions'
import { familyFromKey } from './families'

export function subscribeNudges(
  target: Window,
  onNudge: (nudge: Nudge) => void,
  isActive: () => boolean,
): () => void {
  const onKey = (event: KeyboardEvent) => {
    if (event.repeat) return
    if (!isActive()) return
    onNudge({ key: event.key, family: familyFromKey(event.key), at: event.timeStamp })
  }
  target.addEventListener('keydown', onKey)
  return () => target.removeEventListener('keydown', onKey)
}
