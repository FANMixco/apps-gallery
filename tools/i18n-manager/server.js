const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const i18nDir = path.join(rootDir, "js", "i18n");
const technologyCatalogPath = path.join(i18nDir, "technologies.json");
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  if (Buffer.isBuffer(body) || typeof body === "string") {
    res.end(body);
    return;
  }

  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function isLanguageName(value) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value || "");
}

function isJsonFileName(value) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.json$/.test(value || "") && !value.endsWith(".min.json");
}

function languagePath(lang) {
  if (!isLanguageName(lang)) {
    throw new Error("Invalid language name.");
  }

  const target = path.resolve(i18nDir, lang);
  if (!target.startsWith(i18nDir + path.sep)) {
    throw new Error("Invalid language path.");
  }

  return target;
}

function sourceFilePath(lang, file) {
  if (!isJsonFileName(file)) {
    throw new Error("Invalid JSON file name.");
  }

  const target = path.resolve(languagePath(lang), file);
  if (!target.startsWith(languagePath(lang) + path.sep)) {
    throw new Error("Invalid JSON file path.");
  }

  return target;
}

function minFilePath(lang, file) {
  return sourceFilePath(lang, file).replace(/\.json$/i, ".min.json");
}

function ensureI18nDir() {
  fs.mkdirSync(i18nDir, { recursive: true });
}

function listJsonFiles(lang) {
  const dir = languagePath(lang);
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir)
    .filter(file => isJsonFileName(file))
    .sort((a, b) => a.localeCompare(b));
}

function getOverview() {
  ensureI18nDir();
  const languages = fs.readdirSync(i18nDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && isLanguageName(entry.name))
    .map(entry => {
      const files = listJsonFiles(entry.name);
      return { name: entry.name, fileCount: files.length };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const fileSet = new Set();
  languages.forEach(language => listJsonFiles(language.name).forEach(file => fileSet.add(file)));

  return {
    languages,
    files: Array.from(fileSet).sort((a, b) => a.localeCompare(b))
  };
}

function parseJson(raw) {
  return JSON.parse(raw);
}

function readJsonFile(filePath) {
  return parseJson(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function technologyLabel(entry) {
  if (typeof entry === "string") {
    return entry;
  }

  if (Array.isArray(entry)) {
    const first = entry[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first.tooltip || first.text || first.icon || first.id || first.type || "Technology";
    }
    return `Array (${entry.length})`;
  }

  if (entry && typeof entry === "object") {
    return entry.tooltip || entry.text || entry.icon || entry.id || entry.type || "Technology";
  }

  return String(entry);
}

function technologyKind(entry) {
  if (typeof entry === "string") {
    return "class";
  }

  if (Array.isArray(entry)) {
    const first = entry[0];
    return first?.type || "group";
  }

  return entry?.type || typeof entry;
}

function collectTechnologies(value, found) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectTechnologies(item, found));
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    if (key === "technologies" && Array.isArray(child)) {
      child.forEach(entry => {
        const serialized = JSON.stringify(entry);
        if (!found.has(serialized)) {
          found.set(serialized, {
            label: technologyLabel(entry),
            kind: technologyKind(entry),
            value: entry
          });
        }
      });
      return;
    }

    collectTechnologies(child, found);
  });
}

