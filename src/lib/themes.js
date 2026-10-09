/* ============================================================
   P-Clock Themes — Each theme defines bg + glows + accents
   ============================================================ */

export const THEMES = {
  cosmic: {
    id: 'cosmic',
    label: 'Cosmic',
    emoji: '🪐',
    accent: '#a855f7',
    accent2: '#fbbf24',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.65)',
    bg: 'radial-gradient(ellipse at 75% 15%, #2a0a4a 0%, #150530 35%, #050510 75%)',
    glows: [
      { x: '15%', y: '20%', size: 700, color: 'rgba(168,85,247,0.4)', blur: 80 },
      { x: '80%', y: '75%', size: 600, color: 'rgba(251,146,60,0.28)', blur: 90 },
      { x: '50%', y: '50%', size: 900, color: 'rgba(99,102,241,0.15)', blur: 100 },
    ],
    mountains: { top: '#2a1050', bottom: '#050510' },
    starColor: '#ffffff',
  },
  forest: {
    id: 'forest',
    label: 'Forest',
    emoji: '🌲',
    accent: '#10b981',
    accent2: '#a3e635',
    textPrimary: '#f0fdf4',
    textSecondary: 'rgba(220,252,231,0.65)',
    bg: 'radial-gradient(ellipse at 70% 20%, #0a2e1a 0%, #041a0e 40%, #020a05 100%)',
    glows: [
      { x: '20%', y: '25%', size: 700, color: 'rgba(16,185,129,0.35)', blur: 80 },
      { x: '75%', y: '70%', size: 600, color: 'rgba(163,230,53,0.22)', blur: 90 },
      { x: '50%', y: '40%', size: 900, color: 'rgba(5,150,105,0.15)', blur: 100 },
    ],
    mountains: { top: '#064e3b', bottom: '#020a05' },
    starColor: '#a7f3d0',
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    emoji: '🌊',
    accent: '#0ea5e9',
    accent2: '#22d3ee',
    textPrimary: '#f0f9ff',
    textSecondary: 'rgba(224,242,254,0.65)',
    bg: 'radial-gradient(ellipse at 60% 15%, #0c2a4a 0%, #06172e 40%, #01050f 100%)',
    glows: [
      { x: '25%', y: '30%', size: 700, color: 'rgba(14,165,233,0.35)', blur: 80 },
      { x: '80%', y: '65%', size: 650, color: 'rgba(34,211,238,0.25)', blur: 90 },
      { x: '40%', y: '80%', size: 800, color: 'rgba(56,189,248,0.15)', blur: 100 },
    ],
    mountains: { top: '#0c4a6e', bottom: '#01050f' },
    starColor: '#bae6fd',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    emoji: '⬛',
    accent: '#ffffff',
    accent2: '#a1a1aa',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.5)',
    bg: 'radial-gradient(ellipse at 50% 50%, #0f0f0f 0%, #050505 100%)',
    glows: [
      { x: '50%', y: '50%', size: 1000, color: 'rgba(120,120,120,0.08)', blur: 120 },
    ],
    mountains: null,
    starColor: '#52525b',
  },
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    emoji: '🌌',
    accent: '#22c55e',
    accent2: '#ec4899',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    bg: 'radial-gradient(ellipse at 30% 20%, #0a2540 0%, #1a0b2e 40%, #020617 100%)',
    glows: [
      { x: '20%', y: '15%', size: 700, color: 'rgba(34,197,94,0.35)', blur: 90 },
      { x: '80%', y: '30%', size: 650, color: 'rgba(236,72,153,0.3)', blur: 90 },
      { x: '50%', y: '80%', size: 700, color: 'rgba(59,130,246,0.25)', blur: 100 },
    ],
    mountains: { top: '#1e293b', bottom: '#020617' },
    starColor: '#e0e7ff',
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    emoji: '🌅',
    accent: '#f97316',
    accent2: '#ec4899',
    textPrimary: '#fff7ed',
    textSecondary: 'rgba(254,215,170,0.7)',
    bg: 'radial-gradient(ellipse at 50% 90%, #7c2d12 0%, #4c1d95 45%, #1a0a2e 100%)',
    glows: [
      { x: '50%', y: '80%', size: 800, color: 'rgba(249,115,22,0.5)', blur: 90 },
      { x: '20%', y: '30%', size: 600, color: 'rgba(236,72,153,0.35)', blur: 80 },
      { x: '80%', y: '40%', size: 600, color: 'rgba(168,85,247,0.3)', blur: 90 },
    ],
    mountains: { top: '#3b0764', bottom: '#1a0a2e' },
    starColor: '#fed7aa',
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    emoji: '⚡',
    accent: '#f0abfc',
    accent2: '#22d3ee',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(240,171,252,0.7)',
    bg: 'radial-gradient(ellipse at 20% 80%, #3a1055 0%, #0a0518 50%, #02010a 100%)',
    glows: [
      { x: '80%', y: '20%', size: 700, color: 'rgba(240,171,252,0.35)', blur: 80 },
      { x: '20%', y: '80%', size: 700, color: 'rgba(34,211,238,0.3)', blur: 80 },
      { x: '50%', y: '50%', size: 900, color: 'rgba(217,70,239,0.15)', blur: 100 },
    ],
    mountains: { top: '#2a0a4a', bottom: '#02010a' },
    starColor: '#67e8f9',
  },
}

export const THEME_LIST = Object.values(THEMES)

export function getTheme(id) {
  return THEMES[id] || THEMES.cosmic
}