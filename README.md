# Portfolio — James Kerby C. Sarmiento

A buildless static portfolio. Hand-written HTML/CSS/JS, no bundler, no framework.
The only external dependency of the portfolio shell is Google Fonts (IBM Plex).

It showcases three commissioned, multi-role dashboard systems — each rebuilt as a
safe, self-contained public demo (mock/local backend, deterministic fictional
data, no client data or credentials, one-click login, "Reset Demo Data").

## Structure

```
index.html              portfolio landing (hero, about, capabilities, projects, contact)
css/portfolio.css        design system — tokens shared with the relay-helpdesk demo
js/portfolio.js          scroll-spy nav, mobile menu, reveal-on-scroll, footer year (no deps)
projects/                per-project case studies
  relay-helpdesk.html
  iserve.html
  guinayang.html
relay-helpdesk/          live demo — served at /relay-helpdesk/  (buildless vanilla JS + localStorage)
iserve/                  live demo — served at /iserve/          (mock Firebase + localStorage)
assets/
  img/                   headshot, thumbnails, favicon, OG image
  resume/                CV PDF
  guinayang/             screenshots, walkthrough video, Windows demo .zip
.github/workflows/deploy-pages.yml   GitHub Pages deploy (upload repo root, no build)
```

Guinayang GTMS is a .NET 8 VB.NET WinForms desktop app — it can't run in a
browser, so it's shown via screenshots + a screen recording + a downloadable
Windows build. A static web rebuild is planned.

## Run locally

Any static file server, from the repo root:

```
npx serve .
# or
python3 -m http.server 8000
```

Open `http://localhost:3000` (or `:8000`). The two live demos are at
`/relay-helpdesk/` and `/iserve/`.

## Deploy

Push to `main`. The Pages workflow uploads the repo as-is (everything is already
static) and publishes. In the GitHub repo: **Settings → Pages → Source = GitHub
Actions**. Works whether Pages serves from the domain root (`jeymskeruby.github.io`)
or a project sub-path — every internal link is relative.

## Status

- **Phase 1 (done):** site shell, capabilities, three case studies, both live
  demos wired, deploy workflow. Personal content and media are `<!-- PLACEHOLDER -->`.
- **Phase 2 (pending):** headshot, résumé, bio/headline/contact strings, LinkedIn;
  Guinayang screenshots + walkthrough + `.zip`; demo thumbnails; favicon/OG image.
- **Phase 3 (future):** rebuild Guinayang GTMS as a static web demo.
