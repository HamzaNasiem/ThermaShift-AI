import { useState, useEffect } from 'react'

const FORTYGUARD_VOTING_URL = 'https://bbcbafbd.r.af.d.sendibt2.com/tr/cl/DiQaMvuxK9O-SN0xc7UuriviLI9BDJBsXzxNU_APpMpnWVxuIP9_1yIS73eN71z3-RG7NIxH9B5VLz5JC6YBq43t173cpg45cb9vM5JP27BNP919Tovbs-oCaW4xhT8MwwllYu456fdfHrWqCm8lAT27bMqKHWXWi2LfD252LkwwPP3iRV3oAyREHtA-xp4oBPF4PyHrmfh1SU7UD7AcBk7e8pD_mAJwj09yFEZPQL9ALzSPSsUBj3_4kkcgSFpjS85M5LAofZE6i_DI93zh51UyPA_3ZOk7rD0y5nEe'

export default function VotingBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem('thermashift_voting_banner_dismissed')
    if (!isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('thermashift_voting_banner_dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <aside aria-label="Voting Notification" className="fixed bottom-4 right-4 z-[9999] max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#141414]/95 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 backdrop-blur-xl relative overflow-hidden ring-1 ring-white/10">
        {/* Ambient Glows */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          {/* Flame Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <svg className="w-5 h-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0 pr-5">
            {/* Tag */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-0.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>FortyGuard Global Hackathon’26</span>
            </div>

            {/* Title & Description */}
            <h4 className="text-sm font-bold text-white tracking-tight">
              Public Voting is Live! 🗳️
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              If you find <span className="text-amber-300 font-semibold">ThermaShift AI</span> impactful for outdoor workers, please cast your vote on the FortyGuard Dashboard.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <a
                href={FORTYGUARD_VOTING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Vote on Dashboard</span>
                <svg className="w-3 h-3 ml-0.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <button
                onClick={handleDismiss}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>

          {/* Close Icon Button */}
          <button
            onClick={handleDismiss}
            aria-label="Close voting reminder"
            className="absolute top-0 right-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
