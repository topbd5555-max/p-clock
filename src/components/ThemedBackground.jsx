import { useSettings } from '../context/SettingsContext.jsx'
import { getTheme } from '../lib/themes.js'

export default function ThemedBackground({ overlay = false }) {
  const { settings } = useSettings()
  const theme = getTheme(settings.theme)

  /* ============ 1. Custom VIDEO ============ */
  if (settings.customVideo) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          key={settings.customVideo}
          className="absolute inset-0 w-full h-full object-cover"
          src={`pclock-media://bg/${settings.customVideo}`}
          autoPlay
          loop
          muted={settings.customVideoMuted !== false}
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          style={{
            filter: `blur(${settings.customVideoBlur || 0}px) brightness(${
              1 - (settings.customVideoDarkness ?? 0.3)
            })`,
            opacity: overlay ? (settings.customVideoOpacity ?? 1) : settings.customVideoOpacity ?? 1,
            transform:
              (settings.customVideoBlur || 0) > 0 ? 'scale(1.06)' : 'scale(1)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background: overlay
              ? 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 100%)'
              : 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      </div>
    )
  }

  /* ============ 2. Custom IMAGE ============ */
  if (settings.customBg) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 animate-slow-pan"
          style={{
            backgroundImage: `url(${settings.customBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${settings.customBgBlur || 0}px) brightness(${
              1 - (settings.customBgDarkness ?? 0.3)
            })`,
            transform: (settings.customBgBlur || 0) > 0 ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${
              (settings.customBgDarkness ?? 0.3) * 1.5
            }) 100%)`,
          }}
        />
      </div>
    )
  }

  /* ============ 3. Themed ============ */
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 animate-slow-pan" style={{ background: theme.bg }} />

      {theme.glows.map((g, i) => (
        <div
          key={i}
          className={i % 2 === 0 ? 'animate-float-glow' : 'animate-float-glow-slow'}
          style={{
            position: 'absolute',
            left: g.x,
            top: g.y,
            width: g.size,
            height: g.size,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${g.color} 0%, transparent 70%)`,
            filter: `blur(${g.blur}px)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {theme.mountains && (
        <svg
          className="absolute bottom-0 left-0 w-full h-[45%]"
          viewBox="0 0 1920 700"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`tmt-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.mountains.top} stopOpacity="0.75" />
              <stop offset="100%" stopColor={theme.mountains.bottom} />
            </linearGradient>
            <linearGradient id={`tmt2-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.mountains.top} stopOpacity="0.5" />
              <stop offset="100%" stopColor={theme.mountains.bottom} />
            </linearGradient>
          </defs>
          <path
            d="M0,500 L180,340 L340,460 L520,300 L700,440 L880,320 L1080,470 L1280,360 L1480,490 L1680,380 L1860,500 L1920,450 L1920,700 L0,700 Z"
            fill={`url(#tmt2-${theme.id})`}
          />
          <path
            d="M0,600 L220,460 L420,570 L620,440 L820,560 L1020,430 L1220,570 L1420,470 L1620,590 L1820,500 L1920,560 L1920,700 L0,700 Z"
            fill={`url(#tmt-${theme.id})`}
          />
        </svg>
      )}

      {theme.id !== 'minimal' && (
        <div className="absolute inset-0">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                left: `${(i * 137.5) % 100}%`,
                top: `${(i * 71.3) % 100}%`,
                width: i % 3 === 0 ? '2px' : '1px',
                height: i % 3 === 0 ? '2px' : '1px',
                background: theme.starColor,
                animationDelay: `${(i % 6) * 0.5}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  )
}