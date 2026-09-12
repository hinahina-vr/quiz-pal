/* Runtime data validation used by authoring, CSV and backup flows. */
export interface ValidationIssue { code: string; path: Array<string | number>; message: string }

export class ValidationError extends Error {
  issues: ValidationIssue[];
  constructor(issues: ValidationIssue[]) {
    super(issues[0]?.message || "入力値が正しくありません。");
    this.name = "ValidationError";
    this.issues = issues;
  }
}

type ParseFunction<T> = (value: unknown, path: Array<string | number>, issues: ValidationIssue[]) => T;
type RefinementContext = { addIssue(issue: { code?: string; path?: Array<string | number>; message: string }): void };

export class Schema<T> {
  readonly parseValue: ParseFunction<T>;
  constructor(parseValue: ParseFunction<T>) { this.parseValue = parseValue; }

  parse(value: unknown): T {
    const issues: ValidationIssue[] = [];
    const output = this.parseValue(value, [], issues);
    if (issues.length) throw new ValidationError(issues);
    return output;
  }

  safeParse(value: unknown): { success: true; data: T } | { success: false; error: ValidationError } {
    try { return { success: true, data: this.parse(value) }; }
    catch (error) { return { success: false, error: error instanceof ValidationError ? error : new ValidationError([{ code: "custom", path: [], message: error instanceof Error ? error.message : "入力値が正しくありません。" }]) }; }
  }

  private derive<U>(transform: (value: T, path: Array<string | number>, issues: ValidationIssue[]) => U): Schema<U> {
    return new Schema((value, path, issues) => transform(this.parseValue(value, path, issues), path, issues));
  }

  trim(): Schema<T> { return this.derive((value) => (typeof value === "string" ? value.trim() : value) as T); }

  min(limit: number, message?: string): Schema<T> {
    return this.derive((value, path, issues) => {
      const size = typeof value === "number" ? value : (value as string | unknown[])?.length;
      if (typeof size !== "number" || size < limit) issues.push({ code: "too_small", path, message: message || `${limit}以上で入力してください。` });
      return value;
    });
  }

  max(limit: number, message?: string): Schema<T> {
    return this.derive((value, path, issues) => {
      const size = typeof value === "number" ? value : (value as string | unknown[])?.length;
      if (typeof size !== "number" || size > limit) issues.push({ code: "too_big", path, message: message || `${limit}以下で入力してください。` });
      return value;
    });
  }

  length(expected: number, message?: string): Schema<T> {
    return this.derive((value, path, issues) => {
      if ((value as string | unknown[])?.length !== expected) issues.push({ code: "invalid_length", path, message: message || `${expected}件必要です。` });
      return value;
    });
  }

  regex(pattern: RegExp, message?: string): Schema<T> {
    return this.derive((value, path, issues) => {
      pattern.lastIndex = 0;
      if (typeof value !== "string" || !pattern.test(value)) issues.push({ code: "invalid_string", path, message: message || "形式が正しくありません。" });
      return value;
    });
  }

  url(message?: string): Schema<T> {
    return this.refine((value) => { try { new URL(String(value)); return true; } catch { return false; } }, message || "URLの形式が正しくありません。");
  }

  int(message?: string): Schema<T> { return this.refine((value) => typeof value === "number" && Number.isInteger(value), message || "整数で入力してください。"); }
  nonnegative(message?: string): Schema<T> { return this.refine((value) => typeof value === "number" && value >= 0, message || "0以上で入力してください。"); }
  positive(message?: string): Schema<T> { return this.refine((value) => typeof value === "number" && value > 0, message || "0より大きい値を入力してください。"); }

  nullable(): Schema<T | null> {
    return new Schema((value, path, issues) => value === null ? null : this.parseValue(value, path, issues));
  }

  optional(): Schema<T | undefined> {
    return new Schema((value, path, issues) => value === undefined ? undefined : this.parseValue(value, path, issues));
  }

  default(fallback: Exclude<T, undefined>): Schema<Exclude<T, undefined>> {
    return new Schema((value, path, issues) => this.parseValue(value === undefined ? fallback : value, path, issues) as Exclude<T, undefined>);
  }

