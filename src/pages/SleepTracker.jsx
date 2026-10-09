import { useState, useEffect } from 'react'
import {
  Moon,
  Sun,
  Star,
  Plus,
  Trash2,
  X,
  Clock,
  TrendingUp,
  Bed,
} from 'lucide-react'
import { pclock } from '../lib/pclock.js'

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function toLocalInput(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} type="button" className="hover:scale-110 transition">
          <Star
            size={18}
            fill={n <= value ? '#fbbf24' : 'transparent'}
            stroke={n <= value ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
          />
        </button>
      ))}
    </div>
  )
}

function LogModal({ onClose, onSave, initial }) {
  const now = Date.now()
  const [bedtime, setBedtime] = useState(
    initial?.bedtime || now - 8 * 60 * 60 * 1000
  )
  const [wakeTime, setWakeTime] = useState(initial?.wakeTime || now)
  const [quality, setQuality] = useState(initial?.quality || 3)
  const [notes, setNotes] = useState(initial?.notes || '')

  const duration = Math.max(0, (wakeTime - bedtime) / 1000)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative rounded-3xl p-[1.5px] max-w-md w-full mx-4"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
          boxShadow: '0 0 60px rgba(168,85,247,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-[#0a0518]/95 backdrop-blur-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {initial ? 'Edit Sleep' : 'Log Sleep'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Moon size={12} /> Bedtime
              </label>
              <input
                type="datetime-local"
                value={toLocalInput(bedtime)}
                onChange={(e) => setBedtime(new Date(e.target.value).getTime())}
                className="w-full px-3 py-2 text-white bg-white/5 border border-purple-400/30 rounded-xl focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Sun size={12} /> Wake time
              </label>
              <input
                type="datetime-local"
                value={toLocalInput(wakeTime)}
                onChange={(e) => setWakeTime(new Date(e.target.value).getTime())}
                className="w-full px-3 py-2 text-white bg-white/5 border border-purple-400/30 rounded-xl focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-white/70">Quality</span>
              <StarRating value={quality} onChange={setQuality} />
            </div>

            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Dreams, how you felt..."
                className="w-full px-3 py-2 text-white text-sm bg-white/5 border border-purple-400/30 rounded-xl focus:border-purple-400 focus:outline-none resize-none placeholder-white/30"
              />
            </div>

            <div className="text-center py-2">
              <p className="text-xs text-white/50 uppercase tracking-wider">Duration</p>
              <p className="text-2xl font-light text-white tabular mt-1">
                {formatDuration(duration)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (duration <= 0) return
                onSave({ bedtime, wakeTime, quality, notes })
                onClose()
              }}
              disabled={duration <= 0}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-medium hover:scale-[1.02] disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                boxShadow: '0 8px 30px rgba(168,85,247,0.5)',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SleepTracker() {
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState({ weekly: { count: 0, avgSeconds: 0, avgQuality: 0 }, monthly: { count: 0, avgSeconds: 0, avgQuality: 0 } })
  const [showLog, setShowLog] = useState(false)
  const [editRecord, setEditRecord] = useState(null)

  const load = async () => {
    try {
      const list = await pclock.sleep.list(60)
      setRecords(list || [])
      const s = await pclock.sleep.stats()
      if (s) setStats(s)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async (data) => {
    if (editRecord) {
      await pclock.sleep.update(editRecord.id, data)
    } else {
      await pclock.sleep.create(data)
    }
    setEditRecord(null)
    load()
  }

  const handleDelete = async (id) => {
    await pclock.sleep.delete(id)
    load()
  }

  const lastNight = records[0]
  const lastDuration = lastNight ? (lastNight.wake_time - lastNight.bedtime) / 1000 : 0

  /* Simple bar chart — last 7 records */
  const recent7 = records.slice(0, 7).reverse()
  const maxDur = Math.max(...recent7.map((r) => (r.wake_time - r.bedtime) / 1000), 8 * 3600)

  return (
    <div className="relative h-full w-full overflow-hidden">

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #c7d2fe 0%, #a78bfa 45%, #f0abfc 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Sleep Tracker
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Rest</span>
              <span className="text-indigo-400">·</span>
              <span>Recover</span>
              <span className="text-purple-400">·</span>
              <span>Thrive</span>
            </div>
          </div>
          <button
            onClick={() => {
              setEditRecord(null)
              setShowLog(true)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 6px 22px rgba(99,102,241,0.5)',
            }}
          >
            <Plus size={16} /> Log Sleep
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={<Moon size={18} className="text-indigo-300" />}
              label="Last night"
              value={lastNight ? formatDuration(lastDuration) : '—'}
              accent="rgba(99,102,241,0.15)"
            />
            <StatCard
              icon={<TrendingUp size={18} className="text-purple-300" />}
              label="Weekly avg"
              value={stats.weekly.count ? formatDuration(stats.weekly.avgSeconds) : '—'}
              accent="rgba(168,85,247,0.15)"
            />
            <StatCard
              icon={<Star size={18} className="text-amber-300" />}
              label="Quality"
              value={stats.weekly.avgQuality ? `${stats.weekly.avgQuality} / 5` : '—'}
              accent="rgba(251,191,36,0.15)"
            />
            <StatCard
              icon={<Bed size={18} className="text-pink-300" />}
              label="Records"
              value={records.length}
              accent="rgba(236,72,153,0.15)"
            />
          </div>

          {/* Bar chart */}
          {recent7.length > 0 && (
            <div
              className="rounded-2xl p-5 mb-6 backdrop-blur-xl border border-white/10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(99,102,241,0.06) 100%)',
              }}
            >
              <h3 className="text-sm font-semibold text-white mb-4">Last 7 nights</h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {recent7.map((r) => {
                  const dur = (r.wake_time - r.bedtime) / 1000
                  const h = (dur / maxDur) * 100
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t-lg transition-all hover:brightness-125"
                          style={{
                            height: `${h}%`,
                            background:
                              'linear-gradient(to top, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                            boxShadow: '0 0 15px rgba(168,85,247,0.4)',
                          }}
                          title={formatDuration(dur)}
                        />
                      </div>
                      <span className="text-[9px] text-white/50 uppercase tracking-wider">
                        {new Date(r.wake_time).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Records list */}
          {records.length === 0 ? (
            <div className="text-center py-16 text-white/50 text-sm">
              <Moon size={48} className="mx-auto mb-4 opacity-30" />
              No sleep records yet. Click "Log Sleep" to add one.
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => {
                const dur = (r.wake_time - r.bedtime) / 1000
                return (
                  <div
                    key={r.id}
                    className="group rounded-xl p-4 backdrop-blur-xl border border-white/8 hover:border-purple-400/30 transition flex items-center justify-between"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(99,102,241,0.04) 100%)',
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                        <Moon size={18} className="text-indigo-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium tabular">
                          {new Date(r.bedtime).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          → {new Date(r.wake_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-purple-300 tabular">
                            {formatDuration(dur)}
                          </p>
                          <div className="flex gap-0.5">
                            {[...Array(r.quality || 0)].map((_, i) => (
                              <Star key={i} size={9} fill="#fbbf24" stroke="#fbbf24" />
                            ))}
                          </div>
                          {r.notes && (
                            <p className="text-[10px] text-white/40 italic truncate max-w-[180px]">
                              "{r.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded hover:bg-red-500/20 text-white/40 hover:text-red-300 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showLog && (
        <LogModal
          onClose={() => {
            setShowLog(false)
            setEditRecord(null)
          }}
          onSave={handleSave}
          initial={editRecord}
        />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div
      className="rounded-2xl p-4 backdrop-blur-xl border border-white/10"
      style={{ background: `linear-gradient(135deg, ${accent} 0%, rgba(255,255,255,0.03) 100%)` }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-light text-white tabular">{value}</p>
    </div>
  )
}