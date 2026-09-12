const LLM_FONT_SCALE_STORAGE_KEY = "quiz-zen-llm-font-scale-v1";
/**
 * 学習画面の中心となる処理。科目・問題の切り替え、採点、学習記録、AIへの質問を画面操作につなぎます。
 * 基本の学習データはブラウザー内で扱い、AIへの通信は接続設定に応じて別の連携処理へ渡します。
 */
const data = window.QUIZ_DATA;
window.QUIZ_COURSE_DATA = window.QUIZ_COURSE_DATA || {};
const courseDataStore = window.QUIZ_COURSE_DATA;
const COURSE_ASSET_VERSION = new URL(document.currentScript?.src || location.href, location.href).searchParams.get("v") || "";
const IPA_USAGE_TERMS_URL = "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html";
const courseLoadPromises = new Map();
let courseLoadToken = 0;
const STORAGE_KEY = "exam-prep-quiz-progress-v2";
const LEGACY_STORAGE_KEYS = ["gsls-quiz-progress-v1"];
const TIMER_ENABLED_STORAGE_KEY = "quiz-zen-timer-enabled-v1";
const SECTION_LOOP_STORAGE_KEY = "quiz-zen-section-loop-v1";
const OPTION_SHUFFLE_STORAGE_KEY = "quiz-zen-option-shuffle-v1";
const CHAPTER_CATEGORY_STORAGE_KEY = "quiz-zen-chapter-categories-v1";
const CHAPTER_CATEGORY_EXPANDED_STORAGE_KEY = "quiz-zen-chapter-categories-expanded-v1";
const WHEEL_MODE_STORAGE_KEY = "quiz-zen-wheel-mode-v1";
const FAVORITES_STORAGE_KEY = "quiz-zen-favorite-questions-v1";
const UNDERSTANDING_STORAGE_KEY = "quiz-zen-understanding-levels-v1";
const UNDERSTANDING_UPDATED_AT_STORAGE_KEY = "quiz-zen-understanding-updated-at-v1";
const CALCULATION_STORAGE_KEY = "quiz-zen-calculation-question-flags-v1";
const CALCULATION_UPDATED_AT_STORAGE_KEY = "quiz-zen-calculation-question-updated-at-v1";
const STOPWATCH_STORAGE_KEY = "quiz-zen-study-stopwatch-v1";
const STUDY_LOG_STORAGE_KEY = "quiz-zen-study-time-log-v1";
const STUDY_REPORT_MODE_STORAGE_KEY = "quiz-zen-study-report-mode-v1";
const REVIEW_TARGET_COURSES_STORAGE_KEY = "quiz-zen-review-target-courses-v1";
const REVIEW_SESSION_STORAGE_KEY = "quiz-zen-review-session-v1";
const REVIEW_SESSION_HISTORY_STORAGE_KEY = "quiz-zen-review-session-history-v1";
const LAST_ANSWERED_STORAGE_KEY = "quiz-zen-last-answered-position-v1";
const LLM_SETTINGS_API_PATH = "/api/llm/settings";
const LLM_EXPLAIN_API_PATH = "/api/llm/explain";
const LLM_MODEL_STORAGE_KEY = "quiz-zen-llm-model-v1";
const LLM_EXPLANATION_CACHE_STORAGE_KEY = "quiz-zen-llm-explanation-cache-v1";
const LLM_IMAGE_LIBRARY_SETTING_KEY = "llm-image-library-v1";
const LLM_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
const LLM_IMAGE_MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const LLM_IMAGE_MAX_ITEMS = 32;
const LLM_IMAGE_BACKUP_MAX_CHARS = Math.ceil(LLM_IMAGE_MAX_TOTAL_BYTES * 4 / 3) + 1024 * 1024;
const LLM_IMAGE_ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);
const LLM_EXPLANATION_PROMPT_VERSION = "2026-08-09-structured-v1";
const LLM_LOCAL_CACHE_LIMIT = 24;
const LLM_DEFAULT_MODEL = "deepseek/deepseek-v4-flash";
const LLM_MODELS = Object.freeze([
  { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 mini" },
]);
const QUIZ_LAYOUT_STORAGE_KEY = "quiz-zen-question-answer-layout-ratio-v3";
const VISUAL_THEME_STORAGE_KEY = "quiz-zen-visual-theme-v1";
const VISUAL_THEME_MOTION_STORAGE_KEY = "quiz-zen-theme-motion-v1";
const IMMERSIVE_SOUND_STORAGE_KEY = "quiz-zen-immersive-sound-v1";
const IMMERSIVE_VOLUME_STORAGE_KEY = "quiz-zen-immersive-volume-v1";
const FULL_DATA_BACKUP_APP = "quiz-zen-complete-backup";
const FULL_DATA_BACKUP_VERSION = 1;
const FULL_DATA_BACKUP_MAX_BYTES = 20 * 1024 * 1024;
const FULL_DATA_DATABASE_NAME = "local-quiz-studio";
const FULL_DATA_LLM_PROVIDERS_STORAGE_KEY = "local-quiz-studio-llm-providers-v1";
const FULL_DATA_LLM_PROVIDER_DEFINITIONS = Object.freeze({
  "deepseek/deepseek-v4-flash": Object.freeze({ provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1" }),
  "deepseek/deepseek-v4-pro": Object.freeze({ provider: "openai", baseUrl: "https://api.openai.com/v1" }),
  "google/gemini-3.5-flash": Object.freeze({ provider: "gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta" }),
  "anthropic/claude-sonnet-4.6": Object.freeze({ provider: "anthropic", baseUrl: "https://api.anthropic.com/v1" }),
  "openai/gpt-5.4-mini": Object.freeze({ provider: "compatible", baseUrl: "https://api.groq.com/openai/v1" }),
});
const FULL_DATA_DATABASE_STORES = Object.freeze([
  "subjects",
  "sections",
  "questions",
  "attempts",
  "questionStates",
  "studySessions",
  "settings",
]);
const FULL_DATA_DATABASE_PRIMARY_KEYS = Object.freeze({
  subjects: "id",
  sections: "id",
  questions: "id",
  attempts: "id",
  questionStates: "questionId",
  studySessions: "id",
  settings: "key",
});
const VISUAL_THEMES = Object.freeze({
  fantasy: {
    label: "剣と魔法",
    colorScheme: "dark",
    kicker: "ENTER THE REALM",
    subtitle: "静謐の書庫",
  },
  mediterranean: {
    label: "地中海",
    colorScheme: "light",
    kicker: "DIVE INTO BLUE",
    subtitle: "陽光の海底神殿",
  },
  okinawa: {
    label: "沖縄モード",
    colorScheme: "light",
    kicker: "ISLAND BLUE",
    subtitle: "珊瑚礁と南国の海",
  },
  hokkaido: {
    label: "北海道モード",
    colorScheme: "light",
    kicker: "SNOW FIELD",
    subtitle: "雪原と澄んだ冬空",
  },
  halloween: {
    label: "ハロウィンモード",
    colorScheme: "dark",
    kicker: "NIGHT FESTIVAL",
    subtitle: "紫の夜と灯る南瓜",
  },
  "new-year": {
    label: "お正月モード",
    colorScheme: "dark",
    kicker: "FIRST SUNRISE",
    subtitle: "初日の出と金屏風",
  },
  christmas: {
    label: "クリスマスモード",
    colorScheme: "dark",
    kicker: "WINTER LIGHTS",
    subtitle: "雪夜と森のイルミネーション",
  },
  hanami: {
    label: "お花見モード",
    colorScheme: "light",
    kicker: "SAKURA SEASON",
    subtitle: "春霞と満開の桜",
  },
  "event-horizon": {
    label: "事象の地平面",
    colorScheme: "dark",
    kicker: "BEYOND THE HORIZON",
    subtitle: "重力境界観測域",
  },
});
const IMMERSIVE_THEME_AUDIO = Object.freeze({
  fantasy: { frequencies: [392, 587.33], type: "triangle", level: 0.07, delay: 11000 },
  mediterranean: { frequencies: [174.61, 261.63], type: "triangle", level: 0.12, delay: 7000 },
  okinawa: { frequencies: [220, 329.63], type: "triangle", level: 0.1, delay: 7600 },
  hokkaido: { frequencies: [261.63, 523.25], type: "sine", level: 0.07, delay: 12000 },
  halloween: { frequencies: [130.81, 196], type: "sine", level: 0.065, delay: 12500 },
  "new-year": { frequencies: [293.66, 440], type: "triangle", level: 0.075, delay: 10500 },
  christmas: { frequencies: [329.63, 493.88], type: "sine", level: 0.075, delay: 9000 },
  hanami: { frequencies: [349.23, 523.25], type: "triangle", level: 0.075, delay: 9500 },
  "event-horizon": { frequencies: [110, 164.81], type: "sine", level: 0.07, delay: 14000 },
});
const QUESTION_CLIPBOARD_PREAMBLE =
  "以下の問題を、図や表を使って視覚的に整理しながら解説してください。必要なら問題文の条件関係を図解してください。";
const DEFAULT_TUTOR_NAME = "ひなひな";
const KOUGAI_MANAGER_COURSE_ID = "kougai-manager";
const KOUGAI_FREQUENT_QUESTION_THRESHOLD = 3;
const COMPLETED_COURSE_IDS = new Set(data.courses.filter(course => course.completed).map(course => course.id));
const DEFAULT_COURSE_ID = data.courses.some((courseItem) => courseItem.id === "pe-first-info")
  ? "pe-first-info"
  : data.courses.some((courseItem) => courseItem.id === "advanced-am1")
    ? "advanced-am1"
    : data.courses[0].id;
const DEFAULT_VIRTUAL_CHAPTER_KEYS = {
  "pe-first-info": "pe-first-info:fundamental-field:design-plan",
};
const DEFAULT_EXPANDED_CHAPTER_CATEGORIES = {
  "pe-first-info": ["fundamental-field"],
};
const ADVANCED_AM1_CATEGORIES = [
  {
    id: "technology",
    label: "テクノロジ系",
    chapterNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    id: "management",
    label: "マネジメント系",
    chapterNumbers: [14, 15, 16],
  },
  {
    id: "strategy",
    label: "ストラテジ系",
    chapterNumbers: [17, 18, 19, 20, 21, 22, 23],
  },
];
const PE_FIRST_INFO_FUNDAMENTAL_FIELD_ORDER = [
  "設計・計画に関するもの",
  "情報・論理に関するもの",
  "解析に関するもの",
  "材料・化学・バイオに関するもの",
  "環境・エネルギー・技術に関するもの",
];
const TIMER_LIMIT = 60;
const QMA_REFERENCE_TIMER = 20;
const QMA_MIN_SECONDS = 5;
const QMA_MIN_SCORE_RATIO = 0.5;
const QMA_GREEN_SECONDS = {
  judge: 18,
  four: 17.5,
  association: 17,
  typing: 16,
};
const LITE_MODE =
  Boolean(window.__quizZenLiteMode) ||
  window.matchMedia("(max-width: 980px), (pointer: coarse), (prefers-reduced-motion: reduce)").matches;
const QUESTION_TYPEWRITER_MAX_MS = 1950;
const QUESTION_TEXT_MIN_SCALE = 0.62;
const QUESTION_TEXT_COMPACT_MIN_SCALE = 0.78;
const QUESTION_TEXT_FIT_STEP = 0.03;
const QUESTION_TEXT_LONG_CHAR_LIMIT = 42;
const QUIZ_CONTENT_DENSITIES = new Set(["brief", "standard", "dense", "extended", "visual"]);
const QUIZ_IMAGE_SCALE = 2;
const MATH_RENDER_OPTIONS = {
  delimiters: [
    { left: "\\[", right: "\\]", display: true },
    { left: "\\(", right: "\\)", display: false },
  ],
  throwOnError: false,
  strict: "ignore",
  trust: false,
};
const MATH_RUNTIME_COURSE_IDS = new Set([
  "high-school-math",
  "math-ii-training",
  "analysis-intro",
  "analysis-1",
]);
const MATH_RUNTIME_ASSETS = Object.freeze({
  stylesheet: "./native-math.css?v=1",
  katex: "./native-runtime.js?v=1",
  autoRender: "./native-runtime.js?v=1",
  graphing: "./graphing-calculator.js?v=20260709-point-cursor",
});
const SOURCE_OPTION_EXPLANATION_CLASS_INDEX = new Map([
  ["lia", 0],
  ["lii", 1],
  ["liu", 2],
  ["lie", 3],
  ["lio", 4],
]);
const QUESTION_DIRECTIVE_HIGHLIGHT_RULES = [
  {
    className: "question-directive-red",
    regex:
      /(?:最も|もっとも)?(?:誤っている|誤った|誤りである|不適切|適切でない|正しくない|間違っている|間違った)(?:な|である|と思われる)?(?:もの|記述|説明|選択肢|組合せ|組み合わせ|文|数)(?:は|を|の)?(?:どれか|選べ|選びなさい|選択せよ)?/gu,
  },
  {
    className: "question-directive-green",
    regex:
      /(?:最も|もっとも)?(?:正しい|適切な|適当な|適切である)(?:もの|記述|説明|選択肢|組合せ|組み合わせ|文)(?:は|を)?(?:どれか|選べ|選びなさい|選択せよ)?/gu,
  },
];
const TIMER_TICK_MS = LITE_MODE ? 500 : 200;
const WHEEL_PAGE_THRESHOLD = 42;
const WHEEL_PAGE_COOLDOWN_MS = 360;
const AUTO_ADVANCE_DELAY_MS = 1200;
const MACHIDA_WEATHER_LOCATION = {
  latitude: 35.5467,
  longitude: 139.4386,
};
const WEATHER_REFRESH_MS = 30 * 60 * 1000;
const STUDY_TIME_TICK_MS = 500;
const STUDY_LOG_LIMIT = 5000;
const DAILY_STUDY_TARGET_MS = 2 * 60 * 60 * 1000;
const STUDY_BUSINESS_DAY_START_HOUR = 5;
const QUESTION_EFFORT_MS = 2 * 60 * 1000;
const DAILY_QUESTION_TARGET = Math.ceil(DAILY_STUDY_TARGET_MS / QUESTION_EFFORT_MS);
const STUDY_ACTIVITY_CHECK_INTERVAL_MS = 3 * 60 * 1000;
const STUDY_ACTIVITY_RESPONSE_MS = 30 * 1000;
const STUDY_ACTIVITY_SOUND_REPEAT_MS = 10000;
const STUDY_ACTIVITY_SAVE_THROTTLE_MS = 10000;
const MINUTE_MS = 60 * 1000;
const POMODORO_DEFAULT_PRESET_ID = "standard";
const POMODORO_PRESETS = Object.freeze({
  standard: {
    label: "王道",
    focusMs: 25 * MINUTE_MS,
    shortBreakMs: 5 * MINUTE_MS,
    longBreakMs: 15 * MINUTE_MS,
    longBreakEvery: 4,
  },
  deep: {
    label: "深い集中",
    focusMs: 50 * MINUTE_MS,
    shortBreakMs: 10 * MINUTE_MS,
    longBreakMs: 30 * MINUTE_MS,
    longBreakEvery: 2,
  },
  sprint: {
    label: "短期決戦",
    focusMs: 15 * MINUTE_MS,
    shortBreakMs: 3 * MINUTE_MS,
    longBreakMs: 10 * MINUTE_MS,
    longBreakEvery: 4,
  },
  animeBossa: {
    label: "アニメ・ボサノバ",
    focusMs: 30 * MINUTE_MS,
    shortBreakMs: 5 * MINUTE_MS,
    longBreakMs: 20 * MINUTE_MS,
    longBreakEvery: 4,
  },
});
const POMODORO_PRESET_IDS = Object.keys(POMODORO_PRESETS);
const STUDY_REPORT_LIMITS = {
  day: 7,
  course: 6,
  chapter: 8,
};
const REVIEW_CURRICULUM_LIMIT = 20;
const REVIEW_CURRICULUM_INTERVAL_DAYS = [1, 3, 7, 14, 30];
const REVIEW_CURRICULUM_VIRTUAL_PREFIX = "review-curriculum";
const REVIEW_TARGET_EXCLUDED_COURSE_IDS = new Set(["anthropocene", "bigdata", "periodic-table"]);
const REVIEW_SESSION_MODES = ["smart", "overdue", "today", "weak"];
const REVIEW_SESSION_SIZES = [5, 10, 20];
const REVIEW_SESSION_HISTORY_LIMIT = 30;
const STUDY_BACKUP_VERSION = 2;
const STUDY_REPORT_MODES = new Set(["day", "course", "chapter"]);
const UNDERSTANDING_LEVELS = ["lost", "confused", "partial", "complete", "worthless"];
const UNDERSTANDING_LEVEL_SET = new Set(UNDERSTANDING_LEVELS);
const UNDERSTANDING_UNRATED_LABEL = "未評価";
const UNDERSTANDING_LABELS = {
  lost: "なんもわからん",
  confused: "なるほどわからん",
  partial: "雰囲気で理解した",
  complete: "完全に理解した",
  worthless: "やる価値なし",
};
const UNDERSTANDING_PAGER_MARKS = {
  lost: "?",
  confused: "!",
  partial: "~",
  complete: "✓",
  worthless: "×",
};
const QUIZ_RESIZE_MIN_HEIGHTS = {
  question: 110,
  answers: 190,
};
const REVIEW_RESIZE_POINTER_SLOP = 4;
const CLOCK_TIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const CLOCK_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

let timerHandle = null;
let studyTimeHandle = null;
let weatherHandle = null;
let weatherStartHandle = null;
let mathRuntimePromise = null;
let timerQuestionId = null;
let timerStartedAt = 0;
let resultBurstTimer = null;
let answerCombo = 0;
let autoAdvanceTimer = null;
let answerHistoryScrollFrame = null;
let copyQuestionStatusTimer = null;
let llmCopyStatusTimer = null;
let questionTypewriterFrame = null;
let questionTextFitFrame = null;
let questionTextRenderKey = "";
let wheelPageDelta = 0;
let wheelLastTurnedAt = 0;
let studyActivitySoundHandle = null;
let studyBackupStatusTimer = null;
let studyAudioContext = null;
let immersiveAmbientMaster = null;
let immersiveAmbientNodes = [];
let immersiveAmbientTimer = null;
let immersiveSceneIntroTimer = null;
let immersiveFullscreenRequested = false;
let lastStudyScreenActivityAt = Date.now();
let lastStudyActivityCheckSaveAt = 0;
let pendingHistoryDelete = null;
let lastTouchAnswerAt = 0;
let lastTouchAnswerIndex = -1;
let suppressOptionClickUntil = 0;
let pendingMobileQuizScroll = false;
let optionTouchGesture = null;
let quizResizeDrag = null;
let suppressQuizResizeClickUntil = 0;
let sourceLayoutFrame = null;
let sourceLayoutSettleTimer = null;
let quizContentResizeObserver = null;
let optionGraphCalculator = null;
let optionGraphOpen = false;
let optionGraphQuestionKey = "";
let optionGraphItems = [];
let optionGraphPromptEl = null;
let optionGraphPromptTimer = null;
let optionGraphPromptIndex = -1;
let optionGraphPromptAnchorEl = null;
let optionGraphActiveIndex = -1;
let optionGraphActiveId = "";
let optionGraphAnchorRect = null;
let optionGraphFloatingPosition = null;
let optionGraphPanelDrag = null;
let optionGraphTheme = "dark";
let llmRequestController = null;
let llmSettingsCache = null;
let llmConversation = [];
let llmConversationQuestionId = "";
let llmConversationModel = "";
let llmConversationTokens = 0;
let llmImageItems = [];
let llmImagesLoaded = false;
let llmImagesLoading = false;
let llmImagesSaving = false;
let llmImageLibraryOpen = false;
let imagePreviewSource = null;
let imagePreviewTouchGesture = null;
let suppressImagePreviewClickUntil = 0;
let lastImagePreviewTouchAt = 0;
const reviewCurriculumLoadingCourses = new Set();
const reviewCurriculumLoadFailedCourses = new Set();
const progressAnswerMigrationCourses = new Set();

const OPTION_TOUCH_TAP_SLOP = 12;

const state = {
  courseId: initialCourseId(),
  chapterIndex: 0,
  virtualChapterKey: null,
  virtualChapter: null,
  questionIndex: 0,
  order: [],
  frequencySortMode: false,
  followUpMode: false,
  unansweredMode: false,
  favoriteMode: false,
  calculationMode: false,
  nonCalculationMode: false,
  visualTheme: loadVisualTheme(),
  visualThemeMotionEnabled: loadVisualThemeMotion(),
  immersiveMode: false,
  immersiveSoundEnabled: loadImmersiveSoundEnabled(),
  immersiveVolume: loadImmersiveVolume(),
  llmModel: loadLlmModel(),
  llmPanelQuestionId: null,
  llmLoading: false,
  sectionSearchQuery: "",
  autoAdvanceMode: false,
  sectionLoopMode: loadSectionLoopMode(),
  optionShuffleMode: loadOptionShuffleMode(),
  quizLayoutRatio: loadQuizLayoutRatio(),
  timerEnabled: loadTimerEnabled(),
  wheelMode: loadWheelMode(),
  retakeQuestionId: null,
  stopwatch: loadStopwatch(),
  studyLog: loadStudyLog(),
  studyReportMode: loadStudyReportMode(),
  studyActivityStoppedNotice: false,
  periodicPickerOpen: false,
  reviewCurveSummaryOpen: false,
  reviewSession: loadReviewSession(),
  reviewSessionHistory: loadReviewSessionHistory(),
  reviewTargetCourseIds: loadReviewTargetCourseIds(),
  progress: loadProgress(),
  understanding: loadUnderstanding(),
  understandingUpdatedAt: loadUnderstandingUpdatedAt(),
  calculationQuestions: loadCalculationQuestions(),
  calculationQuestionsUpdatedAt: loadCalculationQuestionsUpdatedAt(),
  collapsedChapterCategories: loadCollapsedChapterCategories(),
  expandedChapterCategories: loadExpandedChapterCategories(),
  completedCoursesOpen: false,
};

const els = {
  datasetMeta: document.querySelector("#datasetMeta"),
  fullDataSaveButton: document.querySelector("#fullDataSaveButton"),
  fullDataLoadButton: document.querySelector("#fullDataLoadButton"),
  fullDataLoadInput: document.querySelector("#fullDataLoadInput"),
  fullDataStatus: document.querySelector("#fullDataStatus"),
  quizPanel: document.querySelector(".quiz-panel"),
  questionBoard: document.querySelector(".question-board"),
  periodicStage: document.querySelector("#periodicStage"),
  courseName: document.querySelector("#courseName"),
  chapterTitle: document.querySelector("#chapterTitle"),
  chapterResources: document.querySelector("#chapterResources"),
  chapterList: document.querySelector("#chapterList"),
  courseTabs: [...document.querySelectorAll(".course-tab")],
  completedCoursesToggle: document.querySelector("#completedCoursesToggle"),
  completedCourseSwitch: document.querySelector("#completedCourseSwitch"),
  completedCourseTabs: [...document.querySelectorAll("[data-completed-course]")],
  accuracy: document.querySelector("#accuracy"),
  answeredCount: document.querySelector("#answeredCount"),
  comboCell: document.querySelector("#comboCell"),
  comboCount: document.querySelector("#comboCount"),
  followUpCount: document.querySelector("#followUpCount"),
  attemptCount: document.querySelector("#attemptCount"),
  currentIndex: document.querySelector("#currentIndex"),
  progressBar: document.querySelector("#progressBar"),
  rankLabel: document.querySelector("#rankLabel"),
  timerValue: document.querySelector("#timerValue"),
  timerBar: document.querySelector("#timerBar"),
  questionAnswerResizeHandle: document.querySelector("#questionAnswerResizeHandle"),
  formatLabel: document.querySelector("#formatLabel"),
  sideScoreValue: document.querySelector("#sideScoreValue"),
  sideScoreBar: document.querySelector("#sideScoreBar"),
  sideRound: document.querySelector("#sideRound"),
  sideFormatLabel: document.querySelector("#sideFormatLabel"),
  sideRankLabel: document.querySelector("#sideRankLabel"),
  sideFollowUpCount: document.querySelector("#sideFollowUpCount"),
  weatherCard: document.querySelector(".weather-card"),
  weatherRefreshButton: document.querySelector("#weatherRefreshButton"),
  weatherIcon: document.querySelector("#weatherIcon"),
  weatherTemp: document.querySelector("#weatherTemp"),
  weatherCondition: document.querySelector("#weatherCondition"),
  weatherHumidity: document.querySelector("#weatherHumidity"),
  weatherRange: document.querySelector("#weatherRange"),
  weatherPressure: document.querySelector("#weatherPressure"),
  weatherRain: document.querySelector("#weatherRain"),
  weatherPrecipProbability: document.querySelector("#weatherPrecipProbability"),
  weatherWindSpeed: document.querySelector("#weatherWindSpeed"),
  weatherPm25: document.querySelector("#weatherPm25"),
  weatherPm10: document.querySelector("#weatherPm10"),
  weatherNo2: document.querySelector("#weatherNo2"),
  weatherOzone: document.querySelector("#weatherOzone"),
  weatherUpdated: document.querySelector("#weatherUpdated"),
  studyClockFace: document.querySelector("#studyClockFace"),
  studyClockHour: document.querySelector("#studyClockHour"),
  studyClockMinute: document.querySelector("#studyClockMinute"),
  studyClockSecond: document.querySelector("#studyClockSecond"),
  studyClockDate: document.querySelector("#studyClockDate"),
  studyStopwatch: document.querySelector(".study-stopwatch"),
  studyStopwatchValue: document.querySelector("#studyStopwatchValue"),
  studyStopwatchStart: document.querySelector("#studyStopwatchStart"),
  studyStopwatchStartLabel: document.querySelector("#studyStopwatchStartLabel"),
  studyStopwatchReset: document.querySelector("#studyStopwatchReset"),
  pomodoroPhaseLabel: document.querySelector("#pomodoroPhaseLabel"),
  pomodoroPreset: document.querySelector("#pomodoroPreset"),
  pomodoroBar: document.querySelector("#pomodoroBar"),
  pomodoroSetLabel: document.querySelector("#pomodoroSetLabel"),
  pomodoroToggle: document.querySelector("#pomodoroToggle"),
  pomodoroToggleLabel: document.querySelector("#pomodoroToggleLabel"),
  pomodoroSkip: document.querySelector("#pomodoroSkip"),
  pomodoroNotice: document.querySelector("#pomodoroNotice"),
  pomodoroNoticeCard: document.querySelector("#pomodoroNoticeCard"),
  pomodoroNoticeTitle: document.querySelector("#pomodoroNoticeTitle"),
  pomodoroNoticeBody: document.querySelector("#pomodoroNoticeBody"),
  imagePreview: document.querySelector("#imagePreview"),
  imagePreviewBackdrop: document.querySelector("#imagePreviewBackdrop"),
  imagePreviewClose: document.querySelector("#imagePreviewClose"),
  imagePreviewImage: document.querySelector("#imagePreviewImage"),
  studyTodayValue: document.querySelector("#studyTodayValue"),
  studyTotalValue: document.querySelector("#studyTotalValue"),
  studyEffortLabel: document.querySelector("#studyEffortLabel"),
  studyEffortBar: document.querySelector("#studyEffortBar"),
  studyEffortDetail: document.querySelector("#studyEffortDetail"),
  studyEffortMessage: document.querySelector("#studyEffortMessage"),
  studyInsightGrid: document.querySelector("#studyInsightGrid"),
  studyActionPlan: document.querySelector("#studyActionPlan"),
  studyCheckpointPanel: document.querySelector("#studyCheckpointPanel"),
  studyRoutePanel: document.querySelector("#studyRoutePanel"),
  studyEfficiencyPanel: document.querySelector("#studyEfficiencyPanel"),
  studyWeekStrip: document.querySelector("#studyWeekStrip"),
  studyRhythmMap: document.querySelector("#studyRhythmMap"),
  studyContinuityPanel: document.querySelector("#studyContinuityPanel"),
  studyForecastPanel: document.querySelector("#studyForecastPanel"),
  reviewOutlookPanel: document.querySelector("#reviewOutlookPanel"),
  reviewCalendarPanel: document.querySelector("#reviewCalendarPanel"),
  reviewCoachPanel: document.querySelector("#reviewCoachPanel"),
  reviewDialPanel: document.querySelector("#reviewDialPanel"),
  reviewSprintPanel: document.querySelector("#reviewSprintPanel"),
  reviewFocusPanel: document.querySelector("#reviewFocusPanel"),
  reviewMomentumPanel: document.querySelector("#reviewMomentumPanel"),
  reviewCommandDeckPanel: document.querySelector("#reviewCommandDeckPanel"),
  reviewSetBlueprintPanel: document.querySelector("#reviewSetBlueprintPanel"),
  reviewOutcomePanel: document.querySelector("#reviewOutcomePanel"),
  reviewCoursePulsePanel: document.querySelector("#reviewCoursePulsePanel"),
  reviewReturnPanel: document.querySelector("#reviewReturnPanel"),
  reviewNextQueuePanel: document.querySelector("#reviewNextQueuePanel"),
  reviewAgePanel: document.querySelector("#reviewAgePanel"),
  reviewRecoveryBoard: document.querySelector("#reviewRecoveryBoard"),
  studyCourseMatrix: document.querySelector("#studyCourseMatrix"),
  examReadinessPanel: document.querySelector("#examReadinessPanel"),
  reviewMasteryTrack: document.querySelector("#reviewMasteryTrack"),
  understandingSummary: document.querySelector("#understandingSummary"),
  weaknessPanel: document.querySelector("#weaknessPanel"),
  reviewSessionHistory: document.querySelector("#reviewSessionHistory"),
  studyRunningContext: document.querySelector("#studyRunningContext"),
  studyReportTabs: [...document.querySelectorAll(".study-report-tab")],
  studyReportList: document.querySelector("#studyReportList"),
  studyBackupExport: document.querySelector("#studyBackupExport"),
  studyBackupImport: document.querySelector("#studyBackupImport"),
  studyBackupInput: document.querySelector("#studyBackupInput"),
  studyBackupStatus: document.querySelector("#studyBackupStatus"),
  studySummaryHero: document.querySelector("#studySummaryHero"),
  studySummaryPanel: document.querySelector("#studySummaryPanel"),
  studySummaryBarStats: document.querySelector("#studySummaryBarStats"),
  studySummaryJumpbar: document.querySelector("#studySummaryJumpbar"),
  studySummaryClose: document.querySelector("#studySummaryClose"),
  reviewTargetPanel: document.querySelector("#reviewTargetPanel"),
  reviewTodayTargetPanel: document.querySelector("#reviewTodayTargetPanel"),
  reviewSessionPlanner: document.querySelector("#reviewSessionPlanner"),
  reviewLoadRadar: document.querySelector("#reviewLoadRadar"),
  reviewCourseMap: document.querySelector("#reviewCourseMap"),
  reviewCurriculumList: document.querySelector("#reviewCurriculumList"),
  reviewCurveSummary: document.querySelector("#reviewCurveSummary"),
  reviewCurveSummaryToggle: document.querySelector("#reviewCurveSummaryToggle"),
  studyActivityCheck: document.querySelector("#studyActivityCheck"),
  studyActivityCountdown: document.querySelector("#studyActivityCountdown"),
  studyActivityMessage: document.querySelector("#studyActivityMessage"),
  studyActivityConfirm: document.querySelector("#studyActivityConfirm"),
  questionNumber: document.querySelector("#questionNumber"),
  variantChip: document.querySelector("#variantChip"),
  questionSourceButton: document.querySelector("#questionSourceButton"),
  questionSourceDialog: document.querySelector("#questionSourceDialog"),
  questionSourceClose: document.querySelector("#questionSourceClose"),
  questionSourceTitle: document.querySelector("#questionSourceTitle"),
  questionSourceUsage: document.querySelector("#questionSourceUsage"),
  questionSourceExternal: document.querySelector("#questionSourceExternal"),
  questionFrequencyBadge: document.querySelector("#questionFrequencyBadge"),
  questionFrequencyDetails: document.querySelector("#questionFrequencyDetails"),
  reviewSessionHud: document.querySelector("#reviewSessionHud"),
  understandingToggle: document.querySelector("#understandingToggle"),
  understandingButtons: [...document.querySelectorAll(".understanding-choice-button")],
  calculationMarkerButton: document.querySelector("#calculationMarkerButton"),
  copyQuestionButton: document.querySelector("#copyQuestionButton"),
  llmTeachButton: document.querySelector("#llmTeachButton"),
  llmExplanationPanel: document.querySelector("#llmExplanationPanel"),
  llmPanelClose: document.querySelector("#llmPanelClose"),
  explanationImagesButton: document.querySelector("#explanationImagesButton"),
  explanationImagesDialog: document.querySelector("#explanationImagesDialog"),
  explanationImagesClose: document.querySelector("#explanationImagesClose"),
  llmImageLibraryToggle: document.querySelector("#llmImageLibraryToggle"),
  llmCopyButton: document.querySelector("#llmCopyButton"),
  llmSettingsToggle: document.querySelector("#llmSettingsToggle"),
  llmSettings: document.querySelector("#llmSettings"),
  llmSettingsStatus: document.querySelector("#llmSettingsStatus"),
  llmSetupGuide: document.querySelector("#llmSetupGuide"),
  llmApiKeyInput: document.querySelector("#llmApiKeyInput"),
  llmApiKeySave: document.querySelector("#llmApiKeySave"),
  llmApiKeyDelete: document.querySelector("#llmApiKeyDelete"),
  llmImageLibrary: document.querySelector("#llmImageLibrary"),
  llmImageStatus: document.querySelector("#llmImageStatus"),
  llmImageAdd: document.querySelector("#llmImageAdd"),
  llmImageInput: document.querySelector("#llmImageInput"),
  llmImageGallery: document.querySelector("#llmImageGallery"),
  llmModelSelect: document.querySelector("#llmModelSelect"),
  llmRegenerateButton: document.querySelector("#llmRegenerateButton"),
  llmPanelStatus: document.querySelector("#llmPanelStatus"),
  llmExplanationBody: document.querySelector("#llmExplanationBody"),
  llmFollowUpSuggestions: document.querySelector("#llmFollowUpSuggestions"),
  llmFollowUpForm: document.querySelector("#llmFollowUpForm"),
  llmFollowUpInput: document.querySelector("#llmFollowUpInput"),
  llmFollowUpSend: document.querySelector("#llmFollowUpSend"),
  llmPanelFooter: document.querySelector("#llmPanelFooter"),
  clueBox: document.querySelector("#clueBox"),
  questionText: document.querySelector("#questionText"),
  answerDock: document.querySelector(".answer-dock"),
  options: document.querySelector("#options"),
  typingPanel: document.querySelector("#typingPanel"),
  typingInput: document.querySelector("#typingInput"),
  typingSubmit: document.querySelector("#typingSubmit"),
  typingHint: document.querySelector("#typingHint"),
  optionGraphPanel: document.querySelector("#optionGraphPanel"),
  feedback: document.querySelector("#feedback"),
  feedbackTitle: document.querySelector("#feedbackTitle"),
  feedbackBody: document.querySelector("#feedbackBody"),
  resultBurst: document.querySelector("#resultBurst"),
  resultBurstText: document.querySelector("#resultBurstText"),
  resultBurstSub: document.querySelector("#resultBurstSub"),
  retryButton: document.querySelector("#retryButton"),
  attemptSummary: document.querySelector("#attemptSummary"),
  attemptHistory: document.querySelector("#attemptHistory"),
  answerHistoryStrip: document.querySelector("#answerHistoryStrip"),
  answerHistoryMarks: document.querySelector("#answerHistoryMarks"),
  prevButton: document.querySelector("#prevButton"),
  nextButton: document.querySelector("#nextButton"),
  sectionSearch: document.querySelector("#sectionSearch"),
  sectionSearchToggle: document.querySelector("#sectionSearchToggle"),
  sectionSearchInput: document.querySelector("#sectionSearchInput"),
  sectionSearchCount: document.querySelector("#sectionSearchCount"),
  sectionSearchClear: document.querySelector("#sectionSearchClear"),
  shuffleButton: document.querySelector("#shuffleButton"),
  frequencySortButton: document.querySelector("#frequencySortButton"),
  followUpButton: document.querySelector("#followUpButton"),
  unansweredButton: document.querySelector("#unansweredButton"),
  favoriteModeButton: document.querySelector("#favoriteModeButton"),
  calculationModeButton: document.querySelector("#calculationModeButton"),
  nonCalculationModeButton: document.querySelector("#nonCalculationModeButton"),
  autoAdvanceButton: document.querySelector("#autoAdvanceButton"),
  sectionLoopButton: document.querySelector("#sectionLoopButton"),
  optionShuffleButton: document.querySelector("#optionShuffleButton"),
  timerToggleButton: document.querySelector("#timerToggleButton"),
  wheelModeButton: document.querySelector("#wheelModeButton"),
  wheelModeLabel: document.querySelector("#wheelModeLabel"),
  themePicker: document.querySelector("#themePicker"),
  themePickerToggle: document.querySelector("#themePickerToggle"),
  themePickerLabel: document.querySelector("#themePickerLabel"),
  themePickerPopover: document.querySelector("#themePickerPopover"),
  themeChoices: [...document.querySelectorAll("[data-theme-choice]")],
  themeMotionToggle: document.querySelector("#themeMotionToggle"),
  immersiveModeButton: document.querySelector("#immersiveModeButton"),
  immersiveHud: document.querySelector("#immersiveHud"),
  immersiveSceneName: document.querySelector("#immersiveSceneName"),
  immersiveSoundToggle: document.querySelector("#immersiveSoundToggle"),
  immersiveVolumeInput: document.querySelector("#immersiveVolumeInput"),
  immersiveExitButton: document.querySelector("#immersiveExitButton"),
  immersiveSceneIntro: document.querySelector("#immersiveSceneIntro"),
  immersiveSceneKicker: document.querySelector("#immersiveSceneKicker"),
  immersiveSceneTitle: document.querySelector("#immersiveSceneTitle"),
  immersiveSceneSubtitle: document.querySelector("#immersiveSceneSubtitle"),
  timeCard: document.querySelector(".time-card"),
  historyMenuButton: document.querySelector("#historyMenuButton"),
  historyMenu: document.querySelector("#historyMenu"),
  resetQuestionButton: document.querySelector("#resetQuestionButton"),
  resetChapterButton: document.querySelector("#resetChapterButton"),
  resetCourseButton: document.querySelector("#resetCourseButton"),
  resetAllButton: document.querySelector("#resetAllButton"),
  historyInlineConfirm: document.querySelector("#historyInlineConfirm"),
  historyInlineTitle: document.querySelector("#historyInlineTitle"),
  historyInlineMessage: document.querySelector("#historyInlineMessage"),
  historyInlineCancel: document.querySelector("#historyInlineCancel"),
  historyInlineOk: document.querySelector("#historyInlineOk"),
  pager: document.querySelector("#pager"),
};

if (els.optionGraphPanel && els.optionGraphPanel.parentElement !== document.body) {
  document.body.appendChild(els.optionGraphPanel);
}
if (els.themePickerPopover && els.themePickerPopover.parentElement !== document.body) {
  document.body.appendChild(els.themePickerPopover);
}

if (typeof ResizeObserver === "function" && els.answerDock && els.options) {
  quizContentResizeObserver = new ResizeObserver(() => scheduleSourceLayoutUpdate());
  quizContentResizeObserver.observe(els.answerDock);
  quizContentResizeObserver.observe(els.options);
}

document.fonts?.ready.then(() => scheduleSourceLayoutUpdate()).catch(() => {});

function normalizeVisualTheme(value) {
  return Object.hasOwn(VISUAL_THEMES, value) ? value : "mediterranean";
}

function loadVisualTheme() {
  try {
    return normalizeVisualTheme(localStorage.getItem(VISUAL_THEME_STORAGE_KEY));
  } catch {
    return "mediterranean";
  }
}

function loadVisualThemeMotion() {
  if (LITE_MODE) return false;
  try {
    const savedMotion = localStorage.getItem(VISUAL_THEME_MOTION_STORAGE_KEY);
    if (savedMotion) return savedMotion !== "off";
    // 背景演出は初期状態では停止。利用者が選んだ設定は次回も尊重する。
    return false;
  } catch {
    return false;
  }
}

function loadImmersiveSoundEnabled() {
  try {
    return localStorage.getItem(IMMERSIVE_SOUND_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function loadImmersiveVolume() {
  try {
    const savedValue = localStorage.getItem(IMMERSIVE_VOLUME_STORAGE_KEY);
    if (savedValue === null || savedValue === "") return 46;
    const savedVolume = Number(savedValue);
    return Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 100 ? savedVolume : 46;
  } catch {
    return 46;
  }
}

function normalizeLlmModel(value) {
  const model = String(value || "").trim();
  return LLM_MODELS.some((item) => item.id === model) ? model : LLM_DEFAULT_MODEL;
}

function loadLlmModel() {
  try {
    return normalizeLlmModel(localStorage.getItem(LLM_MODEL_STORAGE_KEY));
  } catch {
    return LLM_DEFAULT_MODEL;
  }
}

function saveLlmModel(value) {
  state.llmModel = normalizeLlmModel(value);
  try {
    localStorage.setItem(LLM_MODEL_STORAGE_KEY, state.llmModel);
  } catch {
    // Keep the selected model for this page when storage is unavailable.
  }
  if (els.llmModelSelect) els.llmModelSelect.value = state.llmModel;
}

function llmModelLabel(model = state.llmModel) {
  return LLM_MODELS.find((item) => item.id === model)?.label || model;
}

function renderVisualThemePicker() {
  const theme = VISUAL_THEMES[state.visualTheme] || VISUAL_THEMES.mediterranean;
  if (els.themePickerLabel) els.themePickerLabel.textContent = theme.label;
  if (els.themePickerToggle) {
    els.themePickerToggle.title = `画面テーマ: ${theme.label}`;
    els.themePickerToggle.setAttribute("aria-label", `画面テーマを選ぶ。現在は${theme.label}`);
  }
  els.themeChoices.forEach((choice) => {
    const active = choice.dataset.themeChoice === state.visualTheme;
    choice.classList.toggle("active", active);
    choice.setAttribute("aria-pressed", String(active));
  });
  els.themeMotionToggle?.setAttribute("aria-checked", String(state.visualThemeMotionEnabled));
  els.themeMotionToggle?.classList.toggle("active", state.visualThemeMotionEnabled);
}

function applyVisualTheme(value, { persist = false } = {}) {
  const nextTheme = normalizeVisualTheme(value);
  state.visualTheme = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = VISUAL_THEMES[nextTheme].colorScheme;
  if (persist) {
    try {
      localStorage.setItem(VISUAL_THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Theme selection remains active for this page even when storage is unavailable.
    }
  }
  renderVisualThemePicker();
  window.dispatchEvent(new CustomEvent("quizzen:theme-change", { detail: { theme: nextTheme } }));
  renderImmersiveControls();
  if (state.immersiveMode) {
    showImmersiveSceneIntro();
    restartImmersiveAmbient();
  }
}

function applyVisualThemeMotion(enabled, { persist = false } = {}) {
  const nextEnabled = Boolean(enabled);
  state.visualThemeMotionEnabled = nextEnabled;
  document.documentElement.dataset.themeMotion = nextEnabled ? "on" : "off";
  if (persist) {
    try {
      localStorage.setItem(VISUAL_THEME_MOTION_STORAGE_KEY, nextEnabled ? "on" : "off");
    } catch {
      // Motion preference remains active for this page even when storage is unavailable.
    }
  }
  renderVisualThemePicker();
  window.dispatchEvent(
    new CustomEvent("quizzen:theme-motion-change", { detail: { enabled: nextEnabled } })
  );
}

function renderImmersiveControls() {
  const theme = VISUAL_THEMES[state.visualTheme] || VISUAL_THEMES.mediterranean;
  document.body.classList.toggle("immersive-mode", state.immersiveMode);
  if (els.immersiveModeButton) {
    els.immersiveModeButton.classList.toggle("active", state.immersiveMode);
    els.immersiveModeButton.setAttribute("aria-pressed", String(state.immersiveMode));
    els.immersiveModeButton.setAttribute(
      "aria-label",
      state.immersiveMode ? "没入モードを終了" : "没入モードを開始"
    );
  }
  if (els.immersiveHud) els.immersiveHud.hidden = !state.immersiveMode;
  if (els.immersiveSceneName) els.immersiveSceneName.textContent = theme.label;
  if (els.immersiveSoundToggle) {
    els.immersiveSoundToggle.classList.toggle("active", state.immersiveSoundEnabled);
    els.immersiveSoundToggle.setAttribute("aria-checked", String(state.immersiveSoundEnabled));
  }
  if (els.immersiveVolumeInput) {
    els.immersiveVolumeInput.value = String(state.immersiveVolume);
    els.immersiveVolumeInput.disabled = !state.immersiveSoundEnabled;
  }
}

function showImmersiveSceneIntro() {
  if (!state.immersiveMode || !els.immersiveSceneIntro) return;
  const theme = VISUAL_THEMES[state.visualTheme] || VISUAL_THEMES.mediterranean;
  els.immersiveSceneKicker.textContent = theme.kicker;
  els.immersiveSceneTitle.textContent = theme.label;
  els.immersiveSceneSubtitle.textContent = theme.subtitle;
  els.immersiveSceneIntro.classList.remove("show");
  void els.immersiveSceneIntro.offsetWidth;
  els.immersiveSceneIntro.classList.add("show");
  window.clearTimeout(immersiveSceneIntroTimer);
  immersiveSceneIntroTimer = window.setTimeout(() => {
    els.immersiveSceneIntro?.classList.remove("show");
  }, 1700);
}

function stopImmersiveAmbient() {
  window.clearTimeout(immersiveAmbientTimer);
  immersiveAmbientTimer = null;
  immersiveAmbientNodes.forEach((node) => {
    try {
      if (typeof node.stop === "function") node.stop();
      node.disconnect?.();
    } catch {
      // A source may already have ended.
    }
  });
  immersiveAmbientNodes = [];
  if (immersiveAmbientMaster) {
    try {
      immersiveAmbientMaster.disconnect();
    } catch {
      // The master may already be disconnected.
    }
  }
  immersiveAmbientMaster = null;
}

function createImmersiveNoiseBuffer(context, seconds = 3) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < frameCount; index += 1) {
    const white = Math.random() * 2 - 1;
    last = last * 0.985 + white * 0.015;
    channel[index] = last * 3.2;
  }
  return buffer;
}

function connectImmersiveOscillator(context, frequency, type, level, detune = 0) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  gain.gain.value = level;
  oscillator.connect(gain).connect(immersiveAmbientMaster);
  oscillator.start();
  immersiveAmbientNodes.push(oscillator, gain);
  return { oscillator, gain };
}

function playImmersiveAccent() {
  if (!state.immersiveMode || !state.immersiveSoundEnabled || !immersiveAmbientMaster) return;
  const context = studyAudioContext;
  if (!context) return;
  const startAt = context.currentTime + 0.02;
  const profile = IMMERSIVE_THEME_AUDIO[state.visualTheme] || IMMERSIVE_THEME_AUDIO.mediterranean;
  profile.frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = profile.type;
    oscillator.frequency.setValueAtTime(frequency, startAt + index * 0.16);
    gain.gain.setValueAtTime(0.0001, startAt + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(profile.level, startAt + index * 0.16 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + index * 0.16 + 1.8);
    oscillator.connect(gain).connect(immersiveAmbientMaster);
    oscillator.start(startAt + index * 0.16);
    oscillator.stop(startAt + index * 0.16 + 2);
  });
  immersiveAmbientTimer = window.setTimeout(playImmersiveAccent, profile.delay + Math.random() * 5000);
}

function startImmersiveAmbient() {
  stopImmersiveAmbient();
  if (!state.immersiveMode || !state.immersiveSoundEnabled) return;
  const context = ensureStudyAudioContext();
  if (!context) return;
  immersiveAmbientMaster = context.createGain();
  immersiveAmbientMaster.gain.value = Math.max(0.0001, (state.immersiveVolume / 100) * 0.055);
  immersiveAmbientMaster.connect(context.destination);

  if (["mediterranean", "okinawa"].includes(state.visualTheme)) {
    const source = context.createBufferSource();
    const lowpass = context.createBiquadFilter();
    const swell = context.createGain();
    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();
    source.buffer = createImmersiveNoiseBuffer(context, 4);
    source.loop = true;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 720;
    lowpass.Q.value = 0.55;
    swell.gain.value = 0.42;
    lfo.frequency.value = 0.085;
    lfoDepth.gain.value = 0.18;
    lfo.connect(lfoDepth).connect(swell.gain);
    source.connect(lowpass).connect(swell).connect(immersiveAmbientMaster);
    source.start();
    lfo.start();
    immersiveAmbientNodes.push(source, lowpass, swell, lfo, lfoDepth);
    connectImmersiveOscillator(context, 87.31, "sine", 0.12, -7);
  } else if (state.visualTheme === "event-horizon") {
    const primary = connectImmersiveOscillator(context, 36.71, "sine", 0.34);
    connectImmersiveOscillator(context, 55, "sine", 0.2, -11);
    connectImmersiveOscillator(context, 220, "triangle", 0.018, 5);
    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();
    lfo.frequency.value = 0.035;
    lfoDepth.gain.value = 0.12;
    lfo.connect(lfoDepth).connect(primary.gain.gain);
    lfo.start();
    immersiveAmbientNodes.push(lfo, lfoDepth);
  } else {
    const primary = connectImmersiveOscillator(context, 55, "sine", 0.2);
    connectImmersiveOscillator(context, 82.41, "triangle", 0.065, 3);
    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();
    lfo.frequency.value = 0.055;
    lfoDepth.gain.value = 0.07;
    lfo.connect(lfoDepth).connect(primary.gain.gain);
    lfo.start();
    immersiveAmbientNodes.push(lfo, lfoDepth);
  }
  immersiveAmbientTimer = window.setTimeout(playImmersiveAccent, 2600);
}

function restartImmersiveAmbient() {
  if (state.immersiveMode && state.immersiveSoundEnabled) startImmersiveAmbient();
  else stopImmersiveAmbient();
}

function setImmersiveMode(enabled, { requestFullscreen = false } = {}) {
  const nextEnabled = Boolean(enabled);
  if (state.immersiveMode === nextEnabled) return;
  state.immersiveMode = nextEnabled;
  renderImmersiveControls();
  if (nextEnabled) {
    primeStudyAudio();
    showImmersiveSceneIntro();
    startImmersiveAmbient();
    if (requestFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      immersiveFullscreenRequested = true;
      document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {
        immersiveFullscreenRequested = false;
      });
    }
  } else {
    immersiveFullscreenRequested = false;
    stopImmersiveAmbient();
    els.immersiveSceneIntro?.classList.remove("show");
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }
  window.dispatchEvent(new CustomEvent("quizzen:immersive-change", { detail: { enabled: nextEnabled } }));
  window.setTimeout(scheduleSourceLayoutUpdate, 180);
}

function positionVisualThemePicker() {
  if (!els.themePickerPopover || !els.themePickerToggle) return;
  const triggerRect = els.themePickerToggle.getBoundingClientRect();
  const popoverRect = els.themePickerPopover.getBoundingClientRect();
  const gutter = 10;
  const left = Math.min(
    Math.max(gutter, triggerRect.right - popoverRect.width),
    Math.max(gutter, window.innerWidth - popoverRect.width - gutter)
  );
  let top = triggerRect.bottom + 8;
  if (top + popoverRect.height > window.innerHeight - gutter) {
    top = Math.max(gutter, triggerRect.top - popoverRect.height - 8);
  }
  els.themePickerPopover.style.left = `${Math.round(left)}px`;
  els.themePickerPopover.style.top = `${Math.round(top)}px`;
}

function setVisualThemePickerOpen(open) {
  if (!els.themePickerPopover || !els.themePickerToggle) return;
  els.themePickerPopover.classList.toggle("hidden", !open);
  els.themePickerPopover.hidden = !open;
  els.themePicker.classList.toggle("open", open);
  els.themePickerToggle.setAttribute("aria-expanded", String(open));
  if (open) requestAnimationFrame(positionVisualThemePicker);
}

function loadProgress() {
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return normalizeProgress(JSON.parse(raw));
    } catch {
      continue;
    }
  }
  return {};
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function loadLastAnsweredPosition() {
  try {
    const raw = localStorage.getItem(LAST_ANSWERED_STORAGE_KEY);
    const value = raw ? JSON.parse(raw) : null;
    return normalizeLastAnsweredPosition(value);
  } catch {
    return null;
  }
}

function normalizeLastAnsweredPosition(value) {
  if (!value || typeof value !== "object") return null;
  const courseId = String(value.courseId || "").trim();
  const questionId = String(value.questionId || "").trim();
  if (!courseManifest(courseId) || !questionId) return null;
  return {
    courseId,
    questionId,
    chapterKey: String(value.chapterKey || "").trim(),
    answeredAt: String(value.answeredAt || "").trim(),
  };
}

function saveLastAnsweredPositionPayload(value) {
  const payload = normalizeLastAnsweredPosition(value);
  if (!payload) {
    localStorage.removeItem(LAST_ANSWERED_STORAGE_KEY);
  } else {
    localStorage.setItem(LAST_ANSWERED_STORAGE_KEY, JSON.stringify(payload));
  }
}

function initialCourseId() {
  const saved = loadLastAnsweredPosition()?.courseId;
  return data.courses.find(course => course.id === saved && !course.completed)?.id || data.courses.find(course => !course.completed)?.id || data.courses[0]?.id || DEFAULT_COURSE_ID;
}

function saveLastAnsweredPosition(question, attempt) {
  if (!question?.id) return;
  const payload = {
    courseId: state.courseId,
    chapterKey: activeChapterKey(),
    questionId: question.id,
    answeredAt: attempt?.answeredAt || new Date().toISOString(),
  };
  saveLastAnsweredPositionPayload(payload);
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(values) ? values.filter((value) => typeof value === "string") : []);
  } catch {
    return new Set();
  }
}

function normalizeUnderstandingLevel(value) {
  const normalized = String(value || "").trim();
  if (UNDERSTANDING_LEVEL_SET.has(normalized)) return normalized;
  if (["0", "unknown", "none", "なんもわからん"].includes(normalized)) return "lost";
  if (["confused", "naruhodo", "なるほどわからん"].includes(normalized)) return "confused";
  if (["1", "some", "maybe", "なんとなくわかる", "雰囲気で理解した"].includes(normalized)) return "partial";
  if (["2", "full", "done", "完全に理解した"].includes(normalized)) return "complete";
  if (["3", "skip", "ignore", "worthless", "やる価値なし"].includes(normalized)) return "worthless";
  return null;
}

function normalizeUnderstandingMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([questionId, level]) => [String(questionId || "").trim(), normalizeUnderstandingLevel(level)])
      .filter(([questionId, level]) => questionId && level)
  );
}

function normalizeTimestampMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([questionId, updatedAt]) => [String(questionId || "").trim(), Math.floor(Number(updatedAt) || 0)])
      .filter(([questionId, updatedAt]) => questionId && updatedAt > 0)
  );
}

function loadUnderstandingUpdatedAt() {
  try {
    const raw = localStorage.getItem(UNDERSTANDING_UPDATED_AT_STORAGE_KEY);
    return normalizeTimestampMap(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
}

function saveUnderstandingUpdatedAt() {
  localStorage.setItem(UNDERSTANDING_UPDATED_AT_STORAGE_KEY, JSON.stringify(normalizeTimestampMap(state.understandingUpdatedAt)));
}

function loadUnderstanding() {
  try {
    const raw = localStorage.getItem(UNDERSTANDING_STORAGE_KEY);
    const values = normalizeUnderstandingMap(raw ? JSON.parse(raw) : {});
    if (Object.keys(values).length) return values;

    const legacyFavorites = loadFavorites();
    const migrated = Object.fromEntries([...legacyFavorites].map((questionId) => [questionId, "partial"]));
    if (Object.keys(migrated).length) {
      localStorage.setItem(UNDERSTANDING_STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return {};
  }
}

function saveUnderstanding() {
  localStorage.setItem(UNDERSTANDING_STORAGE_KEY, JSON.stringify(normalizeUnderstandingMap(state.understanding)));
}

function normalizeQuestionFlagMap(value) {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .map((questionId) => String(questionId || "").trim())
        .filter(Boolean)
        .map((questionId) => [questionId, true])
    );
  }
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([questionId, enabled]) => [String(questionId || "").trim(), Boolean(enabled)])
      .filter(([questionId, enabled]) => questionId && enabled)
  );
}

function loadCalculationQuestions() {
  try {
    const raw = localStorage.getItem(CALCULATION_STORAGE_KEY);
    return normalizeQuestionFlagMap(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
}

function loadCalculationQuestionsUpdatedAt() {
  try {
    const raw = localStorage.getItem(CALCULATION_UPDATED_AT_STORAGE_KEY);
    return normalizeTimestampMap(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
}

function saveCalculationQuestionsUpdatedAt() {
  localStorage.setItem(
    CALCULATION_UPDATED_AT_STORAGE_KEY,
    JSON.stringify(normalizeTimestampMap(state.calculationQuestionsUpdatedAt))
  );
}

function saveCalculationQuestions() {
  localStorage.setItem(CALCULATION_STORAGE_KEY, JSON.stringify(normalizeQuestionFlagMap(state.calculationQuestions)));
}

function loadStudyLog() {
  try {
    const raw = localStorage.getItem(STUDY_LOG_STORAGE_KEY);
    return normalizeStudyLog(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function normalizeStudyLog(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map(normalizeStudyLogEntry)
    .filter(Boolean)
    .slice(-STUDY_LOG_LIMIT);
}

function normalizeStudyLogEntry(value) {
  const startAt = Number(value?.startAt);
  const endAt = Number(value?.endAt);
  const durationMs = Math.max(0, Math.floor(Number(value?.durationMs) || endAt - startAt || 0));
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt || durationMs <= 0) return null;
  const context = normalizeStudyContext(value);
  return {
    startAt,
    endAt,
    durationMs,
    day: localDayKey(startAt),
    ...context,
  };
}

function saveStudyLog() {
  localStorage.setItem(STUDY_LOG_STORAGE_KEY, JSON.stringify(state.studyLog.slice(-STUDY_LOG_LIMIT)));
}

function loadStudyReportMode() {
  try {
    const value = localStorage.getItem(STUDY_REPORT_MODE_STORAGE_KEY);
    return STUDY_REPORT_MODES.has(value) ? value : "day";
  } catch {
    return "day";
  }
}

function saveStudyReportMode(value) {
  state.studyReportMode = STUDY_REPORT_MODES.has(value) ? value : "day";
  localStorage.setItem(STUDY_REPORT_MODE_STORAGE_KEY, state.studyReportMode);
}

function reviewSelectableCourseIds() {
  return data.courses
    .filter((courseItem) => !REVIEW_TARGET_EXCLUDED_COURSE_IDS.has(courseItem.id))
    .map((courseItem) => courseItem.id);
}

function defaultReviewTargetCourseIds() {
  return reviewSelectableCourseIds();
}

function normalizeReviewTargetCourseIds(values, { fallbackToDefault = false } = {}) {
  const selectable = new Set(reviewSelectableCourseIds());
  const selected = Array.isArray(values)
    ? values.filter((courseId, index, array) => {
        return selectable.has(courseId) && array.indexOf(courseId) === index;
      })
    : [];
  return selected.length || !fallbackToDefault ? selected : defaultReviewTargetCourseIds();
}

function loadReviewTargetCourseIds() {
  try {
    const raw = localStorage.getItem(REVIEW_TARGET_COURSES_STORAGE_KEY);
    if (!raw) return defaultReviewTargetCourseIds();
    return normalizeReviewTargetCourseIds(JSON.parse(raw), { fallbackToDefault: false });
  } catch {
    return defaultReviewTargetCourseIds();
  }
}

function saveReviewTargetCourseIds() {
  state.reviewTargetCourseIds = normalizeReviewTargetCourseIds(state.reviewTargetCourseIds);
  localStorage.setItem(REVIEW_TARGET_COURSES_STORAGE_KEY, JSON.stringify(state.reviewTargetCourseIds));
}

function normalizeReviewSession(value) {
  const mode = REVIEW_SESSION_MODES.includes(value?.mode) ? value.mode : "smart";
  const size = REVIEW_SESSION_SIZES.includes(Number(value?.size)) ? Number(value.size) : 10;
  const excludeCalculation = Boolean(
    value?.excludeCalculation ||
      value?.excludeCalculationQuestions ||
      value?.exclude_calculation ||
      value?.nonCalculationOnly
  );
  return { mode, size, excludeCalculation };
}

function loadReviewSession() {
  try {
    const raw = localStorage.getItem(REVIEW_SESSION_STORAGE_KEY);
    return normalizeReviewSession(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeReviewSession(null);
  }
}

function saveReviewSession(value) {
  state.reviewSession = normalizeReviewSession(value);
  localStorage.setItem(REVIEW_SESSION_STORAGE_KEY, JSON.stringify(state.reviewSession));
}

function normalizeQuestionIdList(value, limit = 80) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\s,]+/) : [];
  const seen = new Set();
  const ids = [];
  source.forEach((item) => {
    const id = String(item || "").trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });
  return ids.slice(0, limit);
}

function normalizeReviewSessionHistoryEntry(value) {
  if (!value || typeof value !== "object") return null;
  const startedAt = Number(value.startedAt);
  const completedAt = Number(value.completedAt);
  const total = Math.max(0, Math.floor(Number(value.total) || 0));
  if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt) || !total) return null;
  const correct = Math.max(0, Math.min(total, Math.floor(Number(value.correct) || 0)));
  const wrong = Math.max(0, Math.min(total, Math.floor(Number(value.wrong) || total - correct)));
  const mode = normalizeReviewSession({ mode: value.mode, size: value.size }).mode;
  const id = String(value.id || `${value.courseId || "course"}:${startedAt}:${total}`).trim();
  if (!id) return null;
  const questionIds = normalizeQuestionIdList(value.questionIds || value.question_ids || value.questions, 120);
  const wrongQuestionIds = normalizeQuestionIdList(
    value.wrongQuestionIds || value.wrong_question_ids || value.missedQuestionIds || value.missed_question_ids,
    120
  ).filter((questionId) => !questionIds.length || questionIds.includes(questionId));
  return {
    id,
    courseId: String(value.courseId || "").trim(),
    courseName: String(value.courseName || "復習セッション").trim().slice(0, 48),
    title: String(value.title || "").trim().slice(0, 64),
    mode,
    total,
    correct,
    wrong,
    accuracyPercent: total ? Math.round((correct / total) * 100) : 0,
    retentionAverage: Number.isFinite(Number(value.retentionAverage)) ? Math.round(Number(value.retentionAverage)) : null,
    startedAt,
    completedAt,
    durationMs: Math.max(0, Math.floor(Number(value.durationMs) || completedAt - startedAt || 0)),
    questionIds,
    wrongQuestionIds,
  };
}

function normalizeReviewSessionHistory(values) {
  if (!Array.isArray(values)) return [];
  const entriesById = new Map();
  values
    .map(normalizeReviewSessionHistoryEntry)
    .filter(Boolean)
    .forEach((entry) => {
      const current = entriesById.get(entry.id);
      if (!current || entry.completedAt >= current.completedAt) entriesById.set(entry.id, entry);
    });
  return [...entriesById.values()]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, REVIEW_SESSION_HISTORY_LIMIT);
}

function loadReviewSessionHistory() {
  try {
    const raw = localStorage.getItem(REVIEW_SESSION_HISTORY_STORAGE_KEY);
    return normalizeReviewSessionHistory(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function saveReviewSessionHistory() {
  state.reviewSessionHistory = normalizeReviewSessionHistory(state.reviewSessionHistory);
  localStorage.setItem(REVIEW_SESSION_HISTORY_STORAGE_KEY, JSON.stringify(state.reviewSessionHistory));
}

function mergeReviewSessionHistory(existingEntries, incomingEntries) {
  return normalizeReviewSessionHistory([...normalizeReviewSessionHistory(existingEntries), ...normalizeReviewSessionHistory(incomingEntries)]);
}

function isReviewTargetCourseSelected(courseId) {
  return (
    !REVIEW_TARGET_EXCLUDED_COURSE_IDS.has(courseId) &&
    normalizeReviewTargetCourseIds(state.reviewTargetCourseIds).includes(courseId)
  );
}

function reviewTargetCourseManifests() {
  const selectedIds = new Set(normalizeReviewTargetCourseIds(state.reviewTargetCourseIds));
  return data.courses.filter((manifest) => selectedIds.has(manifest.id));
}

function loadStopwatch() {
  try {
    const raw = localStorage.getItem(STOPWATCH_STORAGE_KEY);
    return normalizeStopwatch(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeStopwatch(null);
  }
}

function normalizeStopwatch(value) {
  const accumulatedMs = Math.max(0, Math.floor(Number(value?.accumulatedMs) || 0));
  const startedAt = Number(value?.startedAt);
  const now = Date.now();
  return {
    accumulatedMs,
    startedAt: Number.isFinite(startedAt) && startedAt > 0 && startedAt < now + 60000 ? startedAt : null,
    activeContext: normalizeStudyContext(value?.activeContext),
    pomodoro: normalizePomodoro(value?.pomodoro),
    activityCheck: normalizeActivityCheck(value?.activityCheck),
  };
}

function defaultActivityCheckState(nextAt = null) {
  return {
    nextAt,
    promptedAt: null,
    deadlineAt: null,
  };
}

function normalizeActivityCheck(value) {
  if (!value || typeof value !== "object") return defaultActivityCheckState(null);
  const nextAt = Number(value.nextAt);
  const promptedAt = Number(value.promptedAt);
  const deadlineAt = Number(value.deadlineAt);
  return {
    nextAt: Number.isFinite(nextAt) && nextAt > 0 ? nextAt : null,
    promptedAt: Number.isFinite(promptedAt) && promptedAt > 0 ? promptedAt : null,
    deadlineAt: Number.isFinite(deadlineAt) && deadlineAt > 0 ? deadlineAt : null,
  };
}

function normalizePomodoroPresetId(value) {
  return POMODORO_PRESETS[value] ? value : POMODORO_DEFAULT_PRESET_ID;
}

function pomodoroPreset(presetId = POMODORO_DEFAULT_PRESET_ID) {
  return POMODORO_PRESETS[normalizePomodoroPresetId(presetId)];
}

function currentPomodoroPresetId() {
  return normalizePomodoroPresetId(state?.stopwatch?.pomodoro?.presetId);
}

function defaultPomodoroState(enabled = false, presetId = POMODORO_DEFAULT_PRESET_ID) {
  const normalizedPresetId = normalizePomodoroPresetId(presetId);
  return {
    enabled,
    presetId: normalizedPresetId,
    phase: "focus",
    remainingMs: pomodoroPhaseDuration("focus", normalizedPresetId),
    startedAt: null,
    completedFocus: 0,
  };
}

function normalizePomodoro(value) {
  if (!value || typeof value !== "object") return defaultPomodoroState(false);
  const enabled = value.enabled === true;
  const presetId = normalizePomodoroPresetId(value.presetId);
  const phase = ["focus", "shortBreak", "longBreak"].includes(value.phase) ? value.phase : "focus";
  const phaseDuration = pomodoroPhaseDuration(phase, presetId);
  const remainingMs = Math.max(0, Math.min(phaseDuration, Math.floor(Number(value.remainingMs) || phaseDuration)));
  const startedAt = Number(value.startedAt);
  const now = Date.now();
  return {
    enabled,
    presetId,
    phase,
    remainingMs: remainingMs || phaseDuration,
    startedAt: enabled && Number.isFinite(startedAt) && startedAt > 0 && startedAt < now + 60000 ? startedAt : null,
    completedFocus: Math.max(0, Math.floor(Number(value.completedFocus) || 0)),
  };
}

function pomodoroPhaseDuration(phase, presetId = currentPomodoroPresetId()) {
  const preset = pomodoroPreset(presetId);
  if (phase === "longBreak") return preset.longBreakMs;
  if (phase === "shortBreak") return preset.shortBreakMs;
  return preset.focusMs;
}

function pomodoroSetPosition(pomodoro = pomodoroState()) {
  const preset = pomodoroPreset(pomodoro.presetId);
  const rawSet = pomodoro.phase === "focus" ? pomodoro.completedFocus + 1 : Math.max(1, pomodoro.completedFocus);
  return ((rawSet - 1) % preset.longBreakEvery) + 1;
}

function pomodoroState() {
  const current = state.stopwatch.pomodoro;
  const normalized = normalizePomodoro(current);
  if (current && typeof current === "object") {
    Object.assign(current, normalized);
    state.stopwatch.pomodoro = current;
  } else {
    state.stopwatch.pomodoro = normalized;
  }
  return state.stopwatch.pomodoro;
}

function pomodoroEnabled() {
  return pomodoroState().enabled === true;
}

function pomodoroRunning() {
  const pomodoro = pomodoroState();
  return pomodoro.enabled && Number.isFinite(Number(pomodoro.startedAt)) && Number(pomodoro.startedAt) > 0;
}

function pomodoroRemainingMs() {
  const pomodoro = pomodoroState();
  const base = Math.max(0, Number(pomodoro.remainingMs) || pomodoroPhaseDuration(pomodoro.phase));
  if (!pomodoroRunning()) return base;
  return Math.max(0, base - Math.max(0, Date.now() - Number(pomodoro.startedAt)));
}

function saveStopwatch() {
  localStorage.setItem(STOPWATCH_STORAGE_KEY, JSON.stringify(state.stopwatch));
}

function stopwatchElapsedMs() {
  const base = Math.max(0, Number(state.stopwatch?.accumulatedMs) || 0);
  const startedAt = Number(state.stopwatch?.startedAt);
  return Number.isFinite(startedAt) && startedAt > 0 ? base + Math.max(0, Date.now() - startedAt) : base;
}

function stopwatchRunning() {
  return Number.isFinite(Number(state.stopwatch?.startedAt)) && Number(state.stopwatch.startedAt) > 0;
}

function activityCheckState() {
  state.stopwatch.activityCheck = normalizeActivityCheck(state.stopwatch.activityCheck);
  return state.stopwatch.activityCheck;
}

function ensureStudyAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    if (!studyAudioContext) studyAudioContext = new AudioContextClass();
    if (studyAudioContext.state === "suspended") {
      studyAudioContext.resume().catch(() => {});
    }
  } catch {
    return null;
  }
  return studyAudioContext;
}

function primeStudyAudio() {
  ensureStudyAudioContext();
}

function playStudyActivityBeep() {
  const context = ensureStudyAudioContext();
  if (!context) return;
  const startAt = context.currentTime + 0.02;
  [880, 660, 880].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt + index * 0.16);
    gain.gain.setValueAtTime(0.0001, startAt + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.18, startAt + index * 0.16 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + index * 0.16 + 0.12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startAt + index * 0.16);
    oscillator.stop(startAt + index * 0.16 + 0.14);
  });
}

function playPomodoroChime(phase) {
  const context = ensureStudyAudioContext();
  if (!context) return;
  const startAt = context.currentTime + 0.02;
  const frequencies = phase === "focus" ? [523.25, 659.25, 783.99, 1046.5] : [880, 739.99, 659.25, 523.25];
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = phase === "focus" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt + index * 0.18);
    gain.gain.setValueAtTime(0.0001, startAt + index * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.2, startAt + index * 0.18 + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + index * 0.18 + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startAt + index * 0.18);
    oscillator.stop(startAt + index * 0.18 + 0.18);
  });
}

function pomodoroMinutes(value) {
  return Math.round(Number(value || 0) / MINUTE_MS);
}

function pomodoroNoticeText(phase) {
  const preset = pomodoroPreset(currentPomodoroPresetId());
  const setLabel = `${pomodoroSetPosition()}/${preset.longBreakEvery}セット`;
  if (phase === "longBreak") {
    return {
      title: "長休憩",
      body: `${setLabel}達成。${pomodoroMinutes(preset.longBreakMs)}分しっかり休んで戻ろう。`,
    };
  }
  if (phase === "shortBreak") {
    return {
      title: "休憩",
      body: `${setLabel}完了。${pomodoroMinutes(preset.shortBreakMs)}分休憩。目と肩をゆるめよう。`,
    };
  }
  return {
    title: "集中開始",
    body: `${setLabel}目。クリックで${pomodoroMinutes(preset.focusMs)}分スタート。`,
  };
}

function showPomodoroNotice(phase) {
  if (!els.pomodoroNotice) return;
  const text = pomodoroNoticeText(phase);
  els.pomodoroNoticeTitle.textContent = text.title;
  els.pomodoroNoticeBody.textContent = text.body;
  els.pomodoroNotice.dataset.phase = phase;
  els.pomodoroNotice.classList.remove("hidden", "show");
  void els.pomodoroNotice.offsetWidth;
  els.pomodoroNotice.classList.add("show");
}

function hidePomodoroNotice() {
  if (!els.pomodoroNotice) return;
  els.pomodoroNotice.classList.remove("show");
  els.pomodoroNotice.classList.add("hidden");
}

function blockPomodoroNoticeEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

function handlePomodoroNoticeCardClick(event) {
  const noticePhase = els.pomodoroNotice?.dataset.phase;
  blockPomodoroNoticeEvent(event);
  hidePomodoroNotice();
  const pomodoro = pomodoroState();
  if (noticePhase === "focus" && pomodoro.enabled && pomodoro.phase === "focus" && !pomodoroRunning()) {
    startPomodoroTimer();
  }
}

function announcePomodoroPhase(phase) {
  playPomodoroChime(phase);
  showPomodoroNotice(phase);
}

function startStudyActivitySound() {
  if (studyActivitySoundHandle) return;
  playStudyActivityBeep();
  studyActivitySoundHandle = window.setInterval(playStudyActivityBeep, STUDY_ACTIVITY_SOUND_REPEAT_MS);
}

function stopStudyActivitySound() {
  window.clearInterval(studyActivitySoundHandle);
  studyActivitySoundHandle = null;
}

function armStudyActivityCheck(now = Date.now()) {
  lastStudyScreenActivityAt = now;
  const check = activityCheckState();
  check.nextAt = now + STUDY_ACTIVITY_CHECK_INTERVAL_MS;
  check.promptedAt = null;
  check.deadlineAt = null;
}

function recordStudyScreenActivity(now = Date.now(), persist = false) {
  lastStudyScreenActivityAt = now;
  if (!stopwatchRunning() || state.studyActivityStoppedNotice) return;
  const check = activityCheckState();
  if (check.deadlineAt) return;
  check.nextAt = now + STUDY_ACTIVITY_CHECK_INTERVAL_MS;
  check.promptedAt = null;
  check.deadlineAt = null;
  if (persist || now - lastStudyActivityCheckSaveAt >= STUDY_ACTIVITY_SAVE_THROTTLE_MS) {
    lastStudyActivityCheckSaveAt = now;
    saveStopwatch();
  }
  renderStudyActivityCheck(now);
}

function handleStudyScreenActivity() {
  recordStudyScreenActivity();
}

function handleStudyPointerActivity() {
  primeStudyAudio();
  recordStudyScreenActivity();
}

function handleStudyKeyboardActivity(event) {
  primeStudyAudio();
  recordStudyScreenActivity();
  if (event.key === "Escape") closeImagePreview();
}

function clearStudyActivityCheck() {
  state.studyActivityStoppedNotice = false;
  state.stopwatch.activityCheck = defaultActivityCheckState(null);
  stopStudyActivitySound();
  renderStudyActivityCheck();
}

function renderStudyActivityCheck(now = Date.now()) {
  if (!els.studyActivityCheck) return;
  const check = activityCheckState();
  if (state.studyActivityStoppedNotice) {
    els.studyActivityCheck.classList.remove("hidden", "warning");
    els.studyActivityCheck.classList.add("stopped");
    if (els.studyActivityCountdown) els.studyActivityCountdown.textContent = "停止済み";
    if (els.studyActivityMessage) {
      els.studyActivityMessage.textContent = "3分間操作がなく、確認にも30秒反応がなかったので、勉強時間の記録を止めました。";
    }
    if (els.studyActivityConfirm) els.studyActivityConfirm.textContent = "OK";
    return;
  }
  if (!check.deadlineAt) {
    els.studyActivityCheck.classList.add("hidden");
    els.studyActivityCheck.classList.remove("warning", "stopped");
    return;
  }
  const remainingSeconds = Math.max(0, Math.ceil((check.deadlineAt - now) / 1000));
  els.studyActivityCheck.classList.remove("hidden", "stopped");
  els.studyActivityCheck.classList.toggle("warning", remainingSeconds <= 10);
  if (els.studyActivityCountdown) els.studyActivityCountdown.textContent = `${remainingSeconds}秒`;
  if (els.studyActivityMessage) {
    els.studyActivityMessage.textContent = "3分間画面操作がありません。まだ勉強中なら押して継続。";
  }
  if (els.studyActivityConfirm) els.studyActivityConfirm.textContent = "続ける";
}

function promptStudyActivityCheck(now = Date.now()) {
  const check = activityCheckState();
  check.nextAt = null;
  check.promptedAt = now;
  check.deadlineAt = now + STUDY_ACTIVITY_RESPONSE_MS;
  saveStopwatch();
  startStudyActivitySound();
  renderStudyActivityCheck(now);
  els.studyActivityConfirm?.focus();
}

function confirmStudyActivityCheck() {
  stopStudyActivitySound();
  state.studyActivityStoppedNotice = false;
  if (stopwatchRunning()) {
    armStudyActivityCheck(Date.now());
    saveStopwatch();
  } else {
    clearStudyActivityCheck();
    saveStopwatch();
  }
  renderStudyTime();
}

function stopStudyActivityDueToInactivity() {
  stopStudyActivitySound();
  state.studyActivityStoppedNotice = true;
  const pomodoro = pomodoroState();
  if (pomodoro.enabled && pomodoro.phase === "focus" && pomodoroRunning()) {
    pomodoro.remainingMs = pomodoroRemainingMs() || pomodoroPhaseDuration(pomodoro.phase);
    pomodoro.startedAt = null;
  }
  if (stopwatchRunning()) {
    commitRunningStudyTime({ stop: true });
    state.stopwatch.startedAt = null;
    state.stopwatch.activeContext = null;
  }
  state.stopwatch.activityCheck = defaultActivityCheckState(null);
  saveStopwatch();
  renderStudyTime();
}

function tickStudyActivityCheck(now = Date.now()) {
  const check = activityCheckState();
  if (!stopwatchRunning()) {
    if (check.nextAt || check.deadlineAt) {
      clearStudyActivityCheck();
      saveStopwatch();
    } else {
      renderStudyActivityCheck(now);
    }
    return;
  }
  if (check.deadlineAt) {
    if (now >= check.deadlineAt) {
      stopStudyActivityDueToInactivity();
      return;
    }
    startStudyActivitySound();
    renderStudyActivityCheck(now);
    return;
  }
  if (!check.nextAt) {
    const startedAt = Number(state.stopwatch.startedAt) || now;
    check.nextAt = Math.max(startedAt, lastStudyScreenActivityAt || startedAt) + STUDY_ACTIVITY_CHECK_INTERVAL_MS;
    saveStopwatch();
  }
  if (now >= check.nextAt) {
    promptStudyActivityCheck(now);
  } else {
    renderStudyActivityCheck(now);
  }
}

function startStopwatch() {
  primeStudyAudio();
  if (pomodoroEnabled()) {
    startPomodoroTimer();
    return;
  }
  if (stopwatchRunning()) return;
  const now = Date.now();
  state.stopwatch.startedAt = now;
  state.stopwatch.activeContext = currentStudyContext();
  armStudyActivityCheck(now);
  saveStopwatch();
  renderStudyTime();
}

function pauseStopwatch() {
  if (pomodoroEnabled()) {
    pausePomodoroTimer();
    return;
  }
  if (!stopwatchRunning()) return;
  commitRunningStudyTime({ stop: true });
  state.stopwatch.startedAt = null;
  state.stopwatch.activeContext = null;
  clearStudyActivityCheck();
  saveStopwatch();
  renderStudyTime();
}

function resetStopwatch() {
  if (stopwatchRunning()) commitRunningStudyTime({ stop: true });
  state.stopwatch = {
    accumulatedMs: 0,
    startedAt: null,
    activeContext: null,
    pomodoro: defaultPomodoroState(pomodoroEnabled(), currentPomodoroPresetId()),
    activityCheck: defaultActivityCheckState(null),
  };
  clearStudyActivityCheck();
  saveStopwatch();
  renderStudyTime();
}

function toggleStopwatch() {
  primeStudyAudio();
  if (pomodoroEnabled()) {
    togglePomodoroTimer();
  } else if (stopwatchRunning()) {
    pauseStopwatch();
  } else {
    startStopwatch();
  }
}

function startFocusStopwatch(now = Date.now()) {
  if (stopwatchRunning()) return;
  state.stopwatch.startedAt = now;
  state.stopwatch.activeContext = currentStudyContext();
  armStudyActivityCheck(now);
}

function stopFocusStopwatch() {
  if (!stopwatchRunning()) return;
  commitRunningStudyTime({ stop: true });
  state.stopwatch.startedAt = null;
  state.stopwatch.activeContext = null;
  clearStudyActivityCheck();
}

function startPomodoroTimer() {
  const pomodoro = pomodoroState();
  if (!pomodoro.enabled || pomodoroRunning()) return;
  const now = Date.now();
  pomodoro.startedAt = now;
  if (pomodoro.phase === "focus") {
    startFocusStopwatch(now);
  } else {
    stopFocusStopwatch();
  }
  saveStopwatch();
  renderStudyTime();
}

function pausePomodoroTimer({ render = true } = {}) {
  const pomodoro = pomodoroState();
  if (!pomodoro.enabled || !pomodoroRunning()) return;
  pomodoro.remainingMs = pomodoroRemainingMs() || pomodoroPhaseDuration(pomodoro.phase);
  pomodoro.startedAt = null;
  if (pomodoro.phase === "focus") stopFocusStopwatch();
  saveStopwatch();
  if (render) renderStudyTime();
}

function togglePomodoroTimer() {
  if (pomodoroRunning()) {
    pausePomodoroTimer();
  } else {
    startPomodoroTimer();
  }
}

function togglePomodoroEnabled() {
  const enabled = !pomodoroEnabled();
  if (stopwatchRunning()) stopFocusStopwatch();
  state.stopwatch.pomodoro = defaultPomodoroState(enabled, currentPomodoroPresetId());
  saveStopwatch();
  renderStudyTime();
}

function changePomodoroPreset(presetId) {
  const nextPresetId = normalizePomodoroPresetId(presetId);
  const pomodoro = pomodoroState();
  if (pomodoro.presetId === nextPresetId) {
    renderPomodoro();
    return;
  }
  const wasRunning = pomodoroRunning();
  pomodoro.presetId = nextPresetId;
  pomodoro.remainingMs = pomodoroPhaseDuration(pomodoro.phase, nextPresetId);
  pomodoro.startedAt = wasRunning ? Date.now() : null;
  if (wasRunning && pomodoro.phase !== "focus") {
    state.stopwatch.startedAt = null;
    state.stopwatch.activeContext = null;
  }
  saveStopwatch();
  renderStudyTime();
}

function advancePomodoroPhase({ autoStart = false, render = true } = {}) {
  const pomodoro = pomodoroState();
  if (!pomodoro.enabled) return;
  const now = Date.now();
  const previousPhase = pomodoro.phase;
  if (pomodoro.phase === "focus") {
    stopFocusStopwatch();
    pomodoro.completedFocus += 1;
    pomodoro.phase =
      pomodoro.completedFocus % pomodoroPreset(pomodoro.presetId).longBreakEvery === 0 ? "longBreak" : "shortBreak";
  } else {
    pomodoro.phase = "focus";
  }
  pomodoro.remainingMs = pomodoroPhaseDuration(pomodoro.phase);
  pomodoro.startedAt = autoStart ? now : null;
  if (autoStart && pomodoro.phase === "focus") {
    startFocusStopwatch(now);
  }
  if (autoStart && pomodoro.phase !== "focus") {
    state.stopwatch.startedAt = null;
    state.stopwatch.activeContext = null;
  }
  saveStopwatch();
  if (pomodoro.phase !== previousPhase) announcePomodoroPhase(pomodoro.phase);
  if (render) renderStudyTime();
}

function tickPomodoro() {
  if (!pomodoroRunning()) return;
  if (pomodoroRemainingMs() > 0) return;
  const pomodoro = pomodoroState();
  advancePomodoroPhase({ autoStart: pomodoro.phase === "focus", render: false });
}

function skipPomodoroPhase() {
  if (!pomodoroEnabled()) return;
  advancePomodoroPhase({ autoStart: pomodoroRunning() });
}

function formatStopwatch(value) {
  const totalSeconds = Math.floor(Math.max(0, value) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatPomodoroClock(value) {
  const totalSeconds = Math.max(0, Math.ceil(Number(value || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatStudyDuration(value) {
  const totalSeconds = Math.max(0, Math.round(Number(value || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}時間${String(minutes).padStart(2, "0")}分`;
  if (minutes) return `${minutes}分${String(seconds).padStart(2, "0")}秒`;
  return `${seconds}秒`;
}

function currentStudyContext() {
  const activeCourse = course();
  const manifest = courseManifest(state.courseId);
  const activeChapter = activeCourse?.chapters?.length ? chapter() : null;
  const courseName = activeCourse?.name || manifest?.name || state.courseId || "未選択";
  const chapterTitle = activeChapter?.title || "未選択";
  const chapterKey = activeChapterKey();
  const subjectName = studyChapterSubjectLabel(activeChapter, activeCourse);
  return normalizeStudyContext({
    courseId: state.courseId,
    courseName,
    chapterKey,
    chapterTitle,
    chapterNumber: activeChapter?.number || "",
    chapterLabel: activeChapter?.virtualLabel || "",
    subjectName,
  });
}

function normalizeStudyContext(value) {
  if (!value || typeof value !== "object") return null;
  const courseId = String(value.courseId || "").trim();
  const courseName = String(value.courseName || courseId || "未選択").trim();
  const chapterKey = String(value.chapterKey || "").trim();
  const chapterTitle = String(value.chapterTitle || "未選択").trim();
  return {
    courseId,
    courseName,
    chapterKey,
    chapterTitle,
    chapterNumber: String(value.chapterNumber || "").trim(),
    chapterLabel: String(value.chapterLabel || "").trim(),
    subjectName: String(value.subjectName || value.subject || "").trim(),
  };
}

function studyContextLabel(context) {
  if (!context) return "未選択";
  return [context.courseName, context.subjectName, context.chapterTitle]
    .filter(Boolean)
    .filter((part, index, values) => values.indexOf(part) === index)
    .join(" / ");
}

function commitRunningStudyTime({ stop = false } = {}) {
  if (!stopwatchRunning()) return false;
  const startedAt = Number(state.stopwatch.startedAt);
  const endAt = Date.now();
  const durationMs = Math.max(0, endAt - startedAt);
  const context = normalizeStudyContext(state.stopwatch.activeContext) || currentStudyContext();
  let appended = false;
  if (durationMs > 0) {
    state.studyLog.push(...splitStudySegment(startedAt, endAt, context));
    state.studyLog = state.studyLog.slice(-STUDY_LOG_LIMIT);
    state.stopwatch.accumulatedMs = Math.max(0, Number(state.stopwatch.accumulatedMs) || 0) + durationMs;
    appended = true;
  }
  state.stopwatch.startedAt = stop ? null : endAt;
  state.stopwatch.activeContext = stop ? null : context;
  if (appended) saveStudyLog();
  saveStopwatch();
  return appended;
}

function checkpointStudyTimeForContextChange() {
  if (!stopwatchRunning()) return;
  commitRunningStudyTime();
}

function refreshRunningStudyContext() {
  if (!stopwatchRunning()) return;
  state.stopwatch.activeContext = currentStudyContext();
  saveStopwatch();
  renderStudyTime();
}

function splitStudySegment(startAt, endAt, context) {
  const entries = [];
  let cursor = startAt;
  while (cursor < endAt) {
    const nextBoundary = Math.min(endAt, nextLocalDayStart(cursor));
    entries.push({
      startAt: cursor,
      endAt: nextBoundary,
      durationMs: nextBoundary - cursor,
      day: localDayKey(cursor),
      ...context,
    });
    cursor = nextBoundary;
  }
  return entries;
}

function localDayKey(value = Date.now()) {
  const date = new Date(value);
  date.setHours(date.getHours() - STUDY_BUSINESS_DAY_START_HOUR);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nextLocalDayStart(value) {
  const date = new Date(value);
  const boundary = new Date(date);
  boundary.setHours(STUDY_BUSINESS_DAY_START_HOUR, 0, 0, 0);
  if (date.getTime() >= boundary.getTime()) {
    boundary.setDate(boundary.getDate() + 1);
  }
  return boundary.getTime();
}

function formatStudyDay(dayKey) {
  const [year, month, day] = String(dayKey || "").split("-").map(Number);
  if (!year || !month || !day) return dayKey || "";
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}

function studyLogWithLiveEntries() {
  const entries = [...state.studyLog];
  if (stopwatchRunning()) {
    const startedAt = Number(state.stopwatch.startedAt);
    const context = normalizeStudyContext(state.stopwatch.activeContext) || currentStudyContext();
    entries.push(...splitStudySegment(startedAt, Date.now(), context));
  }
  return entries.filter((entry) => entry.durationMs > 0);
}

function sumStudyDuration(entries) {
  return entries.reduce((sum, entry) => sum + Number(entry.durationMs || 0), 0);
}

function groupedStudyReport(entries, mode) {
  const groups = new Map();
  entries.forEach((entry) => {
    const key = studyReportGroupKey(entry, mode);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: studyReportGroupLabel(entry, mode),
        detail: studyReportGroupDetail(entry, mode),
        durationMs: 0,
        sortKey: studyReportSortKey(entry, mode),
      });
    }
    groups.get(key).durationMs += entry.durationMs;
  });

  const values = [...groups.values()];
  if (mode === "day") {
    values.sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)));
  } else {
    values.sort((a, b) => b.durationMs - a.durationMs || String(a.label).localeCompare(String(b.label), "ja"));
  }
  return values.slice(0, STUDY_REPORT_LIMITS[mode] || 7);
}

function studyChapterKey(courseId, chapterItem, index = 0) {
  return chapterItem?.virtualKey || `${courseId}:chapter:${chapterItem?.id || chapterItem?.number || index || 0}`;
}

function activeChapterKey() {
  return studyChapterKey(state.courseId, chapter(), state.chapterIndex);
}

function courseChapterEntries(courseItem) {
  if (!courseItem?.chapters?.length) return [];
  const byKey = new Map();
  const addEntry = (entry) => {
    if (!entry?.chapterItem) return;
    const key = studyChapterKey(courseItem.id, entry.chapterItem, entry.index);
    if (!byKey.has(key)) byKey.set(key, entry);
  };
  categoryGroupsForCourse(courseItem).flatMap((category) => category.chapters).forEach(addEntry);
  courseItem.chapters.forEach((chapterItem, index) => addEntry({ chapterItem, index }));
  return [...byKey.values()];
}

function questionIndexInChapter(chapterItem, questionId) {
  return chapterQuestionSet(chapterItem).findIndex((question) => question.id === questionId);
}

function findQuestionPosition(courseId, position) {
  const courseItem = courseDataStore[courseId];
  if (!courseItem?.chapters?.length || !position?.questionId) return null;
  const entries = courseChapterEntries(courseItem);
  const preferredEntry = position.chapterKey
    ? entries.find((entry) => studyChapterKey(courseId, entry.chapterItem, entry.index) === position.chapterKey)
    : null;
  const searchEntries = preferredEntry ? [preferredEntry, ...entries.filter((entry) => entry !== preferredEntry)] : entries;
  for (const entry of searchEntries) {
    const questionIndex = questionIndexInChapter(entry.chapterItem, position.questionId);
    if (questionIndex >= 0) return { entry, questionIndex };
  }
  return null;
}

function latestAnsweredPositionForCourse(courseId = state.courseId) {
  const courseItem = courseDataStore[courseId];
  if (!courseItem?.chapters?.length) return null;
  let latest = null;
  courseChapterEntries(courseItem).forEach((entry) => {
    chapterQuestionSet(entry.chapterItem).forEach((question) => {
      const attempt = lastAttempt(progressFor(question.id));
      const time = Date.parse(attempt?.answeredAt || "");
      if (!Number.isFinite(time)) return;
      if (latest && time <= latest.time) return;
      latest = {
        time,
        courseId,
        questionId: question.id,
        chapterKey: studyChapterKey(courseId, entry.chapterItem, entry.index),
        answeredAt: attempt.answeredAt,
      };
    });
  });
  return latest;
}

function applyChapterEntryPosition(entry, questionIndex) {
  if (!entry?.chapterItem) return false;
  if (entry.chapterItem.virtualKey) {
    state.virtualChapterKey = entry.chapterItem.virtualKey;
    state.virtualChapter = entry.chapterItem;
    state.chapterIndex = Number.isInteger(entry.index) && entry.index >= 0 ? entry.index : 0;
  } else {
    state.virtualChapterKey = null;
    state.virtualChapter = null;
    state.chapterIndex = Number.isInteger(entry.index) && entry.index >= 0 ? entry.index : 0;
  }
  state.questionIndex = Math.max(0, Number(questionIndex) || 0);
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  setRetakeForSelectedQuestion();
  return true;
}

function restoreLastAnsweredPosition() {
  const stored = loadLastAnsweredPosition();
  const position = stored?.courseId === state.courseId ? stored : latestAnsweredPositionForCourse(state.courseId);
  if (!position) return false;
  const match = findQuestionPosition(state.courseId, position);
  if (!match) return false;
  return applyChapterEntryPosition(match.entry, match.questionIndex);
}

function studyChapterEntryFor(entry) {
  const courseItem = courseDataStore[entry.courseId];
  if (!courseItem?.chapters?.length) return null;
  const key = entry.chapterKey || "";
  const categoryEntry = categoryGroupsForCourse(courseItem)
    .flatMap((category) => category.chapters)
    .find(({ chapterItem }) => studyChapterKey(entry.courseId, chapterItem) === key);
  if (categoryEntry) return categoryEntry;
  const realIndex = courseItem.chapters.findIndex(
    (chapterItem, index) => studyChapterKey(entry.courseId, chapterItem, index) === key
  );
  return realIndex >= 0 ? { chapterItem: courseItem.chapters[realIndex], index: realIndex } : null;
}

function courseCategoryLabel(courseItem, categoryId) {
  const category = courseItem?.chapterCategories?.find((item) => item.id === categoryId);
  return category?.label || "";
}

function uniqueQuestionValues(chapterItem, key) {
  return [
    ...new Set(
      (chapterItem?.questions || [])
        .map((question) => String(question?.[key] || "").trim())
        .filter(Boolean)
    ),
  ];
}

function advancedAm1CategoryLabel(chapterItem) {
  const number = Number(chapterItem?.number);
  return ADVANCED_AM1_CATEGORIES.find((category) => category.chapterNumbers.includes(number))?.label || "";
}

function studyChapterSubjectLabel(chapterItem, courseItem) {
  if (!chapterItem || !courseItem) return "";
  if (courseItem.id === "pe-first-info") {
    if (chapterItem.category === "fundamental" || chapterItem.category === "fundamental-field") return "基礎科目";
    if (chapterItem.category === "aptitude") return "適性科目";
  }
  if (courseItem.id === "kougai-manager") {
    const subjects = uniqueQuestionValues(chapterItem, "sourceSubject");
    if (subjects.length === 1) return subjects[0];
    if (chapterItem.category === "kougai-subjects") return chapterItem.title || "";
    if (chapterItem.category === "kougai-years") return "年度別";
  }
  if (courseItem.id === "advanced-am1") {
    return advancedAm1CategoryLabel(chapterItem);
  }
  const sourceSubjects = uniqueQuestionValues(chapterItem, "sourceSubject");
  if (sourceSubjects.length === 1) return sourceSubjects[0];
  return courseCategoryLabel(courseItem, chapterItem.category);
}

function studyEntrySubjectLabel(entry) {
  const storedSubject = String(entry.subjectName || "").trim();
  if (storedSubject) return storedSubject;
  const chapterEntry = studyChapterEntryFor(entry);
  return studyChapterSubjectLabel(chapterEntry?.chapterItem, courseDataStore[entry.courseId]);
}

function studyReportChapterDetail(entry) {
  const parts = [entry.courseName || "", studyEntrySubjectLabel(entry)].filter(Boolean);
  return parts.filter((part, index) => parts.indexOf(part) === index).join(" / ");
}

function studyReportGroupKey(entry, mode) {
  if (mode === "course") return entry.courseId || entry.courseName || "course";
  if (mode === "chapter") return `${entry.courseId || "course"}:${entry.chapterKey || entry.chapterTitle || "chapter"}`;
  return entry.day || localDayKey(entry.startAt);
}

function studyReportGroupLabel(entry, mode) {
  if (mode === "course") return entry.courseName || "未選択";
  if (mode === "chapter") return entry.chapterTitle || "未選択";
  return formatStudyDay(entry.day);
}

function studyReportGroupDetail(entry, mode) {
  if (mode === "chapter") return studyReportChapterDetail(entry);
  if (mode === "course") return "科目合計";
  return "日別合計";
}

function studyReportSortKey(entry, mode) {
  if (mode === "day") return entry.day || "";
  return entry.courseName || entry.chapterTitle || "";
}

function studyEffortMessage(todayMs, answerStats = answerStatsForDay(), percent = effortPercent(todayMs, answerStats)) {
  if (percent >= 100) return "今日の目標クリア";
  if (answerStats.questions >= 40) return "かなり解けてる";
  if (todayMs >= 90 * 60 * 1000) return "かなり積めてる";
  if (answerStats.questions >= 25) return "問題演習が進んでる";
  if (todayMs >= 50 * 60 * 1000) return "いい集中が続いてる";
  if (answerStats.questions >= 10) return "解くペースができてる";
  if (todayMs >= 25 * 60 * 1000) return "1ポモ達成";
  if (answerStats.questions > 0) return "まず問題に触れた";
  if (todayMs > 0) return "助走できてる";
  return "まず25分、始めたら勝ち";
}

function localDayKeyFromDateValue(value) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  return localDayKey(time);
}

function localDayDate(dayKey) {
  const [year, month, day] = String(dayKey || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(STUDY_BUSINESS_DAY_START_HOUR, 0, 0, 0);
  return date;
}

function addDaysToLocalDayKey(dayKey, days) {
  const date = localDayDate(dayKey);
  if (!date) return "";
  date.setDate(date.getDate() + Math.floor(Number(days) || 0));
  return localDayKey(date.getTime());
}

function localDayDiff(fromDayKey, toDayKey) {
  const fromDate = localDayDate(fromDayKey);
  const toDate = localDayDate(toDayKey);
  if (!fromDate || !toDate) return 0;
  return Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
}

function answerStatsForDay(dayKey = localDayKey()) {
  const questionIds = new Set();
  const correctQuestionIds = new Set();
  let attempts = 0;
  Object.entries(state.progress || {}).forEach(([questionId, record]) => {
    attemptsFor(record).forEach((attempt) => {
      if (localDayKeyFromDateValue(attempt.answeredAt) !== dayKey) return;
      attempts += 1;
      questionIds.add(questionId);
      if (attempt.correct) correctQuestionIds.add(questionId);
    });
  });
  return {
    questions: questionIds.size,
    correctQuestions: correctQuestionIds.size,
    attempts,
  };
}

function effortMsForQuestions(questionCount) {
  return Math.max(0, Number(questionCount || 0)) * QUESTION_EFFORT_MS;
}

function effortPercent(todayMs, answerStats) {
  const effortMs = Math.max(0, Number(todayMs || 0)) + effortMsForQuestions(answerStats?.questions || 0);
  return DAILY_STUDY_TARGET_MS ? Math.min(100, Math.round((effortMs / DAILY_STUDY_TARGET_MS) * 100)) : 0;
}

function studyEffortLevel(percent, todayMs, answerStats) {
  if (percent >= 100) return "clear";
  if (percent >= 50) return "strong";
  if (todayMs > 0 || (answerStats?.questions || 0) > 0) return "warm";
  return "idle";
}

function renderDailyEffort(todayMs, answerStats = answerStatsForDay()) {
  const percent = effortPercent(todayMs, answerStats);
  const hasEffort = todayMs > 0 || answerStats.questions > 0;
  const visiblePercent = hasEffort && percent === 0 ? "<1%" : `${percent}%`;
  const barPercent = hasEffort && percent === 0 ? 2 : percent;
  if (els.studyEffortLabel) els.studyEffortLabel.textContent = visiblePercent;
  if (els.studyEffortBar) {
    els.studyEffortBar.style.width = `${barPercent}%`;
    els.studyEffortBar.dataset.level = studyEffortLevel(percent, todayMs, answerStats);
  }
  if (els.studyEffortDetail) {
    const questionLabel = `${answerStats.questions}問`;
    const attemptLabel = answerStats.attempts > answerStats.questions ? ` / 回答${answerStats.attempts}回` : "";
    els.studyEffortDetail.textContent = `${questionLabel}${attemptLabel} / ${formatStudyDuration(todayMs)}`;
  }
  if (els.studyEffortMessage) {
    const questionTargetLabel = `${DAILY_QUESTION_TARGET}問`;
    els.studyEffortMessage.textContent = `${studyEffortMessage(todayMs, answerStats, percent)} / 目標 ${formatStudyDuration(DAILY_STUDY_TARGET_MS)} または ${questionTargetLabel}`;
  }
}

function studyDurationByDayMap(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const dayKey = entry.day || localDayKey(entry.startAt);
    map.set(dayKey, (map.get(dayKey) || 0) + Number(entry.durationMs || 0));
  });
  return map;
}

function answerStatsByDayMap() {
  const map = new Map();
  Object.entries(state.progress || {}).forEach(([questionId, record]) => {
    attemptsFor(record).forEach((attempt) => {
      const dayKey = localDayKeyFromDateValue(attempt.answeredAt);
      if (!dayKey) return;
      if (!map.has(dayKey)) {
        map.set(dayKey, {
          questionIds: new Set(),
          correctQuestionIds: new Set(),
          attempts: 0,
        });
      }
      const stats = map.get(dayKey);
      stats.attempts += 1;
      stats.questionIds.add(questionId);
      if (attempt.correct) stats.correctQuestionIds.add(questionId);
    });
  });
  return map;
}

function answerStatsFromMap(map, dayKey) {
  const stats = map.get(dayKey);
  return {
    questions: stats?.questionIds?.size || 0,
    correctQuestions: stats?.correctQuestionIds?.size || 0,
    attempts: stats?.attempts || 0,
  };
}

function recentStudyDayKeys(count = 7, todayKey = localDayKey()) {
  return Array.from({ length: count }, (_, index) => addDaysToLocalDayKey(todayKey, index - count + 1));
}

function studyDaySnapshot(dayKey, durationByDay, answerByDay) {
  const durationMs = durationByDay.get(dayKey) || 0;
  const answers = answerStatsFromMap(answerByDay, dayKey);
  return {
    dayKey,
    durationMs,
    answers,
    active: durationMs > 0 || answers.questions > 0,
    effortPercent: effortPercent(durationMs, answers),
  };
}

function studyStreakInfo(durationByDay, answerByDay, todayKey = localDayKey()) {
  let count = 0;
  for (let offset = 0; offset < 31; offset += 1) {
    const dayKey = addDaysToLocalDayKey(todayKey, -offset);
    if (!studyDaySnapshot(dayKey, durationByDay, answerByDay).active) break;
    count += 1;
  }
  return {
    count,
    label: count ? `${count}日` : "0日",
    detail: count >= 7 ? "習慣化いい感じ" : count ? "継続中" : "今日から再開",
  };
}

function studyAccuracyPercent(answerStats) {
  return answerStats.questions
    ? Math.round((answerStats.correctQuestions / answerStats.questions) * 100)
    : null;
}

function weekStudyStripHtml(snapshots) {
  const maxEffort = Math.max(25, ...snapshots.map((snapshot) => snapshot.effortPercent));
  return `
    <div class="study-week-head">
      <span>LAST 7 DAYS</span>
      <strong>${snapshots.filter((snapshot) => snapshot.active).length}/7日</strong>
    </div>
    <div class="study-week-bars">
      ${snapshots
        .map((snapshot) => {
          const dateLabel = formatStudyDay(snapshot.dayKey).replace(/\s+/g, "");
          const height = snapshot.active ? Math.max(10, Math.round((snapshot.effortPercent / maxEffort) * 100)) : 4;
          const level = studyEffortLevel(snapshot.effortPercent, snapshot.durationMs, snapshot.answers);
          const title = `${dateLabel}: ${formatStudyDuration(snapshot.durationMs)} / ${snapshot.answers.questions}問`;
          return `
            <div class="study-week-day" title="${escapeHtml(title)}">
              <div class="study-week-bar"><span data-level="${escapeHtml(level)}" style="height: ${height}%"></span></div>
              <small>${escapeHtml(dateLabel.slice(0, 5))}</small>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function reviewSessionStatsByDayMap(history = state.reviewSessionHistory) {
  const map = new Map();
  normalizeReviewSessionHistory(history).forEach((session) => {
    const dayKey = localDayKeyFromDateValue(session.completedAt);
    if (!dayKey) return;
    if (!map.has(dayKey)) {
      map.set(dayKey, {
        sessions: 0,
        questions: 0,
        correct: 0,
        wrong: 0,
        durationMs: 0,
      });
    }
    const stats = map.get(dayKey);
    stats.sessions += 1;
    stats.questions += Number(session.total || 0);
    stats.correct += Number(session.correct || 0);
    stats.wrong += Number(session.wrong || 0);
    stats.durationMs += Number(session.durationMs || 0);
  });
  return map;
}

function studyRhythmCoach(days) {
  if (!days.length) return "まだリズムは空。まず1問で地図が動きます";
  const activeDays = days.filter((day) => day.active).length;
  const reviewDays = days.filter((day) => day.review.sessions > 0).length;
  const lastThree = days.slice(-3);
  const coldStreak = [...days].reverse().findIndex((day) => day.active);
  const currentCold = coldStreak < 0 ? days.length : coldStreak;
  const currentStreak = [...days].reverse().findIndex((day) => !day.active);
  const streak = currentStreak < 0 ? days.length : currentStreak;
  if (currentCold >= 3) return `${currentCold}日空いています。今日は5問だけで再起動できます`;
  if (lastThree.every((day) => day.review.sessions > 0)) return "直近3日で復習が連続。定着を伸ばしやすい状態です";
  if (streak >= 5) return `${streak}日連続で稼働中。復習と新規を交互に回せます`;
  if (reviewDays >= 5) return "復習日の密度は高め。残っている解き直しから始めると楽になります";
  if (activeDays >= 7) return "勉強日は安定。復習日を少し混ぜると忘却が平らになります";
  return "空白日を減らすより、短い復習日を足すと続きやすくなります";
}

function studyRhythmMapHtml(studySnapshots, reviewHistory = state.reviewSessionHistory) {
  const reviewByDay = reviewSessionStatsByDayMap(reviewHistory);
  const maxEffort = Math.max(25, ...studySnapshots.map((snapshot) => snapshot.effortPercent));
  const maxReview = Math.max(1, ...studySnapshots.map((snapshot) => reviewByDay.get(snapshot.dayKey)?.questions || 0));
  const days = studySnapshots.map((snapshot) => {
    const review = reviewByDay.get(snapshot.dayKey) || { sessions: 0, questions: 0, correct: 0, wrong: 0, durationMs: 0 };
    const hasStudy = snapshot.active;
    const hasReview = review.sessions > 0;
    const kind = hasStudy && hasReview ? "both" : hasReview ? "review" : hasStudy ? "study" : "idle";
    return {
      ...snapshot,
      review,
      active: hasStudy || hasReview,
      kind,
      studyLoad: hasStudy ? Math.max(8, Math.round((snapshot.effortPercent / maxEffort) * 100)) : 4,
      reviewLoad: hasReview ? Math.max(8, Math.round((review.questions / maxReview) * 100)) : 4,
    };
  });
  const activeDays = days.filter((day) => day.active).length;
  const reviewDays = days.filter((day) => day.review.sessions > 0).length;
  const totalQuestions = days.reduce((sum, day) => sum + day.answers.questions, 0);
  const totalReviewQuestions = days.reduce((sum, day) => sum + day.review.questions, 0);
  return `
    <div class="summary-card-head">
      <span>RHYTHM MAP</span>
      <strong>${activeDays}/14日</strong>
    </div>
    <div class="study-rhythm-grid">
      ${days
        .map((day) => {
          const dateLabel = formatStudyDay(day.dayKey).replace(/\s+/g, "");
          const title = `${dateLabel}: 学習 ${formatStudyDuration(day.durationMs)} / 回答${day.answers.questions}問 / 復習${day.review.questions}問`;
          const badge = day.review.sessions ? `R${day.review.sessions}` : day.answers.questions ? `${day.answers.questions}問` : "--";
          return `
            <div
              class="study-rhythm-cell ${escapeHtml(day.kind)}"
              style="--study-load: ${day.studyLoad}%; --review-load: ${day.reviewLoad}%"
              title="${escapeHtml(title)}"
            >
              <span>${escapeHtml(dateLabel.slice(0, 5))}</span>
              <div aria-hidden="true">
                <i></i>
                <b></b>
              </div>
              <small>${escapeHtml(badge)}</small>
            </div>
          `;
        })
        .join("")}
    </div>
    <div class="study-rhythm-stats">
      <span>稼働 <b>${activeDays}</b></span>
      <span>復習日 <b>${reviewDays}</b></span>
      <span>回答 <b>${totalQuestions}</b></span>
      <span>復習 <b>${totalReviewQuestions}</b></span>
    </div>
    <p>${escapeHtml(studyRhythmCoach(days))}</p>
  `;
}

function studyContinuityCoach(data) {
  if (!data.activeDays) return "21日カレンダーは空です。まず1問か5分で今日のセルを点灯できます";
  if (data.currentGap >= 3) return `${data.currentGap}日空白。今日は短い復習だけで流れを戻せます`;
  if (data.wrongDays >= 4) return "ミスが出た日が多め。古い未回収から閉じると次の週が軽くなります";
  if (data.reviewDays >= 9) return "復習日の密度は高いです。前倒し復習を混ぜても崩れにくい状態です";
  if (data.currentStreak >= 7) return `${data.currentStreak}日連続稼働。復習と新規を交互に乗せやすいリズムです`;
  if (data.longestGap >= 4) return `最大${data.longestGap}日の空白があります。小さい復習日を間に挟むと安定します`;
  return "学習セルと復習セルが育っています。空白を責めず、次の1セットでつなぎます";
}

function studyContinuityHeadline(data) {
  if (!data.activeDays) return "継続待ち";
  if (data.currentStreak >= 7) return `連続 ${data.currentStreak}日`;
  if (data.currentGap >= 2) return `空白 ${data.currentGap}日`;
  if (data.reviewDays >= 5) return `復習 ${data.reviewDays}日`;
  return `稼働 ${data.activeDays}/21日`;
}

function studyContinuityData(studySnapshots, reviewHistory = state.reviewSessionHistory) {
  const reviewByDay = reviewSessionStatsByDayMap(reviewHistory);
  const days = studySnapshots.map((snapshot) => {
    const review = reviewByDay.get(snapshot.dayKey) || { sessions: 0, questions: 0, correct: 0, wrong: 0, durationMs: 0 };
    const studyQuestions = Number(snapshot.answers.questions || 0);
    const reviewQuestions = Number(review.questions || 0);
    const active = snapshot.active || review.sessions > 0;
    const kind = review.wrong
      ? "danger"
      : snapshot.active && review.sessions
        ? "strong"
        : review.sessions
          ? "review"
          : snapshot.active
            ? "study"
            : "idle";
    return {
      ...snapshot,
      review,
      active,
      kind,
      totalQuestions: studyQuestions + reviewQuestions,
      wrong: Number(review.wrong || 0),
      correct: Number(review.correct || 0),
    };
  });
  const maxLoad = Math.max(1, ...days.map((day) => day.totalQuestions + Math.ceil(day.durationMs / QUESTION_EFFORT_MS)));
  days.forEach((day) => {
    const load = day.totalQuestions + Math.ceil(day.durationMs / QUESTION_EFFORT_MS);
    day.fill = day.active ? Math.max(12, Math.round((load / maxLoad) * 100)) : 0;
    day.wrongFill = day.wrong ? Math.max(15, Math.min(100, Math.round((day.wrong / Math.max(1, day.review.questions)) * 100))) : 0;
  });
  const activeDays = days.filter((day) => day.active).length;
  const reviewDays = days.filter((day) => day.review.sessions > 0).length;
  const wrongDays = days.filter((day) => day.wrong > 0).length;
  const totalQuestions = days.reduce((sum, day) => sum + day.totalQuestions, 0);
  const reviewQuestions = days.reduce((sum, day) => sum + day.review.questions, 0);
  const wrongQuestions = days.reduce((sum, day) => sum + day.wrong, 0);
  let currentStreak = 0;
  let currentGap = 0;
  let longestGap = 0;
  let gap = 0;
  [...days].reverse().some((day, index) => {
    if (index === 0 && !day.active) {
      currentGap = 1;
      return false;
    }
    if (currentGap && !day.active) {
      currentGap += 1;
      return false;
    }
    if (!currentGap && day.active) {
      currentStreak += 1;
      return false;
    }
    return true;
  });
  days.forEach((day) => {
    if (!day.active) {
      gap += 1;
      longestGap = Math.max(longestGap, gap);
    } else {
      gap = 0;
    }
  });
  return {
    days,
    activeDays,
    reviewDays,
    wrongDays,
    totalQuestions,
    reviewQuestions,
    wrongQuestions,
    currentStreak,
    currentGap,
    longestGap,
  };
}

function studyContinuityStatHtml(label, value, detail, kind = "neutral") {
  return `
    <div class="study-continuity-stat ${escapeHtml(kind)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function studyContinuityPanelHtml(studySnapshots, reviewTotals, weaknesses, today) {
  const data = studyContinuityData(studySnapshots);
  const action = studyEfficiencyAction(reviewTotals, weaknesses, today);
  return `
    <div class="study-continuity-head">
      <div>
        <span>STUDY CONTINUITY</span>
        <strong>${escapeHtml(studyContinuityHeadline(data))}</strong>
      </div>
      <small>${escapeHtml(studyContinuityCoach(data))}</small>
    </div>
    <div class="study-continuity-calendar" aria-label="直近21日の学習と復習の密度">
      ${data.days
        .map((day) => {
          const dateLabel = formatStudyDay(day.dayKey).replace(/\s+/g, "");
          const title = `${dateLabel}: 学習${formatStudyDuration(day.durationMs)} / 回答${day.answers.questions}問 / 復習${day.review.questions}問 / ミス${day.wrong}問`;
          const badge = day.review.sessions ? `R${day.review.sessions}` : day.answers.questions ? `${day.answers.questions}` : "--";
          return `
            <div
              class="study-continuity-day ${escapeHtml(day.kind)}"
              style="--continuity-fill: ${day.fill}%; --continuity-wrong: ${day.wrongFill}%"
              title="${escapeHtml(title)}"
            >
              <span>${escapeHtml(dateLabel.slice(0, 5))}</span>
              <i aria-hidden="true"><b></b></i>
              <small>${escapeHtml(badge)}</small>
            </div>
          `;
        })
        .join("")}
    </div>
    <div class="study-continuity-stats">
      ${studyContinuityStatHtml("稼働", `${data.activeDays}/21`, `最大空白 ${data.longestGap}日`, data.activeDays >= 14 ? "strong" : data.activeDays >= 7 ? "warm" : "neutral")}
      ${studyContinuityStatHtml("復習日", `${data.reviewDays}日`, `復習 ${data.reviewQuestions}問`, data.reviewDays >= 8 ? "strong" : data.reviewDays >= 3 ? "warm" : "neutral")}
      ${studyContinuityStatHtml("ミス日", `${data.wrongDays}日`, `ミス ${data.wrongQuestions}問`, data.wrongDays ? "danger" : "strong")}
      ${studyContinuityStatHtml("処理量", `${data.totalQuestions}問`, data.currentGap ? `空白 ${data.currentGap}日` : `連続 ${data.currentStreak}日`, data.currentGap >= 3 ? "danger" : data.currentStreak >= 5 ? "strong" : "neutral")}
    </div>
    <div class="study-continuity-next">
      ${studyActionPlanButtonHtml({ ...action, label: "NEXT" })}
    </div>
  `;
}

function studyForecastDayLabel(dayKey) {
  return formatStudyDay(dayKey).replace(/\s+/g, "").slice(0, 5);
}

function studyForecastCoach(studySnapshots, reviewSchedule) {
  const activeDays = studySnapshots.filter((snapshot) => snapshot.active).length;
  const studyQuestions = studySnapshots.reduce((sum, snapshot) => sum + snapshot.answers.questions, 0);
  const reviewWeekCount = reviewSchedule.days.reduce((sum, bucket) => sum + bucket.count, 0);
  if (reviewSchedule.overdue.count) return `遅れ${reviewSchedule.overdue.count}問を先に処理`;
  if (reviewSchedule.days[0]?.count) return `今日${reviewSchedule.days[0].count}問を片付ける`;
  if (reviewWeekCount > studyQuestions && reviewWeekCount >= 5) return "復習の山が育っています";
  if (activeDays >= 5 && reviewWeekCount) return "習慣は安定。前倒し向き";
  if (studyQuestions) return "回答履歴が復習予定に変わっています";
  return "まず1問解くと見通しが育ちます";
}

function studyForecastPanelHtml(studySnapshots, reviewTotals) {
  const schedule = reviewUpcomingScheduleData(reviewTotals.entries, reviewTotals.todayKey, 7);
  const maxEffort = Math.max(25, ...studySnapshots.map((snapshot) => snapshot.effortPercent));
  const maxReview = Math.max(1, ...schedule.days.map((bucket) => bucket.count));
  const activeDays = studySnapshots.filter((snapshot) => snapshot.active).length;
  const reviewWeekCount = schedule.days.reduce((sum, bucket) => sum + bucket.count, 0);
  const peak = schedule.days.reduce((best, bucket) => (bucket.count > best.count ? bucket : best), schedule.days[0]);
  const reviewPeakText = peak?.count ? `${peak.label} ${peak.count}問` : "山なし";
  return `
    <div class="study-forecast-head">
      <div>
        <span>STUDY FLOW</span>
        <strong>${activeDays}/7日 → ${reviewWeekCount}問</strong>
      </div>
      <small>${escapeHtml(studyForecastCoach(studySnapshots, schedule))}</small>
    </div>
    <div class="study-forecast-rails" aria-label="直近学習量と今後の復習量">
      <div class="study-forecast-rail past">
        <span>学習</span>
        <div class="study-forecast-bars">
          ${studySnapshots
            .map((snapshot) => {
              const height = snapshot.active ? Math.max(8, Math.round((snapshot.effortPercent / maxEffort) * 100)) : 4;
              const title = `${studyForecastDayLabel(snapshot.dayKey)}: ${formatStudyDuration(snapshot.durationMs)} / ${snapshot.answers.questions}問`;
              return `
                <i
                  data-level="${escapeHtml(studyEffortLevel(snapshot.effortPercent, snapshot.durationMs, snapshot.answers))}"
                  style="height: ${height}%"
                  title="${escapeHtml(title)}"
                ></i>
              `;
            })
            .join("")}
        </div>
        <small>直近7日</small>
      </div>
      <div class="study-forecast-rail future">
        <span>復習</span>
        <div class="study-forecast-bars">
          ${schedule.days
            .map((bucket) => {
              const height = bucket.count ? Math.max(8, Math.round((bucket.count / maxReview) * 100)) : 4;
              const title = `${bucket.subLabel}: ${bucket.count}問 / 保持${bucket.retentionAverage == null ? "--" : `${bucket.retentionAverage}%`}`;
              return `
                <i
                  data-stage="${escapeHtml(bucket.stage)}"
                  style="height: ${height}%"
                  title="${escapeHtml(title)}"
                ></i>
              `;
            })
            .join("")}
        </div>
        <small>${escapeHtml(reviewPeakText)}</small>
      </div>
    </div>
  `;
}

function reviewOutlookCoach(schedule) {
  const today = schedule.days[0];
  const firstWeek = schedule.days.slice(0, 7).reduce((sum, bucket) => sum + bucket.count, 0);
  const secondWeek = schedule.days.slice(7, 14).reduce((sum, bucket) => sum + bucket.count, 0);
  if (schedule.overdue.count) return `遅れ${schedule.overdue.count}問を先に救出。今日の山へ進む前に軽くできます`;
  if (today?.count) return `今日${today.count}問。5問ずつ刻むと復習の山を崩しやすいです`;
  if (schedule.peak.count && schedule.peak.dayOffset <= 3) {
    return `${schedule.peak.label}に${schedule.peak.count}問。今のうちに前倒しすると楽になります`;
  }
  if (firstWeek >= 10) return `7日内に${firstWeek}問。毎日1セットで山をならせます`;
  if (secondWeek > firstWeek && secondWeek >= 8) return `2週目に${secondWeek}問。今日は新規と前倒しの両方が効きます`;
  if (schedule.peak.count) return `次の山は${schedule.peak.label}の${schedule.peak.count}問。余力で少し前倒しできます`;
  return "2週間の復習負荷は軽め。新規問題を進めて復習材料を増やせます";
}

function reviewOutlookBucketKind(bucket) {
  if (!bucket.count) return "idle";
  if (bucket.stage === "overdue" || bucket.weak >= Math.max(2, Math.ceil(bucket.count * 0.5))) return "danger";
  if (bucket.stage === "today" || bucket.stage === "soon") return "warm";
  return "strong";
}

function reviewOutlookAction(schedule) {
  const focus = schedule.overdue.count
    ? schedule.overdue
    : schedule.days[0]?.count
      ? schedule.days[0]
      : schedule.peak.count
        ? schedule.peak
        : null;
  if (!focus) {
    return {
      kind: "neutral",
      label: "GO",
      title: "新規を進める",
      value: "復習軽め",
      detail: "材料を増やす",
      action: "continue",
      attrs: "",
    };
  }
  return {
    kind: focus.stage === "overdue" ? "danger" : focus.stage === "future" ? "strong" : "warm",
    label: "GO",
    title: focus.stage === "overdue" ? "遅れを救出" : `${focus.label}の山を崩す`,
    value: `${focus.count}問`,
    detail: focus.weak ? `弱点 ${focus.weak}問` : focus.subLabel,
    action: "schedule",
    attrs: `data-review-schedule-key="${escapeHtml(focus.key)}"`,
  };
}

function reviewOutlookMetricHtml({ label, value, detail, kind = "neutral" }) {
  return `
    <div class="review-outlook-metric ${escapeHtml(kind)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function reviewOutlookPanelHtml(reviewTotals) {
  const schedule = reviewUpcomingScheduleData(reviewTotals.entries, reviewTotals.todayKey, 14);
  const firstWeek = schedule.days.slice(0, 7).reduce((sum, bucket) => sum + bucket.count, 0);
  const secondWeek = schedule.days.slice(7, 14).reduce((sum, bucket) => sum + bucket.count, 0);
  const activeCount = schedule.buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const weakCount = schedule.buckets.reduce((sum, bucket) => sum + bucket.weak, 0);
  const riskScore = Math.round(
    clamp(schedule.overdue.count * 18 + schedule.days[0].count * 12 + firstWeek * 4 + secondWeek * 2 + weakCount * 5, 0, 100)
  );
  const riskKind = riskScore >= 72 ? "danger" : riskScore >= 42 ? "warm" : "strong";
  const action = reviewOutlookAction(schedule);
  const peakText = schedule.peak.count ? `${schedule.peak.label} ${schedule.peak.count}問` : "山なし";
  return `
    <div class="review-outlook-head">
      <div>
        <span>REVIEW SKYLINE</span>
        <strong>${escapeHtml(peakText)}</strong>
      </div>
      <small>${escapeHtml(reviewOutlookCoach(schedule))}</small>
    </div>
    <div class="review-outlook-score ${escapeHtml(riskKind)}" style="--review-outlook-score: ${Math.max(4, riskScore)}%" aria-label="復習負荷 ${riskScore}%">
      <span></span>
    </div>
    <div class="review-outlook-bars" aria-label="今後2週間の復習予定">
      ${schedule.buckets
        .map((bucket) => {
          const load = bucket.count ? Math.max(8, Math.round((bucket.count / schedule.maxCount) * 100)) : 4;
          const retention = bucket.retentionAverage == null ? "--" : `${bucket.retentionAverage}%`;
          const title = bucket.count
            ? `${bucket.subLabel}: ${bucket.count}問 / 弱点${bucket.weak}問 / 保持 ${retention}`
            : `${bucket.subLabel}: 予定なし`;
          return `
            <button
              class="review-outlook-day ${escapeHtml(reviewOutlookBucketKind(bucket))}"
              type="button"
              data-study-action="schedule"
              data-review-schedule-key="${escapeHtml(bucket.key)}"
              style="--review-outlook-load: ${load}%"
              title="${escapeHtml(title)}"
              ${bucket.count ? "" : "disabled"}
            >
              <span>${escapeHtml(bucket.label)}</span>
              <i aria-hidden="true"></i>
              <strong>${bucket.count}</strong>
              <small>${bucket.weak ? `弱${bucket.weak}` : escapeHtml(retention)}</small>
            </button>
          `;
        })
        .join("")}
    </div>
    <div class="review-outlook-metrics">
      ${reviewOutlookMetricHtml({
        label: "遅れ",
        value: `${schedule.overdue.count}問`,
        detail: schedule.overdue.count ? "最優先" : "なし",
        kind: schedule.overdue.count ? "danger" : "strong",
      })}
      ${reviewOutlookMetricHtml({
        label: "7日内",
        value: `${firstWeek}問`,
        detail: `${schedule.days[0]?.count || 0}問が今日`,
        kind: firstWeek >= 10 ? "warm" : "neutral",
      })}
      ${reviewOutlookMetricHtml({
        label: "2週目",
        value: `${secondWeek}問`,
        detail: secondWeek > firstWeek ? "前倒し向き" : "軽め",
        kind: secondWeek > firstWeek && secondWeek ? "warm" : "neutral",
      })}
      ${reviewOutlookMetricHtml({
        label: "弱点混入",
        value: `${weakCount}問`,
        detail: `${activeCount}問中`,
        kind: weakCount ? "danger" : "strong",
      })}
    </div>
    <div class="review-outlook-next">
      ${studyActionPlanButtonHtml(action)}
    </div>
  `;
}

function reviewCalendarBucketKind(bucket) {
  if (!bucket?.count) return "idle";
  if (bucket.stage === "overdue" || bucket.weak >= Math.max(2, Math.ceil(bucket.count * 0.45))) return "danger";
  if (bucket.stage === "today" || bucket.count >= 8) return "warm";
  if (bucket.stage === "soon") return "soon";
  return "future";
}

function reviewCalendarDayLabel(bucket) {
  if (!bucket) return "";
  if (bucket.dayOffset === 0 || bucket.dayOffset === 1) return bucket.label;
  return formatStudyDay(bucket.key).replace(/\s+/g, "").slice(0, 5);
}

function reviewCalendarCoach(schedule, { firstWeek, secondWeek, monthCount, activeDays }) {
  if (schedule.overdue.count) return `遅れ${schedule.overdue.count}問を最初に処理。30日表の山が読みやすくなります`;
  if (schedule.days[0]?.count) return `今日${schedule.days[0].count}問。終えたら次のピークへ前倒しできます`;
  if (schedule.peak.count && schedule.peak.dayOffset <= 7) return `${schedule.peak.label}に${schedule.peak.count}問の山。今なら小分けにできます`;
  if (firstWeek + secondWeek >= 14) return `2週間で${firstWeek + secondWeek}問。週内から均すと楽です`;
  if (monthCount) return `30日で${monthCount}問、稼働日は${activeDays}日。濃い日だけ先に押さえましょう`;
  return "30日以内の復習予定は軽め。新規問題を進める余白があります";
}

function reviewCalendarMetricHtml({ label, value, detail, kind = "neutral", attrs = "" }) {
  return `
    <button class="review-calendar-metric ${escapeHtml(kind)}" type="button" ${attrs}>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </button>
  `;
}

function reviewCalendarPanelHtml(reviewTotals) {
  const schedule = reviewUpcomingScheduleData(reviewTotals.entries, reviewTotals.todayKey, 30);
  const firstWeek = schedule.days.slice(0, 7).reduce((sum, bucket) => sum + bucket.count, 0);
  const secondWeek = schedule.days.slice(7, 14).reduce((sum, bucket) => sum + bucket.count, 0);
  const laterWeeks = schedule.days.slice(14).reduce((sum, bucket) => sum + bucket.count, 0);
  const monthCount = firstWeek + secondWeek + laterWeeks;
  const activeDays = schedule.days.filter((bucket) => bucket.count).length;
  const weakCount = schedule.buckets.reduce((sum, bucket) => sum + bucket.weak, 0);
  const loadScore = Math.round(clamp(schedule.overdue.count * 16 + firstWeek * 6 + secondWeek * 3 + laterWeeks * 1.4 + weakCount * 3, 0, 100));
  const peakText = schedule.peak.count ? `${schedule.peak.label} ${schedule.peak.count}問` : "山なし";
  const loadKind = loadScore >= 72 || schedule.overdue.count ? "danger" : loadScore >= 38 ? "warm" : "strong";
  return `
    <div class="review-calendar-head">
      <div>
        <span>30D REVIEW MAP</span>
        <strong>${escapeHtml(peakText)}</strong>
      </div>
      <small>${escapeHtml(reviewCalendarCoach(schedule, { firstWeek, secondWeek, monthCount, activeDays }))}</small>
    </div>
    <div class="review-calendar-load ${escapeHtml(loadKind)}" style="--calendar-load: ${Math.max(4, loadScore)}%" aria-label="30日復習負荷 ${loadScore}%">
      <span></span>
      <b>${loadScore}%</b>
    </div>
    <div class="review-calendar-metrics">
      ${reviewCalendarMetricHtml({
        label: "遅れ",
        value: `${schedule.overdue.count}問`,
        detail: schedule.overdue.count ? "今すぐ救出" : "なし",
        kind: schedule.overdue.count ? "danger" : "strong",
        attrs: schedule.overdue.count
          ? `data-study-action="schedule" data-review-schedule-key="overdue" title="遅れ${schedule.overdue.count}問から復習開始"`
          : "disabled",
      })}
      ${reviewCalendarMetricHtml({
        label: "7日内",
        value: `${firstWeek}問`,
        detail: `${schedule.days[0]?.count || 0}問が今日`,
        kind: firstWeek >= 10 ? "warm" : firstWeek ? "soon" : "idle",
        attrs: firstWeek && schedule.days.find((bucket) => bucket.count)?.key
          ? `data-study-action="schedule" data-review-schedule-key="${escapeHtml(schedule.days.find((bucket) => bucket.count).key)}" title="7日内の最初の山から復習開始"`
          : "disabled",
      })}
      ${reviewCalendarMetricHtml({
        label: "30日",
        value: `${monthCount}問`,
        detail: `${activeDays}日で発生`,
        kind: monthCount >= 20 ? "warm" : monthCount ? "neutral" : "idle",
        attrs: schedule.next?.key
          ? `data-study-action="schedule" data-review-schedule-key="${escapeHtml(schedule.next.key)}" title="次の復習予定から開始"`
          : "disabled",
      })}
      ${reviewCalendarMetricHtml({
        label: "弱点混入",
        value: `${weakCount}問`,
        detail: monthCount ? `${Math.round((weakCount / Math.max(1, monthCount + schedule.overdue.count)) * 100)}%` : "なし",
        kind: weakCount ? "danger" : "strong",
        attrs: "disabled",
      })}
    </div>
    <div class="review-calendar-grid" aria-label="今後30日の復習予定">
      ${schedule.days
        .map((bucket) => {
          const load = bucket.count ? Math.max(8, Math.round((bucket.count / schedule.maxCount) * 100)) : 4;
          const weak = bucket.count ? Math.round((bucket.weak / bucket.count) * 100) : 0;
          const retention = bucket.retentionAverage == null ? "--" : `${bucket.retentionAverage}%`;
          const title = bucket.count
            ? `${bucket.subLabel}: ${bucket.count}問 / 弱点${bucket.weak}問 / 保持 ${retention}`
            : `${bucket.subLabel}: 予定なし`;
          return `
            <button
              class="review-calendar-day ${escapeHtml(reviewCalendarBucketKind(bucket))}"
              type="button"
              data-study-action="schedule"
              data-review-schedule-key="${escapeHtml(bucket.key)}"
              style="--calendar-day-load: ${load}%; --calendar-day-weak: ${weak}%"
              title="${escapeHtml(title)}"
              ${bucket.count ? "" : "disabled"}
            >
              <span>${escapeHtml(reviewCalendarDayLabel(bucket))}</span>
              <strong>${bucket.count}</strong>
              <i aria-hidden="true"><b></b></i>
              <small>${bucket.weak ? `弱${bucket.weak}` : escapeHtml(retention)}</small>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function reviewSprintSizeForMinutes(minutes, secondsPerQuestion = reviewAverageSecondsPerQuestion()) {
  const possible = Math.max(1, Math.floor((minutes * 60) / Math.max(1, secondsPerQuestion)));
  if (possible <= 6) return 5;
  if (possible <= 14) return 10;
  return 20;
}

function reviewSprintPrimaryMode(summaries) {
  const totals = reviewCurveTotals(summaries);
  if (totals.overdueCount) return "overdue";
  if (totals.todayCount) return "today";
  const weakCount = summaries.reduce(
    (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...state.reviewSession, mode: "weak" }).length,
    0
  );
  if (weakCount) return "weak";
  return "smart";
}

function reviewSprintCandidate(summaries, session) {
  const modes = [...new Set([session.mode, "smart", "weak"])];
  for (const mode of modes) {
    const candidate = reviewSetPreviewCandidate(summaries, { ...session, mode });
    if (candidate) return { ...candidate, mode };
  }
  return null;
}

function reviewSprintPlan(summaries, minutes) {
  const secondsPerQuestion = reviewAverageSecondsPerQuestion();
  const size = reviewSprintSizeForMinutes(minutes, secondsPerQuestion);
  const mode = reviewSprintPrimaryMode(summaries);
  const candidate = reviewSprintCandidate(summaries, { ...state.reviewSession, mode, size });
  if (!candidate) {
    return {
      minutes,
      size,
      mode,
      secondsPerQuestion,
      count: 0,
      kind: "idle",
      title: `${minutes}分復習`,
      detail: "復習候補待ち",
      focus: "まず回答履歴を増やす",
      disabled: true,
    };
  }
  const entries = candidate.entries;
  const counts = reviewCriticalPathCounts(entries.map((entry) => ({ entry })));
  const primary = entries[0];
  const kind = counts.overdue ? "danger" : counts.today ? "warm" : counts.weak ? "weak" : "strong";
  const focus = reviewEntryFocusLabel(primary) || candidate.summary.courseName || "復習対象";
  return {
    minutes,
    size,
    mode: candidate.mode,
    secondsPerQuestion,
    count: entries.length,
    courseId: candidate.summary.courseId,
    courseName: candidate.summary.courseName,
    kind,
    title: `${minutes}分で${reviewSessionModeLabel(candidate.mode)}`,
    detail: `${candidate.summary.courseName} / ${reviewEstimateDurationText(entries.length, secondsPerQuestion)}`,
    focus,
    disabled: false,
    counts,
  };
}

function reviewSprintCoach(plans) {
  const active = plans.filter((plan) => !plan.disabled);
  if (!active.length) return "復習候補が育つと、空き時間から直接セットを切れます";
  const urgent = active.find((plan) => plan.kind === "danger") || active.find((plan) => plan.kind === "warm");
  if (urgent) return `${urgent.minutes}分から開始できます。重いものを短く切ると戻りやすいです`;
  const largest = active[active.length - 1];
  return `${largest.minutes}分あれば${largest.count}問まで処理できます。余白時間を復習に変えられます`;
}

function reviewSprintCardHtml(plan) {
  const attrs = plan.disabled
    ? ""
    : `data-study-action="pace" data-review-pace-course="${escapeHtml(plan.courseId)}" data-review-pace-size="${plan.size}" data-review-pace-mode="${escapeHtml(plan.mode)}"`;
  const load = plan.disabled ? 4 : Math.max(12, Math.round((plan.count / Math.max(1, plan.size)) * 100));
  return `
    <button
      class="review-sprint-card ${escapeHtml(plan.kind)}"
      type="button"
      ${attrs}
      style="--review-sprint-load: ${load}%"
      ${plan.disabled ? "disabled" : ""}
      title="${escapeHtml(plan.disabled ? "復習候補がありません" : `${plan.courseName}の${reviewSessionModeLabel(plan.mode)}復習を開始 / ${plan.count}問`)}"
    >
      <span>${plan.minutes}分</span>
      <strong>${plan.count ? `${plan.count}問` : "--"}</strong>
      <small>${escapeHtml(plan.detail)}</small>
      <i aria-hidden="true"></i>
      <em>${escapeHtml(shortText(plan.focus, 28))}</em>
    </button>
  `;
}

function reviewSprintPanelHtml(summaries) {
  const plans = [5, 10, 25].map((minutes) => reviewSprintPlan(summaries, minutes));
  const active = plans.filter((plan) => !plan.disabled);
  const secondsPerQuestion = reviewAverageSecondsPerQuestion();
  const headline = active.length ? `${active[0].count}問から開始` : "候補待ち";
  return `
    <div class="review-sprint-head">
      <div>
        <span>TIMEBOX REVIEW</span>
        <strong>${escapeHtml(headline)}</strong>
      </div>
      <small>${escapeHtml(reviewSprintCoach(plans))}</small>
    </div>
    <div class="review-sprint-grid">
      ${plans.map(reviewSprintCardHtml).join("")}
    </div>
    <div class="review-sprint-foot">
      <span>平均 ${secondsPerQuestion}秒/問</span>
      <strong>${active.length ? `${active.length}ルート` : "履歴待ち"}</strong>
    </div>
  `;
}

function reviewDialCoach(config, modeRows, candidate) {
  const active = modeRows.find((row) => row.mode === config.mode);
  if (!candidate) {
    return config.excludeCalculation
      ? "計算を除外すると候補がありません。解除すると出る可能性があります"
      : "回答履歴が増えると、ここで復習セットの形を選べます";
  }
  if (config.excludeCalculation) return "計算問題を抜いた外出先セットです。暗記・理解だけ進められます";
  if (config.mode === "overdue") return "赤い遅れだけを切り出します。詰まりを戻すとき向きです";
  if (config.mode === "today") return "今日分だけを整えます。日課として一番扱いやすい設定です";
  if (config.mode === "weak") return "ミスと低理解を狙います。精度を戻したいときの短期集中です";
  if (active?.count >= config.size * 2) return "候補が多めです。件数を増やすか、空き時間セットに分けられます";
  return "重い順で混ぜています。迷ったらこの設定からで大丈夫です";
}

function reviewSessionCalculationLabel(config) {
  return normalizeReviewSession(config).excludeCalculation ? "計算なし" : "計算あり";
}

function reviewSessionCalculationTitle(config) {
  return normalizeReviewSession(config).excludeCalculation
    ? "復習セットから計算問題を除外中"
    : "復習セットに計算問題も含める";
}

function reviewDialPanelHtml(summaries) {
  const config = normalizeReviewSession(state.reviewSession);
  const secondsPerQuestion = reviewAverageSecondsPerQuestion();
  const modeRows = REVIEW_SESSION_MODES.map((mode) => {
    const count = summaries.reduce(
      (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode }).length,
      0
    );
    return {
      mode,
      count,
      sets: reviewSessionSetCount(count, config.size),
      label: reviewSessionModeLabel(mode),
      detail: reviewSessionModeDetail(mode),
    };
  });
  const current = modeRows.find((row) => row.mode === config.mode) || modeRows[0];
  const candidate = reviewSetPreviewCandidate(summaries, config);
  const currentCount = current?.count || 0;
  const nextCount = candidate ? candidate.entries.length : Math.min(config.size, currentCount);
  const headline = currentCount
    ? [reviewSessionModeLabel(config.mode), `${config.size}問`, config.excludeCalculation ? "計算なし" : ""]
        .filter(Boolean)
        .join(" / ")
    : "候補待ち";
  const candidateText = candidate ? `${candidate.summary.courseName} / ${nextCount}問` : "開始候補なし";
  return `
    <div class="review-dial-head">
      <div>
        <span>REVIEW DIAL</span>
        <strong>${escapeHtml(headline)}</strong>
      </div>
      <small>${escapeHtml(reviewDialCoach(config, modeRows, candidate))}</small>
    </div>
    <div class="review-dial-modes" aria-label="復習モード">
      ${modeRows
        .map((row) => {
          const active = row.mode === config.mode;
          const load = row.count ? Math.max(8, Math.min(100, Math.round((row.count / Math.max(config.size * 2, 1)) * 100))) : 4;
          return `
            <button
              class="review-dial-mode ${escapeHtml(row.mode)}${active ? " active" : ""}"
              type="button"
              data-review-dial-action="mode"
              data-review-dial-mode="${escapeHtml(row.mode)}"
              aria-pressed="${active}"
              style="--dial-load: ${load}%"
              title="${escapeHtml(row.detail)}"
            >
              <span>${escapeHtml(row.label)}</span>
              <strong>${row.count}</strong>
              <small>${row.sets}セット</small>
              <i aria-hidden="true"></i>
            </button>
          `;
        })
        .join("")}
    </div>
    <div class="review-dial-settings" aria-label="復習条件">
      ${REVIEW_SESSION_SIZES.map((size) => {
        const active = size === config.size;
        const setCount = reviewSessionSetCount(currentCount, size);
        return `
          <button
            class="review-session-chip${active ? " active" : ""}"
            type="button"
            data-review-dial-action="size"
            data-review-dial-size="${size}"
            aria-pressed="${active}"
            title="${escapeHtml(`${size}問ずつ / ${setCount}セット`)}"
          >${size}問</button>
        `;
      }).join("")}
      <button
        class="review-session-chip review-session-chip-condition${config.excludeCalculation ? " active" : ""}"
        type="button"
        data-review-dial-action="exclude-calculation"
        aria-pressed="${config.excludeCalculation}"
        title="${escapeHtml(reviewSessionCalculationTitle(config))}"
      >${escapeHtml(reviewSessionCalculationLabel(config))}</button>
    </div>
    <div class="review-dial-start-row">
      <div>
        <span>次のセット</span>
        <strong>${escapeHtml(candidateText)}</strong>
        <small>${escapeHtml(reviewEstimateDurationText(nextCount, secondsPerQuestion))} / 実測 ${secondsPerQuestion}秒/問</small>
      </div>
      <button
        class="review-dial-start"
        type="button"
        data-review-dial-action="start"
        data-review-dial-course="${escapeHtml(candidate?.summary.courseId || "")}"
        data-review-dial-mode="${escapeHtml(config.mode)}"
        ${candidate ? "" : "disabled"}
        title="${escapeHtml(candidate ? `${candidate.summary.courseName}の${reviewSessionModeLabel(config.mode)}復習を開始` : "復習候補がありません")}"
      >開始</button>
    </div>
  `;
}

function reviewFocusRows(summaries, weaknesses = []) {
  const session = normalizeReviewSession(state.reviewSession);
  const bottlenecks = reviewBottleneckTriageItems(summaries, session).map((item) => {
    const urgentCount = item.counts.overdue + item.counts.today + item.counts.weak;
    const kind = item.counts.overdue ? "danger" : item.counts.today || item.counts.weak ? "warm" : "strong";
    const retention = item.averageRetention == null ? "保持 --" : `保持 ${item.averageRetention}%`;
    const detail = [
      `期限 ${item.counts.overdue + item.counts.today}`,
      item.counts.weak ? `弱点 ${item.counts.weak}` : "",
      retention,
    ].filter(Boolean);
    return {
      type: "bottleneck",
      key: item.key,
      mode: item.mode,
      courseId: item.courseId,
      courseName: item.courseName,
      label: item.focus,
      badge: item.counts.overdue ? "遅れ" : item.counts.today ? "今日" : item.counts.weak ? "弱点" : "前倒し",
      kind,
      count: item.counts.total,
      danger: urgentCount,
      score: item.pressure,
      detail: detail.join(" / "),
      metric: reviewSessionModeLabel(item.mode),
    };
  });
  const weakRows = weaknesses.map((item) => {
    const tags = weaknessTriageTags(item);
    return {
      type: "weakness",
      key: item.key,
      mode: "weak",
      courseId: item.courseId,
      courseName: item.courseName,
      label: item.label,
      badge: weaknessTriageLabel(item),
      kind: weaknessTriageKind(item),
      count: item.questionCount,
      danger: item.overdueCount + item.dueCount + item.lowUnderstanding + item.latestWrong,
      score: item.score,
      detail: (tags.length ? tags : ["弱点候補"]).slice(0, 3).join(" / "),
      metric: `誤答${item.wrongRate}%`,
    };
  });
  const seen = new Set();
  return [...bottlenecks, ...weakRows]
    .filter((row) => {
      const signature = `${row.courseId}:${row.label}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return row.count > 0;
    })
    .sort(
      (a, b) =>
        b.danger - a.danger ||
        b.score - a.score ||
        b.count - a.count ||
        String(a.label).localeCompare(String(b.label), "ja")
    )
    .slice(0, 5);
}

function reviewFocusCoach(rows) {
  if (!rows.length) return "回答・理解度・復習履歴が増えると、今触る単元をここで絞れます";
  const top = rows[0];
  if (top.kind === "danger") return `${shortText(top.label, 22)}を先に救出すると、復習の詰まりが減ります`;
  if (top.kind === "warm") return `${shortText(top.label, 22)}が今日の軽い山です。短いセットで触れます`;
  return `${shortText(top.label, 22)}を前倒しで触ると、次の復習が楽になります`;
}

function reviewFocusCardHtml(row, maxScore) {
  const pressure = Math.min(100, Math.max(10, Math.round((row.score / Math.max(1, maxScore)) * 100)));
  const attrs =
    row.type === "bottleneck"
      ? `data-review-focus-action="bottleneck" data-review-bottleneck-key="${escapeHtml(row.key)}" data-review-bottleneck-mode="${escapeHtml(row.mode)}"`
      : `data-review-focus-action="weakness" data-weakness-key="${escapeHtml(row.key)}"`;
  return `
    <button
      class="review-focus-card ${escapeHtml(row.kind)}"
      type="button"
      ${attrs}
      style="--review-focus-pressure: ${pressure}%"
      title="${escapeHtml(`${row.courseName} / ${row.label}の復習を開始 / ${row.count}問`)}"
    >
      <span class="review-focus-badge">${escapeHtml(row.badge)}</span>
      <div class="review-focus-main">
        <strong>${escapeHtml(row.label)}</strong>
        <small>${escapeHtml(row.courseName)}</small>
      </div>
      <div class="review-focus-meta">
        <span>${row.count}問</span>
        <span>${escapeHtml(row.metric)}</span>
      </div>
      <i class="review-focus-meter" aria-hidden="true"><b></b></i>
      <small class="review-focus-detail">${escapeHtml(row.detail)}</small>
    </button>
  `;
}

function reviewFocusPanelHtml(summaries, weaknesses) {
  const rows = reviewFocusRows(summaries, weaknesses);
  const top = rows[0] || null;
  const maxScore = Math.max(1, ...rows.map((row) => row.score));
  return `
    <div class="review-focus-head">
      <div>
        <span>UNIT FOCUS</span>
        <strong>${top ? escapeHtml(shortText(top.label, 24)) : "候補待ち"}</strong>
      </div>
      <small>${escapeHtml(reviewFocusCoach(rows))}</small>
    </div>
    ${
      rows.length
        ? `<div class="review-focus-list">${rows.map((row) => reviewFocusCardHtml(row, maxScore)).join("")}</div>`
        : `<div class="study-report-empty">問題に回答すると、期限・弱点・理解度から単元別の復習候補を並べます</div>`
    }
  `;
}

function studyCourseMatrixSummaries(reviewSummaries = reviewCurriculumSummaries()) {
  const reviewByCourse = new Map(reviewSummaries.map((summary) => [summary.courseId, summary]));
  return loadedCourses()
    .map((courseItem) => {
      const questionIds = new Set();
      let answered = 0;
      let correct = 0;
      let attempts = 0;
      let followUp = 0;
      let latestAt = 0;
      courseItem.chapters.forEach((chapterItem) => {
        chapterQuestionSet(chapterItem).forEach((question) => {
          if (!question?.id || questionIds.has(question.id)) return;
          questionIds.add(question.id);
          const record = progressFor(question.id);
          const questionAttempts = attemptsFor(record);
          const latest = lastAttempt(record);
          attempts += questionAttempts.length;
          if (latest) {
            answered += 1;
            if (latest.correct) correct += 1;
            const time = Date.parse(latest.answeredAt || "");
            if (Number.isFinite(time) && time > latestAt) latestAt = time;
          }
          if (record?.followUp) followUp += 1;
        });
      });
      const total = questionIds.size;
      const review = reviewByCourse.get(courseItem.id) || {};
      const answeredPercent = total ? Math.round((answered / total) * 100) : 0;
      const accuracyPercent = answered ? Math.round((correct / answered) * 100) : null;
      const pressure =
        (review.overdueCount || 0) * 12 +
        (review.todayCount || 0) * 8 +
        (review.next7Count || 0) * 2 +
        (review.weakCount || 0) * 4 +
        followUp * 3;
      const status = review.overdueCount
        ? "danger"
        : review.todayCount || followUp
          ? "warm"
          : answered
            ? "strong"
            : "idle";
      return {
        courseId: courseItem.id,
        courseName: courseItem.name,
        answered,
        total,
        answeredPercent,
        accuracyPercent,
        attempts,
        followUp,
        dueCount: review.dueCount || 0,
        overdueCount: review.overdueCount || 0,
        todayCount: review.todayCount || 0,
        weakCount: review.weakCount || 0,
        next7Count: review.next7Count || 0,
        latestAt,
        pressure,
        status,
      };
    })
    .filter((item) => item.total || item.answered || item.attempts || item.dueCount || item.weakCount || item.followUp)
    .sort(
      (a, b) =>
        Number(b.courseId === state.courseId) - Number(a.courseId === state.courseId) ||
        b.pressure - a.pressure ||
        b.answered - a.answered ||
        b.latestAt - a.latestAt ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    );
}

function studyCourseMatrixHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const courses = studyCourseMatrixSummaries(reviewSummaries).slice(0, 7);
  const activeCount = courses.filter((item) => item.answered || item.attempts).length;
  const maxPressure = Math.max(1, ...courses.map((item) => item.pressure));
  return `
    <div class="summary-card-head">
      <span>COURSE MATRIX</span>
      <strong>${activeCount ? `${activeCount}科目` : "履歴待ち"}</strong>
    </div>
    ${
      courses.length
        ? `<div class="study-course-matrix-list">
            ${courses
              .map((item) => {
                const pressure = item.pressure ? Math.max(8, Math.round((item.pressure / maxPressure) * 100)) : 4;
                const accuracy = item.accuracyPercent == null ? "--" : `${item.accuracyPercent}%`;
                const title = `${item.courseName}: 進捗${item.answered}/${item.total} / 正答${accuracy} / 要復習${item.dueCount}問`;
                return `
                  <button
                    class="study-course-row ${escapeHtml(item.status)}${item.courseId === state.courseId ? " active" : ""}"
                    type="button"
                    data-study-course="${escapeHtml(item.courseId)}"
                    title="${escapeHtml(`${title} / この科目へ移動`)}"
                  >
                    <div class="study-course-main">
                      <strong>${escapeHtml(item.courseName)}</strong>
                      <small>進捗 ${item.answered}/${item.total} / 試行 ${item.attempts} / Miss ${item.followUp}</small>
                    </div>
                    <div class="study-course-progress" aria-hidden="true">
                      <i style="width: ${Math.max(3, item.answeredPercent)}%"></i>
                      <span style="width: ${pressure}%"></span>
                    </div>
                    <div class="study-course-meta">
                      <span>正答 <b>${escapeHtml(accuracy)}</b></span>
                      <span>今日 <b>${item.todayCount}</b></span>
                      <span>弱点 <b>${item.weakCount}</b></span>
                    </div>
                  </button>
                `;
              })
              .join("")}
          </div>`
        : `<div class="study-report-empty">問題に回答すると、科目ごとの進捗・精度・復習負荷がここに並びます</div>`
    }
  `;
}

function examReadinessKind(score, item) {
  if (item.overdueCount || item.weakCount >= 5 || score < 42) return "danger";
  if (item.todayCount || item.followUp || score < 68) return "warm";
  if (score >= 82) return "strong";
  return "neutral";
}

function examReadinessMode(item) {
  if (item.overdueCount) return "overdue";
  if (item.todayCount) return "today";
  if (item.weakCount || item.followUp) return "weak";
  return "smart";
}

function examReadinessRows(reviewSummaries = reviewCurriculumSummaries()) {
  const reviewByCourse = new Map(reviewSummaries.map((summary) => [summary.courseId, summary]));
  return studyCourseMatrixSummaries(reviewSummaries)
    .map((item) => {
      const review = reviewByCourse.get(item.courseId) || {};
      const accuracy = item.accuracyPercent ?? 0;
      const retention = reviewAverageRetention(Array.isArray(review.entries) ? review.entries : []);
      const reviewDebt = clamp(
        item.overdueCount * 8 + item.todayCount * 5 + item.weakCount * 4 + item.next7Count * 1.4 + item.followUp * 5,
        0,
        100
      );
      const freshness = item.latestAt
        ? clamp(100 - Math.floor((Date.now() - item.latestAt) / (24 * 60 * 60 * 1000)) * 10, 0, 100)
        : 0;
      const score = Math.round(
        item.answeredPercent * 0.36 +
          accuracy * 0.28 +
          (retention ?? accuracy) * 0.16 +
          (100 - reviewDebt) * 0.14 +
          freshness * 0.06
      );
      const mode = examReadinessMode(item);
      const reviewConfig = normalizeReviewSession({ ...state.reviewSession, mode, size: state.reviewSession.size });
      const reviewEntries = reviewSessionEntriesForSummary(review, reviewConfig);
      const kind = examReadinessKind(score, item);
      return {
        ...item,
        score: clamp(score, 0, 100),
        kind,
        mode,
        retention,
        reviewDebt,
        actionCount: reviewEntries.length,
        readinessGap: Math.max(0, 80 - score),
      };
    })
    .sort(
      (a, b) =>
        Number(b.kind === "danger") - Number(a.kind === "danger") ||
        a.score - b.score ||
        b.overdueCount - a.overdueCount ||
        b.weakCount - a.weakCount ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    );
}

function examReadinessCoach(rows) {
  if (!rows.length) return "対象科目を解くと、進捗・精度・復習負荷から準備度を出します";
  const danger = rows.filter((row) => row.kind === "danger").length;
  const ready = rows.filter((row) => row.score >= 80 && !row.overdueCount && !row.weakCount).length;
  const top = rows[0];
  if (danger) return `${danger}科目に救出サイン。低い準備度から5問で立て直します`;
  if (ready >= Math.max(1, Math.ceil(rows.length / 2))) return "仕上がり科目が増えています。前倒し復習で維持できます";
  if (top?.todayCount) return "今日分の復習を閉じると、準備度が上がりやすい状態です";
  return "未回答範囲と弱点を交互に潰すと、準備度が平らになります";
}

function examReadinessActionLabel(row) {
  if (!row.actionCount) return "科目へ";
  if (row.mode === "overdue") return "遅れ復習";
  if (row.mode === "today") return "今日復習";
  if (row.mode === "weak") return "弱点復習";
  return "復習開始";
}

function examReadinessPanelHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const rows = examReadinessRows(reviewSummaries).slice(0, 5);
  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;
  const readyCount = rows.filter((row) => row.score >= 80 && !row.overdueCount && !row.weakCount).length;
  const rescueCount = rows.filter((row) => row.kind === "danger").length;
  return `
    <div class="exam-readiness-head">
      <div>
        <span>EXAM READINESS</span>
        <strong>${rows.length ? `準備度 ${average}%` : "準備度待ち"}</strong>
      </div>
      <small>${escapeHtml(examReadinessCoach(rows))}</small>
    </div>
    ${
      rows.length
        ? `<div class="exam-readiness-grid">
            ${rows
              .map((row) => {
                const accuracy = row.accuracyPercent == null ? "--" : `${row.accuracyPercent}%`;
                const retention = row.retention == null ? "--" : `${row.retention}%`;
                const disabled = !row.actionCount;
                const actionLabel = examReadinessActionLabel(row);
                return `
                  <button
                    class="exam-readiness-card ${escapeHtml(row.kind)}"
                    type="button"
                    data-exam-readiness-course="${escapeHtml(row.courseId)}"
                    data-exam-readiness-mode="${escapeHtml(row.mode)}"
                    ${disabled ? "data-study-course-fallback=\"true\"" : ""}
                    title="${escapeHtml(`${row.courseName} / 準備度 ${row.score}% / ${disabled ? "科目へ移動" : actionLabel}`)}"
                  >
                    <div class="exam-readiness-main">
                      <span>${escapeHtml(row.kind === "danger" ? "RESCUE" : row.score >= 80 ? "READY" : "BUILD")}</span>
                      <strong>${escapeHtml(row.courseName)}</strong>
                      <small>残り準備 ${row.readinessGap}pt / ${actionLabel}</small>
                    </div>
                    <div class="exam-readiness-score" style="--readiness: ${row.score}%">
                      <b>${row.score}</b>
                      <i aria-hidden="true"></i>
                    </div>
                    <div class="exam-readiness-bars" aria-hidden="true">
                      <span data-label="進捗" style="--bar: ${row.answeredPercent}%"></span>
                      <span data-label="正答" style="--bar: ${row.accuracyPercent ?? 0}%"></span>
                      <span data-label="負荷" style="--bar: ${row.reviewDebt}%"></span>
                    </div>
                    <div class="exam-readiness-meta">
                      <span>進捗 <b>${row.answered}/${row.total}</b></span>
                      <span>正答 <b>${escapeHtml(accuracy)}</b></span>
                      <span>定着 <b>${escapeHtml(retention)}</b></span>
                      <span>復習 <b>${row.dueCount}</b></span>
                    </div>
                  </button>
                `;
              })
              .join("")}
          </div>
          <div class="exam-readiness-footer">
            <span>READY <b>${readyCount}</b></span>
            <span>RESCUE <b>${rescueCount}</b></span>
            <span>平均 <b>${average}%</b></span>
          </div>`
        : `<div class="study-report-empty">問題に回答すると、科目ごとの試験準備度と次アクションが表示されます</div>`
    }
  `;
}

function reviewMasteryEntryStage(entry) {
  if (!entry) return "growing";
  const retention = Number(entry.retentionPercent);
  if (entry.latestWrong || Number(entry.scoreRatio) < 0.8 || (Number.isFinite(retention) && retention < 55)) return "rescue";
  if (entry.due) return "due";
  if (Number(entry.correctStreak) >= 3 && Number.isFinite(retention) && retention >= 78) return "secured";
  return "growing";
}

function reviewMasterySummary(reviewSummaries = reviewCurriculumSummaries()) {
  const entries = reviewCurveEntriesFromSummaries(reviewSummaries);
  const counts = { secured: 0, growing: 0, due: 0, rescue: 0 };
  entries.forEach((entry) => {
    counts[reviewMasteryEntryStage(entry)] += 1;
  });
  const sessions = normalizeReviewSessionHistory(state.reviewSessionHistory);
  const recent = sessions.slice(0, 5);
  const recentAccuracy = averageReviewSessionAccuracy(recent);
  const olderAccuracy = averageReviewSessionAccuracy(sessions.slice(5, 10));
  const trend = recentAccuracy == null || olderAccuracy == null ? null : recentAccuracy - olderAccuracy;
  const perfectStreak = sessions.findIndex((session) => session.wrong > 0);
  const activePerfectStreak = perfectStreak < 0 ? sessions.length : perfectStreak;
  const total = entries.length;
  const masteryPercent = total ? Math.round((counts.secured / total) * 100) : 0;
  return {
    ...counts,
    total,
    masteryPercent,
    averageRetention: reviewAverageRetention(entries),
    recentAccuracy,
    trend,
    perfectStreak: activePerfectStreak,
    loadingCount: reviewSummaries.filter((summary) => summary.loading).length,
    failedCount: reviewSummaries.filter((summary) => summary.failed).length,
  };
}

function reviewMasteryHeadline(summary) {
  if (summary.failedCount) return `読込失敗 ${summary.failedCount}科目`;
  if (summary.loadingCount) return "定着度を集計中";
  if (!summary.total) return "復習履歴待ち";
  if (summary.rescue) return `救出 ${summary.rescue}問`;
  if (summary.due) return `期限 ${summary.due}問`;
  if (summary.masteryPercent >= 70) return `定着 ${summary.masteryPercent}%`;
  return `育成 ${summary.growing}問`;
}

function reviewMasteryCoach(summary) {
  if (!summary.total) return "問題に答えるほど、どこが固まってどこが崩れそうか見えてきます";
  if (summary.rescue) return "間違えた問題を先に解き直すと、復習予定が軽くなります";
  if (summary.due) return "期限到来分を1セット処理して、定着済みへ押し上げます";
  if (summary.trend != null && summary.trend >= 8) return `直近精度が${summary.trend}pt上昇。今は前倒し復習が効きます`;
  if (summary.perfectStreak >= 3) return `${summary.perfectStreak}セッション連続ノーミス。新規問題を増やせる状態です`;
  if (summary.growing) return "育成中の問題を短く回すと、定着済みへ上がりやすいです";
  return "復習負荷は軽め。新規問題で材料を増やせます";
}

function reviewMasteryStageLabel(stageKey) {
  return {
    rescue: "救出",
    due: "期限",
    growing: "育成",
    secured: "定着",
  }[stageKey] || "定着";
}

function reviewMasteryStageEntries(reviewSummaries, stageKey, courseId = "", session = state.reviewSession) {
  return filterReviewSessionEntries(reviewCurveEntriesFromSummaries(reviewSummaries), session)
    .filter((entry) => reviewMasteryEntryStage(entry) === stageKey)
    .filter((entry) => !courseId || entry.courseId === courseId)
    .sort(compareReviewSessionPriorityEntries);
}

function reviewMasteryBestCourseIdForStage(reviewSummaries, stageKey) {
  const groups = new Map();
  reviewMasteryStageEntries(reviewSummaries, stageKey).forEach((entry) => {
    if (!entry?.courseId || !entry?.question) return;
    if (!groups.has(entry.courseId)) {
      groups.set(entry.courseId, {
        courseId: entry.courseId,
        entries: [],
        score: 0,
      });
    }
    const group = groups.get(entry.courseId);
    group.entries.push(entry);
    group.score += reviewSessionPriorityScore(entry);
  });
  return [...groups.values()].sort(
    (a, b) =>
      Number(b.courseId === state.courseId) - Number(a.courseId === state.courseId) ||
      b.entries.length - a.entries.length ||
      b.score - a.score ||
      String(a.courseId).localeCompare(String(b.courseId))
  )[0]?.courseId || "";
}

function reviewMasteryStageRows(reviewSummaries, summary) {
  const dueMode = reviewCurveTotals(reviewSummaries).overdueCount ? "overdue" : "today";
  const rows = [
    {
      key: "rescue",
      label: "救出",
      value: summary.rescue,
      detail: "ミス/低保持",
      mode: "weak",
      courseId: reviewMasteryBestCourseIdForStage(reviewSummaries, "rescue"),
    },
    {
      key: "due",
      label: "期限",
      value: summary.due,
      detail: dueMode === "overdue" ? "遅れ優先" : "今日処理",
      mode: dueMode,
      courseId: reviewMasteryBestCourseIdForStage(reviewSummaries, "due"),
    },
    {
      key: "growing",
      label: "育成",
      value: summary.growing,
      detail: "もう一押し",
      mode: "smart",
      courseId: reviewMasteryBestCourseIdForStage(reviewSummaries, "growing"),
    },
    {
      key: "secured",
      label: "定着",
      value: summary.secured,
      detail: "維持チェック",
      mode: "smart",
      courseId: reviewMasteryBestCourseIdForStage(reviewSummaries, "secured"),
    },
  ];
  const maxCount = Math.max(1, ...rows.map((row) => row.value));
  return rows.map((row) => ({ ...row, load: row.value ? Math.max(8, Math.round((row.value / maxCount) * 100)) : 4 }));
}

function reviewMasteryTrackHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const summary = reviewMasterySummary(reviewSummaries);
  const rows = reviewMasteryStageRows(reviewSummaries, summary);
  const retentionText = summary.averageRetention == null ? "--" : `${summary.averageRetention}%`;
  const accuracyText = summary.recentAccuracy == null ? "--" : `${summary.recentAccuracy}%`;
  const trendText = summary.trend == null ? "比較待ち" : `${summary.trend > 0 ? "+" : ""}${summary.trend}pt`;
  const total = Math.max(1, summary.total);
  const width = (value) => (summary.total ? Math.max(3, Math.round((value / total) * 100)) : 0);
  return `
    <div class="summary-card-head">
      <span>MASTERY TRACK</span>
      <strong>${escapeHtml(reviewMasteryHeadline(summary))}</strong>
    </div>
    <div class="review-mastery-meter" aria-label="定着ステージ分布">
      <span class="rescue" style="width: ${width(summary.rescue)}%"></span>
      <span class="due" style="width: ${width(summary.due)}%"></span>
      <span class="growing" style="width: ${width(summary.growing)}%"></span>
      <span class="secured" style="width: ${width(summary.secured)}%"></span>
    </div>
    <div class="review-mastery-stats">
      <div><span>定着率</span><strong>${summary.total ? `${summary.masteryPercent}%` : "--"}</strong></div>
      <div><span>平均保持</span><strong>${escapeHtml(retentionText)}</strong></div>
      <div><span>直近精度</span><strong>${escapeHtml(accuracyText)}</strong></div>
      <div><span>推移</span><strong>${escapeHtml(trendText)}</strong></div>
    </div>
    <div class="review-mastery-grid">
      ${rows
        .map((row) => {
          const active = row.value > 0 && row.courseId;
          return `
            <button
              class="review-mastery-card ${escapeHtml(row.key)}${active ? " active" : ""}"
              type="button"
              data-review-mastery-stage="${escapeHtml(row.key)}"
              data-review-mastery-mode="${escapeHtml(row.mode)}"
              data-review-mastery-course="${escapeHtml(row.courseId)}"
              style="--mastery-load: ${row.load}%"
              ${active ? "" : "disabled"}
              title="${escapeHtml(active ? `${row.label}だけ復習 / ${row.value}問` : `${row.label}: ${row.value}問`)}"
            >
              <span>${escapeHtml(row.label)}</span>
              <strong>${row.value}</strong>
              <i aria-hidden="true"></i>
              <small>${escapeHtml(row.detail)}</small>
            </button>
          `;
        })
        .join("")}
    </div>
    <p>${escapeHtml(reviewMasteryCoach(summary))}</p>
  `;
}

function understandingSummaryHtml() {
  const counts = Object.fromEntries(UNDERSTANDING_LEVELS.map((level) => [level, 0]));
  Object.values(normalizeUnderstandingMap(state.understanding)).forEach((level) => {
    counts[level] = (counts[level] || 0) + 1;
  });
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const max = Math.max(1, ...Object.values(counts));
  const rows = UNDERSTANDING_LEVELS.map((level) => {
    const count = counts[level] || 0;
    const percent = total ? Math.round((count / total) * 100) : 0;
    const label = understandingLabel(level);
    return `
      <button
        class="understanding-summary-row understanding-${escapeHtml(level)}"
        type="button"
        data-understanding-review-level="${escapeHtml(level)}"
        ${count ? "" : "disabled"}
        title="${escapeHtml(count ? `${label}だけ復習 / ${count}問` : `${label}: 0問`)}"
      >
        <span>${escapeHtml(label)}</span>
        <div class="understanding-summary-track"><i style="width: ${Math.max(3, Math.round((count / max) * 100))}%"></i></div>
        <strong>${count}</strong>
      </button>
    `;
  }).join("");
  return `
    <div class="summary-card-head">
      <span>UNDERSTANDING</span>
      <strong>${total ? `${total}件` : "未評価"}</strong>
    </div>
    ${total ? rows : `<div class="study-report-empty">問題上部の理解度ボタンで、復習の材料が育ちます</div>`}
  `;
}

function reviewAverageRetention(entries) {
  const values = entries
    .map((entry) => Number(entry.retentionPercent))
    .filter((value) => Number.isFinite(value));
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function learningWeaknessSummaries(limit = 4) {
  const groups = new Map();
  loadedCourses().forEach((courseItem) => {
    const reviewEntries = new Map(reviewCurriculumEntriesForCourse(courseItem).map((entry) => [entry.question?.id, entry]));
    courseChapterEntries(courseItem).forEach((entry) => {
      const subject = studyChapterSubjectLabel(entry.chapterItem, courseItem) || entry.chapterItem?.title || "未分類";
      const groupKey = `${courseItem.id}:${subject || studyChapterKey(courseItem.id, entry.chapterItem, entry.index)}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          courseId: courseItem.id,
          courseName: courseItem.name,
          subject,
          label: subject || entry.chapterItem?.title || courseItem.name,
          attempts: 0,
          wrongAttempts: 0,
          latestWrong: 0,
          lowUnderstanding: 0,
          dueCount: 0,
          overdueCount: 0,
          questionIds: new Set(),
          score: 0,
        });
      }
      const group = groups.get(groupKey);
      chapterQuestionSet(entry.chapterItem).forEach((question) => {
        const record = progressFor(question.id);
        const attempts = attemptsFor(record);
        const wrongAttempts = attempts.filter((attempt) => !attempt.correct || attempt.timedOut).length;
        const latest = lastAttempt(record);
        const level = explicitUnderstandingLevelForQuestion(question);
        const lowUnderstanding = ["lost", "confused"].includes(level);
        const partialUnderstanding = level === "partial";
        const reviewEntry = reviewEntries.get(question.id);
        const signalScore =
          wrongAttempts * 2 +
          (latest && (!latest.correct || latest.timedOut) ? 4 : 0) +
          (lowUnderstanding ? 4 : 0) +
          (partialUnderstanding ? 1 : 0) +
          (reviewEntry?.due ? 2 : 0) +
          (reviewEntry?.overdue ? 3 : 0);
        if (!signalScore) return;
        group.questionIds.add(question.id);
        group.attempts += attempts.length;
        group.wrongAttempts += wrongAttempts;
        if (latest && (!latest.correct || latest.timedOut)) group.latestWrong += 1;
        if (lowUnderstanding) group.lowUnderstanding += 1;
        if (reviewEntry?.due) group.dueCount += 1;
        if (reviewEntry?.overdue) group.overdueCount += 1;
        group.score += signalScore;
      });
    });
  });
  return [...groups.values()]
    .filter((group) => group.score > 0)
    .map((group) => ({
      ...group,
      questionIds: [...group.questionIds],
      questionCount: group.questionIds.size,
      wrongRate: group.attempts ? Math.round((group.wrongAttempts / group.attempts) * 100) : 0,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.overdueCount - a.overdueCount ||
        b.latestWrong - a.latestWrong ||
        String(a.label).localeCompare(String(b.label), "ja")
    )
    .slice(0, limit);
}

function weaknessTriageKind(item) {
  if (!item) return "idle";
  if (item.overdueCount || item.wrongRate >= 60 || item.latestWrong >= 3 || item.lowUnderstanding >= 3) return "danger";
  if (item.dueCount || item.wrongRate >= 35 || item.latestWrong || item.lowUnderstanding) return "warm";
  return "strong";
}

function weaknessTriageLabel(item) {
  if (!item) return "待機";
  if (item.overdueCount) return "救出";
  if (item.dueCount) return "今日";
  if (item.lowUnderstanding) return "低理解";
  if (item.latestWrong) return "再確認";
  return "育成";
}

function weaknessTriageTags(item) {
  if (!item) return [];
  return [
    item.overdueCount ? `遅れ ${item.overdueCount}` : "",
    item.dueCount ? `期限 ${item.dueCount}` : "",
    item.lowUnderstanding ? `低理解 ${item.lowUnderstanding}` : "",
    item.latestWrong ? `直近ミス ${item.latestWrong}` : "",
    item.wrongRate ? `誤答 ${item.wrongRate}%` : "",
  ].filter(Boolean);
}

function weaknessPanelHtml(weaknesses = learningWeaknessSummaries()) {
  const totalQuestions = weaknesses.reduce((sum, item) => sum + item.questionCount, 0);
  const hotCount = weaknesses.filter((item) => weaknessTriageKind(item) === "danger").length;
  const dueCount = weaknesses.reduce((sum, item) => sum + item.dueCount + item.overdueCount, 0);
  const top = weaknesses[0] || null;
  const maxScore = Math.max(1, ...weaknesses.map((item) => item.score));
  return `
    <div class="summary-card-head">
      <span>UNIT TRIAGE</span>
      <strong>${weaknesses.length ? `${totalQuestions}問` : "分析中"}</strong>
    </div>
    ${
      weaknesses.length
        ? `<button
            class="weakness-hero ${escapeHtml(weaknessTriageKind(top))}"
            type="button"
            data-weakness-key="${escapeHtml(top.key)}"
            title="${escapeHtml(`${top.label}の弱点復習を開始 / ${top.questionCount}問`)}"
          >
            <span>${escapeHtml(weaknessTriageLabel(top))}</span>
            <strong>${escapeHtml(top.label)}</strong>
            <small>${escapeHtml(top.courseName)} / ${escapeHtml(weaknessTriageTags(top).slice(0, 3).join(" / ") || "弱点候補")}</small>
            <div class="weakness-hero-grid" aria-hidden="true">
              <b><span>危険単元</span><i>${hotCount}</i></b>
              <b><span>期限絡み</span><i>${dueCount}</i></b>
              <b><span>候補数</span><i>${weaknesses.length}</i></b>
            </div>
          </button>
          <div class="weakness-list">
            ${weaknesses
              .map((item, index) => {
                const pressure = Math.min(100, Math.max(12, Math.round((item.score / maxScore) * 100)));
                const kind = weaknessTriageKind(item);
                const tags = weaknessTriageTags(item).slice(0, 4);
                return `
                  <button
                    class="weakness-row ${escapeHtml(kind)}"
                    type="button"
                    data-weakness-key="${escapeHtml(item.key)}"
                    style="--weakness-pressure: ${pressure}%"
                    title="${escapeHtml(`${item.label}の弱点復習を開始 / ${item.questionCount}問`)}"
                    aria-label="${escapeHtml(`${item.label}の弱点復習を開始`)}"
                  >
                    <b>${index + 1}</b>
                    <div class="weakness-main">
                      <span class="weakness-kicker">
                        <em>${escapeHtml(weaknessTriageLabel(item))}</em>
                        <small>${escapeHtml(item.courseName)}</small>
                      </span>
                      <strong>${escapeHtml(item.label)}</strong>
                      <span class="weakness-meta">${item.questionCount}問 / 誤答${item.wrongRate}% / 低理解${item.lowUnderstanding} / 直近ミス${item.latestWrong}</span>
                      <span class="weakness-meter" aria-hidden="true"><i></i></span>
                      <span class="weakness-tags">
                        ${(tags.length ? tags : ["復習候補"]).map((tag) => `<small>${escapeHtml(tag)}</small>`).join("")}
                      </span>
                    </div>
                  </button>
                `;
              })
              .join("")}
          </div>`
        : `<div class="study-report-empty">誤答・理解度・復習予定が増えると、優先して潰す単元が出ます</div>`
    }
  `;
}

function averageReviewSessionAccuracy(sessions) {
  const values = normalizeReviewSessionHistory(sessions).map((session) => session.accuracyPercent);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function reviewSessionHistoryCoach(sessions) {
  const normalized = normalizeReviewSessionHistory(sessions);
  if (!normalized.length) return { kind: "idle", text: "復習セッションを完走すると、ここに次の一手が出ます" };
  const latest = normalized[0];
  const recentAverage = averageReviewSessionAccuracy(normalized.slice(0, 5));
  const olderAverage = averageReviewSessionAccuracy(normalized.slice(5, 10));
  const delta = olderAverage == null || recentAverage == null ? null : recentAverage - olderAverage;
  if (latest.wrong > 0) {
    return {
      kind: "danger",
      text: `直近は${latest.wrong}問ミス。次は「ミスだけ」で短く潰すのが効きます`,
    };
  }
  if (delta != null && delta <= -12) {
    return {
      kind: "warm",
      text: `直近5回の正答率が${Math.abs(delta)}pt下降。5問セッションで刻むのが安全です`,
    };
  }
  if (recentAverage != null && recentAverage >= 85) {
    return {
      kind: "strong",
      text: "復習精度は安定。期限到来分をまとめて処理して前に進めます",
    };
  }
  return {
    kind: "warm",
    text: "正答率は育ち途中。弱点と今日の期限を交互に回すと定着しやすいです",
  };
}

function reviewSessionHistoryStatsHtml(sessions) {
  const normalized = normalizeReviewSessionHistory(sessions);
  if (!normalized.length) return "";
  const latest = normalized[0];
  const recent = normalized.slice(0, 5);
  const recentAverage = averageReviewSessionAccuracy(recent);
  const olderAverage = averageReviewSessionAccuracy(normalized.slice(5, 10));
  const delta = olderAverage == null || recentAverage == null ? null : recentAverage - olderAverage;
  const totalQuestions = normalized.reduce((sum, session) => sum + session.total, 0);
  const totalWrong = normalized.reduce((sum, session) => sum + session.wrong, 0);
  const totalDuration = normalized.reduce((sum, session) => sum + session.durationMs, 0);
  const averageSeconds = totalQuestions ? Math.round(totalDuration / totalQuestions / 1000) : 0;
  const coach = reviewSessionHistoryCoach(normalized);
  const sparkSessions = normalized.slice(0, 8).reverse();
  const deltaLabel = delta == null ? "比較待ち" : `${delta > 0 ? "+" : ""}${delta}pt`;
  return `
    <div class="review-history-overview">
      <div>
        <span>直近</span>
        <strong>${latest.accuracyPercent}%</strong>
        <small>${escapeHtml(reviewSessionModeLabel(latest.mode))} ${latest.total}問</small>
      </div>
      <div>
        <span>5回平均</span>
        <strong>${recentAverage == null ? "--" : `${recentAverage}%`}</strong>
        <small>${escapeHtml(deltaLabel)}</small>
      </div>
      <div>
        <span>再挑戦</span>
        <strong>${totalWrong}</strong>
        <small>${totalQuestions}問中</small>
      </div>
      <div>
        <span>ペース</span>
        <strong>${averageSeconds ? `${averageSeconds}秒` : "--"}</strong>
        <small>1問平均</small>
      </div>
    </div>
    <div class="review-history-sparkline" aria-label="直近復習セッションの正答率">
      ${sparkSessions
        .map((session) => {
          const height = Math.max(8, session.accuracyPercent);
          const title = `${formatDateTime(session.completedAt)} / ${session.accuracyPercent}% / ${reviewSessionModeLabel(session.mode)} ${session.total}問`;
          return `<span class="${session.wrong ? "has-wrong" : "perfect"}" style="height: ${height}%" title="${escapeHtml(title)}"><i></i></span>`;
        })
        .join("")}
    </div>
    ${reviewSessionHistoryTrendHtml(normalized, { recentAverage, olderAverage })}
    <div class="review-history-coach ${escapeHtml(coach.kind)}">${escapeHtml(coach.text)}</div>
  `;
}

function reviewSessionHistoryTrendData(sessions, averages = {}) {
  const normalized = normalizeReviewSessionHistory(sessions);
  const now = Date.now();
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = normalized.filter((session) => Number(session.completedAt) >= weekStart);
  const weekQuestions = weekSessions.reduce((sum, session) => sum + session.total, 0);
  const recentAverage = averages.recentAverage ?? averageReviewSessionAccuracy(normalized.slice(0, 5));
  const olderAverage = averages.olderAverage ?? averageReviewSessionAccuracy(normalized.slice(5, 10));
  const delta = olderAverage == null || recentAverage == null ? null : recentAverage - olderAverage;
  const perfectStreak = normalized.reduce((streak, session, index) => {
    if (index !== streak) return streak;
    return session.wrong === 0 ? streak + 1 : streak;
  }, 0);
  const recovery = reviewRecoveryData(normalized);
  const totalQuestions = normalized.reduce((sum, session) => sum + session.total, 0);
  const totalDurationMs = normalized.reduce((sum, session) => sum + session.durationMs, 0);
  const paceSeconds = totalQuestions ? Math.round(totalDurationMs / totalQuestions / 1000) : 0;
  return {
    sessions: normalized,
    delta,
    perfectStreak,
    recovered: recovery.recovered,
    unresolvedCount: recovery.unresolvedCount,
    repeatedWrong: recovery.repeatedWrong,
    weekSessions: weekSessions.length,
    weekQuestions,
    paceSeconds,
  };
}

function reviewRecoveryData(sessions = state.reviewSessionHistory) {
  const normalized = normalizeReviewSessionHistory(sessions);
  const unresolvedById = new Map();
  let recovered = 0;
  let repeatedWrong = 0;
  [...normalized].reverse().forEach((session) => {
    const wrongSet = new Set(session.wrongQuestionIds);
    session.questionIds.forEach((questionId) => {
      if (unresolvedById.has(questionId) && !wrongSet.has(questionId)) {
        unresolvedById.delete(questionId);
        recovered += 1;
      }
    });
    wrongSet.forEach((questionId) => {
      if (!questionId) return;
      const current = unresolvedById.get(questionId);
      if (current) repeatedWrong += 1;
      unresolvedById.set(questionId, {
        questionId,
        courseId: session.courseId,
        courseName: session.courseName,
        firstWrongAt: current?.firstWrongAt || session.completedAt,
        latestWrongAt: session.completedAt,
        wrongCount: (current?.wrongCount || 0) + 1,
        lastSessionId: session.id,
        lastMode: session.mode,
      });
    });
  });
  const entries = [...unresolvedById.values()].sort(
    (a, b) =>
      b.wrongCount - a.wrongCount ||
      b.latestWrongAt - a.latestWrongAt ||
      String(a.questionId).localeCompare(String(b.questionId))
  );
  const groupsByCourse = new Map();
  entries.forEach((entry) => {
    if (!entry.courseId) return;
    if (!groupsByCourse.has(entry.courseId)) {
      groupsByCourse.set(entry.courseId, {
        courseId: entry.courseId,
        courseName: entry.courseName || courseManifest(entry.courseId)?.name || entry.courseId,
        entries: [],
        questionIds: [],
        repeatedWrong: 0,
        latestWrongAt: 0,
        score: 0,
      });
    }
    const group = groupsByCourse.get(entry.courseId);
    group.entries.push(entry);
    group.questionIds.push(entry.questionId);
    group.repeatedWrong += Math.max(0, entry.wrongCount - 1);
    group.latestWrongAt = Math.max(group.latestWrongAt, entry.latestWrongAt || 0);
    group.score += 2 + entry.wrongCount * 3 + (entry.latestWrongAt ? 1 : 0);
  });
  const groups = [...groupsByCourse.values()].sort(
    (a, b) =>
      Number(b.courseId === state.courseId) - Number(a.courseId === state.courseId) ||
      b.score - a.score ||
      b.entries.length - a.entries.length ||
      b.latestWrongAt - a.latestWrongAt ||
      String(a.courseName).localeCompare(String(b.courseName), "ja")
  );
  return {
    sessions: normalized,
    entries,
    groups,
    topGroup: groups[0] || null,
    unresolvedCount: entries.length,
    recovered,
    repeatedWrong,
  };
}

function reviewSessionCourseRecoveryRows(sessions = state.reviewSessionHistory) {
  const normalized = normalizeReviewSessionHistory(sessions);
  if (!normalized.length) return [];
  const recovery = reviewRecoveryData(normalized);
  const unresolvedByCourse = new Map(recovery.groups.map((group) => [group.courseId, group]));
  const rowsByCourse = new Map();
  normalized.forEach((session) => {
    const courseId = session.courseId || "unknown";
    if (!rowsByCourse.has(courseId)) {
      rowsByCourse.set(courseId, {
        courseId,
        courseName: session.courseName || courseManifest(courseId)?.name || "復習セッション",
        sessions: 0,
        total: 0,
        correct: 0,
        wrong: 0,
        durationMs: 0,
        latestCompletedAt: 0,
        latestSessionId: "",
        latestHasQuestions: false,
        latestMode: session.mode,
      });
    }
    const row = rowsByCourse.get(courseId);
    row.courseName = row.courseName || session.courseName || courseManifest(courseId)?.name || courseId;
    row.sessions += 1;
    row.total += session.total;
    row.correct += session.correct;
    row.wrong += session.wrong;
    row.durationMs += session.durationMs;
    if (session.completedAt > row.latestCompletedAt) {
      row.latestCompletedAt = session.completedAt;
      row.latestSessionId = session.id;
      row.latestHasQuestions = session.questionIds.length > 0;
      row.latestMode = session.mode;
    }
  });
  return [...rowsByCourse.values()]
    .map((row) => {
      const unresolved = unresolvedByCourse.get(row.courseId);
      const accuracyPercent = row.total ? Math.round((row.correct / row.total) * 100) : 0;
      const averageSeconds = row.total ? Math.round(row.durationMs / row.total / 1000) : 0;
      const unresolvedCount = unresolved?.entries.length || 0;
      const repeatedWrong = unresolved?.repeatedWrong || 0;
      const kind = unresolvedCount ? "danger" : accuracyPercent >= 88 ? "strong" : accuracyPercent >= 72 ? "warm" : "idle";
      return {
        ...row,
        accuracyPercent,
        averageSeconds,
        unresolvedCount,
        repeatedWrong,
        action: unresolvedCount ? "unresolved" : "restart",
        actionDisabled: unresolvedCount ? !courseManifest(row.courseId) : !row.latestHasQuestions,
        kind,
      };
    })
    .sort(
      (a, b) =>
        b.unresolvedCount - a.unresolvedCount ||
        b.repeatedWrong - a.repeatedWrong ||
        b.latestCompletedAt - a.latestCompletedAt ||
        b.total - a.total ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    )
    .slice(0, 6);
}

function reviewSessionCourseRecoveryMapHtml(sessions = state.reviewSessionHistory) {
  const rows = reviewSessionCourseRecoveryRows(sessions);
  if (!rows.length) return "";
  const unresolvedTotal = rows.reduce((sum, row) => sum + row.unresolvedCount, 0);
  const questionTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const correctTotal = rows.reduce((sum, row) => sum + row.correct, 0);
  const averageAccuracy = questionTotal ? Math.round((correctTotal / questionTotal) * 100) : 0;
  const headline = unresolvedTotal ? `未回収 ${unresolvedTotal}問` : `平均 ${averageAccuracy}%`;
  const coach = unresolvedTotal
    ? "赤い科目からミスだけ回収すると、復習履歴の穴が早く閉じます"
    : "科目別の未回収はなし。直近セットの再演習か期限到来分へ進めます";
  return `
    <div class="review-history-course-map" aria-label="科目別復習回収マップ">
      <div class="review-history-course-head">
        <div>
          <span>COURSE RECOVERY MAP</span>
          <strong>${escapeHtml(headline)}</strong>
        </div>
        <small>${escapeHtml(coach)}</small>
      </div>
      <div class="review-history-course-rows">
        ${rows
          .map((row) => {
            const latestText = row.latestCompletedAt ? formatDateTime(row.latestCompletedAt) : "履歴待ち";
            const actionLabel = row.unresolvedCount ? "未回収だけ開始" : "直近をもう一度";
            const actionTitle = row.unresolvedCount
              ? `${row.courseName}の未回収ミスだけ復習 / ${row.unresolvedCount}問`
              : `${row.courseName}の直近復習セットをもう一度`;
            return `
              <button
                class="review-history-course-row ${escapeHtml(row.kind)}"
                type="button"
                data-review-history-action="${escapeHtml(row.action)}"
                data-review-recovery-course="${escapeHtml(row.courseId)}"
                data-review-history-id="${escapeHtml(row.latestSessionId)}"
                ${row.actionDisabled ? "disabled" : ""}
                title="${escapeHtml(row.actionDisabled ? "再演習用データがありません" : actionTitle)}"
              >
                <span class="review-history-course-main">
                  <em>${escapeHtml(row.courseName)}</em>
                  <small>${row.sessions}回 / ${row.total}問 / ${escapeHtml(reviewSessionModeLabel(row.latestMode))}</small>
                </span>
                <strong>${row.accuracyPercent}%</strong>
                <span class="review-history-course-meter" style="--course-recovery-fill: ${Math.max(4, row.accuracyPercent)}%" aria-hidden="true"><i></i></span>
                <span class="review-history-course-meta">
                  <b>未回収 ${row.unresolvedCount}</b>
                  <b>再ミス ${row.repeatedWrong}</b>
                  <b>${row.averageSeconds || "--"}秒</b>
                </span>
                <span class="review-history-course-action">${escapeHtml(actionLabel)}</span>
                <small class="review-history-course-date">${escapeHtml(latestText)}</small>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function reviewSessionHistoryTrendCoach(trend) {
  if (!trend.sessions.length) return "復習セッションを完走すると、回収状況が見えるようになります";
  if (trend.unresolvedCount > 0) return `未回収${trend.unresolvedCount}問。履歴の「ミスだけ」で短く閉じると回収率が上がります`;
  if (trend.perfectStreak >= 3) return `${trend.perfectStreak}回連続でミスなし。次は到来分をまとめて処理できます`;
  if (trend.delta != null && trend.delta >= 10) return `直近平均が${trend.delta}pt上昇。いまは前倒し復習が効く流れです`;
  if (trend.delta != null && trend.delta <= -10) return `直近平均が${Math.abs(trend.delta)}pt下降。5問セットで精度を戻しましょう`;
  if (trend.weekSessions >= 3) return "今週の復習リズムはできています。弱点と期限到来を交互に回せます";
  return "履歴が少しずつ材料になります。1セット完走ごとに判断精度が上がります";
}

function reviewSessionHistoryTrendHtml(sessions, averages = {}) {
  const trend = reviewSessionHistoryTrendData(sessions, averages);
  if (!trend.sessions.length) return "";
  const deltaText = trend.delta == null ? "比較待ち" : `${trend.delta > 0 ? "+" : ""}${trend.delta}pt`;
  const headline = trend.unresolvedCount
    ? `未回収 ${trend.unresolvedCount}問`
    : trend.perfectStreak
      ? `連続クリア ${trend.perfectStreak}回`
      : "回収状況を記録中";
  const cards = [
    {
      label: "回収済み",
      value: `${trend.recovered}問`,
      detail: `再ミス ${trend.repeatedWrong}`,
      kind: trend.recovered ? "strong" : "idle",
    },
    {
      label: "未回収",
      value: `${trend.unresolvedCount}問`,
      detail: "ミス残り",
      kind: trend.unresolvedCount ? "danger" : "strong",
    },
    {
      label: "正答推移",
      value: deltaText,
      detail: "直近5回 vs 前5回",
      kind: trend.delta == null ? "idle" : trend.delta >= 0 ? "strong" : "warm",
    },
    {
      label: "今週",
      value: `${trend.weekSessions}回`,
      detail: `${trend.weekQuestions}問 / ${trend.paceSeconds || "--"}秒`,
      kind: trend.weekSessions >= 3 ? "strong" : "idle",
    },
  ];
  return `
    <div class="review-history-trend" aria-label="復習履歴トレンド">
      <div class="review-history-trend-head">
        <div>
          <span>RECOVERY TRACK</span>
          <strong>${escapeHtml(headline)}</strong>
        </div>
        <small>${escapeHtml(reviewSessionHistoryTrendCoach(trend))}</small>
      </div>
      <div class="review-history-trend-grid">
        ${cards
          .map(
            (card) => `
              <div class="review-history-trend-card ${escapeHtml(card.kind)}">
                <span>${escapeHtml(card.label)}</span>
                <strong>${escapeHtml(card.value)}</strong>
                <small>${escapeHtml(card.detail)}</small>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function reviewMomentumData(reviewSummaries = reviewCurriculumSummaries()) {
  const sessions = normalizeReviewSessionHistory(state.reviewSessionHistory);
  const trend = reviewSessionHistoryTrendData(sessions);
  const recovery = reviewRecoveryData(sessions);
  const totals = reviewCurveTotals(reviewSummaries);
  const recentAccuracy = averageReviewSessionAccuracy(sessions.slice(0, 5));
  const olderAccuracy = averageReviewSessionAccuracy(sessions.slice(5, 10));
  const delta = recentAccuracy == null || olderAccuracy == null ? null : recentAccuracy - olderAccuracy;
  const recoveryTotal = recovery.recovered + recovery.unresolvedCount;
  const recoveryRate = recoveryTotal ? Math.round((recovery.recovered / recoveryTotal) * 100) : null;
  const pressure = reviewLoadPressure(totals);
  const weekScore = Math.min(100, trend.weekSessions * 12 + trend.weekQuestions * 3);
  const hasSignal = Boolean(sessions.length || totals.totalCount || totals.dueCount || recoveryTotal);
  const score = hasSignal
    ? Math.round(
        clamp(recentAccuracy ?? 58, 0, 100) * 0.34 +
          clamp(recoveryRate ?? (recovery.unresolvedCount ? 35 : 62), 0, 100) * 0.28 +
          clamp(100 - pressure, 0, 100) * 0.2 +
          weekScore * 0.18
      )
    : null;
  const kind =
    score == null
      ? "idle"
      : recovery.unresolvedCount || delta <= -10 || pressure >= 74
        ? "danger"
        : score >= 76
          ? "strong"
          : score >= 52
            ? "warm"
            : "idle";
  return {
    sessions,
    trend,
    recovery,
    totals,
    recentAccuracy,
    olderAccuracy,
    delta,
    recoveryRate,
    pressure,
    weekScore,
    score,
    kind,
    mission: nextReviewMissionCandidate(reviewSummaries),
  };
}

function reviewMomentumHeadline(data) {
  if (data.score == null) return "履歴待ち";
  if (data.recovery.unresolvedCount) return `未回収 ${data.recovery.unresolvedCount}問`;
  if (data.delta != null && data.delta >= 8) return `精度 +${data.delta}pt`;
  if (data.trend.perfectStreak >= 2) return `連続 ${data.trend.perfectStreak}回`;
  if (data.totals.overdueCount) return `遅れ ${data.totals.overdueCount}問`;
  if (data.totals.todayCount) return `今日 ${data.totals.todayCount}問`;
  return `勢い ${data.score}`;
}

function reviewMomentumCoach(data) {
  if (data.score == null) return "復習を1セット完走すると、精度と回収状況から勢いを判定します";
  if (data.recovery.topGroup) {
    return `${data.recovery.topGroup.courseName}の未回収を先に閉じると、復習負荷が一気に軽くなります`;
  }
  if (data.totals.overdueCount) return `遅れ${data.totals.overdueCount}問。赤い山を先に崩すと明日の復習が楽になります`;
  if (data.delta != null && data.delta >= 10) return `直近精度が${data.delta}pt上昇。今は前倒し復習を足しても崩れにくい流れです`;
  if (data.delta != null && data.delta <= -10) return `直近精度が${Math.abs(data.delta)}pt下降。5問セットで短く回収すると戻しやすいです`;
  if (data.trend.perfectStreak >= 3) return `${data.trend.perfectStreak}回連続ノーミス。今日分と7日内をまとめて処理できます`;
  if (data.totals.todayCount) return "今日の復習を1セット片付けると、定着トラックが安定します";
  return "復習負荷は軽め。弱点か前倒しを少し触ると次回の山が低くなります";
}

function reviewMomentumMetricHtml({ label, value, detail, kind = "idle", fill = 0 }) {
  return `
    <div class="review-momentum-metric ${escapeHtml(kind)}" style="--momentum-fill: ${clamp(fill, 0, 100)}%">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
      <i aria-hidden="true"></i>
    </div>
  `;
}

function reviewMomentumActionHtml(data) {
  if (data.recovery.topGroup) {
    return `
      <button
        class="review-momentum-start danger"
        type="button"
        data-review-momentum-action="recovery"
        data-review-recovery-course="${escapeHtml(data.recovery.topGroup.courseId)}"
        title="${escapeHtml(`${data.recovery.topGroup.courseName}の未回収ミスだけ復習`)}"
      >未回収へ</button>
    `;
  }
  if (data.mission) {
    return `
      <button
        class="review-momentum-start ${escapeHtml(data.kind)}"
        type="button"
        data-review-momentum-action="next"
        title="${escapeHtml(`${data.mission.label} / ${data.mission.detail || "次の復習を開始"}`)}"
      >次の復習</button>
    `;
  }
  return `<button class="review-momentum-start" type="button" data-review-momentum-action="summary" disabled>待機中</button>`;
}

function reviewMomentumPanelHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const data = reviewMomentumData(reviewSummaries);
  const scoreText = data.score == null ? "--" : String(data.score);
  const scoreFill = data.score == null ? 0 : data.score;
  const deltaText = data.delta == null ? "比較待ち" : `${data.delta > 0 ? "+" : ""}${data.delta}pt`;
  const recoveryRateText = data.recoveryRate == null ? (data.recovery.unresolvedCount ? "回収中" : "--") : `${data.recoveryRate}%`;
  const pressureText = data.pressure >= 74 ? "重い" : data.pressure >= 38 ? "中" : "軽い";
  const sparkSessions = data.sessions.slice(0, 10).reverse();
  const missionText = data.recovery.topGroup
    ? `${data.recovery.topGroup.courseName} / ${data.recovery.topGroup.entries.length}問`
    : data.mission
      ? `${data.mission.label} / ${data.mission.value}`
      : "候補待ち";
  return `
    <div class="review-momentum-head">
      <div>
        <span>REVIEW MOMENTUM</span>
        <strong>${escapeHtml(reviewMomentumHeadline(data))}</strong>
      </div>
      <div class="review-momentum-score ${escapeHtml(data.kind)}" style="--momentum-score: ${scoreFill}%">
        <b>${escapeHtml(scoreText)}</b>
        <i aria-hidden="true"><em></em></i>
      </div>
    </div>
    <p>${escapeHtml(reviewMomentumCoach(data))}</p>
    <div class="review-momentum-spark" aria-label="直近復習の正答率">
      ${
        sparkSessions.length
          ? sparkSessions
              .map((session) => {
                const title = `${formatDateTime(session.completedAt)} / ${session.accuracyPercent}% / ${session.total}問`;
                return `<span class="${session.wrong ? "miss" : "clear"}" style="--bar: ${Math.max(8, session.accuracyPercent)}%" title="${escapeHtml(title)}"></span>`;
              })
              .join("")
          : `<span class="empty" style="--bar: 14%" title="履歴待ち"></span><span class="empty" style="--bar: 24%"></span><span class="empty" style="--bar: 18%"></span>`
      }
    </div>
    <div class="review-momentum-grid">
      ${reviewMomentumMetricHtml({
        label: "直近精度",
        value: data.recentAccuracy == null ? "--" : `${data.recentAccuracy}%`,
        detail: "最近5回",
        kind: data.recentAccuracy == null ? "idle" : data.recentAccuracy >= 82 ? "strong" : data.recentAccuracy >= 60 ? "warm" : "danger",
        fill: data.recentAccuracy ?? 0,
      })}
      ${reviewMomentumMetricHtml({
        label: "正答推移",
        value: deltaText,
        detail: "前5回比",
        kind: data.delta == null ? "idle" : data.delta >= 0 ? "strong" : "danger",
        fill: data.delta == null ? 0 : clamp(50 + data.delta * 2.5, 0, 100),
      })}
      ${reviewMomentumMetricHtml({
        label: "回収率",
        value: recoveryRateText,
        detail: `未回収 ${data.recovery.unresolvedCount}問`,
        kind: data.recovery.unresolvedCount ? "danger" : data.recovery.recovered ? "strong" : "idle",
        fill: data.recoveryRate ?? (data.recovery.unresolvedCount ? 28 : 0),
      })}
      ${reviewMomentumMetricHtml({
        label: "復習負荷",
        value: pressureText,
        detail: `今日 ${data.totals.todayCount} / 遅れ ${data.totals.overdueCount}`,
        kind: data.pressure >= 74 ? "danger" : data.pressure >= 38 ? "warm" : "strong",
        fill: 100 - data.pressure,
      })}
    </div>
    <div class="review-momentum-next">
      <span>${escapeHtml(missionText)}</span>
      ${reviewMomentumActionHtml(data)}
    </div>
  `;
}

function reviewCoachActionAttrs(action) {
  if (!action) return "";
  if (action.type === "recovery") {
    return `data-study-action="recovery" data-review-recovery-course="${escapeHtml(action.courseId || "")}"`;
  }
  if (action.type === "mode") {
    return [
      `data-study-action="pace"`,
      `data-review-pace-course="${escapeHtml(action.courseId || "")}"`,
      `data-review-pace-mode="${escapeHtml(action.mode || "smart")}"`,
      `data-review-pace-size="${Number(action.size) || normalizeReviewSession(state.reviewSession).size}"`,
    ].join(" ");
  }
  if (action.type === "weakness") {
    return `data-study-action="weakness" data-weakness-key="${escapeHtml(action.weaknessKey || "")}"`;
  }
  if (action.type === "schedule") {
    return `data-study-action="schedule" data-review-schedule-key="${escapeHtml(action.scheduleKey || "")}"`;
  }
  if (action.type === "continue") {
    return `data-study-action="continue"`;
  }
  return "";
}

function reviewCoachStepHtml(step, index, activeIndex) {
  const active = index === activeIndex;
  const attrs = reviewCoachActionAttrs(step.action);
  return `
    <button
      class="review-coach-step ${escapeHtml(step.kind)}${active ? " active" : ""}"
      type="button"
      ${attrs}
      ${step.disabled ? "disabled" : ""}
      title="${escapeHtml(step.title || step.detail || step.label)}"
    >
      <b>${index + 1}</b>
      <span>${escapeHtml(step.label)}</span>
      <strong>${escapeHtml(step.value)}</strong>
      <small>${escapeHtml(step.detail)}</small>
      <i aria-hidden="true"></i>
    </button>
  `;
}

function reviewCoachMetricHtml({ label, value, detail, kind = "neutral" }) {
  return `
    <div class="review-coach-metric ${escapeHtml(kind)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function reviewCoachPlan(reviewSummaries, reviewTotals, weaknesses) {
  const config = normalizeReviewSession(state.reviewSession);
  const recovery = reviewRecoveryData();
  const countForMode = (mode) =>
    reviewSummaries.reduce(
      (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode }).length,
      0
    );
  const weakCount = countForMode("weak");
  const overdueCount = countForMode("overdue");
  const todayCount = countForMode("today");
  const dueMode = overdueCount ? "overdue" : "today";
  const dueCount = overdueCount || todayCount;
  const dueCourseId = dueCount ? reviewMissionBestCourseId(reviewSummaries, { ...config, mode: dueMode }) : "";
  const weakCourseId = weakCount ? reviewMissionBestCourseId(reviewSummaries, { ...config, mode: "weak" }) : "";
  const topWeakness = weaknesses[0] || null;
  const schedule = reviewUpcomingScheduleData(filterReviewSessionEntries(reviewTotals.entries, config), reviewTotals.todayKey, 30);
  const scheduleTarget =
    schedule.overdue.count
      ? schedule.overdue
      : schedule.days.find((bucket) => bucket.count && bucket.key !== reviewTotals.todayKey) || null;
  const secondsPerQuestion = reviewAverageSecondsPerQuestion();
  const pressure = reviewLoadPressure(reviewTotals);
  const steps = [
    {
      kind: recovery.topGroup ? "danger" : "clear",
      label: "未回収",
      value: recovery.topGroup ? `${Math.min(config.size, recovery.topGroup.entries.length)}問` : "CLEAR",
      detail: recovery.topGroup ? `${recovery.topGroup.courseName} / 残${recovery.topGroup.entries.length}` : "残ミスなし",
      disabled: !recovery.topGroup,
      title: recovery.topGroup ? `${recovery.topGroup.courseName}の未回収ミスから復習` : "未回収ミスはありません",
      action: recovery.topGroup ? { type: "recovery", courseId: recovery.topGroup.courseId } : null,
      count: recovery.topGroup?.entries?.length || 0,
    },
    {
      kind: reviewTotals.overdueCount ? "overdue" : dueCount ? "today" : "clear",
      label: reviewTotals.overdueCount ? "遅れ" : "到来",
      value: dueCount ? `${Math.min(config.size, dueCount)}問` : "CLEAR",
      detail: dueCount ? `${reviewSessionModeLabel(dueMode)} / ${reviewSessionSetCount(dueCount, config.size)}セット` : "今日分なし",
      disabled: !dueCourseId,
      title: dueCourseId ? `${reviewSessionModeLabel(dueMode)}復習を開始` : "到来した復習はありません",
      action: dueCourseId ? { type: "mode", courseId: dueCourseId, mode: dueMode, size: config.size } : null,
      count: dueCount,
    },
    {
      kind: topWeakness || weakCount ? "weak" : "clear",
      label: "弱点",
      value: topWeakness ? `${topWeakness.questionCount}問` : weakCount ? `${Math.min(config.size, weakCount)}問` : "CLEAR",
      detail: topWeakness ? shortText(topWeakness.label, 18) : weakCount ? `${reviewSessionSetCount(weakCount, config.size)}セット候補` : "弱点薄め",
      disabled: !(topWeakness || weakCourseId),
      title: topWeakness ? `${topWeakness.label}の弱点復習` : weakCourseId ? "弱点復習を開始" : "弱点候補は軽めです",
      action: topWeakness
        ? { type: "weakness", weaknessKey: topWeakness.key }
        : weakCourseId
          ? { type: "mode", courseId: weakCourseId, mode: "weak", size: config.size }
          : null,
      count: topWeakness?.questionCount || weakCount,
    },
    {
      kind: scheduleTarget?.count ? (scheduleTarget.stage === "overdue" ? "overdue" : "soon") : "continue",
      label: scheduleTarget?.count ? "前倒し" : "新規",
      value: scheduleTarget?.count ? `${Math.min(config.size, scheduleTarget.count)}問` : "進める",
      detail: scheduleTarget?.count
        ? `${scheduleTarget.label} / 保持${scheduleTarget.retentionAverage == null ? "--" : `${scheduleTarget.retentionAverage}%`}`
        : "復習材料を増やす",
      disabled: false,
      title: scheduleTarget?.count ? `${scheduleTarget.label}の復習を開始` : "サマリーを閉じて現在の問題へ戻る",
      action: scheduleTarget?.count
        ? { type: "schedule", scheduleKey: scheduleTarget.key }
        : { type: "continue" },
      count: scheduleTarget?.count || 0,
    },
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => !step.disabled && step.kind !== "clear"));
  const primary = steps[activeIndex] || steps[steps.length - 1];
  const primaryCount = primary?.count ? Math.min(config.size, primary.count) : config.size;
  const estimate = primary?.kind === "continue" ? "新規へ" : reviewEstimateDurationText(primaryCount, secondsPerQuestion);
  return {
    config,
    recovery,
    schedule,
    pressure,
    steps,
    activeIndex,
    primary,
    weakCount,
    dueCount,
    estimate,
    secondsPerQuestion,
  };
}

function reviewCoachHeadline(plan) {
  if (plan.recovery.topGroup) return `${plan.recovery.topGroup.courseName}を救出`;
  if (plan.dueCount) return `${plan.primary.label}を${plan.estimate}`;
  if (plan.weakCount) return "弱点を短く補強";
  if (plan.schedule.next?.count) return `${plan.schedule.next.label}を前倒し`;
  return "復習は軽め、新規へ";
}

function reviewCoachText(plan) {
  if (plan.recovery.topGroup) return "未回収ミスが残っている間は、ここを先に閉じると以後の復習判断がきれいになります";
  if (plan.dueCount) return `${reviewSessionModeLabel(plan.config.mode)}設定はそのまま、到来分を${plan.config.size}問ずつ片付ける流れです`;
  if (plan.weakCount) return "期限は落ち着いています。ミスと低スコアの薄い傷を先に埋めると次の山が低くなります";
  if (plan.schedule.next?.count) return "30日マップに山が見えています。余力があるうちに少し前倒しできます";
  return "復習負荷は軽めです。今は新規問題を進めて、次の復習材料を育てる時間です";
}

function reviewCoachPanelHtml(reviewSummaries = reviewCurriculumSummaries(), reviewTotals = reviewCurveTotals(reviewSummaries), weaknesses = learningWeaknessSummaries(6)) {
  const plan = reviewCoachPlan(reviewSummaries, reviewTotals, weaknesses);
  const primaryAttrs = reviewCoachActionAttrs(plan.primary?.action);
  const primaryDisabled = !primaryAttrs || plan.primary?.disabled;
  const dueWeek = reviewTotals.overdueCount + reviewTotals.todayCount + reviewTotals.next7Count;
  return `
    <div class="review-coach-head">
      <div>
        <span>REVIEW NAVIGATOR</span>
        <strong>${escapeHtml(reviewCoachHeadline(plan))}</strong>
      </div>
      <small>${escapeHtml(reviewCoachText(plan))}</small>
    </div>
    <div class="review-coach-hero ${escapeHtml(plan.primary?.kind || "continue")}" style="--review-coach-pressure: ${Math.max(4, plan.pressure)}%">
      <div>
        <span>今の一手</span>
        <strong>${escapeHtml(plan.primary?.label || "待機")}</strong>
        <small>${escapeHtml(plan.primary?.detail || "履歴待ち")}</small>
      </div>
      <button
        class="review-coach-start ${escapeHtml(plan.primary?.kind || "continue")}"
        type="button"
        ${primaryAttrs}
        ${primaryDisabled ? "disabled" : ""}
      >
        ${escapeHtml(plan.primary?.kind === "continue" ? "問題へ戻る" : "開始")}
      </button>
    </div>
    <div class="review-coach-route" aria-label="今日の復習ルート">
      ${plan.steps.map((step, index) => reviewCoachStepHtml(step, index, plan.activeIndex)).join("")}
    </div>
    <div class="review-coach-metrics">
      ${reviewCoachMetricHtml({
        label: "所要",
        value: plan.estimate,
        detail: `${plan.secondsPerQuestion}秒/問`,
        kind: plan.primary?.kind || "neutral",
      })}
      ${reviewCoachMetricHtml({
        label: "7日内",
        value: `${dueWeek}問`,
        detail: `遅${reviewTotals.overdueCount} 今日${reviewTotals.todayCount}`,
        kind: reviewTotals.overdueCount ? "danger" : dueWeek ? "warm" : "strong",
      })}
      ${reviewCoachMetricHtml({
        label: "弱点",
        value: `${plan.weakCount}問`,
        detail: weaknesses[0] ? shortText(weaknesses[0].label, 18) : "軽め",
        kind: plan.weakCount ? "weak" : "strong",
      })}
      ${reviewCoachMetricHtml({
        label: "負荷",
        value: `${plan.pressure}%`,
        detail: plan.pressure >= 74 ? "重め" : plan.pressure >= 38 ? "中くらい" : "軽め",
        kind: plan.pressure >= 74 ? "danger" : plan.pressure >= 38 ? "warm" : "strong",
      })}
    </div>
  `;
}

function reviewCommandDeckHeadline(data) {
  if (data.totals.failedCount) return "読込失敗の科目あり";
  if (data.totals.loadingCount) return "復習デッキを集計中";
  if (data.totals.overdueCount) return `遅れ ${data.totals.overdueCount}問を救出`;
  if (data.totals.todayCount) return `今日 ${data.totals.todayCount}問を維持`;
  if (data.weakCount) return `弱点 ${data.weakCount}問を補強`;
  if (data.totals.next7Count) return `7日内 ${data.totals.next7Count}問を前倒し`;
  return "復習負荷は軽め";
}

function reviewCommandDeckCoach(data) {
  if (data.totals.overdueCount) return "赤い山を1セットだけでも崩すと、復習予定がかなり軽くなります";
  if (data.totals.todayCount && data.weakCount) return "今日分を先に触ってから、弱点カードで補強する流れが安定です";
  if (data.weakCount) return "期限は落ち着いています。ミスと低得点だけを短く回すのが効きます";
  if (data.totals.next7Count) return "前倒しカードで明日以降の山を削れます";
  return "新規問題へ戻る余白があります。履歴が増えるほど復習デッキが育ちます";
}

function reviewCommandDeckCardHtml(card) {
  const attrs = [
    `data-review-command-action="${escapeHtml(card.action)}"`,
    card.courseId ? `data-review-command-course="${escapeHtml(card.courseId)}"` : "",
    card.mode ? `data-review-command-mode="${escapeHtml(card.mode)}"` : "",
    card.scheduleKey ? `data-review-command-schedule="${escapeHtml(card.scheduleKey)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <button
      class="review-command-card ${escapeHtml(card.kind)}"
      type="button"
      ${attrs}
      ${card.disabled ? "disabled" : ""}
      title="${escapeHtml(card.title || card.detail || card.label)}"
    >
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <small>${escapeHtml(card.detail)}</small>
      <i aria-hidden="true"></i>
    </button>
  `;
}

function reviewCommandDeckStepHtml(step, denominator) {
  const retention = step.averageRetention == null ? "--" : `${step.averageRetention}%`;
  const countText = denominator ? `${step.cleared}/${denominator}` : `${step.questionCount}問`;
  return `
    <div class="review-command-step" style="--command-coverage: ${step.coverage}%">
      <div>
        <span>${escapeHtml(step.label)}</span>
        <strong>${escapeHtml(countText)}</strong>
        <small>${step.questionCount}問 / ${escapeHtml(step.duration)} / 保持 ${escapeHtml(retention)}</small>
      </div>
      <i aria-hidden="true"></i>
    </div>
  `;
}

function reviewCommandDeckHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const config = normalizeReviewSession(state.reviewSession);
  const totals = reviewCurveTotals(reviewSummaries);
  const countForMode = (mode) =>
    reviewSummaries.reduce(
      (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode }).length,
      0
    );
  const weakCount = countForMode("weak");
  const primaryMode = totals.overdueCount ? "overdue" : totals.todayCount ? "today" : weakCount ? "weak" : "smart";
  const primarySession = normalizeReviewSession({ ...config, mode: primaryMode });
  const primaryCourseId = reviewMissionBestCourseId(reviewSummaries, primarySession);
  const primaryCount = countForMode(primaryMode);
  const weakCourseId = reviewMissionBestCourseId(reviewSummaries, { ...config, mode: "weak" });
  const scheduleTarget = reviewMissionScheduleTarget(reviewSummaries);
  const smartCount = countForMode("smart");
  const smartCourseId = reviewMissionBestCourseId(reviewSummaries, { ...config, mode: "smart" });
  const pressure = reviewLoadPressure(totals);
  const path = reviewCriticalPathData(reviewSummaries, primarySession);
  const denominator = path.dangerTotal || path.total || 0;
  const primaryValue = primaryCount ? `${Math.min(config.size, primaryCount)}問` : "なし";
  const primaryKind = primaryMode === "smart" ? reviewPriorityEntryKind(path.rows[0]?.entry) : primaryMode;
  const cards = [
    {
      action: "mode",
      kind: primaryKind || "smart",
      label: "最優先",
      value: primaryValue,
      detail: `${reviewSessionModeLabel(primaryMode)} / ${primaryCourseId ? `${reviewSessionSetCount(primaryCount, config.size)}セット` : "候補なし"}`,
      courseId: primaryCourseId,
      mode: primaryMode,
      disabled: !primaryCourseId,
      title: primaryCourseId ? `${reviewSessionModeLabel(primaryMode)}の復習を開始` : "復習候補がありません",
    },
    {
      action: "mode",
      kind: "weak",
      label: "弱点補強",
      value: weakCount ? `${Math.min(config.size, weakCount)}問` : "なし",
      detail: weakCount ? `ミス/低得点 ${weakCount}問` : "ミス履歴待ち",
      courseId: weakCourseId,
      mode: "weak",
      disabled: !weakCourseId,
      title: weakCourseId ? "弱点復習を開始" : "弱点候補がありません",
    },
    scheduleTarget
      ? {
          action: "schedule",
          kind: scheduleTarget.key === totals.todayKey ? "today" : "soon",
          label: "前倒し",
          value: `${Math.min(config.size, scheduleTarget.count)}問`,
          detail: `${scheduleTarget.label} / 保持${scheduleTarget.retentionAverage == null ? "--" : `${scheduleTarget.retentionAverage}%`}`,
          scheduleKey: scheduleTarget.key,
          disabled: false,
          title: `${scheduleTarget.label}の復習を開始`,
        }
      : {
          action: "mode",
          kind: smartCount ? "soon" : "smart",
          label: "前倒し",
          value: smartCount ? `${Math.min(config.size, smartCount)}問` : "軽め",
          detail: smartCount ? `候補 ${smartCount}問` : "2週内は山なし",
          courseId: smartCourseId,
          mode: "smart",
          disabled: !smartCourseId,
          title: smartCourseId ? "最優先復習を開始" : "前倒し候補がありません",
        },
    {
      action: "continue",
      kind: "continue",
      label: "戻る",
      value: "問題へ",
      detail: pressure >= 60 ? "1セット後に新規へ" : "新規学習に戻る",
      disabled: false,
      title: "サマリーを閉じて現在の問題へ戻る",
    },
  ];
  return `
    <div class="review-command-head">
      <div>
        <span>REVIEW COMMAND DECK</span>
        <strong>${escapeHtml(reviewCommandDeckHeadline({ totals, weakCount }))}</strong>
      </div>
      <small>${escapeHtml(reviewCommandDeckCoach({ totals, weakCount }))}</small>
    </div>
    <div class="review-command-pressure ${pressure >= 74 ? "danger" : pressure >= 38 ? "warm" : "strong"}" style="--command-pressure: ${pressure}%">
      <span aria-hidden="true"></span>
      <b>${pressure}%</b>
      <small>復習負荷</small>
    </div>
    <div class="review-command-cards">
      ${cards.map(reviewCommandDeckCardHtml).join("")}
    </div>
    ${
      path.total
        ? `<div class="review-command-steps">
            ${path.steps.map((step) => reviewCommandDeckStepHtml(step, denominator)).join("")}
          </div>`
        : `<div class="review-command-empty">回答履歴が増えると、1から3セットでどれだけ山が崩れるか表示します</div>`
    }
  `;
}

function reviewNextQueuePanelHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const config = normalizeReviewSession(state.reviewSession);
  const rows = reviewPriorityQueueRows(reviewSummaries, config).slice(0, 5);
  const modeLabel = reviewSessionModeLabel(config.mode);
  const availableCount = reviewSummaries.reduce(
    (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, config).length,
    0
  );
  const averageRetention = reviewAverageRetention(rows.map((row) => row.entry));
  const retentionText = averageRetention == null ? "--" : `${averageRetention}%`;
  const maxScore = Math.max(1, ...rows.map((row) => row.score));
  const first = rows[0] || null;
  return `
    <div class="review-next-head">
      <div>
        <span>NEXT REVIEW QUEUE</span>
        <strong>${rows.length ? `${modeLabel}の次 ${rows.length}問` : "候補待ち"}</strong>
      </div>
      <small>候補 ${availableCount}問 / 平均保持 ${escapeHtml(retentionText)}</small>
    </div>
    ${
      rows.length
        ? `<div class="review-next-list">
            ${rows
              .map((row, index) => {
                const kind = reviewPriorityEntryKind(row.entry);
                const focus = reviewEntryFocusLabel(row.entry) || row.summary.courseName;
                const preview = reviewPriorityQuestionPreview(row.entry) || "問題文プレビューなし";
                const retention = row.entry.retentionPercent == null ? "--" : `${Math.round(Number(row.entry.retentionPercent) || 0)}%`;
                const priority = Math.max(8, Math.round((row.score / maxScore) * 100));
                const reason = reviewPriorityEntryLabel(row.entry);
                return `
                  <button
                    class="review-next-row ${escapeHtml(kind)}"
                    type="button"
                    data-review-next-course="${escapeHtml(row.summary.courseId)}"
                    data-review-next-mode="${escapeHtml(config.mode)}"
                    title="${escapeHtml(`${row.summary.courseName} / ${focus} / ${reason} / 復習を開始`)}"
                    style="--review-next-priority: ${priority}%"
                  >
                    <b>${index + 1}</b>
                    <span>
                      <strong>${escapeHtml(focus)}</strong>
                      <small>${escapeHtml(row.summary.courseName)} / ${escapeHtml(shortText(preview, 66))}</small>
                    </span>
                    <em>${escapeHtml(reason)}<i>保持 ${escapeHtml(retention)}</i></em>
                  </button>
                `;
              })
              .join("")}
          </div>
          <div class="review-next-footer">
            <span>${escapeHtml(first.summary.courseName)}から ${Math.min(config.size, availableCount)}問</span>
            <button
              class="review-next-start"
              type="button"
              data-review-next-action="start"
              data-review-next-course="${escapeHtml(first.summary.courseId)}"
              data-review-next-mode="${escapeHtml(config.mode)}"
              title="${escapeHtml(`${first.summary.courseName}の${modeLabel}復習を開始`)}"
            >この順で開始</button>
          </div>`
        : `<div class="review-next-empty">復習候補が育つと、次に解く問題がここに並びます</div>`
    }
  `;
}

function reviewAgeBucketKey(ageDays) {
  if (ageDays >= 7) return "old";
  if (ageDays >= 3) return "stale";
  if (ageDays >= 1) return "warm";
  return "fresh";
}

function reviewAgeBucketLabel(key) {
  return {
    fresh: "今日",
    warm: "1-2日",
    stale: "3-6日",
    old: "7日+",
  }[key] || "未分類";
}

function reviewAgeBucketDetail(key) {
  return {
    fresh: "早めに閉じる",
    warm: "記憶が薄れ始め",
    stale: "再定着の山",
    old: "最優先救出",
  }[key] || "";
}

function reviewAgeData(sessions = state.reviewSessionHistory) {
  const recovery = reviewRecoveryData(sessions);
  const now = Date.now();
  const buckets = ["fresh", "warm", "stale", "old"].map((key) => ({
    key,
    label: reviewAgeBucketLabel(key),
    detail: reviewAgeBucketDetail(key),
    entries: [],
    repeatedWrong: 0,
    score: 0,
  }));
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  recovery.entries.forEach((entry) => {
    const firstWrongAt = Number(entry.firstWrongAt) || Number(entry.latestWrongAt) || now;
    const ageDays = Math.max(0, Math.floor((now - firstWrongAt) / (24 * 60 * 60 * 1000)));
    const bucket = bucketByKey.get(reviewAgeBucketKey(ageDays)) || buckets[0];
    const repeated = Math.max(0, Number(entry.wrongCount || 1) - 1);
    bucket.entries.push({ ...entry, ageDays });
    bucket.repeatedWrong += repeated;
    bucket.score += ageDays * 2 + Number(entry.wrongCount || 1) * 5;
  });
  const topEntry = recovery.entries
    .map((entry) => {
      const firstWrongAt = Number(entry.firstWrongAt) || Number(entry.latestWrongAt) || now;
      const ageDays = Math.max(0, Math.floor((now - firstWrongAt) / (24 * 60 * 60 * 1000)));
      const score = ageDays * 2 + Number(entry.wrongCount || 1) * 5;
      return { ...entry, ageDays, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.ageDays - a.ageDays ||
        b.wrongCount - a.wrongCount ||
        String(a.questionId).localeCompare(String(b.questionId))
    )[0] || null;
  const oldestDays = topEntry?.ageDays || 0;
  const kind = !recovery.unresolvedCount ? "clear" : oldestDays >= 7 || recovery.repeatedWrong >= 3 ? "danger" : oldestDays >= 3 ? "warm" : "active";
  return {
    recovery,
    buckets,
    topEntry,
    oldestDays,
    kind,
  };
}

function reviewAgeHeadline(data) {
  if (!data.recovery.sessions.length) return "履歴待ち";
  if (!data.recovery.unresolvedCount) return "未回収なし";
  if (data.oldestDays >= 7) return `最古 ${data.oldestDays}日`;
  if (data.recovery.repeatedWrong) return `再ミス ${data.recovery.repeatedWrong}`;
  return `未回収 ${data.recovery.unresolvedCount}問`;
}

function reviewAgeCoach(data) {
  if (!data.recovery.sessions.length) return "復習セッションのミスが増えると、経過日数で救出順を作ります";
  if (!data.recovery.unresolvedCount) return "未回収ミスは空です。次は期限到来や前倒し復習に集中できます";
  if (data.oldestDays >= 7) return "7日以上残ったミスは最優先。古い記憶から救出して復習負荷を落とします";
  if (data.recovery.repeatedWrong >= 3) return "再ミスが積み上がっています。ミスだけ復習で短く閉じるのが効きます";
  if (data.oldestDays >= 3) return "3日以上のミスは薄れ始め。今日のうちに一度戻すと定着しやすいです";
  return "新しいミスが中心です。早めに閉じると未回収の山が育ちません";
}

function reviewAgePanelHtml(source = state.reviewSessionHistory) {
  const data = source?.recovery && Array.isArray(source?.buckets) ? source : reviewAgeData(source);
  const topCourseId = data.topEntry?.courseId || data.recovery.topGroup?.courseId || "";
  const topCourseName = data.topEntry?.courseName || data.recovery.topGroup?.courseName || "";
  const topAgeDays = data.topEntry?.ageDays || 0;
  const topWrongCount = data.topEntry?.wrongCount || data.recovery.topGroup?.count || 1;
  const maxBucket = Math.max(1, ...data.buckets.map((bucket) => bucket.entries.length));
  return `
    <div class="review-age-head">
      <div>
        <span>RECOVERY AGE</span>
        <strong>${escapeHtml(reviewAgeHeadline(data))}</strong>
      </div>
      <small>${escapeHtml(reviewAgeCoach(data))}</small>
    </div>
    <div class="review-age-buckets" aria-label="未回収ミスの経過日数分布">
      ${data.buckets
        .map((bucket) => {
          const width = Math.max(4, Math.round((bucket.entries.length / maxBucket) * 100));
          return `
            <div class="review-age-bucket ${escapeHtml(bucket.key)}" style="--age-fill: ${bucket.entries.length ? width : 0}%">
              <span>${escapeHtml(bucket.label)}</span>
              <strong>${bucket.entries.length}問</strong>
              <small>${escapeHtml(bucket.detail)} / 再${bucket.repeatedWrong}</small>
              <i aria-hidden="true"></i>
            </div>
          `;
        })
        .join("")}
    </div>
    <div class="review-age-next">
      <span>${escapeHtml(topCourseName ? `${topCourseName} / ${topAgeDays}日 / ${topWrongCount}問` : "対象なし")}</span>
      <button
        class="review-age-start ${escapeHtml(data.kind)}"
        type="button"
        data-review-age-action="start"
        data-review-recovery-course="${escapeHtml(topCourseId)}"
        ${topCourseId ? "" : "disabled"}
        title="${escapeHtml(topCourseId ? `${topCourseName}の未回収ミスを復習` : "未回収ミスがありません")}"
      >古いミスを救出</button>
    </div>
  `;
}

function reviewSessionImpactData(sessions) {
  const normalized = normalizeReviewSessionHistory(sessions);
  if (!normalized.length) return null;
  const latest = normalized[0];
  const recent = normalized.slice(0, 3);
  const previous = normalized.slice(3, 6);
  const recentAverage = averageReviewSessionAccuracy(recent);
  const previousAverage = averageReviewSessionAccuracy(previous);
  const delta = previousAverage == null || recentAverage == null ? null : recentAverage - previousAverage;
  const recovery = reviewRecoveryData(normalized);
  const recoveredTotal = recovery.recovered + recovery.unresolvedCount;
  const clearRate = recoveredTotal ? Math.round((recovery.recovered / recoveredTotal) * 100) : null;
  const now = Date.now();
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = normalized.filter((session) => Number(session.completedAt) >= weekStart);
  const weekQuestions = weekSessions.reduce((sum, session) => sum + session.total, 0);
  const deltaScore = delta == null ? 54 : clamp(54 + delta * 2.4, 0, 100);
  const clearScore = clearRate == null ? (recovery.unresolvedCount ? 30 : 68) : clearRate;
  const pressureScore = clamp(100 - recovery.unresolvedCount * 10 - recovery.repeatedWrong * 8, 0, 100);
  const volumeScore = clamp(weekQuestions * 4 + weekSessions.length * 5, 0, 100);
  const latestScore = latest.accuracyPercent;
  const score = Math.round(
    deltaScore * 0.28 + clearScore * 0.27 + pressureScore * 0.2 + volumeScore * 0.13 + latestScore * 0.12
  );
  const kind = score >= 74 ? "strong" : score >= 50 ? "warm" : "danger";
  const pressure = recovery.unresolvedCount + recovery.repeatedWrong * 2;
  return {
    latest,
    recentAverage,
    previousAverage,
    delta,
    recovery,
    clearRate,
    weekSessions: weekSessions.length,
    weekQuestions,
    score,
    kind,
    pressure,
  };
}

function reviewSessionImpactCoach(impact) {
  if (!impact) return "復習を完走すると、効果と次の回収先が見えます";
  if (impact.recovery.unresolvedCount) {
    return `未回収${impact.recovery.unresolvedCount}問。ここを閉じるほど復習効果が数字に戻ります`;
  }
  if (impact.delta != null && impact.delta >= 10) {
    return `直近3回が${impact.delta}pt改善。いまの復習順はかなり効いています`;
  }
  if (impact.delta != null && impact.delta <= -10) {
    return `直近3回が${Math.abs(impact.delta)}pt下降。ミスだけを短く挟んで戻しましょう`;
  }
  if (impact.clearRate != null && impact.clearRate >= 80) {
    return "ミス回収率は高め。次は期限到来分をまとめて処理できます";
  }
  if (impact.weekSessions >= 3) return "今週の復習量は十分。弱点と期限を交互に回すと伸びやすいです";
  return "まだ材料集め中。1セット完走するたびに効果判定が鋭くなります";
}

function reviewSessionImpactMetricHtml({ label, value, detail, kind = "idle", percent = 0 }) {
  return `
    <div class="review-impact-metric ${escapeHtml(kind)}" style="--review-impact-fill: ${Math.max(0, Math.min(100, percent))}%">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
      <i aria-hidden="true"></i>
    </div>
  `;
}

function reviewSessionImpactHtml(sessions) {
  const impact = reviewSessionImpactData(sessions);
  if (!impact) return "";
  const deltaText = impact.delta == null ? "比較待ち" : `${impact.delta > 0 ? "+" : ""}${impact.delta}pt`;
  const deltaKind = impact.delta == null ? "idle" : impact.delta >= 0 ? "strong" : "danger";
  const clearRateText = impact.clearRate == null ? "--" : `${impact.clearRate}%`;
  const clearKind = impact.clearRate == null ? "idle" : impact.clearRate >= 80 ? "strong" : impact.clearRate >= 45 ? "warm" : "danger";
  const pressureKind = impact.pressure === 0 ? "strong" : impact.pressure <= 4 ? "warm" : "danger";
  const action = impact.recovery.topGroup
    ? {
        label: "未回収だけ開始",
        title: `${impact.recovery.topGroup.courseName}の未回収ミスだけ復習`,
        attrs: `data-review-history-action="unresolved" data-review-recovery-course="${escapeHtml(impact.recovery.topGroup.courseId)}"`,
        disabled: false,
      }
    : {
        label: "直近をもう一度",
        title: impact.latest.questionIds.length ? "直近の復習セットをもう一度解く" : "この履歴は再演習用データがありません",
        attrs: `data-review-history-action="restart" data-review-history-id="${escapeHtml(impact.latest.id)}"`,
        disabled: !impact.latest.questionIds.length,
      };
  return `
    <div class="review-impact-panel ${escapeHtml(impact.kind)}" aria-label="復習効果">
      <div class="review-impact-head">
        <div>
          <span>REVIEW IMPACT</span>
          <strong>${impact.score}</strong>
        </div>
        <small>${escapeHtml(reviewSessionImpactCoach(impact))}</small>
      </div>
      <div class="review-impact-score" style="--review-impact-score: ${Math.max(4, impact.score)}%" aria-hidden="true">
        <span></span>
      </div>
      <div class="review-impact-grid">
        ${reviewSessionImpactMetricHtml({
          label: "直近3回",
          value: impact.recentAverage == null ? "--" : `${impact.recentAverage}%`,
          detail: deltaText,
          kind: deltaKind,
          percent: impact.recentAverage || 0,
        })}
        ${reviewSessionImpactMetricHtml({
          label: "ミス回収",
          value: clearRateText,
          detail: `回収${impact.recovery.recovered} / 残${impact.recovery.unresolvedCount}`,
          kind: clearKind,
          percent: impact.clearRate ?? 0,
        })}
        ${reviewSessionImpactMetricHtml({
          label: "再ミス圧",
          value: `${impact.pressure}`,
          detail: `再ミス ${impact.recovery.repeatedWrong}`,
          kind: pressureKind,
          percent: Math.max(0, 100 - impact.pressure * 12),
        })}
        ${reviewSessionImpactMetricHtml({
          label: "今週",
          value: `${impact.weekQuestions}問`,
          detail: `${impact.weekSessions}回完走`,
          kind: impact.weekSessions >= 3 ? "strong" : "idle",
          percent: Math.min(100, impact.weekQuestions * 4),
        })}
      </div>
      <button
        class="review-impact-action ${escapeHtml(impact.kind)}"
        type="button"
        ${action.attrs}
        ${action.disabled ? "disabled" : ""}
        title="${escapeHtml(action.title)}"
      >${escapeHtml(action.label)}</button>
    </div>
  `;
}

function reviewRecoveryPanelContentHtml(recovery, { showEmpty = false } = {}) {
  if (!recovery.sessions.length) {
    if (!showEmpty) return "";
    return `
      <div class="review-recovery-head">
        <div>
          <span>RECOVERY QUEUE</span>
          <strong>履歴待ち</strong>
        </div>
        <small>復習セットを完走すると、ミス回収の残りがここに出ます</small>
      </div>
      <div class="review-recovery-clear">復習で間違えた問題は、あとで「未回収だけ」として短く閉じられます。</div>
    `;
  }
  const topGroup = recovery.topGroup;
  const resolved = recovery.unresolvedCount === 0;
  const groupRows = recovery.groups.slice(0, 3);
  return `
    <div class="review-recovery-head">
      <div>
        <span>RECOVERY QUEUE</span>
        <strong>${resolved ? "未回収なし" : `未回収 ${recovery.unresolvedCount}問`}</strong>
      </div>
      <small>${resolved ? "直近の復習ミスは回収済み" : `${topGroup?.courseName || "復習"}から短く閉じる`}</small>
    </div>
    ${
      resolved
        ? `<div class="review-recovery-clear">復習履歴上のミス残りはありません。期限到来か前倒し復習へ進めます。</div>`
        : `<div class="review-recovery-groups">
            ${groupRows
              .map((group) => {
                const latestText = group.latestWrongAt ? formatDateTime(group.latestWrongAt) : "履歴あり";
                return `
                  <button
                    class="review-recovery-group"
                    type="button"
                    data-review-history-action="unresolved"
                    data-review-recovery-course="${escapeHtml(group.courseId)}"
                    title="${escapeHtml(`${group.courseName}の未回収ミスだけ復習 / ${group.entries.length}問`)}"
                  >
                    <span>${escapeHtml(group.courseName)}</span>
                    <strong>${group.entries.length}問</strong>
                    <small>再ミス ${group.repeatedWrong} / ${escapeHtml(latestText)}</small>
                  </button>
                `;
              })
              .join("")}
          </div>
          <button
            class="review-recovery-start"
            type="button"
            data-review-history-action="unresolved"
            data-review-recovery-course="${escapeHtml(topGroup?.courseId || "")}"
            ${topGroup ? "" : "disabled"}
            title="${escapeHtml(topGroup ? "最優先の未回収ミスだけ復習" : "未回収ミスがありません")}"
          >未回収だけ開始</button>`
    }
  `;
}

function reviewRecoveryPanelHtml(sessions) {
  const recovery = reviewRecoveryData(sessions);
  if (!recovery.sessions.length) return "";
  return `
    <div class="review-recovery-panel ${recovery.unresolvedCount === 0 ? "clear" : "danger"}" aria-label="未回収ミス横断リカバリー">
      ${reviewRecoveryPanelContentHtml(recovery)}
    </div>
  `;
}

function reviewSessionHistoryActionsHtml(session) {
  const canRestart = session.questionIds.length > 0;
  const canRetryWrong = session.wrongQuestionIds.length > 0;
  const missingDataText = canRestart ? "" : "この履歴は再演習用データがありません";
  const wrongDisabledText = missingDataText || "この履歴にはミスがありません";
  return `
    <div class="review-history-actions">
      <button
        class="review-history-action"
        type="button"
        data-review-history-action="restart"
        data-review-history-id="${escapeHtml(session.id)}"
        ${canRestart ? "" : "disabled"}
        title="${escapeHtml(missingDataText || "この復習セットをもう一度解く")}"
      >もう一度</button>
      <button
        class="review-history-action${canRetryWrong ? " danger" : ""}"
        type="button"
        data-review-history-action="wrong"
        data-review-history-id="${escapeHtml(session.id)}"
        ${canRetryWrong ? "" : "disabled"}
        title="${escapeHtml(canRetryWrong ? "この復習セットのミスだけ解く" : wrongDisabledText)}"
      >ミスだけ</button>
    </div>
  `;
}

function reviewSessionHistoryHtml(history = state.reviewSessionHistory) {
  const sessions = normalizeReviewSessionHistory(history);
  const visible = sessions.slice(0, 5);
  const averageAccuracy = sessions.length
    ? Math.round(sessions.reduce((sum, session) => sum + session.accuracyPercent, 0) / sessions.length)
    : null;
  return `
    <div class="summary-card-head">
      <span>REVIEW LOG</span>
      <strong>${sessions.length ? `${sessions.length}回 / ${averageAccuracy}%` : "未記録"}</strong>
    </div>
    ${
      visible.length
        ? `${reviewSessionHistoryStatsHtml(sessions)}
          ${reviewSessionImpactHtml(sessions)}
          ${reviewRecoveryPanelHtml(sessions)}
          ${reviewSessionCourseRecoveryMapHtml(sessions)}
          <div class="review-history-list">
            ${visible
              .map((session) => {
                const mode = reviewSessionModeLabel(session.mode);
                const retention = session.retentionAverage == null ? "--" : `${session.retentionAverage}%`;
                const duration = session.durationMs ? ` / ${formatStudyDuration(session.durationMs)}` : "";
                return `
                  <div class="review-history-row${session.wrong ? " has-wrong" : " perfect"}">
                    <div class="review-history-main">
                      <strong>${escapeHtml(session.courseName)} / ${escapeHtml(mode)} ${session.total}問</strong>
                      <span>${escapeHtml(formatDateTime(session.completedAt))}${escapeHtml(duration)} / 保持 ${escapeHtml(retention)} / 再挑戦 ${session.wrong}</span>
                      <i style="width: ${Math.max(4, session.accuracyPercent)}%"></i>
                    </div>
                    <b>${session.accuracyPercent}%</b>
                    ${reviewSessionHistoryActionsHtml(session)}
                  </div>
                `;
              })
              .join("")}
          </div>`
        : `<div class="study-report-empty">復習セッションを完走すると、ここに結果が残ります</div>`
    }
  `;
}

function insightCardHtml({ kind = "neutral", label, value, detail }) {
  return `
    <div class="study-insight-card ${escapeHtml(kind)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function studyActionPlanCoach({ schedule, weaknesses, today, streak, recovery }) {
  if (recovery?.unresolvedCount) return "間違えた問題の解き直しを優先";
  if (schedule.overdue.count) return "期限を過ぎた復習を優先";
  if (schedule.days[0]?.count) return "今日の復習から始める";
  if (weaknesses.length) return "苦手分野を短く確認";
  if (today.effortPercent < 50) return "まずは1セットだけ解く";
  if (streak.count >= 7) return "余裕があるので先の復習へ";
  return "この調子で次の問題へ";
}

function studyActionPlanButtonHtml({ kind = "neutral", label, title, value, detail, action = "", attrs = "", disabled = false }) {
  return `
    <button
      class="study-action-button ${escapeHtml(kind)}"
      type="button"
      ${action ? `data-study-action="${escapeHtml(action)}"` : ""}
      ${attrs}
      ${disabled ? "disabled" : ""}
      title="${escapeHtml(disabled ? detail : `${title} / ${detail}`)}"
    >
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(title)}</strong>
      <b>${escapeHtml(value)}</b>
      <small>${escapeHtml(detail)}</small>
    </button>
  `;
}

function studyPaceReviewPlan(reviewSummaries, today) {
  const remainingQuestions = Math.max(0, DAILY_QUESTION_TARGET - today.answers.questions);
  const suggestedSize = remainingQuestions >= 20 ? 20 : remainingQuestions >= 10 ? 10 : 5;
  const session = normalizeReviewSession({ ...state.reviewSession, mode: "smart", size: suggestedSize });
  const courseId = reviewMissionBestCourseId(reviewSummaries, session);
  if (!courseId) return null;
  const summary = reviewSummaries.find((item) => item.courseId === courseId);
  const entries = summary ? reviewSessionEntriesForSummary(summary, session) : [];
  if (!entries.length) return null;
  return {
    courseId,
    courseName: summary?.courseName || courseManifest(courseId)?.name || courseId,
    mode: session.mode,
    size: Math.min(session.size, entries.length),
    remainingQuestions,
  };
}

function studyActionPlanHtml(studySnapshots, reviewTotals, weaknesses, today, streak) {
  const recovery = reviewRecoveryData();
  const schedule = reviewUpcomingScheduleData(reviewTotals.entries, reviewTotals.todayKey, 7);
  const todayBucket = schedule.days[0];
  const nextBucket = schedule.days.find((bucket) => bucket.count && bucket.key !== reviewTotals.todayKey) || null;
  const firstSchedule = schedule.overdue.count
    ? { key: "overdue", title: "期限切れ復習", count: schedule.overdue.count, kind: "danger", detail: "期限を過ぎた問題から" }
    : todayBucket?.count
      ? { key: todayBucket.key, title: "今日の復習", count: todayBucket.count, kind: "warm", detail: "今日の予定分から" }
      : nextBucket
        ? { key: nextBucket.key, title: "先取り復習", count: nextBucket.count, kind: "strong", detail: `${nextBucket.label}の予定を少し先取り` }
        : null;
  const weakness = weaknesses[0] || null;
  const remainingMs = Math.max(0, DAILY_STUDY_TARGET_MS - today.durationMs);
  const remainingQuestions = Math.max(0, DAILY_QUESTION_TARGET - today.answers.questions);
  const paceDetail = remainingMs
    ? `目安 ${formatStudyDuration(remainingMs)} / ${remainingQuestions}問`
    : `今日 ${today.answers.questions}問`;
  const activeDays = studySnapshots.filter((snapshot) => snapshot.active).length;
  const pacePlan = studyPaceReviewPlan(reviewCurriculumSummaries(), today);
  const recoveryAction = recovery.topGroup
    ? {
        kind: "danger",
        title: "解き直し",
        value: `${Math.min(recovery.topGroup.entries.length, normalizeReviewSession({ ...state.reviewSession, mode: "weak" }).size)}問`,
        detail: `${recovery.topGroup.courseName} / 残り ${recovery.unresolvedCount}問`,
        action: "recovery",
        attrs: `data-review-recovery-course="${escapeHtml(recovery.topGroup.courseId)}"`,
      }
    : null;
  const scheduleAction = firstSchedule
    ? {
        kind: firstSchedule.kind,
        title: firstSchedule.title,
        value: `${firstSchedule.count}問`,
        detail: firstSchedule.detail,
        action: "schedule",
        attrs: `data-review-schedule-key="${escapeHtml(firstSchedule.key)}"`,
      }
    : null;
  const weaknessAction = weakness
    ? {
        kind: "danger",
        title: "苦手確認",
        value: `${weakness.questionCount}問`,
        detail: `${weakness.label} / 誤答${weakness.wrongRate}%`,
        action: "weakness",
        attrs: `data-weakness-key="${escapeHtml(weakness.key)}"`,
      }
    : null;
  const primaryAction =
    recoveryAction ||
    scheduleAction || {
      kind: "strong",
      title: "新規を進める",
      value: "余白あり",
      detail: "今の問題に戻る",
      action: "continue",
      attrs: "",
    };
  const secondaryAction = recoveryAction ? scheduleAction || weaknessAction : weaknessAction;
  return `
    <div class="study-action-head">
      <div>
        <span>今日の順番</span>
        <strong>${escapeHtml(studyActionPlanCoach({ schedule, weaknesses, today, streak, recovery }))}</strong>
      </div>
      <small>${activeDays}/7日 学習</small>
    </div>
    <div class="study-action-list">
      ${studyActionPlanButtonHtml({
        ...primaryAction,
        label: "1",
      })}
      ${
        secondaryAction
          ? studyActionPlanButtonHtml({
              ...secondaryAction,
              label: "2",
            })
          : studyActionPlanButtonHtml({
              kind: "neutral",
              label: "2",
              title: recoveryAction ? "次の候補なし" : "苦手なし",
              value: "OK",
              detail: recoveryAction ? "解き直し後に更新" : "回答が増えると表示",
              disabled: true,
            })
      }
      ${studyActionPlanButtonHtml({
        kind: today.effortPercent >= 100 ? "strong" : today.effortPercent >= 50 ? "warm" : "neutral",
        label: "3",
        title: pacePlan ? "短い復習" : "問題を解く",
        value: pacePlan ? `${pacePlan.size}問` : `${today.effortPercent}%`,
        detail: pacePlan ? `${pacePlan.courseName} / ${paceDetail}` : paceDetail,
        action: pacePlan ? "pace" : "continue",
        attrs: pacePlan
          ? `data-review-pace-course="${escapeHtml(pacePlan.courseId)}" data-review-pace-size="${pacePlan.size}" data-review-pace-mode="${escapeHtml(pacePlan.mode)}"`
          : "",
      })}
    </div>
  `;
}

function studyCheckpointProgress(current, target) {
  if (!target) return 100;
  return Math.round(clamp((Math.max(0, current) / Math.max(1, target)) * 100, 0, 100));
}

function studyCheckpointKind(progress, fallback = "neutral") {
  if (progress >= 100) return "strong";
  if (fallback === "danger") return "danger";
  if (progress >= 50) return "warm";
  return fallback;
}

function studyCheckpointRows(reviewSummaries, reviewTotals, weaknesses, today) {
  const rows = [];
  const session = normalizeReviewSession(state.reviewSession);
  const todayReview = reviewSessionStatsByDayMap().get(today.dayKey) || {
    sessions: 0,
    questions: 0,
    correct: 0,
    wrong: 0,
    durationMs: 0,
  };
  const schedule = reviewUpcomingScheduleData(reviewTotals.entries, reviewTotals.todayKey, 7);
  const todayBucket = schedule.days[0] || null;
  const nextBucket = schedule.days.find((bucket) => bucket.count && bucket.key !== reviewTotals.todayKey) || null;
  const scheduledTarget = schedule.overdue.count
    ? {
        key: "overdue",
        title: "期限切れ復習",
        count: schedule.overdue.count,
        detail: "期限を過ぎた問題から",
        kind: "danger",
      }
    : todayBucket?.count
      ? {
          key: todayBucket.key,
          title: "今日の復習",
          count: todayBucket.count,
          detail: "今日の予定分を解く",
          kind: "warm",
        }
      : nextBucket
        ? {
            key: nextBucket.key,
            title: "先取り復習",
            count: nextBucket.count,
            detail: `${nextBucket.label}の予定を先に解く`,
            kind: "strong",
          }
        : null;
  if (scheduledTarget) {
    const target = Math.min(session.size, scheduledTarget.count);
    const current = Math.min(todayReview.questions, target);
    const progress = studyCheckpointProgress(current, target);
    rows.push({
      label: "R",
      title: scheduledTarget.title,
      value: `${current}/${target}`,
      detail: scheduledTarget.detail,
      progress,
      kind: studyCheckpointKind(progress, scheduledTarget.kind),
      action: "schedule",
      attrs: `data-review-schedule-key="${escapeHtml(scheduledTarget.key)}"`,
      complete: progress >= 100,
    });
  } else {
    rows.push({
      label: "R",
      title: "復習予定",
      value: "OK",
      detail: "期限が近い問題はありません",
      progress: 100,
      kind: "strong",
      disabled: true,
      complete: true,
    });
  }

  const recovery = reviewRecoveryData();
  if (recovery.topGroup) {
    const recoveryPool = recovery.unresolvedCount + recovery.recovered;
    const progress = recoveryPool ? Math.round(clamp((recovery.recovered / recoveryPool) * 100, 0, 100)) : 0;
    rows.push({
      label: "M",
      title: "解き直し",
      value: `${recovery.unresolvedCount}問`,
      detail: recovery.topGroup.repeatedWrong
        ? `${recovery.topGroup.courseName} / くり返しミス ${recovery.topGroup.repeatedWrong}問`
        : recovery.topGroup.courseName,
      progress,
      kind: "danger",
      action: "recovery",
      attrs: `data-review-recovery-course="${escapeHtml(recovery.topGroup.courseId)}"`,
    });
  } else {
    rows.push({
      label: "M",
      title: "解き直し",
      value: "なし",
      detail: recovery.recovered ? `${recovery.recovered}問完了` : "残っているミスはありません",
      progress: 100,
      kind: "strong",
      disabled: true,
      complete: true,
    });
  }

  const weakness = weaknesses[0] || null;
  if (weakness) {
    const progress = Math.round(clamp(100 - weakness.wrongRate, 5, 95));
    rows.push({
      label: "W",
      title: "苦手確認",
      value: `${weakness.wrongRate}%`,
      detail: `${weakness.label} / ${weakness.questionCount}問`,
      progress,
      kind: weaknessTriageKind(weakness),
      action: "weakness",
      attrs: `data-weakness-key="${escapeHtml(weakness.key)}"`,
    });
  } else {
    rows.push({
      label: "W",
      title: "苦手確認",
      value: "OK",
      detail: "目立つ苦手はありません",
      progress: 100,
      kind: "strong",
      disabled: true,
      complete: true,
    });
  }

  const newProgress = studyCheckpointProgress(today.answers.questions, DAILY_QUESTION_TARGET);
  rows.push({
    label: "N",
    title: "新しい問題",
    value: `${today.answers.questions}/${DAILY_QUESTION_TARGET}`,
    detail:
      newProgress >= 100
        ? `今日 ${today.answers.questions}問`
        : `あと${Math.max(0, DAILY_QUESTION_TARGET - today.answers.questions)}問で日次目標`,
    progress: newProgress,
    kind: studyCheckpointKind(newProgress, "neutral"),
    action: "continue",
    attrs: "",
    complete: newProgress >= 100,
  });

  return rows;
}

function studyCheckpointCoach(rows) {
  const open = rows.filter((row) => !row.complete && !row.disabled);
  if (!open.length) return "今日の優先タスクは完了です。余裕があれば次の問題へ進めます";
  const urgent = open.find((row) => row.kind === "danger") || open[0];
  if (urgent.kind === "danger") return `まず${shortText(urgent.title, 16)}から始めましょう`;
  return `${shortText(urgent.title, 16)}を1セット進めましょう`;
}

function studyCheckpointRowHtml(row) {
  const disabled = row.disabled || row.complete;
  return `
    <button
      class="study-checkpoint-row ${escapeHtml(row.kind)}${row.complete ? " complete" : ""}"
      type="button"
      ${!disabled && row.action ? `data-study-action="${escapeHtml(row.action)}"` : ""}
      ${!disabled ? row.attrs || "" : ""}
      ${disabled ? "disabled" : ""}
      style="--checkpoint-progress: ${Math.max(4, Math.round(clamp(row.progress, 0, 100)))}%"
      title="${escapeHtml(`${row.title} / ${row.detail}`)}"
    >
      <span>${escapeHtml(row.label)}</span>
      <div>
        <strong>${escapeHtml(row.title)}</strong>
        <small>${escapeHtml(row.detail)}</small>
      </div>
      <b>${escapeHtml(row.value)}</b>
      <i aria-hidden="true"></i>
    </button>
  `;
}

function studyCheckpointPanelHtml(reviewSummaries, reviewTotals, weaknesses, today) {
  const rows = studyCheckpointRows(reviewSummaries, reviewTotals, weaknesses, today);
  const completed = rows.filter((row) => row.complete).length;
  const overall = Math.round(rows.reduce((sum, row) => sum + clamp(row.progress, 0, 100), 0) / Math.max(1, rows.length));
  const todayReview = reviewSessionStatsByDayMap().get(today.dayKey) || { sessions: 0, questions: 0, correct: 0, wrong: 0 };
  return `
    <div class="study-checkpoint-head">
      <div>
        <span>今日の確認</span>
        <strong>${completed}/${rows.length}完了</strong>
      </div>
      <small>${escapeHtml(studyCheckpointCoach(rows))}</small>
    </div>
    <div class="study-checkpoint-score ${overall >= 85 ? "strong" : overall >= 48 ? "warm" : "danger"}" style="--checkpoint-score: ${Math.max(4, overall)}%">
      <span>到達度</span>
      <strong>${overall}%</strong>
      <i aria-hidden="true"></i>
    </div>
    <div class="study-checkpoint-grid">
      ${rows.map(studyCheckpointRowHtml).join("")}
    </div>
    <div class="study-checkpoint-foot">
      <span>回答 <b>${today.answers.questions}問</b></span>
      <span>復習 <b>${todayReview.questions}問</b></span>
      <span>時間 <b>${escapeHtml(formatStudyDuration(today.durationMs + todayReview.durationMs))}</b></span>
    </div>
  `;
}

function studyRouteCourseCandidate(reviewSummaries) {
  const readiness = examReadinessRows(reviewSummaries)
    .filter((row) => row.total && row.answeredPercent < 100)
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.answeredPercent - b.answeredPercent ||
        b.total - a.total ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    );
  if (readiness[0]) return readiness[0];
  return studyCourseMatrixSummaries(reviewSummaries)
    .filter((row) => row.total)
    .sort(
      (a, b) =>
        a.answeredPercent - b.answeredPercent ||
        b.pressure - a.pressure ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    )[0] || null;
}

function studyRouteStepSignature(step) {
  return [step.action, step.key || step.courseId || step.weaknessKey || step.scheduleKey || step.mode || step.title].join(":");
}

function studyRoutePushStep(steps, seen, step) {
  if (!step) return;
  const signature = studyRouteStepSignature(step);
  if (seen.has(signature)) return;
  seen.add(signature);
  steps.push(step);
}

function studyRouteSteps(reviewSummaries, reviewTotals, weaknesses, today) {
  const steps = [];
  const seen = new Set();
  const recovery = reviewRecoveryData();
  const schedule = reviewUpcomingScheduleData(reviewTotals.entries, reviewTotals.todayKey, 14);
  const todayBucket = schedule.days[0] || null;
  const nextBucket = schedule.days.find((bucket) => bucket.count && bucket.key !== reviewTotals.todayKey) || null;
  const firstSchedule = schedule.overdue.count
    ? {
        key: "overdue",
        title: "期限切れ復習",
        value: `${schedule.overdue.count}問`,
        detail: "期限を過ぎた問題から",
        kind: "danger",
        action: "schedule",
        scheduleKey: "overdue",
        attrs: `data-review-schedule-key="overdue"`,
        count: schedule.overdue.count,
      }
    : todayBucket?.count
      ? {
          key: todayBucket.key,
          title: "今日の復習",
          value: `${todayBucket.count}問`,
          detail: "今日の予定分から",
          kind: "warm",
          action: "schedule",
          scheduleKey: todayBucket.key,
          attrs: `data-review-schedule-key="${escapeHtml(todayBucket.key)}"`,
          count: todayBucket.count,
        }
      : nextBucket
        ? {
            key: nextBucket.key,
            title: "先取り復習",
            value: `${nextBucket.count}問`,
            detail: `${nextBucket.label}の予定を先に解く`,
            kind: "strong",
            action: "schedule",
            scheduleKey: nextBucket.key,
            attrs: `data-review-schedule-key="${escapeHtml(nextBucket.key)}"`,
            count: nextBucket.count,
          }
        : null;

  if (recovery.topGroup) {
    studyRoutePushStep(steps, seen, {
      title: "解き直し",
      value: `${Math.min(recovery.topGroup.entries.length, normalizeReviewSession({ ...state.reviewSession, mode: "weak" }).size)}問`,
      detail: `${recovery.topGroup.courseName} / 残り ${recovery.unresolvedCount}問`,
      kind: "danger",
      action: "recovery",
      courseId: recovery.topGroup.courseId,
      attrs: `data-review-recovery-course="${escapeHtml(recovery.topGroup.courseId)}"`,
      count: recovery.topGroup.entries.length,
    });
  }

  studyRoutePushStep(steps, seen, firstSchedule);

  const weakness = weaknesses[0] || null;
  if (weakness) {
    studyRoutePushStep(steps, seen, {
      title: "苦手確認",
      value: `${weakness.questionCount}問`,
      detail: `${weakness.label} / 誤答${weakness.wrongRate}%`,
      kind: "danger",
      action: "weakness",
      weaknessKey: weakness.key,
      attrs: `data-weakness-key="${escapeHtml(weakness.key)}"`,
      count: weakness.questionCount,
    });
  }

  const sprint = [5, 10, 25].map((minutes) => reviewSprintPlan(reviewSummaries, minutes)).find((plan) => !plan.disabled);
  if (sprint) {
    studyRoutePushStep(steps, seen, {
      title: `${sprint.minutes}分だけ復習`,
      value: `${sprint.count}問`,
      detail: `${sprint.courseName} / ${reviewSessionModeLabel(sprint.mode)}`,
      kind: sprint.kind === "idle" ? "neutral" : sprint.kind,
      action: "pace",
      courseId: sprint.courseId,
      mode: sprint.mode,
      attrs: `data-review-pace-course="${escapeHtml(sprint.courseId)}" data-review-pace-size="${sprint.size}" data-review-pace-mode="${escapeHtml(sprint.mode)}"`,
      count: sprint.count,
    });
  }

  const course = studyRouteCourseCandidate(reviewSummaries);
  if (course) {
    const readiness = course.score == null ? `${course.answeredPercent}%` : `準備${course.score}%`;
    const remainingCourseQuestions = Math.max(1, (course.total || 0) - (course.answered || 0));
    const routeQuestionTarget = Math.max(5, DAILY_QUESTION_TARGET - today.answers.questions);
    studyRoutePushStep(steps, seen, {
      title: "新しい問題",
      value: `${course.answered}/${course.total}`,
      detail: `${course.courseName} / ${readiness}`,
      kind: course.kind || (course.status === "danger" ? "danger" : course.status === "warm" ? "warm" : "strong"),
      action: "course",
      courseId: course.courseId,
      attrs: `data-study-route-course="${escapeHtml(course.courseId)}"`,
      count: Math.min(routeQuestionTarget, remainingCourseQuestions),
    });
  }

  if (!steps.length) {
    steps.push({
      title: "今の問題を続ける",
      value: `${today.effortPercent}%`,
      detail: "復習予定は少なめ",
      kind: "strong",
      action: "continue",
      attrs: "",
      count: Math.max(1, DAILY_QUESTION_TARGET - today.answers.questions),
    });
  }
  return steps.slice(0, 4);
}

function studyRouteCoach(steps, today, reviewTotals) {
  if (!steps.length) return "回答履歴が増えると、おすすめ順を表示します";
  if (steps.some((step) => step.kind === "danger")) return "まず優先度の高い項目から始めましょう";
  if (reviewTotals.next7Count) return "復習予定は少なめです。余裕があれば先取りできます";
  if (today.effortPercent < 50) return "短い復習から始めて、そのあと新しい問題へ進みます";
  return "今日は順調です。軽く復習してから次へ進めます";
}

function studyRoutePanelHtml(reviewSummaries, reviewTotals, weaknesses, today) {
  const steps = studyRouteSteps(reviewSummaries, reviewTotals, weaknesses, today);
  const totalCount = steps.reduce((sum, step) => sum + (Number(step.count) || 0), 0);
  const secondsPerQuestion = reviewAverageSecondsPerQuestion();
  const estimatedText = reviewEstimateDurationText(Math.min(totalCount, 40), secondsPerQuestion);
  const maxCount = Math.max(1, ...steps.map((step) => Number(step.count) || 0));
  return `
    <div class="study-route-head">
      <div>
        <span>おすすめ順</span>
        <strong>${steps.length ? `${steps.length}件` : "候補なし"}</strong>
      </div>
      <small>${escapeHtml(studyRouteCoach(steps, today, reviewTotals))}</small>
    </div>
    <div class="study-route-timeline">
      ${steps
        .map((step, index) => {
          const load = Math.max(8, Math.round(((Number(step.count) || 0) / maxCount) * 100));
          return `
            <button
              class="study-route-step ${escapeHtml(step.kind || "neutral")}"
              type="button"
              data-study-action="${escapeHtml(step.action)}"
              ${step.attrs || ""}
              style="--route-load: ${load}%"
              title="${escapeHtml(`${step.title} / ${step.detail}`)}"
            >
              <span>${index + 1}</span>
              <div>
                <strong>${escapeHtml(step.title)}</strong>
                <small>${escapeHtml(step.detail)}</small>
              </div>
              <b>${escapeHtml(step.value)}</b>
              <i aria-hidden="true"></i>
            </button>
          `;
        })
        .join("")}
    </div>
    <div class="study-route-footer">
      <span>見込み <b>${escapeHtml(estimatedText)}</b></span>
      <span>対象 <b>${totalCount || 0}問</b></span>
      <span>今日 <b>${today.answers.questions}問</b></span>
    </div>
  `;
}

function normalizeStudySummaryStep(step, fallback = {}) {
  return {
    title: "今の問題へ",
    value: "開始",
    detail: "学習を続ける",
    kind: "neutral",
    action: "continue",
    attrs: "",
    ...fallback,
    ...(step || {}),
  };
}

function fallbackStudySummaryStep() {
  return {
    title: "今の問題を続ける",
    value: "開始",
    detail: "復習予定は少なめ",
    kind: "strong",
    action: "continue",
    attrs: "",
  };
}

function studySummaryHeroFocusText(primaryStep, { reviewTotals, today, recovery, weakness }) {
  const step = normalizeStudySummaryStep(primaryStep);
  if (step.action === "recovery" && recovery.unresolvedCount) {
    return `未回収ミス ${recovery.unresolvedCount}問が今日の最大ボトルネックです。`;
  }
  if (step.action === "schedule") {
    if (step.scheduleKey === "overdue" || step.key === "overdue") {
      return `期限切れ復習 ${reviewTotals.overdueCount}問が残っています。`;
    }
    if (reviewTotals.dueCount) {
      return `今日の復習予定は ${reviewTotals.dueCount}問です。`;
    }
    return "復習は軽め。新規問題へ進みましょう。";
  }
  if (step.action === "weakness" && weakness) {
    return `${weakness.label}で正答率が下がっています。`;
  }
  if (step.action === "pace") {
    return "短時間で終わる復習セットを先に処理できます。";
  }
  if (today.answers.questions < DAILY_QUESTION_TARGET) {
    return `今日の目標まであと${Math.max(0, DAILY_QUESTION_TARGET - today.answers.questions)}問です。現在の問題から進めます。`;
  }
  return "今日の目標は達成済みです。余裕があれば次へ進めます。";
}

function studySummaryHeroPriorityLabel(kind) {
  if (kind === "danger") return "優先度 高";
  if (kind === "warm" || kind === "weak") return "今日対応";
  if (kind === "strong") return "順調";
  return "確認";
}

function studySummaryHeroActionTitle(primaryStep, { reviewTotals, today, recovery, weakness }) {
  const step = normalizeStudySummaryStep(primaryStep);
  if (step.action === "recovery" && recovery.unresolvedCount) {
    return "解き直しから始める";
  }
  if (step.action === "schedule") {
    if (step.scheduleKey === "overdue" || step.key === "overdue") {
      return "期限切れの復習を片付ける";
    }
    if (reviewTotals.dueCount) {
      return "今日の復習を進める";
    }
    return "新規問題へ進める";
  }
  if (step.action === "weakness" && weakness) {
    return `${weakness.label}を確認`;
  }
  if (step.action === "pace") {
    return "短時間セットを進める";
  }
  if (today.answers.questions < DAILY_QUESTION_TARGET) {
    return "今日の目標まで進める";
  }
  return "先取りで次へ進む";
}

function studySummaryHeroButtonHtml(step, { primary = false, index = 1 } = {}) {
  const normalized = normalizeStudySummaryStep(step);
  return `
    <button
      class="${primary ? "study-summary-primary-action" : "study-summary-next-action"} ${escapeHtml(normalized.kind)}"
      type="button"
      data-study-action="${escapeHtml(normalized.action)}"
      ${normalized.attrs || ""}
      title="${escapeHtml(`${normalized.title} / ${normalized.detail}`)}"
    >
      <span>${primary ? "START" : `${index}`}</span>
      <strong>${escapeHtml(normalized.title)}</strong>
      <b>${escapeHtml(normalized.value)}</b>
      <small>${escapeHtml(normalized.detail)}</small>
    </button>
  `;
}

function studySummaryHeroMetricHtml({ label, value, detail, kind = "neutral" }) {
  return `
    <div class="study-summary-hero-metric ${escapeHtml(kind)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function studySummaryHeroCheckpointState(reviewSummaries, reviewTotals, weaknesses, today) {
  const checkpointRows = studyCheckpointRows(reviewSummaries, reviewTotals, weaknesses, today);
  const completedCount = checkpointRows.filter((row) => row.complete).length;
  const urgentCheckpoint = checkpointRows.find((row) => !row.complete && !row.disabled && row.kind === "danger")
    || checkpointRows.find((row) => !row.complete && !row.disabled);
  return { rows: checkpointRows, completedCount, urgentCheckpoint };
}

function studySummaryHeroMetricRows({ reviewTotals, today, todayReview, recovery, weakness, accuracy, completedCount, checkpointCount, streak }) {
  const reviewKind = reviewTotals.overdueCount ? "danger" : reviewTotals.dueCount ? "warm" : "strong";
  const effortKind = today.effortPercent >= 100 ? "strong" : today.effortPercent >= 50 ? "warm" : "neutral";
  const remainingToday = Math.max(0, DAILY_QUESTION_TARGET - today.answers.questions);
  return [
    {
      kind: effortKind,
      label: "今日",
      value: `${today.answers.questions}問`,
      detail: remainingToday ? `あと${remainingToday}問` : "目標達成",
    },
    {
      kind: reviewKind,
      label: "復習予定",
      value: `${reviewTotals.dueCount}問`,
      detail: reviewTotals.overdueCount ? `期限切れ ${reviewTotals.overdueCount}問` : `実施 ${todayReview.questions}問`,
    },
    {
      kind: recovery.unresolvedCount ? "danger" : "strong",
      label: "解き直し",
      value: recovery.unresolvedCount ? `${recovery.unresolvedCount}問` : "なし",
      detail: recovery.unresolvedCount ? `完了 ${recovery.recovered}問` : "残りなし",
    },
    {
      kind: weakness ? weaknessTriageKind(weakness) : "strong",
      label: "苦手",
      value: weakness ? `${weakness.questionCount}問` : "なし",
      detail: weakness ? shortText(weakness.label, 18) : `連続 ${streak.label}`,
    },
  ];
}

function studySummaryHeroViewModel(reviewSummaries, reviewTotals, weaknesses, today, streak) {
  const routeSteps = studyRouteSteps(reviewSummaries, reviewTotals, weaknesses, today);
  const primaryStep = normalizeStudySummaryStep(routeSteps[0], fallbackStudySummaryStep());
  const checkpoint = studySummaryHeroCheckpointState(reviewSummaries, reviewTotals, weaknesses, today);
  const todayReview = reviewSessionStatsByDayMap().get(today.dayKey) || { questions: 0, correct: 0, wrong: 0 };
  const recovery = reviewRecoveryData();
  const accuracy = studyAccuracyPercent(today.answers);
  const weakness = weaknesses[0] || null;
  const metrics = studySummaryHeroMetricRows({
    reviewTotals,
    today,
    todayReview,
    recovery,
    weakness,
    accuracy,
    completedCount: checkpoint.completedCount,
    checkpointCount: checkpoint.rows.length,
    streak,
  });
  const heroKind = primaryStep.kind || checkpoint.urgentCheckpoint?.kind || "neutral";
  return {
    primaryStep,
    nextSteps: routeSteps.slice(1, 4).map((step) => normalizeStudySummaryStep(step)),
    metrics,
    actionTitle: studySummaryHeroActionTitle(primaryStep, { reviewTotals, today, recovery, weakness }),
    focusText: studySummaryHeroFocusText(primaryStep, { reviewTotals, today, recovery, weakness }),
    heroKind,
    priorityLabel: studySummaryHeroPriorityLabel(heroKind),
  };
}

function studySummaryHeroMetricsHtml(metrics) {
  return metrics.map(studySummaryHeroMetricHtml).join("");
}

function studySummaryHeroNextActionsHtml(nextSteps) {
  return nextSteps.length
    ? nextSteps.map((step, index) => studySummaryHeroButtonHtml(step, { index: index + 2 })).join("")
    : `<div class="study-summary-next-empty">次の候補はありません。まず上の項目から始めましょう。</div>`;
}

function studySummaryHeroHtml(reviewSummaries, reviewTotals, weaknesses, today, streak) {
  const view = studySummaryHeroViewModel(reviewSummaries, reviewTotals, weaknesses, today, streak);
  return `
    <section class="study-summary-hero-card ${escapeHtml(view.heroKind)}" aria-label="今日の最優先">
      <div class="study-summary-consulting-head">
        <span>今日のスタート</span>
        <em>${escapeHtml(view.priorityLabel)}</em>
      </div>
      <div class="study-summary-hero-main">
        <div class="study-summary-hero-copy">
          <span>最短ルート</span>
          <strong>${escapeHtml(view.actionTitle)}</strong>
          <p>${escapeHtml(view.focusText)}</p>
        </div>
        ${studySummaryHeroButtonHtml(view.primaryStep, { primary: true })}
      </div>
      <div class="study-summary-hero-metrics" aria-label="状況">
        ${studySummaryHeroMetricsHtml(view.metrics)}
      </div>
      <div class="study-summary-next-actions" aria-label="次にやること">
        ${studySummaryHeroNextActionsHtml(view.nextSteps)}
      </div>
    </section>
  `;
}

function studyEfficiencyMetricHtml({ label, value, detail, percent = 0, kind = "neutral" }) {
  const width = Math.round(clamp(Number(percent) || 0, 0, 100));
  return `
    <div class="study-efficiency-metric ${escapeHtml(kind)}" style="--efficiency-width: ${width}%">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
      <i aria-hidden="true"></i>
    </div>
  `;
}

function studyEfficiencyAction(reviewTotals, weaknesses, today) {
  const recovery = reviewRecoveryData();
  if (recovery.topGroup) {
    return {
      kind: "danger",
      label: "GO",
      title: "解き直し",
      value: `${Math.min(recovery.topGroup.entries.length, normalizeReviewSession({ ...state.reviewSession, mode: "weak" }).size)}問`,
      detail: `${recovery.topGroup.courseName} / 残り ${recovery.unresolvedCount}問`,
      action: "recovery",
      attrs: `data-review-recovery-course="${escapeHtml(recovery.topGroup.courseId)}"`,
    };
  }

  const schedule = reviewUpcomingScheduleData(reviewTotals.entries, reviewTotals.todayKey, 7);
  const todayBucket = schedule.days[0];
  const nextBucket = schedule.days.find((bucket) => bucket.count && bucket.key !== reviewTotals.todayKey) || null;
  if (schedule.overdue.count || todayBucket?.count || nextBucket?.count) {
    const target = schedule.overdue.count
      ? { key: "overdue", title: "期限切れ復習", count: schedule.overdue.count, kind: "danger", detail: "期限を過ぎた問題から" }
      : todayBucket?.count
        ? { key: todayBucket.key, title: "今日の復習", count: todayBucket.count, kind: "warm", detail: "今日の予定分を解く" }
        : { key: nextBucket.key, title: "先取り復習", count: nextBucket.count, kind: "strong", detail: `${nextBucket.label}の予定を先に解く` };
    return {
      kind: target.kind,
      label: "GO",
      title: target.title,
      value: `${target.count}問`,
      detail: target.detail,
      action: "schedule",
      attrs: `data-review-schedule-key="${escapeHtml(target.key)}"`,
    };
  }

  const weakness = weaknesses[0] || null;
  if (weakness) {
    return {
      kind: "danger",
      label: "GO",
      title: "苦手確認",
      value: `${weakness.questionCount}問`,
      detail: `${weakness.label} / 誤答${weakness.wrongRate}%`,
      action: "weakness",
      attrs: `data-weakness-key="${escapeHtml(weakness.key)}"`,
    };
  }

  const pacePlan = studyPaceReviewPlan(reviewCurriculumSummaries(), today);
  if (pacePlan) {
    return {
      kind: "strong",
      label: "GO",
      title: "短い復習",
      value: `${pacePlan.size}問`,
      detail: `${pacePlan.courseName} / 25分以内`,
      action: "pace",
      attrs: `data-review-pace-course="${escapeHtml(pacePlan.courseId)}" data-review-pace-size="${pacePlan.size}" data-review-pace-mode="${escapeHtml(pacePlan.mode)}"`,
    };
  }

  return {
    kind: "neutral",
    label: "GO",
    title: "新規を進める",
    value: "今ここ",
    detail: "回答履歴を増やすと精度が上がります",
    action: "continue",
    attrs: "",
  };
}

function studyEfficiencyCoach({ score, scoreKnown, recovery, pressure, reviewAccuracy, questionsPerHour }) {
  if (!scoreKnown) return "回答か復習を1セット入れると、効率の目安が出ます";
  if (recovery.unresolvedCount) return `解き直しが${recovery.unresolvedCount}問残っています。先に終えると復習を進めやすくなります`;
  if (pressure >= 70) return "復習予定が多めです。期限が近い問題から始めましょう";
  if (reviewAccuracy != null && reviewAccuracy < 70) return "復習の正答率が低めです。5問だけ解いて原因を見ましょう";
  if (score >= 78) return "学習効率は良好です。余裕があれば先取り復習か新しい問題へ進めます";
  if (questionsPerHour != null && questionsPerHour >= 24) return "解く速度は出ています。解き直しを混ぜると定着しやすくなります";
  return "今日の1セットが、次のおすすめを作る材料になります";
}

function studyEfficiencyPanelHtml(studySnapshots, reviewTotals, weaknesses, today) {
  const reviewHistory = normalizeReviewSessionHistory(state.reviewSessionHistory);
  const recentStartedAt = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentReview = reviewHistory.filter((session) => session.completedAt >= recentStartedAt);
  const recentReviewTotal = recentReview.reduce((sum, session) => sum + session.total, 0);
  const recentReviewCorrect = recentReview.reduce((sum, session) => sum + session.correct, 0);
  const recentReviewWrong = recentReview.reduce((sum, session) => sum + session.wrong, 0);
  const recentReviewDuration = recentReview.reduce((sum, session) => sum + session.durationMs, 0);
  const reviewAccuracy = recentReviewTotal ? Math.round((recentReviewCorrect / recentReviewTotal) * 100) : null;
  const recovery = reviewRecoveryData(reviewHistory);
  const recoveryDenominator = recovery.recovered + recovery.unresolvedCount;
  const recoveryRate = recoveryDenominator ? Math.round((recovery.recovered / recoveryDenominator) * 100) : null;
  const averageSeconds = reviewAverageSecondsPerQuestion(recentReview.length ? recentReview : reviewHistory);
  const estimatedQuestions = averageSeconds
    ? Math.max(1, Math.min(40, Math.floor((25 * 60) / averageSeconds)))
    : normalizeReviewSession(state.reviewSession).size;
  const studyQuestions = studySnapshots.reduce((sum, snapshot) => sum + snapshot.answers.questions, 0);
  const studyDuration = studySnapshots.reduce((sum, snapshot) => sum + snapshot.durationMs, 0);
  const totalQuestions = studyQuestions + recentReviewTotal;
  const totalDuration = studyDuration + recentReviewDuration;
  const questionsPerHour = totalDuration ? Math.round(totalQuestions / (totalDuration / (60 * 60 * 1000))) : null;
  const pressure = reviewLoadPressure(reviewTotals);
  const scoreKnown = Boolean(totalQuestions || reviewHistory.length || recoveryDenominator);
  const score = scoreKnown
    ? Math.round(
        (recoveryRate ?? 58) * 0.34 +
          (reviewAccuracy ?? studyAccuracyPercent(today.answers) ?? 58) * 0.28 +
          clamp(100 - pressure, 0, 100) * 0.22 +
          clamp(today.effortPercent, 0, 100) * 0.16
      )
    : null;
  const kind = !scoreKnown ? "neutral" : score >= 76 ? "strong" : score >= 54 ? "warm" : "danger";
  const totalFlow = Math.max(1, studyQuestions + recentReviewTotal + recovery.unresolvedCount);
  const studyFlow = clamp((studyQuestions / totalFlow) * 100, 6, 88);
  const reviewFlow = clamp((recentReviewTotal / totalFlow) * 100, recentReviewTotal ? 6 : 0, 88);
  const recoveryFlow = clamp((recovery.unresolvedCount / totalFlow) * 100, recovery.unresolvedCount ? 6 : 0, 88);
  const coach = studyEfficiencyCoach({ score, scoreKnown, recovery, pressure, reviewAccuracy, questionsPerHour });
  const action = studyEfficiencyAction(reviewTotals, weaknesses, today);

  return `
    <div class="study-efficiency-head">
      <div>
        <span>学習効率</span>
        <strong>${scoreKnown ? `効率スコア ${score}%` : "計測中"}</strong>
      </div>
      <small>${escapeHtml(coach)}</small>
    </div>
    <div
      class="study-efficiency-flow ${escapeHtml(kind)}"
      style="--study-flow: ${studyFlow}%; --review-flow: ${reviewFlow}%; --recovery-flow: ${recoveryFlow}%"
      aria-label="直近7日の学習・復習・解き直しの比率"
    >
      <span data-label="学習"></span>
      <span data-label="復習"></span>
      <span data-label="解き直し"></span>
    </div>
    <div class="study-efficiency-grid">
      ${studyEfficiencyMetricHtml({
        label: "25分換算",
        value: `${estimatedQuestions}問`,
        detail: averageSeconds ? `平均 ${averageSeconds}秒/問` : "履歴から推定中",
        percent: Math.min(100, (estimatedQuestions / 25) * 100),
        kind: estimatedQuestions >= 20 ? "strong" : estimatedQuestions >= 10 ? "warm" : "neutral",
      })}
      ${studyEfficiencyMetricHtml({
        label: "復習精度",
        value: reviewAccuracy == null ? "--" : `${reviewAccuracy}%`,
        detail: recentReviewTotal ? `7日 ${recentReviewTotal}問 / ミス${recentReviewWrong}` : "復習完走待ち",
        percent: reviewAccuracy ?? 0,
        kind: reviewAccuracy == null ? "neutral" : reviewAccuracy >= 80 ? "strong" : reviewAccuracy >= 60 ? "warm" : "danger",
      })}
      ${studyEfficiencyMetricHtml({
        label: "解き直し率",
        value: recoveryRate == null ? "--" : `${recoveryRate}%`,
        detail: recoveryDenominator ? `完了${recovery.recovered} / 残り${recovery.unresolvedCount}` : "ミス履歴なし",
        percent: recoveryRate ?? 0,
        kind: recovery.unresolvedCount ? "danger" : recoveryRate != null ? "strong" : "neutral",
      })}
      ${studyEfficiencyMetricHtml({
        label: "処理密度",
        value: questionsPerHour == null ? "--" : `${questionsPerHour}問/h`,
        detail: `${studyQuestions}問学習 + 復習${recentReviewTotal}問`,
        percent: questionsPerHour == null ? 0 : Math.min(100, (questionsPerHour / 36) * 100),
        kind: questionsPerHour == null ? "neutral" : questionsPerHour >= 24 ? "strong" : questionsPerHour >= 12 ? "warm" : "neutral",
      })}
    </div>
    <div class="study-efficiency-next">
      ${studyActionPlanButtonHtml(action)}
    </div>
  `;
}

function studySummaryBarStatHtml({ kind = "neutral", label, value, detail }) {
  return `
    <div class="study-summary-bar-stat ${escapeHtml(kind)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function studySummaryRecentReviewAccuracy(limit = 5) {
  const sessions = normalizeReviewSessionHistory(state.reviewSessionHistory).slice(0, Math.max(1, limit));
  const total = sessions.reduce((sum, session) => sum + Number(session.total || 0), 0);
  const correct = sessions.reduce((sum, session) => sum + Number(session.correct || 0), 0);
  const wrong = sessions.reduce((sum, session) => sum + Number(session.wrong || 0), 0);
  return {
    sessions,
    total,
    wrong,
    accuracy: total ? Math.round((correct / total) * 100) : null,
  };
}

function studySummaryBarStatsHtml(entries, reviewSummaries, todayKey, todayMs, todayAnswerStats) {
  const durationByDay = studyDurationByDayMap(entries);
  const answerByDay = answerStatsByDayMap();
  const streak = studyStreakInfo(durationByDay, answerByDay, todayKey);
  const reviewTotals = reviewCurveTotals(reviewSummaries, todayKey);
  const weaknesses = learningWeaknessSummaries(1);
  const recentReview = studySummaryRecentReviewAccuracy();
  const todayPercent = effortPercent(todayMs, todayAnswerStats);
  const todayKind = studyEffortLevel(todayPercent, todayMs, todayAnswerStats);
  const reviewKind = reviewTotals.overdueCount
    ? "danger"
    : reviewTotals.dueCount
      ? "warm"
      : reviewTotals.next7Count
        ? "neutral"
        : "strong";
  const weakness = weaknesses[0] || null;
  const weaknessKind = weakness
    ? weakness.kind === "danger"
      ? "danger"
      : "warm"
    : "strong";
  const reviewAccuracyKind =
    recentReview.accuracy == null
      ? "idle"
      : recentReview.accuracy >= 85
        ? "strong"
        : recentReview.accuracy >= 65
          ? "warm"
          : "danger";
  return [
    studySummaryBarStatHtml({
      kind: todayKind,
      label: "今日",
      value: `${todayAnswerStats.questions}問`,
      detail: `${formatStudyDuration(todayMs)} / ${todayPercent}%`,
    }),
    studySummaryBarStatHtml({
      kind: streak.count >= 7 ? "strong" : streak.count ? "warm" : "idle",
      label: "継続",
      value: streak.label,
      detail: streak.detail,
    }),
    studySummaryBarStatHtml({
      kind: reviewKind,
      label: "復習",
      value: `${reviewTotals.dueCount}問`,
      detail: reviewTotals.overdueCount ? `遅れ ${reviewTotals.overdueCount}問` : `7日内 ${reviewTotals.next7Count}問`,
    }),
    studySummaryBarStatHtml({
      kind: weaknessKind,
      label: "弱点",
      value: weakness ? `${weakness.questionCount}問` : "なし",
      detail: weakness ? shortText(weakness.label, 18) : "安定中",
    }),
    studySummaryBarStatHtml({
      kind: reviewAccuracyKind,
      label: "直近",
      value: recentReview.accuracy == null ? "--" : `${recentReview.accuracy}%`,
      detail: recentReview.total ? `${recentReview.total}問 / ミス${recentReview.wrong}` : "復習待ち",
    }),
  ].join("");
}

function renderStudySummaryBarStats(entries, reviewSummaries, todayKey, todayMs, todayAnswerStats) {
  if (!els.studySummaryBarStats) return;
  els.studySummaryBarStats.innerHTML = studySummaryBarStatsHtml(
    entries,
    reviewSummaries,
    todayKey,
    todayMs,
    todayAnswerStats
  );
}

function renderStudyDashboard(entries, reviewSummaries = reviewCurriculumSummaries()) {
  const todayKey = localDayKey();
  const durationByDay = studyDurationByDayMap(entries);
  const answerByDay = answerStatsByDayMap();
  const today = studyDaySnapshot(todayKey, durationByDay, answerByDay);
  const yesterday = studyDaySnapshot(addDaysToLocalDayKey(todayKey, -1), durationByDay, answerByDay);
  const streak = studyStreakInfo(durationByDay, answerByDay, todayKey);
  const reviewTotals = reviewCurveTotals(reviewSummaries, todayKey);
  const weaknesses = learningWeaknessSummaries(6);
  const accuracy = studyAccuracyPercent(today.answers);
  const trend = today.effortPercent - yesterday.effortPercent;

  if (els.studySummaryHero) {
    els.studySummaryHero.innerHTML = studySummaryHeroHtml(reviewSummaries, reviewTotals, weaknesses, today, streak);
  }

  if (els.studyInsightGrid) {
    els.studyInsightGrid.innerHTML = [
      insightCardHtml({
        kind: streak.count >= 7 ? "strong" : streak.count ? "warm" : "idle",
        label: "連続",
        value: streak.label,
        detail: streak.detail,
      }),
      insightCardHtml({
        kind: reviewTotals.overdueCount ? "danger" : reviewTotals.dueCount ? "warm" : "strong",
        label: "今日の復習",
        value: `${reviewTotals.dueCount}問`,
        detail: reviewTotals.overdueCount ? `遅れ ${reviewTotals.overdueCount}問` : `7日内 ${reviewTotals.next7Count}問`,
      }),
      insightCardHtml({
        kind: weaknesses.length ? "danger" : "strong",
        label: "弱点",
        value: weaknesses[0]?.label || "なし",
        detail: weaknesses[0] ? `優先 ${weaknesses[0].questionCount}問` : "今の調子でOK",
      }),
      insightCardHtml({
        kind: trend > 0 ? "strong" : trend < 0 ? "warm" : "neutral",
        label: "今日の精度",
        value: accuracy == null ? "--" : `${accuracy}%`,
        detail: trend === 0 ? "昨日比 ±0" : `昨日比 ${trend > 0 ? "+" : ""}${trend}%`,
      }),
    ].join("");
  }

  if (els.studyActionPlan) {
    const studySnapshots = recentStudyDayKeys(7, todayKey).map((dayKey) => studyDaySnapshot(dayKey, durationByDay, answerByDay));
    els.studyActionPlan.innerHTML = studyActionPlanHtml(studySnapshots, reviewTotals, weaknesses, today, streak);
  }

  if (els.studyCheckpointPanel) {
    els.studyCheckpointPanel.innerHTML = studyCheckpointPanelHtml(reviewSummaries, reviewTotals, weaknesses, today);
  }

  if (els.studyRoutePanel) {
    els.studyRoutePanel.innerHTML = studyRoutePanelHtml(reviewSummaries, reviewTotals, weaknesses, today);
  }

  if (els.studyEfficiencyPanel) {
    const studySnapshots = recentStudyDayKeys(7, todayKey).map((dayKey) => studyDaySnapshot(dayKey, durationByDay, answerByDay));
    els.studyEfficiencyPanel.innerHTML = studyEfficiencyPanelHtml(studySnapshots, reviewTotals, weaknesses, today);
  }

  if (els.reviewCoachPanel) {
    els.reviewCoachPanel.innerHTML = reviewCoachPanelHtml(reviewSummaries, reviewTotals, weaknesses);
  }

  if (els.studyWeekStrip) {
    els.studyWeekStrip.innerHTML = weekStudyStripHtml(
      recentStudyDayKeys(7, todayKey).map((dayKey) => studyDaySnapshot(dayKey, durationByDay, answerByDay))
    );
  }

  if (els.studyRhythmMap) {
    els.studyRhythmMap.innerHTML = studyRhythmMapHtml(
      recentStudyDayKeys(14, todayKey).map((dayKey) => studyDaySnapshot(dayKey, durationByDay, answerByDay))
    );
  }

  if (els.studyContinuityPanel) {
    els.studyContinuityPanel.innerHTML = studyContinuityPanelHtml(
      recentStudyDayKeys(21, todayKey).map((dayKey) => studyDaySnapshot(dayKey, durationByDay, answerByDay)),
      reviewTotals,
      weaknesses,
      today
    );
  }

  if (els.studyForecastPanel) {
    const studySnapshots = recentStudyDayKeys(7, todayKey).map((dayKey) => studyDaySnapshot(dayKey, durationByDay, answerByDay));
    els.studyForecastPanel.innerHTML = studyForecastPanelHtml(studySnapshots, reviewTotals);
  }

  if (els.reviewOutlookPanel) {
    els.reviewOutlookPanel.innerHTML = reviewOutlookPanelHtml(reviewTotals);
  }

  if (els.reviewCalendarPanel) {
    els.reviewCalendarPanel.innerHTML = reviewCalendarPanelHtml(reviewTotals);
  }

  if (els.reviewDialPanel) {
    els.reviewDialPanel.innerHTML = reviewDialPanelHtml(reviewSummaries);
  }

  if (els.reviewSprintPanel) {
    els.reviewSprintPanel.innerHTML = reviewSprintPanelHtml(reviewSummaries);
  }

  if (els.reviewFocusPanel) {
    els.reviewFocusPanel.innerHTML = reviewFocusPanelHtml(reviewSummaries, weaknesses);
  }

  if (els.reviewMomentumPanel) {
    els.reviewMomentumPanel.innerHTML = reviewMomentumPanelHtml(reviewSummaries);
  }

  if (els.reviewCommandDeckPanel) {
    els.reviewCommandDeckPanel.innerHTML = reviewCommandDeckHtml(reviewSummaries);
  }

  if (els.reviewSetBlueprintPanel) {
    els.reviewSetBlueprintPanel.innerHTML = reviewSetBlueprintHtml(reviewSummaries);
  }

  if (els.reviewOutcomePanel) {
    els.reviewOutcomePanel.innerHTML = reviewOutcomePanelHtml(reviewSummaries);
  }

  if (els.reviewCoursePulsePanel) {
    els.reviewCoursePulsePanel.innerHTML = reviewCoursePulsePanelHtml(reviewSummaries);
  }

  if (els.reviewReturnPanel) {
    els.reviewReturnPanel.innerHTML = reviewReturnPanelHtml(reviewSummaries);
  }

  if (els.reviewNextQueuePanel) {
    els.reviewNextQueuePanel.innerHTML = reviewNextQueuePanelHtml(reviewSummaries);
  }

  if (els.reviewAgePanel) {
    const ageData = reviewAgeData();
    els.reviewAgePanel.className = `review-age-panel ${ageData.kind}`;
    els.reviewAgePanel.innerHTML = reviewAgePanelHtml(ageData);
  }

  if (els.reviewRecoveryBoard) {
    const recovery = reviewRecoveryData();
    const resolved = !recovery.sessions.length || recovery.unresolvedCount === 0;
    els.reviewRecoveryBoard.className = `review-recovery-panel ${resolved ? "clear" : "danger"}`;
    els.reviewRecoveryBoard.innerHTML = reviewRecoveryPanelContentHtml(recovery, { showEmpty: true });
  }

  if (els.studyCourseMatrix) {
    els.studyCourseMatrix.innerHTML = studyCourseMatrixHtml(reviewSummaries);
  }

  if (els.examReadinessPanel) {
    els.examReadinessPanel.innerHTML = examReadinessPanelHtml(reviewSummaries);
  }

  if (els.reviewMasteryTrack) {
    els.reviewMasteryTrack.innerHTML = reviewMasteryTrackHtml(reviewSummaries);
  }

  if (els.understandingSummary) {
    els.understandingSummary.innerHTML = understandingSummaryHtml();
  }

  if (els.weaknessPanel) {
    els.weaknessPanel.innerHTML = weaknessPanelHtml(weaknesses);
  }

  if (els.reviewSessionHistory) {
    els.reviewSessionHistory.innerHTML = reviewSessionHistoryHtml();
  }
}

function pomodoroPhaseText(phase) {
  if (phase === "longBreak") return "長休憩";
  if (phase === "shortBreak") return "休憩";
  return "集中";
}

function pomodoroPresetOptionText(preset) {
  return `${preset.label} ${pomodoroMinutes(preset.focusMs)}/${pomodoroMinutes(preset.shortBreakMs)}/${pomodoroMinutes(preset.longBreakMs)}`;
}

function renderPomodoroPresetOptions() {
  if (!els.pomodoroPreset) return;
  if (els.pomodoroPreset.options.length === POMODORO_PRESET_IDS.length) return;
  els.pomodoroPreset.replaceChildren(
    ...POMODORO_PRESET_IDS.map((presetId) => {
      const option = document.createElement("option");
      option.value = presetId;
      option.textContent = pomodoroPresetOptionText(POMODORO_PRESETS[presetId]);
      return option;
    }),
  );
}

function renderPomodoro() {
  const pomodoro = pomodoroState();
  const preset = pomodoroPreset(pomodoro.presetId);
  const remainingMs = pomodoroRemainingMs();
  const durationMs = pomodoroPhaseDuration(pomodoro.phase);
  const done = durationMs ? Math.max(0, Math.min(100, ((durationMs - remainingMs) / durationMs) * 100)) : 0;
  els.studyStopwatch?.classList.toggle("pomodoro-enabled", pomodoro.enabled);
  els.studyStopwatch?.classList.toggle("pomodoro-break", pomodoro.enabled && pomodoro.phase !== "focus");
  renderPomodoroPresetOptions();
  if (els.pomodoroPreset) {
    els.pomodoroPreset.value = pomodoro.presetId;
    els.pomodoroPreset.title = `${preset.label}: 作業${pomodoroMinutes(preset.focusMs)}分 / 休憩${pomodoroMinutes(preset.shortBreakMs)}分 / 長休憩${pomodoroMinutes(preset.longBreakMs)}分`;
  }
  if (els.pomodoroPhaseLabel) {
    els.pomodoroPhaseLabel.textContent = pomodoro.enabled
      ? `${pomodoroPhaseText(pomodoro.phase)} ${formatPomodoroClock(remainingMs)}`
      : "OFF";
  }
  if (els.pomodoroSetLabel) {
    els.pomodoroSetLabel.textContent = pomodoro.enabled
      ? `セット ${pomodoroSetPosition(pomodoro)}/${preset.longBreakEvery}`
      : "セット -";
  }
  if (els.pomodoroBar) {
    els.pomodoroBar.style.width = `${pomodoro.enabled ? done : 0}%`;
  }
  if (els.pomodoroToggle) {
    els.pomodoroToggle.classList.toggle("active", pomodoro.enabled);
    els.pomodoroToggle.setAttribute("aria-pressed", String(pomodoro.enabled));
    els.pomodoroToggle.title = pomodoro.enabled ? "ポモドーロをOFF" : "ポモドーロをON";
  }
  if (els.pomodoroToggleLabel) {
    els.pomodoroToggleLabel.textContent = pomodoro.enabled ? "ポモON" : "ポモ";
  }
  if (els.pomodoroSkip) {
    els.pomodoroSkip.disabled = !pomodoro.enabled;
  }
}

function renderStudyReport() {
  if (!els.studyReportList) return;
  if (!state.reviewCurveSummaryOpen) return;
  const entries = studyLogWithLiveEntries();
  const todayKey = localDayKey();
  const todayMs = sumStudyDuration(entries.filter((entry) => entry.day === todayKey));
  const todayAnswerStats = answerStatsForDay(todayKey);
  const totalMs = sumStudyDuration(entries);
  const reviewSummaries = reviewCurriculumSummaries();
  if (els.studyTodayValue) els.studyTodayValue.textContent = formatStudyDuration(todayMs);
  if (els.studyTotalValue) els.studyTotalValue.textContent = formatStudyDuration(totalMs);
  renderStudySummaryBarStats(entries, reviewSummaries, todayKey, todayMs, todayAnswerStats);
  renderDailyEffort(todayMs, todayAnswerStats);
  renderStudyDashboard(entries, reviewSummaries);
  if (els.studyRunningContext) {
    const context = normalizeStudyContext(state.stopwatch.activeContext) || (stopwatchRunning() ? currentStudyContext() : null);
    const pomodoro = pomodoroState();
    if (pomodoro.enabled && pomodoro.phase !== "focus" && pomodoroRunning()) {
      els.studyRunningContext.textContent = `${pomodoroPhaseText(pomodoro.phase)}中`;
    } else {
      els.studyRunningContext.textContent = stopwatchRunning() ? `記録中: ${studyContextLabel(context)}` : "停止中";
    }
  }
  els.studyReportTabs.forEach((tab) => {
    const active = tab.dataset.studyReport === state.studyReportMode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  const groups = groupedStudyReport(entries, state.studyReportMode);
  els.studyReportList.innerHTML = groups.length
    ? groups
        .map((group) => `
          <div class="study-report-row">
            <div>
              <strong>${escapeHtml(group.label)}</strong>
              <span>${escapeHtml(group.detail)}</span>
            </div>
            <time>${escapeHtml(formatStudyDuration(group.durationMs))}</time>
          </div>
        `)
        .join("")
    : `<div class="study-report-empty">ストップウォッチを開始すると記録されます</div>`;

  if (state.reviewCurveSummaryOpen) {
    renderReviewCurveSummary(reviewSummaries);
  }
}

function reviewCurveEntriesFromSummaries(summaries) {
  return summaries.flatMap((summary) => (Array.isArray(summary.entries) ? summary.entries : []));
}

function reviewStageCounts(entries) {
  return entries.reduce(
    (counts, entry) => {
      const stage = entry.stage || "future";
      counts[stage] = (counts[stage] || 0) + 1;
      return counts;
    },
    { overdue: 0, today: 0, soon: 0, future: 0 }
  );
}

function reviewCurveTotals(summaries, todayKey = localDayKey(), session = state.reviewSession) {
  const config = normalizeReviewSession(session);
  const entries = filterReviewSessionEntries(reviewCurveEntriesFromSummaries(summaries), config);
  const filteredCounts = config.excludeCalculation;
  const dueEntries = filteredCounts ? entries.filter((entry) => entry.due) : [];
  const todayEntries = filteredCounts ? entries.filter((entry) => entry.dueDay === todayKey) : [];
  const overdueEntries = filteredCounts ? entries.filter((entry) => entry.overdue) : [];
  const weakEntries = filteredCounts ? entries.filter(isWeakReviewEntry) : [];
  const futureEntries = filteredCounts ? entries.filter((entry) => (entry.stage || "future") === "future") : [];
  const next7Entries = filteredCounts
    ? entries.filter((entry) => Number(entry.dueInDays) >= 0 && Number(entry.dueInDays) <= 7)
    : [];
  const nextDueDays = (filteredCounts ? entries : summaries)
    .map((item) => (filteredCounts ? item.dueDay : item.nextDueDay))
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));
  const retentionAverage = entries.length
    ? Math.round(entries.reduce((sum, entry) => sum + Number(entry.retentionPercent || 0), 0) / entries.length)
    : null;
  return {
    entries,
    totalCount: entries.length,
    dueCount: filteredCounts ? dueEntries.length : summaries.reduce((sum, summary) => sum + (summary.dueCount || 0), 0),
    todayCount: filteredCounts ? todayEntries.length : summaries.reduce((sum, summary) => sum + (summary.todayCount || 0), 0),
    overdueCount: filteredCounts ? overdueEntries.length : summaries.reduce((sum, summary) => sum + (summary.overdueCount || 0), 0),
    weakCount: filteredCounts ? weakEntries.length : summaries.reduce((sum, summary) => sum + (summary.weakCount || 0), 0),
    futureCount: filteredCounts ? futureEntries.length : summaries.reduce((sum, summary) => sum + (summary.futureCount || 0), 0),
    next7Count: filteredCounts ? next7Entries.length : summaries.reduce((sum, summary) => sum + (summary.next7Count || 0), 0),
    activeCourseCount: filteredCounts
      ? new Set(entries.map((entry) => entry.courseId).filter(Boolean)).size
      : summaries.filter((summary) => summary.totalCount > 0).length,
    selectedCourseCount: normalizeReviewTargetCourseIds(state.reviewTargetCourseIds).length,
    dueCourseCount: filteredCounts
      ? new Set(dueEntries.map((entry) => entry.courseId).filter(Boolean)).size
      : summaries.filter((summary) => summary.dueCount > 0).length,
    loadingCount: summaries.filter((summary) => summary.loading).length,
    failedCount: summaries.filter((summary) => summary.failed).length,
    retentionAverage,
    stageCounts: reviewStageCounts(entries),
    nextDueDay: nextDueDays[0] || "",
    todayKey,
  };
}

function forgettingRetentionPercent(day) {
  const normalizedDay = Math.max(0, Number(day) || 0);
  return Math.max(4, Math.min(100, 100 * Math.exp(-normalizedDay / 9.5)));
}

function reviewCurvePoint(day, width, height, padLeft, padRight, padTop, padBottom) {
  const maxDay = REVIEW_CURRICULUM_INTERVAL_DAYS[REVIEW_CURRICULUM_INTERVAL_DAYS.length - 1] || 30;
  const x = padLeft + (Math.max(0, Math.min(maxDay, day)) / maxDay) * (width - padLeft - padRight);
  const y = padTop + ((100 - forgettingRetentionPercent(day)) / 100) * (height - padTop - padBottom);
  return { x, y };
}

function reviewCurveBucketData(entries) {
  const maxDay = REVIEW_CURRICULUM_INTERVAL_DAYS[REVIEW_CURRICULUM_INTERVAL_DAYS.length - 1] || 30;
  const buckets = new Map();
  entries.forEach((entry) => {
    const day = Math.max(0, Math.min(maxDay, Number(entry.daysSinceAnswered) || 0));
    if (!buckets.has(day)) {
      buckets.set(day, {
        day,
        count: 0,
        retentionTotal: 0,
        overdue: 0,
        today: 0,
        soon: 0,
        future: 0,
      });
    }
    const bucket = buckets.get(day);
    const stage = entry.stage || "future";
    bucket.count += 1;
    bucket.retentionTotal += Number(entry.retentionPercent || forgettingRetentionPercent(day));
    bucket[stage] = (bucket[stage] || 0) + 1;
  });
  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      retentionAverage: bucket.count ? bucket.retentionTotal / bucket.count : forgettingRetentionPercent(bucket.day),
      stage: bucket.overdue ? "overdue" : bucket.today ? "today" : bucket.soon ? "soon" : "future",
    }))
    .sort((a, b) => a.day - b.day);
}

function reviewCurveStageLabel(stage) {
  return {
    overdue: "遅れ",
    today: "今日",
    soon: "7日内",
    future: "保持中",
  }[stage] || "保持中";
}

function reviewForgettingCurveSvgHtml(entries = []) {
  const width = 820;
  const height = 320;
  const padLeft = 58;
  const padRight = 28;
  const padTop = 28;
  const padBottom = 54;
  const maxDay = REVIEW_CURRICULUM_INTERVAL_DAYS[REVIEW_CURRICULUM_INTERVAL_DAYS.length - 1] || 30;
  const samples = Array.from({ length: maxDay + 1 }, (_, day) =>
    reviewCurvePoint(day, width, height, padLeft, padRight, padTop, padBottom)
  );
  const path = samples
    .map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const thresholdY = padTop + 0.5 * (height - padTop - padBottom);
  const buckets = reviewCurveBucketData(entries);
  const maxBucketCount = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const markers = REVIEW_CURRICULUM_INTERVAL_DAYS.map((day) => {
    const point = reviewCurvePoint(day, width, height, padLeft, padRight, padTop, padBottom);
    return `
      <g class="review-curve-marker">
        <line x1="${point.x.toFixed(1)}" y1="${point.y.toFixed(1)}" x2="${point.x.toFixed(1)}" y2="${height - padBottom}" />
        <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.2" />
        <text x="${point.x.toFixed(1)}" y="${height - 12}" text-anchor="middle">${day}日</text>
      </g>
    `;
  }).join("");
  const ticks = [0, 1, 3, 7, 14, 30]
    .map((day) => {
      const point = reviewCurvePoint(day, width, height, padLeft, padRight, padTop, padBottom);
      return `
        <g class="review-curve-tick">
          <line x1="${point.x.toFixed(1)}" y1="${height - padBottom}" x2="${point.x.toFixed(1)}" y2="${height - padBottom + 5}" />
          <text x="${point.x.toFixed(1)}" y="${height - 28}" text-anchor="middle">${day}</text>
        </g>
      `;
    })
    .join("");
  const bubbles = buckets
    .map((bucket) => {
      const point = reviewCurvePoint(bucket.day, width, height, padLeft, padRight, padTop, padBottom);
      const y = padTop + ((100 - bucket.retentionAverage) / 100) * (height - padTop - padBottom);
      const radius = Math.min(22, 5 + Math.sqrt(bucket.count / maxBucketCount) * 15);
      const label = bucket.count >= 2
        ? `<text class="review-curve-bubble-count" x="${point.x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle">${bucket.count}</text>`
        : "";
      return `
        <g class="review-curve-bubble review-curve-bubble-${bucket.stage}">
          <title>${bucket.day}日後 / ${bucket.count}問 / ${reviewCurveStageLabel(bucket.stage)} / 推定保持 ${Math.round(bucket.retentionAverage)}%</title>
          <line x1="${point.x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${point.x.toFixed(1)}" y2="${height - padBottom}" />
          <circle cx="${point.x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius.toFixed(1)}" />
          ${label}
        </g>
      `;
    })
    .join("");
  const emptyOverlay = entries.length
    ? ""
    : `<text class="review-curve-empty-label" x="${width / 2}" y="${height / 2}" text-anchor="middle">対象科目の回答実績がまだありません</text>`;
  return `
    <svg class="review-forgetting-curve" viewBox="0 0 ${width} ${height}" role="img" aria-label="忘却曲線">
      <defs>
        <linearGradient id="forgettingCurveStroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="#7df9c7" />
          <stop offset="56%" stop-color="#ffe37d" />
          <stop offset="100%" stop-color="#ff6b6b" />
        </linearGradient>
        <linearGradient id="forgettingCurveFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#7df9c7" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#ff6b6b" stop-opacity="0.03" />
        </linearGradient>
      </defs>
      <rect class="review-curve-risk-zone" x="${padLeft}" y="${thresholdY}" width="${width - padLeft - padRight}" height="${height - padBottom - thresholdY}" />
      <path class="review-curve-area" d="${path} L ${width - padRight} ${height - padBottom} L ${padLeft} ${height - padBottom} Z" />
      <line class="review-curve-axis" x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" />
      <line class="review-curve-axis" x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" />
      <line class="review-curve-threshold" x1="${padLeft}" y1="${thresholdY}" x2="${width - padRight}" y2="${thresholdY}" />
      <text class="review-curve-ylabel" x="11" y="${padTop + 4}">記憶保持</text>
      <text class="review-curve-xlabel" x="${width - padRight}" y="${height - 8}" text-anchor="end">最後に解いてからの日数</text>
      <text class="review-curve-threshold-label" x="${width - padRight - 2}" y="${thresholdY - 6}" text-anchor="end">復習圏 50%</text>
      <path class="review-curve-line" d="${path}" />
      ${markers}
      ${ticks}
      ${bubbles}
      ${emptyOverlay}
    </svg>
  `;
}

function reviewCourseFilterHtml() {
  const selectedIds = new Set(normalizeReviewTargetCourseIds(state.reviewTargetCourseIds));
  const selectable = data.courses.filter((manifest) => !REVIEW_TARGET_EXCLUDED_COURSE_IDS.has(manifest.id));
  const excluded = data.courses.filter((manifest) => REVIEW_TARGET_EXCLUDED_COURSE_IDS.has(manifest.id));
  const chips = selectable
    .map((manifest) => {
      const active = selectedIds.has(manifest.id);
      return `
        <button
          class="review-course-chip${active ? " active" : ""}"
          type="button"
          data-review-filter-course="${escapeHtml(manifest.id)}"
          aria-pressed="${active}"
        >${escapeHtml(manifest.name)}</button>
      `;
    })
    .join("");
  return `
    <div class="review-course-filter" aria-label="忘却曲線の対象科目">
      <div class="review-course-filter-head">
        <span>対象科目</span>
        <strong>${selectedIds.size}/${selectable.length}</strong>
      </div>
      <div class="review-course-chip-list">${chips}</div>
      <small>対象外: ${escapeHtml(excluded.map((manifest) => manifest.name).join(" / "))}</small>
    </div>
  `;
}

function reviewTargetPanelSummaryForCourse(manifest, summaryByCourse) {
  const selectedSummary = summaryByCourse.get(manifest.id);
  if (selectedSummary) return selectedSummary;
  const loadedCourse = courseDataStore[manifest.id];
  if (loadedCourse?.chapters?.length) return reviewCurriculumSummaryForCourse(loadedCourse);
  return null;
}

function reviewTargetPanelCourseRows(summaries) {
  const selectedIds = new Set(normalizeReviewTargetCourseIds(state.reviewTargetCourseIds));
  const summaryByCourse = new Map(summaries.map((summary) => [summary.courseId, summary]));
  return data.courses
    .filter((manifest) => !REVIEW_TARGET_EXCLUDED_COURSE_IDS.has(manifest.id))
    .map((manifest) => {
      const summary = reviewTargetPanelSummaryForCourse(manifest, summaryByCourse);
      const selected = selectedIds.has(manifest.id);
      const total = summary?.totalCount || 0;
      const due = summary?.dueCount || 0;
      const overdue = summary?.overdueCount || 0;
      const today = summary?.todayCount || 0;
      const weak = summary?.weakCount || 0;
      const next7 = summary?.next7Count || 0;
      const load = overdue * 4 + today * 3 + Math.max(0, due - today) * 2 + weak * 2 + next7;
      const kind = summary?.failed
        ? "danger"
        : summary?.loading
          ? "loading"
          : overdue
            ? "danger"
            : today || weak
              ? "warm"
              : total || next7
                ? "strong"
                : selected
                  ? "idle"
                  : "off";
      return {
        manifest,
        selected,
        total,
        due,
        overdue,
        today,
        weak,
        next7,
        load,
        kind,
        detail: summary?.failed
          ? "読込失敗"
          : summary?.loading
            ? "集計中"
            : total
              ? `履歴 ${total}問`
              : "履歴待ち",
      };
    })
    .sort(
      (a, b) =>
        Number(b.selected) - Number(a.selected) ||
        b.load - a.load ||
        Number(b.manifest.id === state.courseId) - Number(a.manifest.id === state.courseId) ||
        String(a.manifest.name).localeCompare(String(b.manifest.name), "ja")
    );
}

function reviewTargetPanelCoach(selectedCount, selectableCount, rows) {
  if (!selectedCount) return "対象科目を選ぶと、復習曲線・キュー・ロードマップがその科目だけに絞られます";
  const selectedRows = rows.filter((row) => row.selected);
  const overdue = selectedRows.reduce((sum, row) => sum + row.overdue, 0);
  const today = selectedRows.reduce((sum, row) => sum + row.today, 0);
  const weak = selectedRows.reduce((sum, row) => sum + row.weak, 0);
  if (overdue) return `選択中の遅れは${overdue}問。対象を絞ると救出順が見えやすくなります`;
  if (today) return `選択中の今日分は${today}問。科目を絞って短い復習セットにできます`;
  if (weak) return `弱点${weak}問が選択対象にあります。精度を戻す日向きです`;
  if (selectedCount < selectableCount) return "対象を絞り込み中。今見る科目だけに集中できます";
  return "全対象を横断中。復習負荷の全体像を見ながら進められます";
}

function reviewTargetPanelHtml(summaries) {
  const rows = reviewTargetPanelCourseRows(summaries);
  const selectedCount = rows.filter((row) => row.selected).length;
  const maxLoad = Math.max(1, ...rows.map((row) => row.load));
  const historyCourseIds = rows.filter((row) => row.total || row.due || row.weak || row.next7).map((row) => row.manifest.id);
  const currentSelectable = rows.some((row) => row.manifest.id === state.courseId);
  return `
    <div class="review-target-head">
      <div>
        <span>対象科目</span>
        <strong>${selectedCount}/${rows.length}科目</strong>
      </div>
      <small>${escapeHtml(reviewTargetPanelCoach(selectedCount, rows.length, rows))}</small>
    </div>
    <div class="review-target-actions" aria-label="復習対象の一括切り替え">
      <button type="button" data-review-target-action="all">全科目</button>
      <button type="button" data-review-target-action="history" ${historyCourseIds.length ? "" : "disabled"}>履歴あり</button>
      <button type="button" data-review-target-action="current" ${currentSelectable ? "" : "disabled"}>現在だけ</button>
    </div>
    <div class="review-target-list">
      ${rows
        .map((row) => {
          const load = row.load ? Math.max(8, Math.round((row.load / maxLoad) * 100)) : 4;
          const activityText = row.overdue
            ? `遅れ${row.overdue}`
            : row.today
              ? `今日${row.today}`
              : row.weak
                ? `弱点${row.weak}`
                : row.next7
                  ? `7日${row.next7}`
                  : row.detail;
          return `
            <button
              class="review-target-chip ${escapeHtml(row.kind)}${row.selected ? " active" : ""}${row.manifest.id === state.courseId ? " current" : ""}"
              type="button"
              data-review-target-course="${escapeHtml(row.manifest.id)}"
              aria-pressed="${row.selected}"
              style="--target-load: ${load}%"
              title="${escapeHtml(`${row.manifest.name}: ${row.selected ? "対象" : "対象外"} / ${activityText}`)}"
            >
              <span>${escapeHtml(row.manifest.name)}</span>
              <strong>${escapeHtml(activityText)}</strong>
              <i aria-hidden="true"></i>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function reviewTodayCompletedData(todayKey = localDayKey()) {
  const selectedIds = new Set(normalizeReviewTargetCourseIds(state.reviewTargetCourseIds));
  const sessions = normalizeReviewSessionHistory(state.reviewSessionHistory).filter((session) => {
    if (localDayKey(session.completedAt) !== todayKey) return false;
    return selectedIds.size ? selectedIds.has(session.courseId) : false;
  });
  const total = sessions.reduce((sum, session) => sum + session.total, 0);
  const correct = sessions.reduce((sum, session) => sum + session.correct, 0);
  const wrong = sessions.reduce((sum, session) => sum + session.wrong, 0);
  const durationMs = sessions.reduce((sum, session) => sum + session.durationMs, 0);
  return {
    sessions,
    total,
    correct,
    wrong,
    durationMs,
    accuracy: total ? Math.round((correct / total) * 100) : null,
  };
}

function reviewTodayTargetRows(summaries, totals) {
  const courseIds = new Set(summaries.map((summary) => summary.courseId));
  const recovery = reviewRecoveryData();
  const topRecovery = recovery.topGroup && courseIds.has(recovery.topGroup.courseId) ? recovery.topGroup : null;
  const weakness = learningWeaknessSummaries(6).find((item) => courseIds.has(item.courseId)) || null;
  const schedule = reviewUpcomingScheduleData(totals.entries, totals.todayKey, 14);
  const bestWeakCourseId = reviewMissionBestCourseId(summaries, { ...state.reviewSession, mode: "weak" });
  const rows = [];

  if (topRecovery) {
    rows.push({
      kind: "danger",
      label: "未回収",
      value: `${topRecovery.entries.length}問`,
      count: topRecovery.entries.length,
      detail: `${topRecovery.courseName} / 再${topRecovery.repeatedWrong}`,
      attrs: `data-review-today-action="recovery" data-review-recovery-course="${escapeHtml(topRecovery.courseId)}"`,
    });
  }

  const dueCount = totals.overdueCount || totals.todayCount;
  if (dueCount) {
    const key = totals.overdueCount ? "overdue" : totals.todayKey;
    rows.push({
      kind: totals.overdueCount ? "danger" : "warm",
      label: totals.overdueCount ? "遅れ" : "今日",
      value: `${dueCount}問`,
      count: dueCount,
      detail: totals.overdueCount ? "期限超過を戻す" : formatStudyDay(totals.todayKey),
      attrs: `data-review-today-action="schedule" data-review-schedule-key="${escapeHtml(key)}"`,
    });
  }

  const weakCount = weakness?.questionCount || totals.weakCount;
  if (weakCount) {
    rows.push({
      kind: "weak",
      label: "弱点",
      value: `${weakCount}問`,
      count: weakCount,
      detail: weakness ? shortText(weakness.label, 34) : "ミス/低理解を優先",
      attrs: weakness
        ? `data-review-today-action="weakness" data-weakness-key="${escapeHtml(weakness.key)}"`
        : `data-review-today-action="mode" data-review-today-course="${escapeHtml(bestWeakCourseId)}" data-review-today-mode="weak"`,
      disabled: !weakness && !bestWeakCourseId,
    });
  }

  const advanceTarget = schedule.days.find((bucket) => bucket.count && bucket.key !== totals.todayKey) || schedule.peak;
  if (advanceTarget?.count && rows.length < 4) {
    rows.push({
      kind: advanceTarget.stage === "future" ? "strong" : "soon",
      label: "前倒し",
      value: `${advanceTarget.count}問`,
      count: advanceTarget.count,
      detail: `${advanceTarget.label} / 保持${advanceTarget.retentionAverage == null ? "--" : `${advanceTarget.retentionAverage}%`}`,
      attrs: `data-review-today-action="schedule" data-review-schedule-key="${escapeHtml(advanceTarget.key)}"`,
    });
  }

  return rows.slice(0, 4);
}

function reviewTodayTargetCoach({ rows, completed, targetCount, urgentCount }) {
  if (!rows.length) return "対象科目の復習負荷は軽め。新規問題で次の復習材料を増やせます";
  if (completed.total >= targetCount && targetCount) return "今日の復習ラインは達成済み。余力があれば前倒しで明日を軽くできます";
  if (urgentCount) return `まず急ぎ${urgentCount}問。終わったら弱点か前倒しに進むと流れが整います`;
  if (completed.total) return `今日は${completed.total}問完走済み。もう1セットで復習の密度が安定します`;
  return "最初の1セットを切ると、今日の達成ラインが動き始めます";
}

function reviewTodayTargetHtml(summaries) {
  const totals = reviewCurveTotals(summaries);
  const rows = reviewTodayTargetRows(summaries, totals);
  const completed = reviewTodayCompletedData(totals.todayKey);
  const config = normalizeReviewSession(state.reviewSession);
  const urgentCount = rows
    .filter((row) => row.kind === "danger" || row.label === "今日")
    .reduce((sum, row) => sum + row.count, 0);
  const plannedCount = rows.reduce((sum, row) => sum + row.count, 0);
  const targetCount = plannedCount
    ? Math.min(Math.max(config.size, urgentCount || rows[0].count), Math.max(config.size, plannedCount), config.size * 3)
    : 0;
  const progress = targetCount ? Math.min(100, Math.round((completed.total / targetCount) * 100)) : 0;
  const headline = targetCount ? `${completed.total}/${targetCount}問` : "復習軽め";
  const maxCount = Math.max(1, ...rows.map((row) => row.count));
  const coach = reviewTodayTargetCoach({ rows, completed, targetCount, urgentCount });
  const accuracyText = completed.accuracy == null ? "--" : `${completed.accuracy}%`;
  const durationText = completed.durationMs ? formatStudyDuration(completed.durationMs) : "0分";
  return `
    <div class="review-today-head">
      <div>
        <span>今日の復習</span>
        <strong>${escapeHtml(headline)}</strong>
      </div>
      <small>${escapeHtml(coach)}</small>
    </div>
    <div class="review-today-meter ${progress >= 100 ? "complete" : urgentCount ? "danger" : "warm"}" style="--today-target: ${Math.max(4, progress)}%" aria-label="今日の復習達成率 ${progress}%">
      <span aria-hidden="true"></span>
      <b>${progress}%</b>
    </div>
    ${
      rows.length
        ? `<div class="review-today-list">
            ${rows
              .map((row) => {
                const load = Math.max(8, Math.round((row.count / maxCount) * 100));
                return `
                  <button
                    class="review-today-row ${escapeHtml(row.kind)}"
                    type="button"
                    ${row.attrs}
                    style="--today-row-load: ${load}%"
                    ${row.disabled ? "disabled" : ""}
                    title="${escapeHtml(`${row.label}: ${row.value} / ${row.detail}`)}"
                  >
                    <span>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(row.value)}</strong>
                    <small>${escapeHtml(row.detail)}</small>
                    <i aria-hidden="true"></i>
                  </button>
                `;
              })
              .join("")}
          </div>`
        : `<div class="review-today-empty">到来・未回収・弱点は軽めです。新規回答を増やすと次の復習計画が育ちます。</div>`
    }
    <div class="review-today-foot">
      <span>完走 <b>${completed.sessions.length}回</b></span>
      <span>精度 <b>${escapeHtml(accuracyText)}</b></span>
      <span>時間 <b>${escapeHtml(durationText)}</b></span>
    </div>
  `;
}

function reviewUpcomingScheduleData(entries, todayKey = localDayKey(), dayCount = 14) {
  const overdue = {
    key: "overdue",
    label: "遅れ",
    subLabel: "期限超過",
    count: 0,
    weak: 0,
    retentionTotal: 0,
    stage: "overdue",
  };
  const days = Array.from({ length: dayCount }, (_, offset) => {
    const dateKey = addDaysToLocalDayKey(todayKey, offset);
    return {
      key: dateKey,
      label: offset === 0 ? "今日" : offset === 1 ? "明日" : `${offset}日後`,
      subLabel: formatStudyDay(dateKey),
      dayOffset: offset,
      count: 0,
      weak: 0,
      retentionTotal: 0,
      stage: offset === 0 ? "today" : offset <= 7 ? "soon" : "future",
    };
  });
  const dayByKey = new Map(days.map((day) => [day.key, day]));
  entries.forEach((entry) => {
    const dueDay = entry?.dueDay || "";
    if (!dueDay) return;
    const dueInDays = Number.isFinite(Number(entry.dueInDays)) ? Number(entry.dueInDays) : localDayDiff(todayKey, dueDay);
    const target = dueInDays < 0 ? overdue : dayByKey.get(dueDay);
    if (!target) return;
    target.count += 1;
    if (isWeakReviewEntry(entry)) target.weak += 1;
    target.retentionTotal += Number(entry.retentionPercent || 0);
  });
  const buckets = [overdue, ...days].map((bucket) => ({
    ...bucket,
    retentionAverage: bucket.count ? Math.round(bucket.retentionTotal / bucket.count) : null,
  }));
  const normalizedOverdue = buckets[0];
  const normalizedDays = buckets.slice(1);
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const peak = buckets.reduce((best, bucket) => (bucket.count > best.count ? bucket : best), buckets[0]);
  const next = normalizedDays.find((bucket) => bucket.count > 0) || null;
  return { buckets, days: normalizedDays, overdue: normalizedOverdue, maxCount, peak, next };
}

function reviewUpcomingScheduleCoach(schedule) {
  const today = schedule.days[0];
  const weekCount = schedule.days.slice(0, 7).reduce((sum, bucket) => sum + bucket.count, 0);
  if (schedule.overdue.count) return `遅れ${schedule.overdue.count}問を先に処理。終わったら今日分へ`;
  if (today?.count) return `今日${today.count}問。${Math.min(20, Math.max(5, today.count))}問単位で区切ると進めやすいです`;
  if (weekCount) return `7日内に${weekCount}問。ピーク前に5問ずつ前倒しできます`;
  if (schedule.next) return `次の山は${schedule.next.subLabel}の${schedule.next.count}問。今日は弱点補強向き`;
  return "2週間以内の復習予定は軽め。新規問題を進める余白があります";
}

function reviewUpcomingScheduleHtml(totals) {
  const schedule = reviewUpcomingScheduleData(totals.entries, totals.todayKey);
  const activeCount = schedule.buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const peakText = schedule.peak.count ? `${schedule.peak.label} ${schedule.peak.count}問` : "山なし";
  return `
    <div class="review-upcoming-schedule" aria-label="今後2週間の復習予定">
      <div class="review-upcoming-head">
        <div>
          <span>2W FORECAST</span>
          <strong>${escapeHtml(peakText)}</strong>
        </div>
        <small>${activeCount ? `${activeCount}問 / ${reviewUpcomingScheduleCoach(schedule)}` : reviewUpcomingScheduleCoach(schedule)}</small>
      </div>
      <div class="review-upcoming-grid">
        ${schedule.buckets
          .map((bucket) => {
            const load = bucket.count ? Math.max(8, Math.round((bucket.count / schedule.maxCount) * 100)) : 4;
            const retention = bucket.retentionAverage == null ? "--" : `${bucket.retentionAverage}%`;
            return `
              <button
                class="review-upcoming-day ${escapeHtml(bucket.stage)}${bucket.count ? " active" : ""}"
                type="button"
                data-review-schedule-key="${escapeHtml(bucket.key)}"
                style="--load: ${load}%"
                title="${escapeHtml(bucket.count ? `${bucket.subLabel}から復習を開始 / ${bucket.count}問 / 弱点${bucket.weak}問 / 保持 ${retention}` : `${bucket.subLabel} / 予定なし`)}"
                ${bucket.count ? "" : "disabled"}
              >
                <span>${escapeHtml(bucket.label)}</span>
                <strong>${bucket.count}</strong>
                <i aria-hidden="true"></i>
                <small>${bucket.weak ? `弱${bucket.weak}` : escapeHtml(retention)}</small>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function reviewCurveSummaryHtml(summaries) {
  const totals = reviewCurveTotals(summaries);
  const nextText = totals.nextDueDay ? formatStudyDay(totals.nextDueDay) : totals.dueCount ? "到来中" : "予定なし";
  const headline = totals.loadingCount
    ? "復習データを集計中"
    : totals.dueCount
      ? `今すぐ復習 ${totals.dueCount}問`
      : totals.nextDueDay
        ? `次回 ${nextText}`
        : "復習予定はまだなし";
  const note = totals.totalCount
    ? `回答実績 ${totals.totalCount}問 / 復習間隔 ${REVIEW_CURRICULUM_INTERVAL_DAYS.join(" → ")}日 / 対象 ${totals.selectedCourseCount}科目`
    : totals.selectedCourseCount
      ? "対象科目の回答履歴がたまると、ここに復習予定が出ます"
      : "忘却曲線の対象科目を選んでください";
  return `
    <div class="review-curve-headline">
      <span>FORGETTING CURVE</span>
      <strong>忘却曲線</strong>
      <em>${escapeHtml(headline)}</em>
      <span>${escapeHtml(note)}</span>
    </div>
    ${reviewCourseFilterHtml()}
    <div class="review-curve-stats">
      <div><span>実績</span><strong>${totals.totalCount}</strong></div>
      <div><span>今日</span><strong>${totals.todayCount}</strong></div>
      <div><span>遅れ</span><strong>${totals.overdueCount}</strong></div>
      <div><span>弱点</span><strong>${totals.weakCount}</strong></div>
      <div><span>7日内</span><strong>${totals.next7Count}</strong></div>
      <div><span>平均保持</span><strong>${totals.retentionAverage == null ? "--" : `${totals.retentionAverage}%`}</strong></div>
    </div>
    ${reviewUpcomingScheduleHtml(totals)}
    <div class="review-curve-plot">
      ${reviewForgettingCurveSvgHtml(totals.entries)}
      <div class="review-curve-legend" aria-label="チャート凡例">
        <span class="legend-future">保持中</span>
        <span class="legend-soon">7日内</span>
        <span class="legend-today">今日</span>
        <span class="legend-overdue">遅れ</span>
      </div>
      <p>泡の大きさは同じ経過日数にいる回答実績数です。50%ラインより下に近づくほど復習優先度が上がります。</p>
    </div>
    ${totals.failedCount ? `<div class="review-curve-warning">読込失敗 ${totals.failedCount}科目</div>` : ""}
  `;
}

function setReviewTargetCourseIds(courseIds) {
  const nextIds = normalizeReviewTargetCourseIds(courseIds);
  const selectedIds = new Set(nextIds);
  state.reviewTargetCourseIds = nextIds;
  saveReviewTargetCourseIds();
  if (isReviewCurriculumModeForCourse(state.courseId) && !selectedIds.has(state.courseId)) {
    exitReviewCurriculumMode();
    return;
  }
  ensureReviewCurriculumCoursesLoaded();
  renderReviewCurriculum();
}

function toggleReviewTargetCourse(courseId) {
  if (REVIEW_TARGET_EXCLUDED_COURSE_IDS.has(courseId)) return;
  const selectedIds = new Set(normalizeReviewTargetCourseIds(state.reviewTargetCourseIds));
  if (selectedIds.has(courseId)) {
    selectedIds.delete(courseId);
  } else {
    selectedIds.add(courseId);
  }
  state.reviewTargetCourseIds = [...selectedIds];
  saveReviewTargetCourseIds();
  if (!selectedIds.has(courseId) && isReviewCurriculumModeForCourse(courseId)) {
    exitReviewCurriculumMode();
    return;
  }
  ensureReviewCurriculumCoursesLoaded();
  renderReviewCurriculum();
}

function renderReviewTargetPanel(summaries) {
  if (!els.reviewTargetPanel || !state.reviewCurveSummaryOpen) return;
  els.reviewTargetPanel.innerHTML = reviewTargetPanelHtml(summaries);
}

function renderReviewTodayTargetPanel(summaries) {
  if (!els.reviewTodayTargetPanel || !state.reviewCurveSummaryOpen) return;
  els.reviewTodayTargetPanel.innerHTML = reviewTodayTargetHtml(summaries);
}

function handleReviewTargetPanelClick(event) {
  const button = event.target?.closest?.("[data-review-target-course], [data-review-target-action]");
  if (!button || !els.reviewTargetPanel?.contains(button) || button.disabled) return;
  const courseId = button.dataset.reviewTargetCourse;
  if (courseId) {
    toggleReviewTargetCourse(courseId);
    return;
  }
  const rows = reviewTargetPanelCourseRows(reviewCurriculumSummaries());
  const action = button.dataset.reviewTargetAction;
  if (action === "all") {
    setReviewTargetCourseIds(reviewSelectableCourseIds());
    return;
  }
  if (action === "history") {
    const ids = rows.filter((row) => row.total || row.due || row.weak || row.next7).map((row) => row.manifest.id);
    setReviewTargetCourseIds(ids.length ? ids : reviewSelectableCourseIds());
    return;
  }
  if (action === "current") {
    setReviewTargetCourseIds(reviewSelectableCourseIds().includes(state.courseId) ? [state.courseId] : reviewSelectableCourseIds());
  }
}

function handleReviewTodayTargetClick(event) {
  const button = event.target?.closest?.("[data-review-today-action]");
  if (!button || !els.reviewTodayTargetPanel?.contains(button) || button.disabled) return;
  const action = button.dataset.reviewTodayAction;
  if (action === "recovery") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
    return;
  }
  if (action === "schedule") {
    startReviewScheduleSession(button.dataset.reviewScheduleKey);
    return;
  }
  if (action === "weakness") {
    startWeaknessReviewSession(button.dataset.weaknessKey);
    return;
  }
  if (action === "mode") {
    const courseId = button.dataset.reviewTodayCourse;
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewTodayMode) ? button.dataset.reviewTodayMode : state.reviewSession.mode;
    if (!courseId) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
  }
}

function attachReviewCourseFilterHandlers() {
  els.reviewCurveSummary?.querySelectorAll("[data-review-filter-course]").forEach((button) => {
    button.addEventListener("click", () => toggleReviewTargetCourse(button.dataset.reviewFilterCourse));
  });
  els.reviewCurveSummary?.querySelectorAll("[data-review-schedule-key]").forEach((button) => {
    button.addEventListener("click", () => startReviewScheduleSession(button.dataset.reviewScheduleKey));
  });
}

function renderReviewCurveSummary(summaries) {
  if (!els.reviewCurveSummary || !els.reviewCurveSummaryToggle || !els.studySummaryPanel) return;
  els.reviewCurveSummaryToggle.classList.toggle("active", state.reviewCurveSummaryOpen);
  els.reviewCurveSummaryToggle.setAttribute("aria-expanded", String(state.reviewCurveSummaryOpen));
  els.studySummaryPanel.classList.toggle("hidden", !state.reviewCurveSummaryOpen);
  document.body.classList.toggle("study-summary-open", state.reviewCurveSummaryOpen);
  if (!state.reviewCurveSummaryOpen) return;
  els.reviewCurveSummary.innerHTML = reviewCurveSummaryHtml(summaries);
  attachReviewCourseFilterHandlers();
}

function setStudySummaryOpen(open) {
  if (!els.studySummaryPanel) return;
  state.reviewCurveSummaryOpen = Boolean(open);
  renderStudyReport();
  renderReviewCurriculum();
  if (state.reviewCurveSummaryOpen) {
    els.studySummaryClose?.focus();
  }
}

function studySummaryScrollContainerFor(target) {
  let node = target.parentElement;
  while (node && node !== els.studySummaryPanel) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight + 1) return node;
    node = node.parentElement;
  }
  return null;
}

function handleStudySummaryJumpbarClick(event) {
  const button = event.target.closest("[data-summary-jump]");
  if (!button || !els.studySummaryJumpbar?.contains(button)) return;
  const targetId = button.dataset.summaryJump;
  if (!targetId) return;
  const target = document.getElementById(targetId);
  if (!target) return;
  const container = studySummaryScrollContainerFor(target);
  if (container) {
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const top = Math.max(0, targetRect.top - containerRect.top + container.scrollTop - 8);
    container.scrollTo({ top, behavior: "auto" });
  }
  button.blur();
}

function reviewSessionModeLabel(mode) {
  return {
    smart: "最優先",
    overdue: "遅れ",
    today: "今日",
    weak: "弱点",
  }[mode] || "最優先";
}

function reviewSessionModeDetail(mode) {
  return {
    smart: "遅れ・誤答・保持率を混ぜて重い順",
    overdue: "期限を過ぎた問題だけ",
    today: "今日が期限の問題だけ",
    weak: "直近ミスと低スコアを優先",
  }[mode] || "遅れ・誤答・保持率を混ぜて重い順";
}

function reviewMissionBestCourseId(summaries, session) {
  const config = normalizeReviewSession(session);
  const candidates = summaries
    .map((summary) => {
      const entries = reviewSessionEntriesForSummary(summary, config);
      return {
        summary,
        entries,
        score: entries.reduce((sum, entry) => sum + reviewSessionPriorityScore(entry), 0),
      };
    })
    .filter((candidate) => candidate.entries.length && !candidate.summary.loading && !candidate.summary.failed);
  candidates.sort(
    (a, b) =>
      b.entries.length - a.entries.length ||
      b.score - a.score ||
      String(a.summary.courseName).localeCompare(String(b.summary.courseName), "ja")
  );
  return candidates[0]?.summary?.courseId || "";
}

function reviewMissionScheduleTarget(summaries) {
  const session = normalizeReviewSession(state.reviewSession);
  const totals = reviewCurveTotals(summaries);
  const schedule = reviewUpcomingScheduleData(filterReviewSessionEntries(totals.entries, session), totals.todayKey);
  return schedule.days.find((bucket) => bucket.count && bucket.key !== totals.todayKey) || null;
}

function reviewMissionActionsHtml(summaries) {
  const config = normalizeReviewSession(state.reviewSession);
  const recovery = reviewRecoveryData();
  const recoveryGroup = recovery.topGroup;
  const overdueCount = summaries.reduce(
    (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode: "overdue" }).length,
    0
  );
  const todayCount = summaries.reduce(
    (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode: "today" }).length,
    0
  );
  const dueMode = overdueCount ? "overdue" : "today";
  const dueSession = normalizeReviewSession({ ...config, mode: dueMode });
  const dueCourseId = reviewMissionBestCourseId(summaries, dueSession);
  const dueCount = overdueCount || todayCount;
  const weakness = learningWeaknessSummaries(1)[0] || null;
  const scheduleTarget = reviewMissionScheduleTarget(summaries);
  const missionButton = ({ action, label, value, detail, disabled = false, attrs = "" }) => `
    <button
      class="review-mission-button"
      type="button"
      data-review-mission="${escapeHtml(action)}"
      ${attrs}
      ${disabled ? "disabled" : ""}
    >
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </button>
  `;
  return `
    <div class="review-mission-board" aria-label="次の復習ミッション">
      ${missionButton({
        action: "recovery",
        label: "未回収",
        value: recoveryGroup ? `${recoveryGroup.entries.length}問` : "なし",
        detail: recoveryGroup ? `${recoveryGroup.courseName} / 再ミス ${recoveryGroup.repeatedWrong}` : "ミス残りは空",
        disabled: !recoveryGroup,
        attrs: recoveryGroup ? `data-review-recovery-course="${escapeHtml(recoveryGroup.courseId)}"` : "",
      })}
      ${missionButton({
        action: "due",
        label: overdueCount ? "遅れ処理" : "今日処理",
        value: dueCount ? `${dueCount}問` : "なし",
        detail: dueCount ? `${reviewSessionModeLabel(dueMode)}から開始` : "到来分は空",
        disabled: !dueCourseId,
        attrs: `data-review-mission-course="${escapeHtml(dueCourseId)}" data-review-mission-mode="${escapeHtml(dueMode)}"`,
      })}
      ${missionButton({
        action: "weakness",
        label: "弱点集中",
        value: weakness ? `${weakness.questionCount}問` : "なし",
        detail: weakness ? weakness.label : "弱点はまだ薄め",
        disabled: !weakness,
        attrs: weakness ? `data-weakness-key="${escapeHtml(weakness.key)}"` : "",
      })}
      ${missionButton({
        action: "schedule",
        label: "前倒し",
        value: scheduleTarget ? `${scheduleTarget.count}問` : "なし",
        detail: scheduleTarget ? `${scheduleTarget.label} / 保持${scheduleTarget.retentionAverage == null ? "--" : `${scheduleTarget.retentionAverage}%`}` : "2週内は軽め",
        disabled: !scheduleTarget,
        attrs: scheduleTarget ? `data-review-schedule-key="${escapeHtml(scheduleTarget.key)}"` : "",
      })}
    </div>
  `;
}

function nextReviewMissionCandidate(summaries = reviewCurriculumSummaries()) {
  const recovery = reviewRecoveryData();
  if (recovery.topGroup) {
    return {
      action: "recovery",
      label: "未回収",
      value: `${recovery.topGroup.entries.length}問`,
      detail: `${recovery.topGroup.courseName} / 再ミス ${recovery.topGroup.repeatedWrong}`,
      courseId: recovery.topGroup.courseId,
    };
  }

  const config = normalizeReviewSession(state.reviewSession);
  const overdueCount = summaries.reduce(
    (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode: "overdue" }).length,
    0
  );
  const todayCount = summaries.reduce(
    (sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode: "today" }).length,
    0
  );
  const dueMode = overdueCount ? "overdue" : "today";
  const dueCount = overdueCount || todayCount;
  const dueCourseId = dueCount
    ? reviewMissionBestCourseId(summaries, { ...config, mode: dueMode })
    : "";
  if (dueCourseId) {
    return {
      action: "due",
      label: overdueCount ? "遅れ処理" : "今日処理",
      value: `${dueCount}問`,
      detail: `${reviewSessionModeLabel(dueMode)}から開始`,
      courseId: dueCourseId,
      mode: dueMode,
    };
  }

  const weakness = learningWeaknessSummaries(1)[0] || null;
  if (weakness) {
    return {
      action: "weakness",
      label: "弱点集中",
      value: `${weakness.questionCount}問`,
      detail: weakness.label,
      weaknessKey: weakness.key,
    };
  }

  const scheduleTarget = reviewMissionScheduleTarget(summaries);
  if (scheduleTarget) {
    return {
      action: "schedule",
      label: "前倒し",
      value: `${scheduleTarget.count}問`,
      detail: `${scheduleTarget.label} / 保持${scheduleTarget.retentionAverage == null ? "--" : `${scheduleTarget.retentionAverage}%`}`,
      scheduleKey: scheduleTarget.key,
    };
  }
  return null;
}

function reviewSessionAvailableEntriesForSummary(summary, session = state.reviewSession) {
  const config = normalizeReviewSession(session);
  const todayKey = localDayKey();
  const entries = summary.entries || [];
  const dueEntries = (summary.entries || [])
    .filter((entry) => entry.due)
    .sort(compareReviewCurriculumEntries);
  const smartEntries = entries
    .filter(isSmartReviewEntry)
    .sort(compareReviewSessionPriorityEntries);
  const weakEntries = entries
    .filter(isWeakReviewEntry)
    .sort(compareWeakReviewEntries);
  const filtered = {
    smart: smartEntries,
    overdue: dueEntries.filter((entry) => entry.overdue),
    today: dueEntries.filter((entry) => entry.dueDay === todayKey),
    weak: weakEntries,
  }[config.mode] || dueEntries;
  return filterReviewSessionEntries(filtered, config);
}

function reviewSessionEntriesForSummary(summary, session = state.reviewSession) {
  const config = normalizeReviewSession(session);
  return reviewSessionAvailableEntriesForSummary(summary, config).slice(0, config.size);
}

function reviewPriorityEntryKind(entry) {
  if (entry?.overdue) return "overdue";
  if (entry?.due) return "today";
  if (entry?.latestWrong || Number(entry?.scoreRatio) < 0.8) return "weak";
  if (Number(entry?.dueInDays) >= 0 && Number(entry?.dueInDays) <= 7) return "soon";
  return "future";
}

function reviewPriorityEntryLabel(entry) {
  if (!entry) return "待機";
  if (entry.overdue) return `遅れ${Math.max(1, Number(entry.dueOffsetDays) || 1)}日`;
  if (entry.due) return "今日";
  if (entry.latestWrong) return "直近ミス";
  if (Number(entry.dueInDays) >= 0 && Number(entry.dueInDays) <= 7) return `${entry.dueInDays}日後`;
  return entry.dueDay ? formatStudyDay(entry.dueDay) : "候補";
}

function reviewPriorityQuestionPreview(entry) {
  const question = entry?.question;
  if (!question) return "";
  const source = question.promptHtml ? htmlToClipboardText(question.promptHtml) : question.prompt || "";
  const masked = maskAnswerInPrompt(source, question.options?.[question.answer]);
  return shortText(masked, 72);
}

function reviewPriorityQueueRows(summaries, config) {
  const session = normalizeReviewSession(config);
  const rows = [];
  summaries.forEach((summary) => {
    if (summary.loading || summary.failed) return;
    reviewSessionAvailableEntriesForSummary(summary, session).forEach((entry) => {
      rows.push({
        summary,
        entry,
        score: reviewSessionPriorityScore(entry),
      });
    });
  });
  rows.sort(
    (a, b) =>
      b.score - a.score ||
      compareReviewSessionPriorityEntries(a.entry, b.entry) ||
      String(a.summary.courseName).localeCompare(String(b.summary.courseName), "ja")
  );
  return rows;
}

function reviewPriorityQueueItems(summaries, config) {
  return reviewPriorityQueueRows(summaries, config).slice(0, 5);
}

function reviewPriorityQueueHtml(summaries, config) {
  const rows = reviewPriorityQueueItems(summaries, config);
  const modeLabel = reviewSessionModeLabel(config.mode);
  const averageRetention = reviewAverageRetention(rows.map((row) => row.entry));
  const retentionText = averageRetention == null ? "--" : `${averageRetention}%`;
  const maxScore = Math.max(1, ...rows.map((row) => row.score));
  return `
    <div class="review-priority-queue" aria-label="復習優先キュー">
      <div class="review-priority-head">
        <div>
          <span>優先リスト</span>
          <strong>${rows.length ? `${modeLabel}の先頭${rows.length}問` : "候補なし"}</strong>
        </div>
        <small>平均保持 ${escapeHtml(retentionText)}</small>
      </div>
      ${
        rows.length
          ? `<div class="review-priority-list">
              ${rows
                .map((row, index) => {
                  const kind = reviewPriorityEntryKind(row.entry);
                  const focus = reviewEntryFocusLabel(row.entry) || row.summary.courseName;
                  const preview = reviewPriorityQuestionPreview(row.entry) || "問題文プレビューなし";
                  const retention =
                    row.entry.retentionPercent == null ? "--" : `${Math.round(Number(row.entry.retentionPercent) || 0)}%`;
                  const score = Math.round(row.score);
                  const priority = Math.max(8, Math.round((row.score / maxScore) * 100));
                  const title = `${row.summary.courseName} / ${focus} / ${reviewPriorityEntryLabel(row.entry)} / 復習を開始`;
                  return `
                    <button
                      class="review-priority-row ${escapeHtml(kind)}"
                      type="button"
                      data-review-priority-course="${escapeHtml(row.summary.courseId)}"
                      data-review-priority-mode="${escapeHtml(config.mode)}"
                      title="${escapeHtml(title)}"
                      style="--priority: ${priority}%"
                    >
                      <span class="review-priority-rank">${index + 1}</span>
                      <div class="review-priority-main">
                        <strong>${escapeHtml(focus)}</strong>
                        <small>${escapeHtml(preview)}</small>
                      </div>
                      <div class="review-priority-meta">
                        <span>${escapeHtml(reviewPriorityEntryLabel(row.entry))}</span>
                        <span>保持 <b>${escapeHtml(retention)}</b></span>
                        <span>優先 <b>${score}</b></span>
                      </div>
                      <i aria-hidden="true"></i>
                    </button>
                  `;
                })
                .join("")}
            </div>`
          : `<div class="review-curriculum-empty">このモードの候補はまだありません。回答履歴が増えると、優先順で問題が並びます</div>`
      }
    </div>
  `;
}

function reviewCriticalPathCounts(rows) {
  return rows.reduce(
    (counts, row) => {
      const kind = reviewPriorityEntryKind(row.entry);
      counts[kind] = (counts[kind] || 0) + 1;
      counts.total += 1;
      return counts;
    },
    { overdue: 0, today: 0, weak: 0, soon: 0, future: 0, total: 0 }
  );
}

function reviewCriticalPathCoach(data) {
  if (!data.total) return "復習候補が育つと、何セットで危険域を落とせるか見えるようになります";
  const first = data.steps[0];
  if (data.counts.overdue) return `まず${data.sessionSize}問で遅れを${first.counts.overdue}問回収。赤い山から崩すのが最短です`;
  if (data.counts.today) return `今日分は${data.counts.today}問。${first.counts.today}問ずつ区切ればリズムを保てます`;
  if (data.counts.weak) return `期限は軽め。${first.counts.weak}問ずつ弱点を削ると精度が戻ります`;
  if (data.counts.soon) return `7日内の山を前倒し中。${first.questionCount}問で明日以降が軽くなります`;
  return "危険域は薄め。新規学習の前に軽く整える用途で使えます";
}

function reviewCriticalPathData(summaries, config) {
  const session = normalizeReviewSession(config);
  const rows = reviewPriorityQueueRows(summaries, session);
  const counts = reviewCriticalPathCounts(rows);
  const dangerTotal = counts.overdue + counts.today + counts.weak;
  const sessionSize = Math.max(1, Number(session.size) || REVIEW_SESSION_SIZES[0]);
  const secondsPerQuestion = reviewAverageSecondsPerQuestion();
  const steps = [1, 2, 3].map((step) => {
    const stepRows = rows.slice(0, sessionSize * step);
    const stepCounts = reviewCriticalPathCounts(stepRows);
    const cleared = stepCounts.overdue + stepCounts.today + stepCounts.weak;
    const denominator = dangerTotal || counts.total || 1;
    const coverage = Math.min(100, Math.round((cleared / denominator) * 100));
    return {
      index: step,
      label: `${step}セット`,
      questionCount: stepRows.length,
      counts: stepCounts,
      cleared,
      coverage,
      averageRetention: reviewAverageRetention(stepRows.map((row) => row.entry)),
      duration: reviewEstimateDurationText(stepRows.length, secondsPerQuestion),
    };
  });
  return {
    session,
    rows,
    counts,
    dangerTotal,
    sessionSize,
    secondsPerQuestion,
    total: counts.total,
    steps,
    candidate: reviewSetPreviewCandidate(summaries, session),
  };
}

function reviewCriticalPathHtml(summaries, config) {
  const data = reviewCriticalPathData(summaries, config);
  const headline = data.dangerTotal
    ? `危険域 ${data.dangerTotal}問`
    : data.total
      ? `候補 ${data.total}問`
      : "候補なし";
  const metric = (kind, label, value, detail) => `
    <div class="review-critical-metric ${escapeHtml(kind)}">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
  return `
    <div class="review-critical-path" aria-label="復習クリティカルパス">
      <div class="review-critical-head">
        <div>
          <span>優先度</span>
          <strong>${escapeHtml(headline)}</strong>
        </div>
        <small>${escapeHtml(reviewCriticalPathCoach(data))}</small>
      </div>
      <div class="review-critical-metrics">
        ${metric("overdue", "遅れ", data.counts.overdue, "赤信号")}
        ${metric("today", "今日", data.counts.today, "本日期限")}
        ${metric("weak", "弱点", data.counts.weak, "ミス/低得点")}
        ${metric("soon", "7日内", data.counts.soon, "前倒し")}
      </div>
      ${
        data.total
          ? `<div class="review-critical-steps">
              ${data.steps
                .map((step) => {
                  const retention = step.averageRetention == null ? "--" : `${step.averageRetention}%`;
                  return `
                    <div class="review-critical-step" style="--coverage: ${step.coverage}%">
                      <div class="review-critical-step-main">
                        <span>${escapeHtml(step.label)}</span>
                        <strong>${step.cleared}/${data.dangerTotal || data.total}</strong>
                        <small>${step.questionCount}問 / ${escapeHtml(step.duration)} / 保持 ${escapeHtml(retention)}</small>
                      </div>
                      <i aria-hidden="true"></i>
                      <div class="review-critical-step-tags">
                        <span>遅 ${step.counts.overdue}</span>
                        <span>今 ${step.counts.today}</span>
                        <span>弱 ${step.counts.weak}</span>
                        <span>近 ${step.counts.soon}</span>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>`
          : `<div class="review-curriculum-empty">対象科目で回答すると、復習の最短ルートがここに出ます</div>`
      }
      ${
        data.candidate
          ? `<button
              class="review-critical-start"
              type="button"
              data-review-set-start-course="${escapeHtml(data.candidate.summary.courseId)}"
              data-review-set-start-mode="${escapeHtml(data.session.mode)}"
              title="${escapeHtml(`${data.candidate.summary.courseName}の${reviewSessionModeLabel(data.session.mode)}復習を開始`)}"
            >最初のセットを開始</button>`
          : ""
      }
    </div>
  `;
}

function reviewStagePlanStageMode(stageKey, group) {
  if (stageKey === "rescue") return "weak";
  if (stageKey === "due") return group?.counts?.overdue ? "overdue" : "today";
  return "smart";
}

function reviewStagePlanCoach(data) {
  if (!data.total) return "回答履歴が増えると、復習候補を救出・期限・育成・定着に分けて回せます";
  if (data.groups.rescue.count) return `救出${data.groups.rescue.count}問を先に。ミス残りを減らすと次のセットが軽くなります`;
  if (data.groups.due.count) return `期限${data.groups.due.count}問を1セットで処理。終わったら育成へ進めます`;
  if (data.groups.growing.count) return "育成中の問題を短く回して、定着ステージへ押し上げるタイミングです";
  return "定着チェック中心。軽く確認して新規問題へ戻れる状態です";
}

function reviewStagePlanData(summaries, config) {
  const session = normalizeReviewSession(config);
  const rows = reviewPriorityQueueRows(summaries, session);
  const groups = Object.fromEntries(
    ["rescue", "due", "growing", "secured"].map((key) => [
      key,
      {
        key,
        label: reviewMasteryStageLabel(key),
        count: 0,
        score: 0,
        rows: [],
        courses: new Map(),
        counts: { overdue: 0, today: 0, weak: 0, soon: 0, future: 0, total: 0 },
        retentionTotal: 0,
        retentionCount: 0,
      },
    ])
  );
  rows.forEach((row) => {
    const key = reviewMasteryEntryStage(row.entry);
    const group = groups[key] || groups.growing;
    const kind = reviewPriorityEntryKind(row.entry);
    const retention = Number(row.entry?.retentionPercent);
    group.count += 1;
    group.score += row.score;
    group.rows.push(row);
    group.counts[kind] = (group.counts[kind] || 0) + 1;
    group.counts.total += 1;
    if (Number.isFinite(retention)) {
      group.retentionTotal += retention;
      group.retentionCount += 1;
    }
    if (!group.courses.has(row.summary.courseId)) {
      group.courses.set(row.summary.courseId, {
        courseId: row.summary.courseId,
        courseName: row.summary.courseName,
        count: 0,
        score: 0,
      });
    }
    const course = group.courses.get(row.summary.courseId);
    course.count += 1;
    course.score += row.score;
  });
  Object.values(groups).forEach((group) => {
    group.averageRetention = group.retentionCount ? Math.round(group.retentionTotal / group.retentionCount) : null;
    group.bestCourse = [...group.courses.values()].sort(
      (a, b) =>
        Number(b.courseId === state.courseId) - Number(a.courseId === state.courseId) ||
        b.count - a.count ||
        b.score - a.score ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    )[0] || null;
    group.mode = reviewStagePlanStageMode(group.key, group);
    group.sets = reviewSessionSetCount(group.count, session.size);
  });
  const total = rows.length;
  const maxCount = Math.max(1, ...Object.values(groups).map((group) => group.count));
  return {
    session,
    rows,
    groups,
    total,
    maxCount,
    coach: reviewStagePlanCoach({ total, groups }),
  };
}

function reviewStagePlanHtml(summaries, config) {
  const data = reviewStagePlanData(summaries, config);
  const order = ["rescue", "due", "growing", "secured"];
  const headline = data.total
    ? `候補 ${data.total}問`
    : "候補なし";
  const width = (count) => (data.total ? Math.max(3, Math.round((count / data.total) * 100)) : 0);
  return `
    <div class="review-stage-plan" aria-label="復習ステージプラン">
      <div class="review-stage-head">
        <div>
          <span>STAGE PLAN</span>
          <strong>${escapeHtml(headline)}</strong>
        </div>
        <small>${escapeHtml(data.coach)}</small>
      </div>
      <div class="review-stage-meter" aria-label="復習候補のステージ分布">
        ${order.map((key) => `<span class="${escapeHtml(key)}" style="width: ${width(data.groups[key].count)}%"></span>`).join("")}
      </div>
      ${
        data.total
          ? `<div class="review-stage-grid">
              ${order
                .map((key) => {
                  const group = data.groups[key];
                  const active = group.count > 0 && group.bestCourse?.courseId;
                  const load = group.count ? Math.max(8, Math.round((group.count / data.maxCount) * 100)) : 4;
                  const retention = group.averageRetention == null ? "--" : `${group.averageRetention}%`;
                  const detail = group.bestCourse
                    ? `${group.bestCourse.courseName} / ${group.sets}セット`
                    : `${group.sets}セット`;
                  return `
                    <button
                      class="review-stage-card ${escapeHtml(key)}${active ? " active" : ""}"
                      type="button"
                      data-review-stage-plan-stage="${escapeHtml(key)}"
                      data-review-stage-plan-course="${escapeHtml(group.bestCourse?.courseId || "")}"
                      data-review-stage-plan-mode="${escapeHtml(group.mode)}"
                      style="--stage-load: ${load}%"
                      ${active ? "" : "disabled"}
                      title="${escapeHtml(active ? `${group.label}ステージを開始 / ${group.count}問 / 保持 ${retention}` : `${group.label}: 候補なし`)}"
                    >
                      <span>${escapeHtml(group.label)}</span>
                      <strong>${group.count}</strong>
                      <small>${escapeHtml(detail)} / 保持 ${escapeHtml(retention)}</small>
                      <i aria-hidden="true"></i>
                    </button>
                  `;
                })
                .join("")}
            </div>`
          : `<div class="review-curriculum-empty">この設定の復習候補はまだありません。モードを変えるか、新規回答を増やすと育ちます</div>`
      }
    </div>
  `;
}

function reviewBottleneckKey(courseId, focus) {
  return `${courseId}::${focus || "復習対象"}`;
}

function reviewBottleneckTriageItems(summaries, config) {
  const rows = reviewPriorityQueueRows(summaries, config);
  const groups = new Map();
  rows.forEach((row) => {
    const focus = reviewEntryFocusLabel(row.entry) || row.summary.courseName || "復習対象";
    const key = reviewBottleneckKey(row.summary.courseId, focus);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        courseId: row.summary.courseId,
        courseName: row.summary.courseName,
        focus,
        rows: [],
        score: 0,
        counts: { overdue: 0, today: 0, weak: 0, soon: 0, future: 0, total: 0 },
        retentionTotal: 0,
        retentionCount: 0,
        worstRetention: null,
      });
    }
    const group = groups.get(key);
    const kind = reviewPriorityEntryKind(row.entry);
    const retention = Number(row.entry?.retentionPercent);
    group.rows.push(row);
    group.score += row.score;
    group.counts[kind] = (group.counts[kind] || 0) + 1;
    group.counts.total += 1;
    if (Number.isFinite(retention)) {
      group.retentionTotal += retention;
      group.retentionCount += 1;
      group.worstRetention = group.worstRetention == null ? retention : Math.min(group.worstRetention, retention);
    }
  });
  return [...groups.values()]
    .map((group) => {
      const pressure =
        group.counts.overdue * 14 +
        group.counts.today * 9 +
        group.counts.weak * 7 +
        group.counts.soon * 3 +
        Math.min(18, group.counts.total * 2) +
        Math.min(28, group.score / 8);
      const mode = group.counts.overdue
        ? "overdue"
        : group.counts.today
          ? "today"
          : group.counts.weak
            ? "weak"
            : normalizeReviewSession(config).mode;
      return {
        ...group,
        pressure,
        mode,
        averageRetention: group.retentionCount ? Math.round(group.retentionTotal / group.retentionCount) : null,
        worstRetention: group.worstRetention == null ? null : Math.round(group.worstRetention),
      };
    })
    .sort(
      (a, b) =>
        b.pressure - a.pressure ||
        b.counts.total - a.counts.total ||
        b.score - a.score ||
        String(a.focus).localeCompare(String(b.focus), "ja")
    )
    .slice(0, 4);
}

function reviewBottleneckTriageCoach(items) {
  if (!items.length) return "回答履歴が増えると、復習負荷を作っている単元が見えるようになります";
  const top = items[0];
  if (top.counts.overdue) return `${shortText(top.focus, 22)}の遅れ${top.counts.overdue}問が最優先です`;
  if (top.counts.today) return `${shortText(top.focus, 22)}を今日中に触ると復習間隔が保てます`;
  if (top.counts.weak) return `${shortText(top.focus, 22)}に弱点が集中しています`;
  return `${shortText(top.focus, 22)}を前倒しすると、次の山が低くなります`;
}

function reviewBottleneckTriageHtml(summaries, config) {
  const items = reviewBottleneckTriageItems(summaries, config);
  const maxPressure = Math.max(1, ...items.map((item) => item.pressure));
  const segment = (kind, count, total) =>
    count
      ? `<span class="${escapeHtml(kind)}" style="width: ${Math.max(8, Math.round((count / Math.max(1, total)) * 100))}%"></span>`
      : "";
  return `
    <div class="review-bottleneck-triage" aria-label="単元別復習ボトルネック">
      <div class="review-bottleneck-head">
        <div>
          <span>UNIT TRIAGE</span>
          <strong>${items.length ? `詰まり ${items.length}件` : "詰まり待ち"}</strong>
        </div>
        <small>${escapeHtml(reviewBottleneckTriageCoach(items))}</small>
      </div>
      ${
        items.length
          ? `<div class="review-bottleneck-grid">
              ${items
                .map((item) => {
                  const load = Math.max(8, Math.round((item.pressure / maxPressure) * 100));
                  const retention = item.averageRetention == null ? "--" : `${item.averageRetention}%`;
                  const worst = item.worstRetention == null ? "--" : `${item.worstRetention}%`;
                  const title = `${item.courseName} / ${item.focus} / ${item.counts.total}問 / ${reviewSessionModeLabel(item.mode)}で単元復習`;
                  return `
                    <button
                      class="review-bottleneck-card ${escapeHtml(item.mode)}"
                      type="button"
                      data-review-bottleneck-course="${escapeHtml(item.courseId)}"
                      data-review-bottleneck-key="${escapeHtml(item.key)}"
                      data-review-bottleneck-mode="${escapeHtml(item.mode)}"
                      title="${escapeHtml(title)}"
                      style="--bottleneck-load: ${load}%"
                    >
                      <span>${escapeHtml(item.courseName)}</span>
                      <strong>${escapeHtml(shortText(item.focus, 36))}</strong>
                      <div class="review-bottleneck-bar" aria-hidden="true">
                        ${segment("overdue", item.counts.overdue, item.counts.total)}
                        ${segment("today", item.counts.today, item.counts.total)}
                        ${segment("weak", item.counts.weak, item.counts.total)}
                        ${segment("soon", item.counts.soon, item.counts.total)}
                        ${segment("future", item.counts.future, item.counts.total)}
                      </div>
                      <div class="review-bottleneck-meta">
                        <small>計 <b>${item.counts.total}</b></small>
                        <small>遅 <b>${item.counts.overdue}</b></small>
                        <small>弱 <b>${item.counts.weak}</b></small>
                        <small>保 <b>${escapeHtml(retention)}</b></small>
                      </div>
                      <em>最低保持 ${escapeHtml(worst)}</em>
                      <i aria-hidden="true"></i>
                    </button>
                  `;
                })
                .join("")}
            </div>`
          : `<div class="review-curriculum-empty">単元ごとの遅れ・弱点・保持率がたまると、ここに詰まりが並びます</div>`
      }
    </div>
  `;
}

function reviewSetPreviewCandidate(summaries, config) {
  const session = normalizeReviewSession(config);
  const candidates = summaries
    .filter((summary) => !summary.loading && !summary.failed)
    .map((summary) => {
      const entries = reviewSessionEntriesForSummary(summary, session);
      const available = reviewSessionAvailableEntriesForSummary(summary, session).length;
      return {
        summary,
        entries,
        available,
        score: entries.reduce((sum, entry) => sum + reviewSessionPriorityScore(entry), 0),
      };
    })
    .filter((candidate) => candidate.entries.length);
  candidates.sort(
    (a, b) =>
      b.entries.length - a.entries.length ||
      b.score - a.score ||
      b.available - a.available ||
      String(a.summary.courseName).localeCompare(String(b.summary.courseName), "ja")
  );
  return candidates[0] || null;
}

function reviewSetPreviewCoach(candidate, buckets, averageRetention) {
  if (!candidate) return "復習候補が育つと、開始前にセットの中身を確認できます";
  if (buckets.overdue) return "期限超過を先頭に寄せています。ここを潰すと復習の山が一気に低くなります";
  if (buckets.weak >= Math.ceil(candidate.entries.length / 2)) return "ミスと低得点が多いセットです。解説を長めに読むと伸びます";
  if (averageRetention != null && averageRetention < 65) return "保持率が落ち始めています。短時間でも今触る価値があります";
  if (buckets.today) return "今日分が中心です。1セットだけでもリズムを保てます";
  return "負荷は軽め。前倒し復習で明日以降の山を低くできます";
}

function reviewSetFocusList(entries) {
  const focusCounts = new Map();
  entries.forEach((entry) => {
    const focus = reviewEntryFocusLabel(entry) || "復習対象";
    focusCounts.set(focus, (focusCounts.get(focus) || 0) + 1);
  });
  return [...focusCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"))
    .slice(0, 4);
}

function reviewSetPreviewHtml(summaries, config) {
  const session = normalizeReviewSession(config);
  const candidate = reviewSetPreviewCandidate(summaries, session);
  if (!candidate) {
    return `
      <div class="review-set-preview empty" aria-label="復習セットプレビュー">
        <div class="review-set-head">
          <div>
            <span>SET PREVIEW</span>
            <strong>候補なし</strong>
          </div>
          <small>${escapeHtml(reviewSessionModeLabel(session.mode))} ${session.size}問</small>
        </div>
        <p>${escapeHtml(reviewSetPreviewCoach(null, {}, null))}</p>
      </div>
    `;
  }

  const entries = candidate.entries;
  const total = entries.length || 1;
  const buckets = entries.reduce(
    (acc, entry) => {
      if (entry.overdue) acc.overdue += 1;
      else if (entry.due) acc.today += 1;
      else if (isWeakReviewEntry(entry)) acc.weak += 1;
      else if (Number(entry.dueInDays) >= 0 && Number(entry.dueInDays) <= 7) acc.soon += 1;
      else acc.future += 1;
      return acc;
    },
    { overdue: 0, today: 0, weak: 0, soon: 0, future: 0 }
  );
  const weakTotal = entries.filter(isWeakReviewEntry).length;
  const averageRetention = reviewAverageRetention(entries);
  const worstRetention = Math.round(
    Math.min(...entries.map((entry) => Number(entry.retentionPercent || 100)))
  );
  const averageStreak = entries.length
    ? Math.round((entries.reduce((sum, entry) => sum + (Number(entry.correctStreak) || 0), 0) / entries.length) * 10) / 10
    : 0;
  const focusList = reviewSetFocusList(entries);
  const segment = (kind, count) =>
    count
      ? `<span class="${escapeHtml(kind)}" style="width: ${Math.max(8, Math.round((count / total) * 100))}%"></span>`
      : "";
  return `
    <div class="review-set-preview" aria-label="復習セットプレビュー">
      <div class="review-set-head">
        <div>
          <span>SET PREVIEW</span>
          <strong>${escapeHtml(candidate.summary.courseName)}</strong>
        </div>
        <small>${escapeHtml(reviewSessionModeLabel(session.mode))} ${entries.length}/${candidate.available}問</small>
      </div>
      <div
        class="review-set-composition"
        role="img"
        aria-label="遅れ${buckets.overdue}問 今日${buckets.today}問 弱点${buckets.weak}問 7日内${buckets.soon}問 保持${buckets.future}問"
      >
        ${segment("overdue", buckets.overdue)}
        ${segment("today", buckets.today)}
        ${segment("weak", buckets.weak)}
        ${segment("soon", buckets.soon)}
        ${segment("future", buckets.future)}
      </div>
      <div class="review-set-stats">
        <div><span>平均保持</span><strong>${averageRetention == null ? "--" : `${averageRetention}%`}</strong></div>
        <div><span>最低保持</span><strong>${Number.isFinite(worstRetention) ? `${worstRetention}%` : "--"}</strong></div>
        <div><span>弱点</span><strong>${weakTotal}</strong></div>
        <div><span>平均連勝</span><strong>${averageStreak}</strong></div>
      </div>
      ${
        focusList.length
          ? `<div class="review-set-focus" aria-label="このセットの重点単元">
              ${focusList
                .map(
                  (item) => `
                    <span title="${escapeHtml(item.label)}">
                      ${escapeHtml(shortText(item.label, 28))}
                      <b>${item.count}</b>
                    </span>
                  `
                )
                .join("")}
            </div>`
          : ""
      }
      <div class="review-set-actions">
        <button
          class="review-set-start"
          type="button"
          data-review-set-start-course="${escapeHtml(candidate.summary.courseId)}"
          data-review-set-start-mode="${escapeHtml(session.mode)}"
          title="${escapeHtml(`${candidate.summary.courseName}の${reviewSessionModeLabel(session.mode)}復習を開始`)}"
        >このセット開始</button>
      </div>
      <p>${escapeHtml(reviewSetPreviewCoach(candidate, buckets, averageRetention))}</p>
    </div>
  `;
}

function reviewSetBlueprintCoach(candidate, buckets, averageRetention) {
  if (!candidate) return "復習設定を変えるか、対象科目の回答履歴が増えるとセット設計図が出ます";
  if (buckets.overdue) return "期限超過が混じっています。上から順に解くと復習負荷が下がりやすい構成です";
  if (buckets.weak >= Math.ceil(candidate.entries.length / 2)) return "弱点比率が高いセットです。正誤より解説確認を厚めにすると回収率が上がります";
  if (averageRetention != null && averageRetention < 70) return "保持率が落ち始めた問題が中心です。短時間でも今日触る価値があります";
  if (buckets.soon) return "前倒し向きのセットです。明日以降の復習ピークを先に削れます";
  return "軽い確認セットです。新規問題へ戻る前のウォームアップに使えます";
}

function reviewSetBlueprintQuestionRowHtml(row, index, maxScore) {
  const entry = row.entry;
  const kind = reviewPriorityEntryKind(entry);
  const reason = reviewPriorityEntryLabel(entry);
  const focus = reviewEntryFocusLabel(entry) || row.summary.courseName;
  const preview = reviewPriorityQuestionPreview(entry) || "問題文プレビューなし";
  const retention = entry.retentionPercent == null ? "--" : `${Math.round(Number(entry.retentionPercent) || 0)}%`;
  const priority = Math.max(8, Math.round((row.score / Math.max(1, maxScore)) * 100));
  return `
    <div class="review-blueprint-question ${escapeHtml(kind)}" style="--blueprint-priority: ${priority}%">
      <b>${index + 1}</b>
      <span>
        <strong>${escapeHtml(focus)}</strong>
        <small>${escapeHtml(shortText(preview, 64))}</small>
      </span>
      <em>${escapeHtml(reason)} / 保持 ${escapeHtml(retention)}</em>
      <i aria-hidden="true"></i>
    </div>
  `;
}

function reviewSetBlueprintHtml(summaries, config = state.reviewSession) {
  const session = normalizeReviewSession(config);
  const candidate = reviewSetPreviewCandidate(summaries, session);
  if (!candidate) {
    return `
      <div class="review-blueprint-head">
        <div>
          <span>SET BLUEPRINT</span>
          <strong>候補なし</strong>
        </div>
        <small>${escapeHtml(reviewSessionModeLabel(session.mode))} ${session.size}問</small>
      </div>
      <div class="review-blueprint-empty">${escapeHtml(reviewSetBlueprintCoach(null, {}, null))}</div>
    `;
  }

  const entries = candidate.entries;
  const total = entries.length || 1;
  const rows = entries.map((entry) => ({
    summary: candidate.summary,
    entry,
    score: reviewSessionPriorityScore(entry),
  }));
  const buckets = entries.reduce(
    (acc, entry) => {
      if (entry.overdue) acc.overdue += 1;
      else if (entry.due) acc.today += 1;
      else if (isWeakReviewEntry(entry)) acc.weak += 1;
      else if (Number(entry.dueInDays) >= 0 && Number(entry.dueInDays) <= 7) acc.soon += 1;
      else acc.future += 1;
      return acc;
    },
    { overdue: 0, today: 0, weak: 0, soon: 0, future: 0 }
  );
  const averageRetention = reviewAverageRetention(entries);
  const worstRetention = entries.length
    ? Math.round(Math.min(...entries.map((entry) => Number(entry.retentionPercent || 100))))
    : null;
  const focusList = reviewSetFocusList(entries).slice(0, 5);
  const maxScore = Math.max(1, ...rows.map((row) => row.score));
  const secondsPerQuestion = reviewAverageSecondsPerQuestion();
  const segment = (kind, count) =>
    count
      ? `<span class="${escapeHtml(kind)}" style="width: ${Math.max(8, Math.round((count / total) * 100))}%"></span>`
      : "";
  return `
    <div class="review-blueprint-head">
      <div>
        <span>SET BLUEPRINT</span>
        <strong>${escapeHtml(candidate.summary.courseName)}</strong>
      </div>
      <small>${escapeHtml(reviewSessionModeLabel(session.mode))} ${entries.length}/${candidate.available}問 / ${escapeHtml(reviewEstimateDurationText(entries.length, secondsPerQuestion))}</small>
    </div>
    <div class="review-blueprint-composition" aria-label="復習セット内訳">
      ${segment("overdue", buckets.overdue)}
      ${segment("today", buckets.today)}
      ${segment("weak", buckets.weak)}
      ${segment("soon", buckets.soon)}
      ${segment("future", buckets.future)}
    </div>
    <div class="review-blueprint-metrics">
      <div><span>平均保持</span><strong>${averageRetention == null ? "--" : `${averageRetention}%`}</strong></div>
      <div><span>最低保持</span><strong>${worstRetention == null ? "--" : `${worstRetention}%`}</strong></div>
      <div><span>弱点</span><strong>${buckets.weak}</strong></div>
      <div><span>遅れ</span><strong>${buckets.overdue}</strong></div>
    </div>
    ${
      focusList.length
        ? `<div class="review-blueprint-focus">
            ${focusList
              .map(
                (item) => `
                  <span title="${escapeHtml(item.label)}">
                    ${escapeHtml(shortText(item.label, 30))}
                    <b>${item.count}</b>
                  </span>
                `
              )
              .join("")}
          </div>`
        : ""
    }
    <div class="review-blueprint-questions">
      ${rows.slice(0, 3).map((row, index) => reviewSetBlueprintQuestionRowHtml(row, index, maxScore)).join("")}
    </div>
    <div class="review-blueprint-actions">
      <p>${escapeHtml(reviewSetBlueprintCoach(candidate, buckets, averageRetention))}</p>
      <button
        class="review-blueprint-start"
        type="button"
        data-review-blueprint-course="${escapeHtml(candidate.summary.courseId)}"
        data-review-blueprint-mode="${escapeHtml(session.mode)}"
        title="${escapeHtml(`${candidate.summary.courseName}の${reviewSessionModeLabel(session.mode)}復習を開始`)}"
      >この設計で開始</button>
    </div>
  `;
}

function reviewOutcomeAccuracy(correct, total) {
  return total ? Math.round((Math.max(0, correct) / Math.max(1, total)) * 100) : null;
}

function reviewOutcomeKind(accuracy, fallback = "idle") {
  if (accuracy == null) return fallback;
  if (accuracy >= 86) return "strong";
  if (accuracy >= 68) return "warm";
  return "danger";
}

function reviewOutcomeData(reviewSummaries = reviewCurriculumSummaries()) {
  const history = normalizeReviewSessionHistory(state.reviewSessionHistory);
  const todayKey = localDayKey();
  const dayKeys = recentStudyDayKeys(7, todayKey);
  const byDay = reviewSessionStatsByDayMap(history);
  const days = dayKeys.map((dayKey) => {
    const stats = byDay.get(dayKey) || { sessions: 0, questions: 0, correct: 0, wrong: 0, durationMs: 0 };
    const accuracy = reviewOutcomeAccuracy(stats.correct, stats.questions);
    return {
      dayKey,
      ...stats,
      accuracy,
      active: stats.sessions > 0 || stats.questions > 0,
      kind: stats.questions ? reviewOutcomeKind(accuracy, stats.wrong ? "danger" : "warm") : "idle",
    };
  });
  const week = days.reduce(
    (acc, day) => {
      acc.sessions += day.sessions;
      acc.questions += day.questions;
      acc.correct += day.correct;
      acc.wrong += day.wrong;
      acc.durationMs += day.durationMs;
      return acc;
    },
    { sessions: 0, questions: 0, correct: 0, wrong: 0, durationMs: 0 }
  );
  week.accuracy = reviewOutcomeAccuracy(week.correct, week.questions);
  const today = days[days.length - 1] || { sessions: 0, questions: 0, correct: 0, wrong: 0, durationMs: 0, accuracy: null };
  const recent = history.slice(0, 5).reduce(
    (acc, session) => {
      acc.total += session.total;
      acc.correct += session.correct;
      acc.wrong += session.wrong;
      return acc;
    },
    { total: 0, correct: 0, wrong: 0 }
  );
  const previous = history.slice(5, 10).reduce(
    (acc, session) => {
      acc.total += session.total;
      acc.correct += session.correct;
      return acc;
    },
    { total: 0, correct: 0 }
  );
  const recentAccuracy = reviewOutcomeAccuracy(recent.correct, recent.total);
  const previousAccuracy = reviewOutcomeAccuracy(previous.correct, previous.total);
  const accuracyDelta = recentAccuracy == null || previousAccuracy == null ? null : recentAccuracy - previousAccuracy;
  const recovery = reviewRecoveryData(history);
  const totals = reviewCurveTotals(reviewSummaries, todayKey);
  const pressure = reviewLoadPressure(totals);
  const smartCourseId = reviewMissionBestCourseId(reviewSummaries, { ...state.reviewSession, mode: "smart" });
  const dueMode = totals.overdueCount ? "overdue" : totals.todayCount ? "today" : totals.weakCount ? "weak" : "smart";
  const dueCourseId =
    reviewMissionBestCourseId(reviewSummaries, { ...state.reviewSession, mode: dueMode }) || smartCourseId;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (week.accuracy ?? 0) * 0.48 +
          (recentAccuracy ?? 0) * 0.32 +
          Math.max(0, 100 - Math.min(100, recovery.unresolvedCount * 8 + pressure * 0.65)) * 0.2
      )
    )
  );
  const kind = !history.length
    ? "idle"
    : recovery.unresolvedCount >= 6 || pressure >= 78 || (recentAccuracy != null && recentAccuracy < 58)
      ? "danger"
      : score >= 78
        ? "strong"
        : "warm";
  return {
    history,
    today,
    week,
    days,
    recent,
    recentAccuracy,
    previousAccuracy,
    accuracyDelta,
    recovery,
    totals,
    pressure,
    score,
    kind,
    dueMode,
    dueCourseId,
    smartCourseId,
    secondsPerQuestion: reviewAverageSecondsPerQuestion(history),
  };
}

function reviewOutcomeCoach(data) {
  if (!data.history.length) return "復習を1セット完走すると、精度・回収・負荷の流れがここに出ます";
  if (data.recovery.unresolvedCount) {
    const group = data.recovery.topGroup;
    const label = group ? `${group.courseName} ${group.entries.length}問` : `${data.recovery.unresolvedCount}問`;
    return `未回収ミスが${label}あります。ここを先に回収すると成果スコアが上がります`;
  }
  if (data.pressure >= 72) return "復習負荷が高めです。10問以下のセットに分けて山を削ると安定します";
  if (data.accuracyDelta != null && data.accuracyDelta < -8) {
    return `直近精度が${Math.abs(data.accuracyDelta)}pt下がっています。弱点モードで短く立て直しましょう`;
  }
  if (data.week.questions && data.week.accuracy >= 86) return "7日精度はかなり良いです。前倒し復習で明日以降の負荷も下げられます";
  if (data.today.questions) return "今日も復習が動いています。もう1セットだけ足すと定着ログが強くなります";
  return "今日はまだ復習が空です。5問だけ触るとリズムが戻ります";
}

function reviewOutcomeMetricHtml({ kind = "idle", label, value, detail }) {
  return `
    <div class="review-outcome-metric ${escapeHtml(kind)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function reviewOutcomeSankeyWidth(value, total) {
  if (!value || !total) return 0;
  return Math.max(5, Math.min(34, Math.round((value / Math.max(1, total)) * 34)));
}

function reviewOutcomeSankeyNodeHtml({ x, y, w = 132, h = 50, kind = "idle", label, value, detail }) {
  return `
    <g class="review-sankey-node ${escapeHtml(kind)}" transform="translate(${x} ${y})">
      <rect width="${w}" height="${h}" rx="9"></rect>
      <text x="12" y="18" class="review-sankey-node-label">${escapeHtml(label)}</text>
      <text x="12" y="37" class="review-sankey-node-value">${escapeHtml(value)}</text>
      ${detail ? `<text x="${w - 12}" y="37" class="review-sankey-node-detail" text-anchor="end">${escapeHtml(detail)}</text>` : ""}
    </g>
  `;
}

function reviewOutcomeSankeyLinkHtml({ fromX, fromY, toX, toY, value, total, kind = "idle", label }) {
  const width = reviewOutcomeSankeyWidth(value, total);
  if (!width) return "";
  const midX = Math.round((fromX + toX) / 2);
  return `
    <path
      class="review-sankey-link ${escapeHtml(kind)}"
      d="M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}"
      stroke-width="${width}"
    >
      <title>${escapeHtml(label)} ${value}問</title>
    </path>
  `;
}

function reviewOutcomeSankeyHtml(data) {
  const weekTotal = Number(data.week.questions || 0);
  const total = weekTotal || Number(data.recent.total || 0);
  if (!total) {
    return `
      <div class="review-outcome-sankey empty">
        <div>
          <span>実績フロー</span>
          <strong>復習1セットで表示</strong>
        </div>
        <p>回答すると、正解・ミス・未回収への流れがサンキーダイヤグラムで出ます。</p>
      </div>
    `;
  }

  const correct = weekTotal ? data.week.correct : data.recent.correct;
  const wrong = weekTotal ? data.week.wrong : data.recent.wrong;
  const unresolved = Math.min(Math.max(0, wrong), Math.max(0, Number(data.recovery.unresolvedCount || 0)));
  const recovered = Math.max(0, wrong - unresolved);
  const sourceLabel = weekTotal ? "直近7日" : "直近5セット";
  const accuracy = reviewOutcomeAccuracy(correct, total);
  const sourceDetail = accuracy == null ? "" : `正答${accuracy}%`;
  const links = [
    {
      fromX: 168,
      fromY: 108,
      toX: 274,
      toY: 66,
      value: correct,
      total,
      kind: "strong",
      label: "回答から正解",
    },
    {
      fromX: 168,
      fromY: 142,
      toX: 274,
      toY: wrong ? 174 : 66,
      value: wrong,
      total,
      kind: "danger",
      label: "回答からミス",
    },
    {
      fromX: 406,
      fromY: 66,
      toX: 512,
      toY: 66,
      value: correct,
      total,
      kind: "strong",
      label: "正解から定着",
    },
    {
      fromX: 406,
      fromY: 164,
      toX: 512,
      toY: 148,
      value: recovered,
      total,
      kind: "warm",
      label: "ミスから回収済",
    },
    {
      fromX: 406,
      fromY: 184,
      toX: 512,
      toY: 212,
      value: unresolved,
      total,
      kind: "danger",
      label: "ミスから未回収",
    },
  ];
  const destinationNodes = [
    reviewOutcomeSankeyNodeHtml({
      x: 512,
      y: 40,
      kind: "strong",
      label: "定着ログ",
      value: `${correct}問`,
      detail: sourceLabel,
    }),
    recovered
      ? reviewOutcomeSankeyNodeHtml({
          x: 512,
          y: 122,
          kind: "warm",
          label: "回収済",
          value: `${recovered}問`,
          detail: "ミス処理",
        })
      : "",
    unresolved
      ? reviewOutcomeSankeyNodeHtml({
          x: 512,
          y: 186,
          kind: "danger",
          label: "未回収",
          value: `${unresolved}問`,
          detail: "次に回収",
        })
      : "",
  ].join("");

  return `
    <div class="review-outcome-sankey" aria-label="復習実績サンキーダイヤグラム">
      <div class="review-outcome-sankey-head">
        <div>
          <span>実績フロー</span>
          <strong>${escapeHtml(sourceLabel)} ${total}問</strong>
        </div>
        <small>${escapeHtml(sourceDetail || "復習履歴から集計")}</small>
      </div>
      <svg class="review-sankey-svg" viewBox="0 0 670 260" role="img" aria-label="${escapeHtml(`${sourceLabel} ${total}問の復習実績フロー`)}">
        <defs>
          <filter id="reviewSankeyGlow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        <g class="review-sankey-links" filter="url(#reviewSankeyGlow)">
          ${links.map(reviewOutcomeSankeyLinkHtml).join("")}
        </g>
        <g class="review-sankey-nodes">
          ${reviewOutcomeSankeyNodeHtml({
            x: 36,
            y: 92,
            kind: data.kind,
            label: "復習実績",
            value: `${total}問`,
            detail: sourceDetail,
          })}
          ${reviewOutcomeSankeyNodeHtml({
            x: 274,
            y: 40,
            kind: "strong",
            label: "正解",
            value: `${correct}問`,
            detail: accuracy == null ? "" : `${accuracy}%`,
          })}
          ${
            wrong
              ? reviewOutcomeSankeyNodeHtml({
                  x: 274,
                  y: 148,
                  kind: "danger",
                  label: "ミス",
                  value: `${wrong}問`,
                  detail: "要確認",
                })
              : ""
          }
          ${destinationNodes}
        </g>
      </svg>
    </div>
  `;
}

function reviewOutcomePanelHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const data = reviewOutcomeData(reviewSummaries);
  const deltaText =
    data.accuracyDelta == null ? "比較待ち" : `${data.accuracyDelta >= 0 ? "+" : ""}${data.accuracyDelta}pt`;
  const dueDetail = data.totals.overdueCount
    ? `遅れ ${data.totals.overdueCount}問`
    : data.totals.todayCount
      ? `今日 ${data.totals.todayCount}問`
      : `7日内 ${data.totals.next7Count}問`;
  const actionHtml = data.recovery.topGroup
    ? `<button
        class="review-outcome-start danger"
        type="button"
        data-review-outcome-action="recovery"
        data-review-recovery-course="${escapeHtml(data.recovery.topGroup.courseId)}"
        title="${escapeHtml(`${data.recovery.topGroup.courseName}の未回収ミスを復習`)}"
      >未回収ミスを回収</button>`
    : data.dueCourseId
      ? `<button
          class="review-outcome-start"
          type="button"
          data-review-outcome-action="start"
          data-review-outcome-course="${escapeHtml(data.dueCourseId)}"
          data-review-outcome-mode="${escapeHtml(data.dueMode)}"
          title="${escapeHtml(`${reviewSessionModeLabel(data.dueMode)}復習を開始`)}"
        >次の復習を開始</button>`
      : `<button class="review-outcome-start" type="button" disabled>復習候補待ち</button>`;
  return `
    <div class="review-outcome-head">
      <div>
        <span>SANKEY FLOW</span>
        <strong>${escapeHtml(data.kind === "idle" ? "実績フロー待ち" : `実績フロー ${data.score}`)}</strong>
      </div>
      <div class="review-outcome-score ${escapeHtml(data.kind)}" style="--review-outcome-score: ${data.score}%">
        <b>${data.history.length ? data.score : "--"}</b>
        <i aria-hidden="true"></i>
        <small>${escapeHtml(data.history.length ? `直近 ${data.recentAccuracy ?? "--"}% / ${deltaText}` : "1セット完走で開始")}</small>
      </div>
    </div>
    <div class="review-outcome-metrics">
      ${reviewOutcomeMetricHtml({
        kind: reviewOutcomeKind(data.today.accuracy, data.today.questions ? "warm" : "idle"),
        label: "今日",
        value: data.today.questions ? `${data.today.questions}問` : "未着手",
        detail: data.today.accuracy == null ? "復習待ち" : `正答 ${data.today.accuracy}% / ${data.today.sessions}セット`,
      })}
      ${reviewOutcomeMetricHtml({
        kind: reviewOutcomeKind(data.week.accuracy, data.week.questions ? "warm" : "idle"),
        label: "7日",
        value: data.week.questions ? `${data.week.questions}問` : "0問",
        detail: data.week.accuracy == null ? "履歴なし" : `正答 ${data.week.accuracy}% / ${formatStudyDuration(data.week.durationMs)}`,
      })}
      ${reviewOutcomeMetricHtml({
        kind: data.recovery.unresolvedCount ? "danger" : data.history.length ? "strong" : "idle",
        label: "未回収",
        value: `${data.recovery.unresolvedCount}問`,
        detail: data.recovery.recovered ? `回収済 ${data.recovery.recovered}問` : "ミス待ち",
      })}
      ${reviewOutcomeMetricHtml({
        kind: data.pressure >= 72 ? "danger" : data.pressure >= 38 ? "warm" : data.totals.totalCount ? "strong" : "idle",
        label: "次負荷",
        value: `${data.pressure}`,
        detail: dueDetail,
      })}
    </div>
    ${reviewOutcomeSankeyHtml(data)}
    <div class="review-outcome-action">
      <p>${escapeHtml(reviewOutcomeCoach(data))}</p>
      ${actionHtml}
    </div>
  `;
}

function reviewCoursePulseRows(reviewSummaries = reviewCurriculumSummaries()) {
  const historyRows = reviewSessionCourseRecoveryRows(state.reviewSessionHistory);
  const historyByCourse = new Map(historyRows.map((row) => [row.courseId, row]));
  const summaryByCourse = new Map(reviewSummaries.map((summary) => [summary.courseId, summary]));
  const courseIds = new Set([...summaryByCourse.keys(), ...historyByCourse.keys()]);
  return [...courseIds]
    .map((courseId) => {
      const summary = summaryByCourse.get(courseId) || {};
      const history = historyByCourse.get(courseId) || {};
      const courseName =
        summary.courseName ||
        history.courseName ||
        courseManifest(courseId)?.name ||
        (courseId === "unknown" ? "復習セッション" : courseId);
      const overdue = Number(summary.overdueCount || 0);
      const today = Number(summary.todayCount || 0);
      const weak = Number(summary.weakCount || 0);
      const next7 = Number(summary.next7Count || 0);
      const due = Number(summary.dueCount || 0);
      const unresolved = Number(history.unresolvedCount || 0);
      const repeated = Number(history.repeatedWrong || 0);
      const accuracy = history.total ? history.accuracyPercent : null;
      const averageSeconds = Number(history.averageSeconds || 0);
      const retention = summary.entries?.length ? reviewAverageRetention(summary.entries) : null;
      const pulse =
        unresolved * 18 +
        repeated * 9 +
        overdue * 15 +
        today * 9 +
        weak * 7 +
        next7 * 2.6 +
        (accuracy == null ? 0 : Math.max(0, 74 - accuracy) * 0.85) +
        (retention == null ? 0 : Math.max(0, 70 - retention) * 0.65);
      const pressure = Math.min(100, Math.round(pulse));
      const mode = overdue ? "overdue" : today || due ? "today" : weak ? "weak" : "smart";
      const hasSchedule = overdue + today + due + weak + next7 > 0;
      const action = unresolved
        ? "recovery"
        : hasSchedule && courseManifest(courseId)
          ? "review"
          : history.latestSessionId && history.latestHasQuestions
            ? "history"
            : courseManifest(courseId)
              ? "course"
              : "";
      const kind = unresolved || overdue || pressure >= 72
        ? "danger"
        : today || due || weak || pressure >= 38
          ? "warm"
          : history.total || summary.totalCount
            ? "strong"
            : "idle";
      return {
        courseId,
        courseName,
        sessions: Number(history.sessions || 0),
        total: Number(history.total || 0),
        accuracy,
        averageSeconds,
        unresolved,
        repeated,
        overdue,
        today,
        due,
        weak,
        next7,
        retention,
        pressure,
        mode,
        action,
        actionDisabled: !action,
        latestSessionId: history.latestSessionId || "",
        latestCompletedAt: Number(history.latestCompletedAt || 0),
        kind,
      };
    })
    .filter((row) => {
      return (
        row.sessions ||
        row.total ||
        row.unresolved ||
        row.overdue ||
        row.today ||
        row.due ||
        row.weak ||
        row.next7 ||
        summaryByCourse.get(row.courseId)?.totalCount
      );
    })
    .sort(
      (a, b) =>
        Number(b.courseId === state.courseId) - Number(a.courseId === state.courseId) ||
        b.pressure - a.pressure ||
        b.unresolved - a.unresolved ||
        b.overdue - a.overdue ||
        b.today - a.today ||
        b.latestCompletedAt - a.latestCompletedAt ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    )
    .slice(0, 5);
}

function reviewCoursePulseCoach(rows) {
  if (!rows.length) return "復習履歴や期限到来が増えると、科目ごとの効きどころをここに並べます";
  const top = rows[0];
  if (top.unresolved) return `${top.courseName}の未回収${top.unresolved}問が最優先です`;
  if (top.overdue) return `${top.courseName}の遅れ${top.overdue}問を先に削ると負荷が下がります`;
  if (top.today || top.due) return `${top.courseName}の今日分を1セット閉じるとリズムが整います`;
  if (top.weak) return `${top.courseName}は弱点復習が効きます。短く解説確認まで回しましょう`;
  return "復習負荷は軽め。前倒し候補か新規学習へ進めます";
}

function reviewCoursePulseActionLabel(row) {
  if (row.action === "recovery") return "未回収";
  if (row.action === "review") return reviewSessionModeLabel(row.mode);
  if (row.action === "history") return "再演習";
  if (row.action === "course") return "開く";
  return "待機";
}

function reviewCoursePulseRowHtml(row, maxPressure) {
  const pressure = Math.max(6, Math.round((row.pressure / Math.max(1, maxPressure)) * 100));
  const accuracyText = row.accuracy == null ? "--" : `${row.accuracy}%`;
  const retentionText = row.retention == null ? "--" : `${row.retention}%`;
  const detail = [
    row.unresolved ? `未回収 ${row.unresolved}` : "",
    row.overdue ? `遅れ ${row.overdue}` : "",
    row.today ? `今日 ${row.today}` : "",
    row.weak ? `弱点 ${row.weak}` : "",
    row.next7 ? `7日 ${row.next7}` : "",
  ].filter(Boolean);
  const actionAttrs =
    row.action === "recovery"
      ? `data-review-course-pulse-action="recovery" data-review-recovery-course="${escapeHtml(row.courseId)}"`
      : row.action === "review"
        ? `data-review-course-pulse-action="review" data-review-course-pulse-course="${escapeHtml(row.courseId)}" data-review-course-pulse-mode="${escapeHtml(row.mode)}"`
        : row.action === "history"
          ? `data-review-course-pulse-action="history" data-review-history-id="${escapeHtml(row.latestSessionId)}"`
          : row.action === "course"
            ? `data-review-course-pulse-action="course" data-review-course-pulse-course="${escapeHtml(row.courseId)}"`
            : "";
  return `
    <button
      class="review-course-pulse-row ${escapeHtml(row.kind)}"
      type="button"
      ${actionAttrs}
      ${row.actionDisabled ? "disabled" : ""}
      style="--course-pulse-pressure: ${pressure}%"
      title="${escapeHtml(`${row.courseName} / ${reviewCoursePulseActionLabel(row)}`)}"
    >
      <span class="review-course-pulse-main">
        <strong>${escapeHtml(row.courseName)}</strong>
        <small>${escapeHtml(detail.length ? detail.join(" / ") : row.sessions ? `${row.sessions}回 / ${row.total}問` : "復習候補待ち")}</small>
      </span>
      <span class="review-course-pulse-score">
        <b>${escapeHtml(accuracyText)}</b>
        <small>保持 ${escapeHtml(retentionText)}</small>
      </span>
      <span class="review-course-pulse-meter" aria-hidden="true"><i></i></span>
      <span class="review-course-pulse-meta">
        <b>再${row.repeated}</b>
        <b>${row.averageSeconds || "--"}秒</b>
        <b>${row.next7 ? `7日${row.next7}` : reviewSessionModeLabel(row.mode)}</b>
      </span>
      <em>${escapeHtml(reviewCoursePulseActionLabel(row))}</em>
    </button>
  `;
}

function reviewCoursePulsePanelHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const rows = reviewCoursePulseRows(reviewSummaries);
  const maxPressure = Math.max(1, ...rows.map((row) => row.pressure));
  const activeCount = rows.filter((row) => row.pressure > 0 || row.sessions).length;
  const dangerCount = rows.filter((row) => row.kind === "danger").length;
  const headline = dangerCount ? `要処理 ${dangerCount}科目` : activeCount ? `稼働 ${activeCount}科目` : "パルス待ち";
  return `
    <div class="review-course-pulse-head">
      <div>
        <span>COURSE PULSE</span>
        <strong>${escapeHtml(headline)}</strong>
      </div>
      <small>${escapeHtml(reviewCoursePulseCoach(rows))}</small>
    </div>
    ${
      rows.length
        ? `<div class="review-course-pulse-list">
            ${rows.map((row) => reviewCoursePulseRowHtml(row, maxPressure)).join("")}
          </div>`
        : `<div class="review-course-pulse-empty">復習セッションや回答履歴が増えると、科目ごとの優先度が出ます</div>`
    }
  `;
}

function reviewReturnBucketCounts(entries) {
  return entries.reduce(
    (counts, entry) => {
      const kind = reviewPriorityEntryKind(entry);
      counts[kind] = (counts[kind] || 0) + 1;
      counts.total += 1;
      return counts;
    },
    { overdue: 0, today: 0, weak: 0, soon: 0, future: 0, total: 0 }
  );
}

function reviewReturnCandidateForMode(summary, config, mode) {
  const session = normalizeReviewSession({ ...config, mode });
  const availableEntries = reviewSessionAvailableEntriesForSummary(summary, session);
  const entries = availableEntries.slice(0, session.size);
  if (!entries.length) return null;
  const buckets = reviewReturnBucketCounts(entries);
  const averageRetention = reviewAverageRetention(entries);
  const priorityScore = entries.reduce((sum, entry) => sum + reviewSessionPriorityScore(entry), 0);
  const score =
    priorityScore / 5 +
    buckets.overdue * 24 +
    buckets.today * 15 +
    buckets.weak * 12 +
    buckets.soon * 5 +
    (averageRetention == null ? 0 : Math.max(0, 78 - averageRetention) * 0.75);
  return {
    mode,
    entries,
    available: availableEntries.length,
    buckets,
    averageRetention,
    score,
  };
}

function reviewReturnRowKind(row) {
  if (row.unresolved || row.buckets.overdue || row.score >= 82) return "danger";
  if (row.buckets.today || row.buckets.weak || row.score >= 40) return "warm";
  return "strong";
}

function reviewReturnRows(reviewSummaries = reviewCurriculumSummaries()) {
  const config = normalizeReviewSession(state.reviewSession);
  const recovery = reviewRecoveryData();
  const recoveryByCourse = new Map(recovery.groups.map((group) => [group.courseId, group]));
  const rows = reviewSummaries
    .filter((summary) => !summary.loading && !summary.failed)
    .map((summary) => {
      const candidates = ["overdue", "today", "weak", "smart"]
        .map((mode) => reviewReturnCandidateForMode(summary, config, mode))
        .filter(Boolean)
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.entries.length - a.entries.length ||
            b.available - a.available ||
            String(a.mode).localeCompare(String(b.mode))
        );
      const best = candidates[0] || null;
      const recoveryGroup = recoveryByCourse.get(summary.courseId) || null;
      const recoveryScore = recoveryGroup
        ? recoveryGroup.entries.length * 28 + recoveryGroup.repeatedWrong * 14 + Math.min(30, recoveryGroup.score * 1.2)
        : 0;
      if (!best && !recoveryGroup && !summary.totalCount) return null;
      const useRecovery = recoveryGroup && (!best || recoveryScore >= best.score * 0.85);
      const buckets = useRecovery ? { overdue: 0, today: 0, weak: recoveryGroup.entries.length, soon: 0, future: 0, total: recoveryGroup.entries.length } : best?.buckets || { overdue: 0, today: 0, weak: 0, soon: 0, future: 0, total: 0 };
      const score = Math.round(Math.max(useRecovery ? recoveryScore : 0, best?.score || 0));
      const questionCount = useRecovery ? Math.min(config.size, recoveryGroup.entries.length) : best?.entries.length || 0;
      const available = useRecovery ? recoveryGroup.entries.length : best?.available || 0;
      const averageRetention = useRecovery ? null : best?.averageRetention ?? (summary.entries?.length ? reviewAverageRetention(summary.entries) : null);
      const row = {
        courseId: summary.courseId,
        courseName: summary.courseName,
        action: useRecovery ? "recovery" : best ? "review" : courseManifest(summary.courseId) ? "course" : "",
        mode: best?.mode || config.mode,
        buckets,
        score,
        questionCount,
        available,
        unresolved: recoveryGroup?.entries?.length || 0,
        repeated: recoveryGroup?.repeatedWrong || 0,
        averageRetention,
        totalCount: summary.totalCount || 0,
        next7: summary.next7Count || 0,
        duration: reviewEstimateDurationText(questionCount),
      };
      row.kind = reviewReturnRowKind(row);
      return row;
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.unresolved - a.unresolved ||
        b.questionCount - a.questionCount ||
        Number(b.courseId === state.courseId) - Number(a.courseId === state.courseId) ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    );
  return rows.slice(0, 4);
}

function reviewReturnCoach(rows) {
  if (!rows.length) return "回答履歴が増えると、どの科目を1セット回すと効くかを比較できます";
  const top = rows[0];
  if (top.unresolved) return `${top.courseName}は未回収${top.unresolved}問。ここを閉じる効果が一番大きいです`;
  if (top.buckets.overdue) return `${top.courseName}の遅れ${top.buckets.overdue}問が最短の改善ポイントです`;
  if (top.buckets.today) return `${top.courseName}を今日中に触ると復習間隔を崩さず進められます`;
  if (top.buckets.weak) return `${top.courseName}は弱点${top.buckets.weak}問。短く解説まで読むのが効きます`;
  return `${top.courseName}を前倒しすると、次の復習ピークを低くできます`;
}

function reviewReturnActionLabel(row) {
  if (row.action === "recovery") return "回収";
  if (row.action === "review") return reviewSessionModeLabel(row.mode);
  if (row.action === "course") return "開く";
  return "待機";
}

function reviewReturnCardHtml(row, maxScore) {
  const yieldWidth = Math.max(8, Math.round((row.score / Math.max(1, maxScore)) * 100));
  const total = Math.max(1, row.buckets.total);
  const segment = (kind, count) =>
    count
      ? `<span class="${escapeHtml(kind)}" style="width: ${Math.max(8, Math.round((count / total) * 100))}%"></span>`
      : "";
  const actionAttrs =
    row.action === "recovery"
      ? `data-review-return-action="recovery" data-review-recovery-course="${escapeHtml(row.courseId)}"`
      : row.action === "review"
        ? `data-review-return-action="review" data-review-return-course="${escapeHtml(row.courseId)}" data-review-return-mode="${escapeHtml(row.mode)}"`
        : row.action === "course"
          ? `data-review-return-action="course" data-review-return-course="${escapeHtml(row.courseId)}"`
          : "";
  const retention = row.averageRetention == null ? "--" : `${row.averageRetention}%`;
  const detail = [
    row.unresolved ? `未回収 ${row.unresolved}` : "",
    row.buckets.overdue ? `遅れ ${row.buckets.overdue}` : "",
    row.buckets.today ? `今日 ${row.buckets.today}` : "",
    row.buckets.weak ? `弱点 ${row.buckets.weak}` : "",
    !row.buckets.overdue && !row.buckets.today && row.next7 ? `7日 ${row.next7}` : "",
  ].filter(Boolean);
  return `
    <button
      class="review-return-card ${escapeHtml(row.kind)}"
      type="button"
      ${actionAttrs}
      ${row.action ? "" : "disabled"}
      style="--review-return-yield: ${yieldWidth}%"
      title="${escapeHtml(`${row.courseName} / ${reviewReturnActionLabel(row)} / 効果 ${row.score}`)}"
    >
      <span class="review-return-yield">
        <b>${row.score}</b>
        <small>効果</small>
      </span>
      <span class="review-return-main">
        <strong>${escapeHtml(row.courseName)}</strong>
        <small>${escapeHtml(detail.length ? detail.join(" / ") : `${row.totalCount}問の復習候補`)}</small>
      </span>
      <span class="review-return-bar" aria-hidden="true">
        ${segment("overdue", row.buckets.overdue)}
        ${segment("today", row.buckets.today)}
        ${segment("weak", row.buckets.weak)}
        ${segment("soon", row.buckets.soon)}
        ${segment("future", row.buckets.future)}
      </span>
      <span class="review-return-meta">
        <b>${row.questionCount || row.available || "--"}問</b>
        <b>保持 ${escapeHtml(retention)}</b>
        <b>${escapeHtml(row.duration)}</b>
      </span>
      <em>${escapeHtml(reviewReturnActionLabel(row))}</em>
    </button>
  `;
}

function reviewReturnPanelHtml(reviewSummaries = reviewCurriculumSummaries()) {
  const rows = reviewReturnRows(reviewSummaries);
  const maxScore = Math.max(1, ...rows.map((row) => row.score));
  const dangerCount = rows.filter((row) => row.kind === "danger").length;
  const headline = rows.length ? (dangerCount ? `高効果 ${dangerCount}科目` : `候補 ${rows.length}科目`) : "効果待ち";
  return `
    <div class="review-return-head">
      <div>
        <span>REVIEW ROI</span>
        <strong>${escapeHtml(headline)}</strong>
      </div>
      <small>${escapeHtml(reviewReturnCoach(rows))}</small>
    </div>
    ${
      rows.length
        ? `<div class="review-return-grid">
            ${rows.map((row) => reviewReturnCardHtml(row, maxScore)).join("")}
          </div>`
        : `<div class="review-return-empty">復習セッションや回答履歴が増えると、1セットあたりの回収効果を科目別に比較できます</div>`
    }
  `;
}

function reviewSessionSetCount(count, size) {
  return count ? Math.ceil(count / Math.max(1, size)) : 0;
}

function reviewAverageSecondsPerQuestion(history = state.reviewSessionHistory) {
  const sessions = normalizeReviewSessionHistory(history).filter((session) => session.total > 0 && session.durationMs > 0);
  const totalQuestions = sessions.reduce((sum, session) => sum + session.total, 0);
  if (!totalQuestions) return 75;
  const seconds = Math.round(sessions.reduce((sum, session) => sum + session.durationMs, 0) / totalQuestions / 1000);
  return Math.max(20, Math.min(420, seconds));
}

function reviewEstimateDurationText(count, secondsPerQuestion = reviewAverageSecondsPerQuestion()) {
  if (!count) return "0分";
  return formatStudyDuration(count * secondsPerQuestion * 1000);
}

function reviewPaceMeterHtml(summaries, config) {
  const totals = reviewCurveTotals(summaries);
  const size = Math.max(1, Number(config.size) || REVIEW_SESSION_SIZES[0]);
  const countForMode = (mode) =>
    summaries.reduce((sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode }).length, 0);
  const currentCount = countForMode(config.mode);
  const weakCount = countForMode("weak");
  const dueCount = totals.overdueCount || totals.todayCount;
  const paceItems = [
    {
      kind: "current",
      label: "選択中",
      count: currentCount,
      detail: `${reviewSessionModeLabel(config.mode)} / ${size}問ずつ`,
    },
    {
      kind: totals.overdueCount ? "overdue" : "today",
      label: totals.overdueCount ? "遅れ" : "今日",
      count: dueCount,
      detail: "到来分",
    },
    {
      kind: "soon",
      label: "7日内",
      count: totals.next7Count,
      detail: "前倒し候補",
    },
    {
      kind: "weak",
      label: "弱点",
      count: weakCount,
      detail: "ミス優先",
    },
  ];
  const maxCount = Math.max(size, ...paceItems.map((item) => item.count), 1);
  return `
    <div class="review-pace-meter" aria-label="復習ペースメーター">
      ${paceItems
        .map((item) => {
          const sets = reviewSessionSetCount(item.count, size);
          const pace = item.count ? Math.max(8, Math.round((item.count / maxCount) * 100)) : 4;
          const title = `${item.label}: ${item.count}問 / ${sets}セット目安`;
          return `
            <div class="review-pace-card ${escapeHtml(item.kind)}" style="--pace: ${pace}%" title="${escapeHtml(title)}">
              <span>${escapeHtml(item.label)}</span>
              <strong>${sets}セット</strong>
              <small>${item.count}問 / ${escapeHtml(item.detail)}</small>
              <i aria-hidden="true"></i>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function reviewTimeBudgetHtml(summaries, config) {
  const totals = reviewCurveTotals(summaries);
  const size = Math.max(1, Number(config.size) || REVIEW_SESSION_SIZES[0]);
  const secondsPerQuestion = reviewAverageSecondsPerQuestion();
  const countForMode = (mode) =>
    summaries.reduce((sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, { ...config, mode }).length, 0);
  const selectedCount = countForMode(config.mode);
  const dueCount = totals.dueCount;
  const weekCount = totals.next7Count;
  const weakCount = countForMode("weak");
  const rows = [
    {
      kind: selectedCount ? "current" : "idle",
      label: "この設定",
      count: selectedCount,
      detail: `${reviewSessionSetCount(selectedCount, size)}セット / ${reviewSessionModeLabel(config.mode)}`,
    },
    {
      kind: totals.overdueCount ? "overdue" : dueCount ? "today" : "idle",
      label: "到来全処理",
      count: dueCount,
      detail: totals.overdueCount ? `遅れ${totals.overdueCount}問含む` : "今日まで",
    },
    {
      kind: weekCount ? "soon" : "idle",
      label: "7日内",
      count: weekCount,
      detail: weakCount ? `弱点${weakCount}問あり` : "前倒し候補",
    },
  ];
  const pressure = dueCount + Math.ceil(weekCount * 0.45) + Math.ceil(weakCount * 0.35);
  const headline = dueCount
    ? `${reviewEstimateDurationText(dueCount, secondsPerQuestion)}で到来分`
    : weekCount
      ? `${reviewEstimateDurationText(weekCount, secondsPerQuestion)}で7日内`
      : weakCount
        ? `${reviewEstimateDurationText(weakCount, secondsPerQuestion)}で弱点補強`
        : "今日は軽め";
  const coach = pressure >= 40
    ? "20問セットで区切ると負荷を読みやすいです"
    : pressure >= 12
      ? "10問単位で消化するとちょうどいい量"
      : "5問セットで軽く整えられます";
  const maxCount = Math.max(size, ...rows.map((row) => row.count), 1);
  return `
    <div class="review-time-budget" aria-label="復習所要時間の見積もり">
      <div class="review-time-budget-head">
        <div>
          <span>所要時間</span>
          <strong>${escapeHtml(headline)}</strong>
        </div>
        <small>実測 ${secondsPerQuestion}秒/問</small>
      </div>
      <div class="review-time-budget-grid">
        ${rows
          .map((row) => {
            const load = row.count ? Math.max(8, Math.round((row.count / maxCount) * 100)) : 4;
            return `
              <div class="review-time-budget-card ${escapeHtml(row.kind)}" style="--budget: ${load}%">
                <span>${escapeHtml(row.label)}</span>
                <strong>${escapeHtml(reviewEstimateDurationText(row.count, secondsPerQuestion))}</strong>
                <small>${row.count}問 / ${escapeHtml(row.detail)}</small>
                <i aria-hidden="true"></i>
              </div>
            `;
          })
          .join("")}
      </div>
      <p>${escapeHtml(coach)}</p>
    </div>
  `;
}

function reviewLoadPressure(totals) {
  return Math.min(
    100,
    Math.round(
      totals.overdueCount * 14 +
        totals.todayCount * 8 +
        totals.next7Count * 2.4 +
        totals.weakCount * 3.5 +
        totals.failedCount * 18 +
        totals.loadingCount * 7
    )
  );
}

function reviewLoadRadarHeadline(totals) {
  if (totals.failedCount) return `読込失敗 ${totals.failedCount}科目`;
  if (totals.loadingCount) return "復習負荷を集計中";
  if (totals.overdueCount) return `遅れ ${totals.overdueCount}問を先に`;
  if (totals.todayCount) return `今日 ${totals.todayCount}問`;
  if (totals.next7Count) return `7日内 ${totals.next7Count}問`;
  if (totals.weakCount) return `弱点 ${totals.weakCount}問`;
  return "復習負荷は軽め";
}

function reviewLoadRadarCoach(totals, pressure) {
  if (totals.overdueCount) return "赤い山を処理すると、以後の復習間隔が戻りやすくなります";
  if (totals.todayCount && totals.weakCount) return "今日分を1セット、余力で弱点を1セットが効率的です";
  if (pressure >= 72) return "負荷が高めです。10問単位で分けると失速しにくいです";
  if (totals.next7Count) return "7日内の山を前倒しすると、明日以降が軽くなります";
  if (totals.weakCount) return "期限は軽め。弱点だけ狙って精度を上げられます";
  return "新規問題を進める余白があります。回答履歴が増えるほど精度が上がります";
}

function reviewLoadRadarHtml(summaries) {
  const totals = reviewCurveTotals(summaries);
  const pressure = reviewLoadPressure(totals);
  const maxMetric = Math.max(1, totals.overdueCount, totals.todayCount, totals.next7Count, totals.weakCount);
  const metricRows = [
    {
      label: "遅れ",
      value: totals.overdueCount,
      detail: "最優先",
      kind: "overdue",
      action: "schedule",
      key: "overdue",
    },
    {
      label: "今日",
      value: totals.todayCount,
      detail: formatStudyDay(totals.todayKey),
      kind: "today",
      action: "schedule",
      key: totals.todayKey,
    },
    {
      label: "7日内",
      value: totals.next7Count,
      detail: "前倒し",
      kind: "soon",
      action: "mode",
      mode: "smart",
      courseId: reviewMissionBestCourseId(summaries, { ...state.reviewSession, mode: "smart" }),
    },
    {
      label: "弱点",
      value: totals.weakCount,
      detail: "ミス/低得点",
      kind: "weak",
      action: "mode",
      mode: "weak",
      courseId: reviewMissionBestCourseId(summaries, { ...state.reviewSession, mode: "weak" }),
    },
  ];
  const laneRows = summaries
    .filter((summary) => summary.loading || summary.failed || summary.totalCount || summary.dueCount || summary.weakCount || summary.next7Count)
    .sort(
      (a, b) =>
        reviewCourseMapScore(b) - reviewCourseMapScore(a) ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    )
    .slice(0, 6);
  const maxLaneLoad = Math.max(
    1,
    ...laneRows.map((summary) => summary.overdueCount + summary.todayCount + summary.next7Count + summary.weakCount)
  );
  return `
    <div class="review-load-head">
      <div>
          <span>復習負荷</span>
        <strong>${escapeHtml(reviewLoadRadarHeadline(totals))}</strong>
      </div>
      <small>${escapeHtml(reviewLoadRadarCoach(totals, pressure))}</small>
    </div>
    <div class="review-load-meter" style="--pressure: ${pressure}%">
      <span aria-hidden="true"></span>
      <b>${pressure}%</b>
    </div>
    <div class="review-load-metrics">
      ${metricRows
        .map((item) => {
          const active = item.value > 0 && (item.action === "schedule" || item.courseId);
          const load = item.value ? Math.max(8, Math.round((item.value / maxMetric) * 100)) : 4;
          const attrs =
            item.action === "schedule"
              ? `data-review-load-key="${escapeHtml(item.key)}"`
              : `data-review-load-mode="${escapeHtml(item.mode)}" data-review-load-course="${escapeHtml(item.courseId || "")}"`;
          return `
            <button
              class="review-load-metric ${escapeHtml(item.kind)}${active ? " active" : ""}"
              type="button"
              data-review-load-action="${escapeHtml(item.action)}"
              ${attrs}
              style="--load: ${load}%"
              ${active ? "" : "disabled"}
              title="${escapeHtml(active ? `${item.label}の復習を開始 / ${item.value}問` : `${item.label}は対象なし`)}"
            >
              <span>${escapeHtml(item.label)}</span>
              <strong>${item.value}</strong>
              <i aria-hidden="true"></i>
              <small>${escapeHtml(item.detail)}</small>
            </button>
          `;
        })
        .join("")}
    </div>
    ${
      laneRows.length
        ? `<div class="review-load-lanes">
            ${laneRows
              .map((summary) => {
                const totalLoad = summary.overdueCount + summary.todayCount + summary.next7Count + summary.weakCount;
                const load = totalLoad ? Math.max(8, Math.round((totalLoad / maxLaneLoad) * 100)) : 4;
                const status = reviewCurriculumUrgency(summary);
                return `
                  <div class="review-load-lane ${escapeHtml(status.level)}">
                    <div>
                      <strong>${escapeHtml(summary.courseName)}</strong>
                      <small>${escapeHtml(status.label)} / 遅${summary.overdueCount} 今日${summary.todayCount} 7日${summary.next7Count} 弱${summary.weakCount}</small>
                    </div>
                    <div class="review-load-stack" style="--load: ${load}%">
                      <span class="overdue" style="width: ${Math.round((summary.overdueCount / maxLaneLoad) * 100)}%"></span>
                      <span class="today" style="width: ${Math.round((summary.todayCount / maxLaneLoad) * 100)}%"></span>
                      <span class="soon" style="width: ${Math.round((summary.next7Count / maxLaneLoad) * 100)}%"></span>
                      <span class="weak" style="width: ${Math.round((summary.weakCount / maxLaneLoad) * 100)}%"></span>
                      <i aria-hidden="true"></i>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>`
        : `<div class="review-curriculum-empty">回答履歴が増えると、復習負荷の内訳がここに出ます</div>`
    }
  `;
}

function reviewSessionPlannerHtml(summaries) {
  const config = normalizeReviewSession(state.reviewSession);
  const sessionCount = summaries.reduce((sum, summary) => sum + reviewSessionEntriesForSummary(summary, config).length, 0);
  const currentAvailable = summaries.reduce((sum, summary) => sum + reviewSessionAvailableEntriesForSummary(summary, config).length, 0);
  const availablePrefix = {
    smart: "候補",
    overdue: "遅れ",
    today: "今日",
    weak: "弱点",
  }[config.mode] || "候補";
  const availableLabel = `${availablePrefix}${currentAvailable}問`;
  return `
    <div class="review-session-head">
      <div>
        <span>復習プラン</span>
        <strong>${escapeHtml(
          [reviewSessionModeLabel(config.mode), `${config.size}問`, config.excludeCalculation ? "計算なし" : ""]
            .filter(Boolean)
            .join(" / ")
        )}</strong>
      </div>
      <small>${sessionCount}問 / ${escapeHtml(availableLabel)}</small>
    </div>
    ${reviewMissionActionsHtml(summaries)}
    ${reviewSetPreviewHtml(summaries, config)}
    <div class="review-session-controls" aria-label="復習セッションの種類">
      ${REVIEW_SESSION_MODES.map((mode) => `
        <button
          class="review-session-chip${config.mode === mode ? " active" : ""}"
          type="button"
          data-review-session-mode="${escapeHtml(mode)}"
          aria-pressed="${config.mode === mode}"
          title="${escapeHtml(reviewSessionModeDetail(mode))}"
        >${escapeHtml(reviewSessionModeLabel(mode))}</button>
      `).join("")}
    </div>
    <div class="review-session-controls options" aria-label="復習セッションの条件">
      ${REVIEW_SESSION_SIZES.map((size) => `
        <button
          class="review-session-chip${config.size === size ? " active" : ""}"
          type="button"
          data-review-session-size="${size}"
          aria-pressed="${config.size === size}"
        >${size}問</button>
      `).join("")}
      <button
        class="review-session-chip review-session-chip-condition${config.excludeCalculation ? " active" : ""}"
        type="button"
        data-review-session-exclude-calculation="1"
        aria-pressed="${config.excludeCalculation}"
        title="${escapeHtml(reviewSessionCalculationTitle(config))}"
      >${escapeHtml(reviewSessionCalculationLabel(config))}</button>
    </div>
    <p>${escapeHtml(reviewSessionModeDetail(config.mode))}</p>
  `;
}

function startReviewMission(button) {
  const action = button?.dataset?.reviewMission || "";
  if (action === "recovery") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
    return;
  }
  if (action === "due") {
    const courseId = button.dataset.reviewMissionCourse;
    const mode = button.dataset.reviewMissionMode || "today";
    if (!courseId) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
    return;
  }
  if (action === "weakness") {
    startWeaknessReviewSession(button.dataset.weaknessKey);
    return;
  }
  if (action === "schedule") {
    startReviewScheduleSession(button.dataset.reviewScheduleKey);
  }
}

function startNextReviewMission() {
  const mission = nextReviewMissionCandidate();
  if (!mission) {
    setStudySummaryOpen(true);
    return false;
  }
  if (mission.action === "recovery") {
    return startReviewUnresolvedMistakesSession(mission.courseId);
  }
  if (mission.action === "due") {
    setStudySummaryOpen(false);
    startReviewCurriculumMode(mission.courseId, { ...state.reviewSession, mode: mission.mode });
    return true;
  }
  if (mission.action === "weakness") {
    return startWeaknessReviewSession(mission.weaknessKey);
  }
  if (mission.action === "schedule") {
    return startReviewScheduleSession(mission.scheduleKey);
  }
  return false;
}

function attachReviewSessionPlannerHandlers(summaries) {
  if (!els.reviewSessionPlanner) return;
  els.reviewSessionPlanner.querySelectorAll("[data-review-mission]").forEach((button) => {
    button.addEventListener("click", () => startReviewMission(button));
  });
  els.reviewSessionPlanner.querySelectorAll("[data-review-priority-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.reviewPriorityCourse;
      const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewPriorityMode)
        ? button.dataset.reviewPriorityMode
        : state.reviewSession.mode;
      if (!courseId) return;
      setStudySummaryOpen(false);
      startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
    });
  });
  els.reviewSessionPlanner.querySelectorAll("[data-review-set-start-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.reviewSetStartCourse;
      const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewSetStartMode)
        ? button.dataset.reviewSetStartMode
        : state.reviewSession.mode;
      if (!courseId) return;
      setStudySummaryOpen(false);
      startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
    });
  });
  els.reviewSessionPlanner.querySelectorAll("[data-review-stage-plan-stage]").forEach((button) => {
    button.addEventListener("click", () => {
      const stageKey = button.dataset.reviewStagePlanStage;
      const courseId = button.dataset.reviewStagePlanCourse;
      const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewStagePlanMode)
        ? button.dataset.reviewStagePlanMode
        : state.reviewSession.mode;
      if (!stageKey || !courseId) return;
      startReviewMasteryStageSession(stageKey, courseId, { ...state.reviewSession, mode });
    });
  });
  els.reviewSessionPlanner.querySelectorAll("[data-review-bottleneck-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const bottleneckKey = button.dataset.reviewBottleneckKey;
      const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewBottleneckMode)
        ? button.dataset.reviewBottleneckMode
        : state.reviewSession.mode;
      if (!bottleneckKey) return;
      startReviewBottleneckSession(bottleneckKey, { ...state.reviewSession, mode });
    });
  });
  els.reviewSessionPlanner.querySelectorAll("[data-review-session-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      saveReviewSession({ ...state.reviewSession, mode: button.dataset.reviewSessionMode });
      renderReviewCurriculum();
    });
  });
  els.reviewSessionPlanner.querySelectorAll("[data-review-session-size]").forEach((button) => {
    button.addEventListener("click", () => {
      saveReviewSession({ ...state.reviewSession, size: Number(button.dataset.reviewSessionSize) });
      renderReviewCurriculum();
    });
  });
  els.reviewSessionPlanner.querySelectorAll("[data-review-session-exclude-calculation]").forEach((button) => {
    button.addEventListener("click", () => {
      const config = normalizeReviewSession(state.reviewSession);
      saveReviewSession({ ...config, excludeCalculation: !config.excludeCalculation });
      renderReviewCurriculum();
    });
  });
  if (!summaries.length) {
    els.reviewSessionPlanner.classList.add("empty");
  } else {
    els.reviewSessionPlanner.classList.remove("empty");
  }
}

function renderReviewSessionPlanner(summaries) {
  if (!els.reviewSessionPlanner || !state.reviewCurveSummaryOpen) return;
  els.reviewSessionPlanner.innerHTML = reviewSessionPlannerHtml(summaries);
  attachReviewSessionPlannerHandlers(summaries);
}

function renderReviewLoadRadar(summaries) {
  if (!els.reviewLoadRadar || !state.reviewCurveSummaryOpen) return;
  els.reviewLoadRadar.innerHTML = reviewLoadRadarHtml(summaries);
}

function reviewCourseMapScore(summary) {
  if (summary.failed) return 1000;
  if (summary.loading) return 900;
  return (
    summary.overdueCount * 12 +
    summary.todayCount * 8 +
    Math.max(0, summary.dueCount - summary.todayCount - summary.overdueCount) * 5 +
    summary.weakCount * 3 +
    summary.next7Count * 2 +
    Math.min(12, summary.totalCount)
  );
}

function reviewCourseMapHtml(summaries) {
  const visible = summaries
    .filter((summary) => summary.loading || summary.failed || summary.totalCount || summary.dueCount || summary.weakCount || summary.next7Count)
    .sort(
      (a, b) =>
        reviewCourseMapScore(b) - reviewCourseMapScore(a) ||
        String(a.courseName).localeCompare(String(b.courseName), "ja")
    )
    .slice(0, 5);
  const totals = reviewCurveTotals(summaries);
  const maxLoad = Math.max(
    1,
    ...visible.map((summary) => summary.overdueCount + summary.todayCount + summary.next7Count + summary.weakCount)
  );
  const headText = totals.dueCount
    ? `${totals.dueCount}問到来 / ${totals.dueCourseCount}科目`
    : totals.next7Count
      ? `7日内 ${totals.next7Count}問`
      : totals.weakCount
        ? `弱点 ${totals.weakCount}問`
        : "待機中";
  const rows = visible
    .map((summary) => {
      const urgency = reviewCurriculumUrgency(summary);
      const suggestedMode = summary.overdueCount ? "overdue" : summary.todayCount ? "today" : summary.weakCount ? "weak" : "smart";
      const suggestedSession = { ...state.reviewSession, mode: suggestedMode };
      const sessionEntries = reviewSessionEntriesForSummary(summary, suggestedSession);
      const disabled = !sessionEntries.length || summary.loading || summary.failed;
      const nextText = summary.nextDueDay ? formatStudyDay(summary.nextDueDay) : summary.dueCount ? "到来中" : "なし";
      const totalLoad = summary.overdueCount + summary.todayCount + summary.next7Count + summary.weakCount;
      const load = totalLoad ? Math.max(8, Math.round((totalLoad / maxLoad) * 100)) : 4;
      const retentionText = urgency.retention == null ? "--" : `${urgency.retention}%`;
      return `
        <button
          class="review-course-map-row ${escapeHtml(urgency.level)}"
          type="button"
          data-review-map-course="${escapeHtml(summary.courseId)}"
          data-review-map-mode="${escapeHtml(suggestedMode)}"
          ${disabled ? "disabled" : ""}
          title="${escapeHtml(disabled ? `${summary.courseName} / ${urgency.label}` : `${summary.courseName}の${reviewSessionModeLabel(suggestedMode)}復習を開始 / ${sessionEntries.length}問`)}"
        >
          <div class="review-course-map-main">
            <strong>${escapeHtml(summary.courseName)}</strong>
            <small>${escapeHtml(urgency.label)} / 保持 ${escapeHtml(retentionText)} / 次回 ${escapeHtml(nextText)}</small>
          </div>
          <div class="review-course-map-load" aria-hidden="true">
            <i style="width: ${load}%"></i>
            <span class="overdue" style="width: ${Math.max(0, Math.round((summary.overdueCount / maxLoad) * 100))}%"></span>
            <span class="today" style="width: ${Math.max(0, Math.round((summary.todayCount / maxLoad) * 100))}%"></span>
            <span class="soon" style="width: ${Math.max(0, Math.round((summary.next7Count / maxLoad) * 100))}%"></span>
            <span class="weak" style="width: ${Math.max(0, Math.round((summary.weakCount / maxLoad) * 100))}%"></span>
          </div>
          <div class="review-course-map-meta">
            <span>遅 <b>${summary.overdueCount}</b></span>
            <span>今 <b>${summary.todayCount}</b></span>
            <span>7日 <b>${summary.next7Count}</b></span>
            <span>弱 <b>${summary.weakCount}</b></span>
          </div>
        </button>
      `;
    })
    .join("");
  return `
    <div class="review-course-map-head">
      <div>
        <span>COURSE MAP</span>
        <strong>${escapeHtml(headText)}</strong>
      </div>
      <small>${visible.length ? `${visible.length}科目表示` : "履歴待ち"}</small>
    </div>
    ${
      visible.length
        ? `<div class="review-course-map-list">${rows}</div>`
        : `<div class="review-curriculum-empty">復習対象科目の回答履歴が増えると、科目別ロードマップが出ます</div>`
    }
  `;
}

function renderReviewCourseMap(summaries) {
  if (!els.reviewCourseMap || !state.reviewCurveSummaryOpen) return;
  els.reviewCourseMap.innerHTML = reviewCourseMapHtml(summaries);
}

function renderReviewCurriculum() {
  if (!els.reviewCurriculumList) return;
  if (!LITE_MODE || state.reviewCurveSummaryOpen) {
    ensureReviewCurriculumCoursesLoaded();
  }
  const summaries = reviewCurriculumSummaries();
  renderReviewCurveSummary(summaries);
  renderReviewTargetPanel(summaries);
  renderReviewTodayTargetPanel(summaries);
  renderReviewSessionPlanner(summaries);
  renderReviewLoadRadar(summaries);
  renderReviewCourseMap(summaries);
  if (!normalizeReviewTargetCourseIds(state.reviewTargetCourseIds).length) {
    els.reviewCurriculumList.innerHTML = `<div class="review-curriculum-empty">忘却曲線の対象科目を選んでください</div>`;
    return;
  }
  if (!summaries.length) {
    els.reviewCurriculumList.innerHTML = `<div class="review-curriculum-empty">復習対象はまだありません</div>`;
    return;
  }

  const queueSummaries = summaries.filter((summary) => {
    const sessionEntries = reviewSessionEntriesForSummary(summary);
    return (
      sessionEntries.length > 0 ||
      summary.dueCount > 0 ||
      summary.loading ||
      summary.failed ||
      isReviewCurriculumModeForCourse(summary.courseId)
    );
  });
  if (!queueSummaries.length) {
    els.reviewCurriculumList.innerHTML = `<div class="review-curriculum-empty">今日の復習キューは空です。弱点モードにすると直近ミスも拾えます</div>`;
    return;
  }

  const visibleSummaries = queueSummaries.slice(0, 6);
  const hiddenCount = Math.max(0, queueSummaries.length - visibleSummaries.length);
  els.reviewCurriculumList.innerHTML = [
    ...visibleSummaries.map(reviewCurriculumRowHtml),
    hiddenCount ? `<div class="review-curriculum-empty">ほか ${hiddenCount}科目</div>` : "",
  ].join("");
}

function runReviewCurriculumStart(courseId) {
  if (!courseId) return;
  setStudySummaryOpen(false);
  if (isReviewCurriculumModeForCourse(courseId)) {
    exitReviewCurriculumMode();
  } else {
    startReviewCurriculumMode(courseId, state.reviewSession);
  }
}

function handleReviewCurriculumListClick(event) {
  const button = event.target?.closest?.("[data-review-course]");
  if (!button || !els.reviewCurriculumList?.contains(button) || button.disabled) return;
  runReviewCurriculumStart(button.dataset.reviewCourse);
}

function handleReviewCourseMapClick(event) {
  const button = event.target?.closest?.("[data-review-map-course]");
  if (!button || !els.reviewCourseMap?.contains(button) || button.disabled) return;
  const courseId = button.dataset.reviewMapCourse;
  const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewMapMode) ? button.dataset.reviewMapMode : state.reviewSession.mode;
  setStudySummaryOpen(false);
  if (isReviewCurriculumModeForCourse(courseId)) {
    exitReviewCurriculumMode();
  } else {
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
  }
}

function handleReviewLoadRadarClick(event) {
  const button = event.target?.closest?.("[data-review-load-action]");
  if (!button || !els.reviewLoadRadar?.contains(button) || button.disabled) return;
  const action = button.dataset.reviewLoadAction;
  if (action === "schedule") {
    startReviewScheduleSession(button.dataset.reviewLoadKey);
    return;
  }
  if (action === "mode") {
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewLoadMode) ? button.dataset.reviewLoadMode : "smart";
    const courseId = button.dataset.reviewLoadCourse;
    if (!courseId) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
  }
}

function startReviewHistoryActionFromButton(button) {
  if (!button || button.disabled) return;
  if (button.dataset.reviewHistoryAction === "unresolved") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
    return;
  }
  startReviewHistorySession(button.dataset.reviewHistoryId, {
    onlyWrong: button.dataset.reviewHistoryAction === "wrong",
  });
}

function handleReviewHistoryClick(event) {
  const button = event.target?.closest?.("[data-review-history-action]");
  if (!button || !els.reviewSessionHistory?.contains(button)) return;
  startReviewHistoryActionFromButton(button);
}

function handleReviewRecoveryBoardClick(event) {
  const button = event.target?.closest?.("[data-review-history-action]");
  if (!button || !els.reviewRecoveryBoard?.contains(button)) return;
  startReviewHistoryActionFromButton(button);
}

function handleReviewDialPanelClick(event) {
  const button = event.target?.closest?.("[data-review-dial-action]");
  if (!button || !els.reviewDialPanel?.contains(button) || button.disabled) return;
  const action = button.dataset.reviewDialAction;
  if (action === "mode") {
    saveReviewSession({ ...state.reviewSession, mode: button.dataset.reviewDialMode });
    renderReviewCurriculum();
    return;
  }
  if (action === "size") {
    saveReviewSession({ ...state.reviewSession, size: Number(button.dataset.reviewDialSize) });
    renderReviewCurriculum();
    return;
  }
  if (action === "exclude-calculation") {
    const config = normalizeReviewSession(state.reviewSession);
    saveReviewSession({ ...config, excludeCalculation: !config.excludeCalculation });
    renderReviewCurriculum();
    return;
  }
  if (action === "start") {
    const courseId = button.dataset.reviewDialCourse;
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewDialMode) ? button.dataset.reviewDialMode : state.reviewSession.mode;
    if (!courseId) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
  }
}

function handleWeaknessPanelClick(event) {
  const button = event.target?.closest?.("[data-weakness-key]");
  if (!button || !els.weaknessPanel?.contains(button) || button.disabled) return;
  startWeaknessReviewSession(button.dataset.weaknessKey);
}

function handleUnderstandingSummaryClick(event) {
  const button = event.target?.closest?.("[data-understanding-review-level]");
  if (!button || !els.understandingSummary?.contains(button) || button.disabled) return;
  startUnderstandingReviewSession(button.dataset.understandingReviewLevel);
}

function handleReviewFocusPanelClick(event) {
  const button = event.target?.closest?.("[data-review-focus-action]");
  if (!button || !els.reviewFocusPanel?.contains(button) || button.disabled) return;
  if (button.dataset.reviewFocusAction === "bottleneck") {
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewBottleneckMode)
      ? button.dataset.reviewBottleneckMode
      : state.reviewSession.mode;
    startReviewBottleneckSession(button.dataset.reviewBottleneckKey, { ...state.reviewSession, mode });
    return;
  }
  if (button.dataset.reviewFocusAction === "weakness") {
    startWeaknessReviewSession(button.dataset.weaknessKey);
  }
}

function handleReviewMomentumPanelClick(event) {
  const button = event.target?.closest?.("[data-review-momentum-action]");
  if (!button || !els.reviewMomentumPanel?.contains(button) || button.disabled) return;
  const action = button.dataset.reviewMomentumAction;
  if (action === "recovery") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
    return;
  }
  if (action === "next") {
    startNextReviewMission();
    return;
  }
  if (action === "summary") {
    setStudySummaryOpen(true);
  }
}

function handleReviewCommandDeckClick(event) {
  const button = event.target?.closest?.("[data-review-command-action]");
  if (!button || !els.reviewCommandDeckPanel?.contains(button) || button.disabled) return;
  const action = button.dataset.reviewCommandAction;
  if (action === "schedule") {
    startReviewScheduleSession(button.dataset.reviewCommandSchedule);
    return;
  }
  if (action === "mode") {
    const courseId = button.dataset.reviewCommandCourse;
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewCommandMode)
      ? button.dataset.reviewCommandMode
      : state.reviewSession.mode;
    if (!courseId) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
    return;
  }
  if (action === "continue") {
    setStudySummaryOpen(false);
    requestMobileQuizScroll();
  }
}

function handleReviewSetBlueprintClick(event) {
  const button = event.target?.closest?.("[data-review-blueprint-course]");
  if (!button || !els.reviewSetBlueprintPanel?.contains(button) || button.disabled) return;
  const courseId = button.dataset.reviewBlueprintCourse;
  const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewBlueprintMode)
    ? button.dataset.reviewBlueprintMode
    : state.reviewSession.mode;
  if (!courseId) return;
  setStudySummaryOpen(false);
  startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
}

function handleReviewOutcomePanelClick(event) {
  const button = event.target?.closest?.("[data-review-outcome-action]");
  if (!button || !els.reviewOutcomePanel?.contains(button) || button.disabled) return;
  const action = button.dataset.reviewOutcomeAction;
  if (action === "recovery") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
    return;
  }
  if (action === "start") {
    const courseId = button.dataset.reviewOutcomeCourse;
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewOutcomeMode)
      ? button.dataset.reviewOutcomeMode
      : state.reviewSession.mode;
    if (!courseId) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
  }
}

function handleReviewCoursePulseClick(event) {
  const button = event.target?.closest?.("[data-review-course-pulse-action]");
  if (!button || !els.reviewCoursePulsePanel?.contains(button) || button.disabled) return;
  const action = button.dataset.reviewCoursePulseAction;
  if (action === "recovery") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
    return;
  }
  if (action === "review") {
    const courseId = button.dataset.reviewCoursePulseCourse;
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewCoursePulseMode)
      ? button.dataset.reviewCoursePulseMode
      : state.reviewSession.mode;
    if (!courseId) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
    return;
  }
  if (action === "history") {
    setStudySummaryOpen(false);
    startReviewHistorySession(button.dataset.reviewHistoryId);
    return;
  }
  if (action === "course") {
    const courseId = button.dataset.reviewCoursePulseCourse;
    if (!courseManifest(courseId)) return;
    setStudySummaryOpen(false);
    selectCourse(courseId);
  }
}

function handleReviewReturnPanelClick(event) {
  const button = event.target?.closest?.("[data-review-return-action]");
  if (!button || !els.reviewReturnPanel?.contains(button) || button.disabled) return;
  const action = button.dataset.reviewReturnAction;
  if (action === "recovery") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
    return;
  }
  if (action === "review") {
    const courseId = button.dataset.reviewReturnCourse;
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewReturnMode)
      ? button.dataset.reviewReturnMode
      : state.reviewSession.mode;
    if (!courseId) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
    return;
  }
  if (action === "course") {
    const courseId = button.dataset.reviewReturnCourse;
    if (!courseManifest(courseId)) return;
    setStudySummaryOpen(false);
    selectCourse(courseId);
  }
}

function handleReviewNextQueuePanelClick(event) {
  const button = event.target?.closest?.("[data-review-next-course], [data-review-next-action]");
  if (!button || !els.reviewNextQueuePanel?.contains(button) || button.disabled) return;
  const courseId = button.dataset.reviewNextCourse;
  const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewNextMode) ? button.dataset.reviewNextMode : state.reviewSession.mode;
  if (!courseId) return;
  setStudySummaryOpen(false);
  startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
}

function handleReviewAgePanelClick(event) {
  const button = event.target?.closest?.("[data-review-age-action]");
  if (!button || !els.reviewAgePanel?.contains(button) || button.disabled) return;
  if (button.dataset.reviewAgeAction === "start") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
  }
}

function handleStudyActionPlanClick(event) {
  const button = event.target?.closest?.("[data-study-action]");
  const inStudyActionSurface =
    Boolean(els.studySummaryHero?.contains(button)) ||
    Boolean(els.studyActionPlan?.contains(button)) ||
    Boolean(els.studyCheckpointPanel?.contains(button)) ||
    Boolean(els.studyRoutePanel?.contains(button)) ||
    Boolean(els.studyEfficiencyPanel?.contains(button)) ||
    Boolean(els.studyContinuityPanel?.contains(button)) ||
    Boolean(els.reviewCoachPanel?.contains(button)) ||
    Boolean(els.reviewOutlookPanel?.contains(button)) ||
    Boolean(els.reviewCalendarPanel?.contains(button)) ||
    Boolean(els.reviewSprintPanel?.contains(button));
  if (!button || !inStudyActionSurface || button.disabled) return;
  const action = button.dataset.studyAction;
  if (action === "schedule") {
    startReviewScheduleSession(button.dataset.reviewScheduleKey);
    return;
  }
  if (action === "recovery") {
    startReviewUnresolvedMistakesSession(button.dataset.reviewRecoveryCourse);
    return;
  }
  if (action === "weakness") {
    startWeaknessReviewSession(button.dataset.weaknessKey);
    return;
  }
  if (action === "pace") {
    const courseId = button.dataset.reviewPaceCourse;
    const size = Number(button.dataset.reviewPaceSize);
    const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewPaceMode)
      ? button.dataset.reviewPaceMode
      : "smart";
    if (!courseId || !Number.isFinite(size)) return;
    setStudySummaryOpen(false);
    startReviewCurriculumMode(courseId, { ...state.reviewSession, mode, size });
    return;
  }
  if (action === "course") {
    const courseId = button.dataset.studyRouteCourse;
    if (!courseManifest(courseId)) return;
    setStudySummaryOpen(false);
    selectCourse(courseId);
    return;
  }
  if (action === "continue") {
    setStudySummaryOpen(false);
    requestMobileQuizScroll();
  }
}

function handleStudyCourseMatrixClick(event) {
  const button = event.target?.closest?.("[data-study-course]");
  if (!button || !els.studyCourseMatrix?.contains(button) || button.disabled) return;
  const courseId = button.dataset.studyCourse;
  if (!courseManifest(courseId)) return;
  setStudySummaryOpen(false);
  selectCourse(courseId);
}

function handleExamReadinessClick(event) {
  const button = event.target?.closest?.("[data-exam-readiness-course]");
  if (!button || !els.examReadinessPanel?.contains(button) || button.disabled) return;
  const courseId = button.dataset.examReadinessCourse;
  if (!courseManifest(courseId)) return;
  if (button.dataset.studyCourseFallback === "true") {
    setStudySummaryOpen(false);
    selectCourse(courseId);
    return;
  }
  const mode = REVIEW_SESSION_MODES.includes(button.dataset.examReadinessMode)
    ? button.dataset.examReadinessMode
    : "smart";
  setStudySummaryOpen(false);
  startReviewCurriculumMode(courseId, { ...state.reviewSession, mode });
}

function handleReviewMasteryTrackClick(event) {
  const button = event.target?.closest?.("[data-review-mastery-stage]");
  if (!button || !els.reviewMasteryTrack?.contains(button) || button.disabled) return;
  const stageKey = button.dataset.reviewMasteryStage;
  const courseId = button.dataset.reviewMasteryCourse;
  const mode = REVIEW_SESSION_MODES.includes(button.dataset.reviewMasteryMode)
    ? button.dataset.reviewMasteryMode
    : state.reviewSession.mode;
  if (!stageKey || !courseId) return;
  startReviewMasteryStageSession(stageKey, courseId, { ...state.reviewSession, mode });
}

function reviewCurriculumUrgency(summary) {
  if (summary.failed) return { level: "failed", label: "読込失敗", percent: 100, retention: null };
  if (summary.loading) return { level: "loading", label: "集計中", percent: 35, retention: null };
  if (!summary.totalCount) return { level: "idle", label: "履歴待ち", percent: 0, retention: null };
  const weakOnly = !summary.dueCount && summary.weakCount;
  const pressure =
    summary.overdueCount * 3 +
    summary.todayCount * 2 +
    Math.max(0, summary.dueCount - summary.todayCount) +
    Math.min(5, (summary.weakCount || 0) * 0.8) +
    Math.min(4, summary.next7Count * 0.5);
  const dueRatio = summary.dueCount / Math.max(1, summary.totalCount);
  const percent = summary.dueCount
    ? Math.min(100, Math.round(24 + dueRatio * 46 + Math.min(30, pressure * 4)))
    : weakOnly
      ? Math.min(68, Math.round(30 + Math.min(32, pressure * 5)))
    : Math.min(32, Math.round(summary.next7Count * 4));
  const level = summary.overdueCount ? "overdue" : summary.todayCount ? "today" : summary.dueCount ? "due" : weakOnly ? "weak" : "idle";
  const label = summary.overdueCount ? "最優先" : summary.todayCount ? "今日" : summary.dueCount ? "到来" : weakOnly ? "弱点" : "待機";
  return {
    level,
    label,
    percent,
    retention: reviewAverageRetention(summary.dueEntries?.length ? summary.dueEntries : summary.weakEntries?.length ? summary.weakEntries : summary.entries),
  };
}

function reviewEntryFocusLabel(entry) {
  if (!entry) return "";
  const subject = studyChapterSubjectLabel(entry.chapterItem, courseDataStore[entry.courseId]);
  const title = entry.chapterItem?.title || subject || "復習対象";
  return [subject, title].filter(Boolean).filter((part, index, parts) => parts.indexOf(part) === index).join(" / ");
}

function reviewCurriculumRowHtml(summary) {
  const active = isReviewCurriculumModeForCourse(summary.courseId);
  const sessionEntries = reviewSessionEntriesForSummary(summary);
  const canStart = sessionEntries.length > 0 || active;
  const stateText = summary.failed ? "読込失敗" : summary.loading ? "集計中" : active ? "終了" : sessionEntries.length ? "開始" : "待機";
  const buttonDisabled = !canStart || summary.loading || summary.failed;
  const nextText = summary.nextDueDay ? formatStudyDay(summary.nextDueDay) : summary.dueCount ? "到来中" : "なし";
  const limitedText = sessionEntries.length ? `${sessionEntries.length}問` : "0問";
  const urgency = reviewCurriculumUrgency(summary);
  const focusText = reviewEntryFocusLabel(sessionEntries[0] || summary.dueEntries?.[0] || summary.weakEntries?.[0]) || (summary.nextDueDay ? `次回 ${nextText}` : "履歴が増えると予定化");
  const retentionText = urgency.retention == null ? "--" : `${urgency.retention}%`;
  return `
    <div class="review-curriculum-row${active ? " active" : ""}${summary.dueCount ? " due" : ""}${!summary.dueCount && summary.weakCount ? " weak" : ""}">
      <div class="review-curriculum-main">
        <strong>${escapeHtml(summary.courseName)}</strong>
        <div class="review-curriculum-priority" data-level="${escapeHtml(urgency.level)}" title="優先度 ${escapeHtml(urgency.label)}">
          <span style="width: ${urgency.percent}%"></span>
        </div>
        <div class="review-curriculum-meta">
          <span>優先 <b>${escapeHtml(urgency.label)}</b></span>
          <span>今日 <b>${summary.todayCount}</b>問</span>
          <span>遅れ <b>${summary.overdueCount}</b>問</span>
          <span>弱点 <b>${summary.weakCount || 0}</b>問</span>
          <span>保持 <b>${escapeHtml(retentionText)}</b></span>
          <span>次回 <b>${escapeHtml(nextText)}</b></span>
        </div>
        <small>${sessionEntries.length ? `このプラン ${escapeHtml(limitedText)} / ${escapeHtml(focusText)}` : escapeHtml(focusText)}</small>
      </div>
      <button
        class="review-curriculum-start${active ? " active" : ""}"
        type="button"
        data-review-course="${escapeHtml(summary.courseId)}"
        ${buttonDisabled ? "disabled" : ""}
      >${escapeHtml(stateText)}</button>
    </div>
  `;
}

function renderStudyTime() {
  tickPomodoro();
  tickStudyActivityCheck();
  const now = new Date();
  if (stopwatchRunning() && !state.stopwatch.activeContext) {
    state.stopwatch.activeContext = currentStudyContext();
    saveStopwatch();
  }
  renderAnalogClock(now);
  if (els.studyClockDate) els.studyClockDate.textContent = CLOCK_DATE_FORMATTER.format(now);
  if (els.studyStopwatchValue) els.studyStopwatchValue.textContent = formatStopwatch(stopwatchElapsedMs());

  renderPomodoro();
  const running = pomodoroEnabled() ? pomodoroRunning() : stopwatchRunning();
  els.studyStopwatchStart?.classList.toggle("active", running);
  if (els.studyStopwatchStartLabel) els.studyStopwatchStartLabel.textContent = running ? "停止" : "開始";
  if (els.studyStopwatchStart) {
    els.studyStopwatchStart.title = running ? "タイマー停止" : "タイマー開始";
    els.studyStopwatchStart.setAttribute("aria-pressed", String(running));
  }
  renderStudyReport();
}

function renderAnalogClock(now = new Date()) {
  const milliseconds = now.getMilliseconds();
  const seconds = now.getSeconds() + milliseconds / 1000;
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  const hourDegrees = hours * 30;
  const minuteDegrees = minutes * 6;
  const secondDegrees = seconds * 6;

  if (els.studyClockHour) els.studyClockHour.style.transform = `translateX(-50%) rotate(${hourDegrees}deg)`;
  if (els.studyClockMinute) els.studyClockMinute.style.transform = `translateX(-50%) rotate(${minuteDegrees}deg)`;
  if (els.studyClockSecond) els.studyClockSecond.style.transform = `translateX(-50%) rotate(${secondDegrees}deg)`;
  if (els.studyClockFace) {
    els.studyClockFace.setAttribute("aria-label", `現在時刻 ${CLOCK_TIME_FORMATTER.format(now)}`);
    els.studyClockFace.title = CLOCK_TIME_FORMATTER.format(now);
  }
}

function machidaWeatherUrl() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(MACHIDA_WEATHER_LOCATION.latitude));
  url.searchParams.set("longitude", String(MACHIDA_WEATHER_LOCATION.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,pressure_msl,wind_speed_10m"
  );
  url.searchParams.set("hourly", "rain,precipitation_probability");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "Asia/Tokyo");
  url.searchParams.set("wind_speed_unit", "ms");
  return url.href;
}

function machidaAirQualityUrl() {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(MACHIDA_WEATHER_LOCATION.latitude));
  url.searchParams.set("longitude", String(MACHIDA_WEATHER_LOCATION.longitude));
  url.searchParams.set("hourly", "pm2_5,pm10,nitrogen_dioxide,ozone");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "Asia/Tokyo");
  return url.href;
}

function weatherCodeInfo(code) {
  const value = Number(code);
  if (value === 0) return { icon: "clear", label: "快晴", mood: "clear" };
  if (value === 1) return { icon: "clear", label: "晴れ", mood: "clear" };
  if (value === 2) return { icon: "partly", label: "晴れ時々くもり", mood: "clear" };
  if (value === 3) return { icon: "cloudy", label: "くもり", mood: "cloud" };
  if ([45, 48].includes(value)) return { icon: "fog", label: "霧", mood: "fog" };
  if ([51, 53, 55, 56, 57].includes(value)) return { icon: "drizzle", label: "霧雨", mood: "rain" };
  if ([61, 63, 65, 66, 67].includes(value)) return { icon: "rain", label: value >= 65 ? "強い雨" : "雨", mood: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(value)) return { icon: "snow", label: "雪", mood: "snow" };
  if ([80, 81, 82].includes(value)) return { icon: "rain", label: "にわか雨", mood: "rain" };
  if ([95, 96, 99].includes(value)) return { icon: "storm", label: "雷雨", mood: "storm" };
  return { icon: "unknown", label: "予報あり", mood: "cloud" };
}

function formatWeatherNumber(value, suffix, fractionDigits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return `--${suffix}`;
  return `${number.toFixed(fractionDigits)}${suffix}`;
}

function formatWeatherUpdated(value) {
  const text = String(value || "");
  const date = new Date(text.includes("+") || text.endsWith("Z") ? text : `${text}:00+09:00`);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function parseOpenMeteoTime(value) {
  const text = String(value || "");
  if (!text) return Number.NaN;
  return Date.parse(/[zZ]|[+-]\d{2}:?\d{2}$/.test(text) ? text : `${text}:00+09:00`);
}

function hourlyValueForTime(hourly, key, targetTime) {
  const times = hourly?.time;
  const values = hourly?.[key];
  if (!Array.isArray(times) || !Array.isArray(values) || !times.length || !values.length) return null;

  const fallbackIndex = Math.min(values.length - 1, Math.max(0, new Date().getHours()));
  const target = parseOpenMeteoTime(targetTime) || parseOpenMeteoTime(times[fallbackIndex]);
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  times.forEach((time, index) => {
    if (index >= values.length) return;
    const parsed = parseOpenMeteoTime(time);
    if (!Number.isFinite(parsed)) return;
    const distance = Math.abs(parsed - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return values[bestIndex] ?? null;
}

function clampWeatherRatio(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (number - min) / (max - min)));
}

function weatherStatus(value, stops, fallback = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return stops.find((stop) => number <= stop.max) || stops[stops.length - 1] || fallback;
}

function temperatureWeatherStatus(value) {
  return weatherStatus(value, [
    { max: 4, note: "冷え込む", tone: "cold", color: "#60a5fa" },
    { max: 12, note: "寒い", tone: "cool", color: "#38bdf8" },
    { max: 24, note: "快適", tone: "mild", color: "#34d399" },
    { max: 28, note: "暖かい", tone: "warm", color: "#facc15" },
    { max: 32, note: "暑い", tone: "hot", color: "#fb923c" },
    { max: Number.POSITIVE_INFINITY, note: "危険な暑さ", tone: "danger", color: "#ef4444" },
  ]);
}

function humidityWeatherStatus(value) {
  return weatherStatus(value, [
    { max: 35, note: "乾燥", tone: "dry", color: "#f59e0b" },
    { max: 65, note: "快適", tone: "mild", color: "#34d399" },
    { max: 80, note: "蒸す", tone: "humid", color: "#22d3ee" },
    { max: Number.POSITIVE_INFINITY, note: "かなり湿気", tone: "wet", color: "#818cf8" },
  ]);
}

function pressureWeatherStatus(value) {
  return weatherStatus(value, [
    { max: 1000, note: "低め", tone: "low", color: "#818cf8" },
    { max: 1020, note: "安定", tone: "mild", color: "#34d399" },
    { max: Number.POSITIVE_INFINITY, note: "高め", tone: "high", color: "#38bdf8" },
  ]);
}

function rainWeatherStatus(value) {
  return weatherStatus(value, [
    { max: 0, note: "なし", tone: "quiet", color: "#64748b" },
    { max: 1, note: "小雨", tone: "rain", color: "#38bdf8" },
    { max: 5, note: "雨", tone: "rain", color: "#2563eb" },
    { max: Number.POSITIVE_INFINITY, note: "強い雨", tone: "danger", color: "#7c3aed" },
  ]);
}

function probabilityWeatherStatus(value) {
  return weatherStatus(value, [
    { max: 20, note: "低い", tone: "quiet", color: "#64748b" },
    { max: 50, note: "やや注意", tone: "rain", color: "#38bdf8" },
    { max: 80, note: "高め", tone: "rain", color: "#2563eb" },
    { max: Number.POSITIVE_INFINITY, note: "かなり高い", tone: "danger", color: "#7c3aed" },
  ]);
}

function windWeatherStatus(value) {
  return weatherStatus(value, [
    { max: 3, note: "穏やか", tone: "quiet", color: "#34d399" },
    { max: 8, note: "風あり", tone: "wind", color: "#38bdf8" },
    { max: 15, note: "強め", tone: "warm", color: "#f59e0b" },
    { max: Number.POSITIVE_INFINITY, note: "強風", tone: "danger", color: "#ef4444" },
  ]);
}

function airQualityWeatherStatus(value, pollutant) {
  const profiles = {
    pm25: { max: 35, stops: [10, 25, 35] },
    pm10: { max: 100, stops: [20, 50, 100] },
    no2: { max: 120, stops: [40, 100, 120] },
    ozone: { max: 180, stops: [100, 160, 180] },
  };
  const profile = profiles[pollutant] || profiles.pm25;
  return weatherStatus(value, [
    { max: profile.stops[0], note: "良好", tone: "mild", color: "#34d399", maxValue: profile.max },
    { max: profile.stops[1], note: "普通", tone: "warm", color: "#facc15", maxValue: profile.max },
    { max: profile.stops[2], note: "注意", tone: "hot", color: "#fb923c", maxValue: profile.max },
    { max: Number.POSITIVE_INFINITY, note: "悪い", tone: "danger", color: "#ef4444", maxValue: profile.max },
  ]);
}

function applyWeatherMeter(el, { value, min = 0, max = 100, status = null, label = "" } = {}) {
  if (!el) return;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    el.style.removeProperty("--weather-fill");
    el.style.removeProperty("--weather-color");
    el.removeAttribute("data-weather-note");
    el.removeAttribute("data-weather-tone");
    el.removeAttribute("title");
    return;
  }
  const fill = Math.round(clampWeatherRatio(number, min, max) * 100);
  const note = status?.note || "";
  el.style.setProperty("--weather-fill", `${fill}%`);
  el.style.setProperty("--weather-color", status?.color || "#38bdf8");
  if (note) {
    el.dataset.weatherNote = note;
    el.dataset.weatherTone = status?.tone || "";
    el.title = label ? `${label}: ${note}` : note;
  } else {
    el.removeAttribute("data-weather-note");
    el.removeAttribute("data-weather-tone");
    el.removeAttribute("title");
  }
}

function setWeatherTemperature(value, conditionLabel = "") {
  if (!els.weatherTemp) return "";
  const status = temperatureWeatherStatus(value);
  const number = Number(value);
  els.weatherTemp.textContent = formatWeatherNumber(value, "℃", 1);
  const readout = els.weatherTemp.parentElement;
  readout?.classList.add("weather-temp-readout");
  applyWeatherMeter(readout, {
    value,
    min: -5,
    max: 40,
    status,
    label: conditionLabel ? `${conditionLabel} / 気温` : "気温",
  });
  return Number.isFinite(number) ? status.note : "";
}

function setWeatherRange(minValue, maxValue) {
  if (!els.weatherRange) return;
  const min = formatWeatherNumber(minValue, "℃", 0);
  const max = formatWeatherNumber(maxValue, "℃", 0);
  const status = temperatureWeatherStatus(maxValue);
  els.weatherRange.textContent = `${min} / ${max}`;
  applyWeatherMeter(els.weatherRange.parentElement, {
    value: maxValue,
    min: -5,
    max: 40,
    status,
    label: "最高気温",
  });
}

function setWeatherMetric(el, value, suffix, fractionDigits = 0) {
  if (!el) return;
  el.textContent = formatWeatherNumber(value, suffix, fractionDigits);
}

function setWeatherMeterMetric(el, value, suffix, fractionDigits, meter) {
  setWeatherMetric(el, value, suffix, fractionDigits);
  applyWeatherMeter(el?.parentElement, meter);
}

function resetWeatherMetrics() {
  [
    els.weatherHumidity,
    els.weatherRange,
    els.weatherPressure,
    els.weatherRain,
    els.weatherPrecipProbability,
    els.weatherWindSpeed,
    els.weatherPm25,
    els.weatherPm10,
    els.weatherNo2,
    els.weatherOzone,
  ].forEach((el) => applyWeatherMeter(el?.parentElement));
  applyWeatherMeter(els.weatherTemp?.parentElement);
  setWeatherMetric(els.weatherHumidity, null, "%");
  if (els.weatherRange) els.weatherRange.textContent = "-- / --";
  setWeatherMetric(els.weatherPressure, null, "hPa");
  setWeatherMetric(els.weatherRain, null, "mm", 1);
  setWeatherMetric(els.weatherPrecipProbability, null, "%");
  setWeatherMetric(els.weatherWindSpeed, null, "m/s", 1);
  setWeatherMetric(els.weatherPm25, null, "ug/m3", 1);
  setWeatherMetric(els.weatherPm10, null, "ug/m3", 1);
  setWeatherMetric(els.weatherNo2, null, "ug/m3", 1);
  setWeatherMetric(els.weatherOzone, null, "ug/m3", 1);
}

function renderWeatherLoading() {
  els.weatherCard?.classList.add("loading");
  els.weatherCard?.classList.remove("error");
  if (els.weatherIcon) {
    els.weatherIcon.textContent = "";
    els.weatherIcon.setAttribute("data-weather-icon", "unknown");
    els.weatherIcon.setAttribute("aria-label", "天気取得中");
  }
  if (els.weatherCondition) els.weatherCondition.textContent = "取得中";
  if (els.weatherUpdated) els.weatherUpdated.textContent = "--";
}

function renderWeatherError() {
  els.weatherCard?.classList.remove("loading");
  els.weatherCard?.classList.add("error");
  els.weatherCard?.removeAttribute("data-weather");
  if (els.weatherIcon) {
    els.weatherIcon.textContent = "";
    els.weatherIcon.setAttribute("data-weather-icon", "unknown");
    els.weatherIcon.setAttribute("aria-label", "天気を取得できません");
  }
  if (els.weatherTemp) els.weatherTemp.textContent = "--℃";
  if (els.weatherCondition) els.weatherCondition.textContent = "取得できません";
  resetWeatherMetrics();
  if (els.weatherUpdated) els.weatherUpdated.textContent = "Open-Meteo";
}

function renderWeather(payload, airQualityPayload = null) {
  const current = payload?.current || {};
  const daily = payload?.daily || {};
  const hourly = payload?.hourly || {};
  const airHourly = airQualityPayload?.hourly || {};
  const info = weatherCodeInfo(current.weather_code ?? daily.weather_code?.[0]);
  els.weatherCard?.classList.remove("loading", "error");
  els.weatherCard?.setAttribute("data-weather", info.mood);
  if (els.weatherIcon) {
    els.weatherIcon.textContent = "";
    els.weatherIcon.setAttribute("data-weather-icon", info.icon);
    els.weatherIcon.setAttribute("aria-label", info.label);
  }
  const tempNote = setWeatherTemperature(current.temperature_2m, info.label);
  if (els.weatherCondition) els.weatherCondition.textContent = [info.label, tempNote].filter(Boolean).join(" / ");
  setWeatherMeterMetric(els.weatherHumidity, current.relative_humidity_2m, "%", 0, {
    value: current.relative_humidity_2m,
    min: 0,
    max: 100,
    status: humidityWeatherStatus(current.relative_humidity_2m),
    label: "湿度",
  });
  setWeatherRange(daily.temperature_2m_min?.[0], daily.temperature_2m_max?.[0]);
  setWeatherMeterMetric(els.weatherPressure, current.pressure_msl, "hPa", 1, {
    value: current.pressure_msl,
    min: 980,
    max: 1040,
    status: pressureWeatherStatus(current.pressure_msl),
    label: "海面気圧",
  });
  const rain = hourlyValueForTime(hourly, "rain", current.time);
  setWeatherMeterMetric(els.weatherRain, rain, "mm", 1, {
    value: rain,
    min: 0,
    max: 10,
    status: rainWeatherStatus(rain),
    label: "降雨量",
  });
  const precipitationProbability = hourlyValueForTime(hourly, "precipitation_probability", current.time);
  setWeatherMeterMetric(
    els.weatherPrecipProbability,
    precipitationProbability,
    "%",
    0,
    {
      value: precipitationProbability,
      min: 0,
      max: 100,
      status: probabilityWeatherStatus(precipitationProbability),
      label: "降水確率",
    }
  );
  setWeatherMeterMetric(els.weatherWindSpeed, current.wind_speed_10m, "m/s", 1, {
    value: current.wind_speed_10m,
    min: 0,
    max: 20,
    status: windWeatherStatus(current.wind_speed_10m),
    label: "風速",
  });
  const pm25 = hourlyValueForTime(airHourly, "pm2_5", current.time);
  const pm10 = hourlyValueForTime(airHourly, "pm10", current.time);
  const no2 = hourlyValueForTime(airHourly, "nitrogen_dioxide", current.time);
  const ozone = hourlyValueForTime(airHourly, "ozone", current.time);
  setWeatherMeterMetric(els.weatherPm25, pm25, "ug/m3", 1, {
    value: pm25,
    min: 0,
    max: 35,
    status: airQualityWeatherStatus(pm25, "pm25"),
    label: "PM2.5",
  });
  setWeatherMeterMetric(els.weatherPm10, pm10, "ug/m3", 1, {
    value: pm10,
    min: 0,
    max: 100,
    status: airQualityWeatherStatus(pm10, "pm10"),
    label: "PM10",
  });
  setWeatherMeterMetric(els.weatherNo2, no2, "ug/m3", 1, {
    value: no2,
    min: 0,
    max: 120,
    status: airQualityWeatherStatus(no2, "no2"),
    label: "NO2",
  });
  setWeatherMeterMetric(els.weatherOzone, ozone, "ug/m3", 1, {
    value: ozone,
    min: 0,
    max: 180,
    status: airQualityWeatherStatus(ozone, "ozone"),
    label: "O3",
  });
  if (els.weatherUpdated) els.weatherUpdated.textContent = `${formatWeatherUpdated(current.time)} 更新 / Open-Meteo`;
}

async function refreshMachidaWeather() {
  if (!els.weatherCard) return;
  renderWeatherLoading();
  els.weatherRefreshButton?.setAttribute("disabled", "");
  try {
    const airQualityPromise = fetch(machidaAirQualityUrl(), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
    const response = await fetch(machidaWeatherUrl(), { cache: "no-store" });
    if (!response.ok) throw new Error(`weather ${response.status}`);
    renderWeather(await response.json(), await airQualityPromise);
  } catch {
    renderWeatherError();
  } finally {
    els.weatherRefreshButton?.removeAttribute("disabled");
  }
}

function startWeatherTicker() {
  if (weatherHandle || weatherStartHandle) return;
  const start = () => {
    weatherStartHandle = null;
    refreshMachidaWeather();
    weatherHandle = window.setInterval(refreshMachidaWeather, WEATHER_REFRESH_MS);
  };
  if (!LITE_MODE) {
    start();
    return;
  }
  if ("requestIdleCallback" in window) {
    weatherStartHandle = window.requestIdleCallback(start, { timeout: 6000 });
  } else {
    weatherStartHandle = window.setTimeout(start, 2500);
  }
}

function backupDateStamp(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}`;
}

function createStudyBackupPayload() {
  const studyLog = normalizeStudyLog(studyLogWithLiveEntries());
  const progress = normalizeProgress(state.progress);
  const understanding = normalizeUnderstandingMap(state.understanding);
  const calculationQuestions = normalizeQuestionFlagMap(state.calculationQuestions);
  const understandingUpdatedAt = normalizeTimestampMap(state.understandingUpdatedAt);
  const calculationQuestionsUpdatedAt = normalizeTimestampMap(state.calculationQuestionsUpdatedAt);
  return {
    app: "quiz-zen-academy",
    version: STUDY_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    storageKeys: {
      progress: STORAGE_KEY,
      studyLog: STUDY_LOG_STORAGE_KEY,
      favorites: FAVORITES_STORAGE_KEY,
      understanding: UNDERSTANDING_STORAGE_KEY,
      understandingUpdatedAt: UNDERSTANDING_UPDATED_AT_STORAGE_KEY,
      calculationQuestions: CALCULATION_STORAGE_KEY,
      calculationQuestionsUpdatedAt: CALCULATION_UPDATED_AT_STORAGE_KEY,
      reviewSessionHistory: REVIEW_SESSION_HISTORY_STORAGE_KEY,
      reviewTargetCourseIds: REVIEW_TARGET_COURSES_STORAGE_KEY,
      reviewSession: REVIEW_SESSION_STORAGE_KEY,
      lastAnsweredPosition: LAST_ANSWERED_STORAGE_KEY,
    },
    summary: {
      progressRecords: Object.keys(progress).length,
      attempts: Object.values(progress).reduce((sum, record) => sum + attemptsFor(record).length, 0),
      studyLogEntries: studyLog.length,
      studyDurationMs: sumStudyDuration(studyLog),
      understanding: Object.keys(understanding).length,
      calculationQuestions: Object.keys(calculationQuestions).length,
      reviewSessionHistory: normalizeReviewSessionHistory(state.reviewSessionHistory).length,
    },
    progress,
    studyLog,
    understanding,
    understandingUpdatedAt,
    calculationQuestions,
    calculationQuestionsUpdatedAt,
    lastAnsweredPosition: loadLastAnsweredPosition(),
    reviewTargetCourseIds: normalizeReviewTargetCourseIds(state.reviewTargetCourseIds),
    reviewSession: normalizeReviewSession(state.reviewSession),
    reviewSessionHistory: normalizeReviewSessionHistory(state.reviewSessionHistory),
  };
}

function downloadJsonFile(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fullDataCanonicalize(value) {
  if (Array.isArray(value)) return value.map(fullDataCanonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, fullDataCanonicalize(child)])
    );
  }
  return value;
}

async function fullDataSha256(value) {
  if (!globalThis.crypto?.subtle) throw new Error("このブラウザではバックアップの整合性を確認できません。");
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

function fullDataChecksumBody(payload) {
  return JSON.stringify(fullDataCanonicalize(payload));
}

function isFullDataStorageKey(key) {
  return (
    key.startsWith("quiz-zen-") ||
    key.startsWith("exam-prep-quiz-") ||
    key.startsWith("gsls-quiz-") ||
    key.startsWith("local-quiz-studio-")
  );
}

function isFullDataSensitiveStorageKey(key) {
  return key === FULL_DATA_LLM_PROVIDERS_STORAGE_KEY || /(?:api[-_ ]?key|password|secret|credential|access[-_ ]?token)/i.test(key);
}

function captureFullDataStorage() {
  const entries = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !isFullDataStorageKey(key) || isFullDataSensitiveStorageKey(key)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) entries.push({ key, value });
  }
  return entries.sort((left, right) => left.key.localeCompare(right.key));
}

function sanitizeFullDataProviderBaseUrl(value) {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) return "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function captureFullDataLlmProviderSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FULL_DATA_LLM_PROVIDERS_STORAGE_KEY) || "null");
    if (!parsed?.profiles || typeof parsed.profiles !== "object") return null;
    const profiles = Object.fromEntries(
      Object.entries(parsed.profiles).map(([slot, profile]) => [
        slot,
        {
          provider: String(profile?.provider || "").slice(0, 80),
          model: String(profile?.model || "").slice(0, 240),
          baseUrl: sanitizeFullDataProviderBaseUrl(profile?.baseUrl).slice(0, 500),
          updatedAt: Number(profile?.updatedAt) || null,
        },
      ])
    );
    return { version: 1, profiles };
  } catch {
    return null;
  }
}

function createFullDataDatabaseSchema(database) {
  if (!database.objectStoreNames.contains("subjects")) {
    const store = database.createObjectStore("subjects", { keyPath: "id" });
    store.createIndex("order", "order");
    store.createIndex("updatedAt", "updatedAt");
  }
  if (!database.objectStoreNames.contains("sections")) {
    const store = database.createObjectStore("sections", { keyPath: "id" });
    store.createIndex("subjectId", "subjectId");
    store.createIndex("[subjectId+order]", ["subjectId", "order"]);
    store.createIndex("updatedAt", "updatedAt");
  }
  if (!database.objectStoreNames.contains("questions")) {
    const store = database.createObjectStore("questions", { keyPath: "id" });
    store.createIndex("sectionId", "sectionId");
    store.createIndex("[sectionId+order]", ["sectionId", "order"]);
    store.createIndex("tags", "tags", { multiEntry: true });
    store.createIndex("updatedAt", "updatedAt");
  }
  if (!database.objectStoreNames.contains("attempts")) {
    const store = database.createObjectStore("attempts", { keyPath: "id" });
    store.createIndex("questionId", "questionId");
    store.createIndex("answeredAt", "answeredAt");
    store.createIndex("[questionId+answeredAt]", ["questionId", "answeredAt"]);
  }
  if (!database.objectStoreNames.contains("questionStates")) {
    const store = database.createObjectStore("questionStates", { keyPath: "questionId" });
    store.createIndex("bookmarked", "bookmarked");
    store.createIndex("dueAt", "dueAt");
    store.createIndex("updatedAt", "updatedAt");
  }
  if (!database.objectStoreNames.contains("studySessions")) {
    const store = database.createObjectStore("studySessions", { keyPath: "id" });
    store.createIndex("subjectId", "subjectId");
    store.createIndex("startedAt", "startedAt");
  }
  if (!database.objectStoreNames.contains("settings")) {
    database.createObjectStore("settings", { keyPath: "key" });
  }
}

function fullDataRequest(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error || new Error("データの読み書きに失敗しました。")), {
      once: true,
    });
  });
}

function fullDataTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("データの復元を中止しました。")), {
      once: true,
    });
    transaction.addEventListener("error", () => reject(transaction.error || new Error("データの復元に失敗しました。")), {
      once: true,
    });
  });
}

function openFullDataDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error("このブラウザでは教材データを保存できません。"));
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(FULL_DATA_DATABASE_NAME);
    request.addEventListener("upgradeneeded", () => createFullDataDatabaseSchema(request.result));
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error || new Error("教材データベースを開けませんでした。")), {
      once: true,
    });
    request.addEventListener("blocked", () => reject(new Error("問題をつくる・なおす画面を閉じて、もう一度お試しください。")), {
      once: true,
    });
  });
}

async function readFullDataDatabase() {
  const database = await openFullDataDatabase();
  try {
    const missing = FULL_DATA_DATABASE_STORES.filter((storeName) => !database.objectStoreNames.contains(storeName));
    if (missing.length) throw new Error(`教材データベースの保存領域が不足しています: ${missing.join(", ")}`);
    const transaction = database.transaction(FULL_DATA_DATABASE_STORES, "readonly");
    const completed = fullDataTransaction(transaction);
    const records = await Promise.all(
      FULL_DATA_DATABASE_STORES.map((storeName) => fullDataRequest(transaction.objectStore(storeName).getAll()))
    );
    await completed;
    return {
      databaseName: FULL_DATA_DATABASE_NAME,
      schemaVersion: 1,
      stores: Object.fromEntries(FULL_DATA_DATABASE_STORES.map((storeName, index) => [storeName, records[index]])),
    };
  } finally {
    database.close();
  }
}

async function replaceFullDataDatabase(studio) {
  const database = await openFullDataDatabase();
  try {
    const missing = FULL_DATA_DATABASE_STORES.filter((storeName) => !database.objectStoreNames.contains(storeName));
    if (missing.length) throw new Error(`教材データベースの復元先が不足しています: ${missing.join(", ")}`);
    const transaction = database.transaction(FULL_DATA_DATABASE_STORES, "readwrite");
    const completed = fullDataTransaction(transaction);
    FULL_DATA_DATABASE_STORES.forEach((storeName) => {
      const store = transaction.objectStore(storeName);
      store.clear();
      studio.stores[storeName].forEach((record) => store.put(record));
    });
    await completed;
  } finally {
    database.close();
  }
}

function validateFullDataStorage(entries) {
  if (!Array.isArray(entries)) throw new Error("学習データの形式が正しくありません。");
  const keys = new Set();
  return entries.map((entry) => {
    const key = typeof entry?.key === "string" ? entry.key : "";
    let value = typeof entry?.value === "string" ? entry.value : null;
    if (!key || key.length > 200 || value === null || !isFullDataStorageKey(key) || isFullDataSensitiveStorageKey(key)) {
      throw new Error("バックアップに許可されていない設定が含まれています。");
    }
    if (keys.has(key)) throw new Error("バックアップに重複した設定が含まれています。");
    keys.add(key);
    if (key === "local-quiz-studio-legacy-dataset-v1") {
      // チェックサムは破損検知用。教材キャッシュのHTML等は信頼せず、表示前に除外する。
      if (typeof window.quizPalValidateLegacyDataset !== "function") throw new Error("教材を安全に検証できません。ページを更新してください。");
      value = JSON.stringify(window.quizPalValidateLegacyDataset(JSON.parse(value)));
    }
    return { key, value };
  });
}

function validateFullDataLlmProviderSettings(settings) {
  if (settings === null || settings === undefined) return null;
  if (!settings || typeof settings !== "object" || settings.version !== 1 || !settings.profiles || typeof settings.profiles !== "object") {
    throw new Error("LLM設定の形式が正しくありません。");
  }
  const profileEntries = Object.entries(settings.profiles);
  if (profileEntries.length > Object.keys(FULL_DATA_LLM_PROVIDER_DEFINITIONS).length) {
    throw new Error("LLM設定の件数が上限を超えています。");
  }
  const profiles = Object.fromEntries(
    profileEntries.map(([slot, profile]) => {
      const definition = FULL_DATA_LLM_PROVIDER_DEFINITIONS[slot];
      if (!definition || !profile || typeof profile !== "object") {
        throw new Error("LLM設定に不正なプロファイルがあります。");
      }
      const provider = typeof profile.provider === "string" ? profile.provider : "";
      const model = typeof profile.model === "string" ? profile.model : "";
      const baseUrl = typeof profile.baseUrl === "string" ? profile.baseUrl : "";
      const updatedAt = profile.updatedAt === null ? null : Number(profile.updatedAt);
      if (
        provider !== definition.provider ||
        model.length > 240 ||
        baseUrl.length > 500 ||
        (updatedAt !== null && (!Number.isFinite(updatedAt) || updatedAt < 0))
      ) {
        throw new Error("LLM設定に上限を超えた値があります。");
      }
      if (baseUrl) {
        let url;
        try {
          url = new URL(baseUrl);
        } catch {
          throw new Error("LLM設定のAPIベースURLが正しくありません。");
        }
        const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
        if ((url.protocol !== "https:" && !localHttp) || url.username || url.password || url.search || url.hash) {
          throw new Error("LLM設定のAPIベースURLが安全ではありません。");
        }
      }
      const normalizedBaseUrl = sanitizeFullDataProviderBaseUrl(baseUrl || definition.baseUrl);
      if (provider !== "compatible" && normalizedBaseUrl !== definition.baseUrl) {
        throw new Error("固定接続先のAPIベースURLは変更できません。");
      }
      return [slot, { provider, model, baseUrl: normalizedBaseUrl || definition.baseUrl, updatedAt }];
    })
  );
  return { version: 1, profiles };
}

function fullDataRecordString(record, key, maxLength, { allowEmpty = true, nullable = false } = {}) {
  const value = record[key];
  if (nullable && value === null) return null;
  if (typeof value !== "string" || value.length > maxLength || (!allowEmpty && !value.trim())) {
    throw new Error(`教材データの${key}が正しくありません。`);
  }
  return value;
}

function fullDataRecordId(record, key = "id") {
  const value = fullDataRecordString(record, key, 120, { allowEmpty: false });
  if (/[\u0000-\u001f\u007f]/.test(value)) throw new Error(`教材データの${key}が正しくありません。`);
  return value;
}

function fullDataRecordInteger(record, key, { min = 0, max = Number.MAX_SAFE_INTEGER, nullable = false } = {}) {
  const value = record[key];
  if (nullable && value === null) return null;
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`教材データの${key}が正しくありません。`);
  }
  return value;
}

function fullDataRecordIso(record, key, { nullable = false } = {}) {
  const value = fullDataRecordString(record, key, 40, { allowEmpty: false, nullable });
  if (value === null) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`教材データの${key}が正しくありません。`);
  }
  return value;
}

function fullDataStringArray(value, key, { maxItems, maxLength, allowEmpty = true } = {}) {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`教材データの${key}が正しくありません。`);
  return value.map((item) => {
    if (typeof item !== "string" || item.length > maxLength || (!allowEmpty && !item.trim())) {
      throw new Error(`教材データの${key}が正しくありません。`);
    }
    return item;
  });
}

function validateFullDataStudioRecord(storeName, record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new Error(`教材データの${storeName}に不正なレコードがあります。`);
  }
  if (storeName === "subjects") {
    if (record.completed !== undefined && typeof record.completed !== "boolean") {
      throw new Error("教材データの修了状態が正しくありません。");
    }
    const color = fullDataRecordString(record, "color", 7, { allowEmpty: false });
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("教材データのcolorが正しくありません。");
    return {
      id: fullDataRecordId(record),
      name: fullDataRecordString(record, "name", 120, { allowEmpty: false }),
      ...(record.completed === undefined ? {} : { completed: record.completed }),
      description: fullDataRecordString(record, "description", 2000),
      color,
      order: fullDataRecordInteger(record, "order"),
      createdAt: fullDataRecordIso(record, "createdAt"),
      updatedAt: fullDataRecordIso(record, "updatedAt"),
    };
  }
  if (storeName === "sections") {
    return {
      id: fullDataRecordId(record),
      subjectId: fullDataRecordId(record, "subjectId"),
      name: fullDataRecordString(record, "name", 120, { allowEmpty: false }),
      description: fullDataRecordString(record, "description", 2000),
      order: fullDataRecordInteger(record, "order"),
      createdAt: fullDataRecordIso(record, "createdAt"),
      updatedAt: fullDataRecordIso(record, "updatedAt"),
    };
  }
  if (storeName === "questions") {
    const type = fullDataRecordString(record, "type", 24, { allowEmpty: false });
    if (!["single_choice", "multiple_choice", "true_false", "text"].includes(type)) {
      throw new Error("教材データの問題形式が正しくありません。");
    }
    if (!Array.isArray(record.options) || record.options.length > 6) {
      throw new Error("教材データの選択肢が正しくありません。");
    }
    const optionIds = new Set();
    const options = record.options.map((option) => {
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        throw new Error("教材データの選択肢が正しくありません。");
      }
      const id = fullDataRecordId(option);
      if (optionIds.has(id)) throw new Error("教材データに重複した選択肢IDがあります。");
      optionIds.add(id);
      return { id, text: fullDataRecordString(option, "text", 10000) };
    });
    const correctOptionIds = fullDataStringArray(record.correctOptionIds, "correctOptionIds", {
      maxItems: 6,
      maxLength: 120,
      allowEmpty: false,
    });
    const acceptedAnswers = fullDataStringArray(record.acceptedAnswers, "acceptedAnswers", {
      maxItems: 20,
      maxLength: 1000,
    });
    if (correctOptionIds.some((id) => !optionIds.has(id)) || new Set(correctOptionIds).size !== correctOptionIds.length) {
      throw new Error("教材データの正答が選択肢と一致しません。");
    }
    if (type === "text" ? acceptedAnswers.length === 0 : correctOptionIds.length === 0) {
      throw new Error("教材データに正答がありません。");
    }
    if (["single_choice", "multiple_choice"].includes(type) && options.length < 2) {
      throw new Error("教材データの選択肢が不足しています。");
    }
    if (["single_choice", "true_false"].includes(type) && correctOptionIds.length !== 1) {
      throw new Error("教材データの正答数が問題形式と一致しません。");
    }
    const sanitized = {
      id: fullDataRecordId(record),
      sectionId: fullDataRecordId(record, "sectionId"),
      type,
      promptMarkdown: fullDataRecordString(record, "promptMarkdown", 20000, { allowEmpty: false }),
      options,
      correctOptionIds,
      acceptedAnswers,
      explanationMarkdown: fullDataRecordString(record, "explanationMarkdown", 20000),
      tags: fullDataStringArray(record.tags, "tags", { maxItems: 30, maxLength: 60 }),
      timeLimitSeconds: fullDataRecordInteger(record, "timeLimitSeconds", { min: 5, max: 3600, nullable: true }),
      order: fullDataRecordInteger(record, "order"),
      contentRevision: fullDataRecordInteger(record, "contentRevision", { min: 1 }),
      createdAt: fullDataRecordIso(record, "createdAt"),
      updatedAt: fullDataRecordIso(record, "updatedAt"),
    };
    for (const [key, maxLength] of [["origin", 2000], ["license", 2000]]) {
      if (record[key] !== undefined) sanitized[key] = fullDataRecordString(record, key, maxLength);
    }
    if (record.sourceUrl !== undefined) {
      const sourceUrl = fullDataRecordString(record, "sourceUrl", 2000, { allowEmpty: false });
      let parsedUrl;
      try {
        parsedUrl = new URL(sourceUrl);
      } catch {
        throw new Error("教材データのsourceUrlが正しくありません。");
      }
      if (!["https:", "http:"].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
        throw new Error("教材データのsourceUrlが安全ではありません。");
      }
      sanitized.sourceUrl = sourceUrl;
    }
    return sanitized;
  }
  if (storeName === "attempts") {
    if (typeof record.correct !== "boolean" || !Number.isFinite(record.elapsedMs) || record.elapsedMs < 0 || record.elapsedMs > 604800000) {
      throw new Error("教材データの回答履歴が正しくありません。");
    }
    return {
      id: fullDataRecordId(record),
      questionId: fullDataRecordId(record, "questionId"),
      contentRevision: fullDataRecordInteger(record, "contentRevision", { min: 1 }),
      answer: fullDataStringArray(record.answer, "answer", { maxItems: 20, maxLength: 10000 }),
      correct: record.correct,
      elapsedMs: record.elapsedMs,
      answeredAt: fullDataRecordIso(record, "answeredAt"),
    };
  }
  if (storeName === "questionStates") {
    const understanding = fullDataRecordString(record, "understanding", 16, { allowEmpty: false });
    if (!["unrated", "learning", "almost", "mastered"].includes(understanding) || typeof record.bookmarked !== "boolean") {
      throw new Error("教材データの復習状態が正しくありません。");
    }
    return {
      questionId: fullDataRecordId(record, "questionId"),
      bookmarked: record.bookmarked,
      understanding,
      dueAt: fullDataRecordIso(record, "dueAt", { nullable: true }),
      intervalDays: fullDataRecordInteger(record, "intervalDays", { max: 36500 }),
      correctStreak: fullDataRecordInteger(record, "correctStreak", { max: 100000 }),
      updatedAt: fullDataRecordIso(record, "updatedAt"),
    };
  }
  if (storeName === "studySessions") {
    const subjectId = record.subjectId === null ? null : fullDataRecordId(record, "subjectId");
    const startedAt = fullDataRecordIso(record, "startedAt");
    const endedAt = fullDataRecordIso(record, "endedAt");
    const answered = fullDataRecordInteger(record, "answered", { max: 1000000 });
    const correct = fullDataRecordInteger(record, "correct", { max: answered });
    if (endedAt < startedAt) throw new Error("教材データの学習セッション日時が正しくありません。");
    return { id: fullDataRecordId(record), subjectId, startedAt, endedAt, answered, correct };
  }
  const key = fullDataRecordString(record, "key", 200, { allowEmpty: false });
  let encodedValue;
  try {
    encodedValue = JSON.stringify(record.value);
  } catch {
    throw new Error("教材データの設定値が正しくありません。");
  }
  const maxSettingChars = key === LLM_IMAGE_LIBRARY_SETTING_KEY ? LLM_IMAGE_BACKUP_MAX_CHARS : 100000;
  if (encodedValue === undefined || encodedValue.length > maxSettingChars) throw new Error("教材データの設定値が大きすぎます。");
  if (key === LLM_IMAGE_LIBRARY_SETTING_KEY) {
    return { key, value: { version: 1, items: normalizeLlmImageItems(record.value) } };
  }
  return { key, value: record.value };
}

function validateFullDataStudio(studio) {
  if (!studio || typeof studio !== "object" || studio.databaseName !== FULL_DATA_DATABASE_NAME || studio.schemaVersion !== 1) {
    throw new Error("教材データの形式が正しくありません。");
  }
  if (!studio.stores || typeof studio.stores !== "object") throw new Error("教材データの保存領域がありません。");
  let totalRecords = 0;
  const stores = {};
  FULL_DATA_DATABASE_STORES.forEach((storeName) => {
    const records = studio.stores[storeName];
    if (!Array.isArray(records)) throw new Error(`教材データの${storeName}が正しくありません。`);
    const primaryKey = FULL_DATA_DATABASE_PRIMARY_KEYS[storeName];
    const primaryKeys = new Set();
    stores[storeName] = records.map((record) => {
      const sanitized = validateFullDataStudioRecord(storeName, record);
      const key = sanitized[primaryKey];
      if (primaryKeys.has(key)) {
        throw new Error(`教材データの${storeName}に不正または重複したIDがあります。`);
      }
      primaryKeys.add(key);
      return sanitized;
    });
    totalRecords += records.length;
  });
  if (totalRecords > 200000) throw new Error("教材データの件数が上限を超えています。");
  const subjectIds = new Set(stores.subjects.map((record) => record.id));
  const sectionIds = new Set(stores.sections.map((record) => record.id));
  const questionIds = new Set(stores.questions.map((record) => record.id));
  if (stores.sections.some((record) => !subjectIds.has(record.subjectId))) {
    throw new Error("所属科目が存在しないセクションが含まれています。");
  }
  if (stores.questions.some((record) => !sectionIds.has(record.sectionId))) {
    throw new Error("所属セクションが存在しない問題が含まれています。");
  }
  if (stores.attempts.some((record) => !questionIds.has(record.questionId))) {
    throw new Error("対象問題が存在しない回答履歴が含まれています。");
  }
  if (stores.questionStates.some((record) => !questionIds.has(record.questionId))) {
    throw new Error("対象問題が存在しない復習状態が含まれています。");
  }
  return { databaseName: FULL_DATA_DATABASE_NAME, schemaVersion: 1, stores };
}

async function parseFullDataBackup(file) {
  if (!file) throw new Error("バックアップファイルを選択してください。");
  if (file.size > FULL_DATA_BACKUP_MAX_BYTES) throw new Error("バックアップは20MB以下にしてください。");
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    throw new Error("JSONを解析できませんでした。");
  }
  if (payload?.app !== FULL_DATA_BACKUP_APP || payload?.schemaVersion !== FULL_DATA_BACKUP_VERSION) {
    throw new Error("このアプリの全データバックアップではありません。");
  }
  if (!Number.isFinite(Date.parse(payload.exportedAt || ""))) throw new Error("バックアップ日時が正しくありません。");
  if (!/^[a-f0-9]{64}$/.test(payload.checksum || "")) throw new Error("チェックサムが正しくありません。");
  const { checksum, ...body } = payload;
  const expected = await fullDataSha256(fullDataChecksumBody(body));
  if (checksum !== expected) throw new Error("チェックサムが一致しません。ファイルが壊れている可能性があります。");
  return {
    ...body,
    localStorage: validateFullDataStorage(body.localStorage),
    llmProviderSettings: validateFullDataLlmProviderSettings(body.llmProviderSettings),
    studio: validateFullDataStudio(body.studio),
    checksum,
  };
}

function replaceFullDataStorage(entries) {
  const previous = captureFullDataStorage();
  const importedKeys = new Set(entries.map((entry) => entry.key));
  try {
    entries.forEach(({ key, value }) => localStorage.setItem(key, value));
    previous.forEach(({ key }) => {
      if (!importedKeys.has(key)) localStorage.removeItem(key);
    });
  } catch (error) {
    const previousKeys = new Set(previous.map((entry) => entry.key));
    captureFullDataStorage().forEach(({ key }) => {
      if (!previousKeys.has(key)) localStorage.removeItem(key);
    });
    previous.forEach(({ key, value }) => localStorage.setItem(key, value));
    throw error;
  }
}

function restoreFullDataLlmProviderSettings(settings) {
  if (!settings) return;
  const bridge = window.__quizZenLlmBridge;
  if (!bridge || typeof bridge.restoreProfiles !== "function") {
    throw new Error("安全にLLM設定を復元できません。ページを更新してから再試行してください。");
  }
  return bridge.restoreProfiles(settings);
}

function fullDataSummary(studio, localStorageEntries) {
  const imageRecord = studio.stores.settings.find((record) => record?.key === LLM_IMAGE_LIBRARY_SETTING_KEY);
  return {
    subjects: studio.stores.subjects.length,
    sections: studio.stores.sections.length,
    questions: studio.stores.questions.length,
    attempts: studio.stores.attempts.length,
    questionStates: studio.stores.questionStates.length,
    studySessions: studio.stores.studySessions.length,
    settings: studio.stores.settings.length,
    llmImages: normalizeLlmImageItems(imageRecord?.value).length,
    localStorageEntries: localStorageEntries.length,
  };
}

function setFullDataBusy(busy) {
  if (els.fullDataSaveButton) els.fullDataSaveButton.disabled = busy;
  if (els.fullDataLoadButton) els.fullDataLoadButton.disabled = busy;
}

function showFullDataStatus(message, kind = "") {
  if (!els.fullDataStatus) return;
  els.fullDataStatus.textContent = message;
  if (kind) els.fullDataStatus.dataset.kind = kind;
  else delete els.fullDataStatus.dataset.kind;
}

async function exportFullDataBackup() {
  setFullDataBusy(true);
  showFullDataStatus("全データを集めています…");
  try {
    commitRunningStudyTime();
    const [studio, localStorageEntries] = await Promise.all([readFullDataDatabase(), Promise.resolve(captureFullDataStorage())]);
    const body = {
      app: FULL_DATA_BACKUP_APP,
      schemaVersion: FULL_DATA_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      summary: fullDataSummary(studio, localStorageEntries),
      localStorage: localStorageEntries,
      llmProviderSettings: captureFullDataLlmProviderSettings(),
      studio,
    };
    const payload = { ...body, checksum: await fullDataSha256(fullDataChecksumBody(body)) };
    downloadJsonFile(payload, `quiz-pal-all-data-${backupDateStamp()}.json`);
    showFullDataStatus(`保存完了: 科目${body.summary.subjects} / 問題${body.summary.questions} / 画像${body.summary.llmImages}`, "success");
  } catch (error) {
    showFullDataStatus(`保存失敗: ${error?.message || "データを確認してください"}`, "error");
  } finally {
    setFullDataBusy(false);
  }
}

async function importFullDataBackupFile(file) {
  if (!file) return;
  setFullDataBusy(true);
  showFullDataStatus("バックアップを検証しています…");
  try {
    const payload = await parseFullDataBackup(file);
    const accepted = window.confirm(
      `このバックアップで現在の全データを置き換えます。\n\n科目 ${payload.summary?.subjects ?? payload.studio.stores.subjects.length}件 / 問題 ${payload.summary?.questions ?? payload.studio.stores.questions.length}件 / 画像 ${payload.summary?.llmImages ?? 0}件\n\nAPIキーはバックアップに含まれません。API接続先が変わる場合は安全のため入力済みキーを削除します。続けますか？`
    );
    if (!accepted) {
      showFullDataStatus("ロードをキャンセルしました");
      return;
    }
    showFullDataStatus("全データを復元しています…");
    const previousStudio = await readFullDataDatabase();
    const previousStorage = captureFullDataStorage();
    const previousLlmProviderSettings = localStorage.getItem(FULL_DATA_LLM_PROVIDERS_STORAGE_KEY);
    try {
      await replaceFullDataDatabase(payload.studio);
      replaceFullDataStorage(payload.localStorage);
      restoreFullDataLlmProviderSettings(payload.llmProviderSettings);
    } catch (error) {
      await replaceFullDataDatabase(previousStudio).catch(() => {});
      replaceFullDataStorage(previousStorage);
      if (previousLlmProviderSettings === null) localStorage.removeItem(FULL_DATA_LLM_PROVIDERS_STORAGE_KEY);
      else localStorage.setItem(FULL_DATA_LLM_PROVIDERS_STORAGE_KEY, previousLlmProviderSettings);
      throw error;
    }
    showFullDataStatus("ロード完了。画面を更新します…", "success");
    window.setTimeout(() => location.reload(), 600);
  } catch (error) {
    showFullDataStatus(`読込失敗: ${error?.message || "ファイルを確認してください"}`, "error");
  } finally {
    setFullDataBusy(false);
    if (els.fullDataLoadInput) els.fullDataLoadInput.value = "";
  }
}

function exportStudyBackup() {
  const payload = createStudyBackupPayload();
  downloadJsonFile(payload, `quiz-pal-study-${backupDateStamp()}.json`);
  showStudyBackupStatus(
    `書出: ${payload.summary.progressRecords}件 / 復習${payload.summary.reviewSessionHistory}回 / ${formatStudyDuration(payload.summary.studyDurationMs)}`
  );
}

function normalizeStudyBackupPayload(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const progress = normalizeProgress(source.progress || source.history || {});
  const studyLog = normalizeStudyLog(source.studyLog || source.studyTimeLog || source.study_time_log || []);
  const understanding = normalizeUnderstandingMap(source.understanding || source.understandingLevels || {});
  const understandingUpdatedAt = normalizeTimestampMap(
    source.understandingUpdatedAt || source.understanding_updated_at || source.understandingTimestamps || {}
  );
  const calculationQuestions = normalizeQuestionFlagMap(
    source.calculationQuestions || source.calculationQuestionIds || source.calculation_question_ids || {}
  );
  const calculationQuestionsUpdatedAt = normalizeTimestampMap(
    source.calculationQuestionsUpdatedAt ||
      source.calculation_questions_updated_at ||
      source.calculationQuestionTimestamps ||
      {}
  );
  const reviewSessionHistory = normalizeReviewSessionHistory(
    source.reviewSessionHistory || source.review_session_history || source.reviewSessions || []
  );
  const hasLastAnsweredPosition =
    Object.prototype.hasOwnProperty.call(source, "lastAnsweredPosition") ||
    Object.prototype.hasOwnProperty.call(source, "last_answered_position");
  const lastAnsweredPosition = normalizeLastAnsweredPosition(source.lastAnsweredPosition || source.last_answered_position);
  const hasReviewTargetCourseIds =
    Object.prototype.hasOwnProperty.call(source, "reviewTargetCourseIds") ||
    Object.prototype.hasOwnProperty.call(source, "review_target_course_ids");
  const reviewTargetCourseIds = hasReviewTargetCourseIds
    ? normalizeReviewTargetCourseIds(source.reviewTargetCourseIds || source.review_target_course_ids, { fallbackToDefault: false })
    : null;
  const hasReviewSession =
    Object.prototype.hasOwnProperty.call(source, "reviewSession") ||
    Object.prototype.hasOwnProperty.call(source, "review_session");
  const reviewSession = hasReviewSession ? normalizeReviewSession(source.reviewSession || source.review_session) : null;
  const legacyFavorites = Array.isArray(source.favorites)
    ? source.favorites.filter((value) => typeof value === "string")
    : [];
  legacyFavorites.forEach((questionId) => {
    if (!understanding[questionId]) understanding[questionId] = "partial";
  });
  return {
    progress,
    studyLog,
    understanding,
    understandingUpdatedAt,
    calculationQuestions,
    calculationQuestionsUpdatedAt,
    lastAnsweredPosition,
    hasLastAnsweredPosition,
    reviewTargetCourseIds,
    hasReviewTargetCourseIds,
    reviewSession,
    hasReviewSession,
    reviewSessionHistory,
  };
}

function attemptMergeKey(attempt) {
  return [
    attempt.answeredAt || "",
    attempt.choiceKey || "",
    attempt.choiceLabel || "",
    attempt.choice,
    attempt.correct ? "1" : "0",
    attempt.timedOut ? "1" : "0",
  ].join("|");
}

function attemptSortValue(attempt) {
  const time = Date.parse(attempt?.answeredAt || "");
  return Number.isFinite(time) ? time : 0;
}

function mergeProgressRecord(existingRecord, incomingRecord) {
  const attemptsByKey = new Map();
  [...attemptsFor(existingRecord), ...attemptsFor(incomingRecord)].forEach((attempt) => {
    attemptsByKey.set(attemptMergeKey(attempt), attempt);
  });
  const attempts = [...attemptsByKey.values()].sort((a, b) => attemptSortValue(a) - attemptSortValue(b));
  if (!attempts.length) return null;
  const latest = attempts[attempts.length - 1];
  return {
    attempts,
    followUp: !latest.correct,
    lastAnsweredAt: latest.answeredAt,
  };
}

function mergeProgress(existingProgress, incomingProgress) {
  const merged = { ...normalizeProgress(existingProgress) };
  Object.entries(normalizeProgress(incomingProgress)).forEach(([questionId, incomingRecord]) => {
    const record = mergeProgressRecord(merged[questionId], incomingRecord);
    if (record) merged[questionId] = record;
  });
  return merged;
}

function studyLogMergeKey(entry) {
  return [
    Math.floor(Number(entry.startAt) || 0),
    Math.floor(Number(entry.endAt) || 0),
    entry.courseId || "",
    entry.chapterKey || "",
    entry.chapterTitle || "",
  ].join("|");
}

function mergeStudyLogs(existingEntries, incomingEntries) {
  const entriesByKey = new Map();
  [...normalizeStudyLog(existingEntries), ...normalizeStudyLog(incomingEntries)].forEach((entry) => {
    entriesByKey.set(studyLogMergeKey(entry), entry);
  });
  return [...entriesByKey.values()]
    .sort((a, b) => Number(a.startAt || 0) - Number(b.startAt || 0))
    .slice(-STUDY_LOG_LIMIT);
}

function mergeTimestampedMap(existingValues, incomingValues, existingUpdatedAt, incomingUpdatedAt) {
  const mergedValues = { ...existingValues };
  const mergedUpdatedAt = { ...normalizeTimestampMap(existingUpdatedAt) };
  const incomingTimes = normalizeTimestampMap(incomingUpdatedAt);
  const incomingKeys = new Set([...Object.keys(incomingValues || {}), ...Object.keys(incomingTimes)]);

  incomingKeys.forEach((questionId) => {
    const localHas = Object.prototype.hasOwnProperty.call(mergedValues, questionId);
    const incomingHas = Object.prototype.hasOwnProperty.call(incomingValues || {}, questionId);
    const localUpdatedAt = Math.floor(Number(mergedUpdatedAt[questionId]) || 0);
    const incomingUpdatedAtValue = Math.floor(Number(incomingTimes[questionId]) || 0);

    if (localHas && !localUpdatedAt) {
      if (incomingHas && incomingUpdatedAtValue && mergedValues[questionId] === incomingValues[questionId]) {
        mergedUpdatedAt[questionId] = incomingUpdatedAtValue;
      }
      return;
    }

    if (!incomingHas) {
      if (incomingUpdatedAtValue && incomingUpdatedAtValue > localUpdatedAt) {
        delete mergedValues[questionId];
        mergedUpdatedAt[questionId] = incomingUpdatedAtValue;
      }
      return;
    }

    if (!localHas) {
      mergedValues[questionId] = incomingValues[questionId];
      if (incomingUpdatedAtValue) mergedUpdatedAt[questionId] = incomingUpdatedAtValue;
      return;
    }

    if (incomingUpdatedAtValue && incomingUpdatedAtValue > localUpdatedAt) {
      mergedValues[questionId] = incomingValues[questionId];
      mergedUpdatedAt[questionId] = incomingUpdatedAtValue;
    }
  });

  return {
    values: mergedValues,
    updatedAt: mergedUpdatedAt,
  };
}

function answeredPositionTime(value) {
  const time = Date.parse(value?.answeredAt || "");
  return Number.isFinite(time) ? time : 0;
}

function mergeLastAnsweredPosition(incomingPosition, hasIncomingPosition) {
  if (!hasIncomingPosition) return;
  const currentPosition = loadLastAnsweredPosition();
  if (!incomingPosition) {
    if (!currentPosition) saveLastAnsweredPositionPayload(null);
    return;
  }
  if (!currentPosition || answeredPositionTime(incomingPosition) >= answeredPositionTime(currentPosition)) {
    saveLastAnsweredPositionPayload(incomingPosition);
  }
}

function mergeStudyBackupPayload(payload) {
  const normalized = normalizeStudyBackupPayload(payload);
  const progressBefore = Object.keys(state.progress).length;
  const studyLogBefore = state.studyLog.length;
  const understandingBefore = Object.keys(normalizeUnderstandingMap(state.understanding)).length;
  const calculationBefore = Object.keys(normalizeQuestionFlagMap(state.calculationQuestions)).length;
  const reviewHistoryBefore = state.reviewSessionHistory.length;

  state.progress = mergeProgress(state.progress, normalized.progress);
  state.studyLog = mergeStudyLogs(state.studyLog, normalized.studyLog);
  state.reviewSessionHistory = mergeReviewSessionHistory(state.reviewSessionHistory, normalized.reviewSessionHistory);
  const mergedUnderstanding = mergeTimestampedMap(
    normalizeUnderstandingMap(state.understanding),
    normalized.understanding,
    state.understandingUpdatedAt,
    normalized.understandingUpdatedAt
  );
  const mergedCalculationQuestions = mergeTimestampedMap(
    normalizeQuestionFlagMap(state.calculationQuestions),
    normalized.calculationQuestions,
    state.calculationQuestionsUpdatedAt,
    normalized.calculationQuestionsUpdatedAt
  );
  state.understanding = normalizeUnderstandingMap(mergedUnderstanding.values);
  state.understandingUpdatedAt = normalizeTimestampMap(mergedUnderstanding.updatedAt);
  state.calculationQuestions = normalizeQuestionFlagMap(mergedCalculationQuestions.values);
  state.calculationQuestionsUpdatedAt = normalizeTimestampMap(mergedCalculationQuestions.updatedAt);
  if (normalized.hasReviewTargetCourseIds) {
    state.reviewTargetCourseIds = normalizeReviewTargetCourseIds(normalized.reviewTargetCourseIds, { fallbackToDefault: false });
  }
  if (normalized.hasReviewSession) {
    state.reviewSession = normalizeReviewSession(normalized.reviewSession);
  }

  saveProgress();
  saveStudyLog();
  saveUnderstandingUpdatedAt();
  saveUnderstanding();
  saveCalculationQuestionsUpdatedAt();
  saveCalculationQuestions();
  saveReviewSessionHistory();
  if (normalized.hasReviewTargetCourseIds) saveReviewTargetCourseIds();
  if (normalized.hasReviewSession) saveReviewSession(state.reviewSession);
  mergeLastAnsweredPosition(normalized.lastAnsweredPosition, normalized.hasLastAnsweredPosition);

  return {
    progressAdded: Math.max(0, Object.keys(state.progress).length - progressBefore),
    progressTotal: Object.keys(state.progress).length,
    studyLogAdded: Math.max(0, state.studyLog.length - studyLogBefore),
    studyLogTotal: state.studyLog.length,
    understandingAdded: Math.max(
      0,
      Object.keys(normalizeUnderstandingMap(state.understanding)).length - understandingBefore
    ),
    calculationAdded: Math.max(
      0,
      Object.keys(normalizeQuestionFlagMap(state.calculationQuestions)).length - calculationBefore
    ),
    reviewSessionHistoryAdded: Math.max(0, state.reviewSessionHistory.length - reviewHistoryBefore),
    reviewSessionHistoryTotal: state.reviewSessionHistory.length,
  };
}

async function importStudyBackupFile(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const normalized = normalizeStudyBackupPayload(payload);
    const hasPayload =
      Object.keys(normalized.progress).length > 0 ||
      normalized.studyLog.length > 0 ||
      Object.keys(normalized.understanding).length > 0 ||
      Object.keys(normalized.calculationQuestions).length > 0 ||
      normalized.reviewSessionHistory.length > 0;
    if (!hasPayload) throw new Error("バックアップに読み込める履歴がありません。");
    commitRunningStudyTime();
    const result = mergeStudyBackupPayload(payload);
    render();
    renderStudyTime();
    showStudyBackupStatus(`読込: 履歴${result.progressTotal}件 / 受講${result.studyLogTotal}件 / 復習${result.reviewSessionHistoryTotal}回`);
  } catch (error) {
    showStudyBackupStatus(`読込失敗: ${error?.message || "JSONを確認してください"}`, true);
  } finally {
    if (els.studyBackupInput) els.studyBackupInput.value = "";
  }
}

function showStudyBackupStatus(message, error = false) {
  if (!els.studyBackupStatus) return;
  window.clearTimeout(studyBackupStatusTimer);
  els.studyBackupStatus.textContent = message;
  els.studyBackupStatus.classList.toggle("error", error);
  els.studyBackupStatus.classList.add("show");
  studyBackupStatusTimer = window.setTimeout(() => {
    els.studyBackupStatus.classList.remove("show", "error");
  }, 4200);
}

function startStudyTimeTicker() {
  if (studyTimeHandle) return;
  renderStudyTime();
  studyTimeHandle = window.setInterval(renderStudyTime, STUDY_TIME_TICK_MS);
}

function loadTimerEnabled() {
  try {
    return localStorage.getItem(TIMER_ENABLED_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function saveTimerEnabled(value) {
  state.timerEnabled = Boolean(value);
  localStorage.setItem(TIMER_ENABLED_STORAGE_KEY, String(state.timerEnabled));
}

function loadSectionLoopMode() {
  try {
    return localStorage.getItem(SECTION_LOOP_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveSectionLoopMode(value) {
  state.sectionLoopMode = Boolean(value);
  localStorage.setItem(SECTION_LOOP_STORAGE_KEY, String(state.sectionLoopMode));
}

function loadOptionShuffleMode() {
  try {
    return localStorage.getItem(OPTION_SHUFFLE_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function saveOptionShuffleMode(value) {
  state.optionShuffleMode = Boolean(value);
  localStorage.setItem(OPTION_SHUFFLE_STORAGE_KEY, String(state.optionShuffleMode));
}

function loadWheelMode() {
  try {
    return localStorage.getItem(WHEEL_MODE_STORAGE_KEY) === "scroll" ? "scroll" : "page";
  } catch {
    return "page";
  }
}

function saveWheelMode(value) {
  state.wheelMode = value === "scroll" ? "scroll" : "page";
  localStorage.setItem(WHEEL_MODE_STORAGE_KEY, state.wheelMode);
}

function loadCollapsedChapterCategories() {
  try {
    const raw = localStorage.getItem(CHAPTER_CATEGORY_STORAGE_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(values) ? values.filter((value) => typeof value === "string") : []);
  } catch {
    return new Set();
  }
}

function loadExpandedChapterCategories() {
  try {
    const raw = localStorage.getItem(CHAPTER_CATEGORY_EXPANDED_STORAGE_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(values) ? values.filter((value) => typeof value === "string") : []);
  } catch {
    return new Set();
  }
}

function saveCollapsedChapterCategories() {
  try {
    localStorage.setItem(
      CHAPTER_CATEGORY_STORAGE_KEY,
      JSON.stringify([...state.collapsedChapterCategories])
    );
    localStorage.setItem(
      CHAPTER_CATEGORY_EXPANDED_STORAGE_KEY,
      JSON.stringify([...state.expandedChapterCategories])
    );
  } catch {
    // Ignore storage failures; the menu still works for the current session.
  }
}

function courseManifest(courseId = state.courseId) {
  return data.courses.find((item) => item.id === courseId);
}

function isCourseLoaded(courseId = state.courseId) {
  return Boolean(courseDataStore[courseId]?.chapters?.length);
}

function loadedCourses() {
  return data.courses
    .map((item) => courseDataStore[item.id])
    .filter((item) => item?.chapters?.length);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadStylesheet(src) {
  const href = new URL(src, location.href).href;
  const existing = [...document.styleSheets].find((sheet) => sheet.href === href);
  if (existing) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${href}`));
    document.head.appendChild(link);
  });
}

function ensureMathRuntimeLoaded() {
  if (window.renderMathInElement && window.QuizGraphingCalculator?.create) {
    return Promise.resolve();
  }
  if (!mathRuntimePromise) {
    mathRuntimePromise = (async () => {
      const stylesheetPromise = loadStylesheet(MATH_RUNTIME_ASSETS.stylesheet);
      if (!window.katex) await loadScript(MATH_RUNTIME_ASSETS.katex);
      if (!window.renderMathInElement) await loadScript(MATH_RUNTIME_ASSETS.autoRender);
      if (!window.QuizGraphingCalculator?.create) await loadScript(MATH_RUNTIME_ASSETS.graphing);
      await stylesheetPromise;
    })().catch((error) => {
      mathRuntimePromise = null;
      throw error;
    });
  }
  return mathRuntimePromise;
}

function defineLazyQuestionField(question, key, factory) {
  if (Object.hasOwn(question, key)) return;
  Object.defineProperty(question, key, {
    configurable: true,
    enumerable: true,
    get() {
      const value = factory();
      Object.defineProperty(question, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
      return value;
    },
  });
}

function prepareCompactCourseData(courseItem) {
  if (!courseItem?._compactTextFields || courseItem._compactTextFieldsReady) return;
  courseItem.chapters?.forEach((chapterItem) => {
    chapterItem.questions?.forEach((question) => {
      if (question.promptHtml) {
        defineLazyQuestionField(question, "prompt", () => htmlToClipboardText(question.promptHtml));
      }
      if (question.explanationHtml) {
        defineLazyQuestionField(question, "explanation", () =>
          htmlToClipboardText(question.explanationHtml)
        );
      }
      if (
        Array.isArray(question.optionsHtml) &&
        question.optionsHtml.length > 0 &&
        question.optionsHtml.every((option) => typeof option === "string" && option.trim())
      ) {
        defineLazyQuestionField(question, "options", () =>
          question.optionsHtml.map((option) => htmlToClipboardText(option))
        );
      }
    });
  });
  Object.defineProperty(courseItem, "_compactTextFieldsReady", {
    configurable: true,
    value: true,
  });
}

function courseAssetUrl(courseItem) {
  const asset =
    LITE_MODE && courseItem.mobileAsset
      ? courseItem.mobileAsset
      : courseItem.asset || `./data/courses/${courseItem.id}.js`;
  const url = new URL(asset, location.href);
  const version = courseItem.assetVersion || data.assetVersion || COURSE_ASSET_VERSION;
  if (version) url.searchParams.set("v", version);
  return url.href;
}

async function ensureCourseLoaded(courseId = state.courseId) {
  if (isCourseLoaded(courseId)) {
    const courseItem = courseDataStore[courseId];
    prepareCompactCourseData(courseItem);
    if (MATH_RUNTIME_COURSE_IDS.has(courseId)) await ensureMathRuntimeLoaded();
    migrateProgressAnswersForCourse(courseItem);
    return courseItem;
  }
  const manifest = courseManifest(courseId);
  if (!manifest) throw new Error(`Unknown course: ${courseId}`);
  if (!courseLoadPromises.has(courseId)) {
    courseLoadPromises.set(
      courseId,
      loadScript(courseAssetUrl(manifest)).then(async () => {
        if (!isCourseLoaded(courseId)) throw new Error(`Course payload missing: ${courseId}`);
        const courseItem = courseDataStore[courseId];
        prepareCompactCourseData(courseItem);
        if (MATH_RUNTIME_COURSE_IDS.has(courseId)) await ensureMathRuntimeLoaded();
        migrateProgressAnswersForCourse(courseItem);
        return courseItem;
      })
    );
  }
  return courseLoadPromises.get(courseId);
}

function course() {
  return courseDataStore[state.courseId] || courseManifest(state.courseId);
}

function chapter() {
  return state.virtualChapter || course().chapters[state.chapterIndex] || course().chapters[0];
}

function kougaiQuestionFrequencyInfo(question) {
  if (state.courseId !== KOUGAI_MANAGER_COURSE_ID || !question) return null;
  const count = Number(question.occurrenceCount);
  if (!Number.isInteger(count) || count < 1) return null;
  const sharedHistory = question.occurrenceGroupId
    ? course()?.occurrenceGroups?.[question.occurrenceGroupId]
    : null;
  const sourceHistory = Array.isArray(sharedHistory)
    ? sharedHistory
    : [
        {
          id: question.id,
          year: question.sourceYear,
          questionNumber: question.sourceIndex,
        },
      ];
  const history = sourceHistory
        .map((entry) => ({
          id: String(entry?.id || "").trim(),
          year: String(entry?.year || "").trim(),
          questionNumber: Number(entry?.questionNumber),
        }))
        .filter((entry) => entry.id || entry.year || Number.isInteger(entry.questionNumber));
  return { count, history };
}

function kougaiQuestionFrequencyTitle(info) {
  if (!info) return "";
  return `同一問題がこのセクションで累計${info.count}回出題`;
}

function setKougaiQuestionFrequencyDetailsOpen(open) {
  if (!els.questionFrequencyBadge || !els.questionFrequencyDetails) return;
  const shouldOpen = Boolean(open && els.questionFrequencyDetails.childElementCount);
  els.questionFrequencyBadge.setAttribute("aria-expanded", String(shouldOpen));
  els.questionFrequencyDetails.classList.toggle("hidden", !shouldOpen);
}

function jumpToKougaiQuestion(questionId) {
  if (state.courseId !== KOUGAI_MANAGER_COURSE_ID || !questionId) return;
  const targetChapterIndex = course().chapters.findIndex((chapterItem) =>
    chapterItem.questions?.some((question) => question.id === questionId)
  );
  if (targetChapterIndex < 0) return;
  selectChapter(targetChapterIndex, questionId);
}

function renderKougaiQuestionFrequencyDetails(info) {
  if (!els.questionFrequencyDetails) return;
  els.questionFrequencyDetails.innerHTML = "";
  if (!info?.history?.length) return;

  const heading = document.createElement("div");
  heading.className = "question-frequency-details-head";
  const title = document.createElement("strong");
  title.textContent = "同一問題の出題履歴";
  const count = document.createElement("span");
  count.textContent = `${info.history.length}件`;
  heading.append(title, count);

  const list = document.createElement("ol");
  list.className = "question-frequency-history";
  info.history.forEach((entry) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.questionId = entry.id;
    button.title = `${entry.year || "年度不明"} ${
      Number.isInteger(entry.questionNumber) ? `問${entry.questionNumber}` : "問番号不明"
    }へ移動`;
    const year = document.createElement("span");
    year.textContent = entry.year || "年度不明";
    const questionNumber = document.createElement("strong");
    questionNumber.textContent = Number.isInteger(entry.questionNumber)
      ? `問${entry.questionNumber}`
      : "問番号不明";
    button.append(year, questionNumber);
    button.addEventListener("click", () => jumpToKougaiQuestion(entry.id));
    item.appendChild(button);
    list.appendChild(item);
  });

  els.questionFrequencyDetails.append(heading, list);
}

function renderKougaiQuestionFrequency(question) {
  if (!els.questionFrequencyBadge) return;
  setKougaiQuestionFrequencyDetailsOpen(false);
  const info = kougaiQuestionFrequencyInfo(question);
  const visible = Boolean(info);
  els.questionFrequencyBadge.classList.toggle("hidden", !visible);
  if (!visible) {
    els.questionFrequencyBadge.classList.remove("frequent");
    els.questionFrequencyBadge.textContent = "";
    els.questionFrequencyBadge.removeAttribute("title");
    els.questionFrequencyBadge.removeAttribute("aria-label");
    if (els.questionFrequencyDetails) els.questionFrequencyDetails.innerHTML = "";
    return;
  }
  const frequent = info.count >= KOUGAI_FREQUENT_QUESTION_THRESHOLD;
  els.questionFrequencyBadge.classList.toggle("frequent", frequent);
  els.questionFrequencyBadge.textContent = `${frequent ? "頻出 · " : ""}累計出題 ${info.count}回`;
  const title = kougaiQuestionFrequencyTitle(info);
  els.questionFrequencyBadge.title = title;
  els.questionFrequencyBadge.setAttribute("aria-label", `${title}。押すと出題履歴を表示`);
  renderKougaiQuestionFrequencyDetails(info);
}

function chapterQuestionSet(chapterItem = chapter(), orderedQuestions = chapterItem.questions) {
  const bestByIdentity = new Map();
  chapterItem.questions.forEach((question) => {
    const key = questionIdentityKey(question);
    const current = bestByIdentity.get(key);
    if (!current || questionRepresentativeRank(question) < questionRepresentativeRank(current)) {
      bestByIdentity.set(key, question);
    }
  });

  const seen = new Set();
  const unique = [];
  orderedQuestions.forEach((question) => {
    if (!question) return;
    const key = questionIdentityKey(question);
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(bestByIdentity.get(key) || question);
  });
  return unique;
}

function questionIdentityKey(question) {
  if (String(question?.id || "").startsWith("pe-first-info-")) return `id:${question.id}`;
  if (String(question?.id || "").startsWith("kougai-manager-")) return `id:${question.id}`;
  if (Number.isInteger(question?.sourceIndex)) return `source:${question.sourceIndex}`;
  return `prompt:${cleanText(question?.prompt || "")}`;
}

function questionRepresentativeRank(question) {
  if (question?.unitCheck || question?.variant === "source") return 0;
  if (question?.variant === "reverse") return 1;
  if (question?.variant === "explanation") return 2;
  if (question?.variant === "review") return 3;
  return 4;
}

function totalVisibleQuestionCount() {
  return data.courses.reduce((courseSum, courseItem) => {
    const loadedCourse = courseDataStore[courseItem.id];
    if (!loadedCourse?.chapters) return courseSum + Number(courseItem.visibleQuestionCount || courseItem.questionCount || 0);
    return courseSum + loadedCourse.chapters.reduce(
      (chapterSum, chapterItem) => chapterSum + chapterQuestionSet(chapterItem).length,
      0
    );
  }, 0);
}

function visibleQuestions() {
  let unique = orderedSectionQuestions();
  unique = filterQuestionsBySectionSearch(unique);
  if (state.favoriteMode) return unique.filter((question) => !isFullyUnderstoodQuestion(question));
  if (state.calculationMode) return unique.filter((question) => isCalculationQuestion(question));
  if (state.nonCalculationMode) return unique.filter((question) => !isCalculationQuestion(question));
  if (state.unansweredMode) return unique.filter((question) => !isSolvedQuestion(question));
  if (state.followUpMode) return unique.filter((question) => progressFor(question.id)?.followUp);
  return unique;
}

function orderedSectionQuestions() {
  const activeChapter = chapter();
  const questions = activeChapter.questions || [];
  const frequencySortActive = state.courseId === KOUGAI_MANAGER_COURSE_ID && state.frequencySortMode;
  const ordered = !frequencySortActive && state.order.length
    ? state.order.map((index) => questions[index])
    : questions;
  const unique = chapterQuestionSet(activeChapter, ordered);
  if (!frequencySortActive) return unique;
  return unique
    .map((question, index) => ({ question, index }))
    .sort((left, right) => {
      const countDifference = (Number(right.question?.occurrenceCount) || 1)
        - (Number(left.question?.occurrenceCount) || 1);
      return countDifference || left.index - right.index;
    })
    .map(({ question }) => question);
}

function normalizeSectionSearchQuery(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function sectionSearchTerms() {
  return normalizeSectionSearchQuery(state.sectionSearchQuery).split(" ").filter(Boolean);
}

function hasSectionSearchQuery() {
  return sectionSearchTerms().length > 0;
}

function filterQuestionsBySectionSearch(questions) {
  const terms = sectionSearchTerms();
  if (!terms.length) return questions;
  return questions.filter((question) => questionMatchesSectionSearch(question, terms));
}

function questionMatchesSectionSearch(question, terms = sectionSearchTerms()) {
  if (!terms.length) return true;
  const text = searchableQuestionText(question);
  return terms.every((term) => text.includes(term));
}

function searchableQuestionText(question) {
  const source = sourceQuestionFor(question) || question;
  const parts = [
    question?.id,
    source?.id,
    question?.prompt,
    source?.prompt,
    htmlToClipboardText(question?.promptHtml),
    htmlToClipboardText(source?.promptHtml),
    question?.explanation,
    source?.explanation,
    htmlToClipboardText(question?.explanationHtml),
    htmlToClipboardText(source?.explanationHtml),
    question?.sourceSubject,
    source?.sourceSubject,
    question?.sourceField,
    source?.sourceField,
    ...(Array.isArray(question?.options) ? question.options : []),
    ...(Array.isArray(source?.options) ? source.options : []),
    ...(Array.isArray(question?.optionsHtml) ? question.optionsHtml.map(htmlToClipboardText) : []),
    ...(Array.isArray(source?.optionsHtml) ? source.optionsHtml.map(htmlToClipboardText) : []),
    ...(Array.isArray(question?.tags) ? question.tags : []),
    ...(Array.isArray(source?.tags) ? source.tags : []),
  ];
  return normalizeSectionSearchQuery(parts.filter(Boolean).join(" "));
}

function currentQuestion() {
  const questions = visibleQuestions();
  return questions[Math.min(state.questionIndex, questions.length - 1)];
}

function progressFor(questionId) {
  return state.progress[questionId] || null;
}

function isSolvedRecord(record) {
  return Boolean(lastAttempt(record)?.correct);
}

function isSolvedQuestion(question) {
  return isSolvedRecord(progressFor(question.id));
}

function understandingIdForQuestion(question) {
  return question?.id || "";
}

function explicitUnderstandingLevelForQuestion(question) {
  const understandingId = understandingIdForQuestion(question);
  if (!understandingId) return null;
  return normalizeUnderstandingLevel(state.understanding[understandingId]);
}

function understandingLevelForQuestion(question) {
  return explicitUnderstandingLevelForQuestion(question);
}

function understandingLabel(level) {
  return UNDERSTANDING_LABELS[normalizeUnderstandingLevel(level)] || UNDERSTANDING_UNRATED_LABEL;
}

function isFullyUnderstoodQuestion(question) {
  return ["complete", "worthless"].includes(understandingLevelForQuestion(question));
}

function isCalculationQuestion(question) {
  const questionId = understandingIdForQuestion(question);
  return Boolean(questionId && normalizeQuestionFlagMap(state.calculationQuestions)[questionId]);
}

function reviewSessionAllowsQuestion(question, session = state.reviewSession) {
  const config = normalizeReviewSession(session);
  return !config.excludeCalculation || !isCalculationQuestion(question);
}

function filterReviewSessionEntries(entries, session = state.reviewSession) {
  const source = Array.isArray(entries) ? entries : [];
  const config = normalizeReviewSession(session);
  if (!config.excludeCalculation) return source;
  return source.filter((entry) => reviewSessionAllowsQuestion(entry?.question, config));
}

function filterReviewSessionQuestions(questions, session = state.reviewSession) {
  const source = Array.isArray(questions) ? questions : [];
  const config = normalizeReviewSession(session);
  if (!config.excludeCalculation) return source;
  return source.filter((question) => reviewSessionAllowsQuestion(question, config));
}

function currentSectionCalculationQuestionCount() {
  return chapterQuestionSet(chapter()).filter((question) => isCalculationQuestion(question)).length;
}

function currentSectionNonCalculationQuestionCount() {
  return chapterQuestionSet(chapter()).filter((question) => !isCalculationQuestion(question)).length;
}

function setCurrentUnderstanding(level) {
  const question = currentQuestion();
  const understandingId = understandingIdForQuestion(question);
  if (!understandingId) return;
  const normalizedLevel = normalizeUnderstandingLevel(level);
  if (!normalizedLevel) return;
  const currentLevel = understandingLevelForQuestion(question);
  if (currentLevel === normalizedLevel) {
    delete state.understanding[understandingId];
  } else {
    state.understanding[understandingId] = normalizedLevel;
  }
  state.understandingUpdatedAt = normalizeTimestampMap(state.understandingUpdatedAt);
  state.understandingUpdatedAt[understandingId] = Date.now();
  saveUnderstandingUpdatedAt();
  saveUnderstanding();
  if (state.favoriteMode && isFullyUnderstoodQuestion(question)) {
    const questions = visibleQuestions();
    state.questionIndex = Math.min(state.questionIndex, Math.max(0, questions.length - 1));
    setRetakeForSelectedQuestion();
  }
  render();
}

function toggleCurrentCalculationQuestion() {
  const question = currentQuestion();
  const questionId = understandingIdForQuestion(question);
  if (!questionId) return;
  const calculationQuestions = normalizeQuestionFlagMap(state.calculationQuestions);
  if (calculationQuestions[questionId]) {
    delete calculationQuestions[questionId];
  } else {
    calculationQuestions[questionId] = true;
  }
  state.calculationQuestions = calculationQuestions;
  state.calculationQuestionsUpdatedAt = normalizeTimestampMap(state.calculationQuestionsUpdatedAt);
  state.calculationQuestionsUpdatedAt[questionId] = Date.now();
  saveCalculationQuestionsUpdatedAt();
  saveCalculationQuestions();
  if (
    (state.calculationMode && !isCalculationQuestion(question)) ||
    (state.nonCalculationMode && isCalculationQuestion(question))
  ) {
    const questions = visibleQuestions();
    state.questionIndex = Math.min(state.questionIndex, Math.max(0, questions.length - 1));
    setRetakeForSelectedQuestion();
  }
  render();
}

function normalizeProgress(progress) {
  return Object.fromEntries(
    Object.entries(progress || {})
      .map(([questionId, record]) => [questionId, normalizeRecord(record)])
      .filter(([, record]) => record)
  );
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") return null;
  if (Array.isArray(record.attempts)) {
    const attempts = record.attempts
      .filter((attempt) => attempt && Number.isInteger(attempt.choice))
      .map((attempt) => ({
        choice: attempt.choice,
        choiceKey: attempt.choiceKey || "",
        choiceLabel: attempt.choiceLabel || "",
        correct: Boolean(attempt.correct),
        format: attempt.format || "",
        timedOut: Boolean(attempt.timedOut),
        remaining: Number.isFinite(attempt.remaining) ? attempt.remaining : null,
        elapsed: Number.isFinite(attempt.elapsed) ? attempt.elapsed : null,
        timeLimitEnabled: attempt.timeLimitEnabled === false ? false : true,
        score: Number.isFinite(attempt.score) ? attempt.score : null,
        scoreRatio: Number.isFinite(attempt.scoreRatio) ? attempt.scoreRatio : null,
        answeredAt: attempt.answeredAt || new Date().toISOString(),
      }));
    if (!attempts.length) return null;
    return {
      attempts,
      followUp: Boolean(record.followUp),
      lastAnsweredAt: record.lastAnsweredAt || attempts[attempts.length - 1].answeredAt,
    };
  }
  if (Number.isInteger(record.choice)) {
    const attempt = {
      choice: record.choice,
      choiceKey: "",
      choiceLabel: "",
      correct: Boolean(record.correct),
      format: "",
      timedOut: false,
      remaining: null,
      elapsed: null,
      timeLimitEnabled: true,
      score: null,
      scoreRatio: null,
      answeredAt: record.answeredAt || new Date().toISOString(),
    };
    return {
      attempts: [attempt],
      followUp: !attempt.correct,
      lastAnsweredAt: attempt.answeredAt,
    };
  }
  return null;
}

function attemptsFor(record) {
  return record?.attempts || [];
}

function lastAttempt(record) {
  const attempts = attemptsFor(record);
  return attempts.length ? attempts[attempts.length - 1] : null;
}

function migrateProgressAnswersForCourse(courseItem) {
  if (!courseItem?.id || progressAnswerMigrationCourses.has(courseItem.id)) return false;
  progressAnswerMigrationCourses.add(courseItem.id);
  let changed = false;

  courseItem.chapters.forEach((chapterItem) => {
    chapterQuestionSet(chapterItem).forEach((question) => {
      const record = progressFor(question.id);
      if (!record?.attempts?.length) return;
      let recordChanged = false;
      record.attempts.forEach((attempt) => {
        const isCorrect = !attempt.timedOut && attemptMatchesCurrentAnswer(attempt, question);
        if (attempt.correct === isCorrect) return;
        attempt.correct = isCorrect;
        if (isCorrect) {
          const remaining = Number.isFinite(attempt.remaining)
            ? Math.max(0, attempt.remaining)
            : TIMER_LIMIT;
          const scoreRatio = qmaScoreRatio("four", remaining);
          attempt.remaining = roundScore(remaining);
          attempt.scoreRatio = roundScore(scoreRatio);
          attempt.score = null;
        }
        recordChanged = true;
      });
      if (!recordChanged) return;
      const latest = lastAttempt(record);
      record.followUp = latest ? !latest.correct : false;
      changed = true;
    });
  });

  if (changed) saveProgress();
  return changed;
}

function attemptMatchesCurrentAnswer(attempt, question) {
  if (!attempt || !question || !Number.isInteger(question.answer)) return false;
  const answer = question.options?.[question.answer];
  if (answer == null) return false;
  const answerKeys = new Set([
    `${question.id}:answer`,
    `${question.id}:source:${question.answer}`,
    `${question.id}:option:${question.answer}`,
  ]);
  if (attempt.choiceKey && answerKeys.has(attempt.choiceKey)) return true;
  if (attempt.choice === question.answer) return true;
  return Boolean(attempt.choiceLabel && cleanText(attempt.choiceLabel) === cleanText(answer));
}

function reviewCurriculumVirtualKey(courseId) {
  return `${REVIEW_CURRICULUM_VIRTUAL_PREFIX}:${courseId}`;
}

function isReviewCurriculumChapter(chapterItem = chapter()) {
  return Boolean(chapterItem?.reviewCurriculum);
}

function isReviewCurriculumModeForCourse(courseId = state.courseId) {
  return state.courseId === courseId && isReviewCurriculumChapter(state.virtualChapter);
}

function reviewCorrectStreak(record) {
  const attempts = attemptsFor(record);
  let streak = 0;
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    const attempt = attempts[index];
    if (!attempt?.correct || attempt.timedOut) break;
    streak += 1;
  }
  return streak;
}

function reviewIntervalDaysForRecord(record) {
  const latest = lastAttempt(record);
  if (!latest || !latest.correct || latest.timedOut) return REVIEW_CURRICULUM_INTERVAL_DAYS[0];
  const streak = Math.max(1, reviewCorrectStreak(record));
  const index = Math.min(streak - 1, REVIEW_CURRICULUM_INTERVAL_DAYS.length - 1);
  return REVIEW_CURRICULUM_INTERVAL_DAYS[index];
}

function reviewDueDayForRecord(record) {
  const latest = lastAttempt(record);
  const answeredDay = localDayKeyFromDateValue(latest?.answeredAt);
  if (!answeredDay) return "";
  return addDaysToLocalDayKey(answeredDay, reviewIntervalDaysForRecord(record));
}

function reviewEntryStage(dueOffsetDays, dueInDays) {
  if (dueOffsetDays > 0) return "overdue";
  if (dueOffsetDays === 0) return "today";
  if (dueInDays <= 7) return "soon";
  return "future";
}

function reviewCurriculumEntriesForCourse(courseItem, todayKey = localDayKey()) {
  if (!courseItem?.chapters?.length) return [];
  const entries = [];
  courseItem.chapters.forEach((chapterItem, chapterIndex) => {
    chapterQuestionSet(chapterItem).forEach((question) => {
      const record = progressFor(question.id);
      const latest = lastAttempt(record);
      if (!latest) return;
      const answeredDay = localDayKeyFromDateValue(latest.answeredAt);
      const dueDay = reviewDueDayForRecord(record);
      if (!dueDay) return;
      const dueOffsetDays = localDayDiff(dueDay, todayKey);
      const dueInDays = localDayDiff(todayKey, dueDay);
      const daysSinceAnswered = Math.max(0, localDayDiff(answeredDay, todayKey));
      const intervalDays = reviewIntervalDaysForRecord(record);
      const retentionPercent = forgettingRetentionPercent(daysSinceAnswered);
      entries.push({
        courseId: courseItem.id,
        courseName: courseItem.name,
        chapterItem,
        chapterIndex,
        question,
        record,
        latest,
        answeredDay,
        daysSinceAnswered,
        intervalDays,
        retentionPercent,
        dueDay,
        due: dueOffsetDays >= 0,
        dueOffsetDays,
        dueInDays,
        overdue: dueOffsetDays > 0,
        stage: reviewEntryStage(dueOffsetDays, dueInDays),
        correctStreak: reviewCorrectStreak(record),
        latestWrong: !latest.correct || latest.timedOut,
        scoreRatio: Number.isFinite(Number(latest.scoreRatio)) ? Number(latest.scoreRatio) : 1,
      });
    });
  });
  return entries;
}

function isWeakReviewEntry(entry) {
  if (!entry) return false;
  return Boolean(entry.latestWrong) || Number(entry.scoreRatio) < 0.8 || Number(entry.correctStreak) === 0;
}

function isSmartReviewEntry(entry) {
  if (!entry) return false;
  return (
    entry.due ||
    isWeakReviewEntry(entry) ||
    Number(entry.retentionPercent) <= 72 ||
    (Number(entry.dueInDays) >= 0 && Number(entry.dueInDays) <= 7)
  );
}

function reviewSessionPriorityScore(entry) {
  if (!entry) return 0;
  const duePressure = entry.due
    ? 90 + Math.max(0, Number(entry.dueOffsetDays) || 0) * 9
    : Math.max(0, 7 - Math.max(0, Number(entry.dueInDays) || 0)) * 3;
  const mistakePressure = entry.latestWrong ? 70 : 0;
  const scorePressure = Math.max(0, 1 - Math.max(0, Math.min(1, Number(entry.scoreRatio) || 0))) * 36;
  const retentionPressure = Math.max(0, 100 - Math.max(0, Math.min(100, Number(entry.retentionPercent) || 100))) * 0.55;
  const streakPressure = Math.max(0, 4 - Math.max(0, Number(entry.correctStreak) || 0)) * 4;
  return duePressure + mistakePressure + scorePressure + retentionPressure + streakPressure;
}

function compareReviewCurriculumEntries(a, b) {
  return (
    b.dueOffsetDays - a.dueOffsetDays ||
    Number(b.latestWrong) - Number(a.latestWrong) ||
    a.correctStreak - b.correctStreak ||
    a.scoreRatio - b.scoreRatio ||
    String(a.dueDay).localeCompare(String(b.dueDay)) ||
    Date.parse(a.latest?.answeredAt || 0) - Date.parse(b.latest?.answeredAt || 0) ||
    String(a.question?.id || "").localeCompare(String(b.question?.id || ""))
  );
}

function compareReviewSessionPriorityEntries(a, b) {
  return (
    reviewSessionPriorityScore(b) - reviewSessionPriorityScore(a) ||
    Number(b.latestWrong) - Number(a.latestWrong) ||
    a.scoreRatio - b.scoreRatio ||
    a.correctStreak - b.correctStreak ||
    compareReviewCurriculumEntries(a, b)
  );
}

function compareWeakReviewEntries(a, b) {
  return (
    Number(b.latestWrong) - Number(a.latestWrong) ||
    a.scoreRatio - b.scoreRatio ||
    a.correctStreak - b.correctStreak ||
    Date.parse(b.latest?.answeredAt || 0) - Date.parse(a.latest?.answeredAt || 0) ||
    compareReviewCurriculumEntries(a, b)
  );
}

function reviewCurriculumSummaryForCourse(courseItem, todayKey = localDayKey()) {
  const entries = reviewCurriculumEntriesForCourse(courseItem, todayKey);
  const dueEntries = entries
    .filter((entry) => entry.due)
    .sort(compareReviewCurriculumEntries);
  const weakEntries = entries
    .filter(isWeakReviewEntry)
    .sort(compareWeakReviewEntries);
  const futureEntries = entries
    .filter((entry) => !entry.due)
    .sort((a, b) =>
      String(a.dueDay).localeCompare(String(b.dueDay)) ||
      String(a.question?.id || "").localeCompare(String(b.question?.id || ""))
    );
  return {
    courseId: courseItem.id,
    courseName: courseItem.name,
    entries,
    dueEntries: dueEntries.slice(0, REVIEW_CURRICULUM_LIMIT),
    weakEntries: weakEntries.slice(0, REVIEW_CURRICULUM_LIMIT),
    totalCount: entries.length,
    dueCount: dueEntries.length,
    weakCount: weakEntries.length,
    todayCount: dueEntries.filter((entry) => entry.dueDay === todayKey).length,
    overdueCount: dueEntries.filter((entry) => entry.overdue).length,
    futureCount: futureEntries.length,
    next7Count: futureEntries.filter((entry) => localDayDiff(todayKey, entry.dueDay) <= 7).length,
    nextDueDay: futureEntries[0]?.dueDay || "",
  };
}

function reviewCurriculumSummaries(todayKey = localDayKey()) {
  return reviewTargetCourseManifests().map((manifest) => {
    const courseItem = courseDataStore[manifest.id];
    if (!courseItem?.chapters?.length) {
      return {
        courseId: manifest.id,
        courseName: manifest.name,
        loading: reviewCurriculumLoadingCourses.has(manifest.id),
        failed: reviewCurriculumLoadFailedCourses.has(manifest.id),
        entries: [],
        dueEntries: [],
        weakEntries: [],
        totalCount: 0,
        dueCount: 0,
        weakCount: 0,
        todayCount: 0,
        overdueCount: 0,
        futureCount: 0,
        next7Count: 0,
        nextDueDay: "",
      };
    }
    return reviewCurriculumSummaryForCourse(courseItem, todayKey);
  });
}

function ensureReviewCurriculumCoursesLoaded() {
  reviewTargetCourseManifests().forEach((manifest) => {
    if (isCourseLoaded(manifest.id) || reviewCurriculumLoadingCourses.has(manifest.id)) return;
    if (reviewCurriculumLoadFailedCourses.has(manifest.id)) return;
    reviewCurriculumLoadingCourses.add(manifest.id);
    ensureCourseLoaded(manifest.id)
      .then(() => {
        reviewCurriculumLoadFailedCourses.delete(manifest.id);
      })
      .catch(() => {
        reviewCurriculumLoadFailedCourses.add(manifest.id);
      })
      .finally(() => {
        reviewCurriculumLoadingCourses.delete(manifest.id);
        renderReviewCurriculum();
      });
  });
}

function hasMistake(record) {
  return attemptsFor(record).some((attempt) => !attempt.correct);
}

function canAnswer(question) {
  const record = progressFor(question.id);
  const latest = lastAttempt(record);
  return !latest || state.retakeQuestionId === question.id;
}

function isWorkbookPageQuestion(question) {
  return question?.format === "workbook-page";
}

function shouldUseTimerForQuestion(question) {
  return Boolean(state.timerEnabled && !isWorkbookPageQuestion(question));
}

function shouldRetakeOnQuestionSelect(question) {
  return Boolean(question?.id && lastAttempt(progressFor(question.id)));
}

function setRetakeForSelectedQuestion(question = currentQuestion()) {
  state.retakeQuestionId = shouldRetakeOnQuestionSelect(question) ? question.id : null;
}

function answerText(question) {
  if (typeof question?.answerText === "string" && question.answerText.trim()) {
    return question.answerText;
  }
  return question?.options?.[question.answer] || "";
}

function sourceQuestionFor(question) {
  if (!Number.isInteger(question?.sourceIndex) || question.variant === "source") return question;
  return (
    chapter().questions.find(
      (item) => item.variant === "source" && item.sourceIndex === question.sourceIndex
    ) ||
    course()?.chapters
      ?.flatMap((chapterItem) => chapterItem.questions || [])
      .find((item) => item.variant === "source" && item.sourceIndex === question.sourceIndex) ||
    question
  );
}

function stripQuestionAttributionNotice(value) {
  const text = String(value || "");
  const markerIndex = text.indexOf("【出典・利用条件】");
  return markerIndex >= 0 ? text.slice(0, markerIndex).trimEnd() : text;
}

function safeQuestionSourceUrl(value) {
  try {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const url = new URL(raw, location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function questionAttribution(question) {
  if (!question) return null;
  const source = sourceQuestionFor(question) || question;
  const title = String(source.sourceTitle || question.sourceTitle || "").trim();
  if (!title || title === "ユーザー作成") return null;
  const ipa = /(?:^|\s|©\d{4}\s*)IPA(?:\s|\/|$)|情報処理推進機構/.test(title);
  const url = safeQuestionSourceUrl(source.sourceUrl || question.sourceUrl || (ipa ? IPA_USAGE_TERMS_URL : ""));
  const usage = ipa
    ? "IPA「試験問題等の利用について」に基づき掲載しています。再利用時はIPAの最新の利用条件を確認し、出典を明記し、改変した場合はその旨を表示してください。"
    : /CC0/i.test(title)
      ? "配布用に書き下ろした例題です。CC0 1.0 Universalの条件で利用できます。"
      : "教材に登録された出典・ライセンス情報です。再利用時はリンク先または権利者の条件を確認してください。";
  return { title, usage, url };
}

function closeQuestionSourceDialog() {
  if (!els.questionSourceDialog?.open) return;
  if (typeof els.questionSourceDialog.close === "function") els.questionSourceDialog.close();
  else els.questionSourceDialog.removeAttribute("open");
}

function openQuestionSourceDialog() {
  if (!els.questionSourceDialog || els.questionSourceButton?.hidden) return;
  if (typeof els.questionSourceDialog.showModal === "function") {
    if (!els.questionSourceDialog.open) els.questionSourceDialog.showModal();
  } else {
    els.questionSourceDialog.setAttribute("open", "");
  }
  els.questionSourceClose?.focus();
}

function renderQuestionSource(question) {
  if (!els.questionSourceButton) return;
  const detail = questionAttribution(question);
  const sourceKey = detail ? `${question.id}:${detail.title}` : "";
  if (els.questionSourceButton.dataset.sourceKey !== sourceKey) closeQuestionSourceDialog();
  els.questionSourceButton.dataset.sourceKey = sourceKey;
  els.questionSourceButton.hidden = !detail;
  if (!detail) return;

  if (els.questionSourceTitle) els.questionSourceTitle.textContent = detail.title;
  if (els.questionSourceUsage) els.questionSourceUsage.textContent = detail.usage;
  if (els.questionSourceExternal) {
    els.questionSourceExternal.hidden = !detail.url;
    if (detail.url) els.questionSourceExternal.href = detail.url;
  }
}

function promptText(question) {
  return maskAnswerInPrompt(sourceQuestionFor(question).prompt || question.prompt, answerText(question));
}

function explanationText(question) {
  return sourceQuestionFor(question).explanation || question.explanation;
}

function promptHtml(question) {
  return sourceQuestionFor(question).promptHtml || question.promptHtml || "";
}

function explanationHtml(question) {
  return sourceQuestionFor(question).explanationHtml || question.explanationHtml || "";
}

function feedbackBodyHtml(question, view, latest) {
  if (view.typing) {
    return `<p><strong>正答:</strong> ${escapeHtml(view.answerText)}</p>${plainTextHtml(explanationText(question))}`;
  }

  const html = explanationHtml(question);
  if (!html) return plainTextHtml(explanationText(question));
  return mainFeedbackExplanationHtml(html);
}

function plainTextHtml(value) {
  return escapeHtml(value).replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>");
}

function htmlToClipboardText(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  return normalizeClipboardText(template.content.textContent || "");
}

function normalizeClipboardText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitChoiceExplanationHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const explanations = extractSourceOptionExplanations(template);
  extractNumberedOptionExplanations(template, explanations);
  cleanupEmptyChoiceLists(template);
  return {
    explanations,
    mainHtml: template.innerHTML.trim(),
  };
}

function mainFeedbackExplanationHtml(html) {
  const { explanations, mainHtml } = splitChoiceExplanationHtml(html);
  if (!explanations.size) return html;
  return mainHtml
    ? `<div class="feedback-main-explanation"><div class="feedback-main-explanation-title">補足解説</div>${mainHtml}</div>`
    : "";
}

function sourceChoiceExplanations(question) {
  const html = explanationHtml(question);
  if (!html) return new Map();
  return splitChoiceExplanationHtml(html).explanations;
}

function sourceChoiceVerdicts(question, view, explanations) {
  const numberedVerdicts = numberedChoiceVerdicts(question);
  const verdicts = new Map();
  view.options.forEach((option) => {
    const sourceIndex = Number.isInteger(option.sourceIndex) ? option.sourceIndex : -1;
    if (sourceIndex < 0) return;
    const directVerdict = choiceVerdictFromText(htmlToClipboardText(explanations.get(sourceIndex) || ""), question);
    const verdict = directVerdict || numberedVerdicts.get(sourceIndex);
    if (verdict) verdicts.set(sourceIndex, verdict);
  });
  return verdicts;
}

function numberedChoiceVerdicts(question) {
  const text = String(explanationText(question) || "").replace(/\r/g, "");
  const segments = new Map();
  let currentIndex = -1;
  text.split(/\n+/).forEach((line) => {
    const match = line.match(/^\s*(?:[（(]([1-5])[）)]|([1-5])\s*[.．、])\s*(.*)$/u);
    if (match) {
      currentIndex = Number(match[1] || match[2]) - 1;
      segments.set(currentIndex, match[3] || "");
      return;
    }
    if (currentIndex >= 0) {
      segments.set(currentIndex, `${segments.get(currentIndex) || ""}\n${line}`);
    }
  });

  const verdicts = new Map();
  segments.forEach((segment, index) => {
    const verdict = choiceVerdictFromText(segment, question);
    if (verdict) verdicts.set(index, verdict);
  });
  return verdicts;
}

function choiceVerdictFromText(value, question) {
  const text = normalizeClipboardText(value);
  if (!text) return null;
  const head = text.slice(0, 360);
  const wrongLabel = /不適切|不適当|適切ではありません|適切でない|正しくありません|正しくない/.test(head)
    ? "不適切"
    : /^(?:誤|×|✕)(?:\s|。|です|$)|誤った記述です|誤りです|誤っています|本選択肢は誤|この記述が誤り|本記述が誤/.test(head)
      ? "誤り"
      : "";
  if (wrongLabel) {
    return {
      label: wrongLabel,
      kind: "wrong",
    };
  }

  const rightLabel = /適切な記述です|適切です|本選択肢は適切|本記述は適切/.test(head)
    ? "適切"
    : /^(?:正|○)(?:\s|。|です|$)|正しい記述です|正しいです|本選択肢は正しい|本記述は正しい/.test(head)
      ? "正しい"
      : "";
  if (rightLabel) {
    return {
      label: rightLabel,
      kind: "right",
    };
  }

  if (/この選択肢が正解|この選択肢は正解|本選択肢が正解|本選択肢は正解|正解です|正解となります/.test(head)) {
    return {
      label: isNegativeChoiceQuestion(question) ? "不適切" : "正解",
      kind: isNegativeChoiceQuestion(question) ? "wrong" : "answer",
    };
  }
  return null;
}

function isNegativeChoiceQuestion(question) {
  return /(?:最も|もっとも)?(?:不適切|不適当|適切でない|正しくない|誤っている|誤りである|妥当でない)/u.test(
    sourceQuestionFor(question)?.prompt || question?.prompt || ""
  );
}

function optionVerdictBadgeHtml(verdict) {
  if (!verdict) return "";
  return `<span class="option-verdict-badge ${escapeHtml(verdict.kind)}">${escapeHtml(verdict.label)}</span>`;
}

function hasSupplementalExplanation(question) {
  const html = explanationHtml(question);
  if (!html) return Boolean(cleanText(explanationText(question)));
  return Boolean(normalizeClipboardText(htmlToClipboardText(splitChoiceExplanationHtml(html).mainHtml || html)));
}

function hasVisibleChoiceExplanations(question, view) {
  if (!view?.options?.length || view.format === "judge") return false;
  const explanations = sourceChoiceExplanations(question);
  if (!explanations.size) return false;
  return view.options.some((option) => {
    const sourceIndex = Number.isInteger(option.sourceIndex) ? option.sourceIndex : -1;
    return explanations.has(sourceIndex);
  });
}

function choiceAlignedExplanationHtml(question, view, latest, html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const explanations = extractSourceOptionExplanations(template);
  const choiceCards = choiceExplanationCardsHtml(question, view, latest, explanations);
  if (!choiceCards) return html;

  cleanupEmptyChoiceLists(template);
  const mainHtml = template.innerHTML.trim();
  return `
    <section class="choice-explanations" aria-label="選択肢別解説">
      <div class="choice-explanations-title">選択肢別解説</div>
      ${choiceCards}
    </section>
    ${mainHtml ? `<div class="feedback-main-explanation"><div class="feedback-main-explanation-title">補足解説</div>${mainHtml}</div>` : ""}
  `;
}

function extractSourceOptionExplanations(template) {
  const explanations = new Map();
  template.content.querySelectorAll("li").forEach((item) => {
    const className = [...item.classList].find((name) =>
      SOURCE_OPTION_EXPLANATION_CLASS_INDEX.has(name)
    );
    if (!className) return;
    const sourceIndex = SOURCE_OPTION_EXPLANATION_CLASS_INDEX.get(className);
    const html = item.innerHTML.trim();
    if (html) {
      explanations.set(
        sourceIndex,
        explanations.has(sourceIndex) ? `${explanations.get(sourceIndex)}<br/>${html}` : html
      );
    }
    item.remove();
  });
  return explanations;
}

function cleanupEmptyChoiceLists(template) {
  template.content.querySelectorAll("ul, ol").forEach((list) => {
    if (!list.querySelector("li") && !list.textContent.trim() && !list.querySelector("img, table")) {
      list.remove();
    }
  });
}

function extractNumberedOptionExplanations(template, explanations) {
  let currentIndex = -1;
  template.content.querySelectorAll("p, li").forEach((item) => {
    const text = normalizeClipboardText(item.textContent || "");
    const match = text.match(/^\s*(?:[（(]([1-5])[）)]|([1-5])\s*[.．、])\s*/u);
    if (match) {
      currentIndex = Number(match[1] || match[2]) - 1;
      appendOptionExplanation(explanations, currentIndex, stripNumberedExplanationMarker(item.innerHTML));
      item.remove();
      return;
    }
    if (currentIndex < 0 || isSummaryExplanationParagraph(text)) return;
    appendOptionExplanation(explanations, currentIndex, item.innerHTML);
    item.remove();
  });
}

function stripNumberedExplanationMarker(html) {
  return String(html || "")
    .replace(/^\s*(?:[（(][1-5][）)]|[1-5]\s*[.．、])\s*/u, "")
    .replace(/^\s*[はもが]\s*/u, "")
    .trim();
}

function appendOptionExplanation(explanations, sourceIndex, html) {
  if (!Number.isInteger(sourceIndex) || sourceIndex < 0) return;
  const cleanHtml = String(html || "").trim();
  if (!cleanHtml) return;
  explanations.set(
    sourceIndex,
    explanations.has(sourceIndex) ? `${explanations.get(sourceIndex)}<p>${cleanHtml}</p>` : `<p>${cleanHtml}</p>`
  );
}

function isSummaryExplanationParagraph(text) {
  return /^(?:以上から|以上より|したがって|従って|よって|ゆえに|そのため、?正解|正解は)/u.test(
    String(text || "").trim()
  );
}

function choiceExplanationCardsHtml(question, view, latest, explanations) {
  if (!explanations.size || view.format === "judge" || !view.options?.length) return "";

  const cards = view.options
    .map((option, index) => {
      const sourceIndex = Number.isInteger(option.sourceIndex) ? option.sourceIndex : -1;
      const explanation = explanations.get(sourceIndex);
      if (!explanation) return "";
      return choiceExplanationCardHtml(question, view, latest, option, index, explanation);
    })
    .filter(Boolean);

  return cards.length >= 2 ? cards.join("") : "";
}

function choiceExplanationCardHtml(question, view, latest, option, index, explanation) {
  const selected = latest ? optionMatchesAttempt(option, latest) : false;
  const classes = [
    "choice-explanation-card",
    option.correct ? "correct" : "",
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const optionContent = option.html || escapeHtml(option.text);
  const badges = [
    option.correct ? '<span class="choice-explanation-badge correct">正解</span>' : "",
    selected ? '<span class="choice-explanation-badge selected">選択</span>' : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    <article class="${classes}">
      <div class="choice-explanation-head">
        <span class="choice-explanation-letter">${optionLetter(index, view.format)}</span>
        <span class="choice-explanation-option">${optionContent}</span>
        ${badges ? `<span class="choice-explanation-badges">${badges}</span>` : ""}
      </div>
      <div class="choice-explanation-body">${explanation}</div>
    </article>
  `;
}

function inlineOptionExplanationHtml(view, latest, option, index, explanations) {
  if (!explanations.size || view.format === "judge") return "";
  const sourceIndex = Number.isInteger(option.sourceIndex) ? option.sourceIndex : -1;
  const explanation = explanations.get(sourceIndex);
  if (!explanation) return "";
  const selected = latest ? optionMatchesAttempt(option, latest) : false;
  const classes = [
    "option-explanation-card",
    option.correct ? "correct" : "",
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="${classes}">
      <div class="option-explanation-body">${explanation}</div>
    </div>
  `;
}

function optionHtmlFor(question, index) {
  const source = sourceQuestionFor(question);
  return source.optionsHtml?.[index] || question.optionsHtml?.[index] || "";
}

function shouldHideDuplicateOptionText(question, view, option, labelText) {
  if (!view.optionLabels?.length || option.html) return false;
  if (cleanText(option.text) !== cleanText(labelText)) return false;
  const source = sourceQuestionFor(question);
  return Boolean(source.promptHtml && /class=["']pe-question-image["']/.test(source.promptHtml));
}

function maskAnswerInPrompt(prompt, answer) {
  const text = String(prompt || "");
  const key = String(answer || "").trim();
  if (!key) return text;
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(key)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const numericAnswer = new RegExp(`(^|[^0-9０-９.])${escapedKey}(?![0-9０-９.])`, "g");
    return text.replace(numericAnswer, "$1（　）");
  }
  return text.split(key).join("（　）");
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(items, seed) {
  const shuffled = [...items];
  let value = hashString(seed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    value = Math.imul(value ^ (value >>> 15), 2246822507) >>> 0;
    const swap = value % (index + 1);
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

function seededChoiceShuffle(options, seed) {
  const shuffled = seededShuffle(options, seed);
  if (
    shuffled.length > 1 &&
    shuffled.every((option, index) => option.key === options[index]?.key)
  ) {
    return [...shuffled.slice(1), shuffled[0]];
  }
  return shuffled;
}

function isTypableAnswer(value) {
  const compact = cleanText(value);
  const looksLikePhrase =
    /(という|こと|もの|ため|から|まで|より|による|について|として|できる|される|する|ない|ある|いる)/.test(
      compact
    ) || /[のをがにはへとで]/.test(compact);
  const hasPhrasePunctuation = /[。、，,・･→←⇒＝=／/（）()「」『』【】\[\]{}:：;；!?！？…]/.test(compact);
  return (
    compact.length >= 2 &&
    compact.length <= 12 &&
    /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9ー]+$/u.test(compact) &&
    !hasPhrasePunctuation &&
    !looksLikePhrase &&
    !compact.includes("説明")
  );
}

function formatFor(question) {
  return question.format === "typing" ? "typing" : "four";
}

function currentViewQuestion() {
  return buildViewQuestion(currentQuestion());
}

function buildViewQuestion(question) {
  const format = formatFor(question);
  const view = format === "workbook-page"
    ? workbookPageView(question)
    : format === "typing"
      ? typingView(question)
      : format === "association"
        ? associationView(question)
        : format === "judge"
          ? judgeView(question)
          : fourChoiceView(question);
  view.prompt = stripQuestionAttributionNotice(view.prompt);
  return view;
}

function fourChoiceView(question) {
  return {
    source: question,
    format: "four",
    formatLabel: `${question.options.length}択`,
    prompt: promptText(question),
    promptHtml: promptHtml(question),
    clues: [],
    options: choiceOptions(question, 5, "four"),
    optionLabels: question.optionLabels || null,
    typing: false,
    answerText: answerText(question),
  };
}

function workbookPageView(question) {
  return {
    source: question,
    format: "workbook-page",
    formatLabel: "問題集",
    prompt: question.prompt || "",
    promptHtml: promptHtml(question),
    clues: [],
    options: (question.options || []).map((text, index) => ({
      key: `${question.id}:self-check:${index}`,
      text,
      sourceIndex: index,
      correct: index === question.answer,
    })),
    optionLabels: question.optionLabels || ["OK", "MISS", "LATER"],
    typing: false,
    answerText: answerText(question),
  };
}

function associationView(question) {
  return {
    source: question,
    format: "association",
    formatLabel: "連想",
    prompt: promptText(question),
    promptHtml: promptHtml(question),
    clues: [],
    options: choiceOptions(question, 4, "association"),
    typing: false,
    answerText: answerText(question),
  };
}

function judgeView(question) {
  const truth = hashString(`${question.id}:judge`) % 2 === 0;
  const options = choiceOptions(question, 4, "judge-source");
  const wrong = options.find((option) => !option.correct) || options[1];
  const subject = truth ? answerText(question) : wrong.text;
  const judgeOptions = [
    {
      key: `${question.id}:judge:true`,
      text: "○ 正しい",
      sourceIndex: 1,
      correct: truth,
    },
    {
      key: `${question.id}:judge:false`,
      text: "× 誤り",
      sourceIndex: 0,
      correct: !truth,
    },
  ];
  return {
    source: question,
    format: "judge",
    formatLabel: "正誤",
    prompt: "次の説明は講義内容に合っている？",
    clues: [`「${subject}」は、${shortText(question.explanation, 118)}`],
    options: state.optionShuffleMode
      ? seededChoiceShuffle(judgeOptions, optionShuffleSeed(question, "judge-options"))
      : judgeOptions,
    typing: false,
    answerText: truth ? "○ 正しい" : "× 誤り",
  };
}

function typingView(question) {
  const answer = answerText(question);
  return {
    source: question,
    format: "typing",
    formatLabel: "タイピング",
    prompt: promptText(question),
    promptHtml: promptHtml(question),
    clues: [],
    options: [],
    typing: true,
    answerText: answer,
    typingHint: "用語を入力",
  };
}

function choiceOptions(question, count, salt) {
  // Never borrow answers from other questions or invent extra choices.
  const authored = question.options.map((text, index) => ({ key: `${question.id}:source:${index}`, text, html: optionHtmlFor(question, index), sourceIndex: index, correct: index === question.answer }));
  return state.optionShuffleMode ? seededChoiceShuffle(authored, optionShuffleSeed(question, `${salt}:source-final`)) : authored;
}

function legacyGeneratedChoiceOptions(question, count, salt) {
  const correct = {
    key: `${question.id}:answer`,
    text: answerText(question),
    html: optionHtmlFor(question, question.answer),
    sourceIndex: question.answer,
    correct: true,
  };

  if (shouldUseSourceOptions(question)) {
    const sourceOptions = question.options.map((text, index) => ({
      key: `${question.id}:source:${index}`,
      text,
      html: optionHtmlFor(question, index),
      sourceIndex: index,
      correct: index === question.answer,
    }));
    const completedOptions = completeChoiceOptions(sourceOptions, question, count);
    if (!state.optionShuffleMode) return completedOptions;
    return seededChoiceShuffle(completedOptions, optionShuffleSeed(question, `${salt}:source-final`));
  }

  const localWrongs = question.options
    .map((text, index) => ({
      key: `${question.id}:option:${index}`,
      text,
      html: optionHtmlFor(question, index),
      sourceIndex: index,
      correct: index === question.answer,
    }))
    .filter((option) => !option.correct);
  const smartWrongs = smartDistractors(question, correct.text).map((text, index) => ({
    key: `${question.id}:smart:${index}`,
    text,
    sourceIndex: -1,
    correct: false,
  }));
  const selectedWrongs = [];
  const seen = new Set([choiceMeaningKey(correct.text)]);

  seededShuffle(localWrongs, `${question.id}:${salt}:wrong`).forEach((option) => {
    if (selectedWrongs.length >= count - 1) return;
    if (!canUseDistractor(option, correct.text, seen, { strictCategory: false })) return;
    selectedWrongs.push(option);
    seen.add(choiceMeaningKey(option.text));
  });

  seededShuffle(smartWrongs, `${question.id}:${salt}:smart`).forEach((option) => {
    if (selectedWrongs.length >= count - 1) return;
    if (!canUseDistractor(option, correct.text, seen)) return;
    selectedWrongs.push(option);
    seen.add(choiceMeaningKey(option.text));
  });

  if (selectedWrongs.length < count - 1) {
    fallbackDistractorTiers(question).forEach((tier, tierIndex) => {
      if (selectedWrongs.length >= count - 1) return;
      seededShuffle(tier, `${question.id}:${salt}:fallback:${tierIndex}`).forEach((option) => {
        if (selectedWrongs.length >= count - 1) return;
        if (!canUseDistractor(option, correct.text, seen)) return;
        selectedWrongs.push(option);
        seen.add(choiceMeaningKey(option.text));
      });
    });
  }

  const completedOptions = completeChoiceOptions([correct, ...selectedWrongs.slice(0, count - 1)], question, count);
  if (!state.optionShuffleMode) return sourceOrderedOptions(completedOptions);
  return seededChoiceShuffle(completedOptions, optionShuffleSeed(question, `${salt}:final`));
}

function optionShuffleSeed(question, salt) {
  const attemptCount = progressFor(question.id)?.attempts?.length || 0;
  const round = canAnswer(question) ? attemptCount : Math.max(0, attemptCount - 1);
  return `${question.id}:${salt}:round:${round}`;
}

function sourceOrderedOptions(options) {
  return options
    .map((option, index) => ({ option, index }))
    .sort((left, right) => {
      const leftOrder = left.option.sourceIndex >= 0 ? left.option.sourceIndex : Number.MAX_SAFE_INTEGER;
      const rightOrder = right.option.sourceIndex >= 0 ? right.option.sourceIndex : Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.index - right.index;
    })
    .map(({ option }) => option);
}

function completeChoiceOptions(options, question, count) {
  const completed = [...options];
  const seen = new Set(completed.map((option) => choiceMeaningKey(option.text)));
  const fillers = [
    "上記のいずれでもない",
    "問題文の情報だけでは判断できない",
    "該当するものは複数ある",
    "選択肢の全てが該当する",
  ];
  fillers.forEach((text, index) => {
    if (completed.length >= count || seen.has(choiceMeaningKey(text))) return;
    completed.push({
      key: `${question.id}:five-choice-filler:${index}`,
      text,
      sourceIndex: -1,
      correct: false,
    });
    seen.add(choiceMeaningKey(text));
  });
  return completed.slice(0, count);
}

function shouldUseSourceOptions(question) {
  return Boolean(question?.unitCheck && Array.isArray(question.options) && question.options.length >= 3);
}

function smartDistractors(question, correctText) {
  const prompt = `${question?.prompt || ""} ${question?.explanation || ""}`;
  if (/^(約|およそ|おおよそ|凡そ)?[0-9０-９]+(万|億)?年前(以降)?$/.test(cleanText(correctText))) {
    return dateDistractors(correctText);
  }
  if (/3V|Volume|Variety|Velocity/.test(prompt) && /Victory|Vicroty/.test(correctText)) {
    return ["Volume：量", "Variety：多様性", "Velocity：速度", "Volume：データ量"];
  }
  if (/between\s*x\s*and\s*y|x以上y以下/i.test(prompt) && correctText === "x以上y以下") {
    return ["xより大きくyより小さい", "x以上y未満", "xより大きくy以下", "xまたはyのどちらかに等しい"];
  }
  if (/出力するレコード数を制限/.test(prompt) && correctText === "LIMIT") {
    return ["WHERE", "ORDER BY", "GROUP BY", "HAVING"];
  }
  if (correctText === "SELECT user_id, user_age FROM access_log;") {
    return [
      "SELECT DISTINCT user_id FROM access_log;",
      "SELECT user_id FROM access_log WHERE user_age >= 20;",
      "SELECT access_datetime, user_id FROM access_log ORDER BY access_datetime ASC;",
      "SELECT COUNT(1) FROM access_log;",
    ];
  }
  if (correctText === "SELECT DISTINCT user_id FROM access_log WHERE user_age >= 20;") {
    return [
      "SELECT DISTINCT user_id FROM access_log;",
      "SELECT user_id, user_age FROM access_log;",
      "SELECT access_datetime, user_id FROM access_log ORDER BY access_datetime ASC;",
      "SELECT user_id FROM access_log WHERE user_age < 20;",
    ];
  }
  if (/クロス集計/.test(prompt) && /2つの分析軸/.test(correctText)) {
    return [
      "1つの値を行ごとに変換すること",
      "複数行を1つの値に集約すること",
      "条件に合う行だけを抽出すること",
      "2つのクエリ結果を縦に結合すること",
    ];
  }
  if (/CSV.*JSON|JSON.*CSV/.test(prompt) && correctText === "半構造化データ") {
    return ["構造化データ", "非構造化データ", "生データ", "メタデータ"];
  }
  if (/ビッグデータ.*定義|定義.*ビッグデータ/.test(prompt) && /計算機\s*1\s*台/.test(correctText)) {
    return [
      "1台の計算機で十分処理できる小規模なデータ",
      "表計算ソフトで手作業管理できる範囲のデータ",
      "件数が100件を超えた時点で一律にビッグデータと呼ぶデータ",
      "必ずリアルタイムに更新され続けるデータ",
    ];
  }
  if (/スモールデータ.*特性/.test(prompt) && /リアルタイム性/.test(correctText)) {
    return ["アクセス性", "有益性", "実用性", "正確性"];
  }
  if (/スプリット・?ブレイン/.test(prompt) && /クラスター/.test(correctText)) {
    return [
      "クラスター全体が停止し、どのノードも処理を継続できない状態",
      "障害発生時に待機系へ正常に切り替わる状態",
      "処理負荷に応じてノード数を自動的に増減させる状態",
      "データを複数ノードへ分散保存して読み取りを高速化する状態",
    ];
  }
  if (/データクレンジング/.test(prompt) && /重複/.test(correctText)) {
    return [
      "欠損値を確認し、分析方針に沿って補完・除外を判断する",
      "表記ゆれや単位の違いを統一する",
      "明らかな入力ミスや異常値を確認する",
      "重複の原因を確認し、保持すべき正しいデータを選ぶ",
    ];
  }
  if (/データ民主化/.test(prompt) && /専門家/.test(correctText)) {
    return [
      "データ利用を専門部署だけに限定し、申請制で閲覧させること",
      "データを長期保存するためにバックアップを多重化すること",
      "分析基盤を廃止し、個人の表計算ファイルだけで管理すること",
      "公開せずにデータを暗号化して保管すること",
    ];
  }
  if (/予測的分析/.test(prompt) && /次に何が起きる/.test(correctText)) {
    return [
      "過去に何が起きたのかを集計して把握すること",
      "なぜそれが起きたのかを原因から分析すること",
      "望ましい結果のために何をすべきかを判断すること",
      "複数の観点から現状を可視化して比較すること",
    ];
  }
  if (/Gartner.*4\s*つの段階|記述的分析.*診断的分析.*予測的分析.*処方的分析/.test(prompt) && /多面的分析/.test(correctText)) {
    return ["記述的分析", "診断的分析", "予測的分析", "処方的分析"];
  }
  if (/データは新しい/.test(prompt) && correctText === "石油") {
    return ["金", "水", "電気", "空気"];
  }
  if (/PII/.test(prompt) && /メールアドレス/.test(correctText)) {
    return ["商品カテゴリ", "ブラウザ名", "OS名", "集計値"];
  }
  if (/分散処理の二大技術/.test(prompt) && /Hadoop/.test(correctText)) {
    return ["RDBMS", "Excel", "FTP", "SMTP"];
  }
  if (/データサイエンティスト.*スキル/.test(prompt) && /ハードウェア/.test(correctText)) {
    return ["数理統計・多変量解析", "データ可視化", "機械学習", "深層学習"];
  }
  if (/不適切|該当しない/.test(question?.prompt || "")) {
    return extractContrastTerms(question?.explanation || "", correctText);
  }
  return [];
}

function dateDistractors(correctText) {
  const correctKey = choiceMeaningKey(correctText);
  return ["約500年前", "約5000年前", "約5万年前", "約50万年前", "約500万年前", "約5000万年前"].filter(
    (item) => choiceMeaningKey(item) !== correctKey
  );
}

function extractContrastTerms(text, correctText) {
  const terms = [];
  const add = (value) => {
    const term = String(value || "")
      .replace(/^[0-9０-９]+[.．、\s]+/, "")
      .replace(/(です|である)$/, "")
      .replace(/[。．、,\s]+$/g, "")
      .trim();
    if (!term || term.includes(correctText) || correctText.includes(term)) return;
    if (term.length < 2 || term.length > 34) return;
    if (/正答|説明|選択肢|以下|こと$/.test(term)) return;
    terms.push(term);
  };

  [...String(text || "").matchAll(/「([^」]{2,34})」/g)].forEach((match) => add(match[1]));
  [...String(text || "").matchAll(/[0-9０-９]+[.．]\s*([^、。．,\s]{2,34})/g)].forEach((match) =>
    add(match[1])
  );
  return uniqueTextValues(terms);
}

function uniqueTextValues(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = choiceMeaningKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackDistractorTiers(question) {
  const currentCourse = course();
  const currentChapter = chapter();
  const sourceTiers = [
    currentChapter.questions,
    currentCourse.chapters.flatMap((item) => item.questions),
    loadedCourses().flatMap((item) => item.chapters).flatMap((item) => item.questions),
  ];
  const answerCategory = choiceCategory(answerText(question));
  const seenQuestionIds = new Set([question.id]);

  return sourceTiers.map((questions, tierIndex) => {
    const candidates = [];
    questions.forEach((item) => {
      if (seenQuestionIds.has(item.id)) return;
      seenQuestionIds.add(item.id);
      item.options.forEach((text, index) => {
        const candidateText = fallbackChoiceText(text, answerCategory);
        if (!candidateText || choiceCategory(candidateText) !== answerCategory) return;
        candidates.push({
          key: `${question.id}:fallback:${tierIndex}:${item.id}:${index}`,
          text: candidateText,
          sourceIndex: -1,
          correct: false,
        });
      });
    });
    return candidates;
  });
}

function canUseDistractor(option, correctText, seen, { strictCategory = true } = {}) {
  const key = choiceMeaningKey(option.text);
  const correctCategory = choiceCategory(correctText);
  const optionCategory = choiceCategory(option.text);
  if (!strictCategory) {
    return key && key !== choiceMeaningKey(correctText) && !seen.has(key);
  }
  if (correctCategory !== "numeric" && optionCategory === "numeric") return false;
  if (correctCategory === "numeric" && optionCategory !== "numeric") return false;
  return (
    key &&
    key !== choiceMeaningKey(correctText) &&
    optionCategory === correctCategory &&
    !seen.has(key)
  );
}

function choiceMeaningKey(value) {
  return cleanText(value)
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[,，]/g, "")
    .replace(/^(約|およそ|おおよそ|凡そ)/, "")
    .replace(/(程度|前後|ごろ|頃)$/, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function fallbackChoiceText(value, answerCategory) {
  const text = cleanText(value);
  if (answerCategory === "date") {
    return text.match(/^(約|およそ|おおよそ|凡そ)?[0-9０-９]+(万|億)?年前/)?.[0] || "";
  }
  return text;
}

function choiceCategory(value) {
  const text = cleanText(value);
  if (isNumericOnlyOption(text)) return "numeric";
  if (/^(約|およそ|おおよそ|凡そ)?[0-9０-９]+(万|億)?年前(以降)?$/.test(text)) return "date";
  if (hasPhraseShape(text)) return "phrase";
  if (/\d|[０-９]/.test(text) && /(年前|年|万|億|世紀|月|日|時間|分|秒|%|％|人|個|倍)/.test(text)) {
    return "numeric";
  }
  if (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9ー]+$/u.test(text) && text.length <= 14) return "term";
  return "phrase";
}

function isNumericOnlyOption(text) {
  return /^(約|およそ|おおよそ|凡そ)?[+\-−]?[0-9０-９]+(?:[.,．][0-9０-９]+)?(?:%|％|W|w|円|万円|億円|台|個|人|件|倍)?$/.test(
    text
  );
}

function hasPhraseShape(text) {
  return (
    text.length > 14 ||
    /(という|こと|もの|ため|から|まで|より|による|について|として|できる|される|する|ない|ある|いる|では|には|とは)/.test(
      text
    ) ||
    /[。、，,・･→←⇒＝=／/（）()「」『』【】\[\]{}:：;；!?！？…]/.test(text)
  );
}

function fullScoreForQuestion(chapterItem = chapter()) {
  const total = chapterQuestionSet(chapterItem).length || 1;
  return 100 / total;
}

function scoreForAttempt(attempt, question, chapterItem = chapter()) {
  if (!attempt?.correct) return 0;
  const fullScore = fullScoreForQuestion(chapterItem);
  if (Number.isFinite(attempt.scoreRatio)) {
    return fullScore * Math.max(0, Math.min(1, attempt.scoreRatio));
  }
  if (Number.isFinite(attempt.score)) {
    const storedScore = Math.max(0, attempt.score);
    if (Math.abs(storedScore - roundScore(fullScore)) < 0.0051) return fullScore;
    return Math.min(fullScore, storedScore);
  }
  return fullScore;
}

function formatScore(value) {
  const rounded = roundScore(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function qmaGreenRemaining(formatKey) {
  const base = QMA_GREEN_SECONDS[formatKey] || QMA_GREEN_SECONDS.four;
  return (base / QMA_REFERENCE_TIMER) * TIMER_LIMIT;
}

function qmaMinimumRemaining() {
  return (QMA_MIN_SECONDS / QMA_REFERENCE_TIMER) * TIMER_LIMIT;
}

function qmaScoreRatio(formatKey, remaining) {
  const greenRemaining = qmaGreenRemaining(formatKey);
  const minimumRemaining = qmaMinimumRemaining();
  if (remaining >= greenRemaining) return 1;
  if (remaining <= minimumRemaining) return QMA_MIN_SCORE_RATIO;
  const progress = (remaining - minimumRemaining) / (greenRemaining - minimumRemaining);
  return QMA_MIN_SCORE_RATIO + (1 - QMA_MIN_SCORE_RATIO) * progress;
}

function calculateAttemptScore({ correct, formatKey, remaining }) {
  if (!correct) {
    return {
      score: 0,
      scoreRatio: 0,
    };
  }
  const scoreRatio = qmaScoreRatio(formatKey, remaining);
  return {
    score: fullScoreForQuestion() * scoreRatio,
    scoreRatio,
  };
}

function roundScore(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function makeClues(question) {
  return [];
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function normalizeInput(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    );
}

function shortText(value, limit) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const maxLength = Math.max(0, Number(limit) || text.length);
  if (text.length <= maxLength) return text;
  if (maxLength <= 1) return text.slice(0, maxLength);
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function setAccent() {
  document.documentElement.style.setProperty("--active", course().accent);
  document.documentElement.dataset.course = state.courseId;
}

function renderCourses() {
  els.courseTabs.forEach((tab) => {
    const active = tab.dataset.course === state.courseId;
    tab.classList.toggle("active", active);
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(active));
    tab.style.setProperty("--active", course().accent);
    if (COMPLETED_COURSE_IDS.has(tab.dataset.course)) {
      tab.hidden = !state.completedCoursesOpen;
    }
  });
  const visibleCompletedCourses = els.completedCourseTabs.filter((tab) => !tab.hidden).length;
  if (els.completedCourseSwitch) els.completedCourseSwitch.hidden = visibleCompletedCourses === 0;
  if (els.completedCoursesToggle) {
    els.completedCoursesToggle.classList.toggle("active", state.completedCoursesOpen);
    els.completedCoursesToggle.setAttribute("aria-expanded", String(state.completedCoursesOpen));
    els.completedCoursesToggle.title = state.completedCoursesOpen ? "修了科目を閉じる" : "修了科目を表示";
  }
}

function chapterStats(chapterItem) {
  const questions = chapterQuestionSet(chapterItem);
  const total = questions.length;
  const answered = questions.filter((question) => isSolvedQuestion(question)).length;
  const correct = answered;
  const followUp = questions.filter((question) => progressFor(question.id)?.followUp).length;
  const attempts = questions.reduce(
    (sum, question) => sum + attemptsFor(progressFor(question.id)).length,
    0
  );
  const score = questions.reduce((sum, question) => {
    return sum + scoreForAttempt(lastAttempt(progressFor(question.id)), question, chapterItem);
  }, 0);
  return { total, answered, correct, followUp, attempts, score };
}

function shortPeFieldLabel(value) {
  return String(value || "")
    .replace(/に関するもの$/, "")
    .replace(/・/g, "・")
    .trim();
}

function slugifyPeField(value, fallbackIndex = 0) {
  return (
    {
      "設計・計画に関するもの": "design-plan",
      "情報・論理に関するもの": "info-logic",
      "解析に関するもの": "analysis",
      "材料・化学・バイオに関するもの": "material-chem-bio",
      "環境・エネルギー・技術に関するもの": "env-energy-tech",
    }[value] || `field-${fallbackIndex + 1}`
  );
}

function peFirstInfoFieldChapters(courseItem) {
  if (courseItem?.id !== "pe-first-info") return [];
  const fieldMap = new Map();
  courseItem.chapters
    .filter((chapterItem) => chapterItem.category === "fundamental")
    .forEach((chapterItem) => {
      chapterItem.questions.forEach((question) => {
        const field = question.sourceField || "未分類";
        if (!fieldMap.has(field)) fieldMap.set(field, []);
        fieldMap.get(field).push(question);
      });
    });

  const fields = [
    ...PE_FIRST_INFO_FUNDAMENTAL_FIELD_ORDER.filter((field) => fieldMap.has(field)),
    ...[...fieldMap.keys()].filter((field) => !PE_FIRST_INFO_FUNDAMENTAL_FIELD_ORDER.includes(field)),
  ];

  return fields.map((field, index) => ({
    chapterItem: {
      number: `C${index + 1}`,
      title: shortPeFieldLabel(field) || field,
      category: "fundamental-field",
      questions: fieldMap.get(field),
      virtual: true,
      virtualKey: `pe-first-info:fundamental-field:${slugifyPeField(field, index)}`,
      virtualLabel: "基礎カテゴリ",
      sourceField: field,
    },
    index: -1,
  }));
}

function peFirstInfoCategoryGroups(courseItem) {
  const chapterEntries = courseItem.chapters.map((chapterItem, index) => ({
    chapterItem: {
      ...chapterItem,
      examGroup: ["fundamental", "aptitude"].includes(chapterItem.category),
    },
    index,
  }));
  const fundamentalYearChapters = chapterEntries.filter(({ chapterItem }) => chapterItem.category === "fundamental");
  const aptitudeChapters = chapterEntries.filter(({ chapterItem }) => chapterItem.category === "aptitude");
  return [
    {
      id: "fundamental-year",
      label: "基礎科目（試験別）",
      unitLabel: "年度",
      chapters: fundamentalYearChapters,
    },
    {
      id: "fundamental-field",
      label: "基礎科目（カテゴリ別）",
      unitLabel: "カテゴリ",
      chapters: peFirstInfoFieldChapters(courseItem),
    },
    {
      id: "aptitude",
      label: "適性科目（試験別）",
      unitLabel: "年度",
      chapters: aptitudeChapters,
    },
  ].filter((category) => category.chapters.length);
}

function kougaiManagerYearChapters(courseItem) {
  if (courseItem?.id !== "kougai-manager") return [];
  const yearMap = new Map();
  courseItem.chapters.forEach((chapterItem) => {
    chapterItem.questions.forEach((question) => {
      const year = question.sourceYear || "年度未設定";
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year).push(question);
    });
  });

  return [...yearMap.entries()].map(([year, questions], index) => ({
    chapterItem: {
      number: `Y${index + 1}`,
      title: year,
      category: "kougai-years",
      questions,
      virtual: true,
      virtualKey: `kougai-manager:year:${slugifyPeField(year, index)}`,
      virtualLabel: "年度別",
    },
    index: -1,
  }));
}

function examYearNumberLabel(value, fallbackIndex = 0) {
  const text = String(value || "").trim();
  const eraMatch = text.match(/^(令和|平成|昭和)(元|\d+)年度(\(再\))?/);
  if (!eraMatch) return `T${fallbackIndex + 1}`;
  const era = { 令和: "R", 平成: "H", 昭和: "S" }[eraMatch[1]] || "T";
  const year = eraMatch[2] === "元" ? "1" : eraMatch[2];
  return `${era}${year}${eraMatch[3] ? "再" : ""}`;
}

function kougaiManagerExamCategories(courseItem) {
  if (courseItem?.id !== "kougai-manager") return [];
  return courseItem.chapters.map((subjectChapter, subjectIndex) => {
    const subject = subjectChapter.title || `科目${subjectIndex + 1}`;
    const yearMap = new Map();
    subjectChapter.questions.forEach((question) => {
      const year = question.sourceYear || "年度未設定";
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year).push(question);
    });
    const chapters = [...yearMap.entries()].map(([year, questions], yearIndex) => ({
      chapterItem: {
        id: `${subjectChapter.id}-exam-${yearIndex + 1}`,
        number: examYearNumberLabel(year, yearIndex),
        title: `${year} ${subject}`,
        menuTitle: year,
        category: "kougai-exams",
        questions,
        sourceQuestionCount: questions.length,
        virtual: true,
        virtualKey: `kougai-manager:exam:${subjectChapter.id}:${yearIndex + 1}`,
        virtualLabel: "試験別",
        examGroup: true,
        sourceSubject: subject,
        sourceYear: year,
      },
      index: -1,
    }));
    return {
      id: `kougai-exams-${subjectChapter.id}`,
      label: `${subject}（試験別）`,
      unitLabel: "回",
      defaultCollapsed: true,
      chapters,
    };
  });
}

function kougaiManagerCategoryGroups(courseItem) {
  const subjectChapters = courseItem.chapters.map((chapterItem, index) => ({ chapterItem, index }));
  return [
    {
      id: "kougai-subjects",
      label: "科目別",
      unitLabel: "科目",
      chapters: subjectChapters,
    },
    ...kougaiManagerExamCategories(courseItem),
    {
      id: "kougai-years",
      label: "年度別（全科目）",
      unitLabel: "年度",
      chapters: kougaiManagerYearChapters(courseItem),
      defaultCollapsed: true,
    },
  ].filter((category) => category.chapters.length);
}

function isExamProgressChapter(chapterItem) {
  return Boolean(chapterItem?.examGroup) || String(chapterItem?.id || "").startsWith("ipa-practice-");
}

function localExamCategoryGroups(courseItem) {
  const entries = courseItem.chapters.map((chapterItem, index) => ({ chapterItem, index }));
  const exams = entries.filter(({ chapterItem }) => isExamProgressChapter(chapterItem));
  if (!exams.length) return [];
  return [
    { id: `${courseItem.id}:study`, label: "分野別・学習用", unitLabel: "分野", chapters: entries.filter(({ chapterItem }) => !isExamProgressChapter(chapterItem)) },
    { id: `${courseItem.id}:exams`, label: "試験別・年度別", unitLabel: "回", defaultCollapsed: true, chapters: exams },
  ].filter((category) => category.chapters.length);
}

function categoryGroupsForCourse(courseItem = course()) {
  if (courseItem.id === "pe-first-info") return peFirstInfoCategoryGroups(courseItem);
  if (courseItem.id === "kougai-manager") return kougaiManagerCategoryGroups(courseItem);
  if (Array.isArray(courseItem.chapterCategories) && courseItem.chapterCategories.length) {
    return courseItem.chapterCategories
      .map((category) => ({
        ...category,
        roadmapItems: Array.isArray(category.roadmapItems) ? category.roadmapItems : [],
        chapters: courseItem.chapters
          .map((chapterItem, index) => ({ chapterItem, index }))
          .filter(({ chapterItem }) => chapterItem.category === category.id),
      }))
      .filter((category) => category.chapters.length || category.roadmapItems.length);
  }
  const localExamGroups = localExamCategoryGroups(courseItem);
  if (localExamGroups.length) return localExamGroups;
  if (courseItem.id !== "advanced-am1") return [];
  const chaptersByNumber = new Map(
    courseItem.chapters.map((chapterItem, index) => [Number(chapterItem.number), { chapterItem, index }])
  );
  return ADVANCED_AM1_CATEGORIES.map((category) => ({
    ...category,
    chapters: category.chapterNumbers
      .map((number) => chaptersByNumber.get(number))
      .filter(Boolean),
  })).filter((category) => category.chapters.length);
}

function defaultVirtualChapterEntry(courseId = state.courseId) {
  const key = DEFAULT_VIRTUAL_CHAPTER_KEYS[courseId];
  const courseItem = courseDataStore[courseId];
  if (!key || !courseItem?.chapters?.length) return null;
  return categoryGroupsForCourse(courseItem)
    .flatMap((category) => category.chapters)
    .find(({ chapterItem }) => chapterItem?.virtualKey === key) || null;
}

function applyDefaultChapterForCourse(courseId = state.courseId) {
  if (courseId !== state.courseId) return;
  const entry = defaultVirtualChapterEntry(courseId);
  if (!entry) return;
  const expandedCategories = DEFAULT_EXPANDED_CHAPTER_CATEGORIES[courseId] || [];
  expandedCategories.forEach((categoryId) => {
    state.collapsedChapterCategories.delete(categoryId);
    state.expandedChapterCategories.add(categoryId);
  });
  state.virtualChapterKey = entry.chapterItem.virtualKey;
  state.virtualChapter = entry.chapterItem;
  state.chapterIndex = Number.isInteger(entry.index) && entry.index >= 0 ? entry.index : 0;
}

function aggregateChapterStats(chapterEntries) {
  return chapterEntries.reduce(
    (sum, { chapterItem }) => {
      const stats = chapterStats(chapterItem);
      sum.total += stats.total;
      sum.answered += stats.answered;
      sum.followUp += stats.followUp;
      sum.score += stats.score;
      return sum;
    },
    { total: 0, answered: 0, followUp: 0, score: 0 }
  );
}

function clearVirtualChapter() {
  state.virtualChapterKey = null;
  state.virtualChapter = null;
}

function selectChapter(index, targetQuestionId = "") {
  if (index !== state.chapterIndex || targetQuestionId) clearResultDisplays();
  checkpointStudyTimeForContextChange();
  clearVirtualChapter();
  state.chapterIndex = index;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  if (targetQuestionId) {
    const targetIndex = visibleQuestions().findIndex((question) => question.id === targetQuestionId);
    state.questionIndex = Math.max(0, targetIndex);
  }
  setRetakeForSelectedQuestion();
  if (isPeriodicTableCourse()) state.periodicPickerOpen = false;
  refreshRunningStudyContext();
  requestMobileQuizScroll();
  render();
}

function selectVirtualChapter(chapterItem) {
  if (!chapterItem?.virtualKey) return;
  if (state.virtualChapterKey !== chapterItem.virtualKey) clearResultDisplays();
  checkpointStudyTimeForContextChange();
  state.virtualChapterKey = chapterItem.virtualKey;
  state.virtualChapter = chapterItem;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  setRetakeForSelectedQuestion();
  refreshRunningStudyContext();
  requestMobileQuizScroll();
  render();
}

function reviewSessionMetaForEntry(entry) {
  return {
    questionId: entry.question?.id || entry.questionId || "",
    dueDay: entry.dueDay || "",
    stage: entry.stage || "future",
    dueOffsetDays: entry.dueOffsetDays ?? null,
    daysSinceAnswered: entry.daysSinceAnswered ?? null,
    intervalDays: entry.intervalDays ?? null,
    retentionPercent: entry.retentionPercent ?? null,
    correctStreak: entry.correctStreak ?? 0,
    latestWrong: Boolean(entry.latestWrong),
  };
}

function buildReviewCurriculumChapter(courseItem, summary, session = state.reviewSession) {
  const config = normalizeReviewSession(session);
  const entries = reviewSessionEntriesForSummary(summary, config);
  const startedAt = Date.now();
  return {
    id: `${courseItem.id}-review-curriculum`,
    number: "R",
    title: `復習演習 / ${reviewSessionModeLabel(config.mode)} ${entries.length}問`,
    virtual: true,
    virtualKey: reviewCurriculumVirtualKey(courseItem.id),
    virtualLabel: "復習",
    reviewCurriculum: true,
    sourceQuestionCount: entries.length,
    reviewSession: config,
    reviewStartedAt: startedAt,
    reviewEntries: entries.map(reviewSessionMetaForEntry),
    questions: entries.map((entry) => entry.question),
  };
}

function buildReviewScheduleChapter(courseItem, entries, scheduleKey) {
  const normalizedSession = normalizeReviewSession(state.reviewSession);
  const label = reviewScheduleLabel(scheduleKey);
  const startedAt = Date.now();
  return {
    id: `${courseItem.id}-review-schedule-${startedAt}`,
    number: "R",
    title: `復習演習 / ${label} ${entries.length}問`,
    virtual: true,
    virtualKey: reviewCurriculumVirtualKey(courseItem.id),
    virtualLabel: "復習",
    reviewCurriculum: true,
    reviewSchedule: true,
    reviewScheduleKey: scheduleKey,
    sourceQuestionCount: entries.length,
    reviewSession: { ...normalizedSession, mode: scheduleKey === "overdue" ? "overdue" : "today", size: entries.length },
    reviewStartedAt: startedAt,
    reviewEntries: entries.map(reviewSessionMetaForEntry),
    questions: entries.map((entry) => entry.question),
  };
}

function questionMapForCourse(courseItem) {
  const questionById = new Map();
  (courseItem?.chapters || []).forEach((chapterItem) => {
    chapterQuestionSet(chapterItem).forEach((question) => {
      if (question?.id && !questionById.has(question.id)) questionById.set(question.id, question);
    });
  });
  return questionById;
}

function reviewEntriesForHistoryQuestions(courseItem, questions) {
  const entryById = new Map(
    reviewCurriculumEntriesForCourse(courseItem)
      .map((entry) => [entry.question?.id, entry])
      .filter(([questionId]) => questionId)
  );
  return questions.map((question) => {
    const entry = entryById.get(question.id);
    return {
      questionId: question.id,
      dueDay: entry?.dueDay || "",
      stage: entry?.stage || "future",
      dueOffsetDays: entry?.dueOffsetDays ?? null,
      daysSinceAnswered: entry?.daysSinceAnswered ?? null,
      intervalDays: entry?.intervalDays ?? null,
      retentionPercent: entry?.retentionPercent ?? null,
      correctStreak: entry?.correctStreak ?? 0,
      latestWrong: entry?.latestWrong || Boolean(lastAttempt(progressFor(question.id)) && !lastAttempt(progressFor(question.id)).correct),
      fromHistory: true,
    };
  });
}

function buildReviewHistoryChapter(courseItem, historyEntry, questions, { onlyWrong = false } = {}) {
  const label = onlyWrong ? "履歴ミス再挑戦" : "履歴もう一度";
  const mode = onlyWrong ? "weak" : historyEntry.mode;
  const config = normalizeReviewSession({ ...state.reviewSession, mode, size: questions.length || historyEntry.total || 5 });
  return {
    id: `${courseItem.id}-review-history-${historyEntry.id}`,
    number: "R",
    title: `復習演習 / ${label} ${questions.length}問`,
    virtual: true,
    virtualKey: reviewCurriculumVirtualKey(courseItem.id),
    virtualLabel: "復習",
    reviewCurriculum: true,
    reviewHistory: true,
    sourceQuestionCount: questions.length,
    reviewSession: config,
    reviewStartedAt: Date.now(),
    reviewSourceHistoryId: historyEntry.id,
    reviewEntries: reviewEntriesForHistoryQuestions(courseItem, questions),
    questions,
  };
}

function buildReviewRecoveryChapter(courseItem, recoveryGroup, questions) {
  const label = recoveryGroup?.courseName || courseItem?.name || "未回収ミス";
  const config = normalizeReviewSession({ ...state.reviewSession, mode: "weak", size: questions.length || 5 });
  return {
    id: `${courseItem.id}-review-recovery-${Date.now()}`,
    number: "R",
    title: `復習演習 / 未回収ミス ${shortText(label, 24)} ${questions.length}問`,
    virtual: true,
    virtualKey: reviewCurriculumVirtualKey(courseItem.id),
    virtualLabel: "復習",
    reviewCurriculum: true,
    reviewRecovery: true,
    sourceQuestionCount: questions.length,
    reviewSession: config,
    reviewStartedAt: Date.now(),
    reviewEntries: reviewEntriesForHistoryQuestions(courseItem, questions),
    questions,
  };
}

function reviewEntriesForWeaknessQuestions(courseItem, questionIds) {
  const questionById = questionMapForCourse(courseItem);
  const reviewEntryById = new Map(
    reviewCurriculumEntriesForCourse(courseItem)
      .map((entry) => [entry.question?.id, entry])
      .filter(([questionId]) => questionId)
  );
  return questionIds
    .map((questionId) => {
      const question = questionById.get(questionId);
      if (!question) return null;
      const record = progressFor(question.id);
      const latest = lastAttempt(record);
      const reviewEntry = reviewEntryById.get(question.id);
      if (reviewEntry) return reviewEntry;
      const latestWrong = Boolean(latest && (!latest.correct || latest.timedOut));
      return {
        question,
        questionId: question.id,
        dueDay: "",
        stage: "future",
        dueOffsetDays: null,
        dueInDays: null,
        daysSinceAnswered: null,
        intervalDays: null,
        retentionPercent: null,
        correctStreak: reviewCorrectStreak(record),
        latestWrong,
        scoreRatio: Number.isFinite(Number(latest?.scoreRatio)) ? Number(latest.scoreRatio) : 1,
        latest,
      };
    })
    .filter(Boolean)
    .sort(compareReviewSessionPriorityEntries);
}

function reviewEntriesForUnderstandingLevel(courseItem, level) {
  const normalizedLevel = normalizeUnderstandingLevel(level);
  if (!normalizedLevel || !courseItem?.chapters?.length) return [];
  const understandingById = normalizeUnderstandingMap(state.understanding);
  const reviewEntryById = new Map(
    reviewCurriculumEntriesForCourse(courseItem)
      .map((entry) => [entry.question?.id, entry])
      .filter(([questionId]) => questionId)
  );
  const seen = new Set();
  const entries = [];
  courseChapterEntries(courseItem).forEach(({ chapterItem, index }) => {
    chapterQuestionSet(chapterItem).forEach((question) => {
      if (!question?.id || seen.has(question.id)) return;
      if (understandingById[question.id] !== normalizedLevel) return;
      seen.add(question.id);
      const reviewEntry = reviewEntryById.get(question.id);
      if (reviewEntry) {
        entries.push(reviewEntry);
        return;
      }
      const record = progressFor(question.id);
      const latest = lastAttempt(record);
      const latestWrong = Boolean(latest && (!latest.correct || latest.timedOut));
      const lowUnderstanding = ["lost", "confused"].includes(normalizedLevel);
      entries.push({
        courseId: courseItem.id,
        courseName: courseItem.name,
        chapterItem,
        chapterIndex: index,
        question,
        record,
        latest,
        dueDay: "",
        due: false,
        dueOffsetDays: null,
        dueInDays: null,
        overdue: false,
        stage: "future",
        daysSinceAnswered: null,
        intervalDays: null,
        retentionPercent: null,
        correctStreak: reviewCorrectStreak(record),
        latestWrong: latestWrong || lowUnderstanding,
        scoreRatio: Number.isFinite(Number(latest?.scoreRatio)) ? Number(latest.scoreRatio) : lowUnderstanding ? 0.5 : 1,
      });
    });
  });
  return entries.sort(compareReviewSessionPriorityEntries);
}

function buildReviewWeaknessChapter(courseItem, weakness, entries) {
  const label = weakness?.label || "弱点";
  const config = normalizeReviewSession({ ...state.reviewSession, mode: "weak", size: entries.length || 5 });
  return {
    id: `${courseItem.id}-review-weakness-${Date.now()}`,
    number: "R",
    title: `復習演習 / 弱点 ${label} ${entries.length}問`,
    virtual: true,
    virtualKey: reviewCurriculumVirtualKey(courseItem.id),
    virtualLabel: "復習",
    reviewCurriculum: true,
    reviewWeakness: true,
    reviewWeaknessKey: weakness?.key || "",
    sourceQuestionCount: entries.length,
    reviewSession: config,
    reviewStartedAt: Date.now(),
    reviewEntries: entries.map(reviewSessionMetaForEntry),
    questions: entries.map((entry) => entry.question),
  };
}

function reviewUnderstandingSessionMode(level) {
  return ["lost", "confused"].includes(normalizeUnderstandingLevel(level)) ? "weak" : "smart";
}

function buildReviewUnderstandingChapter(courseItem, level, entries, session = state.reviewSession) {
  const normalizedLevel = normalizeUnderstandingLevel(level);
  const config = normalizeReviewSession({
    ...session,
    mode: reviewUnderstandingSessionMode(normalizedLevel),
    size: entries.length || session.size,
  });
  const label = understandingLabel(normalizedLevel);
  const startedAt = Date.now();
  return {
    id: `${courseItem.id}-review-understanding-${normalizedLevel}-${startedAt}`,
    number: "R",
    title: `復習演習 / 理解度 ${label} ${entries.length}問`,
    virtual: true,
    virtualKey: reviewCurriculumVirtualKey(courseItem.id),
    virtualLabel: "復習",
    reviewCurriculum: true,
    reviewUnderstandingLevel: normalizedLevel,
    sourceQuestionCount: entries.length,
    reviewSession: config,
    reviewStartedAt: startedAt,
    reviewEntries: entries.map(reviewSessionMetaForEntry),
    questions: entries.map((entry) => entry.question),
  };
}

function buildReviewBottleneckChapter(courseItem, item, entries, session = state.reviewSession) {
  const config = normalizeReviewSession({
    ...session,
    mode: item?.mode || session.mode,
    size: entries.length || session.size,
  });
  const startedAt = Date.now();
  const label = shortText(item?.focus || "単元", 24);
  return {
    id: `${courseItem.id}-review-bottleneck-${startedAt}`,
    number: "R",
    title: `復習演習 / 単元 ${label} ${entries.length}問`,
    virtual: true,
    virtualKey: reviewCurriculumVirtualKey(courseItem.id),
    virtualLabel: "復習",
    reviewCurriculum: true,
    reviewBottleneck: true,
    reviewBottleneckKey: item?.key || "",
    sourceQuestionCount: entries.length,
    reviewSession: config,
    reviewStartedAt: startedAt,
    reviewEntries: entries.map(reviewSessionMetaForEntry),
    questions: entries.map((entry) => entry.question),
  };
}

function buildReviewMasteryStageChapter(courseItem, stageKey, entries, session = state.reviewSession) {
  const config = normalizeReviewSession({
    ...session,
    size: entries.length || session.size,
  });
  const startedAt = Date.now();
  const label = reviewMasteryStageLabel(stageKey);
  return {
    id: `${courseItem.id}-review-mastery-${stageKey}-${startedAt}`,
    number: "R",
    title: `復習演習 / ${label} ${entries.length}問`,
    virtual: true,
    virtualKey: reviewCurriculumVirtualKey(courseItem.id),
    virtualLabel: "復習",
    reviewCurriculum: true,
    reviewMasteryStage: stageKey,
    sourceQuestionCount: entries.length,
    reviewSession: config,
    reviewStartedAt: startedAt,
    reviewEntries: entries.map(reviewSessionMetaForEntry),
    questions: entries.map((entry) => entry.question),
  };
}

function reviewScheduleLabel(scheduleKey) {
  if (scheduleKey === "overdue") return "遅れ";
  const todayKey = localDayKey();
  if (scheduleKey === todayKey) return "今日";
  if (scheduleKey === addDaysToLocalDayKey(todayKey, 1)) return "明日";
  return formatStudyDay(scheduleKey);
}

function reviewScheduleEntriesForKey(scheduleKey, summaries = reviewCurriculumSummaries(), session = state.reviewSession) {
  const config = normalizeReviewSession(session);
  const entries = reviewCurveEntriesFromSummaries(summaries);
  const filtered = entries.filter((entry) => {
    if (scheduleKey === "overdue") return Boolean(entry.overdue);
    return entry.dueDay === scheduleKey;
  });
  return filterReviewSessionEntries(filtered, config).sort(compareReviewSessionPriorityEntries);
}

function dominantReviewScheduleCourse(entries) {
  const groups = new Map();
  entries.forEach((entry) => {
    if (!entry?.courseId || !entry?.question) return;
    if (!groups.has(entry.courseId)) {
      groups.set(entry.courseId, {
        courseId: entry.courseId,
        entries: [],
        score: 0,
      });
    }
    const group = groups.get(entry.courseId);
    group.entries.push(entry);
    group.score += reviewSessionPriorityScore(entry);
  });
  return [...groups.values()].sort(
    (a, b) =>
      Number(b.courseId === state.courseId) - Number(a.courseId === state.courseId) ||
      b.entries.length - a.entries.length ||
      b.score - a.score ||
      String(a.courseId).localeCompare(String(b.courseId))
  )[0] || null;
}

async function startReviewScheduleSession(scheduleKey) {
  const session = normalizeReviewSession(state.reviewSession);
  const allEntries = reviewScheduleEntriesForKey(scheduleKey, reviewCurriculumSummaries(), session);
  const group = dominantReviewScheduleCourse(allEntries);
  if (!group?.entries?.length) return false;
  setStudySummaryOpen(false);
  const token = ++courseLoadToken;
  const changingCourse = group.courseId !== state.courseId;
  clearResultDisplays();
  if (changingCourse) checkpointStudyTimeForContextChange();
  state.courseId = group.courseId;
  state.chapterIndex = 0;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;

  if (!isCourseLoaded(group.courseId)) {
    setCourseTabsDisabled(true);
    renderCoursePending("予報セッションを読み込み中...");
  }

  try {
    const courseItem = await ensureCourseLoaded(group.courseId);
    if (token !== courseLoadToken) return false;
    const limit = session.size;
    const entries = group.entries.slice(0, limit);
    if (!entries.length) {
      clearVirtualChapter();
      render();
      return false;
    }
    state.virtualChapterKey = reviewCurriculumVirtualKey(group.courseId);
    state.virtualChapter = buildReviewScheduleChapter(courseItem, entries, scheduleKey);
    setRetakeForSelectedQuestion(entries[0].question);
    recordCompletedReviewSessionIfNeeded(state.virtualChapter);
    if (changingCourse) refreshRunningStudyContext();
    requestMobileQuizScroll();
    render();
    return true;
  } catch (error) {
    if (token !== courseLoadToken) return false;
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
    return false;
  }
}

async function startReviewHistorySession(sessionId, { onlyWrong = false } = {}) {
  const historyEntry = normalizeReviewSessionHistory(state.reviewSessionHistory).find((entry) => entry.id === sessionId);
  if (!historyEntry) return false;
  const questionIds = onlyWrong ? historyEntry.wrongQuestionIds : historyEntry.questionIds;
  if (!questionIds.length || !courseManifest(historyEntry.courseId)) return false;
  setStudySummaryOpen(false);
  const token = ++courseLoadToken;
  const changingCourse = historyEntry.courseId !== state.courseId;
  clearResultDisplays();
  if (changingCourse) checkpointStudyTimeForContextChange();
  state.courseId = historyEntry.courseId;
  state.chapterIndex = 0;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;

  if (!isCourseLoaded(historyEntry.courseId)) {
    setCourseTabsDisabled(true);
    renderCoursePending("履歴セッションを読み込み中...");
  }

  try {
    const courseItem = await ensureCourseLoaded(historyEntry.courseId);
    if (token !== courseLoadToken) return false;
    const questionById = questionMapForCourse(courseItem);
    const questions = filterReviewSessionQuestions(
      questionIds.map((questionId) => questionById.get(questionId)).filter(Boolean),
      state.reviewSession
    );
    if (!questions.length) {
      clearVirtualChapter();
      render();
      return false;
    }
    state.virtualChapterKey = reviewCurriculumVirtualKey(historyEntry.courseId);
    state.virtualChapter = buildReviewHistoryChapter(courseItem, historyEntry, questions, { onlyWrong });
    setRetakeForSelectedQuestion(questions[0]);
    recordCompletedReviewSessionIfNeeded(state.virtualChapter);
    if (changingCourse) refreshRunningStudyContext();
    requestMobileQuizScroll();
    render();
    return true;
  } catch (error) {
    if (token !== courseLoadToken) return false;
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
    return false;
  }
}

async function startReviewUnresolvedMistakesSession(courseId = "") {
  const recovery = reviewRecoveryData();
  const group =
    recovery.groups.find((item) => item.courseId === courseId) ||
    recovery.groups.find((item) => courseManifest(item.courseId)) ||
    recovery.groups[0] ||
    null;
  if (!group?.questionIds?.length || !courseManifest(group.courseId)) return false;
  setStudySummaryOpen(false);
  const token = ++courseLoadToken;
  const changingCourse = group.courseId !== state.courseId;
  clearResultDisplays();
  if (changingCourse) checkpointStudyTimeForContextChange();
  state.courseId = group.courseId;
  state.chapterIndex = 0;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;

  if (!isCourseLoaded(group.courseId)) {
    setCourseTabsDisabled(true);
    renderCoursePending("未回収ミスを読み込み中...");
  }

  try {
    const courseItem = await ensureCourseLoaded(group.courseId);
    if (token !== courseLoadToken) return false;
    const questionById = questionMapForCourse(courseItem);
    const limit = normalizeReviewSession({ ...state.reviewSession, mode: "weak" }).size;
    const questions = filterReviewSessionQuestions(
      group.questionIds.map((questionId) => questionById.get(questionId)).filter(Boolean),
      state.reviewSession
    ).slice(0, limit);
    if (!questions.length) {
      clearVirtualChapter();
      render();
      return false;
    }
    state.virtualChapterKey = reviewCurriculumVirtualKey(group.courseId);
    state.virtualChapter = buildReviewRecoveryChapter(courseItem, group, questions);
    setRetakeForSelectedQuestion(questions[0]);
    recordCompletedReviewSessionIfNeeded(state.virtualChapter);
    if (changingCourse) refreshRunningStudyContext();
    requestMobileQuizScroll();
    render();
    return true;
  } catch (error) {
    if (token !== courseLoadToken) return false;
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
    return false;
  }
}

async function startWeaknessReviewSession(weaknessKey) {
  const weakness = learningWeaknessSummaries(24).find((item) => item.key === weaknessKey);
  if (!weakness?.questionIds?.length || !courseManifest(weakness.courseId)) return false;
  setStudySummaryOpen(false);
  const token = ++courseLoadToken;
  const changingCourse = weakness.courseId !== state.courseId;
  clearResultDisplays();
  if (changingCourse) checkpointStudyTimeForContextChange();
  state.courseId = weakness.courseId;
  state.chapterIndex = 0;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;

  if (!isCourseLoaded(weakness.courseId)) {
    setCourseTabsDisabled(true);
    renderCoursePending("弱点セッションを読み込み中...");
  }

  try {
    const courseItem = await ensureCourseLoaded(weakness.courseId);
    if (token !== courseLoadToken) return false;
    const limit = normalizeReviewSession(state.reviewSession).size;
    const entries = filterReviewSessionEntries(
      reviewEntriesForWeaknessQuestions(courseItem, weakness.questionIds),
      state.reviewSession
    ).slice(0, limit);
    if (!entries.length) {
      clearVirtualChapter();
      render();
      return false;
    }
    state.virtualChapterKey = reviewCurriculumVirtualKey(weakness.courseId);
    state.virtualChapter = buildReviewWeaknessChapter(courseItem, weakness, entries);
    setRetakeForSelectedQuestion(entries[0].question);
    recordCompletedReviewSessionIfNeeded(state.virtualChapter);
    if (changingCourse) refreshRunningStudyContext();
    requestMobileQuizScroll();
    render();
    return true;
  } catch (error) {
    if (token !== courseLoadToken) return false;
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
    return false;
  }
}

async function startUnderstandingReviewSession(level, session = state.reviewSession) {
  const normalizedLevel = normalizeUnderstandingLevel(level);
  if (!normalizedLevel) return false;
  const manifests = reviewTargetCourseManifests();
  if (!manifests.length) return false;
  const config = normalizeReviewSession({
    ...session,
    mode: reviewUnderstandingSessionMode(normalizedLevel),
  });
  const token = ++courseLoadToken;
  await Promise.allSettled(manifests.map((manifest) => ensureCourseLoaded(manifest.id)));
  if (token !== courseLoadToken) return false;

  const groups = manifests
    .map((manifest) => {
      const courseItem = courseDataStore[manifest.id];
      const entries = filterReviewSessionEntries(reviewEntriesForUnderstandingLevel(courseItem, normalizedLevel), config);
      return {
        courseItem,
        entries,
        score: entries.reduce((sum, entry) => sum + reviewSessionPriorityScore(entry), 0),
      };
    })
    .filter((group) => group.courseItem?.id && group.entries.length);

  groups.sort(
    (a, b) =>
      Number(b.courseItem.id === state.courseId) - Number(a.courseItem.id === state.courseId) ||
      b.entries.length - a.entries.length ||
      b.score - a.score ||
      String(a.courseItem.name).localeCompare(String(b.courseItem.name), "ja")
  );

  const group = groups[0];
  if (!group) {
    setStudySummaryOpen(true);
    return false;
  }

  const entries = group.entries.slice(0, config.size);
  if (!entries.length) return false;

  setStudySummaryOpen(false);
  const changingCourse = group.courseItem.id !== state.courseId;
  clearResultDisplays();
  if (changingCourse) checkpointStudyTimeForContextChange();
  state.courseId = group.courseItem.id;
  state.chapterIndex = 0;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;
  state.virtualChapterKey = reviewCurriculumVirtualKey(group.courseItem.id);
  state.virtualChapter = buildReviewUnderstandingChapter(group.courseItem, normalizedLevel, entries, {
    ...config,
    size: entries.length,
  });
  setRetakeForSelectedQuestion(entries[0].question);
  recordCompletedReviewSessionIfNeeded(state.virtualChapter);
  if (changingCourse) refreshRunningStudyContext();
  requestMobileQuizScroll();
  render();
  return true;
}

async function startReviewBottleneckSession(bottleneckKey, session = state.reviewSession) {
  if (!bottleneckKey) return false;
  const config = normalizeReviewSession(session);
  const item = reviewBottleneckTriageItems(reviewCurriculumSummaries(), config).find(
    (candidate) => candidate.key === bottleneckKey
  );
  if (!item?.courseId || !courseManifest(item.courseId)) return false;
  setStudySummaryOpen(false);
  const token = ++courseLoadToken;
  const changingCourse = item.courseId !== state.courseId;
  clearResultDisplays();
  if (changingCourse) checkpointStudyTimeForContextChange();
  state.courseId = item.courseId;
  state.chapterIndex = 0;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;

  if (!isCourseLoaded(item.courseId)) {
    setCourseTabsDisabled(true);
    renderCoursePending("単元復習を読み込み中...");
  }

  try {
    const courseItem = await ensureCourseLoaded(item.courseId);
    if (token !== courseLoadToken) return false;
    const latestItem = reviewBottleneckTriageItems(reviewCurriculumSummaries(), config).find(
      (candidate) => candidate.key === bottleneckKey
    );
    const targetItem = latestItem || item;
    const entries = targetItem.rows.map((row) => row.entry).slice(0, config.size);
    if (!entries.length) {
      clearVirtualChapter();
      if (changingCourse) refreshRunningStudyContext();
      requestMobileQuizScroll();
      render();
      return false;
    }
    state.virtualChapterKey = reviewCurriculumVirtualKey(item.courseId);
    state.virtualChapter = buildReviewBottleneckChapter(courseItem, targetItem, entries, {
      ...config,
      mode: targetItem.mode,
      size: entries.length,
    });
    setRetakeForSelectedQuestion(entries[0].question);
    recordCompletedReviewSessionIfNeeded(state.virtualChapter);
    if (changingCourse) refreshRunningStudyContext();
    requestMobileQuizScroll();
    render();
    return true;
  } catch (error) {
    if (token !== courseLoadToken) return false;
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
    return false;
  }
}

async function startReviewMasteryStageSession(stageKey, courseId, session = state.reviewSession) {
  if (!stageKey || !courseManifest(courseId)) return false;
  const config = normalizeReviewSession(session);
  setStudySummaryOpen(false);
  const token = ++courseLoadToken;
  const changingCourse = courseId !== state.courseId;
  clearResultDisplays();
  if (changingCourse) checkpointStudyTimeForContextChange();
  state.courseId = courseId;
  state.chapterIndex = 0;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;

  if (!isCourseLoaded(courseId)) {
    setCourseTabsDisabled(true);
    renderCoursePending("定着ステージを読み込み中...");
  }

  try {
    const courseItem = await ensureCourseLoaded(courseId);
    if (token !== courseLoadToken) return false;
    const summary = reviewCurriculumSummaryForCourse(courseItem);
    const entries = reviewMasteryStageEntries([summary], stageKey, courseId, config).slice(0, config.size);
    if (!entries.length) {
      clearVirtualChapter();
      if (changingCourse) refreshRunningStudyContext();
      requestMobileQuizScroll();
      render();
      return false;
    }
    state.virtualChapterKey = reviewCurriculumVirtualKey(courseId);
    state.virtualChapter = buildReviewMasteryStageChapter(courseItem, stageKey, entries, {
      ...config,
      size: entries.length,
    });
    setRetakeForSelectedQuestion(entries[0].question);
    recordCompletedReviewSessionIfNeeded(state.virtualChapter);
    if (changingCourse) refreshRunningStudyContext();
    requestMobileQuizScroll();
    render();
    return true;
  } catch (error) {
    if (token !== courseLoadToken) return false;
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
    return false;
  }
}

async function startReviewCurriculumMode(courseId, session = state.reviewSession) {
  if (!courseManifest(courseId)) return;
  if (!isReviewTargetCourseSelected(courseId)) return;
  const reviewSession = normalizeReviewSession(session);
  const token = ++courseLoadToken;
  const changingCourse = courseId !== state.courseId;
  clearResultDisplays();
  if (changingCourse) checkpointStudyTimeForContextChange();
  state.courseId = courseId;
  state.chapterIndex = 0;
  state.questionIndex = 0;
  state.order = [];
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;

  if (!isCourseLoaded(courseId)) {
    setCourseTabsDisabled(true);
    renderCoursePending("復習データを読み込み中...");
  }

  try {
    const courseItem = await ensureCourseLoaded(courseId);
    if (token !== courseLoadToken) return;
    const summary = reviewCurriculumSummaryForCourse(courseItem);
    const sessionEntries = reviewSessionEntriesForSummary(summary, reviewSession);
    if (!sessionEntries.length) {
      clearVirtualChapter();
      if (changingCourse) refreshRunningStudyContext();
      requestMobileQuizScroll();
      render();
      return;
    }
    state.virtualChapterKey = reviewCurriculumVirtualKey(courseId);
    state.virtualChapter = buildReviewCurriculumChapter(courseItem, summary, reviewSession);
    setRetakeForSelectedQuestion();
    recordCompletedReviewSessionIfNeeded(state.virtualChapter);
    if (changingCourse) refreshRunningStudyContext();
    requestMobileQuizScroll();
    render();
  } catch (error) {
    if (token !== courseLoadToken) return;
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
  }
}

function exitReviewCurriculumMode() {
  clearResultDisplays();
  clearVirtualChapter();
  state.questionIndex = 0;
  state.order = [];
  state.retakeQuestionId = null;
  setRetakeForSelectedQuestion();
  refreshRunningStudyContext();
  requestMobileQuizScroll();
  render();
}

function isChapterButtonActive(chapterItem, index) {
  if (chapterItem?.virtualKey) return state.virtualChapterKey === chapterItem.virtualKey;
  return !state.virtualChapterKey && index === state.chapterIndex;
}

function renderChapterButton(chapterItem, index) {
  const stats = chapterStats(chapterItem);
  const examProgress = isExamProgressChapter(chapterItem);
  const scoreLabel = examProgress
    ? `${stats.correct}/${stats.total}<small>正解</small>`
    : `${formatScore(stats.score)}点${stats.followUp ? ` 補${stats.followUp}` : ""}`;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chapter-button";
  button.classList.toggle("active", isChapterButtonActive(chapterItem, index));
  button.classList.toggle("virtual-chapter-button", Boolean(chapterItem.virtualKey));
  button.classList.toggle("exam-group-button", examProgress);
  button.style.setProperty("--chapter-progress", `${stats.total ? (stats.answered / stats.total) * 100 : 0}%`);
  if (examProgress) {
    button.setAttribute(
      "aria-label",
      `${chapterItem.title}、最新結果 ${stats.correct}/${stats.total}問正解`
    );
  }
  button.innerHTML = `
    <span class="chapter-no">${escapeHtml(chapterItem.number)}</span>
    <span class="chapter-name">${escapeHtml(chapterItem.menuTitle || chapterItem.title)}</span>
    <span class="chapter-score">${scoreLabel}</span>
  `;
  button.addEventListener("click", () => {
    if (chapterItem.virtualKey) {
      selectVirtualChapter(chapterItem);
    } else {
      selectChapter(index);
    }
  });
  return button;
}

function isPeriodicTableCourse(courseItem = course()) {
  return courseItem?.id === "periodic-table";
}

function periodicElementTypeClass(value) {
  return String(value || "unknown").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function openPeriodicPicker() {
  if (!isPeriodicTableCourse()) return;
  state.periodicPickerOpen = true;
  renderChapters();
  requestAnimationFrame(() => {
    els.periodicStage?.querySelector(".periodic-element-button.active")?.focus({ preventScroll: true });
  });
}

function renderPeriodicListButton(chapterItem, index) {
  const stats = chapterStats(chapterItem);
  const active = isChapterButtonActive(chapterItem, index);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chapter-button periodic-list-button";
  button.classList.toggle("active", active);
  button.style.setProperty("--chapter-progress", `${stats.total ? (stats.answered / stats.total) * 100 : 0}%`);
  button.setAttribute(
    "aria-label",
    `${chapterItem.atomicNumber}. ${chapterItem.elementName || chapterItem.title} ${stats.answered}/${stats.total}問`
  );
  button.innerHTML = `
    <span class="chapter-no">${escapeHtml(chapterItem.elementSymbol || chapterItem.number)}</span>
    <span class="chapter-name">${escapeHtml(chapterItem.atomicNumber || chapterItem.number)}. ${escapeHtml(chapterItem.elementName || chapterItem.title)}</span>
    <span class="chapter-score">${stats.answered}/${stats.total}</span>
  `;
  button.addEventListener("click", () => selectChapter(index));
  return button;
}

function renderPeriodicElementButton(chapterItem, index) {
  const stats = chapterStats(chapterItem);
  const active = isChapterButtonActive(chapterItem, index);
  const button = document.createElement("button");
  const column = Number(chapterItem.periodicGridColumn || chapterItem.group || 1);
  const row = Number(chapterItem.periodicGridRow || chapterItem.period || 1);

  button.type = "button";
  button.className = `periodic-element-button periodic-type-${periodicElementTypeClass(chapterItem.elementType)}`;
  button.classList.toggle("active", active);
  button.style.gridColumn = String(column);
  button.style.gridRow = String(row);
  button.dataset.atomicNumber = String(chapterItem.atomicNumber || chapterItem.number);
  button.dataset.symbol = String(chapterItem.elementSymbol || "");
  button.dataset.elementType = String(chapterItem.elementType || "");
  button.style.setProperty("--chapter-progress", `${stats.total ? (stats.answered / stats.total) * 100 : 0}%`);
  button.setAttribute(
    "aria-label",
    `${chapterItem.atomicNumber}. ${chapterItem.elementName || chapterItem.title} ${stats.answered}/${stats.total}問`
  );
  button.setAttribute("aria-pressed", String(active));
  button.title = `${chapterItem.atomicNumber}. ${chapterItem.elementName || chapterItem.title} / ${chapterItem.category || ""}`;
  button.innerHTML = `
    <span class="periodic-number">${escapeHtml(chapterItem.atomicNumber || chapterItem.number)}</span>
    <span class="periodic-symbol">${escapeHtml(chapterItem.elementSymbol || chapterItem.number)}</span>
    <span class="periodic-name">${escapeHtml(chapterItem.elementName || chapterItem.title)}</span>
    <span class="periodic-score">${stats.answered}/${stats.total}</span>
  `;
  button.addEventListener("click", () => selectChapter(index));
  return button;
}

function renderPeriodicTable(currentCourse) {
  els.chapterList.classList.remove("categorized");
  els.chapterList.classList.remove("periodic-table-list", "periodic-picker-list");
  els.chapterList.classList.add("periodic-element-list");
  els.chapterList.style.setProperty("--chapter-count", String(currentCourse.chapters.length));
  els.chapterList.style.setProperty("--chapter-row-count", String(currentCourse.chapters.length));
  currentCourse.chapters.forEach((chapterItem, index) => {
    els.chapterList.appendChild(renderPeriodicListButton(chapterItem, index));
  });
  if (state.periodicPickerOpen) {
    renderPeriodicStage(currentCourse);
  } else {
    clearPeriodicStage();
  }
}

function renderPeriodicStage(currentCourse) {
  if (!els.periodicStage) return;
  els.periodicStage.classList.remove("hidden");
  els.periodicStage.innerHTML = "";
  currentCourse.chapters.forEach((chapterItem, index) => {
    els.periodicStage.appendChild(renderPeriodicElementButton(chapterItem, index));
  });
}

function clearPeriodicStage() {
  if (!els.periodicStage) return;
  els.periodicStage.classList.add("hidden");
  els.periodicStage.innerHTML = "";
}

function isChapterCategoryCollapsed(category) {
  if (state.collapsedChapterCategories.has(category.id)) return true;
  if (state.expandedChapterCategories.has(category.id)) return false;
  return Boolean(category.defaultCollapsed);
}

function toggleChapterCategory(category) {
  const categoryId = category.id;
  if (isChapterCategoryCollapsed(category)) {
    state.collapsedChapterCategories.delete(categoryId);
    state.expandedChapterCategories.add(categoryId);
  } else {
    state.collapsedChapterCategories.add(categoryId);
    state.expandedChapterCategories.delete(categoryId);
  }
  saveCollapsedChapterCategories();
  renderChapters();
}

function renderChapterCategoryToggle(category) {
  const collapsed = isChapterCategoryCollapsed(category);
  const stats = aggregateChapterStats(category.chapters);
  const isRoadmapOnly = !category.chapters.length && category.roadmapItems?.length;
  const countLabel = isRoadmapOnly
    ? `${category.roadmapItems.length}${category.unitLabel || "単元"} / 準備中`
    : `${category.chapters.length}${category.unitLabel || "分野"} / ${stats.answered}/${stats.total}問`;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "chapter-category-toggle";
  toggle.classList.toggle("collapsed", collapsed);
  toggle.dataset.category = category.id;
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.innerHTML = `
    <span class="chapter-category-caret" aria-hidden="true"></span>
    <span class="chapter-category-name">${escapeHtml(category.label)}</span>
    <span class="chapter-category-count">${escapeHtml(countLabel)}</span>
  `;
  toggle.addEventListener("click", () => {
    toggleChapterCategory(category);
  });
  return toggle;
}

function renderChapterCategorySection(category) {
  const collapsed = isChapterCategoryCollapsed(category);
  const section = document.createElement("div");
  section.className = "chapter-category-section";
  section.classList.toggle("collapsed", collapsed);
  section.classList.toggle("expanded", !collapsed);
  section.classList.toggle("roadmap-only", !category.chapters.length && Boolean(category.roadmapItems?.length));
  section.dataset.category = category.id;
  section.style.setProperty("--category-chapter-count", String(category.chapters.length));
  section.style.setProperty("--category-row-count", String(collapsed ? 1 : Math.max(1, category.chapters.length) + 1));
  section.appendChild(renderChapterCategoryToggle(category));
  if (!collapsed) {
    if (category.chapters.length) {
      category.chapters.forEach(({ chapterItem, index }) => {
        section.appendChild(renderChapterButton(chapterItem, index));
      });
    } else if (category.roadmapItems?.length) {
      const roadmap = document.createElement("div");
      roadmap.className = "chapter-roadmap-list";
      roadmap.innerHTML = category.roadmapItems
        .map((item) => `<span>${escapeHtml(item)}</span>`)
        .join("");
      section.appendChild(roadmap);
    }
  }
  return section;
}

function renderChapters() {
  const currentCourse = course();
  els.chapterList.innerHTML = "";
  els.chapterList.style.setProperty("--chapter-count", String(currentCourse.chapters.length));

  if (isPeriodicTableCourse(currentCourse)) {
    renderPeriodicTable(currentCourse);
    return;
  }

  els.chapterList.classList.remove("periodic-table-list", "periodic-picker-list", "periodic-element-list");
  clearPeriodicStage();
  const categories = categoryGroupsForCourse(currentCourse);
  els.chapterList.classList.toggle("categorized", categories.length > 0);

  if (categories.length) {
    const rowCount = categories.reduce((sum, category) => {
      return sum + 1 + (isChapterCategoryCollapsed(category) ? 0 : category.chapters.length);
    }, 0);
    els.chapterList.style.setProperty("--chapter-row-count", String(rowCount));
    categories.forEach((category) => {
      els.chapterList.appendChild(renderChapterCategorySection(category));
    });
    return;
  }

  els.chapterList.style.setProperty("--chapter-row-count", String(currentCourse.chapters.length));
  currentCourse.chapters.forEach((chapterItem, index) => {
    els.chapterList.appendChild(renderChapterButton(chapterItem, index));
  });
}

function renderStatus() {
  const questions = chapterQuestionSet(chapter());
  const answered = questions.filter((question) => isSolvedQuestion(question)).length;
  const correct = answered;
  const followUp = questions.filter((question) => progressFor(question.id)?.followUp).length;
  const attempts = questions.reduce((sum, question) => sum + attemptsFor(progressFor(question.id)).length, 0);
  const score = questions.reduce((sum, question) => {
    return sum + scoreForAttempt(lastAttempt(progressFor(question.id)), question);
  }, 0);
  const visible = visibleQuestions();

  els.accuracy.textContent = `${formatScore(score)}点`;
  els.answeredCount.textContent = `${answered} / ${questions.length}`;
  if (els.comboCount) els.comboCount.textContent = String(answerCombo);
  if (els.comboCell) {
    els.comboCell.dataset.combo = String(answerCombo);
    els.comboCell.classList.toggle("combo-live", answerCombo >= 2);
    els.comboCell.classList.toggle("combo-fever", answerCombo >= 5);
  }
  document.documentElement.style.setProperty("--answer-combo", String(Math.min(10, answerCombo)));
  els.followUpCount.textContent = `${followUp}`;
  els.attemptCount.textContent = `${attempts}`;
  els.currentIndex.textContent = `${Math.min(state.questionIndex + 1, visible.length)} / ${visible.length}`;
  els.progressBar.style.width = `${(answered / questions.length) * 100}%`;
  els.sideScoreValue.innerHTML = `${formatScore(score)}<small>点</small>`;
  els.sideScoreBar.style.width = `${Math.min(100, Math.max(0, score))}%`;
  const rank = rankFor(score, answered);
  els.rankLabel.textContent = rank;
  els.sideRankLabel.textContent = rank;
  els.sideFollowUpCount.textContent = `${followUp}`;
}

function rankFor(score, answered) {
  if (answered === 0) return "入門";
  if (score >= 90) return "賢者級";
  if (score >= 75) return "上級";
  if (score >= 60) return "中級";
  return "初級";
}

function setAdvanceReady(ready) {
  [els.questionBoard, els.answerDock, els.feedback].filter(Boolean).forEach((node) => {
    node.classList.toggle("advance-ready", ready);
  });
}

function renderQuestionText(text, key, html = "") {
  if (html) {
    cancelQuestionTypewriter();
    questionTextRenderKey = key;
    resetQuestionTextFit(els.questionText);
    els.questionText.innerHTML = html;
    normalizeQuizImages(els.questionText);
    renderMathInNode(els.questionText);
    bindQuestionGraphFormulas();
    els.questionText.classList.remove("typewriting", "plain-rich-question", "long-question");
    els.questionText.classList.add("html-question");
    els.quizPanel?.classList.remove("long-question-layout");
    els.questionText.dataset.typewriterComplete = "true";
    resetScrollPosition(els.questionText);
    scheduleQuestionTextFit();
    return;
  }
  els.questionText.classList.remove("html-question", "plain-rich-question");
  const highlightedTextHtml = highlightedPlainQuestionHtml(text);
  if (highlightedTextHtml) {
    cancelQuestionTypewriter();
    questionTextRenderKey = key;
    resetQuestionTextFit(els.questionText);
    els.questionText.innerHTML = highlightedTextHtml;
    els.questionText.classList.remove("typewriting", "html-question");
    applyPlainQuestionTextClasses(text, { rich: true });
    els.questionText.dataset.typewriterComplete = "true";
    resetScrollPosition(els.questionText);
    scheduleQuestionTextFit();
    return;
  }
  const useLongQuestionLayout = applyPlainQuestionTextClasses(text);
  if (questionTextRenderKey === key) {
    finishQuestionTypewriter(text);
    return;
  }
  questionTextRenderKey = key;
  if (LITE_MODE || useLongQuestionLayout) {
    finishQuestionTypewriter(text);
    return;
  }
  startQuestionTypewriter(text);
}

function applyPlainQuestionTextClasses(text, options = {}) {
  if (!els.questionText) return;
  const value = String(text || "");
  const density = els.quizPanel?.dataset.questionDensity;
  const compact = density
    ? ["dense", "extended"].includes(density) || Boolean(options.forceCompact)
    : value.replace(/\s+/g, "").length >= QUESTION_TEXT_LONG_CHAR_LIMIT ||
      /[\r\n]/.test(value) ||
      Boolean(options.forceCompact);
  const useFlowLayout = density ? density === "extended" : compact;
  els.questionText.classList.toggle("plain-rich-question", Boolean(options.rich));
  els.questionText.classList.toggle("long-question", compact);
  els.quizPanel?.classList.toggle("long-question-layout", useFlowLayout);
  return compact;
}

function peQuestionFieldLabel(question) {
  const source = sourceQuestionFor(question);
  if (state.courseId !== "pe-first-info" || !source?.sourceField) return "";
  return shortPeFieldLabel(source.sourceField);
}

function questionPromptHtml(question, html = "") {
  if (!html) return "";
  const fieldLabel = peQuestionFieldLabel(question);
  let result = html;
  if (fieldLabel && !result.includes("pe-question-field")) {
    const fieldBadge = `<div class="pe-question-field">${escapeHtml(fieldLabel)}</div>`;
    result = result.replace(/(<div class="pe-question-title">[\s\S]*?<\/div>)/, `$1${fieldBadge}`);
  }
  result = promotePromptImages(result);
  result = injectQuestionAttemptStats(result, question);
  return highlightQuestionDirectives(result);
}

function hasMathMarkup(value) {
  return /\\(?:\(|\[|begin\{)/.test(String(value || ""));
}

function viewHasMath(question, view) {
  return Boolean(
    hasMathMarkup(view?.promptHtml) ||
      hasMathMarkup(explanationHtml(question)) ||
      view?.options?.some((option) => hasMathMarkup(option?.html))
  );
}

function normalizedContentMetrics(text, html = "") {
  const normalizedText = normalizeClipboardText(text || htmlToClipboardText(html));
  const compactText = normalizedText.replace(/\s+/g, "");
  const htmlValue = String(html || "");
  const explicitLines = normalizedText ? normalizedText.split(/\n+/).length : 0;
  const blockCount = (htmlValue.match(/<(?:p|li|tr|br|blockquote|figcaption)\b/gi) || []).length;
  return {
    chars: Array.from(compactText).length,
    lines: Math.max(explicitLines, blockCount ? Math.min(blockCount, 12) : 0),
    blocks: blockCount,
    hasMedia: /<(?:img|table|svg|canvas|video|iframe|object|embed)\b/i.test(htmlValue),
  };
}

function textContentDensity(metrics) {
  const score = metrics.chars + Math.max(0, metrics.lines - 1) * 18 + Math.max(0, metrics.blocks - 2) * 8;
  if (score <= 64 && metrics.lines <= 2) return "brief";
  if (score <= 180 && metrics.lines <= 3) return "standard";
  if (score <= 420) return "dense";
  return "extended";
}

function questionContentDensity(question, view) {
  if (view?.format === "workbook-page") return "visual";
  const metrics = normalizedContentMetrics(view?.prompt, view?.promptHtml);
  if (metrics.hasMedia) return "visual";
  return textContentDensity(metrics);
}

function optionContentDensity(view) {
  if (view?.format === "workbook-page") return "visual";
  const options = Array.isArray(view?.options) ? view.options : [];
  if (!options.length) return "brief";
  const metrics = options.map((option) => normalizedContentMetrics(option?.text, option?.html));
  if (metrics.some((item) => item.hasMedia)) return "visual";
  const lengths = metrics.map((item) => {
    return item.chars + Math.max(0, item.lines - 1) * 12;
  });
  const maxLength = Math.max(...lengths);
  const averageLength = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  if (maxLength <= 34 && averageLength <= 28) return "brief";
  if (maxLength <= 82 && averageLength <= 62) return "standard";
  if (maxLength <= 170) return "dense";
  return "extended";
}

function feedbackContentDensity(question) {
  const metrics = normalizedContentMetrics(explanationText(question), explanationHtml(question));
  const score = metrics.chars + Math.max(0, metrics.lines - 1) * 10;
  if (score <= 180) return "brief";
  if (score <= 520) return "standard";
  if (score <= 1050) return "dense";
  return "extended";
}

function clearQuizContentProfile() {
  if (!els.quizPanel) return;
  [
    "questionDensity",
    "questionTextDensity",
    "optionDensity",
    "feedbackDensity",
    "questionMedia",
    "contentFlow",
    "questionChars",
    "optionMaxChars",
    "layoutAutoReleased",
  ].forEach((key) => {
    delete els.quizPanel.dataset[key];
  });
  els.quizPanel.classList.remove("content-flow-layout");
}

function applyQuizContentProfile(question, view, showFeedback) {
  if (!els.quizPanel) return;
  const questionMetrics = normalizedContentMetrics(view?.prompt, view?.promptHtml);
  const optionLengths = (view?.options || []).map((option) => normalizedContentMetrics(option?.text, option?.html).chars);
  const questionDensity = questionContentDensity(question, view);
  const questionTextDensity = textContentDensity(questionMetrics);
  const optionDensity = optionContentDensity(view);
  const feedbackDensity = feedbackContentDensity(question);
  const contentFlow =
    view?.format !== "workbook-page" &&
    (showFeedback ||
      questionDensity === "visual" ||
      ["dense", "extended"].includes(questionDensity) ||
      ["dense", "extended"].includes(questionTextDensity) ||
      ["dense", "extended"].includes(optionDensity));

  els.quizPanel.dataset.questionDensity = QUIZ_CONTENT_DENSITIES.has(questionDensity)
    ? questionDensity
    : "standard";
  els.quizPanel.dataset.questionTextDensity = QUIZ_CONTENT_DENSITIES.has(questionTextDensity)
    ? questionTextDensity
    : "standard";
  els.quizPanel.dataset.optionDensity = QUIZ_CONTENT_DENSITIES.has(optionDensity) ? optionDensity : "standard";
  els.quizPanel.dataset.feedbackDensity = QUIZ_CONTENT_DENSITIES.has(feedbackDensity)
    ? feedbackDensity
    : "standard";
  els.quizPanel.dataset.questionMedia = String(questionMetrics.hasMedia || view?.format === "workbook-page");
  els.quizPanel.dataset.contentFlow = String(contentFlow);
  els.quizPanel.dataset.questionChars = String(questionMetrics.chars);
  els.quizPanel.dataset.optionMaxChars = String(optionLengths.length ? Math.max(...optionLengths) : 0);
  els.quizPanel.classList.toggle("content-flow-layout", contentFlow);
}

function questionAttemptCounts(question) {
  const attempts = attemptsFor(progressFor(question?.id));
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const latest = attempts[attempts.length - 1] || null;
  return {
    total: attempts.length,
    correct,
    wrong: attempts.length - correct,
    lastAnsweredAt: latest?.answeredAt || "",
  };
}

function formatLastAnsweredDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function questionAttemptStatsHtml(question) {
  const counts = questionAttemptCounts(question);
  const lastDate = formatLastAnsweredDate(counts.lastAnsweredAt);
  const lastDateTitle = formatDateTime(counts.lastAnsweredAt);
  const lastDateHtml = lastDate
    ? `<span class="stat-last" title="最終回答 ${escapeHtml(lastDateTitle)}">最終<strong>${escapeHtml(lastDate)}</strong></span>`
    : "";
  return `
    <div class="question-attempt-stats" aria-label="この問題の回答履歴">
      <span>回答<strong>${counts.total}</strong></span>
      <span class="stat-correct">正<strong>${counts.correct}</strong></span>
      <span class="stat-wrong">誤<strong>${counts.wrong}</strong></span>
      ${lastDateHtml}
    </div>
  `;
}

function injectQuestionAttemptStats(html, question) {
  if (!html || html.includes("question-attempt-stats")) return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  const root = template.content.querySelector(".pe-kakomonn-question, .kougai-question");
  if (!root) return html;
  const statsTemplate = document.createElement("template");
  statsTemplate.innerHTML = questionAttemptStatsHtml(question).trim();
  const stats = statsTemplate.content.firstElementChild;
  if (!stats) return html;
  const badges = [...root.children].filter((child) =>
    child.matches(".pe-question-title, .pe-question-field, .kougai-question-title, .kougai-question-subject")
  );
  const anchor = badges[badges.length - 1];
  if (anchor) {
    anchor.after(stats);
  } else {
    root.prepend(stats);
  }
  return template.innerHTML;
}

function promotePromptImages(html) {
  if (!/<img\b/i.test(html) || html.includes("pe-prompt-image-strip")) return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  const prompt = template.content.querySelector(".pe-kakomonn-prompt");
  if (!prompt) return html;
  const images = [...prompt.querySelectorAll("img")];
  if (!images.length) return html;

  const strip = document.createElement("div");
  strip.className = "pe-prompt-image-strip";
  strip.setAttribute("aria-label", "図");
  images.forEach((image) => {
    const clone = image.cloneNode(true);
    clone.removeAttribute("style");
    strip.appendChild(clone);
    const parent = image.parentElement;
    if (parent && parent !== prompt && !cleanText(parent.textContent || "")) {
      parent.remove();
    } else {
      image.remove();
    }
  });

  const insertAfter =
    template.content.querySelector(".pe-question-field") ||
    template.content.querySelector(".pe-question-title");
  if (insertAfter) {
    insertAfter.after(strip);
  } else {
    template.content.prepend(strip);
  }
  return template.innerHTML;
}

function highlightedPlainQuestionHtml(text) {
  const value = String(text || "");
  if (!findQuestionDirectiveMatches(value).length) return "";
  const root = document.createElement("span");
  root.textContent = value;
  highlightQuestionDirectiveTextNodes(root);
  return root.innerHTML;
}

function highlightQuestionDirectives(html) {
  if (!html) return "";
  const template = document.createElement("template");
  template.innerHTML = html;
  const promptRoots = [...template.content.querySelectorAll(".pe-kakomonn-prompt, .kougai-prompt")];
  (promptRoots.length ? promptRoots : [template.content]).forEach(highlightQuestionDirectiveTextNodes);
  return template.innerHTML;
}

function renderMathInNode(root) {
  if (!root) return;
  if (typeof window.renderMathInElement !== "function") {
    if (!/\\\(|\\\[/.test(root.textContent || "")) return;
    ensureMathRuntimeLoaded()
      .then(() => {
        if (root.isConnected) renderMathInNode(root);
      })
      .catch((error) => {
        console.warn("Math runtime load failed", error);
      });
    return;
  }
  try {
    window.renderMathInElement(root, MATH_RENDER_OPTIONS);
  } catch (error) {
    console.warn("KaTeX render failed", error);
  }
}

function highlightQuestionDirectiveTextNodes(root) {
  const filter = {
    acceptNode(node) {
      if (!node.nodeValue || !findQuestionDirectiveMatches(node.nodeValue).length) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent || parent.closest(".question-directive-highlight, script, style, svg, canvas")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(replaceQuestionDirectiveTextNode);
}

function replaceQuestionDirectiveTextNode(node) {
  const text = node.nodeValue || "";
  const matches = findQuestionDirectiveMatches(text);
  if (!matches.length) return;
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  matches.forEach((match) => {
    if (match.start > cursor) {
      fragment.appendChild(document.createTextNode(text.slice(cursor, match.start)));
    }
    const span = document.createElement("span");
    span.className = `question-directive-highlight ${match.className}`;
    span.textContent = text.slice(match.start, match.end);
    fragment.appendChild(span);
    cursor = match.end;
  });
  if (cursor < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(cursor)));
  }
  node.replaceWith(fragment);
}

function findQuestionDirectiveMatches(text) {
  const value = String(text || "");
  const matches = [];
  QUESTION_DIRECTIVE_HIGHLIGHT_RULES.forEach((rule) => {
    rule.regex.lastIndex = 0;
    let match;
    while ((match = rule.regex.exec(value))) {
      const start = match.index;
      const end = start + match[0].length;
      if (end <= start) {
        rule.regex.lastIndex += 1;
        continue;
      }
      if (!matches.some((item) => start < item.end && end > item.start)) {
        matches.push({ start, end, className: rule.className });
      }
    }
  });
  return matches.sort((a, b) => a.start - b.start || b.end - a.end);
}

function normalizeQuizImages(root) {
  normalizeExternalLinks(root);
  root.querySelectorAll("img").forEach((image) => {
    image.classList.add("quiz-image");
    image.decoding = "async";
    image.loading = image.loading || "lazy";
    makeQuizImagePreviewable(image);
    if (image.dataset.noScale === "true") {
      image.style.width = "auto";
      image.style.height = "auto";
      image.style.maxWidth = "100%";
      return;
    }
    const applyScale = () => {
      const naturalWidth = image.naturalWidth || image.width;
      if (!naturalWidth) return;
      image.style.width = `${Math.ceil(naturalWidth * QUIZ_IMAGE_SCALE)}px`;
      image.style.height = "auto";
      image.style.maxWidth = "none";
    };
    if (image.complete && image.naturalWidth) {
      applyScale();
      scheduleQuestionTextFit();
      scheduleSourceLayoutUpdate();
      return;
    }
    image.addEventListener(
      "load",
      () => {
        applyScale();
        scheduleQuestionTextFit();
        scheduleSourceLayoutUpdate();
      },
      { once: true }
    );
  });
}

function normalizeExternalLinks(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll("a[href]").forEach((anchor) => {
    let url;
    try {
      url = new URL(anchor.getAttribute("href") || "", location.href);
    } catch {
      return;
    }
    if (!/^https?:$/.test(url.protocol) || url.origin === location.origin) return;
    anchor.target = "_blank";
    const rel = new Set(
      String(anchor.getAttribute("rel") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((item) => item.toLowerCase())
    );
    rel.add("noopener");
    rel.add("noreferrer");
    anchor.setAttribute("rel", [...rel].join(" "));
    anchor.referrerPolicy = "no-referrer";
  });
}

function makeQuizImagePreviewable(image) {
  if (!image || image.dataset.previewReady === "true") return;
  image.dataset.previewReady = "true";
  image.tabIndex = 0;
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", image.alt ? `${image.alt}を拡大表示` : "画像を拡大表示");
  image.title = "タップで拡大";
  image.addEventListener("click", openImagePreviewFromEvent);
  image.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches?.[0] || event.touches?.[0];
      imagePreviewTouchGesture = touch
        ? {
            target: image,
            startX: touch.clientX,
            startY: touch.clientY,
            moved: false,
          }
        : null;
    },
    { passive: true }
  );
  image.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.changedTouches?.[0] || event.touches?.[0];
      if (!touch || imagePreviewTouchGesture?.target !== image) return;
      if (touchMovedBeyondTap(imagePreviewTouchGesture, touch)) {
        imagePreviewTouchGesture.moved = true;
        suppressImagePreviewClickUntil = performance.now() + 700;
      }
    },
    { passive: true }
  );
  image.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches?.[0];
      const isScrollGesture =
        !imagePreviewTouchGesture ||
        imagePreviewTouchGesture.target !== image ||
        imagePreviewTouchGesture.moved ||
        (touch && touchMovedBeyondTap(imagePreviewTouchGesture, touch));
      imagePreviewTouchGesture = null;
      if (isScrollGesture) {
        suppressImagePreviewClickUntil = performance.now() + 700;
        return;
      }
      lastImagePreviewTouchAt = performance.now();
      openImagePreviewFromEvent(event);
    },
    { passive: false }
  );
  image.addEventListener("touchcancel", () => {
    imagePreviewTouchGesture = null;
  });
  image.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    openImagePreviewFromEvent(event);
  });
}

function openImagePreviewFromEvent(event) {
  const image = event.currentTarget;
  if (!(image instanceof HTMLImageElement)) return;
  if (event.type === "click" && performance.now() < suppressImagePreviewClickUntil) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  optionTouchGesture = null;
  if (event.type === "click" && performance.now() - lastImagePreviewTouchAt < 700) return;
  openImagePreview(image);
}

function openImagePreview(sourceImage) {
  if (!els.imagePreview || !els.imagePreviewImage || !(sourceImage instanceof HTMLImageElement)) return;
  const src = sourceImage.currentSrc || sourceImage.src;
  if (!src) return;
  imagePreviewSource = sourceImage;
  els.imagePreviewImage.src = src;
  els.imagePreviewImage.alt = sourceImage.alt || "拡大画像";
  els.imagePreview.classList.remove("hidden");
  document.documentElement.classList.add("image-preview-open");
  document.body.classList.add("image-preview-open");
  els.imagePreviewClose?.focus({ preventScroll: true });
}

function closeImagePreview() {
  if (!els.imagePreview || els.imagePreview.classList.contains("hidden")) return;
  els.imagePreview.classList.add("hidden");
  if (els.imagePreviewImage) {
    els.imagePreviewImage.removeAttribute("src");
    els.imagePreviewImage.alt = "";
  }
  document.documentElement.classList.remove("image-preview-open");
  document.body.classList.remove("image-preview-open");
  imagePreviewSource?.focus?.({ preventScroll: true });
  imagePreviewSource = null;
}

function startQuestionTypewriter(text) {
  cancelQuestionTypewriter();
  resetQuestionTextFit(els.questionText);
  const value = String(text || "");
  const chars = splitTypewriterText(value);
  const total = chars.length;
  const duration = typewriterDuration(total);

  els.questionText.textContent = "";
  els.questionText.classList.toggle("typewriting", total > 0);
  els.questionText.dataset.typewriterDuration = String(Math.round(duration));
  els.questionText.dataset.typewriterComplete = total ? "false" : "true";

  if (!total) return;

  const startedAt = performance.now();
  let lastVisible = 0;
  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const visible = Math.min(total, Math.max(1, Math.ceil(total * progress)));
    if (visible !== lastVisible) {
      els.questionText.textContent = chars.slice(0, visible).join("");
      lastVisible = visible;
    }
    if (visible < total) {
      questionTypewriterFrame = window.requestAnimationFrame(tick);
      return;
    }
    finishQuestionTypewriter(value);
  };
  questionTypewriterFrame = window.requestAnimationFrame(tick);
}

function finishQuestionTypewriter(text) {
  cancelQuestionTypewriter();
  resetQuestionTextFit(els.questionText);
  els.questionText.textContent = String(text || "");
  els.questionText.classList.remove("typewriting");
  els.questionText.classList.remove("html-question");
  els.questionText.dataset.typewriterComplete = "true";
  resetScrollPosition(els.questionText);
  scheduleQuestionTextFit();
}

function cancelQuestionTypewriter() {
  if (!questionTypewriterFrame) return;
  window.cancelAnimationFrame(questionTypewriterFrame);
  questionTypewriterFrame = null;
}

function splitTypewriterText(text) {
  if (window.Intl?.Segmenter) {
    try {
      return [...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(text)].map(
        (part) => part.segment
      );
    } catch {
      return Array.from(text);
    }
  }
  return Array.from(text);
}

function typewriterDuration(charCount) {
  if (!charCount) return 0;
  return Math.min(QUESTION_TYPEWRITER_MAX_MS, Math.max(420, charCount * 22));
}

function resetScrollPosition(node) {
  if (!node) return;
  node.scrollTop = 0;
  node.scrollLeft = 0;
}

function resetAnswerDockAfterLayout() {
  if (els.answerDock?.contains(document.activeElement) && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  resetScrollPosition(els.answerDock);
  resetScrollPosition(els.options);
  window.requestAnimationFrame(() => {
    resetScrollPosition(els.answerDock);
    resetScrollPosition(els.options);
    window.requestAnimationFrame(() => {
      resetScrollPosition(els.answerDock);
      resetScrollPosition(els.options);
    });
  });
}

function resetQuestionTextFit(node) {
  if (!node) return;
  node.style.removeProperty("font-size");
  node.dataset.fitScale = "1";
}

function scheduleQuestionTextFit() {
  if (questionTextFitFrame) window.cancelAnimationFrame(questionTextFitFrame);
  questionTextFitFrame = window.requestAnimationFrame(() => {
    questionTextFitFrame = window.requestAnimationFrame(() => {
      questionTextFitFrame = null;
      fitQuestionTextToBox();
    });
  });
}

function questionTextOverflowAmount(node) {
  if (!node) return 0;
  return Math.max(
    0,
    node.scrollHeight - node.clientHeight,
    node.scrollWidth - node.clientWidth
  );
}

function fitQuestionTextToBox() {
  const node = els.questionText;
  if (!node || node.dataset.typewriterComplete === "false") return;
  resetQuestionTextFit(node);
  if (els.quizPanel?.classList.contains("source-layout")) return;
  if (!els.quizPanel?.classList.contains("quiz-custom-layout")) return;
  if (node.classList.contains("long-question")) return;
  if (questionTextOverflowAmount(node) <= 2) return;

  const baseFontSize = Number.parseFloat(window.getComputedStyle(node).fontSize);
  if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) return;

  const minScale = questionTextMinScale(baseFontSize);
  for (let scale = 1 - QUESTION_TEXT_FIT_STEP; scale >= minScale; scale -= QUESTION_TEXT_FIT_STEP) {
    node.style.fontSize = `${roundFitFontSize(baseFontSize * scale)}px`;
    node.dataset.fitScale = scale.toFixed(2);
    if (questionTextOverflowAmount(node) <= 2) {
      resetScrollPosition(node);
      return;
    }
  }

  node.style.fontSize = `${roundFitFontSize(baseFontSize * minScale)}px`;
  node.dataset.fitScale = minScale.toFixed(2);
  resetScrollPosition(node);
}

function roundFitFontSize(value) {
  return Math.round(value * 100) / 100;
}

function questionTextMinScale(baseFontSize) {
  return baseFontSize < 22 ? QUESTION_TEXT_COMPACT_MIN_SCALE : QUESTION_TEXT_MIN_SCALE;
}

function renderUnderstandingButtons(question) {
  if (!els.understandingButtons?.length) return;
  const level = understandingLevelForQuestion(question);
  const menuButton = document.querySelector("#understandingMenuButton");
  if (menuButton) {
    menuButton.textContent = level ? `理解度：${understandingLabel(level)} ▾` : "理解度を選ぶ ▾";
    menuButton.disabled = !question;
  }
  els.understandingToggle?.classList.toggle("unrated", Boolean(question && !level));
  els.understandingToggle?.setAttribute("title", question ? `理解度: ${understandingLabel(level)}` : "理解度");
  els.understandingButtons.forEach((button) => {
    const buttonLevel = normalizeUnderstandingLevel(button.dataset.understandingLevel);
    const active = Boolean(question && level && level === buttonLevel);
    button.disabled = !question;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "title",
      question
        ? active
          ? `${understandingLabel(buttonLevel)}を解除して未評価に戻す`
          : `理解度を${understandingLabel(buttonLevel)}にする`
        : "理解度"
    );
  });
}

function renderCalculationMarkerButton(question) {
  if (!els.calculationMarkerButton) return;
  const active = Boolean(question && isCalculationQuestion(question));
  els.calculationMarkerButton.disabled = !question;
  els.calculationMarkerButton.classList.toggle("active", active);
  els.calculationMarkerButton.setAttribute("aria-pressed", String(active));
  els.calculationMarkerButton.setAttribute(
    "title",
    question ? (active ? "計算問題マークを解除" : "計算問題としてマーク") : "計算問題"
  );
}

function renderCopyQuestionButton(question) {
  if (!els.copyQuestionButton) return;
  els.copyQuestionButton.disabled = !question;
  if (!question) {
    els.copyQuestionButton.classList.remove("copied", "error");
    const label = els.copyQuestionButton.querySelector("span");
    if (label) label.textContent = "Copy";
  }
}

function reviewSessionAttemptFor(question, reviewChapter = chapter()) {
  const startedAt = Number(reviewChapter?.reviewStartedAt || 0);
  if (!question?.id || !startedAt) return null;
  const attempts = attemptsFor(progressFor(question.id));
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    const attempt = attempts[index];
    const answeredAt = Date.parse(attempt?.answeredAt || "");
    if (Number.isFinite(answeredAt) && answeredAt >= startedAt) return attempt;
  }
  return null;
}

function reviewSessionMetaForQuestion(question, reviewChapter = chapter()) {
  if (!question?.id || !Array.isArray(reviewChapter?.reviewEntries)) return null;
  return reviewChapter.reviewEntries.find((entry) => entry.questionId === question.id) || null;
}

function reviewSessionStats(reviewChapter = chapter()) {
  if (!isReviewCurriculumChapter(reviewChapter) || !reviewChapter?.questions?.length) {
    return {
      active: false,
      questions: [],
      attempts: [],
      completed: 0,
      correct: 0,
      wrong: 0,
      total: 0,
      remaining: 0,
      progressPercent: 0,
      accuracyPercent: 0,
      retentionAverage: null,
      nextDueDay: "",
    };
  }
  const questions = chapterQuestionSet(reviewChapter);
  const attempts = questions.map((item) => reviewSessionAttemptFor(item, reviewChapter));
  const completed = attempts.filter(Boolean).length;
  const correct = attempts.filter((attempt) => attempt?.correct).length;
  const wrong = attempts.filter((attempt) => attempt && !attempt.correct).length;
  const total = questions.length;
  const entries = Array.isArray(reviewChapter.reviewEntries) ? reviewChapter.reviewEntries : [];
  const retentionEntries = entries
    .map((entry) => Number(entry.retentionPercent))
    .filter((value) => Number.isFinite(value));
  const dueDays = entries
    .map((entry) => entry.dueDay)
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));
  return {
    active: true,
    questions,
    attempts,
    completed,
    correct,
    wrong,
    total,
    remaining: Math.max(0, total - completed),
    progressPercent: total ? Math.round((completed / total) * 100) : 0,
    accuracyPercent: completed ? Math.round((correct / completed) * 100) : 0,
    retentionAverage: retentionEntries.length
      ? Math.round(retentionEntries.reduce((sum, value) => sum + value, 0) / retentionEntries.length)
      : null,
    nextDueDay: dueDays[0] || "",
  };
}

function recordCompletedReviewSessionIfNeeded(reviewChapter = chapter()) {
  if (!isReviewCurriculumChapter(reviewChapter)) return false;
  const stats = reviewSessionStats(reviewChapter);
  if (!stats.active || !stats.total || stats.completed < stats.total) return false;
  const startedAt = Number(reviewChapter.reviewStartedAt);
  if (!Number.isFinite(startedAt)) return false;
  const id = `${state.courseId}:${startedAt}:${stats.total}`;
  if (state.reviewSessionHistory.some((entry) => entry.id === id)) return false;
  const completedAt = Date.now();
  const questionIds = stats.questions.map((question) => question?.id).filter(Boolean);
  const wrongQuestionIds = stats.questions
    .filter((question, index) => question?.id && stats.attempts[index] && !stats.attempts[index].correct)
    .map((question) => question.id);
  const entry = normalizeReviewSessionHistoryEntry({
    id,
    courseId: state.courseId,
    courseName: course()?.name || state.courseId,
    title: reviewChapter.title || "",
    mode: reviewChapter.reviewSession?.mode || state.reviewSession.mode,
    size: reviewChapter.reviewSession?.size || state.reviewSession.size,
    total: stats.total,
    correct: stats.correct,
    wrong: stats.wrong,
    retentionAverage: stats.retentionAverage,
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    questionIds,
    wrongQuestionIds,
  });
  if (!entry) return false;
  state.reviewSessionHistory = normalizeReviewSessionHistory([entry, ...state.reviewSessionHistory]);
  saveReviewSessionHistory();
  return true;
}

function reviewSessionHudStageLabel(stage) {
  return {
    overdue: "遅れ",
    today: "今日",
    soon: "7日内",
    future: "保持中",
  }[stage] || "保持中";
}

function reviewSessionHudLabel(reviewChapter, session, currentMeta) {
  if (reviewChapter?.reviewSchedule) return reviewScheduleLabel(reviewChapter.reviewScheduleKey);
  const match = String(reviewChapter?.title || "").match(/^復習演習\s*\/\s*(.+?)\s+\d+問$/);
  const restoredLabel = match?.[1] || "";
  if (reviewChapter?.reviewMasteryStage) return reviewMasteryStageLabel(reviewChapter.reviewMasteryStage);
  if (reviewChapter?.reviewUnderstandingLevel) return `理解度 ${understandingLabel(reviewChapter.reviewUnderstandingLevel)}`;
  if (reviewChapter?.reviewBottleneck || reviewChapter?.reviewWeakness || reviewChapter?.reviewHistory || reviewChapter?.reviewRecovery) {
    return restoredLabel || reviewSessionModeLabel(session.mode);
  }
  if (["遅れ", "今日", "明日"].includes(restoredLabel) || /^\d{2}\/\d{2}\(.+\)$/.test(restoredLabel)) {
    return restoredLabel;
  }
  if (session?.mode === "today" && currentMeta?.dueDay && currentMeta.dueDay !== localDayKey()) {
    return reviewScheduleLabel(currentMeta.dueDay);
  }
  return reviewSessionModeLabel(session.mode);
}

function hideReviewSessionHud() {
  if (!els.reviewSessionHud) return;
  els.reviewSessionHud.classList.add("hidden");
  els.reviewSessionHud.innerHTML = "";
}

function reviewSessionHudMapHtml(stats, currentQuestion, reviewChapter = chapter()) {
  const entries = Array.isArray(reviewChapter?.reviewEntries) ? reviewChapter.reviewEntries : [];
  const entryByQuestionId = new Map(entries.map((entry) => [entry.questionId, entry]));
  return `
    <div class="review-session-hud-map" aria-label="復習セッション内の問題別進捗">
      ${stats.questions
        .map((item, index) => {
          const attempt = stats.attempts[index];
          const meta = entryByQuestionId.get(item?.id);
          const kind = attempt ? (attempt.correct ? "correct" : "wrong") : "pending";
          const current = Boolean(item?.id && currentQuestion?.id === item.id);
          const focus = reviewSessionQuestionFocusLabel(item) || `Q${index + 1}`;
          const stage = reviewSessionHudStageLabel(meta?.stage);
          const retention = meta?.retentionPercent == null ? "--" : `${Math.round(meta.retentionPercent)}%`;
          const status = attempt ? (attempt.correct ? "正解済み" : "再挑戦") : "未回答";
          return `
            <button
              class="review-session-hud-cell ${escapeHtml(kind)}${current ? " current" : ""}"
              type="button"
              data-review-session-jump="${index}"
              aria-current="${current ? "true" : "false"}"
              title="${escapeHtml(`Q${index + 1}: ${focus} / ${status} / ${stage} / 保持 ${retention}`)}"
            >
              <span>${index + 1}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function handleReviewSessionHudClick(event) {
  const button = event.target?.closest?.("[data-review-session-jump]");
  if (!button || !els.reviewSessionHud?.contains(button)) return;
  const reviewChapter = chapter();
  if (!isReviewCurriculumChapter(reviewChapter)) return;
  const index = Number(button.dataset.reviewSessionJump);
  const questions = chapterQuestionSet(reviewChapter);
  if (!Number.isInteger(index) || index < 0 || index >= questions.length) return;
  if (index === state.questionIndex) {
    button.blur();
    return;
  }
  clearResultDisplays();
  state.questionIndex = index;
  setRetakeForSelectedQuestion(questions[index]);
  render();
}

function renderReviewSessionHud(question) {
  if (!els.reviewSessionHud) return;
  const reviewChapter = chapter();
  if (!isReviewCurriculumChapter(reviewChapter) || !reviewChapter?.questions?.length) {
    hideReviewSessionHud();
    return;
  }

  const session = normalizeReviewSession(reviewChapter.reviewSession || state.reviewSession);
  const stats = reviewSessionStats(reviewChapter);
  const currentMeta = reviewSessionMetaForQuestion(question, reviewChapter);
  const retentionText = currentMeta?.retentionPercent == null ? "--" : `${Math.round(currentMeta.retentionPercent)}%`;
  const dueText = currentMeta?.dueDay ? formatStudyDay(currentMeta.dueDay) : "期限なし";
  const stageText = reviewSessionHudStageLabel(currentMeta?.stage);
  const streakText = currentMeta?.correctStreak ? `${currentMeta.correctStreak}連勝` : "初回復習";
  const sessionLabel = reviewSessionHudLabel(reviewChapter, session, currentMeta);
  const currentAttempt = reviewSessionAttemptFor(question, reviewChapter);
  const currentState = currentAttempt
    ? currentAttempt.correct
      ? "このセッションで正解"
      : "このセッションで再挑戦"
    : question && canAnswer(question)
      ? "回答待ち"
      : "解説確認中";

  els.reviewSessionHud.classList.remove("hidden");
  els.reviewSessionHud.innerHTML = `
    <div class="review-session-hud-head">
      <div>
        <span>REVIEW SESSION</span>
        <strong>${escapeHtml(sessionLabel)} ${stats.total}問</strong>
      </div>
      <small>${escapeHtml(currentState)}</small>
    </div>
    <div class="review-session-hud-progress" aria-hidden="true"><span style="width: ${stats.progressPercent}%"></span></div>
    <div class="review-session-hud-grid">
      <span>完了 <b>${stats.completed}/${stats.total}</b></span>
      <span>正解 <b>${stats.correct}</b></span>
      <span>再挑戦 <b>${stats.wrong}</b></span>
      <span>期限 <b>${escapeHtml(dueText)}</b></span>
      <span>区分 <b>${escapeHtml(stageText)}</b></span>
      <span>保持 <b>${escapeHtml(retentionText)}</b></span>
      <span>履歴 <b>${escapeHtml(streakText)}</b></span>
    </div>
    ${reviewSessionHudMapHtml(stats, question, reviewChapter)}
  `;
}

function optionClipboardText(question, view, option, index) {
  const label = optionLetter(index, view);
  const text = normalizeClipboardText(option.text) || htmlToClipboardText(option.html);
  const source = text || `選択肢${index + 1}`;
  return `${label}. ${source}`;
}

function currentQuestionClipboardText() {
  const question = currentQuestion();
  if (!question) return "";
  const view = currentViewQuestion();
  const lines = [
    QUESTION_CLIPBOARD_PREAMBLE,
    "",
    `科目: ${course().name}`,
    `チャプター: ${chapter().title}`,
    `形式: ${view.formatLabel}`,
    "",
    "問題文:",
    normalizeClipboardText(view.prompt) || htmlToClipboardText(view.promptHtml),
  ];

  if (view.clues?.length) {
    lines.push("", "HINT:");
    view.clues.forEach((clue, index) => {
      lines.push(`${index + 1}. ${normalizeClipboardText(clue)}`);
    });
  }

  lines.push("", "選択肢:");
  if (view.options?.length) {
    view.options.forEach((option, index) => {
      lines.push(optionClipboardText(question, view, option, index));
    });
  } else {
    lines.push("（タイピング入力）");
  }

  return lines.filter((line, index, array) => {
    if (line !== "") return true;
    return array[index - 1] !== "" && array[index + 1] !== "";
  }).join("\n");
}

function fallbackWriteClipboardText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy command failed");
}

async function writeClipboardText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back below when browser permissions reject the modern clipboard API.
    }
  }
  fallbackWriteClipboardText(text);
}

function showCopyQuestionStatus(message, error = false) {
  if (!els.copyQuestionButton) return;
  window.clearTimeout(copyQuestionStatusTimer);
  els.copyQuestionButton.classList.toggle("copied", !error);
  els.copyQuestionButton.classList.toggle("error", error);
  const label = els.copyQuestionButton.querySelector("span");
  if (label) label.textContent = message;
  copyQuestionStatusTimer = window.setTimeout(() => {
    els.copyQuestionButton.classList.remove("copied", "error");
    if (label) label.textContent = "Copy";
  }, 1600);
}

async function copyCurrentQuestion() {
  const text = currentQuestionClipboardText();
  if (!text) return;
  try {
    await writeClipboardText(text);
    showCopyQuestionStatus("Copied");
  } catch {
    showCopyQuestionStatus("失敗", true);
  }
}

function llmAnswerClipboardText() {
  const answers = llmConversation
    .filter((message) => message.role === "assistant" && String(message.content || "").trim())
    .map((message) => String(message.content).trim());
  if (answers.length <= 1) return answers[0] || "";
  return answers.map((answer, index) => `回答${index + 1}\n${answer}`).join("\n\n---\n\n");
}

function setLlmCopyButtonIcon(iconName) {
  if (!els.llmCopyButton) return;
  els.llmCopyButton.innerHTML = `<i data-lucide="${iconName}"></i><span>コピー</span>`;
  if (window.lucide) window.lucide.createIcons();
}

function renderLlmCopyButton() {
  if (!els.llmCopyButton) return;
  els.llmCopyButton.disabled = !llmAnswerClipboardText();
  if (!llmCopyStatusTimer) {
    els.llmCopyButton.title = "表示中のLLM回答をコピー";
    els.llmCopyButton.setAttribute("aria-label", els.llmCopyButton.title);
  }
}

function showLlmCopyStatus(error = false) {
  if (!els.llmCopyButton) return;
  window.clearTimeout(llmCopyStatusTimer);
  els.llmCopyButton.classList.toggle("copied", !error);
  els.llmCopyButton.classList.toggle("error", error);
  els.llmCopyButton.title = error ? "コピーできませんでした" : "コピーしました";
  els.llmCopyButton.setAttribute("aria-label", els.llmCopyButton.title);
  setLlmCopyButtonIcon(error ? "triangle-alert" : "check");
  llmCopyStatusTimer = window.setTimeout(() => {
    llmCopyStatusTimer = null;
    els.llmCopyButton.classList.remove("copied", "error");
    els.llmCopyButton.title = "表示中のLLM回答をコピー";
    els.llmCopyButton.setAttribute("aria-label", els.llmCopyButton.title);
    setLlmCopyButtonIcon("copy");
    renderLlmCopyButton();
  }, 1600);
}

async function copyLlmAnswers() {
  const text = llmAnswerClipboardText();
  if (!text) return;
  try {
    await writeClipboardText(text);
    showLlmCopyStatus();
  } catch {
    showLlmCopyStatus(true);
  }
}

function formatLlmImageSize(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function formatLlmImageDate(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function setLlmImageStatus(message, kind = "") {
  if (!els.llmImageStatus) return;
  els.llmImageStatus.textContent = String(message || "");
  els.llmImageStatus.dataset.kind = kind;
  window.QuizStudyPanels?.imageStatusChanged(message, kind, llmImagesSaving);
}

function llmImageStorageStatus(items = llmImageItems) {
  const totalBytes = items.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
  return `${items.length}件 · ${formatLlmImageSize(totalBytes)}/${formatLlmImageSize(LLM_IMAGE_MAX_TOTAL_BYTES)} · 端末内のみ`;
}

function inferredLlmImageType(file) {
  const declared = String(file?.type || "").toLowerCase();
  if (LLM_IMAGE_ALLOWED_TYPES.has(declared)) return declared;
  const extension = String(file?.name || "").toLowerCase().split(".").pop();
  return {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
  }[extension] || "";
}

function normalizeLlmImageItem(item) {
  const type = String(item?.type || "").toLowerCase();
  const size = Number(item?.size);
  const dataUrl = String(item?.dataUrl || "");
  const uploadedAt = String(item?.uploadedAt || "");
  if (
    !LLM_IMAGE_ALLOWED_TYPES.has(type) ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > LLM_IMAGE_MAX_BYTES ||
    dataUrl.length > Math.ceil(LLM_IMAGE_MAX_BYTES * 4 / 3) + 256 ||
    !dataUrl.startsWith(`data:${type};base64,`) ||
    !Number.isFinite(Date.parse(uploadedAt))
  ) return null;
  return {
    id: String(item?.id || "").slice(0, 120) || `image-${Date.now()}`,
    name: String(item?.name || "保存画像").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "保存画像",
    type,
    size,
    uploadedAt,
    dataUrl,
  };
}

function normalizeLlmImageItems(value) {
  const source = value?.version === 1 && Array.isArray(value.items) ? value.items : [];
  const items = [];
  let totalBytes = 0;
  for (const candidate of source) {
    const item = normalizeLlmImageItem(candidate);
    if (!item || items.length >= LLM_IMAGE_MAX_ITEMS || totalBytes + item.size > LLM_IMAGE_MAX_TOTAL_BYTES) continue;
    items.push(item);
    totalBytes += item.size;
  }
  return items;
}

async function readLocalLlmImages() {
  const database = await openFullDataDatabase();
  try {
    if (!database.objectStoreNames.contains("settings")) throw new Error("端末内の画像保存領域がありません。");
    const transaction = database.transaction("settings", "readonly");
    const completed = fullDataTransaction(transaction);
    const record = await fullDataRequest(transaction.objectStore("settings").get(LLM_IMAGE_LIBRARY_SETTING_KEY));
    await completed;
    return normalizeLlmImageItems(record?.value);
  } finally {
    database.close();
  }
}

async function writeLocalLlmImages(items) {
  const normalized = normalizeLlmImageItems({ version: 1, items });
  const database = await openFullDataDatabase();
  try {
    if (!database.objectStoreNames.contains("settings")) throw new Error("端末内の画像保存領域がありません。");
    const transaction = database.transaction("settings", "readwrite");
    const completed = fullDataTransaction(transaction);
    transaction.objectStore("settings").put({
      key: LLM_IMAGE_LIBRARY_SETTING_KEY,
      value: { version: 1, items: normalized },
    });
    await completed;
    llmImageItems = normalized;
  } finally {
    database.close();
  }
}

function renderLlmImageLibrary() {
  window.QuizStudyPanels?.imagesChanged(llmImageItems, llmImagesLoading, els.llmImageStatus?.textContent, els.llmImageStatus?.dataset.kind, llmImagesSaving);
  els.explanationImagesButton?.setAttribute("aria-expanded", String(llmImageLibraryOpen));
  els.llmImageLibraryToggle?.classList.toggle("active", llmImageLibraryOpen);
  els.llmImageLibraryToggle?.setAttribute("aria-expanded", String(llmImageLibraryOpen));
  if (els.llmImageAdd) els.llmImageAdd.disabled = llmImagesLoading || llmImagesSaving;
  if (!els.llmImageGallery) return;
  els.llmImageGallery.replaceChildren();
  if (llmImagesLoading && !llmImageItems.length) {
    const loading = document.createElement("div");
    loading.className = "llm-image-empty loading";
    loading.innerHTML = `<i data-lucide="loader-circle"></i><span>端末から読み込み中</span>`;
    els.llmImageGallery.append(loading);
  } else if (!llmImageItems.length) {
    const empty = document.createElement("div");
    empty.className = "llm-image-empty";
    empty.innerHTML = `<i data-lucide="image-off"></i><span>保存画像はありません</span>`;
    els.llmImageGallery.append(empty);
  } else {
    llmImageItems.forEach((item) => {
      const card = document.createElement("article");
      card.className = "llm-image-card";
      const image = document.createElement("img");
      image.src = item.dataUrl;
      image.alt = item.name;
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", item.name + "を拡大表示");
      image.setAttribute("aria-expanded", "false");
      image.dataset.studyImageId = item.id;
      const toggleImage = () => {
        if (window.QuizStudyPanels) { setLlmImageLibraryOpen(false); window.QuizStudyPanels.openImage(image); return; }
        const expanded = card.classList.toggle("expanded");
        image.setAttribute("aria-expanded", String(expanded));
        image.setAttribute("aria-label", item.name + (expanded ? "を縮小表示" : "を拡大表示"));
      };
      image.addEventListener("click", toggleImage);
      image.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggleImage();
      });
      const details = document.createElement("div");
      details.className = "llm-image-card-details";
      const name = document.createElement("strong");
      name.textContent = item.name;
      name.title = item.name;
      const meta = document.createElement("small");
      meta.textContent = [formatLlmImageSize(item.size), formatLlmImageDate(item.uploadedAt)].filter(Boolean).join(" · ");
      details.append(name, meta);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "llm-image-delete";
      remove.dataset.llmImageDelete = item.id;
      remove.title = `${item.name}を端末から削除`;
      remove.setAttribute("aria-label", remove.title);
      remove.innerHTML = `<i data-lucide="trash-2"></i>`;
      card.append(image, details, remove);
      els.llmImageGallery.append(card);
    });
  }
  if (window.lucide) window.lucide.createIcons();
}

async function refreshLlmImages({ force = false } = {}) {
  if (llmImagesLoading || (llmImagesLoaded && !force)) {
    renderLlmImageLibrary();
    return;
  }
  llmImagesLoading = true;
  setLlmImageStatus("端末から読み込み中", "loading");
  renderLlmImageLibrary();
  try {
    llmImageItems = await readLocalLlmImages();
    llmImagesLoaded = true;
    setLlmImageStatus(llmImageStorageStatus(), "success");
  } catch (error) {
    setLlmImageStatus(error?.message || "画像資料を読み込めませんでした", "error");
  } finally {
    llmImagesLoading = false;
    renderLlmImageLibrary();
  }
}

function setLlmImageLibraryOpen(open) {
  const dialog = els.explanationImagesDialog;
  if (!dialog) return;
  llmImageLibraryOpen = Boolean(open);
  if (llmImageLibraryOpen && !dialog.open) dialog.showModal();
  if (!llmImageLibraryOpen && dialog.open) dialog.close();
  renderLlmImageLibrary();
  if (llmImageLibraryOpen) refreshLlmImages().catch(() => {});
}

function validateLlmImageFile(file) {
  const type = inferredLlmImageType(file);
  if (!type || !LLM_IMAGE_ALLOWED_TYPES.has(type)) throw new Error("PNG・JPEG・WebP・GIF・AVIFだけ追加できます。");
  if (!file.size || file.size > LLM_IMAGE_MAX_BYTES) throw new Error("画像1件は3MB以下にしてください。");
  return type;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")), { once: true });
    reader.addEventListener("error", () => reject(reader.error || new Error("画像を読み込めませんでした。")), { once: true });
    reader.readAsDataURL(file);
  });
}

async function assertDecodableLlmImage(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", () => reject(new Error("画像として読み取れないファイルです。")), { once: true });
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function createLlmImageId() {
  return globalThis.crypto?.randomUUID?.() || `image-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function addLocalLlmImages(files) {
  if (llmImagesSaving) return;
  const candidates = [...(files || [])].filter((file) => file instanceof File);
  if (!candidates.length) return;
  if (!window.QuizStudyPanels?.isImageOpen()) setLlmImageLibraryOpen(true);
  if (!llmImagesLoaded) await refreshLlmImages();
  llmImagesSaving = true;
  renderLlmImageLibrary();
  const next = [...llmImageItems];
  const errors = [];
  let totalBytes = next.reduce((sum, item) => sum + item.size, 0);
  for (const file of candidates) {
    try {
      const type = validateLlmImageFile(file);
      if (next.length >= LLM_IMAGE_MAX_ITEMS) throw new Error(`保存できる画像は${LLM_IMAGE_MAX_ITEMS}件までです。`);
      if (totalBytes + file.size > LLM_IMAGE_MAX_TOTAL_BYTES) throw new Error("端末内画像の合計は8MBまでです。");
      setLlmImageStatus(`${file.name || "画像"}を確認中`, "loading");
      await assertDecodableLlmImage(file);
      const dataUrl = await fileToDataUrl(file);
      const item = normalizeLlmImageItem({
        id: createLlmImageId(),
        name: file.name || "保存画像",
        type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      });
      if (!item) throw new Error("画像データを安全に保存できませんでした。");
      next.unshift(item);
      totalBytes += item.size;
    } catch (error) {
      errors.push(`${file.name || "画像"}: ${error?.message || "保存できませんでした"}`);
    }
  }
  try {
    await writeLocalLlmImages(next);
    llmImagesLoaded = true;
    setLlmImageStatus(errors[0] || llmImageStorageStatus(), errors.length ? "error" : "success");
  } catch (error) {
    setLlmImageStatus(error?.message || "端末へ保存できませんでした", "error");
  } finally {
    llmImagesSaving = false;
    renderLlmImageLibrary();
  }
}

async function deleteLocalLlmImage(id) {
  const item = llmImageItems.find((candidate) => candidate.id === id);
  if (!item || !window.confirm(`${item.name}をこの端末から削除しますか？`)) return;
  llmImagesSaving = true;
  setLlmImageStatus("端末から削除中", "loading");
  renderLlmImageLibrary();
  try {
    await writeLocalLlmImages(llmImageItems.filter((candidate) => candidate.id !== id));
    setLlmImageStatus(llmImageStorageStatus(), "success");
  } catch (error) {
    setLlmImageStatus(error?.message || "削除できませんでした", "error");
  } finally {
    llmImagesSaving = false;
    renderLlmImageLibrary();
  }
}

function llmImageFilesFromTransfer(dataTransfer) {
  const itemFiles = [...(dataTransfer?.items || [])]
    .filter((item) => item.kind === "file" && String(item.type || "").startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (itemFiles.length) return itemFiles;
  return [...(dataTransfer?.files || [])].filter((file) => inferredLlmImageType(file));
}

function llmTransferContainsFiles(dataTransfer) {
  return [...(dataTransfer?.types || [])].includes("Files")
    || [...(dataTransfer?.items || [])].some((item) => item.kind === "file");
}

function setLlmImageDragActive(active) {
  els.llmExplanationPanel?.classList.toggle("llm-image-drag-active", Boolean(active));
}

function renderLlmModelOptions() {
  if (!els.llmModelSelect) return;
  els.llmModelSelect.innerHTML = LLM_MODELS.map(
    (model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label)}</option>`
  ).join("");
  els.llmModelSelect.value = state.llmModel;
}

function loadLlmFontScale() {
  try {
    const value = Number(localStorage.getItem(LLM_FONT_SCALE_STORAGE_KEY));
    return Number.isFinite(value) && value >= 80 && value <= 200 ? Math.round(value / 10) * 10 : 100;
  } catch { return 100; }
}

function renderLlmFontControls() {
  els.llmExplanationBody?.style.setProperty("--llm-font-scale", String(state.llmFontScale / 100));
  if (els.llmFontDecrease) els.llmFontDecrease.disabled = state.llmFontScale <= 80;
  if (els.llmFontIncrease) els.llmFontIncrease.disabled = state.llmFontScale >= 200;
  if (els.llmFontReset) {
    els.llmFontReset.querySelector("span").textContent = `${state.llmFontScale}%`;
    els.llmFontReset.setAttribute("aria-label", `文字サイズ${state.llmFontScale}%、100%に戻す`);
    els.llmFontReset.disabled = state.llmFontScale === 100;
  }
}

function setLlmFontScale(value) {
  const body = els.llmExplanationBody;
  const bounds = body?.getBoundingClientRect();
  const anchor = bounds && [...body.querySelectorAll(".llm-markdown > *, .llm-message-user > p, .llm-option-reference")]
    .find(element => { const rect = element.getBoundingClientRect(); return rect.bottom > bounds.top + 1 && rect.top < bounds.bottom; });
  const anchorTop = anchor?.getBoundingClientRect().top;
  state.llmFontScale = Math.max(80, Math.min(200, Math.round(value / 10) * 10));
  try { localStorage.setItem(LLM_FONT_SCALE_STORAGE_KEY, String(state.llmFontScale)); } catch { /* Keep this page's reading size. */ }
  renderLlmFontControls();
  // Resize the existing content in place, keeping the visible reading block in position.
  if (anchor) body.scrollTop += anchor.getBoundingClientRect().top - anchorTop;
}


function setLlmPanelOpen(open) {
  window.QuizStudyPanels?.explanationVisibilityChanged(open);
  renderLlmFontControls();
  if (!els.llmExplanationPanel) return;
  els.llmExplanationPanel.hidden = !open;
  els.llmExplanationPanel.classList.toggle("hidden", !open);
  els.llmTeachButton?.classList.toggle("active", open);
  els.llmTeachButton?.setAttribute("aria-expanded", String(open));
  if (open) {
    renderLlmConversation();
    renderLlmComposerState();
  }
  if (!open) {
    llmRequestController?.abort();
    llmRequestController = null;
    state.llmLoading = false;
    state.llmPanelQuestionId = null;
    setLlmImageDragActive(false);
    setLlmImageLibraryOpen(false);
    setLlmSettingsOpen(false);
    renderLlmTeachButton(currentQuestion());
    renderLlmComposerState();
  }
}

function setLlmSettingsOpen(open, { focusGuide = false } = {}) {
  els.llmSettings?.classList.toggle("hidden", !open);
  if (els.llmSettings) els.llmSettings.hidden = !open;
  els.llmSettingsToggle?.setAttribute("aria-expanded", String(open));
  els.llmSettingsToggle?.classList.toggle("active", open);
  if (open) {
    refreshLlmSettings().catch(() => {});
    window.setTimeout(() => {
      if (focusGuide) {
        if (els.llmSettings) els.llmSettings.scrollTop = 0;
        els.llmSetupGuide?.focus({ preventScroll: true });
      } else {
        els.llmApiKeyInput?.focus();
      }
    }, 0);
  }
}

function renderLlmTeachButton(question) {
  if (!els.llmTeachButton) return;
  const hasSavedAnswer = Boolean(question && localLlmExplanation(question));
  els.llmTeachButton.disabled = !question || state.llmLoading;
  els.llmTeachButton.classList.toggle("has-saved-answer", hasSavedAnswer);
  els.llmTeachButton.title = hasSavedAnswer
    ? "保存済みのLLM解説を表示"
    : "LLMに解説してもらう";
  els.llmTeachButton.setAttribute("aria-label", "AIにきく");
  els.llmTeachButton.setAttribute("aria-busy", String(state.llmLoading));
  const label = els.llmTeachButton.querySelector("span");
  if (label) label.textContent = "AIにきく";
}

function syncLlmPanelQuestion(question) {
  const questionId = String(question?.id || "");
  if (llmConversationQuestionId && questionId !== llmConversationQuestionId) {
    resetLlmConversation();
  }
  if (!els.llmExplanationPanel || els.llmExplanationPanel.hidden) return;
  if (!question || state.llmPanelQuestionId !== question.id) setLlmPanelOpen(false);
}

function setLlmStatus(message, kind = "") {
  if (!els.llmPanelStatus) return;
  els.llmPanelStatus.textContent = message;
  els.llmPanelStatus.dataset.kind = kind;
  els.llmPanelStatus.classList.toggle("empty", !message);
}

function llmMarkdownHtml(markdown) {
  const source = String(markdown || "").trim();
  if (!source) return "";
  if (!window.marked?.parse || !window.DOMPurify?.sanitize) {
    return `<p>${escapeHtml(source).replace(/\n/g, "<br>")}</p>`;
  }
  const mathFragments = [];
  const protectedSource = source.replace(/\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g, (fragment) => {
    const token = `LLMMATHTOKEN${mathFragments.length}ENDTOKEN`;
    mathFragments.push(fragment);
    return token;
  });
  const parsed = window.marked.parse(protectedSource, {
    gfm: true,
    breaks: false,
  });
  const sanitized = window.DOMPurify.sanitize(parsed, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "option", "iframe", "object", "embed"],
    FORBID_ATTR: ["style", "id", "class"],
  });
  return sanitized.replace(/LLMMATHTOKEN(\d+)ENDTOKEN/g, (_, index) => escapeHtml(mathFragments[Number(index)] || ""));
}

function secureLlmMarkdownLinks(node) {
  node?.querySelectorAll("a").forEach((link) => {
    let url = null;
    try {
      url = new URL(link.getAttribute("href") || "", window.location.href);
    } catch {
      url = null;
    }
    if (!url || !["http:", "https:"].includes(url.protocol)) {
      link.removeAttribute("href");
      return;
    }
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.referrerPolicy = "no-referrer";
  });
}

function llmMessageElement(message) {
  const article = document.createElement("article");
  article.className = `llm-message llm-message-${message.role}`;
  if (message.role === "assistant") {
    const header = document.createElement("header");
    header.className = "llm-message-header";
    header.innerHTML = `<span class="llm-message-avatar" aria-hidden="true"><i data-lucide="sparkles"></i></span><strong>解説チューター</strong><small>${escapeHtml(llmModelLabel(message.model || state.llmModel))}</small>`;
    const content = document.createElement("div");
    content.className = "llm-markdown";
    content.innerHTML = llmMarkdownHtml(message.content);
    secureLlmMarkdownLinks(content);
    decorateLlmMarkdownTables(content);
    renderMathInNode(content);
    article.append(header, content);
    return article;
  }
  if (message.role === "user") {
    const header = document.createElement("header");
    header.className = "llm-message-header";
    header.innerHTML = `<strong>あなた</strong><span class="llm-message-avatar" aria-hidden="true"><i data-lucide="user-round"></i></span>`;
    const content = document.createElement("p");
    content.textContent = message.content;
    article.append(header, content);
    return article;
  }
  article.setAttribute("role", "alert");
  article.innerHTML = `<span class="llm-message-avatar" aria-hidden="true"><i data-lucide="triangle-alert"></i></span><p>${escapeHtml(message.content)}</p>`;
  return article;
}

function decorateLlmMarkdownTables(node) {
  node?.querySelectorAll("table").forEach((table) => {
    table.classList.add("llm-responsive-table");
    const headers = [...table.querySelectorAll("thead th")].map((cell, index) => (
      String(cell.textContent || "").trim() || `項目${index + 1}`
    ));
    table.querySelectorAll("tbody tr").forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (cell.tagName === "TD") cell.dataset.label = headers[index] || `項目${index + 1}`;
      });
    });
  });
}

function renderLlmConversation({ scroll = true } = {}) {
  if (!els.llmExplanationBody) return;
  els.llmExplanationPanel?.classList.toggle("answer-mode", llmConversationHasAnswer());
  els.llmExplanationBody.replaceChildren();
  if (!llmConversation.length && !state.llmLoading) {
    const empty = document.createElement("div");
    empty.className = "llm-conversation-empty";
    empty.innerHTML = `<span aria-hidden="true"><i data-lucide="message-circle-more"></i></span><strong>この問題を一緒に解きほぐします</strong><p>解説のあとも、わからない箇所をそのまま続けて質問できます。</p>`;
    els.llmExplanationBody.append(empty);
  } else {
    llmConversation.forEach((message) => els.llmExplanationBody.append(llmMessageElement(message)));
  }
  if (state.llmLoading) {
    const loading = document.createElement("article");
    loading.className = "llm-message llm-message-assistant llm-message-loading";
    loading.setAttribute("aria-label", "LLMが回答を作成中");
    loading.innerHTML = `<span class="llm-message-avatar" aria-hidden="true"><i data-lucide="sparkles"></i></span><span class="llm-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
    els.llmExplanationBody.append(loading);
  }
  els.llmExplanationBody.setAttribute("aria-busy", String(state.llmLoading));
  renderLlmCopyButton();
  if (window.lucide) window.lucide.createIcons();
  if (scroll) {
    window.requestAnimationFrame(() => {
      els.llmExplanationBody.scrollTop = els.llmExplanationBody.scrollHeight;
    });
  }
}

function scrollLlmConversationToStart() {
  window.requestAnimationFrame(() => {
    if (els.llmExplanationBody) els.llmExplanationBody.scrollTop = 0;
  });
}

function llmConversationHasAnswer() {
  return llmConversation.some((message) => message.role === "assistant");
}

function renderLlmComposerState() {
  const canAsk = Boolean(llmConversationQuestionId && llmConversationHasAnswer());
  const disabled = state.llmLoading || !canAsk;
  if (els.llmFollowUpInput) els.llmFollowUpInput.disabled = disabled;
  if (els.llmFollowUpSend) {
    els.llmFollowUpSend.disabled = disabled || !String(els.llmFollowUpInput?.value || "").trim();
  }
  els.llmFollowUpSuggestions?.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
  if (els.llmPanelFooter) {
    const turns = llmConversation.filter((message) => message.role === "assistant").length;
    const details = [llmModelLabel(state.llmModel)];
    if (turns) details.push(`${turns}回答`);
    if (llmConversationTokens) details.push(`${llmConversationTokens.toLocaleString("ja-JP")} tokens`);
    els.llmPanelFooter.textContent = details.join(" / ");
  }
}

function resizeLlmFollowUpInput() {
  if (!els.llmFollowUpInput) return;
  els.llmFollowUpInput.style.height = "auto";
  els.llmFollowUpInput.style.height = `${Math.min(els.llmFollowUpInput.scrollHeight, 132)}px`;
  renderLlmComposerState();
}

function resetLlmConversation(questionId = "") {
  llmConversation = [];
  llmConversationQuestionId = String(questionId || "");
  llmConversationModel = state.llmModel;
  llmConversationTokens = 0;
  if (els.llmFollowUpInput) {
    els.llmFollowUpInput.value = "";
    els.llmFollowUpInput.style.height = "auto";
  }
  renderLlmConversation({ scroll: false });
  renderLlmComposerState();
}

function llmConversationPayload() {
  const messages = [];
  let remainingChars = 52000;
  for (let index = llmConversation.length - 1; index >= 0 && remainingChars > 0; index -= 1) {
    const message = llmConversation[index];
    if (!message || !["user", "assistant"].includes(message.role)) continue;
    const content = String(message.content || "").slice(0, Math.min(12000, remainingChars));
    if (!content) continue;
    messages.push({ role: message.role, content });
    remainingChars -= content.length;
  }
  return messages.reverse().slice(-12);
}

function renderLlmSettingsStatus(status = llmSettingsCache) {
  if (!els.llmSettingsStatus) return;
  const configured = Boolean(status?.configured);
  const sourceLabel = status?.source === "secret" ? "Worker Secret" : "暗号化ストレージ";
  els.llmSettingsStatus.textContent = configured ? `API設定済み / ${sourceLabel}` : "APIキー未設定";
  els.llmSettingsStatus.classList.toggle("configured", configured);
  if (els.llmSetupGuide) els.llmSetupGuide.hidden = configured;
  if (els.llmApiKeyDelete) {
    els.llmApiKeyDelete.disabled = !configured || status?.source === "secret";
    els.llmApiKeyDelete.title = status?.source === "secret" ? "Worker Secretは画面から削除できません" : "保存済みAPIキーを削除";
  }
}

async function llmApiFetch(path, init = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error || `LLM API error (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function refreshLlmSettings({ force = false } = {}) {
  if (llmSettingsCache && !force) {
    renderLlmSettingsStatus(llmSettingsCache);
    return llmSettingsCache;
  }
  if (els.llmSettingsStatus) els.llmSettingsStatus.textContent = "設定を確認中";
  llmSettingsCache = await llmApiFetch(LLM_SETTINGS_API_PATH);
  renderLlmSettingsStatus(llmSettingsCache);
  return llmSettingsCache;
}

function llmQuestionPayload(question = currentQuestion()) {
  if (!question) return null;
  const view = buildViewQuestion(question);
  const options = (view.options || []).map((option, index) => optionClipboardText(question, view, option, index));
  const correctIndex = (view.options || []).findIndex((option) => option.correct);
  const correctAnswer = correctIndex >= 0
    ? optionClipboardText(question, view, view.options[correctIndex], correctIndex)
    : normalizeClipboardText(view.answerText);
  return {
    id: String(question.id || ""),
    course: course().name,
    chapter: chapter().title,
    format: view.formatLabel,
    prompt: normalizeClipboardText(view.prompt) || htmlToClipboardText(view.promptHtml),
    options,
    correctAnswer,
    existingExplanation: normalizeClipboardText(explanationText(question)),
  };
}

function llmExplanationCacheKey(question = currentQuestion()) {
  const payload = llmQuestionPayload(question);
  if (!payload) return "";
  const signature = hashString(JSON.stringify(payload)).toString(36);
  return `${LLM_EXPLANATION_PROMPT_VERSION}:${state.llmModel}:${signature}`;
}

function localLlmExplanation(question = currentQuestion()) {
  const key = llmExplanationCacheKey(question);
  if (!key) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(LLM_EXPLANATION_CACHE_STORAGE_KEY) || "{}");
    const entry = Array.isArray(parsed?.entries)
      ? parsed.entries.find((item) => item?.key === key)
      : null;
    if (!entry?.answer) return null;
    return {
      answer: String(entry.answer),
      model: String(entry.model || state.llmModel),
      usage: entry.usage && typeof entry.usage === "object" ? entry.usage : {},
      cached: true,
      local: true,
      updatedAt: Number(entry.updatedAt) || null,
    };
  } catch {
    return null;
  }
}

function saveLocalLlmExplanation(question, payload) {
  const key = llmExplanationCacheKey(question);
  const answer = String(payload?.answer || "").trim();
  if (!key || !answer) return;
  try {
    const parsed = JSON.parse(localStorage.getItem(LLM_EXPLANATION_CACHE_STORAGE_KEY) || "{}");
    const entries = (Array.isArray(parsed?.entries) ? parsed.entries : [])
      .filter((item) => item?.key !== key);
    entries.unshift({
      key,
      answer,
      model: String(payload?.model || state.llmModel),
      usage: payload?.usage && typeof payload.usage === "object" ? payload.usage : {},
      updatedAt: Number(payload?.updatedAt) || Date.now(),
    });
    localStorage.setItem(
      LLM_EXPLANATION_CACHE_STORAGE_KEY,
      JSON.stringify({ entries: entries.slice(0, LLM_LOCAL_CACHE_LIMIT) })
    );
  } catch {
    // Server-side cache remains authoritative when browser storage is unavailable.
  }
}

function appendLlmAnswer(payload) {
  const usage = payload.usage || {};
  llmConversation.push({
    role: "assistant",
    content: String(payload.answer || "").trim(),
    model: String(payload.model || state.llmModel),
    usage,
  });
  llmConversationTokens += Number(usage.totalTokens) || 0;
}

async function requestLlmCompletion(
  question = currentQuestion(),
  { reset = false, force = false, lookupOnly = false } = {}
) {
  if (!question || state.llmLoading) return;
  if (reset) resetLlmConversation(question.id);
  if (!llmConversationQuestionId) llmConversationQuestionId = question.id;
  state.llmPanelQuestionId = question.id;
  state.llmLoading = true;
  renderLlmTeachButton(question);
  if (els.llmRegenerateButton) els.llmRegenerateButton.disabled = true;
  setLlmStatus(
    reset
      ? (
          lookupOnly
            ? "保存済みの解説を確認中..."
            : `${llmModelLabel()}で${force ? "解説を生成中..." : "解説を作成中..."}`
        )
      : "追加の質問を考えています...",
    "loading"
  );
  renderLlmConversation();
  renderLlmComposerState();
  llmRequestController?.abort();
  const controller = new AbortController();
  llmRequestController = controller;

  try {
    const payload = await llmApiFetch(LLM_EXPLAIN_API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Quiz-Zen-LLM": "1",
      },
      body: JSON.stringify({
        model: state.llmModel,
        question: llmQuestionPayload(question),
        conversation: llmConversationPayload(),
        force: Boolean(force && reset),
        lookupOnly: Boolean(lookupOnly && reset),
      }),
      signal: controller.signal,
    });
    if (state.llmPanelQuestionId !== question.id) return;
    if (payload.cacheMiss) {
      setLlmStatus("保存済みの解説はありません。新しく生成します", "loading");
      return payload;
    }
    appendLlmAnswer(payload);
    if (reset) saveLocalLlmExplanation(question, payload);
    setLlmStatus(
      payload.cached ? "保存済みの解説を表示しました" : (reset ? "解説を保存しました" : "続けて質問できます"),
      "success"
    );
  } catch (error) {
    if (error?.name === "AbortError") return;
    llmConversation.push({
      role: "error",
      content: error?.message || "解説を生成できませんでした。",
    });
    setLlmStatus("生成エラー", "error");
    if (Number(error?.status) === 409) setLlmSettingsOpen(true);
    return null;
  } finally {
    if (llmRequestController === controller) llmRequestController = null;
    state.llmLoading = false;
    renderLlmTeachButton(currentQuestion());
    if (els.llmRegenerateButton) els.llmRegenerateButton.disabled = false;
    renderLlmConversation({ scroll: !reset });
    if (reset) scrollLlmConversationToStart();
    renderLlmComposerState();
  }
}

async function generateLlmExplanation({ force = false } = {}) {
  const question = currentQuestion();
  if (!question || state.llmLoading) return;
  if (force) {
    return requestLlmCompletion(question, { reset: true, force: true });
  }
  const local = localLlmExplanation(question);
  if (local) {
    state.llmPanelQuestionId = question.id;
    resetLlmConversation(question.id);
    appendLlmAnswer(local);
    setLlmStatus("保存済みの解説を表示しました", "success");
    renderLlmConversation({ scroll: false });
    scrollLlmConversationToStart();
    renderLlmComposerState();
    return local;
  }
  const cached = await requestLlmCompletion(question, { reset: true, lookupOnly: true });
  if (cached?.cacheMiss) {
    return requestLlmCompletion(question, { reset: true, force: true });
  }
  return cached;
}

async function submitLlmFollowUp() {
  const question = currentQuestion();
  const content = String(els.llmFollowUpInput?.value || "").trim();
  if (!question || !content || state.llmLoading || !llmConversationHasAnswer()) return;
  llmConversation.push({ role: "user", content });
  els.llmFollowUpInput.value = "";
  resizeLlmFollowUpInput();
  renderLlmConversation();
  await requestLlmCompletion(question);
}

// Open setup from the product presentation without generating an AI response.
window.quizZenOpenLlmSettings = async ({ slot, model, baseUrl } = {}) => {
  if (LLM_MODELS.some((item) => item.id === slot)) {
    saveLlmModel(slot);
    els.llmModelSelect?.dispatchEvent(new Event("change", { bubbles: true }));
  }
  setLlmPanelOpen(true);
  setLlmSettingsOpen(true);
  await refreshLlmSettings({ force: true }).catch(() => {});
  // The provider selector refreshes its fields on the next task.
  window.setTimeout(() => {
    const modelInput = document.getElementById("llmProviderModelInput");
    const baseInput = document.getElementById("llmProviderBaseUrlInput");
    if (typeof model === "string" && modelInput) {
      modelInput.value = model;
      modelInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (baseUrl === "https://api.x.ai/v1" && baseInput) {
      baseInput.value = baseUrl;
      baseInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setLlmStatus("接続先・モデルとAPIキーを確認して保存してください。まだAIには送信していません。", "settings");
    els.llmApiKeyInput?.focus();
  }, 0);
};

async function openLlmTutor() {
  const question = currentQuestion();
  if (!question) return;
  state.llmPanelQuestionId = question.id;
  setLlmPanelOpen(true);
  if (
    llmConversationQuestionId === question.id
    && llmConversationModel === state.llmModel
    && llmConversationHasAnswer()
  ) {
    setLlmStatus("続けて質問できます", "success");
    const initialAnswerOnly = llmConversation.length === 1 && llmConversation[0]?.role === "assistant";
    renderLlmConversation({ scroll: !initialAnswerOnly });
    if (initialAnswerOnly) scrollLlmConversationToStart();
    renderLlmComposerState();
    window.setTimeout(() => els.llmFollowUpInput?.focus(), 0);
    return;
  }
  resetLlmConversation(question.id);
  setLlmSettingsOpen(false);
  const local = localLlmExplanation(question);
  if (!local) {
    try {
      const settings = await refreshLlmSettings({ force: true });
      if (!settings?.configured) {
        setLlmSettingsOpen(true, { focusGuide: true });
        setLlmStatus("最初にAPIキーを設定してください。3ステップで始められます。", "setup");
        renderLlmConversation({ scroll: false });
        renderLlmComposerState();
        return;
      }
    } catch (error) {
      setLlmSettingsOpen(true);
      setLlmStatus(error?.message || "API設定を確認できませんでした。", "error");
      return;
    }
  }
  await generateLlmExplanation();
}

async function saveLlmApiKey() {
  const apiKey = String(els.llmApiKeyInput?.value || "").trim();
  if (!apiKey) {
    renderLlmSettingsStatus({ configured: false });
    if (els.llmSettingsStatus) els.llmSettingsStatus.textContent = "APIキーを入力してください";
    return;
  }
  els.llmApiKeySave.disabled = true;
  try {
    llmSettingsCache = await llmApiFetch(LLM_SETTINGS_API_PATH, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Quiz-Zen-LLM": "1",
      },
      body: JSON.stringify({ apiKey }),
    });
    els.llmApiKeyInput.value = "";
    renderLlmSettingsStatus(llmSettingsCache);
    setLlmStatus("APIキーを設定しました", "success");
  } catch (error) {
    if (els.llmSettingsStatus) els.llmSettingsStatus.textContent = error?.message || "APIキーを保存できませんでした";
  } finally {
    els.llmApiKeySave.disabled = false;
  }
}

async function deleteLlmApiKey() {
  els.llmApiKeyDelete.disabled = true;
  try {
    llmSettingsCache = await llmApiFetch(LLM_SETTINGS_API_PATH, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Quiz-Zen-LLM": "1",
      },
      body: "{}",
    });
    renderLlmSettingsStatus(llmSettingsCache);
    setLlmStatus("保存済みAPIキーを削除しました", "success");
  } catch (error) {
    if (els.llmSettingsStatus) els.llmSettingsStatus.textContent = error?.message || "APIキーを削除できませんでした";
  } finally {
    renderLlmSettingsStatus(llmSettingsCache);
  }
}

function loadQuizLayoutRatio() {
  try {
    const raw = localStorage.getItem(QUIZ_LAYOUT_STORAGE_KEY);
    return normalizeQuizLayoutRatioSet(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}

function normalizeQuizLayoutRatioSet(value) {
  const question = Number(value?.question);
  const answers = Number(value?.answers);
  if (![question, answers].every((item) => Number.isFinite(item) && item > 0)) return null;
  const total = question + answers;
  if (total <= 0) return null;
  return {
    question: question / total,
    answers: answers / total,
  };
}

function saveQuizLayoutRatio() {
  if (!state.quizLayoutRatio) {
    localStorage.removeItem(QUIZ_LAYOUT_STORAGE_KEY);
    return;
  }
  localStorage.setItem(QUIZ_LAYOUT_STORAGE_KEY, JSON.stringify(state.quizLayoutRatio));
}

function applyQuizLayoutRatio(ratios) {
  const normalized = normalizeQuizLayoutRatioSet(ratios);
  if (!normalized) {
    clearQuizLayoutRatio();
    return;
  }
  els.quizPanel.classList.add("quiz-custom-layout");
  els.quizPanel.style.setProperty("--quiz-question-size", `${normalized.question.toFixed(4)}fr`);
  els.quizPanel.style.setProperty("--quiz-answer-size", `${normalized.answers.toFixed(4)}fr`);
}

function clearQuizLayoutRatio() {
  els.quizPanel.classList.remove("quiz-custom-layout");
  ["--quiz-question-size", "--quiz-answer-size"].forEach((property) => {
    els.quizPanel.style.removeProperty(property);
  });
}

function applyQuizLayoutState(showFeedback) {
  const contentRequiresFlow = els.quizPanel?.dataset.contentFlow === "true";
  const enabled = !showFeedback && !contentRequiresFlow && Boolean(state.quizLayoutRatio);
  if (enabled) {
    applyQuizLayoutRatio(state.quizLayoutRatio);
  } else {
    clearQuizLayoutRatio();
  }
}

function releaseClippedQuizLayout() {
  if (!els.quizPanel) return;
  delete els.quizPanel.dataset.layoutAutoReleased;
  if (els.quizPanel.classList.contains("quiz-custom-layout")) {
    const sections = [els.questionBoard, els.answerDock].filter(Boolean);
    const clipped = sections.some((section) => section.scrollHeight - section.clientHeight > 2);
    if (clipped) {
      clearQuizLayoutRatio();
      els.quizPanel.dataset.layoutAutoReleased = "custom";
    }
  }

  if (
    !els.answerDock ||
    els.quizPanel.classList.contains("review-layout") ||
    els.quizPanel.classList.contains("workbook-layout") ||
    els.quizPanel.classList.contains("content-flow-layout")
  ) {
    return;
  }

  const answerDockClipped = els.answerDock.scrollHeight - els.answerDock.clientHeight > 2;
  if (!answerDockClipped) return;
  els.quizPanel.classList.add("content-flow-layout");
  els.quizPanel.dataset.contentFlow = "true";
  els.quizPanel.dataset.layoutAutoReleased = "answer-dock";
}

function clearSourceLayoutCapacity() {
  els.quizPanel?.style.removeProperty("--source-question-max-height");
  els.quizPanel?.style.removeProperty("--source-panel-height");
}

function scheduleSourceLayoutUpdate() {
  if (sourceLayoutFrame) window.cancelAnimationFrame(sourceLayoutFrame);
  window.clearTimeout(sourceLayoutSettleTimer);
  sourceLayoutFrame = window.requestAnimationFrame(() => {
    sourceLayoutFrame = window.requestAnimationFrame(() => {
      sourceLayoutFrame = null;
      updateSourceLayoutCapacity();
    });
  });
  sourceLayoutSettleTimer = window.setTimeout(() => {
    sourceLayoutSettleTimer = null;
    updateSourceLayoutCapacity();
  }, 400);
}

function updateSourceLayoutCapacity() {
  if (!els.quizPanel || !els.questionBoard) return;
  releaseClippedQuizLayout();
  if (
    isMobileQuizLayout() ||
    !els.quizPanel.classList.contains("source-layout") ||
    !els.quizPanel.classList.contains("review-layout")
  ) {
    clearSourceLayoutCapacity();
    return;
  }

  const playfield = els.quizPanel.closest(".playfield");
  const boundsRect = playfield?.getBoundingClientRect() || els.quizPanel.getBoundingClientRect();
  const visibleBoundsBottom = Math.min(boundsRect.bottom, window.innerHeight);
  const sourcePanelHeight = Math.floor(visibleBoundsBottom - boundsRect.top);
  if (Number.isFinite(sourcePanelHeight) && sourcePanelHeight > 0) {
    els.quizPanel.style.setProperty("--source-panel-height", `${sourcePanelHeight}px`);
  }
  els.quizPanel.style.removeProperty("--source-question-max-height");
}

function isMobileQuizLayout() {
  return window.matchMedia("(max-width: 980px)").matches;
}

function clearReviewLayoutRatios() {
  ["--review-question-size", "--review-answers-size", "--review-feedback-size"].forEach((property) => {
    els.quizPanel.style.removeProperty(property);
  });
}

function applyReviewFocusState(showFeedback) {
  const enabled = Boolean(showFeedback);
  els.quizPanel.classList.toggle("review-layout", enabled);
  delete els.quizPanel.dataset.reviewFocus;
  clearReviewLayoutRatios();
}

function clamp(value, min, max) {
  if (max < min) return 0;
  return Math.min(max, Math.max(min, value));
}

function quizSectionHeights() {
  return {
    question: els.questionBoard?.getBoundingClientRect().height || 0,
    answers: els.answerDock?.getBoundingClientRect().height || 0,
  };
}

function startQuizResizeDrag(event) {
  if (event.button !== undefined && event.button !== 0) return;
  if (els.quizPanel.classList.contains("review-layout")) return;
  const heights = quizSectionHeights();
  const total = heights.question + heights.answers;
  if (total <= 0) return;
  quizResizeDrag = {
    pointerId: event.pointerId,
    startY: event.clientY,
    heights,
    moved: false,
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  document.body.classList.add("quiz-resizing");
  els.quizPanel.classList.add("quiz-resizing");
  document.addEventListener("pointermove", updateQuizResizeDrag, { passive: false });
  document.addEventListener("pointerup", endQuizResizeDrag);
  document.addEventListener("pointercancel", endQuizResizeDrag);
}

function updateQuizResizeDrag(event) {
  if (!quizResizeDrag || event.pointerId !== quizResizeDrag.pointerId) return;
  const delta = event.clientY - quizResizeDrag.startY;
  if (!quizResizeDrag.moved && Math.abs(delta) < REVIEW_RESIZE_POINTER_SLOP) return;
  quizResizeDrag.moved = true;
  event.preventDefault();
  const resized = resizedQuizHeights(quizResizeDrag.heights, delta);
  const ratios = normalizeQuizLayoutRatioSet(resized);
  if (!ratios) return;
  state.quizLayoutRatio = ratios;
  applyQuizLayoutRatio(ratios);
}

function resizedQuizHeights(start, delta) {
  const minDelta = QUIZ_RESIZE_MIN_HEIGHTS.question - start.question;
  const maxDelta = start.answers - QUIZ_RESIZE_MIN_HEIGHTS.answers;
  const clamped = clamp(delta, minDelta, maxDelta);
  return {
    question: start.question + clamped,
    answers: start.answers - clamped,
  };
}

function endQuizResizeDrag(event) {
  if (!quizResizeDrag || (event.pointerId !== undefined && event.pointerId !== quizResizeDrag.pointerId)) return;
  const moved = quizResizeDrag.moved;
  quizResizeDrag = null;
  document.body.classList.remove("quiz-resizing");
  els.quizPanel.classList.remove("quiz-resizing");
  document.removeEventListener("pointermove", updateQuizResizeDrag);
  document.removeEventListener("pointerup", endQuizResizeDrag);
  document.removeEventListener("pointercancel", endQuizResizeDrag);
  if (moved) {
    suppressQuizResizeClickUntil = performance.now() + 450;
    saveQuizLayoutRatio();
  }
}

function suppressQuizResizeClick(event) {
  if (performance.now() <= suppressQuizResizeClickUntil) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function renderQuestion() {
  const questions = visibleQuestions();
  if (!questions.length) {
    renderEmptyQuestion();
    return;
  }
  if (state.questionIndex >= questions.length) state.questionIndex = questions.length - 1;
  if (state.questionIndex < 0) state.questionIndex = 0;
  const question = currentQuestion();
  const view = currentViewQuestion();
  const record = progressFor(question.id);
  const latest = lastAttempt(record);
  const isAnswering = canAnswer(question);
  const showFeedback = shouldShowFeedback(question, record, latest);
  const showReviewSessionSummary = showFeedback && shouldShowReviewSessionSummary(question);
  const showInlineChoiceFeedback = showFeedback && !showReviewSessionSummary && hasVisibleChoiceExplanations(question, view);
  const showFeedbackPanel = showFeedback && (showReviewSessionSummary || !showInlineChoiceFeedback);
  const useReviewLayout = showFeedbackPanel && view.format !== "workbook-page";
  const useMathLayout = viewHasMath(question, view);
  const displayFormatLabel = state.calculationMode
    ? "計算特化"
    : state.nonCalculationMode
      ? "非計算特化"
      : view.formatLabel;

  els.quizPanel.classList.toggle("source-layout", Boolean(view.promptHtml));
  els.quizPanel.classList.toggle("workbook-layout", view.format === "workbook-page");
  els.quizPanel.classList.toggle("math-layout", useMathLayout);
  els.quizPanel.classList.toggle("inline-choice-feedback", showInlineChoiceFeedback);
  applyQuizContentProfile(question, view, showFeedbackPanel);
  applyReviewFocusState(useReviewLayout);
  applyQuizLayoutState(showFeedbackPanel);
  els.formatLabel.textContent = displayFormatLabel;
  els.sideFormatLabel.textContent = displayFormatLabel;
  els.questionNumber.textContent = `Q${state.questionIndex + 1}`;
  els.variantChip.textContent = [displayFormatLabel, variantLabel(question.variant), peQuestionFieldLabel(question)]
    .filter(Boolean)
    .join(" / ");
  renderQuestionSource(question);
  renderKougaiQuestionFrequency(question);
  renderUnderstandingButtons(question);
  renderCalculationMarkerButton(question);
  renderCopyQuestionButton(question);
  renderLlmTeachButton(question);
  syncLlmPanelQuestion(question);
  renderReviewSessionHud(question);
  renderChapterResources(chapter());
  renderAnswerHistoryStrip(record);
  renderQuestionText(
    view.prompt,
    `${question.id}:${view.format}:${view.prompt}:${view.promptHtml || ""}`,
    questionPromptHtml(question, view.promptHtml)
  );
  renderClues(view.clues);
  renderOptions(question, view, latest, isAnswering, showFeedback);
  renderOptionGraphPanel(question, view);
  renderTyping(view, latest, isAnswering);
  renderFeedback(question, view, record, latest, showFeedbackPanel);
  scheduleSourceLayoutUpdate();

  els.prevButton.disabled = questions.length === 0;
  els.nextButton.disabled = questions.length === 0;
  setAdvanceReady(!isAnswering && questions.length > 1);

  if (isAnswering && shouldUseTimerForQuestion(question)) {
    startTimer(question.id);
  } else if (isAnswering) {
    stopTimer();
    showTimerDisabled();
  } else {
    stopTimer();
    showTimerResult(latest);
  }
}

function requestMobileQuizScroll() {
  pendingMobileQuizScroll = true;
}

function flushMobileQuizScroll() {
  if (!pendingMobileQuizScroll) return;
  pendingMobileQuizScroll = false;
  window.requestAnimationFrame(() => {
    if (!window.matchMedia("(max-width: 980px)").matches) return;
    if (!els.questionBoard || !els.options) return;
    const hasVisibleOption = [...els.options.children].some((option) => {
      const rect = option.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    if (hasVisibleOption) return;
    els.questionBoard.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
  });
}

function renderEmptyQuestion() {
  state.questionIndex = 0;
  stopTimer();
  clearResultDisplays();
  const searchQuery = normalizeSectionSearchQuery(state.sectionSearchQuery);
  const searchMatchCount = searchQuery ? orderedSectionQuestions().filter((question) => questionMatchesSectionSearch(question)).length : 0;
  const activeModeLabel = state.favoriteMode
    ? "学習対象"
    : state.calculationMode
      ? "計算特化"
      : state.nonCalculationMode
        ? "非計算特化"
        : state.unansweredMode
          ? "未回答のみ"
          : state.followUpMode
            ? "不正解のみ"
            : "";
  const emptyModeLabel = searchQuery
    ? "検索結果"
    : state.favoriteMode
    ? "学習対象"
    : state.calculationMode
      ? "計算特化"
      : state.nonCalculationMode
        ? "非計算特化"
        : state.unansweredMode
          ? "未回答のみ"
          : state.followUpMode
            ? "不正解のみ"
            : "未出題";
  const emptyVariantLabel = searchQuery
    ? "該当なし"
    : state.favoriteMode
    ? "学習対象なし"
    : state.calculationMode
      ? "計算問題なし"
      : state.nonCalculationMode
        ? "非計算問題なし"
        : state.unansweredMode
          ? "未回答なし"
          : state.followUpMode
            ? "不正解なし"
            : "問題なし";
  const emptyMessage = searchQuery
    ? searchMatchCount && activeModeLabel
      ? `「${searchQuery}」は${searchMatchCount}件ありますが、${activeModeLabel}には該当しません`
      : `「${searchQuery}」に一致する問題はありません`
    : state.unansweredMode
    ? "未回答の問題はありません"
    : state.favoriteMode
      ? "完全理解またはやる価値なしの問題だけです"
      : state.calculationMode
        ? "このセクションに計算問題マークはありません"
        : state.nonCalculationMode
          ? "このセクションに非計算問題はありません"
          : state.followUpMode
            ? "不正解の問題はありません"
            : "このチャプターに問題がありません";
  els.formatLabel.textContent = emptyModeLabel;
  els.sideFormatLabel.textContent = els.formatLabel.textContent;
  els.questionNumber.textContent = "Q0";
  els.variantChip.textContent = emptyVariantLabel;
  renderQuestionSource(null);
  renderKougaiQuestionFrequency(null);
  renderUnderstandingButtons(null);
  renderCalculationMarkerButton(null);
  renderCopyQuestionButton(null);
  renderLlmTeachButton(null);
  syncLlmPanelQuestion(null);
  renderChapterResources(chapter());
  renderAnswerHistoryStrip(null);
  hideReviewSessionHud();
  els.quizPanel.classList.remove("source-layout");
  els.quizPanel.classList.remove("workbook-layout");
  els.quizPanel.classList.remove("math-layout");
  els.quizPanel.classList.remove("long-question-layout");
  clearQuizContentProfile();
  clearQuizLayoutRatio();
  finishQuestionTypewriter(emptyMessage);
  renderClues([]);
  els.options.innerHTML = "";
  els.options.classList.remove("judge-options");
  delete els.options.dataset.optionCount;
  els.options.style.removeProperty("--option-row-count");
  clearOptionGraphPanel();
  applyReviewFocusState(false);
  renderTyping({ typing: false }, null, false);
  clearFeedbackDisplay();
  els.prevButton.disabled = true;
  els.nextButton.disabled = true;
  setAdvanceReady(false);
  els.timerValue.textContent = "--";
  els.timerBar.style.width = "0%";
  els.timerBar.classList.remove("danger");
  els.timeCard?.classList.toggle("timer-disabled", !state.timerEnabled);
}

function renderClues(clues) {
  if (!clues.length) {
    els.clueBox.classList.add("hidden");
    els.clueBox.innerHTML = "";
    return;
  }
  els.clueBox.classList.remove("hidden");
  els.clueBox.innerHTML = clues
    .map((clue, index) => `<div><span>HINT ${index + 1}</span>${escapeHtml(clue)}</div>`)
    .join("");
  renderMathInNode(els.clueBox);
}

function resourceKindLabel(kind) {
  return {
    video: "動画",
    problemPdf: "問題",
    answerPdf: "解答",
    formulaPdf: "公式",
  }[kind] || "教材";
}

function resourceKindIcon(kind) {
  return {
    video: "play",
    problemPdf: "file-text",
    answerPdf: "check-circle",
    formulaPdf: "book-open",
  }[kind] || "external-link";
}

function renderChapterResources(chapterItem = chapter()) {
  if (!els.chapterResources) return;
  const resources = Array.isArray(chapterItem?.resources) ? chapterItem.resources : [];
  if (!resources.length) {
    els.chapterResources.classList.add("hidden");
    els.chapterResources.innerHTML = "";
    return;
  }
  els.chapterResources.classList.remove("hidden");
  els.chapterResources.innerHTML = resources
    .filter((item) => item?.url)
    .map((item) => {
      const kind = String(item.kind || "");
      const provider = String(item.provider || "教材");
      const title = String(item.title || resourceKindLabel(kind));
      return `
        <a class="chapter-resource-card ${escapeHtml(kind)}" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">
          <i data-lucide="${escapeHtml(resourceKindIcon(kind))}" aria-hidden="true"></i>
          <span>${escapeHtml(resourceKindLabel(kind))}</span>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(provider)}</small>
        </a>
      `;
    })
    .join("");
  normalizeExternalLinks(els.chapterResources);
}

function optionGraphKey(question, view) {
  const optionKey = (view.options || [])
    .map((option, index) => `${index}:${option.text || ""}:${option.html || ""}`)
    .join("|");
  return `${question?.id || "empty"}:${view?.format || "none"}:${view?.prompt || ""}:${view?.promptHtml || ""}:${optionKey}`;
}

function graphExpressionForOption(option) {
  const graphing = window.QuizGraphingCalculator;
  if (!graphing?.expressionFromText || !option) return "";
  const sourceText = htmlToClipboardText(option.html) || normalizeClipboardText(option.text);
  return graphing.expressionFromText(sourceText) || "";
}

function graphExpressionForMathNode(node) {
  const graphing = window.QuizGraphingCalculator;
  if (!graphing?.expressionFromText || !node) return "";
  const sourceText =
    node.querySelector?.("annotation[encoding='application/x-tex']")?.textContent ||
    node.getAttribute?.("data-graph-expression-source") ||
    node.textContent ||
    "";
  return graphing.expressionFromText(sourceText) || "";
}

function graphItemsForQuestionText() {
  if (!els.questionText) return [];
  const nodes = [...els.questionText.querySelectorAll(".katex")];
  const usedExpressions = new Set();
  return nodes
    .map((node, index) => {
      const expression = graphExpressionForMathNode(node);
      if (!expression || usedExpressions.has(expression)) return null;
      usedExpressions.add(expression);
      return {
        id: `question-${index}`,
        label: "問題文",
        source: "question",
        expression,
        enabled: true,
      };
    })
    .filter(Boolean);
}

function graphItemsForOptions(view) {
  if (!Array.isArray(view?.options)) return [];
  return view.options
    .map((option, index) => {
      const label = optionLetter(index, view);
      const expression = graphExpressionForOption(option);
      if (!expression) return null;
      return {
        id: `choice-${index}`,
        label,
        source: "option",
        expression,
        enabled: true,
      };
    })
    .filter(Boolean);
}

function graphItemsForView(view) {
  return [...graphItemsForQuestionText(), ...graphItemsForOptions(view)];
}

function bindQuestionGraphFormulas() {
  if (!els.questionText) return;
  const nodes = [...els.questionText.querySelectorAll(".katex")];
  const usedExpressions = new Set();
  nodes.forEach((node, index) => {
    const expression = graphExpressionForMathNode(node);
    if (!expression || usedExpressions.has(expression)) return;
    usedExpressions.add(expression);
    const itemId = `question-${index}`;
    node.classList.add("graphable-question-formula");
    node.dataset.graphItemId = itemId;
    node.tabIndex = 0;
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", `${expression}をグラフ化`);
    node.addEventListener("mouseenter", () => showOptionGraphPrompt(itemId, node));
    node.addEventListener("mouseleave", scheduleOptionGraphPromptHide);
    node.addEventListener("focusin", () => showOptionGraphPrompt(itemId, node));
    node.addEventListener("focusout", scheduleOptionGraphPromptHide);
  });
}

function ensureOptionGraphPrompt() {
  if (optionGraphPromptEl) return optionGraphPromptEl;
  optionGraphPromptEl = document.createElement("div");
  optionGraphPromptEl.id = "optionGraphPrompt";
  optionGraphPromptEl.className = "option-graph-popover hidden";
  optionGraphPromptEl.setAttribute("role", "dialog");
  optionGraphPromptEl.setAttribute("aria-label", "数式をグラフ化");
  document.body.appendChild(optionGraphPromptEl);
  optionGraphPromptEl.addEventListener("pointerenter", cancelOptionGraphPromptHide);
  optionGraphPromptEl.addEventListener("pointerleave", scheduleOptionGraphPromptHide);
  optionGraphPromptEl.addEventListener("focusin", cancelOptionGraphPromptHide);
  optionGraphPromptEl.addEventListener("focusout", scheduleOptionGraphPromptHide);
  optionGraphPromptEl.addEventListener("pointerdown", (event) => event.stopPropagation());
  optionGraphPromptEl.addEventListener("click", handleOptionGraphPromptClick);
  return optionGraphPromptEl;
}

function cancelOptionGraphPromptHide() {
  if (optionGraphPromptTimer) clearTimeout(optionGraphPromptTimer);
  optionGraphPromptTimer = null;
}

function isInOptionGraphPromptZone(target) {
  if (!target) return false;
  if (optionGraphPromptEl?.contains(target)) return true;
  if (optionGraphPromptAnchorEl?.contains?.(target)) return true;
  return Boolean(target.closest?.(".graphable-option-item, .graphable-question-formula"));
}

function scheduleOptionGraphPromptHide(event) {
  if (isInOptionGraphPromptZone(event?.relatedTarget)) return;
  hideOptionGraphPrompt(false, 360);
}

function hideOptionGraphPrompt(immediate = false, delay = 260) {
  cancelOptionGraphPromptHide();
  const hide = () => {
    optionGraphPromptEl?.classList.add("hidden");
    optionGraphPromptIndex = -1;
    optionGraphPromptAnchorEl = null;
  };
  if (immediate) {
    hide();
    return;
  }
  optionGraphPromptTimer = window.setTimeout(() => {
    hide();
    optionGraphPromptTimer = null;
  }, 140);
}

function optionGraphAnchorRectFor(anchor) {
  const candidates = [
    anchor?.querySelector?.(".option-content .katex"),
    anchor?.querySelector?.(".option-content"),
    anchor,
  ].filter(Boolean);
  const rect =
    candidates
      .map((element) => element.getBoundingClientRect?.())
      .find((item) => item && item.width > 0 && item.height > 0) || null;
  if (!rect) return null;
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function positionOptionGraphPrompt(anchor) {
  if (!optionGraphPromptEl || !anchor) return;
  const anchorRect = optionGraphAnchorRectFor(anchor);
  if (!anchorRect) return;
  optionGraphAnchorRect = anchorRect;
  const promptRect = optionGraphPromptEl.getBoundingClientRect();
  const margin = 10;
  let placeLeft = false;
  let left = anchorRect.right + 10;
  let top = anchorRect.top + anchorRect.height / 2 - promptRect.height / 2;
  if (left + promptRect.width > window.innerWidth - margin) {
    left = anchorRect.left - promptRect.width - 10;
    placeLeft = true;
  }
  left = Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - promptRect.width - margin));
  top = Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - promptRect.height - margin));
  optionGraphPromptEl.classList.toggle("place-left", placeLeft);
  optionGraphPromptEl.style.left = `${Math.round(left)}px`;
  optionGraphPromptEl.style.top = `${Math.round(top)}px`;
}

function showOptionGraphPrompt(itemId, anchor) {
  const view = currentViewQuestion();
  const items = graphItemsForView(view);
  const focusedItem = items.find((item) => item.id === itemId);
  if (!focusedItem || !anchor) return;
  if (optionGraphPromptTimer) clearTimeout(optionGraphPromptTimer);
  optionGraphPromptTimer = null;
  optionGraphPromptIndex = Number.parseInt(String(itemId).replace(/\D+/g, ""), 10);
  optionGraphPromptAnchorEl = anchor;

  const prompt = ensureOptionGraphPrompt();
  prompt.dataset.graphItemId = itemId;
  prompt.innerHTML = `
    <div>
      <strong>${escapeHtml(focusedItem.label)}: ${escapeHtml(focusedItem.expression)}</strong>
      <span>この式だけを可視化</span>
    </div>
    <button type="button" data-option-graph-prompt-action="open">
      <i data-lucide="line-chart"></i>
      <span>グラフ化</span>
    </button>
  `;
  prompt.classList.remove("hidden");
  renderIcons();
  requestAnimationFrame(() => positionOptionGraphPrompt(anchor));
}

function handleOptionGraphPromptClick(event) {
  const action = event.target?.closest?.("[data-option-graph-prompt-action]")?.dataset.optionGraphPromptAction;
  if (action !== "open") return;
  event.preventDefault();
  event.stopPropagation();
  optionGraphActiveId = optionGraphPromptEl?.dataset.graphItemId || "";
  optionGraphActiveIndex = Number(optionGraphPromptEl?.dataset.optionIndex ?? optionGraphPromptIndex);
  optionGraphFloatingPosition = null;
  optionGraphOpen = true;
  hideOptionGraphPrompt(true);
  renderOptionGraphPanel(currentQuestion(), currentViewQuestion());
  scheduleSourceLayoutUpdate();
}

function clampOptionGraphPanelPosition(left, top, rect) {
  const margin = 12;
  const width = rect?.width || 780;
  const height = rect?.height || 520;
  return {
    left: Math.round(Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - width - margin))),
    top: Math.round(Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - height - margin))),
  };
}

function positionOptionGraphPanel(anchorRect = optionGraphAnchorRect) {
  if (!els.optionGraphPanel || els.optionGraphPanel.classList.contains("hidden")) return;
  const rect = els.optionGraphPanel.getBoundingClientRect();
  if (!optionGraphFloatingPosition) {
    const margin = 12;
    const rightSideFits = anchorRect && anchorRect.right + rect.width + margin <= window.innerWidth;
    let left = rightSideFits
      ? anchorRect.right + margin
      : Math.max(margin, window.innerWidth - rect.width - margin);
    let top = anchorRect
      ? anchorRect.top + anchorRect.height / 2 - rect.height / 2
      : (window.innerHeight - rect.height) / 2;
    optionGraphFloatingPosition = clampOptionGraphPanelPosition(left, top, rect);
  }
  const position = clampOptionGraphPanelPosition(
    optionGraphFloatingPosition.left,
    optionGraphFloatingPosition.top,
    rect
  );
  optionGraphFloatingPosition = position;
  els.optionGraphPanel.style.left = `${position.left}px`;
  els.optionGraphPanel.style.top = `${position.top}px`;
}

function clearOptionGraphPanel() {
  optionGraphCalculator?.destroy?.();
  optionGraphCalculator = null;
  optionGraphOpen = false;
  optionGraphQuestionKey = "";
  optionGraphItems = [];
  optionGraphActiveIndex = -1;
  optionGraphActiveId = "";
  optionGraphAnchorRect = null;
  optionGraphFloatingPosition = null;
  optionGraphPanelDrag = null;
  hideOptionGraphPrompt(true);
  els.quizPanel?.classList.remove("has-option-graph", "option-graph-open");
  if (!els.optionGraphPanel) return;
  els.optionGraphPanel.classList.add("hidden");
  els.optionGraphPanel.classList.remove("open");
  els.optionGraphPanel.style.removeProperty("left");
  els.optionGraphPanel.style.removeProperty("top");
  els.optionGraphPanel.innerHTML = "";
}

function renderOptionGraphPanel(question, view) {
  if (!els.optionGraphPanel) return;
  const key = optionGraphKey(question, view);
  if (optionGraphQuestionKey !== key) {
    optionGraphCalculator?.destroy?.();
    optionGraphCalculator = null;
    optionGraphOpen = false;
    optionGraphQuestionKey = key;
    optionGraphActiveIndex = -1;
    optionGraphActiveId = "";
    optionGraphAnchorRect = null;
    optionGraphFloatingPosition = null;
    hideOptionGraphPrompt(true);
  }
  optionGraphItems = graphItemsForView(view);
  els.quizPanel?.classList.toggle("has-option-graph", optionGraphItems.length > 0);
  els.quizPanel?.classList.toggle("option-graph-open", optionGraphOpen && optionGraphItems.length > 0);
  if (!optionGraphItems.length) {
    optionGraphCalculator?.destroy?.();
    optionGraphCalculator = null;
    els.optionGraphPanel.classList.add("hidden");
    els.optionGraphPanel.classList.remove("open");
    els.optionGraphPanel.innerHTML = "";
    return;
  }
  if (!optionGraphOpen) {
    optionGraphCalculator?.destroy?.();
    optionGraphCalculator = null;
    els.optionGraphPanel.classList.add("hidden");
    els.optionGraphPanel.classList.remove("open");
    els.optionGraphPanel.innerHTML = "";
    return;
  }
  const activeGraphItem = optionGraphItems.find((item) => item.id === optionGraphActiveId);
  if (!activeGraphItem) {
    optionGraphCalculator?.destroy?.();
    optionGraphCalculator = null;
    optionGraphOpen = false;
    optionGraphActiveIndex = -1;
    optionGraphActiveId = "";
    optionGraphFloatingPosition = null;
    els.optionGraphPanel.classList.add("hidden");
    els.optionGraphPanel.classList.remove("open");
    els.optionGraphPanel.innerHTML = "";
    return;
  }
  const graphPanelItems = [
    { ...activeGraphItem, enabled: true },
    ...optionGraphItems
      .filter((item) => item.id !== activeGraphItem.id)
      .map((item) => ({ ...item, enabled: false })),
  ];
  const activeGraphLabel = activeGraphItem?.label || "";
  const activeGraphTitle =
    activeGraphItem?.source === "option" ? `選択肢${activeGraphLabel}のグラフ` : `${activeGraphLabel}のグラフ`;

  els.optionGraphPanel.classList.remove("hidden");
  els.optionGraphPanel.classList.add("open");
  els.optionGraphPanel.dataset.graphTheme = optionGraphTheme;
  els.optionGraphPanel.innerHTML = `
    <div class="option-graph-toolbar" data-option-graph-drag-handle>
      <strong class="option-graph-title">
        <i data-lucide="line-chart"></i>
        <span>${escapeHtml(activeGraphTitle)}</span>
      </strong>
      <div class="option-graph-window-actions">
        ${optionGraphThemeToggleHtml(optionGraphTheme)}
        <button class="option-graph-toggle" type="button" data-option-graph-action="toggle" aria-expanded="true">
          <i data-lucide="x"></i>
          <span>閉じる</span>
        </button>
      </div>
    </div>
    <div class="option-graph-body">
      <div class="option-graph-mount" data-option-graph-mount></div>
    </div>
  `;
  renderIcons();
  positionOptionGraphPanel();
  const mount = els.optionGraphPanel.querySelector("[data-option-graph-mount]");
  if (!mount || !window.QuizGraphingCalculator?.create) return;
  optionGraphCalculator?.destroy?.();
  optionGraphCalculator = window.QuizGraphingCalculator.create(mount, graphPanelItems, {
    theme: optionGraphTheme,
  });
}

function optionGraphThemeToggleHtml(theme) {
  const light = theme === "light";
  return `
    <button
      class="option-graph-theme-toggle"
      type="button"
      role="switch"
      aria-checked="${light ? "true" : "false"}"
      aria-label="ライトモード"
      data-option-graph-action="theme"
      data-theme-state="${light ? "light" : "dark"}"
    >
      <span class="option-graph-switch-track" aria-hidden="true">
        <span class="option-graph-switch-thumb">
          <i data-lucide="${light ? "sun" : "moon"}"></i>
        </span>
      </span>
      <span class="option-graph-theme-label">ライト</span>
    </button>
  `;
}

function handleOptionGraphPanelClick(event) {
  const action = event.target?.closest?.("[data-option-graph-action]")?.dataset.optionGraphAction;
  if (!action) return;
  event.preventDefault();
  if (action === "theme") {
    optionGraphTheme = optionGraphTheme === "dark" ? "light" : "dark";
    els.optionGraphPanel.dataset.graphTheme = optionGraphTheme;
    optionGraphCalculator?.setTheme?.(optionGraphTheme);
    const button = event.target.closest("[data-option-graph-action='theme']");
    if (button) {
      button.outerHTML = optionGraphThemeToggleHtml(optionGraphTheme);
      renderIcons();
    }
    return;
  }
  if (action !== "toggle") return;
  optionGraphOpen = false;
  optionGraphActiveIndex = -1;
  optionGraphActiveId = "";
  optionGraphFloatingPosition = null;
  renderOptionGraphPanel(currentQuestion(), currentViewQuestion());
  scheduleSourceLayoutUpdate();
}

function handleOptionGraphPanelPointerDown(event) {
  const handle = event.target?.closest?.("[data-option-graph-drag-handle]");
  if (!handle || event.target?.closest?.("button, input, textarea, select")) return;
  const rect = els.optionGraphPanel.getBoundingClientRect();
  optionGraphPanelDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
  els.optionGraphPanel.classList.add("dragging");
  els.optionGraphPanel.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function handleOptionGraphPanelPointerMove(event) {
  if (!optionGraphPanelDrag || optionGraphPanelDrag.pointerId !== event.pointerId) return;
  const next = clampOptionGraphPanelPosition(
    optionGraphPanelDrag.left + event.clientX - optionGraphPanelDrag.startX,
    optionGraphPanelDrag.top + event.clientY - optionGraphPanelDrag.startY,
    optionGraphPanelDrag
  );
  optionGraphFloatingPosition = next;
  els.optionGraphPanel.style.left = `${next.left}px`;
  els.optionGraphPanel.style.top = `${next.top}px`;
  event.preventDefault();
}

function handleOptionGraphPanelPointerUp(event) {
  if (!optionGraphPanelDrag || optionGraphPanelDrag.pointerId !== event.pointerId) return;
  els.optionGraphPanel.releasePointerCapture?.(event.pointerId);
  els.optionGraphPanel.classList.remove("dragging");
  optionGraphPanelDrag = null;
}

function handleOptionGraphDocumentPointerDown(event) {
  if (!optionGraphPromptEl || optionGraphPromptEl.classList.contains("hidden")) return;
  const target = event.target;
  if (optionGraphPromptEl.contains(target)) return;
  if (target?.closest?.(".graphable-option-item")) return;
  if (target?.closest?.(".graphable-question-formula")) return;
  hideOptionGraphPrompt(true);
}

function handleOptionGraphKeydown(event) {
  if (event.key !== "Escape") return;
  hideOptionGraphPrompt(true);
  if (optionGraphOpen) {
    optionGraphOpen = false;
    optionGraphActiveIndex = -1;
    optionGraphActiveId = "";
    optionGraphFloatingPosition = null;
    renderOptionGraphPanel(currentQuestion(), currentViewQuestion());
  }
}

function handleOptionGraphWindowResize() {
  if (!optionGraphOpen || !els.optionGraphPanel || els.optionGraphPanel.classList.contains("hidden")) return;
  positionOptionGraphPanel();
}

function renderOptions(question, view, latest, isAnswering, showFeedback) {
  els.options.innerHTML = "";
  resetScrollPosition(els.answerDock);
  resetScrollPosition(els.options);
  els.options.classList.toggle("judge-options", view.format === "judge");
  els.options.dataset.optionCount = String(view.options.length || 0);
  els.options.style.setProperty("--option-row-count", String(Math.max(1, view.options.length || 0)));
  const choiceExplanations = showFeedback ? sourceChoiceExplanations(question) : new Map();
  const choiceVerdicts = showFeedback ? sourceChoiceVerdicts(question, view, choiceExplanations) : new Map();

  view.options.forEach((option, index) => {
    const item = document.createElement("article");
    item.className = "option-item";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    const labelText = optionLetter(index, view);
    const hideDuplicateText = shouldHideDuplicateOptionText(question, view, option, labelText);
    const optionContent = hideDuplicateText ? "" : option.html || escapeHtml(option.text);
    const sourceIndex = Number.isInteger(option.sourceIndex) ? option.sourceIndex : -1;
    const verdictBadge = optionVerdictBadgeHtml(choiceVerdicts.get(sourceIndex));
    const labelHtml =
      view.format === "workbook-page" ? "" : `<span class="option-letter">${escapeHtml(labelText)}</span>`;
    button.innerHTML = `
      ${labelHtml}
      <span class="option-content">${optionContent}${verdictBadge}</span>
    `;
    normalizeQuizImages(button);
    renderMathInNode(button);
    const graphExpression = graphExpressionForOption(option);
    if (graphExpression) {
      const graphItemId = `choice-${index}`;
      item.classList.add("graphable-option-item");
      item.dataset.optionGraphIndex = String(index);
      item.dataset.graphItemId = graphItemId;
      item.addEventListener("mouseenter", () => showOptionGraphPrompt(graphItemId, button));
      item.addEventListener("mouseleave", scheduleOptionGraphPromptHide);
      item.addEventListener("focusin", () => showOptionGraphPrompt(graphItemId, button));
      item.addEventListener("focusout", scheduleOptionGraphPromptHide);
    }
    button.addEventListener("click", () => answerChoiceFromOption(index));
    button.addEventListener("touchstart", (event) => startOptionTouch(index, event), {
      passive: true,
    });
    button.addEventListener("touchmove", (event) => updateOptionTouch(index, event), {
      passive: true,
    });
    button.addEventListener("touchend", (event) => answerChoiceFromOptionTouch(index, event), {
      passive: false,
    });
    button.addEventListener("touchcancel", () => {
      optionTouchGesture = null;
    });
    if (showFeedback && latest) {
      if (option.correct) button.classList.add("correct");
      if (optionMatchesAttempt(option, latest) && !latest.correct) button.classList.add("incorrect");
    }
    if (!isAnswering && latest) {
      button.disabled = true;
    }
    item.appendChild(button);

    const inlineExplanation = inlineOptionExplanationHtml(view, latest, option, index, choiceExplanations);
    if (inlineExplanation) {
      item.classList.add("has-explanation");
      const explanation = document.createElement("div");
      explanation.innerHTML = inlineExplanation;
      normalizeQuizImages(explanation);
      renderMathInNode(explanation);
      item.append(...explanation.childNodes);
    }

    els.options.appendChild(item);
  });
  resetScrollPosition(els.answerDock);
  resetScrollPosition(els.options);
  if (showFeedback) resetAnswerDockAfterLayout();
}

function answerChoiceFromOption(index) {
  if (performance.now() < suppressOptionClickUntil) return;
  if (lastTouchAnswerIndex === index && performance.now() - lastTouchAnswerAt < 700) return;
  answerChoice(index);
}

function startOptionTouch(index, event) {
  const touch = event.changedTouches?.[0] || event.touches?.[0];
  if (!touch) {
    optionTouchGesture = null;
    return;
  }
  optionTouchGesture = {
    index,
    startX: touch.clientX,
    startY: touch.clientY,
    moved: false,
  };
}

function updateOptionTouch(index, event) {
  const touch = event.changedTouches?.[0] || event.touches?.[0];
  if (!touch || !optionTouchGesture || optionTouchGesture.index !== index) return;
  if (touchMovedBeyondTap(optionTouchGesture, touch)) {
    optionTouchGesture.moved = true;
    suppressOptionClickUntil = performance.now() + 700;
  }
}

function answerChoiceFromOptionTouch(index, event) {
  const button = event.currentTarget;
  if (button?.disabled) return;
  const touch = event.changedTouches?.[0];
  const isScrollGesture =
    !optionTouchGesture ||
    optionTouchGesture.index !== index ||
    optionTouchGesture.moved ||
    (touch && touchMovedBeyondTap(optionTouchGesture, touch));
  optionTouchGesture = null;
  if (isScrollGesture) {
    suppressOptionClickUntil = performance.now() + 700;
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  lastTouchAnswerIndex = index;
  lastTouchAnswerAt = performance.now();
  answerChoice(index);
}

function touchMovedBeyondTap(gesture, touch) {
  return Math.hypot(touch.clientX - gesture.startX, touch.clientY - gesture.startY) > OPTION_TOUCH_TAP_SLOP;
}

function optionLetter(index, viewOrFormat) {
  const format = typeof viewOrFormat === "string" ? viewOrFormat : viewOrFormat?.format;
  const labels = typeof viewOrFormat === "string" ? null : viewOrFormat?.optionLabels;
  if (labels?.[index]) return labels[index];
  if (format === "judge") return index === 0 ? "A" : "B";
  return String.fromCharCode(65 + index);
}

function renderTyping(view, latest, isAnswering) {
  if (!view.typing) {
    els.typingPanel.classList.add("hidden");
    els.typingInput.value = "";
    return;
  }

  els.typingPanel.classList.remove("hidden");
  els.typingInput.disabled = !isAnswering;
  els.typingSubmit.disabled = !isAnswering;
  els.typingHint.textContent = view.typingHint;
  els.typingInput.placeholder = view.typingHint;
  els.typingInput.value = !isAnswering && latest ? latest.choiceLabel || "" : "";
}

function shouldShowFeedback(question, record, latest) {
  return Boolean(record && latest && state.retakeQuestionId !== question.id);
}

function shouldShowReviewSessionSummary(question) {
  if (!question || !isReviewCurriculumChapter(chapter())) return false;
  const stats = reviewSessionStats(chapter());
  return stats.active && stats.completed > 0;
}

function reviewSessionQuestionFocusLabel(question) {
  const source = sourceQuestionFor(question) || question;
  const parts = [
    source?.sourceSubject,
    state.courseId === "pe-first-info" ? shortPeFieldLabel(source?.sourceField) : source?.sourceField,
    source?.sourceYear,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  const unique = parts.filter((part, index) => parts.indexOf(part) === index);
  return unique.slice(0, 2).join(" / ") || "復習対象";
}

function reviewSessionCountRows(values, limit = 3) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"))
    .slice(0, limit);
}

function reviewSessionDebriefHtml(stats, complete) {
  if (!complete) return "";
  const pairs = stats.questions
    .map((item, index) => ({
      question: item,
      attempt: stats.attempts[index],
      record: progressFor(item?.id),
    }))
    .filter((item) => item.question && item.attempt);
  const wrongPairs = pairs.filter((item) => !item.attempt.correct);
  const focusPairs = wrongPairs.length ? wrongPairs : pairs;
  const focusRows = reviewSessionCountRows(
    focusPairs.map((item) => reviewSessionQuestionFocusLabel(item.question)),
    4
  );
  const nextRows = reviewSessionCountRows(
    pairs
      .map((item) => reviewDueDayForRecord(item.record))
      .filter(Boolean)
      .map(formatStudyDay),
    3
  );
  const startedAt = Number(chapter()?.reviewStartedAt || 0);
  const durationText = startedAt ? formatStudyDuration(Math.max(0, Date.now() - startedAt)) : "--";
  const focusHeadline = wrongPairs.length
    ? `ミス ${wrongPairs.length}問`
    : `${stats.total}問完了`;
  const nextHeadline = nextRows[0] ? `${nextRows[0].label} ${nextRows[0].count}問` : "次回未定";
  const coach = wrongPairs.length
    ? "次は間違えた問題だけを短く解き直すのが効率的です"
    : "このセットは完了です。期限が近い復習か弱点セットへ進みます";
  return `
    <div class="review-session-debrief" aria-label="復習セッション診断">
      <div class="review-session-debrief-head">
        <div>
          <span>DEBRIEF</span>
          <strong>${escapeHtml(focusHeadline)}</strong>
        </div>
        <small>${escapeHtml(durationText)}</small>
      </div>
      <div class="review-session-debrief-grid">
        <div>
          <span>次回予定</span>
          <strong>${escapeHtml(nextHeadline)}</strong>
        </div>
        <div>
          <span>重点</span>
          <strong>${escapeHtml(focusRows[0]?.label || "復習対象")}</strong>
        </div>
        <div>
          <span>仕上がり</span>
          <strong>${stats.accuracyPercent}%</strong>
        </div>
      </div>
      ${
        focusRows.length
          ? `<div class="review-session-debrief-tags" aria-label="重点単元">
              ${focusRows
                .map(
                  (row) => `
                    <span title="${escapeHtml(row.label)}">
                      ${escapeHtml(shortText(row.label, 26))}
                      <b>${row.count}</b>
                    </span>
                  `
                )
                .join("")}
            </div>`
          : ""
      }
      <p>${escapeHtml(coach)}</p>
    </div>
  `;
}

function reviewSessionNextPlayCardHtml({ action, kind = "neutral", label, value, detail, badge }) {
  return `
    <button
      class="review-session-next-card ${escapeHtml(kind)}"
      type="button"
      data-review-session-action="${escapeHtml(action)}"
      title="${escapeHtml(`${label} / ${value} / ${detail}`)}"
    >
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
      ${badge ? `<b>${escapeHtml(badge)}</b>` : ""}
    </button>
  `;
}

function reviewSessionNextMissionCard() {
  const mission = nextReviewMissionCandidate();
  if (!mission) return null;
  const detailParts = [mission.value, mission.detail].filter(Boolean);
  return {
    action: "next-mission",
    kind: "primary",
    label: "次の復習",
    value: mission.label || "開始",
    detail: detailParts.join(" / ") || "復習キューへ",
    badge: "NEXT",
  };
}

function reviewSessionSummaryCard(stats, kind = "neutral") {
  return {
    action: "summary",
    kind,
    label: "確認",
    value: "サマリー",
    detail: `${stats.completed}/${stats.total}問完了`,
  };
}

function reviewSessionExitCard() {
  return {
    action: "exit",
    kind: "neutral",
    label: "終了",
    value: "通常へ",
    detail: "復習モードを閉じる",
  };
}

function reviewSessionNextPlayHtml(stats, complete) {
  const cards = [];
  if (!complete) {
    cards.push({
      action: "next-open",
      kind: "primary",
      label: "続き",
      value: `${stats.remaining}問`,
      detail: "未回答へ",
      badge: "NEXT",
    });
    cards.push(reviewSessionSummaryCard(stats));
    cards.push(reviewSessionExitCard());
  } else if (stats.wrong) {
    const missionCard = reviewSessionNextMissionCard();
    cards.push(
      {
        action: "retry-wrong",
        kind: "danger",
        label: "最優先",
        value: `ミス ${stats.wrong}問`,
        detail: "間違えた問題だけ",
        badge: "PRIORITY",
      }
    );
    if (missionCard) cards.push(missionCard);
    cards.push(reviewSessionSummaryCard(stats));
    if (!missionCard) cards.push(reviewSessionExitCard());
  } else {
    const missionCard = reviewSessionNextMissionCard();
    if (missionCard) {
      cards.push(missionCard);
      cards.push(reviewSessionSummaryCard(stats));
    } else {
      cards.push(reviewSessionSummaryCard(stats, "primary"));
    }
    cards.push(reviewSessionExitCard());
  }
  return `
    <div class="review-session-next-play" aria-label="次にやること">
      <div class="review-session-next-head">
        <span>次のアクション</span>
        <strong>${complete ? "このあと何をやるか" : "まずセットを終わらせる"}</strong>
      </div>
      <div class="review-session-next-grid">
        ${cards.map(reviewSessionNextPlayCardHtml).join("")}
      </div>
    </div>
  `;
}

function reviewSessionSummaryHtml(question) {
  const reviewChapter = chapter();
  if (!isReviewCurriculumChapter(reviewChapter) || !question) return "";
  const stats = reviewSessionStats(reviewChapter);
  if (!stats.active || !stats.completed) return "";
  const complete = stats.completed >= stats.total;
  const currentMeta = reviewSessionMetaForQuestion(question, reviewChapter);
  const status = complete
    ? stats.wrong
      ? "ミスだけ再挑戦できる"
      : "このセットは仕上がり"
    : `${stats.remaining}問残り`;
  const nextText = currentMeta?.dueDay
    ? formatStudyDay(currentMeta.dueDay)
    : stats.nextDueDay
      ? formatStudyDay(stats.nextDueDay)
      : "予定なし";
  const retentionText = stats.retentionAverage == null ? "--" : `${stats.retentionAverage}%`;
  return `
    <section class="review-session-summary${complete ? " complete" : ""}" aria-label="復習セッション結果">
      <div class="review-session-summary-head">
        <span>${complete ? "SESSION COMPLETE" : "SESSION PROGRESS"}</span>
        <strong>${complete ? "復習セッション完走" : "復習セッション進行中"}</strong>
        <small>${escapeHtml(status)}</small>
      </div>
      <div class="review-session-summary-meter" aria-hidden="true"><span style="width: ${stats.progressPercent}%"></span></div>
      <div class="review-session-summary-grid">
        <div><span>完了</span><strong>${stats.completed}/${stats.total}</strong></div>
        <div><span>正答率</span><strong>${stats.accuracyPercent}%</strong></div>
        <div><span>再挑戦</span><strong>${stats.wrong}</strong></div>
        <div><span>平均保持</span><strong>${escapeHtml(retentionText)}</strong></div>
        <div><span>次回目安</span><strong>${escapeHtml(nextText)}</strong></div>
      </div>
      ${reviewSessionDebriefHtml(stats, complete)}
      ${reviewSessionNextPlayHtml(stats, complete)}
    </section>
  `;
}

function renderFeedback(question, view, record, latest, showFeedback) {
  if (showFeedback) {
    els.feedback.classList.remove("hidden");
    els.feedback.classList.toggle("feedback-correct", Boolean(latest?.correct));
    els.feedback.classList.toggle("feedback-wrong", Boolean(latest && !latest.correct && !latest.timedOut));
    els.feedback.classList.toggle("feedback-timeout", Boolean(latest?.timedOut));
    if (els.quizPanel) {
      els.quizPanel.dataset.result = latest?.timedOut ? "timeout" : latest?.correct ? "correct" : "wrong";
    }
    if (latest?.timedOut) {
      els.feedbackTitle.textContent = "時間切れ（フォローアップに追加）";
    } else if (latest?.correct && hasMistake(record)) {
      els.feedbackTitle.textContent = "正解（フォローアップ解消）";
    } else {
      els.feedbackTitle.textContent = latest?.correct ? "正解" : "フォローアップに追加";
    }
    const scoreText = latest?.correct ? ` +${formatScore(scoreForAttempt(latest, question))}点` : "";
    if (scoreText) els.feedbackTitle.textContent += scoreText;
    els.feedbackBody.innerHTML = `${reviewSessionSummaryHtml(question)}${feedbackBodyHtml(question, view, latest)}`;
    normalizeQuizImages(els.feedbackBody);
    renderMathInNode(els.feedbackBody);
    els.retryButton.hidden = canAnswer(question);
    els.attemptSummary.textContent = attemptSummary(record, question);
    els.attemptHistory.innerHTML = renderAttemptHistory(record, question);
    resetScrollPosition(els.feedback);
    resetScrollPosition(els.feedbackBody);
  } else {
    clearFeedbackDisplay();
  }
}

function clearFeedbackDisplay() {
  els.feedback.classList.add("hidden");
  els.feedback.classList.remove("feedback-correct", "feedback-wrong", "feedback-timeout");
  if (els.quizPanel) delete els.quizPanel.dataset.result;
  els.feedbackTitle.textContent = "";
  els.feedbackBody.innerHTML = "";
  els.retryButton.hidden = true;
  els.attemptSummary.textContent = "";
  els.attemptHistory.innerHTML = "";
}

function renderPager() {
  const questions = visibleQuestions();
  els.pager.innerHTML = "";
  questions.forEach((question, index) => {
    const button = document.createElement("button");
    const isCurrent = index === state.questionIndex;
    button.type = "button";
    button.textContent = index + 1;
    button.classList.toggle("active", isCurrent);
    if (isCurrent) {
      button.setAttribute("aria-current", "step");
      button.title = "現在の問題";
    }
    const record = progressFor(question.id);
    const latest = lastAttempt(record);
    if (latest?.correct) {
      button.classList.add("correct-dot");
      button.title = hasMistake(record) ? "復習後に正解" : "正解";
    }
    if (record?.followUp) {
      button.classList.add("wrong-dot");
      button.title = "不正解";
    }
    if (isCalculationQuestion(question)) {
      button.classList.add("calculation-dot");
      button.title = button.title ? `${button.title} / 計算問題` : "計算問題";
    }
    const understandingLevel = explicitUnderstandingLevelForQuestion(question);
    if (understandingLevel) {
      button.classList.add("understanding-dot", `understanding-${understandingLevel}`);
      button.dataset.understandingMark = UNDERSTANDING_PAGER_MARKS[understandingLevel] || "";
      const understandingTitle = `理解度: ${understandingLabel(understandingLevel)}`;
      button.title = button.title ? `${button.title} / ${understandingTitle}` : understandingTitle;
    }
    const frequency = kougaiQuestionFrequencyInfo(question);
    if (frequency) {
      const frequencyTitle = kougaiQuestionFrequencyTitle(frequency);
      button.title = button.title ? `${button.title} / ${frequencyTitle}` : frequencyTitle;
      button.setAttribute("aria-label", `問題${index + 1}、${frequencyTitle}`);
      if (frequency.count > 1) {
        button.classList.add("kougai-repeat-dot");
        const countBadge = document.createElement("span");
        countBadge.className = "kougai-frequency-count";
        countBadge.textContent = String(frequency.count);
        countBadge.setAttribute("aria-hidden", "true");
        button.appendChild(countBadge);
      }
      if (frequency.count >= KOUGAI_FREQUENT_QUESTION_THRESHOLD) {
        button.classList.add("kougai-frequent-dot");
        const ring = document.createElement("span");
        ring.className = "kougai-frequency-ring";
        ring.setAttribute("aria-hidden", "true");
        button.appendChild(ring);
      }
    }
    if (isCurrent) {
      const currentIndicator = document.createElement("span");
      currentIndicator.className = "pager-current-indicator";
      currentIndicator.setAttribute("aria-hidden", "true");
      button.appendChild(currentIndicator);
    }
    button.addEventListener("click", () => {
      if (index !== state.questionIndex) clearResultDisplays();
      state.questionIndex = index;
      setRetakeForSelectedQuestion(question);
      render();
    });
    els.pager.appendChild(button);
  });
  const activeButton = els.pager.querySelector("button.active");
  if (activeButton) {
    const targetLeft = activeButton.offsetLeft - (els.pager.clientWidth - activeButton.clientWidth) / 2;
    els.pager.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" });
  }
}

function renderSectionSearch() {
  if (!els.sectionSearchInput) return;
  const query = state.sectionSearchQuery || "";
  if (els.sectionSearchInput.value !== query) els.sectionSearchInput.value = query;
  const baseQuestions = orderedSectionQuestions();
  const hasQuery = hasSectionSearchQuery();
  const matchCount = hasQuery
    ? baseQuestions.filter((question) => questionMatchesSectionSearch(question)).length
    : baseQuestions.length;
  els.sectionSearch?.classList.toggle("active", hasQuery);
  els.sectionSearch?.classList.toggle("empty", hasQuery && matchCount === 0);
  if (els.sectionSearchToggle) {
    const buttonLabel = hasQuery ? `検索中: ${matchCount}件` : "このセクションを検索";
    els.sectionSearchToggle.classList.toggle("active", hasQuery);
    els.sectionSearchToggle.setAttribute("aria-pressed", String(hasQuery));
    els.sectionSearchToggle.setAttribute("aria-expanded", String(els.sectionSearch?.classList.contains("open") || false));
    els.sectionSearchToggle.setAttribute("aria-label", buttonLabel);
    els.sectionSearchToggle.setAttribute("title", buttonLabel);
    els.sectionSearchToggle.dataset.tooltip = buttonLabel;
  }
  if (els.sectionSearchCount) {
    els.sectionSearchCount.textContent = hasQuery ? `${matchCount}件` : `${baseQuestions.length}問`;
  }
  if (els.sectionSearchClear) {
    els.sectionSearchClear.hidden = !hasQuery;
    els.sectionSearchClear.disabled = !hasQuery;
  }
}

function positionSectionSearchPopover() {
  if (!els.sectionSearch || !els.sectionSearchToggle) return;
  const rect = els.sectionSearchToggle.getBoundingClientRect();
  const width = Math.min(360, Math.max(240, window.innerWidth - 16));
  const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
  const panelHeight = els.sectionSearch.querySelector('.section-search-popover')?.offsetHeight || 48;
  const below = rect.bottom + 8;
  const above = rect.top - panelHeight - 8;
  const top = below + panelHeight <= window.innerHeight - 8
    ? below
    : above >= 8 ? above : Math.max(8, window.innerHeight - panelHeight - 8);
  els.sectionSearch.style.setProperty("--section-search-left", `${left}px`);
  els.sectionSearch.style.setProperty("--section-search-top", `${top}px`);
  const parent = els.sectionSearch.getBoundingClientRect();
  els.sectionSearch.style.setProperty("--section-search-offset-x", `${left - parent.left}px`);
  els.sectionSearch.style.setProperty("--section-search-offset-y", `${top - parent.top}px`);
}

function setSectionSearchOpen(open) {
  if (!els.sectionSearch) return;
  const nextOpen = Boolean(open) && !els.sectionSearchToggle?.disabled;
  els.sectionSearch.classList.toggle("open", nextOpen);
  if (nextOpen) positionSectionSearchPopover();
  els.sectionSearchToggle?.setAttribute("aria-expanded", String(nextOpen));
}

function variantLabel(variant) {
  return {
    source: "元問",
    reverse: "連想",
    explanation: "解説",
    review: "復習",
  }[variant] || variant;
}

function answerChoice(displayIndex) {
  const question = currentQuestion();
  if (!canAnswer(question)) return;
  const view = currentViewQuestion();
  const selected = view.options[displayIndex];
  if (!selected) return;
  recordAttempt(question, {
    choice: selected.sourceIndex ?? displayIndex,
    choiceKey: selected.key,
    choiceLabel: selected.text,
    correct: selected.correct,
    format: view.formatLabel,
    formatKey: view.format,
  });
}

function answerTyping() {
  const question = currentQuestion();
  if (!canAnswer(question)) return;
  const view = currentViewQuestion();
  if (!view.typing) return;
  const value = els.typingInput.value.trim();
  if (!value) return;
  recordAttempt(question, {
    choice: -1,
    choiceKey: `${question.id}:typing`,
    choiceLabel: value,
    correct: normalizeInput(value) === normalizeInput(view.answerText),
    format: view.formatLabel,
    formatKey: view.format,
  });
}

function answerTimeout(expectedQuestionId = null) {
  const question = currentQuestion();
  if (!shouldUseTimerForQuestion(question)) return;
  if (!canAnswer(question)) return;
  if (expectedQuestionId && expectedQuestionId !== question.id) return;
  if (!expectedQuestionId && timerQuestionId !== question.id) return;
  const view = currentViewQuestion();
  recordAttempt(question, {
    choice: -1,
    choiceKey: `${question.id}:timeout`,
    choiceLabel: "時間切れ",
    correct: false,
    format: view.formatLabel,
    formatKey: view.format,
    timedOut: true,
  });
}

function recordAttempt(question, payload) {
  const record = progressFor(question.id) || {
    attempts: [],
    followUp: false,
    lastAnsweredAt: null,
  };
  const timeLimitEnabled = shouldUseTimerForQuestion(question);
  const remaining = payload.timedOut ? 0 : timeLimitEnabled ? currentRemainingTime(question.id) : TIMER_LIMIT;
  const elapsed = timeLimitEnabled ? TIMER_LIMIT - remaining : null;
  const scoring = calculateAttemptScore({
    correct: Boolean(payload.correct),
    formatKey: payload.formatKey || "four",
    remaining,
  });
  const attempt = {
    choice: payload.choice,
    choiceKey: payload.choiceKey || "",
    choiceLabel: payload.choiceLabel || "",
    correct: Boolean(payload.correct),
    format: payload.format || "",
    timedOut: Boolean(payload.timedOut),
    remaining: roundScore(remaining),
    elapsed: Number.isFinite(elapsed) ? roundScore(elapsed) : null,
    timeLimitEnabled,
    score: scoring.score,
    scoreRatio: scoring.scoreRatio,
    answeredAt: new Date().toISOString(),
  };
  answerCombo = attempt.correct ? answerCombo + 1 : 0;
  record.attempts.push(attempt);
  record.followUp = !attempt.correct;
  record.lastAnsweredAt = attempt.answeredAt;
  state.progress[question.id] = record;
  state.retakeQuestionId = null;
  stopTimer();
  saveLastAnsweredPosition(question, attempt);
  saveProgress();
  recordCompletedReviewSessionIfNeeded();
  render();
  showResultBurst(attempt, question);
  clearAutoAdvanceTimer();
}

function clearResultDisplays() {
  clearAutoAdvanceTimer();
  window.clearTimeout(resultBurstTimer);
  resultBurstTimer = null;

  if (els.resultBurst) {
    els.resultBurst.classList.add("hidden");
    els.resultBurst.classList.remove("show", "result-correct", "result-wrong", "result-timeout");
  }
  if (els.resultBurstText) els.resultBurstText.textContent = "";
  if (els.resultBurstSub) els.resultBurstSub.textContent = "";

  clearFeedbackDisplay();
  applyReviewFocusState(false);
}

function clearAutoAdvanceTimer() {
  window.clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = null;
}

function nextCourseChapterIndex() {
  if (state.virtualChapter) return -1;
  const chapters = course()?.chapters || [];
  for (let index = state.chapterIndex + 1; index < chapters.length; index += 1) {
    if (chapterQuestionSet(chapters[index]).length) return index;
  }
  return -1;
}

function goToNextSectionFirstQuestion() {
  const nextChapterIndex = nextCourseChapterIndex();
  if (nextChapterIndex < 0) return false;
  selectChapter(nextChapterIndex);
  return true;
}

function goToNextQuestion() {
  const questions = visibleQuestions();
  if (!questions.length) return false;
  const current = questions[state.questionIndex];
  const isFinishedLastQuestion = state.questionIndex >= questions.length - 1 && current && !canAnswer(current);
  if (isFinishedLastQuestion && !state.sectionLoopMode && goToNextSectionFirstQuestion()) return true;
  clearResultDisplays();
  state.questionIndex = (state.questionIndex + 1) % questions.length;
  setRetakeForSelectedQuestion();
  render();
  return true;
}

function goToNextOpenReviewQuestion() {
  const reviewChapter = chapter();
  if (!isReviewCurriculumChapter(reviewChapter)) return goToNextQuestion();
  const questions = chapterQuestionSet(reviewChapter);
  if (!questions.length) return false;
  for (let offset = 1; offset <= questions.length; offset += 1) {
    const index = (state.questionIndex + offset) % questions.length;
    if (!reviewSessionAttemptFor(questions[index], reviewChapter)) {
      clearResultDisplays();
      state.questionIndex = index;
      setRetakeForSelectedQuestion(questions[index]);
      render();
      return true;
    }
  }
  return false;
}

function restartCurrentReviewSession({ onlyWrong = false } = {}) {
  const reviewChapter = chapter();
  if (!isReviewCurriculumChapter(reviewChapter)) return false;
  const questions = chapterQuestionSet(reviewChapter);
  const entries = Array.isArray(reviewChapter.reviewEntries) ? reviewChapter.reviewEntries : [];
  const entryById = new Map(entries.map((entry) => [entry.questionId, entry]));
  const selectedQuestions = questions.filter((question) => {
    const attempt = reviewSessionAttemptFor(question, reviewChapter);
    return onlyWrong ? attempt && !attempt.correct : true;
  });
  if (!selectedQuestions.length) return false;
  const label = onlyWrong ? "ミス再挑戦" : "同じセット";
  clearResultDisplays();
  state.virtualChapter = {
    ...reviewChapter,
    title: `復習演習 / ${label} ${selectedQuestions.length}問`,
    sourceQuestionCount: selectedQuestions.length,
    reviewStartedAt: Date.now(),
    reviewEntries: selectedQuestions.map((question) => {
      const entry = entryById.get(question.id);
      return entry || {
        questionId: question.id,
        stage: "future",
      };
    }),
    questions: selectedQuestions,
  };
  state.questionIndex = 0;
  state.order = [];
  state.retakeQuestionId = null;
  setRetakeForSelectedQuestion(selectedQuestions[0]);
  requestMobileQuizScroll();
  render();
  return true;
}

function goToPreviousQuestion() {
  const questions = visibleQuestions();
  if (!questions.length) return false;
  clearResultDisplays();
  state.questionIndex = (state.questionIndex - 1 + questions.length) % questions.length;
  setRetakeForSelectedQuestion();
  render();
  return true;
}

function advanceFromSolvedArea(event) {
  if (event.target.closest("button, input, textarea, select, a, [role='button']")) return;
  const question = currentQuestion();
  if (!question || canAnswer(question)) return;
  goToNextQuestion();
}

function handleReviewSessionFeedbackAction(event) {
  const button = event.target?.closest?.("[data-review-session-action]");
  if (!button || !els.feedback?.contains(button)) return;
  const action = button.dataset.reviewSessionAction;
  if (action === "next-open") {
    goToNextOpenReviewQuestion();
  } else if (action === "retry-wrong") {
    restartCurrentReviewSession({ onlyWrong: true });
  } else if (action === "restart") {
    restartCurrentReviewSession();
  } else if (action === "next-mission") {
    startNextReviewMission();
  } else if (action === "summary") {
    setStudySummaryOpen(true);
  } else if (action === "exit") {
    exitReviewCurriculumMode();
  }
}

function handleQuestionWheel(event) {
  if (event.ctrlKey || event.metaKey) return;
  if (event.target.closest("input, textarea, select")) return;
  const delta = normalizedWheelDelta(event);
  if (!delta) return;

  const directScrollTarget = readingWheelTarget(event.target);
  if (directScrollTarget && scrollNodeByWheel(directScrollTarget, delta, event)) {
    wheelPageDelta = 0;
    return;
  }

  if (state.wheelMode === "scroll") {
    wheelPageDelta = 0;
    const fallbackTarget = fallbackReadingWheelTarget();
    if (fallbackTarget) scrollNodeByWheel(fallbackTarget, delta, event);
    return;
  }

  event.preventDefault();

  const now = performance.now();
  if (now - wheelLastTurnedAt < WHEEL_PAGE_COOLDOWN_MS) return;

  wheelPageDelta += delta;
  if (Math.abs(wheelPageDelta) < WHEEL_PAGE_THRESHOLD) return;

  const moved = wheelPageDelta > 0 ? goToNextQuestion() : goToPreviousQuestion();
  wheelPageDelta = 0;
  if (moved) wheelLastTurnedAt = now;
}

function handleReadingWheel(event) {
  const delta = normalizedWheelDelta(event);
  if (!delta) return;
  const target = readingWheelTarget(event.target);
  if (!target) return;
  scrollNodeByWheel(target, delta, event);
}

function scrollNodeByWheel(node, delta, event) {
  if (!canScrollByWheel(node, delta)) return false;
  event.preventDefault();
  event.stopPropagation();
  node.scrollTop += delta;
  return true;
}

function fallbackReadingWheelTarget() {
  const candidates = [
    els.feedback && !els.feedback.classList.contains("hidden") ? els.feedback : null,
    els.answerDock,
    els.questionText,
  ];
  return candidates.find((node) => node && node.scrollHeight > node.clientHeight + 1) || null;
}

function readingWheelTarget(target) {
  const node = target instanceof Element ? target : target?.parentElement;
  const feedback = node?.closest?.(".feedback");
  if (feedback && !feedback.classList.contains("hidden")) return feedback;
  const answerDock = node?.closest?.(".answer-dock");
  if (answerDock && !answerDock.classList.contains("hidden")) return answerDock;
  const questionText = node?.closest?.(".question-text");
  if (questionText) return questionText;
  if (node?.closest?.(".question-board")) return els.questionText;
  return null;
}

function canScrollByWheel(node, delta) {
  if (!node || node.scrollHeight <= node.clientHeight + 1) return false;
  if (delta > 0) return node.scrollTop + node.clientHeight < node.scrollHeight - 1;
  return node.scrollTop > 1;
}

function normalizedWheelDelta(event) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function showResultBurst(attempt, question = currentQuestion()) {
  if (!els.resultBurst || !els.resultBurstText || !els.resultBurstSub) return;
  window.clearTimeout(resultBurstTimer);

  const resultClass = attempt.timedOut ? "result-timeout" : attempt.correct ? "result-correct" : "result-wrong";
  const text = attempt.timedOut ? "時間切れ" : attempt.correct ? "正解" : "不正解";
  const comboText = attempt.correct && answerCombo >= 2 ? ` · ${answerCombo} COMBO` : "";
  const view = currentViewQuestion();
  const typingAnswer = view?.typing ? String(view.answerText || "").trim() : "";
  const sub = attempt.correct
    ? `+${formatScore(scoreForAttempt(attempt, question))}点${comboText}`
    : typingAnswer
      ? `正答: ${typingAnswer}`
      : "フォローアップに追加";

  els.resultBurst.className = `result-burst hidden ${resultClass}`;
  els.resultBurstText.textContent = text;
  els.resultBurstSub.textContent = sub;
  void els.resultBurst.offsetWidth;
  els.resultBurst.classList.remove("hidden");
  els.resultBurst.classList.add("show");

  resultBurstTimer = window.setTimeout(() => {
    els.resultBurst.classList.add("hidden");
    els.resultBurst.classList.remove("show", "result-correct", "result-wrong", "result-timeout");
  }, 1625);
}

function scheduleAutoAdvance(answeredQuestionId) {
  clearAutoAdvanceTimer();
}

function currentRemainingTime(questionId) {
  if (!state.timerEnabled) return TIMER_LIMIT;
  if (timerQuestionId !== questionId || !timerStartedAt) return 0;
  return Math.max(0, TIMER_LIMIT - (performance.now() - timerStartedAt) / 1000);
}

function optionMatchesAttempt(option, attempt) {
  if (attempt.choiceKey && option.key === attempt.choiceKey) return true;
  if (attempt.choiceLabel && option.text === attempt.choiceLabel) return true;
  return option.sourceIndex === attempt.choice;
}

function attemptSummary(record, question = currentQuestion()) {
  const attempts = attemptsFor(record);
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const wrong = attempts.length - correct;
  const latest = lastAttempt(record);
  const latestScore = latest ? formatScore(scoreForAttempt(latest, question)) : formatScore(0);
  return `${attempts.length}回記録 / 正${correct}・誤${wrong} / 最新 ${latestScore}点`;
}

function renderAttemptHistory(record, question) {
  return attemptsFor(record)
    .map((attempt, index) => {
      const result = attempt.correct ? "正解" : attempt.timedOut ? "時間切れ" : "誤答";
      const choice = attempt.choiceLabel || question.options[attempt.choice] || "不明";
      const date = formatDateTime(attempt.answeredAt);
      const format = attempt.format ? `${attempt.format} ` : "";
      const score = formatScore(scoreForAttempt(attempt, question));
      const time = attempt.timeLimitEnabled === false
        ? " 時間制限なし"
        : Number.isFinite(attempt.elapsed)
          ? ` ${attempt.elapsed.toFixed(2)}秒`
          : "";
      return `<span class="attempt-pill ${attempt.correct ? "ok" : "ng"}">${index + 1}回目 ${format}${result}: ${escapeHtml(choice)} / ${score}点${time} <small>${date}</small></span>`;
    })
    .join("");
}

function renderAnswerHistoryStrip(record) {
  const strip = els.answerHistoryStrip;
  const marks = els.answerHistoryMarks;
  if (!strip || !marks) return;
  const attempts = attemptsFor(record);
  marks.replaceChildren();
  strip.classList.toggle("hidden", attempts.length === 0);
  if (!attempts.length) return;

  [...attempts].reverse().forEach((attempt, index) => {
    const correct = Boolean(attempt.correct);
    const resultLabel = correct ? "正解" : attempt.timedOut ? "時間切れ" : "不正解";
    const choiceLabel = String(attempt.choiceLabel || "").trim();
    const answeredAt = formatDateTime(attempt.answeredAt);
    const details = [`${attempts.length - index}回目`, resultLabel];
    if (choiceLabel) details.push(`回答 ${choiceLabel}`);
    if (answeredAt) details.push(answeredAt);

    const mark = document.createElement("span");
    mark.className = `answer-history-mark ${correct ? "is-correct" : "is-wrong"}`;
    if (attempt.timedOut) mark.classList.add("is-timeout");
    mark.textContent = correct ? "○" : "×";
    mark.title = details.join(" / ");
    mark.setAttribute("role", "listitem");
    mark.setAttribute("aria-label", details.join("、"));
    marks.appendChild(mark);
  });

  scrollAnswerHistoryToLatest();
}

function scrollAnswerHistoryToLatest() {
  window.cancelAnimationFrame(answerHistoryScrollFrame);
  answerHistoryScrollFrame = window.requestAnimationFrame(() => {
    answerHistoryScrollFrame = null;
    const strip = els.answerHistoryStrip;
    const marks = els.answerHistoryMarks;
    if (strip?.isConnected && marks && !strip.classList.contains("hidden")) {
      marks.scrollLeft = 0;
    }
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function startTimer(questionId) {
  if (!state.timerEnabled) {
    stopTimer();
    showTimerDisabled();
    return;
  }
  if (timerQuestionId === questionId && timerHandle) return;
  stopTimer();
  timerQuestionId = questionId;
  timerStartedAt = performance.now();
  updateTimerDisplay(TIMER_LIMIT);

  const tick = () => {
    if (timerQuestionId !== questionId) return;
    const elapsed = (performance.now() - timerStartedAt) / 1000;
    const remaining = Math.max(0, TIMER_LIMIT - elapsed);
    updateTimerDisplay(remaining);
    if (remaining <= 0) {
      answerTimeout(questionId);
      return;
    }
  };

  tick();
  if (timerQuestionId === questionId) {
    timerHandle = window.setInterval(tick, TIMER_TICK_MS);
  }
}

function stopTimer() {
  if (timerHandle) window.clearInterval(timerHandle);
  timerHandle = null;
  timerQuestionId = null;
}

function updateTimerDisplay(value) {
  const remaining = Math.max(0, value);
  els.timerValue.textContent = String(Math.ceil(remaining)).padStart(2, "0");
  els.timerBar.style.width = `${(remaining / TIMER_LIMIT) * 100}%`;
  els.timerBar.classList.toggle("danger", remaining <= 8);
}

function showTimerDisabled() {
  els.timerValue.textContent = "OFF";
  els.timerBar.style.width = "0%";
  els.timerBar.classList.remove("danger");
  els.timeCard?.classList.add("timer-disabled");
}

function showTimerResult(latest) {
  if (!state.timerEnabled && !latest) {
    showTimerDisabled();
    return;
  }
  if (latest?.timedOut) {
    updateTimerDisplay(0);
  } else {
    const scoreText = latest?.correct ? `+${formatScore(scoreForAttempt(latest, currentQuestion()))}` : formatScore(0);
    els.timerValue.innerHTML = `${scoreText}<small>点</small>`;
    els.timerBar.style.width = "100%";
    els.timerBar.classList.remove("danger");
  }
}

function shuffleChapter() {
  clearResultDisplays();
  state.frequencySortMode = false;
  const length = chapter().questions.length;
  const order = [...Array(length)].map((_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  state.order = order;
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
}

function progressIdsForQuestions(questions) {
  return [...new Set(questions.map((question) => question?.id).filter(Boolean))];
}

function progressIdsWithPrefix(prefix) {
  if (!prefix) return [];
  return Object.keys(state.progress).filter((id) => id.startsWith(prefix));
}

function chapterProgressIdPrefix(chapterItem = chapter(), courseItem = course()) {
  const number = Number(chapterItem?.number);
  if (!courseItem?.id || !Number.isInteger(number)) return "";
  return `${courseItem.id}-${String(number).padStart(2, "0")}-`;
}

function progressIdsForCurrentQuestion() {
  const question = currentQuestion();
  if (!question) return [];
  const key = questionIdentityKey(question);
  return [
    ...new Set([
      question.id,
      ...progressIdsForQuestions(chapter().questions.filter((item) => questionIdentityKey(item) === key)),
    ].filter(Boolean)),
  ];
}

function progressIdsForChapter(chapterItem = chapter()) {
  return [
    ...new Set([
      ...progressIdsForQuestions(chapterItem.questions),
      ...progressIdsWithPrefix(chapterProgressIdPrefix(chapterItem)),
    ]),
  ];
}

function progressIdsForCourse(courseItem = course()) {
  return [
    ...new Set([
      ...progressIdsForQuestions(courseItem.chapters.flatMap((chapterItem) => chapterItem.questions)),
      ...progressIdsWithPrefix(`${courseItem.id}-`),
    ]),
  ];
}

function existingProgressCount(ids) {
  return ids.reduce((count, id) => count + (state.progress[id] ? 1 : 0), 0);
}

function showHistoryInlineConfirm({ title = "履歴削除", message, confirmLabel = "削除", cancelLabel = "取消", danger = true, pending = null }) {
  if (!els.historyInlineConfirm) return;
  pendingHistoryDelete = pending;
  els.historyInlineTitle.textContent = title;
  els.historyInlineMessage.textContent = message;
  els.historyInlineOk.textContent = confirmLabel;
  els.historyInlineCancel.textContent = cancelLabel;
  els.historyInlineOk.hidden = !pending;
  els.historyInlineCancel.hidden = !cancelLabel;
  els.historyInlineOk.classList.toggle("danger-confirm-button", danger);
  els.historyInlineConfirm.classList.remove("hidden");
  if (pending) {
    els.historyInlineOk.focus();
  } else {
    els.historyInlineCancel.focus();
  }
}

function closeHistoryInlineConfirm() {
  pendingHistoryDelete = null;
  els.historyInlineConfirm?.classList.add("hidden");
}

function requestHistoryDelete(label, ids, scope, afterDelete = () => {}) {
  const count = existingProgressCount(ids);
  if (!count) {
    showHistoryInlineConfirm({
      title: "履歴なし",
      message: `${label}の履歴はありません。`,
      confirmLabel: "",
      cancelLabel: "OK",
      danger: false,
    });
    return false;
  }
  showHistoryInlineConfirm({
    title: "履歴削除",
    message: `${label}の履歴 ${count}件を削除します。`,
    pending: {
      ids,
      scope,
      afterDelete,
    },
  });
  return true;
}

function deleteProgressIds(ids) {
  const deleteSet = new Set(ids.filter(Boolean));
  if (!deleteSet.size) return;
  clearLastAnsweredIfDeleted(deleteSet);
  state.progress = Object.fromEntries(
    Object.entries(state.progress).filter(([id]) => !deleteSet.has(id))
  );
}

function clearLastAnsweredIfDeleted(deleteSet) {
  const lastAnswered = loadLastAnsweredPosition();
  if (lastAnswered?.questionId && deleteSet.has(lastAnswered.questionId)) {
    saveLastAnsweredPositionPayload(null);
  }
}

function idsForPendingHistoryDelete(pending) {
  if (!pending) return [];
  const baseIds = pending.ids || [];
  if (pending.scope === "all") return Object.keys(state.progress);
  if (pending.scope === "course") {
    return [...new Set([...baseIds, ...progressIdsForCourse()])];
  }
  if (pending.scope === "chapter") {
    return [...new Set([...baseIds, ...progressIdsForChapter()])];
  }
  if (pending.scope === "question") {
    return [...new Set([...baseIds, ...progressIdsForCurrentQuestion()])];
  }
  return baseIds;
}

function resetQuestionHistory() {
  clearResultDisplays();
  const ids = progressIdsForCurrentQuestion();
  const count = existingProgressCount(ids);
  if (!count) {
    showHistoryInlineConfirm({
      title: "履歴なし",
      message: "この問題の履歴はありません。",
      confirmLabel: "",
      cancelLabel: "OK",
      danger: false,
    });
    return;
  }
  deleteProgressIds(ids);
  state.retakeQuestionId = null;
  saveProgress();
  closeHistoryMenu();
  render();
}

function resetChapterHistory() {
  clearResultDisplays();
  const ids = progressIdsForChapter();
  requestHistoryDelete(`単元「${chapter().title}」`, ids, "chapter", () => {
    state.questionIndex = 0;
    state.retakeQuestionId = null;
  });
}

function resetCourseHistory() {
  clearResultDisplays();
  const ids = progressIdsForCourse();
  requestHistoryDelete(`科目「${course().name}」`, ids, "course", () => {
    state.questionIndex = 0;
    state.retakeQuestionId = null;
  });
}

function resetAllHistory() {
  clearResultDisplays();
  requestHistoryDelete("全科目", Object.keys(state.progress), "all", () => {
    state.progress = {};
    state.questionIndex = 0;
    state.order = [];
    state.followUpMode = false;
    state.unansweredMode = false;
    state.favoriteMode = false;
    state.calculationMode = false;
    state.nonCalculationMode = false;
    state.sectionSearchQuery = "";
    state.retakeQuestionId = null;
    [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].forEach((key) => localStorage.removeItem(key));
    saveLastAnsweredPositionPayload(null);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHeader() {
  const activeCourse = course();
  const activeChapter = chapter();
  const isPeriodicElement = isPeriodicTableCourse(activeCourse) && activeChapter?.elementSymbol;
  let roundLabel = activeChapter.virtual
    ? activeChapter.virtualLabel || "カテゴリ"
    : `第${activeChapter.number}回`;
  let chapterTitle = activeChapter.virtual
    ? `${roundLabel} ${activeChapter.title}`
    : `第${activeChapter.number}回 ${activeChapter.title}`;
  if (isPeriodicElement) {
    roundLabel = `No.${activeChapter.atomicNumber}`;
    chapterTitle = `${activeChapter.elementSymbol} ${activeChapter.elementName} / 原子番号${activeChapter.atomicNumber}`;
  }
  els.datasetMeta.textContent = `${data.chapterCount}チャプター / ${totalVisibleQuestionCount()}問`;
  els.courseName.textContent = activeCourse.name;
  els.chapterTitle.textContent = chapterTitle;
  els.sideRound.textContent = roundLabel;
  document.title = `${activeCourse.name} ${activeChapter.title} | Quiz Pal`;
  els.optionShuffleButton?.classList.toggle("active", state.optionShuffleMode);
  els.optionShuffleButton?.setAttribute("aria-pressed", String(state.optionShuffleMode));
  els.optionShuffleButton?.setAttribute(
    "title",
    state.optionShuffleMode ? "選択肢シャッフル オン" : "選択肢シャッフル オフ"
  );
  els.followUpButton.classList.toggle("active", state.followUpMode);
  els.followUpButton.setAttribute("aria-pressed", String(state.followUpMode));
  const frequencySortAvailable = state.courseId === KOUGAI_MANAGER_COURSE_ID;
  if (els.frequencySortButton) els.frequencySortButton.hidden = !frequencySortAvailable;
  els.frequencySortButton?.classList.toggle("active", frequencySortAvailable && state.frequencySortMode);
  els.frequencySortButton?.setAttribute("aria-pressed", String(frequencySortAvailable && state.frequencySortMode));
  els.frequencySortButton?.setAttribute(
    "title",
    state.frequencySortMode ? "通常の出題順に戻す" : "累計出題回数の多い順"
  );
  els.unansweredButton.classList.toggle("active", state.unansweredMode);
  els.unansweredButton.setAttribute("aria-pressed", String(state.unansweredMode));
  els.favoriteModeButton?.classList.toggle("active", state.favoriteMode);
  els.favoriteModeButton?.setAttribute("aria-pressed", String(state.favoriteMode));
  els.favoriteModeButton?.setAttribute(
    "title",
    state.favoriteMode ? "学習対象モード中" : "学習対象の問題"
  );
  const calculationCount = currentSectionCalculationQuestionCount();
  const nonCalculationCount = currentSectionNonCalculationQuestionCount();
  els.calculationModeButton?.classList.toggle("active", state.calculationMode);
  els.calculationModeButton?.setAttribute("aria-pressed", String(state.calculationMode));
  els.calculationModeButton?.setAttribute(
    "title",
    state.calculationMode
      ? `計算問題特化モード中（${calculationCount}問）`
      : `このセクションの計算問題だけ（${calculationCount}問）`
  );
  if (els.calculationModeButton) {
    els.calculationModeButton.disabled = !state.calculationMode && calculationCount === 0;
  }
  els.nonCalculationModeButton?.classList.toggle("active", state.nonCalculationMode);
  els.nonCalculationModeButton?.setAttribute("aria-pressed", String(state.nonCalculationMode));
  els.nonCalculationModeButton?.setAttribute(
    "title",
    state.nonCalculationMode
      ? `非計算問題特化モード中（${nonCalculationCount}問）`
      : `このセクションの非計算問題だけ（${nonCalculationCount}問）`
  );
  if (els.nonCalculationModeButton) {
    els.nonCalculationModeButton.disabled = !state.nonCalculationMode && nonCalculationCount === 0;
  }
  state.autoAdvanceMode = false;
  els.autoAdvanceButton?.classList.toggle("active", false);
  els.autoAdvanceButton?.setAttribute("aria-pressed", "false");
  els.autoAdvanceButton?.setAttribute("title", "自動送り停止中");
  if (els.autoAdvanceButton) {
    els.autoAdvanceButton.hidden = true;
    els.autoAdvanceButton.disabled = true;
  }
  els.sectionLoopButton?.classList.toggle("active", state.sectionLoopMode);
  els.sectionLoopButton?.setAttribute("aria-pressed", String(state.sectionLoopMode));
  els.sectionLoopButton?.setAttribute(
    "title",
    state.sectionLoopMode ? "セクション内ループ オン" : "セクション内ループ オフ"
  );
  els.timerToggleButton?.classList.toggle("active", state.timerEnabled);
  els.timerToggleButton?.setAttribute("aria-pressed", String(state.timerEnabled));
  els.timerToggleButton?.setAttribute("title", state.timerEnabled ? "制限時間オン" : "制限時間オフ");
  els.timeCard?.classList.toggle("timer-disabled", !state.timerEnabled);
  const wheelScrollMode = state.wheelMode === "scroll";
  els.wheelModeButton?.classList.toggle("active", wheelScrollMode);
  els.wheelModeButton?.setAttribute("aria-pressed", String(wheelScrollMode));
  els.wheelModeButton?.setAttribute(
    "title",
    wheelScrollMode ? "ホイール: 問題文・解説スクロール" : "ホイール: 問題移動"
  );
  if (els.wheelModeLabel) els.wheelModeLabel.textContent = wheelScrollMode ? "読む" : "問題";
  els.quizPanel?.classList.toggle("wheel-scroll-mode", wheelScrollMode);
  renderVisualThemePicker();
}

function setCourseTabsDisabled(disabled) {
  els.courseTabs.forEach((tab) => {
    tab.disabled = disabled;
  });
  if (els.completedCoursesToggle) els.completedCoursesToggle.disabled = disabled;
}

function setQuizControlsDisabled(disabled) {
  [
    els.shuffleButton,
    els.optionShuffleButton,
    els.frequencySortButton,
    els.followUpButton,
    els.unansweredButton,
    els.favoriteModeButton,
    els.calculationModeButton,
    els.nonCalculationModeButton,
    els.sectionSearchToggle,
    els.sectionSearchClear,
    els.copyQuestionButton,
    els.questionSourceButton,
    els.llmTeachButton,
    els.calculationMarkerButton,
    els.autoAdvanceButton,
    els.sectionLoopButton,
    els.wheelModeButton,
    els.retryButton,
    els.historyMenuButton,
    ...els.understandingButtons,
  ]
    .filter(Boolean)
    .forEach((button) => {
      button.disabled = disabled;
    });
  if (els.sectionSearchInput) els.sectionSearchInput.disabled = disabled;
  if (disabled) setSectionSearchOpen(false);
}

function renderCoursePending(message = "科目データを読み込み中...") {
  const activeCourse = courseManifest(state.courseId) || data.courses[0];
  setAccent();
  renderCourses();
  stopTimer();
  clearAutoAdvanceTimer();

  els.datasetMeta.textContent = `${data.chapterCount}チャプター / ${totalVisibleQuestionCount()}問`;
  els.courseName.textContent = activeCourse?.name || "読み込み中";
  els.chapterTitle.textContent = message;
  els.sideRound.textContent = "--";
  els.formatLabel.textContent = "Loading";
  els.sideFormatLabel.textContent = "Loading";
  els.questionNumber.textContent = "Q--";
  els.variantChip.textContent = "読み込み中";
  renderQuestionSource(null);
  renderKougaiQuestionFrequency(null);
  clearPeriodicStage();
  els.chapterList.classList.remove("categorized", "periodic-table-list", "periodic-picker-list", "periodic-element-list");
  els.chapterList.innerHTML = `<button class="chapter-button active" type="button" disabled><span class="chapter-no">...</span><span class="chapter-name">${escapeHtml(message)}</span></button>`;
  els.chapterList.style.setProperty("--chapter-count", "1");
  els.accuracy.textContent = "0.00点";
  els.answeredCount.textContent = "0 / 0";
  els.followUpCount.textContent = "0";
  els.attemptCount.textContent = "0";
  els.currentIndex.textContent = "0 / 0";
  els.progressBar.style.width = "0%";
  els.sideScoreValue.innerHTML = `0.00<small>点</small>`;
  els.sideScoreBar.style.width = "0%";
  els.rankLabel.textContent = "入門";
  els.sideRankLabel.textContent = "入門";
  els.sideFollowUpCount.textContent = "0";
  els.quizPanel.classList.remove("source-layout");
  els.quizPanel.classList.remove("workbook-layout");
  els.quizPanel.classList.remove("math-layout");
  clearQuizContentProfile();
  els.quizPanel.classList.toggle("wheel-scroll-mode", state.wheelMode === "scroll");
  hideReviewSessionHud();
  finishQuestionTypewriter(message);
  renderClues([]);
  els.options.innerHTML = "";
  els.options.classList.remove("judge-options");
  renderTyping({ typing: false }, null, false);
  clearFeedbackDisplay();
  els.pager.innerHTML = "";
  if (els.sectionSearchInput) {
    els.sectionSearchInput.value = state.sectionSearchQuery || "";
    els.sectionSearchInput.disabled = true;
  }
  setSectionSearchOpen(false);
  if (els.sectionSearchCount) els.sectionSearchCount.textContent = "--";
  if (els.sectionSearchClear) els.sectionSearchClear.hidden = true;
  els.prevButton.disabled = true;
  els.nextButton.disabled = true;
  setAdvanceReady(false);
  setQuizControlsDisabled(true);
  els.timerValue.textContent = "--";
  els.timerBar.style.width = "0%";
  els.timerBar.classList.remove("danger");
  renderReviewCurriculum();
}

function renderCourseLoadError(error) {
  const message = `科目データの読み込みに失敗しました: ${error?.message || "不明なエラー"}`;
  renderCoursePending(message);
}

function render() {
  setCourseTabsDisabled(false);
  setQuizControlsDisabled(false);
  setAccent();
  renderHeader();
  renderCourses();
  renderChapters();
  renderStatus();
  renderSectionSearch();
  renderQuestion();
  renderPager();
  renderReviewCurriculum();
  flushMobileQuizScroll();
}

function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function closeHistoryMenu() {
  els.historyMenu?.classList.add("hidden");
  els.historyMenuButton?.setAttribute("aria-expanded", "false");
  closeHistoryInlineConfirm();
}

function positionHistoryMenu() {
  if (!els.historyMenu || els.historyMenu.classList.contains("hidden")) return;
  const anchor = els.historyMenu.parentElement.getBoundingClientRect();
  const menu = els.historyMenu.getBoundingClientRect();
  // 折り返したツールバーでも、履歴ボタンの近くかつ画面内に配置する。
  const left = Math.max(8, Math.min(anchor.left, innerWidth - menu.width - 8));
  const top = Math.max(8, Math.min(anchor.bottom + 8, innerHeight - menu.height - 8));
  els.historyMenu.style.setProperty("--history-menu-x", `${left - anchor.left}px`);
  els.historyMenu.style.setProperty("--history-menu-y", `${top - anchor.top}px`);
}

function toggleHistoryMenu() {
  if (!els.historyMenu || !els.historyMenuButton) return;
  const nextOpen = els.historyMenu.classList.contains("hidden");
  els.historyMenu.classList.toggle("hidden", !nextOpen);
  els.historyMenuButton.setAttribute("aria-expanded", String(nextOpen));
  if (nextOpen) positionHistoryMenu();
  if (!nextOpen) closeHistoryInlineConfirm();
}

function runHistoryDelete(action) {
  action();
}

async function selectCourse(courseId) {
  if (!courseManifest(courseId)) return;
  const token = ++courseLoadToken;
  const changingCourse = courseId !== state.courseId;
  if (changingCourse) {
    clearResultDisplays();
    checkpointStudyTimeForContextChange();
  }
  state.courseId = courseId;
  state.chapterIndex = 0;
  clearVirtualChapter();
  state.questionIndex = 0;
  state.order = [];
  state.frequencySortMode = false;
  state.followUpMode = false;
  state.unansweredMode = false;
  state.favoriteMode = false;
  state.calculationMode = false;
  state.nonCalculationMode = false;
  state.sectionSearchQuery = "";
  state.retakeQuestionId = null;
  state.periodicPickerOpen = false;
  if (changingCourse) refreshRunningStudyContext();
  requestMobileQuizScroll();

  if (!isCourseLoaded(courseId)) {
    setCourseTabsDisabled(true);
    renderCoursePending();
  }

  try {
    await ensureCourseLoaded(courseId);
    if (token !== courseLoadToken) return;
    applyDefaultChapterForCourse(courseId);
    restoreLastAnsweredPosition();
    if (changingCourse) refreshRunningStudyContext();
    render();
  } catch (error) {
    if (token !== courseLoadToken) return;
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
  }
}

async function boot() {
  setCourseTabsDisabled(true);
  renderCoursePending();
  try {
    await ensureCourseLoaded(state.courseId);
    applyDefaultChapterForCourse(state.courseId);
    restoreLastAnsweredPosition();
    requestMobileQuizScroll();
    render();
  } catch (error) {
    setCourseTabsDisabled(false);
    renderCourseLoadError(error);
  }
  renderIcons();
  startStudyTimeTicker();
}

els.courseTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.course === state.courseId && isCourseLoaded(state.courseId)) {
      if (tab.dataset.course === "periodic-table") openPeriodicPicker();
      return;
    }
    selectCourse(tab.dataset.course);
  });
});

els.completedCoursesToggle?.addEventListener("click", () => {
  state.completedCoursesOpen = !state.completedCoursesOpen;
  renderCourses();
});

els.prevButton.addEventListener("click", () => {
  goToPreviousQuestion();
});

els.nextButton.addEventListener("click", () => {
  goToNextQuestion();
});

els.sectionSearchToggle?.addEventListener("click", (event) => {
  event.preventDefault();
  const shouldOpen = !els.sectionSearch?.classList.contains("open");
  setSectionSearchOpen(shouldOpen);
  if (shouldOpen) {
    requestAnimationFrame(() => {
      const input = els.sectionSearchInput;
      if (!input) return;
      input.focus();
      const caret = input.value.length;
      input.setSelectionRange(caret, caret);
    });
  }
});

els.sectionSearchInput?.addEventListener("input", () => {
  clearResultDisplays();
  state.sectionSearchQuery = els.sectionSearchInput.value;
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
});

els.sectionSearchClear?.addEventListener("click", (event) => {
  event.preventDefault();
  clearResultDisplays();
  state.sectionSearchQuery = "";
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
  els.sectionSearchInput?.focus();
});

document.addEventListener("pointerdown", (event) => {
  if (!els.sectionSearch?.classList.contains("open")) return;
  if (event.target instanceof Node && els.sectionSearch.contains(event.target)) return;
  setSectionSearchOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !els.sectionSearch?.classList.contains("open")) return;
  setSectionSearchOpen(false);
  els.sectionSearchToggle?.focus();
});

window.addEventListener("resize", () => {
  if (els.sectionSearch?.classList.contains("open")) positionSectionSearchPopover();
  scrollAnswerHistoryToLatest();
});

[els.questionBoard, els.answerDock, els.feedback].filter(Boolean).forEach((node) => {
  node.addEventListener("click", advanceFromSolvedArea);
});

els.optionGraphPanel?.addEventListener("click", handleOptionGraphPanelClick);
els.optionGraphPanel?.addEventListener("pointerdown", handleOptionGraphPanelPointerDown);
els.optionGraphPanel?.addEventListener("pointermove", handleOptionGraphPanelPointerMove);
els.optionGraphPanel?.addEventListener("pointerup", handleOptionGraphPanelPointerUp);
els.optionGraphPanel?.addEventListener("pointercancel", handleOptionGraphPanelPointerUp);
document.addEventListener("pointerdown", handleOptionGraphDocumentPointerDown);
document.addEventListener("keydown", handleOptionGraphKeydown);
window.addEventListener("resize", handleOptionGraphWindowResize);

els.quizPanel?.addEventListener("wheel", handleQuestionWheel, { passive: false });

els.shuffleButton.addEventListener("click", shuffleChapter);

els.optionShuffleButton?.addEventListener("click", () => {
  saveOptionShuffleMode(!state.optionShuffleMode);
  clearResultDisplays();
  render();
});

els.frequencySortButton?.addEventListener("click", () => {
  if (state.courseId !== KOUGAI_MANAGER_COURSE_ID) return;
  clearResultDisplays();
  state.frequencySortMode = !state.frequencySortMode;
  state.order = [];
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
});

els.followUpButton.addEventListener("click", () => {
  clearResultDisplays();
  state.followUpMode = !state.followUpMode;
  if (state.followUpMode) {
    state.unansweredMode = false;
    state.favoriteMode = false;
    state.calculationMode = false;
    state.nonCalculationMode = false;
  }
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
});

els.unansweredButton.addEventListener("click", () => {
  clearResultDisplays();
  state.unansweredMode = !state.unansweredMode;
  if (state.unansweredMode) {
    state.followUpMode = false;
    state.favoriteMode = false;
    state.calculationMode = false;
    state.nonCalculationMode = false;
  }
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
});

els.favoriteModeButton?.addEventListener("click", () => {
  clearResultDisplays();
  state.favoriteMode = !state.favoriteMode;
  if (state.favoriteMode) {
    state.followUpMode = false;
    state.unansweredMode = false;
    state.calculationMode = false;
    state.nonCalculationMode = false;
  }
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
});

els.calculationModeButton?.addEventListener("click", () => {
  clearResultDisplays();
  state.calculationMode = !state.calculationMode;
  if (state.calculationMode) {
    state.followUpMode = false;
    state.unansweredMode = false;
    state.favoriteMode = false;
    state.nonCalculationMode = false;
  }
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
});

els.nonCalculationModeButton?.addEventListener("click", () => {
  clearResultDisplays();
  state.nonCalculationMode = !state.nonCalculationMode;
  if (state.nonCalculationMode) {
    state.followUpMode = false;
    state.unansweredMode = false;
    state.favoriteMode = false;
    state.calculationMode = false;
  }
  state.questionIndex = 0;
  setRetakeForSelectedQuestion();
  requestMobileQuizScroll();
  render();
});

els.understandingButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setCurrentUnderstanding(button.dataset.understandingLevel);
    els.understandingToggle?.hidePopover();
    document.querySelector("#understandingMenuButton")?.focus();
  });
});

els.calculationMarkerButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleCurrentCalculationQuestion();
});

els.copyQuestionButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  copyCurrentQuestion();
});
els.questionSourceButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  openQuestionSourceDialog();
});
els.questionSourceClose?.addEventListener("click", closeQuestionSourceDialog);
els.questionSourceDialog?.addEventListener("click", (event) => {
  if (event.target !== els.questionSourceDialog) return;
  const rect = els.questionSourceDialog.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!inside) closeQuestionSourceDialog();
});
els.questionFrequencyBadge?.addEventListener("click", (event) => {
  event.stopPropagation();
  const open = els.questionFrequencyBadge.getAttribute("aria-expanded") === "true";
  setKougaiQuestionFrequencyDetailsOpen(!open);
});
els.llmTeachButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  openLlmTutor();
});
els.llmCopyButton?.addEventListener("click", copyLlmAnswers);
els.llmPanelClose?.addEventListener("click", () => setLlmPanelOpen(false));
// The imported study panel owns the explanation-image launcher.
els.explanationImagesClose?.addEventListener("click", () => setLlmImageLibraryOpen(false));
els.explanationImagesDialog?.addEventListener("keydown", (event) => event.stopPropagation());
els.explanationImagesDialog?.addEventListener("close", () => {
  llmImageLibraryOpen = false;
  renderLlmImageLibrary();
});
els.llmImageLibraryToggle?.addEventListener("click", () => {
  setLlmImageLibraryOpen(!llmImageLibraryOpen);
});
els.llmImageAdd?.addEventListener("click", () => els.llmImageInput?.click());
els.llmImageInput?.addEventListener("change", () => {
  const files = [...(els.llmImageInput.files || [])];
  els.llmImageInput.value = "";
  addLocalLlmImages(files).catch(() => {});
});
els.llmImageGallery?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-llm-image-delete]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  deleteLocalLlmImage(button.dataset.llmImageDelete || "").catch(() => {});
});
for (const imageTransferTarget of [els.llmExplanationPanel, els.explanationImagesDialog]) {
imageTransferTarget?.addEventListener("paste", (event) => {
  const files = llmImageFilesFromTransfer(event.clipboardData);
  if (!files.length) return;
  event.preventDefault();
  addLocalLlmImages(files).catch(() => {});
});
imageTransferTarget?.addEventListener("dragenter", (event) => {
  if (!llmTransferContainsFiles(event.dataTransfer)) return;
  event.preventDefault();
  setLlmImageDragActive(true);
});
imageTransferTarget?.addEventListener("dragover", (event) => {
  if (!llmTransferContainsFiles(event.dataTransfer)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setLlmImageDragActive(true);
});
imageTransferTarget?.addEventListener("dragleave", (event) => {
  if (event.relatedTarget && imageTransferTarget.contains(event.relatedTarget)) return;
  setLlmImageDragActive(false);
});
imageTransferTarget?.addEventListener("drop", (event) => {
  if (!llmTransferContainsFiles(event.dataTransfer)) return;
  event.preventDefault();
  setLlmImageDragActive(false);
  const files = llmImageFilesFromTransfer(event.dataTransfer);
  if (files.length) addLocalLlmImages(files).catch(() => {});
});
}
els.llmSettingsToggle?.addEventListener("click", () => {
  setLlmSettingsOpen(Boolean(els.llmSettings?.hidden));
});
els.llmModelSelect?.addEventListener("change", () => {
  saveLlmModel(els.llmModelSelect.value);
  renderLlmComposerState();
  setLlmStatus(`${llmModelLabel()}を選択しました。次の回答から使います`, "model");
});
els.llmRegenerateButton?.addEventListener("click", () => generateLlmExplanation({ force: true }));
els.llmFollowUpForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitLlmFollowUp();
});
els.llmFollowUpInput?.addEventListener("input", resizeLlmFollowUpInput);
els.llmFollowUpInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  submitLlmFollowUp();
});
els.llmFollowUpSuggestions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-llm-prompt]");
  if (!button || button.disabled || !els.llmFollowUpInput) return;
  els.llmFollowUpInput.value = button.dataset.llmPrompt || "";
  resizeLlmFollowUpInput();
  els.llmFollowUpInput.focus();
});
els.llmApiKeySave?.addEventListener("click", saveLlmApiKey);
els.llmApiKeyDelete?.addEventListener("click", deleteLlmApiKey);
els.llmApiKeyInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") saveLlmApiKey();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.llmExplanationPanel?.hidden) setLlmPanelOpen(false);
  if (event.key === "Escape") setKougaiQuestionFrequencyDetailsOpen(false);
});
els.reviewSessionHud?.addEventListener("click", handleReviewSessionHudClick);

els.imagePreviewBackdrop?.addEventListener("click", closeImagePreview);
els.imagePreviewClose?.addEventListener("click", closeImagePreview);

els.autoAdvanceButton.addEventListener("click", () => {
  state.autoAdvanceMode = false;
  clearAutoAdvanceTimer();
  render();
});

els.sectionLoopButton?.addEventListener("click", () => {
  saveSectionLoopMode(!state.sectionLoopMode);
  render();
});

els.timerToggleButton?.addEventListener("click", () => {
  saveTimerEnabled(!state.timerEnabled);
  stopTimer();
  render();
});

els.studyStopwatchStart?.addEventListener("click", toggleStopwatch);
els.studyStopwatchReset?.addEventListener("click", resetStopwatch);
els.pomodoroToggle?.addEventListener("click", togglePomodoroEnabled);
els.pomodoroSkip?.addEventListener("click", skipPomodoroPhase);
els.pomodoroPreset?.addEventListener("change", () => {
  changePomodoroPreset(els.pomodoroPreset.value);
});
els.pomodoroNotice?.addEventListener("pointerdown", blockPomodoroNoticeEvent);
els.pomodoroNotice?.addEventListener("click", blockPomodoroNoticeEvent);
els.pomodoroNoticeCard?.addEventListener("pointerdown", blockPomodoroNoticeEvent);
els.pomodoroNoticeCard?.addEventListener("click", handlePomodoroNoticeCardClick);
els.studyActivityConfirm?.addEventListener("click", confirmStudyActivityCheck);
document.addEventListener("pointerdown", handleStudyPointerActivity, { passive: true, capture: true });
document.addEventListener("wheel", handleStudyScreenActivity, { passive: true, capture: true });
document.addEventListener("keydown", handleStudyKeyboardActivity, { capture: true });
els.studyReportTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    saveStudyReportMode(tab.dataset.studyReport);
    renderStudyReport();
  });
});
els.fullDataSaveButton?.addEventListener("click", exportFullDataBackup);
els.fullDataLoadButton?.addEventListener("click", () => {
  els.fullDataLoadInput?.click();
});
els.fullDataLoadInput?.addEventListener("change", () => {
  importFullDataBackupFile(els.fullDataLoadInput.files?.[0]);
});
els.studyBackupExport?.addEventListener("click", exportStudyBackup);
els.studyBackupImport?.addEventListener("click", () => {
  els.studyBackupInput?.click();
});
els.studyBackupInput?.addEventListener("change", () => {
  importStudyBackupFile(els.studyBackupInput.files?.[0]);
});
els.studySummaryClose?.addEventListener("click", () => setStudySummaryOpen(false));
els.studySummaryPanel?.addEventListener("click", (event) => {
  if (event.target === els.studySummaryPanel) setStudySummaryOpen(false);
});
els.studySummaryJumpbar?.addEventListener("click", handleStudySummaryJumpbarClick);
els.reviewTargetPanel?.addEventListener("click", handleReviewTargetPanelClick);
els.reviewTodayTargetPanel?.addEventListener("click", handleReviewTodayTargetClick);
els.reviewCurriculumList?.addEventListener("click", handleReviewCurriculumListClick);
els.reviewCourseMap?.addEventListener("click", handleReviewCourseMapClick);
els.reviewLoadRadar?.addEventListener("click", handleReviewLoadRadarClick);
els.reviewSessionHistory?.addEventListener("click", handleReviewHistoryClick);
els.weaknessPanel?.addEventListener("click", handleWeaknessPanelClick);
els.understandingSummary?.addEventListener("click", handleUnderstandingSummaryClick);
els.reviewFocusPanel?.addEventListener("click", handleReviewFocusPanelClick);
els.reviewMomentumPanel?.addEventListener("click", handleReviewMomentumPanelClick);
els.reviewCommandDeckPanel?.addEventListener("click", handleReviewCommandDeckClick);
els.reviewSetBlueprintPanel?.addEventListener("click", handleReviewSetBlueprintClick);
els.reviewOutcomePanel?.addEventListener("click", handleReviewOutcomePanelClick);
els.reviewCoursePulsePanel?.addEventListener("click", handleReviewCoursePulseClick);
els.reviewReturnPanel?.addEventListener("click", handleReviewReturnPanelClick);
els.reviewNextQueuePanel?.addEventListener("click", handleReviewNextQueuePanelClick);
els.reviewAgePanel?.addEventListener("click", handleReviewAgePanelClick);
els.reviewRecoveryBoard?.addEventListener("click", handleReviewRecoveryBoardClick);
els.reviewDialPanel?.addEventListener("click", handleReviewDialPanelClick);
els.studySummaryHero?.addEventListener("click", handleStudyActionPlanClick);
els.studyActionPlan?.addEventListener("click", handleStudyActionPlanClick);
els.studyCheckpointPanel?.addEventListener("click", handleStudyActionPlanClick);
els.studyRoutePanel?.addEventListener("click", handleStudyActionPlanClick);
els.studyEfficiencyPanel?.addEventListener("click", handleStudyActionPlanClick);
els.studyContinuityPanel?.addEventListener("click", handleStudyActionPlanClick);
els.reviewCoachPanel?.addEventListener("click", handleStudyActionPlanClick);
els.reviewOutlookPanel?.addEventListener("click", handleStudyActionPlanClick);
els.reviewCalendarPanel?.addEventListener("click", handleStudyActionPlanClick);
els.reviewSprintPanel?.addEventListener("click", handleStudyActionPlanClick);
els.studyCourseMatrix?.addEventListener("click", handleStudyCourseMatrixClick);
els.examReadinessPanel?.addEventListener("click", handleExamReadinessClick);
els.reviewMasteryTrack?.addEventListener("click", handleReviewMasteryTrackClick);

els.wheelModeButton?.addEventListener("click", () => {
  saveWheelMode(state.wheelMode === "scroll" ? "page" : "scroll");
  wheelPageDelta = 0;
  render();
});

els.immersiveModeButton?.addEventListener("click", () => {
  setVisualThemePickerOpen(false);
  setImmersiveMode(!state.immersiveMode, { requestFullscreen: !state.immersiveMode });
});

els.immersiveExitButton?.addEventListener("click", () => {
  setImmersiveMode(false);
  els.immersiveModeButton?.focus();
});

els.immersiveSoundToggle?.addEventListener("click", () => {
  state.immersiveSoundEnabled = !state.immersiveSoundEnabled;
  try {
    localStorage.setItem(IMMERSIVE_SOUND_STORAGE_KEY, state.immersiveSoundEnabled ? "on" : "off");
  } catch {
    // Keep the setting for this page when storage is unavailable.
  }
  renderImmersiveControls();
  restartImmersiveAmbient();
});

els.immersiveVolumeInput?.addEventListener("input", () => {
  state.immersiveVolume = Math.max(0, Math.min(100, Number(els.immersiveVolumeInput.value) || 0));
  try {
    localStorage.setItem(IMMERSIVE_VOLUME_STORAGE_KEY, String(state.immersiveVolume));
  } catch {
    // Keep the setting for this page when storage is unavailable.
  }
  if (immersiveAmbientMaster && studyAudioContext) {
    immersiveAmbientMaster.gain.setTargetAtTime(
      Math.max(0.0001, (state.immersiveVolume / 100) * 0.055),
      studyAudioContext.currentTime,
      0.04
    );
  }
});

document.addEventListener("fullscreenchange", () => {
  if (state.immersiveMode && immersiveFullscreenRequested && !document.fullscreenElement) {
    setImmersiveMode(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.immersiveMode && !document.fullscreenElement) {
    setImmersiveMode(false);
  }
});

els.themePickerToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  setVisualThemePickerOpen(Boolean(els.themePickerPopover?.hidden));
});

els.themeChoices.forEach((choice) => {
  choice.addEventListener("click", () => {
    applyVisualTheme(choice.dataset.themeChoice, { persist: true });
    setVisualThemePickerOpen(false);
    els.themePickerToggle?.focus();
  });
});

els.themeMotionToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  applyVisualThemeMotion(!state.visualThemeMotionEnabled, { persist: true });
});

document.addEventListener("pointerdown", (event) => {
  if (els.themePickerPopover?.hidden) return;
  if (
    event.target instanceof Node &&
    (els.themePicker?.contains(event.target) || els.themePickerPopover?.contains(event.target))
  ) return;
  setVisualThemePickerOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || els.themePickerPopover?.hidden) return;
  setVisualThemePickerOpen(false);
  els.themePickerToggle?.focus();
});

window.addEventListener("resize", () => {
  if (!els.themePickerPopover?.hidden) positionVisualThemePicker();
});

els.questionAnswerResizeHandle?.addEventListener("click", suppressQuizResizeClick, true);
els.questionAnswerResizeHandle?.addEventListener("pointerdown", startQuizResizeDrag);
window.addEventListener("resize", scheduleSourceLayoutUpdate);
els.feedback?.addEventListener("click", handleReviewSessionFeedbackAction);

els.retryButton.addEventListener("click", () => {
  const question = currentQuestion();
  if (!question) return;
  clearResultDisplays();
  state.retakeQuestionId = question.id;
  render();
});

els.historyMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleHistoryMenu();
});
window.addEventListener("resize", positionHistoryMenu);
window.addEventListener("scroll", positionHistoryMenu, { passive: true, capture: true });
els.historyMenu?.addEventListener("click", (event) => {
  event.stopPropagation();
});
els.resetQuestionButton.addEventListener("click", () => runHistoryDelete(resetQuestionHistory));
els.resetChapterButton.addEventListener("click", () => runHistoryDelete(resetChapterHistory));
els.resetCourseButton.addEventListener("click", () => runHistoryDelete(resetCourseHistory));
els.resetAllButton.addEventListener("click", () => runHistoryDelete(resetAllHistory));
els.historyInlineOk?.addEventListener("click", () => {
  const pending = pendingHistoryDelete;
  if (pending) {
    deleteProgressIds(idsForPendingHistoryDelete(pending));
    if (pending.afterDelete) pending.afterDelete();
    saveProgress();
    render();
  }
  closeHistoryInlineConfirm();
  closeHistoryMenu();
});
els.historyInlineCancel?.addEventListener("click", () => {
  closeHistoryInlineConfirm();
});
document.addEventListener("click", closeHistoryMenu);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setStudySummaryOpen(false);
    closeHistoryInlineConfirm();
    closeHistoryMenu();
  }
});
els.typingSubmit.addEventListener("click", answerTyping);
els.typingInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing) return;
  event.preventDefault();
  event.stopPropagation();
  if (!event.repeat) answerTyping();
});

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const activeElement = document.activeElement;
  const textEditing = ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement?.tagName);
  const numberShortcutIndex = ["1", "2", "3", "4", "5"].indexOf(key);
  const letterShortcutIndex = ["a", "b", "c", "d", "e"].indexOf(key);
  const optionShortcutIndex = numberShortcutIndex >= 0 ? numberShortcutIndex : letterShortcutIndex;
  const plainShortcut = !event.altKey && !event.ctrlKey && !event.metaKey;
  const enterControlActive =
    textEditing ||
    Boolean(activeElement?.isContentEditable) ||
    Boolean(activeElement?.closest?.("button, a, [role='button']"));
  if (!textEditing && plainShortcut && !event.repeat && optionShortcutIndex >= 0) {
    const question = currentQuestion();
    const view = question ? currentViewQuestion() : null;
    if (question && canAnswer(question) && view.options[optionShortcutIndex]) {
      event.preventDefault();
      answerChoice(optionShortcutIndex);
      return;
    }
    if (question && !canAnswer(question)) {
      event.preventDefault();
      goToNextQuestion();
      return;
    }
  }
  if (
    key === "enter" &&
    !event.repeat &&
    !event.isComposing &&
    !event.defaultPrevented &&
    !enterControlActive
  ) {
    const question = currentQuestion();
    if (question && !canAnswer(question)) {
      event.preventDefault();
      goToNextQuestion();
      return;
    }
  }
  if (!textEditing && key === "arrowright" && visibleQuestions().length) {
    goToNextQuestion();
  }
  if (!textEditing && key === "arrowleft" && visibleQuestions().length) {
    goToPreviousQuestion();
  }
});

renderLlmModelOptions();
renderLlmComposerState();
applyVisualThemeMotion(state.visualThemeMotionEnabled);
applyVisualTheme(state.visualTheme);
renderImmersiveControls();
boot();

// Place the native popover beside its trigger; the top layer avoids card clipping.
function positionUnderstandingMenu() {
  const menu = els.understandingToggle;
  const trigger = document.querySelector("#understandingMenuButton");
  if (!menu?.matches(":popover-open") || !trigger) return;
  const rect = trigger.getBoundingClientRect();
  const height = menu.offsetHeight;
  menu.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - menu.offsetWidth - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(rect.bottom + 6, innerHeight - height - 8))}px`;
}
els.understandingToggle?.addEventListener("toggle", positionUnderstandingMenu);
window.addEventListener("resize", positionUnderstandingMenu);
window.addEventListener("scroll", positionUnderstandingMenu, true);

state.llmFontScale = loadLlmFontScale();
els.llmFontDecrease = document.querySelector('#llmFontDecrease');
els.llmFontIncrease = document.querySelector('#llmFontIncrease');
els.llmFontReset = document.querySelector('#llmFontReset');
els.llmFontDecrease?.addEventListener('click', () => setLlmFontScale(state.llmFontScale - 10));
els.llmFontIncrease?.addEventListener('click', () => setLlmFontScale(state.llmFontScale + 10));
els.llmFontReset?.addEventListener('click', () => setLlmFontScale(100));
renderLlmFontControls();
