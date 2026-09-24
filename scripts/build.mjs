// Builds src/ into dist/. No dependencies beyond Node itself.
//
// Each page in src/pages/ begins with a metadata block:
//   <!--meta {"slug": "guide", "title": "...", "description": "..."} -->
// followed by the page body. Placeholders in {{double braces}} are replaced
// from the table below; {{root}} becomes the relative path to the site root.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../site.config.mjs';
import { icons, renderPage } from './layout.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'src');
const DIST = join(here, '..', 'dist');

// Order is the order of the main navigation.
const nav = [
  { slug: 'index', label: 'Features', href: '#features' },
  { slug: 'how-it-works', label: 'How it works', href: 'how-it-works/' },
  { slug: 'guide', label: 'Setup guide', href: 'guide/' },
  { slug: 'open-source', label: 'Open source', href: 'open-source/' },
];

const v = config.version;
const download = (file) => `${config.repo}/releases/download/v${v}/${file}`;
const placeholders = {
  version: v,
  releaseDate: config.releaseDate,
  repo: config.repo,
  releases: `${config.repo}/releases/latest`,
  dmg: download(`AudioBridge-${v}-macos.dmg`),
  pkg: download(`AudioBridge-${v}-macos.pkg`),
  apk: download(`AudioBridge-${v}-android.apk`),
  sums: download('SHA256SUMS'),
  siteUrl: config.siteUrl,
  siteRepo: config.siteRepo,
  'icon.apple': icons.apple,
  'icon.android': icons.android,
  'icon.github': icons.github,
  'icon.arrow': icons.arrow,
};

function fill(text, root) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    if (key === 'root') return root;
    if (key in placeholders) return placeholders[key];
    throw new Error(`unknown placeholder ${match}`);
  });
}

function parsePage(file) {
  const raw = readFileSync(join(SRC, 'pages', file), 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--meta … --> block`);
  const meta = JSON.parse(m[1]);
  for (const key of ['slug', 'title', 'description']) {
    if (!meta[key]) throw new Error(`${file}: meta.${key} is required`);
  }
  return { meta, body: raw.slice(m[0].length) };
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });
if (existsSync(join(SRC, 'public'))) cpSync(join(SRC, 'public'), DIST, { recursive: true });

const sitemap = [];
for (const file of readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html')).sort()) {
  const { meta, body } = parsePage(file);
  const isHome = meta.slug === 'index';
  const is404 = meta.slug === '404';

  // GitHub Pages serves 404.html at whatever path was requested, so it needs
  // absolute links; every other page gets relative ones.
  const root = is404 ? `${new URL(config.siteUrl).pathname.replace(/\/?$/, '/')}` : (isHome ? '' : '../');
  const outPath = isHome ? 'index.html' : is404 ? '404.html' : `${meta.slug}/index.html`;
  const url = isHome ? `${config.siteUrl}/` : `${config.siteUrl}/${meta.slug}/`;

  // Metadata values may use placeholders too (JSON-LD download URLs, etc.).
  const filledMeta = JSON.parse(fill(JSON.stringify(meta), root));
  const html = renderPage({ meta: filledMeta, body: fill(body, root), root, url, config, nav });

  mkdirSync(dirname(join(DIST, outPath)), { recursive: true });
  writeFileSync(join(DIST, outPath), html);
  if (!meta.noindex) sitemap.push({ url, priority: meta.priority ?? (isHome ? '1.0' : '0.8') });
  console.log(`  ${outPath}`);
}

writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((p) => `  <url><loc>${p.url}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`);

writeFileSync(join(DIST, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${config.siteUrl}/sitemap.xml
`);

writeFileSync(join(DIST, 'site.webmanifest'), JSON.stringify({
  name: config.name,
  short_name: config.name,
  description: config.tagline,
  start_url: './',
  display: 'browser',
  background_color: config.themeColor,
  theme_color: config.themeColor,
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2));

// Pages would otherwise run Jekyll over the output and skip some files.
writeFileSync(join(DIST, '.nojekyll'), '');
console.log(`built ${sitemap.length} indexable pages into dist/`);
