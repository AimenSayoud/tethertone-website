// Builds src/ into dist/. No dependencies beyond Node itself.
//
// Each page in src/pages/ begins with a metadata block:
//   <!--meta {"slug": "guide", "title": "...", "description": "..."} -->
// followed by the page body. Placeholders in {{double braces}} are replaced
// from the table below; {{root}} becomes the relative path to the site root.

import { execFileSync } from 'node:child_process';
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
  { slug: 'compare', label: 'Compare', href: 'compare/' },
  { slug: 'open-source', label: 'Open source', href: 'open-source/' },
];

const v = config.version;
const download = (file) => `${config.repo}/releases/download/v${v}/${file}`;
const placeholders = {
  version: v,
  releaseDate: config.releaseDate,
  repo: config.repo,
  releases: `${config.repo}/releases/latest`,
  dmg: download(`Tethertone-${v}-macos.dmg`),
  pkg: download(`Tethertone-${v}-macos.pkg`),
  apk: download(`Tethertone-${v}-android.apk`),
  sums: download('SHA256SUMS'),
  siteUrl: config.siteUrl,
  siteRepo: config.siteRepo,
  'icon.apple': icons.apple,
  'icon.android': icons.android,
  'icon.github': icons.github,
  'icon.arrow': icons.arrow,
  'icon.sun': icons.sun,
  'icon.moon': icons.moon,
  'icon.copy': icons.copy,
  'icon.check': icons.check,
  'icon.qr': icons.qr,
  'icon.info': icons.info,
  'icon.warn': icons.warn,
  'icon.usb': icons.usb,
  'icon.wifi': icons.wifi,
  'icon.shield': icons.shield,
  'icon.globe': icons.globe,
};

function fill(text, root, local = {}) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    if (key === 'root') return root;
    if (key in local) return local[key];
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

// A page's date is the date its content last changed: the last commit that
// touched its source, or today if it has uncommitted edits. The same date goes
// in the visible byline, the JSON-LD and the sitemap, so the three agree.
const today = new Date().toISOString().slice(0, 10);
function lastModified(path) {
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', path], { encoding: 'utf8' }).trim();
    if (dirty) return today;
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', path], { encoding: 'utf8' }).trim() || today;
  } catch {
    return today;
  }
}
const humanDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

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

  const updatedIso = lastModified(join(SRC, 'pages', file));
  const local = { updatedIso, updated: humanDate(updatedIso), pageUrl: url };

  // Metadata values may use placeholders too (JSON-LD download URLs, etc.).
  const filledMeta = JSON.parse(fill(JSON.stringify(meta), root, local));
  const html = renderPage({ meta: filledMeta, body: fill(body, root, local), root, url, config, nav });

  mkdirSync(dirname(join(DIST, outPath)), { recursive: true });
  writeFileSync(join(DIST, outPath), html);
  if (!meta.noindex) sitemap.push({ url, lastmod: updatedIso, title: filledMeta.title, description: filledMeta.description, llms: meta.llms });
  console.log(`  ${outPath}`);
}

writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((p) => `  <url><loc>${p.url}</loc><lastmod>${p.lastmod}</lastmod></url>`).join('\n')}
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

// llms.txt: a plain-text map of the site for AI agents (llmstxt.org). Cheap
// to publish; search engines ignore it, some agents read it.
writeFileSync(join(DIST, 'llms.txt'), `# ${config.name}

> ${config.name} (formerly AudioBridge) is a free, open-source (MIT) app pair that streams a Mac's system audio to an Android phone over USB or Wi-Fi as uncompressed 16-bit PCM, with QR pairing, a jitter buffer and continuous clock-drift correction. macOS 14+ sender (SwiftUI) and Android 8+ receiver (Kotlin). No account, no cloud, no tracking.

Current version: ${v}. Source code: ${config.repo}

## Pages

${sitemap.map((p) => `- [${p.title}](${p.url}): ${p.description}`).join('\n')}

## Reference

- [Wire protocol](${config.repo}/blob/main/docs/PROTOCOL.md): the TCP protocol between the Mac and the phone
- [Architecture](${config.repo}/blob/main/docs/ARCHITECTURE.md): capture, transport, jitter buffer, drift correction
- [Troubleshooting](${config.repo}/blob/main/docs/TROUBLESHOOTING.md): permissions, connection problems, remote access
- [Changelog](${config.repo}/blob/main/CHANGELOG.md)
`);

// IndexNow proves ownership with a key file at the site root.
if (config.indexNowKey) writeFileSync(join(DIST, `${config.indexNowKey}.txt`), config.indexNowKey);

// Pages would otherwise run Jekyll over the output and skip some files.
writeFileSync(join(DIST, '.nojekyll'), '');
console.log(`built ${sitemap.length} indexable pages into dist/`);
