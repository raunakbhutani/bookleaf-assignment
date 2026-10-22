# BookLeaf Author Support & Communication Portal

A full-stack take-home implementation for BookLeaf Publishing. It provides an author-facing dashboard and a role-protected operations workspace, using the supplied 10-author / 18-book dataset directly.

## Run locally

```bash
npm install
cp .env.example .env
npm run api
# In a second terminal
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The API runs at `http://localhost:3001`.

### Demo accounts

| Role       | Email                                         | Password       |
| ---------- | --------------------------------------------- | -------------- |
| Author     | Any email in `data/bookleaf-sample-data.json` | `Bookleaf123!` |
| Operations | `ops@bookleaf.test`                           | `Bookleaf123!` |

For example, sign in as `priya.sharma@email.com` to use the author experience.

## What is included

- Author authentication, account overview, book and royalty details, ticket submission, and author-visible responses.
- Operations queue with category, priority and status filtering; queue ordering surfaces critical/high tickets before older lower-priority work.
- Automatic local ticket classification and prioritisation, with editable admin overrides.
- Policy-aware AI response drafting, editable before sending; generated replies appear in the author view on the next short polling cycle.
- Validation, consistent JSON error responses, author ownership checks, admin-only routes, UI-only file attachment selection, and a lightweight SSE endpoint for future push updates.
- All books are loaded from the supplied dataset; zero royalties and in-production titles are intentionally displayed rather than omitted.

## Architecture and decisions

`client/` is a Vite + React single-page interface. `server/` is a small Express REST API. `data/bookleaf-sample-data.json` preserves the supplied seed data; `server/store.js` normalises its nested author/book relationship for safe lookups.

The assignment demo intentionally holds sessions and ticket mutations in memory to keep setup to one command. It is suitable for assessment but not persistence. In production, I would move authors, books, tickets, notes and responses into PostgreSQL; use migrations, hashed passwords, short-lived signed sessions in HTTP-only cookies, durable audit logs and a job queue for AI work.

The frontend never decides which records are allowed. The API attaches a role to the bearer token, author routes always filter by `authorId`, ticket creation verifies book ownership, and admin endpoints reject non-admin tokens. Demo credentials are deliberately documented and must be replaced in production.

## AI integration

`server/ai.js` centralises model behavior. It sends the current ticket, a minimal relevant book summary, and only the applicable policy excerpt from `server/knowledge.js`. It does not send all author history or the whole knowledge base on every request. This reduces cost, limits data exposure, and gives more focused answers.

By default `AI_MODE=local` provides deterministic classification and a policy-aware fallback draft. That means a provider outage can never prevent ticket creation or an admin response. To enable the OpenAI Responses API, set the following **server-only** values in `.env`:

```ini
AI_MODE=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

`gpt-4o-mini` is a reasonable low-cost option for short classification and drafting. Provider errors, rate limits, blank replies, or missing configuration are caught and replaced with the local draft; the API key is never exposed to the browser.

## REST API

All protected endpoints require `Authorization: Bearer <token>`. Errors use `{ "error": { "code", "message" } }`.

| Method   | Endpoint                       | Role               | Purpose                                                                     |
| -------- | ------------------------------ | ------------------ | --------------------------------------------------------------------------- |
| POST     | `/api/auth/login`              | Public             | Returns an in-memory demo token and user role.                              |
| GET      | `/api/author/me`               | Author             | Return current author profile only.                                         |
| GET      | `/api/author/books`            | Author             | Return only current author's books.                                         |
| GET/POST | `/api/author/tickets`          | Author             | List author tickets or create a validated ticket.                           |
| GET      | `/api/admin/tickets`           | Admin              | Queue, optionally filtered by `status`, `category`, `priority`, and `from`. |
| POST     | `/api/admin/tickets/:id/draft` | Admin              | Generate a policy-aware response draft.                                     |
| PATCH    | `/api/admin/tickets/:id`       | Admin              | Override triage, update status/assignee/notes, or send response.            |
| GET      | `/api/events`                  | Any signed-in user | Lightweight server-sent change notifications.                               |
| GET      | `/api/health`                  | Public             | Basic service health and AI mode.                                           |

## Limitations and next steps

- Tickets and demo sessions reset when the server restarts.
- The UI uses 12-second polling for cross-role updates; wire the existing SSE endpoint into an authenticated EventSource-compatible transport or use WebSockets in production.
- Attachment selection intentionally does not upload a file, per the brief's optional upload requirement.
- Add request-rate limiting, password reset, CSRF protection, tests, OpenAPI generation, and production observability before deployment.

## Assignment write-up

The one-page write-up is in [WRITEUP.md](WRITEUP.md).
