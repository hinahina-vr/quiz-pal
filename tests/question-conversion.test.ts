import { describe, it, expect } from "vitest";
import { legacyQuestion } from "../src/bridge/legacyDataset";
import { sampleQuestions } from "../src/samples/sampleData";
describe("authored question conversion", () => {
  it("keeps all statements and the correct combination for the reported percentage question", () => {
    const q = legacyQuestion(sampleQuestions.find(q => q.id === "sample-ratio-2")!);
    for (const text of ["ア：1/2", "イ：0.5", "ウ：5", "エ：50/100"]) expect(q.prompt).toContain(text);
    expect(q.options[q.answer]).toBe("ア・イ・エ");
    expect(new Set(q.options).size).toBe(q.options.length);
    expect(q.options).not.toContain("ア・イ・エ以外（ウを含む）");
  });
  it("preserves original choices, correct answers and explanations across all bundled questions", () => {
    expect(sampleQuestions).toHaveLength(183);
    for (const source of sampleQuestions) {
      const q = legacyQuestion(source);
      expect(q.explanation).toBe(source.explanationMarkdown.replaceAll("`", ""));
      if (source.type !== "multiple_choice" && source.type !== "text") {
        expect(q.options).toEqual(source.options.map(o => o.text));
        expect(source.options[q.answer].id).toBe(source.correctOptionIds[0]);
      } else if (source.type === "text") {
        expect(q.format).toBe("typing"); expect(q.answerText).toBe(source.acceptedAnswers[0]);
      } else {
        source.options.forEach(o => expect(q.prompt).toContain(o.text.replaceAll("`", "")));
        expect(q.options.filter(o => o === q.options[q.answer])).toHaveLength(1);
      }
    }
  });
});
