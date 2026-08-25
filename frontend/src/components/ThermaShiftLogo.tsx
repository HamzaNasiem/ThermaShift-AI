interface ThermaShiftLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  showBadge?: boolean
}

export default function ThermaShiftLogo({
  size = 'md',
  showText = true,
  showBadge = true,
}: ThermaShiftLogoProps) {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size]

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Custom Vector Emblem */}
      <div className={`${iconDimensions} shrink-0 rounded-xl overflow-hidden shadow-lg border border-slate-800 relative bg-[#0D1418] flex items-center justify-center`}>
        <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Satellite Radar Concentric Arc */}
          <circle cx="32" cy="32" r="24" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

          {/* T-Bar Top Crossbar */}
          <g filter="url(#logoGlow)">
            <path
              d="M16 18C16 16.3431 17.3431 15 19 15H45C46.6569 15 48 16.3431 48 18C48 19.6569 46.6569 21 45 21H19C17.3431 21 16 19.6569 16 18Z"
              fill="url(#logoGradient)"
            />

            {/* Relocation Vector Shift Arrow */}
            <path
              d="M32 23V48M32 48L21 37M32 48L43 37"
              stroke="url(#logoGradient)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle cx="32" cy="27" r="3" fill="#FFFFFF" />
            <circle cx="32" cy="48" r="2.5" fill="#06B6D4" />
          </g>
        </svg>
      </div>

      {/* Brand Typography & FortyGuard OS Pill */}
      {showText && (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-tight leading-none">
                Therma<span className="text-emerald-400">Shift</span>
              </span>
              {showBadge && (
                <span className="text-[10px] text-slate-300 font-medium px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 tracking-normal">
                  FortyGuard OS
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
