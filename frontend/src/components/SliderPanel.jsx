// src/components/SliderPanel.jsx
import { useCallback, useRef } from 'react'
import useSessionStore from '../store/sessionStore'
import { refineFace } from '../api/sessions'

const PARAMS = [
  { key: 'jaw_width', label: 'Jaw Width', cat: 'Mandibular' },
  { key: 'chin_length', label: 'Chin Length', cat: 'Mandibular' },
  { key: 'face_length', label: 'Face Length', cat: 'Cranial' },
  { key: 'eye_size', label: 'Eye Size', cat: 'Ocular' },
  { key: 'eye_spacing', label: 'Eye Spacing', cat: 'Ocular' },
  { key: 'eye_angle', label: 'Eye Angle', cat: 'Ocular' },
  { key: 'nose_length', label: 'Nose Length', cat: 'Nasal' },
  { key: 'nose_width', label: 'Nose Width', cat: 'Nasal' },
  { key: 'lip_thickness', label: 'Lip Thickness', cat: 'Oral' },
  { key: 'mouth_width', label: 'Mouth Width', cat: 'Oral' },
]

export default function SliderPanel() {
  const { sessionId, parameters, setParam, setImageUrl, setLoading } = useSessionStore()
  const timer = useRef(null)

  const handleChange = useCallback((param, raw) => {
    const val = raw / 100
    setParam(param, val)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!sessionId) return
      setLoading(true)
      try {
        const data = await refineFace(sessionId, { ...useSessionStore.getState().parameters })
        if (data.image_url) setImageUrl(data.image_url)
      } catch (err) { console.error('Refine failed:', err) }
      finally { setLoading(false) }
    }, 350)
  }, [sessionId, setParam, setImageUrl, setLoading])

  const grouped = PARAMS.reduce((acc, p) => {
    if (!acc[p.cat]) acc[p.cat] = []
    acc[p.cat].push(p)
    return acc
  }, {})

  return (
    <div className="bg-surface-container border border-border rounded-xl overflow-hidden animate-fade-in">
      <div className="px-6 py-3 border-b border-border">
        <h2 className="font-display text-sm font-bold tracking-[0.08em] text-on-surface uppercase">BIOMETRIC FINE-TUNING</h2>
        <p className="text-[11px] text-on-surface-variant mt-0.5">Adjust parameters for model refinement</p>
      </div>
      <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
        {Object.entries(grouped).map(([cat, params]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-display font-bold tracking-[0.12em] text-primary uppercase">{cat}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2.5">
              {params.map(p => {
                const v = Math.round(parameters[p.key] * 100)
                return (
                  <div key={p.key} id={`slider-${p.key}`} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-on-surface-variant font-medium">{p.label}</label>
                      <span className="text-xs font-mono text-primary tabular-nums">{v}</span>
                    </div>
                    <input type="range" min="0" max="100" value={v}
                      onChange={e => handleChange(p.key, Number(e.target.value))}
                      className="w-full" disabled={!sessionId} aria-label={p.label} />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-2.5 border-t border-border flex items-center justify-between">
        <span className="text-[10px] font-mono text-on-surface-variant">{sessionId ? 'LIVE' : 'NO SESSION'}</span>
        <span className="text-[10px] font-mono text-outline">DEBOUNCE: 350ms</span>
      </div>
    </div>
  )
}
