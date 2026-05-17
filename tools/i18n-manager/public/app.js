const state = {
  overview: { languages: [], files: [] },
  lang: "",
  file: "",
  parsed: null,
  raw: "",
  rawMode: false,
  dirty: false,
  viewPath: null
};

const els = {
  languages: document.querySelector("#languages"),
  files: document.querySelector("#files"),
  fileCount: document.querySelector("#fileCount"),
  languageForm: document.querySelector("#languageForm"),
  languageInput: document.querySelector("#languageInput"),
  fileForm: document.querySelector("#fileForm"),
  fileInput: document.querySelector("#fileInput"),
  refreshButton: document.querySelector("#refreshButton"),
  fileTitle: document.querySelector("#fileTitle"),
  filePath: document.querySelector("#filePath"),
  rawButton: document.querySelector("#rawButton"),
  validateButton: document.querySelector("#validateButton"),
  minifyLanguageButton: document.querySelector("#minifyLanguageButton"),
  minifyAllButton: document.querySelector("#minifyAllButton"),
  saveButton: document.querySelector("#saveButton"),
  addFieldButton: document.querySelector("#addFieldButton"),
  rootMeta: document.querySelector("#rootMeta"),
  navigator: document.querySelector("#navigator"),
  fields: document.querySelector("#fields"),
  rawView: document.querySelector("#rawView"),
  treeView: document.querySelector("#treeView"),
  rawEditor: document.querySelector("#rawEditor"),
  status: document.querySelector("#status")
};

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("error", isError);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function markDirty() {
  state.dirty = true;
  els.saveButton.disabled = !state.file;
}

function renderLists() {
  els.languages.innerHTML = "";
  state.overview.languages.forEach(language => {
    const button = document.createElement("button");
    button.className = `list-button${language.name === state.lang ? " active" : ""}`;
    button.innerHTML = `<span>${language.name}</span><span class="count">${language.fileCount}</span>`;
    button.addEventListener("click", () => selectLanguage(language.name));
    els.languages.append(button);
  });

  els.files.innerHTML = "";
  els.fileCount.textContent = `${state.overview.files.length} JSON`;
  state.overview.files.forEach(file => {
    const button = document.createElement("button");
    button.className = `list-button${file === state.file ? " active" : ""}`;
    button.innerHTML = `<span>${file}</span>`;
    button.addEventListener("click", () => loadFile(state.lang, file));
    els.files.append(button);
  });
}

function selectLanguage(lang) {
  state.lang = lang;
  renderLists();
  if (state.file) {
    loadFile(lang, state.file);
    return;
  }

  const firstFile = state.overview.files[0];
  if (firstFile) {
    loadFile(lang, firstFile);
  }
}

function getAtPath(root, path) {
  return path.reduce((value, segment) => value[segment], root);
}

function setAtPath(root, path, nextValue) {
  const parent = getAtPath(root, path.slice(0, -1));
  parent[path[path.length - 1]] = nextValue;
}

function formatPath(path) {
  return path.reduce((result, segment) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }
    return result ? `${result}.${segment}` : segment;
  }, "");
}

function collectEditableLeaves(value, path = [], rows = []) {
  if (value === null || typeof value !== "object") {
    rows.push({ path, value });
    return rows;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectEditableLeaves(item, [...path, index], rows));
    return rows;
  }

  Object.keys(value).forEach(key => collectEditableLeaves(value[key], [...path, key], rows));
  return rows;
}

function rootMeta(value) {
  if (Array.isArray(value)) {
    return `Array - ${value.length} items`;
  }
  if (value && typeof value === "object") {
    return `Object - ${Object.keys(value).length} items`;
  }
  return typeof value;
}

function topLevelArrays() {
  if (!state.parsed || Array.isArray(state.parsed) || typeof state.parsed !== "object") {
    return [];
  }

  return Object.keys(state.parsed).filter(key => Array.isArray(state.parsed[key]));
}

function itemLabel(item, index) {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const label = item.app || item.name || item.title || item.id || item.mainTitle || item.subTitle;
    if (label) {
      return `${index + 1}. ${String(label).replace(/<[^>]*>/g, "").trim() || "(blank)"}`;
    }
  }

  if (item === null) {
    return `${index + 1}. null`;
  }

  return `${index + 1}. ${Array.isArray(item) ? "Array" : typeof item}`;
}

function normalizeViewPath() {
  if (!state.parsed) {
    state.viewPath = null;
    return;
  }

  if (state.viewPath === null) {
    const arrays = topLevelArrays();
    state.viewPath = arrays.length ? [arrays[0], 0] : [];
    return;
  }

  const [collection, index] = state.viewPath;
  if (!collection || !Array.isArray(state.parsed[collection])) {
    state.viewPath = [];
    return;
  }

  const collectionItems = state.parsed[collection];
  const nextIndex = Math.max(0, Math.min(Number(index) || 0, collectionItems.length - 1));
  state.viewPath = collectionItems.length ? [collection, nextIndex] : [collection];
}

