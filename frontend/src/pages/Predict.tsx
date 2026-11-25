import { useState } from 'react'
import { predictReturn, type OrderInput } from '../lib/api'
import RiskGauge from '../components/RiskGauge'
import LoadingSpinner from '../components/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Zap, Star } from 'lucide-react'

const defaultForm: OrderInput = {
  customer_age: 30,
  product_price: 99,
  discount_percent: 10,
  product_rating: 4,
  past_purchase_count: 3,
  past_return_rate: 0.1,
  delivery_delay_days: 0,
  session_length_minutes: 15,
  num_product_views: 5,
  device_type: 'Desktop Web',
  product_category: 'Apparel',
  shipping_method: 'Standard',
  payment_method: 'Credit Card',
  used_coupon: 0,
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
const selectCls = inputCls

export default function Predict() {
  const [form, setForm] = useState<OrderInput>(defaultForm)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof OrderInput, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await predictReturn(form)
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const factors = result?.risk_factors || result?.top_factors || []
  const recommendations = result?.recommendations || []
  const probability = result?.return_probability ?? result?.probability ?? null

  return (
    <div className="max-w-5xl space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 space-y-6">
          <h3 className="text-white font-semibold text-lg">Order Details</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormRow label="Customer Age">
              <input type="number" min={18} max={100} className={inputCls} value={form.customer_age}
                onChange={e => set('customer_age', +e.target.value)} />
            </FormRow>
            <FormRow label="Product Price ($)">
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                <input type="number" min={1} max={5000} className={inputCls + ' pl-7'} value={form.product_price}
                  onChange={e => set('product_price', +e.target.value)} />
              </div>
            </FormRow>
            <FormRow label={`Discount: ${form.discount_percent}%`}>
              <input type="range" min={0} max={90} step={1} className="w-full accent-indigo-500" value={form.discount_percent}
                onChange={e => set('discount_percent', +e.target.value)} />
            </FormRow>
            <FormRow label={`Product Rating: ${form.product_rating} ★`}>
              <input type="range" min={1} max={5} step={0.1} className="w-full accent-amber-400" value={form.product_rating}
                onChange={e => set('product_rating', +e.target.value)} />
            </FormRow>
            <FormRow label="Past Purchase Count">
              <input type="number" min={0} className={inputCls} value={form.past_purchase_count}
                onChange={e => set('past_purchase_count', +e.target.value)} />
            </FormRow>
            <FormRow label={`Past Return Rate: ${(form.past_return_rate * 100).toFixed(0)}%`}>
              <input type="range" min={0} max={1} step={0.01} className="w-full accent-red-400" value={form.past_return_rate}
                onChange={e => set('past_return_rate', +e.target.value)} />
            </FormRow>
            <FormRow label="Delivery Delay (days)">
              <input type="number" min={-2} max={30} className={inputCls} value={form.delivery_delay_days}
                onChange={e => set('delivery_delay_days', +e.target.value)} />
            </FormRow>
            <FormRow label="Session Length (min)">
              <input type="number" min={0} className={inputCls} value={form.session_length_minutes}
                onChange={e => set('session_length_minutes', +e.target.value)} />
            </FormRow>
            <FormRow label="Product Views">
              <input type="number" min={0} className={inputCls} value={form.num_product_views}
                onChange={e => set('num_product_views', +e.target.value)} />
            </FormRow>
            <FormRow label="Device Type">
              <select className={selectCls} value={form.device_type} onChange={e => set('device_type', e.target.value)}>
                {['Mobile App', 'Desktop Web', 'Mobile Web', 'Tablet'].map(d => <option key={d}>{d}</option>)}
              </select>
            </FormRow>
            <FormRow label="Product Category">
              <select className={selectCls} value={form.product_category} onChange={e => set('product_category', e.target.value)}>
                {['Apparel', 'Footwear', 'Electronics', 'Home & Kitchen', 'Beauty & Health', 'Sports & Outdoors'].map(c => <option key={c}>{c}</option>)}
              </select>
            </FormRow>
            <FormRow label="Shipping Method">
              <select className={selectCls} value={form.shipping_method} onChange={e => set('shipping_method', e.target.value)}>
                {['Standard', 'Express', 'Next-Day', 'Free Economy'].map(s => <option key={s}>{s}</option>)}
              </select>
            </FormRow>
            <FormRow label="Payment Method">
              <select className={selectCls} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                {['Credit Card', 'Debit Card', 'UPI / Digital Wallet', 'Cash on Delivery'].map(p => <option key={p}>{p}</option>)}
              </select>
            </FormRow>
            <FormRow label="Used Coupon">
              <div
                className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors ${form.used_coupon ? 'bg-indigo-500' : 'bg-slate-600'}`}
                onClick={() => set('used_coupon', form.used_coupon ? 0 : 1)}
              >
                <span className={`inline-block h-4 w-4 m-1 rounded-full bg-white shadow transition-transform ${form.used_coupon ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </FormRow>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
            {loading ? <LoadingSpinner size="sm" /> : <><Zap size={18} /> Analyze Return Risk</>}
          </button>

          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-2 border border-red-500/20">{error}</p>}
        </div>
      </form>

      {result && probability !== null && (
        <div className="space-y-4">
          {/* Gauge + Summary */}
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center">
            <RiskGauge probability={probability} size="lg" />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Return Probability</p>
                <p className="text-4xl font-bold text-white">{(probability * 100).toFixed(1)}%</p>
              </div>
              {result.estimated_cost != null && (
                <div>
                  <p className="text-slate-400 text-sm">Estimated Return Cost</p>
                  <p className="text-2xl font-semibold text-red-400">${Number(result.estimated_cost).toFixed(2)}</p>
                </div>
              )}
              {result.model_version && <p className="text-slate-500 text-xs">Model: {result.model_version}</p>}
            </div>
          </div>

          {/* Risk Factors */}
          {factors.length > 0 && (
            <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Star size={16} className="text-amber-400" /> Top Risk Factors</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, factors.length * 35)}>
                <BarChart data={factors} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [v.toFixed(4), 'Impact']} />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {factors.map((_: any, i: number) => (
                      <Cell key={i} fill={factors[i]?.importance >= 0 ? '#6366f1' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.map((rec: any, i: number) => {
                  const p = rec.priority || 'MEDIUM'
                  const colors: Record<string, string> = { HIGH: 'border-red-500/30 bg-red-500/5', MEDIUM: 'border-amber-500/30 bg-amber-500/5', LOW: 'border-emerald-500/30 bg-emerald-500/5' }
                  const badges: Record<string, string> = { HIGH: 'bg-red-500/20 text-red-300', MEDIUM: 'bg-amber-500/20 text-amber-300', LOW: 'bg-emerald-500/20 text-emerald-300' }
                  return (
                    <div key={i} className={`border rounded-lg p-4 ${colors[p] || colors.MEDIUM}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium text-sm">{rec.action_title || rec.action || rec.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badges[p] || badges.MEDIUM}`}>{p}</span>
                      </div>
                      {rec.description && <p className="text-slate-400 text-xs">{rec.description}</p>}
                      {rec.potential_return_reduction && rec.potential_return_reduction !== 'N/A' && <p className="text-slate-500 text-xs mt-1">Potential reduction: {rec.potential_return_reduction}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
