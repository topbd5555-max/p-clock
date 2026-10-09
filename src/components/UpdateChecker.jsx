import { useEffect, useState } from 'react'
import { Download, RefreshCw, X, Check, AlertCircle, Sparkles } from 'lucide-react'
import { pclock } from '../lib/pclock.js'

export default function UpdateChecker() {
  const [state, setState] = useState({
    status: 'idle', // idle | checking | available | downloading | downloaded | error | uptodate
    version: null,
    progress: 0,
    error: null,
    releaseNotes: null,
  })
  const [showBanner, setShowBanner] = useState(false)
  const [dismissedVersion, setDismissedVersion] = useState(
    () => localStorage.getItem('pclock-dismissed-update') || null
  )
  const [currentVersion, setCurrentVersion] = useState('—')

  useEffect(() => {
    pclock.updater.version().then((v) => setCurrentVersion(v || '—'))
  }, [])

  useEffect(() => {
    const cleanup = pclock.updater.onEvent(({ event, data }) => {
      if (event === 'checking') {
        setState((s) => ({ ...s, status: 'checking', error: null }))
      } else if (event === 'available') {
        setState({
          status: 'available',
          version: data.version,
          progress: 0,
          error: null,
          releaseNotes: data.releaseNotes,
        })
        if (dismissedVersion !== data.version) setShowBanner(true)
      } else if (event === 'progress') {
        setState((s) => ({
          ...s,
          status: 'downloading',
          progress: data.percent,
        }))
        setShowBanner(true)
      } else if (event === 'downloaded') {
        setState((s) => ({
          ...s,
          status: 'downloaded',
          version: data.version,
          progress: 100,
        }))
        setShowBanner(true)
        // Auto-dismiss previous dismissal
        localStorage.removeItem('pclock-dismissed-update')
      } else if (event === 'not-available') {
        setState((s) => ({ ...s, status: 'uptodate', error: null }))
        setTimeout(() => {
          setState((s) => (s.status === 'uptodate' ? { ...s, status: 'idle' } : s))
        }, 3000)
      } else if (event === 'error') {
        setState((s) => ({ ...s, status: 'error', error: data.message }))
      }
    })
    return cleanup
  }, [dismissedVersion])

  /* Auto-check on mount + every 4 hours */
  useEffect(() => {
    const t = setTimeout(() => pclock.updater.check(), 8000)
    const id = setInterval(() => pclock.updater.check(), 4 * 60 * 60 * 1000)
    return () => {
      clearTimeout(t)
      clearInterval(id)
    }
  }, [])

  const handleInstall = () => {
    pclock.updater.install()
  }

  const handleDismiss = () => {
    setShowBanner(false)
    if (state.version) {
      localStorage.setItem('pclock-dismissed-update', state.version)
      setDismissedVersion(state.version)
    }
  }

  if (!showBanner) return null
  if (state.status === 'idle' || state.status === 'uptodate') return null

  return (
    <div
      className="fixed bottom-6 right-6 z-[95] w-[360px] rounded-2xl p-[1.5px]"
      style={{
        background:
          'linear-gradient(135deg, #fbbf24 0%, #a855f7 50%, #ec4899 100%)',
        boxShadow:
          '0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(251,191,36,0.3)',
      }}
    >
      <div className="rounded-2xl bg-[#0a0518]/96 backdrop-blur-2xl p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 animate-pulse-ring"
            style={{
              background:
                'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            }}
          >
            {state.status === 'downloaded' ? (
              <Check size={18} className="text-white" />
            ) : state.status === 'error' ? (
              <AlertCircle size={18} className="text-white" />
            ) : (
              <Download size={18} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              {state.status === 'downloaded'
                ? 'Ready to install'
                : state.status === 'error'
                ? 'Update error'
                : state.status === 'downloading'
                ? 'Downloading...'
                : state.status === 'available'
                ? 'Update available'
                : 'Checking for updates'}
            </p>
            <p className="text-sm font-bold text-white truncate mt-0.5">
              P-Clock {state.version ? `v${state.version}` : ''}
            </p>
            <p className="text-[10px] text-white/50 tabular mt-0.5">
              Current: v{currentVersion}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition shrink-0"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        {(state.status === 'downloading' || state.status === 'downloaded') && (
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${state.progress}%`,
                  background:
                    'linear-gradient(90deg, #fbbf24 0%, #a855f7 100%)',
                  boxShadow: '0 0 15px rgba(168,85,247,0.7)',
                }}
              />
            </div>
            <p className="text-[10px] text-white/50 tabular mt-1 text-right">
              {Math.round(state.progress)}%
            </p>
          </div>
        )}

        {/* Error message */}
        {state.status === 'error' && (
          <p className="text-[11px] text-red-300 mb-3 break-words">
            {state.error || 'Could not check for updates'}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {state.status === 'downloaded' && (
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition hover:scale-[1.02] flex items-center justify-center gap-1.5"
              style={{
                background:
                  'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                boxShadow: '0 6px 22px rgba(168,85,247,0.5)',
              }}
            >
              <Sparkles size={12} />
              Install & Restart
            </button>
          )}

          {(state.status === 'idle' || state.status === 'error') && (
            <button
              onClick={() => pclock.updater.check()}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={12} />
              Check Again
            </button>
          )}

          {state.status === 'checking' && (
            <div className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs text-center flex items-center justify-center gap-2">
              <RefreshCw size={12} className="animate-spin" />
              Checking...
            </div>
          )}

          {state.status === 'available' && (
            <div className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs text-center">
              Downloading soon...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}