/* ============================================================
   ZEE'S BOXING GEAR — Theme JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ── */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Topbar: hide on scroll down (mobile only) ── */
  const topbar = qs('.topbar');
  if (topbar) {
    let lastY = 0;
    window.addEventListener('scroll', () => {
      if (window.innerWidth >= 901) return;
      const y = window.scrollY;
      if (y > lastY && y > 80) {
        topbar.classList.add('is-hidden');
      } else {
        topbar.classList.remove('is-hidden');
      }
      lastY = y;
    }, { passive: true });
  }

  /* ================================================================
     1. SEARCH OVERLAY
  ================================================================ */
  const searchToggle = qs('#search-toggle');
  const searchClose = qs('#search-close');
  const headerSearch = qs('#header-search');
  const searchInput = qs('#header-search-input');

  function openSearch() {
    if (!headerSearch) return;
    headerSearch.classList.add('is-open');
    headerSearch.setAttribute('aria-hidden', 'false');
    searchToggle && searchToggle.setAttribute('aria-expanded', 'true');
    setTimeout(() => searchInput && searchInput.focus(), 280);
  }

  function closeSearch() {
    if (!headerSearch) return;
    headerSearch.classList.remove('is-open');
    headerSearch.setAttribute('aria-hidden', 'true');
    searchToggle && searchToggle.setAttribute('aria-expanded', 'false');
  }

  if (searchToggle) {
    searchToggle.addEventListener('click', (e) => {
      e.preventDefault();
      headerSearch.classList.contains('is-open') ? closeSearch() : openSearch();
    });
  }
  if (searchClose) {
    searchClose.addEventListener('click', closeSearch);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && headerSearch && headerSearch.classList.contains('is-open')) {
      closeSearch();
    }
  });

  /* ================================================================
     2. MOBILE NAVIGATION
  ================================================================ */
  const mobileToggle = qs('#mobile-menu-toggle');
  const mobileNav = qs('#mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      mobileToggle.classList.toggle('is-open', isOpen);
      mobileToggle.setAttribute('aria-expanded', isOpen);
      mobileNav.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        mobileNav.classList.contains('is-open') &&
        !mobileNav.contains(e.target) &&
        !mobileToggle.contains(e.target)
      ) {
        mobileNav.classList.remove('is-open');
        mobileToggle.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        mobileToggle.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

  /* ================================================================
     2. CART DRAWER
  ================================================================ */
  const cartDrawer = qs('#cart-drawer');
  const cartToggle = qs('#cart-toggle');
  const cartClose = qs('.cart-drawer__close');
  const cartOverlay = qs('.cart-drawer__overlay');
  const cartBody = qs('#cart-drawer-body');
  const cartFooter = qs('#cart-drawer-footer');
  const cartCountEl = qs('#cart-count');

  function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    fetchCart();
  }

  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateCartCount(count) {
    if (!cartCountEl) return;
    cartCountEl.textContent = count;
    cartCountEl.dataset.count = count;
    // Pulse animation on update
    cartCountEl.classList.remove('is-updated');
    void cartCountEl.offsetWidth; // reflow
    cartCountEl.classList.add('is-updated');
    cartCountEl.addEventListener('animationend', () => cartCountEl.classList.remove('is-updated'), { once: true });
  }

  async function fetchCart() {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      renderCartDrawer(cart);
      updateCartCount(cart.item_count);
    } catch (err) {
      console.error('Cart fetch error:', err);
    }
  }

  function renderCartDrawer(cart) {
    if (!cartBody || !cartFooter) return;

    if (cart.item_count === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <svg class="cart-empty__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7AAACE" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <p class="cart-empty__text">Your cart is empty.</p>
          <a href="/collections/all" class="btn btn--primary btn--sm">Shop Now</a>
        </div>
      `;
      cartFooter.innerHTML = '';
      return;
    }

    const itemsHtml = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <img
          class="cart-item__img"
          src="${item.image ? item.image.replace(/(\.[a-z]+)$/, '_80x80$1') : ''}"
          alt="${item.title}"
          width="72"
          height="72"
          loading="lazy"
        >
        <div class="cart-item__details">
          <div class="cart-item__title">${item.product_title}</div>
          ${item.variant_title && item.variant_title !== 'Default Title'
            ? `<div class="cart-item__variant">${item.variant_title}</div>`
            : ''}
          <div class="cart-item__price">${formatMoney(item.final_line_price)}</div>
          <button class="cart-item__remove" data-remove-key="${item.key}">Remove</button>
        </div>
      </div>
    `).join('');

    cartBody.innerHTML = itemsHtml;
    cartFooter.innerHTML = `
      <div class="cart-subtotal">
        <span class="cart-subtotal__label">Subtotal</span>
        <span class="cart-subtotal__amount">${formatMoney(cart.total_price)}</span>
      </div>
      <p style="font-size:0.78rem; color:#888; margin-bottom:1rem;">Taxes and shipping at checkout.</p>
      <a href="/checkout" class="btn btn--primary btn--full" style="margin-bottom:0.5rem;">Checkout</a>
      <a href="/cart" class="btn btn--secondary btn--full btn--sm">View Cart</a>
    `;

    // Remove item handlers
    qsa('[data-remove-key]', cartFooter.parentElement).forEach(btn => {
      btn.addEventListener('click', () => removeCartItem(btn.dataset.removeKey));
    });
  }

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  async function addToCart(variantId, quantity = 1) {
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity }),
      });
      if (!res.ok) throw new Error('Add to cart failed');
      openCartDrawer();
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Could not add item to cart. Please try again.');
    }
  }

  async function removeCartItem(key) {
    try {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: 0 }),
      });
      fetchCart();
    } catch (err) {
      console.error('Remove item error:', err);
    }
  }

  if (cartToggle) cartToggle.addEventListener('click', openCartDrawer);
  if (cartClose) cartClose.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  // Add to Cart buttons on collection/homepage
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-atc]');
    if (!btn) return;
    e.preventDefault();
    const variantId = btn.dataset.productId;
    if (!variantId) return;
    btn.textContent = 'Adding...';
    btn.disabled = true;
    addToCart(variantId).finally(() => {
      btn.textContent = 'Add to Cart';
      btn.disabled = false;
    });
  });

  /* ================================================================
     3. PRODUCT PAGE
  ================================================================ */
  const productForm = qs('#product-form');
  const productJsonEl = qs('#product-json');

  if (productForm && productJsonEl) {
    const product = JSON.parse(productJsonEl.textContent);
    let selectedOptions = product.variants[0]?.options?.map(() => null) || [];

    // Initialise selected options from current variant
    const currentVariantId = parseInt(qs('#variant-id')?.value);
    const currentVariant = product.variants.find(v => v.id === currentVariantId);
    if (currentVariant) {
      selectedOptions = [...currentVariant.options];
    }

    // Variant buttons
    qsa('[data-option]').forEach(btn => {
      btn.addEventListener('click', () => {
        const optIdx = parseInt(btn.dataset.option);
        selectedOptions[optIdx] = btn.dataset.value;

        // Update active state for this option group
        qsa(`[data-option="${optIdx}"]`).forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');

        // Update label
        const label = qs(`#option-selected-${optIdx}`);
        if (label) label.textContent = btn.dataset.value;

        // Find matching variant
        const matched = product.variants.find(v =>
          v.options.every((opt, i) => selectedOptions[i] === null || opt === selectedOptions[i])
        );

        if (matched) {
          // Update hidden input
          const variantInput = qs('#variant-id');
          if (variantInput) variantInput.value = matched.id;

          // Update price
          updateProductPrice(matched);

          // Update ATC button
          const atcBtn = qs('#atc-btn');
          if (atcBtn) {
            atcBtn.disabled = !matched.available;
            atcBtn.textContent = matched.available ? 'Add to Cart' : 'Sold Out';
          }

          // Update gallery if variant has image
          if (matched.featured_image) {
            setMainImage(matched.featured_image.src);
          }
        }
      });
    });

    function updateProductPrice(variant) {
      const priceEl = qs('#price-display') || qs('.product-info__price-current');
      if (!priceEl) return;
      priceEl.textContent = formatMoney(variant.price);
      priceEl.classList.toggle('product-info__price-current--sale', variant.compare_at_price > variant.price);
    }

    // Product form submit → add to cart via AJAX
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const variantId = qs('#variant-id')?.value;
      const qty = parseInt(qs('#qty-input')?.value) || 1;
      if (!variantId) return;

      const atcBtn = qs('#atc-btn');
      const originalText = atcBtn?.textContent || 'Add to Cart';
      if (atcBtn) { atcBtn.textContent = 'Adding...'; atcBtn.disabled = true; }

      await addToCart(variantId, qty);

      if (atcBtn) { atcBtn.textContent = originalText; atcBtn.disabled = false; }
    });
  }

  /* ── Gallery Thumbnails ── */
  const thumbs = qsa('.product-gallery__thumb');
  const mainImg = qs('#gallery-main-img');

  function setMainImage(src) {
    if (mainImg) mainImg.src = src;
  }

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      const src = thumb.dataset.src;
      if (src) setMainImage(src);
    });
  });

  /* ── Quantity Control ── */
  const qtyInput = qs('#qty-input');
  const qtyMinus = qs('#qty-minus');
  const qtyPlus = qs('#qty-plus');

  if (qtyInput && qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', () => {
      const val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    qtyPlus.addEventListener('click', () => {
      qtyInput.value = (parseInt(qtyInput.value) || 1) + 1;
    });
  }

  /* ================================================================
     4. SORT BY (Collection page)
  ================================================================ */
  const sortSelect = qs('#sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', sortSelect.value);
      window.location.href = url.toString();
    });
  }

  /* ================================================================
     5. FAQ ACCORDION
  ================================================================ */
  qsa('.faq-item').forEach(item => {
    const btn = qs('.faq-question', item);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // Close all others
      qsa('.faq-item.is-open').forEach(openItem => {
        openItem.classList.remove('is-open');
        qs('.faq-question', openItem)?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ================================================================
     6. NEWSLETTER FORM (footer)
  ================================================================ */
  const newsletterForm = qs('#footer-newsletter-form');
  if (newsletterForm && !newsletterForm.dataset.shopifySubmitted) {
    newsletterForm.addEventListener('submit', (e) => {
      // Let Shopify handle the actual submission, just show success after
      const successEl = qs('.footer-newsletter__success', newsletterForm.parentElement);
      setTimeout(() => {
        if (successEl) successEl.classList.add('is-visible');
      }, 600);
    });
  }

  /* ================================================================
     7. SCROLL — Sticky header shadow
  ================================================================ */
  const header = qs('.site-header');
  if (header) {
    const updateHeader = () => {
      header.style.boxShadow = window.scrollY > 10
        ? '0 4px 20px rgba(0,0,0,0.2)'
        : '0 2px 12px rgba(0,0,0,0.15)';
    };
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* ================================================================
     8. FLASH MESSAGES — auto-dismiss
  ================================================================ */
  qsa('.flash-message').forEach(msg => {
    setTimeout(() => {
      msg.style.transition = 'opacity 0.5s';
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 500);
    }, 6000);
  });

  /* ================================================================
     9. REVIEWS CAROUSEL
  ================================================================ */
  const reviewsTrack = qs('#reviews-track');
  const reviewsPrev = qs('#reviews-prev');
  const reviewsNext = qs('#reviews-next');

  if (reviewsTrack && reviewsPrev && reviewsNext) {
    const cards = qsa('.review-card', reviewsTrack);
    const visibleCount = () => window.innerWidth >= 900 ? 3 : window.innerWidth >= 600 ? 2 : 1;
    let currentIndex = 0;

    function getMax() { return Math.max(0, cards.length - visibleCount()); }

    function updateVisibility() {
      const max = getMax();
      reviewsPrev.disabled = currentIndex === 0;
      reviewsNext.disabled = currentIndex >= max;

      cards.forEach((card, i) => {
        const visible = i >= currentIndex && i < currentIndex + visibleCount();
        card.style.display = visible ? '' : 'none';
      });
    }

    reviewsPrev.addEventListener('click', () => {
      if (currentIndex > 0) { currentIndex--; updateVisibility(); }
    });
    reviewsNext.addEventListener('click', () => {
      if (currentIndex < getMax()) { currentIndex++; updateVisibility(); }
    });

    window.addEventListener('resize', () => {
      currentIndex = Math.min(currentIndex, getMax());
      updateVisibility();
    });

    updateVisibility();
  }

})();
