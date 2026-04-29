// src/components/SystemLog.jsx
export default function SystemLog() {
  const logs = [
    { ts: '10:42:01', level: 'INFO', msg: 'Neural engine initialized successfully.' },
    { ts: '10:45:12', level: 'WARN', msg: 'Latency spike detected on latent inference node.' },
    { ts: '11:02:55', level: 'ERROR', msg: 'Failed to sync audit payload to remote server.' },
    { ts: '11:15:30', level: 'INFO', msg: 'Session SES-1029 gracefully terminated.' },
  ]

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest border border-border rounded-xl overflow-hidden animate-fade-in font-mono">
      <div className="px-6 py-3 border-b border-border bg-surface-container flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-[0.1em] text-on-surface uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          System Diagnostic Output
        </h2>
        <span className="text-[10px] text-outline">Terminal View</span>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-1 text-[11px]">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-4 hover:bg-surface-container-high px-2 py-1 rounded">
            <span className="text-outline shrink-0">[{log.ts}]</span>
            <span className={`shrink-0 w-12 ${
              log.level === 'ERROR' ? 'text-error' : 
              log.level === 'WARN' ? 'text-warning' : 'text-success'
            }`}>
              {log.level}
            </span>
            <span className="text-on-surface-variant">{log.msg}</span>
          </div>
        ))}
        <div className="flex gap-4 px-2 py-1 animate-pulse">
          <span className="text-primary">_</span>
        </div>
      </div>
    </div>
  )
}
