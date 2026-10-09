import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Wind,
  Flower2,
  Sparkles,
  Moon,
  Plus,
  X,
  Volume2,
  VolumeX,
  Music2,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react'
import { audioEngine, SOUND_OPTIONS } from '../audio/AudioEngine.js'
import { pclock } from '../lib/pclock.js'

const DURATIONS = [
  { id: 'p3', label: '3 min', value: 180, icon: Sparkles, tag: 'Quick' },
  { id: 'p5', label: '5 min', value: 300, icon: Flower2, tag: 'Calm' },
  { id: 'p10', label: '10 min', value: 600, icon: Wind, tag: 'Deep' },
  { id: 'p20', label: '20 min', value: 1200, icon: Moon, tag: 'Zen' },
]

const BREATHE_PHASES = [
  { name: 'Inhale', duration: 4, scale: 1.35, color: '#a855f7' },
  { name: 'Hold', duration: 4, scale: 1.35, color: '#c084fc' },
  { name: 'Exhale', duration: 6, scale: 0.85, color: '#f0abfc' },
  { name: 'Rest', duration: 2, scale: 0.85, color: '#e9d5ff' },
]

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(m)}:${pad(s)}`
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ============================================================
   Custom duration modal
   ============================================================ */
function CustomDurationModal({ onClose, onCreate, initial }) {
  const [hours, setHours] = useState(Math.floor((initial || 0) / 3600))
  const [minutes, setMinutes] = useState(Math.floor(((initial || 0) % 3600) / 60))
  const [seconds, setSeconds] = useState((initial || 0) % 60)

  const total = hours * 3600 + minutes * 60 + seconds

  const NumberField = ({ label, value, setValue, max }) => (
    <div className="flex flex-col items-center gap-2">
      <input
        type="number"
        min="0"
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value) || 0
          setValue(Math.max(0, Math.min(max, v)))
        }}
        className="w-20 h-20 text-center text-3xl font-light text-white tabular bg-white/5 border border-purple-400/30 rounded-2xl focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition backdrop-blur-xl"
      />
      <span className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative rounded-3xl p-[1.5px] max-w-md w-full mx-4"
        style={{
          background:
            'linear-gradient(135deg, #fbbf24 0%, #a855f7 50%, #7c3aed 100%)',
          boxShadow: '0 0 60px rgba(168,85,247,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-[#0a0518]/95 backdrop-blur-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Custom Session</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-end justify-center gap-3 mb-6">
            <NumberField label="Hours" value={hours} setValue={setHours} max={5} />
            <span className="text-3xl text-white/40 pb-7">:</span>
            <NumberField label="Minutes" value={minutes} setValue={setMinutes} max={59} />
            <span className="text-3xl text-white/40 pb-7">:</span>
            <NumberField label="Seconds" value={seconds} setValue={setSeconds} max={59} />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (total <= 0) return
                onCreate(total)
                onClose()
              }}
              disabled={total <= 0}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-medium transition hover:scale-[1.02] disabled:opacity-40"
              style={{
                background:
                  'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                boxShadow: '0 8px 30px rgba(168,85,247,0.5)',
              }}
            >
              Use This Time
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Main Meditation page
   ============================================================ */
export default function Meditation() {
  const [selectedDuration, setSelectedDuration] = useState(300)
  const [customDuration, setCustomDuration] = useState(null)
  const [remaining, setRemaining] = useState(300)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)

  const [phaseIndex, setPhaseIndex] = useState(0)
  const [phaseElapsed, setPhaseElapsed] = useState(0)

  const [showCustomModal, setShowCustomModal] = useState(false)
  const [selectedSound, setSelectedSound] = useState(null)
  const [volume, setVolume] = useState(0.35)
  const [muted, setMuted] = useState(false)

  /* ===== Custom audio ===== */
  const [customAudios, setCustomAudios] = useState([])
  const [selectedCustom, setSelectedCustom] = useState(null) // filename
  const [importing, setImporting] = useState(false)
  const customAudioRef = useRef(null)

  useEffect(() => {
    setRemaining(selectedDuration)
    setPhaseIndex(0)
    setPhaseElapsed(0)
    setIsRunning(false)
  }, [selectedDuration])

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      setPhaseElapsed((prev) => {
        const phase = BREATHE_PHASES[phaseIndex]
        if (prev + 0.1 >= phase.duration) {
          setPhaseIndex((pi) => (pi + 1) % BREATHE_PHASES.length)
          return 0
        }
        return prev + 0.1
      })
    }, 100)
    return () => clearInterval(id)
  }, [isRunning, phaseIndex])

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          setCompletedSessions((c) => c + 1)
          setTotalMinutes((m) => m + Math.round(selectedDuration / 60))
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isRunning, selectedDuration])

  useEffect(() => {
    return () => {
      audioEngine.stop()
    }
  }, [])

  useEffect(() => {
    audioEngine.setVolume(muted ? 0 : volume)
    if (customAudioRef.current) {
      customAudioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  /* ===== Load custom audios on mount ===== */
  const loadCustomAudios = async () => {
    try {
      const files = await pclock.sounds.listFiles()
      setCustomAudios(files || [])
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadCustomAudios()
  }, [])

  const toggleSound = (id) => {
    // Stop any custom audio playing
    if (customAudioRef.current) {
      customAudioRef.current.pause()
      customAudioRef.current.currentTime = 0
    }
    setSelectedCustom(null)

    if (selectedSound === id) {
      audioEngine.stop()
      setSelectedSound(null)
    } else {
      audioEngine.play(id)
      setSelectedSound(id)
    }
  }

  const toggleCustomAudio = (filename) => {
    // Stop generated sound
    audioEngine.stop()
    setSelectedSound(null)

    if (selectedCustom === filename) {
      if (customAudioRef.current) customAudioRef.current.pause()
      setSelectedCustom(null)
      return
    }

    setSelectedCustom(filename)
    // Will play via effect below
  }

  /* Play selected custom audio */
  useEffect(() => {
    if (!selectedCustom) return
    const audio = customAudioRef.current
    if (!audio) return
    audio.src = `pclock-media://sound/${selectedCustom}`
    audio.loop = true
    audio.volume = muted ? 0 : volume
    audio.play().catch((e) => console.warn('Play failed:', e))
  }, [selectedCustom])

  /* Stop custom audio when unmounted or switched off */
  useEffect(() => {
    if (!selectedCustom && customAudioRef.current) {
      customAudioRef.current.pause()
      customAudioRef.current.currentTime = 0
    }
  }, [selectedCustom])

  const importCustomAudio = async () => {
    setImporting(true)
    try {
      const res = await pclock.sounds.importFile()
      if (!res) {
        setImporting(false)
        return
      }
      if (res.error) {
        alert(res.error)
        setImporting(false)
        return
      }
      await loadCustomAudios()
    } catch (e) {
      alert(e.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const deleteCustomAudio = async (filename) => {
    if (selectedCustom === filename) {
      if (customAudioRef.current) {
        customAudioRef.current.pause()
        customAudioRef.current.currentTime = 0
      }
      setSelectedCustom(null)
    }
    await pclock.sounds.deleteFile(filename)
    await loadCustomAudios()
  }

  const toggle = () => {
    if (remaining === 0) {
      setRemaining(selectedDuration)
      setPhaseIndex(0)
      setPhaseElapsed(0)
    }
    setIsRunning((r) => !r)
  }

  const reset = () => {
    setIsRunning(false)
    setRemaining(selectedDuration)
    setPhaseIndex(0)
    setPhaseElapsed(0)
  }

  const handleCustomCreate = (totalSeconds) => {
    setCustomDuration(totalSeconds)
    setSelectedDuration(totalSeconds)
  }

  const isCustomActive =
    customDuration !== null && selectedDuration === customDuration

  const phase = BREATHE_PHASES[phaseIndex]
  const phaseProgress = phaseElapsed / phase.duration

  const currentScale = isRunning
    ? phase.name === 'Inhale'
      ? 0.85 + (phase.scale - 0.85) * phaseProgress
      : phase.name === 'Exhale'
      ? phase.scale - (phase.scale - 0.85) * phaseProgress
      : phase.scale
    : 1

  const progress = 1 - remaining / selectedDuration

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Hidden audio element for custom audio */}
      <audio ref={customAudioRef} style={{ display: 'none' }} />

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background:
                  'linear-gradient(135deg, #e9d5ff 0%, #c084fc 45%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.45))',
              }}
            >
              Meditation
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Breathe</span>
              <span className="text-purple-400">·</span>
              <span>Relax</span>
              <span className="text-purple-400">·</span>
              <span>Be Present</span>
            </div>
          </div>

          <div className="hidden lg:block text-right max-w-[240px]">
            <p className="text-sm italic text-white/75 leading-relaxed">
              "Peace comes from within.
              <br />Do not seek it without."
            </p>
            <div className="mt-2 ml-auto w-16 h-[2px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
          <div className="max-w-5xl mx-auto">
            {/* Duration selector */}
            <div className="mb-8">
              <p className="text-xs text-white/60 uppercase tracking-[0.2em] mb-3 text-center">
                Choose your session
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {DURATIONS.map((d) => {
                  const Icon = d.icon
                  const isActive = selectedDuration === d.value
                  return (
                    <button
                      key={d.id}
                      onClick={() => !isRunning && setSelectedDuration(d.value)}
                      disabled={isRunning}
                      className={`relative rounded-2xl p-4 transition-all duration-300 ${
                        isActive ? 'scale-[1.03]' : 'hover:scale-[1.02] disabled:hover:scale-100'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(236,72,153,0.2) 100%)'
                          : 'rgba(255,255,255,0.04)',
                        border: isActive
                          ? '1px solid rgba(168,85,247,0.6)'
                          : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isActive
                          ? '0 0 30px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                          : 'none',
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          size={20}
                          className={isActive ? 'text-purple-300' : 'text-white/60'}
                        />
                        <div className="text-center">
                          <p className="text-lg font-light text-white tabular">
                            {d.label}
                          </p>
                          <p className="text-[10px] text-white/50 uppercase tracking-wider">
                            {d.tag}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}

                <button
                  onClick={() => !isRunning && setShowCustomModal(true)}
                  disabled={isRunning}
                  className={`relative rounded-2xl p-4 transition-all duration-300 ${
                    isCustomActive ? 'scale-[1.03]' : 'hover:scale-[1.02] disabled:hover:scale-100'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                  style={{
                    background: isCustomActive
                      ? 'linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(236,72,153,0.2) 100%)'
                      : 'rgba(255,255,255,0.04)',
                    border: isCustomActive
                      ? '1px solid rgba(251,191,36,0.6)'
                      : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isCustomActive
                      ? '0 0 30px rgba(251,191,36,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : 'none',
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Plus
                      size={20}
                      className={isCustomActive ? 'text-amber-300' : 'text-white/60'}
                    />
                    <div className="text-center">
                      <p className="text-lg font-light text-white tabular">
                        {isCustomActive ? formatTime(customDuration) : 'Custom'}
                      </p>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">
                        Your time
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Main circle */}
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center mb-8">
                <div
                  className="absolute rounded-full animate-halo-pulse pointer-events-none"
                  style={{
                    width: 460,
                    height: 460,
                    background: `radial-gradient(circle, ${phase.color}40 0%, rgba(168,85,247,0.15) 40%, transparent 70%)`,
                    filter: 'blur(45px)',
                  }}
                />

                <div
                  className="absolute rounded-full pointer-events-none animate-orbit-cw"
                  style={{ width: 440, height: 440 }}
                >
                  {[...Array(8)].map((_, i) => {
                    const angle = (i * 360) / 8
                    const rad = (angle * Math.PI) / 180
                    const r = 210
                    return (
                      <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          top: `calc(50% + ${Math.sin(rad) * r}px)`,
                          left: `calc(50% + ${Math.cos(rad) * r}px)`,
                          width: 6,
                          height: 6,
                          transform: 'translate(-50%, -50%)',
                          background: i % 2 === 0 ? '#a855f7' : '#fbbf24',
                          boxShadow:
                            i % 2 === 0
                              ? '0 0 12px #a855f7, 0 0 24px #a855f7'
                              : '0 0 12px #fbbf24, 0 0 24px #fbbf24',
                        }}
                      />
                    )
                  })}
                </div>

                <div
                  className="absolute rounded-full pointer-events-none animate-orbit-ccw"
                  style={{ width: 360, height: 360 }}
                >
                  {[...Array(5)].map((_, i) => {
                    const angle = (i * 360) / 5
                    const rad = (angle * Math.PI) / 180
                    const r = 170
                    return (
                      <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          top: `calc(50% + ${Math.sin(rad) * r}px)`,
                          left: `calc(50% + ${Math.cos(rad) * r}px)`,
                          width: 4,
                          height: 4,
                          transform: 'translate(-50%, -50%)',
                          background: '#c084fc',
                          boxShadow: '0 0 10px #c084fc',
                        }}
                      />
                    )
                  })}
                </div>

                <svg
                  width="380"
                  height="380"
                  className="relative transform -rotate-90"
                  style={{
                    filter: `drop-shadow(0 0 20px ${phase.color}90)`,
                    transition: 'filter 0.8s ease',
                  }}
                >
                  <defs>
                    <linearGradient id="medRing" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f0abfc" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <radialGradient id="medCore" cx="40%" cy="40%">
                      <stop offset="0%" stopColor="#1a0838" />
                      <stop offset="60%" stopColor="#0a0320" />
                      <stop offset="100%" stopColor="#050110" />
                    </radialGradient>
                  </defs>

                  <circle
                    stroke="rgba(255,255,255,0.08)"
                    fill="transparent"
                    strokeWidth="1"
                    r="185"
                    cx="190"
                    cy="190"
                  />
                  <circle
                    stroke="rgba(168,85,247,0.15)"
                    fill="transparent"
                    strokeWidth="6"
                    r="165"
                    cx="190"
                    cy="190"
                  />
                  <circle
                    stroke="url(#medRing)"
                    fill="transparent"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 165} ${2 * Math.PI * 165}`}
                    strokeDashoffset={2 * Math.PI * 165 * (1 - progress)}
                    strokeLinecap="round"
                    r="165"
                    cx="190"
                    cy="190"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                  <circle cx="190" cy="190" r="130" fill="url(#medCore)" />
                </svg>

                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 200,
                    height: 200,
                    transform: `scale(${currentScale})`,
                    transition: 'transform 0.4s ease-out, box-shadow 0.6s ease',
                    background: `radial-gradient(circle at 40% 40%, ${phase.color}55 0%, ${phase.color}22 50%, transparent 75%)`,
                    boxShadow: `0 0 60px ${phase.color}80, 0 0 120px ${phase.color}40, inset 0 0 60px ${phase.color}30`,
                  }}
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p
                    className="text-[11px] uppercase tracking-[0.4em] mb-3 transition-colors duration-700"
                    style={{ color: `${phase.color}cc` }}
                  >
                    {isRunning ? phase.name : 'Ready'}
                  </p>
                  <p className="text-6xl font-extralight text-white tabular">
                    {formatTime(remaining)}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-3">
                    {isRunning ? 'Breathe with the circle' : 'Press play to begin'}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div
                className="relative px-10 py-4 rounded-full backdrop-blur-2xl border border-purple-300/30 animate-capsule-glow flex items-center gap-6"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(168,85,247,0.12) 100%)',
                }}
              >
                <button
                  onClick={toggle}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background:
                      'linear-gradient(135deg, #e9d5ff 0%, #c084fc 40%, #a855f7 100%)',
                    boxShadow:
                      '0 0 30px rgba(192,132,252,0.9), 0 0 60px rgba(168,85,247,0.6), inset 0 2px 0 rgba(255,255,255,0.4)',
                  }}
                >
                  {isRunning ? (
                    <Pause size={24} className="text-[#1a0a2e]" fill="#1a0a2e" />
                  ) : (
                    <Play size={24} className="text-[#1a0a2e] ml-0.5" fill="#1a0a2e" />
                  )}
                </button>

                <button
                  onClick={reset}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background:
                      'radial-gradient(circle at 35% 35%, #3a2050 0%, #1a0a2e 100%)',
                    boxShadow:
                      'inset 0 0 20px rgba(168,85,247,0.3), 0 0 20px rgba(168,85,247,0.5)',
                    border: '1px solid rgba(251,191,36,0.35)',
                  }}
                >
                  <RotateCcw size={18} className="text-amber-200" />
                </button>
              </div>

              {/* ============ Generated sounds ============ */}
              <div className="mt-10 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-purple-300" />
                    <h3 className="text-sm font-semibold text-white">Ambient Sound</h3>
                    {selectedSound && (
                      <span className="text-[10px] text-purple-300/80 uppercase tracking-wider ml-2">
                        Now playing
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMuted((m) => !m)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
                    >
                      {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value))
                        setMuted(false)
                      }}
                      className="w-28 accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {SOUND_OPTIONS.map((s) => {
                    const isActive = selectedSound === s.id
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSound(s.id)}
                        className={`relative rounded-xl p-3 transition-all duration-300 text-left ${
                          isActive ? 'scale-[1.03]' : 'hover:scale-[1.02]'
                        }`}
                        style={{
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.2) 100%)'
                            : 'rgba(255,255,255,0.04)',
                          border: isActive
                            ? '1px solid rgba(168,85,247,0.7)'
                            : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: isActive
                            ? '0 0 25px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'
                            : 'none',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{s.icon}</span>
                          {isActive && (
                            <span className="flex gap-0.5 items-end h-3">
                              <span
                                className="w-0.5 bg-purple-300 rounded animate-pulse"
                                style={{ height: '60%', animationDuration: '0.6s' }}
                              />
                              <span
                                className="w-0.5 bg-purple-300 rounded animate-pulse"
                                style={{ height: '100%', animationDuration: '0.9s' }}
                              />
                              <span
                                className="w-0.5 bg-purple-300 rounded animate-pulse"
                                style={{ height: '75%', animationDuration: '0.7s' }}
                              />
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-white truncate">{s.label}</p>
                        <p className="text-[10px] text-white/50 truncate">{s.sub}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ============ ✨ Custom Audio Section ============ */}
              <div className="mt-10 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Music2 size={16} className="text-purple-300" />
                    <h3 className="text-sm font-semibold text-white">
                      Your Audio
                    </h3>
                    <span className="text-[10px] text-white/40 ml-1">
                      ({customAudios.length})
                    </span>
                  </div>

                  <button
                    onClick={importCustomAudio}
                    disabled={importing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-medium transition hover:scale-[1.03] disabled:opacity-50"
                    style={{
                      background:
                        'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                      boxShadow: '0 6px 20px rgba(168,85,247,0.5)',
                    }}
                  >
                    {importing ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={12} />
                        Import Audio
                      </>
                    )}
                  </button>
                </div>

                {customAudios.length === 0 ? (
                  <div
                    className="rounded-2xl p-8 text-center border border-dashed border-white/15"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <Music2
                      size={32}
                      className="text-white/30 mx-auto mb-3"
                    />
                    <p className="text-xs text-white/50 mb-1">
                      No custom audio yet
                    </p>
                    <p className="text-[10px] text-white/30">
                      Import your own mp3, wav, ogg (max 50 MB)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customAudios.map((f) => {
                      const isActive = selectedCustom === f.filename
                      return (
                        <div
                          key={f.filename}
                          className={`group relative rounded-xl p-3 flex items-center gap-3 transition-all ${
                            isActive ? 'scale-[1.02]' : ''
                          }`}
                          style={{
                            background: isActive
                              ? 'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.2) 100%)'
                              : 'rgba(255,255,255,0.04)',
                            border: isActive
                              ? '1px solid rgba(168,85,247,0.7)'
                              : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: isActive
                              ? '0 0 20px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                              : 'none',
                          }}
                        >
                          <button
                            onClick={() => toggleCustomAudio(f.filename)}
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-110"
                            style={{
                              background: isActive
                                ? 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
                                : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                              boxShadow: '0 0 15px rgba(168,85,247,0.6)',
                            }}
                          >
                            {isActive ? (
                              <Pause size={13} className="text-white" fill="white" />
                            ) : (
                              <Play size={13} className="text-white ml-0.5" fill="white" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white truncate">
                              {f.filename.replace(/^\d+-[a-z0-9]+\./, 'audio.')}
                            </p>
                            <p className="text-[10px] text-white/50 tabular">
                              {formatSize(f.size)}
                            </p>
                          </div>

                          {isActive && (
                            <span className="flex gap-0.5 items-end h-4 shrink-0">
                              <span
                                className="w-0.5 bg-purple-300 rounded animate-pulse"
                                style={{ height: '60%', animationDuration: '0.6s' }}
                              />
                              <span
                                className="w-0.5 bg-purple-300 rounded animate-pulse"
                                style={{ height: '100%', animationDuration: '0.9s' }}
                              />
                              <span
                                className="w-0.5 bg-purple-300 rounded animate-pulse"
                                style={{ height: '75%', animationDuration: '0.7s' }}
                              />
                            </span>
                          )}

                          <button
                            onClick={() => deleteCustomAudio(f.filename)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-300 transition shrink-0"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <p className="text-[10px] text-white/30 mt-3 text-center">
                  Custom audio loops continuously while playing
                </p>
              </div>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                <div
                  className="rounded-2xl p-4 text-center backdrop-blur-xl border border-white/10"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(168,85,247,0.06) 100%)',
                  }}
                >
                  <div className="text-2xl mb-1">🧘</div>
                  <p className="text-2xl font-light text-white tabular">
                    {completedSessions}
                  </p>
                  <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                    Sessions
                  </p>
                </div>
                <div
                  className="rounded-2xl p-4 text-center backdrop-blur-xl border border-white/10"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(251,191,36,0.06) 100%)',
                  }}
                >
                  <div className="text-2xl mb-1">⏳</div>
                  <p className="text-2xl font-light text-white tabular">
                    {totalMinutes}
                  </p>
                  <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1">
                    Minutes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCustomModal && (
        <CustomDurationModal
          onClose={() => setShowCustomModal(false)}
          onCreate={handleCustomCreate}
          initial={customDuration || 300}
        />
      )}
    </div>
  )
}