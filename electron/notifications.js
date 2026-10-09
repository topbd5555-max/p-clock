const { Notification } = require('electron')

function showNotification({ title, body, silent = false }) {
  if (!Notification.isSupported()) return false
  try {
    const n = new Notification({
      title: title || 'P-Clock',
      body: body || '',
      silent,
      urgency: 'normal',
    })
    n.show()
    return true
  } catch (e) {
    console.error('Notification error:', e)
    return false
  }
}

module.exports = { showNotification }