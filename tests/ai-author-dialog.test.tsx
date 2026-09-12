import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/db/database";
import type { LibrarySnapshot, Section, Subject } from "../src/domain/types";
import { AiAuthorDialog } from "../src/features/ai-author/AiAuthorDialog";
import { cleanup, render, screen, waitFor } from "./native-render";

const now = "2026-08-12T00:00:00.000Z";
const subject: Subject = { id: "subject-existing", name: "情報技術", description: "基礎", color: "#7c3aed", order: 0, createdAt: now, updatedAt: now };
const section: Section = { id: "section-existing", subjectId: subject.id, name: "基礎理論", description: "進数", order: 0, createdAt: now, updatedAt: now };
const secondSubject: Subject = { id: "subject-second", name: "電気工事", description: "配線", color: "#336699", order: 1, createdAt: now, updatedAt: now };
const secondSection: Section = { id: "section-second", subjectId: secondSubject.id, name: "配線設計", description: "設計", order: 0, createdAt: now, updatedAt: now };
const snapshot: LibrarySnapshot = { subjects: [subject, secondSubject], sections: [section, secondSection], questions: [], attempts: [], questionStates: [], studySessions: [] };
const aiQuestion = {
  prompt: "2進数1010を10進数で表した値はどれか。",
  options: ["8", "9", "10", "11", "12"],
  correctIndex: 2,
  explanation: "8 + 2なので10です。",
  tags: ["2進数"],
  timeLimitSeconds: 60,
};
const aiResponse = `下書きを作りました。<quiz-draft>${JSON.stringify({
  scope: "question",
  questions: [aiQuestion],
})}</quiz-draft>`;
const aiResult = (answer: string) => ({ ok: true as const, answer, model: "test-model", usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 } });

describe("AI教材作成ダイアログ", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await db.subjects.add(subject);
    await db.sections.add(section);
    await db.subjects.add(secondSubject);
    await db.sections.add(secondSection);
    const profile = { provider: "openrouter", providerLabel: "OpenRouter", configured: true, model: "test-model", baseUrl: "https://openrouter.ai/api/v1" };
    window.__quizZenLlmBridge = {
      version: 2,
      providers: [{ slot: "slot-1", provider: "openrouter", label: "OpenRouter" }],
      getProfile: () => ({ ...profile, slot: "slot-1" }),
      getActiveSlot: () => "slot-1",
      setActiveSlot: () => "slot-1",
      saveProfile: () => profile,
      deleteApiKey: () => ({ ...profile, configured: false }),
      listModels: vi.fn(async () => ["test-model"]),
      generate: vi.fn(async () => aiResult(aiResponse)),
    };
  });

  afterEach(async () => {
    cleanup();
    window.__quizZenLlmBridge = undefined;
    await db.delete();
  });

  it("対話で生成した5択問題をプレビュー後にだけ保存する", async () => {
    const onSaved = vi.fn();
    const announce = vi.fn();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    const user = userEvent.setup();
    render(<AiAuthorDialog initialScope="question" snapshot={snapshot} subject={subject} section={section} onClose={vi.fn()} reload={vi.fn(async () => undefined)} announce={announce} onSaved={onSaved} />);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/追加先の科目/)).toHaveValue(subject.id);
    expect(screen.getByLabelText(/追加先のセクション/)).toHaveValue(section.id);
    expect(await db.questions.count()).toBe(0);
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(await screen.findByText("検証OK")).toBeInTheDocument();
    expect(screen.getByText("2進数1010を10進数で表した値はどれか。")).toBeInTheDocument();
    expect(await db.questions.count()).toBe(0);

    await user.click(screen.getByRole("button", { name: "確認した下書きを保存" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(await db.questions.count()).toBe(1);
    expect(announce).toHaveBeenCalledWith("AI下書きから0科目・0セクション・1問を追加しました。");
  });

  it("新規科目名を必須入力にしてAIが返した別名を保存しない", async () => {
    const response = `作成しました。<quiz-draft>${JSON.stringify({
      scope: "subject",
      subject: {
        name: "AIが勝手に付けた名前",
        description: "説明",
        color: "#336699",
        sections: [{ name: "導入", description: "", questions: [aiQuestion] }],
      },
    })}</quiz-draft>`;
    vi.mocked(window.__quizZenLlmBridge!.generate).mockResolvedValueOnce(aiResult(response));
    const user = userEvent.setup();
    render(<AiAuthorDialog initialScope="subject" snapshot={snapshot} onClose={vi.fn()} reload={vi.fn(async () => undefined)} announce={vi.fn()} onSaved={vi.fn()} />);

    expect(await screen.findByRole("button", { name: "送信" })).toBeDisabled();
    await user.type(screen.getByLabelText(/新しい科目名/), "クラウド基礎");
    expect(screen.getByRole("button", { name: "送信" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(await screen.findByText("検証OK")).toBeInTheDocument();
    expect(screen.getAllByText("クラウド基礎").length).toBeGreaterThan(0);
    expect(screen.queryByText("AIが勝手に付けた名前")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "確認した下書きを保存" }));
    await waitFor(async () => expect((await db.subjects.toArray()).filter((item) => item.name === "クラウド基礎")).toHaveLength(1));
    expect((await db.subjects.toArray()).filter((item) => item.name === "AIが勝手に付けた名前")).toHaveLength(0);
  });

  it("既存科目を選び、入力した名前でセクションを追加する", async () => {
    const response = `作成しました。<quiz-draft>${JSON.stringify({
      scope: "section",
      section: {
        name: "AIが勝手に付けた章名",
        description: "説明",
        questions: [aiQuestion],
      },
    })}</quiz-draft>`;
    vi.mocked(window.__quizZenLlmBridge!.generate).mockResolvedValueOnce(aiResult(response));
    const user = userEvent.setup();
    render(<AiAuthorDialog initialScope="section" snapshot={snapshot} subject={subject} onClose={vi.fn()} reload={vi.fn(async () => undefined)} announce={vi.fn()} onSaved={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/追加先の科目/), secondSubject.id);
    await user.type(screen.getByLabelText(/新しいセクション名/), "施工の安全");
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(await screen.findByText("検証OK")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "確認した下書きを保存" }));

    await waitFor(async () => expect((await db.sections.toArray()).filter((item) => item.name === "施工の安全")).toHaveLength(1));
    const stored = (await db.sections.toArray()).find((item) => item.name === "施工の安全")!;
    expect(stored.subjectId).toBe(secondSubject.id);
    expect((await db.sections.toArray()).filter((item) => item.name === "AIが勝手に付けた章名")).toHaveLength(0);
  });
});
