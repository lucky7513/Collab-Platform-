from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from db.database import create_tables
from core.config import get_settings
from routers import auth, documents, ai, photos
from routers.websocket import collab_ws_endpoint

settings = get_settings()

app = FastAPI(title="Collab Platform API", version="1.0.1")

origins = [
    "https://collab-platform-umber.vercel.app",
    "https://vercel.com",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

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