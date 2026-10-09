import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Calendar, Clock } from 'lucide-react'
import { searchCities } from '../lib/weather.js'
import { getTimezoneOffset, getHourInTZ } from '../lib/geo.js'

const DEFAULT_CITIES = [
  { id: 'dhaka', name: 'Dhaka', timezone: 'Asia/Dhaka', country: 'Bangladesh' },
  { id: 'london', name: 'London', timezone: 'Europe/London', country: 'UK' },
  { id: 'newyork', name: 'New York', timezone: 'America/New_York', country: 'USA' },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
]

/* Business hours good overlap: 9am-6pm */
const WORK_START = 9
const WORK_END = 18

function overlapScore(hour) {
  if (hour >= WORK_START && hour < WORK_END) return 2 // perfect
  if (hour >= 7 && hour < 21) return 1 // acceptable
  return 0 // bad
}

export default function MeetingPlanner() {
  const [cities, setCities] = useState(DEFAULT_CITIES)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [baseHour, setBaseHour] = useState(new Date().getHours())

  /* Live "now" */
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  /* Search cities */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      const r = await searchCities(query, 6)
      setResults(r)
      setSearching(false)
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const addCity = (c) => {
    if (cities.find((x) => x.id === c.id)) return
    setCities((prev) => [...prev, c])
    setQuery('')
    setResults([])
  }

  const removeCity = (id) => setCities((prev) => prev.filter((c) => c.id !== id))

  /* For each city, compute the local hour for each base hour 0-23 */
  const schedule = useMemo(() => {
    return cities.map((c) => {
      const offset = getTimezoneOffset(c.timezone, now)
      const localOffset = -now.getTimezoneOffset() / 60
      const diff = offset - localOffset

      const hours = []
      for (let h = 0; h < 24; h++) {
        const localH = (((baseHour + h + diff) % 24) + 24) % 24
        hours.push({
          base: (baseHour + h) % 24,
          local: Math.round(localH),
          score: overlapScore(Math.round(localH)),
        })
      }
      return { ...c, hours, diff: Math.round(diff) }
    })
  }, [cities, baseHour, now])

  /* Find best overlap range — hours where ALL cities score >= 1 */
  const bestHours = useMemo(() => {
    if (schedule.length === 0) return []
    const count = schedule[0].hours.length
    const results = []
    for (let i = 0; i < count; i++) {
      const minScore = Math.min(...schedule.map((c) => c.hours[i].score))
      results.push({ index: i, score: minScore })
    }
    return results
  }, [schedule])

  const bestStart = bestHours.findIndex((h) => h.score === 2)
  const bestEnd =
    bestStart >= 0
      ? bestStart +
        bestHours.slice(bestStart).findIndex((h) => h.score !== 2)
      : -1

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="relative h-full w-full overflow-hidden">

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #fde68a 0%, #f0abfc 45%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Meeting Planner
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Find</span>
              <span className="text-purple-400">·</span>
              <span>Overlap</span>
              <span className="text-purple-400">·</span>
              <span>Meet</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
          {/* Add city */}
          <div className="mb-5 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Add a city (e.g. Dubai, Berlin)..."
              className="w-full px-4 py-3 text-white bg-white/5 border border-purple-400/30 rounded-2xl focus:border-purple-400 focus:outline-none placeholder-white/30 backdrop-blur-xl"
            />
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden bg-[#0a0518]/95 backdrop-blur-2xl border border-purple-400/40 shadow-2xl z-20 max-h-64 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => addCity({ ...r, id: r.id })}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-500/15 text-left transition border-b border-white/5 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">{r.name}</p>
                      <p className="text-xs text-white/50">
                        {r.admin1 ? `${r.admin1}, ` : ''}{r.country}
                      </p>
                    </div>
                    <Plus size={16} className="text-purple-300" />
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <p className="text-xs text-white/40 mt-2 px-1">Searching...</p>
            )}
          </div>

          {/* Base hour slider */}
          <div className="mb-6 p-4 rounded-2xl backdrop-blur-xl border border-white/10"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(168,85,247,0.06) 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-purple-300" />
                <span className="text-xs text-white/60 uppercase tracking-wider">
                  Your time
                </span>
              </div>
              <span className="text-lg font-light text-white tabular">
                {pad(baseHour)}:00
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={baseHour}
              onChange={(e) => setBaseHour(+e.target.value)}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1 tabular">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          {/* Best overlap hint */}
          {bestStart >= 0 && bestEnd > bestStart && (
            <div
              className="mb-5 px-4 py-3 rounded-2xl border flex items-center gap-3"
              style={{
                background:
                  'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(168,85,247,0.1) 100%)',
                borderColor: 'rgba(34,197,94,0.4)',
              }}
            >
              <span className="text-xl">✨</span>
              <div>
                <p className="text-sm text-white font-medium">
                  Best time for everyone: <span className="tabular">{pad(baseHour + bestStart)}:00 — {pad((baseHour + bestEnd) % 24)}:00</span>
                </p>
                <p className="text-xs text-white/60 mt-0.5">
                  All cities in comfortable hours
                </p>
              </div>
            </div>
          )}

          {/* Schedule grid */}
          <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(168,85,247,0.04) 100%)',
            }}
          >
            {/* Header row — hours */}
            <div className="flex border-b border-white/5">
              <div className="w-40 shrink-0 p-3 flex items-center gap-2 border-r border-white/5">
                <Clock size={13} className="text-purple-300" />
                <span className="text-xs text-white/60 uppercase tracking-wider">City</span>
              </div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="text-center text-[9px] text-white/40 py-2 tabular border-r border-white/5 last:border-r-0"
                  >
                    {pad((baseHour + i) % 24)}
                  </div>
                ))}
              </div>
            </div>

            {/* City rows */}
            {schedule.map((city) => (
              <div key={city.id} className="flex border-b border-white/5 last:border-b-0 group">
                <div className="w-40 shrink-0 p-3 flex items-center justify-between border-r border-white/5">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{city.name}</p>
                    <p className="text-[10px] text-white/50">
                      UTC{city.diff >= 0 ? '+' : ''}{city.diff}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCity(city.id)}
                    className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
                  {city.hours.map((h, i) => {
                    const color =
                      h.score === 2
                        ? 'rgba(34,197,94,0.35)'
                        : h.score === 1
                        ? 'rgba(251,191,36,0.25)'
                        : 'rgba(239,68,68,0.15)'
                    const border =
                      h.score === 2
                        ? 'rgba(34,197,94,0.6)'
                        : h.score === 1
                        ? 'rgba(251,191,36,0.4)'
                        : 'transparent'
                    return (
                      <div
                        key={i}
                        className="text-center text-[10px] py-3 tabular border-r border-white/5 last:border-r-0 relative"
                        style={{ background: color }}
                        title={`${pad(h.local)}:00 local`}
                      >
                        <span className="text-white/85 font-medium">{pad(h.local)}</span>
                        {bestStart >= 0 && bestEnd > bestStart && i >= bestStart && i < bestEnd && (
                          <span
                            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ background: '#4ade80', boxShadow: '0 0 6px #4ade80' }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 px-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(34,197,94,0.6)' }} />
              <span className="text-white/60">Business hours (9–6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(251,191,36,0.5)' }} />
              <span className="text-white/60">Acceptable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.3)' }} />
              <span className="text-white/60">Off hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}