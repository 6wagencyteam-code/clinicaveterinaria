/* ==========================================================================
   6W LAB — comportamiento del tema
   JavaScript propio, sin librerías. Cada componente es independiente:
   si uno falla, el resto de la página sigue funcionando.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const money = (cents) => {
    const format = window.SHOP?.moneyFormat || '${{amount}}';
    const amount = (cents / 100).toLocaleString(window.SHOP?.locale || 'es-CL', {
      minimumFractionDigits: format.includes('no_decimals') ? 0 : 2,
      maximumFractionDigits: format.includes('no_decimals') ? 0 : 2,
    });
    return format.replace(/\{\{\s*amount[^}]*\}\}/, amount);
  };

  /* ------------------------------------------------------- Menú móvil */

  const initNav = () => {
    const toggle = $('[data-nav-toggle]');
    const panel = $('[data-mobile-nav]');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
      const open = panel.hasAttribute('hidden');
      panel.toggleAttribute('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  };

  /* ------------------------------------------------- Cajón del carrito */

  const cartDrawer = {
    el: null,

    init() {
      this.el = $('[data-cart-drawer]');
      if (!this.el) return;

      $$('[data-cart-open]').forEach((btn) =>
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        })
      );

      this.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-cart-close]')) this.close();
        // Clic fuera del contenido cierra el cajón
        if (e.target === this.el) this.close();
      });

      this.el.addEventListener('change', (e) => {
        const input = e.target.closest('[data-line-qty]');
        if (input) this.updateLine(input.dataset.lineKey, input.value);
      });

      this.el.addEventListener('click', (e) => {
        const remove = e.target.closest('[data-line-remove]');
        if (remove) {
          e.preventDefault();
          this.updateLine(remove.dataset.lineKey, 0);
        }
      });
    },

    open() {
      if (!this.el) return;
      this.el.showModal();
      document.body.style.overflow = 'hidden';
    },

    close() {
      if (!this.el) return;
      this.el.close();
      document.body.style.overflow = '';
    },

    async updateLine(key, quantity) {
      this.el.setAttribute('aria-busy', 'true');
      try {
        const res = await fetch(`${window.SHOP.routes.cartChange}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity: Number(quantity) }),
        });
        if (!res.ok) throw new Error('cart');
        await this.refresh();
      } catch (err) {
        window.location.href = window.SHOP.routes.cart;
      } finally {
        this.el.removeAttribute('aria-busy');
      }
    },

    /* Vuelve a pedir el cajón renderizado por Shopify y reemplaza su contenido */
    async refresh() {
      const res = await fetch(`${window.SHOP.routes.cart}?section_id=cart-drawer`);
      const html = await res.text();
      const fresh = new DOMParser().parseFromString(html, 'text/html');
      const next = $('[data-cart-drawer-inner]', fresh);
      const current = $('[data-cart-drawer-inner]', this.el);
      if (next && current) current.replaceWith(next);
      this.syncCount();
    },

    async syncCount() {
      try {
        const res = await fetch(`${window.SHOP.routes.cart}.js`);
        const cart = await res.json();
        $$('[data-cart-count]').forEach((el) => {
          el.textContent = cart.item_count;
          el.toggleAttribute('hidden', cart.item_count === 0);
        });
      } catch (err) {
        /* Si falla, el número simplemente no se actualiza. */
      }
    },
  };

  /* ------------------------------------------- Agregar al carrito (AJAX) */

  const initAddToCart = () => {
    $$('[data-product-form]').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = $('[type="submit"]', form);
        const errorBox = $('[data-form-error]', form);
        const original = button?.textContent;

        if (button) {
          button.setAttribute('aria-disabled', 'true');
          button.textContent = window.SHOP.strings.adding;
        }
        if (errorBox) errorBox.hidden = true;

        try {
          const res = await fetch(`${window.SHOP.routes.cartAdd}.js`, {
            method: 'POST',
            body: new FormData(form),
          });
          const data = await res.json();

          if (!res.ok) throw new Error(data.description || data.message);

          await cartDrawer.refresh();
          cartDrawer.open();
        } catch (err) {
          if (errorBox) {
            errorBox.textContent = err.message || window.SHOP.strings.error;
            errorBox.hidden = false;
          }
        } finally {
          if (button) {
            button.removeAttribute('aria-disabled');
            button.textContent = original;
          }
        }
      });
    });
  };

  /* ------------------------------------------------------ Cantidad +/- */

  const initQuantity = () => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-qty-step]');
      if (!btn) return;
      const input = $('input', btn.parentElement);
      if (!input) return;
      const step = Number(btn.dataset.qtyStep);
      const min = Number(input.min || 1);
      input.value = Math.max(min, Number(input.value || min) + step);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };

  /* --------------------------------------------------- Selector de variantes */

  const initVariants = () => {
    $$('[data-variant-picker]').forEach((picker) => {
      const form = picker.closest('form') || document;
      const variants = JSON.parse($('[data-variant-data]', picker).textContent);
      const idInput = $('[data-variant-id]', form);
      const priceBox = $('[data-variant-price]', form);
      const submit = $('[type="submit"]', form);

      const update = () => {
        const chosen = $$('input:checked', picker).map((i) => i.value);
        const match = variants.find((v) =>
          v.options.every((opt, i) => opt === chosen[i])
        );

        if (idInput) idInput.value = match ? match.id : '';

        if (submit) {
          const unavailable = !match || !match.available;
          submit.toggleAttribute('disabled', unavailable);
          submit.textContent = !match
            ? window.SHOP.strings.unavailable
            : match.available
            ? window.SHOP.strings.addToCart
            : window.SHOP.strings.soldOut;
        }

        if (priceBox && match) {
          priceBox.innerHTML = match.compare_at_price > match.price
            ? `<ins>${money(match.price)}</ins> <del>${money(match.compare_at_price)}</del>`
            : money(match.price);
        }

        // Refleja la variante en la URL sin recargar
        if (match && window.history.replaceState) {
          const url = new URL(window.location);
          url.searchParams.set('variant', match.id);
          window.history.replaceState({}, '', url);
        }
      };

      picker.addEventListener('change', update);
      update();
    });
  };

  /* ------------------------------------------------------ Galería producto */

  const initGallery = () => {
    $$('[data-gallery]').forEach((gallery) => {
      const main = $('.gallery-main', gallery);
      if (!main) return;
      $$('[data-gallery-thumb]', gallery).forEach((thumb) => {
        thumb.addEventListener('click', () => {
          main.src = thumb.dataset.full || thumb.src;
          main.srcset = thumb.dataset.fullSrcset || '';
          $$('[data-gallery-thumb]', gallery).forEach((t) =>
            t.setAttribute('aria-current', String(t === thumb))
          );
        });
      });
    });
  };

  /* ------------------------------------------------------- Marquesina */

  const initMarquee = () => {
    $$('[data-marquee]').forEach((track) => {
      // Duplica el contenido para que el bucle no tenga saltos
      track.innerHTML += track.innerHTML;
    });
  };

  /* ------------------------------------ Aparición suave al hacer scroll */

  const initReveal = () => {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const items = $$('[data-reveal]');
    if (!items.length) return;

    items.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
      el.style.transition = 'opacity .5s var(--ease, ease), transform .5s var(--ease, ease)';
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = '';
        entry.target.style.transform = '';
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));
  };

  /* ------------------------------------------------------------- Arranque */

  const start = () => {
    initNav();
    cartDrawer.init();
    initAddToCart();
    initQuantity();
    initVariants();
    initGallery();
    initMarquee();
    initReveal();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // El editor de temas recarga secciones sueltas: hay que reconectarlas
  document.addEventListener('shopify:section:load', start);

  window.SixWLab = { cartDrawer, money };
})();
