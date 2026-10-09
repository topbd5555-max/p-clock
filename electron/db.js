const initSqlJs = require('sql.js')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const encryption = require('./encryption')

let SQL = null
let db = null
let dbPath = null
let saveTimer = null
let ready = false

/* ============================================================
   INIT (async) — decrypts DB if encrypted, migrates if plaintext
   ============================================================ */
async function init() {
  if (ready) return db

  SQL = await initSqlJs({
    locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
  })

  dbPath = path.join(app.getPath('userData'), 'p-clock.db')

  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath)
    let buf = null

    if (encryption.isEncrypted(raw)) {
      try {
        buf = encryption.decrypt(raw)
        console.log('🔐 Encrypted database loaded (AES-256-GCM)')
      } catch (e) {
        console.error('❌ Decryption failed:', e.message)
        // Backup corrupted/incompatible DB and start fresh
        const bak = dbPath + '.corrupted-' + Date.now()
        try {
          fs.copyFileSync(dbPath, bak)
          console.error('   Backup saved to:', bak)
        } catch {
          /* ignore */
        }
        buf = null
      }
    } else {
      console.log('📂 Plaintext DB found — will encrypt on next save')
      buf = raw
    }

    db = buf ? new SQL.Database(buf) : new SQL.Database()
  } else {
    db = new SQL.Database()
  }

  migrate()
  seedDefaults()
  saveNow() // writes encrypted
  ready = true
  return db
}

/* ============================================================
   HELPERS
   ============================================================ */
function run(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  stmt.step()
  stmt.free()
  scheduleSave()
}

function get(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const hasRow = stmt.step()
  const row = hasRow ? stmt.getAsObject() : null
  stmt.free()
  return row
}

function all(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function exec(sql) {
  db.exec(sql)
  scheduleSave()
}

function lastInsertId() {
  const row = get('SELECT last_insert_rowid() AS id')
  return row ? row.id : null
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(saveNow, 200)
}

/* ============================================================
   SAVE — encrypts before writing
   ============================================================ */
function saveNow() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (!db || !dbPath) return
  try {
    const raw = Buffer.from(db.export())
    const encrypted = encryption.encrypt(raw)
    fs.writeFileSync(dbPath, encrypted)
  } catch (e) {
    console.error('DB save failed:', e)
  }
}

/* ============================================================
   SCHEMA
   ============================================================ */
function migrate() {
  exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      label TEXT DEFAULT '',
      days TEXT DEFAULT '[]',
      enabled INTEGER DEFAULT 1,
      snooze_minutes INTEGER DEFAULT 5,
      sound TEXT DEFAULT 'default',
      last_triggered_at INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      sub_label TEXT DEFAULT '',
      total_seconds INTEGER NOT NULL,
      is_preset INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      sound TEXT,
      metadata TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS achievements (
      key TEXT PRIMARY KEY,
      unlocked_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_sounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sleep_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bedtime INTEGER NOT NULL,
      wake_time INTEGER NOT NULL,
      quality INTEGER DEFAULT 3,
      notes TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_type_started ON sessions(type, started_at);
    CREATE INDEX IF NOT EXISTS idx_sleep_wake ON sleep_records(wake_time);
  `)

  try {
    const cols = all(`PRAGMA table_info(alarms)`)
    if (!cols.find((c) => c.name === 'last_triggered_at')) {
      exec('ALTER TABLE alarms ADD COLUMN last_triggered_at INTEGER DEFAULT 0')
    }
  } catch {
    /* ignore */
  }
  try {
    const cols = all(`PRAGMA table_info(sessions)`)
    if (!cols.find((c) => c.name === 'metadata')) {
      exec('ALTER TABLE sessions ADD COLUMN metadata TEXT')
    }
  } catch {
    /* ignore */
  }
}

function seedDefaults() {
  const row = get('SELECT COUNT(*) AS c FROM timers WHERE is_preset = 1')
  if (row && row.c === 0) {
    const now = Date.now()
    const presets = [
      ['1 min', '1 MINUTE', 60, 1],
      ['3 min', '3 MINUTES', 180, 2],
      ['5 min', '5 MINUTES', 300, 3],
      ['10 min', '10 MINUTES', 600, 4],
    ]
    for (const [l, s, t, o] of presets) {
      run(
        `INSERT INTO timers (label, sub_label, total_seconds, is_preset, sort_order, created_at)
         VALUES (?, ?, ?, 1, ?, ?)`,
        [l, s, t, o, now]
      )
    }
  }
}

/* ============================================================
   SETTINGS
   ============================================================ */
function getSetting(key, defaultValue = null) {
  const row = get('SELECT value FROM settings WHERE key = ?', [key])
  if (!row) return defaultValue
  try {
    return JSON.parse(row.value)
  } catch {
    return row.value
  }
}

function setSetting(key, value) {
  run(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, JSON.stringify(value), Date.now()]
  )
}

function getAllSettings() {
  const rows = all('SELECT key, value FROM settings')
  const out = {}
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value)
    } catch {
      out[r.key] = r.value
    }
  }
  return out
}

/* ============================================================
   ALARMS
   ============================================================ */
function getAlarms() {
  const rows = all('SELECT * FROM alarms ORDER BY time')
  return rows.map((r) => ({
    id: r.id,
    time: r.time,
    label: r.label,
    days: JSON.parse(r.days || '[]'),
    enabled: !!r.enabled,
    snoozeMinutes: r.snooze_minutes,
    sound: r.sound,
    lastTriggeredAt: r.last_triggered_at || 0,
  }))
}

function createAlarm(a) {
  run(
    `INSERT INTO alarms (time, label, days, enabled, snooze_minutes, sound, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      a.time,
      a.label || '',
      JSON.stringify(a.days || []),
      a.enabled ? 1 : 0,
      a.snoozeMinutes || 5,
      a.sound || 'default',
      Date.now(),
    ]
  )
  return lastInsertId()
}

