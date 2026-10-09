const {
  app,
  BrowserWindow,
  session,
  ipcMain,
  shell,
  Tray,
  Menu,
  globalShortcut,
  nativeImage,
  protocol,
  net,
} = require('electron')
const path = require('path')
const fs = require('fs')
const db = require('./db')
const encryption = require('./encryption')
const updater = require('./updater')
const { showNotification } = require('./notifications')

/* 🛡️ Custom protocol — MUST be before app.whenReady() */
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'pclock-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: false,
      corsEnabled: true,
    },
  },
])

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.exit(0)
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

let mainWindow = null
let tray = null
let isQuitting = false
let alarmTimer = null
const isDev = process.env.NODE_ENV === 'development'

/* ============================================================
   PATHS
   ============================================================ */
function getBackgroundsDir() {
  const dir = path.join(app.getPath('userData'), 'backgrounds')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getSoundsDir() {
  const dir = path.join(app.getPath('userData'), 'sounds')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

/* ============================================================
   CUSTOM PROTOCOL
   ============================================================ */
function registerMediaProtocol() {
  protocol.handle('pclock-media', (req) => {
    try {
      const url = new URL(req.url)
      const host = url.hostname

      let mediaDir
      if (host === 'bg') mediaDir = getBackgroundsDir()
      else if (host === 'sound') mediaDir = getSoundsDir()
      else return new Response('Forbidden', { status: 403 })

      const filename = decodeURIComponent(url.pathname).replace(/^\/+/, '')

      if (
        !filename ||
        filename.includes('/') ||
        filename.includes('\\') ||
        filename.includes('..') ||
        filename.startsWith('.')
      ) {
        return new Response('Forbidden', { status: 403 })
      }

      const filePath = path.join(mediaDir, filename)
      const resolved = path.resolve(filePath)
      const safeBase = path.resolve(mediaDir) + path.sep

      if (!resolved.startsWith(safeBase)) {
        return new Response('Forbidden', { status: 403 })
      }

      if (!fs.existsSync(resolved)) {
        return new Response('Not found', { status: 404 })
      }

      const fileUrl = 'file:///' + resolved.replace(/\\/g, '/').replace(/^\/+/, '')
      return net.fetch(fileUrl)
    } catch (e) {
      console.error('Media protocol error:', e)
      return new Response('Error: ' + e.message, { status: 500 })
    }
  })
}

/* ============================================================
   TRAY
   ============================================================ */
function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#a855f7"/>
          <stop offset="100%" stop-color="#ec4899"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#g)"/>
      <text x="16" y="22" font-family="Segoe UI" font-size="18" font-weight="bold"
        fill="#fff" text-anchor="middle">P</text>
    </svg>`
  const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  return nativeImage.createFromDataURL(dataUri).resize({ width: 16, height: 16 })
}

function createTray() {
  if (tray) return
  try {
    tray = new Tray(createTrayIcon())
    tray.setToolTip('P-Clock')
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show P-Clock',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
        },
      },
      {
        label: 'Toggle Always on Top',
        type: 'checkbox',
        checked: db.getSetting('alwaysOnTop', false),
        click: (item) => {
          if (mainWindow) {
            mainWindow.setAlwaysOnTop(item.checked)
            db.setSetting('alwaysOnTop', item.checked)
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true
          app.quit()
        },
      },
    ])
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) mainWindow.hide()
        else {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    })
  } catch (e) {
    console.warn('Tray creation failed:', e)
  }
}

/* ============================================================
   HOTKEYS
   ============================================================ */
function registerHotkeys() {
  try {
    globalShortcut.register('CommandOrControl+Shift+T', () => {
      if (mainWindow) mainWindow.webContents.send('hotkey:toggle-timer')
    })
    globalShortcut.register('CommandOrControl+Shift+S', () => {
      if (mainWindow) mainWindow.webContents.send('hotkey:toggle-stopwatch')
    })
    globalShortcut.register('CommandOrControl+Shift+P', () => {
      if (mainWindow) mainWindow.webContents.send('hotkey:toggle-pomodoro')
    })
  } catch (e) {
    console.warn('Hotkey registration failed:', e)
  }
}

/* ============================================================
   ALARM SCHEDULER
   ============================================================ */
function startAlarmScheduler() {
  if (alarmTimer) clearInterval(alarmTimer)
  alarmTimer = setInterval(checkAlarms, 10000)
  checkAlarms()
}

function checkAlarms() {
  try {
    const alarms = db.getAlarms()
    const now = new Date()
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`
    const nowDay = now.getDay()
    const nowMs = now.getTime()

    for (const a of alarms) {
      if (!a.enabled) continue
      if (a.time !== nowHHMM) continue
      const dayMatch = a.days.length === 0 || a.days.includes(nowDay)
      if (!dayMatch) continue
      if (a.lastTriggeredAt && nowMs - a.lastTriggeredAt < 60 * 1000) continue
      triggerAlarm(a)
      db.updateAlarm(a.id, { lastTriggeredAt: nowMs })
    }
  } catch (e) {
    console.warn('Alarm check error:', e)
  }
}

