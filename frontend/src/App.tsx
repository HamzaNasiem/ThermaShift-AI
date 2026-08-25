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
          ? 'bg-[#141414] text-white shadow-sm'
          : 'text-slate-600 hover:text-[#141414] hover:bg-slate-200/60'
      }`}
    >
      {children}
    </Link>
  )
}

function Header() {
  return (
    <header className="bg-[#ffffff] border-b border-[#e5e5e5] sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-95">
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Custom Brand Logo */}
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <ThermaShiftLogo size="md" />
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#f4f4f4] p-1 rounded-xl border border-[#e5e5e5]">
          <NavLink to="/">Mission Control</NavLink>
          <NavLink to="/sites">Work Sites</NavLink>
          <NavLink to="/workers">Field Workforce</NavLink>
        </nav>

        {/* Live System Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-700 font-medium bg-[#f4f4f4] px-3 py-1.5 rounded-xl border border-[#e5e5e5]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-slate-800 font-semibold">Live Heat Guardian</span>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f4f4f4] text-[#141414] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
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
