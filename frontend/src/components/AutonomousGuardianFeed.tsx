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
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#3F4E4F]/60 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isExtreme ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Live Action & Call Logs
          </span>
        </div>
        <span className="text-[10px] text-[#A27B5C] font-semibold">PostgreSQL Audit Trail</span>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
        {alerts.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#1E2628] border border-[#3F4E4F]/40 space-y-2 text-xs">
            <span className="text-2xl block">🛡️</span>
            <p className="font-bold text-white">No Emergency Calls Dispatched Yet</p>
            <p className="text-[11px] text-[#DCD7C9]/60 font-sans leading-relaxed">
              FortyGuard is actively polling {siteName}. When heat crosses your configured threshold ({isExtreme ? 'Currently Extreme' : 'Currently Safe'}), real-time CALL-E voice calls and Twilio SMS will automatically be recorded here.
            </p>
          </div>
        ) : (
          alerts.map((log) => {
            const isVoice = log.channel === 'voice'
            const callId = log.provider_ref

            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border text-xs shadow-sm transition-all ${
                  isVoice
                    ? 'bg-[#1E2628] border-[#A27B5C]/60 text-white'
                    : 'bg-[#1E2628] border-[#3F4E4F] text-[#DCD7C9]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0 mt-0.5">{isVoice ? '📞' : '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white">
                        {isVoice ? 'CALL-E Outbound Voice Call' : 'Twilio SMS Notification'}
                      </span>
                      <span className="text-[10px] text-[#DCD7C9]/60 shrink-0">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#DCD7C9]/80 mt-1 font-sans space-y-0.5">
                      <div>Status: <span className="font-bold uppercase text-emerald-400">{log.status}</span></div>
                      {callId && (
                        <div className="font-mono text-[10px] text-[#A27B5C] truncate">
                          Call ID: {callId}
                        </div>
                      )}
                    </div>

                    {isVoice && callId && callId.startsWith('call_') && onTrackCall && (
                      <button
                        onClick={() => onTrackCall(callId)}
                        className="mt-2 px-2.5 py-1 rounded-lg bg-[#2C3639] hover:bg-[#3F4E4F] text-white text-[10px] font-bold font-mono transition-all flex items-center gap-1 border border-[#A27B5C]/40"
                      >
                        <span>🛰️</span>
                        <span>Track Live Telephony Stream</span>
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
