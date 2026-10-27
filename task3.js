"use strict";
/* ===== Task 3 · Option A: Ticket builder with live validation ===== */

// ---------- Data ----------
const EVENTS = [
  { id: "rock", name: "Rock Night", soldOut: ["2026-12-05", "2026-12-12"] },
  { id: "tech", name: "Tech Conference", soldOut: ["2026-11-20", "2026-12-18"] },
  { id: "jazz", name: "Jazz Evening", soldOut: ["2026-11-28", "2027-01-09"] },
];
// seats = seats left (changes after each successful booking)
const TICKET_TYPES = [
  { id: "standard", label: "Standard", price: 5000, seats: 20 },
  { id: "vip", label: "VIP", price: 15000, seats: 5 },
  { id: "student", label: "Student", price: 3000, seats: 10 },
];
const PROMOS = [
  { code: "SAVE10", percent: 10 },
  { code: "STUDENT20", percent: 20 },
  { code: "VIP30", percent: 30 },
];
const BLOCKED_DOMAINS = ["mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com"];
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const FIELD_NAMES = ["event", "date", "type", "quantity", "promo", "name", "email"];
// When a field changes, these fields depend on it and must be re-checked
const DEPENDENTS = { event: ["date"], type: ["quantity", "email"], quantity: [] };

// ---------- DOM ----------
const form = document.getElementById("booking-form");
form.noValidate = true; // turn off browser bubbles; checkValidity() still works
const summaryEl = document.getElementById("error-summary");
const resultEl = document.getElementById("result");
const fields = {};
for (const name of FIELD_NAMES) fields[name] = document.getElementById(name);
const pv = (id) => document.getElementById(`pv-${id}`);

const touched = new Set(); // fields the user has already left (blur)
const TODAY = new Date().toISOString().slice(0, 10);
fields.date.min = TODAY;

// ---------- Helpers ----------
const getEvent = () => EVENTS.find((e) => e.id === fields.event.value);
const getType = () => TICKET_TYPES.find((t) => t.id === fields.type.value);
const getPromo = () => PROMOS.find((p) => p.code === fields.promo.value.trim().toUpperCase());
const formatMoney = (n) => `${n.toLocaleString("en-US")} ₸`;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function makeBookingCode() {
  let code = "TK-";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length - 1)];
  return code;
}

function calcTotal() {
  const type = getType();
  const qty = Number(fields.quantity.value);
  if (!type || !Number.isInteger(qty) || qty < 1) return null;
  const promo = getPromo();
  const raw = type.price * qty;
  return Math.round(promo ? raw * (1 - promo.percent / 100) : raw);
}

// ---------- Fill selects ----------
function buildEventOptions() {
  fields.event.replaceChildren(new Option("Choose an event…", ""));
  for (const e of EVENTS) fields.event.add(new Option(e.name, e.id));
}
function buildTypeOptions() {
  const current = fields.type.value;
  fields.type.replaceChildren(new Option("Choose a ticket type…", ""));
  for (const t of TICKET_TYPES) {
    fields.type.add(new Option(`${t.label} — ${formatMoney(t.price)} (${t.seats} left)`, t.id));
  }
  fields.type.value = current;
}

// ---------- Hints ----------
function updateHints() {
  const ev = getEvent();
  document.getElementById("date-hint").textContent = ev
    ? `Sold out: ${ev.soldOut.join(", ")}`
    : "Choose an event to see sold-out dates.";
  const type = getType();
  document.getElementById("quantity-hint").textContent = type
    ? `Seats left: ${type.seats} (max 10 per booking)`
    : "Choose a ticket type to see seats left.";
}

// ---------- Live preview (runs on every input) ----------
function updatePreview() {
  const set = (id, text) => { pv(id).textContent = text === "" ? "—" : text; };
  const ev = getEvent();
  const type = getType();
  const promo = getPromo();
  set("event", ev ? ev.name : "");
  set("date", fields.date.value);
  set("type", type ? type.label : "");
  set("quantity", fields.quantity.value);
  set("name", fields.name.value.trim());
  set("email", fields.email.value.trim());
  set("promo", promo ? `${promo.code} (−${promo.percent}%)` : fields.promo.value.trim() ? "invalid code" : "");
  const total = calcTotal();
  set("total", total === null ? "" : formatMoney(total));
}

// ---------- Rules ----------
const REQUIRED = {
  event: "Choose an event.",
  date: "Choose a date.",
  type: "Choose a ticket type.",
  quantity: "Enter the number of tickets.",
  name: "Enter your full name.",
  email: "Enter your email.",
};

