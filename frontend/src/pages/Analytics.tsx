import { useEffect, useState } from 'react'
import { getAnalyticsReturns, getFinancialImpact, getSustainability, getCategoryAnalytics } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import KpiCard from '../components/KpiCard'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts'
import { DollarSign, TrendingDown, Clock, Leaf, Package } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899']
const tabs = ['Root Causes', 'Financial Impact', 'Sustainability', 'Category Returns']

export default function Analytics() {
  const [activeTab, setActiveTab] = useState(0)
  const [returnsData, setReturnsData] = useState<any>(null)
  const [financialData, setFinancialData] = useState<any>(null)
  const [sustainData, setSustainData] = useState<any>(null)
  const [categoryData, setCategoryData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAnalyticsReturns(), getFinancialImpact(), getSustainability(), getCategoryAnalytics()])
      .then(([r, f, s, c]) => {
        setReturnsData(r.data)
        setFinancialData(f.data)
        setSustainData(s.data)
        setCategoryData(c.data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" label="Loading analytics..." /></div>
  if (error) return <div className="text-red-400 p-6 bg-red-500/10 rounded-xl border border-red-500/20">Error: {error}</div>

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e293b] p-1 rounded-xl w-fit border border-slate-700/50">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 0 && <RootCauses data={returnsData} />}
      {activeTab === 1 && <FinancialImpact data={financialData} />}
      {activeTab === 2 && <Sustainability data={sustainData} />}
      {activeTab === 3 && <CategoryAnalytics data={categoryData} />}
    </div>
  )
}

function CategoryAnalytics({ data }: { data: any }) {
  const categories = data?.categories || []
  return (
    <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Return Rate by Category</h3>
      {categories.length === 0 ? (
        <p className="text-slate-400 text-sm">No category data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={categories} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
            <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`${(v * 100).toFixed(1)}%`, 'Return Rate']} />
            <Bar dataKey="return_rate" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function RootCauses({ data }: { data: any }) {
  const reasons = data?.return_reasons || data?.reasons || []
  const delayImpact = data?.delay_impact || []
  const discountBrackets = data?.discount_brackets || data?.discount_impact || []
  const paymentMethod = data?.payment_method_analysis || data?.by_payment || []
  const shippingMethod = data?.shipping_method_analysis || data?.by_shipping || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reasons.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Return Reasons</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={reasons} dataKey="count" nameKey="reason" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                  {reasons.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
                <Legend formatter={(v) => <span className="text-slate-300 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {delayImpact.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Return Rate vs Delivery Delay</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={delayImpact}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="delay_days" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`${(v*100).toFixed(1)}%`, 'Return Rate']} />
                <Line type="monotone" dataKey="return_rate" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {discountBrackets.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Return Rate by Discount</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={discountBrackets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bracket" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`${(v*100).toFixed(1)}%`]} />
                <Bar dataKey="return_rate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {paymentMethod.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Return Rate by Payment</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentMethod} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="method" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`${(v*100).toFixed(1)}%`]} />
                <Bar dataKey="return_rate" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {shippingMethod.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Return Rate by Shipping</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={shippingMethod} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="method" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`${(v*100).toFixed(1)}%`]} />
                <Bar dataKey="return_rate" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function FinancialImpact({ data }: { data: any }) {
  const kpis = data?.summary || data?.kpis || {}
  const byCategory = data?.by_category || []
  const byShipping = data?.by_shipping || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Logistics Cost" value={kpis.total_logistics_cost != null ? `$${Number(kpis.total_logistics_cost).toLocaleString()}` : '—'} icon={<DollarSign size={20} />} color="red" />
        <KpiCard title="Net Margin Loss" value={kpis.net_margin_loss != null ? `$${Number(kpis.net_margin_loss).toLocaleString()}` : '—'} icon={<TrendingDown size={20} />} color="amber" />
        <KpiCard title="Avg Cost / Return" value={kpis.avg_cost_per_return != null ? `$${Number(kpis.avg_cost_per_return).toFixed(2)}` : '—'} icon={<DollarSign size={20} />} color="indigo" />
        <KpiCard title="Avg Turnaround" value={kpis.avg_turnaround_days != null ? `${Number(kpis.avg_turnaround_days).toFixed(1)} days` : '—'} icon={<Clock size={20} />} color="sky" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {byCategory.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Cost by Category</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v.toLocaleString()}`} />
                <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Cost']} />
                <Bar dataKey="total_cost" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {byShipping.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Cost by Shipping Method</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byShipping} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v.toLocaleString()}`} />
                <YAxis type="category" dataKey="method" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Cost']} />
                <Bar dataKey="total_cost" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function Sustainability({ data }: { data: any }) {
  const kpis = data?.summary || data?.kpis || {}
  const byCategory = data?.by_category || []
  const treesEq = kpis.trees_equivalent || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="CO₂ Emissions" value={kpis.co2_kg != null ? `${Number(kpis.co2_kg).toLocaleString()} kg` : '—'} icon={<Leaf size={20} />} color="emerald" />
        <KpiCard title="Packaging Waste" value={kpis.packaging_waste_kg != null ? `${Number(kpis.packaging_waste_kg).toLocaleString()} kg` : '—'} icon={<Package size={20} />} color="amber" />
        <KpiCard title="Trees Equivalent" value={treesEq ? `${Number(treesEq).toLocaleString()} 🌳` : '—'} icon={<Leaf size={20} />} color="emerald" />
      </div>
      {treesEq > 0 && (
        <div className="bg-[#1e293b] border border-emerald-500/20 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3">Environmental Equivalent</h3>
          <p className="text-slate-300 text-sm">Return logistics this period emits as much CO₂ as <strong className="text-emerald-400">{Number(treesEq).toLocaleString()} mature trees</strong> absorb in a year.</p>
          <div className="mt-4 flex flex-wrap gap-1">
            {Array.from({ length: Math.min(treesEq, 50) }).map((_, i) => (
              <span key={i} className="text-lg">🌳</span>
            ))}
            {treesEq > 50 && <span className="text-slate-400 text-sm self-center"> + {treesEq - 50} more</span>}
          </div>
        </div>
      )}
      {byCategory.length > 0 && (
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">CO₂ by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v} kg`} />
              <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`${Number(v).toFixed(1)} kg`, 'CO₂']} />
              <Bar dataKey="co2_kg" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
