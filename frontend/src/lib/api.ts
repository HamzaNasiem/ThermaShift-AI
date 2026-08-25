import type { Site, Worker, HeatSnapshot, ActionLog, TriggerCheckResponse, HourlyForecastResponse } from '../types'

const API_BASE = String((import.meta as any).env?.VITE_API_BASE || 'https://thermashift-ai.onrender.com').replace(/\/$/, '')

export async function getSites(): Promise<Site[]> {
  const res = await fetch(`${API_BASE}/sites`)
  if (!res.ok) throw new Error(`Failed to fetch sites: ${res.statusText}`)
  return res.json()
}

export async function getSite(siteId: string): Promise<Site> {
  const res = await fetch(`${API_BASE}/sites/${siteId}`)
  if (!res.ok) throw new Error(`Failed to fetch site: ${res.statusText}`)
  return res.json()
}

export async function createSite(payload: {
  name: string
  polygon_geojson: any
  elevated_threshold_f: number
  extreme_threshold_f: number
}): Promise<Site> {
  const res = await fetch(`${API_BASE}/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create site: ${res.statusText}`)
  return res.json()
}

export async function getWorkers(siteId?: string): Promise<Worker[]> {
  const url = siteId ? `${API_BASE}/workers?site_id=${siteId}` : `${API_BASE}/workers`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch workers: ${res.statusText}`)
  return res.json()
}

export async function createWorker(payload: {
  site_id: string
  name: string
  phone_number: string
  preferred_language?: string
}): Promise<Worker> {
  const res = await fetch(`${API_BASE}/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create worker: ${res.statusText}`)
  return res.json()
}

export async function deleteWorker(workerId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/workers/${workerId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete worker: ${res.statusText}`)
}

export async function deleteSite(siteId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sites/${siteId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete site: ${res.statusText}`)
}

export async function getLatestHeat(siteId: string): Promise<HeatSnapshot | null> {
  const res = await fetch(`${API_BASE}/heat?site_id=${siteId}`)
  if (!res.ok) throw new Error(`Failed to fetch heat snapshot: ${res.statusText}`)
  return res.json()
}

export async function getMicroclimateAnalysis(siteId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/heat/microclimate?site_id=${siteId}`)
  if (!res.ok) throw new Error(`Failed to fetch microclimate analysis: ${res.statusText}`)
  return res.json()
}

export async function getHourlyForecast(siteId: string): Promise<HourlyForecastResponse> {
  const res = await fetch(`${API_BASE}/heat/hourly-forecast?site_id=${siteId}`)
  if (!res.ok) throw new Error(`Failed to fetch hourly forecast: ${res.statusText}`)
  return res.json()
}

export async function getAlerts(siteId?: string, limit?: number): Promise<ActionLog[]> {
  const params = new URLSearchParams()
  if (siteId) params.append('site_id', siteId)
  if (limit) params.append('limit', String(limit))
  const queryString = params.toString() ? `?${params.toString()}` : ''
  const url = `${API_BASE}/alerts${queryString}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`)
  return res.json()
}

export async function triggerCheck(siteId: string, forceExtreme = false): Promise<TriggerCheckResponse> {
  const url = `${API_BASE}/internal/trigger-check?site_id=${siteId}&force_extreme=${forceExtreme}`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error(`Trigger check failed: ${res.statusText}`)
  return res.json()
}

export async function triggerDirectCall(payload: { phone_number: string; worker_name: string }): Promise<any> {
  const res = await fetch(`${API_BASE}/internal/calle/direct-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(errData.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getCalleCallStatus(callId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/internal/calle/call/${callId}`)
  if (!res.ok) throw new Error(`Failed to fetch call status: ${res.statusText}`)
  return res.json()
}

export async function getFortyGuardUsage(): Promise<any> {
  const res = await fetch(`${API_BASE}/internal/fortyguard/usage`)
  if (!res.ok) throw new Error(`Failed to fetch FortyGuard usage: ${res.statusText}`)
  return res.json()
}
