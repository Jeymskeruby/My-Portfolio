# Relay Helpdesk — Portfolio Demo Build

Relay Helpdesk is a multi-role IT helpdesk / ticketing platform (Client, Agent,
Team Leader, Admin, Super Admin): categorised ticket intake, an ITSM
urgency × impact priority matrix, capacity-aware round-robin routing, automatic
SLA breach escalation, time tracking, a knowledge base, an append-only audit
log with CSV/Excel export, and in-app notifications. Originally built as a
commissioned full-stack project on Laravel 13 + Inertia/React + a Filament v5
admin console, with PostgreSQL and Laravel Reverb (WebSockets).

**This build is a frontend-only portfolio version.** The entire Laravel/Filament
backend has been removed. The app runs in the browser against a local mock
database (`localStorage`) so it can be viewed and clicked through with no live
server, no real credentials, and no dependency on the original client's data.

## What was changed from the original

- Deleted the whole Laravel / Filament / Inertia backend and the Vite + Tailwind
  build step.
- Split the single-file prototype `Demo/relay-helpdesk.html` into a **buildless,
  multi-file vanilla-JS static site** — `index.html` + `css/app.css` + ~30
  ordered `js/*.js` modules, one per section of the original script (storage,
  seed data, routing, SLA/system checks, time tracking, notifications, auth, and
  one file per rendered view).
- Replaced the prototype's `window.storage` host API (an async key/value store
  with no browser fallback) with a `localStorage`-backed layer in
  `js/storage.js`: the whole database lives under one versioned JSON key
  (`relay_demo_db_v1`); `skGet` / `skSet` / `loadDB` stay async so every call
  site is unchanged; an in-memory fallback keeps the app usable (without
  persistence) in private browsing or when storage is full.
- Added `js/demo-banner.js` — a persistent banner shown on every view (including
  the admin screens) with the demo logins and a **Reset Demo Data** button.
- Moved the ITSM priority matrix reference image to `assets/`.
- Everything else — ticket lifecycle, routing engine, capacity limits, priority
  matrix, SLA logic, time tracking, notifications, team/category/user
  management, KB, audit-log export — is the **unmodified prototype**.

## Running it

Any static file server works:

```
npx serve .
# or
python3 -m http.server 8000
```

Then open `index.html`. Data persists in your browser's `localStorage` as you
click around, and a ~6-second poll propagates changes between roles (an agent's
public reply shows up on the client's ticket a few seconds later). A full page
reload returns you to the sign-in screen — the session is in-memory only — but
your data changes are kept. Use **Reset Demo Data** in the bottom banner to
restore the starting state.

## Demo accounts

Sign in with one click from the login screen — **this build has no passwords**.

| Role | Login |
|---|---|
| Super Admin | `superadmin@relay.io` |
| Admin | `admin@relay.io` |
| Team Leader | `leader1@relay.io`, `leader2@relay.io` |
| Agent | `alice@relay.io`, `bob@relay.io`, `charlie@relay.io`, `diana@relay.io` |
| Client | `john@acmecorp.com`, `sarah@brightleaf.io` |

You can also use **Create client account & sign in** on the login screen.

## Note on the original project

This was a commissioned project; the live version and the real client data are
not included or reproduced here. Only the frontend prototype, restructured to
run against fictional local data, is shown. The `Demo/` folder is kept as the
design-spec archive (original requirements, function catalogue, the
single-file prototype this build was split from, and the
prototype-to-Laravel parity notes).
