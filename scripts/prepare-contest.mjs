import { readFile, writeFile, mkdir, readdir, copyFile, rm, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

// This script only creates local files. It never creates a repository or deploys.
const root = path.resolve(import.meta.dirname, "..");
const docs = path.join(root, "docs");
const artifact = path.join(root, "artifacts", "Quiz-Pal-HTML");
const config = JSON.parse(await readFile(path.join(root, "publication.config.json"), "utf8"));
if (!/^[a-z\d]+(?:-[a-z\d]+)*$/i.test(config.owner) || !/^[a-z\d][a-z\d._-]{0,99}$/i.test(config.repository)) throw new Error("Check owner and repository in publication.config.json");
const repositoryUrl = `https://github.com/${config.owner}/${config.repository}`;
const siteUrl = `https://${config.owner}.github.io/${config.repository}/`;
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const archive = await readFile(path.join(root, "artifacts", "Quiz-Pal-HTML.zip"));
const originalManifest = JSON.parse(await readFile(path.join(root, "artifacts", "Quiz-Pal-HTML.manifest.json"), "utf8"));
if (sha256(archive) !== originalManifest.sha256) throw new Error("Rebuild the HTML ZIP before preparing the site");

try {
  const resolved = await realpath(docs);
  if (resolved !== path.join(await realpath(root), "docs")) throw new Error("Unsafe generated-site cleanup target");
  await rm(resolved, { recursive: true });
} catch (error) { if (error.code !== "ENOENT") throw error; }

async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const item of await readdir(from, { withFileTypes: true })) {
    const source = path.join(from, item.name), destination = path.join(to, item.name);
    if (item.isDirectory()) await copyTree(source, destination);
    else if (item.isFile()) await copyFile(source, destination);
    else throw new Error(`Unexpected link or special file: ${source}`);
  }
}
await copyTree(artifact, docs);
await mkdir(path.join(docs, "downloads"), { recursive: true });
await writeFile(path.join(docs, "downloads", "Quiz-Pal-HTML.zip"), archive);
await writeFile(path.join(docs, ".nojekyll"), "");

async function inventory(directory, prefix = "") {
  const items = [];
  for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, item.name), relative = prefix + item.name;
    if (item.isDirectory()) items.push(...await inventory(file, relative + "/"));
    else if (item.isFile()) { const bytes = await readFile(file); items.push({ path: relative, size: bytes.length, sha256: sha256(bytes) }); }
    else throw new Error(`Unexpected link or special file: ${file}`);
  }
  return items;
}
const sourceFiles = [];
for (const directory of ["src", "public", "portable/html"]) sourceFiles.push(...await inventory(path.join(root, directory), directory + "/"));
for (const file of ["index.html", "studio.html", "vite.config.ts", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "package.json", "package-lock.json", "publication.config.json", "LICENSE", "LICENSE-CONTENT", "THIRD_PARTY_NOTICES.md", "scripts/build-legacy-sample-data.mjs", "scripts/build-portable-html.mjs", "scripts/prepare-contest.mjs"]) {
  const bytes = await readFile(path.join(root, file)); sourceFiles.push({ path: file, size: bytes.length, sha256: sha256(bytes) });
}
const manifest = { schemaVersion: 1, preparedAt: new Date().toISOString(), status: "local-preparation-only", plannedRepositoryUrl: repositoryUrl, plannedSiteUrl: siteUrl, repositoryNameConfirmed: config.repositoryNameConfirmed, sourceFiles, siteFiles: await inventory(docs), download: { path: "downloads/Quiz-Pal-HTML.zip", size: archive.length, sha256: originalManifest.sha256 }, portableFiles: originalManifest.files };
await writeFile(path.join(root, "PUBLICATION_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Prepared local docs/ and HTML download. Nothing uploaded.\nPlanned site: ${siteUrl}\nZIP SHA256: ${manifest.download.sha256}`);
