import { useState } from 'react'

interface DirectCallModalProps {
  initialWorkerName?: string
  initialPhoneNumber?: string
  onClose: () => void
}

export default function DirectCallModal({
  initialWorkerName = '',
  initialPhoneNumber = '',
  onClose,
}: DirectCallModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber)
  const [workerName, setWorkerName] = useState(initialWorkerName)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCall() {
    if (!phoneNumber) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Call CALL-E directly via backend — no DB worker creation, no site lookup
      const res = await fetch('/api/internal/calle/direct-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          worker_name: workerName || 'Field Worker',
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(errData.detail || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#2C3639] text-[#DCD7C9] border-2 border-[#A27B5C] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3F4E4F] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A27B5C] flex items-center justify-center text-white text-xl">
              📱
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Dial Real Mobile Phone via CALL-E
              </h2>
              <p className="text-[10px] text-[#A27B5C] font-mono tracking-wider uppercase font-semibold">
                Live Outbound Call to Your Phone
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#DCD7C9]/70 hover:text-white text-xl font-bold font-mono px-2 py-1">
            ✕
          </button>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Your Name</label>
            <input
              type="text"
              placeholder="e.g. Asad Ali"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="w-full bg-[#3F4E4F] border border-[#A27B5C]/40 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#DCD7C9]/70 uppercase mb-1">Your Phone Number (with Country Code)</label>
            <input
              type="text"
              placeholder="e.g. +923001234567 or +14155552671"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-[#3F4E4F] border border-[#A27B5C]/40 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A27B5C]"
            />
            <p className="text-[10px] text-[#A27B5C] mt-1">Include "+" and country code (e.g. +92 for PK, +1 for US)</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {result && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs space-y-1">
              <p className="font-bold">✓ CALL-E Voice Call Dispatched!</p>
              <p className="text-[10px]">Your phone will ring shortly with the autonomous heat evacuation warning.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#3F4E4F]">
          <button onClick={onClose} className="btn-charcoal border border-[#3F4E4F]">
            Cancel
          </button>
          <button
            onClick={handleCall}
            disabled={loading || !phoneNumber}
            className="btn-bronze flex items-center gap-2"
          >
            <span>{loading ? 'Dialing via CALL-E...' : '📞 Call My Phone Now'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
