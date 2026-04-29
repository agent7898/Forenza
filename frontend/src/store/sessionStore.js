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
  promptHistory: [],
  isLoading: false,

  setSession: (id) => set({ sessionId: id }),
  setPresets: (presets) => set({ presets }),
  setParams: (params) => set((state) => ({ parameters: { ...state.parameters, ...params } })),
  setParam: (key, val) => set((state) => ({ parameters: { ...state.parameters, [key]: val } })),
  setImageUrl: (url) => set({ imageUrl: url }),
  setLoading: (loading) => set({ isLoading: loading }),
  addPromptHistory: (item) => set((state) => ({ promptHistory: [...state.promptHistory, item] })),

  reset: () => set({
    sessionId: null,
    presets: null,
    parameters: { ...DEFAULT_PARAMS },
    promptHistory: [],
    imageUrl: null,
    isLoading: false
  })
}))

export default useSessionStore