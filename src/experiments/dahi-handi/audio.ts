export type SmashSound = 'crack' | 'clap'

type Source = { stop: () => void; disconnect: () => void }

export type SmashPlayer = {
  playSmash(): Promise<void>
  stopAll(): void
  dispose(): void
}

const NAMES: SmashSound[] = ['crack', 'clap']

export function createSmashPlayer(opts: {
  basePath: string
  fetchImpl?: typeof fetch
  decode?: (ctx: AudioContext, buf: ArrayBuffer) => Promise<AudioBuffer>
  context?: AudioContext
}): SmashPlayer {
  const fetchImpl = opts.fetchImpl ?? fetch
  const ownsContext = opts.context === undefined
  let ctx = opts.context
  let generation = 0
  const live = new Set<Source>()
  const cache = new Map<SmashSound, AudioBuffer>()

  function ensureCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext()
    return ctx
  }

  function stopAll() {
    generation++
    for (const src of live) {
      try {
        src.stop()
      } catch {
        // already stopped
      }
      src.disconnect()
    }
    live.clear()
  }

  async function playOne(name: SmashSound, playGen: number): Promise<void> {
    try {
      const audio = ensureCtx()
      if (audio.state === 'suspended') await audio.resume()
      let buffer = cache.get(name)
      if (!buffer) {
        const res = await fetchImpl(`${opts.basePath}/${name}.mp3`)
        if (playGen !== generation) return
        if (!res.ok) return
        const raw = await res.arrayBuffer()
        buffer = opts.decode ? await opts.decode(audio, raw) : await audio.decodeAudioData(raw)
        if (playGen !== generation) return
        cache.set(name, buffer)
      }
      if (playGen !== generation) return
      const src = audio.createBufferSource()
      const gain = audio.createGain()
      gain.gain.value = 1
      src.buffer = buffer
      src.connect(gain)
      gain.connect(audio.destination)
      live.add(src)
      src.onended = () => {
        live.delete(src)
      }
      src.start()
    } catch {
      // missing file or decode failure — skip
    }
  }

  return {
    async playSmash() {
      const playGen = generation
      await Promise.all(NAMES.map((name) => playOne(name, playGen)))
    },
    stopAll,
    dispose() {
      stopAll()
      cache.clear()
      if (ownsContext && ctx) {
        void ctx.close()
        ctx = undefined
      }
    },
  }
}
