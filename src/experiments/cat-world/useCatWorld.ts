import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { assetUrl } from '../../shared/assetUrl'
import { createAudioPlayer } from '../../shared/audio/player'
import { subscribeNudges } from '../../shared/input/nudgeBus'
import type { Nudge } from './actions'
import { bindingFor } from './clipMap'
import { endTimeoutMs } from './idleLife'
import { initialWorld, reduceActionEnd, reduceNudge, type WorldState } from './nudgeReduce'

export function useCatWorld() {
  const [state, dispatch] = useReducer(
    (s: WorldState, ev: { type: 'nudge'; nudge: Nudge } | { type: 'end' }) => {
      if (ev.type === 'nudge') return reduceNudge(s, ev.nudge, Math.random)
      return reduceActionEnd(s, Math.random)
    },
    undefined,
    initialWorld,
  )
  const location = useLocation()
  const positionRef = useRef<[number, number, number]>([0, 0, 0])
  const player = useMemo(
    () => createAudioPlayer({ basePath: assetUrl('assets/cat-world/audio') }),
    [],
  )

  useEffect(() => {
    const binding = bindingFor(state.action)
    if (binding.sound && state.action !== 'ignore' && state.action !== 'idle') {
      void player.play(binding.sound, { gain: binding.soundGain })
    }
  }, [state.action, state.seq, player])

  useEffect(() => {
    const stop = subscribeNudges(
      window,
      (nudge) => dispatch({ type: 'nudge', nudge }),
      () => document.visibilityState === 'visible' && location.pathname === '/cat-world',
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

  useEffect(() => {
    const ms = endTimeoutMs(state.action, state.moveMode)
    if (ms === null) return
    const t = window.setTimeout(() => dispatch({ type: 'end' }), ms)
    return () => window.clearTimeout(t)
  }, [state.action, state.moveMode, state.seq])

  useEffect(() => {
    if (state.action !== 'idle' || state.queue.next !== null) return
    const t = window.setTimeout(() => dispatch({ type: 'end' }), 8000)
    return () => window.clearTimeout(t)
  }, [state.action, state.queue.next, state.seq])

  const onActionEnd = useCallback(() => dispatch({ type: 'end' }), [])

  return {
    action: state.action,
    seq: state.seq,
    facing: state.facing,
    moveMode: state.moveMode,
    lastKey: state.lastKey,
    fact: state.fact,
    positionRef,
    onActionEnd,
  }
}
