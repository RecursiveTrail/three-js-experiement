import { describe, expect, it } from 'vitest'
import { bindingFor } from './clipMap'
import type { LogicalAction } from './actions'
import { ALL_PLAYABLE } from './actions'

describe('CatActor clip guard', () => {
  it('every action resolves to a safe pack clip', () => {
    const allowed = new Set(['Idle', 'Idle_Eating', 'Walk', 'Run', 'Jump_Start', 'Headbutt'])
    const actions: LogicalAction[] = ['idle', 'ignore', ...ALL_PLAYABLE]
    for (const a of actions) expect(allowed.has(bindingFor(a).clip)).toBe(true)
  })
})
