const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pclock', {
  settings: {
    get: (key, def) => ipcRenderer.invoke('settings:get', key, def),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
  alarms: {
    list: () => ipcRenderer.invoke('alarms:list'),
    create: (a) => ipcRenderer.invoke('alarms:create', a),
    update: (id, u) => ipcRenderer.invoke('alarms:update', id, u),
    delete: (id) => ipcRenderer.invoke('alarms:delete', id),
    test: (a) => ipcRenderer.invoke('alarms:test', a),
    onFired: (cb) => {
      const handler = (_e, data) => cb(data)
      ipcRenderer.on('alarm:fired', handler)
      return () => ipcRenderer.removeListener('alarm:fired', handler)
    },
  },
  timers: {
    list: () => ipcRenderer.invoke('timers:list'),
    create: (t) => ipcRenderer.invoke('timers:create', t),
    delete: (id) => ipcRenderer.invoke('timers:delete', id),
  },
  sessions: {
    create: (s) => ipcRenderer.invoke('sessions:create', s),
    stats: () => ipcRenderer.invoke('sessions:stats'),
    byType: (type, limit) => ipcRenderer.invoke('sessions:byType', type, limit),
    recent: (limit) => ipcRenderer.invoke('sessions:recent', limit),
  },
  sleep: {
    list: (limit) => ipcRenderer.invoke('sleep:list', limit),
    create: (s) => ipcRenderer.invoke('sleep:create', s),
    update: (id, u) => ipcRenderer.invoke('sleep:update', id, u),
    delete: (id) => ipcRenderer.invoke('sleep:delete', id),
    stats: () => ipcRenderer.invoke('sleep:stats'),
  },
  achievements: {
    unlock: (key) => ipcRenderer.invoke('achievements:unlock', key),
    list: () => ipcRenderer.invoke('achievements:list'),
  },
  sounds: {
    add: (name, p) => ipcRenderer.invoke('sounds:add', name, p),
    list: () => ipcRenderer.invoke('sounds:list'),
    delete: (id) => ipcRenderer.invoke('sounds:delete', id),
    pickFile: () => ipcRenderer.invoke('sounds:pickFile'),
    readFile: (p) => ipcRenderer.invoke('sounds:readFile', p),
    importFile: () => ipcRenderer.invoke('sounds:importFile'),
    listFiles: () => ipcRenderer.invoke('sounds:listFiles'),
    deleteFile: (filename) => ipcRenderer.invoke('sounds:deleteFile', filename),
  },
  notify: (opts) => ipcRenderer.invoke('notification:show', opts),
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    hide: () => ipcRenderer.invoke('window:hide'),
    setAlwaysOnTop: (v) => ipcRenderer.invoke('window:setAlwaysOnTop', v),
    pickImage: () => ipcRenderer.invoke('window:pickImage'),
    readImage: (p) => ipcRenderer.invoke('window:readImage', p),
  },
  bg: {
    pickVideo: () => ipcRenderer.invoke('bg:pickVideo'),
    saveVideo: (p) => ipcRenderer.invoke('bg:saveVideo', p),
    deleteVideo: (filename) => ipcRenderer.invoke('bg:deleteVideo', filename),
    listVideos: () => ipcRenderer.invoke('bg:listVideos'),
  },
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    import: () => ipcRenderer.invoke('backup:import'),
  },
  encryption: {
    status: () => ipcRenderer.invoke('encryption:status'),
  },
  onHotkey: (cb) => {
    ipcRenderer.on('hotkey:toggle-timer', () => cb('toggle-timer'))
    ipcRenderer.on('hotkey:toggle-stopwatch', () => cb('toggle-stopwatch'))
    ipcRenderer.on('hotkey:toggle-pomodoro', () => cb('toggle-pomodoro'))
    return () => ipcRenderer.removeAllListeners('hotkey:toggle-timer')
  },
  ping: () => ipcRenderer.invoke('ping'),
})