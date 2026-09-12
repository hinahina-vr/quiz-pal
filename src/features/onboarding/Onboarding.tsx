import { useEffect, useRef, useState } from "native-ui";
import { db } from "../../db/database";

import { positionTourCard } from "./positionTourCard";

const TOUR_VERSION = 4;
const steps = [
  {
    target: "library-choice",
    label: "まずはここから",
    title: "教材管理へようこそ",
    body: "この画面では、問題をAIと作ることも、自分で一つずつ編集することもできます。最初に作り方を選びましょう。",
  },
  {
    target: "ai-author",
    label: "AIで作る",
    title: "AIに相談して下書きを作る",
    body: "科目まるごと・セクション・問題の単位を選び、AIと対話しながら5択問題を作れます。AI機能の利用にはAPIキーの登録が必要です。内容は保存前に確認できます。",
  },
  {
    target: "manual-author",
    label: "自分で作る",
    title: "順番に手動で編集する",
    body: "科目、セクション、問題の順に一画面ずつ編集します。追加・削除・並べ替えもそれぞれの画面で行えます。",
  },
  {
    target: "data",
    label: "データを守る",
    title: "取込・保存・復元をまとめて管理",
    body: "CSVからの取込と、教材・学習履歴・設定を含む完全バックアップは「データ管理」から操作できます。",
  },
  {
    target: "practice",
    label: "問題を解く",
    title: "できた教材で学習する",
    body: "教材を作り終えたら「クイズへ戻る」から学習画面へ移動できます。編集内容はすぐに反映されます。",
  },
  {
    target: "guide",
    label: "いつでも確認",
    title: "困ったらガイドをもう一度",
    body: "この案内は初回だけ自動表示されます。あとで見直したいときは「ガイド」を押してください。",
  },
];

function findVisibleTarget(targetId: string) {
  const targets = [...document.querySelectorAll<HTMLElement>(`[data-tour-id="${targetId}"]`)];
  return targets.find((target) => {
    const rect = target.getBoundingClientRect();
    const style = getComputedStyle(target);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }) ?? targets[0] ?? null;
}

export function Onboarding({ force, onClose }: { force: boolean; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const previousScrollY = useRef<number | null>(null);

  useEffect(() => {
    void (async () => {
      const setting = await db.settings.get("onboardingCompletedVersion");
      if (force || Number(setting?.value ?? 0) < TOUR_VERSION) {
        if (!("quizPalStandalone" in window)) window.location.hash = "#/library";
        setIndex(0);
        setVisible(true);
      }
    })();
  }, [force]);

  useEffect(() => {
    if (!visible) return;
    previousFocus.current ??= document.activeElement as HTMLElement;
    previousScrollY.current ??= force ? window.scrollY : 0;
    const target = findVisibleTarget(steps[index].target);
    if (target && "scrollIntoView" in target) target.scrollIntoView({ block: "center", behavior: "auto" });
    let active = true;
    const update = () => {
      if (!active) return;
      const rect = target?.getBoundingClientRect() ?? null;
      if (cardRef.current) positionTourCard(cardRef.current, rect);
      setTargetRect(rect);
    };
    void document.fonts?.ready.then(update);
    const timer = window.setTimeout(update, 180);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.setTimeout(() => cardRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true }), 20);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [visible, index, force]);

  const finish = async () => {
    await db.settings.put({ key: "onboardingCompletedVersion", value: TOUR_VERSION });
    const returnFocus = previousFocus.current && previousFocus.current !== document.body
      ? previousFocus.current
      : document.querySelector<HTMLElement>(".brand");
    const returnScrollY = previousScrollY.current ?? 0;
    setVisible(false);
    onClose();
    requestAnimationFrame(() => {
      returnFocus?.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        void getComputedStyle(document.documentElement).scrollBehavior;
        window.scrollTo(0, returnScrollY);
        requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior = previousScrollBehavior;
          previousFocus.current = null;
          previousScrollY.current = null;
        });
      });
    });
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!visible) return;
      if (event.key === "Escape") {
        event.preventDefault();
        void finish();
        return;
      }
      if (event.key !== "Tab" || !cardRef.current) return;
      const focusable = [...cardRef.current.querySelectorAll<HTMLElement>("button:not(:disabled)")];
      if (!focusable.length) return;
      const current = focusable.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey
        ? (current <= 0 ? focusable.length - 1 : current - 1)
        : (current >= focusable.length - 1 ? 0 : current + 1);
      event.preventDefault();
      focusable[next].focus();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  if (!visible) return null;
  const step = steps[index];
  const spotLeft = targetRect ? Math.max(8, Math.min(window.innerWidth - 8, targetRect.left - 7)) : 8;
  const spotTop = targetRect ? Math.max(8, Math.min(window.innerHeight - 8, targetRect.top - 7)) : 8;

  return <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
    {targetRect && <div className="tour-spotlight" aria-hidden="true" style={{
      left: spotLeft,
      top: spotTop,
      width: Math.max(0, Math.min(window.innerWidth - 8, targetRect.right + 7) - spotLeft),
      height: Math.max(0, Math.min(window.innerHeight - 8, targetRect.bottom + 7) - spotTop),
    }} />}
    <div className="tour-card" ref={cardRef} aria-live="polite">
      <header className="tour-card-header">
        <span className="tour-kicker">QUICK GUIDE</span>
        <span className="tour-progress"><b>{String(index + 1).padStart(2, "0")}</b> / {String(steps.length).padStart(2, "0")}</span>
      </header>
      <div className="tour-title-row">
        <span className="tour-step-number" aria-hidden="true">{index + 1}</span>
        <div><span className="tour-label">{step.label}</span><h2 id="tour-title">{step.title}</h2></div>
      </div>
      <p id="tour-body">{step.body}</p>
      <div className="tour-dots" aria-hidden="true">{steps.map((_, stepIndex) => <span className={stepIndex === index ? "active" : stepIndex < index ? "done" : ""} key={stepIndex} />)}</div>
      <div className="tour-actions">
        <button type="button" className="text-button" onClick={() => void finish()}>スキップ</button>
        <span />
        <button type="button" className="secondary-button" disabled={index === 0} onClick={() => setIndex(index - 1)}>戻る</button>
        {index === steps.length - 1
          ? <button type="button" className="primary-button" onClick={() => void finish()}>使ってみる</button>
          : <button type="button" className="primary-button" onClick={() => setIndex(index + 1)}>次へ</button>}
      </div>
    </div>
  </div>;
}
