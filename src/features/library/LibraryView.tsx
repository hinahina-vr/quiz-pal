/**
 * 科目 → セクション → 問題の順に教材を編集する画面。
 * 手動編集とAIによる下書きの入口をまとめ、修了による非表示と科目の削除は別の操作として扱います。
 */
import { useEffect, useMemo, useState } from "native-ui";
import { db, deleteQuestion, deleteSection, deleteSubject, setSubjectCompleted, moveRecord } from "../../db/database";
import { questionSchema } from "../../domain/schema";
import type { LibrarySnapshot, Question, QuestionOption, QuestionType, Section, Subject } from "../../domain/types";
import { createId, nowIso } from "../../domain/types";
import { AiAuthorDialog } from "../ai-author/AiAuthorDialog";
import type { AiAuthorScope, AiPersistResult } from "../ai-author/aiAuthor";

interface Props {
  snapshot: LibrarySnapshot;
  reload: () => Promise<void>;
  announce: (message: string) => void;
  preferredSubjectId?: string;
  showCompleted?: boolean;
  onShowCompletedChange?: (value: boolean) => void;
}

type AuthoringMode = "choose" | "manual";
type ManualStep = "subject" | "section" | "question";

const manualSteps: { id: ManualStep; number: string; label: string }[] = [
  { id: "subject", number: "01", label: "科目" },
  { id: "section", number: "02", label: "セクション" },
  { id: "question", number: "03", label: "問題" },
];

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function OrderButtons({ index, length, onMove }: { index: number; length: number; onMove: (direction: -1 | 1) => void }) {
  return (
    <span className="order-buttons" data-tour-id="reorder">
      <button type="button" className="mini-button" disabled={index === 0} onClick={(event) => { event.stopPropagation(); onMove(-1); }} aria-label="上へ移動">↑</button>
      <button type="button" className="mini-button" disabled={index === length - 1} onClick={(event) => { event.stopPropagation(); onMove(1); }} aria-label="下へ移動">↓</button>
    </span>
  );
}

function emptyQuestion(sectionId: string, order: number): Question {
  const now = nowIso();
  return {
    id: createId(), sectionId, type: "single_choice", promptMarkdown: "", options: [
      { id: createId(), text: "" }, { id: createId(), text: "" },
    ], correctOptionIds: [], acceptedAnswers: [], explanationMarkdown: "", tags: [], timeLimitSeconds: null,
    order, contentRevision: 1, createdAt: now, updatedAt: now,
  };
}

