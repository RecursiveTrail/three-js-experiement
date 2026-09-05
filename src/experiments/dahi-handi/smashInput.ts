export function subscribeSmashInput(
  windowTarget: Window,
  root: HTMLElement,
  onJump: () => void,
  isActive: () => boolean,
): () => void {
  const onKey = (event: KeyboardEvent) => {
    if (event.repeat) return
    if (!isActive()) return
    if (event.key !== ' ') return
    event.preventDefault()
    onJump()
  }
  const onPointer = (event: PointerEvent) => {
    if (!isActive()) return
    const t = event.target
    if (t instanceof Element && t.closest('a')) return
    onJump()
  }
  windowTarget.addEventListener('keydown', onKey)
  root.addEventListener('pointerdown', onPointer)
  return () => {
    windowTarget.removeEventListener('keydown', onKey)
    root.removeEventListener('pointerdown', onPointer)
  }
}
