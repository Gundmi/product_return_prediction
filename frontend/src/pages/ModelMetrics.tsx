import { useEffect, useState } from 'react'
import { getModelMetrics, getModelExplanations } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts'
import { Trophy } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6']

export default function ModelMetrics() {
  const [metrics, setMetrics] = useState<any>(null)
  const [explanations, setExplanations] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getModelMetrics(), getModelExplanations()])
      .then(([m, e]) => {
        setMetrics(m.data)
        setExplanations(e.data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" label="Loading model metrics..." /></div>
  if (error) return <div className="text-red-400 p-6 bg-red-500/10 rounded-xl border border-red-500/20">Error: {error}</div>

  const champion = metrics?.champion || metrics?.best_model || {}
  const models = metrics?.models || metrics?.benchmarks || []
  const rocCurves = metrics?.roc_curves || []
  const featureImportance = (explanations?.feature_importance || explanations?.features || []).slice(0, 20)

  return (
    <div className="space-y-6">
      {/* Champion Model */}
      {Object.keys(champion).length > 0 && (
        <div className="bg-[#1e293b] border border-indigo-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={20} className="text-amber-400" />
            <h3 className="text-white font-semibold">Champion Model</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Model Name', value: champion.name || champion.model_name || '—' },
              { label: 'ROC-AUC', value: champion.roc_auc != null ? Number(champion.roc_auc).toFixed(4) : '—' },
              { label: 'F1 Score', value: champion.f1_score != null ? Number(champion.f1_score).toFixed(4) : '—' },
              { label: 'Threshold', value: champion.threshold != null ? Number(champion.threshold).toFixed(2) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0f172a] rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-400 text-xs">{label}</p>
                <p className="text-white font-semibold mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Importance */}
      {featureImportance.length > 0 && (
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Feature Importance (Top 20)</h3>
          <ResponsiveContainer width="100%" height={Math.max(300, featureImportance.length * 28)}>
            <BarChart data={featureImportance} layout="vertical" margin={{ left: 160 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 11 }} width={160} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [Number(v).toFixed(5), 'Importance']} />
              <Bar dataKey="importance" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Model Benchmark Table */}
      {models.length > 0 && (
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Model Benchmarks</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 pr-4 font-medium">Model</th>
                  <th className="text-right py-2 px-4 font-medium">ROC-AUC</th>
                  <th className="text-right py-2 px-4 font-medium">F1</th>
                  <th className="text-right py-2 px-4 font-medium">Precision</th>
                  <th className="text-right py-2 px-4 font-medium">Recall</th>
                  <th className="text-right py-2 px-4 font-medium">F1 (opt)</th>
                  <th className="text-right py-2 px-4 font-medium">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m: any, i: number) => (
                  <tr key={i} className={`border-b border-slate-700/40 hover:bg-slate-700/20 ${m.is_champion ? 'bg-indigo-500/5' : ''}`}>
                    <td className="py-2.5 pr-4 text-white font-medium flex items-center gap-2">
                      {m.is_champion && <Trophy size={14} className="text-amber-400" />}
                      {m.name || m.model_name}
                    </td>
                    <td className="text-right px-4 text-slate-300">{m.roc_auc != null ? Number(m.roc_auc).toFixed(4) : '—'}</td>
                    <td className="text-right px-4 text-slate-300">{m.f1_score != null ? Number(m.f1_score).toFixed(4) : '—'}</td>
                    <td className="text-right px-4 text-slate-300">{m.precision != null ? Number(m.precision).toFixed(4) : '—'}</td>
                    <td className="text-right px-4 text-slate-300">{m.recall != null ? Number(m.recall).toFixed(4) : '—'}</td>
                    <td className="text-right px-4 text-slate-300">{m.optimized_f1 != null ? Number(m.optimized_f1).toFixed(4) : '—'}</td>
                    <td className="text-right px-4 text-slate-300">{m.threshold != null ? Number(m.threshold).toFixed(3) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROC Curves */}
      {rocCurves.length > 0 && (
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">ROC Curves</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'FPR', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
              <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [Number(v).toFixed(3)]} />
              <Legend formatter={(v) => <span className="text-slate-300 text-xs">{v}</span>} />
              {rocCurves.map((curve: any, i: number) => (
                <Line
                  key={curve.model}
                  data={curve.points}
                  type="monotone"
                  dataKey="tpr"
                  stroke={COLORS[i % COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                  name={`${curve.model} (AUC=${curve.auc?.toFixed(3) || '?'})`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
