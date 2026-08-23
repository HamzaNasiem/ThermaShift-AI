import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Site, RiskLevel, HeatSnapshot, MicroclimateAnalysis } from '../types'

const BASEMAP_TILES = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    name: 'Street View'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satellite'
  },
  carto_dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    name: 'Obsidian'
  }
}

function getMicrocellColor(tempF: number, surfaceType: string, isContrastMode: boolean): { hex: string; stroke: string } {
  if (surfaceType === 'shaded_canopy') {
    return { hex: '#059669', stroke: '#10B981' } // Emerald canopy
  }
  if (surfaceType === 'green_buffer') {
    return { hex: '#0D9488', stroke: '#14B8A6' } // Teal buffer
  }
  if (isContrastMode && surfaceType === 'asphalt') {
    return { hex: '#991B1B', stroke: '#DC2626' } // Severe asphalt heat
  }
  if (tempF >= 112) return { hex: '#DC2626', stroke: '#EF4444' } // Crimson Hotspot
  if (tempF >= 106) return { hex: '#EA580C', stroke: '#F97316' } // Sunset Orange
  if (tempF >= 100) return { hex: '#D97706', stroke: '#FBBF24' } // Warm Amber
  if (tempF >= 94)  return { hex: '#CA8A04', stroke: '#FDE047' } // Yellow
  return { hex: '#0D9488', stroke: '#14B8A6' }                  // Cool Teal
}

interface HeatMapProps {
  site: Site | null
  riskLevel: RiskLevel
  snapshot?: HeatSnapshot | null
  microclimate?: MicroclimateAnalysis | null
}

