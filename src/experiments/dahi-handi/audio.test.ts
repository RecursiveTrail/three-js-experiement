import { describe, expect, it, vi } from 'vitest'
import { createSmashPlayer } from './audio'

function mockContext() {
  const started: string[] = []
  const stopped: string[] = []
  const sources: { stop: () => void }[] = []
  const ctx = {
    currentTime: 0,
    state: 'running' as AudioContextState,
    resume: vi.fn(async () => {}),
    decodeAudioData: vi.fn(async () => ({ duration: 1 })),
    createBufferSource() {
      const src = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(),
        start: vi.fn(() => started.push('start')),
        stop: vi.fn(() => stopped.push('stop')),
        disconnect: vi.fn(),
        onended: null as (() => void) | null,
      }
      sources.push(src)
      return src
    },
    createGain() {
      return { gain: { value: 1 }, connect: vi.fn() }
    },
    destination: {},
  }
  return { ctx: ctx as unknown as AudioContext, started, stopped, sources }
}

describe('createSmashPlayer', () => {
  it('starts crack and clap without stopping the first', async () => {
    const { ctx, started, stopped } = mockContext()
    const player = createSmashPlayer({
      basePath: '/assets/dahi-handi/audio',
      context: ctx,
      fetchImpl: (async () => new Response(new ArrayBuffer(8))) as typeof fetch,
      decode: async () => ({ duration: 1 }) as AudioBuffer,
    })
    await player.playSmash()
    expect(started).toHaveLength(2)
    expect(stopped).toHaveLength(0)
    player.dispose()
  })

  it('resolves when a file is missing', async () => {
    const { ctx } = mockContext()
    const player = createSmashPlayer({
      basePath: '/assets/dahi-handi/audio',
      context: ctx,
      fetchImpl: (async () => {
        throw new Error('404')
      }) as typeof fetch,
    })
    await expect(player.playSmash()).resolves.toBeUndefined()
    player.dispose()
  })

  it('stopAll stops live sources', async () => {
    const { ctx, stopped } = mockContext()
    const player = createSmashPlayer({
      basePath: '/assets/dahi-handi/audio',
      context: ctx,
      fetchImpl: (async () => new Response(new ArrayBuffer(8))) as typeof fetch,
      decode: async () => ({ duration: 1 }) as AudioBuffer,
    })
    await player.playSmash()
    player.stopAll()
    expect(stopped.length).toBeGreaterThanOrEqual(2)
    player.dispose()
  })
})
