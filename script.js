/* ════════════════════════════════════════════════════════════════
   Script — Abinash Basa Portfolio
   Canvas animation · Dynamic rendering · Theme toggle · Nav
   ════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────
     1. Theme Toggle (light / dark)
     ───────────────────────────────────────── */
  const root  = document.documentElement;
  const saved = localStorage.getItem('theme');

  if (saved) {
    root.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    updateToggleIcon();
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateToggleIcon();
    });
  }

  function updateToggleIcon() {
    if (!toggle) return;
    const isDark = root.getAttribute('data-theme') === 'dark';
    toggle.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }


  /* ─────────────────────────────────────────
     2. Navigation — scroll effect + mobile
     ───────────────────────────────────────── */
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }


  /* ─────────────────────────────────────────
     3. Hero — parametric curve canvas
     ───────────────────────────────────────── */
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx   = canvas.getContext('2d');
    let width, height, dpr, time = 0;
    let animId;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width  = rect.width;
      height = rect.height;
      canvas.width  = width  * dpr;
      canvas.height = height * dpr;
      canvas.style.width  = width  + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawCurve(cx, cy, radius, k, phase, points) {
      ctx.beginPath();
      const totalAngle = Math.PI * 2 * Math.max(Math.ceil(Math.abs(k)), 1);
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * totalAngle;
        const r = radius * Math.cos(k * theta + phase);
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function animate() {
      time += 0.0015;
      ctx.clearRect(0, 0, width, height);

      const isDark = root.getAttribute('data-theme') === 'dark';
      ctx.strokeStyle = isDark
        ? 'rgba(235, 235, 235, 0.04)'
        : 'rgba(26, 26, 26, 0.045)';
      ctx.lineWidth = 0.7;

      // Position the curves on the right side of the viewport
      const cx = width * 0.62;
      const cy = height * 0.48;
      const baseR = Math.min(width, height) * 0.32;

      // Three slowly evolving rose curves
      for (let i = 0; i < 3; i++) {
        const k     = 3 + Math.sin(time * 0.8 + i * 1.8) * 2.5;
        const phase = time * 0.4 + i * (Math.PI / 2.5);
        const r     = baseR * (0.55 + i * 0.2);
        drawCurve(cx, cy, r, k, phase, 900);
      }

      animId = requestAnimationFrame(animate);
    }

    // Only run on larger screens
    const mql = window.matchMedia('(min-width: 640px)');
    function handleMedia(e) {
      if (e.matches) {
        resize();
        animate();
        window.addEventListener('resize', resize);
      } else {
        cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, width, height);
        window.removeEventListener('resize', resize);
      }
    }
    handleMedia(mql);
    mql.addEventListener('change', handleMedia);
  }


  /* ─────────────────────────────────────────
     4. Render Projects from config.js
     ───────────────────────────────────────── */
  const grid = document.getElementById('projectsGrid');
  if (grid && typeof SITE_CONFIG !== 'undefined') {
    grid.innerHTML = SITE_CONFIG.projects.map(p => {
      const tags = p.tags.map(t => `<span class="project-tag">${t}</span>`).join('');
      const isPlaceholder = p.link === '#';
      return `
        <article class="project-card reveal" style="--card-accent: var(--type-${p.type})">
          <h3 class="project-card-title">${p.title}</h3>
          <p class="project-card-desc">${p.description}</p>
          <div class="project-card-tags">${tags}</div>
          <a href="${p.link}" class="project-card-link" ${!isPlaceholder ? 'target="_blank" rel="noopener"' : ''}>
            ${p.linkText} <span class="arrow">→</span>
          </a>
        </article>`;
    }).join('');
  }


  /* ─────────────────────────────────────────
     5. Render Contact Links from config.js
     ───────────────────────────────────────── */
  const contactContainer = document.getElementById('contactLinks');
  if (contactContainer && typeof SITE_CONFIG !== 'undefined') {
    const c = SITE_CONFIG.contact;
    const icons = {
      email:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>',
      linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
      github:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
      twitter:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>',
      substack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="4" x2="20" y2="4"/><line x1="4" y1="9" x2="20" y2="9"/><path d="M4 14l8 6 8-6"/></svg>',
      youtube:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="4"/><polygon points="10,8 16,12 10,16"/></svg>',
    };

    const labels = {
      email: 'Email',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      twitter: 'X / Twitter',
      substack: 'Substack',
      youtube:  'YouTube',
    };

    const entries = Object.entries(c).filter(([, v]) => v && v.length > 0);
    contactContainer.innerHTML = entries.map(([key, val]) => {
      const href = key === 'email' ? `mailto:${val}` : val;
      return `
        <a href="${href}" class="contact-link" target="_blank" rel="noopener noreferrer">
          ${icons[key] || ''}
          ${labels[key] || key}
        </a>`;
    }).join('');
  }


  /* ─────────────────────────────────────────
     6. Scroll Reveal (IntersectionObserver)
     ───────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach(el => io.observe(el));

    // Also observe dynamically added cards
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    // Fallback — show everything
    reveals.forEach(el => el.classList.add('visible'));
  }

});
