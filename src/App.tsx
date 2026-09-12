/**
 * 教材管理画面の入口。読み込んだ科目・問題のデータを各編集画面へ渡します。
 * 編集後はデータを読み直し、クイズ画面で使う形式へ同期して、作った教材をすぐ学習につなげます。
 */
import { lazy, Suspense, useCallback, useEffect, useState } from "native-ui";
import { syncLegacyDataset } from "./bridge/legacyDataset";
import { initializeDatabase, loadSnapshot } from "./db/database";
import type { LibrarySnapshot } from "./domain/types";
import { LibraryView } from "./features/library/LibraryView";
import { Onboarding } from "./features/onboarding/Onboarding";
import { applyStoredVisualTheme, VISUAL_THEME_STORAGE_KEY } from "./theme";

const DataDialog = lazy(() => import("./features/backup/DataDialog").then((module) => ({ default: module.DataDialog })));
const emptySnapshot: LibrarySnapshot = { subjects: [], sections: [], questions: [], attempts: [], questionStates: [], studySessions: [] };

const preferredSubjectNameLines = new Map<string, readonly string[]>([
  ["Web安全の基礎", ["Web安全", "の基礎"]],
  ["基本情報技術者", ["基本情報", "技術者"]],
  ["応用情報技術者", ["応用情報", "技術者"]],
  ["第二種電気工事士", ["第二種", "電気工事士"]],
]);

function SubjectTabLabel({ name }: { name: string }) {
  const lines = preferredSubjectNameLines.get(name);
  if (!lines) return <>{name}</>;
  return <>
    <span className="course-tab-label" aria-hidden="true">
      {lines.map((line) => <span className="course-tab-line" key={line}>{line}</span>)}
    </span>
    <span className="studio-sr-only">{name}</span>
  </>;
}

