import type { MicroclimateAnalysis } from '../types'

interface MicroclimateTelemetryCardProps {
  data: MicroclimateAnalysis | null
  loading?: boolean
}

export default function MicroclimateTelemetryCard({ data, loading }: MicroclimateTelemetryCardProps) {
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

  return (
    <div className="card-warm p-4.5 space-y-3.5 font-mono border-[#A27B5C]/40 shadow-xl">
      {/* Header with FortyGuard Hyperlocal Badge */}
      <div className="flex items-center justify-between border-b border-[#3F4E4F]/40 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">🔬</span>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              FortyGuard Microclimate Intelligence
            </h3>
            <span className="text-[10px] text-[#A27B5C] font-semibold">
              Surface vs Ambient Thermal Matrix (100m Grid)
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-lg bg-[#A27B5C]/20 border border-[#A27B5C]/40 text-[#A27B5C] text-[10px] font-bold">
          High-Res Physics Engine
        </span>
      </div>

      {/* Surface vs Ambient Thermal Dual Meter */}
      <div className="grid grid-cols-2 gap-3">
        {/* Surface Ground Temp (Asphalt/Concrete) */}
        <div className="p-3 rounded-xl bg-[#1A2224] border border-red-500/30 space-y-1">
          <div className="flex justify-between text-[10px] text-[#DCD7C9]/70">
            <span>Ground / Asphalt</span>
            <span className="text-red-400 font-bold">Surface Heat</span>
          </div>
          <div className="text-xl font-black text-red-400 tracking-tight">
            {surfaceTemp}°F
          </div>
          <div className="text-[9px] text-red-300/80 font-sans">
            Urban Heat Island load: <span className="font-bold font-mono">+{uhiDelta}°F</span>
          </div>
        </div>

        {/* Ambient Air Temp */}
        <div className="p-3 rounded-xl bg-[#1A2224] border border-[#3F4E4F] space-y-1">
          <div className="flex justify-between text-[10px] text-[#DCD7C9]/70">
            <span>Ambient Air</span>
            <span className="text-yellow-400 font-bold">Weather Sensor</span>
          </div>
          <div className="text-xl font-black text-yellow-300 tracking-tight">
            {ambientTemp}°F
          </div>
          <div className="text-[9px] text-[#DCD7C9]/60 font-sans">
            Solar Load: <span className="font-bold text-white font-mono">{solarRad} W/m²</span>
          </div>
        </div>
      </div>

      {/* Autonomous ThermaShift Directive Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-[#2C3639] to-emerald-950/40 border border-[#A27B5C]/50 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-[#A27B5C] uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous ThermaShift Escape Vector
          </span>
          <span className="text-emerald-400 font-bold">
            -{reliefDelta}°F Thermal Relief
          </span>
        </div>

        <p className="text-xs text-white font-sans leading-relaxed">
          <span className="font-bold text-red-400 font-mono">{data.hotspot_zone}</span>
          <span className="text-[#DCD7C9]/80"> ➔ Relocate workforce to </span>
          <span className="font-bold text-emerald-400 font-mono">{data.cooling_refuge}</span>
          <span className="text-[#DCD7C9]/70"> ({shiftDist}m vector distance).</span>
        </p>

        <div className="flex items-center justify-between text-[10px] pt-1 text-[#DCD7C9]/70 border-t border-[#3F4E4F]/40 font-sans">
          <span>OSHA WBGT Strain Reduction: <strong className="text-emerald-300 font-mono">42%</strong></span>
          <span className="text-[#A27B5C] font-mono font-bold">Vector Active on Radar ↗</span>
        </div>
      </div>
    </div>
  )
}
