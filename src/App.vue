<template>
  <div class="bg-neutral-100 relative min-h-screen">
    <Header />

    <div class="px-6">
      <router-view />
    </div>

    <BottomNav />

    <transition name="fade">
      <div
        v-if="updateAvailable"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div
          class="bg-white rounded-lg shadow-xl w-[90%] max-w-md p-6 space-y-4 text-center"
        >
          <p class="text-sm text-neutral-600">
            {{ $t("newVersionAvailable") }}
            <span v-if="version">({{ version }})</span>
          </p>

          <div class="flex justify-center mt-4">
            <button
              @click="reloadApp"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
            >
              {{ $t("refresh") }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import Header from "./components/Header.vue";
import BottomNav from "./components/BottomNav.vue";
import { useAppVersion } from "./composables/useAppVersion";

const { version, updateAvailable, reloadApp } = useAppVersion();
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
