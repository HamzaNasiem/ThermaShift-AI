import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSites, getFortyGuardUsage, triggerCheck, getMicroclimateAnalysis } from '../lib/api'
import { useLiveHeat } from '../hooks/useLiveHeat'
import HeatMap from '../components/HeatMap'
import WorkerCard from '../components/WorkerCard'
import AutonomousGuardianFeed from '../components/AutonomousGuardianFeed'
import SafetyProtocolCard from '../components/SafetyProtocolCard'
import MicroclimateTelemetryCard from '../components/MicroclimateTelemetryCard'
import CalleLiveModal from '../components/CalleLiveModal'
import DirectCallModal from '../components/DirectCallModal'
import RegisterSiteModal from '../components/RegisterSiteModal'
import FortyGuardTelemetryModal from '../components/FortyGuardTelemetryModal'
import type { Site, RiskLevel, MicroclimateAnalysis } from '../types'

export default function Dashboard() {
  const [searchParams] = useSearchParams()
  const urlSiteId = searchParams.get('site_id')

  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>(urlSiteId || '')
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [microclimate, setMicroclimate] = useState<MicroclimateAnalysis | null>(null)
  const [microLoading, setMicroLoading] = useState(false)

  // Autonomous Guardian State
  const [isSimulatingEmergency, setIsSimulatingEmergency] = useState(false)
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null)
  const [usageData, setUsageData] = useState<any>(null)

  // Modals
  const [activeCalleCallId, setActiveCalleCallId] = useState<string | null>(null)
  const [showDirectCallModal, setShowDirectCallModal] = useState(false)
  const [showRegisterSiteModal, setShowRegisterSiteModal] = useState(false)
  const [showTelemetryModal, setShowTelemetryModal] = useState(false)

  function loadSites() {
    getSites().then((data) => {
      setSites(data)
      if (data.length > 0) {
        if (urlSiteId && data.some((s) => s.id === urlSiteId)) {
          setSelectedSiteId(urlSiteId)
        } else if (!selectedSiteId) {
          setSelectedSiteId(data[0].id)
        }
      }
    }).catch(console.error)
  }

  useEffect(() => {
    loadSites()
    getFortyGuardUsage().then(setUsageData).catch(console.error)
  }, [])

  useEffect(() => {
    setSelectedSite(sites.find((s) => s.id === selectedSiteId) ?? null)
    if (selectedSiteId) {
      setMicroLoading(true)
      getMicroclimateAnalysis(selectedSiteId)
        .then(setMicroclimate)
        .catch(console.error)
        .finally(() => setMicroLoading(false))
    }
  }, [selectedSiteId, sites])

  const { snapshot, alerts, workers, loading } = useLiveHeat(selectedSiteId)

  // Use real snapshot data only — never show fake temperature numbers
  const currentTempF: number | null = snapshot ? Math.round(snapshot.temperature_f * 10) / 10 : (microclimate ? microclimate.ambient_temp_f : null)
  const riskLevel: RiskLevel = (snapshot?.risk_level as RiskLevel) ?? (currentTempF && currentTempF >= 108 ? 'extreme' : 'elevated')

  // Manual trigger for live demo — calls real FortyGuard + CALL-E via backend
  async function handleEmergencySpikeToggle() {
    if (!selectedSiteId) return
    setIsSimulatingEmergency(true)
    setEmergencyStatus(null)
    try {
      const res = await triggerCheck(selectedSiteId, true)
      if (res.alerts_dispatched) {
        setEmergencyStatus(`✅ CALL-E dispatched! Snapshot ID: ${res.snapshot_id}. Check your phone and the Live Action Feed below.`)
      } else {
        setEmergencyStatus(`⚠️ Check triggered (risk: ${res.risk_level}). No alerts dispatched — ensure workers are enrolled with consent.`)
      }
    } catch (err: any) {
      setEmergencyStatus(`❌ Error: ${err.message}`)
    } finally {
      setTimeout(() => setIsSimulatingEmergency(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Executive Autonomous HUD */}
      <div className="bg-[#2C3639] text-[#DCD7C9] border border-[#3F4E4F] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-5">
          {/* Autonomous Status Badge */}
          <div className="flex items-center gap-2.5 bg-[#3F4E4F]/70 px-3.5 py-1.5 rounded-xl border border-[#A27B5C]/40">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="font-mono">
              <span className="text-xs font-bold text-white uppercase block leading-none">
                Autonomous AI Watchdog Active
              </span>
              <span className="text-[9px] text-[#A27B5C] font-semibold uppercase">
                Continuous 24/7 Heat-Safety Guardian
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#3F4E4F] hidden md:block" />

          {/* Active Worksite Selector */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#DCD7C9]/60 text-[11px]">Monitoring:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-[#3F4E4F] border border-[#A27B5C]/50 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[#A27B5C] cursor-pointer"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>📍 {s.name}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-[#3F4E4F] hidden md:block" />

          {/* Live Temperature Readout — real data only */}
          {currentTempF !== null ? (
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[10px] text-[#DCD7C9]/50 uppercase">Live Temp:</span>
              <span className={`text-sm font-bold ${riskLevel === 'extreme' ? 'text-red-400' : riskLevel === 'elevated' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {currentTempF}°F
              </span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                riskLevel === 'extreme' ? 'bg-red-900/50 text-red-300' :
                riskLevel === 'elevated' ? 'bg-yellow-900/50 text-yellow-300' :
                'bg-emerald-900/50 text-emerald-300'
              }`}>{riskLevel}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs text-[#DCD7C9]/40">
              <span className="w-2 h-2 rounded-full bg-[#A27B5C]/40 animate-pulse" />
              Awaiting FortyGuard scan...
            </div>
          )}
        </div>

        {/* Action Controls & Emergency Injector */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTelemetryModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#3F4E4F] hover:bg-[#A27B5C] text-white text-xs font-mono font-bold transition-all border border-[#3F4E4F] flex items-center gap-1.5"
            title="Inspect verified FortyGuard API key credits, rate limits, and raw JSON response"
          >
            <span>🛰️</span>
            <span>FortyGuard API Proof</span>
          </button>

          <button
            onClick={() => setShowRegisterSiteModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#3F4E4F] hover:bg-[#A27B5C] text-white text-xs font-mono font-bold transition-all border border-[#3F4E4F]"
          >
            ➕ Pinpoint Site
          </button>

          <button
            onClick={() => setShowDirectCallModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#3F4E4F] hover:bg-[#A27B5C] text-white text-xs font-mono font-bold transition-all border border-[#A27B5C]/40 flex items-center gap-1.5"
          >
            <span>📱</span>
            <span>Call My Phone (CALL-E)</span>
          </button>

          <button
            onClick={handleEmergencySpikeToggle}
            disabled={isSimulatingEmergency || !selectedSiteId}
            className="px-3.5 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5"
            title="Triggers a real heat check + dispatches real CALL-E calls to enrolled workers"
          >
            <span>⚡</span>
            <span>{isSimulatingEmergency ? 'AI Auto-Dispatching...' : 'Test AI Emergency Response'}</span>
          </button>
        </div>
      </div>

      {/* Emergency Dispatch Status Banner — shows real backend response */}
      {emergencyStatus && (
        <div className={`rounded-xl px-4 py-3 text-sm font-mono border flex items-center justify-between ${
          emergencyStatus.startsWith('✅')
            ? 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300'
            : emergencyStatus.startsWith('❌')
            ? 'bg-red-950/50 border-red-600/40 text-red-300'
            : 'bg-yellow-950/50 border-yellow-600/40 text-yellow-300'
        }`}>
          <span>{emergencyStatus}</span>
          <button onClick={() => setEmergencyStatus(null)} className="ml-4 opacity-60 hover:opacity-100 font-bold text-lg leading-none">✕</button>
        </div>
      )}

      {/* Main 3-Column Autonomous Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Protected Workers & Auto-Safety Specs */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* FortyGuard Microclimate Intelligence Card */}
          <MicroclimateTelemetryCard data={microclimate} loading={microLoading} />

          <div className="card-warm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#3F4E4F]/15 pb-2">
              <div className="font-mono">
                <h3 className="text-xs font-bold text-[#2C3639] uppercase">Protected Field Workforce</h3>
                <span className="text-[10px] text-[#A27B5C] font-semibold">Autonomous Emergency Coverage</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#2C3639] text-[#DCD7C9]">
                {workers.length} On Duty
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
              {loading && <p className="text-xs text-[#3F4E4F] font-mono">Syncing active personnel...</p>}
              {workers.map((w) => (
                <WorkerCard key={w.id} worker={w} />
              ))}
              {!loading && workers.length === 0 && (
                <p className="text-xs text-[#3F4E4F] font-mono text-center py-6">
                  No workers enrolled. Go to Field Workers tab to add workers.
                </p>
              )}
            </div>
          </div>

          {/* Autonomous Protocol Banner */}
          <SafetyProtocolCard temperatureF={currentTempF ?? 70} riskLevel={riskLevel} />
        </div>

        {/* Center Column (5 cols): Live Geospatial Thermal Radar */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="card-warm p-2 shadow-lg flex-1 min-h-[500px] flex flex-col">
            <HeatMap site={selectedSite} riskLevel={riskLevel} snapshot={snapshot} microclimate={microclimate} />
          </div>
        </div>

        {/* Right Column (3 cols): Autonomous AI Decision Stream */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="card-warm p-4 flex-1">
            <AutonomousGuardianFeed
              snapshot={snapshot}
              alerts={alerts}
              siteName={selectedSite?.name || 'California Worksite'}
              onTrackCall={(callId) => setActiveCalleCallId(callId)}
            />
          </div>
        </div>
      </div>

      {/* CALL-E Live Call Tracker Modal */}
      {activeCalleCallId && (
        <CalleLiveModal
          callId={activeCalleCallId}
          onClose={() => setActiveCalleCallId(null)}
        />
      )}

      {/* Direct Mobile Phone Dialing Modal */}
      {showDirectCallModal && (
        <DirectCallModal
          onClose={() => setShowDirectCallModal(false)}
        />
      )}

      {/* Register Custom Work Site Modal */}
      {showRegisterSiteModal && (
        <RegisterSiteModal
          onSiteCreated={(newSite) => {
            loadSites()
            setSelectedSiteId(newSite.id)
          }}
          onClose={() => setShowRegisterSiteModal(false)}
        />
      )}

      {/* FortyGuard Raw Telemetry Modal */}
      {showTelemetryModal && (
        <FortyGuardTelemetryModal
          usageData={usageData}
          rawSnapshotData={snapshot?.raw_response}
          onClose={() => setShowTelemetryModal(false)}
        />
      )}
    </div>
  )
}