function updateAlarm(id, updates) {
  const fields = []
  const values = []
  const map = {
    time: 'time',
    label: 'label',
    days: 'days',
    enabled: 'enabled',
    snoozeMinutes: 'snooze_minutes',
    sound: 'sound',
    lastTriggeredAt: 'last_triggered_at',
  }
  for (const [key, col] of Object.entries(map)) {
    if (updates[key] !== undefined) {
      fields.push(`${col} = ?`)
      const v = updates[key]
      if (key === 'days') values.push(JSON.stringify(v))
      else if (key === 'enabled') values.push(v ? 1 : 0)
      else values.push(v)
    }
  }
  if (fields.length === 0) return
  values.push(id)
  run(`UPDATE alarms SET ${fields.join(', ')} WHERE id = ?`, values)
}

function deleteAlarm(id) {
  run('DELETE FROM alarms WHERE id = ?', [id])
}

/* ============================================================
   TIMERS
   ============================================================ */
function getTimers() {
  const rows = all('SELECT * FROM timers ORDER BY sort_order, created_at')
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    subLabel: r.sub_label,
    total: r.total_seconds,
    isPreset: !!r.is_preset,
  }))
}

function createTimer(t) {
  run(
    `INSERT INTO timers (label, sub_label, total_seconds, is_preset, sort_order, created_at)
     VALUES (?, ?, ?, 0, 999, ?)`,
    [t.label, t.subLabel || '', t.total, Date.now()]
  )
  return lastInsertId()
}

function deleteTimer(id) {
  run('DELETE FROM timers WHERE id = ? AND is_preset = 0', [id])
}

/* ============================================================
   SESSIONS
   ============================================================ */
