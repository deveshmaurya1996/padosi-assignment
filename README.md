# PadosiPro Take-Home

Native mobile app (Expo) + Fastify API for the PadosiPro first-journey assignment: register → email OTP → login → profile → task selection → home.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Docker Desktop (PostgreSQL + Mailpit)
- Expo Go on a phone, or an Android emulator
- For APK: Android SDK / EAS account (see below)

## Quick start (&lt; 15 minutes)

```bash
# 1. Infra
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

# 5. Mobile (terminal B)
pnpm dev:mobile
```

- API: http://localhost:3000/health  
- Mailpit UI (OTP emails): http://localhost:8025  
- OTP is also printed in the API console as `[otp] email=... code=...`

### Pointing the app at the API

| Client | `EXPO_PUBLIC_API_URL` |
|---|---|
| Expo web / iOS simulator | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` (default in app) |
| Physical device | `http://<your-LAN-IP>:3000` |

Create `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Then restart Expo.

## Environment variables

See [.env.example](.env.example). Never commit real secrets.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | HMAC secret for access tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `SMTP_*` / `EMAIL_FROM` | Mailpit SMTP (`localhost:1025`) |
| `EXPO_PUBLIC_API_URL` | Mobile API base URL |

## Email / OTP

This project uses **Mailpit** (local mail catcher). Compose exposes:

- SMTP: `localhost:1025`
- Web UI: http://localhost:8025

On **Render**, Mailpit is not used. Registration still succeeds; open the web service **Logs** and look for `[otp] email=... code=...`.

OTP rules: 6 digits, 10-minute expiry, single use, max 5 wrong attempts, ~30s resend cooldown. Only a **hash** of the code is stored.

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

Env: `DATABASE_URL` (from Render Postgres), `JWT_SECRET` (long random), `HOST=0.0.0.0`, `CORS_ORIGIN=*`. Leave `SMTP_*` empty.

Free tier spins down after idle — first request after sleep can take ~30–60s.

## API overview

| Method | Path | Auth |
|---|---|---|
| POST | `/auth/register` | — |
| POST | `/auth/verify-otp` | — |
| POST | `/auth/resend-otp` | — |
| POST | `/auth/login` | — |
| GET | `/me` | JWT |
| PUT | `/profile` | JWT |
| GET | `/tasks` | JWT |
| PUT | `/tasks/selection` | JWT |
| GET | `/tasks/selection` | JWT |

## Tests

```bash
pnpm test
```

Covers OTP generation/expiry/attempts/resend cooldown, login gates, JWT rejection, and input validation.

## Business Name

`businessName` is **optional**. Many PadosiPro households are families, not companies; the live app only gates onboarding on name + address. Documented here and in DESIGN.md.

## Build Android APK

**Do this after the app flow works in Expo Go / emulator.** Do not ship an APK before you have walked register → OTP → login → profile → tasks → home yourself.

### Option A — EAS Build (recommended for reviewers)

```bash
cd apps/mobile
npx eas-cli login   # once
npx eas-cli build -p android --profile preview
```

`eas.json` ships a `preview` profile that produces an installable APK.

### Option B — Local Gradle (needs Android SDK)

```bash
cd apps/mobile
npx expo prebuild -p android
cd android
# Windows: gradlew.bat assembleRelease
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

Copy the APK into `releases/` before submitting.

## Project layout

```
apps/api          Fastify + Prisma
apps/mobile       Expo Router app
  hooks/          API calls live here; pages only consume hooks
  lib/api.ts      Thin fetch wrapper (JWT + errors)
packages/types    Shared TypeScript types
packages/validation  Shared Zod schemas
prisma lives under apps/api/prisma
```

## Design choices

We deliberately kept the mobile networking stack simple: **`fetch` + custom hooks**, not Axios or TanStack Query. Those are solid options for larger apps; we skipped them here to avoid extra providers, cache keys, and dependencies for a short onboarding flow.

Full rationale (chosen vs deferred alternatives): [DESIGN.md](DESIGN.md).

## Manual walkthrough

1. Register with email + password  
2. Open Mailpit (or API logs) → copy OTP → verify  
3. Log in  
4. Complete profile (name, +91 mobile, address; business optional)  
5. Multi-select tasks → confirm → home  
6. Kill and reopen the app — you stay logged in  
7. Open Account (person icon on Home) → Log out 

## License

Assignment submission — not for production use of PadosiPro trademarks beyond the brief.
