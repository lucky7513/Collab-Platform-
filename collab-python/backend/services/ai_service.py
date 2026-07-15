import httpx
from fastapi import HTTPException
from core.config import get_settings

settings = get_settings()

PROMPTS = {
    "summarize": "Summarize the following text concisely in 2-3 sentences. Return only the summary:\n\n",
    "rephrase":  "Rephrase the following text to be clearer and more professional. Return only the rephrased text:\n\n",
    "continue":  "Continue writing the following text naturally for 1-2 more paragraphs. Return only the continuation:\n\n",
    "grammar":   "Fix any grammar, spelling, and punctuation errors in the following text. Return only the corrected text:\n\n",
    "shorten":   "Shorten the following text while keeping the key points. Return only the shortened version:\n\n",
    "bullets":   "Convert the following text into a clear bullet-point list. Return only the bullet points:\n\n",
}


async def process_text(action: str, text: str) -> str:
    if action not in PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    prompt = PROMPTS[action] + text

    # Try Groq first (free)
    if settings.GROQ_API_KEY:
        return await _call_groq(prompt)

    # Fallback: Anthropic
    if settings.ANTHROPIC_API_KEY:
        return await _call_anthropic(prompt)

    raise HTTPException(status_code=503, detail="No AI API key configured")


async def _call_groq(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-oss-20b",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1024,
            }
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]


async def _call_anthropic(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}],
            }
        )
        response.raise_for_status()
        return response.json()["content"][0]["text"]
