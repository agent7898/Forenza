// src/api/sessions.js
import client from './client'

/**
 * Create a new session — POST /api/sessions
 * Backend expects: { parameters: FaceParams, preset?: string }
 * Returns: { id, user_id, parameters, preset, z_current, created_at, updated_at }
 */
export const createSession = async (presets) => {
  const res = await client.post('/api/sessions', {
    parameters: presets?.parameters ?? {},
    preset: presets?.preset ?? null,
  })
  // Normalise to the shape the UI expects: { session_id }
  return { session_id: res.data.id, ...res.data }
}

/**
 * Generate a face — POST /api/sessions/:id/generate
 * Returns: { session_id, image_url, z_current, timestamp }
 */
export const generateFace = async (sessionId) => {
  const res = await client.post(`/api/sessions/${sessionId}/generate`)
  return res.data
}

/**
 * Refine face with updated parameters — POST /api/sessions/:id/refine
 * Body: { parameters: FaceParams }
 * Returns: { session_id, image_url, z_current, parameters, timestamp }
 */
export const refineFace = async (sessionId, parameters) => {
  const res = await client.post(`/api/sessions/${sessionId}/refine`, { parameters })
  return res.data
}

/**
 * Fetch audit log for a session — GET /api/sessions/:id/history
 * Returns: { session_id, history: AuditLogRead[] }
 * Normalised to { logs: [...] } for the AuditTimeline component.
 */
export const getAuditLogs = async (sessionId) => {
  const res = await client.get(`/api/sessions/${sessionId}/history`)
  const history = res.data.history ?? []
  return {
    logs: history.map((entry) => ({
      action: entry.action,
      details: entry.params_after
        ? Object.entries(entry.params_after)
            .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}`)
            .join(', ')
        : '',
      timestamp: entry.timestamp,
      type: 'info',
    })),
  }
}

/**
 * Export session data — GET /api/sessions/:id/export
 * Returns: { session_id, parameters, z_current, preset, created_at, updated_at }
 */
export const exportSession = async (sessionId) => {
  const res = await client.get(`/api/sessions/${sessionId}/export`)
  return res.data
}