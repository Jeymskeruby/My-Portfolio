# Guinayang Guidance Tracking and Management System — Portfolio Demo

A .NET 8 (VB.NET, WinForms) desktop application for a school guidance office:
student records, guidance case tracking, incident reports from a companion mobile
app, dashboards, Word/Excel document generation, and user management.

> **This is a demo build for portfolio purposes.** It runs fully offline with
> pre-loaded sample data. No cloud services, credentials, or network calls.

## Running it

1. Open the solution in Visual Studio 2022 (the project has a COM reference to
   Word Interop, so it builds with MSBuild / Visual Studio, not `dotnet build`).
2. Press F5.

On the login screen, choose **Continue as Admin** or **Continue as Staff** — no
password. **Reset Demo Data** restores the sample dataset to its original state at
any time.

## What the demo build changes

- **Click-to-login role picker** instead of username/password.
- **Deterministic sample data** (12 students, guidance cases, 10 incident reports)
  seeded into a local SQLite database on first run; rebuilt by "Reset Demo Data".
- **No Firebase / Firestore / gRPC** — the incident-report store, backup, restore
  and notification features are backed locally or disabled.
- Word/Excel exports are written to `Documents\Guinayang Demo\`.
- Word templates are generated on first run into `Templates\`.

## Data locations (created at runtime, git-ignored)

| File | Purpose |
| --- | --- |
| `student_records.db` | students, guardians, academic history, cases, incidents |
| `users.db` | demo accounts, audit log, sessions |
| `Documents\Guinayang Demo\` | exported case / incident Word documents |
