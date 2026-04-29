"""
auth_proxy.py — Forwards all /api/auth/* requests to the auth microservice on port 8002.

The 4 auth endpoints are:
  POST /api/auth/register  → POST  {AUTH_SERVICE_URL}/auth/register
  POST /api/auth/login     → POST  {AUTH_SERVICE_URL}/auth/login
  POST /api/auth/logout    → POST  {AUTH_SERVICE_URL}/auth/logout  (Bearer required)
  GET  /api/auth/me        → GET   {AUTH_SERVICE_URL}/auth/me      (Bearer required)

JWT validation for protected routes (logout/me) is handled by the auth service itself.
For all other /api/* endpoints, the main backend decodes the JWT locally via dependencies.py.
"""

import httpx
from fastapi import APIRouter, HTTPException, Request, Response, status

from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])

_settings = get_settings()
_AUTH_URL = _settings["AUTH_SERVICE_URL"].rstrip("/")


async def _forward(
    method: str,
    path: str,
    request: Request,
    *,
    include_body: bool = True,
) -> Response:
    """Generic forwarder — proxies the request to the auth service and streams the response back."""
    url = f"{_AUTH_URL}{path}"

    # Forward the Authorization header if present
    headers = {}
    if auth := request.headers.get("authorization"):
        headers["authorization"] = auth

    body = await request.body() if include_body else None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.request(
                method,
                url,
                content=body,
                headers={
                    **headers,
                    "content-type": request.headers.get("content-type", "application/json"),
                },
            )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service is unavailable. Make sure it is running on port 8002.",
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Auth service timed out.",
        )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type", "application/json"),
    )


# ─── Public endpoints (no JWT required by the proxy itself) ───────────────────

@router.post("/register", status_code=201, summary="Register a new user")
async def register(request: Request) -> Response:
    """Create a new user account. Forwards to auth service POST /auth/register."""
    return await _forward("POST", "/auth/register", request)


@router.post("/login", summary="Login and receive JWT")
async def login(request: Request) -> Response:
    """Authenticate with email + password. Returns { access_token, token_type }."""
    return await _forward("POST", "/auth/login", request)


# ─── Token-protected endpoints (auth service validates the Bearer token) ──────

@router.post("/logout", summary="Logout (invalidate client-side token)")
async def logout(request: Request) -> Response:
    """Stateless JWT logout. Token is validated by auth service; client must discard it."""
    return await _forward("POST", "/auth/logout", request, include_body=False)


@router.get("/me", summary="Get current authenticated user info")
async def me(request: Request) -> Response:
    """Return profile of the currently authenticated user.
    
    Auth service decodes the Bearer token and fetches the live user record.
    Use this to confirm the token is valid and the user is still active.
    """
    return await _forward("GET", "/auth/me", request, include_body=False)
