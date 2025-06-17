<template>
  <div
    class="px-4 py-6 max-w-xl mx-auto bg-neutral-100 min-h-screen space-y-8 pb-28"
  >
    <h2 class="text-2xl font-semibold text-neutral-900 mb-6">Statistiques</h2>

    <!-- Graphique 2 -->
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-medium mb-4">Routine</h3>
      <canvas ref="routineChartRef" height="450"></canvas>
    </div>

    <!-- Graphique 1 -->
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-medium mb-4">7 derniers jours</h3>
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

// Enregistrement des éléments Chart.js
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

  // Récupère les 7 derniers jours
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() - 6);
  cutoff.setHours(0, 0, 0, 0);

  const recentDates = raw
    .map((ts) => new Date(ts))
    .filter((d) => d >= cutoff)
    .sort((a, b) => a.getTime() - b.getTime());

  // === Graphique 1 : histogramme ===
  const barLabels = [];
  const barCounts = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
    });
    barLabels.push(label);
    barCounts.push(0);
  }

  recentDates.forEach((d) => {
    const index = Math.floor((d - cutoff) / (1000 * 60 * 60 * 24));
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

  // === Graphique 2 : heatmap horizontale fine (routine) ===

  const formatLabel = (d) =>
    d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

  const routineLabels = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    routineLabels.push(formatLabel(d));
  }

  const routineData = [];
  let lastByDay = {}; // stocke dernière cigarette pour chaque jour

  recentDates.forEach((d) => {
    const label = formatLabel(d);
    const y = d.getHours() + d.getMinutes() / 60;
    const key = label;

    let color = "#3b82f6"; // bleu par défaut
    const currentTime = d.getTime();

    if (lastByDay[key]) {
      const diff = (currentTime - lastByDay[key]) / 60000; // en minutes
      if (diff < 30) {
        color = "#ef4444"; // rouge
      } else if (diff < 60) {
        color = "#f97316"; // orange
      }
    }

    lastByDay[key] = currentTime;

    routineData.push({
      x: label,
      y,
      v: 1,
      color,
    });
  });

  new Chart(routineChartRef.value, {
    type: "matrix",
    data: {
      datasets: [
        {
          abel: "Cigarettes",
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
            title: (ctx) => `Jour : ${ctx[0].raw.x}`,
            label: (ctx) =>
              `${ctx.raw.y.toFixed(2).replace(".", ":")} — 1 cigarette`,
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
          title: { display: true, text: "" },
        },
        y: {
          type: "linear",
          min: 0,
          max: 24,
          reverse: true,
          ticks: {
            stepSize: 2,
            callback: (v) => `${String(Math.floor(v)).padStart(2, "0")}:00`,
          },
          title: { display: true, text: "" },
        },
      },
    },
  });
});
</script>
