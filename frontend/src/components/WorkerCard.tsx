import type { Worker } from '../types'

interface WorkerCardProps {
  worker: Worker
}

export default function WorkerCard({ worker }: WorkerCardProps) {
  const isNotified = worker.status === 'notified'
  const isSafe = worker.status === 'safe'

  return (
    <div className="p-3 rounded-xl bg-[#1E2628] border border-[#3F4E4F]/60 text-xs font-mono shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-[#A27B5C] text-white flex items-center justify-center font-bold text-xs shrink-0">
          {worker.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <span className="font-bold text-white text-xs block truncate font-sans">
            {worker.name}
          </span>
          <span className="text-[10px] text-[#A27B5C] block truncate">
            {worker.phone_number} · <span className="uppercase text-[#DCD7C9]/60">{worker.preferred_language || 'en'}</span>
          </span>
        </div>
      </div>

      <span
        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 border ${
          isNotified
            ? 'bg-red-900/40 text-red-400 border-red-500/40 animate-pulse'
            : isSafe
            ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/40'
            : 'bg-amber-900/40 text-amber-400 border-amber-500/40'
        }`}
      >
        {isNotified ? '🚨 Alerted' : isSafe ? '🟢 Safe' : '⏳ Cooling'}
      </span>
    </div>
  )
}
