export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "text";
export type Understanding = "unrated" | "learning" | "almost" | "mastered";

export interface Subject {
  completed?: boolean;
  id: string;
  name: string;
  description: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  promptMarkdown: string;
  options: QuestionOption[];
  correctOptionIds: string[];
  acceptedAnswers: string[];
  explanationMarkdown: string;
  tags: string[];
  timeLimitSeconds: number | null;
  order: number;
  contentRevision: number;
  origin?: string;
  license?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  questionId: string;
  contentRevision: number;
  answer: string[];
  correct: boolean;
  elapsedMs: number;
  answeredAt: string;
}

export interface QuestionState {
  questionId: string;
  bookmarked: boolean;
  understanding: Understanding;
  dueAt: string | null;
  intervalDays: number;
  correctStreak: number;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string | null;
  startedAt: string;
  endedAt: string;
  answered: number;
  correct: number;
}

export interface AppSetting {
  key: string;
  value: unknown;
}

export interface LibrarySnapshot {
  subjects: Subject[];
  sections: Section[];
  questions: Question[];
  attempts: Attempt[];
  questionStates: QuestionState[];
  studySessions: StudySession[];
}

export const nowIso = () => new Date().toISOString();
export const createId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function normalizeAnswer(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ja-JP");
}

export function evaluateAnswer(question: Question, answer: string[]): boolean {
  if (question.type === "text") {
    const value = normalizeAnswer(answer[0] ?? "");
    return Boolean(value) && question.acceptedAnswers.some((candidate) => normalizeAnswer(candidate) === value);
  }
  const actual = [...answer].sort();
  const expected = [...question.correctOptionIds].sort();
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

export function nextReviewState(previous: QuestionState | undefined, correct: boolean): Pick<QuestionState, "dueAt" | "intervalDays" | "correctStreak"> {
  const previousInterval = previous?.intervalDays ?? 0;
  const previousStreak = previous?.correctStreak ?? 0;
  const correctStreak = correct ? previousStreak + 1 : 0;
  const intervalDays = correct
    ? previousInterval <= 0
      ? 1
      : previousInterval === 1
        ? 3
        : Math.min(60, Math.round(previousInterval * 1.8))
    : 1;
  const due = new Date();
  due.setDate(due.getDate() + intervalDays);
  return { dueAt: due.toISOString(), intervalDays, correctStreak };
}
