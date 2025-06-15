<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Historique</h2>
    <ul>
      <li
        v-for="(entry, index) in orderedHistory"
        :key="entry.date"
        class="mb-2 p-2 border rounded"
      >
        <div class="font-bold">{{ entry.date }}</div>
        <div>Cigarettes : {{ entry.count }}</div>
        <div>Nicotine : {{ (entry.count * nicotinePerCig).toFixed(1) }} mg</div>
        <div>Différence : {{ diff(index) }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const STORAGE_KEY = 'smokeEvents';
const nicotinePerCig = 0.6;

const events = ref([]); // liste brute des timestamps
const grouped = ref([]); // [{ date, count }]

onMounted(() => {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  events.value = raw;

  const temp = {};
  for (const ts of raw) {
    const date = new Date(ts).toISOString().split('T')[0]; // UTC YYYY-MM-DD
    temp[date] = (temp[date] || 0) + 1;
  }

  grouped.value = Object.entries(temp)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
});

const orderedHistory = computed(() => grouped.value);

const diff = (index) => {
  if (index >= grouped.value.length - 1) return '-';
  return grouped.value[index].count - grouped.value[index + 1].count;
};
</script>
