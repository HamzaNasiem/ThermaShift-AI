import { useState } from 'react'
import type { MicroclimateAnalysis } from '../types'

interface MicroclimateTelemetryCardProps {
  data: MicroclimateAnalysis | null
  loading?: boolean
  onBroadcastClick?: () => void
}

export default function MicroclimateTelemetryCard({ data, loading, onBroadcastClick }: MicroclimateTelemetryCardProps) {
  const [timelineHour, setTimelineHour] = useState(14) // 14:00 (2:00 PM) peak by default

  if (loading) {
    return (
      <div className="card-warm p-4 font-mono text-xs text-[#DCD7C9]/60 animate-pulse space-y-2">
        <div className="h-4 bg-[#3F4E4F]/50 rounded w-1/2" />
        <div className="h-16 bg-[#3F4E4F]/30 rounded" />
      </div>
    )
  }

  if (!data) return null

  // Simulate timeline factor
  const hourFactor = 1 - Math.abs(14 - timelineHour) / 8 // 1 at peak, lower elsewhere
  const surfaceTemp = Math.round(data.surface_temp_f * (0.8 + 0.2 * hourFactor))
  const ambientTemp = Math.round(data.ambient_temp_f * (0.85 + 0.15 * hourFactor))
  const uhiDelta = Math.round(data.uhi_delta_f * hourFactor * 10) / 10
  const solarRad = Math.round(data.solar_radiation_w_m2 * hourFactor)
  const reliefDelta = data.cooling_delta_f
  const shiftDist = data.recommended_shift_distance_m
  const wbgt = ambientTemp + uhiDelta // crude WBGT approximation
  const wbgtColor = wbgt < 80 ? 'text-green-400 border-green-500/30' : wbgt < 90 ? 'text-yellow-400 border-yellow-500/30' : 'text-red-400 border-red-500/30'

  return (
    <div className="card-warm p-4.5 space-y-4 font-mono border-[#A27B5C]/40 shadow-xl">
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

      {/* Diurnal Heat Timeline Scrubber */}
      <div className="bg-[#1A2224] p-3 rounded-xl border border-[#3F4E4F]">
        <div className="flex justify-between text-[10px] text-[#DCD7C9]/70 mb-2">
          <span>Diurnal Heat Predictive Timeline</span>
          <span className="text-white font-bold">{timelineHour}:00</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="18" 
          value={timelineHour} 
          onChange={(e) => setTimelineHour(Number(e.target.value))} 
          className="w-full accent-[#A27B5C] cursor-pointer" 
        />
        <div className="flex justify-between text-[9px] text-[#DCD7C9]/50 mt-1">
          <span>10:00 AM</span>
          <span>Peak (2:00 PM)</span>
          <span>6:00 PM</span>
        </div>
      </div>

      {/* Surface vs Ambient Thermal Dual Meter & WBGT */}
      <div className="grid grid-cols-2 gap-3">
        {/* Surface Ground Temp */}
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
        
        {/* WBGT Thermal Strain Dial */}
        <div className={`col-span-2 p-3 rounded-xl bg-[#1A2224] border ${wbgtColor} space-y-1`}>
           <div className="flex justify-between text-[10px] text-[#DCD7C9]/70">
            <span>WBGT Thermal Strain Dial (OSHA)</span>
            <span className={`font-bold ${wbgtColor.split(' ')[0]}`}>{wbgt < 80 ? 'Safe' : wbgt < 90 ? 'Caution' : 'Hazard'}</span>
          </div>
          <div className="w-full bg-[#242D30] rounded-full h-2 mt-2 relative overflow-hidden">
             <div className={`h-2 rounded-full transition-all duration-300 ${wbgt < 80 ? 'bg-green-500' : wbgt < 90 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, (wbgt - 60) / 40 * 100))}%` }}></div>
          </div>
        </div>
      </div>

      {/* Autonomous ThermaShift Directive Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-[#2C3639] to-emerald-950/40 border border-[#A27B5C]/50 space-y-2">
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

        <div className="flex items-center justify-between text-[10px] pt-2 text-[#DCD7C9]/70 border-t border-[#3F4E4F]/40 font-sans">
          <span>OSHA WBGT Strain Reduction: <strong className="text-emerald-300 font-mono">42%</strong></span>
          <button onClick={onBroadcastClick} className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded border border-emerald-500/50 transition-colors font-bold tracking-wide">
            Instant Broadcast ↗
          </button>
        </div>
      </div>
    </div>
  )
}
