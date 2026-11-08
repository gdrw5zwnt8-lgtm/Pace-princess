# PacePrincess AI

## The product
Running training for women that adapts to the menstrual cycle phase.
**Audience:** female runners who want to train with their cycle.
**Business model:** one monthly SaaS plan, **PacePrincess AI Pro, $12.99/month** ($0.43 a day).
Free users get the phase tracker; Pro unlocks today's run adjusted to the phase and a 7-day cycle-synced week.

## The RESULT (what "done" means)
A runner goes landing → 60-second onboarding → sees her phase (the peak) → pays in-page → her adjusted run is unlocked immediately → she can view, cancel and resume the subscription in Account settings.

## Funnel rules (never break)
1. **No prices on the landing page** (`app/page.tsx`). The e2e test asserts there is no `$<digit>` there.
2. **Paywall at the peak:** the pricing card appears on the last onboarding step, right after the "Day N: <phase>" reveal. `/pricing` and the locked card on `/train` are secondary entries.
3. **Show the price per day** next to the monthly price (`pricePerDay()` in `lib/plans.ts`).
4. **Checkout stays inside the page:** a sheet/modal (`components/CheckoutSheet.tsx`), never a redirect.

## Stack and map
Next.js 15 (App Router) + TypeScript, plain CSS design tokens. No other runtime dependencies.
- `lib/plans.ts`: the plan, price, benefits and quota (single source of truth).
- `lib/plan.ts`: `getPlan(session)` decides free or pro **on the server**; `consumeQuota()` counts use against the plan's quota (200 plan refreshes/month).
- `lib/kwop.ts`: the Kwop adapter: checkout, confirm, cancel, resume, `track()` events.
- `lib/ai.ts`: all "AI" (the coaching engine). Nothing else generates training.
- `lib/cycle.ts`: cycle day and phase maths (shared by client and server).
- `lib/session.ts`: HMAC-signed httpOnly cookie session (`SESSION_SECRET`).
- `app/api/*`: `session`, `profile`, `checkout`, `checkout/confirm`, `subscription` (cancel/resume), `training` (gated).
- Pages: `/` landing, `/onboarding`, `/pricing`, `/train`, `/account`.
- `supabase/migrations/…_cycle_synced_subscription.sql`: tables with `user_id` + RLS, ready for when Supabase is connected.

## Kwop
The real Kwop API docs and keys were **not available** when this was built. Every payment and event call goes through `lib/kwop.ts`, which runs in **test mode** by default (`KWOP_MODE=test`):
- `4242 4242 4242 4242` pays; `4000 0000 0000 0002` is declined; any future expiry, any CVC.
- The checkout sheet shows a "Test mode" banner, so nobody thinks they paid real money.
- `KWOP_MODE=live` deliberately throws `not_configured` until the real calls are written in that file.
- Plan id: `KWOP_PRO_PLAN_ID` (default `pp_pro_monthly`).
- Events: `onboarding_completed`, `checkout_started`, `subscription_started`, `subscription_canceled`, `subscription_resumed`, and `feature_used {"detail": "Cycle-Synced Training"}` on every Pro plan load.

## Design system
Tokens are in `app/globals.css` `:root`: deep slate surfaces (`--slate-950/900/800`), energetic pink accent (`--pink-500` #FF2E7E), phase colours (`--phase-*`), spacing `--s-1..7`, radii, motion (`--ease`, `--dur-fast` 150ms, `--dur` 250ms, `--dur-slow` 600ms).
Components are CSS classes: `.card`, `.btn btn-primary|ghost|danger`, `.input`, `.chip`, `.badge`, `.alert`, `.skeleton`, `.spinner`, `.pricing-card`, `.overlay/.sheet`, `.check` (success checkmark draws in, then pops).
Micro-interactions: the primary button lifts and glows on hover, its arrow slides and it presses on click. Respects `prefers-reduced-motion`.
Phone first (390 px), then a 768 px breakpoint. Every data view has loading (skeleton), empty and error (retry) states.

## Choices made (no questions asked)
- **Brand:** the repo and the user's own words describe PacePrincess AI, so the app is PacePrincess AI. The "Questify" context in the request did not match and was not used.
- **One plan, monthly only** ($12.99), as written. No yearly plan.
- **Free tier** = phase tracker only, so the paywall has something to unlock at the peak.
- **No login yet:** an anonymous signed-cookie session holds profile, subscription and usage. It is tamper-proof (HMAC), so Pro can't be granted from the browser. When Supabase auth is added, the migration's tables replace the cookie one-to-one.
- **Cancel = at period end** (access is kept until the paid month ends), with **Resume** before then, like the best subscription apps.
- **Card declines** return 200 `{paid:false}` (a normal outcome, not a server error), so the console stays clean.
- **AI engine** is rule-based (published cycle-phase training guidance: deterministic, no keys needed). Swap `coach()` in `lib/ai.ts` for a model call later.
- Training guidance only; the footer says it is not medical advice.

## Verification loop (do this for every change)
1. `npm run build`: zero errors.
2. `npm run e2e`: starts `next start`, runs the full path at **390×844 (phone)** and **1280×860 (desktop)**: landing has no prices → empty state → onboarding → pricing card ($12.99/month, $0.43 a day) → locked free view (server-enforced) → in-page checkout (decline, then success with checkmark) → Pro training → account (cancel, resume) → forged cookie rejected. Fails on any console error or horizontal scroll.
3. Open the screenshots in `shots/` and look at them yourself. Three passes.
4. Against production: `BASE_URL=https://<deploy> npm run e2e`.

## Env vars
`SESSION_SECRET` (required in production), `KWOP_MODE`, `KWOP_PRO_PLAN_ID`.
