// src/components/AuditTimeline.jsx
import { useEffect, useState } from 'react'
import useSessionStore from '../store/sessionStore'
import { getAuditLogs } from '../api/sessions'

export default function AuditTimeline() {
  const { sessionId } = useSessionStore()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setLogs([])
      return
    }

    let isMounted = true
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const data = await getAuditLogs(sessionId)
        if (isMounted) setLogs(data.logs || [])
      } catch (err) {
        console.error('Failed to fetch audit logs', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [sessionId])

  return (
    <div className="bg-surface-container border border-border rounded-xl overflow-hidden h-full flex flex-col">
      <div className="px-5 py-3 border-b border-border flex justify-between items-center bg-surface-container-high shrink-0">
        <h2 className="font-display text-sm font-bold tracking-[0.08em] text-on-surface uppercase">SYSTEM AUDIT</h2>
        {loading && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {!sessionId && (
          <p className="text-xs text-outline text-center mt-4">Awaiting session initialization</p>
        )}
        {sessionId && logs.length === 0 && !loading && (
          <p className="text-xs text-outline text-center mt-4">No activity logged yet</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 text-xs animate-slide-in-right" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex flex-col items-center pt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${log.type === 'error' ? 'bg-error' : 'bg-success'}`} />
              {i !== logs.length - 1 && <div className="w-px h-full bg-border my-1" />}
            </div>
            <div className="flex-1 pb-3 border-b border-border/50">
              <div className="flex justify-between items-start mb-0.5">
                <span className="font-medium text-on-surface">{log.action}</span>
                <span className="text-[9px] font-mono text-outline">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">{log.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
