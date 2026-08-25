import type { MicroclimateAnalysis } from '../types'

interface MicroclimateTelemetryCardProps {
  data: MicroclimateAnalysis | null
  loading?: boolean
  onBroadcastClick?: () => void
}

export default function MicroclimateTelemetryCard({ data, loading, onBroadcastClick }: MicroclimateTelemetryCardProps) {
  if (loading) {
    return (
      <div className="card-surface p-4 text-xs text-slate-400 animate-pulse space-y-3">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="h-20 bg-slate-100 rounded-xl" />
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
  
  const statusColor = isExtreme 
    ? 'border-rose-200 bg-rose-50 text-rose-800' 
    : isElevated 
    ? 'border-amber-200 bg-amber-50 text-amber-900' 
    : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  return (
    <div className="card-surface p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
        <div>
          <h3 className="text-xs font-bold text-[#141414] tracking-tight">
            Microclimate Telemetry
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            FortyGuard Surface vs Shaded Canopy Physics
          </p>
        </div>
        <span className="badge-slate text-[10px] font-semibold">
          100m Sensor Grid
        </span>
      </div>

      {/* 3 Stat Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* 1. Ground Asphalt */}
        <div className="p-2.5 rounded-xl bg-[#f9fafb] border border-rose-200">
          <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">Asphalt Ground</span>
          <div className="text-xl font-black text-rose-600 tracking-tight tabular-nums">
            {surfaceTemp}°F
          </div>
          <span className="text-[9px] text-rose-700 font-bold">
            +{uhiDelta}°F UHI Penalty
          </span>
        </div>

        {/* 2. Ambient Weather Air */}
        <div className="p-2.5 rounded-xl bg-[#f9fafb] border border-slate-200">
          <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">Air Temp</span>
          <div className="text-xl font-black text-amber-600 tracking-tight tabular-nums">
            {ambientTemp}°F
          </div>
          <span className="text-[9px] text-slate-500 font-medium">
            {solarRad} W/m² Sun
          </span>
        </div>

        {/* 3. Shaded Canopy Refuge */}
        <div className="p-2.5 rounded-xl bg-[#f9fafb] border border-emerald-200">
          <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">Canopy Refuge</span>
          <div className="text-xl font-black text-emerald-600 tracking-tight tabular-nums">
            {canopyTemp}°F
          </div>
          <span className="text-[9px] text-emerald-700 font-bold">
            -{reliefDelta}°F Cooling
          </span>
        </div>
      </div>

      {/* OSHA Protocol */}
      <div className={`p-3 rounded-xl border ${statusColor} flex items-center justify-between text-xs`}>
        <div>
          <span className="text-[10px] font-bold opacity-75 block uppercase tracking-wider">
            Mandated Work/Rest Ratio
          </span>
          <span className="font-bold text-[#141414] text-xs">
            {oshaSchedule}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold opacity-75 block uppercase tracking-wider">
            Hydration
          </span>
          <span className="font-bold text-sky-700 text-xs">
            {hydration}
          </span>
        </div>
      </div>

      {/* Relocation Route Card */}
      <div className="p-3 rounded-xl bg-[#f9fafb] border border-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#141414]">
            Relocation Vector
          </span>
          <span className="text-[10px] font-bold text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
            -{reliefDelta}°F Relief
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
          Zone A (Unshaded Asphalt) → Shift crew to Zone D (Shaded Canopy) ({shiftDist}m distance).
        </p>

        {onBroadcastClick && (
          <button
            onClick={onBroadcastClick}
            className="w-full mt-1 py-1.5 rounded-lg bg-[#ffffff] hover:bg-slate-100 text-[#141414] text-[11px] font-semibold transition-colors border border-slate-200 shadow-sm"
          >
            Dispatch Relocation Directive
          </button>
        )}
      </div>
    </div>
  )
}
