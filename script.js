// ---------- 1. Mobile menu ----------
// Guarded because not every page necessarily has both elements.
const navToggle = document.getElementById("navToggle");
const nav = document.querySelector(".nav");

if (navToggle && nav) {
  const setNavOpen = (open) => {
    nav.classList.toggle("nav--open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    const icon = navToggle.querySelector("i");
    if (icon) icon.className = open ? "ph ph-x" : "ph ph-list";
  };

  navToggle.addEventListener("click", () => setNavOpen(!nav.classList.contains("nav--open")));

  // Close after choosing a link, pressing Escape, tapping outside, or growing to desktop size
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setNavOpen(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNavOpen(false); });
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) setNavOpen(false);
  });
  window.matchMedia("(min-width: 961px)").addEventListener("change", () => setNavOpen(false));
}

// ---------- 2. Selected work: category filter ----------
// A button's data-filter is matched against each card's data-category.
// Only runs on pages that actually have the Work section (e.g. not gallery.html).
const filterButtons = document.querySelectorAll(".filter-btn");
const workCards = document.querySelectorAll(".work .card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((b) => {
      const isActive = b === button;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-pressed", isActive);
    });

    workCards.forEach((card) => {
      card.hidden = !(filter === "all" || card.dataset.category === filter);
    });
  });
});

// ---------- 3. Gallery: click an image to view it larger ----------
// Only runs on pages that actually have the lightbox markup.
const lightbox = document.getElementById("lightbox");

if (lightbox) {
  const lightboxImg = lightbox.querySelector("img");

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll(".gallery-grid img").forEach((img) => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });

  lightbox.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

// ---------- 4. Work Modal Popup & Multi-Image Slider ----------
// Only runs on pages that actually have the modal markup (e.g. not gallery.html).
const workModal = document.getElementById("workModal");

if (workModal) {
  const modalClose = document.getElementById("modalClose");
  const modalSlides = document.getElementById("modalSlides");
  const modalTitle = document.getElementById("modalTitle");
  const modalMeta = document.getElementById("modalMeta");
  const modalDesc = document.getElementById("modalDesc");
  const modalPrev = document.getElementById("modalPrev");
  const modalNext = document.getElementById("modalNext");
  const modalDots = document.getElementById("modalDots");

  let currentSlideIndex = 0;
  let totalSlides = 0;

  function openWorkModal(card) {
    const images = Array.from(card.querySelectorAll(".card-images img"));
    const title = card.querySelector("h3") ? card.querySelector("h3").innerHTML : "";
    const meta = card.querySelector(".card-meta") ? card.querySelector(".card-meta").innerHTML : "";
    const desc = card.querySelector(".card-desc") ? card.querySelector(".card-desc").innerHTML : "";

    // Populate info
    modalTitle.innerHTML = title;
    modalMeta.innerHTML = meta;
    modalDesc.innerHTML = desc;

    // Build slider images
    modalSlides.innerHTML = "";
    modalDots.innerHTML = "";
    totalSlides = images.length;
    currentSlideIndex = 0;

    images.forEach((img, index) => {
      const newImg = document.createElement("img");
      newImg.src = img.src;
      newImg.alt = img.alt;
      modalSlides.appendChild(newImg);

      if (totalSlides > 1) {
        const dot = document.createElement("button");
        dot.className = "modal-dot" + (index === 0 ? " is-active" : "");
        dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
        dot.addEventListener("click", () => scrollToSlide(index));
        modalDots.appendChild(dot);
      }
    });

    // Toggle arrow & dot visibility based on image count
    const hasMultiple = totalSlides > 1;
    modalPrev.style.display = hasMultiple ? "flex" : "none";
    modalNext.style.display = hasMultiple ? "flex" : "none";
    modalDots.style.display = hasMultiple ? "flex" : "none";

    workModal.classList.add("is-open");
    workModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Prevent scrolling behind modal

    scrollToSlide(0);
  }

  function closeWorkModal() {
    workModal.classList.remove("is-open");
    workModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function scrollToSlide(index) {
    currentSlideIndex = index;
    const slideWidth = modalSlides.clientWidth;
    modalSlides.scrollTo({ left: slideWidth * index, behavior: "smooth" });
    updateDots();
  }

  function updateDots() {
    const dots = modalDots.querySelectorAll(".modal-dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentSlideIndex);
    });
  }

  // Card Click Event Handler — also records the card as "recently viewed" (see section 5)
  document.querySelectorAll(".work .card").forEach((card) => {
    card.addEventListener("click", () => {
      if (window.markWorkAsViewed) window.markWorkAsViewed(card.dataset.id);
      openWorkModal(card);
    });
  });

  // Controls
  modalClose.addEventListener("click", closeWorkModal);

  modalPrev.addEventListener("click", () => {
    const prevIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
    scrollToSlide(prevIndex);
  });

  modalNext.addEventListener("click", () => {
    const nextIndex = (currentSlideIndex + 1) % totalSlides;
    scrollToSlide(nextIndex);
  });

  // Close modal when clicking dark overlay
  workModal.addEventListener("click", (e) => {
    if (e.target === workModal) closeWorkModal();
  });

  // Escape key support
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && workModal.classList.contains("is-open")) {
      closeWorkModal();
    }
  });
}

