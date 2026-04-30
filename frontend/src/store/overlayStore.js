// src/store/overlayStore.js
import { create } from 'zustand'

const useOverlayStore = create((set) => ({
  activeOverlays: [], // Array of { id, type, url, x, y, scale, opacity }
  
  addOverlay: (overlay) => set((state) => ({ 
    activeOverlays: [...state.activeOverlays, {
      id: Date.now(),
      x: 50, // center %
      y: 50, // center %
      scale: 1,
      opacity: 0.8,
      ...overlay
    }] 
  })),
  
  removeOverlay: (id) => set((state) => ({ 
    activeOverlays: state.activeOverlays.filter(o => o.id !== id) 
  })),
  
  updateOverlay: (id, patch) => set((state) => ({
    activeOverlays: state.activeOverlays.map(o => o.id === id ? { ...o, ...patch } : o)
  })),
  
  clearOverlays: () => set({ activeOverlays: [] })
}))

export default useOverlayStore
