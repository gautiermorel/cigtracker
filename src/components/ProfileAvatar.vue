<!-- src/components/ProfileAvatar.vue -->
<template>
  <router-link to="/settings" class="absolute top-4 right-4">
    <div
      class="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-semibold text-sm"
    >
      {{ initials }}
    </div>
  </router-link>
</template>

<script setup>
import { computed } from "vue";

const userName = localStorage.getItem("userName") || "Moi";

const initials = computed(() => {
  return userName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase();
});
</script>
