export function icon(name: IconName, className = "icon"): string {
  const path = ICONS[name];
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

export type IconName =
  | "wallet"
  | "plus"
  | "search"
  | "filter"
  | "download"
  | "edit"
  | "trash"
  | "close"
  | "trend"
  | "pie"
  | "calendar"
  | "receipt"
  | "target"
  | "spark"
  | "alert"
  | "check";

const ICONS: Record<IconName, string> = {
  wallet: `<rect x="2.5" y="6.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19"/><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  search: `<circle cx="11" cy="11" r="6.5"/><path d="m16.5 16.5 4 4"/>`,
  filter: `<path d="M4 6h16M7 12h10M10 18h4"/>`,
  download: `<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>`,
  edit: `<path d="M4 20h4l11.2-11.2a2.3 2.3 0 0 0-3.25-3.25L4.75 16.75z"/><path d="m13.5 6.5 3.25 3.25"/>`,
  trash: `<path d="M5 7h14M10 7V5h4v2M8 7l.8 12h6.4L16 7"/>`,
  close: `<path d="m6 6 12 12M18 6 6 18"/>`,
  trend: `<path d="M4 16l5-5 4 3 7-8"/><path d="M15 6h5v5"/>`,
  pie: `<path d="M12 4a8 8 0 1 0 8 8h-8z"/><path d="M12 4v8h8"/>`,
  calendar: `<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>`,
  receipt: `<path d="M7 4h10v16l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4z"/><path d="M9 9h6M9 13h6"/>`,
  target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>`,
  spark: `<path d="M12 3v4M12 17v4M4.9 6.1l2.8 2.8M16.3 15.1l2.8 2.8M3 12h4M17 12h4M4.9 17.9l2.8-2.8M16.3 8.9l2.8-2.8"/>`,
  alert: `<path d="M12 8v5"/><circle cx="12" cy="16.2" r="0.8" fill="currentColor" stroke="none"/><path d="M10.2 4.8 3.4 17.2A2 2 0 0 0 5.2 20h13.6a2 2 0 0 0 1.8-2.8L13.8 4.8a2 2 0 0 0-3.6 0z"/>`,
  check: `<path d="m5 12 5 5 9-10"/>`,
};
