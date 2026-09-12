import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";

const originalFetch = window.fetch;

describe("multi-provider LLM bridge", () => {
  it("keeps API keys session-only and normalizes five API response formats", async () => {
    // jsdom has no modal implementation; model the user's explicit session-only choice.
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable:true, value:function(this: HTMLDialogElement) { this.returnValue="session"; this.dispatchEvent(new Event("close")); } });
    document.body.innerHTML = `
      <div class="llm-panel-toolbar"><label for="llmModelSelect">モデル</label><select id="llmModelSelect">
        <option value="deepseek/deepseek-v4-flash">a</option>
        <option value="deepseek/deepseek-v4-pro">b</option>
        <option value="google/gemini-3.5-flash">c</option>
        <option value="anthropic/claude-sonnet-4.6">d</option>
        <option value="openai/gpt-5.4-mini">e</option>
      </select></div>
      <div class="llm-settings" id="llmSettings">
        <div id="llmSettingsStatus"></div>
        <section id="llmSetupGuide" hidden><a id="llmApiKeyHelpLink"></a></section>
        <label for="llmApiKeyInput">APIキー</label>
        <div class="llm-api-key-row"><input id="llmApiKeyInput"><button id="llmApiKeySave">保存</button><button id="llmApiKeyDelete">削除</button></div>
        <p id="llmApiKeyStorageNote"></p>
      </div>`;
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("local-quiz-studio-llm-providers-v1", JSON.stringify({
      version: 1,
      profiles: {
        "deepseek/deepseek-v4-flash": {
          provider: "openrouter",
          apiKey: "legacy-local-storage-secret",
          model: "legacy-model",
          baseUrl: "https://openrouter.ai/api/v1",
          updatedAt: 1,
        },
      },
    }));

    const externalFetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.includes("api.openai.com")) return new Response(JSON.stringify({ model: "gpt-test", output_text: "OpenAI回答", usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 } }), { status: 200 });
      if (url.includes("api.anthropic.com")) return new Response(JSON.stringify({ model: "claude-test", content: [{ type: "text", text: "Claude回答" }], usage: { input_tokens: 8, output_tokens: 4 } }), { status: 200 });
      if (url.includes("generativelanguage.googleapis.com")) return new Response(JSON.stringify({ model: "gemini-test", output_text: "Gemini回答", usage: { total_input_tokens: 7, total_output_tokens: 3, total_tokens: 10 } }), { status: 200 });
      return new Response(JSON.stringify({ model: "router-test", choices: [{ message: { content: "Chat回答" } }], usage: { prompt_tokens: 6, completion_tokens: 2, total_tokens: 8 } }), { status: 200 });
    });
    Object.defineProperty(window, "fetch", { configurable: true, writable: true, value: externalFetch });

    const source = await readFile(resolve(import.meta.dirname, "../public/llm-provider-bridge.js"), "utf8");
    window.eval(source);
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(window.__quizZenLlmBridge?.providers).toHaveLength(5);
    expect(window.__quizZenLlmBridge?.version).toBe(3);
    expect(window.__quizZenLlmBridge?.generate).toBeTypeOf("function");
    expect(window.__quizZenLlmBridge?.getProfile("deepseek/deepseek-v4-flash")).toMatchObject({ configured: true });
    expect(localStorage.getItem("local-quiz-studio-llm-providers-v1")).not.toContain("legacy-local-storage-secret");
    expect(sessionStorage.getItem("local-quiz-studio-llm-session-keys-v1")).toContain("legacy-local-storage-secret");
    expect(document.querySelector('label[for="llmModelSelect"]')).toHaveTextContent("接続先");
    expect(document.querySelector("#llmSetupGuide")).toHaveAttribute("hidden");
    expect(document.querySelector("#llmApiKeyHelpLink")).toHaveTextContent("OpenRouterでキーを取得");
    expect(document.querySelector("#llmApiKeyHelpLink")).toHaveAttribute("href", "https://openrouter.ai/settings/keys");

    await window.fetch("/api/llm/settings", { method: "DELETE" });
    expect(document.querySelector("#llmSetupGuide")).not.toHaveAttribute("hidden");

    const slots = [
      ["deepseek/deepseek-v4-flash", "router-model", "https://openrouter.ai/api/v1", "Chat回答"],
      ["deepseek/deepseek-v4-pro", "gpt-test", "https://api.openai.com/v1", "OpenAI回答"],
      ["google/gemini-3.5-flash", "gemini-test", "https://generativelanguage.googleapis.com/v1beta", "Gemini回答"],
      ["anthropic/claude-sonnet-4.6", "claude-test", "https://api.anthropic.com/v1", "Claude回答"],
      ["openai/gpt-5.4-mini", "compatible-test", "https://api.groq.com/openai/v1", "Chat回答"],
    ] as const;

    for (const [slot, model, baseUrl, expectedAnswer] of slots) {
      localStorage.setItem("quiz-zen-llm-model-v1", slot);
      (document.querySelector("#llmModelSelect") as HTMLSelectElement).value = slot;
      (document.querySelector("#llmProviderModelInput") as HTMLInputElement).value = model;
      (document.querySelector("#llmProviderBaseUrlInput") as HTMLInputElement).value = baseUrl;
      const settingsResponse = await window.fetch("/api/llm/settings", { method: "PUT", body: JSON.stringify({ apiKey: "test-secret-key-value-12345" }) });
      expect(await settingsResponse.json()).toMatchObject({ ok: true, configured: true, model });
      expect(document.querySelector("#llmSetupGuide")).toHaveAttribute("hidden");

      const explainResponse = await window.fetch("/api/llm/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: slot, question: { course: "科目", chapter: "章", format: "選択", prompt: "問題", options: ["A", "B"], correctAnswer: "A" }, conversation: [] }),
      });
      const explanation = await explainResponse.json();
      expect(explanation).toMatchObject({ ok: true, answer: expectedAnswer });
      if (slot === "google/gemini-3.5-flash") {
        expect(explanation.usage).toEqual({ promptTokens: 7, completionTokens: 3, totalTokens: 10 });
      }
    }

    const direct = await window.__quizZenLlmBridge?.generate({
      slot: "deepseek/deepseek-v4-flash",
      messages: [{ role: "system", content: "JSONで答える" }, { role: "user", content: "問題を作る" }],
      maxOutputTokens: 12000,
      temperature: 0.2,
    });
    expect(direct).toMatchObject({ ok: true, answer: "Chat回答" });
    expect(JSON.parse(String(externalFetch.mock.calls[5][1]?.body))).toMatchObject({
      max_tokens: 12000,
      temperature: 0.2,
      messages: [{ role: "system", content: "JSONで答える" }, { role: "user", content: "問題を作る" }],
    });

    expect(externalFetch).toHaveBeenCalledTimes(6);
    expect(externalFetch.mock.calls[0][1]?.headers).toMatchObject({
      "HTTP-Referer": window.location.origin,
      "X-OpenRouter-Title": "Local Quiz Studio",
    });
    expect(externalFetch.mock.calls[4][1]?.headers).not.toHaveProperty("HTTP-Referer");
    expect(externalFetch.mock.calls[4][1]?.headers).not.toHaveProperty("X-OpenRouter-Title");

    await window.fetch("/api/llm/settings", { method: "DELETE" });
    (document.querySelector("#llmProviderModelInput") as HTMLInputElement).value = "local-model";
    (document.querySelector("#llmProviderBaseUrlInput") as HTMLInputElement).value = "http://localhost:11434/v1";
    (document.querySelector("#llmProviderConfigSave") as HTMLButtonElement).click();
    const localResponse = await window.fetch("/api/llm/explain", {
      method: "POST",
      body: JSON.stringify({ model: "openai/gpt-5.4-mini", question: { prompt: "ローカル問題" }, conversation: [] }),
    });
    expect(await localResponse.json()).toMatchObject({ ok: true, answer: "Chat回答" });
    expect(externalFetch.mock.calls[6][1]?.headers).not.toHaveProperty("Authorization");
    const saved = localStorage.getItem("local-quiz-studio-llm-providers-v1") || "";
    expect(saved).not.toContain("test-secret-key-value-12345");
    expect(saved).not.toContain("問題");
    expect(sessionStorage.getItem("local-quiz-studio-llm-session-keys-v1")).toContain("test-secret-key-value-12345");

    window.__quizZenLlmBridge?.saveProfile("openai/gpt-5.4-mini", {
      apiKey: "endpoint-specific-secret",
      model: "compatible-test",
      baseUrl: "https://api.groq.com/openai/v1",
    });
    const restore = window.__quizZenLlmBridge?.restoreProfiles?.({
      version: 1,
      profiles: {
        "openai/gpt-5.4-mini": {
          provider: "compatible",
          model: "compatible-test",
          baseUrl: "https://api.x.ai/v1",
          updatedAt: 2,
        },
      },
    });
    expect(restore?.clearedApiKeys).toEqual(["openai/gpt-5.4-mini"]);
    expect(window.__quizZenLlmBridge?.getProfile("openai/gpt-5.4-mini")).toMatchObject({
      configured: false,
      baseUrl: "https://api.x.ai/v1",
    });
    expect(sessionStorage.getItem("local-quiz-studio-llm-session-keys-v1")).not.toContain("endpoint-specific-secret");
  });
});

afterAll(() => {
  Object.defineProperty(window, "fetch", { configurable: true, writable: true, value: originalFetch });
  localStorage.clear();
  sessionStorage.clear();
});
