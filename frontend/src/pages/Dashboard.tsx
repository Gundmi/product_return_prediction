
import { useEffect, useState } from 'react'
import { getDashboardOverview, getAlerts } from '../lib/api'
import KpiCard from '../components/KpiCard'
import AlertCard from '../components/AlertCard'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import { ShoppingCart, RotateCcw, DollarSign, Leaf, TrendingDown } from 'lucide-react'

export default function Dashboard() {
  const [overview, setOverview] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getDashboardOverview(), getAlerts()])
      .then(([ovRes, alRes]) => {
        setOverview(ovRes.data)
        const alertData = alRes.data
        setAlerts(Array.isArray(alertData) ? alertData : alertData?.alerts ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" label="Loading dashboard..." /></div>
  if (error) return <div className="text-red-400 p-6 bg-red-500/10 rounded-xl border border-red-500/20">Error: {error}</div>

  const kpis = overview?.kpis || {}
  // API returns: { order_month, total_orders, returns, return_rate }
  const trendData = (overview?.monthly_trend || []).map((d: any) => ({
    month: d.order_month ?? d.month,
    orders: d.total_orders ?? d.orders,
    returns: d.returns,
  }))
  // API returns: { product_category, total_orders, returns, revenue, return_rate }
  const categoryData = (overview?.category_breakdown || []).map((d: any) => ({
    category: d.product_category ?? d.category,
    return_rate: (d.return_rate ?? 0) / 100, // API gives percent already (e.g. 27.3), normalize to 0-1
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          title="Total Orders"
          value={kpis.total_orders != null ? Number(kpis.total_orders).toLocaleString() : '—'}
          icon={<ShoppingCart size={20} />}
          color="indigo"
        />
        <KpiCard
          title="Return Rate"
          value={kpis.observed_return_rate != null ? `${kpis.observed_return_rate.toFixed(1)}%` : '—'}
          icon={<RotateCcw size={20} />}
          color="amber"
        />
        <KpiCard
          title="Revenue Affected"
          value={kpis.revenue_affected != null ? `$${Number(kpis.revenue_affected).toLocaleString()}` : '—'}
          icon={<DollarSign size={20} />}
          color="red"
        />
        <KpiCard
          title="Total Return Cost"
          value={kpis.total_return_cost != null ? `$${Number(kpis.total_return_cost).toLocaleString()}` : '—'}
          icon={<TrendingDown size={20} />}
          color="red"
        />
        <KpiCard
          title="CO₂ Footprint"
          value={kpis.total_co2_kg != null ? `${Number(kpis.total_co2_kg).toLocaleString()} kg` : '—'}
          icon={<Leaf size={20} />}
          color="emerald"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Monthly Trend — Orders vs Returns</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} dot={false} name="Orders" />
              <Line type="monotone" dataKey="returns" stroke="#ef4444" strokeWidth={2} dot={false} name="Returns" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Return Rate by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0, 0.4]} />
              <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: any) => [`${(Number(v) * 100).toFixed(1)}%`, 'Return Rate']}
              />
              <Bar dataKey="return_rate" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Business Alerts</h3>
        {alerts.length === 0 ? (
          <p className="text-slate-400 text-sm">No active alerts.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {alerts.map((a, i) => (
              <AlertCard key={i} {...a} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
