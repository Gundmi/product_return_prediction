interface RiskGaugeProps {
  probability: number
  size?: 'sm' | 'md' | 'lg'
}

export default function RiskGauge({ probability, size = 'md' }: RiskGaugeProps) {
  const pct = Math.max(0, Math.min(1, probability))
  const angle = pct * 180 - 90 // -90 to 90 degrees

  const color = pct < 0.25 ? '#10b981' : pct < 0.45 ? '#f59e0b' : '#ef4444'
  const label = pct < 0.25 ? 'Low Risk' : pct < 0.45 ? 'Medium Risk' : 'High Risk'
  const labelColor = pct < 0.25 ? 'text-emerald-400' : pct < 0.45 ? 'text-amber-400' : 'text-red-400'
  const badgeBg = pct < 0.25 ? 'bg-emerald-500/20 border-emerald-500/30' : pct < 0.45 ? 'bg-amber-500/20 border-amber-500/30' : 'bg-red-500/20 border-red-500/30'

  const dim = { sm: 120, md: 180, lg: 220 }[size]
  const cx = dim / 2
  const cy = dim * 0.6
  const r = dim * 0.38
  const strokeW = size === 'lg' ? 14 : size === 'md' ? 12 : 8

  // Semi-circle arc
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const startX = cx + r * Math.cos(toRad(180))
  const startY = cy + r * Math.sin(toRad(180))
  const endX = cx + r * Math.cos(toRad(0))
  const endY = cy + r * Math.sin(toRad(0))

  const needleX = cx + (r - strokeW / 2) * Math.cos(toRad(angle + 180))
  const needleY = cy + (r - strokeW / 2) * Math.sin(toRad(angle + 180))

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim * 0.65 }}>
        <svg width={dim} height={dim * 0.65} viewBox={`0 0 ${dim} ${dim * 0.65}`}>
          {/* background arc */}
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          {/* colored fill arc */}
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${pct * Math.PI * r} ${Math.PI * r}`}
            opacity={0.85}
          />
          {/* needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill={color} />
          {/* percentage text */}
          <text x={cx} y={cy - 18} textAnchor="middle" fill="white" fontSize={size === 'lg' ? 28 : 20} fontWeight="bold">
            {(pct * 100).toFixed(1)}%
          </text>
        </svg>
      </div>
      <div className={`px-4 py-1.5 rounded-full border font-semibold text-sm ${labelColor} ${badgeBg}`}>
        {label}
      </div>
    </div>
  )
}
