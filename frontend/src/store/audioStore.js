// src/store/audioStore.js
import { create } from 'zustand'

const useAudioStore = create((set) => ({
  isRecording: false,
  transcript: '',
  setIsRecording: (isRecording) => set({ isRecording }),
  setTranscript: (transcript) => set({ transcript }),
}))

export default useAudioStore
