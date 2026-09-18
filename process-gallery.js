(() => {
  const initialized = new WeakSet();

  function setupMarquee(marquee) {
    if (initialized.has(marquee)) return;

    const track = marquee.querySelector(".process-strip");
    const primaryGroup = marquee.querySelector(".process-group-primary");
    if (!track || !primaryGroup) return;

    initialized.add(marquee);

    // Cancel CSS animation so JavaScript has full, smooth control
    track.style.animation = "none";

    let currentX = 0;
    let isDragging = false;
    let velocity = 0;
    let moved = false;
    let suppressClickUntil = 0;
    let primaryWidth = primaryGroup.getBoundingClientRect().width || primaryGroup.offsetWidth || 1;
    let rafId = null;

    function updateWidth() {
      if (primaryGroup) {
        const w = primaryGroup.getBoundingClientRect().width || primaryGroup.offsetWidth;
        if (w > 0) primaryWidth = w;
      }
    }

    // Auto-scroll speed: approx 38px/s (negative = scroll left)
    const baseSpeed = -0.65;
    let lastFrameTime = performance.now();

    function renderTrack() {
      track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    }

    function wrapX() {
      if (primaryWidth <= 0) return;
      while (currentX <= -primaryWidth) {
        currentX += primaryWidth;
      }
      while (currentX > 0) {
        currentX -= primaryWidth;
      }
    }

    function tick(now) {
      if (!marquee.isConnected) {
        cancelAnimationFrame(rafId);
        return;
      }

      const dt = Math.min(now - lastFrameTime, 100);
      lastFrameTime = now;

      const isLightboxOpen = document.body.classList.contains("is-lightbox-open") || 
                             document.body.classList.contains("lightbox-open");

      if (!isDragging && !isLightboxOpen) {
        const frameScale = dt / 16.67;
        if (Math.abs(velocity) > 0.08) {
          // Coasting with momentum after user swipe
          currentX += velocity * frameScale;
          velocity *= Math.pow(0.92, frameScale);
        } else {
          // Continuous marquee auto-scroll
          velocity = 0;
          currentX += baseSpeed * frameScale;
        }

        wrapX();
        renderTrack();
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    // Update width on resize and when images finish loading
    window.addEventListener("resize", updateWidth, { passive: true });
    marquee.querySelectorAll("img").forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", updateWidth, { once: true });
      }
    });
    setTimeout(updateWidth, 300);

    // ==========================================
    // TOUCH HANDLING (Mobile with Directional Lock)
    // ==========================================
    let touchStartX = 0;
    let touchStartY = 0;
    let touchLastX = 0;
    let touchLastTime = 0;
    let touchDirection = null; // null | 'horizontal' | 'vertical'

    marquee.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      updateWidth();
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchLastX = t.clientX;
      touchLastTime = performance.now();
      touchDirection = null;
      velocity = 0;
      moved = false;
      isDragging = false;
    }, { passive: true });

    marquee.addEventListener("touchmove", (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Determine intent (horizontal swipe on images vs vertical page scroll)
      if (touchDirection === null) {
        if (absX < 7 && absY < 7) {
          return; // inside tap slop deadzone
        }
        if (absY >= absX) {
          touchDirection = "vertical"; // Scroll the PAGE vertically!
        } else {
          touchDirection = "horizontal"; // Swipe the CAROUSEL horizontally!
          isDragging = true;
          marquee.classList.add("is-dragging");
        }
      }

      if (touchDirection === "vertical") {
        // DO NOT call preventDefault!
        // The browser natively scrolls the page smoothly without getting stuck!
        return;
      }

      if (touchDirection === "horizontal") {
        // User wants to swipe images horizontally: prevent vertical page jumping
        e.preventDefault();
        moved = true;

        const deltaX = t.clientX - touchLastX;
        const now = performance.now();
        const dt = now - touchLastTime;

        currentX += deltaX;
        wrapX();
        renderTrack();

        if (dt > 0) {
          const currentVel = deltaX / (dt / 16.67);
          velocity = velocity * 0.3 + currentVel * 0.7;
        }

        touchLastX = t.clientX;
        touchLastTime = now;
      }
    }, { passive: false });

    function onTouchEnd() {
      if (touchDirection === "horizontal") {
        if (moved) {
          suppressClickUntil = performance.now() + 350;
        }
        if (Math.abs(velocity) > 30) {
          velocity = Math.sign(velocity) * 30;
        }
      } else {
        velocity = 0;
      }

      touchDirection = null;
      isDragging = false;
      marquee.classList.remove("is-dragging");
    }

    marquee.addEventListener("touchend", onTouchEnd, { passive: true });
    marquee.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // ==========================================
    // MOUSE DRAG HANDLING (Desktop)
    // ==========================================
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseLastX = 0;
    let mouseLastTime = 0;

    marquee.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isMouseDown = true;
      isDragging = true;
      moved = false;
      mouseStartX = e.clientX;
      mouseLastX = e.clientX;
      mouseLastTime = performance.now();
      velocity = 0;
      marquee.classList.add("is-dragging");
      updateWidth();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;
      const dist = Math.abs(e.clientX - mouseStartX);
      if (!moved && dist > 4) {
        moved = true;
      }

      if (moved) {
        const deltaX = e.clientX - mouseLastX;
        const now = performance.now();
        const dt = now - mouseLastTime;

        currentX += deltaX;
        wrapX();
        renderTrack();

        if (dt > 0) {
          const currentVel = deltaX / (dt / 16.67);
          velocity = velocity * 0.3 + currentVel * 0.7;
        }
      }

      mouseLastX = e.clientX;
      mouseLastTime = performance.now();
    });

    window.addEventListener("mouseup", () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      isDragging = false;
      marquee.classList.remove("is-dragging");

      if (moved) {
        suppressClickUntil = performance.now() + 350;
      }
      if (Math.abs(velocity) > 30) {
        velocity = Math.sign(velocity) * 30;
      }
    });

    // Suppress lightbox opening if the user was dragging/swiping
    marquee.addEventListener("click", (event) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
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