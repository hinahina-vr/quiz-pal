import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFile(resolve(root, file), "utf8");
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

describe("Quiz Pal UI contract", () => {
  it("keeps the reviewed CSS snapshot except for self-hosted font declarations", async () => {
    const styles = await read("public/styles.css");
    const baseline = styles.replace(/@font-face \{\s*font-family: "Kaisei Opti";[\s\S]*?\}\s*/g, "");
    // Reviewed: the already shipped two-column subject tiles and quiet selection colors.
    expect(hash(baseline)).toBe("9df2839dd17b0bbc8790fbd92b9d01addb08c8d2944c3607aa03d414c1764f55");
    const fonts = await read("public/fonts.css");
    expect(fonts.match(/@font-face \{/g)).toHaveLength(10);
    expect(fonts).toContain('url("./assets/fonts/KaiseiOpti-Regular-common.woff2")');
  });

  it("keeps the reviewed quiz HTML snapshot at the browser-native runtime boundary", async () => {
    const html = await read("index.html");
    const publication = JSON.parse(await read("publication.config.json"));
    const normalized = html
      .replace("quiz-tour.css?v=1.0.0-guide-opt-out", "quiz-tour.css?v=20260908-guide")
      .replace("quiz-tour.js?v=1.0.0-guide-opt-out", "quiz-tour.js?v=1.0.0-release")
      .replace("product-intro.js?v=1.0.0-guide-opt-out", "product-intro.js?v=1.0.0-release")
      .replaceAll(`https://github.com/${publication.owner}/${publication.repository}`, "__PUBLIC_REPOSITORY__")
      .replace('    <link rel="stylesheet" href="./native-math.css?v=1" />\n    <script src="./native-runtime.js?v=1"></script>', '    <script src="./vendor/lucide/lucide.min.js?v=1.34.0"></script>')
      .replace('    <script src="./data.js?v=20260709-math-ii-training"></script>', '    <script src="./vendor/markdown/marked.umd.js?v=18.0.9"></script>\n    <script src="./vendor/markdown/purify.min.js?v=3.4.13"></script>\n    <script src="./data.js?v=20260709-math-ii-training"></script>');
    // Reviewed v1.0: understanding popover and grouped image/AI actions; browser regression in check-question-controls.cjs.
    expect(hash(normalized)).toBe("0bf13d9af3616f8454c43d6908add3f5888b325f278011b9b87da383e17d9e8f");
  });

  it("keeps the reviewed quiz runtime snapshot at math-runtime asset paths", async () => {
    const app = await read("public/app.js");
    const normalized = app
      .replace('./native-math.css?v=1', './vendor/katex/katex.min.css?v=0.17.0')
      .replace('./native-runtime.js?v=1', './vendor/katex/katex.min.js?v=0.17.0')
      .replace('./native-runtime.js?v=1', './vendor/katex/contrib/auto-render.min.js?v=0.17.0')
      .replace('    const raw = String(value || "").trim();\n    if (!raw) return "";\n    const url = new URL(raw, location.href);', '    const url = new URL(String(value || ""), location.href);');
    // Reviewed: local key save stays in settings so the user can choose consent; no automatic AI request in that flow. Also derive completed courses from stored subjects and select an active course on startup, and preserve/validate completion in full backups.
    expect(hash(normalized)).toBe("12ac50e95fdc84706f8c08c17c8de5bbc641323fb09c89a606bd61a8bb94575d");
  });

  it("fixes the quiz UI to five choices without a format selector", async () => {
    const [html, app] = await Promise.all([read("index.html"), read("public/app.js")]);
    expect(html).not.toContain("format-switch");
    expect(html).not.toContain("format-tab");
    expect(html).not.toContain("出題形式");
    expect(html.match(/<strong id="(?:formatLabel|sideFormatLabel)">5択<\/strong>/g)).toHaveLength(2);
    expect(app).toContain('formatLabel: "5択"');
    expect(app).toContain("completeChoiceOptions([correct, ...selectedWrongs.slice(0, count - 1)], question, count)");
    expect(app).not.toContain("state.formatMode");
  });

  it("uses the same browser-native stage entry in development and builds", async () => {
    expect(await read("stage3d.js")).toBe(await read("public/stage3d.js"));
    const stage = await read("public/native-stage.js");
    expect(stage).toContain('dataset.theme === "fantasy"');
    expect(stage).toContain("function spawnBurst(clientX, clientY)");
    expect(stage).toContain('getContext("2d"');
    expect(stage).not.toMatch(/three(?:\.module)?|\bTHREE\b/i);
  });

  it("retains the original LLM, source, right-rail, and maintenance controls", async () => {
    const html = await read("index.html");
    [
      'id="llmTeachButton"', 'id="llmExplanationPanel"', 'id="questionSourceButton"',
      'id="questionSourceDialog"', 'class="right-rail"', 'class="toolbar"',
      'class="maintenance-entry"', 'href="./studio.html"', "出典はこちら", "問題をつくる・なおす",
    ].forEach((contract) => expect(html).toContain(contract));
  });

  it("keeps the first-page guide and its API-key notice", async () => {
    const [html, tourScript, tourStyles] = await Promise.all([
      read("index.html"), read("public/quiz-tour.js"), read("public/quiz-tour.css"),
    ]);
    expect(html).toContain('id="quizGuideButton"');
    ["courses", "chapters", "quiz", "llm"].forEach((id) => expect(html).toContain(`data-quiz-tour-id="${id}"`));
    expect(tourScript).toContain('const STORAGE_KEY = "quiz-pal-main-guide-hidden"');
    expect(tourScript).toContain('title: "困ったらガイドをもう一度"');
    expect(tourScript.match(/APIキーの登録が必要です/g)).toHaveLength(2);
    expect(tourStyles).toContain(".quiz-tour-spotlight");
    expect(tourStyles).toContain("overflow-y: auto");
  });

  it("removes personal sync while retaining local backup and restore", async () => {
    const [html, app] = await Promise.all([read("index.html"), read("public/app.js")]);
    expect(html).not.toContain('id="studySyncButton"');
    expect(html).not.toContain('id="studySyncStatus"');
    expect(app).not.toContain("/api/sync/study");
    expect(app).not.toContain("/api/llm/images");
    expect(app).not.toContain("bootstrapStudySync");
    expect(html).toContain('id="fullDataSaveButton"');
    expect(html).toContain('id="fullDataLoadButton"');
    expect(html).toContain("このブラウザだけに保存");
  });

  it("guides first-time LLM users through API-key setup before requesting", async () => {
    const [html, app, bridge, styles] = await Promise.all([
      read("index.html"), read("public/app.js"), read("public/llm-provider-bridge.js"), read("public/styles.css"),
    ]);
    expect(html).toContain('id="llmSetupGuide"');
    expect(html).toContain("APIキーを設定すると使えます");
    expect(html).toContain("接続先を選ぶ");
    expect(html).toContain("APIキーを用意する");
    expect(html).toContain("貼り付けて保存する");
    expect(html).toContain('id="llmSetupGuide" aria-labelledby="llmSetupGuideTitle" tabindex="-1"');
    expect(app).toContain("const settings = await refreshLlmSettings({ force: true })");
    expect(app).toContain("setLlmSettingsOpen(true, { focusGuide: true })");
    expect(app).toContain("最初にAPIキーを設定してください。3ステップで始められます。");
    expect(bridge).toContain("https://openrouter.ai/settings/keys");
    expect(bridge).toContain("https://platform.openai.com/api-keys");
    expect(bridge).toContain("https://aistudio.google.com/app/apikey");
    expect(bridge).toContain("https://platform.claude.com/settings/keys");
    expect(styles).toContain(".llm-setup-guide");
    expect(styles).toContain("max-height: min(58dvh, 520px)");
  });

  it("does not render or start the removed weather widget", async () => {
    const [html, app] = await Promise.all([read("index.html"), read("public/app.js")]);
    expect(html).not.toContain('class="weather-card"');
    expect(html).not.toContain('id="weatherRefreshButton"');
    expect(html).not.toContain("町田市の今日の天気");
    expect(app).not.toContain("startWeatherTicker();");
  });

  it("puts complete save and load controls directly above question maintenance", async () => {
    const [html, app] = await Promise.all([read("index.html"), read("public/app.js")]);
    const saveIndex = html.indexOf('id="fullDataSaveButton"');
    const loadIndex = html.indexOf('id="fullDataLoadButton"');
    const maintenanceIndex = html.indexOf('class="maintenance-entry"');
    const portableIndex = html.indexOf('class="portable-promo"');
    expect(saveIndex).toBeGreaterThan(-1);
    expect(loadIndex).toBeGreaterThan(saveIndex);
    expect(maintenanceIndex).toBeGreaterThan(loadIndex);
    expect(portableIndex).toBeGreaterThan(maintenanceIndex);
    expect(html).toContain("APIキー除外");
    expect(app).toContain('const FULL_DATA_BACKUP_APP = "quiz-zen-complete-backup"');
    expect(app).toContain("チェックサムが一致しません");
  });

  it("advertises the HTML portable edition and keeps legal information visible", async () => {
    const [html, studio, links] = await Promise.all([
      read("index.html"), read("src/App.tsx"), read("public/site-links.css"),
    ]);
    const releaseUrl = "./downloads/Quiz-Pal-HTML.zip";
    [html, studio].forEach((page) => {
      expect(page).toContain(releaseUrl);
      expect(page).toContain("このアプリを持ち帰る");
      expect(page).toContain("インストール不要");
      expect(page).toContain("利用条件・プライバシー");
      expect(page).toContain("./legal.html");
    });
    expect(links).toContain(".portable-promo");
    expect(links).toContain(".sidebar-site-links");
  });

  it("ships only self-authored browser runtime and retains the reference hosting policy", async () => {
    const [html, studio, headers, packageJson, bridge] = await Promise.all([
      read("index.html"), read("studio.html"), read("public/_headers"), read("package.json"), read("public/llm-provider-bridge.js"),
    ]);
    expect(html).toContain('./native-runtime.js?v=1');
    expect(studio).toContain('./native-runtime.js?v=1');
    expect(`${html}\n${studio}`).not.toMatch(/vendor\/(?:lucide|markdown|katex|three)|fonts\.googleapis|fonts\.gstatic/i);
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
    expect(headers).toContain("script-src 'self'");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("X-Frame-Options: DENY");
    expect(JSON.parse(packageJson).dependencies).toEqual({});
    expect(bridge).toContain('const SESSION_KEYS_STORAGE_KEY = "local-quiz-studio-llm-session-keys-v1"');
    expect(bridge).not.toContain("localStorage.setItem(STORAGE_KEY, JSON.stringify(store))");
  });

  it("does not ship VRM UI, runtime code, loaders, or animation assets", async () => {
    const files = await Promise.all([
      "index.html", "public/styles.css", "public/app.js", "public/native-stage.js",
    ].map(read));
    expect(files.join("\n")).not.toMatch(/vrm|vrma/i);
    const assets = await readdir(resolve(root, "public/assets"));
    expect(assets.some((file) => /^vrma_/i.test(file))).toBe(false);
  });

  it("keeps IPA attribution out of the question body and exposes it to the popup", async () => {
    const course = await read("public/data/courses/sample-it-passport.js");
    expect(course).not.toContain("【出典・利用条件】");
    expect(course).toContain('"sourceTitle": "©2026 IPA / 出典：');
    expect(course).toContain('"sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"');
    expect(course).toContain('"sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"');
  });
});
