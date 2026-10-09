import { useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  X,
  Coffee,
  Target,
  Leaf,
} from 'lucide-react'
import { usePomodoro } from '../context/PomodoroContext.jsx'

const PHASE_META = {
  focus: { label: 'Focus', color: '#a855f7', ring: '#c084fc', icon: Target },
  short: { label: 'Short Break', color: '#22c55e', ring: '#4ade80', icon: Coffee },
  long: { label: 'Long Break', color: '#0ea5e9', ring: '#38bdf8', icon: Leaf },
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function SettingsModal({ config, onUpdate, onClose }) {
  const [local, setLocal] = useState(config)

  const Field = ({ label, key, min = 1, max = 120 }) => (
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
        className="w-20 px-3 py-1.5 text-right text-white bg-white/5 border border-purple-400/30 rounded-lg focus:border-purple-400 focus:outline-none tabular"
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
          background: 'linear-gradient(135deg, #fbbf24 0%, #a855f7 50%, #7c3aed 100%)',
          boxShadow: '0 0 60px rgba(168,85,247,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-[#0a0518]/95 backdrop-blur-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Pomodoro Settings</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="divide-y divide-white/5">
            <Field label="Focus (minutes)" key="focusMinutes" min={1} max={120} />
            <Field label="Short break (min)" key="shortBreakMinutes" min={1} max={60} />
            <Field label="Long break (min)" key="longBreakMinutes" min={1} max={60} />
            <Field label="Cycles before long break" key="cyclesBeforeLongBreak" min={2} max={10} />
          </div>

          <label className="flex items-center justify-between py-3 cursor-pointer mt-2">
            <span className="text-sm text-white/70">Auto-start next phase</span>
            <input
              type="checkbox"
              checked={local.autoStartNext}
              onChange={(e) => setLocal((l) => ({ ...l, autoStartNext: e.target.checked }))}
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
                background: 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
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

export default function Pomodoro() {
  const {
    config,
    updateConfig,
    phase,
    isRunning,
    remaining,
    total,
    cycleCount,
    totalSessions,
    start,
    pause,
    reset,
    skip,
  } = usePomodoro()
  const [showSettings, setShowSettings] = useState(false)

  const meta = PHASE_META[phase]
  const Icon = meta.icon
  const progress = total > 0 ? 1 - remaining / total : 0

  const size = 380
  const cx = size / 2
  const cy = size / 2
  const radius = 165
  const circumference = radius * 2 * Math.PI
  const offset = circumference - progress * circumference

  return (
    <div className="relative h-full w-full overflow-hidden">

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #fde68a 0%, #f0abfc 45%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.45))',
              }}
            >
              Pomodoro
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Focus</span>
              <span className="text-purple-400">·</span>
              <span>Rest</span>
              <span className="text-purple-400">·</span>
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

        {/* Main */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center mb-8">
            {/* Halo */}
            <div
              className="absolute rounded-full animate-halo-pulse pointer-events-none"
              style={{
                width: size + 80,
                height: size + 80,
                background: `radial-gradient(circle, ${meta.color}40 0%, rgba(168,85,247,0.15) 40%, transparent 70%)`,
                filter: 'blur(50px)',
              }}
            />

            {/* Orbit dots */}
            <div
              className="absolute rounded-full pointer-events-none animate-orbit-cw"
              style={{ width: size + 40, height: size + 40 }}
            >
              {[...Array(8)].map((_, i) => {
                const angle = (i * 360) / 8
                const rad = (angle * Math.PI) / 180
                const r = (size + 40) / 2 - 12
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
                      background: i % 2 === 0 ? '#fbbf24' : '#c084fc',
                      boxShadow: i % 2 === 0 ? '0 0 12px #fbbf24' : '0 0 12px #c084fc',
                    }}
                  />
                )
              })}
            </div>

            {/* SVG ring */}
            <svg
              width={size}
              height={size}
              className="relative transform -rotate-90"
              style={{ filter: `drop-shadow(0 0 20px ${meta.ring}90)` }}
            >
              <defs>
                <linearGradient id="pomRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={meta.ring} />
                  <stop offset="100%" stopColor={meta.color} />
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
                stroke="url(#pomRing)"
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

            {/* Inner content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className="flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em]"
                style={{
                  background: `${meta.color}25`,
                  border: `1px solid ${meta.color}50`,
                  color: meta.ring,
                }}
              >
                <Icon size={12} />
                {meta.label}
              </div>
              <p className="text-7xl font-extralight text-white tabular leading-none">
                {formatTime(remaining)}
              </p>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.3em] mt-3">
                Session {cycleCount + 1} / {config.cyclesBeforeLongBreak}
              </p>
            </div>
          </div>

          {/* Cycle dots */}
          <div className="flex items-center gap-3 mb-8">
            {[...Array(config.cyclesBeforeLongBreak)].map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i < cycleCount ? 14 : 10,
                  height: i < cycleCount ? 14 : 10,
                  background: i < cycleCount ? meta.color : 'rgba(255,255,255,0.15)',
                  boxShadow: i < cycleCount ? `0 0 15px ${meta.color}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Controls */}
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
                background: `linear-gradient(135deg, ${meta.ring} 0%, ${meta.color} 100%)`,
                boxShadow: `0 0 40px ${meta.color}90, 0 0 80px ${meta.color}60, inset 0 2px 0 rgba(255,255,255,0.4)`,
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
              className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #3a2050 0%, #1a0a2e 100%)',
                border: '1px solid rgba(251,191,36,0.35)',
              }}
            >
              <SkipForward size={18} className="text-amber-200" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-lg">
            {[
              { emoji: '🎯', value: totalSessions, label: 'Focus done' },
              { emoji: '⏱️', value: Math.round(config.focusMinutes), label: 'Focus min' },
              { emoji: '🌿', value: config.cyclesBeforeLongBreak, label: 'Cycles' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-3 text-center backdrop-blur-xl border border-white/10"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(168,85,247,0.06) 100%)',
                }}
              >
                <div className="text-xl mb-1">{s.emoji}</div>
                <p className="text-xl font-light text-white tabular">{s.value}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.15em] mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          config={config}
          onUpdate={updateConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}