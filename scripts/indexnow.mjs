// Tells IndexNow engines (Bing — and through it ChatGPT search and Copilot —
// plus Yandex, Seznam and Naver) which pages changed, right after a deploy.
//
//   node scripts/indexnow.mjs            submit pages changed between $BEFORE and $AFTER
//   node scripts/indexnow.mjs --all      submit every page in the sitemap
//
// Only changed pages are sent: resubmitting unchanged URLs on every push is
// the kind of noise IndexNow asks senders to avoid.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import config from '../site.config.mjs';

if (!config.indexNowKey) {
  console.log('indexnow: no key configured, skipping');
  process.exit(0);
}

const all = [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const urlFor = (file) => {
  const slug = file.replace(/^src\/pages\//, '').replace(/\.html$/, '');
  return slug === 'index' ? `${config.siteUrl}/` : `${config.siteUrl}/${slug}/`;
};

let urls = all;
const { BEFORE, AFTER } = process.env;
if (!process.argv.includes('--all') && BEFORE && AFTER && !/^0+$/.test(BEFORE)) {
  let changed = [];
  try {
    changed = execFileSync('git', ['diff', '--name-only', BEFORE, AFTER], { encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    changed = null; // unknown range (force push, shallow clone): send everything
  }
  if (changed) {
    // Shared layout or config changes touch every page.
    const global = changed.some((f) => /^(scripts\/layout\.mjs|scripts\/build\.mjs|site\.config\.mjs)$/.test(f));
    urls = global ? all : changed.filter((f) => /^src\/pages\/.+\.html$/.test(f)).map(urlFor).filter((u) => all.includes(u));
  }
}

if (!urls.length) {
  console.log('indexnow: no page content changed, nothing to submit');
  process.exit(0);
}

const host = new URL(config.siteUrl).host;
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: config.indexNowKey, keyLocation: `${config.siteUrl}/${config.indexNowKey}.txt`, urlList: urls }),
});
console.log(`indexnow: submitted ${urls.length} URL(s), HTTP ${res.status}`);
urls.forEach((u) => console.log(`  ${u}`));
// 200 and 202 are success; anything else is reported but never fails a deploy.
if (![200, 202].includes(res.status)) console.log(`indexnow: ${await res.text()}`);
