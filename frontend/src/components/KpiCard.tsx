import React from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'indigo' | 'emerald' | 'red' | 'amber' | 'sky'
  trend?: number
}

const colorMap = {
  indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', border: 'border-indigo-500/20' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  red: { bg: 'bg-red-500/10', icon: 'text-red-400', border: 'border-red-500/20' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
  sky: { bg: 'bg-sky-500/10', icon: 'text-sky-400', border: 'border-sky-500/20' },
}

export default function KpiCard({ title, value, subtitle, icon, color = 'indigo', trend }: KpiCardProps) {
  const c = colorMap[color]
  return (
    <div className={`bg-[#1e293b] border ${c.border} rounded-xl p-5 hover:border-indigo-500/40 transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs last month
            </p>
          )}
        </div>
        <div className={`${c.bg} ${c.icon} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