export default function HeatMap({ site, riskLevel, snapshot, microclimate }: HeatMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const vectorLayerRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [basemap, setBasemap] = useState<'voyager' | 'satellite' | 'carto_dark'>('voyager')
  const [selectedCell, setSelectedCell] = useState<any>(null)
  const [showThermalGrid, setShowThermalGrid] = useState(true)
  const [showContrastMode, setShowContrastMode] = useState(false)
  const [showEscapeVector, setShowEscapeVector] = useState(true)

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      center: [24.3312, 54.4921],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    })

    tileLayerRef.current = L.tileLayer(BASEMAP_TILES.voyager.url, {
      maxZoom: 19,
    }).addTo(mapRef.current)

    layerGroupRef.current = L.layerGroup().addTo(mapRef.current)
    vectorLayerRef.current = L.layerGroup().addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Switch Basemap
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return
    tileLayerRef.current.setUrl(BASEMAP_TILES[basemap].url)
  }, [basemap])

  // Update Thermal Layers & ThermaShift Relocation Vectors
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || !site?.polygon_geojson?.coordinates?.[0]) return

    layerGroupRef.current.clearLayers()
    vectorLayerRef.current?.clearLayers()

    const coords = site.polygon_geojson.coordinates[0]
    const lats = coords.map((c: number[]) => c[1])
    const lngs = coords.map((c: number[]) => c[0])
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const baseTempF = snapshot ? snapshot.temperature_f : 102.5

    const rows = 6
    const cols = 6
    const dLat = (maxLat - minLat) / rows
    const dLng = (maxLng - minLng) / cols

    const bounds = L.latLngBounds(coords.map((c: number[]) => [c[1], c[0]] as L.LatLngTuple))

    let hotspotCoords: L.LatLngTuple | null = null
    let refugeCoords: L.LatLngTuple | null = null

    if (showThermalGrid) {
      let cellIndex = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cMinLat = minLat + r * dLat
          const cMaxLat = cMinLat + dLat
          const cMinLng = minLng + c * dLng
          const cMaxLng = cMinLng + dLng

          const mcell = microclimate?.microcells?.[cellIndex]
          const isCanopy = mcell ? mcell.surface_type === 'shaded_canopy' : (r >= 4 && c >= 4)
          const isHotspot = mcell ? mcell.is_hotspot : (r === 0 && c === 0)
          const isRefuge = mcell ? mcell.is_refuge : (r === 4 && c === 4)

          const surfaceType = mcell ? mcell.surface_type : (isCanopy ? 'shaded_canopy' : r <= 2 ? 'asphalt' : 'concrete')
          const cellAirTempF = mcell ? mcell.temp_f : Math.round((baseTempF + (2 - r) * 1.2 - (isCanopy ? 12.0 : 0)) * 10) / 10
          const cellSurfaceTempF = mcell ? mcell.surface_temp_f : Math.round((cellAirTempF + (surfaceType === 'asphalt' ? 18.5 : isCanopy ? -8.0 : 4.0)) * 10) / 10
          const cellTempC = Math.round(((cellAirTempF - 32) * 5) / 9 * 10) / 10
          const solarRad = mcell ? mcell.solar_radiation_w_m2 : (isCanopy ? 110 : 860)

          const displayTemp = showContrastMode ? cellSurfaceTempF : cellAirTempF
          const { hex: color, stroke: strokeColor } = getMicrocellColor(displayTemp, surfaceType, showContrastMode)

          const tileCoords: L.LatLngTuple[] = [
            [cMinLat, cMinLng],
            [cMinLat, cMaxLng],
            [cMaxLat, cMaxLng],
            [cMaxLat, cMinLng],
          ]

          const centerLat = (cMinLat + cMaxLat) / 2
          const centerLng = (cMinLng + cMaxLng) / 2

          if (isHotspot) hotspotCoords = [centerLat, centerLng]
          if (isRefuge) refugeCoords = [centerLat, centerLng]

          const poly = L.polygon(tileCoords, {
            color: isHotspot ? '#EF4444' : isCanopy ? '#10B981' : strokeColor,
            fillColor: color,
            fillOpacity: isCanopy ? 0.65 : isHotspot ? 0.75 : 0.48,
            weight: isHotspot || isCanopy ? 2.0 : 0.8,
            opacity: 0.85,
          })

          poly.on('mouseover', () => {
            poly.setStyle({ fillOpacity: 0.90, weight: 2.5, color: '#FFFFFF' })
            setSelectedCell({
              id: mcell ? mcell.id : `FG-${101 + cellIndex}`,
              airTempF: cellAirTempF,
              surfaceTempF: cellSurfaceTempF,
              tempC: cellTempC,
              surfaceType: surfaceType === 'shaded_canopy' ? 'Covered Canopy Shade' : surfaceType === 'asphalt' ? 'Unshaded Heavy Asphalt' : 'Compacted Slab / Soil',
              solarExposure: isCanopy ? `Full Canopy Protection (${solarRad} W/m²)` : `Direct Solar Load (${solarRad} W/m²)`,
              isHotspot,
              isCanopy,
              oshaWorkRest: cellAirTempF >= 105 ? '15 min Work / 45 min Rest' : cellAirTempF >= 98 ? '30 min Work / 30 min Rest' : '50 min Work / 10 min Rest',
            })
          })

          poly.on('mouseout', () => {
            poly.setStyle({
              fillOpacity: isCanopy ? 0.65 : isHotspot ? 0.75 : 0.48,
              weight: isHotspot || isCanopy ? 2.0 : 0.8,
              color: isHotspot ? '#EF4444' : isCanopy ? '#10B981' : strokeColor,
            })
          })

          poly.addTo(layerGroupRef.current!)
          cellIndex++
        }
      }
    }

    // Outer Boundary Dash
    const outerPoly = L.polygon(coords.map((c: number[]) => [c[1], c[0]] as L.LatLngTuple), {
      color: '#A27B5C',
      weight: 2.5,
      fillColor: 'transparent',
      dashArray: '6 4',
    })
    outerPoly.addTo(layerGroupRef.current!)

    // Draw ThermaShift Relocation Vector (Escape Path from Hotspot to Canopy)
    if (showEscapeVector && vectorLayerRef.current) {
      const startPt: L.LatLngTuple = hotspotCoords || [minLat + dLat * 0.5, minLng + dLng * 0.5]
      const endPt: L.LatLngTuple = refugeCoords || [maxLat - dLat * 1.5, maxLng - dLng * 1.5]

      const escapeLine = L.polyline([startPt, endPt], {
        color: '#10B981',
        weight: 3.5,
        dashArray: '8 6',
        opacity: 0.9,
      })
      escapeLine.addTo(vectorLayerRef.current)

      // Start Marker (Critical Hotspot Pulse)
      const hotspotMarker = L.circleMarker(startPt, {
        radius: 7,
        fillColor: '#DC2626',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 0.95,
      }).bindTooltip('⚠️ Critical Hotspot (Zone A)', { permanent: true, direction: 'top', className: 'hud-tooltip' })
      hotspotMarker.addTo(vectorLayerRef.current)

      // Target Marker (Cooling Refuge Canopy)
      const refugeMarker = L.circleMarker(endPt, {
        radius: 8,
        fillColor: '#059669',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 0.95,
      }).bindTooltip('🛡️ Shaded Cooling Canopy (Zone D)', { permanent: true, direction: 'bottom', className: 'hud-tooltip-canopy' })
      refugeMarker.addTo(vectorLayerRef.current)
    }

    mapRef.current.flyToBounds(bounds, { padding: [35, 35], duration: 1.0 })
  }, [site, riskLevel, snapshot, microclimate, showThermalGrid, showContrastMode, showEscapeVector])

  return (
    <div className="space-y-3 flex flex-col h-full font-mono">
      {/* Top Clean Toolbar Above Map */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Basemap Switcher */}
        <div className="flex items-center gap-1.5 bg-[#1A2224] p-1 rounded-xl border border-[#3F4E4F]">
          <span className="text-[10px] text-[#A27B5C] font-bold uppercase px-1.5">Map:</span>
          {(['voyager', 'satellite', 'carto_dark'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setBasemap(mode)}
              className={`px-2.5 py-1 rounded-lg text-[10px] transition-all ${
                basemap === mode
                  ? 'bg-[#A27B5C] text-white font-bold'
                  : 'text-[#DCD7C9]/70 hover:text-white'
              }`}
            >
              {BASEMAP_TILES[mode].name}
            </button>
          ))}
        </div>

        {/* Spatial Layer Toggles */}
        <div className="flex items-center gap-1.5 bg-[#1A2224] p-1 rounded-xl border border-[#3F4E4F] text-[10px]">
          <button
            onClick={() => setShowThermalGrid(!showThermalGrid)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              showThermalGrid
                ? 'bg-[#A27B5C] text-white'
                : 'text-[#DCD7C9]/60 hover:text-white'
            }`}
            title="Toggle FortyGuard 100m Microcell Grid"
          >
            🔥 100m Grid
          </button>

          <button
            onClick={() => setShowContrastMode(!showContrastMode)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              showContrastMode
                ? 'bg-red-900/60 text-red-300 border border-red-500/40'
                : 'text-[#DCD7C9]/70 hover:text-white'
            }`}
            title="Toggle FortyGuard Surface Asphalt vs Ambient Air Heat Differential"
          >
            ☀️ {showContrastMode ? 'Surface Heat (Asphalt)' : 'Air Heat'}
          </button>

          <button
            onClick={() => setShowEscapeVector(!showEscapeVector)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              showEscapeVector
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                : 'text-[#DCD7C9]/70 hover:text-white'
            }`}
            title="Toggle Autonomous ThermaShift Escape Routing Vector"
          >
            ⚡ Escape Vector
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative flex-1 min-h-[440px] rounded-2xl overflow-hidden border border-[#3F4E4F]/30 bg-[#1A2224] shadow-inner">
        <div ref={containerRef} id="heat-map" className="w-full h-full min-h-[440px]" />

        {/* Floating Active Zone Inspector */}
        {selectedCell && (
          <div className="absolute top-3 right-3 z-[1000] bg-[#1A2224]/95 backdrop-blur-md border border-[#A27B5C] rounded-2xl p-3.5 shadow-2xl text-xs text-[#DCD7C9] space-y-1.5 pointer-events-none max-w-xs animate-fade-in">
            <div className="flex justify-between border-b border-[#3F4E4F] pb-1">
              <span className="font-bold text-[#A27B5C]">{selectedCell.id}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                selectedCell.isCanopy ? 'bg-emerald-900/50 text-emerald-300' :
                selectedCell.isHotspot ? 'bg-red-900/50 text-red-300' : 'bg-[#3F4E4F] text-white'
              }`}>
                {selectedCell.isCanopy ? '🛡️ Shaded Canopy' : selectedCell.isHotspot ? '⚠️ Critical Hotspot' : '100m Microcell'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div>
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Surface Ground</span>
                <span className="text-base font-black text-red-400">{selectedCell.surfaceTempF}°F</span>
              </div>
              <div>
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Ambient Air</span>
                <span className="text-base font-black text-yellow-300">{selectedCell.airTempF}°F</span>
              </div>
            </div>

            <div className="text-[10px] space-y-0.5 pt-1 border-t border-[#3F4E4F]/40 text-[#DCD7C9]/80 font-sans">
              <div>Type: <strong className="text-white font-mono">{selectedCell.surfaceType}</strong></div>
              <div>Solar: <strong className="text-[#A27B5C] font-mono">{selectedCell.solarExposure}</strong></div>
              <div>OSHA Rec: <strong className="text-emerald-400 font-mono">{selectedCell.oshaWorkRest}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Clean Spectrum Bar */}
      <div className="bg-[#1A2224] p-3 rounded-xl border border-[#3F4E4F] text-[#DCD7C9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 shrink-0">
          <span>🌡️</span>
          <span className="font-bold text-white text-[11px]">
            {showContrastMode ? 'Surface Thermal Load' : 'Ambient Heat Index'}
          </span>
        </div>

        <div className="flex-1 max-w-sm w-full space-y-1">
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-[#0D9488] via-[#CA8A04] via-[#EA580C] to-[#DC2626]" />
          <div className="flex justify-between text-[9px] text-[#DCD7C9]/70 font-bold">
            <span>92°F (Canopy)</span>
            <span>100°F (Warm)</span>
            <span>108°F (Hazard)</span>
            <span>116°F+ (Asphalt Spike)</span>
          </div>
        </div>

        <span className="text-[10px] text-[#A27B5C] shrink-0 font-semibold">
          Hover microcell for physics details
        </span>
      </div>
    </div>
  )
}
