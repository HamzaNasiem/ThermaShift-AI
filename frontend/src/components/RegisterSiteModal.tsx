import { useState } from 'react'
import type { Site } from '../types'

interface RegisterSiteModalProps {
  onSiteCreated: (site: Site) => void
  onClose: () => void
}

const PRESET_LOCATIONS = [
  { name: 'Fresno Solar & Ag Field, CA', lat: 36.7468, lng: -119.7726 },
  { name: 'Port of Los Angeles Terminal, CA', lat: 33.7432, lng: -118.2673 },
  { name: 'Bakersfield Energy Field, CA', lat: 35.3733, lng: -119.0187 },
  { name: 'Imperial Valley Agricultural Yard, CA', lat: 32.9787, lng: -115.5303 },
  { name: 'Sacramento Heavy Logistics, CA', lat: 38.5816, lng: -121.4944 },
  { name: 'Phoenix Sky Harbor Cargo, AZ', lat: 33.4352, lng: -112.0101 },
]

export default function RegisterSiteModal({ onSiteCreated, onClose }: RegisterSiteModalProps) {
  const [name, setName] = useState('')
  const [lat, setLat] = useState('36.7468')
  const [lng, setLng] = useState('-119.7726')
  const [radiusKm, setRadiusKm] = useState('1.0')
  const [elevatedF, setElevatedF] = useState('100')
  const [extremeF, setExtremeF] = useState('108')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handlePresetSelect(preset: typeof PRESET_LOCATIONS[0]) {
    setName(preset.name)
    setLat(preset.lat.toString())
    setLng(preset.lng.toString())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !lat || !lng) return
    setLoading(true)
    setError(null)

    const centerLat = parseFloat(lat)
    const centerLng = parseFloat(lng)
    const size = parseFloat(radiusKm)

    const dlat = (size / 2) / 111.0
    const dlng = (size / 2) / (111.0 * Math.cos((centerLat * Math.PI) / 180))

    const polygon_geojson = {
      type: 'Polygon',
      coordinates: [[
        [Math.round((centerLng - dlng) * 1e6) / 1e6, Math.round((centerLat - dlat) * 1e6) / 1e6],
        [Math.round((centerLng + dlng) * 1e6) / 1e6, Math.round((centerLat - dlat) * 1e6) / 1e6],
        [Math.round((centerLng + dlng) * 1e6) / 1e6, Math.round((centerLat + dlat) * 1e6) / 1e6],
        [Math.round((centerLng - dlng) * 1e6) / 1e6, Math.round((centerLat + dlat) * 1e6) / 1e6],
        [Math.round((centerLng - dlng) * 1e6) / 1e6, Math.round((centerLat - dlat) * 1e6) / 1e6],
      ]]
    }

    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          polygon_geojson,
          elevated_threshold_f: parseFloat(elevatedF),
          extreme_threshold_f: parseFloat(extremeF),
        })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `Failed to create site: ${res.statusText}`)
      }

      const site = await res.json()
      onSiteCreated(site)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#2C3639] text-[#DCD7C9] border-2 border-[#A27B5C] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3F4E4F] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A27B5C] flex items-center justify-center text-white text-xl">
              Pin
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Register Exact Work Site AOI
              </h2>
              <p className="text-[10px] text-[#A27B5C] font-mono tracking-wider uppercase font-semibold">
                Pinpoint Coordinates for FortyGuard Microclimate Polling
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#DCD7C9]/70 hover:text-white text-xl font-bold font-mono px-2 py-1">
            ✕
          </button>
        </div>

        <div className="space-y-1.5 font-mono text-xs">
          <span className="text-[10px] text-[#A27B5C] uppercase font-bold block">Quick California & US Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="px-2.5 py-1 rounded-lg bg-[#3F4E4F]/60 hover:bg-[#A27B5C] text-[#DCD7C9] hover:text-white text-[10px] border border-[#3F4E4F] transition-all"
              >
                {preset.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Work Site Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Central Valley Solar Plant 4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#3F4E4F] border border-[#A27B5C]/40 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Latitude (GPS)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-[#3F4E4F] border border-[#A27B5C]/40 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Longitude (GPS)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-[#3F4E4F] border border-[#A27B5C]/40 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Coverage Area</label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full bg-[#3F4E4F] border border-[#A27B5C]/40 text-white rounded-xl px-2.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
              >
                <option value="0.5">500m Yard</option>
                <option value="1.0">1.0 km Field</option>
                <option value="2.0">2.0 km Zone</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Caution (°F)</label>
              <input
                type="number"
                value={elevatedF}
                onChange={(e) => setElevatedF(e.target.value)}
                className="w-full bg-[#3F4E4F] border border-[#A27B5C]/40 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Extreme (°F)</label>
              <input
                type="number"
                value={extremeF}
                onChange={(e) => setExtremeF(e.target.value)}
                className="w-full bg-[#3F4E4F] border border-[#A27B5C]/40 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#3F4E4F]">
            <button type="button" onClick={onClose} className="btn-charcoal border border-[#3F4E4F]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-bronze flex items-center gap-2"
            >
              <span>{loading ? 'Creating Work Site...' : 'Pinpoint & Save Site'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
