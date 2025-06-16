<template>
  <div
    v-touch:swipe.left="onSwipeLeft"
    v-touch:swipe.right="onSwipeRight"
    v-touch-options="{ touchSensitivity: 5 }"
    class="bg-neutral-100"
  >
    <transition :name="swipeDirection" mode="out-in">
      <router-view :key="route.fullPath" class="flex-grow" />
    </transition>
    <BottomNav />
  </div>
</template>

<script setup>
import BottomNav from "./components/BottomNav.vue";
import { useRoute, useRouter, onBeforeRouteUpdate } from "vue-router";
import { ref, watch } from "vue";

const router = useRouter();
const route = useRoute();

const swipeDirection = ref(""); // empty string = no transition by default
const routes = ["/", "/history", "/stats", "/settings"];
let isSwipeNav = false;

const getIndex = () => routes.indexOf(route.path);

const onSwipeLeft = () => {
  const i = getIndex();
  if (i < routes.length - 1) {
    swipeDirection.value = "slide-left";
    isSwipeNav = true;
    router.push(routes[i + 1]);
  }
};

const onSwipeRight = () => {
  const i = getIndex();
  if (i > 0) {
    swipeDirection.value = "slide-right";
    isSwipeNav = true;
    router.push(routes[i - 1]);
  }
};

// Si la navigation ne vient pas d'un swipe : aucune transition
watch(
  () => route.fullPath,
  () => {
    if (!isSwipeNav) {
      swipeDirection.value = "";
    }
    isSwipeNav = false;
  }
);
</script>

<style scoped>
.slide-left-enter-active,
.slide-right-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-left-leave-active,
.slide-right-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-left-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.slide-left-leave-to,
.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
