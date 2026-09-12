import { describe, expect, it } from "vitest";
import { escapeCsvFormula, hasFormulaPrefix, sanitizeMarkdown } from "../src/security/markdown";

describe("content safety", () => {
  it("raw HTMLを実行可能な要素にしない", () => {
    const html = sanitizeMarkdown("<img src=x onerror=alert(1)><script>alert(1)</script>");
    const template = document.createElement("template");
    template.innerHTML = html;
    expect(template.content.querySelector("script")).toBeNull();
    expect(template.content.querySelector("img")).toBeNull();
  });

  it("危険なリンクスキームを除去する", () => {
    expect(sanitizeMarkdown("[開く](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("CSV formula injectionを検出して無害化する", () => {
    expect(hasFormulaPrefix(" =2+2")).toBe(true);
    expect(hasFormulaPrefix("-3")).toBe(false);
    expect(escapeCsvFormula("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
  });
});
