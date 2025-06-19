<template>
  <div class="bg-neutral-100 relative min-h-screen">
    <Header />

    <div class="px-6">
      <router-view />
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import Header from "./components/Header.vue";
import BottomNav from "./components/BottomNav.vue";
</script>