// ---------- 5. Selected work: show recently viewed projects first ----------
// Each card needs data-id="something-unique" in index.html for this to track it.
// Remembered with localStorage, so it carries over between visits (not just this session).
// Only runs on pages that actually have the Work grid.
(function initRecentlyViewed() {
  const grid = document.querySelector(".work .grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".card[data-id]"));
  if (!cards.length) return;

  const STORAGE_KEY = "recentlyViewedWork";
  const MAX_REMEMBERED = 30; // stops the list from growing forever

  function readRecent() {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return []; // private browsing / storage blocked — just fall back to the original order
    }
  }

  function writeRecent(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_REMEMBERED)));
    } catch (err) {
      /* private browsing / storage full — recording is best-effort, safe to ignore */
    }
  }

  // Re-orders the cards already on the page: most-recently-viewed first,
  // then everything else, kept in its original order.
  function applyOrder() {
    const recent = readRecent();
    const remaining = new Map(cards.map((card) => [card.dataset.id, card]));
    const ordered = [];

    recent.forEach((id) => {
      const card = remaining.get(id);
      if (card) {
        ordered.push(card);
        remaining.delete(id);
      }
    });
    remaining.forEach((card) => ordered.push(card));

    // Re-appending each card in the new order moves it there (existing click
    // listeners on these elements stay attached — nothing is recreated).
    ordered.forEach((card) => grid.appendChild(card));
  }

  // Called from section 4 when a card is opened. Exposed on window so this stays
  // one self-contained block instead of being tangled into the modal code above.
  window.markWorkAsViewed = function markWorkAsViewed(id) {
    if (!id) return;
    const list = readRecent().filter((existingId) => existingId !== id);
    list.unshift(id);
    writeRecent(list);
    // Re-ordering happens on the NEXT page load, not mid-browse — jumping the grid
    // around while someone is actively looking at it would be jarring.
  };

  applyOrder();
})();

