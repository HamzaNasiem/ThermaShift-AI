import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSites, getFortyGuardUsage, triggerCheck, getMicroclimateAnalysis, getHourlyForecast } from '../lib/api'
import { useLiveHeat } from '../hooks/useLiveHeat'
import HeatMap from '../components/HeatMap'
import WorkerCard from '../components/WorkerCard'
import AutonomousGuardianFeed from '../components/AutonomousGuardianFeed'
import MicroclimateTelemetryCard from '../components/MicroclimateTelemetryCard'
import CalleLiveModal from '../components/CalleLiveModal'
import DirectCallModal from '../components/DirectCallModal'
import RegisterSiteModal from '../components/RegisterSiteModal'
import FortyGuardTelemetryModal from '../components/FortyGuardTelemetryModal'
import OshaComplianceReportModal from '../components/OshaComplianceReportModal'
import AudioVoicePlayer from '../components/AudioVoicePlayer'
import { HourlyThermalForecastChart } from '../components/HourlyThermalForecastChart'
import type { Site, RiskLevel, MicroclimateAnalysis, HourlyForecastPoint } from '../types'

export default function Dashboard() {
  const [searchParams] = useSearchParams()
  const urlSiteId = searchParams.get('site_id')

  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>(urlSiteId || '')
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [microclimate, setMicroclimate] = useState<MicroclimateAnalysis | null>(null)
  const [microLoading, setMicroLoading] = useState(false)
  const [forecastData, setForecastData] = useState<HourlyForecastPoint[]>([])

  // Autonomous Guardian State
  const [isSimulatingEmergency, setIsSimulatingEmergency] = useState(false)
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null)
  const [usageData, setUsageData] = useState<any>(null)

  // Modals
  const [activeCalleCallId, setActiveCalleCallId] = useState<string | null>(null)
  const [showDirectCallModal, setShowDirectCallModal] = useState(false)
  const [showRegisterSiteModal, setShowRegisterSiteModal] = useState(false)
  const [showTelemetryModal, setShowTelemetryModal] = useState(false)
  const [showOshaReportModal, setShowOshaReportModal] = useState(false)


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
        
      getHourlyForecast(selectedSiteId)
        .then((res) => setForecastData(res.points || []))
        .catch(console.error)
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
      <div className="bg-[#242D30] text-[#DCD7C9] border border-[#3F4E4F] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-4">
          {/* Autonomous Status Badge */}
          <div className="flex items-center gap-2 bg-[#1A2224] px-3 py-1.5 rounded-xl border border-emerald-500/40">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              Autonomous AI Guardian Active
            </span>
          </div>

          <div className="h-6 w-px bg-[#3F4E4F] hidden md:block" />

          {/* Active Worksite Selector */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#DCD7C9]/60 text-[11px]">Site:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-[#1A2224] border border-[#A27B5C]/50 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[#A27B5C] cursor-pointer"
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
              Syncing FortyGuard...
            </div>
          )}
        </div>

        {/* Action Controls & Emergency Injector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTelemetryModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#1A2224] hover:bg-[#3F4E4F] text-white text-xs font-mono font-bold transition-all border border-[#3F4E4F] flex items-center gap-1.5"
            title="Inspect verified FortyGuard API key credits & raw response"
          >
            <span>🛰️</span>
            <span>FortyGuard Proof</span>
          </button>

          <button
            onClick={() => setShowOshaReportModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#1A2224] hover:bg-[#3F4E4F] text-white text-xs font-mono font-bold transition-all border border-emerald-500/40 flex items-center gap-1.5"
            title="Generate Official OSHA Heat Safety Compliance Audit Certificate"
          >
            <span>📑</span>
            <span>OSHA Audit</span>
          </button>

          <button
            onClick={() => setShowDirectCallModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#1A2224] hover:bg-[#3F4E4F] text-white text-xs font-mono font-bold transition-all border border-[#A27B5C]/40 flex items-center gap-1.5"
          >
            <span>📱</span>
            <span>Direct Call (CALL-E)</span>
          </button>

          <button
            onClick={handleEmergencySpikeToggle}
            disabled={isSimulatingEmergency || !selectedSiteId}
            className="px-3.5 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5"
            title="Simulate extreme heat emergency and dispatch real CALL-E phone calls"
          >
            <span>⚡</span>
            <span>{isSimulatingEmergency ? 'AI Auto-Calling...' : 'Test Emergency Dispatch'}</span>
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
        {/* Left Column (4 cols): Thermal Intelligence & Protected Workforce */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* FortyGuard Microclimate Intelligence Card */}
          <MicroclimateTelemetryCard 
            data={microclimate} 
            loading={microLoading} 
            onBroadcastClick={handleEmergencySpikeToggle}
          />

          {/* Browser Audio Voice Dispatch Preview */}
          <AudioVoicePlayer
            workerName={workers[0]?.name || 'Site Lead'}
            siteName={selectedSite?.name || 'Heavy Industrial Work Site'}
            surfaceTempF={microclimate?.surface_temp_f ?? 128.9}
            refugeName={microclimate?.cooling_refuge || 'Zone D Shaded Canopy'}
            reliefDeltaF={microclimate?.cooling_delta_f ?? 38.5}
            language={workers[0]?.preferred_language || 'en'}
          />

          {/* Active Workforce Roster */}
          <div className="card-warm p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#3F4E4F]/30 pb-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase">Protected Field Workforce</h3>
                <span className="text-[10px] text-[#A27B5C] font-semibold">Autonomous Emergency Coverage</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1A2224] text-emerald-400 border border-emerald-500/30">
                {workers.length} On Duty
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[240px] pr-1">
              {loading && <p className="text-xs text-[#DCD7C9]/50 font-mono">Syncing personnel...</p>}
              {workers.map((w) => (
                <WorkerCard key={w.id} worker={w} />
              ))}
              {!loading && workers.length === 0 && (
                <p className="text-xs text-[#DCD7C9]/40 font-mono text-center py-4">
                  No workers enrolled on this site.
                </p>
              )}
            </div>
          </div>
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

      {/* Hourly Forecast Chart */}
      {forecastData.length > 0 && (
        <HourlyThermalForecastChart data={forecastData} />
      )}

      {/* OSHA & Legal Compliance Report Modal */}
      {showOshaReportModal && (
        <OshaComplianceReportModal
          site={selectedSite}
          microclimate={microclimate}
          workers={workers}
          alerts={alerts}
          onClose={() => setShowOshaReportModal(false)}
        />
      )}

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