export function LibraryView({ snapshot, reload, announce, preferredSubjectId, showCompleted = false, onShowCompletedChange }: Props) {
  const [authoringMode, setAuthoringMode] = useState<AuthoringMode>("choose");
  const [manualStep, setManualStep] = useState<ManualStep>("subject");
  const [aiScope, setAiScope] = useState<AiAuthorScope | null>(null);
  const [subjectId, setSubjectId] = useState(snapshot.subjects[0]?.id ?? "");
  const visibleSubjects = useMemo(() => snapshot.subjects.filter(item => showCompleted || !item.completed), [snapshot.subjects, showCompleted]);
  const sections = useMemo(() => snapshot.sections.filter((item) => item.subjectId === subjectId).sort((a, b) => a.order - b.order), [snapshot.sections, subjectId]);
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const questions = useMemo(() => snapshot.questions.filter((item) => item.sectionId === sectionId).sort((a, b) => a.order - b.order), [snapshot.questions, sectionId]);
  const [questionId, setQuestionId] = useState(questions[0]?.id ?? "");

  useEffect(() => {
    if (!visibleSubjects.some((item) => item.id === subjectId)) {
      setSubjectId(visibleSubjects[0]?.id ?? "");
      setManualStep("subject");
    }
  }, [visibleSubjects, subjectId]);
  useEffect(() => {
    if (preferredSubjectId && visibleSubjects.some((item) => item.id === preferredSubjectId)) setSubjectId(preferredSubjectId);
  }, [preferredSubjectId, visibleSubjects]);
  useEffect(() => {
    if (!sections.some((item) => item.id === sectionId)) setSectionId(sections[0]?.id ?? "");
  }, [sections, sectionId]);
  useEffect(() => {
    if (!questions.some((item) => item.id === questionId)) setQuestionId(questions[0]?.id ?? "");
  }, [questions, questionId]);

  const currentSubject = snapshot.subjects.find((item) => item.id === subjectId);
  const currentSection = sections.find((item) => item.id === sectionId);
  const currentQuestion = questions.find((item) => item.id === questionId);

  const addSubject = async () => {
    const now = nowIso();
    const subject: Subject = { id: createId(), name: "新しい科目", description: "", color: "#7c3aed", order: snapshot.subjects.length, createdAt: now, updatedAt: now };
    await db.subjects.add(subject); await reload(); setSubjectId(subject.id); announce("科目を追加しました。");
  };
  const addSection = async () => {
    if (!currentSubject) return;
    const now = nowIso();
    const section: Section = { id: createId(), subjectId: currentSubject.id, name: "新しいセクション", description: "", order: sections.length, createdAt: now, updatedAt: now };
    await db.sections.add(section); await reload(); setSectionId(section.id); announce("セクションを追加しました。");
  };
  const addQuestion = async () => {
    if (!currentSection) return;
    const question = emptyQuestion(currentSection.id, questions.length);
    await db.questions.add(question); await reload(); setQuestionId(question.id); announce("問題を追加しました。内容を入力してください。");
  };

  const selectAiResult = (result: AiPersistResult) => {
    setSubjectId(result.subjectId);
    setSectionId(result.sectionId);
    setQuestionId(result.questionId);
    setAuthoringMode("manual");
    setManualStep("question");
  };

  const reorder = async (table: "subjects" | "sections" | "questions", items: { id: string }[], index: number, direction: -1 | 1) => {
    const ordered = move(items, index, direction);
    await moveRecord(table, ordered.map((item) => item.id));
    await reload(); announce(direction < 0 ? "上へ移動しました。" : "下へ移動しました。");
  };

  return (
    <section className="quiz-panel library-view" id="main-content">
      <header className="view-heading library-heading">
        <div><span className="eyebrow">QUESTION STUDIO</span><h1>教材をつくる</h1><p>{authoringMode === "choose" ? "まず、作り方を選んでください。" : "科目から順番に、迷わず編集できます。"}</p></div>
      </header>

      {authoringMode === "manual" && currentSubject && <details className="subject-management"><summary>{currentSubject.name} の管理</summary><p>修了にすると通常の一覧から隠れます。教材と学習履歴は残り、修了科目から戻せます。</p><SubjectActions subject={currentSubject} reload={reload} announce={announce} /></details>}
      {authoringMode === "choose" ? (
        <section className="authoring-choice" aria-labelledby="authoring-choice-title" data-tour-id="library-choice">
          <div className="choice-intro">
            <span>START</span>
            <h2 id="authoring-choice-title">どちらの方法でつくりますか？</h2>
            <p>あとからいつでも、この画面に戻って選び直せます。</p>
          </div>
          <div className="authoring-choice-grid">
            <button type="button" className="authoring-card ai-card" onClick={() => setAiScope("subject")} data-tour-id="ai-author">
              <span className="authoring-card-mark" aria-hidden="true">AI</span>
              <span className="authoring-card-copy">
                <small>会話しながら一気に作成</small>
                <strong>AIに丸投げ</strong>
                <span>科目名や作りたい内容を伝えると、構成と5択問題の下書きをまとめて提案します。</span>
              </span>
              <span className="authoring-card-action">AI作成を開く <i aria-hidden="true">→</i></span>
            </button>
            <button type="button" className="authoring-card manual-card" onClick={() => { setAuthoringMode("manual"); setManualStep("subject"); }} data-tour-id="manual-author">
              <span className="authoring-card-mark steps-mark" aria-hidden="true">01—03</span>
              <span className="authoring-card-copy">
                <small>ひとつずつ確認して編集</small>
                <strong>手動で編集</strong>
                <span>科目、セクション、問題の順に進みます。必要な項目だけが画面に表示されます。</span>
              </span>
              <span className="authoring-card-action">手動編集を始める <i aria-hidden="true">→</i></span>
            </button>
          </div>
          <div className="library-summary" aria-label="登録済み教材">
            <span><strong>{snapshot.subjects.length}</strong> 科目</span>
            <i aria-hidden="true" />
            <span><strong>{snapshot.sections.length}</strong> セクション</span>
            <i aria-hidden="true" />
            <span><strong>{snapshot.questions.length}</strong> 問</span>
          </div>
        </section>
      ) : (
        <div className="manual-workflow" data-tour-id="library">
          <div className="manual-workflow-topline">
            <button type="button" className="workflow-back-button" onClick={() => setAuthoringMode("choose")}>← 作り方を選び直す</button>
            <nav className="manual-stepper" aria-label="教材編集の手順">
              {manualSteps.map((step) => {
                const disabled = step.id === "section" ? !currentSubject : step.id === "question" ? !currentSection : false;
                return <button key={step.id} type="button" className={manualStep === step.id ? "active" : ""} disabled={disabled} aria-current={manualStep === step.id ? "step" : undefined} onClick={() => setManualStep(step.id)}><span>{step.number}</span><strong>{step.label}</strong></button>;
              })}
            </nav>
          </div>

          {manualStep === "subject" && (
            <section className="manual-stage" aria-labelledby="subjects-title">
              <header className="manual-stage-header">
                <div><span>STEP 01 / 03</span><h2 id="subjects-title">科目を選ぶ</h2><p>編集する科目を選ぶか、新しく追加してください。</p></div>
                <button type="button" className="studio-add-button" onClick={addSubject} data-tour-id="add-subject">＋ 新しい科目</button>
              </header>
              <div className="manual-stage-content">
                <aside className="manual-list-pane" aria-label="科目一覧">
                  <div className="manual-pane-title"><strong>登録済みの科目</strong><span>{visibleSubjects.length}件</span></div><label className="completed-subject-option"><input type="checkbox" checked={showCompleted} onChange={event => onShowCompletedChange?.(event.target.checked)} />修了科目も表示する</label>
                  <div className="entity-list">
                    {visibleSubjects.map((subject) => (
                      <div key={subject.id} className={`entity-row${subject.id === subjectId ? " active" : ""}`}>
                        <button type="button" className="entity-select" onClick={() => setSubjectId(subject.id)}>
                          <i className="subject-dot" style={{ background: subject.color }} aria-hidden="true" />
                          <span><strong>{subject.name}{subject.completed ? "（修了）" : ""}</strong><small>{snapshot.sections.filter((item) => item.subjectId === subject.id).length} セクション</small></span>
                        </button>
                        <OrderButtons index={snapshot.subjects.indexOf(subject)} length={snapshot.subjects.length} onMove={(direction) => reorder("subjects", snapshot.subjects, snapshot.subjects.indexOf(subject), direction)} />
                      </div>
                    ))}
                  </div>
                </aside>
                <div className="manual-editor-pane">
                  <div className="manual-pane-title"><strong>{currentSubject ? "選択中の科目" : "科目がありません"}</strong>{currentSubject && <span>編集</span>}</div>
                  {currentSubject ? <SubjectEditor subject={currentSubject} reload={reload} announce={announce} /> : <div className="empty-state">「新しい科目」から追加してください。</div>}
                </div>
              </div>
              <footer className="manual-stage-footer"><span /><button type="button" className="workflow-next-button" disabled={!currentSubject} onClick={() => setManualStep("section")}><span>次へ</span> セクションを編集 <i aria-hidden="true">→</i></button></footer>
            </section>
          )}

          {manualStep === "section" && (
            <section className="manual-stage" aria-labelledby="sections-title">
              <header className="manual-stage-header">
                <div><span>STEP 02 / 03</span><h2 id="sections-title">セクションを選ぶ</h2><p><strong>{currentSubject?.name}</strong> の中に、学習内容のまとまりを作ります。</p></div>
                <button type="button" className="studio-add-button" onClick={addSection} disabled={!currentSubject}>＋ 新しいセクション</button>
              </header>
              <div className="manual-stage-content">
                <aside className="manual-list-pane" aria-label="セクション一覧">
                  <div className="manual-pane-title"><strong>{currentSubject?.name}</strong><span>{sections.length}件</span></div>
                  <div className="entity-list">
                    {sections.map((section, index) => (
                      <div key={section.id} className={`entity-row${section.id === sectionId ? " active" : ""}`}>
                        <button type="button" className="entity-select" onClick={() => setSectionId(section.id)}>
                          <span className="number-badge">{String(index + 1).padStart(2, "0")}</span>
                          <span><strong>{section.name}</strong><small>{snapshot.questions.filter((item) => item.sectionId === section.id).length} 問</small></span>
                        </button>
                        <OrderButtons index={index} length={sections.length} onMove={(direction) => reorder("sections", sections, index, direction)} />
                      </div>
                    ))}
                  </div>
                </aside>
                <div className="manual-editor-pane">
                  <div className="manual-pane-title"><strong>{currentSection ? "選択中のセクション" : "セクションがありません"}</strong>{currentSection && <span>編集</span>}</div>
                  {currentSection ? <SectionEditor section={currentSection} reload={reload} announce={announce} /> : <div className="empty-state">「新しいセクション」から追加してください。</div>}
                </div>
              </div>
              <footer className="manual-stage-footer"><button type="button" className="workflow-previous-button" onClick={() => setManualStep("subject")}>← 科目へ戻る</button><button type="button" className="workflow-next-button" disabled={!currentSection} onClick={() => setManualStep("question")}><span>次へ</span> 問題を編集 <i aria-hidden="true">→</i></button></footer>
            </section>
          )}

          {manualStep === "question" && (
            <section className="manual-stage question-stage" aria-labelledby="questions-title" data-tour-id="question-editor">
              <header className="manual-stage-header">
                <div><span>STEP 03 / 03</span><h2 id="questions-title">問題を編集する</h2><p><strong>{currentSubject?.name}</strong> / {currentSection?.name}</p></div>
                <button type="button" className="studio-add-button" onClick={addQuestion} disabled={!currentSection}>＋ 新しい問題</button>
              </header>
              <div className="manual-stage-content question-stage-content">
                <aside className="manual-list-pane" aria-label="問題一覧">
                  <div className="manual-pane-title"><strong>{currentSection?.name}</strong><span>{questions.length}問</span></div>
                  <div className="question-list">
                    {questions.map((question, index) => (
                      <div key={question.id} className={`question-row${question.id === questionId ? " active" : ""}`}>
                        <button type="button" className="entity-select" onClick={() => setQuestionId(question.id)}>
                          <span className="question-kind">{questionTypeLabel(question.type)}</span>
                          <span><strong>{question.promptMarkdown || "（未入力）"}</strong><small>{question.tags.join(" · ") || "タグなし"}</small></span>
                        </button>
                        <OrderButtons index={index} length={questions.length} onMove={(direction) => reorder("questions", questions, index, direction)} />
                      </div>
                    ))}
                  </div>
                </aside>
                <div className="manual-editor-pane question-editor-pane">
                  <div className="manual-pane-title"><strong>{currentQuestion ? "選択中の問題" : "問題がありません"}</strong>{currentQuestion && <span>編集</span>}</div>
                  {currentQuestion ? <QuestionEditor key={currentQuestion.id} question={currentQuestion} reload={reload} announce={announce} /> : <div className="empty-state">「新しい問題」から追加してください。</div>}
                </div>
              </div>
              <footer className="manual-stage-footer"><button type="button" className="workflow-previous-button" onClick={() => setManualStep("section")}>← セクションへ戻る</button><span /></footer>
            </section>
          )}
        </div>
      )}
      {aiScope && <AiAuthorDialog
        initialScope={aiScope}
        snapshot={snapshot}
        subject={currentSubject}
        section={currentSection}
        onClose={() => setAiScope(null)}
        reload={reload}
        announce={announce}
        onSaved={selectAiResult}
      />}
    </section>
  );
}


