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
import ProductStoryModal from '../components/ProductStoryModal'
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
  const [showStoryModal, setShowStoryModal] = useState(false)

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

  // Real snapshot telemetry only
  const currentTempF: number | null = snapshot ? Math.round(snapshot.temperature_f * 10) / 10 : (microclimate ? microclimate.ambient_temp_f : null)
  const riskLevel: RiskLevel = (snapshot?.risk_level as RiskLevel) ?? (currentTempF && currentTempF >= 108 ? 'extreme' : 'elevated')

  async function handleEmergencySpikeToggle() {
    if (!selectedSiteId) return
    setIsSimulatingEmergency(true)
    setEmergencyStatus(null)
    try {
      const res = await triggerCheck(selectedSiteId, true)
      if (res.alerts_dispatched) {
        setEmergencyStatus(`✅ Emergency voice dispatch completed (Snapshot #${res.snapshot_id?.slice(0, 8)}). Stream updated below.`)
      } else {
        setEmergencyStatus(`⚠️ Check completed (Risk: ${res.risk_level}). Confirm workers are assigned with valid consent.`)
      }
    } catch (err: any) {
      setEmergencyStatus(`❌ Error: ${err.message}`)
    } finally {
      setTimeout(() => setIsSimulatingEmergency(false), 2000)
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Executive Control Bar */}
      <div className="card-surface p-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Site Selector Dropdown */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-[#141B20] border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-700 cursor-pointer"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* Live Heat Metric */}
          {currentTempF !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Baseline Heat:</span>
              <span className={`text-xs font-semibold tabular-nums ${
                riskLevel === 'extreme' ? 'text-rose-400' : riskLevel === 'elevated' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {currentTempF}°F
              </span>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                riskLevel === 'extreme' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                riskLevel === 'elevated' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {riskLevel}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
              Polling FortyGuard API...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStoryModal(true)}
            className="btn-ghost"
            title="Explore Interactive Product Story & System Architecture"
          >
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>How It Works</span>
          </button>

          <button
            onClick={() => setShowTelemetryModal(true)}
            className="btn-ghost"
            title="Inspect FortyGuard API Usage & Telemetry"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Telemetry Proof</span>
          </button>

          <button
            onClick={() => setShowOshaReportModal(true)}
            className="btn-ghost"
            title="Generate OSHA Compliance Certificate"
          >
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>OSHA Audit</span>
          </button>

          <button
            onClick={() => setShowDirectCallModal(true)}
            className="btn-ghost"
          >
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Direct Call</span>
          </button>

          <button
            onClick={handleEmergencySpikeToggle}
            disabled={isSimulatingEmergency || !selectedSiteId}
            className="btn-danger"
            title="Simulate heat spike and dispatch live CALL-E phone calls"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{isSimulatingEmergency ? 'Calling Crew...' : 'Trigger Voice Alert'}</span>
          </button>
        </div>
      </div>

      {/* Emergency Status Banner */}
      {emergencyStatus && (
        <div className={`rounded-xl px-4 py-3 text-xs border flex items-center justify-between ${
          emergencyStatus.startsWith('✅')
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : emergencyStatus.startsWith('❌')
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
        }`}>
          <span>{emergencyStatus}</span>
          <button onClick={() => setEmergencyStatus(null)} className="ml-4 text-slate-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Main 3-Column Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (4 cols): Telemetry & Protected Crew */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <MicroclimateTelemetryCard 
            data={microclimate} 
            loading={microLoading} 
            onBroadcastClick={handleEmergencySpikeToggle}
          />

          <AudioVoicePlayer
            workerName={workers[0]?.name || 'Site Supervisor'}
            siteName={selectedSite?.name || 'Heavy Industrial Work Site'}
            surfaceTempF={microclimate?.surface_temp_f ?? 128.9}
            refugeName={microclimate?.cooling_refuge || 'Zone D Shaded Canopy'}
            reliefDeltaF={microclimate?.cooling_delta_f ?? 38.5}
            language={workers[0]?.preferred_language || 'en'}
            onDirectCallClick={() => setShowDirectCallModal(true)}
          />

          {/* Active Crew Roster */}
          <div className="card-surface p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">
                  Assigned Crew
                </h3>
                <p className="text-[10px] text-slate-400">
                  Automated Phone & SMS Roster
                </p>
              </div>
              <span className="badge-emerald text-[10px]">
                {workers.length} Enrolled
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
              {loading && <p className="text-xs text-slate-500">Syncing personnel roster...</p>}
              {workers.map((w) => (
                <WorkerCard key={w.id} worker={w} />
              ))}
              {!loading && workers.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  No workers assigned to this site.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center Column (5 cols): Geospatial Thermal Radar */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="card-surface p-2 shadow-lg flex-1 min-h-[500px] flex flex-col">
            <HeatMap site={selectedSite} riskLevel={riskLevel} snapshot={snapshot} microclimate={microclimate} />
          </div>
        </div>

        {/* Right Column (3 cols): Autonomous Dispatch Stream */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="card-surface p-4 flex-1">
            <AutonomousGuardianFeed
              snapshot={snapshot}
              alerts={alerts}
              siteName={selectedSite?.name || 'Industrial Worksite'}
              onTrackCall={(callId) => setActiveCalleCallId(callId)}
            />
          </div>
        </div>
      </div>

      {/* Hourly Diurnal Forecast Chart */}
      {forecastData.length > 0 && (
        <HourlyThermalForecastChart data={forecastData} />
      )}

      {/* Modals */}
      {showOshaReportModal && (
        <OshaComplianceReportModal
          site={selectedSite}
          microclimate={microclimate}
          workers={workers}
          alerts={alerts}
          onClose={() => setShowOshaReportModal(false)}
        />
      )}

      {activeCalleCallId && (
        <CalleLiveModal
          callId={activeCalleCallId}
          onClose={() => setActiveCalleCallId(null)}
        />
      )}

      {showDirectCallModal && (
        <DirectCallModal
          onClose={() => setShowDirectCallModal(false)}
        />
      )}

      {showRegisterSiteModal && (
        <RegisterSiteModal
          onSiteCreated={(newSite) => {
            loadSites()
            setSelectedSiteId(newSite.id)
          }}
          onClose={() => setShowRegisterSiteModal(false)}
        />
      )}

      {showTelemetryModal && (
        <FortyGuardTelemetryModal
          usageData={usageData}
          rawSnapshotData={snapshot?.raw_response}
          onClose={() => setShowTelemetryModal(false)}
        />
      )}

      {showStoryModal && (
        <ProductStoryModal
          onClose={() => setShowStoryModal(false)}
          onTriggerTest={handleEmergencySpikeToggle}
        />
      )}
    </div>
  )
}
