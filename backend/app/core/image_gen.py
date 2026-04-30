import httpx
import os
import asyncio
import base64


# ── Identity Anchor ─────────────────────────────────────────────────────────
# This fixed prompt fragment describes everything about the subject EXCEPT
# the mutable facial features. It ensures the model generates the same person
# every time, regardless of which features change.

IDENTITY_ANCHOR = (
    "A professional forensic mugshot, front-facing portrait of one Caucasian male, "
    "looking directly into the camera lens, eyes at camera level, shoulders square and symmetrical. "
    "He is 38 years old, short dark brown hair, brown eyes, light stubble. "
    "Neutral expression, plain light grey background, soft even studio lighting, no shadows. "
    "High-resolution photograph, 85mm lens, sharp focus, ultra-detailed skin texture, "
    "completely centered, perfectly symmetrical, no head tilt, no rotation."
)

NEGATIVE_PROMPT = (
    "smiling, open mouth, teeth, profile view, side view, looking away, head tilt, "
    "sunglasses, hat, long hair, thick beard, glasses, blurry, low resolution, "
    "distorted, multiple people, two heads, cartoon, painting, illustration, "
    "asymmetrical, artistic, dramatic lighting, shadows on face, jewelry."
)


# ── Feature Descriptor Buckets ──────────────────────────────────────────────
# Maps each parameter (0.0–1.0) to precise English adjectives.

FEATURE_MAP = {
    "jaw_width": {
        (0.0, 0.15): "very narrow pointed jawline",
        (0.15, 0.35): "narrow jawline",
        (0.35, 0.65): "average jawline",
        (0.65, 0.85): "wide strong jawline",
        (0.85, 1.01): "extremely wide square jawline",
    },
    "chin_length": {
        (0.0, 0.15): "very short receding chin",
        (0.15, 0.35): "short chin",
        (0.35, 0.65): "average chin",
        (0.65, 0.85): "prominent chin",
        (0.85, 1.01): "long protruding chin",
    },
    "face_length": {
        (0.0, 0.15): "very round short face shape",
        (0.15, 0.35): "round face shape",
        (0.35, 0.65): "average face shape",
        (0.65, 0.85): "elongated oval face shape",
        (0.85, 1.01): "long narrow face shape",
    },
    "eye_size": {
        (0.0, 0.15): "very small narrow eyes",
        (0.15, 0.35): "small eyes",
        (0.35, 0.65): "average-sized eyes",
        (0.65, 0.85): "large eyes",
        (0.85, 1.01): "very large wide-open eyes",
    },
    "eye_spacing": {
        (0.0, 0.15): "very close-set eyes",
        (0.15, 0.35): "close-set eyes",
        (0.35, 0.65): "average eye spacing",
        (0.65, 0.85): "wide-set eyes",
        (0.85, 1.01): "very wide-set eyes",
    },
    "eye_angle": {
        (0.0, 0.15): "downturned droopy eyes",
        (0.15, 0.35): "slightly downturned eyes",
        (0.35, 0.65): "straight level eyes",
        (0.65, 0.85): "slightly upturned eyes",
        (0.85, 1.01): "strongly upturned eyes",
    },
    "nose_length": {
        (0.0, 0.15): "very short small nose",
        (0.15, 0.35): "short nose",
        (0.35, 0.65): "average nose length",
        (0.65, 0.85): "long nose",
        (0.85, 1.01): "very long prominent nose",
    },
    "nose_width": {
        (0.0, 0.15): "very thin narrow nose",
        (0.15, 0.35): "narrow nose",
        (0.35, 0.65): "average nose width",
        (0.65, 0.85): "wide nose",
        (0.85, 1.01): "broad wide nose",
    },
    "lip_thickness": {
        (0.0, 0.15): "very thin lips",
        (0.15, 0.35): "thin lips",
        (0.35, 0.65): "average lips",
        (0.65, 0.85): "full thick lips",
        (0.85, 1.01): "very thick lips",
    },
    "mouth_width": {
        (0.0, 0.15): "very small narrow mouth",
        (0.15, 0.35): "small mouth",
        (0.35, 0.65): "average mouth width",
        (0.65, 0.85): "wide mouth",
        (0.85, 1.01): "very wide mouth",
    },
}


def _describe_value(feature_key: str, value: float) -> str | None:
    """Map a single parameter value to its English descriptor."""
    buckets = FEATURE_MAP.get(feature_key)
    if not buckets:
        return None
    val = max(0.0, min(1.0, float(value)))
    for (lo, hi), desc in buckets.items():
        if lo <= val < hi:
            return desc
    return None


def build_forensic_prompt(parameters: dict) -> str:
    """
    Build an anchored forensic prompt with fixed feature ordering.
    
    Structure: [FIXED identity anchor] + "Features: " + [ORDERED feature descriptors]
    """
    ordered_keys = [
        "jaw_width", "chin_length", "face_length", "eye_size", "eye_spacing",
        "eye_angle", "nose_length", "nose_width", "lip_thickness", "mouth_width"
    ]
    
    feature_parts = []
    for key in ordered_keys:
        val = parameters.get(key, 0.5)
        desc = _describe_value(key, float(val))
        if desc:
            feature_parts.append(desc)

    feature_text = ", ".join(feature_parts)
    prompt = f"{IDENTITY_ANCHOR} Facial features: {feature_text}."
    return prompt


async def generate_forensic_image(parameters: dict, seed: str) -> bytes:
    """
    Generate a forensic portrait using Cloudflare SDXL with a deterministic seed.
    """
    prompt = build_forensic_prompt(parameters)
    print(f"[ImageGen] Prompt: {prompt[:250]}...")

    cf_account = os.getenv("R2_ACCOUNT_ID")
    cf_token = os.getenv("CLOUDFLARE_AI_TOKEN")

    if cf_account and cf_token:
        url = f"https://api.cloudflare.com/client/v4/accounts/{cf_account}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0"
        headers = {"Authorization": f"Bearer {cf_token}"}

        # Use the session seed to lock the base face structure
        numeric_seed = int(seed) if str(seed).isdigit() else 42
        
        data = {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_PROMPT,
            "seed": numeric_seed,
            "num_steps": 25,  # Increased steps for more detail
            "guidance": 7.5,
        }

        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as http_client:
                    response = await http_client.post(url, headers=headers, json=data)
                    response.raise_for_status()

                    if len(response.content) > 1000:
                        print(f"[ImageGen] SDXL success: {len(response.content)} bytes")
                        return response.content
                    else:
                        raise Exception(f"Response too small: {len(response.content)} bytes")
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"[ImageGen] SDXL failed after retries: {e}")
                    break
                print(f"[ImageGen] Retry {attempt+1}: {e}")
                await asyncio.sleep(2 ** attempt)
    else:
        print("[ImageGen] Missing Cloudflare credentials")

    # Fallback: return a local placeholder
    return _fallback_image()


def _fallback_image() -> bytes:
    """Return a static fallback image if the API is unavailable."""
    fallback_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "assets", "fallback_face.png"
    )
    try:
        with open(fallback_path, "rb") as f:
            return f.read()
    except FileNotFoundError:
        # Return a minimal 1x1 PNG if even the fallback is missing
        return base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
