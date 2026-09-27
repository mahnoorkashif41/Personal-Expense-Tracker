import type { AppData, AppSettings, Expense } from "./types";
import { CATEGORIES } from "./types";

export const STORAGE_KEY = "expense-tracker:v1";

const defaultSettings = (): AppSettings => ({
  monthlyBudgetDefault: 80000,
  monthlyBudgets: {},
  currency: "PKR",
});

export const emptyData = (): AppData => ({
  version: 1,
  expenses: [],
  settings: defaultSettings(),
  hasSeeded: false,
});

function isCategory(value: unknown): value is Expense["category"] {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function parseExpense(raw: unknown): Expense | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.id !== "string") return null;
  if (typeof e.title !== "string") return null;
  if (typeof e.amount !== "number" || !Number.isFinite(e.amount)) return null;
  if (!isCategory(e.category)) return null;
  if (typeof e.date !== "string") return null;
  return {
    id: e.id,
    title: e.title,
    amount: e.amount,
    category: e.category,
    date: e.date,
    createdAt: typeof e.createdAt === "string" ? e.createdAt : new Date().toISOString(),
    updatedAt: typeof e.updatedAt === "string" ? e.updatedAt : new Date().toISOString(),
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const expenses = Array.isArray(parsed.expenses)
      ? parsed.expenses.map(parseExpense).filter((e): e is Expense => e !== null)
      : [];
    const settings = parsed.settings ?? defaultSettings();
    return {
      version: 1,
      expenses,
      settings: {
        monthlyBudgetDefault:
          typeof settings.monthlyBudgetDefault === "number"
            ? settings.monthlyBudgetDefault
            : 80000,
        monthlyBudgets:
          settings.monthlyBudgets && typeof settings.monthlyBudgets === "object"
            ? settings.monthlyBudgets
            : {},
        currency: "PKR",
      },
      hasSeeded: Boolean(parsed.hasSeeded),
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
