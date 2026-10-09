import { useState, useEffect } from 'react'
import { Search, MapPin, Wind, Droplets, Sunrise, Sunset, Thermometer, Gauge, X } from 'lucide-react'
import { searchCities, fetchWeather, weatherInfo } from '../lib/weather.js'
import { pclock } from '../lib/pclock.js'

const DEFAULT_CITY = {
  id: 'dhaka',
  name: 'Dhaka',
  country: 'Bangladesh',
  latitude: 23.7104,
  longitude: 90.4074,
  timezone: 'Asia/Dhaka',
}

function formatHour(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

function formatDay(isoString, idx) {
  if (idx === 0) return 'Today'
  try {
    return new Date(isoString).toLocaleDateString('en-US', { weekday: 'short' })
  } catch {
    return '—'
  }
}

export default function Weather() {
  const [city, setCity] = useState(DEFAULT_CITY)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  /* Load saved city */
  useEffect(() => {
    ;(async () => {
      try {
        const saved = await pclock.settings.get('weatherCity', null)
        if (saved && saved.latitude) setCity(saved)
      } catch {
        /* ignore */
      }
    })()
  }, [])

  /* Fetch weather */
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const w = await fetchWeather(city.latitude, city.longitude)
      setWeather(w)
      setLoading(false)
    })()
  }, [city.latitude, city.longitude])

  /* City search */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      const r = await searchCities(query, 6)
      setResults(r)
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const selectCity = (c) => {
    setCity(c)
    pclock.settings.set('weatherCity', c).catch(() => {})
    setQuery('')
    setResults([])
  }

  const current = weather?.current
  const daily = weather?.daily
  const info = current ? weatherInfo(current.weather_code) : { text: '—', icon: '❓' }

  return (
    <div className="relative h-full w-full overflow-hidden">

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #a5f3fc 0%, #a78bfa 45%, #f0abfc 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Weather
            </h1>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/55 uppercase tracking-[0.2em]">
              <span>Sun</span>
              <span className="text-cyan-400">·</span>
              <span>Sky</span>
              <span className="text-purple-400">·</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
          {/* Search */}
          <div className="mb-5 relative max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              className="w-full pl-11 pr-4 py-3 text-white bg-white/5 border border-purple-400/30 rounded-2xl focus:border-purple-400 focus:outline-none placeholder-white/30 backdrop-blur-xl"
            />
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden bg-[#0a0518]/95 backdrop-blur-2xl border border-purple-400/40 shadow-2xl z-20 max-h-64 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectCity(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-500/15 text-left transition border-b border-white/5 last:border-b-0"
                  >
                    <MapPin size={14} className="text-purple-300" />
                    <div>
                      <p className="text-sm text-white font-medium">{r.name}</p>
                      <p className="text-xs text-white/50">
                        {r.admin1 ? `${r.admin1}, ` : ''}{r.country}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-20 text-white/50 text-sm animate-pulse">
              Loading weather...
            </div>
          )}

          {!loading && !weather && (
            <div className="text-center py-20 text-white/50 text-sm">
              Could not load weather. Check your internet.
            </div>
          )}

          {!loading && weather && (
            <>
              {/* Current */}
              <div
                className="rounded-3xl p-6 mb-5 backdrop-blur-xl border border-white/10 relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.1) 100%)',
                }}
              >
                <div
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 animate-float-glow"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-purple-300" />
                      <p className="text-sm text-white/80">
                        {city.name}{city.country ? `, ${city.country}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-white/50 capitalize">{info.text}</p>
                    <p className="text-7xl font-extralight text-white tabular leading-none mt-3">
                      {Math.round(current.temperature_2m)}°
                    </p>
                    <p className="text-xs text-white/60 mt-2">
                      Feels like {Math.round(current.apparent_temperature)}°C
                    </p>
                  </div>
                  <div className="text-7xl shrink-0 animate-float-soft">{info.icon}</div>
                </div>

                {/* Quick stats */}
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  <MiniStat icon={<Wind size={12} />} label="Wind" value={`${current.wind_speed_10m} km/h`} />
                  <MiniStat icon={<Droplets size={12} />} label="Humidity" value={`${current.relative_humidity_2m}%`} />
                  <MiniStat icon={<Thermometer size={12} />} label="Pressure" value={`${Math.round(current.pressure_msl)} hPa`} />
                  <MiniStat icon={<Gauge size={12} />} label="UV max" value={`${daily.uv_index_max?.[0] ?? '—'}`} />
                </div>

                {/* Sunrise / Sunset */}
                <div className="relative grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <Sunrise size={20} className="text-amber-300" />
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Sunrise</p>
                      <p className="text-sm text-white tabular">
                        {formatHour(daily.sunrise?.[0])}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <Sunset size={20} className="text-orange-300" />
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Sunset</p>
                      <p className="text-sm text-white tabular">
                        {formatHour(daily.sunset?.[0])}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7-day forecast */}
              <h3 className="text-sm font-semibold text-white mb-3 px-1">7-day forecast</h3>
              <div className="space-y-2">
                {daily.time.map((t, i) => {
                  const dInfo = weatherInfo(daily.weather_code[i])
                  return (
                    <div
                      key={t}
                      className="flex items-center justify-between px-4 py-3 rounded-2xl backdrop-blur-xl border border-white/8 hover:border-purple-400/30 transition"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(168,85,247,0.04) 100%)',
                      }}
                    >
                      <div className="w-20 text-sm text-white/80 font-medium">
                        {formatDay(t, i)}
                      </div>
                      <div className="text-2xl w-12 text-center">{dInfo.icon}</div>
                      <div className="hidden sm:block flex-1 text-xs text-white/50 capitalize px-3 truncate">
                        {dInfo.text}
                      </div>
                      <div className="flex items-center gap-3 text-sm tabular">
                        <span className="text-white/50">
                          {Math.round(daily.temperature_2m_min[i])}°
                        </span>
                        <div className="w-20 h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                          <div
                            className="absolute inset-y-0 rounded-full"
                            style={{
                              left: '0%',
                              right: '0%',
                              background:
                                'linear-gradient(90deg, #38bdf8 0%, #fbbf24 50%, #ef4444 100%)',
                            }}
                          />
                        </div>
                        <span className="text-white font-medium">
                          {Math.round(daily.temperature_2m_max[i])}°
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-[10px] text-white/30 mt-6 text-center">
                Weather data © Open-Meteo · No tracking · No API key required
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="rounded-xl p-3 backdrop-blur-xl bg-white/5 border border-white/8">
      <div className="flex items-center gap-1.5 text-[10px] text-white/50 uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm text-white tabular">{value}</p>
    </div>
  )
}