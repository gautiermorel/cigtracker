<template>
  <div class="px-4 py-6 max-w-xl mx-auto bg-neutral-100 min-h-screen">
    <h2 class="text-2xl font-semibold text-neutral-900 mb-6">Logs</h2>

    <div v-for="(smokes, date) in orderedHistory" :key="date" class="mb-8">
      <div class="text-base font-medium text-neutral-700 mb-3">{{ date }}</div>

      <ul class="space-y-2">
        <li
          v-for="(_timestamp, i) in smokes"
          :key="i"
          class="flex items-center justify-between gap-3 border border-neutral-200 rounded-lg px-4 py-2 bg-white"
        >
          <input
            type="time"
            class="text-sm text-neutral-800 border border-neutral-300 rounded-md px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
            v-model="timeInputs[date][i]"
            @change="updateTime(date, i, timeInputs[date][i])"
          />
          <button
            @click="removeSmoke(date, i)"
            class="text-red-500 text-sm hover:underline"
          >
            Supprimer
          </button>
        </li>
      </ul>

      <div class="mt-4">
        <button
          @click="addSmoke(date)"
          class="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
        >
          + Ajouter une cigarette
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { DateTime } from 'luxon'

const STORAGE_KEY = 'smokeEvents'
const events = ref([])
const grouped = reactive({})
const timeInputs = reactive({})

const orderedHistory = computed(() => {
  return Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .reduce((acc, date) => {
      acc[date] = grouped[date]
      return acc
    }, {})
})

onMounted(() => {
  events.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []

  for (const timestamp of events.value) {
    const dt = DateTime.fromMillis(timestamp).toLocal()
    const dateKey = dt.toFormat('yyyy-MM-dd')
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
      timeInputs[dateKey] = []
    }
    grouped[dateKey].push(timestamp)
    timeInputs[dateKey].push(dt.toFormat('HH:mm'))
  }
})

const save = () => {
  const updated = []
  for (const date in grouped) {
    updated.push(...grouped[date])
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  events.value = updated
}

const addSmoke = (date) => {
  const dt = DateTime.fromFormat(date + ' 12:00', 'yyyy-MM-dd HH:mm', { zone: 'local' }).toUTC()
  const ts = dt.toMillis()
  grouped[date].push(ts)
  timeInputs[date].push('12:00')
  save()
}

const removeSmoke = (date, i) => {
  grouped[date].splice(i, 1)
  timeInputs[date].splice(i, 1)
  save()
}

const updateTime = (date, i, time) => {
  const dt = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: 'local' }).toUTC()
  grouped[date][i] = dt.toMillis()
  save()
}
</script>
