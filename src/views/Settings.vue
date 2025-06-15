<template>
  <div class="px-4 py-6 max-w-xl mx-auto bg-neutral-100 min-h-screen">
    <h2 class="text-2xl font-semibold text-neutral-900 mb-6">Paramètres</h2>

    <div class="mb-4">
      <label
        for="nicotine"
        class="block text-sm font-medium text-neutral-700 mb-1"
      >
        Nicotine par cigarette (mg)
      </label>
      <input
        id="nicotine"
        type="number"
        step="0.1"
        min="0"
        v-model="nicotine"
        class="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <button
      @click="save"
      class="w-full text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition"
    >
      Enregistrer
    </button>

    <transition name="fade">
      <p v-if="saved" class="text-sm text-green-600 mt-3">
        Paramètre sauvegardé ✓
      </p>
    </transition>
  </div>
</template>

<script setup>
import { ref } from "vue";

const nicotine = ref(parseFloat(localStorage.getItem("nicotinePerCig")) || 0.6);
const saved = ref(false);

const save = () => {
  localStorage.setItem("nicotinePerCig", nicotine.value);
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
