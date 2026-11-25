const severityMap: Record<string, { border: string; badge: string; dot: string }> = {
  CRITICAL: { border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300', dot: 'bg-red-500' },
  HIGH: { border: 'border-orange-500/40', badge: 'bg-orange-500/20 text-orange-300', dot: 'bg-orange-500' },
  MEDIUM: { border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
  INFO: { border: 'border-sky-500/40', badge: 'bg-sky-500/20 text-sky-300', dot: 'bg-sky-400' },
}

interface Alert {
  severity: string
  title: string
  message: string
  timestamp?: string
  metric?: string
  value?: string | number
}

export default function AlertCard({ severity, title, message, timestamp, metric, value }: Alert) {
  const s = severityMap[severity] || severityMap['INFO']
  return (
    <div className={`bg-[#1e293b] border ${s.border} rounded-lg p-4 flex gap-3`}>
      <div className={`w-2 h-2 rounded-full ${s.dot} mt-1.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-white font-medium text-sm">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>{severity}</span>
        </div>
        <p className="text-slate-400 text-xs mt-1">{message}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          {metric && <span>{metric}: <strong className="text-slate-300">{value}</strong></span>}
          {timestamp && <span>{new Date(timestamp).toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )
}
