(() => {
  "use strict";

  const STORAGE_KEY = "quiz-pal-main-guide-hidden";
  const TOUR_VERSION = 2;
  const steps = [
    {
      target: "courses",
      label: "学ぶものを選ぶ",
      title: "科目を選びます",
      body: "左側の科目名を押すと、学習する教材を切り替えられます。選んだ科目のセクションが下に表示されます。",
    },
    {
      target: "chapters",
      label: "範囲を選ぶ",
      title: "セクションを選びます",
      body: "学びたいセクションを選びます。回答状況や正答率もここで確認できます。",
    },
    {
      target: "quiz",
      label: "問題を解く",
      title: "問題文を読み、5択から回答",
      body: "問題文を読んで選択肢を押してください。結果と解説を確認したら「次へ」で進みます。前後の問題へ戻ることもできます。",
    },
    {
      target: "llm",
      label: "わからないとき",
      title: "わかるまで、AIに聞き直せます",
      body: "問題画面の「AIにきく」を押すと「教えて LLM」が開きます。解説を読んだ後も、パネル下の入力欄から「もっと簡単に」「別の例で」と続けて質問できます。AI機能の利用にはAPIキーの登録が必要です。初回は設定から接続先・モデル・キーを登録してください。",
    },
    {
      target: "images",
      label: "図解を手元に",
      title: "外部で作った画像を保存します",
      body: "「解説画像」→「画像を追加」で、外部の画像生成AIなどで作った図解を選びます。画像を押すと拡大でき、再読込しても残ります。画像の保存・閲覧はAPIキー不要。別の端末へ移すときは、画像ごとセーブ・ロードしてください。",
    },
    {
      target: "tools",
      label: "学習を整える",
      title: "絞込み・実績・テーマを操作",
      body: "間違えた問題や未回答だけに絞ったり、学習実績を確認したり、画面テーマを変更したりできます。",
    },
    {
      target: "studio",
      label: "教材を編集する",
      title: "問題をつくる・なおす",
      body: "科目・セクション・問題の追加や編集、AI作成、CSV取込はこの入口から教材管理画面へ進みます。AI作成を利用するにはAPIキーの登録が必要です。",
    },
    {
      target: "data",
      label: "データを守る",
      title: "全データをセーブ・ロード",
      body: "教材・学習履歴・設定・解説画像をまとめて書き出し、別の端末や復旧時にロードできます。データはブラウザー内に保存されるため、移動や更新の前にセーブしてください。APIキーは書き出されません。",
    },
    {
      target: "guide",
      label: "いつでも確認",
      title: "困ったらガイドをもう一度",
      body: "ツールバーの「ガイド」で、この操作案内をいつでも開けます。アプリの紹介を見直すときは「紹介」を押してください。",
    },
  ];

  let layer = null;
  let card = null;
  let spotlight = null;
  let index = 0;
  let activeTarget = null;
  let previousFocus = null;
  let previousScrollY = 0;
  let previousContainerScroll = [];
  let updateTimer = 0;

  const findVisibleTarget = (targetId) => {
    const candidates = [...document.querySelectorAll(`[data-quiz-tour-id="${targetId}"]`)];
    return candidates.find((target) => {
      const rect = target.getBoundingClientRect();
      const style = getComputedStyle(target);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }) || candidates[0] || null;
  };

  // Only an explicit opt-out suppresses automatic entry; manual Guide remains available.
  const isHidden = () => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; }
    catch { return false; }
  };
  const rememberPreference = (checked) => {
    try {
      if (checked) localStorage.setItem(STORAGE_KEY, "true");
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* The walkthrough remains usable without persistent storage. */ }
  };

  const positionCard = (rect) => {
    if (!card) return;

  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  const inset = 10, gap = 16;
  const clamp = (v, min, max) => Math.max(min, Math.min(v, Math.max(min, max)));
  card.style.width = Math.min(480, vw - inset * 2) + "px";
  card.style.maxHeight = (vh - inset * 2) + "px";
  card.style.right = "auto";
  card.style.bottom = "auto";
  const r = rect ? {left: clamp(rect.left, inset, vw-inset), right: clamp(rect.right, inset, vw-inset), top: clamp(rect.top, inset, vh-inset), bottom: clamp(rect.bottom, inset, vh-inset)} : null;
  let measured = card.getBoundingClientRect();
  if (r && r.left - inset < measured.width + gap && vw - inset - r.right < measured.width + gap) {
    const verticalSpace = Math.max(r.top - inset - gap, vh - inset - r.bottom - gap);
    if (verticalSpace >= 160 && verticalSpace < measured.height) {
      card.style.maxHeight = verticalSpace + "px";
      measured = card.getBoundingClientRect();
    }
  }
  const w = measured.width, h = measured.height;
  let left = (vw-w)/2, top = (vh-h)/2;
  if (r) {
    const cx = (r.left+r.right)/2, cy = (r.top+r.bottom)/2;
    const candidates = [[r.right+gap,cy-h/2], [cx-w/2,r.bottom+gap], [r.left-gap-w,cy-h/2], [cx-w/2,r.top-gap-h]];
    const ranked = candidates.map(([x,y]) => {
      const l=clamp(x,inset,vw-w-inset), t=clamp(y,inset,vh-h-inset);
      const overlap=Math.max(0,Math.min(l+w,r.right+7)-Math.max(l,r.left-7))*Math.max(0,Math.min(t+h,r.bottom+7)-Math.max(t,r.top-7));
      return {left:l,top:t,score:overlap*1000+Math.abs(l-x)+Math.abs(t-y)};
    }).sort((a,b)=>a.score-b.score);
    ({left,top}=ranked[0]);
  }
  card.style.left = clamp(left,inset,vw-w-inset) + "px";
  card.style.top = clamp(top,inset,vh-h-inset) + "px";
  };

  const updateLayout = () => {
    if (!layer || !card || !spotlight) return;
    const rect = activeTarget?.getBoundingClientRect() || null;
    if (!rect) {
      spotlight.hidden = true;
      positionCard(null);
      return;
    }
    const left = Math.max(8, Math.min(window.innerWidth - 8, rect.left - 7));
    const top = Math.max(8, Math.min(window.innerHeight - 8, rect.top - 7));
    spotlight.style.left = `${left}px`;
    spotlight.style.top = `${top}px`;
    spotlight.style.width = `${Math.max(0, Math.min(window.innerWidth - 8, rect.right + 7) - left)}px`;
    spotlight.style.height = `${Math.max(0, Math.min(window.innerHeight - 8, rect.bottom + 7) - top)}px`;
    spotlight.hidden = rect.width <= 0 || rect.height <= 0;
    positionCard(rect);
  };

  const renderStep = () => {
    if (!layer || !card) return;
    const step = steps[index];
    activeTarget = findVisibleTarget(step.target);
    activeTarget?.scrollIntoView?.({ block: "center", inline: "nearest", behavior: "auto" });

    card.querySelector(".quiz-tour-progress").innerHTML = `<b>${String(index + 1).padStart(2, "0")}</b> / ${String(steps.length).padStart(2, "0")}`;
    card.querySelector(".quiz-tour-step-number").textContent = String(index + 1);
    card.querySelector(".quiz-tour-label").textContent = step.label;
    card.querySelector(".quiz-tour-title").textContent = step.title;
    card.querySelector(".quiz-tour-body").textContent = step.body;
    card.querySelector(".quiz-tour-back").disabled = index === 0;
    card.querySelector(".quiz-tour-next").textContent = index === steps.length - 1 ? "使ってみる" : "次へ";
    card.querySelectorAll(".quiz-tour-dot").forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
      dot.classList.toggle("done", dotIndex < index);
    });

    window.clearTimeout(updateTimer);
    updateTimer = window.setTimeout(updateLayout, 80);
    card.querySelector(".quiz-tour-next")?.focus({ preventScroll: true });
  };

  const closeTour = () => {
    if (!layer) return;
    window.clearTimeout(updateTimer);
    window.removeEventListener("resize", updateLayout);
    window.removeEventListener("scroll", updateLayout, true);
    document.removeEventListener("keydown", handleKeydown);
    layer.remove();
    layer = null;
    card = null;
    spotlight = null;
    activeTarget = null;
    window.scrollTo({ top: previousScrollY, behavior: "auto" });
    previousContainerScroll.forEach(({ element, left, top }) => element.scrollTo({ left, top, behavior: "auto" }));
    previousContainerScroll = [];
    previousFocus?.focus?.({ preventScroll: true });
  };

  const handleKeydown = (event) => {
    if (!layer || !card) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeTour();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...card.querySelectorAll("button:not(:disabled), input:not(:disabled)")];
    if (!focusable.length) return;
    const current = focusable.indexOf(document.activeElement);
    const next = event.shiftKey
      ? (current <= 0 ? focusable.length - 1 : current - 1)
      : (current >= focusable.length - 1 ? 0 : current + 1);
    event.preventDefault();
    focusable[next].focus();
  };

  const openTour = () => {
    if (layer) return;
    previousFocus = document.activeElement;
    previousScrollY = window.scrollY;
    previousContainerScroll = [...document.querySelectorAll(".sidebar, .main")].map((element) => ({
      element,
      left: element.scrollLeft,
      top: element.scrollTop,
    }));
    index = 0;
    layer = document.createElement("div");
    layer.className = "quiz-tour-layer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-labelledby", "quizTourTitle");
    layer.setAttribute("aria-describedby", "quizTourBody");
    layer.innerHTML = `
      <div class="quiz-tour-spotlight" aria-hidden="true"></div>
      <div class="quiz-tour-card" aria-live="polite">
        <div class="quiz-tour-accent" aria-hidden="true"></div>
        <header class="quiz-tour-card-header">
          <span class="quiz-tour-kicker">QUICK GUIDE</span>
          <span class="quiz-tour-progress"></span>
        </header>
        <div class="quiz-tour-title-row">
          <span class="quiz-tour-step-number" aria-hidden="true"></span>
          <div><span class="quiz-tour-label"></span><h2 class="quiz-tour-title" id="quizTourTitle"></h2></div>
        </div>
        <p class="quiz-tour-body" id="quizTourBody"></p>
        <div class="quiz-tour-dots" aria-hidden="true">${steps.map(() => '<span class="quiz-tour-dot"></span>').join("")}</div>
        <label class="quiz-tour-opt-out"><input type="checkbox" id="quizGuideDoNotShow">もう表示しない<small>自動表示のみ</small></label>
        <footer class="quiz-tour-actions">
          <button class="quiz-tour-skip" type="button">スキップ</button>
          <span></span>
          <button class="quiz-tour-back" type="button">戻る</button>
          <button class="quiz-tour-next" type="button">次へ</button>
        </footer>
      </div>`;
    document.body.appendChild(layer);
    card = layer.querySelector(".quiz-tour-card");
    spotlight = layer.querySelector(".quiz-tour-spotlight");
    const optOut = card.querySelector("#quizGuideDoNotShow");
    optOut.checked = isHidden();
    optOut.addEventListener("change", () => rememberPreference(optOut.checked));
    card.querySelector(".quiz-tour-skip").addEventListener("click", closeTour);
    card.querySelector(".quiz-tour-back").addEventListener("click", () => {
      if (index > 0) index -= 1;
      renderStep();
    });
    card.querySelector(".quiz-tour-next").addEventListener("click", () => {
      if (index === steps.length - 1) closeTour();
      else {
        index += 1;
        renderStep();
      }
    });
    window.addEventListener("resize", updateLayout);
    document.fonts?.ready.then(() => { if (layer) updateLayout(); });
    window.addEventListener("scroll", updateLayout, true);
    document.addEventListener("keydown", handleKeydown);
    renderStep();
  };

  const guideButton = document.getElementById("quizGuideButton");
  guideButton?.addEventListener("click", openTour);
  document.getElementById("quizIntroButton")?.addEventListener("click", () => window.quizZenIntro?.open());

  // Automatic first-run presentation is owned by product-intro.js.
  // The completed presentation starts this walkthrough; its footer also offers direct access.

  window.quizZenGuide = { open: openTour, openAutomatically: () => { if (!isHidden()) openTour(); }, version: TOUR_VERSION };
})();

// Fit compact-PC labels to their actual tracks, including long user-created titles.
(() => {
  const compact = matchMedia('(min-width: 981px) and (max-width: 1280px) and (pointer: fine)');
  const selector = '.sidebar .course-tab-label, .sidebar .sidebar-data-button-copy strong, .sidebar .maintenance-entry-copy strong, .topbar .chapter-heading h2';
  let frame = 0;
  function fit() {
    frame = 0;
    for (const node of document.querySelectorAll(selector)) {
      node.style.removeProperty('font-size');
      if (!compact.matches || !node.clientWidth) continue;
      const base = parseFloat(getComputedStyle(node).fontSize);
      if (node.scrollWidth > node.clientWidth) {
        const size = Math.max(9, Math.floor(base * node.clientWidth / node.scrollWidth * 10) / 10);
        node.style.setProperty('font-size', `${size}px`, 'important');
      }
    }
  }
  const queue = () => { if (!frame) frame = requestAnimationFrame(fit); };
  new MutationObserver(queue).observe(document.querySelector('.app-shell'), { childList: true, subtree: true, characterData: true });
  window.addEventListener('resize', queue);
  compact.addEventListener('change', queue);
  document.fonts?.ready.then(queue);
  queue();
})();
