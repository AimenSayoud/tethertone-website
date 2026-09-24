// Progressive enhancement only: every page works without this file.
(() => {
  'use strict';
  const REPO = 'AimenSayoud/audiobridge';

  // Mobile navigation.
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // Copy buttons on code blocks.
  document.querySelectorAll('pre > code').forEach((code) => {
    const pre = code.parentElement;
    if (pre.closest('.terminal')) return;
    const wrap = document.createElement('div');
    wrap.className = 'codeblock';
    pre.replaceWith(wrap);
    wrap.appendChild(pre);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText.replace(/\n$/, ''));
        btn.textContent = 'Copied';
      } catch {
        btn.textContent = 'Press ⌘C';
      }
      setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
    });
    wrap.appendChild(btn);
  });

  // Recommend the download that matches the visitor's platform.
  const ua = navigator.userAgent;
  const platform = /Android/i.test(ua) ? 'android' : /Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua) ? 'macos' : null;
  if (platform) {
    document.querySelectorAll(`[data-platform="${platform}"]`).forEach((el) => el.classList.add('recommended'));
  }

  // Point download links at the newest release. Static links to the version
  // the site was built with stay in place if the API is unreachable.
  const assetLinks = document.querySelectorAll('[data-asset]');
  if (assetLinks.length) {
    const cacheKey = 'ab-latest-release';
    const apply = (release) => {
      if (!release || !Array.isArray(release.assets)) return;
      const version = String(release.tag_name || '').replace(/^v/, '');
      assetLinks.forEach((a) => {
        const match = release.assets.find((x) => x.name.endsWith(a.dataset.asset));
        if (match) a.href = match.browser_download_url;
      });
      if (version) document.querySelectorAll('[data-version]').forEach((el) => { el.textContent = version; });
    };
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch { /* storage unavailable */ }
    if (cached) {
      apply(cached);
    } else {
      fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
        .then((r) => (r.ok ? r.json() : null))
        .then((release) => {
          if (!release) return;
          const slim = { tag_name: release.tag_name, assets: release.assets.map(({ name, browser_download_url }) => ({ name, browser_download_url })) };
          try { sessionStorage.setItem(cacheKey, JSON.stringify(slim)); } catch { /* storage unavailable */ }
          apply(slim);
        })
        .catch(() => { /* keep the static links */ });
    }
  }

  // Highlight the current section in a table of contents.
  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.remove('active'));
        byId.get(entry.target.id)?.classList.add('active');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
  }

})();
