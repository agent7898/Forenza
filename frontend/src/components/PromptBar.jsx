// src/components/PromptBar.jsx
import { useState, useRef, useEffect } from 'react'
import useSessionStore from '../store/sessionStore'
import useAudioStore from '../store/audioStore'
import useAudioInput from '../hooks/useAudioInput'
import { parseNLP } from '../api/nlp'
import { refineFace } from '../api/sessions'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'मराठी' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
]

export default function PromptBar({ isInitial = false, onInitialGenerate }) {
  const [text, setText] = useState('')
  const [lang, setLang] = useState('en')
  const [status, setStatus] = useState('idle') // idle, listening, processing
  
  const { sessionId, setParams, setImageUrl, addPromptHistory, setLoading } = useSessionStore()
  const { isRecording, transcript } = useAudioStore()
  const { isProcessing, toggleRecording, stopRecording } = useAudioInput(lang)
  
  const textareaRef = useRef(null)

  // Sync transcript to text
  useEffect(() => {
    if (transcript && !isRecording && !isProcessing) {
      setText(transcript)
    }
  }, [transcript, isRecording, isProcessing])

  useEffect(() => {
    setStatus(isRecording ? 'listening' : isProcessing ? 'transcribing' : 'idle')
  }, [isRecording, isProcessing])

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleSend = async () => {
    const promptText = text.trim()
    if (!promptText) return

    stopRecording()
    setStatus('processing')
    setText('')

    if (isInitial && onInitialGenerate) {
      await onInitialGenerate(promptText, lang)
      setStatus('idle')
      return
    }

    if (!sessionId) {
      setStatus('idle')
      return
    }

    try {
      setLoading(true)
      // NLP Parse
      const nlpData = await parseNLP(promptText, lang)
      
      let patch = null
      if (nlpData.parameters) {
        patch = nlpData.parameters
        setParams(patch)
        
        // Attempt face generation — soft failure if ML service is offline
        try {
          const data = await refineFace(sessionId, useSessionStore.getState().parameters, promptText)
          if (data.image_url) {
            setImageUrl(data.image_url, data.side_image_url)
          }
        } catch (err) {
          toast('Parameters updated. ML service offline — face update unavailable.', {
            icon: '⚠️',
            style: { background: '#161B22', color: '#f59e0b', border: '1px solid #30363D' }
          })
        }
      }

      addPromptHistory({
        text: promptText,
        lang,
        patch,
        interpretation: nlpData.interpretation,
        ts: Date.now()
      })
      if (!patch || Object.keys(patch).length > 0) {
        toast.success('Command processed')
      }
    } catch (err) {
      toast.error('Failed to process command')
      addPromptHistory({ text: promptText, lang, error: true, ts: Date.now() })
    } finally {
      setStatus('idle')
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full animate-fade-in">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-on-surface-variant uppercase flex items-center gap-2">
          NLP Command
          {status === 'listening' && <span className="w-2 h-2 rounded-full bg-error animate-pulse" />}
          {status === 'processing' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        </span>
        <select value={lang} onChange={e => setLang(e.target.value)} disabled={status !== 'idle'}
          className="bg-surface-container-high border border-outline-variant text-xs text-on-surface rounded px-2 py-1 outline-none focus:border-primary">
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      
      <div className="relative border border-outline-variant rounded-lg bg-surface-container-lowest focus-within:border-primary transition-colors overflow-hidden flex shadow-sm">
        <button onClick={toggleRecording} disabled={status === 'processing'}
          className={`p-3 shrink-0 flex items-end justify-center transition-colors ${isRecording ? 'text-error animate-pulse' : 'text-on-surface-variant hover:text-on-surface'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Listening...' : isProcessing ? 'Transcribing...' : isInitial ? 'Describe the suspect to begin...' : 'Describe features to refine...'}
          disabled={status === 'processing' || isProcessing}
          rows={1}
          className="flex-1 bg-transparent resize-none py-3 px-2 text-sm text-on-surface outline-none placeholder-outline disabled:opacity-50"
        />
        
        <button onClick={handleSend} disabled={!text.trim() || status === 'processing'}
          className="p-3 shrink-0 flex items-end justify-center text-primary disabled:opacity-50 hover:text-primary-dim transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      {status === 'processing' && (
        <div className="text-[10px] text-primary animate-pulse text-center">Processing Natural Language...</div>
      )}
      {status === 'transcribing' && (
        <div className="text-[10px] text-secondary animate-pulse text-center">Transcribing Audio...</div>
      )}
    </div>
  )
}
