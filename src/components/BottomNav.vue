<template>
  <nav
    class="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-16 bg-white/80 border border-neutral-200 rounded-full px-6 flex justify-between items-center backdrop-blur-md"
  >
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="flex items-center justify-center w-10 h-10 relative"
      :class="{
        'text-black': $route.path === item.path,
        'text-neutral-400': $route.path !== item.path,
      }"
    >
      <component :is="item.icon" class="w-6 h-6" />
      <span
        v-if="$route.path === item.path"
        class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full"
      />
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from "vue-router";
import {
  Home,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-vue-next";

const navItems = [
  { path: "/", icon: Home },
  { path: "/logs", icon: ClipboardList },
  { path: "/history", icon: CalendarDays },
  { path: "/stats", icon: BarChart3 },
  { path: "/settings", icon: Settings },
];
</script>
