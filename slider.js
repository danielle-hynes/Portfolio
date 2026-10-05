// =========================================
// CARD PHOTO SLIDER — several photos in one card
// Any <div class="slider"> that contains 2 or more <img> becomes a slider
// with arrows, dots and swipe. A slider with only 1 photo stays a normal image.
// =========================================
(function initSliders() {
  const ARROW_ICON = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  };

  document.querySelectorAll(".slider").forEach((slider) => {
    const photos = Array.from(slider.querySelectorAll("img"));
    if (photos.length < 2) return;

    // Move the photos into a scrolling row
    const track = document.createElement("div");
    track.className = "slides";
    track.append(...photos);

    // Previous / next arrows
    function makeArrow(direction) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `slider-btn slider-btn--${direction}`;
      button.setAttribute("aria-label", direction === "prev" ? "Previous photo" : "Next photo");
      button.innerHTML = ARROW_ICON[direction];
      return button;
    }
    const prev = makeArrow("prev");
    const next = makeArrow("next");

    // One dot per photo
    const dotsBox = document.createElement("div");
    dotsBox.className = "slider-dots";
    const dots = photos.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slider-dot";
      dot.setAttribute("aria-label", `Go to photo ${index + 1}`);
      dot.addEventListener("click", () => goTo(index));
      dotsBox.appendChild(dot);
      return dot;
    });

    slider.append(track, prev, next, dotsBox);

    // Which photo is showing right now (0, 1, 2 ...)
    function current() {
      return Math.round(track.scrollLeft / track.clientWidth);
    }

    function goTo(index) {
      track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    }

    function markActive() {
      const now = current();
      dots.forEach((dot, index) => dot.classList.toggle("is-active", index === now));
    }

    // The arrows loop around: after the last photo comes the first
    prev.addEventListener("click", () => goTo((current() - 1 + photos.length) % photos.length));
    next.addEventListener("click", () => goTo((current() + 1) % photos.length));

    track.addEventListener("scroll", markActive, { passive: true });

    // Keeps the dots right when the window is resized or a filtered card comes back
    if ("ResizeObserver" in window) new ResizeObserver(markActive).observe(track);

    markActive();
  });
})();
