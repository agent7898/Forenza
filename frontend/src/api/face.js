// src/api/face.js
import client from './client'

export const generateFace = (parameters) =>
  client.post('/api/face/generate', { parameters }).then(r => r.data)

export const refineFace = (patch) =>
  client.post('/api/face/refine', { patch }).then(r => r.data)
