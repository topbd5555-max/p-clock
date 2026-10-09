import { useState } from 'react'
import { Lock, X, ShieldCheck, AlertCircle } from 'lucide-react'
import { generateSalt, hashPin, validatePin, verifyPin } from '../lib/crypto.js'

/**
 * mode: 'setup' | 'change' | 'disable'
 * - setup: enter new PIN + confirm
 * - change: current PIN + new PIN + confirm
 * - disable: current PIN (to disable)
 */
export default function PinSetupModal({
  mode,
  currentHash,
  currentSalt,
  onClose,
  onSave, // ({ hash, salt }) => void  — for setup/change
  onDisable, // () => void — for disable
}) {
  const [step, setStep] = useState(
    mode === 'setup' ? 'new' : mode === 'change' ? 'current' : 'current'
  )
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const titles = {
    setup: 'Set up PIN Lock',
    change: 'Change PIN',
    disable: 'Disable PIN Lock',
  }
  const subtitles = {
    setup: 'Choose a 4–8 digit PIN',
    change: 'Verify current PIN, then enter new',
    disable: 'Verify current PIN to disable lock',
  }

  const reset = () => {
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setError(null)
    setStep(mode === 'setup' ? 'new' : 'current')
  }

  const handleNext = async () => {
    setError(null)

    if (step === 'current') {
      if (mode === 'disable') {
        // Verify current → disable
        setBusy(true)
        const ok = await verifyPin(currentPin, currentHash, currentSalt)
        setBusy(false)
        if (!ok) {
          setError('Incorrect current PIN')
          return
        }
        onDisable()
        onClose()
        return
      }
      // Change: verify current → go to new step
      setBusy(true)
      const ok = await verifyPin(currentPin, currentHash, currentSalt)
      setBusy(false)
      if (!ok) {
        setError('Incorrect current PIN')
        return
      }
      setStep('new')
      return
    }

    if (step === 'new') {
      const v = validatePin(newPin)
      if (!v.ok) {
        setError(v.error)
        return
      }
      setStep('confirm')
      return
    }

    if (step === 'confirm') {
      if (newPin !== confirmPin) {
        setError('PINs do not match')
        setConfirmPin('')
        return
      }
      // All good — hash & save
      setBusy(true)
      try {
        const salt = generateSalt()
        const hash = await hashPin(newPin, salt)
        onSave({ hash, salt })
        onClose()
      } catch (e) {
        setError(e.message || 'Failed to save PIN')
      } finally {
        setBusy(false)
      }
    }
  }

  const canProceed = (() => {
    if (busy) return false
    if (step === 'current') return /^\d{4,8}$/.test(currentPin)
    if (step === 'new') return /^\d{4,8}$/.test(newPin)
    if (step === 'confirm') return confirmPin.length >= 4
    return false
  })()

  const currentValue =
    step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin
  const setCurrentValue =
    step === 'current' ? setCurrentPin : step === 'new' ? setNewPin : setConfirmPin

  const stepLabels = {
    current: 'Current PIN',
    new: 'New PIN',
    confirm: 'Confirm new PIN',
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative rounded-3xl p-[1.5px] max-w-md w-full mx-4"
        style={{
          background:
            'linear-gradient(135deg, #fbbf24 0%, #a855f7 50%, #7c3aed 100%)',
          boxShadow:
            '0 0 60px rgba(168,85,247,0.6), 0 0 120px rgba(251,191,36,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-[#0a0518]/95 backdrop-blur-2xl p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                }}
              >
                <Lock size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {titles[mode]}
                </h2>
                <p className="text-xs text-white/50">{subtitles[mode]}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step indicator (for setup/change) */}
          {mode !== 'disable' && (
            <div className="flex items-center justify-center gap-2 mb-5">
              {['new', 'confirm'].map((s, i) => {
                const active =
                  step === s ||
                  (mode === 'change' && step === 'current' && false)
                const done =
                  (s === 'new' && step === 'confirm') ||
                  (s === 'new' && mode === 'change' && step === 'confirm')
                const isCurrent =
                  (s === 'new' && step === 'new') ||
                  (s === 'confirm' && step === 'confirm')
                return (
                  <div
                    key={s}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: isCurrent ? 32 : 16,
                      background: isCurrent
                        ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                        : done
                        ? 'rgba(168,85,247,0.5)'
                        : 'rgba(255,255,255,0.15)',
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* Step label */}
          <p className="text-xs text-white/60 uppercase tracking-wider mb-3">
            {stepLabels[step]}
          </p>

          {/* PIN input */}
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            autoFocus
            value={currentValue}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 8)
              setCurrentValue(v)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canProceed) handleNext()
            }}
            placeholder="••••"
            className="w-full h-16 text-center text-3xl tracking-[0.5em] font-light text-white tabular bg-white/5 border border-purple-400/30 rounded-2xl focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition mb-2"
          />

          {/* Digit count */}
          <p className="text-[10px] text-white/40 text-center mb-4">
            {currentValue.length}/8 digits · min 4
          </p>

          {/* Error */}
          <div className="h-6 mb-4 text-center">
            {error && (
              <p className="text-xs text-red-300 flex items-center justify-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-medium transition hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{
                background:
                  mode === 'disable'
                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                    : 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                boxShadow:
                  mode === 'disable'
                    ? '0 8px 30px rgba(220,38,38,0.5)'
                    : '0 8px 30px rgba(168,85,247,0.5)',
              }}
            >
              {busy ? (
                'Working...'
              ) : mode === 'disable' && step === 'current' ? (
                'Disable PIN'
              ) : step === 'confirm' ? (
                <>
                  <ShieldCheck size={14} />
                  Save PIN
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}