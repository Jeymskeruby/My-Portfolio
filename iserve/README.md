# iServe — Portfolio Demo Build

iServe is a volunteer-matching platform (volunteers ↔ event organizers ↔ admin moderation), originally built as a commissioned full-stack project with a Firebase (Firestore + Auth) backend.

**This build is a frontend-only portfolio version.** All Firebase calls have been replaced with a local mock backend so the app can be viewed and clicked through with no live server, no real credentials, and no dependency on the original client's data.

## What was changed from the original

- Removed the live Firebase SDK and the real project's API key/config.
- Added `mock-firebase.js` — an in-browser re-implementation of the small slice of the Firebase Auth + Firestore API this app uses (`collection().where().orderBy().limit().get()`, `doc().set()/.update()/.delete()`, `onSnapshot()`, `FieldValue.serverTimestamp()/increment()/arrayUnion()/arrayRemove()`, email/password auth) backed by `localStorage` instead of a network call.
- Added `mock-seed-data.js` — fictional demo volunteers, organizers, events, join requests, and notifications.
- Added `demo-banner.js` — a small on-page banner with demo login credentials and a "Reset Demo Data" button.
- The rest of the app's logic (matching, dashboards, forms, notifications) is **unmodified original code**.

## Running it

Any static file server works, e.g.:

```
npx serve .
# or
python3 -m http.server 8000
```

Then open `index.html`. Data persists in your browser's `localStorage` as you click around (so an organizer approving a volunteer's request will show up on that volunteer's dashboard). Use the "Reset Demo Data" button in the banner to restore the starting state.

## Demo accounts

All passwords: `demo1234`

| Role | Login | 
|---|---|
| Volunteer | `juan.delacruz@example.com` |
| Organizer (approved) | username `greenearth` |
| Organizer (approved) | username `readforward` |
| Organizer (pending — for the admin-approval demo) | username `newpaws` |
| Admin | `admin@admin.iserve.demo` |

## Note on the original project

This was a commissioned project; the live version and real client data are not included or reproduced here. Only the frontend code, restructured to run against fictional local data, is shown.
