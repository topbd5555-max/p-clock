import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Settings2,
  X,
  Flame,
  Wind,
  Zap,
} from 'lucide-react'
import { pclock } from '../lib/pclock.js'

const PHASES = {
  prepare: { label: 'Get Ready', color: '#fbbf24', icon: Zap },
  work: { label: 'Work', color: '#ef4444', icon: Flame },
  rest: { label: 'Rest', color: '#22c55e', icon: Wind },
}

const DEFAULT_CFG = {
  prepareSeconds: 10,
  workSeconds: 30,
  restSeconds: 15,
  sets: 8,
  cycles: 1,
  autoStart: true,
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function SettingsModal({ cfg, onUpdate, onClose }) {
  const [local, setLocal] = useState(cfg)
  const F = ({ label, key, min = 1, max = 3600 }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-white/70">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={local[key]}
        onChange={(e) =>
          setLocal((l) => ({ ...l, [key]: Math.max(min, Math.min(max, +e.target.value || min)) }))
        }
        className="w-24 px-3 py-1.5 text-right text-white bg-white/5 border border-purple-400/30 rounded-lg focus:border-purple-400 focus:outline-none tabular"
      />
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
          background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 50%, #22c55e 100%)',
          boxShadow: '0 0 60px rgba(168,85,247,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-[#0a0518]/95 backdrop-blur-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Interval Settings</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            <F label="Prepare (sec)" key="prepareSeconds" />
            <F label="Work (sec)" key="workSeconds" />
            <F label="Rest (sec)" key="restSeconds" />
            <F label="Sets" key="sets" min={1} max={99} />
            <F label="Cycles" key="cycles" min={1} max={99} />
          </div>
          <label className="flex items-center justify-between py-3 cursor-pointer mt-2">
            <span className="text-sm text-white/70">Auto-start next phase</span>
            <input
              type="checkbox"
              checked={local.autoStart}
              onChange={(e) => setLocal((l) => ({ ...l, autoStart: e.target.checked }))}
              className="w-4 h-4 accent-purple-500"
            />
          </label>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onUpdate(local)
                onClose()
              }}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-medium hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 50%, #22c55e 100%)',
                boxShadow: '0 8px 30px rgba(168,85,247,0.5)',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IntervalTimer() {
  const [cfg, setCfg] = useState(DEFAULT_CFG)
  const [showSettings, setShowSettings] = useState(false)

  const [phase, setPhase] = useState('prepare')
  const [isRunning, setIsRunning] = useState(false)
  const [remaining, setRemaining] = useState(DEFAULT_CFG.prepareSeconds)
  const [currentSet, setCurrentSet] = useState(1)
  const [currentCycle, setCurrentCycle] = useState(1)
  const [finished, setFinished] = useState(false)

  const cfgRef = useRef(cfg)
  useEffect(() => {
    cfgRef.current = cfg
  }, [cfg])

  /* Load saved config */
  useEffect(() => {
    ;(async () => {
      try {
        const saved = await pclock.settings.get('intervalConfig', null)
        if (saved) {
          setCfg({ ...DEFAULT_CFG, ...saved })
          setRemaining(saved.prepareSeconds)
        }
      } catch {
        /* ignore */
      }
    })()
  }, [])

  useEffect(() => {
    pclock.settings.set('intervalConfig', cfg).catch(() => {})
  }, [cfg])

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          handlePhaseEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line
  }, [isRunning, phase, currentSet, currentCycle])

  const handlePhaseEnd = () => {
    const c = cfgRef.current

    if (phase === 'prepare') {
      pclock.notify({ title: '💪 Work!', body: `${c.workSeconds}s work` }).catch(() => {})
      setPhase('work')
      setRemaining(c.workSeconds)
      return
    }

    if (phase === 'work') {
      // completed a work set
      if (currentSet < c.sets) {
        if (c.restSeconds > 0) {
          pclock.notify({ title: '☕ Rest', body: `${c.restSeconds}s rest` }).catch(() => {})
          setPhase('rest')
          setRemaining(c.restSeconds)
        } else {
          pclock.notify({ title: '💪 Work!', body: `${c.workSeconds}s` }).catch(() => {})
          setRemaining(c.workSeconds)
          setCurrentSet((n) => n + 1)
        }
      } else {
        // set complete → next cycle or done
        if (currentCycle < c.cycles) {
          pclock
            .notify({ title: '🔁 Cycle complete', body: `Cycle ${currentCycle} done` })
            .catch(() => {})
          setCurrentCycle((n) => n + 1)
          setCurrentSet(1)
          setPhase('prepare')
          setRemaining(c.prepareSeconds)
        } else {
          // all done
          pclock
            .notify({ title: '🏁 Interval complete!', body: `All ${c.cycles} cycles finished` })
            .catch(() => {})
          pclock.sessions
            .create({
              type: 'interval',
              durationSeconds: c.workSeconds * c.sets * c.cycles,
              completed: true,
              metadata: { sets: c.sets, cycles: c.cycles, work: c.workSeconds, rest: c.restSeconds },
            })
            .catch(() => {})
          setIsRunning(false)
          setFinished(true)
          setRemaining(0)
        }
      }
      return
    }

    if (phase === 'rest') {
      pclock.notify({ title: '💪 Work!', body: `${c.workSeconds}s work` }).catch(() => {})
      setPhase('work')
      setRemaining(c.workSeconds)
      setCurrentSet((n) => n + 1)
    }
  }

  const start = () => {
    if (finished) reset()
    setIsRunning(true)
  }

  const pause = () => setIsRunning(false)

  const reset = () => {
    setIsRunning(false)
    setPhase('prepare')
    setRemaining(cfg.prepareSeconds)
    setCurrentSet(1)
    setCurrentCycle(1)
    setFinished(false)
  }

  const skip = () => handlePhaseEnd()

  const total = (() => {
    if (phase === 'prepare') return cfg.prepareSeconds
    if (phase === 'work') return cfg.workSeconds
    return cfg.restSeconds
  })()
  const progress = total > 0 ? 1 - remaining / total : 0

  const meta = PHASES[phase]
  const Icon = meta.icon
  const size = 360
  const cx = size / 2
  const cy = size / 2
  const radius = 155
  const circumference = radius * 2 * Math.PI
  const offset = circumference - progress * circumference

  return (
    <div className="relative h-full w-full overflow-hidden">

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #fca5a5 0%, #f0abfc 45%, #86efac 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Interval Timer
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Work</span>
              <span className="text-red-400">·</span>
              <span>Rest</span>
              <span className="text-green-400">·</span>
              <span>Repeat</span>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <Settings2 size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center mb-6">
            <div
              className="absolute rounded-full animate-halo-pulse pointer-events-none"
              style={{
                width: size + 80,
                height: size + 80,
                background: `radial-gradient(circle, ${meta.color}40 0%, transparent 65%)`,
                filter: 'blur(50px)',
              }}
            />
            <div
              className="absolute rounded-full pointer-events-none animate-orbit-cw"
              style={{ width: size + 40, height: size + 40 }}
            >
              {[...Array(6)].map((_, i) => {
                const angle = (i * 360) / 6
                const rad = (angle * Math.PI) / 180
                const r = (size + 40) / 2 - 12
                return (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      top: `calc(50% + ${Math.sin(rad) * r}px)`,
                      left: `calc(50% + ${Math.cos(rad) * r}px)`,
                      width: 5,
                      height: 5,
                      transform: 'translate(-50%, -50%)',
                      background: meta.color,
                      boxShadow: `0 0 12px ${meta.color}`,
                    }}
                  />
                )
              })}
            </div>

            <svg
              width={size}
              height={size}
              className="relative transform -rotate-90"
              style={{ filter: `drop-shadow(0 0 20px ${meta.color}90)` }}
            >
              <defs>
                <linearGradient id="intRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={meta.color} />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <circle
                stroke="rgba(255,255,255,0.08)"
                fill="transparent"
                strokeWidth="6"
                r={radius}
                cx={cx}
                cy={cy}
              />
              <circle
                stroke="url(#intRing)"
                fill="transparent"
                strokeWidth="6"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                r={radius}
                cx={cx}
                cy={cy}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className="flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em]"
                style={{
                  background: `${meta.color}25`,
                  border: `1px solid ${meta.color}50`,
                  color: meta.color,
                }}
              >
                <Icon size={12} />
                {finished ? 'Complete' : meta.label}
              </div>
              <p className="text-7xl font-extralight text-white tabular leading-none">
                {formatTime(remaining)}
              </p>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.3em] mt-3">
                Set {currentSet} / {cfg.sets} · Cycle {currentCycle} / {cfg.cycles}
              </p>
            </div>
          </div>

          <div
            className="relative px-8 py-4 rounded-full backdrop-blur-2xl border border-purple-300/30 flex items-center gap-5 animate-capsule-glow"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(168,85,247,0.12) 100%)',
            }}
          >
            <button
              onClick={reset}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #3a2050 0%, #1a0a2e 100%)',
                border: '1px solid rgba(251,191,36,0.35)',
              }}
            >
              <RotateCcw size={18} className="text-amber-200" />
            </button>
            <button
              onClick={isRunning ? pause : start}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${meta.color} 0%, #a855f7 100%)`,
                boxShadow: `0 0 40px ${meta.color}90, inset 0 2px 0 rgba(255,255,255,0.4)`,
              }}
            >
              {isRunning ? (
                <Pause size={28} className="text-[#1a0a2e]" fill="#1a0a2e" />
              ) : (
                <Play size={28} className="text-[#1a0a2e] ml-1" fill="#1a0a2e" />
              )}
            </button>
            <button
              onClick={skip}
              className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-semibold text-amber-200 transition-transform hover:scale-105"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #3a2050 0%, #1a0a2e 100%)',
                border: '1px solid rgba(251,191,36,0.35)',
              }}
            >
              SKIP
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal cfg={cfg} onUpdate={setCfg} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}