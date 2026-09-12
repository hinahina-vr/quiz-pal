/**
 * 教材管理のデータをクイズ画面用の形式へ変換する橋渡し。
 * 同じ教材を編集と学習の両方で使えるよう、問題の構造や科目の修了状態を受け渡します。
 */
import type { LibrarySnapshot, Question } from "../domain/types";

const STORAGE_KEY = "local-quiz-studio-legacy-dataset-v1";

interface LegacyQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  answerText?: string;
  format?: "typing";
  explanation: string;
  sourceTitle: string;
  sourceUrl?: string;
}

const plain = (value: string) => value.replaceAll("`", "");
const ipaSourceUrl = "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html";
const legacySource = (question: Question): Pick<LegacyQuestion, "sourceTitle" | "sourceUrl"> => ({
  sourceTitle: question.license === "CC0-1.0" ? "CC0 書き下ろし例題" : question.license || "ユーザー作成",
  ...(question.origin === "ipa-official-past-question" ? { sourceUrl: question.sourceUrl || ipaSourceUrl } : {}),
});

function legacyQuestion(question: Question): LegacyQuestion {
  if (question.type === "text") {
    const answerText = question.acceptedAnswers[0] || "";
    return { id: question.id, prompt: plain(question.promptMarkdown), options: [answerText], answer: 0, answerText, format: "typing", explanation: plain(question.explanationMarkdown), ...legacySource(question) };
  }
  if (question.type === "multiple_choice") {
    const labels = question.options.map((_, index) => String.fromCharCode(65 + index));
    const correct = question.correctOptionIds.map((id) => labels[question.options.findIndex((option) => option.id === id)]).filter(Boolean).join("・");
    const distractors = labels.filter((label) => !correct.includes(label)).slice(0, 3);
    return { id: question.id, prompt: `${plain(question.promptMarkdown)}（該当する選択肢の組合せ）`, options: [correct, ...distractors.map((label) => `${correct}以外（${label}を含む）`)], answer: 0, explanation: plain(question.explanationMarkdown), ...legacySource(question) };
  }
  const answerId = question.correctOptionIds[0];
  return { id: question.id, prompt: plain(question.promptMarkdown), options: question.options.map((option) => option.text), answer: Math.max(0, question.options.findIndex((option) => option.id === answerId)), explanation: plain(question.explanationMarkdown), ...legacySource(question) };
}

export function syncLegacyDataset(snapshot: LibrarySnapshot): void {
  const courses = [...snapshot.subjects].sort((a, b) => a.order - b.order).map((subject) => {
    const chapters = snapshot.sections.filter((section) => section.subjectId === subject.id).sort((a, b) => a.order - b.order).map((section, index) => {
      const questions = snapshot.questions.filter((question) => question.sectionId === section.id).sort((a, b) => a.order - b.order).map(legacyQuestion);
      return { id: section.id, number: index + 1, title: section.name, sourceQuestionCount: questions.length, questions };
    });
    return { id: subject.id, name: subject.name, accent: subject.color, completed: Boolean(subject.completed), chapters };
  });
  const manifests = courses.map((course) => {
    const questionCount = course.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
    return { id: course.id, name: course.name, accent: course.accent, completed: course.completed, chapterCount: course.chapters.length, questionCount, visibleQuestionCount: questionCount, asset: "" };
  });
  const manifest = {
    generatedFrom: ["Local Quiz Studio"],
    sampleContentVersion: 6,
    chapterCount: manifests.reduce((sum, course) => sum + course.chapterCount, 0),
    questionsPerChapter: 20,
    totalQuestions: manifests.reduce((sum, course) => sum + course.questionCount, 0),
    courses: manifests,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ manifest, courses }));
  } catch {
    // IndexedDB remains authoritative if the browser's smaller localStorage quota is exceeded.
  }
}
