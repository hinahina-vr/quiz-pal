(() => {
  const themes = new Set([
    "fantasy",
    "mediterranean",
    "okinawa",
    "hokkaido",
    "halloween",
    "new-year",
    "christmas",
    "hanami",
    "event-horizon",
  ]);
  let storedTheme = null;
  try {
    storedTheme = localStorage.getItem("quiz-zen-visual-theme-v1");
  } catch {
    // Continue with the distribution default when storage is unavailable.
  }
  document.documentElement.dataset.theme = themes.has(storedTheme) ? storedTheme : "mediterranean";
})();
