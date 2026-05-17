from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from db.database import create_tables
from core.config import get_settings
from routers import auth, documents, ai, photos
from routers.websocket import collab_ws_endpoint

settings = get_settings()

app = FastAPI(title="Collab Platform API", version="1.0.1")

ALLOWED_ORIGIN = "https://collab-platform-umber.vercel.app"

@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            }
        )
    
    response = await call_next(request)
    if origin == ALLOWED_ORIGIN or not origin:
        response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ai.router)
app.include_router(photos.router)
app.add_api_websocket_route("/ws/collab/{document_id}", collab_ws_endpoint)

@app.on_event("startup")
def startup():
    create_tables()
    print("✅ Database tables ready")

@app.get("/")
def health():
    return {"status": "ok", "message": "Collab Platform API running"}