import { useEffect, useMemo, useRef, useState } from "native-ui";
import { db } from "../../db/database";
import type { LibrarySnapshot, Question, QuestionState, Understanding } from "../../domain/types";
import { createId, evaluateAnswer, nextReviewState, nowIso } from "../../domain/types";
import { Markdown } from "../../security/markdown";

type Filter = "all" | "unanswered" | "wrong" | "bookmarked" | "due";

function shuffled<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export function PracticeView({ snapshot, reload, announce, preferredSubjectId, onSubjectChange }: { snapshot: LibrarySnapshot; reload: () => Promise<void>; announce: (message: string) => void; preferredSubjectId: string; onSubjectChange: (subjectId: string) => void }) {
  const [subjectId, setSubjectId] = useState(preferredSubjectId || snapshot.subjects[0]?.id || "all");
  const [sectionId, setSectionId] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [shuffle, setShuffle] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const sessionStart = useRef<string>("");
  const questionStart = useRef(0);
  const current = queue[index];
  useEffect(() => {
    if (preferredSubjectId && preferredSubjectId !== subjectId) {
      setSubjectId(preferredSubjectId);
      setSectionId("all");
    }
  }, [preferredSubjectId, subjectId]);
  const states = useMemo(() => new Map(snapshot.questionStates.map((item) => [item.questionId, item])), [snapshot.questionStates]);
  const attemptsByQuestion = useMemo(() => {
    const map = new Map<string, typeof snapshot.attempts>();
    snapshot.attempts.forEach((attempt) => map.set(attempt.questionId, [...(map.get(attempt.questionId) ?? []), attempt]));
    return map;
  }, [snapshot.attempts]);
  const sections = snapshot.sections.filter((item) => subjectId === "all" || item.subjectId === subjectId).sort((a, b) => a.order - b.order);
  const candidates = useMemo(() => snapshot.questions.filter((question) => {
    const section = snapshot.sections.find((item) => item.id === question.sectionId);
    if (!section || (subjectId !== "all" && section.subjectId !== subjectId) || (sectionId !== "all" && question.sectionId !== sectionId)) return false;
    const attempts = attemptsByQuestion.get(question.id) ?? [];
    const state = states.get(question.id);
    if (filter === "unanswered") return attempts.length === 0;
    if (filter === "wrong") return attempts.length > 0 && !attempts.at(-1)?.correct;
    if (filter === "bookmarked") return state?.bookmarked;
    if (filter === "due") return Boolean(state?.dueAt && new Date(state.dueAt) <= new Date());
    return true;
  }), [snapshot.questions, snapshot.sections, subjectId, sectionId, filter, attemptsByQuestion, states]);

  const beginQuestion = (question: Question | undefined) => {
    setSelected([]); setTyped(""); setResult(null); questionStart.current = performance.now(); setSecondsLeft(question?.timeLimitSeconds ?? null);
  };
  const start = () => {
    const next = shuffle ? shuffled(candidates) : [...candidates];
    setQueue(next); setIndex(0); setSessionCorrect(0); sessionStart.current = nowIso(); beginQuestion(next[0]);
    announce(`${next.length}問の学習を開始しました。`);
  };
  const finish = async () => {
    if (sessionStart.current) {
      const subject = subjectId === "all" ? null : subjectId;
      await db.studySessions.add({ id: createId(), subjectId: subject, startedAt: sessionStart.current, endedAt: nowIso(), answered: Math.min(index + (result !== null ? 1 : 0), queue.length), correct: sessionCorrect });
      await reload();
    }
    setQueue([]); setIndex(0); setResult(null); announce("学習を終了しました。");
  };
  const advance = async () => {
    if (index + 1 >= queue.length) { await finish(); return; }
    const nextIndex = index + 1; setIndex(nextIndex); beginQuestion(queue[nextIndex]);
  };
  const submit = async (answerOverride?: string[]) => {
    if (!current || result !== null) return;
    const answer = answerOverride ?? (current.type === "text" ? [typed] : selected);
    if (answer.length === 0 || (current.type === "text" && !typed.trim())) return;
    const correct = evaluateAnswer(current, answer);
    setResult(correct); if (correct) setSessionCorrect((value) => value + 1);
    const previous = states.get(current.id);
    const review = nextReviewState(previous, correct);
    const now = nowIso();
    await db.transaction("rw", db.attempts, db.questionStates, async () => {
      await db.attempts.add({ id: createId(), questionId: current.id, contentRevision: current.contentRevision, answer, correct, elapsedMs: Math.max(0, Math.round(performance.now() - questionStart.current)), answeredAt: now });
      await db.questionStates.put({ questionId: current.id, bookmarked: previous?.bookmarked ?? false, understanding: previous?.understanding ?? "unrated", ...review, updatedAt: now });
    });
    await reload(); announce(correct ? "正解です。" : "不正解です。");
    if (autoAdvance && correct) window.setTimeout(() => void advance(), 1200);
  };

  useEffect(() => {
    if (!current || result !== null || secondsLeft === null) return;
    if (secondsLeft <= 0) { void submit(["__timeout__"]); return; }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value === null ? null : value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [current, result, secondsLeft]);

  const updateState = async (patch: Partial<QuestionState>) => {
    if (!current) return;
    const previous = states.get(current.id);
    await db.questionStates.put({ questionId: current.id, bookmarked: false, understanding: "unrated", dueAt: null, intervalDays: 0, correctStreak: 0, ...previous, ...patch, updatedAt: nowIso() });
    await reload();
  };

  if (current) {
    const state = states.get(current.id);
    const section = snapshot.sections.find((item) => item.id === current.sectionId);
    const subject = snapshot.subjects.find((item) => item.id === section?.subjectId);
    return <main className="practice-session" id="main-content">
      <header className="session-header"><button type="button" className="text-button" onClick={() => void finish()}>← 終了</button><div className="session-progress"><span>{subject?.name} / {section?.name}</span><strong>{index + 1} / {queue.length}</strong><div><i style={{ width: `${((index + (result !== null ? 1 : 0)) / queue.length) * 100}%` }} /></div></div><div className={`timer-pill${secondsLeft !== null && secondsLeft <= 10 ? " urgent" : ""}`}>{secondsLeft === null ? "時間制限なし" : `${secondsLeft}秒`}</div></header>
      <article className="question-card">
        <div className="question-meta"><span>{questionLabel(current.type)}</span><button type="button" className={`bookmark-button${state?.bookmarked ? " active" : ""}`} aria-pressed={state?.bookmarked ?? false} onClick={() => void updateState({ bookmarked: !state?.bookmarked })}>☆ ブックマーク</button></div>
        <Markdown source={current.promptMarkdown} className="question-prompt markdown" />
        {current.type === "text" ? <form className="text-answer" onSubmit={(event) => { event.preventDefault(); void submit(); }}><label>答え<input value={typed} onChange={(event) => setTyped(event.target.value)} disabled={result !== null} autoFocus /></label><button className="primary-button" type="submit" disabled={!typed.trim() || result !== null}>回答する</button></form> : <div className="answer-options" role={current.type === "multiple_choice" ? "group" : "radiogroup"} aria-label="選択肢">{current.options.map((option, optionIndex) => { const checked = selected.includes(option.id); const correctOption = current.correctOptionIds.includes(option.id); const resultClass = result === null ? "" : correctOption ? " correct" : checked ? " incorrect" : ""; return <button key={option.id} type="button" className={`answer-option${checked ? " selected" : ""}${resultClass}`} aria-pressed={checked} disabled={result !== null} onClick={() => setSelected(current.type === "multiple_choice" ? (checked ? selected.filter((id) => id !== option.id) : [...selected, option.id]) : [option.id])}><span>{String.fromCharCode(65 + optionIndex)}</span><strong>{option.text}</strong></button>; })}<button type="button" className="primary-button submit-answer" onClick={() => void submit()} disabled={!selected.length || result !== null}>回答する</button></div>}
        {result !== null && <section className={`feedback-card ${result ? "correct" : "incorrect"}`} role="status"><span className="feedback-label">{result ? "CORRECT" : "REVIEW"}</span><h2>{result ? "正解です" : "もう一度確認しましょう"}</h2>{current.explanationMarkdown && <Markdown source={current.explanationMarkdown} />}<div className="understanding-row" aria-label="理解度"><span>理解度</span>{(["learning", "almost", "mastered"] as Understanding[]).map((value) => <button key={value} type="button" className={state?.understanding === value ? "active" : ""} onClick={() => void updateState({ understanding: value })}>{understandingLabel(value)}</button>)}</div><button type="button" className="primary-button" onClick={() => void advance()}>{index + 1 >= queue.length ? "完了" : "次の問題"}</button></section>}
      </article>
    </main>;
  }

  return <main className="practice-home" id="main-content" data-tour-id="practice">
    <header className="view-heading"><div><span className="eyebrow">PRACTICE</span><h1>学習する</h1><p>今日取り組む範囲とモードを選びます。</p></div></header>
    <div className="practice-layout"><section className="practice-config"><h2>出題セット</h2><label>科目<select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); onSubjectChange(event.target.value); setSectionId("all"); }}><option value="all">すべての科目</option>{snapshot.subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label><label>セクション<select value={sectionId} onChange={(event) => setSectionId(event.target.value)}><option value="all">すべてのセクション</option>{sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}</select></label><fieldset className="filter-grid"><legend>絞り込み</legend>{(["all", "unanswered", "wrong", "bookmarked", "due"] as Filter[]).map((value) => <button type="button" key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{filterLabel(value)}</button>)}</fieldset><label className="check-label"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} />問題順をシャッフル</label><label className="check-label"><input type="checkbox" checked={autoAdvance} onChange={(event) => setAutoAdvance(event.target.checked)} />正解時に自動で次へ</label><button type="button" className="primary-button start-button" onClick={start} disabled={!candidates.length}>{candidates.length ? `${candidates.length}問を開始` : "対象の問題がありません"}</button></section><aside className="practice-summary"><span className="eyebrow">YOUR LIBRARY</span><strong>{snapshot.questions.length}</strong><p>登録済みの問題</p><div className="summary-grid"><span><b>{snapshot.attempts.length}</b>回答</span><span><b>{snapshot.attempts.filter((item) => item.correct).length}</b>正解</span><span><b>{snapshot.questionStates.filter((item) => item.bookmarked).length}</b>保存</span><span><b>{snapshot.questionStates.filter((item) => item.dueAt && new Date(item.dueAt) <= new Date()).length}</b>復習</span></div></aside></div>
  </main>;
}

function questionLabel(type: Question["type"]) { return { single_choice: "単一選択", multiple_choice: "複数選択", true_false: "○×", text: "文字入力" }[type]; }
function filterLabel(filter: Filter) { return { all: "すべて", unanswered: "未回答", wrong: "前回ミス", bookmarked: "ブックマーク", due: "復習期限" }[filter]; }
function understandingLabel(value: Understanding) { return { unrated: "未評価", learning: "要復習", almost: "あと少し", mastered: "理解した" }[value]; }
