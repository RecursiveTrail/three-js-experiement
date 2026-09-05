import { useEffect, useMemo, useReducer, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { assetUrl } from '../../shared/assetUrl'
import { createSmashPlayer } from './audio'
import { initialWorld, phaseDurationS, reduce, type WorldEvent } from './reduce'
import { subscribeSmashInput } from './smashInput'

export function useDahiHandi() {
  const [world, dispatch] = useReducer(
    (s: ReturnType<typeof initialWorld>, ev: WorldEvent) => reduce(s, ev, Math.random),
    undefined,
    () => initialWorld(Math.random),
  )
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const player = useMemo(
    () => createSmashPlayer({ basePath: assetUrl('assets/dahi-handi/audio') }),
    [],
  )

  useEffect(() => {
    if (world.seq === 0) return
    void player.playSmash()
  }, [world.seq, player])

  useEffect(() => {
    const ms = phaseDurationS(world)
    if (ms === null) return
    const t = window.setTimeout(() => dispatch({ type: 'end' }), ms * 1000)
    return () => window.clearTimeout(t)
  }, [world.animSeq, world.phase])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const stop = subscribeSmashInput(
      window,
      root,
      () => dispatch({ type: 'jump' }),
      () => document.visibilityState === 'visible' && location.pathname === '/dahi-handi',
    )
    const onVis = () => {
      if (document.visibilityState === 'hidden') player.stopAll()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVis)
      player.stopAll()
      player.dispose()
    }
  }, [player, location.pathname])

  return { world, rootRef }
}