// Custom rules that HTML attributes cannot express. Each returns "" (OK) or an error text.
const rules = {
  event: () => "",
  type: () => "",
  date: (value) => {
    const ev = getEvent();
    if (!ev) return "Choose an event first.";
    if (ev.soldOut.includes(value)) return `${value} is sold out for “${ev.name}”. Pick another date.`;
    return "";
  },
  quantity: (value) => {
    const type = getType();
    if (!type) return "Choose a ticket type first.";
    if (type.seats === 0) return `“${type.label}” tickets are sold out.`;
    if (Number(value) > type.seats) return `Only ${type.seats} “${type.label}” seat(s) left.`;
    return "";
  },
  promo: (value) => {
    if (value === "") return "";
    return getPromo() ? "" : "This promo code does not exist.";
  },
  name: (value) => {
    const words = value.split(/\s+/).filter(Boolean);
    if (words.length < 2) return "Enter first name and last name (at least two words).";
    if (!/^[\p{L}][\p{L}'’-]+$/u.test(words[0]) || words.some((w) => !/^[\p{L}'’-]{2,}$/u.test(w))) {
      return "Each name part needs at least 2 letters and no digits or symbols.";
    }
    return "";
  },
  email: (value) => {
    const domain = value.split("@")[1]?.toLowerCase() ?? "";
    if (BLOCKED_DOMAINS.includes(domain)) return "Disposable email addresses are not allowed.";
    const type = getType();
    if (type && type.id === "student" && !/(^|\.)edu(\.|$)/.test(domain)) {
      return "Student tickets need a university email with “.edu” in the domain.";
    }
    return "";
  },
};

// Returns the error text for one field (and keeps the Constraint Validation API in sync).
function getMessage(el) {
  el.setCustomValidity("");
  const v = el.validity;
  if (v.valueMissing) return REQUIRED[el.name];
  if (v.typeMismatch) return "Enter a valid email like name@example.com.";
  if (v.badInput) return "Enter a valid value.";
  if (el.name === "date" && v.rangeUnderflow) return "The date cannot be in the past.";
  if (el.name === "quantity" && (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch)) {
    return "Quantity must be a whole number from 1 to 10.";
  }
  if (el.name === "name" && v.tooShort) return "Name must have at least 3 characters.";
  const custom = rules[el.name](el.value.trim());
  if (custom !== "") el.setCustomValidity(custom);
  return custom;
}

function showError(el, message) {
  const errorEl = document.getElementById(`${el.id}-error`);
  errorEl.textContent = message;
  el.setAttribute("aria-invalid", message === "" ? "false" : "true");
  el.classList.toggle("invalid", message !== "");
  el.classList.toggle("valid", message === "" && el.value !== "");
}

function checkField(el) {
  const message = getMessage(el);
  showError(el, message);
  return message;
}

function clearAllErrors() {
  for (const el of Object.values(fields)) {
    document.getElementById(`${el.id}-error`).textContent = "";
    el.removeAttribute("aria-invalid");
    el.classList.remove("invalid", "valid");
  }
  summaryEl.textContent = "";
  summaryEl.classList.remove("is-error", "is-success");
}

// ---------- Events ----------
function onFieldChange(event) {
  const el = event.target;
  if (!FIELD_NAMES.includes(el.name)) return;
  if (el.name === "type" || el.name === "event") updateHints();
  updatePreview();
  if (touched.has(el.name)) checkField(el);        // after blur: validate on every input
  for (const dep of DEPENDENTS[el.name] ?? []) {   // dependent fields
    if (touched.has(dep)) checkField(fields[dep]);
  }
}
form.addEventListener("input", onFieldChange);
form.addEventListener("change", onFieldChange);

// focusout bubbles (blur does not): first check happens when the user leaves a field
form.addEventListener("focusout", (event) => {
  const el = event.target;
  if (!FIELD_NAMES.includes(el.name)) return;
  touched.add(el.name);
  checkField(el);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  let errors = 0;
  let firstInvalid = null;
  for (const name of FIELD_NAMES) {
    touched.add(name);
    if (checkField(fields[name]) !== "") {
      errors++;
      firstInvalid = firstInvalid ?? fields[name];
    }
  }
  if (errors > 0) {
    summaryEl.textContent = `${errors} error${errors === 1 ? "" : "s"} found. Please fix the highlighted fields.`;
    summaryEl.classList.remove("is-success");
    summaryEl.classList.add("is-error");
    firstInvalid.focus();
    return;
  }
  createTicket();
});

// ---------- Result ----------
function createTicket() {
  const ev = getEvent();
  const type = getType();
  const promo = getPromo();
  const qty = Number(fields.quantity.value);
  const total = calcTotal();
  const code = makeBookingCode();
  const rows = [
    ["Booking code", code, "code"],
    ["Event", ev.name],
    ["Date", fields.date.value],
    ["Type", `${type.label} × ${qty}`],
    ["Name", fields.name.value.trim()],
    ["Email", fields.email.value.trim()],
    ["Promo", promo ? `${promo.code} (−${promo.percent}%)` : "none"],
    ["Total", formatMoney(total), "total"],
  ];

  const article = document.createElement("article");
  article.className = "ticket is-ready";
  const h3 = document.createElement("h3");
  h3.textContent = "✅ Your ticket is ready";
  const dl = document.createElement("dl");
  for (const [label, value, cls] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    if (cls) dd.className = cls;
    dl.append(dt, dd);
  }
  article.append(h3, dl);
  resultEl.replaceChildren(article);
  resultEl.hidden = false;

  type.seats -= qty;           // seats are really taken
  form.reset();
  touched.clear();
  clearAllErrors();
  buildTypeOptions();
  updateHints();
  updatePreview();
  summaryEl.textContent = "Booking successful!";
  summaryEl.classList.add("is-success");
  resultEl.focus();
}

form.addEventListener("reset", () => {
  // run after the browser has cleared the values
  setTimeout(() => { updateHints(); updatePreview(); }, 0);
});

// ---------- Init (no errors on page load) ----------
buildEventOptions();
buildTypeOptions();
updateHints();
updatePreview();
