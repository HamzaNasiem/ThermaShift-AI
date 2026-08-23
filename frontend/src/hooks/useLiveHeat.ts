import { useEffect, useState, useCallback } from 'react'
import { getLatestHeat, getAlerts, getWorkers } from '../lib/api'
import type { HeatSnapshot, ActionLog, Worker } from '../types'

interface LiveHeatData {
  snapshot: HeatSnapshot | null
  alerts: ActionLog[]
  workers: Worker[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function useLiveHeat(siteId: string, intervalMs = 20_000): LiveHeatData {
  const [snapshot, setSnapshot] = useState<HeatSnapshot | null>(null)
  const [alerts, setAlerts] = useState<ActionLog[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    if (!siteId) return
    try {
      const [heat, alertData, workerData] = await Promise.allSettled([
        getLatestHeat(siteId),
        getAlerts(siteId, 20),
        getWorkers(siteId),
      ])

      if (heat.status === 'fulfilled') setSnapshot(heat.value)
      if (alertData.status === 'fulfilled') setAlerts(alertData.value)
      if (workerData.status === 'fulfilled') setWorkers(workerData.value)

      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, intervalMs)
    return () => clearInterval(id)
  }, [fetchAll, intervalMs])

  return { snapshot, alerts, workers, loading, error, lastUpdated }
}