function triggerAlarm(alarm) {
  console.log('⏰ Alarm firing:', alarm.time, alarm.label)
  showNotification({
    title: `⏰ Alarm · ${alarm.time}`,
    body: alarm.label || 'Time to wake up!',
    silent: false,
  })
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show()
    if (!mainWindow.isFocused()) mainWindow.flashFrame(true)
    mainWindow.webContents.send('alarm:fired', {
      id: alarm.id,
      time: alarm.time,
      label: alarm.label,
      sound: alarm.sound,
      snoozeMinutes: alarm.snoozeMinutes,
    })
  }
}

/* ============================================================
   WINDOW
   ============================================================ */
function createWindow() {
  const alwaysOnTop = db.getSetting('alwaysOnTop', false)

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 450,
    backgroundColor: '#050510',
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  })

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const allowedApis =
      'https://api.open-meteo.com https://geocoding-api.open-meteo.com'
    const csp = isDev
      ? `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:5173 http://localhost:5173 ${allowedApis}; img-src 'self' data: blob: pclock-media:; font-src 'self' data: https://fonts.gstatic.com; media-src 'self' data: blob: pclock-media:;`
      : `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: pclock-media:; font-src 'self' data: https://fonts.gstatic.com; media-src 'self' data: blob: pclock-media:; connect-src 'self' ${allowedApis};`
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    })
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev ? ['http://localhost:5173'] : ['file://']
    if (!allowed.some((p) => url.startsWith(p))) event.preventDefault()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-attach-webview', (e) => e.preventDefault())
  session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false))

  // ✅ TEMPORARY: DevTools auto-open for debugging
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.webContents.openDevTools() // 👈 TEMPORARY — remove after fix
  })

  // 🚫 TEMPORARY: commented out so DevTools can stay open in production
  // if (!isDev) {
  //   mainWindow.webContents.on('devtools-opened', () => {
  //     mainWindow.webContents.closeDevTools()
  //   })
  // }

  mainWindow.on('close', (event) => {
    if (!isQuitting && !isDev) {
      event.preventDefault()
      mainWindow.hide()
      return
    }
    isQuitting = true
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (isDev) mainWindow.loadURL('http://localhost:5173')
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

/* ============================================================
   AUTO LAUNCH
   ============================================================ */
function setAutoLaunch(enabled) {
  app.setLoginItemSettings({
    openAtLogin: !!enabled,
    path: process.execPath,
    args: ['--hidden'],
  })
  db.setSetting('autoLaunch', !!enabled)
}

/* ============================================================
   IPC
   ============================================================ */
function setupIPC() {
  ipcMain.handle('settings:get', (_e, key, def) => db.getSetting(key, def))
  ipcMain.handle('settings:set', (_e, key, value) => {
    db.setSetting(key, value)
    if (key === 'alwaysOnTop' && mainWindow) mainWindow.setAlwaysOnTop(!!value)
    if (key === 'autoLaunch') setAutoLaunch(!!value)
    return true
  })
  ipcMain.handle('settings:getAll', () => db.getAllSettings())

  ipcMain.handle('alarms:list', () => db.getAlarms())
  ipcMain.handle('alarms:create', (_e, a) => db.createAlarm(a))
  ipcMain.handle('alarms:update', (_e, id, u) => {
    db.updateAlarm(id, u)
    return true
  })
  ipcMain.handle('alarms:delete', (_e, id) => {
    db.deleteAlarm(id)
    return true
  })
  ipcMain.handle('alarms:test', (_e, alarm) => {
    triggerAlarm(alarm)
    return true
  })

  ipcMain.handle('timers:list', () => db.getTimers())
  ipcMain.handle('timers:create', (_e, t) => db.createTimer(t))
  ipcMain.handle('timers:delete', (_e, id) => {
    db.deleteTimer(id)
    return true
  })

  ipcMain.handle('sessions:create', (_e, s) => db.createSession(s))
  ipcMain.handle('sessions:stats', () => db.getStats())
  ipcMain.handle('sessions:byType', (_e, type, limit) =>
    db.getSessionsByType(type, limit)
  )
  ipcMain.handle('sessions:recent', (_e, limit) => db.getRecentSessions(limit))

  ipcMain.handle('sleep:list', (_e, limit) => db.getSleepRecords(limit))
  ipcMain.handle('sleep:create', (_e, s) => db.createSleepRecord(s))
  ipcMain.handle('sleep:update', (_e, id, u) => {
    db.updateSleepRecord(id, u)
    return true
  })
  ipcMain.handle('sleep:delete', (_e, id) => {
    db.deleteSleepRecord(id)
    return true
  })
  ipcMain.handle('sleep:stats', () => db.getSleepStats())

  ipcMain.handle('achievements:unlock', (_e, key) => db.unlockAchievement(key))
  ipcMain.handle('achievements:list', () => db.getAchievements())

  ipcMain.handle('sounds:add', (_e, name, p) => db.addCustomSound(name, p))
  ipcMain.handle('sounds:list', () => db.getCustomSounds())
  ipcMain.handle('sounds:delete', (_e, id) => {
    db.deleteCustomSound(id)
    return true
  })
  ipcMain.handle('sounds:pickFile', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a sound file',
      filters: [
        { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })
  ipcMain.handle('sounds:readFile', (_e, p) => {
    try {
      const buf = fs.readFileSync(p)
      return { data: buf.toString('base64'), ext: path.extname(p).slice(1) }
    } catch {
      return null
    }
  })

  ipcMain.handle('sounds:importFile', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose an audio file',
      filters: [
        { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return null

    const srcPath = result.filePaths[0]
    try {
      const stat = fs.statSync(srcPath)
      const MAX_SIZE = 50 * 1024 * 1024
      if (stat.size > MAX_SIZE) {
        return { error: 'Audio too large (max 50 MB)' }
      }

      const soundsDir = getSoundsDir()
      const ext = path.extname(srcPath).toLowerCase() || '.mp3'
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const dest = path.join(soundsDir, id)
      fs.copyFileSync(srcPath, dest)

      return {
        filename: id,
        originalName: path.basename(srcPath),
        size: stat.size,
      }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('sounds:listFiles', async () => {
    try {
      const dir = getSoundsDir()
      const files = fs.readdirSync(dir)
      return files.map((f) => {
        const stat = fs.statSync(path.join(dir, f))
        return { filename: f, size: stat.size }
      })
    } catch {
      return []
    }
  })

  ipcMain.handle('sounds:deleteFile', async (_e, filename) => {
    try {
      if (
        !filename ||
        typeof filename !== 'string' ||
        filename.includes('/') ||
        filename.includes('\\') ||
        filename.includes('..')
      ) {
        return false
      }
      const soundsDir = getSoundsDir()
      const filePath = path.join(soundsDir, filename)
      const resolved = path.resolve(filePath)
      const safeBase = path.resolve(soundsDir) + path.sep
      if (!resolved.startsWith(safeBase)) return false
      if (fs.existsSync(resolved)) fs.unlinkSync(resolved)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('window:pickImage', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a background image',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle('window:readImage', (_e, p) => {
    try {
      const stat = fs.statSync(p)
      if (stat.size > 8 * 1024 * 1024) {
        return { error: 'Image too large (max 8 MB)' }
      }
      const buf = fs.readFileSync(p)
      const ext = path.extname(p).slice(1).toLowerCase()
      const mimeMap = {
        jpg: 'jpeg',
        jpeg: 'jpeg',
        png: 'png',
        webp: 'webp',
        gif: 'gif',
      }
      const mime = mimeMap[ext] || 'png'
      return { data: `data:image/${mime};base64,${buf.toString('base64')}` }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('bg:pickVideo', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a background video',
      filters: [
        { name: 'Videos', extensions: ['mp4', 'webm', 'ogg', 'mov', 'm4v'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return null
    const srcPath = result.filePaths[0]
    try {
      const stat = fs.statSync(srcPath)
      return { path: srcPath, size: stat.size, name: path.basename(srcPath) }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('bg:saveVideo', async (_e, srcPath) => {
    try {
      if (!srcPath || typeof srcPath !== 'string') return { error: 'Invalid path' }
      if (!fs.existsSync(srcPath)) return { error: 'File not found' }
      const stat = fs.statSync(srcPath)
      const MAX_SIZE = 200 * 1024 * 1024
      if (stat.size > MAX_SIZE) return { error: 'Video too large (max 200 MB)' }

      const mediaDir = getBackgroundsDir()
      const ext = path.extname(srcPath).toLowerCase() || '.mp4'
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const dest = path.join(mediaDir, id)
      fs.copyFileSync(srcPath, dest)
      return { filename: id }
    } catch (e) {
      return { error: e.message }
    }
  })

  ipcMain.handle('bg:deleteVideo', async (_e, filename) => {
    try {
      if (
        !filename ||
        typeof filename !== 'string' ||
        filename.includes('/') ||
        filename.includes('\\') ||
        filename.includes('..')
      ) {
        return false
      }
      const mediaDir = getBackgroundsDir()
      const filePath = path.join(mediaDir, filename)
      const resolved = path.resolve(filePath)
      const safeBase = path.resolve(mediaDir) + path.sep
      if (!resolved.startsWith(safeBase)) return false
      if (fs.existsSync(resolved)) fs.unlinkSync(resolved)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('bg:listVideos', async () => {
    try {
      const dir = getBackgroundsDir()
      const files = fs.readdirSync(dir)
      return files.map((f) => ({
        filename: f,
        size: fs.statSync(path.join(dir, f)).size,
      }))
    } catch {
      return []
    }
  })

  ipcMain.handle('notification:show', (_e, opts) => showNotification(opts))

  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:hide', () => mainWindow?.hide())
  ipcMain.handle('window:setAlwaysOnTop', (_e, v) => {
    mainWindow?.setAlwaysOnTop(!!v)
    db.setSetting('alwaysOnTop', !!v)
    return true
  })

  ipcMain.handle('backup:export', async () => {
    const { dialog } = require('electron')
    const data = db.exportAll()
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export P-Clock Backup',
      defaultPath: `p-clock-backup-${Date.now()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath) return { ok: false }
    try {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2))
      return { ok: true, path: result.filePath }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('backup:import', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import P-Clock Backup',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return { ok: false }
    try {
      const raw = fs.readFileSync(result.filePaths[0], 'utf-8')
      db.importAll(JSON.parse(raw))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  /* 🔐 Encryption status */
  ipcMain.handle('encryption:status', () => encryption.getStatus())

  /* 🔄 Auto-updater */
  ipcMain.handle('updater:check', () => updater.checkForUpdates())
  ipcMain.handle('updater:install', () => {
    updater.quitAndInstall()
    return true
  })
  ipcMain.handle('updater:version', () => app.getVersion())

  ipcMain.handle('ping', () => 'pong')
}

/* ============================================================
   LIFECYCLE
   ============================================================ */
app.whenReady().then(async () => {
  process.on('uncaughtException', (err) => console.error('Uncaught:', err))
  process.on('unhandledRejection', (reason) => console.error('Unhandled:', reason))

  try {
    await db.init()
    console.log('✅ P-Clock Database ready')
  } catch (e) {
    console.error('❌ DB init failed:', e)
  }

  registerMediaProtocol()
  createWindow()
  createTray()
  registerHotkeys()
  setupIPC()
  startAlarmScheduler()

  // Init auto-updater with main window reference
  if (mainWindow) updater.init(mainWindow)

  const autoLaunch = db.getSetting('autoLaunch', false)
  if (autoLaunch) setAutoLaunch(true)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (isDev) app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
  try {
    if (alarmTimer) clearInterval(alarmTimer)
    db.saveNow()
  } catch {
    /* ignore */
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  try {
    db.saveNow()
  } catch {
    /* ignore */
  }
})