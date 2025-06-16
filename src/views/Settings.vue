<template>
  <div
    class="px-4 py-6 max-w-xl mx-auto bg-neutral-100 min-h-screen space-y-8 pb-28"
  >
    <h2 class="text-2xl font-semibold text-neutral-900">Paramètres</h2>

    <section class="bg-white p-4 rounded-lg shadow">
      <label
        for="nicotine"
        class="block text-sm font-medium text-neutral-700 mb-2"
      >
        Nicotine par cigarette (mg)
      </label>
      <input
        id="nicotine"
        type="number"
        step="0.1"
        min="0"
        v-model="nicotine"
        aria-label="Nicotine par cigarette"
        class="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        @click="save"
        class="w-full mt-4 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition"
      >
        Enregistrer
      </button>

      <transition name="fade">
        <p v-if="saved" class="text-sm text-green-600 mt-3">
          Paramètre sauvegardé ✓
        </p>
      </transition>
    </section>

    <section class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold text-lg text-neutral-800 mb-4">
        Export / Import
      </h3>
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0"
      >
        <button
          @click="exportData"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition"
        >
          Exporter
        </button>

        <label class="cursor-pointer text-sm text-blue-700 underline">
          Importer un fichier JSON
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
          Import réussi ✓
        </p>
      </transition>
      <transition name="fade">
        <p v-if="importError" class="text-sm text-red-600 mt-3">
          Échec de l'import : {{ importError }}
        </p>
      </transition>
    </section>

    <div class="text-sm text-neutral-500 mt-6">
      Version de l’application : <strong>{{ version }}</strong>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { exportData, importDataFromFile } from "../components/ExportImport.js";

const version = ref("");

const nicotine = ref(parseFloat(localStorage.getItem("nicotinePerCig")) || 0.6);
const saved = ref(false);
const importSuccess = ref(false);
const importError = ref("");

const save = () => {
  localStorage.setItem("nicotinePerCig", nicotine.value);
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
};

const handleImport = async (e) => {
  const file = e.target.files[0];
  importSuccess.value = false;
  importError.value = "";
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

// Charger la version depuis package.json (côté client)
onMounted(async () => {
  const res = await fetch("/version.json");
  if (res.ok) {
    const pkg = await res.json();
    version.value = pkg.version;
  }
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
