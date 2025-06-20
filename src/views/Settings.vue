<template>
  <div
    class="pt-24 max-w-xl mx-auto bg-neutral-100 min-h-screen space-y-8 pb-28"
  >
    <section class="bg-white p-4 rounded-lg shadow mt-6 space-y-4">
      <label
        for="nicotine"
        class="block text-sm font-medium text-neutral-700 mb-2"
      >
        {{ $t("nicotinePerCig") }}
      </label>
      <input
        id="nicotine"
        type="number"
        step="0.1"
        min="0"
        v-model="nicotine"
        class="w-full px-3 py-2 border border-neutral-300 rounded-md"
      />

      <label
        for="price"
        class="block text-sm font-medium text-neutral-700 mt-4 mb-2"
      >
        {{ $t("pricePerCig") }}
      </label>
      <input
        id="price"
        type="number"
        step="0.01"
        min="0"
        v-model="price"
        class="w-full px-3 py-2 border border-neutral-300 rounded-md"
      />

      <label
        for="dailyGoal"
        class="block text-sm font-medium text-neutral-700 mt-4 mb-2"
      >
        {{ $t("objectivePerDay") }}
      </label>
      <input
        id="dailyGoal"
        type="number"
        min="0"
        v-model="dailyGoal"
        class="w-full px-3 py-2 border border-neutral-300 rounded-md"
      />

      <!-- Color thresholds -->
      <label
        for="shortIntervalThreashold"
        class="block text-sm font-medium text-neutral-700 mt-4 mb-2"
      >
        {{ $t("shortIntervalThreashold") }}
      </label>
      <div class="flex">
        <input
          id="shortIntervalThreashold"
          type="number"
          min="1"
          v-model="shortIntervalThreashold"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md mr-2"
        />
        <input
          v-model="colorShortIntervalThreashold"
          type="color"
          class="w-12 h-10 p-0 border border-neutral-300 rounded-md"
        />
      </div>

      <label
        for="mediumIntervalThreashold"
        class="block text-sm font-medium text-neutral-700 mt-4 mb-2"
      >
        {{ $t("mediumIntervalThreashold") }}
      </label>
      <div class="flex">
        <input
          id="mediumIntervalThreashold"
          type="number"
          :min="shortIntervalThreashold"
          v-model="mediumIntervalThreashold"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md mr-2"
        />
        <input
          v-model="colorMediumIntervalThreashold"
          type="color"
          class="w-12 h-10 p-0 border border-neutral-300 rounded-md"
        />
      </div>
      <label
        for="longIntervalThreashold"
        class="block text-sm font-medium text-neutral-700 mt-4 mb-2"
      >
        {{ $t("longIntervalThreashold") }}
      </label>

      <div class="flex">
        <input
          id="longIntervalThreashold"
          type="number"
          disabled
          :value="mediumIntervalThreashold + 1"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md mr-2"
        />
        <input
          v-model="colorLongIntervalThreashold"
          type="color"
          class="w-12 h-10 p-0 border border-neutral-300 rounded-md"
        />
      </div>

      <button
        @click="save"
        :style="{ backgroundColor: themeColor }"
        class="w-full mt-4 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition"
      >
        {{ $t("save") }}
      </button>

      <transition name="fade">
        <p v-if="saved" class="text-sm text-green-600 mt-3">
          {{ $t("saved") }}
        </p>
      </transition>
    </section>

    <!-- Export / Import -->
    <section class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold text-lg text-neutral-800 mb-4">
        {{ $t("export") }} / {{ $t("import") }}
      </h3>

      <div
        class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0"
      >
        <!-- Export Button -->
        <button
          @click="exportData"
          class="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition hover:opacity-90"
        >
          <Upload class="w-5 h-5" />
          {{ $t("export") }}
        </button>

        <!-- Import Button -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0"
        >
          <button
            @click="triggerFileInput"
            class="flex justify-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 items-center gap-2 text-white px-4 py-2 rounded-md font-medium transition hover:opacity-90"
          >
            <Download class="w-5 h-5" />
            {{ $t("import") }}
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept="application/json"
            @change="handleImport"
            class="hidden"
          />
        </div>
      </div>

      <!-- Feedback messages -->
      <transition name="fade">
        <p v-if="importSuccess" class="text-sm text-green-600 mt-3">
          {{ $t("importSuccess") }}
        </p>
      </transition>
      <transition name="fade">
        <p v-if="importError" class="text-sm text-red-600 mt-3">
          {{ $t("error") }} : {{ importError }}
        </p>
      </transition>
    </section>

    <div class="text-sm text-neutral-500 mt-6">
      {{ $t("appVersion") }} : <strong>{{ version }}</strong>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Upload, Download } from "lucide-vue-next";
import { exportData, importDataFromFile } from "../components/ExportImport.js";

const nicotine = ref(parseFloat(localStorage.getItem("nicotinePerCig")) || 4);
const price = ref(parseFloat(localStorage.getItem("pricePerCig")) || 0.5);
const dailyGoal = ref(parseInt(localStorage.getItem("dailyGoal")) || 10);
const shortIntervalThreashold = ref(
  parseInt(localStorage.getItem("shortIntervalThreashold")) || 30
);
const mediumIntervalThreashold = ref(
  parseInt(localStorage.getItem("mediumIntervalThreashold")) || 60
);
const themeColor = ref(localStorage.getItem("themeColor") || "#ef4444");

const colorShortIntervalThreashold = ref(
  localStorage.getItem("colorShortIntervalThreashold") || "#ef4444"
);
const colorMediumIntervalThreashold = ref(
  localStorage.getItem("colorMediumIntervalThreashold") || "#f97316"
);
const colorLongIntervalThreashold = ref(
  localStorage.getItem("colorLongIntervalThreashold") || "#3b82f6"
);

const saved = ref(false);
const importSuccess = ref(false);
const importError = ref("");
const version = ref("");
const fileInputRef = ref(null);

function triggerFileInput() {
  fileInputRef.value?.click();
}

const save = () => {
  localStorage.setItem("nicotinePerCig", nicotine.value);
  localStorage.setItem("pricePerCig", price.value);
  localStorage.setItem("dailyGoal", dailyGoal.value);
  localStorage.setItem(
    "shortIntervalThreashold",
    shortIntervalThreashold.value
  );
  localStorage.setItem(
    "mediumIntervalThreashold",
    mediumIntervalThreashold.value
  );
  localStorage.setItem(
    "colorShortIntervalThreashold",
    colorShortIntervalThreashold.value
  );
  localStorage.setItem(
    "colorMediumIntervalThreashold",
    colorMediumIntervalThreashold.value
  );
  localStorage.setItem(
    "colorLongIntervalThreashold",
    colorLongIntervalThreashold.value
  );
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
};

const handleImport = async (e) => {
  const file = e.target.files[0];
  try {
    await importDataFromFile(file);
    importSuccess.value = true;
    setTimeout(() => {
      importSuccess.value = false;
      location.reload();
    }, 1000);
  } catch (err) {
    importError.value = err.message || "Erreur inconnue.";
    setTimeout(() => (importError.value = ""), 3000);
  }
};

onMounted(async () => {
  const res = await fetch("/version.json");
  if (res.ok) version.value = (await res.json()).version;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
