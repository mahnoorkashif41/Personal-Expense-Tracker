import type { AppData, BudgetStatus, Category, Expense, Filters } from "./types";
import { CATEGORIES } from "./types";
import { loadData, saveData } from "./storage";

export type Listener = () => void;

function monthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function seedExpenses(): Expense[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const prev = new Date(y, now.getMonth() - 1, 1);
  const py = prev.getFullYear();
  const pm = String(prev.getMonth() + 1).padStart(2, "0");

  const samples: Array<Omit<Expense, "id" | "createdAt" | "updatedAt">> = [
    { title: "Grocery haul — Imtiaz", amount: 8420, category: "Food", date: `${y}-${m}-03` },
    { title: "Office commute (Careem)", amount: 1450, category: "Transport", date: `${y}-${m}-05` },
    { title: "Electricity bill", amount: 12650, category: "Bills", date: `${y}-${m}-07` },
    { title: "Weekend brunch", amount: 3200, category: "Food", date: `${y}-${m}-08` },
    { title: "Pharmacy restock", amount: 2150, category: "Health", date: `${y}-${m}-10` },
    { title: "Netflix + Spotify", amount: 1890, category: "Entertainment", date: `${y}-${m}-12` },
    { title: "New sneakers", amount: 9800, category: "Shopping", date: `${y}-${m}-14` },
    { title: "Online course installment", amount: 7500, category: "Education", date: `${y}-${m}-16` },
    { title: "Fuel fill-up", amount: 4300, category: "Transport", date: `${y}-${m}-18` },
    { title: "Dinner with friends", amount: 5600, category: "Food", date: `${y}-${m}-21` },
    { title: "Internet bill", amount: 3500, category: "Bills", date: `${y}-${m}-22` },
    { title: "Coffee & coworking", amount: 980, category: "Other", date: `${y}-${m}-24` },
    { title: "Last month rent share", amount: 18000, category: "Bills", date: `${py}-${pm}-02` },
    { title: "Family grocery run", amount: 6100, category: "Food", date: `${py}-${pm}-15` },
    { title: "Cinema night", amount: 2400, category: "Entertainment", date: `${py}-${pm}-20` },
  ];

  const stamp = now.toISOString();
  return samples.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    createdAt: stamp,
    updatedAt: stamp,
  }));
}

class ExpenseStore {
  data: AppData;
  filters: Filters;
  private listeners = new Set<Listener>();

  constructor() {
    this.data = loadData();
    if (!this.data.hasSeeded && this.data.expenses.length === 0) {
      this.data.expenses = seedExpenses();
      this.data.hasSeeded = true;
      saveData(this.data);
    }
    this.filters = {
      query: "",
      category: "all",
      month: monthKey(),
      sortKey: "date",
      sortDir: "desc",
    };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    saveData(this.data);
    this.listeners.forEach((fn) => fn());
  }

  setFilters(partial: Partial<Filters>) {
    this.filters = { ...this.filters, ...partial };
    this.listeners.forEach((fn) => fn());
  }

  getBudget(month = this.filters.month): number {
    return this.data.settings.monthlyBudgets[month] ?? this.data.settings.monthlyBudgetDefault;
  }

  setDefaultBudget(amount: number) {
    this.data.settings.monthlyBudgetDefault = amount;
    this.emit();
  }

  setMonthBudget(month: string, amount: number) {
    this.data.settings.monthlyBudgets[month] = amount;
    this.emit();
  }

  addExpense(input: { title: string; amount: number; category: Category; date: string }) {
    const now = new Date().toISOString();
    const expense: Expense = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      amount: input.amount,
      category: input.category,
      date: input.date,
      createdAt: now,
      updatedAt: now,
    };
    this.data.expenses.unshift(expense);
    this.emit();
    return expense;
  }

  updateExpense(id: string, input: { title: string; amount: number; category: Category; date: string }) {
    const idx = this.data.expenses.findIndex((e) => e.id === id);
    if (idx === -1) return;
    this.data.expenses[idx] = {
      ...this.data.expenses[idx],
      title: input.title.trim(),
      amount: input.amount,
      category: input.category,
      date: input.date,
      updatedAt: new Date().toISOString(),
    };
    this.emit();
  }

  deleteExpense(id: string) {
    this.data.expenses = this.data.expenses.filter((e) => e.id !== id);
    this.emit();
  }

  monthExpenses(month = this.filters.month): Expense[] {
    return this.data.expenses.filter((e) => e.date.startsWith(month));
  }

  filteredList(): Expense[] {
    const q = this.filters.query.trim().toLowerCase();
    let list = this.monthExpenses();
    if (this.filters.category !== "all") {
      list = list.filter((e) => e.category === this.filters.category);
    }
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      );
    }
    const dir = this.filters.sortDir === "asc" ? 1 : -1;
    const key = this.filters.sortKey;
    return [...list].sort((a, b) => {
      if (key === "amount") return (a.amount - b.amount) * dir;
      if (key === "title") return a.title.localeCompare(b.title) * dir;
      return a.date.localeCompare(b.date) * dir || a.createdAt.localeCompare(b.createdAt) * dir;
    });
  }

  monthTotal(month = this.filters.month): number {
    return this.monthExpenses(month).reduce((sum, e) => sum + e.amount, 0);
  }

  stats() {
    const month = this.filters.month;
    const items = this.monthExpenses(month);
    const spent = items.reduce((sum, e) => sum + e.amount, 0);
    const count = items.length;
    const average = count ? spent / count : 0;
    const budget = this.getBudget(month);
    const remaining = budget - spent;
    const percent = budget > 0 ? (spent / budget) * 100 : 0;
    let status: BudgetStatus = "unset";
    if (budget > 0) {
      if (percent > 100) status = "over";
      else if (percent >= 80) status = "near";
      else status = "under";
    }
    return { spent, count, average, budget, remaining, percent, status, month };
  }

  sumByCategory(month = this.filters.month): Record<Category, number> {
    const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
    for (const e of this.monthExpenses(month)) {
      totals[e.category] += e.amount;
    }
    return totals;
  }

  sumByDay(month = this.filters.month): { labels: string[]; values: number[] } {
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const values = Array.from({ length: daysInMonth }, () => 0);
    for (const e of this.monthExpenses(month)) {
      const day = Number(e.date.slice(8, 10));
      if (day >= 1 && day <= daysInMonth) values[day - 1] += e.amount;
    }
    return {
      labels: values.map((_, i) => String(i + 1)),
      values,
    };
  }

  lastNMonths(n = 6): { labels: string[]; values: number[] } {
    const labels: string[] = [];
    const values: number[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      labels.push(
        d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      );
      values.push(this.monthTotal(key));
    }
    return { labels, values };
  }

  availableMonths(): string[] {
    const set = new Set<string>();
    set.add(monthKey());
    for (const e of this.data.expenses) {
      set.add(e.date.slice(0, 7));
    }
    return [...set].sort().reverse();
  }
}

export const store = new ExpenseStore();
