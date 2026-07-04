const state = {
  overview: { languages: [], files: [] },
  lang: "",
  file: "",
  parsed: null,
  raw: "",
  rawMode: false,
  dirty: false,
  viewPath: null,
  nestedArrayKey: null,
  nestedArrayIndex: 0,
  childArrayKey: null,
  childArrayIndex: 0,
  techCatalog: []
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
  refreshTechsButton: document.querySelector("#refreshTechsButton"),
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

function collectEditableLeavesSkippingArrays(value, path = [], rows = []) {
  if (value === null || typeof value !== "object") {
    rows.push({ path, value });
    return rows;
  }

  if (Array.isArray(value)) {
    return rows;
  }

  Object.keys(value).forEach(key => collectEditableLeavesSkippingArrays(value[key], [...path, key], rows));
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

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function itemLabel(item, index) {
  if (typeof item === "string") {
    return `${index + 1}. ${item}`;
  }

  if (Array.isArray(item)) {
    const first = item[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      const type = first.type || "object";
      const label = first.tooltip || first.text || first.icon || first.id || type;
      return `${index + 1}. ${type}: ${String(label).replace(/<[^>]*>/g, "").trim()}`;
    }
    return `${index + 1}. Array (${item.length})`;
  }

  if (item && typeof item === "object" && !Array.isArray(item)) {
    const label = item.app || item.name || item.title || item.id || item.mainTitle || item.subTitle;
    if (label) {
      return `${index + 1}. ${String(label).replace(/<[^>]*>/g, "").trim() || "(blank)"}`;
    }
    if ("yearStart" in item || "mainTech" in item) {
      const years = `${item.yearStart ?? "?"}-${item.yearEnd ?? "now"}`;
      const tech = item.mainTech ? ` ${item.mainTech}` : "";
      return `${index + 1}. ${years}${tech}`;
    }
  }

  if (item === null) {
    return `${index + 1}. null`;
  }

  return `${index + 1}. ${Array.isArray(item) ? "Array" : typeof item}`;
}

function makeTopLevelItemTemplate(collection) {
  if (collection === "apps") {
    return {
      app: "New app",
      link: "",
      description: "",
      logo: "",
      edition: [
        {
          yearStart: new Date().getFullYear(),
          yearEnd: null,
          mainTech: "web",
          isSupported: true,
          storeLink: "",
          preview: "",
          technologies: [],
          order: 1
        }
      ]
    };
  }

  if (collection === "tabsOptions") {
    return {
      id: "new-tab",
      name: "New tab",
      isVisible: true,
      isActive: false,
      order: 999
    };
  }

  if (collection === "panesOptions") {
    return {
      id: "new-pane",
      mainTitle: "",
      divs: [],
      techsInvolvedId: "",
      isActive: false,
      order: 999
    };
  }

  return {};
}

function topLevelItemName(collection) {
  if (collection === "apps") {
    return "app";
  }
  if (collection === "tabsOptions") {
    return "tab";
  }
  if (collection === "panesOptions") {
    return "pane";
  }
  return "item";
}

function appendTopLevelItem(collection) {
  const items = state.parsed?.[collection];
  if (!Array.isArray(items)) {
    setStatus(`${collection} is not an array.`, true);
    return;
  }

  items.push(makeTopLevelItemTemplate(collection));
  state.viewPath = [collection, items.length - 1];
  state.nestedArrayKey = null;
  state.nestedArrayIndex = 0;
  state.childArrayKey = null;
  state.childArrayIndex = 0;
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus(`Added ${topLevelItemName(collection)}. Save when you are ready.`);
}

function removeTopLevelItem(collection, index) {
  const items = state.parsed?.[collection];
  if (!Array.isArray(items) || !items.length) {
    return;
  }

  const label = itemLabel(items[index], index);
  if (!confirm(`Remove ${label}?`)) {
    return;
  }

  items.splice(index, 1);
  state.viewPath = items.length ? [collection, Math.max(0, Math.min(index, items.length - 1))] : [collection];
  state.nestedArrayKey = null;
  state.nestedArrayIndex = 0;
  state.childArrayKey = null;
  state.childArrayIndex = 0;
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus("Removed item. Save when you are ready.");
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
  state.nestedArrayKey = null;
  state.nestedArrayIndex = 0;
  state.childArrayKey = null;
  state.childArrayIndex = 0;
  renderTree();
}

function directArrays(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return [];
  }

  return Object.keys(value).filter(key => Array.isArray(value[key]));
}

function normalizeNestedArray(viewValue) {
  const arrays = directArrays(viewValue);
  if (!arrays.length) {
    state.nestedArrayKey = null;
    state.nestedArrayIndex = 0;
    return null;
  }

  if (!state.nestedArrayKey || !arrays.includes(state.nestedArrayKey)) {
    state.nestedArrayKey = arrays[0];
    state.nestedArrayIndex = 0;
  }

  const items = viewValue[state.nestedArrayKey];
  state.nestedArrayIndex = Math.max(0, Math.min(state.nestedArrayIndex, items.length - 1));
  return {
    arrays,
    key: state.nestedArrayKey,
    index: state.nestedArrayIndex,
    items
  };
}

function normalizeChildArray(value) {
  const arrays = directArrays(value);
  if (!arrays.length) {
    state.childArrayKey = null;
    state.childArrayIndex = 0;
    return null;
  }

  if (!state.childArrayKey || !arrays.includes(state.childArrayKey)) {
    state.childArrayKey = arrays[0];
    state.childArrayIndex = 0;
  }

  const items = value[state.childArrayKey];
  state.childArrayIndex = Math.max(0, Math.min(state.childArrayIndex, items.length - 1));
  return {
    arrays,
    key: state.childArrayKey,
    index: state.childArrayIndex,
    items
  };
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
  if (!Array.isArray(items)) {
    return;
  }
  const selectedIndex = Number.isInteger(index) ? index : 0;

  const toolbar = document.createElement("div");
  toolbar.className = "item-toolbar";

  const previous = document.createElement("button");
  previous.textContent = "Previous";
  previous.disabled = !items.length || selectedIndex <= 0;
  previous.addEventListener("click", () => selectView([collection, selectedIndex - 1]));

  const select = document.createElement("select");
  items.forEach((item, itemIndex) => {
    const option = document.createElement("option");
    option.value = String(itemIndex);
    option.textContent = itemLabel(item, itemIndex);
    select.append(option);
  });
  select.disabled = !items.length;
  select.value = String(selectedIndex);
  select.addEventListener("change", () => selectView([collection, Number(select.value)]));

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = !items.length || selectedIndex >= items.length - 1;
  next.addEventListener("click", () => selectView([collection, selectedIndex + 1]));

  const position = document.createElement("span");
  position.className = "item-position";
  position.textContent = items.length ? `${selectedIndex + 1} / ${items.length}` : "0 / 0";

  const addButton = document.createElement("button");
  addButton.textContent = `Add ${topLevelItemName(collection)}`;
  addButton.addEventListener("click", () => appendTopLevelItem(collection));

  const removeButton = document.createElement("button");
  removeButton.textContent = "Remove selected";
  removeButton.className = "danger-button";
  removeButton.disabled = !items.length;
  removeButton.addEventListener("click", () => removeTopLevelItem(collection, selectedIndex));

  toolbar.append(previous, select, next, position, addButton, removeButton);
  els.navigator.append(toolbar);
}

function createFieldRow(row) {
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
  return wrapper;
}

function appendRows(container, rows, emptyMessage) {
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty compact";
    empty.textContent = emptyMessage;
    container.append(empty);
    return;
  }

  rows.forEach(row => container.append(createFieldRow(row)));
}