function SubjectActions({ subject, reload, announce }: { subject: Subject; reload: () => Promise<void>; announce: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(""); try { await action(); await reload(); } catch (e) { setError(e instanceof Error ? e.message : "操作に失敗しました。もう一度お試しください。"); } finally { setBusy(false); } };
  const remove = async () => {
    const sections = await db.sections.where("subjectId").equals(subject.id).toArray();
    const count = sections.length ? await db.questions.where("sectionId").anyOf(sections.map(item => item.id)).count() : 0;
    if (!confirm("「" + subject.name + "」を科目ごと削除します。" + sections.length + "件のセクション・" + count + "問とその学習履歴が削除されます。戻すには削除前のセーブが必要です。削除しますか？")) return;
    await run(async () => { await deleteSubject(subject.id); announce("科目を削除しました。"); });
  };
  return <div className="subject-actions"><button type="button" className="small-button" disabled={busy} onClick={() => void run(async () => { await setSubjectCompleted(subject.id, !subject.completed); announce(subject.completed ? "通常の科目一覧に戻しました。" : "修了にして通常の一覧から隠しました。"); })}>{subject.completed ? "修了を取り消して一覧に戻す" : "修了にして一覧から隠す"}</button><button type="button" className="danger-link" disabled={busy} onClick={() => void remove()}>科目を削除</button>{error && <p role="alert">{error}</p>}</div>;
}

