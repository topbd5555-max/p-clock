import { useState } from 'react'
import {
  Bell,
  Rocket,
  Pin,
  Keyboard,
  Download,
  Upload,
  Volume2,
  Monitor,
  Database,
  Check,
  AlertCircle,
  Palette,
  Image,
  Clock,
  Type,
  Trash2,
  Video as VideoIcon,
  Loader2,
  Film,
  Lock,
  Shield,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'
import { useSettings } from '../context/SettingsContext.jsx'
import { pclock, isRunningInElectron } from '../lib/pclock.js'
import { THEME_LIST } from '../lib/themes.js'
import { FONT_LIST } from '../lib/fonts.js'
import AnalogClock from '../components/AnalogClock.jsx'
import PinSetupModal from '../components/PinSetupModal.jsx'

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-6 backdrop-blur-2xl border border-white/10 ${className}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(168,85,247,0.05) 100%)',
      }}
    >
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-win-accent' : 'bg-white/20'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function Row({ icon: Icon, title, desc, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-white/5 last:border-b-0">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-purple-300" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          {desc && <p className="text-xs text-white/50 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

async function validateVideoDimensions(filename) {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    v.src = `pclock-media://bg/${filename}`
    const timeout = setTimeout(
      () => resolve({ ok: false, error: 'Could not read video metadata (timeout)' }),
      15000
    )
    v.onloadedmetadata = () => {
      clearTimeout(timeout)
      const w = v.videoWidth
      const h = v.videoHeight
      const longEdge = Math.max(w, h)
      if (longEdge > 1920) {
        resolve({
          ok: false,
          error: `Video is ${w}×${h}. Maximum allowed is 1920px (1080p).`,
        })
      } else {
        resolve({ ok: true, width: w, height: h })
      }
    }
    v.onerror = () => {
      clearTimeout(timeout)
      resolve({ ok: false, error: 'Could not load video — unsupported codec?' })
    }
  })
}

