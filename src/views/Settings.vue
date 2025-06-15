<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Paramètres</h2>
    <label class="block mb-2">
      Nicotine par cigarette (mg) :
      <input type="number" v-model="nicotine" class="border p-1 ml-2" />
    </label>
    <button @click="save" class="bg-blue-500 text-white px-4 py-2 rounded mt-2">Enregistrer</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const nicotine = ref(localStorage.getItem('nicotinePerCig') || 0.6);

const save = () => {
  localStorage.setItem('nicotinePerCig', nicotine.value);
  alert('Paramètre sauvegardé !');
};
</script>
