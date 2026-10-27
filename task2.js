"use strict";
/* ===== Task 2 · Option A: Kanban board =====
   The page is built from the `cards` array. Rule: change the data first, then call render(). */

const PROGRESS_LIMIT = 3; // max cards in "In progress"
const COLUMNS = [
  { id: "todo", title: "To do" },
  { id: "progress", title: "In progress" },
  { id: "done", title: "Done" },
];
const TAGS = ["design", "frontend", "backend", "docs", "testing"];
const PRIORITY_LABELS = { 1: "Low", 2: "Medium", 3: "High" };

// Data: unique id, title (string), tag (string), priority (number), hours (number), urgent (boolean), column (string)
let cards = [
  { id: 1, title: "Design the logo", tag: "design", priority: 2, hours: 4, urgent: false, column: "todo" },
  { id: 2, title: "Build the navigation bar", tag: "frontend", priority: 3, hours: 3, urgent: true, column: "progress" },
  { id: 3, title: "Write the README", tag: "docs", priority: 1, hours: 2, urgent: false, column: "todo" },
  { id: 4, title: "Create the database schema", tag: "backend", priority: 3, hours: 6, urgent: true, column: "done" },
  { id: 5, title: "Test the login form", tag: "testing", priority: 2, hours: 2, urgent: false, column: "todo" },
  { id: 6, title: "Make the footer responsive", tag: "frontend", priority: 1, hours: 1, urgent: false, column: "done" },
  { id: 7, title: "Choose the color palette", tag: "design", priority: 2, hours: 2, urgent: false, column: "done" },
  { id: 8, title: "Set up the REST API", tag: "backend", priority: 3, hours: 8, urgent: true, column: "progress" },
  { id: 9, title: "Document the API", tag: "docs", priority: 2, hours: 3, urgent: false, column: "todo" },
  { id: 10, title: "Fix the mobile menu bug", tag: "frontend", priority: 3, hours: 2, urgent: true, column: "todo" },
  { id: 11, title: "Write unit tests", tag: "testing", priority: 1, hours: 5, urgent: false, column: "todo" },
  { id: 12, title: "Prepare the presentation", tag: "docs", priority: 2, hours: 3, urgent: false, column: "progress" },
];

// ---------- State of controls ----------
let filters = { query: "", tag: "all", sort: "none" };
let message = { text: "", type: "info" };

// ---------- DOM ----------
const boardEl = document.getElementById("board");
const searchEl = document.getElementById("search");
const tagFilterEl = document.getElementById("filter-tag");
const sortEl = document.getElementById("sort");
const progressEl = document.getElementById("progress");
const progressTextEl = document.getElementById("progress-text");
const messageEl = document.getElementById("message");
const emptyAllEl = document.getElementById("empty-all");
const addForm = document.getElementById("add-form");
const newTitleEl = document.getElementById("new-title");
const newTagEl = document.getElementById("new-tag");
const newPriorityEl = document.getElementById("new-priority");

// ---------- Helpers (own loops) ----------
function countInColumn(columnId) {
  let count = 0;
  for (const card of cards) {
    if (card.column === columnId) count++;
  }
  return count;
}

function getStats() {
  let done = 0, hoursTotal = 0, hoursDone = 0;
  for (const card of cards) {
    hoursTotal += card.hours;
    if (card.column === "done") { done++; hoursDone += card.hours; }
  }
  return { done, total: cards.length, hoursTotal, hoursDone };
}

function getVisibleCards() {
  const query = filters.query.trim().toLowerCase();
  let list = cards.filter((c) =>
    (filters.tag === "all" || c.tag === filters.tag) &&
    (query === "" || c.title.toLowerCase().includes(query))
  );
  if (filters.sort === "desc") list = [...list].sort((a, b) => b.priority - a.priority || a.id - b.id);
  if (filters.sort === "asc") list = [...list].sort((a, b) => a.priority - b.priority || a.id - b.id);
  return list;
}

function makeButton(text, label, action, id, disabled) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn secondary";
  btn.textContent = text;
  btn.setAttribute("aria-label", label);
  btn.dataset.action = action;
  btn.dataset.id = id;
  btn.disabled = disabled;
  return btn;
}