function currentView() {
  normalizeViewPath();
  const value = state.viewPath.length ? getAtPath(state.parsed, state.viewPath) : state.parsed;
  return { path: state.viewPath, value };
}

function selectView(path) {
  state.viewPath = path;
  renderTree();
}

function renderNavigator(view) {
  els.navigator.innerHTML = "";

  if (!state.parsed) {
    return;
  }

  const arrays = topLevelArrays();
  if (!arrays.length) {
    return;
  }

  const collectionTabs = document.createElement("div");
  collectionTabs.className = "collection-tabs";

  const rootButton = document.createElement("button");
  rootButton.textContent = "Root";
  rootButton.className = view.path.length ? "" : "active";
  rootButton.addEventListener("click", () => selectView([]));
  collectionTabs.append(rootButton);

  arrays.forEach(collection => {
    const button = document.createElement("button");
    const items = state.parsed[collection];
    button.textContent = `${collection} (${items.length})`;
    button.className = view.path[0] === collection ? "active" : "";
    button.addEventListener("click", () => selectView(items.length ? [collection, 0] : [collection]));
    collectionTabs.append(button);
  });

  els.navigator.append(collectionTabs);

  const [collection, index] = view.path;
  const items = state.parsed[collection];
  if (!Array.isArray(items) || !items.length) {
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "item-toolbar";

  const previous = document.createElement("button");
  previous.textContent = "Previous";
  previous.disabled = index <= 0;
  previous.addEventListener("click", () => selectView([collection, index - 1]));

  const select = document.createElement("select");
  items.forEach((item, itemIndex) => {
    const option = document.createElement("option");
    option.value = String(itemIndex);
    option.textContent = itemLabel(item, itemIndex);
    select.append(option);
  });
  select.value = String(index);
  select.addEventListener("change", () => selectView([collection, Number(select.value)]));

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = index >= items.length - 1;
  next.addEventListener("click", () => selectView([collection, index + 1]));

  const position = document.createElement("span");
  position.className = "item-position";
  position.textContent = `${index + 1} / ${items.length}`;

  toolbar.append(previous, select, next, position);
  els.navigator.append(toolbar);
}

function updateRawFromParsed() {
  state.raw = `${JSON.stringify(state.parsed, null, 2)}\n`;
  els.rawEditor.value = state.raw;
}

function coerceValue(raw, original) {
  if (typeof original === "number") {
    const number = Number(raw);
    if (Number.isNaN(number)) {
      throw new Error("Expected a number.");
    }
    return number;
  }
  if (typeof original === "boolean") {
    return raw === "true";
  }
  if (original === null) {
    return raw === "" ? null : JSON.parse(raw);
  }
  return raw;
}

function renderTree() {
  const view = currentView();
  const viewLabel = view.path.length ? formatPath(view.path) : "Root";

  document.querySelector("#rootLabel").textContent = viewLabel;
  els.rootMeta.textContent = state.parsed === null ? "" : rootMeta(view.value);
  renderNavigator(view);
  els.fields.innerHTML = "";

  if (state.parsed === null) {
    els.fields.innerHTML = "<div class=\"empty\">Select a JSON file to begin.</div>";
    return;
  }

  const rows = collectEditableLeaves(view.value, view.path).slice(0, 500);
  if (!rows.length) {
    els.fields.innerHTML = "<div class=\"empty\">This file has no primitive fields yet.</div>";
    return;
  }

  rows.forEach(row => {
    const wrapper = document.createElement("div");
    wrapper.className = "field-row";

    const key = document.createElement("div");
    key.className = "field-key";
    const label = row.path[row.path.length - 1] ?? "value";
    key.innerHTML = `<strong>${label}</strong><code>${formatPath(row.path)}</code>`;

    const value = document.createElement("div");
    let input;
    if (typeof row.value === "boolean") {
      input = document.createElement("select");
      input.innerHTML = "<option value=\"true\">true</option><option value=\"false\">false</option>";
      input.value = String(row.value);
    } else if (typeof row.value === "number") {
      input = document.createElement("input");
      input.type = "number";
      input.value = row.value;
    } else {
      input = document.createElement("textarea");
      input.value = row.value === null ? "null" : row.value;
    }

    input.addEventListener("input", () => {
      try {
        setAtPath(state.parsed, row.path, coerceValue(input.value, row.value));
        updateRawFromParsed();
        markDirty();
        setStatus("Edited. Save when you are ready.");
      } catch (error) {
        setStatus(error.message, true);
      }
    });

    value.append(input);
    wrapper.append(key, value);
    els.fields.append(wrapper);
  });

  if (collectEditableLeaves(view.value, view.path).length > rows.length) {
    const note = document.createElement("div");
    note.className = "empty";
    note.textContent = "Showing the first 500 editable values in this item. Use Raw JSON for the full file.";
    els.fields.append(note);
  }
}

function setRawMode(enabled) {
  state.rawMode = enabled;
  els.rawView.classList.toggle("hidden", !enabled);
  els.treeView.classList.toggle("hidden", enabled);
  els.rawButton.textContent = enabled ? "Tree view" : "Raw JSON";
}

async function refresh(keepSelection = true) {
  state.overview = await api("/api/i18n");
  if (!keepSelection || !state.overview.languages.some(language => language.name === state.lang)) {
    state.lang = state.overview.languages[0]?.name || "";
  }
  if (!keepSelection || !state.overview.files.includes(state.file)) {
    state.file = state.overview.files[0] || "";
  }
  renderLists();
  if (state.lang && state.file) {
    await loadFile(state.lang, state.file);
  } else {
    renderTree();
  }
}

async function loadFile(lang, file) {
  try {
    const data = await api(`/api/file?lang=${encodeURIComponent(lang)}&file=${encodeURIComponent(file)}`);
    state.lang = lang;
    state.file = file;
    state.parsed = data.parsed;
    state.raw = data.raw;
    state.dirty = false;
    state.viewPath = null;
    els.fileTitle.textContent = file;
    els.filePath.textContent = data.path;
    els.rawEditor.value = data.raw;
    els.saveButton.disabled = false;
    renderLists();
    renderTree();
    setStatus(`Loaded ${data.path}.`);
  } catch (error) {
    state.file = file;
    state.parsed = {};
    state.viewPath = null;
    updateRawFromParsed();
    renderTree();
    markDirty();
    setStatus(`${file} does not exist for ${lang}; saving will create it.`, true);
  }
}

function validateRaw() {
  const raw = state.rawMode ? els.rawEditor.value : JSON.stringify(state.parsed);
  const parsed = JSON.parse(raw);
  state.parsed = parsed;
  updateRawFromParsed();
  renderTree();
  return parsed;
}

els.rawEditor.addEventListener("input", () => {
  state.raw = els.rawEditor.value;
  markDirty();
});

els.rawButton.addEventListener("click", () => {
  if (state.rawMode) {
    try {
      validateRaw();
      setRawMode(false);
      setStatus("Raw JSON is valid.");
    } catch (error) {
      setStatus(error.message, true);
    }
  } else {
    updateRawFromParsed();
    setRawMode(true);
  }
});

els.validateButton.addEventListener("click", () => {
  try {
    validateRaw();
    setStatus("JSON is valid.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

els.saveButton.addEventListener("click", async () => {
  try {
    const parsed = validateRaw();
    const content = JSON.stringify(parsed, null, 2);
    const savedViewPath = Array.isArray(state.viewPath) ? [...state.viewPath] : state.viewPath;
    const result = await api("/api/file", {
      method: "POST",
      body: JSON.stringify({ lang: state.lang, file: state.file, content })
    });
    state.dirty = false;
    await refresh(true);
    state.viewPath = savedViewPath;
    renderTree();
    setStatus(`Saved ${result.path}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

els.minifyLanguageButton.addEventListener("click", async () => {
  try {
    const result = await api("/api/minify", {
      method: "POST",
      body: JSON.stringify({ lang: state.lang })
    });
    setStatus(`Generated ${result.files.length} minified file(s) for ${state.lang}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

els.minifyAllButton.addEventListener("click", async () => {
  try {
    const result = await api("/api/minify", {
      method: "POST",
      body: JSON.stringify({ all: true })
    });
    setStatus(`Generated ${result.files.length} minified file(s).`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

els.addFieldButton.addEventListener("click", () => {
  const view = currentView();
  if (!view.value || Array.isArray(view.value) || typeof view.value !== "object") {
    setStatus("Add field is available for objects.", true);
    return;
  }

  const key = prompt("Field name");
  if (!key) {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(view.value, key)) {
    setStatus("That field already exists.", true);
    return;
  }

  view.value[key] = "";
  updateRawFromParsed();
  renderTree();
  markDirty();
  setStatus(`Added ${key}.`);
});

els.languageForm.addEventListener("submit", async event => {
  event.preventDefault();
  const lang = els.languageInput.value.trim();
  if (!lang) {
    return;
  }

  try {
    await api("/api/language", {
      method: "POST",
      body: JSON.stringify({ lang, copyFrom: state.lang || undefined })
    });
    els.languageInput.value = "";
    state.lang = lang;
    await refresh(true);
    setStatus(`Created ${lang}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

els.fileForm.addEventListener("submit", async event => {
  event.preventDefault();
  const file = els.fileInput.value.trim();
  if (!file) {
    return;
  }

  try {
    await api("/api/file/create", {
      method: "POST",
      body: JSON.stringify({ lang: state.lang, file })
    });
    els.fileInput.value = "";
    state.file = file;
    await refresh(true);
    setStatus(`Created ${file}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

els.refreshButton.addEventListener("click", () => refresh(true).catch(error => setStatus(error.message, true)));

refresh(false).catch(error => setStatus(error.message, true));
