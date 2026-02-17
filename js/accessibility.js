/**
 * accessibility.js
 * Funcionalidades JavaScript para mejorar la accesibilidad
 * WCAG 2.1 Nivel A y AA — Principio 1 (Perceptible) + otros
 */

(function () {
  'use strict';

  // ============================================================
  // WCAG 4.1.3 — Mensajes de estado para carrito
  // ============================================================
  const notificationArea = document.getElementById('notification-area');
  const alertArea        = document.getElementById('alert-area');

  function announce(message, isAlert = false) {
    const area = isAlert ? alertArea : notificationArea;
    if (!area) return;
    area.textContent = '';
    requestAnimationFrame(() => {
      area.textContent = message;
    });
  }

  // ============================================================
  // Agregar al carrito
  // ============================================================
  document.querySelectorAll('.btn-add-cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const productId   = btn.dataset.productId;
      const productName = btn.closest('article')
        ?.querySelector('.product-name a')
        ?.textContent?.trim() || 'Producto';

      // WCAG 1.3.1 + 4.1.3: notificar al usuario vía aria-live
      announce(productName + ' agregado al carrito.');

      // Actualizar contador (WCAG 4.1.3)
      const cartCount = document.querySelector('.cart-count');
      if (cartCount) {
        const current = parseInt(cartCount.textContent) || 0;
        const next = current + 1;
        cartCount.textContent = next;
        // WCAG 1.3.1 — aria-label descriptivo en el botón del carrito
        const cartBtn = document.querySelector('.btn-cart');
        if (cartBtn) {
          cartBtn.setAttribute('aria-label',
            'Carrito de compras, ' + next + ' artículo' + (next !== 1 ? 's' : ''));
        }
      }
    });
  });

  // ============================================================
  // WCAG 4.1.2 — Menú hamburguesa: aria-expanded correcto
  // ============================================================
  const menuBtn = document.querySelector('.btn-menu');
  const mainNav = document.getElementById('main-nav');

  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', function () {
      const isOpen = mainNav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.setAttribute('aria-label',
        isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
      );
      // Mover foco al nav cuando se abre (WCAG 2.4.3)
      if (isOpen) {
        const firstLink = mainNav.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    });

    // Cerrar con Escape (WCAG 2.1.1)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
        menuBtn.focus();
      }
    });
  }

  // ============================================================
  // WCAG 1.4.4 — Verificar zoom: no usar eventos de resize para ocultar contenido
  // ============================================================

  // ============================================================
  // WCAG 2.4.1 — Skip links: asegurar que el foco llega al main
  // ============================================================
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    // tabindex="-1" ya está en el HTML, pero nos aseguramos
    if (!mainContent.hasAttribute('tabindex')) {
      mainContent.setAttribute('tabindex', '-1');
    }
  }

  // ============================================================
  // WCAG 1.4.9 — Tooltips accesibles al hover Y al focus
  // ============================================================
  document.querySelectorAll('[data-tooltip]').forEach(function (el) {
    const tooltipText = el.dataset.tooltip;
    const tooltip = document.createElement('div');
    tooltip.setAttribute('role', 'tooltip');
    tooltip.id = 'tooltip-' + Math.random().toString(36).slice(2);
    tooltip.className = 'tooltip-popup';
    tooltip.textContent = tooltipText;
    el.setAttribute('aria-describedby', tooltip.id);
    document.body.appendChild(tooltip);

    function showTooltip() {
      const rect = el.getBoundingClientRect();
      tooltip.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
      tooltip.style.left = (rect.left + window.scrollX) + 'px';
      tooltip.classList.add('is-visible');
    }

    function hideTooltip() {
      tooltip.classList.remove('is-visible');
    }

    // WCAG 1.4.9: visible al hover Y al focus
    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('focus',      showTooltip);
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('blur',       hideTooltip);
    // WCAG 1.4.9: se puede cerrar con Escape sin mover el foco
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideTooltip();
    });
  });

  // ============================================================
  // WCAG 1.3.1 — Tabla: indicar scroll horizontal en mobile
  // ============================================================
  const tableWrappers = document.querySelectorAll('.table-wrapper');
  tableWrappers.forEach(function (wrapper) {
    if (wrapper.scrollWidth > wrapper.clientWidth) {
      const hint = document.createElement('p');
      hint.className = 'table-scroll-hint';
      hint.textContent = 'Desplaza horizontalmente para ver toda la tabla';
      hint.setAttribute('aria-live', 'polite');
      wrapper.parentNode.insertBefore(hint, wrapper);
    }
  });

  // ============================================================
  // WCAG 2.4.1 — Resaltar sección activa según scroll
  // ============================================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-list a[href^="#"]');

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (link) {
            const href = link.getAttribute('href').slice(1);
            if (href === entry.target.id) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(function (section) { observer.observe(section); });
  }

})();

