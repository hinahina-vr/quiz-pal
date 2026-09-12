import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db, initializeDatabase, deleteSubject, setSubjectCompleted, loadSnapshot } from "../src/db/database";
import { syncLegacyDataset } from "../src/bridge/legacyDataset";
import { createBackup, parseBackup, restoreBackup } from "../src/features/backup/backup";

describe("subject management", () => {
  beforeEach(async () => { localStorage.clear(); await db.delete(); await initializeDatabase(); });
  afterEach(async () => { await db.delete(); localStorage.clear(); });
  it("keeps completed subjects and questions through backup and legacy synchronization", async () => {
    const subject = (await db.subjects.toArray())[0];
    await setSubjectCompleted(subject.id, true);
    const parsed = await parseBackup(JSON.stringify(await createBackup()));
    expect(parsed.subjects.find(s => s.id === subject.id)?.completed).toBe(true);
    await restoreBackup(parsed, "replace");
    syncLegacyDataset(await loadSnapshot());
    const legacy = JSON.parse(localStorage.getItem("local-quiz-studio-legacy-dataset-v1")!);
    expect(legacy.manifest.courses.find((s: {id:string}) => s.id === subject.id).completed).toBe(true);
    expect(await db.questions.count()).toBe(183);
    await setSubjectCompleted(subject.id, false);
    expect((await db.subjects.get(subject.id))?.completed).toBe(false);
  });
  it("deletes owned sections, questions and sessions without deleting other subjects or reseeding", async () => {
    const subject = (await db.subjects.toArray())[0];
    const sections = await db.sections.where("subjectId").equals(subject.id).toArray();
    const questions = await db.questions.where("sectionId").anyOf(sections.map(s => s.id)).toArray();
    await db.studySessions.add({id:"delete-session",subjectId:subject.id,startedAt:"2026-09-12T00:00:00Z",endedAt:"2026-09-12T00:01:00Z",answered:1,correct:1});
    localStorage.setItem("exam-prep-quiz-progress-v2",JSON.stringify({[questions[0].id]:{attempts:[]},keep:{attempts:[]}}));
    await deleteSubject(subject.id);await initializeDatabase();
    expect(await db.subjects.get(subject.id)).toBeUndefined();
    expect(await db.subjects.count()).toBe(5);
    expect(await db.studySessions.get("delete-session")).toBeUndefined();
    expect(await db.sections.where("subjectId").equals(subject.id).count()).toBe(0);
    expect(await db.questions.count()).toBe(183-questions.length);
    expect(JSON.parse(localStorage.getItem("exam-prep-quiz-progress-v2")!)).toEqual({keep:{attempts:[]}});
    await expect(parseBackup(JSON.stringify(await createBackup()))).resolves.toBeDefined();
  });
});
