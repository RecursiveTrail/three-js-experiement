export type Command = 'laneLeft' | 'laneRight' | 'jump'

export const SWIPE_PX = 30

export function commandFromSwipe(dx: number, dy: number): Command | null {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax < SWIPE_PX && ay < SWIPE_PX) return null
  if (ax >= ay) return dx < 0 ? 'laneLeft' : 'laneRight'
  if (dy < 0) return 'jump'
  return null
}

export function commandFromKey(event: KeyboardEvent): Command | null {
  if (event.repeat) return null
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') return 'laneLeft'
  if (event.code === 'ArrowRight' || event.code === 'KeyD') return 'laneRight'
  if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') return 'jump'
  return null
}

function skipInputTarget(event: Event): boolean {
  const t = event.target
  return t instanceof Element && (t.closest('a') !== null || t.closest('[data-skip-input]') !== null)
}

export function subscribeMushikaInput(
  windowTarget: Window,
  root: HTMLElement,
  onCommand: (command: Command) => void,
  isActive: () => boolean,
): () => void {
  let down: { x: number; y: number; ignore: boolean; pointerId: number } | null = null

  const onKey = (event: KeyboardEvent) => {
    if (!isActive()) return
    const command = commandFromKey(event)
    if (!command) return
    if (event.code === 'Space') event.preventDefault()
    onCommand(command)
  }

  const onPointerDown = (event: PointerEvent) => {
    down = { x: event.clientX, y: event.clientY, ignore: skipInputTarget(event), pointerId: event.pointerId }
    try {
      root.setPointerCapture(event.pointerId)
    } catch {
      // jsdom / already-released pointers
    }
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!down || event.pointerId !== down.pointerId) return
    const start = down
    down = null
    try {
      root.releasePointerCapture(event.pointerId)
    } catch {
      // capture may already be cleared
    }
    if (!isActive() || start.ignore) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const swipe = commandFromSwipe(dx, dy)
    if (swipe) {
      onCommand(swipe)
      return
    }
    if (Math.hypot(dx, dy) < SWIPE_PX) onCommand('jump')
  }

  const onPointerCancel = (event: PointerEvent) => {
    if (down && event.pointerId !== down.pointerId) return
    down = null
    try {
      root.releasePointerCapture(event.pointerId)
    } catch {
      // capture may already be cleared
    }
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!isActive()) return
    event.preventDefault()
  }

  windowTarget.addEventListener('keydown', onKey)
  root.addEventListener('pointerdown', onPointerDown)
  root.addEventListener('pointerup', onPointerUp)
  root.addEventListener('pointercancel', onPointerCancel)
  root.addEventListener('touchmove', onTouchMove, { passive: false })
  return () => {
    windowTarget.removeEventListener('keydown', onKey)
    root.removeEventListener('pointerdown', onPointerDown)
    root.removeEventListener('pointerup', onPointerUp)
    root.removeEventListener('pointercancel', onPointerCancel)
    root.removeEventListener('touchmove', onTouchMove)
  }
}
