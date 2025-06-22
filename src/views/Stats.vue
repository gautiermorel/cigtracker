<template>
  <div
    class="pt-24 max-w-xl mx-auto bg-neutral-100 min-h-screen space-y-8 pb-28"
  >
    <div class="bg-white rounded-lg shadow pl-[0.5rem] pr-[1rem]">
      <h3 class="p-4 text-lg font-medium mb-4">{{ $t("routine") }}</h3>
      <canvas ref="routineChartRef" height="400"></canvas>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-medium mb-4">{{ $t("last7days") }}</h3>
      <canvas ref="barChartRef"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  Chart,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarElement,
  BarController,
} from "chart.js";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import "chartjs-adapter-date-fns";

function getAdjustedDateKey(date) {
  const adjusted = new Date(date);
  if (adjusted.getHours() < 4) adjusted.setDate(adjusted.getDate() - 1);
  adjusted.setHours(4, 0, 0, 0);
  return adjusted.toISOString().slice(0, 10);
}

const cigaretteIndexPlugin = {
  id: "cigaretteIndexPlugin",
  afterDatasetsDraw(chart) {
    const dataset = chart.data.datasets[0];
    if (!dataset || dataset.customType !== "cigarette-matrix") return;

    const meta = chart.getDatasetMeta(0);
    const ctx = chart.ctx;

    dataset.data.forEach((dataPoint, index) => {
      if (
        dataPoint.__cigaretteIndex === undefined ||
        dataPoint.__dailyCount === undefined
      )
        return;

      const rect = meta.data[index];
      if (!rect) return;

      const { x, y, width, height } = rect.getProps(
        ["x", "y", "width", "height"],
        true
      );
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = Math.min(width, height) / 2 - 1;
      const label = `${dataPoint.__cigaretteIndex}`;

      ctx.save();
      ctx.beginPath();
      // ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      // ctx.fillStyle = "white";
      // ctx.shadowColor = "rgba(0,0,0,0.15)";
      // ctx.shadowBlur = 2;
      // ctx.fill();
      // ctx.lineWidth = 1;
      // ctx.strokeStyle = "#fff";
      // ctx.stroke();
      // ctx.closePath();

      ctx.shadowColor = "transparent";
      ctx.fillStyle = "white";
      ctx.font = "bold 5px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, centerX, centerY);
      ctx.restore();
    });
  },
};

Chart.register(
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarElement,
  BarController,
  MatrixController,
  MatrixElement,
  cigaretteIndexPlugin
);

const STORAGE_KEY = "smokeEvents";

const shortIntervalThreashold = parseInt(localStorage.getItem("shortIntervalThreashold")) || 30;
const mediumIntervalThreashold = parseInt(localStorage.getItem("mediumIntervalThreashold")) || 60;

const language = ref(localStorage.getItem("language") || "fr");
const themeColor = ref(localStorage.getItem("themeColor") || "#ef4444");
const colorShortIntervalThreashold = ref(localStorage.getItem("colorShortIntervalThreashold") || "#ef4444");
const colorMediumIntervalThreashold = ref(localStorage.getItem("colorMediumIntervalThreashold") || "#f97316");
const colorLongIntervalThreashold = ref(localStorage.getItem("colorLongIntervalThreashold") || "#3b82f6");

const barChartRef = ref(null);
const routineChartRef = ref(null);

