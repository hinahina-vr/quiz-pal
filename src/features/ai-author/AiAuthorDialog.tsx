import { useEffect, useMemo, useRef, useState } from "native-ui";
import type { LibrarySnapshot, Section, Subject } from "../../domain/types";
import {
  aiDraftStats,
  buildAiAuthorSystemPrompt,
  defaultAiRequest,
  lockAiDraftIdentity,
  parseAiDraftResponse,
  persistAiDraft,
  type AiAuthorScope,
  type AiDraft,
  type AiPersistResult,
  type AiQuestionDraft,
} from "./aiAuthor";

interface Props {
  initialScope: AiAuthorScope;
  snapshot: LibrarySnapshot;
  subject?: Subject;
  section?: Section;
  onClose: () => void;
  reload: () => Promise<void>;
  announce: (message: string) => void;
  onSaved: (result: AiPersistResult) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  raw?: string;
}

const scopeLabels: Record<AiAuthorScope, { title: string; description: string }> = {
  subject: { title: "新規科目", description: "科目名を入力" },
  section: { title: "セクション追加", description: "既存科目を選択" },
  question: { title: "問題追加", description: "既存セクションを選択" },
};

function contextText(
  scope: AiAuthorScope,
  snapshot: LibrarySnapshot,
  subject: Subject | undefined,
  section: Section | undefined,
  newSubjectName: string,
  newSectionName: string,
): string {
  if (scope === "subject") {
    const names = snapshot.subjects.map((item) => item.name).slice(0, 30);
    return [
      `新規科目名（必ずこの名前をそのまま使用）: ${newSubjectName.trim()}`,
      `既存科目（重複回避用）: ${names.length ? names.join("、") : "なし"}`,
    ].join("\n");
  }
  if (!subject) return "追加先の科目が未選択。";
  const subjectSections = snapshot.sections.filter((item) => item.subjectId === subject.id);
  if (scope === "section") {
    return [
      `科目名: ${subject.name}`,
      `科目説明: ${subject.description || "なし"}`,
      `新規セクション名（必ずこの名前をそのまま使用）: ${newSectionName.trim()}`,
      `既存セクション（重複回避用）: ${subjectSections.map((item) => item.name).join("、") || "なし"}`,
    ].join("\n");
  }
  if (!section) return `科目名: ${subject.name}\n追加先のセクションが未選択。`;
  const prompts = snapshot.questions.filter((item) => item.sectionId === section.id).slice(-20).map((item) => item.promptMarkdown.slice(0, 240));
  return [
    `科目名: ${subject.name}`,
    `科目説明: ${subject.description || "なし"}`,
    `セクション名: ${section.name}`,
    `セクション説明: ${section.description || "なし"}`,
    `既存問題の要約（重複回避用）:\n${prompts.length ? prompts.map((item, index) => `${index + 1}. ${item}`).join("\n") : "なし"}`,
  ].join("\n");
}

const bridge = () => window.__quizZenLlmBridge;

