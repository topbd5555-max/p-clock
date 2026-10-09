import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Flame, Moon, AlarmClock, Crown } from 'lucide-react'
import { pclock } from '../lib/pclock.js'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/* ============================================================
   Mini Cosmic Scene inside each cell
   ============================================================ */
function CellCosmicScene({ variant = 0 }) {
  // Different scenes based on variant for variety
  const scenes = [
    // Scene 0 — left mountain range with nebula
    {
      bg: 'radial-gradient(ellipse at 30% 80%, rgba(168,85,247,0.45) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.3) 0%, transparent 50%), linear-gradient(180deg, #0a0420 0%, #1a0738 60%, #2d0f4a 100%)',
      hasMountain: true,
      mountainSide: 'left',
    },
    // Scene 1 — right mountain with purple river
    {
      bg: 'radial-gradient(ellipse at 70% 90%, rgba(251,146,60,0.35) 0%, transparent 50%), radial-gradient(ellipse at 40% 30%, rgba(168,85,247,0.4) 0%, transparent 60%), linear-gradient(180deg, #08031a 0%, #1f0938 55%, #3d1355 100%)',
      hasMountain: true,
      mountainSide: 'right',
    },
    // Scene 2 — center nebula glow
    {
      bg: 'radial-gradient(circle at 50% 60%, rgba(168,85,247,0.5) 0%, transparent 55%), radial-gradient(circle at 20% 20%, rgba(255,180,90,0.25) 0%, transparent 45%), linear-gradient(180deg, #0a0420 0%, #190732 100%)',
      hasMountain: true,
      mountainSide: 'center',
    },
    // Scene 3 — golden horizon
    {
      bg: 'radial-gradient(ellipse at 50% 100%, rgba(251,146,60,0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 30%, rgba(168,85,247,0.35) 0%, transparent 55%), linear-gradient(180deg, #0a0420 0%, #200840 100%)',
      hasMountain: true,
      mountainSide: 'both',
    },
  ]
  const scene = scenes[variant % scenes.length]

  return (
    <div className="absolute inset-0 overflow-hidden animate-cosmic-scene-drift">
      {/* Base gradient */}
      <div className="absolute inset-0" style={{ background: scene.bg }} />

      {/* Stars */}
      <div className="absolute inset-0 opacity-70">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${(i * 41.7) % 100}%`,
              top: `${(i * 67.3) % 60}%`,
              width: i % 3 === 0 ? '1.5px' : '1px',
              height: i % 3 === 0 ? '1.5px' : '1px',
              animationDelay: `${(i % 4) * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Mountain silhouettes */}
      {scene.hasMountain && (
        <svg
          className="absolute bottom-0 left-0 w-full h-[55%]"
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`mnt-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0420" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#02010a" />
            </linearGradient>
            <linearGradient id={`mnt2-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a0738" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#050210" />
            </linearGradient>
          </defs>
          {scene.mountainSide === 'left' && (
            <>
              <path
                d="M0,100 L0,40 L25,55 L50,35 L75,60 L100,50 L100,100 Z"
                fill={`url(#mnt2-${variant})`}
              />
              <path
                d="M0,100 L0,60 L30,75 L55,55 L85,80 L100,72 L100,100 Z"
                fill={`url(#mnt-${variant})`}
              />
            </>
          )}
          {scene.mountainSide === 'right' && (
            <>
              <path
                d="M100,100 L100,45 L125,60 L150,38 L175,65 L200,50 L200,100 Z"
                fill={`url(#mnt2-${variant})`}
              />
              <path
                d="M100,100 L100,70 L130,80 L155,60 L185,85 L200,75 L200,100 Z"
                fill={`url(#mnt-${variant})`}
              />
            </>
          )}
          {scene.mountainSide === 'center' && (
            <>
              <path
                d="M0,100 L0,75 L40,55 L70,80 L100,45 L130,85 L160,60 L200,78 L200,100 Z"
                fill={`url(#mnt2-${variant})`}
              />
              <path
                d="M0,100 L0,90 L50,72 L90,90 L120,68 L160,90 L200,80 L200,100 Z"
                fill={`url(#mnt-${variant})`}
              />
            </>
          )}
          {scene.mountainSide === 'both' && (
            <>
              <path
                d="M0,100 L0,55 L30,72 L60,50 L100,80 L140,55 L170,75 L200,60 L200,100 Z"
                fill={`url(#mnt2-${variant})`}
              />
              <path
                d="M0,100 L0,80 L40,90 L75,70 L115,90 L155,75 L200,88 L200,100 Z"
                fill={`url(#mnt-${variant})`}
              />
            </>
          )}
        </svg>
      )}

      {/* Bottom reflection glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[20%]"
        style={{
          background:
            'linear-gradient(to top, rgba(251,146,60,0.5) 0%, rgba(251,191,36,0.15) 40%, transparent 100%)',
        }}
      />
    </div>
  )
}

/* ============================================================
   Luxury Calendar Cell
   ============================================================ */
function CalendarCell({ cell, isToday, data, isSelected, onClick, index }) {
  const dayNum = cell.date.getDate()
  const inMonth = cell.inMonth
  const totalMin = data?.total || 0

  if (!inMonth) {
    return (
      <div
        className="relative rounded-2xl aspect-square flex flex-col p-3 opacity-30"
        style={{
          background: 'linear-gradient(135deg, rgba(10,5,24,0.6) 0%, rgba(20,10,40,0.5) 100%)',
          border: '1px solid rgba(251,191,36,0.15)',
        }}
      >
        <span className="font-cinzel text-2xl text-white/40 font-bold">{dayNum}</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`group relative rounded-2xl aspect-square overflow-hidden transition-all duration-500 hover:scale-[1.03] ${
        isToday ? 'animate-today-gold-pulse' : 'animate-gold-border-pulse'
      } ${isSelected ? 'scale-[1.03]' : ''}`}
      style={{
        border: isToday
          ? '2px solid rgba(251,191,36,0.95)'
          : '1.5px solid rgba(251,191,36,0.55)',
      }}
    >
      {/* Mini cosmic scene inside */}
      <CellCosmicScene variant={index % 4} />

      {/* Dark vignette overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 30%, transparent 30%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Diagonal shimmer sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          className="absolute w-[60%] h-[200%] animate-shimmer-diag"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Top-left corner glow */}
      <div
        className="absolute top-0 left-0 w-16 h-16 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgba(251,191,36,0.35) 0%, transparent 70%)',
        }}
      />

      {/* Bottom-right corner glow */}
      <div
        className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 100% 100%, rgba(168,85,247,0.35) 0%, transparent 70%)',
        }}
      />

      {/* Date number */}
      <div className="absolute top-2 left-3 z-10">
        <span
          className="font-cinzel text-2xl md:text-3xl font-bold tabular"
          style={{
            background: isToday
              ? 'linear-gradient(135deg, #fff8dc 0%, #fbbf24 60%, #d4a24c 100%)'
              : 'linear-gradient(135deg, #f5d485 0%, #d4a24c 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: isToday
              ? 'drop-shadow(0 0 12px rgba(251,191,36,0.9)) drop-shadow(0 0 20px rgba(251,191,36,0.5))'
              : 'drop-shadow(0 0 6px rgba(251,191,36,0.55)) drop-shadow(0 0 12px rgba(251,191,36,0.3))',
          }}
        >
          {dayNum}
        </span>
      </div>

      {/* Activity dots */}
      {data && (
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 z-10">
          {totalMin > 0 && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, #c084fc 0%, #a855f7 100%)',
                boxShadow: '0 0 8px #a855f7, 0 0 16px rgba(168,85,247,0.7)',
              }}
              title={`${Math.round(totalMin / 60)} min of sessions`}
            />
          )}
          {data.sleeps.length > 0 && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, #818cf8 0%, #6366f1 100%)',
                boxShadow: '0 0 8px #6366f1, 0 0 16px rgba(99,102,241,0.7)',
                animationDelay: '0.3s',
              }}
              title="Sleep logged"
            />
          )}
          {data.alarms.length > 0 && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, #fde68a 0%, #fbbf24 100%)',
                boxShadow: '0 0 8px #fbbf24, 0 0 16px rgba(251,191,36,0.7)',
                animationDelay: '0.6s',
              }}
              title="Active alarm"
            />
          )}
        </div>
      )}

      {/* TODAY badge */}
      {isToday && (
        <div
          className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-[0.15em] uppercase"
          style={{
            background: 'linear-gradient(135deg, #fff8dc 0%, #fbbf24 50%, #d4a24c 100%)',
            color: '#1a0738',
            boxShadow:
              '0 0 15px rgba(251,191,36,0.9), 0 0 30px rgba(251,191,36,0.5), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          Today
        </div>
      )}
    </button>
  )
}

