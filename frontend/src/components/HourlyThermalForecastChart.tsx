import { useState } from 'react'
import type { HourlyForecastPoint } from '../types'

interface HourlyThermalForecastChartProps {
  data: HourlyForecastPoint[]
}

export function HourlyThermalForecastChart({ data }: HourlyThermalForecastChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return null
  }

  const width = 800
  const height = 260
  const margin = { top: 20, right: 30, bottom: 50, left: 45 }

  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const allTemps = data.flatMap((d) => [d.surface_temp_f, d.ambient_temp_f, d.canopy_temp_f])
  const maxTemp = Math.max(...allTemps, 130)
  const minTemp = Math.min(...allTemps, 70)

  const getX = (index: number) => margin.left + (index / (data.length - 1 || 1)) * innerWidth
  const getY = (temp: number) => margin.top + innerHeight - ((temp - minTemp) / (maxTemp - minTemp || 1)) * innerHeight

  const surfacePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.surface_temp_f)}`).join(' ')
  const airPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.ambient_temp_f)}`).join(' ')
  const canopyPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.canopy_temp_f)}`).join(' ')

  const getOshaBadge = (ratio: string) => {
    switch (ratio) {
      case '15/45':
        return 'bg-red-950/60 text-red-300 border-red-500/50'
      case '30/30':
        return 'bg-orange-950/60 text-orange-300 border-orange-500/50'
      case '50/10':
        return 'bg-yellow-950/60 text-yellow-300 border-yellow-500/50'
      default:
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
    }
  }

  return (
    <div className="card-warm p-5 font-mono space-y-4 border-[#3F4E4F] shadow-2xl">
      <div className="flex flex-wrap items-center justify-between border-b border-[#3F4E4F]/40 pb-3 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white uppercase font-sans tracking-wide">
            FortyGuard Diurnal Heat Curve & OSHA Shift Trajectory (09:00 - 18:00)
          </h3>
          <span className="text-[10px] text-[#A27B5C] font-semibold">
            Hourly Asphalt Thermal Absorption vs Shaded Canopy Microclimate
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="text-red-400 font-bold">Surface Asphalt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className="text-yellow-300 font-bold">Ambient Air</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span className="text-emerald-400 font-bold">Canopy Refuge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-400/50 animate-pulse" />
            <span className="text-purple-300 font-bold">Recorded Snapshots</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[650px]">
          {/* Y Axis Grid Lines */}
          {[...Array(5)].map((_, i) => {
            const temp = minTemp + (i / 4) * (maxTemp - minTemp)
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={getY(temp)}
                  x2={width - margin.right}
                  y2={getY(temp)}
                  stroke="#3F4E4F"
                  strokeOpacity="0.4"
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left - 8}
                  y={getY(temp)}
                  fill="#DCD7C9"
                  opacity="0.6"
                  fontSize="10"
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontFamily="monospace"
                >
                  {Math.round(temp)}°F
                </text>
              </g>
            )
          })}

          {/* Area Fill Gradient under Surface curve */}
          <path
            d={`${surfacePath} L ${getX(data.length - 1)} ${height - margin.bottom} L ${getX(0)} ${height - margin.bottom} Z`}
            fill="rgba(239, 68, 68, 0.08)"
          />

          {/* Spline Paths */}
          <path d={surfacePath} fill="none" stroke="#EF4444" strokeWidth="2.5" />
          <path d={airPath} fill="none" stroke="#F59E0B" strokeWidth="2.5" />
          <path d={canopyPath} fill="none" stroke="#10B981" strokeWidth="2.5" />

          {/* Points & Interactive Hover Columns */}
          {data.map((d, i) => {
            const isRecorded = d.point_type === 'recorded'
            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={getX(i) - innerWidth / (data.length * 2)}
                  y={margin.top}
                  width={innerWidth / data.length}
                  height={innerHeight}
                  fill="transparent"
                />

                {hoverIdx === i && (
                  <line
                    x1={getX(i)}
                    y1={margin.top}
                    x2={getX(i)}
                    y2={height - margin.bottom}
                    stroke="#A27B5C"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* If recorded snapshot, render special glowing halo */}
                {isRecorded && (
                  <circle
                    cx={getX(i)}
                    cy={getY(d.ambient_temp_f)}
                    r={9}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="2"
                    className="animate-ping opacity-60"
                  />
                )}

                <circle cx={getX(i)} cy={getY(d.surface_temp_f)} r={hoverIdx === i ? 5 : 3.5} fill="#EF4444" />
                <circle cx={getX(i)} cy={getY(d.ambient_temp_f)} r={hoverIdx === i ? 5 : (isRecorded ? 4.5 : 3.5)} fill={isRecorded ? '#A855F7' : '#F59E0B'} />
                <circle cx={getX(i)} cy={getY(d.canopy_temp_f)} r={hoverIdx === i ? 5 : 3.5} fill="#10B981" />

                {/* X Axis Time Labels */}
                <text
                  x={getX(i)}
                  y={height - margin.bottom + 18}
                  fill={isRecorded ? '#A855F7' : '#DCD7C9'}
                  fontWeight={isRecorded ? 'bold' : 'normal'}
                  opacity={isRecorded ? 1 : 0.8}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {d.time_label || `${d.hour}:00`}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoverIdx !== null && data[hoverIdx] && (
          <div
            className="absolute bg-[#1A2224]/95 backdrop-blur-md border border-[#A27B5C] p-3 rounded-xl shadow-2xl text-xs text-[#DCD7C9] pointer-events-none z-10 space-y-1 w-64 font-mono"
            style={{
              left: Math.min(Math.max(getX(hoverIdx) - 100, 10), width - 270) + 'px',
              top: '10px'
            }}
          >
            <div className="font-bold text-white border-b border-[#3F4E4F] pb-1 flex justify-between">
              <span>{data[hoverIdx].time_label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${data[hoverIdx].point_type === 'recorded' ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40' : 'text-[#A27B5C]'}`}>
                {data[hoverIdx].point_type === 'recorded' ? '🟣 DB Snapshot' : '📈 Diurnal Model'}
              </span>
            </div>
            <div className="text-red-400 flex justify-between">
              <span>Ground Asphalt:</span>
              <strong>{data[hoverIdx].surface_temp_f}°F</strong>
            </div>
            <div className="text-yellow-300 flex justify-between">
              <span>Ambient Weather:</span>
              <strong>{data[hoverIdx].ambient_temp_f}°F</strong>
            </div>
            <div className="text-emerald-400 flex justify-between">
              <span>Shaded Canopy:</span>
              <strong>{data[hoverIdx].canopy_temp_f}°F</strong>
            </div>
            <div className="pt-1 text-[10px] text-[#DCD7C9]/60 border-t border-[#3F4E4F]/40 flex justify-between">
              <span>Solar: {data[hoverIdx].solar_radiation_w_m2} W/m²</span>
              <span className="text-white font-bold">OSHA: {data[hoverIdx].work_rest_ratio}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom OSHA Shift Schedule Badges */}
      <div className="flex overflow-x-auto gap-2 pt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 min-w-[65px] text-center space-y-0.5">
            <div className={`text-[10px] font-bold py-1 px-1 rounded-lg border ${getOshaBadge(d.work_rest_ratio)}`}>
              {d.work_rest_ratio}
            </div>
            <span className="text-[8px] text-[#DCD7C9]/50 block">{d.time_label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

