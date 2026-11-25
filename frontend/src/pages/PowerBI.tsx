import { useEffect, useState } from 'react'
import {
  BarChart2, RefreshCw, ExternalLink, Database, FileText, CheckCircle,
  AlertTriangle, Info, PlusCircle, Search, ShoppingBag
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────
interface PBISummary {
  total_predictions: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  avg_probability: number
  revenue_at_risk: number
  export_ready: boolean
  row_count: number
}

interface PredictedOrderRow {
  order_id: string
  customer_age: number | null
  product_price: number | null
  discount_percent: number | null
  product_rating: number | null
  product_category: string | null
  shipping_method: string | null
  payment_method: string | null
  delivery_delay_days: number | null
  predicted_probability: number
  risk_category: string
  top_factor_1: string | null
  top_factor_2: string | null
  recommended_decision: string
  predicted_at: string | null
}

interface PBIDashboardData {
  summary: PBISummary
  risk_distribution: { name: string; value: number }[]
  by_category: { category: string; order_count: number; high_risk_count: number; avg_probability: number; revenue_at_risk: number }[]
  by_shipping: { method: string; order_count: number; avg_probability: number }[]
  predictions: PredictedOrderRow[]
}

const RISK_COLORS: Record<string, string> = {
  'High Risk': '#ef4444',
  'Medium Risk': '#f59e0b',
  'Low Risk': '#10b981',
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    red: 'border-red-500/30 bg-red-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    indigo: 'border-indigo-500/30 bg-indigo-500/5',
    sky: 'border-sky-500/30 bg-sky-500/5',
    yellow: 'border-[#F2C811]/40 bg-[#F2C811]/5',
  }
  const textColors: Record<string, string> = {
    red: 'text-red-400', amber: 'text-amber-400', emerald: 'text-emerald-400',
    indigo: 'text-indigo-400', sky: 'text-sky-400', yellow: 'text-[#F2C811]',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.indigo}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColors[color] || textColors.indigo}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ─── Receive Live Order Panel ─────────────────────────────────────────────────
