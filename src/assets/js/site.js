// Progressive enhancement only: every page works without this file.
(() => {
  'use strict';
  const REPO = 'AimenSayoud/tethertone';
  const THEME_KEY = 'tt-theme';
  const root = document.documentElement;
  const narrow = () => window.matchMedia('(max-width: 900px)').matches;

  const ICON_COPY = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="5" y="5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 11H3a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 013 2h6a1.5 1.5 0 011.5 1.5v.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Theme: follows the system until the visitor picks one. The choice is
  // applied before first paint by the inline script in <head>.
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
    const active = () => root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
    const label = () => {
      const text = active() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      themeToggle.setAttribute('aria-label', text);
      themeToggle.title = text;
    };
    label();
    themeToggle.addEventListener('click', () => {
      const next = active() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch { /* storage unavailable */ }
      label();
    });
    systemDark.addEventListener?.('change', label);
  }

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

  // Copy buttons.
  const copyButton = (className, getText, ariaLabel) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute('aria-label', ariaLabel);
    const idle = () => { btn.innerHTML = `${ICON_COPY}<span>Copy</span>`; btn.classList.remove('copied'); };
    idle();
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(getText());
        btn.innerHTML = `${ICON_CHECK}<span>Copied</span>`;
        btn.classList.add('copied');
      } catch {
        btn.innerHTML = '<span>Press ⌘C</span>';
      }
      setTimeout(idle, 1800);
    });
    return btn;
  };
  const codeText = (code) => code.innerText.replace(/\n$/, '');

  document.querySelectorAll('pre > code').forEach((code) => {
    const pre = code.parentElement;
    const terminal = pre.closest('.terminal');
    if (terminal) {
      terminal.querySelector('.terminal-bar')?.appendChild(
        copyButton('terminal-copy-btn', () => codeText(code), 'Copy build commands'));
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'codeblock';
    pre.replaceWith(wrap);
    wrap.append(pre, copyButton('copy-btn', () => codeText(code), 'Copy code to clipboard'));
  });

  // Recommend the download that matches the visitor's platform.
  const ua = navigator.userAgent;
  const platform = /Android/i.test(ua) ? 'android'
    : /Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua) ? 'macos' : null;
  if (platform) {
    document.querySelectorAll(`[data-platform="${platform}"]`).forEach((el) => el.classList.add('recommended'));
  }

  // Point download links at the newest release, after the page has settled.
  // The static links to the version the site was built with stay if this fails.
  const assetLinks = document.querySelectorAll('[data-asset]');
  if (assetLinks.length) {
    const cacheKey = 'tt-latest-release';
    const apply = (release) => {
      if (!release || !Array.isArray(release.assets)) return;
      const version = String(release.tag_name || '').replace(/^v/, '');
      assetLinks.forEach((a) => {
        const match = release.assets.find((x) => x.name.endsWith(a.dataset.asset));
        if (match) a.href = match.browser_download_url;
      });
      if (version) document.querySelectorAll('[data-version]').forEach((el) => { el.textContent = version; });
    };
    const load = () => {
      let cached = null;
      try { cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch { /* storage unavailable */ }
      if (cached) { apply(cached); return; }
      fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
        .then((r) => (r.ok ? r.json() : null))
        .then((release) => {
          if (!release) return;
          const slim = { tag_name: release.tag_name, assets: release.assets.map(({ name, browser_download_url }) => ({ name, browser_download_url })) };
          try { sessionStorage.setItem(cacheKey, JSON.stringify(slim)); } catch { /* storage unavailable */ }
          apply(slim);
        })
        .catch(() => { /* keep the static links */ });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 2000 });
    else setTimeout(load, 300);
  }

  // Table of contents: collapsed on phones, a fixed sidebar on wide screens,
  // and the current section highlighted while reading.
  document.querySelectorAll('.toc-collapsible').forEach((details) => {
    if (narrow()) details.open = false;
    details.addEventListener('click', (e) => {
      if (e.target.closest('a') && narrow()) details.open = false;
    });
  });

  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
        const link = byId.get(entry.target.id);
        if (link) { link.classList.add('active'); link.setAttribute('aria-current', 'location'); }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
  }
})();