function createSession(s) {
  run(
    `INSERT INTO sessions (type, duration_seconds, completed, sound, metadata, started_at, ended_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      s.type,
      s.durationSeconds,
      s.completed ? 1 : 0,
      s.sound || null,
      s.metadata ? JSON.stringify(s.metadata) : null,
      s.startedAt || Date.now(),
      s.endedAt || null,
    ]
  )
  return lastInsertId()
}

function getStats() {
  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000

  const q = (since) => {
    const row = get(
      `SELECT COUNT(*) AS count, COALESCE(SUM(duration_seconds), 0) AS total
       FROM sessions WHERE completed = 1 AND started_at >= ?`,
      [since]
    )
    return row || { count: 0, total: 0 }
  }
  return { daily: q(dayAgo), weekly: q(weekAgo), monthly: q(monthAgo) }
}

function getSessionsByType(type, limit = 50) {
  return all(
    'SELECT * FROM sessions WHERE type = ? ORDER BY started_at DESC LIMIT ?',
    [type, limit]
  )
}

function getRecentSessions(limit = 50) {
  return all('SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?', [limit])
}

/* ============================================================
   ACHIEVEMENTS
   ============================================================ */
function unlockAchievement(key) {
  const before = get('SELECT key FROM achievements WHERE key = ?', [key])
  if (before) return false
  run('INSERT INTO achievements (key, unlocked_at) VALUES (?, ?)', [key, Date.now()])
  return true
}

function getAchievements() {
  return all('SELECT * FROM achievements ORDER BY unlocked_at DESC')
}

/* ============================================================
   CUSTOM SOUNDS
   ============================================================ */
function addCustomSound(name, soundPath) {
  run('INSERT INTO custom_sounds (name, path, created_at) VALUES (?, ?, ?)', [
    name,
    soundPath,
    Date.now(),
  ])
  return lastInsertId()
}

function getCustomSounds() {
  return all('SELECT * FROM custom_sounds ORDER BY created_at DESC')
}

function deleteCustomSound(id) {
  run('DELETE FROM custom_sounds WHERE id = ?', [id])
}

/* ============================================================
   SLEEP
   ============================================================ */
function getSleepRecords(limit = 60) {
  return all('SELECT * FROM sleep_records ORDER BY wake_time DESC LIMIT ?', [limit])
}

function createSleepRecord({ bedtime, wakeTime, quality = 3, notes = '' }) {
  run(
    `INSERT INTO sleep_records (bedtime, wake_time, quality, notes, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [bedtime, wakeTime, quality, notes, Date.now()]
  )
  return lastInsertId()
}

function updateSleepRecord(id, updates) {
  const fields = []
  const values = []
  const map = {
    bedtime: 'bedtime',
    wakeTime: 'wake_time',
    quality: 'quality',
    notes: 'notes',
  }
  for (const [key, col] of Object.entries(map)) {
    if (updates[key] !== undefined) {
      fields.push(`${col} = ?`)
      values.push(updates[key])
    }
  }
  if (fields.length === 0) return
  values.push(id)
  run(`UPDATE sleep_records SET ${fields.join(', ')} WHERE id = ?`, values)
}

function deleteSleepRecord(id) {
  run('DELETE FROM sleep_records WHERE id = ?', [id])
}

function getSleepStats() {
  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000

  const calc = (since) => {
    const rows = all(
      'SELECT bedtime, wake_time, quality FROM sleep_records WHERE wake_time >= ?',
      [since]
    )
    if (rows.length === 0) return { count: 0, avgSeconds: 0, avgQuality: 0 }
    const durations = rows.map((r) => Math.max(0, (r.wake_time - r.bedtime) / 1000))
    const totalDur = durations.reduce((a, b) => a + b, 0)
    const totalQ = rows.reduce((a, r) => a + (r.quality || 0), 0)
    return {
      count: rows.length,
      avgSeconds: Math.round(totalDur / rows.length),
      avgQuality: +(totalQ / rows.length).toFixed(1),
    }
  }
  return { weekly: calc(weekAgo), monthly: calc(monthAgo) }
}

/* ============================================================
   EXPORT / IMPORT
   ============================================================ */
function exportAll() {
  return {
    version: 1,
    exportedAt: Date.now(),
    settings: getAllSettings(),
    alarms: getAlarms(),
    timers: getTimers().filter((t) => !t.isPreset),
    sessions: all('SELECT * FROM sessions'),
    sleepRecords: all('SELECT * FROM sleep_records'),
    achievements: getAchievements(),
  }
}

function importAll(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid backup file')
  exec('BEGIN TRANSACTION')
  try {
    if (data.settings) for (const [k, v] of Object.entries(data.settings)) setSetting(k, v)
    if (Array.isArray(data.alarms)) {
      exec('DELETE FROM alarms')
      for (const a of data.alarms) createAlarm(a)
    }
    if (Array.isArray(data.timers)) {
      exec('DELETE FROM timers WHERE is_preset = 0')
      for (const t of data.timers) createTimer(t)
    }
    if (Array.isArray(data.sleepRecords)) {
      exec('DELETE FROM sleep_records')
      for (const s of data.sleepRecords) createSleepRecord(s)
    }
    exec('COMMIT')
  } catch (e) {
    exec('ROLLBACK')
    throw e
  }
  saveNow()
  return true
}

module.exports = {
  init,
  saveNow,
  getSetting,
  setSetting,
  getAllSettings,
  getAlarms,
  createAlarm,
  updateAlarm,
  deleteAlarm,
  getTimers,
  createTimer,
  deleteTimer,
  createSession,
  getStats,
  getSessionsByType,
  getRecentSessions,
  unlockAchievement,
  getAchievements,
  addCustomSound,
  getCustomSounds,
  deleteCustomSound,
  getSleepRecords,
  createSleepRecord,
  updateSleepRecord,
  deleteSleepRecord,
  getSleepStats,
  exportAll,
  importAll,
}