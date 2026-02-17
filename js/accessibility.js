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