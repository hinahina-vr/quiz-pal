/**
 * 教材と学習記録を持ち運ぶためのバックアップ処理。
 * 読み込み時に形式とチェックサムを確認し、置き換え・統合の指定に従って保存データへ反映します。
 */
import { z } from "../../native-validation";
import { db, loadSnapshot } from "../../db/database";
import { questionSchema, sectionSchema, subjectSchema } from "../../domain/schema";
import type { AppSetting, Attempt, QuestionState, StudySession } from "../../domain/types";

const idSchema = z.string().min(1).max(120).refine((value) => !/[\u0000-\u001f\u007f]/.test(value));
const isoSchema = z.string().max(40).refine((value) => {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}, "日時の形式が正しくありません。");

const attemptSchema = z.object({
  id: idSchema, questionId: idSchema, contentRevision: z.number().int().positive(),
  answer: z.array(z.string().max(10000)).max(20), correct: z.boolean(),
  elapsedMs: z.number().nonnegative().max(604800000), answeredAt: isoSchema,
});
const stateSchema = z.object({
  questionId: idSchema, bookmarked: z.boolean(), understanding: z.enum(["unrated", "learning", "almost", "mastered"]),
  dueAt: isoSchema.nullable(), intervalDays: z.number().int().nonnegative().max(36500),
  correctStreak: z.number().int().nonnegative().max(100000), updatedAt: isoSchema,
});
const sessionSchema = z.object({
  id: idSchema, subjectId: idSchema.nullable(), startedAt: isoSchema, endedAt: isoSchema,
  answered: z.number().int().nonnegative().max(1000000), correct: z.number().int().nonnegative().max(1000000),
}).refine((session) => session.endedAt >= session.startedAt && session.correct <= session.answered, "学習セッションの値が正しくありません。");
const settingSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.unknown().refine((value) => {
    try {
      const encoded = JSON.stringify(value);
      return encoded !== undefined && encoded.length <= 100000;
    } catch {
      return false;
    }
  }, "設定値が大きすぎるか、形式が正しくありません。"),
});

export const backupSchema = z.object({
  app: z.literal("local-quiz-studio"),
  schemaVersion: z.literal(1),
  exportedAt: isoSchema,
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  subjects: z.array(subjectSchema).max(5000),
  sections: z.array(sectionSchema).max(50000),
  questions: z.array(questionSchema).max(100000),
  attempts: z.array(attemptSchema).max(100000),
  questionStates: z.array(stateSchema).max(100000),
  studySessions: z.array(sessionSchema).max(100000),
  settings: z.array(settingSchema).max(1000),
}).superRefine((payload, context) => {
  const duplicates = (values: string[]) => values.length !== new Set(values).size;
  const subjectIds = new Set(payload.subjects.map((item) => item.id));
  const sectionIds = new Set(payload.sections.map((item) => item.id));
  const questionIds = new Set(payload.questions.map((item) => item.id));
  const checks: Array<[boolean, (string | number)[], string]> = [
    [duplicates(payload.subjects.map((item) => item.id)), ["subjects"], "科目IDが重複しています。"],
    [duplicates(payload.sections.map((item) => item.id)), ["sections"], "セクションIDが重複しています。"],
    [duplicates(payload.questions.map((item) => item.id)), ["questions"], "問題IDが重複しています。"],
    [duplicates(payload.attempts.map((item) => item.id)), ["attempts"], "回答履歴IDが重複しています。"],
    [duplicates(payload.questionStates.map((item) => item.questionId)), ["questionStates"], "復習状態IDが重複しています。"],
    [duplicates(payload.studySessions.map((item) => item.id)), ["studySessions"], "学習セッションIDが重複しています。"],
    [duplicates(payload.settings.map((item) => item.key)), ["settings"], "設定キーが重複しています。"],
    [payload.sections.some((item) => !subjectIds.has(item.subjectId)), ["sections"], "所属科目が存在しないセクションがあります。"],
    [payload.questions.some((item) => !sectionIds.has(item.sectionId)), ["questions"], "所属セクションが存在しない問題があります。"],
    [payload.attempts.some((item) => !questionIds.has(item.questionId)), ["attempts"], "対象問題が存在しない回答履歴があります。"],
    [payload.questionStates.some((item) => !questionIds.has(item.questionId)), ["questionStates"], "対象問題が存在しない復習状態があります。"],
  ];
  for (const [failed, path, message] of checks) {
    if (failed) context.addIssue({ code: "custom", path, message });
  }
});

export type BackupPayload = z.infer<typeof backupSchema>;

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  }
  return value;
}

function checksumBody(payload: Omit<BackupPayload, "checksum">): string {
  return JSON.stringify(canonicalize(payload));
}

export async function createBackup(): Promise<BackupPayload> {
  const snapshot = await loadSnapshot();
  const settings = await db.settings.toArray();
  const body = {
    app: "local-quiz-studio" as const,
    schemaVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    ...snapshot,
    settings,
  };
  return { ...body, checksum: await sha256(checksumBody(body)) };
}

export async function parseBackup(text: string): Promise<BackupPayload> {
  if (new TextEncoder().encode(text).byteLength > 20 * 1024 * 1024) throw new Error("バックアップは20MB以下にしてください。");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("JSONを解析できませんでした。");
  }
  const payload = backupSchema.parse(raw);
  const { checksum, ...body } = payload;
  if (checksum !== await sha256(checksumBody(body))) throw new Error("チェックサムが一致しません。ファイルが壊れている可能性があります。");
  return payload;
}

export async function restoreBackup(payload: BackupPayload, mode: "replace" | "merge"): Promise<void> {
  await db.transaction(
    "rw",
    [db.subjects, db.sections, db.questions, db.attempts, db.questionStates, db.studySessions, db.settings],
    async () => {
      if (mode === "replace") {
        await Promise.all([
          db.subjects.clear(), db.sections.clear(), db.questions.clear(), db.attempts.clear(),
          db.questionStates.clear(), db.studySessions.clear(), db.settings.clear(),
        ]);
      }
      await db.subjects.bulkPut(payload.subjects);
      await db.sections.bulkPut(payload.sections);
      await db.questions.bulkPut(payload.questions);
      await db.attempts.bulkPut(payload.attempts as Attempt[]);
      await db.questionStates.bulkPut(payload.questionStates as QuestionState[]);
      await db.studySessions.bulkPut(payload.studySessions as StudySession[]);
      await db.settings.bulkPut(payload.settings as AppSetting[]);
    },
  );
}

export function downloadText(text: string, filename: string, type = "application/json;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadBackup(): Promise<void> {
  const payload = await createBackup();
  const stamp = payload.exportedAt.replace(/[:T]/g, "-").slice(0, 16);
  downloadText(JSON.stringify(payload, null, 2), `local-quiz-studio-${stamp}.json`);
}
