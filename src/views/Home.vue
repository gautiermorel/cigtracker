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

      <p
        class="text-sm text-neutral-500"
        v-if="
          enableRecommendation &&
          nextCigEstimate !== null &&
          nextCigEstimate !== 0
        "
      >
        <i>
          {{ $t("suggestedWaitTime") }} :
          <span v-if="nextCigEstimate !== null">{{ nextCigEstimate }} min</span>
          <span v-else>—</span>
        </i>
      </p>
      <div class="mb-6"></div>

      <button
        @click="addCigarette"
        :style="{ backgroundColor: themeColor }"
        class="w-full py-3 text-base font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors"
      >
        {{ $t("addCigarette") }}
      </button>
    </div>

    <!-- Bouton de partage discret en bas -->
    <button
      @click="share"
      class="fixed bottom-28 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-full shadow-md hover:shadow-lg transition-shadow text-gray-700"
      aria-label="Partager"
      title="Partager"
    >
      <Upload class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { Upload } from "lucide-vue-next";

const themeColor = localStorage.getItem("themeColor") || "#ef4444";
const enableRecommendation =
  localStorage.getItem("enableRecommendation") !== "false";

const STORAGE_KEY = "smokeEvents";
const events = ref([]);

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

const estimateNextCigarette = () => {
  // Read goal from localStorage, default to 15/day
  const goal = Number(localStorage.getItem("dailyGoal") || 15);

  // If no events ever, we still compute recommendation relative to the ideal plan
  const now = new Date();

  // Special case: between 00:30 and 06:59 → wait until 07:00
  {
    const y = now.getFullYear(),
      m = now.getMonth(),
      d = now.getDate();
    const halfPast = new Date(y, m, d, 0, 30, 0, 0);
    const seven = new Date(y, m, d, 7, 0, 0, 0);
    if (now >= halfPast && now < seven) {
      nextCigEstimate.value = Math.max(
        0,
        Math.floor((seven.getTime() - now.getTime()) / 60000)
      );
      return;
    }
  }

  // Determine the current local-day (04:00 → 04:00) to anchor the ideal plan within it
  const { start } = getLocalDayBounds();
  const dayStart = new Date(start); // 04:00 of the current local-day

  // Build the ideal plan anchored at 07:00 and 00:30 inside this local-day
  const planStart = new Date(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    dayStart.getDate(),
    7,
    0,
    0,
    0
  );
  const planEnd = new Date(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    dayStart.getDate() + 1,
    0,
    30,
    0,
    0
  );

  if (goal <= 0) {
    nextCigEstimate.value = null;
    return;
  }
  if (goal === 1) {
    // One per day: scheduled at 07:00; after that, catch-up (0) until 00:30.
    if (now < planStart) {
      nextCigEstimate.value = Math.max(
        0,
        Math.floor((planStart.getTime() - now.getTime()) / 60000)
      );
    } else if (now >= planEnd) {
      nextCigEstimate.value = null;
    } else {
      nextCigEstimate.value = 0;
    }
    return;
  }

  // Ideal spacing with both ends anchored (e.g., 1050 / (15 - 1) = 75 minutes)
  const totalMin = (planEnd.getTime() - planStart.getTime()) / 60000; // 1050
  const spacingMin = totalMin / (goal - 1);

  // Next planned slot index is exactly the number of cigs already smoked today
  const currentIndex = count.value; // uses your existing computed
  if (currentIndex >= goal) {
    nextCigEstimate.value = null; // goal reached
    return;
  }

  // Target time = planStart + index * spacing (rounded to the nearest minute)
  const target = new Date(
    planStart.getTime() + Math.round(currentIndex * spacingMin) * 60000
  );
  // Guard rounding for the very last slot
  if (currentIndex === goal - 1) target.setTime(planEnd.getTime());

  // Catch-up rule: if the target is in the past → 0; else → minutes until target
  const diffMin = Math.floor((target.getTime() - now.getTime()) / 60000);
  nextCigEstimate.value = Math.max(0, diffMin);
};

const shareUrl = computed(() => {
  const userName = localStorage.getItem("userName") || "John Doe";
  return `${window.location.origin}/share?name=${encodeURIComponent(
    userName
  )}&count=${count.value}&last=${timeSinceLast.value || 0}`;
});

const share = () => {
  if (navigator.share) {
    navigator
      .share({
        title: "CigTracker",
        text: "Voici mon suivi des cigarettes fumées.",
        url: shareUrl.value,
      })
      .catch((err) => {
        // alert("Erreur lors du partage : " + err.message);
      });
  } else {
    navigator.clipboard.writeText(shareUrl.value);
    // alert("Lien copié dans le presse-papiers !");
  }
};

onMounted(() => {
  updateEvents();
  updateTimeSinceLast();
  estimateNextCigarette();
  const interval = setInterval(() => {
    updateTimeSinceLast();
    estimateNextCigarette();
  }, 60000);
  onBeforeUnmount(() => clearInterval(interval));
});

watch(events, estimateNextCigarette);
</script>
