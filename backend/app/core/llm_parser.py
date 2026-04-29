import json
from openai import AsyncOpenAI
from app.config import get_settings

settings = get_settings()

client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings["GROQ_API_KEY"]
) if settings["GROQ_API_KEY"] else None

SYSTEM_PROMPT = """
You are a forensic facial reconstruction AI interpretation engine.
Your job is to read natural language descriptions of a person's face and convert them into structured slider values.

Output your response strictly as a JSON object containing two keys:
1. "parameters": A dictionary mapping facial feature keys to a float between 0.0 and 1.0. 
   Supported keys: "jaw_width", "chin_length", "face_length", "eye_size", "eye_spacing", "eye_angle", "nose_length", "nose_width", "lip_thickness", "mouth_width".
   Only include keys that are explicitly mentioned or clearly implied by the input. Do not output values for features not mentioned.
   0.0 represents the minimum possible value (e.g. very narrow, very small, very thin).
   1.0 represents the maximum possible value (e.g. very wide, very large, very thick).
   0.5 represents the average/neutral value.
   
2. "interpretation": A short English summary (1-2 sentences max) of the action you took. If the user spoke in another language, translate the summary to English. Example: "Increased jaw width and narrowed eyes."

Return ONLY valid JSON.
"""

async def parse_natural_language_to_params(text: str, lang: str = "en") -> tuple[dict, str]:
    """Parse text into face parameters using OpenAI API. Returns (parameters_dict, interpretation_string)."""
    if not client:
        # Fallback dummy parser if no API key is provided
        return {}, f"Simulated interpretation of '{text}' (Language: {lang})"

    try:
        response = await client.chat.completions.create(
            model="llama3-70b-8192",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Language: {lang}\nDescription: {text}"}
            ]
        )
        
        result_text = response.choices[0].message.content
        data = json.loads(result_text)
        
        params = data.get("parameters", {})
        interpretation = data.get("interpretation", "Parameters updated from description.")
        
        # Ensure all params are floats between 0 and 1
        valid_params = {}
        for k, v in params.items():
            if isinstance(v, (int, float)):
                valid_params[k] = max(0.0, min(1.0, float(v)))
                
        return valid_params, interpretation
    except Exception as e:
        print(f"LLM parsing error: {e}")
        return {}, f"Failed to parse description: {str(e)}"

async def transcribe_audio(audio_file_bytes: bytes, filename: str) -> str:
    """Transcribe audio using OpenAI's Whisper model."""
    if not client:
        return "Simulated transcription: I need a larger jaw and wider eyes."
    
    try:
        # OpenAI SDK requires a file-like object with a filename
        from io import BytesIO
        file_obj = BytesIO(audio_file_bytes)
        file_obj.name = filename
        
        response = await client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=file_obj
        )
        return response.text
    except Exception as e:
        print(f"Whisper transcription error: {e}")
        return f"Transcription failed: {str(e)}"
