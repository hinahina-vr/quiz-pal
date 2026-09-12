(() => {
  const liteMode = window.matchMedia("(max-width: 980px), (pointer: coarse), (prefers-reduced-motion: reduce)").matches;
  window.__quizZenLiteMode = liteMode;
  document.documentElement.dataset.motion = liteMode ? "lite" : "full";
  document.documentElement.dataset.performance = liteMode ? "mobile" : "desktop";
  try {
    const savedTheme = localStorage.getItem("quiz-zen-visual-theme-v1");
    document.documentElement.dataset.theme = ["fantasy", "mediterranean", "okinawa", "hokkaido", "halloween", "new-year", "christmas", "hanami", "event-horizon"].includes(savedTheme)
      ? savedTheme
      : "mediterranean";
    const savedMotion = localStorage.getItem("quiz-zen-theme-motion-v1");
    document.documentElement.dataset.themeMotion = liteMode
      ? "off"
      : savedMotion
        ? savedMotion === "off" ? "off" : "on"
        : "off";
  } catch {
    document.documentElement.dataset.theme = "mediterranean";
    document.documentElement.dataset.themeMotion = "off";
  }
  if (liteMode) {
    window.__stage3dStatus = { ready: false, frame: 0, lite: true, error: null };
  }
  // 初回の会話画像をCSS・フォントの後まで待たせない。拡大時には元のPNGを使う。
  try {
    if (localStorage.getItem("quiz-zen-product-intro-do-not-show") !== "true") {
      const preload = document.createElement("link");
      preload.rel = "preload"; preload.as = "image"; preload.fetchPriority = "high";
      preload.href = "./guide-captures/ai-conversation-preview.webp";
      document.head.append(preload);
    }
  } catch { /* 保存領域が使えなくても、通常の画像読込で表示できます。 */ }
  const visibility = () => { document.documentElement.dataset.pageHidden = String(document.hidden); };
  document.addEventListener("visibilitychange", visibility);
  visibility();
})();
