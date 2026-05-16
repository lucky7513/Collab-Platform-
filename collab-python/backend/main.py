<<<<<<< HEAD

=======
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import create_tables
from core.config import get_settings
from routers import auth, documents, ai
from routers.websocket import collab_ws_endpoint

settings = get_settings()

app = FastAPI(title="Collab Platform API", version="1.0.0")

<<<<<<< HEAD
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
=======
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
=======
# Routers
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ai.router)

<<<<<<< HEAD
=======
# WebSocket
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
app.add_api_websocket_route("/ws/collab/{document_id}", collab_ws_endpoint)


@app.on_event("startup")
def startup():
    create_tables()
    print("✅ Database tables ready")


@app.get("/")
def health():
<<<<<<< HEAD
    return {"status": "ok", "message": "Collab Platform API running"}
=======
    return {"status": "ok", "message": "Collab Platform API running"}
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
