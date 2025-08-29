<template>
  <div class="pt-24 max-w-xl mx-auto bg-neutral-100 min-h-screen space-y-8 pb-28">
    <!-- Window selector -->
    <div class="bg-white rounded-lg shadow p-4 flex items-center gap-3">
      <select
        id="windowSelect"
        class="border rounded px-2 py-1 text-sm"
        v-model.number="windowOffset"
      >
        <option v-for="opt in windowOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Routine matrix -->
    <div class="bg-white rounded-lg shadow pl-[0.5rem] pr-[1rem]">
      <h3 class="p-4 text-lg font-medium mb-4">{{ $t("routine") }} — {{ currentWindowLabel }}</h3>
      <canvas ref="routineChartRef" height="400"></canvas>
    </div>

    <!-- Bar chart with average (consumed days, excluding current day if present) -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-end justify-between mb-4">
        <h3 class="text-lg font-medium">
          {{ $t("last7days") }} — {{ currentWindowLabel }}
        </h3>
        <div class="text-sm text-neutral-600">
          Avg: <span class="font-semibold">{{ averagePerDay }}</span> / day
        </div>
      </div>
      <canvas ref="barChartRef"></canvas>
    </div>

    <!-- Global view (excluding current day) -->
    <section class="bg-white p-4 rounded-lg shadow space-y-2">
      <h3 class="text-lg font-medium">{{ $t("globalView") || "Global view" }}</h3>
      <p class="text-sm text-neutral-600">
        {{ $t("trackingSince") || "Tracking since" }}:
        <strong>{{ firstDayLabel || "-" }}</strong>
      </p>
      <div class="grid grid-cols-1 gap-2 text-sm">
        <div class="flex justify-between">
          <span>{{ $t("totalCigs") || "Total cigarettes" }}</span>
          <strong>{{ totalCigs }}</strong>
        </div>
        <!-- <div class="flex justify-between">
          <span>{{ $t("avgPerDayAllDays") || "Average per day (all days)" }}</span>
          <strong>{{ avgPerDayAllDays }}</strong>
        </div> -->
        <div class="flex justify-between">
          <span>{{ $t("avgPerDayConsumedDays") || "Average per day (consumed days)" }}</span>
          <strong>{{ avgPerDayConsumedDays }}</strong>
        </div>
        <div class="flex justify-between">
          <span>{{ $t("totalSpent") || "Total spent" }}</span>
          <strong>{{ totalSpent }}€</strong>
        </div>
      </div>
      <p v-if="daysCoveredInfo" class="text-xs text-neutral-500">
        {{ daysCoveredInfo }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import {
  Chart,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarElement,
  BarController,
} from "chart.js";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import "chartjs-adapter-date-fns";

/** ---------- Time helpers (04:00 boundary, Europe/Brussels) ---------- */

/** Return a Date pinned to local 04:00 of the adjusted day for the given timestamp */
function getAdjustedDayStart(dateLike) {
  const d = new Date(dateLike);
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  d.setHours(4, 0, 0, 0);
  return d;
}

/** Return "YYYY-MM-DD" using LOCAL components (no UTC/ISO) */
function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Human label for a day column */
function formatDayLabel(dateLike, locale) {
  return new Date(dateLike).toLocaleDateString(locale, {
    weekday: "short",
    timeZone: "Europe/Brussels",
  });
}

/** ---------- Chart plugin ---------- */
const cigaretteIndexPlugin = {
  id: "cigaretteIndexPlugin",
  afterDatasetsDraw(chart) {
    const dataset = chart.data.datasets?.[0];
    if (!dataset || dataset.customType !== "cigarette-matrix") return;

    const meta = chart.getDatasetMeta(0);
    const ctx = chart.ctx;

    dataset.data.forEach((dataPoint, index) => {
      if (
        dataPoint.__cigaretteIndex === undefined ||
        dataPoint.__dailyCount === undefined
      ) return;

      const rect = meta.data[index];
      if (!rect) return;

      const { x, y, width, height } = rect.getProps(["x", "y", "width", "height"], true);
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const label = `${dataPoint.__cigaretteIndex}`;

      ctx.save();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "white";
      ctx.font = "bold 5px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, centerX, centerY);
      ctx.restore();
    });
  },
};

Chart.register(
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarElement,
  BarController,
  MatrixController,
  MatrixElement,
  cigaretteIndexPlugin
);

/** ---------- Settings & state ---------- */
const STORAGE_KEY = "smokeEvents";

const shortIntervalThreashold = parseInt(localStorage.getItem("shortIntervalThreashold")) || 30;
const mediumIntervalThreashold = parseInt(localStorage.getItem("mediumIntervalThreashold")) || 60;

const language = ref(localStorage.getItem("language") || "fr");
const locale = computed(() => (language.value === "fr" ? "fr-FR" : "en-GB"));

const themeColor = ref(localStorage.getItem("themeColor") || "#ef4444");
const colorShortIntervalThreashold = ref(localStorage.getItem("colorShortIntervalThreashold") || "#ef4444");
const colorMediumIntervalThreashold = ref(localStorage.getItem("colorMediumIntervalThreashold") || "#f97316");
const colorLongIntervalThreashold = ref(localStorage.getItem("colorLongIntervalThreashold") || "#3b82f6");

const price = ref(Number(localStorage.getItem("pricePerCig")) || 0.5); // Price per cigarette

const barChartRef = ref(null);
const routineChartRef = ref(null);
let barChartInstance = null;
let routineChartInstance = null;

/** Window selection: 0 = latest 7 days, 1 = previous 7, etc. */
const windowOffset = ref(0);
const windowOptions = ref([]);
const averagePerDay = ref("0.0");
const rawEvents = ref([]);

const currentWindowLabel = computed(() => makeWindowLabel(windowOffset.value));

/** ---------- Window calculation ---------- */
function getWindowRange(offset) {
  const base = getAdjustedDayStart(new Date());
  const endDateExclusive = new Date(base);
  endDateExclusive.setDate(endDateExclusive.getDate() + 1 - 7 * offset);
  const startDate = new Date(endDateExclusive);
  startDate.setDate(startDate.getDate() - 7);
  return { startDate, endDateExclusive };
}

function makeWindowLabel(offset) {
  const { startDate, endDateExclusive } = getWindowRange(offset);
  const endInclusive = new Date(endDateExclusive.getTime() - 1);
  const fmt = (d) =>
    d.toLocaleDateString(locale.value, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Europe/Brussels",
    });
  return `${fmt(startDate)} → ${fmt(endInclusive)}`;
}

