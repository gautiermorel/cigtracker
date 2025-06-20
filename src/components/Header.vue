<template>
  <header
    class="fixed top-0 left-0 w-full flex items-center bg-neutral-100/80 justify-between px-6 py-6"
  >
    <h2 class="text-2xl font-semibold text-neutral-900">{{ pageTitle }}</h2>

    <router-link to="/profile">
      <div
        :style="{ backgroundColor: themeColor }"
        class="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm"
      >
        {{ initials }}
      </div>
    </router-link>
  </header>
</template>

<script setup>
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const route = useRoute();
const { t } = useI18n();

const userName = localStorage.getItem("userName") || "John Doe";
const themeColor = localStorage.getItem("themeColor") || "#ef4444";

const initials = computed(() =>
  userName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
);

const pageTitle = computed(() => {
  if (!route.meta.key) return "";
  return t(route.meta.key || "home") || "App";
});
</script>
