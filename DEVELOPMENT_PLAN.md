# Development plan — tethertone-website

The marketing and documentation site for
[Tethertone](https://github.com/AimenSayoud/tethertone). It is a static site
with no framework, no tracking and no third-party requests, built by a small
Node script and deployed to GitHub Pages.

**Live:** https://aimensayoud.github.io/tethertone-website/

## Goals

1. **Explain it in five seconds.** A visitor understands what Tethertone does,
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

### Phase 7 — Rename and design review ✅
Tethertone was published as AudioBridge 0.1.0; 0.2.0 renamed it everywhere.
The site took the new name, redirects searchers with `alternateName`, and tells
0.1.0 users what to do. A batch of outside design changes was reviewed:

| Change | Decision |
|---|---|
| Light/dark theme switch | **Kept.** Choice stored per visitor, applied before first paint |
| Collapsible table of contents | **Kept, improved.** Collapsed by default on phones, a fixed sidebar on desktop |
| Table wrappers, callout icons, FAQ cards, route icons, copy icons | **Kept** |
| QR code on the download page | **Kept, improved.** Opens the download page (survives new releases); desktop only |
| Terminal copy button | **Kept, fixed.** It sat inside an `aria-hidden` region; the terminal is now real, indexable text |
| Back-to-top link | **Kept.** The script that overrode it was removed |
| Reading progress bar | **Kept for articles only.** Now animated with a transform instead of width |
| Invented UI in the hero (LIVE badge, “Stop Broadcast”, “USB 3.0”, L/R dB meters) | **Removed.** Mockups must show the real apps |
| Footer “status” dot | **Removed.** It implied a live service; now a version and changelog link |
| Route labels “WireGuard”, “40–60ms” | **Removed.** Inaccurate (ZeroTier isn't WireGuard; latency depends on the buffer) |
| Hover lift on non-clickable cards | **Removed.** It suggested links that weren't there |

It also fixed three regressions: home performance fell from 100 to 85
(layout-triggering animations, since moved to transforms); document pages
overflowed on phones (grid column `1fr` → `minmax(0, 1fr)`); and the hero
drawing took 900 px of a phone screen (the Mac drawing is hidden below 560 px).

### Phase 8 — Search and AI discoverability ✅
Based on 2026 guidance: Google needs no special markup for AI Overviews, and
AI citations come mostly from pages that already rank. ChatGPT search and
Copilot draw on Bing's index. Freshness helps when dates are honest.
`llms.txt` is barely read by crawlers, so it's published only as a cheap extra.

- [x] Pages aimed at real searches: `/android-phone-as-mac-speaker/` (how-to)
      and `/compare/` (sourced comparison with AudioRelay and Airfoil)
- [x] “In short” summaries at the top of every article, so skimmers and
      answer engines get the answer first
- [x] Visible byline and date; the same date in JSON-LD `dateModified` and the
      sitemap `lastmod`, taken from the git history of each page
- [x] `Organization` and `alternateName: AudioBridge` structured data
- [x] IndexNow: key file at the root, and CI submits only the pages that changed
      after each deploy (manual workflow run resubmits everything)
- [x] Slots for Google and Bing verification tags in `site.config.mjs`
- [x] `llms.txt` generated from page metadata
- [x] Internal links: a Guides section on the home page and footer links
- [x] Launch kit with ready copy and account steps: `marketing/LAUNCH_KIT.md`
- [x] F-Droid metadata and submission draft in the app repo (`docs/FDROID.md`)

### Phase 9 — After launch (owner actions and ideas)
- [ ] Work through `marketing/LAUNCH_KIT.md`: Search Console, Bing, GitHub
      social preview, Show HN, Reddit, AlternativeTo, awesome lists, F-Droid
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