onMounted(() => {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const now = new Date();

  // ---- Bar Chart aligned to todayKey - 6 days @ 4am ----
  const todayKey = getAdjustedDateKey(now); // "YYYY-MM-DD"
  const today4h = new Date(todayKey); // Date at today 4:00
  const barStart = new Date(today4h);
  barStart.setDate(barStart.getDate() - 6); // Go 6 days back from today @ 4h

  const barLabels = [];
  const barCounts = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(barStart);
    d.setDate(barStart.getDate() + i);
    const label = d.toLocaleDateString(
      language.value === "fr" ? "fr-FR" : "en-EN",
      { weekday: "short", day: "2-digit" }
    );
    barLabels.push(label);
    barCounts.push(0);
  }

  const routineStart = new Date(barStart); // same start for matrix
  const routineEnd = new Date(today4h);
  routineEnd.setDate(routineEnd.getDate() + 1); // tomorrow @ 4h

  const filteredDates = raw
    .map((ts) => new Date(ts))
    .filter((d) => d >= routineStart && d < routineEnd)
    .sort((a, b) => a - b);

  const countByDayKey = {};
  filteredDates.forEach((d) => {
    const key = getAdjustedDateKey(d);
    const adjusted = new Date(key);
    const index = Math.floor((adjusted - barStart) / (1000 * 60 * 60 * 24));
    if (index >= 0 && index < 7) {
      barCounts[index]++;
    }
    countByDayKey[key] = (countByDayKey[key] || 0) + 1;
  });

  new Chart(barChartRef.value, {
    type: "bar",
    data: {
      labels: barLabels,
      datasets: [
        {
          label: "Cigarettes per day",
          data: barCounts,
          backgroundColor: themeColor.value,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });

  // ---- Routine Matrix ----
  const formatLabel = (d) =>
    d.toLocaleDateString(language.value === "fr" ? "fr-FR" : "en-EN", {
      weekday: "short",
      timeZone: "Europe/Paris",
    });

  const routineLabels = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(routineStart);
    d.setDate(d.getDate() + i);
    routineLabels.push(formatLabel(d));
  }

  const routineData = [];
  const lastByDay = {};
  const counterByDayKey = {};

  filteredDates.forEach((eventDate) => {
    const dayKey = getAdjustedDateKey(eventDate);
    const adjustedDate = new Date(dayKey);

    const hour = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    let y = hour + minutes / 60;
    if (y < 4) y += 24;

    const label = formatLabel(adjustedDate);
    const timestamp = eventDate.getTime();
    const count = countByDayKey[dayKey] || 0;
    counterByDayKey[dayKey] = (counterByDayKey[dayKey] || 0) + 1;

    let color = colorLongIntervalThreashold.value;
    if (lastByDay[label]) {
      const diff = (timestamp - lastByDay[label]) / 60000;
      if (diff < shortIntervalThreashold) color = colorShortIntervalThreashold.value;
      else if (diff < mediumIntervalThreashold) color = colorMediumIntervalThreashold.value;
    }
    lastByDay[label] = timestamp;

    routineData.push({
      x: label,
      y,
      v: 1,
      color,
      __sourceDate: eventDate,
      __dailyCount: count,
      __cigaretteIndex: counterByDayKey[dayKey],
    });
  });

  new Chart(routineChartRef.value, {
    type: "matrix",
    data: {
      datasets: [
        {
          label: "Cigarettes",
          type: "matrix",
          customType: "cigarette-matrix",
          data: routineData,
          backgroundColor: (ctx) => ctx.raw.color,
          width: ({ chart }) => (chart.chartArea?.width || 0) / 7 - 3,
          height: 7,
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        cigaretteIndexPlugin: {},
        tooltip: {
          callbacks: {
            title: (ctx) =>
              new Date(ctx[0].raw.__sourceDate).toLocaleString(
                language.value === "fr" ? "fr-FR" : "en-EN",
                {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Paris",
                }
              ),
            label: () => null,
          },
        },
        legend: { display: false },
      },
      scales: {
        x: {
          type: "category",
          labels: routineLabels,
          offset: true,
          grid: { display: false },
        },
        y: {
          type: "linear",
          min: 4,
          max: 28,
          reverse: true,
          ticks: {
            stepSize: 2,
            callback: (v) => `${String(Math.floor(v % 24)).padStart(2, "0")}h`,
          },
        },
      },
    },
  });
});
</script>
