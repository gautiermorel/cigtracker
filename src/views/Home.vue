<template>
  <div
    class="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-10"
  >
    <div
      class="w-full max-w-sm bg-white rounded-xl border border-neutral-200 p-6 text-center"
    >
      <h1 class="text-3xl font-semibold text-neutral-900 mb-1">
        {{ count }} cigarette<span v-if="count > 1">s</span>
      </h1>

      <p class="text-sm text-neutral-500 mb-6">
        Dernière :
        <span v-if="timeSinceLast !== null">{{ timeSinceLast }} min</span>
        <span v-else>—</span>
      </p>

      <button
        @click="addCigarette"
        class="w-full py-3 text-base font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors"
      >
        Ajouter une cigarette
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const STORAGE_KEY = "smokeEvents";
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

const getLocalDayBounds = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const start = new Date(year, month, day, 2, 0, 0).getTime();
  let end = new Date(year, month, day + 1, 2, 0, 0).getTime();

  if (Date.now() < start) {
    const newStart = new Date(year, month, day - 1, 2, 0, 0).getTime();
    end = start;
    return { start: newStart, end };
  }

  return { start, end };
};

const filteredEvents = computed(() => {
  const { start, end } = getLocalDayBounds();
  return events.value.filter((ts) => ts >= start && ts < end);
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
