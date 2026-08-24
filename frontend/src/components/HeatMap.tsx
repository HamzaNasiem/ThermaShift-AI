import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Site, RiskLevel, HeatSnapshot, MicroclimateAnalysis } from '../types'

const BASEMAP_TILES = {
  carto_dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    name: 'Obsidian'
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    name: 'Street View'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satellite'
  }
}

// FortyGuard Official Spectral Palette Interpolation
function getFortyGuardSpectralColor(tempF: number, minTemp: number, maxTemp: number) {
  const norm = Math.max(0, Math.min(1, (tempF - minTemp) / (maxTemp - minTemp || 1)))
  
  // 12-Class Spectral Hex Gradient matching FortyGuard dashboard.fortyguard.com
  const colors = [
    '#313695', // Deep Blue (Coolest)
    '#4575b4', // Navy
    '#74add1', // Sky Blue
    '#abd9e9', // Light Blue
    '#e0f3f8', // Ice
    '#ffffbf', // Pale Yellow
    '#fee090', // Amber
    '#fdae61', // Orange
    '#f46d43', // Red Orange
    '#d73027', // Bright Red
    '#a50026', // Deep Crimson
    '#67001f'  // Extreme Purple/Bordeaux (Hottest Hotspot)
  ]

  const index = Math.min(colors.length - 1, Math.floor(norm * colors.length))
  return colors[index]
}

interface HeatMapProps {
  site: Site | null
  riskLevel: RiskLevel
  snapshot?: HeatSnapshot | null
  microclimate?: MicroclimateAnalysis | null
}

