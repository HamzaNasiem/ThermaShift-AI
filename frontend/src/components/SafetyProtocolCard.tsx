import type { RiskLevel } from '../types'

interface SafetyProtocolCardProps {
  temperatureF: number
  riskLevel: RiskLevel
}

export default function SafetyProtocolCard({ temperatureF, riskLevel }: SafetyProtocolCardProps) {
  const isExtreme = riskLevel === 'extreme' || temperatureF >= 108
  const isElevated = riskLevel === 'elevated' || (temperatureF >= 100 && temperatureF < 108)

  return (
    <div className="card-warm p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#3F4E4F]/60 pb-2">
        <div>
          <h3 className="text-xs font-bold text-white uppercase">OSHA & ILO Heat Protocols</h3>
          <span className="text-[10px] text-[#A27B5C]">Automated Physiological Thresholds</span>
        </div>
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
          isExtreme
            ? 'bg-red-900/40 text-red-400 border-red-500/40'
            : isElevated
            ? 'bg-amber-900/40 text-amber-400 border-amber-500/40'
            : 'bg-emerald-900/40 text-emerald-400 border-emerald-500/40'
        }`}>
          {isExtreme ? 'EMERGENCY' : isElevated ? 'CAUTION' : 'NORMAL'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-[#1E2628] border border-[#3F4E4F]/40 space-y-1">
          <span className="text-[10px] text-[#DCD7C9]/60 block uppercase">Work/Rest Cycle:</span>
          <span className="font-bold text-white text-xs">
            {isExtreme ? '15 min work / 45 min shade' : isElevated ? '30 min work / 30 min rest' : '50 min work / 10 min rest'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1E2628] border border-[#3F4E4F]/40 space-y-1">
          <span className="text-[10px] text-[#DCD7C9]/60 block uppercase">Hydration Quota:</span>
          <span className="font-bold text-[#A27B5C] text-xs">
            {isExtreme ? '1.0 Liter / hour' : isElevated ? '0.75 Liter / hour' : '0.50 Liter / hour'}
          </span>
        </div>
      </div>
    </div>
  )
}
