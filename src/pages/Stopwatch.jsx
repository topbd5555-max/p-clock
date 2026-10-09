import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, Flag, Maximize2, Minimize2 } from 'lucide-react'

function formatStopwatch(ms) {
  const totalSec = Math.floor(ms / 1000)
  const hr = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  const cs = Math.floor((ms % 1000) / 10) // centiseconds
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  return {
    hr: pad(hr),
    min: pad(min),
    sec: pad(sec),
    cs: pad(cs),
  }
}

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0) // ms
  const [isRunning, setIsRunning] = useState(false)
  const [laps, setLaps] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  const startRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (isRunning) {
      startRef.current = performance.now() - elapsed
      const tick = () => {
        setElapsed(performance.now() - startRef.current)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(rafRef.current)
    }
  }, [isRunning]) // eslint-disable-line

  const toggle = () => setIsRunning((r) => !r)

  const reset = () => {
    setIsRunning(false)
    setElapsed(0)
    setLaps([])
  }

  const addLap = () => {
    const lapTime = elapsed
    const previousTotal = laps.reduce((sum, l) => sum + l.diff, 0)
    const diff = lapTime - previousTotal
    setLaps((prev) => [
      { id: prev.length + 1, total: lapTime, diff },
      ...prev,
    ])
  }

  const t = formatStopwatch(elapsed)
  const lapTime = (ms) => {
    const f = formatStopwatch(ms)
    return `${f.hr}:${f.min}:${f.sec}.${f.cs}`
  }

  if (isFullscreen) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-win-bg relative">
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-6 right-6 p-2 rounded hover:bg-white/10"
        >
          <Minimize2 size={18} className="text-win-text-muted" />
        </button>

        <div className="flex items-baseline gap-1 mb-8">
          <span className="text-8xl font-extralight text-white tabular">{t.hr}</span>
          <span className="text-8xl font-extralight text-win-text-muted">:</span>
          <span className="text-8xl font-extralight text-white tabular">{t.min}</span>
          <span className="text-8xl font-extralight text-win-text-muted">:</span>
          <span className="text-8xl font-extralight text-white tabular">{t.sec}</span>
          <span className="text-6xl font-extralight text-win-text-muted">.</span>
          <span className="text-6xl font-extralight text-white tabular">{t.cs}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="w-14 h-14 rounded-full bg-win-accent hover:bg-purple-500 flex items-center justify-center"
          >
            {isRunning ? <Pause size={22} fill="white" className="text-white" /> : <Play size={22} fill="white" className="text-white ml-0.5" />}
          </button>
          <button
            onClick={addLap}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <Flag size={20} className="text-white" />
          </button>
          <button
            onClick={reset}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <RotateCcw size={20} className="text-white" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-start pt-16 px-6 relative">
      <button
        onClick={() => setIsFullscreen(true)}
        className="absolute top-6 right-6 p-2 rounded hover:bg-white/10"
      >
        <Maximize2 size={18} className="text-win-text-muted" />
      </button>

      {/* Big display */}
      <div className="flex items-baseline gap-1 select-none">
        <div className="flex flex-col items-center">
          <span className="text-6xl md:text-7xl font-extralight text-white tabular">{t.hr}</span>
          <span className="text-xs text-win-text-muted mt-1">hr</span>
        </div>
        <span className="text-6xl md:text-7xl font-extralight text-win-text-muted -mt-5">:</span>
        <div className="flex flex-col items-center">
          <span className="text-6xl md:text-7xl font-extralight text-white tabular">{t.min}</span>
          <span className="text-xs text-win-text-muted mt-1">min</span>
        </div>
        <span className="text-6xl md:text-7xl font-extralight text-win-text-muted -mt-5">:</span>
        <div className="flex flex-col items-center">
          <span className="text-6xl md:text-7xl font-extralight text-white tabular">{t.sec}</span>
          <span className="text-xs text-win-text-muted mt-1">sec</span>
        </div>
        <span className="text-4xl md:text-5xl font-extralight text-win-text-muted -mt-3">.</span>
        <span className="text-4xl md:text-5xl font-extralight text-white tabular">{t.cs}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-10">
        <button
          onClick={toggle}
          className="w-12 h-12 rounded-full bg-win-accent hover:bg-purple-500 flex items-center justify-center transition-colors"
        >
          {isRunning ? <Pause size={18} fill="white" className="text-white" /> : <Play size={18} fill="white" className="text-white ml-0.5" />}
        </button>
        <button
          onClick={addLap}
          disabled={!isRunning && elapsed === 0}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Flag size={18} className="text-white" />
        </button>
        <button
          onClick={reset}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <RotateCcw size={18} className="text-white" />
        </button>
      </div>

      {/* Laps list */}
      {laps.length > 0 && (
        <div className="mt-10 w-full max-w-md">
          <div className="flex justify-between text-xs text-win-text-muted mb-2 px-3">
            <span>Lap</span>
            <span>Time</span>
          </div>
          <div className="space-y-1 max-h-[40vh] overflow-y-auto">
            {laps.map((lap) => (
              <div
                key={lap.id}
                className="flex justify-between px-3 py-2 rounded bg-white/5 text-sm text-white tabular"
              >
                <span>Lap {lap.id}</span>
                <span>{lapTime(lap.diff)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}