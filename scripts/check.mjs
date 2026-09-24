// SEO and link lint for dist/. Fails (exit 1) on any error.
//
// Per page: title and description length, exactly one <h1>, canonical and
// Open Graph tags, valid JSON-LD, alt text on every <img>, rel="noopener" on
// new-tab links, and every internal href and #anchor resolving to a real file
// and element. Site-wide: unique titles and descriptions, and sitemap entries
// that point at real pages.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../site.config.mjs';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const errors = [];
const warn = [];
const fail = (page, msg) => errors.push(`${page}: ${msg}`);

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const pages = walk(DIST).filter((f) => f.endsWith('.html'));
const html = new Map(pages.map((p) => [p, readFileSync(p, 'utf8')]));

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const metaContent = (src, key, value) =>
  src.match(new RegExp(`<meta\\s+${key}="${value}"\\s+content="([^"]*)"`))?.[1];
const idsOf = (src) => new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const titles = new Map();
const descriptions = new Map();

for (const [file, src] of html) {
  const page = relative(DIST, file);
  const is404 = page === '404.html';

  const title = decode(src.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  if (!title) fail(page, 'missing <title>');
  else if (title.length > 60) fail(page, `title is ${title.length} chars (max 60): "${title}"`);
  else if (title.length < 25) warn.push(`${page}: short title (${title.length} chars)`);

  const desc = decode(metaContent(src, 'name', 'description') ?? '');
  if (!desc) fail(page, 'missing meta description');
  else if (desc.length < 70 || desc.length > 160) fail(page, `description is ${desc.length} chars (want 70–160)`);

  if (!is404) {
    titles.set(title, [...(titles.get(title) ?? []), page]);
    descriptions.set(desc, [...(descriptions.get(desc) ?? []), page]);
  }

  const h1s = src.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(page, `has ${h1s.length} <h1> elements (want 1)`);

  if (!/<html lang="[a-z-]+"/.test(src)) fail(page, 'missing <html lang>');
  if (!/<link rel="canonical" href="https:\/\/[^"]+"/.test(src)) fail(page, 'missing absolute canonical URL');
  for (const og of ['og:title', 'og:description', 'og:image', 'og:url']) {
    if (!metaContent(src, 'property', og)) fail(page, `missing ${og}`);
  }
  if (!metaContent(src, 'name', 'twitter:card')) fail(page, 'missing twitter:card');

  for (const m of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      if (!data['@context'] || !data['@type']) fail(page, 'JSON-LD block without @context/@type');
    } catch (e) {
      fail(page, `invalid JSON-LD: ${e.message}`);
    }
  }

  for (const m of src.matchAll(/<img\b[^>]*>/g)) {
    if (attr(m[0], 'alt') === undefined) fail(page, `<img> without alt: ${m[0].slice(0, 80)}`);
  }

  // Links.
  const ownIds = idsOf(src);
  for (const m of src.matchAll(/<a\b[^>]*>/g)) {
    const tag = m[0];
    const href = attr(tag, 'href');
    if (href === undefined || href === '') { fail(page, `link without href: ${tag}`); continue; }
    if (/^(https?:)?\/\//.test(href)) {
      if (/target="_blank"/.test(tag) && !/rel="[^"]*noopener/.test(tag)) {
        fail(page, `target="_blank" link without rel="noopener": ${href}`);
      }
      continue;
    }
    if (/^(mailto|tel):/.test(href)) continue;
    const [pathPart, hash] = href.split('#');
    let target = file;
    if (pathPart) {
      const base = is404 ? join(DIST, pathPart.replace(new URL(config.siteUrl).pathname, '/')) : resolve(dirname(file), pathPart);
      target = pathPart.endsWith('/') || existsSync(base) && statSync(base).isDirectory() ? join(base, 'index.html') : base;
      if (!existsSync(target)) { fail(page, `broken link: ${href}`); continue; }
    }
    if (hash) {
      const ids = target === file ? ownIds : idsOf(html.get(target) ?? readFileSync(target, 'utf8'));
      if (!ids.has(decodeURIComponent(hash))) fail(page, `broken anchor: ${href}`);
    }
  }

  // Assets referenced by <link> and <script>.
  for (const m of src.matchAll(/<(?:link|script)\b[^>]*(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^https?:/.test(ref)) continue;
    const p = is404 ? join(DIST, ref.replace(new URL(config.siteUrl).pathname, '/')) : resolve(dirname(file), ref);
    if (!existsSync(p)) fail(page, `missing asset: ${ref}`);
  }
}

for (const [t, where] of titles) if (where.length > 1) errors.push(`duplicate title "${t}" on ${where.join(', ')}`);
for (const [d, where] of descriptions) if (where.length > 1) errors.push(`duplicate description on ${where.join(', ')}`);

// Sitemap entries must map to built pages.
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = m[1].replace(config.siteUrl, '').replace(/^\//, '');
  if (!existsSync(join(DIST, path, 'index.html')) && !existsSync(join(DIST, path))) errors.push(`sitemap points at missing page: ${m[1]}`);
}
for (const f of ['robots.txt', 'site.webmanifest', 'favicon.svg', 'apple-touch-icon.png', 'assets/img/og-image.png']) {
  if (!existsSync(join(DIST, f))) errors.push(`missing ${f}`);
}

warn.forEach((w) => console.warn(`warn  ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error ${e}`));
  console.error(`\n${errors.length} error(s) in ${pages.length} pages`);
  process.exit(1);
}
console.log(`check passed: ${pages.length} pages, 0 errors, ${warn.length} warning(s)`);
