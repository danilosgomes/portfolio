(() => {
  const button = document.querySelector(".back-to-top");
  if (!button) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function updateVisibility() {
    const visible = window.scrollY > 360;
    button.classList.toggle("is-visible", visible);
    button.tabIndex = visible ? 0 : -1;
  }

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
  });

  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
})();