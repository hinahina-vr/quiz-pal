import { readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFile(resolve(root, file), "utf8");

async function sourceFiles(directory: string): Promise<string[]> {
  const absolute = resolve(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relative = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(relative) : [relative];
  }));
  return files.flat();
}

describe("contest runtime dependency boundary", () => {
  it("has no application runtime npm dependencies", async () => {
    const manifest = JSON.parse(await read("package.json"));
    expect(manifest.dependencies).toEqual({});
  });

  it("loads scripts, styles, and fonts only from the submitted site", async () => {
    const html = `${await read("index.html")}\n${await read("studio.html")}`;
    const references = [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1]);
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(reference, reference).not.toMatch(/^https?:\/\//i);
      expect(reference, reference).not.toMatch(/(?:^|\/)vendor\//i);
    }
  });

  it("keeps every application source import local or browser-native", async () => {
    const files = (await sourceFiles("src"))
      .filter((file) => [".ts", ".tsx"].includes(extname(file)));
    const nonLocal: Array<{ file: string; specifier: string }> = [];
    for (const file of files) {
      const source = await read(file);
      const imports = [...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)]
        .map((match) => match[1]);
      for (const specifier of imports) {
        if (!specifier.startsWith(".") && specifier !== "native-ui") nonLocal.push({ file, specifier });
      }
    }
    expect(nonLocal).toEqual([]);
  });

  it("ships repository-owned replacements instead of the former libraries", async () => {
    const [runtime, stage, database, csv, validation] = await Promise.all([
      read("public/native-runtime.js"),
      read("public/native-stage.js"),
      read("src/native-db.ts"),
      read("src/features/csv-import/csv.ts"),
      read("src/native-validation.ts"),
    ]);
    expect(stage).toContain('getContext("2d"');
    expect(stage).not.toMatch(/three(?:\.module)?|\bTHREE\b/i);
    expect(database).not.toMatch(/\bDexie\b/);
    expect(csv).not.toMatch(/Papa(?:\.|\s*Parse)/i);
    expect(validation).not.toMatch(/from\s+["']zod["']/i);
    expect(`${runtime}\n${stage}`).not.toMatch(/sourceMappingURL|webpackBootstrap|__webpack_require__/i);
  });
});
