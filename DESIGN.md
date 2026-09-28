# DESIGN.md

## Architecture

Monorepo (`pnpm` workspaces): **Fastify + Prisma/PostgreSQL** API, **Expo Router** mobile app, shared **Zod** schemas and TypeScript types. Docker Compose runs Postgres and Mailpit. One process for the API — no Redis, queues, or microservices.

Auth flow follows the assignment PDF (email/password → email OTP → JWT), not production `app.padosipro.com` (phone + email OTP only). Visual language (cream `#FAFAF7`, forest `#155C49`, gold `#C9A84C`, OTP screen layout) is matched natively.

Onboarding state is server-owned: `GET /me` returns `profileCompleted` and `tasksSelected` so routing survives app restarts.

### Mobile data layer

Screens stay UI-only. Network work lives in hooks under `apps/mobile/hooks/` (`useLogin`, `useRegister`, `useSaveProfile`, `useTasksCatalog`, …). A thin `api()` helper in `lib/api.ts` wraps `fetch`, attaches the JWT, and normalizes errors. Session tokens use **expo-secure-store** (with a web `localStorage` fallback).

This is intentional simplicity for a short onboarding journey — not ignorance of stronger tools.

| Chosen here | Stronger alternative | Why we did not use it yet |
|---|---|---|
| Native `fetch` + `lib/api.ts` | **Axios** | Axios shines with rich interceptors, upload progress, and large shared HTTP clients. Our surface is a handful of JSON endpoints; `fetch` already covers auth headers and typed errors without another dependency. |
| Custom hooks (`useApiAction`, domain hooks) | **TanStack Query** | TanStack is the right default once you need shared cache, background refetch, pagination, or offline. We only have a few mutations and two loaders; custom hooks keep loading/error state without a `QueryClient` provider or query-key invalidation. |
| Expo SDK packages (`expo-router`, `expo-secure-store`, `expo-constants`, …) | Ad-hoc RN community libs for the same jobs | Prefer first-party Expo modules when they already solve the need — fewer version fights in an Expo Go / EAS build. |
| Zod in shared `packages/validation` | Per-app ad-hoc checks or Yup | One schema source for API + mobile; less drift on register/login/profile rules. |
| Context `AuthProvider` + SecureStore | Redux / Zustand global store | Auth + `/me` is the only cross-screen client state worth sharing; a store library would be ceremony. |
| `useDebouncedValue` (setTimeout) + `Array.filter` | **lodash** (`debounce` / `filter`) | Task search is a small in-memory list. A 300ms timeout debounce is enough; lodash would add bundle weight for no gain here. |

**When to upgrade:** add TanStack Query if home/tasks start sharing cached lists, need focus refetch, or grow pagination. Consider Axios only if interceptors or non-JSON uploads become a real pain — otherwise stay on `fetch` (or Expo’s fetch helpers later).

## Main trade-offs

| Choice | Trade-off |
|---|---|
| JWT in SecureStore (7d) | Simple persistence; no refresh tokens / revocation list |
| `fetch` + custom hooks | Minimal deps and clear page/hook split; no cache layer or request dedupe |
| Mailpit | Real SMTP locally without secrets; not production email |
| Business name optional | Matches household use-cases; called out in README |
| Plus Jakarta Sans | Free stand-in for proprietary Eina01 used by production |
| Recreated logo mark | No copied production PNG/SVG assets |
| Android-only APK | Brief allows Android alone; iOS needs a paid Apple account |

## What was left out

Push notifications, Lifestyle Manager dashboards, wallets/payments, WebView, production API calls, refresh-token rotation, rate limiting beyond OTP rules, iOS IPA, Axios, TanStack Query, global client state libraries.

<!-- ## Next week

1. Refresh tokens + logout-everywhere  
2. Real SMTP (SES/Resend) with branded templates  
3. Edit profile from Account  
4. E2E Detox or Maestro flow on emulator  
5. Accessibility pass and smaller phone layouts  
6. CI: migrate + test + Expo Doctor on PR  
7. Revisit TanStack Query if list caching / focus refetch starts to hurt   -->
