# README_INTEGRATION

## Current Project Architecture

This project is the frontend for a **Forensic Facial Reconstruction System**. It allows operators to describe suspects using natural language, dynamically parse parameters via a mocked local backend, and render iterative facial adjustments.

### Stack
- **React 18** (Vite)
- **Tailwind CSS v4**
- **Zustand** for memory-only state management
- **Axios** for API requests
- **Web Speech API** for Voice-to-Text input

### Env Setup
The project expects the backend running at `http://localhost:8000`, however, we currently use a `MOCK FALLBACK` strategy in `src/api` to let you test the UI locally. You don't need any special `.env` variables right now, but you can set `VITE_API_URL` when ready.

### Run Steps
1. `npm install`
2. `npm run dev`
3. Access `http://localhost:5173`
4. Login with:
   - **Email**: `agent@forensics.gov`
   - **Password**: `password123`

### File Structure
- `/src/pages` - High level views (`LoginPage`, `RegisterPage`, `SessionPage`)
- `/src/components` - Reusable modules (`PromptBar`, `PromptHistory`, `SliderPanel`, `AuditTimeline`, etc.)
- `/src/store` - Zustand state managers (`sessionStore`, `authStore`, `audioStore`)
- `/src/api` - Axios wrappers with mock delay fallbacks.
- `/src/hooks` - Custom React hooks (`useAudioInput.js`)

## Integration Changes Made (MEMBER 4 Update)
1. **Removed `NLPChat.jsx`**: We migrated from the single chat block into a separated, production-ready `PromptBar` and `PromptHistory` flow.
2. **Web Speech API**: Introduced `useAudioInput.js` hook and `audioStore.js` to handle live voice transcription into the `PromptBar`.
3. **Session UI Update**: The right panel of `SessionPage` now contains `PromptBar` at the top, `PromptHistory` in the middle, and `AuditTimeline` at the bottom.
4. **State Expansion**: `sessionStore` now maintains a `promptHistory` array to track all commands, patches, and interpretations.

## Pending Issues
- **Backend Hooks**: Once the FastAPI backend is running, the mock fallback logic in `src/api/` needs to be removed.
- **Biometrics & Evidence Tabs**: These views in the `SessionPage` sidebar are currently placeholders ("Offline") awaiting API endpoints.
