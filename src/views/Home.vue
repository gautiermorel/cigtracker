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
  if (goal <= 0) {
    nextCigEstimate.value = null;
    return;
  }

  const now = new Date();

  // Local-day window (04:00 → 04:00) and deadline at 00:30 next civil day
  const { start } = getLocalDayBounds();
  const dayStart = new Date(start);
  const deadline = new Date(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    dayStart.getDate() + 1,
    0, 30, 0, 0
  );

  if (now >= deadline) {
    nextCigEstimate.value = null;
    return;
  }

  const filtered = filteredEvents.value;
  const alreadySmoked = filtered.length;

  // If goal already reached
  if (alreadySmoked >= goal) {
    nextCigEstimate.value = null;
    return;
  }

  // Helper to return minutes until a Date, floored and clamped at >= 0
  const minutesUntil = (t) => Math.max(0, Math.floor((t.getTime() - now.getTime()) / 60000));

  if (alreadySmoked === 0) {
    // No cigarette yet today: build a uniform schedule from a virtual anchor to the deadline.
    // We use 07:00 as the "virtual start" of the plan (modifiable if tu veux autre chose).
    const planStart = new Date(
      dayStart.getFullYear(),
      dayStart.getMonth(),
      dayStart.getDate(),
      7, 0, 0, 0
    );

    // Before 07:00, suggest waiting until 07:00 for the first slot
    if (now < planStart) {
      nextCigEstimate.value = minutesUntil(planStart);
      return;
    }

    // Uniform spacing across [planStart, deadline] for 'goal' cigarettes
    const totalMin = Math.max(0, Math.floor((deadline.getTime() - planStart.getTime()) / 60000));
    if (totalMin === 0) {
      nextCigEstimate.value = null;
      return;
    }
    const spacingMin = totalMin / goal;

    // Compute the next planned slot after 'now'
    const elapsedSincePlanStartMin = (now.getTime() - planStart.getTime()) / 60000;
    const slotsPassed = Math.floor(elapsedSincePlanStartMin / spacingMin);
    const nextSlotTime = new Date(planStart.getTime() + (slotsPassed + 1) * spacingMin * 60000);

    // If next slot is beyond deadline, no more reco
    if (nextSlotTime >= deadline) {
      nextCigEstimate.value = null;
      return;
    }

    nextCigEstimate.value = minutesUntil(nextSlotTime);
    return;
  }

  // There is at least one cigarette today: anchor on the last one
  const last = filtered[filtered.length - 1];
  const lastDt = new Date(last);

  // Remaining cigarettes to reach the goal
  const remainingCigs = goal - alreadySmoked;

  // Uniform spacing from LAST cigarette to the deadline, over remainingCigs
  // spacing = (deadline - last) / remainingCigs
  const remainingWindowMin = Math.max(0, Math.floor((deadline.getTime() - lastDt.getTime()) / 60000));
  if (remainingWindowMin === 0) {
    nextCigEstimate.value = null;
    return;
  }

  const spacingMin = remainingWindowMin / remainingCigs;

  // Elapsed since last cigarette
  const elapsedSinceLastMin = (now.getTime() - lastDt.getTime()) / 60000;

  // Recommended wait = spacing - elapsed
  const suggested = Math.floor(spacingMin - elapsedSinceLastMin);

  nextCigEstimate.value = Math.max(0, suggested);
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
