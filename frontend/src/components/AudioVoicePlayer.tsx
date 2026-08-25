import { useState, useEffect } from 'react'

interface AudioVoicePlayerProps {
  workerName: string
  siteName: string
  surfaceTempF: number
  refugeName: string
  reliefDeltaF: number
  language?: 'en' | 'ur'
  onDirectCallClick?: () => void
}

export default function AudioVoicePlayer({
  workerName,
  siteName,
  surfaceTempF,
  refugeName,
  reliefDeltaF,
  language = 'en',
  onDirectCallClick,
}: AudioVoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLang, setCurrentLang] = useState<'en' | 'ur'>(language)
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true)

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setHasSpeechSupport(false)
    }
  }, [])

  const englishScript = `Attention ${workerName || 'Worker'}! This is ThermaShift AI autonomous heat safety dispatch. A critical surface temperature of ${Math.round(surfaceTempF)} degrees Fahrenheit has been recorded at ${siteName || 'your work site'}. Under OSHA safety protocol, halt outdoor operations immediately and relocate to ${refugeName || 'Zone D Cooling Canopy'} for ${Math.round(reliefDeltaF)} degrees Fahrenheit cooling relief.`

  const urduScript = `توجہ فرمائیں ${workerName || 'ورکر'}! یہ تھرما شفٹ اے آئی ہیٹ سیفٹی ڈسپیچ ہے۔ آپ کی سائٹ پر اسفالٹ کا درجہ حرارت ${Math.round(surfaceTempF)} ڈگری ہو چکا ہے۔ اوشا پروٹوکول کے مطابق فوری طور پر کام روکیں اور ${refugeName || 'کولنگ کینوپی'} کی طرف منتقل ہو جائیں۔`

  function handlePlayAudio() {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    if (isPlaying) {
      setIsPlaying(false)
      return
    }

    const script = currentLang === 'ur' ? urduScript : englishScript
    const utterance = new SpeechSynthesisUtterance(script)
    utterance.rate = 0.95
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    if (currentLang === 'ur') {
      const urVoice = voices.find((v) => v.lang.startsWith('ur') || v.lang.startsWith('hi'))
      if (urVoice) utterance.voice = urVoice
    } else {
      const enVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural')))
      if (enVoice) utterance.voice = enVoice
    }

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.speak(utterance)
  }

  function handleStopAudio() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }

  if (!hasSpeechSupport) return null

  return (
    <div className="card-surface p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#141414]">
              Voice Dispatch Preview
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              Synthesized Audio Simulator
            </p>
          </div>
        </div>

        {/* Language Pill Switcher */}
        <div className="flex items-center gap-1 bg-[#f4f4f4] p-0.5 rounded-lg border border-[#e5e5e5] text-[11px]">
          <button
            onClick={() => {
              handleStopAudio()
              setCurrentLang('en')
            }}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
              currentLang === 'en' ? 'bg-[#141414] text-white shadow-sm' : 'text-slate-600 hover:text-[#141414]'
            }`}
          >
            English
          </button>
          <button
            onClick={() => {
              handleStopAudio()
              setCurrentLang('ur')
            }}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
              currentLang === 'ur' ? 'bg-[#141414] text-white shadow-sm' : 'text-slate-600 hover:text-[#141414]'
            }`}
          >
            اردو
          </button>
        </div>
      </div>

      {/* Script Box */}
      <div className="p-3 rounded-xl bg-[#f9fafb] border border-slate-200 space-y-1 text-xs">
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
          <span>Broadcast Transmission Script:</span>
          <span>{currentLang === 'en' ? 'EN-US' : 'UR-PK'}</span>
        </div>
        <p className={`text-[11px] leading-relaxed text-slate-800 font-medium ${currentLang === 'ur' ? 'text-right font-sans text-emerald-800 font-semibold' : ''}`}>
          {currentLang === 'ur' ? urduScript : englishScript}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <button
          onClick={handlePlayAudio}
          className={`btn-primary text-xs ${
            isPlaying ? 'bg-rose-600 hover:bg-rose-500 animate-pulse' : ''
          }`}
        >
          {isPlaying ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Stop Audio</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Play Warning</span>
            </>
          )}
        </button>

        {onDirectCallClick && (
          <button
            onClick={onDirectCallClick}
            className="btn-secondary text-xs"
            title="Dispatch call to real phone"
          >
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Dial Cellular</span>
          </button>
        )}
      </div>
    </div>
  )
}