function createCardElement(card, columnIndex) {
  const li = document.createElement("li");
  li.className = `card-item prio-${card.priority}`;
  if (card.column === "done") li.classList.add("is-done");

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = card.title;

  const meta = document.createElement("div");
  meta.className = "meta";
  const badges = [`#${card.tag}`, `${PRIORITY_LABELS[card.priority]} priority`, `${card.hours} h`];
  for (const text of badges) {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = text;
    meta.appendChild(b);
  }
  if (card.urgent) {
    const u = document.createElement("span");
    u.className = "badge urgent";
    u.textContent = "Urgent";
    meta.appendChild(u);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.append(
    makeButton("←", `Move “${card.title}” left`, "left", card.id, columnIndex === 0),
    makeButton("→", `Move “${card.title}” right`, "right", card.id, columnIndex === COLUMNS.length - 1),
    makeButton("✕", `Delete “${card.title}”`, "delete", card.id, false)
  );
  li.append(title, meta, actions);
  return li;
}

// ---------- The one render function ----------
function render() {
  const visible = getVisibleCards();

  boardEl.replaceChildren();
  COLUMNS.forEach((col, columnIndex) => {
    const section = document.createElement("section");
    section.className = "column";
    if (col.id === "progress" && countInColumn("progress") >= PROGRESS_LIMIT) section.classList.add("is-full");

    const h2 = document.createElement("h2");
    const titleSpan = document.createElement("span");
    titleSpan.textContent = col.title;
    const countSpan = document.createElement("span");
    countSpan.className = "muted";
    const total = countInColumn(col.id);
    countSpan.textContent = col.id === "progress" ? `${total}/${PROGRESS_LIMIT}` : String(total);
    h2.append(titleSpan, countSpan);

    const ul = document.createElement("ul");
    ul.className = "card-list";
    const inColumn = visible.filter((c) => c.column === col.id);
    for (const card of inColumn) ul.appendChild(createCardElement(card, columnIndex));
    if (inColumn.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-note";
      li.textContent = "No cards here";
      ul.appendChild(li);
    }
    section.append(h2, ul);
    boardEl.appendChild(section);
  });

  const stats = getStats();
  progressEl.max = Math.max(stats.total, 1);
  progressEl.value = stats.done;
  progressTextEl.textContent = `${stats.done} of ${stats.total} (${stats.hoursDone}/${stats.hoursTotal} h)`;

  emptyAllEl.textContent = visible.length === 0 ? "Nothing found. Change the search or the tag filter." : "";
  messageEl.textContent = message.text;
  messageEl.classList.remove("is-error", "is-success", "is-info", "is-warning");
  if (message.text !== "") messageEl.classList.add(`is-${message.type}`);
}

function setMessage(text, type) {
  message = { text, type };
}

// ---------- Actions ----------
function moveCard(id, direction) {
  const card = cards.find((c) => c.id === id);
  if (!card) return;
  const index = COLUMNS.findIndex((c) => c.id === card.column);
  const target = COLUMNS[index + direction];
  if (!target) return;
  // Rule: the middle column holds at most PROGRESS_LIMIT cards
  if (target.id === "progress" && countInColumn("progress") >= PROGRESS_LIMIT) {
    setMessage(`Blocked: “In progress” already has ${PROGRESS_LIMIT} cards. Finish one first.`, "error");
  } else {
    card.column = target.id;
    setMessage(`“${card.title}” moved to “${target.title}”.`, "success");
  }
  render();
}

function deleteCard(id) {
  const card = cards.find((c) => c.id === id);
  cards = cards.filter((c) => c.id !== id);
  setMessage(card ? `Deleted “${card.title}”.` : "", "info");
  render();
}

function addCard(title, tag, priority) {
  const nextId = cards.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  cards.push({ id: nextId, title, tag, priority, hours: 1, urgent: priority === 3, column: "todo" });
  setMessage(`Added “${title}” to “To do”.`, "success");
  render();
}

// ---------- Events ----------
// ONE listener on the container for the buttons of all cards (event delegation)
boardEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn || btn.disabled) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === "left") moveCard(id, -1);
  if (btn.dataset.action === "right") moveCard(id, 1);
  if (btn.dataset.action === "delete") deleteCard(id);
});

searchEl.addEventListener("input", () => { filters.query = searchEl.value; setMessage("", "info"); render(); });
tagFilterEl.addEventListener("change", () => { filters.tag = tagFilterEl.value; setMessage("", "info"); render(); });
sortEl.addEventListener("change", () => { filters.sort = sortEl.value; setMessage("", "info"); render(); });

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = newTitleEl.value.trim();
  if (title.length < 3) {
    setMessage("Title must have at least 3 characters.", "error");
    render();
    newTitleEl.focus();
    return;
  }
  if (cards.some((c) => c.title.toLowerCase() === title.toLowerCase())) {
    setMessage("A card with this title already exists.", "error");
    render();
    newTitleEl.focus();
    return;
  }
  addCard(title, newTagEl.value, Number(newPriorityEl.value));
  addForm.reset();
});

// ---------- Init: fill selects from the TAGS array ----------
function fillTagSelect(select, withAll) {
  if (withAll) {
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All tags";
    select.appendChild(all);
  }
  for (const tag of TAGS) {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    select.appendChild(opt);
  }
}
fillTagSelect(tagFilterEl, true);
fillTagSelect(newTagEl, false);
render();
