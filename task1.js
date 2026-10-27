"use strict";
/* ===== Task 1 · Option C: Code Breaker =====
   Guess a secret code with no repeated digits in a limited number of attempts. */

// ---------- All game numbers are constants ----------
const CODE_LENGTH = 4;   // digits in the secret code
const MAX_ATTEMPTS = 8;  // attempts per game
const MIN_DIGIT = 0;     // smallest digit that can appear in the code
const MAX_DIGIT = 9;     // largest digit that can appear in the code

// ---------- DOM ----------
const form = document.getElementById("guess-form");
const input = document.getElementById("guess");
const guessBtn = document.getElementById("guess-btn");
const restartBtn = document.getElementById("restart-btn");
const messageEl = document.getElementById("message");
const historyEl = document.getElementById("history");
const leftEl = document.getElementById("attempts-left");
const usedEl = document.getElementById("attempts-used");
const statusEl = document.getElementById("game-status");
const gameBox = document.getElementById("game");
const rulesEl = document.getElementById("rules");

// ---------- State ----------
let secret = "";      // the secret code, e.g. "4071"
let guesses = [];     // [{ guess, exact, misplaced }]
let gameOver = false;

// ---------- Helpers ----------
// Fair random integer: min and max are both possible.
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSecret() {
  if (CODE_LENGTH > MAX_DIGIT - MIN_DIGIT + 1) {
    throw new Error("CODE_LENGTH is larger than the number of different digits.");
  }
  let code = "";
  while (code.length < CODE_LENGTH) {
    const digit = randomInt(MIN_DIGIT, MAX_DIGIT);
    if (!code.includes(String(digit))) code += digit; // no repeated digits
  }
  return code;
}

// Returns an error text, or "" if the guess is allowed.
function validateGuess(value) {
  if (value === "") return "Enter a code first.";
  for (const ch of value) {
    const n = Number(ch);
    if (Number.isNaN(n) || ch === " " || n < MIN_DIGIT || n > MAX_DIGIT) {
      return `Use only digits from ${MIN_DIGIT} to ${MAX_DIGIT}.`;
    }
  }
  if (value.length !== CODE_LENGTH) return `The code must have exactly ${CODE_LENGTH} digits.`;
  if (new Set(value).size !== value.length) return "Digits must not repeat.";
  if (guesses.some((g) => g.guess === value)) return "You already tried this code.";
  return "";
}

// Count digits in the right place and digits in the wrong place.
function evaluate(guess) {
  let exact = 0;
  let misplaced = 0;
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] === secret[i]) {
      exact++;
    } else if (secret.includes(guess[i])) {
      misplaced++;
    }
  }
  return { guess, exact, misplaced };
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.classList.remove("is-error", "is-success", "is-info", "is-warning");
  if (text !== "") messageEl.classList.add(`is-${type}`);
}

// ---------- Render ----------
function render() {
  leftEl.textContent = MAX_ATTEMPTS - guesses.length;
  usedEl.textContent = guesses.length;
  historyEl.replaceChildren();
  if (guesses.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "No guesses yet. Make your first move!";
    tr.appendChild(td);
    historyEl.appendChild(tr);
  }
  guesses.forEach((g, index) => {
    const tr = document.createElement("tr");
    const cells = [index + 1, g.guess, g.exact, g.misplaced];
    cells.forEach((value, col) => {
      const td = document.createElement("td");
      if (col >= 2) {
        const pill = document.createElement("span");
        pill.className = `pill ${col === 2 ? "exact" : "near"}`;
        pill.textContent = value;
        td.appendChild(pill);
      } else {
        td.textContent = value;
      }
      tr.appendChild(td);
    });
    historyEl.appendChild(tr);
  });
  input.disabled = gameOver;
  guessBtn.disabled = gameOver;
  gameBox.classList.remove("game-win", "game-loss");
}

// ---------- Game flow ----------
function startGame() {
  secret = generateSecret();
  guesses = [];
  gameOver = false;
  statusEl.textContent = "Playing";
  input.value = "";
  rulesEl.textContent = `Guess the ${CODE_LENGTH}-digit code (digits ${MIN_DIGIT}–${MAX_DIGIT}, no repeats) in ${MAX_ATTEMPTS} attempts. ` +
    "After each guess you see how many digits are in the right place and how many are in the wrong place.";
  input.placeholder = "0".repeat(CODE_LENGTH).replace(/0/g, "•");
  render();
  setMessage("New game started. Good luck!", "info");
  input.focus();
}

function endGame(won) {
  gameOver = true;
  render();
  gameBox.classList.add(won ? "game-win" : "game-loss");
  statusEl.textContent = won ? "You won!" : "You lost";
  setMessage(
    won ? `🎉 Correct! The code was ${secret}. You needed ${guesses.length} attempt(s).`
        : `Game over. The code was ${secret}. Press “New game” to try again.`,
    won ? "success" : "error"
  );
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (gameOver) return;
  const value = input.value.trim();
  const error = validateGuess(value);
  if (error !== "") {            // invalid move: message only, state unchanged
    setMessage(error, "error");
    input.focus();
    return;
  }
  const result = evaluate(value);
  guesses.push(result);
  input.value = "";
  const won = result.exact === CODE_LENGTH;
  const lost = result.exact !== CODE_LENGTH && guesses.length >= MAX_ATTEMPTS;
  if (won || lost) {
    endGame(won);
    return;
  }
  render();
  if (result.exact === 0 && result.misplaced === 0) {
    setMessage("None of these digits are in the code.", "info");
  } else if (result.exact === CODE_LENGTH - 1 || result.exact + result.misplaced === CODE_LENGTH) {
    setMessage("🔥 Very close!", "warning");
  } else {
    setMessage(`${result.exact} in the right place, ${result.misplaced} in the wrong place.`, "info");
  }
  input.focus();
});

restartBtn.addEventListener("click", startGame);
startGame();
