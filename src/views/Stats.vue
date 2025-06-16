<template>
  <div class="px-4 py-6 max-w-xl mx-auto bg-neutral-100 min-h-screen pb-28">
    <h2 class="text-2xl font-semibold text-neutral-900 mb-6">Statistiques</h2>

    <div class="bg-white border border-neutral-200 rounded-xl p-4">
      <canvas ref="chartRef" height="200"></canvas>
    </div>

    <div class="mt-6 space-y-2">
      <div class="text-sm text-neutral-700">
        Moyenne semaine dernière :
        <span class="font-medium text-neutral-900">{{ avg(0) }}</span>
      </div>
      <div class="text-sm text-neutral-700">
        Avant-dernière semaine :
        <span class="font-medium text-neutral-900">{{ avg(1) }}</span>
      </div>
      <div class="text-sm text-neutral-700">
        Première semaine :
        <span class="font-medium text-neutral-900">{{ avg(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Chart from "chart.js/auto";

const STORAGE_KEY = "smokeEvents";
const chartRef = ref(null);
const events = ref([]);
const grouped = ref([]);

onMounted(() => {
  events.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const temp = {};
  for (const ts of events.value) {
    const date = new Date(ts).toISOString().split("T")[0];
    temp[date] = (temp[date] || 0) + 1;
  }

  grouped.value = Object.entries(temp)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (chartRef.value) {
    new Chart(chartRef.value, {
      type: "line",
      data: {
        labels: grouped.value.map((entry) => entry.date),
        datasets: [
          {
            label: "Cigarettes / jour",
            data: grouped.value.map((entry) => entry.count),
            borderColor: "#dc2626", // rouge Tailwind
            backgroundColor: "#fecaca",
            tension: 0.25,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            precision: 0,
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }
});

const avg = (weekOffset) => {
  const start = grouped.value.length - 7 * (weekOffset + 1);
  const end = start + 7;
  const slice = grouped.value.slice(start, end);
  if (slice.length === 0) return "0";
  const total = slice.reduce((sum, entry) => sum + entry.count, 0);
  return (total / slice.length).toFixed(2);
};
</script>
