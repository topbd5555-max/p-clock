import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { pclock, isRunningInElectron } from '../lib/pclock.js'
import { ACHIEVEMENTS, checkAndUnlock } from '../lib/achievements.js'

const AchievementsContext = createContext(null)

export function AchievementsProvider({ children }) {
  const [unlockedKeys, setUnlockedKeys] = useState(new Set())
  const [stats, setStats] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  const [activeToast, setActiveToast] = useState(null)
  const initialCheckDone = useRef(false)

  /* Load unlocked list on mount */
  const refreshList = useCallback(async () => {
    try {
      const list = await pclock.achievements.list()
      setUnlockedKeys(new Set((list || []).map((a) => a.key)))
    } catch {
      /* ignore */
    }
  }, [])

  /* Run full check — returns newly unlocked */
  const runCheck = useCallback(
    async ({ showToasts = true } = {}) => {
      if (!isRunningInElectron) return []
      const { stats: s, newlyUnlocked } = await checkAndUnlock(pclock)
      if (s) setStats(s)
      if (newlyUnlocked.length > 0) {
        await refreshList()
        if (showToasts) {
          setToastQueue((q) => [...q, ...newlyUnlocked])
        }
      }
      return newlyUnlocked
    },
    [refreshList]
  )

  /* Initial check + interval polling */
  useEffect(() => {
    if (!isRunningInElectron) return

    ;(async () => {
      await refreshList()
      await runCheck({ showToasts: false })
      initialCheckDone.current = true
    })()

    // Poll every 90s to catch state changes from other sources
    const id = setInterval(() => {
      if (initialCheckDone.current) {
        runCheck({ showToasts: true })
      }
    }, 90000)

    return () => clearInterval(id)
  }, [refreshList, runCheck])

  /* Toast queue processor */
  useEffect(() => {
    if (activeToast) return
    if (toastQueue.length === 0) return
    const [next, ...rest] = toastQueue
    setActiveToast(next)
    setToastQueue(rest)

    const timer = setTimeout(() => setActiveToast(null), 4500)
    return () => clearTimeout(timer)
  }, [toastQueue, activeToast])

  return (
    <AchievementsContext.Provider
      value={{
        unlockedKeys,
        stats,
        refreshList,
        runCheck,
        catalog: ACHIEVEMENTS,
      }}
    >
      {children}
      <AchievementToast achievement={activeToast} />
    </AchievementsContext.Provider>
  )
}

/* ============================================================
   Achievement Toast — bottom-right slide-in
   ============================================================ */
function AchievementToast({ achievement }) {
  if (!achievement) return null

  return (
    <div
      className="fixed bottom-6 left-6 z-[90] pointer-events-none"
      style={{ animation: 'achSlideIn 0.5s ease-out' }}
    >
      <div
        className="relative rounded-2xl p-[1.5px] w-[340px]"
        style={{
          background:
            'linear-gradient(135deg, #fbbf24 0%, #a855f7 50%, #ec4899 100%)',
          boxShadow:
            '0 0 40px rgba(168,85,247,0.7), 0 0 80px rgba(251,191,36,0.4)',
        }}
      >
        <div className="rounded-2xl bg-[#0a0518]/95 backdrop-blur-2xl p-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background:
                  'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)',
                animationDuration: '1.5s',
              }}
            />
            <div
              className="relative w-14 h-14 rounded-full flex items-center justify-center text-3xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(168,85,247,0.3) 100%)',
                border: '1.5px solid rgba(251,191,36,0.7)',
                boxShadow: '0 0 25px rgba(251,191,36,0.6)',
              }}
            >
              {achievement.icon}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-semibold mb-0.5">
              Achievement Unlocked
            </p>
            <p className="text-sm font-bold text-white truncate">
              {achievement.title}
            </p>
            <p className="text-[11px] text-white/60 truncate">
              {achievement.desc}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes achSlideIn {
          from { transform: translateX(-30px) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function useAchievements() {
  const ctx = useContext(AchievementsContext)
  if (!ctx) throw new Error('useAchievements must be inside AchievementsProvider')
  return ctx
}