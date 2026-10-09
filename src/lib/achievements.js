/* ============================================================
   Achievements Catalog
   Each achievement has: id, title, desc, icon, tier, check(stats)
   ============================================================ */

export const ACHIEVEMENTS = [
  // ===== Pomodoro =====
  {
    id: 'first_pomodoro',
    title: 'First Focus',
    desc: 'Complete your first Pomodoro session',
    icon: '🎯',
    tier: 'bronze',
    check: (s) => s.pomodoroCount >= 1,
  },
  {
    id: 'ten_pomodoros',
    title: 'Getting Serious',
    desc: 'Complete 10 Pomodoro sessions',
    icon: '🔥',
    tier: 'silver',
    check: (s) => s.pomodoroCount >= 10,
  },
  {
    id: 'fifty_pomodoros',
    title: 'Focus Machine',
    desc: 'Complete 50 Pomodoro sessions',
    icon: '⚡',
    tier: 'gold',
    check: (s) => s.pomodoroCount >= 50,
  },

  // ===== Meditation =====
  {
    id: 'first_meditation',
    title: 'Inner Peace',
    desc: 'Complete your first meditation session',
    icon: '🧘',
    tier: 'bronze',
    check: (s) => s.meditationCount >= 1,
  },
  {
    id: 'meditation_hour',
    title: 'Zen Seeker',
    desc: 'Accumulate 1 hour of meditation',
    icon: '☯️',
    tier: 'silver',
    check: (s) => s.meditationSeconds >= 3600,
  },
  {
    id: 'meditation_ten_hours',
    title: 'Zen Master',
    desc: 'Accumulate 10 hours of meditation',
    icon: '🌸',
    tier: 'platinum',
    check: (s) => s.meditationSeconds >= 36000,
  },

  // ===== Streaks =====
  {
    id: 'streak_3',
    title: 'Consistency',
    desc: '3-day activity streak',
    icon: '📅',
    tier: 'bronze',
    check: (s) => s.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    desc: '7-day activity streak',
    icon: '💪',
    tier: 'silver',
    check: (s) => s.currentStreak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    desc: '30-day activity streak',
    icon: '👑',
    tier: 'platinum',
    check: (s) => s.currentStreak >= 30,
  },

  // ===== Sleep =====
  {
    id: 'first_sleep_log',
    title: 'Rest Well',
    desc: 'Log your first sleep',
    icon: '😴',
    tier: 'bronze',
    check: (s) => s.sleepCount >= 1,
  },
  {
    id: 'sleep_week',
    title: 'Sleep Champion',
    desc: 'Log 7 nights of sleep',
    icon: '🌙',
    tier: 'silver',
    check: (s) => s.sleepCount >= 7,
  },

  // ===== Focus =====
  {
    id: 'focus_10h',
    title: 'Deep Work',
    desc: 'Accumulate 10 hours of total focus',
    icon: '🧠',
    tier: 'silver',
    check: (s) => s.totalFocusSeconds >= 36000,
  },
  {
    id: 'focus_100h',
    title: 'Focus Legend',
    desc: 'Accumulate 100 hours of total focus',
    icon: '🏆',
    tier: 'platinum',
    check: (s) => s.totalFocusSeconds >= 360000,
  },

  // ===== Alarm =====
  {
    id: 'first_alarm',
    title: 'Early Riser',
    desc: 'Create your first alarm',
    icon: '⏰',
    tier: 'bronze',
    check: (s) => s.alarmCount >= 1,
  },
  {
    id: 'five_alarms',
    title: 'Time Manager',
    desc: 'Create 5 alarms',
    icon: '🕰️',
    tier: 'silver',
    check: (s) => s.alarmCount >= 5,
  },

  // ===== Overall =====
  {
    id: 'total_50_sessions',
    title: 'Committed',
    desc: 'Complete 50 total sessions',
    icon: '✨',
    tier: 'gold',
    check: (s) => s.totalCompletedSessions >= 50,
  },
  {
    id: 'total_200_sessions',
    title: 'Devoted',
    desc: 'Complete 200 total sessions',
    icon: '💎',
    tier: 'platinum',
    check: (s) => s.totalCompletedSessions >= 200,
  },
]

export const TIER_COLORS = {
  bronze: { bg: '#cd7f32', glow: 'rgba(205,127,50,0.6)', ring: 'rgba(205,127,50,0.4)' },
  silver: { bg: '#c0c0c0', glow: 'rgba(192,192,192,0.6)', ring: 'rgba(192,192,192,0.4)' },
  gold: { bg: '#fbbf24', glow: 'rgba(251,191,36,0.7)', ring: 'rgba(251,191,36,0.4)' },
  platinum: { bg: '#a855f7', glow: 'rgba(168,85,247,0.7)', ring: 'rgba(168,85,247,0.5)' },
}

/* ============================================================
   Stats calculator — feeds check() functions
   ============================================================ */
export function computeStats({ sessions, sleepRecords, alarms }) {
  const completed = sessions.filter((s) => s.completed)

  const pomodoroCount = completed.filter((s) => s.type === 'pomodoro').length
  const meditationCount = completed.filter((s) => s.type === 'meditation').length
  const intervalCount = completed.filter((s) => s.type === 'interval').length

  const meditationSeconds = completed
    .filter((s) => s.type === 'meditation')
    .reduce((a, b) => a + (b.duration_seconds || 0), 0)

  const totalFocusSeconds = completed.reduce(
    (a, b) => a + (b.duration_seconds || 0),
    0
  )

  const totalCompletedSessions = completed.length

  // Streak: consecutive days (ending today or yesterday) with at least 1 completed session
  const days = new Set()
  completed.forEach((s) => {
    const d = new Date(s.started_at)
    d.setHours(0, 0, 0, 0)
    days.add(d.getTime())
  })

  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // Streak can start from today OR yesterday
  let cursor = days.has(today.getTime())
    ? today
    : days.has(yesterday.getTime())
    ? yesterday
    : null

  while (cursor && days.has(cursor.getTime())) {
    currentStreak++
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    pomodoroCount,
    meditationCount,
    intervalCount,
    meditationSeconds,
    totalFocusSeconds,
    totalCompletedSessions,
    sleepCount: sleepRecords.length,
    alarmCount: alarms.length,
    currentStreak,
  }
}

/* ============================================================
   Main checker — returns newly unlocked achievements
   ============================================================ */
export async function checkAndUnlock(pclock) {
  try {
    const [sessions, sleepRecords, alarms, alreadyUnlocked] = await Promise.all([
      pclock.sessions.recent(1000),
      pclock.sleep.list(500),
      pclock.alarms.list(),
      pclock.achievements.list(),
    ])

    const stats = computeStats({
      sessions: sessions || [],
      sleepRecords: sleepRecords || [],
      alarms: alarms || [],
    })

    const unlockedIds = new Set((alreadyUnlocked || []).map((a) => a.key))
    const newlyUnlocked = []

    for (const ach of ACHIEVEMENTS) {
      if (unlockedIds.has(ach.id)) continue
      try {
        if (ach.check(stats)) {
          const ok = await pclock.achievements.unlock(ach.id)
          if (ok) newlyUnlocked.push(ach)
        }
      } catch (e) {
        console.warn('Achievement check failed:', ach.id, e)
      }
    }

    return { stats, newlyUnlocked }
  } catch (e) {
    console.warn('checkAndUnlock error:', e)
    return { stats: null, newlyUnlocked: [] }
  }
}