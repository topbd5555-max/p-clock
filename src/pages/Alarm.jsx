import { useState, useEffect } from 'react'
import { Plus, Clock as ClockIcon, Trash2, Bell, BellOff, Play, X } from 'lucide-react'
import { pclock } from '../lib/pclock.js'
const DAYS = ['Su', 'M', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function to12h(time24) {
  const [h, m] = time24.split(':').map(Number)
  const hour12 = h % 12 === 0 ? 12 : h % 12
  const mer = h >= 12 ? 'PM' : 'AM'
  return { hour12, m, mer, h }
}

function timeUntil(time24, days) {
  const now = new Date()
  const [h, m] = time24.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  if (target <= now) {
    if (days.length === 0) {
      target.setDate(target.getDate() + 1)
    } else {
      // find next matching weekday
      let diff = 1
      while (diff <= 7) {
        const next = new Date()
        next.setDate(next.getDate() + diff)
        next.setHours(h, m, 0, 0)
        if (days.includes(next.getDay())) {
          target.setTime(next.getTime())
          break
        }
        diff++
      }
    }
  }
  const diffMs = target - now
  const hh = Math.floor(diffMs / 3600000)
  const mm = Math.floor((diffMs % 3600000) / 60000)
  return `${hh}h ${mm}m`
}

/* ============================================================
   Alarm Firing Overlay
   ============================================================ */
function AlarmFiring({ alarm, onSnooze, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-2xl">
      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full animate-ping"
            style={{
              width: 300 + i * 150,
              height: 300 + i * 150,
              border: `2px solid rgba(168,85,247,${0.5 - i * 0.15})`,
              animationDuration: `${2 + i * 0.3}s`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <div className="animate-float-soft mb-4">
          <Bell size={80} className="text-purple-300 mx-auto" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-purple-300 uppercase tracking-[0.4em] mb-2">Alarm</p>
        <p className="text-8xl font-extralight text-white tabular mb-3">{alarm.time}</p>
        {alarm.label && (
          <p className="text-lg text-white/80 mb-8">{alarm.label}</p>
        )}

        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={onSnooze}
            className="px-8 py-4 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm font-medium transition"
          >
            Snooze {alarm.snoozeMinutes || 5} min
          </button>
          <button
            onClick={onDismiss}
            className="px-8 py-4 rounded-2xl text-white text-sm font-medium transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              boxShadow: '0 8px 30px rgba(168,85,247,0.6)',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Alarm Card
   ============================================================ */
function AlarmCard({ alarm, onToggle, onDelete, onTest }) {
  const { hour12, m, mer } = to12h(alarm.time)
  const pad = (n) => String(n).padStart(2, '0')
  const countdown = alarm.enabled ? timeUntil(alarm.time, alarm.days) : null
  const greeting =
    to12h(alarm.time).h < 12
      ? 'Good morning'
      : to12h(alarm.time).h < 17
      ? 'Good afternoon'
      : 'Good evening'

  return (
    <div
      className="relative rounded-2xl p-4 backdrop-blur-xl border border-white/10 hover:border-purple-400/40 transition group"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(168,85,247,0.06) 100%)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-light text-white tabular">
              {hour12}:{pad(m)}
            </span>
            <span className="text-lg font-light text-white/50">{mer}</span>
          </div>
          {countdown && (
            <p className="text-xs text-purple-300 mt-1 flex items-center gap-1 tabular">
              <ClockIcon size={11} />
              in {countdown}
            </p>
          )}
        </div>

        <button
          onClick={() => onToggle(alarm.id)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            alarm.enabled ? 'bg-win-accent' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              alarm.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <p className="text-sm text-white/80 mb-3">{alarm.label || greeting}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {DAYS.map((d, i) => (
            <span
              key={d}
              className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center ${
                alarm.days.includes(i)
                  ? 'bg-purple-500/30 text-white'
                  : 'bg-white/5 text-white/30'
              }`}
            >
              {d[0]}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onTest(alarm)}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white"
            title="Test"
          >
            <Play size={12} />
          </button>
          <button
            onClick={() => onDelete(alarm.id)}
            className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-300"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Add Alarm Modal
   ============================================================ */
function AddAlarmModal({ onClose, onCreate }) {
  const [time, setTime] = useState('07:00')
  const [label, setLabel] = useState('')
  const [days, setDays] = useState([])
  const [snoozeMinutes, setSnoozeMinutes] = useState(5)

  const toggleDay = (i) =>
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative rounded-3xl p-[1.5px] max-w-md w-full mx-4"
        style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #a855f7 50%, #ec4899 100%)',
          boxShadow: '0 0 60px rgba(168,85,247,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-[#0a0518]/95 backdrop-blur-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">New Alarm</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="text-center mb-5">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-5xl font-light text-white bg-transparent border-none focus:outline-none tabular"
            />
          </div>

          <input
            type="text"
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2.5 text-white text-sm bg-white/5 border border-white/10 rounded-xl focus:border-purple-400 focus:outline-none mb-4 placeholder-white/30"
          />

          <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Repeat</p>
          <div className="flex justify-between gap-1 mb-4">
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => toggleDay(i)}
                className={`w-9 h-9 rounded-full text-xs flex items-center justify-center transition-all ${
                  days.includes(i)
                    ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between py-2 mb-4">
            <span className="text-sm text-white/70">Snooze duration</span>
            <select
              value={snoozeMinutes}
              onChange={(e) => setSnoozeMinutes(+e.target.value)}
              className="px-3 py-1.5 text-sm text-white bg-white/5 border border-purple-400/30 rounded-lg focus:outline-none"
            >
              {[1, 3, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n} className="bg-[#1a0a2e]">
                  {n} min
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              onCreate({ time, label, days, enabled: true, snoozeMinutes })
              onClose()
            }}
            className="w-full py-3 rounded-2xl text-white font-medium transition hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #ec4899 100%)',
              boxShadow: '0 8px 30px rgba(168,85,247,0.5)',
            }}
          >
            Create Alarm
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Main Alarm Page
   ============================================================ */
export default function Alarm() {
  const [alarms, setAlarms] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [firing, setFiring] = useState(null)

  const load = async () => {
    try {
      const list = await pclock.alarms.list()
      setAlarms(list || [])
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load()
    // Listen for alarm firing from main process
    const cleanup = pclock.alarms.onFired((data) => {
      setFiring(data)
    })
    return cleanup
  }, [])

  const toggleAlarm = async (id) => {
    const a = alarms.find((x) => x.id === id)
    if (!a) return
    await pclock.alarms.update(id, { enabled: !a.enabled })
    load()
  }

  const deleteAlarm = async (id) => {
    await pclock.alarms.delete(id)
    load()
  }

  const addAlarm = async (data) => {
    await pclock.alarms.create(data)
    load()
  }

  const testAlarm = (alarm) => {
    // Fire locally
    setFiring({ ...alarm, snoozeMinutes: alarm.snoozeMinutes || 5 })
  }

  const snooze = async () => {
    if (!firing) return
    const target = new Date()
    target.setMinutes(target.getMinutes() + (firing.snoozeMinutes || 5))
    const hh = String(target.getHours()).padStart(2, '0')
    const mm = String(target.getMinutes()).padStart(2, '0')
    // Update the alarm temporarily so it will trigger again
    if (firing.id) {
      await pclock.alarms.update(firing.id, {
        time: `${hh}:${mm}`,
        lastTriggeredAt: 0,
        enabled: true,
      })
      load()
    }
    setFiring(null)
  }

  return (
    <div className="relative h-full w-full overflow-hidden">

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #fde68a 0%, #f0abfc 45%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.45))',
              }}
            >
              Alarm
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Wake</span>
              <span className="text-purple-400">·</span>
              <span>Remind</span>
              <span className="text-purple-400">·</span>
              <span>Repeat</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-24 pt-2">
          {alarms.length === 0 ? (
            <div className="text-center py-20 text-white/50 text-sm">
              <BellOff size={48} className="mx-auto mb-4 opacity-30" />
              No alarms yet. Click the + button to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {alarms.map((a) => (
                <AlarmCard
                  key={a.id}
                  alarm={a}
                  onToggle={toggleAlarm}
                  onDelete={deleteAlarm}
                  onTest={testAlarm}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          boxShadow: '0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.45)',
        }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {showAdd && <AddAlarmModal onClose={() => setShowAdd(false)} onCreate={addAlarm} />}

      {firing && (
        <AlarmFiring
          alarm={firing}
          onSnooze={snooze}
          onDismiss={() => setFiring(null)}
        />
      )}
    </div>
  )
}