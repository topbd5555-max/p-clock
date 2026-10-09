/* ============================================================
   P-Clock IPC bridge — safe wrapper around window.pclock
   If Electron preload is missing any method, falls back to stub.
   ============================================================ */

const isElectron = typeof window !== 'undefined' && !!window.pclock
const noopAsync = async () => null

const DEEP_STUB = {
  settings: {
    get: async () => null,
    set: noopAsync,
    getAll: async () => ({}),
  },
  alarms: {
    list: async () => [],
    create: noopAsync,
    update: noopAsync,
    delete: noopAsync,
    test: noopAsync,
    onFired: () => () => {},
  },
  timers: {
    list: async () => [],
    create: noopAsync,
    delete: noopAsync,
  },
  sessions: {
    create: noopAsync,
    stats: async () => ({
      daily: { count: 0, total: 0 },
      weekly: { count: 0, total: 0 },
      monthly: { count: 0, total: 0 },
    }),
    byType: async () => [],
    recent: async () => [],
  },
  sleep: {
    list: async () => [],
    create: noopAsync,
    update: noopAsync,
    delete: noopAsync,
    stats: async () => ({
      weekly: { count: 0, avgSeconds: 0, avgQuality: 0 },
      monthly: { count: 0, avgSeconds: 0, avgQuality: 0 },
    }),
  },
  achievements: {
    unlock: async () => false,
    list: async () => [],
  },
  sounds: {
    add: noopAsync,
    list: async () => [],
    delete: noopAsync,
    pickFile: noopAsync,
    readFile: noopAsync,
    importFile: noopAsync,
    listFiles: async () => [],
    deleteFile: async () => false,
  },
  notify: noopAsync,
  window: {
    minimize: noopAsync,
    hide: noopAsync,
    setAlwaysOnTop: noopAsync,
    pickImage: noopAsync,
    readImage: noopAsync,
  },
  bg: {
    pickVideo: noopAsync,
    saveVideo: noopAsync,
    deleteVideo: noopAsync,
    listVideos: async () => [],
  },
  backup: {
    export: noopAsync,
    import: noopAsync,
  },
  encryption: {
    status: async () => null,
  },
  updater: {
    check: async () => ({ ok: false, error: 'Not available' }),
    install: noopAsync,
    version: async () => '1.0.0-browser',
    onEvent: () => () => {},
  },
  onHotkey: () => () => {},
  ping: async () => 'browser',
}

/* Deep-merge stub with actual preload — missing methods use stub */
function mergeDeep(stub, real) {
  if (!real || typeof real !== 'object') return stub
  const out = { ...stub }
  for (const key of Object.keys(real)) {
    const rv = real[key]
    const sv = stub[key]
    if (
      rv &&
      typeof rv === 'object' &&
      !Array.isArray(rv) &&
      sv &&
      typeof sv === 'object' &&
      !Array.isArray(sv)
    ) {
      out[key] = mergeDeep(sv, rv)
    } else if (rv !== undefined) {
      out[key] = rv
    }
  }
  return out
}

export const pclock = isElectron
  ? mergeDeep(DEEP_STUB, window.pclock)
  : DEEP_STUB

export const isRunningInElectron = isElectron