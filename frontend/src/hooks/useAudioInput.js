// src/hooks/useAudioInput.js
import { useRef, useState } from 'react'
import useAudioStore from '../store/audioStore'
import { transcribeAudio } from '../api/nlp'
import toast from 'react-hot-toast'

export default function useAudioInput(lang = 'en') {
  const { isRecording, setIsRecording, setTranscript } = useAudioStore()
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const [isProcessing, setIsProcessing] = useState(false)

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorderRef.current = new MediaRecorder(stream, {
          // Use webm format if supported
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
        })
        
        audioChunksRef.current = []
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }
        
        mediaRecorderRef.current.onstop = async () => {
          setIsProcessing(true)
          try {
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: mediaRecorderRef.current.mimeType || 'audio/webm' 
            })
            const transcript = await transcribeAudio(audioBlob)
            setTranscript(transcript)
          } catch (err) {
            console.error('Transcription error:', err)
            toast.error('Failed to transcribe audio')
          } finally {
            setIsProcessing(false)
            // Cleanup media tracks
            stream.getTracks().forEach(track => track.stop())
          }
        }
        
        setTranscript('')
        mediaRecorderRef.current.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Mic access denied:', err)
        toast.error('Microphone access denied')
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return { isRecording, isProcessing, toggleRecording, stopRecording }
}
