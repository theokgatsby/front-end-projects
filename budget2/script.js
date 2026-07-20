// Budget Dashboard Script

const defaultData = {
 monthly: [
  { name: "Five9", formula: "3986.67", category: "Required" },
  { name: "401k", formula: "-159.47", category: "Required" },
  { name: "Roth", formula: "-617.50", category: "Required" },
  { name: "Taxes", formula: "-674.04", category: "Required" },
  { name: "Car Ins", formula: "-102.90", category: "Required" },
  { name: "Health Ins", formula: "-180.00", category: "Required" },
  { name: "Food", formula: "-150.00", category: "Required" },
  { name: "Rent", formula: "-216.67", category: "Required" },
  { name: "Gas", formula: "-100.00", category: "Required" },
  { name: "Spotify", formula: "-11.87", category: "Personal" },
  { name: "YouTube", formula: "-9.71", category: "Personal" },
  { name: "Apple", formula: "-1.07", category: "Personal" },
  { name: "Domain", formula: "-0.72", category: "Personal" },
 ],
 retirement: {
  "Wegmans 401k": 18763.55,
  "Aspen Ski Co 401k": 0,
  "Five9 401k": 0,
 },
 portfolio: [
  {
   stock: "AAPL",
   shares: 1.7181,
   purchasePrice: 290.82,
   currentPrice: 333.74,
  },
  { stock: "VOO", shares: 0.0054, purchasePrice: 682.98, currentPrice: 683.17 },
  { stock: "VOO", shares: 0.1473, purchasePrice: 681.31, currentPrice: 683.17 },
  { stock: "VOO", shares: 14.5556, purchasePrice: 687.0, currentPrice: 683.17 },
  { stock: "AAPL", shares: 1.028, purchasePrice: 277.0, currentPrice: 333.74 },
  {
   stock: "GOOGL",
   shares: 0.4153,
   purchasePrice: 361.21,
   currentPrice: 346.77,
  },
  {
   stock: "GOOGL",
   shares: 0.0799,
   purchasePrice: 361.26,
   currentPrice: 346.77,
  },
  { stock: "NVDA", shares: 1.398, purchasePrice: 203.97, currentPrice: 202.81 },
 ],
};

let budgetData = {};
let editingMonthlyIndex = null;

async function loadDefaultData() {
 try {
  const response = await fetch("data.json");
  if (!response.ok) {
   throw new Error(`HTTP ${response.status}`);
  }
  budgetData = await response.json();
 } catch (error) {
  console.warn("Could not load data.json, using fallback default data.", error);
  budgetData = defaultData;
 }

 normalizeBudgetData();
 renderMonthly();
 renderRetirement();
 renderPortfolio();
 calculateTotals();
}

function normalizeBudgetData() {
 if (!budgetData || typeof budgetData !== "object") {
  budgetData = defaultData;
 }

 if (!Array.isArray(budgetData.monthly)) {
  const entries = Object.entries(budgetData.monthly || {});
  const personalStart = Math.max(0, entries.length - 4);
  budgetData.monthly = entries.map(([name, amount], index) => ({
   name,
   formula: String(amount),
   category: index >= personalStart ? "Personal" : "Required",
  }));
 } else {
  budgetData.monthly = budgetData.monthly.map((entry) => ({
   name: entry.name,
   formula:
    entry.formula != null ? String(entry.formula) : String(entry.amount ?? 0),
   category: entry.category || "Required",
  }));
 }

 if (!Array.isArray(budgetData.portfolio)) {
  budgetData.portfolio = [];
 }
 if (!budgetData.retirement || typeof budgetData.retirement !== "object") {
  budgetData.retirement = {};
 }
}

function formatCurrency(value) {
 return new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
 }).format(value);
}

function escapeHtml(text) {
 return String(text)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");
}

function toIdentifier(name) {
 const cleaned = String(name).replace(/[^A-Za-z0-9_]/g, "_");
 return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned;
}

function getMonthlyValue(name, stack = []) {
 const item = budgetData.monthly.find((entry) => entry.name === name);
 if (!item) return 0;
 if (stack.includes(name)) {
  throw new Error(`Circular reference detected for "${name}"`);
 }
 return evaluateMonthlyFormula(item.formula, stack.concat(name));
}

