/**
 * Substack Integration Dynamic Loader - Abinash Basa Portfolio
 * Loads and renders latest Substack Notes (rolling) and persistent Articles.
 */

(function () {
  'use strict';

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  function renderNotes(notes) {
    const section = document.getElementById('latestNotesSection');
    const container = document.getElementById('notesContainer');
    if (!section || !container) return;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';

    // Take top 3 to 5 notes
    const recentNotes = notes.slice(0, 5);

    const cardsHTML = recentNotes.map(note => {
      const dateFormatted = formatDate(note.date);
      const titleClean = escapeHTML(note.title || 'Substack Note');
      const excerptClean = escapeHTML(note.excerpt || '');
      const urlClean = encodeURI(note.url || 'https://substack.com/@abinashbasa');

      return `
        <article class="note-card reveal is-visible" data-note-id="${escapeHTML(note.id || '')}">
          <div class="note-meta">
            <span class="note-badge">
              <span class="badge-dot" style="background: currentColor;"></span>
              Substack Note
            </span>
            ${dateFormatted ? `<time class="note-date" datetime="${escapeHTML(note.date)}">${dateFormatted}</time>` : ''}
          </div>
          <h3 class="note-title">${titleClean}</h3>
          ${excerptClean ? `<p class="note-excerpt">${excerptClean}</p>` : ''}
          <div class="note-footer">
            <a href="${urlClean}" target="_blank" rel="noopener noreferrer" class="note-link" aria-label="Read note: ${titleClean}">
              Read Note on Substack
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = cardsHTML;
  }

  function renderArticles(articles) {
    const container = document.getElementById('articlesContainer');
    if (!container) return;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return;
    }

    const cardsHTML = articles.map(article => {
      const dateFormatted = formatDate(article.date);
      const titleClean = escapeHTML(article.title || 'Untitled Essay');
      const excerptClean = escapeHTML(article.excerpt || '');
      const urlClean = encodeURI(article.url || 'https://substack.com/@abinashbasa');
      const hasImage = Boolean(article.image && article.image.startsWith('http'));

      return `
        <article class="article-card reveal is-visible" data-article-id="${escapeHTML(article.id || '')}">
          ${hasImage ? `
            <div class="article-cover-wrap">
              <img src="${encodeURI(article.image)}" alt="${titleClean}" class="article-cover-img" loading="lazy" />
            </div>
          ` : ''}
          <div class="article-content">
            <div>
              <div class="article-meta">
                <span class="article-badge">
                  <span class="badge-dot" style="background: currentColor;"></span>
                  Long-Form Essay
                </span>
                ${dateFormatted ? `<time class="note-date" datetime="${escapeHTML(article.date)}">${dateFormatted}</time>` : ''}
              </div>
              <h3 class="article-title">${titleClean}</h3>
              ${excerptClean ? `<p class="article-excerpt">${excerptClean}</p>` : ''}
            </div>
            <div class="article-footer">
              <a href="${urlClean}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost" aria-label="Read article: ${titleClean}">
                Read Full Article
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = cardsHTML;
  }

  function initSubstackContent() {
    // 1. Fetch Notes
    fetch('data/substack-notes.json')
      .then(resp => {
        if (!resp.ok) throw new Error('Notes HTTP ' + resp.status);
        return resp.json();
      })
      .then(notes => renderNotes(notes))
      .catch(err => {
        console.warn('Substack notes fetch notice:', err.message);
        // Fallback: preserve pre-rendered HTML without breaking layout
      });

    // 2. Fetch Articles
    fetch('data/substack-articles.json')
      .then(resp => {
        if (!resp.ok) throw new Error('Articles HTTP ' + resp.status);
        return resp.json();
      })
      .then(articles => renderArticles(articles))
      .catch(err => {
        console.warn('Substack articles fetch notice:', err.message);
        // Fallback: preserve pre-rendered HTML
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubstackContent);
  } else {
    initSubstackContent();
  }
})();
