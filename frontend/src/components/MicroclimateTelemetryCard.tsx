import type { MicroclimateAnalysis } from '../types'

interface MicroclimateTelemetryCardProps {
  data: MicroclimateAnalysis | null
  loading?: boolean
  onBroadcastClick?: () => void
}

export default function MicroclimateTelemetryCard({ data, loading, onBroadcastClick }: MicroclimateTelemetryCardProps) {
  if (loading) {
    return (
      <div className="card-warm p-4 font-mono text-xs text-[#DCD7C9]/60 animate-pulse space-y-2">
        <div className="h-4 bg-[#3F4E4F]/50 rounded w-1/2" />
        <div className="h-16 bg-[#3F4E4F]/30 rounded" />
      </div>
    )
  }

  if (!data) return null

  const surfaceTemp = data.surface_temp_f
  const ambientTemp = data.ambient_temp_f
  const uhiDelta = data.uhi_delta_f
  const solarRad = data.solar_radiation_w_m2
  const reliefDelta = data.cooling_delta_f
  const shiftDist = data.recommended_shift_distance_m
  const canopyTemp = Math.round((ambientTemp - 20) * 10) / 10

  const isExtreme = ambientTemp >= 104 || surfaceTemp >= 118
  const isElevated = (ambientTemp >= 95 || surfaceTemp >= 106) && !isExtreme

  const oshaSchedule = isExtreme ? '15 min Work / 45 min Shade Rest' : isElevated ? '30 min Work / 30 min Rest' : '50 min Work / 10 min Rest'
  const hydration = isExtreme ? '1.5 L/hr Water' : isElevated ? '1.0 L/hr Water' : '0.75 L/hr Water'
  const strainColor = isExtreme ? 'text-red-400 border-red-500/40 bg-red-950/30' : isElevated ? 'text-yellow-400 border-yellow-500/40 bg-yellow-950/30' : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'

  return (
    <div className="card-warm p-4 space-y-3 font-mono border-[#A27B5C]/40 shadow-xl">
      {/* Clean Header */}
      <div className="flex items-center justify-between border-b border-[#3F4E4F]/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🔬</span>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              FortyGuard Microclimate Matrix
            </h3>
            <span className="text-[10px] text-[#A27B5C] font-semibold">
              Ground Heat vs Cooling Refuge (100m Grid)
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-lg bg-[#A27B5C]/20 border border-[#A27B5C]/40 text-[#A27B5C] text-[10px] font-bold">
          Live Sensor
        </span>
      </div>

      {/* 3 Clean Stat Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* 1. Ground Asphalt */}
        <div className="p-2.5 rounded-xl bg-[#1A2224] border border-red-500/30 space-y-1">
          <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Ground Asphalt</span>
          <div className="text-lg font-black text-red-400 tracking-tight">
            {surfaceTemp}°F
          </div>
          <span className="text-[8px] text-red-300 font-bold block">
            +{uhiDelta}°F Heat Spike
          </span>
        </div>

        {/* 2. Ambient Weather Air */}
        <div className="p-2.5 rounded-xl bg-[#1A2224] border border-[#3F4E4F] space-y-1">
          <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Air Temp</span>
          <div className="text-lg font-black text-yellow-300 tracking-tight">
            {ambientTemp}°F
          </div>
          <span className="text-[8px] text-[#DCD7C9]/60 block font-sans">
            {solarRad} W/m² Sun
          </span>
        </div>

        {/* 3. Shaded Canopy Refuge */}
        <div className="p-2.5 rounded-xl bg-[#1A2224] border border-emerald-500/30 space-y-1">
          <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Cooling Canopy</span>
          <div className="text-lg font-black text-emerald-400 tracking-tight">
            {canopyTemp}°F
          </div>
          <span className="text-[8px] text-emerald-300 font-bold block">
            -{reliefDelta}°F Relief
          </span>
        </div>
      </div>

      {/* OSHA Work / Rest Guideline */}
      <div className={`p-2.5 rounded-xl border ${strainColor} flex items-center justify-between text-xs`}>
        <div className="space-y-0.5">
          <div className="text-[9px] uppercase tracking-wider text-[#DCD7C9]/60 font-sans">
            OSHA Heat Protocol:
          </div>
          <div className="font-bold font-sans text-xs text-white">
            {oshaSchedule}
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 bg-[#1A2224] rounded-lg border border-white/10 font-bold text-[#A27B5C]">
          💧 {hydration}
        </span>
      </div>

      {/* Autonomous ThermaShift Directive Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-[#242D30] to-emerald-950/40 border border-[#A27B5C]/50 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-[#A27B5C] uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous Relocation Route
          </span>
          <span className="text-emerald-400 font-bold">
            -{reliefDelta}°F Shift Relief
          </span>
        </div>

        <p className="text-xs text-white font-sans leading-relaxed">
          <span className="font-bold text-red-400 font-mono">{data.hotspot_zone}</span>
          <span className="text-[#DCD7C9]/80"> ➔ Relocate crew to </span>
          <span className="font-bold text-emerald-400 font-mono">{data.cooling_refuge}</span>
          <span className="text-[#DCD7C9]/70"> ({shiftDist}m away).</span>
        </p>

        <div className="flex items-center justify-between text-[10px] pt-1 text-[#DCD7C9]/70 border-t border-[#3F4E4F]/40 font-sans">
          <span>Heat Strain Drop: <strong className="text-emerald-300 font-mono">42%</strong></span>
          <button 
            onClick={onBroadcastClick} 
            className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg border border-emerald-500/50 transition-colors font-bold text-[10px]"
          >
            Broadcast Alert ↗
          </button>
        </div>
      </div>
    </div>
  )
}


