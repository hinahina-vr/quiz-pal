import { describe, expect, it } from "vitest";
import { applyCsvPreview, parseCsvText } from "../src/features/csv-import/csv";
import type { LibrarySnapshot } from "../src/domain/types";
import { db, initializeDatabase, loadSnapshot } from "../src/db/database";

const empty: LibrarySnapshot = { subjects: [], sections: [], questions: [], attempts: [], questionStates: [], studySessions: [] };
const header = "csv_schema,record_type,subject_id,subject_name,section_id,section_name,question_id,question_type,prompt,option_1,option_2,correct_options,accepted_answers,explanation,tags,time_limit_seconds\n";

describe("CSV import", () => {
  it("階層レコードを検証して新規アクションを作る", () => {
    const csv = header
      + "local-quiz-studio-v1,subject,math,数学,,,,,,,,,,,,\n"
      + "local-quiz-studio-v1,section,math,,basics,基礎,,,,,,,,,,\n"
      + "local-quiz-studio-v1,question,math,,basics,,q1,single_choice,2+2は,3,4,2,,4です,計算,30\n";
    const result = parseCsvText(csv, empty);
    expect(result.counts.errors).toBe(0);
    expect(result.counts.new).toBe(3);
  });

  it("親が存在しない行をエラーにする", () => {
    const result = parseCsvText(header + "local-quiz-studio-v1,question,,,missing,,q1,text,答え,,,,東京,,,\n", empty);
    expect(result.issues.some((issue) => issue.code === "MISSING_PARENT")).toBe(true);
  });

  it("数式開始文字を警告する", () => {
    const result = parseCsvText(header + "local-quiz-studio-v1,subject,risk,=CMD(),,,,,,,,,,,,\n", empty);
    expect(result.issues.some((issue) => issue.code === "FORMULA_PREFIX" && issue.severity === "warning")).toBe(true);
  });

  it("階層を複製すると新しい親IDへ子を付け替える", async () => {
    await db.delete();
    try {
      await initializeDatabase();
      const snapshot = await loadSnapshot();
      const subject = snapshot.subjects[0];
      const section = snapshot.sections.find((item) => item.subjectId === subject.id)!;
      const question = snapshot.questions.find((item) => item.sectionId === section.id)!;
      await applyCsvPreview({
        issues: [],
        actions: [
          { row: 2, kind: "duplicate", entityType: "subject", entity: subject, targetId: subject.id },
          { row: 3, kind: "duplicate", entityType: "section", entity: section, targetId: section.id },
          { row: 4, kind: "duplicate", entityType: "question", entity: question, targetId: question.id },
        ],
        counts: { new: 0, duplicate: 3, errors: 0, warnings: 0 },
      }, "copy", false);
      const copiedSubject = (await db.subjects.toArray()).find((item) => item.id !== subject.id && item.name === subject.name)!;
      const copiedSection = (await db.sections.toArray()).find((item) => item.id !== section.id && item.name === section.name)!;
      const copiedQuestion = (await db.questions.toArray()).find((item) => item.id !== question.id && item.promptMarkdown === question.promptMarkdown)!;
      expect(copiedSection.subjectId).toBe(copiedSubject.id);
      expect(copiedQuestion.sectionId).toBe(copiedSection.id);
      expect(copiedQuestion.contentRevision).toBe(1);
    } finally {
      await db.delete();
    }
  });
});
