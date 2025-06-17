<template>
  <div class="px-4 py-6 max-w-xl mx-auto bg-neutral-100 min-h-screen pb-28">
    <h2 class="text-2xl font-semibold text-neutral-900 mb-6">Historique</h2>

    <ul class="space-y-4">
      <li
        v-for="(entry, index) in orderedHistory"
        :key="entry.date"
        class="bg-white border border-neutral-200 rounded-xl px-4 py-3"
      >
        <div
          class="flex justify-between items-center cursor-pointer"
          @click="toggle(entry.date)"
        >
          <div>
            <div class="text-base font-medium text-neutral-800">
              {{ entry.date }}
            </div>
            <div class="text-sm text-neutral-700">
              Cigarettes : <strong>{{ entry.count }}</strong>
            </div>
            <div class="text-sm text-neutral-700">
              Nicotine :
              <strong>{{ (entry.count * nicotinePerCig).toFixed(1) }} mg</strong>
            </div>
          </div>
          <div class="text-sm text-neutral-500">
            Diff. : <span :class="diffColor(index)">{{ diff(index) }}</span>
          </div>
        </div>

        <div v-if="expandedDay === entry.date" class="mt-4 space-y-3">
          <ul class="space-y-2">
            <li
              v-for="(item, i) in sorted[entry.date]"
              :key="item.realIndex"
              class="flex items-center justify-between gap-3 border border-neutral-200 rounded-lg px-4 py-2"
            >
              <div class="flex items-center gap-2">
                <span class="text-xs text-neutral-500">{{ i + 1 }}</span>
                <input
                  type="time"
                  class="text-sm text-neutral-800 border border-neutral-300 rounded-md px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  v-model="timeInputs[entry.date][item.realIndex]"
                  @change="
                    debouncedUpdateTime(
                      entry.date,
                      item.realIndex,
                      timeInputs[entry.date][item.realIndex]
                    )
                  "
                />
                <span v-if="i > 0" class="text-xs text-neutral-500">
                  +{{
                    computeDiffMinutes(
                      sorted[entry.date][i - 1].time,
                      item.time,
                      entry.date
                    )
                  }}min
                </span>
                <span v-else class="text-xs text-neutral-400">–</span>
                <span v-if="isNextDay(item.time)" class="text-xs text-blue-500">
                  → {{ getNextDate(entry.date) }}
                </span>
              </div>
              <button
                @click="removeSmoke(entry.date, item.realIndex)"
                class="text-red-500 text-sm hover:underline"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </li>
          </ul>
          <button
            @click="addSmoke(entry.date)"
            class="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
          >
            + Ajouter une cigarette
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { Trash2 } from "lucide-vue-next";
import { DateTime } from "luxon";

const STORAGE_KEY = "smokeEvents";
const nicotinePerCig = 0.6;

const events = ref([]);
const grouped = reactive({});
const timeInputs = reactive({});
const sorted = reactive({});
const expandedDay = ref(null);

const toggle = (date) => {
  expandedDay.value = expandedDay.value === date ? null : date;
};

const getShiftedDateKey = (timestamp) => {
  const dt = DateTime.fromMillis(timestamp).toLocal();
  const shifted = dt < dt.set({ hour: 2 }) ? dt.minus({ days: 1 }) : dt;
  return shifted.toFormat("yyyy-MM-dd");
};

onMounted(() => {
  events.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  for (const timestamp of events.value) {
    const dateKey = getShiftedDateKey(timestamp);
    const dt = DateTime.fromMillis(timestamp).toLocal();

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
      timeInputs[dateKey] = [];
    }

    grouped[dateKey].push(timestamp);
    timeInputs[dateKey].push(dt.toFormat("HH:mm"));
  }

  sortAll();
});

