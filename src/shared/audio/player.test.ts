import { describe, expect, it, vi } from 'vitest'
import { createAudioPlayer } from './player'

function mockContext() {
  const started: string[] = []
  const stopped: string[] = []
  const ctx = {
    currentTime: 0,
    state: 'running',
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
      return src
    },
    createGain() {
      return { gain: { value: 1 }, connect: vi.fn() }
    },
    destination: {},
  }
  return { ctx: ctx as unknown as AudioContext, started, stopped }
}

describe('createAudioPlayer', () => {
  it('stops the previous voice before playing another', async () => {
    const { ctx, stopped } = mockContext()
    const player = createAudioPlayer({
      basePath: '/assets/cat-world/audio',
      context: ctx,
      fetchImpl: (async () => new Response(new ArrayBuffer(8))) as typeof fetch,
      decode: async () => ({ duration: 1 }) as AudioBuffer,
    })
    await player.play('meow')
    await player.play('chirp')
    expect(stopped.length).toBeGreaterThanOrEqual(1)
    player.dispose()
  })

  it('does not start a voice after stopAll during fetch', async () => {
    const { ctx, started } = mockContext()
    let resolveFetch!: (value: Response) => void
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    const player = createAudioPlayer({
      basePath: '/assets/cat-world/audio',
      context: ctx,
      fetchImpl: (async () => fetchPromise) as typeof fetch,
      decode: async () => ({ duration: 1 }) as AudioBuffer,
    })
    const playPromise = player.play('meow')
    player.stopAll()
    resolveFetch(new Response(new ArrayBuffer(8)))
    await playPromise
    expect(started).toHaveLength(0)
    player.dispose()
  })

  it('resolves when the file is missing', async () => {
    const { ctx } = mockContext()
    const player = createAudioPlayer({
      basePath: '/assets/cat-world/audio',
      context: ctx,
      fetchImpl: (async () => { throw new Error('404') }) as typeof fetch,
    })
    await expect(player.play('meow')).resolves.toBeUndefined()
    player.dispose()
  })
})
