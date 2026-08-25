import type { ActionLog, HeatSnapshot } from '../types'

interface AutonomousFeedProps {
  snapshot: HeatSnapshot | null
  alerts: ActionLog[]
  siteName: string
  onTrackCall?: (callId: string) => void
}

export default function AutonomousGuardianFeed({
  snapshot,
  alerts,
  siteName,
  onTrackCall,
}: AutonomousFeedProps) {
  const currentTemp = snapshot ? Math.round(snapshot.temperature_f * 10) / 10 : null
  const isExtreme = snapshot?.risk_level === 'extreme' || (currentTemp !== null && currentTemp >= 108)

  return (
    <div className="space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isExtreme ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
          <h3 className="text-xs font-semibold text-slate-200">
            Live Action & Dispatch Log
          </h3>
        </div>
        <span className="badge-slate text-[10px]">
          PostgreSQL Audit
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
        {alerts.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#141B20] border border-slate-800 space-y-2 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-200">No Emergency Calls Dispatched</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              FortyGuard is actively polling {siteName}. When heat crosses threshold ({isExtreme ? 'Extreme Heat Active' : 'Safe Baseline'}), automated voice calls and SMS are logged here.
            </p>
          </div>
        ) : (
          alerts.map((log) => {
            const isVoice = log.channel === 'voice'
            const callId = log.provider_ref

            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#141B20] border border-slate-800 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isVoice ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}>
                    {isVoice ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-200">
                        {isVoice ? 'CALL-E Outbound Voice' : 'Twilio SMS Notification'}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span>Status:</span>
                        <span className="badge-emerald text-[10px] uppercase font-semibold">
                          {log.status}
                        </span>
                      </div>
                      {callId && (
                        <div className="font-mono text-[10px] text-slate-500 truncate">
                          Ref: {callId}
                        </div>
                      )}
                    </div>

                    {isVoice && callId && callId.startsWith('call_') && onTrackCall && (
                      <button
                        onClick={() => onTrackCall(callId)}
                        className="mt-2 btn-secondary text-[11px] py-1 px-2.5 w-full"
                      >
                        Inspect Telephony Stream
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
