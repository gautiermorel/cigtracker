<template>
  <div class="px-4 py-6 max-w-xl mx-auto bg-neutral-100 min-h-screen">
    <h2 class="text-2xl font-semibold text-neutral-900 mb-6">Historique</h2>

    <ul class="space-y-4">
      <li
        v-for="(entry, index) in orderedHistory"
        :key="entry.date"
        class="bg-white border border-neutral-200 rounded-xl px-4 py-3"
      >
        <div class="flex justify-between items-center mb-1">
          <div class="text-base font-medium text-neutral-800">{{ entry.date }}</div>
          <div class="text-sm text-neutral-500">Diff. : <span :class="diffColor(index)">{{ diff(index) }}</span></div>
        </div>
        <div class="text-sm text-neutral-700">Cigarettes : <strong>{{ entry.count }}</strong></div>
        <div class="text-sm text-neutral-700">Nicotine : <strong>{{ (entry.count * nicotinePerCig).toFixed(1) }} mg</strong></div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'smokeEvents'
const nicotinePerCig = 0.6

const events = ref([])
const grouped = ref([])

onMounted(() => {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  events.value = raw

  const temp = {}
  for (const ts of raw) {
    const date = new Date(ts).toISOString().split('T')[0]
    temp[date] = (temp[date] || 0) + 1
  }

  grouped.value = Object.entries(temp)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const orderedHistory = computed(() => grouped.value)

const diff = (index) => {
  if (index >= grouped.value.length - 1) return '–'
  const delta = grouped.value[index].count - grouped.value[index + 1].count
  const sign = delta > 0 ? '+' : ''
  return sign + delta
}

const diffColor = (index) => {
  const val = diff(index)
  if (val === '–') return 'text-neutral-400'
  if (+val > 0) return 'text-red-500'
  if (+val < 0) return 'text-green-600'
  return 'text-neutral-500'
}
</script>
