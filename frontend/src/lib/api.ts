import type { Site, Worker, HeatSnapshot, ActionLog, TriggerCheckResponse } from '../types'

const API_BASE = '/api'

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
  preferred_language?: 'ur' | 'en'
}): Promise<Worker> {
  const res = await fetch(`${API_BASE}/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to enroll worker: ${res.statusText}`)
  return res.json()
}

export async function getHeatSnapshot(siteId: string): Promise<HeatSnapshot | null> {
  const res = await fetch(`${API_BASE}/heat?site_id=${siteId}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch heat snapshot: ${res.statusText}`)
  return res.json()
}

export const getLatestHeat = getHeatSnapshot

export async function getHeatHistory(siteId: string, limit = 20): Promise<HeatSnapshot[]> {
  const res = await fetch(`${API_BASE}/heat/history?site_id=${siteId}&limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch heat history: ${res.statusText}`)
  return res.json()
}

export async function getAlerts(siteId: string, limit = 20): Promise<ActionLog[]> {
  const res = await fetch(`${API_BASE}/alerts?site_id=${siteId}&limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`)
  return res.json()
}

export async function triggerCheck(siteId: string, forceExtreme = false): Promise<TriggerCheckResponse> {
  const res = await fetch(
    `${API_BASE}/internal/trigger-check?site_id=${siteId}&force_extreme=${forceExtreme}`,
    { method: 'POST' }
  )
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Trigger check failed: ${res.statusText}`)
  }
  return res.json()
}

export async function getFortyGuardUsage(): Promise<any> {
  const res = await fetch(`${API_BASE}/internal/fortyguard/usage`)
  if (!res.ok) throw new Error(`Failed to fetch FortyGuard usage: ${res.statusText}`)
  return res.json()
}

export async function deleteSite(siteId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sites/${siteId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete site: ${res.statusText}`)
}

export async function deleteWorker(workerId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/workers/${workerId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete worker: ${res.statusText}`)
}

