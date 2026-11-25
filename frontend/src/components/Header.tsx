import { useLocation } from 'react-router-dom'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Platform overview and key performance indicators' },
  '/predict': { title: 'Return Risk Predictor', subtitle: 'Analyze individual order return probability with AI' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep dive into return patterns, financial & sustainability impact' },
  '/simulate': { title: 'What-If Simulator', subtitle: 'Compare baseline vs simulated order outcomes' },
  '/model': { title: 'Model Intelligence', subtitle: 'Champion model metrics, benchmarks, and feature explanations' },
  '/powerbi': { title: 'Power BI Dashboard', subtitle: 'Export ML predictions and embed live Power BI reports' },
}

export default function Header() {
  const location = useLocation()
  const meta = pageMeta[location.pathname] || { title: 'ReturnSight AI', subtitle: '' }

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 px-6 py-4 sticky top-0 z-40">
      <div>
        <h1 className="text-white font-bold text-xl">{meta.title}</h1>
        <p className="text-slate-400 text-sm mt-0.5">{meta.subtitle}</p>
      </div>
    </header>
  )
}
