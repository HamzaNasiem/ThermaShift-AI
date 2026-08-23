import type { ActionLog } from '../types'

interface AlertFeedProps {
  alerts: ActionLog[]
  onPlayVoice?: (workerName: string, phone: string, lang: 'ur' | 'en') => void
  onTrackCall?: (callId: string) => void
}

const CHANNEL_ICON = { voice: '📞', sms: '💬' } as const

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function AlertFeed({ alerts, onPlayVoice, onTrackCall }: AlertFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-[#3F4E4F] font-mono">
        <span className="text-xl mb-1">✓</span>
        <p className="text-xs">No active alerts</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((log) => (
        <div
          key={log.id}
          className="px-3.5 py-3 rounded-xl bg-[#F5F2EB] border border-[#3F4E4F]/15 text-xs font-mono shadow-sm space-y-2"
        >
          <div className="flex items-start gap-2.5">
            <span className="text-base shrink-0">
              {CHANNEL_ICON[log.channel]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#2C3639] capitalize">
                  {log.channel} dispatch
                </span>
                <span className="text-[10px] text-[#3F4E4F] shrink-0">{formatTime(log.created_at)}</span>
              </div>
              <p className="text-[10px] text-[#A27B5C] capitalize font-medium mt-0.5">
                Status: <span className="font-bold text-[#2C3639]">{log.status}</span>
                {log.provider_ref && (
                  <span className="text-[#3F4E4F] ml-1 font-mono text-[9px] bg-[#DCD7C9]/60 px-1.5 py-0.5 rounded">
                    {log.provider_ref}
                  </span>
                )}
              </p>
            </div>
          </div>

          {log.channel === 'voice' && (
            <div className="flex items-center gap-1.5 pt-1">
              {log.provider_ref && log.provider_ref.startsWith('call_') && onTrackCall && (
                <button
                  onClick={() => onTrackCall(log.provider_ref!)}
                  className="flex-1 py-1 text-[10px] font-bold text-white bg-[#2C3639] hover:bg-[#3F4E4F] rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>🛰️</span>
                  <span>Track CALL-E Live</span>
                </button>
              )}

              {onPlayVoice && (
                <button
                  onClick={() => onPlayVoice('Worker', '+14155552671', 'ur')}
                  className="flex-1 py-1 text-[10px] font-bold text-[#A27B5C] hover:text-white bg-[#A27B5C]/10 hover:bg-[#A27B5C] rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <span>▶ Play Audio</span>
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
