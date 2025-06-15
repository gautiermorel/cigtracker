<template>
  <div class="min-h-screen flex flex-col justify-between items-center bg-gradient-to-b from-indigo-100 to-white p-4">
    <div class="w-full max-w-md">
      <div class="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg p-6 text-center border border-white/30">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ count }} cigarettes</h1>
        <p class="text-gray-700 mb-4">
          Dernière : <span v-if="timeSinceLast !== null">{{ timeSinceLast }} min</span>
          <span v-else>—</span>
        </p>
        <button @click="addCigarette" class="text-3xl bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full shadow-lg">+</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const STORAGE_KEY = 'smokeEvents';
const events = ref([]);

onMounted(() => {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  events.value = saved;
});

const addCigarette = () => {
  const now = Date.now();
  events.value.push(now);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.value));
};

// Fonction pour obtenir les bornes de la journée locale entre 2h → 2h
const getLocalDayBounds = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const start = new Date(year, month, day, 2, 0, 0).getTime(); // 2h locale aujourd’hui
  let end = new Date(year, month, day + 1, 2, 0, 0).getTime(); // 2h demain

  if (Date.now() < start) {
    const newStart = new Date(year, month, day - 1, 2, 0, 0).getTime(); // 2h hier
    end = start;
    return { start: newStart, end };
  }

  return { start, end };
};

const filteredEvents = computed(() => {
  const { start, end } = getLocalDayBounds();
  return events.value.filter(ts => ts >= start && ts < end);
});

const count = computed(() => filteredEvents.value.length);

const timeSinceLast = computed(() => {
  if (events.value.length === 0) return null;

  const filtered = filteredEvents.value;
  if (filtered.length === 0) return null;
  const last = filtered[filtered.length - 1];

  return Math.floor((Date.now() - last) / 60000);
});
</script>
