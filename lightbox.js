(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Visualização ampliada da imagem");
  dialog.innerHTML = `
    <div class="lightbox-shell">
      <button class="lightbox-button lightbox-close" type="button" aria-label="Fechar visualização" title="Fechar (Esc)">×</button>
      <button class="lightbox-button lightbox-prev" type="button" aria-label="Imagem anterior" title="Anterior (←)">‹</button>
      <button class="lightbox-button lightbox-next" type="button" aria-label="Próxima imagem" title="Próxima (→)">›</button>
      
      <div class="lightbox-media-wrapper">
        <img class="lightbox-image" alt="" draggable="false" />
      </div>

      <div class="lightbox-counter" aria-live="polite"></div>

      <div class="lightbox-zoom-bar">
        <button class="lightbox-zoom-btn lightbox-zoom-out" type="button" aria-label="Diminuir zoom" title="Diminuir zoom (−)">−</button>
        <button class="lightbox-zoom-btn lightbox-zoom-reset" type="button" aria-label="Redefinir zoom" title="Redefinir zoom (100%)">
          <span class="lightbox-zoom-level">100%</span>
        </button>
        <button class="lightbox-zoom-btn lightbox-zoom-in" type="button" aria-label="Aumentar zoom" title="Aumentar zoom (+)">+</button>
      </div>

      <div class="lightbox-hint">Scroll para zoom · Arraste para navegar</div>
    </div>
  `;
  document.body.append(dialog);

  const image = dialog.querySelector(".lightbox-image");
  const counter = dialog.querySelector(".lightbox-counter");
  const closeButton = dialog.querySelector(".lightbox-close");
  const prevButton = dialog.querySelector(".lightbox-prev");
  const nextButton = dialog.querySelector(".lightbox-next");
  const zoomInBtn = dialog.querySelector(".lightbox-zoom-in");
  const zoomOutBtn = dialog.querySelector(".lightbox-zoom-out");
  const zoomResetBtn = dialog.querySelector(".lightbox-zoom-reset");
  const zoomLevelEl = dialog.querySelector(".lightbox-zoom-level");
  const hintEl = dialog.querySelector(".lightbox-hint");

  let images = [];
  let currentIndex = 0;
  let closingTimer = null;
  let hintTimer = null;

  // Zoom & Pan state
  let scale = 1;
  const minScale = 1;
  const maxScale = 5;
  let translateX = 0;
  let translateY = 0;

  // Drag state
  let isPointerDown = false;
  let startX = 0;
  let startY = 0;
  let startTx = 0;
  let startTy = 0;
  let hasDragged = false;

  function updateZoomUI() {
    const percent = Math.round(scale * 100);
    if (zoomLevelEl) zoomLevelEl.textContent = `${percent}%`;
    if (zoomOutBtn) {
      zoomOutBtn.disabled = scale <= minScale;
      zoomOutBtn.classList.toggle("is-disabled", scale <= minScale);
    }
    if (zoomInBtn) {
      zoomInBtn.disabled = scale >= maxScale;
      zoomInBtn.classList.toggle("is-disabled", scale >= maxScale);
    }
  }

  function applyTransform(animate = false) {
    if (animate) {
      image.style.transition = "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)";
    } else {
      image.style.transition = "none";
    }
    image.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    if (scale > 1) {
      image.style.cursor = isPointerDown ? "grabbing" : "grab";
    } else {
      image.style.cursor = "zoom-in";
    }

    updateZoomUI();
  }

  function clampTranslation() {
    if (scale <= 1) {
      translateX = 0;
      translateY = 0;
      return;
    }

    const baseWidth = image.offsetWidth || 1;
    const baseHeight = image.offsetHeight || 1;
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 80;

    let maxX = 0;
    if (scaledWidth > viewportWidth) {
      maxX = (scaledWidth - viewportWidth) / 2 + margin;
    } else {
      maxX = Math.max(0, (viewportWidth - scaledWidth) / 4);
    }

    let maxY = 0;
    if (scaledHeight > viewportHeight) {
      maxY = (scaledHeight - viewportHeight) / 2 + margin;
    } else {
      maxY = Math.max(0, (viewportHeight - scaledHeight) / 4);
    }

    translateX = Math.min(Math.max(translateX, -maxX), maxX);
    translateY = Math.min(Math.max(translateY, -maxY), maxY);
  }

  function resetZoom(animate = true) {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform(animate);
  }

  function zoomTo(targetScale, clientX, clientY, animate = true) {
    const rect = image.getBoundingClientRect();
    const oldScale = scale;
    let newScale = Math.min(Math.max(targetScale, minScale), maxScale);

    if (Math.abs(newScale - 1) < 0.05) {
      newScale = 1;
    }

    if (newScale === 1) {
      resetZoom(animate);
      return;
    }

    const targetX = clientX !== undefined ? clientX : rect.left + rect.width / 2;
    const targetY = clientY !== undefined ? clientY : rect.top + rect.height / 2;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = targetX - centerX;
    const offsetY = targetY - centerY;

    const scaleRatio = newScale / oldScale;
    translateX -= offsetX * (scaleRatio - 1);
    translateY -= offsetY * (scaleRatio - 1);

    scale = newScale;
    clampTranslation();
    applyTransform(animate);
  }

  function handleWheel(event) {
    if (!dialog.open) return;
    event.preventDefault();

    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    hideHint();

    const oldScale = scale;
    const delta = -event.deltaY;
    const zoomSpeed = event.ctrlKey ? 0.01 : 0.002;
    const factor = Math.exp(delta * zoomSpeed);
    let newScale = scale * factor;

    newScale = Math.min(Math.max(newScale, minScale), maxScale);

    if (newScale < 1.05 && factor < 1) {
      newScale = 1;
    }

    if (newScale === oldScale) return;

    if (newScale === 1) {
      resetZoom(true);
      return;
    }

    const imageCenterX = rect.left + rect.width / 2;
    const imageCenterY = rect.top + rect.height / 2;

    let mouseOffsetX = 0;
    let mouseOffsetY = 0;
    if (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      mouseOffsetX = event.clientX - imageCenterX;
      mouseOffsetY = event.clientY - imageCenterY;
    }

    const scaleRatio = newScale / oldScale;
    translateX -= mouseOffsetX * (scaleRatio - 1);
    translateY -= mouseOffsetY * (scaleRatio - 1);

    scale = newScale;
    clampTranslation();
    applyTransform(false);
  }

  function hideHint() {
    if (hintEl && !hintEl.classList.contains("is-hidden")) {
      hintEl.classList.add("is-hidden");
    }
  }

  function showHint() {
    clearTimeout(hintTimer);
    if (hintEl) {
      hintEl.classList.remove("is-hidden");
      hintTimer = setTimeout(() => {
        hideHint();
      }, 3200);
    }
  }

  function collectImages() {
    // Collect ONLY the process gallery images (section 3 / marquee)
    const allFigures = [
      ...document.querySelectorAll(".study-page .process-group-primary .process-frame.has-image")
    ];
    const uniqueImgs = [];
    const seenSrcs = new Set();
    allFigures.forEach((fig) => {
      const img = fig.querySelector("img");
      if (img && (img.currentSrc || img.src)) {
        const key = img.getAttribute("src") || img.src;
        if (!seenSrcs.has(key)) {
          seenSrcs.add(key);
          uniqueImgs.push(img);
        }
      }
    });
    images = uniqueImgs;
  }

  function showImage(index) {
    if (!images.length) return;
    currentIndex = (index + images.length) % images.length;
    const source = images[currentIndex];

    resetZoom(false);
    image.classList.remove("is-ready");
    image.src = source.currentSrc || source.src;
    image.alt = source.alt || "Imagem do processo";

    const altText = source.alt || "Imagem do processo";
    counter.textContent = images.length > 1 ? `${altText} · ${currentIndex + 1} de ${images.length}` : altText;

    const showNav = images.length > 1;
    prevButton.style.display = showNav ? "" : "none";
    nextButton.style.display = showNav ? "" : "none";
  }

  function openLightbox(source) {
    collectImages();
    let index = images.indexOf(source);

    if (index < 0) {
      const src = source.getAttribute("src") || source.src;
      index = images.findIndex((img) => (img.getAttribute("src") || img.src) === src);
    }

    if (index < 0) {
      // If image is not in process gallery, do NOT open
      return;
    }

    clearTimeout(closingTimer);
    showImage(index);
    document.body.classList.add("is-lightbox-open");
    dialog.showModal();
    showHint();

    requestAnimationFrame(() => {
      dialog.classList.add("is-open");
      closeButton.focus({ preventScroll: true });
    });
  }

  function closeLightbox() {
    if (!dialog.open) return;
    dialog.classList.remove("is-open");
    document.body.classList.remove("is-lightbox-open");
    resetZoom(false);
    hideHint();
    closingTimer = window.setTimeout(() => {
      dialog.close();
      image.removeAttribute("src");
    }, 280);
  }

  // Pointer event listeners for pan/drag
  dialog.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest("button") || event.target.closest(".lightbox-zoom-bar")) return;

    isPointerDown = true;
    hasDragged = false;
    startX = event.clientX;
    startY = event.clientY;
    startTx = translateX;
    startTy = translateY;

    if (scale > 1) {
      dialog.setPointerCapture(event.pointerId);
      image.style.cursor = "grabbing";
      image.style.transition = "none";
    }
  });

  dialog.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (Math.hypot(dx, dy) > 5) {
      hasDragged = true;
      hideHint();
    }

    if (scale > 1) {
      event.preventDefault();
      translateX = startTx + dx;
      translateY = startTy + dy;
      clampTranslation();
      applyTransform(false);
    }
  });

  function endPointer(event) {
    if (!isPointerDown) return;
    isPointerDown = false;
    try {
      if (dialog.hasPointerCapture(event.pointerId)) {
        dialog.releasePointerCapture(event.pointerId);
      }
    } catch (e) {}

    if (scale > 1) {
      image.style.cursor = "grab";
    } else {
      image.style.cursor = "zoom-in";
    }
  }

  dialog.addEventListener("pointerup", endPointer);
  dialog.addEventListener("pointercancel", endPointer);

  // Wheel event for zooming
  dialog.addEventListener("wheel", handleWheel, { passive: false });

  // Double-click to toggle zoom
  image.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideHint();
    if (scale > 1) {
      resetZoom(true);
    } else {
      zoomTo(2.5, event.clientX, event.clientY, true);
    }
  });

  // Zoom control buttons
  zoomInBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hideHint();
    zoomTo(scale * 1.3, undefined, undefined, true);
  });

  zoomOutBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hideHint();
    zoomTo(scale / 1.3, undefined, undefined, true);
  });

  zoomResetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hideHint();
    resetZoom(true);
  });

  // Prev / Next buttons
  prevButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showImage(currentIndex - 1);
  });

  nextButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showImage(currentIndex + 1);
  });

  closeButton.addEventListener("click", closeLightbox);

  // Click on backdrop to close
  dialog.addEventListener("click", (event) => {
    if (hasDragged) return;
    if (
      event.target === dialog ||
      event.target.classList.contains("lightbox-shell") ||
      event.target.classList.contains("lightbox-media-wrapper")
    ) {
      closeLightbox();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLightbox();
  });

  // Global click on images to open lightbox — ONLY for process gallery frames
  document.addEventListener("click", (event) => {
    // Explicitly reject hero and showcase images above section 1
    if (event.target.closest(".study-hero, .study-hero-media, .study-showcase, .showcase-stack, .showcase-caption-section")) {
      return;
    }

    const source = event.target.closest(
      ".study-page .process-strip .process-frame.has-image img"
    );
    if (source) {
      openLightbox(source);
    }
  });

  // Keyboard controls
  document.addEventListener("keydown", (event) => {
    if (event.target.closest(".study-hero, .study-hero-media, .study-showcase, .showcase-stack")) {
      return;
    }

    const figure = event.target.closest?.(
      ".study-page .process-group-primary .process-frame.has-image"
    );
    if (figure && !dialog.open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      const img = figure.querySelector("img");
      if (img) openLightbox(img);
      return;
    }

    if (!dialog.open) return;

    if (event.key === "Escape") {
      if (scale > 1) {
        resetZoom(true);
        event.preventDefault();
      } else {
        closeLightbox();
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (scale > 1) {
        translateX += 60;
        clampTranslation();
        applyTransform(true);
      } else {
        showImage(currentIndex - 1);
      }
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (scale > 1) {
        translateX -= 60;
        clampTranslation();
        applyTransform(true);
      } else {
        showImage(currentIndex + 1);
      }
    } else if (event.key === "ArrowUp" && scale > 1) {
      event.preventDefault();
      translateY += 60;
      clampTranslation();
      applyTransform(true);
    } else if (event.key === "ArrowDown" && scale > 1) {
      event.preventDefault();
      translateY -= 60;
      clampTranslation();
      applyTransform(true);
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomTo(scale * 1.25, undefined, undefined, true);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomTo(scale / 1.25, undefined, undefined, true);
    } else if (event.key === "0") {
      event.preventDefault();
      resetZoom(true);
    }
  });

  // Window resize handler to maintain bounds
  window.addEventListener("resize", () => {
    if (dialog.open && scale > 1) {
      clampTranslation();
      applyTransform(false);
    }
  });
})();

function enhanceLightboxFigures() {
  // Ensure hero and showcase images above section 1 never get button attributes
  document.querySelectorAll(".study-page .study-hero-media, .study-page .study-showcase .has-image, .study-page .showcase-stack .has-image").forEach((figure) => {
    figure.removeAttribute("tabindex");
    figure.removeAttribute("role");
    figure.removeAttribute("aria-label");
  });

  // Only enhance process strip frames
  document.querySelectorAll(".study-page .process-group-primary .process-frame.has-image").forEach((figure) => {
    if (figure.hasAttribute("tabindex")) return;
    figure.tabIndex = 0;
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-label", `Ampliar ${figure.querySelector("img")?.alt || "imagem"}`);
  });
}

const lightboxMain = document.querySelector("#main");
if (lightboxMain) {
  new MutationObserver(enhanceLightboxFigures).observe(lightboxMain, { childList: true, subtree: true });
  enhanceLightboxFigures();
}
