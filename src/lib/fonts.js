export const FONTS = {
  default: {
    id: 'default',
    label: 'Default',
    emoji: '🅰️',
    family: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
    weight: 300,
  },
  digital: {
    id: 'digital',
    label: 'Digital',
    emoji: '💻',
    family: '"Orbitron", "Segoe UI", monospace',
    weight: 500,
  },
  serif: {
    id: 'serif',
    label: 'Serif',
    emoji: '📖',
    family: '"Cormorant Garamond", Georgia, serif',
    weight: 500,
  },
  cinzel: {
    id: 'cinzel',
    label: 'Cinzel',
    emoji: '👑',
    family: '"Cinzel", serif',
    weight: 600,
  },
  thin: {
    id: 'thin',
    label: 'Thin',
    emoji: '➖',
    family: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
    weight: 100,
  },
  mono: {
    id: 'mono',
    label: 'Mono',
    emoji: '⌨️',
    family: '"JetBrains Mono", Consolas, monospace',
    weight: 300,
  },
}

export const FONT_LIST = Object.values(FONTS)

export function getFont(id) {
  return FONTS[id] || FONTS.default
}