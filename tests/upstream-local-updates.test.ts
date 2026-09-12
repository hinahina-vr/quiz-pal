import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFile(resolve(root, file), "utf8");

describe("safe upstream feature integration", () => {
  it("adds the upstream section-loop and option-shuffle controls with local persistence", async () => {
    const [html, app] = await Promise.all([read("index.html"), read("public/app.js")]);

    expect(html).toContain('id="sectionLoopButton"');
    expect(html).toContain('id="optionShuffleButton"');
    expect(app).toContain('const SECTION_LOOP_STORAGE_KEY = "quiz-zen-section-loop-v1"');
    expect(app).toContain('const OPTION_SHUFFLE_STORAGE_KEY = "quiz-zen-option-shuffle-v1"');
    expect(app).toContain("seededChoiceShuffle(completedOptions, optionShuffleSeed(question");
    expect(app).toContain("!state.sectionLoopMode && goToNextSectionFirstQuestion()");
  });

  it("adds answer copying and a browser-local image library", async () => {
    const [html, app] = await Promise.all([read("index.html"), read("public/app.js")]);

    expect(html).toContain('id="llmCopyButton"');
    expect(html).toContain('id="llmImageLibrary"');
    expect(html).toContain("このブラウザだけに保存");
    expect(html).toContain("セーブ・ロード対応");
    expect(app).toContain('const LLM_IMAGE_LIBRARY_SETTING_KEY = "llm-image-library-v1"');
    expect(app).toContain('transaction.objectStore("settings").put');
    expect(app).toContain("llmImages: normalizeLlmImageItems(imageRecord?.value).length");
    expect(app).not.toContain("/api/llm/images");
  });

  it("does not reintroduce personal cloud storage, authentication, or removed runtimes", async () => {
    const sources = await Promise.all([
      read("index.html"),
      read("public/app.js"),
      read("public/styles.css"),
      read("public/native-stage.js"),
    ]);
    const joined = sources.join("\n");

    expect(joined).not.toContain("/api/sync/study");
    expect(joined).not.toContain("/api/llm/images");
    expect(joined).not.toMatch(/\botp\b|one[- ]time password/i);
    expect(joined).not.toMatch(/\bvrm\b|vrma/i);
    expect(joined).not.toMatch(/three\.module|\bTHREE\b/);
    expect(joined).not.toMatch(/vendor\/(?:lucide|markdown|katex|three)/i);
  });
});
