/**
 * 科目・セクション・問題と学習記録を管理する保存処理。
 * 初期教材の導入やデータの更新をここへまとめ、画面側が保存形式を意識せず操作できるようにしています。
 */
import { NativeDatabase, type EntityTable } from "../native-db";
import type { AppSetting, Attempt, LibrarySnapshot, Question, QuestionState, Section, StudySession, Subject } from "../domain/types";
import { sampleQuestions, sampleSections, sampleSubjects } from "../samples/sampleData";

const stripInlineAttribution = (value: string): string => {
  const markerIndex = value.indexOf("【出典・利用条件】");
  return markerIndex >= 0 ? value.slice(0, markerIndex).trimEnd() : value;
};

export class QuizStudioDatabase extends NativeDatabase {
  subjects!: EntityTable<Subject, "id">;
  sections!: EntityTable<Section, "id">;
  questions!: EntityTable<Question, "id">;
  attempts!: EntityTable<Attempt, "id">;
  questionStates!: EntityTable<QuestionState, "questionId">;
  studySessions!: EntityTable<StudySession, "id">;
  settings!: EntityTable<AppSetting, "key">;

  constructor() {
    super("local-quiz-studio");
    this.version(1).stores({
      subjects: "id, order, updatedAt",
      sections: "id, subjectId, [subjectId+order], updatedAt",
      questions: "id, sectionId, [sectionId+order], *tags, updatedAt",
      attempts: "id, questionId, answeredAt, [questionId+answeredAt]",
      questionStates: "questionId, bookmarked, dueAt, updatedAt",
      studySessions: "id, subjectId, startedAt",
      settings: "key",
    });
  }
}

export const db = new QuizStudioDatabase();
let initializationPromise: Promise<void> | null = null;

export async function initializeDatabase(): Promise<void> {
  initializationPromise ??= (async () => {
    await db.open();
    const seeded = await db.settings.get("sampleSeedVersion");
    if (Number(seeded?.value ?? 0) >= 6) return;
    await db.transaction("rw", db.subjects, db.sections, db.questions, db.settings, async () => {
      const seededInsideTransaction = await db.settings.get("sampleSeedVersion");
      const previousSeedVersion = Number(seededInsideTransaction?.value ?? 0);
      if (previousSeedVersion >= 6) return;
      const [subjectIds, sectionIds, questionIds] = await Promise.all([
        db.subjects.toCollection().primaryKeys(),
        db.sections.toCollection().primaryKeys(),
        db.questions.toCollection().primaryKeys(),
      ]);
      const existingSubjects = new Set(subjectIds);
      const existingSections = new Set(sectionIds);
      const existingQuestions = new Set(questionIds);
      const storedOfficialQuestions = await db.questions.filter((item) => item.origin === "ipa-official-past-question").toArray();
      for (const item of storedOfficialQuestions) {
        const promptMarkdown = stripInlineAttribution(item.promptMarkdown);
        if (promptMarkdown === item.promptMarkdown) continue;
        await db.questions.update(item.id, {
          promptMarkdown,
          contentRevision: item.contentRevision + 1,
        });
      }
      const candidateSubjects = previousSeedVersion === 1 ? sampleSubjects.filter((item) => item.order >= 2) : sampleSubjects;
      const candidateSubjectIds = new Set(candidateSubjects.map((item) => item.id));
      const candidateSections = previousSeedVersion === 1 ? sampleSections.filter((item) => candidateSubjectIds.has(item.subjectId)) : sampleSections;
      const candidateSectionIds = new Set(candidateSections.map((item) => item.id));
      const candidateQuestions = previousSeedVersion === 1 ? sampleQuestions.filter((item) => candidateSectionIds.has(item.sectionId)) : sampleQuestions;
      const newSubjects = candidateSubjects.filter((item) => !existingSubjects.has(item.id));
      const newSections = candidateSections.filter((item) => !existingSections.has(item.id));
      const newQuestions = candidateQuestions.filter((item) => !existingQuestions.has(item.id));
      if (newSubjects.length) await db.subjects.bulkAdd(newSubjects);
      if (newSections.length) await db.sections.bulkAdd(newSections);
      if (newQuestions.length) await db.questions.bulkAdd(newQuestions);
      await db.settings.put({ key: "sampleSeedVersion", value: 6 });
    });
  })();
  const pending = initializationPromise;
  try {
    await pending;
  } finally {
    if (initializationPromise === pending) initializationPromise = null;
  }
}

