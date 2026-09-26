/**
 * Universal Cosmic Background System
 * Abinash Basa Portfolio - abinash-basa.github.io
 * 
 * Provides an elegant, lightweight, interactive starfield with mathematical curves
 * and subtle atmospheric depth across all pages.
 */

class CosmicBackground {
  constructor() {
    this.canvas = document.getElementById('cosmicCanvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'cosmicCanvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.time = 0;
    this.animId = null;
    this.isRunning = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.scrollY = 0;
    this.isMobile = window.innerWidth < 768;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect page context
    this.pageType = document.body.getAttribute('data-page') || 'default';

    this.init();
  }

  init() {
    this.resize();
    this.createStars();
    this.bindEvents();
    this.start();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isMobile = this.width < 768;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.stars.length === 0 || Math.abs((this.lastWidth || 0) - this.width) > 120) {
      this.createStars();
      this.lastWidth = this.width;
    }
  }

  createStars() {
    this.stars = [];
    const starCount = this.isMobile ? 65 : 150;

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * (this.isMobile ? 1.2 : 1.6) + 0.35,
        baseAlpha: Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: Math.random() < 0.25 ? 2 : (Math.random() < 0.6 ? 1 : 0),
        colorHue: Math.random() < 0.15 ? 'warm' : (Math.random() < 0.25 ? 'blue' : 'white')
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      if (this.reducedMotion) this.renderStaticFrame();
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      if (this.reducedMotion || this.isMobile) return;
      this.targetMouseX = (e.clientX - this.width / 2) * 0.03;
      this.targetMouseY = (e.clientY - this.height / 2) * 0.03;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY || window.pageYOffset;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });

    const observer = new MutationObserver(() => {
      if (this.reducedMotion) this.renderStaticFrame();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion) {
        this.stop();
        this.renderStaticFrame();
      } else {
        this.start();
      }
    });
  }

  isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  drawStar(star) {
    const isDark = this.isDarkTheme();
    const twinkle = Math.sin(this.time * 60 * star.twinkleSpeed + star.twinkleOffset);
    const alpha = Math.max(0.08, Math.min(0.88, star.baseAlpha + twinkle * 0.22));

    const parallaxFactor = (star.layer + 1) * 0.35;
    const px = star.x + this.mouseX * parallaxFactor;
    const py = (star.y - (this.scrollY * 0.04 * parallaxFactor)) % this.height;
    const normalizedY = py < 0 ? py + this.height : py;

    this.ctx.beginPath();
    this.ctx.arc(px, normalizedY, star.size, 0, Math.PI * 2);

    if (isDark) {
      if (star.colorHue === 'warm') {
        this.ctx.fillStyle = `rgba(224, 132, 94, ${alpha * 0.95})`;
      } else if (star.colorHue === 'blue') {
        this.ctx.fillStyle = `rgba(165, 195, 235, ${alpha * 0.8})`;
      } else {
        this.ctx.fillStyle = `rgba(240, 243, 248, ${alpha})`;
      }
    } else {
      if (star.colorHue === 'warm') {
        this.ctx.fillStyle = `rgba(200, 90, 52, ${alpha * 0.75})`;
      } else {
        this.ctx.fillStyle = `rgba(45, 52, 64, ${alpha * 0.55})`;
      }
    }
    this.ctx.fill();
  }

  drawMathCurves() {
    const isDark = this.isDarkTheme();
    const cx = this.isMobile ? this.width * 0.5 : this.width * 0.68;
    const cy = this.isMobile ? this.height * 0.38 : this.height * 0.46;
    const baseR = Math.min(this.width, this.height) * (this.isMobile ? 0.36 : 0.32);

    this.ctx.save();
    this.ctx.lineWidth = isDark ? 0.8 : 0.9;

    let curveCount = (this.pageType === 'home') ? 3 : 2;
    if (this.isMobile) curveCount = Math.min(curveCount, 2);

    for (let i = 0; i < curveCount; i++) {
      const k = (this.pageType === 'home')
        ? 3 + Math.sin(this.time * 0.7 + i * 1.5) * 2.2
        : 2 + Math.cos(this.time * 0.5 + i * 1.2) * 1.8;

      const phase = this.time * 0.35 + i * (Math.PI / 2.8);
      const r = baseR * (0.58 + i * 0.22);
      const points = this.isMobile ? 450 : 800;

      this.ctx.beginPath();
      const totalAngle = Math.PI * 2 * Math.max(Math.ceil(Math.abs(k)), 1);

      for (let p = 0; p <= points; p++) {
        const theta = (p / points) * totalAngle;
        const radius = r * Math.cos(k * theta + phase);
        const x = cx + radius * Math.cos(theta) + (this.mouseX * 0.4);
        const y = cy + radius * Math.sin(theta) + (this.mouseY * 0.4);

        if (p === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }

      if (isDark) {
        const strokeAlpha = i === 0 ? 0.055 : (i === 1 ? 0.038 : 0.028);
        this.ctx.strokeStyle = i === 0
          ? `rgba(224, 132, 94, ${strokeAlpha * 1.25})`
          : `rgba(235, 238, 245, ${strokeAlpha})`;
      } else {
        const strokeAlpha = i === 0 ? 0.065 : (i === 1 ? 0.045 : 0.03);
        this.ctx.strokeStyle = i === 0
          ? `rgba(200, 90, 52, ${strokeAlpha * 1.15})`
          : `rgba(40, 45, 55, ${strokeAlpha})`;
      }

      this.ctx.stroke();
    }

    // Subtle celestial coordinate orbital ring
    this.ctx.beginPath();
    this.ctx.arc(cx + this.mouseX * 0.15, cy + this.mouseY * 0.15, baseR * 0.95, 0, Math.PI * 2);
    this.ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.035)';
    this.ctx.setLineDash([3, 14]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.restore();
  }

  drawAmbientGlow() {
    const isDark = this.isDarkTheme();
    const cx = this.isMobile ? this.width * 0.5 : this.width * 0.7;
    const cy = this.isMobile ? this.height * 0.35 : this.height * 0.45;
    const radius = Math.min(this.width, this.height) * 0.65;

    const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    if (isDark) {
      grad.addColorStop(0, 'rgba(224, 132, 94, 0.038)');
      grad.addColorStop(0.5, 'rgba(30, 38, 60, 0.025)');
      grad.addColorStop(1, 'rgba(10, 11, 14, 0)');
    } else {
      grad.addColorStop(0, 'rgba(200, 90, 52, 0.035)');
      grad.addColorStop(0.6, 'rgba(215, 220, 230, 0.025)');
      grad.addColorStop(1, 'rgba(247, 246, 242, 0)');
    }

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  renderStaticFrame() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawAmbientGlow();
    for (let i = 0; i < this.stars.length; i++) {
      this.drawStar(this.stars[i]);
    }
    this.drawMathCurves();
  }

  animate() {
    if (!this.isRunning) return;

    this.time += 0.0012;

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawAmbientGlow();

    for (let i = 0; i < this.stars.length; i++) {
      this.drawStar(this.stars[i]);
    }

    this.drawMathCurves();

    this.animId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (this.reducedMotion) {
      this.renderStaticFrame();
      return;
    }
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cosmicBackground = new CosmicBackground();
  });
} else {
  window.cosmicBackground = new CosmicBackground();
}
