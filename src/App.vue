<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Header from "./components/Header.vue";
import BottomNav from "./components/BottomNav.vue";
import { useAppVersion } from "./composables/useAppVersion";

const route = useRoute();
const isSharePage = computed(() => route.path === "/share");

const { version, updateAvailable, reloadApp } = useAppVersion();
</script>

<template>
  <div class="bg-neutral-100 relative min-h-screen">
    <!-- Header caché sur /share -->
    <Header v-if="!isSharePage" />

    <div :class="!isSharePage ? 'px-6' : ''">
      <router-view />
    </div>

    <!-- BottomNav caché sur /share -->
    <BottomNav v-if="!isSharePage" />

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
