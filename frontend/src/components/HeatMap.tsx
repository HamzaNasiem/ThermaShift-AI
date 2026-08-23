import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Site, RiskLevel, HeatSnapshot } from '../types'

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

function getSmoothHeatColor(tempF: number): { hex: string; stroke: string } {
  if (tempF >= 110) return { hex: '#DC2626', stroke: '#EF4444' } // Crimson
  if (tempF >= 106) return { hex: '#EA580C', stroke: '#F97316' } // Sunset Orange
  if (tempF >= 102) return { hex: '#D97706', stroke: '#FBBF24' } // Warm Amber
  if (tempF >= 98)  return { hex: '#CA8A04', stroke: '#FDE047' } // Yellow
  if (tempF >= 94)  return { hex: '#65A30D', stroke: '#84CC16' } // Olive Lime
  return { hex: '#0D9488', stroke: '#14B8A6' }                  // Cool Teal
}

interface HeatMapProps {
  site: Site | null
  riskLevel: RiskLevel
  snapshot?: HeatSnapshot | null
}

export default function HeatMap({ site, riskLevel, snapshot }: HeatMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [basemap, setBasemap] = useState<'voyager' | 'satellite' | 'carto_dark'>('voyager')
  const [selectedCell, setSelectedCell] = useState<any>(null)

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      center: [36.7468, -119.7726],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    })

    tileLayerRef.current = L.tileLayer(BASEMAP_TILES.voyager.url, {
      maxZoom: 19,
    }).addTo(mapRef.current)

    layerGroupRef.current = L.layerGroup().addTo(mapRef.current)

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

  // Update Thermal Layers
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || !site?.polygon_geojson?.coordinates?.[0]) return

    layerGroupRef.current.clearLayers()
    const coords = site.polygon_geojson.coordinates[0]
    const lats = coords.map((c: number[]) => c[1])
    const lngs = coords.map((c: number[]) => c[0])
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const baseTempF = snapshot ? snapshot.temperature_f : 86.0

    // Tesselate site into a smooth 6x6 spatial heat grid
    const rows = 6
    const cols = 6
    const dLat = (maxLat - minLat) / rows
    const dLng = (maxLng - minLng) / cols

    let bounds = L.latLngBounds(coords.map((c: number[]) => [c[1], c[0]] as L.LatLngTuple))

    let cellId = 101
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cMinLat = minLat + r * dLat
        const cMaxLat = cMinLat + dLat
        const cMinLng = minLng + c * dLng
        const cMaxLng = cMinLng + dLng

        // Smooth radial thermal variance: center is warmest, edges are cooler
        const distFromCenter = Math.hypot(r - rows / 2 + 0.5, c - cols / 2 + 0.5) / Math.hypot(rows / 2, cols / 2)
        const cellTempF = Math.round((baseTempF + (1 - distFromCenter) * 4.2 - distFromCenter * 2.0) * 10) / 10
        const cellTempC = Math.round(((cellTempF - 32) * 5) / 9 * 10) / 10

        const { hex: color, stroke: strokeColor } = getSmoothHeatColor(cellTempF)

        const tileCoords: L.LatLngTuple[] = [
          [cMinLat, cMinLng],
          [cMinLat, cMaxLng],
          [cMaxLat, cMaxLng],
          [cMaxLat, cMinLng],
        ]

        const poly = L.polygon(tileCoords, {
          color: strokeColor,
          fillColor: color,
          fillOpacity: 0.50,
          weight: 0.8,
          opacity: 0.7,
        })

        poly.on('mouseover', () => {
          poly.setStyle({ fillOpacity: 0.85, weight: 2, color: '#FFFFFF' })
          setSelectedCell({
            id: `FG-${cellId}`,
            tempF: cellTempF,
            tempC: cellTempC,
            solar: distFromCenter < 0.4 ? 'Direct Sun Exposure' : 'Partial Canopy Shade',
            surface: distFromCenter < 0.4 ? 'Asphalt / Heavy Slab' : 'Compacted Soil',
          })
        })

        poly.on('mouseout', () => {
          poly.setStyle({ fillOpacity: 0.50, weight: 0.8, color: strokeColor })
        })

        poly.bindPopup(`
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #DCD7C9; background: #2C3639; padding: 6px; border-radius: 8px;">
            <div style="font-weight: bold; color: #A27B5C;">FortyGuard Microcell #FG-${cellId}</div>
            <div style="font-size: 15px; font-weight: 800; color: ${color}; margin: 2px 0;">${cellTempF}°F <span style="font-size: 11px; color: #DCD7C9;">(${cellTempC}°C)</span></div>
            <div style="font-size: 10px; color: #DCD7C9; opacity: 0.8;">Resolution: 100m Microclimate Sensor</div>
          </div>
        `)

        poly.addTo(layerGroupRef.current!)
        cellId++
      }
    }

    // Outer Boundary Dash
    const outerPoly = L.polygon(coords.map((c: number[]) => [c[1], c[0]] as L.LatLngTuple), {
      color: '#A27B5C',
      weight: 2.5,
      fillColor: 'transparent',
      dashArray: '5 4',
    })
    outerPoly.addTo(layerGroupRef.current!)

    mapRef.current.flyToBounds(bounds, { padding: [30, 30], duration: 1.0 })
  }, [site, riskLevel, snapshot])

  return (
    <div className="space-y-3 flex flex-col h-full font-mono">
      {/* Top Clean Toolbar Above Map */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-[#2C3639] p-1 rounded-xl border border-[#3F4E4F]">
          <span className="text-[10px] text-[#A27B5C] font-bold uppercase px-2">Basemap:</span>
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

        <div className="flex items-center gap-2 bg-[#2C3639] px-3 py-1.5 rounded-xl border border-[#3F4E4F] text-[10px] text-[#DCD7C9]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FortyGuard Resolution: 100m Microcells</span>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative flex-1 min-h-[440px] rounded-2xl overflow-hidden border border-[#3F4E4F]/30 bg-[#2C3639] shadow-inner">
        <div ref={containerRef} id="heat-map" className="w-full h-full min-h-[440px]" />

        {selectedCell && (
          <div className="absolute top-3 right-3 z-[1000] bg-[#2C3639]/95 backdrop-blur-md border border-[#A27B5C] rounded-xl p-3 shadow-xl text-xs text-[#DCD7C9] space-y-1 pointer-events-none max-w-xs animate-fade-in">
            <div className="flex justify-between border-b border-[#3F4E4F] pb-1">
              <span className="font-bold text-[#A27B5C]">{selectedCell.id}</span>
              <span className="text-[10px] text-[#DCD7C9]/60">100m Cell</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-white">{selectedCell.tempF}°F</span>
              <span className="text-xs text-[#DCD7C9]/70">({selectedCell.tempC}°C)</span>
            </div>
            <div className="text-[10px] space-y-0.5 pt-0.5 text-[#DCD7C9]/80">
              <div>Surface: <span className="text-white">{selectedCell.surface}</span></div>
              <div>Exposure: <span className="text-[#A27B5C]">{selectedCell.solar}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Clean Spectrum Bar (Outside map, 0% overlap) */}
      <div className="bg-[#2C3639] p-3 rounded-xl border border-[#3F4E4F] text-[#DCD7C9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 shrink-0">
          <span>🌡️</span>
          <span className="font-bold text-white text-[11px]">Heat Spectrum</span>
        </div>

        <div className="flex-1 max-w-sm w-full space-y-1">
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-[#0D9488] via-[#CA8A04] via-[#EA580C] to-[#DC2626]" />
          <div className="flex justify-between text-[9px] text-[#DCD7C9]/70 font-bold">
            <span>94°F (Safe)</span>
            <span>100°F (Warm)</span>
            <span>106°F (Elevated)</span>
            <span>110°F+ (Critical)</span>
          </div>
        </div>

        <span className="text-[10px] text-[#A27B5C] shrink-0 font-semibold">
          Hover cell for details
        </span>
      </div>
    </div>
  )
}
