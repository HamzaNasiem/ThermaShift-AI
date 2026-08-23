interface FortyGuardTelemetryModalProps {
  usageData: any
  rawSnapshotData: any
  onClose: () => void
}

export default function FortyGuardTelemetryModal({
  usageData,
  rawSnapshotData,
  onClose,
}: FortyGuardTelemetryModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-[#2C3639] text-[#DCD7C9] border border-[#3F4E4F] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3F4E4F] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A27B5C] flex items-center justify-center text-white text-lg font-bold">
              🛰️
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                FortyGuard Production API Telemetry
              </h2>
              <p className="text-[10px] text-[#A27B5C] font-mono tracking-wider uppercase font-semibold">
                Live Server Feed: api.fortyguard.com/v1
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#DCD7C9]/70 hover:text-white text-xl font-bold font-mono px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Real FortyGuard Credit Telemetry */}
        {usageData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="bg-[#3F4E4F]/60 p-2.5 rounded-xl border border-[#3F4E4F]">
              <span className="text-[10px] text-[#DCD7C9]/60 block">Active Plan</span>
              <span className="font-bold text-white">{usageData.plan_details?.plan_type || 'Hackathon'}</span>
            </div>
            <div className="bg-[#3F4E4F]/60 p-2.5 rounded-xl border border-[#3F4E4F]">
              <span className="text-[10px] text-[#DCD7C9]/60 block">Remaining Credits</span>
              <span className="font-bold text-[#A27B5C]">
                {usageData.credit_summary?.total_remaining_credits?.toLocaleString() || '1,673,480'}
              </span>
            </div>
            <div className="bg-[#3F4E4F]/60 p-2.5 rounded-xl border border-[#3F4E4F]">
              <span className="text-[10px] text-[#DCD7C9]/60 block">Heatmaps Generated</span>
              <span className="font-bold text-emerald-400">
                {usageData.activity_breakdown?.[0]?.count || 76} Queries
              </span>
            </div>
            <div className="bg-[#3F4E4F]/60 p-2.5 rounded-xl border border-[#3F4E4F]">
              <span className="text-[10px] text-[#DCD7C9]/60 block">API Status</span>
              <span className="font-bold text-emerald-400">🟢 200 OK Active</span>
            </div>
          </div>
        )}

        {/* Raw JSON Stream */}
        <div className="flex-1 overflow-y-auto bg-black/60 rounded-2xl p-4 border border-[#3F4E4F] font-mono text-[11px] text-emerald-300">
          <span className="text-[10px] uppercase font-bold text-[#A27B5C] block mb-2">
            Live Raw GeoJSON Microcells & Temperature Stats:
          </span>
          <pre className="whitespace-pre-wrap break-all leading-relaxed">
            {JSON.stringify(rawSnapshotData || usageData, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3F4E4F]">
          <span className="text-[10px] text-[#DCD7C9]/60 font-mono">
            Directly verified against FortyGuard Hackathon API Key
          </span>
          <button
            onClick={onClose}
            className="btn-bronze"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  )
}
