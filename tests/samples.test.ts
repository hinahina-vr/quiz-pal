import { afterEach, describe, expect, it } from "vitest";
import { db, initializeDatabase } from "../src/db/database";
import { questionSchema, sectionSchema, subjectSchema } from "../src/domain/schema";
import { sampleQuestions, sampleSections, sampleSubjects } from "../src/samples/sampleData";

describe("built-in samples", () => {
  afterEach(async () => { await db.delete(); });

  it("すべての例題と親子関係がスキーマに適合する", () => {
    const subjectIds = new Set(sampleSubjects.map((item) => item.id));
    const sectionIds = new Set(sampleSections.map((item) => item.id));
    sampleSubjects.forEach((item) => expect(subjectSchema.safeParse(item).success).toBe(true));
    sampleSections.forEach((item) => {
      expect(sectionSchema.safeParse(item).success).toBe(true);
      expect(subjectIds.has(item.subjectId)).toBe(true);
    });
    sampleQuestions.forEach((item) => {
      expect(questionSchema.safeParse(item).success).toBe(true);
      expect(sectionIds.has(item.sectionId)).toBe(true);
    });
    const originalQuestions = sampleQuestions.filter((item) => item.origin === "built-in-example");
    const officialQuestions = sampleQuestions.filter((item) => item.origin === "ipa-official-past-question");
    expect(originalQuestions).toHaveLength(28);
    expect(originalQuestions.every((item) => item.license === "CC0-1.0")).toBe(true);
    expect(officialQuestions).toHaveLength(155);
    expect(officialQuestions.every((item) => item.license?.startsWith("©") && item.license.includes("IPA / 出典：") && item.license.includes("改変"))).toBe(true);
    expect(officialQuestions.every((item) => !item.promptMarkdown.includes("【出典・利用条件】"))).toBe(true);
    expect(officialQuestions.filter((item) => item.id.startsWith("ipa-ip-"))).toHaveLength(12);
    expect(officialQuestions.filter((item) => item.id.startsWith("ipa-fe-"))).toHaveLength(12);
    expect(officialQuestions.filter((item) => item.id.startsWith("ipa-ap-"))).toHaveLength(12);
    const practiceQuestions = officialQuestions.filter((item) => item.id.startsWith("ipa-practice-"));
    expect(practiceQuestions).toHaveLength(119);
    expect(practiceQuestions.every((item) => item.sourceUrl?.startsWith("https://www.ipa.go.jp/") || item.sourceUrl?.startsWith("https://www3.jitec.ipa.go.jp/"))).toBe(true);
    expect(practiceQuestions.every((item) => item.options.length === 4 && item.correctOptionIds.length === 1)).toBe(true);
    expect([...new Set(sampleQuestions.map((item) => item.id))]).toHaveLength(sampleQuestions.length);
    expect(sampleQuestions).toHaveLength(183);
    expect([
      "ipa-practice-ip-2026",
      "ipa-practice-ip-2025",
      "ipa-practice-ip-2024",
      "ipa-practice-fe-2026",
      "ipa-practice-fe-2025",
      "ipa-practice-fe-2024",
      "ipa-practice-ap-2025-fall",
      "ipa-practice-ap-2025-spring",
      "ipa-practice-ap-2024-fall",
    ].map((sectionId) => practiceQuestions.filter((item) => item.sectionId === sectionId).length)).toEqual([10, 10, 10, 19, 20, 20, 10, 10, 10]);
  });

  it("v1利用者の既存データを保ち、v6の試験例題だけを追加する", async () => {
    await db.open();
    await db.subjects.put({ id: "user-subject", name: "自作教材", description: "", color: "#112233", order: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01" });
    await db.settings.put({ key: "sampleSeedVersion", value: 1 });
    await initializeDatabase();
    expect(await db.subjects.get("user-subject")).toBeDefined();
    expect(await db.subjects.get("sample-math")).toBeUndefined();
    expect(await db.subjects.get("sample-it-passport")).toBeDefined();
    expect(await db.questions.count()).toBe(171);
    expect((await db.settings.get("sampleSeedVersion"))?.value).toBe(6);
  });

  it("v2利用者が編集した既存問題を上書きせず、IPA公式問題だけを追加する", async () => {
    await db.open();
    const edited = { ...sampleQuestions.find((item) => item.id === "sample-ip-1")!, promptMarkdown: "利用者が編集した問題", updatedAt: "2026-08-11" };
    await db.subjects.bulkAdd(sampleSubjects);
    await db.sections.bulkAdd(sampleSections.filter((item) => !item.id.startsWith("ipa-")));
    await db.questions.bulkAdd(sampleQuestions.filter((item) => item.origin === "built-in-example").map((item) => item.id === edited.id ? edited : item));
    await db.settings.put({ key: "sampleSeedVersion", value: 2 });
    await initializeDatabase();
    expect((await db.questions.get("sample-ip-1"))?.promptMarkdown).toBe("利用者が編集した問題");
    expect((await db.questions.toArray()).filter((item) => item.origin === "ipa-official-past-question")).toHaveLength(155);
    expect((await db.settings.get("sampleSeedVersion"))?.value).toBe(6);
  });

  it("旧版IPA問題の本文を維持し、本文内の長い出典表示だけを除く", async () => {
    await db.open();
    const target = sampleQuestions.find((item) => item.id === "ipa-ip-2026-q1")!;
    const edited = { ...target, promptMarkdown: "利用者が編集したIPA問題\n\n【出典・利用条件】旧版の長い表示", contentRevision: 7, updatedAt: "2026-08-12T01:00:00.000Z" };
    await db.subjects.bulkAdd(sampleSubjects);
    await db.sections.bulkAdd(sampleSections);
    await db.questions.bulkAdd(sampleQuestions.map((item) => item.id === edited.id ? edited : item));
    await db.settings.put({ key: "sampleSeedVersion", value: 3 });
    await initializeDatabase();
    const migrated = await db.questions.get(edited.id);
    expect(migrated?.promptMarkdown).toBe("利用者が編集したIPA問題");
    expect(migrated?.contentRevision).toBe(8);
    expect((await db.settings.get("sampleSeedVersion"))?.value).toBe(6);
  });
});
