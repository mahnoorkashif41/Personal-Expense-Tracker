import { CATEGORIES, type Category, type Expense, type SortKey } from "../types";
import { store } from "../store";
import { icon } from "../icons";
import { formatMonthLabel, formatShortDate, money } from "../format";
import { CATEGORY_COLORS, updateCharts } from "../charts";
import { downloadCsv, expensesToCsv } from "../csv";

function $(id: string) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

function toast(message: string) {
  const stack = $("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  stack.append(el);
  window.setTimeout(() => el.remove(), 2800);
}

function openDialog(id: "modal" | "confirm") {
  const el = $(id);
  el.classList.add("open");
  el.removeAttribute("hidden");
  const focusable = el.querySelector<HTMLElement>("input, select, button");
  focusable?.focus();
}

function closeDialog(id: "modal" | "confirm") {
  const el = $(id);
  el.classList.remove("open");
  el.setAttribute("hidden", "");
}

function fillSelects() {
  const month = $("month") as HTMLSelectElement;
  month.innerHTML = store.availableMonths()
    .map((m) => `<option value="${m}" ${m === store.filters.month ? "selected" : ""}>${formatMonthLabel(m)}</option>`)
    .join("");

  const catFilter = $("category-filter") as HTMLSelectElement;
  catFilter.innerHTML =
    `<option value="all">All categories</option>` +
    CATEGORIES.map((c) => `<option value="${c}" ${store.filters.category === c ? "selected" : ""}>${c}</option>`).join("");

  const fieldCat = $("field-category") as HTMLSelectElement;
  fieldCat.innerHTML = CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function renderStats() {
  const s = store.stats();
  $("stat-spent-label").innerHTML = `${icon("trend")} Spent`;
  $("stat-count-label").innerHTML = `${icon("receipt")} Transactions`;
  $("stat-avg-label").innerHTML = `${icon("spark")} Average`;
  $("stat-left-label").innerHTML = `${icon("target")} Remaining`;
  $("stat-spent").textContent = money.format(s.spent);
  $("stat-count").textContent = String(s.count);
  $("stat-avg").textContent = money.format(s.average);
  $("stat-left").textContent = money.format(s.remaining);
  $("stat-spent-hint").textContent = formatMonthLabel(s.month);
  $("stat-left-hint").textContent =
    s.status === "over" ? "Over budget" : s.status === "near" ? "Close to the limit" : "Inside the plan";

  const pct = Math.min(s.percent, 100);
  const bar = $("budget-bar");
  bar.style.width = `${s.budget > 0 ? pct : 0}%`;
  const progress = $("budget-progress");
  progress.classList.remove("near", "over");
  if (s.status === "near") progress.classList.add("near");
  if (s.status === "over") progress.classList.add("over");
  $("budget-status").textContent = s.budget
    ? `${Math.round(s.percent)}% of ${money.format(s.budget)} used`
    : "Set a monthly budget to track remaining spend.";
  $("budget-caption").textContent = `Plan for ${formatMonthLabel(s.month)}`;
  ($("budget-input") as HTMLInputElement).value = String(s.budget || "");
}

function renderLegend() {
  const totals = store.sumByCategory();
  const spent = store.monthTotal();
  $("category-legend").innerHTML = CATEGORIES.filter((c) => totals[c] > 0)
    .map((c) => {
      const share = spent ? Math.round((totals[c] / spent) * 100) : 0;
      return `<div class="legend-item"><span class="swatch" style="background:${CATEGORY_COLORS[c]}"></span>${c} · ${share}%</div>`;
    })
    .join("");
}

function renderList() {
  const items = store.filteredList();
  const list = $("expense-list");
  if (!items.length) {
    list.innerHTML = `<div class="empty">${icon("search")}<h3>No expenses found</h3><p>Try another search, category, or add a new one.</p></div>`;
    return;
  }
  list.innerHTML = items
    .map((e) => {
      const initial = e.category.slice(0, 2).toUpperCase();
      return `<article class="expense-row" data-id="${e.id}">
        <div class="cat-badge" style="background:${CATEGORY_COLORS[e.category]}">${initial}</div>
        <div>
          <div class="expense-title">${escapeHtml(e.title)}</div>
          <div class="expense-meta">${e.category} · ${formatShortDate(e.date)}</div>
        </div>
        <div class="expense-amount">${money.format(e.amount)}</div>
        <div class="row-actions">
          <button class="btn btn-ghost btn-icon" data-edit="${e.id}" aria-label="Edit ${escapeHtml(e.title)}">${icon("edit")}</button>
          <button class="btn btn-ghost btn-icon" data-delete="${e.id}" aria-label="Delete ${escapeHtml(e.title)}">${icon("trash")}</button>
        </div>
      </article>`;
    })
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function render() {
  fillSelects();
  renderStats();
  renderLegend();
  renderList();
  updateCharts();
  $("sort-dir").textContent = store.filters.sortDir === "desc" ? "Descending" : "Ascending";
}

export function bindUi() {
  $("brand-icon").innerHTML = icon("wallet");
  $("export-btn").innerHTML = `${icon("download")} Export CSV`;
  $("add-btn").innerHTML = `${icon("plus")} Add expense`;
  $("search-icon").innerHTML = icon("search");

  $("month").addEventListener("change", (e) => {
    store.setFilters({ month: (e.target as HTMLSelectElement).value });
  });
  $("search").addEventListener("input", (e) => {
    store.setFilters({ query: (e.target as HTMLInputElement).value });
  });
  $("category-filter").addEventListener("change", (e) => {
    const value = (e.target as HTMLSelectElement).value as Category | "all";
    store.setFilters({ category: value });
  });
  $("sort-key").addEventListener("change", (e) => {
    store.setFilters({ sortKey: (e.target as HTMLSelectElement).value as SortKey });
  });
  $("sort-dir").addEventListener("click", () => {
    store.setFilters({ sortDir: store.filters.sortDir === "asc" ? "desc" : "asc" });
  });

  $("add-btn").addEventListener("click", () => openExpenseModal());
  $("cancel-btn").addEventListener("click", () => closeDialog("modal"));
  $("modal").addEventListener("click", (e) => {
    if (e.target === $("modal")) closeDialog("modal");
  });
  $("confirm").addEventListener("click", (e) => {
    if (e.target === $("confirm")) closeDialog("confirm");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDialog("modal");
      closeDialog("confirm");
    }
  });

  $("export-btn").addEventListener("click", () => {
    const rows = store.filteredList();
    downloadCsv(`expenses-${store.filters.month}.csv`, expensesToCsv(rows));
    toast(rows.length ? "CSV downloaded" : "Exported an empty sheet");
  });

  $("budget-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = Number(($("budget-input") as HTMLInputElement).value);
    if (!Number.isFinite(value) || value < 0) return;
    store.setMonthBudget(store.filters.month, value);
    toast("Budget updated");
  });

  $("expense-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = ($("field-title") as HTMLInputElement).value.trim();
    const amount = Number(($("field-amount") as HTMLInputElement).value);
    const category = ($("field-category") as HTMLSelectElement).value as Category;
    const date = ($("field-date") as HTMLInputElement).value;
    const id = ($("field-id") as HTMLInputElement).value;
    $("err-title").textContent = title ? "" : "Title is required";
    $("err-amount").textContent = amount > 0 ? "" : "Enter an amount greater than 0";
    if (!title || !(amount > 0) || !date) return;
    if (id) {
      store.updateExpense(id, { title, amount, category, date });
      toast("Expense updated");
    } else {
      store.addExpense({ title, amount, category, date });
      toast("Expense added");
    }
    closeDialog("modal");
  });

  $("expense-list").addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest("button");
    if (!t) return;
    const editId = t.getAttribute("data-edit");
    const deleteId = t.getAttribute("data-delete");
    if (editId) {
      const item = store.data.expenses.find((x) => x.id === editId);
      if (item) openExpenseModal(item);
    }
    if (deleteId) {
      pendingDelete = deleteId;
      openDialog("confirm");
    }
  });

  $("confirm-cancel").addEventListener("click", () => closeDialog("confirm"));
  $("confirm-ok").addEventListener("click", () => {
    if (pendingDelete) {
      store.deleteExpense(pendingDelete);
      toast("Expense deleted");
      pendingDelete = null;
    }
    closeDialog("confirm");
  });
}

let pendingDelete: string | null = null;

function openExpenseModal(expense?: Expense) {
  ($("modal-title") as HTMLElement).textContent = expense ? "Edit expense" : "Add expense";
  ($("field-id") as HTMLInputElement).value = expense?.id ?? "";
  ($("field-title") as HTMLInputElement).value = expense?.title ?? "";
  ($("field-amount") as HTMLInputElement).value = expense ? String(expense.amount) : "";
  ($("field-category") as HTMLSelectElement).value = expense?.category ?? "Food";
  ($("field-date") as HTMLInputElement).value = expense?.date ?? new Date().toISOString().slice(0, 10);
  $("err-title").textContent = "";
  $("err-amount").textContent = "";
  openDialog("modal");
}