export default function Settings() {
  const { settings, update } = useSettings()
  const [toast, setToast] = useState(null)
  const [videoBusy, setVideoBusy] = useState(false)
  const [pinModal, setPinModal] = useState(null) // 'setup' | 'change' | 'disable' | null

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleExport = async () => {
    const r = await pclock.backup.export()
    if (r?.ok) showToast('Backup saved successfully')
    else if (r?.ok === false) showToast('Export cancelled', 'warn')
  }

  const handleImport = async () => {
    const r = await pclock.backup.import()
    if (r?.ok) {
      showToast('Backup restored — restart app to see changes')
      setTimeout(() => window.location.reload(), 1500)
    } else {
      showToast(r?.error || 'Import cancelled', 'warn')
    }
  }

  const pickBg = async () => {
    const p = await pclock.window.pickImage()
    if (!p) return
    const res = await pclock.window.readImage(p)
    if (res?.error) {
      showToast(res.error, 'warn')
      return
    }
    if (res?.data) {
      if (settings.customVideo) {
        await pclock.bg.deleteVideo(settings.customVideo)
        await update('customVideo', null)
        await update('customVideoName', null)
      }
      await update('customBg', res.data)
      showToast('Background image updated')
    }
  }

  const clearBg = async () => {
    await update('customBg', null)
    showToast('Background reset to theme')
  }

  const pickVideo = async () => {
    setVideoBusy(true)
    try {
      const picked = await pclock.bg.pickVideo()
      if (!picked || picked.error) {
        if (picked?.error) showToast(picked.error, 'warn')
        setVideoBusy(false)
        return
      }
      const saved = await pclock.bg.saveVideo(picked.path)
      if (saved?.error) {
        showToast(saved.error, 'warn')
        setVideoBusy(false)
        return
      }
      const validation = await validateVideoDimensions(saved.filename)
      if (!validation.ok) {
        await pclock.bg.deleteVideo(saved.filename)
        showToast(validation.error || 'Video does not meet requirements', 'warn')
        setVideoBusy(false)
        return
      }
      if (settings.customVideo && settings.customVideo !== saved.filename) {
        await pclock.bg.deleteVideo(settings.customVideo)
      }
      if (settings.customBg) await update('customBg', null)
      await update('customVideo', saved.filename)
      await update('customVideoName', picked.name)
      showToast(`Video set (${validation.width}×${validation.height})`)
    } catch (e) {
      showToast(e.message || 'Video error', 'warn')
    } finally {
      setVideoBusy(false)
    }
  }

  const clearVideo = async () => {
    if (settings.customVideo) {
      await pclock.bg.deleteVideo(settings.customVideo)
    }
    await update('customVideo', null)
    await update('customVideoName', null)
    showToast('Video background removed')
  }

  /* ===== PIN handlers ===== */
  const enablePin = () => {
    setPinModal('setup')
  }

  const handlePinSetupSave = async ({ hash, salt }) => {
    await update('pinHash', hash)
    await update('pinSalt', salt)
    await update('pinEnabled', true)
    showToast('PIN Lock enabled')
  }

  const handlePinChangeSave = async ({ hash, salt }) => {
    await update('pinHash', hash)
    await update('pinSalt', salt)
    showToast('PIN changed successfully')
  }

  const handlePinDisable = async () => {
    await update('pinEnabled', false)
    await update('pinHash', null)
    await update('pinSalt', null)
    showToast('PIN Lock disabled')
  }

  const pinIsOn = !!settings.pinEnabled && !!settings.pinHash

  return (
    <div className="relative p-8 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto pb-10">
        <h1
          className="text-3xl font-bold mb-8 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #e9d5ff 0%, #c084fc 45%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Settings
        </h1>

        {!isRunningInElectron && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <AlertCircle size={14} />
            Browser mode — Settings won't be saved. Run <code>npm run electron:dev</code>
          </div>
        )}

        {/* ============ SECURITY ============ */}
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <Shield size={16} className="text-purple-300" />
            Security
          </h2>

          <Row
            icon={Lock}
            title="PIN Lock"
            desc={
              pinIsOn
                ? 'App locks on startup and after idle time'
                : 'Protect P-Clock with a 4–8 digit PIN'
            }
          >
            {pinIsOn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPinModal('change')}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 transition flex items-center gap-1"
                >
                  <KeyRound size={12} /> Change
                </button>
                <button
                  onClick={() => setPinModal('disable')}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 transition flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            ) : (
              <button
                onClick={enablePin}
                className="px-4 py-1.5 text-xs rounded-lg text-white font-medium transition hover:scale-[1.03] flex items-center gap-1"
                style={{
                  background:
                    'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                  boxShadow: '0 4px 18px rgba(168,85,247,0.5)',
                }}
              >
                <ShieldCheck size={12} /> Enable
              </button>
            )}
          </Row>

          {pinIsOn && (
            <div className="py-4 border-b border-white/5 last:border-b-0">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={12} /> Auto-lock after idle
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 5, 10, 15, 30, 60].map((n) => {
                  const active = (settings.pinAutoLockMinutes || 5) === n
                  return (
                    <button
                      key={n}
                      onClick={() => update('pinAutoLockMinutes', n)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition ${
                        active
                          ? 'bg-win-accent text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {n} min
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-white/40 mt-3">
                Press <span className="px-1 py-0.5 rounded bg-white/10 tabular">Ctrl+Shift+L</span>{' '}
                anytime to lock manually.
              </p>
            </div>
          )}
        </Card>

        {/* ============ Appearance ============ */}
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Palette size={16} className="text-purple-300" />
            Appearance
          </h2>

          <p className="text-xs text-white/50 uppercase tracking-wider mb-3">Theme</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            {THEME_LIST.map((t) => {
              const active = settings.theme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => update('theme', t.id)}
                  className={`relative rounded-xl p-3 text-left transition-all hover:scale-[1.03] ${
                    active ? 'scale-[1.03]' : ''
                  }`}
                  style={{
                    background: t.bg,
                    border: active
                      ? `2px solid ${t.accent}`
                      : '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow: active
                      ? `0 0 25px ${t.accent}80, inset 0 1px 0 rgba(255,255,255,0.15)`
                      : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{t.emoji}</span>
                    <span className="text-xs font-medium text-white">{t.label}</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: t.accent, boxShadow: `0 0 6px ${t.accent}` }}
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: t.accent2, boxShadow: `0 0 6px ${t.accent2}` }}
                    />
                  </div>
                  {active && (
                    <div
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: t.accent }}
                    >
                      <Check size={10} className="text-black" strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <Row icon={Clock} title="Clock style" desc="Digital or analog face">
            <div className="flex gap-2">
              <button
                onClick={() => update('clockStyle', 'digital')}
                className={`px-3 py-1.5 text-xs rounded-lg transition ${
                  settings.clockStyle === 'digital'
                    ? 'bg-win-accent text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Digital
              </button>
              <button
                onClick={() => update('clockStyle', 'analog')}
                className={`px-3 py-1.5 text-xs rounded-lg transition ${
                  settings.clockStyle === 'analog'
                    ? 'bg-win-accent text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Analog
              </button>
            </div>
          </Row>

          {settings.clockStyle === 'analog' && (
            <div className="py-4 border-b border-white/5">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-3">
                Analog face
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {[
                  { id: 'roman', label: 'Roman' },
                  { id: 'numerals', label: 'Numerals' },
                  { id: 'minimal', label: 'Minimal' },
                  { id: 'skeleton', label: 'Skeleton' },
                ].map((f) => {
                  const active = settings.analogFace === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => update('analogFace', f.id)}
                      className="relative rounded-xl p-2 transition-all hover:scale-[1.03]"
                      style={{
                        background: active
                          ? 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(236,72,153,0.15) 100%)'
                          : 'rgba(255,255,255,0.04)',
                        border: active
                          ? '1.5px solid rgba(168,85,247,0.7)'
                          : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="scale-[0.22] origin-top -mb-16 h-24 flex justify-center">
                        <AnalogClock
                          size={340}
                          face={f.id}
                          accent="#a855f7"
                          accent2="#fbbf24"
                          smooth={false}
                        />
                      </div>
                      <p className="text-[11px] font-medium text-white text-center mt-1">
                        {f.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="py-4 border-b border-white/5">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Type size={12} /> Digital font
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {FONT_LIST.map((f) => {
                const active = settings.fontStyle === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => update('fontStyle', f.id)}
                    className={`rounded-xl p-2 transition-all hover:scale-[1.03] ${
                      active ? 'scale-[1.03]' : ''
                    }`}
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(236,72,153,0.15) 100%)'
                        : 'rgba(255,255,255,0.04)',
                      border: active
                        ? '1.5px solid rgba(168,85,247,0.7)'
                        : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <p
                      className="text-lg text-white text-center mb-1"
                      style={{ fontFamily: f.family, fontWeight: f.weight }}
                    >
                      12:34
                    </p>
                    <p className="text-[10px] text-white/60 text-center">{f.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Video background */}
          <div className="py-4 border-b border-white/5">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <VideoIcon size={12} /> Background video
            </p>

            {settings.customVideo ? (
              <div className="space-y-4">
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                  <video
                    key={settings.customVideo}
                    className="absolute inset-0 w-full h-full object-cover"
                    src={`pclock-media://bg/${settings.customVideo}`}
                    autoPlay
                    loop
                    muted={settings.customVideoMuted !== false}
                    playsInline
                    style={{
                      filter: `blur(${settings.customVideoBlur || 0}px) brightness(${
                        1 - (settings.customVideoDarkness ?? 0.3)
                      })`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Film size={12} className="text-purple-300 shrink-0" />
                      <span className="text-xs text-white truncate">
                        {settings.customVideoName || 'Video'}
                      </span>
                    </div>
                    <button
                      onClick={clearVideo}
                      className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-red-400/40 text-red-300 text-xs hover:bg-red-500/20 transition flex items-center gap-1 shrink-0"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60">Blur</span>
                      <span className="text-xs text-white tabular">
                        {settings.customVideoBlur || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={settings.customVideoBlur || 0}
                      onChange={(e) => update('customVideoBlur', +e.target.value)}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60">Darkness</span>
                      <span className="text-xs text-white tabular">
                        {Math.round((settings.customVideoDarkness || 0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.05"
                      value={settings.customVideoDarkness || 0}
                      onChange={(e) => update('customVideoDarkness', +e.target.value)}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60">Opacity</span>
                      <span className="text-xs text-white tabular">
                        {Math.round((settings.customVideoOpacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.05"
                      value={settings.customVideoOpacity ?? 1}
                      onChange={(e) => update('customVideoOpacity', +e.target.value)}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-white/60">Mute video</span>
                  <Toggle
                    checked={settings.customVideoMuted !== false}
                    onChange={(v) => update('customVideoMuted', v)}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={pickVideo}
                disabled={!isRunningInElectron || videoBusy}
                className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 hover:border-purple-400/50 text-white/70 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {videoBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing video...
                  </>
                ) : (
                  <>
                    <VideoIcon size={16} />
                    Choose video (mp4, webm, mov — max 1080p, 200 MB)
                  </>
                )}
              </button>
            )}
            <p className="text-[10px] text-white/40 mt-2 flex items-center gap-1">
              <AlertCircle size={10} />
              Max resolution 1080p (1920px long edge).
            </p>
          </div>

          {/* Image background */}
          <div className="py-4">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Image size={12} /> Custom background image
            </p>

            {settings.customBg ? (
              <div className="space-y-4">
                <div
                  className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10"
                  style={{
                    backgroundImage: `url(${settings.customBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: `blur(${settings.customBgBlur}px) brightness(${
                      1 - (settings.customBgDarkness || 0)
                    })`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={clearBg}
                      className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-red-400/40 text-red-300 text-xs hover:bg-red-500/20 transition flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60">Blur</span>
                      <span className="text-xs text-white tabular">
                        {settings.customBgBlur || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={settings.customBgBlur || 0}
                      onChange={(e) => update('customBgBlur', +e.target.value)}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60">Darkness</span>
                      <span className="text-xs text-white tabular">
                        {Math.round((settings.customBgDarkness || 0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.05"
                      value={settings.customBgDarkness || 0}
                      onChange={(e) => update('customBgDarkness', +e.target.value)}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={pickBg}
                disabled={!isRunningInElectron}
                className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 hover:border-purple-400/50 text-white/70 text-sm transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Image size={16} />
                Choose image (jpg, png, webp — max 8 MB)
              </button>
            )}
            <p className="text-[10px] text-white/40 mt-2">
              Note: Video and image backgrounds are mutually exclusive.
            </p>
          </div>
        </Card>

        {/* ============ Windows Integration ============ */}
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <Monitor size={16} className="text-purple-300" />
            Windows Integration
          </h2>

          <Row
            icon={Rocket}
            title="Launch at startup"
            desc="P-Clock will open automatically when Windows starts"
          >
            <Toggle
              checked={!!settings.autoLaunch}
              onChange={(v) => update('autoLaunch', v)}
              disabled={!isRunningInElectron}
            />
          </Row>

          <Row
            icon={Pin}
            title="Always on top"
            desc="Keep P-Clock above all other windows"
          >
            <Toggle
              checked={!!settings.alwaysOnTop}
              onChange={(v) => update('alwaysOnTop', v)}
              disabled={!isRunningInElectron}
            />
          </Row>

          <Row
            icon={Bell}
            title="Desktop notifications"
            desc="Show Windows notifications when timers end"
          >
            <Toggle
              checked={!!settings.notifications}
              onChange={(v) => update('notifications', v)}
            />
          </Row>
        </Card>

        {/* ============ Sound ============ */}
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Volume2 size={16} className="text-purple-300" />
            Sound
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70 w-24">Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.soundVolume ?? 0.35}
              onChange={(e) => update('soundVolume', parseFloat(e.target.value))}
              className="flex-1 accent-purple-500"
            />
            <span className="text-sm text-white tabular w-12 text-right">
              {Math.round((settings.soundVolume ?? 0.35) * 100)}%
            </span>
          </div>
        </Card>

        {/* ============ Hotkeys ============ */}
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Keyboard size={16} className="text-purple-300" />
            Global Hotkeys
          </h2>
          <div className="space-y-2">
            {[
              { keys: 'Ctrl + Shift + T', action: 'Toggle Timer' },
              { keys: 'Ctrl + Shift + S', action: 'Toggle Stopwatch' },
              { keys: 'Ctrl + Shift + P', action: 'Toggle Pomodoro' },
              { keys: 'Ctrl + Shift + L', action: 'Lock app (if PIN enabled)' },
            ].map((h) => (
              <div key={h.keys} className="flex items-center justify-between py-2 text-sm">
                <span className="text-white/70">{h.action}</span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white tabular font-mono">
                  {h.keys}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ============ Backup ============ */}
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Database size={16} className="text-purple-300" />
            Data & Backup
          </h2>
          <p className="text-xs text-white/50 mb-4">
            Your data is stored locally in SQLite. Export a backup file to keep it safe
            or transfer to another PC.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm transition"
            >
              <Download size={14} />
              Export Backup
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
                boxShadow: '0 6px 22px rgba(168,85,247,0.5)',
              }}
            >
              <Upload size={14} />
              Import Backup
            </button>
          </div>
        </Card>

        {/* ============ About ============ */}
        <Card>
          <h2 className="text-base font-semibold text-white mb-2">About</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            P-Clock — a secure, private Windows clock app. All data stays on your
            computer. No telemetry, no cloud, no tracking.
          </p>
          <p className="text-xs text-white/40 mt-3">Version 1.0.0</p>
        </Card>
      </div>

      {/* PIN Modals */}
      {pinModal === 'setup' && (
        <PinSetupModal
          mode="setup"
          onClose={() => setPinModal(null)}
          onSave={handlePinSetupSave}
        />
      )}
      {pinModal === 'change' && (
        <PinSetupModal
          mode="change"
          currentHash={settings.pinHash}
          currentSalt={settings.pinSalt}
          onClose={() => setPinModal(null)}
          onSave={handlePinChangeSave}
        />
      )}
      {pinModal === 'disable' && (
        <PinSetupModal
          mode="disable"
          currentHash={settings.pinHash}
          currentSalt={settings.pinSalt}
          onClose={() => setPinModal(null)}
          onDisable={handlePinDisable}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl backdrop-blur-xl border shadow-lg max-w-md"
          style={{
            background:
              toast.type === 'ok'
                ? 'rgba(34,197,94,0.15)'
                : toast.type === 'warn'
                ? 'rgba(251,191,36,0.15)'
                : 'rgba(239,68,68,0.15)',
            borderColor:
              toast.type === 'ok'
                ? 'rgba(34,197,94,0.4)'
                : toast.type === 'warn'
                ? 'rgba(251,191,36,0.4)'
                : 'rgba(239,68,68,0.4)',
          }}
        >
          {toast.type === 'ok' ? (
            <Check size={16} className="text-green-300 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-amber-300 shrink-0" />
          )}
          <span className="text-sm text-white">{toast.msg}</span>
        </div>
      )}
    </div>
  )
}