function isPaneOptionsView(view) {
  return view.path[0] === "panesOptions" && view.value && typeof view.value === "object" && !Array.isArray(view.value);
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "").trim();
}

function slugifyId(value) {
  return stripHtml(value)
    .replace(/&amp;/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toLowerCase()) || "store";
}

function collectPaneStoreIds(excludedPath = null) {
  const ids = new Set();
  const panes = state.parsed?.panesOptions;
  if (!Array.isArray(panes)) {
    return ids;
  }

  panes.forEach((pane, paneIndex) => {
    (pane.divs || []).forEach((section, sectionIndex) => {
      (section.stores || []).forEach((store, storeIndex) => {
        const path = ["panesOptions", paneIndex, "divs", sectionIndex, "stores", storeIndex, "id"];
        if (excludedPath && formatPath(path) === formatPath(excludedPath)) {
          return;
        }
        if (store.id) {
          ids.add(store.id);
        }
      });
    });
  });

  return ids;
}

function uniquePaneStoreId(base, excludedPath = null) {
  const ids = collectPaneStoreIds(excludedPath);
  const cleanBase = slugifyId(base);
  let candidate = cleanBase;
  let suffix = 2;
  while (ids.has(candidate)) {
    candidate = `${cleanBase}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function updatePaneValue(path, value) {
  setAtPath(state.parsed, path, value);
  updateRawFromParsed();
  markDirty();
}

function appendPaneSection(panePath) {
  const pane = getAtPath(state.parsed, panePath);
  if (!Array.isArray(pane.divs)) {
    pane.divs = [];
  }

  pane.divs.push({ divsTitle: "New section", stores: [] });
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus("Added section. Save when you are ready.");
}

function removePaneSection(panePath, sectionIndex) {
  const pane = getAtPath(state.parsed, panePath);
  if (!Array.isArray(pane.divs) || !pane.divs.length) {
    return;
  }

  const section = pane.divs[sectionIndex];
  const label = stripHtml(section.divsTitle) || `section ${sectionIndex + 1}`;
  if (!confirm(`Remove ${label} and its stores?`)) {
    return;
  }

  pane.divs.splice(sectionIndex, 1);
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus("Removed section. Save when you are ready.");
}

function appendPaneStore(panePath, sectionIndex) {
  const pane = getAtPath(state.parsed, panePath);
  const section = pane.divs?.[sectionIndex];
  if (!section) {
    setStatus("Select a section before adding a store.", true);
    return;
  }

  if (!Array.isArray(section.stores)) {
    section.stores = [];
  }

  const sectionLabel = stripHtml(section.divsTitle) || pane.id || "store";
  section.stores.push({
    id: uniquePaneStoreId(`${pane.id || sectionLabel}${sectionLabel}Store`),
    subTitle: "New store"
  });
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus("Added store. Save when you are ready.");
}

function removePaneStore(panePath, sectionIndex, storeIndex) {
  const pane = getAtPath(state.parsed, panePath);
  const stores = pane.divs?.[sectionIndex]?.stores;
  if (!Array.isArray(stores) || !stores.length) {
    return;
  }

  const label = stripHtml(stores[storeIndex].subTitle) || stores[storeIndex].id || `store ${storeIndex + 1}`;
  if (!confirm(`Remove ${label}?`)) {
    return;
  }

  stores.splice(storeIndex, 1);
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus("Removed store. Save when you are ready.");
}

function renderPaneStructureEditor(parent, view) {
  const pane = view.value;
  if (!Array.isArray(pane.divs)) {
    pane.divs = [];
  }

  const shell = document.createElement("section");
  shell.className = "pane-structure-editor";

  const header = document.createElement("div");
  header.className = "pane-structure-header";
  const title = document.createElement("h3");
  title.textContent = "Pane sections";
  const addSection = document.createElement("button");
  addSection.textContent = "Add section";
  addSection.addEventListener("click", () => appendPaneSection(view.path));
  header.append(title, addSection);
  shell.append(header);

  if (!pane.divs.length) {
    const empty = document.createElement("div");
    empty.className = "empty compact";
    empty.textContent = "This pane has no sections yet.";
    shell.append(empty);
    parent.append(shell);
    return;
  }

  pane.divs.forEach((section, sectionIndex) => {
    if (!Array.isArray(section.stores)) {
      section.stores = [];
    }

    const sectionCard = document.createElement("div");
    sectionCard.className = "pane-section-card";

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "pane-section-header";

    const sectionTitle = document.createElement("label");
    sectionTitle.innerHTML = `<span>Section title</span>`;
    const sectionInput = document.createElement("input");
    sectionInput.value = section.divsTitle || "";
    sectionInput.placeholder = "Leave blank when the store title is enough";
    sectionInput.addEventListener("input", () => {
      updatePaneValue([...view.path, "divs", sectionIndex, "divsTitle"], sectionInput.value);
      setStatus("Edited section. Save when you are ready.");
    });
    sectionTitle.append(sectionInput);

    const sectionActions = document.createElement("div");
    sectionActions.className = "pane-section-actions";
    const addStore = document.createElement("button");
    addStore.textContent = "Add store";
    addStore.addEventListener("click", () => appendPaneStore(view.path, sectionIndex));
    const removeSection = document.createElement("button");
    removeSection.textContent = "Remove section";
    removeSection.className = "danger-button";
    removeSection.addEventListener("click", () => removePaneSection(view.path, sectionIndex));
    sectionActions.append(addStore, removeSection);

    sectionHeader.append(sectionTitle, sectionActions);
    sectionCard.append(sectionHeader);

    const stores = document.createElement("div");
    stores.className = "pane-store-list";
    if (!section.stores.length) {
      const empty = document.createElement("div");
      empty.className = "empty compact";
      empty.textContent = "This section has no stores yet.";
      stores.append(empty);
    }

    section.stores.forEach((store, storeIndex) => {
      const storePath = [...view.path, "divs", sectionIndex, "stores", storeIndex];
      const row = document.createElement("div");
      row.className = "pane-store-row";

      const idLabel = document.createElement("label");
      idLabel.innerHTML = "<span>Store ID</span>";
      const idInput = document.createElement("input");
      idInput.value = store.id || "";
      idInput.addEventListener("input", () => {
        const nextId = idInput.value.trim();
        const idPath = [...storePath, "id"];
        if (!nextId) {
          idInput.classList.add("invalid");
          setStatus("Store ID cannot be empty.", true);
          return;
        }
        if (collectPaneStoreIds(idPath).has(nextId)) {
          idInput.classList.add("invalid");
          setStatus(`Store ID "${nextId}" is already used.`, true);
          return;
        }
        idInput.classList.remove("invalid");
        updatePaneValue(idPath, nextId);
        setStatus("Edited store ID. Save when you are ready.");
      });
      idLabel.append(idInput);

      const titleLabel = document.createElement("label");
      titleLabel.innerHTML = "<span>Store title</span>";
      const titleInput = document.createElement("input");
      titleInput.value = store.subTitle || "";
      titleInput.addEventListener("input", () => {
        updatePaneValue([...storePath, "subTitle"], titleInput.value);
        setStatus("Edited store title. Save when you are ready.");
      });
      titleLabel.append(titleInput);

      const actions = document.createElement("div");
      actions.className = "pane-store-actions";
      const regenerate = document.createElement("button");
      regenerate.textContent = "Unique ID";
      regenerate.addEventListener("click", () => {
        const idPath = [...storePath, "id"];
        const nextId = uniquePaneStoreId(store.subTitle || store.id || pane.id, idPath);
        updatePaneValue(idPath, nextId);
        renderTree();
        setStatus("Generated a unique store ID. Save when you are ready.");
      });
      const removeStore = document.createElement("button");
      removeStore.textContent = "Remove";
      removeStore.className = "danger-button";
      removeStore.addEventListener("click", () => removePaneStore(view.path, sectionIndex, storeIndex));
      actions.append(regenerate, removeStore);

      row.append(idLabel, titleLabel, actions);
      stores.append(row);
    });

    sectionCard.append(stores);
    shell.append(sectionCard);
  });

  parent.append(shell);
}

function nestedItemName(key) {
  if (key === "edition") {
    return "edition";
  }
  return "item";
}

function makeNestedItemTemplate(key, items) {
  if (key === "edition") {
    const first = items[0] || {};
    return {
      yearStart: new Date().getFullYear(),
      yearEnd: null,
      mainTech: first.mainTech || "web",
      isSupported: true,
      storeLink: "",
      link: "",
      preview: "",
      technologies: [],
      order: items.length + 1
    };
  }

  return {};
}

function appendNestedArrayItem(arrayPath, key) {
  const array = getAtPath(state.parsed, arrayPath);
  array.push(makeNestedItemTemplate(key, array));
  state.nestedArrayIndex = array.length - 1;
  state.childArrayKey = null;
  state.childArrayIndex = 0;
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus(`Added ${nestedItemName(key)}. Save when you are ready.`);
}

function duplicateNestedArrayItem(arrayPath, key, index) {
  const array = getAtPath(state.parsed, arrayPath);
  if (!array.length) {
    return;
  }

  const copy = cloneValue(array[index]);
  if (key === "edition") {
    copy.order = array.length + 1;
  }
  array.splice(index + 1, 0, copy);
  state.nestedArrayIndex = index + 1;
  state.childArrayKey = null;
  state.childArrayIndex = 0;
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus(`Duplicated ${nestedItemName(key)}. Save when you are ready.`);
}

function removeNestedArrayItem(arrayPath, key, index) {
  const array = getAtPath(state.parsed, arrayPath);
  if (!array.length) {
    return;
  }

  if (!confirm(`Remove ${nestedItemName(key)} ${index + 1}?`)) {
    return;
  }

  array.splice(index, 1);
  state.nestedArrayIndex = Math.max(0, Math.min(index, array.length - 1));
  state.childArrayKey = null;
  state.childArrayIndex = 0;
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus(`Removed ${nestedItemName(key)}. Save when you are ready.`);
}

function copyTechnologiesFromFirstEdition(arrayPath, index) {
  const editions = getAtPath(state.parsed, arrayPath);
  if (!editions.length || index === 0) {
    return;
  }

  const source = editions[0]?.technologies;
  if (!Array.isArray(source)) {
    setStatus("The first edition does not have technologies to copy.", true);
    return;
  }

  editions[index].technologies = cloneValue(source);
  state.childArrayKey = "technologies";
  state.childArrayIndex = 0;
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus("Copied technologies from the first edition. Save when you are ready.");
}

function renderNestedArrays(view) {
  const nested = normalizeNestedArray(view.value);
  if (!nested) {
    return;
  }

  const shell = document.createElement("section");
  shell.className = "nested-editor";

  const tabs = document.createElement("div");
  tabs.className = "nested-tabs";
  nested.arrays.forEach(key => {
    const button = document.createElement("button");
    button.textContent = `${key} (${view.value[key].length})`;
    button.className = key === nested.key ? "active" : "";
    button.addEventListener("click", () => {
      state.nestedArrayKey = key;
      state.nestedArrayIndex = 0;
      renderTree();
    });
    tabs.append(button);
  });

  const toolbar = document.createElement("div");
  toolbar.className = "item-toolbar nested-toolbar";

  const previous = document.createElement("button");
  previous.textContent = "Previous";
  previous.disabled = nested.index <= 0;
  previous.addEventListener("click", () => {
    state.nestedArrayIndex -= 1;
    renderTree();
  });

  const select = document.createElement("select");
  nested.items.forEach((item, itemIndex) => {
    const option = document.createElement("option");
    option.value = String(itemIndex);
    option.textContent = itemLabel(item, itemIndex);
    select.append(option);
  });
  select.value = String(nested.index);
  select.addEventListener("change", () => {
    state.nestedArrayIndex = Number(select.value);
    renderTree();
  });

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = nested.index >= nested.items.length - 1;
  next.addEventListener("click", () => {
    state.nestedArrayIndex += 1;
    renderTree();
  });

  const position = document.createElement("span");
  position.className = "item-position";
  position.textContent = nested.items.length ? `${nested.index + 1} / ${nested.items.length}` : "0 / 0";

  const arrayPath = [...view.path, nested.key];
  const actionBar = document.createElement("div");
  actionBar.className = "add-bar nested-action-bar";

  const addButton = document.createElement("button");
  addButton.textContent = `Add ${nestedItemName(nested.key)}`;
  addButton.addEventListener("click", () => appendNestedArrayItem(arrayPath, nested.key));
  actionBar.append(addButton);

  const duplicateButton = document.createElement("button");
  duplicateButton.textContent = `Duplicate ${nestedItemName(nested.key)}`;
  duplicateButton.disabled = !nested.items.length;
  duplicateButton.addEventListener("click", () => duplicateNestedArrayItem(arrayPath, nested.key, nested.index));
  actionBar.append(duplicateButton);

  if (nested.key === "edition") {
    const copyTechsButton = document.createElement("button");
    copyTechsButton.textContent = "Copy techs from first";
    copyTechsButton.disabled = nested.index === 0 || nested.items.length < 2;
    copyTechsButton.addEventListener("click", () => copyTechnologiesFromFirstEdition(arrayPath, nested.index));
    actionBar.append(copyTechsButton);
  }

  const removeButton = document.createElement("button");
  removeButton.textContent = "Remove selected";
  removeButton.className = "danger-button";
  removeButton.disabled = !nested.items.length;
  removeButton.addEventListener("click", () => removeNestedArrayItem(arrayPath, nested.key, nested.index));
  actionBar.append(removeButton);

  const title = document.createElement("h3");
  title.textContent = `${nested.key}[${nested.index}]`;

  const rows = nested.items.length
    ? collectEditableLeavesSkippingArrays(nested.items[nested.index], [...view.path, nested.key, nested.index]).slice(0, 500)
    : [];

  toolbar.append(previous, select, next, position);
  shell.append(tabs, toolbar, actionBar, title);
  appendRows(shell, rows, "This nested item has no editable fields yet.");
  if (nested.items.length) {
    renderChildArrays(shell, nested.items[nested.index], [...view.path, nested.key, nested.index]);
  }
  els.fields.append(shell);
}

function makeTechnologyTemplate(kind) {
  if (kind === "class") {
    return "";
  }
  if (kind === "img") {
    return [{ type: "img", id: "", icon: "", tooltip: "" }];
  }
  if (kind === "text") {
    return [{ type: "text", id: "", text: "", tooltip: "" }];
  }
  return [{ type: "icon", id: "", icon: "", tooltip: "" }];
}

async function loadTechnologyCatalog() {
  const catalog = await api("/api/technologies");
  state.techCatalog = Array.isArray(catalog.technologies) ? catalog.technologies : [];
  return catalog;
}

function appendTechnologyOption(arrayPath, option) {
  appendTechnologyItem(arrayPath, cloneValue(option.value));
}

function technologyKey(item) {
  return JSON.stringify(item);
}

function hasTechnology(arrayPath, item) {
  const array = getAtPath(state.parsed, arrayPath);
  const nextKey = technologyKey(item);
  return array.some(existing => technologyKey(existing) === nextKey);
}

function appendTechnologyItem(arrayPath, item) {
  if (hasTechnology(arrayPath, item)) {
    setStatus("That technology is already in this edition.", true);
    return;
  }

  appendArrayItem(arrayPath, item);
}

function renderTechnologyPicker(arrayPath) {
  const wrapper = document.createElement("div");
  wrapper.className = "tech-picker";

  const header = document.createElement("div");
  header.className = "tech-picker-header";

  const title = document.createElement("strong");
  title.textContent = `Available technologies (${state.techCatalog.length})`;

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Filter technologies";
  search.autocomplete = "off";

  const chips = document.createElement("div");
  chips.className = "tech-chip-list";

  function renderChips() {
    const query = search.value.trim().toLowerCase();
    const matches = state.techCatalog
      .filter(option => {
        const haystack = `${option.label} ${option.kind} ${JSON.stringify(option.value)}`.toLowerCase();
        return !query || haystack.includes(query);
      })
      .slice(0, 80);

    chips.innerHTML = "";
    if (!matches.length) {
      const empty = document.createElement("span");
      empty.className = "tech-empty";
      empty.textContent = "No technologies found.";
      chips.append(empty);
      return;
    }

    matches.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tech-chip";
      button.disabled = hasTechnology(arrayPath, option.value);
      const label = document.createElement("span");
      label.textContent = option.label;
      const kind = document.createElement("small");
      kind.textContent = option.kind;
      button.append(label, kind);
      button.addEventListener("click", () => appendTechnologyOption(arrayPath, option));
      chips.append(button);
    });
  }

  search.addEventListener("input", renderChips);
  header.append(title, search);
  wrapper.append(header, chips);
  renderChips();
  return wrapper;
}

function appendArrayItem(arrayPath, item) {
  const array = getAtPath(state.parsed, arrayPath);
  array.push(item);
  state.childArrayIndex = array.length - 1;
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus("Added item. Save when you are ready.");
}

function removeArrayItem(arrayPath) {
  const array = getAtPath(state.parsed, arrayPath);
  if (!array.length) {
    return;
  }

  array.splice(state.childArrayIndex, 1);
  state.childArrayIndex = Math.max(0, Math.min(state.childArrayIndex, array.length - 1));
  updateRawFromParsed();
  markDirty();
  renderTree();
  setStatus("Removed item. Save when you are ready.");
}

function renderChildArrays(parent, value, basePath) {
  const child = normalizeChildArray(value);
  if (!child) {
    return;
  }

  const shell = document.createElement("section");
  shell.className = "child-array-editor";

  const tabs = document.createElement("div");
  tabs.className = "nested-tabs";
  child.arrays.forEach(key => {
    const button = document.createElement("button");
    button.textContent = `${key} (${value[key].length})`;
    button.className = key === child.key ? "active" : "";
    button.addEventListener("click", () => {
      state.childArrayKey = key;
      state.childArrayIndex = 0;
      renderTree();
    });
    tabs.append(button);
  });

  const toolbar = document.createElement("div");
  toolbar.className = "item-toolbar nested-toolbar";

  const previous = document.createElement("button");
  previous.textContent = "Previous";
  previous.disabled = child.index <= 0;
  previous.addEventListener("click", () => {
    state.childArrayIndex -= 1;
    renderTree();
  });

  const select = document.createElement("select");
  child.items.forEach((item, itemIndex) => {
    const option = document.createElement("option");
    option.value = String(itemIndex);
    option.textContent = itemLabel(item, itemIndex);
    select.append(option);
  });
  select.value = String(child.index);
  select.addEventListener("change", () => {
    state.childArrayIndex = Number(select.value);
    renderTree();
  });

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = child.index >= child.items.length - 1;
  next.addEventListener("click", () => {
    state.childArrayIndex += 1;
    renderTree();
  });

  const position = document.createElement("span");
  position.className = "item-position";
  position.textContent = child.items.length ? `${child.index + 1} / ${child.items.length}` : "0 / 0";

  toolbar.append(previous, select, next, position);

  const addBar = document.createElement("div");
  addBar.className = "add-bar";
  const arrayPath = [...basePath, child.key];
  let picker = null;
  if (child.key === "technologies") {
    [
      ["Class", "class"],
      ["Icon", "icon"],
      ["Image", "img"],
      ["Text", "text"]
    ].forEach(([label, kind]) => {
      const button = document.createElement("button");
      button.textContent = `Add ${label}`;
      button.addEventListener("click", () => appendTechnologyItem(arrayPath, makeTechnologyTemplate(kind)));
      addBar.append(button);
    });
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove selected";
    removeButton.className = "danger-button";
    removeButton.disabled = !child.items.length;
    removeButton.addEventListener("click", () => removeArrayItem(arrayPath));
    addBar.append(removeButton);
    picker = renderTechnologyPicker(arrayPath);
  } else {
    const button = document.createElement("button");
    button.textContent = "Add item";
    button.addEventListener("click", () => appendArrayItem(arrayPath, {}));
    addBar.append(button);
  }

  const title = document.createElement("h4");
  title.textContent = `${child.key}[${child.index}]`;

  const currentItem = child.items[child.index];
  const itemPath = [...arrayPath, child.index];
  let rows = [];
  if (Array.isArray(currentItem)) {
    rows = collectEditableLeaves(currentItem, itemPath).slice(0, 500);
  } else if (currentItem && typeof currentItem === "object") {
    rows = collectEditableLeavesSkippingArrays(currentItem, itemPath).slice(0, 500);
  } else {
    rows = [{ path: itemPath, value: currentItem }];
  }

  shell.append(tabs, toolbar, addBar);
  if (picker) {
    shell.append(picker);
  }
  shell.append(title);
  appendRows(shell, rows, "This item has no editable fields yet.");
  parent.append(shell);
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
  els.addFieldButton.textContent = "Add field";
  renderNavigator(view);
  els.fields.innerHTML = "";

  if (state.parsed === null) {
    els.fields.innerHTML = "<div class=\"empty\">Select a JSON file to begin.</div>";
    return;
  }

  const nested = directArrays(view.value);
  const rows = nested.length
    ? collectEditableLeavesSkippingArrays(view.value, view.path).slice(0, 500)
    : collectEditableLeaves(view.value, view.path).slice(0, 500);

  if (!rows.length) {
    els.fields.innerHTML = "<div class=\"empty\">This item has no direct primitive fields.</div>";
  } else {
    const section = document.createElement("section");
    section.className = "field-section";
    if (nested.length) {
      const title = document.createElement("h3");
      title.textContent = "Fields";
      section.append(title);
    }
    appendRows(section, rows, "This item has no direct primitive fields.");
    els.fields.append(section);
  }

  if (isPaneOptionsView(view)) {
    renderPaneStructureEditor(els.fields, view);
  } else {
    renderNestedArrays(view);
  }

  if (!isPaneOptionsView(view) && !nested.length && collectEditableLeaves(view.value, view.path).length > rows.length) {
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
    state.nestedArrayKey = null;
    state.nestedArrayIndex = 0;
    state.childArrayKey = null;
    state.childArrayIndex = 0;
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
    state.nestedArrayKey = null;
    state.nestedArrayIndex = 0;
    state.childArrayKey = null;
    state.childArrayIndex = 0;
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

els.refreshTechsButton.addEventListener("click", async () => {
  try {
    const catalog = await api("/api/technologies/refresh", { method: "POST" });
    state.techCatalog = Array.isArray(catalog.technologies) ? catalog.technologies : [];
    renderTree();
    setStatus(`Updated ${catalog.path} with ${state.techCatalog.length} technologies.`);
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

loadTechnologyCatalog()
  .then(() => refresh(false))
  .catch(error => setStatus(error.message, true));
