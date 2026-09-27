import type { Expense } from "./types";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export function expensesToCsv(expenses: Expense[]): string {
  const header = ["Date", "Title", "Category", "Amount"];
  const rows = expenses.map((e) => [e.date, e.title, e.category, e.amount.toFixed(2)].map(csvEscape));
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