function SubjectEditor({ subject, reload, announce }: { subject: Subject; reload: () => Promise<void>; announce: (message: string) => void }) {
  const [draft, setDraft] = useState(subject);
  useEffect(() => setDraft(subject), [subject]);
  const save = async (event: React.FormEvent) => { event.preventDefault(); await db.subjects.put({ ...draft, name: draft.name.trim() || "名称未設定", updatedAt: nowIso() }); await reload(); announce("科目を保存しました。"); };

  return <form className="compact-editor" onSubmit={save}><label>科目名<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={120} /></label><label>説明<textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} maxLength={2000} /></label><label className="color-field">色<input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></label><div className="form-actions"><button className="small-button" type="submit">保存</button></div></form>;
}

function SectionEditor({ section, reload, announce }: { section: Section; reload: () => Promise<void>; announce: (message: string) => void }) {
  const [draft, setDraft] = useState(section);
  useEffect(() => setDraft(section), [section]);
  const save = async (event: React.FormEvent) => { event.preventDefault(); await db.sections.put({ ...draft, name: draft.name.trim() || "名称未設定", updatedAt: nowIso() }); await reload(); announce("セクションを保存しました。"); };
  const remove = async () => { const count = await db.questions.where("sectionId").equals(section.id).count(); if (!confirm(`「${section.name}」と${count}問、その学習履歴を削除しますか？`)) return; await deleteSection(section.id); await reload(); announce("セクションを削除しました。"); };
  return <form className="compact-editor" onSubmit={save}><label>セクション名<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={120} /></label><label>説明<textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} maxLength={2000} /></label><div className="form-actions"><button className="small-button" type="submit">保存</button><button className="danger-link" type="button" onClick={remove}>削除</button></div></form>;
}

