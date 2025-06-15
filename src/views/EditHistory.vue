<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">📖 Historique complet</h2>
    <div v-for="(smokes, date) in orderedHistory" :key="date" class="mb-6">
      <div class="font-semibold text-gray-700 mb-2">{{ date }}</div>
      <ul>
        <li
          v-for="(timestamp, i) in smokes"
          :key="i"
          class="flex justify-between items-center bg-white rounded shadow-sm p-2 mb-2 relative group"
        >
          <input
            type="time"
            class="border rounded px-2 py-1 w-32"
            v-model="timeInputs[date][i]"
            @change="updateTime(date, i, timeInputs[date][i])"
          />
          <button
            @click="removeSmoke(date, i)"
            class="text-red-500 font-semibold hidden group-hover:inline-block"
          >
            Delete
          </button>
        </li>
      </ul>
      <div class="flex gap-2 mt-2">
        <button @click="addSmoke(date)" class="bg-green-500 text-white px-2 py-1 rounded text-sm">
          + Ajouter une cigarette
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { DateTime } from 'luxon';

const STORAGE_KEY = 'smokeEvents';
const events = ref([]); // brute list of UTC timestamps
const grouped = reactive({}); // { [date]: timestamps[] }
const timeInputs = reactive({}); // { [date]: [HH:mm] }

const orderedHistory = computed(() => {
  return Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .reduce((acc, date) => {
      acc[date] = grouped[date];
      return acc;
    }, {});
});

onMounted(() => {
  events.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  for (const timestamp of events.value) {
    const dt = DateTime.fromMillis(timestamp).toLocal();
    const dateKey = dt.toFormat('yyyy-MM-dd');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
      timeInputs[dateKey] = [];
    }
    grouped[dateKey].push(timestamp);
    timeInputs[dateKey].push(dt.toFormat('HH:mm'));
  }
});

const save = () => {
  const updated = [];
  for (const date in grouped) {
    updated.push(...grouped[date]);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  events.value = updated;
};

const addSmoke = (date) => {
  // Crée 12:00 locale → converti en UTC
  const dt = DateTime.fromFormat(date + ' 12:00', 'yyyy-MM-dd HH:mm', { zone: 'local' }).toUTC();
  const ts = dt.toMillis();
  grouped[date].push(ts);
  timeInputs[date].push('12:00');
  save();
};

const removeSmoke = (date, i) => {
  grouped[date].splice(i, 1);
  timeInputs[date].splice(i, 1);
  save();
};

const updateTime = (date, i, time) => {
  const dt = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: 'local' }).toUTC();
  grouped[date][i] = dt.toMillis();
  save();
};
</script>
