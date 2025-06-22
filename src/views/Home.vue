<template>
  <div
    class="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-10"
  >
    <div
      class="w-full max-w-sm bg-white rounded-xl border border-neutral-200 p-6 text-center"
    >
      <h1 class="text-3xl font-semibold text-neutral-900 mb-1 lowercase">
        {{ count }} {{ $t("cigarette") }}<span v-if="count > 1">s</span>
      </h1>

      <p class="text-sm text-neutral-500 mb-1">
        {{ $t("lastCigarette") }} :
        <span v-if="timeSinceLast !== null">{{ timeSinceLast }} min</span>
        <span v-else>—</span>
      </p>

      <p class="text-sm text-neutral-500 mb-6">
        {{ $t("suggestedWaitTime") }} :
        <span v-if="nextCigEstimate !== null">{{ nextCigEstimate }} min</span>
        <span v-else>—</span>
      </p>

      <button
        @click="addCigarette"
        :style="{ backgroundColor: themeColor }"
        class="w-full py-3 text-base font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors"
      >
        {{ $t("addCigarette") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

const themeColor = localStorage.getItem("themeColor") || "#ef4444";

const STORAGE_KEY = "smokeEvents";
const events = ref([]);
const pricePerCig = parseFloat(localStorage.getItem("pricePerCig")) || 0.5;

const updateEvents = () => {
  events.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
};

const addCigarette = () => {
  const now = Date.now();
  events.value.push(now);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.value));
  updateTimeSinceLast();
  estimateNextCigarette();
};

const getLocalDayBounds = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const start = new Date(year, month, day, 4, 0, 0).getTime();
  let end = new Date(year, month, day + 1, 4, 0, 0).getTime();

  if (Date.now() < start) {
    const newStart = new Date(year, month, day - 1, 4, 0, 0).getTime();
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
const timeSinceLast = ref(null);

const updateTimeSinceLast = () => {
  const filtered = filteredEvents.value;
  if (filtered.length === 0) {
    timeSinceLast.value = null;
  } else {
    const last = filtered[filtered.length - 1];
    timeSinceLast.value = Math.floor((Date.now() - last) / 60000);
  }
};

const nextCigEstimate = ref(null);

// Estimation basée sur l’heure moyenne de la cigarette suivante
const estimateNextCigarette = () => {
  const allDates = events.value.map((ts) => new Date(ts));
  if (allDates.length === 0) {
    nextCigEstimate.value = null;
    return;
  }

  const now = new Date();
  const todayKey = getAdjustedDateKey(now);
  const grouped = {};

  allDates.forEach((date) => {
    const key = getAdjustedDateKey(date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(date);
  });

  // Trier les événements dans chaque jour
  for (const day of Object.keys(grouped)) {
    grouped[day].sort((a, b) => a - b);
  }

  const todayEvents = grouped[todayKey] || [];
  const currentIndex = todayEvents.length;

  if (currentIndex === 0) {
    nextCigEstimate.value = null;
    return;
  }

  const lastCigDate = todayEvents[todayEvents.length - 1];
  const lastTime = lastCigDate.getHours() + lastCigDate.getMinutes() / 60;

  const nextCigTimes = [];

  // Chercher l’heure moyenne de la cigarette suivante (même index)
  for (const [key, events] of Object.entries(grouped)) {
    if (key === todayKey) continue;
    if (events.length > currentIndex) {
      const d = events[currentIndex]; // prochaine cigarette dans ce jour-là
      const t = d.getHours() + d.getMinutes() / 60;
      nextCigTimes.push(t);
    }
  }

  if (nextCigTimes.length === 0) {
    nextCigEstimate.value = null;
    return;
  }

  const avgTime = nextCigTimes.reduce((a, b) => a + b, 0) / nextCigTimes.length;
  const predictedCigDate = new Date(lastCigDate);
  const hour = Math.floor(avgTime);
  const minute = Math.round((avgTime - hour) * 60);
  predictedCigDate.setHours(hour, minute, 0, 0);

  const timeDiffMinutes = Math.round(
    (predictedCigDate.getTime() - now.getTime()) / 60000
  );

  // Temps déjà écoulé depuis la dernière
  const elapsedSinceLast = Math.floor(
    (now.getTime() - lastCigDate.getTime()) / 60000
  );
  const remainingMin = Math.max(timeDiffMinutes, 60 - elapsedSinceLast);

  nextCigEstimate.value = remainingMin > 0 ? remainingMin : null;
};

// Aligne les jours à 4h du matin
function getAdjustedDateKey(date) {
  const adjusted = new Date(date);
  if (adjusted.getHours() < 4) adjusted.setDate(adjusted.getDate() - 1);
  adjusted.setHours(4, 0, 0, 0);
  return adjusted.toISOString().slice(0, 10);
}

onMounted(() => {
  updateEvents();
  updateTimeSinceLast();
  estimateNextCigarette();
  const interval = setInterval(updateTimeSinceLast, 60000);
  onBeforeUnmount(() => clearInterval(interval));
});

watch(events, estimateNextCigarette);
</script>
