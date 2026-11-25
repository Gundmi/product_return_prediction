import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import Analytics from './pages/Analytics'
import Simulate from './pages/Simulate'
import ModelMetrics from './pages/ModelMetrics'
import PowerBI from './pages/PowerBI'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#0f172a]">
        <Sidebar />
        <div className="flex-1 ml-56 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/predict" element={<Predict />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/simulate" element={<Simulate />} />
              <Route path="/model" element={<ModelMetrics />} />
              <Route path="/powerbi" element={<PowerBI />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
