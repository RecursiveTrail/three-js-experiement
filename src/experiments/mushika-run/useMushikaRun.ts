import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { assetUrl } from '../../shared/assetUrl'
import { createMushikaPlayer } from './audio'
import { subscribeMushikaInput, type Command } from './input'
import { initialSnapshot, reduce, type Event } from './reduce'

export function useMushikaRun() {
  const [world, dispatch] = useReducer(
    (s: ReturnType<typeof initialSnapshot>, ev: Event) => reduce(s, ev, Math.random),
    undefined,
    initialSnapshot,
  )
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const player = useMemo(
    () => createMushikaPlayer({ basePath: assetUrl('assets/mushika-run/audio') }),
    [],
  )

  const tick = useCallback((dt: number) => {
    dispatch({ type: 'tick', dt })
  }, [])

  useEffect(() => {
    if (world.seq === 0 || !world.cue) return
    void player.play(world.cue)
  }, [world.seq, world.cue, player])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onCommand = (command: Command) => {
      void player.unlock()
      dispatch({ type: command })
    }
    const stop = subscribeMushikaInput(
      window,
      root,
      onCommand,
      () => document.visibilityState === 'visible' && location.pathname === '/mushika-run',
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

  return { world, rootRef, tick }
}
