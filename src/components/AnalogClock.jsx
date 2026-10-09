import { useEffect, useState } from 'react'

/* 4 face styles */
const FACES = {
  roman: {
    // I, II, III... in classic serif
    numerals: ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'],
    fontSize: 22,
    fontFamily: '"Cinzel", serif',
    fontWeight: 600,
    tick: false,
    dot: false,
  },
  numerals: {
    numerals: ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    fontSize: 24,
    fontFamily: '"Segoe UI", sans-serif',
    fontWeight: 300,
    tick: false,
    dot: false,
  },
  minimal: {
    numerals: null,
    dot: true,
    tick: false,
  },
  skeleton: {
    numerals: null,
    dot: false,
    tick: true,
    tickBig: true,
  },
}

export default function AnalogClock({
  size = 420,
  accent = '#a855f7',
  accent2 = '#fbbf24',
  face = 'roman',
  textColor = '#ffffff',
  smooth = true,
}) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    let raf = null
    let timeout = null

    const tick = () => {
      setNow(new Date())
      if (smooth) {
        raf = requestAnimationFrame(tick)
      } else {
        timeout = setTimeout(tick, 1000 - (Date.now() % 1000))
      }
    }
    tick()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (timeout) clearTimeout(timeout)
    }
  }, [smooth])

  const cfg = FACES[face] || FACES.roman
  const radius = size / 2 - 10
  const cx = size / 2
  const cy = size / 2

  const seconds = now.getSeconds() + now.getMilliseconds() / 1000
  const minutes = now.getMinutes() + seconds / 60
  const hours = (now.getHours() % 12) + minutes / 60

  const secAngle = (seconds / 60) * 360
  const minAngle = (minutes / 60) * 360
  const hrAngle = (hours / 12) * 360

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow behind clock */}
      <div
        className="absolute inset-0 rounded-full animate-halo-pulse pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accent}35 0%, transparent 65%)`,
          filter: 'blur(40px)',
          transform: 'scale(1.15)',
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
        style={{ filter: `drop-shadow(0 0 25px ${accent}80)` }}
      >
        <defs>
          <linearGradient id="ac-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} />
            <stop offset="50%" stopColor={accent2} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
          <radialGradient id="ac-face" cx="40%" cy="40%">
            <stop offset="0%" stopColor="rgba(30,10,50,0.6)" />
            <stop offset="60%" stopColor="rgba(15,5,30,0.8)" />
            <stop offset="100%" stopColor="rgba(5,2,15,0.95)" />
          </radialGradient>
          <linearGradient id="ac-sec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent2} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>

        {/* Outer glow ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius + 6}
          fill="none"
          stroke={`url(#ac-ring)`}
          strokeWidth="1.5"
          opacity="0.7"
        />

        {/* Outer dotted ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth="1"
          strokeDasharray="2 8"
          opacity="0.5"
        />

        {/* Face fill */}
        <circle cx={cx} cy={cy} r={radius - 12} fill="url(#ac-face)" />

        {/* Inner ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius - 12}
          fill="none"
          stroke={accent2}
          strokeWidth="1"
          opacity="0.35"
        />

        {/* Numerals or dots or ticks */}
        {cfg.numerals &&
          cfg.numerals.map((n, i) => {
            const angle = (i / 12) * 360 - 90
            const rad = (angle * Math.PI) / 180
            const r = radius - 45
            const x = cx + Math.cos(rad) * r
            const y = cy + Math.sin(rad) * r
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontSize={cfg.fontSize}
                fontFamily={cfg.fontFamily}
                fontWeight={cfg.fontWeight}
                style={{
                  filter: `drop-shadow(0 0 6px ${accent}80)`,
                  letterSpacing: '0.05em',
                }}
              >
                {n}
              </text>
            )
          })}

        {cfg.dot &&
          [...Array(60)].map((_, i) => {
            const angle = (i / 60) * 360 - 90
            const rad = (angle * Math.PI) / 180
            const isHour = i % 5 === 0
            const r = radius - 22
            const x = cx + Math.cos(rad) * r
            const y = cy + Math.sin(rad) * r
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isHour ? 3 : 1.2}
                fill={isHour ? accent2 : accent}
                opacity={isHour ? 0.9 : 0.4}
              />
            )
          })}

        {cfg.tick &&
          [...Array(12)].map((_, i) => {
            const angle = (i / 12) * 360 - 90
            const rad = (angle * Math.PI) / 180
            const inner = radius - 35
            const outer = radius - 15
            const x1 = cx + Math.cos(rad) * inner
            const y1 = cy + Math.sin(rad) * inner
            const x2 = cx + Math.cos(rad) * outer
            const y2 = cy + Math.sin(rad) * outer
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 3 === 0 ? accent2 : accent}
                strokeWidth={i % 3 === 0 ? 4 : 2}
                strokeLinecap="round"
                opacity={i % 3 === 0 ? 0.95 : 0.55}
                style={{ filter: `drop-shadow(0 0 4px ${accent}80)` }}
              />
            )
          })}

        {/* Hour hand */}
        <g transform={`rotate(${hrAngle} ${cx} ${cy})`}>
          <line
            x1={cx}
            y1={cy + 15}
            x2={cx}
            y2={cy - (radius - 100)}
            stroke={accent2}
            strokeWidth="7"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${accent2}90)` }}
          />
        </g>

        {/* Minute hand */}
        <g transform={`rotate(${minAngle} ${cx} ${cy})`}>
          <line
            x1={cx}
            y1={cy + 20}
            x2={cx}
            y2={cy - (radius - 55)}
            stroke={textColor}
            strokeWidth="4"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px rgba(255,255,255,0.5))` }}
          />
        </g>

        {/* Second hand */}
        <g transform={`rotate(${secAngle} ${cx} ${cy})`}>
          <line
            x1={cx}
            y1={cy + 35}
            x2={cx}
            y2={cy - (radius - 30)}
            stroke="url(#ac-sec)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${accent2})` }}
          />
          <circle
            cx={cx}
            cy={cy - (radius - 30)}
            r="3"
            fill={accent2}
            style={{ filter: `drop-shadow(0 0 6px ${accent2})` }}
          />
        </g>

        {/* Center hub */}
        <circle
          cx={cx}
          cy={cy}
          r="9"
          fill={`url(#ac-ring)`}
          style={{ filter: `drop-shadow(0 0 10px ${accent})` }}
        />
        <circle cx={cx} cy={cy} r="3.5" fill="#0a0518" />
      </svg>
    </div>
  )
}