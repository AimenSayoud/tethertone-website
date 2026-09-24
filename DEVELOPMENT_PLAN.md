# Development plan — audiobridge-website

The marketing and documentation site for
[AudioBridge](https://github.com/AimenSayoud/audiobridge). It is a static site
with no framework, no tracking and no third-party requests, built by a small
Node script and deployed to GitHub Pages.

**Live:** https://aimensayoud.github.io/audiobridge-website/

## Goals

1. **Explain it in five seconds.** A visitor understands what AudioBridge does,
   and that it is free, open source and native, without scrolling.
2. **Get people to a working setup.** Downloads, install steps and the first
   pairing are one click from every page.
3. **Rank for what people actually search for.** Examples: “stream mac audio to
   android”, “use android phone as mac speaker”, “mac audio over usb to phone”.
4. **Present the open-source project honestly.** License, architecture,
   roadmap, known gaps and how to contribute.
5. **Stay fast and accessible.** Lighthouse 100 for SEO and best practices,
   95 or more for performance and accessibility, enforced in CI.

## Pipeline

Every change goes through the same stages, locally (`npm run ci`) and in
GitHub Actions:

```
 src/ ──► build ──► dist/ ──► check ──► validate ──► lighthouse ──► deploy (main only)
          │                   │          │              │               │
          │                   │          │              │               └ GitHub Pages
          │                   │          │              └ perf ≥ 95, a11y ≥ 95, SEO = 100, BP = 100
          │                   │          └ html-validate (W3C-style HTML rules)
          │                   └ SEO lint: title/description length, one h1, canonical,
          │                     alt text, JSON-LD parses, internal links and #anchors resolve
          └ layout + pages → pretty URLs, sitemap.xml, robots.txt, webmanifest
```

| Stage | Command | Fails the build when |
|---|---|---|
| Build | `npm run build` | a page is missing metadata |
| SEO and link check | `npm run check` | any rule in `scripts/check.mjs` is broken |
| HTML validation | `npm run validate` | invalid or inaccessible markup |
| Lighthouse | `npm run lighthouse` | a score is below its budget in `lighthouserc.json` |
| Deploy | push to `main` | any stage above fails |

External links are checked in CI with lychee, which does not block the build.
They break for reasons outside the site's control.

## Phases

### Phase 1 — Foundations ✅
- [x] Separate repository, MIT license, README, this plan
- [x] Zero-dependency build script: shared layout, per-page metadata, pretty URLs
- [x] Design tokens with light and dark themes; system font stack, so no web-font request

### Phase 2 — Information architecture and content ✅
- [x] **Home** — hero, features, three-step setup, pipeline, capture methods, routes, open source, FAQ
- [x] **Download** — per-platform downloads, requirements, install steps, Gatekeeper, checksums, build from source
- [x] **Setup guide** — USB, Wi-Fi, BlackHole, remote access, troubleshooting
- [x] **How it works** — architecture, protocol, jitter buffer, clock drift, security model
- [x] **Open source** — license, repository map, contributing, roadmap, known gaps, credits
- [x] **404** page

### Phase 3 — Design and build ✅
- [x] Hero with HTML/CSS mockups of the real Mac and Android interfaces
- [x] Responsive from 320 px up; no horizontal scroll
- [x] Motion only when `prefers-reduced-motion` allows it
- [x] Download buttons that pick up the latest GitHub release at runtime, with static fallbacks
- [x] Copy buttons on code blocks

### Phase 4 — SEO ✅
- [x] Unique title (≤ 60 chars) and description (70–160 chars) per page
- [x] Canonical URLs, Open Graph and Twitter cards, 1200×630 social image
- [x] JSON-LD: `SoftwareApplication`, `WebSite`, `FAQPage`, `TechArticle`, `BreadcrumbList`
- [x] `sitemap.xml`, `robots.txt`, web manifest, favicons and touch icons
- [x] Semantic landmarks, one `h1` per page, descriptive link text

### Phase 5 — Quality gates and CI/CD ✅
- [x] `scripts/check.mjs` SEO and link lint
- [x] html-validate configuration
- [x] Lighthouse CI budgets
- [x] GitHub Actions: build → check → validate → Lighthouse → deploy to Pages

### Phase 6 — Launch ✅
- [x] Public repository and GitHub Pages deployment
- [x] Website linked from the app repository's README and “About” homepage field

### Phase 7 — After launch (owner actions and ideas)
- [ ] Verify the site in [Google Search Console](https://search.google.com/search-console) and submit `sitemap.xml`
- [ ] Same for [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [ ] Optional custom domain: set `SITE_URL` in `site.config.mjs`, add a `CNAME` file, configure DNS
- [ ] Real screenshots and a short demo video once the UI settles
- [ ] Translate the home page (French, Polish) with `hreflang`

## Conventions

- Pages live in `src/pages/*.html`. Each starts with a `<!--meta … -->` JSON
  block; the build wraps it in `scripts/layout.mjs`.
- Internal links use `{{root}}` and are made relative at build time, so the
  output works from any base path: Pages, a custom domain or a local folder.
- Facts about the app — requirements, UI labels, numbers — must match the app
  repository. When the app changes, update the site in the same release.
