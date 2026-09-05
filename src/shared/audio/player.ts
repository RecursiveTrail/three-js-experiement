import type { SoundName } from '../../experiments/cat-world/clipMap'

export type AudioPlayer = {
  play(name: SoundName, opts?: { gain?: number }): Promise<void>
  stopAll(): void
  dispose(): void
}

type Source = { stop: () => void; disconnect: () => void }

export function createAudioPlayer(opts: {
  basePath: string
  fetchImpl?: typeof fetch
  decode?: (ctx: AudioContext, buf: ArrayBuffer) => Promise<AudioBuffer>
  context?: AudioContext
}): AudioPlayer {
  const fetchImpl = opts.fetchImpl ?? fetch
  let ctx = opts.context
  let current: Source | null = null
  const cache = new Map<SoundName, AudioBuffer>()

  function ensureCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext()
    return ctx
  }

  function stopAll() {
    try {
      current?.stop()
    } catch {
      // already stopped
    }
    current?.disconnect()
    current = null
  }

  async function play(name: SoundName, playOpts?: { gain?: number }): Promise<void> {
    try {
      const audio = ensureCtx()
      if (audio.state === 'suspended') await audio.resume()
      let buffer = cache.get(name)
      if (!buffer) {
        const res = await fetchImpl(`${opts.basePath}/${name}.mp3`)
        if (!res.ok) return
        const raw = await res.arrayBuffer()
        buffer = opts.decode ? await opts.decode(audio, raw) : await audio.decodeAudioData(raw)
        cache.set(name, buffer)
      }
      stopAll()
      const src = audio.createBufferSource()
      const gain = audio.createGain()
      gain.gain.value = playOpts?.gain ?? 1
      src.buffer = buffer
      src.connect(gain)
      gain.connect(audio.destination)
      current = src
      src.onended = () => {
        if (current === src) current = null
      }
      src.start()
    } catch {
      // missing file or decode failure — skip
    }
  }

  return {
    play,
    stopAll,
    dispose() {
      stopAll()
      cache.clear()
    },
  }
}
