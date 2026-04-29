// src/components/CaseFiles.jsx
export default function CaseFiles() {
  // Placeholder data - you will replace this with a backend GET request later
  const mockCases = [
    { id: 'CAS-9942', status: 'ACTIVE', date: '2026-10-12', subject: 'Unknown Suspect A', match: '87%' },
    { id: 'CAS-8810', status: 'CLOSED', date: '2026-09-04', subject: 'John Doe', match: '100%' },
    { id: 'CAS-7731', status: 'PENDING', date: '2026-08-22', subject: 'Unknown Suspect B', match: '42%' },
  ]

  return (
    <div className="h-full flex flex-col bg-surface-container border border-border rounded-xl overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-bold tracking-[0.08em] text-on-surface uppercase">DATABASE ARCHIVE</h2>
          <p className="text-[11px] text-on-surface-variant mt-1">Review and manage saved forensic cases</p>
        </div>
        <button className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
          + NEW RECORD
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-xs font-display font-semibold text-outline tracking-wider uppercase">Case ID</th>
              <th className="pb-3 text-xs font-display font-semibold text-outline tracking-wider uppercase">Status</th>
              <th className="pb-3 text-xs font-display font-semibold text-outline tracking-wider uppercase">Date Logged</th>
              <th className="pb-3 text-xs font-display font-semibold text-outline tracking-wider uppercase">Subject Profile</th>
              <th className="pb-3 text-xs font-display font-semibold text-outline tracking-wider uppercase">Biometric Match</th>
            </tr>
          </thead>
          <tbody>
            {mockCases.map((c, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-surface-container-high transition-colors cursor-pointer group">
                <td className="py-4 text-sm font-mono text-primary group-hover:underline">{c.id}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-[10px] font-mono rounded ${
                    c.status === 'ACTIVE' ? 'bg-success/10 text-success' : 
                    c.status === 'CLOSED' ? 'bg-outline-variant text-on-surface-variant' : 
                    'bg-warning/10 text-warning'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-4 text-sm text-on-surface-variant">{c.date}</td>
                <td className="py-4 text-sm text-on-surface">{c.subject}</td>
                <td className="py-4 text-sm font-mono text-on-surface-variant">{c.match}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