/**
 * accessibility.js — Panel de accesibilidad completo
 * WCAG 2.1 Nivel A y AA
 * Funciones: lector de pantalla, tamaño de fuente, alto contraste,
 *            espaciado, fuente dislexia, resaltar enlaces, cursor grande
 */

(function () {
  'use strict';

  /* ============================================================
     UTILIDADES
  ============================================================ */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => (ctx || document).querySelectorAll(sel);

  function savePrefs(p) {
    try { localStorage.setItem('ep_a11y', JSON.stringify(p)); } catch (_) {}
  }
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem('ep_a11y')) || {}; } catch (_) { return {}; }
  }

  /* ============================================================
     ESTADO
  ============================================================ */
  const defaults = {
    fontScale:       0,         // -2 / -1 / 0 / +1 / +2  (pasos de 10%)
    contrast:        'normal',  // 'normal' | 'high' | 'dark' | 'invert'
    spacing:         false,
    dyslexia:        false,
    highlightLinks:  false,
    bigCursor:       false,
    readerEnabled:   false,
  };

  let prefs = Object.assign({}, defaults, loadPrefs());
  const html = document.documentElement;

  /* ============================================================
     APLICAR ESTILOS
  ============================================================ */
  function applyFontScale(s) {
    html.style.fontSize = (1 + s * 0.1) + 'rem';
  }
  function applyContrast(m) {
    html.dataset.contrast = m;
  }
  function applySpacing(on) {
    html.classList.toggle('a11y-spacing', on);
  }
  function applyDyslexia(on) {
    html.classList.toggle('a11y-dyslexia', on);
  }
  function applyHighlightLinks(on) {
    html.classList.toggle('a11y-highlight-links', on);
  }
  function applyBigCursor(on) {
    html.classList.toggle('a11y-big-cursor', on);
  }
  function applyAll(p) {
    applyFontScale(p.fontScale);
    applyContrast(p.contrast);
    applySpacing(p.spacing);
    applyDyslexia(p.dyslexia);
    applyHighlightLinks(p.highlightLinks);
    applyBigCursor(p.bigCursor);
  }

  applyAll(prefs);

  /* ============================================================
     LECTOR DE PANTALLA — Web Speech API
  ============================================================ */
  let readerActive = false;

  function stopSpeech() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function speak(text, force) {
    if (!readerActive && !force) return;
    if (!window.speechSynthesis) return;
    stopSpeech();
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = 'es-ES';
    u.rate  = 0.95;
    window.speechSynthesis.speak(u);
  }

  function getLabel(el) {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    if (el.getAttribute('aria-labelledby')) {
      const ref = document.getElementById(el.getAttribute('aria-labelledby'));
      if (ref) return ref.textContent.trim();
    }
    if (el.tagName === 'IMG') return el.getAttribute('alt') || 'imagen';
    if (el.tagName === 'INPUT') {
      const lbl = $('label[for="' + el.id + '"]');
      if (lbl) return lbl.textContent.trim();
      return el.placeholder || el.type || 'campo';
    }
    return el.textContent.trim().slice(0, 180) || el.tagName.toLowerCase();
  }

  function readerFocus(e) {
    const el = e.target;
    const tag = el.tagName.toLowerCase();
    const label = getLabel(el);
    if (!label) return;
    const prefixes = { a: 'Enlace: ', button: 'Botón: ', select: 'Selector: ' };
    const hdMatch = tag.match(/^h([1-6])$/);
    const prefix = hdMatch
      ? 'Encabezado nivel ' + hdMatch[1] + ': '
      : (prefixes[tag] || (tag === 'input' ? 'Campo ' + (el.type || '') + ': ' : ''));
    speak(prefix + label);
  }
  function readerHover(e) {
    const el = e.target.closest('a,button,h1,h2,h3,h4,h5,h6,p,li,img,input,select,textarea,[role]');
    if (el) speak(getLabel(el));
  }

  function enableReader(on) {
    readerActive = on;
    if (on) {
      document.addEventListener('focusin',   readerFocus);
      document.addEventListener('mouseover', readerHover);
      speak('Lector de pantalla activado. Pasa el cursor o navega con Tab para escuchar.', true);
    } else {
      stopSpeech();
      document.removeEventListener('focusin',   readerFocus);
      document.removeEventListener('mouseover', readerHover);
    }
  }

  if (prefs.readerEnabled) enableReader(true);

  /* ============================================================
     HELPER: LABEL DE ESCALA
  ============================================================ */
  function fontLabel(s) {
    const pct = 100 + s * 10;
    return s === 0 ? 'Normal (100%)' : (s > 0 ? '+' : '') + s * 10 + '% (' + pct + '%)';
  }

  /* ============================================================
     CONSTRUIR EL PANEL
  ============================================================ */
  function buildToggle(id, action, active) {
    return `<button id="${id}" class="a11y-toggle${active ? ' is-active' : ''}"
      aria-pressed="${active}" data-action="${action}">
      <span class="a11y-toggle-track" aria-hidden="true"></span>
      <span class="a11y-toggle-label">${active ? 'Activado' : 'Desactivado'}</span>
    </button>`;
  }

  function buildPanel() {
    /* --- FAB --- */
    const fab = document.createElement('button');
    fab.id = 'a11y-fab';
    fab.className = 'a11y-fab';
    fab.setAttribute('aria-label', 'Abrir panel de accesibilidad');
    fab.setAttribute('aria-controls', 'a11y-panel');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = `
      <svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="4" r="1.5"/>
        <path d="M9 9h6m-3 0v6m-3 0-2 5m8-5 2 5m-10-9-3 1m14-1 3 1"/>
      </svg>
      <span class="a11y-fab-label">Accesibilidad</span>`;

    /* --- PANEL --- */
    const panel = document.createElement('div');
    panel.id = 'a11y-panel';
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Panel de accesibilidad');
    panel.setAttribute('aria-modal', 'false');
    panel.hidden = true;

    const contrasts = [
      { key: 'normal', icon: '☀️', label: 'Normal' },
      { key: 'high',   icon: '⬛', label: 'Alto contraste' },
      { key: 'dark',   icon: '🌙', label: 'Modo oscuro' },
      { key: 'invert', icon: '🔄', label: 'Invertido' },
    ];

    panel.innerHTML = `
      <div class="a11y-panel-header">
        <span class="a11y-panel-title">
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="4" r="1.5"/>
            <path d="M9 9h6m-3 0v6m-3 0-2 5m8-5 2 5m-10-9-3 1m14-1 3 1"/>
          </svg>
          Accesibilidad
        </span>
        <button class="a11y-panel-close" id="a11y-close" aria-label="Cerrar panel de accesibilidad">
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- LECTOR DE PANTALLA -->
      <section class="a11y-section" aria-labelledby="lbl-reader">
        <h3 id="lbl-reader" class="a11y-section-title">
          <span aria-hidden="true">🔊</span> Lector de pantalla
        </h3>
        <p class="a11y-desc">Lee en voz alta el elemento sobre el que navegues con Tab o el cursor.</p>
        ${buildToggle('btn-reader', 'reader', prefs.readerEnabled)}
      </section>

      <!-- TAMAÑO DE FUENTE -->
      <section class="a11y-section" aria-labelledby="lbl-font">
        <h3 id="lbl-font" class="a11y-section-title">
          <span aria-hidden="true">🔤</span> Tamaño de texto
        </h3>
        <div class="a11y-font-row" role="group" aria-labelledby="lbl-font">
          <button id="btn-font-dec" class="a11y-stepper" data-action="font-dec"
            aria-label="Reducir tamaño de texto" ${prefs.fontScale <= -2 ? 'disabled' : ''}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="3">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <span id="font-val" class="a11y-font-val" aria-live="polite" aria-atomic="true">
            ${fontLabel(prefs.fontScale)}
          </span>
          <button id="btn-font-inc" class="a11y-stepper" data-action="font-inc"
            aria-label="Aumentar tamaño de texto" ${prefs.fontScale >= 2 ? 'disabled' : ''}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </section>

      <!-- CONTRASTE -->
      <section class="a11y-section" aria-labelledby="lbl-contrast">
        <h3 id="lbl-contrast" class="a11y-section-title">
          <span aria-hidden="true">🎨</span> Modo de contraste
        </h3>
        <div class="a11y-contrast-grid" role="group" aria-labelledby="lbl-contrast">
          ${contrasts.map(m => `
            <button class="a11y-contrast-btn${prefs.contrast === m.key ? ' is-active' : ''}"
              aria-pressed="${prefs.contrast === m.key}"
              data-action="contrast" data-value="${m.key}"
              aria-label="Contraste ${m.label}">
              <span aria-hidden="true" class="a11y-contrast-icon">${m.icon}</span>
              <span>${m.label}</span>
            </button>`).join('')}
        </div>
      </section>

      <!-- ESPACIADO -->
      <section class="a11y-section" aria-labelledby="lbl-spacing">
        <h3 id="lbl-spacing" class="a11y-section-title">
          <span aria-hidden="true">↕</span> Espaciado ampliado
        </h3>
        <p class="a11y-desc">Aumenta el interlineado y el espacio entre párrafos.</p>
        ${buildToggle('btn-spacing', 'spacing', prefs.spacing)}
      </section>

      <!-- FUENTE DISLEXIA -->
      <section class="a11y-section" aria-labelledby="lbl-dyslexia">
        <h3 id="lbl-dyslexia" class="a11y-section-title">
          <span aria-hidden="true">📖</span> Fuente para dislexia
        </h3>
        <p class="a11y-desc">Activa una tipografía diseñada para facilitar la lectura.</p>
        ${buildToggle('btn-dyslexia', 'dyslexia', prefs.dyslexia)}
      </section>

      <!-- RESALTAR ENLACES -->
      <section class="a11y-section" aria-labelledby="lbl-links">
        <h3 id="lbl-links" class="a11y-section-title">
          <span aria-hidden="true">🔗</span> Resaltar enlaces
        </h3>
        <p class="a11y-desc">Subraya y destaca visualmente todos los enlaces.</p>
        ${buildToggle('btn-links', 'links', prefs.highlightLinks)}
      </section>

      <!-- CURSOR GRANDE -->
      <section class="a11y-section" aria-labelledby="lbl-cursor">
        <h3 id="lbl-cursor" class="a11y-section-title">
          <span aria-hidden="true">🖱️</span> Cursor grande
        </h3>
        <p class="a11y-desc">Amplía el puntero del ratón para mayor visibilidad.</p>
        ${buildToggle('btn-cursor', 'cursor', prefs.bigCursor)}
      </section>

      <!-- RESTABLECER -->
      <div class="a11y-panel-footer">
        <button id="btn-reset" class="a11y-btn-reset" data-action="reset">
          ↺ Restablecer configuración
        </button>
      </div>`;

    document.body.appendChild(fab);
    document.body.appendChild(panel);
    return { fab, panel };
  }

  /* ============================================================
     INICIALIZAR PANEL
  ============================================================ */
  const elems = buildPanel();
  let panelOpen = false;

  function openPanel() {
    panelOpen = true;
    elems.panel.hidden = false;
    elems.fab.setAttribute('aria-expanded', 'true');
    elems.fab.setAttribute('aria-label', 'Cerrar panel de accesibilidad');
    requestAnimationFrame(() => elems.panel.classList.add('is-open'));
    const first = elems.panel.querySelector('button');
    if (first) first.focus();
  }
  function closePanel() {
    panelOpen = false;
    elems.panel.classList.remove('is-open');
    elems.fab.setAttribute('aria-expanded', 'false');
    elems.fab.setAttribute('aria-label', 'Abrir panel de accesibilidad');
    elems.panel.addEventListener('transitionend', function h() {
      elems.panel.hidden = true;
      elems.panel.removeEventListener('transitionend', h);
    });
    elems.fab.focus();
  }

  elems.fab.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panelOpen) closePanel(); });

  /* ============================================================
     DELEGACIÓN DE EVENTOS DEL PANEL
  ============================================================ */
  elems.panel.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action], #a11y-close');
    if (!btn) return;

    if (btn.id === 'a11y-close') { closePanel(); return; }

    const action = btn.dataset.action;

    if (action === 'reader') {
      prefs.readerEnabled = !prefs.readerEnabled;
      btn.classList.toggle('is-active', prefs.readerEnabled);
      btn.setAttribute('aria-pressed', prefs.readerEnabled);
      btn.querySelector('.a11y-toggle-label').textContent = prefs.readerEnabled ? 'Activado' : 'Desactivado';
      enableReader(prefs.readerEnabled);

    } else if (action === 'font-inc') {
      if (prefs.fontScale >= 2) return;
      prefs.fontScale++;
      applyFontScale(prefs.fontScale);
      updateFontUI();

    } else if (action === 'font-dec') {
      if (prefs.fontScale <= -2) return;
      prefs.fontScale--;
      applyFontScale(prefs.fontScale);
      updateFontUI();

    } else if (action === 'contrast') {
      prefs.contrast = btn.dataset.value;
      applyContrast(prefs.contrast);
      $$('[data-action="contrast"]', elems.panel).forEach(b => {
        const active = b.dataset.value === prefs.contrast;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active);
      });

    } else if (action === 'spacing') {
      prefs.spacing = !prefs.spacing;
      btn.classList.toggle('is-active', prefs.spacing);
      btn.setAttribute('aria-pressed', prefs.spacing);
      btn.querySelector('.a11y-toggle-label').textContent = prefs.spacing ? 'Activado' : 'Desactivado';
      applySpacing(prefs.spacing);

    } else if (action === 'dyslexia') {
      prefs.dyslexia = !prefs.dyslexia;
      btn.classList.toggle('is-active', prefs.dyslexia);
      btn.setAttribute('aria-pressed', prefs.dyslexia);
      btn.querySelector('.a11y-toggle-label').textContent = prefs.dyslexia ? 'Activado' : 'Desactivado';
      applyDyslexia(prefs.dyslexia);

    } else if (action === 'links') {
      prefs.highlightLinks = !prefs.highlightLinks;
      btn.classList.toggle('is-active', prefs.highlightLinks);
      btn.setAttribute('aria-pressed', prefs.highlightLinks);
      btn.querySelector('.a11y-toggle-label').textContent = prefs.highlightLinks ? 'Activado' : 'Desactivado';
      applyHighlightLinks(prefs.highlightLinks);

    } else if (action === 'cursor') {
      prefs.bigCursor = !prefs.bigCursor;
      btn.classList.toggle('is-active', prefs.bigCursor);
      btn.setAttribute('aria-pressed', prefs.bigCursor);
      btn.querySelector('.a11y-toggle-label').textContent = prefs.bigCursor ? 'Activado' : 'Desactivado';
      applyBigCursor(prefs.bigCursor);

    } else if (action === 'reset') {
      prefs = Object.assign({}, defaults);
      enableReader(false);
      applyAll(prefs);
      savePrefs(prefs);
      elems.panel.remove();
      elems.fab.remove();
      Object.assign(elems, buildPanel());
      elems.fab.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
      panelOpen = false;
      announce('Configuración de accesibilidad restablecida.');
      return;
    }

    savePrefs(prefs);
  });

  function updateFontUI() {
    const inc = $('#btn-font-inc', elems.panel);
    const dec = $('#btn-font-dec', elems.panel);
    const val = $('#font-val',     elems.panel);
    if (inc) inc.disabled = prefs.fontScale >= 2;
    if (dec) dec.disabled = prefs.fontScale <= -2;
    if (val) val.textContent = fontLabel(prefs.fontScale);
  }

  /* ============================================================
     WCAG 4.1.3 — Live regions
  ============================================================ */
  const notificationArea = document.getElementById('notification-area');
  const alertArea        = document.getElementById('alert-area');

  function announce(message, isAlert) {
    const area = isAlert ? alertArea : notificationArea;
    if (!area) return;
    area.textContent = '';
    requestAnimationFrame(() => { area.textContent = message; });
  }

  /* ============================================================
     Carrito
  ============================================================ */
  $$('.btn-add-cart').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const name = btn.closest('article')
        ?.querySelector('.product-name a')?.textContent?.trim() || 'Producto';
      announce(name + ' agregado al carrito.');
      const count = $('.cart-count');
      if (count) {
        const next = (parseInt(count.textContent) || 0) + 1;
        count.textContent = next;
        const cartBtn = $('.btn-cart');
        if (cartBtn) {
          cartBtn.setAttribute('aria-label',
            'Carrito de compras, ' + next + ' artículo' + (next !== 1 ? 's' : ''));
        }
      }
    });
  });

  /* ============================================================
     Menú hamburguesa
  ============================================================ */
  const menuBtn = $('.btn-menu');
  const mainNav = document.getElementById('main-nav');

  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', function() {
      const isOpen = mainNav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      if (isOpen) { const fl = mainNav.querySelector('a'); if (fl) fl.focus(); }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
        menuBtn.focus();
      }
    });
  }

  /* ============================================================
     Skip link
  ============================================================ */
  const mainContent = document.getElementById('main-content');
  if (mainContent && !mainContent.hasAttribute('tabindex')) {
    mainContent.setAttribute('tabindex', '-1');
  }

  /* ============================================================
     Tooltips accesibles
  ============================================================ */
  $$('[data-tooltip]').forEach(function(el) {
    const tt = document.createElement('div');
    tt.setAttribute('role', 'tooltip');
    tt.id = 'tip-' + Math.random().toString(36).slice(2);
    tt.className = 'tooltip-popup';
    tt.textContent = el.dataset.tooltip;
    el.setAttribute('aria-describedby', tt.id);
    document.body.appendChild(tt);
    function show() {
      const r = el.getBoundingClientRect();
      tt.style.top  = (r.bottom + window.scrollY + 6) + 'px';
      tt.style.left = (r.left + window.scrollX) + 'px';
      tt.classList.add('is-visible');
    }
    function hide() { tt.classList.remove('is-visible'); }
    el.addEventListener('mouseenter', show);
    el.addEventListener('focus',      show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('blur',       hide);
    el.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  });

  /* ============================================================
     Tabla scroll hint
  ============================================================ */
  $$('.table-wrapper').forEach(function(wrapper) {
    if (wrapper.scrollWidth > wrapper.clientWidth) {
      const hint = document.createElement('p');
      hint.className = 'table-scroll-hint';
      hint.textContent = 'Desplaza horizontalmente para ver toda la tabla';
      hint.setAttribute('aria-live', 'polite');
      wrapper.parentNode.insertBefore(hint, wrapper);
    }
  });

  /* ============================================================
     Sección activa en nav
  ============================================================ */
  const sections = $$('section[id]');
  const navLinks  = $$('.nav-list a[href^="#"]');
  if (sections.length && navLinks.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          if (link.getAttribute('href').slice(1) === entry.target.id) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    }, { threshold: 0.5 });
    sections.forEach(s => obs.observe(s));
  }

})();