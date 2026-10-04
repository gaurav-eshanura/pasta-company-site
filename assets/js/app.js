/**
 * The Pasta Company — site behaviour.
 *
 * Everything here is progressive enhancement. Each page is already usable
 * without this file: forms are real forms, products are real products, links
 * are real links. This adds the cart, shape filtering, search and the drawers.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "tpc.cart.v1";
  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- utils */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) { return "₹" + n.toLocaleString("en-IN"); }

  function readCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(validLine) : [];
    } catch (e) {
      return [];
    }
  }

  function validLine(l) {
    return l && typeof l.id === "string" && Number.isFinite(l.price) && Number.isInteger(l.qty) && l.qty > 0;
  }

  function saveCart(lines) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch (e) { /* private mode */ }
  }

  /* --------------------------------------------------------------- header */

  var header = $("#site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------- toast */

  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-check"></use></svg><span>' + esc(msg) + "</span>";
    toastEl.classList.add("is-up");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-up"); }, 2800);
  }

  /* -------------------------------------------------------------- drawers */

  var scrim = $(".drawer-scrim");
  var openPanel = null;
  var lastFocused = null;

  function focusables(panel) { return $$(FOCUSABLE, panel).filter(function (el) { return el.offsetParent !== null; }); }

  function openDrawer(panel) {
    if (!panel) return;
    if (openPanel && openPanel !== panel) closeDrawer();
    lastFocused = document.activeElement;
    panel.classList.add("is-open");
    if (scrim) scrim.hidden = false;
    document.body.classList.add("is-locked");
    openPanel = panel;
    var f = focusables(panel);
    if (f.length) f[0].focus();
    else panel.focus();
  }

  function closeDrawer() {
    if (!openPanel) return;
    openPanel.classList.remove("is-open");
    openPanel = null;
    if (scrim) scrim.hidden = true;
    document.body.classList.remove("is-locked");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeDrawer(); closeMenu(); }
    // Keep Tab inside whichever drawer is open.
    if (e.key === "Tab" && openPanel) {
      var f = focusables(openPanel);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  $$("[data-close-cart]").forEach(function (b) { b.addEventListener("click", closeDrawer); });
  $$("[data-close-search]").forEach(function (b) { b.addEventListener("click", closeDrawer); });
  if (scrim) scrim.addEventListener("click", closeDrawer);

  /* ----------------------------------------------------------- mobile nav */

  var menuBtn = $("[data-open-menu]");
  var menu = $("#mobile-nav");

  function openMenu() {
    if (!menu || !menuBtn) return;
    menu.classList.add("is-open");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
    var first = $("a", menu);
    if (first) first.focus();
  }

  function closeMenu() {
    if (!menu || !menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    if (!openPanel) document.body.classList.remove("is-locked");
  }

  if (menuBtn) menuBtn.addEventListener("click", function () {
    menu.classList.contains("is-open") ? closeMenu() : openMenu();
  });
  if (menu) {
    menu.addEventListener("click", function (e) { if (e.target.tagName === "A") closeMenu(); });
  }

  /* ----------------------------------------------------------------- cart */

  var cartDrawer = $("#cart-drawer");
  var cartBody = $("[data-cart-body]");
  var cartTotalEl = $("[data-cart-total]");
  var countEls = $$("[data-cart-count]");

  function cartCount(lines) { return lines.reduce(function (n, l) { return n + l.qty; }, 0); }
  function cartSum(lines) { return lines.reduce(function (n, l) { return n + l.qty * l.price; }, 0); }

  function renderCart() {
    var lines = readCart();
    var count = cartCount(lines);

    countEls.forEach(function (el) {
      el.textContent = count ? String(count) : "";
      el.setAttribute("data-count", String(count));
    });

    if (cartTotalEl) cartTotalEl.textContent = money(cartSum(lines));

    if (!cartBody) return;

    if (!lines.length) {
      cartBody.innerHTML =
        '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-bag"></use></svg>' +
        "<p>Your cart is empty.</p>" +
        '<p style="font-size:.86rem;margin-top:.4rem">Add a pack from Our Pasta to get started.</p>' +
        "</div>";
      return;
    }

    cartBody.innerHTML = lines
      .map(function (l) {
        return (
          '<div class="cart-line" data-line="' + esc(l.id) + '">' +
          '<img src="' + esc(l.img) + '" alt="" width="58" height="72" loading="lazy">' +
          "<div>" +
          '<p class="cart-line__name">' + esc(l.name) + "</p>" +
          '<p class="cart-line__meta">' + esc(l.size) + " g · " + money(l.price) + " each</p>" +
          '<div class="stepper">' +
          '<button type="button" data-dec aria-label="Decrease quantity of ' + esc(l.name) + ' ' + esc(l.size) + ' g">−</button>' +
          "<output>" + l.qty + "</output>" +
          '<button type="button" data-inc aria-label="Increase quantity of ' + esc(l.name) + ' ' + esc(l.size) + ' g">+</button>' +
          "</div>" +
          "</div>" +
          '<div style="display:grid;gap:.4rem;justify-items:end">' +
          '<span class="cart-line__price">' + money(l.qty * l.price) + "</span>" +
          '<button class="icon-btn" type="button" data-remove style="width:32px;height:32px" aria-label="Remove ' + esc(l.name) + ' ' + esc(l.size) + ' g from cart">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-trash"></use></svg>' +
          "</button></div></div>"
        );
      })
      .join("");
  }

  function addLine(line) {
    var lines = readCart();
    var found = lines.filter(function (l) { return l.id === line.id; })[0];
    if (found) found.qty = Math.min(99, found.qty + 1);
    else lines.push(line);
    saveCart(lines);
    renderCart();
  }

  function changeQty(id, delta) {
    var lines = readCart()
      .map(function (l) { return l.id === id ? Object.assign({}, l, { qty: Math.min(99, Math.max(0, l.qty + delta)) }) : l; })
      .filter(function (l) { return l.qty > 0; });
    saveCart(lines);
    renderCart();
  }

  function removeLine(id) {
    saveCart(readCart().filter(function (l) { return l.id !== id; }));
    renderCart();
  }

  if (cartBody) {
    cartBody.addEventListener("click", function (e) {
      var row = e.target.closest("[data-line]");
      if (!row) return;
      var id = row.getAttribute("data-line");
      if (e.target.closest("[data-inc]")) changeQty(id, 1);
      else if (e.target.closest("[data-dec]")) changeQty(id, -1);
      else if (e.target.closest("[data-remove]")) removeLine(id);
    });
  }

  $$("[data-open-cart]").forEach(function (b) {
    b.addEventListener("click", function () { renderCart(); openDrawer(cartDrawer); });
  });

  var checkoutBtn = $("[data-checkout]");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (!readCart().length) { toast("Your cart is empty."); return; }
      var note = $("[data-checkout-note]");
      if (note) {
        note.textContent =
          "Online checkout is not live yet. Call or email Customer Care with your cart and we will place the order for you.";
      }
      toast("Checkout is not live yet — please call or email us.");
    });
  }

  /* -------------------------------------------------- product size + add */

  $$("[data-add-to-cart]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest("[data-name]") || btn.closest("article");
      var picked = $(".size[aria-pressed='true']", card);
      if (!picked) return;
      var name = btn.getAttribute("data-product");
      var size = picked.getAttribute("data-size");
      addLine({
        id: btn.getAttribute("data-slug") + "-" + size,
        name: name,
        size: size,
        price: Number(picked.getAttribute("data-price")),
        img: picked.getAttribute("data-img"),
        qty: 1,
      });
      toast(name + " " + size + " g added to cart");
      openDrawer(cartDrawer);
    });
  });

  $$(".size").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.closest(".sizes");
      $$(".size", group).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
    });
  });

  /* --------------------------------------------------------- shape filter */

  $$("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var group = tab.closest('[role="tablist"]');
      $$("[data-tab]", group).forEach(function (t) { t.setAttribute("aria-selected", "false"); });
      tab.setAttribute("aria-selected", "true");

      var want = tab.getAttribute("data-tab");
      var grid = $("[data-range-grid]");
      if (!grid) return;
      $$(".pcard", grid).forEach(function (card) {
        card.classList.toggle("is-hidden", want !== "all" && card.getAttribute("data-filter") !== want);
      });
    });
  });

  /* --------------------------------------------------------------- search */

  var searchDrawer = $("#search-drawer");
  var searchInput = $("[data-search-input]");
  var searchResults = $("[data-search-results]");

  $$("[data-open-search]").forEach(function (b) {
    b.addEventListener("click", function () { renderSearch(""); openDrawer(searchDrawer); });
  });

  var INDEX = [];
  function buildIndex() {
    if (INDEX.length) return;
    $$(".pcard[data-name]").forEach(function (card) {
      var btn = $("[data-add-to-cart]", card);
      var sizes = $$(".size", card).map(function (s) {
        return { size: s.getAttribute("data-size"), price: s.getAttribute("data-price"), img: s.getAttribute("data-img") };
      });
      INDEX.push({
        kind: "Product",
        name: card.getAttribute("data-name"),
        href: btn ? btn.closest("body") && "pasta.html#" + (btn.getAttribute("data-slug") || "") : "pasta.html",
        href2: "pasta.html",
        blurb: ($(".pcard__blurb", card) || {}).textContent || "",
        img: sizes.length ? sizes[2].img : "",
        hay: (card.getAttribute("data-name") + " " + (($(".pcard__blurb", card) || {}).textContent || "")).toLowerCase(),
        prices: sizes,
      });
    });
    $$(".rcard").forEach(function (card) {
      var href = card.getAttribute("href") || "";
      var title = ($("h3", card) || {}).textContent || "";
      INDEX.push({
        kind: "Recipe",
        name: title,
        href: href,
        blurb: ($(".rcard__kicker", card) || {}).textContent || "",
        img: ($("img", card) || {}).getAttribute ? $("img", card).getAttribute("src") : "",
        hay: (title + " " + href).toLowerCase(),
      });
    });
  }

  function renderSearch(q) {
    if (!searchResults) return;
    buildIndex();
    var needle = q.trim().toLowerCase();
    var hits = needle
      ? INDEX.filter(function (i) { return i.hay.indexOf(needle) !== -1; })
      : INDEX.filter(function (i) { return i.kind === "Product"; });

    if (!hits.length) {
      searchResults.innerHTML = '<p class="search__empty">Nothing matched “' + esc(q) + '”. Try “penne”, “fusilli” or “tadka”.</p>';
      return;
    }

    searchResults.innerHTML = hits
      .map(function (h) {
        var price = h.prices && h.prices.length ? "from " + money(Number(h.prices[2].price)) : "";
        return (
          '<a class="search__hit" href="' + esc(h.href) + '">' +
          (h.img ? '<img src="' + esc(h.img) + '" alt="" width="44" height="54" loading="lazy">' : "<span></span>") +
          "<span>" + esc(h.name) + "<small>" + esc(h.blurb) + "</small></span>" +
          '<small>' + esc(h.kind) + (price ? " · " + price : "") + "</small></a>"
        );
      })
      .join("");
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () { renderSearch(searchInput.value); });
  }

  /* ---------------------------------------------------------------- forms */

  $$("[data-enquiry]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = $("[data-form-status]", form);
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (status) status.hidden = false;
      form.reset();
      toast("Enquiry received — thank you.");
    });
  });

  /* ------------------------------------------------------------- a11y niceties */

  // Space/Enter on a focused product card opens the default pack's size picker.
  document.addEventListener("keydown", function (e) {
    if (e.key !== " " || e.target.closest("button, a, input, select, textarea")) return;
    var card = e.target.closest(".pcard");
    if (!card) return;
    e.preventDefault();
    var first = $(".size", card);
    if (first) first.focus();
  });

  renderCart();
})();
