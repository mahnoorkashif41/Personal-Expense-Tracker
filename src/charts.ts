import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { store } from "./store";
import { money } from "./format";
import { CATEGORIES, type Category } from "./types";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#5EEAD4",
  Transport: "#7DD3FC",
  Shopping: "#C4B5FD",
  Bills: "#FCD34D",
  Entertainment: "#FDA4AF",
  Health: "#86EFAC",
  Education: "#93C5FD",
  Other: "#D4D4D8",
};

function currencyLabel(value: number) {
  return ` ${money.format(value)}`;
}

const tooltipBase = {
  backgroundColor: "rgba(10, 16, 28, 0.94)",
  borderColor: "rgba(255,255,255,0.08)",
  borderWidth: 1,
  padding: 12,
  titleFont: { family: "Plus Jakarta Sans", size: 12, weight: 600 as const },
  bodyFont: { family: "Plus Jakarta Sans", size: 12 },
  displayColors: true,
};

let lineChart: Chart<"line", number[], string> | null = null;
let doughnutChart: Chart<"doughnut", number[], string> | null = null;
let barChart: Chart<"bar", number[], string> | null = null;

function cssVar(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function initCharts() {
  const grid = "rgba(232, 238, 247, 0.06)";
  const tick = cssVar("--muted", "#8B97B0");
  const accent = cssVar("--accent", "#5EEAD4");

  const lineCanvas = document.querySelector<HTMLCanvasElement>("#trend-chart");
  const pieCanvas = document.querySelector<HTMLCanvasElement>("#category-chart");
  const barCanvas = document.querySelector<HTMLCanvasElement>("#monthly-chart");
  if (!lineCanvas || !pieCanvas || !barCanvas) return;

  lineChart = new Chart(lineCanvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          borderColor: accent,
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return "rgba(94, 234, 212, 0.12)";
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, "rgba(94, 234, 212, 0.28)");
            g.addColorStop(1, "rgba(94, 234, 212, 0.02)");
            return g;
          },
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: accent,
          borderWidth: 2.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipBase,
          callbacks: {
            label: (ctx) => currencyLabel(ctx.parsed.y ?? 0),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tick, maxTicksLimit: 10, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: grid },
          ticks: {
            color: tick,
            font: { size: 11 },
            callback: (v) => (typeof v === "number" ? `${Math.round(v / 1000)}k` : String(v)),
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
    },
  });

  doughnutChart = new Chart(pieCanvas, {
    type: "doughnut",
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipBase,
          callbacks: {
            label: (ctx) => currencyLabel(typeof ctx.parsed === "number" ? ctx.parsed : 0),
          },
        },
      },
    },
  });

  barChart = new Chart(barCanvas, {
    type: "bar",
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipBase,
          callbacks: {
            label: (ctx) => currencyLabel(ctx.parsed.y ?? 0),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tick, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: grid },
          ticks: {
            color: tick,
            font: { size: 11 },
            callback: (v) => (typeof v === "number" ? `${Math.round(v / 1000)}k` : String(v)),
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
    },
  });

  updateCharts();
}

export function updateCharts() {
  if (!lineChart || !doughnutChart || !barChart) return;

  const daily = store.sumByDay();
  lineChart.data.labels = daily.labels;
  lineChart.data.datasets[0].data = daily.values;
  lineChart.update();

  const byCat = store.sumByCategory();
  const labels = CATEGORIES.filter((c) => byCat[c] > 0);
  doughnutChart.data.labels = labels;
  doughnutChart.data.datasets[0].data = labels.map((c) => byCat[c]);
  doughnutChart.data.datasets[0].backgroundColor = labels.map((c) => CATEGORY_COLORS[c]);
  doughnutChart.update();

  const months = store.lastNMonths(6);
  barChart.data.labels = months.labels;
  barChart.data.datasets[0].data = months.values;
  barChart.data.datasets[0].backgroundColor = months.values.map((_, i) =>
    i === months.values.length - 1 ? "rgba(94, 234, 212, 0.9)" : "rgba(125, 211, 252, 0.35)",
  );
  barChart.update();
}
