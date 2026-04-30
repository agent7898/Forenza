// src/components/FaceCanvas.jsx
import useSessionStore from '../store/sessionStore'
import { exportSession } from '../api/sessions'
import { matchFace } from '../api/match'
import toast from 'react-hot-toast'
import { useState } from 'react'
import useOverlayStore from '../store/overlayStore'

export default function FaceCanvas() {
  const { sessionId, imageUrl, sideImageUrl, isLoading, undo, redo, historyIndex, imageHistory } = useSessionStore()
  const { activeOverlays, updateOverlay } = useOverlayStore()
  const [exporting, setExporting] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matches, setMatches] = useState([])
  const [showMatches, setShowMatches] = useState(false)

  const handleExport = async () => {
    if (!imageUrl) return
    setExporting(true)
    try {
      // Use the backend proxy to bypass CORS restrictions
      const proxyUrl = `http://127.0.0.1:8000/api/sessions/download-image?url=${encodeURIComponent(imageUrl)}`
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('forensic_token')}`
        }
      })
      
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `forensic-render-${sessionId?.slice(0, 8) || 'export'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Image exported successfully')
    } catch (err) {
      toast.error('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleMatch = async () => {
    if (!sessionId) return
    setMatching(true)
    try {
      const results = await matchFace(sessionId)
      setMatches(results)
      setShowMatches(true)
      if (results.length === 0) {
        toast('No high-confidence matches found in database.', { icon: '🔍' })
      } else {
        toast.success(`Found ${results.length} potential matches`)
      }
    } catch (err) {
      toast.error('Matching service error')
    } finally {
      setMatching(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface-container border border-border rounded-xl overflow-hidden animate-fade-in">
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
      <div className="relative flex-1 bg-surface-container-lowest flex items-center justify-center overflow-hidden min-h-[400px]">
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
          compareMode && imageHistory.length > 1 ? (
            <div className="w-full h-full flex items-stretch">
              <div className="flex-1 border-r border-border relative flex items-center justify-center p-2 bg-surface-container-low/30">
                <img
                  src={imageHistory[0].url}
                  alt="Initial"
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute top-3 left-3 text-[8px] bg-surface-container-high/90 backdrop-blur border border-outline-variant px-1.5 py-0.5 rounded text-on-surface-variant font-display font-bold uppercase tracking-widest">Initial</div>
              </div>
              <div className="flex-1 relative flex items-center justify-center p-2 bg-surface-container-lowest">
                <img
                  src={imageUrl}
                  alt="Current"
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute top-3 right-3 text-[8px] bg-primary/20 border border-primary/30 text-primary px-1.5 py-0.5 rounded font-display font-bold uppercase tracking-widest backdrop-blur">Current</div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden" id="overlay-container">
              <img
                src={imageUrl}
                alt="Generated facial reconstruction"
                className="w-full h-full object-contain transition-opacity duration-500 pointer-events-none"
                id="face-canvas-image"
              />
              
              {/* Overlays Layer */}
              {activeOverlays.map(o => (
                <div 
                  key={o.id}
                  className="absolute cursor-move select-none"
                  style={{
                    left: `${o.x}%`,
                    top: `${o.y}%`,
                    transform: `translate(-50%, -50%) scale(${o.scale})`,
                    opacity: o.opacity,
                    filter: 'contrast(1.2) brightness(0.8) grayscale(1)',
                    mixBlendMode: 'multiply' // Blend with the skin
                  }}
                  onMouseDown={(e) => {
                    const container = e.currentTarget.parentElement;
                    const rect = container.getBoundingClientRect();
                    const onMouseMove = (moveEvent) => {
                      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
                      updateOverlay(o.id, { x, y });
                    };
                    const onMouseUp = () => {
                      window.removeEventListener('mousemove', onMouseMove);
                      window.removeEventListener('mouseup', onMouseUp);
                    };
                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                  }}
                >
                  <img 
                    src={o.url} 
                    alt={o.name} 
                    className="max-w-[400px] pointer-events-none" 
                    draggable="false"
                  />
                </div>
              ))}
            </div>
          )
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
          {/* History Controls */}
          {imageUrl && (
            <div className="flex items-center gap-1 border border-outline-variant rounded-lg p-0.5 bg-surface-container-lowest">
              <button onClick={undo} disabled={historyIndex <= 0 || isLoading} className="p-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:hover:text-on-surface-variant transition-colors" title="Undo">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              </button>
              <div className="w-px h-3 bg-outline-variant" />
              <button onClick={redo} disabled={historyIndex >= imageHistory.length - 1 || isLoading} className="p-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:hover:text-on-surface-variant transition-colors" title="Redo">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 10 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
              </button>
              <div className="w-px h-3 bg-outline-variant" />
              <button 
                onClick={() => setCompareMode(!compareMode)} 
                disabled={imageHistory.length <= 1} 
                className={`p-1 text-[10px] font-display font-bold px-3 rounded-md border transition-all ${compareMode ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary/50'} disabled:opacity-30`}
              >
                COMPARE
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMatch}
            disabled={!sessionId || !imageUrl || matching}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-display font-semibold border border-outline-variant rounded-lg transition-all ${matching ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {matching ? 'SEARCHING...' : 'MATCH DATABASE'}
          </button>
        </div>
      </div>

      {/* Matching Modal */}
      {showMatches && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-surface-container-high border border-border w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-on-surface uppercase tracking-wider">DATABASE MATCH RESULTS</h3>
                  <p className="text-xs text-on-surface-variant font-mono">Algorithm: Perceptual Hash (DCT Hamming Distance)</p>
                </div>
              </div>
              <button onClick={() => setShowMatches(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {matches.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-outline gap-3 opacity-60">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <p className="font-display font-semibold">NO MATCHES FOUND</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((match, idx) => (
                    <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:border-primary/50 transition-all group">
                      <div className="aspect-square relative overflow-hidden bg-black/5">
                        <img src={match.image_url} alt="Match" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 bg-primary/90 text-white text-[10px] font-mono px-2 py-1 rounded-full shadow-lg">
                          {match.score}% MATCH
                        </div>
                      </div>
                      <div className="p-3 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-outline uppercase tracking-tighter">Case Reference</span>
                          <span className="text-[10px] font-mono text-primary font-bold">{match.case_id?.slice(0, 8) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <span className="text-[10px] font-mono text-outline uppercase tracking-tighter">Action Logged</span>
                          <span className="text-[10px] font-mono text-on-surface uppercase">{match.action}</span>
                        </div>
                        <div className="pt-1 flex justify-between items-center text-[9px] text-outline">
                          <span>{new Date(match.timestamp).toLocaleDateString()}</span>
                          <span>{new Date(match.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-surface-container-lowest border-t border-border flex justify-end">
              <button onClick={() => setShowMatches(false)} className="px-6 py-2 bg-surface-container-high text-on-surface font-display font-bold text-xs rounded-lg hover:bg-surface-container-highest transition-all">CLOSE REPORT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
