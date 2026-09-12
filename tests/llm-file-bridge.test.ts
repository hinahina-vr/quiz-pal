import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

describe("LLM bridge in local HTML files", () => {
  it.each(["file:///C:/Quiz-Pal-HTML/index.html", "file:///Users/example/Quiz-Pal-HTML/index.html", "file:///home/example/Quiz-Pal-HTML/index.html"])("handles settings and explanation routes without disk reads at %s", async (url) => {
    document.body.replaceChildren(); localStorage.clear(); sessionStorage.clear();
    const external = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ choices: [{ message: { content: "test answer" } }] }), { status: 200 }));
    const context: any = { document, localStorage, sessionStorage, location: new URL(url), URL, Response, fetch: external, setTimeout, clearTimeout, AbortController, console };
    context.window = context;
    runInNewContext(await readFile(resolve(import.meta.dirname, "../public/llm-provider-bridge.js"), "utf8"), context);
    const initial = await context.fetch("/api/llm/settings");
    expect(await initial.json()).toMatchObject({ ok: true, configured: false });
    await context.fetch("/api/llm/settings", { method: "PUT", body: JSON.stringify({ apiKey: "test-file-key-12345" }) });
    expect(external).not.toHaveBeenCalled();
    const explained = await context.fetch("/api/llm/explain", { method: "POST", body: JSON.stringify({ model: "deepseek/deepseek-v4-flash", question: { course: "test", chapter: "test", prompt: "2+2", options: ["4", "5"], correctAnswer: "4" } }) });
    expect(await explained.json()).toMatchObject({ ok: true, answer: "test answer" });
    expect(external).toHaveBeenCalledTimes(1);
    expect(String(external.mock.calls[0][0])).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(external.mock.calls[0][1]?.headers).not.toHaveProperty("HTTP-Referer");
    expect(localStorage.getItem("local-quiz-studio-llm-providers-v1")).not.toContain("test-file-key-12345");
    expect(sessionStorage.getItem("local-quiz-studio-llm-session-keys-v1")).toContain("test-file-key-12345");
  });
});
