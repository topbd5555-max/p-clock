/* ============================================================
   Timezone utilities
   ============================================================ */

/* Get current offset (in hours) for a timezone relative to UTC */
export function getTimezoneOffset(tz, date = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const parts = dtf.formatToParts(date)
    const map = {}
    for (const p of parts) map[p.type] = p.value
    const asUTC = Date.UTC(
      +map.year,
      +map.month - 1,
      +map.day,
      +map.hour === 24 ? 0 : +map.hour,
      +map.minute,
      +map.second
    )
    return (asUTC - date.getTime()) / (1000 * 60 * 60)
  } catch {
    return 0
  }
}

/* Format hour (0-23) as a readable time in a given timezone */
export function formatHourInTZ(hour, tz) {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: true,
  }).format(d)
}

/* Get the hour (0-23) in a given timezone at a given moment */
export function getHourInTZ(tz, date = new Date()) {
  try {
    const s = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).format(date)
    return parseInt(s, 10) % 24
  } catch {
    return date.getHours()
  }
}

/* Format a full time in a timezone */
export function formatTimeInTZ(tz, date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/* Format date in a timezone */
export function formatDateInTZ(tz, date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}