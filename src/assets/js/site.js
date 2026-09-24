// Progressive enhancement only: every page works without this file.
(() => {
  'use strict';
  const REPO = 'AimenSayoud/audiobridge';

  const copySvg = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="5" y="5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 11H3a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 013 2h6a1.5 1.5 0 011.5 1.5v.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const checkSvg = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // Theme switcher.
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const getActiveTheme = () => {
      const explicit = document.documentElement.getAttribute('data-theme');
      if (explicit) return explicit;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const updateLabel = (isDark) => {
      const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
    };

    updateLabel(getActiveTheme() === 'dark');

    themeToggle.addEventListener('click', () => {
      const current = getActiveTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('ab-theme', next); } catch (e) {}
      updateLabel(next === 'dark');
    });

    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('ab-theme')) {
          updateLabel(e.matches);
        }
      });
    } catch (e) {}
  }

  // Reading progress fallback for browsers without CSS animation-timeline.
  const progress = document.getElementById('reading-progress');
  if (progress && !CSS.supports('animation-timeline: scroll()')) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const total = document.documentElement.scrollHeight - window.innerHeight;
          const current = window.scrollY;
          progress.style.width = total > 0 ? `${Math.min(100, Math.max(0, (current / total) * 100))}%` : '0%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
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

  // Back to top link.
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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
    btn.innerHTML = `${copySvg}<span>Copy</span>`;
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText.replace(/\n$/, ''));
        btn.innerHTML = `${checkSvg}<span>Copied</span>`;
        btn.classList.add('copied');
      } catch {
        btn.innerHTML = `<span>Press ⌘C</span>`;
      }
      setTimeout(() => {
        btn.innerHTML = `${copySvg}<span>Copy</span>`;
        btn.classList.remove('copied');
      }, 1800);
    });
    wrap.appendChild(btn);
  });

  // Copy button for terminal block.
  document.querySelectorAll('.terminal').forEach((term) => {
    const bar = term.querySelector('.terminal-bar');
    const pre = term.querySelector('pre');
    if (!bar || !pre) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'terminal-copy-btn';
    btn.setAttribute('aria-label', 'Copy commands to clipboard');
    btn.innerHTML = `${copySvg}<span>Copy</span>`;
    btn.addEventListener('click', async () => {
      const lines = pre.innerText.split('\n')
        .filter((l) => !l.trim().startsWith('#') && !l.trim().startsWith('[sign]') && !l.trim().startsWith('BUILD SUCCESSFUL'))
        .map((l) => l.replace(/^\$\s*/, '').trim())
        .filter(Boolean);
      const toCopy = lines.join(' && ');
      try {
        await navigator.clipboard.writeText(toCopy || pre.innerText);
        btn.innerHTML = `${checkSvg}<span>Copied</span>`;
        btn.classList.add('copied');
      } catch {
        btn.innerHTML = `<span>Press ⌘C</span>`;
      }
      setTimeout(() => {
        btn.innerHTML = `${copySvg}<span>Copy</span>`;
        btn.classList.remove('copied');
      }, 1800);
    });
    bar.appendChild(btn);
  });

  // Recommend the download that matches the visitor's platform.
  const ua = navigator.userAgent;
  const platform = /Android/i.test(ua) ? 'android' : /Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua) ? 'macos' : null;
  if (platform) {
    document.querySelectorAll(`[data-platform="${platform}"]`).forEach((el) => el.classList.add('recommended'));
  }

  // Point download links at the newest release. Static links stay if API fails.
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

  // Collapsible mobile TOC link click auto-close.
  document.querySelectorAll('.toc-collapsible summary + ol a').forEach((a) => {
    a.addEventListener('click', () => {
      const details = a.closest('details');
      if (details && window.innerWidth <= 900) {
        details.removeAttribute('open');
      }
    });
  });

})();

