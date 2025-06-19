<template>
  <div class="pt-24 max-w-xl mx-auto bg-neutral-100 min-h-screen space-y-8 pb-28">
    <section class="bg-white p-4 rounded-lg shadow mt-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-2">
          {{ $t("name") }}
        </label>
        <input
          v-model="userName"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-2">
          {{ $t("language") }}
        </label>
        <select
          v-model="language"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>
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
        for="threshold1"
        class="block text-sm font-medium text-neutral-700 mt-4 mb-2"
      >
        {{ $t("orangeThreashold") }}
      </label>
      <input
        id="threshold1"
        type="number"
        min="1"
        v-model="threshold1"
        class="w-full px-3 py-2 border border-neutral-300 rounded-md"
      />

      <label
        for="threshold2"
        class="block text-sm font-medium text-neutral-700 mt-4 mb-2"
      >
        {{ $t("blueThreashold") }}
      </label>
      <input
        id="threshold2"
        type="number"
        min="1"
        v-model="threshold2"
        class="w-full px-3 py-2 border border-neutral-300 rounded-md"
      />

      <button
        @click="save"
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
        <button
          @click="exportData"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition"
        >
          {{ $t("export") }}
        </button>
        <label class="cursor-pointer text-sm text-blue-700 underline">
          {{ $t("import") }}
          <input
            type="file"
            accept="application/json"
            @change="handleImport"
            class="hidden"
          />
        </label>
      </div>

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
import { useI18n } from "vue-i18n";
import { exportData, importDataFromFile } from "../components/ExportImport.js";

const nicotine = ref(parseFloat(localStorage.getItem("nicotinePerCig")) || 4);
const price = ref(parseFloat(localStorage.getItem("pricePerCig")) || 0.5);
const dailyGoal = ref(parseInt(localStorage.getItem("dailyGoal")) || 10);
const threshold1 = ref(parseInt(localStorage.getItem("threshold1")) || 30);
const threshold2 = ref(parseInt(localStorage.getItem("threshold2")) || 60);

const saved = ref(false);
const importSuccess = ref(false);
const importError = ref("");
const version = ref("");

const { locale } = useI18n();
const userName = ref(localStorage.getItem("userName") || "John Doe");
const language = ref(localStorage.getItem("language") || "fr");

const save = () => {
  localStorage.setItem("nicotinePerCig", nicotine.value);
  localStorage.setItem("pricePerCig", price.value);
  localStorage.setItem("dailyGoal", dailyGoal.value);
  localStorage.setItem("threshold1", threshold1.value);
  localStorage.setItem("threshold2", threshold2.value);
  localStorage.setItem("userName", userName.value);
  localStorage.setItem("language", language.value);
  locale.value = language.value;
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