const sortAll = () => {
  for (const date in grouped) {
    const combined = grouped[date].map((ts, i) => {
      const time = timeInputs[date][i];
      const [h, m] = time.split(":").map(Number);
      const isEarly = h < 2;
      return {
        ts,
        time,
        realIndex: i,
        sortKey: isEarly ? h + m / 60 + 24 : h + m / 60,
      };
    });
    sorted[date] = combined.sort((a, b) => a.sortKey - b.sortKey);
  }
};

const orderedHistory = computed(() => {
  return Object.entries(grouped)
    .map(([date, timestamps]) => ({
      date,
      count: timestamps.length,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
});

const diff = (index) => {
  const sortedArr = orderedHistory.value;
  if (index >= sortedArr.length - 1) return "–";
  const delta = sortedArr[index].count - sortedArr[index + 1].count;
  const sign = delta > 0 ? "+" : "";
  return sign + delta;
};

const diffColor = (index) => {
  const val = diff(index);
  if (val === "–") return "text-neutral-400";
  if (+val > 0) return "text-red-500";
  if (+val < 0) return "text-green-600";
  return "text-neutral-500";
};

const computeDiffMinutes = (time1, time2, baseDate) => {
  const dt1 = DateTime.fromFormat(`${baseDate} ${time1}`, "yyyy-MM-dd HH:mm");
  let dt2 = DateTime.fromFormat(`${baseDate} ${time2}`, "yyyy-MM-dd HH:mm");

  if (dt2 < dt1) {
    dt2 = dt2.plus({ days: 1 });
  }

  return Math.round(dt2.diff(dt1, "minutes").minutes);
};

const isNextDay = (time) => {
  const [h] = time.split(":").map(Number);
  return h < 2;
};

const getNextDate = (date) => {
  return DateTime.fromFormat(date, "yyyy-MM-dd")
    .plus({ days: 1 })
    .toFormat("dd/MM/yy");
};

let debounceTimeout = null;
const debouncedUpdateTime = (date, index, time) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    updateTime(date, index, time);
  }, 400);
};

const updateTime = (date, index, time) => {
  const dtLocal = DateTime.fromFormat(`${date} ${time}`, "yyyy-MM-dd HH:mm", {
    zone: "local",
  });
  const ts = dtLocal.toUTC().toMillis();
  const newDateKey = getShiftedDateKey(ts);

  if (newDateKey !== date) {
    const movedTs = grouped[date].splice(index, 1)[0];
    const movedTime = timeInputs[date].splice(index, 1)[0];

    if (!grouped[newDateKey]) {
      grouped[newDateKey] = [];
      timeInputs[newDateKey] = [];
    }

    grouped[newDateKey].push(ts);
    timeInputs[newDateKey].push(dtLocal.toFormat("HH:mm"));

    expandedDay.value = newDateKey;
  } else {
    grouped[date][index] = ts;
    timeInputs[date][index] = dtLocal.toFormat("HH:mm");
  }

  save();
  sortAll();
};

const save = () => {
  const updated = [];
  for (const date in grouped) {
    updated.push(...grouped[date]);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  events.value = updated;
};

const addSmoke = (date) => {
  const now = DateTime.local();
  const dt = now.set({
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
    hour: now.hour,
    minute: now.minute,
  }).toUTC();

  const ts = dt.toMillis();
  const targetDate = getShiftedDateKey(ts);

  if (!grouped[targetDate]) {
    grouped[targetDate] = [];
    timeInputs[targetDate] = [];
  }

  grouped[targetDate].push(ts);
  timeInputs[targetDate].push(now.toFormat("HH:mm"));

  save();
  sortAll();
};

const removeSmoke = (date, index) => {
  const confirmed = confirm("Supprimer cette cigarette ?");
  if (!confirmed) return;

  grouped[date].splice(index, 1);
  timeInputs[date].splice(index, 1);

  if (grouped[date].length === 0) {
    delete grouped[date];
    delete timeInputs[date];
    delete sorted[date];
    if (expandedDay.value === date) expandedDay.value = null;
  }

  save();
  sortAll();
};
</script>
