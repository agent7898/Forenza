# AI-Assisted Forensic Facial Reconstruction System

## Overview

This project is a **product-oriented MVP** designed to assist law enforcement in reconstructing suspect faces from eyewitness input.

Unlike conventional AI image generators, this system focuses on:

* **Deterministic face generation**
* **Identity consistency across edits**
* **Controlled parametric manipulation**
* **Guided user input (presets + sliders + NLP)**

The system combines **latent-space manipulation (StyleGAN), structured parameters, and AI-assisted NLP** to produce reproducible and iteratively refinable facial composites.

---

## Problem

Traditional forensic sketching:

* Requires trained artists
* Is time-intensive
* Produces inconsistent results

Generic AI generators:

* Lack control
* Are non-deterministic
* Cannot preserve identity across refinements

---

## Solution

A system that enables:

1. Guided initialization using predefined facial presets
2. Controlled face generation using latent vectors
3. Iterative refinement via sliders, presets, and NLP
4. Identity-preserving transformations
5. Exportable, reproducible outputs
6. Full audit trail for traceability

---

## Core Features

### 1. Guided Initialization (Preset System)

Instead of relying on vague descriptions, users begin with structured selection:

* Face shape (oval, round, square, long)
* Skin tone (light, medium, dark)
* Age group (young, middle, older)
* Gender (optional)

These inputs define the **initial latent representation (Z₀)**.

---

### 2. Controlled Face Generation

* Uses pretrained StyleGAN
* Generates base face from latent vector
* Deterministic: same inputs → same output

---

### 3. Real-Time Latent Editing

Face refinement is performed through **latent vector manipulation**, not regeneration.

```text
Z_current = Z_base + Σ(feature_directions × weights)
```

* Enables smooth, real-time updates
* Preserves identity across changes

---

### 4. Hybrid Interaction Model

Three input layers:

1. **Presets (guided selection)** — for non-expert users
2. **Sliders (primary control)** — precise parameter tuning
3. **Chat/NLP (assistive)** — natural language adjustments

---

### 5. NLP with Regional Language Support

* Accepts multilingual input
* Uses OpenAI API for parsing
* Converts text → structured parameter updates

---

### 6. Parameter Control System

Initial parameter set (Phase 1):

* jaw_width
* chin_length
* face_length
* eye_size
* eye_spacing
* eye_angle
* nose_length
* nose_width
* lip_thickness
* mouth_width

All parameters normalized in range **[0, 1]**

---

### 7. Identity Consistency

* Base latent vector is fixed per session
* Edits are incremental (delta-based)
* No regeneration from scratch

---

### 8. Audit Logging

Structured, append-only logs capturing:

* user actions
* parameter changes
* timestamps
* generated outputs

---

### 9. Exportable Output

* High-resolution face generation
* Reproducible via stored parameters and seed

---

## System Architecture

### Modular Monolith Design

```text
Frontend (React)
   ↓
Backend (FastAPI)

Modules:
- Auth
- Session Manager
- Parameter Engine
- NLP Parser
- Identity Engine
- Face Generator
- Audit Logger
- Storage Layer
```

---

## Data Flow

### Initialization Flow

```text
User selects presets
   ↓
Parameter mapping
   ↓
Latent initialization (Z₀)
   ↓
Face generation
   ↓
Display in UI
```

---

### Refinement Flow

```text
User input (slider / preset / chat)
   ↓
Parameter update
   ↓
Latent delta computation
   ↓
Z_new = Z_current + Δ
   ↓
Face generation
   ↓
Audit log
   ↓
UI update
```

---

## Tech Stack

### Frontend

* React
* Tailwind CSS

### Backend

* FastAPI

### AI / ML

* StyleGAN
* OpenAI API

### Storage

* PostgreSQL (metadata, sessions, logs)
* Object storage (S3/GCS) for images

---

## Project Structure

```text
/frontend
/backend
   /app
      /api
      /core
      /modules
         /generator
         /nlp
         /storage
/storage
/models
```

---

## Success Criteria

* Deterministic outputs
* Real-time response (<200ms target per update)
* Identity preserved across edits
* Accurate parameter control
* Usable for non-expert users

---

## Limitations

* Not legally admissible evidence
* Limited parameter granularity (Phase 1)
* Latent directions are approximate (not perfectly disentangled)
* Bias inherited from pretrained models

---

## Roadmap

### Phase 1 (Current)

* Base generation (StyleGAN)
* Guided presets
* Slider control
* Basic NLP parsing
* Latent editing system

### Phase 2

* Improved latent direction learning
* More granular facial parameters
* UI refinement

### Phase 3

* Face matching using embeddings (e.g. ArcFace)
* Bias mitigation
* Advanced forensic validation

---

## Differentiation

This system differs from standard AI generators by:

* Enforcing **deterministic control instead of prompt randomness**
* Maintaining **identity consistency across iterations**
* Supporting **guided input for non-expert users**
* Enabling **real-time parametric editing**

---

## Disclaimer

This system is intended as an **investigative aid only** and should not be used for definitive identification.

---

## Contributors

Team of 4:

* Control & Interface
* Rendering & Latent System
* NLP & Language Processing
* Infrastructure & Logging