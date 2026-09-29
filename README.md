# PadosiPro Take-Home

Native mobile app (Expo) + Fastify API for the PadosiPro first-journey assignment: register → email OTP → login → profile → task selection → home.

## Submission

| Item | Link / path |
|---|---|
| Source | https://github.com/deveshmaurya1996/padosi-assignment |
| Live API | https://padosi-assignment.onrender.com/health |
| Android APK | [`releases/padosipro-preview.apk`](releases/padosipro-preview.apk) |
| Design notes | [DESIGN.md](DESIGN.md) |
| APK build notes | [releases/README.md](releases/README.md) |

**Reviewer flow (APK):** install `releases/padosipro-preview.apk` → register with a real email → open that inbox for the OTP → login → profile → tasks → home. The APK talks to the Render API above. Free Render instances may sleep (~30–60s cold start).

**Reviewer flow (local):** follow [Quick start](#quick-start--15-minutes) below; OTP emails appear in Mailpit at http://localhost:8025.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Docker Desktop (PostgreSQL + Mailpit)
- Expo Go on a phone, or an Android emulator
- For APK: Android SDK / EAS account (see below)

## Quick start (&lt; 15 minutes)

```bash
# 1. Infra (required for API + for pnpm test)
docker compose up -d

# 2. Install
pnpm install
cp .env.example .env
cp .env apps/api/.env

# 3. Database
cd apps/api
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
cd ../..

# 4. API (terminal A)
pnpm dev:api

# 5. Mobile (terminal B) — auto-uses local API in dev
pnpm dev:mobile
```

- API: http://localhost:3000/health  
- Mailpit UI (OTP emails): http://localhost:8025  
- Open Mailpit after register → copy the **newest** 6-digit code for **your** email  
- Dev builds auto-hit local API; release/EAS auto-hit Render (see `.env.development` / `.env.production`).

### Pointing the app at the API

**Auto-switch via env files** (`apps/mobile/`):

| File | When loaded | `EXPO_PUBLIC_API_URL` |
|---|---|---|
| [`.env.development`](apps/mobile/.env.development) | `expo start` / debug | local (`http://10.0.2.2:3000`) |
| [`.env.production`](apps/mobile/.env.production) | release / EAS preview & production | Render |
| [`.env.example`](apps/mobile/.env.example) | docs only | shows the expected keys |
| `.env.local` (optional, gitignored) | overrides the above | e.g. `http://192.168.x.x:3000` for a physical phone |

Code reads `process.env.EXPO_PUBLIC_API_URL` only — no hardcoded API hosts in `lib/env.ts`.

```bash
# Physical device override (create file yourself)
echo EXPO_PUBLIC_API_URL=http://192.168.x.x:3000 > apps/mobile/.env.local
npx expo start -c
```

| Client | Typical URL |
|---|---|
| Android emulator | `http://10.0.2.2:3000` (`.env.development`) |
| Expo web / iOS simulator | change `.env.development` to `http://localhost:3000` if needed |
| Physical device | set in `.env.local` |

## Environment variables

See [.env.example](.env.example). Never commit real secrets.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | HMAC secret for access tokens (**required** when `NODE_ENV=production`) |
| `JWT_EXPIRES_IN` | Access token lifetime (default `15m`) |
| `REFRESH_TOKEN_TTL_MS` | Refresh session lifetime in ms (default 30 days) |
| `SMTP_*` / `EMAIL_FROM` | Mailpit locally, or Resend (`smtp.resend.com`) for real OTP |
| `EXPO_PUBLIC_API_URL` | Mobile API base URL |

## Email / OTP

OTP is sent by email only (never returned in the API or shown in the app). Only a **hash** of the code is stored in the database.

Locally use **Mailpit**:

- SMTP: `localhost:1025`
- Web UI: http://localhost:8025 — open the message and copy the 6-digit code

On **Render**, set Resend with a verified sending domain:

| Env | Value |
|---|---|
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | Resend API key |
| `EMAIL_FROM` | `PadosiPro <noreply@dartix.live>` |

Mail is sent over **HTTPS** (`api.resend.com`). Locally keep using Mailpit. OTP is never returned in JSON.

OTP rules: 6 digits, 10-minute expiry, single use, max 5 wrong attempts, ~30s resend cooldown.

## Deploy API on Render

Blueprint file: [render.yaml](render.yaml) (Web Service + free Postgres).

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → select the repo.
3. Apply the blueprint. Wait for first deploy (migrate + seed run on start).
4. Open `https://<service>.onrender.com/health` — should return `{"ok":true}`.
5. Point the mobile app at Render before building an APK:

```
EXPO_PUBLIC_API_URL=https://<service>.onrender.com
```

**Manual Web Service** (if you skip Blueprint):

| Setting | Value |
|---|---|
| Runtime | Node |
| Build | `pnpm run render:build` |
| Start | `pnpm run render:start` |
| Health | `/health` |

Env: `DATABASE_URL` (from Render Postgres), `JWT_SECRET` (long random — required), `HOST=0.0.0.0`, `CORS_ORIGIN=*`, plus Resend `SMTP_*` / `EMAIL_FROM` (see above).

Free tier spins down after idle — first request after sleep can take ~30–60s.

## API overview

| Method | Path | Auth |
|---|---|---|
| POST | `/auth/register` | — |
| POST | `/auth/verify-otp` | — |
| POST | `/auth/resend-otp` | — |
| POST | `/auth/login` | — |
| POST | `/auth/refresh` | — |
| POST | `/auth/logout` | JWT |
| GET | `/me` | JWT |
| PUT | `/profile` | JWT |
| GET | `/tasks` | JWT |
| PUT | `/tasks/selection` | JWT |
| GET | `/tasks/selection` | JWT |

Login returns a short-lived **access** token plus a **refresh** token. Authenticated routes require an active DB session (`sid` in the JWT). Logout revokes that session. Mobile stores both tokens and refreshes on 401.

## Tests

Docker Compose must be running (`docker compose up -d`) so Postgres is available.

```bash
pnpm test
```

Covers OTP generation/expiry/attempts/resend cooldown, register → verify → login happy path, session logout/refresh rotation, login gates, JWT rejection, and input validation.

## Business Name

`businessName` is **optional**. Many PadosiPro households are families, not companies; the live app only gates onboarding on name + address. Documented here and in DESIGN.md.

## Build Android APK

Local day-to-day uses auto-switch (dev → local API). EAS `preview` / `production` bake in the Render URL via `eas.json`.

Local Gradle on Windows often fails with this pnpm monorepo (path length). Use **EAS Build** (cloud):

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build -p android --profile preview
```

Submission APK: [`releases/padosipro-preview.apk`](releases/padosipro-preview.apk) (Render API). Details in [`releases/README.md`](releases/README.md). To rebuild, download the new APK from Expo and replace that file.

For local testing of OTP, use Mailpit (http://localhost:8025).

## Project layout

```
apps/api          Fastify + Prisma
apps/mobile       Expo Router app
  hooks/          API calls live here; pages only consume hooks
  lib/api.ts      Thin fetch wrapper (access JWT + refresh on 401)
packages/types    Shared TypeScript types
packages/validation  Shared Zod schemas
prisma lives under apps/api/prisma
releases/         Submission APK (`padosipro-preview.apk`) + build notes
```

## Design choices

We deliberately kept the mobile networking stack simple: **`fetch` + custom hooks**, not Axios or TanStack Query. Those are solid options for larger apps; we skipped them here to avoid extra providers, cache keys, and dependencies for a short onboarding flow.

Full rationale (chosen vs deferred alternatives): [DESIGN.md](DESIGN.md).

## Manual walkthrough

1. Register with email + password  
2. Open Mailpit → copy OTP → verify  
3. Log in  
4. Complete profile (name, +91 mobile, address; business optional)  
5. Multi-select tasks → confirm → home  
6. Kill and reopen the app — you stay logged in  
7. Open Account (person icon on Home) → Log out 

## License

Assignment submission — not for production use of PadosiPro trademarks beyond the brief.
