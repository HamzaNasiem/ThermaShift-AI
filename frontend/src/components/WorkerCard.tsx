import type { Worker } from '../types'

interface WorkerCardProps {
  worker: Worker
}

export default function WorkerCard({ worker }: WorkerCardProps) {
  const isNotified = worker.status === 'notified'
  const isSafe = worker.status === 'safe'

  return (
    <div className="p-3 rounded-xl bg-[#141B20] border border-slate-800 text-xs flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-semibold text-xs shrink-0">
          {worker.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <span className="font-medium text-slate-200 text-xs block truncate">
            {worker.name}
          </span>
          <span className="text-[11px] text-slate-500 block truncate font-mono">
            {worker.phone_number} · <span className="uppercase text-slate-400">{worker.preferred_language || 'en'}</span>
          </span>
        </div>
      </div>

      <span
        className={
          isNotified
            ? 'badge-rose text-[10px] uppercase font-semibold'
            : isSafe
            ? 'badge-emerald text-[10px] uppercase font-semibold'
            : 'badge-amber text-[10px] uppercase font-semibold'
        }
      >
        {isNotified ? 'Alerted' : isSafe ? 'Safe' : 'Cooling'}
      </span>
    </div>
  )
}
