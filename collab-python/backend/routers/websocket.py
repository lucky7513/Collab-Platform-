import json
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
from core.jwt import decode_token

# documentId -> set of websockets
rooms: Dict[str, Set[WebSocket]] = {}

# websocket -> session info
session_info: Dict[WebSocket, dict] = {}

COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#e91e63"]


def _get_color(email: str) -> str:
    return COLORS[hash(email) % len(COLORS)]


async def _broadcast(document_id: str, payload: dict, exclude: WebSocket = None):
    room = rooms.get(document_id, set())
    message = json.dumps(payload)
    dead = set()
    for ws in room:
        if ws == exclude:
            continue
        try:
            await ws.send_text(message)
        except Exception:
            dead.add(ws)
    for ws in dead:
        room.discard(ws)


def _extract_token(websocket: WebSocket) -> str:
<<<<<<< HEAD
    try:
        full_url = str(websocket.url)
        print("Full WS URL:", full_url)
        if 'token=' not in full_url:
            return None
        token_part = full_url.split('token=')[1]
        dot_parts = token_part.split('.')
        if len(dot_parts) >= 3:
            third = dot_parts[2].split('/')[0].split('&')[0]
            token = dot_parts[0] + '.' + dot_parts[1] + '.' + third
            print("Extracted token:", token[:20], "...")
            return token
    except Exception as e:
        print("Token extraction error:", e)
=======
    """Extract token from query string, handling y-websocket's appended room name."""
    try:
        query = str(websocket.url.query)
        for param in query.split("&"):
            if param.startswith("token="):
                raw = param[6:]
                # y-websocket appends /roomname to the token, strip it
                token = raw.split("/")[0]
                return token
    except Exception:
        pass
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
    return None


async def collab_ws_endpoint(websocket: WebSocket, document_id: str):
    token = _extract_token(websocket)
<<<<<<< HEAD
    print("Token extracted:", token[:20] if token else None)

    try:
        email = decode_token(token)
        print("Email decoded:", email)
    except Exception as e:
        print("Token decode error:", e)
=======

    try:
        email = decode_token(token)
    except Exception:
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
        await websocket.close(code=4001)
        return

    await websocket.accept()

    user_name = email.split("@")[0]
    user_color = _get_color(email)

    if document_id not in rooms:
        rooms[document_id] = set()
    rooms[document_id].add(websocket)
    session_info[websocket] = {
        "document_id": document_id,
        "user_name": user_name,
        "user_color": user_color,
        "email": email,
    }

<<<<<<< HEAD
    print(f"User {email} joined document {document_id}")

=======
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
    await _broadcast(document_id, {
        "type": "user-joined",
        "userName": user_name,
        "userColor": user_color,
        "userCount": len(rooms[document_id]),
    }, exclude=websocket)

    users = [
        {"userName": session_info[ws]["user_name"], "userColor": session_info[ws]["user_color"]}
        for ws in rooms[document_id]
        if ws in session_info
    ]
    await websocket.send_text(json.dumps({
        "type": "room-state",
        "userColor": user_color,
        "users": users,
    }))

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            msg_type = payload.get("type")

            if msg_type in ("doc-update", "awareness"):
                payload["userName"] = user_name
                payload["userColor"] = user_color
                await _broadcast(document_id, payload, exclude=websocket)

    except WebSocketDisconnect:
        pass
    finally:
        rooms.get(document_id, set()).discard(websocket)
        session_info.pop(websocket, None)
<<<<<<< HEAD
        print(f"User {email} left document {document_id}")
=======
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae

        if rooms.get(document_id):
            await _broadcast(document_id, {
                "type": "user-left",
                "userName": user_name,
                "userCount": len(rooms.get(document_id, set())),
            })
        elif document_id in rooms:
<<<<<<< HEAD
          del rooms[document_id]
=======
            del rooms[document_id]
>>>>>>> 4a7c6333f502c497bda1b34a40c0fccdee606aae
