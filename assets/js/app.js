/* =============================================================
   NACRÉ — logique de la boutique (vanilla JS, aucune dépendance)
   Panier persistant + précommande sans paiement.
   ============================================================= */
(function () {
  "use strict";

  var CFG = window.NACRE_CONFIG || {};
  var STORE_KEY = "nacre.cart.v1";
  var ORDERS_KEY = "nacre.preorders.v1";

  var euro = new Intl.NumberFormat(CFG.locale || "fr-FR", {
    style: "currency",
    currency: CFG.currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---------------------------------------------------------- catalogue */

  var catalogue = {};
  $$(".product").forEach(function (el) {
    catalogue[el.dataset.id] = {
      id: el.dataset.id,
      name: el.dataset.name,
      price: parseFloat(el.dataset.price),
      image: el.dataset.image
    };
  });

  /* ------------------------------------------------------------- panier */

  var cart = [];

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      if (!Array.isArray(raw)) raw = [];
      cart = raw
        .filter(function (l) { return l && catalogue[l.id]; })
        .map(function (l) {
          var q = parseInt(l.qty, 10);
          return { id: l.id, qty: Math.min(Math.max(isNaN(q) ? 1 : q, 1), 99) };
        });
    } catch (e) {
      cart = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cart));
    } catch (e) {
      /* mode privé / quota : le panier reste valable pour la session */
    }
  }

  function count() {
    return cart.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function total() {
    return cart.reduce(function (n, l) { return n + catalogue[l.id].price * l.qty; }, 0);
  }

  function find(id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  }

  function add(id, qty) {
    if (!catalogue[id]) return;
    var line = find(id);
    if (line) line.qty = Math.min(line.qty + (qty || 1), 99);
    else cart.push({ id: id, qty: qty || 1 });
    save();
    render();
  }

  function setQty(id, qty) {
    var line = find(id);
    if (!line) return;
    if (qty <= 0) remove(id);
    else {
      line.qty = Math.min(qty, 99);
      save();
      render();
    }
  }

  function remove(id) {
    cart = cart.filter(function (l) { return l.id !== id; });
    save();
    render();
  }

  /* -------------------------------------------------------------- rendu */

  var elCount = $("#cart-count");
  var elCountSr = $("#cart-count-sr");
  var elLines = $("#cart-lines");
  var elEmpty = $("#cart-empty");
  var elTotal = $("#cart-total");
  var elCheckout = $("#checkout");

  function render() {
    var n = count();

    elCount.textContent = String(n);
    elCount.setAttribute("data-empty", n === 0 ? "true" : "false");
    elCountSr.textContent = "Panier, " + n + (n > 1 ? " articles" : " article");

    elLines.textContent = "";
    cart.forEach(function (line) {
      elLines.appendChild(lineNode(line));
    });

    elEmpty.hidden = n > 0;
    elTotal.textContent = euro.format(total());
    elCheckout.disabled = n === 0;
  }

  function lineNode(line) {
    var p = catalogue[line.id];

    var wrap = document.createElement("div");
    wrap.className = "cart-line";

    var img = document.createElement("img");
    img.className = "cart-line__img";
    img.src = p.image;
    img.alt = "";
    img.width = 68;
    img.height = 91;
    img.loading = "lazy";
    wrap.appendChild(img);

    var col = document.createElement("div");

    var name = document.createElement("p");
    name.className = "cart-line__name";
    name.textContent = p.name;
    col.appendChild(name);

    var unit = document.createElement("p");
    unit.className = "cart-line__unit";
    unit.textContent = euro.format(p.price) + " / pièce";
    col.appendChild(unit);

    var row = document.createElement("div");
    row.className = "cart-line__row";

    var qty = document.createElement("div");
    qty.className = "qty";

    var minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Retirer un " + p.name);
    minus.addEventListener("click", function () { setQty(line.id, line.qty - 1); });

    var out = document.createElement("output");
    out.textContent = String(line.qty);
    out.setAttribute("aria-label", "Quantité de " + p.name);

    var plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Ajouter un " + p.name);
    plus.addEventListener("click", function () { setQty(line.id, line.qty + 1); });

    qty.appendChild(minus);
    qty.appendChild(out);
    qty.appendChild(plus);
    row.appendChild(qty);

    var price = document.createElement("span");
    price.className = "cart-line__price";
    price.textContent = euro.format(p.price * line.qty);
    row.appendChild(price);

    col.appendChild(row);

    var del = document.createElement("button");
    del.type = "button";
    del.className = "link-remove";
    del.textContent = "Retirer";
    del.setAttribute("aria-label", "Retirer " + p.name + " du panier");
    del.addEventListener("click", function () { remove(line.id); });
    col.appendChild(del);

    wrap.appendChild(col);
    return wrap;
  }

  /* --------------------------------------------------------- ajout / UI */

  var toastEl = $("#toast");
  var toastTimer = null;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2600);
  }

  function bump() {
    elCount.classList.remove("is-bump");
    void elCount.offsetWidth;
    elCount.classList.add("is-bump");
    setTimeout(function () { elCount.classList.remove("is-bump"); }, 320);
  }

  $$(".add-to-cart").forEach(function (btn) {
    var card = btn.closest(".product");
    btn.setAttribute("aria-label", "Ajouter " + card.dataset.name + " au panier");
    btn.addEventListener("click", function () {
      add(card.dataset.id, 1);
      bump();
      toast(card.dataset.name + " ajouté au panier");
      btn.classList.add("is-added");
      btn.textContent = "Ajouté ✓";
      clearTimeout(btn._t);
      btn._t = setTimeout(function () {
        btn.classList.remove("is-added");
        btn.textContent = "Ajouter au panier";
      }, 1800);
    });
  });

  /* --------------------------------------------- tiroir & modale (a11y) */

  var overlay = $("#overlay");
  var drawer = $("#cart-drawer");
  var modal = $("#preorder-modal");
  var lastFocus = null;

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function visibleFocusable(root) {
    return $$(FOCUSABLE, root).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function openPanel(panel, focusTarget) {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    void overlay.offsetWidth;
    overlay.classList.add("is-open");
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    setTimeout(function () {
      var t = focusTarget || visibleFocusable(panel)[0];
      if (t) t.focus();
    }, 60);
  }

  function closePanel(panel) {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    if (!drawer.classList.contains("is-open") && !modal.classList.contains("is-open")) {
      overlay.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      setTimeout(function () {
        if (!overlay.classList.contains("is-open")) overlay.hidden = true;
      }, 360);
    }
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function openCart() { openPanel(drawer, $("#cart-close")); }
  function closeCart() { closePanel(drawer); }

  $("#cart-open").addEventListener("click", openCart);
  $("#cart-close").addEventListener("click", closeCart);
  overlay.addEventListener("click", function () {
    if (modal.classList.contains("is-open")) closeModal();
    else if (drawer.classList.contains("is-open")) closeCart();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal.classList.contains("is-open")) closeModal();
      else if (drawer.classList.contains("is-open")) closeCart();
      else if (nav.classList.contains("is-open")) toggleNav(false);
      return;
    }
    if (e.key !== "Tab") return;
    var panel = modal.classList.contains("is-open")
      ? modal
      : drawer.classList.contains("is-open")
        ? drawer
        : null;
    if (!panel) return;
    var items = visibleFocusable(panel);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---------------------------------------------------- précommande */

  var stepForm = $("#preorder-step-form");
  var stepDone = $("#preorder-step-done");
  var poForm = $("#preorder-form");
  var poItems = $("#preorder-items");
  var poTotal = $("#preorder-total");
  var poSubmit = $("#preorder-submit");

  function fillRecap() {
    poItems.textContent = "";
    cart.forEach(function (line) {
      var p = catalogue[line.id];
      var li = document.createElement("li");
      var left = document.createElement("span");
      left.textContent = p.name + " × " + line.qty;
      var right = document.createElement("span");
      right.textContent = euro.format(p.price * line.qty);
      li.appendChild(left);
      li.appendChild(right);
      poItems.appendChild(li);
    });
    poTotal.textContent = euro.format(total());
  }

  function openModal() {
    if (!cart.length) return;
    fillRecap();
    stepForm.hidden = false;
    stepDone.hidden = true;
    closeCart();
    setTimeout(function () { openPanel(modal, $("#po-name")); }, 120);
  }

  function closeModal() {
    closePanel(modal);
  }

  elCheckout.addEventListener("click", openModal);
  $("#preorder-close").addEventListener("click", closeModal);
  $("#preorder-done-close").addEventListener("click", closeModal);

  /* ------------------------------------------------------- validation */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function setError(input, key, msg) {
    var box = $("#err-" + key);
    if (box) box.textContent = msg || "";
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    return !msg;
  }

  function validate() {
    var name = $("#po-name");
    var email = $("#po-email");
    var address = $("#po-address");
    var ok = true;

    ok = setError(name, "name", name.value.trim().length < 2 ? "Merci d'indiquer votre nom." : "") && ok;
    ok = setError(email, "email", EMAIL_RE.test(email.value.trim()) ? "" : "Adresse e-mail invalide.") && ok;
    ok = setError(address, "address", address.value.trim().length < 8 ? "Adresse de livraison incomplète." : "") && ok;

    if (!ok) {
      var firstBad = $('#preorder-form [aria-invalid="true"]');
      if (firstBad) firstBad.focus();
    }
    return ok;
  }

  ["po-name", "po-email", "po-address"].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener("input", function () {
      if (el.getAttribute("aria-invalid") === "true") validate();
    });
  });

  function reference() {
    var d = new Date();
    var stamp =
      String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    var rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "NCR-" + stamp + "-" + rnd;
  }

  function orderPayload(ref) {
    return {
      reference: ref,
      createdAt: new Date().toISOString(),
      customer: {
        name: $("#po-name").value.trim(),
        email: $("#po-email").value.trim(),
        address: $("#po-address").value.trim(),
        message: $("#po-message").value.trim()
      },
      items: cart.map(function (l) {
        return {
          id: l.id,
          name: catalogue[l.id].name,
          unitPrice: catalogue[l.id].price,
          qty: l.qty,
          lineTotal: catalogue[l.id].price * l.qty
        };
      }),
      total: total(),
      currency: CFG.currency || "EUR",
      type: "precommande-sans-paiement"
    };
  }

  function archive(order) {
    try {
      var all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      all.push(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
    } catch (e) { /* rien de bloquant */ }
  }

  function mailtoLink(order) {
    var lines = order.items.map(function (i) {
      return "- " + i.name + " x" + i.qty + " — " + euro.format(i.lineTotal);
    });
    var body = [
      "Précommande " + order.reference,
      "",
      "Nom : " + order.customer.name,
      "E-mail : " + order.customer.email,
      "Adresse : " + order.customer.address,
      order.customer.message ? "Message : " + order.customer.message : "",
      "",
      "Articles :",
      lines.join("\n"),
      "",
      "Total estimé : " + euro.format(order.total),
      "",
      "(Précommande sans paiement — envoyée depuis le site NACRÉ.)"
    ]
      .filter(function (l) { return l !== ""; })
      .join("\n");

    return (
      "mailto:" +
      encodeURIComponent(CFG.contactEmail || "contact@example.com") +
      "?subject=" +
      encodeURIComponent("Précommande " + order.reference) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  poForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cart.length) {
      closeModal();
      return;
    }
    if (!validate()) return;

    var order = orderPayload(reference());
    poSubmit.disabled = true;
    poSubmit.textContent = "Envoi…";

    function finish(sent) {
      archive(order);
      $("#preorder-ref").textContent = "Référence " + order.reference;
      $("#preorder-done-text").textContent = sent
        ? "Merci " +
          order.customer.name.split(" ")[0] +
          ". Votre réservation est bien enregistrée : nous vous écrivons à " +
          order.customer.email +
          " dès l'ouverture des commandes. Aucun paiement ne vous a été demandé."
        : "Merci " +
          order.customer.name.split(" ")[0] +
          ". Votre réservation est enregistrée sur cet appareil. Pour qu'elle nous parvienne tout de suite, envoyez-la en un clic ci-dessous — aucun paiement ne vous sera demandé.";

      $("#preorder-mailto").href = mailtoLink(order);
      $("#preorder-mailto").hidden = sent;

      stepForm.hidden = true;
      stepDone.hidden = false;

      cart = [];
      save();
      render();
      poForm.reset();
      poSubmit.disabled = false;
      poSubmit.textContent = "Valider ma précommande";

      var heading = $("#preorder-step-done h3");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }

    if (CFG.preorderEndpoint) {
      fetch(CFG.preorderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(order)
      })
        .then(function (r) { finish(r.ok); })
        .catch(function () { finish(false); });
    } else {
      setTimeout(function () { finish(false); }, 320);
    }
  });

  /* ------------------------------------------------------- newsletter */

  var nlForm = $("#newsletter-form");
  var nlMsg = $("#newsletter-msg");

  nlForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("#newsletter-email");
    var value = input.value.trim();
    if (!EMAIL_RE.test(value)) {
      nlMsg.textContent = "Adresse e-mail invalide.";
      input.focus();
      return;
    }
    nlMsg.textContent = "Merci — à très vite.";
    input.value = "";
    if (CFG.newsletterEndpoint) {
      fetch(CFG.newsletterEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: value, source: "landing" })
      }).catch(function () { /* silencieux */ });
    }
  });

  /* ------------------------------------------------- menu & en-tête */

  var nav = $("#nav");
  var burger = $("#burger");

  function toggleNav(open) {
    var next = typeof open === "boolean" ? open : !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", next);
    burger.setAttribute("aria-expanded", next ? "true" : "false");
    burger.setAttribute("aria-label", next ? "Fermer le menu" : "Ouvrir le menu");
  }

  burger.addEventListener("click", function () { toggleNav(); });
  $$("#nav a").forEach(function (a) {
    a.addEventListener("click", function () { toggleNav(false); });
  });

  var header = $("#header");
  var ticking = false;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var heroTitle = $("#hero-title");
  var heroGlow = $("#hero-glow");

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle("is-scrolled", y > 40);
      if (!reduced && window.innerWidth > 780 && y < window.innerHeight * 1.2) {
        if (heroTitle) heroTitle.style.transform = "translateY(" + y * 0.16 + "px)";
        if (heroGlow) heroGlow.style.transform = "translateX(-50%) translateY(" + y * 0.07 + "px)";
      }
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------ révélations */

  var revealables = $$("[data-reveal]");
  if (reduced || typeof IntersectionObserver === "undefined") {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 80 + "ms";
      io.observe(el);
    });
    /* filet de sécurité : rien ne doit rester invisible */
    setTimeout(function () {
      revealables.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 1200);
  }

  /* ------------------------------------------------------------ init */

  load();
  render();
})();
