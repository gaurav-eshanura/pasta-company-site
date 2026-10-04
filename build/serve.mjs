/** Minimal static file server for local preview and the audit harness. */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Deliberately not 4173: the sibling nuts-company-site preview server claims
// that port, and a failed bind here would silently serve someone else's site.
const PORT = Number(process.env.PORT || 4180);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export function start(port = PORT) {
  const server = createServer(async (req, res) => {
    try {
      // Strip any traversal before joining so a request cannot escape ROOT.
      const url = new URL(req.url, "http://localhost");
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith("/")) rel += "index.html";
      const path = join(ROOT, normalize(rel).replace(/^(\.\.[/\\])+/, ""));
      if (!path.startsWith(ROOT)) {
        res.writeHead(403).end("Forbidden");
        return;
      }

      const info = await stat(path).catch(() => null);
      const file = info?.isDirectory() ? join(path, "index.html") : path;
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": TYPES[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      const fallback = await readFile(join(ROOT, "404.html")).catch(() => "Not found");
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(fallback);
    }
  });

  return new Promise((resolve, reject) => {
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} is already in use — something else is already serving it.\n` +
              `Start on a different port with:  PORT=4181 npm run serve`
          )
        );
      } else {
        reject(err);
      }
    });
    server.listen(port, () => resolve(server));
  });
}

// Only self-start when run directly. process.argv[1] is absent under `node -e`,
// so resolve it defensively rather than assuming it is a file path.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  start().then(
    () => console.log(`serving The Pasta Company on http://127.0.0.1:${PORT}`),
    (err) => {
      console.error(err.message);
      process.exit(1);
    }
  );
}
