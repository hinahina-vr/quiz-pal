import type { LibrarySnapshot, Question, QuestionType, Section, Subject } from "../../domain/types";
import { createId, nowIso, normalizeAnswer } from "../../domain/types";
import { db } from "../../db/database";
import { escapeCsvFormula, hasFormulaPrefix } from "../../security/markdown";

export type DuplicatePolicy = "skip" | "update" | "copy" | "abort";
export type CsvSeverity = "error" | "warning";
export interface CsvIssue { row: number; field: string; code: string; message: string; severity: CsvSeverity }
type Entity = Subject | Section | Question;
export interface ImportAction { row: number; kind: "new" | "duplicate"; entityType: "subject" | "section" | "question"; entity: Entity; targetId?: string }
export interface CsvPreview { issues: CsvIssue[]; actions: ImportAction[]; counts: { new: number; duplicate: number; errors: number; warnings: number } }

export const CSV_COLUMNS = [
  "csv_schema", "record_type", "subject_id", "subject_name", "subject_description", "subject_color", "subject_order",
  "section_id", "section_name", "section_description", "section_order", "question_id", "question_type", "question_order",
  "prompt", "option_1", "option_2", "option_3", "option_4", "option_5", "option_6", "correct_options",
  "accepted_answers", "explanation", "tags", "time_limit_seconds",
] as const;

type CsvRow = Record<(typeof CSV_COLUMNS)[number], string> & Record<string, string>;
const safeId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const validTypes = new Set<QuestionType>(["single_choice", "multiple_choice", "true_false", "text"]);
const splitPipe = (value: string) => String(value ?? "").split("|").map((item) => item.trim()).filter(Boolean);
const intValue = (value: string, fallback: number) => /^\d+$/.test(String(value ?? "").trim()) ? Number(value) : fallback;

interface ParsedCsv { rows: CsvRow[]; fields: string[]; errors: Array<{ row: number; code: string; message: string }> }

