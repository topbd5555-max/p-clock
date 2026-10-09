/* ============================================================
   Weather & Geocoding — Open-Meteo (no API key, privacy-friendly)
   ============================================================ */

const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1'
const WEATHER_BASE = 'https://api.open-meteo.com/v1'

/* WMO Weather interpretation codes */
export const WEATHER_CODES = {
  0: { text: 'Clear sky', icon: '☀️' },
  1: { text: 'Mainly clear', icon: '🌤️' },
  2: { text: 'Partly cloudy', icon: '⛅' },
  3: { text: 'Overcast', icon: '☁️' },
  45: { text: 'Fog', icon: '🌫️' },
  48: { text: 'Rime fog', icon: '🌫️' },
  51: { text: 'Light drizzle', icon: '🌦️' },
  53: { text: 'Drizzle', icon: '🌦️' },
  55: { text: 'Heavy drizzle', icon: '🌧️' },
  56: { text: 'Freezing drizzle', icon: '🌧️' },
  57: { text: 'Freezing drizzle', icon: '🌧️' },
  61: { text: 'Light rain', icon: '🌦️' },
  63: { text: 'Rain', icon: '🌧️' },
  65: { text: 'Heavy rain', icon: '🌧️' },
  66: { text: 'Freezing rain', icon: '🌧️' },
  67: { text: 'Freezing rain', icon: '🌧️' },
  71: { text: 'Light snow', icon: '🌨️' },
  73: { text: 'Snow', icon: '🌨️' },
  75: { text: 'Heavy snow', icon: '❄️' },
  77: { text: 'Snow grains', icon: '🌨️' },
  80: { text: 'Rain showers', icon: '🌦️' },
  81: { text: 'Rain showers', icon: '🌧️' },
  82: { text: 'Violent showers', icon: '⛈️' },
  85: { text: 'Snow showers', icon: '🌨️' },
  86: { text: 'Snow showers', icon: '❄️' },
  95: { text: 'Thunderstorm', icon: '⛈️' },
  96: { text: 'Thunderstorm + hail', icon: '⛈️' },
  99: { text: 'Thunderstorm + hail', icon: '⛈️' },
}

export function weatherInfo(code) {
  return WEATHER_CODES[code] || { text: 'Unknown', icon: '❓' }
}

/* Search cities by name */
export async function searchCities(query, count = 5) {
  if (!query || query.trim().length < 2) return []
  const url = `${GEO_BASE}/search?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((r) => ({
      id: `${r.latitude},${r.longitude}`,
      name: r.name,
      country: r.country,
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }))
  } catch {
    return []
  }
}

/* Fetch current + 7-day forecast */
export async function fetchWeather(lat, lon) {
  const url =
    `${WEATHER_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max` +
    `&timezone=auto&forecast_days=7`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('Weather fetch failed:', e)
    return null
  }
}