import { useState } from 'react'
import { Play, Pencil, ChevronUp, ChevronDown, Sparkles, BarChart3, Zap } from 'lucide-react'

function GlowRing({ progress, size = 150, stroke = 6 }) {
  const radius = (size - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - progress * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <svg
        width={size}
        height={size}
        className="relative transform -rotate-90"
        style={{ filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.7))' }}
      >
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="url(#ringGrad)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.6s ease',
          }}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    </div>
  )
}

export default function Focus() {
  const [minutes, setMinutes] = useState(30)
  const [skipBreaks, setSkipBreaks] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [dailyGoal] = useState(1)
  const [yesterdayMinutes] = useState(0)
  const [streakDays] = useState(0)
  const [completedMinutes] = useState(0)

  const inc = () => setMinutes((m) => Math.min(m + 5, 240))
  const dec = () => setMinutes((m) => Math.max(m - 5, 5))

  const startSession = () => setSessionActive(true)
  const dailyProgress = Math.min(completedMinutes / (dailyGoal * 60), 1)

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold glow-text tracking-tight">
            Focus sessions
          </h1>
          <p className="text-sm text-white/60 mt-2">
            Stay consistent. Build a better you.
          </p>
        </div>

        <div className="text-right max-w-xs">
          <p className="text-sm italic text-white/70 leading-relaxed">
            "Discipline today <br />
            creates the freedom tomorrow."
          </p>
          <div className="mt-2 ml-auto w-16 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ============ LEFT CARD — Get ready to focus ============ */}
        <div className="relative glass glass-purple rounded-3xl p-8 overflow-hidden">
          {/* Faint warm scene behind */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 30% 80%, rgba(255,140,60,0.25) 0%, transparent 50%), radial-gradient(ellipse at 70% 90%, rgba(255,90,30,0.15) 0%, transparent 60%)',
            }}
          />
          {/* Faint laptop glow */}
          <div
            className="absolute bottom-10 left-[12%] w-40 h-24 rounded-lg opacity-30 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(120,140,200,0.5), rgba(60,70,120,0.3))',
              filter: 'blur(15px)',
            }}
          />

          <div className="relative">
            {/* Edit button top right */}
            <div className="flex justify-end mb-2">
              <button className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition">
                <Pencil size={14} />
              </button>
            </div>

            {/* Sparkle icon */}
            <div className="flex justify-center mb-3">
              <Sparkles size={28} className="text-purple-300" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Get ready to focus
            </h2>
            <p className="text-sm text-white/65 text-center mb-7 max-w-sm mx-auto leading-relaxed">
              We'll turn off notifications and app alerts during each session.
              For longer sessions, we'll add a short break so you can recharge.
            </p>

            {/* Time selector */}
            <div className="flex justify-center mb-4">
              <div className="relative glass rounded-2xl px-8 py-5 border border-white/15 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-light text-white tabular">
                    {minutes}
                  </span>
                  <span className="text-sm text-white/60">mins</span>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  <button
                    onClick={inc}
                    className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={dec}
                    className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/55 text-center mb-4">
              You'll have 1 break.
            </p>

            {/* Skip breaks */}
            <label className="flex items-center justify-center gap-2 text-sm text-white mb-7 cursor-pointer">
              <input
                type="checkbox"
                checked={skipBreaks}
                onChange={(e) => setSkipBreaks(e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
              <span>Skip breaks</span>
            </label>

            {/* Start button */}
            <div className="flex justify-center">
              <button
                onClick={startSession}
                className="group relative flex items-center gap-3 px-10 py-4 rounded-full text-white font-medium transition-transform hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background:
                    'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                  boxShadow:
                    '0 8px 40px rgba(168,85,247,0.5), 0 0 80px rgba(192,38,211,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                <Play size={16} fill="white" />
                <span>
                  {sessionActive ? 'Session in progress...' : 'Start focus session'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ============ RIGHT COLUMN ============ */}
        <div className="flex flex-col gap-5">
          {/* ---------- Daily progress card ---------- */}
          <div className="relative glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-purple-300" />
                <h3 className="text-base font-semibold text-white">
                  Daily progress
                </h3>
              </div>
              <button className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition">
                <Pencil size={13} />
              </button>
            </div>

            {/* 3-column layout */}
            <div className="flex items-center justify-between gap-4">
              {/* Yesterday */}
              <div className="text-center flex-1">
                <div className="text-2xl mb-2">🔥</div>
                <p className="text-xs text-white/60 mb-1">Yesterday</p>
                <p className="text-3xl font-light text-white tabular">
                  {yesterdayMinutes}
                </p>
                <p className="text-[11px] text-white/50">minutes</p>
              </div>

              {/* Center ring */}
              <div className="relative flex items-center justify-center shrink-0">
                <GlowRing progress={dailyProgress} size={150} stroke={6} />
                <div className="absolute text-center">
                  <p className="text-[10px] text-white/60 mb-0.5">Daily goal</p>
                  <p className="text-2xl font-light text-white">{dailyGoal}</p>
                  <p className="text-[10px] text-white/60">hour</p>
                </div>
              </div>

              {/* Streak */}
              <div className="text-center flex-1">
                <div className="text-2xl mb-2">👑</div>
                <p className="text-xs text-white/60 mb-1">Streak</p>
                <p className="text-3xl font-light text-white tabular">
                  {streakDays}
                </p>
                <p className="text-[11px] text-white/50">days</p>
              </div>
            </div>

            {/* Bottom pill */}
            <div className="mt-5 flex justify-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-purple-400/25 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Zap size={14} className="text-purple-300" fill="#c084fc" />
                <span className="text-xs text-white/85">
                  Completed: {completedMinutes} minutes
                </span>
              </div>
            </div>
          </div>

          {/* ---------- Spotify card ---------- */}
          <div className="relative glass glass-green rounded-3xl p-6 overflow-hidden">
            {/* Background waveform */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d="M0,150 Q50,80 100,120 T200,100 T300,130 T400,90 T500,120 T600,100"
                  stroke="#1ed760"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M0,170 Q80,120 160,150 T320,140 T480,155 T600,135"
                  stroke="#1ed760"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.6"
                />
              </svg>
            </div>

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center shadow-[0_0_20px_rgba(30,215,96,0.5)]">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#000">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.5c-.2.3-.6.4-.9.2-2.3-1.4-5.2-1.7-8.6-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.7-.8 7-.5 9.6 1.1.3.2.4.6.3.8zm1.2-2.7c-.2.4-.7.5-1 .3-2.6-1.6-6.6-2.1-9.7-1.1-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3.6-1.1 7.9-.5 10.9 1.3.3.2.5.6.2.9zm.1-2.8C14.9 9.1 9.6 8.9 6.5 9.8c-.5.1-.9-.1-1.1-.6-.1-.5.1-.9.6-1.1 3.6-1.1 9.4-.9 12.9 1.1.4.3.6.8.3 1.2-.2.3-.7.4-1 .2z" />
                    </svg>
                  </div>
                  <span className="text-base font-semibold text-white">Spotify</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed mb-4 max-w-[280px]">
                  You need the Spotify app to enhance your focus sessions with
                  music and podcasts.
                </p>

                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-black transition-transform hover:scale-[1.03]"
                  style={{
                    background: 'linear-gradient(135deg, #1ed760 0%, #1db954 100%)',
                    boxShadow: '0 6px 25px rgba(30,215,96,0.5)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.5c-.2.3-.6.4-.9.2-2.3-1.4-5.2-1.7-8.6-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.7-.8 7-.5 9.6 1.1.3.2.4.6.3.8zm1.2-2.7c-.2.4-.7.5-1 .3-2.6-1.6-6.6-2.1-9.7-1.1-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3.6-1.1 7.9-.5 10.9 1.3.3.2.5.6.2.9zm.1-2.8C14.9 9.1 9.6 8.9 6.5 9.8c-.5.1-.9-.1-1.1-.6-.1-.5.1-.9.6-1.1 3.6-1.1 9.4-.9 12.9 1.1.4.3.6.8.3 1.2-.2.3-.7.4-1 .2z" />
                  </svg>
                  Install Spotify
                </button>
              </div>

              {/* Headphones visual */}
              <div className="shrink-0 text-6xl opacity-90 pr-2">🎧</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}