export default function App() {
  const [snapshot, setSnapshot] = useState<LibrarySnapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [dataOpen, setDataOpen] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [forceTour, setForceTour] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [showCompletedSubjects, setShowCompletedSubjects] = useState(false);
  const reload = useCallback(async () => {
    const next = await loadSnapshot();
    syncLegacyDataset(next);
    setSnapshot(next);
  }, []);
  const announce = useCallback((message: string) => {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(message), 20);
  }, []);

  useEffect(() => {
    const syncVisualTheme = () => applyStoredVisualTheme();
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === VISUAL_THEME_STORAGE_KEY) syncVisualTheme();
    };
    syncVisualTheme();
    document.documentElement.dataset.motion = "lite";
    document.documentElement.dataset.performance = window.matchMedia("(max-width: 980px), (pointer: coarse)").matches ? "mobile" : "desktop";
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncVisualTheme);
    window.addEventListener("pageshow", syncVisualTheme);
    void (async () => {
      try {
        await initializeDatabase();
        await reload();
        setReady(true);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "データベースを開けませんでした。");
      }
    })();
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncVisualTheme);
      window.removeEventListener("pageshow", syncVisualTheme);
    };
  }, [reload]);

  const answeredIds = new Set(snapshot.attempts.map((item) => item.questionId));
  const correctAttempts = snapshot.attempts.filter((item) => item.correct).length;
  const accuracy = snapshot.attempts.length ? Math.round((correctAttempts / snapshot.attempts.length) * 100) : 0;
  const replayTour = () => { setForceTour(true); setTourKey((value) => value + 1); };

  if (!ready) return <main className="studio-loading"><img className="brand-symbol" src="./favicon.svg?v=20260907-quiz-pal" width="46" height="46" alt="" aria-hidden="true" />{loadError ? <><h1>起動できませんでした</h1><p role="alert">{loadError}</p><button type="button" className="primary-button" onClick={() => window.location.reload()}>再読み込み</button></> : <p>教材を準備しています…</p>}</main>;

  return <div className="app-shell studio-shell">
    <a className="studio-skip-link" href="#main-content">本文へ移動</a>
    <aside className="sidebar" aria-label="教材管理">
      <a className="brand" href="./" aria-label="Quiz Pal クイズ画面へ戻る"><img className="brand-symbol" src="./favicon.svg?v=20260907-quiz-pal" width="46" height="46" alt="" aria-hidden="true" /><span><h1>Quiz Pal</h1><p>{snapshot.questions.length} QUESTIONS</p></span></a>
      <a className="portable-promo portable-promo-compact" href="./downloads/Quiz-Pal-HTML.zip" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label="インストール不要のHTML共通版をダウンロードする">
        <span className="portable-promo-icon" aria-hidden="true">↓</span>
        <span className="portable-promo-copy"><small>WINDOWS / MAC / LINUX</small><strong>このアプリを持ち帰る</strong><em>ZIPを展開してHTMLを開く</em></span>
        <span className="portable-promo-badge">インストール不要</span>
      </a>
      <nav className="sidebar-site-links" aria-label="このアプリについて"><a href="./legal.html"><span aria-hidden="true">◇</span><span>利用条件・プライバシー</span></a><a href="https://github.com/hinahina-vr/quiz-pal" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><span aria-hidden="true">&lt;/&gt;</span><span>GitHub・ライセンス</span></a></nav>
      <p className="sidebar-label">教材の科目</p>
      <div className="course-switch" data-tour-id="library">
        {snapshot.subjects.filter(subject => !subject.completed).map((subject) => <button type="button" className={`course-tab${selectedSubjectId === subject.id ? " active" : ""}`} key={subject.id} onClick={() => setSelectedSubjectId(subject.id)} style={{ "--active": subject.color } as React.CSSProperties}><SubjectTabLabel name={subject.name} /></button>)}
      </div>
      <button type="button" className="completed-subject-toggle" aria-expanded={showCompletedSubjects} onClick={() => setShowCompletedSubjects(!showCompletedSubjects)}>修了科目 <span>{snapshot.subjects.filter(subject => subject.completed).length}</span></button>
      {showCompletedSubjects && <div className="completed-subject-list">{snapshot.subjects.filter(subject => subject.completed).map(subject => <button type="button" className="course-tab" key={subject.id} onClick={() => setSelectedSubjectId(subject.id)}>{subject.name}</button>)}</div>}
      <div className="chapter-list studio-chapter-list">
        <a className="chapter-button" href="./" data-tour-id="practice"><span className="chapter-no">Q</span><span className="chapter-name">クイズへ戻る</span><span className="chapter-score">PLAY</span></a>
        <button type="button" className="chapter-button active" onClick={() => setDataOpen(true)} data-tour-id="data"><span className="chapter-no">D</span><span className="chapter-name">データ管理</span><span className="chapter-score">CSV</span></button>
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="chapter-heading"><p className="eyebrow">LOCAL LIBRARY</p><h2>教材管理</h2></div>
        <div className="header-cards"><div className="rank-card"><span>CLASS</span><strong>編集</strong></div><div className="format-card"><span>STYLE</span><strong>{snapshot.subjects.length} 科目</strong></div></div>
        <div className="toolbar" aria-label="教材操作"><button type="button" className="icon-button" onClick={replayTour} data-tour-id="guide">ガイド</button><button type="button" className="icon-button" onClick={() => setDataOpen(true)} data-tour-id="data">データ</button><a className="icon-button" href="./">クイズ</a></div>
        <section className="status-band" aria-label="教材状況"><div className="status-cell score-cell"><span className="stat-label">TOTAL SCORE</span><strong>{accuracy}%</strong></div><div className="status-cell"><span className="stat-label">SUBJECT</span><strong>{snapshot.subjects.length}</strong></div><div className="status-cell"><span className="stat-label">SECTION</span><strong>{snapshot.sections.length}</strong></div><div className="status-cell"><span className="stat-label">QUESTION</span><strong>{snapshot.questions.length}</strong></div><div className="status-cell"><span className="stat-label">PLAY</span><strong>{snapshot.attempts.length}</strong></div><div className="progress-cell"><span className="progress-label">QUEST PROGRESS</span><div className="progress-track"><span style={{ width: `${snapshot.questions.length ? (answeredIds.size / snapshot.questions.length) * 100 : 0}%` }} /></div></div></section>
      </header>
      <div className="playfield studio-playfield"><LibraryView snapshot={snapshot} reload={reload} announce={announce} preferredSubjectId={selectedSubjectId} showCompleted={showCompletedSubjects} onShowCompletedChange={setShowCompletedSubjects} /></div>
    </main>
    <nav className="studio-mobile-nav" aria-label="モバイルナビゲーション"><a href="./" data-tour-id="practice">クイズ</a><a className="active" href="./studio.html">教材</a><button type="button" onClick={() => setDataOpen(true)} data-tour-id="data">データ</button><button type="button" onClick={replayTour} data-tour-id="guide">ガイド</button></nav>
    {dataOpen && <Suspense fallback={null}><DataDialog open onClose={() => setDataOpen(false)} snapshot={snapshot} reload={reload} announce={announce} /></Suspense>}
    <Onboarding key={tourKey} force={forceTour} onClose={() => setForceTour(false)} />
    <div className="studio-sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
  </div>;
}