/** ---------- Rendering (7-day window) ---------- */
function renderChartsForWindow(offset) {
  const { startDate, endDateExclusive } = getWindowRange(offset);
  const dayMs = 24 * 60 * 60 * 1000;

  // 1) Labels for the 7 columns (start .. start+6)
  const dayStarts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i); // stays at 04:00
    return d;
  });
  const routineLabels = dayStarts.map((d) => formatDayLabel(d, locale.value));

  // 2) Filter events inside [start, end)
  const filteredDates = rawEvents.value
    .map((ts) => new Date(ts))
    .filter((d) => d >= startDate && d < endDateExclusive)
    .sort((a, b) => a - b);

  // 3) Count per adjusted day for bar chart
  const barCounts = new Array(7).fill(0);
  const countByDayKey = {};
  filteredDates.forEach((d) => {
    const dayStart = getAdjustedDayStart(d);
    const dayKey = ymdLocal(dayStart);
    const index = Math.floor((dayStart - startDate) / dayMs);
    if (index >= 0 && index < 7) barCounts[index]++;
    countByDayKey[dayKey] = (countByDayKey[dayKey] || 0) + 1;
  });

  // 4) Average only on days with consumption, EXCLUDING current day if present in the window
  const todayStart = getAdjustedDayStart(new Date());
  let todayIndex = -1;
  if (todayStart >= startDate && todayStart < endDateExclusive) {
    todayIndex = Math.floor((todayStart - startDate) / dayMs);
  }

  let total = 0;
  let consumedDays = 0;
  for (let i = 0; i < 7; i++) {
    if (i === todayIndex) continue;               // skip current day
    total += barCounts[i];
    if (barCounts[i] > 0) consumedDays++;
  }
  averagePerDay.value = consumedDays ? (total / consumedDays).toFixed(1) : "0.0";

  // 5) Bar labels
  const barLabels = dayStarts.map((d) =>
    d.toLocaleDateString(locale.value, { weekday: "short", day: "2-digit", timeZone: "Europe/Brussels" })
  );

  // 6) Routine matrix points
  const routineData = [];
  const lastByLabel = {};
  const counterByDayKey = {};

  filteredDates.forEach((eventDate) => {
    const dayStart = getAdjustedDayStart(eventDate);
    const dayKey = ymdLocal(dayStart);

    // Y position (hours since 04:00, wrap 00:00..03:59 to 24+)
    const h = eventDate.getHours();
    const m = eventDate.getMinutes();
    let y = h + m / 60;
    if (y < 4) y += 24;

    const xLabel = formatDayLabel(dayStart, locale.value);
    const timestamp = eventDate.getTime();
    const dayCount = countByDayKey[dayKey] || 0;
    counterByDayKey[dayKey] = (counterByDayKey[dayKey] || 0) + 1;

    // Color based on interval from previous event of the same day column
    let color = colorLongIntervalThreashold.value;
    if (lastByLabel[xLabel]) {
      const diffMin = (timestamp - lastByLabel[xLabel]) / 60000;
      if (diffMin < shortIntervalThreashold) color = colorShortIntervalThreashold.value;
      else if (diffMin < mediumIntervalThreashold) color = colorMediumIntervalThreashold.value;
    }
    lastByLabel[xLabel] = timestamp;

    routineData.push({
      x: xLabel,
      y,
      v: 1,
      color,
      __sourceDate: eventDate,
      __dailyCount: dayCount,
      __cigaretteIndex: counterByDayKey[dayKey],
    });
  });

  // 7) Create/update bar chart
  if (!barChartInstance) {
    barChartInstance = new Chart(barChartRef.value, {
      type: "bar",
      data: {
        labels: barLabels,
        datasets: [
          { label: "Cigarettes per day", data: barCounts, backgroundColor: themeColor.value },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  } else {
    barChartInstance.data.labels = barLabels;
    barChartInstance.data.datasets[0].data = barCounts;
    barChartInstance.update();
  }

  // 8) Create/update routine matrix
  if (!routineChartInstance) {
    routineChartInstance = new Chart(routineChartRef.value, {
      type: "matrix",
      data: {
        datasets: [
          {
            label: "Cigarettes",
            type: "matrix",
            customType: "cigarette-matrix",
            data: routineData,
            backgroundColor: (ctx) => ctx.raw.color,
            width: ({ chart }) => (chart.chartArea?.width || 0) / 7 - 3,
            height: 7,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        plugins: {
          cigaretteIndexPlugin: {},
          tooltip: {
            callbacks: {
              title: (ctx) =>
                new Date(ctx[0].raw.__sourceDate).toLocaleString(locale.value, {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Brussels",
                }),
              label: () => null,
            },
          },
          legend: { display: false },
        },
        scales: {
          x: { type: "category", labels: routineLabels, offset: true, grid: { display: false } },
          y: {
            type: "linear",
            min: 4,
            max: 28,
            reverse: true,
            ticks: {
              stepSize: 2,
              callback: (v) => `${String(Math.floor(v % 24)).padStart(2, "0")}h`,
            },
          },
        },
      },
    });
  } else {
    routineChartInstance.data.datasets[0].data = routineData;
    routineChartInstance.options.scales.x.labels = routineLabels;
    routineChartInstance.update();
  }
}

/** ---------- Global view (excluding current day) ---------- */
const firstDayStart = computed(() => {
  if (!rawEvents.value.length) return null;
  const minTs = Math.min(...rawEvents.value.map((ts) => new Date(ts).getTime()));
  return getAdjustedDayStart(new Date(minTs));
});

const firstDayLabel = computed(() => {
  if (!firstDayStart.value) return "";
  return firstDayStart.value.toLocaleDateString(locale.value, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
});

/** Exclude current day: count until today@04:00 (exclusive) */
const daysCovered = computed(() => {
  if (!firstDayStart.value) return 0;
  const todayStart = getAdjustedDayStart(new Date());
  return Math.max(1, Math.ceil((todayStart - firstDayStart.value) / (24 * 60 * 60 * 1000)));
});

const countByDayKeyGlobal = computed(() => {
  const map = {};
  const todayStart = getAdjustedDayStart(new Date());
  rawEvents.value.forEach((ts) => {
    const d = new Date(ts);
    if (d >= todayStart) return; // exclude current day
    const dayStart = getAdjustedDayStart(d);
    const key = ymdLocal(dayStart);
    map[key] = (map[key] || 0) + 1;
  });
  return map;
});

const totalCigs = computed(() => Object.values(countByDayKeyGlobal.value).reduce((a, b) => a + b, 0));
const consumedDaysGlobal = computed(() => Object.values(countByDayKeyGlobal.value).filter((n) => n > 0).length);

const avgPerDayAllDays = computed(() => {
  if (!daysCovered.value) return "0.0";
  return (totalCigs.value / daysCovered.value).toFixed(1);
});

const avgPerDayConsumedDays = computed(() => {
  if (!consumedDaysGlobal.value) return "0.0";
  return (totalCigs.value / consumedDaysGlobal.value).toFixed(1);
});

const totalSpent = computed(() => (totalCigs.value * (Number(price.value) || 0)).toFixed(2));

const daysCoveredInfo = computed(() => {
  if (!firstDayStart.value) return "";
  return `${consumedDaysGlobal.value} day(s) covered, excluding current day`;
});

/** ---------- Window options based on history ---------- */
function buildWindowOptions() {
  if (!rawEvents.value.length) {
    windowOptions.value = Array.from({ length: 8 }, (_, i) => ({
      value: i,
      label: i === 0 ? `${makeWindowLabel(0)}` : makeWindowLabel(i),
    }));
    return;
  }

  const earliestTs = Math.min(...rawEvents.value.map((ts) => new Date(ts).getTime()));
  const earliestStart = getAdjustedDayStart(new Date(earliestTs));
  const base = getAdjustedDayStart(new Date());
  const tomorrow4 = new Date(base);
  tomorrow4.setDate(tomorrow4.getDate() + 1);

  const days = Math.max(0, Math.ceil((tomorrow4 - earliestStart) / (1000 * 60 * 60 * 24)));
  const maxWindows = Math.max(1, Math.ceil(days / 7));

  windowOptions.value = Array.from({ length: maxWindows }, (_, i) => ({
    value: i,
    label: i === 0 ? `${makeWindowLabel(0)} (latest)` : makeWindowLabel(i),
  }));
}

/** ---------- Init & watchers ---------- */
onMounted(() => {
  rawEvents.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  price.value = Number(localStorage.getItem("pricePerCig")) || price.value;

  buildWindowOptions();
  renderChartsForWindow(windowOffset.value);

  window.addEventListener("storage", (e) => {
    if (e.key === "pricePerCig") price.value = Number(e.newValue) || 0;
    if (e.key === STORAGE_KEY) {
      rawEvents.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      buildWindowOptions();
      renderChartsForWindow(windowOffset.value);
    }
  });
});

watch(windowOffset, (val) => {
  renderChartsForWindow(val);
});
</script>
