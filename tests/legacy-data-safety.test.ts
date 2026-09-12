import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const source = await readFile(resolve(import.meta.dirname, "../public/legacy-data-safety.js"), "utf8");
const scope = { window: {} as { quizPalValidateLegacyDataset: (value: unknown) => any }, URL };
runInNewContext(source, scope);
const normalize = scope.window.quizPalValidateLegacyDataset;
const fixture = () => ({ manifest: { courses: [], sampleContentVersion: 6 }, courses: [{
  id: "course", name: "修了教材", completed: true, accent: "#123456", chapters: [{ id: "chapter", title: "章", questions: [{
    id: "question", prompt: "<img>も文字として読む", options: ["正解", "別解"], answer: 0, explanation: "説明", sourceTitle: "自作",
  }] }],
}] });

describe("untrusted legacy cache boundary", () => {
  it("drops executable and derived fields, rebuilding the manifest from text data", () => {
    const value: any = fixture();
    value.courses[0].chapters[0].questions[0].promptHtml = '<img src=x onerror="alert(1)">';
    value.courses[0].chapters[0].questions[0].optionsHtml = ['<svg onload="alert(1)">'];
    value.courses[0].asset = "https://attacker.invalid/code.js";
    const result = normalize(value);
    expect(JSON.stringify(result)).not.toMatch(/promptHtml|optionsHtml|attacker|onerror|onload/);
    expect(result.manifest.courses[0].asset).toBe("");
    expect(result.manifest.totalQuestions).toBe(1);
    expect(result.courses[0].completed).toBe(true);
    expect(result.courses[0].chapters[0].questions[0].prompt).toBe("<img>も文字として読む");
  });
  it("rejects dangerous source URLs, duplicate IDs and oversized options", () => {
    const value: any = fixture();
    value.courses[0].chapters[0].questions[0].sourceUrl = "javascript:alert(1)";
    expect(() => normalize(value)).toThrow();
    delete value.courses[0].chapters[0].questions[0].sourceUrl;
    value.courses.push(value.courses[0]);
    expect(() => normalize(value)).toThrow();
    const tooLarge = fixture(); tooLarge.courses[0].chapters[0].questions[0].options[0] = "a".repeat(10001);
    expect(() => normalize(tooLarge)).toThrow();
  });
  it("keeps empty libraries and typed answers without adding sample subjects", () => {
    expect(normalize({ manifest: { courses: [], sampleContentVersion: 6 }, courses: [] }).courses).toEqual([]);
    const value: any = fixture(); Object.assign(value.courses[0].chapters[0].questions[0], { format: "typing", answerText: "42" });
    expect(normalize(value).courses[0].chapters[0].questions[0].answerText).toBe("42");
  });
});
