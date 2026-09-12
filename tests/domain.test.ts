import { describe, expect, it } from "vitest";
import { evaluateAnswer, nextReviewState, type Question } from "../src/domain/types";

const question = (patch: Partial<Question>): Question => ({
  id: "q1", sectionId: "s1", type: "single_choice", promptMarkdown: "問題", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
  correctOptionIds: ["b"], acceptedAnswers: [], explanationMarkdown: "", tags: [], timeLimitSeconds: null,
  order: 0, contentRevision: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01", ...patch,
});

describe("evaluateAnswer", () => {
  it("単一選択を採点する", () => {
    expect(evaluateAnswer(question({}), ["b"])).toBe(true);
    expect(evaluateAnswer(question({}), ["a"])).toBe(false);
  });

  it("複数選択は順序に依存しない", () => {
    expect(evaluateAnswer(question({ type: "multiple_choice", correctOptionIds: ["a", "b"] }), ["b", "a"])).toBe(true);
  });

  it("文字入力をNFKCで正規化する", () => {
    expect(evaluateAnswer(question({ type: "text", options: [], correctOptionIds: [], acceptedAnswers: ["東京"] }), ["  東京  "])).toBe(true);
  });
});

describe("nextReviewState", () => {
  it("正解を1日・3日・拡張間隔へ進める", () => {
    const first = nextReviewState(undefined, true);
    const second = nextReviewState({ questionId: "q", bookmarked: false, understanding: "unrated", dueAt: null, intervalDays: 1, correctStreak: 1, updatedAt: "" }, true);
    expect(first.intervalDays).toBe(1);
    expect(second.intervalDays).toBe(3);
  });

  it("不正解で間隔を1日に戻す", () => {
    const result = nextReviewState({ questionId: "q", bookmarked: false, understanding: "mastered", dueAt: null, intervalDays: 14, correctStreak: 4, updatedAt: "" }, false);
    expect(result).toMatchObject({ intervalDays: 1, correctStreak: 0 });
  });
});
