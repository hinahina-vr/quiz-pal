import http from "node:http";
import path from "node:path";
import { readFile, realpath } from "node:fs/promises";

const root = path.resolve(import.meta.dirname, "..");
const docs = await realpath(path.join(root, "docs"));
const config = JSON.parse(await readFile(path.join(root, "publication.config.json"), "utf8"));
const prefix = `/${config.repository}/`;
const args = process.argv.slice(2);
const port = args.includes("--port") ? Number(args[args.indexOf("--port") + 1]) : 4173;
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Use --port with a port number, or 0 for an available port");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".zip": "application/zip" };
const server = http.createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/") { response.writeHead(302, { Location: prefix }); response.end(); return; }
    if (!url.pathname.startsWith(prefix)) throw new Error("Not found");
    const candidate = path.resolve(docs, decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html");
    if (!candidate.startsWith(docs + path.sep)) throw new Error("Not found");
    const resolved = await realpath(candidate);
    if (!resolved.startsWith(docs + path.sep)) throw new Error("Not found");
    const data = await readFile(resolved);
    response.writeHead(200, { "Content-Type": types[path.extname(resolved)] || "application/octet-stream", "Content-Length": data.length, "Cache-Control": "no-cache" });
    response.end(request.method === "HEAD" ? undefined : data);
  } catch { response.writeHead(404); response.end(); }
});
server.listen(port, "127.0.0.1", () => console.log(`Local preview only: http://127.0.0.1:${server.address().port}${prefix}`));
