import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { transformWithOxc } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const officialSource = (await readFile(path.join(root, "src/samples/ipaOfficialQuestions.ts"), "utf8"))
  .replace(/^import type .*?;\r?\n/m, "");
const practiceSource = (await readFile(path.join(root, "src/samples/ipaPracticeSets.ts"), "utf8"))
  .replace(/^import type .*?;\r?\n/m, "");
const sampleSource = (await readFile(path.join(root, "src/samples/sampleData.ts"), "utf8"))
  .replace(/^import type .*?;\r?\n/m, "")
  .replace(/^import \{ ipaOfficialQuestions, ipaOfficialSections \} from .*?;\r?\n/m, "")
  .replace(/^import \{ ipaPracticeQuestions, ipaPracticeSections \} from .*?;\r?\n/m, "");
const officialOutput = (await transformWithOxc(officialSource, "ipaOfficialQuestions.ts", { lang: "ts" })).code;
const officialData = await import(`data:text/javascript;base64,${Buffer.from(officialOutput).toString("base64")}`);
const practiceOutput = (await transformWithOxc(practiceSource, "ipaPracticeSets.ts", { lang: "ts" })).code;
const practiceData = await import(`data:text/javascript;base64,${Buffer.from(practiceOutput).toString("base64")}`);
const injectedData = `const ipaOfficialQuestions = ${JSON.stringify(officialData.ipaOfficialQuestions)};\nconst ipaOfficialSections = ${JSON.stringify(officialData.ipaOfficialSections)};\nconst ipaPracticeQuestions = ${JSON.stringify(practiceData.ipaPracticeQuestions)};\nconst ipaPracticeSections = ${JSON.stringify(practiceData.ipaPracticeSections)};\n`;
const outputText = (await transformWithOxc(`${injectedData}\n${sampleSource}`, "sampleData.ts", { lang: "ts" })).code;
const samples = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const { sampleSubjects, sampleSections, sampleQuestions } = samples;

// Use the same conversion for bundled examples and edited library data.
const bridgeSource = (await readFile(path.join(root, "src/bridge/legacyDataset.ts"), "utf8")).replace(/^import type .*?;\r?\n/m, "");
const bridgeOutput = (await transformWithOxc(bridgeSource, "legacyDataset.ts", { lang: "ts" })).code;
const { legacyQuestion } = await import(`data:text/javascript;base64,${Buffer.from(bridgeOutput).toString("base64")}`);

const courses = sampleSubjects.map((subject) => {
  const subjectSections = sampleSections.filter((section) => section.subjectId === subject.id).sort((a, b) => a.order - b.order);
  const chapters = subjectSections.map((section, index) => {
    const questions = sampleQuestions.filter((question) => question.sectionId === section.id).sort((a, b) => a.order - b.order).map(legacyQuestion);
    return { id: section.id, number: index + 1, title: section.name, sourceQuestionCount: questions.length, questions };
  });
  return { id: subject.id, name: subject.name, accent: subject.color, chapters };
});

const courseDirectory = path.join(root, "public/data/courses");
await mkdir(courseDirectory, { recursive: true });
for (const course of courses) {
  const body = `window.QUIZ_COURSE_DATA = window.QUIZ_COURSE_DATA || {};\nwindow.QUIZ_COURSE_DATA[${JSON.stringify(course.id)}] = ${JSON.stringify(course, null, 2)};\n`;
  await writeFile(path.join(courseDirectory, `${course.id}.js`), body, "utf8");
}

