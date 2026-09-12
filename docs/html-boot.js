(() => {
  "use strict";
  const entryUrl = new URL("./index.html", location.href);
  const directoryUrl = new URL("./", entryUrl);
  const route = () => location.hash.match(/^#\/(quiz|studio|legal)(?::(.*))?$/);
  const view = route()?.[1] || "quiz";
  const localFileEdition = location.protocol === "file:";
  const page = window.__quizPalHtmlPages?.[view];
  window.quizPalStandalone = Object.freeze({ view, entryUrl: entryUrl.href });

  function viewUrl(nextView, anchor = "") {
    const url = new URL(entryUrl);
    url.hash = `/${nextView}${anchor ? ":" + encodeURIComponent(anchor) : ""}`;
    return url.href;
  }

  function rewriteLinks(root) {
    const callout = root.querySelector('.legal-portable-callout:not([data-html-edition])');
    if (callout) {
      callout.dataset.htmlEdition = "true";
      callout.setAttribute("aria-label", "HTML共通版の案内");
      callout.querySelector("small").textContent = "WINDOWS / MAC / LINUX";
      callout.querySelector("p").textContent = "ZIPを展開し、index.html をブラウザで開きます。EXE・Node.js・ローカルサーバーは不要です。";
      const link = callout.querySelector("a");
      link.href = localFileEdition ? "./README.html" : "./downloads/Quiz-Pal-HTML.zip";
      link.textContent = localFileEdition ? "HTML版の使い方 ↗" : "HTML共通版をダウンロード ↓";
      if (!localFileEdition) { link.setAttribute("download", "Quiz-Pal-HTML.zip"); link.removeAttribute("target"); }
    }
    for (const promo of root.querySelectorAll('.portable-promo:not([data-html-edition])')) {
      promo.dataset.htmlEdition = "true";
      promo.setAttribute("href", localFileEdition ? "./README.html" : "./downloads/Quiz-Pal-HTML.zip");
      if (!localFileEdition) { promo.setAttribute("download", "Quiz-Pal-HTML.zip"); promo.removeAttribute("target"); }
      promo.setAttribute("aria-label", localFileEdition ? "HTML共通版の使い方と保存について" : "インストール不要のHTML共通版をダウンロードする");
      const label = promo.querySelector(".portable-promo-copy small");
      const title = promo.querySelector(".portable-promo-copy strong");
      const subtitle = promo.querySelector(".portable-promo-copy em");
      if (label) label.textContent = "WINDOWS / MAC / LINUX";
      if (title) title.textContent = localFileEdition ? "HTML版を使っています" : "このアプリを持ち帰る";
      if (subtitle) subtitle.textContent = localFileEdition ? "使い方・保存・引っ越しの案内" : "ZIPを展開してHTMLを開く";
    }
    for (const link of root.querySelectorAll("a[href]")) {
      const value = link.getAttribute("href");
      if (!value || value.startsWith("#")) continue;
      let url;
      try { url = new URL(value, entryUrl); } catch { continue; }
      if (url.protocol !== entryUrl.protocol || url.host !== entryUrl.host) continue;
      const destinations = new Map([
        [directoryUrl.pathname, "quiz"],
        [new URL("studio.html", directoryUrl).pathname, "studio"],
        [new URL("legal.html", directoryUrl).pathname, "legal"],
      ]);
      const destination = destinations.get(url.pathname);
      if (destination) link.href = viewUrl(destination, url.hash.slice(1));
    }
  }

  function fail(error) {
    document.body.inert = false;
    delete document.body.dataset.htmlLoading;
    document.body.className = "";
    const section = document.createElement("section");
    section.className = "html-boot-error";
    const heading = document.createElement("h1"); heading.textContent = "このブラウザでは起動できませんでした";
    const message = document.createElement("p");
    message.textContent = "ZIPをすべて展開し、フォルダー内の index.html を通常のブラウザウィンドウで開いてください。保存が制限されている場合は、Chrome・Edge・Firefoxなど別のブラウザをお試しください。";
    const detail = document.createElement("p"); detail.textContent = error?.message || String(error);
    const help = document.createElement("a"); help.href = "./README.html"; help.textContent = "HTML版の使い方と保存について";
    section.append(heading, message, detail, help);
    document.body.replaceChildren(section);
    document.title = "起動の確認 | Quiz Pal";
  }

  async function checkStorage() {
    const key = "quiz-pal-html-storage-check";
    const previous = localStorage.getItem(key);
    localStorage.setItem(key, "ok");
    if (localStorage.getItem(key) !== "ok") throw new Error("ブラウザへの保存が許可されていません。");
    if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("quiz-pal-html-storage-check-v1", 1);
      const timeout = setTimeout(() => reject(new Error("ブラウザの保存機能が応答しません。")), 8000);
      request.onerror = () => { clearTimeout(timeout); reject(new Error("教材の保存領域を開けません。ブラウザの保存設定を確認してください。")); };
      request.onsuccess = () => {
        clearTimeout(timeout); request.result.close();
        indexedDB.deleteDatabase("quiz-pal-html-storage-check-v1"); resolve();
      };
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src; script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`ファイルを読み込めません：${src}。ZIPをもう一度すべて展開してください。`));
      document.head.append(script);
    });
  }

  async function start() {
    if (!page) throw new Error("画面データが見つかりません。ZIPをすべて展開してください。");
    // Fetch independent scripts together, then execute them in their original order.
    if (location.protocol !== "file:") for (const source of page.scripts) {
      const preload = document.createElement("link");
      preload.rel = "preload"; preload.as = "script"; preload.href = source;
      document.head.append(preload);
    }
    if (view === "quiz" && !localStorage.getItem("quiz-zen-product-intro-version")) {
      const hero = document.createElement("link");
      hero.rel = "preload"; hero.as = "image"; hero.href = "./intro-art/mascot-before-after-v2.webp";
      document.head.append(hero);
    }
    await checkStorage();
    const scripts = [...page.scripts];
    // Apply the saved theme before CSS can request the default background.
    if (/\/(?:quiz|theme)-bootstrap\.js/.test(scripts[0] || "")) await loadScript(scripts.shift());
    if (!route()) history.replaceState(null, "", viewUrl(view));
    document.title = page.title;
    const head = document.createElement("template");
    head.innerHTML = page.head;
    const stylesReady = Promise.all([...head.content.querySelectorAll('link[rel="stylesheet"]')].map(link => new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = () => reject(new Error(`表示用ファイルを読み込めません：${link.getAttribute("href")}`));
    })));
    document.head.append(head.content);
    await stylesReady;
    const loading = document.querySelector(".html-boot-loading");
    document.body.dataset.htmlLoading = "true";
    document.body.inert = true;
    document.body.className = page.bodyClass;
    document.body.innerHTML = page.body;
    if (loading) document.body.append(loading);
    rewriteLinks(document.body);
    new MutationObserver(() => rewriteLinks(document.body)).observe(document.body, { subtree: true, childList: true });
    window.addEventListener("hashchange", () => {
      const next = route();
      if (next && next[1] !== view) location.reload();
      else if (!next) {
        // Keep legacy in-page anchors and the Studio tour on the same HTML file/view.
        const anchor = location.hash.slice(1);
        const target = document.getElementById(anchor);
        history.replaceState(null, "", viewUrl(view, target ? anchor : ""));
        target?.scrollIntoView();
      }
    });
    for (const script of scripts) await loadScript(script);
    document.body.inert = false;
    delete document.body.dataset.htmlLoading;
    loading?.remove();
    const anchor = route()?.[2];
    if (anchor) document.getElementById(decodeURIComponent(anchor))?.scrollIntoView();
    document.documentElement.dataset.htmlReady = view;
  }
  start().catch(fail);
})();
