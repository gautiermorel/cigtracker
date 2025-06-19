<template>
  <div class="bg-neutral-100 relative min-h-screen">
    <ProfileAvatar />
    <router-view />
    <BottomNav />
  </div>
</template>

<script setup>
import BottomNav from "./components/BottomNav.vue";
import ProfileAvatar from "./components/ProfileAvatar.vue";
</script>
