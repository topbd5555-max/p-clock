import { useEffect, useState } from 'react'
import AnalogClock from './AnalogClock.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { getTheme } from '../lib/themes.js'
import { getFont } from '../lib/fonts.js'

const pad = (n) => String(n).padStart(2, '0')

export default function Clock() {
  const { settings } = useSettings()
  const theme = getTheme(settings.theme)
  const font = getFont(settings.fontStyle)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timeoutId
    const tick = () => {
      setNow(new Date())
      timeoutId = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    tick()
    return () => clearTimeout(timeoutId)
  }, [])

  const hours24 = now.getHours()
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  const minutes = pad(now.getMinutes())
  const seconds = pad(now.getSeconds())
  const meridiem = hours24 >= 12 ? 'PM' : 'AM'

  const dateText = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  /* ===== Analog ===== */
  if (settings.clockStyle === 'analog') {
    return (
      <div className="text-center">
        <AnalogClock
          size={440}
          accent={theme.accent}
          accent2={theme.accent2}
          face={settings.analogFace || 'roman'}
          textColor={theme.textPrimary}
        />
        <div
          className="mt-6 text-[16px] md:text-[20px] font-normal"
          style={{
            color: theme.textSecondary,
            fontFamily: font.family,
            fontWeight: font.weight,
          }}
        >
          {dateText}
        </div>
      </div>
    )
  }

  /* ===== Digital ===== */
  return (
    <div className="text-center px-6">
      <div
        className="flex items-start justify-center"
        style={{ color: theme.textPrimary, fontFamily: font.family, fontWeight: font.weight }}
      >
        <span className="tabular leading-none text-[88px] md:text-[140px] tracking-tight">
          {hours12}:{minutes}:{seconds}
        </span>
        <span
          className="tabular font-light text-[20px] md:text-[28px] mt-2 md:mt-3 ml-2 md:ml-3"
          style={{ color: theme.textSecondary }}
        >
          {meridiem}
        </span>
      </div>

      <div
        className="mt-1 md:mt-2 text-[16px] md:text-[22px] font-normal"
        style={{ color: theme.textSecondary, fontFamily: font.family }}
      >
        {dateText}
      </div>
    </div>
  )
}