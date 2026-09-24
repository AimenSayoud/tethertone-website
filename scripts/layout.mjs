// The page shell shared by every page: <head> metadata, header, footer.
// `root` is the relative path back to the site root ("" or "../"), so the
// output works under any base path.

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const icons = {
  logo: `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="7.5" fill="#0b1120"/><rect x="7.5" y="19.8" width="2.4" height="3.9" rx="1" fill="#bae6fd"/><rect x="11.4" y="16" width="2.4" height="7.7" rx="1" fill="#7dd3fc"/><rect x="15.2" y="10.9" width="2.4" height="12.8" rx="1" fill="#38bdf8"/><rect x="19" y="14.1" width="2.4" height="9.6" rx="1" fill="#0ea5e9"/><rect x="22.9" y="19.8" width="2.4" height="3.9" rx="1" fill="#bae6fd"/></svg>`,
  github: `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.37 12.64c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.4-3.66zM14.1 5.88c.63-.77 1.06-1.83.94-2.88-.91.04-2.02.61-2.67 1.37-.59.68-1.1 1.76-.96 2.8 1.02.08 2.05-.52 2.69-1.29z"/></svg>`,
  android: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.6 9.48l1.84-3.18a.38.38 0 00-.66-.38l-1.87 3.23A11.43 11.43 0 0012 8.17c-1.77 0-3.43.37-4.91.98L5.22 5.92a.38.38 0 00-.66.38L6.4 9.48C3.3 11.25 1.2 14.4 1 18h22c-.2-3.6-2.3-6.75-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/></svg>`,
  arrow: `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg>`,
};

function jsonLd(data) {
  if (!data) return '';
  const blocks = Array.isArray(data) ? data : [data];
  return blocks.map((d) =>
    `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`
  ).join('\n');
}

export function renderPage({ meta, body, root, url, config, nav }) {
  const title = meta.title;
  const image = `${config.siteUrl}/assets/img/og-image.png`;
  const navLinks = nav.map((item) => {
    const current = item.slug === meta.slug ? ' aria-current="page"' : '';
    return `<li><a href="${root}${item.href}"${current}>${esc(item.label)}</a></li>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${url}">
${meta.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="${config.themeColor}">
<meta name="color-scheme" content="light dark">
<meta name="author" content="AudioBridge contributors">
<meta property="og:type" content="${meta.ogType || 'website'}">
<meta property="og:site_name" content="${config.name}">
<meta property="og:locale" content="${config.locale}">
<meta property="og:title" content="${esc(meta.ogTitle || title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="AudioBridge — stream your Mac's audio to your Android phone over USB or Wi-Fi">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.ogTitle || title)}">
<meta name="twitter:description" content="${esc(meta.description)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${root}favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="manifest" href="${root}site.webmanifest">
<link rel="stylesheet" href="${root}assets/css/site.css">
<script>document.documentElement.classList.replace('no-js','js')</script>
<script src="${root}assets/js/site.js" defer></script>
${jsonLd(meta.jsonLd)}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <nav class="nav container" aria-label="Main">
    <a class="brand" href="${root || './'}" aria-label="AudioBridge home">${icons.logo}<span>AudioBridge</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu">
      <span class="visually-hidden">Menu</span><span class="nav-toggle-bars" aria-hidden="true"></span>
    </button>
    <div class="nav-menu" id="nav-menu">
      <ul class="nav-links">${navLinks}</ul>
      <div class="nav-actions">
        <a class="icon-link" href="${config.repo}" rel="noopener">${icons.github}<span>GitHub</span></a>
        <a class="btn btn-primary btn-sm" href="${root}download/">Download</a>
      </div>
    </div>
  </nav>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="brand" href="${root || './'}">${icons.logo}<span>AudioBridge</span></a>
      <p>Free, open-source audio streaming from macOS to Android. Native on both sides. No account, no cloud, no tracking.</p>
    </div>
    <nav aria-label="Product">
      <h2>Product</h2>
      <ul>
        <li><a href="${root}download/">Download</a></li>
        <li><a href="${root}guide/">Setup guide</a></li>
        <li><a href="${root}how-it-works/">How it works</a></li>
        <li><a href="${root}#faq">FAQ</a></li>
      </ul>
    </nav>
    <nav aria-label="Project">
      <h2>Project</h2>
      <ul>
        <li><a href="${root}open-source/">Open source</a></li>
        <li><a href="${config.repo}" rel="noopener">Source code</a></li>
        <li><a href="${config.repo}/releases" rel="noopener">Releases</a></li>
        <li><a href="${config.repo}/issues" rel="noopener">Issues</a></li>
      </ul>
    </nav>
    <nav aria-label="Documentation">
      <h2>Documentation</h2>
      <ul>
        <li><a href="${config.repo}/blob/main/docs/PROTOCOL.md" rel="noopener">Wire protocol</a></li>
        <li><a href="${config.repo}/blob/main/docs/BUILDING.md" rel="noopener">Building from source</a></li>
        <li><a href="${config.repo}/blob/main/SECURITY.md" rel="noopener">Security policy</a></li>
        <li><a href="${config.repo}/blob/main/CHANGELOG.md" rel="noopener">Changelog</a></li>
      </ul>
    </nav>
  </div>
  <div class="container footer-legal">
    <p>© 2026 AudioBridge contributors · <a href="${config.repo}/blob/main/LICENSE" rel="noopener">MIT License</a></p>
    <p>Not affiliated with Apple or Google. macOS is a trademark of Apple Inc. Android is a trademark of Google LLC.</p>
  </div>
</footer>
</body>
</html>
`;
}
