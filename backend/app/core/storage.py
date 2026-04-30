import base64

import boto3

from app.config import get_settings

settings = get_settings()
R2_ACCOUNT_ID = settings["R2_ACCOUNT_ID"]
R2_ACCESS_KEY_ID = settings["R2_ACCESS_KEY_ID"]
R2_SECRET_ACCESS_KEY = settings["R2_SECRET_ACCESS_KEY"]
BUCKET = settings["R2_BUCKET"]

r2 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
)


def upload_image(session_id: str, ts: str, action: str, img_b64: str) -> str:
    key = f"sessions/{session_id}/{ts}_{action}.png"
    data = base64.b64decode(img_b64)
    r2.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType="image/png")
    url = r2.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=3600,
    )
    return url


def upload_image_bytes(session_id: str, ts: str, action: str, img_bytes: bytes) -> str:
    """Upload raw image bytes (not base64) to R2 and return a presigned URL."""
    key = f"sessions/{session_id}/{ts}_{action}.png"
    r2.put_object(Bucket=BUCKET, Key=key, Body=img_bytes, ContentType="image/png")
    url = r2.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=3600,
    )
    return url


def download_image_bytes(image_url: str) -> bytes | None:
    """Download image bytes from an R2 presigned URL."""
    import httpx
    try:
        response = httpx.get(image_url, timeout=30.0)
        response.raise_for_status()
        if len(response.content) > 1000:
            return response.content
    except Exception as e:
        print(f"Failed to download previous image from R2: {e}")
    return None


upload_object = upload_image