function parseCsv(source: string): ParsedCsv {
  const records: string[][] = [];
  const errors: ParsedCsv["errors"] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let row = 0;
  const pushRecord = () => {
    record.push(field);
    field = "";
    if (record.some((value) => value.trim() !== "")) records.push(record);
    record = [];
    row += 1;
  };
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
      continue;
    }
    if (character === '"' && field.length === 0) { quoted = true; continue; }
    if (character === ",") { record.push(field); field = ""; continue; }
    if (character === "\n") { pushRecord(); continue; }
    if (character === "\r") { if (source[index + 1] === "\n") index += 1; pushRecord(); continue; }
    field += character;
  }
  if (quoted) errors.push({ row: row + 1, code: "UNCLOSED_QUOTE", message: "引用符が閉じられていません。" });
  if (field.length || record.length) pushRecord();
  const fields = (records.shift() || []).map((header) => header.trim().replace(/^\uFEFF/, ""));
  const rows = records.map((values) => Object.fromEntries(fields.map((header, index) => [header, values[index] ?? ""])) as CsvRow);
  records.forEach((values, index) => {
    if (values.length > fields.length) errors.push({ row: index + 2, code: "TOO_MANY_FIELDS", message: "ヘッダーより多い列があります。" });
  });
  return { rows, fields, errors };
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function serializeCsv(fields: readonly string[], rows: Array<Record<string, unknown> | readonly unknown[]>): string {
  const lines = [fields.map(csvCell).join(",")];
  for (const row of rows) {
    const values = Array.isArray(row)
      ? (row as readonly unknown[])
      : fields.map((fieldName) => (row as Record<string, unknown>)[fieldName]);
    lines.push(values.map(csvCell).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

function contentFingerprint(sectionId: string, prompt: string, options: string[]): string {
  return [sectionId, normalizeAnswer(prompt), ...options.map(normalizeAnswer)].join("|");
}

function validateRows(rows: CsvRow[], fields: string[], snapshot: LibrarySnapshot): CsvPreview {
  const issues: CsvIssue[] = [];
  const actions: ImportAction[] = [];
  const addIssue = (row: number, field: string, code: string, message: string, severity: CsvSeverity = "error") => issues.push({ row, field, code, message, severity });
  const unknown = fields.filter((field) => !CSV_COLUMNS.includes(field as (typeof CSV_COLUMNS)[number]));
  unknown.forEach((field) => addIssue(1, field, "UNKNOWN_HEADER", `未使用の列「${field}」があります。`, "warning"));
  if (!fields.includes("record_type")) addIssue(1, "record_type", "MISSING_HEADER", "record_type列が必要です。");

  const subjects = new Map(snapshot.subjects.map((item) => [item.id, item]));
  const sections = new Map(snapshot.sections.map((item) => [item.id, item]));
  const questions = new Map(snapshot.questions.map((item) => [item.id, item]));
  const fingerprints = new Map(snapshot.questions.map((item) => [contentFingerprint(item.sectionId, item.promptMarkdown, item.options.map((option) => option.text)), item.id]));
  const stagedSubjects = new Map(subjects);
  const stagedSections = new Map(sections);
  const now = nowIso();

  rows.forEach((raw, index) => {
    const row = index + 2;
    const recordType = String(raw.record_type ?? "").trim().toLowerCase();
    Object.entries(raw).forEach(([field, value]) => {
      if (String(value).length > 20000) addIssue(row, field, "CELL_TOO_LONG", "セルは20,000文字以下にしてください。");
      if (hasFormulaPrefix(String(value))) addIssue(row, field, "FORMULA_PREFIX", "表計算ソフトで数式として扱われる可能性があります。文字列として取り込みます。", "warning");
    });
    if (!new Set(["subject", "section", "question"]).has(recordType)) {
      addIssue(row, "record_type", "INVALID_RECORD_TYPE", "subject、section、questionのいずれかを指定してください。");
      return;
    }
    if (recordType === "subject") {
      const id = String(raw.subject_id ?? "").trim();
      const name = String(raw.subject_name ?? "").trim();
      if (!safeId.test(id)) addIssue(row, "subject_id", "INVALID_ID", "英数字から始まる120文字以内のIDが必要です。");
      if (!name) addIssue(row, "subject_name", "REQUIRED", "科目名が必要です。");
      if (!safeId.test(id) || !name) return;
      const existing = subjects.get(id);
      const entity: Subject = { id, name: name.slice(0, 120), description: String(raw.subject_description ?? "").slice(0, 2000), color: /^#[0-9a-fA-F]{6}$/.test(raw.subject_color) ? raw.subject_color : "#2563eb", order: intValue(raw.subject_order, stagedSubjects.size), createdAt: existing?.createdAt ?? now, updatedAt: now };
      actions.push({ row, kind: existing ? "duplicate" : "new", entityType: "subject", entity, targetId: existing?.id });
      stagedSubjects.set(id, entity);
      return;
    }
    if (recordType === "section") {
      const id = String(raw.section_id ?? "").trim();
      const subjectId = String(raw.subject_id ?? "").trim();
      const name = String(raw.section_name ?? "").trim();
      if (!safeId.test(id)) addIssue(row, "section_id", "INVALID_ID", "有効なセクションIDが必要です。");
      if (!stagedSubjects.has(subjectId)) addIssue(row, "subject_id", "MISSING_PARENT", "参照する科目が見つかりません。");
      if (!name) addIssue(row, "section_name", "REQUIRED", "セクション名が必要です。");
      if (!safeId.test(id) || !stagedSubjects.has(subjectId) || !name) return;
      const existing = sections.get(id);
      const entity: Section = { id, subjectId, name: name.slice(0, 120), description: String(raw.section_description ?? "").slice(0, 2000), order: intValue(raw.section_order, [...stagedSections.values()].filter((item) => item.subjectId === subjectId).length), createdAt: existing?.createdAt ?? now, updatedAt: now };
      actions.push({ row, kind: existing ? "duplicate" : "new", entityType: "section", entity, targetId: existing?.id });
      stagedSections.set(id, entity);
      return;
    }

    const sectionId = String(raw.section_id ?? "").trim();
    const prompt = String(raw.prompt ?? "").trim();
    const type = String(raw.question_type ?? "") as QuestionType;
    let id = String(raw.question_id ?? "").trim();
    if (id && !safeId.test(id)) addIssue(row, "question_id", "INVALID_ID", "問題IDの形式が正しくありません。");
    if (!stagedSections.has(sectionId)) addIssue(row, "section_id", "MISSING_PARENT", "参照するセクションが見つかりません。");
    if (!validTypes.has(type)) addIssue(row, "question_type", "INVALID_TYPE", "問題形式が正しくありません。");
    if (!prompt) addIssue(row, "prompt", "REQUIRED", "問題文が必要です。");
    const optionTexts = [raw.option_1, raw.option_2, raw.option_3, raw.option_4, raw.option_5, raw.option_6].map((value) => String(value ?? "").trim()).filter(Boolean);
    if (["single_choice", "multiple_choice"].includes(type) && optionTexts.length < 2) addIssue(row, "option_1", "TOO_FEW_OPTIONS", "選択問題には2件以上の選択肢が必要です。");
    const options = type === "true_false"
      ? [{ id: "true", text: "正しい" }, { id: "false", text: "誤り" }]
      : optionTexts.map((text, optionIndex) => ({ id: `option-${optionIndex + 1}`, text }));
    const rawCorrect = splitPipe(raw.correct_options);
    const correctOptionIds = type === "true_false"
      ? rawCorrect.filter((value) => value === "true" || value === "false")
      : rawCorrect.map((value) => options[Number(value) - 1]?.id).filter(Boolean);
    const acceptedAnswers = splitPipe(raw.accepted_answers);
    if (type === "text" && acceptedAnswers.length === 0) addIssue(row, "accepted_answers", "REQUIRED", "文字入力問題には正答候補が必要です。");
    if (type !== "text" && correctOptionIds.length === 0) addIssue(row, "correct_options", "REQUIRED", "正答が必要です。");
    if (issues.some((issue) => issue.row === row && issue.severity === "error")) return;
    const fingerprint = contentFingerprint(sectionId, prompt, optionTexts);
    const fingerprintTarget = fingerprints.get(fingerprint);
    if (!id) id = createId();
    const existing = questions.get(id) ?? (fingerprintTarget ? questions.get(fingerprintTarget) : undefined);
    const entity: Question = {
      id: existing?.id ?? id, sectionId, type, promptMarkdown: prompt, options, correctOptionIds, acceptedAnswers,
      explanationMarkdown: String(raw.explanation ?? "").slice(0, 20000), tags: splitPipe(raw.tags).slice(0, 30),
      timeLimitSeconds: raw.time_limit_seconds ? Math.min(3600, Math.max(5, intValue(raw.time_limit_seconds, 30))) : null,
      order: intValue(raw.question_order, snapshot.questions.filter((item) => item.sectionId === sectionId).length),
      contentRevision: existing ? existing.contentRevision + 1 : 1, createdAt: existing?.createdAt ?? now, updatedAt: now,
    };
    actions.push({ row, kind: existing ? "duplicate" : "new", entityType: "question", entity, targetId: existing?.id });
    questions.set(entity.id, entity);
    fingerprints.set(fingerprint, entity.id);
  });

  return {
    issues,
    actions,
    counts: {
      new: actions.filter((action) => action.kind === "new").length,
      duplicate: actions.filter((action) => action.kind === "duplicate").length,
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
    },
  };
}

export function parseCsvText(text: string, snapshot: LibrarySnapshot): CsvPreview {
  if (new TextEncoder().encode(text).byteLength > 5 * 1024 * 1024) throw new Error("CSVは5MB以下にしてください。");
  const result = parseCsv(text);
  if (result.rows.length > 5000) throw new Error("CSVは5,000行以下にしてください。");
  const preview = validateRows(result.rows, result.fields, snapshot);
  result.errors.forEach((error) => preview.issues.push({ row: error.row, field: "", code: error.code, message: error.message, severity: "error" }));
  preview.counts.errors = preview.issues.filter((issue) => issue.severity === "error").length;
  return preview;
}

export async function parseCsvFile(file: File, snapshot: LibrarySnapshot): Promise<CsvPreview> {
  if (file.size > 5 * 1024 * 1024) throw new Error("CSVは5MB以下にしてください。");
  return parseCsvText(await file.text(), snapshot);
}

export async function applyCsvPreview(preview: CsvPreview, policy: DuplicatePolicy, importValidOnly: boolean): Promise<void> {
  if (preview.counts.errors && !importValidOnly) throw new Error("エラーを修正するか、正常行だけ取り込む設定を有効にしてください。");
  if (policy === "abort" && preview.counts.duplicate) throw new Error("重複があるため取り込みを中止しました。");
  await db.transaction("rw", db.subjects, db.sections, db.questions, async () => {
    const copiedSubjectIds = new Map<string, string>();
    const copiedSectionIds = new Map<string, string>();
    for (const action of preview.actions) {
      if (action.kind === "duplicate" && policy === "skip") continue;
      let entity = action.entity;
      if (action.entityType === "section") {
        const section = entity as Section;
        entity = { ...section, subjectId: copiedSubjectIds.get(section.subjectId) ?? section.subjectId };
      }
      if (action.entityType === "question") {
        const question = entity as Question;
        entity = { ...question, sectionId: copiedSectionIds.get(question.sectionId) ?? question.sectionId };
      }
      if (action.kind === "duplicate" && policy === "copy") {
        const nextId = createId();
        const copiedAt = nowIso();
        entity = { ...entity, id: nextId, createdAt: copiedAt, updatedAt: copiedAt } as Entity;
        if (action.entityType === "subject") copiedSubjectIds.set(action.entity.id, nextId);
        if (action.entityType === "section") copiedSectionIds.set(action.entity.id, nextId);
        if (action.entityType === "question") entity = { ...entity, contentRevision: 1 } as Question;
      }
      if (action.entityType === "subject") await db.subjects.put(entity as Subject);
      if (action.entityType === "section") await db.sections.put(entity as Section);
      if (action.entityType === "question") await db.questions.put(entity as Question);
    }
  });
}

export function csvTemplate(): string {
  const rows = [
    { csv_schema: "local-quiz-studio-v1", record_type: "subject", subject_id: "my-subject", subject_name: "サンプル科目", subject_color: "#2563eb", subject_order: "0" },
    { csv_schema: "local-quiz-studio-v1", record_type: "section", subject_id: "my-subject", section_id: "my-section", section_name: "第1章", section_order: "0" },
    { csv_schema: "local-quiz-studio-v1", record_type: "question", subject_id: "my-subject", section_id: "my-section", question_id: "my-question-1", question_type: "single_choice", question_order: "0", prompt: "2 + 2 はいくつですか。", option_1: "3", option_2: "4", option_3: "5", correct_options: "2", explanation: "2 + 2 = 4です。", tags: "例題|計算", time_limit_seconds: "30" },
  ];
  return serializeCsv(CSV_COLUMNS, rows.map((row) => CSV_COLUMNS.map((field) => escapeCsvFormula(String((row as unknown as Record<string, string>)[field] ?? "")))));
}

export function issuesCsv(issues: CsvIssue[]): string {
  const fields = ["row", "field", "severity", "code", "message"] as const;
  return serializeCsv(fields, issues.map((issue) => ({ row: issue.row, field: escapeCsvFormula(issue.field), severity: issue.severity, code: issue.code, message: escapeCsvFormula(issue.message) })));
}