const manifests = courses.map((course) => ({
  id: course.id,
  name: course.name,
  accent: course.accent,
  chapterCount: course.chapters.length,
  questionCount: course.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0),
  visibleQuestionCount: course.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0),
  asset: `./data/courses/${course.id}.js`,
}));
const totalQuestions = manifests.reduce((sum, course) => sum + course.questionCount, 0);
const totalChapters = manifests.reduce((sum, course) => sum + course.chapterCount, 0);
const defaultManifest = {
  generatedFrom: ["CC0-1.0 書き下ろし例題", "IPA公式公開問題（各問に出典・改変表示）"],
  sampleContentVersion: 6,
  chapterCount: totalChapters,
  questionsPerChapter: 20,
  totalQuestions,
  courses: manifests,
};
const safetySource = await readFile(path.join(root, "public/legacy-data-safety.js"), "utf8");
const manifestBody = `document.write('<script src="./llm-provider-bridge.js?v=4"><\\/script>');
${safetySource}
{
  const defaultPayload = ${JSON.stringify({ manifest: defaultManifest, courses }, null, 2)};
  let payload = defaultPayload;
  try {
    const saved = localStorage.getItem("local-quiz-studio-legacy-dataset-v1");
    const parsed = saved ? window.quizPalValidateLegacyDataset(JSON.parse(saved)) : null;
    if (Array.isArray(parsed?.manifest?.courses) && Array.isArray(parsed.courses)) {
      // Repair only unchanged, previously broken bundled combinations. Keep user edits and progress IDs.
      const bundledQuestions = new Map(defaultPayload.courses.flatMap(course => course.chapters.flatMap(chapter => chapter.questions)).map(question => [question.id, question]));
      parsed.courses.forEach(course => course.chapters.forEach(chapter => {
        chapter.questions = chapter.questions.map(question => {
          const fixed = bundledQuestions.get(question.id);
          return fixed && question.prompt.endsWith("（該当する選択肢の組合せ）") && question.options.some(option => option.includes("以外（")) ? { ...fixed } : question;
        });
      }));
      payload = parsed;
      if (Number(parsed.manifest.sampleContentVersion || 0) < 6) {
        const savedCourses = new Map(parsed.courses.map((course) => [String(course.id), course]));
        for (const defaultCourse of defaultPayload.courses) {
          const savedCourse = savedCourses.get(String(defaultCourse.id));
          if (!savedCourse) {
            parsed.courses.push(defaultCourse);
            continue;
          }
          const savedChapterIds = new Set((savedCourse.chapters || []).map((chapter) => String(chapter.id)));
          for (const chapter of defaultCourse.chapters) {
            if (String(chapter.id).startsWith("ipa-") && !savedChapterIds.has(String(chapter.id))) savedCourse.chapters.push(chapter);
          }
        }
        const migratedCourses = parsed.courses.map((course) => {
          const chapters = Array.isArray(course.chapters) ? course.chapters : [];
          chapters.forEach((chapter) => (chapter.questions || []).forEach((question) => {
            if (!String(question.sourceTitle || "").includes("IPA / 出典：")) return;
            const prompt = String(question.prompt || "");
            const markerIndex = prompt.indexOf("【出典・利用条件】");
            if (markerIndex >= 0) question.prompt = prompt.slice(0, markerIndex).trimEnd();
            question.sourceUrl ||= "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html";
          }));
          return { ...course, chapters };
        });
        const migratedManifests = migratedCourses.map((course) => {
          const questionCount = course.chapters.reduce((sum, chapter) => sum + (chapter.questions || []).length, 0);
          return { id: course.id, name: course.name, accent: course.accent, chapterCount: course.chapters.length, questionCount, visibleQuestionCount: questionCount, asset: course.asset || "" };
        });
        parsed.manifest = { ...parsed.manifest, sampleContentVersion: 6, chapterCount: migratedManifests.reduce((sum, course) => sum + course.chapterCount, 0), totalQuestions: migratedManifests.reduce((sum, course) => sum + course.questionCount, 0), courses: migratedManifests };
        payload = { manifest: parsed.manifest, courses: migratedCourses };
        localStorage.setItem("local-quiz-studio-legacy-dataset-v1", JSON.stringify(payload));
      }
    }
  } catch {}
  window.QUIZ_DATA = payload.manifest;
  window.QUIZ_COURSE_DATA = Object.fromEntries(payload.courses.map((course) => [course.id, course]));
  const completedCount = document.querySelector(".completed-course-toggle small");
  if (completedCount) completedCount.textContent = String(payload.manifest.courses.filter(course => course.completed).length);
  const completedCourseSwitch = document.querySelector("#completedCourseSwitch");
  if (completedCourseSwitch) {
    completedCourseSwitch.replaceChildren();
    completedCourseSwitch.hidden = true;
  }
  const courseSwitch = document.querySelector(".course-switch");
  const makeTab = (course) => {
    const button = document.createElement("button");
    button.className = "course-tab";
    button.dataset.course = String(course.id);
    if (course.completed) { button.dataset.completedCourse = String(course.id); button.hidden = true; }
    button.type = "button";
    const name = String(course.name);
    const lines = { 'Web安全の基礎': ['Web安全', 'の基礎'], '基本情報技術者': ['基本情報', '技術者'], '応用情報技術者': ['応用情報', '技術者'], '第二種電気工事士': ['第二種', '電気工事士'] }[name] || [name];
    button.setAttribute('aria-label', name);
    const label = document.createElement('span');
    label.className = 'course-tab-label';
    label.setAttribute('aria-hidden', 'true');
    for (const line of lines) {
      const part = document.createElement('span');
      part.className = 'course-tab-line';
      part.textContent = line;
      label.append(part);
    }
    button.append(label);
    return button;
  };
  if (courseSwitch) courseSwitch.replaceChildren(...payload.manifest.courses.filter(course => !course.completed).map(makeTab));
  if (completedCourseSwitch) completedCourseSwitch.replaceChildren(...payload.manifest.courses.filter(course => course.completed).map(makeTab));
  // An empty runtime frame lets the user return to Studio without reseeding deleted subjects.
  // It is not a stored subject and is never included in the dataset backup.
  if (!payload.manifest.courses.length) {
    const empty = { id: "__empty_library__", name: "科目がありません", accent: "#147d73", chapterCount: 0, questionCount: 0, visibleQuestionCount: 0, asset: "", chapters: [{id:"__empty_section__",number:1,title:"教材管理から科目を追加してください",sourceQuestionCount:0,questions:[]}] };
    window.QUIZ_DATA = {...payload.manifest, courses:[empty]};
    window.QUIZ_COURSE_DATA = {[empty.id]:empty};
  }

}\n`;
await writeFile(path.join(root, "public/data.js"), manifestBody, "utf8");

console.log(`Built ${courses.length} courses, ${totalChapters} chapters, ${totalQuestions} questions.`);
