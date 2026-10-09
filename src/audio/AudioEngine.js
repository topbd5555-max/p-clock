/* ============================================================
   P-Clock Audio Engine
   Web Audio API দিয়ে real-time sound generate করে।
   কোনো external file/URL লাগে না — 100% offline, 100% secure।
   ============================================================ */

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.nodes = []
    this.masterGain = null
    this.currentSound = null
    this.volume = 0.35
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      this.ctx = new AC()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setVolume(v) {
    this.volume = v
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
    }
  }

  stop() {
    if (!this.ctx) return
    this.nodes.forEach((n) => {
      try {
        if (n.stop) n.stop()
        if (n.disconnect) n.disconnect()
      } catch (e) {
        /* ignore */
      }
    })
    this.nodes = []
    this.currentSound = null
  }

  /* ============================================================
     Binaural beat — দুই কানে সামান্য ভিন্ন frequency (headphones-এ ভালো)
     ============================================================ */
  _binaural(carrierFreq, beatFreq) {
    const ctx = this.ctx
    const left = ctx.createOscillator()
    const right = ctx.createOscillator()
    const leftGain = ctx.createGain()
    const rightGain = ctx.createGain()
    const merger = ctx.createChannelMerger(2)
    const master = ctx.createGain()

    left.type = 'sine'
    right.type = 'sine'
    left.frequency.value = carrierFreq
    right.frequency.value = carrierFreq + beatFreq
    leftGain.gain.value = 0.5
    rightGain.gain.value = 0.5
    master.gain.value = 0.9

    left.connect(leftGain).connect(merger, 0, 0)
    right.connect(rightGain).connect(merger, 0, 1)
    merger.connect(master).connect(this.masterGain)

    // Add soft pad underneath for warmth
    const pad = ctx.createOscillator()
    const padGain = ctx.createGain()
    pad.type = 'sine'
    pad.frequency.value = carrierFreq / 2
    padGain.gain.value = 0.08
    pad.connect(padGain).connect(this.masterGain)

    left.start()
    right.start()
    pad.start()

    this.nodes.push(left, right, leftGain, rightGain, merger, master, pad, padGain)
  }

  /* ============================================================
     Pink/Brown noise — rain, wind, nature
     ============================================================ */
  _noise({ type = 'pink', lowpass = 800, gain = 0.4 } = {}) {
    const ctx = this.ctx
    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    if (type === 'brown') {
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    } else {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = lowpass
    filter.Q.value = 0.7

    const outGain = ctx.createGain()
    outGain.gain.value = gain

    noise.connect(filter).connect(outGain).connect(this.masterGain)
    noise.start()

    this.nodes.push(noise, filter, outGain)
  }

  /* ============================================================
     Space drone — deep ambient tone
     ============================================================ */
  _space() {
    const ctx = this.ctx
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const osc3 = ctx.createOscillator()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    const g1 = ctx.createGain()
    const g2 = ctx.createGain()
    const g3 = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.value = 55
    osc2.type = 'sine'
    osc2.frequency.value = 82.5 // perfect fifth
    osc3.type = 'sine'
    osc3.frequency.value = 110
    lfo.frequency.value = 0.08
    lfoGain.gain.value = 4
    g1.gain.value = 0.32
    g2.gain.value = 0.18
    g3.gain.value = 0.1

    lfo.connect(lfoGain)
    lfoGain.connect(osc1.frequency)
    lfoGain.connect(osc2.frequency)

    osc1.connect(g1).connect(this.masterGain)
    osc2.connect(g2).connect(this.masterGain)
    osc3.connect(g3).connect(this.masterGain)

    osc1.start()
    osc2.start()
    osc3.start()
    lfo.start()

    this.nodes.push(osc1, osc2, osc3, lfo, lfoGain, g1, g2, g3)
  }

  /* ============================================================
     Ocean — slowly modulated filtered brown noise
     ============================================================ */
  _ocean() {
    const ctx = this.ctx
    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.5
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500
    filter.Q.value = 0.6

    const waveGain = ctx.createGain()
    waveGain.gain.value = 0.25

    // Slow amplitude modulation for wave swell
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.12
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.18

    lfo.connect(lfoGain)
    lfoGain.connect(waveGain.gain)

    noise.connect(filter).connect(waveGain).connect(this.masterGain)
    noise.start()
    lfo.start()

    this.nodes.push(noise, filter, waveGain, lfo, lfoGain)
  }

  /* ============================================================
     Mind relax — soft ambient chord (Major 7th pad)
     ============================================================ */
  _mindRelax() {
    const ctx = this.ctx
    const freqs = [220, 277.18, 329.63, 415.3] // A, C#, E, G# — A maj7
    const master = ctx.createGain()
    master.gain.value = 0.12

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = i % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.value = f
      gain.gain.value = 0.5 / freqs.length

      // gentle LFO per voice
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.05 + i * 0.02
      lfoGain.gain.value = 1.5
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start()

      osc.connect(gain).connect(master)
      osc.start()
      this.nodes.push(osc, gain, lfo, lfoGain)
    })

    master.connect(this.masterGain)
    this.nodes.push(master)
  }

  /* ============================================================
     Public play() — dispatch by sound id
     ============================================================ */
  play(soundId) {
    this.stop()
    this.currentSound = soundId
    this.init()

    switch (soundId) {
      case 'alpha':
        return this._binaural(200, 10)
      case 'beta':
        return this._binaural(200, 18)
      case 'gamma':
        return this._binaural(200, 40)
      case 'theta':
        return this._binaural(180, 6)
      case 'delta':
        return this._binaural(150, 2)
      case 'nature':
        return this._noise({ type: 'pink', lowpass: 1200, gain: 0.5 })
      case 'rain':
        return this._noise({ type: 'pink', lowpass: 2500, gain: 0.35 })
      case 'ocean':
        return this._ocean()
      case 'space':
        return this._space()
      case 'mind':
        return this._mindRelax()
      default:
        return null
    }
  }
}

// Single shared instance
export const audioEngine = new AudioEngine()

export const SOUND_OPTIONS = [
  { id: 'alpha', label: 'Alpha', sub: '10 Hz · Relax', icon: '🌊' },
  { id: 'beta', label: 'Beta', sub: '18 Hz · Focus', icon: '⚡' },
  { id: 'gamma', label: 'Gamma', sub: '40 Hz · Cognition', icon: '✨' },
  { id: 'theta', label: 'Theta', sub: '6 Hz · Deep', icon: '🌀' },
  { id: 'delta', label: 'Delta', sub: '2 Hz · Sleep', icon: '🌙' },
  { id: 'nature', label: 'Nature', sub: 'Rain + wind', icon: '🍃' },
  { id: 'rain', label: 'Rain', sub: 'Soft shower', icon: '🌧️' },
  { id: 'ocean', label: 'Ocean', sub: 'Waves', icon: '🌊' },
  { id: 'space', label: 'Space', sub: 'Deep drone', icon: '🪐' },
  { id: 'mind', label: 'Mind Relax', sub: 'Ambient pad', icon: '🧘' },
]