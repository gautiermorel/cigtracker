<template>
  <div
    class="pt-24 max-w-xl mx-auto min-h-screen space-y-8 pb-28 transition-colors"
  >
    <section class="bg-white p-4 rounded-lg shadow mt-6 space-y-4">
      <!-- User name input -->
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-2">
          {{ $t("name") }}
        </label>
        <input
          v-model="userName"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md"
        />
      </div>

      <!-- Language selection -->
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

      <!-- Theme color picker -->
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-2">
          {{ $t("themeColor") }}
        </label>
        <input
          v-model="themeColor"
          type="color"
          class="w-12 h-10 p-0 border border-neutral-300 rounded-md"
        />
      </div>

      <!-- Save button -->
      <button
        @click="save"
        :style="{ backgroundColor: themeColor }"
        class="w-full mt-4 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition"
      >
        {{ $t("save") }}
      </button>

      <!-- Saved confirmation -->
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
            class="flex justify-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 items-center gap-2 px-4 py-2 rounded-md font-medium transition hover:opacity-90"
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
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Upload, Download } from "lucide-vue-next";
import { exportData, importDataFromFile } from "../components/ExportImport.js";

const { locale } = useI18n();

const saved = ref(false);
const userName = ref(localStorage.getItem("userName") || "John Doe");
const language = ref(localStorage.getItem("language") || "fr");
const themeColor = ref(localStorage.getItem("themeColor") || "#ef4444");

const importSuccess = ref(false);
const importError = ref("");
const fileInputRef = ref(null);

function triggerFileInput() {
  fileInputRef.value?.click();
}

watch(language, (newLang) => {
  locale.value = newLang;
});

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

const save = () => {
  localStorage.setItem("userName", userName.value);
  localStorage.setItem("language", language.value);
  localStorage.setItem("themeColor", themeColor.value);
  locale.value = language.value;
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
};
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
