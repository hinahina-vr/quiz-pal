import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Rename only the local planned destination. This script has no network calls.
const root = path.resolve(import.meta.dirname, "..");
const configPath = path.join(root, "publication.config.json");
const current = JSON.parse(await readFile(configPath, "utf8"));
const args = process.argv.slice(2);
const value = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const next = { ...current, owner: value("--owner", current.owner), repository: value("--repository", current.repository) };
if (!args.length) throw new Error("Use --owner NAME and/or --repository NAME to update the local planned destination");
if (typeof next.owner !== "string" || typeof next.repository !== "string" || !/^[a-z\d]+(?:-[a-z\d]+)*$/i.test(next.owner) || !/^[a-z\d][a-z\d._-]{0,99}$/i.test(next.repository)) throw new Error("Invalid owner or repository name");
const oldRepository = `https://github.com/${current.owner}/${current.repository}`, nextRepository = `https://github.com/${next.owner}/${next.repository}`;
const oldSite = `https://${current.owner}.github.io/${current.repository}/`, nextSite = `https://${next.owner}.github.io/${next.repository}/`;
for (const file of ["index.html", "src/App.tsx", "public/legal.html", "README.md", "SUBMISSION.md", "CONTEST_COMPLIANCE.md", "PUBLISHING.md"]) {
  const target = path.join(root, file);
  try { const text = await readFile(target, "utf8"); await writeFile(target, text.replaceAll(oldRepository, nextRepository).replaceAll(oldSite, nextSite)); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
next.repositoryNameConfirmed = true;
await writeFile(configPath, JSON.stringify(next, null, 2) + "\n");
console.log("Local planned destination updated. Run npm test, npm run prepare:contest, and repeat affected browser checks. Nothing uploaded.");
