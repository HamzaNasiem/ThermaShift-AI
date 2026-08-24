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
    <div className="card-warm p-4 font-mono space-y-3 border-[#A27B5C]/50 shadow-xl bg-gradient-to-r from-[#242D30] to-[#1E2628]">
      <div className="flex items-center justify-between border-b border-[#3F4E4F]/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🔊</span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-sans tracking-wide">
              CALL-E Audio Dispatch Preview
            </h4>
            <span className="text-[9px] text-[#A27B5C] font-semibold">
              Synthesized Voice Warning (Browser Audio Simulator)
            </span>
          </div>
        </div>

        {/* Language Pill Switcher */}
        <div className="flex items-center gap-1 bg-[#1A2224] p-0.5 rounded-lg border border-[#3F4E4F] text-[10px]">
          <button
            onClick={() => {
              handleStopAudio()
              setCurrentLang('en')
            }}
            className={`px-2 py-0.5 rounded font-bold transition-all ${
              currentLang === 'en' ? 'bg-[#A27B5C] text-white' : 'text-[#DCD7C9]/60 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => {
              handleStopAudio()
              setCurrentLang('ur')
            }}
            className={`px-2 py-0.5 rounded font-bold transition-all ${
              currentLang === 'ur' ? 'bg-[#A27B5C] text-white' : 'text-[#DCD7C9]/60 hover:text-white'
            }`}
          >
            اردو
          </button>
        </div>
      </div>

      {/* Script Text Box */}
      <div className="p-3 rounded-xl bg-[#1A2224] border border-[#3F4E4F]/60 text-xs text-[#DCD7C9] space-y-1">
        <div className="flex items-center justify-between text-[9px] text-[#A27B5C] uppercase font-bold">
          <span>AI Task Transmission Script:</span>
          <span>{currentLang === 'en' ? 'EN-US Authorized' : 'UR-PK Regional'}</span>
        </div>
        <p className={`text-xs leading-relaxed ${currentLang === 'ur' ? 'text-right font-sans text-emerald-300 font-semibold' : 'text-white'}`}>
          {currentLang === 'ur' ? urduScript : englishScript}
        </p>
      </div>

      {/* Play Controls & Audio Equalizer Bars */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayAudio}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-md ${
              isPlaying
                ? 'bg-red-800 hover:bg-red-700 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <span>{isPlaying ? '⏹ Stop Voice' : '▶ Play Voice Warning'}</span>
          </button>

          {onDirectCallClick && (
            <button
              onClick={onDirectCallClick}
              className="px-3 py-1.5 rounded-xl bg-[#1A2224] hover:bg-[#3F4E4F] text-[#A27B5C] hover:text-white text-xs font-bold font-mono border border-[#A27B5C]/40 transition-all flex items-center gap-1"
              title="Call your real mobile phone via CALL-E"
            >
              <span>📱</span>
              <span>Cellular Call</span>
            </button>
          )}
        </div>

        {isPlaying && (
          <div className="flex items-center gap-1">
            <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
            <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="text-[10px] text-emerald-400 font-bold ml-1.5 uppercase">Broadcasting...</span>
          </div>
        )}
      </div>
    </div>
  )
}

