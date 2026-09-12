/// <reference types="vite/client" />

interface QuizZenLlmProfile {
  slot?: string;
  provider: string;
  providerLabel: string;
  configured: boolean;
  model: string;
  baseUrl: string;
}

interface QuizZenLlmBridge {
  version: number;
  providers: Array<{ slot: string; provider: string; label: string }>;
  getProfile: (slot: string) => QuizZenLlmProfile;
  getActiveSlot: () => string;
  setActiveSlot: (slot: string) => string;
  saveProfile: (slot: string, patch: { model?: string; baseUrl?: string; apiKey?: string }) => QuizZenLlmProfile;
  deleteApiKey: (slot: string) => QuizZenLlmProfile;
  restoreProfiles?: (settings: {
    version: 1;
    profiles: Record<string, { provider: string; model: string; baseUrl: string; updatedAt: number | null }>;
  }) => { ok: true; clearedApiKeys: string[] };
  listModels: (slot: string) => Promise<string[]>;
  generate: (request: {
    slot: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    maxOutputTokens?: number;
    temperature?: number;
    signal?: AbortSignal;
  }) => Promise<{
    ok: true;
    answer: string;
    model: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }>;
}

interface Window {
  __quizZenLlmBridge?: QuizZenLlmBridge;
  katex: { renderToString(source: string, options?: Record<string, unknown>): string };
  marked: { parse(source: string, options?: Record<string, unknown>): string };
  DOMPurify: { sanitize(source: string, options?: Record<string, unknown>): string };
}
