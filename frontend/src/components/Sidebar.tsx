import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Zap, BarChart3, FlaskConical, Brain, Activity, BarChart2 } from 'lucide-react'

const nav = [
  { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/predict', icon: <Zap size={18} />, label: 'Predict' },
  { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { to: '/simulate', icon: <FlaskConical size={18} />, label: 'Simulate' },
  { to: '/model', icon: <Brain size={18} />, label: 'Model' },
  { to: '/powerbi', icon: <BarChart2 size={18} />, label: 'Power BI' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#0f172a] border-r border-slate-800 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">ReturnSight</p>
            <p className="text-indigo-400 text-xs font-medium">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            {/* Highlight Power BI icon in brand yellow */}
            <span className={label === 'Power BI' ? 'text-[#F2C811]' : ''}>
              {icon}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-slate-400 text-xs">API Connected</span>
        </div>
        <p className="text-slate-600 text-xs mt-1">v2.0.0 · Enterprise</p>
      </div>
    </aside>
  )
}
