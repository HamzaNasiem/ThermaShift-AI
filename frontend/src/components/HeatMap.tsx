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

function getMicrocellStyle(tempF: number, surfaceType: string, isContrastMode: boolean) {
  if (surfaceType === 'shaded_canopy') {
    return { hex: '#059669', stroke: '#34D399', opacity: 0.85, weight: 2.5 }
  }
  if (surfaceType === 'green_buffer') {
    return { hex: '#0D9488', stroke: '#2DD4BF', opacity: 0.70, weight: 1.5 }
  }
  if (isContrastMode && surfaceType === 'asphalt') {
    return { hex: '#B91C1C', stroke: '#EF4444', opacity: 0.90, weight: 2.5 }
  }
  if (tempF >= 112) return { hex: '#DC2626', stroke: '#F87171', opacity: 0.85, weight: 2 }
  if (tempF >= 104) return { hex: '#EA580C', stroke: '#FB923C', opacity: 0.80, weight: 2 }
  if (tempF >= 96)  return { hex: '#D97706', stroke: '#FBBF24', opacity: 0.75, weight: 1.5 }
  if (tempF >= 88)  return { hex: '#CA8A04', stroke: '#FDE047', opacity: 0.70, weight: 1.5 }
  return { hex: '#0D9488', stroke: '#2DD4BF', opacity: 0.70, weight: 1.5 }
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
  const shelterLayerRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [basemap, setBasemap] = useState<'carto_dark' | 'voyager' | 'satellite'>('carto_dark')
  const [selectedCell, setSelectedCell] = useState<any>(null)
  const [showThermalGrid, setShowThermalGrid] = useState(true)
  const [showContrastMode, setShowContrastMode] = useState(false)
  const [showEscapeVector, setShowEscapeVector] = useState(true)
  const [showShelters, setShowShelters] = useState(true)
  const [zoneFilter, setZoneFilter] = useState<'all' | 'hotspots' | 'shelters'>('all')

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
        center: [24.3312, 54.4921],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      })

      L.control.zoom({ position: 'topleft' }).addTo(mapRef.current)

      tileLayerRef.current = L.tileLayer(BASEMAP_TILES.carto_dark.url, {
        maxZoom: 19,
      }).addTo(mapRef.current)

      layerGroupRef.current = L.layerGroup().addTo(mapRef.current)
      vectorLayerRef.current = L.layerGroup().addTo(mapRef.current)
      shelterLayerRef.current = L.layerGroup().addTo(mapRef.current)

      mapRef.current.on('mousemove', (e) => {
        setCursorCoords({
          lat: e.latlng.lat.toFixed(4),
          lng: e.latlng.lng.toFixed(4),
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

  // Custom CSS for glowing vector and tooltips
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .glowing-dash-path {
        animation: dash-flow 1.5s linear infinite;
        stroke-dashoffset: 100;
        filter: drop-shadow(0 0 4px #10B981) drop-shadow(0 0 8px #059669);
      }
      @keyframes dash-flow {
        to {
          stroke-dashoffset: 0;
        }
      }
      .vector-tag-badge {
        background: rgba(16, 185, 129, 0.95);
        border: 1px solid #34D399;
        color: #FFFFFF;
        font-weight: bold;
        font-family: monospace;
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 9999px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
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

  // Update Thermal Layers & ThermaShift Relocation Vectors
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || !site?.polygon_geojson?.coordinates?.[0]) return

    try {
      layerGroupRef.current.clearLayers()
      vectorLayerRef.current?.clearLayers()
      shelterLayerRef.current?.clearLayers()

      const coords = site.polygon_geojson.coordinates[0]
      if (!Array.isArray(coords) || coords.length < 3) return

      const lats = coords.map((c: number[]) => c[1])
      const lngs = coords.map((c: number[]) => c[0])
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)

      const baseTempF = snapshot ? snapshot.temperature_f : (microclimate?.ambient_temp_f ?? 98.0)

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
            
            let surfaceType = 'asphalt'
            if (r >= 4 && c >= 4) surfaceType = 'shaded_canopy'
            else if (r === 3) surfaceType = 'green_buffer'
            else if (c === 3) surfaceType = 'concrete'

            surfaceType = mcell ? mcell.surface_type : surfaceType

            const isCanopy = surfaceType === 'shaded_canopy'
            const isHotspot = mcell ? mcell.is_hotspot : (r === 0 && c === 0)

            const cellAirTempF = mcell ? mcell.temp_f : Math.round((baseTempF + (2 - r) * 1.5 - (isCanopy ? 14.0 : 0)) * 10) / 10
            const cellSurfaceTempF = mcell ? mcell.surface_temp_f : Math.round((cellAirTempF + (surfaceType === 'asphalt' ? 18.5 : isCanopy ? -12.0 : 4.0)) * 10) / 10
            const cellTempC = Math.round(((cellAirTempF - 32) * 5) / 9 * 10) / 10
            const solarRad = mcell ? mcell.solar_radiation_w_m2 : (isCanopy ? 110 : 860)

            const displayTemp = showContrastMode ? cellSurfaceTempF : cellAirTempF
            const style = getMicrocellStyle(displayTemp, surfaceType, showContrastMode)

            const tileCoords: L.LatLngTuple[] = [
              [cMinLat, cMinLng],
              [cMinLat, cMaxLng],
              [cMaxLat, cMaxLng],
              [cMaxLat, cMinLng],
            ]

            const centerLat = (cMinLat + cMaxLat) / 2
            const centerLng = (cMinLng + cMaxLng) / 2

            if (isHotspot) hotspotCoords = [centerLat, centerLng]
            if (isCanopy && !refugeCoords) refugeCoords = [centerLat, centerLng]

            // Filter Logic
            let renderCell = false
            if (zoneFilter === 'all') renderCell = true
            if (zoneFilter === 'hotspots' && isHotspot) renderCell = true
            if (zoneFilter === 'shelters' && isCanopy) renderCell = true

            if (renderCell) {
              const poly = L.polygon(tileCoords, {
                color: isHotspot ? '#EF4444' : isCanopy ? '#34D399' : style.stroke,
                fillColor: style.hex,
                fillOpacity: isCanopy ? 0.85 : isHotspot ? 0.88 : style.opacity,
                weight: isHotspot || isCanopy ? 2.5 : style.weight,
                opacity: 0.95,
              })

              poly.on('mouseover', () => {
                poly.setStyle({ fillOpacity: 0.98, weight: 3, color: '#FFFFFF' })
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
                  fillOpacity: isCanopy ? 0.85 : isHotspot ? 0.88 : style.opacity,
                  weight: isHotspot || isCanopy ? 2.5 : style.weight,
                  color: isHotspot ? '#EF4444' : isCanopy ? '#34D399' : style.stroke,
                })
              })

              poly.addTo(layerGroupRef.current!)
            }
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

      // Shaded Canopy Overlays
      if (showShelters && refugeCoords && shelterLayerRef.current) {
        const shelterIcon = L.divIcon({
          className: 'shelter-pin',
          html: `<div style="background:#059669; border: 2px solid #34D399; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 0 10px #059669;">🛡️</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        L.marker(refugeCoords, { icon: shelterIcon }).addTo(shelterLayerRef.current)
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

        // Start Marker (Critical Hotspot Pulse)
        L.circleMarker(hotspotCoords, {
          radius: 7,
          fillColor: '#DC2626',
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 0.95,
        }).addTo(vectorLayerRef.current)

        // Target Marker (Cooling Refuge Canopy)
        L.circleMarker(refugeCoords, {
          radius: 8,
          fillColor: '#059669',
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 0.95,
        }).addTo(vectorLayerRef.current)

        // Floating Badge on vector midpoint
        const midLat = (hotspotCoords[0] + refugeCoords[0]) / 2
        const midLng = (hotspotCoords[1] + refugeCoords[1]) / 2
        const reliefTemp = microclimate?.cooling_delta_f ?? 38.5
        let distance = microclimate?.recommended_shift_distance_m
        if (!distance && mapRef.current) {
          try {
            distance = Math.round(mapRef.current.distance(hotspotCoords, refugeCoords))
          } catch {
            distance = 500
          }
        }

        const tagIcon = L.divIcon({
          className: 'vector-tag-container',
          html: `<div class="vector-tag-badge">⚡ ThermaShift: -${reliefTemp}°F Relief (${distance || 500}m)</div>`,
          iconSize: [220, 26],
          iconAnchor: [110, 13]
        })
        L.marker([midLat, midLng], { icon: tagIcon }).addTo(vectorLayerRef.current)
      }

      if (bounds && bounds.isValid() && mapRef.current) {
        try {
          mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 })
        } catch {
          // Ignore fitBounds animation interruptions
        }
      }
    } catch (err) {
      console.warn('HeatMap render error handled:', err)
    }
  }, [site, riskLevel, snapshot, microclimate, showThermalGrid, showContrastMode, showEscapeVector, showShelters, zoneFilter])

  return (
    <div className="flex flex-col h-full font-mono bg-[#1A2224] text-[#DCD7C9] rounded-2xl overflow-hidden border border-[#3F4E4F] shadow-2xl">
      
      {/* 1. Clean External Map Control Toolbar (Outside Leaflet Canvas) */}
      <div className="p-3 bg-[#242D30] border-b border-[#3F4E4F] flex flex-wrap items-center justify-between gap-3">
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

        {/* Zone Filter Deck */}
        <div className="flex items-center gap-1.5 bg-[#1A2224] p-1 rounded-xl border border-[#3F4E4F] text-[10px]">
          <button
            onClick={() => setZoneFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              zoneFilter === 'all'
                ? 'bg-[#A27B5C] text-white shadow-md'
                : 'text-[#DCD7C9]/60 hover:text-white'
            }`}
          >
            🌐 All 36 Cells
          </button>
          <button
            onClick={() => setZoneFilter('hotspots')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              zoneFilter === 'hotspots'
                ? 'bg-red-800 text-white shadow-md'
                : 'text-[#DCD7C9]/60 hover:text-red-300'
            }`}
          >
            🔥 Hotspots
          </button>
          <button
            onClick={() => setZoneFilter('shelters')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              zoneFilter === 'shelters'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-[#DCD7C9]/60 hover:text-emerald-300'
            }`}
          >
            🛡️ Canopies
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1 bg-[#1A2224] p-1 rounded-xl border border-[#3F4E4F] text-[10px]">
          <button
            onClick={() => setShowThermalGrid(!showThermalGrid)}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              showThermalGrid
                ? 'bg-[#A27B5C] text-white'
                : 'text-[#DCD7C9]/60 hover:text-white'
            }`}
            title="Toggle 100m Thermal Grid"
          >
            🔥 Grid
          </button>
          <button
            onClick={() => setShowContrastMode(!showContrastMode)}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              showContrastMode
                ? 'bg-red-900/80 text-red-200 border border-red-500/40'
                : 'text-[#DCD7C9]/60 hover:text-white'
            }`}
            title="Toggle FortyGuard Surface Asphalt vs Air Heat"
          >
            ☀️ {showContrastMode ? 'Surface' : 'Air'}
          </button>
          <button
            onClick={() => setShowEscapeVector(!showEscapeVector)}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              showEscapeVector
                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/40'
                : 'text-[#DCD7C9]/60 hover:text-white'
            }`}
            title="Toggle Autonomous ThermaShift Vector"
          >
            ⚡ Vector
          </button>
          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              showShelters
                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/40'
                : 'text-[#DCD7C9]/60 hover:text-white'
            }`}
            title="Toggle Canopy Pins"
          >
            🛡️ Pins
          </button>
        </div>
      </div>

      {/* 2. Map Canvas with Hover Tooltip Only */}
      <div className="relative flex-1 w-full min-h-[480px]">
        <div ref={containerRef} id="heat-map" className="w-full h-full min-h-[480px]" />
        
        {/* Floating Active Cell Inspector (Top-Right of Map) */}
        {selectedCell && (
          <div className="absolute top-4 right-4 z-[1000] bg-[#1A2224]/95 backdrop-blur-md border border-[#A27B5C] rounded-2xl p-3.5 shadow-2xl text-xs text-[#DCD7C9] space-y-1.5 pointer-events-none w-64 animate-fade-in">
            <div className="flex justify-between border-b border-[#3F4E4F] pb-1.5">
              <span className="font-bold text-[#A27B5C] text-sm">{selectedCell.id}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                selectedCell.isCanopy ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50' :
                selectedCell.isHotspot ? 'bg-red-900/60 text-red-300 border border-red-500/50' : 'bg-[#3F4E4F] text-white'
              }`}>
                {selectedCell.isCanopy ? '🛡️ Canopy Refuge' : selectedCell.isHotspot ? '⚠️ Critical Hotspot' : '100m Microcell'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#242D30] p-2 rounded-xl border border-red-500/30">
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Ground / Asphalt</span>
                <span className="text-base font-black text-red-400">{selectedCell.surfaceTempF}°F</span>
              </div>
              <div className="bg-[#242D30] p-2 rounded-xl border border-[#3F4E4F]">
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block">Ambient Air</span>
                <span className="text-base font-black text-yellow-300">{selectedCell.airTempF}°F</span>
              </div>
            </div>

            <div className="text-[10px] space-y-0.5 pt-1.5 border-t border-[#3F4E4F]/40 text-[#DCD7C9]/80 font-sans">
              <div>Type: <strong className="text-white font-mono">{selectedCell.surfaceType}</strong></div>
              <div>Solar Load: <strong className="text-[#A27B5C] font-mono">{selectedCell.solarExposure}</strong></div>
              <div className="text-emerald-400 font-mono font-bold pt-0.5">OSHA: {selectedCell.oshaWorkRest}</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom HUD Bar: Live GPS Coordinates & Thermal Gradient Spectrum */}
      <div className="bg-[#242D30] border-t border-[#3F4E4F] p-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Live Cursor Coordinates */}
        <div className="text-[10px] text-[#DCD7C9]/80 flex items-center gap-2 bg-[#1A2224] px-3 py-1 rounded-lg border border-[#3F4E4F]">
          {cursorCoords ? (
            <span>📍 Lat: {cursorCoords.lat}° N | Lng: {cursorCoords.lng}° E</span>
          ) : (
            <span className="text-[#DCD7C9]/40">📍 Hover map to inspect GPS coordinates...</span>
          )}
        </div>

        {/* Clean Spectrum Legend */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#059669] rounded-full"></span><span className="text-emerald-300">78°F Canopy</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#D97706] rounded-full"></span><span className="text-yellow-300">98°F Ambient</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full"></span><span className="text-red-400">120°F+ Asphalt</span></div>
        </div>
      </div>
    </div>
  )
}
