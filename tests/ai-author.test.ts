import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/database";
import type { LibrarySnapshot, Section, Subject } from "../src/domain/types";
import { aiDraftSchema, lockAiDraftIdentity, parseAiDraftResponse, persistAiDraft } from "../src/features/ai-author/aiAuthor";

const now = "2026-08-12T00:00:00.000Z";
const subject: Subject = { id: "subject-existing", name: "既存科目", description: "説明", color: "#7c3aed", order: 0, createdAt: now, updatedAt: now };
const section: Section = { id: "section-existing", subjectId: subject.id, name: "既存セクション", description: "説明", order: 0, createdAt: now, updatedAt: now };
const emptySnapshot = (patch: Partial<LibrarySnapshot> = {}): LibrarySnapshot => ({
  subjects: [], sections: [], questions: [], attempts: [], questionStates: [], studySessions: [], ...patch,
});
const question = {
  prompt: "2進数1010を10進数で表した値はどれか。",
  options: ["8", "9", "10", "11", "12"],
  correctIndex: 2,
  explanation: "1010₂ = 8 + 2 = 10です。",
  tags: ["2進数"],
  timeLimitSeconds: 60,
};

describe("AI教材作成", () => {
  beforeEach(async () => { await db.delete(); await db.open(); });
  afterEach(async () => { await db.delete(); });

  it("タグ付きJSONを取り出して5択問題を検証する", () => {
    const response = `作成しました。\n<quiz-draft>${JSON.stringify({ scope: "question", questions: [question] })}</quiz-draft>`;
    const result = parseAiDraftResponse(response, "question");
    expect(result.assistantText).toBe("作成しました。");
    expect(result.validationError).toBe("");
    expect(result.draft?.scope).toBe("question");
  });

  it("5択でない下書きと異なる作成単位を保存候補にしない", () => {
    const invalid = parseAiDraftResponse(`<quiz-draft>${JSON.stringify({ scope: "question", questions: [{ ...question, options: ["1", "2", "3", "4"] }] })}</quiz-draft>`, "question");
    expect(invalid.draft).toBeNull();
    expect(invalid.validationError).toContain("options");

    const wrongScope = parseAiDraftResponse(`<quiz-draft>${JSON.stringify({ scope: "question", questions: [question] })}</quiz-draft>`, "subject");
    expect(wrongScope.draft).toBeNull();
    expect(wrongScope.validationError).toContain("作成単位が一致しません");
  });

  it("画面で指定した科目名とセクション名をAI下書きより優先する", () => {
    const subjectDraft = aiDraftSchema.parse({
      scope: "subject",
      subject: { name: "AIが付けた科目名", description: "説明", color: "#336699", sections: [{ name: "導入", description: "", questions: [question] }] },
    });
    const sectionDraft = aiDraftSchema.parse({
      scope: "section",
      section: { name: "AIが付けたセクション名", description: "説明", questions: [question] },
    });

    const lockedSubject = lockAiDraftIdentity(subjectDraft, { subjectName: "  利用者指定の科目  " });
    const lockedSection = lockAiDraftIdentity(sectionDraft, { sectionName: "利用者指定のセクション" });

    expect(lockedSubject.scope === "subject" && lockedSubject.subject.name).toBe("利用者指定の科目");
    expect(lockedSection.scope === "section" && lockedSection.section.name).toBe("利用者指定のセクション");
    expect(() => lockAiDraftIdentity(subjectDraft, { subjectName: "" })).toThrow("新しい科目名を入力してください");
  });

  it("科目単位の下書きを配下のセクション・問題と一括保存する", async () => {
    const draft = aiDraftSchema.parse({
      scope: "subject",
      subject: { name: "AI基礎", description: "AIで学ぶ基礎", color: "#336699", sections: [{ name: "導入", description: "最初の章", questions: [question] }] },
    });
    const result = await persistAiDraft(draft, emptySnapshot({ subjects: [subject], sections: [section] }), { subjectId: subject.id, sectionId: section.id });
    expect(result).toMatchObject({ subjects: 1, sections: 1, questions: 1 });
    expect(result.subjectId).not.toBe(subject.id);
    expect(result.sectionId).not.toBe(section.id);
    expect(await db.subjects.count()).toBe(1);
    expect(await db.sections.count()).toBe(1);
    const stored = await db.questions.get(result.questionId);
    expect(stored).toMatchObject({ sectionId: result.sectionId, type: "single_choice", origin: "ai-generated", explanationMarkdown: question.explanation });
    expect(stored?.options).toHaveLength(5);
    expect(stored?.correctOptionIds).toEqual([stored?.options[2].id]);
  });

  it("セクション単位の下書きを選択中の科目へ保存する", async () => {
    await db.subjects.add(subject);
    const draft = aiDraftSchema.parse({ scope: "section", section: { name: "AI追加章", description: "追加", questions: [question] } });
    const result = await persistAiDraft(draft, emptySnapshot({ subjects: [subject] }), { subjectId: subject.id });
    expect(result).toMatchObject({ subjectId: subject.id, subjects: 0, sections: 1, questions: 1 });
    expect((await db.sections.get(result.sectionId))?.subjectId).toBe(subject.id);
  });

  it("問題単位の下書きを選択中のセクションへ追記する", async () => {
    await db.subjects.add(subject);
    await db.sections.add(section);
    const draft = aiDraftSchema.parse({ scope: "question", questions: [question, { ...question, prompt: "16進数Aを10進数で表すとどれか。" }] });
    const result = await persistAiDraft(draft, emptySnapshot({ subjects: [subject], sections: [section] }), { subjectId: subject.id, sectionId: section.id });
    expect(result).toMatchObject({ subjectId: subject.id, sectionId: section.id, subjects: 0, sections: 0, questions: 2 });
    const stored = await db.questions.where("sectionId").equals(section.id).sortBy("order");
    expect(stored.map((item) => item.order)).toEqual([0, 1]);
    expect(stored.every((item) => item.options.length === 5 && item.correctOptionIds.length === 1)).toBe(true);
  });
});
