# tethertone-website

The website for [Tethertone](https://github.com/AimenSayoud/tethertone), the
free, open-source app that streams your Mac's audio to your Android phone over
USB or Wi-Fi.

**Live:** https://aimensayoud.github.io/tethertone-website/

A static site with no framework, no web fonts, no tracking and no third-party
requests. Every page scores 100 in Lighthouse for performance, accessibility,
best practices and SEO, and CI enforces those budgets.

## Develop

```bash
npm install
npm run build      # src/ → dist/
npm run serve      # http://localhost:4173
npm run ci         # build + SEO check + HTML validation + Lighthouse
```

Requires Node 20+. Lighthouse needs a local Chrome.

## Structure

```
site.config.mjs        site URL, repository, version — change the domain here
src/pages/*.html       one file per page; starts with a <!--meta {...} --> JSON block
src/assets/            css/site.css (design tokens, light + dark), js/site.js, img/
src/public/            copied to the site root: favicons, touch icons
scripts/build.mjs      layout + pages → dist/, sitemap.xml, robots.txt, webmanifest
scripts/layout.mjs     shared <head>, header and footer
scripts/check.mjs      SEO and link lint (fails the build)
scripts/serve.mjs      local preview server
scripts/icons.py       renders PNG icons (Pillow)
scripts/og-image.html  template for the 1200×630 social image
scripts/indexnow.mjs   tells Bing & co. which pages changed (run by CI after deploy)
marketing/LAUNCH_KIT.md  launch copy and search-engine setup steps (not published)
```

### Writing a page

```html
<!--meta
{
  "slug": "example",
  "title": "Up to 60 characters",
  "description": "Between 70 and 160 characters.",
  "jsonLd": [{ "@context": "https://schema.org", "@type": "…" }]
}
-->
<section class="page-hero">…</section>
```

Placeholders such as `{{root}}`, `{{repo}}`, `{{dmg}}`, `{{apk}}` and
`{{version}}` are filled in at build time. `{{root}}` makes every internal link
relative, so the output works from any base path. Add the page to `nav` in
`scripts/build.mjs` if it belongs in the menu.

### Regenerating images

```bash
npm run icons
npm run og        # renders the social image with local Chrome
```

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`, which builds, runs every
quality gate and deploys `dist/` to GitHub Pages. Pull requests run the same
gates without deploying. See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the
pipeline and roadmap.

## License

[MIT](LICENSE) © Tethertone contributors
