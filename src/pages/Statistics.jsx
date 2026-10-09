import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Target,
  Moon,
  Flame,
  Flower2,
  Lock as LockIcon,
} from 'lucide-react'
import CosmicBackground from '../components/CosmicBackground.jsx'
import { pclock } from '../lib/pclock.js'
import { ACHIEVEMENTS, TIER_COLORS } from '../lib/achievements.js'
import { useAchievements } from '../context/AchievementsContext.jsx'

const TYPE_META = {
  pomodoro: { label: 'Pomodoro', color: '#a855f7', icon: Flame },
  interval: { label: 'Interval', color: '#ef4444', icon: Target },
  meditation: { label: 'Meditation', color: '#38bdf8', icon: Flower2 },
  focus: { label: 'Focus', color: '#ec4899', icon: Target },
}

function formatMinutes(sec) {
  const m = Math.round(sec / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm === 0 ? `${h}h` : `${h}h ${mm}m`
}

export default function Statistics() {
  const { unlockedKeys, runCheck } = useAchievements()
  const [recent, setRecent] = useState([])
  const [stats, setStats] = useState({
    daily: { count: 0, total: 0 },
    weekly: { count: 0, total: 0 },
    monthly: { count: 0, total: 0 },
  })
  const [sleepStats, setSleepStats] = useState({
    weekly: { count: 0, avgSeconds: 0, avgQuality: 0 },
    monthly: { count: 0, avgSeconds: 0, avgQuality: 0 },
  })
  const [unlockedList, setUnlockedList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [r, s, sl, a] = await Promise.all([
          pclock.sessions.recent(200),
          pclock.sessions.stats(),
          pclock.sleep.stats(),
          pclock.achievements.list(),
        ])
        setRecent(r || [])
        if (s) setStats(s)
        if (sl) setSleepStats(sl)
        setUnlockedList(a || [])
      } catch {
        /* ignore */
      }
      // Also run a fresh check (in case user opened this page after finishing session)
      try {
        await runCheck({ showToasts: true })
      } catch {
        /* ignore */
      }
      setLoading(false)
    })()
    // eslint-disable-next-line
  }, [])

  const week = useMemo(() => {
    const days = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const next = new Date(d)
      next.setDate(d.getDate() + 1)
      const sessions = recent.filter(
        (s) => s.started_at >= d.getTime() && s.started_at < next.getTime() && s.completed
      )
      const total = sessions.reduce((sum, s) => sum + s.duration_seconds, 0)
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d,
        total,
        count: sessions.length,
      })
    }
    return days
  }, [recent])

  const maxWeek = Math.max(...week.map((d) => d.total), 3600)

  const byType = useMemo(() => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const map = {}
    for (const s of recent) {
      if (s.started_at < monthAgo || !s.completed) continue
      if (!map[s.type]) map[s.type] = { count: 0, total: 0 }
      map[s.type].count++
      map[s.type].total += s.duration_seconds
    }
    return Object.entries(map)
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.total - a.total)
  }, [recent])

  const totalMonth = byType.reduce((sum, t) => sum + t.total, 0)

  const streak = useMemo(() => {
    const daySet = new Set()
    for (const s of recent) {
      if (!s.completed) continue
      const d = new Date(s.started_at)
      d.setHours(0, 0, 0, 0)
      daySet.add(d.getTime())
    }
    let count = 0
    const cur = new Date()
    cur.setHours(0, 0, 0, 0)
    while (daySet.has(cur.getTime())) {
      count++
      cur.setDate(cur.getDate() - 1)
    }
    return count
  }, [recent])

  const unlockedMap = useMemo(() => {
    const m = {}
    for (const a of unlockedList) m[a.key] = a.unlocked_at
    return m
  }, [unlockedList])

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedMap[a.id]).length
  const totalAchievements = ACHIEVEMENTS.length
  const achievementPct = Math.round((unlockedCount / totalAchievements) * 100)

  if (loading) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <CosmicBackground />
        <div className="relative z-10 h-full flex items-center justify-center">
          <p className="text-white/50 text-sm animate-pulse">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <CosmicBackground />

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #fde68a 0%, #f0abfc 45%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Statistics
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Track</span>
              <span className="text-purple-400">·</span>
              <span>Grow</span>
              <span className="text-purple-400">·</span>
              <span>Excel</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
          {/* Top stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <BigStat
              icon={<Flame size={20} className="text-orange-300" />}
              label="Streak"
              value={streak}
              suffix="days"
              accent="rgba(251,146,60,0.15)"
            />
            <BigStat
              icon={<Clock size={20} className="text-purple-300" />}
              label="Today"
              value={formatMinutes(stats.daily.total)}
              accent="rgba(168,85,247,0.15)"
            />
            <BigStat
              icon={<TrendingUp size={20} className="text-emerald-300" />}
              label="This week"
              value={formatMinutes(stats.weekly.total)}
              accent="rgba(52,211,153,0.15)"
            />
            <BigStat
              icon={<BarChart3 size={20} className="text-cyan-300" />}
              label="This month"
              value={formatMinutes(stats.monthly.total)}
              accent="rgba(34,211,238,0.15)"
            />
          </div>

          {/* Weekly chart */}
          <div
            className="rounded-2xl p-5 mb-6 backdrop-blur-xl border border-white/10"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(168,85,247,0.05) 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Last 7 days</h3>
              <span className="text-xs text-white/50 tabular">
                {formatMinutes(week.reduce((s, d) => s + d.total, 0))} total
              </span>
            </div>
            <div className="flex items-end gap-2 h-44">
              {week.map((d, i) => {
                const h = (d.total / maxWeek) * 100
                const isToday = i === week.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-lg transition-all relative group"
                        style={{
                          height: `${Math.max(h, 2)}%`,
                          background: isToday
                            ? 'linear-gradient(to top, #ec4899 0%, #a855f7 100%)'
                            : 'linear-gradient(to top, #a855f7 0%, #7c3aed 100%)',
                          boxShadow: isToday
                            ? '0 0 20px rgba(236,72,153,0.5)'
                            : '0 0 12px rgba(168,85,247,0.3)',
                        }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-[10px] px-2 py-1 rounded bg-black/70 text-white whitespace-nowrap">
                          {formatMinutes(d.total)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        isToday ? 'text-purple-300 font-medium' : 'text-white/50'
                      }`}
                    >
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Two column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div
              className="rounded-2xl p-5 backdrop-blur-xl border border-white/10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(168,85,247,0.04) 100%)',
              }}
            >
              <h3 className="text-sm font-semibold text-white mb-4">30-day breakdown</h3>
              {byType.length === 0 ? (
                <p className="text-xs text-white/40 py-8 text-center">
                  No sessions yet. Start a Pomodoro or Meditation!
                </p>
              ) : (
                <div className="space-y-3">
                  {byType.map((t) => {
                    const meta = TYPE_META[t.type] || {
                      label: t.type,
                      color: '#a855f7',
                      icon: BarChart3,
                    }
                    const Icon = meta.icon
                    const pct = totalMonth > 0 ? (t.total / totalMonth) * 100 : 0
                    return (
                      <div key={t.type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon size={14} style={{ color: meta.color }} />
                            <span className="text-sm text-white">{meta.label}</span>
                            <span className="text-xs text-white/40">{t.count}×</span>
                          </div>
                          <span className="text-sm text-white/70 tabular">
                            {formatMinutes(t.total)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${meta.color} 0%, ${meta.color}cc 100%)`,
                              boxShadow: `0 0 12px ${meta.color}80`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div
              className="rounded-2xl p-5 backdrop-blur-xl border border-white/10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(99,102,241,0.05) 100%)',
              }}
            >
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Moon size={14} className="text-indigo-300" />
                Sleep this week
              </h3>
              {sleepStats.weekly.count === 0 ? (
                <p className="text-xs text-white/40 py-8 text-center">
                  No sleep records. Log one in Sleep Tracker!
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 bg-white/5 border border-white/8">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">
                        Avg duration
                      </p>
                      <p className="text-lg font-light text-white tabular">
                        {formatMinutes(sleepStats.weekly.avgSeconds)}
                      </p>
                    </div>
                    <div className="rounded-xl p-3 bg-white/5 border border-white/8">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">
                        Avg quality
                      </p>
                      <p className="text-lg font-light text-white tabular">
                        {sleepStats.weekly.avgQuality} / 5
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============ ACHIEVEMENTS GRID ============ */}
          <div
            className="rounded-2xl p-5 backdrop-blur-xl border border-white/10"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(251,191,36,0.05) 100%)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Award size={18} className="text-amber-300" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Achievements</h3>
                  <p className="text-[10px] text-white/40">
                    {unlockedCount} of {totalAchievements} unlocked
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${achievementPct}%`,
                      background:
                        'linear-gradient(90deg, #fbbf24 0%, #a855f7 100%)',
                      boxShadow: '0 0 15px rgba(251,191,36,0.6)',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-amber-300 tabular">
                  {achievementPct}%
                </span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const unlockedAt = unlockedMap[ach.id]
                const unlocked = !!unlockedAt
                const tier = TIER_COLORS[ach.tier]
                return (
                  <div
                    key={ach.id}
                    className="relative rounded-xl p-3 flex items-start gap-3 transition-all"
                    style={{
                      background: unlocked
                        ? `linear-gradient(135deg, ${tier.bg}22 0%, ${tier.bg}11 100%)`
                        : 'rgba(255,255,255,0.03)',
                      border: unlocked
                        ? `1.5px solid ${tier.ring}`
                        : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: unlocked
                        ? `0 0 20px ${tier.glow}`
                        : 'none',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                      style={{
                        background: unlocked
                          ? `linear-gradient(135deg, ${tier.bg}40 0%, ${tier.bg}20 100%)`
                          : 'rgba(255,255,255,0.05)',
                        border: unlocked
                          ? `1px solid ${tier.ring}`
                          : '1px solid rgba(255,255,255,0.08)',
                        filter: unlocked ? 'none' : 'grayscale(1) brightness(0.4)',
                      }}
                    >
                      {unlocked ? (
                        <span>{ach.icon}</span>
                      ) : (
                        <LockIcon size={14} className="text-white/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          unlocked ? 'text-white' : 'text-white/40'
                        }`}
                      >
                        {ach.title}
                      </p>
                      <p
                        className={`text-[10px] leading-tight mt-0.5 ${
                          unlocked ? 'text-white/60' : 'text-white/30'
                        }`}
                      >
                        {ach.desc}
                      </p>
                      {unlocked && unlockedAt && (
                        <p className="text-[9px] text-amber-300/70 mt-1">
                          {new Date(unlockedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    {unlocked && (
                      <div
                        className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{
                          background: tier.bg,
                          color: '#0a0518',
                          boxShadow: `0 0 10px ${tier.glow}`,
                        }}
                      >
                        {ach.tier}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BigStat({ icon, label, value, suffix, accent }) {
  return (
    <div
      className="rounded-2xl p-4 backdrop-blur-xl border border-white/10"
      style={{ background: `linear-gradient(135deg, ${accent} 0%, rgba(255,255,255,0.03) 100%)` }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-white/50 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-light text-white tabular">
        {value}
        {suffix && <span className="text-sm text-white/50 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}