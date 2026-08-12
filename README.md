# Virafold

**One idea, folded into everything.** Virafold is a creator business OS for faceless creators: it turns one long-form input (a transcript, script, or uploaded media) into a full set of ready-to-post assets — short-form clip scripts, LinkedIn carousels, newsletters, X threads — then schedules them, grows an owned audience, and tracks the money.

Live at [virafold.ai](https://virafold.ai) (virafold.com and virafold.app redirect there).

## What's inside

- **Idea → script → assets pipeline** — a scored idea backlog, long-form script writing, and multi-format asset generation, all steered by a per-user **brand voice** profile (tone, CTAs, banned words, emoji policy — mechanically enforced).
- **Performance flywheel** — record real post results; your proven winning hooks are fed back into every future generation as exemplars.
- **Scheduling calendar** — month-grid content calendar with a background scheduler that actually delivers due posts, plus evergreen recycling (top assets re-queue automatically after each publish).
- **Owned audience** — subscriber list with importer/CSV export, hosted link-in-bio page (`/c/[slug]`), auto-generated media kit (`/kit/[slug]`), and newsletter broadcasts via Resend.
- **Business tab** — revenue ledger by stream and a brand-deal pipeline; deals marked paid book themselves into the ledger.
- **Trust rails** — every asset carries a signed, C2PA-shaped provenance manifest and a pre-publish policy/demonetization lint.
- **Operator console** (`/admin`, gated by `ADMIN_EMAILS`) — users/plans, live pricing editor, generation kill switch, funnel counts, audit log.
- **19 languages** end to end.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · `node:sqlite` (zero-dependency durable store) · Anthropic/OpenAI (optional — everything degrades to a deterministic engine without keys) · Stripe (checkout + signature-verified webhook) · Resend (email) · Deepgram/Whisper (transcription-on-upload).

Every integration follows the same contract: **no key, graceful demo mode; add a key in Settings → Integrations, feature goes live.**

## Run it

```bash
npm ci
npm run dev        # http://localhost:3000
```

Requires Node 22+ (for `node:sqlite`). Data lives in `./data`. Useful env vars (all optional in dev): `SESSION_SECRET`, `PROVENANCE_KEY`, `ADMIN_EMAILS`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `DEEPGRAM_API_KEY`.

## Deploy

Built for a single long-lived Node server (systemd + Caddy). `npm run build && npm run start`, reverse-proxy :3000, and point your domain — HTTPS is required in production (session cookies are `Secure`). The in-process scheduler starts via `src/instrumentation.ts`; no external cron needed.
