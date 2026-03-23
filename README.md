# Educational AI chatbot

Implements the flowchart with **email login**, **JWT sessions**, and **server-side roles** (not a self-selected “I’m a professor” button).

1. **Start** → user **registers or logs in** with email + password. The UI shows **student** or **professor** (or **admin**) tools based on the account.
2. **Student**
   - **Ask AI** — FAQ keywords first, then **optional Hugging Face** (`HUGGINGFACE_API_KEY` / `HF_API_KEY`), then OpenAI fallback (if configured), then a safe “contact your teacher” fallback. Responses are labeled **FAQ**, **AI**, or **escalation**.
   - **Voice input** — record speech in the Ask AI screen, transcribe to text, optionally output transcript in **English** or **Thai**, and send directly to AI.
   - **Ask professors** — pick a professor; see their **title** and **office hours**, then send a message to **their** inbox only.
   - **Your conversations** — list of threads; open one to poll for replies.
3. **Professor**
   - **Faculty profile** — edit **title** and **office hours** (shown to students).
   - **Inbox** — threads where **you** are the selected professor.
   - **Review & reply** — reply is stored on the thread; the student sees it when they refresh.
4. **Password reset** — **Forgot password** flow: creates a token (email via SMTP when configured; in non-production a **dev token** may be returned in the JSON).
5. **Email notifications** — when SMTP is configured, professors can get an email when a student starts a new thread.

## Stack

- **Backend:** Node.js **22.5+**, Express, TypeScript, **built-in SQLite** (`node:sqlite`), **bcryptjs**, **jsonwebtoken**, **nodemailer** (optional SMTP)
- **Frontend:** React, TypeScript, Vite

Campus FAQ keywords live in `server/data/knowledge.json`. With `HUGGINGFACE_API_KEY` (or `HF_API_KEY`), the server uses Hugging Face Inference for chat, translation, and speech transcription. OpenAI can still be used as fallback if `OPENAI_API_KEY` is set.

## Run locally

```bash
cd /path/to/AIchatbot
npm install
npm run install:all
npm run dev
```

- API: <http://localhost:4000>
- App: <http://localhost:5173>

The Vite dev server proxies `/api` to the backend.

### Important for AI/voice features

Create `server/.env` (or export env vars in your terminal) so the API server can read your keys:

```bash
HUGGINGFACE_API_KEY=hf_xxx
# optional fallback:
# OPENAI_API_KEY=sk-xxx
```

If `4000` is already in use, stop old dev terminals first, or start with a different port:

```bash
PORT=4001 npm run dev --prefix server
```

## Demo accounts (first run only)

On **first startup**, if the database has no users, three accounts are created (password: `DEMO_PASSWORD` env or **`demo1234`**):

| Email                 | Role       |
|-----------------------|------------|
| `student@edu.local`   | student    |
| `professor@edu.local` | professor  |
| `admin@edu.local`     | admin      |

The demo professor account is seeded with sample **title** and **office hours**.

**Admin** sees **all** threads in the professor inbox and can reply to any of them; they also get student tools.

To re-seed, **delete** `server/data/app.sqlite` (and `-shm`/`-wal` if present) and restart the server.

## Registration & professor invite

- **Register** creates a **student** by default.
- To allow **self-service professor** sign-up, set **`PROFESSOR_INVITE`** on the server to a secret string. On the register form, enter that value in **Professor invite code**.

## Environment

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `JWT_SECRET` | **Required in production.** Secret for signing JWTs. |
| `DEMO_PASSWORD` | Password for seeded demo users (default `demo1234`) |
| `PROFESSOR_INVITE` | Optional. If set, matching code at register → `professor` role. |
| `DATABASE_PATH` | Optional. SQLite file path (default `server/data/app.sqlite`) |
| `VITE_API_URL` | Client: empty in dev (proxy); full API URL for production build if needed |
| `HUGGINGFACE_API_KEY` / `HF_API_KEY` | Recommended. Enables Hugging Face chat, translation, and speech transcription. |
| `HF_CHAT_MODEL` | Optional. Chat model for Hugging Face router (default `meta-llama/Llama-3.1-8B-Instruct`). |
| `HF_ASR_MODEL` | Optional. Hugging Face ASR model (default `openai/whisper-large-v3`). |
| `OPENAI_API_KEY` | Optional fallback for chat/transcription if Hugging Face is unavailable. |
| `OPENAI_MODEL` | Optional. Default `gpt-4o-mini`. |
| `OPENAI_TRANSCRIBE_MODEL` | Optional. Default `gpt-4o-mini-transcribe`. |
| `APP_URL` | Optional. Public app URL for password-reset and notification links (e.g. `https://app.example.com`). |
| `DEV_RETURN_RESET_TOKEN` | If `true`, **forgot-password** responses include `devResetToken` even in production (avoid unless debugging). |
| **SMTP (optional)** | |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | Port (default `587`; `465` uses TLS) |
| `SMTP_USER` / `SMTP_PASS` | Auth if required |
| `MAIL_FROM` | From address (required with `SMTP_HOST` for sending mail) |

## API additions (summary)

- `POST /api/auth/forgot-password` — `{ "email" }`
- `POST /api/auth/reset-password` — `{ "token", "newPassword" }`
- `PATCH /api/me/profile` — `{ "title", "officeHours" }` (professor or admin, JWT required)
- `POST /api/ask-ai` — response includes `source`: `knowledge` | `llm` | `fallback`
- `POST /api/speech/transcribe` — multipart form with `audio`; optional `targetLanguage` (`en` or `th`)
- `POST /api/translate` — `{ "text", "targetLanguage": "en" | "th" }`
- `GET /api/professors` — each entry includes `title`, `officeHours`

## Production build

```bash
npm run build --prefix client
npm run build --prefix server
JWT_SECRET=your-long-random-secret npm start --prefix server
```

Serve `client/dist` behind HTTPS; point `VITE_API_URL` at your API if it’s on another origin.

## Security notes

- Passwords are **hashed** (bcrypt). JWTs expire in **7 days** (adjust in `server/src/auth.ts`).
- Reset links expire in **1 hour**. Don’t enable `DEV_RETURN_RESET_TOKEN` in real production.
- For stronger hardening: **httpOnly cookies** + CSRF, **rate limiting** on auth routes, and **email verification**.
