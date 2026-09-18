(() => {
  const initialized = new WeakSet();

  function setupMarquee(marquee) {
    if (initialized.has(marquee)) return;

    const track = marquee.querySelector(".process-strip");
    const primaryGroup = marquee.querySelector(".process-group-primary");
    if (!track || !primaryGroup) return;

    initialized.add(marquee);

    let pointerId = null;
    let startX = 0;
    let lastX = 0;
    let moved = false;
    let animation = null;
    let suppressClickUntil = 0;

    function getTrackAnimation() {
      return track.getAnimations().find((item) => item.animationName === "process-gallery-scroll") || null;
    }

    function moveAnimation(deltaX) {
      if (!animation) {
        marquee.scrollLeft -= deltaX;
        return;
      }

      const timing = animation.effect?.getTiming();
      const duration = Number(timing?.duration);
      const distance = primaryGroup.getBoundingClientRect().width;
      if (!duration || !distance) return;

      const currentTime = Number(animation.currentTime || 0);
      const nextTime = currentTime - (deltaX * duration) / distance;
      animation.currentTime = ((nextTime % duration) + duration) % duration;
    }

    function finishDrag(event) {
      if (event.pointerId !== pointerId) return;

      if (marquee.hasPointerCapture(pointerId)) {
        marquee.releasePointerCapture(pointerId);
      }

      if (moved) suppressClickUntil = performance.now() + 350;
      marquee.classList.remove("is-dragging");
      pointerId = null;

      if (animation && !document.body.classList.contains("is-lightbox-open")) {
        animation.play();
      }
    }

    marquee.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !event.target.closest(".process-frame.has-image img")) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      lastX = event.clientX;
      moved = false;
      animation = getTrackAnimation();
    });

    marquee.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;

      const totalDistance = event.clientX - startX;
      const deltaX = event.clientX - lastX;

      if (!moved && Math.abs(totalDistance) > 5) {
        moved = true;
        animation?.pause();
        marquee.setPointerCapture(pointerId);
        marquee.classList.add("is-dragging");
      }

      if (moved) {
        event.preventDefault();
        moveAnimation(deltaX);
      }

      lastX = event.clientX;
    });

    marquee.addEventListener("pointerup", finishDrag);
    marquee.addEventListener("pointercancel", finishDrag);

    marquee.addEventListener("click", (event) => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
  }

  function initializeMarquees() {
    document.querySelectorAll(".process-marquee").forEach(setupMarquee);
  }

  const main = document.querySelector("#main");
  if (main) {
    new MutationObserver(initializeMarquees).observe(main, { childList: true, subtree: true });
  }

  initializeMarquees();
})();