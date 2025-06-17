<template>
  <div class="bg-neutral-100">
    <router-view />
    <BottomNav />
  </div>
</template>

<script setup>
import BottomNav from "./components/BottomNav.vue";
</script>