document.querySelectorAll('.modal-slides').forEach((slidesContainer) => {
  slidesContainer.addEventListener('mousemove', (e) => {
    const activeImg = e.target;
    
    // Only apply zoom when hovering directly over an image
    if (activeImg.tagName === 'IMG') {
      const rect = activeImg.getBoundingClientRect();
      
      // Calculate mouse position as percentage relative to the image
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      slidesContainer.classList.add('is-zoomed');
      activeImg.style.transformOrigin = `${x}% ${y}%`;
      activeImg.style.transform = 'scale(2.2)'; // Adjust zoom level (e.g., 1.8 to 2.5)
    }
  });

  slidesContainer.addEventListener('mouseleave', (e) => {
    slidesContainer.classList.remove('is-zoomed');
    const images = slidesContainer.querySelectorAll('img');
    images.forEach((img) => {
      img.style.transform = 'scale(1)';
      img.style.transformOrigin = 'center center';
    });
  });
});
// ---------- 6. Accessibility panel ----------
// Text size, high contrast, reduce motion, and underlined links — each one is just
// a class/attribute on <html>, driven entirely by CSS (see style.css, bottom of
// section 2). Preferences are remembered in localStorage (see the small inline
// script at the top of <body> in each HTML file, which applies them before paint).
(function initAccessibilityPanel() {
  const panel = document.getElementById("a11yPanel");
  if (!panel) return;

  const overlay = document.getElementById("a11yOverlay");
  const openButtons = [document.getElementById("a11yToggle"), document.getElementById("a11yToggleMobile")].filter(Boolean);
  const closeButton = document.getElementById("a11yClose");
  const resetButton = document.getElementById("a11yReset");
  const textSizeButtons = Array.from(panel.querySelectorAll("[data-textsize]"));
  const contrastSwitch = document.getElementById("toggleContrast");
  const motionSwitch = document.getElementById("toggleMotion");
  const underlineSwitch = document.getElementById("toggleUnderline");
  const root = document.documentElement;
  const STORAGE_KEY = "a11yPrefs";

  function readPrefs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (err) {
      return {};
    }
  }

  function writePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (err) {
      /* private browsing / storage blocked — the setting still works for this visit */
    }
  }

  function applyPrefs(prefs) {
    if (prefs.textSize && prefs.textSize !== "normal") {
      root.setAttribute("data-textsize", prefs.textSize);
    } else {
      root.removeAttribute("data-textsize");
    }
    root.classList.toggle("a11y-contrast", !!prefs.highContrast);
    root.classList.toggle("a11y-reduce-motion", !!prefs.reduceMotion);
    root.classList.toggle("a11y-underline", !!prefs.underlineLinks);

    textSizeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.textsize === (prefs.textSize || "normal"));
    });
    contrastSwitch.setAttribute("aria-checked", !!prefs.highContrast);
    motionSwitch.setAttribute("aria-checked", !!prefs.reduceMotion);
    underlineSwitch.setAttribute("aria-checked", !!prefs.underlineLinks);
  }

  function update(partial) {
    const prefs = Object.assign(readPrefs(), partial);
    writePrefs(prefs);
    applyPrefs(prefs);
  }

  applyPrefs(readPrefs()); // in case the early no-flash script wasn't present for some reason

  function openPanel() {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    openButtons.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
  }

  function closePanel() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    openButtons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
  }

  openButtons.forEach((button) => button.addEventListener("click", openPanel));
  closeButton.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) closePanel();
  });

  textSizeButtons.forEach((button) => {
    button.addEventListener("click", () => update({ textSize: button.dataset.textsize }));
  });

  contrastSwitch.addEventListener("click", () => update({ highContrast: contrastSwitch.getAttribute("aria-checked") !== "true" }));
  motionSwitch.addEventListener("click", () => update({ reduceMotion: motionSwitch.getAttribute("aria-checked") !== "true" }));
  underlineSwitch.addEventListener("click", () => update({ underlineLinks: underlineSwitch.getAttribute("aria-checked") !== "true" }));

  resetButton.addEventListener("click", () => {
    writePrefs({});
    applyPrefs({});
  });
})();

// ---------- 7. Dock + mobile menu: highlight the current section ----------
// Works two ways: on index.html, the Home/About/Contact links light up as you
// scroll past each section. On the other pages there's nothing to scroll-spy, so the
// link for that page is simply marked active.
(function initActiveNavLink() {
  const dockLinks = Array.from(document.querySelectorAll('.dock-links a[data-dock], .nav a[data-dock]'));
  if (!dockLinks.length) return;

  function setActive(name) {
    dockLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.dock === name));
  }

  // Pages that live on their own (work.html, services.html, gallery.html) declare
  // themselves with <body data-page="...">, so their sidebar link is marked active.
  const page = document.body.dataset.page;
  if (page && page !== "home") {
    setActive(page);
    return;
  }

  const sectionIds = { top: "home", services: "services", work: "work", about: "about", contact: "contact" };
  const sections = Object.keys(sectionIds)
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(sectionIds[entry.target.id]);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" } // counts a section as "current" once it crosses the middle of the screen
    );
    sections.forEach((section) => observer.observe(section));
  }
})();


