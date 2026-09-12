import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const read = file => readFile(path.join(root, file));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(await read("PUBLICATION_MANIFEST.json"));
if (manifest.status !== "local-preparation-only") throw new Error("Unexpected publication state");
for (const file of manifest.sourceFiles) if (hash(await read(file.path)) !== file.sha256) throw new Error(`Source changed; rebuild and retest: ${file.path}`);
for (const file of manifest.siteFiles) if (hash(await read("docs/" + file.path)) !== file.sha256) throw new Error(`Generated site changed: ${file.path}`);
if (hash(await read("docs/" + manifest.download.path)) !== manifest.download.sha256) throw new Error("Download ZIP differs from the tested build");
for (const file of manifest.portableFiles) {
  const sitePath = file.path.replace(/^Quiz-Pal-HTML\//, "");
  if (hash(await read("docs/" + sitePath)) !== file.sha256) throw new Error(`Web and portable files differ: ${sitePath}`);
}
const pkg = JSON.parse(await read("package.json"));
if (Object.keys(pkg.dependencies || {}).length) throw new Error("Unexpected browser runtime dependency");
const findings = [];
const textExtensions = /\.(?:html|js|mjs|cjs|ts|tsx|css|json|md|txt)$/i;
const ignored = new Set(["node_modules", "artifacts", "dist", ".git", "qa-local"]);
async function scan(directory, prefix = "") {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + item.name, absolute = path.join(directory, item.name);
    if (ignored.has(item.name)) continue;
    if (/^\.env(?:\.|$)|^(?:browser|firefox)-profile|\.log$|\.exe$|\.cs$/i.test(item.name)) findings.push({ path: relative, reason: "Unexpected private or platform-specific file" });
    if (item.isDirectory()) { await scan(absolute, relative + "/"); continue; }
    if (!item.isFile()) { findings.push({ path: relative, reason: "Unexpected link or special file" }); continue; }
    if ((await stat(absolute)).size > 100 * 1024 * 1024) findings.push({ path: relative, reason: "File exceeds 100 MiB" });
    if (!textExtensions.test(item.name)) continue;
    const text = await readFile(absolute, "utf8");
    // Report only location and token type, never the matched credential value.
    if (/(?:sk-or-v1-|sk-proj-|github_pat_|gh[pousr]_)[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) findings.push({ path: relative, reason: "Credential-like pattern" });
    if (/^(?:src|public|portable)\//.test(relative) || relative === "index.html") {
      if (/https:\/\/(?:local-quiz-studio\.pages\.dev|github\.com\/hinahina-vr\/local-quiz-studio-contest)/.test(text)) findings.push({ path: relative, reason: "Old publication URL" });
    }
  }
}
await scan(root);
for (const entry of ["index.html", "studio.html", "public/legal.html", "portable/html/index.html"]) {
  const html = (await read(entry)).toString();
  if (/<(?:script|link)\b[^>]*(?:src|href)="(?:https?:)?\/\//i.test(html)) findings.push({ path: entry, reason: "External runtime asset" });
}
if (findings.length) { console.error(JSON.stringify(findings, null, 2)); process.exitCode = 1; }
else console.log(JSON.stringify({ passed: true, sourceFiles: manifest.sourceFiles.length, siteFiles: manifest.siteFiles.length, portableFiles: manifest.portableFiles.length, runtimeDependencies: 0, downloadSha256: manifest.download.sha256, scope: "Local file identity, runtime boundary and limited credential-pattern scan; not a Git-history, deployed-site or physical-phone test." }, null, 2));
