import { useState } from 'react';
import { HourlyForecastPoint } from '../types';

interface HourlyThermalForecastChartProps {
  data: HourlyForecastPoint[];
}

export function HourlyThermalForecastChart({ data }: HourlyThermalForecastChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 800;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 60, left: 50 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // X scale: 0 to data.length - 1
  // Y scale: minTemp - 5 to maxTemp + 5
  
  const allTemps = data.flatMap(d => [d.surface_temp_f, d.air_temp_f, d.refuge_temp_f]);
  const maxTemp = Math.max(...allTemps, 130);
  const minTemp = Math.min(...allTemps, 70);

  const getX = (index: number) => margin.left + (index / (data.length - 1 || 1)) * innerWidth;
  const getY = (temp: number) => margin.top + innerHeight - ((temp - minTemp) / (maxTemp - minTemp)) * innerHeight;

  const surfacePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.surface_temp_f)}`).join(' ');
  const airPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.air_temp_f)}`).join(' ');
  const refugePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.refuge_temp_f)}`).join(' ');

  const getOshaColor = (schedule: string) => {
    switch(schedule) {
      case '15/45': return 'bg-red-900/50 text-red-300 border-red-700';
      case '30/30': return 'bg-orange-900/50 text-orange-300 border-orange-700';
      case '50/10': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      default: return 'bg-green-900/50 text-green-300 border-green-700';
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h3 className="text-xl font-bold text-white mb-6">Thermal Forecast & OSHA Schedules</h3>
      
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px]">
          {/* Y Axis */}
          {[...Array(6)].map((_, i) => {
            const temp = minTemp + (i / 5) * (maxTemp - minTemp);
            return (
              <g key={i}>
                <line 
                  x1={margin.left} y1={getY(temp)} 
                  x2={width - margin.right} y2={getY(temp)} 
                  stroke="#374151" strokeDasharray="4 4" 
                />
                <text x={margin.left - 10} y={getY(temp)} fill="#9CA3AF" fontSize="12" textAnchor="end" dominantBaseline="middle">
                  {Math.round(temp)}°F
                </text>
              </g>
            );
          })}

          {/* Paths */}
          <path d={surfacePath} fill="none" stroke="#EF4444" strokeWidth="3" />
          <path d={airPath} fill="none" stroke="#F59E0B" strokeWidth="3" />
          <path d={refugePath} fill="none" stroke="#10B981" strokeWidth="3" />

          {/* Points & Interactions */}
          {data.map((d, i) => (
            <g 
              key={i} 
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              {/* Invisible interaction rect */}
              <rect 
                x={getX(i) - innerWidth / (data.length * 2)} 
                y={margin.top} 
                width={innerWidth / data.length} 
                height={innerHeight} 
                fill="transparent" 
              />
              
              {hoverIdx === i && (
                <line 
                  x1={getX(i)} y1={margin.top} 
                  x2={getX(i)} y2={height - margin.bottom} 
                  stroke="#6B7280" strokeWidth="1" strokeDasharray="4 4"
                />
              )}

              <circle cx={getX(i)} cy={getY(d.surface_temp_f)} r={hoverIdx === i ? 6 : 4} fill="#EF4444" />
              <circle cx={getX(i)} cy={getY(d.air_temp_f)} r={hoverIdx === i ? 6 : 4} fill="#F59E0B" />
              <circle cx={getX(i)} cy={getY(d.refuge_temp_f)} r={hoverIdx === i ? 6 : 4} fill="#10B981" />

              {/* X Axis Labels */}
              <text x={getX(i)} y={height - margin.bottom + 20} fill="#9CA3AF" fontSize="12" textAnchor="middle">
                {d.hour}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoverIdx !== null && (
          <div 
            className="absolute bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl text-sm pointer-events-none z-10"
            style={{
              left: Math.min(Math.max(getX(hoverIdx) - 100, 0), width - 200) + 'px',
              top: '20px'
            }}
          >
            <div className="font-bold text-white mb-2">{data[hoverIdx].hour} Details</div>
            <div className="text-red-400">Surface: {data[hoverIdx].surface_temp_f}°F</div>
            <div className="text-yellow-400">Air: {data[hoverIdx].air_temp_f}°F</div>
            <div className="text-green-400">Refuge: {data[hoverIdx].refuge_temp_f}°F</div>
            <div className="mt-2 text-gray-300 text-xs border-t border-gray-700 pt-2">
              <div>Solar: {data[hoverIdx].solar_radiation_w_m2} W/m²</div>
              <div>Hydration: {data[hoverIdx].hydration_liters_per_hour} L/hr</div>
            </div>
          </div>
        )}
      </div>

      {/* OSHA Cards */}
      <div className="mt-4 flex overflow-x-auto gap-2 pb-2 pl-[50px] pr-[30px]">
        {data.map((d, i) => (
          <div key={i} className="flex-1 min-w-[70px] text-center">
            <div className={`text-xs font-semibold py-1 px-1 rounded border ${getOshaColor(d.osha_schedule)}`}>
              {d.osha_schedule}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-300">Surface Asphalt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-300">Ambient Air</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-300">Covered Refuge</span>
        </div>
      </div>
    </div>
  );
}
