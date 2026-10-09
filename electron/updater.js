const { autoUpdater } = require('electron-updater')
const { app } = require('electron')

let mainWindowRef = null
let isChecking = false

function init(win) {
  mainWindowRef = win

  // Configuration
  autoUpdater.autoDownload = true          // auto download when found
  autoUpdater.autoInstallOnAppQuit = true  // install on next quit
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = false

  // Events → renderer
  autoUpdater.on('checking-for-update', () => {
    send('checking')
  })

  autoUpdater.on('update-available', (info) => {
    send('available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    send('not-available', { version: info.version })
  })

  autoUpdater.on('error', (err) => {
    send('error', { message: err.message })
  })

  autoUpdater.on('download-progress', (progress) => {
    send('progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    send('downloaded', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    })
  })
}

function send(event, data) {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('updater:event', { event, data })
  }
}

async function checkForUpdates() {
  if (isChecking) return { ok: false, error: 'Already checking' }
  isChecking = true
  try {
    // Skip in dev mode — no update server
    if (!app.isPackaged) {
      setTimeout(() => {
        send('not-available', { version: app.getVersion(), dev: true })
        isChecking = false
      }, 500)
      return { ok: true, dev: true }
    }

    const result = await autoUpdater.checkForUpdates()
    return { ok: true, version: result?.updateInfo?.version }
  } catch (err) {
    send('error', { message: err.message })
    return { ok: false, error: err.message }
  } finally {
    isChecking = false
  }
}

function quitAndInstall() {
  try {
    autoUpdater.quitAndInstall(false, true)
  } catch (e) {
    console.error('quitAndInstall failed:', e)
  }
}

module.exports = { init, checkForUpdates, quitAndInstall }