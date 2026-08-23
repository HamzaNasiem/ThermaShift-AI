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
