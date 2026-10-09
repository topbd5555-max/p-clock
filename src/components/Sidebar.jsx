import { NavLink } from 'react-router-dom'
import {
  Clock,
  Timer as TimerIcon,
  AlarmClock,
  Watch,
  Globe,
  Settings as SettingsIcon,
  User,
  Focus,
  Flower2,
  Flame,
  Moon,
  Users,
  CloudSun,
  CalendarDays,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { path: '/focus', label: 'Focus sessions', icon: Focus },
  { path: '/pomodoro', label: 'Pomodoro', icon: Flame },
  { path: '/interval', label: 'Interval Timer', icon: TimerIcon },
  { path: '/meditation', label: 'Meditation', icon: Flower2 },
  { path: '/timer', label: 'Timer', icon: Watch },
  { path: '/alarm', label: 'Alarm', icon: AlarmClock },
  { path: '/stopwatch', label: 'Stopwatch', icon: Clock },
  { path: '/sleep', label: 'Sleep Tracker', icon: Moon },
  { path: '/world-clock', label: 'World clock', icon: Globe },
  { path: '/meeting', label: 'Meeting Planner', icon: Users },
  { path: '/weather', label: 'Weather & Sun', icon: CloudSun },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/stats', label: 'Statistics', icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="relative z-20 w-64 h-full flex flex-col justify-between py-5 px-3 shrink-0 backdrop-blur-2xl bg-black/30 border-r border-white/5">
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
        <div className="flex items-center gap-3 px-4 py-4 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-ring shrink-0"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            }}
          >
            <Clock size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">P-Clock</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/25 via-purple-500/15 to-pink-500/20 text-white font-medium border border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]'
                    : 'text-white/55 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5 mt-3 shrink-0">
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-white/55 hover:text-white hover:bg-white/5 transition-all text-left border border-transparent">
          <User size={16} />
          <span>Sign in</span>
        </button>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-purple-500/25 via-purple-500/15 to-pink-500/20 text-white font-medium border border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]'
                : 'text-white/55 hover:text-white hover:bg-white/5 border border-transparent'
            }`
          }
        >
          <SettingsIcon size={16} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}