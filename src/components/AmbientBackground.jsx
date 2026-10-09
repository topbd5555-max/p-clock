export default function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base night sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #05060f 0%, #0d0620 40%, #150728 70%, #1a0a1f 100%)',
        }}
      />

      {/* Stars (twinkle) */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] bg-white rounded-full animate-twinkle"
            style={{
              left: `${(i * 137.5) % 100}%`,
              top: `${(i * 71.3) % 55}%`,
              animationDelay: `${(i % 5) * 0.6}s`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* Moon glow — top right */}
      <div
        className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(220,230,255,0.35) 0%, rgba(160,180,255,0.15) 30%, transparent 60%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Animated purple glow — bottom left */}
      <div
        className="absolute -bottom-40 -left-40 w-[800px] h-[800px] rounded-full animate-float-glow"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(120,50,200,0.15) 40%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Animated blue glow — middle right */}
      <div
        className="absolute top-1/3 -right-20 w-[600px] h-[600px] rounded-full animate-float-glow-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(100,80,220,0.28) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Mountain silhouettes */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[55%]"
        viewBox="0 0 1920 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0a2e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#050510" />
          </linearGradient>
          <linearGradient id="mountainGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#251040" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#050510" />
          </linearGradient>
        </defs>
        {/* Back mountains */}
        <path
          d="M0,550 L150,380 L300,480 L450,320 L600,450 L750,340 L900,470 L1080,360 L1280,500 L1480,400 L1680,510 L1860,420 L1920,460 L1920,800 L0,800 Z"
          fill="url(#mountainGrad2)"
        />
        {/* Front mountains */}
        <path
          d="M0,650 L200,500 L380,600 L560,480 L740,590 L920,470 L1120,600 L1320,510 L1520,620 L1720,540 L1920,610 L1920,800 L0,800 Z"
          fill="url(#mountainGrad)"
        />
      </svg>

      {/* City lights — bottom warm glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[28%]"
        style={{
          background:
            'linear-gradient(to top, rgba(255,160,60,0.18) 0%, rgba(255,100,50,0.08) 40%, transparent 100%)',
        }}
      />

      {/* City light dots */}
      <div className="absolute bottom-[8%] left-0 right-0 h-[15%]">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 23.7) % 100}%`,
              bottom: `${(i * 13.1) % 100}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              background: ['#ffb347', '#ff8c42', '#ffd280', '#ffa07a'][i % 4],
              opacity: 0.5 + (i % 5) * 0.1,
              boxShadow: `0 0 6px ${['#ffb347', '#ff8c42', '#ffd280'][i % 3]}`,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  )
}