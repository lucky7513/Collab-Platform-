from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from db.database import create_tables
from core.config import get_settings
from routers import auth, documents, ai, photos, users
from routers.websocket import collab_ws_endpoint

settings = get_settings()

app = FastAPI(title="Collab Platform API", version="1.0.1")

@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(users.router)
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