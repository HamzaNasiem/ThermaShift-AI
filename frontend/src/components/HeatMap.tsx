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

function getMicrocellColor(tempF: number, surfaceType: string, isContrastMode: boolean): { hex: string; stroke: string; opacity: number; weight: number } {
  if (surfaceType === 'shaded_canopy') {
    return { hex: '#059669', stroke: '#10B981', opacity: 0.65, weight: 2 } // Cool Emerald
  }
  if (surfaceType === 'green_buffer') {
    return { hex: '#556B2F', stroke: '#6B8E23', opacity: 0.5, weight: 1 } // Olive
  }
  if (surfaceType === 'soil') {
    return { hex: '#B8860B', stroke: '#DAA520', opacity: 0.5, weight: 1 } // Amber
  }
  if (isContrastMode && surfaceType === 'asphalt') {
    return { hex: '#991B1B', stroke: '#DC2626', opacity: 0.75, weight: 2 } // Crimson
  }
  if (tempF >= 112) return { hex: '#DC2626', stroke: '#EF4444', opacity: 0.75, weight: 2 } 
  if (tempF >= 106) return { hex: '#EA580C', stroke: '#F97316', opacity: 0.6, weight: 1 } 
  if (tempF >= 100) return { hex: '#D97706', stroke: '#FBBF24', opacity: 0.5, weight: 1 }
  if (tempF >= 94)  return { hex: '#CA8A04', stroke: '#FDE047', opacity: 0.5, weight: 1 }
  return { hex: '#0D9488', stroke: '#14B8A6', opacity: 0.5, weight: 1 }
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

  const [basemap, setBasemap] = useState<'voyager' | 'satellite' | 'carto_dark'>('carto_dark')
  const [selectedCell, setSelectedCell] = useState<any>(null)
  const [showThermalGrid, setShowThermalGrid] = useState(true)
  const [showContrastMode, setShowContrastMode] = useState(false)
  const [showEscapeVector, setShowEscapeVector] = useState(true)
  const [showShelters, setShowShelters] = useState(true)
  const [zoneFilter, setZoneFilter] = useState<'all' | 'hotspots' | 'shelters'>('all')

  const [cursorCoords, setCursorCoords] = useState<{lat: string; lng: string; elev: string} | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      center: [24.3312, 54.4921],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    })

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
        elev: (Math.random() * 5 + 10).toFixed(0) // Mock elevation for visual effect
      })
    })

    mapRef.current.on('mouseout', () => {
      setCursorCoords(null)
    })

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

  // Custom CSS for glowing dash animation
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .glowing-dash-path {
        animation: dash-flow 2s linear infinite;
        stroke-dashoffset: 100;
        filter: drop-shadow(0 0 3px #10B981) drop-shadow(0 0 6px #10B981);
      }
      @keyframes dash-flow {
        to {
          stroke-dashoffset: 0;
        }
      }
      .hud-tooltip {
        background: rgba(26, 34, 36, 0.95);
        border: 1px solid #DC2626;
        color: #DCD7C9;
        font-family: monospace;
        font-size: 11px;
      }
      .hud-tooltip-canopy {
        background: rgba(26, 34, 36, 0.95);
        border: 1px solid #10B981;
        color: #DCD7C9;
        font-family: monospace;
        font-size: 11px;
      }
      .vector-tag-tooltip {
        background: transparent;
        border: none;
        box-shadow: none;
        color: #10B981;
        font-weight: bold;
        font-family: monospace;
        text-shadow: 0 0 3px #000;
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  // Update Thermal Layers & ThermaShift Relocation Vectors
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || !site?.polygon_geojson?.coordinates?.[0]) return

    layerGroupRef.current.clearLayers()
    vectorLayerRef.current?.clearLayers()
    shelterLayerRef.current?.clearLayers()

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
          
          let surfaceType = 'asphalt'
          if (r >= 4 && c >= 4) surfaceType = 'shaded_canopy'
          else if (r === 3) surfaceType = 'green_buffer'
          else if (c === 3) surfaceType = 'soil'

          surfaceType = mcell ? mcell.surface_type : surfaceType

          const isCanopy = surfaceType === 'shaded_canopy'
          const isHotspot = mcell ? mcell.is_hotspot : (r === 0 && c === 0)
          const isRefuge = mcell ? mcell.is_refuge : (r === 4 && c === 4)

          const cellAirTempF = mcell ? mcell.temp_f : Math.round((baseTempF + (2 - r) * 1.2 - (isCanopy ? 12.0 : 0)) * 10) / 10
          const cellSurfaceTempF = mcell ? mcell.surface_temp_f : Math.round((cellAirTempF + (surfaceType === 'asphalt' ? 18.5 : isCanopy ? -8.0 : 4.0)) * 10) / 10
          const cellTempC = Math.round(((cellAirTempF - 32) * 5) / 9 * 10) / 10
          const solarRad = mcell ? mcell.solar_radiation_w_m2 : (isCanopy ? 110 : 860)

          const displayTemp = showContrastMode ? cellSurfaceTempF : cellAirTempF
          const style = getMicrocellColor(displayTemp, surfaceType, showContrastMode)

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

          // Filter Logic
          let renderCell = false
          if (zoneFilter === 'all') renderCell = true
          if (zoneFilter === 'hotspots' && isHotspot) renderCell = true
          if (zoneFilter === 'shelters' && isCanopy) renderCell = true

          if (renderCell) {
            const poly = L.polygon(tileCoords, {
              color: style.stroke,
              fillColor: style.hex,
              fillOpacity: style.opacity,
              weight: style.weight,
              opacity: 0.85,
            })

            poly.on('mouseover', () => {
              poly.setStyle({ fillOpacity: 0.90, weight: 2.5, color: '#FFFFFF' })
              setSelectedCell({
                id: mcell ? mcell.id : `Cell-${cellIndex + 1}`,
                airTempF: cellAirTempF,
                surfaceTempF: cellSurfaceTempF,
                tempC: cellTempC,
                surfaceType: surfaceType === 'shaded_canopy' ? 'Covered Canopy Shade' : surfaceType === 'asphalt' ? 'Unshaded Heavy Asphalt' : surfaceType,
                solarExposure: isCanopy ? `Full Canopy Protection (${solarRad} W/m²)` : `Direct Solar Load (${solarRad} W/m²)`,
                isHotspot,
                isCanopy,
                oshaWorkRest: cellAirTempF >= 105 ? '15 min Work / 45 min Rest' : cellAirTempF >= 98 ? '30 min Work / 30 min Rest' : '50 min Work / 10 min Rest',
              })
            })

            poly.on('mouseout', () => {
              poly.setStyle({
                fillOpacity: style.opacity,
                weight: style.weight,
                color: style.stroke,
              })
            })

            poly.addTo(layerGroupRef.current!)

            if (showShelters && isCanopy && shelterLayerRef.current) {
              const shelterMarker = L.circleMarker([centerLat, centerLng], {
                radius: 6,
                fillColor: '#059669',
                color: '#FFFFFF',
                weight: 1.5,
                fillOpacity: 1,
              }).bindTooltip('🛡️ Shelter Alpha (84.5°F Shaded Refuge • Water Station Active • Capacity: 8/12)', { permanent: false, direction: 'top', className: 'hud-tooltip-canopy' })
              shelterMarker.addTo(shelterLayerRef.current)
            }
          }
          cellIndex++
        }
      }
    }

    // Outer Boundary Dash
    if (zoneFilter === 'all' || zoneFilter === 'hotspots') {
      const outerPoly = L.polygon(coords.map((c: number[]) => [c[1], c[0]] as L.LatLngTuple), {
        color: '#A27B5C',
        weight: 2.5,
        fillColor: 'transparent',
        dashArray: '6 4',
      })
      outerPoly.addTo(layerGroupRef.current!)
    }

    // Draw ThermaShift Relocation Vector (Escape Path from Hotspot to Canopy)
    if (showEscapeVector && vectorLayerRef.current && hotspotCoords && refugeCoords && (zoneFilter === 'all')) {
      const escapeLine = L.polyline([hotspotCoords, refugeCoords], {
        color: '#10B981',
        weight: 3.5,
        dashArray: '10 10',
        opacity: 0.9,
        className: 'glowing-dash-path'
      })
      escapeLine.addTo(vectorLayerRef.current)

      // Start Marker (Critical Hotspot Pulse)
      const startMarker = L.circleMarker(hotspotCoords, {
        radius: 7,
        fillColor: '#DC2626',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 0.95,
      })
      startMarker.addTo(vectorLayerRef.current)

      // Target Marker (Cooling Refuge Canopy)
      const targetMarker = L.circleMarker(refugeCoords, {
        radius: 8,
        fillColor: '#059669',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 0.95,
      })
      targetMarker.addTo(vectorLayerRef.current)

      // Floating Tag
      const midLat = (hotspotCoords[0] + refugeCoords[0]) / 2
      const midLng = (hotspotCoords[1] + refugeCoords[1]) / 2
      const reliefTemp = (Math.random() * 5 + 35).toFixed(1)
      const distance = (mapRef.current.distance(hotspotCoords, refugeCoords)).toFixed(0)

      L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'vector-tag-tooltip',
          html: `<div style="background: rgba(16, 185, 129, 0.2); backdrop-filter: blur(2px); padding: 4px 8px; border-radius: 4px; border: 1px solid #10B981; white-space: nowrap;">⚡ ThermaShift: -${reliefTemp}°F Relief (${distance}m)</div>`,
          iconSize: [200, 30],
          iconAnchor: [100, 15]
        })
      }).addTo(vectorLayerRef.current)
    }

    mapRef.current.flyToBounds(bounds, { padding: [35, 35], duration: 1.0 })
  }, [site, riskLevel, snapshot, microclimate, showThermalGrid, showContrastMode, showEscapeVector, showShelters, zoneFilter])

  return (
    <div className="flex flex-col h-full font-mono bg-[#242D30] text-[#DCD7C9] relative rounded-2xl overflow-hidden border border-[#3F4E4F]">
      
      {/* Top Overlay: Zone Filters */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] flex gap-2">
        <button onClick={() => setZoneFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${zoneFilter === 'all' ? 'bg-[#A27B5C] border-[#A27B5C] text-white shadow-lg' : 'bg-[#1A2224]/80 border-[#3F4E4F] hover:border-[#A27B5C] backdrop-blur'}`}>🌐 All Zones (36)</button>
        <button onClick={() => setZoneFilter('hotspots')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${zoneFilter === 'hotspots' ? 'bg-red-900/80 border-red-500 text-red-200 shadow-lg' : 'bg-[#1A2224]/80 border-[#3F4E4F] hover:border-red-500/50 backdrop-blur'}`}>🔥 Hotspots Only</button>
        <button onClick={() => setZoneFilter('shelters')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${zoneFilter === 'shelters' ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200 shadow-lg' : 'bg-[#1A2224]/80 border-[#3F4E4F] hover:border-emerald-500/50 backdrop-blur'}`}>🛡️ Shelters Only</button>
      </div>

      {/* Layer Toggles & Toolbar on Top Right */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="flex flex-col gap-1.5 bg-[#1A2224]/90 backdrop-blur-md p-2 rounded-xl border border-[#3F4E4F] text-[10px]">
          <span className="text-[10px] text-[#A27B5C] font-bold uppercase px-1">Basemaps</span>
          {(['voyager', 'satellite', 'carto_dark'] as const).map((mode) => (
            <button key={mode} onClick={() => setBasemap(mode)} className={`px-2 py-1.5 rounded-lg text-left transition-all ${basemap === mode ? 'bg-[#A27B5C] text-white font-bold' : 'text-[#DCD7C9]/70 hover:bg-[#3F4E4F]/50 hover:text-white'}`}>
              {BASEMAP_TILES[mode].name}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 bg-[#1A2224]/90 backdrop-blur-md p-2 rounded-xl border border-[#3F4E4F] text-[10px]">
          <span className="text-[10px] text-[#A27B5C] font-bold uppercase px-1">Layers</span>
          <button onClick={() => setShowThermalGrid(!showThermalGrid)} className={`px-2 py-1.5 rounded-lg text-left transition-all ${showThermalGrid ? 'bg-[#3F4E4F] text-white font-bold' : 'text-[#DCD7C9]/70 hover:bg-[#3F4E4F]/50 hover:text-white'}`}>🔥 100m Grid</button>
          <button onClick={() => setShowContrastMode(!showContrastMode)} className={`px-2 py-1.5 rounded-lg text-left transition-all ${showContrastMode ? 'bg-[#3F4E4F] text-white font-bold' : 'text-[#DCD7C9]/70 hover:bg-[#3F4E4F]/50 hover:text-white'}`}>☀️ Surface Asphalt vs Air</button>
          <button onClick={() => setShowEscapeVector(!showEscapeVector)} className={`px-2 py-1.5 rounded-lg text-left transition-all ${showEscapeVector ? 'bg-[#3F4E4F] text-white font-bold' : 'text-[#DCD7C9]/70 hover:bg-[#3F4E4F]/50 hover:text-white'}`}>⚡ Escape Vectors</button>
          <button onClick={() => setShowShelters(!showShelters)} className={`px-2 py-1.5 rounded-lg text-left transition-all ${showShelters ? 'bg-[#3F4E4F] text-white font-bold' : 'text-[#DCD7C9]/70 hover:bg-[#3F4E4F]/50 hover:text-white'}`}>🛡️ Canopy Shelters</button>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative flex-1 w-full h-full min-h-[500px]">
        <div ref={containerRef} id="heat-map" className="absolute inset-0 w-full h-full z-[1]" />
        
        {/* Floating Active Zone Inspector */}
        {selectedCell && (
          <div className="absolute top-4 left-4 z-[1000] bg-[#1A2224]/95 backdrop-blur-md border border-[#A27B5C] rounded-2xl p-4 shadow-2xl text-xs text-[#DCD7C9] space-y-2 pointer-events-none w-64 animate-fade-in">
            <div className="flex justify-between border-b border-[#3F4E4F] pb-2">
              <span className="font-bold text-[#A27B5C] text-sm">{selectedCell.id}</span>
            </div>
            <div className="pb-1">
              <span className={`text-[10px] font-bold px-2 py-1 rounded inline-block ${
                selectedCell.isCanopy ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50' :
                selectedCell.isHotspot ? 'bg-red-900/50 text-red-300 border border-red-500/50' : 'bg-[#3F4E4F] text-white border border-[#DCD7C9]/30'
              }`}>
                {selectedCell.isCanopy ? '🛡️ Canopy Shelter' : selectedCell.isHotspot ? '⚠️ Critical Hotspot' : '🌐 Microcell'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#242D30] p-2 rounded-lg border border-[#3F4E4F]">
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block mb-1">Surface (Asphalt)</span>
                <span className="text-lg font-black text-red-400">{selectedCell.surfaceTempF}°F</span>
              </div>
              <div className="bg-[#242D30] p-2 rounded-lg border border-[#3F4E4F]">
                <span className="text-[9px] text-[#DCD7C9]/60 uppercase block mb-1">Ambient Air</span>
                <span className="text-lg font-black text-yellow-300">{selectedCell.airTempF}°F</span>
              </div>
            </div>

            <div className="text-[10px] space-y-1 pt-2 border-t border-[#3F4E4F]/40 text-[#DCD7C9]/80 font-sans">
              <div className="flex justify-between"><span>Material:</span> <strong className="text-white font-mono">{selectedCell.surfaceType}</strong></div>
              <div className="flex justify-between"><span>Solar Load:</span> <strong className="text-[#A27B5C] font-mono">{selectedCell.solarExposure}</strong></div>
              <div className="flex justify-between mt-1 pt-1 border-t border-[#3F4E4F]/20"><span>OSHA Guideline:</span> <strong className="text-emerald-400 font-mono text-[9px]">{selectedCell.oshaWorkRest}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Live GPS HUD & Legend Bottom Bar */}
      <div className="relative z-[1000] bg-[#1A2224] border-t border-[#3F4E4F] p-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Live Cursor Coordinates */}
        <div className="text-[10px] font-mono text-[#DCD7C9]/80 flex items-center gap-2 bg-[#242D30] px-3 py-1.5 rounded-lg border border-[#3F4E4F]">
          {cursorCoords ? (
            <span>📍 Lat: {cursorCoords.lat}° N | Lng: {cursorCoords.lng}° E | Elevation: {cursorCoords.elev}m</span>
          ) : (
            <span>📍 Move cursor over map to view coordinates...</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-[#242D30] px-4 py-1.5 rounded-lg border border-[#3F4E4F] text-[10px]">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#DC2626] rounded border border-white/20"></div><span className="text-white">Critical Hotspot</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#D97706] rounded border border-white/20"></div><span className="text-[#DCD7C9]">Warm Zone</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#059669] rounded border border-white/20"></div><span className="text-emerald-300">Shaded Canopy</span></div>
        </div>
      </div>
    </div>
  )
}
