/* ============================================================
   ZEE'S BOXING GEAR — theme.js  (production)
   ============================================================ */
'use strict';

(function () {

  /* ── Tiny helpers ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  /* ── Format money ── */
  function money(cents) {
    return '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ────────────────────────────────────────────────────────────
     TOAST NOTIFICATIONS
  ──────────────────────────────────────────────────────────── */
  const toastEl = $('#zbg-toast');

  function toast(msg, type = 'success', duration = 3500) {
    if (!toastEl) return;
    toastEl.innerHTML = `<span class="zbg-toast__inner zbg-toast__inner--${type}">${msg}</span>`;
    toastEl.classList.add('is-visible');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, duration);
  }

  /* ────────────────────────────────────────────────────────────
     ANNOUNCEMENT BAR — hide on scroll down (mobile)
  ──────────────────────────────────────────────────────────── */
  const topbar = $('.topbar');
  if (topbar) {
    let lastY = 0, ticking = false;
    on(window, 'scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (window.innerWidth < 901) {
          const y = window.scrollY;
          topbar.classList.toggle('is-hidden', y > lastY && y > 80);
          lastY = y;
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ────────────────────────────────────────────────────────────
     HEADER — sticky shadow
  ──────────────────────────────────────────────────────────── */
  const header = $('.site-header');
  if (header) {
    on(window, 'scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 4);
    }, { passive: true });
  }

  /* ────────────────────────────────────────────────────────────
     SEARCH OVERLAY
  ──────────────────────────────────────────────────────────── */
  const searchToggle = $('#search-toggle');
  const searchClose  = $('#search-close');
  const headerSearch = $('#header-search');
  const searchInput  = $('#header-search-input');

  function openSearch() {
    if (!headerSearch) return;
    headerSearch.classList.add('is-open');
    headerSearch.setAttribute('aria-hidden', 'false');
    searchToggle?.setAttribute('aria-expanded', 'true');
    setTimeout(() => searchInput?.focus(), 260);
  }
  function closeSearch() {
    if (!headerSearch) return;
    headerSearch.classList.remove('is-open');
    headerSearch.setAttribute('aria-hidden', 'true');
    searchToggle?.setAttribute('aria-expanded', 'false');
  }

  on(searchToggle, 'click', (e) => {
    e.preventDefault();
    headerSearch?.classList.contains('is-open') ? closeSearch() : openSearch();
  });
  on(searchClose, 'click', closeSearch);
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      if (headerSearch?.classList.contains('is-open')) closeSearch();
    }
  });

  /* ────────────────────────────────────────────────────────────
     MOBILE NAVIGATION
  ──────────────────────────────────────────────────────────── */
  const mobileToggle = $('#mobile-menu-toggle');
  const mobileNav    = $('#mobile-nav');

  function closeMobileNav() {
    mobileNav?.classList.remove('is-open');
    mobileToggle?.classList.remove('is-open');
    mobileToggle?.setAttribute('aria-expanded', 'false');
    mobileNav?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (mobileToggle && mobileNav) {
    on(mobileToggle, 'click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      mobileToggle.classList.toggle('is-open', isOpen);
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    on(document, 'click', (e) => {
      if (mobileNav.classList.contains('is-open') &&
          !mobileNav.contains(e.target) &&
          !mobileToggle.contains(e.target)) closeMobileNav();
    });
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  /* ────────────────────────────────────────────────────────────
     CART DRAWER
  ──────────────────────────────────────────────────────────── */
  const cartDrawer  = $('#cart-drawer');
  const cartBody    = $('#cart-drawer-body');
  const cartFooter  = $('#cart-drawer-footer');
  const cartLoading = $('#cart-drawer-loading');
  const cartCountEl = $('#cart-count');

  function setCartCount(n) {
    if (!cartCountEl) return;
    cartCountEl.textContent = n;
    cartCountEl.dataset.count = n;
    cartCountEl.classList.remove('is-bump');
    void cartCountEl.offsetWidth;
    cartCountEl.classList.add('is-bump');
    cartCountEl.addEventListener('animationend', () =>
      cartCountEl.classList.remove('is-bump'), { once: true });
  }

  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    refreshCart();
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  on($('.cart-drawer__close'), 'click', closeCart);
  on($('.cart-drawer__overlay'), 'click', closeCart);
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer?.getAttribute('aria-hidden') === 'false') closeCart();
  });
  on($('#cart-toggle'), 'click', openCart);

  async function refreshCart() {
    if (cartLoading) cartLoading.style.display = 'flex';
    try {
      const res = await fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } });
      const cart = await res.json();
      renderCart(cart);
      setCartCount(cart.item_count);
    } catch (err) {
      console.error('[Cart]', err);
    } finally {
      if (cartLoading) cartLoading.style.display = 'none';
    }
  }

  function renderCart(cart) {
    if (!cartBody || !cartFooter) return;

    if (cart.item_count === 0) {
      cartBody.innerHTML = `
        <div class="cd-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p>Your cart is empty.</p>
          <a href="/collections/all" class="cd-empty__btn">START SHOPPING</a>
        </div>`;
      cartFooter.innerHTML = '';
      return;
    }

    cartBody.innerHTML = cart.items.map(item => `
      <div class="cd-item" data-key="${item.key}">
        <div class="cd-item__img-wrap">
          ${item.image
            ? `<img class="cd-item__img" src="${item.image.replace(/(\.\w+)$/, '_120x120$1')}" alt="${escHtml(item.title)}" width="80" height="80" loading="lazy">`
            : `<div class="cd-item__img-ph"></div>`}
        </div>
        <div class="cd-item__info">
          <p class="cd-item__name">${escHtml(item.product_title)}</p>
          ${item.variant_title && item.variant_title !== 'Default Title'
            ? `<p class="cd-item__variant">${escHtml(item.variant_title)}</p>` : ''}
          <p class="cd-item__price">${money(item.final_line_price)}</p>
          <div class="cd-item__actions">
            <div class="cd-qty">
              <button class="cd-qty__btn" data-cd-minus data-key="${item.key}" aria-label="Decrease">−</button>
              <span class="cd-qty__val">${item.quantity}</span>
              <button class="cd-qty__btn" data-cd-plus data-key="${item.key}" aria-label="Increase">+</button>
            </div>
            <button class="cd-item__remove" data-cd-remove="${item.key}">Remove</button>
          </div>
        </div>
      </div>`).join('');

    cartFooter.innerHTML = `
      <div class="cd-footer">
        <div class="cd-subtotal">
          <span class="cd-subtotal__label">SUBTOTAL</span>
          <span class="cd-subtotal__val">${money(cart.total_price)}</span>
        </div>
        <p class="cd-footer__note">Taxes &amp; shipping calculated at checkout</p>
        <a href="/checkout" class="cd-checkout-btn">
          CHECKOUT
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a href="/cart" class="cd-cart-link">View full cart</a>
      </div>`;

    // Wire qty buttons
    $$('[data-cd-minus]', cartBody).forEach(btn =>
      on(btn, 'click', () => updateCartQty(btn.dataset.key, -1)));
    $$('[data-cd-plus]', cartBody).forEach(btn =>
      on(btn, 'click', () => updateCartQty(btn.dataset.key, +1)));
    $$('[data-cd-remove]', cartBody).forEach(btn =>
      on(btn, 'click', () => changeCartItem(btn.dataset.cdRemove, 0)));
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function cartPost(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Cart request failed: ${res.status}`);
    return res.json();
  }

  async function addToCart(variantId, qty = 1, btn = null) {
    const orig = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    try {
      await cartPost('/cart/add.js', { id: Number(variantId), quantity: qty });
      await refreshCart();
      openCart();
      toast('Added to cart!');
    } catch (err) {
      console.error('[ATC]', err);
      toast('Could not add to cart. Please try again.', 'error');
    } finally {
      if (btn && orig) { btn.disabled = false; btn.innerHTML = orig; }
    }
  }

  async function changeCartItem(key, qty) {
    try {
      await cartPost('/cart/change.js', { id: key, quantity: qty });
      await refreshCart();
    } catch (err) {
      console.error('[Cart change]', err);
    }
  }

  async function updateCartQty(key, delta) {
    // Find current qty from DOM
    const item = $(`[data-key="${key}"]`, cartBody);
    const valEl = item ? $('.cd-qty__val', item) : null;
    const current = valEl ? parseInt(valEl.textContent, 10) : 1;
    const newQty = Math.max(0, current + delta);
    await changeCartItem(key, newQty);
  }

  /* ── ATC intercept: product card forms ── */
  on(document, 'submit', async (e) => {
    const form = e.target.closest('form[action="/cart/add"]');
    if (!form) return;
    e.preventDefault();
    const id = form.querySelector('input[name="id"]')?.value;
    const qty = parseInt(form.querySelector('input[name="quantity"]')?.value || '1', 10);
    const btn = form.querySelector('button[type="submit"]');
    if (id) addToCart(id, qty, btn);
  });

  /* ── ATC: data-atc attribute ── */
  on(document, 'click', (e) => {
    const btn = e.target.closest('[data-atc]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.atc;
    if (id) addToCart(id, 1, btn);
  });

  /* ────────────────────────────────────────────────────────────
     CART PAGE — qty controls
  ──────────────────────────────────────────────────────────── */
  const cartPage = $('.cart-pg');
  if (cartPage) {
    async function cartPageChange(key, qty) {
      try {
        const res = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity: qty })
        });
        const cart = await res.json();
        setCartCount(cart.item_count);
        // Reload to update line prices & total
        window.location.reload();
      } catch (err) {
        console.error('[Cart page]', err);
      }
    }

    on(cartPage, 'click', (e) => {
      const downBtn = e.target.closest('[data-qty-down]');
      const upBtn   = e.target.closest('[data-qty-up]');
      if (downBtn || upBtn) {
        const key   = (downBtn || upBtn).dataset.key;
        const input = cartPage.querySelector(`[data-qty-input][data-key="${key}"]`);
        if (!input) return;
        const curr = parseInt(input.value, 10) || 1;
        const next = downBtn ? Math.max(0, curr - 1) : curr + 1;
        input.value = next;
        cartPageChange(key, next);
      }
    });

    on(cartPage, 'change', (e) => {
      const input = e.target.closest('[data-qty-input]');
      if (!input) return;
      const key = input.dataset.key;
      const qty = Math.max(0, parseInt(input.value, 10) || 0);
      cartPageChange(key, qty);
    });
  }

  /* ────────────────────────────────────────────────────────────
     PRODUCT DETAIL PAGE
  ──────────────────────────────────────────────────────────── */
  const pdpForm = $('#pdp-form');
  const pdpJsonEl = $('#product-json');

  if (pdpForm && pdpJsonEl) {
    let productData;
    try { productData = JSON.parse(pdpJsonEl.textContent); } catch(e) {}
    if (!productData) return;

    let selectedOptions = productData.variants[0]
      ? [...(productData.variants.find(v => v.id === parseInt($('#pdp-variant-id')?.value))?.options || productData.variants[0].options)]
      : [];

    function findVariant() {
      return productData.variants.find(v =>
        v.options.every((opt, i) => selectedOptions[i] === opt));
    }

    function applyVariant(variant) {
      if (!variant) return;
      const vidEl  = $('#pdp-variant-id');
      const atcBtn = $('#pdp-atc');
      const priceEl = $('#pdp-price-display');
      if (vidEl)  vidEl.value = variant.id;
      if (atcBtn) {
        atcBtn.disabled   = !variant.available;
        atcBtn.textContent = variant.available ? 'ADD TO CART' : 'SOLD OUT';
      }
      if (priceEl) priceEl.textContent = money(variant.price);
      if (variant.featured_image?.src) {
        const mainImg = $('#pdp-main-img');
        if (mainImg) {
          mainImg.src = variant.featured_image.src;
        }
      }
    }

    // Variant option buttons
    $$('.pdp__opt-btn').forEach(btn => {
      on(btn, 'click', () => {
        const optIdx = parseInt(btn.dataset.option, 10);
        selectedOptions[optIdx] = btn.dataset.value;

        $$(`[data-option="${optIdx}"]`).forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');

        const label = $(`#pdp-opt-val-${optIdx}`);
        if (label) label.textContent = btn.dataset.value;

        applyVariant(findVariant());
      });
    });

    // Gallery thumbnails
    $$('.pdp__thumb').forEach(thumb => {
      on(thumb, 'click', () => {
        $$('.pdp__thumb').forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
        const mainImg = $('#pdp-main-img');
        if (mainImg && thumb.dataset.src) mainImg.src = thumb.dataset.src;
      });
    });

    // Qty controls
    const pdpQty   = $('#pdp-qty');
    const pdpMinus = $('#pdp-qty-minus');
    const pdpPlus  = $('#pdp-qty-plus');
    on(pdpMinus, 'click', () => {
      const v = parseInt(pdpQty?.value, 10) || 1;
      if (pdpQty && v > 1) pdpQty.value = v - 1;
    });
    on(pdpPlus, 'click', () => {
      if (pdpQty) pdpQty.value = (parseInt(pdpQty.value, 10) || 1) + 1;
    });

    // Form submit → AJAX add to cart
    on(pdpForm, 'submit', async (e) => {
      e.preventDefault();
      const variantId = $('#pdp-variant-id')?.value;
      const qty = parseInt($('#pdp-qty')?.value, 10) || 1;
      const atcBtn = $('#pdp-atc');
      if (!variantId) return;
      await addToCart(variantId, qty, atcBtn);
    });
  }

  /* ────────────────────────────────────────────────────────────
     COLLECTION SORT
  ──────────────────────────────────────────────────────────── */
  const colSort = $('#col-sort');
  if (colSort) {
    on(colSort, 'change', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', colSort.value);
      window.location.href = url.toString();
    });
  }

  /* ────────────────────────────────────────────────────────────
     FAQ ACCORDION (fallback for server-rendered pages)
  ──────────────────────────────────────────────────────────── */
  $$('.faq-item').forEach(item => {
    const btn = $('.faq-question', item);
    if (!btn) return;
    on(btn, 'click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      $$('.faq-item').forEach(it => {
        $('.faq-question', it)?.setAttribute('aria-expanded', 'false');
        it.classList.remove('is-open');
      });
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        item.classList.add('is-open');
      }
    });
  });

  /* ────────────────────────────────────────────────────────────
     FLASH MESSAGES — auto-dismiss after 6s
  ──────────────────────────────────────────────────────────── */
  $$('.flash-message, .auth-alert, .cfaq__success').forEach(msg => {
    setTimeout(() => {
      msg.style.transition = 'opacity 0.4s';
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 400);
    }, 6000);
  });

  /* ────────────────────────────────────────────────────────────
     LOAD — refresh cart count from /cart.js on page load
  ──────────────────────────────────────────────────────────── */
  (async () => {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      setCartCount(cart.item_count);
    } catch (e) { /* silent */ }
  })();

})();
