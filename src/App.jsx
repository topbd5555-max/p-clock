import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import { TimerProvider } from './context/TimerContext.jsx'
import { SettingsProvider, useSettings } from './context/SettingsContext.jsx'
import { PomodoroProvider } from './context/PomodoroContext.jsx'
import { FullscreenProvider, useFullscreen } from './context/FullscreenContext.jsx'
import { AchievementsProvider, useAchievements } from './context/AchievementsContext.jsx'
import ThemedBackground from './components/ThemedBackground.jsx'
import Sidebar from './components/Sidebar.jsx'
import PinLockScreen from './components/PinLockScreen.jsx'
import UpdateChecker from './components/UpdateChecker.jsx'
import WorldClock from './pages/WorldClock.jsx'
import Timer from './pages/Timer.jsx'
import Alarm from './pages/Alarm.jsx'
import Stopwatch from './pages/Stopwatch.jsx'
import Focus from './pages/Focus.jsx'
import Meditation from './pages/Meditation.jsx'
import Pomodoro from './pages/Pomodoro.jsx'
import IntervalTimer from './pages/IntervalTimer.jsx'
import SleepTracker from './pages/SleepTracker.jsx'
import MeetingPlanner from './pages/MeetingPlanner.jsx'
import Weather from './pages/Weather.jsx'
import CalendarView from './pages/CalendarView.jsx'
import Statistics from './pages/Statistics.jsx'
import Settings from './pages/Settings.jsx'

/* ============================================================
   AppShell — main layout with UpdateChecker overlay
   ============================================================ */
function AppShell() {
  const { fullscreenActive } = useFullscreen()

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#050510]">
      {!fullscreenActive && <ThemedBackground />}
      <Sidebar />
      <UpdateChecker />
      <main className="relative z-10 flex-1 h-full overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/focus" replace />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/interval" element={<IntervalTimer />} />
          <Route path="/meditation" element={<Meditation />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/alarm" element={<Alarm />} />
          <Route path="/stopwatch" element={<Stopwatch />} />
          <Route path="/sleep" element={<SleepTracker />} />
          <Route path="/world-clock" element={<WorldClock />} />
          <Route path="/meeting" element={<MeetingPlanner />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

/* ============================================================
   PinGate — PIN lock + idle auto-lock
   ============================================================ */
function PinGate({ children }) {
  const { settings, ready } = useSettings()
  const [unlocked, setUnlocked] = useState(false)
  const lastActivityRef = useRef(Date.now())

  const pinActive = ready && settings.pinEnabled && settings.pinHash

  useEffect(() => {
    if (!pinActive) {
      setUnlocked(true)
    } else {
      setUnlocked(false)
    }
    // eslint-disable-next-line
  }, [pinActive])

  const lock = useCallback(() => {
    if (pinActive) setUnlocked(false)
  }, [pinActive])

  useEffect(() => {
    if (!pinActive || !unlocked) return

    const minutes = settings.pinAutoLockMinutes || 5
    const timeoutMs = minutes * 60 * 1000

    const bump = () => {
      lastActivityRef.current = Date.now()
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'touchmove']
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }))

    const checkInterval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= timeoutMs) lock()
    }, 5000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump))
      clearInterval(checkInterval)
    }
    // eslint-disable-next-line
  }, [pinActive, unlocked, settings.pinAutoLockMinutes, lock])

  useEffect(() => {
    if (!pinActive) return
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault()
        lock()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pinActive, lock])

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050510]">
        <div className="text-white/40 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  if (pinActive && !unlocked) {
    return <PinLockScreen onUnlock={() => setUnlocked(true)} />
  }

  return children
}

/* ============================================================
   AchievementWatcher — throttled achievement check on mount
   ============================================================ */
function AchievementWatcher() {
  const { runCheck } = useAchievements()
  const lastRunRef = useRef(0)

  useEffect(() => {
    const now = Date.now()
    if (now - lastRunRef.current < 5000) return
    lastRunRef.current = now
    runCheck({ showToasts: true })
    // eslint-disable-next-line
  }, [])

  return null
}

/* ============================================================
   Root App
   ============================================================ */
export default function App() {
  return (
    <SettingsProvider>
      <TimerProvider>
        <PomodoroProvider>
          <FullscreenProvider>
            <AchievementsProvider>
              <PinGate>
                <AchievementWatcher />
                <AppShell />
              </PinGate>
            </AchievementsProvider>
          </FullscreenProvider>
        </PomodoroProvider>
      </TimerProvider>
    </SettingsProvider>
  )
}