// src/components/PromptHistory.jsx
import useSessionStore from '../store/sessionStore'

export default function PromptHistory() {
  const promptHistory = useSessionStore(s => s.promptHistory)

  return (
    <div className="flex flex-col border border-border rounded-lg bg-surface-container overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-border bg-surface-container-high shrink-0">
        <h3 className="text-xs font-bold tracking-[0.08em] text-on-surface uppercase">Command History</h3>
      </div>
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        {promptHistory.length === 0 ? (
          <p className="text-xs text-outline text-center py-4">No commands executed yet</p>
        ) : (
          promptHistory.map((item, i) => (
            <div key={i} className={`text-sm p-3 rounded-lg border ${item.error ? 'bg-error/5 border-error/20' : 'bg-surface-container-lowest border-border'} animate-slide-up`}>
              <div className="flex gap-2">
                <span className="text-primary font-mono text-[10px] mt-0.5">[{new Date(item.ts).toLocaleTimeString()}]</span>
                <p className={`text-sm ${item.error ? 'text-error' : 'text-on-surface'}`}>{item.text}</p>
              </div>
              {item.patch && (
                <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1">
                  {Object.entries(item.patch).map(([k, v]) => (
                    <span key={k} className="text-[10px] font-mono bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-primary">
                      {k}: {(v * 100).toFixed(0)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
