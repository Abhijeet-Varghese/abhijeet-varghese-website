# AV OS — AI

## Providers

`backend/ai/AiProviders.php` — `AIProviderInterface` with three configurable providers:

| Provider | Default model |
|---|---|
| OpenAI | gpt-4o |
| Anthropic | claude-sonnet-4-20250514 |
| Google | gemini-2.0-flash |

- Keys configured in Integrations → AI config; **encrypted at rest** (aes-256-cbc with `AV_ENC_KEY`);
  never serialized to the browser; `has_key` flag only.
- Every request logged in `ai_requests` (provider, action, model, tokens, ok) → real usage charts in
  AI Studio (`/api/ai/usage`).
- **AI output is always a DRAFT requiring human approval — never auto-published.**
- No key configured? Provider chat returns a clean `AI_ERROR` message; Copilot's database tools keep
  working (they don't need a key).

## AI Studio (`/admin` → Intelligence)

- Chat: real `POST /api/ai/generate` (rate-limited 60/h, logged). Provider selector reflects real config.
- SEO assistant: pick entity type → scan shows items actually missing SEO metadata → AI drafts title +
  description → human edits → **save to database** (`PUT /api/content`) → publish applies it.
- Usage: calls, failures, tokens, per-day bars, per-provider, per-action — all from `ai_requests`.

## AI Copilot (tool router)

`POST /api/copilot` (permission `ai.use`). Query → intent → **explicit DB tools**, each with input
validation, permission checks and audit logging. No arbitrary SQL/PHP/fs/shell.

Tools: recent leads · SEO gaps (missing metadata) · draft case study from a project · top projects ·
unpublished pages · content health/dashboard snapshot · pipeline summary · publish next. Falls back
to provider chat when the query doesn't match a tool.

## Knowledge base

`knowledge_items` (title, body, category, tags) — portfolio/frameworks/process notes, CRUD in
Platform → Knowledge, full-text searched by global search and Copilot.

## Guardrails

- `ai.read/write/use` permissions enforced per endpoint.
- Copilot never receives unrestricted SQL; tool outputs are shaped, typed responses.
- Rate limits: AI 60/h per IP; media 30/h.

## V3 AI

- **Prompt templates**: `ai_prompts` (versioned, 5 seeded). AI Studio's prompt library is DB-backed
  (click to load, "Save custom" creates v1; saving bumps version).
- **Cost control**: daily/monthly caps (settings → `aiLimits`, default 100/1000) enforced in
  `POST /api/ai/generate` with 429 `AI_LIMIT`; usage panel shows real counts/tokens.
- **Copilot RBAC**: every tool category checks the caller's permissions first (leads → `leads.read`,
  analytics → `analytics.view`, content → `content.read`); denial is audited and returns 403.
- **AI audit**: `ai_requests` logs user, action, prompt, response, model, ok for every call;
  `copilot_denied` events are audited.