/* ============================================================
   Main Calendar Page
   ============================================================ */
export default function CalendarView() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [sessions, setSessions] = useState([])
  const [sleeps, setSleeps] = useState([])
  const [alarms, setAlarms] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [s, sl, al] = await Promise.all([
          pclock.sessions.recent(500),
          pclock.sleep.list(100),
          pclock.alarms.list(),
        ])
        setSessions(s || [])
        setSleeps(sl || [])
        setAlarms(al || [])
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const grid = useMemo(() => {
    const first = new Date(cursor)
    const firstDay = first.getDay()
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0
    ).getDate()

    const cells = []
    const prevMonthDays = new Date(cursor.getFullYear(), cursor.getMonth(), 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(cursor.getFullYear(), cursor.getMonth() - 1, prevMonthDays - i),
        inMonth: false,
      })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(cursor.getFullYear(), cursor.getMonth(), d),
        inMonth: true,
      })
    }
    const remaining = (7 - (cells.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(cursor.getFullYear(), cursor.getMonth() + 1, d),
        inMonth: false,
      })
    }
    return cells
  }, [cursor])

  const dataMap = useMemo(() => {
    const map = {}
    const key = (d) => {
      const x = new Date(d)
      x.setHours(0, 0, 0, 0)
      return x.getTime()
    }

    for (const s of sessions) {
      if (!s.completed) continue
      const k = key(s.started_at)
      if (!map[k]) map[k] = { sessions: [], total: 0, sleeps: [], alarms: [] }
      map[k].sessions.push(s)
      map[k].total += s.duration_seconds
    }
    for (const sl of sleeps) {
      const k = key(sl.wake_time)
      if (!map[k]) map[k] = { sessions: [], total: 0, sleeps: [], alarms: [] }
      map[k].sleeps.push(sl)
    }
    for (const a of alarms) {
      if (!a.enabled) continue
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const k = today.getTime()
      if (!map[k]) map[k] = { sessions: [], total: 0, sleeps: [], alarms: [] }
      map[k].alarms.push(a)
    }
    return map
  }, [sessions, sleeps, alarms])

  const monthName = cursor.toLocaleDateString('en-US', { month: 'long' })
  const yearNum = cursor.getFullYear()

  const prev = () => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() - 1)
    setCursor(d)
  }
  const next = () => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + 1)
    setCursor(d)
  }
  const goToday = () => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    setCursor(d)
  }

  const selectedData = selectedDay ? dataMap[selectedDay.getTime()] : null

  const formatMin = (sec) => {
    const m = Math.round(sec / 60)
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const todayKey = (() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t.getTime()
  })()

  return (
    <div className="relative h-full w-full overflow-hidden">

      {/* Extra dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 shrink-0 gap-4 flex-wrap">
          {/* Left: Title + Crown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Crown
                size={32}
                className="text-amber-300 animate-crown-float"
                style={{
                  filter:
                    'drop-shadow(0 0 12px rgba(251,191,36,0.9)) drop-shadow(0 0 24px rgba(251,191,36,0.5))',
                }}
                strokeWidth={1.8}
              />
            </div>
            <div>
              <h1 className="font-cinzel text-4xl md:text-5xl font-bold tracking-tight title-shine leading-none">
                Calendar
              </h1>
              <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-[0.35em] text-amber-200/70">
                <span>Track</span>
                <span className="text-amber-400">·</span>
                <span>Reflect</span>
                <span className="text-amber-400">·</span>
                <span>Grow</span>
              </div>
            </div>
          </div>

          {/* Right: Today + nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="px-5 py-2 rounded-2xl text-sm font-medium transition-all hover:scale-105"
              style={{
                background:
                  'linear-gradient(135deg, rgba(60,20,90,0.75) 0%, rgba(40,15,70,0.85) 100%)',
                border: '1.5px solid rgba(251,191,36,0.75)',
                color: '#f5d485',
                boxShadow:
                  '0 0 20px rgba(251,191,36,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                textShadow: '0 0 8px rgba(251,191,36,0.6)',
              }}
            >
              Today
            </button>
            <button
              onClick={prev}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
              style={{
                background:
                  'linear-gradient(135deg, rgba(60,20,90,0.75) 0%, rgba(40,15,70,0.85) 100%)',
                border: '1.5px solid rgba(251,191,36,0.6)',
                boxShadow: '0 0 15px rgba(251,191,36,0.3)',
              }}
            >
              <ChevronLeft size={18} className="text-amber-200" />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
              style={{
                background:
                  'linear-gradient(135deg, rgba(60,20,90,0.75) 0%, rgba(40,15,70,0.85) 100%)',
                border: '1.5px solid rgba(251,191,36,0.6)',
                boxShadow: '0 0 15px rgba(251,191,36,0.3)',
              }}
            >
              <ChevronRight size={18} className="text-amber-200" />
            </button>
          </div>
        </div>

        {/* Month + Year */}
        <div className="px-6 pb-4 shrink-0">
          <h2 className="font-cinzel text-2xl md:text-3xl font-bold tracking-wide">
            <span className="text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.4)' }}>
              {monthName}{' '}
            </span>
            <span className="purple-gold-text" style={{ filter: 'drop-shadow(0 0 15px rgba(168,85,247,0.7))' }}>
              {yearNum}
            </span>
          </h2>
        </div>

        {/* Main scrollable area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Weekday header — golden pills */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-bold uppercase tracking-[0.2em] py-2.5 rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(60,20,90,0.65) 0%, rgba(40,15,70,0.7) 100%)',
                  border: '1.5px solid rgba(251,191,36,0.7)',
                  color: '#f5d485',
                  boxShadow:
                    '0 0 15px rgba(251,191,36,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                  textShadow: '0 0 8px rgba(251,191,36,0.6)',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-3">
            {grid.map((cell, i) => {
              const k = cell.date.getTime()
              return (
                <CalendarCell
                  key={i}
                  cell={cell}
                  index={i}
                  isToday={k === todayKey}
                  data={dataMap[k]}
                  isSelected={
                    selectedDay &&
                    selectedDay.toDateString() === cell.date.toDateString()
                  }
                  onClick={() => cell.inMonth && setSelectedDay(cell.date)}
                />
              )
            })}
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <div
              className="mt-6 rounded-2xl p-5 relative overflow-hidden backdrop-blur-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(30,12,50,0.92) 0%, rgba(50,20,80,0.88) 100%)',
                border: '1.5px solid rgba(251,191,36,0.55)',
                boxShadow:
                  '0 0 40px rgba(251,191,36,0.3), 0 0 80px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Rotating beam */}
              <div
                className="absolute -inset-1/2 pointer-events-none animate-cell-beam-spin opacity-25"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.4) 40deg, transparent 90deg, transparent 200deg, rgba(168,85,247,0.4) 250deg, transparent 310deg)',
                  filter: 'blur(30px)',
                }}
              />
              <div className="relative">
                <h3 className="font-cinzel text-lg font-bold mb-4 gold-text"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))' }}
                >
                  {selectedDay.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                {!selectedData ? (
                  <p className="text-xs text-white/50 py-4">
                    No activity recorded on this day.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedData.sessions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Flame size={12} className="text-purple-300" />
                          <span className="text-[11px] text-amber-200/80 uppercase tracking-wider font-medium">
                            Sessions · {formatMin(selectedData.total)}
                          </span>
                        </div>
                        {selectedData.sessions.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg mb-1"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(251,191,36,0.2)',
                            }}
                          >
                            <span className="text-xs text-white capitalize">{s.type}</span>
                            <span className="text-xs text-amber-200/80 tabular">
                              {formatMin(s.duration_seconds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedData.sleeps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Moon size={12} className="text-indigo-300" />
                          <span className="text-[11px] text-amber-200/80 uppercase tracking-wider font-medium">
                            Sleep
                          </span>
                        </div>
                        {selectedData.sleeps.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg mb-1"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(251,191,36,0.2)',
                            }}
                          >
                            <span className="text-xs text-white tabular">
                              {new Date(s.bedtime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}{' '}
                              →{' '}
                              {new Date(s.wake_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-xs text-amber-200/80 tabular">
                              {formatMin((s.wake_time - s.bedtime) / 1000)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedData.alarms.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlarmClock size={12} className="text-amber-300" />
                          <span className="text-[11px] text-amber-200/80 uppercase tracking-wider font-medium">
                            Active alarms
                          </span>
                        </div>
                        {selectedData.alarms.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg mb-1"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(251,191,36,0.2)',
                            }}
                          >
                            <span className="text-xs text-white tabular">{a.time}</span>
                            <span className="text-xs text-amber-200/80 truncate ml-3">
                              {a.label || 'Alarm'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-5 mt-5 px-1 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7' }}
              />
              <span className="text-amber-100/70">Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: '#6366f1', boxShadow: '0 0 8px #6366f1' }}
              />
              <span className="text-amber-100/70">Sleep</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}
              />
              <span className="text-amber-100/70">Alarm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}