  refine(predicate: (value: T) => boolean, message = "入力値が正しくありません。"): Schema<T> {
    return this.derive((value, path, issues) => {
      let valid = false;
      try { valid = predicate(value); } catch { valid = false; }
      if (!valid) issues.push({ code: "custom", path, message });
      return value;
    });
  }

  superRefine(refinement: (value: T, context: RefinementContext) => void): Schema<T> {
    return this.derive((value, path, issues) => {
      refinement(value, { addIssue(issue) { issues.push({ code: issue.code || "custom", path: [...path, ...(issue.path || [])], message: issue.message }); } });
      return value;
    });
  }
}

type Shape = Record<string, Schema<unknown>>;
type InferSchema<S> = S extends Schema<infer T> ? T : never;
type OptionalKeys<S extends Shape> = { [K in keyof S]: undefined extends InferSchema<S[K]> ? K : never }[keyof S];
type InferShape<S extends Shape> =
  { [K in Exclude<keyof S, OptionalKeys<S>>]: InferSchema<S[K]> } &
  { [K in OptionalKeys<S>]?: Exclude<InferSchema<S[K]>, undefined> };

function issue(issues: ValidationIssue[], path: Array<string | number>, code: string, message: string) {
  issues.push({ code, path, message });
}

const stringSchema = () => new Schema<string>((value, path, issues) => {
  if (typeof value !== "string") { issue(issues, path, "invalid_type", "文字列を入力してください。"); return ""; }
  return value;
});
const numberSchema = () => new Schema<number>((value, path, issues) => {
  if (typeof value !== "number" || !Number.isFinite(value)) { issue(issues, path, "invalid_type", "数値を入力してください。"); return 0; }
  return value;
});
const booleanSchema = () => new Schema<boolean>((value, path, issues) => {
  if (typeof value !== "boolean") { issue(issues, path, "invalid_type", "真偽値を入力してください。"); return false; }
  return value;
});

export const z = {
  string: stringSchema,
  number: numberSchema,
  boolean: booleanSchema,
  unknown: () => new Schema<unknown>((value) => value),
  literal<const T extends string | number | boolean | null>(literalValue: T) {
    return new Schema<T>((value, path, issues) => {
      if (!Object.is(value, literalValue)) issue(issues, path, "invalid_literal", `値は${String(literalValue)}である必要があります。`);
      return literalValue;
    });
  },
  enum<const T extends readonly [string, ...string[]]>(values: T) {
    return new Schema<T[number]>((value, path, issues) => {
      if (typeof value !== "string" || !values.includes(value)) { issue(issues, path, "invalid_enum", "選択肢にない値です。"); return values[0]; }
      return value as T[number];
    });
  },
  array<T>(item: Schema<T>) {
    return new Schema<T[]>((value, path, issues) => {
      if (!Array.isArray(value)) { issue(issues, path, "invalid_type", "配列である必要があります。"); return []; }
      return value.map((child, index) => item.parseValue(child, [...path, index], issues));
    });
  },
  object<S extends Shape>(shape: S) {
    return new Schema<InferShape<S>>((value, path, issues) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) { issue(issues, path, "invalid_type", "オブジェクトである必要があります。"); value = {}; }
      const record = value as Record<string, unknown>;
      return Object.fromEntries(Object.entries(shape).map(([key, schema]) => [key, schema.parseValue(record[key], [...path, key], issues)])) as InferShape<S>;
    });
  },
  discriminatedUnion<K extends string, S extends readonly Schema<unknown>[]>(key: K, schemas: S) {
    return new Schema<InferSchema<S[number]>>((value, path, issues) => {
      let closest: { parsed: unknown; issues: ValidationIssue[] } | null = null;
      for (const schema of schemas) {
        const candidateIssues: ValidationIssue[] = [];
        const parsed = schema.parseValue(value, path, candidateIssues);
        if (!candidateIssues.length) return parsed as InferSchema<S[number]>;
        if (!closest || candidateIssues.length < closest.issues.length) closest = { parsed, issues: candidateIssues };
      }
      if (closest) {
        issues.push(...closest.issues);
        return closest.parsed as InferSchema<S[number]>;
      }
      issue(issues, [...path, key], "invalid_union", "指定された形式に一致しません。");
      return undefined as InferSchema<S[number]>;
    });
  },
};

export namespace z {
  export type infer<S extends Schema<unknown>> = S extends Schema<infer T> ? T : never;
}
