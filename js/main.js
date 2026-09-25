/**
 * Shared Site-Wide Interactions
 * Abinash Basa Portfolio — abinash-basa.github.io
 */

document.addEventListener('DOMContentLoaded', () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Theme Toggle (Dark / Light) with LocalStorage & OS Preference           */
  /* -------------------------------------------------------------------------- */
  const root = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('ab_theme');

  if (savedTheme) {
    root.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    root.setAttribute('data-theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
  }

  function updateThemeIcon() {
    if (!themeToggleBtn) return;
    const isDark = root.getAttribute('data-theme') !== 'light';
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggleBtn.innerHTML = isDark
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  if (themeToggleBtn) {
    updateThemeIcon();
    themeToggleBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('ab_theme', next);
      updateThemeIcon();
    });
  }

  /* -------------------------------------------------------------------------- */
  /* 2. Sticky Header Scroll State                                              */
  /* -------------------------------------------------------------------------- */
  const siteNav = document.getElementById('siteNav');
  if (siteNav) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        siteNav.classList.add('is-scrolled');
      } else {
        siteNav.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /* -------------------------------------------------------------------------- */
  /* 3. Mobile Navigation Drawer & ARIA Management                              */
  /* -------------------------------------------------------------------------- */
  const hamburger = document.getElementById('navHamburger');
  const navMenu = document.getElementById('navMenu');

  if (hamburger && navMenu) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !navMenu.classList.contains('is-open');
      hamburger.classList.toggle('is-active', isOpen);
      navMenu.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      document.body.classList.toggle('menu-open', isOpen);
    };

    hamburger.addEventListener('click', () => toggleMenu());

    // Close when clicking nav links
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        toggleMenu(false);
        hamburger.focus();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('is-open') && !siteNav.contains(e.target)) {
        toggleMenu(false);
      }
    });
  }

  /* -------------------------------------------------------------------------- */
  /* 4. IntersectionObserver Scroll Reveal                                     */
  /* -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  /* -------------------------------------------------------------------------- */
  /* 5. Project Category Filtering (projects.html)                              */
  /* -------------------------------------------------------------------------- */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-archive-card');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        filterButtons.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');

        projectCards.forEach(card => {
          const categories = (card.getAttribute('data-category') || '').split(' ');
          if (filter === 'all' || categories.includes(filter)) {
            card.style.display = '';
            setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 20);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* -------------------------------------------------------------------------- */
  /* 6. Copy Email to Clipboard Helper                                          */
  /* -------------------------------------------------------------------------- */
  const copyEmailBtns = document.querySelectorAll('.js-copy-email');
  copyEmailBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = 'abinashbasa15@gmail.com';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(() => {
          const originalText = btn.innerHTML;
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied to clipboard!';
          btn.classList.add('is-copied');
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('is-copied');
          }, 2500);
        });
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Print Resume Helper (resume.html)                                       */
  /* -------------------------------------------------------------------------- */
  const printResumeBtn = document.getElementById('printResumeBtn');
  if (printResumeBtn) {
    printResumeBtn.addEventListener('click', () => {
      window.print();
    });
  }
});
