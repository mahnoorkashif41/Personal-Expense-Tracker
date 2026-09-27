export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  monthlyBudgetDefault: number;
  monthlyBudgets: Record<string, number>;
  currency: "PKR";
}

export interface AppData {
  version: 1;
  expenses: Expense[];
  settings: AppSettings;
  hasSeeded: boolean;
}

export type SortKey = "date" | "amount" | "title";
export type SortDir = "asc" | "desc";

export interface Filters {
  query: string;
  category: Category | "all";
  month: string;
  sortKey: SortKey;
  sortDir: SortDir;
}

export type BudgetStatus = "under" | "near" | "over" | "unset";
