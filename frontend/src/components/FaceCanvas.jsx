// src/components/FaceCanvas.jsx
import useSessionStore from '../store/sessionStore'
import { exportSession } from '../api/sessions'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function FaceCanvas() {
  const { sessionId, imageUrl, isLoading } = useSessionStore()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!sessionId) return
    setExporting(true)
    try {
      const data = await exportSession(sessionId)
      if (data.download_url) {
        const link = document.createElement('a')
        link.href = data.download_url
        link.download = `forensic-export-${sessionId}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      toast.success('Export initiated')
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-surface-container border border-border rounded-xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
          <h2 className="font-display text-sm font-bold tracking-[0.08em] text-on-surface uppercase">
            BIOMETRIC RENDER
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {sessionId && (
            <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">
              SID: {sessionId.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative aspect-[3/4] max-h-[520px] bg-surface-container-lowest flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-surface/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-2 border-primary/30 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
            </div>
            <span className="text-xs font-display text-primary tracking-wider animate-pulse">
              PROCESSING...
            </span>
          </div>
        )}

        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Generated facial reconstruction"
            className="w-full h-full object-contain transition-opacity duration-500"
            id="face-canvas-image"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-on-surface-variant">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center">
              <svg className="w-10 h-10 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-display font-medium">No Model Active</p>
              <p className="text-xs text-outline mt-1">Select presets to generate</p>
            </div>
          </div>
        )}

        {/* Crosshair overlay */}
        {imageUrl && !isLoading && (
          <>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/15 pointer-events-none" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-primary/15 pointer-events-none" />
            <div className="absolute top-4 right-4 text-[9px] font-mono text-primary/50">
              RES: 2048×2048
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={`text-[10px] font-mono uppercase tracking-wider ${imageUrl ? 'text-success' : 'text-outline'}`}>
            {imageUrl ? '● MODEL ACTIVE' : '○ STANDBY'}
          </span>
        </div>
        <button
          id="export-btn"
          onClick={handleExport}
          disabled={!sessionId || !imageUrl || exporting}
          className="flex items-center gap-2 px-4 py-2 text-xs font-display font-semibold border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {exporting ? 'EXPORTING...' : 'EXPORT HIGH-RES'}
        </button>
      </div>
    </div>
  )
}