function evaluateMonthlyFormula(formula, stack = []) {
 const expression = String(formula).trim();
 if (expression === "") return 0;
 if (/^[+-]?\d+(?:\.\d+)?$/.test(expression)) {
  return parseFloat(expression);
 }

 const values = {};
 budgetData.monthly.forEach((item) => {
  if (!stack.includes(item.name)) {
   values[toIdentifier(item.name)] = getMonthlyValue(item.name, stack);
  }
 });

 const expanded = expression.replace(
  /value\(\s*(['"])(.*?)\1\s*\)/g,
  (match, quote, key) => {
   const value = getMonthlyValue(key, stack);
   return `(${value})`;
  },
 );

 const safeExpression = expanded.replace(
  /\b[A-Za-z_][A-Za-z0-9_]*\b/g,
  (token) => {
   if (token === "value") return token;
   if (Object.prototype.hasOwnProperty.call(values, token))
    return `(${values[token]})`;
   throw new Error(`Unknown reference "${token}"`);
  },
 );

 if (!/^[0-9+\-*/().\s]+$/.test(safeExpression)) {
  throw new Error("Formula contains invalid characters");
 }

 const result = Function('"use strict"; return (' + safeExpression + ");")();
 if (typeof result !== "number" || !Number.isFinite(result)) {
  throw new Error("Formula did not evaluate to a valid number");
 }
 return result;
}

function renderMonthly() {
 const requiredBody = document.getElementById("monthlyTableRequired");
 const personalBody = document.getElementById("monthlyTablePersonal");
 requiredBody.innerHTML = "";
 personalBody.innerHTML = "";

 budgetData.monthly.forEach((item, index) => {
  const targetBody = item.category === "Personal" ? personalBody : requiredBody;
  const row = targetBody.insertRow();

  if (editingMonthlyIndex === index) {
   row.innerHTML = `
                <td>${escapeHtml(item.name)}</td>
                <td colspan="2">
                    <input type="text" class="form-control form-control-sm" id="editMonthlyFormulaInput" value="${escapeHtml(item.formula)}">
                    <div class="form-text">Use math and references like <code>Five9 * 0.04 * -1</code> or <code>value("401k") * 0.04</code>.</div>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-primary me-2" onclick="saveMonthlyEdit(${index})">Save</button>
                    <button class="btn btn-sm btn-secondary" onclick="cancelMonthlyEdit()">Cancel</button>
                </td>
            `;
   return;
  }

  let valueText = "";
  let valueClass = "";
  try {
   const value = getMonthlyValue(item.name);
   valueText = formatCurrency(value);
   valueClass = value >= 0 ? "text-success" : "text-danger";
  } catch (error) {
   valueText = "Invalid";
   valueClass = "text-danger";
  }

  const actions = `
            <button class="btn btn-sm btn-link p-0 me-3" onclick="editMonthly(${index})">Edit</button>
            ${item.category === "Personal" ? `<button class="btn btn-sm btn-link text-danger p-0" onclick="deleteMonthly(${index})">Remove</button>` : ""}
        `;

  row.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td class="text-end ${valueClass}"><strong>${valueText}</strong></td>
            <td class="text-end">${actions}</td>
        `;
 });
}

function renderRetirement() {
 const table = document.getElementById("retirementTable");
 table.innerHTML = "";

 Object.entries(budgetData.retirement).forEach(([name, amount]) => {
  const row = table.insertRow();
  row.innerHTML = `
            <td>${escapeHtml(name)}</td>
            <td class="text-end text-success">${formatCurrency(amount)}</td>
        `;
 });
}

function renderPortfolio() {
 const table = document.getElementById("portfolioTable");
 table.innerHTML = "";

 if (!Array.isArray(budgetData.portfolio)) {
  return;
 }

 budgetData.portfolio.forEach((stock, index) => {
  const { gain, percent } = calculateGainLoss(
   stock.shares,
   stock.purchasePrice,
   stock.currentPrice,
  );
  const gainClass = gain >= 0 ? "text-success" : "text-danger";

  const row = table.insertRow();
  row.innerHTML = `
            <td>${escapeHtml(stock.stock)}</td>
            <td class="text-end">${stock.shares.toFixed(4)}</td>
            <td class="text-end">$${stock.purchasePrice.toFixed(2)}</td>
            <td class="text-end">$${stock.currentPrice.toFixed(2)}</td>
            <td class="text-end ${gainClass}">${formatCurrency(gain)}</td>
            <td class="text-end ${gainClass}">${percent.toFixed(2)}%</td>
        `;
 });
}

function calculateGainLoss(shares, purchasePrice, currentPrice) {
 const gain = (currentPrice - purchasePrice) * shares;
 const percent =
  purchasePrice === 0
   ? 0
   : ((currentPrice - purchasePrice) / purchasePrice) * 100;
 return { gain, percent };
}

function calculateTotals() {
 const monthlyTotal = budgetData.monthly.reduce((sum, item) => {
  try {
   return sum + getMonthlyValue(item.name);
  } catch (error) {
   return sum;
  }
 }, 0);
 const retirementTotal = Object.values(budgetData.retirement || {}).reduce(
  (a, b) => a + b,
  0,
 );
 const stockTotal = Array.isArray(budgetData.portfolio)
  ? budgetData.portfolio.reduce((a, b) => a + b.shares * b.currentPrice, 0)
  : 0;

 document.getElementById("netMonthly").textContent =
  formatCurrency(monthlyTotal);
 document.getElementById("retirementTotal").textContent =
  formatCurrency(retirementTotal);
 document.getElementById("stockTotal").textContent = formatCurrency(stockTotal);
}

function addMonthly() {
 const nameInput = document.getElementById("monthlyNameInput");
 const amountInput = document.getElementById("monthlyAmountInput");
 const categoryInput = document.getElementById("monthlyCategoryInput");

 const name = nameInput.value.trim();
 const formula = amountInput.value.trim();
 const category = categoryInput.value;

 if (!name || !formula) {
  alert("Enter a name and an amount or formula for the monthly item.");
  return;
 }

 budgetData.monthly.push({
  name,
  formula,
  category,
 });

 renderMonthly();
 calculateTotals();
 nameInput.value = "";
 amountInput.value = "";
 categoryInput.value = "Required";
}

function saveMonthlyEdit(index) {
 const input = document.getElementById("editMonthlyFormulaInput");
 if (!input) return;

 const item = budgetData.monthly[index];
 const newFormula = input.value.trim();

 if (!newFormula) {
  alert("Formula cannot be empty.");
  return;
 }

 const oldFormula = item.formula;
 item.formula = newFormula;

 try {
  getMonthlyValue(item.name);
 } catch (error) {
  item.formula = oldFormula;
  alert("Invalid formula: " + error.message);
  return;
 }

 editingMonthlyIndex = null;
 renderMonthly();
 calculateTotals();
}

function cancelMonthlyEdit() {
 editingMonthlyIndex = null;
 renderMonthly();
}

function editMonthly(index) {
 editingMonthlyIndex = index;
 renderMonthly();
}

function addRetirement() {
 const nameInput = document.getElementById("retirementNameInput");
 const amountInput = document.getElementById("retirementAmountInput");

 if (nameInput.value && amountInput.value) {
  budgetData.retirement[nameInput.value] = parseFloat(amountInput.value);
  renderRetirement();
  calculateTotals();
  nameInput.value = "";
  amountInput.value = "";
 }
}

function addStock() {
 const symbolInput = document.getElementById("stockSymbolInput");
 const sharesInput = document.getElementById("stockSharesInput");
 const purchaseInput = document.getElementById("stockPurchaseInput");
 const currentInput = document.getElementById("stockCurrentInput");

 if (
  symbolInput.value &&
  sharesInput.value &&
  purchaseInput.value &&
  currentInput.value
 ) {
  budgetData.portfolio.push({
   stock: symbolInput.value.toUpperCase(),
   shares: parseFloat(sharesInput.value),
   purchasePrice: parseFloat(purchaseInput.value),
   currentPrice: parseFloat(currentInput.value),
  });
  renderPortfolio();
  calculateTotals();
  symbolInput.value = "";
  sharesInput.value = "";
  purchaseInput.value = "";
  currentInput.value = "";
 }
}

function deleteMonthly(index) {
 budgetData.monthly.splice(index, 1);
 renderMonthly();
 calculateTotals();
}

document.addEventListener("DOMContentLoaded", function () {
 loadDefaultData();
});
