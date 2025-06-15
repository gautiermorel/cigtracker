<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Statistiques</h2>
    <canvas id="chart" width="400" height="200"></canvas>
    <div class="mt-4">
      <p>Moyenne semaine dernière : {{ avg(0) }}</p>
      <p>Avant-dernière semaine : {{ avg(1) }}</p>
      <p>Première semaine : {{ avg(2) }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Chart from 'chart.js/auto';

const STORAGE_KEY = 'smokeEvents';
const nicotinePerCig = 0.6;

const events = ref([]);
const grouped = ref([]); // Array of { date, count }

onMounted(() => {
  // Charger les timestamps
  events.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  // Grouper par date UTC
  const temp = {};
  for (const ts of events.value) {
    const date = new Date(ts).toISOString().split('T')[0]; // YYYY-MM-DD UTC
    temp[date] = (temp[date] || 0) + 1;
  }

  // Transformer en tableau trié
  grouped.value = Object.entries(temp)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Créer le graphique
  const ctx = document.getElementById('chart');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: grouped.value.map(entry => entry.date),
      datasets: [{
        label: 'Cigarettes par jour',
        data: grouped.value.map(entry => entry.count),
        borderColor: 'red',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          precision: 0
        }
      }
    }
  });
});

// Calcule la moyenne de la semaine `weekOffset` (0 = dernière semaine, 1 = avant...)
const avg = (weekOffset) => {
  const start = grouped.value.length - 7 * (weekOffset + 1);
  const end = start + 7;
  const slice = grouped.value.slice(start, end);
  if (slice.length === 0) return 0;
  const total = slice.reduce((sum, entry) => sum + entry.count, 0);
  return (total / slice.length).toFixed(2);
};
</script>
