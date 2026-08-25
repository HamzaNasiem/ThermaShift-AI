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
    <div className="flex items-center gap-2.5 select-none">
      {/* Custom Vector Emblem */}
      <div className={`${iconDimensions} shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative bg-[#ffffff] flex items-center justify-center`}>
        <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>

          {/* Satellite Radar Concentric Arc */}
          <circle cx="32" cy="32" r="24" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* T-Bar Top Crossbar */}
          <g>
            <path
              d="M16 18C16 16.3431 17.3431 15 19 15H45C46.6569 15 48 16.3431 48 18C48 19.6569 46.6569 21 45 21H19C17.3431 21 16 19.6569 16 18Z"
              fill="url(#logoGradientLight)"
            />

            {/* Relocation Vector Shift Arrow */}
            <path
              d="M32 23V48M32 48L21 37M32 48L43 37"
              stroke="url(#logoGradientLight)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle cx="32" cy="27" r="3" fill="#141414" />
            <circle cx="32" cy="48" r="2.5" fill="#06B6D4" />
          </g>
        </svg>
      </div>

      {/* Brand Typography & FortyGuard OS Pill */}
      {showText && (
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#141414] text-base tracking-tight leading-none">
            Therma<span className="text-emerald-600">Shift</span>
          </span>
          {showBadge && (
            <span className="text-[10px] text-slate-700 font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 tracking-normal">
              FortyGuard OS
            </span>
          )}
        </div>
      )}
    </div>
  )
}
