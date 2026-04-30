// src/store/sessionStore.js
import { create } from 'zustand'

const DEFAULT_PARAMS = {
  jaw_width: 0.5,
  chin_length: 0.5,
  face_length: 0.5,
  eye_size: 0.5,
  eye_spacing: 0.5,
  eye_angle: 0.5,
  nose_length: 0.5,
  nose_width: 0.5,
  lip_thickness: 0.5,
  mouth_width: 0.5,
}

const useSessionStore = create((set) => ({
  sessionId: null,
  presets: null,
  parameters: { ...DEFAULT_PARAMS },
  imageUrl: null,
  imageHistory: [],
  historyIndex: -1,
  promptHistory: [],
  isLoading: false,

  setSession: (id) => set({ sessionId: id }),
  setPresets: (presets) => set({ presets }),
  setParams: (params) => set((state) => ({ parameters: { ...state.parameters, ...params } })),
  setParam: (key, val) => set((state) => ({ parameters: { ...state.parameters, [key]: val } })),
  
  setImageUrl: (url, params = null) => set((state) => {
    // Branch off from current history index if we've undone steps
    const newHistory = state.imageHistory.slice(0, state.historyIndex + 1)
    newHistory.push({ url, params: params || state.parameters })
    return { 
      imageUrl: url,
      imageHistory: newHistory,
      historyIndex: newHistory.length - 1
    }
  }),

  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      const prevState = state.imageHistory[newIndex]
      return {
        historyIndex: newIndex,
        imageUrl: prevState.url,
        parameters: prevState.params || state.parameters
      }
    }
    return state
  }),

  redo: () => set((state) => {
    if (state.historyIndex < state.imageHistory.length - 1) {
      const newIndex = state.historyIndex + 1
      const nextState = state.imageHistory[newIndex]
      return {
        historyIndex: newIndex,
        imageUrl: nextState.url,
        parameters: nextState.params || state.parameters
      }
    }
    return state
  }),

  setLoading: (loading) => set({ isLoading: loading }),
  addPromptHistory: (item) => set((state) => ({ promptHistory: [...state.promptHistory, item] })),

  reset: () => set({
    sessionId: null,
    presets: null,
    parameters: { ...DEFAULT_PARAMS },
    promptHistory: [],
    imageUrl: null,
    imageHistory: [],
    historyIndex: -1,
    isLoading: false
  })
}))

export default useSessionStore