function questionTypeLabel(type: QuestionType) { return { single_choice: "単一", multiple_choice: "複数", true_false: "○×", text: "入力" }[type]; }

function QuestionEditor({ question, reload, announce }: { question: Question; reload: () => Promise<void>; announce: (message: string) => void }) {
  const [draft, setDraft] = useState(question);
  const [error, setError] = useState("");
  useEffect(() => { setDraft(question); setError(""); }, [question]);
  const changeType = (type: QuestionType) => {
    if (type === "true_false") setDraft({ ...draft, type, options: [{ id: "true", text: "正しい" }, { id: "false", text: "誤り" }], correctOptionIds: [] });
    else if (type === "text") setDraft({ ...draft, type, options: [], correctOptionIds: [] });
    else setDraft({ ...draft, type, options: draft.options.length >= 2 && question.type !== "true_false" ? draft.options : [{ id: createId(), text: "" }, { id: createId(), text: "" }], acceptedAnswers: [] });
  };
  const updateOption = (index: number, patch: Partial<QuestionOption>) => setDraft({ ...draft, options: draft.options.map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option) });
  const addOption = () => draft.options.length < 6 && setDraft({ ...draft, options: [...draft.options, { id: createId(), text: "" }] });
  const removeOption = (index: number) => { const removed = draft.options[index]; setDraft({ ...draft, options: draft.options.filter((_, optionIndex) => optionIndex !== index), correctOptionIds: draft.correctOptionIds.filter((id) => id !== removed.id) }); };
  const toggleCorrect = (id: string) => setDraft({ ...draft, correctOptionIds: draft.type === "multiple_choice" ? (draft.correctOptionIds.includes(id) ? draft.correctOptionIds.filter((value) => value !== id) : [...draft.correctOptionIds, id]) : [id] });
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const cleaned = { ...draft, promptMarkdown: draft.promptMarkdown.trim(), options: draft.options.map((item) => ({ ...item, text: item.text.trim() })).filter((item) => item.text), acceptedAnswers: draft.acceptedAnswers.map((item) => item.trim()).filter(Boolean), tags: draft.tags.map((item) => item.trim()).filter(Boolean), updatedAt: nowIso(), contentRevision: JSON.stringify({ ...draft, updatedAt: "", contentRevision: 0 }) === JSON.stringify({ ...question, updatedAt: "", contentRevision: 0 }) ? question.contentRevision : question.contentRevision + 1 };
    const result = questionSchema.safeParse(cleaned);
    if (!result.success) { setError(result.error.issues[0]?.message ?? "入力を確認してください。"); return; }
    await db.questions.put(result.data as Question); await reload(); announce("問題を保存しました。");
  };
  const remove = async () => { if (!confirm("この問題と回答履歴を削除しますか？")) return; await deleteQuestion(question.id); await reload(); announce("問題を削除しました。"); };
  return (
    <form className="question-editor" onSubmit={save}>
      <label>問題形式<select value={draft.type} onChange={(e) => changeType(e.target.value as QuestionType)}><option value="single_choice">単一選択</option><option value="multiple_choice">複数選択</option><option value="true_false">○×</option><option value="text">文字入力</option></select></label>
      <label>問題文 <span className="field-hint">Markdown対応・HTML無効</span><textarea value={draft.promptMarkdown} onChange={(e) => setDraft({ ...draft, promptMarkdown: e.target.value })} rows={4} maxLength={20000} required /></label>
      {draft.type !== "text" && <fieldset className="options-editor"><legend>選択肢と正答</legend>{draft.options.map((option, index) => <div className="option-edit-row" key={option.id}><input type={draft.type === "multiple_choice" ? "checkbox" : "radio"} name="correct-option" checked={draft.correctOptionIds.includes(option.id)} onChange={() => toggleCorrect(option.id)} aria-label={`選択肢${index + 1}を正答にする`} /><input value={option.text} onChange={(e) => updateOption(index, { text: e.target.value })} maxLength={10000} readOnly={draft.type === "true_false"} aria-label={`選択肢${index + 1}`} />{draft.type !== "true_false" && <button type="button" className="mini-button" onClick={() => removeOption(index)} disabled={draft.options.length <= 2} aria-label={`選択肢${index + 1}を削除`}>×</button>}</div>)}{draft.type !== "true_false" && <button type="button" className="text-button" onClick={addOption} disabled={draft.options.length >= 6}>＋ 選択肢を追加</button>}</fieldset>}
      {draft.type === "text" && <label>正答候補 <span className="field-hint">| で区切る</span><input value={draft.acceptedAnswers.join("|")} onChange={(e) => setDraft({ ...draft, acceptedAnswers: e.target.value.split("|") })} placeholder="東京|東京都" /></label>}
      <label>解説<textarea value={draft.explanationMarkdown} onChange={(e) => setDraft({ ...draft, explanationMarkdown: e.target.value })} rows={3} maxLength={20000} /></label>
      <div className="form-grid"><label>タグ <span className="field-hint">| で区切る</span><input value={draft.tags.join("|")} onChange={(e) => setDraft({ ...draft, tags: e.target.value.split("|") })} /></label><label>制限時間（秒）<input type="number" min={5} max={3600} value={draft.timeLimitSeconds ?? ""} onChange={(e) => setDraft({ ...draft, timeLimitSeconds: e.target.value ? Number(e.target.value) : null })} /></label></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions sticky-actions"><button className="primary-button" type="submit">問題を保存</button><button className="danger-link" type="button" onClick={remove}>問題を削除</button></div>
    </form>
  );
}
