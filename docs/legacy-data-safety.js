/**
 * 保存された教材キャッシュは外部入力。編集画面が出力するテキスト項目だけを採用し、
 * HTML・スクリプトの読込先・表示用の派生フィールドを持ち込ませません。
 * バックアップの検証時と起動時に同じ境界を通し、以前の保存データにも適用します。
 */
(() => {
  const fail = () => { throw new Error("教材キャッシュの形式が正しくありません。"); };
  const text = (value, limit, fallback = "") => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || value.length > limit) return fail();
    return value;
  };
  const id = value => {
    const result = text(value, 120);
    if (!result || /[\u0000-\u001f\u007f]/.test(result)) return fail();
    return result;
  };
  const list = (value, limit) => {
    if (!Array.isArray(value) || value.length > limit) return fail();
    return value;
  };
  const safeUrl = value => {
    if (!value) return undefined;
    const url = new URL(text(value, 2000));
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return fail();
    return url.href;
  };
  window.quizPalValidateLegacyDataset = value => {
    if (!value || !Array.isArray(value.manifest?.courses)) return fail();
    const courseIds = new Set(), sectionIds = new Set(), questionIds = new Set();
    const unique = (value, ids) => { const key = id(value); if (ids.has(key)) return fail(); ids.add(key); return key; };
    const courses = list(value.courses, 1000).map(course => ({
      id: unique(course.id, courseIds), name: text(course.name, 120),
      accent: /^#[0-9a-f]{6}$/i.test(course.accent) ? course.accent : "#147d73",
      completed: course.completed === true,
      chapters: list(course.chapters, 10000).map((chapter, index) => {
        const questions = list(chapter.questions, 100000).map(question => {
          const options = list(question.options, 6).map(option => text(option, 10000));
          if (!options.length || !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= options.length) return fail();
          return {
            id: unique(question.id, questionIds), prompt: text(question.prompt, 21000), options,
            answer: question.answer, explanation: text(question.explanation, 20000),
            sourceTitle: text(question.sourceTitle, 2000), sourceUrl: safeUrl(question.sourceUrl),
            ...(question.format === "typing" ? { format: "typing", answerText: text(question.answerText, 1000) } : {}),
          };
        });
        return { id: unique(chapter.id, sectionIds), number: index + 1, title: text(chapter.title, 120), sourceQuestionCount: questions.length, questions };
      }),
    }));
    const manifests = courses.map(course => {
      const questionCount = course.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
      return { id: course.id, name: course.name, accent: course.accent, completed: course.completed,
        chapterCount: course.chapters.length, questionCount, visibleQuestionCount: questionCount, asset: "" };
    });
    return { manifest: { generatedFrom: ["Local Quiz Studio"], sampleContentVersion: Number(value.manifest.sampleContentVersion) >= 6 ? 6 : 0,
      chapterCount: manifests.reduce((sum, course) => sum + course.chapterCount, 0), questionsPerChapter: 20,
      totalQuestions: manifests.reduce((sum, course) => sum + course.questionCount, 0), courses: manifests }, courses };
  };
})();
