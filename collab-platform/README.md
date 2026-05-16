# ⚡ Collab — Real-Time Collaboration Platform

A full-stack real-time document collaboration platform built with **React**, **Spring Boot**, **Yjs (CRDT)**, **WebSockets**, and an **AI writing assistant**.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Real-time sync | Yjs (CRDT) + y-websocket |
| Rich text editor | Quill.js + quill-cursors |
| State management | Zustand |
| Backend | Spring Boot 3 (Java 17) |
| WebSockets | Spring WebSocket |
| Database | PostgreSQL (Neon free tier) |
| Auth | JWT tokens |
| AI Assistant | Anthropic Claude API |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Local Setup

### Prerequisites
- Java 17+
- Node.js 18+
- Maven 3.8+
- PostgreSQL database (use [Neon](https://neon.tech) free tier)

### 1. Clone & Setup Backend

```bash
cd backend

# Create .env file from template
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🗃️ Database Setup (Neon)

1. Go to [neon.tech](https://neon.tech) → Create project → Create database `collab_db`
2. Copy the connection string
3. Set in your `.env`:
```
DATABASE_URL=jdbc:postgresql://ep-xxx.us-east-2.aws.neon.tech/collab_db?sslmode=require
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
```

Tables are auto-created by Hibernate (`spring.jpa.hibernate.ddl-auto=update`).

---

## 🔑 Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | DB username |
| `DATABASE_PASSWORD` | DB password |
| `JWT_SECRET` | Secret key (min 32 chars) |
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com |
| `CORS_ALLOWED_ORIGINS` | Frontend URL (e.g., http://localhost:5173) |

---

## 🌐 Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo → select `backend` folder
4. Build command: `./mvnw clean package -DskipTests`
5. Start command: `java -jar target/collab-platform-0.0.1-SNAPSHOT.jar`
6. Add all environment variables in Render dashboard

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your repo → set root directory to `frontend`
3. Add environment variable:
   - `VITE_API_URL` = your Render backend URL
4. Update `vite.config.js` proxy target to your Render URL for production

---

## 📁 Project Structure

```
collab-platform/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/collab/
│       ├── CollabPlatformApplication.java
│       ├── config/          # Security, JWT, WebSocket config
│       ├── controller/      # REST API endpoints
│       ├── dto/             # Data Transfer Objects
│       ├── model/           # JPA entities
│       ├── repository/      # Spring Data repositories
│       ├── service/         # Business logic
│       └── websocket/       # WebSocket handler
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── pages/
        │   ├── AuthPage.jsx       # Login + Register
        │   ├── Dashboard.jsx      # Document list
        │   └── DocumentPage.jsx   # Editor + AI sidebar
        ├── store/
        │   └── authStore.js       # Zustand auth state
        ├── styles/
        │   └── global.css
        └── utils/
            └── api.js             # Axios instance
```

---

## ✨ Features

- **Real-time collaborative editing** — Multiple users edit simultaneously, changes sync instantly
- **Live cursor presence** — See where each collaborator is typing with colored cursors + name labels
- **AI Writing Assistant** — Summarize, rephrase, continue, fix grammar, shorten, or bulletize text
- **Document management** — Create, rename, delete documents
- **Share by link** — Share a document via unique URL
- **Auto-save** — Content saved to database automatically every 2 seconds
- **JWT Authentication** — Secure login/register flow

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/documents` | List all accessible documents |
| POST | `/api/documents` | Create document |
| GET | `/api/documents/:id` | Get document |
| PATCH | `/api/documents/:id/title` | Update title |
| PATCH | `/api/documents/:id/content` | Save content |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/documents/shared/:token` | Get by share token |
| POST | `/api/documents/:id/share` | Share with user |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/process` | Process text with AI |

### WebSocket
| URL | Description |
|---|---|
| `ws://host/ws/collab/{documentId}?token=JWT` | Real-time document sync |

---

## 🛠️ How Real-Time Sync Works

1. User opens a document → connects to WebSocket room
2. Yjs creates a shared document state (`Y.Doc`)
3. `y-websocket` syncs Yjs updates between all connected clients
4. Quill editor is bound to the Yjs document via `y-quill`
5. Quill cursors plugin shows live cursor positions from Yjs awareness
6. On text change → debounced auto-save to PostgreSQL via REST API

---

## 🤖 AI Assistant Usage

1. Select text in the editor (or leave nothing selected to use entire document)
2. Click "AI Assistant" in top bar
3. Choose an action: Summarize / Rephrase / Continue / Fix Grammar / Shorten / Bullets
4. View result in sidebar
5. Click "Insert into doc" to add it to your document, or "Copy" to clipboard

---

## 📈 Week-by-Week Build Plan

| Week | Goals |
|---|---|
| Week 1 | Auth + Dashboard + Document CRUD |
| Week 2 | WebSocket + Yjs real-time sync |
| Week 3 | Live cursors + Auto-save + Share links |
| Week 4 | AI Assistant + UI polish + Deploy |

---

Built with ❤️ as a portfolio project.