// ---------- 8. Hover text: outlined word with a colour spotlight that follows the cursor ----------
// Any <div class="text-hover" data-text-hover="YOUR TEXT"></div> becomes a large outlined word.
// A soft circle of colour follows the pointer across it, and the outline draws itself the first
// time it scrolls into view. (This is a plain JavaScript version of the React "text hover effect".)
(function initTextHover() {
  const NS = "http://www.w3.org/2000/svg";
  const W = 1000;          // the drawing is 1000 x 160 units and scales to fit its container
  const H = 160;
  const SPOT = 170;        // size of the colour spotlight

  function make(name, attrs) {
    const node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach((key) => node.setAttribute(key, attrs[key]));
    return node;
  }

  function stops(parent, list) {
    list.forEach(([offset, color]) => parent.appendChild(make("stop", { offset, "stop-color": color })));
  }

  document.querySelectorAll("[data-text-hover]").forEach((host, index) => {
    const label = host.dataset.textHover;
    const gradientId = `thGradient${index}`;
    const revealId = `thReveal${index}`;
    const maskId = `thMask${index}`;

    const svg = make("svg", { viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" });
    svg.setAttribute("class", "text-hover-svg");

    // Colours used inside the spotlight (your site colours: pink, blue, green)
    const defs = make("defs");
    const gradient = make("linearGradient", { id: gradientId, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: W, y2: 0 });
    stops(gradient, [["0%", "#FF3E7F"], ["50%", "#3E5CFF"], ["100%", "#0B6E4F"]]);

    // The spotlight itself: a white circle that fades to black. A mask only shows the colour where it is white.
    const reveal = make("radialGradient", { id: revealId, gradientUnits: "userSpaceOnUse", cx: W / 2, cy: H / 2, r: SPOT });
    stops(reveal, [["0%", "#fff"], ["100%", "#000"]]);
    const mask = make("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H });
    mask.appendChild(make("rect", { x: 0, y: 0, width: W, height: H, fill: `url(#${revealId})` }));
    defs.append(gradient, reveal, mask);

    const textAttrs = {
      x: W / 2,
      y: H / 2,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      textLength: 960,
      lengthAdjust: "spacingAndGlyphs",
    };
    const base = make("text", Object.assign({ class: "th-base" }, textAttrs));
    const color = make("text", Object.assign({ class: "th-color", stroke: `url(#${gradientId})`, mask: `url(#${maskId})` }, textAttrs));
    base.textContent = label;
    color.textContent = label;

    svg.append(defs, base, color);
    host.appendChild(svg);

    // Move the spotlight to the pointer
    function moveSpot(event) {
      const box = svg.getBoundingClientRect();
      reveal.setAttribute("cx", ((event.clientX - box.left) / box.width) * W);
      reveal.setAttribute("cy", ((event.clientY - box.top) / box.height) * H);
    }
    svg.addEventListener("pointerenter", (event) => { host.classList.add("is-hovered"); moveSpot(event); });
    svg.addEventListener("pointermove", moveSpot);
    svg.addEventListener("pointerleave", () => host.classList.remove("is-hovered"));
    svg.addEventListener("pointercancel", () => host.classList.remove("is-hovered"));

    // Draw the outline the first time it comes into view
    if ("IntersectionObserver" in window) {
      const watcher = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          host.classList.add("is-drawn");
          watcher.disconnect();
        }
      }, { threshold: 0.4 });
      watcher.observe(host);
    } else {
      host.classList.add("is-drawn");
    }
  });
})();

