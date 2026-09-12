import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const readProjectFile = (path: string) => readFileSync(resolve(root, path), "utf8");
const themeIds = [
  "fantasy",
  "mediterranean",
  "okinawa",
  "hokkaido",
  "halloween",
  "new-year",
  "christmas",
  "hanami",
  "event-horizon",
];
const seasonalThemeIds = ["okinawa", "hokkaido", "halloween", "new-year", "christmas", "hanami"];

describe("画面テーマ設定", () => {
  it("地中海を未設定時の既定テーマにする", () => {
    const bootstrap = readProjectFile("public/quiz-bootstrap.js");
    const app = readProjectFile("public/app.js");

    expect(bootstrap).toContain(': "mediterranean";');
    expect(bootstrap).toContain('document.documentElement.dataset.theme = "mediterranean";');
    expect(app).toContain('Object.hasOwn(VISUAL_THEMES, value) ? value : "mediterranean"');
    expect(app).toContain('return "mediterranean";');
  });

  it("指定された全テーマを選択肢・設定・スタイルへ揃えて登録する", () => {
    const html = readProjectFile("index.html");
    const app = readProjectFile("public/app.js");
    const styles = readProjectFile("public/styles.css");
    const choices = [...html.matchAll(/data-theme-choice="([^"]+)"/g)].map((match) => match[1]);

    expect(choices).toEqual(themeIds);
    themeIds.forEach((themeId) => {
      expect(app).toContain(themeId);
      expect(styles).toContain(`[data-theme="${themeId}"]`);
    });
  });

  it("海物語の名称を配布画面へ残さない", () => {
    expect(readProjectFile("index.html")).not.toContain("海物語");
    expect(readProjectFile("public/app.js")).not.toContain("海物語");
  });

  it("追加テーマにPC・スマホ専用の背景画像を設定する", () => {
    const styles = readProjectFile("public/styles.css");
    seasonalThemeIds.forEach((themeId) => {
      const desktopPath = `public/assets/themes/${themeId}.png`;
      const mobilePath = `public/assets/themes/${themeId}-mobile.png`;
      expect(existsSync(resolve(root, desktopPath))).toBe(true);
      expect(existsSync(resolve(root, mobilePath))).toBe(true);
      expect(styles).toContain(`url("./assets/themes/${themeId}.png")`);
      expect(styles).toContain(`url("./assets/themes/${themeId}-mobile.png")`);
      expect(styles).toContain(`.theme-choice-preview-${themeId} { background-image: url("./assets/themes/${themeId}.png"); }`);
    });
  });

  it("3D背景は剣と魔法テーマだけで起動する", () => {
    expect(readProjectFile("public/native-stage.js")).toContain('dataset.theme === "fantasy"');
    expect(readProjectFile("public/stage3d.js")).toContain('import "./native-stage.js?v=1"');
  });
});
