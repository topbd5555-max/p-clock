import { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Maximize2,
  X,
  Trash2,
} from 'lucide-react'
import { useTimers } from '../context/TimerContext.jsx'
import { useFullscreen } from '../context/FullscreenContext.jsx'
import ThemedBackground from '../components/ThemedBackground.jsx'

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/* ======================================================
   Timer Card (grid)
   ====================================================== */
function TimerCard({ timer, onToggle, onReset, onFullscreen, onDelete }) {
  const size = 168
  const cx = size / 2
  const cy = size / 2
  const radius = 74
  const outerRadius = 80
  const stroke = 4
  const circumference = radius * 2 * Math.PI
  const progress = timer.total > 0 ? timer.remaining / timer.total : 0
  const offset = circumference - progress * circumference

  return (
    <div className="relative group">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <svg width="26" height="26" viewBox="0 0 24 24">
          <defs>
            <linearGradient id={`spark-${timer.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path
            d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z"
            fill={`url(#spark-${timer.id})`}
            style={{ filter: 'drop-shadow(0 0 10px #fbbf24)' }}
          />
        </svg>
      </div>

      <div
        className="relative rounded-2xl p-[1.5px] transition-transform duration-300 group-hover:scale-[1.02]"
        style={{
          background:
            'linear-gradient(135deg, #fbbf24 0%, #a855f7 35%, #7c3aed 65%, #fbbf24 100%)',
          boxShadow:
            '0 0 30px rgba(168,85,247,0.4), 0 0 60px rgba(251,191,36,0.15), inset 0 0 20px rgba(168,85,247,0.2)',
        }}
      >
        <div className="relative rounded-2xl bg-[#0a0518]/85 backdrop-blur-2xl p-4 overflow-hidden">
          <div
            className="absolute inset-0 opacity-70 pointer-events-none animate-slow-pan"
            style={{
              background:
                'radial-gradient(ellipse at 30% 35%, rgba(168,85,247,0.28) 0%, transparent 55%), radial-gradient(ellipse at 80% 75%, rgba(251,191,36,0.15) 0%, transparent 55%)',
            }}
          />

          <div className="relative flex items-center justify-between mb-1">
            <span className="text-xs text-white/75 font-medium tracking-wide">
              {timer.label}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onFullscreen(timer.id)}
                className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition"
                title="Fullscreen"
              >
                <Maximize2 size={13} />
              </button>
              <button
                onClick={() => onDelete(timer.id)}
                className="p-1 hover:bg-red-500/20 rounded text-white/50 hover:text-red-300 transition"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <svg
              width={size}
              height={size}
              className="transform -rotate-90"
              style={{ filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.85))' }}
            >
              <defs>
                <linearGradient id={`ring-${timer.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f0abfc" />
                  <stop offset="45%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
              <circle
                stroke="#fbbf24"
                strokeOpacity="0.55"
                fill="transparent"
                strokeWidth="1"
                r={outerRadius}
                cx={cx}
                cy={cy}
              />
              {[0, 90, 180, 270].map((deg) => {
                const rad = (deg * Math.PI) / 180
                const dotX = cx + Math.cos(rad) * outerRadius
                const dotY = cy + Math.sin(rad) * outerRadius
                return (
                  <circle
                    key={deg}
                    cx={dotX}
                    cy={dotY}
                    r="2.5"
                    fill="#fde68a"
                    style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}
                  />
                )
              })}
              <circle
                stroke="rgba(255,255,255,0.08)"
                fill="transparent"
                strokeWidth={stroke + 2}
                r={radius}
                cx={cx}
                cy={cy}
              />
              <circle
                stroke={`url(#ring-${timer.id})`}
                fill="transparent"
                strokeWidth={stroke + 2}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{
                  strokeDashoffset: offset,
                  transition: 'stroke-dashoffset 1s linear',
                }}
                strokeLinecap="round"
                r={radius}
                cx={cx}
                cy={cy}
              />
            </svg>

            <div className="absolute text-center">
              <div className="text-xl font-light text-white tabular tracking-wide">
                {formatTime(timer.remaining)}
              </div>
              <div className="text-[9px] text-purple-300/85 uppercase tracking-[0.18em] mt-0.5">
                {timer.subLabel}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center gap-4 mt-2 mb-1">
            <button
              onClick={() => onToggle(timer.id)}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                boxShadow:
                  '0 0 22px rgba(168,85,247,0.75), inset 0 1px 0 rgba(255,255,255,0.35)',
              }}
            >
              {timer.isRunning ? (
                <Pause size={16} className="text-white" fill="white" />
              ) : (
                <Play size={16} className="text-white ml-0.5" fill="white" />
              )}
            </button>
            <button
              onClick={() => onReset(timer.id)}
              className="w-11 h-11 rounded-full flex items-center justify-center border border-amber-400/70 hover:bg-amber-400/10 transition"
              style={{
                boxShadow:
                  '0 0 18px rgba(251,191,36,0.3), inset 0 0 12px rgba(251,191,36,0.1)',
              }}
            >
              <RotateCcw size={16} className="text-amber-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ======================================================
   Fullscreen Timer
   - Announces itself to FullscreenContext → outer bg unmounts
   - Renders its own ThemedBackground inside → only ONE video exists
   ====================================================== */
function FullscreenTimer({ timer, onToggle, onReset, onClose }) {
  const { setFullscreenActive } = useFullscreen()

  // 🔑 Notify app that fullscreen is active → outer ThemedBackground unmounts
  useEffect(() => {
    setFullscreenActive(true)
    return () => setFullscreenActive(false)
  }, [setFullscreenActive])

  const size = 560
  const cx = size / 2
  const cy = size / 2
  const radius = 230
  const stroke = 5
  const circumference = radius * 2 * Math.PI
  const progress = timer.total > 0 ? timer.remaining / timer.total : 0
  const offset = circumference - progress * circumference

  const pad = (n) => String(n).padStart(2, '0')
  const h = Math.floor(timer.remaining / 3600)
  const m = Math.floor((timer.remaining % 3600) / 60)
  const s = timer.remaining % 60

  const outerOrbitSize = size + 100
  const outerOrbitRadius = outerOrbitSize / 2 - 12
  const innerOrbitSize = size - 100
  const innerOrbitRadius = innerOrbitSize / 2 - 12

  return (
    /* ✅ Opaque root: covers grid, hides background timers */
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[#050510]">
      {/* Inner background — video/image/theme renders here.
          Since outer bg is unmounted, only ONE video exists. */}
      <ThemedBackground overlay />

      {/* Rotating light beam */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 w-[220vmax] h-[220vmax] animate-light-beam-rotate opacity-20"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(168,85,247,0.4) 30deg, transparent 70deg, transparent 180deg, rgba(251,191,36,0.3) 210deg, transparent 250deg)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-30 p-3 rounded-full backdrop-blur-xl bg-black/40 border border-white/15 hover:bg-black/60 text-white/80 hover:text-white transition"
        title="Close fullscreen"
      >
        <X size={18} />
      </button>

      {/* Center clock */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div
            className="absolute rounded-full animate-halo-pulse pointer-events-none"
            style={{
              width: size + 200,
              height: size + 200,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              marginTop: -20,
              background:
                'radial-gradient(circle, rgba(251,191,36,0.28) 0%, rgba(168,85,247,0.22) 35%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />

          <div className="relative animate-clock-breathe">
            {/* Outer orbit dots */}
            <div
              className="absolute pointer-events-none animate-orbit-cw"
              style={{
                width: outerOrbitSize,
                height: outerOrbitSize,
                top: '50%',
                left: '50%',
                marginLeft: -outerOrbitSize / 2,
                marginTop: -outerOrbitSize / 2,
              }}
            >
              {[...Array(10)].map((_, i) => {
                const angle = (i * 360) / 10
                const rad = (angle * Math.PI) / 180
                const x = Math.cos(rad) * outerOrbitRadius
                const y = Math.sin(rad) * outerOrbitRadius
                return (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      top: `calc(50% + ${y}px)`,
                      left: `calc(50% + ${x}px)`,
                      width: i % 2 === 0 ? '8px' : '5px',
                      height: i % 2 === 0 ? '8px' : '5px',
                      transform: 'translate(-50%, -50%)',
                      background: i % 2 === 0 ? '#fbbf24' : '#c084fc',
                      boxShadow:
                        i % 2 === 0
                          ? '0 0 15px #fbbf24, 0 0 30px #fbbf24, 0 0 45px rgba(251,191,36,0.6)'
                          : '0 0 12px #a855f7, 0 0 24px #a855f7, 0 0 40px rgba(168,85,247,0.6)',
                    }}
                  />
                )
              })}
            </div>

            {/* Inner orbit dots */}
            <div
              className="absolute pointer-events-none animate-orbit-ccw"
              style={{
                width: innerOrbitSize,
                height: innerOrbitSize,
                top: '50%',
                left: '50%',
                marginLeft: -innerOrbitSize / 2,
                marginTop: -innerOrbitSize / 2,
              }}
            >
              {[...Array(6)].map((_, i) => {
                const angle = (i * 360) / 6
                const rad = (angle * Math.PI) / 180
                const x = Math.cos(rad) * innerOrbitRadius
                const y = Math.sin(rad) * innerOrbitRadius
                return (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      top: `calc(50% + ${y}px)`,
                      left: `calc(50% + ${x}px)`,
                      width: '4px',
                      height: '4px',
                      transform: 'translate(-50%, -50%)',
                      background: '#f0abfc',
                      boxShadow:
                        '0 0 10px #e9d5ff, 0 0 20px #a855f7, 0 0 30px rgba(168,85,247,0.7)',
                    }}
                  />
                )
              })}
            </div>

            {/* Sparkles */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <svg width="42" height="42" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="fsSpTop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z"
                  fill="url(#fsSpTop)"
                  style={{ filter: 'drop-shadow(0 0 14px #fbbf24)' }}
                />
              </svg>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <svg width="42" height="42" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="fsSpBot" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z"
                  fill="url(#fsSpBot)"
                  style={{ filter: 'drop-shadow(0 0 14px #a855f7)' }}
                />
              </svg>
            </div>
            <div className="absolute top-1/2 -left-3 -translate-y-1/2 z-20 pointer-events-none">
              <svg width="36" height="36" viewBox="0 0 24 24">
                <path
                  d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z"
                  fill="#fbbf24"
                  style={{ filter: 'drop-shadow(0 0 12px #fbbf24)' }}
                />
              </svg>
            </div>
            <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 pointer-events-none">
              <svg width="36" height="36" viewBox="0 0 24 24">
                <path
                  d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z"
                  fill="#a855f7"
                  style={{ filter: 'drop-shadow(0 0 12px #a855f7)' }}
                />
              </svg>
            </div>

            <svg
              width={size}
              height={size}
              className="relative transform -rotate-90 animate-ring-glow-pulse"
            >
              <defs>
                <linearGradient id="fsRingGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="fsRingPurple" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f0abfc" />
                  <stop offset="45%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
                <radialGradient id="fsGlobe" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="rgba(26,8,56,0.7)" />
                  <stop offset="60%" stopColor="rgba(10,3,32,0.8)" />
                  <stop offset="100%" stopColor="rgba(5,1,16,0.9)" />
                </radialGradient>
              </defs>

              <circle
                stroke="url(#fsRingGold)"
                fill="transparent"
                strokeWidth="1.5"
                r={270}
                cx={cx}
                cy={cy}
                opacity="0.85"
              />
              {[...Array(24)].map((_, i) => {
                const angle = (i * 360) / 24
                const rad = (angle * Math.PI) / 180
                const dx = cx + Math.cos(rad) * 270
                const dy = cy + Math.sin(rad) * 270
                return (
                  <circle
                    key={i}
                    cx={dx}
                    cy={dy}
                    r="2"
                    fill="#fde68a"
                    style={{ filter: 'drop-shadow(0 0 3px #fbbf24)' }}
                  />
                )
              })}
              <circle
                stroke="url(#fsRingGold)"
                fill="transparent"
                strokeWidth="3"
                r={255}
                cx={cx}
                cy={cy}
                opacity="0.95"
              />
              <circle
                stroke="#fbbf24"
                strokeOpacity="0.55"
                strokeWidth="2"
                strokeDasharray="2 8"
                fill="transparent"
                r={238}
                cx={cx}
                cy={cy}
              />
              <circle
                stroke="rgba(168,85,247,0.25)"
                fill="transparent"
                strokeWidth={stroke + 6}
                r={radius}
                cx={cx}
                cy={cy}
              />
              <circle
                stroke="url(#fsRingPurple)"
                fill="transparent"
                strokeWidth={stroke + 6}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{
                  strokeDashoffset: offset,
                  transition: 'stroke-dashoffset 1s linear',
                }}
                strokeLinecap="round"
                r={radius}
                cx={cx}
                cy={cy}
                opacity="0.95"
              />
              <circle
                cx={cx}
                cy={cy}
                r={radius - 25}
                fill="url(#fsGlobe)"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className="tabular font-light tracking-tight leading-none"
                style={{
                  fontSize: '92px',
                  background:
                    'linear-gradient(90deg, #fde68a 0%, #fbbf24 30%, #c084fc 65%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter:
                    'drop-shadow(0 0 30px rgba(251,191,36,0.7)) drop-shadow(0 0 60px rgba(168,85,247,0.5))',
                }}
              >
                {pad(h)}:{pad(m)}:{pad(s)}
              </div>
              <div className="text-xs text-purple-200/80 uppercase tracking-[0.4em] mt-3">
                {timer.subLabel}
              </div>
            </div>
          </div>

          <div
            className="relative mt-12 px-10 py-5 rounded-full backdrop-blur-2xl border border-amber-300/40 animate-capsule-glow"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(168,85,247,0.15) 100%)',
            }}
          >
            <div className="flex items-center gap-8">
              <button
                onClick={() => onToggle(timer.id)}
                className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                style={{
                  background:
                    'linear-gradient(135deg, #e9d5ff 0%, #c084fc 40%, #a855f7 100%)',
                  boxShadow:
                    '0 0 40px rgba(192,132,252,0.9), 0 0 80px rgba(168,85,247,0.6), inset 0 2px 0 rgba(255,255,255,0.4)',
                }}
              >
                {timer.isRunning ? (
                  <Pause size={30} className="text-[#1a0a2e]" fill="#1a0a2e" />
                ) : (
                  <Play size={30} className="text-[#1a0a2e] ml-1" fill="#1a0a2e" />
                )}
              </button>

              <button
                onClick={() => onReset(timer.id)}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                style={{
                  background:
                    'radial-gradient(circle at 35% 35%, #3a2050 0%, #1a0a2e 100%)',
                  boxShadow:
                    'inset 0 0 20px rgba(168,85,247,0.3), 0 0 30px rgba(168,85,247,0.5)',
                  border: '1px solid rgba(251,191,36,0.4)',
                }}
              >
                <RotateCcw size={22} className="text-amber-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ======================================================
   Custom Time Modal
   ====================================================== */
function CustomTimeModal({ onClose, onCreate }) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(5)
  const [seconds, setSeconds] = useState(0)

  const total = hours * 3600 + minutes * 60 + seconds

  const handleCreate = () => {
    if (total <= 0) return
    onCreate(hours, minutes, seconds)
    onClose()
  }

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative rounded-3xl p-[1.5px] max-w-md w-full mx-4"
        style={{
          background:
            'linear-gradient(135deg, #fbbf24 0%, #a855f7 50%, #7c3aed 100%)',
          boxShadow:
            '0 0 60px rgba(168,85,247,0.6), 0 0 120px rgba(251,191,36,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-[#0a0518]/95 backdrop-blur-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Custom Timer</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-end justify-center gap-3 mb-6">
            <NumberField label="Hours" value={hours} setValue={setHours} max={23} />
            <span className="text-3xl text-white/40 pb-7">:</span>
            <NumberField label="Minutes" value={minutes} setValue={setMinutes} max={59} />
            <span className="text-3xl text-white/40 pb-7">:</span>
            <NumberField label="Seconds" value={seconds} setValue={setSeconds} max={59} />
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {[
              { l: '30s', h: 0, m: 0, s: 30 },
              { l: '2m', h: 0, m: 2, s: 0 },
              { l: '15m', h: 0, m: 15, s: 0 },
              { l: '25m', h: 0, m: 25, s: 0 },
              { l: '45m', h: 0, m: 45, s: 0 },
              { l: '1h', h: 1, m: 0, s: 0 },
            ].map((p) => (
              <button
                key={p.l}
                onClick={() => {
                  setHours(p.h)
                  setMinutes(p.m)
                  setSeconds(p.s)
                }}
                className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 hover:border-purple-400/50 hover:bg-purple-500/10 text-white/80 hover:text-white transition"
              >
                {p.l}
              </button>
            ))}
          </div>

          <div className="text-center mb-6">
            <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mb-1">
              Total
            </p>
            <p className="text-2xl font-light text-white tabular">
              {String(hours).padStart(2, '0')}:
              {String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={total <= 0}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-medium transition hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background:
                  'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                boxShadow:
                  '0 8px 30px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              Create Timer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ======================================================
   Main Timer Page
   ====================================================== */
export default function Timer() {
  const { timers, toggleTimer, resetTimer, deleteTimer, addCustomTimer } =
    useTimers()

  const [fullscreenId, setFullscreenId] = useState(null)
  const [showCustomModal, setShowCustomModal] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setFullscreenId(null)
        setShowCustomModal(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const fullscreenTimer = timers.find((t) => t.id === fullscreenId)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background:
                  'linear-gradient(135deg, #fde68a 0%, #f0abfc 45%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.45))',
              }}
            >
              Timer
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Stay Focused</span>
              <span className="text-purple-400">·</span>
              <span>Be Productive</span>
              <span className="text-purple-400">·</span>
              <span>Build A Better You</span>
            </div>
          </div>

          <div className="hidden lg:block text-right max-w-[240px]">
            <p className="text-sm italic text-white/75 leading-relaxed">
              "Better Time
              <br />A Brighter You"
            </p>
            <div className="mt-2 ml-auto w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-24 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {timers.map((timer) => (
              <TimerCard
                key={timer.id}
                timer={timer}
                onToggle={toggleTimer}
                onReset={resetTimer}
                onFullscreen={setFullscreenId}
                onDelete={deleteTimer}
              />
            ))}
          </div>

          {timers.length === 0 && (
            <div className="text-center py-20 text-white/50 text-sm">
              No timers yet. Click (+) to add one.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowCustomModal(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          boxShadow:
            '0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
        title="New custom timer"
      >
        <Plus size={24} className="text-white" />
      </button>

      {showCustomModal && (
        <CustomTimeModal
          onClose={() => setShowCustomModal(false)}
          onCreate={addCustomTimer}
        />
      )}

      {fullscreenTimer && (
        <FullscreenTimer
          timer={fullscreenTimer}
          onToggle={toggleTimer}
          onReset={resetTimer}
          onClose={() => setFullscreenId(null)}
        />
      )}
    </div>
  )
}