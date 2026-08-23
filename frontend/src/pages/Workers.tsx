import { useState, useEffect } from 'react'
import { getSites, getWorkers, createWorker, deleteWorker } from '../lib/api'
import DirectCallModal from '../components/DirectCallModal'
import type { Site, Worker } from '../types'

export default function Workers() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  
  // Enroll Modal State
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [lang, setLang] = useState<'en' | 'ur'>('en')
  const [enrolling, setEnrolling] = useState(false)

  // Direct Call Modal & Delete State
  const [directCallTarget, setDirectCallTarget] = useState<{ name: string; phone: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    getSites().then((data) => {
      setSites(data)
      if (data.length > 0) {
        setSelectedSiteId(data[0].id)
      }
    }).catch(console.error)
  }, [])

  function loadWorkers(siteId: string) {
    if (!siteId) return
    setLoading(true)
    getWorkers(siteId)
      .then(setWorkers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selectedSiteId) {
      loadWorkers(selectedSiteId)
    }
  }, [selectedSiteId])

  async function handleEnrollWorker(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !phone || !selectedSiteId) return
    setEnrolling(true)
    try {
      await createWorker({
        site_id: selectedSiteId,
        name,
        phone_number: phone,
        preferred_language: lang,
      })
      setName('')
      setShowEnrollModal(false)
      loadWorkers(selectedSiteId)
    } catch (err: any) {
      alert(err.message || 'Failed to enroll worker')
    } finally {
      setEnrolling(false)
    }
  }

  async function handleDeleteWorker(worker: Worker) {
    if (!window.confirm(`Are you sure you want to remove worker "${worker.name}" from heat safety coverage?`)) {
      return
    }
    setDeletingId(worker.id)
    try {
      await deleteWorker(worker.id)
      setWorkers((prev) => prev.filter((w) => w.id !== worker.id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete worker')
    } finally {
      setDeletingId(null)
    }
  }

  const selectedSite = sites.find((s) => s.id === selectedSiteId)

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="card-warm p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-white font-sans">
            Enrolled Field Personnel Roster
          </h1>
          <p className="text-xs text-[#A27B5C] mt-0.5">
            Workers Receiving Autonomous Voice & SMS Alerts During Extreme Heat
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDirectCallTarget({ name: '', phone: '' })}
            className="px-3.5 py-2 rounded-xl bg-[#1E2628] hover:bg-[#3F4E4F] text-white text-xs font-bold transition-all border border-[#A27B5C]/40 flex items-center gap-1.5"
          >
            <span>📱</span>
            <span>Test CALL-E Voice Call</span>
          </button>

          <button
            onClick={() => setShowEnrollModal(true)}
            className="btn-bronze flex items-center gap-2"
          >
            <span>➕</span>
            <span>Enroll New Worker</span>
          </button>
        </div>
      </div>

      {/* Site Selector Toolbar */}
      <div className="card-warm p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-[#DCD7C9]/70 font-semibold">Active Work Site:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-[#1E2628] text-white border border-[#A27B5C]/50 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#A27B5C] cursor-pointer"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>📍 {s.name}</option>
            ))}
          </select>
        </div>

        <div className="text-[#DCD7C9]/80 text-xs">
          Personnel on Site: <span className="font-bold text-white text-sm">{workers.length}</span>
        </div>
      </div>

      {/* Workers Roster Grid */}
      {loading ? (
        <div className="card-warm p-8 text-center text-xs text-[#DCD7C9]/60">
          Syncing field personnel for {selectedSite?.name}...
        </div>
      ) : workers.length === 0 ? (
        <div className="card-warm p-12 text-center space-y-3">
          <p className="text-sm font-bold text-white">No Personnel Enrolled for this Site</p>
          <p className="text-xs text-[#DCD7C9]/70">
            Click "Enroll New Worker" to assign field workers to {selectedSite?.name}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="card-warm p-5 space-y-4 flex flex-col justify-between border-[#3F4E4F] hover:border-[#A27B5C]/60 hover:shadow-2xl transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-[#3F4E4F]/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#A27B5C] text-white flex items-center justify-center font-black text-sm shadow-sm">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white font-sans leading-tight">
                        {worker.name}
                      </h4>
                      <span className="text-[11px] text-[#A27B5C] font-mono block mt-0.5">
                        {worker.phone_number}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                    🟢 Safe
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[#DCD7C9]/80">
                  <div className="flex justify-between">
                    <span className="text-[#DCD7C9]/60">Voice Language:</span>
                    <span className="font-bold uppercase text-white">{worker.preferred_language || 'en'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#DCD7C9]/60">Safety Consent:</span>
                    <span className="font-bold text-emerald-400">✓ Enrolled & Consented</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#DCD7C9]/60">Assigned Plot:</span>
                    <span className="font-bold text-[#A27B5C] truncate max-w-[160px]">
                      {selectedSite?.name.split('(')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#3F4E4F]/60">
                <button
                  onClick={() => setDirectCallTarget({ name: worker.name, phone: worker.phone_number })}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#1E2628] hover:bg-[#3F4E4F] text-white text-xs font-bold transition-all text-center border border-[#3F4E4F]"
                >
                  📞 Test Call
                </button>

                <button
                  onClick={() => handleDeleteWorker(worker)}
                  disabled={deletingId === worker.id}
                  className="py-2 px-3 rounded-xl bg-red-900/30 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-bold transition-all"
                  title="Remove worker from site"
                >
                  {deletingId === worker.id ? '...' : '🗑️ Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enroll Worker Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#242D30] text-[#DCD7C9] border-2 border-[#A27B5C] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3F4E4F] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👷</span>
                <h3 className="font-bold text-white text-base font-sans">Enroll Field Worker</h3>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-white/70 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollWorker} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carlos Rodriguez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1E2628] border border-[#A27B5C]/40 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Phone Number (E.164 format)</label>
                <input
                  type="text"
                  required
                  placeholder="+923172532350"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1E2628] border border-[#A27B5C]/40 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Voice Language</label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                  className="w-full bg-[#1E2628] border border-[#A27B5C]/40 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
                >
                  <option value="en">English (Professional Dispatcher)</option>
                  <option value="ur">Urdu (Regional Bilingual)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#3F4E4F]">
                <button type="button" onClick={() => setShowEnrollModal(false)} className="btn-charcoal">
                  Cancel
                </button>
                <button type="submit" disabled={enrolling} className="btn-bronze">
                  {enrolling ? 'Enrolling...' : '✓ Save Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Call Modal */}
      {directCallTarget && (
        <DirectCallModal
          initialWorkerName={directCallTarget.name}
          initialPhoneNumber={directCallTarget.phone}
          onClose={() => setDirectCallTarget(null)}
        />
      )}
    </div>
  )
}
