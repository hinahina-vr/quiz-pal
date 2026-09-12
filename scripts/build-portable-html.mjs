import { readFile, writeFile, mkdir, readdir, copyFile, rm, realpath } from "node:fs/promises";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
import { build, loadConfigFromFile } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const packageRoot = path.join(artifacts, "Quiz-Pal-HTML");
await mkdir(artifacts, { recursive: true });
try {
  const resolved = await realpath(packageRoot);
  const parent = await realpath(artifacts);
  if (path.dirname(resolved) !== parent || path.basename(resolved) !== "Quiz-Pal-HTML") throw new Error("Unsafe package cleanup target");
  await rm(resolved, { recursive: true });
} catch (error) { if (error.code !== "ENOENT") throw error; }
await mkdir(packageRoot, { recursive: true });

await import("./build-legacy-sample-data.mjs");
async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const item of await readdir(from, { withFileTypes: true })) {
    if (item.name === "vendor" || /^KaiseiOpti-.*\.ttf$/.test(item.name)) continue;
    const source = path.join(from, item.name), destination = path.join(to, item.name);
    if (item.isDirectory()) await copyTree(source, destination);
    else if (item.isFile()) await copyFile(source, destination);
  }
}
await copyTree(path.join(root, "public"), packageRoot);

const { config } = await loadConfigFromFile({ command: "build", mode: "production" }, path.join(root, "vite.config.ts"));
await build({
  configFile: false, root, publicDir: false, resolve: config.resolve, base: "./",
  build: {
    outDir: packageRoot, emptyOutDir: false,
    lib: { entry: path.join(root, "src/main.tsx"), name: "QuizPalStudio", formats: ["iife"], fileName: () => "studio.bundle.js" },
    // IIFE library output bundles the lazy data dialog into the same classic script.
  },
});

function extractPage(html, kind) {
  const scripts = [];
  const cleaned = html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (_tag, attrs) => {
    const source = attrs.match(/\bsrc="([^"]+)"/)?.[1];
    if (!source) throw new Error(`Unexpected inline script in ${kind}`);
    if (source.includes("stage-bootstrap.js")) scripts.push("./html-stage.js");
    else if (source === "/src/main.tsx") scripts.push("./studio.bundle.js");
    else if (/^\.\/data\.js(?:\?|$)/.test(source)) scripts.push("./llm-provider-bridge.js?v=4", source);
    else scripts.push(source);
    return "";
  });
  const head = cleaned.match(/<head>([\s\S]*?)<\/head>/i)?.[1] || "";
  return {
    title: head.match(/<title>(.*?)<\/title>/i)?.[1] || "Quiz Pal",
    head: head.replace(/<title>[\s\S]*?<\/title>|<meta\b[^>]*>/gi, ""),
    bodyClass: cleaned.match(/<body[^>]*\bclass="([^"]*)"/i)?.[1] || "",
    body: cleaned.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "",
    scripts,
  };
}
const pages = {};
for (const [kind, file] of [["quiz", "index.html"], ["studio", "studio.html"], ["legal", "public/legal.html"]]) {
  pages[kind] = extractPage(await readFile(path.join(root, file), "utf8"), kind);
}
await writeFile(path.join(packageRoot, "html-pages.js"), `window.__quizPalHtmlPages = ${JSON.stringify(pages).replaceAll("<", "\\u003c")};\n`);
const dataPath = path.join(packageRoot, "data.js");
const data = await readFile(dataPath, "utf8");
if (!data.startsWith("document.write(")) throw new Error("Review the dataset bridge bootstrap before building HTML distribution");
await writeFile(dataPath, data.slice(data.indexOf("\n") + 1));
const stage = await readFile(path.join(root, "public/native-stage.js"), "utf8");
await writeFile(path.join(packageRoot, "html-stage.js"), `(() => { if (window.__quizZenLiteMode) return;\n${stage}\n})();\n`);
for (const [source, target] of [["portable/html/index.html", "index.html"], ["portable/html/boot.js", "html-boot.js"], ["portable/html/README.html", "README.html"], ["LICENSE", "LICENSE"], ["LICENSE-CONTENT", "LICENSE-CONTENT"], ["THIRD_PARTY_NOTICES.md", "THIRD_PARTY_NOTICES.md"]]) {
  await copyFile(path.join(root, source), path.join(packageRoot, target));
}
// Only index.html owns app storage. Redirect old/extra entry links to that same file.
for (const view of ["studio", "legal"]) await writeFile(path.join(packageRoot, `${view}.html`), `<!doctype html><meta charset="utf-8"><title>Quiz Pal</title><meta http-equiv="refresh" content="0;url=./index.html#/${view}"><a href="./index.html#/${view}">Quiz Pal を開く</a>`);

// A standard ZIP using only Node built-ins; no end-user runtime or installer.
const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
const crc32 = bytes => {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return (crc ^ 0xffffffff) >>> 0;
};
const chunks = [], directory = [], manifest = []; let offset = 0;
async function archiveTree(folder) {
  for (const item of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) { await archiveTree(file); continue; }
    if (!item.isFile()) continue;
    const name = Buffer.from(path.relative(artifacts, file).split(path.sep).join("/"));
    const raw = await readFile(file), compressed = deflateRawSync(raw), crc = crc32(raw);
    const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6); header.writeUInt16LE(8, 8); header.writeUInt16LE(33, 12); header.writeUInt32LE(crc, 14); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(raw.length, 22); header.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); header.copy(central, 6, 4, 28); central.writeUInt32LE(offset, 42);
    chunks.push(header, name, compressed); directory.push(central, name); offset += header.length + name.length + compressed.length;
    manifest.push({ path: name.toString(), size: raw.length, sha256: createHash("sha256").update(raw).digest("hex") });
  }
}
await archiveTree(packageRoot);
const centralSize = directory.reduce((total, buffer) => total + buffer.length, 0);
const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(manifest.length, 8); end.writeUInt16LE(manifest.length, 10); end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...chunks, ...directory, end]);
const zipPath = path.join(artifacts, "Quiz-Pal-HTML.zip");
await writeFile(zipPath, zip);
const hash = createHash("sha256").update(zip).digest("hex");
await writeFile(path.join(artifacts, "Quiz-Pal-HTML.manifest.json"), JSON.stringify({ zip: "Quiz-Pal-HTML.zip", sha256: hash, files: manifest }, null, 2));
console.log(`HTML ZIP: ${zipPath}\nSHA256: ${hash}`);