function ReceiveOrderModal({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    order_id: `ORD-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
    product_category: 'Apparel',
    product_price: 120,
    discount_percent: 25,
    product_rating: 3.4,
    delivery_delay_days: 3,
    shipping_method: 'Standard',
    payment_method: 'Cash on Delivery',
    past_return_rate: 0.35,
    customer_age: 29,
    past_purchase_count: 2,
    session_length_minutes: 8,
    num_product_views: 5,
    device_type: 'Mobile App',
    used_coupon: 1,
  })
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const inputCls = 'w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F2C811]'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErr(null)
    try {
      const res = await fetch('/api/orders/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to receive & predict order')
      onCreated()
      onClose()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-[#1e293b] border border-[#F2C811]/40 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#F2C811]" />
          <h3 className="text-white font-semibold text-sm">Simulate Incoming E-Commerce Order</h3>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xs">Cancel</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-slate-400 text-xs">Order ID</label>
          <input className={inputCls} value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })} />
        </div>
        <div>
          <label className="text-slate-400 text-xs">Category</label>
          <select className={inputCls} value={form.product_category} onChange={e => setForm({ ...form, product_category: e.target.value })}>
            {['Apparel', 'Footwear', 'Electronics', 'Home & Kitchen', 'Beauty & Health', 'Sports & Outdoors'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs">Price ($)</label>
          <input type="number" min={1} className={inputCls} value={form.product_price} onChange={e => setForm({ ...form, product_price: +e.target.value })} />
        </div>
        <div>
          <label className="text-slate-400 text-xs">Discount (%)</label>
          <input type="number" min={0} max={90} className={inputCls} value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: +e.target.value })} />
        </div>
        <div>
          <label className="text-slate-400 text-xs">Shipping Method</label>
          <select className={inputCls} value={form.shipping_method} onChange={e => setForm({ ...form, shipping_method: e.target.value })}>
            {['Standard', 'Express', 'Next-Day', 'Free Economy'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs">Payment Method</label>
          <select className={inputCls} value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
            {['Credit Card', 'Debit Card', 'UPI / Digital Wallet', 'Cash on Delivery'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs">Delivery Delay (days)</label>
          <input type="number" min={-2} max={30} className={inputCls} value={form.delivery_delay_days} onChange={e => setForm({ ...form, delivery_delay_days: +e.target.value })} />
        </div>
        <div>
          <label className="text-slate-400 text-xs">Past Return Rate (0–1)</label>
          <input type="number" min={0} max={1} step={0.05} className={inputCls} value={form.past_return_rate} onChange={e => setForm({ ...form, past_return_rate: +e.target.value })} />
        </div>
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#F2C811] text-[#1e293b] font-semibold rounded-lg text-xs hover:bg-yellow-300 disabled:opacity-50">
          {submitting ? 'Predicting...' : 'Receive & Predict Order'}
        </button>
      </div>
    </form>
  )
}

// ─── Embed Panel ─────────────────────────────────────────────────────────────
function EmbedPanel() {
  const [embedUrl, setEmbedUrl] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#F2C811] rounded-lg flex items-center justify-center">
          <BarChart2 size={16} className="text-[#1e293b]" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Embed External Power BI Service Report (Optional)</h3>
          <p className="text-slate-400 text-xs">Paste a Power BI publish-to-web or embed URL to display your external Power BI workspace report inline</p>
        </div>
      </div>

      {!submitted ? (
        <div className="space-y-3">
          <input
            type="url"
            placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
            className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            value={embedUrl}
            onChange={e => setEmbedUrl(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              disabled={!embedUrl}
              onClick={() => setSubmitted(true)}
              className="px-5 py-2 bg-[#F2C811] text-[#1e293b] font-semibold rounded-lg text-sm disabled:opacity-40 hover:bg-yellow-300 transition-colors"
            >
              Load Report
            </button>
            <a
              href="https://app.powerbi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <ExternalLink size={14} /> Open Power BI
            </a>
          </div>
          <div className="bg-[#0f172a] rounded-lg p-3 border border-slate-700/50 text-xs text-slate-400 space-y-1">
            <p className="flex items-center gap-1.5"><Info size={12} className="text-indigo-400 shrink-0" /> In Power BI Desktop: <strong className="text-white">File → Publish to web</strong> → Copy the embed URL</p>
            <p className="flex items-center gap-1.5"><Info size={12} className="text-indigo-400 shrink-0" /> Or connect directly via <strong className="text-white">Get Data → Web</strong> using <code className="text-indigo-300">http://127.0.0.1:5000/api/powerbi/export?format=json</code></p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle size={14} /> Report loaded</span>
            <button onClick={() => setSubmitted(false)} className="text-slate-400 hover:text-white text-xs underline">Change URL</button>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-700">
            <iframe
              src={embedUrl}
              width="100%"
              height="540"
              frameBorder="0"
              allowFullScreen
              title="Power BI Dashboard"
              className="block"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Export Panel ─────────────────────────────────────────────────────────────
function ExportPanel({ summary }: { summary: PBISummary | null }) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const download = async (format: 'csv' | 'json' | 'excel') => {
    setDownloading(format)
    setDone(null)
    try {
      const res = await fetch(`/api/powerbi/export?format=${format}`)
      const blob = await res.blob()
      const ext = format === 'excel' ? 'xlsx' : format
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `returnsight_predictions_${new Date().toISOString().slice(0, 10)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      setDone(format)
    } catch {
      setDone(null)
    } finally {
      setDownloading(null)
    }
  }

  const formats = [
    {
      key: 'csv' as const,
      icon: <FileText size={20} />,
      label: 'CSV for Power BI',
      desc: 'Direct import via Get Data → Text/CSV',
      color: 'emerald',
    },
    {
      key: 'json' as const,
      icon: <Database size={20} />,
      label: 'JSON / REST Feed',
      desc: 'Use Power BI Web connector to fetch live data',
      color: 'sky',
    },
    {
      key: 'excel' as const,
      icon: <FileText size={20} />,
      label: 'Excel Workbook',
      desc: 'Direct import via Get Data → Excel',
      color: 'amber',
    },
  ]

  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
    sky: 'border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10',
    amber: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
  }
  const iconColor: Record<string, string> = {
    emerald: 'text-emerald-400', sky: 'text-sky-400', amber: 'text-amber-400',
  }

  return (
    <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-white font-semibold">Export Prediction Data to Power BI</h3>
        <p className="text-slate-400 text-xs mt-0.5">
          Download all ML prediction records for import into Power BI Desktop or Service
          {summary && <span className="ml-1 text-indigo-400">· {summary.row_count.toLocaleString()} rows ready</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {formats.map(f => (
          <button
            key={f.key}
            onClick={() => download(f.key)}
            disabled={!!downloading}
            className={`text-left p-4 rounded-xl border transition-all ${colorMap[f.color]} disabled:opacity-50`}
          >
            <div className={`mb-2 ${iconColor[f.color]}`}>{f.icon}</div>
            <p className="text-white text-sm font-medium">{f.label}</p>
            <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
            {downloading === f.key && <p className="text-indigo-400 text-xs mt-2 flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Preparing...</p>}
            {done === f.key && <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1"><CheckCircle size={10} /> Downloaded!</p>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PowerBI() {
  const [data, setData] = useState<PBIDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [riskFilter, setRiskFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/powerbi/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  const syncOrders = async () => {
    setSyncing(true)
    try {
      await fetch('/api/orders/sync?limit=50', { method: 'POST' })
      load()
    } finally {
      setSyncing(false)
    }
  }

  useEffect(load, [])

  const summary = data?.summary ?? null
  const predictions = data?.predictions ?? []
  const filtered = predictions.filter(p => {
    if (riskFilter !== 'ALL' && p.risk_category !== riskFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.order_id.toLowerCase().includes(q) ||
        (p.product_category || '').toLowerCase().includes(q) ||
        (p.top_factor_1 || '').toLowerCase().includes(q) ||
        (p.recommended_decision || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const riskBadge = (risk: string) => {
    if (risk === 'High Risk') return 'bg-red-500/20 text-red-300 border-red-500/30'
    if (risk === 'Medium Risk') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#F2C811] rounded-xl flex items-center justify-center shadow-lg">
            <BarChart2 size={18} className="text-[#1e293b]" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Power BI — Predicted E-Commerce Orders & Decisions</h2>
            <p className="text-slate-400 text-xs">Every order received from the e-commerce platform is automatically scored for return risk and decisioning</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowReceiveModal(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F2C811] hover:bg-yellow-300 text-[#1e293b] font-semibold rounded-lg text-sm transition-colors"
          >
            <PlusCircle size={15} />
            Receive Live Order
          </button>
          <button
            onClick={syncOrders}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
          >
            <ShoppingBag size={15} />
            {syncing ? 'Scoring Orders...' : 'Sync Platform Orders'}
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {showReceiveModal && (
        <ReceiveOrderModal onCreated={load} onClose={() => setShowReceiveModal(false)} />
      )}

      {/* KPI strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Orders Predicted" value={summary.total_predictions.toLocaleString()} color="indigo" sub="Scored e-com orders" />
          <StatCard label="High Risk Orders" value={summary.high_risk_count.toLocaleString()} color="red" sub="Hold / Action needed" />
          <StatCard label="Medium Risk" value={summary.medium_risk_count.toLocaleString()} color="amber" sub="Monitor closely" />
          <StatCard label="Low Risk" value={summary.low_risk_count.toLocaleString()} color="emerald" sub="Auto-approve" />
          <StatCard label="Avg Return Prob" value={`${(summary.avg_probability * 100).toFixed(1)}%`} color="sky" sub="Model prediction" />
          <StatCard label="Revenue at Risk" value={`$${summary.revenue_at_risk.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="yellow" sub="Expected return exposure" />
        </div>
      )}

      {!summary && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-300 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> Could not load Power BI dashboard data. Click "Sync Platform Orders" or ensure the backend is running.
        </div>
      )}

      {/* Power BI Visuals Row */}
      {data && data.summary.total_predictions > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Risk Distribution Donut */}
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Predicted Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={data.risk_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={80}>
                  {data.risk_distribution.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8 }} />
                <Legend formatter={(v) => <span className="text-slate-300 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Predicted Return Risk by Category */}
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Predicted Return Risk by Category</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.by_category} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`${(v * 100).toFixed(1)}%`, 'Avg Risk']} />
                <Bar dataKey="avg_probability" fill="#F2C811" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Predicted Return Risk by Shipping */}
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Predicted Risk by Shipping Method</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.by_shipping}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="method" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`${(v * 100).toFixed(1)}%`, 'Avg Risk']} />
                <Bar dataKey="avg_probability" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Predicted Orders & Fulfillment Decisions Table */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-white font-semibold">Predicted E-Commerce Orders & Decisioning</h3>
            <p className="text-slate-400 text-xs">Showing {filtered.length} of {predictions.length} predicted orders</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search order, category, driver..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#0f172a] border border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F2C811]"
              />
            </div>
            {['ALL', 'High Risk', 'Medium Risk', 'Low Risk'].map(tier => (
              <button
                key={tier}
                onClick={() => setRiskFilter(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  riskFilter === tier
                    ? 'bg-[#F2C811] text-[#1e293b] font-semibold'
                    : 'bg-[#0f172a] text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {tier === 'ALL' ? 'All Tiers' : tier}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No predicted orders match your filter. Click <strong className="text-white">Sync Platform Orders</strong> or <strong className="text-[#F2C811]">Receive Live Order</strong> above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2.5 pr-3 font-medium">Order ID</th>
                  <th className="text-left py-2.5 px-3 font-medium">Category</th>
                  <th className="text-right py-2.5 px-3 font-medium">Price</th>
                  <th className="text-left py-2.5 px-3 font-medium">Shipping</th>
                  <th className="text-left py-2.5 px-3 font-medium">Payment</th>
                  <th className="text-right py-2.5 px-3 font-medium">Delay</th>
                  <th className="text-right py-2.5 px-3 font-medium">Return Prob</th>
                  <th className="text-center py-2.5 px-3 font-medium">Risk Tier</th>
                  <th className="text-left py-2.5 px-3 font-medium">Top Risk Driver</th>
                  <th className="text-left py-2.5 pl-3 font-medium">Recommended Decision</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((row) => (
                  <tr key={`${row.order_id}-${row.predicted_at}`} className="border-b border-slate-700/40 hover:bg-slate-700/20">
                    <td className="py-2.5 pr-3 font-mono text-indigo-300 whitespace-nowrap">{row.order_id}</td>
                    <td className="py-2.5 px-3 text-slate-200 whitespace-nowrap">{row.product_category || '—'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{row.product_price != null ? `$${row.product_price.toFixed(2)}` : '—'}</td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{row.shipping_method || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{row.payment_method || '—'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{row.delivery_delay_days != null ? `${row.delivery_delay_days}d` : '—'}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-white">{(row.predicted_probability * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${riskBadge(row.risk_category)}`}>
                        {row.risk_category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{row.top_factor_1 || '—'}</td>
                    <td className="py-2.5 pl-3 text-slate-200 font-medium">{row.recommended_decision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export + External Embed */}
      <ExportPanel summary={summary} />
      <EmbedPanel />
    </div>
  )
}
