from fastapi import APIRouter
from schemas.schemas import AIRequest, AIResponse
from services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/process", response_model=AIResponse)
async def process(req: AIRequest):
    result = await ai_service.process_text(req.action, req.text)
    return AIResponse(result=result)
