import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSites, getWorkers, deleteSite } from '../lib/api'
import RegisterSiteModal from '../components/RegisterSiteModal'
import type { Site, Worker } from '../types'

export default function Sites() {
  const [sites, setSites] = useState<Site[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const navigate = useNavigate()

  function loadData() {
    setLoading(true)
    Promise.all([getSites(), getWorkers()])
      .then(([sitesData, workersData]) => {
        setSites(sitesData)
        setWorkers(workersData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleDeleteSite(site: Site) {
    if (!window.confirm(`Are you sure you want to remove "${site.name}" from autonomous heat monitoring?`)) {
      return
    }
    setDeletingId(site.id)
    try {
      await deleteSite(site.id)
      setSites((prev) => prev.filter((s) => s.id !== site.id))
      setWorkers((prev) => prev.filter((w) => w.site_id !== site.id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete site')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 font-mono">
      {/* Header Bar */}
      <div className="card-warm p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-white font-sans">
            Registered Geo-Fenced Work Sites
          </h1>
          <p className="text-xs text-[#A27B5C] mt-0.5">
            Hyperlocal Outdoor Sites Monitored 24/7 by FortyGuard AI
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-bronze flex items-center gap-2"
        >
          <span>➕</span>
          <span>Pinpoint & Register Work Site</span>
        </button>
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="card-warm p-8 text-center text-xs text-[#DCD7C9]/60">
          Loading registered job sites...
        </div>
      ) : sites.length === 0 ? (
        <div className="card-warm p-12 text-center space-y-3">
          <p className="text-sm font-bold text-white">No Work Sites Registered</p>
          <p className="text-xs text-[#DCD7C9]/70">
            Click "Pinpoint & Register Work Site" to add California, US, or international outdoor work sites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sites.map((site) => {
            const siteWorkers = workers.filter((w) => w.site_id === site.id)

            return (
              <div
                key={site.id}
                className="card-warm p-5 flex flex-col justify-between space-y-4 hover:border-[#A27B5C]/60 hover:shadow-2xl transition-all"
              >
                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-[#3F4E4F]/60 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight font-sans">
                        {site.name}
                      </h3>
                      <span className="text-[10px] text-[#A27B5C] block mt-0.5">
                        Site ID: {site.id.slice(0, 8)}...
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold shrink-0">
                      🟢 Active Feed
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-[#DCD7C9]/80">
                    <div className="flex justify-between">
                      <span className="text-[#DCD7C9]/60">Protected Personnel:</span>
                      <span className="font-bold text-white">{siteWorkers.length} workers</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#DCD7C9]/60">Caution Threshold:</span>
                      <span className="font-bold text-[#A27B5C]">{site.elevated_threshold_f}°F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#DCD7C9]/60">Extreme Hazard:</span>
                      <span className="font-bold text-red-400">{site.extreme_threshold_f}°F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#DCD7C9]/60">Auto-Poll Interval:</span>
                      <span className="font-bold text-white">{site.poll_interval_minutes || 10} min</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#3F4E4F]/60">
                  <button
                    onClick={() => navigate(`/?site_id=${site.id}`)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#1E2628] hover:bg-[#3F4E4F] text-white text-xs font-bold transition-all text-center border border-[#3F4E4F]"
                  >
                    👁️ Launch Radar
                  </button>

                  <button
                    onClick={() => handleDeleteSite(site)}
                    disabled={deletingId === site.id}
                    className="py-2 px-3 rounded-xl bg-red-900/30 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-bold transition-all"
                    title="Remove this work site from monitoring"
                  >
                    {deletingId === site.id ? '...' : '🗑️ Remove'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Register Site Modal */}
      {showModal && (
        <RegisterSiteModal
          onSiteCreated={() => {
            loadData()
            setShowModal(false)
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
