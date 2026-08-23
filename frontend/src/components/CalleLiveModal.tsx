import { useEffect, useState } from 'react'

interface CalleLiveModalProps {
  callId: string
  onClose: () => void
}

export default function CalleLiveModal({ callId, onClose }: CalleLiveModalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/internal/calle/call/${callId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()
      setData(json.call)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [callId])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#2C3639] text-[#DCD7C9] border-2 border-[#A27B5C] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3F4E4F] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A27B5C] flex items-center justify-center text-white text-xl animate-pulse">
              📞
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                CALL-E Autonomous Voice Agent Dispatch
              </h2>
              <p className="text-[10px] text-[#A27B5C] font-mono tracking-wider uppercase font-semibold">
                Live Outbound Call Stream: api.heycall-e.com
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

        {/* Live Call Telemetry */}
        {loading && !data && (
          <div className="py-8 text-center text-xs font-mono text-[#DCD7C9]/70 animate-pulse">
            Connecting to CALL-E server...
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Status Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="bg-[#3F4E4F]/60 p-2.5 rounded-xl border border-[#3F4E4F]">
                <span className="text-[10px] text-[#DCD7C9]/60 block">Call ID</span>
                <span className="font-bold text-[#A27B5C] truncate block">{data.id}</span>
              </div>
              <div className="bg-[#3F4E4F]/60 p-2.5 rounded-xl border border-[#3F4E4F]">
                <span className="text-[10px] text-[#DCD7C9]/60 block">Live Status</span>
                <span className={`font-bold uppercase ${data.status === 'completed' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                  ● {data.status}
                </span>
              </div>
              <div className="bg-[#3F4E4F]/60 p-2.5 rounded-xl border border-[#3F4E4F] col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[#DCD7C9]/60 block">Recipient</span>
                <span className="font-bold text-white">
                  {data.recipients?.[0]?.phones?.[0] || 'Worker'}
                </span>
              </div>
            </div>

            {/* Task Instruction */}
            <div className="bg-black/40 rounded-2xl p-3.5 border border-[#3F4E4F] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#A27B5C] block font-mono">
                CALL-E Voice Mission Instruction:
              </span>
              <p className="text-xs text-[#DCD7C9] leading-relaxed font-mono">
                {data.task}
              </p>
            </div>

            {/* Structured Result */}
            {data.structured_result && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block font-mono">
                  Worker Structured Verification Result:
                </span>
                <pre className="text-xs text-emerald-300 font-mono">
                  {JSON.stringify(data.structured_result, null, 2)}
                </pre>
              </div>
            )}

            {/* Call Summary */}
            {data.summary && (
              <div className="bg-black/30 rounded-2xl p-3.5 border border-[#3F4E4F] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#A27B5C] block font-mono">
                  Call Summary:
                </span>
                <p className="text-xs text-[#DCD7C9] font-sans">
                  {data.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3F4E4F]">
          <span className="text-[10px] text-[#DCD7C9]/60 font-mono">
            Powered by CALL-E (HeyCall-E) Production API
          </span>
          <button
            onClick={onClose}
            className="btn-bronze"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  )
}
