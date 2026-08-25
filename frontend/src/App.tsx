import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Sites from './pages/Sites'
import Workers from './pages/Workers'
import ErrorBoundary from './components/ErrorBoundary'

import ThermaShiftLogo from './components/ThermaShiftLogo'

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-slate-800 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
      }`}
    >
      {children}
    </Link>
  )
}

function Header() {
  return (
    <header className="bg-[#0E1317] border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Custom Brand Logo */}
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <ThermaShiftLogo size="md" />
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#141B20] p-1 rounded-xl border border-slate-800/70">
          <NavLink to="/">Mission Control</NavLink>
          <NavLink to="/sites">Work Sites</NavLink>
          <NavLink to="/workers">Field Workforce</NavLink>
        </nav>

        {/* Live System Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium bg-[#141B20] px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-300">Live Heat Guardian</span>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0B0F12] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
        <Header />
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-5">
          <ErrorBoundary fallbackTitle="System Component Error">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/workers" element={<Workers />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </BrowserRouter>
  )
}
