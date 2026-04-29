# Auth Microservice

JWT-based authentication service for the **Forensic Facial Reconstruction System**.

Runs on **http://localhost:8002** and shares a JWT secret with the main backend (Member 2) on **http://localhost:8000**.

---

## Quick Start

```bash
cd auth_service

# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS / Linux
# → Edit .env with your real DATABASE_URL and JWT_SECRET

# 4. Run migrations (one-time, or use Supabase SQL Editor)
psql "$DATABASE_URL" -f migrations/001_initial_schema.sql

# 5. Start the service (tables auto-created on first boot)
uvicorn main:app --reload --port 8002
```

Interactive API docs: **http://localhost:8002/docs**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL / Supabase connection string (`postgres://...`) |
| `JWT_SECRET` | ✅ | HS256 signing secret — **must match the backend service** |

> Generate a secret: `python -c "import secrets; print(secrets.token_hex(32))"`

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Client / Frontend                   │
└───────────────────────┬──────────────────────────────┘
                        │  HTTP
          ┌─────────────▼─────────────┐
          │   Auth Microservice :8002  │
          │   FastAPI + asyncpg        │
          │                            │
          │  POST /auth/register       │
          │  POST /auth/login   ──► JWT│
          │  POST /auth/logout         │
          │  GET  /auth/me    ◄── JWT  │
          └─────────┬─────────────────┘
                    │  asyncpg
          ┌─────────▼─────────────────┐
          │  PostgreSQL / Supabase     │
          │  users · sessions          │
          │  audit_logs                │
          └───────────────────────────┘

          ┌───────────────────────────┐
          │  Main Backend :8000        │
          │  reads same JWT_SECRET     │
          │  calls GET /auth/me        │
          │  to validate tokens        │
          └───────────────────────────┘
```

---

## JWT Flow

1. **Register** — `POST /auth/register` → creates hashed-password user row
2. **Login** — `POST /auth/login` → returns `{ access_token, token_type }`
3. **Protected calls** — Client sends `Authorization: Bearer <token>` header
4. **Introspect** — `GET /auth/me` decodes token & fetches live user record
5. **Logout** — `POST /auth/logout` validates token; client drops it locally

### Token Claims (HS256, 24 h expiry)

```json
{
  "sub":  "<user_uuid>",
  "role": "officer",
  "exp":  1234567890
}
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `email` | TEXT UNIQUE | |
| `hashed_password` | TEXT | bcrypt via passlib |
| `role` | TEXT | default `officer` |
| `is_active` | BOOLEAN | default `true` |
| `created_at` | TIMESTAMPTZ | auto |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | CASCADE delete |
| `z_current` | TEXT | JSON latent vector |
| `parameters` | TEXT | JSON param dict |
| `preset` | TEXT | |
| `created_at` | TIMESTAMPTZ | auto |
| `updated_at` | TIMESTAMPTZ | auto-updated via trigger |

### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `session_id` | UUID FK → sessions | SET NULL on delete |
| `user_id` | UUID FK → users | SET NULL on delete |
| `action` | TEXT | e.g. `param_change`, `export_image` |
| `params_before` | TEXT | JSON snapshot |
| `params_after` | TEXT | JSON snapshot |
| `image_url` | TEXT | |
| `timestamp` | TIMESTAMPTZ | auto |

---

## API Endpoints

### `POST /auth/register`
```json
// Request
{ "email": "officer@example.com", "password": "secure123" }

// 201 Response
{ "user_id": "<uuid>", "email": "officer@example.com" }
```

### `POST /auth/login`
```json
// Request
{ "email": "officer@example.com", "password": "secure123" }

// 200 Response
{ "access_token": "<jwt>", "token_type": "bearer" }
```

### `POST /auth/logout`
```
Authorization: Bearer <token>
// 200 Response
{ "message": "Logged out successfully" }
```

### `GET /auth/me`
```
Authorization: Bearer <token>
// 200 Response
{ "user_id": "<uuid>", "email": "...", "role": "officer", "is_active": true }
```

---

## Integration with Member 2 Backend

1. **Shared secret** — Set the same `JWT_SECRET` in both services' `.env` files.
2. **Token validation** — The backend calls `GET /auth/me` (or decodes the JWT locally with the shared secret) to authenticate protected routes.
3. **Database** — Use the same `DATABASE_URL` in both services to share the `users`, `sessions`, and `audit_logs` tables.

```python
# Example: validate a token in the backend (Member 2)
from jose import jwt
JWT_SECRET = os.getenv("JWT_SECRET")
payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
user_id = payload["sub"]
role    = payload["role"]
```

---

## Changes Made (Patch Summary)

| File | Change |
|---|---|
| `db/models.py` | Added `created_at` to `User`; added `Session` and `AuditLog` models |
| `core/user_crud.py` | Added `get_user_by_id`; `create_user` now accepts `role` param |
| `routes/me.py` | Now hits DB, returns `email` + `is_active`, rejects inactive users |
| `routes/logout.py` | Upgraded from stub to validated JWT logout |
| `main.py` | Added lifespan (auto-create tables), CORS middleware, richer metadata |
| `requirements.txt` | Created — pinned all dependencies |
| `.env.example` | Created — template for required secrets |
| `migrations/001_initial_schema.sql` | Created — idempotent SQL for all 3 tables + indexes + trigger |

---

## Security Notes

- Passwords are hashed with **bcrypt** (passlib). Plain passwords are never stored.
- JWT tokens are **stateless** — logout relies on client-side token deletion.
- To enforce server-side revocation, add a Redis token-denylist in `routes/logout.py`.
- `JWT_SECRET` and `DATABASE_URL` must **never** be committed to version control.
- `.env` is listed in `.gitignore`; only `.env.example` is committed.
