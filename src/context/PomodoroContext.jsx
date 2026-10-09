import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { pclock } from '../lib/pclock.js'

const PomodoroContext = createContext(null)

const DEFAULT_CONFIG = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: true,
}

export function PomodoroProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [phase, setPhase] = useState('focus') // focus | short | long
  const [isRunning, setIsRunning] = useState(false)
  const [remaining, setRemaining] = useState(DEFAULT_CONFIG.focusMinutes * 60)
  const [cycleCount, setCycleCount] = useState(0) // completed focus sessions in current set
  const [totalSessions, setTotalSessions] = useState(0)

  const sessionStartRef = useRef(null)
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  /* Restore config from DB on mount */
  useEffect(() => {
    ;(async () => {
      try {
        const saved = await pclock.settings.get('pomodoroConfig', null)
        if (saved) {
          setConfig({ ...DEFAULT_CONFIG, ...saved })
          setRemaining(saved.focusMinutes * 60)
        }
      } catch {
        /* ignore */
      }
    })()
  }, [])

  /* Persist config */
  useEffect(() => {
    pclock.settings.set('pomodoroConfig', config).catch(() => {})
  }, [config])

  /* Tick */
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
  }, [isRunning])

  const phaseDuration = (p) => {
    const c = configRef.current
    if (p === 'focus') return c.focusMinutes * 60
    if (p === 'short') return c.shortBreakMinutes * 60
    return c.longBreakMinutes * 60
  }

  const handlePhaseEnd = () => {
    const c = configRef.current
    const currentPhase = phase
    const startedAt = sessionStartRef.current || Date.now()

    // Log the completed focus session
    if (currentPhase === 'focus') {
      pclock.sessions
        .create({
          type: 'pomodoro',
          durationSeconds: c.focusMinutes * 60,
          completed: true,
          startedAt,
          endedAt: Date.now(),
          metadata: { phase: 'focus', cycleCount: cycleCount + 1 },
        })
        .catch(() => {})
      setTotalSessions((n) => n + 1)
    }

    // Determine next phase
    let nextPhase
    let nextCycleCount = cycleCount
    if (currentPhase === 'focus') {
      nextCycleCount = cycleCount + 1
      if (nextCycleCount >= c.cyclesBeforeLongBreak) {
        nextPhase = 'long'
      } else {
        nextPhase = 'short'
      }
    } else {
      if (currentPhase === 'long') nextCycleCount = 0
      nextPhase = 'focus'
    }

    // Notify
    const titles = {
      focus: '🎯 Focus time!',
      short: '☕ Short break',
      long: '🌿 Long break',
    }
    const bodies = {
      focus: 'Time to get back to work',
      short: `${c.shortBreakMinutes} min break`,
      long: `${c.longBreakMinutes} min long break — you earned it!`,
    }
    pclock
      .notify({
        title: titles[nextPhase] || 'Pomodoro',
        body: bodies[nextPhase] || '',
      })
      .catch(() => {})

    setPhase(nextPhase)
    setCycleCount(nextCycleCount)
    setRemaining(phaseDuration(nextPhase))
    sessionStartRef.current = Date.now()

    if (c.autoStartNext) {
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }

  const start = () => {
    if (!sessionStartRef.current) sessionStartRef.current = Date.now()
    setIsRunning(true)
  }

  const pause = () => setIsRunning(false)

  const reset = () => {
    setIsRunning(false)
    setPhase('focus')
    setCycleCount(0)
    setRemaining(config.focusMinutes * 60)
    sessionStartRef.current = null
  }

  const skip = () => {
    handlePhaseEnd()
  }

  const updateConfig = (patch) => {
    setConfig((c) => ({ ...c, ...patch }))
    if (!isRunning && !sessionStartRef.current) {
      // update preview if not started
      if (patch.focusMinutes && phase === 'focus') {
        setRemaining(patch.focusMinutes * 60)
      }
    }
  }

  const total = phaseDuration(phase)

  return (
    <PomodoroContext.Provider
      value={{
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
      }}
    >
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext)
  if (!ctx) throw new Error('usePomodoro must be inside PomodoroProvider')
  return ctx
}