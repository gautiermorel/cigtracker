<template>
  <div
    class="px-4 py-6 max-w-xl mx-auto bg-neutral-100 min-h-screen space-y-8 pb-28"
  >
    <h2 class="text-2xl font-semibold text-neutral-900 mb-6">
      {{ $t("stats") }}
    </h2>

    <!-- Graph #2 -->
    <div class="bg-white rounded-lg shadow pr-[1rem]">
      <h3 class="p-4 text-lg font-medium mb-4">{{ $t("routine") }}</h3>
      <canvas ref="routineChartRef" height="280"></canvas>
    </div>

    <!-- Graph #1 -->
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

const threshold1 = parseInt(localStorage.getItem("threshold1")) || 30;
const threshold2 = parseInt(localStorage.getItem("threshold2")) || 60;
const language = ref(localStorage.getItem("language") || "fr");

Chart.register(
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarElement,
  BarController,
  MatrixController,
  MatrixElement
);

const STORAGE_KEY = "smokeEvents";
const barChartRef = ref(null);
const routineChartRef = ref(null);

onMounted(() => {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const now = new Date();

  const routineStart = new Date();
  routineStart.setDate(now.getDate() - 6);
  routineStart.setHours(4, 0, 0, 0);

  const routineEnd = new Date();
  routineEnd.setDate(now.getDate() + 1);
  routineEnd.setHours(4, 0, 0, 0);

  const filteredDates = raw
    .map((ts) => new Date(ts))
    .filter((d) => d >= routineStart && d < routineEnd)
    .sort((a, b) => a - b);

  // --- Graph #1 (daily counts with 4am-to-4am days) ---
  const barStart = new Date();
  barStart.setDate(now.getDate() - 6);
  barStart.setHours(4, 0, 0, 0);

  const barLabels = [];
  const barCounts = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(barStart);
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString(language === 'fr' ? "fr-FR": "en-EN", {
      weekday: "short",
      day: "2-digit",
    });
    barLabels.push(label);
    barCounts.push(0);
  }

  filteredDates.forEach((d) => {
    const hours = d.getHours() + d.getMinutes() / 60;
    const adjusted = new Date(d);
    if (hours < 4) {
      adjusted.setDate(adjusted.getDate() - 1);
    }

    const index = Math.floor((adjusted - barStart) / (1000 * 60 * 60 * 24));
    if (index >= 0 && index < 7) {
      barCounts[index]++;
    }
  });

  new Chart(barChartRef.value, {
    type: "bar",
    data: {
      labels: barLabels,
      datasets: [
        {
          label: "Cigarettes par jour",
          data: barCounts,
          backgroundColor: "#f87171",
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

  // --- Graph #2 (hourly routine matrix 4am–4am) ---
  const formatLabel = (d) =>
    d.toLocaleDateString(language === 'fr' ? "fr-FR": "en-EN", {
      weekday: "short",
      // day: "2-digit",
      // month: "2-digit",
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

  filteredDates.forEach((eventDate) => {
    const hour = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    let y = hour + minutes / 60;

    const adjustedDate = new Date(eventDate);
    if (y < 4) {
      adjustedDate.setDate(adjustedDate.getDate() - 1);
      y += 24;
    }

    const label = formatLabel(adjustedDate);
    const timestamp = eventDate.getTime();

    let color = "#3b82f6";
    if (lastByDay[label]) {
      const diff = (timestamp - lastByDay[label]) / 60000;
      if (diff < threshold1) color = "#ef4444";
      else if (diff < threshold2) color = "#f97316";
    }
    lastByDay[label] = timestamp;

    routineData.push({
      x: label,
      y,
      v: 1,
      color,
      __sourceDate: eventDate,
    });
  });

  new Chart(routineChartRef.value, {
    type: "matrix",
    data: {
      datasets: [
        {
          label: "Cigarettes",
          data: routineData,
          backgroundColor: (ctx) => ctx.raw.color,
          width: ({ chart }) => (chart.chartArea?.width || 0) / 7 - 3,
          height: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            title: (ctx) =>
              new Date(ctx[0].raw.__sourceDate).toLocaleString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Paris",
              }),
            label: (ctx) => {
              const hour = Math.floor(ctx.raw.y % 24);
              const minute = Math.round((ctx.raw.y % 1) * 60);
              return `${hour.toString().padStart(2, "0")}h${minute
                .toString()
                .padStart(2, "0")} – 1 cigarette`;
            },
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
