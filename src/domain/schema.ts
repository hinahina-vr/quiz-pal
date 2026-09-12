import { z } from "../native-validation";

export const questionTypeSchema = z.enum(["single_choice", "multiple_choice", "true_false", "text"]);

export const subjectSchema = z.object({
  completed: z.boolean().optional(),
  id: z.string().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  order: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const sectionSchema = z.object({
  id: z.string().min(1).max(120),
  subjectId: z.string().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  order: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const questionSchema = z.object({
  id: z.string().min(1).max(120),
  sectionId: z.string().min(1).max(120),
  type: questionTypeSchema,
  promptMarkdown: z.string().trim().min(1).max(20000),
  options: z.array(z.object({ id: z.string().min(1), text: z.string().max(10000) })).max(6),
  correctOptionIds: z.array(z.string()).max(6),
  acceptedAnswers: z.array(z.string().max(1000)).max(20),
  explanationMarkdown: z.string().max(20000),
  tags: z.array(z.string().max(60)).max(30),
  timeLimitSeconds: z.number().int().min(5).max(3600).nullable(),
  order: z.number().int().nonnegative(),
  contentRevision: z.number().int().positive(),
  origin: z.string().optional(),
  license: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).superRefine((question, context) => {
  if (question.type === "text" && question.acceptedAnswers.length === 0) {
    context.addIssue({ code: "custom", path: ["acceptedAnswers"], message: "文字入力問題には正答候補が必要です。" });
  }
  if (question.type !== "text" && question.correctOptionIds.length === 0) {
    context.addIssue({ code: "custom", path: ["correctOptionIds"], message: "正答を選択してください。" });
  }
  if (["single_choice", "multiple_choice"].includes(question.type) && question.options.length < 2) {
    context.addIssue({ code: "custom", path: ["options"], message: "選択問題には2件以上の選択肢が必要です。" });
  }
});
