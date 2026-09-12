import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFile(resolve(root, file), "utf8");

describe("site legal and privacy notice", () => {
  it("covers both editions and accurately separates local data from network services", async () => {
    const html = await read("public/legal.html");

    [
      "Web / Windows / Mac / Linux 共通",
      "ブラウザ保存領域",
      "HTML共通版",
      "HTMLファイル自体には書き込みません",
      "教材同期用サーバーへの自動送信は行いません",
      "GitHub Pages",
      "IPアドレス",
      "AI機能と外部API",
      "確認画面に同意した場合に限り",
      "アプリでは暗号化しません",
      "保存の解除・キーの削除",
      "APIキーを含めません",
    ].forEach((notice) => expect(html).toContain(notice));
  });

  it("distinguishes the licenses for code, original examples, and IPA questions", async () => {
    const html = await read("public/legal.html");

    expect(html).toContain("MIT License");
    expect(html).toContain("CC0 1.0");
    expect(html).toContain("著作権は独立行政法人情報処理推進機構にあり");
    expect(html).toContain("出典と改変内容を明記");
    expect(html).toContain("https://www.ipa.go.jp/shiken/faq.html");
    expect(html).toContain("THIRD_PARTY_NOTICES.md");
  });

  it("uses safe attributes on every external link", async () => {
    const html = await read("public/legal.html");
    const externalAnchors = html.match(/<a\s+[^>]*href="https:\/\/[^>]*>/g) ?? [];

    expect(externalAnchors.length).toBeGreaterThan(5);
    externalAnchors.forEach((anchor) => {
      expect(anchor).toContain('target="_blank"');
      expect(anchor).toContain('rel="noopener noreferrer"');
      expect(anchor).toContain('referrerpolicy="no-referrer"');
    });
  });
});

