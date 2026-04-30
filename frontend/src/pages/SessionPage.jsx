// src/pages/SessionPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useSessionStore from '../store/sessionStore'
import FaceCanvas from '../components/FaceCanvas'
import SliderPanel from '../components/SliderPanel'
import PromptBar from '../components/PromptBar'
import PromptHistory from '../components/PromptHistory'
import AuditTimeline from '../components/AuditTimeline'
import CaseFiles from '../components/CaseFiles'
import SystemLog from '../components/SystemLog'
import OverlayPanel from '../components/OverlayPanel'
import { createSession, generateFace } from '../api/sessions'
import { listCases, createCase } from '../api/cases'
import { parseNLP } from '../api/nlp'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { id: 'Facial Lab', icon: '◉' },
  { id: 'Markers', icon: '🏷️' },
  { id: 'Case Files', icon: '▣' },
  { id: 'System Log', icon: '▤' },
]

export default function SessionPage() {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const { sessionId, reset, setSession, setImageUrl, addPromptHistory, setLoading, setParams } = useSessionStore()
  const navigate = useNavigate()
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('Facial Lab')
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')

  const loadCases = async () => {
    try {
      const data = await listCases()
      setCases(data)
    } catch (err) {
      console.error('Failed to load cases')
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  const handleInitialGenerate = async (promptText, lang) => {
    let sessionData
    let initialParams = {}
    let detectedGender = 'male'
    
    try {
      setLoading(true)
      
      // Step 1: Parse NLP for initial parameters
      try {
        const nlpData = await parseNLP(promptText, lang)
        if (nlpData.parameters) {
          initialParams = nlpData.parameters
          setParams(initialParams) // Update local store
        }
        if (nlpData.gender) {
          detectedGender = nlpData.gender
        }
      } catch (nlpErr) {
        toast.error('NLP processing failed, using default parameters')
      }

      // Step 2: Create session in DB with parsed parameters and selected case
      sessionData = await createSession({ 
        parameters: initialParams,
        gender: detectedGender,
        case_id: selectedCaseId || null,
        description: promptText
      })
      setSession(sessionData.id)
    } catch (err) {
      setLoading(false)
      toast.error('Failed to create session — check backend connection')
      return
    }

    // Step 3: Record the initial prompt
    addPromptHistory({
      text: promptText,
      lang,
      patch: initialParams,
      interpretation: 'Session initialised with parsed parameters.',
      ts: Date.now()
    })

    // Step 4: Attempt face generation — soft failure if ML service is offline
    try {
      const faceData = await generateFace(sessionData.id)
      if (faceData.image_url) {
        setImageUrl(faceData.image_url, faceData.side_image_url)
      }
      toast.success('Dual-view model generated')
    } catch (err) {
      // ML service not running yet — workspace still opens, image pending
      toast('Session ready. ML service offline — face generation unavailable.', {
        icon: '⚠️',
        style: { background: '#161B22', color: '#f59e0b', border: '1px solid #30363D' }
      })
    } finally {
      setLoading(false)
    }
  }


  const handleLogout = () => {
    reset()
    logout()
    toast.success('Session terminated')
    navigate('/login')
  }

  const handleNewSession = () => {
    reset()
    setActiveTab('Facial Lab')
    toast.success('Session reset')
  }

  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-[240px]' : 'w-[60px]'} h-full bg-surface-container-low border-r border-border flex flex-col transition-all duration-300 shrink-0`}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in truncate">
                <p className="font-display text-xs font-bold text-on-surface tracking-wider">RECON_UNIT</p>
                <p className="text-[10px] font-mono text-outline">FORENSIC LAB</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto min-h-0">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}>
                <span className="text-base shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="font-display font-medium tracking-wide truncate">{item.id}</span>}
              </button>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-border space-y-2 shrink-0">
          {sidebarOpen && user && (
            <div className="px-2 py-1">
              <p className="text-[10px] font-mono text-outline truncate">{user.email || 'OPERATIVE'}</p>
            </div>
          )}
          <button id="logout-btn" onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-error/70 hover:bg-error/5 hover:text-error transition-colors">
            <span className="shrink-0">⏻</span>
            {sidebarOpen && <span className="font-display font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <header className="h-12 px-6 border-b border-border flex items-center justify-between shrink-0 bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-display text-sm font-bold tracking-[0.08em] text-on-surface uppercase">
              {activeTab}
            </h1>
            {sessionId && activeTab === 'Facial Lab' && (
              <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {sessionId && activeTab === 'Facial Lab' && (
              <button onClick={handleNewSession}
                className="text-[10px] font-display font-medium text-on-surface-variant border border-outline-variant px-3 py-1 rounded-lg hover:bg-surface-container-high transition-colors">
                + NEW SESSION
              </button>
            )}
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
          </div>
        </header>

        {/* Content Area Based on Active Tab */}
        <div className="flex-1 p-6 overflow-hidden">
          {activeTab === 'Facial Lab' && (
            !sessionId ? (
              /* Phase 1: Initial NLP Input */
              <div className="max-w-2xl mx-auto mt-[10vh] animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h2 className="font-display text-xl font-bold text-on-surface tracking-wide">INITIALIZE RECONSTRUCTION</h2>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
                    Describe the subject's facial features in natural language. The system will process the parameters and generate a base morphological model.
                  </p>
                </div>
                <div className="max-w-xl mx-auto space-y-6">
                  <div>
                    <label className="text-[10px] font-display font-bold text-outline uppercase tracking-wider mb-2 block text-center">ASSIGN TO CASE (OPTIONAL)</label>
                    <select 
                      value={selectedCaseId} 
                      onChange={e => setSelectedCaseId(e.target.value)}
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="">-- NO CASE ASSIGNED --</option>
                      {cases.map(c => (
                        <option key={c.id} value={c.id}>{c.case_number} - {c.description?.slice(0, 30)}...</option>
                      ))}
                    </select>
                  </div>
                  <PromptBar isInitial={true} onInitialGenerate={handleInitialGenerate} />
                </div>
              </div>
            ) : (
              /* Phase 2: Active Session — full workspace */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full animate-fade-in">
                <div className="h-full flex flex-col min-h-0">
                  <FaceCanvas />
                </div>
                <div className="h-full flex flex-col gap-4 min-h-0">
                  <div className="shrink-0">
                    <PromptBar />
                  </div>
                  <div className="flex-[1] min-h-0">
                    <PromptHistory />
                  </div>
                  <div className="flex-[0.8] min-h-0">
                    <AuditTimeline />
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'Markers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full animate-fade-in">
              <div className="h-full flex flex-col min-h-0">
                <FaceCanvas />
              </div>
              <div className="h-full flex flex-col min-h-0">
                <OverlayPanel />
              </div>
            </div>
          )}

          {activeTab === 'Case Files' && <CaseFiles />}
          
          {activeTab === 'System Log' && <SystemLog />}
          
          {/* Generic Placeholders for tabs not fully built out yet */}
          {(activeTab === 'Evidence') && (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-xl text-on-surface-variant flex-col gap-4 animate-fade-in">
              <span className="text-4xl text-outline">◈</span>
              <p className="font-display font-medium tracking-wide uppercase">{activeTab} MODULE OFFLINE</p>
              <p className="text-xs text-outline">Awaiting backend integration to display data</p>
            </div>
          )}
        </div>
      </main>
      {/* Legal Disclaimer Overlay */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface-container-high/80 backdrop-blur-md border-t border-border py-1.5 px-4 flex items-center justify-center gap-2 z-[200]">
        <svg className="w-3.5 h-3.5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[10px] font-display font-medium text-on-surface-variant tracking-wide">
          <span className="text-warning font-bold">FORENSIC DISCLAIMER:</span> AI-generated reconstructions are morphological models based on descriptive testimony. These images are for investigative reference only and do not constitute absolute biological accuracy.
        </p>
      </footer>
    </div>
  )
}
