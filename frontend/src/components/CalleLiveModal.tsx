import { useEffect, useState } from 'react'
import { getCalleCallStatus } from '../lib/api'

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
      const json = await getCalleCallStatus(callId)
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#ffffff] text-[#141414] border border-slate-200 rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-slate-200 flex items-center justify-between bg-[#ffffff]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#141414]">
                CALL-E Autonomous Voice Dispatch
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Live Outbound Call Stream: api.heycall-e.com
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#141414] text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Live Call Telemetry */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {loading && !data && (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse font-medium">
              Connecting to CALL-E server stream...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {/* Status Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-[#f9fafb] p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">Call ID</span>
                  <span className="font-bold text-[#141414] truncate block font-mono text-[11px]">{data.id}</span>
                </div>
                <div className="bg-[#f9fafb] p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">Live Status</span>
                  <span className={`font-bold uppercase ${data.status === 'completed' ? 'text-emerald-700' : 'text-amber-600 animate-pulse'}`}>
                    ● {data.status}
                  </span>
                </div>
                <div className="bg-[#f9fafb] p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 font-medium block">Recipient</span>
                  <span className="font-bold text-[#141414] font-mono text-[11px]">
                    {data.recipients?.[0]?.phones?.[0] || 'Worker'}
                  </span>
                </div>
              </div>

              {/* Task Instruction */}
              <div className="bg-[#f9fafb] rounded-2xl p-3.5 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-600 block">
                  CALL-E Voice Mission Instruction:
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {data.task || 'Autonomous bilingual emergency heat evacuation warning.'}
                </p>
              </div>

              {/* Live Transcript / Summary */}
              {data.summary && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    ✓ Structured Call Summary:
                  </span>
                  <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                    {data.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3.5 border-t border-slate-200 flex items-center justify-between bg-[#ffffff]">
          <span className="text-[11px] text-slate-500 font-medium">
            Verified CALL-E Telephony
          </span>
          <button
            onClick={onClose}
            className="btn-secondary font-semibold"
          >
            Close Stream
          </button>
        </div>
      </div>
    </div>
  )
}
