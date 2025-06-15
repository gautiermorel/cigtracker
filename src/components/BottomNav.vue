<template>
  <nav class="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-md bg-white/30 backdrop-blur-lg rounded-full shadow-md border border-white/20 px-6 py-3 flex justify-between items-center text-gray-800">
    <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="flex flex-col items-center text-sm">
      <span class="text-xl">{{ item.icon }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router';

const navItems = [
  { path: '/', icon: '🏠' },
  { path: '/edit-history', icon: '📋' },
  { path: '/history', icon: '📅' },
  { path: '/stats', icon: '📊' },
  { path: '/settings', icon: '⚙️' }
];
</script>
