export default function CosmicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* ========== Deep space base with slow pan ========== */}
      <div
        className="absolute inset-0 animate-slow-pan"
        style={{
          background:
            'radial-gradient(ellipse at 75% 15%, #2a0a4a 0%, #150530 35%, #050510 75%)',
        }}
      />

      {/* ========== Big purple planet — top right ========== */}
      <div
        className="absolute w-[55%] aspect-square rounded-full animate-slow-drift"
        style={{
          top: '-18%',
          right: '-12%',
          background:
            'radial-gradient(circle at 32% 32%, #c4b5fd 0%, #a78bfa 25%, #7c3aed 55%, #3b0764 80%, transparent 90%)',
          filter: 'blur(2px)',
          boxShadow: '0 0 200px rgba(124,58,237,0.6)',
        }}
      />

      {/* ========== Small moon floating ========== */}
      <div
        className="absolute w-[70px] h-[70px] rounded-full animate-float-soft"
        style={{
          top: '12%',
          right: '38%',
          background:
            'radial-gradient(circle at 35% 35%, #e5e7eb 0%, #9ca3af 55%, #4b5563 100%)',
          boxShadow: '0 0 60px rgba(200,200,220,0.5), inset -8px -8px 20px rgba(0,0,0,0.5)',
        }}
      />

      {/* ========== Nebula purple glow — bottom left ========== */}
      <div
        className="absolute w-[70%] aspect-square rounded-full animate-float-glow"
        style={{
          bottom: '-30%',
          left: '5%',
          background:
            'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(100,50,200,0.18) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ========== Warm gold glow — bottom right ========== */}
      <div
        className="absolute w-[60%] aspect-square rounded-full animate-float-glow-slow"
        style={{
          bottom: '-22%',
          right: '0%',
          background:
            'radial-gradient(circle, rgba(255,180,90,0.3) 0%, rgba(200,100,50,0.12) 45%, transparent 75%)',
          filter: 'blur(70px)',
        }}
      />

      {/* ========== Mountain silhouettes at bottom ========== */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[42%]"
        viewBox="0 0 1920 700"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="cosmicMount1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0a2e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#050510" />
          </linearGradient>
          <linearGradient id="cosmicMount2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a1050" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#050510" />
          </linearGradient>
        </defs>
        <path
          d="M0,500 L180,340 L340,460 L520,300 L700,440 L880,320 L1080,470 L1280,360 L1480,490 L1680,380 L1860,500 L1920,450 L1920,700 L0,700 Z"
          fill="url(#cosmicMount2)"
        />
        <path
          d="M0,600 L220,460 L420,570 L620,440 L820,560 L1020,430 L1220,570 L1420,470 L1620,590 L1820,500 L1920,560 L1920,700 L0,700 Z"
          fill="url(#cosmicMount1)"
        />
      </svg>

      {/* ========== Reflective water glow ========== */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[20%]"
        style={{
          background:
            'linear-gradient(to top, rgba(255,160,80,0.22) 0%, rgba(168,85,247,0.1) 45%, transparent 100%)',
        }}
      />

      {/* ========== Star field ========== */}
      <div className="absolute inset-0">
        {[...Array(70)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${(i * 137.5) % 100}%`,
              top: `${(i * 71.3) % 100}%`,
              width: i % 3 === 0 ? '2px' : '1px',
              height: i % 3 === 0 ? '2px' : '1px',
              animationDelay: `${(i % 6) * 0.5}s`,
              opacity: 0.55,
            }}
          />
        ))}
      </div>

      {/* ========== Floating golden + purple particles ========== */}
      {[...Array(18)].map((_, i) => (
        <div
          key={`p${i}`}
          className="absolute rounded-full animate-float-glow"
          style={{
            left: `${(i * 41.7) % 100}%`,
            top: `${(i * 67.3) % 100}%`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            background: i % 2 === 0 ? '#fbbf24' : '#c084fc',
            boxShadow: `0 0 12px ${i % 2 === 0 ? '#fbbf24' : '#c084fc'}`,
            animationDelay: `${(i % 5) * 1.2}s`,
            animationDuration: `${10 + (i % 4) * 3}s`,
            opacity: 0.75,
          }}
        />
      ))}

      {/* ========== Dark vignette ========== */}
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