// ---------- 9. Contact form: opens the visitor's email app with the message filled in ----------
// There is no server on this site, so the form hands the message to the visitor's own email app.
(function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = `Message from ${name}`;
    const body = `${message}\n\n${name}\n${email}`;
    window.location.href =
      "mailto:daniellesutin@gmail.com" +
      `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();

// ---------- 10. Magnetic button: gently pulled toward the cursor ----------
// Add data-magnetic to any link or button. When the pointer comes near, the button leans toward it
// (and its arrow icon leans a little further), then settles back when the pointer moves away.
// This is a plain JavaScript version of the React "magnetic button".
(function initMagneticButtons() {
  const fineMouse = window.matchMedia("(hover: hover) and (pointer: fine)");
  const targets = Array.from(document.querySelectorAll("[data-magnetic]"));
  if (!targets.length || !fineMouse.matches) return;

  const REACH = 70;        // how many px outside the button the pull begins
  const PULL = 0.35;       // how much of the cursor's distance the button follows
  const LIMIT = 16;        // the most the button will ever move, in px
  const ICON_EXTRA = 0.5;  // the arrow moves a bit further than the button, for depth
  const EASE = 0.18;       // lower = softer, slower follow

  const items = targets.map((el) => ({ el, icon: el.querySelector("i"), x: 0, y: 0, tx: 0, ty: 0 }));
  let frame = 0;

  const motionOff = () =>
    document.documentElement.classList.contains("a11y-reduce-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (value) => Math.max(-LIMIT, Math.min(LIMIT, value));

  function render() {
    let moving = false;
    items.forEach((item) => {
      item.x += (item.tx - item.x) * EASE;
      item.y += (item.ty - item.y) * EASE;
      if (Math.abs(item.tx - item.x) < 0.05 && Math.abs(item.ty - item.y) < 0.05) {
        item.x = item.tx;
        item.y = item.ty;
      } else {
        moving = true;
      }
      item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
      if (item.icon) item.icon.style.transform = `translate3d(${item.x * ICON_EXTRA}px, ${item.y * ICON_EXTRA}px, 0)`;
    });
    frame = moving ? requestAnimationFrame(render) : 0;
  }

  function start() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function release() {
    items.forEach((item) => { item.tx = 0; item.ty = 0; });
    start();
  }

  document.addEventListener("pointermove", (event) => {
    items.forEach((item) => {
      if (motionOff()) { item.tx = 0; item.ty = 0; return; }
      const box = item.el.getBoundingClientRect();
      // the box includes the current pull, so subtract it to find where the button rests
      const cx = box.left + box.width / 2 - item.x;
      const cy = box.top + box.height / 2 - item.y;
      const near =
        Math.abs(event.clientX - cx) < box.width / 2 + REACH &&
        Math.abs(event.clientY - cy) < box.height / 2 + REACH;
      item.tx = near ? clamp((event.clientX - cx) * PULL) : 0;
      item.ty = near ? clamp((event.clientY - cy) * PULL) : 0;
    });
    start();
  });

  document.documentElement.addEventListener("pointerleave", release);
  window.addEventListener("blur", release);
  window.addEventListener("scroll", release, { passive: true });
})();

// ---------- 11. Opening screen: a glass pill that flips through your names ----------
// Shown once per visit (the early script at the top of each page decides). Add ?loader to a page's
// address to see it again. This is a plain JavaScript version of the React "container text flip".
(function initOpeningScreen() {
  const root = document.documentElement;
  const loader = document.getElementById("loader");
  if (!loader || !root.classList.contains("loader-on")) return;

  const pill = document.getElementById("loaderPill");
  const word = document.getElementById("loaderWord");

  const WORDS = ["Creative Portfolio", "Danielle Hynes Sutin", "Draft & Hue Studio"];
  const HOLD = 1300;       // how long each name stays on screen (ms)
  const FADE_OUT = 260;    // how long the old name takes to fade away
  const MAX_WAIT = 6000;   // after the last name, never wait longer than this for the page to finish loading

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try { sessionStorage.setItem("loaderSeen", "1"); } catch (err) { /* storage blocked: it will just show again next time */ }

  // Make the glass exactly as wide as the current name; CSS animates the change in width
  function fit() {
    const style = getComputedStyle(pill);
    const extra =
      parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    pill.style.width = `${word.offsetWidth + extra}px`;
  }

  // Put a name on screen, one <span> per letter (they start hidden)
  function setWord(text) {
    word.classList.remove("is-out", "is-in");
    word.textContent = "";
    Array.from(text).forEach((char, index) => {
      const letter = document.createElement("span");
      letter.className = "flip-letter";
      letter.style.setProperty("--i", index);
      letter.textContent = char === " " ? "\u00A0" : char;
      word.appendChild(letter);
    });
  }

  // Wait two frames so the hidden state is painted first, then let the letters rise in
  function reveal() {
    requestAnimationFrame(() => requestAnimationFrame(() => word.classList.add("is-in")));
  }

  function leave() {
    loader.classList.add("is-leaving");
    setTimeout(() => root.classList.remove("loader-on"), 700);
  }

  window.addEventListener("resize", fit);

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const pageLoaded = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

  (async function run() {
    await Promise.race([fontsReady, wait(1500)]);

    setWord(WORDS[0]);
    fit();
    reveal();
    await wait(HOLD);

    for (let i = 1; i < WORDS.length; i++) {
      word.classList.add("is-out");
      await wait(FADE_OUT);
      setWord(WORDS[i]);
      fit();
      await wait(140);   // let the glass start resizing before the letters arrive
      reveal();
      await wait(HOLD);
    }

    // hold on the last name until the whole page has finished loading
    await Promise.race([pageLoaded, wait(MAX_WAIT)]);
    leave();
  })();
})();