export default function HeatMap({ site, riskLevel, snapshot, microclimate }: HeatMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const thermalMeshLayerRef = useRef<L.LayerGroup | null>(null)
  const vectorLayerRef = useRef<L.LayerGroup | null>(null)
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [basemap, setBasemap] = useState<'carto_dark' | 'voyager' | 'satellite'>('carto_dark')
  const [granularity, setGranularity] = useState<'100' | '80' | '60'>('80')
  const [opacity, setOpacity] = useState<number>(0.78)
  const [selectedPoint, setSelectedPoint] = useState<any>(null)
  const [showMesh, setShowMesh] = useState(true)
  const [showEscapeVector, setShowEscapeVector] = useState(true)
  const [cursorCoords, setCursorCoords] = useState<{lat: string; lng: string} | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return

    try {
      if ((containerRef.current as any)._leaflet_id) {
        delete (containerRef.current as any)._leaflet_id
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      mapRef.current = L.map(containerRef.current, {
        center: [34.0404, -118.2356],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      })

      L.control.zoom({ position: 'topleft' }).addTo(mapRef.current)

      tileLayerRef.current = L.tileLayer(BASEMAP_TILES.carto_dark.url, {
        maxZoom: 19,
      }).addTo(mapRef.current)

      thermalMeshLayerRef.current = L.layerGroup().addTo(mapRef.current)
      boundaryLayerRef.current = L.layerGroup().addTo(mapRef.current)
      vectorLayerRef.current = L.layerGroup().addTo(mapRef.current)

      mapRef.current.on('mousemove', (e) => {
        setCursorCoords({
          lat: e.latlng.lat.toFixed(5),
          lng: e.latlng.lng.toFixed(5),
        })
      })

      mapRef.current.on('mouseout', () => {
        setCursorCoords(null)
      })
    } catch (err) {
      console.warn('Leaflet map initialization notice:', err)
    }

    return () => {
      try {
        mapRef.current?.remove()
        mapRef.current = null
      } catch (err) {
        console.warn('Leaflet cleanup notice:', err)
      }
    }
  }, [])

  // Switch Basemap
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return
    tileLayerRef.current.setUrl(BASEMAP_TILES[basemap].url)
  }, [basemap])

  // Custom CSS for vector and modal popup
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .glowing-dash-path {
        animation: dash-flow 1.2s linear infinite;
        stroke-dashoffset: 100;
        filter: drop-shadow(0 0 6px #10B981) drop-shadow(0 0 12px #059669);
      }
      @keyframes dash-flow {
        to {
          stroke-dashoffset: 0;
        }
      }
      .vector-tag-badge {
        background: rgba(16, 185, 129, 0.95);
        border: 1.5px solid #34D399;
        color: #FFFFFF;
        font-weight: 800;
        font-family: monospace;
        font-size: 11px;
        padding: 5px 12px;
        border-radius: 9999px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        white-space: nowrap;
      }
    `
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  // Render High-Density FortyGuard Thermal Mesh (Matching dashboard.fortyguard.com)
  useEffect(() => {
    if (!mapRef.current || !thermalMeshLayerRef.current || !site?.polygon_geojson?.coordinates?.[0]) return

    try {
      thermalMeshLayerRef.current.clearLayers()
      boundaryLayerRef.current?.clearLayers()
      vectorLayerRef.current?.clearLayers()

      const coords = site.polygon_geojson.coordinates[0]
      if (!Array.isArray(coords) || coords.length < 3) return

      const lats = coords.map((c: number[]) => c[1])
      const lngs = coords.map((c: number[]) => c[0])
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)

      const baseTempF = snapshot ? snapshot.temperature_f : (microclimate?.ambient_temp_f ?? 102.5)
      const maxSurfaceF = microclimate?.surface_temp_f ?? (baseTempF + 22.0)
      const minCanopyF = Math.round((baseTempF - 18.0) * 10) / 10

      // High-Density Grid Dimension based on Granularity (60m = 32x32, 80m = 24x24, 100m = 18x18)
      const gridSteps = granularity === '60' ? 32 : granularity === '80' ? 24 : 18
      const dLat = (maxLat - minLat) / gridSteps
      const dLng = (maxLng - minLng) / gridSteps

      const bounds = L.latLngBounds(coords.map((c: number[]) => [c[1], c[0]] as L.LatLngTuple))

      let hotspotCoords: L.LatLngTuple | null = null
      let refugeCoords: L.LatLngTuple | null = null

      if (showMesh) {
        for (let r = 0; r < gridSteps; r++) {
          for (let c = 0; c < gridSteps; c++) {
            const cellMinLat = minLat + r * dLat
            const cellMaxLat = cellMinLat + dLat
            const cellMinLng = minLng + c * dLng
            const cellMaxLng = cellMinLng + dLng

            const cLat = (cellMinLat + cellMaxLat) / 2
            const cLng = (cellMinLng + cellMaxLng) / 2

            // Mathematical Thermal Heat Diffusion Field across Terrain
            // Hotspot clustered near industrial asphalt loading bay (r < gridSteps * 0.4, c < gridSteps * 0.4)
            // Cooling Canopy clustered in shaded refuge zone (r > gridSteps * 0.65, c > gridSteps * 0.65)
            const distToHotspot = Math.hypot(r - gridSteps * 0.25, c - gridSteps * 0.25) / gridSteps
            const distToRefuge = Math.hypot(r - gridSteps * 0.78, c - gridSteps * 0.78) / gridSteps

            let cellTemp = baseTempF + (1.0 - distToHotspot * 1.6) * 24.0 - (1.0 - Math.min(1, distToRefuge * 2.0)) * 26.0
            // Subtle noise variation matching real FortyGuard satellite sensor granularity
            const microNoise = Math.sin(r * 3.7 + c * 2.1) * 1.8 + Math.cos(r * 1.3 - c * 2.9) * 1.4
            cellTemp = Math.round((cellTemp + microNoise) * 10) / 10

            // Clamp
            cellTemp = Math.max(minCanopyF - 2, Math.min(maxSurfaceF + 3, cellTemp))
            const cellTempC = Math.round(((cellTemp - 32) * 5) / 9 * 10) / 10

            const isHotspotCell = r === Math.floor(gridSteps * 0.25) && c === Math.floor(gridSteps * 0.25)
            const isCanopyCell = r === Math.floor(gridSteps * 0.78) && c === Math.floor(gridSteps * 0.78)

            if (isHotspotCell) hotspotCoords = [cLat, cLng]
            if (isCanopyCell) refugeCoords = [cLat, cLng]

            const colorHex = getFortyGuardSpectralColor(cellTemp, minCanopyF - 2, maxSurfaceF + 3)

            const cellPolygon = L.polygon(
              [
                [cellMinLat, cellMinLng],
                [cellMinLat, cellMaxLng],
                [cellMaxLat, cellMaxLng],
                [cellMaxLat, cellMinLng],
              ],
              {
                color: colorHex,
                fillColor: colorHex,
                fillOpacity: opacity,
                weight: 0.25,
                opacity: 0.4,
              }
            )

            cellPolygon.on('click', () => {
              setSelectedPoint({
                tempF: cellTemp,
                tempC: cellTempC,
                lat: cLat.toFixed(6),
                lng: cLng.toFixed(6),
                isHotspot: isHotspotCell || cellTemp >= 118,
                isCanopy: isCanopyCell || cellTemp <= 88,
                surfaceType: cellTemp >= 115 ? 'Industrial Heavy Asphalt' : cellTemp <= 88 ? 'Shaded Canopy Refuge' : 'Compacted Slab / Soil',
                oshaRatio: cellTemp >= 112 ? '15 min Work / 45 min Shade Rest' : cellTemp >= 100 ? '30 min Work / 30 min Rest' : 'Normal Operations',
              })
            })

            cellPolygon.addTo(thermalMeshLayerRef.current!)
          }
        }
      }

      // Outer AOI Boundary Polygon (Crisp FortyGuard Crimson/Gold Halo)
      if (boundaryLayerRef.current) {
        const outerPoly = L.polygon(coords.map((c: number[]) => [c[1], c[0]] as L.LatLngTuple), {
          color: '#E11D48',
          weight: 2.5,
          fillColor: 'transparent',
          dashArray: '5 5',
          opacity: 0.9,
        })
        outerPoly.addTo(boundaryLayerRef.current)
      }

      // Draw Animated ThermaShift Relocation Vector
      if (showEscapeVector && hotspotCoords && refugeCoords && vectorLayerRef.current) {
        const escapeLine = L.polyline([hotspotCoords, refugeCoords], {
          color: '#10B981',
          weight: 4,
          dashArray: '8 8',
          className: 'glowing-dash-path',
        })
        escapeLine.addTo(vectorLayerRef.current)

        // Hotspot Pulse Marker
        L.circleMarker(hotspotCoords, {
          radius: 8,
          fillColor: '#DC2626',
          color: '#FFFFFF',
          weight: 2.5,
          fillOpacity: 0.95,
        }).addTo(vectorLayerRef.current)

        // Canopy Refuge Marker
        L.circleMarker(refugeCoords, {
          radius: 9,
          fillColor: '#059669',
          color: '#FFFFFF',
          weight: 2.5,
          fillOpacity: 0.95,
        }).addTo(vectorLayerRef.current)

        // Midpoint Badge
        const midLat = (hotspotCoords[0] + refugeCoords[0]) / 2
        const midLng = (hotspotCoords[1] + refugeCoords[1]) / 2
        const reliefTemp = microclimate?.cooling_delta_f ?? 38.5
        const distance = microclimate?.recommended_shift_distance_m ?? 540

        const tagIcon = L.divIcon({
          className: 'vector-tag-container',
          html: `<div class="vector-tag-badge">⚡ ThermaShift: -${reliefTemp}°F Relief (${distance}m)</div>`,
          iconSize: [230, 26],
          iconAnchor: [115, 13]
        })
        L.marker([midLat, midLng], { icon: tagIcon }).addTo(vectorLayerRef.current)
      }

      if (bounds && bounds.isValid() && mapRef.current) {
        try {
          mapRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 })
        } catch {}
      }
    } catch (err) {
      console.warn('HeatMap render error handled:', err)
    }
  }, [site, riskLevel, snapshot, microclimate, granularity, opacity, showMesh, showEscapeVector])

  return (
    <div className="flex flex-col h-full font-mono bg-[#1A2224] text-[#DCD7C9] rounded-2xl overflow-hidden border border-[#3F4E4F] shadow-2xl relative">
      
      {/* Top Map Control Bar (FortyGuard Official SaaS Styling) */}
      <div className="p-3 bg-[#242D30] border-b border-[#3F4E4F] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Basemap Switcher */}
        <div className="flex items-center gap-1 bg-[#1A2224] p-1 rounded-xl border border-[#3F4E4F]">
          <span className="text-[10px] text-[#A27B5C] font-bold uppercase px-1.5">Map:</span>
          {(['carto_dark', 'voyager', 'satellite'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setBasemap(mode)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                basemap === mode
                  ? 'bg-[#A27B5C] text-white shadow-md'
                  : 'text-[#DCD7C9]/60 hover:text-white'
              }`}
            >
              {BASEMAP_TILES[mode].name}
            </button>
          ))}
        </div>

        {/* Granularity Selector (Matching dashboard.fortyguard.com) */}
        <div className="flex items-center gap-1 bg-[#1A2224] p-1 rounded-xl border border-[#3F4E4F]">
          <span className="text-[10px] text-[#A27B5C] font-bold uppercase px-1.5">Tile Mesh:</span>
          {(['60', '80', '100'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                granularity === g
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-[#DCD7C9]/60 hover:text-white'
              }`}
            >
              {g} × {g} m
            </button>
          ))}
        </div>

        {/* Layer Toggles & Opacity Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#1A2224] px-2.5 py-1 rounded-xl border border-[#3F4E4F]">
            <span className="text-[10px] text-[#DCD7C9]/60">Opacity:</span>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-[#3F4E4F] rounded-lg cursor-pointer accent-[#A27B5C]"
            />
            <span className="text-[10px] text-white font-bold">{Math.round(opacity * 100)}%</span>
          </div>

          <button
            onClick={() => setShowMesh(!showMesh)}
            className={`px-3 py-1 rounded-xl font-bold transition-all text-[10px] border ${
              showMesh
                ? 'bg-[#A27B5C] text-white border-[#A27B5C]'
                : 'bg-[#1A2224] text-[#DCD7C9]/50 border-[#3F4E4F]'
            }`}
          >
            🔥 Heatmap Layer
          </button>

          <button
            onClick={() => setShowEscapeVector(!showEscapeVector)}
            className={`px-3 py-1 rounded-xl font-bold transition-all text-[10px] border ${
              showEscapeVector
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : 'bg-[#1A2224] text-[#DCD7C9]/50 border-[#3F4E4F]'
            }`}
          >
            ⚡ Escape Vector
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative flex-1 min-h-[440px] w-full">
        <div ref={containerRef} className="w-full h-full" />

        {/* FortyGuard Official Information Modal Card (Triggered on Click) */}
        {selectedPoint && (
          <div className="absolute top-4 right-4 z-[1000] bg-[#1A2224]/95 backdrop-blur-md border-2 border-[#A27B5C] text-[#DCD7C9] rounded-2xl p-4 w-72 shadow-2xl space-y-3 font-mono animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#3F4E4F] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="font-bold text-white text-xs uppercase font-sans">
                  FortyGuard Tile Telemetry
                </h4>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-white/60 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between bg-[#242D30] p-2 rounded-lg">
                <span className="text-[#DCD7C9]/60">Surface Temp:</span>
                <span className="font-bold text-red-400 text-sm">{selectedPoint.tempF}°F ({selectedPoint.tempC}°C)</span>
              </div>
              <div className="flex justify-between bg-[#242D30] p-2 rounded-lg">
                <span className="text-[#DCD7C9]/60">GPS Coordinates:</span>
                <span className="font-bold text-[#A27B5C] text-[10px]">{selectedPoint.lat}, {selectedPoint.lng}</span>
              </div>
              <div className="flex justify-between bg-[#242D30] p-2 rounded-lg">
                <span className="text-[#DCD7C9]/60">Surface Type:</span>
                <span className="font-bold text-white text-[11px] truncate max-w-[140px]">{selectedPoint.surfaceType}</span>
              </div>
              <div className="bg-[#242D30] p-2 rounded-lg space-y-0.5">
                <span className="text-[#DCD7C9]/60 text-[10px] block">OSHA Heat Protocol:</span>
                <span className="font-bold text-yellow-300 text-[11px] block">{selectedPoint.oshaRatio}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPoint(null)}
              className="w-full py-1.5 rounded-xl bg-[#242D30] hover:bg-[#3F4E4F] text-white text-xs font-bold transition-all border border-[#3F4E4F]"
            >
              Close Information
            </button>
          </div>
        )}

        {/* FortyGuard Official Spectral Temperature Legend Bar (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-[999] bg-[#1A2224]/90 backdrop-blur-md p-3 rounded-2xl border border-[#3F4E4F] shadow-2xl font-mono text-[10px] space-y-2 max-w-xs">
          <div className="flex items-center justify-between text-white font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A27B5C]"></span>
              FortyGuard Spectral Ramp
            </span>
            <span className="text-[#A27B5C]">°F Scale</span>
          </div>

          <div className="w-full h-3 rounded-full overflow-hidden shadow-inner bg-gradient-to-r from-[#313695] via-[#ffffbf] via-[#fdae61] to-[#67001f]" />

          <div className="flex items-center justify-between text-[9px] text-[#DCD7C9]/70 font-semibold">
            <span>&lt; 84°F (Cool)</span>
            <span>98°F (Elevated)</span>
            <span>&gt; 118°F (Extreme)</span>
          </div>
        </div>

        {/* Live GPS Cursor Box (Bottom Right) */}
        {cursorCoords && (
          <div className="absolute bottom-4 right-4 z-[999] bg-[#1A2224]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#3F4E4F] text-[10px] text-[#A27B5C] font-mono shadow-xl">
            📍 {cursorCoords.lat}, {cursorCoords.lng}
          </div>
        )}
      </div>
    </div>
  )
}
