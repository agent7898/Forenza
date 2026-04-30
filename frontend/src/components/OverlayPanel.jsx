// src/components/OverlayPanel.jsx
import useOverlayStore from '../store/overlayStore'
import { useState } from 'react'

const ASSETS = {
  BEARDS: [
    { name: 'Full Beard', url: '/assets/overlays/beards/BEARDS_GRAY/pngwing.com.png' },
    { name: 'Stubble', url: '/assets/overlays/beards/BEARDS_GRAY/pngwing.com (1).png' },
    { name: 'Goatee', url: '/assets/overlays/beards/BEARDS_GRAY/pngwing.com (2).png' },
    { name: 'Thick Beard', url: '/assets/overlays/beards/BEARDS_GRAY/pngwing.com (10).png' },
  ],
  HAIR: [
    { name: 'Short Cut', url: '/assets/overlays/hair/HAIR_GRAY/pngwing.com (13).png' },
    { name: 'Medium', url: '/assets/overlays/hair/HAIR_GRAY/pngwing.com (14).png' },
    { name: 'Long', url: '/assets/overlays/hair/HAIR_GRAY/pngwing.com (15).png' },
    { name: 'Buzz', url: '/assets/overlays/hair/HAIR_GRAY/pngwing.com (21).png' },
  ],
  TATTOOS: [
    { name: 'Spider', url: '/assets/overlays/tattoos/TATOO_GRAY/tatoo1.png' },
    { name: 'Tribal', url: '/assets/overlays/tattoos/TATOO_GRAY/tatoo2.png' },
    { name: 'Cross', url: '/assets/overlays/tattoos/TATOO_GRAY/tatoo3.png' },
    { name: 'Rose', url: '/assets/overlays/tattoos/TATOO_GRAY/tatoo5.png' },
  ],
  SCARS: [
    { name: 'Cut 1', url: '/assets/overlays/scars/SCAR_GRAY/pngwing.com (22).png' },
    { name: 'Cut 2', url: '/assets/overlays/scars/SCAR_GRAY/pngwing.com (23).png' },
    { name: 'Burn', url: '/assets/overlays/scars/SCAR_GRAY/pngwing.com (25).png' },
  ]
}

export default function OverlayPanel() {
  const { addOverlay, activeOverlays, removeOverlay, updateOverlay, clearOverlays } = useOverlayStore()
  const [activeTab, setActiveTab] = useState('BEARDS')

  return (
    <div className="h-full flex flex-col bg-surface-container border border-border rounded-xl overflow-hidden animate-fade-in">
      <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-surface-container-low">
        <h2 className="font-display text-sm font-bold tracking-[0.08em] text-on-surface uppercase">
          FORENSIC OVERLAYS
        </h2>
        {activeOverlays.length > 0 && (
          <button 
            onClick={clearOverlays}
            className="text-[10px] font-display font-bold text-error/80 hover:text-error uppercase tracking-tighter border border-error/20 px-2 py-1 rounded hover:bg-error/5 transition-all"
          >
            CLEAR ALL
          </button>
        )}
      </div>

      <div className="flex border-b border-border bg-surface-container-low">
        {Object.keys(ASSETS).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-display font-bold tracking-widest transition-colors ${activeTab === tab ? 'text-primary bg-primary/5' : 'text-outline hover:text-on-surface'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ASSETS[activeTab].map((asset, idx) => (
            <button
              key={idx}
              onClick={() => addOverlay({ type: activeTab, url: asset.url, name: asset.name })}
              className="group relative aspect-square bg-surface-container-highest rounded-lg border border-outline-variant hover:border-primary transition-all overflow-hidden flex items-center justify-center p-2"
            >
              <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain grayscale opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm py-1">
                <p className="text-[8px] text-white text-center font-display font-bold uppercase tracking-tighter">{asset.name}</p>
              </div>
            </button>
          ))}
        </div>

        {activeOverlays.length > 0 && (
          <div className="border-t border-border pt-4">
            <h3 className="text-[10px] font-display font-bold text-outline uppercase tracking-wider mb-3">ACTIVE LAYERS</h3>
            <div className="space-y-3">
              {activeOverlays.map(o => (
                <div key={o.id} className="bg-surface-container-low border border-outline-variant rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-display font-bold text-on-surface uppercase tracking-tight">{o.name}</span>
                    <button onClick={() => removeOverlay(o.id)} className="text-error/60 hover:text-error text-[10px]">✕</button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-outline uppercase">
                      <span>Opacity</span>
                      <span>{Math.round(o.opacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={o.opacity} 
                      onChange={(e) => updateOverlay(o.id, { opacity: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-outline uppercase">
                      <span>Scale</span>
                      <span>{Math.round(o.scale * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2" step="0.01" value={o.scale} 
                      onChange={(e) => updateOverlay(o.id, { scale: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-outline uppercase">POS X</span>
                      <input type="number" value={o.x} onChange={e => updateOverlay(o.id, { x: parseInt(e.target.value) })} className="w-full bg-surface-container-highest text-[10px] p-1 rounded" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-outline uppercase">POS Y</span>
                      <input type="number" value={o.y} onChange={e => updateOverlay(o.id, { y: parseInt(e.target.value) })} className="w-full bg-surface-container-highest text-[10px] p-1 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
