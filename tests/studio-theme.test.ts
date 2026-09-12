import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { applyStoredVisualTheme, normalizeVisualTheme, VISUAL_THEME_IDS, VISUAL_THEME_STORAGE_KEY } from "../src/theme";

const root = resolve(import.meta.dirname, "..");
const readProjectFile = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("教材管理のテーマ同期", () => {
  it("クイズと同じ全テーマを受け付け、未設定・不正値は地中海に戻す", () => {
    VISUAL_THEME_IDS.forEach((themeId) => expect(normalizeVisualTheme(themeId)).toBe(themeId));
    expect(normalizeVisualTheme(null)).toBe("mediterranean");
    expect(normalizeVisualTheme("unknown-theme")).toBe("mediterranean");
  });

  it("保存済みテーマをdocumentElementへ適用する", () => {
    localStorage.setItem(VISUAL_THEME_STORAGE_KEY, "halloween");
    expect(applyStoredVisualTheme()).toBe("halloween");
    expect(document.documentElement.dataset.theme).toBe("halloween");
  });

  it("初回描画前に保存テーマを読み、教材・AI画面で共通テーマ変数を使う", () => {
    const html = readProjectFile("studio.html");
    const bootstrap = readProjectFile("public/theme-bootstrap.js");
    const sharedStyles = readProjectFile("public/styles.css");
    const styles = readProjectFile("public/studio.css");
    const bootstrapPosition = html.indexOf("theme-bootstrap.js");
    const stylesheetPosition = html.indexOf("styles.css");

    expect(bootstrapPosition).toBeGreaterThan(0);
    expect(bootstrapPosition).toBeLessThan(stylesheetPosition);
    expect(html).not.toContain("fonts.googleapis.com");
    expect(readProjectFile("public/fonts.css")).toContain('./assets/fonts/KaiseiOpti-Regular-common.woff2');
    expect(html).toContain('./fonts.css?v=20260908-performance');
    VISUAL_THEME_IDS.forEach((themeId) => expect(bootstrap).toContain(themeId));
    expect(bootstrap).toContain('localStorage.getItem("quiz-zen-visual-theme-v1")');
    expect(styles).toContain("var(--theme-scene)");
    expect(styles).toContain("var(--theme-panel)");
    expect(styles).toContain("var(--theme-line)");
    expect(styles).toContain(".ai-author-shell::before");
    expect(styles).toContain('font-family: "Kaisei Opti"');
    expect(styles).toContain("width: calc(100vw - 24px)");
  });
});