function refreshTechnologyCatalog() {
  ensureI18nDir();
  const found = new Map();

  getOverview().languages.forEach(language => {
    listJsonFiles(language.name).forEach(file => {
      collectTechnologies(readJsonFile(sourceFilePath(language.name, file)), found);
    });
  });

  const technologies = Array.from(found.values())
    .sort((a, b) => a.label.localeCompare(b.label) || a.kind.localeCompare(b.kind));
  const catalog = {
    updatedAt: new Date().toISOString(),
    count: technologies.length,
    technologies
  };

  fs.writeFileSync(technologyCatalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return catalog;
}

function loadTechnologyCatalog() {
  if (!fs.existsSync(technologyCatalogPath)) {
    return refreshTechnologyCatalog();
  }

  return readJsonFile(technologyCatalogPath);
}

function formatJson(raw) {
  return `${JSON.stringify(parseJson(raw), null, 2)}\n`;
}

function minifyFile(lang, file) {
  const sourcePath = sourceFilePath(lang, file);
  const raw = fs.readFileSync(sourcePath, "utf8");
  const minified = JSON.stringify(parseJson(raw));
  const outputPath = minFilePath(lang, file);
  fs.writeFileSync(outputPath, minified, "utf8");
  return {
    source: path.relative(rootDir, sourcePath).replace(/\\/g, "/"),
    output: path.relative(rootDir, outputPath).replace(/\\/g, "/"),
    bytes: Buffer.byteLength(minified, "utf8")
  };
}

function minifyLanguage(lang) {
  return listJsonFiles(lang).map(file => minifyFile(lang, file));
}

function minifyAll() {
  return getOverview().languages.flatMap(language => minifyLanguage(language.name));
}

async function handleApi(req, res, pathname, query) {
  try {
    if (req.method === "GET" && pathname === "/api/i18n") {
      send(res, 200, getOverview());
      return;
    }

    if (req.method === "GET" && pathname === "/api/technologies") {
      send(res, 200, loadTechnologyCatalog());
      return;
    }

    if (req.method === "POST" && pathname === "/api/technologies/refresh") {
      const catalog = refreshTechnologyCatalog();
      send(res, 200, {
        ok: true,
        path: path.relative(rootDir, technologyCatalogPath).replace(/\\/g, "/"),
        ...catalog
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/file") {
      const filePath = sourceFilePath(query.lang, query.file);
      if (!fs.existsSync(filePath)) {
        send(res, 404, { error: "File not found." });
        return;
      }

      const raw = fs.readFileSync(filePath, "utf8");
      send(res, 200, {
        lang: query.lang,
        file: query.file,
        path: path.relative(rootDir, filePath).replace(/\\/g, "/"),
        minPath: path.relative(rootDir, minFilePath(query.lang, query.file)).replace(/\\/g, "/"),
        raw,
        parsed: parseJson(raw)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/file") {
      const payload = JSON.parse(await readBody(req));
      const filePath = sourceFilePath(payload.lang, payload.file);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const formatted = formatJson(payload.content || "");
      fs.writeFileSync(filePath, formatted, "utf8");
      send(res, 200, { ok: true, path: path.relative(rootDir, filePath).replace(/\\/g, "/") });
      return;
    }

    if (req.method === "POST" && pathname === "/api/language") {
      const payload = JSON.parse(await readBody(req));
      const targetDir = languagePath(payload.lang);
      if (fs.existsSync(targetDir)) {
        send(res, 409, { error: "Language already exists." });
        return;
      }

      fs.mkdirSync(targetDir, { recursive: true });
      if (payload.copyFrom) {
        listJsonFiles(payload.copyFrom).forEach(file => {
          fs.copyFileSync(sourceFilePath(payload.copyFrom, file), sourceFilePath(payload.lang, file));
        });
      }

      send(res, 200, { ok: true, lang: payload.lang });
      return;
    }

    if (req.method === "POST" && pathname === "/api/file/create") {
      const payload = JSON.parse(await readBody(req));
      const filePath = sourceFilePath(payload.lang, payload.file);
      if (fs.existsSync(filePath)) {
        send(res, 409, { error: "File already exists." });
        return;
      }

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, "{\n}\n", "utf8");
      send(res, 200, { ok: true, file: payload.file });
      return;
    }

    if (req.method === "POST" && pathname === "/api/minify") {
      const payload = JSON.parse(await readBody(req));
      const files = payload.all ? minifyAll() : payload.file ? [minifyFile(payload.lang, payload.file)] : minifyLanguage(payload.lang);
      send(res, 200, { ok: true, files });
      return;
    }

    send(res, 404, { error: "Unknown API route." });
  } catch (error) {
    send(res, 400, { error: error.message });
  }
}

function serveStatic(req, res, pathname) {
  const fileName = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(publicDir, fileName);

  if (!filePath.startsWith(publicDir + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  send(res, 200, fs.readFileSync(filePath), mimeTypes[path.extname(filePath)] || "application/octet-stream");
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url || "/", `http://${req.headers.host || `localhost:${port}`}`);
  const query = Object.fromEntries(parsed.searchParams.entries());

  if (parsed.pathname.startsWith("/api/")) {
    handleApi(req, res, parsed.pathname, query);
    return;
  }

  serveStatic(req, res, parsed.pathname);
});

server.listen(port, () => {
  console.log(`i18n Manager running at http://localhost:${port}`);
});
