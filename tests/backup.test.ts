import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db, initializeDatabase } from "../src/db/database";
import { createBackup, parseBackup } from "../src/features/backup/backup";

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, canonicalize(child)]));
  }
  return value;
};

const checksum = async (payload: Record<string, unknown>): Promise<string> => {
  const { checksum: _ignored, ...body } = payload;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(canonicalize(body))));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
};

describe("backup", () => {
  beforeEach(async () => { await db.delete(); await initializeDatabase(); });
  afterEach(async () => { await db.delete(); });

  it("教材と履歴をチェックサム付きで往復する", async () => {
    const payload = await createBackup();
    const parsed = await parseBackup(JSON.stringify(payload));
    expect(parsed.questions).toHaveLength(183);
    expect(parsed.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("改ざんされたバックアップを拒否する", async () => {
    const payload = await createBackup();
    payload.subjects[0].name = "改ざん";
    await expect(parseBackup(JSON.stringify(payload))).rejects.toThrow("チェックサム");
  });

  it("チェックサムを再計算した不正な参照関係も拒否する", async () => {
    const payload = await createBackup();
    payload.sections[0].subjectId = "missing-subject";
    payload.checksum = await checksum(payload as unknown as Record<string, unknown>);
    await expect(parseBackup(JSON.stringify(payload))).rejects.toThrow("所属科目が存在しない");
  });
});
