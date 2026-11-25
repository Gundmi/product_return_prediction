import { useState } from 'react'
import { simulateReturn } from '../lib/api'; import type { OrderInput, SimulatePayload } from '../lib/api';
import RiskGauge from '../components/RiskGauge'
import LoadingSpinner from '../components/LoadingSpinner'
import { ArrowRight, Play } from 'lucide-react'

const defaultBase: OrderInput = {
  customer_age: 30,
  product_price: 150,
  discount_percent: 15,
  product_rating: 3.5,
  past_purchase_count: 2,
  past_return_rate: 0.2,
  delivery_delay_days: 2,
  session_length_minutes: 10,
  num_product_views: 4,
  device_type: 'Desktop Web',
  product_category: 'Apparel',
  shipping_method: 'Standard',
  payment_method: 'Credit Card',
  used_coupon: 0,
}

const inputCls = "w-full bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
const selectCls = inputCls

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-xs font-medium">{label}</label>
      {children}
    </div>
  )
}

export default function Simulate() {
  const [base, setBase] = useState<OrderInput>(defaultBase)
  const [sim, setSim] = useState({ simulated_discount_percent: 15, simulated_delivery_delay_days: 2, simulated_product_rating: 3.5, simulated_shipping_method: 'Standard' })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setB = (k: keyof OrderInput, v: any) => setBase(f => ({ ...f, [k]: v }))
  const setS = (k: string, v: any) => setSim(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const requestPayload: SimulatePayload = {
        base_order: base,
        simulated_discount_percent: sim.simulated_discount_percent,
        simulated_delivery_delay_days: sim.simulated_delivery_delay_days,
        simulated_product_rating: sim.simulated_product_rating,
        simulated_shipping_method: sim.simulated_shipping_method,
      }
      const res = await simulateReturn(requestPayload)
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  // API returns: original_probability, simulated_probability, probability_delta, risk_direction, estimated_cost_avoidance_usd, recommendation
  const baseP = result?.original_probability ?? null
  const simP = result?.simulated_probability ?? null
  const direction = result?.risk_direction ?? null
  const delta = result?.probability_delta ?? null

  const directionStyle: Record<string, { cls: string; label: string }> = {
    REDUCED: { cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: '▼ RISK REDUCED' },
    INCREASED: { cls: 'bg-red-500/20 text-red-300 border-red-500/30', label: '▲ RISK INCREASED' },
    UNCHANGED: { cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30', label: '= UNCHANGED' },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Baseline */}
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">📦 Baseline Order</h3>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Customer Age"><input type="number" min={18} max={100} className={inputCls} value={base.customer_age} onChange={e => setB('customer_age', +e.target.value)} /></Row>
            <Row label="Product Price ($)"><input type="number" min={1} className={inputCls} value={base.product_price} onChange={e => setB('product_price', +e.target.value)} /></Row>
            <Row label={`Discount: ${base.discount_percent}%`}>
              <input type="range" min={0} max={90} className="w-full accent-indigo-500" value={base.discount_percent} onChange={e => setB('discount_percent', +e.target.value)} />
            </Row>
            <Row label={`Rating: ${base.product_rating}★`}>
              <input type="range" min={1} max={5} step={0.1} className="w-full accent-amber-400" value={base.product_rating} onChange={e => setB('product_rating', +e.target.value)} />
            </Row>
            <Row label="Past Purchases"><input type="number" min={0} className={inputCls} value={base.past_purchase_count} onChange={e => setB('past_purchase_count', +e.target.value)} /></Row>
            <Row label={`Past Return Rate: ${(base.past_return_rate * 100).toFixed(0)}%`}>
              <input type="range" min={0} max={1} step={0.01} className="w-full accent-red-400" value={base.past_return_rate} onChange={e => setB('past_return_rate', +e.target.value)} />
            </Row>
            <Row label="Delivery Delay (days)"><input type="number" min={-2} max={30} className={inputCls} value={base.delivery_delay_days} onChange={e => setB('delivery_delay_days', +e.target.value)} /></Row>
            <Row label="Session (min)"><input type="number" min={0} className={inputCls} value={base.session_length_minutes} onChange={e => setB('session_length_minutes', +e.target.value)} /></Row>
            <Row label="Product Views"><input type="number" min={0} className={inputCls} value={base.num_product_views} onChange={e => setB('num_product_views', +e.target.value)} /></Row>
            <Row label="Device">
              <select className={selectCls} value={base.device_type} onChange={e => setB('device_type', e.target.value)}>
                {['Mobile App', 'Desktop Web', 'Mobile Web', 'Tablet'].map(d => <option key={d}>{d}</option>)}
              </select>
            </Row>
            <Row label="Category">
              <select className={selectCls} value={base.product_category} onChange={e => setB('product_category', e.target.value)}>
                {['Apparel', 'Footwear', 'Electronics', 'Home & Kitchen', 'Beauty & Health', 'Sports & Outdoors'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Row>
            <Row label="Shipping">
              <select className={selectCls} value={base.shipping_method} onChange={e => setB('shipping_method', e.target.value)}>
                {['Standard', 'Express', 'Next-Day', 'Free Economy'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Row>
            <Row label="Payment">
              <select className={selectCls} value={base.payment_method} onChange={e => setB('payment_method', e.target.value)}>
                {['Credit Card', 'Debit Card', 'UPI / Digital Wallet', 'Cash on Delivery'].map(p => <option key={p}>{p}</option>)}
              </select>
            </Row>
            <Row label="Used Coupon">
              <div className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors ${base.used_coupon ? 'bg-indigo-500' : 'bg-slate-600'}`} onClick={() => setB('used_coupon', base.used_coupon ? 0 : 1)}>
                <span className={`inline-block h-4 w-4 m-1 rounded-full bg-white shadow transition-transform ${base.used_coupon ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </Row>
          </div>
        </div>

        {/* Simulated */}
        <div className="bg-[#1e293b] border border-indigo-500/30 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">⚡ Simulated Changes</h3>
          <div className="space-y-4">
            <Row label={`Discount: ${sim.simulated_discount_percent}%`}>
              <input type="range" min={0} max={90} className="w-full accent-indigo-500" value={sim.simulated_discount_percent} onChange={e => setS('simulated_discount_percent', +e.target.value)} />
            </Row>
            <Row label={`Delivery Delay: ${sim.simulated_delivery_delay_days} days`}>
              <input type="range" min={-2} max={30} className="w-full accent-amber-400" value={sim.simulated_delivery_delay_days} onChange={e => setS('simulated_delivery_delay_days', +e.target.value)} />
            </Row>
            <Row label={`Product Rating: ${sim.simulated_product_rating}★`}>
              <input type="range" min={1} max={5} step={0.1} className="w-full accent-emerald-400" value={sim.simulated_product_rating} onChange={e => setS('simulated_product_rating', +e.target.value)} />
            </Row>
            <Row label="Shipping Method">
              <select className={selectCls} value={sim.simulated_shipping_method} onChange={e => setS('simulated_shipping_method', e.target.value)}>
                {['Standard', 'Express', 'Next-Day', 'Free Economy'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Row>
          </div>
          <div className="bg-[#0f172a]/50 rounded-lg p-3 text-xs text-slate-400 border border-slate-700/50">
            Adjust parameters above and click <strong className="text-white">Run Simulation</strong> to compare outcomes.
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
        {loading ? <LoadingSpinner size="sm" /> : <><Play size={18} /> Run Simulation</>}
      </button>

      {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-2 border border-red-500/20">{error}</p>}

      {result && baseP !== null && simP !== null && (
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 space-y-6">
          <h3 className="text-white font-semibold text-lg">Simulation Results</h3>
          <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-2">Baseline</p>
              <RiskGauge probability={baseP} size="md" />
            </div>
            <ArrowRight size={32} className="text-slate-500" />
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-2">Simulated</p>
              <RiskGauge probability={simP} size="md" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {direction && directionStyle[direction] && (
              <div className={`px-6 py-2 rounded-full border font-bold text-sm ${directionStyle[direction].cls}`}>
                {directionStyle[direction].label}
              </div>
            )}
            {delta !== null && (
              <div className="bg-[#0f172a] rounded-lg px-5 py-2 border border-slate-700/50">
                <span className="text-slate-400 text-sm">Delta: </span>
                <span className={`font-bold ${delta < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {result.estimated_cost_avoidance_usd != null && (
              <div className="bg-emerald-500/10 rounded-lg px-5 py-2 border border-emerald-500/20">
                <span className="text-slate-400 text-sm">Cost Avoidance: </span>
                <span className="font-bold text-emerald-400">${Number(result.estimated_cost_avoidance_usd).toFixed(2)}</span>
              </div>
            )}
          </div>
          {result.recommendation && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
              <p className="text-indigo-300 text-sm">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
