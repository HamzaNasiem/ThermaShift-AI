export interface Site {
  id: string
  name: string
  polygon_geojson: GeoJSONPolygon
  extreme_threshold_f: number
  elevated_threshold_f: number
  poll_interval_minutes: number
  manager_id: string | null
  created_at: string
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface Worker {
  id: string
  site_id: string
  name: string
  phone_number: string
  preferred_language: 'ur' | 'en'
  status: 'safe' | 'elevated' | 'notified' | 'acknowledged'
  consented_at: string | null
  created_at: string
}

export interface HeatSnapshot {
  id: string
  site_id: string
  fortyguard_activity_id: string | null
  temperature_f: number
  analysis_layer: 'snapshot' | 'exceedance' | 'persistence'
  risk_level: 'normal' | 'elevated' | 'extreme'
  raw_response?: any
  captured_at: string
}

export interface ActionLog {
  id: string
  worker_id: string
  heat_snapshot_id: string | null
  channel: 'voice' | 'sms'
  provider_ref: string | null
  status: 'queued' | 'delivered' | 'failed' | 'acknowledged'
  transcript: string | null
  created_at: string
}

export interface TriggerCheckResponse {
  snapshot_id: string
  risk_level: string
  temperature_f: number
  triggered_at: string
  alerts_dispatched: boolean
}

export type RiskLevel = 'normal' | 'elevated' | 'extreme'

export interface MicrocellDetail {
  id: string
  row: number
  col: number
  lat: number
  lng: number
  temp_f: number
  temp_c: number
  surface_temp_f: number
  surface_type: 'asphalt' | 'concrete' | 'shaded_canopy' | 'green_buffer' | 'soil'
  solar_exposure: 'direct_sun' | 'partial_shade' | 'full_canopy_shade'
  solar_radiation_w_m2: number
  is_hotspot: boolean
  is_refuge: boolean
}

export interface MicroclimateAnalysis {
  site_id: string
  site_name: string
  ambient_temp_f: number
  surface_temp_f: number
  uhi_delta_f: number
  solar_radiation_w_m2: number
  hotspot_zone: string
  cooling_refuge: string
  recommended_shift_distance_m: number
  cooling_delta_f: number
  action_plan: string
  microcells: MicrocellDetail[]
  vector_origin_lat: number
  vector_origin_lng: number
  vector_target_lat: number
  vector_target_lng: number
  fortyguard_max_temp_c?: number
  fortyguard_mean_temp_c?: number
  fortyguard_n_cells?: number
  fortyguard_activity_id?: string
  is_satellite_verified?: boolean
}

export interface HourlyForecastPoint {
  time_label: string
  hour: number
  ambient_temp_f: number
  surface_temp_f: number
  canopy_temp_f: number
  wbgt_f: number
  solar_radiation_w_m2: number
  risk_level: string
  work_rest_ratio: string
  hydration_liters_per_hour: number
  point_type?: 'recorded' | 'forecast'
  snapshot_id?: string | null
}


export interface HourlyForecastResponse {
  site_id: string
  site_name: string
  peak_hour: string
  peak_surface_temp_f: number
  points: HourlyForecastPoint[]
}