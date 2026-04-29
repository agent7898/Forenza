from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db

router = APIRouter(prefix="/nlp", tags=["nlp"])


class NLPRequest(BaseModel):
    """NLP parsing request."""
    text: str
    lang: str = "en"


from app.core.llm_parser import parse_natural_language_to_params

@router.post("/parse")
async def parse_nlp(
    req: NLPRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Parse natural language input into face parameters.
    
    Requires JWT authentication.
    """
    user_id = current_user.get("sub")
    
    parameters, interpretation = await parse_natural_language_to_params(req.text, req.lang)
    
    return {
        "user_id": user_id,
        "input": req.text,
        "parameters": parameters,
        "interpretation": interpretation,
    }

from fastapi import UploadFile, File

@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Transcribe audio file to text using Whisper."""
    from app.core.llm_parser import transcribe_audio
    
    content = await file.read()
    transcript = await transcribe_audio(content, file.filename)
    
    return {"transcript": transcript}