export function AiAuthorDialog({ initialScope, snapshot, subject, section, onClose, reload, announce, onSaved }: Props) {
  const initialSubjectId = subject?.id || (section ? snapshot.subjects.find((item) => item.id === section.subjectId)?.id : "") || snapshot.subjects[0]?.id || "";
  const initialSectionId = section?.id || snapshot.sections.find((item) => item.subjectId === initialSubjectId)?.id || "";
  const [scope, setScope] = useState<AiAuthorScope>(initialScope);
  const [targetSubjectId, setTargetSubjectId] = useState(initialSubjectId);
  const [targetSectionId, setTargetSectionId] = useState(initialSectionId);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(defaultAiRequest(
    initialScope,
    snapshot.subjects.find((item) => item.id === initialSubjectId),
    snapshot.sections.find((item) => item.id === initialSectionId),
  ));
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [validationError, setValidationError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slot, setSlot] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const providers = bridge()?.providers || [];
  const profile = slot ? bridge()?.getProfile(slot) : undefined;
  const provider = providers.find((item) => item.slot === slot);
  const targetSubject = snapshot.subjects.find((item) => item.id === targetSubjectId);
  const targetSections = useMemo(
    () => snapshot.sections.filter((item) => item.subjectId === targetSubjectId).sort((a, b) => a.order - b.order),
    [snapshot.sections, targetSubjectId],
  );
  const targetSection = targetSections.find((item) => item.id === targetSectionId);
  const context = useMemo(
    () => contextText(scope, snapshot, targetSubject, targetSection, newSubjectName, newSectionName),
    [scope, snapshot, targetSubject, targetSection, newSubjectName, newSectionName],
  );
  const targetValidationMessage = scope === "subject"
    ? (!newSubjectName.trim() ? "新しい科目名を入力してください。" : "")
    : scope === "section"
      ? (!targetSubject ? "追加先の科目を選択してください。" : !newSectionName.trim() ? "新しいセクション名を入力してください。" : "")
      : (!targetSubject ? "追加先の科目を選択してください。" : !targetSection ? "追加先のセクションを選択してください。" : "");
  const targetSummary = scope === "subject"
    ? (newSubjectName.trim() || "科目名が未入力")
    : scope === "section"
      ? `${targetSubject?.name || "科目未選択"} / ${newSectionName.trim() || "セクション名が未入力"}`
      : `${targetSubject?.name || "科目未選択"} / ${targetSection?.name || "セクション未選択"}`;

  useEffect(() => {
    const api = bridge();
    if (!api) {
      setRequestError("AI接続機能を読み込めませんでした。ページを再読み込みしてください。");
      return;
    }
    const active = api.getActiveSlot();
    setSlot(active);
    const next = api.getProfile(active);
    setModel(next.model);
    setBaseUrl(next.baseUrl);
    setProfileStatus(next.configured ? `${next.providerLabel} / API設定済み` : `${next.providerLabel} / APIキー未設定`);
  }, []);


  useEffect(() => {
    if (!messages.length && !loading) return;
    chatEndRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages, loading]);

  useEffect(() => {
    if (!targetSections.some((item) => item.id === targetSectionId)) {
      setTargetSectionId(targetSections[0]?.id || "");
    }
  }, [targetSections, targetSectionId]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const clearGeneratedWork = () => {
    setMessages([]);
    setDraft(null);
    setValidationError("");
    setRequestError("");
  };

  const selectScope = (nextScope: AiAuthorScope) => {
    if (nextScope === scope || loading || saving) return;
    setScope(nextScope);
    clearGeneratedWork();
    setInput(defaultAiRequest(nextScope, targetSubject, targetSection));
  };

  const selectTargetSubject = (nextSubjectId: string) => {
    const nextSubject = snapshot.subjects.find((item) => item.id === nextSubjectId);
    const nextSections = snapshot.sections.filter((item) => item.subjectId === nextSubjectId).sort((a, b) => a.order - b.order);
    const nextSection = nextSections[0];
    setTargetSubjectId(nextSubjectId);
    setTargetSectionId(nextSection?.id || "");
    clearGeneratedWork();
    setInput(defaultAiRequest(scope, nextSubject, nextSection));
  };

  const selectTargetSection = (nextSectionId: string) => {
    const nextSection = targetSections.find((item) => item.id === nextSectionId);
    setTargetSectionId(nextSectionId);
    clearGeneratedWork();
    setInput(defaultAiRequest(scope, targetSubject, nextSection));
  };

  const selectProvider = (nextSlot: string) => {
    const api = bridge();
    if (!api) return;
    api.setActiveSlot(nextSlot);
    const next = api.getProfile(nextSlot);
    setSlot(nextSlot);
    setModel(next.model);
    setBaseUrl(next.baseUrl);
    setApiKey("");
    setModelOptions([]);
    setProfileStatus(next.configured ? `${next.providerLabel} / API設定済み` : `${next.providerLabel} / APIキー未設定`);
  };

  const saveProvider = () => {
    const api = bridge();
    if (!api || !slot) return undefined;
    api.setActiveSlot(slot);
    const next = api.saveProfile(slot, { model, baseUrl, ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}) });
    setModel(next.model);
    setBaseUrl(next.baseUrl);
    setApiKey("");
    setProfileStatus(next.configured ? `${next.providerLabel} / 設定を保存しました` : `${next.providerLabel} / APIキー未設定`);
    return next;
  };

  const deleteApiKey = () => {
    const api = bridge();
    if (!api || !slot) return;
    const next = api.deleteApiKey(slot);
    setApiKey("");
    setProfileStatus(`${next.providerLabel} / APIキーを削除しました`);
  };

  const refreshModels = async () => {
    const api = bridge();
    if (!api || !slot) return;
    try {
      saveProvider();
      setProfileStatus("モデル一覧を取得中…");
      const models = await api.listModels(slot);
      setModelOptions(models.slice(0, 2000));
      setProfileStatus(`${models.length}件のモデルを取得しました`);
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "モデル一覧を取得できませんでした。");
    }
  };

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const content = input.trim();
    const api = bridge();
    if (!content || !api || loading) return;
    if (targetValidationMessage) {
      setRequestError(targetValidationMessage);
      return;
    }
    const savedProfile = saveProvider();
    if (!savedProfile?.configured) {
      setRequestError(`${savedProfile?.providerLabel || "選択中のAI"}のAPIキーを設定してください。`);
      return;
    }
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage].slice(-20);
    setMessages(nextMessages);
    setInput("");
    setRequestError("");
    setValidationError("");
    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const result = await api.generate({
        slot,
        messages: [
          { role: "system", content: buildAiAuthorSystemPrompt(scope, context) },
          ...nextMessages.map((message) => ({ role: message.role, content: message.raw || message.content })),
        ],
        maxOutputTokens: scope === "subject" ? 12000 : 8000,
        temperature: 0.25,
        signal: controller.signal,
      });
      const parsed = parseAiDraftResponse(result.answer, scope);
      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: parsed.assistantText, raw: result.answer };
      setMessages((current) => [...current, assistantMessage].slice(-20));
      setDraft(parsed.draft ? lockAiDraftIdentity(parsed.draft, { subjectName: newSubjectName, sectionName: newSectionName }) : null);
      setValidationError(parsed.validationError);
      setProfileStatus(`${savedProfile.providerLabel} · ${result.model}${result.usage.totalTokens ? ` · ${result.usage.totalTokens.toLocaleString("ja-JP")} tokens` : ""}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") setRequestError("生成を中止しました。");
      else setRequestError(error instanceof Error ? error.message : "AIから回答を取得できませんでした。");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setRequestError("");
    try {
      const result = await persistAiDraft(draft, snapshot, { subjectId: targetSubject?.id, sectionId: targetSection?.id });
      await reload();
      onSaved(result);
      announce(`AI下書きから${result.subjects}科目・${result.sections}セクション・${result.questions}問を追加しました。`);
      onClose();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "AI下書きを保存できませんでした。");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (saving) return;
    if (loading) {
      controllerRef.current?.abort();
    }
    onClose();
  };

  return (
    <section className="ai-author-dialog ai-author-inline" aria-labelledby="ai-author-title">
      <button className="workflow-back-button ai-author-back" type="button" onClick={cancel} disabled={saving}>← 作り方を選び直す</button>
      <div className="ai-author-shell">
        <header className="dialog-header ai-author-header">
          <div className="ai-author-brand">
            <span className="ai-author-mark" aria-hidden="true">AI</span>
            <div><small>AI AUTHORING STUDIO</small><h2 id="ai-author-title">AIと問題をつくる</h2><p>相談しながら、保存前にすべて確認できます。</p></div>
          </div>
        </header>

        <div className="ai-author-scope-tabs" role="tablist" aria-label="作成単位">
          {(["subject", "section", "question"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={scope === item}
              onClick={() => selectScope(item)}
              disabled={loading || saving || (item === "section" && snapshot.subjects.length === 0) || (item === "question" && snapshot.sections.length === 0)}
            >
              <span className="ai-scope-index" aria-hidden="true">0{item === "subject" ? 1 : item === "section" ? 2 : 3}</span>
              <span className="ai-scope-copy"><strong>{scopeLabels[item].title}</strong><small>{scopeLabels[item].description}</small></span>
            </button>
          ))}
        </div>

        <section className="ai-author-target" aria-labelledby="ai-author-target-title">
          <header>
            <span aria-hidden="true">1</span>
            <div><strong id="ai-author-target-title">作成先を決める</strong><small>ここで指定した名前と追加先は、AIに変更させません。</small></div>
          </header>
          <div className="ai-target-grid">
            {scope === "subject" && (
              <label htmlFor="ai-new-subject-name">
                新しい科目名 <em>必須</em>
                <input
                  id="ai-new-subject-name"
                  value={newSubjectName}
                  onChange={(event) => { setNewSubjectName(event.target.value); clearGeneratedWork(); }}
                  placeholder="例：ネットワーク基礎"
                  maxLength={120}
                  disabled={loading || saving}
                />
              </label>
            )}
            {scope !== "subject" && (
              <label htmlFor="ai-target-subject">
                追加先の科目 <em>必須</em>
                <select id="ai-target-subject" value={targetSubjectId} onChange={(event) => selectTargetSubject(event.target.value)} disabled={loading || saving}>
                  {!snapshot.subjects.length && <option value="">科目がありません</option>}
                  {snapshot.subjects.slice().sort((a, b) => a.order - b.order).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            )}
            {scope === "section" && (
              <label htmlFor="ai-new-section-name">
                新しいセクション名 <em>必須</em>
                <input
                  id="ai-new-section-name"
                  value={newSectionName}
                  onChange={(event) => { setNewSectionName(event.target.value); clearGeneratedWork(); }}
                  placeholder="例：OSI参照モデル"
                  maxLength={120}
                  disabled={loading || saving}
                />
              </label>
            )}
            {scope === "question" && (
              <label htmlFor="ai-target-section">
                追加先のセクション <em>必須</em>
                <select id="ai-target-section" value={targetSectionId} onChange={(event) => selectTargetSection(event.target.value)} disabled={loading || saving || !targetSections.length}>
                  {!targetSections.length && <option value="">セクションがありません</option>}
                  {targetSections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            )}
          </div>
          <p className={targetValidationMessage ? "ai-target-hint" : "ai-target-hint ready"}>
            {targetValidationMessage || `作成先: ${targetSummary}`}
          </p>
        </section>

        <section className="ai-author-settings" aria-label="AI接続設定">
          <details>
            <summary><span className="ai-settings-label"><i aria-hidden="true" />接続設定</span><small>{profileStatus || "確認中…"}</small></summary>
            <div className="ai-settings-grid">
              <label>接続先<select value={slot} onChange={(event) => selectProvider(event.target.value)}>{providers.map((item) => <option key={item.slot} value={item.slot}>{item.label}</option>)}</select></label>
              <label>モデルID<input value={model} onChange={(event) => setModel(event.target.value)} list="ai-author-model-list" maxLength={240} /></label>
              <datalist id="ai-author-model-list">{modelOptions.map((item) => <option value={item} key={item} />)}</datalist>
              {provider?.provider === "compatible" && <label className="ai-base-url">APIベースURL<input type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} maxLength={500} /></label>}
              <label>APIキー<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={profile?.configured ? "保存済み（変更時のみ入力）" : "APIキーを入力"} maxLength={2048} autoComplete="off" /></label>
              <div className="ai-settings-actions"><button className="small-button" type="button" onClick={saveProvider}>設定保存</button><button className="text-button" type="button" onClick={() => void refreshModels()}>一覧取得</button><button className="danger-link" type="button" onClick={deleteApiKey} disabled={!profile?.configured}>キー削除</button></div>
            </div>
            <p>APIキーはこのタブのセッション中だけ保持され、教材バックアップには含まれません。タブを閉じた後は再入力が必要です。送信時は会話と表示中の教材コンテキストが選択先APIへ送られます。</p>
          </details>
        </section>

        <div className="ai-author-content">
          <section className="ai-chat-panel" aria-label="AIとの会話">
            <div className="ai-context-card"><div><small>STEP 2 · AIへ依頼</small><strong>{scopeLabels[scope].title}</strong></div><span>{targetSummary}</span></div>
            <div className="ai-chat-log" aria-live="polite" aria-busy={loading}>
              {!messages.length && <div className="ai-chat-empty"><span className="ai-empty-mark" aria-hidden="true">AI</span><strong>内容は丸投げでも大丈夫です。</strong><p>対象者や難易度を相談し、納得できるまで修正してから保存できます。</p><small>相談&nbsp; → &nbsp;下書き&nbsp; → &nbsp;確認して保存</small></div>}
              {messages.map((message) => <article key={message.id} className={`ai-chat-message ${message.role}`}><strong>{message.role === "user" ? "あなた" : "AI編集者"}</strong><p>{message.content}</p></article>)}
              {loading && <article className="ai-chat-message assistant loading"><strong>AI編集者</strong><p>下書きを考えています…</p></article>}
              <div ref={chatEndRef} />
            </div>
            <form className="ai-chat-form" onSubmit={send}>
              <label htmlFor="ai-author-input">AIへの依頼</label>
              <textarea id="ai-author-input" value={input} onChange={(event) => setInput(event.target.value)} rows={3} maxLength={12000} disabled={loading} />
              <div className="ai-chat-actions"><button className="text-button" type="button" onClick={() => setInput("下書きJSONの検証エラーを直し、同じ作成単位で完全な下書きをもう一度出してください。")}>JSON修正を依頼</button><button className="primary-button" type="submit" disabled={loading || !input.trim() || Boolean(targetValidationMessage)}>{loading ? "生成中…" : "送信"}</button></div>
            </form>
          </section>

          <section className="ai-preview-panel" aria-label="AI下書きプレビュー">
            <header><div><small>STEP 3 · REVIEW BEFORE SAVE</small><h3>下書きプレビュー</h3></div>{draft && <span className="ai-valid-badge">検証OK</span>}</header>
            {validationError && <p className="form-error" role="alert">{validationError}</p>}
            {requestError && <p className="form-error" role="alert">{requestError}</p>}
            {draft ? <AiDraftPreview draft={draft} /> : <div className="empty-state ai-preview-empty"><span aria-hidden="true">✓</span><strong>まだ保存されるものはありません</strong><p>AIが下書きを返すと、科目・セクション・問題をここで全件確認できます。</p><small>会話しただけでは教材へ反映されません。</small></div>}
            <div className="ai-preview-actions"><button className="text-button" type="button" onClick={() => { setDraft(null); setValidationError(""); }}>下書きを破棄</button><button className="primary-button" type="button" onClick={() => void saveDraft()} disabled={!draft || saving || loading}>{saving ? "保存中…" : "確認した下書きを保存"}</button></div>
          </section>
        </div>
      </div>
    </section>
  );
}

function AiDraftPreview({ draft }: { draft: AiDraft }) {
  const stats = aiDraftStats(draft);
  const sections = draft.scope === "subject" ? draft.subject.sections : draft.scope === "section" ? [draft.section] : [];
  const directQuestions = draft.scope === "question" ? draft.questions : [];
  return <div className="ai-draft-preview">
    <div className="preview-stats"><span><strong>{stats.subjects}</strong> 科目</span><span><strong>{stats.sections}</strong> セクション</span><span><strong>{stats.questions}</strong> 問題</span></div>
    {draft.scope === "subject" && <div className="ai-draft-heading"><i style={{ background: draft.subject.color }} /><div><strong>{draft.subject.name}</strong><p>{draft.subject.description}</p></div></div>}
    {sections.map((section, index) => <details key={`${section.name}-${index}`} open={index === 0}><summary>{section.name} <small>{section.questions.length}問</small></summary><p>{section.description}</p><QuestionPreviewList questions={section.questions} /></details>)}
    {directQuestions.length > 0 && <QuestionPreviewList questions={directQuestions} />}
  </div>;
}

function QuestionPreviewList({ questions }: { questions: AiQuestionDraft[] }) {
  return <ol className="ai-question-preview-list">{questions.map((question, index) => <li key={`${question.prompt}-${index}`}><details><summary>{question.prompt}</summary><ol type="A">{question.options.map((option, optionIndex) => <li className={optionIndex === question.correctIndex ? "correct" : ""} key={`${option}-${optionIndex}`}>{option}{optionIndex === question.correctIndex && <strong> 正答</strong>}</li>)}</ol><p>{question.explanation}</p>{question.tags.length > 0 && <small>{question.tags.join(" · ")}</small>}</details></li>)}</ol>;
}
