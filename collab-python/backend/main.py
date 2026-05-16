
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import create_tables
from core.config import get_settings
from routers import auth, documents, ai
from routers.websocket import collab_ws_endpoint

settings = get_settings()

app = FastAPI(title="Collab Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ai.router)

app.add_api_websocket_route("/ws/collab/{document_id}", collab_ws_endpoint)


@app.on_event("startup")
def startup():
    create_tables()
    print("✅ Database tables ready")


@app.get("/")
def health():
    return {"status": "ok", "message": "Collab Platform API running"}