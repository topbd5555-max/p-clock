import { useEffect, useState } from 'react'
import { Star, Map as MapIcon, Globe } from 'lucide-react'

// কিছু জনপ্রিয় শহরের টাইমজোন
const CITIES = [
  { id: 'local', name: 'Local time', tz: Intl.DateTimeFormat().resolvedOptions().timeZone, home: true },
  { id: 'dhaka', name: 'Dhaka', tz: 'Asia/Dhaka' },
  { id: 'london', name: 'London', tz: 'Europe/London' },
  { id: 'newyork', name: 'New York', tz: 'America/New_York' },
  { id: 'tokyo', name: 'Tokyo', tz: 'Asia/Tokyo' },
  { id: 'sydney', name: 'Sydney', tz: 'Australia/Sydney' },
  { id: 'dubai', name: 'Dubai', tz: 'Asia/Dubai' },
]

function getTimeInTZ(tz, date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function getDateInTZ(tz, date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getOffsetText(tz) {
  try {
    const now = new Date()
    const localOffset = -now.getTimezoneOffset() / 60
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }))
    const tzOffset = (tzDate.getTime() - now.getTime()) / 3600000 + localOffset
    const diff = Math.round(tzOffset)
    if (diff === 0) return 'Same time as local'
    const sign = diff > 0 ? '+' : ''
    return `${sign}${diff} hr${Math.abs(diff) !== 1 ? 's' : ''} from local`
  } catch {
    return ''
  }
}

export default function WorldClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Top card: Local time */}
      <div className="p-4 flex justify-end">
        <div className="bg-win-card rounded-lg px-5 py-3 flex items-center gap-4">
          <Globe size={20} className="text-win-text-muted" />
          <div>
            <p className="text-[10px] text-win-text-muted uppercase tracking-wide">Local time</p>
            <p className="text-lg font-light text-white tabular">
              {getTimeInTZ(Intl.DateTimeFormat().resolvedOptions().timeZone, now)}
            </p>
          </div>
          <div className="border-l border-win-border pl-4">
            <p className="text-xs text-win-text-muted tabular">
              {getDateInTZ(Intl.DateTimeFormat().resolvedOptions().timeZone, now)}
            </p>
          </div>
        </div>
      </div>

      {/* World map placeholder (simple gradient + pins) */}
      <div className="px-6">
        <div className="relative w-full h-56 rounded-lg overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-win-border/40">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,#333_0%,transparent_70%)]" />
          {/* Fake continent shapes for visual effect */}
          <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-20">
            <ellipse cx="200" cy="180" rx="90" ry="70" fill="#888" />
            <ellipse cx="320" cy="280" rx="60" ry="80" fill="#888" />
            <ellipse cx="440" cy="150" rx="70" ry="60" fill="#888" />
            <ellipse cx="520" cy="230" rx="50" ry="70" fill="#888" />
            <ellipse cx="620" cy="300" rx="60" ry="40" fill="#888" />
          </svg>
          {/* Pins */}
          <div className="absolute top-[42%] left-[62%]">
            <div className="w-3 h-3 rounded-full bg-win-accent ring-4 ring-win-accent/30" />
          </div>
          <p className="absolute bottom-3 right-3 text-[10px] text-win-text-muted flex items-center gap-1">
            <MapIcon size={11} /> World map
          </p>
        </div>
      </div>

      {/* City list */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {CITIES.map((city) => (
            <div
              key={city.id}
              className="bg-win-card hover:bg-win-card-hover rounded-lg p-4 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Star size={14} className="text-win-text-muted hover:text-win-accent" />
                </button>
                <div>
                  <p className="text-sm font-medium text-white">{city.name}</p>
                  <p className="text-[11px] text-win-text-muted">{getOffsetText(city.tz)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-light text-white tabular">{getTimeInTZ(city.tz, now)}</p>
                <p className="text-[11px] text-win-text-muted tabular">{getDateInTZ(city.tz, now)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}