export async function loadSnapshot(): Promise<LibrarySnapshot> {
  const [subjects, sections, questions, attempts, questionStates, studySessions] = await Promise.all([
    db.subjects.orderBy("order").toArray(),
    db.sections.toArray(),
    db.questions.toArray(),
    db.attempts.toArray(),
    db.questionStates.toArray(),
    db.studySessions.toArray(),
  ]);
  return {
    subjects,
    sections: sections.sort((a, b) => a.order - b.order),
    questions: questions.sort((a, b) => a.order - b.order),
    attempts,
    questionStates,
    studySessions,
  };
}

export async function moveRecord(table: "subjects" | "sections" | "questions", orderedIds: string[]): Promise<void> {
  const target = db.table(table);
  await db.transaction("rw", target, async () => {
    await Promise.all(orderedIds.map((id, order) => target.update(id, { order, updatedAt: new Date().toISOString() })));
  });
}

export async function setSubjectCompleted(subjectId: string, completed: boolean): Promise<void> {
  await db.subjects.update(subjectId, { completed, updatedAt: nowTimestamp() });
}

function nowTimestamp() { return new Date().toISOString(); }

export async function deleteSubject(subjectId: string): Promise<void> {
  const sectionIds = (await db.sections.where("subjectId").equals(subjectId).primaryKeys()) as string[];
  const questionIds = sectionIds.length
    ? ((await db.questions.where("sectionId").anyOf(sectionIds).primaryKeys()) as string[])
    : [];
  await db.transaction("rw", db.subjects, db.sections, db.questions, db.attempts, db.questionStates, db.studySessions, async () => {
    if (questionIds.length) {
      await db.attempts.where("questionId").anyOf(questionIds).delete();
      await db.questionStates.where("questionId").anyOf(questionIds).delete();
      await db.questions.bulkDelete(questionIds);
    }
    if (sectionIds.length) await db.sections.bulkDelete(sectionIds);
    await db.studySessions.where("subjectId").equals(subjectId).delete();
    await db.subjects.delete(subjectId);
  });
  // The quiz keeps its answer records in localStorage, separate from Studio's tables.
  const removed = new Set(questionIds);
  for (const key of ["exam-prep-quiz-progress-v2", "quiz-zen-understanding-levels-v1", "quiz-zen-understanding-updated-at-v1", "quiz-zen-calculation-question-flags-v1", "quiz-zen-calculation-question-updated-at-v1"]) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    let value: unknown;
    try { value = JSON.parse(raw); } catch { continue; }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      localStorage.setItem(key, JSON.stringify(Object.fromEntries(Object.entries(value).filter(([id]) => !removed.has(id)))));
    }
  }
}

export async function deleteSection(sectionId: string): Promise<void> {
  const questionIds = (await db.questions.where("sectionId").equals(sectionId).primaryKeys()) as string[];
  await db.transaction("rw", db.sections, db.questions, db.attempts, db.questionStates, async () => {
    if (questionIds.length) {
      await db.attempts.where("questionId").anyOf(questionIds).delete();
      await db.questionStates.where("questionId").anyOf(questionIds).delete();
      await db.questions.bulkDelete(questionIds);
    }
    await db.sections.delete(sectionId);
  });
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await db.transaction("rw", db.questions, db.attempts, db.questionStates, async () => {
    await db.attempts.where("questionId").equals(questionId).delete();
    await db.questionStates.delete(questionId);
    await db.questions.delete(questionId);
  });
}
