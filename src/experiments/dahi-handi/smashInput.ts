export function isSmashKey(event: KeyboardEvent): boolean {
  if (event.key === ' ' || event.key === 'Enter' || event.key === 'Select') return true
  if (event.code === 'Space' || event.code === 'Enter' || event.code === 'NumpadEnter') return true
  // Android / Google TV d-pad center (KEYCODE_DPAD_CENTER)
  return event.keyCode === 23
}

function isLinkTarget(event: Event): boolean {
  const t = event.target
  return t instanceof Element && t.closest('a') !== null
}

/** Space always smashes. Enter / TV OK smash only when not on a link. */
export function shouldSmashFromKey(event: KeyboardEvent): boolean {
  if (!isSmashKey(event)) return false
  const space = event.key === ' ' || event.code === 'Space'
  if (space) return true
  return !isLinkTarget(event)
}

export function prefersTvRemote(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return !window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function subscribeSmashInput(
  windowTarget: Window,
  root: HTMLElement,
  onJump: () => void,
  isActive: () => boolean,
): () => void {
  const onKey = (event: KeyboardEvent) => {
    if (event.repeat) return
    if (!isActive()) return
    if (!shouldSmashFromKey(event)) return
    event.preventDefault()
    onJump()
  }
  const onPointer = (event: PointerEvent) => {
    if (!isActive()) return
    if (isLinkTarget(event)) return
    onJump()
  }
  windowTarget.addEventListener('keydown', onKey)
  root.addEventListener('pointerdown', onPointer)
  return () => {
    windowTarget.removeEventListener('keydown', onKey)
    root.removeEventListener('pointerdown', onPointer)
  }
}
