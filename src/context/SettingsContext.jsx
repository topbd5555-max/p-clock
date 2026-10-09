import { createContext, useContext, useState, useEffect } from 'react'
import { pclock } from '../lib/pclock.js'

const SettingsContext = createContext(null)

const DEFAULTS = {
  theme: 'cosmic',
  clockFormat: '12h',
  alwaysOnTop: false,
  autoLaunch: false,
  notifications: true,
  soundVolume: 0.35,
  accentColor: '#a855f7',
  fontStyle: 'default',
  clockStyle: 'digital',
  analogFace: 'roman',
  // Custom image background
  customBg: null,
  customBgBlur: 0,
  customBgDarkness: 0.3,
  // Custom video background
  customVideo: null,
  customVideoName: null,
  customVideoBlur: 0,
  customVideoDarkness: 0.3,
  customVideoOpacity: 1,
  customVideoMuted: true, // 🔑 YES — video muted by default
  // PIN lock
  pinEnabled: false,
  pinHash: null,
  pinSalt: null,
  pinAutoLockMinutes: 5,
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const all = await pclock.settings.getAll()
        if (mounted) {
          const merged = { ...DEFAULTS }
          for (const [k, v] of Object.entries(all || {})) {
            if (v !== null && v !== undefined) merged[k] = v
          }
          setSettings(merged)
        }
      } catch {
        /* ignore */
      } finally {
        if (mounted) setReady(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const update = async (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }))
    try {
      await pclock.settings.set(key, value)
    } catch {
      /* ignore */
    }
  }

  const updateMany = async (obj) => {
    setSettings((s) => ({ ...s, ...obj }))
    for (const [k, v] of Object.entries(obj)) {
      try {
        await pclock.settings.set(k, v)
      } catch {
        /* ignore */
      }
    }
  }

  const reset = async (key) => {
    const def = DEFAULTS[key]
    update(key, def)
  }

  return (
    <SettingsContext.Provider value={{ settings, update, updateMany, reset, ready }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}