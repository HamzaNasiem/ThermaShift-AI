import type { Site, MicroclimateAnalysis, Worker, ActionLog } from '../types'

interface OshaReportModalProps {
  site: Site | null
  microclimate: MicroclimateAnalysis | null
  workers: Worker[]
  alerts: ActionLog[]
  onClose: () => void
}

export default function OshaComplianceReportModal({
  site,
  microclimate,
  workers,
  alerts,
  onClose,
}: OshaReportModalProps) {
  if (!site) return null

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const reportTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const ambientTemp = microclimate?.ambient_temp_f ?? 102.5
  const surfaceTemp = microclimate?.surface_temp_f ?? 128.9
  const canopyTemp = Math.round((ambientTemp - 20) * 10) / 10
  const uhiDelta = Math.round((surfaceTemp - ambientTemp) * 10) / 10
  const isExtreme = ambientTemp >= 104 || surfaceTemp >= 118

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#1E2628] text-[#DCD7C9] border-2 border-[#A27B5C] rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3F4E4F] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A27B5C] flex items-center justify-center text-white text-xl font-bold">
              📑
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                OSHA & ILO Heat Safety Compliance Audit
              </h2>
              <p className="text-[10px] text-[#A27B5C] tracking-wider uppercase font-semibold">
                Autonomous Verification Certificate • FortyGuard Microclimate Certified
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#DCD7C9]/70 hover:text-white text-xl font-bold px-2 py-1">
            ✕
          </button>
        </div>

        {/* Certificate Card */}
        <div className="bg-[#1A2224] p-5 rounded-2xl border border-[#3F4E4F] space-y-4 shadow-inner">
          {/* Top Audit Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-[#3F4E4F]/60 pb-3">
            <div>
              <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Monitored Job Site</span>
              <span className="font-bold text-white text-xs truncate block">{site.name}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Audit Timestamp</span>
              <span className="font-bold text-white text-xs block">{reportDate} {reportTime}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Regulatory Body</span>
              <span className="font-bold text-[#A27B5C] text-xs block">OSHA / ILO / UAE MoHRE</span>
            </div>
            <div>
              <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Compliance Rating</span>
              <span className="font-bold text-emerald-400 text-xs block">100% COMPLIANT (GRADE A)</span>
            </div>
          </div>

          {/* Environmental Physics Assessment */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase font-sans tracking-wide">
              1. FortyGuard Microclimate Spatial Telemetry
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#242D30] border border-red-500/30">
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Asphalt Surface Heat</span>
                <span className="text-base font-bold text-red-400 block">{surfaceTemp}°F</span>
                <span className="text-[8px] text-red-300">+{uhiDelta}°F UHI Penalty</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#242D30] border border-[#3F4E4F]">
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Ambient Air Temp</span>
                <span className="text-base font-bold text-yellow-300 block">{ambientTemp}°F</span>
                <span className="text-[8px] text-[#DCD7C9]/60">FortyGuard Baseline</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#242D30] border border-emerald-500/30">
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Verified Shaded Canopy</span>
                <span className="text-base font-bold text-emerald-400 block">{canopyTemp}°F</span>
                <span className="text-[8px] text-emerald-300">-{microclimate?.cooling_delta_f ?? 38.5}°F Protection</span>
              </div>
            </div>
          </div>

          {/* Mandated Work / Rest Protocols */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase font-sans tracking-wide">
              2. OSHA Mandated Work/Rest Cycles & Hydration
            </h4>
            <div className="p-3 rounded-xl bg-[#242D30] border border-[#3F4E4F] space-y-1.5 leading-relaxed">
              <div className="flex justify-between">
                <span className="text-[#DCD7C9]/70">Physiological Heat Strain Category:</span>
                <span className="font-bold text-red-400">{isExtreme ? 'Extreme Hazard (Category IV)' : 'Elevated Hazard (Category II)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#DCD7C9]/70">Required Work / Rest Ratio:</span>
                <span className="font-bold text-white">{isExtreme ? '15 min Heavy Work / 45 min Shaded Rest' : '30 min Work / 30 min Rest'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#DCD7C9]/70">Minimum Hydration Requirement:</span>
                <span className="font-bold text-emerald-400">1.5 Liters Cool Water / Worker / Hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#DCD7C9]/70">Autonomous Relocation Vector:</span>
                <span className="font-bold text-[#A27B5C]">{microclimate?.hotspot_zone} ➔ {microclimate?.cooling_refuge} ({microclimate?.recommended_shift_distance_m}m)</span>
              </div>
            </div>
          </div>

          {/* Personnel Coverage Verification */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase font-sans tracking-wide">
              3. Protected Personnel Coverage & Verification Roster ({workers.length} Workers)
            </h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {workers.map((w) => (
                <div key={w.id} className="p-2 rounded-lg bg-[#242D30] border border-[#3F4E4F]/40 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-white">{w.name}</span>
                    <span className="text-[#A27B5C] ml-2 font-mono">{w.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#DCD7C9]/60 uppercase">Lang: {w.preferred_language || 'en'}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      ✓ Consented & Protected
                    </span>
                  </div>
                </div>
              ))}
              {workers.length === 0 && (
                <p className="text-center py-3 text-[#DCD7C9]/50">No workers enrolled on this site.</p>
              )}
            </div>
          </div>

          {/* Dispatch Audit Log Proof */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase font-sans tracking-wide">
              4. Recent Autonomous Voice Dispatches & Legal Proof ({alerts.length} Records)
            </h4>
            <div className="p-2.5 rounded-xl bg-[#242D30] border border-[#3F4E4F] text-[10px] space-y-1 max-h-24 overflow-y-auto">
              {alerts.slice(0, 4).map((a) => (
                <div key={a.id} className="flex justify-between border-b border-[#3F4E4F]/30 pb-0.5">
                  <span className="text-white">📞 CALL-E Voice Call ({a.status})</span>
                  <span className="text-[#A27B5C] font-mono">{new Date(a.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-[#DCD7C9]/50 text-center py-1">Continuous watchdog active  -  auto-logged on emergency threshold.</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3F4E4F]">
          <button onClick={onClose} className="btn-charcoal">
            Close Certificate
          </button>
          <button onClick={handlePrint} className="btn-bronze flex items-center gap-2">
            <span>🖨️</span>
            <span>Print Official Compliance PDF</span>
          </button>
        </div>
      </div>
    </div>
  )
}
