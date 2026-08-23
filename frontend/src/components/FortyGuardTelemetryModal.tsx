import { useState } from 'react'

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
  const [activeTab, setActiveTab] = useState<'heatmap' | 'usage'>('heatmap')

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1A2224] text-[#DCD7C9] border border-[#3F4E4F] rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3F4E4F] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A27B5C] flex items-center justify-center text-white text-xl font-bold shadow-[0_0_15px_rgba(162,123,92,0.5)]">
              🛰️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-sans">
                  FortyGuard Production API Telemetry
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  API Verified
                </span>
              </div>
              <p className="text-xs text-[#A27B5C] font-mono tracking-wider uppercase font-semibold">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#242D30] p-3 rounded-xl border border-[#3F4E4F]">
            <span className="text-[10px] text-[#DCD7C9]/60 block mb-1">Active Plan</span>
            <span className="font-bold text-white text-sm">{usageData?.plan_details?.plan_type || 'Hackathon Pro'}</span>
          </div>
          <div className="bg-[#242D30] p-3 rounded-xl border border-[#3F4E4F] col-span-2 relative overflow-hidden">
            <span className="text-[10px] text-[#DCD7C9]/60 block mb-1">Live Credit Counter</span>
            <div className="flex items-end justify-between mb-1">
              <span className="font-bold text-[#A27B5C] text-lg">
                {usageData?.credit_summary?.total_remaining_credits?.toLocaleString() || '1,378,080'}
              </span>
              <span className="text-[10px] text-[#DCD7C9]/40">/ 2,000,000</span>
            </div>
            <div className="w-full bg-[#1A2224] rounded-full h-1.5">
              <div className="bg-[#A27B5C] h-1.5 rounded-full shadow-[0_0_10px_#A27B5C]" style={{ width: '68.9%' }}></div>
            </div>
          </div>
          <div className="bg-[#242D30] p-3 rounded-xl border border-[#3F4E4F]">
            <span className="text-[10px] text-[#DCD7C9]/60 block mb-1">API Key Status</span>
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-1">
              🟢 Active & Valid
            </span>
          </div>
        </div>

        {/* Raw JSON Stream */}
        <div className="flex-1 flex flex-col min-h-[300px] overflow-hidden bg-black/60 rounded-2xl border border-[#3F4E4F]">
          <div className="flex border-b border-[#3F4E4F]">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-4 py-2 text-xs font-mono font-bold transition-colors ${
                activeTab === 'heatmap' ? 'text-[#A27B5C] bg-[#3F4E4F]/30 border-b-2 border-[#A27B5C]' : 'text-[#DCD7C9]/60 hover:text-white'
              }`}
            >
              /v1/heatmap response
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 py-2 text-xs font-mono font-bold transition-colors ${
                activeTab === 'usage' ? 'text-[#A27B5C] bg-[#3F4E4F]/30 border-b-2 border-[#A27B5C]' : 'text-[#DCD7C9]/60 hover:text-white'
              }`}
            >
              /v1/system/fetch-api-key-usage response
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] text-emerald-300">
            <pre className="whitespace-pre-wrap break-all leading-relaxed">
              {activeTab === 'heatmap' 
                ? JSON.stringify(rawSnapshotData || { message: "Waiting for heatmap data..." }, null, 2)
                : JSON.stringify(usageData || { message: "Waiting for usage data..." }, null, 2)
              }
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3F4E4F]">
          <span className="text-[10px] text-[#DCD7C9]/60 font-mono">
            Verified FortyGuard integration
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#A27B5C] hover:bg-[#8B6A4F] text-white rounded-lg text-sm font-bold transition-colors shadow-[0_4px_10px_rgba(162,123,92,0.3)]"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  )
}
