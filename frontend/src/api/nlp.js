// src/api/nlp.js
import client from './client'

/**
 * Parse natural language into face parameters.
 * POST /api/nlp/parse
 * Body: { text: string }  (lang forwarded as part of text context)
 * Returns: { interpretation: string, parameters: Partial<FaceParams> }
 *
 * The backend NLP endpoint returns { user_id, input, parsed }.
 * We normalise it to the shape the UI expects.
 */
export const parseNLP = async (text, lang) => {
  const res = await client.post('/api/nlp/parse', { text, lang })
  const data = res.data

  // Backend currently returns { user_id, input, parsed }
  // parsed is a dict of FaceParams keys → [0,1] values
  return {
    interpretation: data.interpretation ?? `Processed: "${text}"`,
    parameters: data.parsed ?? data.parameters ?? {},
  }
}

/**
 * Transcribe audio blob to text using the backend Whisper integration.
 * POST /api/nlp/transcribe
 */
export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData()
  // Append as a webm file (supported natively by MediaRecorder and Whisper)
  formData.append('file', audioBlob, 'recording.webm')
  
  const res = await client.post('/api/nlp/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data.transcript
}