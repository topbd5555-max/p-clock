import { createContext, useContext, useState, useEffect } from 'react'

const TimerContext = createContext(null)

const DEFAULT_TIMERS = [
  { id: 1, label: '1 min', subLabel: '1 MINUTE', total: 60, remaining: 60, isRunning: false },
  { id: 2, label: '3 min', subLabel: '3 MINUTES', total: 180, remaining: 180, isRunning: false },
  { id: 3, label: '5 min', subLabel: '5 MINUTES', total: 300, remaining: 300, isRunning: false },
  { id: 4, label: '10 min', subLabel: '10 MINUTES', total: 600, remaining: 600, isRunning: false },
]

export function TimerProvider({ children }) {
  const [timers, setTimers] = useState(DEFAULT_TIMERS)

  // 🕐 Global tick — এটা App-এর level-এ থাকে, তাই অন্য পেজে গেলেও চলবে
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.isRunning) return t
          if (t.remaining > 0) return { ...t, remaining: t.remaining - 1 }
          // ০-তে পৌঁছেছে
          return { ...t, isRunning: false }
        })
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleTimer = (id) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        // যদি শেষ হয়ে গিয়ে থাকে, total থেকে restart করো
        if (!t.isRunning && t.remaining === 0) {
          return { ...t, isRunning: true, remaining: t.total }
        }
        return { ...t, isRunning: !t.isRunning }
      })
    )
  }

  const resetTimer = (id) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, isRunning: false, remaining: t.total } : t
      )
    )
  }

  const deleteTimer = (id) => {
    setTimers((prev) => prev.filter((t) => t.id !== id))
  }

  // 🎯 Custom time add
  const addCustomTimer = (hours, minutes, seconds) => {
    const total = hours * 3600 + minutes * 60 + seconds
    if (total <= 0) return false

    const newId = Date.now()
    let label = ''
    let subLabel = ''

    if (hours > 0) {
      label = `${hours}h ${minutes}m`
      subLabel = `${hours} HOUR${hours > 1 ? 'S' : ''} ${minutes} MIN`
    } else if (minutes > 0) {
      label = `${minutes} min`
      subLabel = `${minutes} MINUTE${minutes > 1 ? 'S' : ''}`
    } else {
      label = `${seconds} sec`
      subLabel = `${seconds} SECOND${seconds > 1 ? 'S' : ''}`
    }

    setTimers((prev) => [
      ...prev,
      { id: newId, label, subLabel, total, remaining: total, isRunning: false },
    ])
    return true
  }

  return (
    <TimerContext.Provider
      value={{ timers, toggleTimer, resetTimer, deleteTimer, addCustomTimer }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimers() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimers must be used inside TimerProvider')
  return ctx
}