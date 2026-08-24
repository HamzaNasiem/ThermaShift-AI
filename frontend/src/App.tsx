import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Sites from './pages/Sites'
import Workers from './pages/Workers'
import ErrorBoundary from './components/ErrorBoundary'

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wide transition-all ${
        active
          ? 'bg-[#A27B5C] text-white shadow-md'
          : 'text-[#DCD7C9]/70 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  )
}

function Header() {
  return (
    <header className="bg-[#1E2628] text-[#DCD7C9] border-b border-[#3F4E4F]/70 shadow-xl">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#A27B5C] flex items-center justify-center text-white font-black text-base shadow-sm">
            ⚡
          </div>
          <div>
            <span className="font-black text-white text-base font-sans block leading-none">
              ThermaShift AI
            </span>
            <span className="text-[9px] font-mono text-[#A27B5C] tracking-widest uppercase font-bold mt-0.5 block">
              FortyGuard Heat Safety OS
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <NavLink to="/">Mission Control</NavLink>
          <NavLink to="/sites">Work Sites</NavLink>
          <NavLink to="/workers">Field Workers</NavLink>
        </nav>

        <div className="flex items-center gap-2 text-xs text-[#DCD7C9] font-mono font-bold bg-[#242D30] px-3 py-1.5 rounded-xl border border-[#3F4E4F] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          SYSTEM LIVE
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#1A2224] text-[#DCD7C9] flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6">
          <ErrorBoundary fallbackTitle="Application Error">
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

