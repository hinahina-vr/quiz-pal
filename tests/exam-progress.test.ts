import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

const source = await readFile(resolve(import.meta.dirname, "../public/app.js"), "utf8");
const names = ["isExamProgressChapter", "localExamCategoryGroups", "loadCollapsedChapterCategories", "loadExpandedChapterCategories", "saveCollapsedChapterCategories", "isChapterCategoryCollapsed", "toggleChapterCategory", "renderChapterButton"];
const functions = names.map((name) => {
  const match = source.match(new RegExp(`^function ${name}\\([^\\n]*\\) \\{\\n.*?^\\}`, "ms"));
  if (!match) throw new Error(`Missing function ${name}`);
  return match[0];
}).join("\n");
const createRuntime = () => new Function("localStorage", "document", `
  const CHAPTER_CATEGORY_STORAGE_KEY = "quiz-zen-chapter-categories-v1";
  const CHAPTER_CATEGORY_EXPANDED_STORAGE_KEY = "quiz-zen-chapter-categories-expanded-v1";
  ${functions}
  const state = { collapsedChapterCategories: loadCollapsedChapterCategories(), expandedChapterCategories: loadExpandedChapterCategories() };
  const renderChapters = () => {};
  const chapterStats = (chapter) => chapter.stats;
  const isChapterButtonActive = () => false;
  const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
  const formatScore = (value) => value;
  let selected = null;
  const selectChapter = (index) => { selected = index; };
  const selectVirtualChapter = (chapter) => { selected = chapter.virtualKey; };
  return { ${names.join(", ")}, selected: () => selected };
`)(localStorage, document);

describe("upstream exam progress adapted to local courses", () => {
  beforeEach(() => localStorage.clear());

  it("recognizes existing IPA saves without changing IDs, question order, or ordinary courses", () => {
    const runtime = createRuntime();
    const study = { id: "study", questions: [{ id: "s1" }] };
    const exam = { id: "ipa-practice-fe-r8", questions: [{ id: "e2" }, { id: "e1" }] };
    const groups = runtime.localExamCategoryGroups({ id: "sample-fe", chapters: [study, exam] });
    expect(groups.map((group: { id: string }) => group.id)).toEqual(["sample-fe:study", "sample-fe:exams"]);
    expect(groups[1].chapters[0]).toEqual({ chapterItem: exam, index: 1 });
    expect(groups[1].chapters[0].chapterItem).toBe(exam);
    expect(runtime.localExamCategoryGroups({ id: "custom", chapters: [study] })).toEqual([]);
    expect(runtime.isExamProgressChapter({ id: "custom-exam", examGroup: true })).toBe(true);
  });

  it("remembers opening a default-closed group across reloads and keeps other courses independent", () => {
    const category = { id: "sample-fe:exams", defaultCollapsed: true };
    let runtime = createRuntime();
    expect(runtime.isChapterCategoryCollapsed(category)).toBe(true);
    runtime.toggleChapterCategory(category);
    runtime = createRuntime();
    expect(runtime.isChapterCategoryCollapsed(category)).toBe(false);
    expect(runtime.isChapterCategoryCollapsed({ id: "sample-ap:exams", defaultCollapsed: true })).toBe(true);
    runtime.toggleChapterCategory(category);
    expect(createRuntime().isChapterCategoryCollapsed(category)).toBe(true);
  });

  it("keeps old collapsed preferences and tolerates malformed stored preferences", () => {
    localStorage.setItem("quiz-zen-chapter-categories-v1", '["old-group",1,null]');
    localStorage.setItem("quiz-zen-chapter-categories-expanded-v1", '{broken');
    const runtime = createRuntime();
    expect(runtime.isChapterCategoryCollapsed({ id: "old-group" })).toBe(true);
    expect(runtime.isChapterCategoryCollapsed({ id: "ordinary" })).toBe(false);
    expect(runtime.loadExpandedChapterCategories().size).toBe(0);
  });

  it("renders correct-count text and accessible names, preserves normal scores and chapter selection", () => {
    const runtime = createRuntime();
    const chapter = { id: "ipa-practice-test", number: 2, title: '<img src=x onerror="bad()">', stats: { correct: 3, total: 10, answered: 3, score: 30, followUp: 0 } };
    const button = runtime.renderChapterButton(chapter, 4);
    expect(button.querySelector(".chapter-score").textContent).toBe("3/10正解");
    expect(button.getAttribute("aria-label")).toContain("最新結果 3/10問正解");
    expect(button.querySelector("img")).toBeNull();
    button.click();
    expect(runtime.selected()).toBe(4);
    const ordinary = runtime.renderChapterButton({ ...chapter, id: "ordinary" }, 0);
    expect(ordinary.querySelector(".chapter-score").textContent).toBe("30点");
    expect(ordinary.classList.contains("exam-group-button")).toBe(false);
  });
});
