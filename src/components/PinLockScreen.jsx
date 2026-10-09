import { useState, useEffect, useRef } from 'react'
import { Lock, Delete, Fingerprint, ShieldCheck } from 'lucide-react'
import { useSettings } from '../context/SettingsContext.jsx'
import { verifyPin } from '../lib/crypto.js'

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 30

export default function PinLockScreen({ onUnlock }) {
  const { settings } = useSettings()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState(0)
  const [shake, setShake] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (isLockedOut) return
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      } else if (e.key === 'Enter') {
        handleSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line
  }, [pin, lockoutUntil, verifying])

  const lockoutRemaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000))
  const isLockedOut = lockoutRemaining > 0

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleDigit = (d) => {
    if (isLockedOut || verifying) return
    setError(null)
    setPin((p) => (p.length < 8 ? p + d : p))
  }

  const handleDelete = () => {
    if (isLockedOut || verifying) return
    setPin((p) => p.slice(0, -1))
    setError(null)
  }

  const handleClear = () => {
    if (isLockedOut || verifying) return
    setPin('')
    setError(null)
  }

  const handleSubmit = async () => {
    if (isLockedOut || verifying) return
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      triggerShake()
      return
    }
    setVerifying(true)
    const ok = await verifyPin(pin, settings.pinHash, settings.pinSalt)
    setVerifying(false)

    if (ok) {
      setPin('')
      setError(null)
      onUnlock()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPin('')
      triggerShake()

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000)
        setError(`Too many attempts — wait ${LOCKOUT_SECONDS}s`)
        setAttempts(0)
      } else {
        setError(`Wrong PIN (${MAX_ATTEMPTS - newAttempts} attempts left)`)
      }
    }
  }

  const dots = Array.from({ length: Math.max(6, pin.length) }, (_, i) => i < pin.length)
  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 30%, #1a0a2e 0%, #0a0420 40%, #03010a 100%)',
        }}
      />
      <div
        className="absolute w-[80vw] h-[80vw] rounded-full animate-float-glow"
        style={{
          top: '10%',
          left: '-20%',
          background:
            'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute w-[60vw] h-[60vw] rounded-full animate-float-glow-slow"
        style={{
          bottom: '10%',
          right: '-15%',
          background:
            'radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${(i * 137.5) % 100}%`,
              top: `${(i * 71.3) % 100}%`,
              width: i % 3 === 0 ? '2px' : '1px',
              height: i % 3 === 0 ? '2px' : '1px',
              animationDelay: `${(i % 6) * 0.5}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div
          className={`relative rounded-3xl p-[1.5px] ${shake ? 'animate-shake' : ''}`}
          style={{
            background:
              'linear-gradient(135deg, #fbbf24 0%, #a855f7 50%, #7c3aed 100%)',
            boxShadow:
              '0 0 60px rgba(168,85,247,0.5), 0 0 120px rgba(251,191,36,0.2)',
          }}
        >
          <div className="rounded-3xl bg-[#0a0518]/92 backdrop-blur-2xl p-7">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse-ring"
                  style={{
                    background:
                      'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  }}
                >
                  <Lock size={26} className="text-white" />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-white mb-1">P-Clock Locked</h1>
              <p className="text-xs text-white/50">
                Enter your PIN to unlock
              </p>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 mb-6">
              {dots.map((filled, i) => (
                <div
                  key={i}
                  className="w-3.5 h-3.5 rounded-full transition-all duration-200"
                  style={{
                    background: filled
                      ? 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
                      : 'rgba(255,255,255,0.1)',
                    border: filled
                      ? 'none'
                      : '1.5px solid rgba(168,85,247,0.3)',
                    boxShadow: filled
                      ? '0 0 12px rgba(192,132,252,0.9), 0 0 20px rgba(168,85,247,0.5)'
                      : 'none',
                    transform: filled ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {/* Error / status */}
            <div className="h-6 mb-4 text-center">
              {isLockedOut ? (
                <p className="text-xs text-red-300 font-medium">
                  ⏱ Locked — retry in {lockoutRemaining}s
                </p>
              ) : error ? (
                <p className="text-xs text-red-300 font-medium">{error}</p>
              ) : verifying ? (
                <p className="text-xs text-purple-300 font-medium flex items-center justify-center gap-1">
                  <ShieldCheck size={12} /> Verifying...
                </p>
              ) : null}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDigit(String(n))}
                  disabled={isLockedOut || verifying}
                  className="h-16 rounded-2xl text-2xl font-light text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(168,85,247,0.08) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {n}
                </button>
              ))}

              {/* Clear */}
              <button
                onClick={handleClear}
                disabled={isLockedOut || verifying || pin.length === 0}
                className="h-16 rounded-2xl text-xs font-semibold uppercase tracking-wider text-white/60 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(168,85,247,0.05) 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                Clear
              </button>

              {/* 0 */}
              <button
                onClick={() => handleDigit('0')}
                disabled={isLockedOut || verifying}
                className="h-16 rounded-2xl text-2xl font-light text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(168,85,247,0.08) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                0
              </button>

              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={isLockedOut || verifying || pin.length === 0}
                className="h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(168,85,247,0.05) 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Delete size={20} className="text-white/70" />
              </button>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={pin.length < 4 || isLockedOut || verifying}
              className="w-full mt-5 h-14 rounded-2xl text-white font-medium tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{
                background:
                  'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                boxShadow:
                  '0 8px 30px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              <Fingerprint size={16} />
              Unlock
            </button>

            {/* Hint */}
            <p className="text-[10px] text-center text-white/30 mt-4">
              Keyboard supported · 4–8 digits
            </p>
          </div>
        </div>
      </div>

      {/* Shake keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}